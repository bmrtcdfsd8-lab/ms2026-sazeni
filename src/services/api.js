// All data comes from live APIs only — no mock fallback.
// football-data.org  → proxied via /api/football  (X-Auth-Token added server-side by Vite proxy)
// the-odds-api.com   → proxied via /api/odds      (apiKey passed as query param from client)
//
// Rate-limit strategy: free tier = 10 req/min.
// We make exactly ONE football-data.org call per refresh (matches only).
// Standings are computed client-side from finished match results.
// Both responses are cached in localStorage with a 5-minute TTL.

import { getFlagUrl, STAGE_LABELS } from '@/data/ms2026'
import { apiCache } from './cache'

// Clamp raw bookmaker prices to minimum 1.01 before they reach the store
function clamp(v) {
  const n = parseFloat(v)
  return isFinite(n) && n >= 1.01 ? parseFloat(n.toFixed(2)) : 1.01
}

const ODDS_KEY = import.meta.env.VITE_ODDS_API_KEY || ''
const CACHE_KEY_MATCHES = 'wc2026_matches'
const CACHE_KEY_ODDS    = 'wc2026_odds'

// ─── Low-level fetch helpers ───────────────────────────────────────────────────

async function footballGet(path, params = {}) {
  const url = new URL('/api/football' + path, window.location.origin)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  const res = await fetch(url.toString())
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`football-data.org ${res.status}: ${text.slice(0, 120)}`)
  }
  return res.json()
}

async function oddsGet(path, params = {}) {
  const url = new URL('/api/odds' + path, window.location.origin)
  url.searchParams.set('apiKey', ODDS_KEY)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  const res = await fetch(url.toString())
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`the-odds-api.com ${res.status}: ${text.slice(0, 120)}`)
  }
  return res.json()
}

// ─── Client-side standings from match data (saves 1 API call per refresh) ─────

function computeStandingsFromMatches(matches) {
  const groups = {}

  // Collect all teams from every group-stage match (including TIMED/SCHEDULED)
  matches.filter((m) => m.stage === 'GROUP_STAGE' && m.group).forEach((m) => {
    const g = m.group
    if (!groups[g]) groups[g] = {}
    for (const team of [m.homeTeam, m.awayTeam]) {
      if (team?.id && !groups[g][team.id]) {
        groups[g][team.id] = {
          team,
          playedGames: 0, won: 0, draw: 0, lost: 0,
          points: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0,
        }
      }
    }
  })

  // Accumulate results from FINISHED matches
  matches
    .filter((m) => m.stage === 'GROUP_STAGE' && m.status === 'FINISHED' && m.score && m.group)
    .forEach((m) => {
      const h = groups[m.group]?.[m.homeTeam?.id]
      const a = groups[m.group]?.[m.awayTeam?.id]
      if (!h || !a) return

      const { home, away } = m.score
      h.playedGames++; a.playedGames++
      h.goalsFor += home;  h.goalsAgainst += away;  h.goalDifference += home - away
      a.goalsFor += away;  a.goalsAgainst += home;  a.goalDifference += away - home

      if (home > away)       { h.won++;  h.points += 3; a.lost++ }
      else if (home === away) { h.draw++; h.points++;    a.draw++; a.points++ }
      else                   { a.won++;  a.points += 3; h.lost++ }
    })

  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, teamsMap]) => ({
      group,
      table: Object.values(teamsMap)
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points
          if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
          return b.goalsFor - a.goalsFor
        })
        .map((row, idx) => ({ ...row, position: idx + 1 })),
    }))
}

// ─── Normalisers ──────────────────────────────────────────────────────────────

function normaliseTeam(t) {
  if (!t) return null
  const tla = t.tla || t.shortName || t.name
  return {
    id: tla,
    name: t.name,
    tla,
    flag: t.crest || getFlagUrl(tla),
    crest: t.crest || null,
  }
}

function normaliseStage(stage) {
  if (!stage) return 'GROUP_STAGE'
  const map = {
    GROUP_STAGE: 'GROUP_STAGE',
    LAST_32: 'LAST_32', ROUND_OF_32: 'LAST_32',
    LAST_16: 'LAST_16', ROUND_OF_16: 'LAST_16',
    QUARTER_FINALS: 'QUARTER_FINALS', QUARTER_FINAL: 'QUARTER_FINALS',
    SEMI_FINALS: 'SEMI_FINALS', SEMI_FINAL: 'SEMI_FINALS',
    THIRD_PLACE: 'THIRD_PLACE',
    FINAL: 'FINAL',
  }
  return map[stage] || stage
}

function normaliseMatches(raw) {
  return raw.map((m) => {
    const stage = normaliseStage(m.stage)
    const group = (m.group || '').replace(/^GROUP_/, '') || null
    const ft = m.score?.fullTime
    const hasScore = ft && (ft.home !== null || ft.away !== null)
    return {
      id: String(m.id),
      stage,
      group,
      homeTeam: normaliseTeam(m.homeTeam),
      awayTeam: normaliseTeam(m.awayTeam),
      date: m.utcDate,
      venue: m.venue || null,
      status: m.status,
      score: hasScore ? { home: ft.home ?? 0, away: ft.away ?? 0 } : null,
      minute: m.minute ?? null,
      matchday: m.matchday ?? null,
      stageLabel: STAGE_LABELS[stage] || stage,
    }
  })
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Load all tournament data in a single HTTP request.
 * Uses localStorage cache (5 min TTL) unless force=true.
 * Returns { matches, standings, fromCache, cacheAge }.
 */
export async function loadTournamentData(force = false) {
  const cached = apiCache.get(CACHE_KEY_MATCHES)
  if (!force && cached.hit) {
    return { fromCache: true, cacheAge: cached.age, ...cached.data }
  }

  const raw = await footballGet('/competitions/WC/matches')
  const matches  = normaliseMatches(raw.matches || [])
  const standings = computeStandingsFromMatches(matches)

  apiCache.set(CACHE_KEY_MATCHES, { matches, standings })
  return { fromCache: false, cacheAge: 0, matches, standings }
}

/**
 * Load odds from the-odds-api.com.
 * Uses localStorage cache (5 min TTL) unless force=true.
 * Returns { oddsMap, fromCache }.
 */
export async function loadOdds(matches, force = false) {
  const cached = apiCache.get(CACHE_KEY_ODDS)
  if (!force && cached.hit) {
    return { fromCache: true, oddsMap: cached.data }
  }

  const raw = await oddsGet('/sports/soccer_fifa_world_cup/odds', {
    regions: 'eu',
    markets: 'h2h,totals',
    oddsFormat: 'decimal',
  })
  const oddsMap = buildOddsMap(matches, Array.isArray(raw) ? raw : [])
  apiCache.set(CACHE_KEY_ODDS, oddsMap)
  return { fromCache: false, oddsMap }
}

/** Returns the age in ms of the cached match data, or null if no cache. */
export function getMatchCacheAge() {
  const { age } = apiCache.get(CACHE_KEY_MATCHES)
  return Number.isFinite(age) ? age : null
}

/** Clear both caches (e.g. from settings page). */
export function clearApiCache() {
  apiCache.clear()
}

// ─── Odds map builder ─────────────────────────────────────────────────────────

export function buildOddsMap(matches, oddsEvents) {
  const map = {}
  if (!oddsEvents?.length) return map

  oddsEvents.forEach((ev) => {
    const evTime = new Date(ev.commence_time).getTime()
    const match = matches.find((m) => {
      const mTime = new Date(m.date).getTime()
      if (Math.abs(mTime - evTime) >= 90 * 60 * 1000) return false
      const home  = m.homeTeam?.name?.toLowerCase() || ''
      const away  = m.awayTeam?.name?.toLowerCase() || ''
      const evH   = ev.home_team?.toLowerCase() || ''
      const evA   = ev.away_team?.toLowerCase() || ''
      return (
        (home.includes(evH.split(' ')[0]) || evH.includes(home.split(' ')[0])) &&
        (away.includes(evA.split(' ')[0]) || evA.includes(away.split(' ')[0]))
      )
    })
    if (!match) return

    const bookmaker = ev.bookmakers?.[0]
    if (!bookmaker) return

    const h2h    = bookmaker.markets?.find((mk) => mk.key === 'h2h')
    const totals = bookmaker.markets?.find((mk) => mk.key === 'totals')
    const entry  = {}

    if (h2h) {
      const byName = {}
      h2h.outcomes.forEach((o) => { byName[o.name] = o.price })
      const homePrice = byName[ev.home_team]
      const awayPrice = byName[ev.away_team]
      const drawPrice = byName['Draw']
      if (homePrice && awayPrice) {
        entry.MATCH_WINNER = {
          home: clamp(homePrice),
          draw: drawPrice ? clamp(drawPrice) : null,
          away: clamp(awayPrice),
        }
      }
    }

    if (totals) {
      const ouMap = {}
      totals.outcomes.forEach((o) => {
        ouMap[`${o.name === 'Over' ? 'over' : 'under'}_${o.point}`] = clamp(o.price)
      })
      if (Object.keys(ouMap).length) entry.OVER_UNDER = ouMap
    }

    if (Object.keys(entry).length) map[match.id] = entry
  })

  return map
}

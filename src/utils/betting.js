import { getTeamPlayers } from '@/data/ms2026'

// ─── Seeded RNG ───────────────────────────────────────────────────────────────
// Deterministic per-match — stable across re-renders and page reloads.

function fnv1a(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619) >>> 0
  }
  return h || 1
}

function makeRng(matchId, ns) {
  let s = fnv1a(`${ns}_${matchId}`)
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0
    return s / 4294967296
  }
}

// rand(rng, min, max) → 2-decimal float in [min, max]
function rand(rng, min, max) {
  return parseFloat((min + rng() * (max - min)).toFixed(2))
}

// ─── Odds validation ──────────────────────────────────────────────────────────
// Clamp ANY odds value (generated or from API) to minimum 1.01.

function clamp(v) {
  const n = parseFloat(v)
  return isFinite(n) && n >= 1.01 ? parseFloat(n.toFixed(2)) : 1.01
}

// Deep-clamp an odds object returned by the-odds-api.com
export function sanitiseApiOdds(apiOdds) {
  if (!apiOdds || typeof apiOdds !== 'object') return {}
  const out = {}
  for (const [market, values] of Object.entries(apiOdds)) {
    if (values && typeof values === 'object') {
      out[market] = {}
      for (const [k, v] of Object.entries(values)) {
        out[market][k] = clamp(v)
      }
    }
  }
  return out
}

// ─── Match-winner odds with strong-favourite tier ─────────────────────────────

// Include both TLA codes and common name forms — football-data.org omits tla for
// some teams, falling back to shortName/name in normaliseTeam, so both must match.
const FAVORITES = new Set([
  'FRA', 'France',
  'BRA', 'Brazil', 'Brasil',
  'ENG', 'England',
  'ESP', 'Spain',
  'ARG', 'Argentina',
])

function isFavorite(team) {
  if (!team) return false
  return (
    FAVORITES.has(team.tla  || '') ||
    FAVORITES.has(team.id   || '') ||
    FAVORITES.has(team.name || '')
  )
}

function matchWinnerOdds(matchId, homeTeam, awayTeam) {
  const rng = makeRng(matchId, 'winner')
  const hFav = isFavorite(homeTeam)
  const aFav = isFavorite(awayTeam)

  if (hFav && !aFav) {
    // Strong home favourite
    return { home: rand(rng, 1.20, 1.80), draw: rand(rng, 3.20, 4.50), away: rand(rng, 3.50, 8.00) }
  }
  if (aFav && !hFav) {
    // Strong away favourite
    return { home: rand(rng, 3.50, 8.00), draw: rand(rng, 3.20, 4.50), away: rand(rng, 1.20, 1.80) }
  }
  if (hFav && aFav) {
    // Top-vs-top
    return { home: rand(rng, 1.90, 2.80), draw: rand(rng, 3.00, 3.80), away: rand(rng, 2.10, 3.20) }
  }
  // Balanced match
  return { home: rand(rng, 2.10, 3.50), draw: rand(rng, 3.00, 4.00), away: rand(rng, 2.20, 4.00) }
}

// ─── Full fallback odds (explicit ranges per market) ─────────────────────────

function generateFallbackOdds(match) {
  const id  = match?.id || 'default'
  const rng = makeRng(id, 'odds')
  const r   = (min, max) => rand(rng, min, max)

  return {
    // Real API overrides these two; fallback only kicks in if API has no data
    MATCH_WINNER: matchWinnerOdds(id, match?.homeTeam, match?.awayTeam),

    BTTS:          { yes: r(1.60, 2.20), no: r(1.70, 2.40) },
    DOUBLE_CHANCE: { '1X': r(1.25, 1.55), 'X2': r(1.28, 1.60), '12': r(1.10, 1.35) },

    OVER_UNDER: {
      'over_0.5':  r(1.08, 1.25), 'under_0.5': r(3.80, 6.50),
      'over_1.5':  r(1.40, 1.68), 'under_1.5': r(2.15, 2.85),
      'over_2.5':  r(1.70, 2.30), 'under_2.5': r(1.68, 2.20),
      'over_3.5':  r(2.70, 3.90), 'under_3.5': r(1.28, 1.52),
    },

    CORRECT_SCORE: {
      '1-0': r(5.50, 8.00),  '2-0': r(7.00, 10.0), '2-1': r(6.50, 9.50),
      '3-0': r(11.0, 16.0),  '3-1': r(10.0, 15.0), '3-2': r(14.0, 22.0),
      '0-0': r(8.00, 12.0),  '1-1': r(4.80, 7.00), '2-2': r(10.0, 15.0),
      '0-1': r(6.50, 9.50),  '0-2': r(8.00, 12.0), '1-2': r(7.50, 11.0),
    },

    HT_RESULT: { home: r(2.50, 3.50), draw: r(1.85, 2.40), away: r(3.00, 4.80) },

    // ── Cards ──────────────────────────────────────────────────────────────────
    RED_CARD: { yes: r(2.50, 4.00), no: r(1.33, 1.55) },

    YELLOW_CARDS: {
      'over_2.5':  r(1.70, 2.05), 'under_2.5': r(1.80, 2.15),
      'over_3.5':  r(2.50, 3.50), 'under_3.5': r(1.35, 1.60),
    },

    FIVE_YELLOW_CARDS: { yes: r(4.50, 8.00), no: r(1.10, 1.22) },

    // ── Corners ────────────────────────────────────────────────────────────────
    FIRST_CORNER:  { home: r(1.72, 2.00), away: r(1.85, 2.10) },

    TOTAL_CORNERS: {
      'over_8.5':   r(1.78, 2.05), 'under_8.5':  r(1.80, 2.05),
      'over_10.5':  r(2.50, 3.50), 'under_10.5': r(1.35, 1.55),
    },

    // ── Fun / Bizarre ──────────────────────────────────────────────────────────
    GK_SCORE:          { yes: r(200.0, 300.0), no: 1.01 },   // goalkeeper scores
    VAR_CHANGE:        { yes: r(5.00, 12.0),   no: r(1.09, 1.22) },
    HAT_TRICK:         { yes: r(15.0, 40.0),   no: r(1.02, 1.07) },
    PLAYER_CRIES:      { yes: r(15.0, 50.0),   no: r(1.02, 1.07) },
    OWN_GOAL:          { yes: r(4.50, 8.50),   no: r(1.12, 1.25) },
    EXTRA_TIME:        { yes: r(3.20, 5.50),   no: r(1.22, 1.40) },
    COACH_SENT_OFF:    { yes: r(15.0, 25.0),   no: r(1.04, 1.07) },
    PENALTY_SHOOTOUT:  { yes: r(2.80, 4.50),   no: r(1.28, 1.45) },
  }
}

// ─── Market categories ────────────────────────────────────────────────────────

export const MARKET_CATEGORIES = [
  { id: 'standard', label: 'Standardní trhy' },
  { id: 'goals',    label: 'Góly' },
  { id: 'halftime', label: 'Poločas' },
  { id: 'cards',    label: 'Karty' },
  { id: 'corners',  label: 'Rohy' },
  { id: 'fun',      label: 'Zábavné sázky' },
]

// ─── Main market builder ──────────────────────────────────────────────────────

export function getMarketsForMatch(match, apiOdds) {
  if (!match) return []

  const isKnockout = [
    'LAST_32', 'ROUND_OF_32', 'LAST_16', 'ROUND_OF_16',
    'QUARTER_FINALS', 'QUARTER_FINAL', 'SEMI_FINALS', 'SEMI_FINAL', 'FINAL',
  ].includes(match.stage)

  const homeTeam    = match.homeTeam
  const awayTeam    = match.awayTeam
  const homePlayers = getTeamPlayers(homeTeam?.id)
  const awayPlayers = getTeamPlayers(awayTeam?.id)
  const allPlayers  = [
    ...homePlayers.map((p) => `${homeTeam?.name}: ${p}`),
    ...awayPlayers.map((p) => `${awayTeam?.name}: ${p}`),
  ]

  // Merge: generated fallback for everything, sanitised API odds on top
  const fallback = generateFallbackOdds(match)
  const clean    = sanitiseApiOdds(apiOdds)
  const o = {
    ...fallback,
    ...clean,
    // Deep-merge OVER_UNDER: API values fill in real prices, fallback covers the rest
    OVER_UNDER: { ...fallback.OVER_UNDER, ...(clean.OVER_UNDER || {}) },
  }

  // Validate match-winner odds: for strong home favourites, home win (1) must always
  // have shorter odds than draw (X).  If they appear swapped — whether from the API
  // returning transposed outcomes or from the fallback using the wrong tier because
  // the TLA code was missing — swap them back.
  if (
    o.MATCH_WINNER?.home != null &&
    o.MATCH_WINNER?.draw != null &&
    isFavorite(homeTeam) &&
    o.MATCH_WINNER.home > o.MATCH_WINNER.draw
  ) {
    o.MATCH_WINNER = { ...o.MATCH_WINNER, home: o.MATCH_WINNER.draw, draw: o.MATCH_WINNER.home }
  }

  // Seeded scorer odds — stable per match + player slot
  const scorerRng = makeRng(match.id, 'scorer')

  const markets = [
    // ── Standard ──────────────────────────────────────────────
    {
      id: 'MATCH_WINNER',
      category: 'standard',
      label: 'Vítěz zápasu (1X2)',
      options: [
        { key: 'home', label: homeTeam?.name || 'Domácí', odds: clamp(o.MATCH_WINNER.home) },
        { key: 'draw', label: 'Remíza',                   odds: clamp(o.MATCH_WINNER.draw) },
        { key: 'away', label: awayTeam?.name || 'Hosté',  odds: clamp(o.MATCH_WINNER.away) },
      ],
    },
    {
      id: 'BTTS',
      category: 'standard',
      label: 'Oba týmy skórují (BTTS)',
      options: [
        { key: 'yes', label: 'Ano', odds: clamp(o.BTTS.yes) },
        { key: 'no',  label: 'Ne',  odds: clamp(o.BTTS.no)  },
      ],
    },
    {
      id: 'DOUBLE_CHANCE',
      category: 'standard',
      label: 'Dvojitá šance',
      options: [
        { key: '1X', label: `${homeTeam?.name || '1'} nebo Remíza`,                   odds: clamp(o.DOUBLE_CHANCE['1X']) },
        { key: 'X2', label: `Remíza nebo ${awayTeam?.name || '2'}`,                   odds: clamp(o.DOUBLE_CHANCE['X2']) },
        { key: '12', label: `${homeTeam?.name || '1'} nebo ${awayTeam?.name || '2'}`, odds: clamp(o.DOUBLE_CHANCE['12']) },
      ],
    },
    // ── Goals ─────────────────────────────────────────────────
    {
      id: 'OVER_UNDER_05',
      category: 'goals',
      label: 'Góly Over/Under 0.5',
      options: [
        { key: 'over_0.5',  label: 'Over 0.5',  odds: clamp(o.OVER_UNDER['over_0.5'])  },
        { key: 'under_0.5', label: 'Under 0.5', odds: clamp(o.OVER_UNDER['under_0.5']) },
      ],
    },
    {
      id: 'OVER_UNDER_15',
      category: 'goals',
      label: 'Góly Over/Under 1.5',
      options: [
        { key: 'over_1.5',  label: 'Over 1.5',  odds: clamp(o.OVER_UNDER['over_1.5'])  },
        { key: 'under_1.5', label: 'Under 1.5', odds: clamp(o.OVER_UNDER['under_1.5']) },
      ],
    },
    {
      id: 'OVER_UNDER_25',
      category: 'goals',
      label: 'Góly Over/Under 2.5',
      options: [
        { key: 'over_2.5',  label: 'Over 2.5',  odds: clamp(o.OVER_UNDER['over_2.5'])  },
        { key: 'under_2.5', label: 'Under 2.5', odds: clamp(o.OVER_UNDER['under_2.5']) },
      ],
    },
    {
      id: 'OVER_UNDER_35',
      category: 'goals',
      label: 'Góly Over/Under 3.5',
      options: [
        { key: 'over_3.5',  label: 'Over 3.5',  odds: clamp(o.OVER_UNDER['over_3.5'])  },
        { key: 'under_3.5', label: 'Under 3.5', odds: clamp(o.OVER_UNDER['under_3.5']) },
      ],
    },
    {
      id: 'CORRECT_SCORE',
      category: 'goals',
      label: 'Přesný výsledek',
      options: Object.entries(o.CORRECT_SCORE).map(([score, v]) => ({
        key: score, label: score, odds: clamp(v),
      })),
    },
    {
      id: 'FIRST_SCORER',
      category: 'goals',
      label: 'Střelec prvního gólu',
      options: allPlayers.map((player) => ({
        key: player,
        label: player,
        odds: parseFloat((6 + scorerRng() * 22).toFixed(2)),
      })),
    },
    // ── Half-time ─────────────────────────────────────────────
    {
      id: 'HT_RESULT',
      category: 'halftime',
      label: 'Výsledek v poločase',
      options: [
        { key: 'home', label: homeTeam?.name || 'Domácí', odds: clamp(o.HT_RESULT.home) },
        { key: 'draw', label: 'Remíza',                   odds: clamp(o.HT_RESULT.draw) },
        { key: 'away', label: awayTeam?.name || 'Hosté',  odds: clamp(o.HT_RESULT.away) },
      ],
    },
    // ── Cards ─────────────────────────────────────────────────
    {
      id: 'RED_CARD',
      category: 'cards',
      label: 'Bude červená karta?',
      options: [
        { key: 'yes', label: 'Ano', odds: clamp(o.RED_CARD.yes) },
        { key: 'no',  label: 'Ne',  odds: clamp(o.RED_CARD.no)  },
      ],
    },
    {
      id: 'YELLOW_CARDS_25',
      category: 'cards',
      label: 'Žluté karty Over/Under 2.5',
      options: [
        { key: 'over_2.5',  label: 'Over 2.5',  odds: clamp(o.YELLOW_CARDS['over_2.5'])  },
        { key: 'under_2.5', label: 'Under 2.5', odds: clamp(o.YELLOW_CARDS['under_2.5']) },
      ],
    },
    {
      id: 'YELLOW_CARDS_35',
      category: 'cards',
      label: 'Žluté karty Over/Under 3.5',
      options: [
        { key: 'over_3.5',  label: 'Over 3.5',  odds: clamp(o.YELLOW_CARDS['over_3.5'])  },
        { key: 'under_3.5', label: 'Under 3.5', odds: clamp(o.YELLOW_CARDS['under_3.5']) },
      ],
    },
    {
      id: 'FIVE_YELLOW_CARDS',
      category: 'cards',
      label: 'Rozhodčí udělí 5+ žlutých karet?',
      options: [
        { key: 'yes', label: 'Ano', odds: clamp(o.FIVE_YELLOW_CARDS.yes) },
        { key: 'no',  label: 'Ne',  odds: clamp(o.FIVE_YELLOW_CARDS.no)  },
      ],
    },
    // ── Corners ───────────────────────────────────────────────
    {
      id: 'FIRST_CORNER',
      category: 'corners',
      label: 'První roh — který tým?',
      options: [
        { key: 'home', label: homeTeam?.name || 'Domácí', odds: clamp(o.FIRST_CORNER.home) },
        { key: 'away', label: awayTeam?.name || 'Hosté',  odds: clamp(o.FIRST_CORNER.away) },
      ],
    },
    {
      id: 'TOTAL_CORNERS_85',
      category: 'corners',
      label: 'Celkové rohy Over/Under 8.5',
      options: [
        { key: 'over_8.5',  label: 'Over 8.5',  odds: clamp(o.TOTAL_CORNERS['over_8.5'])  },
        { key: 'under_8.5', label: 'Under 8.5', odds: clamp(o.TOTAL_CORNERS['under_8.5']) },
      ],
    },
    {
      id: 'TOTAL_CORNERS_105',
      category: 'corners',
      label: 'Celkové rohy Over/Under 10.5',
      options: [
        { key: 'over_10.5',  label: 'Over 10.5',  odds: clamp(o.TOTAL_CORNERS['over_10.5'])  },
        { key: 'under_10.5', label: 'Under 10.5', odds: clamp(o.TOTAL_CORNERS['under_10.5']) },
      ],
    },
    // ── Fun / Bizarre ─────────────────────────────────────────
    {
      id: 'GK_SCORE',
      category: 'fun',
      label: '🧤 Dá gól brankář?',
      badge: 'ŠÍLENOST',
      options: [
        { key: 'yes', label: 'Ano', odds: clamp(o.GK_SCORE.yes) },   // 200–300
        { key: 'no',  label: 'Ne',  odds: 1.01 },
      ],
    },
    {
      id: 'VAR_CHANGE',
      category: 'fun',
      label: '📺 Změní VAR výsledek?',
      options: [
        { key: 'yes', label: 'Ano', odds: clamp(o.VAR_CHANGE.yes) },  // 5–12
        { key: 'no',  label: 'Ne',  odds: clamp(o.VAR_CHANGE.no)  },
      ],
    },
    {
      id: 'HAT_TRICK',
      category: 'fun',
      label: '🎩 Hattrick v zápase?',
      options: [
        { key: 'yes', label: 'Ano', odds: clamp(o.HAT_TRICK.yes) },   // 15–40
        { key: 'no',  label: 'Ne',  odds: clamp(o.HAT_TRICK.no)  },
      ],
    },
    {
      id: 'PLAYER_CRIES',
      category: 'fun',
      label: '😭 Hráč bude plakat v kameře?',
      options: [
        { key: 'yes', label: 'Ano', odds: clamp(o.PLAYER_CRIES.yes) }, // 15–50
        { key: 'no',  label: 'Ne',  odds: clamp(o.PLAYER_CRIES.no)  },
      ],
    },
    {
      id: 'OWN_GOAL',
      category: 'fun',
      label: '🤦 Vlastní gól?',
      options: [
        { key: 'yes', label: 'Ano', odds: clamp(o.OWN_GOAL.yes) },
        { key: 'no',  label: 'Ne',  odds: clamp(o.OWN_GOAL.no)  },
      ],
    },
    {
      id: 'EXTRA_TIME',
      category: 'fun',
      label: '⏱️ Bude prodloužení?',
      options: [
        { key: 'yes', label: 'Ano', odds: clamp(o.EXTRA_TIME.yes) },
        { key: 'no',  label: 'Ne',  odds: clamp(o.EXTRA_TIME.no)  },
      ],
    },
    {
      id: 'COACH_SENT_OFF',
      category: 'fun',
      label: '🟥 Trenér dostane červenou?',
      options: [
        { key: 'yes', label: 'Ano', odds: clamp(o.COACH_SENT_OFF.yes) }, // 15–25
        { key: 'no',  label: 'Ne',  odds: clamp(o.COACH_SENT_OFF.no)  },
      ],
    },
  ]

  // Penalty shootout only makes sense in knockout rounds
  if (isKnockout) {
    markets.push({
      id: 'PENALTY_SHOOTOUT',
      category: 'fun',
      label: '⚽ Penaltový rozstřel?',
      options: [
        { key: 'yes', label: 'Ano', odds: clamp(o.PENALTY_SHOOTOUT.yes) },
        { key: 'no',  label: 'Ne',  odds: clamp(o.PENALTY_SHOOTOUT.no)  },
      ],
    })
  }

  // Only drop markets with literally zero options (e.g. FIRST_SCORER with unknown squad)
  return markets.filter((m) => m.options.length > 0)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function isMatchLocked(match) {
  return ['IN_PLAY', 'PAUSED', 'FINISHED', 'SUSPENDED'].includes(match?.status)
}

export function calcTotalStake(betSlip) {
  return betSlip.reduce((s, b) => s + (b.stake || 0), 0)
}

export function calcTotalPayout(betSlip) {
  return betSlip.reduce((s, b) => s + Math.round((b.stake || 0) * (b.odds || 1)), 0)
}

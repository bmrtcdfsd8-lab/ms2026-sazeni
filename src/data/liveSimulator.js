// Deterministic seeded RNG so each matchId always produces the same events
function hashStr(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function makeRng(seed) {
  let s = seed >>> 0
  return () => {
    s ^= s << 13
    s ^= s >> 17
    s ^= s << 5
    s = s >>> 0
    return s / 0x100000000
  }
}

// Pre-generate full 90-minute event list for a match (deterministic)
export function generateAllEvents(matchId) {
  const rng = makeRng(hashStr(matchId))
  const events = []

  for (let min = 1; min <= 94; min++) {
    const roll = rng()
    const side = rng() > 0.5 ? 'home' : 'away'

    // Extra time events are injury-time goals only
    if (min > 90) {
      if (roll < 0.04) events.push({ minute: min, type: side === 'home' ? 'GOAL_HOME' : 'GOAL_AWAY', label: side === 'home' ? '⚽ Gól' : '⚽ Gól' })
      continue
    }

    // Rate bumps in 40-45' and 80-90' windows
    const hotZone = (min >= 40 && min <= 45) || min >= 80
    const goalRate = hotZone ? 0.038 : 0.025
    const yellowRate = hotZone ? 0.055 : 0.035
    const redRate = 0.004
    const cornerRate = 0.08
    const varRate = 0.003

    if (roll < goalRate) {
      events.push({ minute: min, type: side === 'home' ? 'GOAL_HOME' : 'GOAL_AWAY', label: '⚽ Gól' })
    } else if (roll < goalRate + yellowRate) {
      events.push({ minute: min, type: side === 'home' ? 'YELLOW_HOME' : 'YELLOW_AWAY', label: '🟨 Žlutá karta' })
    } else if (roll < goalRate + yellowRate + redRate) {
      events.push({ minute: min, type: side === 'home' ? 'RED_HOME' : 'RED_AWAY', label: '🟥 Červená karta' })
    } else if (roll < goalRate + yellowRate + redRate + cornerRate) {
      events.push({ minute: min, type: side === 'home' ? 'CORNER_HOME' : 'CORNER_AWAY', label: '🚩 Roh' })
    } else if (roll < goalRate + yellowRate + redRate + cornerRate + varRate) {
      events.push({ minute: min, type: 'VAR', label: '📺 VAR' })
    }
  }

  return events
}

// Filter events up to current minute and compute score
export function getMatchState(allEvents, upToMinute) {
  const events = allEvents.filter((e) => e.minute <= upToMinute)
  let homeGoals = 0
  let awayGoals = 0
  let homeRed = 0
  let awayRed = 0

  events.forEach((e) => {
    if (e.type === 'GOAL_HOME') homeGoals++
    if (e.type === 'GOAL_AWAY') awayGoals++
    if (e.type === 'RED_HOME') homeRed++
    if (e.type === 'RED_AWAY') awayRed++
  })

  return { score: { home: homeGoals, away: awayGoals }, redCards: { home: homeRed, away: awayRed }, events }
}

// Compute live odds based on current score + minute, using base odds as anchor
export function computeLiveOdds(baseOdds, score, minute) {
  const { home, away } = score
  const diff = home - away
  const remaining = Math.max(2, 90 - minute)

  // Convert base odds to implied probabilities (strip ~5% margin)
  const mw = baseOdds.MATCH_WINNER || { home: 2.5, draw: 3.2, away: 2.5 }
  const totalInv = 1 / mw.home + 1 / mw.draw + 1 / mw.away
  let pH = (1 / mw.home) / totalInv
  let pD = (1 / mw.draw) / totalInv
  let pA = (1 / mw.away) / totalInv

  // Time-pressure factor: as remaining time shrinks, scoreline matters more
  const pressure = 1 - remaining / 90  // 0 at kickoff → 1 at whistle

  // Scoreline nudge: tanh keeps it in range (-1, 1)
  const nudge = Math.tanh(diff * (0.4 + pressure * 1.4))

  pH = Math.min(0.96, Math.max(0.02, pH + nudge * (1 - pH)))
  pA = Math.min(0.96, Math.max(0.02, pA - nudge * pA))
  pD = Math.min(0.60, Math.max(0.02, 1 - pH - pA))

  // Renormalise
  const sum = pH + pD + pA
  pH /= sum; pD /= sum; pA /= sum

  const margin = 1.06
  const liveWinner = {
    home: +(margin / pH).toFixed(2),
    draw: +(margin / pD).toFixed(2),
    away: +(margin / pA).toFixed(2),
  }

  // BTTS — once both teams have scored, it's settled at 1.01
  const bttsYes = home > 0 && away > 0 ? 1.01
    : (home > 0 || away > 0)
      ? +((margin / (0.30 + 0.30 * (remaining / 90))).toFixed(2))
      : +((margin / (0.55 * remaining / 90 + 0.1)).toFixed(2))

  // O/U 2.5 remaining goals — Poisson approximation
  const goalsPerMin = 0.028
  const lambda = goalsPerMin * remaining
  const totalNow = home + away
  const needForOver25 = Math.max(0, 3 - totalNow)  // goals still needed to go over 2.5 total

  let pOver25
  if (totalNow > 2) {
    pOver25 = 0.99
  } else if (needForOver25 === 0) {
    pOver25 = 0.99
  } else {
    // P(Poisson(lambda) >= needForOver25)
    pOver25 = 1 - poissonCDF(lambda, needForOver25 - 1)
  }
  pOver25 = Math.min(0.98, Math.max(0.02, pOver25))

  // Next goal market — roughly proportional to base win odds
  const homeGoalP = pH * 0.55 + 0.15
  const awayGoalP = pA * 0.55 + 0.15
  const noGoalNextP = Math.max(0.02, 1 - homeGoalP - awayGoalP)

  return {
    MATCH_WINNER: liveWinner,
    BTTS: {
      yes: Math.max(1.01, bttsYes),
      no: home > 0 && away > 0 ? 25.0 : +(margin / Math.max(0.05, 1 - 1 / Math.max(1.01, bttsYes))).toFixed(2),
    },
    OVER_UNDER: {
      'over_2.5': +(margin / pOver25).toFixed(2),
      'under_2.5': +(margin / (1 - pOver25)).toFixed(2),
    },
    // In-play specific
    NEXT_GOAL: {
      home: +(margin / homeGoalP).toFixed(2),
      none: +(margin / noGoalNextP).toFixed(2),
      away: +(margin / awayGoalP).toFixed(2),
    },
    // Comeback market (only interesting when someone trails)
    COMEBACK: diff !== 0 ? {
      yes: diff < 0
        ? +(margin / Math.max(0.02, pA + 0.3 * pD)).toFixed(2)
        : +(margin / Math.max(0.02, pH + 0.3 * pD)).toFixed(2),
      no: diff < 0
        ? +(margin / Math.max(0.02, pH)).toFixed(2)
        : +(margin / Math.max(0.02, pA)).toFixed(2),
    } : null,
    // Next corner — roughly 50/50 adjusted by possession proxy (home slight advantage)
    NEXT_CORNER: {
      home: +(margin / 0.52).toFixed(2),
      away: +(margin / 0.48).toFixed(2),
    },
    // Goal in next 10 minutes?
    GOAL_NEXT_10: {
      yes: +(margin / Math.min(0.93, 1 - Math.exp(-goalsPerMin * Math.min(10, remaining)))).toFixed(2),
      no: +(margin / Math.max(0.07, Math.exp(-goalsPerMin * Math.min(10, remaining)))).toFixed(2),
    },
  }
}

// Simple Poisson CDF (P(X <= k))
function poissonCDF(lambda, k) {
  let sum = 0
  let term = Math.exp(-lambda)
  for (let i = 0; i <= k; i++) {
    sum += term
    term *= lambda / (i + 1)
  }
  return Math.min(1, sum)
}

// Build in-play market definitions for BetMarketsModal
export function getInPlayMarkets(match, liveOdds) {
  if (!liveOdds) return []
  const home = match.homeTeam?.name || 'Domácí'
  const away = match.awayTeam?.name || 'Hosté'
  const score = match.score || { home: 0, away: 0 }
  const diff = score.home - score.away

  const markets = [
    {
      id: 'MATCH_WINNER_LIVE',
      category: 'live',
      label: '🏁 Vítěz zápasu (živě)',
      badge: 'ŽIVĚ',
      options: [
        { key: 'home', label: home, odds: liveOdds.MATCH_WINNER?.home },
        { key: 'draw', label: 'Remíza', odds: liveOdds.MATCH_WINNER?.draw },
        { key: 'away', label: away, odds: liveOdds.MATCH_WINNER?.away },
      ],
    },
    {
      id: 'NEXT_GOAL',
      category: 'live',
      label: '⚡ Příští gól',
      badge: 'ŽIVĚ',
      options: [
        { key: 'home', label: home, odds: liveOdds.NEXT_GOAL?.home },
        { key: 'none', label: 'Žádný další', odds: liveOdds.NEXT_GOAL?.none },
        { key: 'away', label: away, odds: liveOdds.NEXT_GOAL?.away },
      ],
    },
    {
      id: 'GOAL_NEXT_10',
      category: 'live',
      label: '⏱️ Gól v příštích 10 minutách?',
      badge: 'ŽIVĚ',
      options: [
        { key: 'yes', label: 'Ano', odds: liveOdds.GOAL_NEXT_10?.yes },
        { key: 'no', label: 'Ne', odds: liveOdds.GOAL_NEXT_10?.no },
      ],
    },
    {
      id: 'NEXT_CORNER_LIVE',
      category: 'live',
      label: '🚩 Příští roh — který tým?',
      badge: 'ŽIVĚ',
      options: [
        { key: 'home', label: home, odds: liveOdds.NEXT_CORNER?.home },
        { key: 'away', label: away, odds: liveOdds.NEXT_CORNER?.away },
      ],
    },
    {
      id: 'BTTS_LIVE',
      category: 'live',
      label: '🎯 Oba týmy skórují (živě)',
      badge: 'ŽIVĚ',
      options: [
        { key: 'yes', label: 'Ano', odds: liveOdds.BTTS?.yes },
        { key: 'no', label: 'Ne', odds: liveOdds.BTTS?.no },
      ],
    },
    {
      id: 'OVER_UNDER_25_LIVE',
      category: 'live',
      label: '📊 Celkové góly Over/Under 2.5 (živě)',
      badge: 'ŽIVĚ',
      options: [
        { key: 'over_2.5', label: 'Over 2.5', odds: liveOdds.OVER_UNDER?.['over_2.5'] },
        { key: 'under_2.5', label: 'Under 2.5', odds: liveOdds.OVER_UNDER?.['under_2.5'] },
      ],
    },
  ]

  // Comeback market only when there's a goal difference
  if (diff !== 0 && liveOdds.COMEBACK) {
    const trailing = diff < 0 ? away : home
    const leading = diff < 0 ? home : away
    markets.splice(2, 0, {
      id: 'COMEBACK',
      category: 'live',
      label: `🔄 Obrat — ${trailing} dožene?`,
      badge: 'ŽIVĚ',
      options: [
        { key: 'yes', label: `Ano, ${trailing}`, odds: liveOdds.COMEBACK?.yes },
        { key: 'no', label: `Ne, vyhraje ${leading}`, odds: liveOdds.COMEBACK?.no },
      ],
    })
  }

  return markets.filter((m) => m.options.every((o) => o.odds && o.odds > 0 && isFinite(o.odds)))
}

export const EVENT_ICONS = {
  GOAL_HOME: '⚽',
  GOAL_AWAY: '⚽',
  YELLOW_HOME: '🟨',
  YELLOW_AWAY: '🟨',
  RED_HOME: '🟥',
  RED_AWAY: '🟥',
  CORNER_HOME: '🚩',
  CORNER_AWAY: '🚩',
  VAR: '📺',
}

// Lazy per-match event cache — generated on first access, no pre-loading needed
const _eventsCache = {}

export function getAllEventsCached(matchId) {
  if (!_eventsCache[matchId]) {
    _eventsCache[matchId] = generateAllEvents(matchId)
  }
  return _eventsCache[matchId]
}

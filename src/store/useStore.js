import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getAllEventsCached, getMatchState, computeLiveOdds } from '@/data/liveSimulator'

const STARTING_COINS = 2000
const MIN_BET = 10

export const useStore = create(
  persist(
    (set, get) => ({
      // ── User ──────────────────────────────────────────────────
      username: 'Sázkaři',
      coins: STARTING_COINS,
      transactions: [],

      // ── Matches, Standings & Odds (all from live API, not persisted) ──
      matches: [],
      standings: [],       // [{ group: 'A', table: [{position, team, ...}] }]
      odds: {},            // matchId → { MATCH_WINNER, OVER_UNDER, ... }
      lastFetch: null,
      lastFetchMs: 0,      // epoch ms — for cache-age checks in Navbar
      fetchError: null,
      isLoading: true,
      isRefreshing: false,
      refreshTrigger: 0,   // bumped by triggerRefresh() to signal useLiveData

      // ── Live state (not persisted) ─────────────────────────────
      liveMinutes: {},      // matchId → simulated current minute
      liveOdds: {},         // matchId → computed live odds
      prevLiveOdds: {},     // matchId → previous tick's odds
      liveEvents: {},       // matchId → events array up to current minute

      // ── Bets ─────────────────────────────────────────────────
      bets: [],

      // ── Bet Slip ─────────────────────────────────────────────
      betSlip: [],
      betSlipOpen: false,

      // ── Notifications ─────────────────────────────────────────
      notifications: [],

      // ─────────────────────────────────────────────────────────
      // Actions — User
      // ─────────────────────────────────────────────────────────
      setUsername: (name) => set({ username: name }),

      resetCoins: () => {
        const tx = {
          id: crypto.randomUUID(),
          type: 'RESET',
          amount: STARTING_COINS,
          balance: STARTING_COINS,
          description: 'Reset zůstatku',
          timestamp: new Date().toISOString(),
        }
        set({ coins: STARTING_COINS, transactions: [tx, ...get().transactions] })
      },

      // ─────────────────────────────────────────────────────────
      // Actions — Data loading
      // ─────────────────────────────────────────────────────────
      setMatches: (matches) => {
        const { liveMinutes, odds } = get()
        const newLiveMinutes = { ...liveMinutes }
        const newLiveOdds = {}
        const newLiveEvents = {}

        matches.forEach((m) => {
          if (m.status !== 'IN_PLAY' && m.status !== 'PAUSED') return
          if (!newLiveMinutes[m.id]) {
            newLiveMinutes[m.id] = m.minute || 1
          }
          const minute = newLiveMinutes[m.id]
          const allEvents = getAllEventsCached(m.id)
          const state = getMatchState(allEvents, minute)
          newLiveEvents[m.id] = state.events
          const base = odds[m.id]
          if (base?.MATCH_WINNER) {
            newLiveOdds[m.id] = computeLiveOdds(base, state.score, minute)
          }
        })

        const now = Date.now()
        set({
          matches,
          liveMinutes: newLiveMinutes,
          liveOdds: newLiveOdds,
          liveEvents: newLiveEvents,
          lastFetch: new Date(now).toISOString(),
          lastFetchMs: now,
          isLoading: false,
        })
      },

      setStandings: (standings) => set({ standings }),

      setRefreshing: (v) => set({ isRefreshing: v }),

      triggerRefresh: () => set({ refreshTrigger: Date.now() }),

      setOdds: (oddsMap) => {
        // After receiving new API odds, recompute live odds for live matches
        const { matches, liveMinutes } = get()
        const newLiveOdds = {}
        matches.forEach((m) => {
          if (m.status !== 'IN_PLAY' && m.status !== 'PAUSED') return
          const base = oddsMap[m.id]
          if (!base?.MATCH_WINNER) return
          const minute = liveMinutes[m.id] || m.minute || 1
          const allEvents = getAllEventsCached(m.id)
          const state = getMatchState(allEvents, minute)
          newLiveOdds[m.id] = computeLiveOdds(base, state.score, minute)
        })
        set({ odds: oddsMap, liveOdds: newLiveOdds })
      },

      setFetchError: (err) => set({ fetchError: err, isLoading: false }),

      // ─────────────────────────────────────────────────────────
      // Actions — Live ticker (called every 8s for IN_PLAY matches)
      // ─────────────────────────────────────────────────────────
      tickLiveMatch: (matchId) => {
        const { liveMinutes, liveOdds, matches, odds } = get()
        const match = matches.find((m) => m.id === matchId)
        if (!match || (match.status !== 'IN_PLAY' && match.status !== 'PAUSED')) return

        const prevMinute = liveMinutes[matchId] ?? (match.minute || 1)
        const newMinute = Math.min(94, prevMinute + 1)

        const allEvents = getAllEventsCached(matchId)
        const state = getMatchState(allEvents, newMinute)
        const base = odds[matchId]
        const newLiveOdds = base?.MATCH_WINNER
          ? computeLiveOdds(base, state.score, newMinute)
          : null

        set({
          liveMinutes: { ...liveMinutes, [matchId]: newMinute },
          prevLiveOdds: { ...get().prevLiveOdds, [matchId]: liveOdds[matchId] },
          liveOdds: newLiveOdds
            ? { ...liveOdds, [matchId]: newLiveOdds }
            : liveOdds,
          liveEvents: { ...get().liveEvents, [matchId]: state.events },
        })
      },

      // Selectors for live data
      getLiveMinute: (matchId) => {
        const { liveMinutes, matches } = get()
        const match = matches.find((m) => m.id === matchId)
        return liveMinutes[matchId] ?? match?.minute ?? null
      },
      getLiveScore: (matchId) => {
        const { liveEvents, liveMinutes } = get()
        const events = liveEvents[matchId]
        if (!events) return null
        const min = liveMinutes[matchId] ?? 0
        const h = events.filter((e) => e.type === 'GOAL_HOME' && e.minute <= min).length
        const a = events.filter((e) => e.type === 'GOAL_AWAY' && e.minute <= min).length
        return { home: h, away: a }
      },
      getLiveOdds: (matchId) => get().liveOdds[matchId] ?? null,
      getPrevLiveOdds: (matchId) => get().prevLiveOdds[matchId] ?? null,
      getLiveEvents: (matchId) => get().liveEvents[matchId] ?? null,
      getAllEvents: (matchId) => getAllEventsCached(matchId),

      // ─────────────────────────────────────────────────────────
      // Actions — Bet Slip
      // ─────────────────────────────────────────────────────────
      addToBetSlip: (item) => {
        const slip = get().betSlip
        const exists = slip.findIndex(
          (s) => s.matchId === item.matchId && s.marketType === item.marketType
        )
        if (exists >= 0) {
          const updated = [...slip]
          updated[exists] = { ...item, stake: updated[exists].stake }
          set({ betSlip: updated, betSlipOpen: true })
        } else {
          set({ betSlip: [...slip, { ...item, stake: MIN_BET }], betSlipOpen: true })
        }
      },

      removeFromBetSlip: (matchId, marketType) => {
        set({
          betSlip: get().betSlip.filter(
            (s) => !(s.matchId === matchId && s.marketType === marketType)
          ),
        })
      },

      updateBetSlipStake: (matchId, marketType, stake) => {
        set({
          betSlip: get().betSlip.map((s) =>
            s.matchId === matchId && s.marketType === marketType ? { ...s, stake } : s
          ),
        })
      },

      clearBetSlip: () => set({ betSlip: [] }),
      toggleBetSlip: () => set({ betSlipOpen: !get().betSlipOpen }),

      // ─────────────────────────────────────────────────────────
      // Actions — Place Bets
      // ─────────────────────────────────────────────────────────
      placeBets: () => {
        const { betSlip, coins, bets, transactions } = get()
        if (betSlip.length === 0) return { ok: false, error: 'Tikety jsou prázdné' }

        const totalStake = betSlip.reduce((s, b) => s + b.stake, 0)
        if (totalStake > coins) return { ok: false, error: 'Nedostatek mincí' }
        if (betSlip.some((b) => b.stake < MIN_BET))
          return { ok: false, error: `Minimální sázka je ${MIN_BET} mincí` }

        const now = new Date().toISOString()
        const newBets = betSlip.map((b) => ({
          id: crypto.randomUUID(),
          matchId: b.matchId,
          matchLabel: b.matchLabel,
          marketType: b.marketType,
          marketLabel: b.marketLabel,
          selection: b.selection,
          selectionLabel: b.selectionLabel,
          odds: b.odds,
          stake: b.stake,
          potentialPayout: +(b.stake * b.odds).toFixed(0),
          status: 'OPEN',
          placedAt: now,
          settledAt: null,
          isLiveBet: b.isLiveBet || false,
          placedAtMinute: b.placedAtMinute || null,
        }))

        const newBalance = coins - totalStake
        const tx = {
          id: crypto.randomUUID(),
          type: 'BET_PLACED',
          amount: -totalStake,
          balance: newBalance,
          description: `${betSlip.length} sázek umístěno`,
          timestamp: now,
        }

        set({
          coins: newBalance,
          bets: [...newBets, ...bets],
          transactions: [tx, ...transactions],
          betSlip: [],
          betSlipOpen: false,
        })
        return { ok: true }
      },

      // ─────────────────────────────────────────────────────────
      // Actions — Settle Bets
      // ─────────────────────────────────────────────────────────
      settleBet: (betId, won) => {
        const { bets, coins, transactions } = get()
        const bet = bets.find((b) => b.id === betId)
        if (!bet || bet.status !== 'OPEN') return

        const now = new Date().toISOString()
        const winnings = won ? bet.potentialPayout : 0
        const newBalance = coins + winnings

        const updatedBets = bets.map((b) =>
          b.id === betId ? { ...b, status: won ? 'WON' : 'LOST', settledAt: now } : b
        )
        const txList = [...transactions]
        if (won) {
          txList.unshift({
            id: crypto.randomUUID(),
            type: 'BET_WON',
            amount: winnings,
            balance: newBalance,
            description: `Výhra: ${bet.marketLabel} — ${bet.selectionLabel}`,
            timestamp: now,
          })
        }

        set({ bets: updatedBets, coins: won ? newBalance : coins, transactions: txList })
        return { won, winnings }
      },

      // ─────────────────────────────────────────────────────────
      // Selectors
      // ─────────────────────────────────────────────────────────
      getMatchById: (id) => get().matches.find((m) => m.id === id),
      getOddsForMatch: (id) => get().odds[id] ?? null,
      getOpenBets: () => get().bets.filter((b) => b.status === 'OPEN'),
      getSettledBets: () => get().bets.filter((b) => b.status !== 'OPEN'),

      pushNotification: (notif) => {
        const id = crypto.randomUUID()
        set({ notifications: [{ ...notif, id }, ...get().notifications.slice(0, 19)] })
      },
    }),
    {
      name: 'ms2026-store',
      // Only persist user data — all match/odds data is re-fetched on load
      partialize: (s) => ({
        username: s.username,
        coins: s.coins,
        transactions: s.transactions,
        bets: s.bets,
      }),
    }
  )
)

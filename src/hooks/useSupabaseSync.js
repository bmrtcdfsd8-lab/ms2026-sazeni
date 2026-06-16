import { useEffect, useRef } from 'react'
import { useStore } from '@/store/useStore'
import { insertBets, updateBetStatus, updateUserCoins } from '@/services/supabase'

// Watches bets + coins in the Zustand store and pushes changes to Supabase.
// Fire-and-forget — failures are logged but never block the UI.
export function useSupabaseSync() {
  const userId = useStore((s) => s.userId)
  const coins  = useStore((s) => s.coins)
  const bets   = useStore((s) => s.bets)

  const prevCoins   = useRef(coins)
  const prevBets    = useRef(bets)
  const coinsTimer  = useRef(null)
  const betsSkipRef = useRef(true) // skip first bets run (initial mount snapshot)

  // Sync coins — debounced 1.5 s to avoid chatty updates during bet placement
  useEffect(() => {
    if (!userId) return
    if (coins === prevCoins.current) return
    prevCoins.current = coins
    clearTimeout(coinsTimer.current)
    coinsTimer.current = setTimeout(() => updateUserCoins(userId, coins), 1500)
    return () => clearTimeout(coinsTimer.current)
  }, [userId, coins])

  // Reset skip flag when userId changes (login / logout)
  useEffect(() => {
    betsSkipRef.current = true
    prevBets.current = bets
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync bets — detect new placements and settlements
  useEffect(() => {
    if (!userId) return
    if (betsSkipRef.current) {
      // First run after login: snapshot current bets, don't sync (already in DB)
      betsSkipRef.current = false
      prevBets.current = bets
      return
    }

    const prev = prevBets.current
    prevBets.current = bets

    // New bets (appear in store but not in previous snapshot)
    const prevIds = new Set(prev.map((b) => b.id))
    const newBets = bets.filter((b) => !prevIds.has(b.id))
    if (newBets.length) insertBets(userId, newBets)

    // Status changes (OPEN → WON | LOST)
    const prevById = Object.fromEntries(prev.map((b) => [b.id, b]))
    bets.forEach((bet) => {
      const p = prevById[bet.id]
      if (p && p.status !== bet.status && bet.status !== 'OPEN') {
        updateBetStatus(bet.id, bet.status, bet.settledAt)
      }
    })
  }, [userId, bets]) // eslint-disable-line react-hooks/exhaustive-deps
}

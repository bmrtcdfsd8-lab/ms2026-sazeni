import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { loadTournamentData, loadOdds } from '@/services/api'

// No auto-refresh intervals — data is fetched on mount (cache-first)
// and on demand when the user clicks the refresh button (force=true via triggerRefresh).

export function useLiveData() {
  const setMatches     = useStore((s) => s.setMatches)
  const setStandings   = useStore((s) => s.setStandings)
  const setOdds        = useStore((s) => s.setOdds)
  const setFetchError  = useStore((s) => s.setFetchError)
  const setRefreshing  = useStore((s) => s.setRefreshing)
  const refreshTrigger = useStore((s) => s.refreshTrigger)

  async function fetchAll(force) {
    setRefreshing(true)
    try {
      const result = await loadTournamentData(force)
      setMatches(result.matches)
      setStandings(result.standings)
      setFetchError(null)

      if (result.matches.length > 0) {
        loadOdds(result.matches, force)
          .then(({ oddsMap }) => setOdds(oddsMap))
          .catch(() => {})  // odds failure is silent
      }
    } catch (err) {
      setFetchError(err.message || 'Chyba načítání dat')
    } finally {
      setRefreshing(false)
    }
  }

  // On mount: use localStorage cache if fresh (<5 min), otherwise fetch
  useEffect(() => {
    fetchAll(false)
  }, [])

  // Manual refresh triggered from Navbar — always bypasses cache
  useEffect(() => {
    if (refreshTrigger === 0) return
    fetchAll(true)
  }, [refreshTrigger])
}

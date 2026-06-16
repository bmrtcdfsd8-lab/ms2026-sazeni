import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { fetchUser, fetchUserBets } from '@/services/supabase'

// On startup: if userId is in the persisted store, verify it against Supabase
// and pull the authoritative coins + bets. Runs once on mount.
export function useInitAuth() {
  const userId = useStore((s) => s.userId)
  const login = useStore((s) => s.login)

  useEffect(() => {
    if (!userId) return
    Promise.all([fetchUser(userId), fetchUserBets(userId)])
      .then(([user, bets]) => {
        if (user) {
          // Supabase is authoritative for coins; bets are merged in login()
          login(userId, user.username, user.coins, bets)
        }
        // If user vanished from DB, keep local session (Supabase may be unavailable)
      })
      .catch(() => {
        // Offline — local state remains; user stays authenticated
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps — run once on mount
}

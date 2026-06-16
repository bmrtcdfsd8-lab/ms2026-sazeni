import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { Layout } from '@/components/layout/Layout'
import { Home } from '@/pages/Home'
import { Tournament } from '@/pages/Tournament'
import { MyBets } from '@/pages/MyBets'
import { Settings } from '@/pages/Settings'
import { Leaderboard } from '@/pages/Leaderboard'
import { Admin } from '@/pages/Admin'
import { AuthScreen } from '@/pages/AuthScreen'
import { useLiveData } from '@/hooks/useLiveData'
import { useAutoSettle } from '@/hooks/useAutoSettle'
import { useLiveMatchTicker } from '@/hooks/useLiveMatchTicker'
import { useInitAuth } from '@/hooks/useInitAuth'
import { useSupabaseSync } from '@/hooks/useSupabaseSync'
// Blocking gate — server-side ban check on every page load, before anything else mounts.
// Shows a spinner until /api/check-ban responds, then either:
//   - renders children (ban clear or not logged in)
//   - wipes localStorage and shows AuthScreen with the ban error
function BanGate({ children }) {
  const [status, setStatus] = useState('pending') // 'pending' | 'clear' | 'banned'
  const logout = useStore((s) => s.logout)

  useEffect(() => {
    function runCheck() {
      // Read directly from the store at effect time (not from the render closure).
      // useStore.getState() always returns the current hydrated value, even if
      // Zustand's persist middleware hadn't finished hydrating when React rendered.
      const { userId, username } = useStore.getState()

      console.log('[BanGate] running — userId:', userId, 'username:', username)

      if (!userId) {
        console.log('[BanGate] no session, skipping ban check → clear')
        setStatus('clear')
        return
      }

      console.log('[BanGate] calling /api/check-ban for:', username)
      fetch(`/api/check-ban?username=${encodeURIComponent(username)}`)
        .then(async (res) => {
          console.log('[BanGate] /api/check-ban response status:', res.status)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          console.log('[BanGate] /api/check-ban response data:', JSON.stringify(data))
          return !!data.banned
        })
        .then((banned) => {
          console.log('[BanGate] banned:', banned, '— setting status to', banned ? 'banned' : 'clear')
          if (banned) {
            logout() // wipes Zustand state + localStorage
            setStatus('banned')
          } else {
            setStatus('clear')
          }
        })
        .catch((err) => {
          // Endpoint unavailable (local dev without vercel dev, or network error) — fail open
          console.warn('[BanGate] check failed, allowing through:', err.message)
          setStatus('clear')
        })
    }

    // Wait for Zustand persist to finish hydrating from localStorage before reading state.
    // With synchronous localStorage this is usually instant, but Zustand v5 may defer it.
    if (useStore.persist.hasHydrated()) {
      runCheck()
    } else {
      const unsub = useStore.persist.onFinishHydration(runCheck)
      return unsub // cleanup if component unmounts before hydration
    }
  }, []) // run once on mount, before AppMain or any other hook

  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Ověřuji přístup…</p>
        </div>
      </div>
    )
  }

  if (status === 'banned') {
    return <AuthScreen bannedError />
  }

  return children
}

// All hooks live here — only mounts after BanGate confirms the session is clean
function AppMain() {
  const isAuthenticated = useStore((s) => !!s.userId)

  useLiveData()
  useAutoSettle()
  useLiveMatchTicker()
  useInitAuth()
  useSupabaseSync()

  if (!isAuthenticated) return <AuthScreen />

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/turnaj" element={<Tournament />} />
        <Route path="/sazky" element={<MyBets />} />
        <Route path="/zebricek" element={<Leaderboard />} />
        <Route path="/nastaveni" element={<Settings />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <BanGate>
        <AppMain />
      </BanGate>
    </BrowserRouter>
  )
}

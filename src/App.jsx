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
  const [banChecked, setBanChecked] = useState(false)
  const [isBanned, setIsBanned]     = useState(false)

  useEffect(() => {
    // Zustand persist stores everything as JSON under 'ms2026-store'.
    // Parse it directly — no dependency on Zustand hydration timing.
    let username = null
    let userId   = null
    try {
      const raw    = localStorage.getItem('ms2026-store')
      const parsed = raw ? JSON.parse(raw) : null
      username = parsed?.state?.username || null
      userId   = parsed?.state?.userId   || null
    } catch {
      // Corrupt localStorage — treat as logged out
    }

    console.log('[BanCheck] userId:', userId, 'username:', username)

    if (!userId || !username) {
      // Not logged in — nothing to check
      setBanChecked(true)
      return
    }

    fetch(`/api/check-ban?username=${encodeURIComponent(username)}`)
      .then((r) => r.json())
      .then((data) => {
        console.log('[BanCheck] result:', data)
        if (data.banned) {
          localStorage.clear()
          setIsBanned(true)
        }
        setBanChecked(true)
      })
      .catch(() => {
        // Endpoint unreachable (local dev) — fail open
        setBanChecked(true)
      })
  }, [])

  if (!banChecked) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-neon-blue/30 border-t-neon-blue rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Ověřuji přístup…</p>
        </div>
      </div>
    )
  }

  if (isBanned) {
    return <AuthScreen bannedError />
  }

  return (
    <BrowserRouter>
      <AppMain />
    </BrowserRouter>
  )
}

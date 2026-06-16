import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { Layout } from '@/components/layout/Layout'
import { Home } from '@/pages/Home'
import { Tournament } from '@/pages/Tournament'
import { MyBets } from '@/pages/MyBets'
import { Settings } from '@/pages/Settings'
import { Leaderboard } from '@/pages/Leaderboard'
import { AuthScreen } from '@/pages/AuthScreen'
import { useLiveData } from '@/hooks/useLiveData'
import { useAutoSettle } from '@/hooks/useAutoSettle'
import { useLiveMatchTicker } from '@/hooks/useLiveMatchTicker'
import { useInitAuth } from '@/hooks/useInitAuth'
import { useSupabaseSync } from '@/hooks/useSupabaseSync'

function AppInner() {
  const isAuthenticated = useStore((s) => !!s.userId)

  useLiveData()
  useAutoSettle()
  useLiveMatchTicker()
  useInitAuth()
  useSupabaseSync()

  if (!isAuthenticated) {
    return <AuthScreen />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/turnaj" element={<Tournament />} />
        <Route path="/sazky" element={<MyBets />} />
        <Route path="/zebricek" element={<Leaderboard />} />
        <Route path="/nastaveni" element={<Settings />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}

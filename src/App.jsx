import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Home } from '@/pages/Home'
import { Tournament } from '@/pages/Tournament'
import { MyBets } from '@/pages/MyBets'
import { Settings } from '@/pages/Settings'
import { useLiveData } from '@/hooks/useLiveData'
import { useAutoSettle } from '@/hooks/useAutoSettle'
import { useLiveMatchTicker } from '@/hooks/useLiveMatchTicker'

function AppInner() {
  useLiveData()
  useAutoSettle()
  useLiveMatchTicker()

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/turnaj" element={<Tournament />} />
        <Route path="/sazky" element={<MyBets />} />
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

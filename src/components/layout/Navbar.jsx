import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Trophy, ReceiptText, Settings, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { CoinCounter } from '@/components/ui/CoinCounter'
import { useStore } from '@/store/useStore'

const MIN_REFRESH_MS = 5 * 60 * 1000  // enforce 5-minute minimum between API calls

const links = [
  { to: '/', label: 'Domů', icon: Home, end: true },
  { to: '/turnaj', label: 'Turnaj', icon: Trophy },
  { to: '/sazky', label: 'Moje sázky', icon: ReceiptText },
  { to: '/nastaveni', label: 'Nastavení', icon: Settings },
]

function relativeTime(ms) {
  if (!ms) return null
  const diff = Math.floor((Date.now() - ms) / 1000)
  if (diff < 15)  return 'právě teď'
  if (diff < 60)  return `před ${diff} s`
  const m = Math.floor(diff / 60)
  if (m < 60)     return `před ${m} min`
  return `před ${Math.floor(m / 60)} h`
}

export function Navbar() {
  const username       = useStore((s) => s.username)
  const fetchError     = useStore((s) => s.fetchError)
  const lastFetchMs    = useStore((s) => s.lastFetchMs)
  const isRefreshing   = useStore((s) => s.isRefreshing)
  const triggerRefresh = useStore((s) => s.triggerRefresh)

  // Re-render every 30s so the relative-time label stays current between refreshes
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  const ageMs   = lastFetchMs ? Date.now() - lastFetchMs : Infinity
  const isStale = ageMs > MIN_REFRESH_MS
  const timeLabel = relativeTime(lastFetchMs)

  function handleRefresh() {
    if (isRefreshing) return
    if (!isStale) {
      const remaining = Math.ceil((MIN_REFRESH_MS - ageMs) / 60_000)
      toast(`Data jsou čerstvá — zkus za ${remaining} min (free tier = 10 req/min)`, {
        icon: '⏱',
        duration: 3000,
      })
      return
    }
    triggerRefresh()
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-navy-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">⚽</span>
          <div className="hidden sm:block">
            <span className="font-bold text-white text-sm">MS2026</span>
            <span className="text-neon-blue font-bold text-sm ml-1">Sázení</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-neon-blue/15 text-neon-blue'
                    : 'text-slate-400 hover:text-white hover:bg-white/5',
                ].join(' ')
              }
            >
              <Icon size={15} />
              <span className="hidden md:inline">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Refresh button + last-fetch label */}
          <div className="flex items-center gap-1">
            {timeLabel && (
              <span
                className={[
                  'text-xs hidden sm:block',
                  isStale ? 'text-yellow-400' : 'text-slate-500',
                ].join(' ')}
              >
                {timeLabel}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              title={
                isRefreshing
                  ? 'Načítám…'
                  : isStale
                  ? 'Aktualizovat data z API'
                  : `Data jsou čerstvá — obnovení za ${Math.ceil((MIN_REFRESH_MS - ageMs) / 60_000)} min`
              }
              className={[
                'p-1.5 rounded-lg transition-all',
                isRefreshing
                  ? 'text-neon-blue cursor-not-allowed'
                  : isStale
                  ? 'text-slate-300 hover:text-white hover:bg-white/10'
                  : 'text-slate-600 hover:text-slate-400 hover:bg-white/5',
              ].join(' ')}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* API status icon */}
          <div title={fetchError ? `Chyba: ${fetchError}` : 'Data OK'}>
            {fetchError ? (
              <WifiOff size={14} className="text-yellow-400" />
            ) : (
              <Wifi size={14} className="text-neon-green" />
            )}
          </div>

          <span className="text-xs text-slate-500 hidden sm:block">{username}</span>
          <CoinCounter />
        </div>
      </div>
    </header>
  )
}

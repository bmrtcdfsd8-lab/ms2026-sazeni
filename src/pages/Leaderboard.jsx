import { useState, useEffect, useCallback } from 'react'
import { Medal, RefreshCw, Wifi, WifiOff, Trophy } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { supabase, fetchLeaderboard } from '@/services/supabase'
import { formatCoins } from '@/utils/format'

const MEDAL_CLS = ['text-yellow-400', 'text-slate-300', 'text-amber-600']

export function Leaderboard() {
  const currentUserId = useStore((s) => s.userId)
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [rtOnline, setRtOnline] = useState(false)
  const [lastAt, setLastAt]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetchLeaderboard()
    setRows(data)
    setLastAt(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    load()

    // Real-time: subscribe to users table — re-fetch leaderboard on any change
    const channel = supabase
      .channel('ms2026-leaderboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => fetchLeaderboard().then((data) => { setRows(data); setLastAt(new Date()) })
      )
      .subscribe((status) => setRtOnline(status === 'SUBSCRIBED'))

    return () => supabase.removeChannel(channel)
  }, [load])

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="text-neon-gold" size={22} />
            Žebříček
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Nejlepší hráči — live aktualizace</p>
        </div>
        <div className="flex items-center gap-2">
          <span title={rtOnline ? 'Realtime aktivní' : 'Offline'}>
            {rtOnline
              ? <Wifi size={14} className="text-neon-green" />
              : <WifiOff size={14} className="text-yellow-400" />}
          </span>
          <button
            onClick={load}
            disabled={loading}
            title="Obnovit"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {lastAt && (
        <p className="text-xs text-slate-600">Aktualizováno: {lastAt.toLocaleTimeString('cs-CZ')}</p>
      )}

      {/* Top-3 podium (only when enough players) */}
      {!loading && rows.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {[1, 0, 2].map((i) => {
            const row  = rows[i]
            const rank = i + 1
            if (!row) return null
            const isMe = row.id === currentUserId
            return (
              <div
                key={row.id}
                className={[
                  'rounded-xl border p-3 text-center',
                  i === 0 ? 'border-yellow-400/30 bg-yellow-400/5 col-start-2 -mt-2' : 'border-white/10 bg-navy-800/30',
                  isMe ? 'ring-1 ring-neon-blue/50' : '',
                ].join(' ')}
              >
                <Medal size={20} className={`mx-auto mb-1 ${MEDAL_CLS[i]}`} />
                <div className={`text-sm font-bold truncate ${isMe ? 'text-neon-blue' : 'text-white'}`}>
                  {row.username}{isMe ? ' 👈' : ''}
                </div>
                <div className="text-xs font-mono text-neon-gold mt-1">{formatCoins(row.coins)} 🪙</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Full table */}
      <div className="rounded-xl border border-white/10 bg-navy-800/30 overflow-hidden">
        {loading && rows.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-neon-blue" />
            Načítám žebříček…
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Trophy size={32} className="mx-auto mb-3 opacity-30" />
            Zatím žádní hráči
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5 text-xs text-slate-500 font-medium">
              <span className="w-8 text-center">#</span>
              <span className="flex-1">Hráč</span>
              <span className="w-28 text-right">Mince</span>
              <span className="w-16 text-right hidden sm:block">Sázky</span>
              <span className="w-14 text-right hidden sm:block">Výhry</span>
            </div>

            {rows.map((row, idx) => {
              const rank = idx + 1
              const isMe = row.id === currentUserId
              return (
                <div
                  key={row.id || row.username}
                  className={[
                    'flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 transition-colors',
                    isMe
                      ? 'bg-neon-blue/10 border-l-2 border-l-neon-blue'
                      : 'hover:bg-white/5',
                  ].join(' ')}
                >
                  <div className="w-8 text-center shrink-0">
                    {rank <= 3 ? (
                      <Medal size={15} className={MEDAL_CLS[rank - 1]} />
                    ) : (
                      <span className="text-sm text-slate-500 font-mono">{rank}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium truncate block ${isMe ? 'text-neon-blue' : 'text-white'}`}>
                      {row.username}
                      {isMe && <span className="ml-1.5 text-xs text-neon-blue/60">(ty)</span>}
                    </span>
                  </div>

                  <div className="w-28 text-right shrink-0">
                    <span className="font-mono font-bold text-neon-gold text-sm">
                      {formatCoins(row.coins)} 🪙
                    </span>
                  </div>

                  <div className="w-16 text-right hidden sm:block shrink-0">
                    <span className="text-xs text-slate-400">{row.total_bets ?? 0}</span>
                  </div>

                  <div className="w-14 text-right hidden sm:block shrink-0">
                    <span className="text-xs text-neon-green">{row.won_bets ?? 0}</span>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

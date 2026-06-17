import { useState, useEffect } from 'react'
import { Medal, RefreshCw, Wifi, WifiOff, Trophy, X, ChevronRight, Clock, Archive } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { supabase, fetchLeaderboard, fetchUserBets } from '@/services/supabase'
import { formatCoins, formatOdds, timeAgo } from '@/utils/format'

const MEDAL_CLS = ['text-yellow-400', 'text-slate-300', 'text-amber-600']

export function Leaderboard() {
  const currentUserId = useStore((s) => s.userId)
  const [rows, setRows]               = useState([])
  const [loading, setLoading]         = useState(true)
  const [rtOnline, setRtOnline]       = useState(false)
  const [lastAt, setLastAt]           = useState(null)
  const [selectedPlayer, setSelected] = useState(null) // leaderboard row

  async function load() {
    setLoading(true)
    try {
      const data = await fetchLeaderboard()
      setRows(data)
      setLastAt(new Date())
    } catch (err) {
      console.warn('[Leaderboard] fetch failed:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel('ms2026-leaderboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => fetchLeaderboard()
          .then((data) => { setRows(data); setLastAt(new Date()) })
          .catch(() => {})
      )
      .subscribe((status) => setRtOnline(status === 'SUBSCRIBED'))
    return () => supabase.removeChannel(channel)
  }, [])

  return (
    <>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="text-neon-gold" size={22} />
              Žebříček
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Nejlepší hráči — klikni na hráče pro detail</p>
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

        {/* Top-3 podium */}
        {!loading && rows.length >= 3 && (
          <div className="grid grid-cols-3 gap-3">
            {[1, 0, 2].map((i) => {
              const row = rows[i]
              if (!row) return null
              const isMe = row.id === currentUserId
              return (
                <button
                  key={row.id}
                  onClick={() => setSelected(row)}
                  className={[
                    'rounded-xl border p-3 text-center transition-all hover:brightness-110 active:scale-95',
                    i === 0 ? 'border-yellow-400/30 bg-yellow-400/5 col-start-2 -mt-2' : 'border-white/10 bg-navy-800/30',
                    isMe ? 'ring-1 ring-neon-blue/50' : '',
                  ].join(' ')}
                >
                  <Medal size={20} className={`mx-auto mb-1 ${MEDAL_CLS[i]}`} />
                  <div className={`text-sm font-bold truncate ${isMe ? 'text-neon-blue' : 'text-white'}`}>
                    {row.username}{isMe ? ' 👈' : ''}
                  </div>
                  <div className="text-xs font-mono text-neon-gold mt-1">{formatCoins(row.coins)} 🪙</div>
                </button>
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
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5 text-xs text-slate-500 font-medium">
                <span className="w-8 text-center">#</span>
                <span className="flex-1">Hráč</span>
                <span className="w-28 text-right">Mince</span>
                <span className="w-16 text-right hidden sm:block">Sázky</span>
                <span className="w-14 text-right hidden sm:block">Výhry</span>
                <span className="w-5" />
              </div>

              {rows.map((row, idx) => {
                const rank = idx + 1
                const isMe = row.id === currentUserId
                return (
                  <button
                    key={row.id || row.username}
                    onClick={() => setSelected(row)}
                    className={[
                      'w-full flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 transition-colors text-left',
                      isMe ? 'bg-neon-blue/10 border-l-2 border-l-neon-blue' : 'hover:bg-white/5',
                    ].join(' ')}
                  >
                    <div className="w-8 text-center shrink-0">
                      {rank <= 3
                        ? <Medal size={15} className={MEDAL_CLS[rank - 1]} />
                        : <span className="text-sm text-slate-500 font-mono">{rank}</span>}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium truncate block ${isMe ? 'text-neon-blue' : 'text-white'}`}>
                        {row.username}
                        {isMe && <span className="ml-1.5 text-xs text-neon-blue/60">(ty)</span>}
                      </span>
                    </div>

                    <div className="w-28 text-right shrink-0">
                      <span className="font-mono font-bold text-neon-gold text-sm">{formatCoins(row.coins)} 🪙</span>
                    </div>

                    <div className="w-16 text-right hidden sm:block shrink-0">
                      <span className="text-xs text-slate-400">{row.total_bets ?? 0}</span>
                    </div>

                    <div className="w-14 text-right hidden sm:block shrink-0">
                      <span className="text-xs text-neon-green">{row.won_bets ?? 0}</span>
                    </div>

                    <ChevronRight size={14} className="text-slate-600 shrink-0" />
                  </button>
                )
              })}
            </>
          )}
        </div>
      </div>

      {/* Player detail modal */}
      {selectedPlayer && (
        <PlayerModal player={selectedPlayer} currentUserId={currentUserId} onClose={() => setSelected(null)} />
      )}
    </>
  )
}

// ── Player Modal ──────────────────────────────────────────────────────────────

function PlayerModal({ player, currentUserId, onClose }) {
  const [bets, setBets]       = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('open')
  const isMe = player.id === currentUserId

  useEffect(() => {
    setLoading(true)
    fetchUserBets(player.id)
      .then(setBets)
      .catch(() => setBets([]))
      .finally(() => setLoading(false))
  }, [player.id])

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const openBets    = bets.filter((b) => b.status === 'OPEN')
  const settledBets = bets.filter((b) => b.status !== 'OPEN')
  const wonBets     = bets.filter((b) => b.status === 'WON')

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel — full-screen sheet on mobile, centered card on desktop */}
      <div className="relative z-10 w-full sm:max-w-lg bg-navy-900 border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh]">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex-1 min-w-0">
            <div className={`text-lg font-bold truncate ${isMe ? 'text-neon-blue' : 'text-white'}`}>
              {player.username}
              {isMe && <span className="ml-2 text-sm text-neon-blue/60">(ty)</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-px bg-white/5 shrink-0">
          {[
            { label: 'Mince',   value: `${formatCoins(player.coins)} 🪙`, cls: 'text-neon-gold' },
            { label: 'Sázky',   value: player.total_bets ?? 0,            cls: 'text-white' },
            { label: 'Výhry',   value: player.won_bets ?? 0,              cls: 'text-neon-green' },
          ].map(({ label, value, cls }) => (
            <div key={label} className="bg-navy-900 px-4 py-3 text-center">
              <div className={`text-base font-bold font-mono ${cls}`}>{value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-3 border-b border-white/10 shrink-0">
          {[
            { id: 'open',    label: 'Otevřené', count: openBets.length,    icon: Clock },
            { id: 'settled', label: 'Ukončené', count: settledBets.length, icon: Archive },
          ].map(({ id, label, count, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={[
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                tab === id
                  ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                  : 'text-slate-400 hover:text-white',
              ].join(' ')}
            >
              <Icon size={12} className="shrink-0" />
              {label}
              <span className="bg-white/10 px-1.5 py-0.5 rounded-full text-[10px]">{count}</span>
            </button>
          ))}
        </div>

        {/* Bet list — scrollable */}
        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {loading ? (
            <div className="py-12 text-center text-slate-500">
              <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-neon-blue" />
              Načítám sázky…
            </div>
          ) : tab === 'open' ? (
            openBets.length === 0
              ? <EmptyBets label="Žádné otevřené sázky" />
              : openBets.map((b) => <BetRow key={b.id} bet={b} />)
          ) : (
            settledBets.length === 0
              ? <EmptyBets label="Žádné ukončené sázky" />
              : settledBets.map((b) => <BetRow key={b.id} bet={b} />)
          )}
        </div>
      </div>
    </div>
  )
}

function BetRow({ bet }) {
  const isOpen = bet.status === 'OPEN'
  const isWon  = bet.status === 'WON'

  const statusBadge = {
    OPEN: <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neon-blue/20 text-neon-blue border border-neon-blue/30">Otevřena</span>,
    WON:  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neon-green/20 text-neon-green border border-neon-green/30">✓ Výhra</span>,
    LOST: <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neon-red/20 text-neon-red border border-neon-red/30">✗ Prohra</span>,
    VOID: <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-400">Anulována</span>,
  }

  const borderCls = {
    OPEN: 'border-neon-blue/20 bg-neon-blue/5',
    WON:  'border-neon-green/20 bg-neon-green/5',
    LOST: 'border-white/5 bg-navy-800/40',
    VOID: 'border-white/5 bg-navy-800/20',
  }

  return (
    <div className={`rounded-xl border p-3 ${borderCls[bet.status] || borderCls.VOID}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            {statusBadge[bet.status]}
            <span className="text-[10px] text-slate-500">{timeAgo(bet.placedAt)}</span>
          </div>
          <div className="text-xs text-slate-400 truncate">{bet.matchLabel}</div>
          <div className="text-sm font-semibold text-white mt-0.5">{bet.marketLabel}</div>
          <div className="text-xs text-slate-300">{bet.selectionLabel}</div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-neon-gold font-bold font-mono text-sm">{formatOdds(bet.odds)}</div>
          <div className="text-[10px] text-slate-500 mt-1">
            Sázka: <span className="text-white font-mono">{formatCoins(bet.stake)} 🪙</span>
          </div>
          {isOpen ? (
            <div className="text-xs text-slate-400 font-mono mt-0.5">→ {formatCoins(bet.potentialPayout)} 🪙</div>
          ) : isWon ? (
            <div className="text-xs text-neon-green font-bold font-mono mt-0.5">+{formatCoins(bet.potentialPayout)} 🪙</div>
          ) : (
            <div className="text-xs text-slate-600 font-mono mt-0.5 line-through">{formatCoins(bet.potentialPayout)} 🪙</div>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyBets({ label }) {
  return (
    <div className="py-12 text-center text-slate-500 text-sm">
      <span className="text-3xl block mb-2">🎰</span>
      {label}
    </div>
  )
}

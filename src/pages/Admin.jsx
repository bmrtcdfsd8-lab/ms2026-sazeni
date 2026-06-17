import { useState, useEffect } from 'react'
import { Shield, Trash2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { useStore } from '@/store/useStore'
import { fetchAllUsersAdmin, banUsername } from '@/services/supabase'
import { formatCoins } from '@/utils/format'

const ADMIN_USERNAME = 'Hanz'

// Anyone who isn't exactly "Hanz" sees a blank page (no error hint).
export function Admin() {
  const username = useStore((s) => s.username)
  if (username !== ADMIN_USERNAME) return null
  return <AdminPanel />
}

function AdminPanel() {
  const currentUserId = useStore((s) => s.userId)
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null) // userId being deleted

  async function load() {
    setLoading(true)
    try {
      const data = await fetchAllUsersAdmin()
      setUsers(data)
    } catch (err) {
      toast.error('Chyba načítání: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(user) {
    const ok = window.confirm(
      `Vyhodit "${user.username}" a zablokovat jejich přezdívku?\nHráč se nebude moct znovu přihlásit. Tato akce je nevratná.`
    )
    if (!ok) return
    setDeleting(user.id)
    try {
      // 1. Ban first — blocks re-registration even if delete takes a moment
      await banUsername(user.username)

      // 2. Delete via server endpoint using service role key (bypasses RLS)
      const res = await fetch('/api/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || `HTTP ${res.status}`)

      console.log('[Admin] delete-user result:', result)
      toast.success(`${user.username} byl vyhozen a zablokován`)
      // Re-fetch from Supabase to confirm deletion
      await load()
    } catch (err) {
      toast.error('Chyba: ' + err.message)
      await load()
    } finally {
      setDeleting(null)
    }
  }

  const totalCoins = users.reduce((s, u) => s + (u.coins || 0), 0)
  const totalBets  = users.reduce((s, u) => s + (u.total_bets || 0), 0)

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield size={22} className="text-neon-red" />
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-slate-500 text-xs mt-0.5">Viditelné pouze pro Hanz</p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 text-sm transition-colors disabled:opacity-40"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Obnovit
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/10 bg-navy-800/50 p-4">
          <div className="text-xs text-slate-500 mb-1">Hráčů celkem</div>
          <div className="text-2xl font-bold text-white">{users.length}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-navy-800/50 p-4">
          <div className="text-xs text-slate-500 mb-1">Sázek celkem</div>
          <div className="text-2xl font-bold text-white">{totalBets}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-navy-800/50 p-4">
          <div className="text-xs text-slate-500 mb-1">Mincí v oběhu</div>
          <div className="text-2xl font-bold text-neon-gold">{formatCoins(totalCoins)}</div>
        </div>
      </div>

      {/* Users table */}
      <div className="rounded-xl border border-white/10 bg-navy-800/30 overflow-hidden">
        {/* Column headers */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5 text-xs text-slate-500 font-medium">
          <span className="flex-1">Hráč</span>
          <span className="w-28 text-right">Mince</span>
          <span className="w-14 text-right">Sázky</span>
          <span className="w-14 text-right">Výhry</span>
          <span className="w-20 text-right">Akce</span>
        </div>

        {loading && users.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-neon-blue" />
            Načítám…
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-500">Žádní hráči</div>
        ) : (
          users.map((u) => {
            const isSelf = u.id === currentUserId
            return (
              <div
                key={u.id}
                className={[
                  'flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 transition-colors',
                  isSelf ? 'bg-neon-blue/5' : 'hover:bg-white/5',
                ].join(' ')}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{u.username}</span>
                    {isSelf && <span className="text-xs text-neon-blue/60">(ty)</span>}
                  </div>
                  <div className="text-xs text-slate-600 font-mono mt-0.5">{u.id?.slice(0, 8)}…</div>
                </div>

                <div className="w-28 text-right font-mono text-sm text-neon-gold">
                  {formatCoins(u.coins)} 🪙
                </div>

                <div className="w-14 text-right text-xs text-slate-400">{u.total_bets ?? 0}</div>
                <div className="w-14 text-right text-xs text-neon-green">{u.won_bets ?? 0}</div>

                <div className="w-20 flex justify-end">
                  {/* Never show delete for the admin's own account */}
                  {isSelf ? (
                    <span className="text-xs text-slate-600 pr-1">—</span>
                  ) : (
                    <button
                      onClick={() => handleDelete(u)}
                      disabled={deleting === u.id}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-neon-red/10 text-neon-red border border-neon-red/20 text-xs hover:bg-neon-red/20 transition-colors disabled:opacity-40"
                    >
                      {deleting === u.id ? (
                        <RefreshCw size={11} className="animate-spin" />
                      ) : (
                        <Trash2 size={11} />
                      )}
                      Vyhodit
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <p className="text-xs text-slate-600">
        Smazání hráče automaticky odstraní všechny jeho sázky (ON DELETE CASCADE).
      </p>
    </div>
  )
}

import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { createUser, findUserByUsername, fetchUserBets } from '@/services/supabase'

export function AuthScreen({ bannedError = false }) {
  const [username, setUsername] = useState('')
  const [loading, setLoading]   = useState(false)
  const login = useStore((s) => s.login)

  async function handleSubmit(e) {
    e.preventDefault()
    const name = username.trim()
    if (name.length < 2)  { toast.error('Přezdívka musí mít alespoň 2 znaky'); return }
    if (name.length > 24) { toast.error('Přezdívka může mít max. 24 znaků');   return }

    setLoading(true)
    try {
      // Server-side ban check — uses service role key, cannot be bypassed by RLS gaps
      const banRes = await fetch(`/api/check-ban?username=${encodeURIComponent(name)}`)
      if (banRes.ok) {
        const banData = await banRes.json()
        console.log('[AuthScreen] ban check for', name, ':', banData)
        if (banData.banned) {
          toast.error('Tento hráč byl vyloučen ze hry.', { duration: 6000 })
          setLoading(false)
          return
        }
      }

      const existing = await findUserByUsername(name)
      if (existing) {
        // Returning player — load their bets too
        const bets = await fetchUserBets(existing.id)
        login(existing.id, existing.username, existing.coins, bets)
        toast.success(`Vítej zpět, ${existing.username}! 🎉`)
      } else {
        // New player — create account with 2000 coins
        const user = await createUser(name)
        login(user.id, user.username, user.coins, [])
        toast.success(`Vítej, ${user.username}! Dostáváš 2 000 🪙`)
      }
    } catch (err) {
      console.error('[auth]', err)
      toast.error('Chyba při přihlášení — zkus to znovu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
      {/* Glow blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-neon-blue/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 rounded-full bg-neon-purple/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3 drop-shadow-lg">⚽</div>
          <h1 className="text-3xl font-black text-white tracking-tight">MS2026</h1>
          <p className="text-neon-blue font-bold text-lg">Sázení</p>
          <p className="text-slate-500 text-sm mt-2">Virtuální sázková soutěž — žádné reálné peníze</p>
        </div>

        {/* Ban error — persistent, shown when kicked by admin */}
        {bannedError && (
          <div className="mb-4 rounded-xl border border-neon-red/40 bg-neon-red/10 px-4 py-3 text-sm text-neon-red font-medium text-center">
            🚫 Tento hráč byl vyloučen ze hry.
          </div>
        )}

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-navy-800/60 backdrop-blur-sm p-6 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-1">Kdo jsi?</h2>
          <p className="text-slate-400 text-sm mb-5">
            Zadej přezdívku — registrace i přihlášení v jednom kroku, žádné heslo.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tvoje přezdívka…"
              maxLength={24}
              autoFocus
              disabled={loading}
              className="w-full bg-navy-900 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-neon-blue/60 focus:ring-1 focus:ring-neon-blue/30 transition-all disabled:opacity-50"
            />
            <p className="text-xs text-slate-600 -mt-2 ml-1">
              Vracíš se? Zadej stejnou přezdívku jako minule a načtu tvůj účet.
            </p>

            <button
              type="submit"
              disabled={loading || username.trim().length < 2}
              className="w-full py-3 rounded-xl bg-neon-blue/20 text-neon-blue border border-neon-blue/40 font-bold text-sm hover:bg-neon-blue/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Načítám…</>
              ) : (
                'Hrát! →'
              )}
            </button>
          </form>

          {/* Perks */}
          <div className="mt-6 pt-5 border-t border-white/5 space-y-2">
            {[
              ['🪙', 'Nový hráč dostane 2 000 mincí'],
              ['☁️', 'Sázky se synchronizují napříč zařízeními'],
              ['🏆', 'Živý žebříček všech hráčů'],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-2 text-xs text-slate-500">
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toaster lives here because Layout isn't rendered yet */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#0f2044',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
          },
        }}
      />
    </div>
  )
}

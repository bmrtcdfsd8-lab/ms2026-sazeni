import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { formatCoins } from '@/utils/format'
import { RefreshCw, User, Coins, Info, LogOut, Cloud } from 'lucide-react'
import toast from 'react-hot-toast'

export function Settings() {
  const username   = useStore((s) => s.username)
  const coins      = useStore((s) => s.coins)
  const userId     = useStore((s) => s.userId)
  const setUsername = useStore((s) => s.setUsername)
  const resetCoins  = useStore((s) => s.resetCoins)
  const logout      = useStore((s) => s.logout)
  const [nameInput, setNameInput]     = useState(username)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  function handleNameSave() {
    const trimmed = nameInput.trim()
    if (!trimmed) return
    setUsername(trimmed)
    toast.success('Přezdívka uložena!')
  }

  function handleLogout() {
    if (!confirmLogout) {
      setConfirmLogout(true)
      setTimeout(() => setConfirmLogout(false), 5000)
      return
    }
    logout()
    toast.success('Odhlášeno — zadej přezdívku znovu pro přihlášení')
  }

  function handleReset() {
    if (!confirmReset) {
      setConfirmReset(true)
      setTimeout(() => setConfirmReset(false), 5000)
      return
    }
    resetCoins()
    setConfirmReset(false)
    toast.success('Zůstatek resetován na 2000 mincí!')
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Nastavení</h1>
        <p className="text-slate-400 text-sm mt-0.5">Spravuj svůj profil a virtuální účet</p>
      </div>

      {/* Username */}
      <SettingsCard icon={<User size={18} className="text-neon-blue" />} title="Přezdívka">
        <div className="flex gap-2">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            maxLength={24}
            className="flex-1 bg-navy-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neon-blue/50"
            placeholder="Tvoje přezdívka"
            onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
          />
          <button
            onClick={handleNameSave}
            className="px-4 py-2 rounded-lg bg-neon-blue/20 text-neon-blue border border-neon-blue/30 text-sm font-semibold hover:bg-neon-blue/30 transition-colors"
          >
            Uložit
          </button>
        </div>
      </SettingsCard>

      {/* Coins */}
      <SettingsCard icon={<Coins size={18} className="text-neon-gold" />} title="Virtuální mince">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-3xl font-bold font-mono text-neon-gold">
              {formatCoins(coins)} 🪙
            </div>
            <div className="text-xs text-slate-500 mt-1">Aktuální zůstatek</div>
          </div>
        </div>
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-400 mb-4">
          ⚠️ Reset vrátí zůstatek na 2000 mincí a zapíše novou transakci do historie. Sázky zůstanou zachovány.
        </div>
        <button
          onClick={handleReset}
          className={[
            'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all',
            confirmReset
              ? 'bg-neon-red/20 border-neon-red text-neon-red animate-bounce-subtle'
              : 'bg-navy-700 border-white/10 text-white hover:border-white/30',
          ].join(' ')}
        >
          <RefreshCw size={16} />
          {confirmReset ? '⚠️ Klikni znovu pro potvrzení' : 'Resetovat mince (2000)'}
        </button>
      </SettingsCard>

      {/* Account / Logout */}
      <SettingsCard icon={<Cloud size={18} className="text-neon-blue" />} title="Účet">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-sm font-semibold text-white">{username}</div>
            <div className="text-xs text-neon-green mt-0.5">☁️ Synchronizováno se serverem</div>
            {userId && (
              <div className="text-xs text-slate-600 mt-1 font-mono">{userId.slice(0, 8)}…</div>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className={[
            'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all',
            confirmLogout
              ? 'bg-neon-red/20 border-neon-red text-neon-red animate-bounce-subtle'
              : 'bg-navy-700 border-white/10 text-white hover:border-white/30',
          ].join(' ')}
        >
          <LogOut size={16} />
          {confirmLogout ? '⚠️ Klikni znovu pro potvrzení' : 'Změnit hráče'}
        </button>
      </SettingsCard>

      {/* Info */}
      <SettingsCard icon={<Info size={18} className="text-slate-400" />} title="O aplikaci">
        <div className="space-y-2 text-sm text-slate-400">
          <p>MS2026 Sázení je <strong className="text-white">virtuální sázková aplikace</strong> bez reálných peněz.</p>
          <p>Mince a sázky jsou uloženy v Supabase a synchronizovány napříč zařízeními. Žádná registrace ani platby.</p>
          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
            <InfoChip label="Kurzy" value="Evropský decimální formát" />
            <InfoChip label="Minimální sázka" value="10 mincí" />
            <InfoChip label="Data" value="football-data.org + the-odds-api.com" />
            <InfoChip label="Refresh" value="každých 60 vteřin" />
          </div>
        </div>
      </SettingsCard>
    </div>
  )
}

function SettingsCard({ icon, title, children }) {
  return (
    <div className="rounded-xl border border-white/10 bg-navy-800/50 p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="font-bold text-white">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function InfoChip({ label, value }) {
  return (
    <div className="rounded-lg bg-navy-900/50 px-3 py-2">
      <div className="text-slate-500 text-xs">{label}</div>
      <div className="text-white text-xs font-medium mt-0.5">{value}</div>
    </div>
  )
}

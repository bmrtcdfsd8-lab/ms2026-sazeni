export function LiveBadge({ minute }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neon-red/20 border border-neon-red/50 text-neon-red text-xs font-bold animate-pulse">
      <span className="w-1.5 h-1.5 rounded-full bg-neon-red inline-block" />
      ŽIVĚ {minute ? `${minute}'` : ''}
    </span>
  )
}

export function StatusBadge({ status }) {
  const map = {
    SCHEDULED: { label: 'Naplánováno', cls: 'text-slate-400 border-slate-600 bg-slate-800' },
    TIMED: { label: 'Naplánováno', cls: 'text-slate-400 border-slate-600 bg-slate-800' },
    IN_PLAY: { label: '🔴 ŽIVĚ', cls: 'text-neon-red border-neon-red/50 bg-neon-red/10 animate-pulse' },
    PAUSED: { label: '⏸ Pauza', cls: 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10' },
    FINISHED: { label: 'Konec', cls: 'text-slate-400 border-slate-600 bg-slate-800' },
    SUSPENDED: { label: 'Přerušeno', cls: 'text-orange-400 border-orange-500/50 bg-orange-500/10' },
  }
  const { label, cls } = map[status] || { label: status, cls: 'text-slate-400 border-slate-600' }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-semibold ${cls}`}>
      {label}
    </span>
  )
}

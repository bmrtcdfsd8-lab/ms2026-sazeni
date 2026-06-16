import { useEffect, useRef, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatOdds } from '@/utils/format'
import { cn } from '@/utils/cn'

// Shows an odds value with flash + arrow when it changes
export function LiveOddsChip({ odds, prevOdds, label, className }) {
  const [flash, setFlash] = useState(null) // 'up' | 'down' | null
  const prev = useRef(odds)

  useEffect(() => {
    if (prevOdds === undefined || prevOdds === null) return
    if (prevOdds === odds) return

    const dir = odds > prevOdds ? 'up' : 'down'  // higher odds = worse, lower = better
    setFlash(dir)
    const t = setTimeout(() => setFlash(null), 2000)
    return () => clearTimeout(t)
  }, [odds, prevOdds])

  const changed = flash !== null
  const up = flash === 'up'

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg border transition-all duration-500 min-w-[68px]',
        changed
          ? up
            ? 'border-neon-red/70 bg-neon-red/10 shadow-[0_0_12px_rgba(255,45,85,0.3)]'
            : 'border-neon-green/70 bg-neon-green/10 shadow-[0_0_12px_rgba(0,255,136,0.3)]'
          : 'border-white/10 bg-navy-700/60',
        className
      )}
    >
      {label && <span className="text-[10px] text-slate-400 leading-none">{label}</span>}
      <div className="flex items-center gap-1">
        {changed && (
          up
            ? <TrendingUp size={10} className="text-neon-red" />
            : <TrendingDown size={10} className="text-neon-green" />
        )}
        <span
          className={cn(
            'text-base font-bold font-mono transition-colors duration-300',
            changed
              ? up ? 'text-neon-red' : 'text-neon-green'
              : 'text-neon-gold'
          )}
        >
          {formatOdds(odds)}
        </span>
      </div>
      {changed && prevOdds && (
        <span className="text-[9px] text-slate-500 line-through font-mono leading-none">
          {formatOdds(prevOdds)}
        </span>
      )}
    </div>
  )
}

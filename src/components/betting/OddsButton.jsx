import { useStore } from '@/store/useStore'
import { formatOdds } from '@/utils/format'
import { cn } from '@/utils/cn'

export function OddsButton({ matchId, matchLabel, marketType, marketLabel, selection, selectionLabel, odds, disabled, isLiveBet = false, placedAtMinute = null }) {
  const betSlip = useStore((s) => s.betSlip)
  const addToBetSlip = useStore((s) => s.addToBetSlip)
  const removeFromBetSlip = useStore((s) => s.removeFromBetSlip)

  const isSelected = betSlip.some(
    (b) => b.matchId === matchId && b.marketType === marketType && b.selection === selection
  )

  const isInSlip = betSlip.some(
    (b) => b.matchId === matchId && b.marketType === marketType
  )

  function handleClick() {
    if (disabled) return
    if (isSelected) {
      removeFromBetSlip(matchId, marketType)
    } else {
      addToBetSlip({
        matchId,
        matchLabel,
        marketType,
        marketLabel,
        selection,
        selectionLabel,
        odds,
        isLiveBet,
        placedAtMinute,
      })
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'flex flex-col items-center justify-center px-3 py-2 rounded-lg border text-sm font-semibold transition-all duration-150 min-w-[72px]',
        isSelected
          ? 'bg-neon-blue/20 border-neon-blue text-neon-blue shadow-[0_0_12px_rgba(0,212,255,0.3)] scale-105'
          : isInSlip
          ? 'bg-navy-700 border-white/20 text-slate-400 hover:border-white/40'
          : 'bg-navy-700 border-white/10 text-white hover:border-neon-blue/50 hover:bg-navy-600 hover:scale-105',
        disabled && 'opacity-40 cursor-not-allowed hover:scale-100 hover:border-white/10'
      )}
    >
      <span className="text-xs text-slate-400 leading-none mb-0.5">{selectionLabel}</span>
      <span className={cn('text-base font-bold', isSelected ? 'text-neon-blue' : 'text-neon-gold')}>
        {formatOdds(odds)}
      </span>
    </button>
  )
}

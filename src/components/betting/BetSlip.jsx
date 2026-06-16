import { useState } from 'react'
import { X, Trash2, ChevronDown, ChevronUp, ReceiptText } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { formatCoins, formatOdds } from '@/utils/format'
import { calcTotalStake, calcTotalPayout } from '@/utils/betting'
import toast from 'react-hot-toast'
import { useConfetti } from '@/hooks/useConfetti'

export function BetSlip() {
  const betSlip = useStore((s) => s.betSlip)
  const coins = useStore((s) => s.coins)
  const betSlipOpen = useStore((s) => s.betSlipOpen)
  const toggleBetSlip = useStore((s) => s.toggleBetSlip)
  const removeFromBetSlip = useStore((s) => s.removeFromBetSlip)
  const updateBetSlipStake = useStore((s) => s.updateBetSlipStake)
  const clearBetSlip = useStore((s) => s.clearBetSlip)
  const placeBets = useStore((s) => s.placeBets)
  const { fire } = useConfetti()

  const totalStake = calcTotalStake(betSlip)
  const totalPayout = calcTotalPayout(betSlip)

  function handlePlace() {
    const result = placeBets()
    if (result.ok) {
      toast.success('✅ Sázky umístěny!', { duration: 3000 })
    } else {
      toast.error(result.error, { duration: 4000 })
    }
  }

  return (
    <>
      {/* Floating trigger
          Mobile: .tiket-float (index.css) places it above BottomNav + safe-area.
          Desktop (sm+): sm:bottom-6 sm:right-6 takes over. */}
      <button
        onClick={toggleBetSlip}
        className="tiket-float fixed sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl bg-neon-blue text-navy-950 font-bold shadow-lg shadow-neon-blue/30 hover:shadow-neon-blue/50 transition-all hover:scale-105"
      >
        <ReceiptText size={18} />
        <span>Tiket</span>
        {betSlip.length > 0 && (
          <span className="bg-navy-950 text-neon-blue w-5 h-5 rounded-full text-xs flex items-center justify-center font-mono">
            {betSlip.length}
          </span>
        )}
      </button>

      {/* Slide-in panel */}
      <div
        className={[
          'fixed top-0 right-0 h-full w-full max-w-sm z-50 flex flex-col bg-navy-900 border-l border-white/10 shadow-2xl transition-transform duration-300',
          betSlipOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ReceiptText size={18} className="text-neon-blue" />
            <span className="font-bold text-white">Sázkový lístek</span>
            <span className="text-xs bg-neon-blue/20 text-neon-blue px-2 py-0.5 rounded-full">
              {betSlip.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {betSlip.length > 0 && (
              <button
                onClick={clearBetSlip}
                className="text-slate-400 hover:text-neon-red transition-colors p-1"
                title="Vymazat vše"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button onClick={toggleBetSlip} className="text-slate-400 hover:text-white transition-colors p-1">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {betSlip.length === 0 ? (
            <div className="text-center text-slate-500 py-16">
              <ReceiptText size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Žádné sázky v tiketu</p>
              <p className="text-xs mt-1">Klikni na kurz pro přidání</p>
            </div>
          ) : (
            betSlip.map((item) => (
              <BetSlipItem
                key={`${item.matchId}-${item.marketType}`}
                item={item}
                coins={coins}
                onRemove={() => removeFromBetSlip(item.matchId, item.marketType)}
                onStakeChange={(val) => updateBetSlipStake(item.matchId, item.marketType, val)}
              />
            ))
          )}
        </div>

        {/* Summary + Place button */}
        {betSlip.length > 0 && (
          <div className="border-t border-white/10 p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Celková sázka:</span>
              <span className="text-white font-mono font-semibold">{formatCoins(totalStake)} 🪙</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Možná výhra:</span>
              <span className="text-neon-green font-mono font-bold text-base">
                {formatCoins(totalPayout)} 🪙
              </span>
            </div>
            {totalStake > coins && (
              <p className="text-neon-red text-xs text-center">Nedostatek mincí!</p>
            )}
            <button
              onClick={handlePlace}
              disabled={totalStake > coins || totalStake === 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple text-white font-bold text-base transition-all hover:shadow-lg hover:shadow-neon-blue/30 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02]"
            >
              Vsadit {formatCoins(totalStake)} mincí
            </button>
          </div>
        )}
      </div>

      {/* Backdrop */}
      {betSlipOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={toggleBetSlip}
        />
      )}
    </>
  )
}

function BetSlipItem({ item, coins, onRemove, onStakeChange }) {
  const [expanded, setExpanded] = useState(false)
  const payout = Math.round((item.stake || 0) * item.odds)

  function handleStakeInput(e) {
    const val = Math.max(10, Math.min(coins, Number(e.target.value) || 10))
    onStakeChange(val)
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-400 truncate">{item.matchLabel}</div>
            <div className="text-xs text-slate-500">{item.marketLabel}</div>
            <div className="font-semibold text-white text-sm mt-0.5">{item.selectionLabel}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neon-gold font-bold font-mono">{formatOdds(item.odds)}</span>
            <button onClick={onRemove} className="text-slate-500 hover:text-neon-red transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Stake input */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="number"
              min={10}
              max={coins}
              value={item.stake || 10}
              onChange={handleStakeInput}
              className="w-full bg-navy-800 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm font-mono focus:outline-none focus:border-neon-blue/50 pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neon-gold text-xs">🪙</span>
          </div>
          <button
            onClick={() => onStakeChange(coins)}
            className="text-xs px-2 py-1.5 rounded-lg bg-navy-700 text-slate-400 hover:text-white border border-white/10 hover:border-white/30 transition-colors whitespace-nowrap"
          >
            Max
          </button>
        </div>

        {/* Payout preview */}
        <div className="flex justify-between mt-1.5 text-xs">
          <span className="text-slate-500">Výplata:</span>
          <span className="text-neon-green font-mono font-semibold">+{formatCoins(payout)} 🪙</span>
        </div>
      </div>
    </div>
  )
}

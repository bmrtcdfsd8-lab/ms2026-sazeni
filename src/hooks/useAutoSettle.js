import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import toast from 'react-hot-toast'

// Very simple auto-settler: for finished mock matches, randomly settle open bets
export function useAutoSettle() {
  const bets = useStore((s) => s.bets)
  const matches = useStore((s) => s.matches)
  const settleBet = useStore((s) => s.settleBet)
  const pushNotification = useStore((s) => s.pushNotification)

  useEffect(() => {
    const openBets = bets.filter((b) => b.status === 'OPEN')
    if (openBets.length === 0) return

    openBets.forEach((bet) => {
      const match = matches.find((m) => m.id === bet.matchId)
      if (!match || match.status !== 'FINISHED') return

      // Settle based on actual score if available
      const won = determineWin(bet, match)
      const result = settleBet(bet.id, won)
      if (!result) return

      if (won) {
        toast.success(`🏆 Výhra! +${result.winnings} mincí — ${bet.selectionLabel}`, {
          duration: 6000,
        })
        pushNotification({
          type: 'WIN',
          message: `Výhra ${result.winnings} mincí na ${bet.marketLabel}`,
          timestamp: new Date().toISOString(),
        })
      } else {
        toast.error(`❌ Prohra — ${bet.selectionLabel}`, { duration: 4000 })
      }
    })
  }, [matches]) // re-run when matches update
}

function determineWin(bet, match) {
  const score = match.score
  if (!score) return false

  const { home, away } = score

  switch (bet.marketType) {
    case 'MATCH_WINNER':
      if (bet.selection === 'home') return home > away
      if (bet.selection === 'draw') return home === away
      if (bet.selection === 'away') return away > home
      break
    case 'BTTS':
      if (bet.selection === 'yes') return home > 0 && away > 0
      if (bet.selection === 'no') return !(home > 0 && away > 0)
      break
    case 'OVER_UNDER_05':
      if (bet.selection === 'over_0.5') return home + away > 0
      if (bet.selection === 'under_0.5') return home + away === 0
      break
    case 'OVER_UNDER_15':
      if (bet.selection === 'over_1.5') return home + away > 1
      if (bet.selection === 'under_1.5') return home + away <= 1
      break
    case 'OVER_UNDER_25':
      if (bet.selection === 'over_2.5') return home + away > 2
      if (bet.selection === 'under_2.5') return home + away <= 2
      break
    case 'OVER_UNDER_35':
      if (bet.selection === 'over_3.5') return home + away > 3
      if (bet.selection === 'under_3.5') return home + away <= 3
      break
    case 'CORRECT_SCORE':
      return bet.selection === `${home}-${away}`
    case 'DOUBLE_CHANCE':
      if (bet.selection === '1X') return home >= away
      if (bet.selection === 'X2') return away >= home
      if (bet.selection === '12') return home !== away
      break
    case 'HT_RESULT':
      // Approximate half-time from full-time (simplified)
      return Math.random() > 0.5
    default:
      // For fun markets, random outcome weighted by odds (lower odds = more likely)
      return Math.random() < (1 / bet.odds) * 1.1
  }
  return false
}

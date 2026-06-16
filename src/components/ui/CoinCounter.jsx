import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/store/useStore'
import { formatCoins } from '@/utils/format'

export function CoinCounter() {
  const coins = useStore((s) => s.coins)
  const [display, setDisplay] = useState(coins)
  const [flash, setFlash] = useState(null) // 'up' | 'down' | null
  const prevRef = useRef(coins)

  useEffect(() => {
    const prev = prevRef.current
    if (prev === coins) return
    prevRef.current = coins

    const diff = coins - prev
    setFlash(diff > 0 ? 'up' : 'down')

    const steps = 20
    const inc = diff / steps
    let current = prev
    let i = 0
    const timer = setInterval(() => {
      current += inc
      i++
      setDisplay(Math.round(current))
      if (i >= steps) {
        clearInterval(timer)
        setDisplay(coins)
        setTimeout(() => setFlash(null), 600)
      }
    }, 25)

    return () => clearInterval(timer)
  }, [coins])

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-neon-gold text-lg">🪙</span>
      <span
        className={[
          'font-mono font-bold text-lg transition-colors duration-300',
          flash === 'up' ? 'text-neon-green' : flash === 'down' ? 'text-neon-red' : 'text-white',
        ].join(' ')}
      >
        {formatCoins(display)}
      </span>
    </div>
  )
}

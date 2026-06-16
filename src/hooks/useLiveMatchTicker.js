import { useEffect, useRef } from 'react'
import { useStore } from '@/store/useStore'

const TICK_MS = 8_000  // advance simulated minute every 8 seconds

export function useLiveMatchTicker() {
  const matches = useStore((s) => s.matches)
  const tickLiveMatch = useStore((s) => s.tickLiveMatch)
  const timerRef = useRef(null)

  useEffect(() => {
    function tick() {
      const liveMatches = matches.filter(
        (m) => m.status === 'IN_PLAY' || m.status === 'PAUSED'
      )
      liveMatches.forEach((m) => tickLiveMatch(m.id))
    }

    timerRef.current = setInterval(tick, TICK_MS)
    return () => clearInterval(timerRef.current)
  }, [matches, tickLiveMatch])
}

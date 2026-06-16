import confetti from 'canvas-confetti'

export function useConfetti() {
  function fire() {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#00d4ff', '#00ff88', '#ffd700', '#bf5af2'],
    })
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#00d4ff', '#00ff88'],
      })
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ffd700', '#bf5af2'],
      })
    }, 300)
  }

  return { fire }
}

const PREFIX = 'ms2026_c_'
const TTL_MS = 5 * 60 * 1000  // 5 minutes

export const apiCache = {
  get(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      if (!raw) return { hit: false, data: null, age: Infinity }
      const { data, ts } = JSON.parse(raw)
      const age = Date.now() - ts
      return { hit: age < TTL_MS, data, age }
    } catch {
      return { hit: false, data: null, age: Infinity }
    }
  },

  set(key, data) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify({ data, ts: Date.now() }))
    } catch (e) {
      console.warn('[apiCache] write failed:', e.message)
    }
  },

  clear() {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  },
}

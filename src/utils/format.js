import { format, formatDistanceToNow } from 'date-fns'
import { cs } from 'date-fns/locale'

export function formatOdds(odds) {
  if (!odds || odds <= 0) return '—'
  return odds.toFixed(2)
}

export function formatCoins(n) {
  return new Intl.NumberFormat('cs-CZ').format(Math.round(n))
}

export function formatDate(iso) {
  try {
    return format(new Date(iso), 'dd.MM. HH:mm', { locale: cs })
  } catch {
    return iso
  }
}

export function formatDateFull(iso) {
  try {
    return format(new Date(iso), 'EEEE d. MMMM yyyy', { locale: cs })
  } catch {
    return iso
  }
}

export function timeAgo(iso) {
  try {
    return formatDistanceToNow(new Date(iso), { locale: cs, addSuffix: true })
  } catch {
    return ''
  }
}

export function formatPotentialPayout(stake, odds) {
  return Math.round(stake * odds)
}

export function statusLabel(status) {
  switch (status) {
    case 'SCHEDULED': return 'Naplánováno'
    case 'TIMED': return 'Naplánováno'
    case 'IN_PLAY': return 'Živě'
    case 'PAUSED': return 'Pauza'
    case 'FINISHED': return 'Ukončeno'
    case 'SUSPENDED': return 'Přerušeno'
    case 'POSTPONED': return 'Odloženo'
    case 'CANCELLED': return 'Zrušeno'
    default: return status
  }
}

export function betStatusLabel(status) {
  switch (status) {
    case 'OPEN': return 'Otevřena'
    case 'WON': return 'Výhra'
    case 'LOST': return 'Prohra'
    case 'VOID': return 'Anulována'
    default: return status
  }
}

import { useRef, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { EVENT_ICONS } from '@/data/liveSimulator'
import { cn } from '@/utils/cn'

const EVENT_SIDE = {
  GOAL_HOME: 'home',
  YELLOW_HOME: 'home',
  RED_HOME: 'home',
  CORNER_HOME: 'home',
  GOAL_AWAY: 'away',
  YELLOW_AWAY: 'away',
  RED_AWAY: 'away',
  CORNER_AWAY: 'away',
  VAR: 'center',
}

const EVENT_COLOR = {
  GOAL_HOME: 'text-neon-green border-neon-green/40 bg-neon-green/10',
  GOAL_AWAY: 'text-neon-green border-neon-green/40 bg-neon-green/10',
  YELLOW_HOME: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10',
  YELLOW_AWAY: 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10',
  RED_HOME: 'text-neon-red border-neon-red/40 bg-neon-red/10',
  RED_AWAY: 'text-neon-red border-neon-red/40 bg-neon-red/10',
  CORNER_HOME: 'text-slate-400 border-slate-600 bg-slate-800/40',
  CORNER_AWAY: 'text-slate-400 border-slate-600 bg-slate-800/40',
  VAR: 'text-neon-purple border-neon-purple/40 bg-neon-purple/10',
}

const NOTABLE = new Set(['GOAL_HOME', 'GOAL_AWAY', 'RED_HOME', 'RED_AWAY', 'VAR'])

export function LiveTimeline({ matchId, compact = false }) {
  const match = useStore((s) => s.getMatchById(matchId))
  const allEvents = useStore((s) => s.getAllEvents(matchId))
  const minute = useStore((s) => s.getLiveMinute(matchId))
  const endRef = useRef(null)

  const visibleEvents = allEvents
    .filter((e) => e.minute <= (minute || 0))
    .filter((e) => compact ? NOTABLE.has(e.type) : true)
    .slice(-20) // show last 20 events max

  useEffect(() => {
    if (!compact) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [visibleEvents.length, compact])

  if (!match) return null

  const homeTeam = match.homeTeam?.name || 'Domácí'
  const awayTeam = match.awayTeam?.name || 'Hosté'

  if (visibleEvents.length === 0) {
    return (
      <div className="text-center text-xs text-slate-600 py-4">
        Žádné události zatím…
      </div>
    )
  }

  // Compact mode: horizontal strip for MatchCard
  if (compact) {
    return (
      <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
        {visibleEvents.map((ev, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs whitespace-nowrap shrink-0',
              EVENT_COLOR[ev.type] || 'text-slate-400 border-slate-700'
            )}
          >
            <span>{EVENT_ICONS[ev.type] || '•'}</span>
            <span className="font-mono font-semibold">{ev.minute}'</span>
          </div>
        ))}
      </div>
    )
  }

  // Full timeline mode for modal
  return (
    <div className="space-y-0 overflow-y-auto max-h-64 pr-1">
      {/* Half-time divider */}
      {visibleEvents.length > 0 && (
        <div className="flex items-center gap-2 py-2">
          <div className="h-px flex-1 bg-white/5" />
          <span className="text-[10px] text-slate-600 font-mono">KICKOFF</span>
          <div className="h-px flex-1 bg-white/5" />
        </div>
      )}

      {visibleEvents.map((ev, i) => {
        const side = EVENT_SIDE[ev.type] || 'center'
        const isHome = side === 'home'
        const isAway = side === 'away'
        const isCenter = side === 'center'
        const notable = NOTABLE.has(ev.type)

        // Insert HT divider
        const prevMin = visibleEvents[i - 1]?.minute || 0
        const showHT = prevMin <= 45 && ev.minute > 45

        return (
          <div key={i}>
            {showHT && (
              <div className="flex items-center gap-2 py-2 my-1">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] text-slate-500 font-mono px-2 py-0.5 rounded-full border border-white/10 bg-navy-800">
                  POLOČAS
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
            )}

            <div className={cn('flex items-center gap-2 py-1.5', isHome && 'flex-row', isAway && 'flex-row-reverse', isCenter && 'justify-center')}>
              {/* Team name */}
              <span className={cn('text-[10px] text-slate-500 w-20 shrink-0', isHome && 'text-right', isAway && 'text-left', isCenter && 'hidden')}>
                {isHome ? homeTeam : awayTeam}
              </span>

              {/* Event badge */}
              <div
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium',
                  EVENT_COLOR[ev.type] || 'text-slate-400 border-slate-700 bg-slate-800/30',
                  notable && 'shadow-sm'
                )}
              >
                <span>{EVENT_ICONS[ev.type] || '•'}</span>
                <span className="font-mono font-bold">{ev.minute}'</span>
                {notable && <span>{ev.label}</span>}
              </div>

              {/* Spacer */}
              <span className={cn('text-[10px] text-slate-500 w-20 shrink-0', isHome && 'text-left', isAway && 'text-right', isCenter && 'hidden')} />
            </div>
          </div>
        )
      })}

      <div ref={endRef} />
    </div>
  )
}

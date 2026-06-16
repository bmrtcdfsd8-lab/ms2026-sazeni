import { useState } from 'react'
import { ChevronDown, Lock, Zap } from 'lucide-react'
import { TeamFlag } from '@/components/ui/TeamFlag'
import { LiveBadge, StatusBadge } from '@/components/ui/LiveBadge'
import { OddsButton } from '@/components/betting/OddsButton'
import { BetMarketsModal } from '@/components/betting/BetMarketsModal'
import { LiveTimeline } from '@/components/live/LiveTimeline'
import { formatDate } from '@/utils/format'
import { isMatchLocked } from '@/utils/betting'
import { useStore } from '@/store/useStore'
import { STAGE_LABELS } from '@/data/ms2026'

export function MatchCard({ match, showGroup = true }) {
  const [modalOpen, setModalOpen] = useState(false)
  const odds = useStore((s) => s.getOddsForMatch(match.id))
  const liveOdds = useStore((s) => s.getLiveOdds(match.id))
  const liveScore = useStore((s) => s.getLiveScore(match.id))
  const minute = useStore((s) => s.getLiveMinute(match.id))

  const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED'
  const locked = isMatchLocked(match)
  const matchLabel = `${match.homeTeam?.name} vs ${match.awayTeam?.name}`

  // Use live score/odds when in-play, else static
  const displayScore = isLive ? (liveScore || match.score) : match.score
  const displayOdds = isLive ? (liveOdds || odds) : odds
  const displayMinute = isLive ? (minute || match.minute) : null

  return (
    <>
      <div
        className={[
          'rounded-xl border backdrop-blur-sm overflow-hidden transition-all group',
          isLive
            ? 'border-neon-red/40 bg-navy-800/70 shadow-[0_0_20px_rgba(255,45,85,0.07)]'
            : 'border-white/10 bg-navy-800/50 hover:border-white/20',
        ].join(' ')}
      >
        {/* Live pulsing top bar */}
        {isLive && (
          <div className="h-0.5 bg-gradient-to-r from-transparent via-neon-red to-transparent animate-pulse" />
        )}

        {/* Stage / Group header */}
        {showGroup && (
          <div className="px-4 py-2 bg-navy-900/50 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">
              {match.stage === 'GROUP' ? `Skupina ${match.group}` : STAGE_LABELS[match.stage]}
              {match.matchday ? ` · Kolo ${match.matchday}` : ''}
            </span>
            <div className="flex items-center gap-2">
              {isLive && (
                <span className="font-mono text-xs font-bold text-neon-red tabular-nums">
                  {displayMinute}'
                </span>
              )}
              <span className="text-xs text-slate-600">{formatDate(match.date)}</span>
            </div>
          </div>
        )}

        <div className="p-4">
          {/* Teams & Score */}
          <div className="flex items-center justify-between gap-2">
            {/* Home */}
            <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
              <TeamFlag team={match.homeTeam} size="lg" />
              <span
                className={[
                  'text-sm font-semibold text-center leading-tight',
                  isLive && displayScore && displayScore.home > displayScore.away
                    ? 'text-neon-green'
                    : 'text-white',
                ].join(' ')}
              >
                {match.homeTeam?.name || '?'}
              </span>
            </div>

            {/* Center */}
            <div className="flex flex-col items-center gap-1">
              {isLive && <LiveBadge minute={displayMinute} />}
              {displayScore ? (
                <div className="flex items-center gap-2 font-mono text-2xl font-bold">
                  <span className="text-white">{displayScore.home}</span>
                  <span className="text-slate-500">–</span>
                  <span className="text-white">{displayScore.away}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <StatusBadge status={match.status} />
                  <span className="text-xs text-slate-500 mt-1 font-mono">
                    {formatDate(match.date)}
                  </span>
                </div>
              )}
            </div>

            {/* Away */}
            <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
              <TeamFlag team={match.awayTeam} size="lg" />
              <span
                className={[
                  'text-sm font-semibold text-center leading-tight',
                  isLive && displayScore && displayScore.away > displayScore.home
                    ? 'text-neon-green'
                    : 'text-white',
                ].join(' ')}
              >
                {match.awayTeam?.name || '?'}
              </span>
            </div>
          </div>

          {/* Mini event timeline for live matches */}
          {isLive && (
            <div className="mt-3 pt-3 border-t border-white/5">
              <LiveTimeline matchId={match.id} compact />
            </div>
          )}

          {/* Quick odds — use live odds for live matches */}
          {displayOdds?.MATCH_WINNER && !locked && (
            <div className="flex gap-2 mt-3">
              <OddsButton
                matchId={match.id}
                matchLabel={matchLabel}
                marketType="MATCH_WINNER"
                marketLabel="Vítěz zápasu"
                selection="home"
                selectionLabel="1"
                odds={displayOdds.MATCH_WINNER.home}
                disabled={locked}
              />
              <OddsButton
                matchId={match.id}
                matchLabel={matchLabel}
                marketType="MATCH_WINNER"
                marketLabel="Vítěz zápasu"
                selection="draw"
                selectionLabel="X"
                odds={displayOdds.MATCH_WINNER.draw}
                disabled={locked}
              />
              <OddsButton
                matchId={match.id}
                matchLabel={matchLabel}
                marketType="MATCH_WINNER"
                marketLabel="Vítěz zápasu"
                selection="away"
                selectionLabel="2"
                odds={displayOdds.MATCH_WINNER.away}
                disabled={locked}
              />
            </div>
          )}

          {locked && !isLive && (
            <div className="flex items-center justify-center gap-2 mt-4 py-2 rounded-lg bg-slate-800/50 text-slate-500 text-xs">
              <Lock size={12} />
              <span>Sázky uzavřeny</span>
            </div>
          )}

          {/* More markets button */}
          <button
            onClick={() => setModalOpen(true)}
            className={[
              'w-full mt-3 py-2 rounded-lg border text-xs flex items-center justify-center gap-1 transition-colors',
              isLive
                ? 'border-neon-red/30 text-neon-red hover:bg-neon-red/10 hover:border-neon-red/60'
                : 'border-white/10 text-slate-400 hover:text-white hover:border-white/30',
            ].join(' ')}
          >
            {isLive ? <Zap size={12} /> : <ChevronDown size={14} />}
            {isLive ? 'Živé trhy' : 'Všechny trhy'}
          </button>
        </div>
      </div>

      {modalOpen && <BetMarketsModal matchId={match.id} onClose={() => setModalOpen(false)} />}
    </>
  )
}

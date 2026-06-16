import { useState, useEffect } from 'react'
import { X, Zap } from 'lucide-react'
import { TeamFlag } from '@/components/ui/TeamFlag'
import { OddsButton } from './OddsButton'
import { LiveBadge, StatusBadge } from '@/components/ui/LiveBadge'
import { LiveOddsChip } from '@/components/live/LiveOddsChip'
import { LiveTimeline } from '@/components/live/LiveTimeline'
import { getMarketsForMatch, MARKET_CATEGORIES, isMatchLocked } from '@/utils/betting'
import { getInPlayMarkets } from '@/data/liveSimulator'
import { formatDate } from '@/utils/format'
import { useStore } from '@/store/useStore'

const LIVE_CATEGORY = { id: 'live', label: '⚡ Živě' }

export function BetMarketsModal({ matchId, onClose }) {
  const match = useStore((s) => s.getMatchById(matchId))
  const baseOdds = useStore((s) => s.getOddsForMatch(matchId))
  const liveOdds = useStore((s) => s.getLiveOdds(matchId))
  const prevLiveOdds = useStore((s) => s.getPrevLiveOdds(matchId))
  const liveScore = useStore((s) => s.getLiveScore(matchId))
  const minute = useStore((s) => s.getLiveMinute(matchId))

  const isLive = match?.status === 'IN_PLAY' || match?.status === 'PAUSED'
  const isFinished = match?.status === 'FINISHED'

  const [activeCategory, setActiveCategory] = useState(isLive ? 'live' : 'standard')

  // Switch to live tab if match goes live while modal is open
  useEffect(() => {
    if (isLive && activeCategory === 'standard') setActiveCategory('live')
  }, [isLive])

  if (!match) return null

  const preLocked = isLive || isFinished  // pre-match markets locked once kicked off
  const liveLocked = isFinished           // live markets locked only when finished

  const displayScore = isLive ? (liveScore || match.score) : match.score
  const displayMinute = isLive ? (minute || match.minute) : null

  const preMarkets = getMarketsForMatch(match, baseOdds || {})
  const inPlayMarkets = isLive ? getInPlayMarkets(match, liveOdds || {}) : []

  const matchLabel = `${match.homeTeam?.name} vs ${match.awayTeam?.name}`

  const preCategories = MARKET_CATEGORIES.filter((cat) =>
    preMarkets.some((m) => m.category === cat.id)
  )
  const allCategories = isLive
    ? [LIVE_CATEGORY, ...preCategories]
    : preCategories

  const visibleMarkets =
    activeCategory === 'live'
      ? inPlayMarkets
      : preMarkets.filter((m) => m.category === activeCategory)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className={[
          'bg-navy-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border',
          isLive ? 'border-neon-red/30' : 'border-white/10',
        ].join(' ')}
      >
        {/* Pulsing top bar for live */}
        {isLive && (
          <div className="h-0.5 rounded-t-2xl bg-gradient-to-r from-transparent via-neon-red to-transparent animate-pulse" />
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <TeamFlag team={match.homeTeam} size="md" />
            <div>
              <div className="font-bold text-white">
                {match.homeTeam?.name} vs {match.awayTeam?.name}
              </div>
              <div className="text-xs text-slate-400">
                {formatDate(match.date)} · {match.venue}
              </div>
            </div>
            <TeamFlag team={match.awayTeam} size="md" />
          </div>
          <div className="flex items-center gap-3">
            {isLive && <LiveBadge minute={displayMinute} />}
            {!isLive && <StatusBadge status={match.status} />}
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Live scoreboard */}
        {(displayScore || isLive) && (
          <div className={[
            'border-b border-white/10 py-3',
            isLive ? 'bg-neon-red/5' : 'bg-navy-800/50',
          ].join(' ')}>
            <div className="flex items-center justify-center gap-8">
              {/* Home live odds */}
              {isLive && liveOdds?.MATCH_WINNER && (
                <LiveOddsChip
                  odds={liveOdds.MATCH_WINNER.home}
                  prevOdds={prevLiveOdds?.MATCH_WINNER?.home}
                  label={match.homeTeam?.name?.substring(0, 8)}
                />
              )}

              {/* Score */}
              <div className="flex items-center gap-4">
                <span className="font-mono text-4xl font-black text-white">
                  {displayScore?.home ?? 0}
                </span>
                <span className="text-slate-500 text-2xl">–</span>
                <span className="font-mono text-4xl font-black text-white">
                  {displayScore?.away ?? 0}
                </span>
              </div>

              {/* Away live odds */}
              {isLive && liveOdds?.MATCH_WINNER && (
                <LiveOddsChip
                  odds={liveOdds.MATCH_WINNER.away}
                  prevOdds={prevLiveOdds?.MATCH_WINNER?.away}
                  label={match.awayTeam?.name?.substring(0, 8)}
                />
              )}
            </div>

            {/* Draw odds + next goal preview */}
            {isLive && liveOdds && (
              <div className="flex items-center justify-center gap-4 mt-2">
                <LiveOddsChip
                  odds={liveOdds.MATCH_WINNER?.draw}
                  prevOdds={prevLiveOdds?.MATCH_WINNER?.draw}
                  label="Remíza"
                />
                {liveOdds.NEXT_GOAL && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Zap size={10} className="text-neon-red" />
                    Příští gól:
                    <span className="text-neon-gold font-mono">
                      {[
                        match.homeTeam?.name?.substring(0, 5),
                        liveOdds.NEXT_GOAL.home?.toFixed(2),
                      ].join(' ')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Locked notice for pre-match */}
        {preLocked && activeCategory !== 'live' && (
          <div className="flex items-center gap-2 px-5 py-2 bg-yellow-500/10 border-b border-yellow-500/20">
            <span className="text-yellow-400 text-xs">
              🔒 Předzápasové trhy uzavřeny — používej záložku <strong>⚡ Živě</strong>
            </span>
          </div>
        )}

        {/* Category tabs */}
        <div className="flex gap-1 p-3 border-b border-white/10 overflow-x-auto">
          {allCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={[
                'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors',
                activeCategory === cat.id
                  ? cat.id === 'live'
                    ? 'bg-neon-red/20 text-neon-red border border-neon-red/50'
                    : 'bg-neon-blue/20 text-neon-blue border border-neon-blue/50'
                  : 'text-slate-400 hover:text-white border border-transparent hover:border-white/20',
              ].join(' ')}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Live timeline (shown at top of live tab) */}
        {activeCategory === 'live' && isLive && (
          <div className="px-5 py-3 border-b border-white/5 bg-navy-900/40">
            <div className="text-xs text-slate-500 font-semibold mb-2 uppercase tracking-wider">
              Průběh zápasu
            </div>
            <LiveTimeline matchId={matchId} compact={false} />
          </div>
        )}

        {/* Markets */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {visibleMarkets.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">
              {activeCategory === 'live' && !isLive
                ? 'Živé trhy budou dostupné po výkopu'
                : 'Žádné trhy k dispozici'}
            </div>
          )}

          {visibleMarkets.map((market) => {
            const marketLocked = activeCategory === 'live' ? liveLocked : preLocked
            return (
              <div key={market.id} className="rounded-xl border border-white/10 bg-navy-800/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-white">{market.label}</span>
                  <div className="flex items-center gap-2">
                    {market.badge && (
                      <span
                        className={[
                          'text-xs px-2 py-0.5 rounded-full border font-bold',
                          market.badge === 'ŽIVĚ'
                            ? 'bg-neon-red/20 text-neon-red border-neon-red/40'
                            : 'bg-neon-purple/20 text-neon-purple border-neon-purple/30',
                        ].join(' ')}
                      >
                        {market.badge}
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className={[
                    'flex flex-wrap gap-2',
                    market.options.length > 8 ? 'grid grid-cols-4' : '',
                  ].join(' ')}
                >
                  {market.options.map((opt) => (
                    <OddsButton
                      key={opt.key}
                      matchId={matchId}
                      matchLabel={matchLabel}
                      marketType={market.id}
                      marketLabel={market.label}
                      selection={opt.key}
                      selectionLabel={opt.label}
                      odds={opt.odds}
                      disabled={marketLocked}
                      isLiveBet={activeCategory === 'live'}
                      placedAtMinute={displayMinute}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

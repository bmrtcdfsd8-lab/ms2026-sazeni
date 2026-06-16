import { useState } from 'react'
import { Zap, ChevronRight } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { TeamFlag } from '@/components/ui/TeamFlag'
import { LiveTimeline } from './LiveTimeline'
import { LiveOddsChip } from './LiveOddsChip'
import { BetMarketsModal } from '@/components/betting/BetMarketsModal'

export function LiveBettingHub({ matches }) {
  const [selectedMatch, setSelectedMatch] = useState(null)

  if (matches.length === 0) return null

  return (
    <section className="relative">
      {/* Pulsing section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Animated live dot */}
          <div className="relative flex items-center justify-center w-8 h-8">
            <span className="absolute inline-flex h-full w-full rounded-full bg-neon-red opacity-40 animate-ping" />
            <span className="relative inline-flex w-4 h-4 rounded-full bg-neon-red" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Živé sázení</h2>
              <span className="px-2 py-0.5 rounded-full bg-neon-red/20 border border-neon-red/40 text-neon-red text-xs font-bold animate-pulse">
                {matches.length} ŽIVĚ
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Kurzy se aktualizují každých 8 sekund</p>
          </div>
        </div>
      </div>

      {/* Live match cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {matches.map((match) => (
          <LiveMatchCard
            key={match.id}
            match={match}
            onOpenMarkets={() => setSelectedMatch(match.id)}
          />
        ))}
      </div>

      {selectedMatch && (
        <BetMarketsModal matchId={selectedMatch} onClose={() => setSelectedMatch(null)} />
      )}
    </section>
  )
}

function LiveMatchCard({ match, onOpenMarkets }) {
  const liveOdds = useStore((s) => s.getLiveOdds(match.id))
  const prevOdds = useStore((s) => s.getPrevLiveOdds(match.id))
  const liveScore = useStore((s) => s.getLiveScore(match.id))
  const minute = useStore((s) => s.getLiveMinute(match.id))

  const displayScore = liveScore || match.score || { home: 0, away: 0 }
  const displayMinute = minute || match.minute || 0

  const mw = liveOdds?.MATCH_WINNER
  const prevMw = prevOdds?.MATCH_WINNER

  return (
    <div className="relative rounded-2xl overflow-hidden border border-neon-red/30 bg-navy-800/70 backdrop-blur-sm shadow-[0_0_30px_rgba(255,45,85,0.08)]">
      {/* Pulsing top border */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-neon-red to-transparent animate-pulse" />

      {/* Header: stage + minute */}
      <div className="flex items-center justify-between px-4 py-2 bg-neon-red/5 border-b border-neon-red/10">
        <div className="flex items-center gap-2">
          <Zap size={12} className="text-neon-red" />
          <span className="text-xs text-neon-red font-bold">
            {match.stage === 'GROUP' ? `Skupina ${match.group}` : 'Pavouk'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Live clock */}
          <span className="font-mono text-sm font-bold text-white tabular-nums">
            {displayMinute}'
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-neon-red animate-ping" />
        </div>
      </div>

      {/* Score board */}
      <div className="flex items-center justify-between px-5 py-4 gap-3">
        <TeamSection team={match.homeTeam} score={displayScore.home} isWinning={displayScore.home > displayScore.away} />

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-3 font-mono text-4xl font-black">
            <ScoreDigit value={displayScore.home} />
            <span className="text-slate-600 text-3xl">–</span>
            <ScoreDigit value={displayScore.away} />
          </div>
          <span className="text-[10px] text-slate-600 tracking-widest">ČAS ŽIVĚ</span>
        </div>

        <TeamSection team={match.awayTeam} score={displayScore.away} isWinning={displayScore.away > displayScore.home} align="right" />
      </div>

      {/* Live odds strip */}
      {mw && (
        <div className="flex items-center justify-center gap-3 px-4 pb-3">
          <LiveOddsChip
            odds={mw.home}
            prevOdds={prevMw?.home}
            label={match.homeTeam?.name?.substring(0, 6) || '1'}
          />
          <LiveOddsChip
            odds={mw.draw}
            prevOdds={prevMw?.draw}
            label="Remíza"
          />
          <LiveOddsChip
            odds={mw.away}
            prevOdds={prevMw?.away}
            label={match.awayTeam?.name?.substring(0, 6) || '2'}
          />
        </div>
      )}

      {/* Mini timeline */}
      <div className="px-4 pb-2 border-t border-white/5 pt-2">
        <LiveTimeline matchId={match.id} compact />
      </div>

      {/* CTA */}
      <button
        onClick={onOpenMarkets}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-neon-red/10 hover:bg-neon-red/20 border-t border-neon-red/20 transition-colors text-neon-red text-sm font-bold"
      >
        <Zap size={14} />
        Otevřít živé trhy
        <ChevronRight size={14} />
      </button>
    </div>
  )
}

function TeamSection({ team, score, isWinning, align = 'left' }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 flex-1 min-w-0 ${align === 'right' ? 'items-end' : 'items-start'}`}>
      <TeamFlag team={team} size="lg" />
      <span
        className={`text-sm font-bold leading-tight text-center ${
          isWinning ? 'text-neon-green' : 'text-white'
        }`}
      >
        {team?.name || '?'}
      </span>
      {isWinning && (
        <span className="text-[9px] text-neon-green font-bold tracking-wider">VEDE</span>
      )}
    </div>
  )
}

function ScoreDigit({ value }) {
  return (
    <span className="text-white tabular-nums">{value ?? 0}</span>
  )
}

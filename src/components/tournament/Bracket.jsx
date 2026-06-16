import { useState } from 'react'
import { TeamFlag } from '@/components/ui/TeamFlag'
import { BetMarketsModal } from '@/components/betting/BetMarketsModal'
import { useStore } from '@/store/useStore'

function BracketMatch({ match, onClick }) {
  const home = match?.homeTeam
  const away = match?.awayTeam

  return (
    <div
      onClick={() => match?.homeTeam && match?.awayTeam && onClick?.(match)}
      className={[
        'rounded-lg border bg-navy-800/60 overflow-hidden transition-all',
        home && away
          ? 'border-white/20 cursor-pointer hover:border-neon-blue/50 hover:bg-navy-700/60'
          : 'border-white/5 opacity-40',
      ].join(' ')}
      style={{ minWidth: 160 }}
    >
      <TeamRow team={home} score={match?.score?.home} />
      <div className="h-px bg-white/10" />
      <TeamRow team={away} score={match?.score?.away} />
    </div>
  )
}

function TeamRow({ team, score }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      {team ? (
        <>
          <TeamFlag team={team} size="sm" />
          <span className="text-xs text-white flex-1 truncate">{team.name}</span>
          {score !== undefined && score !== null && (
            <span className="text-xs font-bold font-mono text-neon-gold">{score}</span>
          )}
        </>
      ) : (
        <>
          <span className="w-5 h-4 rounded bg-navy-700 inline-block" />
          <span className="text-xs text-slate-600 italic">TBD</span>
        </>
      )}
    </div>
  )
}

function ConnectorV({ height = 40 }) {
  return <div style={{ width: 2, height, background: 'rgba(255,255,255,0.1)', margin: '0 auto' }} />
}

function ConnectorH() {
  return <div style={{ width: 24, height: 2, background: 'rgba(255,255,255,0.1)', alignSelf: 'center' }} />
}

export function TournamentBracket() {
  const [modalMatch, setModalMatch] = useState(null)
  const matches = useStore((s) => s.matches)

  const r32 = matches.filter((m) => m.stage === 'ROUND_OF_32')
  const r16 = matches.filter((m) => m.stage === 'ROUND_OF_16')
  const qf = matches.filter((m) => m.stage === 'QUARTER_FINAL')
  const sf = matches.filter((m) => m.stage === 'SEMI_FINAL')
  const final = matches.filter((m) => m.stage === 'FINAL')

  return (
    <>
      <div className="overflow-x-auto pb-6">
        <div className="flex items-stretch gap-0 min-w-[900px]">
          {/* R32 left half */}
          <BracketColumn
            matches={r32.slice(0, 8)}
            label="Kolo 32"
            onMatchClick={setModalMatch}
          />
          <BracketConnectors count={4} />

          {/* R16 left */}
          <BracketColumn
            matches={r16.slice(0, 4)}
            label="Osmifinále"
            onMatchClick={setModalMatch}
          />
          <BracketConnectors count={2} />

          {/* QF left */}
          <BracketColumn
            matches={qf.slice(0, 2)}
            label="Čtvrtfinále"
            onMatchClick={setModalMatch}
          />
          <BracketConnectors count={1} />

          {/* SF left */}
          <BracketColumn
            matches={sf.slice(0, 1)}
            label="Semifinále"
            onMatchClick={setModalMatch}
          />
          <BracketConnectors count={0} final />

          {/* Final */}
          <div className="flex flex-col items-center justify-center px-2 gap-4">
            <span className="text-xs font-bold text-neon-gold tracking-widest uppercase mb-2">
              Finále
            </span>
            {final[0] ? (
              <BracketMatch match={final[0]} onClick={setModalMatch} />
            ) : (
              <BracketMatch match={null} />
            )}
            <div className="text-center">
              <div className="text-xs text-slate-500">26. 7. 2026</div>
              <div className="text-xs text-slate-600">MetLife Stadium, NY</div>
            </div>
          </div>

          <BracketConnectors count={0} final />

          {/* SF right */}
          <BracketColumn
            matches={sf.slice(1, 2)}
            label="Semifinále"
            onMatchClick={setModalMatch}
            mirrored
          />
          <BracketConnectors count={1} mirrored />

          {/* QF right */}
          <BracketColumn
            matches={qf.slice(2, 4)}
            label="Čtvrtfinále"
            onMatchClick={setModalMatch}
            mirrored
          />
          <BracketConnectors count={2} mirrored />

          {/* R16 right */}
          <BracketColumn
            matches={r16.slice(4, 8)}
            label="Osmifinále"
            onMatchClick={setModalMatch}
            mirrored
          />
          <BracketConnectors count={4} mirrored />

          {/* R32 right half */}
          <BracketColumn
            matches={r32.slice(8, 16)}
            label="Kolo 32"
            onMatchClick={setModalMatch}
            mirrored
          />
        </div>
      </div>

      {modalMatch && (
        <BetMarketsModal matchId={modalMatch.id} onClose={() => setModalMatch(null)} />
      )}
    </>
  )
}

function BracketColumn({ matches, label, onMatchClick, mirrored = false }) {
  if (matches.length === 0) return null
  const gap = 16

  return (
    <div className={`flex flex-col ${mirrored ? 'items-end' : 'items-start'}`} style={{ minWidth: 168 }}>
      <div className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-3 px-2">{label}</div>
      <div className="flex flex-col gap-4 w-full">
        {matches.map((m, i) => (
          <BracketMatch key={m?.id || i} match={m} onClick={onMatchClick} />
        ))}
      </div>
    </div>
  )
}

function BracketConnectors({ count, final = false, mirrored = false }) {
  if (final) return <div style={{ width: 16 }} />
  return (
    <div
      className="flex flex-col justify-around"
      style={{ width: 20, paddingTop: 40, paddingBottom: 4 }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ height: 2, background: 'rgba(255,255,255,0.08)' }} />
      ))}
    </div>
  )
}

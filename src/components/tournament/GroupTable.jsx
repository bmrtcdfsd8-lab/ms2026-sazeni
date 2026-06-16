import { TeamFlag } from '@/components/ui/TeamFlag'
import { Skeleton } from '@/components/ui/Skeleton'

function QualificationDot({ rank }) {
  if (rank <= 2) return <span className="w-2 h-2 rounded-full bg-neon-green inline-block" title="Postup" />
  if (rank === 3) return <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" title="Možný postup" />
  return <span className="w-2 h-2 rounded-full bg-neon-red inline-block" title="Vyřazen" />
}

// standing: { group: 'A', table: [{position, team, playedGames, won, draw, lost, points, goalsFor, goalsAgainst}] }
export function GroupTable({ standing, onTeamClick }) {
  const { group, table } = standing

  return (
    <div className="rounded-xl border border-white/10 bg-navy-800/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-navy-900/60 border-b border-white/10 flex items-center justify-between">
        <span className="font-bold text-white text-sm">Skupina {group}</span>
        <span className="text-xs text-slate-500">{table.length} týmů</span>
      </div>

      {/* Table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-slate-500 border-b border-white/5">
            <th className="px-3 py-2 text-left w-6">#</th>
            <th className="px-2 py-2 text-left">Tým</th>
            <th className="px-2 py-2 text-center">Z</th>
            <th className="px-2 py-2 text-center">V</th>
            <th className="px-2 py-2 text-center">R</th>
            <th className="px-2 py-2 text-center">P</th>
            <th className="px-2 py-2 text-center">GR</th>
            <th className="px-2 py-2 text-center font-bold text-white">B</th>
          </tr>
        </thead>
        <tbody>
          {table.map((row, idx) => (
            <tr
              key={row.team?.id || idx}
              className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer"
              onClick={() => onTeamClick?.(row.team)}
            >
              <td className="px-3 py-2.5 text-slate-500 text-center">
                <QualificationDot rank={idx + 1} />
              </td>
              <td className="px-2 py-2.5">
                <div className="flex items-center gap-2">
                  <TeamFlag team={row.team} size="sm" />
                  <span className="text-white font-medium text-xs">{row.team?.name}</span>
                </div>
              </td>
              <td className="px-2 py-2.5 text-center text-slate-400">{row.playedGames}</td>
              <td className="px-2 py-2.5 text-center text-slate-400">{row.won}</td>
              <td className="px-2 py-2.5 text-center text-slate-400">{row.draw}</td>
              <td className="px-2 py-2.5 text-center text-slate-400">{row.lost}</td>
              <td className="px-2 py-2.5 text-center text-slate-400">
                {row.goalsFor}:{row.goalsAgainst}
              </td>
              <td className="px-2 py-2.5 text-center font-bold text-white">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-white/5 text-xs text-slate-500">
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neon-green inline-block" /> Postup</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Playoff</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neon-red inline-block" /> Vyřazen</div>
      </div>
    </div>
  )
}

export function GroupTableSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-navy-800/50 overflow-hidden">
      <div className="px-4 py-3 bg-navy-900/60 border-b border-white/10">
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="p-3 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </div>
  )
}

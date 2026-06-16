import { useState } from 'react'
import { Grid3x3, GitMerge, Loader2, WifiOff } from 'lucide-react'
import { GroupTable, GroupTableSkeleton } from '@/components/tournament/GroupTable'
import { TournamentBracket } from '@/components/tournament/Bracket'
import { useStore } from '@/store/useStore'
import { MatchCard } from '@/components/matches/MatchCard'
import { TeamFlag } from '@/components/ui/TeamFlag'

export function Tournament() {
  const [view, setView] = useState('groups')
  const [selectedTeam, setSelectedTeam] = useState(null)

  const matches    = useStore((s) => s.matches)
  const standings  = useStore((s) => s.standings)
  const isLoading  = useStore((s) => s.isLoading)
  const fetchError = useStore((s) => s.fetchError)

  const teamMatches = selectedTeam
    ? matches.filter(
        (m) => m.homeTeam?.id === selectedTeam.id || m.awayTeam?.id === selectedTeam.id
      )
    : []

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Turnaj MS 2026</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {standings.length > 0
              ? `${standings.length} skupin · ${matches.length} zápasů`
              : 'Načítám data turnaje…'}
          </p>
        </div>

        <div className="flex items-center gap-1 bg-navy-800 rounded-xl p-1 border border-white/10">
          {[
            { id: 'groups', label: 'Skupiny', Icon: Grid3x3 },
            { id: 'bracket', label: 'Pavouk', Icon: GitMerge },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={[
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                view === id
                  ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                  : 'text-slate-400 hover:text-white',
              ].join(' ')}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* API error banner */}
      {fetchError && (
        <div className="flex items-center gap-3 rounded-xl border border-neon-red/30 bg-neon-red/5 px-4 py-3">
          <WifiOff size={16} className="text-neon-red shrink-0" />
          <div>
            <div className="text-sm font-semibold text-white">Chyba načítání dat</div>
            <div className="text-xs text-slate-400 mt-0.5">{fetchError}</div>
          </div>
        </div>
      )}

      {view === 'groups' && (
        <div className="space-y-6">
          {/* Selected team panel */}
          {selectedTeam && (
            <div className="rounded-xl border border-neon-blue/30 bg-neon-blue/5 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <TeamFlag team={selectedTeam} size="md" />
                  <h3 className="font-bold text-white">Zápasy — {selectedTeam.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedTeam(null)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕ Zavřít
                </button>
              </div>
              {teamMatches.length === 0 ? (
                <p className="text-slate-500 text-sm">Žádné zápasy k zobrazení</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {teamMatches.map((m) => <MatchCard key={m.id} match={m} />)}
                </div>
              )}
            </div>
          )}

          {/* Groups grid */}
          {isLoading && standings.length === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 12 }).map((_, i) => <GroupTableSkeleton key={i} />)}
            </div>
          ) : standings.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-4xl mb-3">🏆</div>
              <div className="text-white font-semibold mb-1">Skupiny zatím nejsou k dispozici</div>
              <div className="text-slate-500 text-sm">
                Tabulky skupin se zobrazí po zahájení skupinové fáze turnaje.
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {standings.map((s) => (
                <GroupTable key={s.group} standing={s} onTeamClick={setSelectedTeam} />
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'bracket' && (
        <div>
          <div className="mb-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-400">
            💡 Pavouk se naplní průběžně jak skupinová fáze pokračuje. Klikni na zápas pro sázení.
          </div>
          <TournamentBracket />
        </div>
      )}
    </div>
  )
}

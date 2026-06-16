import { useMemo } from 'react'
import { Clock, CheckCircle, Loader2, WifiOff } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { MatchCard } from '@/components/matches/MatchCard'
import { MatchCardSkeleton } from '@/components/ui/Skeleton'
import { LiveBettingHub } from '@/components/live/LiveBettingHub'

export function Home() {
  const matches    = useStore((s) => s.matches)
  const isLoading  = useStore((s) => s.isLoading)
  const fetchError = useStore((s) => s.fetchError)
  const lastFetch  = useStore((s) => s.lastFetch)

  const liveMatches = useMemo(
    () => matches.filter((m) => m.status === 'IN_PLAY' || m.status === 'PAUSED'),
    [matches]
  )
  const upcomingMatches = useMemo(
    () => matches.filter((m) => m.status === 'SCHEDULED' || m.status === 'TIMED').slice(0, 12),
    [matches]
  )
  const recentMatches = useMemo(
    () => matches.filter((m) => m.status === 'FINISHED').slice(0, 6),
    [matches]
  )

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-navy-800 to-navy-900 border border-white/10 p-8 text-center">
        <div className="absolute inset-0 bg-gradient-radial from-neon-blue/5 via-transparent to-transparent" />
        <div className="relative">
          <div className="text-5xl mb-3">⚽</div>
          <h1 className="text-3xl font-bold text-white mb-2">MS 2026 — Světový pohár</h1>
          <p className="text-slate-400 text-sm">USA · Kanada · Mexiko · 48 týmů · 104 zápasů</p>
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-500">
            <span>🗓 11.6. – 26.7.2026</span>
            <span>🏆 Virtuální sázky</span>
            <span>🪙 Začínáš s 2000 mincemi</span>
          </div>
        </div>
      </div>

      {/* API error */}
      {fetchError && !isLoading && (
        <div className="flex items-start gap-3 rounded-xl border border-neon-red/30 bg-neon-red/5 px-4 py-3">
          <WifiOff size={16} className="text-neon-red shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-white">Nepodařilo se načíst data z API</div>
            <div className="text-xs text-slate-400 mt-1 font-mono">{fetchError}</div>
            <div className="text-xs text-slate-500 mt-1">
              Zkontroluj klíče v <code className="text-neon-blue">.env.local</code> a zda je turnaj spuštěn na football-data.org.
            </div>
          </div>
        </div>
      )}

      {/* ── Live betting hub ── */}
      {liveMatches.length > 0 && <LiveBettingHub matches={liveMatches} />}

      {/* ── No live matches notice ── */}
      {!isLoading && liveMatches.length === 0 && matches.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-navy-800/30 px-4 py-3">
          <span className="text-slate-600 text-lg">📺</span>
          <span className="text-slate-500 text-sm">Žádné živé zápasy právě teď</span>
        </div>
      )}

      {/* ── Upcoming ── */}
      <section>
        <SectionHeader
          icon={<Clock size={16} className="text-neon-blue" />}
          title="Nadcházející zápasy"
          count={upcomingMatches.length}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading && upcomingMatches.length === 0
            ? Array.from({ length: 6 }).map((_, i) => <MatchCardSkeleton key={i} />)
            : upcomingMatches.length === 0 && !isLoading
            ? <EmptyState icon="🗓" text="Žádné nadcházející zápasy" />
            : upcomingMatches.map((m) => <MatchCard key={m.id} match={m} />)}
        </div>
      </section>

      {/* ── Recent results ── */}
      {(recentMatches.length > 0 || (!isLoading && matches.length > 0)) && (
        <section>
          <SectionHeader
            icon={<CheckCircle size={16} className="text-neon-green" />}
            title="Poslední výsledky"
            count={recentMatches.length}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentMatches.length === 0 ? (
              <EmptyState icon="✅" text="Žádné odehrané zápasy" />
            ) : (
              recentMatches.map((m) => <MatchCard key={m.id} match={m} />)
            )}
          </div>
        </section>
      )}

      {/* Initial full-page loading state */}
      {isLoading && matches.length === 0 && !fetchError && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 size={32} className="text-neon-blue animate-spin" />
          <p className="text-slate-400 text-sm">Načítám data turnaje z football-data.org…</p>
        </div>
      )}
    </div>
  )
}

function SectionHeader({ icon, title, count }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h2 className="font-bold text-white">{title}</h2>
      <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{count}</span>
    </div>
  )
}

function EmptyState({ icon, text }) {
  return (
    <div className="col-span-full text-center py-10 text-slate-600">
      <span className="text-3xl block mb-2">{icon}</span>
      {text}
    </div>
  )
}

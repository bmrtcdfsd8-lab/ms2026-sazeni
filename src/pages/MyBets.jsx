import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { formatOdds, formatDate, betStatusLabel, formatCoins, timeAgo } from '@/utils/format'
import { TeamFlag } from '@/components/ui/TeamFlag'
import { TrendingUp, TrendingDown, Clock, Archive } from 'lucide-react'

export function MyBets() {
  const bets = useStore((s) => s.bets)
  const matches = useStore((s) => s.matches)
  const transactions = useStore((s) => s.transactions)
  const [tab, setTab] = useState('open')

  const openBets = bets.filter((b) => b.status === 'OPEN')
  const wonBets = bets.filter((b) => b.status === 'WON')
  const lostBets = bets.filter((b) => b.status === 'LOST')
  const settledBets = bets.filter((b) => b.status !== 'OPEN')

  const totalWon = wonBets.reduce((s, b) => s + b.potentialPayout, 0)
  const totalStaked = bets.reduce((s, b) => s + b.stake, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Moje sázky</h1>
        <p className="text-slate-400 text-sm mt-0.5">Přehled všech vašich sázek</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Celkem vsazeno" value={`${formatCoins(totalStaked)} 🪙`} />
        <StatCard label="Výhry" value={formatCoins(totalWon)} sub="mincí získáno" accent="green" />
        <StatCard label="Výherní sázky" value={wonBets.length} sub={`z ${settledBets.length} ukončených`} />
        <StatCard label="Otevřené sázky" value={openBets.length} accent="blue" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-navy-800 rounded-xl p-1 border border-white/10 w-fit">
        {[
          { id: 'open', label: 'Otevřené', count: openBets.length, icon: Clock },
          { id: 'settled', label: 'Ukončené', count: settledBets.length, icon: Archive },
          { id: 'history', label: 'Historie', count: transactions.length, icon: TrendingUp },
        ].map(({ id, label, count, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === id
                ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                : 'text-slate-400 hover:text-white',
            ].join(' ')}
          >
            <Icon size={14} />
            {label}
            <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded-full">{count}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'open' && (
        <BetList bets={openBets} matches={matches} emptyMsg="Žádné otevřené sázky" />
      )}
      {tab === 'settled' && (
        <BetList bets={settledBets} matches={matches} emptyMsg="Žádné ukončené sázky" />
      )}
      {tab === 'history' && (
        <TransactionList transactions={transactions} />
      )}
    </div>
  )
}

function StatCard({ label, value, sub, accent }) {
  const accentCls =
    accent === 'green' ? 'text-neon-green' : accent === 'blue' ? 'text-neon-blue' : 'text-white'
  return (
    <div className="rounded-xl border border-white/10 bg-navy-800/50 p-4">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-xl font-bold font-mono ${accentCls}`}>{value}</div>
      {sub && <div className="text-xs text-slate-600 mt-0.5">{sub}</div>}
    </div>
  )
}

function BetList({ bets, matches, emptyMsg }) {
  if (bets.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <span className="text-4xl block mb-3">🎰</span>
        {emptyMsg}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {bets.map((bet) => {
        const match = matches.find((m) => m.id === bet.matchId)
        return <BetCard key={bet.id} bet={bet} match={match} />
      })}
    </div>
  )
}

function BetCard({ bet, match }) {
  const statusColors = {
    OPEN: 'border-neon-blue/30 bg-neon-blue/5',
    WON: 'border-neon-green/30 bg-neon-green/5',
    LOST: 'border-neon-red/20 bg-neon-red/5',
    VOID: 'border-slate-600 bg-slate-800/20',
  }

  const statusBadge = {
    OPEN: <span className="text-xs px-2 py-0.5 rounded-full bg-neon-blue/20 text-neon-blue border border-neon-blue/30">Otevřena</span>,
    WON: <span className="text-xs px-2 py-0.5 rounded-full bg-neon-green/20 text-neon-green border border-neon-green/30">✓ Výhra</span>,
    LOST: <span className="text-xs px-2 py-0.5 rounded-full bg-neon-red/20 text-neon-red border border-neon-red/30">✗ Prohra</span>,
    VOID: <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">Anulována</span>,
  }

  return (
    <div className={`rounded-xl border p-4 transition-all ${statusColors[bet.status] || statusColors.OPEN}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {statusBadge[bet.status]}
            <span className="text-xs text-slate-500">{timeAgo(bet.placedAt)}</span>
          </div>
          <div className="text-xs text-slate-400">{bet.matchLabel}</div>
          <div className="font-semibold text-white text-sm mt-0.5">{bet.marketLabel}</div>
          <div className="text-sm text-slate-300">{bet.selectionLabel}</div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-neon-gold font-bold font-mono">{formatOdds(bet.odds)}</div>
          <div className="text-xs text-slate-400 mt-1">
            Sázka: <span className="text-white font-mono">{formatCoins(bet.stake)} 🪙</span>
          </div>
          <div className={`text-sm font-bold font-mono mt-1 ${bet.status === 'WON' ? 'text-neon-green' : bet.status === 'LOST' ? 'text-slate-600 line-through' : 'text-slate-300'}`}>
            {bet.status === 'WON' ? '+' : ''}{formatCoins(bet.potentialPayout)} 🪙
          </div>
        </div>
      </div>

      {/* Match info */}
      {match && match.homeTeam && match.awayTeam && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
          <TeamFlag team={match.homeTeam} size="sm" />
          <span className="text-xs text-slate-400">{match.homeTeam?.name}</span>
          {match.score && (
            <span className="text-xs font-mono text-white">
              {match.score.home} – {match.score.away}
            </span>
          )}
          <span className="text-xs text-slate-400">{match.awayTeam?.name}</span>
          <TeamFlag team={match.awayTeam} size="sm" />
        </div>
      )}
    </div>
  )
}

function TransactionList({ transactions }) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <span className="text-4xl block mb-3">📋</span>
        Žádné transakce
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/5 bg-navy-800/30 hover:bg-navy-800/60 transition-colors"
        >
          <div>
            <div className="text-sm text-white">{tx.description}</div>
            <div className="text-xs text-slate-500">{timeAgo(tx.timestamp)}</div>
          </div>
          <div className="text-right">
            <div
              className={`font-mono font-bold ${tx.amount > 0 ? 'text-neon-green' : 'text-neon-red'}`}
            >
              {tx.amount > 0 ? '+' : ''}{formatCoins(tx.amount)} 🪙
            </div>
            <div className="text-xs text-slate-500 font-mono">{formatCoins(tx.balance)} celkem</div>
          </div>
        </div>
      ))}
    </div>
  )
}

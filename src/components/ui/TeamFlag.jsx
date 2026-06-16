import { getFlagUrl } from '@/data/ms2026'

export function TeamFlag({ team, size = 'md' }) {
  const sizes = { sm: 'w-5 h-4', md: 'w-7 h-5', lg: 'w-10 h-7', xl: 'w-14 h-10' }
  if (!team) return <span className={`${sizes[size]} bg-slate-700 rounded inline-block`} />

  // Prefer team crest from API, fallback to flagcdn using TLA
  const tla = team.tla || team.id || ''
  const src = team.crest || getFlagUrl(tla)

  return (
    <img
      src={src}
      alt={team.name || tla}
      className={`${sizes[size]} object-cover rounded shadow-sm inline-block bg-slate-800`}
      onError={(e) => {
        // If crest fails, try flagcdn
        if (!e.target.src.includes('flagcdn.com')) {
          e.target.src = getFlagUrl(tla)
        } else {
          e.target.style.display = 'none'
        }
      }}
    />
  )
}

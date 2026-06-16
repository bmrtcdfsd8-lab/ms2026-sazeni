import { cn } from '@/utils/cn'

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-lg bg-gradient-to-r from-navy-800 via-navy-700 to-navy-800 bg-[length:200%_100%] animate-shimmer',
        className
      )}
      {...props}
    />
  )
}

export function MatchCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-navy-800/50 p-4 space-y-3">
      <Skeleton className="h-4 w-24" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-6 w-28" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
      </div>
    </div>
  )
}

function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-slate-800 rounded-xl animate-pulse ${className}`} />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
      <SkeletonBlock className="w-5 h-5 rounded-full flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <SkeletonBlock className="h-3.5 w-3/4" />
        <SkeletonBlock className="h-2.5 w-1/3" />
      </div>
      <SkeletonBlock className="w-6 h-6 rounded-lg" />
    </div>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonStat() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <SkeletonBlock className="h-2.5 w-16 mb-2" />
      <SkeletonBlock className="h-6 w-24 mb-1" />
      <SkeletonBlock className="h-2 w-12" />
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <SkeletonBlock className="h-3 w-28" />
          <SkeletonBlock className="h-6 w-36" />
        </div>
        <SkeletonBlock className="w-8 h-8 rounded-full" />
      </div>
      <SkeletonBlock className="h-16 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

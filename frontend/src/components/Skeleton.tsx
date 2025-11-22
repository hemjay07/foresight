/**
 * Skeleton Loading Components
 * Content-shaped placeholders for better perceived performance
 */

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`skeleton ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    </div>
  );
}

export function SkeletonInfluencerCard() {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="flex justify-center">
        <Skeleton className="w-24 h-24 rounded-full" />
      </div>
      <div className="text-center space-y-2">
        <Skeleton className="h-5 w-32 mx-auto" />
        <Skeleton className="h-4 w-24 mx-auto" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
      </div>
      <Skeleton className="h-10 rounded-lg" />
    </div>
  );
}

export function SkeletonLeaderboard() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="card p-4 flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="card p-6 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

export default function SkeletonCard() {
  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-4 animate-pulse">
      <div className="flex items-start gap-3">
        {/* Profile Image Skeleton */}
        <div className="w-12 h-12 bg-dark-border rounded-full"></div>

        <div className="flex-1">
          {/* Name Skeleton */}
          <div className="h-5 bg-dark-border rounded w-32 mb-2"></div>

          {/* Handle Skeleton */}
          <div className="h-4 bg-dark-border rounded w-24 mb-3"></div>

          {/* Stats Row */}
          <div className="flex gap-4 mb-3">
            <div className="h-4 bg-dark-border rounded w-16"></div>
            <div className="h-4 bg-dark-border rounded w-16"></div>
            <div className="h-4 bg-dark-border rounded w-16"></div>
          </div>

          {/* Price Skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-6 bg-dark-border rounded w-20"></div>
            <div className="h-8 bg-dark-border rounded w-24"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

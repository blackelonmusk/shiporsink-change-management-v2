export function SkeletonCard() {
  return (
    <div className="border-2 border-gray-700 rounded-xl p-6 animate-pulse bg-gray-800 relative overflow-hidden">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-gray-700/20 to-transparent" />
      
      <div className="flex items-center gap-3 mb-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-700 to-gray-600" />
        <div className="flex-1">
          <div className="h-5 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg w-32 mb-2" />
          <div className="h-4 bg-gradient-to-r from-gray-700 to-gray-600 rounded w-24" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-9 bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg" />
          <div className="h-9 w-20 bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg" />
          <div className="h-9 w-20 bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg" />
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <div className="h-3 bg-gradient-to-r from-gray-700 to-gray-600 rounded w-20 mb-2" />
          <div className="h-4 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full w-full" />
        </div>
        <div>
          <div className="h-3 bg-gradient-to-r from-gray-700 to-gray-600 rounded w-24 mb-2" />
          <div className="h-4 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full w-full" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonStats() {
  return (
    <div className="grid md:grid-cols-3 gap-6 mb-8">
      {[1, 2, 3].map((i) => (
        <div 
          key={i} 
          className="bg-gray-800 p-6 rounded-xl border border-gray-700 animate-pulse relative overflow-hidden"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          {/* Shimmer overlay */}
          <div 
            className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-gray-700/20 to-transparent"
            style={{ animationDelay: `${i * 100}ms` }}
          />
          
          <div className="h-4 bg-gradient-to-r from-gray-700 to-gray-600 rounded w-28 mb-4" />
          <div className="h-10 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg w-20" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonProjectCard() {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border-2 border-gray-700 animate-pulse relative overflow-hidden">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-gray-700/20 to-transparent" />
      
      <div className="flex justify-between items-start mb-4">
        <div className="h-7 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg w-48" />
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg" />
          <div className="h-8 w-8 bg-gradient-to-br from-gray-700 to-gray-600 rounded-lg" />
        </div>
      </div>
      <div className="h-4 bg-gradient-to-r from-gray-700 to-gray-600 rounded w-full mb-3" />
      <div className="h-4 bg-gradient-to-r from-gray-700 to-gray-600 rounded w-3/4 mb-4" />
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 bg-gradient-to-br from-gray-700 to-gray-600 rounded-full" />
        <div className="h-4 bg-gradient-to-r from-gray-700 to-gray-600 rounded w-24" />
      </div>
    </div>
  )
}

/* Add this to your global CSS (globals.css or tailwind config) */
/* 
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
*/

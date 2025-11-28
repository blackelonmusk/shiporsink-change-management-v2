export function SkeletonCard() {
  return (
    <div className="border border-gray-700 rounded-lg p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-gray-700" />
        <div className="flex-1">
          <div className="h-5 bg-gray-700 rounded w-32 mb-2" />
          <div className="h-4 bg-gray-700 rounded w-24" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-gray-700 rounded" />
          <div className="h-8 w-16 bg-gray-700 rounded" />
          <div className="h-8 w-16 bg-gray-700 rounded" />
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <div className="h-3 bg-gray-700 rounded w-20 mb-2" />
          <div className="h-2 bg-gray-700 rounded w-full" />
        </div>
        <div>
          <div className="h-3 bg-gray-700 rounded w-24 mb-2" />
          <div className="h-2 bg-gray-700 rounded w-full" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonStats() {
  return (
    <div className="grid md:grid-cols-3 gap-6 mb-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-800 p-6 rounded-lg animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-24 mb-3" />
          <div className="h-8 bg-gray-700 rounded w-16" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonProjectCard() {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="h-6 bg-gray-700 rounded w-40" />
        <div className="flex gap-1">
          <div className="h-6 w-6 bg-gray-700 rounded" />
          <div className="h-6 w-6 bg-gray-700 rounded" />
        </div>
      </div>
      <div className="h-4 bg-gray-700 rounded w-full mb-2" />
      <div className="h-4 bg-gray-700 rounded w-20" />
    </div>
  )
}

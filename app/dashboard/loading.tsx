export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] md:ml-60 pt-14 md:pt-0">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 pb-24 md:pb-10 space-y-6">
        {/* Greeting skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-64 skeleton rounded-xl" />
          <div className="h-4 w-40 skeleton rounded-lg" />
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 skeleton rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-5 skeleton rounded w-10" />
                <div className="h-3 skeleton rounded w-14" />
              </div>
            </div>
          ))}
        </div>
        {/* Quick actions skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="card h-28 skeleton" />)}
        </div>
        {/* Recent searches skeleton */}
        <div className="card p-5 space-y-3">
          <div className="h-4 w-28 skeleton rounded" />
          {[1,2,3].map(i => <div key={i} className="h-14 skeleton rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}

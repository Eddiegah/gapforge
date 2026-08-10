export default function IssuesLoading() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] md:ml-60 pt-14 md:pt-0">
      <div className="px-4 py-6 pb-24 md:pb-10">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-32 skeleton rounded-xl" />
          <div className="h-9 w-24 skeleton rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="space-y-3">
              <div className="h-9 skeleton rounded-xl" />
              {[1,2].map(j => <div key={j} className="card h-24 skeleton" />)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

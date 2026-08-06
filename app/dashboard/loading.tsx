export default function Loading() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <div className="md:ml-60 pt-14 md:pt-0">
        <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
          <div className="h-10 w-64 bg-[rgb(var(--border))] rounded-xl animate-pulse" />
          <div className="grid sm:grid-cols-4 gap-4">
            {Array.from({length:4}).map((_,i)=>(
              <div key={i} className="card p-5 flex items-center gap-4 animate-pulse" style={{animationDelay:`${i*0.07}s`}}>
                <div className="w-12 h-12 rounded-xl bg-[rgb(var(--border))] flex-shrink-0" />
                <div className="space-y-2 flex-1"><div className="h-6 bg-[rgb(var(--border))] rounded w-12" /><div className="h-3 bg-[rgb(var(--border))] rounded w-20" /></div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <div className="h-4 w-24 bg-[rgb(var(--border))] rounded animate-pulse" />
            <div className="grid sm:grid-cols-3 gap-4">
              {Array.from({length:3}).map((_,i)=><div key={i} className="card p-5 h-28 animate-pulse bg-[rgb(var(--border))]/20" style={{animationDelay:`${i*0.07}s`}} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

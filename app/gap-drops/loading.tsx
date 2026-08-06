export default function Loading() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <div className="md:ml-60 pt-14 md:pt-0">
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-20 space-y-6">
          <div className="h-8 w-48 bg-[rgb(var(--border))] rounded-xl animate-pulse" />
          <div className="card p-6 animate-pulse"><div className="h-16 bg-[rgb(var(--border))] rounded-xl" /></div>
          {Array.from({length:3}).map((_,i)=>(
            <div key={i} className="card p-5 animate-pulse" style={{animationDelay:`${i*0.1}s`}}>
              <div className="h-5 w-32 bg-[rgb(var(--border))] rounded mb-3" />
              <div className="space-y-2">{Array.from({length:3}).map((_,j)=><div key={j} className="h-3 bg-[rgb(var(--border))] rounded" />)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

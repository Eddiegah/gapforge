export default function Loading() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <div className="md:ml-60 pt-14 md:pt-0">
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-20 space-y-4">
          <div className="h-8 w-36 bg-[rgb(var(--border))] rounded-xl animate-pulse" />
          <div className="flex gap-1"><div className="h-10 w-72 bg-[rgb(var(--border))] rounded-xl animate-pulse" /></div>
          {Array.from({length:5}).map((_,i)=>(
            <div key={i} className="card p-5 animate-pulse" style={{animationDelay:`${i*0.07}s`}}>
              <div className="h-5 w-3/4 bg-[rgb(var(--border))] rounded mb-3" />
              <div className="h-3 w-full bg-[rgb(var(--border))] rounded mb-2" />
              <div className="h-3 w-2/3 bg-[rgb(var(--border))] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

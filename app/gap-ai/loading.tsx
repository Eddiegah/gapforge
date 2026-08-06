export default function Loading() {
  return (
    <div className="flex h-screen bg-[rgb(var(--bg))] overflow-hidden">
      <div className="hidden md:flex w-60 flex-col border-r border-[rgb(var(--border))] bg-[rgb(var(--sidebar))]">
        <div className="p-4 border-b border-[rgb(var(--border))]">
          <div className="h-8 w-32 bg-[rgb(var(--border))] rounded-lg animate-pulse" />
        </div>
        <div className="p-3 space-y-2">
          {Array.from({length:8}).map((_,i)=><div key={i} className="h-9 bg-[rgb(var(--border))] rounded-lg animate-pulse" style={{animationDelay:`${i*0.05}s`}} />)}
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        <p className="text-sm text-[rgb(var(--muted))]">Loading Gap AI...</p>
      </div>
    </div>
  );
}

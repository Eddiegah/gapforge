export default function LibraryLoading() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] md:ml-60 pt-14 md:pt-0">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-24 md:pb-10 space-y-4">
        <div className="h-8 w-24 skeleton rounded-xl" />
        <div className="flex gap-1">
          <div className="h-10 w-72 skeleton rounded-xl" />
        </div>
        {[1,2,3,4].map(i => <div key={i} className="card h-32 skeleton" />)}
      </div>
    </div>
  );
}

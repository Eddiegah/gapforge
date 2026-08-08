export default function Loading() {
  return (
    <div className="flex h-screen bg-[rgb(var(--bg))] md:ml-60">
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-violet-600/20 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            </div>
          </div>
          <div className="space-y-2 text-center">
            <div className="h-2.5 w-32 skeleton rounded-full mx-auto" />
            <div className="h-2 w-20 skeleton rounded-full mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}

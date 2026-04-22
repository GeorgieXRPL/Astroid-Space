export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-32 text-center">
      <div className="w-12 h-12 border-2 border-cosmos border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <div className="text-xs font-mono text-cosmos/70 tracking-widest uppercase">
        Loading
      </div>
    </div>
  );
}

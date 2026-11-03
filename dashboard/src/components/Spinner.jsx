export function Spinner() {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 px-4 py-20">
      <span
        className="h-9 w-9 animate-spin rounded-full border-2 border-line border-t-pine"
        aria-hidden="true"
      />
      <span className="text-sm text-stone-600">Loading articles</span>
    </div>
  );
}

type Props = { label?: string };

export function Spinner({ label = 'Loading' }: Props) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-2 text-slate-600">
      <svg
        className="animate-spin h-5 w-5 text-brand-600"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
        <path
          d="M4 12a8 8 0 018-8"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="opacity-75"
        />
      </svg>
      <span>{label}…</span>
    </div>
  );
}

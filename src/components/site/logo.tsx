/** The Malisa mark: a bidding paddle drawn as a ring on a short handle. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
        <circle cx="11" cy="8.5" r="6.75" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="11" cy="8.5" r="2.25" fill="currentColor" />
        <path d="M11 15.25V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span className="text-[19px] font-medium tracking-[-0.03em]">Malisa</span>
    </span>
  );
}

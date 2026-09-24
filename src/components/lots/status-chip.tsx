import type { LotStatus } from "@/lib/types";
import { Countdown } from "./countdown";

/** The small pill on lot imagery: live countdown, opening time, or "closed". */
export function StatusChip({ status, endsAt, startsAt }: { status: LotStatus; endsAt: string; startsAt: string }) {
  const base =
    "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 font-mono text-[11px] tracking-[0.04em] uppercase backdrop-blur-md";

  if (status === "ended") {
    return <span className={`${base} bg-ink/70 text-white`}>Closed</span>;
  }
  if (status === "upcoming") {
    return (
      <span className={`${base} bg-white/85 text-ink-2`}>
        Opens in <Countdown until={startsAt} />
      </span>
    );
  }
  const closing = status === "closing";
  return (
    <span className={`${base} ${closing ? "bg-signal text-white" : "bg-white/85 text-ink"}`}>
      <span className={`live-dot size-1.5 rounded-full ${closing ? "bg-white" : "bg-signal"}`} aria-hidden />
      <Countdown until={endsAt} />
    </span>
  );
}

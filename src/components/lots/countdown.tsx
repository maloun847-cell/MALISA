"use client";

import { useEffect, useState } from "react";
import { formatRemaining, remaining } from "@/lib/format";

/** Live time-left readout. Rendered once on the server, then ticks every second. */
export function Countdown({ until, className = "" }: { until: string; className?: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <time dateTime={until} className={`tabular-nums ${className}`} suppressHydrationWarning>
      {formatRemaining(remaining(until, now))}
    </time>
  );
}

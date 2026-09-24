export const CURRENCY = "EUR";

const money = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: CURRENCY,
  maximumFractionDigits: 0,
});

const plain = new Intl.NumberFormat("en-IE");

export function formatMoney(amount: number): string {
  return money.format(amount);
}

export function formatNumber(n: number): string {
  return plain.format(n);
}

export function formatEstimate([low, high]: [number, number]): string {
  return `${formatMoney(low)}–${plain.format(high)}`;
}

export function lotNumber(n: number): string {
  return String(n).padStart(3, "0");
}

export function paddleNumber(n: number): string {
  return String(n).padStart(4, "0");
}

export type Remaining = {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function remaining(until: string | number, now: number = Date.now()): Remaining {
  const end = typeof until === "string" ? Date.parse(until) : until;
  const total = Math.max(0, end - now);
  const s = Math.floor(total / 1000);
  return {
    total,
    days: Math.floor(s / 86_400),
    hours: Math.floor((s % 86_400) / 3_600),
    minutes: Math.floor((s % 3_600) / 60),
    seconds: s % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function formatRemaining(r: Remaining): string {
  if (r.total <= 0) return "Closed";
  if (r.days > 0) return `${r.days}d ${pad(r.hours)}h ${pad(r.minutes)}m`;
  return `${pad(r.hours)}:${pad(r.minutes)}:${pad(r.seconds)}`;
}

const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

export function formatDateTime(iso: string): string {
  return `${dateTime.format(new Date(iso))} UTC`;
}

export function timeAgo(iso: string, now: number = Date.now()): string {
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/** "Amra Kovač" → "A. K***" — bidders are shown masked in public history. */
export function maskName(name: string): string {
  const [first = "", last = ""] = name.trim().split(/\s+/);
  const initial = first ? `${first[0].toUpperCase()}.` : "";
  const tail = last ? ` ${last[0].toUpperCase()}***` : "";
  return `${initial}${tail}` || "Bidder";
}

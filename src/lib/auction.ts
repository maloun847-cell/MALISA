import { formatMoney } from "./format";
import type { Bid, Lot, LotStatus } from "./types";

/** Bids placed inside this window before the close extend the lot by the same amount. */
export const SOFT_CLOSE_MS = 2 * 60 * 1000;
/** A lot counts as "closing" once it is inside this window. */
export const CLOSING_MS = 60 * 60 * 1000;
export const BUYER_PREMIUM = 0.15;

const INCREMENT_TABLE: [ceiling: number, step: number][] = [
  [100, 5],
  [500, 10],
  [1_000, 25],
  [5_000, 50],
  [10_000, 100],
  [50_000, 250],
  [Infinity, 500],
];

export function incrementFor(amount: number): number {
  for (const [ceiling, step] of INCREMENT_TABLE) {
    if (amount < ceiling) return step;
  }
  return 500;
}

export function highestBid(lot: Pick<Lot, "bids">): Bid | null {
  return lot.bids.reduce<Bid | null>(
    (top, bid) => (!top || bid.amount > top.amount ? bid : top),
    null,
  );
}

export function currentPrice(lot: Pick<Lot, "bids" | "startingBid">): number {
  return highestBid(lot)?.amount ?? lot.startingBid;
}

export function minimumNextBid(lot: Pick<Lot, "bids" | "startingBid">): number {
  const top = highestBid(lot);
  return top ? top.amount + incrementFor(top.amount) : lot.startingBid;
}

export function reserveMet(lot: Pick<Lot, "bids" | "reserve">): boolean {
  if (lot.reserve == null) return true;
  const top = highestBid(lot);
  return !!top && top.amount >= lot.reserve;
}

export function lotStatus(
  lot: Pick<Lot, "startsAt" | "endsAt">,
  now: number = Date.now(),
): LotStatus {
  const start = Date.parse(lot.startsAt);
  const end = Date.parse(lot.endsAt);
  if (now < start) return "upcoming";
  if (now >= end) return "ended";
  if (end - now <= CLOSING_MS) return "closing";
  return "live";
}

export type BidCheck =
  | { ok: true }
  | { ok: false; reason: string };

export function checkBid(
  lot: Lot,
  amount: number,
  paddle: number,
  now: number = Date.now(),
): BidCheck {
  const status = lotStatus(lot, now);
  if (status === "upcoming") return { ok: false, reason: "Bidding has not opened on this lot yet." };
  if (status === "ended") return { ok: false, reason: "This lot has closed." };
  if (!Number.isFinite(amount) || !Number.isInteger(amount)) {
    return { ok: false, reason: "Enter a whole amount." };
  }
  const min = minimumNextBid(lot);
  if (amount < min) return { ok: false, reason: `The minimum bid is ${formatMoney(min)}.` };
  if (highestBid(lot)?.paddle === paddle) {
    return { ok: false, reason: "You already hold the highest bid." };
  }
  return { ok: true };
}

/** Returns the new close time after a bid lands at `now` (soft close). */
export function extendedEnd(endsAt: string, now: number = Date.now()): string {
  const end = Date.parse(endsAt);
  if (end - now < SOFT_CLOSE_MS) return new Date(now + SOFT_CLOSE_MS).toISOString();
  return endsAt;
}

/** Suggested quick-bid amounts: the minimum, then two further increments. */
export function quickBids(lot: Pick<Lot, "bids" | "startingBid">): number[] {
  const first = minimumNextBid(lot);
  const second = first + incrementFor(first);
  const third = second + incrementFor(second);
  return [first, second, third];
}

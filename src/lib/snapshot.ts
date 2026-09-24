import { currentPrice, highestBid, lotStatus, minimumNextBid, quickBids, reserveMet } from "./auction";
import { maskName } from "./format";
import type { Lot, LotStatus } from "./types";

/** The public, live part of a lot that the bid panel polls for. */
export type LotSnapshot = {
  id: string;
  status: LotStatus;
  startsAt: string;
  endsAt: string;
  currentPrice: number;
  minimumNextBid: number;
  quickBids: number[];
  bidCount: number;
  hasReserve: boolean;
  reserveMet: boolean;
  leaderPaddle: number | null;
  bids: { id: string; paddle: number; bidder: string; amount: number; at: string }[];
};

export function snapshot(lot: Lot, now: number = Date.now()): LotSnapshot {
  return {
    id: lot.id,
    status: lotStatus(lot, now),
    startsAt: lot.startsAt,
    endsAt: lot.endsAt,
    currentPrice: currentPrice(lot),
    minimumNextBid: minimumNextBid(lot),
    quickBids: quickBids(lot),
    bidCount: lot.bids.length,
    hasReserve: lot.reserve != null,
    reserveMet: reserveMet(lot),
    leaderPaddle: highestBid(lot)?.paddle ?? null,
    bids: lot.bids.slice(0, 12).map((b) => ({
      id: b.id,
      paddle: b.paddle,
      bidder: maskName(b.bidder),
      amount: b.amount,
      at: b.at,
    })),
  };
}

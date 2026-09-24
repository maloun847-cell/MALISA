import { describe, expect, it } from "vitest";
import {
  checkBid,
  extendedEnd,
  incrementFor,
  lotStatus,
  minimumNextBid,
  quickBids,
  reserveMet,
  SOFT_CLOSE_MS,
} from "./auction";
import { maskName } from "./format";
import { buildSeed } from "./seed";
import type { Lot } from "./types";

const NOW = Date.parse("2026-06-01T12:00:00Z");
const iso = (offsetMs: number) => new Date(NOW + offsetMs).toISOString();

function lot(overrides: Partial<Lot> = {}): Lot {
  const base = buildSeed(NOW).lots[0];
  return { ...base, bids: [], startingBid: 100, reserve: null, startsAt: iso(-3_600_000), endsAt: iso(86_400_000), ...overrides };
}

const bid = (amount: number, paddle = 1001) => ({
  id: `b${amount}`,
  lotId: "x",
  paddle,
  bidder: "Test Bidder",
  amount,
  at: iso(-1000),
});

describe("increments", () => {
  it("steps up with the price", () => {
    expect(incrementFor(50)).toBe(5);
    expect(incrementFor(100)).toBe(10);
    expect(incrementFor(999)).toBe(25);
    expect(incrementFor(4_999)).toBe(50);
    expect(incrementFor(20_000)).toBe(250);
    expect(incrementFor(1_000_000)).toBe(500);
  });

  it("asks for the starting bid first, then the next increment", () => {
    expect(minimumNextBid(lot())).toBe(100);
    expect(minimumNextBid(lot({ bids: [bid(480)] }))).toBe(490);
    expect(minimumNextBid(lot({ bids: [bid(500)] }))).toBe(525);
    expect(quickBids(lot({ bids: [bid(480)] }))).toEqual([490, 500, 525]);
  });
});

describe("status", () => {
  it("moves from upcoming to live to closing to ended", () => {
    expect(lotStatus(lot({ startsAt: iso(1000) }), NOW)).toBe("upcoming");
    expect(lotStatus(lot(), NOW)).toBe("live");
    expect(lotStatus(lot({ endsAt: iso(30 * 60_000) }), NOW)).toBe("closing");
    expect(lotStatus(lot({ endsAt: iso(-1) }), NOW)).toBe("ended");
  });
});

describe("checkBid", () => {
  it("rejects bids below the minimum", () => {
    const result = checkBid(lot({ bids: [bid(200)] }), 205, 2002, NOW);
    expect(result.ok).toBe(false);
  });

  it("rejects the current leader outbidding themselves", () => {
    const result = checkBid(lot({ bids: [bid(200, 2002)] }), 300, 2002, NOW);
    expect(result).toEqual({ ok: false, reason: "You already hold the highest bid." });
  });

  it("rejects bids on closed or unopened lots and fractional amounts", () => {
    expect(checkBid(lot({ endsAt: iso(-1) }), 500, 1, NOW).ok).toBe(false);
    expect(checkBid(lot({ startsAt: iso(1000) }), 500, 1, NOW).ok).toBe(false);
    expect(checkBid(lot(), 100.5, 1, NOW).ok).toBe(false);
  });

  it("accepts a valid bid", () => {
    expect(checkBid(lot({ bids: [bid(200)] }), 210, 2002, NOW)).toEqual({ ok: true });
  });
});

describe("soft close", () => {
  it("extends the close when a bid lands in the final window", () => {
    expect(extendedEnd(iso(30_000), NOW)).toBe(iso(SOFT_CLOSE_MS));
  });

  it("leaves the close alone otherwise", () => {
    expect(extendedEnd(iso(10 * 60_000), NOW)).toBe(iso(10 * 60_000));
  });
});

describe("reserve", () => {
  it("is met once the top bid reaches it", () => {
    expect(reserveMet(lot({ reserve: 300, bids: [bid(250)] }))).toBe(false);
    expect(reserveMet(lot({ reserve: 300, bids: [bid(300)] }))).toBe(true);
    expect(reserveMet(lot({ reserve: null }))).toBe(true);
  });
});

describe("seed catalogue", () => {
  const db = buildSeed(NOW);

  it("has unique ids and numbers", () => {
    expect(new Set(db.lots.map((l) => l.id)).size).toBe(db.lots.length);
    expect(new Set(db.lots.map((l) => l.number)).size).toBe(db.lots.length);
  });

  it("has bid histories that respect the increment table, newest first", () => {
    for (const l of db.lots) {
      const ascending = [...l.bids].reverse();
      ascending.forEach((b, i) => {
        if (i === 0) expect(b.amount).toBe(l.startingBid);
        else expect(b.amount).toBeGreaterThanOrEqual(ascending[i - 1].amount + incrementFor(ascending[i - 1].amount));
        if (i > 0) expect(b.paddle).not.toBe(ascending[i - 1].paddle);
      });
    }
  });

  it("places condition notes inside the photograph", () => {
    for (const l of db.lots) {
      for (const n of l.condition.notes) {
        expect(n.x).toBeGreaterThanOrEqual(0);
        expect(n.x).toBeLessThanOrEqual(100);
        expect(n.y).toBeGreaterThanOrEqual(0);
        expect(n.y).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe("maskName", () => {
  it("shows an initial and a masked surname", () => {
    expect(maskName("Amra Kovačević")).toBe("A. K***");
    expect(maskName("Cher")).toBe("C.");
  });
});

import { randomUUID } from "node:crypto";
import { checkBid, extendedEnd, lotStatus } from "./auction";
import { type Backend, ConflictError, selectBackend } from "./persistence";
import { buildSeed, SEED_VERSION } from "./seed";
import type { Bid, Bidder, Database, Lot } from "./types";

/**
 * The whole auction database is one JSON document. Reads come from a small
 * in-memory cache; every change is a read-modify-write that is retried if
 * another server instance wrote in the meantime. That is plenty for a demo or
 * a small sale. Move to a relational database before real volume arrives.
 */

export type StoreOptions = {
  /** How long a cached copy may be served before re-reading a shared backend. */
  ttlMs?: number;
  now?: () => number;
};

export type NewLot = Omit<Lot, "id" | "number" | "bids" | "createdAt">;

export type PlaceBidResult = { ok: true; bid: Bid; lot: Lot } | { ok: false; reason: string };

export class StoreBusyError extends Error {
  constructor() {
    super("The auction is very busy right now. Please try again.");
  }
}

const MAX_ATTEMPTS = 6;

/**
 * Returns the database to write when it needs rebuilding, or null when it is fine.
 * A new seed version rebuilds it from scratch. Once every lot has closed, the
 * demo catalogue is relisted so the site never sits empty; lots listed by users
 * and registered paddles are kept.
 */
export function refreshed(db: Database | null, now: number): Database | null {
  if (!db || db.version !== SEED_VERSION) return buildSeed(now);
  if (!db.lots.every((lot) => lotStatus(lot, now) === "ended")) return null;
  const fresh = buildSeed(now);
  const userLots = db.lots
    .filter((lot) => lot.sellerPaddle != null)
    .map((lot, i) => ({ ...lot, number: fresh.lots.length + i + 1 }));
  const known = new Set(fresh.bidders.map((b) => b.paddle));
  return {
    ...fresh,
    lots: [...fresh.lots, ...userLots],
    bidders: [...fresh.bidders, ...db.bidders.filter((b) => !known.has(b.paddle))],
  };
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function createStore(backend: Backend, options: StoreOptions = {}) {
  const now = options.now ?? Date.now;
  // A backend nobody else writes to never goes stale, so its cache never expires.
  const ttl = options.ttlMs ?? (backend.shared ? 4_000 : Infinity);

  let cache: { db: Database; etag: string | null; at: number } | null = null;
  let reading: Promise<Database> | null = null;
  let queue: Promise<unknown> = Promise.resolve();

  /** Reads the backend, seeding or relisting the catalogue when needed. */
  async function readThrough(): Promise<{ db: Database; etag: string | null }> {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const stored = await backend.read();
      const rebuilt = refreshed(stored?.db ?? null, now());
      if (!rebuilt) return { db: stored!.db, etag: stored!.etag };
      try {
        const etag = await backend.write(rebuilt, stored?.etag ?? null);
        return { db: rebuilt, etag };
      } catch (error) {
        if (!(error instanceof ConflictError)) throw error;
      }
    }
    throw new StoreBusyError();
  }

  async function load({ fresh = false } = {}): Promise<Database> {
    if (!fresh && cache && now() - cache.at < ttl && !refreshed(cache.db, now())) return cache.db;
    reading ??= readThrough()
      .then(({ db, etag }) => {
        cache = { db, etag, at: now() };
        return db;
      })
      .catch((error) => {
        // Keep serving the last good copy if the backend is briefly unavailable.
        if (cache) {
          console.warn("[malisa] Could not refresh the auction data; serving the cached copy.", error);
          cache.at = now();
          return cache.db;
        }
        throw error;
      })
      .finally(() => {
        reading = null;
      });
    return reading;
  }

  /**
   * Applies a change on top of the latest stored version. If another instance
   * wrote first, the change is re-applied to the newer version.
   */
  function mutate<T>(change: (db: Database) => T): Promise<T> {
    const run = queue.then(async () => {
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        if (backend.shared || !cache) await load({ fresh: true });
        const base = cache!;
        const draft = structuredClone(base.db);
        const result = change(draft);
        if (JSON.stringify(draft) === JSON.stringify(base.db)) return result;
        try {
          const etag = await backend.write(draft, base.etag);
          cache = { db: draft, etag, at: now() };
          return result;
        } catch (error) {
          if (!(error instanceof ConflictError)) throw error;
        }
      }
      throw new StoreBusyError();
    });
    queue = run.catch(() => undefined);
    return run;
  }

  return {
    backend,

    async listLots(): Promise<Lot[]> {
      return (await load()).lots;
    },

    async getLot(id: string): Promise<Lot | null> {
      const lot = (await load()).lots.find((l) => l.id === id);
      if (lot || !backend.shared) return lot ?? null;
      // It may have been listed moments ago on another instance.
      return (await load({ fresh: true })).lots.find((l) => l.id === id) ?? null;
    },

    async lotsBidOnBy(paddle: number): Promise<Lot[]> {
      return (await load()).lots.filter((lot) => lot.bids.some((b) => b.paddle === paddle));
    },

    async lotsListedBy(paddle: number): Promise<Lot[]> {
      return (await load()).lots.filter((lot) => lot.sellerPaddle === paddle);
    },

    registerBidder(name: string, email: string): Promise<Bidder> {
      return mutate((db) => {
        const existing = db.bidders.find((b) => b.email.toLowerCase() === email.toLowerCase());
        if (existing) return existing;
        const paddle = Math.max(1000, ...db.bidders.map((b) => b.paddle)) + 1;
        const bidder: Bidder = { paddle, name, email, createdAt: new Date(now()).toISOString() };
        db.bidders.push(bidder);
        return bidder;
      });
    },

    placeBid(lotId: string, bidder: Pick<Bidder, "paddle" | "name">, amount: number): Promise<PlaceBidResult> {
      return mutate((db): PlaceBidResult => {
        const lot = db.lots.find((l) => l.id === lotId);
        if (!lot) return { ok: false, reason: "Lot not found." };
        if (lot.sellerPaddle === bidder.paddle) return { ok: false, reason: "You cannot bid on your own lot." };
        const at = now();
        const check = checkBid(lot, amount, bidder.paddle, at);
        if (!check.ok) return check;
        const bid: Bid = {
          id: randomUUID(),
          lotId,
          paddle: bidder.paddle,
          bidder: bidder.name,
          amount,
          at: new Date(at).toISOString(),
        };
        lot.bids.unshift(bid);
        lot.endsAt = extendedEnd(lot.endsAt, at);
        return { ok: true, bid, lot };
      });
    },

    createLot(input: NewLot): Promise<Lot> {
      return mutate((db) => {
        const number = Math.max(0, ...db.lots.map((l) => l.number)) + 1;
        const lot: Lot = {
          ...input,
          id: `${slugify(input.title) || "lot"}-${number}`,
          number,
          bids: [],
          createdAt: new Date(now()).toISOString(),
        };
        db.lots.push(lot);
        return lot;
      });
    },
  };
}

export type Store = ReturnType<typeof createStore>;

// One store per server process, kept across hot reloads in development.
const globalStore = globalThis as typeof globalThis & { __malisaStore?: Store };
const store: Store = (globalStore.__malisaStore ??= createStore(selectBackend()));

export const { listLots, getLot, lotsBidOnBy, lotsListedBy, registerBidder, placeBid, createLot } = store;
export const backend = store.backend;

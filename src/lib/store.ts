import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { checkBid, extendedEnd, lotStatus } from "./auction";
import { buildSeed, SEED_VERSION } from "./seed";
import type { Bid, Bidder, Database, Lot } from "./types";

/**
 * A deliberately small persistence layer: the whole database lives in memory
 * and is written through to a JSON file. It is enough for local development
 * and a single-server deployment. Swap this module for a real database
 * (Postgres, SQLite, …) before running more than one server instance.
 */

export const DATA_DIR = process.env.MALISA_DATA_DIR ?? path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

type StoreState = {
  db: Database | null;
  loading: Promise<Database> | null;
  queue: Promise<unknown>;
  persistWarned: boolean;
};

const globalStore = globalThis as typeof globalThis & { __malisaStore?: StoreState };
const state: StoreState = (globalStore.__malisaStore ??= {
  db: null,
  loading: null,
  queue: Promise.resolve(),
  persistWarned: false,
});

/**
 * Returns the database to use at startup. A new seed version rebuilds it from
 * scratch. Once every lot has closed, the demo catalogue is relisted so the
 * site never sits empty. Lots listed by users and registered paddles are kept.
 */
function refreshed(db: Database | null, now: number): Database | null {
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

async function readFromDisk(): Promise<Database | null> {
  try {
    return JSON.parse(await readFile(DB_FILE, "utf8")) as Database;
  } catch {
    return null;
  }
}

async function persist(db: Database): Promise<void> {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    const tmp = `${DB_FILE}.${randomUUID()}.tmp`;
    await writeFile(tmp, JSON.stringify(db));
    await rename(tmp, DB_FILE);
  } catch (error) {
    if (!state.persistWarned) {
      state.persistWarned = true;
      console.warn("[malisa] Could not write the data file; changes stay in memory only.", error);
    }
  }
}

async function load(): Promise<Database> {
  if (state.db) {
    const next = refreshed(state.db, Date.now());
    if (next) {
      state.db = next;
      void persist(next);
    }
    return state.db;
  }
  state.loading ??= (async () => {
    const stored = await readFromDisk();
    const next = refreshed(stored, Date.now());
    if (next) await persist(next);
    state.db = next ?? stored!;
    return state.db;
  })();
  return state.loading;
}

/** Runs mutations one at a time so concurrent bids cannot interleave. */
function mutate<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  const run = state.queue.then(async () => {
    const db = await load();
    const result = await fn(db);
    await persist(db);
    return result;
  });
  state.queue = run.catch(() => undefined);
  return run;
}

export async function listLots(): Promise<Lot[]> {
  return (await load()).lots;
}

export async function getLot(id: string): Promise<Lot | null> {
  return (await load()).lots.find((lot) => lot.id === id) ?? null;
}

export async function getBidder(paddle: number): Promise<Bidder | null> {
  return (await load()).bidders.find((b) => b.paddle === paddle) ?? null;
}

export async function lotsBidOnBy(paddle: number): Promise<Lot[]> {
  return (await load()).lots.filter((lot) => lot.bids.some((b) => b.paddle === paddle));
}

export async function lotsListedBy(paddle: number): Promise<Lot[]> {
  return (await load()).lots.filter((lot) => lot.sellerPaddle === paddle);
}

export async function registerBidder(name: string, email: string): Promise<Bidder> {
  return mutate((db) => {
    const existing = db.bidders.find((b) => b.email.toLowerCase() === email.toLowerCase());
    if (existing) return existing;
    const paddle = Math.max(1000, ...db.bidders.map((b) => b.paddle)) + 1;
    const bidder: Bidder = { paddle, name, email, createdAt: new Date().toISOString() };
    db.bidders.push(bidder);
    return bidder;
  });
}

export type PlaceBidResult = { ok: true; bid: Bid; lot: Lot } | { ok: false; reason: string };

export async function placeBid(lotId: string, paddle: number, amount: number): Promise<PlaceBidResult> {
  return mutate((db) => {
    const lot = db.lots.find((l) => l.id === lotId);
    if (!lot) return { ok: false, reason: "Lot not found." };
    const bidder = db.bidders.find((b) => b.paddle === paddle);
    if (!bidder) return { ok: false, reason: "Register a paddle before bidding." };
    if (lot.sellerPaddle === paddle) return { ok: false, reason: "You cannot bid on your own lot." };
    const now = Date.now();
    const check = checkBid(lot, amount, paddle, now);
    if (!check.ok) return check;
    const bid: Bid = {
      id: randomUUID(),
      lotId,
      paddle,
      bidder: bidder.name,
      amount,
      at: new Date(now).toISOString(),
    };
    lot.bids.unshift(bid);
    lot.endsAt = extendedEnd(lot.endsAt, now);
    return { ok: true, bid, lot };
  });
}

export type NewLot = Omit<Lot, "id" | "number" | "bids" | "createdAt">;

export async function createLot(input: NewLot): Promise<Lot> {
  return mutate((db) => {
    const number = Math.max(0, ...db.lots.map((l) => l.number)) + 1;
    const base = input.title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48);
    const lot: Lot = {
      ...input,
      id: `${base || "lot"}-${number}`,
      number,
      bids: [],
      createdAt: new Date().toISOString(),
    };
    db.lots.push(lot);
    return lot;
  });
}

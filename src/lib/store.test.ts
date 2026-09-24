import { describe, expect, it } from "vitest";
import { type Backend, ConflictError } from "./persistence";
import { buildSeed, SEED_VERSION } from "./seed";
import { createStore } from "./store";
import type { Database } from "./types";

/** An in-memory stand-in for Blob: one shared document with ETag-conditional writes. */
function sharedBackend(initial: Database | null = null) {
  let doc: { json: string; etag: string } | null = initial ? { json: JSON.stringify(initial), etag: "v0" } : null;
  let version = 0;
  let reads = 0;
  let writes = 0;
  const backend: Backend = {
    shared: true,
    async read() {
      reads++;
      return doc ? (JSON.parse(doc.json) as Database) : null;
    },
    async readForUpdate() {
      reads++;
      return doc ? { db: JSON.parse(doc.json), etag: doc.etag } : null;
    },
    async write(db, etag) {
      if ((doc?.etag ?? null) !== etag) throw new ConflictError();
      writes++;
      doc = { json: JSON.stringify(db), etag: `v${++version}` };
      return doc.etag;
    },
    async saveUpload() {},
    async readUpload() {
      return null;
    },
  };
  return {
    backend,
    stats: () => ({ reads, writes }),
    current: () => (doc ? (JSON.parse(doc.json) as Database) : null),
  };
}

const NOW = Date.parse("2026-06-01T12:00:00Z");
const clock = () => NOW;

describe("store on a shared backend", () => {
  it("seeds an empty backend exactly once", async () => {
    const shared = sharedBackend();
    const a = createStore(shared.backend, { now: clock });
    const b = createStore(shared.backend, { now: clock });
    const [lotsA, lotsB] = await Promise.all([a.listLots(), b.listLots()]);
    expect(lotsA.length).toBeGreaterThan(0);
    expect(lotsB.map((l) => l.id)).toEqual(lotsA.map((l) => l.id));
    expect(shared.stats().writes).toBe(1);
    expect(shared.current()?.version).toBe(SEED_VERSION);
  });

  it("keeps both bids when two instances bid at the same moment", async () => {
    const shared = sharedBackend(buildSeed(NOW));
    const a = createStore(shared.backend, { now: clock });
    const b = createStore(shared.backend, { now: clock });
    const lot = (await a.listLots()).find((l) => l.id === "leather-butterfly-chair")!;
    const first = lot.bids[0].amount;

    const [ra, rb] = await Promise.all([
      a.placeBid(lot.id, { paddle: 9001, name: "Ana A" }, first + 50),
      b.placeBid(lot.id, { paddle: 9002, name: "Ben B" }, first + 100),
    ]);
    expect(ra.ok).toBe(true);
    expect(rb.ok).toBe(true);

    const stored = shared.current()!.lots.find((l) => l.id === lot.id)!;
    expect(stored.bids.slice(0, 2).map((x) => x.paddle).sort()).toEqual([9001, 9002]);
    expect(stored.bids[0].amount).toBe(first + 100);
  });

  it("rejects a bid that another instance has already beaten", async () => {
    const shared = sharedBackend(buildSeed(NOW));
    const a = createStore(shared.backend, { now: clock });
    const b = createStore(shared.backend, { now: clock });
    const lot = (await a.listLots()).find((l) => l.id === "leather-butterfly-chair")!;
    const next = lot.bids[0].amount + 25;

    expect((await a.placeBid(lot.id, { paddle: 9001, name: "Ana A" }, next)).ok).toBe(true);
    // b's cached copy is stale, but the bid is checked against the stored version.
    const late = await b.placeBid(lot.id, { paddle: 9002, name: "Ben B" }, next);
    expect(late).toMatchObject({ ok: false });
  });

  it("gives every new bidder a unique paddle across instances", async () => {
    const shared = sharedBackend(buildSeed(NOW));
    const stores = [0, 1, 2].map(() => createStore(shared.backend, { now: clock }));
    const bidders = await Promise.all(stores.map((s, i) => s.registerBidder(`Bidder ${i}`, `b${i}@example.com`)));
    expect(new Set(bidders.map((b) => b.paddle)).size).toBe(3);
  });

  it("finds a lot listed moments ago on another instance", async () => {
    const shared = sharedBackend(buildSeed(NOW));
    const a = createStore(shared.backend, { now: clock });
    const b = createStore(shared.backend, { now: clock });
    await b.listLots(); // b now has a cached copy without the new lot
    const template = (await a.listLots())[0];
    const created = await a.createLot({
      title: "A brand new listing",
      maker: template.maker,
      period: template.period,
      category: template.category,
      description: template.description,
      image: template.image,
      startingBid: 100,
      reserve: null,
      estimate: [150, 200],
      startsAt: new Date(NOW).toISOString(),
      endsAt: new Date(NOW + 86_400_000).toISOString(),
      seller: template.seller,
      sellerPaddle: 9001,
      specs: [],
      condition: { grade: 0, summary: "", notes: [] },
      provenance: [],
    });
    expect((await b.getLot(created.id))?.title).toBe("A brand new listing");
  });

  it("serves reads from its cache within the TTL", async () => {
    const shared = sharedBackend(buildSeed(NOW));
    const store = createStore(shared.backend, { now: clock, ttlMs: 5_000 });
    await store.listLots();
    await store.listLots();
    await store.getLot("celestial-globe-clock");
    expect(shared.stats().reads).toBe(1);
  });

  it("keeps a bid placed while another instance is reading", async () => {
    const shared = sharedBackend(buildSeed(NOW));
    const reader = createStore(shared.backend, { now: clock, ttlMs: 0 });
    const writer = createStore(shared.backend, { now: clock });
    const lot = (await writer.listLots()).find((l) => l.id === "leather-butterfly-chair")!;
    const amount = lot.bids[0].amount + 25;
    const [, result] = await Promise.all([reader.listLots(), writer.placeBid(lot.id, { paddle: 9001, name: "Ana A" }, amount)]);
    expect(result.ok).toBe(true);
    expect((await reader.getLot(lot.id))?.bids[0].amount).toBe(amount);
  });

  it("does not write when a change is rejected", async () => {
    const shared = sharedBackend(buildSeed(NOW));
    const store = createStore(shared.backend, { now: clock });
    const result = await store.placeBid("celestial-globe-clock", { paddle: 9001, name: "Ana A" }, 1);
    expect(result.ok).toBe(false);
    expect(shared.stats().writes).toBe(0);
  });
});

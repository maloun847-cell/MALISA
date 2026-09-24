import { currentPrice, lotStatus } from "./auction";
import { isCategory } from "./categories";
import { SORT_OPTIONS, STATUS_FILTERS } from "./catalogue-options";
import { listLots } from "./store";
import type { CategorySlug, Lot, LotStatus } from "./types";

export { SORT_OPTIONS, STATUS_FILTERS };

const isOpen = (lot: Lot, now: number) => ["live", "closing"].includes(lotStatus(lot, now));

export async function homeData(now: number = Date.now()) {
  const lots = await listLots();
  const open = lots.filter((l) => isOpen(l, now));
  const featured = open.find((l) => l.id === "celestial-globe-clock") ?? open[0] ?? lots[0];
  const closingSoon = [...open].sort((a, b) => Date.parse(a.endsAt) - Date.parse(b.endsAt)).slice(0, 4);
  const weekAgo = now - 7 * 86_400_000;

  return {
    lots,
    open,
    featured,
    closingSoon,
    bidsThisWeek: lots.reduce((n, l) => n + l.bids.filter((b) => Date.parse(b.at) > weekAgo).length, 0),
    liveValue: open.reduce((sum, l) => sum + currentPrice(l), 0),
    openCountBy: (category: CategorySlug) => open.filter((l) => l.category === category).length,
  };
}

const SORTERS: Record<string, (a: Lot, b: Lot) => number> = {
  ending: (a, b) => Date.parse(a.endsAt) - Date.parse(b.endsAt),
  newest: (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  "price-desc": (a, b) => currentPrice(b) - currentPrice(a),
  "price-asc": (a, b) => currentPrice(a) - currentPrice(b),
  bids: (a, b) => b.bids.length - a.bids.length,
};

export type CatalogueSearch = { q?: string; category?: string; status?: string; sort?: string };

export async function searchCatalogue(search: CatalogueSearch, now: number = Date.now()) {
  const category = isCategory(search.category) ? search.category : null;
  const status = STATUS_FILTERS.find((s) => s.value === search.status) ?? STATUS_FILTERS[0];
  const sort = SORT_OPTIONS.find((s) => s.value === search.sort)?.value ?? "ending";
  const q = search.q?.toLowerCase();
  const matches = status.match as readonly LotStatus[];

  const lots = (await listLots())
    .filter((l) => matches.includes(lotStatus(l, now)))
    .filter((l) => !category || l.category === category)
    .filter((l) => !q || `${l.title} ${l.maker} ${l.period} ${l.description}`.toLowerCase().includes(q))
    .sort(SORTERS[sort]);

  return { lots, category, status, sort };
}

export async function relatedLots(lot: Lot, limit = 4, now: number = Date.now()) {
  return (await listLots())
    .filter((l) => l.id !== lot.id && l.category === lot.category && lotStatus(l, now) !== "ended")
    .slice(0, limit);
}

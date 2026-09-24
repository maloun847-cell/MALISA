/** Catalogue filters and sort orders. Safe to import from client components. */
import type { LotStatus } from "./types";

export const STATUS_FILTERS = [
  { value: "open", label: "Open", match: ["live", "closing"] },
  { value: "closing", label: "Closing soon", match: ["closing"] },
  { value: "upcoming", label: "Upcoming", match: ["upcoming"] },
  { value: "ended", label: "Results", match: ["ended"] },
  { value: "all", label: "All", match: ["live", "closing", "upcoming", "ended"] },
] as const satisfies readonly { value: string; label: string; match: readonly LotStatus[] }[];

export const SORT_OPTIONS = [
  { value: "ending", label: "Ending soonest" },
  { value: "newest", label: "Newly listed" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "bids", label: "Most bids" },
] as const;

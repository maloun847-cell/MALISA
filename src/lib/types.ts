export type CategorySlug =
  | "watches"
  | "art"
  | "design"
  | "furniture"
  | "jewellery"
  | "ceramics"
  | "cameras"
  | "music"
  | "vehicles"
  | "fashion";

export type Category = {
  slug: CategorySlug;
  name: string;
  blurb: string;
};

export type Bid = {
  id: string;
  lotId: string;
  paddle: number;
  bidder: string;
  amount: number;
  at: string;
};

/** A point of interest on the lot photo, positioned in % of the image box. */
export type ConditionNote = {
  key: string;
  label: string;
  detail: string;
  x?: number;
  y?: number;
};

export type Lot = {
  id: string;
  number: number;
  title: string;
  maker: string;
  period: string;
  category: CategorySlug;
  description: string;
  image: { src: string; width: number; height: number };
  startingBid: number;
  reserve: number | null;
  estimate: [number, number];
  startsAt: string;
  endsAt: string;
  seller: {
    name: string;
    location: string;
    since: number;
  };
  /** Set when the lot was listed through the site by a registered paddle. */
  sellerPaddle?: number;
  specs: { label: string; value: string }[];
  condition: {
    grade: number;
    summary: string;
    notes: ConditionNote[];
  };
  provenance: { year: string; event: string }[];
  bids: Bid[];
  createdAt: string;
};

export type Bidder = {
  paddle: number;
  name: string;
  email: string;
  createdAt: string;
};

export type Database = {
  version: number;
  lots: Lot[];
  bidders: Bidder[];
};

export type LotStatus = "upcoming" | "live" | "closing" | "ended";

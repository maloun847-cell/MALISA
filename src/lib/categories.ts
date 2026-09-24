import type { Category, CategorySlug } from "./types";

export const CATEGORIES: Category[] = [
  { slug: "watches", name: "Watches & Clocks", blurb: "Movements serviced, cases measured" },
  { slug: "art", name: "Fine Art", blurb: "Paintings, prints and works on paper" },
  { slug: "furniture", name: "Furniture", blurb: "Seating, tables and cabinetry" },
  { slug: "design", name: "Design Objects", blurb: "Lighting, office and industrial design" },
  { slug: "jewellery", name: "Jewellery", blurb: "Stones graded, metals assayed" },
  { slug: "ceramics", name: "Ceramics", blurb: "Porcelain, stoneware and glass" },
  { slug: "cameras", name: "Cameras & Optics", blurb: "Shutters timed, glass inspected" },
  { slug: "music", name: "Music & Audio", blurb: "Instruments, hi-fi and records" },
  { slug: "vehicles", name: "Vehicles", blurb: "Cars, motorcycles and bicycles" },
  { slug: "fashion", name: "Fashion & Leather", blurb: "Bags, luggage and accessories" },
];

export function categoryName(slug: CategorySlug): string {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}

export function isCategory(value: unknown): value is CategorySlug {
  return CATEGORIES.some((c) => c.slug === value);
}

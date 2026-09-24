import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { LotGrid } from "@/components/lots/lot-card";
import { SortSelect } from "@/components/lots/sort-select";
import { SplitHeading } from "@/components/ui/heading";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section, Spacer } from "@/components/ui/section";
import { CATEGORIES, categoryName } from "@/lib/categories";
import { type CatalogueSearch, searchCatalogue, STATUS_FILTERS } from "@/lib/queries";

export const metadata: Metadata = { title: "Auctions" };

type Search = CatalogueSearch;

function hrefWith(current: Search, patch: Partial<Search>) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...current, ...patch })) if (v) next.set(k, v);
  const qs = next.toString();
  return qs ? `/auctions?${qs}` : "/auctions";
}

export default async function AuctionsPage(props: PageProps<"/auctions">) {
  await connection();
  const raw = await props.searchParams;
  const pick = (k: string) => (typeof raw[k] === "string" ? (raw[k] as string) : undefined);
  const search: Search = { q: pick("q")?.trim() || undefined, category: pick("category"), status: pick("status"), sort: pick("sort") };

  const { lots, category, status, sort } = await searchCatalogue(search);
  const q = search.q;

  const title = category ? categoryName(category) : "All lots";

  return (
    <>
      <Section rule={false}>
        <div className="gutter grid grid-cols-1 gap-8 py-12 sm:py-16 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Eyebrow>Catalogue · {status.label}</Eyebrow>
            <SplitHeading
              as="h1"
              lead={title}
              tone={status.value === "ended" ? "and what they fetched" : "open for bidding"}
              className="mt-5 text-[clamp(40px,5.5vw,68px)] leading-[1]"
            />
          </div>
          <form action="/auctions" className="lg:col-span-5">
            {category && <input type="hidden" name="category" value={category} />}
            {search.status && <input type="hidden" name="status" value={search.status} />}
            {search.sort && <input type="hidden" name="sort" value={search.sort} />}
            <label className="label" htmlFor="q">
              Search the catalogue
            </label>
            <div className="mt-2 flex gap-2">
              <input id="q" name="q" defaultValue={search.q} placeholder="Chronograph, porcelain, 1970s…" className="field" />
              <button type="submit" className="btn btn-ink shrink-0">
                Search
              </button>
            </div>
          </form>
        </div>
      </Section>

      <Section className="sticky top-16 z-30 bg-paper/90 backdrop-blur-xl">
        <div className="gutter flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <nav aria-label="Status" className="flex gap-1 overflow-x-auto">
            {STATUS_FILTERS.map((s) => (
              <Link
                key={s.value}
                href={hrefWith(search, { status: s.value === "open" ? undefined : s.value })}
                aria-current={s.value === status.value ? "page" : undefined}
                className={`h-9 shrink-0 rounded-full px-3.5 text-[14px] leading-9 transition-colors ${
                  s.value === status.value ? "bg-ink text-white" : "text-ink-2 hover:bg-paper-2"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </nav>
          <Suspense>
            <SortSelect value={sort} />
          </Suspense>
        </div>
        <nav aria-label="Categories" className="gutter flex gap-2 overflow-x-auto border-t border-line py-3">
          <Link
            href={hrefWith(search, { category: undefined })}
            className={`h-8 shrink-0 rounded-full border px-3 font-mono text-[11px] leading-[30px] tracking-[0.05em] uppercase ${
              !category ? "border-ink bg-ink text-white" : "border-line text-ink-2 hover:border-ink-3"
            }`}
          >
            All categories
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={hrefWith(search, { category: c.slug })}
              aria-current={c.slug === category ? "page" : undefined}
              className={`h-8 shrink-0 rounded-full border px-3 font-mono text-[11px] leading-[30px] tracking-[0.05em] uppercase ${
                c.slug === category ? "border-ink bg-ink text-white" : "border-line text-ink-2 hover:border-ink-3"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </nav>
      </Section>

      <Section>
        <div className="gutter flex items-center justify-between py-4">
          <p className="label">
            {lots.length} {lots.length === 1 ? "lot" : "lots"}
            {q && <> matching “{search.q}”</>}
          </p>
          {(q || category || search.status) && (
            <Link href="/auctions" className="label hover:text-ink">
              Clear filters ×
            </Link>
          )}
        </div>
        {lots.length > 0 ? (
          <div className="border-t border-line">
            <LotGrid lots={lots} priorityCount={4} />
          </div>
        ) : (
          <div className="gutter border-t border-line py-24 text-center">
            <p className="display text-[32px]">
              Nothing here <span className="tone">yet</span>
            </p>
            <p className="mx-auto mt-3 max-w-sm text-[15px] text-ink-2">
              No lots match these filters. Try another category, or look at upcoming and past sales.
            </p>
            <Link href="/auctions?status=all" className="btn btn-line mt-6">
              See every lot
            </Link>
          </div>
        )}
      </Section>

      <Spacer />
    </>
  );
}

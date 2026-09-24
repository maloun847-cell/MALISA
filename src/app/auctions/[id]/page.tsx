import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { connection } from "next/server";
import { BidPanel } from "@/components/lots/bid-panel";
import { ConditionReport, GradeGauge } from "@/components/lots/condition-report";
import { LotGrid } from "@/components/lots/lot-card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section, Spacer } from "@/components/ui/section";
import { categoryName } from "@/lib/categories";
import { formatEstimate, formatMoney, lotNumber } from "@/lib/format";
import { currentPaddle } from "@/lib/session";
import { snapshot } from "@/lib/snapshot";
import { relatedLots } from "@/lib/queries";
import { getLot } from "@/lib/store";

export async function generateMetadata(props: PageProps<"/auctions/[id]">): Promise<Metadata> {
  const lot = await getLot((await props.params).id);
  if (!lot) return { title: "Lot not found" };
  return { title: `Lot ${lotNumber(lot.number)} — ${lot.title}`, description: lot.description.slice(0, 160) };
}

export default async function LotPage(props: PageProps<"/auctions/[id]">) {
  await connection();
  const { id } = await props.params;
  const lot = await getLot(id);
  if (!lot) notFound();

  const paddle = await currentPaddle();
  const ratio = Math.min(1.6, Math.max(0.8, lot.image.width / lot.image.height));
  const related = await relatedLots(lot);
  const inspected = lot.condition.grade > 0;
  const hasSpecs = lot.specs.length > 0;

  return (
    <>
      <Section rule={false}>
        <nav aria-label="Breadcrumb" className="gutter flex flex-wrap items-center gap-2 py-4 font-mono text-[11px] tracking-[0.06em] text-ink-3 uppercase">
          <Link href="/auctions" className="hover:text-ink">
            Auctions
          </Link>
          <span aria-hidden>/</span>
          <Link href={`/auctions?category=${lot.category}`} className="hover:text-ink">
            {categoryName(lot.category)}
          </Link>
          <span aria-hidden>/</span>
          <span className="text-ink-2">Lot {lotNumber(lot.number)}</span>
        </nav>
      </Section>

      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Photograph */}
          <div className="p-4 sm:p-8 lg:col-span-7 lg:row-start-1 lg:border-r lg:border-line">
            <div
              className="relative overflow-hidden rounded-[var(--radius-card)] bg-paper-2"
              style={{ aspectRatio: String(ratio) }}
            >
              <Image
                src={lot.image.src}
                alt={lot.title}
                fill
                priority
                sizes="(min-width: 1024px) 720px, 100vw"
                className="object-cover"
                unoptimized={lot.image.src.startsWith("/api/")}
              />
            </div>
          </div>

          {/* Title and bidding */}
          <div className="border-t border-line lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 lg:border-t-0">
            <div className="p-5 sm:p-8 lg:sticky lg:top-16">
              <Eyebrow>
                Lot {lotNumber(lot.number)} · {categoryName(lot.category)}
              </Eyebrow>
              <h1 className="display mt-5 text-[clamp(30px,3.4vw,44px)] leading-[1.06] text-balance">{lot.title}</h1>
              <p className="mt-2 font-serif text-[22px] text-tone italic">
                {lot.maker}, {lot.period}
              </p>
              <dl className="mt-6 grid grid-cols-2 border-t border-line text-[14px]">
                <div className="border-r border-line py-3 pr-3">
                  <dt className="label">Estimate</dt>
                  <dd className="mt-1 tabular-nums">{formatEstimate(lot.estimate)}</dd>
                </div>
                <div className="py-3 pl-4">
                  <dt className="label">Starting bid</dt>
                  <dd className="mt-1 tabular-nums">{formatMoney(lot.startingBid)}</dd>
                </div>
              </dl>
              <div className="mt-2">
                <BidPanel initial={snapshot(lot)} paddle={paddle} isSeller={paddle != null && lot.sellerPaddle === paddle} />
              </div>
            </div>
          </div>

          {/* Catalogue entry */}
          <div className="border-t border-line lg:col-span-7 lg:row-start-2 lg:border-r">
            <DetailBlock index={1} title="Description">
              <p className="max-w-2xl text-[16px] leading-relaxed text-ink-2">{lot.description}</p>
            </DetailBlock>

            <DetailBlock index={2} title="Condition report" id="condition">
              {inspected ? (
                <div className="mb-6 grid gap-6 sm:grid-cols-2">
                  <GradeGauge grade={lot.condition.grade} />
                  <p className="text-[15px] leading-relaxed text-ink-2">{lot.condition.summary}</p>
                </div>
              ) : (
                <p className="mb-6 rounded-lg bg-paper-2 px-4 py-3 text-[15px] text-ink-2">{lot.condition.summary}</p>
              )}
              {lot.condition.notes.length > 0 ? (
                <ConditionReport lot={lot} sizes="(min-width: 1024px) 640px, 100vw" />
              ) : (
                <p className="text-[15px] text-ink-3">The seller has not noted any specific wear.</p>
              )}
            </DetailBlock>

            {hasSpecs && (
              <DetailBlock index={3} title="Specifications">
                <dl className="divide-y divide-line border-y border-line">
                  {lot.specs.map((s) => (
                    <div key={s.label} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-3">
                      <dt className="label pt-0.5">{s.label}</dt>
                      <dd className="text-[15px] text-ink-2">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </DetailBlock>
            )}

            <DetailBlock index={hasSpecs ? 4 : 3} title="Provenance">
              <ol className="relative ml-1 border-l border-line">
                {lot.provenance.map((p) => (
                  <li key={p.year + p.event} className="relative pb-5 pl-6 last:pb-0">
                    <span className="absolute top-1.5 -left-[4.5px] size-2 rounded-full border border-ink-3 bg-paper" aria-hidden />
                    <p className="font-mono text-[12px] text-ink-3">{p.year}</p>
                    <p className="mt-0.5 text-[15px] text-ink-2">{p.event}</p>
                  </li>
                ))}
              </ol>
            </DetailBlock>

            <DetailBlock index={hasSpecs ? 5 : 4} title="Seller" last>
              <div className="flex items-center gap-4">
                <span className="grid size-12 place-items-center rounded-full bg-paper-3 font-serif text-[20px] text-ink-2 italic">
                  {lot.seller.name.charAt(0)}
                </span>
                <div>
                  <p className="text-[16px]">{lot.seller.name}</p>
                  <p className="label mt-1">
                    {lot.seller.location} · Selling since {lot.seller.since}
                  </p>
                </div>
              </div>
            </DetailBlock>
          </div>
        </div>
      </Section>

      {related.length > 0 && (
        <>
          <Spacer />
          <Section>
            <div className="gutter py-10">
              <Eyebrow>More in {categoryName(lot.category)}</Eyebrow>
            </div>
            <div className="border-t border-line">
              <LotGrid lots={related} />
            </div>
          </Section>
        </>
      )}
      <Spacer />
    </>
  );
}

function DetailBlock({
  index,
  title,
  id,
  last = false,
  children,
}: {
  index: number;
  title: string;
  id?: string;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`gutter py-10 ${last ? "" : "border-b border-line"}`}>
      <h2 className="mb-6 flex items-baseline gap-3 text-[22px] tracking-[-0.02em]">
        <span className="font-mono text-[12px] text-ink-3">[{index}]</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

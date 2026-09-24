import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Faq } from "@/components/home/faq";
import { Hero } from "@/components/home/hero";
import { ConditionReport } from "@/components/lots/condition-report";
import { LotGrid } from "@/components/lots/lot-card";
import { SplitHeading } from "@/components/ui/heading";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section, Spacer } from "@/components/ui/section";
import { SOFT_CLOSE_MS } from "@/lib/auction";
import { CATEGORIES } from "@/lib/categories";
import { formatMoney, formatNumber, lotNumber } from "@/lib/format";
import { SITE } from "@/lib/site";
import { homeData } from "@/lib/queries";

const CITIES = [
  "Sarajevo", "Vienna", "Milan", "Paris", "Geneva", "Amsterdam", "Berlin",
  "Copenhagen", "Zagreb", "Ljubljana", "Stockholm", "Florence", "Mostar", "Lyon",
];

const CHECKS = [
  "Authenticity and attribution checked in hand",
  "Condition graded from 0 to 10",
  "Every flaw marked on the photograph",
  "Measurements, materials and movement noted",
  "Provenance traced as far as records allow",
];

const STEPS = [
  {
    title: "Get a paddle",
    body: "Register with your name and e-mail address. Your paddle number is how you appear in the saleroom.",
    chip: "Paddle 1204 · Issued",
  },
  {
    title: "Read the report",
    body: "Every lot has a condition report with graded wear, marked flaws, specifications and provenance.",
    chip: "Grade 8.4 / 10",
  },
  {
    title: "Bid, calmly",
    body: `A bid in the final ${SOFT_CLOSE_MS / 60_000} minutes extends the close, so the highest bid wins rather than the fastest click.`,
    chip: `+${SOFT_CLOSE_MS / 60_000}:00 Soft close`,
  },
  {
    title: "Receive it insured",
    body: "Pay securely after the hammer falls. We handle packing, insurance and tracked delivery to your door.",
    chip: "Insured · Tracked",
  },
];

export default async function Home() {
  await connection();
  const { lots, open, featured, closingSoon, bidsThisWeek, liveValue, openCountBy } = await homeData();
  const sellExample = lots.find((l) => l.id === "red-portable-typewriter") ?? lots[0];

  const stats = [
    { value: formatNumber(open.length), label: "Lots open now" },
    { value: formatNumber(bidsThisWeek), label: "Bids in the last 7 days" },
    { value: formatMoney(liveValue), label: "Currently bid across open lots" },
    { value: `${SOFT_CLOSE_MS / 60_000} min`, label: "Soft-close window" },
  ];

  return (
    <>
      <Hero lot={featured} openCount={open.length} />

      {/* Consignor cities */}
      <div className="frame flex items-center overflow-hidden">
        <p className="label shrink-0 border-r border-line bg-paper py-5 pr-5 pl-5 sm:pl-8 lg:pl-12">Consigned from</p>
        <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
          <div className="marquee flex w-max gap-10 py-5 pl-10">
            {[...CITIES, ...CITIES].map((city, i) => (
              <span key={i} className="text-[15px] tracking-[-0.01em] whitespace-nowrap text-ink-3">
                {city}
              </span>
            ))}
          </div>
        </div>
      </div>

      <Spacer />

      {/* Closing soon */}
      <Section>
        <div className="gutter flex flex-col gap-6 py-12 sm:flex-row sm:items-end sm:justify-between sm:py-16">
          <div>
            <Eyebrow>Closing soon</Eyebrow>
            <SplitHeading lead="Lots ending" tone="in the next few days" className="mt-5 text-[clamp(34px,4.6vw,56px)] leading-[1.02]" />
          </div>
          <Link href="/auctions" className="btn btn-line self-start sm:self-auto">
            View all {lots.length} lots <span aria-hidden>→</span>
          </Link>
        </div>
        <div className="border-t border-line">
          <LotGrid lots={closingSoon} />
        </div>
      </Section>

      <Spacer />

      {/* Condition reports */}
      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="gutter flex flex-col py-12 sm:py-16 lg:border-r lg:border-line">
            <Eyebrow>Condition report</Eyebrow>
            <SplitHeading
              lead="Every lot,"
              tone="examined before it’s listed"
              className="mt-5 text-[clamp(34px,4.6vw,56px)] leading-[1.02]"
            />
            <p className="mt-6 max-w-md text-[16px] leading-relaxed text-ink-2">
              A specialist handles every object before it goes on sale. You see what they saw: graded wear, marked
              flaws and the measurements that matter.<sup className="text-ink-3">(2)</sup>
            </p>
            <ol className="mt-10 border-t border-line lg:mt-auto">
              {CHECKS.map((check, i) => (
                <li key={check} className="flex gap-4 border-b border-line py-3.5 text-[15px]">
                  <span className="w-7 font-mono text-[12px] text-ink-3">[{i + 1}]</span>
                  {check}
                </li>
              ))}
            </ol>
            <Link href={`/auctions/${featured.id}#condition`} className="link-quiet mt-8 self-start text-[15px]">
              Open the full report for Lot {lotNumber(featured.number)}
            </Link>
          </div>
          <div className="p-4 sm:p-8 lg:p-10">
            <ConditionReport lot={featured} overlayGrade sizes="(min-width: 1024px) 560px, 100vw" />
          </div>
        </div>
      </Section>

      <Spacer />

      {/* How it works */}
      <Section id="how">
        <div className="gutter py-12 text-center sm:py-16">
          <Eyebrow>How it works</Eyebrow>
          <SplitHeading
            lead="A saleroom,"
            tone="without the rush"
            className="mx-auto mt-5 max-w-3xl text-[clamp(34px,4.6vw,56px)] leading-[1.02]"
          />
          <p className="mx-auto mt-5 max-w-lg text-[16px] leading-relaxed text-ink-2">
            Everything you’d expect from a good auction house: specialists, estimates and reserves. The bidding is
            online and nobody can snipe it.
          </p>
        </div>
        <ol className="grid border-t border-line sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="flex flex-col border-line p-6 max-lg:border-b sm:p-8 sm:odd:border-r lg:border-r lg:last:border-r-0"
            >
              <span className="grid size-8 place-items-center rounded-full border border-line font-mono text-[12px] text-ink-3">
                {i + 1}
              </span>
              <h3 className="mt-6 text-[21px] tracking-[-0.02em]">{step.title}</h3>
              <p className="mt-2 flex-1 text-[15px] leading-relaxed text-ink-2">{step.body}</p>
              <span className="mt-8 self-start rounded-full border border-line bg-paper-2 px-3 py-1.5 font-mono text-[11px] tracking-[0.06em] text-ink-2 uppercase">
                {step.chip}
              </span>
            </li>
          ))}
        </ol>
      </Section>

      <Spacer />

      {/* Categories band */}
      <section className="relative isolate overflow-hidden bg-[linear-gradient(160deg,#a89986_0%,#8a7c6b_55%,#6e6356_100%)] text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_0%,rgba(255,255,255,0.22),transparent_55%)]" />
        <div className="mx-auto max-w-[1320px] px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Eyebrow glass>Categories</Eyebrow>
              <h2 className="display mt-5 text-[clamp(34px,4.6vw,56px)] leading-[1.02]">
                Browse by
                <br />
                <span className="font-serif tracking-[-0.01em] text-tone-light italic">what you collect</span>
              </h2>
            </div>
            <p className="max-w-xs text-[15px] leading-relaxed text-white/75">
              Specialists in each field set the estimates and inspect every lot before it is listed.
            </p>
          </div>
          <ul className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.map((cat) => {
              const inCat = lots.filter((l) => l.category === cat.slug);
              const cover = inCat[0];
              const openInCat = openCountBy(cat.slug);
              return (
                <li key={cat.slug}>
                  <Link
                    href={`/auctions?category=${cat.slug}`}
                    className="glass group flex h-full flex-col p-3 transition-colors hover:bg-white/20"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] bg-white/10">
                      {cover && (
                        <Image
                          src={cover.image.src}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 230px, 45vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          unoptimized={cover.image.src.startsWith("/api/")}
                        />
                      )}
                    </div>
                    <p className="mt-3 text-[15px] tracking-[-0.01em]">{cat.name}</p>
                    <p className="mt-0.5 font-mono text-[11px] tracking-[0.06em] text-white/65 uppercase">
                      {openInCat} open · {inCat.length} total
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <Spacer />

      {/* Live numbers */}
      <Section>
        <div className="gutter py-10">
          <Eyebrow>Right now</Eyebrow>
        </div>
        <dl className="grid grid-cols-2 border-t border-line lg:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col-reverse justify-end border-line p-6 sm:p-8 ${i % 2 === 0 ? "border-r" : ""} ${i < 2 ? "max-lg:border-b" : ""} lg:border-r lg:last:border-r-0`}
            >
              <dt className="label mt-3">{s.label}</dt>
              <dd className="display text-[clamp(30px,4vw,52px)] leading-none tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Spacer />

      {/* Sell */}
      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="gutter flex flex-col py-12 sm:py-16 lg:border-r lg:border-line">
            <Eyebrow>Sell with Malisa</Eyebrow>
            <SplitHeading lead="Consign an object," tone="reach serious bidders" className="mt-5 text-[clamp(34px,4.6vw,56px)] leading-[1.02]" />
            <p className="mt-6 max-w-md text-[16px] leading-relaxed text-ink-2">
              List in minutes. A specialist reviews your lot, you set a reserve, and bidders from across Europe
              compete for it.
            </p>
            <ol className="mt-10 border-t border-line">
              {["Describe and photograph your object", "Set a starting bid, estimate and reserve", "Get paid once the buyer has paid"].map(
                (s, i) => (
                  <li key={s} className="flex gap-4 border-b border-line py-3.5 text-[15px]">
                    <span className="w-7 font-mono text-[12px] text-ink-3">[{i + 1}]</span>
                    {s}
                  </li>
                ),
              )}
            </ol>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/sell" className="btn btn-ink">
                Start a listing
              </Link>
              <Link href="/#faq" className="btn btn-line">
                Seller questions
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center bg-paper-2 p-6 sm:p-10">
            <div className="card w-full max-w-md overflow-hidden shadow-[0_30px_80px_-40px_rgba(31,28,25,0.35)]">
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <span className="label">Consignment preview</span>
                <span className="label">Draft</span>
              </div>
              <div className="relative aspect-[3/2] bg-paper-3">
                <Image src={sellExample.image.src} alt="" fill sizes="448px" className="object-cover" />
              </div>
              <dl className="divide-y divide-line px-5 text-[14px]">
                {[
                  ["Object", sellExample.title],
                  ["Specialist estimate", `${formatMoney(sellExample.estimate[0])}–${formatNumber(sellExample.estimate[1])}`],
                  ["Seller's commission", `${SITE.sellersCommission} of hammer`],
                  ["Listing fee", "None"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-6 py-3">
                    <dt className="label pt-0.5">{k}</dt>
                    <dd className="text-right text-ink-2">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </Section>

      <Spacer />

      {/* FAQ */}
      <Section id="faq">
        <div className="grid grid-cols-1 gap-10 py-12 sm:py-16 lg:grid-cols-12">
          <div className="gutter lg:col-span-5">
            <Eyebrow>FAQ</Eyebrow>
            <SplitHeading lead="Questions," tone="answered" className="mt-5 text-[clamp(34px,4.6vw,56px)] leading-[1.02]" />
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-ink-2">
              Something else? Write to{" "}
              <a href={`mailto:${SITE.email}`} className="link-quiet">
                {SITE.email}
              </a>
              .
            </p>
          </div>
          <div className="px-5 sm:px-8 lg:col-span-7 lg:pr-12 lg:pl-0">
            <Faq />
          </div>
        </div>
      </Section>

      <Spacer />
    </>
  );
}

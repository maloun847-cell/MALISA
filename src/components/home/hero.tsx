import Image from "next/image";
import Link from "next/link";
import { Countdown } from "@/components/lots/countdown";
import { currentPrice, reserveMet } from "@/lib/auction";
import { formatMoney, lotNumber } from "@/lib/format";
import type { Lot } from "@/lib/types";

const FEATURES = [
  ["Specialist-inspected", "Graded and photographed"],
  ["Soft-close bidding", "No last-second sniping"],
  ["Insured shipping", "Door to door, tracked"],
];

export function Hero({ lot, openCount }: { lot: Lot; openCount: number }) {
  return (
    <section className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#4f504d_0%,#696b69_52%,#8d8e8c_100%)] text-white">
      {/* The photograph's own backdrop is this same grey gradient, so it melts into the section. */}
      <div className="absolute inset-y-0 right-0 -z-10 w-full md:w-[64%]">
        <div className="absolute inset-y-0 left-1/2 aspect-[1103/1400] h-full -translate-x-1/2 [mask-composite:intersect] [mask-image:linear-gradient(90deg,transparent,black_14%,black_86%,transparent),linear-gradient(180deg,transparent,black_12%)] max-md:opacity-40">
          <Image
            src={lot.image.src}
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_15%_45%,rgba(40,38,34,0.45),transparent_60%)]" />

      <div className="mx-auto flex min-h-[max(640px,100svh)] max-w-[1320px] flex-col px-5 pt-32 pb-8 sm:px-8 lg:px-12 lg:pt-40">
        <div className="max-w-[640px]">
          <span className="eyebrow-glass rise">
            <span className="live-dot size-1.5 rounded-full bg-[#ff8a6b]" aria-hidden />
            Live now · {openCount} lots open for bidding
          </span>
          <h1 className="display rise mt-6 text-[clamp(44px,7vw,88px)] leading-[0.98] [animation-delay:80ms]">
            Bid on objects
            <br />
            <span className="font-serif tracking-[-0.01em] text-tone-light italic">worth keeping.</span>
          </h1>
          <p className="rise mt-6 max-w-[460px] text-[17px] leading-relaxed text-white/80 [animation-delay:160ms]">
            Watches, art, design and furniture. Every lot is inspected by a specialist and sold in a soft-close
            online auction.
          </p>
          <div className="rise mt-9 flex flex-wrap gap-3 [animation-delay:240ms]">
            <Link href="/auctions" className="btn btn-white h-12 px-6">
              Browse auctions
            </Link>
            <Link href="/#how" className="btn btn-glass h-12 px-6">
              How it works
            </Link>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-8 pt-16 lg:flex-row lg:items-end lg:justify-between">
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-0">
            {FEATURES.map(([title, sub], i) => (
              <li key={title} className={`sm:px-6 ${i === 0 ? "sm:pl-0" : "sm:border-l sm:border-white/25"}`}>
                <p className="text-[15px]">{title}</p>
                <p className="mt-1 text-[13px] text-white/65">{sub}</p>
              </li>
            ))}
          </ul>

          <Link
            href={`/auctions/${lot.id}`}
            className="glass group block w-full p-4 transition-colors hover:bg-white/15 sm:max-w-[360px] lg:w-[340px]"
          >
            <div className="flex items-center justify-between font-mono text-[11px] tracking-[0.06em] text-white/75 uppercase">
              <span>Lot {lotNumber(lot.number)} · Featured</span>
              <span className="flex items-center gap-1.5">
                <span className="live-dot size-1.5 rounded-full bg-[#ff8a6b]" aria-hidden />
                <Countdown until={lot.endsAt} />
              </span>
            </div>
            <p className="mt-3 line-clamp-2 text-[16px] leading-snug">{lot.title}</p>
            <div className="mt-4 flex items-end justify-between border-t border-white/20 pt-3">
              <div>
                <p className="font-mono text-[11px] tracking-[0.06em] text-white/65 uppercase">Current bid</p>
                <p className="mt-0.5 text-[24px] font-light tracking-[-0.03em] tabular-nums">
                  {formatMoney(currentPrice(lot))}
                </p>
              </div>
              <p className="font-mono text-[11px] tracking-[0.06em] text-white/65 uppercase">
                {lot.bids.length} bids · {reserveMet(lot) ? "Reserve met" : "Reserve not met"}
              </p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

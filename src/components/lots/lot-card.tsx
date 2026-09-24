import Image from "next/image";
import Link from "next/link";
import { currentPrice, highestBid, lotStatus } from "@/lib/auction";
import { categoryName } from "@/lib/categories";
import { formatEstimate, formatMoney, lotNumber } from "@/lib/format";
import type { Lot } from "@/lib/types";
import { StatusChip } from "./status-chip";

export function LotCard({ lot, priority = false }: { lot: Lot; priority?: boolean }) {
  const status = lotStatus(lot);
  const top = highestBid(lot);
  const priceLabel = status === "ended" ? (top ? "Sold for" : "Unsold") : top ? "Current bid" : "Starting bid";

  return (
    <Link href={`/auctions/${lot.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] bg-paper-2">
        <Image
          src={lot.image.src}
          alt={lot.title}
          fill
          priority={priority}
          sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 90vw"
          className="object-cover transition-transform duration-700 ease-[var(--ease-out-soft)] group-hover:scale-[1.035]"
          unoptimized={lot.image.src.startsWith("/api/")}
        />
        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
          <span className="inline-flex h-7 items-center rounded-full bg-white/85 px-2.5 font-mono text-[11px] tracking-[0.04em] text-ink-2 uppercase backdrop-blur-md">
            Lot {lotNumber(lot.number)}
          </span>
          <StatusChip status={status} endsAt={lot.endsAt} startsAt={lot.startsAt} />
        </div>
      </div>
      <div className="pt-4">
        <p className="label">{categoryName(lot.category)}</p>
        <h3 className="mt-1.5 line-clamp-2 min-h-[2.6em] text-[17px] leading-[1.3] tracking-[-0.015em] text-ink">
          {lot.title}
        </h3>
        <div className="mt-3 flex items-end justify-between gap-3 border-t border-line pt-3">
          <div>
            <p className="label">{priceLabel}</p>
            <p className="mt-0.5 text-[18px] tracking-[-0.02em] tabular-nums">{formatMoney(currentPrice(lot))}</p>
          </div>
          <div className="text-right">
            <p className="label">{lot.bids.length === 1 ? "1 bid" : `${lot.bids.length} bids`}</p>
            <p className="mt-0.5 text-[13px] text-ink-3 tabular-nums">Est. {formatEstimate(lot.estimate)}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Lot cards inside hairline grid cells, echoing the page frame. */
export function LotGrid({ lots, priorityCount = 0 }: { lots: Lot[]; priorityCount?: number }) {
  return (
    <ul className="-mb-px grid grid-cols-1 border-line sm:grid-cols-2 lg:grid-cols-4 [&>li]:border-line [&>li]:border-b sm:[&>li:nth-child(2n+1)]:border-r lg:[&>li]:border-r lg:[&>li:nth-child(4n)]:border-r-0">
      {lots.map((lot, i) => (
        <li key={lot.id} className="p-4 sm:p-5">
          <LotCard lot={lot} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}

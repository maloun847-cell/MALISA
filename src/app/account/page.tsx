import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { connection } from "next/server";
import { signOutAction } from "@/app/actions";
import { Countdown } from "@/components/lots/countdown";
import { RegisterButton } from "@/components/site/register-prompt";
import { SplitHeading } from "@/components/ui/heading";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section, Spacer } from "@/components/ui/section";
import { currentPrice, highestBid, lotStatus, reserveMet } from "@/lib/auction";
import { formatMoney, lotNumber, paddleNumber } from "@/lib/format";
import { currentBidder } from "@/lib/session";
import { lotsBidOnBy, lotsListedBy } from "@/lib/store";
import type { Lot } from "@/lib/types";

export const metadata: Metadata = { title: "My paddle" };

type Row = { lot: Lot; mine: number; tag: string; tone: "ok" | "signal" | "muted" };

function rowFor(lot: Lot, paddle: number): Row {
  const mine = Math.max(...lot.bids.filter((b) => b.paddle === paddle).map((b) => b.amount));
  const leading = highestBid(lot)?.paddle === paddle;
  const ended = lotStatus(lot) === "ended";
  if (ended) {
    if (leading && reserveMet(lot)) return { lot, mine, tag: "Won", tone: "ok" };
    if (leading) return { lot, mine, tag: "Reserve not met", tone: "muted" };
    return { lot, mine, tag: "Outbid", tone: "muted" };
  }
  return leading ? { lot, mine, tag: "Leading", tone: "ok" } : { lot, mine, tag: "Outbid", tone: "signal" };
}

export default async function AccountPage() {
  await connection();
  const bidder = await currentBidder();

  if (!bidder) {
    return (
      <>
        <Section rule={false}>
          <div className="gutter py-20 sm:py-28">
            <Eyebrow>My paddle</Eyebrow>
            <SplitHeading as="h1" lead="You're not" tone="registered yet" className="mt-5 text-[clamp(40px,5.5vw,68px)] leading-[1]" />
            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-ink-2">
              Register a paddle to bid, keep track of your lots and list objects for sale.
            </p>
            <RegisterButton className="btn btn-ink mt-8" label="Register to bid" />
          </div>
        </Section>
        <Spacer />
      </>
    );
  }

  const rows = (await lotsBidOnBy(bidder.paddle))
    .map((lot) => rowFor(lot, bidder.paddle))
    .sort((a, b) => Date.parse(a.lot.endsAt) - Date.parse(b.lot.endsAt));
  const listed = await lotsListedBy(bidder.paddle);

  return (
    <>
      <Section rule={false}>
        <div className="gutter flex flex-col gap-8 py-12 sm:py-16 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Paddle {paddleNumber(bidder.paddle)}</Eyebrow>
            <SplitHeading as="h1" lead={bidder.name} tone="your saleroom" className="mt-5 text-[clamp(40px,5.5vw,68px)] leading-[1]" />
            <p className="label mt-4">{bidder.email}</p>
          </div>
          <form action={signOutAction}>
            <button type="submit" className="btn btn-line">
              Sign out
            </button>
          </form>
        </div>
      </Section>

      <Section>
        <div className="gutter py-8">
          <p className="label">Bidding /</p>
        </div>
        {rows.length === 0 ? (
          <div className="gutter border-t border-line py-14">
            <p className="text-[16px] text-ink-2">You haven&apos;t placed any bids yet.</p>
            <Link href="/auctions" className="btn btn-ink mt-5">
              Browse open lots
            </Link>
          </div>
        ) : (
          <ul className="border-t border-line">
            {rows.map(({ lot, mine, tag, tone }) => (
              <LotRow key={lot.id} lot={lot}>
                <div className="text-right max-sm:hidden">
                  <p className="label">Your top bid</p>
                  <p className="mt-0.5 tabular-nums">{formatMoney(mine)}</p>
                </div>
                <span
                  className={`text-right font-mono sm:w-32 text-[11px] tracking-[0.06em] uppercase ${
                    tone === "ok" ? "text-ok" : tone === "signal" ? "text-signal" : "text-ink-3"
                  }`}
                >
                  {tag}
                </span>
              </LotRow>
            ))}
          </ul>
        )}
      </Section>

      <Spacer className="h-10" />

      <Section>
        <div className="gutter flex items-center justify-between py-8">
          <p className="label">Your listings /</p>
          <Link href="/sell" className="btn btn-line btn-sm">
            List a lot
          </Link>
        </div>
        {listed.length === 0 ? (
          <p className="gutter border-t border-line py-10 text-[15px] text-ink-3">Nothing listed yet.</p>
        ) : (
          <ul className="border-t border-line">
            {listed.map((lot) => (
              <LotRow key={lot.id} lot={lot}>
                <div className="text-right">
                  <p className="label">{lot.bids.length} bids</p>
                  <p className="mt-0.5 tabular-nums">{formatMoney(currentPrice(lot))}</p>
                </div>
              </LotRow>
            ))}
          </ul>
        )}
      </Section>
      <Spacer />
    </>
  );
}

function LotRow({ lot, children }: { lot: Lot; children: ReactNode }) {
  const status = lotStatus(lot);
  return (
    <li className="border-b border-line last:border-b-0">
      <Link href={`/auctions/${lot.id}`} className="gutter flex items-center gap-4 py-4 transition-colors hover:bg-paper-2 sm:gap-6">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-paper-2">
          <Image src={lot.image.src} alt="" fill sizes="64px" className="object-cover" unoptimized={lot.image.src.startsWith("/api/")} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="label">
            Lot {lotNumber(lot.number)} ·{" "}
            {status === "ended" ? "Closed" : status === "upcoming" ? "Upcoming" : <Countdown until={lot.endsAt} />}
          </p>
          <p className="mt-1 truncate text-[16px]">{lot.title}</p>
        </div>
        <div className="flex shrink-0 items-center gap-4 sm:gap-6">{children}</div>
      </Link>
    </li>
  );
}

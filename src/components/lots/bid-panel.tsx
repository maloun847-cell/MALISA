"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { bidAction, type FormState } from "@/app/actions";
import { useRegister } from "@/components/site/register-provider";
import { BUYER_PREMIUM, SOFT_CLOSE_MS } from "@/lib/auction";
import { formatDateTime, formatMoney, paddleNumber, timeAgo } from "@/lib/format";
import type { LotSnapshot } from "@/lib/snapshot";
import { Countdown } from "./countdown";

type Props = {
  initial: LotSnapshot;
  paddle: number | null;
  isSeller: boolean;
};

export function BidPanel({ initial, paddle, isSeller }: Props) {
  const { open: openRegister } = useRegister();
  const [lot, setLot] = useState(initial);
  const [amount, setAmount] = useState(String(initial.minimumNextBid));

  // Server instances can briefly disagree, so never step back to an older view of the lot.
  const apply = useCallback((next: LotSnapshot) => {
    setLot((current) => (next.startsAt === current.startsAt && next.bidCount < current.bidCount ? current : next));
    // Keep the amount field valid when someone else outbids.
    setAmount((a) => (Number(a) < next.minimumNextBid ? String(next.minimumNextBid) : a));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/lots/${initial.id}`, { cache: "no-store" });
      if (res.ok) apply(await res.json());
    } catch {
      // Offline or the server restarted; the next poll will catch up.
    }
  }, [initial.id, apply]);

  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, form) => {
    const result = await bidAction(prev, form);
    if (result.lot) apply(result.lot);
    return result;
  }, {});

  // Poll while the page is visible, faster as the close approaches.
  useEffect(() => {
    if (lot.status === "ended") return;
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    const schedule = () => {
      const left = Date.parse(lot.endsAt) - Date.now();
      timer = setTimeout(async () => {
        if (document.visibilityState === "visible") await refresh();
        if (!stopped) schedule();
      }, left < 5 * 60_000 ? 3_000 : 8_000);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    schedule();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [lot.status, lot.endsAt, refresh]);

  const leading = paddle != null && lot.leaderPaddle === paddle;
  const outbid = paddle != null && !leading && lot.bids.some((b) => b.paddle === paddle);
  const open = lot.status === "live" || lot.status === "closing";
  const ended = lot.status === "ended";
  const priceLabel = ended ? (lot.bidCount ? (lot.reserveMet ? "Hammer price" : "Highest bid") : "No bids") : lot.bidCount ? "Current bid" : "Starting bid";

  return (
    <div className="card overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="label">{priceLabel}</p>
          <ReserveTag lot={lot} />
        </div>
        <p className="mt-1 text-[44px] leading-none font-light tracking-[-0.04em] tabular-nums" aria-live="polite">
          {formatMoney(lot.currentPrice)}
        </p>
        <p className="mt-2 text-[13px] text-ink-3">
          {lot.bidCount === 1 ? "1 bid" : `${lot.bidCount} bids`} · plus {Math.round(BUYER_PREMIUM * 100)}% buyer&apos;s
          premium<sup>(1)</sup>
        </p>

        <div className="mt-5 grid grid-cols-2 border-y border-line">
          <div className="border-r border-line py-3 pr-3">
            <p className="label">{lot.status === "upcoming" ? "Opens in" : ended ? "Closed" : "Time left"}</p>
            <p className={`mt-1 text-[20px] tracking-[-0.02em] ${lot.status === "closing" ? "text-signal" : ""}`}>
              {ended ? (
                <span className="text-[15px]">{formatDateTime(lot.endsAt)}</span>
              ) : (
                <Countdown until={lot.status === "upcoming" ? lot.startsAt : lot.endsAt} />
              )}
            </p>
          </div>
          <div className="py-3 pl-4">
            <p className="label">{ended ? "Result" : "Closes"}</p>
            <p className="mt-1 text-[15px] leading-[30px] text-ink-2">
              {ended ? (lot.bidCount && lot.reserveMet ? "Sold" : "Not sold") : formatDateTime(lot.endsAt)}
            </p>
          </div>
        </div>

        {leading && (
          <p className="mt-4 flex items-center gap-2 rounded-lg bg-ok/10 px-3 py-2 text-[14px] text-ok">
            <span className="size-1.5 rounded-full bg-ok" aria-hidden />
            {ended ? "You won this lot." : "You hold the highest bid."}
          </p>
        )}
        {outbid && (
          <p className="mt-4 flex items-center gap-2 rounded-lg bg-signal/10 px-3 py-2 text-[14px] text-signal">
            <span className="size-1.5 rounded-full bg-signal" aria-hidden />
            {ended ? "You were outbid on this lot." : "You have been outbid."}
          </p>
        )}

        {open && !isSeller && (
          <form action={action} className="mt-5">
            <input type="hidden" name="lotId" value={lot.id} />
            <p className="label">Quick bid</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {lot.quickBids.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(String(q))}
                  className={`h-10 rounded-full border text-[14px] tabular-nums transition-colors ${
                    Number(amount) === q ? "border-ink bg-ink text-white" : "border-line bg-paper hover:border-ink-3"
                  }`}
                >
                  {formatMoney(q)}
                </button>
              ))}
            </div>
            <label className="mt-4 block">
              <span className="label">Your bid (min. {formatMoney(lot.minimumNextBid)})</span>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3">€</span>
                <input
                  name="amount"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
                  className="field pl-8 text-[17px] tabular-nums"
                  aria-describedby="bid-feedback"
                />
              </div>
            </label>
            {paddle ? (
              <button type="submit" className="btn btn-ink mt-4 h-12 w-full text-[16px]" disabled={pending}>
                {pending ? "Placing bid…" : `Bid ${amount ? formatMoney(Number(amount)) : ""}`}
              </button>
            ) : (
              <button type="button" onClick={openRegister} className="btn btn-ink mt-4 h-12 w-full text-[16px]">
                Register to bid
              </button>
            )}
            <p
              id="bid-feedback"
              aria-live="polite"
              className={`mt-3 min-h-5 text-[14px] ${state.ok ? "text-ok" : "text-signal"}`}
            >
              {state.message}
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-3">
              Soft close: a bid in the final {SOFT_CLOSE_MS / 60_000} minutes extends the lot by{" "}
              {SOFT_CLOSE_MS / 60_000} minutes, so nobody can snipe it.
            </p>
          </form>
        )}
        {isSeller && open && (
          <p className="mt-5 rounded-lg bg-paper-2 px-3 py-2.5 text-[14px] text-ink-2">
            This is your lot. You can follow the bidding here.
          </p>
        )}
        {lot.status === "upcoming" && (
          <p className="mt-5 rounded-lg bg-paper-2 px-3 py-2.5 text-[14px] text-ink-2">
            Bidding opens {formatDateTime(lot.startsAt)}. Starting bid {formatMoney(lot.currentPrice)}.
          </p>
        )}
      </div>

      <div className="border-t border-line bg-paper-2/60 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <p className="label">Bid history</p>
          {!ended && (
            <p className="flex items-center gap-1.5 font-mono text-[11px] tracking-[0.06em] text-ink-3 uppercase">
              <span className="live-dot size-1.5 rounded-full bg-signal" aria-hidden />
              Live
            </p>
          )}
        </div>
        {lot.bids.length === 0 ? (
          <p className="mt-3 text-[14px] text-ink-3">No bids yet. Be the first.</p>
        ) : (
          <ol className="mt-2 max-h-64 divide-y divide-line overflow-y-auto">
            {lot.bids.map((b, i) => (
              <li key={b.id} className="flex items-center gap-3 py-2.5 text-[14px]">
                <span className="w-[4.5rem] shrink-0 font-mono text-[11.5px] text-ink-3">#{paddleNumber(b.paddle)}</span>
                <span className="flex-1 truncate text-ink-2">
                  {b.paddle === paddle ? "You" : b.bidder}
                  {i === 0 && <span className="sr-only"> ({ended ? "winning bid" : "leading"})</span>}
                </span>
                <span className="text-[12px] text-ink-3" suppressHydrationWarning>
                  {timeAgo(b.at)}
                </span>
                <span className={`w-20 text-right tabular-nums ${i === 0 ? "text-ok" : ""}`}>{formatMoney(b.amount)}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function ReserveTag({ lot }: { lot: LotSnapshot }) {
  if (!lot.hasReserve) return <span className="label">No reserve</span>;
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.06em] uppercase ${
        lot.reserveMet ? "text-ok" : "text-ink-3"
      }`}
    >
      <span className={`size-1.5 rounded-full ${lot.reserveMet ? "bg-ok" : "bg-line-2"}`} aria-hidden />
      {lot.reserveMet ? "Reserve met" : "Reserve not met"}
    </span>
  );
}

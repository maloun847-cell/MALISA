import type { Metadata } from "next";
import { SellForm } from "@/components/sell/sell-form";
import { RegisterButton } from "@/components/site/register-prompt";
import { SplitHeading } from "@/components/ui/heading";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section, Spacer } from "@/components/ui/section";
import { SOFT_CLOSE_MS } from "@/lib/auction";
import { paddleNumber } from "@/lib/format";
import { currentBidder } from "@/lib/session";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Sell" };

const TERMS = [
  ["Listing fee", "None"],
  ["Seller's commission", `${SITE.sellersCommission} of the hammer price`],
  ["Unsold lots", "No charge"],
  ["Soft close", `${SOFT_CLOSE_MS / 60_000} minutes`],
  ["Payout", "Once the buyer has paid"],
];

export default async function SellPage() {
  const bidder = await currentBidder();

  return (
    <>
      <Section rule={false}>
        <div className="gutter py-12 sm:py-16">
          <Eyebrow>Consign a lot</Eyebrow>
          <SplitHeading as="h1" lead="Sell an object" tone="to people who care" className="mt-5 text-[clamp(40px,5.5vw,68px)] leading-[1]" />
        </div>
      </Section>
      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="gutter py-4 lg:col-span-8 lg:border-r lg:border-line">
            {bidder ? (
              <SellForm />
            ) : (
              <div className="py-16">
                <p className="display text-[30px] leading-tight">
                  Register a paddle <span className="tone">to list a lot</span>
                </p>
                <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-2">
                  Sellers and bidders use the same free account. It takes a name and an e-mail address.
                </p>
                <RegisterButton className="btn btn-ink mt-6" label="Register to sell" />
              </div>
            )}
          </div>
          <aside className="border-t border-line lg:col-span-4 lg:border-t-0">
            <div className="p-5 sm:p-8 lg:sticky lg:top-16">
              {bidder && (
                <p className="label mb-6">
                  Listing as {bidder.name} · Paddle {paddleNumber(bidder.paddle)}
                </p>
              )}
              <p className="label">Terms /</p>
              <dl className="mt-3 divide-y divide-line border-y border-line text-[14px]">
                {TERMS.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-6 py-3">
                    <dt className="text-ink-3">{k}</dt>
                    <dd className="text-right">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="label mt-10">What sells well /</p>
              <ul className="mt-3 space-y-3 text-[14px] leading-relaxed text-ink-2">
                <li>
                  <span className="mr-2 font-mono text-[12px] text-ink-3">[a]</span>Honest photographs, with any damage
                  shown clearly.
                </li>
                <li>
                  <span className="mr-2 font-mono text-[12px] text-ink-3">[b]</span>A low starting bid. It draws early
                  bidders, and the reserve still protects you.
                </li>
                <li>
                  <span className="mr-2 font-mono text-[12px] text-ink-3">[c]</span>Measurements, materials and anything
                  you know about where the object came from.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </Section>
      <Spacer />
    </>
  );
}

import { SOFT_CLOSE_MS } from "@/lib/auction";
import { SITE } from "@/lib/site";

const minutes = SOFT_CLOSE_MS / 60_000;

export const FAQ: { q: string; a: string }[] = [
  {
    q: "How does soft-close bidding work?",
    a: `Every lot has a scheduled close time. If a bid arrives in the final ${minutes} minutes, the close moves back to ${minutes} minutes after that bid. The lot only closes once ${minutes} full minutes pass with no new bids, so everyone gets a fair chance to respond.`,
  },
  {
    q: "What is a paddle?",
    a: "In a saleroom, bidders raise a numbered paddle. Here your paddle number is your bidding identity. Other bidders see only the number and your initials. Registering is free and takes a name and an e-mail address.",
  },
  {
    q: "What will I pay on top of the hammer price?",
    a: `A buyer's premium of ${SITE.buyersPremium} is added to the hammer price. VAT and shipping are shown at checkout before you pay. The panel next to each lot always shows the current bid without the premium.`,
  },
  {
    q: "What does the condition grade mean?",
    a: "A specialist inspects each lot in hand and grades it from 0 to 10. They mark every flaw they find on the photograph, with a short note. A grade of 7.5 or above means the object is excellent for its age and type.",
  },
  {
    q: "What happens if the reserve isn't met?",
    a: "The reserve is the seller's confidential minimum. If bidding closes below it, the lot does not sell. The seller may then offer it to the highest bidder, or relist it later.",
  },
  {
    q: "How do I sell with Malisa?",
    a: `Register a paddle, then list your object with photographs, a description and your price expectations. We charge a ${SITE.sellersCommission} commission on sold lots and nothing if a lot doesn't sell.`,
  },
];

export function Faq() {
  return (
    <div className="divide-y divide-line border-y border-line">
      {FAQ.map((item, i) => (
        <details key={item.q} className="group" open={i === 0}>
          <summary className="flex cursor-pointer items-center gap-4 py-5 text-[17px] tracking-[-0.015em] transition-colors hover:text-ink-2">
            <span className="w-8 shrink-0 font-mono text-[11px] text-ink-3">[{i + 1}]</span>
            <span className="flex-1">{item.q}</span>
            <span className="faq-icon grid size-7 shrink-0 place-items-center rounded-full border border-line transition-transform duration-300">
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                <path d="M5 0v10M0 5h10" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </span>
          </summary>
          <p className="pr-10 pb-6 pl-12 text-[15px] leading-relaxed text-ink-2">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { SITE } from "@/lib/site";

const COLUMNS = [
  {
    title: "Auctions",
    links: [
      { href: "/auctions", label: "All lots" },
      { href: "/auctions?status=closing", label: "Closing soon" },
      { href: "/auctions?status=upcoming", label: "Upcoming" },
      { href: "/auctions?status=ended", label: "Results" },
    ],
  },
  {
    title: "Categories",
    links: CATEGORIES.slice(0, 5).map((c) => ({ href: `/auctions?category=${c.slug}`, label: c.name })),
  },
  {
    title: "Malisa",
    links: [
      { href: "/#how", label: "How it works" },
      { href: "/sell", label: "Sell with us" },
      { href: "/#faq", label: "FAQ" },
      { href: "/account", label: "My paddle" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="frame overflow-hidden border-t">
      <span className="reg-mark" data-side="left" aria-hidden />
      <span className="reg-mark" data-side="right" aria-hidden />
      <div className="gutter grid gap-12 py-14 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="label">{SITE.name} Auctions /</p>
          <a href={`mailto:${SITE.email}`} className="mt-4 inline-block text-[15px] text-ink-2 hover:text-ink">
            {SITE.email}
          </a>
          <p className="label mt-10">Notes /</p>
          <ol className="mt-4 max-w-md space-y-2 text-[12px] leading-relaxed text-ink-3">
            <li>
              (1) A buyer&apos;s premium of {SITE.buyersPremium} is added to the hammer price. VAT and shipping are
              calculated at checkout.
            </li>
            <li>(2) Condition grades are a specialist&apos;s opinion. They are not a guarantee against wear that was not visible at inspection.</li>
            <li>(3) Estimates are a guide only. A lot may sell above or below its estimate.</li>
          </ol>
        </div>
        {COLUMNS.map((col, i) => (
          <div key={col.title} className={`md:col-span-2 ${i === 0 ? "md:col-start-7" : ""}`}>
            <p className="label">{col.title} /</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[14px] text-ink-2 transition-colors hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="gutter flex flex-wrap items-center justify-between gap-3 border-t border-line py-5">
        <p className="label">© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
        <p className="label">Soft-close bidding · Specialist-inspected lots</p>
      </div>
      <div className="relative border-t border-line select-none" aria-hidden>
        <p className="translate-y-[16%] text-center text-[clamp(96px,24.5vw,330px)] leading-[0.8] font-light tracking-[-0.06em] bg-[linear-gradient(100deg,var(--color-sand-deep)_0%,var(--color-tone-light)_38%,var(--color-sand)_62%,var(--color-ink-2)_100%)] bg-clip-text text-transparent">
          Malisa
        </p>
      </div>
    </footer>
  );
}

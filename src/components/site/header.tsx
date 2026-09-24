"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { paddleNumber } from "@/lib/format";
import { Logo } from "./logo";
import { useRegister } from "./register-provider";

const NAV = [
  { href: "/auctions", label: "Auctions" },
  { href: "/sell", label: "Sell" },
  { href: "/#how", label: "How it works" },
  { href: "/#faq", label: "FAQ" },
];

export function Header({ paddle }: { paddle: number | null }) {
  const pathname = usePathname();
  const { open: openRegister } = useRegister();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // On the home page the header floats over the hero photograph until you scroll.
  const overlay = pathname === "/" && !scrolled && !menu;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,color,border-color] duration-300 ${
          overlay ? "border-b border-transparent text-white" : "border-b border-line bg-paper/85 text-ink backdrop-blur-xl"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-6 px-5 sm:px-8 lg:px-12">
          <Link href="/" className="shrink-0" aria-label="Malisa home">
            <Logo />
          </Link>

          <nav className="mx-auto hidden items-center gap-8 md:flex" aria-label="Main">
            {NAV.map((item) => {
              const active = item.href !== "/" && pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-[14px] tracking-[-0.01em] transition-opacity hover:opacity-100 ${
                    active ? "opacity-100" : "opacity-75"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            {paddle ? (
              <Link
                href="/account"
                className={`hidden h-9 items-center gap-2 rounded-full border px-3.5 font-mono text-[12px] tracking-[0.04em] uppercase sm:inline-flex ${
                  overlay ? "border-white/30 bg-white/10 backdrop-blur-md" : "border-line bg-paper-2"
                }`}
              >
                <span className="size-1.5 rounded-full bg-ok" aria-hidden />
                Paddle {paddleNumber(paddle)}
              </Link>
            ) : (
              <button
                type="button"
                onClick={openRegister}
                className="hidden px-3 text-[14px] opacity-80 transition-opacity hover:opacity-100 sm:block"
              >
                Register
              </button>
            )}
            <Link href="/auctions" className={`btn btn-sm ${overlay ? "btn-white" : "btn-ink"}`}>
              Browse lots
            </Link>
            <button
              type="button"
              className="-mr-2 grid size-10 place-items-center md:hidden"
              aria-label={menu ? "Close menu" : "Open menu"}
              aria-expanded={menu}
              onClick={() => setMenu((m) => !m)}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                {menu ? (
                  <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.4" />
                ) : (
                  <path d="M2 6h14M2 12h14" stroke="currentColor" strokeWidth="1.4" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {menu && (
          <nav className="border-t border-line bg-paper px-5 pb-6 sm:px-8 md:hidden" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenu(false)}
                className="block border-b border-line py-4 text-[22px] font-light tracking-[-0.02em]">
                {item.label}
              </Link>
            ))}
            {paddle ? (
              <Link href="/account" onClick={() => setMenu(false)} className="mt-5 block font-mono text-[12px] tracking-[0.06em] text-ink-3 uppercase">
                Paddle {paddleNumber(paddle)} · My bids
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMenu(false);
                  openRegister();
                }}
                className="btn btn-line mt-5 w-full"
              >
                Register to bid
              </button>
            )}
          </nav>
        )}
      </header>
      {pathname !== "/" && <div className="h-16" aria-hidden />}
    </>
  );
}

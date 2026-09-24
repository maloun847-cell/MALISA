import Link from "next/link";
import { Section, Spacer } from "@/components/ui/section";

export default function NotFound() {
  return (
    <>
      <Section rule={false}>
        <div className="gutter py-24 sm:py-32">
          <p className="label">Error 404 /</p>
          <h1 className="display mt-5 text-[clamp(40px,6vw,76px)] leading-[1]">
            This lot has
            <br />
            <span className="tone">left the saleroom</span>
          </h1>
          <p className="mt-5 max-w-md text-[16px] leading-relaxed text-ink-2">
            The page you were looking for doesn&apos;t exist, or the lot has been withdrawn.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/auctions" className="btn btn-ink">
              Browse open lots
            </Link>
            <Link href="/" className="btn btn-line">
              Home
            </Link>
          </div>
        </div>
      </Section>
      <Spacer />
    </>
  );
}

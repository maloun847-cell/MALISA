# Malisa: online auctions

Malisa is an online auction site for objects worth keeping: watches, art, design, furniture and more. Every lot comes with a specialist condition report. Bidding uses a soft close, so lots can't be sniped.

The visual language borrows *ideas* from [qoves.com](https://www.qoves.com/) and nothing else. The brand, palette, type, copy and imagery are Malisa's own. The ideas borrowed are:

- a light, clinical canvas framed by hairline rails
- two-tone headings
- small mono labels
- data shown in glassy panels

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

The first request seeds a demo catalogue of 17 lots into `.data/db.json`. It includes live, closing, upcoming and closed lots with realistic bid histories.

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generates route types, then runs `tsc` |
| `npm test` | Unit tests (Vitest) for the auction rules and the seed data |
| `npm run db:reset` | Deletes the local database. The next request re-seeds it. |

## What's in it

| Route | Page |
|---|---|
| `/` | Home page. It has these sections: hero with a featured live lot, closing-soon lots, condition-report showcase, how it works, categories, live numbers, selling, FAQ. |
| `/auctions` | Catalogue with search, status tabs (open, closing soon, upcoming, results), category filters and sorting |
| `/auctions/[id]` | Lot page. It has the live bid panel, the annotated condition report, specifications, provenance and seller details. |
| `/sell` | Listing form with a photo upload |
| `/account` | Your paddle. It shows the lots you're leading or have been outbid on, and your own listings. |
| `/api/lots/[id]` | JSON snapshot the bid panel polls every 2–5 s |

### Auction rules (`src/lib/auction.ts`)

- **Bid increments** follow a stepped table: €5 under €100, up to €500 above €50,000.
- **Soft close:** a bid in the final 2 minutes pushes the close back to 2 minutes after that bid.
- **Reserve:** a lot only sells if the top bid reaches the reserve. The reserve itself is never shown.
- The current leader can't outbid themselves.
- Sellers can't bid on their own lots.
- **Buyer's premium:** 15%. **Seller's commission:** 10%. Both are set in `src/lib/site.ts`.

### Project layout

```
src/
  app/                 routes, server actions (actions.ts), API routes
  components/
    home/              hero, FAQ
    lots/              lot card, bid panel, condition report, countdown
    sell/              listing form
    site/              header, footer, logo, register dialog
    ui/                section frame, eyebrow label, two-tone heading
  lib/
    auction.ts         pure bidding rules (unit-tested)
    store.ts           the auction database: cached reads, conflict-checked writes
    persistence.ts     where it lives: .data/ on disk, or a private Vercel Blob store
    seed.ts            demo catalogue
    session.ts         signed "paddle" cookie carrying the bidder's identity
    queries.ts         page-level data queries
```

### Design tokens

The tokens live in `src/app/globals.css` (Tailwind v4 `@theme`):

- **Colours:** warm paper and ink neutrals, a taupe second tone, and one signal red that marks urgency only.
- **Fonts:** Inter Tight (text), IBM Plex Mono (labels), Instrument Serif italic (the quieter half of headings).
- **Motifs:** the page frame is drawn with hairline rules, with `+` registration marks where they cross. Lists use bracketed indices (`[1]`, `[a]`). Section labels end in a slash (`Auctions /`).

## Deploying to Vercel

Vercel runs the app on several servers at once, and each one has its own short-lived disk. So on Vercel the data and uploaded photos live in a **private Vercel Blob store** instead of `.data/`:

1. Import the repository into Vercel. The framework is detected as Next.js.
2. Under **Storage**, create a Blob store with **private** access and connect it to the project. This adds `BLOB_READ_WRITE_TOKEN`, and the app switches to Blob automatically.
3. Add `MALISA_SECRET`, set to a long random string.

Every change re-reads the stored document and writes it back only if nobody else wrote in between (an ETag check). If someone did, the change is retried on the newer version, so two simultaneous bids can't overwrite each other.

Reads are cached for 4 seconds per server. The bid panel refreshes every 3–8 seconds and pauses while the tab is hidden. The Hobby plan includes 10,000 Blob reads and 2,000 writes a month. That is plenty for a preview, but not for real traffic.

## Before going live

This is a working prototype. Several parts are deliberately simple and need replacing before real money changes hands:

1. **Authentication.** A "paddle" is a signed cookie issued from a name and an e-mail address, with no verification. Anyone who types an existing e-mail address gets that paddle. Replace it with a real auth provider (magic links, OAuth), and set `MALISA_SECRET` in every environment.
2. **Database.** The whole auction is one JSON document (see [Deploying to Vercel](#deploying-to-vercel)). Writes are safe under concurrency, but every bid rewrites the whole document. Move to Postgres or similar before real volume, with a transaction around each bid. `createStore` in `src/lib/store.ts` is the seam to replace.
3. **Uploads.** Photos go to `.data/uploads` locally and to the private Blob store on Vercel. Either way they are served through `/api/uploads/…`. Resize them on upload before real sellers use the site.
4. **Real-time updates.** The bid panel polls. For heavy traffic, switch to Server-Sent Events or WebSockets.
5. **Payments, shipping and e-mail notifications** (outbid alerts, won-lot invoices) are not built yet.
6. **Content.** The contact address (`hello@malisa.example`), fees, policies and FAQ answers are placeholders. So is the whole demo catalogue: its lots, sellers and bidders are fictional.

## Credits

The demo photographs are CC0 or public domain, from StockSnap and The Metropolitan Museum of Art Open Access. See [docs/IMAGE_CREDITS.md](docs/IMAGE_CREDITS.md).

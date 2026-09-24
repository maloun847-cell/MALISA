"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isCategory } from "@/lib/categories";
import { imageSize } from "@/lib/image-size";
import { currentBidder, endSession, startSession } from "@/lib/session";
import { type LotSnapshot, snapshot } from "@/lib/snapshot";
import { backend, createLot, placeBid, registerBidder } from "@/lib/store";

export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** The lot as it stands after a successful bid. */
  lot?: LotSnapshot;
};

const TRY_AGAIN = "We couldn't save that just now. Please try again.";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const whole = (form: FormData, key: string) => {
  const raw = text(form, key).replace(/[\s,€]/g, "");
  return raw === "" ? NaN : Number(raw);
};

export async function registerAction(_prev: FormState, form: FormData): Promise<FormState> {
  const name = text(form, "name");
  const email = text(form, "email");
  const errors: Record<string, string> = {};
  if (name.length < 2 || name.length > 60) errors.name = "Enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid e-mail address.";
  if (Object.keys(errors).length) return { errors };

  let bidder;
  try {
    bidder = await registerBidder(name, email);
  } catch (error) {
    console.error("[malisa] registration failed", error);
    return { message: TRY_AGAIN };
  }
  await startSession(bidder);
  revalidatePath("/", "layout");
  return { ok: true, message: `Paddle ${bidder.paddle} is ready.` };
}

export async function signOutAction(): Promise<void> {
  await endSession();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function bidAction(_prev: FormState, form: FormData): Promise<FormState> {
  const bidder = await currentBidder();
  if (!bidder) return { message: "Register a paddle to bid." };
  const lotId = text(form, "lotId");
  const amount = whole(form, "amount");
  let result;
  try {
    result = await placeBid(lotId, bidder, amount);
  } catch (error) {
    console.error("[malisa] bid failed", error);
    return { message: TRY_AGAIN };
  }
  if (!result.ok) return { message: result.reason };
  revalidatePath(`/auctions/${lotId}`);
  revalidatePath("/auctions");
  revalidatePath("/");
  return { ok: true, message: "Your bid is in the lead.", lot: snapshot(result.lot) };
}

const MAX_UPLOAD = 5 * 1024 * 1024;

export async function createLotAction(_prev: FormState, form: FormData): Promise<FormState> {
  const bidder = await currentBidder();
  if (!bidder) return { message: "Register a paddle before listing a lot." };

  const errors: Record<string, string> = {};
  const title = text(form, "title");
  const maker = text(form, "maker");
  const period = text(form, "period");
  const category = text(form, "category");
  const description = text(form, "description");
  const location = text(form, "location");
  const startingBid = whole(form, "startingBid");
  const reserveRaw = whole(form, "reserve");
  const low = whole(form, "estimateLow");
  const high = whole(form, "estimateHigh");
  const days = Number(text(form, "duration"));

  if (title.length < 6 || title.length > 90) errors.title = "Give the lot a title of 6–90 characters.";
  if (!isCategory(category)) errors.category = "Choose a category.";
  if (description.length < 40) errors.description = "Describe the lot in at least 40 characters.";
  if (!location) errors.location = "Where will the lot ship from?";
  if (!Number.isInteger(startingBid) || startingBid < 1) errors.startingBid = "Enter a starting bid in whole euros.";
  if (!Number.isNaN(reserveRaw) && (!Number.isInteger(reserveRaw) || reserveRaw < startingBid)) {
    errors.reserve = "The reserve must be at least the starting bid.";
  }
  if (!Number.isInteger(low) || !Number.isInteger(high) || low < 1 || high < low) {
    errors.estimate = "Enter a low and a high estimate (low ≤ high).";
  }
  if (![1, 3, 5, 7].includes(days)) errors.duration = "Choose a duration.";

  const file = form.get("image");
  let image: { src: string; width: number; height: number } | null = null;
  if (!(file instanceof File) || file.size === 0) {
    errors.image = "Add a photograph of the lot.";
  } else if (file.size > MAX_UPLOAD) {
    errors.image = "Photographs must be under 5 MB.";
  } else {
    const bytes = Buffer.from(await file.arrayBuffer());
    const size = imageSize(bytes);
    if (!size) {
      errors.image = "Use a JPEG, PNG or WebP photograph.";
    } else if (!Object.keys(errors).length) {
      const name = `${randomUUID()}.${size.type === "jpeg" ? "jpg" : size.type}`;
      try {
        await backend.saveUpload(name, bytes, `image/${size.type}`);
      } catch (error) {
        console.error("[malisa] upload failed", error);
        return { message: TRY_AGAIN };
      }
      image = { src: `/api/uploads/${name}`, width: size.width, height: size.height };
    }
  }

  if (Object.keys(errors).length || !image || !isCategory(category)) return { errors };

  const pairs = (key: string) =>
    text(form, key)
      .split("\n")
      .map((line) => {
        const at = line.indexOf(":");
        return at < 0 ? ["", ""] : [line.slice(0, at).trim(), line.slice(at + 1).trim()];
      })
      .filter(([a, b]) => a && b)
      .slice(0, 8);

  const now = Date.now();
  let lot;
  try {
    lot = await createLot({
      title,
      maker: maker || "Unattributed",
      period: period || "Date unknown",
      category,
      description,
      image,
      startingBid,
      reserve: Number.isNaN(reserveRaw) ? null : reserveRaw,
      estimate: [low, high],
      startsAt: new Date(now).toISOString(),
      endsAt: new Date(now + days * 86_400_000).toISOString(),
      seller: { name: bidder.name, location, since: bidder.since },
      sellerPaddle: bidder.paddle,
      specs: pairs("specs").map(([label, value]) => ({ label, value })),
      condition: {
        grade: 0,
        summary: "Seller's description. A Malisa specialist has not inspected this lot yet.",
        notes: pairs("notes").map(([label, detail], i) => ({ key: String.fromCharCode(97 + i), label, detail })),
      },
      provenance: [{ year: String(new Date(now).getFullYear()), event: `Listed by paddle ${bidder.paddle}` }],
    });
  } catch (error) {
    console.error("[malisa] listing failed", error);
    return { message: TRY_AGAIN };
  }

  revalidatePath("/auctions");
  revalidatePath("/");
  redirect(`/auctions/${lot.id}`);
}

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { Bidder } from "./types";

/**
 * Bidders are identified by a "paddle" (as in a saleroom). The paddle number,
 * name and e-mail address travel in a signed, httpOnly cookie, so any server
 * instance can recognise the bidder without a database lookup.
 *
 * This is a stand-in for real authentication: replace it with an auth provider
 * (e-mail magic links, OAuth, …) before going live.
 */

export type SessionBidder = Pick<Bidder, "paddle" | "name" | "email"> & { since: number };

const COOKIE = "malisa_paddle";
const MAX_AGE = 60 * 60 * 24 * 90;

function secret(): string {
  const value = process.env.MALISA_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    console.warn("[malisa] MALISA_SECRET is not set; using an insecure development secret.");
  }
  return "malisa-dev-secret-change-me";
}

function mac(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function encodeSession(bidder: SessionBidder): string {
  const payload = Buffer.from(
    JSON.stringify({ p: bidder.paddle, n: bidder.name, e: bidder.email, s: bidder.since }),
  ).toString("base64url");
  return `${payload}.${mac(payload)}`;
}

export function decodeSession(token: string | undefined): SessionBidder | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(mac(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const { p, n, e, s } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!Number.isInteger(p) || typeof n !== "string" || typeof e !== "string") return null;
    return { paddle: p, name: n, email: e, since: Number.isInteger(s) ? s : new Date().getFullYear() };
  } catch {
    return null;
  }
}

export async function currentBidder(): Promise<SessionBidder | null> {
  return decodeSession((await cookies()).get(COOKIE)?.value);
}

export async function currentPaddle(): Promise<number | null> {
  return (await currentBidder())?.paddle ?? null;
}

export async function startSession(bidder: Bidder): Promise<void> {
  const since = new Date(bidder.createdAt).getFullYear();
  (await cookies()).set(COOKIE, encodeSession({ ...bidder, since }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

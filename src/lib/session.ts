import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getBidder } from "./store";
import type { Bidder } from "./types";

/**
 * Bidders are identified by a "paddle" (as in a saleroom) kept in a signed,
 * httpOnly cookie. This is a stand-in for real authentication: replace it with
 * an auth provider (e-mail magic links, OAuth, …) before going live.
 */

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

function sign(paddle: number): string {
  const mac = createHmac("sha256", secret()).update(String(paddle)).digest("base64url");
  return `${paddle}.${mac}`;
}

function verify(token: string | undefined): number | null {
  if (!token) return null;
  const [raw, mac] = token.split(".");
  const paddle = Number(raw);
  if (!Number.isInteger(paddle) || !mac) return null;
  const expected = Buffer.from(sign(paddle).split(".")[1]);
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return paddle;
}

export async function currentPaddle(): Promise<number | null> {
  return verify((await cookies()).get(COOKIE)?.value);
}

export async function currentBidder(): Promise<Bidder | null> {
  const paddle = await currentPaddle();
  return paddle == null ? null : getBidder(paddle);
}

export async function startSession(paddle: number): Promise<void> {
  (await cookies()).set(COOKIE, sign(paddle), {
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

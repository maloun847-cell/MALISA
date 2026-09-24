import { readFile } from "node:fs/promises";
import path from "node:path";
import { DATA_DIR } from "@/lib/store";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

export async function GET(_req: Request, ctx: RouteContext<"/api/uploads/[file]">) {
  const { file } = await ctx.params;
  const match = /^[0-9a-f-]{36}\.(jpg|png|webp)$/.exec(file);
  if (!match) return new Response("Not found", { status: 404 });
  try {
    const bytes = await readFile(path.join(DATA_DIR, "uploads", file));
    return new Response(bytes, {
      headers: { "Content-Type": TYPES[match[1]], "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

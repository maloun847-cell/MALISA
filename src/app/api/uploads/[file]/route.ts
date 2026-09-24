import { backend } from "@/lib/store";

export async function GET(_req: Request, ctx: RouteContext<"/api/uploads/[file]">) {
  const { file } = await ctx.params;
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(file)) return new Response("Not found", { status: 404 });
  try {
    const upload = await backend.readUpload(file);
    if (!upload) return new Response("Not found", { status: 404 });
    return new Response(upload.body as BodyInit, {
      headers: {
        "Content-Type": upload.contentType,
        "X-Content-Type-Options": "nosniff",
        // Upload names are random and never reused, so they can be cached for good, including by the CDN.
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[malisa] could not read upload", error);
    return new Response("Unavailable", { status: 503 });
  }
}

import { snapshot } from "@/lib/snapshot";
import { getLot } from "@/lib/store";

export async function GET(_req: Request, ctx: RouteContext<"/api/lots/[id]">) {
  const { id } = await ctx.params;
  const lot = await getLot(id);
  if (!lot) return Response.json({ error: "Lot not found" }, { status: 404 });
  return Response.json(snapshot(lot), { headers: { "Cache-Control": "no-store" } });
}

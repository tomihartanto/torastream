import { NextRequest, NextResponse } from "next/server";
import { getAnimeEpisodesFromMalId } from "@/lib/consumet";

export const revalidate = 1800; // 30 min

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ malId: string }> }
) {
  const { malId } = await params;
  const id = parseInt(malId, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid MAL ID" }, { status: 400 });
  }

  const data = await getAnimeEpisodesFromMalId(id);

  // Return 200 with empty episodes when Consumet is down
  // (client will auto-fallback to embed sources)
  return NextResponse.json(
    { episodes: data?.episodes || [] },
    {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=300",
      },
    }
  );
}

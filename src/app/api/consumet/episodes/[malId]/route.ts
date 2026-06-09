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

  if (!data) {
    return NextResponse.json(
      { error: "Failed to fetch episodes. The streaming API may be unavailable." },
      { status: 502 }
    );
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=300",
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getEpisodeStreamingLinks } from "@/lib/consumet";

export const revalidate = 600; // 10 min

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ episodeId: string[] }> }
) {
  const { episodeId } = await params;
  const id = episodeId.join("/");

  if (!id) {
    return NextResponse.json({ error: "Missing episode ID" }, { status: 400 });
  }

  const data = await getEpisodeStreamingLinks(id);

  if (!data) {
    return NextResponse.json(
      { error: "Failed to fetch streaming links. Try again later." },
      { status: 502 }
    );
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=120",
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getMangaChapters } from "@/lib/mangadex";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || "100", 10);
  const lang = searchParams.get("lang") as "id" | "en" | null;

  try {
    const data = await getMangaChapters(id, limit, offset, lang ?? undefined);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch chapters" },
      { status: 500 }
    );
  }
}

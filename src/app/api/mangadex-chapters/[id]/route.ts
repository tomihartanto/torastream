import { NextRequest, NextResponse } from "next/server";
import { getMangaChapters } from "@/lib/mangadex";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10) || 0);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "100", 10) || 100));
  const rawLang = searchParams.get("lang");
  const lang = rawLang === "id" || rawLang === "en" ? rawLang : null;

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

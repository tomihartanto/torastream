import { redirect } from "next/navigation";

interface MangaIdPageProps {
  params: Promise<{ id: string }>;
}

export default async function MangaIdPage({ params }: MangaIdPageProps) {
  const { id } = await params;
  redirect(`/manga/mangadex/${id}`);
}

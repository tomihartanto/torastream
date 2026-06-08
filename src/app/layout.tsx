import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ScrollToTop from "@/components/scroll-to-top";
import AdsterraScripts from "@/components/adsterra-scripts";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "ToraStream - Streaming Anime & Baca Manga Indonesia",
    template: "%s | ToraStream",
  },
  description:
    "Streaming anime dan baca manga terlengkap gratis dalam Bahasa Indonesia. Jelajahi ribuan judul anime dan manga dari MyAnimeList & MangaDex.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${geistSans.variable} dark antialiased`}>
      <body className="flex min-h-screen flex-col bg-zinc-950 text-white">
        <Navbar />
        <main className="flex-1 pt-16 pb-16 md:pb-0">{children}</main>
        <Footer />
        <ScrollToTop />
        <AdsterraScripts />
      </body>
    </html>
  );
}

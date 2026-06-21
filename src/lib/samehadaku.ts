import * as cheerio from "cheerio";

/**
 * Scraper Samehadaku (sumber sub Indonesia).
 * Mengikuti pola yang sama dengan Otakudesu (sering mirror dari sini).
 *
 * Domain sering ganti, konfigurasi via env SAMEHADAKU_BASE_URL.
 */

const BASE_URL = process.env.SAMEHADAKU_BASE_URL || "https://samehadaku.email";

const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
  Referer: BASE_URL,
};

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: DEFAULT_HEADERS,
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 1800 },
    });
    if (!res.ok) {
      console.warn(`[samehadaku] ${url} -> ${res.status}`);
      return null;
    }
    return await res.text();
  } catch (err) {
    console.warn(`[samehadaku] fetch failed for ${url}:`, err);
    return null;
  }
}

export interface SamehadakuSearchResult {
  linkId: string;
  title: string;
  url: string;
  image: string | null;
  status: string | null;
  rating: string | null;
  genres: string[];
}

/**
 * Cari anime di Samehadaku berdasarkan judul.
 */
export async function searchSamehadaku(query: string): Promise<SamehadakuSearchResult[]> {
  const html = await fetchHtml(
    `${BASE_URL}/?s=${encodeURIComponent(query)}`
  );
  if (!html) return [];

  const $ = cheerio.load(html);
  const results: SamehadakuSearchResult[] = [];

  // Selector umum untuk list hasil search Samehadaku
  $(".listupd_item, .post-item, .bsx, .bs").each((_i, el) => {
    const $el = $(el);
    const $a = $el.find("a").first();
    const url = $a.attr("href") || "";
    const title = $a.attr("title") || $el.find(".tt, .tt h4, .title").text().trim() || "";
    const image = $el.find("img").attr("src") || $el.find("img").attr("data-src") || null;
    const status = $el.find(".status, .sb").text().trim() || null;
    const rating = $el.find(".score, .numscore, .rts").text().trim() || null;
    const genres = $el
      .find(".mta .genxe, .genres a, .newgenre a")
      .map((_j, g) => $(g).text().trim())
      .get()
      .filter(Boolean);

    if (url && title) {
      const m = url.match(/\/anime\/([^/?#]+)\//);
      const linkId = m ? m[1] : "";
      results.push({ linkId, title, url, image, status, rating, genres });
    }
  });

  return results;
}

/**
 * Cari anime yang paling cocok dengan judul MAL (fuzzy sederhana).
 */
export async function findBestMatchByTitle(title: string): Promise<SamehadakuSearchResult | null> {
  const results = await searchSamehadaku(title);
  if (results.length === 0) return null;

  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]/g, "");

  const target = normalize(title);

  const exact = results.find((r) => normalize(r.title) === target);
  if (exact) return exact;

  // Fallback: cari yang mengandung semua kata penting
  const keywords = title.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const match = results.find((r) => {
    const n = normalize(r.title);
    return keywords.every((k) => n.includes(normalize(k)));
  });
  return match || results[0];
}

export interface SamehadakuEpisode {
  number: number;
  linkId: string;
  url: string;
  title: string;
  airDate: string | null;
}

/**
 * Ambil daftar episode dari halaman detail anime Samehadaku.
 */
export async function getEpisodesByLinkId(linkId: string): Promise<SamehadakuEpisode[]> {
  const html = await fetchHtml(`${BASE_URL}/anime/${linkId}/`);
  if (!html) return [];

  const $ = cheerio.load(html);
  const episodes: SamehadakuEpisode[] = [];

  // Selector list episode (bervariasi per tema Samehadaku)
  $(".eplister li, .eps-item, .episode-list li").each((_i, el) => {
    const $el = $(el);
    const $a = $el.find("a").first();
    const url = $a.attr("href") || "";
    const epText = $el.find(".epl-num, .eps-num, .num").text().trim();
    const title = $el.find(".epl-title, .eps-title, .title").text().trim();
    const airDate = $el.find(".epl-date, .eps-date, .date").text().trim() || null;
    const number = parseInt(epText) || episodes.length + 1;

    if (url) {
      const m = url.match(/\/([^/?#]+)\/?$/);
      const epLinkId = m ? m[1] : "";
      episodes.push({ number, linkId: epLinkId, url, title, airDate });
    }
  });

  // Samehadaku menampilkan episode dari baru ke lama - urutkan ascending
  return episodes.sort((a, b) => a.number - b.number);
}

export interface SamehadakuStreamServer {
  name: string;
  /** Direct embed URL (iframe) */
  embedUrl: string;
  /** Quality label jika tersedia (cth: "720p") */
  quality: string | null;
}

export interface SamehadakuStreamData {
  title: string;
  servers: SamehadakuStreamServer[];
  /** Link MP4 langsung yang bisa di-play tanpa iframe (jika ada) */
  mp4Urls: { quality: string | null; url: string }[];
}

/**
 * Ambil server streaming + link MP4 untuk satu episode.
 * Langkah:
 * 1. Fetch halaman episode
 * 2. Ambil server list dari `div#server > ul > li`
 * 3. POST ke admin-ajax.php untuk dapat embed URL
 * 4. Ekstrak MP4 dari wibufile/ mirror yang mendukung
 */
export async function getEpisodeStreams(episodeUrl: string): Promise<SamehadakuStreamData | null> {
  const html = await fetchHtml(episodeUrl);
  if (!html) return null;

  const $ = cheerio.load(html);
  const title = $("h1[itemprop='name'], h1.post-title, h1").first().text().trim();

  const servers: SamehadakuStreamServer[] = [];
  const mp4Urls: { quality: string | null; url: string }[] = [];

  // Pattern 1: server list di div#server
  const serverItems = $('div#server > ul > li, .server-list li, .mirror option').toArray();

  for (const el of serverItems) {
    const $el = $(el);
    const name = $el.find("span, .server-name").text().trim() || $el.text().trim();
    const post = $el.attr("data-post") || $el.find("div").attr("data-post");
    const nume = $el.attr("data-nume") || $el.find("div").attr("data-nume");
    const type = $el.attr("data-type") || $el.find("div").attr("data-type") || "schtml";

    // Option element (legacy)
    const optValue = $el.is("option") ? $el.attr("value") : null;

    if (post && nume) {
      // POST ke admin-ajax untuk dapat iframe
      const embedUrl = await fetchPlayerAjax(post, nume, type);
      if (embedUrl) {
        const quality = extractQuality(name);
        servers.push({ name: name || `Server ${servers.length + 1}`, embedUrl, quality });
        // Jika ini wibufile MP4 langsung, simpan juga
        if (/wibufile\.com\/video\//i.test(embedUrl) && /\.mp4(\?|$)/i.test(embedUrl)) {
          mp4Urls.push({ quality, url: embedUrl });
        }
      }
    } else if (optValue) {
      // Option dengan value berisi URL embed
      servers.push({ name, embedUrl: optValue, quality: extractQuality(name) });
    }
  }

  // Pattern 2: cari link wibufile MP4 langsung di HTML
  $('a[href*="wibufile.com/video/"]').each((_i, el) => {
    const href = $(el).attr("href") || "";
    if (/\.mp4(\?|$)/i.test(href)) {
      mp4Urls.push({ quality: extractQuality($(el).text()), url: href });
    }
  });

  // Dedup MP4 URLs
  const seen = new Set<string>();
  const uniqueMp4 = mp4Urls.filter((m) => {
    if (seen.has(m.url)) return false;
    seen.add(m.url);
    return true;
  });

  return { title, servers, mp4Urls: uniqueMp4 };
}

async function fetchPlayerAjax(post: string, nume: string, type: string): Promise<string | null> {
  try {
    const body = new URLSearchParams({
      action: "player_ajax",
      post,
      nume,
      type,
    });
    const res = await fetch(`${BASE_URL}/wp-admin/admin-ajax.php`, {
      method: "POST",
      headers: {
        ...DEFAULT_HEADERS,
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: BASE_URL,
      },
      body: body.toString(),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    const $ = cheerio.load(text);
    return $("iframe").attr("src") || null;
  } catch (err) {
    console.warn("[samehadaku] player_ajax failed:", err);
    return null;
  }
}

function extractQuality(name: string): string | null {
  const m = name.match(/(\d{3,4}p)/i);
  return m ? m[1].toLowerCase() : null;
}

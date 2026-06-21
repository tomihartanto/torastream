import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface FetchOptions {
  revalidate?: number;
}

export async function fetchApi<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { revalidate = 3600 } = options;

  const res = await fetch(url, {
    next: { revalidate },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

export async function fetchWithRetry<T>(
  url: string,
  options: FetchOptions = {},
  retries = 2
): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetchApi<T>(url, options);
    } catch (error) {
      // Don't retry on client errors (4xx) - they won't succeed on retry
      if (error instanceof Error && error.message.match(/API error: 4\d{2}/)) {
        throw error;
      }
      if (i === retries) throw error;
      const delay = Math.pow(2, i) * 1000;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("Unreachable");
}

/**
 * Membersihkan deskripsi manga dari MangaDex yang mengandung
 * URL, link markdown, dan metadata lainnya.
 */
export function cleanMangaDescription(text: string | null): string | null {
  if (!text) return null;

  let cleaned = text;

  // Remove markdown links [text](url)
  cleaned = cleaned.replace(/\[([^\]]*)\]\([^)]+\)/g, "");

  // Remove bare URLs (http/https)
  cleaned = cleaned.replace(/https?:\/\/[^\s)\]|>"']+/gi, "");

  // Remove markdown images ![alt](url)
  cleaned = cleaned.replace(/!\[[^\]]*\]\([^)]+\)/g, "");

  // Remove horizontal rules (--- or ***)
  cleaned = cleaned.replace(/^[-*_]{3,}\s*$/gm, "");

  // Remove blockquotes (>)
  cleaned = cleaned.replace(/^>\s*/gm, "");

  // Remove markdown bold/italic
  cleaned = cleaned.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1");

  // Remove markdown headers (#)
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, "");

  // Remove lines starting with - that are list items (likely links/resources)
  cleaned = cleaned.replace(/^\s*-\s+.*$/gm, "");

  // Remove lines with <angle bracket content>
  cleaned = cleaned.replace(/<[^>]+>/g, "");

  // Remove lines that are just pipes and spaces
  cleaned = cleaned.replace(/^\s*[\|]+\s*$/gm, "");

  // Remove leading/trailing separators
  cleaned = cleaned.replace(/^[-*_]+/, "").replace(/[-*_]+$/, "");

  // Remove multiple consecutive newlines (max 2)
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  // Remove lines that are just pipes, dashes, or brackets
  cleaned = cleaned.replace(/^\s*[\|—–-]+\s*$/gm, "");

  // Remove empty bullet-like lines
  cleaned = cleaned.replace(/^\s*[\|]\s*$/gm, "");

  // Trim each line
  cleaned = cleaned
    .split("\n")
    .map((line) => line.trim())
    .join("\n");

  // Remove multiple consecutive newlines again after trimming
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  // Trim
  cleaned = cleaned.trim();

  // If nothing left after cleaning, return null
  if (!cleaned || cleaned.length < 10) return null;

  return cleaned;
}

const MAX_TRANSLATE_INPUT_CHARS = 1500;
const TRANSLATE_CACHE_TTL = 7 * 24 * 3600; // 7 days

export async function translateToId(text: string): Promise<string> {
  if (!text) return text;

  // Trim to a sane length so we don't blow past model context
  const source = text.slice(0, MAX_TRANSLATE_INPUT_CHARS);

  // Lazy import to avoid loading redis when translate is unused
  const { cacheGet, cacheSet } = await import("./redis");
  const cacheKey = `translate:en-id:${hashKey(source)}`;
  const cached = await cacheGet<string>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.AI_API_KEY;
  const apiUrl = process.env.AI_API_URL;
  const model = process.env.AI_MODEL || "glm-4.6";

  if (!apiKey || !apiUrl) {
    return source;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "Anda penerjemah sinopsis manga/anime dari bahasa Inggris ke bahasa Indonesia yang mengalir dan natural. " +
              "Pertahankan nama diri, istilah, dan nuansa asli. " +
              "Keluaran HANYA teks terjemahan, tanpa penjelasan, tanpa tanda kutip, tanpa prefiks.",
          },
          {
            role: "user",
            content: `Terjemahkan ke bahasa Indonesia:\n\n${source}`,
          },
        ],
        temperature: 0.3,
        max_tokens: Math.min(1200, Math.ceil(source.length * 1.5)),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[translate] GLM API ${res.status}, using original`);
      return source;
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const translated = data.choices?.[0]?.message?.content?.trim();

    if (!translated) return source;

    await cacheSet(cacheKey, translated, TRANSLATE_CACHE_TTL);
    return translated;
  } catch (err) {
    console.warn("[translate] failed, returning original:", err);
    return source;
  }
}

function hashKey(s: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)}`;
}

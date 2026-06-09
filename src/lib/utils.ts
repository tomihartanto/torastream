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

  try {
    const res = await fetch(url, {
      next: { revalidate },
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    throw error;
  }
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
      if (i === retries) throw error;
      // Exponential backoff: 1s, 2s, 4s...
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

const translateCache = new Map<string, string>();

export async function translateToId(text: string): Promise<string> {
  if (!text) return text;

  const cacheKey = text.slice(0, 200);
  const cached = translateCache.get(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=en|id`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    const data = await res.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText;
      translateCache.set(cacheKey, translated);
      return translated;
    }
  } catch {
    // fallback ke teks asli
  }

  return text;
}

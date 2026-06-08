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
    console.error(`Fetch failed: ${url}`, error);
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

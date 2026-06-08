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
  retries = 1
): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetchApi<T>(url, options);
    } catch (error) {
      if (i === retries) throw error;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error("Unreachable");
}

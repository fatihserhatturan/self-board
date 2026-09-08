"use server";

import { getDb } from "@/lib/db/client";
import type { ActionResult } from "@/lib/actions/issues";

export interface LinkPreviewData {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 5000;
const MAX_HTML_BYTES = 200 * 1024;

const PRIVATE_HOSTNAME_PATTERN =
  /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.|\[::1\]|::1)/i;

function isSafeUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (PRIVATE_HOSTNAME_PATTERN.test(url.hostname)) return null;
  return url;
}

function extractMeta(html: string, names: string[]): string | null {
  for (const name of names) {
    const propertyMatch = new RegExp(
      `<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']*)["']`,
      "i",
    ).exec(html);
    if (propertyMatch?.[1]) return propertyMatch[1];

    const reversedMatch = new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${name}["']`,
      "i",
    ).exec(html);
    if (reversedMatch?.[1]) return reversedMatch[1];
  }
  return null;
}

function extractTitleTag(html: string): string | null {
  return /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() || null;
}

function extractFavicon(html: string, baseUrl: URL): string | null {
  const match = /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i.exec(html);
  const href = match?.[1] ?? "/favicon.ico";
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function resolveMaybeRelative(value: string | null, baseUrl: URL): string | null {
  if (!value) return null;
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
}

async function fetchAndExtract(url: URL): Promise<LinkPreviewData> {
  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { "User-Agent": "Mozilla/5.0 (compatible; self-board link preview)" },
  });

  const reader = response.body?.getReader();
  let html = "";
  if (reader) {
    const decoder = new TextDecoder();
    let received = 0;
    while (received < MAX_HTML_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      received += value.byteLength;
    }
    void reader.cancel();
  } else {
    html = await response.text();
  }

  return {
    url: url.toString(),
    title: extractMeta(html, ["og:title", "twitter:title"]) ?? extractTitleTag(html),
    description: extractMeta(html, ["og:description", "twitter:description", "description"]),
    image: resolveMaybeRelative(extractMeta(html, ["og:image", "twitter:image"]), url),
    favicon: extractFavicon(html, url),
  };
}

export async function getLinkPreview(rawUrl: string): Promise<ActionResult<LinkPreviewData>> {
  const url = isSafeUrl(rawUrl);
  if (!url) return { ok: false, error: "invalid-url" };

  const db = getDb();
  const cached = db
    .prepare(
      "SELECT url, title, description, image, favicon, fetched_at FROM link_previews WHERE url = ?",
    )
    .get(url.toString()) as
    | {
        url: string;
        title: string | null;
        description: string | null;
        image: string | null;
        favicon: string | null;
        fetched_at: string;
      }
    | undefined;

  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
    return { ok: true, data: toLinkPreviewData(cached) };
  }

  try {
    const data = await fetchAndExtract(url);
    db.prepare(
      `INSERT INTO link_previews (url, title, description, image, favicon, fetched_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(url) DO UPDATE SET
         title = excluded.title,
         description = excluded.description,
         image = excluded.image,
         favicon = excluded.favicon,
         fetched_at = excluded.fetched_at`,
    ).run(data.url, data.title, data.description, data.image, data.favicon, new Date().toISOString());
    return { ok: true, data };
  } catch {
    if (cached) return { ok: true, data: toLinkPreviewData(cached) };
    return { ok: false, error: "fetch-failed" };
  }
}

function toLinkPreviewData(row: {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
}): LinkPreviewData {
  return {
    url: row.url,
    title: row.title,
    description: row.description,
    image: row.image,
    favicon: row.favicon,
  };
}

// Cloudflare Worker: MangaDex API Proxy
// Deploy ke Cloudflare Workers (free tier: 100k requests/hari)
//
// Cara deploy:
// 1. Install wrangler: npm install -g wrangler
// 2. Login: wrangler login
// 3. Deploy: wrangler deploy
// 4. Copy URL worker (misal: https://mangadex-proxy.username.workers.dev)
// 5. Set di .env: NEXT_PUBLIC_MANGADEX_BASE_URL=https://mangadex-proxy.username.workers.dev

const MANGADEX_API = "https://api.mangadex.org";
const MANGADEX_COVERS = "https://uploads.mangadex.org";

// Allowed paths to prevent abuse
const ALLOWED_PATHS = [
  "/manga",
  "/chapter",
  "/at-home",
  "/cover",
  "/author",
  "/tag",
  "/list",
  "/user",
];

function isAllowed(path) {
  return ALLOWED_PATHS.some((p) => path.startsWith(p));
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Health check
    if (path === "/" || path === "/health") {
      return new Response(JSON.stringify({ status: "ok", service: "mangadex-proxy" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Route: /covers/* -> proxy cover images
    if (path.startsWith("/covers/")) {
      const coverUrl = `${MANGADEX_COVERS}${path}${url.search}`;
      try {
        const res = await fetch(coverUrl, {
          headers: { "User-Agent": "ToraStream/1.0" },
        });
        if (!res.ok) {
          return new Response("Not found", { status: 404 });
        }
        const contentType = res.headers.get("content-type") || "image/jpeg";
        const buffer = await res.arrayBuffer();
        return new Response(buffer, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=86400, immutable",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch {
        return new Response("Fetch failed", { status: 502 });
      }
    }

    // Route: /* -> proxy MangaDex API
    if (!isAllowed(path)) {
      return new Response("Forbidden", { status: 403 });
    }

    const targetUrl = `${MANGADEX_API}${path}${url.search}`;

    try {
      const res = await fetch(targetUrl, {
        method: request.method,
        headers: {
          "User-Agent": "ToraStream/1.0",
          "Content-Type": request.headers.get("Content-Type") || "application/json",
        },
        body: request.method !== "GET" ? request.body : undefined,
      });

      const data = await res.arrayBuffer();
      return new Response(data, {
        status: res.status,
        headers: {
          "Content-Type": res.headers.get("Content-Type") || "application/json",
          "Cache-Control": "public, max-age=60",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch {
      return new Response(JSON.stringify({ error: "MangaDex unreachable" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};

// ═══════════════════════════════════════════════════════════════
//  SmartRecipe Service Worker  — sw.js
//
//  Strategy:
//  • App shell (HTML/JS/CSS)  → Cache First, network fallback
//  • API/CDN assets           → Stale-While-Revalidate
//  • Recipe data              → Already in localStorage, no fetch needed
//  • Unknown requests         → Network First, cache fallback
//
//  Version bump CACHE_NAME to force refresh on deploy.
// ═══════════════════════════════════════════════════════════════

const CACHE_NAME      = "smartrecipe-v1"
const SHELL_CACHE     = "smartrecipe-shell-v1"
const ASSET_CACHE     = "smartrecipe-assets-v1"

// ── App shell files — cached on install ───────────────────────
const SHELL_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
]

// ── CDN domains we cache aggressively ─────────────────────────
const CDN_HOSTS = [
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "cdnjs.cloudflare.com",
]

// ─────────────────────────────────────────────────────────────
//  INSTALL — pre-cache the app shell
// ─────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      console.log("[SW] Pre-caching app shell")
      return cache.addAll(SHELL_URLS)
    }).then(() => {
      // Take control immediately without waiting for old SW to die
      return self.skipWaiting()
    })
  )
})

// ─────────────────────────────────────────────────────────────
//  ACTIVATE — clean up old caches
// ─────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  const VALID_CACHES = [CACHE_NAME, SHELL_CACHE, ASSET_CACHE]

  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !VALID_CACHES.includes(key))
          .map((key) => {
            console.log("[SW] Deleting stale cache:", key)
            return caches.delete(key)
          })
      )
    ).then(() => {
      // Take control of all clients immediately
      return self.clients.claim()
    })
  )
})

// ─────────────────────────────────────────────────────────────
//  FETCH — routing strategies per request type
// ─────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests and browser extensions
  if (request.method !== "GET") return
  if (!url.protocol.startsWith("http")) return

  // ── 1. App shell — Cache First ────────────────────────────
  if (
    url.origin === self.location.origin &&
    (url.pathname === "/" || url.pathname.endsWith(".html"))
  ) {
    event.respondWith(cacheFirst(request, SHELL_CACHE))
    return
  }

  // ── 2. JS/CSS/font assets from own origin — Cache First ───
  if (
    url.origin === self.location.origin &&
    (url.pathname.match(/\.(js|css|woff2?|png|jpg|svg|ico)$/) ||
     url.pathname.startsWith("/assets/") ||
     url.pathname.startsWith("/icons/"))
  ) {
    event.respondWith(cacheFirst(request, ASSET_CACHE))
    return
  }

  // ── 3. CDN assets — Stale-While-Revalidate ────────────────
  if (CDN_HOSTS.some((host) => url.hostname.includes(host))) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE))
    return
  }

  // ── 4. Everything else — Network First, cache fallback ────
  event.respondWith(networkFirst(request, CACHE_NAME))
})

// ─────────────────────────────────────────────────────────────
//  STRATEGY HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Cache First — serve from cache immediately.
 * If not in cache, fetch from network and cache it.
 */
async function cacheFirst(request, cacheName) {
  const cache    = await caches.open(cacheName)
  const cached   = await cache.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch {
    // Return a simple offline fallback for HTML requests
    if (request.headers.get("accept")?.includes("text/html")) {
      return offlineFallback()
    }
    throw new Error("Network error and no cache available")
  }
}

/**
 * Stale-While-Revalidate — return cached version immediately,
 * then update the cache in the background.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache    = await caches.open(cacheName)
  const cached   = await cache.match(request)

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone())
    return response
  }).catch(() => null)

  return cached ?? fetchPromise
}

/**
 * Network First — try network, fall back to cache.
 * Best for data that changes often.
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    if (request.headers.get("accept")?.includes("text/html")) {
      return offlineFallback()
    }
    throw new Error("Offline and not cached")
  }
}

/**
 * Offline fallback page — shown when HTML is requested
 * and neither network nor cache is available.
 */
function offlineFallback() {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>SmartRecipe — Offline</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: system-ui, sans-serif;
          background: #0b0f19;
          color: #e5e7eb;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          text-align: center;
        }
        .emoji { font-size: 64px; margin-bottom: 24px; }
        h1 { font-size: 28px; font-weight: 800; margin-bottom: 12px; color: #f97316; }
        p  { font-size: 15px; color: #9ca3af; max-width: 340px; line-height: 1.6; margin-bottom: 8px; }
        .note { font-size: 13px; color: #6b7280; margin-top: 20px; }
        button {
          margin-top: 28px;
          padding: 12px 32px;
          border-radius: 999px;
          background: linear-gradient(to right, #f97316, #ec4899);
          color: white;
          font-size: 15px;
          font-weight: 700;
          border: none;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <div class="emoji">🍽️</div>
      <h1>You're offline</h1>
      <p>SmartRecipe needs a connection to load for the first time.</p>
      <p>Once loaded, the full app works offline — recipes, nutrition data, meal planner and all.</p>
      <p class="note">Your saved recipes and meal plans are stored locally and always available.</p>
      <button onclick="window.location.reload()">Try Again</button>
    </body>
    </html>
  `
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}

// ─────────────────────────────────────────────────────────────
//  BACKGROUND SYNC — queue failed operations (future use)
// ─────────────────────────────────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-recipes") {
    console.log("[SW] Background sync triggered:", event.tag)
    // Placeholder — extend here for cloud sync in future
  }
})

// ─────────────────────────────────────────────────────────────
//  PUSH NOTIFICATIONS — placeholder (future use)
// ─────────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title ?? "SmartRecipe", {
      body:  data.body  ?? "You have a new notification",
      icon:  "/icons/icon-192.png",
      badge: "/icons/icon-96.png",
      data:  { url: data.url ?? "/" },
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data?.url ?? "/")
  )
})

console.log("[SW] SmartRecipe service worker loaded ✅")
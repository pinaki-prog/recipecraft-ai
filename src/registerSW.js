// ═══════════════════════════════════════════════════════════════
//  registerSW.js  — paste this into your src/ folder
//  Then import and call registerSW() at the top of main.jsx
//
//  Usage in main.jsx:
//    import { registerSW } from "./registerSW"
//    registerSW()
// ═══════════════════════════════════════════════════════════════

export function registerSW() {
  // Only register in production and if browser supports SW
  if (!("serviceWorker" in navigator)) return

  // Register after page load to not delay first paint
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      })

      console.log("[SW] Registered, scope:", registration.scope)

      // ── Detect new SW waiting ────────────────────────────
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing
        if (!newWorker) return

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            // A new version is ready — show update banner
            showUpdateBanner(registration)
          }
        })
      })

      // ── Auto-reload when SW takes control ───────────────
      let refreshing = false
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true
          window.location.reload()
        }
      })

    } catch (err) {
      console.warn("[SW] Registration failed:", err)
    }
  })
}

// ─────────────────────────────────────────────────────────────
//  Update banner — shown when a new version is available
// ─────────────────────────────────────────────────────────────
function showUpdateBanner(registration) {
  // Remove any existing banner
  document.getElementById("sw-update-banner")?.remove()

  const banner = document.createElement("div")
  banner.id = "sw-update-banner"
  banner.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    background: #111827;
    border: 1px solid rgba(249,115,22,0.4);
    border-radius: 16px;
    padding: 14px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    font-family: system-ui, sans-serif;
    color: #e5e7eb;
    font-size: 14px;
    white-space: nowrap;
    animation: slideUp 0.3s ease;
  `

  const style = document.createElement("style")
  style.textContent = `
    @keyframes slideUp {
      from { opacity: 0; transform: translateX(-50%) translateY(20px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
  `
  document.head.appendChild(style)

  banner.innerHTML = `
    <span>🆕 SmartRecipe update ready</span>
    <button id="sw-update-btn" style="
      padding: 8px 18px;
      border-radius: 999px;
      background: linear-gradient(to right, #f97316, #ec4899);
      color: white;
      font-size: 13px;
      font-weight: 700;
      border: none;
      cursor: pointer;
    ">Update now</button>
    <button id="sw-dismiss-btn" style="
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
      font-size: 18px;
      padding: 0 4px;
    ">✕</button>
  `

  document.body.appendChild(banner)

  document.getElementById("sw-update-btn")?.addEventListener("click", () => {
    registration.waiting?.postMessage({ type: "SKIP_WAITING" })
    banner.remove()
  })

  document.getElementById("sw-dismiss-btn")?.addEventListener("click", () => {
    banner.remove()
  })
}

// ─────────────────────────────────────────────────────────────
//  Install prompt  — capture and surface the native A2HS prompt
// ─────────────────────────────────────────────────────────────
let deferredPrompt = null

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault()
  deferredPrompt = e
  showInstallBanner()
})

function showInstallBanner() {
  // Don't show if already installed
  if (window.matchMedia("(display-mode: standalone)").matches) return
  // Don't show if dismissed in last 7 days
  const dismissed = localStorage.getItem("pwa-install-dismissed")
  if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return

  document.getElementById("sw-install-banner")?.remove()

  const banner = document.createElement("div")
  banner.id = "sw-install-banner"
  banner.style.cssText = `
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    background: #111827;
    border: 1px solid rgba(139,92,246,0.4);
    border-radius: 16px;
    padding: 14px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    font-family: system-ui, sans-serif;
    color: #e5e7eb;
    font-size: 14px;
    white-space: nowrap;
    animation: slideDown 0.35s ease;
  `

  const style = document.createElement("style")
  style.textContent = `
    @keyframes slideDown {
      from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
  `
  document.head.appendChild(style)

  banner.innerHTML = `
    <span>📲 Install SmartRecipe as an app</span>
    <button id="sw-install-btn" style="
      padding: 8px 18px;
      border-radius: 999px;
      background: linear-gradient(to right, #8b5cf6, #ec4899);
      color: white;
      font-size: 13px;
      font-weight: 700;
      border: none;
      cursor: pointer;
    ">Install</button>
    <button id="sw-install-dismiss" style="
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
      font-size: 18px;
      padding: 0 4px;
    ">✕</button>
  `

  document.body.appendChild(banner)

  document.getElementById("sw-install-btn")?.addEventListener("click", async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    console.log("[PWA] Install prompt outcome:", outcome)
    deferredPrompt = null
    banner.remove()
  })

  document.getElementById("sw-install-dismiss")?.addEventListener("click", () => {
    localStorage.setItem("pwa-install-dismissed", Date.now().toString())
    banner.remove()
  })
}

window.addEventListener("appinstalled", () => {
  console.log("[PWA] App installed successfully ✅")
  deferredPrompt = null
  document.getElementById("sw-install-banner")?.remove()
})
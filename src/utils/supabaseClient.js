// ═══════════════════════════════════════════════════════════════
//  supabaseClient.js  — src/utils/supabaseClient.js
//
//  Single shared Supabase client used across the entire app.
//  Credentials are loaded from .env (VITE_ prefix for Vite).
// ═══════════════════════════════════════════════════════════════

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.warn(
    "[Supabase] Missing env vars. Add VITE_SUPABASE_URL and " +
    "VITE_SUPABASE_ANON_KEY to your .env file."
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession:    true,   // keeps user logged in across refreshes
    autoRefreshToken:  true,   // auto-renews JWT before expiry
    detectSessionInUrl: true,  // handles OAuth redirects
  },
})

// ── Convenience: get current user ID ──────────────────────────
export async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}
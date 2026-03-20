// ═══════════════════════════════════════════════════════════════
//  Auth.jsx  — Login / Signup modal
//  Place in: src/pages/Auth.jsx  or  src/components/Auth.jsx
//
//  Props: { onClose, onAuth }
//  onAuth(user) is called when sign-in/up succeeds
// ═══════════════════════════════════════════════════════════════

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "../utils/supabaseClient"

export default function Auth({ onClose, onAuth }) {
  const [mode,     setMode]     = useState("login")   // "login" | "signup" | "reset"
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")
  const [message,  setMessage]  = useState("")

  const clear = () => { setError(""); setMessage("") }

  // ── Email / Password ────────────────────────────────────────
  async function handleSubmit() {
    if (!email.trim() || (!password.trim() && mode !== "reset")) {
      setError("Please fill in all fields")
      return
    }
    setLoading(true)
    clear()

    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        onAuth?.(data.user)
        onClose?.()

      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user?.identities?.length === 0) {
          setError("This email is already registered. Please log in instead.")
        } else {
          setMessage("✅ Account created! Check your email to confirm, then log in.")
          setMode("login")
        }

      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
        setMessage("📧 Password reset link sent — check your email.")
      }
    } catch (err) {
      setError(err.message ?? "Something went wrong. Try again.")
    } finally {
      setLoading(false)
    }
  }

  // ── Google OAuth ────────────────────────────────────────────
  async function handleGoogle() {
    setLoading(true)
    clear()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    })
    if (error) { setError(error.message); setLoading(false) }
    // On success, browser redirects — no further action needed
  }

  const isLogin  = mode === "login"
  const isSignup = mode === "signup"
  const isReset  = mode === "reset"

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0f19]/95 backdrop-blur flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{    opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md bg-[#111827] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍽️</span>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isLogin ? "Welcome back" : isSignup ? "Create account" : "Reset password"}
              </h2>
              <p className="text-xs text-gray-500">
                {isLogin ? "Sign in to sync your recipes across devices"
                 : isSignup ? "Free forever — your data, your recipes"
                 : "We'll send you a reset link"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 transition-colors text-lg">✕</button>
        </div>

        <div className="p-6 space-y-4">

          {/* Google OAuth */}
          {!isReset && (
            <button onClick={handleGoogle} disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl
                bg-white text-gray-800 font-semibold text-sm hover:bg-gray-100
                transition-all disabled:opacity-50 shadow-sm">
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                <path fill="#FBBC05" d="M4.5 10.48A4.8 4.8 0 0 1 4.5 7.5V5.43H1.83a8 8 0 0 0 0 7.12z"/>
                <path fill="#EA4335" d="M8.98 3.58c1.32 0 2.5.45 3.44 1.35l2.54-2.54A8 8 0 0 0 1.83 5.43L4.5 7.5a4.77 4.77 0 0 1 4.48-3.92z"/>
              </svg>
              Continue with Google
            </button>
          )}

          {!isReset && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-gray-600">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); clear() }}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="you@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
                text-white text-sm outline-none focus:border-orange-500/50 transition-colors
                placeholder-gray-700"
            />
          </div>

          {/* Password */}
          {!isReset && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); clear() }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder={isSignup ? "Minimum 6 characters" : "Your password"}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
                  text-white text-sm outline-none focus:border-orange-500/50 transition-colors
                  placeholder-gray-700"
              />
            </div>
          )}

          {/* Error / success messages */}
          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                ⚠️ {error}
              </motion.p>
            )}
            {message && (
              <motion.p initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5">
                {message}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Submit button */}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all
              bg-gradient-to-r from-orange-500 to-pink-500 text-white
              shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40
              disabled:opacity-50 disabled:cursor-not-allowed">
            {loading
              ? "Please wait…"
              : isLogin  ? "Sign In"
              : isSignup ? "Create Account"
              : "Send Reset Link"}
          </button>

          {/* Footer links */}
          <div className="flex justify-between text-xs text-gray-600 pt-1">
            {isLogin && (
              <>
                <button onClick={() => { setMode("signup"); clear() }}
                  className="hover:text-gray-400 transition-colors">
                  No account? Sign up
                </button>
                <button onClick={() => { setMode("reset"); clear() }}
                  className="hover:text-gray-400 transition-colors">
                  Forgot password?
                </button>
              </>
            )}
            {isSignup && (
              <button onClick={() => { setMode("login"); clear() }}
                className="hover:text-gray-400 transition-colors mx-auto">
                Already have an account? Sign in
              </button>
            )}
            {isReset && (
              <button onClick={() => { setMode("login"); clear() }}
                className="hover:text-gray-400 transition-colors mx-auto">
                ← Back to sign in
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
// ═══════════════════════════════════════════════════════════════
//  ResetPassword.jsx  — src/pages/ResetPassword.jsx
//
//  User lands here after clicking the password reset link in email.
//  Supabase injects the session via URL hash automatically.
//  We just show a new password form.
//
//  Add this route in your App.jsx / router:
//    <Route path="/reset-password" element={<ResetPassword />} />
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { supabase } from "../utils/supabaseClient"

export default function ResetPassword() {
  const [password,  setPassword]  = useState("")
  const [confirm,   setConfirm]   = useState("")
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState("")
  const [success,   setSuccess]   = useState(false)
  const [validLink, setValidLink] = useState(true)

  // Supabase automatically picks up the token from the URL hash
  // and restores the session — we just need to wait for it
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setValidLink(true)
        }
      }
    )
    // Check if we already have a valid session from the link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) setValidLink(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleReset() {
    if (!password.trim()) {
      setError("Please enter a new password")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    if (password !== confirm) {
      setError("Passwords don't match")
      return
    }

    setLoading(true)
    setError("")

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      // Redirect to home after 3 seconds
      setTimeout(() => {
        window.location.href = "/"
      }, 3000)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-[#111827] border border-white/10 rounded-3xl shadow-2xl p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-4xl block mb-4">🔐</span>
          <h1 className="text-2xl font-bold text-white mb-2">Set New Password</h1>
          <p className="text-sm text-gray-500">Choose a strong password for your account</p>
        </div>

        {!validLink ? (
          // Invalid / expired link
          <div className="text-center py-4">
            <p className="text-red-400 text-sm mb-6">
              ⚠️ This reset link is invalid or has expired.
              Reset links expire after 1 hour.
            </p>
            <a href="/"
              className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500
                text-white text-sm font-bold">
              Back to SmartRecipe
            </a>
          </div>
        ) : success ? (
          // Success state
          <div className="text-center py-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-5xl mb-4">
              ✅
            </motion.div>
            <p className="text-green-400 font-semibold mb-2">Password updated!</p>
            <p className="text-sm text-gray-500 mb-6">Redirecting you to SmartRecipe in 3 seconds…</p>
            <a href="/"
              className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500
                text-white text-sm font-bold">
              Go Now →
            </a>
          </div>
        ) : (
          // Password form
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError("") }}
                onKeyDown={e => e.key === "Enter" && handleReset()}
                placeholder="Minimum 6 characters"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                  text-white text-sm outline-none focus:border-orange-500/50 transition-colors
                  placeholder-gray-700"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError("") }}
                onKeyDown={e => e.key === "Enter" && handleReset()}
                placeholder="Same password again"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                  text-white text-sm outline-none focus:border-orange-500/50 transition-colors
                  placeholder-gray-700"
              />
            </div>

            {/* Password strength indicator */}
            {password.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1,2,3,4].map(level => (
                    <div key={level}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        password.length >= level * 3
                          ? level <= 1 ? "bg-red-500"
                          : level <= 2 ? "bg-yellow-500"
                          : level <= 3 ? "bg-blue-500"
                          : "bg-green-500"
                          : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-600">
                  {password.length < 6  ? "Too short" :
                   password.length < 9  ? "Weak" :
                   password.length < 12 ? "Good" : "Strong ✓"}
                </p>
              </div>
            )}

            {/* Match indicator */}
            {confirm.length > 0 && (
              <p className={`text-xs ${password === confirm ? "text-green-400" : "text-red-400"}`}>
                {password === confirm ? "✓ Passwords match" : "✗ Passwords don't match"}
              </p>
            )}

            {/* Error */}
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20
                rounded-xl px-4 py-2.5">
                ⚠️ {error}
              </p>
            )}

            <button
              onClick={handleReset}
              disabled={loading || password !== confirm || password.length < 6}
              className="w-full py-3 rounded-xl text-sm font-bold transition-all
                bg-gradient-to-r from-orange-500 to-pink-500 text-white
                shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40
                disabled:opacity-40 disabled:cursor-not-allowed mt-2">
              {loading ? "Updating…" : "Update Password"}
            </button>

            <a href="/" className="block text-center text-xs text-gray-600
              hover:text-gray-400 transition-colors mt-2">
              ← Back to SmartRecipe
            </a>
          </div>
        )}
      </motion.div>
    </div>
  )
}
// ═══════════════════════════════════════════════════════════════
//  UserProfile.jsx  — Tier 5
//
//  Personal profile + TDEE calculator.
//  Mifflin-St Jeor BMR × activity multiplier → TDEE.
//  Auto-generates personalised macro targets by goal.
//  Saves to localStorage "userProfile".
//  Props: { onClose, onSave }
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

// ── Activity levels ────────────────────────────────────────────
const ACTIVITY = [
  { key: "sedentary",   label: "Sedentary",     sub: "Desk job, little/no exercise",   mult: 1.20  },
  { key: "light",       label: "Lightly Active", sub: "1–3 days/week exercise",         mult: 1.375 },
  { key: "moderate",    label: "Moderate",       sub: "3–5 days/week exercise",         mult: 1.55  },
  { key: "active",      label: "Very Active",    sub: "6–7 days/week hard exercise",    mult: 1.725 },
  { key: "extra",       label: "Athlete",        sub: "Twice/day or physical job",      mult: 1.90  },
]

// ── Macro split presets by goal ────────────────────────────────
const GOAL_MACROS = {
  weight_loss:  { cals: -500, pPct: 0.35, cPct: 0.40, fPct: 0.25, label: "Weight Loss",  emoji: "⚖️"  },
  balanced:     { cals:    0, pPct: 0.25, cPct: 0.50, fPct: 0.25, label: "Maintenance",  emoji: "🎯"  },
  muscle_gain:  { cals: +300, pPct: 0.35, cPct: 0.45, fPct: 0.20, label: "Muscle Gain",  emoji: "💪"  },
  performance:  { cals: +200, pPct: 0.25, cPct: 0.55, fPct: 0.20, label: "Performance",  emoji: "🏃"  },
}

// ── TDEE + macro calculation ───────────────────────────────────
export function calcTDEE(profile) {
  if (!profile?.weight || !profile?.height || !profile?.age) return null
  const { weight, height, age, sex, activity, goal } = profile
  // Mifflin-St Jeor BMR
  const bmr = sex === "female"
    ? 10 * weight + 6.25 * height - 5 * age - 161
    : 10 * weight + 6.25 * height - 5 * age + 5
  const actMult = ACTIVITY.find(a => a.key === activity)?.mult ?? 1.55
  const tdee    = Math.round(bmr * actMult)
  const gm      = GOAL_MACROS[goal] ?? GOAL_MACROS.balanced
  const targetCal = Math.max(1200, tdee + gm.cals)
  return {
    bmr:     Math.round(bmr),
    tdee,
    targetCal,
    bmi:     +(weight / ((height / 100) ** 2)).toFixed(1),
    macros:  {
      cal:     targetCal,
      protein: Math.round((targetCal * gm.pPct) / 4),
      carbs:   Math.round((targetCal * gm.cPct) / 4),
      fats:    Math.round((targetCal * gm.fPct) / 9),
    }
  }
}

function bmiLabel(bmi) {
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-400"   }
  if (bmi < 25.0) return { label: "Normal",       color: "text-green-400"  }
  if (bmi < 30.0) return { label: "Overweight",   color: "text-yellow-400" }
  return               { label: "Obese",          color: "text-red-400"    }
}

const DEFAULT = {
  name: "", age: "", sex: "male", weight: "", height: "",
  activity: "moderate", goal: "balanced",
}

// ── Standalone input — must be outside UserProfile to avoid remount on every keystroke ──
function ProfileInput({ label, fkey, type = "number", unit, min, max, placeholder, form, set }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
        {label} {unit && <span className="normal-case text-gray-600">({unit})</span>}
      </label>
      <input
        type={type}
        value={form[fkey]}
        onChange={e => set(fkey, e.target.value)}
        placeholder={placeholder}
        min={min} max={max}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm
          outline-none focus:border-orange-500/50 transition-colors placeholder-gray-700"
      />
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function UserProfile({ onClose, onSave }) {
  const [form,    setForm]    = useState(() => {
    try { return JSON.parse(localStorage.getItem("userProfile")) ?? DEFAULT }
    catch { return DEFAULT }
  })
  const [saved,   setSaved]   = useState(false)
  const [tab,     setTab]     = useState("profile")  // "profile" | "results"

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const stats  = calcTDEE(form)
  const filled = form.weight && form.height && form.age

  function handleSave() {
    localStorage.setItem("userProfile", JSON.stringify(form))
    onSave?.(form, stats)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }


  return (
    <div className="fixed inset-0 z-50 bg-[#0b0f19]/95 backdrop-blur flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-lg bg-[#111827] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👤</span>
            <div>
              <h2 className="text-lg font-bold text-white">Your Profile</h2>
              <p className="text-xs text-gray-500">Personalise nutrition targets to your body</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 transition-colors text-lg">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/8">
          {[
            { key: "profile", label: "📋 Profile" },
            { key: "results", label: "📊 Your Numbers", disabled: !filled },
          ].map(({ key, label, disabled }) => (
            <button key={key}
              onClick={() => !disabled && setTab(key)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors
                ${tab === key ? "text-orange-400 border-b-2 border-orange-400"
                              : disabled ? "text-gray-700 cursor-not-allowed"
                              : "text-gray-500 hover:text-gray-300"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[65vh]">

          {/* ── Profile tab ─────────────────────────────────── */}
          {tab === "profile" && (
            <div className="space-y-5">
              <ProfileInput form={form} set={set} label="Name" fkey="name" type="text" placeholder="Optional" />

              <div className="grid grid-cols-2 gap-4">
                <ProfileInput form={form} set={set} label="Age"    fkey="age"    unit="years" min={10} max={100} placeholder="25" />
                <ProfileInput form={form} set={set} label="Weight" fkey="weight" unit="kg"    min={30} max={250} placeholder="70" />
              </div>

              <ProfileInput form={form} set={set} label="Height" fkey="height" unit="cm" min={100} max={250} placeholder="170" />

              {/* Sex */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Sex</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{k:"male",label:"♂ Male"},{k:"female",label:"♀ Female"}].map(({k,label}) => (
                    <button key={k} onClick={() => set("sex", k)}
                      className={`py-2.5 rounded-xl text-sm font-semibold border transition-all
                        ${form.sex === k
                          ? "bg-orange-500/15 border-orange-500/40 text-orange-400"
                          : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Activity Level</label>
                <div className="space-y-2">
                  {ACTIVITY.map(a => (
                    <button key={a.key} onClick={() => set("activity", a.key)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all
                        ${form.activity === a.key
                          ? "bg-orange-500/10 border-orange-500/30 text-orange-300"
                          : "bg-white/3 border-white/8 text-gray-400 hover:border-white/15"}`}>
                      <div>
                        <p className="text-sm font-semibold">{a.label}</p>
                        <p className="text-xs opacity-60">{a.sub}</p>
                      </div>
                      <span className={`text-xs font-bold ${form.activity === a.key ? "text-orange-400" : "text-gray-600"}`}>
                        ×{a.mult}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Goal */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Goal</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(GOAL_MACROS).map(([k, g]) => (
                    <button key={k} onClick={() => set("goal", k)}
                      className={`py-3 px-3 rounded-xl border text-sm font-semibold transition-all
                        ${form.goal === k
                          ? "bg-orange-500/15 border-orange-500/40 text-orange-400"
                          : "bg-white/3 border-white/8 text-gray-400 hover:border-white/15"}`}>
                      {g.emoji} {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Results tab ─────────────────────────────────── */}
          {tab === "results" && stats && (
            <div className="space-y-5">
              {/* Hello */}
              {form.name && (
                <p className="text-lg font-bold text-white">
                  Hey {form.name}! 👋
                </p>
              )}

              {/* Key numbers grid */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "BMR",  value: `${stats.bmr}`,  unit: "kcal/day", sub: "at complete rest",    color: "text-blue-400"   },
                  { label: "TDEE", value: `${stats.tdee}`, unit: "kcal/day", sub: "to maintain weight",  color: "text-orange-400" },
                  { label: "BMI",  value: `${stats.bmi}`,  unit: "kg/m²",    sub: bmiLabel(stats.bmi).label, color: bmiLabel(stats.bmi).color },
                ].map(({ label, value, unit, sub, color }) => (
                  <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                    <p className="text-xs text-gray-600 mb-1">{label}</p>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{unit}</p>
                    <p className="text-xs text-gray-700 mt-0.5 leading-tight">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Daily target */}
              <div className="bg-gradient-to-br from-orange-500/10 to-pink-500/10 border border-orange-500/20 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-white">Your Daily Target</p>
                  <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                    {GOAL_MACROS[form.goal]?.emoji} {GOAL_MACROS[form.goal]?.label}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Calories", val: stats.macros.cal,     unit: "kcal", color: "text-orange-400" },
                    { label: "Protein",  val: stats.macros.protein,  unit: "g",    color: "text-blue-400"   },
                    { label: "Carbs",    val: stats.macros.carbs,    unit: "g",    color: "text-green-400"  },
                    { label: "Fats",     val: stats.macros.fats,     unit: "g",    color: "text-purple-400" },
                  ].map(({ label, val, unit, color }) => (
                    <div key={label} className="text-center">
                      <p className={`text-xl font-bold ${color}`}>{val}</p>
                      <p className="text-xs text-gray-500">{unit}</p>
                      <p className="text-xs text-gray-600">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calorie context */}
              <div className="bg-white/3 border border-white/8 rounded-2xl p-4 space-y-2.5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">What this means</p>
                {[
                  form.goal === "weight_loss" && `At ${stats.macros.cal} kcal/day you'll lose ~0.5 kg/week`,
                  form.goal === "muscle_gain" && `At ${stats.macros.cal} kcal/day (surplus of ${GOAL_MACROS.muscle_gain.cals}) you'll build muscle`,
                  form.goal === "balanced"    && `${stats.macros.cal} kcal maintains your current weight`,
                  `Each recipe you generate shows what % of your ${stats.macros.cal} kcal target it covers`,
                  `Meal planner targets have been updated to match your profile`,
                ].filter(Boolean).map((txt, i) => (
                  <p key={i} className="text-sm text-gray-400 flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5 shrink-0">→</span> {txt}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Show prompt to fill profile if results tab empty */}
          {tab === "results" && !filled && (
            <div className="text-center py-12 text-gray-600">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-sm">Fill in your age, weight, and height first</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-3 border-t border-white/8 flex gap-3">
          {filled && tab === "profile" && (
            <button onClick={() => setTab("results")}
              className="flex-1 py-3 rounded-xl text-sm font-bold bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition-all">
              📊 See My Numbers
            </button>
          )}
          <button onClick={handleSave}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all
              ${saved
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"}`}>
            {saved ? "✅ Saved!" : "Save Profile"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
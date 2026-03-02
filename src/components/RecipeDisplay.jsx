import { useState, useRef, useEffect } from "react"
import { toPng } from "html-to-image"
import html2pdf from "html2pdf.js"
import { motion, AnimatePresence } from "framer-motion"
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from "recharts"

// ─────────────────────────────────────────────────────────────
//  RecipeDisplay.jsx  (v2 — Full Upgrade)
//
//  BUG FIXES:
//  1. Micros are now pre-formatted strings ("2.1 g") — old code
//     did recipe.micros.fibre * s which returned NaN. Fixed with
//     scaleMicro() helper that parses, scales, re-formats.
//  2. budgetSwaps renamed to swapSavings in generateSmartRecipe
//     v5. All references updated + new richer data shape used.
//  3. priceBreakdown.currency is now an object { symbol, code }
//     not a string. All currency reads updated to .symbol.
//
//  NEW SECTIONS (all data was generated but never rendered):
//  4.  Header badges — Dietary 🌱, Difficulty 🟢, Budget tier
//  5.  Excluded ingredients confirmation (🚫 pills)
//  6.  Health tags pill strip (anti-inflammatory, iron-rich…)
//  7.  Vitamin deficiency callout — only when flags present
//  8.  Extended micros grid — all 12 fields (was 5)
//  9.  Inflammatory profile panel (collapsible)
//  10. Glycemic profile / GI-GL panel (collapsible)
//  11. PDCAAS protein quality panel with score bar (collapsible)
//  12. Cooking tips section (collapsible)
//  13. Swap savings updated — richer data (savedPct, nutritionNote,
//      goalFit) from getAllSwapSavings() v2
//  14. HealthScorePanel — 3 new score bars added:
//      inflammBonus, glycemicMod, microBonus
// ─────────────────────────────────────────────────────────────


// ═══════════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════════

function capitalize(word) {
  if (!word) return ""
  return word.charAt(0).toUpperCase() + word.slice(1).replace(/_/g, " ")
}

/** Extract numeric value from a pre-formatted string like "2.1 g" or "150 mg" */
const parseNum = (str) => parseFloat(String(str ?? "").replace(/[^\d.]/g, "") || "0") || 0

/** Extract unit suffix from a formatted string like "2.1 g" → "g" */
const parseUnit = (str) => String(str ?? "").replace(/[\d.\s]/g, "").trim()

/**
 * Scale a pre-formatted micro string by servings.
 * "2.1 g" × 3 → "6.3 g"   |   "150 mg" × 2 → "300 mg"
 */
function scaleMicro(str, s) {
  if (!str || str === "—") return "—"
  const num  = parseNum(str)
  const unit = parseUnit(str)
  const scaled = num * s
  const fmt = scaled === 0 ? "0"
            : scaled < 1   ? scaled.toFixed(2)
            : scaled < 10  ? scaled.toFixed(1)
            : Math.round(scaled).toString()
  return `${fmt} ${unit}`
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

// Steps from cookingEngine are { text, durationSeconds } objects.
// Legacy paths may pass plain strings. Both are handled here.
function getStepText(step) {
  return typeof step === "string" ? step : (step?.text ?? "")
}

function getStepDuration(step) {
  if (step?.durationSeconds) return step.durationSeconds
  const label = (getStepText(step).split("—")[0] || "").trim().toUpperCase()
  if (label.includes("PREP"))      return 300
  if (label.includes("FAT"))       return 60
  if (label.includes("AROMATIC"))  return 240
  if (label.includes("PROTEIN"))   return 480
  if (label.includes("VEGETABLE")) return 300
  if (label.includes("SIMMER"))    return 600
  if (label.includes("FINISH"))    return 60
  if (label.includes("PLATE"))     return 90
  return 120
}

function playTimerBeep() {
  try {
    const ctx   = new (window.AudioContext || window.webkitAudioContext)()
    const tones = [523.25, 659.25, 783.99]
    tones.forEach((freq, i) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = "sine"
      osc.frequency.value = freq
      const start = ctx.currentTime + i * 0.18
      osc.start(start)
      osc.stop(start + 0.35)
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.35, start + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35)
    })
    setTimeout(() => ctx.close(), 1200)
  } catch (_) {}
}

function getHealthTier(score) {
  if (score >= 85) return { label: "Excellent", emoji: "🏆", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30" }
  if (score >= 70) return { label: "Good",      emoji: "✅", color: "text-green-400",  bg: "bg-green-500/10  border-green-500/30"  }
  if (score >= 50) return { label: "Balanced",  emoji: "⚡", color: "text-blue-400",   bg: "bg-blue-500/10   border-blue-500/30"   }
  return             { label: "Needs Work",  emoji: "🔧", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" }
}

const PROTEIN_ITEMS = new Set(["chicken","egg","paneer","tofu","fish","beef","lamb","shrimp","soy_chunks","toor_dal","moong_dal","urad_dal","chana_dal","chickpeas","rajma","masoor_dal","pork","turkey"])
const PRODUCE_ITEMS = new Set(["spinach","carrot","onion","tomato","capsicum","mushroom","broccoli","cauliflower","garlic","ginger","potato","sweet_potato","pumpkin","raw_banana","papaya","avocado","banana","green_peas","cucumber","lettuce","eggplant","zucchini","blueberries","okra","cabbage"])
const DAIRY_ITEMS   = new Set(["ghee","butter","milk","curd","yogurt","cream","cheese","paneer","feta_cheese","parmesan","mozzarella","khoya"])
const PANTRY_ITEMS  = new Set(["rice","brown_rice","pasta","oats","quinoa","semolina","flour","whole_wheat_flour","bread","buns","rice_noodles","noodles"])

function categoriseIngredients(ingredients) {
  const groups = { "🥩 Proteins": [], "🥦 Produce": [], "🧀 Dairy": [], "🌾 Pantry": [], "📦 Other": [] }
  ingredients.forEach(({ item, qty }) => {
    const line = `• ${capitalize(item)} — ${qty}g`
    if      (PROTEIN_ITEMS.has(item)) groups["🥩 Proteins"].push(line)
    else if (DAIRY_ITEMS.has(item))   groups["🧀 Dairy"].push(line)
    else if (PRODUCE_ITEMS.has(item)) groups["🥦 Produce"].push(line)
    else if (PANTRY_ITEMS.has(item))  groups["🌾 Pantry"].push(line)
    else                              groups["📦 Other"].push(line)
  })
  return groups
}

const stepListVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }
const stepItemVariants = { hidden: { opacity: 0, x: -14 }, visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } } }


// ═══════════════════════════════════════════════════════════════
//  SCORE BAR — shared by health + PDCAAS panels
// ═══════════════════════════════════════════════════════════════

function ScoreBar({ label, value, max, color, tooltip, pct: customPct }) {
  const pct = customPct ?? Math.round((value / max) * 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-400">{label}</span>
        <span className={`text-sm font-bold ${color}`}>
          {value}
          {max !== undefined && <span className="text-gray-600 font-normal text-xs">/{max}</span>}
        </span>
      </div>
      <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color.replace("text-", "bg-")}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, pct)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      {tooltip && <p className="text-xs text-gray-600 leading-snug">{tooltip}</p>}
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════
//  HEALTH SCORE PANEL — v2: 7 score bars (was 4)
// ═══════════════════════════════════════════════════════════════

function HealthScorePanel({ recipe, tier }) {
  const [open, setOpen] = useState(false)
  const bd = recipe.scoreBreakdown

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center text-sm text-gray-400 mb-2">
        <span className="font-semibold text-base text-white">Health Score</span>
        <span className={`font-bold text-lg ${tier.color}`}>{recipe.healthScore}/100</span>
      </div>
      <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-3">
        <motion.div
          className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${recipe.healthScore}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </div>

      <button onClick={() => setOpen(v => !v)}
        className="text-sm text-gray-500 hover:text-gray-200 transition-colors flex items-center gap-1.5 mb-2">
        {open ? "▲ Hide" : "▼ Show"} score breakdown &amp; advice
      </button>

      <AnimatePresence>
        {open && bd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">

            <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-4 mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">Score Breakdown</p>

              {/* Original 4 bars */}
              <ScoreBar label="Macro Balance"   value={bd.macroBalance}  max={bd.maxMacroBalance}  color="text-blue-400"
                tooltip={`Current split: ${bd.proteinPct}% protein / ${bd.carbPct}% carbs / ${bd.fatPct}% fat (ideal ~30/40/30)`} />
              <ScoreBar label="Protein Bonus"   value={bd.proteinBonus}  max={bd.maxProteinBonus}  color="text-orange-400"
                tooltip="Higher protein per serving = higher bonus. Max at 30–40g+ protein." />
              <ScoreBar label="Fat Moderation"  value={bd.fatMod}        max={bd.maxFatMod}        color="text-pink-400"
                tooltip="Rewards meals where fat stays below 35% of total macros." />
              <ScoreBar label="Calorie Density" value={bd.calDensity}    max={bd.maxCalDensity}    color="text-green-400"
                tooltip="Lighter meals (under 500 kcal/serving) score higher here." />

              {/* NEW: 3 additional v2 score bars */}
              {bd.inflammBonus !== undefined && (
                <ScoreBar label="Anti-Inflammatory" value={bd.inflammBonus} max={bd.maxInflammBonus ?? 10} color="text-emerald-400"
                  tooltip="Bonus for anti-inflammatory ingredients: garlic, turmeric, leafy greens, omega-3 sources." />
              )}
              {bd.glycemicMod !== undefined && (
                <ScoreBar
                  label="Glycemic Penalty"
                  value={Math.abs(bd.glycemicMod)}
                  max={bd.maxGlycemicMod ?? 5}
                  color={bd.glycemicMod < 0 ? "text-red-400" : "text-green-400"}
                  tooltip={bd.glycemicMod < 0 ? "High glycemic load detected — reduces score. Swap white rice with brown rice to improve." : "Glycemic load is well-controlled."}
                />
              )}
              {bd.microBonus !== undefined && (
                <ScoreBar label="Micronutrient Bonus" value={bd.microBonus} max={bd.maxMicroBonus ?? 5} color="text-lime-400"
                  tooltip="Bonus for fibre ≥5g, iron ≥3mg, and calcium ≥200mg per serving." />
              )}

              {/* Macro ratio visual */}
              <div className="pt-2 border-t border-white/5">
                <p className="text-xs text-gray-500 mb-2">Macro Ratio</p>
                <div className="flex w-full h-4 rounded-full overflow-hidden gap-px">
                  <div className="bg-orange-400/70" style={{ width: `${bd.proteinPct}%` }} title={`Protein ${bd.proteinPct}%`} />
                  <div className="bg-blue-400/70"   style={{ width: `${bd.carbPct}%`    }} title={`Carbs ${bd.carbPct}%`}    />
                  <div className="bg-pink-400/70"   style={{ width: `${bd.fatPct}%`     }} title={`Fat ${bd.fatPct}%`}        />
                </div>
                <div className="flex gap-4 mt-1.5 text-xs text-gray-500">
                  <span><span className="text-orange-400">●</span> Protein {bd.proteinPct}%</span>
                  <span><span className="text-blue-400">●</span> Carbs {bd.carbPct}%</span>
                  <span><span className="text-pink-400">●</span> Fat {bd.fatPct}%</span>
                </div>
              </div>
            </div>

            {/* Health insights */}
            {recipe.healthInsights?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">What This Means</p>
                {recipe.healthInsights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 bg-white/3 border border-white/8 rounded-xl">
                    <p className="text-sm text-gray-300 leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════
//  INFLAMMATORY PROFILE PANEL
// ═══════════════════════════════════════════════════════════════

function InflamPanel({ profile }) {
  const [open, setOpen] = useState(false)
  if (!profile) return null

  const barPct = Math.round(((profile.score + 10) / 20) * 100) // map -10..+10 to 0..100%
  const barColor = profile.score <= -4 ? "bg-emerald-500"
                 : profile.score <= -2 ? "bg-green-500"
                 : profile.score <=  0 ? "bg-yellow-500"
                 : profile.score <=  2 ? "bg-orange-500"
                 :                       "bg-red-500"

  return (
    <div className="mb-6 border-t border-white/5 pt-6">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-emerald-400">
            {profile.emoji} Inflammatory Profile
          </span>
          <span className="text-sm font-semibold text-white bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-0.5 rounded-full">
            {profile.label}
          </span>
        </div>
        <span className="text-sm text-gray-600">{open ? "▲ hide" : "▼ show"}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="mt-4 p-5 bg-white/3 border border-white/8 rounded-2xl">
              {/* Scale bar: pro-inflam ← → anti-inflam */}
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Pro-inflammatory</span>
                <span>Anti-inflammatory</span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden relative">
                {/* Midpoint marker */}
                <div className="absolute top-0 left-1/2 w-px h-full bg-white/20" />
                <motion.div className={`h-full rounded-full ${barColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${barPct}%` }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-center mt-2">
                <span className={`text-sm font-semibold ${profile.score <= 0 ? "text-emerald-400" : "text-orange-400"}`}>
                  Score: {profile.score > 0 ? "+" : ""}{profile.score}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-3 leading-relaxed">
                Scores run from <span className="text-red-400">+10 (strongly pro-inflammatory)</span> to{" "}
                <span className="text-emerald-400">-10 (strongly anti-inflammatory)</span>.
                This recipe scores <strong>{profile.score}</strong> — {profile.label.toLowerCase()}.
                Ingredients like turmeric, garlic, leafy greens, and omega-3 sources push the score negative (better).
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════
//  GLYCEMIC PROFILE PANEL
// ═══════════════════════════════════════════════════════════════

function GlycemicPanel({ profile }) {
  const [open, setOpen] = useState(false)
  if (!profile) return null

  const giColor = profile.avgGI < 55 ? "text-green-400" : profile.avgGI < 70 ? "text-yellow-400" : "text-red-400"

  return (
    <div className="mb-6 border-t border-white/5 pt-6">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-sky-400">📈 Glycemic Profile</span>
          <span className={`text-sm font-semibold bg-sky-500/15 border border-sky-500/25 px-2.5 py-0.5 rounded-full ${giColor}`}>
            GI {profile.avgGI} · GL {profile.totalGL}
          </span>
        </div>
        <span className="text-sm text-gray-600">{open ? "▲ hide" : "▼ show"}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="mt-4 p-5 bg-white/3 border border-white/8 rounded-2xl space-y-4">
              <p className="text-sm text-gray-300 leading-relaxed">{profile.label}</p>

              {/* GI bar */}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Low GI (&lt;55)</span>
                  <span>High GI (≥70)</span>
                </div>
                <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${profile.avgGI < 55 ? "bg-green-500" : profile.avgGI < 70 ? "bg-yellow-500" : "bg-red-500"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.round((profile.avgGI / 100) * 100))}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Avg Glycemic Index</p>
                  <p className={`text-xl font-bold ${giColor}`}>{profile.avgGI}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Total Glycemic Load</p>
                  <p className={`text-xl font-bold ${profile.totalGL > 20 ? "text-orange-400" : "text-green-400"}`}>{profile.totalGL}</p>
                </div>
              </div>

              {/* High GI items warning */}
              {profile.highGIItems?.length > 0 && (
                <div className="p-3 bg-orange-500/8 border border-orange-500/20 rounded-xl">
                  <p className="text-xs font-semibold text-orange-400 mb-2">⚠️ High GI Ingredients</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.highGIItems.map(item => (
                      <span key={item} className="text-xs bg-orange-500/15 text-orange-300 border border-orange-500/20 px-2 py-0.5 rounded-full">
                        {capitalize(item)}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Swap white rice for brown rice or add vegetables to lower the glycemic load.</p>
                </div>
              )}

              {/* Low GI highlights */}
              {profile.lowGIItems?.length > 0 && (
                <div className="p-3 bg-green-500/8 border border-green-500/20 rounded-xl">
                  <p className="text-xs font-semibold text-green-400 mb-2">✅ Low GI Ingredients</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.lowGIItems.map(item => (
                      <span key={item} className="text-xs bg-green-500/15 text-green-300 border border-green-500/20 px-2 py-0.5 rounded-full">
                        {capitalize(item)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-600">
                GI (Glycemic Index) measures how fast a food raises blood sugar. GL (Glycemic Load) accounts for portion size — GL &lt;10 is low, 10–20 medium, &gt;20 high.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════
//  PROTEIN QUALITY / PDCAAS PANEL
// ═══════════════════════════════════════════════════════════════

function ProteinQualityPanel({ quality }) {
  const [open, setOpen] = useState(false)
  if (!quality) return null

  const tier = quality.tier
  if (!tier) return null

  return (
    <div className="mb-6 border-t border-white/5 pt-6">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-violet-400">💪 Protein Quality</span>
          <span className="text-sm font-semibold text-white bg-violet-500/15 border border-violet-500/25 px-2.5 py-0.5 rounded-full">
            {tier.emoji} {tier.label}
          </span>
        </div>
        <span className="text-sm text-gray-600">{open ? "▲ hide" : "▼ show"}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="mt-4 p-5 bg-white/3 border border-white/8 rounded-2xl space-y-4">

              {/* PDCAAS bar */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-500">PDCAAS Score</span>
                  <span className="text-sm font-bold text-violet-400">
                    {quality.avgPdcaas?.toFixed(2) ?? "—"} / 1.00
                  </span>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: tier.colour ?? "#a855f7" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round((quality.avgPdcaas ?? 0) * 100)}%` }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Completeness indicator */}
              <div className={`flex items-start gap-3 p-3 rounded-xl border ${
                quality.isComplete
                  ? "bg-green-500/8 border-green-500/20"
                  : "bg-amber-500/8 border-amber-500/20"
              }`}>
                <span className="text-lg shrink-0">{quality.isComplete ? "✅" : "🔄"}</span>
                <div>
                  <p className={`text-sm font-semibold ${quality.isComplete ? "text-green-400" : "text-amber-400"}`}>
                    {quality.isComplete ? "Complete amino acid profile" : "Incomplete amino acid profile"}
                  </p>
                  {quality.completenessNote && (
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{quality.completenessNote}</p>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-400 leading-relaxed">{tier.desc}</p>

              <p className="text-xs text-gray-600">
                PDCAAS (Protein Digestibility Corrected Amino Acid Score) ranges 0–1. A score of 1.0 means the protein provides all essential amino acids in adequate amounts that your body can fully digest and use.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════
//  VITAMIN DEFICIENCY CALLOUT
//  Only renders when vitaminFlags.length > 0
// ═══════════════════════════════════════════════════════════════

function VitaminFlags({ flags }) {
  if (!flags?.length) return null
  return (
    <div className="mb-6 p-4 bg-amber-500/8 border border-amber-500/25 rounded-2xl">
      <p className="text-sm font-bold text-amber-400 mb-3">⚠️ Low Micronutrients Detected</p>
      <div className="space-y-2">
        {flags.map((flag, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-amber-300">{flag.nutrient}</span>
                <span className="text-xs text-gray-500">({flag.value} · RDA: {flag.rda})</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{flag.concern}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════
//  COOKING TIPS SECTION
// ═══════════════════════════════════════════════════════════════

function CookingTips({ tips }) {
  const [open, setOpen] = useState(false)
  if (!tips?.length) return null
  return (
    <div className="mt-6 border-t border-white/5 pt-6">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between text-base font-semibold text-teal-400 hover:text-teal-300 transition-colors">
        <span>🔬 Cooking Science Tips</span>
        <span className="text-sm text-gray-600">{open ? "▲ hide" : "▼ show"}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="space-y-3 mt-4">
              {tips.map(({ ingredient, tip }, i) => (
                <div key={i} className="flex gap-3 p-4 bg-teal-500/5 border border-teal-500/15 rounded-xl">
                  <span className="text-teal-400 shrink-0 font-semibold text-sm">{ingredient}</span>
                  <p className="text-sm text-gray-300 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════
//  PRICE BREAKDOWN — v2: uses pb.currency.symbol (not pb.currency)
// ═══════════════════════════════════════════════════════════════

function PriceBreakdown({ recipe, s }) {
  const [open, setOpen] = useState(false)
  const pb = recipe.priceBreakdown
  if (!pb) return null

  // FIX: currency is now an object { symbol, code, name, locale }
  const sym = pb.currency?.symbol ?? "₹"

  return (
    <div className="mt-8 border-t border-white/5 pt-6">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-emerald-400">💸 Cost Breakdown</span>
          <span className="text-sm font-bold text-white bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-0.5 rounded-full">
            {recipe.estimatedCost ?? `${sym}${Math.round(pb.totalPerServing * s)}`}/serving
          </span>
        </div>
        <span className="text-sm text-gray-600">{open ? "▲ hide" : "▼ show"}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">

            <div className="mt-4 rounded-2xl overflow-hidden border border-white/8">
              <div className="grid grid-cols-3 gap-2 px-4 py-2.5 bg-white/5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <span>Ingredient</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Cost/serving</span>
              </div>
              <div className="divide-y divide-white/5">
                {pb.items.map(({ item, useQty, costPerServing }, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2 px-4 py-2.5 hover:bg-white/3 transition-colors">
                    <span className="text-sm text-gray-300">{capitalize(item)}</span>
                    <span className="text-sm text-center text-gray-500">{Math.round((useQty ?? 100) * s)}g</span>
                    <span className="text-sm text-right font-semibold text-emerald-400">
                      {sym}{Math.round(costPerServing * s)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 px-4 py-3 bg-emerald-500/8 border-t border-emerald-500/20">
                <span className="text-sm font-bold text-white">Total</span>
                <span className="text-sm text-center text-gray-500">{s > 1 ? `×${s} servings` : "1 serving"}</span>
                <span className="text-sm text-right font-bold text-emerald-400">
                  {sym}{Math.round(pb.totalPerServing * s)}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-600 mt-2 italic">
              Prices are approximate. Costs are scaled by location multiplier and ingredient category.
            </p>

            {/* Volatility warnings — NEW */}
            {(recipe.priceBreakdown?.volatileItems?.length > 0 || recipe.volatilityWarnings?.length > 0) && (
              <div className="mt-3 p-3 bg-orange-500/8 border border-orange-500/20 rounded-xl">
                <p className="text-xs font-semibold text-orange-400 mb-1.5">⚡ Price Volatile Ingredients</p>
                <div className="flex flex-wrap gap-1.5">
                  {(recipe.priceBreakdown?.volatileItems ?? recipe.volatilityWarnings ?? []).map((item, i) => (
                    <span key={i} className="text-xs bg-orange-500/10 text-orange-300 border border-orange-500/20 px-2 py-0.5 rounded-full">
                      {capitalize(typeof item === 'string' ? item : item.item ?? item)}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1.5">Prices for these may vary significantly by season or market.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════
//  OPTIMIZATION BANNER
// ═══════════════════════════════════════════════════════════════

function OptimizationBanner({ recipe }) {
  if (!recipe.isOptimized || !recipe.optimizationChanges?.length) return null
  return (
    <div className="mb-6 p-4 bg-violet-500/8 border border-violet-500/20 rounded-2xl">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🎯</span>
        <span className="text-base font-semibold text-violet-300">Optimized Recipe</span>
        {recipe.costSavingPct > 0 && (
          <span className="ml-auto text-sm text-violet-400 font-bold bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded-full">
            {recipe.costSavingPct}% cheaper
          </span>
        )}
      </div>
      <div className="space-y-2">
        {recipe.optimizationChanges.map((ch, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-400 line-through">{ch.original}</span>
            <span className="text-gray-600">→</span>
            <span className="text-violet-300 font-semibold">{ch.swappedTo}</span>
            <span className="text-xs text-gray-600 italic">({ch.reason})</span>
          </div>
        ))}
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ═══════════════════════════════════════════════════════════════

export default function RecipeDisplay({ recipe, isFavourite = false, onToggleFavourite }) {
  const cardRef      = useRef(null)
  const intervalRefs = useRef({})

  const [servings,     setServings]     = useState(1)
  const [stepTimers,   setStepTimers]   = useState({})
  const [toast,        setToast]        = useState("")
  const [showRadar,    setShowRadar]    = useState(false)
  const [pdfMode,      setPdfMode]      = useState(false)
  const [showMistakes, setShowMistakes] = useState(false)
  const [showSwaps,    setShowSwaps]    = useState(false)
  const [showPairings, setShowPairings] = useState(false)

  useEffect(() => {
    setStepTimers({})
    setServings(1)
    setShowRadar(false)
    Object.values(intervalRefs.current).forEach(clearInterval)
    intervalRefs.current = {}
  }, [recipe?.title])

  useEffect(() => {
    return () => { Object.values(intervalRefs.current).forEach(clearInterval) }
  }, [])

  if (!recipe) return null

  const s = servings

  // Scaled macros
  const scaledCal     = `${Math.round(parseNum(recipe.calories) * s)} kcal`
  const scaledProtein = `${Math.round(parseNum(recipe.protein)  * s)} g`
  const scaledCarbs   = `${Math.round(parseNum(recipe.carbs)    * s)} g`
  const scaledFats    = `${Math.round(parseNum(recipe.fats)     * s)} g`
  const scaledFibre   = recipe.fibre ? scaleMicro(recipe.fibre, s) : null

  const radarData = [
    { subject: "Protein",  value: Math.min(100, Math.round(parseNum(recipe.protein)  * s / 60   * 100)) },
    { subject: "Carbs",    value: Math.min(100, Math.round(parseNum(recipe.carbs)    * s / 150  * 100)) },
    { subject: "Fat",      value: Math.min(100, Math.round(parseNum(recipe.fats)     * s / 65   * 100)) },
    { subject: "Calories", value: Math.min(100, Math.round(parseNum(recipe.calories) * s / 1000 * 100)) },
    { subject: "Health",   value: recipe.healthScore },
  ]

  const tier = getHealthTier(recipe.healthScore)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(""), 2500)
  }

  const downloadPDF = async () => {
    if (!cardRef.current) return
    setPdfMode(true)
    await new Promise(r => setTimeout(r, 100))
    await html2pdf().set({
      margin: 0.5,
      filename: `${recipe.title}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    }).from(cardRef.current).save()
    setPdfMode(false)
  }

  const exportImage = async () => {
    if (!cardRef.current) return
    setPdfMode(true)
    await new Promise(r => setTimeout(r, 100))
    const dataUrl = await toPng(cardRef.current, {
      backgroundColor: "#111827",
      filter: n => !n.classList?.contains("no-export"),
    })
    setPdfMode(false)
    const link = document.createElement("a")
    link.download = `${recipe.title}.png`
    link.href = dataUrl
    link.click()
  }

  const shareRecipe = async () => {
    const text = `${recipe.title}\nCalories: ${scaledCal} | Protein: ${scaledProtein} | Servings: ${s}\n\n${recipe.description}`
    if (navigator.share) await navigator.share({ title: recipe.title, text })
    else { await navigator.clipboard.writeText(text); showToast("📋 Recipe copied to clipboard!") }
  }

  const copyShoppingList = async () => {
    const scaled = recipe.ingredients.map(ing => ({ item: ing.item, qty: Math.round(ing.qty * s) }))
    const groups = categoriseIngredients(scaled)
    const text =
      `🛒 Shopping List — ${recipe.title} (${s} serving${s > 1 ? "s" : ""})\n\n` +
      Object.entries(groups)
        .filter(([, items]) => items.length > 0)
        .map(([h, items]) => `${h}\n${items.join("\n")}`)
        .join("\n\n")
    await navigator.clipboard.writeText(text)
    showToast("🛒 Shopping list copied!")
  }

  const toggleTimer = (index, step) => {
    const current = stepTimers[index]
    if (current?.done) {
      setStepTimers(p => { const n = { ...p }; delete n[index]; return n })
      clearInterval(intervalRefs.current[index])
      return
    }
    if (current?.running) {
      clearInterval(intervalRefs.current[index])
      setStepTimers(p => ({ ...p, [index]: { ...p[index], running: false } }))
      return
    }
    const duration = current?.remaining ?? getStepDuration(step)
    setStepTimers(p => ({ ...p, [index]: { remaining: duration, running: true, done: false } }))
    clearInterval(intervalRefs.current[index])
    intervalRefs.current[index] = setInterval(() => {
      setStepTimers(p => {
        const t = p[index]
        if (!t || t.remaining <= 1) {
          clearInterval(intervalRefs.current[index])
          showToast(`⏰ Step ${index + 1} complete!`)
          playTimerBeep()
          return { ...p, [index]: { remaining: 0, running: false, done: true } }
        }
        return { ...p, [index]: { ...t, remaining: t.remaining - 1 } }
      })
    }, 1000)
  }

  // ── Derived from recipe ─────────────────────────────────────
  const dietary    = recipe.dietaryProfile
  const difficulty = recipe.difficulty
  const budgetTier = recipe.budgetTier
  const inflam     = recipe.inflammatoryProfile
  const healthTags = recipe.healthTags ?? []
  // FIX: renamed budgetSwaps → swapSavings in v5
  const swapSavings = recipe.swapSavings ?? recipe.budgetSwaps ?? []

  // ── Full micros list (all 12) ───────────────────────────────
  const microsList = recipe.micros ? [
    { label: "Iron",      value: scaleMicro(recipe.micros.iron,      s), color: "text-red-400",    bg: "bg-red-500/10    border-red-500/20"    },
    { label: "Calcium",   value: scaleMicro(recipe.micros.calcium,   s), color: "text-sky-400",    bg: "bg-sky-500/10    border-sky-500/20"    },
    { label: "Vit C",     value: scaleMicro(recipe.micros.vitC,      s), color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
    { label: "Vit A",     value: scaleMicro(recipe.micros.vitA,      s), color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
    { label: "Vit B12",   value: scaleMicro(recipe.micros.vitB12,    s), color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
    { label: "Vit D",     value: scaleMicro(recipe.micros.vitD,      s), color: "text-amber-400",  bg: "bg-amber-500/10  border-amber-500/20"  },
    { label: "Folate",    value: scaleMicro(recipe.micros.folate,    s), color: "text-lime-400",   bg: "bg-lime-500/10   border-lime-500/20"   },
    { label: "Omega-3",   value: scaleMicro(recipe.micros.omega3,    s), color: "text-teal-400",   bg: "bg-teal-500/10   border-teal-500/20"   },
    { label: "Sodium",    value: scaleMicro(recipe.micros.sodium,    s), color: "text-slate-400",  bg: "bg-slate-500/10  border-slate-500/20"  },
    { label: "Potassium", value: scaleMicro(recipe.micros.potassium, s), color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/20"},
    { label: "Magnesium", value: scaleMicro(recipe.micros.magnesium, s), color: "text-cyan-400",   bg: "bg-cyan-500/10   border-cyan-500/20"   },
    { label: "Zinc",      value: scaleMicro(recipe.micros.zinc,      s), color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  ] : []

  // ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Toast ──────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gray-900 border border-white/20 text-white px-6 py-3.5 rounded-2xl shadow-2xl text-sm font-medium pointer-events-none whitespace-nowrap">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div ref={cardRef} initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-[#111827] border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl">

        {/* ── Optimization banner ──────────────────────────── */}
        <OptimizationBanner recipe={recipe} />

        {/* ── Title + favourite ────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <h2 className={`text-3xl md:text-4xl font-bold leading-tight ${pdfMode ? "text-orange-500" : "bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent"}`}>
            {recipe.title}
          </h2>
          {onToggleFavourite && (
            <motion.button whileTap={{ scale: 0.75 }} onClick={onToggleFavourite}
              className="no-export shrink-0 text-2xl mt-1">
              {isFavourite ? "⭐" : "☆"}
            </motion.button>
          )}
        </div>

        {/* ── Badge row — health tier + dietary + difficulty + budget ── */}
        <div className="flex flex-wrap gap-2 mb-6">
          {/* Health tier */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${tier.bg} ${tier.color}`}>
            <span>{tier.emoji}</span>
            <span>{tier.label}</span>
            <span className="opacity-40">·</span>
            <span>{recipe.healthScore}/100</span>
          </div>

          {/* Dietary profile — NEW */}
          {dietary && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold bg-white/5 border-white/15 text-gray-300">
              <span>{dietary.emoji}</span>
              <span>{dietary.label}</span>
            </div>
          )}

          {/* Inflammatory badge — NEW */}
          {inflam && (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold ${
              inflam.score <= -2
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                : inflam.score > 2
                  ? "bg-red-500/10 border-red-500/25 text-red-400"
                  : "bg-white/5 border-white/15 text-gray-400"
            }`}>
              <span>{inflam.emoji}</span>
              <span>{inflam.label}</span>
            </div>
          )}

          {/* Difficulty — NEW */}
          {difficulty && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold bg-white/5 border-white/15 text-gray-300">
              {difficulty}
            </div>
          )}

          {/* Budget tier — NEW */}
          {budgetTier && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold bg-white/5 border-white/15 text-gray-300">
              <span>{budgetTier.emoji}</span>
              <span>{budgetTier.label}</span>
            </div>
          )}

          {/* Prep time */}
          {recipe.prepTime && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold bg-white/5 border-white/15 text-gray-300">
              ⏱ {recipe.prepTime}
            </div>
          )}
        </div>

        {/* ── Excluded ingredients — NEW ───────────────────── */}
        {recipe.excluded?.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-5 p-3 bg-red-500/5 border border-red-500/15 rounded-xl">
            <span className="text-xs text-red-400 font-semibold">Excluded:</span>
            {recipe.excluded.map(item => (
              <span key={item} className="text-xs px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 flex items-center gap-1">
                🚫 {capitalize(item)}
              </span>
            ))}
          </div>
        )}

        {/* ── Allergen warning ─────────────────────────────── */}
        {recipe.allergens?.length > 0 && (
          <div className="flex flex-wrap items-start gap-3 mb-6 p-4 bg-red-500/8 border border-red-500/25 rounded-2xl">
            <span className="text-red-400 font-bold text-sm shrink-0 mt-0.5">⚠️ ALLERGENS</span>
            <div className="flex flex-wrap gap-2">
              {recipe.allergens.map((a, i) => (
                <span key={i} className="text-sm bg-red-500/15 border border-red-500/30 text-red-300 px-3 py-1 rounded-full font-medium">{a}</span>
              ))}
            </div>
            <p className="w-full text-sm text-red-400/60 mt-1">Always verify for personal dietary requirements. Values are indicative.</p>
          </div>
        )}

        {/* ── Action buttons ───────────────────────────────── */}
        <div className="no-export flex flex-wrap gap-2 mb-8">
          {[
            { label: "📄 PDF",   color: "purple", fn: downloadPDF      },
            { label: "🖼 Image", color: "blue",   fn: exportImage      },
            { label: "🔗 Share", color: "green",  fn: shareRecipe      },
            { label: "🛒 List",  color: "amber",  fn: copyShoppingList },
          ].map(({ label, color, fn }) => (
            <ActionButton key={label} color={color} onClick={fn}>{label}</ActionButton>
          ))}
          <a href={`https://wa.me/?text=${encodeURIComponent(`${recipe.title} (${s} serving${s > 1 ? "s" : ""})\nCal: ${scaledCal} | Protein: ${scaledProtein}\n\n${recipe.description}`)}`}
            target="_blank" rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-sm font-medium transition-colors">
            💬 WhatsApp
          </a>
        </div>

        {/* ── Description ──────────────────────────────────── */}
        <p className="text-gray-300 mb-6 leading-relaxed text-base">{recipe.description}</p>

        {/* ── Dish meta subtitle (cuisine · mealType · cookMethod) — NEW ── */}
        {recipe.dishMeta && (
          <p className="text-sm text-gray-500 mb-4 -mt-3">
            {[
              recipe.dishMeta.cuisine,
              recipe.dishMeta.mealType?.join(" / "),
              recipe.dishMeta.cookMethod,
            ].filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ")).join(" · ")}
          </p>
        )}

        {/* ── Health tags — NEW ────────────────────────────── */}
        {healthTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {healthTags.map(({ tag, count }) => (
              <span key={tag} className="text-xs px-3 py-1.5 rounded-full font-medium bg-green-500/10 border border-green-500/20 text-green-300">
                ✦ {tag.replace(/-/g, " ")}{count > 1 ? ` ×${count}` : ""}
              </span>
            ))}
          </div>
        )}

        {/* ── Serving scaler ───────────────────────────────── */}
        <div className="no-export flex items-center gap-4 mb-8 p-4 bg-white/5 border border-white/10 rounded-2xl">
          <span className="text-base text-gray-300 font-medium">Servings</span>
          <div className="flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => setServings(v => Math.max(1, v - 1))}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-lg flex items-center justify-center transition-colors">−</motion.button>
            <span className="text-2xl font-bold text-white w-6 text-center">{s}</span>
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => setServings(v => Math.min(12, v + 1))}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-lg flex items-center justify-center transition-colors">+</motion.button>
          </div>
          {s > 1 && <span className="text-sm text-gray-600 ml-auto">Scaled ×{s}</span>}
        </div>

        {/* ── Macro cards ──────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
          <InfoCard label="Calories"  value={scaledCal}     accent="orange" />
          <InfoCard label="Protein"   value={scaledProtein} accent="blue"   />
          <InfoCard label="Carbs"     value={scaledCarbs}   accent="purple" />
          <InfoCard label="Fats"      value={scaledFats}    accent="pink"   />
          {scaledFibre
            ? <InfoCard label="Fibre" value={scaledFibre}   accent="lime"   />
            : <InfoCard label="Prep"  value={recipe.prepTime ?? "—"} accent="gray" />
          }
        </div>

        {/* ── Extended micronutrient grid — all 12 fields ──── */}
        {microsList.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {microsList.map(({ label, value, color, bg }) => (
              <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium ${bg} ${color}`}>
                <span className="opacity-70">{label}</span>
                <span className="font-bold">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Vitamin deficiency callout — NEW ─────────────── */}
        <VitaminFlags flags={recipe.vitaminFlags} />

        {/* ── Nutritional disclaimer ───────────────────────── */}
        <p className="text-sm text-gray-600 italic mb-6">
          ⚕️ All nutritional values are estimates based on standard food composition data. Actual values vary by ingredient quality, preparation method and portion size.
        </p>

        {/* ── Radar chart ──────────────────────────────────── */}
        <div className="no-export mb-4">
          <button onClick={() => setShowRadar(v => !v)}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors mb-3 flex items-center gap-1.5">
            {showRadar ? "▲ Hide" : "▼ Show"} macro radar chart
          </button>
          <AnimatePresence>
            {showRadar && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 270 }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35 }} className="overflow-hidden">
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#9ca3af", fontSize: 13 }} />
                    <Radar dataKey="value" stroke="#f97316" fill="#f97316" fillOpacity={0.2} strokeWidth={2} />
                    <Tooltip
                      contentStyle={{ background: "rgba(10,10,20,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e5e7eb", fontSize: 13 }}
                      formatter={v => [`${v}%`, "Level"]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                <p className="text-sm text-center text-gray-600 -mt-2">Values normalised against daily reference targets</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Health Score Breakdown ────────────────────────── */}
        <HealthScorePanel recipe={recipe} tier={tier} />

        {/* ── Inflammatory profile — NEW ────────────────────── */}
        <InflamPanel profile={recipe.inflammatoryProfile} />

        {/* ── Glycemic profile — NEW ───────────────────────── */}
        <GlycemicPanel profile={recipe.glycemicProfile} />

        {/* ── Protein quality / PDCAAS — NEW ──────────────── */}
        <ProteinQualityPanel quality={recipe.proteinQuality} />

        {/* ── Ingredients ──────────────────────────────────── */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-orange-400 flex items-center gap-2">
            🧂 Ingredients
            {s > 1 && <span className="text-sm font-normal text-gray-600">for {s} servings</span>}
          </h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {recipe.ingredients.map((ing, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.035 }}
                className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <span className="text-base text-gray-200">{capitalize(ing.item)}</span>
                <span className="text-orange-400 text-base font-mono font-semibold">{Math.round(ing.qty * s)}g</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Cooking tips — NEW ───────────────────────────── */}
        <CookingTips tips={recipe.cookingTips} />

        {/* ── Suggestions ──────────────────────────────────── */}
        {recipe.suggestions?.length > 0 && (
          <div className="mt-6 mb-6 p-5 bg-green-500/5 border border-green-500/15 rounded-2xl">
            <h3 className="text-base font-semibold text-green-400 mb-3">💡 Suggested Additions</h3>
            <div className="flex flex-wrap gap-2">
              {recipe.suggestions.map((item, i) => (
                <span key={i} className="text-sm bg-green-500/10 border border-green-500/20 text-green-300 px-3 py-1.5 rounded-full">
                  + {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Steps with timers ────────────────────────────── */}
        <div>
          <h3 className="text-lg font-semibold mb-1 text-purple-400">👨‍🍳 Instructions</h3>
          <p className="no-export text-sm text-gray-500 mb-5">
            Tap ⏱ to start a countdown. A chime sounds when the step completes.
          </p>
          <motion.ol variants={stepListVariants} initial="hidden" animate="visible" className="space-y-2.5">
            {recipe.steps.map((step, index) => {
              const timer     = stepTimers[index]
              const isDone    = timer?.done
              const isRunning = timer?.running
              const stepStr   = getStepText(step)
              const dashIdx   = stepStr.indexOf("—")
              const label     = dashIdx > -1 ? stepStr.slice(0, dashIdx).trim() : ""
              const body      = dashIdx > -1 ? stepStr.slice(dashIdx + 1).trim() : stepStr
              return (
                <motion.li key={index} variants={stepItemVariants}
                  className={`flex gap-3 p-4 rounded-2xl border transition-all duration-300
                    ${isDone ? "bg-green-500/8 border-green-500/20" : isRunning ? "bg-orange-500/8 border-orange-500/20" : "bg-white/3 border-white/5 hover:bg-white/5"}`}>
                  <span className={`font-bold shrink-0 text-base w-5 mt-0.5 ${isDone ? "text-green-400" : "text-orange-400"}`}>
                    {index + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    {label && <span className="text-sm font-bold tracking-wider text-gray-400 uppercase mr-2">{label} —</span>}
                    <span className={`text-base leading-relaxed ${isDone ? "text-green-400/70 line-through" : "text-gray-200"}`}>{body}</span>
                  </div>
                  <motion.button whileTap={{ scale: 0.88 }} onClick={() => toggleTimer(index, step)}
                    className={`no-export shrink-0 text-sm font-mono px-3 py-2 rounded-xl transition-all min-w-[72px] text-center border
                      ${isDone ? "bg-green-500/20 text-green-300 border-green-500/30"
                       : isRunning ? "bg-orange-500/20 text-orange-300 border-orange-500/30 animate-pulse"
                       : "bg-white/8 text-gray-400 border-white/10 hover:bg-white/15"}`}>
                    {isDone ? "✓ Done"
                     : isRunning ? formatTime(timer.remaining)
                     : timer ? `▶ ${formatTime(timer.remaining)}`
                     : `⏱ ${formatTime(getStepDuration(step))}`}
                  </motion.button>
                </motion.li>
              )
            })}
          </motion.ol>
        </div>

        {/* ── Pairings ─────────────────────────────────────── */}
        {recipe.pairings?.length > 0 && (
          <div className="mt-8 border-t border-white/5 pt-6">
            <button onClick={() => setShowPairings(v => !v)}
              className="w-full flex items-center justify-between text-base font-semibold text-sky-400 hover:text-sky-300 transition-colors">
              <span>🍽 Best Paired With</span>
              <span className="text-sm text-gray-600">{showPairings ? "▲ hide" : "▼ show"}</span>
            </button>
            <AnimatePresence>
              {showPairings && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                  <div className="flex flex-wrap gap-2 mt-4">
                    {recipe.pairings.map((item, i) => (
                      <span key={i} className="text-sm bg-sky-500/10 border border-sky-500/20 text-sky-300 px-3 py-2 rounded-full">
                        🍴 {item}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-3">Cuisine and goal aware — selected to complement this meal's macro profile.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Swap savings — FIX: was budgetSwaps, now swapSavings ── */}
        {swapSavings.length > 0 && (
          <div className="mt-6 border-t border-white/5 pt-6">
            <button onClick={() => setShowSwaps(v => !v)}
              className="w-full flex items-center justify-between text-base font-semibold text-amber-400 hover:text-amber-300 transition-colors">
              <span>💰 Budget Friendly Swaps</span>
              <span className="text-sm text-gray-600">{showSwaps ? "▲ hide" : "▼ show"}</span>
            </button>
            <AnimatePresence>
              {showSwaps && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                  <div className="space-y-4 mt-4">
                    {swapSavings.map((swap, i) => {
                      // Handle both old shape (budgetSwaps) and new shape (swapSavings from getAllSwapSavings)
                      const fromItem  = swap.ingredient ?? capitalize(swap.item)
                      const toItem    = swap.swap       ?? capitalize(swap.swapTo)
                      const saving    = swap.saving     ?? (swap.savedPct ? `${swap.savedPct}%` : "—")
                      const note      = swap.note
                      const nutritionNote = swap.nutritionNote
                      return (
                        <div key={i} className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="text-sm font-bold text-amber-300">{fromItem}</span>
                            <span className="text-gray-500 text-base">→</span>
                            <span className="text-sm text-gray-200 font-semibold">{toItem}</span>
                            <span className="ml-auto text-sm font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full shrink-0">
                              saves {saving}
                            </span>
                          </div>
                          {note && <p className="text-sm text-gray-400 leading-relaxed">{note}</p>}
                          {nutritionNote && (
                            <p className="text-xs text-gray-500 mt-1.5 italic">{nutritionNote}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Common mistakes ───────────────────────────────── */}
        {recipe.mistakes?.length > 0 && (
          <div className="mt-6 border-t border-white/5 pt-6">
            <button onClick={() => setShowMistakes(v => !v)}
              className="w-full flex items-center justify-between text-base font-semibold text-rose-400 hover:text-rose-300 transition-colors">
              <span>⚠️ Common Mistakes &amp; Fixes</span>
              <span className="text-sm text-gray-600">{showMistakes ? "▲ hide" : "▼ show"}</span>
            </button>
            <AnimatePresence>
              {showMistakes && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                  <ul className="space-y-3 mt-4">
                    {recipe.mistakes.map((mistake, i) => (
                      <li key={i} className="flex gap-3 p-4 bg-rose-500/5 border border-rose-500/15 rounded-xl">
                        <span className="text-rose-500 shrink-0 mt-0.5 text-base">✕</span>
                        <p className="text-base text-gray-300 leading-relaxed">{mistake}</p>
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-gray-600 mt-3 italic">Tips based on the specific ingredients and cuisine in this recipe.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Price Breakdown ───────────────────────────────── */}
        <PriceBreakdown recipe={recipe} s={s} />

      </motion.div>
    </>
  )
}


// ═══════════════════════════════════════════════════════════════
//  REUSABLE ATOMS
// ═══════════════════════════════════════════════════════════════

function InfoCard({ label, value, accent }) {
  const colors = {
    orange: "text-orange-400", blue:   "text-blue-400",
    purple: "text-purple-400", pink:   "text-pink-400",
    lime:   "text-lime-400",   gray:   "text-gray-300",
  }
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
      <p className="text-sm text-gray-500 mb-1.5">{label}</p>
      <p className={`text-base font-bold ${colors[accent] ?? colors.gray}`}>{value}</p>
    </div>
  )
}

function ActionButton({ onClick, color, children }) {
  const colors = {
    purple: "bg-purple-600 hover:bg-purple-500",
    blue:   "bg-blue-600 hover:bg-blue-500",
    green:  "bg-emerald-600 hover:bg-emerald-500",
    amber:  "bg-amber-600 hover:bg-amber-500",
  }
  return (
    <motion.button whileTap={{ scale: 0.92 }} onClick={onClick}
      className={`px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-colors ${colors[color] ?? colors.blue}`}>
      {children}
    </motion.button>
  )
}
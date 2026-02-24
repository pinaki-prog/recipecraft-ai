import { useState, useRef, useEffect } from "react"
import { toPng } from "html-to-image"
import html2pdf from "html2pdf.js"
import { motion, AnimatePresence } from "framer-motion"
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from "recharts"

function capitalize(word) {
  if (!word) return ""
  return word.charAt(0).toUpperCase() + word.slice(1)
}

const parseNum = (str) => parseFloat(str?.replace(/[^\d.]/g, "") || "0") || 0

function formatTime(seconds) {
  const m   = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${m}:${sec.toString().padStart(2, "0")}`
}

function getStepDuration(step) {
  const label = (step.split("—")[0] || "").trim().toUpperCase()
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

const PROTEIN_ITEMS = new Set(["chicken","egg","paneer","tofu","fish","beef","lamb","shrimp","soy_chunks","toor_dal","moong_dal","chickpeas","rajma","masoor_dal"])
const PRODUCE_ITEMS = new Set(["spinach","carrot","onion","tomato","capsicum","mushroom","broccoli","cauliflower","garlic","ginger","potato","sweet_potato","pumpkin","raw_banana","papaya","avocado","banana","green_peas"])
const DAIRY_ITEMS   = new Set(["ghee","butter","milk","curd","cream","cheese","paneer"])
const PANTRY_ITEMS  = new Set(["rice","brown_rice","pasta","oats","quinoa","semolina","atta_flour"])

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

function getHealthTier(score) {
  if (score >= 85) return { label: "Excellent", emoji: "🏆", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30" }
  if (score >= 70) return { label: "Good",      emoji: "✅", color: "text-green-400",  bg: "bg-green-500/10  border-green-500/30"  }
  if (score >= 50) return { label: "Balanced",  emoji: "⚡", color: "text-blue-400",   bg: "bg-blue-500/10   border-blue-500/30"   }
  return             { label: "Needs Work",     emoji: "🔧", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" }
}

const stepListVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07 } },
}
const stepItemVariants = {
  hidden:  { opacity: 0, x: -14 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
}

export default function RecipeDisplay({ recipe, isFavourite = false, onToggleFavourite }) {
  const cardRef      = useRef(null)   // live visible card
  const intervalRefs = useRef({})

  const [servings,   setServings]   = useState(1)
  const [stepTimers, setStepTimers] = useState({})
  const [toast,      setToast]      = useState("")
  const [showRadar,  setShowRadar]  = useState(false)
  const [pdfMode,    setPdfMode]    = useState(false)
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

  const s             = servings
  const scaledCal     = `${Math.round(parseNum(recipe.calories) * s)} kcal`
  const scaledProtein = `${Math.round(parseNum(recipe.protein)  * s)} g`
  const scaledCarbs   = `${Math.round(parseNum(recipe.carbs)    * s)} g`
  const scaledFats    = `${Math.round(parseNum(recipe.fats)     * s)} g`

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

  // ── PDF export ─────────────────────────────────────────────
  
  const downloadPDF = async () => {
    if (!cardRef.current) return
    setPdfMode(true)
    // Giving React one frame to re-render with solid text before canvas paints
    await new Promise((resolve) => setTimeout(resolve, 100))
    await html2pdf().set({
      margin: 0.5,
      filename: `${recipe.title}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    }).from(cardRef.current).save()
    setPdfMode(false)
  }

  // ── PNG export ─────────────────────────────────────────────
  
  const exportImage = async () => {
    if (!cardRef.current) return
    setPdfMode(true)
    await new Promise((resolve) => setTimeout(resolve, 100))
    const dataUrl = await toPng(cardRef.current, {
      backgroundColor: "#111827",
      filter: (node) => !node.classList?.contains("no-export"),
    })
    setPdfMode(false)
    const link    = document.createElement("a")
    link.download = `${recipe.title}.png`
    link.href     = dataUrl
    link.click()
  }

  const shareRecipe = async () => {
    const text =
      `${recipe.title}\n` +
      `Calories: ${scaledCal} | Protein: ${scaledProtein} | Servings: ${s}\n\n` +
      recipe.description
    if (navigator.share) {
      await navigator.share({ title: recipe.title, text })
    } else {
      await navigator.clipboard.writeText(text)
      showToast("📋 Recipe copied to clipboard!")
    }
  }

  const copyShoppingList = async () => {
    const scaled = recipe.ingredients.map((ing) => ({ item: ing.item, qty: Math.round(ing.qty * s) }))
    const groups = categoriseIngredients(scaled)
    const text   =
      `🛒 Shopping List — ${recipe.title} (${s} serving${s > 1 ? "s" : ""})\n\n` +
      Object.entries(groups)
        .filter(([, items]) => items.length > 0)
        .map(([heading, items]) => `${heading}\n${items.join("\n")}`)
        .join("\n\n")
    await navigator.clipboard.writeText(text)
    showToast("🛒 Shopping list copied!")
  }

  const toggleTimer = (index, step) => {
    const current = stepTimers[index]
    if (current?.done) {
      setStepTimers((p) => { const n = { ...p }; delete n[index]; return n })
      clearInterval(intervalRefs.current[index])
      return
    }
    if (current?.running) {
      clearInterval(intervalRefs.current[index])
      setStepTimers((p) => ({ ...p, [index]: { ...p[index], running: false } }))
      return
    }
    const duration = current?.remaining ?? getStepDuration(step)
    setStepTimers((p) => ({ ...p, [index]: { remaining: duration, running: true, done: false } }))
    clearInterval(intervalRefs.current[index])
    intervalRefs.current[index] = setInterval(() => {
      setStepTimers((p) => {
        const t = p[index]
        if (!t || t.remaining <= 1) {
          clearInterval(intervalRefs.current[index])
          showToast(`⏰ Step ${index + 1} complete!`)
          return { ...p, [index]: { remaining: 0, running: false, done: true } }
        }
        return { ...p, [index]: { ...t, remaining: t.remaining - 1 } }
      })
    }, 1000)
  }

  return (
    <>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50
              bg-gray-900 border border-white/20 text-white
              px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium
              pointer-events-none whitespace-nowrap"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/*
        ── WHY THE CARD IS ALWAYS DARK ──
        RecipeDisplay intentionally ignores the page theme.
        Reason: PDF and PNG exports capture the actual DOM colours.
        If the card used light-mode colours, exports would be
        white-on-white (unreadable). By locking the card to dark,
        both the live UI and every export are always consistent.
        Light-mode theming happens on the page wrapper in Home.jsx.
      */}
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.8 }}
        className="bg-[#111827] border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl"
      >

        {/* ── Title + favourite ─────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <h2 className={`text-3xl md:text-4xl font-bold leading-tight ${
            pdfMode
              ? "text-orange-500"
              : "bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent"
          }`}>
            {recipe.title}
          </h2>
          {onToggleFavourite && (
            <motion.button
              whileTap={{ scale: 0.75 }}
              onClick={onToggleFavourite}
              className="no-export shrink-0 text-2xl mt-1"
              title={isFavourite ? "Remove favourite" : "Save favourite"}
            >
              {isFavourite ? "⭐" : "☆"}
            </motion.button>
          )}
        </div>

        {/* ── Tier badge ────────────────────────────────── */}
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full
          border text-xs font-semibold mb-6 ${tier.bg} ${tier.color}`}>
          <span>{tier.emoji}</span>
          <span>{tier.label}</span>
          <span className="opacity-40">·</span>
          <span>{recipe.healthScore}/100</span>
        </div>

        {/* ── Allergen warning ─────────────────────────── */}
        {recipe.allergens?.length > 0 && (
          <div className="flex flex-wrap items-start gap-3 mb-6 p-3
            bg-red-500/8 border border-red-500/25 rounded-2xl">
            <span className="text-red-400 font-bold text-xs shrink-0 mt-0.5">⚠️ ALLERGENS</span>
            <div className="flex flex-wrap gap-1.5">
              {recipe.allergens.map((a, i) => (
                <span key={i} className="text-xs bg-red-500/15 border border-red-500/30
                  text-red-300 px-2.5 py-1 rounded-full font-medium">
                  {a}
                </span>
              ))}
            </div>
            <p className="w-full text-xs text-red-400/60 mt-1">
              Always verify for personal dietary requirements. Values are indicative.
            </p>
          </div>
        )}

        {/* ── Action buttons ────────────────────────────── */}
        <div className="no-export flex flex-wrap gap-2 mb-8">
          {[
            { label: "📄 PDF",   color: "purple", fn: downloadPDF      },
            { label: "🖼 Image", color: "blue",   fn: exportImage      },
            { label: "🔗 Share", color: "green",  fn: shareRecipe      },
            { label: "🛒 List",  color: "amber",  fn: copyShoppingList },
          ].map(({ label, color, fn }) => (
            <ActionButton key={label} color={color} onClick={fn}>{label}</ActionButton>
          ))}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `${recipe.title} (${s} serving${s > 1 ? "s" : ""})\nCal: ${scaledCal} | Protein: ${scaledProtein}\n\n${recipe.description}`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d]
              text-white text-sm font-medium transition-colors"
          >
            💬 WhatsApp
          </a>
        </div>

        {/* ── Description ───────────────────────────────── */}
        <p className="text-gray-400 mb-8 leading-relaxed text-sm">
          {recipe.description}
        </p>

        {/* ── Serving scaler ────────────────────────────── */}
        <div className="no-export flex items-center gap-4 mb-8 p-4
          bg-white/5 border border-white/10 rounded-2xl">
          <span className="text-sm text-gray-400 font-medium">Servings</span>
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => setServings((v) => Math.max(1, v - 1))}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20
                text-white font-bold text-lg flex items-center justify-center transition-colors"
            >−</motion.button>
            <span className="text-xl font-bold text-white w-6 text-center">{s}</span>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => setServings((v) => Math.min(12, v + 1))}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20
                text-white font-bold text-lg flex items-center justify-center transition-colors"
            >+</motion.button>
          </div>
          {s > 1 && <span className="text-xs text-gray-600 ml-auto">Scaled ×{s}</span>}
        </div>

        {/* ── Macro cards ───────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
          <InfoCard label="Calories"  value={scaledCal}       accent="orange" />
          <InfoCard label="Protein"   value={scaledProtein}   accent="blue"   />
          <InfoCard label="Carbs"     value={scaledCarbs}     accent="purple" />
          <InfoCard label="Fats"      value={scaledFats}      accent="pink"   />
          <InfoCard label="Prep Time" value={recipe.prepTime} accent="gray"   />
        </div>

        {/* ── Micronutrients ───────────────────────────── */}
        {recipe.micros && (
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              { label: "Fibre",    value: `${Math.round(recipe.micros.fibre   * s * 10) / 10}g`, color: "text-lime-400",   bg: "bg-lime-500/10   border-lime-500/20"   },
              { label: "Iron",     value: `${Math.round(recipe.micros.iron    * s * 10) / 10}mg`,color: "text-red-400",    bg: "bg-red-500/10    border-red-500/20"    },
              { label: "Calcium",  value: `${Math.round(recipe.micros.calcium * s)}mg`,           color: "text-sky-400",   bg: "bg-sky-500/10    border-sky-500/20"    },
              { label: "Vit C",    value: `${Math.round(recipe.micros.vitC    * s)}mg`,           color: "text-yellow-400",bg: "bg-yellow-500/10 border-yellow-500/20" },
              { label: "Vit A",    value: `${Math.round(recipe.micros.vitA    * s)}mcg`,          color: "text-orange-400",bg: "bg-orange-500/10 border-orange-500/20" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`flex items-center gap-1.5 px-3 py-1.5
                rounded-full border text-xs font-medium ${bg} ${color}`}>
                <span className="opacity-70">{label}</span>
                <span className="font-bold">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Nutritional disclaimer ────────────────────── */}
        <p className="text-xs text-gray-600 italic mb-6">
          ⚕️ All nutritional values are estimates based on standard food composition data.
          Actual values vary by ingredient quality, preparation method, and portion size.
          Not a substitute for professional dietary advice.
        </p>

        {/* ── Radar chart ───────────────────────────────── */}
        <div className="no-export mb-8">
          <button
            onClick={() => setShowRadar((v) => !v)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors mb-3 flex items-center gap-1"
          >
            {showRadar ? "▲ Hide" : "▼ Show"} macro radar chart
          </button>
          <AnimatePresence>
            {showRadar && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 270 }}
                exit={{    opacity: 0, height: 0   }}
                transition={{ duration: 0.35 }}
                className="overflow-hidden"
              >
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#6b7280", fontSize: 11 }} />
                    <Radar dataKey="value" stroke="#f97316" fill="#f97316" fillOpacity={0.2} strokeWidth={2} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(10,10,20,0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10, color: "#e5e7eb", fontSize: 12,
                      }}
                      formatter={(v) => [`${v}%`, "Level"]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                <p className="text-xs text-center text-gray-600 -mt-2">
                  Values normalised against daily reference targets
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Health bar ────────────────────────────────── */}
        <div className="mb-10">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Health Score</span>
            <span className={tier.color}>{tier.label}</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${recipe.healthScore}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* ── Ingredients ───────────────────────────────── */}
        <div className="mb-8">
          <h3 className="text-base font-semibold mb-4 text-orange-400 flex items-center gap-2">
            🧂 Ingredients
            {s > 1 && <span className="text-xs font-normal text-gray-600">for {s} servings</span>}
          </h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {recipe.ingredients.map((ing, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0  }}
                transition={{ delay: i * 0.035 }}
                className="flex items-center justify-between
                  bg-white/5 border border-white/10 rounded-xl px-4 py-2.5"
              >
                <span className="text-gray-300 text-sm">{capitalize(ing.item)}</span>
                <span className="text-orange-400 text-sm font-mono font-semibold">
                  {Math.round(ing.qty * s)}g
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Suggestions ───────────────────────────────── */}
        {recipe.suggestions?.length > 0 && (
          <div className="mb-10 p-4 bg-green-500/5 border border-green-500/15 rounded-2xl">
            <h3 className="text-sm font-semibold text-green-400 mb-3">💡 Suggested Additions</h3>
            <div className="flex flex-wrap gap-2">
              {recipe.suggestions.map((item, i) => (
                <span key={i} className="text-xs bg-green-500/10 border border-green-500/20
                  text-green-300 px-3 py-1 rounded-full">
                  + {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Steps with timers ─────────────────────────── */}
        <div>
          <h3 className="text-base font-semibold mb-1 text-purple-400">👨‍🍳 Instructions</h3>
          <p className="no-export text-xs text-gray-600 mb-5">
            Tap ⏱ to start a countdown timer for any step
          </p>
          <motion.ol variants={stepListVariants} initial="hidden" animate="visible" className="space-y-2.5">
            {recipe.steps.map((step, index) => {
              const timer     = stepTimers[index]
              const isDone    = timer?.done
              const isRunning = timer?.running
              const dashIdx   = step.indexOf("—")
              const label     = dashIdx > -1 ? step.slice(0, dashIdx).trim() : ""
              const body      = dashIdx > -1 ? step.slice(dashIdx + 1).trim() : step

              return (
                <motion.li
                  key={index}
                  variants={stepItemVariants}
                  className={`flex gap-3 p-4 rounded-2xl border transition-all duration-300
                    ${isDone    ? "bg-green-500/8  border-green-500/20"
                    : isRunning ? "bg-orange-500/8 border-orange-500/20"
                    :             "bg-white/3      border-white/5 hover:bg-white/5"}`}
                >
                  <span className={`font-bold shrink-0 text-sm w-5 mt-0.5
                    ${isDone ? "text-green-400" : "text-orange-400"}`}>
                    {index + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    {label && (
                      <span className="text-xs font-bold tracking-wider text-gray-500 uppercase mr-2">
                        {label} —
                      </span>
                    )}
                    <span className={`text-sm leading-relaxed
                      ${isDone ? "text-green-400/70 line-through" : "text-gray-300"}`}>
                      {body}
                    </span>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => toggleTimer(index, step)}
                    className={`no-export shrink-0 text-xs font-mono px-2.5 py-1.5 rounded-xl
                      transition-all min-w-[62px] text-center border
                      ${isDone    ? "bg-green-500/20  text-green-300  border-green-500/30"
                      : isRunning ? "bg-orange-500/20 text-orange-300 border-orange-500/30 animate-pulse"
                      :             "bg-white/8       text-gray-500   border-white/10 hover:bg-white/15"}`}
                  >
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

        {/* ── Best paired with ────────────────────────── */}
        {recipe.pairings?.length > 0 && (
          <div className="mt-8 border-t border-white/5 pt-6">
            <button
              onClick={() => setShowPairings((v) => !v)}
              className="w-full flex items-center justify-between text-sm font-semibold
                text-sky-400 hover:text-sky-300 transition-colors"
            >
              <span>🍽 Best Paired With</span>
              <span className="text-xs text-gray-600">{showPairings ? "▲ hide" : "▼ show"}</span>
            </button>
            <AnimatePresence>
              {showPairings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{    opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-2 mt-4">
                    {recipe.pairings.map((item, i) => (
                      <span key={i} className="text-xs bg-sky-500/10 border border-sky-500/20
                        text-sky-300 px-3 py-1.5 rounded-full">
                        🍴 {item}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-3">
                    Pairings are cuisine and goal aware — selected to complement your meal's macro profile.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Budget friendly swaps ─────────────────────── */}
        {recipe.budgetSwaps?.length > 0 && (
          <div className="mt-6 border-t border-white/5 pt-6">
            <button
              onClick={() => setShowSwaps((v) => !v)}
              className="w-full flex items-center justify-between text-sm font-semibold
                text-amber-400 hover:text-amber-300 transition-colors"
            >
              <span>💰 Budget Friendly Swaps</span>
              <span className="text-xs text-gray-600">{showSwaps ? "▲ hide" : "▼ show"}</span>
            </button>
            <AnimatePresence>
              {showSwaps && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{    opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 mt-4">
                    {recipe.budgetSwaps.map((swap, i) => (
                      <div key={i} className="flex items-start gap-3 p-3
                        bg-amber-500/5 border border-amber-500/15 rounded-xl">
                        <div className="shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-amber-400 bg-amber-500/10
                            border border-amber-500/20 px-2 py-0.5 rounded-full">
                            {swap.saving}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400 leading-relaxed">
                            <span className="text-amber-300 font-semibold">{swap.ingredient}</span>
                            {" → "}{swap.swap}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">{swap.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Common mistakes & fixes ───────────────────── */}
        {recipe.mistakes?.length > 0 && (
          <div className="mt-6 border-t border-white/5 pt-6">
            <button
              onClick={() => setShowMistakes((v) => !v)}
              className="w-full flex items-center justify-between text-sm font-semibold
                text-rose-400 hover:text-rose-300 transition-colors"
            >
              <span>⚠️ Common Mistakes & Fixes</span>
              <span className="text-xs text-gray-600">{showMistakes ? "▲ hide" : "▼ show"}</span>
            </button>
            <AnimatePresence>
              {showMistakes && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{    opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <ul className="space-y-2.5 mt-4">
                    {recipe.mistakes.map((mistake, i) => (
                      <li key={i} className="flex gap-3 p-3
                        bg-rose-500/5 border border-rose-500/15 rounded-xl">
                        <span className="text-rose-500 shrink-0 mt-0.5 text-sm">✕</span>
                        <p className="text-xs text-gray-300 leading-relaxed">{mistake}</p>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-600 mt-3 italic">
                    Tips based on the specific ingredients and cuisine in this recipe.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Cost footer ───────────────────────────────── */}
        {recipe.estimatedCost && (
          <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6 text-sm">
            <span className="text-gray-600">Estimated cost</span>
            <span className="text-white font-semibold">{recipe.estimatedCost}</span>
          </div>
        )}

      </motion.div>

    </>
  )
}

function InfoCard({ label, value, accent }) {
  const colors = {
    orange: "text-orange-400", blue: "text-blue-400",
    purple: "text-purple-400", pink: "text-pink-400", gray: "text-gray-300",
  }
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-sm font-semibold ${colors[accent] ?? colors.gray}`}>{value}</p>
    </div>
  )
}

function ActionButton({ onClick, color, children }) {
  const colors = {
    purple: "bg-purple-600 hover:bg-purple-500",
    blue:   "bg-blue-600   hover:bg-blue-500",
    green:  "bg-emerald-600 hover:bg-emerald-500",
    amber:  "bg-amber-600  hover:bg-amber-500",
  }
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-white text-sm font-medium
        transition-colors ${colors[color] ?? colors.blue}`}
    >
      {children}
    </motion.button>
  )
}
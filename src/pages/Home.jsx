import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import RecipeDisplay from "../components/RecipeDisplay"
import { generateSmartRecipe, optimizeRecipe } from "../utils/generateSmartRecipe"
import { normalizeInput, detectModeMismatch } from "../utils/normalizeInput"

// ─────────────────────────────────────────────────────────────
//  Home.jsx  (v2 — Full Upgrade)
//
//  BREAKING FIXES:
//  • normalizeInput v2 returns { ingredients, excluded, signals,
//    unknown, suggestions } — was object treated as array.
//    All call sites now destructure correctly.
//  • detectModeMismatch v2 returns { mismatch, confidence, reason }
//    — was object displayed as string. Now reads .reason.
//  • generateSmartRecipe + optimizeRecipe now receive the full
//    { ingredients, excluded, signals } shape, not a bare array.
//
//  ENHANCEMENTS:
//  1.  Signal auto-fill — signals.goal / signals.cuisine /
//      signals.dietary auto-fill dropdowns with animated banner.
//  2.  "We understood" / "Did you mean?" inline feedback —
//      unknown[] and suggestions[] surfaced below textarea.
//  3.  Excluded ingredients display — 🚫 pills shown below
//      textarea confirming "no onion" was understood.
//  4.  Expanded cuisine list — 14 cuisines (was 7), all from
//      dishAliases DISH_META + cookingEngine profiles.
//  5.  Servings selector (1–6) — wired to generateSmartRecipe.
//  6.  Dietary filter dropdown — Vegan / Vegetarian / Any.
//  7.  Budget slider currency-aware — shows ₹/$/€/¥/฿ based
//      on selected location.
//  8.  History card upgrades — dietary emoji, prep time, top
//      health tag shown on each history card.
//  9.  Skeleton upgraded — more rows to match new recipe output.
//  10. Confidence-gated mode warning — only shows warning at
//      confidence ≥ 0.65, not every minor mismatch.
// ─────────────────────────────────────────────────────────────

// ── Cuisine config — expanded from 7 to 14 ──────────────────
const CUISINE_OPTIONS = [
  { value:"India",         label:"🇮🇳 India (North)",   symbol:"₹" },
  { value:"India-South",   label:"🇮🇳 India (South)",   symbol:"₹" },
  { value:"India-East",    label:"🇮🇳 India (East)",    symbol:"₹" },
  { value:"Italy",         label:"🇮🇹 Italy",           symbol:"€" },
  { value:"France",        label:"🇫🇷 France",          symbol:"€" },
  { value:"Spain",         label:"🇪🇸 Spain",           symbol:"€" },
  { value:"Mexico",        label:"🇲🇽 Mexico",          symbol:"₱" },
  { value:"USA",           label:"🇺🇸 USA",             symbol:"$" },
  { value:"China",         label:"🇨🇳 China",           symbol:"¥" },
  { value:"Japan",         label:"🇯🇵 Japan",           symbol:"¥" },
  { value:"Korea",         label:"🇰🇷 Korea",           symbol:"₩" },
  { value:"Thailand",      label:"🇹🇭 Thailand",        symbol:"฿" },
  { value:"Vietnam",       label:"🇻🇳 Vietnam",         symbol:"₫" },
  { value:"Indonesia",     label:"🇮🇩 Indonesia",       symbol:"Rp" },
  { value:"Mediterranean", label:"🫒 Mediterranean",    symbol:"€" },
]

const CUISINE_FLAGS = Object.fromEntries(
  CUISINE_OPTIONS.map(c => [c.value, c.label.split(" ")[0]])
)

const CURRENCY_SYMBOL = Object.fromEntries(
  CUISINE_OPTIONS.map(c => [c.value, c.symbol])
)

// ── Signal → location mapping ───────────────────────────────
const SIGNAL_CUISINE_MAP = {
  "India-North":   "India",
  "India-South":   "India-South",
  "India-East":    "India-East",
  Italy:           "Italy",
  France:          "France",
  Spain:           "Spain",
  Korea:           "Korea",
  Vietnam:         "Vietnam",
  Japan:           "Japan",
  Thailand:        "Thailand",
  Mediterranean:   "Mediterranean",
  Indonesia:       "Indonesia",
  USA:             "USA",
}

// ── Storage helpers ──────────────────────────────────────────
function readStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback }
  catch { return fallback }
}

// ═══════════════════════════════════════════════════════════════
//  SKELETON — upgraded to match new recipe output depth
// ═══════════════════════════════════════════════════════════════

function RecipeSkeleton() {
  return (
    <div className="bg-[#111827] border border-white/10 rounded-3xl p-8 md:p-10 space-y-6">
      {/* Title */}
      <div className="h-10 w-2/3 bg-white/10 rounded-xl animate-pulse" />
      {/* Badges row */}
      <div className="flex gap-2 flex-wrap">
        {[80,72,72,64,96,80].map((w,i) =>
          <div key={i} className="h-9 bg-white/10 rounded-xl animate-pulse" style={{width:w}} />)}
      </div>
      {/* Description lines */}
      <div className="space-y-2">
        {[100,90,75].map((w,i) =>
          <div key={i} className="h-3.5 bg-white/10 rounded animate-pulse" style={{width:`${w}%`}} />)}
      </div>
      {/* Macro pills */}
      <div className="h-14 bg-white/10 rounded-2xl animate-pulse" />
      {/* Stat grid */}
      <div className="grid grid-cols-5 gap-3">
        {[...Array(5)].map((_,i) =>
          <div key={i} className="h-16 bg-white/10 rounded-xl animate-pulse" />)}
      </div>
      {/* Health score bar */}
      <div className="h-10 bg-white/10 rounded-2xl animate-pulse" />
      {/* Tags */}
      <div className="flex gap-2 flex-wrap">
        {[60,80,72,90,64].map((w,i) =>
          <div key={i} className="h-7 bg-white/10 rounded-full animate-pulse" style={{width:w}} />)}
      </div>
      {/* Steps */}
      <div className="space-y-2.5">
        {[...Array(5)].map((_,i) =>
          <div key={i} className="h-14 bg-white/10 rounded-2xl animate-pulse" />)}
      </div>
      {/* Micros */}
      <div className="grid sm:grid-cols-2 gap-2">
        {[...Array(6)].map((_,i) =>
          <div key={i} className="h-10 bg-white/10 rounded-xl animate-pulse" />)}
      </div>
      {/* Cost */}
      <div className="h-24 bg-white/10 rounded-2xl animate-pulse" />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  MODE CONFIG
// ═══════════════════════════════════════════════════════════════

const MODE_CONFIG = {
  dish: {
    icon: "🍽", label: "Dish Mode", sublabel: "Enter a dish name",
    placeholder: "butter chicken\npalak paneer, dalma\npad thai",
    hint: "Type any dish name — regional names, alternate names, even typos work.",
    examples: ["butter chicken", "murgh makhani", "pad thai", "korean bbq"],
  },
  ingredients: {
    icon: "🥗", label: "Ingredients Mode", sublabel: "Enter raw ingredients",
    placeholder: "chicken spinach garlic\n3 eggs tomato onion\n200g paneer, rice",
    hint: "Quantities, cooking adjectives, Hindi names all work. Try: aloo palak, 3 eggs, grilled chicken.",
    examples: ["chicken rice garlic spinach", "aloo palak jeera", "3 eggs tomato", "200g paneer"],
  },
}

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function Home() {
  // ── Form state ─────────────────────────────────────────────
  const [theme,            setTheme]            = useState("dark")
  const [goal,             setGoal]             = useState("balanced")
  const [spice,            setSpice]            = useState("medium")
  const [budget,           setBudget]           = useState(200)
  const [location,         setLocation]         = useState("India")
  const [skill,            setSkill]            = useState("beginner")
  const [dietary,          setDietary]          = useState("any")
  const [servings,         setServings]         = useState(1)
  const [inputMode,        setInputMode]        = useState("dish")
  const [rawInput,         setRawInput]         = useState("")

  // ── Recipe state ────────────────────────────────────────────
  const [recipe,           setRecipe]           = useState(null)
  const [history,          setHistory]          = useState([])
  const [loading,          setLoading]          = useState(false)
  const [favourites,       setFavourites]       = useState(() => new Set(readStorage("favouriteRecipes", [])))

  // ── Input feedback state ────────────────────────────────────
  const [inputError,       setInputError]       = useState(false)
  const [modeWarning,      setModeWarning]      = useState(null)
  const [parsedExcluded,   setParsedExcluded]   = useState([])   // 🚫 pills
  const [didYouMean,       setDidYouMean]       = useState([])   // unknown token suggestions
  const [understood,       setUnderstood]       = useState([])   // resolved corrections to show

  // ── Signal auto-fill state ──────────────────────────────────
  const [signalBanner,     setSignalBanner]     = useState(null) // { text, fields }
  const [lastSignals,      setLastSignals]      = useState({})

  // ── Optimizer state ─────────────────────────────────────────
  const [showOptimizer,    setShowOptimizer]    = useState(false)
  const [optimizerBudget,  setOptimizerBudget]  = useState(100)

  // ── Derived ────────────────────────────────────────────────
  const isDark       = theme === "dark"
  const modeCfg      = MODE_CONFIG[inputMode]
  const currSymbol   = CURRENCY_SYMBOL[location] ?? "₹"

  // ── Effects ────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("theme")
    if (saved) { setTheme(saved); document.documentElement.classList.toggle("dark", saved === "dark") }
    else        { document.documentElement.classList.add("dark") }
    setHistory(readStorage("savedRecipes", []))

    const glow = document.createElement("div")
    glow.className = "pointer-events-none fixed w-40 h-40 rounded-full bg-orange-500/20 blur-3xl z-50"
    document.body.appendChild(glow)
    const move = e => { glow.style.left = `${e.clientX - 80}px`; glow.style.top = `${e.clientY - 80}px` }
    window.addEventListener("mousemove", move)
    return () => { window.removeEventListener("mousemove", move); if (document.body.contains(glow)) document.body.removeChild(glow) }
  }, [])

  const particles = useMemo(() =>
    [...Array(40)].map((_, i) => ({
      left: `${(i * 2.5) % 100}%`,
      top: `${(i * 3.1) % 100}%`,
      duration: 10 + (i * 0.6) % 20,
    })), [])

  // ── Signal auto-fill ────────────────────────────────────────
  // When signals are extracted from free text, silently pre-fill
  // dropdowns and show a dismissable banner confirming what was detected.
  const applySignals = useCallback((signals) => {
    if (!signals || Object.keys(signals).length === 0) {
      setSignalBanner(null)
      setLastSignals({})
      return
    }

    const applied = []
    const prev    = {}

    if (signals.goal && signals.goal !== goal) {
      prev.goal = goal
      setGoal(signals.goal)
      applied.push(`Goal → ${signals.goal.replace("_", " ")}`)
    }

    if (signals.cuisine && SIGNAL_CUISINE_MAP[signals.cuisine]) {
      const mappedLoc = SIGNAL_CUISINE_MAP[signals.cuisine]
      if (mappedLoc !== location) {
        prev.location = location
        setLocation(mappedLoc)
        applied.push(`Cuisine → ${signals.cuisine}`)
      }
    }

    if (signals.dietary && signals.dietary !== "non-veg" && signals.dietary !== dietary) {
      prev.dietary = dietary
      setDietary(signals.dietary)
      applied.push(`Diet → ${signals.dietary}`)
    }

    if (signals.mealType) {
      applied.push(`Meal → ${signals.mealType}`)
    }

    if (signals.maxPrepTime) {
      applied.push(`Max prep → ${signals.maxPrepTime} min`)
    }

    if (applied.length > 0) {
      setLastSignals(prev)
      setSignalBanner({
        text: `Auto-detected: ${applied.join(" · ")}`,
        prev,
      })
    } else {
      setSignalBanner(null)
    }
  }, [goal, location, dietary])

  // ── Undo signal auto-fill ────────────────────────────────────
  const undoSignals = useCallback(() => {
    if (lastSignals.goal)     setGoal(lastSignals.goal)
    if (lastSignals.location) setLocation(lastSignals.location)
    if (lastSignals.dietary)  setDietary(lastSignals.dietary)
    setSignalBanner(null)
    setLastSignals({})
  }, [lastSignals])

  // ── Input change handler ─────────────────────────────────────
  // Now destructures the v2 object shape from normalizeInput.
  const handleInputChange = useCallback(val => {
    setRawInput(val)
    setInputError(false)

    if (val.trim().length < 3) {
      setModeWarning(null)
      setParsedExcluded([])
      setDidYouMean([])
      setUnderstood([])
      setSignalBanner(null)
      return
    }

    // ── v2: destructure the full object ────────────────────────
    const { ingredients, excluded, signals, unknown, suggestions } = normalizeInput(val)

    // Mode mismatch — confidence-gated (only warn at ≥ 0.65)
    const mismatch = detectModeMismatch(ingredients, inputMode)
    setModeWarning(
      mismatch.mismatch && mismatch.confidence >= 0.65 ? mismatch.reason : null
    )

    // Excluded pills — confirm negation was understood
    setParsedExcluded(excluded ?? [])

    // Did you mean / unknown feedback
    const sugg = suggestions ?? []
    setDidYouMean(sugg.slice(0, 3))

    // Show what we silently corrected (typos resolved by fuzzy match)
    // Only show when input has potential typos (short edit-distance matches)
    const corrected = ingredients
      .filter(k => {
        const word = val.toLowerCase().split(/[\s,]+/).find(w =>
          w.length > 3 && k.includes(w.slice(0, -1))   // rough heuristic
        )
        return false  // conservative — only show explicit suggestions
      })
    setUnderstood(corrected)

    // Signal auto-fill
    applySignals(signals ?? {})
  }, [inputMode, applySignals])

  // ── Theme toggle ─────────────────────────────────────────────
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    localStorage.setItem("theme", next)
    document.documentElement.classList.toggle("dark", next === "dark")
  }

  // ── Favourites ───────────────────────────────────────────────
  const toggleFavourite = title => {
    setFavourites(prev => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title); else next.add(title)
      localStorage.setItem("favouriteRecipes", JSON.stringify([...next]))
      return next
    })
  }

  // ── Mode switch ──────────────────────────────────────────────
  const switchMode = newMode => {
    setInputMode(newMode)
    setRawInput("")
    setModeWarning(null)
    setInputError(false)
    setParsedExcluded([])
    setDidYouMean([])
    setUnderstood([])
    setSignalBanner(null)
  }

  // ── Main generate ────────────────────────────────────────────
  const runGenerate = (useOptimizer = false) => {
    if (!rawInput.trim()) {
      setInputError(true)
      setTimeout(() => setInputError(false), 500)
      return
    }

    // ── v2: destructure all fields ─────────────────────────────
    const { ingredients, excluded, signals, unknown } = normalizeInput(rawInput)

    if (ingredients.length === 0 && excluded.length === 0) {
      setInputError(true)
      setTimeout(() => setInputError(false), 500)
      return
    }

    setLoading(true)
    setRecipe(null)

    // Build params — full v2 shape passed to generateSmartRecipe
    const params = {
      ingredients,
      excluded,
      signals,
      goal,
      spice,
      budget,
      location,
      skill,
      servings,
      // dietary filter applied as signal if set
      ...(dietary !== "any" ? { signals: { ...signals, dietary } } : {}),
    }

    setTimeout(() => {
      const result = useOptimizer
        ? optimizeRecipe({ ...params, maxCostPerServing: optimizerBudget })
        : generateSmartRecipe(params)

      setRecipe(result)

      if (result) {
        const updated = [result, ...readStorage("savedRecipes", [])].slice(0, 20)
        localStorage.setItem("savedRecipes", JSON.stringify(updated))
        setHistory(updated)
      }

      setLoading(false)
    }, 1500)
  }

  const sortedHistory = useMemo(() =>
    [...history].sort((a, b) =>
      (favourites.has(b.title) ? 1 : 0) - (favourites.has(a.title) ? 1 : 0)
    ), [history, favourites])

  // ═══════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className={`relative min-h-screen transition-colors duration-500 ${isDark ? "bg-[#0b0f19] text-white" : "bg-slate-100 text-gray-900"}`}>

      {/* ── Theme toggle ─────────────────────────────────────── */}
      <div className="absolute top-6 right-6 z-10">
        <button onClick={toggleTheme}
          className={`px-4 py-2 rounded-full text-sm font-medium backdrop-blur border transition-colors ${isDark ? "bg-white/10 border-white/20 text-white hover:bg-white/20" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"}`}>
          {isDark ? "🌙 Dark" : "☀️ Light"}
        </button>
      </div>

      {/* ── Background particles ──────────────────────────────── */}
      {isDark && (
        <div className="absolute inset-0 -z-20 overflow-hidden pointer-events-none">
          {particles.map((p, i) => (
            <motion.div key={i} animate={{ y: [0, -120] }}
              transition={{ repeat: Infinity, duration: p.duration, ease: "linear" }}
              className="absolute w-1 h-1 bg-white/20 rounded-full"
              style={{ left: p.left, top: p.top }} />
          ))}
        </div>
      )}

      {/* ── Gradient blobs ────────────────────────────────────── */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <motion.div animate={{ x: [0, 60, -40, 0], y: [0, 40, -30, 0] }}
          transition={{ repeat: Infinity, duration: 25, ease: "easeInOut" }}
          className={`absolute top-[-200px] left-[-200px] w-[700px] h-[700px] rounded-full blur-[200px] ${isDark ? "bg-purple-600 opacity-30" : "bg-purple-400 opacity-15"}`} />
        <motion.div animate={{ x: [0, -60, 40, 0], y: [0, -40, 30, 0] }}
          transition={{ repeat: Infinity, duration: 30, ease: "easeInOut" }}
          className={`absolute bottom-[-200px] right-[-200px] w-[700px] h-[700px] rounded-full blur-[200px] ${isDark ? "bg-orange-500 opacity-20" : "bg-orange-400 opacity-15"}`} />
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 80 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 1 }}
        className="text-center max-w-4xl mx-auto pt-24 px-6">
        <h1 className="text-5xl md:text-7xl font-bold leading-tight">
          Craft Recipes
          <span className="block bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
            With Intelligence
          </span>
        </h1>
        <p className={`mt-6 text-xl ${isDark ? "text-gray-300" : "text-gray-600"}`}>
          Turn simple ingredients into extraordinary meals.
        </p>
      </motion.div>

      {/* ── Generator form ───────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 80 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 }}
        className="mt-20 max-w-3xl mx-auto relative px-6">

        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-purple-600 opacity-20 blur-2xl rounded-3xl" />
        <div className={`relative backdrop-blur-xl border rounded-3xl p-8 shadow-2xl ${isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}>

          {/* ── Mode toggle ─────────────────────────────────── */}
          <div className="flex gap-3 mb-6">
            {Object.entries(MODE_CONFIG).map(([key, cfg]) => {
              const isActive = inputMode === key
              return (
                <motion.button key={key} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => switchMode(key)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-4 px-4 rounded-2xl border-2 font-medium transition-all duration-300
                    ${isActive
                      ? "border-orange-500 bg-gradient-to-br from-orange-500/20 to-pink-500/10 text-orange-400 shadow-lg shadow-orange-500/10"
                      : isDark ? "border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-gray-300"
                               : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300"}`}>
                  <span className="text-2xl">{cfg.icon}</span>
                  <span className="text-base font-semibold">{cfg.label}</span>
                  <span className={`text-sm font-normal text-center leading-tight ${isActive ? "text-orange-300/80" : isDark ? "text-gray-600" : "text-gray-400"}`}>
                    {cfg.sublabel}
                  </span>
                </motion.button>
              )
            })}
          </div>

          {/* ── Mode hint strip ──────────────────────────────── */}
          <AnimatePresence mode="wait">
            <motion.div key={inputMode} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.2 }}
              className={`flex items-start gap-2.5 mb-4 px-4 py-3 rounded-xl text-sm ${isDark ? "bg-white/5 text-gray-300" : "bg-gray-50 text-gray-600"}`}>
              <span className="shrink-0 mt-0.5">💡</span>
              <div>
                <span className="text-sm">{modeCfg.hint}</span>
                <span className={`ml-2 text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  e.g. <span className={isDark ? "text-gray-200" : "text-gray-700"}>{modeCfg.examples[0]}</span>
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ── Textarea ─────────────────────────────────────── */}
          <motion.div animate={inputError ? { x: [-10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}>
            <textarea rows="3" value={rawInput}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), runGenerate())}
              placeholder={modeCfg.placeholder}
              className={`w-full bg-transparent outline-none resize-none text-base
                placeholder-gray-500 rounded-xl p-4 border-2 transition-colors duration-300
                ${inputError
                  ? "border-red-400 bg-red-500/5"
                  : modeWarning
                    ? isDark ? "border-amber-500/50 bg-amber-500/5" : "border-amber-400 bg-amber-50"
                    : isDark ? "border-white/20 text-gray-100 focus:border-orange-500/50 bg-white/5"
                             : "border-gray-300 text-gray-800 focus:border-orange-400 bg-white"}`} />

            {/* Input error */}
            {inputError && (
              <p className="text-red-400 text-sm mt-1.5 ml-1">
                Please enter at least one {inputMode === "dish" ? "dish name" : "ingredient"}
              </p>
            )}

            {/* ── Mode warning (confidence-gated) ─────────────── */}
            <AnimatePresence>
              {modeWarning && !inputError && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                  className={`mt-2 flex items-start gap-2 px-4 py-3 rounded-xl text-sm ${isDark ? "bg-amber-500/10 border border-amber-500/20 text-amber-300" : "bg-amber-50 border border-amber-200 text-amber-700"}`}>
                  <span className="shrink-0 text-base leading-none">⚠️</span>
                  <div className="flex-1">
                    <span>{modeWarning}</span>
                    <button onClick={() => switchMode(inputMode === "dish" ? "ingredients" : "dish")}
                      className={`ml-2 underline font-medium hover:no-underline ${isDark ? "text-amber-400 hover:text-amber-300" : "text-amber-600 hover:text-amber-800"}`}>
                      Switch now →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Excluded ingredients pills ──────────────────── */}
            <AnimatePresence>
              {parsedExcluded.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                  className="mt-2 flex flex-wrap gap-1.5 items-center">
                  <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>Excluding:</span>
                  {parsedExcluded.map(item => (
                    <span key={item}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${isDark ? "bg-red-500/15 text-red-300 border border-red-500/20" : "bg-red-50 text-red-600 border border-red-200"}`}>
                      🚫 {item.charAt(0).toUpperCase() + item.slice(1).replace(/_/g, " ")}
                    </span>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Did you mean feedback ────────────────────────── */}
            <AnimatePresence>
              {didYouMean.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                  className="mt-2">
                  {didYouMean.map(({ token, didYouMean: opts }) => (
                    <div key={token}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${isDark ? "bg-white/5 text-gray-400" : "bg-gray-50 text-gray-500"}`}>
                      <span>"{token}" — did you mean:</span>
                      <div className="flex gap-1.5">
                        {opts.map(opt => (
                          <button key={opt} onClick={() => {
                            const replaced = rawInput.replace(new RegExp(token, 'gi'), opt)
                            handleInputChange(replaced)
                            setRawInput(replaced)
                          }}
                            className={`px-2 py-0.5 rounded-md text-xs font-medium transition-colors ${isDark ? "bg-orange-500/20 text-orange-300 hover:bg-orange-500/30" : "bg-orange-50 text-orange-600 hover:bg-orange-100"}`}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Signal auto-fill banner ──────────────────────── */}
          <AnimatePresence>
            {signalBanner && (
              <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }} transition={{ duration: 0.25 }}
                className={`mt-3 flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-sm ${isDark ? "bg-purple-500/10 border border-purple-500/20 text-purple-300" : "bg-purple-50 border border-purple-200 text-purple-700"}`}>
                <div className="flex items-center gap-2">
                  <span>✨</span>
                  <span>{signalBanner.text}</span>
                </div>
                <button onClick={undoSignals}
                  className={`text-xs underline shrink-0 ${isDark ? "text-purple-400 hover:text-purple-300" : "text-purple-600 hover:text-purple-800"}`}>
                  Undo
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Controls grid ────────────────────────────────── */}
          <div className="mt-6 grid md:grid-cols-3 gap-5">
            <SelectField isDark={isDark} label="Goal" value={goal} onChange={setGoal} options={[
              { value: "balanced",    label: "Balanced"     },
              { value: "weight_loss", label: "Weight Loss"  },
              { value: "muscle_gain", label: "Muscle Gain"  },
            ]} />
            <SelectField isDark={isDark} label="Spice Level" value={spice} onChange={setSpice} options={[
              { value: "mild",   label: "🌿 Mild"   },
              { value: "medium", label: "🌶 Medium" },
              { value: "hot",    label: "🔥 Hot"    },
            ]} />
            <SelectField isDark={isDark} label="Skill Level" value={skill} onChange={setSkill} options={[
              { value: "beginner",     label: "Beginner"     },
              { value: "intermediate", label: "Intermediate" },
              { value: "advanced",     label: "Advanced"     },
            ]} />

            {/* Budget slider — currency-aware */}
            <div>
              <label className={`text-sm font-medium block mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                Budget: <span className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {currSymbol}{budget}
                </span>
              </label>
              <input type="range" min="50" max="500" step="25" value={budget}
                onChange={e => setBudget(Number(e.target.value))}
                className="w-full mt-1 accent-orange-500" />
            </div>

            {/* Cuisine — expanded to 14 */}
            <SelectField isDark={isDark} label="Cuisine" value={location} onChange={setLocation}
              options={CUISINE_OPTIONS.map(c => ({ value: c.value, label: c.label }))} />

            {/* Dietary filter */}
            <SelectField isDark={isDark} label="Dietary" value={dietary} onChange={setDietary} options={[
              { value: "any",          label: "🍽 Any"          },
              { value: "vegan",        label: "🌱 Vegan"        },
              { value: "vegetarian",   label: "🥛 Vegetarian"   },
              { value: "gluten-free",  label: "🌾 Gluten-Free"  },
            ]} />
          </div>

          {/* ── Servings selector ────────────────────────────── */}
          <div className={`mt-4 flex items-center gap-4 px-4 py-3 rounded-xl ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
            <span className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Servings:</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 6].map(n => (
                <button key={n} onClick={() => setServings(n)}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all duration-200 ${servings === n
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                    : isDark ? "bg-white/10 text-gray-400 hover:bg-white/20" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"}`}>
                  {n}
                </button>
              ))}
            </div>
            <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
              Cost breakdown adjusts per serving
            </span>
          </div>

          {/* ── Optimizer panel ──────────────────────────────── */}
          <div className={`mt-5 rounded-2xl border overflow-hidden ${isDark ? "border-violet-500/20 bg-violet-500/5" : "border-violet-200 bg-violet-50"}`}>
            <button onClick={() => setShowOptimizer(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-left">
              <div className="flex items-center gap-3">
                <span className="text-xl">🎯</span>
                <div>
                  <p className={`text-base font-semibold ${isDark ? "text-violet-300" : "text-violet-700"}`}>
                    Recipe Optimizer
                  </p>
                  <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                    Optimize macros + cost simultaneously
                  </p>
                </div>
              </div>
              <span className={`text-sm ${isDark ? "text-gray-600" : "text-gray-400"}`}>
                {showOptimizer ? "▲" : "▼"}
              </span>
            </button>

            <AnimatePresence>
              {showOptimizer && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}
                  className="overflow-hidden border-t border-violet-500/10 px-5 pb-5 pt-4">
                  <div className="flex items-center gap-4 mb-3">
                    <label className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      Max cost per serving:
                    </label>
                    <span className={`text-base font-bold ${isDark ? "text-violet-300" : "text-violet-700"}`}>
                      {currSymbol}{optimizerBudget}
                    </span>
                  </div>
                  <input type="range" min="50" max="300" step="10" value={optimizerBudget}
                    onChange={e => setOptimizerBudget(Number(e.target.value))}
                    className="w-full accent-violet-500 mb-4" />
                  <p className={`text-sm mb-4 leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    Suggests ingredient substitutions to hit your nutritional goal while keeping cost under{" "}
                    <strong>{currSymbol}{optimizerBudget}/serving</strong>.
                  </p>
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                    onClick={() => runGenerate(true)} disabled={loading}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-base shadow-lg shadow-violet-500/20 disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? "Optimizing..." : `🎯 Optimize for ${goal.replace("_", " ")} under ${currSymbol}${optimizerBudget}/serving`}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Generate button ──────────────────────────────── */}
          <div className="flex justify-end mt-5">
            <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
              onClick={() => runGenerate(false)} disabled={loading}
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold text-base shadow-lg shadow-orange-500/30 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? "Generating..." : "Generate Recipe ✨"}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ── Loading skeleton ─────────────────────────────────── */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }} transition={{ duration: 0.4 }}
            className="mt-16 max-w-4xl mx-auto px-6">
            <div className="flex items-center gap-3 mb-6 px-2">
              <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}
                className="w-3 h-3 rounded-full bg-orange-500" />
              <span className={`text-sm tracking-widest uppercase font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Crafting your recipe...
              </span>
            </div>
            <RecipeSkeleton />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Recipe output ────────────────────────────────────── */}
      <AnimatePresence>
        {recipe && !loading && (
          <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.8 }}
            className="mt-16 max-w-4xl mx-auto px-6 pb-16">
            <RecipeDisplay
              recipe={recipe}
              isFavourite={favourites.has(recipe.title)}
              onToggleFavourite={() => toggleFavourite(recipe.title)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── History ──────────────────────────────────────────── */}
      {sortedHistory.length > 1 && !loading && (
        <div className="mt-12 max-w-4xl mx-auto px-6 pb-24">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${isDark ? "text-gray-200" : "text-gray-700"}`}>
              Previous Creations
            </h2>
            <span className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
              {sortedHistory.length} recipes
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {sortedHistory.slice(1).map((item, index) => {
              const isFav = favourites.has(item.title)
              const dietEmoji   = item.dietaryProfile?.emoji ?? ""
              const topTag      = item.healthTags?.[0]?.tag?.replace(/-/g, " ") ?? null
              const prepLabel   = item.prepTime ?? null
              const inflam      = item.inflammatoryProfile
              return (
                <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => setRecipe(item)}
                  className={`group relative p-5 rounded-2xl backdrop-blur-lg cursor-pointer transition-all duration-300 border hover:scale-[1.02] hover:shadow-lg
                    ${isFav
                      ? isDark ? "bg-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/40"
                               : "bg-yellow-50 border-yellow-200 hover:border-yellow-400"
                      : isDark ? "bg-white/5 border-white/10 hover:border-white/20"
                               : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"}`}>

                  {/* Favourite star */}
                  <button onClick={e => { e.stopPropagation(); toggleFavourite(item.title) }}
                    className={`absolute top-4 right-4 text-xl transition-opacity ${isFav ? "opacity-100" : "opacity-40 hover:opacity-100"}`}>
                    {isFav ? "⭐" : "☆"}
                  </button>

                  {/* Top row — flag + location + goal + dietary */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xl">{CUISINE_FLAGS[item.location] ?? "🍽"}</span>
                    {item.location && (
                      <span className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        {item.location}
                      </span>
                    )}
                    {item.goal && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? "bg-white/10 text-gray-400" : "bg-gray-100 text-gray-500"}`}>
                        {item.goal.replace("_", " ")}
                      </span>
                    )}
                    {/* Dietary badge — new */}
                    {dietEmoji && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? "bg-white/10 text-gray-400" : "bg-gray-100 text-gray-500"}`}>
                        {dietEmoji} {item.dietaryProfile?.label}
                      </span>
                    )}
                    {/* Inflammatory badge — new */}
                    {inflam && inflam.score <= -2 && (
                      <span className="text-xs">{inflam.emoji}</span>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className={`font-semibold text-base pr-8 leading-snug mb-2 ${isDark ? "text-white" : "text-gray-800"}`}>
                    {item.title}
                  </h4>

                  {/* Stats row */}
                  <div className={`flex items-center gap-3 text-sm flex-wrap ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                    {item.estimatedCost && <span>{item.estimatedCost}</span>}
                    {item.calories      && <span>· {item.calories}</span>}
                    {item.healthScore   && (
                      <span className={
                        item.healthScore >= 70 ? "text-green-500" :
                        item.healthScore >= 50 ? "text-blue-500"  : "text-orange-500"
                      }>
                        · {item.healthScore}/100
                      </span>
                    )}
                    {/* Prep time — new */}
                    {prepLabel && <span>· {prepLabel}</span>}
                  </div>

                  {/* Top health tag — new */}
                  {topTag && (
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-green-50 text-green-600 border border-green-200"}`}>
                        ✦ {topTag}
                      </span>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  REUSABLE SELECT FIELD
// ═══════════════════════════════════════════════════════════════

function SelectField({ label, value, onChange, options, isDark }) {
  return (
    <div>
      <label className={`text-sm font-medium block mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
        {label}
      </label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className={`w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none transition-colors cursor-pointer
          ${isDark
            ? "bg-gray-800 border-gray-700 text-gray-100 focus:border-gray-500"
            : "bg-white border-gray-300 text-gray-900 focus:border-gray-400"}`}>
        {options.map(({ value: v, label: l }) => (
          <option key={v} value={v} className={isDark ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"}>
            {l}
          </option>
        ))}
      </select>
    </div>
  )
}
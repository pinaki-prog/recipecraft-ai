import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import RecipeDisplay, { RecipeErrorBoundary } from "../components/RecipeDisplay"
import { generateSmartRecipe, optimizeRecipe } from "../utils/generateSmartRecipe"
import { normalizeInput, detectModeMismatch } from "../utils/normalizeInput"
import MealPlanner from "../components/MealPlanner"
import UserProfile, { calcTDEE } from "../components/UserProfile"

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


// ═══════════════════════════════════════════════════════════════
//  DAILY NUTRITION TRACKER
//  Floating panel — logs today's recipes. Resets at midnight.
// ═══════════════════════════════════════════════════════════════

const DEFAULT_DAILY_GOALS = { cal: 2000, p: 60, c: 250, f: 65 }

function getGoals(profile) {
  const stats = calcTDEE(profile)
  if (!stats?.macros) return DEFAULT_DAILY_GOALS
  return { cal: stats.macros.cal, p: stats.macros.protein, c: stats.macros.carbs, f: stats.macros.fats }
}

const DAILY_GOALS = { cal: 2000, p: 60, c: 250, f: 65 }

function parseNum(v) { return parseFloat(String(v ?? "0").replace(/[^0-9.]/g, "")) || 0 }

function DailyTracker({ log, onAdd, onRemove, onClose, currentRecipe, goals, weeklyTrend }) {
  const [showWeek, setShowWeek] = useState(false)
  const G = goals ?? DAILY_GOALS
  const totals = log.reduce((acc, e) => ({
    cal: acc.cal + (e.cal || 0),
    p:   acc.p   + (e.p   || 0),
    c:   acc.c   + (e.c   || 0),
    f:   acc.f   + (e.f   || 0),
  }), { cal: 0, p: 0, c: 0, f: 0 })

  const pct = (val, goal) => Math.min(100, Math.round((val / Math.max(goal,1)) * 100))

  const BARS = [
    { label: "Cal",     val: Math.round(totals.cal), goal: G.cal, unit: "kcal", color: "bg-orange-500" },
    { label: "Protein", val: Math.round(totals.p),   goal: G.p,   unit: "g",    color: "bg-blue-500"   },
    { label: "Carbs",   val: Math.round(totals.c),   goal: G.c,   unit: "g",    color: "bg-purple-500" },
    { label: "Fats",    val: Math.round(totals.f),   goal: G.f,   unit: "g",    color: "bg-pink-500"   },
  ]

  // Build 7-day chart data from weeklyTrend
  const today = new Date()
  const weekDays = Array.from({length:7},(_,i)=>{
    const d = new Date(today); d.setDate(today.getDate()-6+i)
    const key = d.toDateString()
    const isToday = i===6
    return {
      label: isToday ? "Today" : d.toLocaleDateString("en",{weekday:"short"}),
      cal: isToday ? Math.round(totals.cal) : Math.round(weeklyTrend?.[key]?.cal ?? 0),
      key,
    }
  })
  const maxCal = Math.max(...weekDays.map(d=>d.cal), G.cal)

  return (
    <div className="w-80 bg-[#0f1623] border border-white/15 rounded-2xl shadow-2xl p-5 mb-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-base font-bold text-white">🥗 Today's Log</p>
          <p className="text-xs text-gray-500">{log.length} meal{log.length !== 1 ? "s" : ""} logged</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowWeek(w=>!w)}
            className={`text-xs px-2 py-1 rounded-lg transition-colors ${showWeek ? "bg-orange-500/20 text-orange-400" : "text-gray-600 hover:text-gray-400"}`}
            title="Weekly trend">📈</button>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400 text-lg transition-colors">✕</button>
        </div>
      </div>

      {/* Weekly trend chart */}
      {showWeek && (
        <div className="mb-4 bg-white/3 rounded-xl p-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">7-Day Calories vs Target ({G.cal} kcal)</p>
          <div className="flex items-end gap-1 h-16">
            {weekDays.map(({label, cal}, i) => {
              const heightPct = maxCal > 0 ? (cal / maxCal) * 100 : 0
              const over = cal > G.cal
              const isToday = i===6
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex items-end justify-center" style={{height:"48px"}}>
                    <div
                      className={`w-full rounded-t transition-all duration-500 ${
                        cal === 0 ? "bg-white/5"
                        : over ? "bg-red-500/60"
                        : isToday ? "bg-orange-500"
                        : "bg-orange-500/40"}`}
                      style={{height: cal === 0 ? "3px" : `${Math.max(4, heightPct)}%`}}
                      title={`${label}: ${cal} kcal`}
                    />
                  </div>
                  <span className={`text-[9px] ${isToday ? "text-orange-400 font-bold" : "text-gray-700"}`}>
                    {label.slice(0,3)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Progress bars */}
      <div className="space-y-2.5 mb-4">
        {BARS.map(({ label, val, goal, unit, color }) => (
          <div key={label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">{label}</span>
              <span className={`tabular-nums ${val > goal ? "text-red-400 font-semibold" : "text-gray-400"}`}>
                {val} / {goal} {unit}
              </span>
            </div>
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
              <div className={`h-full ${val > goal ? "bg-red-500" : color} rounded-full transition-all duration-500`}
                style={{ width: `${pct(val, goal)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Add current recipe ────────────────────────────── */}
      {currentRecipe && (
        <button
          onClick={() => onAdd({
            id:    currentRecipe.id ?? Date.now().toString(36),
            title: currentRecipe.title,
            cal:   parseNum(currentRecipe.calories),
            p:     parseNum(currentRecipe.protein),
            c:     parseNum(currentRecipe.carbs),
            f:     parseNum(currentRecipe.fats),
          })}
          className="w-full py-2.5 mb-3 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-sm font-semibold hover:bg-green-500/25 transition-all">
          + Add "{currentRecipe.title?.slice(0, 20)}{currentRecipe.title?.length > 20 ? "…" : ""}"
        </button>
      )}

      {/* ── Logged meals list ─────────────────────────────── */}
      {log.length === 0
        ? <p className="text-xs text-gray-600 text-center py-2">No meals logged yet today</p>
        : (
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {log.map(entry => (
              <div key={entry.id} className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-xl">
                <div>
                  <p className="text-xs text-gray-300 font-medium">{entry.title?.slice(0, 22)}</p>
                  <p className="text-xs text-gray-600">{Math.round(entry.cal)} kcal · {Math.round(entry.p)}g P</p>
                </div>
                <button onClick={() => onRemove(entry.id)}
                  className="text-gray-700 hover:text-red-400 text-xs transition-colors ml-2">✕</button>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}

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
  const [genError,         setGenError]         = useState(null)
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
  const [recentIngredients,setRecentIngredients]= useState(() => readStorage("recentIngredients", []))
  const [historySearch,    setHistorySearch]    = useState("")
  const [voiceListening,   setVoiceListening]   = useState(false)
  const [dailyLog,         setDailyLog]         = useState(() => readStorage("dailyLog", []))
  const [showTracker,      setShowTracker]      = useState(false)
  const [showPlanner,      setShowPlanner]      = useState(false)
  const [showProfile,      setShowProfile]      = useState(false)
  const [userProfile,      setUserProfile]      = useState(() => readStorage("userProfile", null))
  const [weeklyTrend,      setWeeklyTrend]      = useState(() => readStorage("weeklyTrend", {}))
  const [recipeRatings,    setRecipeRatings]    = useState(() => readStorage("recipeRatings", {}))
  const [remixRecipe,      setRemixRecipe]      = useState(null)  // recipe being remixed

  // ── Derived ────────────────────────────────────────────────
  const isDark       = theme === "dark"
  const modeCfg      = MODE_CONFIG[inputMode]
  const currSymbol   = CURRENCY_SYMBOL[location] ?? "₹"
  const profileGoals = getGoals(userProfile)   // TDEE-based or default

  // ── Effects ────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("theme")
    if (saved) { setTheme(saved); document.documentElement.classList.toggle("dark", saved === "dark") }
    else        { document.documentElement.classList.add("dark") }
    setHistory(readStorage("savedRecipes", []))
    setRecentIngredients(readStorage("recentIngredients", []))
    // Reset daily log at midnight
    const savedLog  = readStorage("dailyLog",     [])
    const savedDate = readStorage("dailyLogDate", null)
    const today     = new Date().toDateString()
    if (savedDate === today) {
      setDailyLog(savedLog)
    } else {
      localStorage.setItem("dailyLog",     JSON.stringify([]))
      localStorage.setItem("dailyLogDate", JSON.stringify(today))
      setDailyLog([])
    }

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

  const rateRecipe = (recipeId, stars) => {
    const next = { ...recipeRatings, [recipeId]: stars }
    setRecipeRatings(next)
    localStorage.setItem("recipeRatings", JSON.stringify(next))
  }

  // Remix effect — when remixRecipe is set, re-run generate with tweaked params
  useEffect(() => {
    if (!remixRecipe) return
    const { recipe: src, opts } = remixRecipe
    setRemixRecipe(null)
    const ingredients = src.ingredients?.map(i => i.item) ?? []
    if (!ingredients.length) return
    const remixParams = {
      ingredients,
      excluded:  src.excluded ?? [],
      signals:   {},
      goal:      opts.goal      ?? goal,
      spice,
      budget:    opts.budget    ?? budget,
      location,
      skill,
      servings,
      quantities: {},
      ...(opts.dietary ? { signals: { dietary: opts.dietary } } : {}),
    }
    setLoading(true)
    setGenError(null)
    setTimeout(() => {
      try {
        const result = generateSmartRecipe(remixParams)
        if (result?.error) {
          setGenError(result.errorMessage ?? "Remix failed. Try again.")
        } else if (result) {
          setRecipe(result)
          const updated = [result, ...readStorage("savedRecipes", [])].slice(0, 20)
          localStorage.setItem("savedRecipes", JSON.stringify(updated))
          setHistory(updated)
        }
      } catch { setGenError("Remix failed.") }
      finally { setLoading(false) }
    }, 50)
  }, [remixRecipe])

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

  // ── Voice input ──────────────────────────────────────────────
  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert("Voice input is not supported in this browser. Try Chrome."); return }
    const rec = new SR()
    rec.lang = "en-IN"
    rec.interimResults = false
    rec.maxAlternatives = 1
    setVoiceListening(true)
    rec.start()
    rec.onresult = e => {
      const transcript = e.results[0][0].transcript
      setRawInput(prev => prev ? prev + ", " + transcript : transcript)
      setVoiceListening(false)
    }
    rec.onerror = () => setVoiceListening(false)
    rec.onend   = () => setVoiceListening(false)
  }

  // ── Main generate ────────────────────────────────────────────
  const runGenerate = (useOptimizer = false) => {
    if (!rawInput.trim()) {
      setInputError(true)
      setTimeout(() => setInputError(false), 500)
      return
    }

    // ── v2: destructure all fields ─────────────────────────────
    const { ingredients, excluded, signals, unknown, quantities = {} } = normalizeInput(rawInput)

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
      quantities,  // user-specified amounts from parseRawQuantities
      // dietary filter applied as signal if set
      ...(dietary !== "any" ? { signals: { ...signals, dietary } } : {}),
    }

    setGenError(null)
    setTimeout(() => {
      try {
        const result = useOptimizer
          ? optimizeRecipe({ ...params, maxCostPerServing: optimizerBudget })
          : generateSmartRecipe(params)

        if (result?.error) {
          setGenError(result.errorMessage ?? "Something went wrong. Please try different ingredients.")
          setRecipe(null)
        } else {
          setRecipe(result)
          if (result) {
            const updated = [result, ...readStorage("savedRecipes", [])].slice(0, 20)
            localStorage.setItem("savedRecipes", JSON.stringify(updated))
            setHistory(updated)
            // Save recent ingredients
            if (result.ingredients?.length > 0) {
              const merged = [...new Set([...result.ingredients.map(i=>i.item), ...readStorage("recentIngredients",[])])].slice(0,15)
              localStorage.setItem("recentIngredients", JSON.stringify(merged))
              setRecentIngredients(merged)
            }
          }
        }
      } catch (err) {
        setGenError("Unexpected error: " + (err?.message ?? "Please try again."))
        setRecipe(null)
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

      {/* ── UserProfile overlay ───────────────────────────────── */}
      <AnimatePresence>
        {showProfile && (
          <UserProfile
            onClose={() => setShowProfile(false)}
            onSave={(profile) => {
              setUserProfile(profile)
              setShowProfile(false)
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Meal Planner overlay ─────────────────────────────── */}
      <AnimatePresence>
        {showPlanner && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}>
            <MealPlanner onClose={() => setShowPlanner(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Daily tracker FAB ──────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        {showTracker && (
          <DailyTracker
            log={dailyLog}
            goals={profileGoals}
            weeklyTrend={weeklyTrend}
            onAdd={entry => {
              const next = [...dailyLog, entry]
              setDailyLog(next)
              localStorage.setItem("dailyLog", JSON.stringify(next))
              localStorage.setItem("dailyLogDate", JSON.stringify(new Date().toDateString()))
              // Save today's totals to weekly trend
              const todayKey  = new Date().toDateString()
              const dayTotals = next.reduce((a,e)=>({cal:a.cal+(e.cal||0),p:a.p+(e.p||0),c:a.c+(e.c||0),f:a.f+(e.f||0)}),{cal:0,p:0,c:0,f:0})
              const updTrend  = { ...weeklyTrend, [todayKey]: dayTotals }
              setWeeklyTrend(updTrend)
              localStorage.setItem("weeklyTrend", JSON.stringify(updTrend))
            }}
            onRemove={id => {
              const next = dailyLog.filter(e => e.id !== id)
              setDailyLog(next)
              localStorage.setItem("dailyLog", JSON.stringify(next))
              const todayKey  = new Date().toDateString()
              const dayTotals = next.reduce((a,e)=>({cal:a.cal+(e.cal||0),p:a.p+(e.p||0),c:a.c+(e.c||0),f:a.f+(e.f||0)}),{cal:0,p:0,c:0,f:0})
              const updTrend  = { ...weeklyTrend, [todayKey]: dayTotals }
              setWeeklyTrend(updTrend)
              localStorage.setItem("weeklyTrend", JSON.stringify(updTrend))
            }}
            onClose={() => setShowTracker(false)}
            currentRecipe={recipe}
          />
        )}
        <button onClick={() => setShowTracker(t => !t)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 flex items-center justify-center text-xl hover:scale-105 transition-transform"
          title="Daily nutrition tracker">
          {showTracker ? "✕" : "🥗"}
        </button>
        <button onClick={() => setShowPlanner(p => !p)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center text-xl hover:scale-105 transition-transform"
          title="7-day meal planner">
          📅
        </button>
        <button onClick={() => setShowProfile(p => !p)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/30 flex items-center justify-center text-xl hover:scale-105 transition-transform"
          title="Your profile & TDEE">
          {userProfile?.name ? userProfile.name.slice(0,1).toUpperCase() : "👤"}
        </button>
      </div>

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

        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-purple-600 opacity-15 blur-2xl rounded-3xl" />
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

          {/* ── Recent Ingredients chips ─────────────────── */}
          {recentIngredients.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {recentIngredients.slice(0, 8).map(item => (
                <button key={item}
                  onClick={() => setRawInput(prev => prev ? prev + ", " + item.replace(/_/g," ") : item.replace(/_/g," "))}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all
                    ${isDark
                      ? "bg-white/5 border-white/10 text-gray-400 hover:bg-orange-500/15 hover:border-orange-500/30 hover:text-orange-300"
                      : "bg-gray-100 border-gray-200 text-gray-500 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600"}`}>
                  {item.replace(/_/g," ")}
                </button>
              ))}
              <button onClick={() => { localStorage.removeItem("recentIngredients"); setRecentIngredients([]) }}
                className="px-3 py-1 rounded-full text-xs border border-dashed border-white/10 text-gray-600 hover:text-gray-400 transition-colors">
                ✕ clear
              </button>
            </div>
          )}

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

            {/* ── Voice input button ────────────────────────── */}
            <div className="flex items-center gap-2 mt-2">
              <button onClick={startVoice} disabled={voiceListening}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium border transition-all
                  ${voiceListening
                    ? "bg-red-500/20 border-red-500/40 text-red-400 animate-pulse"
                    : isDark
                      ? "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                      : "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200"}`}>
                {voiceListening ? "🔴 Listening…" : "🎙 Voice"}
              </button>
              {voiceListening && (
                <span className="text-xs text-gray-500 animate-pulse">Speak ingredient names clearly…</span>
              )}
            </div>

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

      {/* ── Error card ──────────────────────────────────────── */}
      {genError && !loading && (
        <div className="mt-8 max-w-4xl mx-auto px-6">
          <div className="p-5 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-start gap-4">
            <span className="text-2xl shrink-0">⚠️</span>
            <div>
              <p className="text-base font-semibold text-red-400 mb-1">Could not generate recipe</p>
              <p className="text-sm text-gray-400 leading-relaxed">{genError}</p>
              <p className="text-xs text-gray-600 mt-2">Try fewer ingredients, remove unusual combinations, or switch input mode.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Recipe output ────────────────────────────────────── */}
      <AnimatePresence>
        {recipe && !loading && (
          <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.8 }}
            className="mt-16 max-w-4xl mx-auto px-6 pb-16">
            <RecipeErrorBoundary>
              <RecipeDisplay
                recipe={recipe}
                isFavourite={favourites.has(recipe.title)}
                onToggleFavourite={() => toggleFavourite(recipe.title)}
                userProfile={userProfile}
                onRemix={(opts) => setRemixRecipe({ recipe, opts })}
              />
            </RecipeErrorBoundary>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── History ──────────────────────────────────────────── */}
      {sortedHistory.length > 1 && !loading && (
        <div className="mt-12 max-w-4xl mx-auto px-6 pb-24">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-2xl font-bold ${isDark ? "text-gray-100" : "text-gray-700"}`}>
              Previous Creations
            </h2>
            <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {sortedHistory.length} recipes
            </span>
          </div>
          {sortedHistory.length > 3 && (
            <div className="mb-5">
              <input type="text" value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                placeholder="Search recipes…"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors
                  ${isDark
                    ? "bg-white/5 border-white/10 text-gray-200 placeholder-gray-600 focus:border-orange-500/40"
                    : "bg-white border-gray-200 text-gray-700 placeholder-gray-400 focus:border-orange-400"}`}
              />
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {sortedHistory.slice(1)
              .filter(item => !historySearch.trim() || item.title?.toLowerCase().includes(historySearch.toLowerCase()))
              .map((item, index) => {
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

                  {/* Star rating */}
                  <div className="absolute bottom-4 right-4 flex gap-0.5" onClick={e => e.stopPropagation()}>
                    {[1,2,3,4,5].map(star => {
                      const rated = recipeRatings[item.id] ?? 0
                      return (
                        <button key={star}
                          onClick={() => rateRecipe(item.id, star === rated ? 0 : star)}
                          className={`text-base transition-all hover:scale-110 ${star <= rated ? "opacity-100" : "opacity-20 hover:opacity-60"}`}>
                          ★
                        </button>
                      )
                    })}
                  </div>

                  {/* Top row — flag + location + goal + dietary */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xl">{CUISINE_FLAGS[item.location] ?? "🍽"}</span>
                    {item.location && (
                      <span className={`text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                        {item.location}
                      </span>
                    )}
                    {item.goal && (
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${isDark ? "bg-white/10 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
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
                  <h4 className={`font-bold text-lg pr-8 leading-snug mb-2 ${isDark ? "text-white" : "text-gray-800"}`}>
                    {item.title}
                  </h4>

                  {/* Stats row */}
                  <div className={`flex items-center gap-3 text-sm font-semibold flex-wrap ${isDark ? "text-gray-400" : "text-gray-500"}`}>
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
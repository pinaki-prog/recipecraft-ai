import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import RecipeDisplay from "../components/RecipeDisplay"
import { generateSmartRecipe } from "../utils/generateSmartRecipe"

const CUISINE_FLAGS = {
  India: "🇮🇳", Italy: "🇮🇹", Mexico: "🇲🇽", USA: "🇺🇸",
  China: "🇨🇳", Japan: "🇯🇵", Thailand: "🇹🇭",
}

function readStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback }
  catch { return fallback }
}

// ─── Skeleton loader ───────────────────────────────────────────
function RecipeSkeleton() {
  return (
    <div className="bg-[#111827] border border-white/10 rounded-3xl p-8 md:p-10 space-y-6">
      <div className="h-10 w-2/3 bg-white/10 rounded-xl animate-pulse" />
      <div className="h-6  w-36 bg-white/10 rounded-full animate-pulse" />
      <div className="flex gap-2">
        {[80, 72, 72, 64, 96].map((w, i) => (
          <div key={i} className="h-9 bg-white/10 rounded-xl animate-pulse" style={{ width: w }} />
        ))}
      </div>
      <div className="space-y-2">
        {[100, 90, 75].map((w, i) => (
          <div key={i} className="h-3.5 bg-white/10 rounded animate-pulse" style={{ width: `${w}%` }} />
        ))}
      </div>
      <div className="h-14 bg-white/10 rounded-2xl animate-pulse" />
      <div className="grid grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-white/10 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-4 w-28 bg-white/10 rounded animate-pulse" />
      <div className="grid sm:grid-cols-2 gap-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 bg-white/10 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
      <div className="space-y-2.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-white/10 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function Home() {
  const [theme,       setTheme]       = useState("dark")
  const [goal,        setGoal]        = useState("balanced")
  const [spice,       setSpice]       = useState("medium")
  const [budget,      setBudget]      = useState(200)
  const [location,    setLocation]    = useState("India")
  const [skill,       setSkill]       = useState("beginner")
  const [ingredients, setIngredients] = useState("")
  const [recipe,      setRecipe]      = useState(null)
  const [history,     setHistory]     = useState([])
  const [loading,     setLoading]     = useState(false)
  const [inputError,  setInputError]  = useState(false)
  const [favourites,  setFavourites]  = useState(() => new Set(readStorage("favouriteRecipes", [])))

  // ── One-time setup ─────────────────────────────────────────
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    } else {
      document.documentElement.classList.add("dark")
    }

    setHistory(readStorage("savedRecipes", []))

    const glow = document.createElement("div")
    glow.className = "pointer-events-none fixed w-40 h-40 rounded-full bg-orange-500/20 blur-3xl z-50"
    document.body.appendChild(glow)
    const move = (e) => {
      glow.style.left = `${e.clientX - 80}px`
      glow.style.top  = `${e.clientY - 80}px`
    }
    window.addEventListener("mousemove", move)
    return () => {
      window.removeEventListener("mousemove", move)
      if (document.body.contains(glow)) document.body.removeChild(glow)
    }
  }, [])

  const particles = useMemo(() =>
    [...Array(40)].map((_, i) => ({
      left:     `${(i * 2.5) % 100}%`,
      top:      `${(i * 3.1) % 100}%`,
      duration: 10 + (i * 0.6) % 20,
    })), [])

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    localStorage.setItem("theme", next)
    document.documentElement.classList.toggle("dark", next === "dark")
  }

  const toggleFavourite = (title) => {
    setFavourites((prev) => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else                 next.add(title)
      localStorage.setItem("favouriteRecipes", JSON.stringify([...next]))
      return next
    })
  }

  const handleGenerate = () => {
    if (!ingredients.trim()) {
      setInputError(true)
      setTimeout(() => setInputError(false), 500)
      return
    }
    setLoading(true)
    setRecipe(null)

    const parsed = ingredients.split(",").map((i) => i.trim()).filter(Boolean)
    setTimeout(() => {
      const result = generateSmartRecipe({ ingredients: parsed, goal, spice, budget, location, skill })
      setRecipe(result)
      const saved   = readStorage("savedRecipes", [])
      const updated = [result, ...saved].slice(0, 20)
      localStorage.setItem("savedRecipes", JSON.stringify(updated))
      setHistory(updated)
      setLoading(false)
    }, 1500)
  }

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
      const aF = favourites.has(a.title) ? 1 : 0
      const bF = favourites.has(b.title) ? 1 : 0
      return bF - aF
    })
  }, [history, favourites])

  // ── Light / dark page classes ──────────────────────────────
  // Text and background react to theme — but RecipeDisplay card
  // is always dark for better contrast and consistent PDF export, so it has its own internal theme toggle.
  const isDark = theme === "dark"

  return (
    <div className={`relative min-h-screen transition-colors duration-500
      ${isDark ? "bg-[#0b0f19] text-white" : "bg-slate-100 text-gray-900"}`}
    >

      {/* ── Theme toggle ──────────────────────────────────── */}
      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={toggleTheme}
          className={`px-4 py-2 rounded-full text-sm font-medium
            backdrop-blur border transition-colors
            ${isDark
              ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"}`}
        >
          {isDark ? "🌙 Dark" : "☀️ Light"}
        </button>
      </div>

      {/* ── Particles (dark only) ─────────────────────────── */}
      {isDark && (
        <div className="absolute inset-0 -z-20 overflow-hidden pointer-events-none">
          {particles.map((p, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -120] }}
              transition={{ repeat: Infinity, duration: p.duration, ease: "linear" }}
              className="absolute w-1 h-1 bg-white/20 rounded-full"
              style={{ left: p.left, top: p.top }}
            />
          ))}
        </div>
      )}

      {/* ── Gradient blobs ────────────────────────────────── */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, 60, -40, 0], y: [0, 40, -30, 0] }}
          transition={{ repeat: Infinity, duration: 25, ease: "easeInOut" }}
          className={`absolute top-[-200px] left-[-200px] w-[700px] h-[700px]
            rounded-full blur-[200px]
            ${isDark ? "bg-purple-600 opacity-30" : "bg-purple-400 opacity-15"}`}
        />
        <motion.div
          animate={{ x: [0, -60, 40, 0], y: [0, -40, 30, 0] }}
          transition={{ repeat: Infinity, duration: 30, ease: "easeInOut" }}
          className={`absolute bottom-[-200px] right-[-200px] w-[700px] h-[700px]
            rounded-full blur-[200px]
            ${isDark ? "bg-orange-500 opacity-20" : "bg-orange-400 opacity-15"}`}
        />
      </div>

      {/* ── Hero ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="text-center max-w-4xl mx-auto pt-24 px-6"
      >
        <h1 className="text-5xl md:text-7xl font-bold leading-tight">
          Craft Recipes
          <span className="block bg-gradient-to-r from-orange-400 via-pink-500
            to-purple-500 bg-clip-text text-transparent">
            With Intelligence
          </span>
        </h1>
        <p className={`mt-6 text-lg ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          Turn simple ingredients into extraordinary meals.
        </p>
      </motion.div>

      {/* ── Generator form ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.2 }}
        className="mt-20 max-w-3xl mx-auto relative px-6"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500
          to-purple-600 opacity-20 blur-2xl rounded-3xl" />

        <div className={`relative backdrop-blur-xl border rounded-3xl p-8 shadow-2xl
          ${isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}>

          {/* Textarea with shake + red glow on empty submit */}
          <motion.div
            animate={inputError ? { x: [-10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <textarea
              rows="3"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleGenerate())}
              placeholder="chicken, rice, garlic... or try 'butter_chicken'"
              className={`w-full bg-transparent outline-none resize-none text-lg
                placeholder-gray-400 rounded-xl p-3 border-2 transition-colors duration-300
                ${inputError
                  ? "border-red-400 bg-red-500/5"
                  : isDark
                  ? "border-transparent text-gray-200 focus:border-white/10"
                  : "border-transparent text-gray-800 focus:border-gray-300"}`}
            />
            {inputError && (
              <p className="text-red-400 text-xs mt-1 ml-1">
                Please enter at least one ingredient
              </p>
            )}
          </motion.div>

          {/* Controls grid */}
          <div className="mt-6 grid md:grid-cols-3 gap-5">
            <SelectField isDark={isDark} label="Goal" value={goal} onChange={setGoal} options={[
              { value: "balanced",    label: "Balanced"    },
              { value: "weight_loss", label: "Weight Loss" },
              { value: "muscle_gain", label: "Muscle Gain" },
            ]} />

            <SelectField isDark={isDark} label="Spice Level" value={spice} onChange={setSpice} options={[
              { value: "mild",   label: "🌿 Mild"   },
              { value: "medium", label: "🌶 Medium"  },
              { value: "hot",    label: "🔥 Hot"     },
            ]} />

            <SelectField isDark={isDark} label="Skill Level" value={skill} onChange={setSkill} options={[
              { value: "beginner",     label: "Beginner"     },
              { value: "intermediate", label: "Intermediate" },
              { value: "advanced",     label: "Advanced"     },
            ]} />

            <div>
              <label className={`text-xs font-medium block mb-2
                ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Budget: <span className={isDark ? "text-white" : "text-gray-900"}>₹{budget}</span>
              </label>
              <input
                type="range" min="100" max="500" step="50"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full mt-1 accent-orange-500"
              />
            </div>

            <SelectField isDark={isDark} label="Cuisine" value={location} onChange={setLocation} options={[
              { value: "India",    label: "🇮🇳 India"    },
              { value: "Italy",    label: "🇮🇹 Italy"    },
              { value: "Mexico",   label: "🇲🇽 Mexico"   },
              { value: "USA",      label: "🇺🇸 USA"      },
              { value: "China",    label: "🇨🇳 China"    },
              { value: "Japan",    label: "🇯🇵 Japan"    },
              { value: "Thailand", label: "🇹🇭 Thailand" },
            ]} />
          </div>

          <div className="flex justify-end mt-6">
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGenerate}
              disabled={loading}
              className="px-8 py-3 rounded-full bg-gradient-to-r
                from-orange-500 to-pink-500 text-white font-semibold
                shadow-lg shadow-orange-500/30 disabled:opacity-60
                disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? "Generating..." : "Generate Recipe ✨"}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ── Skeleton loader ───────────────────────────────── */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0  }}
            exit={{    opacity: 0, y: 40 }}
            transition={{ duration: 0.4 }}
            className="mt-16 max-w-4xl mx-auto px-6"
          >
            <div className="flex items-center gap-3 mb-6 px-2">
              <motion.div
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="w-3 h-3 rounded-full bg-orange-500"
              />
              <span className={`text-sm tracking-widest uppercase font-medium
                ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Crafting your recipe...
              </span>
            </div>
            <RecipeSkeleton />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Recipe output ─────────────────────────────────── */}
      <AnimatePresence>
        {recipe && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0  }}
            exit={{    opacity: 0         }}
            transition={{ duration: 0.8 }}
            className="mt-16 max-w-4xl mx-auto px-6 pb-16"
          >
            <RecipeDisplay
              recipe={recipe}
              isFavourite={favourites.has(recipe.title)}
              onToggleFavourite={() => toggleFavourite(recipe.title)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── History ───────────────────────────────────────── */}
      {sortedHistory.length > 1 && !loading && (
        <div className="mt-12 max-w-4xl mx-auto px-6 pb-24">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold
              ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Previous Creations
            </h2>
            <span className={`text-xs ${isDark ? "text-gray-600" : "text-gray-400"}`}>
              {sortedHistory.length} recipes
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {sortedHistory.slice(1).map((item, index) => {
              const isFav = favourites.has(item.title)
              const flag  = CUISINE_FLAGS[item.location] ?? "🍽"

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0  }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => setRecipe(item)}
                  className={`group relative p-5 rounded-2xl backdrop-blur-lg
                    cursor-pointer transition-all duration-300 border
                    hover:scale-[1.02] hover:shadow-lg
                    ${isFav
                      ? isDark
                        ? "bg-yellow-500/5  border-yellow-500/20 hover:border-yellow-500/40"
                        : "bg-yellow-50     border-yellow-200   hover:border-yellow-400"
                      : isDark
                        ? "bg-white/5       border-white/10     hover:border-white/20"
                        : "bg-white         border-gray-200     hover:border-gray-300 shadow-sm"
                    }`}
                >
                  {/* Favourite star */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavourite(item.title) }}
                    className={`absolute top-4 right-4 text-lg transition-opacity
                      ${isFav ? "opacity-100" : "opacity-40 hover:opacity-100"}`}
                  >
                    {isFav ? "⭐" : "☆"}
                  </button>

                  {/* Cuisine + goal tags */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{flag}</span>
                    {item.location && (
                      <span className={`text-xs font-medium
                        ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                        {item.location}
                      </span>
                    )}
                    {item.goal && (
                      <span className={`text-xs px-2 py-0.5 rounded-full
                        ${isDark
                          ? "bg-white/10 text-gray-400"
                          : "bg-gray-100 text-gray-500"}`}>
                        {item.goal.replace("_", " ")}
                      </span>
                    )}
                  </div>

                  <h4 className={`font-semibold text-sm pr-8 leading-snug mb-2
                    ${isDark ? "text-white" : "text-gray-800"}`}>
                    {item.title}
                  </h4>

                  <div className={`flex items-center gap-3 text-xs
                    ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                    {item.estimatedCost && <span>{item.estimatedCost}</span>}
                    {item.calories      && <span>· {item.calories}</span>}
                    {item.healthScore   && (
                      <span className={
                        item.healthScore >= 70 ? "text-green-500"
                        : item.healthScore >= 50 ? "text-blue-500"
                        : "text-orange-500"
                      }>
                        · {item.healthScore}/100
                      </span>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}

// ─── SelectField ───────────────────────────────────────────────

function SelectField({ label, value, onChange, options, isDark }) {
  return (
    <div>
      <label className={`text-xs font-medium block mb-2
        ${isDark ? "text-gray-400" : "text-gray-600"}`}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xl px-3 py-2.5 text-sm border
          focus:outline-none transition-colors cursor-pointer
          ${isDark
            // Dark mode: dark opaque background, light text
            ? "bg-gray-800 border-gray-700 text-gray-100 focus:border-gray-500"
            // Light mode: white bg, dark text — fully readable
            : "bg-white border-gray-300 text-gray-900 focus:border-gray-400"
          }`}
      >
        {options.map(({ value: v, label: l }) => (
          <option
            key={v}
            value={v}
            className={isDark ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"}
          >
            {l}
          </option>
        ))}
      </select>
    </div>
  )
}
// ═══════════════════════════════════════════════════════════════
//  MealPlanner.jsx  — Tier 4
//
//  7-day meal planner with:
//  1. Mon–Sun × Breakfast/Lunch/Dinner grid
//  2. Assign from history or mark as Leftover
//  3. Per-day macro totals vs editable targets
//  4. Weekly grocery list aggregated from all ingredients
//  5. Copy grocery list to clipboard
//  6. Persistent localStorage save ("mealPlan", "macroTargets")
//  7. Clear day / clear week
//
//  Props: { onClose }
//  Reads:  localStorage "savedRecipes"  (recipe history from Home)
//
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import html2pdf from "html2pdf.js"

// ── Constants ──────────────────────────────────────────────────
const DAYS  = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
const SLOTS = ["Breakfast","Lunch","Dinner"]
const SHORT = { Monday:"Mon", Tuesday:"Tue", Wednesday:"Wed", Thursday:"Thu",
                Friday:"Fri", Saturday:"Sat", Sunday:"Sun" }

const DEFAULT_TARGETS = { cal: 2000, protein: 60, carbs: 250, fats: 65 }

// ── Helpers ────────────────────────────────────────────────────
function parseNum(s) { return parseFloat(String(s ?? "0").replace(/[^0-9.]/g, "")) || 0 }

function readLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback }
  catch { return fallback }
}
function writeLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

function emptyPlan() {
  const p = {}
  DAYS.forEach(d => {
    p[d] = {}
    SLOTS.forEach(s => { p[d][s] = { recipe: null, isLeftover: false, leftoverOf: null } })
  })
  return p
}

function getMacros(entry) {
  if (!entry?.recipe) return { cal: 0, protein: 0, carbs: 0, fats: 0 }
  const r = entry.recipe
  return {
    cal:     parseNum(r.calories),
    protein: parseNum(r.protein),
    carbs:   parseNum(r.carbs),
    fats:    parseNum(r.fats),
  }
}

function dayTotals(plan, day) {
  return SLOTS.reduce((acc, slot) => {
    const m = getMacros(plan[day]?.[slot])
    acc.cal     += m.cal
    acc.protein += m.protein
    acc.carbs   += m.carbs
    acc.fats    += m.fats
    return acc
  }, { cal: 0, protein: 0, carbs: 0, fats: 0 })
}

// ── Sub-components ─────────────────────────────────────────────

function MacroBar({ label, value, target, color }) {
  const pct = Math.min(100, Math.round((value / Math.max(target, 1)) * 100))
  const over = value > target
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-16 text-gray-400 font-medium shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${over ? "bg-red-500" : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`w-20 text-right font-semibold tabular-nums text-xs ${over ? "text-red-400" : "text-gray-300"}`}>
        {Math.round(value)}/{target}
      </span>
    </div>
  )
}

function TargetEditor({ targets, onChange }) {
  const fields = [
    { key: "cal",     label: "Calories",  unit: "kcal" },
    { key: "protein", label: "Protein",   unit: "g" },
    { key: "carbs",   label: "Carbs",     unit: "g" },
    { key: "fats",    label: "Fats",      unit: "g" },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {fields.map(({ key, label, unit }) => (
        <div key={key} className="bg-white/5 rounded-xl px-3 py-2 border border-white/8">
          <label className="text-xs text-gray-500 block mb-1">{label} ({unit})</label>
          <input
            type="number"
            value={targets[key]}
            onChange={e => onChange({ ...targets, [key]: Number(e.target.value) })}
            className="w-full bg-transparent text-white font-bold text-base outline-none"
            min={0} step={key === "cal" ? 50 : 5}
          />
        </div>
      ))}
    </div>
  )
}

function RecipePicker({ day, slot, history, currentPlan, onAssign, onLeftover, onClear, onClose }) {
  const [tab, setTab] = useState("history")   // "history" | "leftover"
  const [search, setSearch] = useState("")

  const filtered = history.filter(r =>
    !search.trim() || r.title?.toLowerCase().includes(search.toLowerCase())
  )

  // Collect filled slots for leftover source
  const filledSlots = []
  DAYS.forEach(d => SLOTS.forEach(s => {
    const e = currentPlan[d]?.[s]
    if (e?.recipe && !(d === day && s === slot)) filledSlots.push({ d, s, title: e.recipe.title })
  }))

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 8 }}
      transition={{ duration: 0.2 }}
      className="absolute z-50 top-full mt-2 left-0 w-80 bg-gray-900 border border-white/15 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <span className="text-sm font-bold text-white">{day} · {slot}</span>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-sm">✕</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/8">
        {["history", "leftover"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-semibold capitalize transition-colors
              ${tab === t ? "text-orange-400 border-b-2 border-orange-400" : "text-gray-500 hover:text-gray-300"}`}>
            {t === "history" ? "📋 From History" : "♻️ Leftover"}
          </button>
        ))}
      </div>

      {tab === "history" && (
        <div>
          <div className="px-3 pt-3">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search recipes…"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-orange-500/40"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-2">
            {filtered.length === 0 && (
              <p className="text-center text-gray-600 text-sm py-6">
                {history.length === 0 ? "Generate some recipes first" : "No matches"}
              </p>
            )}
            {filtered.map((r, i) => (
              <button key={i} onClick={() => { onAssign(r); onClose() }}
                className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors group">
                <p className="text-sm font-semibold text-gray-200 group-hover:text-white leading-snug">
                  {r.title}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {parseNum(r.calories)} kcal · {parseNum(r.protein)}g P · {parseNum(r.carbs)}g C · {parseNum(r.fats)}g F
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "leftover" && (
        <div className="max-h-56 overflow-y-auto py-2">
          {filledSlots.length === 0 && (
            <p className="text-center text-gray-600 text-sm py-6">Fill other meals first</p>
          )}
          {filledSlots.map(({ d, s, title }, i) => (
            <button key={i} onClick={() => { onLeftover(d, s); onClose() }}
              className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors">
              <p className="text-sm font-semibold text-gray-200">{title}</p>
              <p className="text-xs text-gray-500">{SHORT[d]} · {s}</p>
            </button>
          ))}
        </div>
      )}

      {/* Clear */}
      <div className="border-t border-white/8 p-2">
        <button onClick={() => { onClear(); onClose() }}
          className="w-full py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors font-medium">
          🗑 Clear this slot
        </button>
      </div>
    </motion.div>
  )
}

function GroceryList({ plan }) {
  const [copied, setCopied] = useState(false)

  const grocery = useMemo(() => {
    const map = {}
    DAYS.forEach(day => SLOTS.forEach(slot => {
      const entry = plan[day]?.[slot]
      if (!entry?.recipe?.ingredients) return
      entry.recipe.ingredients.forEach(({ item, qty }) => {
        const key = item.toLowerCase()
        if (!map[key]) map[key] = { item, qty: 0 }
        map[key].qty += (parseNum(qty) || 100)
      })
    }))
    return Object.values(map).sort((a, b) => a.item.localeCompare(b.item))
  }, [plan])

  const copyText = useMemo(() => {
    if (!grocery.length) return ""
    const header = "🛒 Grocery List\n" + "─".repeat(30) + "\n"
    const items   = grocery.map(({ item, qty }) =>
      `• ${item.charAt(0).toUpperCase() + item.slice(1)} — ${qty >= 1000 ? (qty/1000).toFixed(1)+"kg" : Math.round(qty)+"g"}`
    ).join("\n")
    return header + items
  }, [grocery])

  const handleCopy = () => {
    navigator.clipboard.writeText(copyText).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!grocery.length) return (
    <div className="text-center py-10 text-gray-600">
      <p className="text-3xl mb-3">🛒</p>
      <p className="text-sm">Add meals to your plan to generate a grocery list</p>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-gray-400">{grocery.length} ingredients</span>
        <button onClick={handleCopy}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all
            ${copied ? "bg-green-500/20 text-green-400 border border-green-500/30"
                     : "bg-orange-500/15 text-orange-400 border border-orange-500/25 hover:bg-orange-500/25"}`}>
          {copied ? "✅ Copied!" : "📋 Copy List"}
        </button>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {grocery.map(({ item, qty }) => (
          <div key={item} className="flex items-center justify-between px-4 py-2.5 bg-white/3 border border-white/8 rounded-xl">
            <span className="text-sm font-medium text-gray-200 capitalize">{item}</span>
            <span className="text-sm font-bold text-gray-400 tabular-nums">
              {qty >= 1000 ? `${(qty/1000).toFixed(1)} kg` : `${Math.round(qty)} g`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────
export default function MealPlanner({ onClose }) {
  const planRef = useRef(null)
  const [plan,      setPlan]      = useState(() => {
    const saved = readLS("mealPlan", null)
    return saved && typeof saved === "object" ? saved : emptyPlan()
  })
  const [planName,  setPlanName]  = useState(() => readLS("mealPlanName", "My Week"))
  const [savedPlans,setSavedPlans]= useState(() => readLS("savedMealPlans", []))
  const [slotNotes, setSlotNotes] = useState(() => readLS("slotNotes", {}))
  const [editingNote, setEditingNote] = useState(null)  // "Day-Slot" key
  const [targets, setTargets] = useState(() => {
    // Prefer profile-derived targets over manually saved ones
    try {
      const profile = JSON.parse(localStorage.getItem("userProfile"))
      if (profile?.weight && profile?.height && profile?.age) {
        const mult = { sedentary:1.20, light:1.375, moderate:1.55, active:1.725, extra:1.90 }[profile.activity] ?? 1.55
        const bmr  = profile.sex === "female" ? 10*profile.weight+6.25*profile.height-5*profile.age-161 : 10*profile.weight+6.25*profile.height-5*profile.age+5
        const tdee = Math.round(bmr * mult)
        const surp = { weight_loss:-500, balanced:0, muscle_gain:300, performance:200 }[profile.goal] ?? 0
        const tCal = Math.max(1200, tdee + surp)
        const sp   = { weight_loss:{p:0.35,c:0.40,f:0.25}, balanced:{p:0.25,c:0.50,f:0.25}, muscle_gain:{p:0.35,c:0.45,f:0.20}, performance:{p:0.25,c:0.55,f:0.20} }[profile.goal] ?? {p:0.25,c:0.50,f:0.25}
        return { cal: tCal, protein: Math.round(tCal*sp.p/4), carbs: Math.round(tCal*sp.c/4), fats: Math.round(tCal*sp.f/9) }
      }
    } catch {}
    return readLS("macroTargets", DEFAULT_TARGETS)
  })
  const [history, setHistory] = useState(() => readLS("savedRecipes", []))
  const [view,    setView]    = useState("planner")  // "planner" | "grocery" | "targets"
  const [activeDay, setActiveDay] = useState("Monday")
  const [openPicker, setOpenPicker] = useState(null)  // "Day-Slot" | null

  // Persist plan + targets
  useEffect(() => { writeLS("mealPlan", plan) }, [plan])
  useEffect(() => { writeLS("macroTargets", targets) }, [targets])
  useEffect(() => { writeLS("mealPlanName", planName) }, [planName])
  useEffect(() => { writeLS("slotNotes", slotNotes) }, [slotNotes])

  // Reload history when component mounts (latest from Home)
  useEffect(() => { setHistory(readLS("savedRecipes", [])) }, [])

  const assignRecipe = useCallback((day, slot, recipe) => {
    setPlan(p => ({
      ...p,
      [day]: { ...p[day], [slot]: { recipe, isLeftover: false, leftoverOf: null } }
    }))
  }, [])

  const assignLeftover = useCallback((day, slot, srcDay, srcSlot) => {
    const srcEntry = plan[srcDay]?.[srcSlot]
    if (!srcEntry?.recipe) return
    setPlan(p => ({
      ...p,
      [day]: {
        ...p[day],
        [slot]: {
          recipe:     srcEntry.recipe,
          isLeftover: true,
          leftoverOf: `${SHORT[srcDay]} ${srcSlot}`,
        }
      }
    }))
  }, [plan])

  const clearSlot = useCallback((day, slot) => {
    setPlan(p => ({
      ...p,
      [day]: { ...p[day], [slot]: { recipe: null, isLeftover: false, leftoverOf: null } }
    }))
  }, [])

  const clearDay  = useCallback((day) => {
    setPlan(p => ({ ...p, [day]: Object.fromEntries(SLOTS.map(s => [s, { recipe: null, isLeftover: false, leftoverOf: null }])) }))
  }, [])

  const savePlan = () => {
    const entry = { id: Date.now().toString(36), name: planName, plan, createdAt: new Date().toLocaleDateString() }
    const updated = [entry, ...savedPlans].slice(0, 10)
    setSavedPlans(updated)
    writeLS("savedMealPlans", updated)
  }

  const exportPDF = () => {
    const rows = DAYS.map(day => {
      const dt = dayTotals(plan, day)
      const meals = SLOTS.map(slot => {
        const entry = plan[day]?.[slot]
        return entry?.recipe ? `${slot}: ${entry.recipe.title}${entry.isLeftover ? " ♻️" : ""}` : `${slot}: —`
      }).join("\n")
      return `${day}\n${meals}\n${Math.round(dt.cal)} kcal | ${Math.round(dt.protein)}g P | ${Math.round(dt.carbs)}g C | ${Math.round(dt.fats)}g F`
    }).join("\n\n")

    const grocery = (() => {
      const map = {}
      DAYS.forEach(day => SLOTS.forEach(slot => {
        const entry = plan[day]?.[slot]
        if (!entry?.recipe?.ingredients) return
        entry.recipe.ingredients.forEach(({ item, qty }) => {
          const key = item.toLowerCase()
          if (!map[key]) map[key] = { item, qty: 0 }
          map[key].qty += (parseFloat(qty) || 100)
        })
      }))
      return Object.values(map).sort((a, b) => a.item.localeCompare(b.item))
        .map(({ item, qty }) => `• ${item.charAt(0).toUpperCase()+item.slice(1)} — ${qty >= 1000 ? (qty/1000).toFixed(1)+"kg" : Math.round(qty)+"g"}`)
        .join("\n")
    })()

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 32px; color: #111; max-width: 800px; margin: auto;">
        <h1 style="font-size: 28px; font-weight: 900; margin-bottom: 4px;">${planName}</h1>
        <p style="color: #666; margin-bottom: 24px;">${filledCount}/21 meals planned · Generated ${new Date().toLocaleDateString()}</p>
        <table style="width:100%; border-collapse:collapse; margin-bottom: 32px;">
          <thead>
            <tr style="background:#f3f3f3;">
              <th style="padding:8px 12px; text-align:left; border:1px solid #ddd;">Day</th>
              ${SLOTS.map(s => `<th style="padding:8px 12px; text-align:left; border:1px solid #ddd;">${s}</th>`).join("")}
              <th style="padding:8px 12px; text-align:left; border:1px solid #ddd;">Totals</th>
            </tr>
          </thead>
          <tbody>
            ${DAYS.map(day => {
              const dt = dayTotals(plan, day)
              return `<tr>
                <td style="padding:8px 12px; border:1px solid #ddd; font-weight:bold;">${day}</td>
                ${SLOTS.map(slot => {
                  const e = plan[day]?.[slot]
                  return `<td style="padding:8px 12px; border:1px solid #ddd; font-size:12px;">${e?.recipe ? e.recipe.title+(e.isLeftover?" ♻️":"") : "—"}</td>`
                }).join("")}
                <td style="padding:8px 12px; border:1px solid #ddd; font-size:11px; color:#555;">${Math.round(dt.cal)} kcal<br>${Math.round(dt.protein)}g P · ${Math.round(dt.carbs)}g C · ${Math.round(dt.fats)}g F</td>
              </tr>`
            }).join("")}
          </tbody>
        </table>
        <h2 style="font-size:20px; font-weight:800; margin-bottom:12px;">🛒 Grocery List</h2>
        <div style="columns: 2; column-gap: 24px; font-size: 13px; line-height: 1.8;">
          ${grocery.split("\n").map(line => `<p style="margin:0;">${line}</p>`).join("")}
        </div>
      </div>
    `
    html2pdf().set({
      margin: 0, filename: `${planName.replace(/\s+/g,"-")}-meal-plan.pdf`,
      html2canvas: { scale: 2 }, jsPDF: { unit: "mm", format: "a4", orientation: "landscape" }
    }).from(html).save()
  }

  const loadPlan = (entry) => {
    setPlan(entry.plan)
    setPlanName(entry.name)
  }

  const deleteSavedPlan = (id) => {
    const updated = savedPlans.filter(p => p.id !== id)
    setSavedPlans(updated)
    writeLS("savedMealPlans", updated)
  }

  const clearWeek = () => { if (confirm("Clear the entire week's plan?")) setPlan(emptyPlan()) }

  const totals = useMemo(() => {
    const t = { cal: 0, protein: 0, carbs: 0, fats: 0 }
    DAYS.forEach(day => {
      const d = dayTotals(plan, day)
      t.cal += d.cal; t.protein += d.protein; t.carbs += d.carbs; t.fats += d.fats
    })
    return t
  }, [plan])

  const filledCount = useMemo(() => {
    let n = 0
    DAYS.forEach(day => SLOTS.forEach(slot => { if (plan[day]?.[slot]?.recipe) n++ }))
    return n
  }, [plan])

  const pickerKey = openPicker  // "Monday-Breakfast" etc

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0f19] overflow-y-auto">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-[#0b0f19]/95 backdrop-blur border-b border-white/8 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <h1 className="text-xl font-bold text-white">7-Day Meal Planner</h1>
              <p className="text-sm text-gray-500">
                {filledCount}/21 meals planned
                {filledCount > 0 && ` · ${Math.round(totals.cal / Math.max(filledCount/3, 1))} avg daily kcal`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Plan name inline edit */}
            <input
              value={planName}
              onChange={e => setPlanName(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-semibold outline-none focus:border-orange-500/40 w-36"
              placeholder="Plan name…"
            />
            <button onClick={savePlan}
              className="px-3 py-2 rounded-xl text-sm font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/25 hover:bg-orange-500/25 transition-all">
              💾 Save
            </button>
            {[
              { key: "planner", label: "📅 Planner" },
              { key: "plans",   label: `📁 My Plans${savedPlans.length ? ` (${savedPlans.length})` : ""}` },
              { key: "grocery", label: "🛒 Grocery" },
              { key: "targets", label: "🎯 Targets" },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setView(key)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all
                  ${view === key ? "bg-orange-500 text-white" : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"}`}>
                {label}
              </button>
            ))}
            <button onClick={clearWeek}
              className="px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors border border-red-500/20">
              🗑 Clear Week
            </button>
            <button onClick={exportPDF}
              className="px-3 py-2 rounded-xl text-sm text-purple-400 hover:bg-purple-500/10 transition-colors border border-purple-500/20">
              📄 PDF
            </button>
            <button onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-white/8 text-gray-300 hover:text-white hover:bg-white/15 transition-colors">
              ✕ Close
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ── PLANNER VIEW ─────────────────────────────────────── */}
        {view === "planner" && (
          <div>
            {/* Day tabs — mobile friendly */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
              {DAYS.map(day => {
                const dt = dayTotals(plan, day)
                const filled = SLOTS.filter(s => plan[day]?.[s]?.recipe).length
                return (
                  <button key={day} onClick={() => setActiveDay(day)}
                    className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap
                      ${activeDay === day
                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                        : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/8"}`}>
                    {SHORT[day]}
                    {filled > 0 && (
                      <span className={`ml-1.5 text-xs ${activeDay === day ? "opacity-75" : "text-orange-500"}`}>
                        {filled}/3
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Active day panel */}
            <AnimatePresence mode="wait">
              <motion.div key={activeDay}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}>

                {/* Day header + clear */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">{activeDay}</h2>
                  <button onClick={() => clearDay(activeDay)}
                    className="text-sm text-gray-600 hover:text-red-400 transition-colors">
                    Clear day
                  </button>
                </div>

                {/* Meal slots */}
                <div className="grid sm:grid-cols-3 gap-4 mb-6">
                  {SLOTS.map(slot => {
                    const entry   = plan[activeDay]?.[slot]
                    const recipe  = entry?.recipe
                    const pKey    = `${activeDay}-${slot}`
                    const isOpen  = openPicker === pKey
                    const macros  = getMacros(entry)

                    return (
                      <div key={slot} className="relative">
                        <div
                          onClick={() => setOpenPicker(isOpen ? null : pKey)}
                          className={`relative cursor-pointer rounded-2xl border p-4 min-h-[130px] transition-all
                            ${recipe
                              ? entry.isLeftover
                                ? "bg-sky-500/5 border-sky-500/20 hover:border-sky-500/40"
                                : "bg-white/5 border-white/15 hover:border-white/30"
                              : "bg-white/2 border-white/8 hover:border-orange-500/30 hover:bg-orange-500/3"}`}>

                          {/* Slot label */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                              {slot}
                            </span>
                            {recipe && (
                              <span className="text-xs text-gray-600">
                                {entry.isLeftover ? `♻️ ${entry.leftoverOf}` : ""}
                              </span>
                            )}
                          </div>

                          {recipe ? (
                            <>
                              <p className="text-sm font-bold text-white leading-snug mb-2 line-clamp-2">
                                {recipe.title}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                <span className="text-xs bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full font-semibold">
                                  {Math.round(macros.cal)} kcal
                                </span>
                                <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-semibold">
                                  {Math.round(macros.protein)}g P
                                </span>
                                <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full font-semibold">
                                  {Math.round(macros.carbs)}g C
                                </span>
                                <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full font-semibold">
                                  {Math.round(macros.fats)}g F
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-16 gap-1 text-gray-700">
                              <span className="text-2xl">+</span>
                              <span className="text-xs">Add meal</span>
                            </div>
                          )}
                        </div>

                        {/* Picker dropdown */}
                        <AnimatePresence>
                          {isOpen && (
                            <RecipePicker
                              day={activeDay}
                              slot={slot}
                              history={history}
                              currentPlan={plan}
                              onAssign={r  => assignRecipe(activeDay, slot, r)}
                              onLeftover={(srcDay, srcSlot) => assignLeftover(activeDay, slot, srcDay, srcSlot)}
                              onClear={() => clearSlot(activeDay, slot)}
                              onClose={() => setOpenPicker(null)}
                            />
                          )}
                        </AnimatePresence>

                        {/* Per-slot note */}
                        {editingNote === pKey ? (
                          <textarea
                            autoFocus
                            value={slotNotes[pKey] ?? ""}
                            onChange={e => setSlotNotes(n => ({ ...n, [pKey]: e.target.value }))}
                            onBlur={() => setEditingNote(null)}
                            placeholder="Add a note…"
                            rows={2}
                            className="mt-2 w-full bg-white/5 border border-orange-500/30 rounded-xl px-3 py-2 text-xs text-gray-300 placeholder-gray-700 outline-none resize-none"
                          />
                        ) : slotNotes[pKey] ? (
                          <p onClick={e => { e.stopPropagation(); setEditingNote(pKey) }}
                            className="mt-2 text-xs text-gray-600 italic cursor-pointer hover:text-gray-400 transition-colors px-1 line-clamp-2">
                            📝 {slotNotes[pKey]}
                          </p>
                        ) : recipe ? (
                          <button onClick={e => { e.stopPropagation(); setEditingNote(pKey) }}
                            className="mt-2 text-xs text-gray-800 hover:text-gray-600 transition-colors w-full text-left px-1">
                            + add note
                          </button>
                        ) : null}
                      </div>
                    )
                  })}
                </div>

                {/* Day macro summary */}
                {(() => {
                  const dt = dayTotals(plan, activeDay)
                  const hasMeals = SLOTS.some(s => plan[activeDay]?.[s]?.recipe)
                  if (!hasMeals) return null
                  return (
                    <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
                      <h3 className="text-sm font-bold text-gray-300 mb-3">
                        {activeDay} — Daily Totals vs Targets
                      </h3>
                      <div className="space-y-2">
                        <MacroBar label="Calories" value={dt.cal}     target={targets.cal}     color="bg-orange-500" />
                        <MacroBar label="Protein"  value={dt.protein} target={targets.protein} color="bg-blue-500"   />
                        <MacroBar label="Carbs"    value={dt.carbs}   target={targets.carbs}   color="bg-green-500"  />
                        <MacroBar label="Fats"     value={dt.fats}    target={targets.fats}    color="bg-purple-500" />
                      </div>
                    </div>
                  )
                })()}
              </motion.div>
            </AnimatePresence>

            {/* ── Weekly overview strip ──────────────────────── */}
            <div className="mt-10">
              <h3 className="text-base font-bold text-gray-300 mb-4">Weekly Overview</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] border-separate border-spacing-1">
                  <thead>
                    <tr>
                      <th className="text-xs text-gray-600 text-left pl-2 w-24">Meal</th>
                      {DAYS.map(d => (
                        <th key={d} className="text-xs text-gray-500 text-center font-semibold pb-1">
                          {SHORT[d]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SLOTS.map(slot => (
                      <tr key={slot}>
                        <td className="text-xs text-gray-600 font-semibold pl-2 py-1 align-middle">{slot}</td>
                        {DAYS.map(day => {
                          const entry  = plan[day]?.[slot]
                          const recipe = entry?.recipe
                          return (
                            <td key={day}
                              onClick={() => { setActiveDay(day); setOpenPicker(`${day}-${slot}`) }}
                              className={`text-center rounded-xl cursor-pointer transition-all p-1.5
                                ${recipe
                                  ? entry.isLeftover
                                    ? "bg-sky-500/10 hover:bg-sky-500/20"
                                    : "bg-green-500/10 hover:bg-green-500/20"
                                  : "bg-white/3 hover:bg-orange-500/10"}`}>
                              {recipe ? (
                                <span className="text-xs text-gray-300 leading-tight line-clamp-2 block">
                                  {recipe.title.split(" ").slice(0,3).join(" ")}
                                  {entry.isLeftover && " ♻️"}
                                </span>
                              ) : (
                                <span className="text-gray-700 text-lg leading-none">·</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                    {/* Calorie row */}
                    <tr>
                      <td className="text-xs text-gray-600 font-semibold pl-2 pt-2">kcal</td>
                      {DAYS.map(day => {
                        const dt  = dayTotals(plan, day)
                        const pct = dt.cal / Math.max(targets.cal, 1)
                        return (
                          <td key={day} className="text-center pt-2">
                            <span className={`text-xs font-bold tabular-nums
                              ${dt.cal === 0 ? "text-gray-700"
                                : pct > 1.1 ? "text-red-400"
                                : pct > 0.8 ? "text-green-400"
                                : "text-yellow-400"}`}>
                              {dt.cal ? Math.round(dt.cal) : "—"}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── MY PLANS VIEW ────────────────────────────────────── */}
        {view === "plans" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1">📁 Saved Plans</h2>
              <p className="text-sm text-gray-500">Load a previous week's meal plan</p>
            </div>
            {savedPlans.length === 0 ? (
              <div className="text-center py-16 text-gray-700">
                <p className="text-4xl mb-3">📁</p>
                <p className="text-sm">No saved plans yet — name your plan and click 💾 Save</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedPlans.map(entry => {
                  const filled = Object.values(entry.plan).reduce((n, day) =>
                    n + Object.values(day).filter(s => s.recipe).length, 0)
                  return (
                    <div key={entry.id} className="flex items-center justify-between px-5 py-4 bg-white/3 border border-white/8 rounded-2xl">
                      <div>
                        <p className="text-sm font-bold text-white">{entry.name}</p>
                        <p className="text-xs text-gray-600">{entry.createdAt} · {filled}/21 meals</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { loadPlan(entry); setView("planner") }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-500/15 text-orange-400 border border-orange-500/25 hover:bg-orange-500/25 transition-all">
                          Load
                        </button>
                        <button onClick={() => deleteSavedPlan(entry.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all">
                          🗑
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── GROCERY LIST VIEW ────────────────────────────────── */}
        {view === "grocery" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1">🛒 Grocery List</h2>
              <p className="text-sm text-gray-500">
                Ingredients aggregated from all {filledCount} planned meals
              </p>
            </div>
            <GroceryList plan={plan} />
          </motion.div>
        )}

        {/* ── TARGETS VIEW ─────────────────────────────────────── */}
        {view === "targets" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1">🎯 Daily Macro Targets</h2>
              <p className="text-sm text-gray-500">
                Set your daily nutritional goals
                {(() => { try { const p = JSON.parse(localStorage.getItem("userProfile")); return p?.weight ? <span className="text-purple-400 ml-1">· synced from your profile</span> : null } catch { return null } })()}
              </p>
            </div>
            <TargetEditor targets={targets} onChange={t => setTargets(t)} />

            {/* Weekly totals vs targets */}
            <div className="mt-8 bg-white/3 border border-white/8 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-gray-300 mb-4">Weekly Totals (all 7 days combined)</h3>
              <div className="space-y-2">
                <MacroBar label="Calories" value={totals.cal}     target={targets.cal * 7}     color="bg-orange-500" />
                <MacroBar label="Protein"  value={totals.protein} target={targets.protein * 7} color="bg-blue-500"   />
                <MacroBar label="Carbs"    value={totals.carbs}   target={targets.carbs * 7}   color="bg-green-500"  />
                <MacroBar label="Fats"     value={totals.fats}    target={targets.fats * 7}    color="bg-purple-500" />
              </div>
            </div>

            {/* Quick presets */}
            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-500 mb-3">Quick Presets</p>
              <div className="flex gap-3 flex-wrap">
                {[
                  { label: "Weight Loss",   cal: 1600, protein: 80, carbs: 150, fats: 55 },
                  { label: "Maintenance",   cal: 2000, protein: 60, carbs: 250, fats: 65 },
                  { label: "Muscle Gain",   cal: 2500, protein: 150, carbs: 280, fats: 70 },
                  { label: "High Protein",  cal: 2200, protein: 180, carbs: 200, fats: 65 },
                ].map(preset => (
                  <button key={preset.label}
                    onClick={() => setTargets({ cal: preset.cal, protein: preset.protein, carbs: preset.carbs, fats: preset.fats })}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-white/5 text-gray-300 border border-white/10 hover:bg-orange-500/15 hover:border-orange-500/30 hover:text-orange-400 transition-all">
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
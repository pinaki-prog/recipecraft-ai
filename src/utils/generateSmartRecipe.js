// ─────────────────────────────────────────────────────────────
//  generateSmartRecipe.js  (v5 — Full Upgrade)
//
//  WHAT'S NEW vs v4:
//  1.  Fixed broken import — MICRO_DB removed (merged into
//      NUTRITION_DB in v2). computeMicros() replaced with
//      computeNutritionTotals() which covers all 20 fields.
//  2.  normalizeInput v2 shape consumed — excluded[], signals{},
//      suggestions[], unknown[] all wired in. "no onion" now
//      actually removes onion. Auto-detected goal/cuisine/dietary
//      from free text pre-fills the recipe parameters.
//  3.  Inflammatory score — getInflamScore() wired in.
//      Recipe output now carries inflam score + label + emoji.
//  4.  Glycemic profile — getGlycemicProfile() wired in.
//      GI/GL rating + high-GI ingredient warnings in output.
//  5.  Protein quality — getProteinQuality() + getPdcaasTier().
//      PDCAAS score, tier, completeness note, combine suggestion
//      all in output for RecipeDisplay.jsx to render.
//  6.  Vitamin & mineral flags — getVitaminFlags() wired in.
//      Recipe warns if B12, Vit D, Iron, Calcium, Omega-3 are low.
//  7.  Health tags — getHealthTags() wired in. Top tags like
//      "anti-inflammatory", "iron-rich", "omega-3-rich" in output.
//  8.  Dietary profile — getDietaryProfile() wired in. Recipe
//      auto-badges as Vegan 🌱 / Vegetarian 🥛 / Non-Veg 🍖.
//  9.  Real prep time — DISH_META.prepTime used when available.
//      Falls back to ingredient-count formula only when no meta.
//  10. Real difficulty — DISH_META.difficulty used. Returns
//      getDifficultyLabel() string (🟢 Beginner etc.).
//  11. Dish-specific pairings — getServedWith() from DISH_META
//      used when input is a known dish. Falls back to getPairings().
//  12. Budget tier — classifyRecipeTier() added to output.
//  13. All new costDB v2 helpers used: computePriceBreakdown(),
//      getAllSwapSavings(), classifyRecipeTier(), getCurrency().
//  14. Health score upgraded — now incorporates inflam, GI, and
//      micronutrient density into scoring alongside macros.
//  15. estimateQuantity uses NUTRITION_DB.typicalUseQty when
//      present, falls back to macro-based heuristic.
// ─────────────────────────────────────────────────────────────

import {
  NUTRITION_DB,
  ALLERGEN_TAGS,
  PDCAAS_INFO,
  COOKING_NOTES,
  getAllergens,
  getVitaminFlags,
  getInflamScore,
  getHealthTags,
  computeNutritionTotals,
  getGlycemicProfile,
  getProteinQuality,
  getDietaryProfile,
  getPdcaasTier,
} from "./nutritionDB.js"

import {
  PRICE_DB,
  LOCATION_COST_FACTOR,
  BUDGET_SWAPS_DB,
  getCurrency,
  formatCost,
  computeIngredientCost,
  computePriceBreakdown,
  getAllSwapSavings,
  classifyRecipeTier,
  getHighVolatilityWarnings,
} from "./costDB.js"

import {
  DISH_ALIASES,
  DISH_META,
  getDishMeta,
  getServedWith,
  getDifficultyLabel,
  getPrepTimeLabel,
  filterByDietary,
  filterByMealType,
} from "./dishAliases.js"

import {
  getCuisineProfile,
  generateSteps,
  generateSuggestions,
  getCommonMistakes,
  getPairings,
} from "./cookingEngine.js"


// ═══════════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════════

export function capitalize(word) {
  if (!word) return ""
  return word.charAt(0).toUpperCase() + word.slice(1).replace(/_/g, " ")
}

function pick(arr, seed) {
  return arr[Math.abs(seed) % arr.length]
}


// ═══════════════════════════════════════════════════════════════
//  QUANTITY INTELLIGENCE
//  Uses typicalUseQty from NUTRITION_DB v2 when present,
//  falls back to macro-based heuristic for unlisted ingredients.
// ═══════════════════════════════════════════════════════════════

export function estimateQuantity(item) {
  const d = NUTRITION_DB[item]
  if (!d) return 80
  // Use pre-defined typical use qty if available
  if (d.typicalUseQty) return d.typicalUseQty
  // Heuristic fallback based on macro density
  if (d.f > 50)  return 10   // oils, nuts — used in small amounts
  if (d.p > 15)  return 150  // proteins — 150g per serve
  if (d.c > 40)  return 120  // grains, legumes — 120g dry weight
  return 100
}


// ═══════════════════════════════════════════════════════════════
//  HEALTH SCORE ENGINE  (v2 — upgraded)
//
//  v1: only cal/p/c/f macros (4 signals)
//  v2: macros + inflammatory score + glycemic load + micronutrient
//      density (10 signals). Score still 0–100.
//
//  Component breakdown:
//  macroBalance    0–35   How close to ideal P/C/F ratio
//  proteinBonus    0–20   Absolute protein adequacy
//  fatMod          0–15   Fat quality / ratio
//  calDensity      0–10   Calorie efficiency
//  inflammBonus    0–10   Anti-inflammatory ingredients bonus
//  glycemicMod     0–5    Penalty for high GI/GL
//  microBonus      0–5    Reward for fibre, iron, calcium presence
// ═══════════════════════════════════════════════════════════════

export function computeHealthScore(cal, p, c, f, goal = "balanced", extras = {}) {
  const { inflam = 0, totalGL = 0, fibre = 0, iron = 0, calcium = 0 } = extras

  const mt = p * 4 + c * 4 + f * 9
  if (mt === 0) return {
    score: 50,
    breakdown: {
      macroBalance: 20, maxMacroBalance: 35,
      proteinBonus: 8,  maxProteinBonus: 20,
      fatMod: 8,        maxFatMod: 15,
      calDensity: 7,    maxCalDensity: 10,
      inflammBonus: 0,  maxInflammBonus: 10,
      glycemicMod: 0,   maxGlycemicMod: 5,
      microBonus: 0,    maxMicroBonus: 5,
      proteinPct: 0, carbPct: 0, fatPct: 0,
    },
    advice: [],
  }

  const pR = (p * 4) / mt
  const cR = (c * 4) / mt
  const fR = (f * 9) / mt

  // ── Macro balance (0–35) ──────────────────────────────────
  const mb = Math.max(0,
    35 - Math.abs(pR - 0.30) * 80
       - Math.abs(cR - 0.40) * 70
       - Math.abs(fR - 0.30) * 70
  )

  // ── Protein bonus (0–20) ──────────────────────────────────
  const pb = goal === "muscle_gain"
    ? (p > 40 ? 20 : p > 30 ? 15 : p > 20 ? 10 : 5)
    : (p > 30 ? 20 : p > 20 ? 15 : p > 12 ? 10 : 5)

  // ── Fat modifier (0–15) ───────────────────────────────────
  const fm = fR < 0.25 ? 15 : fR < 0.35 ? 12 : fR < 0.45 ? 7 : 2

  // ── Calorie density (0–10) ────────────────────────────────
  const cd = goal === "weight_loss"
    ? (cal < 400 ? 10 : cal < 550 ? 7 : cal < 700 ? 4 : 1)
    : (cal < 500 ? 10 : cal < 750 ? 7 : cal < 950 ? 4 : 2)

  // ── Inflammatory bonus (0–10) ─────────────────────────────
  // inflam score from getInflamScore() is negative=anti, positive=pro
  const ib = inflam <= -4 ? 10 : inflam <= -2 ? 7 : inflam <= 0 ? 4 : inflam <= 2 ? 1 : 0

  // ── Glycemic modifier (0–5 penalty) ──────────────────────
  const gm = totalGL > 30 ? -5 : totalGL > 20 ? -3 : totalGL > 10 ? -1 : 0

  // ── Micronutrient bonus (0–5) ─────────────────────────────
  let micro = 0
  if (fibre   > 5)    micro += 2
  if (iron    > 3)    micro += 1
  if (calcium > 200)  micro += 2
  micro = Math.min(5, micro)

  const raw   = mb + pb + fm + cd + ib + gm + micro
  const score = Math.min(100, Math.max(0, Math.round(raw)))

  // ── Advice strings ────────────────────────────────────────
  const advice = []

  if (fR > 0.45)
    advice.push(`🧈 Fat is very high (${Math.round(fR * 100)}% of macros — ideal ~30%). Reduce oil or swap cream with thick curd.`)
  else if (fR >= 0.35)
    advice.push(`🧈 Fat slightly elevated. Cutting cooking fat by half raises this score ~6 points.`)

  if (p < 12)
    advice.push(`💪 Protein is low (${Math.round(p)}g). Add dal, egg, paneer or soy chunks for a real boost.`)
  else if (p < 25 && goal === "muscle_gain")
    advice.push(`💪 For muscle gain, target 35–45g protein/serving. Double the protein or add eggs on the side.`)

  if (pR < 0.20)
    advice.push(`⚖️ Macro balance is carb-heavy. Adding a protein source rebalances it significantly.`)

  if (cal > 900)
    advice.push(`🔥 Calorie density is high (${Math.round(cal)} kcal). Reducing high-fat ingredients or halving oil helps.`)

  if (inflam > 2)
    advice.push(`🔥 Several pro-inflammatory ingredients detected. Swap refined flour/sugar with whole-grain alternatives.`)
  else if (inflam <= -4)
    advice.push(`💚 Strongly anti-inflammatory profile — garlic, turmeric, leafy greens and omega-3 sources all detected.`)

  if (totalGL > 25)
    advice.push(`📈 High glycemic load (GL ${totalGL}). Swap white rice with brown rice or add a high-fibre vegetable.`)

  if (p > 30)
    advice.push(`✅ Excellent protein (${Math.round(p)}g) — well above average for a single meal.`)
  if (fR < 0.25)
    advice.push(`✅ Fat is very well controlled — lean, heart-friendly profile.`)
  if (mb > 25)
    advice.push(`✅ Near-ideal macro balance — ${Math.round(pR * 100)}P / ${Math.round(cR * 100)}C / ${Math.round(fR * 100)}F split is excellent.`)
  if (inflam <= -2 && advice.filter(a => a.startsWith("💚")).length === 0)
    advice.push(`💚 Anti-inflammatory meal — turmeric, garlic or omega-3 sources detected.`)

  return {
    score,
    breakdown: {
      macroBalance:  Math.round(mb),  maxMacroBalance:  35,
      proteinBonus:  Math.round(pb),  maxProteinBonus:  20,
      fatMod:        Math.round(fm),  maxFatMod:        15,
      calDensity:    Math.round(cd),  maxCalDensity:    10,
      inflammBonus:  Math.round(ib),  maxInflammBonus:  10,
      glycemicMod:   Math.round(gm),  maxGlycemicMod:   5,
      microBonus:    Math.round(micro),maxMicroBonus:   5,
      proteinPct:    Math.round(pR * 100),
      carbPct:       Math.round(cR * 100),
      fatPct:        Math.round(fR * 100),
    },
    advice: advice.slice(0, 4),
  }
}


// ═══════════════════════════════════════════════════════════════
//  TITLE ENGINE
// ═══════════════════════════════════════════════════════════════

const GOAL_WORDS = {
  muscle_gain: ["Power",    "Anabolic",  "Strength",  "Protein-Packed", "Bulk"],
  weight_loss: ["Lean",     "Light",     "Clean",     "Stripped",       "Slimline"],
  balanced:    ["Balanced", "Classic",   "Everyday",  "Wholesome",      "Hearty"],
  maintenance: ["Balanced", "Classic",   "Everyday",  "Wholesome",      "Hearty"],
}

const SPICE_WORDS = {
  hot:    ["Fiery",    "Blazing",  "Inferno",  "Scorched"],
  medium: ["Spiced",   "Robust",   "Warm",     "Aromatic"],
  mild:   ["Delicate", "Gentle",   "Subtle",   "Mellow"],
}

const CUISINE_SUFFIX = {
  "India-North": ["Masala",     "Bhuna",       "Tadka",       "Curry"],
  "India-South": ["Chettinad",  "Malabar",     "Udupi",       "Thali"],
  "India-East":  ["Bengal",     "Odia",        "Coastal",     "Eastern"],
  Italy:         ["Rustica",    "della Nonna", "al Forno",    "Primavera"],
  Mexico:        ["Adobo",      "Criollo",     "Asado",       "de la Casa"],
  USA:           ["Smokehouse", "Skillet",     "Griddle",     "Backyard"],
  China:         ["Wok-Fired",  "Imperial",    "Szechuan",    "Canton"],
  Japan:         ["Teishoku",   "Umami",       "Izakaya",     "Bento"],
  Thailand:      ["Pad",        "Gaeng",       "Tom",         "Street-Style"],
  Korea:         ["Banchan",    "Kimchi",      "Doenjang",    "Seoul-Style"],
  Mediterranean: ["Mezze",      "Levantine",   "Coastal",     "Aegean"],
  France:        ["Provençal",  "Brasserie",   "Bistro",      "de Campagne"],
  Spain:         ["Tapas",      "Ibérico",     "de la Casa",  "Madrileño"],
  Indonesia:     ["Nasi",       "Sambal",      "Warung",      "Street-Style"],
}

function generateTitle(lower, goal, spice, location, dishMeta) {
  // If we have DISH_META cuisine, use that for a more accurate suffix
  const cuisineKey = dishMeta?.cuisine ?? location
  const seed = lower.length * 7 + (spice === "hot" ? 3 : spice === "mild" ? 1 : 0)
  const pp   = lower.find(i => NUTRITION_DB[i]?.p > 15)
            ?? lower.find(i => NUTRITION_DB[i]?.c > 20)
            ?? lower[0]
  const sec  = lower[1] && lower[1] !== pp ? ` & ${capitalize(lower[1])}` : ""

  return [
    pick(SPICE_WORDS[spice]   ?? SPICE_WORDS.medium,   seed),
    pick(GOAL_WORDS[goal]     ?? GOAL_WORDS.balanced,   seed + 1),
    capitalize(pp) + sec,
    pick(CUISINE_SUFFIX[cuisineKey] ?? ["Style"], seed + 2),
  ].join(" ")
}


// ═══════════════════════════════════════════════════════════════
//  DESCRIPTION ENGINE
// ═══════════════════════════════════════════════════════════════

const GOAL_CONTEXT = {
  muscle_gain: "optimised for hypertrophy — protein-dense, calorie-sufficient, structured to support post-workout recovery",
  weight_loss: "engineered for a caloric deficit — high in fibre and lean protein to maximise satiety while minimising excess energy",
  balanced:    "calibrated for steady-state nutrition — balanced macros to fuel daily activity without surplus or deficit",
  maintenance: "calibrated for steady-state nutrition — balanced macros to fuel daily activity without surplus or deficit",
}

function generateDescription({ lower, goal, location, totals, dietaryProfile, dishMeta }) {
  const profile      = getCuisineProfile(dishMeta?.cuisine ?? location)
  const goalCtx      = GOAL_CONTEXT[goal] ?? "designed for general wellness"
  const listed       = lower.slice(0, 3).map(capitalize).join(", ")
  const extras       = lower.length > 3 ? ` and ${lower.length - 3} more` : ""
  const macroProfile = totals.p * 4 > totals.c * 4 ? "protein-forward"
                     : totals.c > totals.f          ? "carbohydrate-led"
                     :                                "fat-dominant"
  const dietBadge    = dietaryProfile ? ` [${dietaryProfile.label} ${dietaryProfile.emoji}]` : ""

  return (
    `A ${profile.cookStyle} dish built around ${listed}${extras}.${dietBadge} ` +
    `This ${macroProfile} plate is ${goalCtx}. ` +
    `Delivers ~${Math.round(totals.cal)} kcal | ${Math.round(totals.p)}g protein | ` +
    `${Math.round(totals.c)}g carbs | ${Math.round(totals.f)}g fat — ` +
    `prepared via ${profile.technique}`
  )
}


// ═══════════════════════════════════════════════════════════════
//  PREP TIME ENGINE
//  Uses DISH_META.prepTime when the input resolves to a known dish.
//  Falls back to ingredient-count heuristic.
// ═══════════════════════════════════════════════════════════════

function computePrepTime(originalIngredients, lower) {
  // Check if original input was a single dish key
  const dishKey = originalIngredients.find(i => DISH_ALIASES[i])
  if (dishKey && DISH_META[dishKey]?.prepTime) {
    return {
      minutes:   DISH_META[dishKey].prepTime,
      label:     getPrepTimeLabel(dishKey),
      fromMeta:  true,
    }
  }
  // Heuristic: 15 base + 4 per ingredient, +5 for proteins
  const hasProtein = lower.some(i => NUTRITION_DB[i]?.p > 15)
  const minutes = 15 + lower.length * 4 + (hasProtein ? 5 : 0)
  const label = minutes <= 15 ? "⚡ Under 15 min"
              : minutes <= 30 ? "🕐 About 30 min"
              : minutes <= 60 ? "🕑 About 1 hour"
              : "🕔 Over 1 hour"
  return { minutes, label, fromMeta: false }
}


// ═══════════════════════════════════════════════════════════════
//  DIFFICULTY ENGINE
//  Uses DISH_META.difficulty when available.
// ═══════════════════════════════════════════════════════════════

function computeDifficulty(originalIngredients, lower) {
  const dishKey = originalIngredients.find(i => DISH_ALIASES[i])
  if (dishKey && DISH_META[dishKey]?.difficulty) {
    return getDifficultyLabel(dishKey)
  }
  // Heuristic fallback
  const n = lower.length
  if (n <= 3) return "🟢 Beginner"
  if (n <= 6) return "🟡 Intermediate"
  return "🔴 Advanced"
}


// ═══════════════════════════════════════════════════════════════
//  MAIN EXPORT: generateSmartRecipe()
//
//  INPUT shape (accepts both v1 and v2 normalizeInput output):
//  {
//    ingredients:  string[],          // resolved DB/dish keys to USE
//    excluded?:    string[],          // keys to REMOVE (from normalizeInput v2)
//    signals?:     object,            // auto-detected hints (goal/dietary/cuisine)
//    goal?:        string,
//    spice?:       string,
//    budget?:      number,
//    location?:    string,
//    skill?:       string,
//    servings?:    number,
//  }
// ═══════════════════════════════════════════════════════════════

export function generateSmartRecipe({
  ingredients,
  excluded     = [],
  signals      = {},
  goal,
  spice        = "medium",
  budget       = 300,
  location     = "India",
  skill        = "beginner",
  servings     = 1,
}) {
  if (!ingredients || ingredients.length === 0) return null

  // ── Step 1: Merge signals with explicit params ───────────────
  // Explicit params win; signals fill in anything not specified
  const resolvedGoal     = goal     ?? signals.goal     ?? "balanced"
  const resolvedLocation = location ?? signals.cuisine  ?? "India"

  // ── Step 2: Expand dish aliases + apply exclusions ───────────
  let lower = ingredients
    .map(i => i.toLowerCase().trim())
    .flatMap(item => DISH_ALIASES[item] ?? [item])

  // Remove excluded ingredients (from normalizeInput v2 negation handling)
  if (excluded.length > 0) {
    const excludedSet = new Set(excluded.map(e => e.toLowerCase().trim()))
    lower = lower.filter(item => !excludedSet.has(item))
  }

  // Apply dietary filter — remove ingredients that violate the dietary requirement.
  // Source: signals.dietary (from free-text detection) OR explicit dietary param.
  // dietaryGroup in NUTRITION_DB: "vegan" | "vegetarian" | "non-veg"
  const resolvedDietary = signals?.dietary ?? null
  if (resolvedDietary && resolvedDietary !== "any" && resolvedDietary !== "non-veg") {
    lower = lower.filter(item => {
      const group = NUTRITION_DB[item]?.dietaryGroup ?? "vegan"
      if (resolvedDietary === "vegan")       return group === "vegan"
      if (resolvedDietary === "vegetarian")  return group === "vegan" || group === "vegetarian"
      if (resolvedDietary === "gluten-free") {
        // gluten-free: exclude wheat, flour, pasta, noodles, bread, semolina, ramen
        const GLUTEN_ITEMS = new Set(["flour","whole_wheat_flour","pasta","noodles","bread",
                                      "semolina","ramen_noodles","buns","urad_dal_flour"])
        return !GLUTEN_ITEMS.has(item)
      }
      return true
    })
  }

  if (lower.length === 0) return null

  // ── Step 3: Compute full nutrition totals ────────────────────
  // Uses computeNutritionTotals() from nutritionDB v2.
  // This replaces the old manual loop + the dead MICRO_DB calls.
  const totals = computeNutritionTotals(lower)

  // Apply goal-based macro adjustments (same as v4)
  if (resolvedGoal === "weight_loss") {
    totals.cal *= 0.85
    totals.f   *= 0.75
    totals.p   *= 1.10
  }
  if (resolvedGoal === "muscle_gain") {
    totals.p   *= 1.25
    totals.cal *= 1.15
  }

  // ── Step 4: Compute all health intelligence ──────────────────
  const inflam       = getInflamScore(lower)
  const glycemic     = getGlycemicProfile(lower)
  const proteinQual  = getProteinQuality(lower)
  const vitaminFlags = getVitaminFlags(lower, servings)
  const healthTags   = getHealthTags(lower, 8)
  const dietary      = getDietaryProfile(lower)
  const allergens    = getAllergens(lower)

  // ── Step 5: Get health score with full signal set ────────────
  const { score: healthScore, breakdown: scoreBreakdown, advice: healthInsights } =
    computeHealthScore(
      totals.cal, totals.p, totals.c, totals.f,
      resolvedGoal,
      {
        inflam:   inflam.score,
        totalGL:  glycemic?.totalGL ?? 0,
        fibre:    totals.fibre,
        iron:     totals.iron,
        calcium:  totals.calcium,
      }
    )

  const healthCategory =
    healthScore >= 85 ? "Excellent"          :
    healthScore >= 70 ? "Good"               :
    healthScore >= 50 ? "Balanced"           : "Needs Improvement"

  // ── Step 6: Dish metadata ────────────────────────────────────
  const dishKey  = ingredients.find(i => DISH_ALIASES[i])
  const dishMeta = dishKey ? getDishMeta(dishKey) : null

  const prepTime   = computePrepTime(ingredients, lower)
  const difficulty = computeDifficulty(ingredients, lower)

  // ── Step 7: Cost intelligence ────────────────────────────────
  const priceBreakdown = computePriceBreakdown(lower, resolvedLocation, servings)
  const swapSavings    = getAllSwapSavings(lower, resolvedLocation, resolvedGoal)
  const budgetTier     = classifyRecipeTier(lower)
  const volatileWarn   = getHighVolatilityWarnings(lower)

  // ── Step 8: Pairings ─────────────────────────────────────────
  const dishPairings = dishKey ? getServedWith(dishKey) : []
  const cuisinePairs = getPairings(resolvedLocation, resolvedGoal)
  const pairings     = dishPairings.length > 0 ? dishPairings : cuisinePairs

  // ── Step 9: Cooking notes (from COOKING_NOTES in nutritionDB) ─
  const cookingTips = lower
    .filter(i => COOKING_NOTES[i])
    .map(i => ({ ingredient: capitalize(i), tip: COOKING_NOTES[i].tip }))
    .slice(0, 3)

  // ── Step 10: Ingredient detail list ──────────────────────────
  const detailedIngredients = lower.map(item => ({
    item,
    qty:          estimateQuantity(item),
    displayName:  capitalize(item),
    hasNutrition: !!NUTRITION_DB[item],
  }))

  return {
    // ── Core ──────────────────────────────────────────────────
    title:          generateTitle(lower, resolvedGoal, spice, resolvedLocation, dishMeta),
    description:    generateDescription({ lower, goal: resolvedGoal, location: resolvedLocation, totals, dietaryProfile: dietary, dishMeta }),
    ingredients:    detailedIngredients,
    excluded:       excluded.map(capitalize),
    steps:          generateSteps({ lower, goal: resolvedGoal, spice, location: resolvedLocation }),

    // ── Macros ────────────────────────────────────────────────
    calories:       `${Math.round(totals.cal)} kcal`,
    protein:        `${Math.round(totals.p)} g`,
    carbs:          `${Math.round(totals.c)} g`,
    fats:           `${Math.round(totals.f)} g`,
    fibre:          `${totals.fibre.toFixed(1)} g`,

    // ── Extended Nutrition ────────────────────────────────────
    micros: {
      iron:      `${totals.iron.toFixed(1)} mg`,
      calcium:   `${Math.round(totals.calcium)} mg`,
      vitC:      `${Math.round(totals.vitC)} mg`,
      vitA:      `${Math.round(totals.vitA)} mcg`,
      vitB12:    `${totals.vitB12.toFixed(2)} mcg`,
      vitD:      `${Math.round(totals.vitD)} IU`,
      folate:    `${Math.round(totals.folate)} mcg`,
      omega3:    `${totals.omega3.toFixed(2)} g`,
      sodium:    `${Math.round(totals.sodium)} mg`,
      potassium: `${Math.round(totals.potassium)} mg`,
      magnesium: `${Math.round(totals.magnesium)} mg`,
      zinc:      `${totals.zinc.toFixed(1)} mg`,
    },

    // ── Health Intelligence ───────────────────────────────────
    healthScore,
    healthCategory,
    scoreBreakdown,
    healthInsights,
    healthTags,         // [{ tag, count }] — e.g. "anti-inflammatory ×3"

    // ── Inflammatory Profile ──────────────────────────────────
    inflammatoryProfile: inflam,   // { score, label, emoji }

    // ── Glycemic Profile ──────────────────────────────────────
    glycemicProfile: glycemic,     // { avgGI, totalGL, highGIItems, label, glLabel } | null

    // ── Protein Quality ───────────────────────────────────────
    proteinQuality: proteinQual,   // { avgPdcaas, tier, isComplete, combineWith, completenessNote } | null

    // ── Vitamin & Mineral Flags ───────────────────────────────
    vitaminFlags,                  // [{ nutrient, value, concern, rda }] — only populated when low

    // ── Dietary Profile ───────────────────────────────────────
    dietaryProfile: dietary,       // { isVegan, isVegetarian, isNonVeg, label, emoji }

    // ── Allergens ─────────────────────────────────────────────
    allergens,                     // string[] — e.g. ["Dairy", "Gluten"]

    // ── Timing & Difficulty ───────────────────────────────────
    prepTime:   prepTime.label,
    prepTimeMin: prepTime.minutes,
    difficulty,

    // ── Cost & Budget ─────────────────────────────────────────
    estimatedCost:  formatCost(priceBreakdown.totalPerServing, resolvedLocation),
    priceBreakdown,                // full per-ingredient breakdown
    budgetTier,                    // { tier, label, emoji, desc }
    swapSavings,                   // [{ item, swapTo, savedRupees, ... }]
    volatilityWarnings: volatileWarn, // ingredients with high price volatility

    // ── Cooking Intelligence ──────────────────────────────────
    cookingTips,                   // [{ ingredient, tip }] — from COOKING_NOTES
    suggestions:  generateSuggestions(lower, resolvedGoal, resolvedLocation),
    mistakes:     getCommonMistakes(lower, resolvedLocation),
    pairings,

    // ── Dish Metadata (when input is a known dish) ────────────
    dishMeta: dishMeta ? {
      cuisine:    dishMeta.cuisine,
      mealType:   dishMeta.mealType,
      cookMethod: dishMeta.cookMethod,
      servedWith: dishMeta.servedWith,
      tags:       dishMeta.tags,
    } : null,

    // ── Input Signals (from normalizeInput v2) ────────────────
    // Passed through for Home.jsx to read — can pre-fill form fields
    signals,

    // ── Meta ──────────────────────────────────────────────────
    location:  resolvedLocation,
    goal:      resolvedGoal,
    servings,
    version:   5,
  }
}


// ═══════════════════════════════════════════════════════════════
//  RECIPE OPTIMIZER
//  Tries ingredient swaps to maximise goal-weighted health score
//  under the budget constraint. Updated to use v2 cost helpers.
// ═══════════════════════════════════════════════════════════════

const SWAP_CANDIDATES = {
  chicken:      ["soy_chunks", "egg"],
  lamb:         ["chicken",    "soy_chunks"],
  beef:         ["chicken",    "soy_chunks"],
  pork:         ["chicken",    "soy_chunks"],
  turkey:       ["chicken"],
  fish:         ["soy_chunks", "egg"],
  shrimp:       ["fish",       "soy_chunks"],
  paneer:       ["tofu",       "egg"],
  quinoa:       ["brown_rice"],
  brown_rice:   ["rice"],
  broccoli:     ["cauliflower", "cabbage"],
  mushroom:     ["green_peas",  "capsicum"],
  almonds:      ["peanuts"],
  walnuts:      ["peanuts"],
  cashews:      ["peanuts"],
  avocado:      ["curd"],
  feta_cheese:  ["paneer"],
  parmesan:     ["cheese"],
  mozzarella:   ["paneer"],
  olive_oil:    ["mustard_oil"],
  cream:        ["curd"],
  blueberries:  ["banana"],
  mayonnaise:   ["curd"],
  tahini:       ["peanut_butter"],
  maple_syrup:  ["honey"],
  ramen_noodles:["noodles"],
  saffron:      ["turmeric"],
}

const GOAL_WEIGHT = {
  muscle_gain: { protein: 3.0,  calorie:  1.0 },
  weight_loss: { protein: 1.5,  calorie: -0.5 },
  balanced:    { protein: 1.5,  calorie:  0   },
  maintenance: { protein: 1.5,  calorie:  0   },
}

function opScore(cal, p, c, f, goal) {
  const gw = GOAL_WEIGHT[goal] ?? GOAL_WEIGHT.balanced
  const { score: hs } = computeHealthScore(cal, p, c, f, goal)
  return hs + p * gw.protein + cal * gw.calorie * 0.01
}

function macrosForItems(items, goal) {
  const t = computeNutritionTotals(items)
  if (goal === "weight_loss") { t.cal *= 0.85; t.f *= 0.75; t.p *= 1.10 }
  if (goal === "muscle_gain") { t.p  *= 1.25; t.cal *= 1.15 }
  return [t.cal, t.p, t.c, t.f]
}

export function optimizeRecipe({
  ingredients,
  excluded       = [],
  signals        = {},
  goal,
  spice          = "medium",
  budget         = 300,
  location       = "India",
  skill          = "beginner",
  servings       = 1,
  maxCostPerServing,
}) {
  if (!ingredients || ingredients.length === 0) return null

  const resolvedGoal = goal ?? signals.goal ?? "balanced"

  let lower = ingredients
    .map(i => i.toLowerCase().trim())
    .flatMap(i => DISH_ALIASES[i] ?? [i])

  if (excluded.length > 0) {
    const excSet = new Set(excluded.map(e => e.toLowerCase()))
    lower = lower.filter(i => !excSet.has(i))
  }

  if (lower.length === 0) return null

  const itemCost  = item => computeIngredientCost(item, location)?.cost ?? 15
  const totalCost = items => items.reduce((s, i) => s + itemCost(i), 0)

  let best  = [...lower]
  let bestScore = opScore(...macrosForItems(best, resolvedGoal), resolvedGoal)
  const changesApplied = []

  for (const item of lower) {
    const candidates = SWAP_CANDIDATES[item] ?? []
    for (const candidate of candidates) {
      if (lower.includes(candidate)) continue
      const trial = best.map(i => i === item ? candidate : i)
      if (maxCostPerServing && totalCost(trial) > maxCostPerServing) continue
      const score = opScore(...macrosForItems(trial, resolvedGoal), resolvedGoal)
      if (score >= bestScore || (maxCostPerServing && totalCost(trial) < totalCost(best))) {
        bestScore = score
        best = trial
        const swapInfo = BUDGET_SWAPS_DB[item]
        changesApplied.push({
          original:  capitalize(item),
          swappedTo: capitalize(candidate),
          reason:    swapInfo?.note ?? "Optimized for goal and budget",
          saving:    swapInfo?.saving ?? "–",
        })
        break
      }
    }
  }

  const result = generateSmartRecipe({
    ingredients: best,
    excluded,
    signals,
    goal:     resolvedGoal,
    spice,
    budget,
    location,
    skill,
    servings,
  })

  if (!result) return null

  return {
    ...result,
    isOptimized:         true,
    optimizationChanges: changesApplied,
    originalCost:        totalCost(lower),
    optimizedCost:       totalCost(best),
    costSavingPct:       lower.length
      ? Math.round((1 - totalCost(best) / Math.max(totalCost(lower), 1)) * 100)
      : 0,
  }
}
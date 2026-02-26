// ─────────────────────────────────────────────────────────────
//  generateSmartRecipe.js  (v4)
//  Split architecture — imports from:
//    ./nutritionDB.js  ./costDB.js  ./dishAliases.js  ./cookingEngine.js
//  NEW: scoreBreakdown, healthInsights, priceBreakdown, optimizeRecipe()
// ─────────────────────────────────────────────────────────────

import { NUTRITION_DB, MICRO_DB, ALLERGEN_TAGS } from "./nutritionDB.js"
import { INGREDIENT_COST, LOCATION_COST_FACTOR, BUDGET_SWAPS_DB } from "./costDB.js"
import { DISH_ALIASES } from "./dishAliases.js"
import { getCuisineProfile, generateSteps, generateSuggestions, getCommonMistakes, getPairings } from "./cookingEngine.js"

export function capitalize(word) {
  if (!word) return ""
  return word.charAt(0).toUpperCase() + word.slice(1).replace(/_/g, " ")
}
function pick(arr, seed) { return arr[Math.abs(seed) % arr.length] }

// ─── Quantity Intelligence ────────────────────────────────────
export function estimateQuantity(item) {
  const d = NUTRITION_DB[item]
  if (!d) return 80
  if (d.f > 50) return 10
  if (d.p > 15) return 150
  if (d.c > 40) return 120
  return 100
}

// ─── Health Score Engine ─────────────────────────────────────
export function computeHealthScore(cal, p, c, f, goal = "balanced") {
  const mt = p * 4 + c * 4 + f * 9
  if (mt === 0) return {
    score: 50,
    breakdown: { macroBalance:20, maxMacroBalance:40, proteinBonus:10, maxProteinBonus:25, fatMod:10, maxFatMod:20, calDensity:10, maxCalDensity:15, proteinPct:0, carbPct:0, fatPct:0 },
    advice: []
  }
  const pR = p*4/mt, cR = c*4/mt, fR = f*9/mt
  const mb = Math.max(0, 40 - Math.abs(pR-0.3)*100 - Math.abs(cR-0.4)*100 - Math.abs(fR-0.3)*100)
  const pb = p > 35 ? 25 : p > 20 ? 18 : 10
  const fm = fR < 0.35 ? 20 : fR < 0.45 ? 12 : 5
  const cd = cal < 500 ? 15 : cal < 750 ? 10 : 5
  const score = Math.min(100, Math.round(mb + pb + fm + cd))
  const advice = []
  if (fR > 0.45)        advice.push(`🧈 Fat is very high (${Math.round(fR*100)}% of macros — ideal ~30%). Reduce oil/butter or swap cream with thick curd.`)
  else if (fR >= 0.35)  advice.push(`🧈 Fat ratio slightly elevated. Cutting cooking fat by half would raise this score ~8 points.`)
  if (p < 15)           advice.push(`💪 Protein is low (${Math.round(p)}g). Adding dal, egg or soy chunks would significantly boost the score.`)
  else if (p < 25 && goal === "muscle_gain") advice.push(`💪 For muscle gain, target 30–40g protein/serving. Double the protein or add eggs on the side.`)
  if (pR < 0.2)         advice.push(`⚖️ Macro balance is carb-heavy. Adding a protein source would rebalance the ratio.`)
  if (cal > 900)        advice.push(`🔥 Calorie density is high (${Math.round(cal)} kcal). Reducing high-fat ingredients would help.`)
  if (p > 30)           advice.push(`✅ Excellent protein (${Math.round(p)}g) — well above average for a single meal.`)
  if (fR < 0.25)        advice.push(`✅ Fat is very well controlled — lean, heart-friendly meal profile.`)
  if (mb > 30)          advice.push(`✅ Near-ideal macro balance — ${Math.round(pR*100)}/${Math.round(cR*100)}/${Math.round(fR*100)} P/C/F split is excellent.`)
  return {
    score,
    breakdown: { macroBalance:Math.round(mb), maxMacroBalance:40, proteinBonus:Math.round(pb), maxProteinBonus:25, fatMod:Math.round(fm), maxFatMod:20, calDensity:Math.round(cd), maxCalDensity:15, proteinPct:Math.round(pR*100), carbPct:Math.round(cR*100), fatPct:Math.round(fR*100) },
    advice: advice.slice(0, 4)
  }
}

// ─── Price Breakdown Engine ───────────────────────────────────
export function computePriceBreakdown(lower, location, servings = 1) {
  const factor   = LOCATION_COST_FACTOR[location] ?? 1.0
  const currency = location === "USA" ? "$" : location === "Italy" ? "€" : location === "Japan" ? "¥" : "₹"
  const items = lower.map(item => {
    const qty  = estimateQuantity(item)
    const cost = Math.round((qty / 100) * (INGREDIENT_COST[item] ?? 15) * factor)
    return { item, qty, costPerServing: cost }
  })
  const totalPerServing = items.reduce((s, i) => s + i.costPerServing, 0)
  return { items, totalPerServing, totalForRecipe: Math.round(totalPerServing * servings), servings, currency }
}

// ─── Title Engine ────────────────────────────────────────────
const GOAL_WORDS     = { muscle_gain:["Power","Anabolic","Strength","Protein-Packed","Bulk"], weight_loss:["Lean","Light","Clean","Stripped","Slimline"], balanced:["Balanced","Classic","Everyday","Wholesome","Hearty"], maintenance:["Balanced","Classic","Everyday","Wholesome","Hearty"] }
const SPICE_WORDS    = { hot:["Fiery","Blazing","Inferno","Scorched"], medium:["Spiced","Robust","Warm"], mild:["Delicate","Gentle","Subtle"] }
const CUISINE_SUFFIX = { India:["Masala","Bhuna","Tadka","Curry"], Italy:["Rustica","della Nonna","al Forno","Primavera"], Mexico:["Adobo","Criollo","Asado","de la Casa"], USA:["Smokehouse","Skillet","Griddle","Backyard"], China:["Wok-Fired","Imperial","Szechuan","Canton"], Japan:["Teishoku","Umami","Izakaya","Bento"], Thailand:["Pad","Gaeng","Tom","Street-Style"] }

function generateTitle(lower, goal, spice, location) {
  const seed = lower.length * 7 + (spice === "hot" ? 3 : spice === "mild" ? 1 : 0)
  const pp   = lower.find(i => NUTRITION_DB[i]?.p > 15) || lower.find(i => NUTRITION_DB[i]?.c > 20) || lower[0]
  const sec  = lower[1] && lower[1] !== pp ? ` & ${capitalize(lower[1])}` : ""
  return `${pick(SPICE_WORDS[spice] ?? SPICE_WORDS.medium, seed)} ${pick(GOAL_WORDS[goal] ?? GOAL_WORDS.balanced, seed+1)} ${capitalize(pp)}${sec} ${pick(CUISINE_SUFFIX[location] ?? ["Style"], seed+2)}`
}

// ─── Description Engine ──────────────────────────────────────
const GOAL_CONTEXT = {
  muscle_gain:  "optimised for hypertrophy — protein-dense, calorie-sufficient, structured to support post-workout recovery",
  weight_loss:  "engineered for a caloric deficit — high in fibre and lean protein to maximise satiety while minimising excess energy",
  balanced:     "calibrated for steady-state nutrition — balanced macros to fuel daily activity without surplus or deficit",
  maintenance:  "calibrated for steady-state nutrition — balanced macros to fuel daily activity without surplus or deficit"
}

function generateDescription({ lower, goal, location, totalCal, totalP, totalC, totalF }) {
  const profile     = getCuisineProfile(location)
  const goalCtx     = GOAL_CONTEXT[goal] ?? "designed for general wellness"
  const listed      = lower.slice(0, 3).map(capitalize).join(", ")
  const extras      = lower.length > 3 ? ` and ${lower.length - 3} more` : ""
  const macroProfile = totalP > totalC ? "protein-forward" : totalC > totalF ? "carbohydrate-led" : "fat-dominant"
  return `A ${location}-inspired ${profile.cookStyle} dish built around ${listed}${extras}. This ${macroProfile} plate is ${goalCtx}. Delivers ~${Math.round(totalCal)} kcal | ${Math.round(totalP)}g protein | ${Math.round(totalC)}g carbs | ${Math.round(totalF)}g fat — prepared via ${profile.technique}`
}

// ─── Micronutrient Engine ────────────────────────────────────
function computeMicros(lower) {
  let fibre=0, iron=0, calcium=0, vitC=0, vitA=0
  lower.forEach(item => {
    const m = MICRO_DB[item]; if (!m) return
    const qty = estimateQuantity(item)
    fibre+=m.fibre*qty/100; iron+=m.iron*qty/100; calcium+=m.calcium*qty/100; vitC+=m.vitC*qty/100; vitA+=m.vitA*qty/100
  })
  return { fibre:+(fibre.toFixed(1)), iron:+(iron.toFixed(1)), calcium:Math.round(calcium), vitC:Math.round(vitC), vitA:Math.round(vitA) }
}

// ─── Allergen Engine ─────────────────────────────────────────
function detectAllergens(lower) {
  const found = new Set()
  lower.forEach(item => { const t = ALLERGEN_TAGS[item]; if (t) t.forEach(x => found.add(x)) })
  return [...found].sort()
}

// ─── Budget Engine ───────────────────────────────────────────
function estimateBudget(lower, location, budget, totalP) {
  const factor = LOCATION_COST_FACTOR[location] ?? 2.0
  const mult   = totalP > 50 ? 1.2 : totalP > 40 ? 1.1 : 1.0
  const raw    = lower.reduce((s, item) => s + (INGREDIENT_COST[item] ?? 40), 0)
  return `₹${Math.min(budget, Math.round(raw * factor * mult))}`
}

function getBudgetSwaps(lower) {
  return lower.filter(i => BUDGET_SWAPS_DB[i]).map(i => ({ ingredient: capitalize(i), ...BUDGET_SWAPS_DB[i] }))
}

// ─── MAIN EXPORT ─────────────────────────────────────────────
export function generateSmartRecipe({ ingredients, goal, spice, budget, location, skill }) {
  if (!ingredients || ingredients.length === 0) return null
  let lower = ingredients.map(i => i.toLowerCase().trim())
  lower = lower.flatMap(item => DISH_ALIASES[item] ?? [item])

  let totalCal=0, totalP=0, totalC=0, totalF=0
  const detailedIngredients = lower.map(item => {
    const qty  = estimateQuantity(item)
    const data = NUTRITION_DB[item]
    if (data) { totalCal+=data.cal*qty/100; totalP+=data.p*qty/100; totalC+=data.c*qty/100; totalF+=data.f*qty/100 }
    return { item, qty }
  })

  if (goal === "weight_loss") { totalCal*=0.85; totalF*=0.75; totalP*=1.1 }
  if (goal === "muscle_gain") { totalP*=1.25; totalCal*=1.15 }

  const { score: healthScore, breakdown: scoreBreakdown, advice: healthInsights } = computeHealthScore(totalCal, totalP, totalC, totalF, goal)
  const healthCategory = healthScore>=85?"Excellent":healthScore>=70?"Good":healthScore>=50?"Balanced":"Needs Improvement"

  return {
    title:          generateTitle(lower, goal, spice, location),
    description:    generateDescription({ lower, goal, location, totalCal, totalP, totalC, totalF }),
    ingredients:    detailedIngredients,
    steps:          generateSteps({ lower, goal, spice, location }),
    estimatedCost:  estimateBudget(lower, location, budget, totalP),
    calories:       `${Math.round(totalCal)} kcal`,
    protein:        `${Math.round(totalP)} g`,
    carbs:          `${Math.round(totalC)} g`,
    fats:           `${Math.round(totalF)} g`,
    prepTime:       `${20 + lower.length * 4} mins`,
    healthScore,
    healthCategory,
    scoreBreakdown,    // NEW: {macroBalance, proteinBonus, fatMod, calDensity, ratios}
    healthInsights,    // NEW: string[] explaining score components
    priceBreakdown: computePriceBreakdown(lower, location, 1),  // NEW
    suggestions:    generateSuggestions(lower, goal, location),
    micros:         computeMicros(lower),
    allergens:      detectAllergens(lower),
    budgetSwaps:    getBudgetSwaps(lower),
    mistakes:       getCommonMistakes(lower, location),
    pairings:       getPairings(location, goal),
    location,
    goal,
  }
}

// ─── RECIPE OPTIMIZER ────────────────────────────────────────
// "Optimize this recipe for muscle gain under ₹150 per serving."
// Tries ingredient swaps to maximise goal-weighted health score under budget.

const SWAP_CANDIDATES = {
  chicken:["soy_chunks","egg"],       lamb:["chicken","soy_chunks"],
  beef:["chicken","soy_chunks"],      pork:["chicken","soy_chunks"],
  turkey:["chicken"],                 fish:["soy_chunks","egg"],
  shrimp:["fish","soy_chunks"],       paneer:["tofu","egg"],
  quinoa:["brown_rice"],              brown_rice:["rice"],
  broccoli:["cauliflower","cabbage"], mushroom:["green_peas","capsicum"],
  almonds:["peanuts"],                walnuts:["peanuts"],
  cashews:["peanuts"],                avocado:["curd"],
  feta_cheese:["paneer"],             parmesan:["cheese"],
  mozzarella:["paneer"],              olive_oil:["mustard_oil"],
  cream:["curd"],                     blueberries:["banana"],
  mayonnaise:["curd"],                tahini:["peanut_butter"],
  maple_syrup:["honey"],              ramen_noodles:["noodles"],
  saffron:["turmeric"],
}

const GOAL_WEIGHT = {
  muscle_gain: { protein:3,   calorie: 1   },
  weight_loss:  { protein:1.5, calorie:-0.5 },
  balanced:     { protein:1.5, calorie: 0   },
  maintenance:  { protein:1.5, calorie: 0   },
}

function opScore(cal, p, c, f, goal) {
  const gw = GOAL_WEIGHT[goal] ?? GOAL_WEIGHT.balanced
  const { score: hs } = computeHealthScore(cal, p, c, f, goal)
  return hs + p * gw.protein + cal * gw.calorie * 0.01
}

export function optimizeRecipe({ ingredients, goal, spice, budget, location, skill, maxCostPerServing }) {
  if (!ingredients || ingredients.length === 0) return null
  let lower = ingredients.map(i => i.toLowerCase().trim()).flatMap(i => DISH_ALIASES[i] ?? [i])
  const factor = LOCATION_COST_FACTOR[location] ?? 1.0

  const itemCost  = item => Math.round((estimateQuantity(item)/100)*(INGREDIENT_COST[item]??15)*factor)
  const totalCost = items => items.reduce((s,i)=>s+itemCost(i),0)
  const macros    = items => {
    let cal=0,p=0,c=0,f=0
    items.forEach(item=>{const qty=estimateQuantity(item);const d=NUTRITION_DB[item];if(d){cal+=d.cal*qty/100;p+=d.p*qty/100;c+=d.c*qty/100;f+=d.f*qty/100}})
    if(goal==="weight_loss"){cal*=0.85;f*=0.75;p*=1.1}
    if(goal==="muscle_gain"){p*=1.25;cal*=1.15}
    return[cal,p,c,f]
  }

  let best = [...lower]
  let bestScore = opScore(...macros(best), goal)
  const changesApplied = []

  for (const item of lower) {
    const candidates = SWAP_CANDIDATES[item] ?? []
    for (const candidate of candidates) {
      if (lower.includes(candidate)) continue
      const trial = best.map(i => i===item ? candidate : i)
      if (maxCostPerServing && totalCost(trial) > maxCostPerServing) continue
      const score = opScore(...macros(trial), goal)
      if (score >= bestScore || (maxCostPerServing && totalCost(trial) < totalCost(best))) {
        bestScore = score
        best = trial
        changesApplied.push({
          original:  capitalize(item),
          swappedTo: capitalize(candidate),
          reason:    BUDGET_SWAPS_DB[item]?.note ?? "Optimized for goal and budget",
          saving:    BUDGET_SWAPS_DB[item]?.saving ?? "–",
        })
        break
      }
    }
  }

  const result = generateSmartRecipe({ ingredients:best, goal, spice, budget, location, skill })
  if (!result) return null
  return {
    ...result,
    isOptimized:         true,
    optimizationChanges: changesApplied,
    originalCost:        totalCost(lower),
    optimizedCost:       totalCost(best),
    costSavingPct:       lower.length ? Math.round((1-totalCost(best)/Math.max(totalCost(lower),1))*100) : 0,
  }
}
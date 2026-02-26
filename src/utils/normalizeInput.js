// ─────────────────────────────────────────────────────────────
//  normalizeInput.js  —  Smart Input Parser  (v1)
//
//  Solves three real user-experience problems:
//
//  PROBLEM 1: Spaces in dish names
//    "butter chicken"  →  recognizes as dish alias "butter_chicken"
//    "butter chicken"  →  NOT split into "butter" + "chicken"
//
//  PROBLEM 2: No commas between ingredients
//    "chicken rice garlic spinach"  →  ["chicken","rice","garlic","spinach"]
//    "cucumber carrot egg bread"    →  ["cucumber","carrot","egg","bread"]
//
//  PROBLEM 3: Plurals & common variants
//    "potatoes"   →  "potato"
//    "yogurt"     →  "curd"
//    "carrots"    →  "carrot"
//    "eggs"       →  "egg"
//    "ground beef"→  "beef"
//
//  ALGORITHM:
//  Step 1 — lowercase + trim
//  Step 2 — split by commas (if commas present) OR use phrase-greedy
//            scanner (if no commas)
//  Step 3 — for each token, run through PHRASE_MAP (multi-word known
//            patterns, sorted by word count desc so "basmati rice"
//            matches before "rice"), then VARIANT_MAP (singular/alias)
//  Step 4 — return clean array of DB-ready keys
// ─────────────────────────────────────────────────────────────

// ── All dish aliases and multi-word ingredient phrases ────────
// Keys are human-typed variants → values are the NUTRITION_DB key
// (or underscore dish alias key for DISH_ALIASES)
// Sorted longest-first at runtime so greedy scan works correctly.
const PHRASE_MAP = {
  // ── Dish aliases (multi-word → underscore key used in DISH_ALIASES) ──
  "butter chicken":          "butter_chicken",
  "chicken biryani":         "chicken_biryani",
  "mutton biryani":          "mutton_biryani",
  "veg biryani":             "veg_biryani",
  "egg biryani":             "egg_biryani",
  "palak paneer":            "palak_paneer",
  "paneer butter masala":    "paneer_butter_masala",
  "kadai paneer":            "kadai_paneer",
  "malai kofta":             "malai_kofta",
  "shahi paneer":            "shahi_paneer",
  "matar paneer":            "matar_paneer",
  "daal makhani":            "daal_makhani",
  "dal makhani":             "daal_makhani",
  "chole bhature":           "chole_bhature",
  "aloo paratha":            "aloo_paratha",
  "rajma chawal":            "rajma_chawal",
  "pav bhaji":               "pav_bhaji",
  "aloo gobi":               "aloo_gobi",
  "bhindi masala":           "bhindi_masala",
  "dum aloo":                "dum_aloo",
  "vada pav":                "vada_pav",
  "shahi tukda":             "shahi_tukda",
  "sabudana khichdi":        "sabudana_khichdi",
  "keema matar":             "keema_matar",
  "gajar halwa":             "gajar_halwa",
  "fish curry":              "fish_curry",
  "fish molee":              "fish_molee",
  "kerala prawn":            "kerala_prawn",
  "chicken curry":           "chicken_curry",
  "mutton curry":            "mutton_curry",
  "chicken stew":            "chicken_stew",
  "chicken 65":              "chicken_65",
  "chicken tikka":           "chicken_tikka",
  "paneer tikka":            "paneer_tikka",
  "chicken shawarma":        "chicken_shawarma",
  "honey garlic chicken":    "honey_garlic_chicken",
  "rogan josh":              "rogan_josh",
  "laal maas":               "laal_maas",
  "baingan bharta":          "baingan_bharta",
  "baingan fry":             "baingan_fry",
  "thai green curry":        "thai_green_curry",
  "miso soup":               "miso_soup",
  "pasta carbonara":         "pasta_carbonara",
  "spaghetti bolognese":     "spaghetti_bolognese",
  "pizza margherita":        "pizza_margherita",
  "hakka noodles":           "hakka_noodles",
  "fried rice":              "fried_rice",
  "egg fried rice":          "egg_fried_rice",
  "tom yum soup":            "tom_yum_soup",
  "pad thai":                "pad_thai",
  "greek salad":             "greek_salad",
  "caesar salad":            "caesar_salad",
  "quinoa salad":            "quinoa_salad",
  "avocado toast":           "avocado_toast",
  "shrimp scampi":           "shrimp_scampi",
  "beef stir fry":           "beef_stir_fry",
  "beef burger":             "beef_burger",
  "veggie burger":           "veggie_burger",
  "egg salad":               "egg_salad",
  "lemon rice":              "lemon_rice",
  "masala dosa":             "masala_dosa",
  "pork vindaloo":           "pork_vindaloo",
  "roast turkey":            "roast_turkey",
  "fish and chips":          "fish_and_chips",
  "smoothie bowl":           "smoothie_bowl",
  "french toast":            "french_toast",
  "mushroom risotto":        "mushrooms_risotto",
  "mushrooms risotto":       "mushrooms_risotto",
  "shepherds pie":           "shepherds_pie",
  "shepherd's pie":          "shepherds_pie",
  "sushi rolls":             "sushi_rolls",
  "lentil soup":             "lentil_soup",
  "bibimbap":                "bibimbap",
  "okonomiyaki":             "okonomiyaki",
  "ratatouille":             "ratatouille",
  "lasagna":                 "lasagna",
  "pancakes":                "pancakes",
  "waffles":                 "waffles",
  "oatmeal":                 "oatmeal",
  "hummus":                  "hummus",
  "falafel":                 "falafel",
  "guacamole":               "guacamole",
  "tacos":                   "tacos",
  "fajitas":                 "fajitas",
  "shawarma":                "shawarma",
  "ramen":                   "ramen",
  "pho":                     "pho",
  "laksa":                   "laksa",
  "rasam":                   "rasam",
  "sambar":                  "sambar",
  "kheer":                   "kheer",
  "dalma":                   "dalma",
  "khichdi":                 "khichdi",
  "pongal":                  "pongal",
  "dosa":                    "dosa",
  "idli":                    "idli",
  "upma":                    "upma",
  "poha":                    "poha",
  "dhokla":                  "dhokla",
  "haleem":                  "haleem",
  "nihari":                  "nihari",

  // ── Multi-word ingredients → canonical DB key ─────────────
  "basmati rice":            "rice",
  "brown rice":              "brown_rice",
  "rice noodles":            "rice_noodles",
  "ramen noodles":           "ramen_noodles",
  "sweet potato":            "sweet_potato",
  "sweet potatoes":          "sweet_potato",
  "raw banana":              "raw_banana",
  "raw bananas":             "raw_banana",
  "toor dal":                "toor_dal",
  "arhar dal":               "toor_dal",
  "moong dal":               "moong_dal",
  "mung dal":                "moong_dal",
  "urad dal":                "urad_dal",
  "chana dal":               "chana_dal",
  "masoor dal":              "masoor_dal",
  "red lentils":             "masoor_dal",
  "green peas":              "green_peas",
  "kidney beans":            "rajma",
  "red kidney beans":        "rajma",
  "black urad dal":          "urad_dal",
  "soy chunks":              "soy_chunks",
  "peanut butter":           "peanut_butter",
  "olive oil":               "olive_oil",
  "mustard oil":             "mustard_oil",
  "sesame oil":              "sesame_oil",
  "coconut milk":            "coconut_milk",
  "ground beef":             "beef",
  "minced beef":             "beef",
  "minced meat":             "beef",
  "ground pork":             "pork",
  "bell pepper":             "capsicum",
  "bell peppers":            "capsicum",
  "feta cheese":             "feta_cheese",
  "whole wheat flour":       "whole_wheat_flour",
  "wheat flour":             "whole_wheat_flour",
  "maple syrup":             "maple_syrup",
  "soy sauce":               "soy_sauce",
  "black pepper":            "black_pepper",
  "mustard seeds":           "mustard_seeds",
  "brown rice":              "brown_rice",
  "spring onion":            "spring_onion",
  "green onion":             "spring_onion",
  "scallion":                "spring_onion",
}

// ── Single-word variant / plural normalizations ───────────────
const VARIANT_MAP = {
  // Plurals
  "potatoes":    "potato",
  "tomatoes":    "tomato",
  "carrots":     "carrot",
  "onions":      "onion",
  "eggs":        "egg",
  "almonds":     "almonds",
  "peanuts":     "peanuts",
  "mushrooms":   "mushroom",
  "bananas":     "banana",
  "blueberries": "blueberries",

  // Common aliases
  "yogurt":      "curd",
  "dahi":        "curd",
  "curd":        "curd",
  "lentils":     "masoor_dal",
  "lentil":      "masoor_dal",
  "ghee":        "ghee",
  "paneer":      "paneer",
  "tofu":        "tofu",
  "shrimp":      "shrimp",
  "prawns":      "shrimp",
  "prawn":       "shrimp",
  "mutton":      "lamb",
  "lamb":        "lamb",
  "capsicum":    "capsicum",
  "eggplant":    "eggplant",
  "aubergine":   "eggplant",
  "brinjal":     "eggplant",
  "zucchini":    "zucchini",
  "courgette":   "zucchini",
  "okra":        "okra",
  "ladyfinger":  "okra",
  "chickpeas":   "chickpeas",
  "chickpea":    "chickpeas",
  "garbanzo":    "chickpeas",
  "rajma":       "rajma",
  "peas":        "green_peas",
  "pasta":       "pasta",
  "spaghetti":   "pasta",
  "penne":       "pasta",
  "noodles":     "noodles",
  "flour":       "flour",
  "sugar":       "sugar",
  "honey":       "honey",
  "butter":      "butter",
  "milk":        "milk",
  "cream":       "cream",
  "cheese":      "cheese",
  "bread":       "bread",
  "rice":        "rice",
  "chicken":     "chicken",
  "fish":        "fish",
  "beef":        "beef",
  "pork":        "pork",
  "turkey":      "turkey",
  "egg":         "egg",
  "spinach":     "spinach",
  "carrot":      "carrot",
  "tomato":      "tomato",
  "onion":       "onion",
  "garlic":      "garlic",
  "ginger":      "ginger",
  "potato":      "potato",
  "avocado":     "avocado",
  "banana":      "banana",
  "oats":        "oats",
  "quinoa":      "quinoa",
  "oil":         "olive_oil",
  "cucumber":    "cucumber",
  "lettuce":     "lettuce",
  "broccoli":    "broccoli",
  "cauliflower": "cauliflower",
  "mushroom":    "mushroom",
  "semolina":    "semolina",
  "pumpkin":     "pumpkin",
  "papaya":      "papaya",
  "lemon":       "lemon",
  "lime":        "lime",
  "tahini":      "tahini",
  "mayonnaise":  "mayonnaise",
  "mayo":        "mayonnaise",
  "coriander":   "coriander",
  "cilantro":    "coriander",
  "turmeric":    "turmeric",
  "cumin":       "cumin",
  "almonds":     "almonds",
  "walnuts":     "walnuts",
  "cashews":     "cashews",
  "peanuts":     "peanuts",
  "blueberries": "blueberries",
  "olives":      "olives",
  "vinegar":     "vinegar",
  "bread":       "bread",
  "buns":        "buns",
}

// ── Build sorted phrase list (longest phrase first) ───────────
// This ensures "paneer butter masala" matches before "butter" alone.
const SORTED_PHRASES = Object.keys(PHRASE_MAP)
  .sort((a, b) => b.split(" ").length - a.split(" ").length || b.length - a.length)

// ── Core normalizer for a single raw token ────────────────────
function normalizeToken(raw) {
  const t = raw.toLowerCase().trim().replace(/[^a-z0-9_ ]/g, "")
  if (!t) return null
  // Check underscore form first (user typed correctly already)
  if (PHRASE_MAP[t.replace(/_/g, " ")]) return PHRASE_MAP[t.replace(/_/g, " ")]
  // Check variant map
  return VARIANT_MAP[t] ?? (t.replace(/ /g, "_")) // fall back to underscore-ified form
}

// ── Greedy phrase scanner for space-only (no comma) input ─────
// Scans left-to-right through words, trying the longest known
// phrase at each position before falling back to single words.
function greedyScan(text) {
  const words   = text.toLowerCase().trim().split(/\s+/)
  const results = []
  let i = 0

  while (i < words.length) {
    let matched = false

    // Try longest phrase down to single word
    for (const phrase of SORTED_PHRASES) {
      const phraseWords = phrase.split(" ")
      const len         = phraseWords.length
      if (i + len > words.length) continue

      const candidate = words.slice(i, i + len).join(" ")
      if (candidate === phrase) {
        const mapped = PHRASE_MAP[phrase]
        if (mapped) results.push(mapped)
        i += len
        matched = true
        break
      }
    }

    if (!matched) {
      const word = words[i]
      const norm = VARIANT_MAP[word] ?? word
      if (norm) results.push(norm)
      i++
    }
  }

  return results
}

// ── Main export — call this instead of .split(",") ───────────
export function normalizeInput(raw) {
  if (!raw || !raw.trim()) return []

  const text = raw.trim()

  // Determine parsing strategy: comma-separated vs space-separated
  const hasCommas = text.includes(",")

  let tokens
  if (hasCommas) {
    // Comma mode: split by comma, then normalize each token
    // (each token may itself be a multi-word phrase like "toor dal")
    tokens = text
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .flatMap((t) => {
        // Each comma-separated token could be a multi-word phrase
        // Run it through greedy scan as well
        if (t.includes(" ")) {
          const scanned = greedyScan(t)
          return scanned.length ? scanned : [normalizeToken(t)].filter(Boolean)
        }
        const norm = normalizeToken(t)
        return norm ? [norm] : []
      })
  } else {
    // No-comma mode: greedy phrase scanner
    tokens = greedyScan(text)
  }

  // Final cleanup: dedupe, remove empty/null
  const seen = new Set()
  return tokens.filter((t) => {
    if (!t || seen.has(t)) return false
    seen.add(t)
    return true
  })
}

// ── Mode mismatch detector ────────────────────────────────────
// Used by Home.jsx to warn the user if they appear to be using
// the wrong mode (e.g. typed a dish name in Ingredients mode).

// All known single-word dish names (that are also in DISH_ALIASES)
const DISH_NAMES_SET = new Set([
  "dalma","khichdi","poha","sambar","idli","dosa","upma","dhokla","pongal",
  "rasam","kheer","hummus","falafel","guacamole","tacos","ramen","lasagna",
  "pancakes","waffles","bibimbap","ratatouille","okonomiyaki","haleem",
  "nihari","oatmeal","shawarma","fajitas","pho","laksa",
  // multi-word dishes (underscore form)
  "butter_chicken","chicken_biryani","mutton_biryani","veg_biryani",
  "egg_biryani","palak_paneer","paneer_butter_masala","kadai_paneer",
  "malai_kofta","shahi_paneer","matar_paneer","daal_makhani","chole_bhature",
  "aloo_paratha","rajma_chawal","pav_bhaji","aloo_gobi","bhindi_masala",
  "dum_aloo","vada_pav","shahi_tukda","sabudana_khichdi","keema_matar",
  "gajar_halwa","fish_curry","fish_molee","kerala_prawn","chicken_curry",
  "mutton_curry","chicken_stew","chicken_65","chicken_tikka","paneer_tikka",
  "chicken_shawarma","honey_garlic_chicken","rogan_josh","laal_maas",
  "baingan_bharta","baingan_fry","thai_green_curry","miso_soup",
  "pasta_carbonara","spaghetti_bolognese","pizza_margherita","hakka_noodles",
  "fried_rice","egg_fried_rice","tom_yum_soup","pad_thai","greek_salad",
  "caesar_salad","quinoa_salad","avocado_toast","shrimp_scampi","beef_stir_fry",
  "beef_burger","veggie_burger","egg_salad","lemon_rice","masala_dosa",
  "pork_vindaloo","roast_turkey","fish_and_chips","smoothie_bowl",
  "french_toast","mushrooms_risotto","shepherds_pie","sushi_rolls","lentil_soup",
])

// Raw ingredients that are never dish names
const RAW_INGREDIENTS_SET = new Set([
  "chicken","egg","paneer","tofu","fish","beef","lamb","shrimp","rice",
  "pasta","potato","spinach","carrot","onion","tomato","capsicum","pumpkin",
  "ghee","butter","milk","curd","oats","quinoa","broccoli","cauliflower",
  "garlic","ginger","mushroom","avocado","banana","cucumber","lettuce",
  "flour","sugar","honey","lemon","bread","pork","turkey",
])

/**
 * Returns a warning string if the input seems mismatched with the
 * selected mode, or null if everything looks fine.
 *
 * @param {string[]} parsed   - Output of normalizeInput()
 * @param {"dish"|"ingredients"} mode
 */
export function detectModeMismatch(parsed, mode) {
  if (!parsed.length) return null

  if (mode === "dish") {
    // User is in dish mode — warn if ALL tokens look like raw ingredients
    const allIngredients = parsed.every((t) => RAW_INGREDIENTS_SET.has(t))
    if (allIngredients && parsed.length >= 2) {
      return "Looks like you entered raw ingredients. Switch to Ingredients mode for better results."
    }
  }

  if (mode === "ingredients") {
    // User is in ingredients mode — warn if any token is a dish alias
    const hasDish = parsed.some((t) => DISH_NAMES_SET.has(t))
    if (hasDish) {
      return "Looks like you entered a dish name. Switch to Dish mode for the best output."
    }
  }

  return null
}

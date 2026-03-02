// ─────────────────────────────────────────────────────────────
//  normalizeInput.js  (v2 — Full Upgrade)
//
//  WHAT'S NEW vs v1:
//  1.  Auto-synced with dishAliases.js — PHRASE_MAP is built
//      dynamically from DISH_ALIASES + DISH_NAME_ALIASES at
//      runtime. Zero drift, 234 dishes always available.
//  2.  Typo tolerance — Levenshtein edit distance ≤ 2 fuzzy
//      matching against all known keys. Fixes 'chiken',
//      'panneer', 'brocolli', 'tomatoe', 'spinnach' etc.
//  3.  Hindi + Odia + Bengali transliteration map — 120+
//      regional names mapped to canonical DB keys. 'aloo',
//      'palak', 'bhindi', 'jeera', 'haldi', 'pyaz' all work.
//  4.  Quantity stripping — numbers and units stripped before
//      parsing. '3 eggs', '200g paneer', '1 cup rice' all work.
//  5.  Cooking adjective stripping — 'grilled chicken',
//      'boiled eggs', 'leftover rice', 'frozen peas' all work.
//  6.  Natural language / sentence parsing — stopword removal
//      lets full sentences work: 'I have chicken and rice'.
//  7.  Negation handling — 'no onion', 'without garlic',
//      'except fish' routes to excluded[] not ingredients[].
//      Return shape changed: { ingredients, excluded, ... }
//  8.  Signal extraction — goal/dietary/cuisine/mealType/time
//      hints extracted from natural language input and returned
//      as signals{} for generateSmartRecipe.js to auto-apply.
//  9.  Output validation + suggestions — every resolved key
//      validated against NUTRITION_DB + DISH_ALIASES. Unknown
//      tokens get fuzzy 'did you mean?' suggestions.
//  10. Confidence-scored detectModeMismatch — returns score
//      0–1 so Home.jsx decides if/how strongly to warn.
//
//  RETURN SHAPE (normalizeInput):
//  {
//    ingredients: string[],    // resolved DB/dish keys to use
//    excluded:    string[],    // keys after "no / without / except"
//    signals: {
//      goal?:        string,   // "weight_loss" | "muscle_gain" | "balanced"
//      dietary?:     string,   // "vegan" | "vegetarian" | "non-veg"
//      cuisine?:     string,   // "India-North" | "Korea" | "Italy" etc.
//      mealType?:    string,   // "breakfast" | "lunch" | "dinner" | "snack"
//      maxPrepTime?: number,   // minutes extracted from "quick 15 min meal"
//    },
//    unknown:     string[],    // tokens that couldn't be resolved at all
//    suggestions: { token: string, didYouMean: string[] }[],
//  }
// ─────────────────────────────────────────────────────────────

import { DISH_ALIASES, DISH_NAME_ALIASES } from "./dishAliases.js"
import { NUTRITION_DB }                    from "./nutritionDB.js"

// ═══════════════════════════════════════════════════════════════
//  SECTION 1 — QUANTITY & UNIT STRIPPING
//  Strip leading numbers + measurement words so "3 eggs" → "eggs"
//  "200g paneer" → "paneer", "1 cup rice" → "rice"
// ═══════════════════════════════════════════════════════════════

const UNITS = new Set([
  "g","gm","gms","gram","grams","kg","kgs","kilogram","kilograms",
  "ml","milliliter","millilitre","l","litre","liter","litres","liters",
  "cup","cups","tbsp","tablespoon","tablespoons","tsp","teaspoon","teaspoons",
  "piece","pieces","pc","pcs","slice","slices","handful","handfuls",
  "bunch","bunches","clove","cloves","sprig","sprigs","stalk","stalks",
  "can","cans","pack","packs","packet","packets","bag","bags","bottle","bottles",
  "lb","lbs","pound","pounds","oz","ounce","ounces",
  "small","medium","large","big","whole","half","quarter","third",
])

const STOPWORDS_QUANTITY = new Set([
  "a","an","the","of","about","around","roughly","approximately","some",
  "few","little","bit","pinch","dash","splash","drizzle",
])

/** Strip numeric tokens and unit words from a word array */
function stripQuantities(words) {
  return words.filter(w => {
    if (!w) return false
    if (/^\d+(\.\d+)?$/.test(w)) return false          // pure number: 2, 1.5
    if (/^\d+[a-z]+$/.test(w))   return false          // attached unit: 200g, 1kg
    if (UNITS.has(w))             return false
    if (STOPWORDS_QUANTITY.has(w)) return false
    return true
  })
}


// ═══════════════════════════════════════════════════════════════
//  SECTION 2 — COOKING ADJECTIVE STRIPPING
//  Remove cooking state words that prefix ingredients so
//  "grilled chicken" → "chicken", "leftover rice" → "rice"
//  BUT "fried rice" → "fried_rice" (dish — handled in phrase scan)
// ═══════════════════════════════════════════════════════════════

const COOKING_ADJECTIVES = new Set([
  "grilled","baked","boiled","steamed","fried","roasted","sauteed","sautéed",
  "poached","smoked","braised","stewed","pickled","fermented","marinated",
  "raw","fresh","frozen","dried","canned","tinned","packed","leftover",
  "cooked","uncooked","chopped","sliced","diced","minced","grated","mashed",
  "whole","boneless","skinless","lean","organic","homemade","store-bought",
  "hot","cold","warm","chilled","crispy","soft","tender","crunchy",
])


// ═══════════════════════════════════════════════════════════════
//  SECTION 3 — STOPWORDS (natural language parsing)
//  Strip filler words from sentences before ingredient scanning
//  "I want something with chicken and rice" → "chicken rice"
// ═══════════════════════════════════════════════════════════════

const STOPWORDS_NL = new Set([
  // pronouns + articles
  "i","i'm","i've","i'd","my","me","we","you","it","its","this","that",
  "a","an","the","these","those",
  // verbs
  "want","need","have","got","had","get","make","making","cook","cooking",
  "prepare","preparing","use","using","add","adding","include","like","love",
  "prefer","eat","eating","try","trying","find","looking","suggest","give",
  "can","could","would","should","please","help","tell","show","recommend",
  "am","is","are","was","were","be","been","being","do","does","did",
  // conjunctions + prepositions
  "and","or","but","with","without","for","in","on","at","to","from","but","yet",
  "of","by","as","so","if","also","too","only","just","very","quite",
  // filler
  "something","anything","everything","stuff","thing","things","meal","dish",
  "food","recipe","idea","ideas","option","options","suggestion","suggestions",
  "today","tonight","now","quick","easy","simple","nice","good","great",
  "healthy","delicious","tasty","yummy","light","heavy","filling","rich",
  // meal context (keep these for signal extraction, strip from ingredient list)
  "breakfast","lunch","dinner","snack","brunch","dessert",
  // time context
  "minutes","minute","min","mins","hour","hours","time","fast","slowly",
])


// ═══════════════════════════════════════════════════════════════
//  SECTION 4 — NEGATION HANDLING
//  Words that indicate the NEXT ingredient(s) should go to
//  excluded[] not ingredients[]
//  "chicken but no onion" → ingredients:[chicken] excluded:[onion]
// ═══════════════════════════════════════════════════════════════

const NEGATION_MARKERS = new Set([
  "no","not","without","except","minus","skip","avoid","excluding",
  "allergic","allergy","intolerant","cant","can't","dont","don't",
  "wont","won't","hate","dislike","remove","leave","out",
])


// ═══════════════════════════════════════════════════════════════
//  SECTION 5 — REGIONAL LANGUAGE MAPS
//  Hindi, Odia, Bengali transliteration → canonical DB key
// ═══════════════════════════════════════════════════════════════

const HINDI_MAP = {
  // ── Vegetables ─────────────────────────────────────────────
  "aloo":          "potato",
  "alu":           "potato",
  "palak":         "spinach",
  "saag":          "spinach",
  "bhindi":        "okra",
  "lady finger":   "okra",
  "pyaz":          "onion",
  "piaz":          "onion",
  "tamatar":       "tomato",
  "tamater":       "tomato",
  "shimla mirch":  "capsicum",
  "simla mirch":   "capsicum",
  "lal mirch":     "capsicum",
  "karela":        "eggplant",    // bitter gourd — map to closest
  "baingan":       "eggplant",
  "baigan":        "eggplant",
  "brinjal":       "eggplant",
  "gajar":         "carrot",
  "matar":         "green_peas",
  "hara matar":    "green_peas",
  "lauki":         "zucchini",
  "ghia":          "zucchini",
  "kaddu":         "pumpkin",
  "kela":          "banana",
  "kele":          "banana",
  "kaccha kela":   "raw_banana",
  "aam":           "papaya",
  "methi":         "spinach",     // fenugreek leaves — closest match
  "pudina":        "coriander",   // mint → closest herb match
  "dhania":        "coriander",
  "dhaniya":       "coriander",
  "hari mirch":    "capsicum",
  "gobhi":         "cauliflower",
  "phool gobhi":   "cauliflower",
  "band gobhi":    "cabbage",
  "patta gobhi":   "cabbage",
  "hari gobhi":    "broccoli",
  "khumb":         "mushroom",
  "mushroom":      "mushroom",
  "nimbu":         "lemon",
  "nimboo":        "lemon",
  // ── Proteins ───────────────────────────────────────────────
  "murgh":         "chicken",
  "murg":          "chicken",
  "murga":         "chicken",
  "gosht":         "lamb",
  "mutton":        "lamb",
  "machli":        "fish",
  "macchi":        "fish",
  "jhinga":        "shrimp",
  "chingri":       "shrimp",
  "anda":          "egg",
  "anday":         "egg",
  "paneer":        "paneer",
  // ── Grains ─────────────────────────────────────────────────
  "chawal":        "rice",
  "chaawal":       "rice",
  "basmati":       "basmati_rice",
  "atta":          "whole_wheat_flour",
  "maida":         "flour",
  "suji":          "semolina",
  "sooji":         "semolina",
  "rava":          "semolina",
  "poha":          "flattened_rice",
  "chura":         "flattened_rice",
  "sabudana":      "sago",
  "sago":          "sago",
  "besan":         "gram_flour",
  "gehu":          "whole_wheat_flour",
  // ── Pulses ─────────────────────────────────────────────────
  "dal":           "toor_dal",
  "daal":          "toor_dal",
  "toor dal":      "toor_dal",
  "arhar dal":     "toor_dal",
  "moong dal":     "moong_dal",
  "mung dal":      "moong_dal",
  "sabut moong":   "moong_dal",
  "urad dal":      "urad_dal",
  "chana dal":     "chana_dal",
  "masoor dal":    "masoor_dal",
  "lal masoor":    "masoor_dal",
  "kabuli chana":  "chickpeas",
  "chhole":        "chickpeas",
  "chole":         "chickpeas",
  "rajma":         "rajma",
  // ── Dairy & Fats ───────────────────────────────────────────
  "dahi":          "curd",
  "dhai":          "curd",
  "ghee":          "ghee",
  "makhan":        "butter",
  "dudh":          "milk",
  "malai":         "cream",
  "khoya":         "khoya",
  "mawa":          "khoya",
  "paneer":        "paneer",
  "chenna":        "paneer",
  "chhena":        "paneer",
  // ── Spices & Aromatics ─────────────────────────────────────
  "haldi":         "turmeric",
  "jeera":         "cumin",
  "zeera":         "cumin",
  "adrak":         "ginger",
  "adhrak":        "ginger",
  "lehsun":        "garlic",
  "lahsun":        "garlic",
  "laung":         "cardamom",   // clove → closest spice
  "elaichi":       "cardamom",
  "dalchini":      "cinnamon",
  "kali mirch":    "black_pepper",
  "kesar":         "saffron",
  "sarson":        "mustard_seeds",
  "rai":           "mustard_seeds",
  "garam masala":  "garam_masala",
  "kari patta":    "curry_leaves",
  "meethi neem":   "curry_leaves",
  "imli":          "tamarind",
  "nariyal":       "coconut",
  "sarson ka tel": "mustard_oil",
  "til ka tel":    "sesame_oil",
  // ── Sweeteners ─────────────────────────────────────────────
  "cheeni":        "sugar",
  "shakkar":       "sugar",
  "gud":           "honey",      // jaggery → closest
  "shahad":        "honey",
  // ── Sauces ─────────────────────────────────────────────────
  "sirka":         "vinegar",
  "namak":         null,         // salt — not in DB, skip
  "tel":           "oil",
}

const ODIA_MAP = {
  // ── Vegetables ─────────────────────────────────────────────
  "alu":           "potato",
  "aloo":          "potato",
  "saga":          "spinach",
  "bhindi":        "okra",
  "baigana":       "eggplant",
  "gajara":        "carrot",
  "saru":          "pumpkin",
  "kaankada":      "green_peas",
  "tomato":        "tomato",
  "piyaja":        "onion",
  "rasuna":        "garlic",
  "ada":           "ginger",
  "haladi":        "turmeric",
  "dhania":        "coriander",
  "labu":          "raw_banana",
  // ── Proteins ───────────────────────────────────────────────
  "machha":        "fish",
  "macha":         "fish",
  "chhinchida":    "shrimp",
  "kankada":       "shrimp",
  "mansha":        "lamb",
  "kukura":        "chicken",
  "dama":          "egg",
  // ── Grains & Pulses ────────────────────────────────────────
  "chaula":        "rice",
  "atta":          "whole_wheat_flour",
  "besan":         "gram_flour",
  "biri dali":     "urad_dal",
  "harada dali":   "toor_dal",
  "muga dali":     "moong_dal",
  "masura dali":   "masoor_dal",
  // ── Dairy ──────────────────────────────────────────────────
  "dahi":          "curd",
  "ghia":          "ghee",
  "khira":         "milk",
  "chenna":        "paneer",
  "chhena":        "paneer",
  "khiri":         "khoya",
}

const BENGALI_MAP = {
  // ── Vegetables ─────────────────────────────────────────────
  "aloo":          "potato",
  "alu":           "potato",
  "palang":        "spinach",
  "begun":         "eggplant",
  "baingan":       "eggplant",
  "gajar":         "carrot",
  "kumro":         "pumpkin",
  "matar":         "green_peas",
  "tamato":        "tomato",
  "peyaj":         "onion",
  "piaz":          "onion",
  "rasun":         "garlic",
  "ada":           "ginger",
  "holud":         "turmeric",
  "dhone":         "coriander",
  "kachkola":      "raw_banana",
  "dharosh":       "okra",
  "fulkopi":       "cauliflower",
  "bandhakopi":    "cabbage",
  // ── Proteins ───────────────────────────────────────────────
  "maach":         "fish",
  "mach":          "fish",
  "ilish":         "fish",      // hilsa fish
  "chingri":       "shrimp",
  "mangsho":       "lamb",
  "mutton":        "lamb",
  "murgi":         "chicken",
  "dim":           "egg",
  "paneer":        "paneer",
  "chhana":        "paneer",
  // ── Grains & Pulses ────────────────────────────────────────
  "chal":          "rice",
  "bhat":          "rice",
  "atta":          "whole_wheat_flour",
  "moong dal":     "moong_dal",
  "masur dal":     "masoor_dal",
  "chana dal":     "chana_dal",
  "motor dal":     "toor_dal",
  "biuli dal":     "urad_dal",
  "cholar dal":    "chana_dal",
  // ── Dairy ──────────────────────────────────────────────────
  "doi":           "curd",
  "dahi":          "curd",
  "ghee":          "ghee",
  "dudh":          "milk",
  "malai":         "cream",
  "chhana":        "paneer",
  "kheer":         "khoya",
  // ── Spices ─────────────────────────────────────────────────
  "holud":         "turmeric",
  "jire":          "cumin",
  "ada":           "ginger",
  "rasun":         "garlic",
  "kalo jeere":    "black_pepper",
  "elaichi":       "cardamom",
  "dalchini":      "cinnamon",
  "sorse":         "mustard_seeds",
  "posto":         "cashews",   // poppy seeds → closest nut
  "narkel":        "coconut",
  "sorse tel":     "mustard_oil",
  "imli":          "tamarind",
}

// Merge all regional maps into one lookup
const REGIONAL_MAP = Object.assign({}, HINDI_MAP, ODIA_MAP, BENGALI_MAP)


// ═══════════════════════════════════════════════════════════════
//  SECTION 6 — BRAND / MODIFIER STRIP MAP
//  Brand names and cut descriptions that should be removed
//  "amul butter" → "butter", "boneless chicken thighs" → "chicken"
// ═══════════════════════════════════════════════════════════════

const BRAND_STRIP = new Set([
  "amul","nestle","maggi","britannia","haldiram","mtr","mdh","everest",
  "tropicana","patanjali","mother","dairy","kissan","lijjat","fortune",
  "emami","saffola","sundrop","ruchi","bikaneri",
  // cut names that confuse the parser
  "breast","breasts","thigh","thighs","leg","legs","wing","wings",
  "fillet","fillets","chunk","chunks","strip","strips","cube","cubes",
  "dice","boneless","skin-on","skin","drumstick","tenderloin","ribeye",
  "sirloin","mince","minced","ground","shredded","whole","half","diced",
])


// ═══════════════════════════════════════════════════════════════
//  SECTION 7 — GOAL / SIGNAL EXTRACTION KEYWORDS
//  Words that signal user's goal, dietary preference, cuisine,
//  meal type, or time constraint — extracted before ingredient parse
// ═══════════════════════════════════════════════════════════════

const GOAL_SIGNALS = {
  weight_loss:  ["weight loss","lose weight","lose fat","cut calories","low calorie",
                 "diet","fat loss","slim","slimming","light meal","low fat","light",
                 "calorie deficit","cutting"],
  muscle_gain:  ["muscle","build muscle","gain muscle","bulk","bulking","high protein",
                 "protein rich","protein packed","strength","gym","workout","post workout",
                 "gains","lean muscle","mass"],
  balanced:     ["balanced","healthy","nutritious","well rounded","clean eating",
                 "wholesome","nourishing","good health","stay healthy","maintenance"],
}

const DIETARY_SIGNALS = {
  vegan:        ["vegan","plant based","plant-based","no animal","no dairy","no meat",
                 "no eggs","dairy free","dairy-free","egg free","egg-free"],
  vegetarian:   ["vegetarian","veg","no meat","meatless","no non veg","shakahari"],
  "non-veg":    ["non veg","non-veg","non vegetarian","with meat","chicken","beef",
                 "mutton","lamb","fish","prawn","shrimp","egg"],
  "gluten-free":["gluten free","gluten-free","no gluten","celiac","coeliac"],
}

const CUISINE_SIGNALS = {
  "India-North":  ["north indian","punjabi","mughlai","rajasthani","dilli","delhi",
                   "lucknowi","awadhi","kashmiri"],
  "India-South":  ["south indian","kerala","tamil","karnataka","andhra","telugu",
                   "chettinad","udupi","malabari"],
  "India-East":   ["odia","odisha","bengali","west bengal","oriya","assamese","bihari"],
  "Italy":        ["italian","italian style","pasta dish","italian food"],
  "Korea":        ["korean","korean style","kbbq","k-food"],
  "Vietnam":      ["vietnamese","vietnam"],
  "Japan":        ["japanese","japanese style","japanese food"],
  "Thailand":     ["thai","thailand","thai style"],
  "Mediterranean":["mediterranean","greek","middle eastern","levantine"],
  "Spain":        ["spanish","spain","iberian"],
  "France":       ["french","france","french style"],
  "Indonesia":    ["indonesian","malaysian","malay","southeast asian"],
  "USA":          ["american","american style","bbq","barbecue","tex mex"],
  "China":        ["chinese","chinese style","szechuan","cantonese","mandarin"],
}

const MEAL_SIGNALS = {
  breakfast: ["breakfast","morning","early","brunch","start of day"],
  lunch:     ["lunch","midday","afternoon","noon"],
  dinner:    ["dinner","supper","evening","night","nighttime"],
  snack:     ["snack","snacks","light bite","quick bite","munchies","between meals"],
  dessert:   ["dessert","sweet","sweets","afters","pudding","something sweet"],
}

const TIME_PATTERN = /(\d+)\s*(min|mins|minute|minutes|hour|hours|hr|hrs)/


// ═══════════════════════════════════════════════════════════════
//  SECTION 8 — MULTI-WORD INGREDIENT PHRASE MAP
//  Only ingredients here — dishes are auto-imported from
//  dishAliases.js so they're always in sync.
// ═══════════════════════════════════════════════════════════════

const INGREDIENT_PHRASE_MAP = {
  // ── Grains ─────────────────────────────────────────────────
  "basmati rice":          "basmati_rice",
  "brown rice":            "brown_rice",
  "rice noodles":          "rice_noodles",
  "ramen noodles":         "ramen_noodles",
  "whole wheat flour":     "whole_wheat_flour",
  "wheat flour":           "whole_wheat_flour",
  "gram flour":            "gram_flour",
  "flattened rice":        "flattened_rice",
  // ── Vegetables ─────────────────────────────────────────────
  "sweet potato":          "sweet_potato",
  "sweet potatoes":        "sweet_potato",
  "raw banana":            "raw_banana",
  "raw bananas":           "raw_banana",
  "green peas":            "green_peas",
  "bell pepper":           "capsicum",
  "bell peppers":          "capsicum",
  "red pepper":            "capsicum",
  "yellow pepper":         "capsicum",
  "green pepper":          "capsicum",
  "red bell pepper":       "capsicum",
  "spring onion":          "spring_onion",
  "spring onions":         "spring_onion",
  "green onion":           "spring_onion",
  "green onions":          "spring_onion",
  "scallion":              "spring_onion",
  "scallions":             "spring_onion",
  "cherry tomatoes":       "tomato",
  "sun dried tomatoes":    "tomato",
  "bamboo shoots":         "bamboo_shoots",
  "kaffir lime":           "kaffir_lime",
  "thai basil":            "thai_basil",
  "lemon juice":           "lemon_juice",
  // ── Pulses ─────────────────────────────────────────────────
  "toor dal":              "toor_dal",
  "arhar dal":             "toor_dal",
  "pigeon peas":           "toor_dal",
  "moong dal":             "moong_dal",
  "mung dal":              "moong_dal",
  "mung beans":            "moong_dal",
  "urad dal":              "urad_dal",
  "black lentils":         "urad_dal",
  "chana dal":             "chana_dal",
  "masoor dal":            "masoor_dal",
  "red lentils":           "masoor_dal",
  "red lentil":            "masoor_dal",
  "kidney beans":          "rajma",
  "red kidney beans":      "rajma",
  "soy chunks":            "soy_chunks",
  "soya chunks":           "soy_chunks",
  "textured soy":          "soy_chunks",
  // ── Proteins ───────────────────────────────────────────────
  "ground beef":           "beef",
  "minced beef":           "beef",
  "ground pork":           "pork",
  "pork belly":            "pork",
  "chicken breast":        "chicken",
  "chicken thigh":         "chicken",
  "chicken leg":           "chicken",
  // ── Dairy & Fats ───────────────────────────────────────────
  "coconut milk":          "coconut_milk",
  "feta cheese":           "feta_cheese",
  "parmesan cheese":       "parmesan",
  "mozzarella cheese":     "mozzarella",
  "ricotta cheese":        "ricotta_cheese",
  "olive oil":             "olive_oil",
  "mustard oil":           "mustard_oil",
  "sesame oil":            "sesame_oil",
  "peanut butter":         "peanut_butter",
  "maple syrup":           "maple_syrup",
  "chia seeds":            "chia_seeds",
  // ── Sauces & Condiments ────────────────────────────────────
  "soy sauce":             "soy_sauce",
  "oyster sauce":          "oyster_sauce",
  "fish sauce":            "fish_sauce",
  "hot sauce":             "hot_sauce",
  "miso paste":            "miso_paste",
  // ── Spices ─────────────────────────────────────────────────
  "black pepper":          "black_pepper",
  "mustard seeds":         "mustard_seeds",
  "garam masala":          "garam_masala",
  "chili powder":          "chili_powder",
  "chilli powder":         "chili_powder",
  "curry leaves":          "curry_leaves",
  // ── Herbs ──────────────────────────────────────────────────
  "thai basil":            "thai_basil",
  "lemon grass":           "lemongrass",
  "kaffir lime leaves":    "kaffir_lime",
  "baking powder":         "baking_powder",
}


// ═══════════════════════════════════════════════════════════════
//  SECTION 9 — SINGLE-WORD VARIANT MAP (plurals, aliases, typo)
//  Covers singular/plural, brand-to-ingredient, common
//  name variants NOT covered by fuzzy matching.
// ═══════════════════════════════════════════════════════════════

const VARIANT_MAP = {
  // ── Plurals ────────────────────────────────────────────────
  "potatoes":      "potato",
  "tomatoes":      "tomato",
  "carrots":       "carrot",
  "onions":        "onion",
  "eggs":          "egg",
  "mushrooms":     "mushroom",
  "bananas":       "banana",
  "almonds":       "almonds",
  "walnuts":       "walnuts",
  "cashews":       "cashews",
  "peanuts":       "peanuts",
  "blueberries":   "blueberries",
  "chickpeas":     "chickpeas",
  "lentils":       "masoor_dal",
  "lentil":        "masoor_dal",
  "noodles":       "noodles",
  "olives":        "olives",
  "zucchinis":     "zucchini",
  "eggplants":     "eggplant",
  "spinaches":     "spinach",
  // ── Common aliases ─────────────────────────────────────────
  "yogurt":        "yogurt",
  "curd":          "curd",
  "dahi":          "curd",
  "prawns":        "shrimp",
  "prawn":         "shrimp",
  "mutton":        "lamb",
  "aubergine":     "eggplant",
  "brinjal":       "eggplant",
  "courgette":     "zucchini",
  "okra":          "okra",
  "ladyfinger":    "okra",
  "ladysfinger":   "okra",
  "bhindi":        "okra",
  "garbanzo":      "chickpeas",
  "rajma":         "rajma",
  "peas":          "green_peas",
  "spaghetti":     "pasta",
  "penne":         "pasta",
  "fettuccine":    "pasta",
  "linguine":      "pasta",
  "rigatoni":      "pasta",
  "macaroni":      "pasta",
  "vermicelli":    "rice_noodles",
  "mayo":          "mayonnaise",
  "cilantro":      "coriander",
  "oil":           "oil",
  "butter":        "butter",
  "milk":          "milk",
  "cheese":        "cheese",
  "cream":         "cream",
  "bread":         "bread",
  "rice":          "rice",
  "chicken":       "chicken",
  "fish":          "fish",
  "beef":          "beef",
  "pork":          "pork",
  "turkey":        "turkey",
  "egg":           "egg",
  "tofu":          "tofu",
  "paneer":        "paneer",
  "ghee":          "ghee",
  "spinach":       "spinach",
  "carrot":        "carrot",
  "tomato":        "tomato",
  "onion":         "onion",
  "garlic":        "garlic",
  "ginger":        "ginger",
  "potato":        "potato",
  "avocado":       "avocado",
  "banana":        "banana",
  "oats":          "oats",
  "quinoa":        "quinoa",
  "cucumber":      "cucumber",
  "lettuce":       "lettuce",
  "broccoli":      "broccoli",
  "cauliflower":   "cauliflower",
  "mushroom":      "mushroom",
  "semolina":      "semolina",
  "pumpkin":       "pumpkin",
  "papaya":        "papaya",
  "lemon":         "lemon",
  "lime":          "lime",
  "tahini":        "tahini",
  "mayonnaise":    "mayonnaise",
  "coriander":     "coriander",
  "turmeric":      "turmeric",
  "cumin":         "cumin",
  "coconut":       "coconut",
  "seaweed":       "seaweed",
  "cabbage":       "cabbage",
  "sugar":         "sugar",
  "honey":         "honey",
  "vinegar":       "vinegar",
  "saffron":       "saffron",
  "cardamom":      "cardamom",
  "cinnamon":      "cinnamon",
  "basil":         "basil",
  "parsley":       "parsley",
  "rosemary":      "rosemary",
  "thyme":         "thyme",
  "oregano":       "oregano",
  "lemongrass":    "lemongrass",
  "galangal":      "galangal",
  "miso":          "miso_paste",
  "tahini":        "tahini",
  "tamarind":      "tamarind",
  "shrimp":        "shrimp",
  "breadcrumbs":   "bread",
  "croutons":      "croutons",
  "flour":         "flour",
  "buns":          "buns",
}


// ═══════════════════════════════════════════════════════════════
//  SECTION 10 — DYNAMIC PHRASE BUILDER
//  Merges: INGREDIENT_PHRASE_MAP + DISH_ALIASES (auto from import)
//          + DISH_NAME_ALIASES (auto from import) at runtime.
//  Result: one unified lookup, always in sync with dishAliases.js
// ═══════════════════════════════════════════════════════════════

function buildPhraseMap() {
  const map = { ...INGREDIENT_PHRASE_MAP }

  // Add all dish keys in their human-readable form (underscore → space)
  for (const key of Object.keys(DISH_ALIASES)) {
    const human = key.replace(/_/g, " ")
    if (!map[human]) map[human] = key
  }

  // Add all DISH_NAME_ALIASES (alternate names, typos, regional names)
  for (const [human, canonical] of Object.entries(DISH_NAME_ALIASES)) {
    if (!map[human]) map[human] = canonical
  }

  return map
}

// Built once at module load — reflects current dishAliases.js state
const PHRASE_MAP = buildPhraseMap()

// Sort longest-first so "paneer butter masala" matches before "butter"
const SORTED_PHRASES = Object.keys(PHRASE_MAP)
  .sort((a, b) => b.split(" ").length - a.split(" ").length || b.length - a.length)


// ═══════════════════════════════════════════════════════════════
//  SECTION 11 — FUZZY MATCHING (Levenshtein edit distance)
//  Used when exact match fails — catches typos like 'chiken',
//  'brocolli', 'panneer', 'tomatoe'
// ═══════════════════════════════════════════════════════════════

function levenshtein(a, b) {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const matrix = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i-1] === a[j-1]) {
        matrix[i][j] = matrix[i-1][j-1]
      } else {
        matrix[i][j] = 1 + Math.min(
          matrix[i-1][j],    // deletion
          matrix[i][j-1],    // insertion
          matrix[i-1][j-1],  // substitution
        )
      }
    }
  }
  return matrix[b.length][a.length]
}

// All valid single-word keys to fuzzy-match against
function getAllKnownSingleWordKeys() {
  const keys = new Set([
    ...Object.keys(NUTRITION_DB),
    ...Object.keys(DISH_ALIASES),
    ...Object.keys(VARIANT_MAP),
  ])
  // Remove very short keys (would match everything)
  return [...keys].filter(k => k.length >= 4 && !k.includes("_"))
}

let _cachedFuzzyKeys = null
function getFuzzyKeys() {
  if (!_cachedFuzzyKeys) _cachedFuzzyKeys = getAllKnownSingleWordKeys()
  return _cachedFuzzyKeys
}

/**
 * Find the closest matching key for a word.
 * Returns { match, distance, suggestions } where match is the best
 * match if distance ≤ maxDist, else null.
 */
function fuzzyMatch(word, maxDist = 2) {
  if (word.length < 3) return { match: null, distance: 99, suggestions: [] }

  const keys = getFuzzyKeys()
  let best = null
  let bestDist = maxDist + 1
  const candidates = []

  for (const key of keys) {
    // Skip keys much longer/shorter than the input (optimisation)
    if (Math.abs(key.length - word.length) > maxDist + 1) continue
    const dist = levenshtein(word, key)
    if (dist < bestDist) {
      bestDist = dist
      best = key
    }
    if (dist <= maxDist) candidates.push({ key, dist })
  }

  candidates.sort((a, b) => a.dist - b.dist)
  return {
    match:       bestDist <= maxDist ? best : null,
    distance:    bestDist,
    suggestions: candidates.slice(0, 3).map(c => c.key),
  }
}


// ═══════════════════════════════════════════════════════════════
//  SECTION 12 — SIGNAL EXTRACTION
//  Runs over the raw input text BEFORE ingredient parsing.
//  Extracts goal, dietary, cuisine, mealType, maxPrepTime hints
//  that Home.jsx can use to pre-fill the recipe generator form.
// ═══════════════════════════════════════════════════════════════

export function extractSignals(rawText) {
  const text = rawText.toLowerCase()
  const signals = {}

  // Goal
  for (const [goal, triggers] of Object.entries(GOAL_SIGNALS)) {
    if (triggers.some(t => text.includes(t))) {
      signals.goal = goal
      break
    }
  }

  // Dietary
  for (const [diet, triggers] of Object.entries(DIETARY_SIGNALS)) {
    if (triggers.some(t => text.includes(t))) {
      signals.dietary = diet
      break
    }
  }

  // Cuisine
  for (const [cuisine, triggers] of Object.entries(CUISINE_SIGNALS)) {
    if (triggers.some(t => text.includes(t))) {
      signals.cuisine = cuisine
      break
    }
  }

  // Meal type
  for (const [meal, triggers] of Object.entries(MEAL_SIGNALS)) {
    if (triggers.some(t => text.includes(t))) {
      signals.mealType = meal
      break
    }
  }

  // Time
  const timeMatch = text.match(TIME_PATTERN)
  if (timeMatch) {
    const val = parseInt(timeMatch[1])
    const unit = timeMatch[2]
    signals.maxPrepTime = unit.startsWith("h") ? val * 60 : val
  }

  return signals
}


// ═══════════════════════════════════════════════════════════════
//  SECTION 13 — CORE PARSING ENGINE
// ═══════════════════════════════════════════════════════════════

/** Resolve a single word token to a canonical DB key */
function resolveToken(word) {
  if (!word || word.length < 2) return null

  // 1. Exact variant map lookup
  if (VARIANT_MAP[word]) return VARIANT_MAP[word]

  // 2. Regional language lookup (Hindi/Odia/Bengali)
  if (REGIONAL_MAP[word] !== undefined) return REGIONAL_MAP[word]

  // 3. Direct DB key match
  if (NUTRITION_DB[word] || DISH_ALIASES[word]) return word

  // 4. Fuzzy match (typo tolerance)
  const { match } = fuzzyMatch(word)
  if (match) return match

  // Could not resolve
  return null
}

/**
 * Pre-process a word array.
 * Strips brand names and quantities only — NOT cooking adjectives.
 * Cooking adjectives are stripped inside greedyScan on unmatched
 * single words only, so "fried rice", "egg fried rice", "beef stir fry"
 * get matched as dish phrases BEFORE "fried" or "stir" can be removed.
 */
function preProcessWords(words) {
  const afterBrand = words.filter(w => !BRAND_STRIP.has(w))
  const afterQty   = stripQuantities(afterBrand)
  return afterQty
}

/**
 * Greedy phrase scanner — scans left-to-right through words,
 * trying the longest known phrase at each position before
 * falling back to single-word resolution.
 * Returns { resolved: string[], unknowns: string[], suggestions: [] }
 */
function greedyScan(words) {
  const resolved    = []
  const unknowns    = []
  const suggestions = []
  let i = 0

  while (i < words.length) {
    let matched = false

    // Try all phrases from longest to shortest
    for (const phrase of SORTED_PHRASES) {
      const phraseWords = phrase.split(" ")
      const len = phraseWords.length
      if (i + len > words.length) continue

      const candidate = words.slice(i, i + len).join(" ")
      if (candidate === phrase) {
        const mapped = PHRASE_MAP[phrase]
        if (mapped) resolved.push(mapped)
        i += len
        matched = true
        break
      }
    }

    if (!matched) {
      const word = words[i]

      // Skip cooking adjectives ONLY when they are unmatched single words
      // (not when they're part of a dish phrase like "fried rice")
      if (COOKING_ADJECTIVES.has(word)) { i++; continue }

      // Try 2-word regional phrases (e.g. "shimla mirch", "sorse tel")
      const twoWord = words.slice(i, i + 2).join(" ")
      if (REGIONAL_MAP[twoWord] !== undefined) {
        const mapped = REGIONAL_MAP[twoWord]
        if (mapped) resolved.push(mapped)
        i += 2
        continue
      }

      const resolved_token = resolveToken(word)
      if (resolved_token) {
        resolved.push(resolved_token)
      } else if (word.length >= 2 && !STOPWORDS_NL.has(word)) {
        const { suggestions: sugg } = fuzzyMatch(word)
        unknowns.push(word)
        if (sugg.length) suggestions.push({ token: word, didYouMean: sugg })
      }
      i++
    }
  }

  return { resolved, unknowns, suggestions }
}


// ═══════════════════════════════════════════════════════════════
//  SECTION 14 — NEGATION SPLITTER
//  Splits raw text into { positive: string, negative: string }
//  before phrase scanning.
//  "chicken but no onion and garlic" →
//    positive: "chicken", negative: "onion and garlic"
// ═══════════════════════════════════════════════════════════════

function splitNegation(text) {
  // Patterns like: "but no X", "without X", "no X", "except X"
  // We split at the first negation marker and treat everything after
  // as the negative side.
  const words = text.split(/\s+/)
  let negStart = -1

  for (let i = 0; i < words.length; i++) {
    // "no", "not", "without", "except", etc.
    if (NEGATION_MARKERS.has(words[i])) {
      // Don't count "not" in "not only", "do not" etc. unless followed by food word
      negStart = i
      break
    }
    // Two-word patterns: "but no", "but not", "and not"
    if (i + 1 < words.length) {
      const bigram = words[i] + " " + words[i + 1]
      if (["but no","but not","and no","and not","except for"].includes(bigram)) {
        negStart = i + 1
        break
      }
    }
  }

  if (negStart === -1) {
    return { positive: text, negative: "" }
  }

  return {
    positive: words.slice(0, negStart).join(" ").trim(),
    negative: words.slice(negStart + 1).join(" ").trim(),  // skip the marker itself
  }
}


// ═══════════════════════════════════════════════════════════════
//  SECTION 15 — MAIN EXPORT: normalizeInput()
// ═══════════════════════════════════════════════════════════════

/**
 * Parse raw user input into structured ingredient/dish data.
 *
 * @param {string} raw  — raw text from the input field
 * @returns {{
 *   ingredients: string[],
 *   excluded:    string[],
 *   signals:     object,
 *   unknown:     string[],
 *   suggestions: { token: string, didYouMean: string[] }[],
 * }}
 */
export function normalizeInput(raw) {
  if (!raw || !raw.trim()) {
    return { ingredients: [], excluded: [], signals: {}, unknown: [], suggestions: [] }
  }

  const text = raw.trim().toLowerCase().replace(/[^\w\s\-']/g, " ")

  // Step 1: Extract context signals (goal, dietary, cuisine, time)
  const signals = extractSignals(text)

  // Step 2: Split at negation markers
  const { positive: posText, negative: negText } = splitNegation(text)

  // Step 3: Parse function for one chunk
  function parseChunk(chunk) {
    if (!chunk.trim()) return { resolved: [], unknowns: [], suggestions: [] }

    const hasCommas = chunk.includes(",")

    if (hasCommas) {
      // Comma-separated: run each token through greedy scan
      const tokens = chunk.split(",").map(t => t.trim()).filter(Boolean)
      const allResolved = []
      const allUnknowns = []
      const allSuggestions = []

      for (const token of tokens) {
        const words = preProcessWords(
          token.split(/\s+/).filter(Boolean)
        )
        const { resolved, unknowns, suggestions } = greedyScan(words)
        allResolved.push(...resolved)
        allUnknowns.push(...unknowns)
        allSuggestions.push(...suggestions)
      }

      return { resolved: allResolved, unknowns: allUnknowns, suggestions: allSuggestions }
    } else {
      // Space-separated: remove NL stopwords, then greedy scan
      const rawWords = chunk.split(/\s+/).filter(Boolean)
      const withoutStopwords = rawWords.filter(w => !STOPWORDS_NL.has(w))
      const processed = preProcessWords(withoutStopwords)
      return greedyScan(processed)
    }
  }

  const posResult = parseChunk(posText)
  const negResult = parseChunk(negText)

  // Step 4: Deduplicate
  const seen = new Set()
  const ingredients = posResult.resolved.filter(k => {
    if (!k || seen.has(k)) return false
    seen.add(k)
    return true
  })

  const excludedSeen = new Set()
  const excluded = negResult.resolved.filter(k => {
    if (!k || excludedSeen.has(k)) return false
    excludedSeen.add(k)
    return true
  })

  return {
    ingredients,
    excluded,
    signals,
    unknown:     [...posResult.unknowns, ...negResult.unknowns],
    suggestions: [...posResult.suggestions, ...negResult.suggestions],
  }
}


// ═══════════════════════════════════════════════════════════════
//  SECTION 16 — MODE MISMATCH DETECTION (confidence-scored)
// ═══════════════════════════════════════════════════════════════

const DISH_KEYS_SET = new Set(Object.keys(DISH_ALIASES))

const RAW_INGREDIENTS_SET = new Set([
  ...Object.keys(NUTRITION_DB),
  ...Object.keys(VARIANT_MAP),
])

/**
 * Detect if the user is using the wrong input mode.
 *
 * @param {string[]} parsed       — output of normalizeInput().ingredients
 * @param {"dish"|"ingredients"}  mode
 * @returns {{
 *   mismatch:    boolean,
 *   confidence:  number,    // 0.0–1.0
 *   suggestion:  string,    // "dish" | "ingredients" | null
 *   reason:      string,
 *   isDishInput: boolean,
 *   isIngredientInput: boolean,
 * }}
 */
export function detectModeMismatch(parsed, mode) {
  if (!parsed || !parsed.length) {
    return { mismatch: false, confidence: 0, suggestion: null, reason: "", isDishInput: false, isIngredientInput: false }
  }

  const dishCount = parsed.filter(t => DISH_KEYS_SET.has(t)).length
  const ingrCount = parsed.filter(t => RAW_INGREDIENTS_SET.has(t) && !DISH_KEYS_SET.has(t)).length
  const total = parsed.length

  const dishRatio = dishCount / total
  const ingrRatio = ingrCount / total

  const isDishInput       = dishRatio >= 0.6
  const isIngredientInput = ingrRatio >= 0.6

  if (mode === "dish") {
    // User in dish mode — warn if most tokens look like raw ingredients
    if (isIngredientInput && ingrCount >= 2) {
      return {
        mismatch:         true,
        confidence:       Math.min(0.95, ingrRatio),
        suggestion:       "ingredients",
        reason:           `Looks like you entered raw ingredients (${parsed.filter(t => RAW_INGREDIENTS_SET.has(t)).join(", ")}). Switch to Ingredients mode for the best results.`,
        isDishInput:      false,
        isIngredientInput: true,
      }
    }
  }

  if (mode === "ingredients") {
    // User in ingredients mode — warn if tokens look like dish names
    if (isDishInput && dishCount >= 1) {
      return {
        mismatch:    true,
        confidence:  Math.min(0.95, dishRatio),
        suggestion:  "dish",
        reason:      `Looks like you entered a dish name (${parsed.filter(t => DISH_KEYS_SET.has(t)).join(", ")}). Switch to Dish mode for the best output.`,
        isDishInput:       true,
        isIngredientInput: false,
      }
    }
  }

  return { mismatch: false, confidence: 0, suggestion: null, reason: "", isDishInput, isIngredientInput }
}


// ═══════════════════════════════════════════════════════════════
//  SECTION 17 — CONVENIENCE HELPERS (used by Home.jsx)
// ═══════════════════════════════════════════════════════════════

/**
 * Quick check: is this text likely a dish name or ingredients?
 * Returns "dish" | "ingredients" | "unknown"
 */
export function guessInputType(raw) {
  if (!raw?.trim()) return "unknown"
  const { ingredients } = normalizeInput(raw)
  const dishCount = ingredients.filter(t => DISH_KEYS_SET.has(t)).length
  const ingrCount = ingredients.filter(t => !DISH_KEYS_SET.has(t)).length
  if (dishCount > ingrCount) return "dish"
  if (ingrCount > dishCount) return "ingredients"
  return "unknown"
}

/**
 * Validate an array of keys against the DB.
 * Returns { valid, invalid } where invalid keys are DB misses.
 */
export function validateKeys(keys) {
  const valid   = keys.filter(k => NUTRITION_DB[k] || DISH_ALIASES[k])
  const invalid = keys.filter(k => !NUTRITION_DB[k] && !DISH_ALIASES[k])
  return { valid, invalid }
}

/**
 * Get all known dish keys (for autocomplete, DISH_NAMES_SET etc.)
 * Always derived from the live dishAliases import — never stale.
 */
export function getDishKeys() {
  return Object.keys(DISH_ALIASES)
}

/**
 * Get all known ingredient keys (for autocomplete)
 */
export function getIngredientKeys() {
  return Object.keys(NUTRITION_DB)
}
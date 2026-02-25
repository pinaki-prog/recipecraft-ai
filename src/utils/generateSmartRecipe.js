// ─────────────────────────────────────────────────────────────
//  UTILITY
// ─────────────────────────────────────────────────────────────
function capitalize(word) {
  if (!word) return ""
  return word.charAt(0).toUpperCase() + word.slice(1)
}

// Deterministic pick from an array using a numeric seed
// so titles vary but never randomly re-render on the same call
function pick(arr, seed) {
  return arr[Math.abs(seed) % arr.length]
}

// ─────────────────────────────────────────────────────────────
//  CUISINE AUTHENTICITY ENGINE  (v2)
//  Each cuisine has: fat, tempering spices, aromatics,
//  a named cook style, a technique sentence, and a finish note.
//  Every downstream engine reads from this single source of truth.
// ─────────────────────────────────────────────────────────────
const CUISINE_PROFILES = {
  India: {
    fat: "mustard oil or ghee",
    tempering: ["cumin seeds", "mustard seeds", "dried red chili", "curry leaves"],
    aromatics: ["ginger-garlic paste", "onion", "turmeric", "coriander powder"],
    acid: "lemon juice or tamarind",
    herbs: ["fresh coriander"],
    cookStyle: "bhuno (slow roast)",
    technique:
      "Heat fat until it just begins to smoke, bloom whole spices until they splutter, " +
      "then build the masala base low-and-slow before introducing main ingredients.",
    finish: "finish with garam masala, fresh coriander and a squeeze of lemon",
  },
  Italy: {
    fat: "extra-virgin olive oil",
    tempering: ["garlic slices", "fresh basil stem"],
    aromatics: ["shallots", "plum tomato", "white wine"],
    acid: "balsamic vinegar or lemon zest",
    herbs: ["fresh basil", "flat-leaf parsley"],
    cookStyle: "soffritto + gentle simmer",
    technique:
      "Warm oil gently — never let it smoke. Soften aromatics (soffritto) until translucent, " +
      "deglaze with wine, then let the sauce marry over a patient low flame.",
    finish: "drizzle cold extra-virgin olive oil and scatter torn fresh basil just before serving",
  },
  Mexico: {
    fat: "neutral oil",
    tempering: ["dried ancho chili", "guajillo chili"],
    aromatics: ["white onion", "garlic", "ground cumin", "Mexican oregano"],
    acid: "fresh lime juice",
    herbs: ["fresh cilantro"],
    cookStyle: "toasted-chili base",
    technique:
      "Dry-toast dried chilies and whole spices until deeply fragrant, rehydrate in hot water, " +
      "then blend into a smooth base before building the rest of the dish on top.",
    finish: "squeeze lime generously, add pickled jalapeños and scatter fresh cilantro",
  },
  USA: {
    fat: "butter or neutral oil",
    tempering: ["garlic", "shallots"],
    aromatics: ["smoked paprika", "onion powder", "worcestershire sauce"],
    acid: "apple cider vinegar",
    herbs: ["flat-leaf parsley"],
    cookStyle: "cast-iron sear + baste",
    technique:
      "Get the pan screaming hot before anything goes in. High-heat sear builds a deep fond " +
      "— deglaze it, then baste continuously for maximum Maillard crust.",
    finish: "rest protein 3 minutes off heat before slicing to redistribute juices",
  },
  China: {
    fat: "peanut oil or avocado oil (high smoke point)",
    tempering: ["ginger slices", "garlic", "scallion whites"],
    aromatics: ["shaoxing rice wine", "oyster sauce", "white pepper"],
    acid: "rice vinegar",
    herbs: ["scallion greens", "fresh cilantro"],
    cookStyle: "wok hei stir-fry",
    technique:
      "Wok must be at full blast — wok hei only comes from extreme heat. " +
      "Stir-fry in small batches, tossing constantly so nothing steams.",
    finish: "drizzle toasted sesame oil and scatter scallion greens off heat",
  },
  Japan: {
    fat: "neutral oil with a few drops of sesame oil",
    tempering: ["thin ginger slices", "garlic (minimal)"],
    aromatics: ["mirin", "soy sauce", "dashi stock"],
    acid: "rice vinegar or ponzu",
    herbs: ["shiso leaves", "mitsuba"],
    cookStyle: "umami-forward reduction",
    technique:
      "Balance umami using the dashi base. Cook proteins to the exact moment of doneness " +
      "— overcooking is the cardinal sin. Let sauces reduce naturally to a glaze.",
    finish: "garnish with toasted sesame seeds and fine-cut nori strips",
  },
  Thailand: {
    fat: "coconut cream (first press)",
    tempering: ["lemongrass", "kaffir lime leaves", "fresh galangal"],
    aromatics: ["thai basil", "fish sauce", "palm sugar"],
    acid: "fresh lime juice",
    herbs: ["thai basil", "fresh coriander"],
    cookStyle: "split-coconut-cream paste fry",
    technique:
      "Fry curry paste in thick coconut cream until the oil visibly splits and the paste " +
      "turns deeply fragrant — this is the flavour foundation everything else builds on.",
    finish: "taste and balance fish sauce (salt), lime (acid), palm sugar (sweet) before plating",
  },
}

function getCuisineProfile(location) {
  return (
    CUISINE_PROFILES[location] ?? {
      fat: "oil of your choice",
      tempering: ["garlic", "onion"],
      aromatics: ["salt", "pepper"],
      acid: "lemon juice",
      herbs: ["fresh parsley"],
      cookStyle: "standard sauté",
      technique: "Cook ingredients over medium heat, building flavour in layers.",
      finish: "season to taste and garnish before serving",
    }
  )
}

// ─────────────────────────────────────────────────────────────
//  DISH ALIASES
//  Expands shorthand dish names into their core ingredients
//  so the nutrition and step engines can work with real items.
//
//  BUG FIXES (v2):
//  All ingredient strings now use the exact underscore-keyed
//  format that matches NUTRITION_DB, MICRO_DB, INGREDIENT_COST,
//  ALLERGEN_TAGS, LEGUME_SET, INGREDIENT_MISTAKES, etc.
//  Previous spaced/plural/variant strings caused silent zero-
//  contribution from those ingredients across all downstream
//  engines (nutrition, health score, micros, allergens, cost,
//  cooking steps, and mistake warnings).
//
//  Full list of fixes applied:
//  "toor dal"      → "toor_dal"       (dalma, sambar)
//  "moong dal"     → "moong_dal"      (khichdi, pongal, pesarattu)
//  "raw banana"    → "raw_banana"     (dalma, avial)
//  "green peas"    → "green_peas"     (vermicelli_upma)
//  "peas"          → "green_peas"     (pav_bhaji, veg_biryani, keema_matar,
//                                      matar_paneer, fried_rice, egg_fried_rice)
//  "potatoes"      → "potato"         (aloo_paratha, pav_bhaji)
//  "baby potatoes" → "potato"         (dum_aloo)
//  "carrots"       → "carrot"         (gajar_halwa)
//  "eggs"          → "egg"            (pasta_carbonara)
//  "basmati rice"  → "rice"           (all four biryanis)
//  "yogurt"        → "curd"           (10 dishes)
//  "ground beef"   → "beef"           (keema_matar, tacos, spaghetti_bolognese)
//  "kidney beans"  → "rajma"          (rajma_chawal)
//  "olive oil"     → "olive_oil"      (hummus, pizza_margherita, shakshuka, greek_salad)
//  "lentils"       → "masoor_dal"     (haleem)
//  "urad dal"      → "urad_dal"       (idli, dosa, upma, uttapam, appam, bedmi_puri)
//  "chana dal"     → "chana_dal"      (dosa)
//  "black urad dal"→ "urad_dal"       (daal_makhani)
//  "rice noodles"  → "rice_noodles"   (pad_thai, pho, laksa)
// ─────────────────────────────────────────────────────────────
const DISH_ALIASES = {
  // ── Odia ────────────────────────────────────────────────────
  dalma:               ["toor_dal", "pumpkin", "raw_banana", "papaya", "turmeric", "cumin", "ghee"],

  // ── North Indian ────────────────────────────────────────────
  khichdi:             ["rice", "moong_dal", "turmeric", "ghee", "ginger"],
  paneer_butter_masala:["paneer", "tomato", "cream", "butter", "cashews", "kasuri methi"],
  chole_bhature:       ["chickpeas", "onion", "tomato", "ginger", "garlic", "chole masala", "flour"],
  aloo_paratha:        ["whole wheat flour", "potato", "green chili", "coriander", "ajwain"],
  rajma_chawal:        ["rajma", "rice", "onion", "tomato", "ginger", "cumin"],
  butter_chicken:      ["chicken", "tomato", "butter", "cream", "ginger", "garlic", "kashmiri mirch"],
  pav_bhaji:           ["potato", "green_peas", "cauliflower", "butter", "pav bhaji masala", "bread rolls"],
  palak_paneer:        ["spinach", "paneer", "garlic", "green chili", "cream"],
  kadai_paneer:        ["paneer", "capsicum", "onion", "coriander seeds", "dried red chili"],
  malai_kofta:         ["paneer", "potato", "cornflour", "cream", "cashews", "tomato", "cardamom"],
  bhindi_masala:       ["okra", "onion", "tomato", "cumin", "coriander powder", "amchur"],
  dum_aloo:            ["potato", "curd", "fennel seeds", "ginger", "mustard oil", "kashmiri mirch"],
  vada_pav:            ["potato", "gram flour", "garlic", "green chili", "bread rolls", "mustard seeds"],
  rasam:               ["tamarind", "tomato", "black pepper", "cumin", "garlic", "coriander leaves"],
  shahi_paneer:        ["paneer", "cream", "curd", "cashews", "saffron", "cardamom"],
  kheer:               ["rice", "milk", "sugar", "cardamom", "almonds", "raisins"],
  aloo_gobi:           ["potato", "cauliflower", "onion", "tomato", "ginger", "turmeric", "cumin"],
  matar_paneer:        ["paneer", "green_peas", "tomato", "onion", "ginger", "garlic", "cream"],
  daal_makhani:        ["urad_dal", "rajma", "butter", "cream", "tomato", "ginger", "garlic"],
  gajar_halwa:         ["carrot", "milk", "sugar", "ghee", "cardamom", "khoya"],
  rogan_josh:          ["lamb", "curd", "kashmiri mirch", "ginger", "garlic", "fennel", "cardamom"],
  laal_maas:           ["lamb", "mathania chili", "garlic", "ghee", "coriander", "curd"],
  nihari:              ["lamb", "bone marrow", "atta", "ginger", "nihari masala", "ghee"],
  haleem:              ["lamb", "wheat", "masoor_dal", "ginger", "garlic", "onion", "ghee"],
  shahi_tukda:         ["bread", "milk", "sugar", "saffron", "cardamom", "ghee", "almonds"],
  keema_matar:         ["beef", "green_peas", "onion", "tomato", "ginger", "garlic", "cumin"],
  mutton_curry:        ["lamb", "onion", "tomato", "garlic", "ginger", "mustard oil", "garam masala"],

  // ── South Indian ────────────────────────────────────────────
  sambar:              ["toor_dal", "drumstick", "tamarind", "sambar powder", "mustard seeds", "curry leaves"],
  idli:                ["rice", "urad_dal", "fenugreek seeds", "salt"],
  dosa:                ["rice", "urad_dal", "chana_dal", "fenugreek seeds"],
  upma:                ["semolina", "mustard seeds", "urad_dal", "onion", "curry leaves", "ginger"],
  pongal:              ["rice", "moong_dal", "black pepper", "cumin", "ghee", "cashews", "ginger"],
  pesarattu:           ["moong_dal", "ginger", "green chili", "cumin", "onion"],
  uttapam:             ["rice", "urad_dal", "onion", "tomato", "green chili", "coriander"],
  appam:               ["rice", "coconut milk", "urad_dal", "fenugreek seeds"],
  avial:               ["raw_banana", "carrot", "pumpkin", "coconut", "curd", "turmeric", "curry leaves"],
  thoran:              ["cabbage", "coconut", "turmeric", "mustard seeds", "curry leaves"],
  puttu:               ["rice flour", "coconut", "salt"],
  kootu:               ["chickpeas", "pumpkin", "coconut", "cumin", "turmeric"],
  chettinad_chicken:   ["chicken", "black pepper", "kalpasi", "marathi mokku", "garlic", "ginger", "coconut"],
  fish_molee:          ["fish", "coconut milk", "turmeric", "green chili", "ginger", "onion"],
  kerala_prawn:        ["shrimp", "coconut milk", "raw mango", "mustard seeds", "curry leaves"],
  fish_curry:          ["fish", "mustard seeds", "turmeric", "green chili", "mustard oil"],
  baingan_bharta:      ["eggplant", "onion", "tomato", "garlic", "mustard oil"],
  dhokla:              ["gram flour", "lemon juice", "eno", "mustard seeds", "green chili"],

  // ── Street food ─────────────────────────────────────────────
  poha:                ["flattened rice", "peanuts", "onion", "turmeric", "mustard seeds", "curry leaves"],
  bhel_puri:           ["puffed rice", "potato", "onion", "tomato", "tamarind chutney", "green chutney", "sev"],
  pani_puri:           ["semolina", "potato", "chickpeas", "tamarind water", "mint", "cumin"],
  sev_puri:            ["semolina", "potato", "onion", "tomato", "sev", "chutneys"],
  dahi_puri:           ["semolina", "potato", "curd", "tamarind chutney", "sev", "chaat masala"],
  aloo_tikki:          ["potato", "green chili", "coriander", "bread crumbs", "chaat masala"],
  kathi_roll:          ["whole wheat flour", "chicken", "onion", "capsicum", "egg", "green chutney"],
  frankie:             ["whole wheat flour", "potato", "onion", "chaat masala", "green chili"],
  bedmi_puri:          ["whole wheat flour", "urad_dal", "fennel", "ginger", "ghee"],
  poori_bhaji:         ["whole wheat flour", "potato", "onion", "tomato", "turmeric", "mustard seeds"],
  besan_chilla:        ["gram flour", "onion", "tomato", "green chili", "coriander", "turmeric"],
  vermicelli_upma:     ["vermicelli", "mustard seeds", "onion", "carrot", "green_peas", "curry leaves"],
  sabudana_khichdi:    ["sago", "potato", "peanuts", "cumin", "green chili", "ghee"],
  bread_upma:          ["bread", "onion", "tomato", "green chili", "mustard seeds", "curry leaves"],

  // ── Biryani & rice dishes ────────────────────────────────────
  chicken_biryani:     ["rice", "chicken", "curd", "onion", "biryani masala", "ghee", "saffron", "mint"],
  mutton_biryani:      ["rice", "lamb", "curd", "onion", "biryani masala", "ghee", "saffron", "ginger"],
  veg_biryani:         ["rice", "carrot", "green_peas", "beans", "potato", "curd", "biryani masala", "mint"],
  egg_biryani:         ["rice", "egg", "onion", "tomato", "biryani masala", "ghee", "curd"],
  fried_rice:          ["rice", "soy sauce", "carrot", "green_peas", "egg", "spring onion", "garlic"],
  egg_fried_rice:      ["rice", "egg", "spring onion", "soy sauce", "garlic", "green_peas"],
  congee:              ["rice", "ginger", "spring onion", "soy sauce", "sesame oil"],

  // ── Chicken dishes ───────────────────────────────────────────
  chicken_curry:       ["chicken", "onion", "tomato", "ginger", "garlic", "turmeric", "coriander powder"],
  chicken_65:          ["chicken", "curry leaves", "curd", "cornflour", "red chili", "garlic", "ginger"],
  chicken_stew:        ["chicken", "coconut milk", "potato", "carrot", "black pepper", "ginger"],

  // ── Global ───────────────────────────────────────────────────
  miso_soup:           ["miso paste", "tofu", "seaweed", "dashi", "green onion"],
  pasta_carbonara:     ["pasta", "egg", "guanciale", "pecorino cheese", "black pepper"],
  guacamole:           ["avocado", "lime", "onion", "cilantro", "jalapeño"],
  thai_green_curry:    ["coconut milk", "green curry paste", "bamboo shoots", "chicken", "basil", "lime"],
  hummus:              ["chickpeas", "tahini", "olive_oil", "lemon", "garlic"],
  falafel:             ["chickpeas", "parsley", "cilantro", "garlic", "cumin", "coriander"],
  pizza_margherita:    ["pizza dough", "tomato sauce", "mozzarella", "basil", "olive_oil"],
  tacos:               ["corn tortillas", "beef", "lettuce", "cheese", "salsa", "lime"],
  hakka_noodles:       ["noodles", "cabbage", "carrot", "capsicum", "soy sauce", "vinegar"],
  ramen:               ["ramen noodles", "broth", "soy sauce", "egg", "green onion", "seaweed"],
  spaghetti_bolognese: ["pasta", "beef", "tomato sauce", "onion", "garlic", "oregano"],
  oatmeal:             ["oats", "milk", "honey", "banana", "almonds"],
  shakshuka:           ["egg", "tomato", "capsicum", "onion", "cumin", "paprika", "olive_oil"],
  bibimbap:            ["rice", "egg", "spinach", "carrot", "mushroom", "soy sauce", "sesame oil"],
  pad_thai:            ["rice_noodles", "shrimp", "egg", "bean sprouts", "peanuts", "lime", "fish sauce"],
  pho:                 ["rice_noodles", "beef", "star anise", "ginger", "onion", "bean sprouts", "lime"],
  shawarma:            ["chicken", "curd", "garlic", "lemon", "cumin", "coriander", "flatbread"],
  fajitas:             ["chicken", "capsicum", "onion", "lime", "cumin", "smoked paprika", "corn tortillas"],
  greek_salad:         ["tomato", "cucumber", "onion", "olive_oil", "lemon", "oregano"],
  laksa:               ["rice_noodles", "coconut milk", "shrimp", "tofu", "lemongrass", "turmeric"],
  okonomiyaki:         ["cabbage", "egg", "flour", "spring onion", "bonito flakes", "mayo"],
}

// ─────────────────────────────────────────────────────────────
//  NUTRITION DATABASE   (per 100g)
//  Added: urad_dal, chana_dal, rice_noodles
//  Removed: duplicate oats entry
// ─────────────────────────────────────────────────────────────
const NUTRITION_DB = {
  chicken:       { cal: 165, p: 31,   c: 0,   f: 3.6 },
  egg:           { cal: 155, p: 13,   c: 1,   f: 11  },
  paneer:        { cal: 265, p: 18,   c: 3,   f: 21  },
  tofu:          { cal: 144, p: 15,   c: 3,   f: 9   },
  fish:          { cal: 150, p: 22,   c: 0,   f: 5   },
  beef:          { cal: 250, p: 26,   c: 0,   f: 15  },
  lamb:          { cal: 294, p: 25,   c: 0,   f: 21  },
  shrimp:        { cal: 99,  p: 24,   c: 0,   f: 0.3 },
  rice:          { cal: 130, p: 2.5,  c: 28,  f: 0.3 },
  brown_rice:    { cal: 111, p: 2.6,  c: 23,  f: 0.9 },
  pasta:         { cal: 160, p: 5,    c: 30,  f: 1   },
  rice_noodles:  { cal: 109, p: 2,    c: 25,  f: 0.2 },  // ← NEW
  potato:        { cal: 87,  p: 2,    c: 20,  f: 0.1 },
  sweet_potato:  { cal: 86,  p: 1.6,  c: 20,  f: 0.1 },
  moong_dal:     { cal: 347, p: 24,   c: 63,  f: 1.2 },
  toor_dal:      { cal: 343, p: 22,   c: 62,  f: 1.7 },
  urad_dal:      { cal: 341, p: 25,   c: 59,  f: 1.6 },  // ← NEW
  chana_dal:     { cal: 360, p: 20,   c: 65,  f: 5   },  // ← NEW
  chickpeas:     { cal: 364, p: 19,   c: 61,  f: 6   },
  rajma:         { cal: 333, p: 24,   c: 60,  f: 1   },
  masoor_dal:    { cal: 352, p: 25,   c: 63,  f: 1   },
  soy_chunks:    { cal: 345, p: 52,   c: 33,  f: 0.5 },
  spinach:       { cal: 23,  p: 3,    c: 4,   f: 0.4 },
  carrot:        { cal: 41,  p: 1,    c: 10,  f: 0.2 },
  onion:         { cal: 40,  p: 1,    c: 9,   f: 0.1 },
  tomato:        { cal: 18,  p: 1,    c: 4,   f: 0.2 },
  capsicum:      { cal: 20,  p: 1,    c: 5,   f: 0.1 },
  pumpkin:       { cal: 26,  p: 1,    c: 7,   f: 0.1 },
  raw_banana:    { cal: 89,  p: 1,    c: 23,  f: 0.3 },
  papaya:        { cal: 43,  p: 0.5,  c: 11,  f: 0.3 },
  ghee:          { cal: 900, p: 0,    c: 0,   f: 100 },
  olive_oil:     { cal: 884, p: 0,    c: 0,   f: 100 },
  butter:        { cal: 717, p: 1,    c: 0,   f: 81  },
  milk:          { cal: 60,  p: 3,    c: 5,   f: 3   },
  curd:          { cal: 98,  p: 11,   c: 3,   f: 4   },
  oats:          { cal: 389, p: 17,   c: 66,  f: 7   },
  quinoa:        { cal: 368, p: 14,   c: 64,  f: 6   },
  almonds:       { cal: 579, p: 21,   c: 22,  f: 50  },
  walnuts:       { cal: 654, p: 15,   c: 14,  f: 65  },
  peanut_butter: { cal: 588, p: 25,   c: 20,  f: 50  },
  broccoli:      { cal: 34,  p: 2.8,  c: 7,   f: 0.4 },
  cauliflower:   { cal: 25,  p: 1.9,  c: 5,   f: 0.3 },
  garlic:        { cal: 149, p: 6.4,  c: 33,  f: 0.5 },
  ginger:        { cal: 80,  p: 1.8,  c: 18,  f: 0.8 },
  mushroom:      { cal: 22,  p: 3,    c: 3,   f: 0.3 },
  green_peas:    { cal: 81,  p: 5,    c: 14,  f: 0.4 },
  avocado:       { cal: 160, p: 2,    c: 9,   f: 15  },
  banana:        { cal: 89,  p: 1.1,  c: 23,  f: 0.3 },
  semolina:      { cal: 360, p: 13,   c: 73,  f: 1   },
}

// ─────────────────────────────────────────────────────────────
//  QUANTITY INTELLIGENCE
//  Estimates a sensible serving size (g) per item based on
//  its macronutrient density rather than using a flat 100g.
// ─────────────────────────────────────────────────────────────
function estimateQuantity(item) {
  const data = NUTRITION_DB[item]
  if (!data) return 80
  if (data.f > 50) return 10   // fats (oils, nuts) — tiny amounts
  if (data.p > 15) return 150  // proteins — generous portion
  if (data.c > 40) return 120  // dense carbs — moderate portion
  return 100
}

// ─────────────────────────────────────────────────────────────
//  HEALTH SCORE ENGINE
//  Scores 0–100 based on macro balance, protein adequacy,
//  fat moderation, and calorie density.
// ─────────────────────────────────────────────────────────────
function computeHealthScore(totalCal, totalP, totalC, totalF) {
  const macroTotal = totalP * 4 + totalC * 4 + totalF * 9
  if (macroTotal === 0) return 50

  const proteinRatio = (totalP * 4) / macroTotal
  const carbRatio    = (totalC * 4) / macroTotal
  const fatRatio     = (totalF * 9) / macroTotal

  // Ideal macro split: 30% protein, 40% carbs, 30% fat
  const macroBalance =
    40 -
    Math.abs(proteinRatio - 0.3) * 100 -
    Math.abs(carbRatio   - 0.4) * 100 -
    Math.abs(fatRatio    - 0.3) * 100

  let score = Math.max(0, macroBalance)

  // Protein adequacy bonus
  score += totalP > 35 ? 25 : totalP > 20 ? 18 : 10

  // Fat moderation bonus
  score += fatRatio < 0.35 ? 20 : fatRatio < 0.45 ? 12 : 5

  // Calorie density bonus (lower = more room to eat satisfying volume)
  score += totalCal < 500 ? 15 : totalCal < 750 ? 10 : 5

  return Math.min(100, Math.round(score))
}

// ─────────────────────────────────────────────────────────────
//  TITLE ENGINE  (v2)
//  Draws from pools per dimension so titles feel varied and
//  specific rather than following one rigid template.
// ─────────────────────────────────────────────────────────────
const GOAL_WORDS = {
  muscle_gain: ["Power", "Anabolic", "Strength", "Protein-Packed", "Bulk"],
  weight_loss:  ["Lean", "Light", "Clean", "Stripped", "Slimline"],
  balanced:     ["Balanced", "Classic", "Everyday", "Wholesome", "Hearty"],
  maintenance:  ["Balanced", "Classic", "Everyday", "Wholesome", "Hearty"],
}

const SPICE_WORDS = {
  hot:    ["Fiery", "Blazing", "Inferno", "Scorched"],
  medium: ["Spiced", "Robust", "Warm"],
  mild:   ["Delicate", "Gentle", "Subtle"],
}

const CUISINE_SUFFIXES = {
  India:   ["Masala", "Bhuna", "Tadka", "Curry"],
  Italy:   ["Rustica", "della Nonna", "al Forno", "Primavera"],
  Mexico:  ["Adobo", "Criollo", "Asado", "de la Casa"],
  USA:     ["Smokehouse", "Skillet", "Griddle", "Backyard"],
  China:   ["Wok-Fired", "Imperial", "Szechuan", "Canton"],
  Japan:   ["Teishoku", "Umami", "Izakaya", "Bento"],
  Thailand:["Pad", "Gaeng", "Tom", "Street-Style"],
}

function generateTitle(lower, goal, spice, location) {
  const seed = lower.length * 7 + (spice === "hot" ? 3 : spice === "mild" ? 1 : 0)

  const primaryProtein =
    lower.find((i) => NUTRITION_DB[i]?.p > 15) ||
    lower.find((i) => NUTRITION_DB[i]?.c > 20) ||
    lower[0]

  const secondary = lower[1] && lower[1] !== primaryProtein
    ? ` & ${capitalize(lower[1])}`
    : ""

  const heatWord   = pick(SPICE_WORDS[spice]           ?? SPICE_WORDS.medium, seed)
  const goalWord   = pick(GOAL_WORDS[goal]             ?? GOAL_WORDS.balanced, seed + 1)
  const suffix     = pick(CUISINE_SUFFIXES[location]   ?? ["Style"],           seed + 2)

  return `${heatWord} ${goalWord} ${capitalize(primaryProtein)}${secondary} ${suffix}`
}

// ─────────────────────────────────────────────────────────────
//  DESCRIPTION ENGINE  (v2)
//  Builds a nutritionist-grade one-paragraph description that
//  names the cook style, all four macros, and the goal intent.
// ─────────────────────────────────────────────────────────────
const GOAL_CONTEXT = {
  muscle_gain:
    "optimised for hypertrophy — protein-dense, calorie-sufficient, and structured to support post-workout recovery",
  weight_loss:
    "engineered for a caloric deficit — high in fibre and lean protein to maximise satiety while minimising excess energy",
  balanced:
    "calibrated for steady-state nutrition — balanced macros to fuel daily activity without surplus or deficit",
  maintenance:
    "calibrated for steady-state nutrition — balanced macros to fuel daily activity without surplus or deficit",
}

function generateDescription({ lower, goal, location, totalCal, totalP, totalC, totalF }) {
  const profile  = getCuisineProfile(location)
  const goalCtx  = GOAL_CONTEXT[goal] ?? "designed for general wellness"
  const listed   = lower.slice(0, 3).map(capitalize).join(", ")
  const extras   = lower.length > 3 ? ` and ${lower.length - 3} more` : ""

  const macroProfile =
    totalP > totalC ? "protein-forward" :
    totalC > totalF ? "carbohydrate-led" :
    "fat-dominant"

  return (
    `A ${location}-inspired ${profile.cookStyle} dish built around ${listed}${extras}. ` +
    `This ${macroProfile} plate is ${goalCtx}. ` +
    `Delivers ~${Math.round(totalCal)} kcal | ` +
    `${Math.round(totalP)}g protein | ` +
    `${Math.round(totalC)}g carbs | ` +
    `${Math.round(totalF)}g fat — ` +
    `prepared via ${profile.technique}`
  )
}

// ─────────────────────────────────────────────────────────────
//  STEP FLOW ENGINE  (v3) — fully ingredient-aware
//
//  v2 was template-only: every recipe got the same 8 steps
//  regardless of whether you typed "chicken" or "rice" or "oats".
//
//  v3 detects ingredient categories first, then builds each step
//  from what is actually in the recipe. Chicken gets a marination
//  prep and sear step. Rice gets a wash+soak prep and absorption
//  method step. Dal gets a pressure-cook step. Pasta gets a boiling
//  step. Mixed dishes combine the relevant parts intelligently.
// ─────────────────────────────────────────────────────────────

// ── Ingredient category sets ──────────────────────────────────
const MEAT_SET    = new Set(["chicken","beef","lamb","fish","shrimp"])
const VEG_PROT    = new Set(["paneer","tofu","egg","soy_chunks"])
// urad_dal and chana_dal added so idli/dosa/upma dals get correct legume cooking steps
const LEGUME_SET  = new Set(["toor_dal","moong_dal","masoor_dal","urad_dal","chana_dal","chickpeas","rajma"])
const GRAIN_SET   = new Set(["rice","brown_rice","quinoa","semolina","oats","pasta","rice_noodles"])
const VEG_SET     = new Set([
  "spinach","carrot","tomato","capsicum","pumpkin","raw_banana","papaya",
  "broccoli","cauliflower","mushroom","green_peas","potato","sweet_potato",
  "onion","garlic","ginger","avocado","banana","cabbage",
])

// ── Per-protein prep text ─────────────────────────────────────
const PROTEIN_PREP = {
  chicken: (loc) => {
    const marinades = {
      India:   "yogurt, turmeric, red chili powder, garam masala and salt — minimum 20 min, overnight is better",
      Japan:   "soy sauce, mirin and a few drops of sesame oil — 15 min",
      Thailand:"fish sauce, lime juice and a pinch of turmeric — 20 min",
      Mexico:  "lime juice, cumin, smoked paprika and garlic — 20 min",
      default: "salt, pepper and a splash of oil — 15 min",
    }
    return `Cut chicken into even pieces. Marinate in ${marinades[loc] ?? marinades.default}.`
  },
  lamb:   (loc) => `Trim excess fat from lamb. Marinate in yogurt, ginger-garlic paste${loc === "India" ? ", garam masala" : ", salt and pepper"} for at least 30 min — the acid tenderises the meat.`,
  beef:   ()    => "Pat beef completely dry with kitchen paper — moisture is the enemy of a crust. Season generously with salt and pepper. Rest 10 min at room temperature.",
  fish:   ()    => "Pat fish dry. Marinate briefly in lemon juice, turmeric and salt for exactly 10 minutes — any longer and the acid starts cooking the flesh.",
  shrimp: ()    => "Devein and peel shrimp. Toss with a pinch of turmeric and salt. Do not marinate longer than 5 min — shrimp is delicate.",
  paneer: ()    => "Cut paneer into 2 cm cubes. For better texture, shallow-fry in a hot dry pan until golden on two sides — this stops it crumbling in the curry.",
  tofu:   ()    => "Press tofu between two plates with a heavy weight for 20 min to expel water — skipping this means it won't brown. Cut into cubes.",
  egg:    ()    => "Crack eggs into a bowl. Beat with a fork until yolks and whites are fully combined. Season with salt.",
  soy_chunks: () => "Soak soy chunks in hot salted water for 10 min until fully rehydrated. Squeeze out excess water firmly before cooking.",
}

// ── Per-grain prep + cooking text ─────────────────────────────
const GRAIN_PREP = {
  rice:         "Wash rice 2–3 times in cold water until it runs clear — this removes excess starch and prevents clumping. Soak for 20 min.",
  brown_rice:   "Wash brown rice and soak for 30 min minimum — it's denser than white rice and needs the extra hydration to cook evenly.",
  pasta:        "Bring a large pot of water to a rolling boil. Salt it heavily — it should taste like the sea. This is your only chance to season the pasta itself.",
  rice_noodles: "Soak rice noodles in room-temperature water for 20–30 min until pliable but not soft — they finish cooking in the wok/pan. Do not use boiling water or they turn mushy.",
  semolina:     "Dry-roast semolina in a wide pan over medium heat, stirring constantly, until it turns lightly golden and smells nutty — about 3–4 min.",
  oats:         "Measure oats and set aside. Warm your liquid (milk or water) in a separate pan — adding oats to cold liquid makes them gluey.",
  quinoa:       "Rinse quinoa thoroughly under cold water for 1 full minute — it has a natural bitter coating (saponin) that must be washed off.",
}

const GRAIN_COOK = {
  rice:         "Add the soaked and drained rice. Stir once, bring to a boil, then reduce to the lowest possible heat. Lid on, undisturbed — 12 min for white rice. No peeking.",
  brown_rice:   "Add soaked brown rice with 1:2.5 water ratio. Bring to boil, reduce heat to minimum, lid on for 35 min. Rest off heat 10 min before fluffing.",
  pasta:        "Add pasta to boiling water. Cook until al dente — 1–2 min less than packet instructions. Reserve 1 cup pasta water before draining. Never rinse the pasta.",
  rice_noodles: "Add soaked noodles to the hot pan last. Toss rapidly for 2–3 min only — they need no more cooking, just to absorb the sauce. Overcooking makes them gluey.",
  semolina:     "Pour hot liquid into roasted semolina slowly while stirring constantly to prevent lumps. Cook on low heat, stirring, until it pulls away from the pan.",
  oats:         "Add oats to warm liquid. Stir continuously on medium-low heat for 4–5 min until thick and creamy. Pull off heat while still slightly loose — it thickens as it cools.",
  quinoa:       "Add quinoa with 1:2 water ratio. Bring to boil, reduce to simmer, cover for 15 min until all water is absorbed. Fluff with a fork — look for the white tails to appear.",
}

// ── Per-legume prep + cooking text ────────────────────────────
const LEGUME_PREP = {
  toor_dal:   "Rinse toor dal until water runs clear. No soaking needed — it pressure cooks well from dry.",
  moong_dal:  "Rinse moong dal. It cooks fast — 2 whistles in a pressure cooker or 20 min on the stovetop.",
  masoor_dal: "Rinse masoor dal. It's the fastest-cooking lentil — no soaking needed, 15 min on stovetop.",
  urad_dal:   "Rinse urad dal 2–3 times until water runs mostly clear. Soak for 30 min if time allows — it speeds up cooking and improves texture.",
  chana_dal:  "Rinse chana dal and soak for 30 min minimum. Soaking reduces cooking time and makes it easier to digest.",
  chickpeas:  "If using dried chickpeas: soak in cold water for 8–12 hours — they must double in size. If canned: rinse thoroughly under cold water to reduce sodium by ~40%.",
  rajma:      "Soak rajma in cold water for 8–12 hours minimum. IMPORTANT: rajma contains toxic lectins (phytohaemagglutinin) and must be boiled vigorously for at least 10 min before any simmering.",
}

const LEGUME_COOK = {
  toor_dal:   "Pressure cook toor dal for 3–4 whistles until completely soft and mashable. Under-cooked dal causes digestive discomfort — when in doubt, cook longer.",
  moong_dal:  "Pressure cook moong dal for 2 whistles, or simmer covered for 20–25 min. It should be fully soft — no bite remaining.",
  masoor_dal: "Simmer masoor dal for 15–20 min without a lid — it dissolves easily and thickens the base naturally.",
  urad_dal:   "Pressure cook urad dal for 3–4 whistles, or boil for 25–30 min. It should be completely soft — the outer skin should split slightly.",
  chana_dal:  "Pressure cook soaked chana dal for 3 whistles until soft but not mushy — individual grains should hold their shape.",
  chickpeas:  "If dried and soaked: pressure cook 4–5 whistles. If canned: they only need 5 min to warm through — don't overcook or they go mushy.",
  rajma:      "After the 10-min vigorous boil, pressure cook for 5–6 whistles until completely tender. The skin should be soft and the inside creamy.",
}

// ── Cuisine-specific tadka/blooming instructions ──────────────
const CUISINE_BLOOM = {
  India:    (spice, profile) =>
    spice === "hot"
      ? `Heat ${profile.fat} until it just begins to smoke. Add ${profile.tempering.join(", ")} — increase chili by 50%. They should splutter aggressively — this is intentional.`
      : spice === "mild"
      ? `Warm ${profile.fat} on medium (not hot). Add ${profile.tempering.slice(0,2).join(" and ")} only. No chili. Let them sizzle gently for 30 sec.`
      : `Heat ${profile.fat} until shimmering. Add ${profile.tempering.join(", ")} and cook until they splutter and the kitchen smells intensely fragrant — about 45 sec.`,
  Italy:    (_, profile) => `Warm ${profile.fat} on medium-low — never hot. Add ${profile.tempering.join(" and ")}. The garlic should turn pale gold, not brown. Brown = bitter.`,
  Mexico:   (_, profile) => `Heat ${profile.fat} in a wide pan. Add ${profile.tempering.join(", ")} and toast for 60 sec until deeply fragrant. This blooming step is where most of the flavour lives.`,
  USA:      (_, profile) => `Get the pan screaming hot before adding ${profile.fat}. Add ${profile.tempering.join(" and ")} — you want an immediate sizzle, not a slow warm.`,
  China:    (_, profile) => `Wok must be at maximum heat before adding ${profile.fat}. Add ${profile.tempering.join(", ")} and toss for 15–20 sec only — wok hei cooking moves fast.`,
  Japan:    (_, profile) => `Warm ${profile.fat} on medium. Add ${profile.tempering.join(" and ")} and cook gently for 1 min — Japanese cooking avoids aggressive charring.`,
  Thailand: (_, profile) => `Fry curry paste in ${profile.fat} over medium-high until the oil visibly splits and the paste turns a deep, fragrant colour — this is the non-negotiable flavour foundation.`,
}

// ── Plate steps that name actual ingredients ──────────────────
function buildPlateStep(proteins, grains, legumes, veggies, goal) {
  const mainProt  = proteins[0]  ? capitalize(proteins[0])  : null
  const mainGrain = grains[0]    ? capitalize(grains[0])    : null
  const mainLeg   = legumes[0]   ? capitalize(legumes[0])   : null
  const mainVeg   = veggies[0]   ? capitalize(veggies[0])   : null

  const carb = mainGrain ?? mainLeg ?? "carbs"
  const prot = mainProt  ?? mainLeg ?? "the main"

  if (goal === "muscle_gain")
    return `Plate ${prot} as the centrepiece with a generous portion. Add ${carb} and ${mainVeg ?? "vegetables"} around it. The meal should feel substantial — this is a growth plate.`
  if (goal === "weight_loss")
    return `Use a smaller plate. Fill half with ${mainVeg ?? "vegetables"}, a quarter with ${prot}, a quarter with ${carb}. The visual ratio keeps portions honest.`
  return `Plate in balanced thirds: ${prot}, ${carb}, ${mainVeg ?? "vegetables"}. Garnish with the cuisine's fresh herb.`
}

// ── Main step generator ───────────────────────────────────────
function generateSteps({ lower, goal, spice, location }) {
  const profile = getCuisineProfile(location)

  const proteins  = lower.filter((i) => MEAT_SET.has(i) || VEG_PROT.has(i))
  const meats     = lower.filter((i) => MEAT_SET.has(i))
  const vegProts  = lower.filter((i) => VEG_PROT.has(i))
  const grains    = lower.filter((i) => GRAIN_SET.has(i))
  const legumes   = lower.filter((i) => LEGUME_SET.has(i))
  const veggies   = lower.filter((i) => VEG_SET.has(i))

  const hasGrain   = grains.length  > 0
  const hasLegume  = legumes.length > 0
  const hasMeat    = meats.length   > 0
  const hasVegProt = vegProts.length > 0
  const hasVeg     = veggies.length > 0
  const hasProtein = proteins.length > 0

  // ── 1. PREP ────────────────────────────────────────────────
  const prepParts = []
  grains.forEach((g) => { if (GRAIN_PREP[g]) prepParts.push(GRAIN_PREP[g]) })
  legumes.forEach((l) => { if (LEGUME_PREP[l]) prepParts.push(LEGUME_PREP[l]) })
  const prepFn = meats[0]
    ? PROTEIN_PREP[meats[0]]
    : vegProts[0]
    ? PROTEIN_PREP[vegProts[0]]
    : null
  if (prepFn) prepParts.push(prepFn(location))
  if (!prepParts.length)
    prepParts.push("Wash, peel and cut all ingredients into uniform pieces. Mise en place — have everything ready before heat goes on.")

  const prepText = prepParts.join(" ")

  // ── 2. FAT & BLOOM ─────────────────────────────────────────
  const bloomFn = CUISINE_BLOOM[location]
  const bloomText = bloomFn
    ? bloomFn(spice, profile)
    : `Heat ${profile.fat} over medium-high. Add ${profile.tempering.join(", ")} and cook until fragrant.`

  // ── 3. AROMATICS ───────────────────────────────────────────
  const skipAromatics = !hasProtein && !hasVeg && hasGrain && !hasLegume
  const aromaticsText = skipAromatics
    ? null
    : `AROMATICS — Add ${profile.aromatics.join(", ")} and cook until the raw smell disappears and the base looks glossy (~3–4 min).`

  // ── 4. MAIN PROTEIN / GRAIN / LEGUME cook step ─────────────
  let mainCookStep = null

  if (hasMeat) {
    const meatName = capitalize(meats[0])
    const tempNote = meats[0] === "chicken" ? " — target 74 °C internal" : meats[0] === "fish" ? " — target 63 °C internal" : ""
    if (goal === "muscle_gain")
      mainCookStep = `PROTEIN — Add ${meatName} and cook to exact doneness${tempNote}. Do not overcook — every extra minute reduces amino acid bioavailability.`
    else if (goal === "weight_loss")
      mainCookStep = `PROTEIN — Add ${meatName} using minimal oil. Cook through completely${tempNote}. Drain any excess fat before continuing.`
    else
      mainCookStep = `PROTEIN — Add ${meatName} and sear over medium-high until golden on all sides (4–6 min). Lower heat and cook through gently${tempNote}.`
  } else if (hasVegProt) {
    const vpName = capitalize(vegProts[0])
    if (vegProts[0] === "paneer")
      mainCookStep = `PROTEIN — Add ${vpName} cubes. Cook 3–4 min only — paneer turns rubbery quickly. It's done when warmed through and coated in the masala.`
    else if (vegProts[0] === "egg")
      mainCookStep = `PROTEIN — Pour in beaten eggs. Fold gently on low heat — remove from heat while still slightly wet, residual heat finishes them perfectly.`
    else if (vegProts[0] === "tofu")
      mainCookStep = `PROTEIN — Add pressed tofu cubes. Do not stir for 2–3 min — let a crust form before flipping. Toss gently once golden.`
    else
      mainCookStep = `PROTEIN — Add ${vpName} and cook through, stirring occasionally, until well coated and heated through.`
  } else if (hasLegume) {
    const legName = legumes[0]
    mainCookStep = `COOK — ${LEGUME_COOK[legName] ?? "Cook legumes until completely soft — taste for doneness before proceeding."}`
  } else if (hasGrain) {
    const grainName = grains[0]
    mainCookStep = `COOK — ${GRAIN_COOK[grainName] ?? `Cook ${capitalize(grainName)} according to standard method until done.`}`
  }

  // ── 5. VEGETABLES ──────────────────────────────────────────
  const vegStep = hasVeg
    ? `VEGETABLES — Add ${veggies.map(capitalize).join(", ")} and toss to coat in the base. ${
        veggies.some((v) => ["spinach","green_peas"].includes(v))
          ? "Leafy/delicate veg go in last — 60–90 sec only before finishing."
          : "Cook until just tender — a slight bite is better than mushy."
      }`
    : null

  // ── 6. SIMMER ──────────────────────────────────────────────
  let simmerStep = null
  if (hasMeat || hasVegProt) {
    simmerStep = `SIMMER — Lower heat, cover, and cook until all components are cohesive and the sauce coats the back of a spoon (${hasMeat ? "10–15 min for meat" : "5–8 min for veg protein"}). Taste and adjust seasoning.`
  } else if (hasLegume && hasVeg) {
    simmerStep = `SIMMER — Combine cooked dal/legumes with the vegetable base. Simmer uncovered for 5 min so the flavours marry. Mash lightly for a creamier consistency.`
  } else if (hasGrain && hasVeg) {
    simmerStep = `COMBINE — Add cooked ${grains.map(capitalize).join("/")} to the vegetable base. Toss well over high heat for 2 min to coat every grain in the flavour base.`
  }

  // ── 7. FINISH ──────────────────────────────────────────────
  const finishText = `FINISH — ${capitalize(profile.finish)}.`

  // ── 8. PLATE ───────────────────────────────────────────────
  const plateText = `PLATE — ${buildPlateStep(proteins, grains, legumes, veggies, goal)}`

  return [
    `PREP — ${prepText}`,
    `FAT & BLOOM — ${bloomText}`,
    aromaticsText,
    mainCookStep,
    vegStep,
    simmerStep,
    finishText,
    plateText,
  ].filter(Boolean)
}

// ─────────────────────────────────────────────────────────────
//  BUDGET LOGIC ENGINE  (v2)
//  Per-ingredient cost DB + location cost-of-living factor.
// ─────────────────────────────────────────────────────────────
const INGREDIENT_COST = {
  chicken: 40, mutton: 90, fish: 60, egg: 12, paneer: 50,
  tofu: 35, toor_dal: 15, moong_dal: 15, urad_dal: 14, chana_dal: 13,
  chickpeas: 18, rajma: 20, masoor_dal: 14,
  rice: 8, pasta: 18, rice_noodles: 20, oats: 15, quinoa: 45, potato: 6,
  tomato: 8, onion: 5, capsicum: 12, spinach: 10,
  carrot: 7, mushroom: 30, broccoli: 25, cauliflower: 10,
  ghee: 20, butter: 15, milk: 6, curd: 10,
}

const LOCATION_COST_FACTOR = {
  India: 1.0, USA: 4.8, Italy: 4.2, Mexico: 2.1,
  China: 1.8, Japan: 5.5, Thailand: 1.5,
}

function estimateBudget(lower, location, budget, totalP) {
  const factor      = LOCATION_COST_FACTOR[location] ?? 2.0
  const proteinMult = totalP > 50 ? 1.2 : totalP > 40 ? 1.1 : 1.0
  const goalMult    = 1.0

  const raw = lower.reduce((sum, item) => {
    return sum + (INGREDIENT_COST[item] ?? 40)
  }, 0)

  const computed = Math.round(raw * factor * proteinMult * goalMult)
  return `₹${Math.min(budget, computed)}`
}

// ─────────────────────────────────────────────────────────────
//  INGREDIENT SUGGESTION ENGINE  (v2)
// ─────────────────────────────────────────────────────────────
const SUGGESTION_DB = {
  chicken:    { base: ["garlic","ginger","lemon","black pepper","onion"],    pair: ["spinach","capsicum","mushroom"] },
  lamb:       { base: ["onion","ginger","garlic","curd","bay leaf"],          pair: ["potato","turnip"] },
  fish:       { base: ["lemon","dill","garlic","capers"],                     pair: ["asparagus","cherry tomato"] },
  egg:        { base: ["onion","tomato","chili","coriander"],                 pair: ["capsicum","cheese"] },
  paneer:     { base: ["capsicum","tomato","onion","kasuri methi"],           pair: ["green_peas","spinach"] },
  tofu:       { base: ["soy sauce","ginger","garlic","sesame oil"],           pair: ["bok choy","mushroom","edamame"] },
  toor_dal:   { base: ["ghee","cumin","asafoetida","garlic","tomato"],        pair: ["spinach","lemon"] },
  urad_dal:   { base: ["ghee","cumin","asafoetida","ginger"],                 pair: ["toor_dal","moong_dal"] },
  moong_dal:  { base: ["ghee","cumin","ginger","garlic"],                     pair: ["spinach","lemon"] },
  chickpeas:  { base: ["onion","tomato","cumin","amchur"],                    pair: ["potato","tamarind"] },
  rajma:      { base: ["onion","tomato","ginger","garam masala"],             pair: ["cream","kasuri methi"] },
  rice:       { base: ["peas","carrot","beans","bay leaf"],                   pair: ["onion","cashew"] },
  pasta:      { base: ["garlic","olive_oil","parmesan","basil"],              pair: ["cherry tomato","spinach"] },
  oats:       { base: ["banana","honey","cinnamon"],                          pair: ["almond","blueberry"] },
  spinach:    { base: ["garlic","olive_oil","nutmeg"],                        pair: ["lemon","pine nuts"] },
  mushroom:   { base: ["garlic","thyme","butter"],                            pair: ["parmesan","truffle oil"] },
  broccoli:   { base: ["garlic","olive_oil","chili flakes"],                  pair: ["lemon","parmesan"] },
}

const GOAL_BOOST = {
  muscle_gain: new Set(["egg","paneer","chicken","chickpeas","toor_dal","quinoa","greek yogurt"]),
  weight_loss:  new Set(["spinach","broccoli","cucumber","lemon","oats"]),
  balanced:     new Set(["tomato","onion","garlic","olive_oil","curd"]),
  maintenance:  new Set(["tomato","onion","garlic","olive_oil","curd"]),
}

function generateSuggestions(lower, goal, location, maxResults = 4) {
  const profile    = getCuisineProfile(location)
  const inputSet   = new Set(lower)
  const goalBoost  = GOAL_BOOST[goal] ?? GOAL_BOOST.balanced
  const scores     = {}

  const add = (item, pts) => {
    if (inputSet.has(item)) return
    scores[item] = (scores[item] ?? 0) + pts
  }

  lower.forEach((ing) => {
    const entry = SUGGESTION_DB[ing]
    if (!entry) return
    entry.base.forEach((s) => add(s, 3))
    entry.pair.forEach((s) => add(s, 2))
  })

  profile.tempering.forEach((s) => add(s.split(" ")[0], 2))
  profile.aromatics.forEach((s) => add(s.split(" ")[0], 1))

  Object.keys(scores).forEach((item) => {
    if (goalBoost.has(item)) scores[item] += 4
  })

  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxResults)
    .map(([item]) => capitalize(item))
}

// ─────────────────────────────────────────────────────────────
//  MORE DISH ALIASES  (already merged into main DISH_ALIASES above)
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
//  MICRONUTRIENT DATABASE  (per 100g)
//  fibre(g) · iron(mg) · calcium(mg) · vitC(mg) · vitA(mcg RAE)
//  Added: urad_dal, chana_dal, rice_noodles
// ─────────────────────────────────────────────────────────────
const MICRO_DB = {
  chicken:      { fibre: 0,    iron: 1.3, calcium: 11,  vitC: 0,  vitA: 21  },
  egg:          { fibre: 0,    iron: 1.2, calcium: 50,  vitC: 0,  vitA: 160 },
  paneer:       { fibre: 0,    iron: 0.3, calcium: 480, vitC: 0,  vitA: 280 },
  tofu:         { fibre: 0.3,  iron: 2.7, calcium: 350, vitC: 0,  vitA: 0   },
  fish:         { fibre: 0,    iron: 0.9, calcium: 20,  vitC: 0,  vitA: 54  },
  beef:         { fibre: 0,    iron: 2.6, calcium: 18,  vitC: 0,  vitA: 0   },
  lamb:         { fibre: 0,    iron: 1.9, calcium: 17,  vitC: 0,  vitA: 0   },
  shrimp:       { fibre: 0,    iron: 0.5, calcium: 64,  vitC: 0,  vitA: 0   },
  rice:         { fibre: 0.4,  iron: 0.2, calcium: 10,  vitC: 0,  vitA: 0   },
  brown_rice:   { fibre: 1.8,  iron: 0.4, calcium: 23,  vitC: 0,  vitA: 0   },
  pasta:        { fibre: 1.8,  iron: 1.3, calcium: 7,   vitC: 0,  vitA: 0   },
  rice_noodles: { fibre: 0.5,  iron: 0.3, calcium: 7,   vitC: 0,  vitA: 0   },  // ← NEW
  potato:       { fibre: 2.2,  iron: 0.8, calcium: 12,  vitC: 20, vitA: 2   },
  sweet_potato: { fibre: 3.0,  iron: 0.6, calcium: 30,  vitC: 20, vitA: 961 },
  moong_dal:    { fibre: 7.6,  iron: 6.7, calcium: 132, vitC: 4,  vitA: 6   },
  toor_dal:     { fibre: 8.0,  iron: 5.3, calcium: 73,  vitC: 0,  vitA: 3   },
  urad_dal:     { fibre: 8.0,  iron: 7.6, calcium: 138, vitC: 0,  vitA: 0   },  // ← NEW
  chana_dal:    { fibre: 8.1,  iron: 4.9, calcium: 102, vitC: 1,  vitA: 2   },  // ← NEW
  chickpeas:    { fibre: 12.2, iron: 4.3, calcium: 105, vitC: 4,  vitA: 3   },
  rajma:        { fibre: 15.2, iron: 5.5, calcium: 83,  vitC: 5,  vitA: 0   },
  masoor_dal:   { fibre: 7.9,  iron: 6.5, calcium: 56,  vitC: 1,  vitA: 0   },
  soy_chunks:   { fibre: 5.6,  iron: 10.4,calcium: 350, vitC: 0,  vitA: 0   },
  spinach:      { fibre: 2.2,  iron: 2.7, calcium: 99,  vitC: 28, vitA: 469 },
  carrot:       { fibre: 2.8,  iron: 0.3, calcium: 33,  vitC: 6,  vitA: 835 },
  onion:        { fibre: 1.7,  iron: 0.2, calcium: 23,  vitC: 7,  vitA: 2   },
  tomato:       { fibre: 1.2,  iron: 0.3, calcium: 18,  vitC: 23, vitA: 75  },
  capsicum:     { fibre: 2.1,  iron: 0.4, calcium: 11,  vitC: 128,vitA: 18  },
  pumpkin:      { fibre: 0.5,  iron: 0.4, calcium: 16,  vitC: 9,  vitA: 426 },
  raw_banana:   { fibre: 2.6,  iron: 0.6, calcium: 8,   vitC: 15, vitA: 3   },
  papaya:       { fibre: 1.7,  iron: 0.1, calcium: 24,  vitC: 62, vitA: 47  },
  broccoli:     { fibre: 2.6,  iron: 0.7, calcium: 47,  vitC: 89, vitA: 31  },
  cauliflower:  { fibre: 2.0,  iron: 0.4, calcium: 22,  vitC: 48, vitA: 0   },
  mushroom:     { fibre: 1.0,  iron: 0.5, calcium: 3,   vitC: 2,  vitA: 0   },
  green_peas:   { fibre: 5.5,  iron: 1.5, calcium: 25,  vitC: 40, vitA: 38  },
  avocado:      { fibre: 6.7,  iron: 0.6, calcium: 12,  vitC: 10, vitA: 7   },
  banana:       { fibre: 2.6,  iron: 0.3, calcium: 5,   vitC: 9,  vitA: 3   },
  garlic:       { fibre: 2.1,  iron: 1.7, calcium: 181, vitC: 31, vitA: 0   },
  ginger:       { fibre: 2.0,  iron: 0.6, calcium: 16,  vitC: 5,  vitA: 0   },
  ghee:         { fibre: 0,    iron: 0,   calcium: 0,   vitC: 0,  vitA: 0   },
  butter:       { fibre: 0,    iron: 0,   calcium: 24,  vitC: 0,  vitA: 684 },
  milk:         { fibre: 0,    iron: 0.1, calcium: 125, vitC: 0,  vitA: 46  },
  curd:         { fibre: 0,    iron: 0.1, calcium: 110, vitC: 0,  vitA: 27  },
  oats:         { fibre: 10.6, iron: 4.7, calcium: 54,  vitC: 0,  vitA: 0   },
  quinoa:       { fibre: 7.0,  iron: 4.6, calcium: 47,  vitC: 0,  vitA: 14  },
  almonds:      { fibre: 12.5, iron: 3.7, calcium: 264, vitC: 0,  vitA: 0   },
  walnuts:      { fibre: 6.7,  iron: 2.9, calcium: 98,  vitC: 1,  vitA: 1   },
  semolina:     { fibre: 3.9,  iron: 1.2, calcium: 17,  vitC: 0,  vitA: 0   },
}

function computeMicros(lower) {
  let fibre = 0, iron = 0, calcium = 0, vitC = 0, vitA = 0
  lower.forEach((item) => {
    const m   = MICRO_DB[item]
    if (!m) return
    const qty = estimateQuantity(item)
    fibre   += (m.fibre   * qty) / 100
    iron    += (m.iron    * qty) / 100
    calcium += (m.calcium * qty) / 100
    vitC    += (m.vitC    * qty) / 100
    vitA    += (m.vitA    * qty) / 100
  })
  return {
    fibre:   +(fibre.toFixed(1)),
    iron:    +(iron.toFixed(1)),
    calcium: Math.round(calcium),
    vitC:    Math.round(vitC),
    vitA:    Math.round(vitA),
  }
}

// ─────────────────────────────────────────────────────────────
//  ALLERGEN ENGINE
//  Tags each ingredient against 8 common allergen categories.
// ─────────────────────────────────────────────────────────────
const ALLERGEN_TAGS = {
  egg:          ["Eggs"],
  pasta:        ["Gluten"],
  rice_noodles: ["Gluten-Free"],   // informational: explicitly gluten-free grain
  semolina:     ["Gluten"],
  paneer:       ["Dairy"],
  milk:         ["Dairy"],
  curd:         ["Dairy"],
  butter:       ["Dairy"],
  ghee:         ["Dairy"],
  cream:        ["Dairy"],
  cheese:       ["Dairy"],
  almonds:      ["Tree Nuts"],
  walnuts:      ["Tree Nuts"],
  cashews:      ["Tree Nuts"],
  peanut_butter:["Peanuts"],
  shrimp:       ["Shellfish"],
  tofu:         ["Soy"],
  soy_chunks:   ["Soy"],
  fish:         ["Fish"],
  wheat_flour:  ["Gluten"],
  urad_dal:     ["Gluten-Free"],   // informational: urad dal is gluten-free
  bread:        ["Gluten", "Eggs", "Dairy"],
}

function detectAllergens(lower) {
  const found = new Set()
  lower.forEach((item) => {
    const tags = ALLERGEN_TAGS[item]
    if (tags) tags.forEach((t) => found.add(t))
  })
  return [...found].sort()
}

// ─────────────────────────────────────────────────────────────
//  BUDGET SWAP ENGINE
// ─────────────────────────────────────────────────────────────
const BUDGET_SWAPS_DB = {
  paneer:    { swap: "Tofu or scrambled egg",     saving: "~40%", note: "Same protein hit, much lighter on budget" },
  chicken:   { swap: "Soy chunks or egg",          saving: "~50%", note: "Equal protein at a fraction of the cost" },
  lamb:      { swap: "Chicken or soy chunks",      saving: "~60%", note: "Significantly cheaper, similar macros" },
  fish:      { swap: "Canned tuna or soy chunks",  saving: "~45%", note: "Good protein source at lower price point" },
  shrimp:    { swap: "Fish or soy chunks",         saving: "~40%", note: "Similar protein profile, easier to find" },
  quinoa:    { swap: "Brown rice",                 saving: "~70%", note: "Similar fibre content, far cheaper" },
  broccoli:  { swap: "Cabbage or cauliflower",     saving: "~60%", note: "Similar nutrients, widely available" },
  mushroom:  { swap: "Green peas or capsicum",     saving: "~50%", note: "Adds colour and texture at low cost" },
  almonds:   { swap: "Peanuts or roasted chana",   saving: "~65%", note: "Similar fat and protein profile" },
  avocado:   { swap: "Thick curd or hummus",       saving: "~75%", note: "Similar healthy fat content" },
  olive_oil: { swap: "Mustard oil or sunflower",   saving: "~60%", note: "Good high-heat alternatives" },
  cream:     { swap: "Thick curd or cashew paste", saving: "~55%", note: "Same richness, higher protein" },
  saffron:   { swap: "Turmeric + pinch of food colour", saving: "~95%", note: "Achieves the colour — not the flavour" },
  beef:      { swap: "Chicken or soy chunks",      saving: "~55%", note: "Leaner, cheaper, widely available in India" },
  walnuts:   { swap: "Peanuts or sunflower seeds", saving: "~70%", note: "Similar omega-3 profile at lower cost" },
}

function getBudgetSwaps(lower) {
  return lower
    .filter((item) => BUDGET_SWAPS_DB[item])
    .map((item) => ({ ingredient: capitalize(item), ...BUDGET_SWAPS_DB[item] }))
}

// ─────────────────────────────────────────────────────────────
//  COMMON MISTAKES ENGINE
// ─────────────────────────────────────────────────────────────
const INGREDIENT_MISTAKES = {
  chicken:    [
    "Undercooking is a food safety risk — verify internal temp reaches 74°C / 165°F",
    "Skipping marination leaves the meat dry and flavourless — minimum 20 min, ideally overnight",
  ],
  paneer:     [
    "Overcooking makes it rubbery — add paneer in the last 3–4 minutes, heat through gently",
    "Frying on low heat makes it absorb too much oil — use medium-high for a quick golden crust",
  ],
  egg:        [
    "High heat makes eggs rubbery — always cook on medium or lower",
    "For scrambled eggs: pull off heat just before fully set — residual heat finishes the job",
  ],
  fish:       [
    "Fish overcooks in seconds — it's done when it flakes easily with a fork",
    "Don't move fish for the first 2–3 minutes — let the crust form or it will tear",
  ],
  toor_dal:   [
    "Undercooked dal causes digestive discomfort — pressure cook until completely soft",
    "Add salt only after dal is fully cooked — salt hardens legumes during cooking",
  ],
  moong_dal:  [
    "Pressure cook fully — undercooked moong causes bloating",
    "Tadka must go in over hot oil at the very end for maximum fragrance",
  ],
  urad_dal:   [
    "Soak for at least 30 min — under-soaked urad dal stays dense and takes far longer to cook",
    "For idli/dosa batter: grind urad dal with cold water for a light, airy batter — warm water makes it dense",
  ],
  chana_dal:  [
    "Don't skip soaking — unsoaked chana dal cooks unevenly, hard on the outside, mushy inside",
    "It should hold its shape after cooking — if it's dissolving, you've overcooked it",
  ],
  rajma:      [
    "Never eat undercooked kidney beans — they contain toxic lectins (phytohaemagglutinin)",
    "Must boil vigorously for at least 10 minutes before any simmering",
  ],
  chickpeas:  [
    "Dried chickpeas must soak 8+ hours — undersoaked ones stay hard regardless of cook time",
    "Canned: always rinse thoroughly to reduce sodium content by ~40%",
  ],
  rice:       [
    "Not washing removes excess starch — skipping this step makes rice sticky and clumped",
    "Don't lift the lid while steaming — escaping steam ruins texture",
  ],
  rice_noodles: [
    "Never boil rice noodles — soak in room-temperature water, then finish in the pan",
    "They continue cooking from residual heat — pull them off the heat 30 sec before they look done",
  ],
  spinach:    [
    "Add spinach in the last 30 seconds — it wilts instantly and overcooking turns it mushy",
    "Don't cover the pan — trapped steam turns it an unappetising army green colour",
  ],
  potato:     [
    "Start potatoes in cold water — hot water cooks the outside before the centre is done",
    "Dry potatoes completely before frying — moisture steams them instead of crisping",
  ],
  mushroom:   [
    "Don't crowd the pan — mushrooms steam and go soggy instead of browning",
    "Add salt only after browning — salt draws out moisture immediately and prevents caramelisation",
  ],
  oats:       [
    "Don't add boiling liquid all at once — add gradually and stir for a creamy texture",
    "Rolled oats need 5 min, instant oats need 90 sec — don't mix them up",
  ],
  pasta:      [
    "Salt the water generously — it should taste like the sea, not cooking water",
    "Never rinse pasta after draining — you wash off the starch that helps sauce cling",
  ],
  tofu:       [
    "Press tofu for 20+ minutes before cooking — excess water prevents browning",
    "Freeze then thaw before cooking for a chewier, meatier texture",
  ],
  lamb:       [
    "Lamb must be brought to room temperature before cooking — cold meat seizes in the pan",
    "Don't rush the cooking — low and slow develops deep flavour",
  ],
}

const CUISINE_MISTAKES = {
  India:    ["Burning the tempering (tadka) ruins the whole dish — watch the spices, they turn in seconds", "Adding water to a masala too early stops the bhuno process — let the oil separate first"],
  Italy:    ["Never let olive oil smoke — it turns bitter, use medium heat always", "Salting pasta water is not optional — under-salted pasta tastes flat regardless of sauce"],
  Mexico:   ["Under-toasting dried chilies gives no depth — they should darken and smell nutty, not burned", "Don't skip blooming spices in fat — this is where most of the flavour lives"],
  China:    ["Wok must be at full blast before anything goes in — medium heat produces steamed, not stir-fried food", "Add sauce to the side of the wok, not directly on food — it should sizzle on contact"],
  Japan:    ["Dashi is the foundation — instant dashi powder is acceptable but fresh kombu/katsuobushi is far better", "Never boil miso broth — high heat destroys the probiotics and makes it bitter"],
  Thailand: ["Oil must visibly split from coconut cream before adding other ingredients — this is the flavour base", "Balance fish sauce + lime + palm sugar before serving — Thai food is about harmony of all four tastes"],
  USA:      ["A cold pan means no crust — always preheat your pan before adding oil or protein", "Don't skip the rest after cooking meat — cutting immediately loses all the juices"],
}

function getCommonMistakes(lower, location) {
  const byIngredient = lower
    .filter((i) => INGREDIENT_MISTAKES[i])
    .flatMap((i) => INGREDIENT_MISTAKES[i])

  const byCuisine = CUISINE_MISTAKES[location] ?? []

  const all = [...new Set([...byIngredient, ...byCuisine])]
  return all.slice(0, 6)
}

// ─────────────────────────────────────────────────────────────
//  BEST PAIRED WITH ENGINE
// ─────────────────────────────────────────────────────────────
const PAIR_WITH_DB = {
  India: {
    muscle_gain: ["Jeera rice + toor dal", "High-protein lassi", "Tawa paratha with curd", "Boiled egg on the side"],
    weight_loss:  ["Cucumber raita", "Steamed brown rice", "Mint chaas (buttermilk)", "Raw onion salad with lemon"],
    balanced:     ["Steamed basmati rice", "Dal tadka", "Mixed vegetable raita", "Lime pickle"],
  },
  Italy: {
    muscle_gain: ["Al dente penne with olive oil", "Protein minestrone", "Grilled bruschetta", "Sparkling water"],
    weight_loss:  ["Arugula salad with balsamic", "Grilled zucchini", "Sparkling water with lemon"],
    balanced:     ["Garlic focaccia", "Caprese salad", "Sparkling lemon water", "Tiramisu (small)"],
  },
  Mexico: {
    muscle_gain: ["Black beans + corn tortillas", "Protein smoothie with banana", "Grilled corn"],
    weight_loss:  ["Pico de gallo", "Cabbage slaw with lime", "Agua fresca (no sugar)"],
    balanced:     ["Refried beans", "Mexican rice", "Fresh salsa verde", "Horchata"],
  },
  USA: {
    muscle_gain: ["Sweet potato mash", "Greek yogurt coleslaw", "Grilled corn on the cob"],
    weight_loss:  ["Garden salad", "Grilled asparagus", "Sparkling water with lemon"],
    balanced:     ["Mac and cheese (small)", "Cornbread", "Iced sweet tea", "Pickles"],
  },
  China: {
    muscle_gain: ["Steamed jasmine rice", "Edamame", "Silken tofu with soy"],
    weight_loss:  ["Steamed bok choy", "Clear egg drop soup", "Jasmine tea"],
    balanced:     ["Steamed rice", "Hot and sour soup", "Jasmine tea", "Fortune cookie"],
  },
  Japan: {
    muscle_gain: ["Steamed short-grain rice", "Miso soup with tofu", "Edamame + pickled ginger"],
    weight_loss:  ["Miso soup (low sodium)", "Pickled vegetables (tsukemono)", "Cold green tea"],
    balanced:     ["Miso soup", "Steamed rice", "Pickled daikon", "Hojicha tea"],
  },
  Thailand: {
    muscle_gain: ["Jasmine rice", "Papaya salad (som tam)", "Coconut water"],
    weight_loss:  ["Som tam (papaya salad)", "Clear tom yum broth", "Coconut water (no added sugar)"],
    balanced:     ["Jasmine rice", "Fresh spring rolls", "Thai iced tea", "Mango slices"],
  },
}

function getPairings(location, goal) {
  const cuisinePairs = PAIR_WITH_DB[location] ?? PAIR_WITH_DB.India
  return cuisinePairs[goal] ?? cuisinePairs.balanced
}

// ─────────────────────────────────────────────────────────────
//  MAIN EXPORT
// ─────────────────────────────────────────────────────────────
export function generateSmartRecipe({ ingredients, goal, spice, budget, location, skill }) {
  if (!ingredients || ingredients.length === 0) return null

  // 1. Normalise and expand aliases
  let lower = ingredients.map((i) => i.toLowerCase().trim())
  lower = lower.flatMap((item) => DISH_ALIASES[item] ?? [item])

  // 2. Build detailed ingredient list with smart quantities
  let totalCal = 0, totalP = 0, totalC = 0, totalF = 0

  const detailedIngredients = lower.map((item) => {
    const qty  = estimateQuantity(item)
    const data = NUTRITION_DB[item]
    if (data) {
      totalCal += (data.cal * qty) / 100
      totalP   += (data.p   * qty) / 100
      totalC   += (data.c   * qty) / 100
      totalF   += (data.f   * qty) / 100
    }
    return { item, qty }
  })

  // 3. Goal-based macro adjustments
  if (goal === "weight_loss") {
    totalCal *= 0.85
    totalF   *= 0.75
    totalP   *= 1.1
  }
  if (goal === "muscle_gain") {
    totalP   *= 1.25
    totalCal *= 1.15
  }

  // 4. Health score
  const healthScore    = computeHealthScore(totalCal, totalP, totalC, totalF)
  const healthCategory =
    healthScore >= 85 ? "Excellent" :
    healthScore >= 70 ? "Good" :
    healthScore >= 50 ? "Balanced" :
    "Needs Improvement"

  // 5. Run all engines
  const title         = generateTitle(lower, goal, spice, location)
  const description   = generateDescription({ lower, goal, location, totalCal, totalP, totalC, totalF })
  const steps         = generateSteps({ lower, goal, spice, location })
  const estimatedCost = estimateBudget(lower, location, budget, totalP)
  const suggestions   = generateSuggestions(lower, goal, location)

  return {
    title,
    description,
    ingredients: detailedIngredients,
    steps,
    estimatedCost,
    calories:      `${Math.round(totalCal)} kcal`,
    protein:       `${Math.round(totalP)} g`,
    carbs:         `${Math.round(totalC)} g`,
    fats:          `${Math.round(totalF)} g`,
    prepTime:      `${20 + lower.length * 4} mins`,
    healthScore,
    healthCategory,
    suggestions,
    micros:      computeMicros(lower),
    allergens:   detectAllergens(lower),
    budgetSwaps: getBudgetSwaps(lower),
    mistakes:    getCommonMistakes(lower, location),
    pairings:    getPairings(location, goal),
    location,
    goal,
  }
}
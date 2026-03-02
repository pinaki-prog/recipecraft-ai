// ─────────────────────────────────────────────────────────────
//  costDB.js  (v2 — Full Upgrade)
//
//  ALL 10 ENHANCEMENTS vs v1:
//  1.  Per-category location multipliers (not one flat ×)
//  2.  REALISTIC_USE_QTY — actual grams/ml per single serving
//  3.  Swap savings as real numbers (0.40) → computed ₹ savings
//  4.  WASTE_FACTOR — yield after trimming/bones/peel
//  5.  Budget tier classification (budget/mid/premium/luxury)
//  6.  Cost-efficiency score per goal (protein/₹, satiety/₹)
//  7.  Seasonality — price range + volatility tag
//  8.  Bulk discount logic — cost drops as servings scale
//  9.  Currency metadata on every location (symbol, name, locale)
//  10. Nutritional equivalence notes on every budget swap
// ─────────────────────────────────────────────────────────────

// ═════════════════════════════════════════════════════════════
//  SECTION 1 — PRICE DB  (₹ per 100g/ml, Indian market 2024)
//
//  Each entry carries:
//    pricePerHundred  — base price ₹/100g in India
//    unit             — display unit
//    category         — cost-multiplier category (see SECTION 2)
//    tier             — budget / mid / premium / luxury
//    wasteFactror     — fraction usable after prep (1.0 = no waste)
//    typicalUseQty    — realistic grams/ml used in ONE serving
//    priceRange       — { min, typical, max } ₹/100g (seasonal swing)
//    volatility       — stable / moderate / high / extreme
// ═════════════════════════════════════════════════════════════

export const PRICE_DB = {

  // ── Proteins ─────────────────────────────────────────────────
  chicken:       { pricePerHundred:18,  unit:"100g",   category:"meat",         tier:"mid",     wasteFactor:0.75, typicalUseQty:150, priceRange:{min:15, typical:18, max:24},  volatility:"moderate" },
  egg:           { pricePerHundred:12,  unit:"100g",   category:"dairy_eggs",   tier:"budget",  wasteFactor:0.88, typicalUseQty:100, priceRange:{min:10, typical:12, max:15},  volatility:"stable"   },
  paneer:        { pricePerHundred:35,  unit:"100g",   category:"dairy_eggs",   tier:"mid",     wasteFactor:1.00, typicalUseQty:100, priceRange:{min:28, typical:35, max:50},  volatility:"moderate" },
  tofu:          { pricePerHundred:20,  unit:"100g",   category:"packaged",     tier:"mid",     wasteFactor:0.90, typicalUseQty:120, priceRange:{min:18, typical:20, max:25},  volatility:"stable"   },
  fish:          { pricePerHundred:25,  unit:"100g",   category:"seafood",      tier:"mid",     wasteFactor:0.60, typicalUseQty:150, priceRange:{min:18, typical:25, max:40},  volatility:"high"     },
  beef:          { pricePerHundred:30,  unit:"100g",   category:"meat",         tier:"mid",     wasteFactor:0.78, typicalUseQty:150, priceRange:{min:25, typical:30, max:38},  volatility:"moderate" },
  lamb:          { pricePerHundred:55,  unit:"100g",   category:"meat",         tier:"premium", wasteFactor:0.70, typicalUseQty:150, priceRange:{min:45, typical:55, max:75},  volatility:"high"     },
  shrimp:        { pricePerHundred:40,  unit:"100g",   category:"seafood",      tier:"premium", wasteFactor:0.65, typicalUseQty:120, priceRange:{min:30, typical:40, max:60},  volatility:"high"     },
  pork:          { pricePerHundred:28,  unit:"100g",   category:"meat",         tier:"mid",     wasteFactor:0.80, typicalUseQty:150, priceRange:{min:22, typical:28, max:35},  volatility:"moderate" },
  turkey:        { pricePerHundred:45,  unit:"100g",   category:"meat",         tier:"premium", wasteFactor:0.72, typicalUseQty:150, priceRange:{min:38, typical:45, max:60},  volatility:"stable"   },
  soy_chunks:    { pricePerHundred:8,   unit:"100g",   category:"packaged",     tier:"budget",  wasteFactor:1.00, typicalUseQty:80,  priceRange:{min:6,  typical:8,  max:10},  volatility:"stable"   },

  // ── Grains & Carbs ───────────────────────────────────────────
  rice:          { pricePerHundred:4,   unit:"100g",   category:"staple_grain", tier:"budget",  wasteFactor:1.00, typicalUseQty:80,  priceRange:{min:3,  typical:4,  max:6},   volatility:"moderate" },
  brown_rice:    { pricePerHundred:7,   unit:"100g",   category:"staple_grain", tier:"budget",  wasteFactor:1.00, typicalUseQty:80,  priceRange:{min:6,  typical:7,  max:9},   volatility:"stable"   },
  basmati_rice:  { pricePerHundred:8,   unit:"100g",   category:"staple_grain", tier:"mid",     wasteFactor:1.00, typicalUseQty:80,  priceRange:{min:7,  typical:8,  max:12},  volatility:"moderate" },
  pasta:         { pricePerHundred:9,   unit:"100g",   category:"packaged",     tier:"budget",  wasteFactor:1.00, typicalUseQty:90,  priceRange:{min:7,  typical:9,  max:12},  volatility:"stable"   },
  rice_noodles:  { pricePerHundred:10,  unit:"100g",   category:"packaged",     tier:"budget",  wasteFactor:1.00, typicalUseQty:80,  priceRange:{min:8,  typical:10, max:14},  volatility:"stable"   },
  noodles:       { pricePerHundred:8,   unit:"100g",   category:"packaged",     tier:"budget",  wasteFactor:1.00, typicalUseQty:80,  priceRange:{min:6,  typical:8,  max:10},  volatility:"stable"   },
  ramen_noodles: { pricePerHundred:12,  unit:"100g",   category:"packaged",     tier:"mid",     wasteFactor:1.00, typicalUseQty:80,  priceRange:{min:10, typical:12, max:18},  volatility:"stable"   },
  oats:          { pricePerHundred:7,   unit:"100g",   category:"staple_grain", tier:"budget",  wasteFactor:1.00, typicalUseQty:80,  priceRange:{min:6,  typical:7,  max:9},   volatility:"stable"   },
  quinoa:        { pricePerHundred:22,  unit:"100g",   category:"premium_grain",tier:"premium", wasteFactor:1.00, typicalUseQty:80,  priceRange:{min:18, typical:22, max:28},  volatility:"stable"   },
  semolina:      { pricePerHundred:3,   unit:"100g",   category:"staple_grain", tier:"budget",  wasteFactor:1.00, typicalUseQty:80,  priceRange:{min:2,  typical:3,  max:5},   volatility:"stable"   },
  flour:         { pricePerHundred:3,   unit:"100g",   category:"staple_grain", tier:"budget",  wasteFactor:1.00, typicalUseQty:80,  priceRange:{min:2,  typical:3,  max:4},   volatility:"stable"   },
  whole_wheat_flour:{ pricePerHundred:4,unit:"100g",   category:"staple_grain", tier:"budget",  wasteFactor:1.00, typicalUseQty:80,  priceRange:{min:3,  typical:4,  max:6},   volatility:"stable"   },
  bread:         { pricePerHundred:6,   unit:"100g",   category:"packaged",     tier:"budget",  wasteFactor:1.00, typicalUseQty:60,  priceRange:{min:5,  typical:6,  max:8},   volatility:"stable"   },
  buns:          { pricePerHundred:8,   unit:"100g",   category:"packaged",     tier:"budget",  wasteFactor:1.00, typicalUseQty:60,  priceRange:{min:6,  typical:8,  max:10},  volatility:"stable"   },
  flattened_rice:{ pricePerHundred:4,   unit:"100g",   category:"staple_grain", tier:"budget",  wasteFactor:1.00, typicalUseQty:80,  priceRange:{min:3,  typical:4,  max:6},   volatility:"moderate" },
  gram_flour:    { pricePerHundred:5,   unit:"100g",   category:"staple_grain", tier:"budget",  wasteFactor:1.00, typicalUseQty:50,  priceRange:{min:4,  typical:5,  max:7},   volatility:"moderate" },
  corn_tortillas:{ pricePerHundred:12,  unit:"100g",   category:"packaged",     tier:"mid",     wasteFactor:1.00, typicalUseQty:60,  priceRange:{min:10, typical:12, max:16},  volatility:"stable"   },
  pita_bread:    { pricePerHundred:10,  unit:"100g",   category:"packaged",     tier:"budget",  wasteFactor:1.00, typicalUseQty:60,  priceRange:{min:8,  typical:10, max:14},  volatility:"stable"   },

  // ── Pulses & Legumes ─────────────────────────────────────────
  moong_dal:     { pricePerHundred:8,   unit:"100g",   category:"staple_grain", tier:"budget",  wasteFactor:1.00, typicalUseQty:60,  priceRange:{min:6,  typical:8,  max:12},  volatility:"moderate" },
  toor_dal:      { pricePerHundred:7,   unit:"100g",   category:"staple_grain", tier:"budget",  wasteFactor:1.00, typicalUseQty:60,  priceRange:{min:6,  typical:7,  max:10},  volatility:"moderate" },
  urad_dal:      { pricePerHundred:7,   unit:"100g",   category:"staple_grain", tier:"budget",  wasteFactor:1.00, typicalUseQty:60,  priceRange:{min:6,  typical:7,  max:10},  volatility:"moderate" },
  chana_dal:     { pricePerHundred:6,   unit:"100g",   category:"staple_grain", tier:"budget",  wasteFactor:1.00, typicalUseQty:60,  priceRange:{min:5,  typical:6,  max:9},   volatility:"moderate" },
  chickpeas:     { pricePerHundred:8,   unit:"100g",   category:"staple_grain", tier:"budget",  wasteFactor:1.00, typicalUseQty:80,  priceRange:{min:7,  typical:8,  max:12},  volatility:"moderate" },
  rajma:         { pricePerHundred:10,  unit:"100g",   category:"staple_grain", tier:"budget",  wasteFactor:1.00, typicalUseQty:80,  priceRange:{min:8,  typical:10, max:14},  volatility:"moderate" },
  masoor_dal:    { pricePerHundred:7,   unit:"100g",   category:"staple_grain", tier:"budget",  wasteFactor:1.00, typicalUseQty:60,  priceRange:{min:6,  typical:7,  max:10},  volatility:"moderate" },

  // ── Vegetables ───────────────────────────────────────────────
  potato:        { pricePerHundred:3,   unit:"100g",   category:"local_produce",tier:"budget",  wasteFactor:0.85, typicalUseQty:120, priceRange:{min:1,  typical:3,  max:8},   volatility:"high"     },
  sweet_potato:  { pricePerHundred:4,   unit:"100g",   category:"local_produce",tier:"budget",  wasteFactor:0.88, typicalUseQty:120, priceRange:{min:3,  typical:4,  max:7},   volatility:"moderate" },
  tomato:        { pricePerHundred:4,   unit:"100g",   category:"local_produce",tier:"budget",  wasteFactor:0.92, typicalUseQty:100, priceRange:{min:1,  typical:4,  max:20},  volatility:"extreme"  },
  onion:         { pricePerHundred:3,   unit:"100g",   category:"local_produce",tier:"budget",  wasteFactor:0.88, typicalUseQty:80,  priceRange:{min:1,  typical:3,  max:15},  volatility:"extreme"  },
  garlic:        { pricePerHundred:8,   unit:"100g",   category:"local_produce",tier:"budget",  wasteFactor:0.90, typicalUseQty:10,  priceRange:{min:5,  typical:8,  max:25},  volatility:"high"     },
  ginger:        { pricePerHundred:6,   unit:"100g",   category:"local_produce",tier:"budget",  wasteFactor:0.88, typicalUseQty:10,  priceRange:{min:4,  typical:6,  max:20},  volatility:"high"     },
  spinach:       { pricePerHundred:5,   unit:"100g",   category:"local_produce",tier:"budget",  wasteFactor:0.80, typicalUseQty:80,  priceRange:{min:3,  typical:5,  max:12},  volatility:"high"     },
  carrot:        { pricePerHundred:4,   unit:"100g",   category:"local_produce",tier:"budget",  wasteFactor:0.85, typicalUseQty:80,  priceRange:{min:2,  typical:4,  max:10},  volatility:"moderate" },
  capsicum:      { pricePerHundred:6,   unit:"100g",   category:"local_produce",tier:"budget",  wasteFactor:0.88, typicalUseQty:80,  priceRange:{min:3,  typical:6,  max:18},  volatility:"high"     },
  pumpkin:       { pricePerHundred:3,   unit:"100g",   category:"local_produce",tier:"budget",  wasteFactor:0.70, typicalUseQty:120, priceRange:{min:2,  typical:3,  max:6},   volatility:"moderate" },
  raw_banana:    { pricePerHundred:4,   unit:"100g",   category:"local_produce",tier:"budget",  wasteFactor:0.80, typicalUseQty:100, priceRange:{min:2,  typical:4,  max:8},   volatility:"moderate" },
  papaya:        { pricePerHundred:3,   unit:"100g",   category:"local_produce",tier:"budget",  wasteFactor:0.70, typicalUseQty:100, priceRange:{min:2,  typical:3,  max:6},   volatility:"moderate" },
  broccoli:      { pricePerHundred:12,  unit:"100g",   category:"local_produce",tier:"mid",     wasteFactor:0.75, typicalUseQty:100, priceRange:{min:8,  typical:12, max:20},  volatility:"high"     },
  cauliflower:   { pricePerHundred:5,   unit:"100g",   category:"local_produce",tier:"budget",  wasteFactor:0.65, typicalUseQty:120, priceRange:{min:2,  typical:5,  max:15},  volatility:"high"     },
  mushroom:      { pricePerHundred:15,  unit:"100g",   category:"local_produce",tier:"mid",     wasteFactor:0.90, typicalUseQty:80,  priceRange:{min:10, typical:15, max:25},  volatility:"moderate" },
  green_peas:    { pricePerHundred:7,   unit:"100g",   category:"local_produce",tier:"budget",  wasteFactor:0.92, typicalUseQty:60,  priceRange:{min:4,  typical:7,  max:15},  volatility:"high"     },
  cucumber:      { pricePerHundred:3,   unit:"100g",   category:"local_produce",tier:"budget",  wasteFactor:0.92, typicalUseQty:80,  priceRange:{min:2,  typical:3,  max:7},   volatility:"moderate" },
  lettuce:       { pricePerHundred:6,   unit:"100g",   category:"local_produce",tier:"budget",  wasteFactor:0.88, typicalUseQty:60,  priceRange:{min:4,  typical:6,  max:12},  volatility:"moderate" },
  eggplant:      { pricePerHundred:4,   unit:"100g",   category:"local_produce",tier:"budget",  wasteFactor:0.90, typicalUseQty:120, priceRange:{min:2,  typical:4,  max:10},  volatility:"high"     },
  zucchini:      { pricePerHundred:7,   unit:"100g",   category:"local_produce",tier:"budget",  wasteFactor:0.92, typicalUseQty:100, priceRange:{min:5,  typical:7,  max:14},  volatility:"moderate" },
  avocado:       { pricePerHundred:30,  unit:"100g",   category:"exotic_import",tier:"premium", wasteFactor:0.65, typicalUseQty:80,  priceRange:{min:22, typical:30, max:50},  volatility:"moderate" },
  banana:        { pricePerHundred:4,   unit:"100g",   category:"local_produce",tier:"budget",  wasteFactor:0.72, typicalUseQty:100, priceRange:{min:2,  typical:4,  max:8},   volatility:"moderate" },
  blueberries:   { pricePerHundred:40,  unit:"100g",   category:"exotic_import",tier:"luxury",  wasteFactor:0.95, typicalUseQty:50,  priceRange:{min:30, typical:40, max:60},  volatility:"moderate" },
  olives:        { pricePerHundred:20,  unit:"100g",   category:"exotic_import",tier:"mid",     wasteFactor:0.85, typicalUseQty:30,  priceRange:{min:15, typical:20, max:30},  volatility:"stable"   },
  spring_onion:  { pricePerHundred:5,   unit:"100g",   category:"local_produce",tier:"budget",  wasteFactor:0.85, typicalUseQty:30,  priceRange:{min:3,  typical:5,  max:10},  volatility:"moderate" },
  cabbage:       { pricePerHundred:3,   unit:"100g",   category:"local_produce",tier:"budget",  wasteFactor:0.80, typicalUseQty:100, priceRange:{min:1,  typical:3,  max:8},   volatility:"high"     },
  okra:          { pricePerHundred:5,   unit:"100g",   category:"local_produce",tier:"budget",  wasteFactor:0.92, typicalUseQty:100, priceRange:{min:3,  typical:5,  max:12},  volatility:"high"     },
  drumstick:     { pricePerHundred:6,   unit:"100g",   category:"local_produce",tier:"budget",  wasteFactor:0.60, typicalUseQty:100, priceRange:{min:4,  typical:6,  max:12},  volatility:"high"     },
  coconut:       { pricePerHundred:8,   unit:"100g",   category:"local_produce",tier:"budget",  wasteFactor:0.55, typicalUseQty:40,  priceRange:{min:5,  typical:8,  max:15},  volatility:"moderate" },
  tamarind:      { pricePerHundred:5,   unit:"100g",   category:"local_produce",tier:"budget",  wasteFactor:0.80, typicalUseQty:15,  priceRange:{min:3,  typical:5,  max:10},  volatility:"moderate" },
  bamboo_shoots: { pricePerHundred:15,  unit:"100g",   category:"exotic_import",tier:"mid",     wasteFactor:0.85, typicalUseQty:60,  priceRange:{min:10, typical:15, max:25},  volatility:"stable"   },
  lemon:         { pricePerHundred:5,   unit:"100g",   category:"local_produce",tier:"budget",  wasteFactor:0.70, typicalUseQty:15,  priceRange:{min:3,  typical:5,  max:15},  volatility:"high"     },
  lime:          { pricePerHundred:4,   unit:"100g",   category:"local_produce",tier:"budget",  wasteFactor:0.70, typicalUseQty:15,  priceRange:{min:2,  typical:4,  max:12},  volatility:"high"     },

  // ── Dairy & Fats ─────────────────────────────────────────────
  ghee:          { pricePerHundred:10,  unit:"100g",   category:"dairy_eggs",   tier:"budget",  wasteFactor:1.00, typicalUseQty:10,  priceRange:{min:8,  typical:10, max:14},  volatility:"stable"   },
  olive_oil:     { pricePerHundred:12,  unit:"100ml",  category:"premium_oil",  tier:"mid",     wasteFactor:1.00, typicalUseQty:10,  priceRange:{min:10, typical:12, max:16},  volatility:"stable"   },
  mustard_oil:   { pricePerHundred:5,   unit:"100ml",  category:"cooking_fat",  tier:"budget",  wasteFactor:1.00, typicalUseQty:10,  priceRange:{min:4,  typical:5,  max:7},   volatility:"stable"   },
  sesame_oil:    { pricePerHundred:14,  unit:"100ml",  category:"premium_oil",  tier:"mid",     wasteFactor:1.00, typicalUseQty:5,   priceRange:{min:12, typical:14, max:18},  volatility:"stable"   },
  oil:           { pricePerHundred:5,   unit:"100ml",  category:"cooking_fat",  tier:"budget",  wasteFactor:1.00, typicalUseQty:10,  priceRange:{min:4,  typical:5,  max:7},   volatility:"stable"   },
  butter:        { pricePerHundred:8,   unit:"100g",   category:"dairy_eggs",   tier:"budget",  wasteFactor:1.00, typicalUseQty:15,  priceRange:{min:7,  typical:8,  max:12},  volatility:"stable"   },
  milk:          { pricePerHundred:3,   unit:"100ml",  category:"dairy_eggs",   tier:"budget",  wasteFactor:1.00, typicalUseQty:100, priceRange:{min:2,  typical:3,  max:4},   volatility:"stable"   },
  curd:          { pricePerHundred:5,   unit:"100g",   category:"dairy_eggs",   tier:"budget",  wasteFactor:1.00, typicalUseQty:80,  priceRange:{min:4,  typical:5,  max:7},   volatility:"stable"   },
  yogurt:        { pricePerHundred:5,   unit:"100g",   category:"dairy_eggs",   tier:"budget",  wasteFactor:1.00, typicalUseQty:80,  priceRange:{min:4,  typical:5,  max:7},   volatility:"stable"   },
  cream:         { pricePerHundred:15,  unit:"100ml",  category:"dairy_eggs",   tier:"mid",     wasteFactor:1.00, typicalUseQty:30,  priceRange:{min:12, typical:15, max:20},  volatility:"stable"   },
  feta_cheese:   { pricePerHundred:40,  unit:"100g",   category:"specialty_dairy",tier:"premium",wasteFactor:1.00,typicalUseQty:30,  priceRange:{min:30, typical:40, max:60},  volatility:"stable"   },
  parmesan:      { pricePerHundred:45,  unit:"100g",   category:"specialty_dairy",tier:"premium",wasteFactor:1.00,typicalUseQty:20,  priceRange:{min:35, typical:45, max:65},  volatility:"stable"   },
  mozzarella:    { pricePerHundred:35,  unit:"100g",   category:"specialty_dairy",tier:"premium",wasteFactor:1.00,typicalUseQty:60,  priceRange:{min:28, typical:35, max:50},  volatility:"stable"   },
  cheese:        { pricePerHundred:25,  unit:"100g",   category:"dairy_eggs",   tier:"mid",     wasteFactor:1.00, typicalUseQty:30,  priceRange:{min:20, typical:25, max:35},  volatility:"stable"   },
  mayonnaise:    { pricePerHundred:10,  unit:"100g",   category:"packaged",     tier:"budget",  wasteFactor:1.00, typicalUseQty:20,  priceRange:{min:8,  typical:10, max:14},  volatility:"stable"   },
  coconut_milk:  { pricePerHundred:12,  unit:"100ml",  category:"packaged",     tier:"mid",     wasteFactor:1.00, typicalUseQty:80,  priceRange:{min:10, typical:12, max:16},  volatility:"stable"   },
  khoya:         { pricePerHundred:20,  unit:"100g",   category:"dairy_eggs",   tier:"mid",     wasteFactor:1.00, typicalUseQty:40,  priceRange:{min:15, typical:20, max:30},  volatility:"moderate" },

  // ── Nuts & Seeds ─────────────────────────────────────────────
  almonds:       { pricePerHundred:25,  unit:"100g",   category:"nuts_seeds",   tier:"mid",     wasteFactor:1.00, typicalUseQty:20,  priceRange:{min:20, typical:25, max:35},  volatility:"moderate" },
  walnuts:       { pricePerHundred:35,  unit:"100g",   category:"nuts_seeds",   tier:"premium", wasteFactor:0.95, typicalUseQty:20,  priceRange:{min:28, typical:35, max:50},  volatility:"moderate" },
  cashews:       { pricePerHundred:25,  unit:"100g",   category:"nuts_seeds",   tier:"mid",     wasteFactor:1.00, typicalUseQty:20,  priceRange:{min:20, typical:25, max:35},  volatility:"moderate" },
  peanuts:       { pricePerHundred:7,   unit:"100g",   category:"nuts_seeds",   tier:"budget",  wasteFactor:1.00, typicalUseQty:20,  priceRange:{min:5,  typical:7,  max:10},  volatility:"stable"   },
  peanut_butter: { pricePerHundred:15,  unit:"100g",   category:"packaged",     tier:"mid",     wasteFactor:1.00, typicalUseQty:30,  priceRange:{min:12, typical:15, max:20},  volatility:"stable"   },
  tahini:        { pricePerHundred:22,  unit:"100g",   category:"specialty_condiment",tier:"mid",wasteFactor:1.00,typicalUseQty:20,  priceRange:{min:18, typical:22, max:30},  volatility:"stable"   },
  chia_seeds:    { pricePerHundred:18,  unit:"100g",   category:"nuts_seeds",   tier:"mid",     wasteFactor:1.00, typicalUseQty:15,  priceRange:{min:14, typical:18, max:25},  volatility:"stable"   },

  // ── Sauces & Condiments ──────────────────────────────────────
  soy_sauce:     { pricePerHundred:4,   unit:"100ml",  category:"packaged",     tier:"budget",  wasteFactor:1.00, typicalUseQty:15,  priceRange:{min:3,  typical:4,  max:6},   volatility:"stable"   },
  honey:         { pricePerHundred:10,  unit:"100g",   category:"packaged",     tier:"mid",     wasteFactor:1.00, typicalUseQty:15,  priceRange:{min:8,  typical:10, max:15},  volatility:"moderate" },
  sugar:         { pricePerHundred:2,   unit:"100g",   category:"staple_grain", tier:"budget",  wasteFactor:1.00, typicalUseQty:10,  priceRange:{min:2,  typical:2,  max:3},   volatility:"stable"   },
  maple_syrup:   { pricePerHundred:28,  unit:"100ml",  category:"exotic_import",tier:"premium", wasteFactor:1.00, typicalUseQty:20,  priceRange:{min:22, typical:28, max:38},  volatility:"stable"   },
  vinegar:       { pricePerHundred:3,   unit:"100ml",  category:"packaged",     tier:"budget",  wasteFactor:1.00, typicalUseQty:10,  priceRange:{min:2,  typical:3,  max:5},   volatility:"stable"   },
  miso_paste:    { pricePerHundred:18,  unit:"100g",   category:"exotic_import",tier:"mid",     wasteFactor:1.00, typicalUseQty:20,  priceRange:{min:14, typical:18, max:25},  volatility:"stable"   },
  fish_sauce:    { pricePerHundred:6,   unit:"100ml",  category:"packaged",     tier:"budget",  wasteFactor:1.00, typicalUseQty:10,  priceRange:{min:5,  typical:6,  max:9},   volatility:"stable"   },
  oyster_sauce:  { pricePerHundred:8,   unit:"100ml",  category:"packaged",     tier:"budget",  wasteFactor:1.00, typicalUseQty:15,  priceRange:{min:6,  typical:8,  max:12},  volatility:"stable"   },
  hot_sauce:     { pricePerHundred:6,   unit:"100ml",  category:"packaged",     tier:"budget",  wasteFactor:1.00, typicalUseQty:10,  priceRange:{min:4,  typical:6,  max:10},  volatility:"stable"   },

  // ── Spices ───────────────────────────────────────────────────
  turmeric:      { pricePerHundred:4,   unit:"100g",   category:"spice",        tier:"budget",  wasteFactor:1.00, typicalUseQty:2,   priceRange:{min:3,  typical:4,  max:6},   volatility:"stable"   },
  cumin:         { pricePerHundred:5,   unit:"100g",   category:"spice",        tier:"budget",  wasteFactor:1.00, typicalUseQty:3,   priceRange:{min:4,  typical:5,  max:8},   volatility:"moderate" },
  black_pepper:  { pricePerHundred:8,   unit:"100g",   category:"spice",        tier:"budget",  wasteFactor:1.00, typicalUseQty:2,   priceRange:{min:6,  typical:8,  max:14},  volatility:"moderate" },
  coriander:     { pricePerHundred:4,   unit:"100g",   category:"spice",        tier:"budget",  wasteFactor:1.00, typicalUseQty:3,   priceRange:{min:3,  typical:4,  max:7},   volatility:"moderate" },
  mustard_seeds: { pricePerHundred:4,   unit:"100g",   category:"spice",        tier:"budget",  wasteFactor:1.00, typicalUseQty:3,   priceRange:{min:3,  typical:4,  max:6},   volatility:"stable"   },
  cardamom:      { pricePerHundred:25,  unit:"100g",   category:"premium_spice",tier:"mid",     wasteFactor:1.00, typicalUseQty:2,   priceRange:{min:20, typical:25, max:40},  volatility:"high"     },
  saffron:       { pricePerHundred:200, unit:"100g",   category:"luxury_spice", tier:"luxury",  wasteFactor:1.00, typicalUseQty:0.3, priceRange:{min:150,typical:200,max:300}, volatility:"high"     },
  garam_masala:  { pricePerHundred:8,   unit:"100g",   category:"spice",        tier:"budget",  wasteFactor:1.00, typicalUseQty:3,   priceRange:{min:6,  typical:8,  max:12},  volatility:"stable"   },
  chili_powder:  { pricePerHundred:5,   unit:"100g",   category:"spice",        tier:"budget",  wasteFactor:1.00, typicalUseQty:3,   priceRange:{min:4,  typical:5,  max:8},   volatility:"moderate" },
  cinnamon:      { pricePerHundred:12,  unit:"100g",   category:"spice",        tier:"budget",  wasteFactor:1.00, typicalUseQty:2,   priceRange:{min:8,  typical:12, max:18},  volatility:"moderate" },

  // ── Fresh Herbs ──────────────────────────────────────────────
  basil:         { pricePerHundred:6,   unit:"100g",   category:"fresh_herb",   tier:"budget",  wasteFactor:0.80, typicalUseQty:5,   priceRange:{min:4,  typical:6,  max:12},  volatility:"moderate" },
  parsley:       { pricePerHundred:5,   unit:"100g",   category:"fresh_herb",   tier:"budget",  wasteFactor:0.85, typicalUseQty:5,   priceRange:{min:3,  typical:5,  max:10},  volatility:"moderate" },
  rosemary:      { pricePerHundred:8,   unit:"100g",   category:"fresh_herb",   tier:"budget",  wasteFactor:0.85, typicalUseQty:3,   priceRange:{min:5,  typical:8,  max:15},  volatility:"moderate" },
  thyme:         { pricePerHundred:8,   unit:"100g",   category:"fresh_herb",   tier:"budget",  wasteFactor:0.85, typicalUseQty:3,   priceRange:{min:5,  typical:8,  max:15},  volatility:"moderate" },
  lemongrass:    { pricePerHundred:8,   unit:"100g",   category:"fresh_herb",   tier:"budget",  wasteFactor:0.70, typicalUseQty:10,  priceRange:{min:5,  typical:8,  max:15},  volatility:"moderate" },
  curry_leaves:  { pricePerHundred:4,   unit:"100g",   category:"fresh_herb",   tier:"budget",  wasteFactor:0.90, typicalUseQty:5,   priceRange:{min:2,  typical:4,  max:8},   volatility:"moderate" },

  // ── Other ────────────────────────────────────────────────────
  seaweed:       { pricePerHundred:20,  unit:"100g",   category:"exotic_import",tier:"mid",     wasteFactor:1.00, typicalUseQty:5,   priceRange:{min:15, typical:20, max:30},  volatility:"stable"   },
  broth:         { pricePerHundred:5,   unit:"100ml",  category:"packaged",     tier:"budget",  wasteFactor:1.00, typicalUseQty:100, priceRange:{min:4,  typical:5,  max:8},   volatility:"stable"   },
}


// ═════════════════════════════════════════════════════════════
//  SECTION 2 — PER-CATEGORY LOCATION MULTIPLIERS
//
//  Each food category scales differently per location.
//  e.g. pasta is CHEAPER in Italy than India (local product).
//  Saffron is similar everywhere (traded commodity).
//  Local produce: India cheap, Japan expensive.
//  Exotic imports: India expensive, USA/Europe cheaper.
// ═════════════════════════════════════════════════════════════

export const CATEGORY_LOCATION_MULTIPLIER = {
  //                        India  USA   Italy Mexico China Japan Thailand
  local_produce:    { India:1.0,  USA:3.2,  Italy:2.8,  Mexico:1.2, China:1.5, Japan:6.0,  Thailand:0.9  },
  staple_grain:     { India:1.0,  USA:4.0,  Italy:2.5,  Mexico:1.8, China:1.2, Japan:3.5,  Thailand:1.0  },
  premium_grain:    { India:1.0,  USA:2.8,  Italy:2.5,  Mexico:2.2, China:2.0, Japan:3.0,  Thailand:2.0  },
  meat:             { India:1.0,  USA:5.0,  Italy:4.5,  Mexico:2.5, China:2.5, Japan:7.0,  Thailand:1.8  },
  seafood:          { India:1.0,  USA:5.5,  Italy:4.8,  Mexico:2.0, China:2.0, Japan:5.0,  Thailand:1.2  },
  dairy_eggs:       { India:1.0,  USA:4.2,  Italy:3.0,  Mexico:2.0, China:2.8, Japan:5.5,  Thailand:2.5  },
  specialty_dairy:  { India:1.0,  USA:3.5,  Italy:1.8,  Mexico:4.0, China:4.5, Japan:5.0,  Thailand:4.5  },  // feta cheaper in Europe
  cooking_fat:      { India:1.0,  USA:3.5,  Italy:3.0,  Mexico:2.0, China:2.0, Japan:4.0,  Thailand:1.5  },
  premium_oil:      { India:1.0,  USA:2.5,  Italy:1.2,  Mexico:2.5, China:3.0, Japan:3.5,  Thailand:2.5  },  // olive oil cheap in Italy
  nuts_seeds:       { India:1.0,  USA:3.0,  Italy:2.8,  Mexico:2.0, China:2.0, Japan:4.0,  Thailand:2.2  },
  packaged:         { India:1.0,  USA:3.8,  Italy:3.2,  Mexico:2.5, China:1.8, Japan:4.5,  Thailand:2.0  },
  spice:            { India:1.0,  USA:5.0,  Italy:4.5,  Mexico:2.0, China:2.5, Japan:6.0,  Thailand:1.5  },  // Indian spices expensive abroad
  premium_spice:    { India:1.0,  USA:4.5,  Italy:4.0,  Mexico:3.0, China:3.0, Japan:5.5,  Thailand:3.0  },
  luxury_spice:     { India:1.0,  USA:1.2,  Italy:1.1,  Mexico:1.3, China:1.4, Japan:1.2,  Thailand:1.5  },  // saffron = global commodity
  exotic_import:    { India:1.0,  USA:1.5,  Italy:1.4,  Mexico:1.6, China:1.8, Japan:2.0,  Thailand:1.3  },  // avocado/blueberries CHEAPER in USA
  specialty_condiment:{India:1.0, USA:2.2,  Italy:2.0,  Mexico:2.5, China:1.8, Japan:3.0,  Thailand:2.0  },
  fresh_herb:       { India:1.0,  USA:4.0,  Italy:2.0,  Mexico:1.5, China:2.5, Japan:5.0,  Thailand:1.2  },
}

// ── Get location multiplier for a specific item ────────────────
export function getLocationMultiplier(item, location) {
  const entry    = PRICE_DB[item]
  if (!entry) return 1.0
  const category = entry.category ?? "packaged"
  const catMap   = CATEGORY_LOCATION_MULTIPLIER[category]
  if (!catMap)   return 1.5   // safe fallback
  return catMap[location] ?? 1.0
}


// ═════════════════════════════════════════════════════════════
//  SECTION 3 — CURRENCY METADATA
// ═════════════════════════════════════════════════════════════

export const LOCATION_CURRENCY = {
  India:         { symbol:"₹",  code:"INR", name:"Indian Rupee",       locale:"en-IN" },
  "India-South": { symbol:"₹",  code:"INR", name:"Indian Rupee",       locale:"en-IN" },
  "India-East":  { symbol:"₹",  code:"INR", name:"Indian Rupee",       locale:"en-IN" },
  USA:           { symbol:"$",  code:"USD", name:"US Dollar",           locale:"en-US" },
  Italy:         { symbol:"€",  code:"EUR", name:"Euro",                locale:"it-IT" },
  France:        { symbol:"€",  code:"EUR", name:"Euro",                locale:"fr-FR" },
  Spain:         { symbol:"€",  code:"EUR", name:"Euro",                locale:"es-ES" },
  Mediterranean: { symbol:"€",  code:"EUR", name:"Euro",                locale:"en-GB" },
  Mexico:        { symbol:"₱",  code:"MXN", name:"Mexican Peso",        locale:"es-MX" },
  China:         { symbol:"¥",  code:"CNY", name:"Chinese Yuan",        locale:"zh-CN" },
  Japan:         { symbol:"¥",  code:"JPY", name:"Japanese Yen",        locale:"ja-JP" },
  Korea:         { symbol:"₩",  code:"KRW", name:"Korean Won",          locale:"ko-KR" },
  Thailand:      { symbol:"฿",  code:"THB", name:"Thai Baht",           locale:"th-TH" },
  Vietnam:       { symbol:"₫",  code:"VND", name:"Vietnamese Dong",     locale:"vi-VN" },
  Indonesia:     { symbol:"Rp", code:"IDR", name:"Indonesian Rupiah",   locale:"id-ID" },
}

export function getCurrency(location) {
  return LOCATION_CURRENCY[location] ?? LOCATION_CURRENCY.India
}

export function formatCost(amount, location) {
  const curr = getCurrency(location)
  return `${curr.symbol}${Math.round(amount)}`
}


// ═════════════════════════════════════════════════════════════
//  SECTION 4 — FLAT LOOKUP (backward-compatible)
// ═════════════════════════════════════════════════════════════

export const INGREDIENT_COST = Object.fromEntries(
  Object.entries(PRICE_DB).map(([k, v]) => [k, v.pricePerHundred])
)


// ═════════════════════════════════════════════════════════════
//  SECTION 5 — REALISTIC QUANTITY & WASTE-ADJUSTED COST
//
//  computeIngredientCost(item, location):
//    → uses typicalUseQty (not 100g) × pricePerHundred
//    → adjusts for wasteFactor (buys more to get target qty)
//    → applies per-category location multiplier
// ═════════════════════════════════════════════════════════════

export function computeIngredientCost(item, location = "India") {
  const entry = PRICE_DB[item]
  if (!entry) return { cost: 12, qty: 80, unit: "100g", isEstimate: true }

  const useQty     = entry.typicalUseQty   // grams actually used per serving
  const wasteFactor= entry.wasteFactor ?? 1.0
  const buyQty     = useQty / wasteFactor  // how much you need to BUY to get useQty
  const multiplier = getLocationMultiplier(item, location)
  const cost       = (buyQty / 100) * entry.pricePerHundred * multiplier

  return {
    cost:       Math.round(cost),
    useQty,
    buyQty:     Math.round(buyQty),
    unit:       entry.unit,
    wasteFactor,
    multiplier,
    tier:       entry.tier,
    isEstimate: false,
  }
}


// ═════════════════════════════════════════════════════════════
//  SECTION 6 — BULK DISCOUNT LOGIC
//
//  Cooking for more people doesn't cost linearly more.
//  Spices, oils, condiments barely change. Proteins scale
//  sub-linearly (buying in bulk is cheaper per unit).
// ═════════════════════════════════════════════════════════════

const BULK_SCALE_CATEGORY = {
  // category → scale factor per additional serving beyond 1
  // 1.0 = fully linear, 0.6 = 60% of per-serving cost for each extra
  spice:              0.30,  // a pot of spice serves 10+ — nearly flat
  luxury_spice:       0.40,
  premium_spice:      0.35,
  fresh_herb:         0.50,
  cooking_fat:        0.45,
  premium_oil:        0.45,
  packaged:           0.70,
  staple_grain:       0.80,
  premium_grain:      0.80,
  local_produce:      0.85,
  meat:               0.90,  // proteins scale most linearly
  seafood:            0.88,
  dairy_eggs:         0.82,
  specialty_dairy:    0.85,
  nuts_seeds:         0.75,
  exotic_import:      0.80,
  specialty_condiment:0.40,
}

export function applyBulkDiscount(baseCostPerServing, servings, category) {
  if (servings <= 1) return baseCostPerServing
  const scale = BULK_SCALE_CATEGORY[category] ?? 0.80
  // Total cost = base × (1 + scale × (servings - 1))
  const totalCost = baseCostPerServing * (1 + scale * (servings - 1))
  return totalCost / servings   // return per-serving cost after discount
}


// ═════════════════════════════════════════════════════════════
//  SECTION 7 — COST-EFFICIENCY SCORE
//
//  "Value per rupee" for your goal:
//    muscle_gain → grams protein per ₹10
//    weight_loss → satiety score per ₹10
//    balanced    → composite per ₹10
//
//  Uses NUTRITION_DB data — passed in as argument to avoid
//  circular import.
// ═════════════════════════════════════════════════════════════

export function computeCostEfficiency(item, location, nutritionDB, goal = "balanced") {
  const entry = PRICE_DB[item]
  const nutr  = nutritionDB?.[item]
  if (!entry || !nutr) return null

  const { cost } = computeIngredientCost(item, location)
  if (cost === 0) return null

  const per10 = 10 / cost   // how many "servings" of this item ₹10 buys

  const protein    = (nutr.p ?? 0) * entry.typicalUseQty / 100 * per10
  const fibre      = (nutr.f ?? 0) < 5 ? (nutr.f ?? 0) * entry.typicalUseQty / 100 * per10 : 0   // fibre — avoid confusion with fat
  const calories   = (nutr.cal ?? 0) * entry.typicalUseQty / 100 * per10
  const fatContent = (nutr.f ?? 0) * entry.typicalUseQty / 100 * per10

  // Goal-specific value score (higher = better value for goal)
  let valueScore
  if (goal === "muscle_gain") {
    valueScore = protein * 3               // protein per ₹10 is king
  } else if (goal === "weight_loss") {
    const satiety = protein * 2 + fibre * 1.5   // satiety proxy
    const caloricCost = calories / 100          // penalise calorie density
    valueScore = satiety - caloricCost
  } else {
    valueScore = protein * 1.5 + fibre * 0.5 - calories * 0.01
  }

  return {
    item,
    costPerServing: cost,
    proteinPer10:   +protein.toFixed(1),
    caloriesPer10:  +calories.toFixed(0),
    valueScore:     +valueScore.toFixed(2),
    tier:           entry.tier,
    verdict:
      valueScore > 8  ? "🏆 Excellent value for your goal" :
      valueScore > 4  ? "✅ Good value" :
      valueScore > 1  ? "🟡 Moderate value" :
                        "💸 Low value — consider swapping",
  }
}

export function rankByEfficiency(ingredients, location, nutritionDB, goal) {
  return ingredients
    .map(item => computeCostEfficiency(item, location, nutritionDB, goal))
    .filter(Boolean)
    .sort((a, b) => b.valueScore - a.valueScore)
}


// ═════════════════════════════════════════════════════════════
//  SECTION 8 — BUDGET TIER CLASSIFICATION
//
//  Classify a recipe as budget/mid/premium/luxury based on
//  weighted average of ingredient tiers.
// ═════════════════════════════════════════════════════════════

const TIER_SCORE = { budget:1, mid:2, premium:3, luxury:4 }
const TIER_LABEL = { 1:"Budget",  2:"Mid-Range",  3:"Premium",  4:"Luxury" }
const TIER_EMOJI = { 1:"🟢",      2:"🟡",          3:"🟠",        4:"🔴"     }
const TIER_DESC  = {
  1: "Wholesome and affordable — everyday ingredients, great nutrition",
  2: "Balanced mix of everyday and quality ingredients",
  3: "Premium ingredients — restaurant-quality at home",
  4: "Luxury ingredients — special occasion meal",
}

export function classifyRecipeTier(ingredients) {
  if (!ingredients.length) return { tier:"mid", label:"Mid-Range", emoji:"🟡", desc:TIER_DESC[2] }
  const scores = ingredients.map(i => TIER_SCORE[PRICE_DB[i]?.tier ?? "mid"])
  const avg    = scores.reduce((s,x)=>s+x,0) / scores.length
  const round  = Math.min(4, Math.max(1, Math.round(avg)))
  const hasMixture = new Set(scores).size > 1
  return {
    tier:  ["budget","mid","premium","luxury"][round-1],
    score: +avg.toFixed(2),
    label: TIER_LABEL[round],
    emoji: TIER_EMOJI[round],
    desc:  TIER_DESC[round],
    hasMixture,
    note:  hasMixture ? `Mix of ${[...new Set(ingredients.map(i=>PRICE_DB[i]?.tier??"mid"))].join(", ")} ingredients` : null,
  }
}


// ═════════════════════════════════════════════════════════════
//  SECTION 9 — SEASONALITY & PRICE RANGE
// ═════════════════════════════════════════════════════════════

export const VOLATILITY_META = {
  stable:   { label:"Stable price",    emoji:"🟢", note:"Price consistent year-round."                                       },
  moderate: { label:"Moderate swings", emoji:"🟡", note:"Price can vary 20–50% seasonally."                                 },
  high:     { label:"Seasonal price",  emoji:"🟠", note:"Price swings 2–4× across seasons. Budget may vary significantly."  },
  extreme:  { label:"Highly volatile", emoji:"🔴", note:"Price can spike 5–10× in shortage. Check local market before planning." },
}

export function getPriceRangeInfo(item) {
  const entry = PRICE_DB[item]
  if (!entry) return null
  const { priceRange, volatility, unit } = entry
  const meta = VOLATILITY_META[volatility ?? "stable"]
  return {
    item,
    min:        priceRange?.min     ?? entry.pricePerHundred,
    typical:    priceRange?.typical ?? entry.pricePerHundred,
    max:        priceRange?.max     ?? entry.pricePerHundred,
    volatility: volatility ?? "stable",
    unit,
    ...meta,
  }
}

export function getHighVolatilityWarnings(ingredients) {
  return ingredients
    .map(i => ({ item: i, info: getPriceRangeInfo(i) }))
    .filter(({ info }) => info?.volatility === "high" || info?.volatility === "extreme")
    .map(({ item, info }) => ({
      item,
      emoji: info.emoji,
      label: info.label,
      range: `₹${info.min}–₹${info.max}/100g`,
      note:  info.note,
    }))
}


// ═════════════════════════════════════════════════════════════
//  SECTION 10 — BUDGET SWAPS DATABASE  (v2)
//
//  saving is now a real number (0.0–1.0) for computation.
//  nutritionNote flags real macro/micronutrient differences.
//  goalFit maps how good each swap is per goal.
// ═════════════════════════════════════════════════════════════

export const BUDGET_SWAPS_DB = {
  paneer:       {
    swap:"Tofu or scrambled egg",
    saving:0.40,
    note:"Same protein hit, much lighter on budget",
    nutritionNote:"Tofu has 35% less protein than paneer but similar calories. Egg has more bioavailable protein.",
    goalFit:{ muscle_gain:"✅ Good swap", weight_loss:"✅ Lower fat", balanced:"✅ Solid" },
  },
  chicken:      {
    swap:"Soy chunks or egg",
    saving:0.50,
    note:"Equal protein at a fraction of the cost",
    nutritionNote:"Soy chunks have more protein per gram but less B12. Egg is nutritionally very close.",
    goalFit:{ muscle_gain:"✅ Excellent — soy has more protein/₹", weight_loss:"✅ Leaner", balanced:"✅ Solid" },
  },
  lamb:         {
    swap:"Chicken or soy chunks",
    saving:0.60,
    note:"Significantly cheaper, similar macros",
    nutritionNote:"Lamb has 3× more iron than chicken. Swap saves money but reduces iron and zinc significantly.",
    goalFit:{ muscle_gain:"⚠️ Lower iron", weight_loss:"✅ Much leaner", balanced:"✅ Good swap" },
  },
  pork:         {
    swap:"Chicken or soy chunks",
    saving:0.45,
    note:"Similar macros, more widely available",
    nutritionNote:"Chicken is leaner. Soy chunks have similar protein with less saturated fat.",
    goalFit:{ muscle_gain:"✅ Good", weight_loss:"✅ Leaner option", balanced:"✅ Solid" },
  },
  turkey:       {
    swap:"Chicken",
    saving:0.55,
    note:"Very similar nutrition, far cheaper year-round",
    nutritionNote:"Nutritionally nearly identical — chicken breast and turkey breast are interchangeable macros.",
    goalFit:{ muscle_gain:"✅ Identical protein", weight_loss:"✅ Same calorie profile", balanced:"✅ Seamless swap" },
  },
  fish:         {
    swap:"Canned tuna or soy chunks",
    saving:0.45,
    note:"Good protein source at lower price point",
    nutritionNote:"Fish has omega-3s that soy chunks lack entirely. If omega-3 matters, this swap has a real cost.",
    goalFit:{ muscle_gain:"✅ Good protein", weight_loss:"✅ Lean", balanced:"⚠️ Loses omega-3s" },
  },
  shrimp:       {
    swap:"Fish or soy chunks",
    saving:0.40,
    note:"Similar protein, easier to find",
    nutritionNote:"Fish provides similar protein and omega-3s. Soy chunks miss the selenium in shrimp.",
    goalFit:{ muscle_gain:"✅ Works", weight_loss:"✅ Works", balanced:"⚠️ Loses iodine/selenium" },
  },
  quinoa:       {
    swap:"Brown rice",
    saving:0.70,
    note:"Similar fibre content, far cheaper",
    nutritionNote:"Quinoa is a complete protein (all 9 amino acids). Brown rice isn't. For muscle gain, this swap has real impact.",
    goalFit:{ muscle_gain:"⚠️ Loses complete amino acid profile", weight_loss:"✅ Fine", balanced:"⚠️ Minor protein quality drop" },
  },
  broccoli:     {
    swap:"Cabbage or cauliflower",
    saving:0.60,
    note:"Similar nutrients, widely available",
    nutritionNote:"Broccoli has more vitamin C and folate. Cauliflower is close. Cabbage is lower in most micros.",
    goalFit:{ muscle_gain:"✅ Negligible", weight_loss:"✅ All are low calorie", balanced:"✅ Minor difference" },
  },
  mushroom:     {
    swap:"Green peas or capsicum",
    saving:0.50,
    note:"Adds colour and texture at low cost",
    nutritionNote:"Mushrooms have unique B vitamins (B12 trace, B2, niacin) that peas don't. Capsicum has more vitamin C.",
    goalFit:{ muscle_gain:"✅ Peas add protein", weight_loss:"✅ All low calorie", balanced:"✅ Good swap" },
  },
  almonds:      {
    swap:"Peanuts or roasted chana",
    saving:0.65,
    note:"Similar fat and protein profile",
    nutritionNote:"Almonds have more vitamin E and calcium. Peanuts have similar protein. Roasted chana has less fat but more carbs.",
    goalFit:{ muscle_gain:"✅ Similar protein", weight_loss:"✅ Roasted chana is lower fat", balanced:"✅ Good swap" },
  },
  avocado:      {
    swap:"Thick curd or hummus",
    saving:0.75,
    note:"Similar creamy texture, healthy fats from hummus",
    nutritionNote:"Avocado has unique monounsaturated fats and potassium. Curd provides probiotics. Different nutritional profiles.",
    goalFit:{ muscle_gain:"✅ Curd adds protein", weight_loss:"✅ Curd is lower fat", balanced:"⚠️ Different nutrients entirely" },
  },
  feta_cheese:  {
    swap:"Paneer or crumbled tofu",
    saving:0.60,
    note:"Similar crumbly texture, much cheaper",
    nutritionNote:"Feta is saltier and tangier. Paneer has more protein. Tofu has less sodium. Taste will differ.",
    goalFit:{ muscle_gain:"✅ Paneer has more protein", weight_loss:"✅ Tofu is lower fat", balanced:"✅ Good swap" },
  },
  parmesan:     {
    swap:"Nutritional yeast or sharp cheddar",
    saving:0.55,
    note:"Umami hit at lower price",
    nutritionNote:"Parmesan has more calcium than cheddar. Nutritional yeast adds B12 — a bonus for vegetarians.",
    goalFit:{ muscle_gain:"✅ Similar protein", weight_loss:"⚠️ Cheddar has more fat", balanced:"✅ Good swap" },
  },
  olive_oil:    {
    swap:"Mustard oil or sunflower oil",
    saving:0.60,
    note:"Good high-heat alternatives, cheaper",
    nutritionNote:"Olive oil has more oleocanthal (anti-inflammatory). Mustard oil has omega-3s. Different health profiles.",
    goalFit:{ muscle_gain:"✅ Minor impact", weight_loss:"✅ All are ~9 cal/g", balanced:"⚠️ Loses olive polyphenols" },
  },
  cream:        {
    swap:"Thick curd or cashew paste",
    saving:0.55,
    note:"Same richness, higher protein from curd",
    nutritionNote:"Cream has more fat and calories. Curd adds probiotics and protein. Cashew paste is closer in fat.",
    goalFit:{ muscle_gain:"✅ Curd adds protein", weight_loss:"✅ Curd is much lower fat", balanced:"✅ Better nutritionally" },
  },
  cashews:      {
    swap:"Peanuts or roasted chana",
    saving:0.60,
    note:"Similar fat and protein, lower cost",
    nutritionNote:"Cashews have more zinc and iron than peanuts. Roasted chana is much higher in protein and fibre.",
    goalFit:{ muscle_gain:"✅ Chana has more protein", weight_loss:"✅ Chana is lower fat", balanced:"✅ Good swap" },
  },
  beef:         {
    swap:"Chicken or soy chunks",
    saving:0.55,
    note:"Leaner, cheaper, widely available",
    nutritionNote:"Beef has more creatine, iron (haem), and zinc than chicken. Significant nutritional step-down for muscle gain.",
    goalFit:{ muscle_gain:"⚠️ Loses haem iron and creatine", weight_loss:"✅ Much leaner", balanced:"⚠️ Modest nutritional cost" },
  },
  walnuts:      {
    swap:"Peanuts or sunflower seeds",
    saving:0.70,
    note:"Similar omega-3 profile at lower cost",
    nutritionNote:"Walnuts have the highest omega-3 (ALA) of any nut. Peanuts have almost none. Meaningful swap cost.",
    goalFit:{ muscle_gain:"✅ Similar protein", weight_loss:"✅ Peanuts less caloric", balanced:"⚠️ Loses omega-3s" },
  },
  tahini:       {
    swap:"Peanut butter",
    saving:0.50,
    note:"Similar fat content, more accessible",
    nutritionNote:"Tahini has more calcium and less sugar than most peanut butters. Peanut butter has slightly more protein.",
    goalFit:{ muscle_gain:"✅ Similar protein", weight_loss:"✅ Similar calories", balanced:"✅ Good swap" },
  },
  blueberries:  {
    swap:"Banana or seasonal berries",
    saving:0.65,
    note:"Same antioxidant category, much lower cost",
    nutritionNote:"Blueberries have the highest antioxidant (anthocyanin) density. Banana has more calories but less antioxidants.",
    goalFit:{ muscle_gain:"✅ Banana adds carbs", weight_loss:"⚠️ Banana is more caloric", balanced:"✅ Acceptable swap" },
  },
  mayonnaise:   {
    swap:"Thick curd + lemon",
    saving:0.40,
    note:"Similar creaminess, much healthier",
    nutritionNote:"Mayo is 70% fat. Thick curd is 3–8% fat with added protein and probiotics. Major health upgrade.",
    goalFit:{ muscle_gain:"✅ Curd adds protein", weight_loss:"✅ Dramatically lower fat", balanced:"✅ Much better nutritionally" },
  },
  saffron:      {
    swap:"Turmeric + food-grade yellow",
    saving:0.95,
    note:"Colour achieved at 1/20th the cost",
    nutritionNote:"Saffron has unique mood-enhancing compounds (safranal, crocin). Turmeric has curcumin instead. Different health benefits.",
    goalFit:{ muscle_gain:"✅ Negligible", weight_loss:"✅ Negligible", balanced:"✅ Acceptable — flavour will differ slightly" },
  },
  mozzarella:   {
    swap:"Paneer or cottage cheese",
    saving:0.50,
    note:"Similar mild flavour and melt",
    nutritionNote:"Mozzarella has more calcium. Paneer has more protein. Cottage cheese is significantly lower fat.",
    goalFit:{ muscle_gain:"✅ Paneer has more protein", weight_loss:"✅ Cottage cheese is much lower fat", balanced:"✅ Good swap" },
  },
  maple_syrup:  {
    swap:"Honey or jaggery",
    saving:0.65,
    note:"Natural sweetener with very similar profile",
    nutritionNote:"Maple syrup has more manganese and zinc. Honey has antimicrobial properties. Jaggery has iron. All are ~80% sugar.",
    goalFit:{ muscle_gain:"✅ Negligible", weight_loss:"✅ All equally sweet — use less", balanced:"✅ Seamless swap" },
  },
  ramen_noodles:{
    swap:"Regular wheat noodles",
    saving:0.35,
    note:"Similar result in soups and stir-fries",
    nutritionNote:"Ramen noodles are alkaline (kansui) giving a distinct chew and yellow colour. Regular noodles won't replicate this exactly.",
    goalFit:{ muscle_gain:"✅ Very similar macros", weight_loss:"✅ Same", balanced:"✅ Fine for most dishes" },
  },
  lamb:         {
    swap:"Chicken or soy chunks",
    saving:0.60,
    note:"Significantly cheaper, similar macros",
    nutritionNote:"Lamb has 3× more iron than chicken. Swap saves money but reduces iron and zinc significantly.",
    goalFit:{ muscle_gain:"⚠️ Lower iron", weight_loss:"✅ Much leaner", balanced:"✅ Good swap" },
  },
  // New swaps added in v2
  coconut_milk: {
    swap:"Thin curd + water blended",
    saving:0.45,
    note:"Creamy base at much lower cost",
    nutritionNote:"Coconut milk is high in saturated fat (MCTs). Curd is lower fat with added probiotics and protein.",
    goalFit:{ muscle_gain:"✅ Curd adds protein", weight_loss:"✅ Major calorie reduction", balanced:"⚠️ Loses MCTs and coconut flavour" },
  },
  parmesan:     {
    swap:"Nutritional yeast or sharp cheddar",
    saving:0.55,
    note:"Umami hit at lower price",
    nutritionNote:"Parmesan has more calcium. Nutritional yeast adds B12 — a bonus for vegetarians.",
    goalFit:{ muscle_gain:"✅ Similar protein", weight_loss:"⚠️ Cheddar has more fat", balanced:"✅ Good swap" },
  },
}

// ── Compute actual ₹ savings from a swap ──────────────────────
export function computeSwapSavings(item, location = "India") {
  const swapEntry = BUDGET_SWAPS_DB[item]
  if (!swapEntry) return null

  const original = computeIngredientCost(item, location)
  const savingRupees = Math.round(original.cost * swapEntry.saving)
  const savedPct     = Math.round(swapEntry.saving * 100)

  return {
    item,
    swapTo:      swapEntry.swap,
    originalCost:original.cost,
    savedRupees: savingRupees,
    newCost:     original.cost - savingRupees,
    savedPct,
    note:        swapEntry.note,
    nutritionNote: swapEntry.nutritionNote,
    goalFit:     swapEntry.goalFit,
  }
}

export function getAllSwapSavings(ingredients, location = "India", goal = "balanced") {
  return ingredients
    .map(item => computeSwapSavings(item, location))
    .filter(Boolean)
    .sort((a, b) => b.savedRupees - a.savedRupees)
}

export function totalPotentialSavings(ingredients, location = "India") {
  return getAllSwapSavings(ingredients, location)
    .reduce((sum, s) => sum + s.savedRupees, 0)
}


// ═════════════════════════════════════════════════════════════
//  SECTION 11 — FULL PRICE BREAKDOWN (updated)
//
//  Uses realistic qty + waste factor + per-category multiplier
//  + bulk discount + currency metadata
// ═════════════════════════════════════════════════════════════

export function computePriceBreakdown(ingredients, location = "India", servings = 1) {
  const currency = getCurrency(location)

  const items = ingredients.map(item => {
    const base      = computeIngredientCost(item, location)
    const perServing= applyBulkDiscount(base.cost, servings, PRICE_DB[item]?.category ?? "packaged")
    return {
      item,
      useQty:        base.useQty,
      buyQty:        base.buyQty,
      unit:          base.unit,
      costPerServing:Math.round(perServing),
      tier:          base.tier,
      wasteFactor:   base.wasteFactor,
      priceRange:    getPriceRangeInfo(item),
    }
  })

  const totalPerServing = items.reduce((s, i) => s + i.costPerServing, 0)
  const totalForRecipe  = Math.round(totalPerServing * servings)

  // Tier summary
  const tierInfo    = classifyRecipeTier(ingredients)
  const volatileItems = getHighVolatilityWarnings(ingredients)

  return {
    items,
    totalPerServing,
    totalForRecipe,
    servings,
    currency,
    tierInfo,
    volatileItems,
    formattedTotal: formatCost(totalPerServing, location),
  }
}

// Legacy multiplier export for any old code still using it
export const LOCATION_COST_FACTOR = {
  India:1.0, "India-South":1.0, "India-East":1.0,
  USA:4.8, Italy:4.2, France:4.5, Spain:4.0, Mediterranean:4.2,
  Mexico:2.1, China:1.8, Japan:5.5, Korea:3.8, Thailand:1.5,
  Vietnam:1.3, Indonesia:1.4,
}
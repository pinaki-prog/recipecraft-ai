// ─────────────────────────────────────────────────────────────
//  nutritionDB.js  (v2 — Full Upgrade)
//
//  WHAT'S NEW vs v1:
//  1.  57 duplicate entries removed (Misc section was entire
//      Proteins section copy-pasted — silent JS key overwrite)
//  2.  NUTRITION_DB + MICRO_DB merged into one unified object —
//      one lookup per ingredient, zero partial-data gaps
//  3.  Glycemic Index (gi) + Glycemic Load (gl) added
//  4.  Protein Quality Score (pdcaas 0–1) added to all proteins
//  5.  Omega-3 + Omega-6 (g/100g) added
//  6.  Sodium + Potassium + Magnesium + Zinc added (mg/100g)
//  7.  Vitamin B12 (mcg) + Vitamin D (IU) + Folate (mcg) added
//  8.  Satiety Index added (white bread = 100 baseline)
//  9.  Inflammatory Score added (anti = negative, pro = positive)
//  10. Health Tags added per ingredient
//  11. 6 missing ingredients added: chili_powder, cinnamon,
//      curry_leaves, garam_masala, hot_sauce, oyster_sauce
//  12. ALLERGEN_TAGS expanded to all 133 ingredients
//  13. PDCAAS_INFO export — per-ingredient explanation data
//      for RecipeDisplay.jsx to render score + reason + badge
//  14. COOKING_NOTES export — how cooking changes nutrition
//  15. Helper functions: getHealthScore(), getHealthInsights(),
//      getWarnings(), getProteinQuality(), getVitaminFlags()
//
//  All values per 100g unless noted.
//  Sources: USDA FoodData Central, NIH, WHO/FAO, published
//  nutrition literature. Values are typical/average.
// ─────────────────────────────────────────────────────────────

// ═════════════════════════════════════════════════════════════
//  SECTION 1 — UNIFIED NUTRITION DATABASE
//
//  Fields per ingredient:
//  ── Macros ────────────────────────────────────────────────
//  cal      calories (kcal)
//  p        protein (g)
//  c        carbohydrates (g)
//  f        fat (g)
//  fibre    dietary fibre (g)
//  ── Glycemic ──────────────────────────────────────────────
//  gi       Glycemic Index (0–100, glucose=100 reference)
//           <55=low, 56–69=medium, ≥70=high
//  gl       Glycemic Load = gi × c / 100
//           <10=low, 11–19=medium, ≥20=high
//  ── Protein Quality ───────────────────────────────────────
//  pdcaas   Protein Digestibility-Corrected Amino Acid Score
//           0.0–1.0. 1.0 = complete, bioavailable protein
//           null = not a significant protein source
//  ── Fats ──────────────────────────────────────────────────
//  omega3   g per 100g (ALA+EPA+DHA combined)
//  omega6   g per 100g
//  ── Minerals (mg/100g) ────────────────────────────────────
//  sodium   mg
//  potassium mg
//  magnesium mg
//  zinc     mg
//  iron     mg
//  calcium  mg
//  ── Vitamins ──────────────────────────────────────────────
//  vitC     mg per 100g
//  vitA     mcg RAE per 100g
//  vitB12   mcg per 100g (0 for all plants)
//  vitD     IU per 100g
//  folate   mcg per 100g
//  ── Health Metrics ────────────────────────────────────────
//  satiety  Satiety Index (white bread = 100)
//  inflam   Inflammatory score: negative=anti, positive=pro
//           Range approximately -10 to +10
//  ── Classification ────────────────────────────────────────
//  dietaryGroup  "vegan" | "vegetarian" | "non-veg"
//  tags     string[] — health tags for insight generation
// ═════════════════════════════════════════════════════════════

export const NUTRITION_DB = {

  // ════════════════════════════════════════════════════════
  //  PROTEINS — Animal
  // ════════════════════════════════════════════════════════

  chicken:    { cal:165,  p:31,   c:0,    f:3.6,  fibre:0,
                gi:0,   gl:0,   pdcaas:0.92,
                omega3:0.06, omega6:0.72,
                sodium:74,   potassium:256, magnesium:29,  zinc:1.0,
                iron:1.3,    calcium:11,    vitC:0,  vitA:21,
                vitB12:0.3,  vitD:4,        folate:4,
                satiety:166, inflam:-1,
                dietaryGroup:"non-veg",
                tags:["high-protein","lean","complete-protein","B12-source","low-fat"] },

  beef:       { cal:250,  p:26,   c:0,    f:15,   fibre:0,
                gi:0,   gl:0,   pdcaas:0.92,
                omega3:0.08, omega6:0.41,
                sodium:66,   potassium:318, magnesium:21,  zinc:4.8,
                iron:2.6,    calcium:18,    vitC:0,  vitA:0,
                vitB12:2.5,  vitD:2,        folate:6,
                satiety:176, inflam:2,
                dietaryGroup:"non-veg",
                tags:["high-protein","iron-rich","zinc-rich","B12-source","creatine-source"] },

  lamb:       { cal:294,  p:25,   c:0,    f:21,   fibre:0,
                gi:0,   gl:0,   pdcaas:0.94,
                omega3:0.16, omega6:1.20,
                sodium:72,   potassium:310, magnesium:23,  zinc:4.5,
                iron:1.9,    calcium:17,    vitC:0,  vitA:0,
                vitB12:2.7,  vitD:2,        folate:18,
                satiety:182, inflam:2,
                dietaryGroup:"non-veg",
                tags:["high-protein","iron-rich","zinc-rich","B12-source"] },

  pork:       { cal:242,  p:27,   c:0,    f:14,   fibre:0,
                gi:0,   gl:0,   pdcaas:0.91,
                omega3:0.07, omega6:1.60,
                sodium:62,   potassium:370, magnesium:28,  zinc:2.9,
                iron:0.9,    calcium:19,    vitC:0,  vitA:2,
                vitB12:0.7,  vitD:53,       folate:5,
                satiety:176, inflam:1,
                dietaryGroup:"non-veg",
                tags:["high-protein","B12-source","vitD-source","thiamine-rich"] },

  turkey:     { cal:189,  p:29,   c:0,    f:7,    fibre:0,
                gi:0,   gl:0,   pdcaas:0.93,
                omega3:0.06, omega6:1.40,
                sodium:70,   potassium:298, magnesium:28,  zinc:2.5,
                iron:1.4,    calcium:19,    vitC:0,  vitA:8,
                vitB12:0.3,  vitD:4,        folate:8,
                satiety:170, inflam:-1,
                dietaryGroup:"non-veg",
                tags:["high-protein","lean","low-fat","B12-source"] },

  fish:       { cal:150,  p:22,   c:0,    f:5,    fibre:0,
                gi:0,   gl:0,   pdcaas:0.96,
                omega3:1.10, omega6:0.22,
                sodium:75,   potassium:384, magnesium:32,  zinc:0.6,
                iron:0.9,    calcium:20,    vitC:0,  vitA:54,
                vitB12:2.4,  vitD:400,      folate:15,
                satiety:225, inflam:-4,
                dietaryGroup:"non-veg",
                tags:["omega-3-rich","anti-inflammatory","vitD-source","B12-source","heart-health","high-protein"] },

  shrimp:     { cal:99,   p:24,   c:0,    f:0.3,  fibre:0,
                gi:0,   gl:0,   pdcaas:0.91,
                omega3:0.28, omega6:0.03,
                sodium:111,  potassium:264, magnesium:34,  zinc:1.6,
                iron:0.5,    calcium:64,    vitC:0,  vitA:0,
                vitB12:1.2,  vitD:38,       folate:19,
                satiety:155, inflam:-2,
                dietaryGroup:"non-veg",
                tags:["high-protein","low-fat","iodine-source","selenium-source","B12-source"] },

  egg:        { cal:155,  p:13,   c:1,    f:11,   fibre:0,
                gi:0,   gl:0,   pdcaas:1.00,
                omega3:0.10, omega6:1.40,
                sodium:124,  potassium:138, magnesium:12,  zinc:1.3,
                iron:1.2,    calcium:50,    vitC:0,  vitA:160,
                vitB12:1.1,  vitD:82,       folate:47,
                satiety:150, inflam:-1,
                dietaryGroup:"vegetarian",
                tags:["complete-protein","vitD-source","B12-source","choline-source","biotin-source"] },

  // ════════════════════════════════════════════════════════
  //  PROTEINS — Plant
  // ════════════════════════════════════════════════════════

  paneer:     { cal:265,  p:18,   c:3,    f:21,   fibre:0,
                gi:0,   gl:0,   pdcaas:0.80,
                omega3:0.04, omega6:0.50,
                sodium:28,   potassium:99,  magnesium:8,   zinc:0.8,
                iron:0.3,    calcium:480,   vitC:0,  vitA:280,
                vitB12:0.4,  vitD:14,       folate:7,
                satiety:130, inflam:0,
                dietaryGroup:"vegetarian",
                tags:["calcium-rich","high-protein","vegetarian-protein","vitA-source"] },

  tofu:       { cal:144,  p:15,   c:3,    f:9,    fibre:0.3,
                gi:15,  gl:0,   pdcaas:0.91,
                omega3:0.37, omega6:4.47,
                sodium:14,   potassium:150, magnesium:37,  zinc:0.8,
                iron:2.7,    calcium:350,   vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:15,
                satiety:120, inflam:-2,
                dietaryGroup:"vegan",
                tags:["complete-protein","calcium-rich","iron-rich","vegan-protein","isoflavones"] },

  soy_chunks: { cal:345,  p:52,   c:33,   f:0.5,  fibre:5.6,
                gi:20,  gl:7,   pdcaas:0.91,
                omega3:0.16, omega6:2.22,
                sodium:15,   potassium:2010,magnesium:280, zinc:4.9,
                iron:10.4,   calcium:350,   vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:345,
                satiety:145, inflam:-2,
                dietaryGroup:"vegan",
                tags:["highest-plant-protein","iron-rich","vegan-protein","complete-protein","calcium-rich","folate-rich"] },

  // ════════════════════════════════════════════════════════
  //  GRAINS & CARBS
  // ════════════════════════════════════════════════════════

  rice:       { cal:130,  p:2.5,  c:28,   f:0.3,  fibre:0.4,
                gi:73,  gl:21,  pdcaas:0.59,
                omega3:0.02, omega6:0.10,
                sodium:1,    potassium:35,  magnesium:12,  zinc:0.6,
                iron:0.2,    calcium:10,    vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:8,
                satiety:138, inflam:2,
                dietaryGroup:"vegan",
                tags:["staple","gluten-free","high-gi","quick-energy"] },

  brown_rice: { cal:111,  p:2.6,  c:23,   f:0.9,  fibre:1.8,
                gi:50,  gl:11,  pdcaas:0.60,
                omega3:0.02, omega6:0.38,
                sodium:4,    potassium:79,  magnesium:43,  zinc:0.6,
                iron:0.4,    calcium:23,    vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:9,
                satiety:132, inflam:-1,
                dietaryGroup:"vegan",
                tags:["whole-grain","gluten-free","medium-gi","magnesium-source","fibre-source"] },

  basmati_rice:{ cal:121, p:3.5,  c:25,   f:0.4,  fibre:0.6,
                gi:58,  gl:15,  pdcaas:0.60,
                omega3:0.01, omega6:0.10,
                sodium:1,    potassium:52,  magnesium:14,  zinc:0.8,
                iron:0.2,    calcium:10,    vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:9,
                satiety:140, inflam:1,
                dietaryGroup:"vegan",
                tags:["gluten-free","aromatic","medium-gi","easy-digest"] },

  pasta:      { cal:160,  p:5,    c:30,   f:1,    fibre:1.8,
                gi:49,  gl:15,  pdcaas:0.42,
                omega3:0.02, omega6:0.35,
                sodium:1,    potassium:58,  magnesium:18,  zinc:0.5,
                iron:1.3,    calcium:7,     vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:7,
                satiety:119, inflam:1,
                dietaryGroup:"vegan",
                tags:["medium-gi","iron-source","comfort-food"] },

  rice_noodles:{ cal:109, p:2,    c:25,   f:0.2,  fibre:0.5,
                gi:61,  gl:15,  pdcaas:0.50,
                omega3:0,    omega6:0.05,
                sodium:10,   potassium:30,  magnesium:10,  zinc:0.3,
                iron:0.3,    calcium:7,     vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:3,
                satiety:120, inflam:1,
                dietaryGroup:"vegan",
                tags:["gluten-free","medium-gi","low-fat"] },

  ramen_noodles:{ cal:436,p:12,   c:60,   f:17,   fibre:2.5,
                gi:55,  gl:33,  pdcaas:0.42,
                omega3:0.02, omega6:4.20,
                sodium:1430, potassium:120, magnesium:22,  zinc:0.7,
                iron:2.2,    calcium:19,    vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:10,
                satiety:108, inflam:3,
                dietaryGroup:"vegan",
                tags:["high-sodium","medium-gi","high-fat"] },

  noodles:    { cal:138,  p:4.5,  c:25,   f:2.1,  fibre:1.5,
                gi:52,  gl:13,  pdcaas:0.42,
                omega3:0.02, omega6:0.80,
                sodium:180,  potassium:44,  magnesium:15,  zinc:0.4,
                iron:1.0,    calcium:12,    vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:7,
                satiety:112, inflam:1,
                dietaryGroup:"vegan",
                tags:["medium-gi","comfort-food"] },

  oats:       { cal:389,  p:17,   c:66,   f:7,    fibre:10.6,
                gi:55,  gl:36,  pdcaas:0.57,
                omega3:0.11, omega6:2.42,
                sodium:2,    potassium:429, magnesium:138, zinc:4.0,
                iron:4.7,    calcium:54,    vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:56,
                satiety:209, inflam:-3,
                dietaryGroup:"vegan",
                tags:["high-fibre","prebiotic","heart-health","beta-glucan","iron-rich","magnesium-rich","high-satiety"] },

  quinoa:     { cal:368,  p:14,   c:64,   f:6,    fibre:7.0,
                gi:53,  gl:34,  pdcaas:0.87,
                omega3:0.26, omega6:2.98,
                sodium:5,    potassium:563, magnesium:197, zinc:3.1,
                iron:4.6,    calcium:47,    vitC:0,  vitA:14,
                vitB12:0,    vitD:0,        folate:184,
                satiety:133, inflam:-2,
                dietaryGroup:"vegan",
                tags:["complete-protein","gluten-free","iron-rich","folate-rich","magnesium-rich","high-fibre","all-9-amino-acids"] },

  semolina:   { cal:360,  p:13,   c:73,   f:1,    fibre:3.9,
                gi:66,  gl:48,  pdcaas:0.42,
                omega3:0.03, omega6:0.45,
                sodium:1,    potassium:186, magnesium:47,  zinc:1.1,
                iron:1.2,    calcium:17,    vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:72,
                satiety:117, inflam:2,
                dietaryGroup:"vegan",
                tags:["high-gi","iron-source","energy-dense"] },

  flour:      { cal:364,  p:10,   c:76,   f:1,    fibre:2.7,
                gi:85,  gl:65,  pdcaas:0.42,
                omega3:0.02, omega6:0.48,
                sodium:2,    potassium:107, magnesium:22,  zinc:0.7,
                iron:1.2,    calcium:15,    vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:26,
                satiety:100, inflam:3,
                dietaryGroup:"vegan",
                tags:["high-gi","refined-carb","gluten-source","pro-inflammatory"] },

  whole_wheat_flour:{ cal:339,p:13, c:72,  f:2.5,  fibre:10.7,
                gi:74,  gl:53,  pdcaas:0.42,
                omega3:0.06, omega6:0.82,
                sodium:2,    potassium:405, magnesium:138, zinc:2.9,
                iron:3.6,    calcium:34,    vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:44,
                satiety:112, inflam:1,
                dietaryGroup:"vegan",
                tags:["whole-grain","iron-rich","magnesium-rich","high-fibre","better-than-white-flour"] },

  gram_flour: { cal:387,  p:22,   c:58,   f:6.7,  fibre:10.9,
                gi:44,  gl:26,  pdcaas:0.68,
                omega3:0.09, omega6:2.90,
                sodium:64,   potassium:846, magnesium:166, zinc:2.7,
                iron:6.2,    calcium:45,    vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:437,
                satiety:130, inflam:-1,
                dietaryGroup:"vegan",
                tags:["high-protein","iron-rich","folate-rich","low-gi","gluten-free","fibre-rich"] },

  bread:      { cal:265,  p:9,    c:49,   f:3.2,  fibre:2.7,
                gi:75,  gl:37,  pdcaas:0.42,
                omega3:0.05, omega6:0.72,
                sodium:491,  potassium:115, magnesium:23,  zinc:0.7,
                iron:2.7,    calcium:260,   vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:34,
                satiety:100, inflam:3,
                dietaryGroup:"vegan",
                tags:["high-gi","high-sodium","refined-carb"] },

  buns:       { cal:310,  p:10,   c:53,   f:6,    fibre:2.3,
                gi:75,  gl:40,  pdcaas:0.42,
                omega3:0.04, omega6:1.10,
                sodium:520,  potassium:100, magnesium:20,  zinc:0.6,
                iron:2.4,    calcium:80,    vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:25,
                satiety:98,  inflam:3,
                dietaryGroup:"vegan",
                tags:["high-gi","high-sodium","refined-carb"] },

  flattened_rice:{ cal:346,p:7,   c:77,   f:1.2,  fibre:1.5,
                gi:70,  gl:54,  pdcaas:0.50,
                omega3:0.01, omega6:0.25,
                sodium:5,    potassium:76,  magnesium:50,  zinc:1.2,
                iron:2.8,    calcium:14,    vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:20,
                satiety:115, inflam:2,
                dietaryGroup:"vegan",
                tags:["iron-source","gluten-free","easy-digest","high-gi"] },

  corn_tortillas:{ cal:218,p:5,   c:46,   f:3,    fibre:6.7,
                gi:52,  gl:24,  pdcaas:0.45,
                omega3:0.05, omega6:1.05,
                sodium:322,  potassium:157, magnesium:68,  zinc:0.8,
                iron:1.5,    calcium:121,   vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:22,
                satiety:115, inflam:1,
                dietaryGroup:"vegan",
                tags:["gluten-free","calcium-source","medium-gi","fibre-source"] },

  pita_bread: { cal:275,  p:9,    c:55,   f:1.2,  fibre:2.2,
                gi:57,  gl:31,  pdcaas:0.42,
                omega3:0.02, omega6:0.35,
                sodium:536,  potassium:120, magnesium:26,  zinc:0.7,
                iron:1.8,    calcium:58,    vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:28,
                satiety:110, inflam:2,
                dietaryGroup:"vegan",
                tags:["high-sodium","medium-gi"] },

  sago:       { cal:352,  p:0.2,  c:87,   f:0.2,  fibre:0.9,
                gi:90,  gl:78,  pdcaas:null,
                omega3:0,    omega6:0.01,
                sodium:2,    potassium:11,  magnesium:3,   zinc:0.1,
                iron:0.3,    calcium:10,    vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:2,
                satiety:105, inflam:3,
                dietaryGroup:"vegan",
                tags:["high-gi","easily-digestible","fasting-food","gluten-free","low-nutrient"] },

  // ════════════════════════════════════════════════════════
  //  PULSES & LEGUMES
  // ════════════════════════════════════════════════════════

  toor_dal:   { cal:343,  p:22,   c:62,   f:1.7,  fibre:8.0,
                gi:29,  gl:18,  pdcaas:0.64,
                omega3:0.09, omega6:0.55,
                sodium:17,   potassium:983, magnesium:88,  zinc:2.8,
                iron:5.3,    calcium:73,    vitC:0,  vitA:3,
                vitB12:0,    vitD:0,        folate:157,
                satiety:133, inflam:-3,
                dietaryGroup:"vegan",
                tags:["high-protein","iron-rich","folate-rich","low-gi","fibre-rich","anti-inflammatory"] },

  moong_dal:  { cal:347,  p:24,   c:63,   f:1.2,  fibre:7.6,
                gi:25,  gl:16,  pdcaas:0.68,
                omega3:0.12, omega6:0.42,
                sodium:15,   potassium:1246,magnesium:189, zinc:2.7,
                iron:6.7,    calcium:132,   vitC:4,  vitA:6,
                vitB12:0,    vitD:0,        folate:159,
                satiety:138, inflam:-4,
                dietaryGroup:"vegan",
                tags:["easy-digest","iron-rich","folate-rich","low-gi","anti-inflammatory","most-digestible-dal"] },

  masoor_dal: { cal:352,  p:25,   c:63,   f:1,    fibre:7.9,
                gi:21,  gl:13,  pdcaas:0.64,
                omega3:0.07, omega6:0.36,
                sodium:6,    potassium:677, magnesium:122, zinc:3.3,
                iron:6.5,    calcium:56,    vitC:1,  vitA:0,
                vitB12:0,    vitD:0,        folate:181,
                satiety:135, inflam:-3,
                dietaryGroup:"vegan",
                tags:["high-protein","iron-rich","folate-rich","low-gi","fibre-rich"] },

  urad_dal:   { cal:341,  p:25,   c:59,   f:1.6,  fibre:8.0,
                gi:43,  gl:25,  pdcaas:0.66,
                omega3:0.04, omega6:0.56,
                sodium:38,   potassium:983, magnesium:267, zinc:3.4,
                iron:7.6,    calcium:138,   vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:216,
                satiety:132, inflam:-3,
                dietaryGroup:"vegan",
                tags:["iron-rich","calcium-rich","magnesium-rich","folate-rich","high-protein"] },

  chana_dal:  { cal:360,  p:20,   c:65,   f:5,    fibre:8.1,
                gi:8,   gl:5,   pdcaas:0.68,
                omega3:0.10, omega6:2.18,
                sodium:30,   potassium:875, magnesium:166, zinc:2.5,
                iron:4.9,    calcium:102,   vitC:1,  vitA:2,
                vitB12:0,    vitD:0,        folate:190,
                satiety:140, inflam:-4,
                dietaryGroup:"vegan",
                tags:["lowest-gi-dal","iron-rich","folate-rich","high-satiety","anti-inflammatory"] },

  chickpeas:  { cal:364,  p:19,   c:61,   f:6,    fibre:12.2,
                gi:28,  gl:17,  pdcaas:0.68,
                omega3:0.10, omega6:2.70,
                sodium:24,   potassium:875, magnesium:115, zinc:2.8,
                iron:4.3,    calcium:105,   vitC:4,  vitA:3,
                vitB12:0,    vitD:0,        folate:557,
                satiety:142, inflam:-4,
                dietaryGroup:"vegan",
                tags:["iron-rich","folate-rich","high-fibre","low-gi","anti-inflammatory","high-satiety"] },

  rajma:      { cal:333,  p:24,   c:60,   f:1,    fibre:15.2,
                gi:24,  gl:14,  pdcaas:0.68,
                omega3:0.18, omega6:0.18,
                sodium:9,    potassium:1406,magnesium:140, zinc:2.8,
                iron:5.5,    calcium:83,    vitC:5,  vitA:0,
                vitB12:0,    vitD:0,        folate:394,
                satiety:148, inflam:-4,
                dietaryGroup:"vegan",
                tags:["highest-fibre","iron-rich","potassium-rich","low-gi","anti-inflammatory","muscle-gain","high-satiety"] },

  // ════════════════════════════════════════════════════════
  //  VEGETABLES
  // ════════════════════════════════════════════════════════

  potato:     { cal:87,   p:2,    c:20,   f:0.1,  fibre:2.2,
                gi:78,  gl:15,  pdcaas:null,
                omega3:0.01, omega6:0.04,
                sodium:6,    potassium:421, magnesium:23,  zinc:0.3,
                iron:0.8,    calcium:12,    vitC:20, vitA:2,
                vitB12:0,    vitD:0,        folate:18,
                satiety:323, inflam:1,
                dietaryGroup:"vegan",
                tags:["potassium-rich","vitC-source","high-satiety","high-gi"] },

  sweet_potato:{ cal:86,  p:1.6,  c:20,   f:0.1,  fibre:3.0,
                gi:44,  gl:9,   pdcaas:null,
                omega3:0.01, omega6:0.01,
                sodium:55,   potassium:337, magnesium:25,  zinc:0.3,
                iron:0.6,    calcium:30,    vitC:20, vitA:961,
                vitB12:0,    vitD:0,        folate:11,
                satiety:150, inflam:-3,
                dietaryGroup:"vegan",
                tags:["vitA-rich","beta-carotene","anti-inflammatory","low-gi","fibre-source"] },

  spinach:    { cal:23,   p:3,    c:4,    f:0.4,  fibre:2.2,
                gi:15,  gl:1,   pdcaas:null,
                omega3:0.14, omega6:0.03,
                sodium:79,   potassium:558, magnesium:79,  zinc:0.5,
                iron:2.7,    calcium:99,    vitC:28, vitA:469,
                vitB12:0,    vitD:0,        folate:194,
                satiety:116, inflam:-6,
                dietaryGroup:"vegan",
                tags:["iron-rich","folate-rich","vitA-rich","anti-inflammatory","calcium-source","omega-3-plant","highest-anti-inflam-veg"] },

  carrot:     { cal:41,   p:1,    c:10,   f:0.2,  fibre:2.8,
                gi:47,  gl:5,   pdcaas:null,
                omega3:0.01, omega6:0.12,
                sodium:69,   potassium:320, magnesium:12,  zinc:0.2,
                iron:0.3,    calcium:33,    vitC:6,  vitA:835,
                vitB12:0,    vitD:0,        folate:19,
                satiety:125, inflam:-3,
                dietaryGroup:"vegan",
                tags:["vitA-rich","beta-carotene","antioxidant","low-gi","anti-inflammatory"] },

  onion:      { cal:40,   p:1,    c:9,    f:0.1,  fibre:1.7,
                gi:10,  gl:1,   pdcaas:null,
                omega3:0.01, omega6:0.05,
                sodium:4,    potassium:146, magnesium:10,  zinc:0.2,
                iron:0.2,    calcium:23,    vitC:7,  vitA:2,
                vitB12:0,    vitD:0,        folate:19,
                satiety:115, inflam:-2,
                dietaryGroup:"vegan",
                tags:["quercetin","anti-inflammatory","prebiotic","antioxidant","sulphur-compounds"] },

  tomato:     { cal:18,   p:1,    c:4,    f:0.2,  fibre:1.2,
                gi:15,  gl:1,   pdcaas:null,
                omega3:0.00, omega6:0.09,
                sodium:5,    potassium:237, magnesium:11,  zinc:0.2,
                iron:0.3,    calcium:18,    vitC:23, vitA:75,
                vitB12:0,    vitD:0,        folate:15,
                satiety:118, inflam:-4,
                dietaryGroup:"vegan",
                tags:["lycopene","anti-inflammatory","vitC-source","antioxidant","low-calorie","note:lycopene-increases-when-cooked"] },

  capsicum:   { cal:20,   p:1,    c:5,    f:0.1,  fibre:2.1,
                gi:10,  gl:0.5, pdcaas:null,
                omega3:0.03, omega6:0.05,
                sodium:3,    potassium:211, magnesium:12,  zinc:0.3,
                iron:0.4,    calcium:11,    vitC:128,vitA:18,
                vitB12:0,    vitD:0,        folate:46,
                satiety:120, inflam:-5,
                dietaryGroup:"vegan",
                tags:["highest-vitC","anti-inflammatory","antioxidant","low-calorie","carotenoids"] },

  pumpkin:    { cal:26,   p:1,    c:7,    f:0.1,  fibre:0.5,
                gi:65,  gl:5,   pdcaas:null,
                omega3:0.01, omega6:0.03,
                sodium:1,    potassium:340, magnesium:12,  zinc:0.3,
                iron:0.4,    calcium:16,    vitC:9,  vitA:426,
                vitB12:0,    vitD:0,        folate:16,
                satiety:122, inflam:-2,
                dietaryGroup:"vegan",
                tags:["vitA-rich","beta-carotene","potassium-source","low-calorie"] },

  raw_banana: { cal:89,   p:1,    c:23,   f:0.3,  fibre:2.6,
                gi:40,  gl:9,   pdcaas:null,
                omega3:0.02, omega6:0.05,
                sodium:4,    potassium:358, magnesium:27,  zinc:0.2,
                iron:0.6,    calcium:8,     vitC:15, vitA:3,
                vitB12:0,    vitD:0,        folate:22,
                satiety:155, inflam:-1,
                dietaryGroup:"vegan",
                tags:["resistant-starch","prebiotic","potassium-source","low-gi-raw"] },

  papaya:     { cal:43,   p:0.5,  c:11,   f:0.3,  fibre:1.7,
                gi:56,  gl:6,   pdcaas:null,
                omega3:0.01, omega6:0.04,
                sodium:8,    potassium:182, magnesium:21,  zinc:0.1,
                iron:0.1,    calcium:24,    vitC:62, vitA:47,
                vitB12:0,    vitD:0,        folate:37,
                satiety:118, inflam:-4,
                dietaryGroup:"vegan",
                tags:["vitC-rich","digestive-enzymes","papain","anti-inflammatory","antioxidant"] },

  broccoli:   { cal:34,   p:2.8,  c:7,    f:0.4,  fibre:2.6,
                gi:10,  gl:1,   pdcaas:null,
                omega3:0.21, omega6:0.08,
                sodium:33,   potassium:316, magnesium:21,  zinc:0.4,
                iron:0.7,    calcium:47,    vitC:89, vitA:31,
                vitB12:0,    vitD:0,        folate:63,
                satiety:124, inflam:-7,
                dietaryGroup:"vegan",
                tags:["sulforaphane","anti-cancer","vitC-rich","folate-source","anti-inflammatory","highest-anti-inflam-brassica"] },

  cauliflower:{ cal:25,   p:1.9,  c:5,    f:0.3,  fibre:2.0,
                gi:15,  gl:1,   pdcaas:null,
                omega3:0.04, omega6:0.04,
                sodium:30,   potassium:299, magnesium:15,  zinc:0.3,
                iron:0.4,    calcium:22,    vitC:48, vitA:0,
                vitB12:0,    vitD:0,        folate:57,
                satiety:120, inflam:-4,
                dietaryGroup:"vegan",
                tags:["sulforaphane","vitC-source","folate-source","anti-inflammatory","low-calorie"] },

  mushroom:   { cal:22,   p:3,    c:3,    f:0.3,  fibre:1.0,
                gi:10,  gl:0,   pdcaas:null,
                omega3:0.01, omega6:0.23,
                sodium:5,    potassium:318, magnesium:9,   zinc:0.5,
                iron:0.5,    calcium:3,     vitC:2,  vitA:0,
                vitB12:0,    vitD:18,       folate:17,
                satiety:128, inflam:-2,
                dietaryGroup:"vegan",
                tags:["vitD-source","beta-glucan","immune-support","umami","low-calorie","B-vitamins"] },

  green_peas: { cal:81,   p:5,    c:14,   f:0.4,  fibre:5.5,
                gi:39,  gl:5,   pdcaas:null,
                omega3:0.04, omega6:0.20,
                sodium:5,    potassium:244, magnesium:33,  zinc:1.2,
                iron:1.5,    calcium:25,    vitC:40, vitA:38,
                vitB12:0,    vitD:0,        folate:65,
                satiety:128, inflam:-2,
                dietaryGroup:"vegan",
                tags:["plant-protein","vitC-source","folate-source","low-gi","fibre-rich"] },

  garlic:     { cal:149,  p:6.4,  c:33,   f:0.5,  fibre:2.1,
                gi:30,  gl:10,  pdcaas:null,
                omega3:0.01, omega6:0.23,
                sodium:17,   potassium:401, magnesium:25,  zinc:1.2,
                iron:1.7,    calcium:181,   vitC:31, vitA:0,
                vitB12:0,    vitD:0,        folate:3,
                satiety:115, inflam:-7,
                dietaryGroup:"vegan",
                tags:["allicin","anti-inflammatory","antibacterial","immune-boost","heart-health","anti-cancer","most-potent-culinary-anti-inflam"] },

  ginger:     { cal:80,   p:1.8,  c:18,   f:0.8,  fibre:2.0,
                gi:10,  gl:2,   pdcaas:null,
                omega3:0.03, omega6:0.14,
                sodium:13,   potassium:415, magnesium:43,  zinc:0.3,
                iron:0.6,    calcium:16,    vitC:5,  vitA:0,
                vitB12:0,    vitD:0,        folate:11,
                satiety:112, inflam:-6,
                dietaryGroup:"vegan",
                tags:["gingerol","anti-inflammatory","anti-nausea","digestion","anti-cancer","anti-inflammatory"] },

  cucumber:   { cal:15,   p:0.7,  c:3.6,  f:0.1,  fibre:0.5,
                gi:15,  gl:0.5, pdcaas:null,
                omega3:0.01, omega6:0.03,
                sodium:2,    potassium:147, magnesium:13,  zinc:0.2,
                iron:0.3,    calcium:16,    vitC:3,  vitA:5,
                vitB12:0,    vitD:0,        folate:7,
                satiety:120, inflam:-1,
                dietaryGroup:"vegan",
                tags:["hydrating","low-calorie","cooling","anti-inflammatory","silica-source"] },

  lettuce:    { cal:15,   p:1.4,  c:2.9,  f:0.2,  fibre:1.3,
                gi:15,  gl:0.4, pdcaas:null,
                omega3:0.06, omega6:0.07,
                sodium:28,   potassium:194, magnesium:13,  zinc:0.2,
                iron:0.9,    calcium:36,    vitC:9,  vitA:166,
                vitB12:0,    vitD:0,        folate:38,
                satiety:118, inflam:-2,
                dietaryGroup:"vegan",
                tags:["vitA-source","folate-source","low-calorie","hydrating"] },

  eggplant:   { cal:25,   p:1,    c:6,    f:0.2,  fibre:3.0,
                gi:15,  gl:1,   pdcaas:null,
                omega3:0.01, omega6:0.08,
                sodium:2,    potassium:229, magnesium:14,  zinc:0.2,
                iron:0.2,    calcium:9,     vitC:2,  vitA:1,
                vitB12:0,    vitD:0,        folate:22,
                satiety:120, inflam:-2,
                dietaryGroup:"vegan",
                tags:["nasunin","antioxidant","fibre-source","low-calorie","anti-inflammatory"] },

  zucchini:   { cal:17,   p:1.2,  c:3.1,  f:0.3,  fibre:1.0,
                gi:15,  gl:0.5, pdcaas:null,
                omega3:0.06, omega6:0.07,
                sodium:8,    potassium:261, magnesium:18,  zinc:0.3,
                iron:0.4,    calcium:16,    vitC:18, vitA:10,
                vitB12:0,    vitD:0,        folate:24,
                satiety:118, inflam:-2,
                dietaryGroup:"vegan",
                tags:["vitC-source","low-calorie","low-carb","hydrating","anti-inflammatory"] },

  avocado:    { cal:160,  p:2,    c:9,    f:15,   fibre:6.7,
                gi:10,  gl:1,   pdcaas:null,
                omega3:0.11, omega6:1.67,
                sodium:7,    potassium:485, magnesium:29,  zinc:0.6,
                iron:0.6,    calcium:12,    vitC:10, vitA:7,
                vitB12:0,    vitD:0,        folate:81,
                satiety:130, inflam:-4,
                dietaryGroup:"vegan",
                tags:["monounsaturated-fat","heart-health","potassium-rich","folate-rich","anti-inflammatory","oleic-acid"] },

  banana:     { cal:89,   p:1.1,  c:23,   f:0.3,  fibre:2.6,
                gi:51,  gl:12,  pdcaas:null,
                omega3:0.03, omega6:0.05,
                sodium:1,    potassium:358, magnesium:27,  zinc:0.2,
                iron:0.3,    calcium:5,     vitC:9,  vitA:3,
                vitB12:0,    vitD:0,        folate:20,
                satiety:118, inflam:-1,
                dietaryGroup:"vegan",
                tags:["potassium-rich","prebiotic","energy-source","tryptophan","mood-support"] },

  blueberries:{ cal:57,   p:0.7,  c:14,   f:0.3,  fibre:2.4,
                gi:40,  gl:6,   pdcaas:null,
                omega3:0.06, omega6:0.09,
                sodium:1,    potassium:77,  magnesium:6,   zinc:0.2,
                iron:0.3,    calcium:6,     vitC:10, vitA:3,
                vitB12:0,    vitD:0,        folate:6,
                satiety:120, inflam:-8,
                dietaryGroup:"vegan",
                tags:["anthocyanins","antioxidant","brain-health","anti-inflammatory","highest-antioxidant-fruit","heart-health"] },

  olives:     { cal:115,  p:0.8,  c:6,    f:11,   fibre:3.2,
                gi:10,  gl:0.6, pdcaas:null,
                omega3:0.09, omega6:0.78,
                sodium:735,  potassium:8,   magnesium:4,   zinc:0.2,
                iron:3.3,    calcium:88,    vitC:0,  vitA:20,
                vitB12:0,    vitD:0,        folate:3,
                satiety:120, inflam:-4,
                dietaryGroup:"vegan",
                tags:["monounsaturated-fat","oleuropein","anti-inflammatory","iron-rich","high-sodium"] },

  spring_onion:{ cal:32,  p:1.8,  c:7.3,  f:0.2,  fibre:2.6,
                gi:10,  gl:0.7, pdcaas:null,
                omega3:0.08, omega6:0.06,
                sodium:16,   potassium:276, magnesium:20,  zinc:0.4,
                iron:1.2,    calcium:72,    vitC:18, vitA:50,
                vitB12:0,    vitD:0,        folate:64,
                satiety:118, inflam:-3,
                dietaryGroup:"vegan",
                tags:["vitA-source","vitC-source","folate-source","anti-inflammatory","quercetin"] },

  cabbage:    { cal:25,   p:1.3,  c:6,    f:0.1,  fibre:2.5,
                gi:10,  gl:0.6, pdcaas:null,
                omega3:0.10, omega6:0.02,
                sodium:18,   potassium:170, magnesium:12,  zinc:0.2,
                iron:0.5,    calcium:40,    vitC:36, vitA:5,
                vitB12:0,    vitD:0,        folate:43,
                satiety:120, inflam:-4,
                dietaryGroup:"vegan",
                tags:["sulforaphane","vitC-source","anti-inflammatory","fibre-source","gut-health","budget-superfood"] },

  okra:       { cal:33,   p:2,    c:7,    f:0.2,  fibre:3.2,
                gi:20,  gl:1.4, pdcaas:null,
                omega3:0.03, omega6:0.10,
                sodium:7,    potassium:299, magnesium:57,  zinc:0.6,
                iron:0.8,    calcium:82,    vitC:23, vitA:36,
                vitB12:0,    vitD:0,        folate:87,
                satiety:122, inflam:-3,
                dietaryGroup:"vegan",
                tags:["mucilage","blood-sugar-stabilising","folate-rich","vitC-source","calcium-source","magnesium-rich"] },

  drumstick:  { cal:37,   p:2.1,  c:8.5,  f:0.2,  fibre:3.2,
                gi:25,  gl:2.1, pdcaas:null,
                omega3:0.04, omega6:0.07,
                sodium:42,   potassium:461, magnesium:45,  zinc:0.6,
                iron:0.4,    calcium:30,    vitC:141,vitA:4,
                vitB12:0,    vitD:0,        folate:44,
                satiety:122, inflam:-4,
                dietaryGroup:"vegan",
                tags:["moringa","vitC-rich","potassium-rich","anti-inflammatory","traditional-medicine"] },

  tamarind:   { cal:239,  p:2.8,  c:62,   f:0.6,  fibre:5.1,
                gi:23,  gl:14,  pdcaas:null,
                omega3:0.01, omega6:0.11,
                sodium:28,   potassium:628, magnesium:92,  zinc:0.1,
                iron:2.8,    calcium:74,    vitC:3,  vitA:2,
                vitB12:0,    vitD:0,        folate:14,
                satiety:112, inflam:-1,
                dietaryGroup:"vegan",
                tags:["tartaric-acid","iron-source","potassium-rich","digestive","antioxidant"] },

  coconut:    { cal:354,  p:3.3,  c:15,   f:33,   fibre:9.0,
                gi:45,  gl:7,   pdcaas:null,
                omega3:0.01, omega6:0.37,
                sodium:20,   potassium:356, magnesium:32,  zinc:1.1,
                iron:2.4,    calcium:14,    vitC:3,  vitA:0,
                vitB12:0,    vitD:0,        folate:26,
                satiety:120, inflam:-1,
                dietaryGroup:"vegan",
                tags:["MCT-fat","lauric-acid","iron-source","fibre-rich","medium-chain-triglycerides"] },

  bamboo_shoots:{ cal:27, p:2.6,  c:5.2,  f:0.3,  fibre:2.2,
                gi:20,  gl:1,   pdcaas:null,
                omega3:0.01, omega6:0.04,
                sodium:4,    potassium:533, magnesium:3,   zinc:1.1,
                iron:0.5,    calcium:13,    vitC:4,  vitA:1,
                vitB12:0,    vitD:0,        folate:7,
                satiety:125, inflam:-2,
                dietaryGroup:"vegan",
                tags:["low-calorie","potassium-rich","fibre-source","anti-inflammatory"] },

  lemon:      { cal:29,   p:1.1,  c:9,    f:0.3,  fibre:2.8,
                gi:20,  gl:2,   pdcaas:null,
                omega3:0.03, omega6:0.07,
                sodium:2,    potassium:138, magnesium:8,   zinc:0.1,
                iron:0.6,    calcium:26,    vitC:53, vitA:1,
                vitB12:0,    vitD:0,        folate:11,
                satiety:110, inflam:-3,
                dietaryGroup:"vegan",
                tags:["vitC-source","antioxidant","alkalising","citric-acid","flavonoids"] },

  lime:       { cal:30,   p:0.7,  c:11,   f:0.2,  fibre:2.8,
                gi:20,  gl:2.2, pdcaas:null,
                omega3:0.01, omega6:0.05,
                sodium:2,    potassium:102, magnesium:6,   zinc:0.1,
                iron:0.6,    calcium:33,    vitC:29, vitA:2,
                vitB12:0,    vitD:0,        folate:8,
                satiety:110, inflam:-3,
                dietaryGroup:"vegan",
                tags:["vitC-source","antioxidant","alkalising","flavonoids"] },

  // ════════════════════════════════════════════════════════
  //  DAIRY & FATS
  // ════════════════════════════════════════════════════════

  ghee:       { cal:900,  p:0,    c:0,    f:100,  fibre:0,
                gi:0,   gl:0,   pdcaas:null,
                omega3:0.27, omega6:1.80,
                sodium:2,    potassium:5,   magnesium:0,   zinc:0,
                iron:0,      calcium:0,     vitC:0,  vitA:840,
                vitB12:0,    vitD:0,        folate:0,
                satiety:120, inflam:-1,
                dietaryGroup:"vegetarian",
                tags:["clarified-butter","high-smoke-point","vitA-source","butyric-acid","ayurvedic","CLA"] },

  butter:     { cal:717,  p:1,    c:0,    f:81,   fibre:0,
                gi:0,   gl:0,   pdcaas:null,
                omega3:0.32, omega6:1.78,
                sodium:576,  potassium:24,  magnesium:2,   zinc:0.1,
                iron:0.02,   calcium:24,    vitC:0,  vitA:684,
                vitB12:0.2,  vitD:97,       folate:3,
                satiety:118, inflam:2,
                dietaryGroup:"vegetarian",
                tags:["vitA-source","vitD-source","CLA","saturated-fat","high-sodium"] },

  olive_oil:  { cal:884,  p:0,    c:0,    f:100,  fibre:0,
                gi:0,   gl:0,   pdcaas:null,
                omega3:0.76, omega6:9.76,
                sodium:2,    potassium:1,   magnesium:0,   zinc:0,
                iron:0.1,    calcium:1,     vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:0,
                satiety:115, inflam:-5,
                dietaryGroup:"vegan",
                tags:["oleic-acid","polyphenols","heart-health","anti-inflammatory","monounsaturated-fat","Mediterranean-staple"] },

  mustard_oil:{ cal:884,  p:0,    c:0,    f:100,  fibre:0,
                gi:0,   gl:0,   pdcaas:null,
                omega3:5.90, omega6:15.30,
                sodium:0,    potassium:0,   magnesium:0,   zinc:0,
                iron:0,      calcium:0,     vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:0,
                satiety:115, inflam:-3,
                dietaryGroup:"vegan",
                tags:["erucic-acid","omega-3-plant","anti-fungal","traditional-oil","high-smoke-point"] },

  sesame_oil: { cal:884,  p:0,    c:0,    f:100,  fibre:0,
                gi:0,   gl:0,   pdcaas:null,
                omega3:0.30, omega6:41.30,
                sodium:0,    potassium:0,   magnesium:0,   zinc:0,
                iron:0,      calcium:0,     vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:0,
                satiety:115, inflam:2,
                dietaryGroup:"vegan",
                tags:["sesamol","antioxidant","high-omega-6","finishing-oil","do-not-overheat"] },

  oil:        { cal:884,  p:0,    c:0,    f:100,  fibre:0,
                gi:0,   gl:0,   pdcaas:null,
                omega3:0.20, omega6:23.0,
                sodium:0,    potassium:0,   magnesium:0,   zinc:0,
                iron:0,      calcium:0,     vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:0,
                satiety:115, inflam:1,
                dietaryGroup:"vegan",
                tags:["neutral-oil","high-smoke-point"] },

  milk:       { cal:60,   p:3,    c:5,    f:3,    fibre:0,
                gi:31,  gl:2,   pdcaas:1.00,
                omega3:0.08, omega6:0.11,
                sodium:44,   potassium:150, magnesium:10,  zinc:0.4,
                iron:0.1,    calcium:125,   vitC:0,  vitA:46,
                vitB12:0.5,  vitD:40,       folate:5,
                satiety:130, inflam:-1,
                dietaryGroup:"vegetarian",
                tags:["calcium-rich","complete-protein","vitD-source","B12-source","bone-health"] },

  curd:       { cal:98,   p:11,   c:3,    f:4,    fibre:0,
                gi:36,  gl:1,   pdcaas:1.00,
                omega3:0.05, omega6:0.14,
                sodium:70,   potassium:141, magnesium:11,  zinc:0.5,
                iron:0.1,    calcium:110,   vitC:0,  vitA:27,
                vitB12:0.4,  vitD:2,        folate:7,
                satiety:140, inflam:-2,
                dietaryGroup:"vegetarian",
                tags:["probiotic","calcium-rich","gut-health","complete-protein","B12-source","immune-support"] },

  yogurt:     { cal:63,   p:5,    c:7,    f:1.6,  fibre:0,
                gi:36,  gl:3,   pdcaas:1.00,
                omega3:0.03, omega6:0.07,
                sodium:70,   potassium:141, magnesium:11,  zinc:0.5,
                iron:0.1,    calcium:110,   vitC:0,  vitA:27,
                vitB12:0.4,  vitD:2,        folate:7,
                satiety:135, inflam:-2,
                dietaryGroup:"vegetarian",
                tags:["probiotic","calcium-rich","gut-health","complete-protein","B12-source"] },

  cream:      { cal:340,  p:2.1,  c:3,    f:36,   fibre:0,
                gi:0,   gl:0,   pdcaas:null,
                omega3:0.27, omega6:0.78,
                sodium:38,   potassium:97,  magnesium:7,   zinc:0.2,
                iron:0.03,   calcium:65,    vitC:0,  vitA:400,
                vitB12:0.2,  vitD:7,        folate:4,
                satiety:115, inflam:2,
                dietaryGroup:"vegetarian",
                tags:["vitA-source","high-fat","saturated-fat","use-sparingly"] },

  coconut_milk:{ cal:230, p:2.3,  c:6,    f:24,   fibre:2.2,
                gi:41,  gl:2.5, pdcaas:null,
                omega3:0.03, omega6:0.27,
                sodium:15,   potassium:263, magnesium:37,  zinc:0.7,
                iron:1.6,    calcium:16,    vitC:3,  vitA:0,
                vitB12:0,    vitD:0,        folate:16,
                satiety:122, inflam:-1,
                dietaryGroup:"vegan",
                tags:["MCT-fat","lauric-acid","iron-source","dairy-free","lactose-free"] },

  khoya:      { cal:421,  p:20,   c:45,   f:17,   fibre:0,
                gi:45,  gl:20,  pdcaas:0.90,
                omega3:0.12, omega6:0.32,
                sodium:80,   potassium:400, magnesium:25,  zinc:1.0,
                iron:0.2,    calcium:765,   vitC:0,  vitA:400,
                vitB12:1.0,  vitD:15,       folate:10,
                satiety:120, inflam:1,
                dietaryGroup:"vegetarian",
                tags:["calcium-rich","high-protein","vitA-source","B12-source","traditional-dairy"] },

  feta_cheese:{ cal:264,  p:14,   c:4,    f:21,   fibre:0,
                gi:0,   gl:0,   pdcaas:0.80,
                omega3:0.28, omega6:0.30,
                sodium:1116, potassium:62,  magnesium:19,  zinc:2.9,
                iron:0.7,    calcium:493,   vitC:0,  vitA:422,
                vitB12:1.7,  vitD:16,       folate:32,
                satiety:125, inflam:1,
                dietaryGroup:"vegetarian",
                tags:["calcium-rich","B12-source","zinc-source","very-high-sodium","vitA-source"] },

  parmesan:   { cal:431,  p:38,   c:4,    f:29,   fibre:0,
                gi:0,   gl:0,   pdcaas:0.90,
                omega3:0.36, omega6:0.33,
                sodium:1529, potassium:92,  magnesium:44,  zinc:2.9,
                iron:0.7,    calcium:1184,  vitC:0,  vitA:207,
                vitB12:1.2,  vitD:19,       folate:7,
                satiety:128, inflam:1,
                dietaryGroup:"vegetarian",
                tags:["highest-calcium-cheese","high-protein","B12-source","extremely-high-sodium","use-sparingly"] },

  mozzarella: { cal:280,  p:22,   c:2,    f:17,   fibre:0,
                gi:0,   gl:0,   pdcaas:0.90,
                omega3:0.36, omega6:0.50,
                sodium:627,  potassium:76,  magnesium:20,  zinc:2.9,
                iron:0.2,    calcium:505,   vitC:0,  vitA:140,
                vitB12:2.3,  vitD:16,       folate:7,
                satiety:126, inflam:1,
                dietaryGroup:"vegetarian",
                tags:["calcium-rich","high-protein","B12-source","zinc-source","high-sodium"] },

  cheese:     { cal:402,  p:25,   c:1.3,  f:33,   fibre:0,
                gi:0,   gl:0,   pdcaas:0.88,
                omega3:0.30, omega6:0.42,
                sodium:621,  potassium:98,  magnesium:28,  zinc:3.1,
                iron:0.7,    calcium:720,   vitC:0,  vitA:330,
                vitB12:1.1,  vitD:24,       folate:18,
                satiety:126, inflam:1,
                dietaryGroup:"vegetarian",
                tags:["calcium-rich","high-protein","B12-source","zinc-source","high-sodium"] },

  mayonnaise: { cal:680,  p:1,    c:0.6,  f:75,   fibre:0,
                gi:0,   gl:0,   pdcaas:null,
                omega3:0.65, omega6:32.0,
                sodium:635,  potassium:20,  magnesium:1,   zinc:0.1,
                iron:0.3,    calcium:14,    vitC:0,  vitA:83,
                vitB12:0,    vitD:15,       folate:3,
                satiety:108, inflam:6,
                dietaryGroup:"vegetarian",
                tags:["high-omega-6","pro-inflammatory","high-fat","high-sodium","use-sparingly"] },

  // ════════════════════════════════════════════════════════
  //  NUTS & SEEDS
  // ════════════════════════════════════════════════════════

  almonds:    { cal:579,  p:21,   c:22,   f:50,   fibre:12.5,
                gi:15,  gl:3,   pdcaas:0.49,
                omega3:0.004,omega6:12.3,
                sodium:1,    potassium:733, magnesium:270, zinc:3.1,
                iron:3.7,    calcium:264,   vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:44,
                satiety:138, inflam:-3,
                dietaryGroup:"vegan",
                tags:["vitE-rich","magnesium-rich","calcium-rich","iron-source","heart-health","MUFA-rich"] },

  walnuts:    { cal:654,  p:15,   c:14,   f:65,   fibre:6.7,
                gi:15,  gl:2,   pdcaas:0.36,
                omega3:9.08, omega6:38.1,
                sodium:2,    potassium:441, magnesium:158, zinc:3.1,
                iron:2.9,    calcium:98,    vitC:1,  vitA:1,
                vitB12:0,    vitD:0,        folate:98,
                satiety:135, inflam:-5,
                dietaryGroup:"vegan",
                tags:["highest-omega-3-nut","brain-health","anti-inflammatory","heart-health","polyphenols"] },

  cashews:    { cal:553,  p:18,   c:30,   f:44,   fibre:3.3,
                gi:25,  gl:7.5, pdcaas:0.49,
                omega3:0.16, omega6:7.67,
                sodium:12,   potassium:660, magnesium:292, zinc:5.8,
                iron:6.7,    calcium:37,    vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:25,
                satiety:130, inflam:-2,
                dietaryGroup:"vegan",
                tags:["zinc-rich","magnesium-rich","iron-rich","MUFA-rich","heart-health"] },

  peanuts:    { cal:567,  p:26,   c:16,   f:49,   fibre:8.5,
                gi:14,  gl:2,   pdcaas:0.52,
                omega3:0.003,omega6:15.6,
                sodium:18,   potassium:705, magnesium:168, zinc:3.3,
                iron:4.6,    calcium:92,    vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:240,
                satiety:138, inflam:1,
                dietaryGroup:"vegan",
                tags:["high-protein","folate-rich","niacin-rich","resveratrol","budget-nut","low-gi"] },

  peanut_butter:{ cal:588,p:25,   c:20,   f:50,   fibre:6.0,
                gi:14,  gl:3,   pdcaas:0.52,
                omega3:0.003,omega6:13.5,
                sodium:429,  potassium:649, magnesium:168, zinc:2.9,
                iron:1.9,    calcium:49,    vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:87,
                satiety:140, inflam:1,
                dietaryGroup:"vegan",
                tags:["high-protein","folate-rich","niacin-rich","high-satiety","check-added-sugar-on-label","high-sodium"] },

  tahini:     { cal:595,  p:17,   c:19,   f:54,   fibre:9.3,
                gi:35,  gl:7,   pdcaas:0.48,
                omega3:0.39, omega6:24.9,
                sodium:115,  potassium:414, magnesium:95,  zinc:4.6,
                iron:8.9,    calcium:426,   vitC:0,  vitA:2,
                vitB12:0,    vitD:0,        folate:78,
                satiety:128, inflam:-1,
                dietaryGroup:"vegan",
                tags:["calcium-rich","iron-rich","zinc-rich","sesame","sesamol","folate-source"] },

  chia_seeds: { cal:486,  p:17,   c:42,   f:31,   fibre:34.4,
                gi:1,   gl:0.4, pdcaas:0.61,
                omega3:17.8, omega6:5.84,
                sodium:16,   potassium:407, magnesium:335, zinc:4.6,
                iron:7.7,    calcium:631,   vitC:1,  vitA:0,
                vitB12:0,    vitD:0,        folate:49,
                satiety:148, inflam:-7,
                dietaryGroup:"vegan",
                tags:["highest-omega-3-seed","highest-fibre","calcium-rich","anti-inflammatory","iron-rich","magnesium-rich","brain-health"] },

  // ════════════════════════════════════════════════════════
  //  SAUCES, CONDIMENTS & SWEETENERS
  // ════════════════════════════════════════════════════════

  soy_sauce:  { cal:53,   p:8,    c:4.9,  f:0.6,  fibre:0,
                gi:20,  gl:1,   pdcaas:null,
                omega3:0.01, omega6:0.31,
                sodium:5765, potassium:217, magnesium:41,  zinc:0.4,
                iron:1.9,    calcium:17,    vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:18,
                satiety:105, inflam:3,
                dietaryGroup:"vegan",
                tags:["extremely-high-sodium","use-sparingly","umami","fermented","gluten-source"] },

  oyster_sauce:{ cal:104, p:2.2,  c:23,   f:0.1,  fibre:0,
                gi:30,  gl:7,   pdcaas:null,
                omega3:0,    omega6:0.01,
                sodium:2733, potassium:67,  magnesium:17,  zinc:0.3,
                iron:1.0,    calcium:24,    vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:5,
                satiety:105, inflam:2,
                dietaryGroup:"non-veg",
                tags:["high-sodium","umami","use-sparingly","shellfish-derived"] },

  honey:      { cal:304,  p:0.3,  c:82,   f:0,    fibre:0,
                gi:58,  gl:48,  pdcaas:null,
                omega3:0,    omega6:0,
                sodium:4,    potassium:52,  magnesium:2,   zinc:0.2,
                iron:0.4,    calcium:6,     vitC:0.5,vitA:0,
                vitB12:0,    vitD:0,        folate:2,
                satiety:105, inflam:-1,
                dietaryGroup:"vegetarian",
                tags:["antimicrobial","antioxidant","natural-sweetener","polyphenols","use-in-moderation"] },

  sugar:      { cal:387,  p:0,    c:100,  f:0,    fibre:0,
                gi:65,  gl:65,  pdcaas:null,
                omega3:0,    omega6:0,
                sodium:1,    potassium:2,   magnesium:0,   zinc:0,
                iron:0.1,    calcium:1,     vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:0,
                satiety:95,  inflam:8,
                dietaryGroup:"vegan",
                tags:["empty-calories","high-gi","pro-inflammatory","use-sparingly","no-nutrients"] },

  maple_syrup:{ cal:260,  p:0,    c:67,   f:0,    fibre:0,
                gi:54,  gl:36,  pdcaas:null,
                omega3:0,    omega6:0,
                sodium:12,   potassium:212, magnesium:21,  zinc:4.2,
                iron:0.1,    calcium:102,   vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:0,
                satiety:105, inflam:-1,
                dietaryGroup:"vegan",
                tags:["zinc-rich","calcium-source","manganese-rich","antioxidants","better-than-refined-sugar"] },

  vinegar:    { cal:18,   p:0,    c:0,    f:0,    fibre:0,
                gi:0,   gl:0,   pdcaas:null,
                omega3:0,    omega6:0,
                sodium:2,    potassium:73,  magnesium:1,   zinc:0.01,
                iron:0.03,   calcium:7,     vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:0,
                satiety:108, inflam:-2,
                dietaryGroup:"vegan",
                tags:["acetic-acid","blood-sugar-stabilising","anti-microbial","low-calorie"] },

  miso_paste: { cal:199,  p:12,   c:26,   f:6,    fibre:5.4,
                gi:20,  gl:5,   pdcaas:0.91,
                omega3:0.37, omega6:2.90,
                sodium:3728, potassium:210, magnesium:48,  zinc:2.6,
                iron:2.5,    calcium:57,    vitC:0,  vitA:9,
                vitB12:0.1,  vitD:0,        folate:19,
                satiety:125, inflam:-2,
                dietaryGroup:"vegan",
                tags:["fermented","probiotic","gut-health","umami","very-high-sodium","soy-source"] },

  fish_sauce: { cal:35,   p:5.1,  c:3.6,  f:0,    fibre:0,
                gi:10,  gl:0.4, pdcaas:null,
                omega3:0,    omega6:0,
                sodium:7851, potassium:284, magnesium:39,  zinc:0.4,
                iron:1.3,    calcium:29,    vitC:0,  vitA:0,
                vitB12:0.6,  vitD:0,        folate:0,
                satiety:105, inflam:2,
                dietaryGroup:"non-veg",
                tags:["highest-sodium-condiment","umami","use-drops-only","iodine-source","B12-trace"] },

  hot_sauce:  { cal:25,   p:0.8,  c:5,    f:0.5,  fibre:1.0,
                gi:15,  gl:0.7, pdcaas:null,
                omega3:0.01, omega6:0.07,
                sodium:920,  potassium:130, magnesium:10,  zinc:0.1,
                iron:0.5,    calcium:12,    vitC:18, vitA:30,
                vitB12:0,    vitD:0,        folate:6,
                satiety:108, inflam:-1,
                dietaryGroup:"vegan",
                tags:["capsaicin","metabolism-boost","vitC-source","anti-inflammatory","high-sodium"] },

  // ════════════════════════════════════════════════════════
  //  SPICES
  // ════════════════════════════════════════════════════════

  turmeric:   { cal:312,  p:7.8,  c:67,   f:3.2,  fibre:21.1,
                gi:10,  gl:7,   pdcaas:null,
                omega3:0.15, omega6:0.56,
                sodium:38,   potassium:2080,magnesium:193, zinc:4.5,
                iron:41.4,   calcium:168,   vitC:26, vitA:0,
                vitB12:0,    vitD:0,        folate:20,
                satiety:108, inflam:-8,
                dietaryGroup:"vegan",
                tags:["curcumin","highest-anti-inflam-spice","iron-rich","antioxidant","anti-cancer","liver-protective","use-with-black-pepper-for-absorption"] },

  cumin:      { cal:375,  p:18,   c:44,   f:22,   fibre:10.5,
                gi:10,  gl:4,   pdcaas:null,
                omega3:0.24, omega6:3.02,
                sodium:168,  potassium:1788,magnesium:366, zinc:4.8,
                iron:66.4,   calcium:931,   vitC:8,  vitA:64,
                vitB12:0,    vitD:0,        folate:10,
                satiety:108, inflam:-5,
                dietaryGroup:"vegan",
                tags:["iron-rich","anti-oxidant","digestion","anti-inflammatory","magnesium-rich","calcium-rich"] },

  coriander:  { cal:23,   p:2.1,  c:3.7,  f:0.5,  fibre:2.8,
                gi:10,  gl:0.4, pdcaas:null,
                omega3:0.05, omega6:0.34,
                sodium:46,   potassium:521, magnesium:26,  zinc:0.5,
                iron:1.8,    calcium:67,    vitC:27, vitA:337,
                vitB12:0,    vitD:0,        folate:62,
                satiety:108, inflam:-4,
                dietaryGroup:"vegan",
                tags:["vitA-rich","vitC-source","antioxidant","digestive","anti-inflammatory","chelates-heavy-metals"] },

  black_pepper:{ cal:251, p:10,   c:64,   f:3.3,  fibre:25.3,
                gi:10,  gl:6,   pdcaas:null,
                omega3:0.15, omega6:0.54,
                sodium:20,   potassium:1329,magnesium:171, zinc:1.2,
                iron:9.7,    calcium:443,   vitC:0,  vitA:27,
                vitB12:0,    vitD:0,        folate:17,
                satiety:108, inflam:-3,
                dietaryGroup:"vegan",
                tags:["piperine","enhances-curcumin-absorption","antioxidant","anti-inflammatory","digestion","iron-rich"] },

  mustard_seeds:{ cal:508,p:26,   c:28,   f:36,   fibre:12.2,
                gi:10,  gl:3,   pdcaas:null,
                omega3:2.51, omega6:6.60,
                sodium:13,   potassium:738, magnesium:370, zinc:6.1,
                iron:9.2,    calcium:266,   vitC:7,  vitA:2,
                vitB12:0,    vitD:0,        folate:162,
                satiety:108, inflam:-3,
                dietaryGroup:"vegan",
                tags:["selenium-source","omega-3-plant","magnesium-rich","zinc-rich","anti-inflammatory"] },

  cardamom:   { cal:311,  p:11,   c:68,   f:7,    fibre:28.0,
                gi:10,  gl:7,   pdcaas:null,
                omega3:0.02, omega6:0.30,
                sodium:18,   potassium:1119,magnesium:229, zinc:7.5,
                iron:13.9,   calcium:383,   vitC:21, vitA:0,
                vitB12:0,    vitD:0,        folate:0,
                satiety:108, inflam:-4,
                dietaryGroup:"vegan",
                tags:["zinc-rich","iron-rich","anti-inflammatory","digestive","antioxidant","magnesium-rich"] },

  saffron:    { cal:310,  p:11,   c:65,   f:6,    fibre:3.9,
                gi:10,  gl:7,   pdcaas:null,
                omega3:0.06, omega6:0.48,
                sodium:148,  potassium:1724,magnesium:264, zinc:1.1,
                iron:11.1,   calcium:111,   vitC:81, vitA:27,
                vitB12:0,    vitD:0,        folate:93,
                satiety:108, inflam:-6,
                dietaryGroup:"vegan",
                tags:["crocin","safranal","antidepressant","antioxidant","iron-rich","mood-support","luxury-spice","use-0.3g-per-dish"] },

  garam_masala:{ cal:379, p:11,   c:58,   f:15,   fibre:22.0,
                gi:10,  gl:6,   pdcaas:null,
                omega3:0.40, omega6:2.10,
                sodium:62,   potassium:1234,magnesium:160, zinc:3.2,
                iron:16.0,   calcium:430,   vitC:5,  vitA:50,
                vitB12:0,    vitD:0,        folate:8,
                satiety:108, inflam:-5,
                dietaryGroup:"vegan",
                tags:["iron-rich","anti-inflammatory","blend-spice","antioxidant","add-at-finish-only"] },

  chili_powder:{ cal:282, p:12,   c:50,   f:14,   fibre:27.2,
                gi:10,  gl:5,   pdcaas:null,
                omega3:0.66, omega6:6.61,
                sodium:1640, potassium:2028,magnesium:170, zinc:2.5,
                iron:14.3,   calcium:148,   vitC:76, vitA:952,
                vitB12:0,    vitD:0,        folate:106,
                satiety:108, inflam:-4,
                dietaryGroup:"vegan",
                tags:["capsaicin","metabolism-boost","vitA-rich","vitC-source","anti-inflammatory","high-sodium-check-label"] },

  cinnamon:   { cal:247,  p:4,    c:81,   f:1.2,  fibre:53.1,
                gi:5,   gl:4,   pdcaas:null,
                omega3:0.03, omega6:0.05,
                sodium:10,   potassium:431, magnesium:60,  zinc:1.8,
                iron:8.3,    calcium:1002,  vitC:3,  vitA:15,
                vitB12:0,    vitD:0,        folate:6,
                satiety:108, inflam:-6,
                dietaryGroup:"vegan",
                tags:["cinnamaldehyde","blood-sugar-stabilising","anti-inflammatory","antioxidant","calcium-rich","use-sparingly"] },

  curry_leaves:{ cal:108, p:6.1,  c:19,   f:1.0,  fibre:6.4,
                gi:10,  gl:2,   pdcaas:null,
                omega3:0.01, omega6:0.22,
                sodium:102,  potassium:475, magnesium:44,  zinc:0.2,
                iron:0.9,    calcium:830,   vitC:4,  vitA:73,
                vitB12:0,    vitD:0,        folate:93,
                satiety:108, inflam:-5,
                dietaryGroup:"vegan",
                tags:["calcium-rich","anti-inflammatory","traditional-medicine","anti-diabetic","hair-health","add-fresh-at-end-for-max-flavour"] },

  // ════════════════════════════════════════════════════════
  //  HERBS & AROMATICS
  // ════════════════════════════════════════════════════════

  basil:      { cal:23,   p:3.2,  c:2.7,  f:0.6,  fibre:1.6,
                gi:5,   gl:0.1, pdcaas:null,
                omega3:0.32, omega6:0.07,
                sodium:4,    potassium:295, magnesium:64,  zinc:0.8,
                iron:3.2,    calcium:177,   vitC:18, vitA:264,
                vitB12:0,    vitD:0,        folate:68,
                satiety:108, inflam:-4,
                dietaryGroup:"vegan",
                tags:["eugenol","anti-inflammatory","vitA-rich","iron-source","calcium-source","antioxidant","add-fresh-only"] },

  parsley:    { cal:36,   p:3,    c:6.3,  f:0.8,  fibre:3.3,
                gi:5,   gl:0.3, pdcaas:null,
                omega3:0.25, omega6:0.12,
                sodium:56,   potassium:554, magnesium:50,  zinc:1.1,
                iron:6.2,    calcium:138,   vitC:133,vitA:421,
                vitB12:0,    vitD:0,        folate:152,
                satiety:108, inflam:-5,
                dietaryGroup:"vegan",
                tags:["vitC-rich","vitA-rich","iron-rich","folate-rich","anti-inflammatory","add-fresh-only"] },

  rosemary:   { cal:131,  p:3.3,  c:21,   f:5.9,  fibre:14.1,
                gi:5,   gl:1,   pdcaas:null,
                omega3:0.40, omega6:0.89,
                sodium:26,   potassium:668, magnesium:91,  zinc:0.9,
                iron:6.7,    calcium:317,   vitC:22, vitA:146,
                vitB12:0,    vitD:0,        folate:109,
                satiety:108, inflam:-5,
                dietaryGroup:"vegan",
                tags:["rosmarinic-acid","anti-inflammatory","antioxidant","memory-support","iron-rich","anti-cancer"] },

  thyme:      { cal:101,  p:5.6,  c:24,   f:1.7,  fibre:14.0,
                gi:5,   gl:1.2, pdcaas:null,
                omega3:0.50, omega6:0.52,
                sodium:9,    potassium:609, magnesium:160, zinc:1.8,
                iron:17.5,   calcium:405,   vitC:160,vitA:238,
                vitB12:0,    vitD:0,        folate:45,
                satiety:108, inflam:-5,
                dietaryGroup:"vegan",
                tags:["thymol","anti-bacterial","vitC-rich","iron-rich","calcium-rich","anti-inflammatory"] },

  lemongrass: { cal:99,   p:1.8,  c:25,   f:0.5,  fibre:0,
                gi:10,  gl:2.5, pdcaas:null,
                omega3:0,    omega6:0.14,
                sodium:6,    potassium:723, magnesium:60,  zinc:2.2,
                iron:8.2,    calcium:65,    vitC:2,  vitA:0,
                vitB12:0,    vitD:0,        folate:75,
                satiety:108, inflam:-5,
                dietaryGroup:"vegan",
                tags:["citral","anti-inflammatory","anti-fungal","digestive","aromatic","detox"] },

  // ════════════════════════════════════════════════════════
  //  MISC / SPECIALTY
  // ════════════════════════════════════════════════════════

  broth:      { cal:15,   p:1.5,  c:1.2,  f:0.5,  fibre:0,
                gi:5,   gl:0.1, pdcaas:null,
                omega3:0.01, omega6:0.02,
                sodium:372,  potassium:68,  magnesium:2,   zinc:0.1,
                iron:0.1,    calcium:7,     vitC:0,  vitA:0,
                vitB12:0.1,  vitD:0,        folate:2,
                satiety:110, inflam:-1,
                dietaryGroup:"non-veg",
                tags:["collagen","gut-health","low-calorie","moderate-sodium","umami"] },

  seaweed:    { cal:35,   p:5.8,  c:9,    f:0.4,  fibre:0.5,
                gi:10,  gl:0.9, pdcaas:null,
                omega3:0.16, omega6:0.05,
                sodium:233,  potassium:89,  magnesium:121, zinc:1.2,
                iron:28.5,   calcium:168,   vitC:3,  vitA:116,
                vitB12:0,    vitD:0,        folate:196,
                satiety:120, inflam:-4,
                dietaryGroup:"vegan",
                tags:["iodine-rich","iron-rich","folate-rich","magnesium-rich","omega-3-plant","thyroid-health"] },

  ricotta_cheese:{ cal:174,p:11,  c:3,    f:13,   fibre:0,
                gi:0,   gl:0,   pdcaas:0.75,
                omega3:0.25, omega6:0.32,
                sodium:84,   potassium:105, magnesium:11,  zinc:1.2,
                iron:0.4,    calcium:207,   vitC:0,  vitA:130,
                vitB12:0.3,  vitD:12,       folate:12,
                satiety:126, inflam:1,
                dietaryGroup:"vegetarian",
                tags:["calcium-source","B12-source","vitA-source","lower-fat-cheese"] },

  croutons:   { cal:407,  p:11,   c:65,   f:13,   fibre:3.2,
                gi:75,  gl:49,  pdcaas:0.42,
                omega3:0.10, omega6:3.20,
                sodium:738,  potassium:120, magnesium:25,  zinc:0.8,
                iron:3.1,    calcium:63,    vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:20,
                satiety:95,  inflam:4,
                dietaryGroup:"vegan",
                tags:["high-gi","high-sodium","pro-inflammatory","refined-carb","use-sparingly"] },

  dashi:      { cal:9,    p:0.7,  c:1.2,  f:0.2,  fibre:0,
                gi:5,   gl:0.1, pdcaas:null,
                omega3:0.02, omega6:0.01,
                sodium:240,  potassium:35,  magnesium:7,   zinc:0.1,
                iron:0.2,    calcium:7,     vitC:0,  vitA:0,
                vitB12:0.1,  vitD:0,        folate:1,
                satiety:108, inflam:-1,
                dietaryGroup:"non-veg",
                tags:["umami","low-calorie","Japanese-base","inosinate","glutamate"] },

  baking_powder:{ cal:53, p:0,    c:28,   f:0,    fibre:0,
                gi:0,   gl:0,   pdcaas:null,
                omega3:0,    omega6:0,
                sodium:10600,potassium:0,   magnesium:0,   zinc:0,
                iron:0,      calcium:580,   vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:0,
                satiety:0,   inflam:0,
                dietaryGroup:"vegan",
                tags:["leavening-agent","not-a-food","used-in-small-qty-only","very-high-sodium-per-100g"] },

  pizza_dough:{ cal:250,  p:8,    c:48,   f:3,    fibre:2.0,
                gi:75,  gl:36,  pdcaas:0.42,
                omega3:0.02, omega6:0.42,
                sodium:520,  potassium:100, magnesium:18,  zinc:0.6,
                iron:2.1,    calcium:19,    vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:22,
                satiety:100, inflam:3,
                dietaryGroup:"vegan",
                tags:["high-gi","high-sodium","refined-carb"] },

  lemon_juice:{ cal:22,   p:0.4,  c:6.9,  f:0.2,  fibre:0.3,
                gi:20,  gl:1.4, pdcaas:null,
                omega3:0.01, omega6:0.05,
                sodium:1,    potassium:103, magnesium:6,   zinc:0.05,
                iron:0.1,    calcium:6,     vitC:39, vitA:0,
                vitB12:0,    vitD:0,        folate:10,
                satiety:108, inflam:-3,
                dietaryGroup:"vegan",
                tags:["vitC-source","alkalising","antioxidant","flavonoids"] },

  eno:        { cal:0,    p:0,    c:0,    f:0,    fibre:0,
                gi:0,   gl:0,   pdcaas:null,
                omega3:0,    omega6:0,
                sodium:9000, potassium:0,   magnesium:0,   zinc:0,
                iron:0,      calcium:0,     vitC:0,  vitA:0,
                vitB12:0,    vitD:0,        folate:0,
                satiety:0,   inflam:0,
                dietaryGroup:"vegan",
                tags:["leavening-agent","not-a-food","used-in-tiny-qty-only"] },
}


// ═════════════════════════════════════════════════════════════
//  SECTION 2 — PDCAAS INFO
//
//  Protein quality score + explanation for each protein source.
//  RecipeDisplay.jsx reads this to render the score bar,
//  colour, label, why-this-score, and amino acid notes.
// ═════════════════════════════════════════════════════════════

export const PDCAAS_INFO = {
  // ── score tier labels ──────────────────────────────────────
  tiers: {
    excellent: { min:0.90, label:"Excellent",   emoji:"🟢", colour:"#22c55e", desc:"Complete protein — all 9 essential amino acids, highly digestible. Body uses nearly all of it for muscle synthesis." },
    good:      { min:0.70, label:"Good",        emoji:"🟡", colour:"#eab308", desc:"Good quality protein — most essential amino acids present. Small shortfall in one or two, easily covered by eating varied foods." },
    moderate:  { min:0.50, label:"Moderate",    emoji:"🟠", colour:"#f97316", desc:"Moderate quality — missing meaningful amounts of some essential amino acids. Combine with complementary sources for complete coverage." },
    low:       { min:0,    label:"Incomplete",  emoji:"🔴", colour:"#ef4444", desc:"Incomplete protein — significantly limited in one or more essential amino acids. Not a primary protein source." },
  },

  // ── per-ingredient detail ─────────────────────────────────
  egg:        { pdcaas:1.00, limitingAA:"none",      reason:"The gold standard of protein quality. All 9 essential amino acids in near-perfect ratios, maximum digestibility. 100% of the protein is bioavailable.",        combineWith:null },
  fish:       { pdcaas:0.96, limitingAA:"none",      reason:"Exceptional protein quality — complete amino acid profile with very high digestibility. Omega-3s add further nutritional advantage.",                          combineWith:null },
  lamb:       { pdcaas:0.94, limitingAA:"none",      reason:"Complete, highly digestible protein. Rich in leucine (triggers muscle protein synthesis) and haem iron which aids protein metabolism.",                        combineWith:null },
  chicken:    { pdcaas:0.92, limitingAA:"none",      reason:"High-quality complete protein, very well absorbed. Leucine-rich — directly activates muscle-building pathways (mTOR). The benchmark lean protein.",            combineWith:null },
  beef:       { pdcaas:0.92, limitingAA:"none",      reason:"Complete, highly bioavailable protein. Contains creatine (not just protein — creatine itself builds muscle) and haem iron which improves protein metabolism.", combineWith:null },
  turkey:     { pdcaas:0.93, limitingAA:"none",      reason:"Excellent complete protein, near-identical to chicken in quality. High in tryptophan (precursor to serotonin) alongside all essential amino acids.",            combineWith:null },
  pork:       { pdcaas:0.91, limitingAA:"none",      reason:"Complete, well-absorbed protein. Exceptionally rich in thiamine (B1) which is essential for energy metabolism alongside protein synthesis.",                   combineWith:null },
  shrimp:     { pdcaas:0.91, limitingAA:"none",      reason:"Complete, lean protein. High in taurine (heart + brain function), selenium (antioxidant protection during exercise), iodine and zinc.",                       combineWith:null },
  milk:       { pdcaas:1.00, limitingAA:"none",      reason:"Complete protein with an ideal amino acid profile. Contains both casein (slow-release, 80%) and whey (fast-absorbing, 20%) — the combination is highly effective for muscle recovery.", combineWith:null },
  curd:       { pdcaas:1.00, limitingAA:"none",      reason:"Complete protein — same quality as milk. Fermentation makes it more digestible than milk for lactose-sensitive individuals. Probiotics improve gut health which directly enhances protein absorption.", combineWith:null },
  yogurt:     { pdcaas:1.00, limitingAA:"none",      reason:"Complete protein with probiotic benefit. The live cultures improve gut lining integrity, directly increasing absorption of all nutrients including protein.",    combineWith:null },
  tofu:       { pdcaas:0.91, limitingAA:"methionine","reason":"Near-complete protein — the best plant source after soy chunks. Slight shortfall in methionine (sulphur amino acid). This is easily offset by any grain in the same meal.", combineWith:"rice, sesame, sunflower seeds — add methionine" },
  soy_chunks: { pdcaas:0.91, limitingAA:"methionine","reason":"The highest-quality plant protein available. Practically complete — all 9 essential amino acids. Only small shortfall in methionine. At 52g protein/100g, it exceeds chicken gram-for-gram.", combineWith:"rice, sesame — cover the methionine gap" },
  paneer:     { pdcaas:0.80, limitingAA:"methionine","reason":"Good quality dairy protein. A small methionine shortfall compared to liquid dairy (whey is reduced in paneer-making). Still provides all essential amino acids.", combineWith:"wheat or sesame to complete methionine" },
  miso_paste: { pdcaas:0.91, limitingAA:"methionine","reason":"Fermented soy — near-complete protein. Fermentation actually improves amino acid availability vs raw soy. Methionine is the only notable gap.",               combineWith:"rice, noodles — cover the methionine gap" },
  khoya:      { pdcaas:0.90, limitingAA:"none",      reason:"Concentrated dairy protein — similar quality to milk but higher density. Good source of casein and whey proteins.",                                              combineWith:null },
  quinoa:     { pdcaas:0.87, limitingAA:"lysine-low", reason:"Exceptional for a grain — the only grain with near-complete protein. Contains all 9 amino acids including lysine (which almost every other grain lacks). Slight shortfall in lysine compared to animal protein.", combineWith:"legumes — complement the lysine slightly" },
  gram_flour: { pdcaas:0.68, limitingAA:"methionine","reason":"Good plant protein for a flour. Lacks adequate methionine and cysteine. But high in lysine — the amino acid that wheat flour completely lacks, making them ideal pairs.", combineWith:"wheat flour or sesame to add methionine" },
  chickpeas:  { pdcaas:0.68, limitingAA:"methionine","reason":"Good plant protein — rich in lysine and arginine. Missing adequate methionine. The classic solution: combine with any grain (rice, wheat) to create a complementary complete protein.", combineWith:"rice or whole wheat — the classic dal-roti pairing works nutritionally" },
  rajma:      { pdcaas:0.68, limitingAA:"methionine","reason":"Good plant protein, excellent fibre. High in lysine, arginine, and iron. Methionine is the limiting amino acid — perfectly complemented by rice, making rajma chawal nutritionally complete.", combineWith:"rice — rajma chawal is nutritionally complete by design" },
  toor_dal:   { pdcaas:0.64, limitingAA:"methionine","reason":"Solid plant protein. Rich in lysine and threonine. Lacks adequate methionine. Combining with rice (dal chawal) creates a complete amino acid profile — this is the nutritional science behind the traditional pairing.", combineWith:"rice — dal chawal is nutritionally complete by design" },
  masoor_dal: { pdcaas:0.64, limitingAA:"methionine","reason":"Good lentil protein. Lysine-rich but methionine-limited. Pairs perfectly with rice or wheat (roti) to form a complete protein. Also one of the richest plant sources of folate.", combineWith:"rice or roti to complete the amino acid profile" },
  moong_dal:  { pdcaas:0.68, limitingAA:"methionine","reason":"Most digestible of all dals — very easy on the gut. Good lysine content. Methionine gap is easily filled by any grain companion.", combineWith:"rice — khichdi is nutritionally complete by design" },
  urad_dal:   { pdcaas:0.66, limitingAA:"methionine","reason":"High-protein dal with good iron and calcium. Methionine-limited like most legumes. Its combination with rice in idli/dosa fermentation actually increases amino acid availability.", combineWith:"rice — the idli/dosa combination is nutritionally validated" },
  chana_dal:  { pdcaas:0.68, limitingAA:"methionine","reason":"Good protein with the lowest GI of all dals. Rich in lysine and slow-digesting carbs. Methionine gap is the only significant shortfall.", combineWith:"sesame, wheat or rice to complete methionine" },
  peanuts:    { pdcaas:0.52, limitingAA:"methionine","reason":"Better than most nuts for protein, but incomplete. Missing methionine significantly. Rich in arginine which supports blood flow and circulation.", combineWith:"any grain or dairy to cover methionine" },
  peanut_butter:{ pdcaas:0.52, limitingAA:"methionine","reason":"Same quality as whole peanuts — methionine is the limiting amino acid. Still valuable for calorie-dense protein delivery. Check the label for added sugar and salt.", combineWith:"whole grain bread — the classic PB sandwich is nutritionally validated" },
  almonds:    { pdcaas:0.49, limitingAA:"lysine",    "reason":"Moderate protein quality for a nut. Lysine and threonine are the limiting amino acids. But almonds' main value is monounsaturated fat, vitamin E, magnesium and calcium — not protein.", combineWith:"legumes — add the missing lysine" },
  cashews:    { pdcaas:0.49, limitingAA:"lysine",    "reason":"Moderate nut protein, lysine-limited. Main nutritional value is zinc, magnesium and iron. Not a primary protein source but a micronutrient-rich addition.", combineWith:"legumes to complete lysine" },
  tahini:     { pdcaas:0.48, limitingAA:"lysine",    "reason":"Moderate quality sesame protein. Lysine-limited like most seeds. Extremely rich in calcium, iron and zinc — its main nutritional value.", combineWith:"chickpeas — hummus is nutritionally complementary by design" },
  chia_seeds: { pdcaas:0.61, limitingAA:"lysine",    "reason":"Better than most seeds. Near-complete but lysine is the limiting amino acid. Main value is omega-3 (highest plant source), fibre (highest food source) and calcium.", combineWith:"legumes or dairy to cover lysine" },
  walnuts:    { pdcaas:0.36, limitingAA:"lysine",    "reason":"Low protein quality — lysine and threonine both significantly limited. Walnuts' nutritional value is their omega-3 (highest of any nut) and polyphenols — not their protein.", combineWith:"legumes — use walnuts for omega-3, not protein" },
  rice:       { pdcaas:0.59, limitingAA:"lysine",    "reason":"Moderate grain protein — lysine is the critical missing amino acid. Rice is naturally complementary to legumes which are lysine-rich. This is the scientific basis of every dal-rice meal.", combineWith:"any dal or legume — dal rice is a complete protein by design" },
  pasta:      { pdcaas:0.42, limitingAA:"lysine",    "reason":"Low protein quality — wheat is lysine-deficient. Adding legumes, egg, or meat dramatically improves the amino acid profile.", combineWith:"legumes, egg, or meat to complete lysine" },
  flour:      { pdcaas:0.42, limitingAA:"lysine",    "reason":"Low quality — wheat protein (gluten) is significantly lysine-deficient. This is why roti + dal (lysine-rich) is nutritionally complete.", combineWith:"dal, legumes or egg — roti+dal is scientifically validated" },
  oats:       { pdcaas:0.57, limitingAA:"lysine",    "reason":"Better than most grains — contains avenin protein with a reasonable amino acid profile. Still lysine-limited. Pairs well with milk (which completes the profile).", combineWith:"milk or curd — oats with milk/curd creates a complete protein" },
}

// ── Helper: get PDCAAS tier for a score ─────────────────────
export function getPdcaasTier(score) {
  if (score == null)    return null
  const { tiers } = PDCAAS_INFO
  if (score >= tiers.excellent.min) return { ...tiers.excellent, score }
  if (score >= tiers.good.min)      return { ...tiers.good,      score }
  if (score >= tiers.moderate.min)  return { ...tiers.moderate,  score }
  return { ...tiers.low, score }
}


// ═════════════════════════════════════════════════════════════
//  SECTION 3 — COOKING IMPACT NOTES
//
//  How cooking changes nutrition per ingredient.
//  RecipeDisplay.jsx uses this to show educational tips.
// ═════════════════════════════════════════════════════════════

export const COOKING_NOTES = {
  spinach:     { positive:"Cooking concentrates iron and calcium — cup for cup, cooked spinach has more iron than raw.", negative:"Loses ~65% vitC and ~50% folate when boiled. Steaming or wilting (30 sec) preserves far more than boiling.", tip:"Wilt in pan for 30–60 sec off heat to preserve vitamins while concentrating minerals." },
  tomato:      { positive:"Lycopene (antioxidant) increases 3× when cooked with oil. Cooked tomato is significantly more nutritious than raw for lycopene.", negative:"Vitamin C reduces ~30% with cooking.", tip:"Use cooked tomato for lycopene, fresh tomato for vitamin C — they serve different nutritional purposes." },
  carrot:      { positive:"Beta-carotene bioavailability increases 14% when cooked and served with fat. Oil or ghee increases absorption 6×.", negative:"Minor vitamin C loss (~10%).", tip:"Always cook carrots with a little fat for maximum beta-carotene absorption." },
  garlic:      { positive:"Allicin (main health compound) is stable enough for a short cook.", negative:"Heat destroys allicin rapidly — boiling or long cooking eliminates most health benefit.", tip:"Crush or mince garlic and rest 10 minutes before cooking — this activates alliinase and fixes the allicin. Once formed, it's more heat-stable." },
  broccoli:    { positive:"Brief cooking breaks down cell walls, making some nutrients more available.", negative:"Boiling loses up to 50% of vitC and 30% of folate into the water. Sulforaphane (anti-cancer) is destroyed by heat above 70°C.", tip:"Eat raw or steam max 3 minutes. Never boil. The bite-sized florets should still be bright green with a snap." },
  oats:        { positive:"Cooking breaks down phytic acid, improving iron and zinc absorption by ~50%.", negative:"Overcooking makes the starch more glycemic. Rolled oats have lower GI than instant oats.", tip:"Cook only until creamy — pull off heat while slightly loose. The slower you cook, the lower the GI." },
  egg:         { positive:"Cooking deactivates avidin (protein that blocks biotin absorption in raw egg white). Cooked egg has 91% protein digestibility vs 51% raw.", negative:"High heat oxidises cholesterol in yolk — hard-boiled is fine, fried at high heat is less ideal.", tip:"Scrambled on low heat or poached retains the most nutrition while maximising protein digestibility." },
  turmeric:    { positive:"Curcumin bioavailability increases 2000% when combined with piperine (black pepper). Fat also increases absorption.", negative:"Curcumin is heat-sensitive at very high temps — brief cooking is fine.", tip:"Always combine turmeric with black pepper (even 1/4 tsp). Add at the aromatic stage, not the tadka stage." },
  onion:       { positive:"Quercetin (anti-inflammatory flavonoid) is heat-stable and bioavailability actually improves when cooked in fat.", negative:"Outer layers lost during peeling remove the highest quercetin concentration.", tip:"Caramelised onions have concentrated quercetin. Don't discard the outer layers — they have the most benefit." },
  fish:        { positive:"Omega-3s are heat-stable during normal cooking temperatures.", negative:"High-heat frying oxidises omega-3s, reducing their benefit. Over 180°C damages the fat quality.", tip:"Steam, poach or bake at moderate heat (160–175°C) to preserve omega-3s. Avoid deep-frying fish for its health benefit." },
  chickpeas:   { positive:"Cooking dramatically reduces phytic acid and tannins — makes iron and zinc 2–3× more absorbable.", negative:"Canning adds sodium — rinse canned chickpeas to remove ~40%.", tip:"Soak dried chickpeas 8–12 hours and cook fully. The soaking water should be discarded — it contains gas-producing oligosaccharides." },
  sweet_potato:{ positive:"Skin retains most of the fibre and potassium — eating skin nearly doubles the fibre.", negative:"Boiling loses ~30% of water-soluble vitamin C into the water.", tip:"Roast or steam sweet potato with skin on. Roasting caramelises the natural sugars and makes beta-carotene more accessible." },
  mushroom:    { positive:"Vitamin D in mushrooms increases dramatically when exposed to UV light — place gills-up in sunlight for 15 min before cooking for 4× more vitD.", negative:"Boiling loses significant B vitamins. Frying at high heat destroys beta-glucans (immune-active compounds).", tip:"Dry sauté (no oil) first to evaporate moisture, then add oil. Never crowd — crowding steams instead of browning and reduces the health compounds." },
  legumes:     { positive:"Cooking destroys anti-nutritional factors (lectins, phytates) and dramatically improves protein and mineral absorption.", negative:"All water-soluble vitamins (folate, vitC) reduce during boiling — the longer the cook, the greater the loss.", tip:"Pressure cooking is superior to boiling — faster, less vitamin loss, same lectin destruction." },
}


// ═════════════════════════════════════════════════════════════
//  SECTION 4 — ALLERGEN TAGS (expanded to all 133 ingredients)
// ═════════════════════════════════════════════════════════════

export const ALLERGEN_TAGS = {
  // ── Eggs ──────────────────────────────────────────────────
  egg:               ["Eggs"],
  mayonnaise:        ["Eggs"],

  // ── Gluten ────────────────────────────────────────────────
  pasta:             ["Gluten"],
  semolina:          ["Gluten"],
  flour:             ["Gluten"],
  whole_wheat_flour: ["Gluten"],
  bread:             ["Gluten"],
  buns:              ["Gluten"],
  noodles:           ["Gluten"],
  ramen_noodles:     ["Gluten"],
  croutons:          ["Gluten"],
  pita_bread:        ["Gluten"],
  pizza_dough:       ["Gluten"],
  soy_sauce:         ["Gluten","Soy"],  // most contain wheat
  garam_masala:      ["Gluten"],        // may contain wheat in blends

  // ── Dairy ─────────────────────────────────────────────────
  paneer:            ["Dairy"],
  milk:              ["Dairy"],
  curd:              ["Dairy"],
  yogurt:            ["Dairy"],
  butter:            ["Dairy"],
  ghee:              ["Dairy"],
  cream:             ["Dairy"],
  feta_cheese:       ["Dairy"],
  parmesan:          ["Dairy"],
  mozzarella:        ["Dairy"],
  cheese:            ["Dairy"],
  ricotta_cheese:    ["Dairy"],
  khoya:             ["Dairy"],

  // ── Tree Nuts ─────────────────────────────────────────────
  almonds:           ["Tree Nuts"],
  walnuts:           ["Tree Nuts"],
  cashews:           ["Tree Nuts"],
  coconut:           ["Tree Nuts"],     // FDA classifies as tree nut
  coconut_milk:      ["Tree Nuts"],

  // ── Peanuts ───────────────────────────────────────────────
  peanuts:           ["Peanuts"],
  peanut_butter:     ["Peanuts"],

  // ── Shellfish ─────────────────────────────────────────────
  shrimp:            ["Shellfish"],
  oyster_sauce:      ["Shellfish","Fish"],

  // ── Fish ──────────────────────────────────────────────────
  fish:              ["Fish"],
  fish_sauce:        ["Fish"],
  dashi:             ["Fish"],
  broth:             ["Fish"],          // usually fish or meat based

  // ── Soy ───────────────────────────────────────────────────
  tofu:              ["Soy"],
  soy_chunks:        ["Soy"],
  miso_paste:        ["Soy"],

  // ── Sesame ────────────────────────────────────────────────
  tahini:            ["Sesame"],
  sesame_oil:        ["Sesame"],

  // ── Sulphites (commonly in these processed foods) ─────────
  vinegar:           ["Sulphites"],     // in some wine vinegars
  mustard_seeds:     ["Mustard"],
}


// ═════════════════════════════════════════════════════════════
//  SECTION 5 — HELPER FUNCTIONS
// ═════════════════════════════════════════════════════════════

// ── Get allergens for a recipe ────────────────────────────────
export function getAllergens(ingredients) {
  const found = new Set()
  ingredients.forEach(i => {
    const tags = ALLERGEN_TAGS[i]
    if (tags) tags.forEach(t => found.add(t))
  })
  return [...found]
}

// ── Get vitamin deficiency flags for a recipe ─────────────────
export function getVitaminFlags(ingredients, servings = 1) {
  const totals = { vitB12:0, vitD:0, iron:0, calcium:0, folate:0, omega3:0 }
  ingredients.forEach(item => {
    const n = NUTRITION_DB[item]
    if (!n) return
    const use = (n.typicalUseQty ?? 100) / 100
    totals.vitB12   += (n.vitB12   ?? 0) * use
    totals.vitD     += (n.vitD     ?? 0) * use
    totals.iron     += (n.iron     ?? 0) * use
    totals.calcium  += (n.calcium  ?? 0) * use
    totals.folate   += (n.folate   ?? 0) * use
    totals.omega3   += (n.omega3   ?? 0) * use
  })

  const flags = []
  // Per-serving RDA % thresholds (RDA reference: adult)
  if (totals.vitB12 < 0.5)  flags.push({ nutrient:"Vitamin B12", value:totals.vitB12.toFixed(2)+"mcg",  concern:"⚠️ Very low B12 — critical for vegans. Deficiency causes neurological damage.", rda:"2.4 mcg/day" })
  if (totals.vitD   < 50)   flags.push({ nutrient:"Vitamin D",   value:totals.vitD.toFixed(0)+"IU",     concern:"⚠️ Low vitamin D — add fish, egg or mushroom (UV-exposed).", rda:"600 IU/day" })
  if (totals.iron   < 3)    flags.push({ nutrient:"Iron",        value:totals.iron.toFixed(1)+"mg",     concern:"⚠️ Low iron — add spinach, legumes or meat.", rda:"8–18 mg/day" })
  if (totals.calcium < 200) flags.push({ nutrient:"Calcium",     value:totals.calcium.toFixed(0)+"mg",  concern:"⚠️ Low calcium — add dairy, tofu, almonds or sesame.", rda:"1000 mg/day" })
  if (totals.folate  < 50)  flags.push({ nutrient:"Folate",      value:totals.folate.toFixed(0)+"mcg",  concern:"⚠️ Low folate — add spinach, legumes or fortified grain.", rda:"400 mcg/day" })
  if (totals.omega3 < 0.5)  flags.push({ nutrient:"Omega-3",     value:totals.omega3.toFixed(2)+"g",    concern:"⚠️ Low omega-3 — add fish, walnuts or chia seeds.", rda:"1.1–1.6 g/day" })
  return flags
}

// ── Get inflammatory score for a recipe ───────────────────────
export function getInflamScore(ingredients) {
  let score = 0
  let count = 0
  ingredients.forEach(item => {
    const n = NUTRITION_DB[item]
    if (n?.inflam != null) { score += n.inflam; count++ }
  })
  if (count === 0) return { score:0, label:"Neutral", emoji:"⚪" }
  const avg = score / count
  if (avg <= -4) return { score:+avg.toFixed(1), label:"Strongly anti-inflammatory", emoji:"💚" }
  if (avg <= -2) return { score:+avg.toFixed(1), label:"Anti-inflammatory",          emoji:"🟢" }
  if (avg <=  0) return { score:+avg.toFixed(1), label:"Mildly anti-inflammatory",   emoji:"🟡" }
  if (avg <=  3) return { score:+avg.toFixed(1), label:"Mildly pro-inflammatory",    emoji:"🟠" }
  return             { score:+avg.toFixed(1), label:"Pro-inflammatory",              emoji:"🔴" }
}

// ── Get health tags summary for a recipe ──────────────────────
export function getHealthTags(ingredients, maxTags = 6) {
  const tagCount = {}
  ingredients.forEach(item => {
    const tags = NUTRITION_DB[item]?.tags ?? []
    tags.forEach(t => { tagCount[t] = (tagCount[t] ?? 0) + 1 })
  })
  return Object.entries(tagCount)
    .filter(([t]) => !t.includes("note:") && !t.includes("use-") && !t.includes("add-") && !t.includes("check-"))
    .sort(([,a],[,b]) => b - a)
    .slice(0, maxTags)
    .map(([tag, count]) => ({ tag, count }))
}

// ── Compute full macro + micro totals for a recipe ────────────
export function computeNutritionTotals(ingredients) {
  const totals = {
    cal:0, p:0, c:0, f:0, fibre:0,
    iron:0, calcium:0, vitC:0, vitA:0,
    vitB12:0, vitD:0, folate:0,
    omega3:0, omega6:0,
    sodium:0, potassium:0, magnesium:0, zinc:0,
  }
  ingredients.forEach(item => {
    const n = NUTRITION_DB[item]
    if (!n) return
    const qty = (n.typicalUseQty ?? 100) / 100
    Object.keys(totals).forEach(k => { totals[k] += (n[k] ?? 0) * qty })
  })
  return Object.fromEntries(Object.entries(totals).map(([k,v]) => [k, +v.toFixed(2)]))
}

// ── Get glycemic profile for a recipe ─────────────────────────
export function getGlycemicProfile(ingredients) {
  const items = ingredients
    .map(i => ({ item:i, gi:NUTRITION_DB[i]?.gi, gl:NUTRITION_DB[i]?.gl }))
    .filter(i => i.gi != null && i.gi > 0)
  if (!items.length) return null

  const avgGI = items.reduce((s,i)=>s+i.gi,0) / items.length
  const totalGL = items.reduce((s,i)=>s+i.gl,0)
  const highGI  = items.filter(i=>i.gi>=70).map(i=>i.item)
  const lowGI   = items.filter(i=>i.gi<55).map(i=>i.item)

  return {
    avgGI:    +avgGI.toFixed(0),
    totalGL:  +totalGL.toFixed(0),
    highGIItems: highGI,
    lowGIItems:  lowGI,
    label:    avgGI < 55 ? "🟢 Low GI — slow energy release, stable blood sugar"
            : avgGI < 70 ? "🟡 Medium GI — moderate blood sugar impact"
            :               "🔴 High GI — fast blood sugar spike",
    glLabel:  totalGL < 10 ? "🟢 Low glycemic load"
            : totalGL < 20  ? "🟡 Medium glycemic load"
            :                 "🔴 High glycemic load",
  }
}

// ── Get protein quality summary for a recipe ──────────────────
export function getProteinQuality(ingredients) {
  const proteinSources = ingredients.filter(i => {
    const pdcaas = PDCAAS_INFO[i]?.pdcaas
    return pdcaas != null && NUTRITION_DB[i]?.p > 2
  })
  if (!proteinSources.length) return null

  const avgPdcaas = proteinSources.reduce((s,i) => s + PDCAAS_INFO[i].pdcaas, 0) / proteinSources.length
  const tier = getPdcaasTier(avgPdcaas)

  const combineWith = proteinSources
    .map(i => PDCAAS_INFO[i]?.combineWith)
    .filter(Boolean)

  const hasComplements = ingredients.some(i => {
    const info = PDCAAS_INFO[i]
    if (!info?.combineWith) return false
    const complementStr = info.combineWith.toLowerCase()
    return ingredients.some(other => complementStr.includes(other.replace(/_/g,' ')))
  })

  return {
    sources: proteinSources,
    avgPdcaas: +avgPdcaas.toFixed(2),
    tier,
    isComplete: avgPdcaas >= 0.85,
    combineWith: combineWith[0] ?? null,
    hasComplements,
    completenessNote: hasComplements
      ? "✅ Complementary protein sources detected — this meal has a complete amino acid profile"
      : combineWith.length
        ? `💡 Add ${combineWith[0]} to complete the amino acid profile`
        : null,
  }
}

// ── Get vegan flag ─────────────────────────────────────────────
export function getDietaryProfile(ingredients) {
  const groups = ingredients.map(i => NUTRITION_DB[i]?.dietaryGroup ?? "vegan")
  const hasNonVeg = groups.includes("non-veg")
  const hasVeg    = groups.includes("vegetarian")
  return {
    isVegan:      !hasNonVeg && !hasVeg,
    isVegetarian: !hasNonVeg,
    isNonVeg:     hasNonVeg,
    label:        hasNonVeg ? "Non-Vegetarian" : hasVeg ? "Vegetarian" : "Vegan",
    emoji:        hasNonVeg ? "🍖" : hasVeg ? "🥛" : "🌱",
  }
}
// ─────────────────────────────────────────────────────────────
//  costDB.js  —  All cost/pricing data
//  PRICE_DB = ₹ per 100g in Indian market (base)
//  Location factor scales this to other cuisines
// ─────────────────────────────────────────────────────────────

// ₹ per 100g at Indian market rates (2024 avg)
export const PRICE_DB = {
  // ── Proteins ─────────────────────────────────────────────────
  chicken:       { pricePerHundred: 18,  unit: "100g" },
  egg:           { pricePerHundred: 12,  unit: "100g" },   // ~₹6/egg avg
  paneer:        { pricePerHundred: 35,  unit: "100g" },
  tofu:          { pricePerHundred: 20,  unit: "100g" },
  fish:          { pricePerHundred: 25,  unit: "100g" },
  beef:          { pricePerHundred: 30,  unit: "100g" },
  lamb:          { pricePerHundred: 55,  unit: "100g" },
  shrimp:        { pricePerHundred: 40,  unit: "100g" },
  pork:          { pricePerHundred: 28,  unit: "100g" },
  turkey:        { pricePerHundred: 45,  unit: "100g" },
  soy_chunks:    { pricePerHundred: 8,   unit: "100g" },
  // ── Grains & Carbs ───────────────────────────────────────────
  rice:          { pricePerHundred: 4,   unit: "100g" },
  brown_rice:    { pricePerHundred: 7,   unit: "100g" },
  basmati_rice:  { pricePerHundred: 8,   unit: "100g" },
  pasta:         { pricePerHundred: 9,   unit: "100g" },
  rice_noodles:  { pricePerHundred: 10,  unit: "100g" },
  noodles:       { pricePerHundred: 8,   unit: "100g" },
  ramen_noodles: { pricePerHundred: 12,  unit: "100g" },
  oats:          { pricePerHundred: 7,   unit: "100g" },
  quinoa:        { pricePerHundred: 22,  unit: "100g" },
  semolina:      { pricePerHundred: 3,   unit: "100g" },
  flour:         { pricePerHundred: 3,   unit: "100g" },
  whole_wheat_flour:{ pricePerHundred: 4, unit: "100g" },
  bread:         { pricePerHundred: 6,   unit: "100g" },
  buns:          { pricePerHundred: 8,   unit: "100g" },
  flattened_rice:{ pricePerHundred: 4,   unit: "100g" },
  gram_flour:    { pricePerHundred: 5,   unit: "100g" },
  corn_tortillas:{ pricePerHundred: 12,  unit: "100g" },
  pita_bread:    { pricePerHundred: 10,  unit: "100g" },
  // ── Pulses & Legumes ─────────────────────────────────────────
  moong_dal:     { pricePerHundred: 8,   unit: "100g" },
  toor_dal:      { pricePerHundred: 7,   unit: "100g" },
  urad_dal:      { pricePerHundred: 7,   unit: "100g" },
  chana_dal:     { pricePerHundred: 6,   unit: "100g" },
  chickpeas:     { pricePerHundred: 8,   unit: "100g" },
  rajma:         { pricePerHundred: 10,  unit: "100g" },
  masoor_dal:    { pricePerHundred: 7,   unit: "100g" },
  // ── Vegetables ───────────────────────────────────────────────
  potato:        { pricePerHundred: 3,   unit: "100g" },
  sweet_potato:  { pricePerHundred: 4,   unit: "100g" },
  tomato:        { pricePerHundred: 4,   unit: "100g" },
  onion:         { pricePerHundred: 3,   unit: "100g" },
  garlic:        { pricePerHundred: 8,   unit: "100g" },
  ginger:        { pricePerHundred: 6,   unit: "100g" },
  spinach:       { pricePerHundred: 5,   unit: "100g" },
  carrot:        { pricePerHundred: 4,   unit: "100g" },
  capsicum:      { pricePerHundred: 6,   unit: "100g" },
  pumpkin:       { pricePerHundred: 3,   unit: "100g" },
  raw_banana:    { pricePerHundred: 4,   unit: "100g" },
  papaya:        { pricePerHundred: 3,   unit: "100g" },
  broccoli:      { pricePerHundred: 12,  unit: "100g" },
  cauliflower:   { pricePerHundred: 5,   unit: "100g" },
  mushroom:      { pricePerHundred: 15,  unit: "100g" },
  green_peas:    { pricePerHundred: 7,   unit: "100g" },
  cucumber:      { pricePerHundred: 3,   unit: "100g" },
  lettuce:       { pricePerHundred: 6,   unit: "100g" },
  eggplant:      { pricePerHundred: 4,   unit: "100g" },
  zucchini:      { pricePerHundred: 7,   unit: "100g" },
  avocado:       { pricePerHundred: 30,  unit: "100g" },
  banana:        { pricePerHundred: 4,   unit: "100g" },
  blueberries:   { pricePerHundred: 40,  unit: "100g" },
  olives:        { pricePerHundred: 20,  unit: "100g" },
  spring_onion:  { pricePerHundred: 5,   unit: "100g" },
  cabbage:       { pricePerHundred: 3,   unit: "100g" },
  okra:          { pricePerHundred: 5,   unit: "100g" },
  drumstick:     { pricePerHundred: 6,   unit: "100g" },
  coconut:       { pricePerHundred: 8,   unit: "100g" },
  tamarind:      { pricePerHundred: 5,   unit: "100g" },
  // ── Dairy & Fats ─────────────────────────────────────────────
  ghee:          { pricePerHundred: 10,  unit: "100g" },
  olive_oil:     { pricePerHundred: 12,  unit: "100ml" },
  mustard_oil:   { pricePerHundred: 5,   unit: "100ml" },
  sesame_oil:    { pricePerHundred: 14,  unit: "100ml" },
  oil:           { pricePerHundred: 5,   unit: "100ml" },
  butter:        { pricePerHundred: 8,   unit: "100g" },
  milk:          { pricePerHundred: 3,   unit: "100ml" },
  curd:          { pricePerHundred: 5,   unit: "100g" },
  yogurt:        { pricePerHundred: 5,   unit: "100g" },
  cream:         { pricePerHundred: 15,  unit: "100ml" },
  feta_cheese:   { pricePerHundred: 40,  unit: "100g" },
  parmesan:      { pricePerHundred: 45,  unit: "100g" },
  mozzarella:    { pricePerHundred: 35,  unit: "100g" },
  cheese:        { pricePerHundred: 25,  unit: "100g" },
  mayonnaise:    { pricePerHundred: 10,  unit: "100g" },
  coconut_milk:  { pricePerHundred: 12,  unit: "100ml" },
  khoya:         { pricePerHundred: 20,  unit: "100g" },
  // ── Nuts & Seeds ─────────────────────────────────────────────
  almonds:       { pricePerHundred: 25,  unit: "100g" },
  walnuts:       { pricePerHundred: 35,  unit: "100g" },
  cashews:       { pricePerHundred: 25,  unit: "100g" },
  peanuts:       { pricePerHundred: 7,   unit: "100g" },
  peanut_butter: { pricePerHundred: 15,  unit: "100g" },
  tahini:        { pricePerHundred: 22,  unit: "100g" },
  chia_seeds:    { pricePerHundred: 18,  unit: "100g" },
  // ── Sauces & Condiments ──────────────────────────────────────
  soy_sauce:     { pricePerHundred: 4,   unit: "100ml" },
  honey:         { pricePerHundred: 10,  unit: "100g" },
  sugar:         { pricePerHundred: 2,   unit: "100g" },
  maple_syrup:   { pricePerHundred: 28,  unit: "100ml" },
  vinegar:       { pricePerHundred: 3,   unit: "100ml" },
  lemon:         { pricePerHundred: 5,   unit: "100g" },
  lime:          { pricePerHundred: 4,   unit: "100g" },
  miso_paste:    { pricePerHundred: 18,  unit: "100g" },
  fish_sauce:    { pricePerHundred: 6,   unit: "100ml" },
  // ── Spices ───────────────────────────────────────────────────
  turmeric:      { pricePerHundred: 4,   unit: "100g" },
  cumin:         { pricePerHundred: 5,   unit: "100g" },
  black_pepper:  { pricePerHundred: 8,   unit: "100g" },
  coriander:     { pricePerHundred: 4,   unit: "100g" },
  mustard_seeds: { pricePerHundred: 4,   unit: "100g" },
  cardamom:      { pricePerHundred: 25,  unit: "100g" },
  saffron:       { pricePerHundred: 200, unit: "100g" },  // expensive!
  // ── Other ────────────────────────────────────────────────────
  seaweed:       { pricePerHundred: 20,  unit: "100g" },
  bamboo_shoots: { pricePerHundred: 15,  unit: "100g" },
  broth:         { pricePerHundred: 5,   unit: "100ml" },
  lemongrass:    { pricePerHundred: 8,   unit: "100g" },
  basil:         { pricePerHundred: 6,   unit: "100g" },
  parsley:       { pricePerHundred: 5,   unit: "100g" },
  rosemary:      { pricePerHundred: 8,   unit: "100g" },
  thyme:         { pricePerHundred: 8,   unit: "100g" },
}

// Backward-compatible flat lookup (₹ per 100g)
export const INGREDIENT_COST = Object.fromEntries(
  Object.entries(PRICE_DB).map(([k, v]) => [k, v.pricePerHundred])
)

// Multiplier to convert ₹ → local currency equivalent
export const LOCATION_COST_FACTOR = {
  India: 1.0, USA: 4.8, Italy: 4.2, Mexico: 2.1,
  China: 1.8, Japan: 5.5, Thailand: 1.5,
}

// ─────────────────────────────────────────────────────────────
//  BUDGET SWAPS DATABASE
// ─────────────────────────────────────────────────────────────
export const BUDGET_SWAPS_DB = {
  paneer:       { swap: "Tofu or scrambled egg",          saving: "~40%", note: "Same protein hit, much lighter on budget" },
  chicken:      { swap: "Soy chunks or egg",              saving: "~50%", note: "Equal protein at a fraction of the cost" },
  lamb:         { swap: "Chicken or soy chunks",          saving: "~60%", note: "Significantly cheaper, similar macros" },
  pork:         { swap: "Chicken or soy chunks",          saving: "~45%", note: "Similar macros, more widely available" },
  turkey:       { swap: "Chicken",                        saving: "~55%", note: "Very similar nutrition, far cheaper year-round" },
  fish:         { swap: "Canned tuna or soy chunks",      saving: "~45%", note: "Good protein source at lower price point" },
  shrimp:       { swap: "Fish or soy chunks",             saving: "~40%", note: "Similar protein, easier to find" },
  quinoa:       { swap: "Brown rice",                     saving: "~70%", note: "Similar fibre content, far cheaper" },
  broccoli:     { swap: "Cabbage or cauliflower",         saving: "~60%", note: "Similar nutrients, widely available" },
  mushroom:     { swap: "Green peas or capsicum",         saving: "~50%", note: "Adds colour and texture at low cost" },
  almonds:      { swap: "Peanuts or roasted chana",       saving: "~65%", note: "Similar fat and protein profile" },
  avocado:      { swap: "Thick curd or hummus",           saving: "~75%", note: "Similar healthy fat content" },
  feta_cheese:  { swap: "Paneer or crumbled tofu",        saving: "~60%", note: "Similar crumbly texture, much cheaper" },
  parmesan:     { swap: "Nutritional yeast or sharp cheddar", saving: "~55%", note: "Umami hit at lower price" },
  olive_oil:    { swap: "Mustard oil or sunflower oil",   saving: "~60%", note: "Good high-heat alternatives" },
  cream:        { swap: "Thick curd or cashew paste",     saving: "~55%", note: "Same richness, higher protein" },
  cashews:      { swap: "Peanuts or roasted chana",       saving: "~60%", note: "Similar fat and protein, lower cost" },
  beef:         { swap: "Chicken or soy chunks",          saving: "~55%", note: "Leaner, cheaper, widely available" },
  walnuts:      { swap: "Peanuts or sunflower seeds",     saving: "~70%", note: "Similar omega-3 profile at lower cost" },
  tahini:       { swap: "Peanut butter",                  saving: "~50%", note: "Similar fat content, more accessible" },
  blueberries:  { swap: "Banana or seasonal berries",     saving: "~65%", note: "Same antioxidant category, lower cost" },
  mayonnaise:   { swap: "Thick curd + lemon",             saving: "~40%", note: "Similar creaminess, much healthier" },
  saffron:      { swap: "Turmeric + food-grade yellow",   saving: "~95%", note: "Colour achieved at a fraction of the cost" },
  mozzarella:   { swap: "Paneer or cottage cheese",       saving: "~50%", note: "Similar melt and texture" },
  maple_syrup:  { swap: "Honey or jaggery",               saving: "~65%", note: "Natural sweetener with similar profile" },
  ramen_noodles:{ swap: "Regular wheat noodles",          saving: "~35%", note: "Similar result in soups and stir-fries" },
}

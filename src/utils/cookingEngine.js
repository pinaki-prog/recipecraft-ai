// ─────────────────────────────────────────────────────────────
//  cookingEngine.js  (v2 — Full Upgrade)
//
//  WHAT'S NEW vs v1:
//  1. Method detection — 9 distinct cooking flows (stir-fry,
//     braise, no-cook, one-pot dal, bake/roast, steam, deep-fry,
//     biryani-dum, standard sauté)
//  2. Skill-level adaptation — beginner/intermediate/advanced
//     language and detail in every step
//  3. Vegetable cook-order staggering — root → medium → delicate
//     → instant-wilt, each in its own timed sub-step
//  4. Sensory doneness cues — what to see/smell/feel, not just
//     how many minutes
//  5. Acid timing — when/why to add lemon, tamarind, vinegar
//     per cuisine
//  6. SUGGESTION_DB expanded to 80+ ingredients
//  7. Steps return { text, durationSeconds } objects so the
//     RecipeDisplay timer is accurate per-ingredient
//  8. India sub-regional profiles (North, South, East, West/Odia)
// ─────────────────────────────────────────────────────────────

// ═════════════════════════════════════════════════════════════
//  SECTION 1 — CUISINE PROFILES  (incl. India sub-regions)
// ═════════════════════════════════════════════════════════════

export const CUISINE_PROFILES = {

  // ── India sub-regions ──────────────────────────────────────
  "India-North": {
    fat: "ghee or mustard oil",
    tempering: ["cumin seeds", "dried red chili", "bay leaf", "cloves"],
    aromatics: ["onion", "ginger-garlic paste", "turmeric", "coriander powder", "garam masala"],
    acid: "lemon juice (off heat only)",
    acidTiming: "finish",
    herbs: ["fresh coriander", "kasuri methi"],
    cookStyle: "bhuno — long slow roast",
    technique:
      "Heat ghee until fragrant. Bloom whole spices until they splutter. Build the onion-tomato masala by cooking low-and-slow until oil visibly separates from the base — this is the bhuno step, the heart of North Indian cooking. Never rush it.",
    finish: "stir in kasuri methi, finish with garam masala, scatter fresh coriander and squeeze lemon off heat",
    subRegion: "North Indian",
  },

  "India-South": {
    fat: "coconut oil or sesame oil",
    tempering: ["mustard seeds", "curry leaves", "dried red chili", "urad dal (for tadka)"],
    aromatics: ["onion", "green chili", "turmeric", "asafoetida (hing)"],
    acid: "tamarind water or lemon",
    acidTiming: "simmer",
    herbs: ["fresh curry leaves", "fresh coriander"],
    cookStyle: "tadka + coconut base",
    technique:
      "Heat oil to smoking. Add mustard seeds and wait for them to pop completely before adding curry leaves — the pop-and-sizzle builds the entire flavour foundation. Coconut in any form goes in last third of cooking.",
    finish: "finish with a final drizzle of coconut oil and fresh curry leaves off heat",
    subRegion: "South Indian",
  },

  "India-East": {
    fat: "mustard oil (heated until it loses its raw sharpness)",
    tempering: ["panch phoron (five-spice blend)", "dried red chili", "bay leaf"],
    aromatics: ["onion", "ginger", "turmeric", "green chili"],
    acid: "tamarind or tomato",
    acidTiming: "early-simmer",
    herbs: ["fresh coriander", "nigella seeds as garnish"],
    cookStyle: "panch phoron tadka + slow build",
    technique:
      "Mustard oil must be heated past its smoking point to mellow its raw sharpness — watch for it to lighten slightly in colour. Panch phoron goes in next — all five seeds must bloom before anything else enters the pan.",
    finish: "finish with a spoon of ghee off heat and scatter fresh coriander",
    subRegion: "East Indian / Odia / Bengali",
  },

  "India-West": {
    fat: "groundnut oil or ghee",
    tempering: ["mustard seeds", "curry leaves", "asafoetida", "dried red chili"],
    aromatics: ["onion", "garlic", "ginger", "turmeric", "red chili powder"],
    acid: "tamarind or kokum",
    acidTiming: "simmer",
    herbs: ["fresh coriander", "fresh coconut (grated)"],
    cookStyle: "tempering + coconut-tamarind balance",
    technique:
      "The sweet-sour-spicy balance is the soul of West Indian cooking. Build a base with onion and spices, then bring in tamarind or kokum to create the characteristic tang. Coconut — fresh or dried — adds richness at the end.",
    finish: "garnish with fresh coconut, coriander and a squeeze of lime",
    subRegion: "West Indian / Maharashtrian / Gujarati",
  },

  // ── Generic India fallback ─────────────────────────────────
  India: {
    fat: "mustard oil or ghee",
    tempering: ["cumin seeds", "mustard seeds", "dried red chili", "curry leaves"],
    aromatics: ["ginger-garlic paste", "onion", "turmeric", "coriander powder"],
    acid: "lemon juice or tamarind",
    acidTiming: "finish",
    herbs: ["fresh coriander"],
    cookStyle: "bhuno (slow roast)",
    technique:
      "Heat fat until it just begins to smoke, bloom whole spices until they splutter, " +
      "then build the masala base low-and-slow before introducing main ingredients.",
    finish: "finish with garam masala, fresh coriander and a squeeze of lemon off heat",
    subRegion: null,
  },

  Italy: {
    fat: "extra-virgin olive oil",
    tempering: ["garlic slices", "fresh basil stem"],
    aromatics: ["shallots", "plum tomato", "white wine"],
    acid: "balsamic vinegar or lemon zest",
    acidTiming: "finish",
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
    acidTiming: "table",
    herbs: ["fresh cilantro"],
    cookStyle: "toasted-chili base",
    technique:
      "Dry-toast dried chilies and whole spices until deeply fragrant, rehydrate in hot water, " +
      "then blend into a smooth base before building the rest of the dish on top.",
    finish: "squeeze lime at the table — never cook the lime in, heat kills its bright aroma",
  },

  USA: {
    fat: "butter or neutral oil",
    tempering: ["garlic", "shallots"],
    aromatics: ["smoked paprika", "onion powder", "worcestershire sauce"],
    acid: "apple cider vinegar",
    acidTiming: "deglaze",
    herbs: ["flat-leaf parsley"],
    cookStyle: "cast-iron sear + baste",
    technique:
      "Get the pan screaming hot before anything goes in. High-heat sear builds a deep fond " +
      "— deglaze it, then baste continuously for maximum Maillard crust.",
    finish: "rest protein minimum 3 minutes off heat before slicing — cutting early loses all the juices",
  },

  China: {
    fat: "peanut oil or avocado oil (high smoke point)",
    tempering: ["ginger slices", "garlic", "scallion whites"],
    aromatics: ["shaoxing rice wine", "oyster sauce", "white pepper"],
    acid: "rice vinegar",
    acidTiming: "sauce-mix",
    herbs: ["scallion greens", "fresh cilantro"],
    cookStyle: "wok hei stir-fry",
    technique:
      "Wok must be at full blast — wok hei only comes from extreme heat. " +
      "Stir-fry in small batches, tossing constantly so nothing steams.",
    finish: "drizzle toasted sesame oil and scatter scallion greens off heat — never cook sesame oil",
  },

  Japan: {
    fat: "neutral oil with a few drops of sesame oil",
    tempering: ["thin ginger slices", "garlic (minimal)"],
    aromatics: ["mirin", "soy sauce", "dashi stock"],
    acid: "rice vinegar or ponzu",
    acidTiming: "dressing",
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
    acidTiming: "finish-offheat",
    herbs: ["thai basil", "fresh coriander"],
    cookStyle: "split-coconut-cream paste fry",
    technique:
      "Fry curry paste in thick coconut cream until the oil visibly splits and the paste " +
      "turns deeply fragrant — this is the flavour foundation everything else builds on.",
    finish: "balance fish sauce (salt), lime (acid), palm sugar (sweet) before serving — add lime off heat only",
  },
}

// ── India sub-region detector ──────────────────────────────────
const SOUTH_INDIAN_DISHES = new Set([
  "sambar","idli","dosa","upma","pongal","pesarattu","uttapam","appam",
  "avial","thoran","kootu","chettinad_chicken","fish_molee","kerala_prawn",
  "fish_curry","masala_dosa","vermicelli_upma","curd_rice","tamarind_rice",
  "lemon_rice","baingan_fry",
])
const EAST_INDIAN_DISHES = new Set([
  "dalma","doi_maach","mutton_do_pyaza",
])
const WEST_INDIAN_DISHES = new Set([
  "pav_bhaji","vada_pav","dhokla","sabudana_khichdi",
])

export function getCuisineProfile(location, dishKeys = []) {
  if (location === "India") {
    for (const d of dishKeys) {
      if (SOUTH_INDIAN_DISHES.has(d)) return CUISINE_PROFILES["India-South"]
      if (EAST_INDIAN_DISHES.has(d))  return CUISINE_PROFILES["India-East"]
      if (WEST_INDIAN_DISHES.has(d))  return CUISINE_PROFILES["India-West"]
    }
    return CUISINE_PROFILES["India-North"]
  }
  return CUISINE_PROFILES[location] ?? {
    fat: "oil of your choice",
    tempering: ["garlic", "onion"],
    aromatics: ["salt", "pepper"],
    acid: "lemon juice",
    acidTiming: "finish",
    herbs: ["fresh parsley"],
    cookStyle: "standard sauté",
    technique: "Cook ingredients over medium heat, building flavour in layers.",
    finish: "season to taste and garnish before serving",
  }
}

// ═════════════════════════════════════════════════════════════
//  SECTION 2 — INGREDIENT CLASSIFICATION SETS
// ═════════════════════════════════════════════════════════════

export const MEAT_SET   = new Set(["chicken","beef","lamb","fish","shrimp","pork","turkey"])
export const VEG_PROT   = new Set(["paneer","tofu","egg","soy_chunks"])
export const LEGUME_SET = new Set(["toor_dal","moong_dal","masoor_dal","urad_dal","chana_dal","chickpeas","rajma"])
export const GRAIN_SET  = new Set(["rice","brown_rice","quinoa","semolina","oats","pasta","rice_noodles","flour","whole_wheat_flour","flattened_rice","sago","gram_flour","noodles","ramen_noodles"])
export const VEG_SET    = new Set([
  "spinach","carrot","tomato","capsicum","pumpkin","raw_banana","papaya",
  "broccoli","cauliflower","mushroom","green_peas","potato","sweet_potato",
  "onion","garlic","ginger","avocado","banana","cabbage","cucumber","lettuce",
  "eggplant","zucchini","spring_onion","blueberries","okra","drumstick",
  "coconut","tamarind","lemon","lime","olives","bamboo_shoots",
])

// ── Vegetable cook-order tiers ─────────────────────────────────
// Tier 1 = Root/dense — need most time
// Tier 2 = Medium-firm
// Tier 3 = Delicate
// Tier 4 = Instant-wilt / never-cooked
const VEG_COOK_TIER = {
  // Tier 1 — Root & dense (8–12 min)
  potato:       { tier:1, time:"8–10 min", cue:"fork slides in with light resistance"  },
  sweet_potato: { tier:1, time:"8–10 min", cue:"fork slides in cleanly"                },
  carrot:       { tier:1, time:"6–8 min",  cue:"just tender with a slight bite"         },
  raw_banana:   { tier:1, time:"7–9 min",  cue:"colour deepens and flesh softens"       },
  pumpkin:      { tier:1, time:"6–8 min",  cue:"edges turn golden and flesh gives gently"},
  beetroot:     { tier:1, time:"10–12 min",cue:"tip of knife enters without force"      },
  drumstick:    { tier:1, time:"8–10 min", cue:"skin wrinkles slightly and flesh is tender"},

  // Tier 2 — Medium-firm (4–6 min)
  capsicum:     { tier:2, time:"3–4 min",  cue:"still holds shape but lost raw crunch"  },
  broccoli:     { tier:2, time:"3–4 min",  cue:"bright green and just tender — goes dull if overcooked"},
  cauliflower:  { tier:2, time:"4–5 min",  cue:"fork-tender, edges start to colour"     },
  eggplant:     { tier:2, time:"4–6 min",  cue:"flesh collapses and turns creamy inside"},
  zucchini:     { tier:2, time:"3–4 min",  cue:"edges golden, centre just cooked through"},
  okra:         { tier:2, time:"4–5 min",  cue:"bright green, slime has cooked off"     },
  cabbage:      { tier:2, time:"3–4 min",  cue:"wilted but still has texture"           },

  // Tier 3 — Delicate (2–3 min)
  mushroom:     { tier:3, time:"3–4 min",  cue:"golden brown, all moisture evaporated — do not crowd"},
  green_peas:   { tier:3, time:"2–3 min",  cue:"bright green and just tender"           },
  tomato:       { tier:3, time:"3–4 min",  cue:"skins just begin to break and release juice"},
  onion:        { tier:3, time:"5–8 min",  cue:"translucent, sweet smell, no raw sharpness"},
  bamboo_shoots:{ tier:3, time:"2–3 min",  cue:"heated through and lightly golden"      },
  spring_onion: { tier:3, time:"1–2 min",  cue:"bright green and just softened"         },

  // Tier 4 — Instant wilt / no heat (30–90 sec or raw)
  spinach:      { tier:4, time:"30–60 sec",cue:"just wilted — goes grey-green if over-cooked"},
  avocado:      { tier:4, time:"raw only", cue:"never cook — halve just before serving to prevent oxidation"},
  cucumber:     { tier:4, time:"raw only", cue:"never cook — add raw as a cooling contrast"},
  lettuce:      { tier:4, time:"raw only", cue:"always raw or added completely off heat" },
  banana:       { tier:4, time:"raw only", cue:"use raw or very briefly warmed"          },
  blueberries:  { tier:4, time:"raw only", cue:"raw or fold in off heat to preserve colour"},
  lemon:        { tier:4, time:"off-heat", cue:"always add off heat — heat destroys bright citrus aroma"},
  lime:         { tier:4, time:"off-heat", cue:"squeeze at the table or off heat only"  },
}

function groupVegByTier(veggies) {
  const t1=[],t2=[],t3=[],t4=[]
  veggies.forEach(v => {
    const info = VEG_COOK_TIER[v]
    if (!info)            t2.push(v)   // default to medium
    else if (info.tier===1) t1.push(v)
    else if (info.tier===2) t2.push(v)
    else if (info.tier===3) t3.push(v)
    else                    t4.push(v)
  })
  return { t1, t2, t3, t4 }
}

// ═════════════════════════════════════════════════════════════
//  SECTION 3 — SKILL LEVEL LANGUAGE
// ═════════════════════════════════════════════════════════════

function sk(skill, beginner, intermediate, advanced) {
  if (skill === "advanced")     return advanced     ?? intermediate
  if (skill === "intermediate") return intermediate ?? beginner
  return beginner
}

// Skill-aware instruction wrappers
const SKILL_KNIFE = {
  beginner:     "Cut everything into roughly equal-sized pieces — uniform size = even cooking.",
  intermediate: "Dice vegetables evenly. For proteins, cut against the grain for tenderness.",
  advanced:     "Brunoise aromatics for faster cook and deeper flavour. Score proteins if applicable.",
}
const SKILL_HEAT = {
  beginner:     "Use medium heat throughout unless the recipe says otherwise — it forgives mistakes.",
  intermediate: "Control heat actively — high for searing and stir-frying, medium-low for sauces.",
  advanced:     "Manage heat as a tool: start screaming hot for crust development, then modulate.",
}
const SKILL_TASTE = {
  beginner:     "Taste before serving and add a pinch of salt if it seems flat.",
  intermediate: "Season in layers — taste at every stage and adjust salt, acid and heat.",
  advanced:     "Balance the five tastes — salt (sodium), acid (lemon/vinegar), sweet, umami and heat. If something feels flat, it usually needs acid, not salt.",
}

// ═════════════════════════════════════════════════════════════
//  SECTION 4 — COOKING METHOD DETECTION
// ═════════════════════════════════════════════════════════════

const STIR_FRY_INDICATORS    = new Set(["soy_sauce","sesame_oil","noodles","rice_noodles","ramen_noodles","oyster_sauce","bamboo_shoots","spring_onion"])
const BRAISE_INDICATORS      = new Set(["lamb","beef","pork","turkey"])
const BAKE_INDICATORS        = new Set(["flour","whole_wheat_flour","baking_powder"])
const STEAM_INDICATORS       = new Set(["idli","dosa","semolina"])   // dish-level fallback
const NO_COOK_INDICATORS     = new Set(["avocado","cucumber","lettuce","blueberries"])
const BIRYANI_INDICATORS     = new Set(["saffron","ghee","curd"])    // combined with rice + meat
const DEEP_FRY_INDICATORS    = new Set(["gram_flour","falafel","vada"])

export function detectCookingMethod(lower, location) {
  const has = item => lower.includes(item)
  const hasAny  = set => lower.some(i => set.has(i))
  const hasMeat = lower.some(i => MEAT_SET.has(i))
  const hasGrain= lower.some(i => GRAIN_SET.has(i))
  const hasVeg  = lower.some(i => VEG_SET.has(i))
  const hasLeg  = lower.some(i => LEGUME_SET.has(i))

  // Biryani: rice + meat/veg + saffron/ghee/curd
  if ((has("rice") || has("brown_rice")) && (hasMeat || hasVeg) && hasAny(BIRYANI_INDICATORS)) return "biryani"

  // Bake / roast: flour-based or whole oven proteins
  if (hasAny(BAKE_INDICATORS)) return "bake"
  if ((has("turkey") || has("pork")) && !hasAny(STIR_FRY_INDICATORS)) return "roast"

  // Deep-fry: gram flour + veg protein
  if (has("gram_flour") && (hasVeg || hasAny(VEG_PROT))) return "deepfry"

  // Stir-fry: wok indicators or Chinese/Thai + meat + veg
  if (hasAny(STIR_FRY_INDICATORS) || location === "China" || (location === "Thailand" && hasMeat && hasVeg)) return "stirfry"

  // No-cook / raw assembly
  const hasCookItems = hasMeat || hasGrain || hasLeg || lower.some(i => !NO_COOK_INDICATORS.has(i) && VEG_SET.has(i) && VEG_COOK_TIER[i]?.tier < 4)
  if (!hasCookItems && hasAny(NO_COOK_INDICATORS)) return "nocook"

  // One-pot dal / legume dominant
  if (hasLeg && !hasMeat) return "onepotdal"

  // Braise: tough red meats + long cook
  if (lower.some(i => BRAISE_INDICATORS.has(i)) && !hasAny(STIR_FRY_INDICATORS)) return "braise"

  // Japanese umami-reduction
  if (location === "Japan") return "reduction"

  return "saute"  // default
}

// ═════════════════════════════════════════════════════════════
//  SECTION 5 — PROTEIN PREP & GRAIN PREP INSTRUCTIONS
// ═════════════════════════════════════════════════════════════

const PROTEIN_PREP = {
  chicken: (loc, skill) => {
    const marinades = {
      "India-North":"yogurt, turmeric, red chili powder, garam masala — minimum 20 min, overnight is better",
      "India-South":"yogurt, turmeric, curry leaves, black pepper, lemon — 20 min",
      "India-East": "mustard paste, turmeric, lemon — 15 min",
      Japan:        "soy sauce, mirin and sesame oil — 15 min, not longer or soy dominates",
      Thailand:     "fish sauce, lime juice, turmeric, lemongrass — 20 min",
      Mexico:       "lime, cumin, smoked paprika, garlic — 20 min",
      China:        "soy sauce, shaoxing wine, cornstarch — 15 min (cornstarch creates the velvety coating)",
      default:      "salt, pepper and a splash of oil — 15 min minimum",
    }
    const marinade = marinades[loc] ?? marinades.default
    return sk(skill,
      `Cut chicken into even pieces — equal size so everything cooks at the same time. Marinate in ${marinade}.`,
      `Cut chicken against the grain for maximum tenderness. Marinate in ${marinade}. Score thicker pieces so marinade penetrates.`,
      `Butterfly thick pieces for even cooking. Marinate in ${marinade}. Pat dry before searing — moisture is the enemy of a crust.`
    )
  },
  lamb: (loc, skill) => sk(skill,
    `Cut lamb into equal pieces. Marinate in yogurt and ginger-garlic paste${loc==="India-North"?", garam masala":""} for at least 30 min — the yogurt tenderises the meat.`,
    `Trim silver skin from lamb — it turns chewy. Marinate 1–4 hours for deeper flavour penetration.`,
    `French the bones for presentation. Bring to room temperature before cooking — cold meat seizes on contact with heat and cooks unevenly.`
  ),
  pork: (_, skill) => sk(skill,
    `Pat pork completely dry with kitchen paper. Season generously with salt and pepper on all sides.`,
    `Pat dry and season. Score fat cap in a crosshatch if present — helps render and crisps the surface.`,
    `Dry-brine overnight: salt pork uncovered in fridge. The salt draws moisture out then back in, seasoning deep into the meat.`
  ),
  turkey: (_, skill) => sk(skill,
    `Pat turkey dry. Rub with softened butter mixed with garlic and herbs under and over the skin.`,
    `Brine turkey 4–8 hours in salted water — prevents dryness. Pat completely dry before cooking.`,
    `Dry-brine 24–48 hours. Separate skin from breast meat and rub butter directly on flesh for maximum moisture and flavour.`
  ),
  beef: (_, skill) => sk(skill,
    `Pat beef completely dry — moisture is the enemy of a crust. Season generously with salt and pepper.`,
    `Salt beef 30+ min before cooking (dry brine) or right before the pan — never in between, it draws moisture without reabsorbing.`,
    `Age surface by leaving seasoned beef uncovered in the fridge overnight. Bring to room temperature before searing.`
  ),
  fish: (_, skill) => sk(skill,
    `Pat fish dry. Marinate in lemon juice, turmeric and salt for exactly 10 min — any longer and acid starts cooking the flesh.`,
    `Score fish skin to prevent curling in the pan. Season inside cavity if whole fish.`,
    `Cure briefly in salt 5–10 min to firm flesh and season evenly. Rinse and dry completely before cooking.`
  ),
  shrimp: (_, skill) => sk(skill,
    `Devein and peel shrimp. Toss with a pinch of turmeric and salt. Do not marinate longer than 5 min — acid starts cooking the protein.`,
    `Butterfly shrimp for more surface area and faster, more even cooking.`,
    `Brine shrimp briefly in salted water 10 min for snap and juiciness — pat completely dry before cooking.`
  ),
  paneer: (_, skill) => sk(skill,
    `Cut paneer into 2 cm cubes. Shallow-fry in a hot dry pan until golden on two sides — this stops it crumbling in the sauce.`,
    `Marinate fried paneer briefly in warm spiced water — it rehydrates and absorbs flavour without going soft.`,
    `Press paneer under a heavy weight 10 min to compact. Fry at high heat for a proper crust — it should resist when you push it.`
  ),
  tofu: (_, skill) => sk(skill,
    `Press tofu between two plates with a heavy weight for 20 min to expel water. Cut into cubes.`,
    `Freeze tofu overnight then thaw and press — the freeze-thaw creates a spongier, meatier texture that holds sauces better.`,
    `After pressing, marinate tofu 1–2 hours. Cornstarch coating before frying creates a significantly crispier crust.`
  ),
  egg: (_, skill) => sk(skill,
    `Crack eggs into a bowl. Beat with a fork until fully combined. Season with a pinch of salt.`,
    `For scrambled: beat vigorously and strain through a sieve for completely smooth, silky eggs.`,
    `For perfect scramble: low heat, constant fold, pull off heat while 20% still looks wet — carryover heat finishes them.`
  ),
  soy_chunks: (_, skill) => sk(skill,
    `Soak soy chunks in hot salted water for 10 min until fully rehydrated. Squeeze out excess water firmly — this step is critical.`,
    `After squeezing, marinate soy chunks in your chosen spice base for 15 min — they absorb flavour aggressively when dry.`,
    `Squeeze, marinate, then press again before cooking for maximum flavour concentration and texture.`
  ),
}

const GRAIN_PREP = {
  rice:              (skill) => sk(skill,"Wash rice 2–3 times until the water runs clear. Soak for 20 min — this shortens cook time and prevents breakage.","Rinse and soak. The starch you rinse off is what makes rice clump — keep rinsing until water is mostly clear.","Toast washed rice in dry ghee 2 min before adding water — it adds a nutty depth and separates grains perfectly."),
  brown_rice:        (skill) => sk(skill,"Wash brown rice and soak for 30 min minimum — the bran layer needs time to hydrate.","Soak 1–2 hours for even cooking. 1:2.5 water ratio.","Toast in butter or ghee after soaking. The bran makes it nutty — embrace it."),
  pasta:             (skill) => sk(skill,"Bring a large pot of water to a rolling boil. Salt it until it tastes like mild seawater — this is your only chance to season pasta itself.","Use at least 4L water per 400g pasta. The starch needs room.","Reserve 2 cups pasta water before draining — the starchy water is liquid gold for binding sauce to pasta."),
  rice_noodles:      (skill) => sk(skill,"Soak in room-temperature water for 20–30 min until pliable. Do NOT use boiling water — they turn to mush.","Soak until pliable but still have resistance — they finish in the pan.","Soak just to pliable, then finish in the wok with sauce — they soak up everything they touch."),
  semolina:          (skill) => sk(skill,"Dry-roast semolina in a dry pan, stirring constantly, until it smells nutty and turns light golden — about 3–4 min.","Roast until individual grains look slightly translucent.","Keep roasting until deeply golden for richer flavour in upma or halwa."),
  oats:              (skill) => sk(skill,"Measure oats. Warm your liquid in a separate pan — cold liquid makes oats gluey.","Rolled oats: 5 min. Steel-cut: 20–30 min. They are not interchangeable.","Toast dry oats in butter 2 min before adding liquid — unlocks a deep toasty flavour."),
  quinoa:            (skill) => sk(skill,"Rinse quinoa under cold water for 1 full minute to remove the bitter saponin coating — this step is not optional.","Rinse and toast in a dry pan until it pops and smells nutty, then add water.","Rinse, toast, use broth instead of water — layers of flavour in a simple grain."),
  flour:             (skill) => sk(skill,"Measure flour and sift. Mix all dry ingredients before adding wet — prevents lumps.","Scale flour by weight, not volume — a cup of flour can vary by 20% depending on packing.","Build gluten intentionally: mix minimally for tender cakes, knead fully for chewy bread."),
  whole_wheat_flour: (skill) => sk(skill,"Sift and measure. It absorbs more liquid than white flour — your dough will feel stiffer, this is normal.","Rest dough covered 20 min after mixing — the bran softens and makes rolling easier.","Autolyse: mix flour and water only, rest 30 min before adding salt/yeast — develops gluten structure without kneading."),
  noodles:           (skill) => sk(skill,"Boil until just under al dente. Reserve some cooking water. Rinse under cold water to stop cooking.","Under-cook by 1–2 min — they finish in the wok and absorb the sauce.","Never rinse if finishing in sauce — the surface starch makes sauce cling."),
  ramen_noodles:     (skill) => sk(skill,"Cook per packet — usually 2–3 min. Drain immediately and rinse.","Cook 1 min less than packet says if finishing in soup.","Make your own: flour, water, kansui (alkaline water). The alkaline makes them chewy and yellow."),
  oats:              (skill) => sk(skill,"Measure oats. Warm your liquid first — cold liquid makes oats gluey.","Rolled: 5 min. Steel-cut: 20–30 min. Don't swap them.","Toast dry oats in butter 2 min before liquid — deep toasty flavour."),
  flattened_rice:    (skill) => sk(skill,"Rinse flattened rice quickly — just 10–15 sec. Drain immediately. It absorbs water fast and goes mushy.","Rinse, drain, leave 2 min to fluff up before adding to the pan.","Rinse and let sit dry — the texture should be just barely moist, not soggy."),
}

const LEGUME_PREP = {
  toor_dal:   "Rinse toor dal until water runs clear. No soaking needed — it cooks without.",
  moong_dal:  "Rinse moong dal. No soaking needed — it cooks in 20 min.",
  masoor_dal: "Rinse masoor dal. No soaking needed — it dissolves naturally as it cooks.",
  urad_dal:   "Rinse urad dal 2–3 times. Soak 30 min if time allows for a softer result.",
  chana_dal:  "Rinse chana dal and soak 30 min minimum for even cooking.",
  chickpeas:  "DRIED: soak 8–12 hours — they will roughly double in size. CANNED: drain and rinse to cut sodium ~40%.",
  rajma:      "Soak rajma 8–12 hours minimum. CRITICAL: boil vigorously at full rolling boil for 10 min before any simmering — this destroys toxic lectins. Never skip this.",
}

const LEGUME_COOK = {
  toor_dal:   { text:"Pressure cook 3–4 whistles until completely mashable. Add salt only now — salt added before cooking hardens legumes.", durationSeconds:720 },
  moong_dal:  { text:"Pressure cook 2 whistles, or simmer covered 20–25 min. Should be completely soft.", durationSeconds:480 },
  masoor_dal: { text:"Simmer 15–20 min without a lid — it naturally dissolves and thickens. Watch for it turning from orange to golden.", durationSeconds:900 },
  urad_dal:   { text:"Pressure cook 3–4 whistles — outer skin should split slightly and flesh be completely soft.", durationSeconds:720 },
  chana_dal:  { text:"Pressure cook soaked dal 3 whistles — soft throughout but still holding its shape.", durationSeconds:660 },
  chickpeas:  { text:"Soaked dried: 4–5 whistles. Canned: 5 min to warm through only.", durationSeconds:900 },
  rajma:      { text:"After the vigorous 10-min boil, pressure cook 5–6 whistles until completely tender — press one between fingers to confirm.", durationSeconds:1200 },
}

// ═════════════════════════════════════════════════════════════
//  SECTION 6 — SENSORY DONENESS CUES DATABASE
// ═════════════════════════════════════════════════════════════

const DONENESS_CUES = {
  // ── Proteins ──────────────────────────────────────────────
  chicken:  "Done when juices run completely clear (not pink) when pierced at the thickest point, or when an instant-read thermometer reads 74°C. The flesh should spring back when pressed.",
  fish:     "Done when it flakes apart easily along its natural lines with gentle fork pressure. The flesh should shift from translucent to opaque throughout. Target 63°C internal.",
  beef:     "Rare: 52°C (red centre, warm). Medium: 60°C (pink throughout). Well: 71°C (grey throughout). Always rest — internal temp rises 3–5°C off heat.",
  lamb:     "Medium: 63°C — still slightly pink in centre. Well: 71°C. Test with finger: raw feels like the fleshy base of your thumb (relaxed), done feels firm.",
  pork:     "Safe at 63°C with a 3-min rest — it can be slightly pink inside at this temperature and is perfectly safe. 71°C = well done.",
  turkey:   "Breast safe at 73°C, thigh at 80°C. The thigh takes longer — always test both. Juices at the thigh joint must run completely clear.",
  shrimp:   "Done when they curl into a C shape and turn opaque pink. O-shape = overcooked and rubbery. Total cook time is usually under 3 min.",
  egg:      "Scrambled: pull off heat when 80% set — look wet and slightly loose. Residual pan heat finishes them perfectly in 30 sec. Fried: whites fully set, yolk film visible.",
  paneer:   "Done when both cut faces are golden-brown. The paneer should resist when you try to break it — it firms as it cooks.",
  tofu:     "Done when all sides are golden-brown and a crust has formed. Press gently — it should feel firm, not springy.",
  soy_chunks: "Done when fully heated through and sauce-coated. Taste one — it should be soft all the way through with no tough centre.",

  // ── Aromatics ─────────────────────────────────────────────
  onion:    "Raw sharp smell disappears completely. Colour goes from white → translucent → pale gold. Translucent = 5 min. Golden = 8–10 min. Brown = caramelised = 20+ min.",
  garlic:   "Pale golden and nutty-smelling — about 30 sec. The moment it smells toasted, pull it off or lower heat. Brown garlic = bitter, ruins the dish.",
  ginger:   "Raw sharpness mellows and it turns slightly golden at the edges — about 1–2 min. Should smell sweet and warm.",
  tomato:   "Skins just begin to break and the colour deepens to a rich red. Juices release and reduce — takes 4–6 min. Fully bhuno'd tomato = oil separates from the paste.",

  // ── Vegetables ────────────────────────────────────────────
  spinach:  "Wilted down to roughly a quarter of its raw volume and bright green — 30–60 sec. The moment it starts going grey-green, it's overcooked.",
  mushroom: "All moisture evaporated and edges golden-brown. Should smell deeply savoury, not steamy. If mushrooms are releasing water, the pan is too crowded or heat too low.",
  eggplant: "Flesh collapses and turns creamy, almost translucent inside. Skin may wrinkle. If it still feels firm when pressed, it needs more time.",
  potato:   "A thin knife or skewer slides in with zero resistance. When you pull it out, the potato should fall off without clinging.",

  // ── Sauces & gravies ──────────────────────────────────────
  sauce:    "Drag a spoon through the sauce — the line should hold for 3 seconds before the sauce flows back in. This is nappe — sauce that coats the back of a spoon.",
  dal:      "Press a cooked lentil between your thumb and finger — it should crush completely with no resistance or grainy texture.",
  tadka:    "Spices are bloomed when whole spices have puffed slightly, popped, or sizzled and the oil smells intensely fragrant — about 30–45 sec. Any longer risks bitterness.",
}

// ═════════════════════════════════════════════════════════════
//  SECTION 7 — METHOD-SPECIFIC STEP GENERATORS
// ═════════════════════════════════════════════════════════════

function capitalize(w) { return w ? w.charAt(0).toUpperCase() + w.slice(1).replace(/_/g," ") : "" }

// ── Shared acid timing helper ──────────────────────────────────
function getAcidStep(profile, lower, skill) {
  const hasLemon  = lower.includes("lemon")  || lower.includes("lemon_juice")
  const hasLime   = lower.includes("lime")
  const hasTamarind = lower.includes("tamarind")
  const hasVinegar= lower.includes("vinegar")
  if (!hasLemon && !hasLime && !hasTamarind && !hasVinegar) return null

  const timing = profile.acidTiming ?? "finish"
  const acidName = hasTamarind?"tamarind water":hasLime?"lime juice":hasVinegar?"vinegar":"lemon juice"

  switch (timing) {
    case "finish":
    case "finish-offheat":
      return { text: sk(skill,
        `ACID — Add ${acidName} off the heat just before serving. Heat destroys bright citrus — always add last.`,
        `ACID — ${capitalize(acidName)} goes in off heat. ${profile.acid} brightens the entire dish — don't skip this.`,
        `ACID — ${capitalize(acidName)} added off heat. Taste before adding — the dish may already have enough acid from tomatoes/yogurt. Balance, don't overwhelm.`
      ), durationSeconds: 0 }
    case "table":
      return { text: `ACID — Serve ${acidName} on the side for squeezing at the table — never cook the lime in, heat completely kills its aroma.`, durationSeconds: 0 }
    case "simmer":
      return { text: sk(skill,
        `ACID — Add ${acidName} now and let it cook into the sauce for 2–3 min to mellow.`,
        `ACID — Add ${acidName} during the simmer — it integrates into the base and rounds the flavour.`,
        `ACID — Add ${acidName} mid-simmer. Tamarind especially benefits from cooking — raw tamarind has a harsh edge.`
      ), durationSeconds: 180 }
    case "deglaze":
      return { text: `ACID — Add ${acidName} now to deglaze the pan. Scrape up all the golden fond from the bottom — this is concentrated flavour.`, durationSeconds: 60 }
    default:
      return { text: `ACID — Add ${acidName} and stir in. ${profile.acid}.`, durationSeconds: 30 }
  }
}

// ── Vegetable stagger steps ────────────────────────────────────
function buildVegSteps(veggies, skill) {
  const { t1, t2, t3, t4 } = groupVegByTier(veggies)
  const steps = []

  if (t1.length) {
    const cues = t1.map(v => VEG_COOK_TIER[v]?.cue ?? "tender when pierced").join("; ")
    steps.push({ text: sk(skill,
      `VEGETABLES (dense) — Add ${t1.map(capitalize).join(", ")} first. These take longest — cook ${VEG_COOK_TIER[t1[0]]?.time ?? "8–10 min"}. Stir occasionally.`,
      `VEGETABLES (root/dense) — Add ${t1.map(capitalize).join(", ")}. Doneness: ${cues}. Don't rush — dense veg that's still raw in the centre ruins a dish.`,
      `VEGETABLES (tier 1) — ${t1.map(capitalize).join(", ")}. ${cues}. Use the doneness cue, not the clock — sizes vary.`
    ), durationSeconds: 540 })
  }
  if (t2.length) {
    const cues = t2.map(v => VEG_COOK_TIER[v]?.cue ?? "tender with slight bite").join("; ")
    steps.push({ text: sk(skill,
      `VEGETABLES (medium) — Add ${t2.map(capitalize).join(", ")} now. Cook ${VEG_COOK_TIER[t2[0]]?.time ?? "4–5 min"} — they should still hold their shape.`,
      `VEGETABLES (medium) — Add ${t2.map(capitalize).join(", ")}. Doneness cue: ${cues}.`,
      `VEGETABLES (tier 2) — ${t2.map(capitalize).join(", ")}. ${cues}. Sequence matters — don't rush previous tier.`
    ), durationSeconds: 300 })
  }
  if (t3.length) {
    const cues = t3.map(v => VEG_COOK_TIER[v]?.cue ?? "2–3 min").join("; ")
    steps.push({ text: sk(skill,
      `VEGETABLES (delicate) — Add ${t3.map(capitalize).join(", ")} now. These only need ${VEG_COOK_TIER[t3[0]]?.time ?? "2–3 min"}.`,
      `VEGETABLES (delicate) — Add ${t3.map(capitalize).join(", ")} last. ${cues}. Don't walk away — delicate veg overcooks fast.`,
      `VEGETABLES (tier 3) — ${t3.map(capitalize).join(", ")}. ${cues}. Taste one to check before moving on.`
    ), durationSeconds: 180 })
  }
  if (t4.length) {
    const cookedT4 = t4.filter(v => VEG_COOK_TIER[v]?.time !== "raw only")
    const rawT4    = t4.filter(v => VEG_COOK_TIER[v]?.time === "raw only")
    if (cookedT4.length)
      steps.push({ text: sk(skill,
        `DELICATE — Add ${cookedT4.map(capitalize).join(", ")} off heat. Residual heat is enough.`,
        `INSTANT WILT — ${cookedT4.map(capitalize).join(", ")} go in last 30–60 sec or completely off heat.`,
        `INSTANT WILT — ${cookedT4.map(capitalize).join(", ")}. ${cookedT4.map(v=>VEG_COOK_TIER[v]?.cue).filter(Boolean).join(". ")}`
      ), durationSeconds: 45 })
    if (rawT4.length)
      steps.push({ text: `RAW GARNISH — ${rawT4.map(capitalize).join(", ")} should never be cooked. Add raw just before serving. ${rawT4.map(v=>VEG_COOK_TIER[v]?.cue).filter(Boolean).join(". ")}`, durationSeconds: 0 })
  }
  return steps
}

// ── Plating step ──────────────────────────────────────────────
function buildPlateStep(proteins, grains, legumes, veggies, goal, skill) {
  const prot = proteins[0] ? capitalize(proteins[0]) : legumes[0] ? capitalize(legumes[0]) : "the main"
  const carb = grains[0]   ? capitalize(grains[0])   : legumes[0] ? capitalize(legumes[0]) : "carbs"
  const veg  = veggies[0]  ? capitalize(veggies[0])  : "vegetables"
  const base  = goal==="muscle_gain"
    ? `Plate ${prot} as the centrepiece with a generous portion. Add ${carb} and ${veg}. This is a growth plate — it should feel substantial.`
    : goal==="weight_loss"
    ? `Half-plate ${veg}, quarter ${prot}, quarter ${carb}. The visual ratio keeps portions honest without feeling restrictive.`
    : `Plate in balanced thirds: ${prot}, ${carb}, ${veg}.`
  const skillNote = sk(skill,
    " Garnish with a fresh herb.",
    " Sauce goes beside the protein, not over it — keeps the crust intact.",
    " Sauce under the protein, protein on top — professional plating. Wipe the plate rim clean."
  )
  return { text: `PLATE — ${base}${skillNote}`, durationSeconds: 0 }
}

// ─────────────────────────────────────────────────────────────
//  METHOD STEP BUILDERS
// ─────────────────────────────────────────────────────────────

function buildSauteSteps({ lower, goal, spice, location, skill, profile, proteins, grains, legumes, veggies, hasMeat, hasVegProt, hasGrain, hasLegume, hasVeg }) {
  const steps = []

  // PREP
  const prepParts = []
  grains.forEach(g  => { if (GRAIN_PREP[g])  prepParts.push(GRAIN_PREP[g](skill))  })
  legumes.forEach(l => { if (LEGUME_PREP[l]) prepParts.push(LEGUME_PREP[l]) })
  const protKey = hasMeat ? proteins.filter(p=>MEAT_SET.has(p))[0] : hasVegProt ? proteins.filter(p=>VEG_PROT.has(p))[0] : null
  if (protKey && PROTEIN_PREP[protKey]) prepParts.push(PROTEIN_PREP[protKey](location, skill))
  if (!prepParts.length) prepParts.push(sk(skill,
    "Wash, peel and cut all vegetables into roughly equal pieces.",
    SKILL_KNIFE.intermediate,
    SKILL_KNIFE.advanced
  ))
  steps.push({ text:`PREP — ${prepParts.join(" ")}`, durationSeconds:600 })

  // BLOOM
  const bloomMap = {
    "India-North": (s,p)=>s==="hot"?`Heat ${p.fat} until it just begins to smoke. Add ${p.tempering.join(", ")} — increase chili by 50%. ${DONENESS_CUES.tadka}`
                         :s==="mild"?`Warm ${p.fat} on medium. Add ${p.tempering.slice(0,2).join(" and ")} only — sizzle gently 30 sec.`
                         :`Heat ${p.fat} until shimmering. Add ${p.tempering.join(", ")} — cook until they splutter (~45 sec). ${DONENESS_CUES.tadka}`,
    "India-South": (s,p)=>`Heat ${p.fat} until smoking. Add mustard seeds and wait for the pop — full pop before anything else enters the pan. Then add curry leaves (they will spit — step back). ${DONENESS_CUES.tadka}`,
    "India-East":  (s,p)=>`Heat ${p.fat} past smoking point until it lightens in colour — this mellows mustard oil's raw sharpness. Add panch phoron and wait for all five seeds to bloom and pop.`,
    "India-West":  (s,p)=>`Heat ${p.fat}. Add mustard seeds — wait for the pop. Add curry leaves and asafoetida. The hing should sizzle instantly. ${DONENESS_CUES.tadka}`,
    India:         (s,p)=>`Heat ${p.fat} until shimmering. Add ${p.tempering.join(", ")} — cook until they splutter (~45 sec). ${DONENESS_CUES.tadka}`,
    Italy:         (_,p)=>`Warm ${p.fat} on medium-low. Add ${p.tempering.join(" and ")}. ${DONENESS_CUES.garlic} Garlic turns pale gold — NOT brown.`,
    Mexico:        (_,p)=>`Heat ${p.fat}. Add ${p.tempering.join(", ")} and toast 60 sec until deeply fragrant.`,
    USA:           (_,p)=>`Get pan ${sk(skill,"very hot","screaming hot","screaming hot")} before adding ${p.fat}. Add ${p.tempering.join(" and ")} — it should sizzle immediately.`,
    China:         (_,p)=>`Wok at maximum heat before adding ${p.fat}. Add ${p.tempering.join(", ")} — toss 15–20 sec. ${sk(skill,"","Wok hei only comes from extreme heat — medium is not enough.","Wok hei requires a flame large enough to lick the sides of the wok.")}`,
    Japan:         (_,p)=>`Warm ${p.fat} on medium. Add ${p.tempering.join(" and ")} — cook gently 1 min. Restraint is everything in Japanese cooking.`,
    Thailand:      (_,p)=>`Fry curry paste in ${p.fat} over medium-high until the oil visibly splits — you will literally see the oil pooling around the edges of the paste. This is the flavour foundation.`,
  }
  const bloomFn   = bloomMap[location]
  const bloomText = bloomFn ? bloomFn(spice, profile) : `Heat ${profile.fat} over medium-high. Add ${profile.tempering.join(", ")} until fragrant.`
  steps.push({ text:`FAT & BLOOM — ${bloomText}`, durationSeconds:60 })

  // AROMATICS
  const skipAromatics = !hasMeat && !hasVegProt && !hasVeg && hasGrain && !hasLegume
  if (!skipAromatics) {
    const aroText = sk(skill,
      `AROMATICS — Add ${profile.aromatics.join(", ")} and stir for 3–4 min.`,
      `AROMATICS — Add ${profile.aromatics.join(", ")}. ${DONENESS_CUES.onion} Cook until the base looks glossy, ~3–4 min.`,
      `AROMATICS — Add ${profile.aromatics.join(", ")} in sequence: dense aromatics first (onion 5–8 min), then garlic and ginger (30–60 sec), then ground spices (30 sec). ${DONENESS_CUES.garlic}`
    )
    steps.push({ text: aroText, durationSeconds:240 })
  }

  // PROTEIN
  if (hasMeat || hasVegProt) {
    const protNames = proteins.map(capitalize)
    const tn = proteins[0]==="chicken"?" — target 74°C":proteins[0]==="fish"?" — target 63°C":proteins[0]==="beef"?" — target 60°C medium":""
    const cue = DONENESS_CUES[proteins[0]] ?? ""
    const protText = sk(skill,
      `PROTEIN — Add ${protNames.join(", ")} and cook through${tn}.`,
      `PROTEIN — Add ${protNames.join(", ")}. Sear over medium-high until golden (4–6 min). ${cue}`,
      `PROTEIN — Add ${protNames.join(", ")}. ${goal==="muscle_gain"?"Cook to exact doneness — no more.":goal==="weight_loss"?"Minimal oil, drain excess fat after searing.":"Build a proper fond — don't move protein for first 2 min."} ${cue}`
    )
    steps.push({ text:protText, durationSeconds: hasMeat?420:240 })
  } else if (hasLegume) {
    const lKey = legumes[0]
    const lc = LEGUME_COOK[lKey] ?? { text:`Cook ${capitalize(lKey)} until completely soft.`, durationSeconds:600 }
    steps.push({ text:`COOK — ${lc.text}`, durationSeconds: lc.durationSeconds })
  } else if (hasGrain) {
    const gc = GRAIN_COOK_TEXT[grains[0]]
    if (gc) steps.push({ text:`COOK — ${gc.text}`, durationSeconds: gc.durationSeconds })
  }

  // VEG (staggered)
  if (hasVeg) buildVegSteps(veggies, skill).forEach(s => steps.push(s))

  // SIMMER
  if (hasMeat || hasVegProt) {
    const simmerText = sk(skill,
      `SIMMER — Lower heat, cover, cook ${hasMeat?"10–15 min":"5–8 min"}. Taste and add salt if needed.`,
      `SIMMER — Cover and simmer ${hasMeat?"10–15 min":"5–8 min"}. ${DONENESS_CUES.sauce}`,
      `SIMMER — Reduce without lid for a more concentrated sauce, or cover for a gravy. ${DONENESS_CUES.sauce} Adjust seasoning — salt, ${profile.acid}.`
    )
    steps.push({ text:simmerText, durationSeconds: hasMeat?720:420 })
  } else if (hasLegume && hasVeg) {
    steps.push({ text:`COMBINE — Add cooked dal to the vegetable base. Simmer uncovered 5 min so flavours marry. ${DONENESS_CUES.dal}`, durationSeconds:300 })
  }

  // ACID
  const acidStep = getAcidStep(profile, lower, skill)
  if (acidStep && (profile.acidTiming==="finish"||profile.acidTiming==="finish-offheat")) steps.push(acidStep)

  // SKILL taste note
  steps.push({ text:`SEASON — ${SKILL_TASTE[skill]??"Taste and adjust salt and acid before serving."}`, durationSeconds:0 })

  // FINISH
  steps.push({ text:`FINISH — ${capitalize(profile.finish)}.`, durationSeconds:60 })

  // PLATE
  steps.push(buildPlateStep(proteins, grains, legumes, veggies, goal, skill))

  return steps
}

function buildStirFrySteps({ lower, goal, spice, location, skill, profile, proteins, grains, legumes, veggies, hasMeat, hasVegProt, hasGrain, hasVeg }) {
  const steps = []

  steps.push({ text: sk(skill,
    `PREP — Cut all ingredients before the wok goes on — stir-frying moves fast. ${GRAIN_PREP["rice_noodles"]?.(skill) ?? ""}`,
    `PREP — ${SKILL_KNIFE.intermediate} Mix your sauce separately before cooking: soy, rice wine, cornstarch if using. Everything must be ready.`,
    `PREP — Mise en place is non-negotiable in wok cooking. Velveting (cornstarch + egg white on proteins) creates the silky restaurant texture. Have cold water ready in case wok gets too hot.`
  ), durationSeconds:600 })

  steps.push({ text: sk(skill,
    `WOK PREP — Heat the wok or your largest pan until it just begins to smoke. Add ${profile.fat}.`,
    `WOK PREP — Wok at maximum heat — it should smoke before oil goes in. Add ${profile.fat}. Add ${profile.tempering.join(", ")} — toss 15 sec.`,
    `WOK PREP — Wok hei requires extreme heat. If home hob, use the largest burner at full blast. Pre-heat wok 3 min. Smoking = ready. ${DONENESS_CUES.tadka}`
  ), durationSeconds:60 })

  if (hasMeat || hasVegProt) {
    const cue = DONENESS_CUES[proteins[0]] ?? ""
    steps.push({ text: sk(skill,
      `PROTEIN — Add ${proteins.map(capitalize).join(", ")} in a single layer. Cook 2–3 min without stirring first.`,
      `PROTEIN — Cook proteins FIRST in small batches — crowding drops temperature and you get steamed, not stir-fried. ${cue}`,
      `PROTEIN — Single layer, no movement for 2 min — build the Maillard crust. Then toss. ${cue} Remove and set aside before vegetables.`
    ), durationSeconds:240 })
  }

  if (hasVeg) {
    const { t1,t2,t3,t4 } = groupVegByTier(veggies)
    const allTiered = [...t1,...t2,...t3]
    if (allTiered.length)
      steps.push({ text: sk(skill,
        `VEGETABLES — Add ${allTiered.map(capitalize).join(", ")} and toss continuously over high heat.`,
        `VEGETABLES — Add dense veg first: ${[...t1,...t2].map(capitalize).join(", ")} (2–3 min). Then delicate: ${t3.map(capitalize).join(", ")} (1 min). Toss constantly — never let it sit.`,
        `VEGETABLES — Sequence: ${t1.length?capitalize(t1[0])+" (dense, 2 min) → ":""}${t2.length?t2.map(capitalize).join(", ")+" (medium, 1–2 min) → ":""}${t3.length?t3.map(capitalize).join(", ")+" (delicate, 30 sec)":""}.`
      ), durationSeconds:180 })
    if (t4.filter(v=>VEG_COOK_TIER[v]?.time!=="raw only").length)
      steps.push({ text:`INSTANT VEG — Add ${t4.filter(v=>VEG_COOK_TIER[v]?.time!=="raw only").map(capitalize).join(", ")} off heat. Residual heat wilts them perfectly.`, durationSeconds:30 })
  }

  steps.push({ text: sk(skill,
    `SAUCE — Return everything to the wok. Add your sauce mixture and toss to coat.`,
    `SAUCE — Add sauce to the side of the wok (not directly on food) — it should sizzle on contact. Toss to coat everything evenly.`,
    `SAUCE — Add sauce to hot wok wall for instant reduction. The starch (if using cornstarch) thickens in seconds. Pull off heat immediately when glossy.`
  ), durationSeconds:90 })

  if (hasGrain) {
    const gc = GRAIN_COOK_TEXT[grains[0]]
    if (gc) steps.push({ text:`GRAIN — ${gc.text}`, durationSeconds:gc.durationSeconds })
  }

  const acidStep = getAcidStep(profile, lower, skill)
  if (acidStep) steps.push(acidStep)

  steps.push({ text:`FINISH — ${capitalize(profile.finish)}. ${sk(skill,"","Taste and adjust soy (salt), vinegar (acid), sugar (sweet).","Balance wok: soy = salt, rice vinegar = acid, pinch of sugar = sweet. Must taste in harmony.")}`, durationSeconds:0 })
  steps.push(buildPlateStep(proteins, grains, legumes, veggies, goal, skill))
  return steps
}

function buildBraiseSteps({ lower, goal, spice, location, skill, profile, proteins, grains, legumes, veggies, hasMeat, hasVeg }) {
  const steps = []
  const protKey = proteins[0]
  const cue = DONENESS_CUES[protKey] ?? ""

  steps.push({ text: sk(skill,
    `PREP — Pat ${proteins.map(capitalize).join(", ")} completely dry. Season generously with salt and pepper on all sides.`,
    `PREP — ${PROTEIN_PREP[protKey]?.(location,skill) ?? "Pat dry and season."} Room temperature protein seals faster — remove from fridge 20 min before cooking.`,
    `PREP — ${PROTEIN_PREP[protKey]?.(location,skill) ?? "Pat dry and season."} If marinating, do so in the fridge 4+ hours.`
  ), durationSeconds:600 })

  steps.push({ text: sk(skill,
    `SEAR — Heat oil in a heavy pot until hot. Sear ${proteins.map(capitalize).join(", ")} until browned on all sides — 4–5 min per side. Don't move it early.`,
    `SEAR — Screaming hot pot, small amount of fat. Sear in batches — crowding = steaming. Build a proper brown crust on every surface. ${cue}`,
    `SEAR — The fond (brown bits) that forms is concentrated flavour — your braise will taste of it. Get it dark, not burned. Every side matters.`
  ), durationSeconds:480 })

  if (hasVeg) {
    const { t1,t2 } = groupVegByTier(veggies)
    if (t1.length||t2.length) steps.push({ text:`AROMATICS — Add ${[...t1,...t2].map(capitalize).join(", ")} to the same pot. Cook 5 min in the rendered fat — they pick up the fond. ${DONENESS_CUES.onion}`, durationSeconds:300 })
  }

  steps.push({ text: sk(skill,
    `DEGLAZE — Add liquid (stock, wine or water) and scrape the bottom of the pot to release all the brown bits.`,
    `DEGLAZE — Add liquid. Scrape every bit of fond from the pot bottom — this is where all the flavour lives. ${profile.acid} if using.`,
    `DEGLAZE — Deglaze with ${profile.acid} first (acid loosens fond better), then add bulk liquid. The fond should fully dissolve into the sauce.`
  ), durationSeconds:120 })

  const braiseMins = protKey==="lamb"||protKey==="beef"?"90–120":protKey==="pork"?"60–90":"45–60"
  steps.push({ text: sk(skill,
    `BRAISE — Return protein to the pot. Liquid should come halfway up the meat. Cover and cook low-and-slow on the stovetop or in a 160°C oven for ${braiseMins} min.`,
    `BRAISE — Liquid halfway up protein. Low and slow — 150–160°C oven or the lowest stovetop setting. Check every 30 min. ${cue}`,
    `BRAISE — Maintain 80–90°C liquid temperature — tiny bubbles, not a rolling boil. The collagen converts to gelatin in this range, giving the sauce its body. ${cue}`
  ), durationSeconds: parseInt(braiseMins)*60 })

  steps.push({ text: sk(skill,
    `FINISH — Remove protein. Taste the braising liquid — reduce it on high heat for 5–10 min if too thin.`,
    `SAUCE — Remove protein and rest it. Reduce braising liquid until it coats a spoon. ${DONENESS_CUES.sauce}`,
    `SAUCE — Strain braising liquid, reduce to sauce consistency. Mount with cold butter off heat for gloss and richness.`
  ), durationSeconds:420 })

  const acidStep = getAcidStep(profile, lower, skill)
  if (acidStep) steps.push(acidStep)
  steps.push({ text:`SEASON — ${SKILL_TASTE[skill]}`, durationSeconds:0 })
  steps.push({ text:`REST — ${cue} Rest protein 5–10 min before slicing — cutting too early loses all the juice.`, durationSeconds:300 })
  steps.push(buildPlateStep(proteins, grains, legumes, veggies, goal, skill))
  return steps
}

function buildNoCookSteps({ lower, goal, spice, location, skill, profile, proteins, grains, legumes, veggies }) {
  const steps = []

  steps.push({ text: sk(skill,
    `PREP — Wash all ingredients thoroughly. Dry them completely before cutting — wet ingredients dilute dressings.`,
    `PREP — ${SKILL_KNIFE.intermediate} Uniform cuts mean even coating and balanced bites.`,
    `PREP — Chill your bowl before plating — cold salads and raw dishes stay fresh much longer on a chilled surface.`
  ), durationSeconds:300 })

  const cookableVeg = veggies.filter(v=>VEG_COOK_TIER[v]?.tier!==4&&VEG_COOK_TIER[v]?.time!=="raw only")
  if (cookableVeg.length) {
    buildVegSteps(cookableVeg, skill).forEach(s => steps.push(s))
  }

  const rawVeg = veggies.filter(v=>VEG_COOK_TIER[v]?.time==="raw only"||!VEG_COOK_TIER[v])
  if (rawVeg.length)
    steps.push({ text:`COMBINE — Add ${rawVeg.map(capitalize).join(", ")} to your bowl. ${rawVeg.map(v=>VEG_COOK_TIER[v]?.cue).filter(Boolean).join(". ")}`, durationSeconds:0 })

  if (proteins.length)
    steps.push({ text:`PROTEIN — Add ${proteins.map(capitalize).join(", ")}. ${DONENESS_CUES[proteins[0]]??""}`, durationSeconds:0 })

  steps.push({ text: sk(skill,
    `DRESSING — Whisk together your oil, acid and seasoning. Dress just before serving.`,
    `DRESSING — Oil + acid + salt. Add acid (${profile.acid}) last and taste. ${DONENESS_CUES.sauce}`,
    `DRESSING — Emulsify oil and acid vigorously (3:1 ratio). Season with salt and a pinch of sugar to balance. Dress individual portions — pooled dressing soaks and wilts.`
  ), durationSeconds:60 })

  const acidStep = getAcidStep(profile, lower, skill)
  if (acidStep) steps.push(acidStep)
  steps.push({ text:`SEASON — ${SKILL_TASTE[skill]}`, durationSeconds:0 })
  steps.push(buildPlateStep(proteins, grains, legumes, veggies, goal, skill))
  return steps
}

function buildOnePotDalSteps({ lower, goal, spice, location, skill, profile, proteins, grains, legumes, veggies, hasGrain, hasVeg }) {
  const steps = []
  const lKey = legumes[0]

  steps.push({ text:`PREP — ${LEGUME_PREP[lKey] ?? "Rinse the dal well."}`, durationSeconds:600 })

  if (hasGrain) {
    const gp = GRAIN_PREP[grains[0]]
    if (gp) steps.push({ text:`GRAIN PREP — ${gp(skill)}`, durationSeconds:300 })
  }

  const lc = LEGUME_COOK[lKey] ?? { text:`Cook dal until completely soft.`, durationSeconds:720 }
  steps.push({ text:`COOK DAL — ${lc.text}`, durationSeconds:lc.durationSeconds })

  if (hasVeg) {
    const { t1,t2,t3,t4 } = groupVegByTier(veggies)
    const cookedVeg = [...t1,...t2,...t3]
    if (cookedVeg.length) steps.push({ text: sk(skill,
      `VEGETABLES — Add ${cookedVeg.map(capitalize).join(", ")} and cook ${[...t1,...t2].length?"8–10":""} min until tender.`,
      `VEGETABLES — Add ${t1.map(capitalize).join(", ")||""} first (dense — 8 min), then ${t2.map(capitalize).join(", ")||""} (medium — 4 min). They simmer into the dal.`,
      `VEGETABLES — Stagger by cook time. ${DONENESS_CUES.potato} Don't dissolve them — some texture contrast is intentional.`
    ), durationSeconds:480 })
    if (t4.length) steps.push({ text:`DELICATE — Add ${t4.map(capitalize).join(", ")} off heat. ${t4.map(v=>VEG_COOK_TIER[v]?.cue).filter(Boolean).join(". ")}`, durationSeconds:0 })
  }

  // Combine
  steps.push({ text:`COMBINE — Stir cooked dal into the vegetable base (or combine in the pressure cooker pot). Simmer 5–8 min uncovered. ${DONENESS_CUES.dal}`, durationSeconds:360 })

  // Tadka on top
  const bloomMap_tadka = {
    "India-South": `Heat ${profile.fat} separately until smoking. Add ${profile.tempering.join(", ")} — wait for the complete pop. Pour sizzling tadka over the dal.`,
    "India-East":  `Heat ${profile.fat} until it lightens in colour. Add panch phoron — all five seeds must bloom. Pour over the dal.`,
    default:       `Heat ${profile.fat} in a small pan. Add ${profile.tempering.join(", ")} — cook until they splutter. ${DONENESS_CUES.tadka} Pour sizzling tadka over the dal.`,
  }
  steps.push({ text:`TADKA — ${bloomMap_tadka[location]??bloomMap_tadka.default}`, durationSeconds:60 })

  const acidStep = getAcidStep(profile, lower, skill)
  if (acidStep) steps.push(acidStep)
  steps.push({ text:`SEASON — ${SKILL_TASTE[skill]}`, durationSeconds:0 })
  steps.push({ text:`FINISH — ${capitalize(profile.finish)}.`, durationSeconds:0 })
  steps.push(buildPlateStep(proteins, grains, legumes, veggies, goal, skill))
  return steps
}

function buildBakesteps({ lower, goal, spice, location, skill, profile, proteins, grains, legumes, veggies, hasMeat }) {
  const steps = []

  steps.push({ text: sk(skill,
    `PREP — Pre-heat oven to 180–200°C. This is essential — a cold oven gives uneven results. Grease your tin or tray.`,
    `PREP — Pre-heat oven at least 20 min before baking. Measure all ingredients precisely — baking is chemistry, not cooking.`,
    `PREP — Calibrate your oven — most home ovens run 10–20°C off. Pre-heat with a stone or heavy tray inside for even heat distribution.`
  ), durationSeconds:1200 })

  if (hasMeat) {
    const cue = DONENESS_CUES[proteins[0]] ?? ""
    steps.push({ text: sk(skill,
      `SEASON — Coat ${proteins.map(capitalize).join(", ")} with oil and seasoning on all surfaces.`,
      `SEASON — ${PROTEIN_PREP[proteins[0]]?.(location,skill)??""} Season inside cavities too.`,
      `SEASON — Dry-brine if time allows: salt uncovered in fridge overnight. The salt penetrates deeply and creates a crispier skin.`
    ), durationSeconds:300 })
  }

  if (grains.some(g=>["flour","whole_wheat_flour"].includes(g))) {
    steps.push({ text: sk(skill,
      `MIX — Combine dry ingredients first, then add wet. Stir until just combined — lumps are fine.`,
      `MIX — Whisk dry separately from wet. Fold together until just incorporated — overmixing builds gluten and makes it tough.`,
      `MIX — Understand your target: tender = minimal mix, chewy = develop gluten, flaky = keep fat cold and in visible pieces.`
    ), durationSeconds:300 })
  }

  if (hasVeg) buildVegSteps(veggies, skill).forEach(s=>steps.push(s))

  const roastMins = proteins[0]==="turkey"?"180–240":proteins[0]==="pork"?"90–120":"45–60"
  steps.push({ text: sk(skill,
    `ROAST/BAKE — Place in pre-heated oven. Cook ${hasMeat?roastMins+" min":"25–35 min"}.`,
    `ROAST/BAKE — ${hasMeat?`Roast ${roastMins} min. Baste ${proteins[0]==="turkey"?"every 30 min":"halfway through"}.`:"Bake until golden and set."}`,
    `ROAST/BAKE — ${hasMeat?`Start high (220°C) for crust, then reduce to 160°C to cook through gently. ${DONENESS_CUES[proteins[0]]??""}`:
      "Rotate tray halfway through. A skewer inserted in the centre should come out clean for cakes; golden brown for pastry."}`
  ), durationSeconds: hasMeat?parseInt(roastMins)*60:1800 })

  const acidStep = getAcidStep(profile, lower, skill)
  if (acidStep) steps.push(acidStep)
  if (hasMeat) steps.push({ text:`REST — ${DONENESS_CUES[proteins[0]]??""} Rest ${proteins[0]==="turkey"?"30":"5–10"} min before carving — juices redistribute inside the meat.`, durationSeconds:600 })
  steps.push({ text:`SEASON — ${SKILL_TASTE[skill]}`, durationSeconds:0 })
  steps.push(buildPlateStep(proteins, grains, legumes, veggies, goal, skill))
  return steps
}

function buildBiriyaniSteps({ lower, goal, spice, location, skill, profile, proteins, grains, legumes, veggies }) {
  const steps = []
  const hasMeat = proteins.some(p=>MEAT_SET.has(p))

  steps.push({ text:`RICE PREP — ${GRAIN_PREP["rice"]?.(skill)??"Wash rice 3 times until clear. Soak 20 min."}`, durationSeconds:1200 })
  steps.push({ text:`PROTEIN PREP — ${hasMeat ? (PROTEIN_PREP[proteins[0]]?.(location,skill)??"Marinate protein.") : "Prepare your vegetable/paneer as directed."}`, durationSeconds:600 })

  steps.push({ text: sk(skill,
    `FRIED ONIONS — Slice onions thin and fry in oil until deep golden-brown and crispy. Drain on paper. These go on top.`,
    `FRIED ONIONS (birista) — Thin-sliced onions fried low-and-slow until deep mahogany. They define biryani flavour. Don't rush — pale onions won't give depth.`,
    `BIRISTA — 3mm slices, fry at 160°C until evenly browned and crisp. Drain and spread on paper — they crisp further as they cool.`
  ), durationSeconds:1200 })

  steps.push({ text: sk(skill,
    `MASALA — Cook the marinated protein with onion, tomato and spices until oil separates.`,
    `MASALA — Cook protein in its masala until oil visibly separates from the gravy — this is the bhuno step. Under-bhuno'd masala = raw-tasting biryani.`,
    `MASALA — Bhuno thoroughly — cook on high briefly at the end to drive off excess moisture. The masala should be thick and clinging to the protein.`
  ), durationSeconds:1200 })

  steps.push({ text:`PAR-COOK RICE — Boil rice in heavily salted water with whole spices (bay leaf, cardamom, cloves) until 70% cooked — still has a chalky centre. Drain immediately.`, durationSeconds:480 })

  steps.push({ text: sk(skill,
    `LAYER — In a heavy pot: masala layer → rice layer → saffron milk → fried onions → ghee drizzle.`,
    `LAYER — Masala base, then rice in an even dome. Saffron soaked in warm milk drizzled over rice. Birista and ghee on top.`,
    `LAYER — Two rice layers with masala in between for maximum flavour distribution. Saffron only on top layer. Rose water optional.`
  ), durationSeconds:300 })

  steps.push({ text: sk(skill,
    `DUM COOK — Seal the pot with foil and a tight lid. Cook on lowest heat 20–25 min.`,
    `DUM — Seal tight with foil + lid (or dough seal). Lowest heat 20–25 min. Place a tawa/griddle under the pot to prevent base burning.`,
    `DUM — Seal hermetically. 18 min on lowest gas + 5 min resting off heat. The trapped steam is what cooks the rice from halfway to perfect.`
  ), durationSeconds:1500 })

  steps.push({ text:`REST — Keep pot sealed 10 min off heat. Open at the table — the steam release is part of the experience. ${DONENESS_CUES.dal}`, durationSeconds:600 })
  steps.push(buildPlateStep(proteins, grains, legumes, veggies, goal, skill))
  return steps
}

// ── GRAIN COOK TEXT with durations ────────────────────────────
const GRAIN_COOK_TEXT = {
  rice:              { text:`Stir once, bring to boil, reduce to absolute minimum heat. Lid on undisturbed for 12 min. No peeking — escaping steam is what ruins rice texture.`, durationSeconds:720 },
  brown_rice:        { text:`1:2.5 water ratio. Cover, simmer 35 min on minimum heat. Rest off heat 10 min before fluffing.`, durationSeconds:2100 },
  pasta:             { text:`Cook until al dente — 1–2 min less than the packet says. Reserve 1 cup pasta water before draining. ${DONENESS_CUES?.sauce?"Never rinse cooked pasta — the surface starch makes sauce cling.":""}`, durationSeconds:480 },
  rice_noodles:      { text:`Add soaked noodles to the hot pan last. Toss rapidly 2–3 min — they just need to absorb the sauce and heat through.`, durationSeconds:150 },
  semolina:          { text:`Pour hot liquid into roasted semolina slowly while stirring constantly to prevent lumps. Cook 3–4 min until it pulls away from the sides.`, durationSeconds:240 },
  oats:              { text:`Add to warm liquid. Stir on medium-low for 4–5 min. Pull off heat while slightly loose — it thickens as it cools.`, durationSeconds:300 },
  quinoa:            { text:`1:2 water ratio. Cover and simmer 15 min undisturbed. Fluff with a fork — look for the white tails (germ) separating from the seed.`, durationSeconds:900 },
  noodles:           { text:`Toss cooked noodles in the wok over high heat. Sauce and stir constantly for 2–3 min.`, durationSeconds:180 },
  ramen_noodles:     { text:`Add noodles to hot broth or sauce last. Stir to loosen and combine — 60 sec only.`, durationSeconds:60 },
  flattened_rice:    { text:`Add rinsed flattened rice to the pan. Toss gently 3–4 min on medium — it dries out and each grain separates.`, durationSeconds:240 },
  oats:              { text:`Stir on medium-low 4–5 min. Remove while slightly loose.`, durationSeconds:300 },
}

// ═════════════════════════════════════════════════════════════
//  SECTION 8 — MAIN STEP GENERATOR (method router)
// ═════════════════════════════════════════════════════════════

export function generateSteps({ lower, goal, spice, location, skill = "intermediate" }) {
  const profile  = getCuisineProfile(location, lower)
  const meats    = lower.filter(i => MEAT_SET.has(i))
  const vegProts = lower.filter(i => VEG_PROT.has(i))
  const proteins = [...meats, ...vegProts]
  const grains   = lower.filter(i => GRAIN_SET.has(i))
  const legumes  = lower.filter(i => LEGUME_SET.has(i))
  const veggies  = lower.filter(i => VEG_SET.has(i))

  const ctx = {
    lower, goal, spice, location, skill, profile,
    proteins, grains, legumes, veggies,
    hasMeat:    meats.length > 0,
    hasVegProt: vegProts.length > 0,
    hasGrain:   grains.length > 0,
    hasLegume:  legumes.length > 0,
    hasVeg:     veggies.length > 0,
    hasProtein: proteins.length > 0,
  }

  const method = detectCookingMethod(lower, location)

  let rawSteps
  switch (method) {
    case "stirfry":   rawSteps = buildStirFrySteps(ctx);   break
    case "braise":    rawSteps = buildBraiseSteps(ctx);    break
    case "nocook":    rawSteps = buildNoCookSteps(ctx);    break
    case "onepotdal": rawSteps = buildOnePotDalSteps(ctx); break
    case "bake":
    case "roast":     rawSteps = buildBakesteps(ctx);      break
    case "biryani":   rawSteps = buildBiriyaniSteps(ctx);  break
    default:          rawSteps = buildSauteSteps(ctx);     break
  }

  // Return array of { text, durationSeconds } for RecipeDisplay timer accuracy
  return rawSteps.filter(Boolean)
}

// ═════════════════════════════════════════════════════════════
//  SECTION 9 — SUGGESTION ENGINE (expanded to 80+ ingredients)
// ═════════════════════════════════════════════════════════════

const SUGGESTION_DB = {
  // Proteins
  chicken:    { base:["garlic","ginger","lemon","black_pepper","onion","coriander"],   pair:["spinach","capsicum","mushroom","cream"] },
  lamb:       { base:["onion","ginger","garlic","curd","cumin","garam_masala"],         pair:["potato","green_peas"] },
  beef:       { base:["onion","garlic","black_pepper","soy_sauce","mustard"],           pair:["broccoli","capsicum","mushroom"] },
  pork:       { base:["garlic","ginger","soy_sauce","honey","sesame_oil"],              pair:["mushroom","capsicum","spring_onion"] },
  turkey:     { base:["garlic","butter","onion","rosemary","thyme"],                    pair:["potato","carrot","mushroom"] },
  fish:       { base:["lemon","garlic","ginger","turmeric"],                            pair:["capsicum","tomato","spinach"] },
  shrimp:     { base:["garlic","butter","lemon","black_pepper"],                        pair:["pasta","capsicum","spring_onion"] },
  egg:        { base:["onion","tomato","coriander","black_pepper"],                     pair:["capsicum","spinach","cheese"] },
  paneer:     { base:["capsicum","tomato","onion","cream"],                             pair:["green_peas","spinach","cashews"] },
  tofu:       { base:["soy_sauce","ginger","garlic","sesame_oil"],                      pair:["mushroom","broccoli","spring_onion"] },
  soy_chunks: { base:["onion","tomato","ginger","garlic","cumin"],                      pair:["capsicum","green_peas"] },
  // Legumes
  toor_dal:   { base:["ghee","cumin","garlic","tomato","turmeric"],                     pair:["spinach","lemon","drumstick"] },
  urad_dal:   { base:["ghee","cumin","ginger","garlic"],                                pair:["toor_dal","moong_dal","tomato"] },
  moong_dal:  { base:["ghee","cumin","garlic","turmeric"],                              pair:["spinach","lemon","ginger"] },
  chana_dal:  { base:["onion","ginger","garlic","cumin","turmeric"],                    pair:["coconut","tomato"] },
  masoor_dal: { base:["onion","tomato","garlic","cumin"],                               pair:["spinach","lemon","cream"] },
  rajma:      { base:["onion","tomato","ginger","garlic","cream"],                      pair:["rice","butter","coriander"] },
  chickpeas:  { base:["onion","tomato","cumin","coriander"],                            pair:["potato","lemon","tahini"] },
  // Grains
  rice:       { base:["garlic","onion","carrot","green_peas"],                          pair:["cashews","soy_sauce","egg"] },
  brown_rice: { base:["garlic","onion","ginger"],                                       pair:["broccoli","capsicum","carrot"] },
  pasta:      { base:["garlic","olive_oil","parmesan","onion"],                         pair:["tomato","spinach","mushroom"] },
  oats:       { base:["banana","honey","cinnamon"],                                     pair:["almonds","blueberries","milk"] },
  quinoa:     { base:["lemon","cucumber","tomato","olive_oil"],                         pair:["coriander","feta_cheese","avocado"] },
  semolina:   { base:["onion","mustard_seeds","curry_leaves","urad_dal"],               pair:["carrot","green_peas","cashews"] },
  // Vegetables
  spinach:    { base:["garlic","olive_oil","lemon"],                                    pair:["paneer","egg","chickpeas"] },
  mushroom:   { base:["garlic","butter","thyme"],                                       pair:["parmesan","cream","pasta"] },
  broccoli:   { base:["garlic","olive_oil","lemon"],                                    pair:["parmesan","chicken","almonds"] },
  potato:     { base:["garlic","onion","cumin","turmeric"],                             pair:["green_peas","curd","mustard_seeds"] },
  sweet_potato:{ base:["cinnamon","honey","butter"],                                    pair:["black_pepper","lime","coriander"] },
  tomato:     { base:["garlic","onion","olive_oil","basil"],                            pair:["mozzarella","egg","pasta"] },
  carrot:     { base:["ginger","garlic","honey"],                                       pair:["coriander","lemon","sesame_oil"] },
  capsicum:   { base:["onion","garlic","olive_oil"],                                    pair:["cheese","egg","chicken"] },
  eggplant:   { base:["garlic","olive_oil","tomato"],                                   pair:["mozzarella","parmesan","tahini"] },
  zucchini:   { base:["garlic","olive_oil","lemon"],                                    pair:["parmesan","tomato","basil"] },
  cauliflower:{ base:["turmeric","cumin","garlic"],                                     pair:["potato","green_peas","curd"] },
  pumpkin:    { base:["garlic","ginger","coconut_milk"],                                pair:["chickpeas","cumin","coriander"] },
  avocado:    { base:["lemon","onion","garlic"],                                        pair:["tomato","coriander","lime"] },
  cucumber:   { base:["curd","garlic","mint"],                                          pair:["tomato","onion","lemon"] },
  okra:       { base:["onion","tomato","cumin","turmeric"],                             pair:["garlic","mustard_seeds","green_chili"] },
  cabbage:    { base:["mustard_seeds","cumin","garlic"],                                pair:["carrot","green_peas","coconut"] },
  drumstick:  { base:["toor_dal","tamarind","turmeric"],                                pair:["onion","tomato","garlic"] },
  raw_banana: { base:["turmeric","mustard_oil","mustard_seeds"],                        pair:["coconut","green_chili","curry_leaves"] },
  pumpkin:    { base:["cumin","garlic","ginger"],                                       pair:["coconut_milk","chickpeas","lemon"] },
  // Dairy
  curd:       { base:["cumin","garlic","onion"],                                        pair:["cucumber","mint","lemon"] },
  cream:      { base:["garlic","onion","tomato"],                                       pair:["paneer","chicken","mushroom"] },
  paneer:     { base:["capsicum","onion","tomato"],                                     pair:["cream","cashews","green_peas"] },
  // Sauces/Flavours
  coconut_milk:{ base:["lemongrass","garlic","ginger"],                                 pair:["shrimp","chicken","tofu"] },
  soy_sauce:  { base:["garlic","ginger","sesame_oil"],                                  pair:["broccoli","mushroom","spring_onion"] },
  tahini:     { base:["lemon","garlic","olive_oil"],                                    pair:["chickpeas","cucumber","tomato"] },
  olive_oil:  { base:["garlic","lemon","parsley"],                                      pair:["tomato","pasta","fish"] },
  honey:      { base:["garlic","ginger","soy_sauce"],                                   pair:["chicken","lemon","mustard"] },
  miso_paste: { base:["garlic","ginger","sesame_oil"],                                  pair:["tofu","mushroom","seaweed"] },
  // Nuts
  almonds:    { base:["honey","lemon","cinnamon"],                                      pair:["oats","banana","blueberries"] },
  cashews:    { base:["onion","tomato","cream"],                                        pair:["paneer","chicken","pasta"] },
  peanuts:    { base:["garlic","ginger","soy_sauce"],                                   pair:["rice_noodles","capsicum","spring_onion"] },
  // Herbs/Spices
  garlic:     { base:["onion","ginger","tomato"],                                       pair:["lemon","olive_oil","parsley"] },
  ginger:     { base:["garlic","onion","turmeric"],                                     pair:["lemon","honey","coriander"] },
  lemon:      { base:["garlic","olive_oil","parsley"],                                  pair:["fish","chicken","spinach"] },
  coriander:  { base:["garlic","onion","tomato"],                                       pair:["lemon","green_chili","cumin"] },
}

const GOAL_BOOST = {
  muscle_gain: new Set(["egg","paneer","chicken","chickpeas","toor_dal","quinoa","soy_chunks","beef","pork","urad_dal","masoor_dal","shrimp","turkey","rajma"]),
  weight_loss:  new Set(["spinach","broccoli","cucumber","lemon","oats","zucchini","lettuce","mushroom","cauliflower","cabbage","green_peas"]),
  balanced:     new Set(["tomato","onion","garlic","olive_oil","curd","carrot","capsicum"]),
  maintenance:  new Set(["tomato","onion","garlic","olive_oil","curd","carrot","capsicum"]),
}

export function generateSuggestions(lower, goal, location, maxResults = 4) {
  const profile   = getCuisineProfile(location, lower)
  const inputSet  = new Set(lower)
  const goalBoost = GOAL_BOOST[goal] ?? GOAL_BOOST.balanced
  const scores    = {}
  const add = (item, pts) => { if (!inputSet.has(item)) scores[item] = (scores[item] ?? 0) + pts }

  lower.forEach(ing => {
    const entry = SUGGESTION_DB[ing]
    if (!entry) return
    entry.base.forEach(s => add(s.split(" ")[0], 3))
    entry.pair.forEach(s => add(s, 2))
  })

  profile.tempering.forEach(s => add(s.split(" ")[0], 2))
  profile.aromatics.forEach(s => add(s.split(" ")[0], 1))
  Object.keys(scores).forEach(item => { if (goalBoost.has(item)) scores[item] += 4 })

  return Object.entries(scores)
    .sort(([,a],[,b]) => b - a)
    .slice(0, maxResults)
    .map(([item]) => capitalize(item))
}

// ═════════════════════════════════════════════════════════════
//  SECTION 10 — COMMON MISTAKES ENGINE
// ═════════════════════════════════════════════════════════════

export const INGREDIENT_MISTAKES = {
  chicken:     ["Undercooking is a safety risk — verify internal temp reaches 74°C","Skipping marination leaves the meat dry — minimum 20 min, ideally overnight","Cutting into chicken immediately after cooking loses all the resting juices"],
  paneer:      ["Overcooking makes it rubbery — add in the last 3–4 minutes only","Frying on low heat makes it absorb too much oil — use medium-high","Don't add cold paneer directly to a hot sauce — it can break apart"],
  egg:         ["High heat makes eggs rubbery — always cook on medium or lower","For scrambled: pull off heat while slightly wet — residual heat finishes them","Cracking eggs on the edge of a bowl pushes shell into the egg — crack on a flat surface"],
  fish:        ["Fish overcooks in seconds — done when it flakes easily with a fork","Don't move it for the first 2–3 min — let the crust form","Too much acid in marination starts 'cooking' the fish before heat does — keep marinade under 10 min"],
  pork:        ["Pork must reach 63°C internal — undercooked pork is a food safety risk","Resting after cooking is essential — minimum 3 minutes before slicing","Lean pork cuts (loin, tenderloin) dry out fast — don't overcook past 65°C"],
  turkey:      ["Brine overnight for moisture — dry turkey is the #1 complaint","Use a thermometer — breast 73°C, thigh 80°C","Basting with pan juices actually slows cooking — it opens the oven. Dry-brining is more effective"],
  beef:        ["Don't press the patty/steak while cooking — you squeeze out all the juices","Rest steak minimum 5 min off heat before cutting","Salting steak 1–30 min before = draws moisture out without reabsorbing = tough. Salt immediately before or 45+ min before"],
  toor_dal:    ["Undercooked dal causes digestive discomfort — pressure cook until completely soft","Add salt only after dal is fully cooked — salt added before hardening legumes","Don't add tamarind before dal is soft — the acid stops it softening"],
  moong_dal:   ["Pressure cook fully — undercooked moong causes bloating","Tadka goes in over hot oil at the very end for maximum fragrance"],
  urad_dal:    ["Soak at least 30 min — under-soaked urad dal stays dense","For idli/dosa batter: grind with cold water for a light, airy batter","Old urad dal takes much longer — check age of your dal"],
  chana_dal:   ["Don't skip soaking — unsoaked chana dal cooks unevenly","Should hold its shape after cooking — dissolving means overcooked"],
  rajma:       ["Never eat undercooked kidney beans — toxic lectins are a real danger","Must boil vigorously for at least 10 min before any simmering","Don't add acidic ingredients (tomato, tamarind) before rajma is fully cooked — acid prevents softening"],
  chickpeas:   ["Dried chickpeas must soak 8+ hours — undersoaked ones stay hard regardless of cook time","Canned: rinse thoroughly to reduce sodium content by ~40%","Adding salt early hardens the skin — always salt after cooking"],
  rice:        ["Not washing rice leaves excess starch — makes it clumpy","Don't lift the lid while steaming — escaping steam ruins texture","Adding too much water = mushy rice. Standard ratio: 1:1.5 (cup rice:water) for most varieties"],
  rice_noodles:["Never boil rice noodles — soak in room-temp water, finish in pan","Residual heat continues cooking — pull off heat 30 sec before they look done"],
  pasta:       ["Salt the water generously — it should taste like mild seawater","Never rinse pasta — you wash off the starch that helps sauce cling","Reserve pasta water — the starchy water fixes broken sauces and helps everything bind"],
  oats:        ["Don't add boiling liquid all at once — add gradually while stirring","Rolled oats and instant oats are not interchangeable — check your recipe"],
  tofu:        ["Press tofu 20+ min before cooking — water prevents browning","Freeze then thaw for a chewier, meatier texture that holds up better in stews"],
  lamb:        ["Bring lamb to room temperature 20 min before cooking — cold meat seizes on contact with heat","Don't rush the bhuno — low and slow develops deep flavour that fast cooking can't replicate"],
  mushroom:    ["Don't crowd the pan — they release water and steam instead of browning","Salt only after browning — salt draws moisture immediately and prevents the crust you want"],
  potato:      ["Start potatoes in cold water for even cooking — hot water cooks outside before centre","Dry potatoes completely before frying — surface moisture steams instead of crisps"],
  spinach:     ["Add spinach in the last 30 sec — it wilts almost instantly","Don't cover the pan — trapped steam turns it grey-green"],
  eggplant:    ["Salt sliced eggplant and rest 20 min — draws out bitterness and reduces oil absorption","Don't crowd the pan — eggplant absorbs oil instantly when steamed"],
  avocado:     ["Only halve avocado right before serving — it oxidises within minutes","The lemon/lime trick only slows oxidation, it doesn't stop it — serve promptly"],
  mayonnaise:  ["Never heat mayonnaise directly — it splits into greasy, broken mess","Add to dishes at the end, completely off heat"],
  onion:       ["Raw onion smell in a finished dish means it wasn't cooked long enough — minimum 8 min on medium","Don't raise heat to rush onions — they burn on the outside and stay raw inside"],
  garlic:      ["30 sec in hot oil is usually enough — brown garlic turns irreversibly bitter","Garlic added to a cold pan with oil becomes cooked without browning (garlic confit technique) — different result, valid use"],
  coconut_milk:["Stir coconut milk before opening — cream settles on top","High heat causes coconut milk to split — keep it at a gentle simmer"],
  cream:       ["Never add cold cream to a screaming-hot pan — it curdles","Always reduce heat before adding cream"],
}

export const CUISINE_MISTAKES = {
  India:      ["Burning the tadka ruins the whole dish — spices turn from fragrant to bitter in seconds","Adding water too early stops the bhuno process — let oil separate first before any liquid","Garam masala added too early loses its fragrance — it's a finishing spice"],
  "India-South":["Under-popped mustard seeds give a bitter taste instead of nutty flavour","Curry leaves must be completely dry before hitting hot oil — wet leaves cause dangerous oil splatter","Adding coconut too early makes it turn bitter — always late addition"],
  "India-East": ["Raw mustard oil is aggressively pungent — heat until it lightens and loses the raw sharpness","Panch phoron must be added to hot oil and bloomed fully before anything else — each seed has a different pop time"],
  "India-West": ["Kokum or tamarind balance is everything — taste before adding more, it can overwhelm quickly"],
  Italy:      ["Never let olive oil smoke — it turns bitter and carcinogenic at smoke point","Salting pasta water is not optional — under-salted pasta tastes flat regardless of how good your sauce is","Adding pasta to sauce before it's reduced enough = watery dish"],
  Mexico:     ["Under-toasting dried chilies gives zero depth — darken until nutty, not burned","Don't skip blooming spices in fat — this is where most flavour lives","Fresh cilantro is added off heat — heat turns it bitter"],
  China:      ["Wok must be at absolute maximum heat — medium produces steamed, not stir-fried food","Add sauce to the side of the wok wall, not directly on food — sizzle-on-contact is the technique","Never over-crowd a wok — work in batches or accept steamed results"],
  Japan:      ["Dashi is the foundation — instant granules are a compromise, fresh kombu/bonito is worth it","Never boil miso broth — high heat destroys probiotics and turns it bitter","Over-salting with soy sauce is irreversible — taste as you add, not after"],
  Thailand:   ["Oil must visibly split from coconut cream before adding other ingredients — this is the Thai equivalent of bhuno","Balance is everything: fish sauce (salt) + lime (acid) + palm sugar (sweet) must be tasted and adjusted at the end","Kaffir lime leaves and lemongrass are aromatics, not garnishes — bruise them to release oils before cooking"],
  USA:        ["A cold pan means no crust — always preheat before oil or protein goes in","Don't skip the rest after cooking meat — cutting immediately loses all the redistributed juices","Smoked paprika and fresh paprika are completely different — read the recipe carefully"],
}

export function getCommonMistakes(lower, location) {
  const byIng    = lower.filter(i => INGREDIENT_MISTAKES[i]).flatMap(i => INGREDIENT_MISTAKES[i])
  const byCuisine= CUISINE_MISTAKES[location] ?? CUISINE_MISTAKES["India"] ?? []
  return [...new Set([...byIng, ...byCuisine])].slice(0, 6)
}

// ═════════════════════════════════════════════════════════════
//  SECTION 11 — PAIRING ENGINE
// ═════════════════════════════════════════════════════════════

const PAIR_WITH_DB = {
  India:         { muscle_gain:["Jeera rice + toor dal","High-protein lassi","Tawa paratha with curd","Boiled egg on the side"],     weight_loss:["Cucumber raita","Steamed brown rice","Mint chaas","Raw onion salad with lemon"], balanced:["Steamed basmati rice","Dal tadka","Mixed vegetable raita","Lime pickle"] },
  "India-North": { muscle_gain:["Tawa paratha with curd","Jeera rice","Dal makhani","Boiled egg"],                                   weight_loss:["Cucumber raita","Mint chaas","Steamed brown rice"],                               balanced:["Steamed basmati rice","Dal tadka","Laccha onion salad"] },
  "India-South": { muscle_gain:["Steamed rice with sambar","Rasam for digestion","Egg curry on the side"],                           weight_loss:["Coconut chutney (small)","Steamed idli","Buttermilk with curry leaves"],            balanced:["Steamed rice","Sambar","Coconut chutney"] },
  "India-East":  { muscle_gain:["Steamed rice","Egg curry","Mustard fish"],                                                           weight_loss:["Steamed rice (small)","Tomato chutney","Posto (poppy seed paste)"],                balanced:["Steamed rice","Dal","Aloo posto"] },
  "India-West":  { muscle_gain:["Bhakri + dal","Kokum sharbat","Sprouts"],                                                           weight_loss:["Sol kadhi (digestive)","Steamed rice","Koshimbir salad"],                          balanced:["Steamed rice","Varan (plain dal)","Koshimbir","Papad"] },
  Italy:         { muscle_gain:["Al dente penne with olive oil","Protein minestrone","Grilled bruschetta"],                          weight_loss:["Arugula salad with balsamic","Grilled zucchini","Sparkling water with lemon"],     balanced:["Garlic focaccia","Caprese salad","Tiramisu (small)"] },
  Mexico:        { muscle_gain:["Black beans + corn tortillas","Protein smoothie with banana"],                                      weight_loss:["Pico de gallo","Cabbage slaw with lime","Agua fresca"],                            balanced:["Refried beans","Mexican rice","Fresh salsa verde"] },
  USA:           { muscle_gain:["Sweet potato mash","Greek yogurt coleslaw","Grilled corn"],                                         weight_loss:["Garden salad","Grilled asparagus","Sparkling water with lemon"],                    balanced:["Cornbread","Mac and cheese (small)","Iced tea"] },
  China:         { muscle_gain:["Steamed jasmine rice","Edamame","Silken tofu with soy"],                                            weight_loss:["Steamed bok choy","Clear egg drop soup","Jasmine tea"],                            balanced:["Steamed rice","Hot and sour soup","Fortune cookie"] },
  Japan:         { muscle_gain:["Steamed short-grain rice","Miso soup with tofu","Edamame"],                                         weight_loss:["Miso soup (low sodium)","Pickled tsukemono","Cold green tea"],                     balanced:["Miso soup","Steamed rice","Pickled daikon","Hojicha tea"] },
  Thailand:      { muscle_gain:["Jasmine rice","Papaya salad (som tam)","Coconut water"],                                            weight_loss:["Som tam (no sugar)","Clear tom yum broth","Coconut water"],                        balanced:["Jasmine rice","Fresh spring rolls","Thai iced tea"] },
}

export function getPairings(location, goal) {
  const loc = PAIR_WITH_DB[location] ?? PAIR_WITH_DB.India
  return loc[goal] ?? loc.balanced
}

// ═════════════════════════════════════════════════════════════
//  SECTION 12 — DONENESS CUES (exported for RecipeDisplay)
// ═════════════════════════════════════════════════════════════
export { DONENESS_CUES }

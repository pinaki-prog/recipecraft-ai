// ─────────────────────────────────────────────────────────────
//  cookingEngine.js  —  All cooking intelligence
//  Step generation, cuisine profiles, suggestions, mistakes,
//  pairing engine. Imported by generateSmartRecipe.js.
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
//  CUISINE AUTHENTICITY ENGINE
// ─────────────────────────────────────────────────────────────
export const CUISINE_PROFILES = {
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

export function getCuisineProfile(location) {
  return CUISINE_PROFILES[location] ?? {
    fat: "oil of your choice",
    tempering: ["garlic", "onion"],
    aromatics: ["salt", "pepper"],
    acid: "lemon juice",
    herbs: ["fresh parsley"],
    cookStyle: "standard sauté",
    technique: "Cook ingredients over medium heat, building flavour in layers.",
    finish: "season to taste and garnish before serving",
  }
}

// ─────────────────────────────────────────────────────────────
//  STEP GENERATION
// ─────────────────────────────────────────────────────────────
export const MEAT_SET   = new Set(["chicken","beef","lamb","fish","shrimp","pork","turkey"])
export const VEG_PROT   = new Set(["paneer","tofu","egg","soy_chunks"])
export const LEGUME_SET = new Set(["toor_dal","moong_dal","masoor_dal","urad_dal","chana_dal","chickpeas","rajma"])
export const GRAIN_SET  = new Set(["rice","brown_rice","quinoa","semolina","oats","pasta","rice_noodles","flour","whole_wheat_flour","flattened_rice","sago","gram_flour","noodles","ramen_noodles"])
export const VEG_SET    = new Set([
  "spinach","carrot","tomato","capsicum","pumpkin","raw_banana","papaya",
  "broccoli","cauliflower","mushroom","green_peas","potato","sweet_potato",
  "onion","garlic","ginger","avocado","banana","cabbage","cucumber","lettuce",
  "eggplant","zucchini","spring_onion","blueberries","okra","drumstick",
  "coconut","tamarind","lemon","lime",
])

const PROTEIN_PREP = {
  chicken: (loc) => {
    const m = { India:"yogurt, turmeric, red chili powder, garam masala — 20 min min", Japan:"soy sauce, mirin and sesame oil — 15 min", Thailand:"fish sauce, lime juice, turmeric — 20 min", Mexico:"lime, cumin, smoked paprika, garlic — 20 min", default:"salt, pepper and a splash of oil — 15 min" }
    return `Cut chicken into even pieces. Marinate in ${m[loc] ?? m.default}.`
  },
  lamb:   (loc) => `Trim excess fat from lamb. Marinate in yogurt, ginger-garlic paste${loc==="India"?", garam masala":""} for at least 30 min.`,
  pork:   ()    => "Pat pork dry. Season with salt, pepper and your chosen spice rub. Rest at room temperature 15 min before cooking.",
  turkey: ()    => "Pat turkey dry. Rub generously with softened butter, garlic and herbs under and over the skin.",
  beef:   ()    => "Pat beef completely dry — moisture is the enemy of a crust. Season generously with salt and pepper.",
  fish:   ()    => "Pat fish dry. Marinate briefly in lemon juice, turmeric and salt for exactly 10 min — any longer and acid starts cooking the flesh.",
  shrimp: ()    => "Devein and peel shrimp. Toss with a pinch of turmeric and salt. Do not marinate longer than 5 min.",
  paneer: ()    => "Cut paneer into 2 cm cubes. Shallow-fry in a hot dry pan until golden on two sides — stops it crumbling.",
  tofu:   ()    => "Press tofu between two plates with a heavy weight for 20 min to expel water. Cut into cubes.",
  egg:    ()    => "Crack eggs into a bowl. Beat with a fork until fully combined. Season with salt.",
  soy_chunks: () => "Soak soy chunks in hot salted water for 10 min until fully rehydrated. Squeeze out excess water firmly.",
}

const GRAIN_PREP = {
  rice:              "Wash rice 2–3 times in cold water until it runs clear. Soak for 20 min.",
  brown_rice:        "Wash brown rice and soak for 30 min minimum.",
  pasta:             "Bring a large pot of water to a rolling boil. Salt it heavily — it should taste like the sea.",
  rice_noodles:      "Soak rice noodles in room-temperature water for 20–30 min until pliable but not soft. Do not use boiling water.",
  semolina:          "Dry-roast semolina over medium heat, stirring constantly, until lightly golden and nutty — 3–4 min.",
  oats:              "Measure oats. Warm your liquid in a separate pan — adding oats to cold liquid makes them gluey.",
  quinoa:            "Rinse quinoa under cold water for 1 full minute to remove the bitter saponin coating.",
  flour:             "Measure flour and sift. Mix dry ingredients before adding wet to avoid lumps.",
  whole_wheat_flour: "Measure and sift whole wheat flour. It absorbs more liquid than refined flour — dough will feel stiffer.",
  noodles:           "Boil noodles until just al dente. Reserve some cooking water. Rinse under cold water to stop cooking.",
  ramen_noodles:     "Cook ramen noodles per packet — usually 2–3 min in boiling water. Drain immediately.",
}

const GRAIN_COOK = {
  rice:          "Stir once, bring to boil, reduce to minimum heat. Lid on undisturbed for 12 min. No peeking.",
  brown_rice:    "1:2.5 water ratio, lid on for 35 min on minimum heat. Rest off heat 10 min before fluffing.",
  pasta:         "Cook until al dente — 1–2 min less than packet. Reserve 1 cup pasta water before draining. Never rinse.",
  rice_noodles:  "Add soaked noodles to the hot pan last. Toss rapidly 2–3 min — they just need to absorb the sauce.",
  semolina:      "Pour hot liquid into roasted semolina slowly while stirring to prevent lumps.",
  oats:          "Add to warm liquid. Stir on medium-low for 4–5 min. Pull off heat while slightly loose — thickens as it cools.",
  quinoa:        "1:2 water ratio, cover and simmer 15 min. Fluff with fork — look for the white tails.",
  flour:         "Combine wet and dry ingredients until just incorporated — do not overmix or it becomes tough.",
  whole_wheat_flour: "Knead dough until smooth and elastic. Rest covered for 20 min before rolling.",
  noodles:       "Toss cooked noodles in the wok over high heat. Sauce and stir constantly — 2–3 min.",
  ramen_noodles: "Add noodles to hot broth or sauce last. Stir to loosen and combine — 60 sec only.",
}

const LEGUME_PREP = {
  toor_dal:   "Rinse toor dal until water runs clear. No soaking needed.",
  moong_dal:  "Rinse moong dal. Cooks fast — 2 whistles or 20 min stovetop.",
  masoor_dal: "Rinse masoor dal. No soaking needed, 15 min stovetop.",
  urad_dal:   "Rinse urad dal 2–3 times. Soak 30 min if time allows.",
  chana_dal:  "Rinse chana dal and soak 30 min minimum.",
  chickpeas:  "Dried: soak 8–12 hours until doubled. Canned: rinse thoroughly to reduce sodium ~40%.",
  rajma:      "Soak rajma 8–12 hours minimum. IMPORTANT: boil vigorously for 10 min before simmering — toxic lectins.",
}

const LEGUME_COOK = {
  toor_dal:   "Pressure cook 3–4 whistles until completely soft and mashable.",
  moong_dal:  "Pressure cook 2 whistles, or simmer covered 20–25 min until fully soft.",
  masoor_dal: "Simmer 15–20 min without lid — it dissolves and thickens naturally.",
  urad_dal:   "Pressure cook 3–4 whistles until completely soft — outer skin should split slightly.",
  chana_dal:  "Pressure cook soaked dal 3 whistles — soft but holding shape.",
  chickpeas:  "Soaked dried: 4–5 whistles. Canned: 5 min to warm through only.",
  rajma:      "After the vigorous boil, pressure cook 5–6 whistles until completely tender.",
}

const CUISINE_BLOOM = {
  India:    (s, p) => s==="hot" ? `Heat ${p.fat} until smoking. Add ${p.tempering.join(", ")} — increase chili 50%.` : s==="mild" ? `Warm ${p.fat} on medium. Add ${p.tempering.slice(0,2).join(" and ")} only. Sizzle gently 30 sec.` : `Heat ${p.fat} until shimmering. Add ${p.tempering.join(", ")} — cook until they splutter (~45 sec).`,
  Italy:    (_, p) => `Warm ${p.fat} on medium-low. Add ${p.tempering.join(" and ")}. Garlic should turn pale gold, NOT brown.`,
  Mexico:   (_, p) => `Heat ${p.fat}. Add ${p.tempering.join(", ")} and toast 60 sec until deeply fragrant.`,
  USA:      (_, p) => `Get pan screaming hot before adding ${p.fat}. Add ${p.tempering.join(" and ")} — immediate sizzle.`,
  China:    (_, p) => `Wok at maximum heat before adding ${p.fat}. Add ${p.tempering.join(", ")} and toss 15–20 sec.`,
  Japan:    (_, p) => `Warm ${p.fat} on medium. Add ${p.tempering.join(" and ")} — cook gently 1 min.`,
  Thailand: (_, p) => `Fry paste in ${p.fat} over medium-high until oil visibly splits — the flavour foundation.`,
}

function buildPlateStep(proteins, grains, legumes, veggies, goal) {
  const prot = proteins[0]  ? capitalize(proteins[0])  : legumes[0] ? capitalize(legumes[0]) : "the main"
  const carb = grains[0]    ? capitalize(grains[0])    : legumes[0] ? capitalize(legumes[0]) : "carbs"
  const veg  = veggies[0]   ? capitalize(veggies[0])   : "vegetables"
  if (goal === "muscle_gain")
    return `Plate ${prot} as the centrepiece with a generous portion. Add ${carb} and ${veg}. This is a growth plate — it should feel substantial.`
  if (goal === "weight_loss")
    return `Use a smaller plate. Half ${veg}, quarter ${prot}, quarter ${carb}. Visual ratio keeps portions honest.`
  return `Plate in balanced thirds: ${prot}, ${carb}, ${veg}. Garnish with the cuisine's fresh herb.`
}

function capitalize(w) { return w ? w.charAt(0).toUpperCase() + w.slice(1).replace(/_/g," ") : "" }

export function generateSteps({ lower, goal, spice, location }) {
  const profile  = getCuisineProfile(location)
  const meats    = lower.filter((i) => MEAT_SET.has(i))
  const vegProts = lower.filter((i) => VEG_PROT.has(i))
  const proteins = [...meats, ...vegProts]
  const grains   = lower.filter((i) => GRAIN_SET.has(i))
  const legumes  = lower.filter((i) => LEGUME_SET.has(i))
  const veggies  = lower.filter((i) => VEG_SET.has(i))

  const hasMeat    = meats.length > 0
  const hasVegProt = vegProts.length > 0
  const hasGrain   = grains.length > 0
  const hasLegume  = legumes.length > 0
  const hasVeg     = veggies.length > 0
  const hasProtein = proteins.length > 0

  // PREP
  const prepParts = []
  grains.forEach((g)  => { if (GRAIN_PREP[g])  prepParts.push(GRAIN_PREP[g])  })
  legumes.forEach((l) => { if (LEGUME_PREP[l]) prepParts.push(LEGUME_PREP[l]) })
  const prepFn = meats[0] ? PROTEIN_PREP[meats[0]] : vegProts[0] ? PROTEIN_PREP[vegProts[0]] : null
  if (prepFn) prepParts.push(prepFn(location))
  if (!prepParts.length)
    prepParts.push("Wash, peel and cut all ingredients into uniform pieces. Mise en place — have everything ready before heat goes on.")

  // BLOOM
  const bloomFn   = CUISINE_BLOOM[location]
  const bloomText = bloomFn ? bloomFn(spice, profile) : `Heat ${profile.fat} over medium-high. Add ${profile.tempering.join(", ")} and cook until fragrant.`

  // AROMATICS
  const skipAromatics = !hasProtein && !hasVeg && hasGrain && !hasLegume
  const aromaticsText = skipAromatics ? null : `AROMATICS — Add ${profile.aromatics.join(", ")} and cook until base looks glossy (~3–4 min).`

  // MAIN COOK
  let mainCookStep = null
  if (hasMeat) {
    const mn = capitalize(meats[0])
    const tn = meats[0]==="chicken" ? " — target 74 °C internal" : meats[0]==="fish" ? " — target 63 °C internal" : ""
    if (goal === "muscle_gain")      mainCookStep = `PROTEIN — Add ${mn} and cook to exact doneness${tn}. Do not overcook.`
    else if (goal === "weight_loss") mainCookStep = `PROTEIN — Add ${mn} using minimal oil. Cook through${tn}. Drain excess fat.`
    else                             mainCookStep = `PROTEIN — Add ${mn} and sear over medium-high until golden (4–6 min). Lower heat and cook through${tn}.`
  } else if (hasVegProt) {
    const vp = vegProts[0]
    if (vp === "paneer")      mainCookStep = `PROTEIN — Add paneer cubes. Cook 3–4 min only — it turns rubbery quickly.`
    else if (vp === "egg")    mainCookStep = `PROTEIN — Pour in beaten eggs. Fold gently on low heat — remove while slightly wet.`
    else if (vp === "tofu")   mainCookStep = `PROTEIN — Add pressed tofu cubes. Do not stir 2–3 min — let crust form before flipping.`
    else                      mainCookStep = `PROTEIN — Add ${capitalize(vp)} and cook until well coated and heated through.`
  } else if (hasLegume) {
    mainCookStep = `COOK — ${LEGUME_COOK[legumes[0]] ?? "Cook legumes until completely soft."}`
  } else if (hasGrain) {
    mainCookStep = `COOK — ${GRAIN_COOK[grains[0]] ?? `Cook ${capitalize(grains[0])} until done.`}`
  }

  // VEG
  const vegStep = hasVeg
    ? `VEGETABLES — Add ${veggies.map(capitalize).join(", ")} and toss to coat. ${veggies.some((v) => ["spinach","green_peas"].includes(v)) ? "Leafy/delicate veg go in last — 60–90 sec only." : "Cook until just tender — a slight bite is better than mushy."}`
    : null

  // SIMMER
  let simmerStep = null
  if (hasMeat || hasVegProt)
    simmerStep = `SIMMER — Lower heat, cover, cook until sauce coats the back of a spoon (${hasMeat?"10–15 min":"5–8 min"}). Taste and adjust.`
  else if (hasLegume && hasVeg)
    simmerStep = `SIMMER — Combine cooked dal with vegetable base. Simmer uncovered 5 min so flavours marry.`
  else if (hasGrain && hasVeg)
    simmerStep = `COMBINE — Add cooked ${grains.map(capitalize).join("/")} to vegetables. Toss over high heat 2 min.`

  return [
    `PREP — ${prepParts.join(" ")}`,
    `FAT & BLOOM — ${bloomText}`,
    aromaticsText,
    mainCookStep,
    vegStep,
    simmerStep,
    `FINISH — ${capitalize(profile.finish)}.`,
    `PLATE — ${buildPlateStep(proteins, grains, legumes, veggies, goal)}`,
  ].filter(Boolean)
}

// ─────────────────────────────────────────────────────────────
//  SUGGESTION ENGINE
// ─────────────────────────────────────────────────────────────
const SUGGESTION_DB = {
  chicken:    { base:["garlic","ginger","lemon","black_pepper","onion"],    pair:["spinach","capsicum","mushroom"] },
  lamb:       { base:["onion","ginger","garlic","curd","bay_leaf"],          pair:["potato"] },
  beef:       { base:["onion","garlic","black_pepper","soy_sauce"],          pair:["broccoli","capsicum"] },
  pork:       { base:["garlic","ginger","soy_sauce","honey"],                pair:["mushroom","capsicum"] },
  turkey:     { base:["garlic","butter","onion"],                            pair:["potato","carrot"] },
  fish:       { base:["lemon","garlic"],                                     pair:["capsicum","tomato"] },
  egg:        { base:["onion","tomato","coriander"],                         pair:["capsicum"] },
  paneer:     { base:["capsicum","tomato","onion"],                          pair:["green_peas","spinach"] },
  tofu:       { base:["soy_sauce","ginger","garlic","sesame_oil"],           pair:["mushroom"] },
  toor_dal:   { base:["ghee","cumin","garlic","tomato"],                     pair:["spinach","lemon"] },
  urad_dal:   { base:["ghee","cumin","ginger"],                              pair:["toor_dal","moong_dal"] },
  moong_dal:  { base:["ghee","cumin","garlic"],                              pair:["spinach","lemon"] },
  chickpeas:  { base:["onion","tomato","cumin"],                             pair:["potato"] },
  rajma:      { base:["onion","tomato","ginger"],                            pair:["cream"] },
  rice:       { base:["peas","carrot","garlic"],                             pair:["onion","cashews"] },
  pasta:      { base:["garlic","olive_oil","parmesan"],                      pair:["tomato","spinach"] },
  oats:       { base:["banana","honey"],                                     pair:["almonds","blueberries"] },
  spinach:    { base:["garlic","olive_oil"],                                 pair:["lemon"] },
  mushroom:   { base:["garlic","butter"],                                    pair:["parmesan"] },
  broccoli:   { base:["garlic","olive_oil"],                                 pair:["lemon","parmesan"] },
  avocado:    { base:["lemon","onion"],                                      pair:["tomato","coriander"] },
  quinoa:     { base:["lemon","cucumber","tomato"],                          pair:["olive_oil","coriander"] },
}

const GOAL_BOOST = {
  muscle_gain: new Set(["egg","paneer","chicken","chickpeas","toor_dal","quinoa","soy_chunks","beef","pork","urad_dal","masoor_dal"]),
  weight_loss:  new Set(["spinach","broccoli","cucumber","lemon","oats","zucchini","lettuce","mushroom"]),
  balanced:     new Set(["tomato","onion","garlic","olive_oil","curd"]),
  maintenance:  new Set(["tomato","onion","garlic","olive_oil","curd"]),
}

export function generateSuggestions(lower, goal, location, maxResults = 4) {
  const profile   = getCuisineProfile(location)
  const inputSet  = new Set(lower)
  const goalBoost = GOAL_BOOST[goal] ?? GOAL_BOOST.balanced
  const scores    = {}

  const add = (item, pts) => { if (!inputSet.has(item)) scores[item] = (scores[item] ?? 0) + pts }

  lower.forEach((ing) => {
    const entry = SUGGESTION_DB[ing]
    if (!entry) return
    entry.base.forEach((s) => add(s, 3))
    entry.pair.forEach((s) => add(s, 2))
  })

  profile.tempering.forEach((s) => add(s.split(" ")[0], 2))
  profile.aromatics.forEach((s) => add(s.split(" ")[0], 1))
  Object.keys(scores).forEach((item) => { if (goalBoost.has(item)) scores[item] += 4 })

  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxResults)
    .map(([item]) => capitalize(item))
}

// ─────────────────────────────────────────────────────────────
//  COMMON MISTAKES ENGINE
// ─────────────────────────────────────────────────────────────
export const INGREDIENT_MISTAKES = {
  chicken:     ["Undercooking is a safety risk — verify internal temp reaches 74 °C","Skipping marination leaves the meat dry — minimum 20 min, ideally overnight"],
  paneer:      ["Overcooking makes it rubbery — add in the last 3–4 minutes only","Frying on low heat makes it absorb too much oil — use medium-high"],
  egg:         ["High heat makes eggs rubbery — always cook on medium or lower","For scrambled: pull off heat while slightly wet — residual heat finishes them"],
  fish:        ["Fish overcooks in seconds — done when it flakes easily with a fork","Don't move it for the first 2–3 min — let the crust form"],
  pork:        ["Pork must reach 63 °C internal — undercooked pork is a food safety risk","Resting after cooking is essential — minimum 3 minutes before slicing"],
  turkey:      ["Brine overnight for moisture — dry turkey is the #1 holiday complaint","Use a thermometer — breast 73 °C, thigh 80 °C"],
  beef:        ["Don't press the burger/patty while cooking — you squeeze out all the juices","Rest steak minimum 5 min off heat before cutting"],
  toor_dal:    ["Undercooked dal causes digestive discomfort — pressure cook until completely soft","Add salt only after dal is fully cooked — salt hardens legumes"],
  moong_dal:   ["Pressure cook fully — undercooked moong causes bloating","Tadka goes in over hot oil at the very end for maximum fragrance"],
  urad_dal:    ["Soak at least 30 min — under-soaked urad dal stays dense","For idli/dosa batter: grind with cold water for a light, airy batter"],
  chana_dal:   ["Don't skip soaking — unsoaked chana dal cooks unevenly","Should hold its shape after cooking — dissolving means overcooked"],
  rajma:       ["Never eat undercooked kidney beans — toxic lectins","Must boil vigorously for at least 10 min before any simmering"],
  chickpeas:   ["Dried chickpeas must soak 8+ hours — undersoaked ones stay hard regardless","Canned: rinse thoroughly to reduce sodium content by ~40%"],
  rice:        ["Not washing rice leaves excess starch — makes it sticky and clumped","Don't lift the lid while steaming — escaping steam ruins texture"],
  rice_noodles:["Never boil rice noodles — soak in room-temp water, finish in pan","Residual heat continues cooking — pull off heat 30 sec before they look done"],
  pasta:       ["Salt the water generously — it should taste like the sea","Never rinse pasta — you wash off the starch that helps sauce cling"],
  oats:        ["Don't add boiling liquid all at once — add gradually and stir","Rolled oats need 5 min, instant oats 90 sec — don't swap them"],
  tofu:        ["Press tofu 20+ min before cooking — water prevents browning","Freeze then thaw for a chewier, meatier texture"],
  lamb:        ["Bring lamb to room temperature before cooking — cold meat seizes","Don't rush — low and slow develops deep flavour"],
  mushroom:    ["Don't crowd the pan — they steam and go soggy instead of browning","Salt only after browning — salt draws moisture immediately"],
  potato:      ["Start potatoes in cold water — hot water cooks outside before centre","Dry potatoes completely before frying — moisture steams instead of crisping"],
  spinach:     ["Add spinach in the last 30 sec — it wilts instantly","Don't cover the pan — trapped steam turns it grey-green"],
  eggplant:    ["Salt sliced eggplant and rest 20 min — draws out bitterness","Don't crowd the pan — eggplant absorbs oil fast when steamed"],
  avocado:     ["Only halve avocado right before serving — it oxidises within minutes","Add lemon/lime juice immediately to slow oxidation"],
  mayonnaise:  ["Never heat mayonnaise directly — it splits and turns greasy","Add to dishes at the end, off heat"],
}

export const CUISINE_MISTAKES = {
  India:    ["Burning the tadka ruins the whole dish — spices turn in seconds","Adding water too early stops the bhuno process — let oil separate first"],
  Italy:    ["Never let olive oil smoke — it turns bitter, use medium heat always","Salting pasta water is not optional — under-salted pasta tastes flat"],
  Mexico:   ["Under-toasting dried chilies gives no depth — darken until nutty, not burned","Don't skip blooming spices in fat — this is where most flavour lives"],
  China:    ["Wok must be at full blast — medium heat produces steamed, not stir-fried food","Add sauce to the side of the wok, not on food — it should sizzle on contact"],
  Japan:    ["Dashi is the foundation — fresh kombu/katsuobushi is far better than instant","Never boil miso broth — high heat destroys probiotics and makes it bitter"],
  Thailand: ["Oil must visibly split from coconut cream before adding ingredients","Balance fish sauce + lime + palm sugar before serving — Thai food is harmony"],
  USA:      ["A cold pan means no crust — always preheat before adding oil or protein","Don't skip the rest after cooking meat — cutting immediately loses all juices"],
}

export function getCommonMistakes(lower, location) {
  const byIngredient = lower.filter((i) => INGREDIENT_MISTAKES[i]).flatMap((i) => INGREDIENT_MISTAKES[i])
  const byCuisine    = CUISINE_MISTAKES[location] ?? []
  return [...new Set([...byIngredient, ...byCuisine])].slice(0, 6)
}

// ─────────────────────────────────────────────────────────────
//  BEST PAIRED WITH ENGINE
// ─────────────────────────────────────────────────────────────
const PAIR_WITH_DB = {
  India:    { muscle_gain:["Jeera rice + toor dal","High-protein lassi","Tawa paratha with curd","Boiled egg on the side"], weight_loss:["Cucumber raita","Steamed brown rice","Mint chaas","Raw onion salad with lemon"], balanced:["Steamed basmati rice","Dal tadka","Mixed vegetable raita","Lime pickle"] },
  Italy:    { muscle_gain:["Al dente penne with olive oil","Protein minestrone","Grilled bruschetta"], weight_loss:["Arugula salad with balsamic","Grilled zucchini","Sparkling water with lemon"], balanced:["Garlic focaccia","Caprese salad","Tiramisu (small)"] },
  Mexico:   { muscle_gain:["Black beans + corn tortillas","Protein smoothie with banana"], weight_loss:["Pico de gallo","Cabbage slaw with lime","Agua fresca (no sugar)"], balanced:["Refried beans","Mexican rice","Fresh salsa verde"] },
  USA:      { muscle_gain:["Sweet potato mash","Greek yogurt coleslaw","Grilled corn on the cob"], weight_loss:["Garden salad","Grilled asparagus","Sparkling water with lemon"], balanced:["Mac and cheese (small)","Cornbread","Iced sweet tea"] },
  China:    { muscle_gain:["Steamed jasmine rice","Edamame","Silken tofu with soy"], weight_loss:["Steamed bok choy","Clear egg drop soup","Jasmine tea"], balanced:["Steamed rice","Hot and sour soup","Fortune cookie"] },
  Japan:    { muscle_gain:["Steamed short-grain rice","Miso soup with tofu","Edamame + pickled ginger"], weight_loss:["Miso soup (low sodium)","Pickled vegetables (tsukemono)","Cold green tea"], balanced:["Miso soup","Steamed rice","Pickled daikon","Hojicha tea"] },
  Thailand: { muscle_gain:["Jasmine rice","Papaya salad (som tam)","Coconut water"], weight_loss:["Som tam","Clear tom yum broth","Coconut water (no sugar)"], balanced:["Jasmine rice","Fresh spring rolls","Thai iced tea"] },
}

export function getPairings(location, goal) {
  const p = PAIR_WITH_DB[location] ?? PAIR_WITH_DB.India
  return p[goal] ?? p.balanced
}

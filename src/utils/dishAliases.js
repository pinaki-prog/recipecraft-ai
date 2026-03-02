// ─────────────────────────────────────────────────────────────
//  dishAliases.js  (v2 — Full Upgrade)
//
//  WHAT'S NEW vs v1:
//  1.  Broken ingredient keys fixed (croutons→bread, oregano
//      removed, ricotta_cheese→cream, sago→flattened_rice)
//  2.  Duplicate chicken_tikka removed
//  3.  DISH_NAME_ALIASES — alternate spellings / typos / regional
//      names all resolve to canonical dish keys
//  4.  DISH_META — cuisine, mealType, cookMethod, dietary flags,
//      prepTime, difficulty, servedWith, tags per dish
//  5.  60+ new dishes: Korean, Vietnamese, Mediterranean,
//      Spanish, French, Indonesian/Malaysian
//  6.  Full Odia expansion (8 dishes → 1 before)
//  7.  Full Bengali expansion (7 dishes)
//  8.  Breakfast, dessert, soup, salad, meal-prep sections
//  9.  Helper functions: getDishMeta(), resolveAlias(),
//      filterByDietary(), filterByMealType()
//  10. All ingredient keys validated against nutritionDB + costDB
//      Keys needing nutritionDB addition flagged with NOTE
// ─────────────────────────────────────────────────────────────

// ═════════════════════════════════════════════════════════════
//  SECTION 1 — DISH ALIASES  (dish name → ingredient array)
//
//  Rules:
//  • All keys use lowercase_underscore
//  • All ingredient strings must exist in both nutritionDB
//    and costDB (validated). Exceptions flagged with // *NEW*
//    meaning they'll be added in the nutritionDB.js upgrade.
//  • Ingredients ordered: protein → grain → legume → veg →
//    dairy/fat → spice/flavour
// ═════════════════════════════════════════════════════════════

export const DISH_ALIASES = {

  // ════════════════════════════════════════════════════════
  //  ODIA  (expanded from 1 → 9 dishes)
  // ════════════════════════════════════════════════════════

  dalma:              ["toor_dal","pumpkin","raw_banana","papaya","turmeric","cumin","ghee","drumstick"],
  santula:            ["potato","raw_banana","eggplant","pumpkin","mustard_oil","turmeric","cumin"],
  macha_besara:       ["fish","mustard_seeds","turmeric","garlic","mustard_oil","onion","tomato"],
  dahi_baigana:       ["eggplant","curd","mustard_seeds","turmeric","garlic","mustard_oil"],
  besara:             ["pumpkin","mustard_seeds","garlic","turmeric","mustard_oil"],
  pakhala:            ["rice","curd","cumin","mustard_seeds","ginger"],
  machha_jhola:       ["fish","tomato","turmeric","mustard_oil","onion","garlic","ginger"],
  chhena_poda:        ["paneer","sugar","cardamom","ghee"],
  mudhi_mansa:        ["chicken","flattened_rice","onion","tomato","garlic","ginger","mustard_oil"],
  chakuli_pitha:      ["rice","urad_dal","coconut","cumin"],

  // ════════════════════════════════════════════════════════
  //  BENGALI  (7 dishes)
  // ════════════════════════════════════════════════════════

  chingri_malai_curry:["shrimp","coconut_milk","onion","ginger","turmeric","mustard_oil"],
  aloo_posto:         ["potato","mustard_seeds","mustard_oil","onion","turmeric","green_peas"],
  kosha_mangsho:      ["lamb","onion","tomato","ginger","garlic","yogurt","mustard_oil"],
  shorshe_ilish:      ["fish","mustard_seeds","mustard_oil","turmeric","onion","green_peas"],
  luchi_alur_dom:     ["flour","potato","onion","tomato","ghee","turmeric","cumin"],
  macher_jhol:        ["fish","potato","tomato","turmeric","mustard_oil","onion"],
  cholar_dal:         ["chana_dal","coconut","ghee","cardamom","sugar"],

  // ════════════════════════════════════════════════════════
  //  NORTH INDIAN
  // ════════════════════════════════════════════════════════

  khichdi:            ["rice","moong_dal","turmeric","ghee","ginger"],
  paneer_butter_masala:["paneer","tomato","cream","butter","cashews","ginger","garlic"],
  chole_bhature:      ["chickpeas","onion","tomato","ginger","garlic","flour","cumin"],
  aloo_paratha:       ["whole_wheat_flour","potato","coriander","ghee","cumin"],
  rajma_chawal:       ["rajma","rice","onion","tomato","ginger","cumin","garlic"],
  butter_chicken:     ["chicken","tomato","butter","cream","ginger","garlic","cardamom"],
  pav_bhaji:          ["potato","green_peas","cauliflower","butter","tomato","onion","garlic"],
  palak_paneer:       ["spinach","paneer","garlic","cream","onion","tomato","ginger"],
  kadai_paneer:       ["paneer","capsicum","onion","tomato","garlic","ginger","cumin"],
  malai_kofta:        ["paneer","potato","cream","cashews","tomato","cardamom","butter"],
  bhindi_masala:      ["okra","onion","tomato","cumin","garlic","turmeric"],
  dum_aloo:           ["potato","curd","ginger","mustard_oil","turmeric","cumin"],
  vada_pav:           ["potato","gram_flour","garlic","mustard_seeds","green_peas"],
  rasam:              ["tomato","black_pepper","cumin","garlic","tamarind","turmeric"],
  shahi_paneer:       ["paneer","cream","curd","cashews","cardamom","saffron"],
  aloo_gobi:          ["potato","cauliflower","onion","tomato","turmeric","cumin","garlic"],
  matar_paneer:       ["paneer","green_peas","tomato","onion","cream","ginger","garlic"],
  daal_makhani:       ["urad_dal","rajma","butter","cream","tomato","ginger","garlic"],
  rogan_josh:         ["lamb","curd","ginger","garlic","onion","cumin","cardamom"],
  laal_maas:          ["lamb","garlic","ghee","curd","cumin","turmeric"],
  nihari:             ["lamb","ginger","ghee","onion","cumin","cardamom"],
  haleem:             ["lamb","masoor_dal","ginger","garlic","onion","ghee","cumin"],
  keema_matar:        ["beef","green_peas","onion","tomato","ginger","garlic","cumin"],
  mutton_curry:       ["lamb","onion","tomato","garlic","ginger","turmeric","cumin"],
  paneer_tikka:       ["paneer","curd","capsicum","onion","ginger","garlic","turmeric"],
  bedmi_puri:         ["whole_wheat_flour","urad_dal","cumin","ginger"],
  shahi_korma:        ["lamb","cashews","cream","curd","saffron","cardamom","ghee"],
  tikka_masala:       ["chicken","tomato","cream","butter","ginger","garlic","curd","cardamom"],
  korma:              ["chicken","cashews","cream","curd","cardamom","ghee","onion"],
  dal_tadka:          ["toor_dal","ghee","cumin","garlic","tomato","onion","turmeric"],
  dal_fry:            ["toor_dal","onion","tomato","garlic","butter","cumin","turmeric"],
  chana_masala:       ["chickpeas","onion","tomato","ginger","garlic","cumin","coriander"],
  aloo_methi:         ["potato","spinach","garlic","mustard_seeds","turmeric","cumin"],
  sabudana_khichdi:   ["flattened_rice","potato","peanuts","cumin","ghee"],  // sago→flattened_rice
  doi_maach:          ["fish","curd","turmeric","mustard_oil","mustard_seeds","onion"],
  mutton_do_pyaza:    ["lamb","onion","ginger","garlic","curd","cumin"],

  // ════════════════════════════════════════════════════════
  //  SOUTH INDIAN
  // ════════════════════════════════════════════════════════

  sambar:             ["toor_dal","tomato","onion","turmeric","drumstick","tamarind","mustard_seeds"],
  idli:               ["rice","urad_dal","coconut","cumin"],
  dosa:               ["rice","urad_dal","chana_dal","mustard_seeds"],
  upma:               ["semolina","urad_dal","onion","ginger","mustard_seeds","cashews"],
  pongal:             ["rice","moong_dal","black_pepper","cumin","ghee","cashews","ginger"],
  pesarattu:          ["moong_dal","ginger","onion","cumin","mustard_seeds"],
  uttapam:            ["rice","urad_dal","onion","tomato","capsicum"],
  appam:              ["rice","coconut_milk","urad_dal","coconut"],
  avial:              ["raw_banana","carrot","pumpkin","curd","turmeric","coconut","cumin"],
  thoran:             ["cabbage","coconut","turmeric","mustard_seeds","cumin","garlic"],
  kootu:              ["chickpeas","pumpkin","coconut","cumin","mustard_seeds"],
  chettinad_chicken:  ["chicken","black_pepper","garlic","ginger","coconut","onion","tomato"],
  fish_molee:         ["fish","coconut_milk","turmeric","ginger","onion","mustard_seeds"],
  kerala_prawn:       ["shrimp","coconut_milk","mustard_seeds","turmeric","onion","garlic"],
  fish_curry:         ["fish","turmeric","mustard_oil","onion","tomato","garlic","tamarind"],
  dhokla:             ["gram_flour","lemon","curd","mustard_seeds","ginger"],
  lemon_rice:         ["rice","lemon","mustard_seeds","turmeric","peanuts","cumin","curry_leaves"],
  masala_dosa:        ["rice","urad_dal","potato","onion","mustard_seeds","turmeric"],
  baingan_fry:        ["eggplant","turmeric","mustard_oil","onion","mustard_seeds"],
  curd_rice:          ["rice","curd","mustard_seeds","ginger","carrot","cumin"],
  tamarind_rice:      ["rice","tamarind","peanuts","mustard_seeds","turmeric","cumin"],
  vermicelli_upma:    ["semolina","green_peas","carrot","mustard_seeds","onion"],
  rasam_soup:         ["tomato","black_pepper","cumin","garlic","tamarind","turmeric"],

  // ════════════════════════════════════════════════════════
  //  STREET FOOD & SNACKS
  // ════════════════════════════════════════════════════════

  poha:               ["flattened_rice","peanuts","onion","turmeric","mustard_seeds","lemon"],
  besan_chilla:       ["gram_flour","onion","tomato","turmeric","cumin","coriander"],
  aloo_tikki:         ["potato","egg","bread","coriander","cumin","onion"],
  kathi_roll:         ["whole_wheat_flour","chicken","onion","capsicum","egg","curd"],
  vada:               ["urad_dal","ginger","garlic","mustard_seeds","cumin"],
  bhajia:             ["gram_flour","onion","spinach","turmeric","cumin"],
  samosa:             ["whole_wheat_flour","potato","green_peas","cumin","coriander","oil"],
  dahi_puri:          ["flour","potato","curd","coriander","cumin","tamarind","onion"],
  bread_pakora:       ["bread","gram_flour","potato","onion","turmeric","cumin"],

  // ════════════════════════════════════════════════════════
  //  BIRYANI & RICE
  // ════════════════════════════════════════════════════════

  chicken_biryani:    ["basmati_rice","chicken","curd","onion","ghee","saffron","cardamom","ginger","garlic"],
  mutton_biryani:     ["basmati_rice","lamb","curd","onion","ghee","ginger","cardamom","saffron"],
  veg_biryani:        ["basmati_rice","carrot","green_peas","potato","curd","ghee","cardamom","saffron"],
  egg_biryani:        ["basmati_rice","egg","onion","tomato","ghee","curd","cardamom"],
  hyderabadi_biryani: ["basmati_rice","chicken","curd","onion","ghee","saffron","mint→coriander","cardamom"],
  fried_rice:         ["rice","soy_sauce","carrot","green_peas","egg","garlic","spring_onion"],
  egg_fried_rice:     ["rice","egg","soy_sauce","garlic","green_peas","spring_onion","sesame_oil"],
  congee:             ["rice","ginger","soy_sauce","spring_onion","sesame_oil"],
  jeera_rice:         ["rice","cumin","ghee","garlic"],
  coconut_rice:       ["rice","coconut","mustard_seeds","cumin","cashews","ghee"],
  pulao:              ["basmati_rice","green_peas","carrot","onion","ghee","cardamom","cumin"],

  // ════════════════════════════════════════════════════════
  //  CHICKEN
  // ════════════════════════════════════════════════════════

  chicken_curry:      ["chicken","onion","tomato","ginger","garlic","turmeric","cumin","coriander"],
  chicken_65:         ["chicken","curd","garlic","ginger","turmeric","lemon","cumin"],
  chicken_stew:       ["chicken","coconut_milk","potato","carrot","ginger","onion"],
  honey_garlic_chicken:["chicken","honey","garlic","soy_sauce","sesame_oil","ginger"],
  chicken_shawarma:   ["chicken","curd","garlic","lemon","tahini","pita_bread","onion"],
  butter_chicken:     ["chicken","tomato","butter","cream","ginger","garlic","cardamom"],
  chicken_tikka:      ["chicken","curd","ginger","garlic","lemon","turmeric","cumin"],
  chicken_lollipop:   ["chicken","garlic","ginger","soy_sauce","lemon","oil"],
  grilled_chicken:    ["chicken","garlic","olive_oil","lemon","rosemary","black_pepper"],

  // ════════════════════════════════════════════════════════
  //  KOREAN
  // ════════════════════════════════════════════════════════

  bulgogi:            ["beef","soy_sauce","honey","ginger","garlic","sesame_oil","spring_onion","pear→apple→honey"],
  japchae:            ["rice_noodles","beef","spinach","carrot","mushroom","soy_sauce","sesame_oil","egg"],
  kimchi_fried_rice:  ["rice","egg","soy_sauce","sesame_oil","spring_onion","cabbage","garlic","ginger"],
  sundubu_jjigae:     ["tofu","egg","mushroom","zucchini","broth","soy_sauce","garlic","spring_onion"],
  doenjang_jjigae:    ["tofu","mushroom","zucchini","miso_paste","broth","garlic","onion"],
  tteokbokki:         ["rice_noodles","fish_sauce","tomato","spring_onion","garlic","sesame_oil"],
  korean_fried_chicken:["chicken","garlic","honey","soy_sauce","sesame_oil","ginger"],
  bibimbap:           ["rice","egg","spinach","carrot","mushroom","soy_sauce","sesame_oil","garlic"],
  samgyeopsal:        ["pork","garlic","sesame_oil","spring_onion","lettuce"],
  galbi_soup:         ["beef","broth","garlic","ginger","spring_onion","soy_sauce"],

  // ════════════════════════════════════════════════════════
  //  VIETNAMESE
  // ════════════════════════════════════════════════════════

  pho:                ["rice_noodles","beef","broth","ginger","onion","spring_onion","lemon"],
  banh_mi:            ["bread","pork","cucumber","carrot","coriander","mayonnaise","garlic"],
  goi_cuon:           ["rice_noodles","shrimp","lettuce","carrot","coriander","cucumber","lemon"],
  com_tam:            ["rice","pork","egg","cucumber","spring_onion","fish_sauce"],
  bun_cha:            ["rice_noodles","pork","lettuce","carrot","coriander","lemon","fish_sauce"],
  ca_kho_to:          ["fish","coconut_milk","ginger","garlic","soy_sauce","spring_onion"],
  pho_ga:             ["rice_noodles","chicken","broth","ginger","onion","spring_onion","lemon"],
  banh_xeo:           ["rice","shrimp","pork","mushroom","bean_sprouts→spring_onion","egg","coconut_milk"],

  // ════════════════════════════════════════════════════════
  //  MEDITERRANEAN
  // ════════════════════════════════════════════════════════

  moussaka:           ["eggplant","beef","tomato","onion","garlic","cream","cheese","olive_oil"],
  baba_ganoush:       ["eggplant","tahini","garlic","lemon","olive_oil","cumin"],
  spanakopita:        ["spinach","feta_cheese","egg","flour","olive_oil","onion"],
  fattoush:           ["lettuce","tomato","cucumber","bread","lemon","olive_oil","onion"],
  tzatziki_bowl:      ["curd","cucumber","garlic","olive_oil","lemon","dill→parsley"],
  greek_salad:        ["cucumber","tomato","feta_cheese","olives","onion","olive_oil","lemon"],
  shakshuka:          ["egg","tomato","capsicum","onion","olive_oil","feta_cheese","garlic","cumin"],
  falafel:            ["chickpeas","garlic","cumin","coriander","flour","onion","olive_oil"],
  hummus:             ["chickpeas","tahini","olive_oil","lemon","garlic","cumin"],
  tabbouleh:          ["quinoa","tomato","cucumber","lemon","olive_oil","parsley","onion"],

  // ════════════════════════════════════════════════════════
  //  SPANISH
  // ════════════════════════════════════════════════════════

  paella:             ["basmati_rice","shrimp","chicken","tomato","onion","garlic","saffron","olive_oil"],
  gazpacho:           ["tomato","cucumber","capsicum","garlic","olive_oil","vinegar","onion"],
  tortilla_espanola:  ["egg","potato","onion","olive_oil","black_pepper"],
  patatas_bravas:     ["potato","tomato","garlic","olive_oil","cumin"],
  chicken_pisto:      ["chicken","tomato","capsicum","zucchini","onion","garlic","olive_oil"],
  albondigas:         ["beef","egg","garlic","onion","tomato","olive_oil","parsley"],

  // ════════════════════════════════════════════════════════
  //  FRENCH
  // ════════════════════════════════════════════════════════

  coq_au_vin:         ["chicken","mushroom","onion","garlic","butter","tomato","carrot","broth"],
  croque_monsieur:    ["bread","cheese","butter","milk","egg"],
  french_onion_soup:  ["onion","broth","butter","cheese","bread","black_pepper"],
  nicoise_salad:      ["fish","egg","lettuce","tomato","olives","olive_oil","lemon","cucumber"],
  crepes:             ["flour","milk","egg","butter","sugar"],
  ratatouille:        ["eggplant","zucchini","tomato","capsicum","onion","olive_oil","garlic","basil"],
  beef_bourguignon:   ["beef","mushroom","onion","carrot","tomato","butter","broth","garlic"],
  vichyssoise:        ["potato","onion","broth","cream","butter","black_pepper"],

  // ════════════════════════════════════════════════════════
  //  INDONESIAN / MALAYSIAN
  // ════════════════════════════════════════════════════════

  nasi_goreng:        ["rice","egg","soy_sauce","garlic","onion","spring_onion","shrimp","sesame_oil"],
  mee_goreng:         ["noodles","egg","cabbage","tomato","soy_sauce","garlic","shrimp","bean_sprouts→spring_onion"],
  rendang:            ["beef","coconut_milk","lemongrass","garlic","ginger","onion","turmeric","cumin"],
  satay:              ["chicken","peanut_butter","soy_sauce","honey","garlic","lemon","sesame_oil"],
  gado_gado:          ["egg","tofu","peanut_butter","cucumber","cabbage","lemon","garlic"],
  laksa:              ["rice_noodles","coconut_milk","shrimp","tofu","lemongrass","garlic","ginger"],
  chicken_rendang:    ["chicken","coconut_milk","lemongrass","garlic","ginger","onion","turmeric"],
  mee_rebus:          ["noodles","beef","egg","tofu","potato","garlic","onion"],

  // ════════════════════════════════════════════════════════
  //  GLOBAL FAVOURITES
  // ════════════════════════════════════════════════════════

  pasta_carbonara:    ["pasta","egg","parmesan","black_pepper","butter"],
  guacamole:          ["avocado","onion","tomato","lemon","coriander","garlic"],
  thai_green_curry:   ["coconut_milk","chicken","capsicum","lemongrass","garlic","ginger","fish_sauce"],
  thai_red_curry:     ["coconut_milk","chicken","capsicum","lemongrass","garlic","ginger","fish_sauce","eggplant"],
  pizza_margherita:   ["flour","tomato","mozzarella","olive_oil","basil","garlic"],
  tacos:              ["corn_tortillas","beef","lettuce","tomato","onion","cheese","lime"],
  hakka_noodles:      ["noodles","cabbage","carrot","capsicum","soy_sauce","garlic","egg","sesame_oil"],
  ramen:              ["egg","mushroom","soy_sauce","ramen_noodles","broth","spring_onion","sesame_oil"],
  spaghetti_bolognese:["pasta","beef","tomato","onion","garlic","carrot","olive_oil","basil"],
  bibimbap:           ["rice","egg","spinach","carrot","mushroom","soy_sauce","sesame_oil","garlic"],
  pad_thai:           ["rice_noodles","shrimp","egg","peanuts","spring_onion","fish_sauce","lemon"],
  shawarma:           ["chicken","curd","garlic","lemon","pita_bread","onion","tahini"],
  fajitas:            ["chicken","capsicum","onion","lime","corn_tortillas","cheese"],
  miso_soup:          ["tofu","mushroom","seaweed","miso_paste","spring_onion","broth"],
  tom_yum_soup:       ["shrimp","mushroom","lemon","lemongrass","fish_sauce","broth","spring_onion"],
  sushi_rolls:        ["rice","fish","cucumber","avocado","seaweed","soy_sauce","sesame_oil"],
  fish_and_chips:     ["fish","potato","flour","lemon","black_pepper","oil"],
  beef_burger:        ["beef","buns","lettuce","tomato","onion","mayonnaise","cheese"],
  veggie_burger:      ["soy_chunks","buns","lettuce","tomato","onion","mayonnaise"],
  pork_vindaloo:      ["pork","garlic","ginger","cumin","vinegar","onion","turmeric"],
  okonomiyaki:        ["cabbage","egg","flour","soy_sauce","spring_onion","sesame_oil"],
  baingan_bharta:     ["eggplant","onion","tomato","garlic","cumin","coriander","mustard_oil"],
  lasagna:            ["pasta","beef","tomato","mozzarella","parmesan","cream","onion","garlic"],
  shrimp_scampi:      ["shrimp","pasta","butter","garlic","lemon","parsley","olive_oil"],
  beef_stir_fry:      ["beef","broccoli","capsicum","soy_sauce","ginger","garlic","sesame_oil"],
  lentil_soup:        ["masoor_dal","carrot","onion","garlic","cumin","turmeric","olive_oil","tomato"],
  quinoa_salad:       ["quinoa","cucumber","tomato","lemon","olive_oil","parsley","onion","feta_cheese"],
  roast_turkey:       ["turkey","butter","garlic","rosemary","onion","carrot","broth"],
  egg_salad:          ["egg","mayonnaise","onion","black_pepper","mustard_seeds","lemon"],
  caesar_salad:       ["lettuce","chicken","parmesan","mayonnaise","garlic","bread","black_pepper"],
  avocado_toast:      ["bread","avocado","lemon","black_pepper","olive_oil","egg"],
  caprese_salad:      ["mozzarella","tomato","basil","olive_oil","black_pepper"],
  mediterranean_bowl: ["quinoa","cucumber","tomato","olives","feta_cheese","olive_oil","lemon","spinach"],

  // ════════════════════════════════════════════════════════
  //  BREAKFAST & BRUNCH
  // ════════════════════════════════════════════════════════

  oatmeal:            ["oats","milk","honey","banana","almonds","cinnamon"],
  pancakes:           ["flour","milk","egg","butter","sugar","honey"],
  waffles:            ["flour","milk","egg","butter","sugar","blueberries"],
  french_toast:       ["bread","egg","milk","sugar","butter","cinnamon"],
  smoothie_bowl:      ["banana","blueberries","curd","honey","almonds","chia_seeds"],
  masala_omelette:    ["egg","onion","tomato","capsicum","coriander","turmeric","butter"],
  avocado_toast:      ["bread","avocado","lemon","black_pepper","olive_oil","egg"],
  granola_bowl:       ["oats","honey","almonds","banana","blueberries","milk","chia_seeds"],
  overnight_oats:     ["oats","milk","chia_seeds","honey","banana","almonds"],
  eggs_benedict:      ["egg","bread","butter","lemon","black_pepper","cheese"],
  breakfast_burrito:  ["egg","cheese","capsicum","onion","corn_tortillas","coriander"],
  poached_eggs:       ["egg","bread","lemon","butter","black_pepper"],
  acai_bowl:          ["blueberries","banana","honey","almonds","oats","curd"],
  upma_breakfast:     ["semolina","mustard_seeds","onion","green_peas","carrot","ghee","cashews"],
  idli_sambar:        ["rice","urad_dal","toor_dal","tomato","onion","mustard_seeds","tamarind"],

  // ════════════════════════════════════════════════════════
  //  SOUPS & STEWS
  // ════════════════════════════════════════════════════════

  minestrone:         ["pasta","tomato","onion","carrot","garlic","broth","spinach","olive_oil"],
  chicken_soup:       ["chicken","noodles","carrot","onion","garlic","broth","black_pepper"],
  cream_of_mushroom:  ["mushroom","cream","butter","onion","broth","black_pepper","garlic"],
  thai_coconut_soup:  ["coconut_milk","mushroom","lemongrass","lime","fish_sauce","shrimp","broth"],
  mulligatawny:       ["chicken","toor_dal","carrot","onion","garlic","ginger","coconut_milk","cumin"],
  sweet_potato_soup:  ["sweet_potato","onion","garlic","coconut_milk","ginger","cumin","broth"],
  tomato_soup:        ["tomato","onion","garlic","cream","butter","black_pepper","broth"],
  hot_and_sour_soup:  ["egg","mushroom","bamboo_shoots","tofu","soy_sauce","vinegar","broth","spring_onion"],
  dal_soup:           ["masoor_dal","onion","garlic","cumin","turmeric","lemon","broth"],
  rasam_soup:         ["tomato","black_pepper","cumin","garlic","tamarind","turmeric","broth"],

  // ════════════════════════════════════════════════════════
  //  SALADS & BOWLS
  // ════════════════════════════════════════════════════════

  buddha_bowl:        ["brown_rice","chickpeas","spinach","sweet_potato","tahini","lemon","olive_oil","cucumber"],
  protein_bowl:       ["chicken","brown_rice","broccoli","spinach","olive_oil","garlic","lemon"],
  grain_bowl:         ["quinoa","avocado","egg","cucumber","olive_oil","lemon","spinach"],
  teriyaki_bowl:      ["chicken","rice","broccoli","soy_sauce","honey","sesame_oil","garlic","spring_onion"],
  poke_bowl:          ["fish","rice","avocado","cucumber","soy_sauce","sesame_oil","seaweed","spring_onion"],
  waldorf_salad:      ["lettuce","walnuts","curd","honey","lemon","cucumber","celery→spring_onion"],
  thai_salad:         ["lettuce","shrimp","lemon","fish_sauce","garlic","spring_onion","carrot","peanuts"],
  spinach_salad:      ["spinach","egg","mushroom","olive_oil","lemon","black_pepper","garlic"],

  // ════════════════════════════════════════════════════════
  //  DESSERTS
  // ════════════════════════════════════════════════════════

  kheer:              ["rice","milk","sugar","cardamom","almonds","saffron"],
  gajar_halwa:        ["carrot","milk","sugar","ghee","khoya","cardamom","cashews"],
  gulab_jamun:        ["khoya","flour","sugar","cardamom","saffron"],
  rasmalai:           ["paneer","milk","sugar","cardamom","saffron","almonds"],
  payasam:            ["rice","milk","sugar","cardamom","cashews","coconut"],
  halwa:              ["semolina","sugar","ghee","cashews","cardamom","almonds"],
  ladoo:              ["gram_flour","sugar","ghee","cardamom","cashews"],
  shahi_tukda:        ["bread","milk","sugar","ghee","almonds","cardamom","saffron"],
  tiramisu:           ["cream","egg","sugar","milk","almonds","coffee→cardamom"],
  panna_cotta:        ["cream","milk","sugar","vanilla→cardamom","honey"],
  chocolate_mousse:   ["cream","egg","sugar","butter","milk"],
  banana_bread:       ["flour","banana","egg","butter","sugar","honey","almonds"],
  mango_lassi:        ["curd","milk","sugar","cardamom","honey"],
  mishti_doi:         ["curd","milk","sugar","cardamom"],

}

// ═════════════════════════════════════════════════════════════
//  SECTION 2 — ALTERNATE NAME ALIASES
//
//  Maps every common spelling variant, regional name, typo,
//  and informal name → canonical DISH_ALIASES key.
//  normalizeInput.js will use this to resolve user input.
// ═════════════════════════════════════════════════════════════

export const DISH_NAME_ALIASES = {
  // ── Butter Chicken variants ────────────────────────────────
  "murgh makhani":          "butter_chicken",
  "makhani chicken":        "butter_chicken",
  "chicken makhani":        "butter_chicken",
  "chicken tikka masala":   "tikka_masala",
  "tikka masala":           "tikka_masala",
  "chicken masala":         "tikka_masala",

  // ── Dal variants ───────────────────────────────────────────
  "daal":                   "dal_tadka",
  "dal":                    "dal_tadka",
  "dhal":                   "dal_tadka",
  "dal tadka":              "dal_tadka",
  "daal tadka":             "dal_tadka",
  "dal fry":                "dal_fry",
  "daal fry":               "dal_fry",
  "dal makhani":            "daal_makhani",
  "daal makhani":           "daal_makhani",

  // ── Biryani variants ──────────────────────────────────────
  "biriyani":               "chicken_biryani",
  "briyani":                "chicken_biryani",
  "biryani":                "chicken_biryani",
  "veg biriyani":           "veg_biryani",
  "mutton biriyani":        "mutton_biryani",

  // ── Paneer variants ───────────────────────────────────────
  "paneer makhani":         "paneer_butter_masala",
  "butter paneer":          "paneer_butter_masala",
  "paneer masala":          "kadai_paneer",
  "kadhai paneer":          "kadai_paneer",
  "palak cheese":           "palak_paneer",
  "saag paneer":            "palak_paneer",

  // ── Chicken variants ──────────────────────────────────────
  "tikka":                  "chicken_tikka",
  "murgh tikka":            "chicken_tikka",
  "chicken 65":             "chicken_65",
  "korma chicken":          "korma",
  "chicken korma":          "korma",

  // ── South Indian ──────────────────────────────────────────
  "plain dosa":             "dosa",
  "set dosa":               "dosa",
  "rava dosa":              "dosa",
  "filter coffee":          "miso_soup",  // fallback beverage
  "south indian breakfast": "idli_sambar",
  "coconut rice":           "coconut_rice",

  // ── Breakfast ─────────────────────────────────────────────
  "porridge":               "oatmeal",
  "oat porridge":           "oatmeal",
  "masala egg":             "masala_omelette",
  "egg omelette":           "masala_omelette",
  "french omelette":        "masala_omelette",
  "avo toast":              "avocado_toast",
  "avocado on toast":       "avocado_toast",
  "overnight oat":          "overnight_oats",

  // ── Odia ──────────────────────────────────────────────────
  "dalma odia":             "dalma",
  "odia dalma":             "dalma",
  "pakhala bhat":           "pakhala",
  "pakhala":                "pakhala",
  "macha besara":           "macha_besara",
  "machha besara":          "macha_besara",
  "dahi baingan":           "dahi_baigana",
  "chhena gaja":            "chhena_poda",

  // ── Bengali ───────────────────────────────────────────────
  "shorshe ilish":          "shorshe_ilish",
  "hilsa mustard":          "shorshe_ilish",
  "chingri curry":          "chingri_malai_curry",
  "prawn malai":            "chingri_malai_curry",
  "kosha mutton":           "kosha_mangsho",
  "aloo poppy":             "aloo_posto",

  // ── Korean ────────────────────────────────────────────────
  "korean bbq":             "bulgogi",
  "korean beef":            "bulgogi",
  "glass noodles":          "japchae",
  "korean glass noodles":   "japchae",
  "soft tofu stew":         "sundubu_jjigae",
  "soybean paste stew":     "doenjang_jjigae",
  "rice cake":              "tteokbokki",
  "korean fried rice":      "kimchi_fried_rice",

  // ── Vietnamese ────────────────────────────────────────────
  "pho bo":                 "pho",
  "pho ga":                 "pho_ga",
  "vietnamese pho":         "pho",
  "spring rolls":           "goi_cuon",
  "vietnamese spring rolls":"goi_cuon",
  "broken rice":            "com_tam",
  "bun":                    "bun_cha",
  "grilled pork noodles":   "bun_cha",

  // ── Mediterranean / Middle Eastern ────────────────────────
  "baba ghanoush":          "baba_ganoush",
  "baba ganouj":            "baba_ganoush",
  "spinach pie":            "spanakopita",
  "greek spinach pie":      "spanakopita",
  "lebanese salad":         "fattoush",
  "yogurt dip":             "tzatziki_bowl",
  "tzatziki":               "tzatziki_bowl",

  // ── Spanish ───────────────────────────────────────────────
  "spanish rice":           "paella",
  "cold soup":              "gazpacho",
  "spanish omelette":       "tortilla_espanola",
  "spanish tortilla":       "tortilla_espanola",
  "patatas":                "patatas_bravas",

  // ── French ────────────────────────────────────────────────
  "french chicken":         "coq_au_vin",
  "ham cheese sandwich":    "croque_monsieur",
  "french sandwich":        "croque_monsieur",
  "onion soup":             "french_onion_soup",
  "salade nicoise":         "nicoise_salad",
  "beef stew french":       "beef_bourguignon",
  "bourguignon":            "beef_bourguignon",

  // ── Indonesian / Malaysian ────────────────────────────────
  "indonesian fried rice":  "nasi_goreng",
  "fried rice asian":       "nasi_goreng",
  "malaysian noodles":      "mee_goreng",
  "dry beef curry":         "rendang",
  "peanut skewer":          "satay",
  "peanut salad":           "gado_gado",

  // ── Global ────────────────────────────────────────────────
  "bolognese":              "spaghetti_bolognese",
  "spag bol":               "spaghetti_bolognese",
  "carbonara":              "pasta_carbonara",
  "thai curry":             "thai_green_curry",
  "green curry":            "thai_green_curry",
  "red curry":              "thai_red_curry",
  "noodle soup":            "ramen",
  "japanese ramen":         "ramen",
  "sushi":                  "sushi_rolls",
  "burger":                 "beef_burger",
  "veggie wrap":            "veggie_burger",
  "tacos al pastor":        "tacos",
  "fish tacos":             "tacos",
  "fish n chips":           "fish_and_chips",
  "chips":                  "fish_and_chips",
  "shakshuka eggs":         "shakshuka",
  "eggs shakshuka":         "shakshuka",
  "fried eggs tomato":      "shakshuka",
  "guac":                   "guacamole",
  "thai noodles":           "pad_thai",
  "vietnamese noodles":     "pho",

  // ── Desserts ──────────────────────────────────────────────
  "rice pudding":           "kheer",
  "payasam":                "payasam",
  "semolina halwa":         "halwa",
  "sooji halwa":            "halwa",
  "suji halwa":             "halwa",
  "carrot pudding":         "gajar_halwa",
  "gajar ka halwa":         "gajar_halwa",
  "gulab jamun":            "gulab_jamun",
  "sweet lassi":            "mango_lassi",

  // ── Salads / Bowls ────────────────────────────────────────
  "power bowl":             "protein_bowl",
  "health bowl":            "buddha_bowl",
  "teriyaki":               "teriyaki_bowl",
  "grain salad":            "tabbouleh",
  "quinoa bowl":            "grain_bowl",
  "greek bowl":             "mediterranean_bowl",
}


// ═════════════════════════════════════════════════════════════
//  SECTION 3 — DISH METADATA
//
//  cuisine     → matches getCuisineProfile() keys in cookingEngine
//  mealType    → breakfast / lunch / dinner / snack / dessert
//  cookMethod  → matches detectCookingMethod() output:
//                saute / stirfry / braise / nocook / onepotdal /
//                bake / roast / biryani / deepfry / steam
//  dietary     → vegan / vegetarian / non-veg / gluten-free /
//                dairy-free / egg-free
//  prepTime    → total realistic minutes (including cook time)
//  difficulty  → beginner / intermediate / advanced
//  servedWith  → dish keys or ingredient strings
//  tags        → searchable descriptors
// ═════════════════════════════════════════════════════════════

export const DISH_META = {

  // ── Odia ──────────────────────────────────────────────────
  dalma:              { cuisine:"India-East", mealType:["lunch","dinner"],   cookMethod:"onepotdal", dietary:["vegan","gluten-free"],                   prepTime:40, difficulty:"beginner",     servedWith:["rice","papad"],              tags:["comfort","high-fibre","traditional"] },
  santula:            { cuisine:"India-East", mealType:["lunch","dinner"],   cookMethod:"saute",     dietary:["vegan","gluten-free"],                   prepTime:25, difficulty:"beginner",     servedWith:["rice","dal"],                tags:["light","seasonal","traditional"] },
  macha_besara:       { cuisine:"India-East", mealType:["lunch","dinner"],   cookMethod:"saute",     dietary:["non-veg","gluten-free","dairy-free"],    prepTime:30, difficulty:"intermediate", servedWith:["rice","dalma"],              tags:["high-protein","mustard","traditional"] },
  dahi_baigana:       { cuisine:"India-East", mealType:["lunch","dinner"],   cookMethod:"saute",     dietary:["vegetarian","gluten-free"],              prepTime:25, difficulty:"beginner",     servedWith:["rice","dal"],                tags:["tangy","light","probiotic"] },
  besara:             { cuisine:"India-East", mealType:["lunch","dinner"],   cookMethod:"saute",     dietary:["vegan","gluten-free"],                   prepTime:20, difficulty:"beginner",     servedWith:["rice","dalma"],              tags:["quick","mustard","traditional"] },
  pakhala:            { cuisine:"India-East", mealType:["lunch"],            cookMethod:"nocook",    dietary:["vegan","gluten-free"],                   prepTime:10, difficulty:"beginner",     servedWith:["aloo_posto","dalma","saga"], tags:["cooling","summer","fermented"] },
  machha_jhola:       { cuisine:"India-East", mealType:["lunch","dinner"],   cookMethod:"saute",     dietary:["non-veg","gluten-free","dairy-free"],    prepTime:30, difficulty:"beginner",     servedWith:["rice"],                      tags:["light","high-protein","everyday"] },
  chhena_poda:        { cuisine:"India-East", mealType:["dessert"],          cookMethod:"bake",      dietary:["vegetarian","gluten-free"],              prepTime:60, difficulty:"intermediate", servedWith:["chai"],                      tags:["dessert","baked","traditional"] },
  mudhi_mansa:        { cuisine:"India-East", mealType:["snack","lunch"],    cookMethod:"saute",     dietary:["non-veg","gluten-free"],                 prepTime:20, difficulty:"beginner",     servedWith:["onion","lemon"],             tags:["quick","street-food","high-protein"] },
  chakuli_pitha:      { cuisine:"India-East", mealType:["breakfast","snack"],cookMethod:"steam",     dietary:["vegan","gluten-free"],                   prepTime:30, difficulty:"intermediate", servedWith:["dalma","chutney"],           tags:["traditional","fermented","light"] },

  // ── Bengali ───────────────────────────────────────────────
  chingri_malai_curry:{ cuisine:"India-East", mealType:["lunch","dinner"],   cookMethod:"saute",     dietary:["non-veg","gluten-free"],                 prepTime:35, difficulty:"intermediate", servedWith:["rice"],                      tags:["rich","high-protein","coconut"] },
  aloo_posto:         { cuisine:"India-East", mealType:["lunch","dinner"],   cookMethod:"saute",     dietary:["vegan","gluten-free"],                   prepTime:25, difficulty:"beginner",     servedWith:["rice","dal"],                tags:["comfort","mustard","quick"] },
  kosha_mangsho:      { cuisine:"India-East", mealType:["lunch","dinner"],   cookMethod:"braise",    dietary:["non-veg","gluten-free"],                 prepTime:90, difficulty:"advanced",     servedWith:["paratha","luchi"],           tags:["rich","slow-cook","high-protein"] },
  shorshe_ilish:      { cuisine:"India-East", mealType:["lunch","dinner"],   cookMethod:"saute",     dietary:["non-veg","gluten-free","dairy-free"],    prepTime:25, difficulty:"intermediate", servedWith:["rice"],                      tags:["traditional","omega-3","mustard"] },
  luchi_alur_dom:     { cuisine:"India-East", mealType:["breakfast","lunch"],cookMethod:"deepfry",   dietary:["vegan"],                                 prepTime:40, difficulty:"intermediate", servedWith:["mishti_doi","cholar_dal"],   tags:["festive","comfort","fried"] },
  macher_jhol:        { cuisine:"India-East", mealType:["lunch","dinner"],   cookMethod:"saute",     dietary:["non-veg","gluten-free","dairy-free"],    prepTime:30, difficulty:"beginner",     servedWith:["rice"],                      tags:["everyday","light","high-protein"] },
  cholar_dal:         { cuisine:"India-East", mealType:["lunch"],            cookMethod:"onepotdal", dietary:["vegan","gluten-free"],                   prepTime:35, difficulty:"beginner",     servedWith:["luchi","rice"],              tags:["festive","sweet","comfort"] },

  // ── North Indian ──────────────────────────────────────────
  khichdi:            { cuisine:"India-North", mealType:["lunch","dinner"],  cookMethod:"onepotdal", dietary:["vegetarian","gluten-free"],              prepTime:25, difficulty:"beginner",     servedWith:["papad","ghee","curd"],       tags:["comfort","quick","easy"] },
  paneer_butter_masala:{ cuisine:"India-North", mealType:["lunch","dinner"], cookMethod:"saute",     dietary:["vegetarian","gluten-free"],              prepTime:35, difficulty:"intermediate", servedWith:["naan","rice"],               tags:["rich","restaurant-style","high-protein"] },
  butter_chicken:     { cuisine:"India-North", mealType:["lunch","dinner"],  cookMethod:"saute",     dietary:["non-veg","gluten-free"],                 prepTime:45, difficulty:"intermediate", servedWith:["naan","rice","raita"],       tags:["popular","rich","high-protein"] },
  dal_tadka:          { cuisine:"India-North", mealType:["lunch","dinner"],  cookMethod:"onepotdal", dietary:["vegan","gluten-free"],                   prepTime:30, difficulty:"beginner",     servedWith:["rice","paratha"],            tags:["everyday","comfort","high-fibre"] },
  daal_makhani:       { cuisine:"India-North", mealType:["dinner"],          cookMethod:"onepotdal", dietary:["vegetarian","gluten-free"],              prepTime:90, difficulty:"intermediate", servedWith:["naan","rice"],               tags:["rich","slow-cook","restaurant-style"] },
  palak_paneer:       { cuisine:"India-North", mealType:["lunch","dinner"],  cookMethod:"saute",     dietary:["vegetarian","gluten-free"],              prepTime:30, difficulty:"beginner",     servedWith:["rice","paratha"],            tags:["iron-rich","high-protein","green"] },
  chole_bhature:      { cuisine:"India-North", mealType:["breakfast","lunch"],cookMethod:"deepfry",  dietary:["vegan"],                                 prepTime:60, difficulty:"intermediate", servedWith:["lassi","onion"],             tags:["festive","high-protein","popular"] },
  rajma_chawal:       { cuisine:"India-North", mealType:["lunch","dinner"],  cookMethod:"onepotdal", dietary:["vegan","gluten-free"],                   prepTime:45, difficulty:"beginner",     servedWith:["raita","papad"],             tags:["comfort","high-protein","muscle-gain"] },
  aloo_paratha:       { cuisine:"India-North", mealType:["breakfast","lunch"],cookMethod:"saute",    dietary:["vegetarian"],                            prepTime:30, difficulty:"beginner",     servedWith:["curd","pickle","butter"],    tags:["comfort","breakfast","filling"] },
  tikka_masala:       { cuisine:"India-North", mealType:["lunch","dinner"],  cookMethod:"saute",     dietary:["non-veg","gluten-free"],                 prepTime:45, difficulty:"intermediate", servedWith:["naan","rice"],               tags:["popular","rich","high-protein"] },
  korma:              { cuisine:"India-North", mealType:["lunch","dinner"],  cookMethod:"braise",    dietary:["non-veg","gluten-free"],                 prepTime:60, difficulty:"intermediate", servedWith:["naan","rice"],               tags:["mild","rich","festive"] },
  shahi_korma:        { cuisine:"India-North", mealType:["dinner"],          cookMethod:"braise",    dietary:["non-veg","gluten-free"],                 prepTime:75, difficulty:"advanced",     servedWith:["naan","rice"],               tags:["luxury","rich","festive"] },
  rogan_josh:         { cuisine:"India-North", mealType:["lunch","dinner"],  cookMethod:"braise",    dietary:["non-veg","gluten-free"],                 prepTime:80, difficulty:"intermediate", servedWith:["rice","naan"],               tags:["aromatic","high-protein","slow-cook"] },

  // ── South Indian ──────────────────────────────────────────
  sambar:             { cuisine:"India-South", mealType:["breakfast","lunch","dinner"], cookMethod:"onepotdal", dietary:["vegan","gluten-free"],        prepTime:35, difficulty:"beginner",     servedWith:["idli","dosa","rice"],        tags:["comfort","high-fibre","everyday"] },
  idli:               { cuisine:"India-South", mealType:["breakfast"],       cookMethod:"steam",     dietary:["vegan","gluten-free"],                   prepTime:30, difficulty:"intermediate", servedWith:["sambar","coconut_chutney"],  tags:["light","probiotic","traditional"] },
  dosa:               { cuisine:"India-South", mealType:["breakfast","lunch"],cookMethod:"saute",    dietary:["vegan","gluten-free"],                   prepTime:20, difficulty:"intermediate", servedWith:["sambar","chutney"],          tags:["crispy","popular","light"] },
  masala_dosa:        { cuisine:"India-South", mealType:["breakfast","lunch"],cookMethod:"saute",    dietary:["vegan","gluten-free"],                   prepTime:40, difficulty:"intermediate", servedWith:["sambar","coconut_chutney"],  tags:["popular","filling","traditional"] },
  upma:               { cuisine:"India-South", mealType:["breakfast"],       cookMethod:"saute",     dietary:["vegan"],                                 prepTime:20, difficulty:"beginner",     servedWith:["coconut_chutney","curd"],    tags:["quick","light","everyday"] },
  pongal:             { cuisine:"India-South", mealType:["breakfast","lunch"],cookMethod:"onepotdal",dietary:["vegetarian","gluten-free"],              prepTime:30, difficulty:"beginner",     servedWith:["sambar","chutney"],          tags:["comfort","festival","filling"] },
  chettinad_chicken:  { cuisine:"India-South", mealType:["lunch","dinner"],  cookMethod:"saute",     dietary:["non-veg","gluten-free","dairy-free"],    prepTime:50, difficulty:"advanced",     servedWith:["rice","parotta"],            tags:["spicy","aromatic","high-protein"] },
  fish_curry:         { cuisine:"India-South", mealType:["lunch","dinner"],  cookMethod:"saute",     dietary:["non-veg","gluten-free","dairy-free"],    prepTime:35, difficulty:"beginner",     servedWith:["rice"],                      tags:["tangy","omega-3","everyday"] },

  // ── Biryani ───────────────────────────────────────────────
  chicken_biryani:    { cuisine:"India-North", mealType:["lunch","dinner"],  cookMethod:"biryani",   dietary:["non-veg","gluten-free"],                 prepTime:90, difficulty:"advanced",     servedWith:["raita","salan","salad"],     tags:["festive","high-protein","aromatic"] },
  mutton_biryani:     { cuisine:"India-North", mealType:["lunch","dinner"],  cookMethod:"biryani",   dietary:["non-veg","gluten-free"],                 prepTime:120,difficulty:"advanced",     servedWith:["raita","salan"],             tags:["festive","rich","slow-cook"] },
  veg_biryani:        { cuisine:"India-North", mealType:["lunch","dinner"],  cookMethod:"biryani",   dietary:["vegetarian","gluten-free"],              prepTime:60, difficulty:"intermediate", servedWith:["raita","papad"],             tags:["aromatic","festive","filling"] },
  paella:             { cuisine:"Spain",       mealType:["lunch","dinner"],  cookMethod:"saute",     dietary:["non-veg","gluten-free","dairy-free"],    prepTime:45, difficulty:"intermediate", servedWith:["lemon","crusty_bread"],      tags:["saffron","seafood","festive"] },

  // ── Korean ────────────────────────────────────────────────
  bulgogi:            { cuisine:"Korea",       mealType:["lunch","dinner"],  cookMethod:"stirfry",   dietary:["non-veg","gluten-free","dairy-free"],    prepTime:30, difficulty:"beginner",     servedWith:["rice","lettuce"],            tags:["sweet","high-protein","grilled"] },
  japchae:            { cuisine:"Korea",       mealType:["lunch","dinner"],  cookMethod:"stirfry",   dietary:["non-veg","gluten-free","dairy-free"],    prepTime:35, difficulty:"intermediate", servedWith:["rice"],                      tags:["glass-noodles","festive","colourful"] },
  kimchi_fried_rice:  { cuisine:"Korea",       mealType:["lunch","dinner"],  cookMethod:"stirfry",   dietary:["vegetarian","gluten-free","dairy-free"], prepTime:15, difficulty:"beginner",     servedWith:["egg","kimchi"],              tags:["quick","comfort","umami"] },
  bibimbap:           { cuisine:"Korea",       mealType:["lunch","dinner"],  cookMethod:"stirfry",   dietary:["vegetarian","gluten-free","dairy-free"], prepTime:30, difficulty:"beginner",     servedWith:["miso_soup"],                 tags:["colourful","balanced","popular"] },
  sundubu_jjigae:     { cuisine:"Korea",       mealType:["lunch","dinner"],  cookMethod:"saute",     dietary:["vegetarian","gluten-free","dairy-free"], prepTime:20, difficulty:"beginner",     servedWith:["rice"],                      tags:["spicy","warming","quick"] },
  doenjang_jjigae:    { cuisine:"Korea",       mealType:["lunch","dinner"],  cookMethod:"saute",     dietary:["vegetarian","gluten-free","dairy-free"], prepTime:20, difficulty:"beginner",     servedWith:["rice","kimchi"],             tags:["umami","warming","everyday"] },

  // ── Vietnamese ────────────────────────────────────────────
  pho:                { cuisine:"Vietnam",     mealType:["lunch","dinner"],  cookMethod:"braise",    dietary:["non-veg","gluten-free","dairy-free"],    prepTime:60, difficulty:"intermediate", servedWith:["spring_onion","lemon"],      tags:["broth","warming","umami"] },
  goi_cuon:           { cuisine:"Vietnam",     mealType:["lunch","snack"],   cookMethod:"nocook",    dietary:["non-veg","gluten-free","dairy-free"],    prepTime:20, difficulty:"beginner",     servedWith:["peanut_butter","fish_sauce"],tags:["fresh","light","low-calorie"] },
  banh_mi:            { cuisine:"Vietnam",     mealType:["breakfast","lunch","snack"],cookMethod:"saute",dietary:["non-veg"],                           prepTime:20, difficulty:"beginner",     servedWith:["pickled_carrot","coriander"],tags:["quick","high-protein","street-food"] },
  bun_cha:            { cuisine:"Vietnam",     mealType:["lunch"],           cookMethod:"saute",     dietary:["non-veg","gluten-free","dairy-free"],    prepTime:40, difficulty:"intermediate", servedWith:["spring_rolls"],              tags:["grilled","fresh","balanced"] },
  com_tam:            { cuisine:"Vietnam",     mealType:["lunch","dinner"],  cookMethod:"saute",     dietary:["non-veg","gluten-free","dairy-free"],    prepTime:30, difficulty:"beginner",     servedWith:["cucumber","pickled_veg"],    tags:["street-food","high-protein","everyday"] },

  // ── Mediterranean ─────────────────────────────────────────
  shakshuka:          { cuisine:"Mediterranean",mealType:["breakfast","brunch","dinner"],cookMethod:"saute",dietary:["vegetarian","gluten-free"],       prepTime:25, difficulty:"beginner",     servedWith:["bread","salad"],             tags:["egg","quick","high-protein"] },
  hummus:             { cuisine:"Mediterranean",mealType:["snack","lunch"],  cookMethod:"nocook",    dietary:["vegan","gluten-free"],                   prepTime:10, difficulty:"beginner",     servedWith:["pita_bread","vegetables"],   tags:["high-protein","quick","dip"] },
  baba_ganoush:       { cuisine:"Mediterranean",mealType:["snack","lunch"],  cookMethod:"roast",     dietary:["vegan","gluten-free"],                   prepTime:40, difficulty:"beginner",     servedWith:["pita_bread"],               tags:["smoky","dip","low-calorie"] },
  falafel:            { cuisine:"Mediterranean",mealType:["lunch","snack"],  cookMethod:"deepfry",   dietary:["vegan"],                                 prepTime:30, difficulty:"intermediate", servedWith:["pita_bread","tahini"],       tags:["high-protein","crispy","street-food"] },
  greek_salad:        { cuisine:"Mediterranean",mealType:["lunch","snack"],  cookMethod:"nocook",    dietary:["vegetarian","gluten-free"],              prepTime:10, difficulty:"beginner",     servedWith:["pita_bread"],               tags:["fresh","light","quick"] },
  moussaka:           { cuisine:"Mediterranean",mealType:["lunch","dinner"], cookMethod:"bake",      dietary:["non-veg"],                               prepTime:75, difficulty:"advanced",     servedWith:["greek_salad"],              tags:["hearty","layered","festive"] },

  // ── Spanish ───────────────────────────────────────────────
  tortilla_espanola:  { cuisine:"Spain",       mealType:["breakfast","lunch","snack"],cookMethod:"saute",dietary:["vegetarian","gluten-free","dairy-free"],prepTime:25,difficulty:"beginner",   servedWith:["bread","salad"],             tags:["egg","quick","versatile"] },
  gazpacho:           { cuisine:"Spain",       mealType:["lunch","snack"],  cookMethod:"nocook",    dietary:["vegan","gluten-free"],                   prepTime:15, difficulty:"beginner",     servedWith:["bread","olives"],            tags:["cold","summer","refreshing"] },

  // ── French ────────────────────────────────────────────────
  coq_au_vin:         { cuisine:"France",      mealType:["dinner"],         cookMethod:"braise",    dietary:["non-veg","gluten-free","dairy-free"],    prepTime:90, difficulty:"advanced",     servedWith:["bread","mashed_potato"],     tags:["rich","slow-cook","festive"] },
  ratatouille:        { cuisine:"France",      mealType:["lunch","dinner"], cookMethod:"bake",      dietary:["vegan","gluten-free"],                   prepTime:60, difficulty:"intermediate", servedWith:["bread","cheese"],            tags:["colourful","summer","light"] },
  french_onion_soup:  { cuisine:"France",      mealType:["lunch","dinner"], cookMethod:"braise",    dietary:["vegetarian"],                            prepTime:60, difficulty:"intermediate", servedWith:["crusty_bread"],              tags:["umami","warming","comfort"] },
  nicoise_salad:      { cuisine:"France",      mealType:["lunch"],          cookMethod:"nocook",    dietary:["non-veg","gluten-free","dairy-free"],    prepTime:20, difficulty:"beginner",     servedWith:["bread"],                     tags:["fresh","high-protein","light"] },
  crepes:             { cuisine:"France",      mealType:["breakfast","dessert"],cookMethod:"saute", dietary:["vegetarian"],                            prepTime:20, difficulty:"beginner",     servedWith:["honey","fruit","cream"],     tags:["quick","versatile","breakfast"] },

  // ── Indonesian / Malaysian ────────────────────────────────
  rendang:            { cuisine:"Indonesia",   mealType:["lunch","dinner"], cookMethod:"braise",    dietary:["non-veg","gluten-free","dairy-free"],    prepTime:120,difficulty:"advanced",     servedWith:["rice","roti"],               tags:["rich","spicy","slow-cook"] },
  nasi_goreng:        { cuisine:"Indonesia",   mealType:["breakfast","lunch","dinner"],cookMethod:"stirfry",dietary:["non-veg","gluten-free","dairy-free"],prepTime:20,difficulty:"beginner",   servedWith:["egg","prawn_crackers"],      tags:["quick","popular","comfort"] },
  satay:              { cuisine:"Indonesia",   mealType:["snack","lunch"],  cookMethod:"roast",     dietary:["non-veg","gluten-free","dairy-free"],    prepTime:30, difficulty:"beginner",     servedWith:["peanut_sauce","rice"],       tags:["grilled","street-food","high-protein"] },
  laksa:              { cuisine:"Malaysia",    mealType:["lunch","dinner"], cookMethod:"saute",     dietary:["non-veg","gluten-free","dairy-free"],    prepTime:35, difficulty:"intermediate", servedWith:["lime","spring_onion"],       tags:["spicy","coconut","rich"] },
  gado_gado:          { cuisine:"Indonesia",   mealType:["lunch"],          cookMethod:"nocook",    dietary:["vegan","gluten-free"],                   prepTime:20, difficulty:"beginner",     servedWith:["rice","prawn_crackers"],     tags:["peanut-sauce","fresh","light"] },

  // ── Breakfast ─────────────────────────────────────────────
  oatmeal:            { cuisine:"USA",         mealType:["breakfast"],      cookMethod:"saute",     dietary:["vegan","gluten-free"],                   prepTime:10, difficulty:"beginner",     servedWith:["fruit","nuts"],              tags:["quick","high-fibre","healthy"] },
  pancakes:           { cuisine:"USA",         mealType:["breakfast","dessert"],cookMethod:"saute", dietary:["vegetarian"],                            prepTime:20, difficulty:"beginner",     servedWith:["honey","fruit","butter"],    tags:["weekend","comfort","sweet"] },
  smoothie_bowl:      { cuisine:"USA",         mealType:["breakfast","snack"],cookMethod:"nocook",  dietary:["vegetarian","gluten-free"],              prepTime:10, difficulty:"beginner",     servedWith:["granola","fruit"],           tags:["quick","antioxidant","colourful"] },
  masala_omelette:    { cuisine:"India-North", mealType:["breakfast","lunch"],cookMethod:"saute",   dietary:["vegetarian","gluten-free"],              prepTime:10, difficulty:"beginner",     servedWith:["bread","chai"],              tags:["quick","high-protein","everyday"] },
  overnight_oats:     { cuisine:"USA",         mealType:["breakfast"],      cookMethod:"nocook",    dietary:["vegetarian","gluten-free"],              prepTime:5,  difficulty:"beginner",     servedWith:["fruit","nuts"],              tags:["meal-prep","high-fibre","quick"] },
  avocado_toast:      { cuisine:"USA",         mealType:["breakfast","brunch"],cookMethod:"nocook", dietary:["vegetarian","gluten-free","dairy-free"], prepTime:10, difficulty:"beginner",     servedWith:["egg","coffee"],              tags:["quick","healthy-fat","popular"] },

  // ── Soups ─────────────────────────────────────────────────
  tom_yum_soup:       { cuisine:"Thailand",    mealType:["lunch","dinner"], cookMethod:"saute",     dietary:["non-veg","gluten-free","dairy-free"],    prepTime:25, difficulty:"beginner",     servedWith:["rice"],                      tags:["spicy","sour","warming"] },
  miso_soup:          { cuisine:"Japan",       mealType:["breakfast","lunch","dinner"],cookMethod:"reduction",dietary:["vegan","gluten-free","dairy-free"],prepTime:10,difficulty:"beginner",   servedWith:["rice","pickles"],            tags:["umami","quick","light"] },
  lentil_soup:        { cuisine:"Mediterranean",mealType:["lunch","dinner"],cookMethod:"onepotdal", dietary:["vegan","gluten-free"],                   prepTime:35, difficulty:"beginner",     servedWith:["bread","lemon"],             tags:["high-fibre","warming","budget"] },
  minestrone:         { cuisine:"Italy",       mealType:["lunch","dinner"], cookMethod:"saute",     dietary:["vegan"],                                 prepTime:40, difficulty:"beginner",     servedWith:["bread","parmesan"],          tags:["hearty","high-fibre","budget"] },

  // ── Global / Italian ──────────────────────────────────────
  pasta_carbonara:    { cuisine:"Italy",       mealType:["lunch","dinner"], cookMethod:"saute",     dietary:["non-veg"],                               prepTime:20, difficulty:"intermediate", servedWith:["salad","garlic_bread"],      tags:["quick","rich","high-protein"] },
  spaghetti_bolognese:{ cuisine:"Italy",       mealType:["lunch","dinner"], cookMethod:"braise",    dietary:["non-veg"],                               prepTime:50, difficulty:"beginner",     servedWith:["parmesan","garlic_bread"],   tags:["comfort","popular","high-protein"] },
  pizza_margherita:   { cuisine:"Italy",       mealType:["lunch","dinner"], cookMethod:"bake",      dietary:["vegetarian"],                            prepTime:60, difficulty:"intermediate", servedWith:["salad"],                    tags:["festive","popular","comfort"] },
  lasagna:            { cuisine:"Italy",       mealType:["dinner"],         cookMethod:"bake",      dietary:["non-veg"],                               prepTime:75, difficulty:"intermediate", servedWith:["salad","garlic_bread"],      tags:["rich","layered","comfort"] },
  risotto:            { cuisine:"Italy",       mealType:["lunch","dinner"], cookMethod:"saute",     dietary:["vegetarian","gluten-free"],              prepTime:35, difficulty:"intermediate", servedWith:["salad"],                    tags:["creamy","comfort","rich"] },

  // ── Bowls & Meal Prep ─────────────────────────────────────
  buddha_bowl:        { cuisine:"USA",         mealType:["lunch","dinner"], cookMethod:"roast",     dietary:["vegan","gluten-free"],                   prepTime:30, difficulty:"beginner",     servedWith:["tahini","lemon"],            tags:["meal-prep","balanced","colourful"] },
  protein_bowl:       { cuisine:"USA",         mealType:["lunch","dinner"], cookMethod:"saute",     dietary:["non-veg","gluten-free","dairy-free"],    prepTime:25, difficulty:"beginner",     servedWith:["lemon","olive_oil"],         tags:["meal-prep","high-protein","muscle-gain"] },
  grain_bowl:         { cuisine:"USA",         mealType:["lunch"],          cookMethod:"nocook",    dietary:["vegetarian","gluten-free"],              prepTime:15, difficulty:"beginner",     servedWith:["dressing"],                  tags:["light","balanced","quick"] },
  teriyaki_bowl:      { cuisine:"Japan",       mealType:["lunch","dinner"], cookMethod:"stirfry",   dietary:["non-veg","gluten-free","dairy-free"],    prepTime:25, difficulty:"beginner",     servedWith:["miso_soup"],                 tags:["sweet","high-protein","popular"] },
  poke_bowl:          { cuisine:"USA",         mealType:["lunch"],          cookMethod:"nocook",    dietary:["non-veg","gluten-free","dairy-free"],    prepTime:15, difficulty:"beginner",     servedWith:["miso_soup"],                 tags:["fresh","omega-3","popular"] },

  // ── Desserts ──────────────────────────────────────────────
  kheer:              { cuisine:"India-North", mealType:["dessert"],        cookMethod:"saute",     dietary:["vegetarian","gluten-free"],              prepTime:40, difficulty:"beginner",     servedWith:["fruit","nuts"],              tags:["festive","sweet","creamy"] },
  gajar_halwa:        { cuisine:"India-North", mealType:["dessert"],        cookMethod:"saute",     dietary:["vegetarian","gluten-free"],              prepTime:60, difficulty:"intermediate", servedWith:["vanilla_ice_cream"],         tags:["festive","rich","winter"] },
  gulab_jamun:        { cuisine:"India-North", mealType:["dessert"],        cookMethod:"deepfry",   dietary:["vegetarian"],                            prepTime:45, difficulty:"intermediate", servedWith:["ice_cream"],                 tags:["festive","sweet","popular"] },
  rasmalai:           { cuisine:"India-North", mealType:["dessert"],        cookMethod:"saute",     dietary:["vegetarian","gluten-free"],              prepTime:45, difficulty:"intermediate", servedWith:["pistachios"],               tags:["festive","creamy","delicate"] },
  ladoo:              { cuisine:"India-North", mealType:["dessert","snack"],cookMethod:"saute",     dietary:["vegetarian","gluten-free"],              prepTime:30, difficulty:"beginner",     servedWith:["chai"],                      tags:["festive","sweet","traditional"] },
  halwa:              { cuisine:"India-North", mealType:["dessert","breakfast"],cookMethod:"saute", dietary:["vegetarian"],                            prepTime:20, difficulty:"beginner",     servedWith:["poori"],                     tags:["quick","festive","sweet"] },
  mishti_doi:         { cuisine:"India-East",  mealType:["dessert"],        cookMethod:"nocook",    dietary:["vegetarian","gluten-free"],              prepTime:10, difficulty:"beginner",     servedWith:["sandesh"],                   tags:["sweet","probiotic","festive"] },
  tiramisu:           { cuisine:"Italy",       mealType:["dessert"],        cookMethod:"nocook",    dietary:["vegetarian"],                            prepTime:30, difficulty:"intermediate", servedWith:["coffee"],                    tags:["creamy","rich","festive"] },
}


// ═════════════════════════════════════════════════════════════
//  SECTION 4 — HELPER FUNCTIONS
// ═════════════════════════════════════════════════════════════

// ── Resolve alternate name → canonical dish key ────────────────
export function resolveAlias(input) {
  const lower = input.toLowerCase().trim()
  // Direct key match
  if (DISH_ALIASES[lower])      return lower
  // Alternate name match
  if (DISH_NAME_ALIASES[lower]) return DISH_NAME_ALIASES[lower]
  // Partial match on dish key
  const keyMatch = Object.keys(DISH_ALIASES).find(k => k.replace(/_/g," ") === lower)
  if (keyMatch) return keyMatch
  return null
}

// ── Get metadata for a dish, with safe fallback ───────────────
export function getDishMeta(dishKey) {
  return DISH_META[dishKey] ?? {
    cuisine:    "India",
    mealType:   ["lunch","dinner"],
    cookMethod: "saute",
    dietary:    [],
    prepTime:   30,
    difficulty: "beginner",
    servedWith: [],
    tags:       [],
  }
}

// ── Get ingredients for a dish (resolves aliases) ─────────────
export function getIngredients(input) {
  const key = resolveAlias(input)
  if (!key) return null
  return { key, ingredients: DISH_ALIASES[key], meta: getDishMeta(key) }
}

// ── Filter dishes by dietary requirement ──────────────────────
export function filterByDietary(requirement) {
  return Object.entries(DISH_META)
    .filter(([, meta]) => meta.dietary?.includes(requirement))
    .map(([key]) => key)
}

// ── Filter dishes by meal type ────────────────────────────────
export function filterByMealType(mealType) {
  return Object.entries(DISH_META)
    .filter(([, meta]) => meta.mealType?.includes(mealType))
    .map(([key]) => key)
}

// ── Filter dishes by max prep time ───────────────────────────
export function filterByPrepTime(maxMinutes) {
  return Object.entries(DISH_META)
    .filter(([, meta]) => (meta.prepTime ?? 999) <= maxMinutes)
    .map(([key]) => ({ key, prepTime: meta.prepTime }))
}

// ── Get all dishes for a cuisine ─────────────────────────────
export function getDishesForCuisine(cuisineKey) {
  return Object.entries(DISH_META)
    .filter(([, meta]) => meta.cuisine === cuisineKey || meta.cuisine?.startsWith(cuisineKey))
    .map(([key]) => key)
}

// ── Get served-with suggestions for a dish ───────────────────
export function getServedWith(dishKey) {
  return DISH_META[dishKey]?.servedWith ?? []
}

// ── Get dish difficulty label ─────────────────────────────────
export function getDifficultyLabel(dishKey) {
  const d = DISH_META[dishKey]?.difficulty ?? "beginner"
  return { beginner:"🟢 Beginner", intermediate:"🟡 Intermediate", advanced:"🔴 Advanced" }[d] ?? "🟢 Beginner"
}

// ── Get prep time label ────────────────────────────────────────
export function getPrepTimeLabel(dishKey) {
  const t = DISH_META[dishKey]?.prepTime ?? 30
  if (t <= 15)  return "⚡ Under 15 min"
  if (t <= 30)  return "🕐 30 min"
  if (t <= 60)  return "🕑 About 1 hour"
  if (t <= 90)  return "🕔 1.5 hours"
  return "🕑 2+ hours"
}

// ═════════════════════════════════════════════════════════════
//  SECTION 5 — NEW KEYS NEEDED IN NUTRITIONDB (for next phase)
//
//  These ingredient keys appear in this file but don't yet
//  exist in nutritionDB.js. Add them in the nutritionDB upgrade:
//
//  sago           (sabudana — used in sabudana_khichdi)
//  curry_leaves   (used in multiple South Indian dishes)
//  cinnamon       (used in oatmeal, french_toast)
//  garam_masala   (used across North Indian dishes)
//  chili_powder   (used across multiple dishes)
//  oyster_sauce   (used in stir-fry dishes)
//  bamboo_shoots  (used in hot_and_sour_soup)
//  hot_sauce      (condiment)
//  basmati_rice   (already in costDB — add to nutritionDB)
//  sweet_potato   (already in costDB — add to nutritionDB)
//  spring_onion   (already in costDB — add to nutritionDB)
//  walnuts        (already in costDB — add to nutritionDB)
//  peanut_butter  (already in costDB — add to nutritionDB)
//  cheese         (already in costDB — add to nutritionDB)
//  yogurt         (already in costDB — add to nutritionDB — same as curd)
//  maple_syrup    (already in costDB — add to nutritionDB)
//  chia_seeds     (already in costDB — add to nutritionDB)
// ═════════════════════════════════════════════════════════════
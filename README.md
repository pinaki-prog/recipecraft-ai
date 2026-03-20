# 🍳 RecipeCraft AI

> Turn any ingredients into cuisine-specific, goal-aware recipes — with real macros, step timers, budget swaps, allergen warnings and more.

![RecipeCraft AI](https://img.shields.io/badge/Built%20with-React%20%2B%20Vite-61DAFB?style=flat-square&logo=react)

![Deploy](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)

---

## ✨ What it does

Type in whatever ingredients you have — or just a dish name like `butter_chicken` or `dalma` — and RecipeCraft AI generates a complete, structured recipe tailored to your:

- **Goal** — muscle gain, weight loss, or balanced nutrition
- **Cuisine** — India, Italy, Mexico, USA, China, Japan, Thailand
- **Spice level** — mild, medium, or hot
- **Budget** — slider from ₹100 to ₹500
- **Skill level** — beginner, intermediate, advanced

---

## 🚀 Features

### Recipe Intelligence
- **70+ dish aliases** — type `chicken_biryani`, `pad_thai`, `shakshuka` and it expands to real ingredients automatically
- **Cuisine authenticity engine** — each cuisine has its own fat type, tempering spices, aromatics, cook style and finish
- **Goal-aware macro adjustments** — protein multiplied for muscle gain, fat reduced for weight loss
- **Health scoring** — 0–100 score based on macro balance, protein adequacy and calorie density

### Nutrition
- **Full macros** — calories, protein, carbs, fats per serving
- **Micronutrients** — fibre, iron, calcium, vitamin C, vitamin A
- **Serving scaler** — adjust from 1–12 servings, all values update live
- **Macro radar chart** — visual pentagon showing nutritional balance
- **Nutritional disclaimer** — values are estimates, clearly stated

### Safety & Guidance
- **Allergen detection** — flags Gluten, Dairy, Eggs, Tree Nuts, Peanuts, Shellfish, Soy, Fish
- **Common mistakes & fixes** — ingredient-level and cuisine-level warnings (e.g. "Never eat undercooked kidney beans — they contain toxic lectins")
- **Step-by-step instructions** — 8 labelled stages: PREP, FAT & BLOOM, AROMATICS, PROTEIN, VEGETABLES, SIMMER, FINISH, PLATE

### Practical Tools
- **Step timers** — countdown timer on every instruction step, runs in the background
- **Budget friendly swaps** — cheaper alternatives for expensive ingredients with savings %
- **Best paired with** — cuisine and goal aware side dish suggestions
- **Shopping list** — categorised by Proteins / Produce / Dairy / Pantry, copy to clipboard
- **Suggested additions** — scored by ingredient compatibility + goal alignment

### Export & Share
- **PDF export** — full recipe as a clean A4 document
- **PNG export** — recipe card as an image
- **WhatsApp share** — pre-formatted message with macros
- **Native share / clipboard** — works on mobile and desktop

### App
- **Recipe history** — last 20 recipes saved to localStorage
- **Favourites** — star any recipe, favourites sort to top
- **Skeleton loader** — pixel-matched loading state
- **Input validation** — shake animation + red glow on empty submit
- **Dark / light theme** — persists across sessions
- **Cursor glow effect** — follows your mouse in dark mode

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Charts | Recharts |
| PDF export | html2pdf.js |
| Image export | html-to-image |
| State | React useState / useRef / useMemo |
| Storage | localStorage |
| Deployment | Vercel |

**No backend. No API calls. No database. Everything runs in the browser.**

---

## 📁 Project Structure

```
src/
├── components/
│   └── RecipeDisplay.jsx     # Recipe card — macros, timers, export, all sections
├── pages/
│   └── Home.jsx              # Main page — form, history, favourites, theme
└── utils/
    └── generateSmartRecipe.js # All engines — cuisine, nutrition, title, steps, budget
```

The entire recipe logic lives in `generateSmartRecipe.js`. It exports one function:

```js
generateSmartRecipe({ ingredients, goal, spice, budget, location, skill })
```

Returns a fully structured recipe object with title, description, ingredients, steps, macros, micros, allergens, swaps, mistakes, pairings and more.

---

## 🏃 Running locally

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/recipecraft-ai.git
cd recipecraft-ai

# Install
npm install

# Run
npm run dev
```

Open `http://localhost:5173`

---

## 📦 Building for production

```bash
npm run build
```

Output goes to `dist/`. Deploy that folder anywhere — Vercel, Netlify, GitHub Pages.

---

## 🌍 Supported Cuisines

| Flag | Cuisine | Cook Style |
|---|---|---|
| 🇮🇳 | India | Bhuno (slow roast) |
| 🇮🇹 | Italy | Soffritto + gentle simmer |
| 🇲🇽 | Mexico | Toasted-chili base |
| 🇺🇸 | USA | Cast-iron sear + baste |
| 🇨🇳 | China | Wok hei stir-fry |
| 🇯🇵 | Japan | Umami-forward reduction |
| 🇹🇭 | Thailand | Split-coconut-cream paste fry |

---

## 🥗 Supported Goals

| Goal | What it does |
|---|---|
| Muscle Gain | Protein ×1.25, calories ×1.15, step timers target internal temps |
| Weight Loss | Calories ×0.85, fat ×0.75, protein ×1.1, plating prioritises veg |
| Balanced | Standard macro split, steady-state nutrition context |

---

## 📖 Dish Aliases (sample)

Type any of these directly into the ingredient box:

`butter_chicken` `chicken_biryani` `dalma` `palak_paneer` `pad_thai` `ramen` `shakshuka` `bibimbap` `rogan_josh` `chole_bhature` `pesarattu` `avial` `pho` `shawarma` `khichdi` `sabudana_khichdi` `pasta_carbonara` `thai_green_curry` `daal_makhani` `aloo_paratha`

Full list of 70+ aliases is in `generateSmartRecipe.js`.

---

## ⚕️ Disclaimer

Nutritional values are estimates based on standard food composition data. Actual values vary by ingredient quality, preparation method and portion size. Allergen detection is indicative only — always verify for personal dietary requirements. This app is not a substitute for professional dietary or medical advice.

---



*Built with React + a lot of cooking knowledge.*

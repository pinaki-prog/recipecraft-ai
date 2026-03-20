// ═══════════════════════════════════════════════════════════════
//  useFoodSearch.js  — src/hooks/useFoodSearch.js
//
//  Searches the USDA FoodData Central API for real verified
//  nutrition data. Results are cached in sessionStorage so
//  the same query never hits the network twice per session.
//
//  Usage:
//    const { search, lookup, loading, error } = useFoodSearch()
//
//    // Search by name → returns array of matches
//    const results = await search("chicken breast")
//
//    // Lookup by USDA fdcId → returns full nutrition profile
//    const nutrition = await lookup(2346501)
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, useRef } from "react"

const USDA_KEY     = import.meta.env.VITE_USDA_API_KEY
const BASE_URL     = "https://api.nal.usda.gov/fdc/v1"
const CACHE_PREFIX = "usda_cache_"

// ── Session cache helpers ─────────────────────────────────────
function getCache(key) {
  try { return JSON.parse(sessionStorage.getItem(CACHE_PREFIX + key)) ?? null }
  catch { return null }
}
function setCache(key, val) {
  try { sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(val)) } catch {}
}

// ── Map USDA nutrient IDs to our internal field names ─────────
// Full list: https://fdc.nal.usda.gov/food-components.html
const NUTRIENT_MAP = {
  1008: "cal",        // Energy (kcal)
  1003: "p",          // Protein
  1005: "c",          // Carbohydrates
  1004: "f",          // Total Fat
  1079: "fibre",      // Dietary Fiber
  1087: "calcium",    // Calcium
  1089: "iron",       // Iron
  1162: "vitC",       // Vitamin C
  1110: "vitD",       // Vitamin D
  1175: "vitB6",      // Vitamin B6
  1178: "vitB12",     // Vitamin B12
  1109: "vitE",       // Vitamin E
  1106: "vitA",       // Vitamin A (RAE)
  1092: "potassium",  // Potassium
  1090: "magnesium",  // Magnesium
  1095: "zinc",       // Zinc
  1093: "sodium",     // Sodium
  1404: "omega3",     // ALA (Omega-3)
  1278: "epa",        // EPA (Omega-3)
  1279: "dha",        // DHA (Omega-3)
  2000: "sugar",      // Total Sugars
  1253: "cholesterol",// Cholesterol
  1258: "saturatedFat",
}

// ── Parse raw USDA nutrients array into our schema ────────────
function parseNutrients(foodNutrients) {
  const result = {}
  for (const item of foodNutrients ?? []) {
    const id    = item.nutrient?.id ?? item.nutrientId
    const value = item.amount ?? item.value ?? 0
    const key   = NUTRIENT_MAP[id]
    if (key) result[key] = Math.round(value * 100) / 100
  }

  // Sum EPA + DHA + ALA into single omega3 field
  const totalOmega3 = (result.omega3 ?? 0) + (result.epa ?? 0) + (result.dha ?? 0)
  if (totalOmega3 > 0) result.omega3 = Math.round(totalOmega3 * 100) / 100
  delete result.epa
  delete result.dha

  return result
}

// ── Main hook ─────────────────────────────────────────────────
export function useFoodSearch() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const abortRef = useRef(null)

  // ── search(query) → array of { fdcId, name, brand, nutrients }
  const search = useCallback(async (query, maxResults = 8) => {
    if (!query?.trim()) return []
    if (!USDA_KEY) {
      console.warn("[USDA] No API key — set VITE_USDA_API_KEY in .env")
      return []
    }

    const cacheKey = `search_${query.toLowerCase()}_${maxResults}`
    const cached   = getCache(cacheKey)
    if (cached) return cached

    // Cancel any in-flight request
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `${BASE_URL}/foods/search?api_key=${USDA_KEY}&query=${encodeURIComponent(query)}&pageSize=${maxResults}&dataType=Foundation,SR%20Legacy,Survey%20(FNDDS)`,
        { signal: abortRef.current.signal }
      )
      if (!res.ok) throw new Error(`USDA API error: ${res.status}`)
      const data = await res.json()

      const results = (data.foods ?? []).map(food => ({
        fdcId:     food.fdcId,
        name:      food.description,
        brand:     food.brandOwner ?? food.brandName ?? null,
        category:  food.foodCategory ?? null,
        nutrients: parseNutrients(food.foodNutrients),
      }))

      setCache(cacheKey, results)
      return results

    } catch (err) {
      if (err.name === "AbortError") return []
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // ── lookup(fdcId) → full nutrition object per 100g
  const lookup = useCallback(async (fdcId) => {
    if (!fdcId) return null
    if (!USDA_KEY) return null

    const cacheKey = `food_${fdcId}`
    const cached   = getCache(cacheKey)
    if (cached) return cached

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(
        `${BASE_URL}/food/${fdcId}?api_key=${USDA_KEY}`,
        { signal: AbortSignal.timeout(8000) }
      )
      if (!res.ok) throw new Error(`USDA lookup error: ${res.status}`)
      const food = await res.json()

      const result = {
        fdcId:     food.fdcId,
        name:      food.description,
        category:  food.foodCategory ?? null,
        nutrients: parseNutrients(food.foodNutrients),
      }

      setCache(cacheKey, result)
      return result

    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // ── quickNutrition(name) → best match nutrients (for auto-lookup)
  // Used by generateSmartRecipe to enrich unknown ingredients
  const quickNutrition = useCallback(async (name) => {
    const results = await search(name, 1)
    return results[0]?.nutrients ?? null
  }, [search])

  return { search, lookup, quickNutrition, loading, error }
}

// ─────────────────────────────────────────────────────────────
//  Open Food Facts — free, no API key required
//  Best for: packaged foods, branded products, barcode lookup
//  Falls back to USDA for raw ingredients
// ─────────────────────────────────────────────────────────────

const OFF_BASE = "https://world.openfoodfacts.org"

// Parse Open Food Facts nutriments into our schema
function parseOFFNutrients(n) {
  if (!n) return {}
  return {
    cal:       Math.round(n["energy-kcal_100g"] ?? n["energy_100g"] / 4.184 ?? 0),
    p:         Math.round((n["proteins_100g"] ?? 0) * 10) / 10,
    c:         Math.round((n["carbohydrates_100g"] ?? 0) * 10) / 10,
    f:         Math.round((n["fat_100g"] ?? 0) * 10) / 10,
    fibre:     Math.round((n["fiber_100g"] ?? 0) * 10) / 10,
    sodium:    Math.round((n["sodium_100g"] ?? 0) * 1000),   // g → mg
    sugar:     Math.round((n["sugars_100g"] ?? 0) * 10) / 10,
    saturatedFat: Math.round((n["saturated-fat_100g"] ?? 0) * 10) / 10,
  }
}

/**
 * searchOFF(query) — search Open Food Facts by product name
 * Returns array of { name, brand, barcode, nutrients, imageUrl }
 */
export async function searchOFF(query, maxResults = 5) {
  if (!query?.trim()) return []

  const cacheKey = `off_search_${query.toLowerCase()}`
  const cached   = getCache(cacheKey)
  if (cached) return cached

  try {
    const res = await fetch(
      `${OFF_BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${maxResults}&fields=product_name,brands,code,nutriments,image_thumb_url,categories`,
      { signal: AbortSignal.timeout(6000) }
    )
    if (!res.ok) return []
    const data = await res.json()

    const results = (data.products ?? [])
      .filter(p => p.product_name)
      .map(p => ({
        source:    "openfoodfacts",
        barcode:   p.code,
        name:      p.product_name,
        brand:     p.brands ?? null,
        category:  p.categories?.split(",")[0]?.trim() ?? null,
        imageUrl:  p.image_thumb_url ?? null,
        nutrients: parseOFFNutrients(p.nutriments),
      }))

    setCache(cacheKey, results)
    return results
  } catch {
    return []
  }
}

/**
 * lookupBarcode(barcode) — look up a product by its barcode
 * Returns full product details or null
 */
export async function lookupBarcode(barcode) {
  if (!barcode) return null

  const cacheKey = `off_barcode_${barcode}`
  const cached   = getCache(cacheKey)
  if (cached) return cached

  try {
    const res = await fetch(
      `${OFF_BASE}/api/v2/product/${barcode}.json`,
      { signal: AbortSignal.timeout(6000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 1) return null

    const p = data.product
    const result = {
      source:    "openfoodfacts",
      barcode,
      name:      p.product_name ?? "Unknown product",
      brand:     p.brands ?? null,
      category:  p.categories?.split(",")[0]?.trim() ?? null,
      imageUrl:  p.image_thumb_url ?? null,
      ingredients: p.ingredients_text ?? null,
      nutrients: parseOFFNutrients(p.nutriments),
    }

    setCache(cacheKey, result)
    return result
  } catch {
    return null
  }
}
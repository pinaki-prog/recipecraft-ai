// ═══════════════════════════════════════════════════════════════
//  useSync.js  — src/hooks/useSync.js
//
//  Bidirectional sync between localStorage and Supabase.
//  - On login:  pulls cloud data → merges into localStorage
//  - On change: pushes to Supabase in the background
//  - Offline:   falls back gracefully to localStorage only
//
//  Usage:
//    const { user, signOut, syncRecipe, syncProfile,
//            syncMealPlan, syncDailyLog } = useSync()
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react"
import { supabase } from "../utils/supabaseClient"

// ── Local helpers ─────────────────────────────────────────────
function readLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback }
  catch { return fallback }
}
function writeLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

export function useSync() {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)   // initial auth check

  // ── Listen for auth state changes ───────────────────────────
  useEffect(() => {
    // Get current session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
      if (session?.user) pullFromCloud(session.user.id)
    })

    // Subscribe to future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null
        setUser(u)
        setLoading(false)
        if (u) pullFromCloud(u.id)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ── PULL: cloud → localStorage on login ─────────────────────
  async function pullFromCloud(userId) {
    try {
      // Pull profile
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single()
      if (profile) writeLS("userProfile", profile)

      // Pull recipes (merge with local — cloud wins on conflict)
      const { data: recipes } = await supabase
        .from("saved_recipes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50)
      if (recipes?.length) {
        const mapped = recipes.map(r => ({ ...r.data, id: r.recipe_id, _dbId: r.id }))
        const local  = readLS("savedRecipes", [])
        // Merge: cloud first, then any local-only ones
        const cloudIds = new Set(mapped.map(r => r.id))
        const localOnly = local.filter(r => !cloudIds.has(r.id))
        writeLS("savedRecipes", [...mapped, ...localOnly].slice(0, 50))
      }

      // Pull active meal plan
      const { data: plans } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .single()
      if (plans) {
        writeLS("mealPlan",    plans.plan)
        writeLS("slotNotes",   plans.slot_notes ?? {})
        writeLS("macroTargets",plans.targets)
        writeLS("mealPlanName",plans.name)
      }

      // Pull today's daily log
      const today = new Date().toISOString().split("T")[0]
      const { data: log } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", userId)
        .eq("log_date", today)
        .single()
      if (log) writeLS("dailyLog", log.entries)

      // Pull weekly trend
      const { data: trend } = await supabase
        .from("weekly_trends")
        .select("*")
        .eq("user_id", userId)
        .single()
      if (trend) writeLS("weeklyTrend", trend.trend_data)

      console.log("[Sync] Pull from cloud complete ✅")
    } catch (err) {
      // Non-fatal — app still works with localStorage
      console.warn("[Sync] Pull failed (offline?):", err.message)
    }
  }

  // ── PUSH: save recipe to Supabase ───────────────────────────
  const syncRecipe = useCallback(async (recipe, { isFavourite = false, rating = null, note = null } = {}) => {
    if (!user) return
    try {
      await supabase.from("saved_recipes").upsert({
        user_id:      user.id,
        recipe_id:    recipe.id,
        title:        recipe.title,
        data:         recipe,
        is_favourite: isFavourite,
        rating:       rating,
        note:         note,
      }, { onConflict: "user_id,recipe_id" })
    } catch (err) {
      console.warn("[Sync] syncRecipe failed:", err.message)
    }
  }, [user])

  // ── PUSH: update recipe rating ───────────────────────────────
  const syncRating = useCallback(async (recipeId, rating) => {
    if (!user) return
    try {
      await supabase.from("saved_recipes")
        .update({ rating })
        .eq("user_id",  user.id)
        .eq("recipe_id", recipeId)
    } catch (err) {
      console.warn("[Sync] syncRating failed:", err.message)
    }
  }, [user])

  // ── PUSH: update recipe note ────────────────────────────────
  const syncNote = useCallback(async (recipeId, note) => {
    if (!user) return
    try {
      await supabase.from("saved_recipes")
        .update({ note })
        .eq("user_id",  user.id)
        .eq("recipe_id", recipeId)
    } catch (err) {
      console.warn("[Sync] syncNote failed:", err.message)
    }
  }, [user])

  // ── PUSH: update favourite status ───────────────────────────
  const syncFavourite = useCallback(async (recipeId, isFavourite) => {
    if (!user) return
    try {
      await supabase.from("saved_recipes")
        .update({ is_favourite: isFavourite })
        .eq("user_id",  user.id)
        .eq("recipe_id", recipeId)
    } catch (err) {
      console.warn("[Sync] syncFavourite failed:", err.message)
    }
  }, [user])

  // ── PUSH: save/update user profile ──────────────────────────
  const syncProfile = useCallback(async (profile) => {
    if (!user) return
    try {
      await supabase.from("user_profiles").upsert({
        id:       user.id,
        name:     profile.name,
        age:      profile.age      ? parseInt(profile.age)      : null,
        sex:      profile.sex,
        weight:   profile.weight   ? parseFloat(profile.weight) : null,
        height:   profile.height   ? parseFloat(profile.height) : null,
        activity: profile.activity,
        goal:     profile.goal,
      }, { onConflict: "id" })
    } catch (err) {
      console.warn("[Sync] syncProfile failed:", err.message)
    }
  }, [user])

  // ── PUSH: save meal plan ─────────────────────────────────────
  const syncMealPlan = useCallback(async ({ plan, name, slotNotes, targets }) => {
    if (!user) return
    try {
      // Mark all others as inactive first
      await supabase.from("meal_plans")
        .update({ is_active: false })
        .eq("user_id", user.id)

      // Upsert active plan
      await supabase.from("meal_plans").upsert({
        user_id:    user.id,
        name:       name ?? "My Week",
        plan:       plan,
        slot_notes: slotNotes ?? {},
        targets:    targets,
        is_active:  true,
      }, { onConflict: "user_id,name" })
    } catch (err) {
      console.warn("[Sync] syncMealPlan failed:", err.message)
    }
  }, [user])

  // ── PUSH: save daily log ─────────────────────────────────────
  const syncDailyLog = useCallback(async (entries) => {
    if (!user) return
    try {
      const today = new Date().toISOString().split("T")[0]
      await supabase.from("daily_logs").upsert({
        user_id:  user.id,
        log_date: today,
        entries:  entries,
      }, { onConflict: "user_id,log_date" })
    } catch (err) {
      console.warn("[Sync] syncDailyLog failed:", err.message)
    }
  }, [user])

  // ── PUSH: save weekly trend ──────────────────────────────────
  const syncWeeklyTrend = useCallback(async (trendData) => {
    if (!user) return
    try {
      await supabase.from("weekly_trends").upsert({
        user_id:    user.id,
        trend_data: trendData,
      }, { onConflict: "user_id" })
    } catch (err) {
      console.warn("[Sync] syncWeeklyTrend failed:", err.message)
    }
  }, [user])

  // ── Sign out ─────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  return {
    user,
    loading,
    signOut,
    syncRecipe,
    syncRating,
    syncNote,
    syncFavourite,
    syncProfile,
    syncMealPlan,
    syncDailyLog,
    syncWeeklyTrend,
  }
}
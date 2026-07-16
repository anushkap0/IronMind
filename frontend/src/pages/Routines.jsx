import React, { useState } from "react";
import { motion } from "framer-motion";
import { Dumbbell, Utensils, Sparkles } from "lucide-react";
import apiClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";

const GOALS = [
  { value: "lose", label: "Lose weight" },
  { value: "maintain", label: "Maintain" },
  { value: "gain", label: "Build muscle" },
];
const EXPERIENCE = ["beginner", "intermediate", "advanced"];

export default function Routines() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    goal: user?.goal || "maintain",
    experience: "beginner",
    days_per_week: 4,
  });
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await apiClient.post("/api/routines/generate", form);
      setPlan(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not generate a routine.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm uppercase tracking-widest text-blood">Program</p>
        <h1 className="font-display text-4xl font-semibold">Diet & Workout Routine</h1>
        <p className="mt-2 max-w-2xl text-steel">
          Generate a structured training split and calorie/macro targets based on
          your goal, experience, and how many days you can train.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-line bg-panel/70 p-6 sm:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wider text-steel">Goal</label>
          <select
            value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value })}
            className="w-full rounded-lg border border-line bg-void/60 px-3 py-2.5 text-sm outline-none focus:border-blood [&>option]:bg-panel"
          >
            {GOALS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wider text-steel">Experience</label>
          <select
            value={form.experience}
            onChange={(e) => setForm({ ...form, experience: e.target.value })}
            className="w-full rounded-lg border border-line bg-void/60 px-3 py-2.5 text-sm capitalize outline-none focus:border-blood [&>option]:bg-panel"
          >
            {EXPERIENCE.map((ex) => (
              <option key={ex} value={ex}>{ex}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wider text-steel">Days / week</label>
          <input
            type="number"
            min={1}
            max={7}
            value={form.days_per_week}
            onChange={(e) => setForm({ ...form, days_per_week: parseInt(e.target.value, 10) })}
            className="w-full rounded-lg border border-line bg-void/60 px-3 py-2.5 text-sm outline-none focus:border-blood"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={generate}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blood py-2.5 font-display font-medium tracking-wide text-bone transition-all hover:bg-ember hover:shadow-glowRed disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" />
            {loading ? "Generating..." : "Generate Plan"}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-blood/40 bg-blood/10 px-3 py-2 text-sm text-ember">{error}</p>
      )}

      {plan && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 gap-8 lg:grid-cols-2"
        >
          {/* Workout plan */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-blood" />
              <h3 className="font-display text-xl tracking-wide">Workout Split</h3>
            </div>
            <div className="space-y-4">
              {plan.workout_plan.map((day, idx) => (
                <div key={idx} className="rounded-xl border border-line bg-panel/70 p-5">
                  <p className="font-display text-lg text-ember">
                    Day {idx + 1} — {day.focus}
                  </p>
                  <div className="mt-3 divide-y divide-line">
                    {day.exercises.map((ex, i) => (
                      <div key={i} className="flex items-center justify-between py-2 text-sm">
                        <span>{ex.name}</span>
                        <span className="text-steel">
                          {ex.sets} × {ex.reps} · rest {ex.rest_seconds}s
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Diet plan */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Utensils className="h-5 w-5 text-blood" />
              <h3 className="font-display text-xl tracking-wide">Nutrition Targets</h3>
            </div>
            <div className="rounded-xl border border-line bg-panel/70 p-5">
              <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                  <p className="font-display text-2xl">{plan.diet_plan.daily_calories}</p>
                  <p className="text-xs text-steel">kcal/day</p>
                </div>
                <div>
                  <p className="font-display text-2xl text-blood">{plan.diet_plan.protein_g}g</p>
                  <p className="text-xs text-steel">Protein</p>
                </div>
                <div>
                  <p className="font-display text-2xl text-ember">{plan.diet_plan.carbs_g}g</p>
                  <p className="text-xs text-steel">Carbs</p>
                </div>
                <div>
                  <p className="font-display text-2xl text-steel">{plan.diet_plan.fats_g}g</p>
                  <p className="text-xs text-steel">Fats</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {plan.diet_plan.meals.map((meal, i) => (
                  <div key={i} className="rounded-lg border border-line bg-void/40 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-bone">{meal.name}</p>
                      <span className="text-xs text-steel">{meal.approx_calories} kcal</span>
                    </div>
                    <p className="mt-1 text-sm text-steel">{meal.items.join(" · ")}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-4 text-sm text-steel">{plan.notes}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

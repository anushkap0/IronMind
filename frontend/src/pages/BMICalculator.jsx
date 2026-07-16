import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ruler, Weight, Calendar, Calculator } from "lucide-react";
import apiClient from "../api/axiosClient";

const CATEGORY_COLOR = {
  Underweight: "#5DA3FA",
  "Normal weight": "#4ADE80",
  Overweight: "#FBBF24",
  Obese: "#E31B3D",
};

function Gauge({ bmi }) {
  // Map bmi (15-40 clamp) to 0-100% for the arc.
  const clamped = Math.min(Math.max(bmi, 15), 40);
  const pct = ((clamped - 15) / (40 - 15)) * 100;
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (pct / 100) * circumference * 0.75; // 3/4 arc

  return (
    <svg viewBox="0 0 200 200" className="h-52 w-52">
      <circle
        cx="100"
        cy="100"
        r="70"
        fill="none"
        stroke="#2A2A2F"
        strokeWidth="14"
        strokeDasharray={`${circumference * 0.75} ${circumference}`}
        strokeDashoffset="0"
        strokeLinecap="round"
        transform="rotate(135 100 100)"
      />
      <motion.circle
        cx="100"
        cy="100"
        r="70"
        fill="none"
        stroke="#E31B3D"
        strokeWidth="14"
        strokeDasharray={circumference}
        strokeLinecap="round"
        transform="rotate(135 100 100)"
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />
      <text x="100" y="95" textAnchor="middle" className="font-display" fill="#F5F1EC" fontSize="34" fontWeight="600">
        {bmi}
      </text>
      <text x="100" y="120" textAnchor="middle" fill="#8B8B95" fontSize="13">
        BMI
      </text>
    </svg>
  );
}

export default function BMICalculator() {
  const [form, setForm] = useState({ weight_kg: "", height_cm: "", age: "", gender: "" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await apiClient.post("/api/bmi/calculate", {
        weight_kg: parseFloat(form.weight_kg),
        height_cm: parseFloat(form.height_cm),
        age: form.age ? parseInt(form.age, 10) : null,
        gender: form.gender || null,
      });
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not calculate BMI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm uppercase tracking-widest text-blood">Assessment</p>
        <h1 className="font-display text-4xl font-semibold">BMI Calculator</h1>
        <p className="mt-2 max-w-md text-steel">
          Enter your measurements to get your Body Mass Index, category, and
          tailored advice based on your goal.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-2xl border border-line bg-panel/70 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-steel">
                Weight (kg)
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-line bg-void/60 px-3 py-2.5 focus-within:border-blood">
                <Weight className="h-4 w-4 text-steel" />
                <input
                  type="number"
                  step="0.1"
                  required
                  value={form.weight_kg}
                  onChange={update("weight_kg")}
                  placeholder="72.5"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-steel/60"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-steel">
                Height (cm)
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-line bg-void/60 px-3 py-2.5 focus-within:border-blood">
                <Ruler className="h-4 w-4 text-steel" />
                <input
                  type="number"
                  step="0.1"
                  required
                  value={form.height_cm}
                  onChange={update("height_cm")}
                  placeholder="178"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-steel/60"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-steel">
                Age (optional)
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-line bg-void/60 px-3 py-2.5 focus-within:border-blood">
                <Calendar className="h-4 w-4 text-steel" />
                <input
                  type="number"
                  value={form.age}
                  onChange={update("age")}
                  placeholder="28"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-steel/60"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-steel">
                Gender (optional)
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-line bg-void/60 px-3 py-2.5 focus-within:border-blood">
                <select
                  value={form.gender}
                  onChange={update("gender")}
                  className="w-full bg-transparent text-sm outline-none [&>option]:bg-panel"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-md border border-blood/40 bg-blood/10 px-3 py-2 text-sm text-ember">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blood py-3 font-display font-medium tracking-wide text-bone transition-all hover:bg-ember hover:shadow-glowRed disabled:opacity-60"
          >
            <Calculator className="h-4 w-4" />
            {loading ? "Calculating..." : "Calculate BMI"}
          </button>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col items-center justify-center rounded-2xl border border-line bg-panel/70 p-8"
      >
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center text-center"
            >
              <Gauge bmi={result.bmi} />
              <span
                className="mt-2 rounded-full px-4 py-1 text-sm font-medium"
                style={{
                  color: CATEGORY_COLOR[result.category],
                  backgroundColor: `${CATEGORY_COLOR[result.category]}22`,
                }}
              >
                {result.category}
              </span>
              <p className="mt-5 max-w-sm text-sm text-steel">{result.advice}</p>
              <p className="mt-4 text-xs uppercase tracking-wider text-steel">
                Healthy weight range: {result.healthy_range_kg[0]}–{result.healthy_range_kg[1]} kg
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center text-steel"
            >
              <div className="mb-4 h-52 w-52 rounded-full border-4 border-dashed border-line" />
              <p>Your result will appear here after calculating.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

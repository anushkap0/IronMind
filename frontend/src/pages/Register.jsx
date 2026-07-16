import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, User, Mail, Lock, Target, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import BackgroundFX from "../components/BackgroundFX";

const GOALS = [
  { value: "lose", label: "Lose weight" },
  { value: "maintain", label: "Maintain" },
  { value: "gain", label: "Build muscle" },
];

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", goal: "maintain" });
  const [error, setError] = useState("");

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await register(form.fullName, form.email, form.password, form.goal);
    if (res.success) {
      navigate("/dashboard");
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden font-body text-bone">
      <BackgroundFX />

      <div className="mx-auto flex min-h-screen max-w-xl items-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full rounded-2xl border border-line bg-panel/80 p-8 shadow-glowRed backdrop-blur-md"
        >
          <div className="mb-6 flex items-center gap-2">
            <Activity className="h-7 w-7 text-blood" />
            <span className="font-display text-xl font-semibold">
              IRON<span className="text-blood">MIND</span>
            </span>
          </div>

          <h2 className="font-display text-2xl font-semibold">Create your account</h2>
          <p className="mt-1 text-sm text-steel">Start your personalized fitness program.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-steel">
                Full name
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-line bg-void/60 px-3 py-2.5 focus-within:border-blood">
                <User className="h-4 w-4 text-steel" />
                <input
                  required
                  value={form.fullName}
                  onChange={update("fullName")}
                  placeholder="Jordan Lee"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-steel/60"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-steel">
                Email
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-line bg-void/60 px-3 py-2.5 focus-within:border-blood">
                <Mail className="h-4 w-4 text-steel" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={update("email")}
                  placeholder="you@example.com"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-steel/60"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-steel">
                Password
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-line bg-void/60 px-3 py-2.5 focus-within:border-blood">
                <Lock className="h-4 w-4 text-steel" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={update("password")}
                  placeholder="At least 6 characters"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-steel/60"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-steel">
                Primary goal
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-line bg-void/60 px-3 py-2.5 focus-within:border-blood">
                <Target className="h-4 w-4 text-steel" />
                <select
                  value={form.goal}
                  onChange={update("goal")}
                  className="w-full bg-transparent text-sm outline-none [&>option]:bg-panel"
                >
                  {GOALS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <p className="rounded-md border border-blood/40 bg-blood/10 px-3 py-2 text-sm text-ember">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-blood py-3 font-display font-medium tracking-wide text-bone transition-all hover:bg-ember hover:shadow-glowRed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create Account"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-steel">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-ember hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

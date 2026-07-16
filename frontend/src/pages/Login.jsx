import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Lock, Mail, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import BackgroundFX from "../components/BackgroundFX";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await login(email, password);
    if (res.success) {
      navigate("/dashboard");
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden font-body text-bone">
      <BackgroundFX />

      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="hidden md:block"
        >
          <div className="mb-6 flex items-center gap-2">
            <Activity className="h-8 w-8 text-blood animate-floatY" strokeWidth={2.5} />
            <span className="font-display text-2xl font-semibold tracking-wide">
              IRON<span className="text-blood">MIND</span>
            </span>
          </div>
          <h1 className="font-display text-5xl font-semibold leading-tight lg:text-6xl">
            Train with data.
            <br />
            <span className="text-blood">Recover</span> with intent.
          </h1>
          <p className="mt-6 max-w-md text-lg text-steel">
            Track your BMI, get an AI coach tuned to your goals, and follow guided
            interval workouts — all in one place built for people serious about
            their progress.
          </p>
          <div className="mt-10 flex gap-8 border-t border-line pt-6 text-sm text-steel">
            <div>
              <p className="font-display text-2xl text-bone">24/7</p>
              <p>AI coaching</p>
            </div>
            <div>
              <p className="font-display text-2xl text-bone">100%</p>
              <p>Personalized plans</p>
            </div>
            <div>
              <p className="font-display text-2xl text-bone">JWT</p>
              <p>Secured access</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          className="w-full rounded-2xl border border-line bg-panel/80 p-8 shadow-glowRed backdrop-blur-md"
        >
          <div className="mb-8 md:hidden flex items-center gap-2">
            <Activity className="h-7 w-7 text-blood" />
            <span className="font-display text-xl font-semibold">
              IRON<span className="text-blood">MIND</span>
            </span>
          </div>

          <h2 className="font-display text-2xl font-semibold">Welcome back</h2>
          <p className="mt-1 text-sm text-steel">Sign in to continue your program.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-steel">
                Email
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-line bg-void/60 px-3 py-2.5 focus-within:border-blood">
                <Mail className="h-4 w-4 text-steel" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-steel/60"
                />
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
              {loading ? "Signing in..." : "Sign In"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          <a
            href={`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/auth/google/login`}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-line py-3 font-medium text-bone transition-colors hover:border-blood"
          >
            Continue with Google
          </a>

          <p className="mt-6 text-center text-sm text-steel">
            New here?{" "}
            <Link to="/register" className="font-medium text-ember hover:underline">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

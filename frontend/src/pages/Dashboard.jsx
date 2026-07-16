import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calculator, MessageCircle, Timer, ClipboardList, TrendingUp, ScanFace, Flame, Lock, Award } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import apiClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";
import TiltCard from "../components/TiltCard";

const ACTIONS = [
  {
    to: "/bmi",
    icon: Calculator,
    title: "Calculate BMI",
    desc: "Log your weight & height to get an instant reading and advice.",
  },
  {
    to: "/routines",
    icon: ClipboardList,
    title: "Build a Routine",
    desc: "Generate a diet + workout plan tailored to your goal.",
  },
  {
    to: "/timer",
    icon: Timer,
    title: "Workout Timer",
    desc: "Run guided interval training sessions with presets.",
  },
  {
    to: "/vision",
    icon: ScanFace,
    title: "Form Check",
    desc: "Webcam rep counter with live form feedback, powered by pose detection.",
  },
  {
    to: "/coach",
    icon: MessageCircle,
    title: "Ask the AI Coach",
    desc: "Get follow-up recommendations from your RAG-powered coach.",
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    apiClient
      .get("/api/bmi/history")
      .then(({ data }) => {
        const chartData = [...data]
          .reverse()
          .map((r) => ({
            date: new Date(r.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            }),
            bmi: r.bmi,
          }));
        setHistory(chartData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    apiClient
      .get("/api/progress/summary")
      .then(({ data }) => setProgress(data))
      .catch(() => {});
  }, []);

  const latest = history[history.length - 1];

  return (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm uppercase tracking-widest text-blood">Dashboard</p>
        <h1 className="font-display text-4xl font-semibold">
          Welcome back, {user?.full_name?.split(" ")[0] || "athlete"}
        </h1>
        <p className="mt-2 max-w-2xl text-steel">
          Here's your snapshot. Jump into any tool below to keep your program moving.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="lg:col-span-2 rounded-2xl border border-line bg-panel/70 p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg tracking-wide">BMI Trend</h3>
            <TrendingUp className="h-5 w-5 text-blood" />
          </div>

          {loading ? (
            <p className="text-sm text-steel">Loading...</p>
          ) : history.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center gap-3 text-center">
              <p className="text-steel">No BMI records yet.</p>
              <Link
                to="/bmi"
                className="rounded-md bg-blood px-4 py-2 text-sm font-medium text-bone hover:bg-ember"
              >
                Calculate your first BMI
              </Link>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={history}>
                <CartesianGrid stroke="#2A2A2F" strokeDasharray="4 4" />
                <XAxis dataKey="date" stroke="#8B8B95" fontSize={12} />
                <YAxis stroke="#8B8B95" fontSize={12} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ background: "#1D1D21", border: "1px solid #2A2A2F", borderRadius: 8 }}
                  labelStyle={{ color: "#F5F1EC" }}
                />
                <Line
                  type="monotone"
                  dataKey="bmi"
                  stroke="#E31B3D"
                  strokeWidth={2.5}
                  dot={{ fill: "#FF5F6D", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-line bg-panel/70 p-6"
        >
          <h3 className="font-display text-lg tracking-wide">Latest Reading</h3>
          {latest ? (
            <div className="mt-6 flex flex-col items-center">
              <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-4 border-blood/70 shadow-glowRed">
                <span className="font-display text-4xl font-semibold">{latest.bmi}</span>
              </div>
              <p className="mt-4 text-sm text-steel">Recorded {latest.date}</p>
            </div>
          ) : (
            <p className="mt-6 text-sm text-steel">
              Once you log a BMI reading, it will appear here as a quick visual.
            </p>
          )}
          <p className="mt-6 text-xs uppercase tracking-wider text-steel">Current goal</p>
          <p className="font-display text-xl capitalize text-ember">{user?.goal}</p>
        </motion.div>
      </div>

      {progress && (
        <div>
          <h3 className="mb-4 font-display text-lg tracking-wide text-steel">Progress</h3>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center rounded-2xl border border-line bg-panel/70 p-6 text-center"
            >
              <motion.div
                animate={progress.streak_days > 0 ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-blood/15"
              >
                <Flame className={`h-8 w-8 ${progress.streak_days > 0 ? "text-blood" : "text-steel"}`} />
              </motion.div>
              <p className="mt-3 font-display text-3xl font-semibold">{progress.streak_days}</p>
              <p className="text-xs uppercase tracking-wider text-steel">
                {progress.streak_days === 1 ? "Day streak" : "Day streak"}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="lg:col-span-2 rounded-2xl border border-line bg-panel/70 p-6"
            >
              <div className="mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-blood" />
                <h4 className="font-display text-lg tracking-wide">Badges</h4>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {progress.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`rounded-xl border p-4 text-center transition-colors ${
                      badge.earned
                        ? "border-blood/50 bg-blood/10"
                        : "border-line bg-void/30 opacity-60"
                    }`}
                  >
                    {badge.earned ? (
                      <Award className="mx-auto h-6 w-6 text-blood" />
                    ) : (
                      <Lock className="mx-auto h-6 w-6 text-steel" />
                    )}
                    <p className="mt-2 text-xs font-medium text-bone">{badge.name}</p>
                    <p className="mt-1 text-[11px] text-steel">{badge.description}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-4 font-display text-lg tracking-wide text-steel">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ACTIONS.map((action, i) => (
            <motion.div
              key={action.to}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <TiltCard className="h-full">
                <Link
                  to={action.to}
                  className="group flex h-full flex-col rounded-2xl border border-line bg-panel/70 p-6 transition-all hover:border-blood hover:shadow-glowRed"
                >
                  <action.icon className="h-8 w-8 text-blood transition-transform group-hover:scale-110" />
                  <h4 className="mt-4 font-display text-lg tracking-wide">{action.title}</h4>
                  <p className="mt-1.5 text-sm text-steel">{action.desc}</p>
                </Link>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

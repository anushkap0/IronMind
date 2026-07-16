import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Timer as TimerIcon } from "lucide-react";
import apiClient from "../api/axiosClient";
import { getSocket } from "../api/socketClient";
import ParticleBurst from "../components/ParticleBurst";
import Confetti from "../components/Confetti";

const PHASES = { warmup: "Warm Up", work: "Work", rest: "Rest", cooldown: "Cool Down", done: "Complete" };

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    /* audio not available */
  }
}

export default function WorkoutTimer() {
  const [presets, setPresets] = useState([]);
  const [preset, setPreset] = useState(null);
  const [phase, setPhase] = useState("warmup");
  const [round, setRound] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const [burstCount, setBurstCount] = useState(0);
  const [confettiFire, setConfettiFire] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    apiClient.get("/api/workouts/presets").then(({ data }) => {
      setPresets(data);
      setPreset(data[0]);
      setSecondsLeft(data[0].warmup_seconds);
    });
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const handler = (data) => {
      if (!data) return;
      setPhase(data.phase);
      setRound(data.round);
      setSecondsLeft(data.secondsLeft);
      setRunning(data.running);
      if (data.presetId && preset?.id !== data.presetId) {
        const found = presets.find((p) => p.id === data.presetId);
        if (found) setPreset(found);
      }
    };
    socket.on("timer_sync", handler);
    return () => socket.off("timer_sync", handler);
  }, [presets]);

  const emitTimerState = (overrides = {}) => {
    const socket = getSocket();
    socket.emit("timer_update", {
      presetId: preset?.id,
      phase,
      round,
      secondsLeft,
      running,
      ...overrides,
    });
  };

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          advancePhase();
          return 0;
        }
        const next = prev - 1;
        emitTimerState({ secondsLeft: next });
        return next;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, phase, round, preset]);

  const advancePhase = () => {
    if (!preset) return;
    beep();
    if (phase === "warmup") {
      setPhase("work");
      setSecondsLeft(preset.work_seconds);
    } else if (phase === "work") {
      setBurstCount((c) => c + 1);
      if (round >= preset.rounds) {
        setPhase("cooldown");
        setSecondsLeft(preset.cooldown_seconds);
      } else {
        setPhase("rest");
        setSecondsLeft(preset.rest_seconds);
      }
    } else if (phase === "rest") {
      setRound((r) => r + 1);
      setPhase("work");
      setSecondsLeft(preset.work_seconds);
    } else if (phase === "cooldown") {
      setPhase("done");
      setRunning(false);
      setConfettiFire((c) => c + 1);
    }
  };

  const selectPreset = (p) => {
    clearInterval(intervalRef.current);
    setPreset(p);
    setPhase("warmup");
    setRound(1);
    setSecondsLeft(p.warmup_seconds);
    setRunning(false);
    emitTimerState({ presetId: p.id, phase: "warmup", round: 1, secondsLeft: p.warmup_seconds, running: false });
  };

  const reset = () => {
    if (!preset) return;
    clearInterval(intervalRef.current);
    setPhase("warmup");
    setRound(1);
    setSecondsLeft(preset.warmup_seconds);
    setRunning(false);
    emitTimerState({
      presetId: preset.id,
      phase: "warmup",
      round: 1,
      secondsLeft: preset.warmup_seconds,
      running: false,
    });
  };

  const phaseColor = {
    warmup: "#8B8B95",
    work: "#E31B3D",
    rest: "#4ADE80",
    cooldown: "#5DA3FA",
    done: "#FF5F6D",
  }[phase];

  const totalForPhase = preset
    ? { warmup: preset.warmup_seconds, work: preset.work_seconds, rest: preset.rest_seconds, cooldown: preset.cooldown_seconds, done: 1 }[phase]
    : 1;
  const progress = totalForPhase ? 1 - secondsLeft / totalForPhase : 0;
  const circumference = 2 * Math.PI * 90;

  return (
    <div className="space-y-8">
      <Confetti fire={confettiFire} />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm uppercase tracking-widest text-blood">Session</p>
        <h1 className="font-display text-4xl font-semibold">Guided Workout Timer</h1>
        <p className="mt-2 max-w-2xl text-steel">
          Choose an interval preset and follow along — warm up, work, rest, repeat.
          Open this page on another device while logged in to see it sync live.
        </p>
      </motion.div>

      <div className="flex flex-wrap gap-3">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => selectPreset(p)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              preset?.id === p.id
                ? "border-blood bg-blood/15 text-ember"
                : "border-line bg-panel/70 text-steel hover:border-blood/60"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {preset && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="relative lg:col-span-2 flex flex-col items-center justify-center rounded-2xl border border-line bg-panel/70 p-10">
            <ParticleBurst trigger={burstCount} />
            <svg viewBox="0 0 200 200" className="h-64 w-64">
              <circle cx="100" cy="100" r="90" fill="none" stroke="#2A2A2F" strokeWidth="10" />
              <motion.circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke={phaseColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset: circumference * (1 - progress) }}
                transition={{ duration: 0.9, ease: "linear" }}
                transform="rotate(-90 100 100)"
              />
              <text x="100" y="95" textAnchor="middle" fill="#F5F1EC" fontSize="42" fontFamily="Poppins" fontWeight="600">
                {String(Math.floor(secondsLeft / 60)).padStart(1, "0")}:
                {String(secondsLeft % 60).padStart(2, "0")}
              </text>
              <text x="100" y="122" textAnchor="middle" fill={phaseColor} fontSize="15" letterSpacing="2">
                {PHASES[phase].toUpperCase()}
              </text>
            </svg>

            {phase !== "done" && (
              <p className="mt-2 text-sm text-steel">
                Round {Math.min(round, preset.rounds)} / {preset.rounds}
              </p>
            )}
            {phase === "done" && (
              <p className="mt-2 font-display text-xl text-ember">Session complete — nice work.</p>
            )}

            <div className="mt-8 flex items-center gap-4">
              <button
                onClick={() => {
                  const newRunning = !running;
                  setRunning(newRunning);
                  emitTimerState({ running: newRunning });
                }}
                disabled={phase === "done"}
                className="flex items-center gap-2 rounded-lg bg-blood px-6 py-3 font-display font-medium tracking-wide text-bone transition-all hover:bg-ember hover:shadow-glowRed disabled:opacity-50"
              >
                {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                {running ? "Pause" : "Start"}
              </button>
              <button
                onClick={reset}
                className="flex items-center gap-2 rounded-lg border border-line px-5 py-3 text-steel transition-colors hover:border-blood hover:text-ember"
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-panel/70 p-6">
            <div className="mb-3 flex items-center gap-2">
              <TimerIcon className="h-5 w-5 text-blood" />
              <h3 className="font-display text-lg tracking-wide">{preset.name}</h3>
            </div>
            <p className="text-sm text-steel">{preset.description}</p>
            <div className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between border-b border-line py-2">
                <span className="text-steel">Warm up</span>
                <span>{preset.warmup_seconds}s</span>
              </div>
              <div className="flex justify-between border-b border-line py-2">
                <span className="text-steel">Work interval</span>
                <span>{preset.work_seconds}s</span>
              </div>
              <div className="flex justify-between border-b border-line py-2">
                <span className="text-steel">Rest interval</span>
                <span>{preset.rest_seconds}s</span>
              </div>
              <div className="flex justify-between border-b border-line py-2">
                <span className="text-steel">Rounds</span>
                <span>{preset.rounds}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-steel">Cool down</span>
                <span>{preset.cooldown_seconds}s</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

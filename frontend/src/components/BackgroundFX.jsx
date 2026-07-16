import React from "react";
import { motion } from "framer-motion";

/**
 * Ambient backdrop used across the app: a faint red grid, two slow-pulsing
 * glow orbs, and a looping EKG/heartbeat line — the app's signature motif,
 * tying the "vitals" idea of fitness tracking to a persistent visual thread.
 */
export default function BackgroundFX({ variant = "default" }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-void">
      <div className="absolute inset-0 grid-fade" />

      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blood/30 animate-glowPulse" />
      <div
        className="absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-ember/20 animate-glowPulse"
        style={{ animationDelay: "1.5s" }}
      />

      {variant === "default" && (
        <svg
          className="absolute bottom-0 left-0 w-full opacity-[0.18]"
          height="140"
          viewBox="0 0 1440 140"
          preserveAspectRatio="none"
        >
          <motion.path
            d="M0 70 L200 70 L230 20 L260 120 L290 70 L500 70 L530 40 L560 100 L590 70 L900 70 L930 10 L960 130 L990 70 L1200 70 L1230 30 L1260 110 L1290 70 L1440 70"
            fill="none"
            stroke="#E31B3D"
            strokeWidth="2.5"
            strokeDasharray="1000"
            className="animate-pulseLine"
          />
        </svg>
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

let idCounter = 0;

export default function ParticleBurst({ trigger }) {
  const [bursts, setBursts] = useState([]);

  useEffect(() => {
    if (!trigger) return;
    const particles = Array.from({ length: 14 }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 60 + Math.random() * 60;
      return {
        id: idCounter++,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        color: Math.random() > 0.5 ? "#E31B3D" : "#FF5F6D",
      };
    });
    setBursts(particles);
    const timeout = setTimeout(() => setBursts([]), 700);
    return () => clearTimeout(timeout);
  }, [trigger]);

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <AnimatePresence>
        {bursts.map((p) => (
          <motion.span
            key={p.id}
            className="absolute h-2 w-2 rounded-full"
            style={{ backgroundColor: p.color }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

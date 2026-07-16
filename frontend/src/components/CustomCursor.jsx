import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [hovering, setHovering] = useState(false);
  const [trail, setTrail] = useState([]);
  const [isFinePointer] = useState(
    typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches
  );

  useEffect(() => {
    if (!isFinePointer) return;
    const move = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
      setTrail((prev) => [...prev.slice(-8), { x: e.clientX, y: e.clientY, id: Date.now() + Math.random() }]);
      setHovering(!!e.target.closest("a, button, [role='button'], input, select, textarea"));
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [isFinePointer]);

  if (!isFinePointer) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      {trail.map((t, i) => (
        <motion.div
          key={t.id}
          className="absolute rounded-full bg-blood"
          style={{ left: t.x, top: t.y, width: 4, height: 4, opacity: ((i + 1) / trail.length) * 0.4 }}
          initial={{ scale: 1 }}
          animate={{ scale: 0 }}
          transition={{ duration: 0.5 }}
        />
      ))}
      <motion.div
        className="absolute rounded-full border-2 border-blood"
        animate={{
          left: pos.x - (hovering ? 20 : 10),
          top: pos.y - (hovering ? 20 : 10),
          width: hovering ? 40 : 20,
          height: hovering ? 40 : 20,
          backgroundColor: hovering ? "rgba(227,27,61,0.15)" : "transparent",
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.5 }}
      />
    </div>
  );
}

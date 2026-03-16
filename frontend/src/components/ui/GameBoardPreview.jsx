import React, { useState, useEffect } from "react";
import { MousePointer2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Scénario prédéfini pour l'aperçu (formation d'un losange pour capture)
const PREVIEW_STEPS = [
  { type: "move", player: 1, x: 4, y: 3 }, // Haut
  { type: "move", player: 2, x: 4, y: 4 }, // Cible
  { type: "move", player: 1, x: 3, y: 4 }, // Gauche
  { type: "move", player: 2, x: 1, y: 1 }, // Coup inutile adverse
  { type: "move", player: 1, x: 5, y: 4 }, // Droite
  { type: "move", player: 2, x: 1, y: 2 }, // Coup inutile adverse
  { type: "move", player: 1, x: 4, y: 5 }, // Bas -> Capture!
  {
    type: "capture",
    player: 1,
    points: [{ x: 4, y: 4 }],
    territory: [
      { x: 4, y: 3 },
      { x: 5, y: 4 },
      { x: 4, y: 5 },
      { x: 3, y: 4 },
    ],
  },
  { type: "wait" },
  { type: "reset" },
];

export const GameBoardPreview = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const [stones, setStones] = useState([]);
  const [captured, setCaptured] = useState([]);
  const [territory, setTerritory] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 2, y: 2 });

  useEffect(() => {
    const step = PREVIEW_STEPS[stepIndex];
    const timer = setTimeout(() => {
      if (step.type === "move") {
        setCursorPos({ x: step.x, y: step.y });
        setTimeout(() => {
          setStones((prev) => [
            ...prev,
            { x: step.x, y: step.y, player: step.player },
          ]);
          setStepIndex((prev) => (prev + 1) % PREVIEW_STEPS.length);
        }, 600);
      } else if (step.type === "capture") {
        setTerritory(step.territory);
        setTimeout(() => {
          setCaptured((prev) => [...prev, ...step.points]);
          // Ne plus retirer les pierres capturées (elles restent sur le plateau)
          setStepIndex((prev) => (prev + 1) % PREVIEW_STEPS.length);
        }, 800);
      } else if (step.type === "wait") {
        setTimeout(() => {
          setStepIndex((prev) => (prev + 1) % PREVIEW_STEPS.length);
        }, 2000);
      } else if (step.type === "reset") {
        setStones([]);
        setCaptured([]);
        setTerritory(null);
        setStepIndex(0);
      }
    }, step.type === "move" ? 1000 : 500);

    return () => clearTimeout(timer);
  }, [stepIndex]);

  return (
    <div className="relative w-full h-full bg-[var(--bg-surface)] rounded-xl overflow-hidden p-2 border border-[var(--border-primary)] shadow-inner">
      {/* Grid background lines (Horizontal & Vertical) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Vertical Lines */}
        {[...Array(9)].map((_, i) => (
          <div
            key={`v-line-${i}`}
            className="absolute h-full w-[1px] bg-[var(--text-muted)] opacity-[0.15]"
            style={{ left: `${(i / 9) * 100 + 5.55}%` }}
          />
        ))}
        {/* Horizontal Lines */}
        {[...Array(9)].map((_, i) => (
          <div
            key={`h-line-${i}`}
            className="absolute w-full h-[1px] bg-[var(--text-muted)] opacity-[0.15]"
            style={{ top: `${(i / 9) * 100 + 5.55}%` }}
          />
        ))}
      </div>

      {/* Grid dots at intersections */}
      <div
        className="absolute inset-0 opacity-40 z-0"
        style={{
          backgroundImage:
            "radial-gradient(var(--text-muted) 1.5px, transparent 1.5px)",
          backgroundSize: "calc(100% / 9) calc(100% / 9)",
          backgroundPosition: "calc(100% / 18) calc(100% / 18)",
        }}
      />

      {/* Territory Path */}
      <AnimatePresence>
        {territory && (
          <motion.svg
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 w-full h-full z-0 pointer-events-none"
            viewBox="0 0 100 100"
          >
            <motion.polygon
              initial={{ pathLength: 0, fill: "rgba(217, 70, 239, 0)" }}
              animate={{ pathLength: 1, fill: "rgba(217, 70, 239, 0.15)" }}
              points={territory
                .map((p) => `${(p.x / 9) * 100 + 5.5},${(p.y / 9) * 100 + 5.5}`)
                .join(" ")}
              className="stroke-[var(--accent-fuchsia)] stroke-[0.5] fill-[var(--accent-fuchsia)]/20"
              style={{ strokeLinejoin: "round" }}
            />
          </motion.svg>
        )}
      </AnimatePresence>

      {/* Stones */}
      <AnimatePresence>
        {stones.map((stone, i) => (
          <motion.div
            key={`stone-${i}-${stone.x}-${stone.y}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="absolute w-[11.11%] h-[11.11%] flex items-center justify-center pointer-events-none"
            style={{
              left: `${(stone.x / 9) * 100}%`,
              top: `${(stone.y / 9) * 100}%`,
            }}
          >
            <div
              className={`w-[45%] h-[45%] rounded-full shadow-lg border ${
                stone.player === 1
                  ? "bg-white border-slate-200 shadow-white/20"
                  : "bg-slate-900 border-slate-700 shadow-black/40"
              }`}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Captured effect */}
      {captured.map((p, i) => (
        <motion.div
          key={`captured-${i}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 0.5, 0], scale: [0.5, 1.5, 2] }}
          className="absolute w-[11.11%] h-[11.11%] bg-[var(--accent-fuchsia)] rounded-full blur-md"
          style={{
            left: `${(p.x / 9) * 100}%`,
            top: `${(p.y / 9) * 100}%`,
          }}
        />
      ))}

      {/* Animated Cursor */}
      <motion.div
        animate={{
          left: `${(cursorPos.x / 9) * 100}%`,
          top: `${(cursorPos.y / 9) * 100}%`,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 15 }}
        className="absolute w-[11.11%] h-[11.11%] z-20 pointer-events-none flex items-center justify-center"
      >
        <MousePointer2 className="w-5 h-5 text-[var(--accent-fuchsia)] drop-shadow-md" />
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0, 0.5, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute inset-0 bg-[var(--accent-fuchsia)]/20 rounded-full"
        />
      </motion.div>
    </div>
  );
};

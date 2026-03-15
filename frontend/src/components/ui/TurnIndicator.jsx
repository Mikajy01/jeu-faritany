import React from "react";
import { Sparkles, Hourglass, PlayCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const TurnIndicator = ({ gameActive, playerId, currentPlayer }) => {
  const isMyTurn = playerId === currentPlayer;

  const getStatus = () => {
    if (!gameActive)
      return {
        text: "En attente d'un adversaire...",
        icon: Hourglass,
        color: "text-[var(--text-muted)]",
        bg: "bg-[var(--bg-surface)]",
        border: "border-[var(--border-primary)]",
      };
    if (isMyTurn)
      return {
        text: "C'est votre tour !",
        icon: Sparkles,
        color: "text-[var(--accent-fuchsia)]",
        bg: "bg-[var(--accent-fuchsia)]/10",
        border: "border-[var(--accent-fuchsia)]/30",
      };
    return {
      text: "Adversaire en train de jouer...",
      icon: PlayCircle,
      color: "text-[var(--accent-cyan)]",
      bg: "bg-[var(--accent-cyan)]/10",
      border: "border-[var(--accent-cyan)]/30",
    };
  };

  const status = getStatus();
  const Icon = status.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status.text}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`flex items-center gap-4 p-5 rounded-2xl border transition-all duration-500 ${status.bg} ${status.border}`}
      >
        <div
          className={`p-3 rounded-xl bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] ${status.color}`}
        >
          <Icon className={`w-6 h-6 ${isMyTurn ? "animate-pulse" : ""}`} />
        </div>
        <div className="flex flex-col">
          <span
            className={`text-xs font-bold uppercase tracking-[0.2em] opacity-50 ${status.color}`}
          >
            Statut
          </span>
          <span
            className={`text-sm font-bold tracking-tight text-[var(--text-primary)]`}
          >
            {status.text}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

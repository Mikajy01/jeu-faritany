import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Home,
  RotateCcw,
  Frown,
  PartyPopper,
  TrendingUp,
} from "lucide-react";
import confetti from "canvas-confetti";

export const GameOverModal = ({
  isOpen,
  winner,
  myPlayerId,
  scores,
  reason,
  onReset,
  onBackToMenu,
  rematchRequestedBy, // ✨ Nouveau
}) => {
  const isWinner = winner === myPlayerId;
  const isDraw = winner === 0;
  const hasRequestedRematch = rematchRequestedBy === myPlayerId;
  const opponentRequestedRematch =
    rematchRequestedBy && rematchRequestedBy !== myPlayerId;

  useEffect(() => {
    if (isOpen && isWinner) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen, isWinner]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[var(--bg-primary)]/90 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={`relative w-full max-w-md overflow-hidden rounded-[2.5rem] border p-1 shadow-2xl ${
            isWinner
              ? "border-[var(--accent-amber)]/50 bg-gradient-to-b from-[var(--accent-amber)]/10 to-[var(--bg-secondary)]"
              : "border-[var(--border-primary)] bg-[var(--bg-secondary)]"
          }`}
        >
          <div className="bg-[var(--bg-secondary)] rounded-[2.4rem] p-8 flex flex-col items-center text-center">
            {/* Header Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12, delay: 0.2 }}
              className={`mb-6 flex h-24 w-24 items-center justify-center rounded-3xl shadow-2xl ${
                isWinner
                  ? "bg-gradient-to-br from-[var(--accent-amber)] to-orange-600 text-white shadow-[var(--accent-amber)]/20"
                  : "bg-[var(--bg-surface)] text-[var(--text-muted)] shadow-black/20"
              }`}
            >
              {isWinner ? (
                <Trophy className="h-12 w-12" />
              ) : isDraw ? (
                <PartyPopper className="h-12 w-12" />
              ) : (
                <Frown className="h-12 w-12" />
              )}
            </motion.div>

            {/* Result Title */}
            <h2
              className={`mb-2 text-4xl font-black uppercase tracking-tighter ${isWinner ? "text-[var(--accent-amber)]" : "text-[var(--text-primary)]"}`}
            >
              {isWinner ? "Victoire !" : isDraw ? "Match Nul" : "Défaite"}
            </h2>

            <p className="mb-8 text-[var(--text-secondary)] text-sm font-medium">
              {isWinner
                ? "Félicitations ! Vous avez dominé le territoire."
                : isDraw
                  ? "Une égalité parfaite ! Belle bataille."
                  : "Pas de chance cette fois... Continuez à vous entraîner !"}
              <br />
              <span className="mt-1 block text-[10px] opacity-50 uppercase tracking-widest text-[var(--text-muted)]">
                Raison :{" "}
                {reason === "TIMEOUT"
                  ? "Temps écoulé"
                  : reason === "RESIGN"
                    ? "Abandon"
                    : "Fin de partie"}
              </span>
            </p>

            {/* Scores Card */}
            <div className="mb-8 grid w-full grid-cols-2 gap-4">
              <div className="rounded-2xl bg-[var(--bg-surface)] p-4 border border-[var(--border-primary)]">
                <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">
                  Joueur 1 {myPlayerId === 1 && "(Vous)"}
                </div>
                <div className="text-3xl font-mono font-black text-[var(--accent-fuchsia)]">
                  {scores?.player1 || 0}
                </div>
              </div>
              <div className="rounded-2xl bg-[var(--bg-surface)] p-4 border border-[var(--border-primary)]">
                <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">
                  Joueur 2 {myPlayerId === 2 && "(Vous)"}
                </div>
                <div className="text-3xl font-mono font-black text-[var(--accent-cyan)]">
                  {scores?.player2 || 0}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex w-full flex-col gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onReset}
                disabled={hasRequestedRematch}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-black uppercase tracking-widest transition-all shadow-lg ${
                  hasRequestedRematch
                    ? "bg-[var(--bg-surface)] text-[var(--text-muted)] cursor-not-allowed"
                    : opponentRequestedRematch
                      ? "bg-[var(--accent-emerald)] text-white hover:opacity-90 shadow-[var(--accent-emerald)]/20"
                      : isWinner
                        ? "bg-[var(--accent-amber)] text-slate-950 hover:opacity-90 shadow-[var(--accent-amber)]/20"
                        : "bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90"
                }`}
              >
                <RotateCcw
                  className={`h-5 w-5 ${hasRequestedRematch ? "animate-spin" : ""}`}
                />
                {hasRequestedRematch
                  ? "Attente adversaire..."
                  : opponentRequestedRematch
                    ? "Accepter Revanche"
                    : "Rejouer"}
              </motion.button>

              <button
                onClick={onBackToMenu}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <Home className="h-5 w-5" />
                Retour au menu
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

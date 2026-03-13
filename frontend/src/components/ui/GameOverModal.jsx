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
}) => {
  const isWinner = winner === myPlayerId;
  const isDraw = winner === 0;

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
          className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={`relative w-full max-w-md overflow-hidden rounded-[2.5rem] border p-1 shadow-2xl ${
            isWinner
              ? "border-yellow-500/50 bg-gradient-to-b from-yellow-500/10 to-slate-900"
              : "border-slate-700/50 bg-slate-900"
          }`}
        >
          <div className="bg-slate-900 rounded-[2.4rem] p-8 flex flex-col items-center text-center">
            {/* Header Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12, delay: 0.2 }}
              className={`mb-6 flex h-24 w-24 items-center justify-center rounded-3xl shadow-2xl ${
                isWinner
                  ? "bg-gradient-to-br from-yellow-400 to-orange-600 text-white shadow-yellow-500/20"
                  : "bg-slate-800 text-slate-400 shadow-black/20"
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
              className={`mb-2 text-4xl font-black uppercase tracking-tighter ${isWinner ? "text-yellow-400" : "text-white"}`}
            >
              {isWinner ? "Victoire !" : isDraw ? "Match Nul" : "Défaite"}
            </h2>

            <p className="mb-8 text-slate-400 text-sm font-medium">
              {isWinner
                ? "Félicitations ! Vous avez dominé le territoire."
                : isDraw
                  ? "Une égalité parfaite ! Belle bataille."
                  : "Pas de chance cette fois... Continuez à vous entraîner !"}
              <br />
              <span className="mt-1 block text-[10px] opacity-50 uppercase tracking-widest">
                Raison :{" "}
                {reason === "TIMEOUT" ? "Temps écoulé" : "Fin de partie"}
              </span>
            </p>

            {/* Scores Card */}
            <div className="mb-8 grid w-full grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-800/50 p-4 border border-slate-700/30">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Joueur 1 {myPlayerId === 1 && "(Vous)"}
                </div>
                <div className="text-3xl font-mono font-black text-fuchsia-400">
                  {scores?.player1 || 0}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-800/50 p-4 border border-slate-700/30">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  Joueur 2 {myPlayerId === 2 && "(Vous)"}
                </div>
                <div className="text-3xl font-mono font-black text-cyan-400">
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
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-black uppercase tracking-widest transition-all shadow-lg ${
                  isWinner
                    ? "bg-yellow-500 text-slate-950 hover:bg-yellow-400 shadow-yellow-500/20"
                    : "bg-white text-slate-950 hover:bg-slate-100"
                }`}
              >
                <RotateCcw className="h-5 w-5" />
                Rejouer
              </motion.button>

              <button
                onClick={onBackToMenu}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold text-slate-500 hover:text-white transition-colors"
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

import React from "react";
import { ChessTimer } from "./ChessTimer";
import { motion, AnimatePresence } from "framer-motion";
import { User, Trophy } from "lucide-react";

export const PlayerCard = ({
  player,
  score,
  isCurrentPlayer,
  isActive,
  isYou,
  showTimer = true,
  timeLeft = 600,
  onTimeUp,
  compact = false,
  minimalist = false,
  isOnline = true, // ✨ Nouveau prop: statut de connexion
}) => {
  const isPlayer1 = player === 1;
  const isActiveTurn = isCurrentPlayer && isActive && isOnline; // Désactivé si offline

  const themes = {
    p1: {
      accent: "text-fuchsia-400",
      bg: "bg-fuchsia-500/10",
      border: "border-fuchsia-500/30",
      glow: "shadow-fuchsia-500/20",
      gradient: "from-fuchsia-500 to-purple-600",
      light: "bg-fuchsia-400",
    },
    p2: {
      accent: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/30",
      glow: "shadow-cyan-500/20",
      gradient: "from-cyan-500 to-blue-600",
      light: "bg-cyan-400",
    },
  };

  const theme = isPlayer1 ? themes.p1 : themes.p2;

  if (minimalist) {
    return (
      <motion.div
        initial={false}
        animate={{
          scale: isActiveTurn ? 1.02 : 1,
          borderColor: isActiveTurn
            ? "rgba(255, 255, 255, 0.3)"
            : "rgba(255, 255, 255, 0.1)",
          opacity: isOnline ? 1 : 0.7,
        }}
        className={`
          relative overflow-hidden rounded-lg border backdrop-blur-md transition-all duration-500 px-2 py-1.5 flex items-center justify-between gap-1 w-full
          ${isActiveTurn ? "bg-slate-800/90 shadow-lg z-20 border-white/20" : "bg-slate-900/60 z-10 border-white/5"}
        `}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={`
            w-5 h-5 rounded-md flex items-center justify-center border shrink-0
            ${isActiveTurn ? `bg-gradient-to-br ${theme.gradient} border-white/20` : `bg-slate-800 border-slate-700`}
          `}
          >
            <User
              className={`w-3 h-3 ${isActiveTurn ? "text-white" : theme.accent}`}
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span
              className={`font-bold text-[10px] truncate ${isActiveTurn ? "text-white" : "text-slate-300"}`}
            >
              P{player}
            </span>
            {isYou && (
              <span className="text-[7px] text-slate-500 uppercase leading-none">
                VOUS
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 bg-slate-950/60 px-1.5 py-0.5 rounded-md border border-slate-700/30">
            <Trophy className={`w-2.5 h-2.5 ${theme.accent} opacity-70`} />
            <span className="text-xs font-black text-white">{score}</span>
          </div>

          {showTimer && (
            <div
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${isActiveTurn ? "bg-slate-900 border-slate-600" : "bg-slate-950/60 border-slate-700/30"}`}
            >
              <ChessTimer
                timeLeft={timeLeft}
                isActive={isActiveTurn}
                isLowTime={timeLeft <= 30}
                onTimeUp={onTimeUp}
                compact={true}
                minimalist={true}
              />
            </div>
          )}
        </div>

        {isActiveTurn && showTimer && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${theme.gradient} origin-left`}
          />
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={false}
      animate={{
        scale: isActiveTurn ? 1.05 : 1,
        borderColor: isActiveTurn
          ? "rgba(255, 255, 255, 0.4)"
          : !isOnline
            ? "rgba(244, 63, 94, 0.3)"
            : "rgba(255, 255, 255, 0.1)",
        opacity: isOnline ? 1 : 0.7,
      }}
      className={`
        relative overflow-hidden rounded-2xl border backdrop-blur-md transition-all duration-500
        ${isActiveTurn ? "bg-slate-800/60 shadow-2xl z-20" : !isOnline ? "bg-rose-950/10 z-10" : "bg-slate-900/40 z-10"}
        ${compact ? "w-full" : "w-full max-w-[240px]"}
      `}
    >
      {/* Offline Overlay Overlay */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-rose-950/20 backdrop-blur-[1px] flex items-center justify-center z-30"
          >
            <div className="bg-rose-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg uppercase tracking-tighter">
              Hors ligne
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated active border gradient */}
      <AnimatePresence>
        {isActiveTurn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 bg-gradient-to-br ${theme.bg} opacity-20 pointer-events-none`}
          />
        )}
      </AnimatePresence>

      <div className="p-4 space-y-4">
        {/* Header: Player Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`
              w-10 h-10 rounded-xl flex items-center justify-center border
              ${isActiveTurn ? `bg-gradient-to-br ${theme.gradient} border-white/20 shadow-lg` : isOnline ? `bg-slate-800 border-slate-700` : `bg-rose-900/20 border-rose-500/30`}
            `}
            >
              <User
                className={`w-5 h-5 ${isActiveTurn ? "text-white" : isOnline ? theme.accent : "text-rose-400"}`}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-bold text-sm tracking-tight ${isActiveTurn ? "text-white" : isOnline ? "text-slate-300" : "text-rose-300"}`}
                >
                  Joueur {player}
                </span>
                {isYou && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700">
                    VOUS
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${isActiveTurn ? theme.light + " animate-pulse" : isOnline ? "bg-slate-700" : "bg-rose-500"}`}
                />
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {!isOnline
                    ? "Déconnecté"
                    : isActiveTurn
                      ? "En train de jouer"
                      : "En attente"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Score & Timer Section */}
        <div className="flex items-stretch gap-3">
          {/* Score Display */}
          <div className="flex-1 bg-slate-950/50 rounded-xl p-3 border border-slate-800/50 flex flex-col items-center justify-center">
            <Trophy className={`w-3.5 h-3.5 mb-1 ${theme.accent} opacity-50`} />
            <span className="text-2xl font-black text-white leading-none">
              {score}
            </span>
            <span className="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-widest">
              Points
            </span>
          </div>

          {/* Timer Display */}
          {showTimer && (
            <div
              className={`
              flex-1 rounded-xl p-3 border flex flex-col items-center justify-center transition-colors
              ${isActiveTurn ? "bg-slate-900 border-slate-700" : "bg-slate-950/30 border-slate-800/50"}
            `}
            >
              <ChessTimer
                timeLeft={timeLeft}
                isActive={isActiveTurn}
                isLowTime={timeLeft <= 30}
                onTimeUp={onTimeUp}
                compact={true}
              />
              <span className="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-widest">
                Temps
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Active Turn Progress Bar (Subtle) */}
      {isActiveTurn && showTimer && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.gradient} origin-left`}
        />
      )}
    </motion.div>
  );
};

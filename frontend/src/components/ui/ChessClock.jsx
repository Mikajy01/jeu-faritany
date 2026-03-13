import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, AlertCircle, Clock, Zap, User } from "lucide-react";

export const ChessClock = ({
  remainingMoveTime,
  remainingGameTime,
  gameStartTime,
  currentPlayer,
  gameActive,
  lastMoveTimestamp,
  gameMode = "TIME",
  targetScore = 20,
}) => {
  const [moveDisplay, setMoveDisplay] = useState(remainingMoveTime);
  const [gameDisplay, setGameDisplay] = useState(remainingGameTime);
  const timerRef = useRef(null);

  // Fonction de calcul du temps global restant
  const calculateGlobalRemaining = () => {
    if (!gameStartTime || gameMode !== "TIME") return remainingGameTime;
    const elapsedSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
    return Math.max(0, remainingGameTime - elapsedSeconds);
  };

  // Synchronisation avec les props
  useEffect(() => {
    setMoveDisplay(remainingMoveTime);
    setGameDisplay(calculateGlobalRemaining());
  }, [remainingMoveTime, remainingGameTime, gameStartTime, lastMoveTimestamp]);

  // Tick local pour la fluidité
  useEffect(() => {
    if (!gameActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setMoveDisplay((prev) => Math.max(0, prev - 1));
      // Le temps global se décompte toujours
      setGameDisplay(calculateGlobalRemaining());
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameActive, gameStartTime, remainingGameTime]);

  const formatTime = (seconds) => {
    if (seconds >= 3600) {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* 🌍 CHRONO GLOBAL OU OBJECTIF SCORE */}
      <div className="relative w-full bg-slate-900/80 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-cyan-500/5 pointer-events-none" />

        {gameMode === "TIME" ? (
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">
                Temps de Partie
              </span>
            </div>

            <div
              className={`text-6xl font-mono font-black tabular-nums tracking-tighter transition-colors duration-300 ${gameDisplay <= 60 ? "text-rose-500 animate-pulse" : "text-white"}`}
            >
              {formatTime(gameDisplay)}
            </div>

            <AnimatePresence>
              {gameActive && gameDisplay <= 60 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 flex items-center gap-1.5 text-rose-500/80"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Fin imminente
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">
                Objectif à atteindre
              </span>
            </div>

            <div className="text-6xl font-mono font-black tabular-nums tracking-tighter text-emerald-400">
              {targetScore}
              <span className="text-2xl ml-2 opacity-50 uppercase">pts</span>
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-widest">
                Le premier à {targetScore} gagne
              </span>
            </div>
          </div>
        )}

        {/* Progress Bar (Only for TIME mode) */}
        {gameMode === "TIME" && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800/50">
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: gameActive ? 0 : 1 }}
              transition={{ duration: remainingGameTime, ease: "linear" }}
              className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 origin-left"
            />
          </div>
        )}
      </div>

      {/* ⚡ CHRONO PAR COUP (Joueur Actuel) */}
      <div className="flex items-center gap-3">
        <div
          className={`
          flex-1 flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-500
          ${gameActive ? "bg-slate-800/60 border-slate-700 shadow-xl" : "bg-slate-900/40 border-slate-800 opacity-50"}
        `}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${currentPlayer === 1 ? "bg-fuchsia-500/20 border-fuchsia-500/30 text-fuchsia-400" : "bg-cyan-500/20 border-cyan-500/30 text-cyan-400"}`}
            >
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Tour du Joueur {currentPlayer}
              </div>
              <div className="text-sm font-bold text-white">Action requise</div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Timer
                className={`w-3.5 h-3.5 ${moveDisplay <= 10 ? "text-rose-500 animate-pulse" : "text-emerald-400"}`}
              />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Chrono Coup
              </span>
            </div>
            <div
              className={`text-3xl font-mono font-black tabular-nums ${moveDisplay <= 10 ? "text-rose-500 animate-pulse" : "text-white"}`}
            >
              {moveDisplay}
              <span className="text-xs ml-1 opacity-50">s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

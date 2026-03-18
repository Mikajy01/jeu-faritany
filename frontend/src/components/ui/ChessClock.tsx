import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Clock, Zap, User } from "lucide-react";

export const ChessClock = ({
  remainingMoveTime,
  remainingGameTime,
  gameStartTime,
  gameActive,
  lastMoveTimestamp,
  gameMode = "TIME",
  targetScore = 20,
}: any) => {
  const [gameDisplay, setGameDisplay] = useState(remainingGameTime);
  const [moveDisplay, setMoveDisplay] = useState(remainingMoveTime);
  const timerRef = useRef(null);

  // Fonction de calcul du temps global restant
  const calculateGlobalRemaining = () => {
    if (!gameStartTime || gameMode !== "TIME") return remainingGameTime;
    const elapsedSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
    return Math.max(0, remainingGameTime - elapsedSeconds);
  };

  // Synchronisation avec les props
  useEffect(() => {
    setGameDisplay(calculateGlobalRemaining());
    setMoveDisplay(remainingMoveTime);
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
      <div className="relative w-full bg-[var(--bg-card)] backdrop-blur-xl p-6 rounded-[2rem] border border-[var(--border-primary)] shadow-2xl overflow-hidden text-center transition-colors duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-fuchsia)]/5 to-[var(--accent-cyan)]/5 pointer-events-none" />

        {gameMode === "TIME" ? (
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="text-xs font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">
                Temps de Partie
              </span>
            </div>

            <div
              className={`text-6xl font-mono font-black tabular-nums tracking-tighter transition-colors duration-300 ${gameDisplay <= 60 ? "text-[var(--accent-rose)] animate-pulse" : "text-[var(--text-primary)]"}`}
            >
              {formatTime(gameDisplay)}
            </div>

            <AnimatePresence>
              {gameActive && gameDisplay <= 60 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 flex items-center gap-1.5 text-[var(--accent-rose)]/80"
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
              <Zap className="w-4 h-4 text-[var(--accent-emerald)]" />
              <span className="text-xs font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">
                Objectif à atteindre
              </span>
            </div>

            <div className="text-6xl font-mono font-black tabular-nums tracking-tighter text-[var(--accent-emerald)]">
              {targetScore}
              <span className="text-2xl ml-2 opacity-50 uppercase">pts</span>
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-[var(--text-muted)]">
              <span className="text-[10px] font-black uppercase tracking-widest">
                Le premier à {targetScore} gagne
              </span>
            </div>
          </div>
        )}

        {/* Progress Bar (Only for TIME mode) */}
        {gameMode === "TIME" && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[var(--border-primary)]">
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: gameActive ? 0 : 1 }}
              transition={{ duration: remainingGameTime, ease: "linear" }}
              className="h-full bg-gradient-to-r from-[var(--accent-fuchsia)] to-[var(--accent-cyan)] origin-left"
            />
          </div>
        )}
      </div>

      {/* ⏱️ TEMPS DU TOUR ACTUEL */}
      {/* {gameActive && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full bg-[var(--bg-surface)]/60 backdrop-blur-md p-4 rounded-2xl border border-[var(--border-primary)] shadow-xl overflow-hidden text-center"
        >
          <div className="relative z-10 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[var(--accent-fuchsia)]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                Temps du Tour
              </span>
            </div>
            <div
              className={`text-2xl font-mono font-black tabular-nums tracking-tight ${moveDisplay <= 10 ? "text-[var(--accent-rose)] animate-pulse" : "text-[var(--text-primary)]"}`}
            >
              {formatTime(moveDisplay)}
            </div>
          </div>
        </motion.div>
      )} */}
    </div>
  );
};

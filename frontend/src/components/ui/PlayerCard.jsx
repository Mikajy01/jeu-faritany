import { User, Trophy, Flag, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChessTimer } from "./ChessTimer";
import { useGameContext } from "../../context/GameContext";
import { useTheme } from "../../context/ThemeContext";

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
  const { theme: currentTheme } = useTheme();
  const isPlayer1 = player === 1;
  const isActiveTurn = isCurrentPlayer && isActive && isOnline; // Désactivé si offline

  const themes = {
    p1: {
      accent: "text-[var(--accent-fuchsia)]",
      bg: "bg-[var(--accent-fuchsia)]/10",
      border: "border-[var(--accent-fuchsia)]/30",
      glow: "shadow-[var(--accent-fuchsia)]/20",
      gradient: "from-fuchsia-500 to-purple-600",
      light: "bg-fuchsia-400",
    },
    p2: {
      accent: "text-[var(--accent-cyan)]",
      bg: "bg-[var(--accent-cyan)]/10",
      border: "border-[var(--accent-cyan)]/30",
      glow: "shadow-[var(--accent-cyan)]/20",
      gradient: "from-cyan-500 to-blue-600",
      light: "bg-cyan-400",
    },
  };

  const theme = isPlayer1 ? themes.p1 : themes.p2;
  const isDarkMode = currentTheme === "dark";

  if (minimalist) {
    return (
      <motion.div
        initial={false}
        animate={{
          scale: isActiveTurn ? 1.02 : 1,
          borderColor: isActiveTurn
            ? "var(--accent-fuchsia)"
            : "var(--border-primary)",
          opacity: isOnline ? 1 : 0.7,
        }}
        className={`
          relative overflow-hidden rounded-lg border backdrop-blur-md transition-all duration-500 px-1 py-0.5 flex items-center justify-between gap-0.5 w-full
          ${isActiveTurn ? `bg-[var(--bg-secondary)] shadow-lg z-20 ${theme.border}` : "bg-[var(--bg-surface)]/60 z-10 border-[var(--border-primary)]"}
        `}
      >
        <div className="flex items-center gap-0.5 min-w-0">
          <div
            className={`
            w-3.5 h-3.5 rounded-md flex items-center justify-center border shrink-0
            ${isActiveTurn ? `bg-gradient-to-br ${theme.gradient} border-white/20` : `bg-[var(--bg-surface)] border-[var(--border-primary)]`}
          `}
          >
            <User
              className={`w-2 h-2 ${isActiveTurn ? "text-white" : theme.accent}`}
            />
          </div>
          <div className="flex flex-col min-w-0 leading-tight">
            <span
              className={`font-black text-[8px] truncate ${isActiveTurn ? (isDarkMode ? "text-white" : "text-[var(--accent-fuchsia)]") : "text-[var(--text-primary)]"}`}
            >
              P{player}
            </span>
            {isYou && (
              <span className="text-[5px] text-[var(--text-muted)] uppercase leading-none font-black">
                VOUS
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <div className="flex items-center gap-0.5 bg-[var(--bg-secondary)] px-1 py-0.5 rounded-md border border-[var(--border-primary)]">
            <Trophy className={`w-1.5 h-1.5 ${theme.accent} opacity-70`} />
            <span className="text-[9px] font-black text-[var(--text-primary)]">
              {score}
            </span>
          </div>

          {showTimer && (
            <div
              className={`flex items-center gap-0.5 px-0.5 py-0.5 rounded-md border ${isActiveTurn ? "bg-[var(--bg-surface)] border-[var(--accent-fuchsia)]/30" : "bg-[var(--bg-secondary)]/60 border-[var(--border-primary)]"}`}
            >
              <ChessTimer
                timeLeft={timeLeft}
                isActive={isActiveTurn}
                onTimeUp={onTimeUp}
                minimalist={true}
              />
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={false}
      animate={{
        scale: isActiveTurn ? 1.05 : 1,
        borderColor: isActiveTurn
          ? isDarkMode
            ? "rgba(255, 255, 255, 0.4)"
            : "var(--accent-fuchsia)"
          : !isOnline
            ? "var(--accent-rose)"
            : "var(--border-primary)",
        opacity: isOnline ? 1 : 0.7,
      }}
      className={`
        relative overflow-hidden rounded-2xl border backdrop-blur-md transition-all duration-500
        ${isActiveTurn ? "bg-[var(--bg-secondary)] shadow-2xl z-20" : !isOnline ? "bg-[var(--accent-rose)]/10 z-10" : "bg-[var(--bg-card)] z-10"}
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
            className="absolute inset-0 bg-[var(--accent-rose)]/20 backdrop-blur-[1px] flex items-center justify-center z-30"
          >
            <div className="bg-[var(--accent-rose)] text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg uppercase tracking-tighter">
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
              ${isActiveTurn ? `bg-gradient-to-br ${theme.gradient} border-white/20 shadow-lg` : isOnline ? `bg-[var(--bg-surface)] border-[var(--border-primary)]` : `bg-[var(--accent-rose)]/20 border-[var(--accent-rose)]/30`}
            `}
            >
              <User
                className={`w-5 h-5 ${isActiveTurn ? "text-white" : isOnline ? theme.accent : "text-[var(--accent-rose)]"}`}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-bold text-sm tracking-tight ${isActiveTurn ? (isDarkMode ? "text-white" : "text-[var(--accent-fuchsia)]") : isOnline ? "text-[var(--text-primary)]" : "text-[var(--accent-rose)]"}`}
                >
                  Joueur {player}
                </span>
                {isYou && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-primary)] font-bold">
                    VOUS
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${isActiveTurn ? theme.light + " animate-pulse" : isOnline ? "bg-[var(--text-muted)]" : "bg-[var(--accent-rose)]"}`}
                />
                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
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
          <div className="flex-1 bg-[var(--bg-secondary)] rounded-xl p-3 border border-[var(--border-primary)] flex flex-col items-center justify-center shadow-sm">
            <Trophy className={`w-3.5 h-3.5 mb-1 ${theme.accent} opacity-70`} />
            <span className="text-2xl font-black text-[var(--text-primary)] leading-none">
              {score}
            </span>
            <span className="text-[9px] text-[var(--text-muted)] font-black uppercase mt-1 tracking-widest">
              Points
            </span>
          </div>

          {/* Timer Display */}
          {showTimer && (
            <div
              className={`
              flex-1 rounded-xl p-3 border flex flex-col items-center justify-center transition-colors shadow-sm
              ${isActiveTurn ? "bg-[var(--bg-surface)] border-[var(--accent-fuchsia)]/30" : "bg-[var(--bg-secondary)]/30 border-[var(--border-primary)]"}
            `}
            >
              <ChessTimer
                timeLeft={timeLeft}
                isActive={isActiveTurn}
                isLowTime={timeLeft <= 30}
                onTimeUp={onTimeUp}
                compact={true}
              />
              <span className="text-[9px] text-[var(--text-muted)] font-black uppercase mt-1 tracking-widest">
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

import { User, Trophy, Flag, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChessTimer } from "./ChessTimer";
import { useTheme } from "../../context/ThemeContext";

export const PlayerCard = ({
  player,
  score,
  isCurrentPlayer,
  isActive,
  isYou,
  showTimer = true,
  timeLeft = 600,
  onTimeUp = () => {},
  compact = false,
  minimalist = false,
  isOnline = true,
  hasLeft = false,
}) => {
  const { theme: currentTheme } = useTheme();
  const isPlayer1 = player === 1;
  const isActiveTurn = isCurrentPlayer && isActive && isOnline && !hasLeft;

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
  const isDistressed = hasLeft || !isOnline;

  // ── Minimalist (mobile) ──────────────────────────────────────────────────────
  if (minimalist) {
    return (
      <motion.div
        initial={false}
        animate={{
          scale: isActiveTurn ? 1.02 : 1,
          borderColor: isActiveTurn
            ? "var(--accent-fuchsia)"
            : isDistressed
              ? "var(--accent-rose)"
              : "var(--border-primary)",
          opacity: isDistressed ? 0.7 : 1,
        }}
        className={`
          relative overflow-hidden rounded-lg border backdrop-blur-md transition-all duration-500
          px-1 py-0.5 flex items-center justify-between gap-0.5 w-full
          ${isActiveTurn
            ? `bg-[var(--bg-secondary)] shadow-lg z-20 ${theme.border}`
            : isDistressed
              ? "bg-[var(--accent-rose)]/10 z-10"
              : "bg-[var(--bg-surface)]/60 z-10 border-[var(--border-primary)]"}
        `}
      >
        <div className="flex items-center gap-0.5 min-w-0">
          <div
            className={`
              w-3.5 h-3.5 rounded-md flex items-center justify-center border shrink-0
              ${isActiveTurn
                ? `bg-gradient-to-br ${theme.gradient} border-white/20`
                : `bg-[var(--bg-surface)] border-[var(--border-primary)]`}
            `}
          >
            <User className={`w-2 h-2 ${isActiveTurn ? "text-white" : theme.accent}`} />
          </div>
          <div className="flex flex-col min-w-0 leading-tight">
            <span
              className={`font-black text-[8px] truncate ${
                isActiveTurn
                  ? isDarkMode ? "text-white" : "text-[var(--accent-fuchsia)]"
                  : "text-[var(--text-primary)]"
              }`}
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
            <span className="text-[9px] font-black text-[var(--text-primary)]">{score}</span>
          </div>

          {showTimer && (
            <div
              className={`flex items-center gap-0.5 px-0.5 py-0.5 rounded-md border ${
                isActiveTurn
                  ? "bg-[var(--bg-surface)] border-[var(--accent-fuchsia)]/30"
                  : "bg-[var(--bg-secondary)]/60 border-[var(--border-primary)]"
              }`}
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

  // ── Full card (desktop sidebar) ──────────────────────────────────────────────
  return (
    <motion.div
      initial={false}
      animate={{
        scale: isActiveTurn ? 1.02 : 1,
        borderColor: isActiveTurn
          ? isDarkMode ? "rgba(255,255,255,0.4)" : "var(--accent-fuchsia)"
          : isDistressed
            ? "var(--accent-rose)"
            : "var(--border-primary)",
        opacity: isDistressed ? 0.7 : 1,
      }}
      className={`
        relative overflow-hidden rounded-2xl border backdrop-blur-md transition-all duration-500
        w-full
        ${isActiveTurn
          ? "bg-[var(--bg-secondary)] shadow-2xl z-20"
          : isDistressed
            ? "bg-[var(--accent-rose)]/10 z-10"
            : "bg-[var(--bg-card)] z-10"}
      `}
    >
      {/* Offline / Left Overlay */}
      <AnimatePresence>
        {isDistressed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[var(--accent-rose)]/20 backdrop-blur-[1px] flex items-center justify-center z-30"
          >
            <div className="bg-[var(--accent-rose)] text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg uppercase tracking-tighter">
              {hasLeft ? "A quitté" : "Hors ligne"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active background tint */}
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

      {/* ── Content: padding réduit, pas de tailles fixes ── */}
      <div className="p-3 flex flex-col gap-2">

        {/* Header row */}
        <div className="flex items-center gap-2">
          <div
            className={`
              w-8 h-8 rounded-xl flex items-center justify-center border shrink-0
              ${isActiveTurn
                ? `bg-gradient-to-br ${theme.gradient} border-white/20 shadow-lg`
                : isDistressed
                  ? `bg-[var(--accent-rose)]/20 border-[var(--accent-rose)]/30`
                  : `bg-[var(--bg-surface)] border-[var(--border-primary)]`}
            `}
          >
            <User
              className={`w-4 h-4 ${
                isActiveTurn ? "text-white" : isDistressed ? "text-[var(--accent-rose)]" : theme.accent
              }`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`font-bold text-sm tracking-tight ${
                  isActiveTurn
                    ? isDarkMode ? "text-white" : "text-[var(--accent-fuchsia)]"
                    : isDistressed
                      ? "text-[var(--accent-rose)]"
                      : "text-[var(--text-primary)]"
                }`}
              >
                Joueur {player}
              </span>
              {isYou && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-primary)] font-bold">
                  VOUS
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isActiveTurn
                    ? `${theme.light} animate-pulse`
                    : isDistressed
                      ? "bg-[var(--accent-rose)]"
                      : "bg-[var(--text-muted)]"
                }`}
              />
              <span className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                {hasLeft
                  ? "A quitté la salle"
                  : !isOnline
                    ? "Déconnecté"
                    : isActiveTurn
                      ? "En train de jouer"
                      : "En attente"}
              </span>
            </div>
          </div>
        </div>

        {/* Score + Timer row */}
        <div className="flex items-stretch gap-2">
          {/* Score */}
          <div className="flex-1 bg-[var(--bg-secondary)] rounded-xl px-2 py-2 border border-[var(--border-primary)] flex flex-col items-center justify-center shadow-sm">
            <Trophy className={`w-3 h-3 mb-0.5 ${theme.accent} opacity-70`} />
            <span className="text-xl font-black text-[var(--text-primary)] leading-none">{score}</span>
            <span className="text-[8px] text-[var(--text-muted)] font-black uppercase mt-0.5 tracking-widest">
              Points
            </span>
          </div>

          {/* Timer */}
          {showTimer && (
            <div
              className={`
                flex-1 rounded-xl px-2 py-2 border flex flex-col items-center justify-center transition-colors shadow-sm
                ${isActiveTurn
                  ? "bg-[var(--bg-surface)] border-[var(--accent-fuchsia)]/30"
                  : "bg-[var(--bg-secondary)]/30 border-[var(--border-primary)]"}
              `}
            >
              <ChessTimer
                timeLeft={timeLeft}
                isActive={isActiveTurn}
                isLowTime={timeLeft <= 30}
                onTimeUp={onTimeUp}
                compact={true}
              />
              <span className="text-[8px] text-[var(--text-muted)] font-black uppercase mt-0.5 tracking-widest">
                Temps
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Active turn bottom bar */}
      {isActiveTurn && showTimer && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${theme.gradient} origin-left`}
        />
      )}
    </motion.div>
  );
};
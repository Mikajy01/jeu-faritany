import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Timer,
  Clock as ClockIcon,
  Play,
  ChevronRight,
  Trophy,
  Globe,
  Users,
} from "lucide-react";

export const GameConfigModal = ({ isOpen, onClose, onConfirm, mode }) => {
  const [gameMode, setGameMode] = useState("TIME"); // "TIME" or "SCORE"
  const [visibility, setVisibility] = useState("public"); // "public" or "private"
  const [moveTime, setMoveTime] = useState(30);
  const [totalTime, setTotalTime] = useState(600);
  const [targetScore, setTargetScore] = useState(20);
  const [gridSize, setGridSize] = useState(19);

  const moveTimeOptions = [
    { label: "15s", value: 15 },
    { label: "30s", value: 30 },
    { label: "1m", value: 60 },
    { label: "2m", value: 120 },
    { label: "5m", value: 300 },
  ];

  const totalTimeOptions = [
    { label: "5m", value: 300 },
    { label: "10m", value: 600 },
    { label: "20m", value: 1200 },
    { label: "30m", value: 1800 },
    { label: "1h", value: 3600 },
  ];

  const targetScoreOptions = [
    { label: "10 pts", value: 10 },
    { label: "20 pts", value: 20 },
    { label: "30 pts", value: 30 },
    { label: "50 pts", value: 50 },
    { label: "100 pts", value: 100 },
  ];

  const visibilityOptions = [
    { id: "public", label: "Partie Publique", icon: Globe },
    { id: "private", label: "Partie Privée", icon: Users },
  ];

  const clampGridSize = (value) => {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) return 19;
    return Math.max(19, Math.min(201, n));
  };

  const gridSizeOptions = [
    { label: "Minimum", value: 19, hint: "19×19" },
    { label: "Grand", value: 31, hint: "31×31" },
    { label: "Énorme", value: 51, hint: "51×51" },
    { label: "Gigantesque", value: 101, hint: "101×101" },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[var(--bg-primary)]/80 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg max-h-[90dvh] bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-0"
        >
          {/* Header */}
          <div className="p-6 border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--bg-secondary)]/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--accent-fuchsia)]/10 rounded-xl border border-[var(--accent-fuchsia)]/20">
                <Timer className="w-5 h-5 text-[var(--accent-fuchsia)]" />
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Configuration
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--bg-surface)] rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <div className="p-8 space-y-8">
              {/* Visibility Selection (Public/Private) - Only for 'create' mode */}
              {mode === "create" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[var(--text-muted)]" />
                      <span className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">
                        Type de Salon
                      </span>
                    </div>
                    <span className="text-xs font-mono text-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10 px-2 py-1 rounded">
                      {visibility === "public" ? "Matchmaking" : "Code Requis"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {visibilityOptions.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setVisibility(opt.id)}
                          className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all border ${
                            visibility === opt.id
                              ? "bg-[var(--accent-cyan)] border-[var(--accent-cyan)] text-white shadow-lg shadow-cyan-900/20"
                              : "bg-[var(--bg-surface)]/50 border-[var(--border-primary)] text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:border-[var(--text-secondary)]"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Game Mode Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[var(--text-muted)]" />
                    <span className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">
                      Mode de jeu
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[var(--accent-amber)] bg-[var(--accent-amber)]/10 px-2 py-1 rounded">
                    {gameMode === "TIME" ? "Au temps" : "Au score"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setGameMode("TIME")}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      gameMode === "TIME"
                        ? "bg-[var(--accent-amber)] border-[var(--accent-amber)] text-white shadow-lg shadow-amber-900/20"
                        : "bg-[var(--bg-surface)]/50 border-[var(--border-primary)] text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:border-[var(--text-secondary)]"
                    }`}
                  >
                    Limite de Temps
                  </button>
                  <button
                    onClick={() => setGameMode("SCORE")}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      gameMode === "SCORE"
                        ? "bg-[var(--accent-emerald)] border-[var(--accent-emerald)] text-white shadow-lg shadow-emerald-900/20"
                        : "bg-[var(--bg-surface)]/50 border-[var(--border-primary)] text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:border-[var(--text-secondary)]"
                    }`}
                  >
                    Objectif Score
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">
                      Taille de grille
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10 px-2 py-1 rounded">
                    {gridSize}×{gridSize}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {gridSizeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setGridSize(clampGridSize(opt.value))}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        gridSize === opt.value
                          ? "bg-[var(--accent-cyan)] border-[var(--accent-cyan)] text-white shadow-lg shadow-cyan-900/20"
                          : "bg-[var(--bg-surface)]/50 border-[var(--border-primary)] text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:border-[var(--text-secondary)]"
                      }`}
                    >
                      <div className="flex flex-col leading-tight">
                        <span>{opt.label}</span>
                        <span className="text-[10px] opacity-70">
                          {opt.hint}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="bg-[var(--bg-surface)]/40 border border-[var(--border-primary)] rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={19}
                      max={201}
                      step={2}
                      value={gridSize}
                      onChange={(e) =>
                        setGridSize(clampGridSize(e.target.value))
                      }
                      className="flex-1"
                    />
                    <input
                      type="number"
                      min={19}
                      max={201}
                      value={gridSize}
                      onChange={(e) =>
                        setGridSize(clampGridSize(e.target.value))
                      }
                      className="w-24 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl px-3 py-2 text-sm font-mono font-bold text-[var(--text-primary)]"
                    />
                  </div>
                </div>
              </div>

              {/* Move Time Limit */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-[var(--text-muted)]" />
                    <span className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">
                      Temps par coup
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[var(--accent-fuchsia)] bg-[var(--accent-fuchsia)]/10 px-2 py-1 rounded">
                    {moveTime >= 60 ? `${moveTime / 60}m` : `${moveTime}s`}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {moveTimeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setMoveTime(opt.value)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        moveTime === opt.value
                          ? "bg-[var(--accent-fuchsia)] border-[var(--accent-fuchsia)] text-white shadow-lg shadow-fuchsia-900/20"
                          : "bg-[var(--bg-surface)]/50 border-[var(--border-primary)] text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:border-[var(--text-secondary)]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional: Total Game Duration or Target Score */}
              {gameMode === "TIME" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4 text-[var(--text-muted)]" />
                      <span className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">
                        Temps total
                      </span>
                    </div>
                    <span className="text-xs font-mono text-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10 px-2 py-1 rounded">
                      {totalTime >= 3600
                        ? `${totalTime / 3600}h`
                        : `${totalTime / 60}m`}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {totalTimeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setTotalTime(opt.value)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                          totalTime === opt.value
                            ? "bg-[var(--accent-cyan)] border-[var(--accent-cyan)] text-white shadow-lg shadow-cyan-900/20"
                            : "bg-[var(--bg-surface)]/50 border-[var(--border-primary)] text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:border-[var(--text-secondary)]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-[var(--text-muted)]" />
                      <span className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">
                        Objectif Score
                      </span>
                    </div>
                    <span className="text-xs font-mono text-[var(--accent-emerald)] bg-[var(--accent-emerald)]/10 px-2 py-1 rounded">
                      {targetScore} points
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {targetScoreOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setTargetScore(opt.value)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                          targetScore === opt.value
                            ? "bg-[var(--accent-emerald)] border-[var(--accent-emerald)] text-white shadow-lg shadow-emerald-900/20"
                            : "bg-[var(--bg-surface)]/50 border-[var(--border-primary)] text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:border-[var(--text-secondary)]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-6 bg-[var(--bg-primary)]/50 border-t border-[var(--border-primary)]">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() =>
                onConfirm({
                  moveTimeLimit: moveTime,
                  gameDurationLimit: totalTime,
                  gameMode: gameMode,
                  targetScore: targetScore,
                  gridSize,
                  type: mode === "ai" ? "AI" : visibility,
                })
              }
              className="w-full bg-gradient-to-r from-[var(--accent-fuchsia)] to-purple-700 hover:from-[var(--accent-fuchsia)] hover:to-purple-600 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-xl shadow-purple-900/20 flex items-center justify-center gap-3 group"
            >
              <Play className="w-5 h-5 fill-current" />
              Lancer la partie
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

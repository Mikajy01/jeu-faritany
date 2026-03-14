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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-fuchsia-500/10 rounded-xl border border-fuchsia-500/20">
                <Timer className="w-5 h-5 text-fuchsia-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Configuration</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-8 space-y-8">
            {/* Visibility Selection (Public/Private) - Only for 'create' mode */}
            {mode === "create" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                      Type de Salon
                    </span>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded">
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
                            ? "bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-900/20"
                            : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600"
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
                  <Trophy className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    Mode de jeu
                  </span>
                </div>
                <span className="text-xs font-mono text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
                  {gameMode === "TIME" ? "Au temps" : "Au score"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setGameMode("TIME")}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    gameMode === "TIME"
                      ? "bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-900/20"
                      : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600"
                  }`}
                >
                  Limite de Temps
                </button>
                <button
                  onClick={() => setGameMode("SCORE")}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    gameMode === "SCORE"
                      ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/20"
                      : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600"
                  }`}
                >
                  Objectif Score
                </button>
              </div>
            </div>

            {/* Move Time Limit */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    Temps par coup
                  </span>
                </div>
                <span className="text-xs font-mono text-fuchsia-400 bg-fuchsia-400/10 px-2 py-1 rounded">
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
                        ? "bg-fuchsia-600 border-fuchsia-500 text-white shadow-lg shadow-fuchsia-900/20"
                        : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600"
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
                    <Timer className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                      Temps total
                    </span>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded">
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
                          ? "bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-900/20"
                          : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600"
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
                    <Trophy className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                      Objectif Score
                    </span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
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
                          ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/20"
                          : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-6 bg-slate-950/50 border-t border-slate-800">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() =>
                onConfirm({
                  moveTimeLimit: moveTime,
                  gameDurationLimit: totalTime,
                  gameMode: gameMode,
                  targetScore: targetScore,
                  type: mode === "ai" ? "AI" : visibility,
                })
              }
              className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-700 hover:from-fuchsia-500 hover:to-purple-600 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-xl shadow-purple-900/20 flex items-center justify-center gap-3 group"
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

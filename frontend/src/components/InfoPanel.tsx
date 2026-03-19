import React from "react";
import { ConnectionStatus } from "./ui/ConnectionStatus";
import { GameLog } from "./ui/GameLog";
import {
  ArrowLeft,
  Copy,
  RefreshCw,
  Hash,
  Terminal,
  Trophy,
  Flag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameContext } from "../context/GameContext";

export const InfoPanel = ({
  connectionStatus,
  gameState,
  hoveredCoord,
  gameLog,
  onResetGame,
  onBackToMenu,
  onResign,
  roomCode,
  setShowResignConfirm,
  setShowBackConfirm,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isGameOver = !!gameState.gameOver;
  const isMobile = window.innerWidth < 1024;

  return (
    // ✅ h-full + overflow-hidden pour rester dans le conteneur parent
    // Le parent (sidebar) doit avoir une hauteur définie (h-screen ou similaire)
    <div className="flex flex-col gap-3 w-full h-full overflow-hidden">

      {/* ── Main Stats Card (hauteur fixe / shrink-0) ── */}
      <div className="shrink-0 bg-[var(--bg-surface)] backdrop-blur-xl rounded-3xl p-4 border border-[var(--border-primary)] shadow-2xl relative overflow-hidden">
        {/* Game Over Overlay */}
        <AnimatePresence>
          {isGameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-50 bg-[var(--bg-primary)]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-orange-500/20">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-black text-[var(--text-primary)] mb-1 uppercase tracking-tighter">
                Partie Terminée
              </h2>
              <p className="text-[var(--text-secondary)] text-xs mb-4 max-w-[200px]">
                {gameState.gameOver.message}
              </p>
              <div className="flex flex-col gap-2 w-full">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onResetGame}
                  className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg text-sm"
                >
                  Rejouer
                </motion.button>
                <button
                  onClick={onBackToMenu}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  Retour au menu
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop header */}
        {!isMobile && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-[var(--text-primary)]">
                Tableau de Bord
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <ConnectionStatus status={connectionStatus} />
              </div>
            </div>
            {onBackToMenu && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (isGameOver) onBackToMenu();
                  else setShowBackConfirm(true);
                }}
                className="p-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-secondary)] rounded-xl transition-colors border border-[var(--border-primary)]"
                title="Retour au menu"
              >
                <ArrowLeft className="w-4 h-4 text-[var(--text-secondary)]" />
              </motion.button>
            )}
          </div>
        )}

        {/* Mobile header */}
        {isMobile && (
          <div className="flex items-center justify-between mb-3">
            <ConnectionStatus status={connectionStatus} />
            {onBackToMenu && (
              <button
                onClick={() => {
                  if (isGameOver) onBackToMenu();
                  else setShowBackConfirm(true);
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Menu
              </button>
            )}
          </div>
        )}

        <div className="space-y-3">
          {/* Room Code */}
          {roomCode && (
            <div className="bg-[var(--bg-secondary)] rounded-2xl p-3 border border-[var(--border-primary)] relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Hash className="w-10 h-10 text-[var(--text-primary)]" />
              </div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <div className="text-[9px] uppercase tracking-[0.2em] font-bold text-[var(--text-muted)] mb-0.5">
                    Room ID
                  </div>
                  <div className="text-base font-mono font-bold text-[var(--accent-fuchsia)] tracking-wider">
                    {roomCode}
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCopyRoomCode}
                  className="p-1.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors border border-[var(--border-primary)]"
                >
                  {copied ? (
                    <span className="text-xs text-[var(--accent-emerald)] font-bold">
                      COPIÉ
                    </span>
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  )}
                </motion.button>
              </div>
            </div>
          )}

          {/* Action button */}
          <div className="flex gap-3">
            {isGameOver ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onResetGame}
                className="flex-1 bg-gradient-to-r from-fuchsia-600 to-purple-700 hover:from-fuchsia-500 hover:to-purple-600 text-white font-bold py-2.5 px-4 rounded-2xl transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Nouvelle Partie
              </motion.button>
            ) : (
              onResign && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowResignConfirm(true)}
                  className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold py-2.5 px-4 rounded-2xl transition-all border border-rose-500/30 flex items-center justify-center gap-2 text-sm"
                >
                  <Flag className="w-4 h-4" />
                  Abandonner
                </motion.button>
              )
            )}
          </div>
        </div>
      </div>

      {/* ── Game Log (flex-1 + overflow scroll interne) ── */}
      <div className="flex-1 min-h-0 bg-[var(--bg-surface)] backdrop-blur-lg rounded-2xl border border-[var(--border-primary)] flex flex-col overflow-hidden">
        <div className="shrink-0 px-4 py-2.5 border-b border-[var(--border-primary)] flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            Journal d'actions
          </span>
        </div>
        {/* flex-1 + overflow-auto ici pour que GameLog scrolle en interne */}
        <div className="flex-1 min-h-0 overflow-auto">
          <GameLog logs={gameLog} />
        </div>
      </div>

      {/* ── Footer (shrink-0) ── */}
      <div className="shrink-0 py-1.5 text-center opacity-20 hover:opacity-100 transition-opacity">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
          © MR-BUG 2026
        </p>
      </div>
    </div>
  );
};
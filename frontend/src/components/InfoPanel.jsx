import React from "react";
import { ConnectionStatus } from "./ui/ConnectionStatus";
import { PlayerCard } from "./ui/PlayerCard";
import { ChessClock } from "./ui/ChessClock"; // ✨ Nouveau pendule
import { CursorPosition } from "./ui/CursorPosition";
import { GameLog } from "./ui/GameLog";
import {
  ArrowLeft,
  Copy,
  RefreshCw,
  Hash,
  Terminal,
  Trophy,
  Timer,
  Flag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const InfoPanel = ({
  connectionStatus,
  gameState,
  hoveredCoord,
  gameLog,
  onResetGame,
  onBackToMenu,
  onResign, // ✨ Nouvelle prop pour abandonner
  roomCode,
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

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Pendule de jeu (Chess Clock) ✨ */}
      <div className="w-full">
        <ChessClock
          remainingMoveTime={gameState.clock?.remainingMoveTime || 0}
          remainingGameTime={gameState.clock?.remainingGameTime || 0}
          gameStartTime={gameState.clock?.gameStartTime}
          currentPlayer={gameState.currentPlayer}
          gameActive={gameState.gameActive}
          lastMoveTimestamp={gameState.clock?.lastMoveTimestamp}
          gameMode={gameState.timeControl?.gameMode}
          targetScore={gameState.timeControl?.targetScore}
        />
      </div>

      {/* Main Stats Card */}
      <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/50 shadow-2xl relative overflow-hidden">
        {/* Game Over Overlay */}
        <AnimatePresence>
          {isGameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">
                Partie Terminée
              </h2>
              <p className="text-slate-400 text-sm mb-6 max-w-[200px]">
                {gameState.gameOver.message}
              </p>
              <div className="flex flex-col gap-3 w-full">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onResetGame}
                  className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
                >
                  Rejouer
                </motion.button>
                <button
                  onClick={onBackToMenu}
                  className="text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  Retour au menu
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Tableau de Bord
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <ConnectionStatus status={connectionStatus} />
            </div>
          </div>
          {onBackToMenu && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBackToMenu}
              className="p-2.5 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors border border-slate-600/50"
              title="Retour au menu"
            >
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </motion.button>
          )}
        </div>

        <div className="space-y-6">
          {roomCode && (
            <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-700/50 relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Hash className="w-12 h-12" />
              </div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 mb-1">
                    Room ID
                  </div>
                  <div className="text-xl font-mono font-bold text-fuchsia-400 tracking-wider">
                    {roomCode}
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCopyRoomCode}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                >
                  {copied ? (
                    <span className="text-xs text-emerald-400 font-bold">
                      COPIÉ
                    </span>
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400" />
                  )}
                </motion.button>
              </div>
            </div>
          )}

          {/* Player Cards (Scores seulement) */}
          <div className="grid grid-cols-2 gap-3">
            <PlayerCard
              player={1}
              score={gameState.player1Score || 0}
              isCurrentPlayer={gameState.currentPlayer === 1}
              isActive={gameState.gameActive}
              isYou={gameState.playerId === 1}
              showTimer={false}
              compact={true}
              isOnline={gameState.player1Online}
            />
            <PlayerCard
              player={2}
              score={gameState.player2Score || 0}
              isCurrentPlayer={gameState.currentPlayer === 2}
              isActive={gameState.gameActive}
              isYou={gameState.playerId === 2}
              showTimer={false}
              compact={true}
              isOnline={gameState.player2Online}
            />
          </div>

          <div className="flex gap-3">
            {isGameOver ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onResetGame}
                className="flex-1 bg-gradient-to-r from-fuchsia-600 to-purple-700 hover:from-fuchsia-500 hover:to-purple-600 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-3"
              >
                <RefreshCw className="w-5 h-5" />
                Nouvelle Partie
              </motion.button>
            ) : (
              onResign && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (window.confirm("Voulez-vous vraiment abandonner ?")) {
                      onResign();
                    }
                  }}
                  className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold py-4 px-6 rounded-2xl transition-all border border-rose-500/30 flex items-center justify-center gap-3"
                >
                  <Flag className="w-5 h-5" />
                  Abandonner
                </motion.button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Grid Coordinates Card */}
      <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl border border-slate-700/30 overflow-hidden">
        <CursorPosition coord={hoveredCoord} />
      </div>

      {/* Logs Card */}
      <div className="bg-slate-800/30 backdrop-blur-lg rounded-2xl border border-slate-700/30 flex-1 flex flex-col min-h-[300px]">
        <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Journal d'actions
          </span>
        </div>
        <div className="flex-1 overflow-hidden">
          <GameLog logs={gameLog} />
        </div>
      </div>
    </div>
  );
};

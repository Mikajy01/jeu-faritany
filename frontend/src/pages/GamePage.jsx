import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAnimation } from "../hooks/useAnimation";
import { useGameContext } from "../context/GameContext";
import { useTheme } from "../context/ThemeContext";
import {
  pixelToGrid,
  coordToKey,
  isValidGridPosition,
} from "../utils/coordinates";
import { InfoPanel } from "../components/InfoPanel";
import { GameBoard } from "../components/GameBoard";
import { GameOverModal } from "../components/ui/GameOverModal";
import { Menu, X, LayoutDashboard, Flag, Clock, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Helper to format time
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

// Grid component for the background
const Grid = () => (
  <div className="absolute inset-0 z-0 pointer-events-none">
    <div
      className="absolute inset-0 bg-repeat opacity-20"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.1) 1px, transparent 0)",
        backgroundSize: "2rem 2rem",
      }}
    />
  </div>
);

export default function GamePage() {
  const navigate = useNavigate();
  const {
    isConnected,
    connectionStatus,
    gameState,
    gameLog,
    makeOptimisticMove,
    addLogEntry,
    resignGame,
    leaveRoom,
    rematchRequestedBy,
    requestRematch,
    joinRoom,
  } = useGameContext();
  const { theme, toggleTheme } = useTheme();

  const isConnectedStatus = connectionStatus === "connected";
  const animationFrame = useAnimation();
  const [hoveredCoord, setHoveredCoord] = useState(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [roomCode, setRoomCode] = useState(null);

  // --- LOCAL TIMER FOR HEADER ---
  const [headerTime, setHeaderTime] = useState(0);

  useEffect(() => {
    if (!gameState?.clock?.remainingGameTime) return;
    setHeaderTime(gameState.clock.remainingGameTime);
  }, [gameState?.clock?.remainingGameTime]);

  useEffect(() => {
    if (!isConnected || !gameState?.gameActive || gameState?.gameOver) return;

    // Reset local timer on new game start
    setHeaderTime(gameState.clock?.remainingGameTime || 0);

    const interval = setInterval(() => {
      setHeaderTime((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected, gameState?.gameActive, gameState?.gameOver]);
  // -------------------------------

  // Récupérer le room code si disponible
  useEffect(() => {
    if (gameState?.gameId) {
      setRoomCode(gameState.gameId);
    }
  }, [gameState.gameId]);

  // 🔄 Gestion de la reconnexion automatique (uniquement si pas de partie chargée)
  useEffect(() => {
    if (isConnected && !gameState.gameId) {
      const roomCode = localStorage.getItem("faritany_current_game");
      if (roomCode) {
        console.log("🔄 Tentative de reconnexion automatique:", roomCode);
        joinRoom(roomCode).catch((err) => {
          console.warn("❌ Échec de reconnexion automatique:", err);
          localStorage.removeItem("faritany_current_game");
          navigate("/");
        });
      }
    }
  }, [isConnected, gameState.gameId, joinRoom, navigate]);

  // Fermer le drawer quand on clique en dehors (mobile uniquement)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (window.innerWidth >= 1024) return;
      if (
        showInfoPanel &&
        !e.target.closest(".info-panel-drawer") &&
        !e.target.closest(".menu-toggle-btn")
      ) {
        setShowInfoPanel(false);
      }
    };

    if (showInfoPanel) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showInfoPanel]);

  // Bloquer le scroll du body quand le drawer est ouvert (mobile uniquement)
  useEffect(() => {
    if (showInfoPanel && window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showInfoPanel]);

  const handleStageClick = useCallback(
    (e) => {
      if (
        !gameState.gameActive ||
        gameState.playerId !== gameState.currentPlayer
      )
        return;

      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();

      if (!pos) return;

      const gridCoord = pixelToGrid(pos.x, pos.y);

      if (!isValidGridPosition(gridCoord.x, gridCoord.y)) return;

      const coordKey = coordToKey(gridCoord.x, gridCoord.y);
      if (gameState.grid.has(coordKey)) return;

      // 🚀 OPTIMISTIC UPDATE: Placer la pierre immédiatement
      makeOptimisticMove(gridCoord.x, gridCoord.y);
    },
    [
      gameState.gameActive,
      gameState.playerId,
      gameState.currentPlayer,
      gameState.grid,
      makeOptimisticMove,
    ],
  );

  const handleStageMouseMove = useCallback(
    (e) => {
      if (
        !gameState.gameActive ||
        gameState.playerId !== gameState.currentPlayer
      ) {
        if (hoveredCoord) setHoveredCoord(null);
        return;
      }

      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();

      if (!pos) return;

      const gridCoord = pixelToGrid(pos.x, pos.y);

      if (!isValidGridPosition(gridCoord.x, gridCoord.y)) {
        if (hoveredCoord) setHoveredCoord(null);
        return;
      }

      if (
        !hoveredCoord ||
        hoveredCoord.x !== gridCoord.x ||
        hoveredCoord.y !== gridCoord.y
      ) {
        setHoveredCoord(gridCoord);
      }
    },
    [
      gameState.gameActive,
      gameState.playerId,
      gameState.currentPlayer,
      hoveredCoord,
    ],
  );

  const handleStageMouseLeave = useCallback(() => {
    setHoveredCoord(null);
  }, []);

  const resetGame = useCallback(() => {
    requestRematch();
  }, [requestRematch]);

  const handleBackToMenu = useCallback(() => {
    leaveRoom();
    setShowInfoPanel(false);
    navigate("/");
  }, [leaveRoom, navigate]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-[var(--accent-fuchsia)]/30 transition-colors duration-300">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 z-0 h-full w-full bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-black animate-gradient-x pointer-events-none" />
      <Grid />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header / Top Bar (Mobile Only) */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-[var(--bg-secondary)]/40 backdrop-blur-md border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInfoPanel(true)}
              className="menu-toggle-btn p-2.5 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
              aria-label="Ouvrir le menu"
            >
              <LayoutDashboard className="w-6 h-6 text-[var(--accent-fuchsia)]" />
            </button>
            <h1 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
              Jeu Faritany
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-[var(--accent-emerald)]" : "bg-[var(--accent-rose)]"} animate-pulse`}
            />

            {/* Mobile Timer/Score Indicator */}
            {gameState.gameActive && !gameState.gameOver && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-primary)] shadow-sm">
                {gameState.timeControl?.gameMode === "TIME" ? (
                  <>
                    <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span className="text-sm font-mono font-black tabular-nums text-[var(--text-primary)]">
                      {formatTime(headerTime)}
                    </span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-[var(--accent-emerald)]" />
                    <span className="text-sm font-mono font-black tabular-nums text-[var(--accent-emerald)]">
                      {gameState.timeControl?.targetScore}
                      <span className="text-[10px] ml-0.5 opacity-50 font-bold uppercase">
                        pts
                      </span>
                    </span>
                  </>
                )}
              </div>
            )}

            {gameState.gameActive && !gameState.gameOver && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => resignGame()}
                className="p-2 bg-[var(--accent-rose)]/10 hover:bg-[var(--accent-rose)]/20 text-[var(--accent-rose)] rounded-xl border border-[var(--accent-rose)]/30 transition-colors"
                title="Abandonner"
              >
                <Flag className="w-5 h-5" />
              </motion.button>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-8 flex items-center justify-center">
          <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 items-start justify-center">
            {/* Left Side: Game Board */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex-1 w-full flex flex-col items-center justify-center lg:min-h-[80vh]"
            >
              <div className="relative group">
                {/* Decorative glow behind the board */}
                <div className="absolute -inset-4 bg-gradient-to-r from-[var(--accent-fuchsia)]/10 via-purple-500/10 to-[var(--accent-cyan)]/10 blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-700 -z-10" />

                <GameBoard
                  gameState={gameState}
                  hoveredCoord={hoveredCoord}
                  animationFrame={animationFrame}
                  onStageClick={handleStageClick}
                  onStageMouseMove={handleStageMouseMove}
                  onStageMouseLeave={handleStageMouseLeave}
                />
              </div>
            </motion.div>

            {/* Right Side: Info Panel (Desktop) / Drawer (Mobile) */}
            <AnimatePresence>
              {(showInfoPanel || window.innerWidth >= 1024) && (
                <motion.aside
                  initial={
                    window.innerWidth < 1024
                      ? { x: "-100%" }
                      : { opacity: 0, x: 20 }
                  }
                  animate={
                    window.innerWidth < 1024 ? { x: 0 } : { opacity: 1, x: 0 }
                  }
                  exit={
                    window.innerWidth < 1024
                      ? { x: "-100%" }
                      : { opacity: 0, x: 20 }
                  }
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className={`
                    info-panel-drawer
                    fixed lg:relative inset-y-0 left-0 z-50
                    w-[85vw] sm:w-96 lg:w-[400px]
                    bg-[var(--bg-secondary)]/90 lg:bg-transparent backdrop-blur-2xl lg:backdrop-blur-none
                    border-r border-[var(--border-primary)] lg:border-0
                    p-6 lg:p-0 flex flex-col
                  `}
                >
                  {/* Close button (Mobile only) */}
                  <div className="lg:hidden flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                      Tableau de Bord
                    </h2>
                    <button
                      onClick={() => setShowInfoPanel(false)}
                      className="p-2 bg-[var(--bg-surface)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <X className="w-5 h-5 text-[var(--text-muted)]" />
                    </button>
                  </div>

                  <div className="flex-1 lg:max-h-[85vh] overflow-y-auto lg:overflow-visible custom-scrollbar">
                    <InfoPanel
                      connectionStatus={connectionStatus}
                      gameState={gameState}
                      hoveredCoord={hoveredCoord}
                      gameLog={gameLog}
                      onResetGame={resetGame}
                      onBackToMenu={handleBackToMenu}
                      onResign={resignGame} // ✨ Passer la fonction
                      roomCode={roomCode}
                    />
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

            {/* Overlay (Mobile Only) */}
            <AnimatePresence>
              {showInfoPanel && window.innerWidth < 1024 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowInfoPanel(false)}
                  className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
                />
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      <GameOverModal
        isOpen={!!gameState.gameOver}
        winner={gameState.gameOver?.winner}
        myPlayerId={gameState.playerId}
        scores={gameState.scores}
        reason={gameState.gameOver?.reason}
        onReset={resetGame}
        onBackToMenu={handleBackToMenu}
        rematchRequestedBy={rematchRequestedBy}
      />
    </div>
  );
}

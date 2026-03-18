import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAnimation } from "../hooks/useAnimation";
import { useGameContext } from "../context/GameContext";
import { useTheme } from "../context/ThemeContext";
import { DEFAULT_GRID_SIZE } from "../constants/game";
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
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(
    () => window.innerWidth >= 1024,
  );
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  const [roomCode, setRoomCode] = useState(null);
  const gridSize = gameState?.gridSize || DEFAULT_GRID_SIZE;

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
      if (isDesktop) return;
      if (
        isInfoPanelOpen &&
        !e.target.closest(".info-panel-drawer") &&
        !e.target.closest(".menu-toggle-btn")
      ) {
        setIsInfoPanelOpen(false);
      }
    };

    if (isInfoPanelOpen && !isDesktop) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isInfoPanelOpen, isDesktop]);

  // Bloquer le scroll du body quand le drawer est ouvert (mobile uniquement)
  useEffect(() => {
    if (isInfoPanelOpen && !isDesktop) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isInfoPanelOpen, isDesktop]);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleStageClick = useCallback(
    (e) => {
      if (
        !gameState.gameActive ||
        gameState.playerId !== gameState.currentPlayer
      )
        return;

      const stage = e.target.getStage();
      // Konva's getPointerPosition() returns coordinates already adjusted for scale/offset of the Stage
      const pos = stage.getPointerPosition();

      if (!pos) return;

      const gridCoord = pixelToGrid(pos.x, pos.y);

      if (!isValidGridPosition(gridCoord.x, gridCoord.y, gridSize)) return;

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
      gridSize,
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

      if (!isValidGridPosition(gridCoord.x, gridCoord.y, gridSize)) {
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
      gridSize,
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
    setIsInfoPanelOpen(false);
    navigate("/");
  }, [leaveRoom, navigate]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-[var(--accent-fuchsia)]/30 transition-colors duration-300">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 z-0 h-full w-full bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-black animate-gradient-x pointer-events-none" />
      <Grid />

      <div className="relative z-10 h-full flex flex-col">
        {/* Header / Top Bar (Mobile Only) */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-[var(--bg-secondary)]/40 backdrop-blur-md border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsInfoPanelOpen(true)}
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
        <main className="flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-center overflow-hidden relative">
          {/* Left Side: Info Panel (Drawer) - Now absolute on the left */}
          <AnimatePresence mode="popLayout">
            {isInfoPanelOpen && (
              <motion.aside
                initial={{ x: "-100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "-100%", opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 200 }}
                className={`
                  info-panel-drawer
                  fixed inset-y-0 left-0 z-50
                  w-[85vw] sm:w-96 lg:w-[400px]
                  bg-[var(--bg-secondary)]/95 lg:bg-[var(--bg-card)]/90 backdrop-blur-2xl
                  border-r border-[var(--border-primary)]
                  p-6 flex flex-col shadow-2xl
                `}
              >
                {/* Header/Close toggle */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">
                    {isDesktop ? "Tableau de Bord" : "Menu"}
                  </h2>
                  <button
                    onClick={() => setIsInfoPanelOpen(false)}
                    className="p-2 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                    title="Fermer le panneau"
                  >
                    <X className="w-5 h-5 text-[var(--text-muted)]" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <InfoPanel
                    connectionStatus={connectionStatus}
                    gameState={gameState}
                    hoveredCoord={hoveredCoord}
                    gameLog={gameLog}
                    onResetGame={resetGame}
                    onBackToMenu={handleBackToMenu}
                    onResign={resignGame}
                    roomCode={roomCode}
                  />
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Right Side: Game Board (always takes available space) */}
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex-1 w-full h-full flex flex-col items-center justify-center lg:min-h-[85vh] relative"
          >
            <GameBoard
              gameState={gameState}
              hoveredCoord={hoveredCoord}
              animationFrame={animationFrame}
              onStageClick={handleStageClick}
              onStageMouseMove={handleStageMouseMove}
              onStageMouseLeave={handleStageMouseLeave}
              isInfoPanelOpen={isInfoPanelOpen}
            />
          </motion.div>

          {/* Overlay (Mobile Only) */}
          <AnimatePresence>
            {isInfoPanelOpen && !isDesktop && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsInfoPanelOpen(false)}
                className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
              />
            )}
          </AnimatePresence>
        </main>
      </div>

      {isDesktop && !isInfoPanelOpen && (
        <button
          type="button"
          onClick={() => setIsInfoPanelOpen(true)}
          className="fixed left-4 top-24 z-40 p-2.5 bg-[var(--bg-surface)]/80 backdrop-blur-xl rounded-2xl border border-[var(--border-primary)] hover:bg-[var(--bg-secondary)] transition-colors shadow-lg"
          aria-label="Ouvrir le tableau de bord"
          title="Ouvrir le tableau de bord"
        >
          <LayoutDashboard className="w-5 h-5 text-[var(--accent-fuchsia)]" />
        </button>
      )}

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

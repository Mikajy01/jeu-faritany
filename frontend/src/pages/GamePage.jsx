import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAnimation } from "../hooks/useAnimation";
import { useGameContext } from "../context/GameContext";
import {
  pixelToGrid,
  coordToKey,
  isValidGridPosition,
} from "../utils/coordinates";
import { InfoPanel } from "../components/InfoPanel";
import { GameBoard } from "../components/GameBoard";
import { GameOverModal } from "../components/ui/GameOverModal";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    socketRef,
    connectionStatus,
    gameState,
    gameLog,
    makeOptimisticMove,
  } = useGameContext();
  const animationFrame = useAnimation();
  const [hoveredCoord, setHoveredCoord] = useState(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [roomCode, setRoomCode] = useState(null);

  // Récupérer le room code si disponible
  useEffect(() => {
    if (!socketRef.current) return;
    const socket = socketRef.current;

    const handleGameCreated = ({ code }) => {
      setRoomCode(code);
    };

    socket.on("gameCreated", handleGameCreated);
    return () => socket.off("gameCreated", handleGameCreated);
  }, [socketRef]);

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
    socketRef.current?.emit("resetGame");
  }, [socketRef]);

  const handleBackToMenu = useCallback(() => {
    localStorage.removeItem("faritany_current_game");
    socketRef.current?.disconnect();
    socketRef.current?.connect();
    setShowInfoPanel(false);
    navigate("/");
  }, [socketRef, navigate]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-white font-sans selection:bg-fuchsia-500/30">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 z-0 h-full w-full bg-gradient-to-br from-slate-950 via-slate-900 to-black animate-gradient-x pointer-events-none" />
      <Grid />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header / Top Bar (Mobile Only) */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-slate-900/40 backdrop-blur-md border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInfoPanel(true)}
              className="menu-toggle-btn p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:bg-slate-700 transition-colors"
              aria-label="Ouvrir le menu"
            >
              <LayoutDashboard className="w-6 h-6 text-fuchsia-400" />
            </button>
            <h1 className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Jeu Faritany
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${connectionStatus === "connected" ? "bg-emerald-400" : "bg-rose-400"} animate-pulse`}
            />
            <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">
              Live
            </span>
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
                <div className="absolute -inset-4 bg-gradient-to-r from-fuchsia-500/10 via-purple-500/10 to-blue-500/10 blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-700 -z-10" />

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
                    bg-slate-900/90 lg:bg-transparent backdrop-blur-2xl lg:backdrop-blur-none
                    border-r border-slate-800/50 lg:border-0
                    p-6 lg:p-0 flex flex-col
                  `}
                >
                  {/* Close button (Mobile only) */}
                  <div className="lg:hidden flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-white">
                      Tableau de Bord
                    </h2>
                    <button
                      onClick={() => setShowInfoPanel(false)}
                      className="p-2 bg-slate-800/50 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-400" />
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
      />

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}

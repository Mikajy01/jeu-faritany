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
import { Menu, X } from "lucide-react";

export default function GamePage() {
  const navigate = useNavigate();
  const { socketRef, connectionStatus, gameState, gameLog } = useGameContext();
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

      socketRef.current.emit("makeMove", { x: gridCoord.x, y: gridCoord.y });
    },
    [
      gameState.gameActive,
      gameState.playerId,
      gameState.currentPlayer,
      gameState.grid,
      socketRef,
    ]
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
    ]
  );

  const handleStageMouseLeave = useCallback(() => {
    setHoveredCoord(null);
  }, []);

  const resetGame = useCallback(() => {
    socketRef.current?.emit("resetGame");
  }, [socketRef]);

  const handleBackToMenu = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current?.connect();
    setShowInfoPanel(false);
    navigate("/");
  }, [socketRef, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="p-4">
        {/* Bouton Menu Mobile uniquement */}
        <button
          onClick={() => setShowInfoPanel(true)}
          className="menu-toggle-btn lg:hidden fixed top-4 left-4 z-40 p-3 bg-white rounded-xl shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-6 h-6 text-slate-700" />
        </button>

        {/* Overlay pour mobile uniquement */}
        {showInfoPanel && (
          <div className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity" />
        )}

        {/* Layout Desktop (grid) et Mobile (drawer) */}
        <div className="max-w-7xl mx-auto">
          <div className="lg:grid lg:grid-cols-3 lg:gap-6">
            {/* InfoPanel - Drawer mobile / Column desktop */}
            <div
              className={`
              info-panel-drawer
              fixed lg:static inset-y-0 left-0 z-50
              w-full sm:w-96 lg:w-auto
              bg-white lg:bg-transparent
              transform lg:transform-none transition-transform duration-300 ease-in-out
              ${
                showInfoPanel
                  ? "translate-x-0"
                  : "-translate-x-full lg:translate-x-0"
              }
              overflow-y-auto lg:overflow-visible
              lg:col-span-1
            `}
            >
              {/* Bouton fermer (mobile uniquement) */}
              <button
                onClick={() => setShowInfoPanel(false)}
                className="lg:hidden absolute top-4 right-4 z-10 p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                aria-label="Fermer le menu"
              >
                <X className="w-5 h-5 text-slate-700" />
              </button>

              <div className="p-4 lg:p-0">
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
            </div>

            {/* GameBoard */}
            <div className="lg:col-span-2 mt-4 lg:mt-4">
              <GameBoard
                gameState={gameState}
                hoveredCoord={hoveredCoord}
                animationFrame={animationFrame}
                onStageClick={handleStageClick}
                onStageMouseMove={handleStageMouseMove}
                onStageMouseLeave={handleStageMouseLeave}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

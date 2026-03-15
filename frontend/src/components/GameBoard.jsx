import React, { useRef, useState, useEffect, useCallback } from "react";
import { Stage, Layer, Rect } from "react-konva";
import { STAGE_WIDTH, STAGE_HEIGHT } from "../constants/game";
import { GridLines } from "./canvas/GridLines";
import { CapturedAreas } from "./canvas/CapturedAreas";
import { GameStones } from "./canvas/GameStones";
import { HoverEffect } from "./canvas/HoverEffect";
import { Legend } from "./ui/Legend";
import { PlayerCard } from "./ui/PlayerCard";
import { useGameContext } from "../context/GameContext";
import { useTheme } from "../context/ThemeContext";

export const GameBoard = ({
  gameState,
  hoveredCoord,
  animationFrame,
  onStageClick,
  onStageMouseMove,
  onStageMouseLeave,
}) => {
  const { gameType, moveTimeLimit } = useGameContext();
  const { theme: currentTheme } = useTheme();
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [dimensions, setDimensions] = useState({
    width: STAGE_WIDTH,
    height: STAGE_HEIGHT,
  });

  const isDarkMode = currentTheme === "dark";
  const boardBg = isDarkMode ? "#0f172a" : "#f8fafc";
  const gridColor = isDarkMode ? "#334155" : "#cbd5e1";

  // Pour le zoom mobile
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const lastTouchDistance = useRef(null);
  const lastTouchTime = useRef(0);
  const lastTouchPos = useRef(null);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;

      // Desktop : pas de scaling, taille originale
      if (window.innerWidth >= 1024) {
        setScale(1);
        setDimensions({ width: STAGE_WIDTH, height: STAGE_HEIGHT });
        return;
      }

      // Mobile/Tablet : scaling pour s'adapter
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      // On retire plus d'espace pour tenir compte des PlayerCards et de la Légende
      const containerHeight = window.innerHeight - 200;

      const scaleX = (containerWidth - 20) / STAGE_WIDTH; // Encore moins de padding horizontal
      const scaleY = containerHeight / STAGE_HEIGHT;
      const newScale = Math.min(scaleX, scaleY, 0.95); // Max 95% pour garder une petite marge

      setScale(newScale);
      setDimensions({
        width: STAGE_WIDTH * newScale,
        height: STAGE_HEIGHT * newScale,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    const timeout = setTimeout(updateSize, 100);

    return () => {
      window.removeEventListener("resize", updateSize);
      clearTimeout(timeout);
    };
  }, []);

  // Calculer la distance entre deux touches
  const getDistance = (touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Gérer le pinch-to-zoom
  const handleTouchMove = useCallback(
    (e) => {
      e.evt.preventDefault();

      // Desktop ou un seul doigt : pas de zoom
      if (window.innerWidth >= 1024 || e.evt.touches.length !== 2) {
        lastTouchDistance.current = null;
        return;
      }

      const touch1 = e.evt.touches[0];
      const touch2 = e.evt.touches[1];
      const dist = getDistance(touch1, touch2);

      if (lastTouchDistance.current !== null) {
        const stage = stageRef.current;
        const oldScale = stageScale;

        // Calculer le nouveau scale
        const deltaScale = dist / lastTouchDistance.current;
        const newScale = Math.max(1, Math.min(3, oldScale * deltaScale)); // Entre 1x et 3x

        if (newScale !== oldScale) {
          // Centre du pinch
          const centerX = (touch1.clientX + touch2.clientX) / 2;
          const centerY = (touch1.clientY + touch2.clientY) / 2;

          // Position relative au stage
          const stageBox = stage.container().getBoundingClientRect();
          const pointerPosition = {
            x:
              (centerX - stageBox.left) / oldScale - stagePosition.x / oldScale,
            y: (centerY - stageBox.top) / oldScale - stagePosition.y / oldScale,
          };

          // Nouvelle position pour garder le centre fixe
          const newPos = {
            x:
              -(pointerPosition.x - (centerX - stageBox.left) / newScale) *
              newScale,
            y:
              -(pointerPosition.y - (centerY - stageBox.top) / newScale) *
              newScale,
          };

          // Limiter le pan
          const maxX = 0;
          const maxY = 0;
          const minX = -(STAGE_WIDTH * scale * newScale - dimensions.width);
          const minY = -(STAGE_HEIGHT * scale * newScale - dimensions.height);

          newPos.x = Math.max(minX, Math.min(maxX, newPos.x));
          newPos.y = Math.max(minY, Math.min(maxY, newPos.y));

          setStageScale(newScale);
          setStagePosition(newPos);
        }
      }

      lastTouchDistance.current = dist;
    },
    [stageScale, stagePosition, scale, dimensions],
  );

  // Gérer le double-tap pour placer un point
  const handleDoubleTap = useCallback(
    (e) => {
      const isMobile = window.innerWidth < 1024;

      // Desktop : comportement normal (pas de double-tap requis)
      if (!isMobile) {
        onStageClick(e);
        return;
      }

      // Mobile : vérifier le double-tap
      const now = Date.now();
      const timeSinceLastTouch = now - lastTouchTime.current;

      if (timeSinceLastTouch < 300 && timeSinceLastTouch > 0) {
        // Double-tap détecté
        const touch = e.evt.changedTouches[0];
        const lastPos = lastTouchPos.current;

        // Vérifier que les deux taps sont au même endroit (tolérance de 30px)
        if (
          lastPos &&
          Math.abs(touch.clientX - lastPos.x) < 30 &&
          Math.abs(touch.clientY - lastPos.y) < 30
        ) {
          // Créer un événement modifié avec les bonnes coordonnées
          const stage = stageRef.current;
          const stageBox = stage.container().getBoundingClientRect();

          // Calculer les coordonnées réelles en tenant compte du zoom et du pan
          const x =
            (touch.clientX - stageBox.left - stagePosition.x) /
            (scale * stageScale);
          const y =
            (touch.clientY - stageBox.top - stagePosition.y) /
            (scale * stageScale);

          // Créer un objet event modifié pour Konva
          const modifiedEvent = {
            ...e,
            target: stage,
            evt: {
              ...e.evt,
              clientX: touch.clientX,
              clientY: touch.clientY,
            },
          };

          // Simuler getPointerPosition avec les vraies coordonnées
          const originalGetPointerPosition = stage.getPointerPosition;
          stage.getPointerPosition = () => ({ x, y });

          onStageClick(modifiedEvent);

          // Restaurer la fonction originale
          stage.getPointerPosition = originalGetPointerPosition;
        }

        lastTouchTime.current = 0;
        lastTouchPos.current = null;
      } else {
        // Premier tap
        lastTouchTime.current = now;
        lastTouchPos.current = {
          x: e.evt.changedTouches[0].clientX,
          y: e.evt.changedTouches[0].clientY,
        };
      }
    },
    [onStageClick, scale, stageScale, stagePosition],
  );

  // Réinitialiser le zoom
  const resetZoom = useCallback(() => {
    setStageScale(1);
    setStagePosition({ x: 0, y: 0 });
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center select-none w-full"
    >
      {/* Mobile Player Cards (Minimalist at top) */}
      <div className="lg:hidden w-full mb-3 px-1">
        <div className="flex justify-center gap-1.5 w-full max-w-[400px] mx-auto">
          <div className="flex-1 min-w-0">
            <PlayerCard
              player={1}
              score={gameState.scores?.player1 || 0}
              isCurrentPlayer={gameState.currentPlayer === 1}
              isActive={gameState.gameActive}
              isYou={gameState.playerId === 1}
              timeLeft={moveTimeLimit}
              minimalist={true}
              showTimer={gameType !== "AI"}
              isOnline={gameState.player1Online}
            />
          </div>
          <div className="flex-1 min-w-0">
            <PlayerCard
              player={2}
              score={gameState.scores?.player2 || 0}
              isCurrentPlayer={gameState.currentPlayer === 2}
              isActive={gameState.gameActive}
              isYou={gameState.playerId === 2}
              timeLeft={moveTimeLimit}
              minimalist={true}
              showTimer={gameType !== "AI"}
              isOnline={gameState.player2Online}
            />
          </div>
        </div>
      </div>

      {/* Player Cards (Desktop only, positioned around the board) */}
      <div className="hidden lg:flex w-full justify-between items-center mb-8 gap-4 px-4">
        <PlayerCard
          player={1}
          score={gameState.scores?.player1 || 0}
          isCurrentPlayer={gameState.currentPlayer === 1}
          isActive={gameState.gameActive}
          isYou={gameState.playerId === 1}
          timeLeft={moveTimeLimit}
          compact={true}
          showTimer={gameType !== "AI"}
          isOnline={gameState.player1Online}
        />
        <div className="flex flex-col items-center">
          <div className="text-[10px] uppercase tracking-[0.3em] font-black text-[var(--text-muted)] mb-1">
            vs
          </div>
          <div className="h-8 w-px bg-gradient-to-b from-transparent via-[var(--border-primary)] to-transparent" />
        </div>
        <PlayerCard
          player={2}
          score={gameState.scores?.player2 || 0}
          isCurrentPlayer={gameState.currentPlayer === 2}
          isActive={gameState.gameActive}
          isYou={gameState.playerId === 2}
          timeLeft={moveTimeLimit}
          compact={true}
          showTimer={gameType !== "AI"}
          isOnline={gameState.player2Online}
        />
      </div>

      <div className="relative rounded-3xl p-2 bg-[var(--bg-card)] backdrop-blur-sm border border-[var(--border-primary)] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden group">
        {/* Animated board border */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-fuchsia)]/10 via-transparent to-[var(--accent-cyan)]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

        <Stage
          width={dimensions.width}
          height={dimensions.height}
          scaleX={scale * stageScale}
          scaleY={scale * stageScale}
          x={stagePosition.x}
          y={stagePosition.y}
          onClick={window.innerWidth >= 1024 ? onStageClick : undefined}
          onTouchEnd={handleDoubleTap}
          onTouchMove={handleTouchMove}
          onMouseMove={onStageMouseMove}
          onMouseLeave={onStageMouseLeave}
          ref={stageRef}
          style={{
            cursor: window.innerWidth >= 1024 ? "crosshair" : "grab",
            touchAction: "none",
            maxWidth: "100%",
            display: "block",
          }}
          draggable={window.innerWidth < 1024 && stageScale > 1}
          onDragEnd={(e) => {
            if (window.innerWidth < 1024) {
              setStagePosition({ x: e.target.x(), y: e.target.y() });
            }
          }}
        >
          <Layer>
            {/* Board Base adaptive to theme */}
            <Rect
              width={STAGE_WIDTH}
              height={STAGE_HEIGHT}
              fill={boardBg}
              shadowBlur={20}
              shadowColor={isDarkMode ? "black" : "#cbd5e1"}
              shadowOpacity={0.5}
            />
            <GridLines color={gridColor} />
          </Layer>

          <Layer>
            <CapturedAreas
              capturedAreas={gameState.capturedAreas}
              grid={gameState.grid}
              isDarkMode={isDarkMode}
            />
            <GameStones
              grid={gameState.grid}
              lastMove={gameState.move}
              animationFrame={animationFrame}
              isDarkMode={isDarkMode}
            />
          </Layer>

          <Layer>
            <HoverEffect
              hoveredCoord={hoveredCoord}
              currentPlayer={gameState.currentPlayer}
              gameActive={gameState.gameActive}
              playerId={gameState.playerId}
              animationFrame={animationFrame}
              grid={gameState.grid}
              isDarkMode={isDarkMode}
            />
          </Layer>
        </Stage>
      </div>

      {/* Legend & Game Info */}
      <div className="mt-8 w-full flex flex-col sm:flex-row items-center justify-between gap-6 px-4">
        <Legend
          stageScale={stageScale}
          onZoomChange={setStageScale}
          onResetZoom={resetZoom}
        />
        {gameType !== "AI" && (
          <div className="flex items-center gap-4 bg-[var(--bg-surface)] backdrop-blur-md px-6 py-3 rounded-2xl border border-[var(--border-primary)]">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)]">
                Temps / Tour
              </span>
              <span className="text-lg font-mono font-bold text-[var(--accent-fuchsia)]">
                {moveTimeLimit}s
              </span>
            </div>
            <div className="w-px h-8 bg-[var(--border-primary)]" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)]">
                Mode
              </span>
              <span className="text-sm font-bold text-[var(--text-secondary)] uppercase">
                {gameType === "AI" ? "IA" : "Joueur"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

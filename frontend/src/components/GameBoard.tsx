import React, { useRef, useState, useEffect, useCallback } from "react";
import { Stage, Layer, Rect } from "react-konva";
import { DEFAULT_GRID_SIZE, getStageSize } from "../constants/game";
import { GridLines } from "./canvas/GridLines";
import { CapturedAreas } from "./canvas/CapturedAreas";
import { GameStones } from "./canvas/GameStones";
import { HoverEffect } from "./canvas/HoverEffect";
import { Legend } from "./ui/Legend";
import { PlayerCard } from "./ui/PlayerCard";
import { ChessClock } from "./ui/ChessClock";
import { useGameContext } from "../context/GameContext";
import { useTheme } from "../context/ThemeContext";

export const GameBoard = ({
  gameState,
  hoveredCoord,
  animationFrame,
  onStageClick,
  onStageMouseMove,
  onStageMouseLeave,
  isInfoPanelOpen,
}) => {
  const { gameType, moveTimeLimit } = useGameContext();
  const { theme: currentTheme } = useTheme();
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const gridSize = gameState?.gridSize || DEFAULT_GRID_SIZE;
  const { width: stageWidth, height: stageHeight } = getStageSize(gridSize);
  const [scales, setScales] = useState({ x: 1, y: 1 });
  const [dimensions, setDimensions] = useState({
    width: stageWidth,
    height: stageHeight,
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

      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const isDesktop = window.innerWidth >= 1024;

      // On desktop, we have Sidebar on the left (300px)
      // InfoPanel is now absolute/fixed, so it doesn't take space in the layout
      const horizontalMargin = isDesktop ? 340 : 40;

      const containerHeight = isDesktop
        ? window.innerHeight - 40 // Minimal margin for independent scroll
        : window.innerHeight - 280;

      const availableWidth = containerWidth - horizontalMargin;
      const availableHeight = containerHeight;

      // FORCE FULL WIDTH: The scale X is determined solely by available width
      const scaleX = availableWidth / stageWidth;

      // Scale Y can be different to allow the grid to grow vertically
      // We still want it to fit the height if possible, or at least not be squashed
      const scaleY = availableHeight / stageHeight;

      // Update scales independently to allow non-square cells if requested
      // But usually, we want to maintain aspect ratio unless explicitly told to fill height too
      // User said: "hauteur peut être autant de fois plus grand que la largeur"
      // and "pour la largeur je veux que ça occupe toute la place"

      const finalScaleX = scaleX;
      const finalScaleY = isDesktop ? scaleX : scaleY; // On desktop, keep cells square but fill width. On mobile, fit both.

      setScales({ x: finalScaleX, y: finalScaleY });
      setDimensions({
        width: stageWidth * finalScaleX,
        height: stageHeight * finalScaleY,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    const timeout = setTimeout(updateSize, 100);

    return () => {
      window.removeEventListener("resize", updateSize);
      clearTimeout(timeout);
    };
  }, [stageWidth, stageHeight, isInfoPanelOpen]); // Added isInfoPanelOpen here

  const handleStageClickWithScales = useCallback(
    (e) => {
      const stage = e.target.getStage();
      const pos = stage.getRelativePointerPosition();
      if (!pos) return;

      // Simulate getPointerPosition for onStageClick
      const originalGetPointerPosition = stage.getPointerPosition;
      stage.getPointerPosition = () => pos;
      onStageClick(e);
      stage.getPointerPosition = originalGetPointerPosition;
    },
    [onStageClick],
  );

  const handleStageMouseMoveWithScales = useCallback(
    (e) => {
      const stage = e.target.getStage();
      const pos = stage.getRelativePointerPosition();
      if (!pos) return;

      // Simulate getPointerPosition for onStageMouseMove
      const originalGetPointerPosition = stage.getPointerPosition;
      stage.getPointerPosition = () => pos;
      onStageMouseMove(e);
      stage.getPointerPosition = originalGetPointerPosition;
    },
    [onStageMouseMove],
  );

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
          const minX = -(stageWidth * scales.x * newScale - dimensions.width);
          const minY = -(stageHeight * scales.y * newScale - dimensions.height);

          newPos.x = Math.max(minX, Math.min(maxX, newPos.x));
          newPos.y = Math.max(minY, Math.min(maxY, newPos.y));

          setStageScale(newScale);
          setStagePosition(newPos);
        }
      }

      lastTouchDistance.current = dist;
    },
    [stageScale, stagePosition, scales, dimensions, stageWidth, stageHeight],
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
            (scales.x * stageScale);
          const y =
            (touch.clientY - stageBox.top - stagePosition.y) /
            (scales.y * stageScale);

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
    [onStageClick, scales, stageScale, stagePosition],
  );

  // Réinitialiser le zoom
  const resetZoom = useCallback(() => {
    setStageScale(1);
    setStagePosition({ x: 0, y: 0 });
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col lg:flex-row items-stretch select-none w-full h-full lg:h-screen overflow-hidden"
    >
      {/* Mobile Player Cards (At top, horizontal) */}
      <div className="lg:hidden w-full mb-4 px-2">
        <div className="flex justify-center gap-1.5 w-full max-w-[360px] mx-auto">
          <div className="flex-1 min-w-0">
            <PlayerCard
              player={1}
              score={gameState.scores?.player1 || 0}
              isCurrentPlayer={gameState.currentPlayer === 1}
              isActive={gameState.gameActive}
              isYou={gameState.playerId === 1}
              timeLeft={
                gameState.currentPlayer === 1
                  ? gameState.clock?.remainingMoveTime || 0
                  : gameState.timeControl?.moveTimeLimit || 0
              }
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
              timeLeft={
                gameState.currentPlayer === 2
                  ? gameState.clock?.remainingMoveTime || 0
                  : gameState.timeControl?.moveTimeLimit || 0
              }
              minimalist={true}
              showTimer={gameType !== "AI"}
              isOnline={gameState.player2Online}
            />
          </div>
        </div>
      </div>

      {/* Desktop Sidebar (Left, INDEPENDENT SCROLL) */}
      <div className="hidden lg:flex flex-col gap-6 w-[300px] flex-shrink-0 h-screen overflow-y-auto custom-scrollbar p-6 bg-[var(--bg-secondary)]/30 border-r border-[var(--border-primary)] shadow-xl relative z-10">
        {/* Objective / Game Clock */}
        {gameType !== "AI" && (
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
        )}

        <PlayerCard
          player={1}
          score={gameState.scores?.player1 || 0}
          isCurrentPlayer={gameState.currentPlayer === 1}
          isActive={gameState.gameActive}
          isYou={gameState.playerId === 1}
          timeLeft={
            gameState.currentPlayer === 1
              ? gameState.clock?.remainingMoveTime || 0
              : gameState.timeControl?.moveTimeLimit || 0
          }
          compact={false}
          showTimer={gameType !== "AI"}
          isOnline={gameState.player1Online}
        />
        <div className="flex items-center justify-center gap-4 py-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border-primary)] to-transparent" />
          <div className="text-[10px] uppercase tracking-[0.3em] font-black text-[var(--text-muted)]">
            vs
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--border-primary)] to-transparent" />
        </div>
        <PlayerCard
          player={2}
          score={gameState.scores?.player2 || 0}
          isCurrentPlayer={gameState.currentPlayer === 2}
          isActive={gameState.gameActive}
          isYou={gameState.playerId === 2}
          timeLeft={
            gameState.currentPlayer === 2
              ? gameState.clock?.remainingMoveTime || 0
              : gameState.timeControl?.moveTimeLimit || 0
          }
          compact={false}
          showTimer={gameType !== "AI"}
          isOnline={gameState.player2Online}
        />

        {/* Legend & Game Info sidebar */}
        <div className="mt-4 flex flex-col gap-4">
          <Legend
            stageScale={stageScale}
            onZoomChange={setStageScale}
            onResetZoom={resetZoom}
          />
          {gameType !== "AI" && (
            <div className="flex flex-col gap-2 bg-[var(--bg-surface)] backdrop-blur-md px-4 py-3 rounded-2xl border border-[var(--border-primary)]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)]">
                  Temps / Tour
                </span>
                <span className="text-sm font-mono font-bold text-[var(--accent-fuchsia)]">
                  {moveTimeLimit}s
                </span>
              </div>
              <div className="h-px w-full bg-[var(--border-primary)] opacity-50" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)]">
                  Mode
                </span>
                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">
                  {gameType === "AI" ? "IA" : "Joueur"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Part (Board Area, INDEPENDENT SCROLL) */}
      <div className="flex-1 h-screen overflow-y-auto overflow-x-hidden custom-scrollbar bg-black/5 relative">
        <div className="flex flex-col items-center justify-center min-h-full p-8 lg:p-16">
          <div className="relative rounded-3xl p-2 bg-[var(--bg-card)] backdrop-blur-sm border border-[var(--border-primary)] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden group flex items-center justify-center">
          {/* Animated board border */}
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-fuchsia)]/10 via-transparent to-[var(--accent-cyan)]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

          <Stage
            width={dimensions.width}
            height={dimensions.height}
            scaleX={scales.x * stageScale}
            scaleY={scales.y * stageScale}
            x={stagePosition.x}
            y={stagePosition.y}
            onClick={handleStageClickWithScales}
            onTouchEnd={handleDoubleTap}
            onTouchMove={handleTouchMove}
            onMouseMove={handleStageMouseMoveWithScales}
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
              <Rect
                width={stageWidth}
                height={stageHeight}
                fill={boardBg}
                shadowBlur={20}
                shadowColor={isDarkMode ? "black" : "#cbd5e1"}
                shadowOpacity={0.5}
              />
              <GridLines color={gridColor} gridSize={gridSize} />
            </Layer>

            <Layer>
              <CapturedAreas
                capturedAreas={gameState.capturedAreas}
                grid={gameState.grid}
                isDarkMode={isDarkMode}
                gridSize={gridSize}
              />
              <GameStones
                grid={gameState.grid}
                lastMove={gameState.move}
                // animationFrame={animationFrame}
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

        {/* Legend for Mobile only (since it's now in the sidebar for desktop) */}
        <div className="lg:hidden mt-6 w-full px-4">
          <Legend
            stageScale={stageScale}
            onZoomChange={setStageScale}
            onResetZoom={resetZoom}
          />
        </div>
      </div>
      </div>
    </div>
  );
};

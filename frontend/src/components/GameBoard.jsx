import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { STAGE_WIDTH, STAGE_HEIGHT } from '../constants/game';
import { GridLines } from './canvas/GridLines';
import { CapturedAreas } from './canvas/CapturedAreas';
import { GameStones } from './canvas/GameStones';
import { HoverEffect } from './canvas/HoverEffect';
import { Legend } from './ui/Legend';

export const GameBoard = ({ 
  gameState, 
  hoveredCoord, 
  animationFrame, 
  onStageClick, 
  onStageMouseMove, 
  onStageMouseLeave 
}) => {
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [dimensions, setDimensions] = useState({ width: STAGE_WIDTH, height: STAGE_HEIGHT });
  
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
      const containerHeight = window.innerHeight - 100;

      const scaleX = (containerWidth - 32) / STAGE_WIDTH;
      const scaleY = (containerHeight - 120) / STAGE_HEIGHT;
      const newScale = Math.min(scaleX, scaleY, 1);

      setScale(newScale);
      setDimensions({
        width: STAGE_WIDTH * newScale,
        height: STAGE_HEIGHT * newScale
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    const timeout = setTimeout(updateSize, 100);

    return () => {
      window.removeEventListener('resize', updateSize);
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
  const handleTouchMove = useCallback((e) => {
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
          x: (centerX - stageBox.left) / oldScale - stagePosition.x / oldScale,
          y: (centerY - stageBox.top) / oldScale - stagePosition.y / oldScale,
        };

        // Nouvelle position pour garder le centre fixe
        const newPos = {
          x: -(pointerPosition.x - (centerX - stageBox.left) / newScale) * newScale,
          y: -(pointerPosition.y - (centerY - stageBox.top) / newScale) * newScale,
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
  }, [stageScale, stagePosition, scale, dimensions]);

  // Gérer le double-tap pour placer un point
  const handleDoubleTap = useCallback((e) => {
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
      if (lastPos && 
          Math.abs(touch.clientX - lastPos.x) < 30 && 
          Math.abs(touch.clientY - lastPos.y) < 30) {
        
        // Créer un événement modifié avec les bonnes coordonnées
        const stage = stageRef.current;
        const stageBox = stage.container().getBoundingClientRect();
        
        // Calculer les coordonnées réelles en tenant compte du zoom et du pan
        const x = (touch.clientX - stageBox.left - stagePosition.x) / (scale * stageScale);
        const y = (touch.clientY - stageBox.top - stagePosition.y) / (scale * stageScale);
        
        // Créer un objet event modifié pour Konva
        const modifiedEvent = {
          ...e,
          target: stage,
          evt: {
            ...e.evt,
            clientX: touch.clientX,
            clientY: touch.clientY
          }
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
        y: e.evt.changedTouches[0].clientY
      };
    }
  }, [onStageClick, scale, stageScale, stagePosition]);

  // Réinitialiser le zoom
  const resetZoom = useCallback(() => {
    setStageScale(1);
    setStagePosition({ x: 0, y: 0 });
  }, []);

  return (
    <div ref={containerRef} className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-slate-200 w-full">
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-800 text-center flex-1">
          Plateau de Jeu
        </h2>
        {/* Bouton reset zoom (mobile uniquement) */}
        {window.innerWidth < 1024 && stageScale > 1 && (
          <button
            onClick={resetZoom}
            className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
          >
            Reset Zoom
          </button>
        )}
      </div>

      {/* Instructions mobile */}
      {window.innerWidth < 1024 && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
          <p>• Pincez pour zoomer</p>
          <p>• Double-tap pour placer un point</p>
        </div>
      )}
      
      <div className="flex justify-center items-center overflow-hidden">
        <div className="bg-amber-50 rounded-xl border-2 border-slate-300 shadow-inner p-1 sm:p-2">
          <Stage
            width={dimensions.width}
            height={dimensions.height}
            scaleX={scale * stageScale}
            scaleY={scale * stageScale}
            x={stagePosition.x}
            y={stagePosition.y}
            onClick={window.innerWidth >= 1024 ? onStageClick : undefined}
            onTap={undefined} // Désactivé car géré par onTouchEnd
            onTouchEnd={handleDoubleTap}
            onTouchMove={handleTouchMove}
            onMouseMove={onStageMouseMove}
            onMouseLeave={onStageMouseLeave}
            ref={stageRef}
            style={{ 
              cursor: window.innerWidth >= 1024 ? 'crosshair' : 'grab',
              touchAction: 'none',
              maxWidth: '100%',
              display: 'block'
            }}
            draggable={window.innerWidth < 1024 && stageScale > 1}
            onDragEnd={(e) => {
              if (window.innerWidth < 1024) {
                setStagePosition({ x: e.target.x(), y: e.target.y() });
              }
            }}
          >
            <Layer>
              <Rect x={0} y={0} width={STAGE_WIDTH} height={STAGE_HEIGHT} fill="#fef7ed" />
              <GridLines />
            </Layer>

            <Layer>
              <CapturedAreas capturedAreas={gameState.capturedAreas} grid={gameState.grid} />
              <GameStones grid={gameState.grid} lastMove={gameState.move} animationFrame={animationFrame} />
            </Layer>

            <Layer>
              <HoverEffect 
                hoveredCoord={hoveredCoord}
                currentPlayer={gameState.currentPlayer}
                gameActive={gameState.gameActive}
                playerId={gameState.playerId}
                animationFrame={animationFrame}
                grid={gameState.grid}
              />
            </Layer>
          </Stage>
        </div>
      </div>

      <Legend />
    </div>
  );
};
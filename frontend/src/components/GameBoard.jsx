import React, { useRef } from 'react';
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
      <h2 className="text-xl font-semibold text-slate-800 mb-4 text-center">Plateau de Jeu</h2>
      
      <div className="flex justify-center">
        <div className="bg-amber-50 rounded-xl border-2 border-slate-300 shadow-inner p-2">
          <Stage
            width={STAGE_WIDTH}
            height={STAGE_HEIGHT}
            onClick={onStageClick}
            onTap={onStageClick}  // 👈 AJOUT POUR MOBILE
            onMouseMove={onStageMouseMove}
            onMouseLeave={onStageMouseLeave}
            onTouchEnd={onStageMouseLeave}  // 👈 AJOUT POUR MOBILE
            ref={stageRef}
            style={{ cursor: 'crosshair', touchAction: 'none' }}  // 👈 touchAction importante
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
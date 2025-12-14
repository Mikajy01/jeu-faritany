import React, { useState, useCallback } from 'react';
import { useAnimation } from './hooks/useAnimation';
import { useGameSocket } from './hooks/useGameSocket';
import { pixelToGrid, coordToKey, isValidGridPosition } from './utils/coordinates';
import { InfoPanel } from './components/InfoPanel';
import { GameBoard } from './components/GameBoard';

function App() {
  const [gameLog, setGameLog] = useState([
    "Bienvenue dans le jeu faritany !",
    "Placez vos points pour entourer les points et zones adverses."
  ]);
  const [hoveredCoord, setHoveredCoord] = useState(null);

  const addLogEntry = useCallback((message) => {
    const timestamp = new Date().toLocaleTimeString();
    setGameLog(prev => [...prev.slice(-50), `${timestamp}: ${message}`]);
  }, []);

  const { gameState, connectionStatus, socketRef } = useGameSocket(addLogEntry);
  const animationFrame = useAnimation();

  const handleStageClick = useCallback((e) => {
    if (!gameState.gameActive || gameState.playerId !== gameState.currentPlayer) return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    
    // Sécurité : vérifier que la position existe
    if (!pos) return;

    const gridCoord = pixelToGrid(pos.x, pos.y);

    if (!isValidGridPosition(gridCoord.x, gridCoord.y)) return;

    const coordKey = coordToKey(gridCoord.x, gridCoord.y);
    if (gameState.grid.has(coordKey)) return;

    socketRef.current.emit('makeMove', { x: gridCoord.x, y: gridCoord.y });
  }, [gameState.gameActive, gameState.playerId, gameState.currentPlayer, gameState.grid, socketRef]);

  const handleStageMouseMove = useCallback((e) => {
    if (!gameState.gameActive || gameState.playerId !== gameState.currentPlayer) {
      if (hoveredCoord) setHoveredCoord(null);
      return;
    }

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    
    // Sécurité : vérifier que la position existe
    if (!pos) return;

    const gridCoord = pixelToGrid(pos.x, pos.y);

    if (!isValidGridPosition(gridCoord.x, gridCoord.y)) {
      if (hoveredCoord) setHoveredCoord(null);
      return;
    }

    if (!hoveredCoord || hoveredCoord.x !== gridCoord.x || hoveredCoord.y !== gridCoord.y) {
      setHoveredCoord(gridCoord);
    }
  }, [gameState.gameActive, gameState.playerId, gameState.currentPlayer, hoveredCoord]);

  const handleStageMouseLeave = useCallback(() => {
    setHoveredCoord(null);
  }, []);

  const resetGame = useCallback(() => {
    socketRef.current?.emit('resetGame');
  }, [socketRef]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <InfoPanel
          connectionStatus={connectionStatus}
          gameState={gameState}
          hoveredCoord={hoveredCoord}
          gameLog={gameLog}
          onResetGame={resetGame}
        />

        <div className="lg:col-span-2">
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
  );
}

export default App;
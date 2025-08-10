import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Line, Circle, Group, Rect, Text } from 'react-konva';
import io from 'socket.io-client';

function App() {
  const [gameState, setGameState] = useState({
    grid: new Map(),
    currentPlayer: 1,
    scores: { player1: 0, player2: 0 },
    move: null,
    playerId: null,
    gameActive: false,
    capturedAreas: []
  });
  const [connectionStatus, setConnectionStatus] = useState('Connexion au serveur...');
  const [gameLog, setGameLog] = useState([
    "Bienvenue dans le jeu faritany !",
    "Placez vos points pour entourer les points et zones adverses."
  ]);
  const [hoveredCoord, setHoveredCoord] = useState(null);
  const [animationFrame, setAnimationFrame] = useState(0);

  const socketRef = useRef(null);
  const stageRef = useRef(null);
  const gridSize = 19;
  const cellSize = 30;
  const stoneRadius = 4;
  const padding = 30;
  const stageWidth = gridSize * cellSize + padding * 2;
  const stageHeight = gridSize * cellSize + padding * 2;

  // Animation frame pour les effets
  useEffect(() => {
    const animate = () => {
      setAnimationFrame(prev => prev + 1);
      requestAnimationFrame(animate);
    };
    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Utilitaires pour coordonnées
  const coordToKey = (x, y) => `${x},${y}`;
  const keyToCoord = (key) => {
    const [x, y] = key.split(',').map(Number);
    return { x, y };
  };

  const pixelToGrid = (x, y) => {
    const gridX = Math.round((x - padding) / cellSize);
    const gridY = Math.round((y - padding) / cellSize);
    return { x: gridX, y: gridY };
  };

  const gridToPixel = (gridX, gridY) => {
    return {
      x: padding + gridX * cellSize,
      y: padding + gridY * cellSize
    };
  };

  useEffect(() => {
    // Initialiser la connexion socket
    socketRef.current = io("http://localhost:5555", {
      transports: ["websocket", "polling"]
    });

    socketRef.current.on('connect', () => {
      setConnectionStatus('Connecté au serveur');
      addLogEntry("Connecté au serveur");
      socketRef.current.emit('joinGame');
    });

    socketRef.current.on('gameJoined', (data) => {
      const gridMap = new Map();
      if (data.gameState.grid) {
        Object.entries(data.gameState.grid).forEach(([key, value]) => {
          if (value !== 0) {
            gridMap.set(key, value);
          }
        });
      }
      
      setGameState(prev => ({
        ...prev,
        playerId: data.playerId,
        gameActive: data.gameState.gameActive,
        grid: gridMap,
        scores: data.gameState.scores,
        currentPlayer: data.gameState.currentPlayer,
      }));
      addLogEntry(`Vous êtes le joueur ${data.playerId}`);
    });

    socketRef.current.on('gameStart', (data) => {
      const gridMap = new Map();
      if (data.gameState.grid) {
        Object.entries(data.gameState.grid).forEach(([key, value]) => {
          if (value !== 0) {
            gridMap.set(key, value);
          }
        });
      }

      setGameState(prev => ({
        ...prev,
        gameActive: true,
        grid: gridMap,
        scores: data.gameState.scores,
        currentPlayer: data.gameState.currentPlayer,
        capturedAreas: data.gameState.capturedAreas || []
      }));
      addLogEntry("Jeu démarré !");
      setConnectionStatus('Partie en cours');
    });

    socketRef.current.on('moveMade', (data) => {
      const gridMap = new Map();
      if (data.gameState.grid) {
        Object.entries(data.gameState.grid).forEach(([key, value]) => {
          if (value !== 0) {
            gridMap.set(key, value);
          }
        });
      }

      setGameState(prev => ({
        ...prev,
        grid: gridMap,
        scores: data.gameState.scores,
        currentPlayer: data.gameState.currentPlayer,
        capturedAreas: data.gameState.capturedAreas || [],
        move: data.move
      }));

      if (data.capturedStones.length > 0) {
        addLogEntry(`Le joueur ${data.move.player} a capturé ${data.capturedStones.length} pierres !`);
      }

      addLogEntry(`Tour du joueur ${data.gameState.currentPlayer === 1 ? 2 : 1}`);
    });

    socketRef.current.on('gameReset', (data) => {
      const gridMap = new Map();
      if (data.gameState.grid) {
        Object.entries(data.gameState.grid).forEach(([key, value]) => {
          if (value !== 0) {
            gridMap.set(key, value);
          }
        });
      }

      setGameState(prev => ({
        ...prev,
        grid: gridMap,
        scores: data.gameState.scores,
        currentPlayer: data.gameState.currentPlayer,
        capturedAreas: data.gameState.capturedAreas || []
      }));
      addLogEntry("Jeu réinitialisé !");
    });

    socketRef.current.on('playerDisconnected', () => {
      setGameState(prev => ({ ...prev, gameActive: false }));
      setConnectionStatus('Adversaire déconnecté');
      addLogEntry("Adversaire déconnecté !");
    });

    socketRef.current.on('disconnect', () => {
      setConnectionStatus('Déconnecté du serveur');
    });

    socketRef.current.on('connect_error', () => {
      setConnectionStatus('Erreur de connexion');
    });

    socketRef.current.on('moveError', (data) => {
      addLogEntry(`Erreur: ${data.reason}`);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const addLogEntry = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setGameLog(prev => [...prev.slice(-50), `${timestamp}: ${message}`]);
  };

  const areStonesDiagonallyConnected = (coord1, coord2) => {
    return Math.abs(coord1.x - coord2.x) === 1 && Math.abs(coord1.y - coord2.y) === 1;
  };

  const handleStageClick = (e) => {
    if (!gameState.gameActive || gameState.playerId !== gameState.currentPlayer) return;

    const pos = e.target.getStage().getPointerPosition();
    const gridCoord = pixelToGrid(pos.x, pos.y);

    if (gridCoord.x < 0 || gridCoord.x >= gridSize || gridCoord.y < 0 || gridCoord.y >= gridSize) return;

    const coordKey = coordToKey(gridCoord.x, gridCoord.y);
    if (gameState.grid.has(coordKey)) return;

    socketRef.current.emit('makeMove', { x: gridCoord.x, y: gridCoord.y });
  };

  const handleStageMouseMove = (e) => {
    if (!gameState.gameActive || gameState.playerId !== gameState.currentPlayer) {
      setHoveredCoord(null);
      return;
    }

    const pos = e.target.getStage().getPointerPosition();
    const gridCoord = pixelToGrid(pos.x, pos.y);

    if (gridCoord.x < 0 || gridCoord.x >= gridSize || gridCoord.y < 0 || gridCoord.y >= gridSize) {
      setHoveredCoord(null);
      return;
    }

    setHoveredCoord(gridCoord);
  };

  const handleStageMouseLeave = () => {
    setHoveredCoord(null);
  };

  const resetGame = () => {
    if (socketRef.current) {
      socketRef.current.emit('resetGame');
    }
  };

  const getConnectionStatusColor = () => {
    if (connectionStatus.includes('Connecté')) return 'text-green-600 bg-green-100';
    if (connectionStatus.includes('Erreur') || connectionStatus.includes('Déconnecté')) return 'text-red-600 bg-red-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  // Composants Konva
  const GridLines = () => {
    const lines = [];
    
    // Lignes horizontales
    for (let i = 0; i < gridSize; i++) {
      lines.push(
        <Line
          key={`h-${i}`}
          points={[padding, padding + i * cellSize, stageWidth - padding, padding + i * cellSize]}
          stroke="#4a5568"
          strokeWidth={1}
          opacity={0.6}
        />
      );
    }
    
    // Lignes verticales
    for (let i = 0; i < gridSize; i++) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[padding + i * cellSize, padding, padding + i * cellSize, stageHeight - padding]}
          stroke="#4a5568"
          strokeWidth={1}
          opacity={0.6}
        />
      );
    }
    
    return <>{lines}</>;
  };

  const HoverEffect = () => {
    if (!hoveredCoord || !gameState.gameActive || gameState.playerId !== gameState.currentPlayer) return null;
    
    const coordKey = coordToKey(hoveredCoord.x, hoveredCoord.y);
    if (gameState.grid.has(coordKey)) return null;

    const pixel = gridToPixel(hoveredCoord.x, hoveredCoord.y);
    const pulseScale = 1 + Math.sin(animationFrame * 0.2) * 0.1;
    const alpha = 0.3 + Math.sin(animationFrame * 0.15) * 0.2;

    return (
      <Group>
        <Circle
          x={pixel.x}
          y={pixel.y}
          radius={(stoneRadius + 4) * pulseScale}
          fill={gameState.currentPlayer === 1 ? '#e74c3c' : '#3498db'}
          opacity={alpha}
        />
        <Circle
          x={pixel.x}
          y={pixel.y}
          radius={stoneRadius}
          stroke={gameState.currentPlayer === 1 ? '#e74c3c' : '#3498db'}
          strokeWidth={2}
          opacity={0.8}
        />
      </Group>
    );
  };

  const CapturedAreas = () => {
    return gameState.capturedAreas.map((area, areaIndex) => {
      const color = area.owner === 1 ? '#e74c3c' : '#3498db';
      const fillColor = area.owner === 1 ? 'rgba(231, 76, 60, 0.15)' : 'rgba(52, 152, 219, 0.15)';
      
      return (
        <Group key={`area-${areaIndex}`}>
          {/* Zone de remplissage */}
          {area.stones.length > 2 && (
            <Line
              points={area.stones.flatMap(coord => {
                const pixel = gridToPixel(coord.x, coord.y);
                return [pixel.x, pixel.y];
              })}
              closed
              fill={fillColor}
              stroke={color}
              strokeWidth={1}
              opacity={0.3}
            />
          )}
          
          {/* Connexions orthogonales */}
          {area.stones.map((stone, stoneIndex) => {
            const connections = [];
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            
            directions.forEach(([dx, dy]) => {
              const adjX = stone.x + dx;
              const adjY = stone.y + dy;
              if (adjX >= 0 && adjX < gridSize && adjY >= 0 && adjY < gridSize) {
                const adjKey = coordToKey(adjX, adjY);
                if (gameState.grid.get(adjKey) === area.owner) {
                  const pixel1 = gridToPixel(stone.x, stone.y);
                  const pixel2 = gridToPixel(adjX, adjY);
                  connections.push(
                    <Line
                      key={`conn-${stoneIndex}-${dx}-${dy}`}
                      points={[pixel1.x, pixel1.y, pixel2.x, pixel2.y]}
                      stroke={color}
                      strokeWidth={3}
                      opacity={0.7}
                    />
                  );
                }
              }
            });
            
            return connections;
          })}
          
          {/* Connexions diagonales (pointillées) */}
          {area.stones.map((stone, i) => {
            const diagonalConnections = [];
            for (let j = i + 1; j < area.stones.length; j++) {
              const otherStone = area.stones[j];
              if (areStonesDiagonallyConnected(stone, otherStone)) {
                const pixel1 = gridToPixel(stone.x, stone.y);
                const pixel2 = gridToPixel(otherStone.x, otherStone.y);
                diagonalConnections.push(
                  <Line
                    key={`diag-${i}-${j}`}
                    points={[pixel1.x, pixel1.y, pixel2.x, pixel2.y]}
                    stroke={color}
                    strokeWidth={2}
                    dash={[8, 4]}
                    opacity={0.8}
                  />
                );
              }
            }
            return diagonalConnections;
          })}
        </Group>
      );
    });
  };

  const GameStones = () => {
    const stones = [];
    
    gameState.grid.forEach((player, coordKey) => {
      const coord = keyToCoord(coordKey);
      const pixel = gridToPixel(coord.x, coord.y);
      
      const isLastMove = gameState.move && 
        gameState.move.x === coord.x && 
        gameState.move.y === coord.y;
      
      const colors = {
        1: { main: '#e74c3c', shadow: '#c0392b', highlight: '#ff6b7a', glow: '#ff4757' },
        2: { main: '#3498db', shadow: '#2980b9', highlight: '#74b9ff', glow: '#00cec9' }
      };
      
      const playerColors = colors[player];
      const time = animationFrame * 0.05;
      const pulseScale = isLastMove ? 1 + Math.sin(time) * 0.15 : 1;
      const glowIntensity = isLastMove ? (Math.sin(time * 2) * 0.3 + 0.7) : 0;

      stones.push(
        <Group key={coordKey}>
          {/* Halo de surbrillance pour le dernier coup */}
          {isLastMove && (
            <Circle
              x={pixel.x}
              y={pixel.y}
              radius={stoneRadius * 2.5 * pulseScale}
              fill={playerColors.glow}
              opacity={glowIntensity * 0.3}
            />
          )}
          
          {/* Ombre de la pierre */}
          <Circle
            x={pixel.x + 1}
            y={pixel.y + 2}
            radius={stoneRadius * pulseScale}
            fill={playerColors.shadow}
            opacity={0.4}
          />
          
          {/* Pierre principale */}
          <Circle
            x={pixel.x}
            y={pixel.y}
            radius={stoneRadius * pulseScale}
            fill={playerColors.main}
            shadowColor={playerColors.shadow}
            shadowBlur={4}
            shadowOffset={{ x: 1, y: 2 }}
            shadowOpacity={0.3}
          />
          
          {/* Reflet sur la pierre */}
          <Circle
            x={pixel.x - 2}
            y={pixel.y - 2}
            radius={stoneRadius * 0.4}
            fill="rgba(255, 255, 255, 0.6)"
            opacity={0.8}
          />
          
          {/* Anneau de surbrillance pour le dernier coup */}
          {isLastMove && (
            <>
              <Circle
                x={pixel.x}
                y={pixel.y}
                radius={(stoneRadius + 6) * pulseScale}
                stroke={playerColors.glow}
                strokeWidth={3}
                opacity={glowIntensity * 0.8}
              />
              
              {/* Points de surbrillance qui tournent */}
              {[...Array(8)].map((_, i) => {
                const angle = (i / 8) * Math.PI * 2 + time * 0.5;
                const dotX = pixel.x + Math.cos(angle) * (stoneRadius + 8) * pulseScale;
                const dotY = pixel.y + Math.sin(angle) * (stoneRadius + 8) * pulseScale;
                
                return (
                  <Circle
                    key={`dot-${i}`}
                    x={dotX}
                    y={dotY}
                    radius={2 * glowIntensity}
                    fill={playerColors.glow}
                    opacity={glowIntensity}
                  />
                );
              })}
            </>
          )}
        </Group>
      );
    });
    
    return <>{stones}</>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel d'informations */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <h1 className="text-2xl font-bold text-slate-800 mb-4 text-center">Jeu Faritany</h1>

            <div className={`text-sm font-medium px-3 py-2 rounded-lg text-center mb-4 ${getConnectionStatusColor()}`}>
              {connectionStatus}
            </div>

            <div className="space-y-3">
              <div className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                gameState.currentPlayer === 1 ? 'border-red-400 bg-red-50 shadow-md' : 'border-slate-200 bg-slate-50'
              }`}>
                <span className="font-medium text-slate-700">Joueur 1</span>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="font-bold text-lg text-slate-800">{gameState.scores.player1}</span>
                </div>
              </div>
              
              <div className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                gameState.currentPlayer === 2 ? 'border-blue-400 bg-blue-50 shadow-md' : 'border-slate-200 bg-slate-50'
              }`}>
                <span className="font-medium text-slate-700">Joueur 2</span>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="font-bold text-lg text-slate-800">{gameState.scores.player2}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-100 rounded-lg text-center">
              <span className="text-slate-700 font-medium">
                {!gameState.gameActive
                  ? "En attente d'un adversaire..."
                  : gameState.playerId === gameState.currentPlayer
                    ? 'À votre tour !'
                    : "En attente de l'adversaire..."}
              </span>
            </div>

            <button 
              onClick={resetGame}
              className="w-full mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md"
            >
              Nouvelle Partie
            </button>
          </div>

          {/* Coordonnées de survol */}
          {hoveredCoord && (
            <div className="bg-white rounded-xl shadow-lg p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-2">🎯 Position du curseur</h3>
              <div className="bg-slate-100 rounded-lg p-3 text-center">
                <span className="font-mono text-lg text-slate-700">
                  ({hoveredCoord.x}, {hoveredCoord.y})
                </span>
              </div>
            </div>
          )}

          {/* Journal de jeu */}
          <div className="bg-white rounded-xl shadow-lg p-4 border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-3">📋 Journal de Jeu</h3>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {gameLog.map((entry, index) => (
                <div key={index} className="text-xs text-slate-600 p-2 bg-slate-50 rounded border-l-2 border-slate-300">
                  {entry}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Plateau de jeu */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 mb-4 text-center">Plateau de Jeu</h2>
            
            <div className="flex justify-center">
              <div className="bg-amber-50 rounded-xl border-2 border-slate-300 shadow-inner p-2">
                <Stage
                  width={stageWidth}
                  height={stageHeight}
                  onClick={handleStageClick}
                  onMouseMove={handleStageMouseMove}
                  onMouseLeave={handleStageMouseLeave}
                  ref={stageRef}
                  style={{ cursor: 'crosshair' }}
                >
                  <Layer>
                    {/* Arrière-plan */}
                    <Rect
                      x={0}
                      y={0}
                      width={stageWidth}
                      height={stageHeight}
                      fill="#fef7ed"
                    />
                    
                    {/* Grille */}
                    <GridLines />
                    
                    {/* Zones capturées */}
                    <CapturedAreas />
                    
                    {/* Effet de survol */}
                    <HoverEffect />
                    
                    {/* Pierres de jeu */}
                    <GameStones />
                  </Layer>
                </Stage>
              </div>
            </div>

            {/* Légende */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200">
                <div className="w-4 h-4 bg-red-500 bg-opacity-20 border border-red-300 rounded"></div>
                <span className="text-red-700 font-medium">Zone prison (Joueur 1)</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-4 h-4 bg-blue-500 bg-opacity-20 border border-blue-300 rounded"></div>
                <span className="text-blue-700 font-medium">Zone prison (Joueur 2)</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-4 h-0 border-t-2 border-dashed border-slate-400"></div>
                <span className="text-slate-700 font-medium">Barreaux diagonaux</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
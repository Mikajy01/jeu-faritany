import React, { useState, useEffect, useRef } from 'react';

import io from 'socket.io-client';

function App() {
  const [gameState, setGameState] = useState({
    grid: new Map(), // Changé en Map pour stocker {x,y} -> player
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

  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const gridSize = 19;
  const cellSize = 30;
  const stoneRadius = 5;
  const padding = 30;

  // Utilitaire pour convertir coordonnées en clé string
  const coordToKey = (x, y) => `${x},${y}`;
  const keyToCoord = (key) => {
    const [x, y] = key.split(',').map(Number);
    return { x, y };
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
      // Convertir le grid reçu du serveur
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
      
      drawBoard();

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
      drawBoard();
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

  useEffect(() => {
    drawBoard();
  }, [gameState, hoveredCoord]);

  const addLogEntry = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setGameLog(prev => [...prev.slice(-50), `${timestamp}: ${message}`]);
  };

  // Fonction pour vérifier si deux pierres sont connectées diagonalement
  const areStonesDiagonallyConnected = (coord1, coord2) => {
    return Math.abs(coord1.x - coord2.x) === 1 && Math.abs(coord1.y - coord2.y) === 1;
  };

  const drawBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = gridSize * cellSize + padding * 2;
    const height = gridSize * cellSize + padding * 2;

    // Définir la taille du canvas
    canvas.width = width;
    canvas.height = height;

    // Effacer le canvas
    ctx.clearRect(0, 0, width, height);

    // Dessiner la grille
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;

    for (let i = 0; i < gridSize; i++) {
      // Lignes horizontales
      ctx.beginPath();
      ctx.moveTo(padding, padding + i * cellSize);
      ctx.lineTo(width - padding, padding + i * cellSize);
      ctx.stroke();

      // Lignes verticales
      ctx.beginPath();
      ctx.moveTo(padding + i * cellSize, padding);
      ctx.lineTo(padding + i * cellSize, height - padding);
      ctx.stroke();
    }

    // Dessiner l'effet de survol
    if (hoveredCoord && gameState.gameActive && gameState.playerId === gameState.currentPlayer) {
      const coordKey = coordToKey(hoveredCoord.x, hoveredCoord.y);
      if (!gameState.grid.has(coordKey)) {
        const x = padding + hoveredCoord.x * cellSize;
        const y = padding + hoveredCoord.y * cellSize;
        
        // Cercle de survol
        ctx.beginPath();
        ctx.arc(x, y, stoneRadius + 2, 0, Math.PI * 2);
        ctx.fillStyle = gameState.currentPlayer === 1 ? 'rgba(231, 76, 60, 0.3)' : 'rgba(52, 152, 219, 0.3)';
        ctx.fill();
        ctx.strokeStyle = gameState.currentPlayer === 1 ? '#e74c3c' : '#3498db';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Dessiner les zones capturées et les murs de prison
    gameState.capturedAreas.forEach(area => {
      // Dessiner l'arrière-plan de la zone enfermée
      ctx.fillStyle = area.owner === 1 ? 'rgba(231, 76, 60, 0.2)' : 'rgba(52, 152, 219, 0.2)';
      ctx.beginPath();

      area.stones.forEach((coord, i) => {
        const x = padding + coord.x * cellSize;
        const y = padding + coord.y * cellSize;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.closePath();
      ctx.fill();

      ctx.setLineDash([]); // Réinitialiser le style de ligne

      // Dessiner les connexions entre les pierres (barreaux de prison)
      ctx.strokeStyle = area.owner === 1 ? '#e74c3c' : '#3498db';
      ctx.lineWidth = 2;

      // Dessiner les connexions diagonales
      ctx.setLineDash([5, 3]); // Ligne pointillée pour les diagonales

      area.stones.forEach((stone, i) => {
        // Vérifier les connexions diagonales
        for (let j = i + 1; j < area.stones.length; j++) {
          const otherStone = area.stones[j];

          if (areStonesDiagonallyConnected(stone, otherStone)) {
            ctx.beginPath();
            ctx.moveTo(
              padding + stone.x * cellSize,
              padding + stone.y * cellSize
            );
            ctx.lineTo(
              padding + otherStone.x * cellSize,
              padding + otherStone.y * cellSize
            );
            ctx.stroke();
          }
        }
      });

      ctx.setLineDash([]); // Réinitialiser à la ligne pleine

      // Dessiner les connexions orthogonales
      area.stones.forEach(stone => {
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        directions.forEach(([dx, dy]) => {
          const adjX = stone.x + dx;
          const adjY = stone.y + dy;
          if (adjX >= 0 && adjX < gridSize && adjY >= 0 && adjY < gridSize) {
            const adjKey = coordToKey(adjX, adjY);
            if (gameState.grid.get(adjKey) === area.owner) {
              ctx.beginPath();
              ctx.moveTo(
                padding + stone.x * cellSize,
                padding + stone.y * cellSize
              );
              ctx.lineTo(
                padding + adjX * cellSize,
                padding + adjY * cellSize
              );
              ctx.stroke();
            }
          }
        });
      });
    });

    // Dessiner les pierres
    gameState.grid.forEach((player, coordKey) => {
      const coord = keyToCoord(coordKey);
      const x = padding + coord.x * cellSize;
      const y = padding + coord.y * cellSize;

      // Vérifier si c'est la dernière pierre jouée
      const isLastMove = gameState.move && 
        gameState.move.x === coord.x && 
        gameState.move.y === coord.y;

      // Animation de pulsation pour le dernier coup
      const time = Date.now() * 0.003;
      const pulseScale = isLastMove ? 1 + Math.sin(time) * 0.1 : 1;
      const glowIntensity = isLastMove ? (Math.sin(time * 2) * 0.3 + 0.7) : 0;

      // Couleurs améliorées
      const colors = {
        1: {
          shadow: '#8b1538',
          main: '#e74c3c',
          highlight: '#ff6b7a',
          glow: '#ff4757'
        },
        2: {
          shadow: '#1e3a5f',
          main: '#3498db',
          highlight: '#74b9ff',
          glow: '#00cec9'
        }
      };

      const playerColors = colors[player];

      // Halo de surbrillance (pour le dernier coup)
      if (isLastMove) {
        ctx.save();

        // Halo externe
        const gradient = ctx.createRadialGradient(x, y - 2, 0, x, y - 2, stoneRadius * 2.5);
        gradient.addColorStop(0, `${playerColors.glow}${Math.floor(glowIntensity * 80).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(0.4, `${playerColors.glow}${Math.floor(glowIntensity * 40).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, `${playerColors.glow}00`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y - 2, stoneRadius * 2.5 * pulseScale, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // Ombre de la pierre (plus subtile)
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, stoneRadius * pulseScale, 0, Math.PI * 2);
      ctx.fillStyle = playerColors.shadow;
      ctx.globalAlpha = 0.6;
      ctx.fill();
      ctx.restore();

      // Pierre principale avec dégradé
      ctx.save();
      const stoneGradient = ctx.createRadialGradient(
        x - stoneRadius * 0.3, y - 2 - stoneRadius * 0.3, 0,
        x, y - 2, stoneRadius
      );
      stoneGradient.addColorStop(0, playerColors.highlight);
      stoneGradient.addColorStop(0.7, playerColors.main);
      stoneGradient.addColorStop(1, playerColors.shadow);

      ctx.beginPath();
      ctx.arc(x, y - 2, stoneRadius * pulseScale, 0, Math.PI * 2);
      ctx.fillStyle = stoneGradient;
      ctx.fill();

      // Reflet sur la pierre
      const reflectGradient = ctx.createRadialGradient(
        x - stoneRadius * 0.4, y - 2 - stoneRadius * 0.4, 0,
        x - stoneRadius * 0.4, y - 2 - stoneRadius * 0.4, stoneRadius * 0.6
      );
      reflectGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      reflectGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.beginPath();
      ctx.arc(x - stoneRadius * 0.4, y - 2 - stoneRadius * 0.4, stoneRadius * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = reflectGradient;
      ctx.fill();

      ctx.restore();

      // Anneau de surbrillance moderne (pour le dernier coup)
      if (isLastMove) {
        ctx.save();

        // Anneau principal
        ctx.beginPath();
        ctx.arc(x, y - 2, (stoneRadius + 6) * pulseScale, 0, Math.PI * 2);
        ctx.arc(x, y - 2, (stoneRadius + 2) * pulseScale, 0, Math.PI * 2, true);

        const ringGradient = ctx.createRadialGradient(x, y - 2, stoneRadius, x, y - 2, stoneRadius + 8);
        ringGradient.addColorStop(0, `${playerColors.glow}${Math.floor(glowIntensity * 200).toString(16).padStart(2, '0')}`);
        ringGradient.addColorStop(1, `${playerColors.glow}${Math.floor(glowIntensity * 100).toString(16).padStart(2, '0')}`);

        ctx.fillStyle = ringGradient;
        ctx.fill();

        // Points de surbrillance qui tournent
        const numDots = 8;
        const rotationSpeed = time * 0.5;

        for (let i = 0; i < numDots; i++) {
          const angle = (i / numDots) * Math.PI * 2 + rotationSpeed;
          const dotX = x + Math.cos(angle) * (stoneRadius + 8) * pulseScale;
          const dotY = y - 2 + Math.sin(angle) * (stoneRadius + 8) * pulseScale;

          ctx.beginPath();
          ctx.arc(dotX, dotY, 2 * glowIntensity, 0, Math.PI * 2);
          ctx.fillStyle = `${playerColors.glow}${Math.floor(glowIntensity * 255).toString(16).padStart(2, '0')}`;
          ctx.shadowColor = playerColors.glow;
          ctx.shadowBlur = 8 * glowIntensity;
          ctx.fill();
        }

        ctx.restore();
      }
    });
  };

  const handleCanvasClick = (e) => {
    if (!gameState.gameActive || gameState.playerId !== gameState.currentPlayer) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - padding;
    const y = e.clientY - rect.top - padding;

    if (x < 0 || y < 0) return;

    const col = Math.round(x / cellSize);
    const row = Math.round(y / cellSize);

    if (col < 0 || col >= gridSize || row < 0 || row >= gridSize) return;

    const coordKey = coordToKey(col, row);
    if (gameState.grid.has(coordKey)) return; // Position occupée

    socketRef.current.emit('makeMove', { x: col, y: row });
  };

  const handleCanvasMouseMove = (e) => {
    if (!gameState.gameActive || gameState.playerId !== gameState.currentPlayer) {
      setHoveredCoord(null);
      return;
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - padding;
    const y = e.clientY - rect.top - padding;

    if (x < 0 || y < 0) {
      setHoveredCoord(null);
      return;
    }

    const col = Math.round(x / cellSize);
    const row = Math.round(y / cellSize);

    if (col < 0 || col >= gridSize || row < 0 || row >= gridSize) {
      setHoveredCoord(null);
      return;
    }

    setHoveredCoord({ x: col, y: row });
  };

  const handleCanvasMouseLeave = () => {
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
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={handleCanvasMouseLeave}
                className="bg-amber-50 rounded-xl border-2 border-slate-300 cursor-crosshair shadow-inner"
              />
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
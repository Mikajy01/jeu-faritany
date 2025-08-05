import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

function App() {
  const [gameState, setGameState] = useState({
    grid: Array(19 * 19).fill(0),
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

  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const gridSize = 19;
  const cellSize = 30;
  const stoneRadius = 5;
  const padding = 30;

  useEffect(() => {
    // Initialiser la connexion socket
    socketRef.current = io("http://192.168.56.67:5555", {
      transports: ["websocket", "polling"]
    });

    socketRef.current.on('connect', () => {
      setConnectionStatus('Connecté au serveur');
      addLogEntry("Connecté au serveur");
      socketRef.current.emit('joinGame');
    });

    socketRef.current.on('gameJoined', (data) => {
      setGameState(prev => ({
        ...prev,
        playerId: data.playerId,
        gameActive: data.gameState.gameActive,
        grid: data.gameState.grid,
        scores: data.gameState.scores,
        currentPlayer: data.gameState.currentPlayer,
      }));
      addLogEntry(`Vous êtes le joueur ${data.playerId}`);
    });

    socketRef.current.on('gameStart', (data) => {
      setGameState(prev => ({
        ...prev,
        gameActive: true,
        ...data.gameState
      }));
      addLogEntry("Jeu démarré !");
      setConnectionStatus('Partie en cours');
    });

    socketRef.current.on('moveMade', (data) => {
      setGameState(prev => ({
        ...prev,
        ...data.gameState,
        move: data.move
      }));
      const capturedArea = data.gameState.capturedAreas[data.gameState.capturedAreas.length - 1];
      drawBoard();

      if (data.capturedStones.length > 0) {
        addLogEntry(`Le joueur ${data.move.player} a capturé ${data.capturedStones.length} pierres !`);
      }

      // if (capturedArea) {
      //   flashEnclosedArea(capturedArea.stones, capturedArea.owner);
      // }
      addLogEntry(`Tour du joueur ${data.gameState.currentPlayer === 1 ? 2 : 1}`);
    });

    socketRef.current.on('gameReset', (data) => {
      setGameState(prev => ({
        ...prev,
        ...data.gameState
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
  }, [gameState]);

  const addLogEntry = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setGameLog(prev => [...prev.slice(-50), `${timestamp}: ${message}`]);
  };

  // const flashEnclosedArea = (enclosedAreas, player) => {
  //   const canvas = canvasRef.current;
  //   if (!canvas) return;

  //   const ctx = canvas.getContext('2d');
  //   const color = player === 1 ? 'rgba(231, 76, 60, 0.5)' : 'rgba(52, 152, 219, 0.5)';

  //   enclosedAreas.forEach(area => {
  //     ctx.fillStyle = color;
  //     ctx.beginPath();

  //     area.forEach((point, i) => {
  //       const row = Math.floor(point / gridSize);
  //       const col = point % gridSize;
  //       const x = padding + col * cellSize;
  //       const y = padding + row * cellSize;

  //       if (i === 0) {
  //         ctx.moveTo(x, y);
  //       } else {
  //         ctx.lineTo(x, y);
  //       }
  //     });

  //     ctx.closePath();
  //     ctx.fill();
  //   });

  //   setTimeout(() => {
  //     drawBoard();
  //   }, 500);
  // };

  // Fonction pour vérifier si deux pierres sont connectées diagonalement
  const areStonesDiagonallyConnected = (stone1, stone2) => {
    const row1 = Math.floor(stone1 / gridSize);
    const col1 = stone1 % gridSize;
    const row2 = Math.floor(stone2 / gridSize);
    const col2 = stone2 % gridSize;

    return Math.abs(row1 - row2) === 1 && Math.abs(col1 - col2) === 1;
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

    // Dessiner les zones capturées et les murs de prison
    gameState.capturedAreas.forEach(area => {
      // Dessiner l'arrière-plan de la zone enfermée
      ctx.fillStyle = area.owner === 1 ? 'rgba(231, 76, 60, 0.2)' : 'rgba(52, 152, 219, 0.2)';
      ctx.beginPath();

      area.stones.forEach((point, i) => {
        const row = Math.floor(point / gridSize);
        const col = point % gridSize;
        const x = padding + col * cellSize;
        const y = padding + row * cellSize;

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
        const row = Math.floor(stone / gridSize);
        const col = stone % gridSize;

        // Vérifier les connexions diagonales
        for (let j = i + 1; j < area.stones.length; j++) {
          const otherStone = area.stones[j];

          if (areStonesDiagonallyConnected(stone, otherStone)) {
            const otherRow = Math.floor(otherStone / gridSize);
            const otherCol = otherStone % gridSize;

            ctx.beginPath();
            ctx.moveTo(
              padding + col * cellSize,
              padding + row * cellSize
            );
            ctx.lineTo(
              padding + otherCol * cellSize,
              padding + otherRow * cellSize
            );
            ctx.stroke();
          }
        }
      });

      ctx.setLineDash([]); // Réinitialiser à la ligne pleine

      // Dessiner les connexions orthogonales
      area.stones.forEach(stone => {
        const row = Math.floor(stone / gridSize);
        const col = stone % gridSize;
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        directions.forEach(([dr, dc]) => {
          const adjRow = row + dr;
          const adjCol = col + dc;
          if (adjRow >= 0 && adjRow < gridSize && adjCol >= 0 && adjCol < gridSize) {
            const adjIndex = adjRow * gridSize + adjCol;
            if (gameState.grid[adjIndex] === area.owner) {
              ctx.beginPath();
              ctx.moveTo(
                padding + col * cellSize,
                padding + row * cellSize
              );
              ctx.lineTo(
                padding + adjCol * cellSize,
                padding + adjRow * cellSize
              );
              ctx.stroke();
            }
          }
        });
      });
    });

    // Dessiner les pierres
    gameState.grid.forEach((player, index) => {
      if (player === 0) return;
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      const x = padding + col * cellSize;
      const y = padding + row * cellSize;

      // Vérifier si c'est la dernière pierre jouée
      const isLastMove = gameState.move && gameState.move.index === index;

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

    const index = row * gridSize + col;
    socketRef.current.emit('makeMove', { index });
  };

  const resetGame = () => {
    if (socketRef.current) {
      socketRef.current.emit('resetGame');
    }
  };

  return (
    <div className="app-container">
      <div className="game-info">
        <h1>Jeu Faritany</h1>

        <div className={`connection-status ${connectionStatus.includes('Connecté') ? 'connected' :
            connectionStatus.includes('Erreur') || connectionStatus.includes('Déconnecté') ? 'disconnected' :
              'waiting'
          }`}>
          {connectionStatus}
        </div>

        <div className="player-info">
          <div className={`player ${gameState.currentPlayer === 1 ? 'active' : ''}`}>
            <div>Joueur 1</div>
            <div style={{ color: '#e74c3c' }}>●</div>
            <div className="score">{gameState.scores.player1}</div>
          </div>
          <div className={`player ${gameState.currentPlayer === 2 ? 'active' : ''}`}>
            <div>Joueur 2</div>
            <div style={{ color: '#3498db' }}>●</div>
            <div className="score">{gameState.scores.player2}</div>
          </div>
        </div>

        <div className="status">
          {!gameState.gameActive
            ? "En attente d'un adversaire..."
            : gameState.playerId === gameState.currentPlayer
              ? 'À votre tour !'
              : "En attente de l'adversaire..."}
        </div>

        <button onClick={resetGame}>Nouvelle Partie</button>

        <h3>📋 Journal de Jeu</h3>
        <div className="game-log">
          {gameLog.map((entry, index) => (
            <div key={index} className="log-entry">{entry}</div>
          ))}
        </div>
      </div>

      <div className="game-board">
        <h2>Plateau de Jeu</h2>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '10px',
            border: '2px solid #333',
            cursor: 'crosshair'
          }}
        />
        <div className="legend">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: 'rgba(231, 76, 60, 0.2)' }}></div>
            <span>Zone prison (Joueur 1)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: 'rgba(52, 152, 219, 0.2)' }}></div>
            <span>Zone prison (Joueur 2)</span>
          </div>
          <div className="legend-item">
            <div className="legend-line" style={{ borderTop: '2px dashed #e74c3c' }}></div>
            <span>Barreaux diagonaux</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
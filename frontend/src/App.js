import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

function App() {
  const [gameState, setGameState] = useState({
    grid: Array(19 * 19).fill(0),
    currentPlayer: 1,
    scores: { player1: 0, player2: 0 },
    playerId: null,
    gameActive: false,
    capturedAreas: []
  });
  const [connectionStatus, setConnectionStatus] = useState('Connecting to server...');
  const [gameLog, setGameLog] = useState([
    "Welcome to the Encirclement Game!",
    "Place your stones to surround opponent's stones and areas."
  ]);
  
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const gridSize = 19;
  const cellSize = 30;
  const stoneRadius = 13;
  const padding = 30;

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('http://192.168.56.67:5555');

    socketRef.current.on('connect', () => {
      setConnectionStatus('Connected to server');
      addLogEntry("Connected to server");
      socketRef.current.emit('joinGame');
    });

    socketRef.current.on('gameJoined', (data) => {
      setGameState(prev => ({
        ...prev,
        playerId: data.playerId,
        gameActive: data.gameState.gameActive,
        grid: data.gameState.grid,
        scores: data.gameState.scores,
        currentPlayer: data.gameState.currentPlayer
      }));
      addLogEntry(`You are player ${data.playerId}`);
    });

    socketRef.current.on('gameStart', (data) => {
      setGameState(prev => ({
        ...prev,
        gameActive: true,
        ...data.gameState
      }));
      addLogEntry("Game started!");
      setConnectionStatus('Game in progress');
    });

    socketRef.current.on('moveMade', (data) => {
      setGameState(prev => ({
        ...prev,
        ...data.gameState
      }));
      
      // Draw the new state
      drawBoard();
      
      if (data.capturedStones.length > 0) {
        addLogEntry(`Player ${data.move.player} captured ${data.capturedStones.length} stones!`);
      }
      
      if (data.enclosedAreas.length > 0) {
        const totalEnclosed = data.enclosedAreas.reduce((sum, area) => sum + area.length, 0);
        addLogEntry(`Player ${data.move.player} enclosed ${totalEnclosed} points!`);
        
        // Flash animation for enclosed area
        flashEnclosedArea(data.enclosedAreas, data.move.player);
      }
      
      addLogEntry(`Player ${data.gameState.currentPlayer === 1 ? 2 : 1}'s turn`);
    });

    socketRef.current.on('gameReset', (data) => {
      setGameState(prev => ({
        ...prev,
        ...data.gameState
      }));
      addLogEntry("Game reset!");
      drawBoard();
    });

    socketRef.current.on('playerDisconnected', () => {
      setGameState(prev => ({ ...prev, gameActive: false }));
      setConnectionStatus('Opponent disconnected');
      addLogEntry("Opponent disconnected!");
    });

    socketRef.current.on('disconnect', () => {
      setConnectionStatus('Disconnected from server');
    });

    socketRef.current.on('connect_error', () => {
      setConnectionStatus('Connection error');
    });

    socketRef.current.on('moveError', (data) => {
      addLogEntry(`Error: ${data.reason}`);
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

  const flashEnclosedArea = (enclosedAreas, player) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const color = player === 1 ? 'rgba(231, 76, 60, 0.5)' : 'rgba(52, 152, 219, 0.5)';
    
    // Draw flash effect
    enclosedAreas.forEach(area => {
      ctx.fillStyle = color;
      ctx.beginPath();
      
      area.forEach((point, i) => {
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
    });
    
    // Reset after animation
    setTimeout(() => {
      drawBoard();
    }, 500);
  };

  const drawBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = gridSize * cellSize + padding * 2;
    const height = gridSize * cellSize + padding * 2;
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < gridSize; i++) {
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(padding, padding + i * cellSize);
      ctx.lineTo(width - padding, padding + i * cellSize);
      ctx.stroke();
      
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(padding + i * cellSize, padding);
      ctx.lineTo(padding + i * cellSize, height - padding);
      ctx.stroke();
    }
    
    // Draw captured areas and prison walls
    gameState.capturedAreas.forEach(area => {
      // Draw enclosed area background
      ctx.fillStyle = area.player === 1 ? 'rgba(231, 76, 60, 0.2)' : 'rgba(52, 152, 219, 0.2)';
      ctx.beginPath();
      
      area.points.forEach((point, i) => {
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
      
      // Draw prison walls (thicker border)
      ctx.strokeStyle = area.player === 1 ? '#e74c3c' : '#3498db';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 3]); // Dashed line
      ctx.beginPath();
      
      // Find the bounding box of the enclosed area
      let minRow = gridSize, maxRow = 0, minCol = gridSize, maxCol = 0;
      area.points.forEach(point => {
        const row = Math.floor(point / gridSize);
        const col = point % gridSize;
        minRow = Math.min(minRow, row);
        maxRow = Math.max(maxRow, row);
        minCol = Math.min(minCol, col);
        maxCol = Math.max(maxCol, col);
      });
      
      // Draw prison rectangle
      const x1 = padding + minCol * cellSize;
      const y1 = padding + minRow * cellSize;
      const x2 = padding + maxCol * cellSize;
      const y2 = padding + maxRow * cellSize;
      
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x1, y2);
      ctx.lineTo(x1, y1);
      
      ctx.stroke();
      ctx.setLineDash([]); // Reset line style
      
      // Draw connections between stones (prison bars)
      ctx.strokeStyle = area.player === 1 ? '#e74c3c' : '#3498db';
      ctx.lineWidth = 2;
      
      area.stones.forEach(stone => {
        const row = Math.floor(stone / gridSize);
        const col = stone % gridSize;
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        directions.forEach(([dr, dc]) => {
          const adjRow = row + dr;
          const adjCol = col + dc;
          if (adjRow >= 0 && adjRow < gridSize && adjCol >= 0 && adjCol < gridSize) {
            const adjIndex = adjRow * gridSize + adjCol;
            if (gameState.grid[adjIndex] === area.player) {
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
    
    // Draw stones
    gameState.grid.forEach((player, index) => {
      if (player === 0) return;
      
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      const x = padding + col * cellSize;
      const y = padding + row * cellSize;
      
      // Stone shadow
      ctx.beginPath();
      ctx.arc(x, y, stoneRadius, 0, Math.PI * 2);
      ctx.fillStyle = player === 1 ? '#c0392b' : '#2980b9';
      ctx.fill();
      
      // Stone
      ctx.beginPath();
      ctx.arc(x, y - 2, stoneRadius, 0, Math.PI * 2);
      ctx.fillStyle = player === 1 ? '#e74c3c' : '#3498db';
      ctx.fill();
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
        <h1>🎯 Encirclement Game</h1>
        
        <div className={`connection-status ${
          connectionStatus.includes('Connected') ? 'connected' : 
          connectionStatus.includes('Error') || connectionStatus.includes('Disconnected') ? 'disconnected' : 
          'waiting'
        }`}>
          {connectionStatus}
        </div>

        <div className="player-info">
          <div className={`player ${gameState.currentPlayer === 1 ? 'active' : ''}`}>
            <div>Player 1</div>
            <div style={{ color: '#e74c3c' }}>●</div>
            <div className="score">{gameState.scores.player1}</div>
          </div>
          <div className={`player ${gameState.currentPlayer === 2 ? 'active' : ''}`}>
            <div>Player 2</div>
            <div style={{ color: '#3498db' }}>●</div>
            <div className="score">{gameState.scores.player2}</div>
          </div>
        </div>

        <div className="status">
          {!gameState.gameActive 
            ? 'Waiting for opponent...' 
            : gameState.playerId === gameState.currentPlayer 
              ? 'Your turn!' 
              : 'Waiting for opponent...'}
        </div>

        <button onClick={resetGame}>New Game</button>

        <h3>📋 Game Log</h3>
        <div className="game-log">
          {gameLog.map((entry, index) => (
            <div key={index} className="log-entry">{entry}</div>
          ))}
        </div>
      </div>

      <div className="game-board">
        <h2>Game Board</h2>
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
      </div>
    </div>
  );
}

export default App;
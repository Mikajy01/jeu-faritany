import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { SOCKET_URL } from '../constants/game';

export const useGameSocket = (onLog) => {
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
  const socketRef = useRef(null);
  const onLogRef = useRef(onLog);

  // Mettre à jour la ref à chaque render
  useEffect(() => {
    onLogRef.current = onLog;
  }, [onLog]);

  // Wrapper stable pour appeler onLog
  const stableOnLog = useCallback((message) => {
    onLogRef.current(message);
  }, []);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket", "polling"]
    });

    socketRef.current.on('connect', () => {
      setConnectionStatus('Connecté au serveur');
      stableOnLog("Connecté au serveur");
      socketRef.current.emit('joinGame');
    });

    const handleGameStateUpdate = (data, type) => {
      const gridMap = new Map();
      if (data.gameState.grid) {
        Object.entries(data.gameState.grid).forEach(([key, value]) => {
          if (value !== 0) gridMap.set(key, value);
        });
      }
      
      setGameState(prev => ({
        ...prev,
        playerId: data.playerId || prev.playerId,
        gameActive: data.gameState.gameActive,
        grid: gridMap,
        scores: data.gameState.scores,
        currentPlayer: data.gameState.currentPlayer,
        capturedAreas: data.gameState.capturedAreas || [],
        move: type === 'moveMade' ? data.move : prev.move
      }));

      if (type === 'gameJoined') stableOnLog(`Vous êtes le joueur ${data.playerId}`);
      if (type === 'gameStart') {
        stableOnLog("Jeu démarré !");
        setConnectionStatus('Partie en cours');
      }
      if (type === 'moveMade') {
        if (data.capturedStones && data.capturedStones.length > 0) {
          stableOnLog(`Le joueur ${data.move.player} a capturé ${data.capturedStones.length} pierres !`);
        }
        stableOnLog(`Tour du joueur ${data.gameState.currentPlayer === 1 ? 2 : 1}`);
      }
      if (type === 'gameReset') stableOnLog("Jeu réinitialisé !");
    };

    socketRef.current.on('gameJoined', (data) => handleGameStateUpdate(data, 'gameJoined'));
    socketRef.current.on('gameStart', (data) => handleGameStateUpdate(data, 'gameStart'));
    socketRef.current.on('moveMade', (data) => handleGameStateUpdate(data, 'moveMade'));
    socketRef.current.on('gameReset', (data) => handleGameStateUpdate(data, 'gameReset'));

    socketRef.current.on('playerDisconnected', () => {
      setGameState(prev => ({ ...prev, gameActive: false }));
      setConnectionStatus('Adversaire déconnecté');
      stableOnLog("Adversaire déconnecté !");
    });

    socketRef.current.on('disconnect', () => setConnectionStatus('Déconnecté du serveur'));
    socketRef.current.on('connect_error', () => setConnectionStatus('Erreur de connexion'));
    socketRef.current.on('moveError', (data) => stableOnLog(`Erreur: ${data.reason}`));

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [stableOnLog]); // Maintenant on dépend de stableOnLog qui ne change jamais

  return { gameState, connectionStatus, socketRef };
};
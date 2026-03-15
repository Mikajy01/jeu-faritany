import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { socketService } from "../infrastructure/services/SocketService";
import { apiService } from "../infrastructure/services/ApiService";
import { GameState } from "../domain/entities/GameState";
import { makeMoveUseCase } from "../application/use-cases/MakeMoveUseCase";
import { joinRoomUseCase } from "../application/use-cases/JoinRoomUseCase";
import { createRoomUseCase } from "../application/use-cases/CreateRoomUseCase";
import { createSocketGameUseCase } from "../application/use-cases/CreateSocketGameUseCase";
import { joinPublicRoomUseCase } from "../application/use-cases/JoinPublicRoomUseCase";
import { resignGameUseCase } from "../application/use-cases/ResignGameUseCase";
import { leaveRoomUseCase } from "../application/use-cases/LeaveRoomUseCase";
import { requestRematchUseCase } from "../application/use-cases/RequestRematchUseCase";
import { checkGameStatusUseCase } from "../application/use-cases/CheckGameStatusUseCase";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5555";

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [userId] = useState(() => {
    const savedId = localStorage.getItem("faritany_user_id");
    if (savedId) return savedId;
    const newId = Math.random().toString(36).substring(2, 15);
    localStorage.setItem("faritany_user_id", newId);
    return newId;
  });

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(
    "Connexion au serveur...",
  );
  const [gameState, setGameState] = useState(new GameState());
  const [gameType, setGameType] = useState(
    () => localStorage.getItem("faritany_current_game_type") || "public",
  );
  const [roomCode, setRoomCode] = useState(null);
  const [playerCount, setPlayerCount] = useState(1);
  const [lastError, setLastError] = useState(null);
  const [rematchRequestedBy, setRematchRequestedBy] = useState(null);
  const [publicRooms, setPublicRooms] = useState([]);
  const [gameLog, setGameLog] = useState([
    "Bienvenue dans le jeu faritany !",
    "Placez vos points pour entourer les points et zones adverses.",
  ]);

  const lastGameStateRef = useRef(null);
  const gameStateRef = useRef(gameState);

  // Synchroniser le Ref avec l'état pour les Use Cases
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const addLogEntry = useCallback((message) => {
    const timestamp = new Date().toLocaleTimeString();
    setGameLog((prev) => [...prev.slice(-50), `${timestamp}: ${message}`]);
  }, []);

  // --- INFRASTRUCTURE: API CALLS ---
  const fetchPublicRooms = useCallback(async () => {
    try {
      const data = await apiService.fetchPublicRooms();
      setPublicRooms(data);
    } catch (err) {
      console.error("❌ Erreur fetchPublicRooms:", err);
    }
  }, []);

  // --- INFRASTRUCTURE: SOCKET EVENTS ---
  useEffect(() => {
    socketService.connect(SOCKET_URL);

    const unsubscribes = [
      socketService.on("connect", () => {
        setIsConnected(true);
        setConnectionStatus("Connecté");
        fetchPublicRooms();
      }),
      socketService.on("disconnect", () => {
        setIsConnected(false);
        setConnectionStatus("Déconnecté du serveur");
      }),
      socketService.on("publicRoomsUpdate", (rooms) => setPublicRooms(rooms)),

      socketService.on("gameCreated", (data) => {
        console.log("🎮 Game created (provider):", data);
        if (data?.code) {
          setRoomCode(data.code);
          localStorage.setItem("faritany_current_game", data.code);
        }
        if (data?.type) {
          setGameType(data.type);
          localStorage.setItem("faritany_current_game_type", data.type);
        }
        if (data?.playerId) {
          setGameState((prev) => ({ ...prev, playerId: data.playerId }));
        }
        addLogEntry(
          `Salle ${data.type || "?"} créée avec le code: ${data.code}`,
        );
      }),

      socketService.on("createError", (data) => {
        console.error("❌ Create error (provider):", data?.reason);
        setLastError({ type: "create", reason: data?.reason });
        addLogEntry(`Erreur de création: ${data?.reason}`);
      }),

      socketService.on("joinError", (data) => {
        console.warn("❌ Join error (provider):", data?.reason);
        setLastError({ type: "join", reason: data?.reason });
        addLogEntry(`Erreur de jointure: ${data?.reason}`);
        localStorage.removeItem("faritany_current_game");
      }),

      socketService.on("gameStateUpdate", (data) => {
        setGameState((prev) => {
          const newState = GameState.fromServer(data);
          if (!newState.playerId && prev.playerId) {
            newState.playerId = prev.playerId;
          }
          if (data.gameState?.player1Online === undefined) {
            newState.player1Online = prev.player1Online;
          }
          if (data.gameState?.player2Online === undefined) {
            newState.player2Online = prev.player2Online;
          }
          return newState;
        });
      }),

      socketService.on("gameJoined", (data) => {
        if (data.gameState?.gameId) {
          setRoomCode(data.gameState.gameId);
          localStorage.setItem("faritany_current_game", data.gameState.gameId);
        }
        setGameState((prev) => {
          const newState = GameState.fromServer(data);
          if (!newState.playerId && prev.playerId) {
            newState.playerId = prev.playerId;
          }
          // Lors d'une jointure, on fait confiance aux données du serveur ou on garde l'existant
          if (data.gameState?.player1Online === undefined) {
            newState.player1Online = prev.player1Online;
          }
          if (data.gameState?.player2Online === undefined) {
            newState.player2Online = prev.player2Online;
          }
          return newState;
        });
        if (data.isReconnection) addLogEntry(`👋 Vous êtes de retour !`);
      }),

      socketService.on("gameStart", (data) => {
        setGameState((prev) => {
          const newState = GameState.fromServer(data);
          if (!newState.playerId && prev.playerId) {
            newState.playerId = prev.playerId;
          }
          // Au démarrage, tout le monde est censé être là
          return newState;
        });
        if (data.isReconnection) addLogEntry(`🎮 La partie reprend !`);
      }),

      socketService.on("moveMade", (data) => {
        setGameState((prev) => {
          const newState = GameState.fromServer(data);
          if (!newState.playerId && prev.playerId) {
            newState.playerId = prev.playerId;
          }
          // IMPORTANT: Préserver le statut "Hors ligne" pendant les mouvements
          if (data.gameState?.player1Online === undefined) {
            newState.player1Online = prev.player1Online;
          }
          if (data.gameState?.player2Online === undefined) {
            newState.player2Online = prev.player2Online;
          }
          return newState;
        });
      }),

      socketService.on("moveTimeout", (data) => {
        const playerNumber =
          data.timedOutPlayer || (data.gameState?.currentPlayer === 1 ? 2 : 1);
        addLogEntry(`⏰ Temps écoulé pour le joueur ${playerNumber} !`);
        setGameState((prev) => {
          const newState = GameState.fromServer(data);
          if (!newState.playerId && prev.playerId) {
            newState.playerId = prev.playerId;
          }
          if (data.gameState?.player1Online === undefined) {
            newState.player1Online = prev.player1Online;
          }
          if (data.gameState?.player2Online === undefined) {
            newState.player2Online = prev.player2Online;
          }
          return newState;
        });
      }),

      socketService.on("gameReset", (data) => {
        setRematchRequestedBy(null);
        setGameState((prev) => {
          const newState = GameState.fromServer(data);
          if (!newState.playerId && prev.playerId) {
            newState.playerId = prev.playerId;
          }
          if (data.gameState?.player1Online === undefined) {
            newState.player1Online = prev.player1Online;
          }
          if (data.gameState?.player2Online === undefined) {
            newState.player2Online = prev.player2Online;
          }
          return newState;
        });
        addLogEntry("🔄 La revanche commence ! Bonne chance.");
      }),

      socketService.on("rematchRequest", (data) => {
        setRematchRequestedBy(data.playerNumber);
        addLogEntry(`🔄 L'adversaire souhaite rejouer !`);
      }),

      socketService.on("gameOver", (data) => {
        localStorage.removeItem("faritany_current_game");
        localStorage.removeItem("faritany_current_game_type");
        setGameState((prev) => ({
          ...prev,
          gameActive: false,
          gameOver: data,
          scores: data.scores || prev.scores,
          playerId: prev.playerId, // Préserver le playerId
        }));
        addLogEntry(`🏁 ${data.message}`);
      }),

      socketService.on("playerDisconnected", (data) => {
        console.log("👤 Joueur déconnecté:", data);
        addLogEntry(`⚠️ ${data.message || "Un joueur s'est déconnecté."}`);
        setGameState((prev) => ({
          ...prev,
          // On garde gameActive tel quel, c'est le serveur qui gère l'activité
          player1Online: data.playerNumber === 1 ? false : prev.player1Online,
          player2Online: data.playerNumber === 2 ? false : prev.player2Online,
        }));
      }),

      socketService.on("playerJoined", (data) => {
        console.log("👤 Joueur rejoint:", data);
        addLogEntry(
          `👋 Un joueur a rejoint (${data.onlineCount || data.playerCount}/2)`,
        );
        setGameState((prev) => ({
          ...prev,
          // Si on est 2 en ligne, on s'assure que tout est à true
          player1Online: data.onlineCount === 2 ? true : prev.player1Online,
          player2Online: data.onlineCount === 2 ? true : prev.player2Online,
        }));
      }),

      socketService.on("moveError", (data) => {
        addLogEntry(`❌ Coup invalide: ${data.reason}`);
        if (lastGameStateRef.current) {
          setGameState(lastGameStateRef.current);
          lastGameStateRef.current = null;
        }
        setLastError({ type: "move", reason: data.reason });
      }),
    ];

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [fetchPublicRooms, addLogEntry]);

  // --- APPLICATION: USE CASES ---
  const makeOptimisticMove = useCallback(
    (x, y) => {
      return makeMoveUseCase(x, y, {
        gameState: gameStateRef.current,
        setGameState,
        socketService,
        lastGameStateRef,
      });
    },
    [setGameState],
  );

  const createRoom = useCallback((settings) => {
    return createRoomUseCase(settings, {
      createRoomApi: apiService.createRoom,
    });
  }, []);

  const createSocketGame = useCallback(
    (params) => {
      return createSocketGameUseCase(params, { socketService, addLogEntry });
    },
    [addLogEntry],
  );

  const joinPublicRoom = useCallback(
    (settings) => {
      return joinPublicRoomUseCase(settings, {
        userId,
        joinPublicRoomApi: apiService.joinPublicRoom,
      });
    },
    [userId],
  );

  const joinRoom = useCallback(
    async (gameId, joinCode = null) => {
      return joinRoomUseCase(gameId, joinCode, {
        userId,
        validateJoinApi: apiService.validateJoin,
        socketService,
      });
    },
    [userId],
  );

  const resignGame = useCallback(() => {
    return resignGameUseCase({ socketService, addLogEntry, gameState });
  }, [addLogEntry, gameState]);

  const leaveRoom = useCallback(() => {
    return leaveRoomUseCase({ socketService, setGameState, addLogEntry });
  }, [addLogEntry]);

  const requestRematch = useCallback(() => {
    return requestRematchUseCase({ socketService, addLogEntry });
  }, [addLogEntry]);

  const checkGameStatus = useCallback(() => {
    return checkGameStatusUseCase({
      getRoomInfoApi: apiService.getRoomInfo,
      validateJoinApi: apiService.validateJoin,
      userId,
    });
  }, [userId]);

  const value = {
    userId,
    isConnected,
    connectionStatus,
    gameState,
    gameType,
    gameLog,
    roomCode,
    playerCount,
    lastError,
    publicRooms,
    rematchRequestedBy,
    makeOptimisticMove,
    createRoom,
    createSocketGame,
    joinPublicRoom,
    joinRoom,
    getRoomInfo: apiService.getRoomInfo,
    addLogEntry,
    resignGame,
    leaveRoom,
    requestRematch,
    checkGameStatus,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGameContext = () => useContext(GameContext);

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5555";
const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [userId] = useState(() => {
    const savedId = localStorage.getItem("faritany_user_id");
    if (savedId) return savedId;
    const newId = Math.random().toString(36).substring(2, 15);
    localStorage.setItem("faritany_user_id", newId);
    return newId;
  });
  const [isConnected, setIsConnected] = useState(false); // ✨ Nouveau état
  const [connectionStatus, setConnectionStatus] = useState(
    "Connexion au serveur...",
  );
  const [gameType, setGameType] = useState("public");
  const [moveTimeLimit, setMoveTimeLimit] = useState(600);
  const [gameState, setGameState] = useState({
    grid: new Map(),
    currentPlayer: 1,
    gameId: null,
    code: null,
    scores: { player1: 0, player2: 0 },
    move: null,
    playerId: null,
    gameActive: false,
    gameOver: null,
    capturedAreas: [],
    player1Score: 0,
    player2Score: 0,
    player1Online: true, // ✨ Nouveau: statut en ligne P1
    player2Online: true, // ✨ Nouveau: statut en ligne P2
    timeControl: {
      moveTimeLimit: 0,
      gameDurationLimit: 0,
      gameMode: "TIME",
      targetScore: 20,
    },
    clock: {
      remainingMoveTime: 0,
      remainingGameTime: 0,
      gameStartTime: null,
      lastMoveTimestamp: null,
    },
  });
  const [roomCode, setRoomCode] = useState(null);
  const [playerCount, setPlayerCount] = useState(1);
  const [lastError, setLastError] = useState(null);
  const [rematchRequestedBy, setRematchRequestedBy] = useState(null); // ✨ Nouveau: qui demande la revanche
  const [gameLog, setGameLog] = useState([
    "Bienvenue dans le jeu faritany !",
    "Placez vos points pour entourer les points et zones adverses.",
  ]);

  // 🚀 OPTIMISTIC UPDATES: Sauvegarder l'état précédent pour rollback
  const lastGameStateRef = useRef(null);

  const addLogEntry = useCallback((message) => {
    const timestamp = new Date().toLocaleTimeString();
    setGameLog((prev) => [...prev.slice(-50), `${timestamp}: ${message}`]);
  }, []);

  // Initialiser la connexion socket UNE SEULE FOIS
  useEffect(() => {
    if (socketRef.current) return;

    console.log("🔌 Initialisation de la connexion Socket.IO...");

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      setIsConnected(true);
      setConnectionStatus("Connecté");
      console.log("✅ Socket connecté");
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket déconnecté:", reason);
      setConnectionStatus("Déconnecté du serveur");
      setIsConnected(false); // ✨ Socket déconnecté
    });

    socket.on("connect_error", (error) => {
      console.error("⚠️ Erreur de connexion:", error);
      setConnectionStatus("Erreur de connexion");
      setIsConnected(false);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("🔄 Reconnexion réussie après", attemptNumber, "tentatives");
      setConnectionStatus("Reconnecté au serveur");
      setIsConnected(true);
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log("🔄 Tentative de reconnexion", attemptNumber);
      setConnectionStatus(`Reconnexion... (${attemptNumber})`);
    });

    socket.on("reconnect_failed", () => {
      console.error("💔 Échec de reconnexion");
      setConnectionStatus("Impossible de se reconnecter");
      setIsConnected(false);
    });

    const handleGameStateUpdate = (data, type) => {
      console.log(`📩 Événement [${type}] reçu:`, data);

      setGameState((prev) => {
        // Déterminer le nouveau playerId (priorité à la donnée reçue, sinon conserver l'existant)
        const newPlayerId = data.playerId || prev.playerId;

        if (newPlayerId) {
          console.log(`👤 Mon PlayerID est: ${newPlayerId}`);
        }

        const gridMap = new Map();
        if (data.gameState && data.gameState.grid) {
          Object.entries(data.gameState.grid).forEach(([key, value]) => {
            if (value !== 0) gridMap.set(key, value);
          });
        }

        if (type === "gameStart" || type === "gameJoined") {
          setGameType(data.gameState?.gameType || "public");
          setMoveTimeLimit(data.gameState?.timeControl?.moveTimeLimit || 60);
        }

        const newState = {
          ...prev,
          playerId: newPlayerId,
          gameId: data.gameState?.gameId || data.code || prev.gameId,
          gameActive: data.gameState?.gameActive ?? prev.gameActive,
          gameOver:
            data.gameState?.gameActive === false && prev.gameActive
              ? prev.gameOver
              : data.gameState?.gameActive
                ? null
                : prev.gameOver,
          grid: data.gameState?.grid ? gridMap : prev.grid,
          scores: data.gameState?.scores || prev.scores,
          player1Score: data.gameState?.scores?.player1 || prev.player1Score,
          player2Score: data.gameState?.scores?.player2 || prev.player2Score,
          currentPlayer: data.gameState?.currentPlayer || prev.currentPlayer,
          capturedAreas: data.gameState?.capturedAreas || prev.capturedAreas,
          timeControl: data.gameState?.timeControl || prev.timeControl,
          clock: data.gameState?.clock || prev.clock,
          move: type === "moveMade" ? data.move : prev.move,
          player1Online: true,
          player2Online: true,
        };

        return newState;
      });

      // Mettre à jour le nombre de joueurs si fourni
      if (data.playerCount || data.gameState?.playerCount) {
        setPlayerCount(data.playerCount || data.gameState.playerCount);
      }
    };

    socket.on("gameJoined", (data) => {
      if (data.gameState?.gameId) {
        localStorage.setItem("faritany_current_game", data.gameState.gameId);
      }
      handleGameStateUpdate(data, "gameJoined");
      // Si c'est une reconnexion, on peut logger
      if (data.isReconnection) {
        addLogEntry(`👋 Vous êtes de retour !`);
      }
    });
    socket.on("gameStart", (data) => {
      handleGameStateUpdate(data, "gameStart");
      if (data.isReconnection) {
        addLogEntry(`🎮 La partie reprend !`);
      }
    });
    socket.on("moveMade", (data) => handleGameStateUpdate(data, "moveMade"));
    socket.on("gameReset", (data) => {
      console.log("🔄 Revanche acceptée, réinitialisation...");
      setGameState((prev) => ({
        ...prev,
        gameOver: null,
        gameActive: true, // ✨ Forcer l'activation immédiate
      }));
      setRematchRequestedBy(null);
      handleGameStateUpdate(data, "gameReset");
      addLogEntry("🔄 La revanche commence ! Bonne chance.");
    });

    socket.on("rematchRequest", (data) => {
      console.log("🔄 Demande de revanche reçue:", data);
      setRematchRequestedBy(data.playerNumber);
      // On ne vérifie pas playerId ici pour le log, car on l'a dans le state
      addLogEntry(`🔄 L'adversaire souhaite rejouer !`);
    });
    socket.on("moveTimeout", (data) =>
      handleGameStateUpdate(data, "moveTimeout"),
    );

    // ❌ Suppression de l'écouteur timeUpdate (on synchronise via les actions)

    socket.on("gameOver", (data) => {
      console.log("🏁 Partie terminée:", data);
      localStorage.removeItem("faritany_current_game");
      setGameState((prev) => ({
        ...prev,
        gameActive: false,
        gameOver: data,
        scores: data.scores || prev.scores,
        player1Score: data.scores?.player1 || prev.player1Score,
        player2Score: data.scores?.player2 || prev.player2Score,
      }));
      addLogEntry(`🏁 ${data.message}`);
    });

    socket.on("playerDisconnected", (data) => {
      addLogEntry(`⚠️ ${data.message}`);
      setGameState((prev) => ({
        ...prev,
        gameActive: false,
        player1Online: data.playerNumber === 1 ? false : prev.player1Online,
        player2Online: data.playerNumber === 2 ? false : prev.player2Online,
      }));
    });

    // Événements liés à la création/join d'une room (UI)
    socket.on("gameCreated", (data) => {
      console.log("🎮 Game created (provider):", data);
      if (data?.code) {
        setRoomCode(data.code);
        localStorage.setItem("faritany_current_game", data.code);
      }
      if (data?.type) setGameType(data.type);
      if (data?.playerId)
        setGameState((prev) => ({ ...prev, playerId: data.playerId }));
      addLogEntry(`Salle ${data.type || "?"} créée avec le code: ${data.code}`);
    });

    socket.on("createError", (data) => {
      console.error("❌ Create error (provider):", data?.reason);
      setLastError({ type: "create", reason: data?.reason });
      addLogEntry(`Erreur de création: ${data?.reason}`);
    });

    socket.on("joinError", (data) => {
      console.warn("❌ Impossible de rejoindre:", data.reason);
      localStorage.removeItem("faritany_current_game");
    });

    socket.on("moveError", (data) => {
      console.error("❌ Move error:", data.reason);
      addLogEntry(`❌ Coup invalide: ${data.reason}`);

      // 🚀 ROLLBACK: Restaurer l'état précédent si optimistic update a échoué
      if (lastGameStateRef.current) {
        console.log("🔄 Rollback du coup optimiste");
        setGameState(lastGameStateRef.current);
        lastGameStateRef.current = null;
      }

      setLastError({ type: "move", reason: data.reason });
    });

    socketRef.current = socket;

    // Ne nettoyer que si le provider est vraiment démonté
    return () => {
      console.log("🧹 Cleanup du GameProvider");
      // Optionnel: déconnecter proprement si vous quittez l'app
      // socket.disconnect();
    };
  }, []);

  // ⏱️ GESTION LOCALE DU TIMER (remainingMoveTime)
  // Décrémenter le temps localement pour une UI fluide
  useEffect(() => {
    let timer;
    if (gameState.gameActive && !gameState.gameOver) {
      timer = setInterval(() => {
        setGameState((prev) => {
          if (prev.clock && prev.clock.remainingMoveTime > 0) {
            return {
              ...prev,
              clock: {
                ...prev.clock,
                remainingMoveTime: Math.max(
                  0,
                  prev.clock.remainingMoveTime - 1,
                ),
              },
            };
          }
          return prev;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState.gameActive, gameState.gameOver]);

  // Effet séparé pour les logs (sans impacter le socket)
  useEffect(() => {
    if (connectionStatus === "Connecté au serveur") {
      addLogEntry("Connecté au serveur");
    } else if (connectionStatus === "Déconnecté du serveur") {
      addLogEntry("Déconnecté du serveur");
    } else if (connectionStatus === "Erreur de connexion") {
      addLogEntry("Erreur de connexion");
    } else if (connectionStatus === "Adversaire déconnecté") {
      addLogEntry("Adversaire déconnecté !");
    } else if (connectionStatus.startsWith("Reconnexion")) {
      addLogEntry(connectionStatus);
    }
  }, [connectionStatus, addLogEntry]);

  /**
   * 🚀 OPTIMISTIC UPDATES: Place une pierre immédiatement sur le plateau local
   * sans attendre la confirmation du serveur
   */
  const makeOptimisticMove = useCallback(
    (x, y) => {
      let success = false;

      setGameState((prev) => {
        // Vérifier que c'est le tour du joueur
        if (prev.playerId !== prev.currentPlayer) {
          console.warn("❌ Ce n'est pas votre tour");
          return prev;
        }

        // Vérifier que la position est vide
        const coordKey = `${x},${y}`;
        if (prev.grid.has(coordKey)) {
          console.warn("❌ Position déjà occupée");
          return prev;
        }

        // 💾 Sauvegarder l'état actuel pour rollback
        lastGameStateRef.current = {
          ...prev,
          grid: new Map(prev.grid),
        };

        const newGrid = new Map(prev.grid);
        newGrid.set(coordKey, prev.currentPlayer);

        success = true;
        return {
          ...prev,
          grid: newGrid,
          move: { x, y, player: prev.currentPlayer },
        };
      });

      if (success) {
        // ✅ Envoyer au serveur (non-bloquant)
        socketRef.current?.emit("makeMove", { x, y });
        console.log(`✅ Coup optimiste: (${x}, ${y}) envoyé`);
      }

      return success;
    },
    [socketRef],
  );

  const createGame = useCallback(
    (params) => {
      socketRef.current?.emit("createGame", params);
    },
    [socketRef],
  );

  const joinGame = useCallback(
    (code) => {
      const joinCode = localStorage.getItem(`faritany_joincode_${code}`);
      socketRef.current?.emit("joinGame", { code, userId, joinCode });
    },
    [socketRef, userId],
  );

  const joinPublic = useCallback(
    (params) => {
      socketRef.current?.emit("joinPublic", { ...params, userId });
    },
    [socketRef, userId],
  );

  const resignGame = useCallback(() => {
    if (socketRef.current && isConnected && gameState.gameActive) {
      socketRef.current.emit("resignGame");
      addLogEntry("Vous avez abandonné la partie.");
    }
  }, [socketRef, isConnected, gameState.gameActive, addLogEntry]);

  const requestRematch = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("resetGame");
      setRematchRequestedBy(gameState.playerId);
      addLogEntry("Vous avez proposé une revanche.");
    }
  }, [socketRef, isConnected, gameState.playerId, addLogEntry]);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5555";

  // ✨ Nouvelle fonction pour créer une salle via REST
  const createRoom = useCallback(
    async (settings) => {
      try {
        const response = await fetch(`${API_URL}/game/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        });
        if (!response.ok) throw new Error("Erreur lors de la création");
        const data = await response.json();
        console.log("✅ Salle créée via REST:", data);
        return data; // { gameId, type, joinCode }
      } catch (err) {
        console.error("❌ Erreur creation room:", err);
        throw err;
      }
    },
    [API_URL],
  );

  // ✨ Nouvelle fonction pour rejoindre une partie publique via REST
  const joinPublicRoom = useCallback(
    async (settings) => {
      try {
        const response = await fetch(`${API_URL}/game/join-public`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        });
        if (!response.ok) throw new Error("Erreur matchmaking");
        const data = await response.json();
        console.log("✅ Matchmaking via REST:", data);
        return data; // { gameId, gameType, isNew, playerNumber }
      } catch (err) {
        console.error("❌ Erreur matchmaking:", err);
        throw err;
      }
    },
    [API_URL],
  );

  // ✨ Nouvelle fonction pour valider une jointure via REST
  const validateJoin = useCallback(
    async (gameId, joinCode = null) => {
      try {
        const response = await fetch(`${API_URL}/game/validate-join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId, userId, joinCode }),
        });
        if (!response.ok) throw new Error("Erreur validation jointure");
        const data = await response.json();
        if (data.success && data.joinCode) {
          // Stocker le joinCode pour reconnexion future
          localStorage.setItem(`faritany_joincode_${gameId}`, data.joinCode);
        }
        return data; // { success, gameId, gameType, playerNumber, isRejoin, joinCode }
      } catch (err) {
        console.error("❌ Erreur validation join:", err);
        throw err;
      }
    },
    [API_URL, userId],
  );

  // ✨ Nouvelle fonction pour récupérer les infos d'une salle via REST
  const getRoomInfo = useCallback(
    async (gameId) => {
      try {
        const response = await fetch(`${API_URL}/game/room/${gameId}`);
        if (!response.ok) {
          if (response.status === 404) throw new Error("Salle introuvable.");
          throw new Error("Erreur lors de la récupération des infos.");
        }
        return await response.json(); // { gameId, gameType, playerCount, gameActive }
      } catch (err) {
        console.error("❌ Erreur getRoomInfo:", err);
        throw err;
      }
    },
    [API_URL],
  );

  // ✨ Nouvelle fonction pour vérifier le statut d'une partie et se reconnecter si besoin
  const checkGameStatus = useCallback(async () => {
    const savedGameId = localStorage.getItem("faritany_current_game");
    if (!savedGameId) return null;

    try {
      console.log(
        "🔍 Vérification du statut de la partie sauvegardée:",
        savedGameId,
      );
      const room = await getRoomInfo(savedGameId);

      // Si la partie est terminée, on nettoie
      if (room.gameOver) {
        console.log("🏁 La partie sauvegardée est terminée.");
        localStorage.removeItem("faritany_current_game");
        return null;
      }

      // Valider si on peut toujours rejoindre (rejoin)
      const joinCode = localStorage.getItem(`faritany_joincode_${savedGameId}`);
      const validation = await validateJoin(savedGameId, joinCode);

      if (!validation.success) {
        console.warn(
          "⚠️ Impossible de se reconnecter à la partie:",
          validation.error,
        );
        localStorage.removeItem("faritany_current_game");
        return null;
      }

      return {
        gameId: savedGameId,
        gameActive: validation.gameActive,
        playerNumber: validation.playerNumber,
        isRejoin: validation.isRejoin,
      };
    } catch (err) {
      console.error("❌ Erreur lors de la vérification du statut:", err);
      // Ne pas supprimer le localStorage immédiatement en cas d'erreur réseau
      return null;
    }
  }, [getRoomInfo, validateJoin]);

  // ✨ Nouvelle fonction unifiée pour rejoindre une salle (REST puis Socket)
  const joinRoom = useCallback(
    async (gameId, joinCode = null) => {
      try {
        const validation = await validateJoin(gameId, joinCode);

        if (!validation.success) {
          throw new Error(
            validation.error || "Impossible de rejoindre la salle.",
          );
        }

        // Si validation OK, on lance la connexion socket
        if (socketRef.current && isConnected) {
          socketRef.current.emit("joinGame", {
            code: gameId,
            userId,
            joinCode: validation.joinCode || joinCode,
          });
          localStorage.setItem("faritany_current_game", gameId);
          return validation;
        } else {
          throw new Error("Connexion au serveur perdue.");
        }
      } catch (err) {
        console.error("❌ Erreur joinRoom:", err);
        throw err;
      }
    },
    [validateJoin, socketRef, isConnected, userId],
  );

  const value = {
    socketRef,
    userId,
    isConnected, // ✨ Exposer le statut de connexion
    connectionStatus,
    gameState,
    setGameState,
    makeOptimisticMove, // 🚀 Nouvelle fonction pour optimistic updates
    moveTimeLimit,
    gameType,
    gameLog,
    addLogEntry,
    roomCode,
    playerCount,
    lastError,
    createRoom,
    joinPublicRoom,
    validateJoin,
    joinRoom, // ✨ Nouvelle fonction
    getRoomInfo,
    checkGameStatus,
    resignGame,
    requestRematch, // ✨ Nouvelle fonction
    rematchRequestedBy, // ✨ Nouvel état
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGameContext must be used within GameProvider");
  }
  return context;
};

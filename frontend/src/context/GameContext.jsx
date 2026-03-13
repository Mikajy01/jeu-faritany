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

      // ✨ Tentative de reconnexion automatique via le code de la salle
      const savedGameId = localStorage.getItem("faritany_current_game");
      if (savedGameId) {
        console.log(
          "🔄 Tentative de rejoindre la partie sauvegardée:",
          savedGameId,
        );
        socket.emit("joinGame", { code: savedGameId });
      }
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
      console.log(`📩 Événement reçu: ${type}`, data);
      const gridMap = new Map();
      if (data.gameState && data.gameState.grid) {
        Object.entries(data.gameState.grid).forEach(([key, value]) => {
          if (value !== 0) gridMap.set(key, value);
        });
      }

      if (type === "gameStart" || type === "gameJoined") {
        setGameType(data.gameState.gameType || "public");
        setMoveTimeLimit(data.gameState.timeControl?.moveTimeLimit || 60);
      }

      setGameState((prev) => ({
        ...prev,
        playerId: data.playerId || prev.playerId,
        gameId: data.gameState?.gameId || data.code || prev.gameId, // ✨ Mise à jour de l'ID
        gameActive: data.gameState?.gameActive ?? prev.gameActive,
        gameOver:
          data.gameState?.gameActive === false && prev.gameActive
            ? prev.gameOver
            : data.gameState?.gameActive
              ? null
              : prev.gameOver,
        grid: gridMap,
        scores: data.gameState?.scores || prev.scores,
        player1Score: data.gameState?.scores?.player1 || prev.player1Score,
        player2Score: data.gameState?.scores?.player2 || prev.player2Score,
        currentPlayer: data.gameState?.currentPlayer || prev.currentPlayer,
        capturedAreas: data.gameState?.capturedAreas || prev.capturedAreas,
        timeControl: data.gameState?.timeControl || prev.timeControl,
        clock: data.gameState?.clock || prev.clock,
        move: type === "moveMade" ? data.move : prev.move,
        // ✨ On réinitialise le statut online quand on reçoit un état complet
        player1Online: true,
        player2Online: true,
      }));
      // Mettre à jour le nombre de joueurs si fourni
      setPlayerCount(
        (prev) => data.playerCount || data.gameState?.playerCount || prev,
      );
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
      setGameState((prev) => ({ ...prev, gameOver: null }));
      handleGameStateUpdate(data, "gameReset");
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
      // Vérifier que c'est le tour du joueur
      if (gameState.playerId !== gameState.currentPlayer) {
        console.warn("❌ Ce n'est pas votre tour");
        return false;
      }

      // Vérifier que la position est vide
      const coordKey = `${x},${y}`;
      if (gameState.grid.has(coordKey)) {
        console.warn("❌ Position déjà occupée");
        return false;
      }

      // 💾 Sauvegarder l'état actuel pour rollback
      lastGameStateRef.current = {
        ...gameState,
        grid: new Map(gameState.grid),
      };

      // 🎯 Placer la pierre IMMÉDIATEMENT (optimistic)
      setGameState((prev) => {
        const newGrid = new Map(prev.grid);
        newGrid.set(coordKey, gameState.currentPlayer);

        return {
          ...prev,
          grid: newGrid,
          move: { x, y, player: gameState.currentPlayer },
          // Le serveur confirmera les scores et le changement de joueur
        };
      });

      // ✅ Envoyer au serveur (non-bloquant)
      socketRef.current?.emit("makeMove", { x, y });

      console.log(`✅ Coup optimiste: (${x}, ${y}) placé immédiatement`);
      return true;
    },
    [gameState, socketRef],
  );

  const createGame = useCallback(
    (params) => {
      socketRef.current?.emit("createGame", params);
    },
    [socketRef],
  );

  const joinGame = useCallback(
    (code) => {
      socketRef.current?.emit("joinGame", { code });
    },
    [socketRef],
  );

  const joinPublic = useCallback(
    (params) => {
      socketRef.current?.emit("joinPublic", params);
    },
    [socketRef],
  );

  const value = {
    socketRef,
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
    createGame,
    joinGame,
    joinPublic,
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

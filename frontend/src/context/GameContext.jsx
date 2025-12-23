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
    "Connexion au serveur..."
  );
  const [gameType, setGameType] = useState("public");
  const [moveTimeLimit, setMoveTimeLimit] = useState(600);

  const [gameState, setGameState] = useState({
    grid: new Map(),
    currentPlayer: 1,
    code: null,
    scores: { player1: 0, player2: 0 },
    move: null,
    playerId: null,
    gameActive: false,
    capturedAreas: [],
    player1Score: 0,
    player2Score: 0,
  });
  const [gameLog, setGameLog] = useState([
    "Bienvenue dans le jeu faritany !",
    "Placez vos points pour entourer les points et zones adverses.",
  ]);

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
      console.log("✅ Socket connecté avec ID:", socket.id);
      setConnectionStatus("Connecté au serveur");
      setIsConnected(true); // ✨ Socket prêt !
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
        gameActive: data.gameState?.gameActive ?? prev.gameActive,
        grid: gridMap,
        scores: data.gameState?.scores || prev.scores,
        player1Score: data.gameState?.scores?.player1 || prev.player1Score,
        player2Score: data.gameState?.scores?.player2 || prev.player2Score,
        currentPlayer: data.gameState?.currentPlayer || prev.currentPlayer,
        capturedAreas: data.gameState?.capturedAreas || prev.capturedAreas,
        move: type === "moveMade" ? data.move : prev.move,
      }));
    };

    socket.on("gameJoined", (data) =>
      handleGameStateUpdate(data, "gameJoined")
    );
    socket.on("gameStart", (data) => handleGameStateUpdate(data, "gameStart"));
    socket.on("moveMade", (data) => handleGameStateUpdate(data, "moveMade"));
    socket.on("gameReset", (data) => handleGameStateUpdate(data, "gameReset"));
    socket.on("moveTimeout", (data) => handleGameStateUpdate(data, "gameReset"));


    socket.on("playerDisconnected", () => {
      console.log("👤 Adversaire déconnecté");
      setGameState((prev) => ({ ...prev, gameActive: false }));
      setConnectionStatus("Adversaire déconnecté");
    });

    socket.on("moveError", (data) => {
      console.error("❌ Move error:", data.reason);
    });

    socketRef.current = socket;

    // Ne nettoyer que si le provider est vraiment démonté
    return () => {
      console.log("🧹 Cleanup du GameProvider");
      // Optionnel: déconnecter proprement si vous quittez l'app
      // socket.disconnect();
    };
  }, []);

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

  const value = {
    socketRef,
    isConnected, // ✨ Exposer le statut de connexion
    connectionStatus,
    gameState,
    setGameState,
    moveTimeLimit,
    gameType,
    gameLog,
    addLogEntry,
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
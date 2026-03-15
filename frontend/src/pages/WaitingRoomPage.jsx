import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGameContext } from "../context/GameContext";
import { WaitingRoom } from "../components/WaitingRoom";
import { Loader2 } from "lucide-react";

export default function WaitingRoomPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isConnected,
    addLogEntry,
    lastError,
    gameState,
    gameType: ctxGameType,
    playerCount: contextPlayerCount,
    createRoom,
    joinPublicRoom,
    joinRoom,
    leaveRoom,
  } = useGameContext();

  const [roomCode, setRoomCode] = useState(location.state?.roomCode || null);
  const [joinCode, setJoinCode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const initializationPromise = useRef(null);

  // 📡 Créer/Rejoindre la room au chargement via REST
  useEffect(() => {
    let isMounted = true;
    const gameType = location.state?.gameType;
    const settings = location.state?.settings || {};

    const initRoom = async () => {
      // 1. Redirection si pas d'infos de création (ex: refresh page)
      if (!gameType) {
        if (isMounted) {
          console.warn("⚠️ Pas de gameType trouvé dans l'état de navigation");
          navigate("/");
        }
        return;
      }

      // 2. Attendre que le socket soit prêt
      if (!isConnected) return;

      // 3. Utiliser une promesse partagée pour éviter la double création (StrictMode)
      if (!initializationPromise.current) {
        initializationPromise.current = (async () => {
          console.log(`🚀 Initialisation de la salle (${gameType})...`);
          if (gameType === "public") {
            return await joinPublicRoom(settings);
          } else {
            return await createRoom({ type: gameType, ...settings });
          }
        })();
      }

      try {
        const data = await initializationPromise.current;

        if (isMounted) {
          console.log("✅ Salle initialisée:", data.gameId);
          setRoomCode(data.gameId);
          if (data.joinCode) setJoinCode(data.joinCode);

          // Utiliser la fonction unifiée pour finaliser la connexion socket
          await joinRoom(data.gameId, data.joinCode);

          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("❌ Erreur initRoom:", err);
          initializationPromise.current = null; // Autoriser une nouvelle tentative
          addLogEntry("Erreur lors de l'initialisation de la salle");
          navigate("/");
        }
      }
    };

    if (!roomCode) {
      initRoom();
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [
    location.state,
    isConnected,
    createRoom,
    joinPublicRoom,
    addLogEntry,
    navigate,
    roomCode,
    joinRoom,
  ]);

  // 📡 Écouter les mises à jour de la room (via WebSocket)
  useEffect(() => {
    if (!isConnected) return;
    // playerJoined est déjà loggé dans GameContext via handleGameStateUpdate ou similaire
    // Mais on peut garder une écoute spécifique si besoin
  }, [isConnected, addLogEntry]);

  // Si la partie démarre (gérée par le provider), naviguer vers le jeu
  useEffect(() => {
    if (gameState?.gameActive) {
      navigate("/game");
    }
  }, [gameState?.gameActive, navigate]);

  // Si erreur de join, revenir au menu
  useEffect(() => {
    if (lastError?.type === "join") {
      setRoomCode(null);
      setTimeout(() => navigate("/"), 2000);
    }
  }, [lastError, navigate]);

  const handleCancel = useCallback(() => {
    console.log("🚫 Annulation de la partie");
    leaveRoom(); // ✨ Nettoyage centralisé
    setRoomCode(null);
    navigate("/");
  }, [leaveRoom, navigate]);

  const handleStartGame = useCallback(() => {
    console.log("⏳ En attente du second joueur...");
    addLogEntry("En attente du second joueur...");
  }, [addLogEntry]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[var(--accent-fuchsia)] animate-spin" />
      </div>
    );
  }

  return (
    <WaitingRoom
      roomCode={roomCode}
      joinCode={joinCode || gameState?.joinCode}
      gameType={gameState?.gameType || location.state?.gameType}
      playerCount={contextPlayerCount} // ✨ Utiliser le contexte
      onCancel={handleCancel}
      onStartGame={handleStartGame}
    />
  );
}

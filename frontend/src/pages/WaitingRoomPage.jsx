import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGameContext } from "../context/GameContext";
import { WaitingRoom } from "../components/WaitingRoom";

export default function WaitingRoomPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { socketRef, isConnected, addLogEntry } = useGameContext();
  const [roomCode, setRoomCode] = useState(location.state?.roomCode || null);
  const [playerCount, setPlayerCount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Attendre que le socket soit connecté et créer la room
  useEffect(() => {
    if (isConnected) {
      setIsLoading(false);

      const gameType = location.state?.gameType;
      if (gameType && socketRef.current) {
        console.log("🎮 Création de la room:", gameType);
        socketRef.current.emit("createGame", { type: gameType });
        addLogEntry(`Création d'une partie ${gameType}...`);
      }

      // Si on arrive avec un code pour rejoindre
      const codeToJoin = location.state?.codeToJoin;
      if (codeToJoin && socketRef.current) {
        console.log("🎯 Tentative de rejoindre la room:", codeToJoin);
        socketRef.current.emit("joinGame", { code: codeToJoin });
        addLogEntry(`Tentative de rejoindre la partie ${codeToJoin}...`);
      }
    } else {
      setIsLoading(true);
    }
  }, [isConnected, location.state, socketRef, addLogEntry]);

  // Écouter les événements de la salle d'attente
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const socket = socketRef.current;

    const handleGameCreated = ({ code, type, playerId }) => {
      console.log("🎮 Game created:", { code, type, playerId });
      if (type === "AI") {
        addLogEntry("Partie contre l'IA créée");
        navigate("/game");
      } else {
        setRoomCode(code);
        addLogEntry(`Salle ${type} créée avec le code: ${code}`);
      }
    };

    const handleCreateError = ({ reason }) => {
      console.error("❌ Create error:", reason);
      addLogEntry(`Erreur de création: ${reason}`);
    };

    const handleGameJoined = ({ playerId, playerCount: count }) => {
      console.log("👥 Game joined:", { playerId, playerCount: count });
      setPlayerCount(count);
      if (count === 2) {
        addLogEntry("Un adversaire a rejoint la partie !");
      }
    };

    const handleJoinError = ({ reason }) => {
      console.error("❌ Join error:", reason);
      addLogEntry(`Erreur: ${reason}`);
      setRoomCode(null);
      // Retour au menu en cas d'erreur
      setTimeout(() => navigate("/"), 2000);
    };

    const handleGameStart = () => {
      console.log("🚀 Game starting!");
      addLogEntry("La partie commence !");
      navigate("/game");
    };

    // Attacher les listeners
    socket.on("gameCreated", handleGameCreated);
    socket.on("createError", handleCreateError);
    socket.on("gameJoined", handleGameJoined);
    socket.on("joinError", handleJoinError);
    socket.on("gameStart", handleGameStart);

    // Cleanup: détacher les listeners
    return () => {
      console.log("🧹 Nettoyage des listeners de WaitingRoom");
      socket.off("gameCreated", handleGameCreated);
      socket.off("createError", handleCreateError);
      socket.off("gameJoined", handleGameJoined);
      socket.off("joinError", handleJoinError);
      socket.off("gameStart", handleGameStart);
    };
  }, [isConnected, socketRef, addLogEntry, navigate]);

  const handleCancel = useCallback(() => {
    console.log("🚫 Annulation de la partie");
    setRoomCode(null);
    setPlayerCount(1);
    addLogEntry("Retour au menu principal");
    navigate("/");
  }, [addLogEntry, navigate]);

  const handleStartGame = useCallback(() => {
    console.log("⏳ En attente du second joueur...");
    addLogEntry("En attente du second joueur...");
  }, [addLogEntry]);

  // 🔗 Fonction pour partager le lien
  const handleShareLink = useCallback(() => {
    if (!roomCode) return;

    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const shareUrl = `${appUrl}/join/${roomCode}`;

    // Copier dans le presse-papier
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          addLogEntry(`✅ Lien copié: ${shareUrl}`);
          alert("Lien copié dans le presse-papier !");
        })
        .catch((err) => {
          console.error("Erreur copie presse-papier:", err);
          // Fallback: afficher le lien
          prompt("Copiez ce lien:", shareUrl);
        });
    } else {
      // Fallback pour les navigateurs anciens
      prompt("Copiez ce lien:", shareUrl);
    }
  }, [roomCode, addLogEntry]);

  // Afficher un loader pendant la connexion
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          gap: "1rem",
        }}
      >
        <div style={{ fontSize: "1.5rem" }}>⏳</div>
        <div>Connexion au serveur...</div>
      </div>
    );
  }

  return (
    <WaitingRoom
      roomCode={roomCode}
      onCancel={handleCancel}
      onStartGame={handleStartGame}
      onShareLink={handleShareLink} // ✨ Nouvelle prop
      playerCount={playerCount}
    />
  );
}
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGameContext } from "../context/GameContext";
import { WaitingRoom } from "../components/WaitingRoom";
import LoadingSpinner from "../components/LoadingSpinner";

export default function AiRoomPage() {
  const navigate = useNavigate();
  const { socketRef, isConnected, addLogEntry } = useGameContext();
  const [roomCode, setRoomCode] = useState(location.state?.roomCode || null);
  const [playerCount, setPlayerCount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Attendre que le socket soit connecté et créer la room
  useEffect(() => {
    if (isConnected) {
      setIsLoading(false);

      if (socketRef.current) {
        console.log("🎮 Création de la room: AI");
        socketRef.current.emit("createGame", { type: "AI" });
        addLogEntry(`Création d'une partie ${"AI"}...`);
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
        navigate("/game");
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
    <div className="">
        <h1>AI ROOM</h1>
        <LoadingSpinner />
    </div>
  );
}

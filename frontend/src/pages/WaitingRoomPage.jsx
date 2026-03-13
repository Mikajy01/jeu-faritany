import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGameContext } from "../context/GameContext";
import { WaitingRoom } from "../components/WaitingRoom";
import { Loader2 } from "lucide-react";

export default function WaitingRoomPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    socketRef,
    isConnected,
    addLogEntry,
    roomCode: ctxRoomCode,
    playerCount: ctxPlayerCount,
    lastError,
    gameState,
    gameType: ctxGameType,
    userId, // ✨ Récupérer l'ID persistant
    joinPublic,
    createGame,
  } = useGameContext();
  const [roomCode, setRoomCode] = useState(location.state?.roomCode || null);
  const [playerCount, setPlayerCount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Attendre que le socket soit connecté et créer la room
  useEffect(() => {
    if (isConnected) {
      setIsLoading(false);

      const gameType = location.state?.gameType;
      const settings = location.state?.settings || {};

      if (gameType && socketRef.current) {
        if (gameType === "public") {
          console.log("🌍 Recherche d'une partie publique:", settings);
          joinPublic(settings);
          addLogEntry(`Recherche d'une partie publique...`);
        } else {
          console.log("🎮 Création de la room:", gameType, settings);
          createGame({
            type: gameType,
            userId, // ✨ Envoyer l'ID
            ...settings,
          });
          addLogEntry(`Création d'une partie ${gameType}...`);
        }
      }

      // Si on arrive avec un code pour rejoindre
      const codeToJoin = location.state?.codeToJoin;
      if (codeToJoin && socketRef.current) {
        console.log("🎯 Tentative de rejoindre la room:", codeToJoin);
        socketRef.current.emit("joinGame", { code: codeToJoin, userId }); // ✨ Envoyer l'ID
        addLogEntry(`Tentative de rejoindre la partie ${codeToJoin}...`);
      }
    } else {
      setIsLoading(true);
    }
  }, [isConnected, location.state, socketRef, addLogEntry]);

  // Réagir aux changements du contexte (centralisé dans GameProvider)
  useEffect(() => {
    if (ctxRoomCode) setRoomCode(ctxRoomCode);
  }, [ctxRoomCode]);

  useEffect(() => {
    setPlayerCount(ctxPlayerCount || 1);
  }, [ctxPlayerCount]);

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
    const shareData = {
      title: "Rejoignez ma partie !", // Optionnel : titre du partage
      text: "Utilisez ce lien pour rejoindre la room :", // Optionnel : texte descriptif
      url: shareUrl, // L'URL à partager
    };

    // Essayer le partage natif en premier
    if (navigator.share) {
      navigator
        .share(shareData)
        .then(() => {
          // Succès : rien à faire, le système gère
        })
        .catch((err) => {
          console.error("Erreur partage natif:", err);
          // Fallback sur clipboard si échec (ex: user annule)
          fallbackToClipboard(shareUrl);
        });
    } else {
      // Si Web Share pas supporté, direct fallback
      fallbackToClipboard(shareUrl);
    }
  }, [roomCode]);

  // Fonction helper pour le fallback clipboard
  const fallbackToClipboard = (url) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          alert("Lien copié dans le presse-papier !");
        })
        .catch((err) => {
          console.error("Erreur copie presse-papier:", err);
          prompt("Copiez ce lien:", url);
        });
    } else {
      prompt("Copiez ce lien:", url);
    }
  };

  // Afficher un loader pendant la connexion
  if (isLoading) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-slate-900 text-white p-4">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 z-0 h-full w-full bg-gradient-to-r from-slate-900 via-black to-slate-900 animate-gradient-x" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-slate-800/50 border border-slate-700 flex items-center justify-center backdrop-blur-xl">
              <Loader2 className="w-10 h-10 text-fuchsia-500 animate-spin" />
            </div>
            <div className="absolute -inset-4 bg-fuchsia-500/20 blur-3xl rounded-full animate-pulse -z-10" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold tracking-tight text-white mb-2">
              Initialisation de la session
            </h2>
            <p className="text-slate-400 animate-pulse">
              Connexion au serveur de jeu...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <WaitingRoom
      roomCode={roomCode}
      onCancel={handleCancel}
      onStartGame={handleStartGame}
      onShareLink={handleShareLink}
      playerCount={playerCount}
    />
  );
}

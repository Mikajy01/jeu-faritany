import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameContext } from "../context/GameContext";
import { MenuPrincipal } from "../components/MenuPrincipal";
import { GameConfigModal } from "../components/ui/GameConfigModal";

export default function HomePage() {
  const navigate = useNavigate();
  const { socketRef, addLogEntry, gameState } = useGameContext();
  const [configModal, setConfigModal] = useState({ isOpen: false, mode: null });

  // ✨ Redirection automatique si une partie est détectée (reconnexion)
  useEffect(() => {
    if (gameState?.gameId || gameState?.code) {
      if (gameState.gameActive && !gameState.gameOver) {
        console.log("🚀 Partie active détectée, redirection...");
        navigate("/game");
      } else if (!gameState.gameActive && !gameState.gameOver) {
        console.log("⏳ Waiting room détectée, redirection...");
        navigate("/waiting-room");
      }
    }
  }, [
    gameState?.gameId,
    gameState?.code,
    gameState?.gameActive,
    gameState?.gameOver,
    navigate,
  ]);

  const handleConfirmConfig = useCallback(
    (settings) => {
      const mode = configModal.mode;
      setConfigModal({ isOpen: false, mode: null });

      if (mode === "create") {
        // La création effective se fera dans WaitingRoomPage avec ces paramètres
        navigate("/waiting-room", {
          state: { gameType: "private", settings },
        });
      } else if (mode === "ai") {
        navigate("/ai", {
          state: { settings },
        });
      } else if (mode === "random") {
        navigate("/waiting-room", {
          state: { gameType: "public", settings },
        });
      }
    },
    [configModal, navigate],
  );

  const handleSelectMode = useCallback(
    (mode) => {
      switch (mode) {
        case "create":
        case "ai":
        case "random":
          setConfigModal({ isOpen: true, mode });
          break;

        case "join":
          navigate("/join");
          break;

        default:
          break;
      }
    },
    [socketRef, addLogEntry, navigate],
  );

  return (
    <>
      <MenuPrincipal onSelectMode={handleSelectMode} />
      <GameConfigModal
        isOpen={configModal.isOpen}
        mode={configModal.mode}
        onClose={() => setConfigModal({ isOpen: false, mode: null })}
        onConfirm={handleConfirmConfig}
      />
    </>
  );
}

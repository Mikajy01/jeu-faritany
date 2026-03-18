import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameContext } from "../context/GameContext";
import { MenuPrincipal } from "../components/MenuPrincipal";
import { GameConfigModal } from "../components/ui/GameConfigModal";

export default function HomePage() {
  const navigate = useNavigate();
  const { isConnected, publicRooms, joinRoom, addLogEntry, checkGameStatus } =
    useGameContext();
  const [configModal, setConfigModal] = useState({ isOpen: false, mode: null });
  const [isChecking, setIsChecking] = useState(false);
  const [isJoining, setIsJoining] = useState(null); // ID de la salle en cours de jointure

  // ✨ Vérification réelle au backend au montage
  useEffect(() => {
    let isMounted = true;

    const verifySavedGame = async () => {
      const savedGameId = localStorage.getItem("faritany_current_game");
      if (!savedGameId) return;

      setIsChecking(true);
      const status = await checkGameStatus();

      if (isMounted && status) {
        if (status.gameActive) {
          console.log(
            "🚀 Partie active confirmée par le backend, redirection...",
          );
          navigate("/game");
        } else {
          console.log(
            "⏳ Salle d'attente confirmée par le backend, redirection...",
          );
          navigate("/waiting-room", {
            state: {
              roomCode: status.gameId,
              gameType: "private", // On suppose privé si on a un code sauvegardé
              isRejoin: true,
            },
          });
        }
      }
      if (isMounted) setIsChecking(false);
    };

    verifySavedGame();

    return () => {
      isMounted = false;
    };
  }, [checkGameStatus, navigate]);

  const handleConfirmConfig = useCallback(
    (settings) => {
      const mode = configModal.mode;
      setConfigModal({ isOpen: false, mode: null });

      if (mode === "create") {
        // La création effective se fera dans WaitingRoomPage avec ces paramètres
        navigate("/waiting-room", {
          state: { gameType: settings.type, settings },
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
    async (mode, roomCode = null) => {
      if (roomCode) {
        try {
          setIsJoining(roomCode);
          const result = await joinRoom(roomCode);
          if (result.success) {
            // Si la partie est déjà active, on va directement au jeu
            if (result.gameActive) {
              navigate("/game");
            } else {
              // Sinon on va en salle d'attente
              navigate("/waiting-room", {
                state: { roomCode: roomCode, gameType: "public" },
              });
            }
          }
        } catch (err) {
          addLogEntry(`Erreur de jointure: ${err.message}`);
          setIsJoining(null);
        }
        return;
      }

      switch (mode) {
        case "create":
        case "random":
          setConfigModal({ isOpen: true, mode });
          break;

        case "ai":
          // Pour l'IA, on ne passe plus par le paramétrage (timers inutiles)
          navigate("/ai", {
            state: { settings: { type: "AI" } },
          });
          break;

        case "join":
          navigate("/join");
          break;

        default:
          break;
      }
    },
    [navigate],
  );

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--accent-fuchsia)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--text-secondary)] font-medium animate-pulse">
            Vérification de la partie...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <MenuPrincipal
        onSelectMode={handleSelectMode}
        publicRooms={publicRooms}
        isJoining={isJoining}
      />
      <GameConfigModal
        isOpen={configModal.isOpen}
        mode={configModal.mode}
        onClose={() => setConfigModal({ isOpen: false, mode: null })}
        onConfirm={handleConfirmConfig}
      />
    </>
  );
}

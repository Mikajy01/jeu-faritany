import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useGameContext } from "../context/GameContext";
import { MenuPrincipal } from "../components/MenuPrincipal";

export default function HomePage() {
  const navigate = useNavigate();
  const { socketRef, addLogEntry } = useGameContext();

  const handleSelectMode = useCallback(
    (mode, code = null) => {
      switch (mode) {
        case "create":
          socketRef.current?.emit("createGame", { type: "private" });
          addLogEntry("Création d'une partie privée...");
          navigate("/waiting-room", {
            state: { gameType: "private" },
          });
          break;

        case "join":
          navigate("/join");
          break;

        case "random":
          socketRef.current?.emit("joinPublic");
          addLogEntry("Recherche d'une partie publique...");
          navigate("/waiting-room");
          break;

        case "ai":
          socketRef.current?.emit("createGame", { type: "AI" });
          addLogEntry("Démarrage d'une partie contre l'IA...");
          break;

        default:
          break;
      }
    },
    [socketRef, addLogEntry, navigate]
  );

  return <MenuPrincipal onSelectMode={handleSelectMode} />;
}

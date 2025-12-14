import { Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGameContext } from "../context/GameContext";

const JoinRoomPage = () => {
  const { code: urlCode } = useParams(); // ✨ Récupérer le code depuis l'URL
  const [roomCode, setRoomCode] = useState(urlCode?.toUpperCase() || ""); // ✨ Pré-remplir avec le code de l'URL
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const { socketRef, isConnected, addLogEntry } = useGameContext();

  // ✨ Si code dans l'URL et socket connecté, rejoindre automatiquement
  useEffect(() => {
    if (urlCode && isConnected && socketRef.current && !isLoading) {
      const code = urlCode.toUpperCase();
      if (code.length === 6) {
        console.log("🎯 Auto-join avec code URL:", code);
        setIsLoading(true);
        socketRef.current.emit("joinGame", { code });
        addLogEntry(`Tentative de rejoindre la partie ${code}...`);
      } else {
        setError("Code invalide dans l'URL");
      }
    }
  }, [urlCode, isConnected, socketRef, addLogEntry, isLoading]);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const socket = socketRef.current;

    const handleGameJoined = ({ playerId, playerCount: count }) => {
      console.log("✅ Partie rejointe:", { playerId, playerCount: count });
      addLogEntry("Partie rejointe !");
      navigate("/game", { 
        state: { 
          roomCode: roomCode
        } 
      });
    };

    const handleJoinError = ({ reason }) => {
      console.error("❌ Join error:", reason);
      addLogEntry(`Erreur: ${reason}`);
      setError(reason);
      setIsLoading(false);
      setRoomCode("");
    };

    socket.on("gameJoined", handleGameJoined);
    socket.on("joinError", handleJoinError);

    // Cleanup: détacher les listeners
    return () => {
      socket.off("gameJoined", handleGameJoined);
      socket.off("joinError", handleJoinError);
    };
  }, [isConnected, socketRef, addLogEntry, navigate, roomCode]);

  const handleJoinWithCode = () => {
    if (roomCode.length !== 6) {
      setError("Le code de la salle doit contenir 6 caractères.");
      return;
    }
    if (socketRef.current && isConnected) {
      setIsLoading(true);
      setError("");
      console.log("🎯 Join avec code:", roomCode);
      socketRef.current.emit("joinGame", { code: roomCode.toUpperCase() });
      addLogEntry(`Tentative de rejoindre ${roomCode}...`);
    } else {
      setError("Connexion au serveur en cours...");
    }
  };

  // ✨ Afficher un loader si en train de rejoindre
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Connexion à la partie...
          </h2>
          <p className="text-slate-400">Code: {roomCode}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Rejoindre une partie
            </h2>
            <p className="text-slate-600">
              {urlCode 
                ? `Code détecté: ${urlCode.toUpperCase()}` 
                : "Entrez le code de la salle"}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Code de la salle
              </label>
              <input
                type="text"
                maxLength={6}
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value.toUpperCase());
                  setError("");
                }}
                placeholder="ABC123"
                className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                disabled={isLoading || !isConnected}
              />
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              {!isConnected && (
                <p className="mt-2 text-sm text-amber-600">
                  ⏳ Connexion au serveur...
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate(-1)}
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Retour
              </button>
              <button
                onClick={handleJoinWithCode}
                disabled={roomCode.length !== 6 || isLoading || !isConnected}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Connexion..." : "Rejoindre"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinRoomPage;
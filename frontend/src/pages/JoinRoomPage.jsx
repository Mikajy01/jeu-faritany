import { Users, Loader2, ArrowLeft, Hash } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGameContext } from "../context/GameContext";
import { motion, AnimatePresence } from "framer-motion";

// Grid component for the background
const Grid = () => (
  <div className="absolute inset-0 z-0">
    <div
      className="absolute inset-0 bg-repeat opacity-20"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.1) 1px, transparent 0)",
        backgroundSize: "2rem 2rem",
      }}
    />
  </div>
);

const JoinRoomPage = () => {
  const { code: urlCode } = useParams();
  const [roomCode, setRoomCode] = useState(urlCode?.toUpperCase() || "");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const { socketRef, isConnected, addLogEntry, userId } = useGameContext();

  useEffect(() => {
    if (urlCode && isConnected && socketRef.current && !isLoading) {
      const code = urlCode.toUpperCase();
      if (code.length === 6) {
        setIsLoading(true);
        socketRef.current.emit("joinGame", { code, userId });
        addLogEntry(`Tentative de rejoindre la partie ${code}...`);
      } else {
        setError("Code invalide dans l'URL");
      }
    }
  }, [urlCode, isConnected, socketRef, addLogEntry, isLoading, userId]);

  useEffect(() => {
    if (!isConnected) return;

    const socket = socketRef.current;

    const handleGameJoined = ({ playerId, playerCount: count }) => {
      addLogEntry("Partie rejointe !");
      navigate("/game", { 
        state: { 
          roomCode: roomCode
        } 
      });
    };

    const handleJoinError = ({ reason }) => {
      addLogEntry(`Erreur: ${reason}`);
      setError(reason);
      setIsLoading(false);
      setRoomCode("");
    };

    socket.on("gameJoined", handleGameJoined);
    socket.on("joinError", handleJoinError);

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
      socketRef.current.emit("joinGame", { code: roomCode.toUpperCase(), userId });
      addLogEntry(`Tentative de rejoindre ${roomCode}...`);
    } else {
      setError("Connexion au serveur en cours...");
    }
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-slate-900 text-white p-4">
        <div className="absolute inset-0 z-0 h-full w-full bg-gradient-to-r from-slate-900 via-black to-slate-900 animate-gradient-x" />
        <Grid />
        
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-slate-800/50 border border-slate-700 flex items-center justify-center backdrop-blur-xl">
              <Loader2 className="w-10 h-10 text-fuchsia-500 animate-spin" />
            </div>
            <div className="absolute -inset-4 bg-fuchsia-500/20 blur-3xl rounded-full animate-pulse -z-10" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold tracking-tight text-white mb-2">Connexion à la partie</h2>
            <p className="text-slate-400">Code: <span className="font-mono text-fuchsia-400 font-bold">{roomCode}</span></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-slate-900 text-white p-4">
      <div className="absolute inset-0 z-0 h-full w-full bg-gradient-to-r from-slate-900 via-black to-slate-900 animate-gradient-x" />
      <Grid />

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl p-8 space-y-8">
          <div className="text-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-fuchsia-500/20 to-purple-600/20 rounded-2xl mb-6 border border-purple-500/30"
            >
              <Hash className="w-10 h-10 text-fuchsia-400" />
            </motion.div>
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-2">
              Rejoindre une partie
            </h2>
            <p className="text-slate-400">
              {urlCode 
                ? `Code détecté dans le lien` 
                : "Saisissez le code secret de la salle"}
            </p>
          </div>

          <div className="space-y-6">
            <div className="relative group">
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3 ml-1 group-focus-within:text-fuchsia-400 transition-colors">
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
                className="w-full bg-slate-900/60 border-2 border-slate-700 rounded-2xl px-4 py-5 text-center text-4xl font-mono font-bold tracking-[0.3em] text-white placeholder:text-slate-700 focus:outline-none focus:border-fuchsia-500/50 focus:ring-4 focus:ring-fuchsia-500/10 transition-all uppercase"
                disabled={isLoading || !isConnected}
              />
              <AnimatePresence>
                {error && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 text-sm text-rose-400 text-center font-medium"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
              {!isConnected && (
                <p className="mt-3 text-sm text-amber-400 text-center flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connexion au serveur...
                </p>
              )}
            </div>

            <div className="flex gap-4 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/")}
                disabled={isLoading}
                className="flex-1 px-6 py-4 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-2xl text-sm font-bold border border-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleJoinWithCode}
                disabled={roomCode.length !== 6 || isLoading || !isConnected}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-purple-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Connexion..." : "Rejoindre l'arène"}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default JoinRoomPage;

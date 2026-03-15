import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGameContext } from "../context/GameContext";
import { Loader2, Bot, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

// Grid component for the background
const Grid = () => (
  <div className="absolute inset-0 z-0 pointer-events-none">
    <div
      className="absolute inset-0 bg-repeat opacity-[0.05] dark:opacity-20"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, var(--text-muted) 1px, transparent 0)",
        backgroundSize: "2rem 2rem",
      }}
    />
  </div>
);

export default function AiRoomPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { socketRef, isConnected, addLogEntry, userId, theme } =
    useGameContext();
  const [isLoading, setIsLoading] = useState(true);
  const isDarkMode = theme === "dark";

  // Attendre que le socket soit connecté et créer la room
  useEffect(() => {
    if (isConnected) {
      setIsLoading(false);

      if (socketRef.current) {
        const settings = location.state?.settings || {};
        socketRef.current.emit("createGame", {
          type: "AI",
          userId,
          ...settings,
        });
        addLogEntry(`Initialisation du duel contre l'IA...`);
      }
    } else {
      setIsLoading(true);
    }
  }, [isConnected, socketRef, addLogEntry, location.state, userId]);

  // Écouter les événements de la salle d'attente
  useEffect(() => {
    if (!isConnected) return;

    const socket = socketRef.current;

    const handleGameCreated = ({ type }) => {
      if (type === "AI") {
        // Petit délai pour l'effet visuel
        setTimeout(() => navigate("/game"), 1500);
      }
    };

    const handleCreateError = ({ reason }) => {
      addLogEntry(`Erreur de création: ${reason}`);
      setTimeout(() => navigate("/"), 2000);
    };

    socket.on("gameCreated", handleGameCreated);
    socket.on("createError", handleCreateError);

    return () => {
      socket.off("gameCreated", handleGameCreated);
      socket.off("createError", handleCreateError);
    };
  }, [isConnected, socketRef, addLogEntry, navigate]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 transition-colors duration-300">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 z-0 h-full w-full bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-black/20 animate-gradient-x pointer-events-none opacity-50 dark:opacity-100" />
      <Grid />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 flex flex-col items-center gap-8"
      >
        <div className="relative">
          <motion.div
            animate={{
              rotate: [0, 360],
              borderRadius: ["2rem", "3rem", "2rem"],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="w-32 h-32 bg-gradient-to-br from-[var(--accent-amber)]/10 to-[var(--accent-amber)]/20 border border-[var(--accent-amber)]/30 flex items-center justify-center backdrop-blur-xl relative"
          >
            <Bot className="w-14 h-14 text-[var(--accent-amber)]" />
          </motion.div>

          {/* Animated rings around the icon */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -inset-4 border border-[var(--accent-amber)]/20 rounded-full -z-10"
          />
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
            className="absolute -inset-8 border border-[var(--accent-amber)]/10 rounded-full -z-10"
          />
        </div>

        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-black tracking-tight text-[var(--text-primary)] mb-2 flex items-center justify-center gap-3 uppercase">
              <Sparkles className="w-6 h-6 text-[var(--accent-amber)]" />
              Initialisation IA
            </h2>
            <p className="text-[var(--text-secondary)] max-w-xs mx-auto font-medium">
              Nous préparons une intelligence artificielle à votre mesure...
            </p>
          </motion.div>

          <div className="flex items-center justify-center gap-3 px-6 py-3 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-primary)] shadow-lg">
            <Loader2 className="w-4 h-4 text-[var(--accent-amber)] animate-spin" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-[var(--accent-amber)] animate-pulse">
              Calcul stratégique...
            </span>
          </div>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.3em] opacity-40"
      >
        Faritany Engine v2.0 • Neural Network Ready
      </motion.p>
    </div>
  );
}

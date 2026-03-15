import { Users, Loader2, ArrowLeft, Hash } from "lucide-react";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useGameContext } from "../context/GameContext";
import { motion, AnimatePresence } from "framer-motion";

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

const JoinRoomPage = () => {
  const { roomCode: urlCode } = useParams(); // ✨ Correction: match roomCode from App.jsx
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const urlPwd = queryParams.get("pwd");

  const [roomCode, setRoomCode] = useState(urlCode?.toUpperCase() || "");
  const [joinCode, setJoinCode] = useState(urlPwd || "");
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true); // ✨ Toujours commencer en mode vérification
  const autoJoinAttempted = useRef(false);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5555";

  const {
    socketRef,
    isConnected,
    addLogEntry,
    userId,
    getRoomInfo,
    joinRoom,
    theme,
  } = useGameContext();

  const isDarkMode = theme === "dark";

  // ✨ Effet pour gérer l'état initial de isChecking si pas de code
  useEffect(() => {
    if (!urlCode) {
      setIsChecking(false);
    }
  }, [urlCode]);

  useEffect(() => {
    let isMounted = true;

    // 1. Empêcher les tentatives multiples ou si déjà en train de charger
    if (!urlCode || isLoading || autoJoinAttempted.current) {
      console.log("⏭️ Skip auto-join: condition non remplie", {
        urlCode,
        isLoading,
        attempted: autoJoinAttempted.current,
      });
      return;
    }

    // 2. Attendre que le socket soit connecté ET qu'il ait un ID (prêt à émettre)
    if (!isConnected || !socketRef.current?.id) {
      console.log("⏳ En attente du socket pour auto-join...");
      setIsChecking(true);
      return;
    }

    const code = urlCode.toUpperCase();
    if (code.length !== 6) {
      setIsChecking(false);
      return;
    }

    // 3. Verrouiller la tentative
    autoJoinAttempted.current = true;
    setIsChecking(true);
    console.log(`🚀 Lancement auto-join pour: ${code}`);

    const performAutoJoin = async () => {
      try {
        const data = await getRoomInfo(code);
        if (!isMounted) return;

        console.log("ℹ️ Infos salle reçues:", data);

        if (data.gameType === "public") {
          addLogEntry(`Jointure automatique de la salle publique ${code}...`);
          const result = await joinRoom(code);
          console.log("✅ Résultat jointure publique:", result);

          if (isMounted && result.success) {
            navigate(result.gameActive ? "/game" : "/waiting-room", {
              state: { roomCode: code, gameType: "public" },
            });
          }
        } else {
          // Salle privée
          console.log("🔒 Salle privée détectée");
          setIsPrivate(true);
          setRoomCode(code);

          if (urlPwd && urlPwd.length === 4) {
            addLogEntry(`Jointure automatique de la salle privée ${code}...`);
            setJoinCode(urlPwd);
            const result = await joinRoom(code, urlPwd);
            console.log("✅ Résultat jointure privée:", result);

            if (isMounted && result.success) {
              navigate(result.gameActive ? "/game" : "/waiting-room", {
                state: { roomCode: code, gameType: "private" },
              });
            }
          } else {
            console.log("⌨️ En attente de saisie du code secret");
            setIsChecking(false);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("❌ Échec auto-join:", err);
          setError(err.message || "Impossible de rejoindre la salle.");
          setIsChecking(false);
          autoJoinAttempted.current = false;
        }
      }
    };

    performAutoJoin();

    return () => {
      isMounted = false;
    };
  }, [
    urlCode,
    urlPwd,
    isConnected,
    socketRef.current?.id, // ✨ Dépendre explicitement de l'ID du socket
    addLogEntry,
    isLoading,
    getRoomInfo,
    joinRoom,
    navigate,
  ]);

  // 📡 Écouter les erreurs de jointure via socket (pour le feedback)
  useEffect(() => {
    if (!isConnected || !socketRef.current) return;

    const socket = socketRef.current;
    const handleJoinError = ({ reason }) => {
      addLogEntry(`Erreur socket: ${reason}`);
      setError(reason);
      setIsLoading(false);
      autoJoinAttempted.current = false;
    };

    socket.on("joinError", handleJoinError);
    return () => socket.off("joinError", handleJoinError);
  }, [isConnected, socketRef, addLogEntry]);

  const handleJoinWithCode = async () => {
    if (roomCode.length !== 6) {
      setError("Le code de la salle doit contenir 6 caractères.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // 1. D'abord, récupérer les infos de la salle pour savoir si elle est privée
      let currentIsPrivate = isPrivate;
      if (!currentIsPrivate) {
        const room = await getRoomInfo(roomCode.toUpperCase());
        if (room.gameType === "private") {
          setIsPrivate(true);
          setIsLoading(false);
          return;
        }
      }

      // 2. Si privée, vérifier que le code secret est saisi
      if (isPrivate && joinCode.length !== 4) {
        setError("Le code secret doit contenir 4 chiffres.");
        setIsLoading(false);
        return;
      }

      // 3. Valider la jointure et se connecter
      const result = await joinRoom(
        roomCode.toUpperCase(),
        isPrivate ? joinCode : undefined,
      );

      if (result.success) {
        addLogEntry(`Partie rejointe avec succès !`);
        navigate(result.gameActive ? "/game" : "/waiting-room", {
          state: {
            roomCode: roomCode.toUpperCase(),
            gameType: isPrivate ? "private" : "public",
          },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion.");
      setIsLoading(false);
    }
  };

  if (isChecking || isLoading) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 transition-colors duration-300">
        <div className="absolute inset-0 z-0 h-full w-full bg-gradient-to-r from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)] animate-gradient-x opacity-50 dark:opacity-100" />
        <Grid />

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-primary)] flex items-center justify-center backdrop-blur-xl">
              <Loader2 className="w-10 h-10 text-[var(--accent-fuchsia)] animate-spin" />
            </div>
            <div className="absolute -inset-4 bg-[var(--accent-fuchsia)]/20 blur-3xl rounded-full animate-pulse -z-10" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2 uppercase">
              Connexion...
            </h2>
            <p className="text-[var(--text-secondary)]">
              Salle:{" "}
              <span className="font-mono text-[var(--accent-fuchsia)] font-black">
                {roomCode}
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 transition-colors duration-300">
      <div className="absolute inset-0 z-0 h-full w-full bg-gradient-to-r from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)] animate-gradient-x opacity-50 dark:opacity-100" />
      <Grid />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-[var(--bg-surface)] backdrop-blur-xl rounded-3xl border border-[var(--border-primary)] shadow-2xl p-8 space-y-8">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-[var(--accent-fuchsia)]/10 rounded-2xl mb-6 border border-[var(--accent-fuchsia)]/20"
            >
              <Hash className="w-10 h-10 text-[var(--accent-fuchsia)]" />
            </motion.div>
            <h2 className="text-3xl font-black text-[var(--text-primary)] mb-2 uppercase tracking-tight">
              Rejoindre
            </h2>
            <p className="text-[var(--text-secondary)] font-medium">
              {urlCode
                ? `Code détecté via le lien`
                : "Entrez l'ID de la salle pour rejoindre"}
            </p>
          </div>

          <div className="space-y-6">
            <div className="relative group">
              <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 ml-1 group-focus-within:text-[var(--accent-fuchsia)] transition-colors">
                ID de la salle
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
                className={`w-full bg-[var(--bg-primary)]/40 border-2 ${error ? "border-[var(--accent-rose)]/50" : "border-[var(--border-primary)]"} rounded-2xl px-4 py-5 text-center text-4xl font-mono font-black tracking-[0.3em] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/20 focus:outline-none focus:border-[var(--accent-fuchsia)]/50 focus:ring-4 focus:ring-[var(--accent-fuchsia)]/10 transition-all uppercase ${isPrivate ? "opacity-50" : ""}`}
                disabled={isLoading || !isConnected || isPrivate}
              />
            </div>

            <AnimatePresence>
              {isPrivate && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative group"
                >
                  <label className="block text-xs font-black uppercase tracking-widest text-[var(--accent-emerald)] mb-3 ml-1">
                    Code Secret (4 chiffres)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={joinCode}
                    onChange={(e) => {
                      setJoinCode(e.target.value.replace(/\D/g, ""));
                      setError("");
                    }}
                    className={`w-full bg-[var(--bg-primary)]/40 border-2 ${error ? "border-[var(--accent-rose)]/50" : "border-[var(--accent-emerald)]/30"} rounded-2xl px-6 py-4 font-mono text-3xl tracking-[0.5em] text-center focus:outline-none focus:border-[var(--accent-emerald)]/50 transition-all placeholder:text-[var(--text-muted)]/20 text-[var(--accent-emerald)]`}
                    placeholder="0000"
                    autoFocus
                  />
                  <p className="text-[10px] text-[var(--text-muted)] mt-2 text-center uppercase tracking-widest font-bold">
                    Cette salle est privée. Entrez le code à 4 chiffres.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 text-sm text-[var(--accent-rose)] text-center font-bold uppercase tracking-tight"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
            {!isConnected && (
              <p className="mt-3 text-sm text-[var(--accent-amber)] text-center font-bold flex items-center justify-center gap-2 uppercase tracking-widest">
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
              className="flex-1 px-6 py-4 bg-[var(--bg-surface)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-2xl text-sm font-bold border border-[var(--border-primary)] transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleJoinWithCode}
              disabled={
                roomCode.length !== 6 ||
                isLoading ||
                !isConnected ||
                (isPrivate && joinCode.length !== 4)
              }
              className="flex-1 px-6 py-4 bg-gradient-to-r from-[var(--accent-fuchsia)] to-purple-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-purple-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center uppercase tracking-widest"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPrivate ? (
                "Valider"
              ) : (
                "Rejoindre"
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default JoinRoomPage;

import React from "react";
import {
  Users,
  Copy,
  Share2,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Globe,
} from "lucide-react";
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

export function WaitingRoom({
  roomCode,
  joinCode,
  gameType,
  playerCount,
  onCancel,
  onStartGame,
  onShareLink,
}) {
  const [copied, setCopied] = React.useState(false);
  const [copiedJoinCode, setCopiedJoinCode] = React.useState(false);
  const [shared, setShared] = React.useState(false);

  const getShareLink = () => {
    const baseUrl = window.location.origin;
    let url = `${baseUrl}/join/${roomCode}`;
    if (gameType === "private" && joinCode) {
      url += `?pwd=${joinCode}`;
    }
    return url;
  };

  const handleCopyCode = () => {
    if (navigator.clipboard && roomCode) {
      navigator.clipboard.writeText(roomCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleCopyJoinCode = () => {
    if (navigator.clipboard && joinCode) {
      navigator.clipboard.writeText(joinCode).then(() => {
        setCopiedJoinCode(true);
        setTimeout(() => setCopiedJoinCode(false), 2000);
      });
    }
  };

  const handleShareLink = async () => {
    const shareData = {
      title: "Rejoins-moi sur Faritany !",
      text: `Viens m'affronter sur Faritany ! Code de la salle : ${roomCode}${gameType === "private" ? ` (Code secret : ${joinCode})` : ""}`,
      url: getShareLink(),
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        if (err.name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    const link = getShareLink();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="relative min-h-screen w-full bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center p-2 sm:p-4 overflow-x-hidden overflow-y-auto transition-colors duration-300">
      {/* Animated Gradient Background */}
      <div className="fixed inset-0 z-0 h-full w-full bg-gradient-to-r from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)] animate-gradient-x" />
      <Grid />

      <motion.div
        className="relative z-10 w-full max-w-2xl max-h-[95vh] flex flex-col min-h-0"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="bg-[var(--bg-surface)] backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-[var(--border-primary)] shadow-2xl overflow-hidden flex flex-col min-h-0">
          {/* Scrollable Content Area */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col">
            {/* Header */}
            <div className="p-4 sm:p-6 pb-2 sm:pb-4 text-center">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[var(--accent-fuchsia)]/20 to-purple-600/20 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 border border-[var(--accent-fuchsia)]/30"
              >
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--accent-fuchsia)]" />
              </motion.div>
              <motion.h1
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xl sm:text-2xl md:text-3xl font-black text-[var(--text-primary)] mb-1 uppercase tracking-tight"
              >
                Salle d'attente
              </motion.h1>
              <motion.p
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-[10px] sm:text-xs text-[var(--text-secondary)] font-medium"
              >
                {playerCount === 1
                  ? "Préparez-vous, votre adversaire arrive..."
                  : "L'arène est prête. Que le meilleur gagne !"}
              </motion.p>
            </div>

            <div className="px-4 sm:px-8 pb-6 sm:pb-8 space-y-4 sm:space-y-6">
              {/* Room Code Section */}
              <AnimatePresence mode="wait">
                {roomCode && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`grid grid-cols-1 ${gameType === "private" ? "sm:grid-cols-2" : ""} gap-3 sm:gap-4`}
                  >
                    {/* Room ID */}
                    <div className="bg-[var(--bg-secondary)]/60 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-[var(--border-primary)] relative group overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 sm:p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--text-primary)]" />
                      </div>
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] font-black text-[var(--text-muted)] mb-1 sm:mb-2">
                          ID de la salle
                        </div>
                        <div className="text-xl sm:text-2xl font-mono font-black text-[var(--accent-fuchsia)] tracking-wider mb-2 sm:mb-3">
                          {roomCode}
                        </div>
                        <div className="flex gap-2 w-full">
                          <button
                            onClick={handleCopyCode}
                            className="flex-1 flex items-center justify-center gap-2 py-1.5 sm:py-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-secondary)] rounded-lg sm:rounded-xl transition-all border border-[var(--border-primary)] text-[10px] sm:text-xs font-black text-[var(--text-secondary)]"
                          >
                            {copied ? (
                              <>
                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--accent-emerald)]" />
                                Copié
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                                Copier
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleShareLink}
                            className="flex-1 flex items-center justify-center gap-2 py-1.5 sm:py-2 bg-[var(--accent-fuchsia)]/10 hover:bg-[var(--accent-fuchsia)]/20 rounded-lg sm:rounded-xl transition-all border border-[var(--accent-fuchsia)]/30 text-[10px] sm:text-xs font-black text-[var(--accent-fuchsia)]"
                          >
                            {shared ? (
                              <>
                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                Partagé
                              </>
                            ) : (
                              <>
                                <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                Partager
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Join Code (Private only) */}
                    {gameType === "private" && joinCode && (
                      <div className="bg-[var(--bg-secondary)]/60 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-[var(--accent-emerald)]/20 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 sm:p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                          <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--accent-emerald)]" />
                        </div>
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] font-black text-[var(--text-muted)] mb-1 sm:mb-2">
                            Code secret
                          </div>
                          <div className="text-xl sm:text-2xl font-mono font-black text-[var(--accent-emerald)] tracking-widest mb-2 sm:mb-3">
                            {joinCode}
                          </div>
                          <button
                            onClick={handleCopyJoinCode}
                            className="w-full flex items-center justify-center gap-2 py-1.5 sm:py-2 bg-[var(--accent-emerald)]/10 hover:bg-[var(--accent-emerald)]/20 rounded-lg sm:rounded-xl transition-all border border-[var(--accent-emerald)]/30 text-[10px] sm:text-xs font-black text-[var(--accent-emerald)]"
                          >
                            {copiedJoinCode ? (
                              <>
                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                Copié
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                                Copier
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Players Status */}
              <div className="bg-[var(--bg-secondary)]/40 rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-[var(--border-secondary)]">
                <div className="flex flex-col items-center gap-3 sm:gap-4">
                  <div className="flex items-center justify-center gap-4 sm:gap-6">
                    <div className="relative">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[var(--accent-fuchsia)] to-purple-600 flex items-center justify-center text-white text-sm sm:text-lg font-black shadow-xl border-2 border-[var(--border-primary)]">
                        1
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-[var(--accent-emerald)] rounded-full border-2 border-[var(--bg-primary)]" />
                    </div>

                    <div className="h-px w-8 sm:w-10 bg-[var(--border-primary)]" />

                    <div className="relative">
                      <div
                        className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-sm sm:text-lg font-black border-2 transition-all duration-500 ${
                          playerCount >= 2
                            ? "bg-gradient-to-br from-blue-500 to-[var(--accent-cyan)] text-white border-[var(--border-primary)] shadow-xl"
                            : "bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-primary)]"
                        }`}
                      >
                        {playerCount >= 2 ? "2" : "?"}
                      </div>
                      {playerCount < 2 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--text-muted)] opacity-50 animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-sm sm:text-base font-black text-[var(--text-primary)] uppercase tracking-tight">
                      {playerCount}/2 Joueurs
                    </span>
                    <p className="text-[10px] sm:text-xs text-[var(--text-muted)] font-medium mt-0.5 sm:mt-1">
                      {playerCount < 2
                        ? "Recherche d'un adversaire..."
                        : "Adversaire prêt !"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 sm:gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onCancel}
                  className="flex-1 px-4 py-3 sm:px-6 sm:py-3.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black border border-[var(--border-primary)] transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                  <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                  Quitter
                </motion.button>
                {playerCount === 2 && (
                  <motion.button
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex-1 px-4 py-3 sm:px-6 sm:py-3.5 bg-gradient-to-r from-[var(--accent-emerald)] to-teal-700 text-white rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 uppercase tracking-widest"
                  >
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                    Démarrage...
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-[var(--text-muted)] text-[8px] sm:text-[10px] mt-4 sm:mt-6 font-medium uppercase tracking-widest opacity-50"
        >
          💡 Faritany est un jeu de conquête territoriale. Soyez stratégique.
        </motion.p>
      </motion.div>
    </div>
  );
}

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

  const handleShareLink = () => {
    onShareLink?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    <div className="relative min-h-screen w-full bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-start sm:items-center justify-center p-4 overflow-y-auto custom-scrollbar transition-colors duration-300">
      {/* Animated Gradient Background */}
      <div className="fixed inset-0 z-0 h-full w-full bg-gradient-to-r from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)] animate-gradient-x" />
      <Grid />

      <motion.div
        className="relative z-10 w-full max-w-2xl my-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="bg-[var(--bg-surface)] backdrop-blur-xl rounded-3xl border border-[var(--border-primary)] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-8 pb-4 text-center">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[var(--accent-fuchsia)]/20 to-purple-600/20 rounded-2xl mb-6 border border-[var(--accent-fuchsia)]/30"
            >
              <Users className="w-10 h-10 text-[var(--accent-fuchsia)]" />
            </motion.div>
            <motion.h1
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-2"
            >
              Salle d'attente
            </motion.h1>
            <motion.p
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-[var(--text-secondary)]"
            >
              {playerCount === 1
                ? "Préparez-vous, votre adversaire arrive..."
                : "L'arène est prête. Que le meilleur gagne !"}
            </motion.p>
          </div>

          <div className="px-8 pb-8 space-y-8">
            {/* Room Code Section */}
            <AnimatePresence mode="wait">
              {roomCode && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`grid grid-cols-1 ${gameType === "private" ? "md:grid-cols-2" : ""} gap-6`}
                >
                  {/* Room ID */}
                  <div className="bg-[var(--bg-secondary)]/60 rounded-2xl p-6 border border-[var(--border-primary)] relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Users className="w-12 h-12 text-[var(--text-primary)]" />
                    </div>
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--text-muted)] mb-2">
                        ID de la salle
                      </div>
                      <div className="text-3xl font-mono font-bold text-[var(--accent-fuchsia)] tracking-wider mb-4">
                        {roomCode}
                      </div>
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={handleCopyCode}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-secondary)] rounded-xl transition-all border border-[var(--border-primary)] text-xs font-bold text-[var(--text-secondary)]"
                        >
                          {copied ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-[var(--accent-emerald)]" />
                              Copié
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copier ID
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Join Code (Private only) */}
                  {gameType === "private" && joinCode && (
                    <div className="bg-[var(--bg-secondary)]/60 rounded-2xl p-6 border border-[var(--accent-emerald)]/20 relative group overflow-hidden">
                      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CheckCircle className="w-12 h-12 text-[var(--accent-emerald)]" />
                      </div>
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--text-muted)] mb-2">
                          Code secret (4 chiffres)
                        </div>
                        <div className="text-3xl font-mono font-bold text-[var(--accent-emerald)] tracking-widest mb-4">
                          {joinCode}
                        </div>
                        <button
                          onClick={handleCopyJoinCode}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--accent-emerald)]/10 hover:bg-[var(--accent-emerald)]/20 rounded-xl transition-all border border-[var(--accent-emerald)]/30 text-xs font-bold text-[var(--accent-emerald)]"
                        >
                          {copiedJoinCode ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Copié
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copier Code
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
            <div className="bg-[var(--bg-secondary)]/40 rounded-2xl p-6 border border-[var(--border-secondary)]">
              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center justify-center gap-8">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent-fuchsia)] to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-xl border-2 border-[var(--border-primary)]">
                      1
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-[var(--accent-emerald)] rounded-full border-2 border-[var(--bg-primary)]" />
                  </div>

                  <div className="h-px w-12 bg-[var(--border-primary)]" />

                  <div className="relative">
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold border-2 transition-all duration-500 ${
                        playerCount >= 2
                          ? "bg-gradient-to-br from-blue-500 to-[var(--accent-cyan)] text-white border-[var(--border-primary)] shadow-xl"
                          : "bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-primary)]"
                      }`}
                    >
                      {playerCount >= 2 ? "2" : "?"}
                    </div>
                    {playerCount < 2 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-[var(--text-muted)] opacity-50 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-lg font-medium text-[var(--text-primary)]">
                    {playerCount}/2 Joueurs
                  </span>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    {playerCount < 2
                      ? "Recherche d'un adversaire..."
                      : "Adversaire prêt !"}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                className="flex-1 px-6 py-4 bg-[var(--bg-surface)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-2xl text-sm font-bold border border-[var(--border-primary)] transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Quitter la salle
              </motion.button>
              {playerCount === 2 && (
                <motion.button
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-[var(--accent-emerald)] to-teal-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Démarrage...
                </motion.button>
              )}
            </div>
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-[var(--text-muted)] text-xs mt-8"
        >
          💡 Faritany est un jeu de conquête territoriale. Soyez stratégique.
        </motion.p>
      </motion.div>
    </div>
  );
}

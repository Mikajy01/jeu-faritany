import React from "react";
import { Users, Bot, Globe, Plus, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { GameBoardPreview } from "./ui/GameBoardPreview";

// Grid component for the background
const Grid = () => (
  <div className="absolute inset-0 z-0">
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

export const MenuPrincipal = ({
  onSelectMode,
  publicRooms = [],
  isJoining = null,
}) => {
  const modes = [
    {
      id: "create",
      icon: Plus,
      title: "Créer une partie",
      description: "Lancez un duel public ou privé entre amis.",
      color: "text-[var(--accent-cyan)]",
    },
    {
      id: "join",
      icon: Users,
      title: "Rejoindre une partie",
      description: "Entrez le code d'une salle pour jouer.",
      color: "text-[var(--accent-fuchsia)]",
    },
    {
      id: "ai",
      icon: Bot,
      title: "Jouer contre l'IA",
      description: "Entraînez-vous contre notre intelligence artificielle.",
      color: "text-[var(--accent-amber)]",
    },
  ];

  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <div className="relative min-h-screen min-h-[100dvh] w-full overflow-x-hidden flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 z-0 h-full w-full bg-gradient-to-r from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)] animate-gradient-x" />
      <Grid />

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6 lg:p-8">
        <motion.div
          className="flex flex-col lg:flex-row items-center justify-center w-full max-w-6xl mx-auto gap-8 lg:gap-16"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Left Side: Title and Game Board */}
          <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
            <motion.h1
              className="text-5xl md:text-7xl font-bold text-[var(--text-primary)] mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Jeu Faritany
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl text-[var(--text-secondary)] mb-10"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              La conquête du territoire par l'esprit.
            </motion.p>

            {/* Stylized Game Board Preview */}
            <motion.div
              className="w-56 h-56 md:w-80 md:h-80 bg-[var(--bg-surface)] rounded-2xl shadow-2xl flex items-center justify-center p-4 border border-[var(--border-primary)] overflow-hidden"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
            >
              <GameBoardPreview />
            </motion.div>
          </div>

          {/* Right Side: Menu Options & Public Rooms */}
          <motion.div
            className="w-full lg:w-1/2 flex flex-col space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="flex flex-col space-y-4">
              {modes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <motion.button
                    key={mode.id}
                    onClick={() => onSelectMode(mode.id)}
                    className="group relative text-center lg:text-left p-5 rounded-lg transition-all duration-300 ease-in-out overflow-hidden bg-[var(--bg-surface)] hover:bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--text-secondary)] w-full"
                    variants={itemVariants}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-start">
                      <Icon
                        className={`w-7 h-7 mb-3 lg:mb-0 lg:mr-5 transition-colors duration-300 ${mode.color}`}
                      />
                      <div className="flex flex-col items-center lg:items-start">
                        <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                          {mode.title}
                        </h3>
                        <p className="text-[var(--text-muted)] text-sm">
                          {mode.description}
                        </p>
                      </div>
                      <ArrowRight className="hidden lg:block w-6 h-6 ml-auto text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-all duration-300 transform group-hover:translate-x-1" />
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Public Rooms List */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col space-y-4 pt-6 border-t border-[var(--border-secondary)]"
            >
              <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-4 px-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[var(--accent-emerald)]" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-muted)]">
                    Parties Publiques
                  </h3>
                </div>
                <span className="text-[10px] font-bold bg-[var(--bg-secondary)] text-[var(--text-secondary)] px-2 py-1 rounded-full border border-[var(--border-primary)]">
                  {publicRooms.length} en ligne
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-1 lg:pr-2 custom-scrollbar">
                {publicRooms.length > 0 ? (
                  publicRooms.map((room) => {
                    const isThisRoomJoining = isJoining === room.gameId;
                    const isFull = room.playerCount >= 2;

                    return (
                      <motion.button
                        key={room.gameId}
                        whileHover={
                          !isThisRoomJoining && !isFull ? { y: -2 } : {}
                        }
                        onClick={() =>
                          !isThisRoomJoining &&
                          !isFull &&
                          onSelectMode("join", room.gameId)
                        }
                        disabled={isThisRoomJoining || isFull}
                        className={`flex flex-col lg:flex-row items-center justify-between p-4 rounded-xl transition-all group gap-4 border ${
                          isThisRoomJoining || isFull
                            ? "bg-[var(--bg-surface)] opacity-50 cursor-not-allowed border-[var(--border-primary)]"
                            : "bg-[var(--bg-surface)] hover:bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:border-[var(--accent-emerald)] shadow-sm hover:shadow-md"
                        }`}
                      >
                        <div className="flex flex-col items-center lg:items-start w-full lg:w-auto">
                          <span
                            className={`text-sm font-mono font-black transition-colors ${
                              isThisRoomJoining
                                ? "text-[var(--accent-emerald)]"
                                : "text-[var(--text-primary)] group-hover:text-[var(--accent-emerald)]"
                            }`}
                          >
                            #{room.gameId}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tighter">
                            Créée il y a{" "}
                            {Math.floor((Date.now() - room.createdAt) / 60000)}{" "}
                            min
                          </span>
                        </div>

                        <div className="flex items-center justify-center gap-4 w-full lg:w-auto">
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                            <Users className="w-4 h-4 text-[var(--accent-cyan)]" />
                            <span className="text-sm font-black text-[var(--text-primary)]">
                              {room.playerCount}/2
                            </span>
                          </div>
                          <div
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-colors ${
                              isThisRoomJoining
                                ? "bg-[var(--accent-emerald)]/20 text-[var(--accent-emerald)] border border-[var(--accent-emerald)]/30"
                                : !isFull
                                  ? "bg-[var(--accent-emerald)]/10 text-[var(--accent-emerald)] border border-[var(--accent-emerald)]/20 hover:bg-[var(--accent-emerald)]/20"
                                  : "bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-primary)]"
                            }`}
                          >
                            {isThisRoomJoining ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Jointure...
                              </>
                            ) : !isFull ? (
                              "Rejoindre"
                            ) : (
                              "Pleine"
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 rounded-xl bg-[var(--bg-surface)]/20 border border-dashed border-[var(--border-primary)]">
                    <p className="text-sm text-[var(--text-muted)] font-medium italic text-center">
                      Aucune salle publique active...
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer Copyright */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="relative z-10 py-6 text-center mt-auto"
      >
        <p className="text-[var(--text-muted)] text-[10px] font-medium tracking-[0.3em] uppercase opacity-40 hover:opacity-100 transition-opacity">
          © 2026 MR-BUG • Tous droits réservés
        </p>
      </motion.footer>
    </div>
  );
};

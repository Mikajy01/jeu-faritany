import React from "react";
import { useNavigate } from "react-router-dom";
import { Home, MoveLeft } from "lucide-react";
import { motion } from "framer-motion";
import illustration404 from "../assets/images/404-illustration.png";

// Grid component for the background
const Grid = () => (
  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
    <div
      className="absolute inset-0 bg-repeat opacity-[0.03] dark:opacity-10"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, var(--text-primary) 1px, transparent 0)",
        backgroundSize: "3rem 3rem",
      }}
    />
  </div>
);

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] p-6 font-sans">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 h-full w-full bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)] animate-gradient-x pointer-events-none" />
      <Grid />

      {/* Decorative Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[var(--accent-fuchsia)] opacity-10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[var(--accent-cyan)] opacity-10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 max-w-4xl w-full flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20"
      >
        {/* Left Side: Illustration */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative w-full max-w-[320px] md:max-w-[450px] aspect-square flex items-center justify-center"
        >
          {/* Floating Animation */}
          <motion.div
            animate={{
              y: [0, -25, 0],
              rotate: [0, 2, 0, -2, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative z-10 w-full h-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
          >
            <img
              src={illustration404}
              alt="404 Illustration"
              className="w-full h-full object-contain pointer-events-none"
            />
          </motion.div>

          {/* Shadow below illustration */}
          <motion.div
            animate={{
              scale: [1, 0.8, 1],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-black/40 blur-2xl rounded-[100%] z-0"
          />
        </motion.div>

        {/* Right Side: Content */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 max-w-md">
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="inline-block px-4 py-1.5 rounded-full bg-[var(--accent-fuchsia)]/10 border border-[var(--accent-fuchsia)]/20 text-[var(--accent-fuchsia)] text-[10px] font-black uppercase tracking-[0.3em]"
            >
              Erreur 404
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-5xl md:text-6xl font-black tracking-tighter leading-none"
            >
              Territoire <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-fuchsia)] to-[var(--accent-cyan)]">
                Inconnu.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-lg text-[var(--text-secondary)] font-medium leading-relaxed max-w-sm"
            >
              Il semble que vous ayez quitté le plateau de jeu. Cette zone n'a
              pas encore été conquise.
            </motion.p>
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 w-full"
          >
            <motion.button
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/")}
              className="group flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[var(--accent-fuchsia)] to-purple-700 text-white rounded-2xl font-black shadow-xl shadow-purple-900/20 transition-all"
            >
              <Home className="w-5 h-5" />
              Menu Principal
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="group flex items-center justify-center gap-3 px-8 py-4 bg-[var(--bg-surface)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-2xl font-bold border border-[var(--border-primary)] transition-all shadow-lg"
            >
              <MoveLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Revenir
            </motion.button>
          </motion.div>

          {/* Quick Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="pt-8 flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50"
          >
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-emerald)]" />
              Système Opérationnel
            </span>
            <div className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
            <span>MR-BUG • 2026</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Footer Decoration */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent-fuchsia)] to-transparent opacity-20" />
    </div>
  );
};

export default NotFoundPage;

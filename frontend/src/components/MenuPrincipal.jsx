import React from "react";
import { Users, Bot, Globe, Plus, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

// Grid component for the background
const Grid = () => (
  <div className="absolute inset-0 z-0">
    <div
      className="absolute inset-0 bg-repeat"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.1) 1px, transparent 0)",
        backgroundSize: "2rem 2rem",
      }}
    />
  </div>
);

export const MenuPrincipal = ({ onSelectMode }) => {
  const modes = [
    {
      id: "create",
      icon: Plus,
      title: "Créer une partie privée",
      description: "Invitez un ami pour un duel stratégique.",
      color: "text-cyan-300",
    },
    {
      id: "join",
      icon: Users,
      title: "Rejoindre une partie",
      description: "Entrez le code d'une salle pour jouer.",
      color: "text-fuchsia-300",
    },
    {
      id: "random",
      icon: Globe,
      title: "Partie aléatoire",
      description: "Affrontez un adversaire du monde entier.",
      color: "text-lime-300",
    },
    {
      id: "ai",
      icon: Bot,
      title: "Jouer contre l'IA",
      description: "Entraînez-vous contre notre intelligence artificielle.",
      color: "text-amber-300",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
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
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-slate-900 text-white p-4">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 z-0 h-full w-full bg-gradient-to-r from-slate-900 via-black to-slate-900 animate-gradient-x" />
      <Grid />

      {/* Main Content */}
      <motion.div
        className="relative z-10 flex flex-col lg:flex-row items-center justify-center w-full max-w-6xl mx-auto"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Left Side: Title and Game Board */}
        <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left p-8">
          <motion.h1
            className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Jeu Faritany
          </motion.h1>
          <motion.p
            className="text-xl text-slate-300 mb-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            La conquête du territoire par l'esprit.
          </motion.p>

          {/* Stylized Game Board Preview */}
          <motion.div
            className="w-64 h-64 md:w-80 md:h-80 bg-slate-800/50 rounded-2xl shadow-2xl flex items-center justify-center p-4 border border-slate-700"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
          >
            <div
              className="w-full h-full grid grid-cols-9 grid-rows-9"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)",
                backgroundSize: "calc(100% / 9) calc(100% / 9)",
              }}
            >
              {/* Example stones */}
              <div className="col-start-3 row-start-3 w-full h-full flex items-center justify-center">
                <div className="w-3/4 h-3/4 rounded-full bg-white/90 shadow-lg" />
              </div>
              <div className="col-start-7 row-start-6 w-full h-full flex items-center justify-center">
                <div className="w-3/4 h-3/4 rounded-full bg-black/90 shadow-lg" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Menu Options */}
        <motion.div
          className="w-full lg:w-1/2 mt-12 lg:mt-0 flex flex-col space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <motion.button
                key={mode.id}
                onClick={() => onSelectMode(mode.id)}
                className="group relative text-left p-5 rounded-lg transition-all duration-300 ease-in-out overflow-hidden bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700 hover:border-slate-500"
                variants={itemVariants}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center">
                  <Icon
                    className={`w-7 h-7 mr-5 transition-colors duration-300 ${mode.color}`}
                  />
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {mode.title}
                    </h3>
                    <p className="text-slate-400 text-sm">{mode.description}</p>
                  </div>
                  <ArrowRight className="w-6 h-6 ml-auto text-slate-500 group-hover:text-white transition-all duration-300 transform group-hover:translate-x-1" />
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
};

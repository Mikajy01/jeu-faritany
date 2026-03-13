import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

// Grid component for the background
const Grid = () => (
  <div className="absolute inset-0 z-0 pointer-events-none">
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

export const LoadingScreen = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-slate-950 text-white p-4">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 z-0 h-full w-full bg-gradient-to-br from-slate-950 via-slate-900 to-black animate-gradient-x pointer-events-none" />
      <Grid />

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 flex flex-col items-center gap-12"
      >
        {/* Logo Section */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-fuchsia-600 to-purple-700 rounded-[2rem] shadow-2xl mb-6 relative group"
          >
            <Sparkles className="w-12 h-12 text-white" />
            <div className="absolute -inset-4 bg-fuchsia-500/20 blur-3xl rounded-full group-hover:bg-fuchsia-500/40 transition-all duration-1000" />
          </motion.div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-500"
          >
            Jeu Faritany
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-400 font-bold uppercase tracking-[0.4em] text-xs"
          >
            Conquête • Stratégie • Esprit
          </motion.p>
        </div>

        {/* Loading Indicator */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <Loader2 className="w-10 h-10 text-fuchsia-500 animate-spin" />
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-fuchsia-500/20 blur-xl rounded-full"
            />
          </div>

          <div className="space-y-4 text-center">
             <div className="flex items-center justify-center gap-1 text-slate-400">
                <span className="text-sm font-bold uppercase tracking-widest animate-pulse">Initialisation de l'arène</span>
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1] }}
                >...</motion.span>
             </div>
             
             {/* Progress Bar */}
             <div className="w-64 h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-1/2 h-full bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent"
                />
             </div>
          </div>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-12 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em]">Faritany Digital Experience</span>
        <div className="flex gap-1">
           <div className="w-1 h-1 rounded-full bg-slate-800" />
           <div className="w-1 h-1 rounded-full bg-slate-700" />
           <div className="w-1 h-1 rounded-full bg-slate-800" />
        </div>
      </motion.div>
    </div>
  );
};

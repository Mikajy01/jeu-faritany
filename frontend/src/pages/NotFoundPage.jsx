import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search, Ghost } from 'lucide-react';
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

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-slate-950 text-white p-4">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 z-0 h-full w-full bg-gradient-to-br from-slate-950 via-slate-900 to-black animate-gradient-x pointer-events-none" />
      <Grid />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-2xl w-full text-center"
      >
        {/* Error Code */}
        <div className="relative mb-8">
          <motion.h1 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
            className="text-[12rem] md:text-[16rem] font-black leading-none bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-800 opacity-20 select-none"
          >
            404
          </motion.h1>
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-12">
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Ghost className="w-32 h-32 text-fuchsia-500 drop-shadow-[0_0_30px_rgba(217,70,239,0.5)]" />
            </motion.div>
            <h2 className="text-3xl font-black tracking-tight mt-6">Signal Perdu</h2>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs mt-2">Territoire non répertorié</p>
          </div>
        </div>

        {/* Message */}
        <div className="mb-12 space-y-4 max-w-md mx-auto">
          <p className="text-lg text-slate-300 leading-relaxed">
            Oups ! Cette zone du plateau semble avoir été capturée par le néant.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="group flex items-center gap-3 px-8 py-4 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-2xl font-bold border border-slate-700 transition-all"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Retour
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white rounded-2xl font-bold shadow-lg shadow-purple-900/20 transition-all"
          >
            <Home className="w-5 h-5" />
            Menu Principal
          </motion.button>
        </div>

        {/* Quick Links */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 pt-8 border-t border-slate-800/50"
        >
          <div className="flex flex-wrap gap-6 justify-center">
            <button onClick={() => navigate('/join')} className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-fuchsia-400 transition-colors">Rejoindre</button>
            <button onClick={() => navigate('/ai')} className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-fuchsia-400 transition-colors">Duel IA</button>
            <button onClick={() => navigate('/')} className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-fuchsia-400 transition-colors">Accueil</button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;

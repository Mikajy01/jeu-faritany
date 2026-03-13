import React from 'react';
import { Target, Move } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CursorPosition = ({ coord }) => {
  return (
    <div className="px-4 py-3 flex items-center justify-between min-h-[64px]">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-900/50 rounded-lg border border-slate-700/50">
          <Target className="w-4 h-4 text-fuchsia-400" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Coordonnées</span>
      </div>
      
      <AnimatePresence mode="wait">
        {coord ? (
          <motion.div
            key="coord"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-4"
          >
             <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-600 font-bold uppercase">X</span>
                <span className="font-mono text-xl font-black text-white">{coord.x}</span>
             </div>
             <div className="w-px h-4 bg-slate-800" />
             <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-600 font-bold uppercase">Y</span>
                <span className="font-mono text-xl font-black text-white">{coord.y}</span>
             </div>
          </motion.div>
        ) : (
          <motion.div
            key="no-coord"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-slate-600 italic text-xs"
          >
            <Move className="w-3 h-3" />
            Survolez le plateau
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

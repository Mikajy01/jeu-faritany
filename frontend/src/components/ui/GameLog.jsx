import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const GameLog = ({ logs }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div 
      ref={scrollRef}
      className="h-full overflow-y-auto p-4 space-y-2 custom-scrollbar"
    >
      <AnimatePresence initial={false}>
        {logs.map((entry, index) => (
          <motion.div
            key={`${index}-${entry}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[11px] font-medium text-slate-400 p-3 bg-slate-900/40 rounded-xl border border-slate-800/50 flex items-start gap-3 group hover:bg-slate-800/60 transition-colors"
          >
            <span className="text-fuchsia-500/50 font-mono mt-0.5">[{index + 1}]</span>
            <span className="group-hover:text-slate-300 transition-colors">{entry}</span>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {logs.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2 opacity-50">
          <p className="text-xs font-bold uppercase tracking-widest">Aucun événement</p>
        </div>
      )}
    </div>
  );
};


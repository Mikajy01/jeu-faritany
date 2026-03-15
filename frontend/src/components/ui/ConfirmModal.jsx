import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
  variant = "danger", // 'danger' | 'warning' | 'info'
}) => {
  const variants = {
    danger: {
      icon: <AlertTriangle className="w-8 h-8 text-rose-500" />,
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      button: "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20",
    },
    warning: {
      icon: <AlertTriangle className="w-8 h-8 text-yellow-500" />,
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
      button: "bg-yellow-500 hover:bg-yellow-600 text-slate-950 shadow-yellow-500/20",
    },
    info: {
      icon: <AlertTriangle className="w-8 h-8 text-fuchsia-500" />,
      bg: "bg-fuchsia-500/10",
      border: "border-fuchsia-500/20",
      button: "bg-fuchsia-500 hover:bg-fuchsia-600 text-white shadow-fuchsia-500/20",
    },
  };

  const style = variants[variant] || variants.danger;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header / Close Button */}
            <div className="absolute top-4 right-4">
              <button
                onClick={onCancel}
                className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8">
              {/* Icon Container */}
              <div className={`w-16 h-16 ${style.bg} ${style.border} border rounded-2xl flex items-center justify-center mb-6`}>
                {style.icon}
              </div>

              {/* Text */}
              <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">
                {title}
              </h3>
              <p className="text-slate-400 font-medium leading-relaxed">
                {message}
              </p>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onConfirm}
                  className={`flex-1 py-4 rounded-2xl font-bold uppercase tracking-widest transition-all shadow-lg ${style.button}`}
                >
                  {confirmLabel}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onCancel}
                  className="flex-1 py-4 rounded-2xl font-bold uppercase tracking-widest text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition-all border border-slate-700/50"
                >
                  {cancelLabel}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

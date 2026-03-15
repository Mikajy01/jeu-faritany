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
      icon: <AlertTriangle className="w-8 h-8 text-[var(--accent-rose)]" />,
      bg: "bg-[var(--accent-rose)]/10",
      border: "border-[var(--accent-rose)]/20",
      button:
        "bg-[var(--accent-rose)] text-white shadow-[var(--accent-rose)]/20",
    },
    warning: {
      icon: <AlertTriangle className="w-8 h-8 text-[var(--accent-amber)]" />,
      bg: "bg-[var(--accent-amber)]/10",
      border: "border-[var(--accent-amber)]/20",
      button:
        "bg-[var(--accent-amber)] text-slate-950 shadow-[var(--accent-amber)]/20",
    },
    info: {
      icon: <AlertTriangle className="w-8 h-8 text-[var(--accent-fuchsia)]" />,
      bg: "bg-[var(--accent-fuchsia)]/10",
      border: "border-[var(--accent-fuchsia)]/20",
      button:
        "bg-[var(--accent-fuchsia)] text-white shadow-[var(--accent-fuchsia)]/20",
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
            className="absolute inset-0 bg-[var(--bg-primary)]/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header / Close Button */}
            <div className="absolute top-4 right-4">
              <button
                onClick={onCancel}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8">
              {/* Icon Container */}
              <div
                className={`w-16 h-16 ${style.bg} ${style.border} border rounded-2xl flex items-center justify-center mb-6`}
              >
                {style.icon}
              </div>

              {/* Text */}
              <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2 uppercase tracking-tighter">
                {title}
              </h3>
              <p className="text-[var(--text-secondary)] font-medium leading-relaxed">
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
                  className="flex-1 py-4 rounded-2xl font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-secondary)] transition-all border border-[var(--border-primary)]"
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

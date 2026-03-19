import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function ToastHost() {
  const [toasts, setToasts] = useState([]);
  const timeoutsRef = useRef(new Map());

  useEffect(() => {
    const handler = (event) => {
      const detail = event?.detail || {};
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const title = typeof detail.title === "string" ? detail.title : "";
      const message = typeof detail.message === "string" ? detail.message : "";
      const variant = detail.variant === "danger" ? "danger" : "default";
      const durationMs =
        typeof detail.durationMs === "number" ? detail.durationMs : 3500;

      setToasts((prev) => [...prev, { id, title, message, variant }].slice(-3));

      const timeoutId = window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        timeoutsRef.current.delete(id);
      }, durationMs);
      timeoutsRef.current.set(id, timeoutId);
    };

    window.addEventListener("faritany:toast", handler);
    return () => {
      window.removeEventListener("faritany:toast", handler);
      for (const timeoutId of timeoutsRef.current.values()) {
        window.clearTimeout(timeoutId);
      }
      timeoutsRef.current.clear();
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed z-[9999] pointer-events-none top-4 right-4 lg:top-6 lg:right-6 flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))] items-end">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            role="status"
            aria-live="polite"
            className={`pointer-events-auto rounded-2xl border bg-[var(--bg-surface)]/85 backdrop-blur-xl shadow-lg shadow-black/10 p-4 text-[var(--text-primary)] ${
              t.variant === "danger"
                ? "border-rose-500/30"
                : "border-[var(--border-primary)]"
            }`}
          >
            {t.title ? (
              <div className="text-xs font-black uppercase tracking-widest opacity-80">
                {t.title}
              </div>
            ) : null}
            {t.message ? (
              <div className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
                {t.message}
              </div>
            ) : null}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

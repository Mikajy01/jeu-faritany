import React, { useState, useEffect, useRef } from "react";

export const ChessTimer = ({
  timeLeft,
  isActive,
  isLowTime = false,
  onTimeUp,
  compact = false,
  minimalist = false,
}) => {
  const [displayTime, setDisplayTime] = useState(timeLeft);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const remainingTimeRef = useRef(timeLeft);

  useEffect(() => {
    remainingTimeRef.current = timeLeft;
    setDisplayTime(timeLeft);
  }, [timeLeft]);

  useEffect(() => {
    if (isActive && remainingTimeRef.current > 0) {
      startTimeRef.current = Date.now();

      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const newTime = Math.max(0, remainingTimeRef.current - elapsed);

        setDisplayTime(newTime);

        if (newTime === 0) {
          clearInterval(intervalRef.current);
          if (onTimeUp) onTimeUp();
        }
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, onTimeUp]);

  const formatTime = (seconds) => {
    if (seconds <= 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isLow = displayTime <= 30 || isLowTime;
  const isCritical = displayTime <= 10;

  return (
    <div
      className={`
      ${minimalist ? "text-sm" : compact ? "text-lg" : "text-2xl sm:text-3xl"}
      ${
        isActive
          ? isCritical
            ? "text-[var(--accent-rose)] drop-shadow-[0_0_8px_rgba(244,63,94,0.5)] animate-pulse"
            : isLow
              ? "text-[var(--accent-amber)] drop-shadow-[0_0_5px_rgba(251,191,36,0.3)]"
              : "text-[var(--text-primary)]"
          : "text-[var(--text-muted)]"
      }
    `}
    >
      {formatTime(displayTime)}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';

export const ChessTimer = ({ 
  timeLeft, 
  isActive, 
  isLowTime = false,
  onTimeUp,
  compact = false
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
    if (seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isLow = displayTime <= 30 || isLowTime;
  const isCritical = displayTime <= 10;

  if (compact) {
    return (
      <div className={`
        relative px-1.5 py-0.5 rounded font-mono font-bold text-[10px]
        transition-all duration-300
        ${isActive 
          ? isCritical 
            ? 'bg-red-500 text-white shadow-md shadow-red-500/50 animate-pulse' 
            : isLow 
              ? 'bg-orange-500 text-white shadow-sm' 
              : 'bg-slate-700 text-white shadow-sm'
          : 'bg-slate-200 text-slate-600'
        }
      `}>
        <div className="flex items-center justify-center gap-1">
          {isActive && (
            <div className={`
              w-1 h-1 rounded-full flex-shrink-0
              ${isCritical ? 'bg-white animate-pulse' : isLow ? 'bg-white' : 'bg-green-400'}
            `} />
          )}
          <span className="tabular-nums">{formatTime(displayTime)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      relative px-2 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg font-mono font-bold text-sm sm:text-lg
      transition-all duration-300
      ${isActive 
        ? isCritical 
          ? 'bg-red-500 text-white shadow-lg shadow-red-500/50 animate-pulse' 
          : isLow 
            ? 'bg-orange-500 text-white shadow-md' 
            : 'bg-slate-700 text-white shadow-md'
        : 'bg-slate-200 text-slate-600'
      }
    `}>
      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        {isActive && (
          <div className={`
            w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0
            ${isCritical ? 'bg-white animate-pulse' : isLow ? 'bg-white' : 'bg-green-400'}
          `} />
        )}
        <span className="tabular-nums">{formatTime(displayTime)}</span>
      </div>
    </div>
  );
};


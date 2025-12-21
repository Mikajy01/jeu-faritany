import React from 'react';
import { ChessTimer } from './ChessTimer';

export const PlayerCard = ({ 
  player, 
  score, 
  isCurrentPlayer, 
  isActive,
  isYou,
  timeLeft = 600, // 10 minutes par défaut
  onTimeUp,
  compact = false
}) => {
  const color = player === 1 ? 'red' : 'blue';
  const colorClasses = {
    red: {
      bg: 'bg-red-50',
      border: 'border-red-300',
      text: 'text-red-700',
      dot: 'bg-red-500',
      active: 'bg-red-100 border-red-400 shadow-lg shadow-red-200',
      glow: 'shadow-red-300'
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      text: 'text-blue-700',
      dot: 'bg-blue-500',
      active: 'bg-blue-100 border-blue-400 shadow-lg shadow-blue-200',
      glow: 'shadow-blue-300'
    }
  };

  const colors = colorClasses[color];
  const isActiveTurn = isCurrentPlayer && isActive;

  if (compact) {
    return (
      <div className={`
        relative bg-white rounded-lg border-2 transition-all duration-300
        ${isActiveTurn ? colors.active : `${colors.bg} ${colors.border}`}
        ${isActiveTurn ? 'scale-105 z-10 shadow-xl' : 'shadow-md'}
        overflow-hidden
        min-w-[140px] max-w-[160px]
      `}>
        {/* Barre de couleur en haut */}
        <div className={`
          h-0.5 w-full
          ${isActiveTurn ? colors.dot : 'bg-slate-300'}
          transition-colors duration-300
        `} />
        
        <div className="p-1.5 space-y-1">
          {/* En-tête avec nom du joueur et score */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1 min-w-0">
              <div className={`
                w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}
                ${isActiveTurn ? 'animate-pulse' : ''}
              `} />
              <span className={`
                font-semibold text-[20px] truncate
                ${colors.text}
              `}>
                J{player}
                {isYou && (
                  <span className="ml-0.5 text-[9px] font-normal text-slate-500">
                    (Vous)
                  </span>
                )}
              </span>
            </div>
            
            {/* Score */}
            <div className={`
              px-1.5 py-0.5 rounded font-bold text-[20px] flex-shrink-0
              ${isActiveTurn ? 'bg-white ' + colors.text : 'bg-slate-100 text-slate-700'}
              transition-all duration-300
            `}>
              {score}
            </div>
          </div>

          {/* Pendule compact */}
          <div className="flex justify-center">
            <ChessTimer 
              timeLeft={timeLeft}
              isActive={isActiveTurn}
              isLowTime={timeLeft <= 30}
              onTimeUp={onTimeUp}
              compact={true}
            />
          </div>
        </div>

        {/* Indicateur de tour actif */}
        {isActiveTurn && (
          <div className="absolute top-1 right-1">
            <div className={`
              w-1.5 h-1.5 rounded-full ${colors.dot} animate-pulse
            `} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`
      relative bg-white rounded-lg sm:rounded-xl border-2 transition-all duration-300
      ${isActiveTurn ? colors.active : `${colors.bg} ${colors.border}`}
      ${isActiveTurn ? 'scale-[1.02] sm:scale-105 z-10' : ''}
      overflow-hidden
      w-full max-w-[180px] sm:max-w-none
    `}>
      {/* Barre de couleur en haut */}
      <div className={`
        h-1 w-full
        ${isActiveTurn ? colors.dot : 'bg-slate-300'}
        transition-colors duration-300
      `} />
      
      <div className="p-2 sm:p-4 space-y-2 sm:space-y-3">
        {/* En-tête avec nom du joueur */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className={`
              w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${colors.dot}
              ${isActiveTurn ? 'animate-pulse' : ''}
            `} />
            <span className={`
              font-semibold text-xs sm:text-base truncate
              ${colors.text}
            `}>
              Joueur {player}
              {isYou && (
                <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs font-normal text-slate-500">
                  (Vous)
                </span>
              )}
            </span>
          </div>
          
          {/* Score */}
          <div className={`
            px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg font-bold text-sm sm:text-lg flex-shrink-0
            ${isActiveTurn ? 'bg-white ' + colors.text : 'bg-slate-100 text-slate-700'}
            transition-all duration-300
          `}>
            {score}
          </div>
        </div>

        {/* Pendule */}
        <div className="flex justify-center">
          <ChessTimer 
            timeLeft={timeLeft}
            isActive={isActiveTurn}
            isLowTime={timeLeft <= 30}
            onTimeUp={onTimeUp}
          />
        </div>
      </div>

      {/* Indicateur de tour actif */}
      {isActiveTurn && (
        <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2">
          <div className={`
            w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${colors.dot} animate-pulse
          `} />
        </div>
      )}
    </div>
  );
};


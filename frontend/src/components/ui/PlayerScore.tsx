import React from 'react';

export const PlayerScore = ({ player, score, isCurrentPlayer }) => {
  const color = player === 1 ? 'red' : 'blue';
  const borderColor = isCurrentPlayer ? `border-${color}-400 bg-${color}-50 shadow-md` : 'border-slate-200 bg-slate-50';
  
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${borderColor}`}>
      <span className="font-medium text-slate-700">Joueur {player}</span>
      <div className="flex items-center gap-2">
        <div className={`w-4 h-4 rounded-full bg-${color}-500`}></div>
        <span className="font-bold text-lg text-slate-800">{score}</span>
      </div>
    </div>
  );
};
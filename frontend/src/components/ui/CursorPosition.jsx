import React from 'react';

export const CursorPosition = ({ coord }) => {
  if (!coord) return null;
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 border border-slate-200">
      <h3 className="font-semibold text-slate-800 mb-2">🎯 Position du curseur</h3>
      <div className="bg-slate-100 rounded-lg p-3 text-center">
        <span className="font-mono text-lg text-slate-700">
          ({coord.x}, {coord.y})
        </span>
      </div>
    </div>
  );
};
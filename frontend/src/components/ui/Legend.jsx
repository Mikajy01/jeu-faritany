import React from 'react';

export const Legend = () => (
  <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
    <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200">
      <div className="w-4 h-4 bg-red-500 bg-opacity-20 border border-red-300 rounded"></div>
      <span className="text-red-700 font-medium">Zone prison (Joueur 1)</span>
    </div>
    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
      <div className="w-4 h-4 bg-blue-500 bg-opacity-20 border border-blue-300 rounded"></div>
      <span className="text-blue-700 font-medium">Zone prison (Joueur 2)</span>
    </div>
    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
      <div className="w-4 h-0 border-t-2 border-dashed border-slate-400"></div>
      <span className="text-slate-700 font-medium">Barreaux diagonaux</span>
    </div>
  </div>
);
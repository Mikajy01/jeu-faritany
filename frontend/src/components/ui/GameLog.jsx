import React from 'react';

export const GameLog = ({ logs }) => (
  <div className="bg-white rounded-xl shadow-lg p-4 border border-slate-200">
    <h3 className="font-semibold text-slate-800 mb-3">📋 Journal de Jeu</h3>
    <div className="max-h-64 overflow-y-auto space-y-1">
      {logs.map((entry, index) => (
        <div key={index} className="text-xs text-slate-600 p-2 bg-slate-50 rounded border-l-2 border-slate-300">
          {entry}
        </div>
      ))}
    </div>
  </div>
);
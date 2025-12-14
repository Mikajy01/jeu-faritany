import React from 'react';

export const TurnIndicator = ({ gameActive, playerId, currentPlayer }) => {
  const message = !gameActive
    ? "En attente d'un adversaire..."
    : playerId === currentPlayer
      ? 'À votre tour !'
      : "En attente de l'adversaire...";

  return (
    <div className="mt-4 p-3 bg-slate-100 rounded-lg text-center">
      <span className="text-slate-700 font-medium">{message}</span>
    </div>
  );
};
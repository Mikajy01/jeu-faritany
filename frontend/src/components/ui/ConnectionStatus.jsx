import React from 'react';

export const ConnectionStatus = ({ status }) => {
  const getStatusColor = () => {
    if (status.includes('Connecté')) return 'text-green-600 bg-green-100';
    if (status.includes('Erreur') || status.includes('Déconnecté')) return 'text-red-600 bg-red-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  return (
    <div className={`text-sm font-medium px-3 py-2 rounded-lg text-center mb-4 ${getStatusColor()}`}>
      {status}
    </div>
  );
};
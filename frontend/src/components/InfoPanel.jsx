import React from 'react';
import { ConnectionStatus } from './ui/ConnectionStatus';
import { PlayerScore } from './ui/PlayerScore';
import { TurnIndicator } from './ui/TurnIndicator';
import { CursorPosition } from './ui/CursorPosition';
import { GameLog } from './ui/GameLog';

export const InfoPanel = ({ 
  connectionStatus, 
  gameState, 
  hoveredCoord, 
  gameLog, 
  onResetGame 
}) => {
  return (
    <div className="lg:col-span-1 space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 mb-4 text-center">Jeu Faritany</h1>

        <ConnectionStatus status={connectionStatus} />

        <div className="space-y-3">
          <PlayerScore 
            player={1} 
            score={gameState.scores.player1} 
            isCurrentPlayer={gameState.currentPlayer === 1} 
          />
          <PlayerScore 
            player={2} 
            score={gameState.scores.player2} 
            isCurrentPlayer={gameState.currentPlayer === 2} 
          />
        </div>

        <TurnIndicator 
          gameActive={gameState.gameActive}
          playerId={gameState.playerId}
          currentPlayer={gameState.currentPlayer}
        />

        <button 
          onClick={onResetGame}
          className="w-full mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md"
        >
          Nouvelle Partie
        </button>
      </div>

      <CursorPosition coord={hoveredCoord} />
      <GameLog logs={gameLog} />
    </div>
  );
};
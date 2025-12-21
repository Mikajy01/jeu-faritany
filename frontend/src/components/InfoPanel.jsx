import React from "react";
import { ConnectionStatus } from "./ui/ConnectionStatus";
import { TurnIndicator } from "./ui/TurnIndicator";
import { CursorPosition } from "./ui/CursorPosition";
import { GameLog } from "./ui/GameLog";
import { ArrowLeft, Copy } from "lucide-react";

export const InfoPanel = ({
  connectionStatus,
  gameState,
  hoveredCoord,
  gameLog,
  onResetGame,
  onBackToMenu,
  roomCode,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="lg:col-span-1 space-y-4 sm:space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 text-center flex-1 pr-8 lg:pr-0">
            Jeu Faritany
          </h1>
          {onBackToMenu && (
            <button
              onClick={onBackToMenu}
              className="flex items-center gap-1 px-2 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors ml-2"
              title="Retour au menu"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Menu</span>
            </button>
          )}
        </div>

        <ConnectionStatus status={connectionStatus} />

        {roomCode && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-blue-800 mb-1">
                  Code de la salle
                </div>
                <div className="text-base sm:text-lg font-mono font-bold text-blue-600">
                  {roomCode}
                </div>
              </div>
              <button
                onClick={handleCopyRoomCode}
                className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                title="Copier le code"
              >
                {copied ? (
                  <span className="text-xs text-green-600 font-medium">✓</span>
                ) : (
                  <Copy className="w-4 h-4 text-blue-600" />
                )}
              </button>
            </div>
          </div>
        )}

        <TurnIndicator
          gameActive={gameState.gameActive}
          playerId={gameState.playerId}
          currentPlayer={gameState.currentPlayer}
        />

        <button
          onClick={onResetGame}
          className="w-full mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md text-sm sm:text-base"
        >
          Nouvelle Partie
        </button>
      </div>

      <CursorPosition coord={hoveredCoord} />
      <GameLog logs={gameLog} />
    </div>
  );
};

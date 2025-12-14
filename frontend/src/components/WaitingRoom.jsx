import React from "react";
import { Users, Copy, Share2, CheckCircle } from "lucide-react";

export function WaitingRoom({ 
  roomCode, 
  playerCount, 
  onCancel, 
  onStartGame, 
  onShareLink 
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyCode = () => {
    if (navigator.clipboard && roomCode) {
      navigator.clipboard.writeText(roomCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleShareLink = () => {
    onShareLink?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 space-y-3 sm:space-y-4">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-purple-100 rounded-full mb-3 sm:mb-4">
              <Users className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
              Salle d'attente
            </h1>
            <p className="text-sm sm:text-base text-slate-600 px-2">
              {playerCount === 1 
                ? "En attente d'un adversaire..." 
                : "Adversaire trouvé ! La partie va commencer..."}
            </p>
          </div>

          {/* Room Code Section */}
          {roomCode && (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg sm:rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="text-center">
                <p className="text-xs sm:text-sm font-medium text-slate-600 mb-2">
                  Code de la partie
                </p>
                <div className="relative">
                  <div 
                    onClick={handleCopyCode}
                    className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold text-slate-800 tracking-wider cursor-pointer hover:text-purple-600 transition-colors select-all break-all"
                  >
                    {roomCode}
                  </div>
                  {copied && (
                    <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Cliquez pour copier le code
                </p>
              </div>

              {/* Share Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={handleCopyCode}
                  className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-white text-slate-700 rounded-lg text-sm sm:text-base font-medium hover:bg-slate-50 transition-all border border-slate-200"
                >
                  <Copy className="w-4 h-4" />
                  <span className="hidden xs:inline">Copier le code</span>
                  <span className="xs:hidden">Copier</span>
                </button>
                <button
                  onClick={handleShareLink}
                  className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg text-sm sm:text-base font-medium hover:from-purple-600 hover:to-purple-700 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden xs:inline">Partager le lien</span>
                  <span className="xs:hidden">Partager</span>
                </button>
              </div>

              <div className="text-center">
                <p className="text-xs text-slate-500 px-2">
                  💡 Partagez ce code ou le lien avec votre adversaire
                </p>
              </div>
            </div>
          )}

          {/* Players Status - Compact on mobile */}
          <div className="bg-slate-100 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <div className="flex -space-x-2">
                {[...Array(playerCount)].map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-white flex items-center justify-center text-white text-sm sm:text-base font-semibold shadow-md"
                  >
                    {i + 1}
                  </div>
                ))}
                {playerCount < 2 && (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center shadow-md">
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse" />
                  </div>
                )}
              </div>
              <span className="text-sm sm:text-base text-slate-700 font-medium">
                {playerCount}/2 joueurs
              </span>
            </div>
          </div>

          {/* Loading Animation */}
          {playerCount === 1 && (
            <div className="flex justify-center py-1">
              <div className="flex gap-1.5 sm:gap-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-200">
            <button
              onClick={onCancel}
              className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-200 text-slate-700 rounded-lg text-sm sm:text-base font-semibold hover:bg-slate-300 transition-colors"
            >
              Annuler
            </button>
            {playerCount === 2 && (
              <button
                onClick={onStartGame}
                disabled
                className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm sm:text-base font-semibold opacity-50 cursor-wait"
              >
                Démarrage...
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
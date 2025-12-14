import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

export const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        {/* Logo / Titre animé */}
        <div className="mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl mb-4 animate-pulse-slow">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
            Jeu Faritany
          </h1>
          <p className="text-slate-400 text-sm">Stratégie • Capture • Victoire</p>
        </div>

        {/* Spinner principal */}
        <div className="relative mb-6">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
          
          {/* Cercles animés en arrière-plan */}
          <div className="absolute inset-0 flex items-center justify-center -z-10">
            <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full animate-ping" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center -z-10 animation-delay-150">
            <div className="w-20 h-20 border-4 border-purple-500/20 rounded-full animate-ping" />
          </div>
        </div>

        {/* Texte de chargement avec points animés */}
        <div className="flex items-center justify-center gap-1 text-slate-300">
          <span className="text-lg font-medium">Chargement</span>
          <span className="flex gap-1">
            <span className="animate-bounce-dot animation-delay-0">.</span>
            <span className="animate-bounce-dot animation-delay-150">.</span>
            <span className="animate-bounce-dot animation-delay-300">.</span>
          </span>
        </div>

        {/* Barre de progression (optionnelle) */}
        <div className="mt-8 w-64 mx-auto">
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-loading-bar" />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }

        @keyframes bounce-dot {
          0%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-8px);
          }
        }

        @keyframes loading-bar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .animate-bounce-dot {
          animation: bounce-dot 1.4s ease-in-out infinite;
          display: inline-block;
        }

        .animate-loading-bar {
          animation: loading-bar 1.5s ease-in-out infinite;
        }

        .animation-delay-0 {
          animation-delay: 0s;
        }

        .animation-delay-150 {
          animation-delay: 0.15s;
        }

        .animation-delay-300 {
          animation-delay: 0.3s;
        }
      `}</style>
    </div>
  );
};
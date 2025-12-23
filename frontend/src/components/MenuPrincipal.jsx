import React, { useState } from 'react';
import { Users, Bot, Globe, Plus } from 'lucide-react';
import backgroundImage from '@/assets/images/background.png';


export const MenuPrincipal = ({ onSelectMode }) => {

  const modes = [
    {
      id: 'create',
      icon: Plus,
      title: 'Créer une partie',
      description: 'Créez une salle et invitez vos amis',
      gradient: 'from-blue-500 to-blue-600',
      hoverGradient: 'hover:from-blue-600 hover:to-blue-700',
    },
    {
      id: 'join',
      icon: Users,
      title: 'Rejoindre une partie',
      description: 'Entrez un code de salle à 6 caractères',
      gradient: 'from-purple-500 to-purple-600',
      hoverGradient: 'hover:from-purple-600 hover:to-purple-700',
    },
    {
      id: 'random',
      icon: Globe,
      title: 'Partie aléatoire',
      description: 'Rejoignez une salle publique',
      gradient: 'from-green-500 to-green-600',
      hoverGradient: 'hover:from-green-600 hover:to-green-700',
    },
    {
      id: 'ai',
      icon: Bot,
      title: 'Jouer contre l\'IA',
      description: 'Affrontez l\'ordinateur',
      gradient: 'from-orange-500 to-orange-600',
      hoverGradient: 'hover:from-orange-600 hover:to-orange-700',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4">

  {/* Background */}
  <div
    className="absolute inset-0 bg-cover bg-center scale-105"
    style={{ backgroundImage: `url(${backgroundImage})` }}
  />

  <div className="absolute inset-0 bg-black/50" />
  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-800/70 to-slate-900/70" />

  {/* Content */}
  <div className="relative z-10 w-full max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            Jeu Faritany
          </h1>
          <p className="text-xl text-slate-300">
            Choisissez votre mode de jeu
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => 
                    onSelectMode(mode.id)
                  
                }
                className={`group relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 p-8 text-left overflow-hidden`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <div className="relative">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${mode.gradient} rounded-xl mb-4 shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">
                    {mode.title}
                  </h3>
                  
                  <p className="text-slate-600">
                    {mode.description}
                  </p>

                  <div className="mt-6 flex items-center text-sm font-semibold">
                    <span className={`bg-gradient-to-r ${mode.gradient} bg-clip-text text-transparent`}>
                      Commencer
                    </span>
                    <svg 
                      className={`ml-2 w-4 h-4 text-${mode.gradient.split('-')[1]}-500 transform group-hover:translate-x-1 transition-transform`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-400 text-sm">
            Placez vos points stratégiquement pour capturer les territoires adverses
          </p>
        </div>
      </div>
    </div>
  );
};
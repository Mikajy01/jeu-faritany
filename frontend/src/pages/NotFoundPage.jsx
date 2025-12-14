import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import NotFoundIllustration from '../assets/images/404-illustration.png';


const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Code d'erreur */}
        <div className="mb-2">
          <h1 className="text-9xl md:text-[12rem] font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 leading-none mb-4">
            404
          </h1>
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <Search className="w-5 h-5" />
            <p className="text-xl md:text-2xl font-semibold">Page introuvable</p>
          </div>
        </div>

        {/* Illustration */}
        <div className="mb-1">
          <div className="relative inline-block">
            {/* Container avec effet de glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 blur-3xl rounded-full" />
            
            {/* Image d'illustration */}
            <img 
              src={NotFoundIllustration} 
              alt="Page non trouvée" 
              className="relative w-64 h-52 md:w-80 md:h-52 object-contain mx-auto animate-float"
              onError={(e) => {
                // Fallback si l'image ne charge pas
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            
            {/* Fallback si pas d'image */}
            <div className="hidden w-64 h-52 md:w-80 md:h-52 items-center justify-center bg-slate-800/50 rounded-2xl border-2 border-slate-700 mx-auto">
              <Search className="w-32 h-32 text-slate-600" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="mb-4 space-y-2">
          <p className="text-lg text-slate-300">
            Oups ! Cette page semble s'être perdue dans le plateau de jeu.
          </p>
          <p className="text-sm text-slate-500">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 px-6 py-3 bg-slate-800 text-slate-200 rounded-xl font-medium hover:bg-slate-700 transition-all duration-200 border border-slate-700 hover:border-slate-600"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Retour
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Home className="w-5 h-5" />
            Retour à l'accueil
          </button>
        </div>

        {/* Liens rapides */}
        <div className="mt-12 pt-8 border-t border-slate-700">
          <p className="text-sm text-slate-500 mb-4">Liens rapides :</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => navigate('/join')}
              className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
            >
              Rejoindre une partie
            </button>
            <span className="text-slate-700">•</span>
            <button
              onClick={() => navigate('/waiting-room')}
              className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
            >
              Nouvelle partie
            </button>
            <span className="text-slate-700">•</span>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
            >
              Accueil
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default NotFoundPage;
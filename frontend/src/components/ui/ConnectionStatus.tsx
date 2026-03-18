import React from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

export const ConnectionStatus = ({ status }) => {
  const isConnected = status.toLowerCase().includes('connecté');
  const isError = status.toLowerCase().includes('erreur') || status.toLowerCase().includes('déconnecté');
  const isConnecting = !isConnected && !isError;

  return (
    <div className={`
      flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all duration-500
      ${isConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}
      ${isError ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : ''}
      ${isConnecting ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : ''}
    `}>
      {isConnected && <Wifi className="w-3 h-3" />}
      {isError && <WifiOff className="w-3 h-3" />}
      {isConnecting && <Loader2 className="w-3 h-3 animate-spin" />}
      {status}
    </div>
  );
};

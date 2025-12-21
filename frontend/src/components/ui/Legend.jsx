import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export const Legend = ({ stageScale, onZoomChange, onResetZoom }) => {
  const minZoom = 1;
  const maxZoom = 3;
  const zoomPercentage = Math.round(stageScale * 100);

  const handleSliderChange = (e) => {
    const newScale = parseFloat(e.target.value);
    if (onZoomChange) {
      onZoomChange(newScale);
    }
  };

  const handleZoomIn = () => {
    const newScale = Math.min(maxZoom, stageScale + 0.1);
    if (onZoomChange) {
      onZoomChange(newScale);
    }
  };

  const handleZoomOut = () => {
    const newScale = Math.max(minZoom, stageScale - 0.1);
    if (onZoomChange) {
      onZoomChange(newScale);
    }
  };

  return (
    <div className="lg:hidden mt-4 space-y-3">
      <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 text-center">
        <p>Double-tap pour placer un point</p>
      </div>
      
      {/* Contrôle de zoom */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-700">Zoom</span>
          <span className="text-xs font-semibold text-slate-800">{zoomPercentage}%</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Bouton zoom out */}
          <button
            onClick={handleZoomOut}
            disabled={stageScale <= minZoom}
            className="p-1.5 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Zoom arrière"
          >
            <ZoomOut className="w-4 h-4 text-slate-700" />
          </button>
          
          {/* Slider */}
          <input
            type="range"
            min={minZoom}
            max={maxZoom}
            step={0.1}
            value={stageScale}
            onChange={handleSliderChange}
            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((stageScale - minZoom) / (maxZoom - minZoom)) * 100}%, #e2e8f0 ${((stageScale - minZoom) / (maxZoom - minZoom)) * 100}%, #e2e8f0 100%)`
            }}
          />
          
          {/* Bouton zoom in */}
          <button
            onClick={handleZoomIn}
            disabled={stageScale >= maxZoom}
            className="p-1.5 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Zoom avant"
          >
            <ZoomIn className="w-4 h-4 text-slate-700" />
          </button>
          
          {/* Bouton reset */}
          {stageScale > 1 && (
            <button
              onClick={onResetZoom}
              className="p-1.5 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
              aria-label="Réinitialiser le zoom"
              title="Réinitialiser le zoom"
            >
              <RotateCcw className="w-4 h-4 text-slate-700" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
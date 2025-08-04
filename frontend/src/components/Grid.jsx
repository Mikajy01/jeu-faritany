import React, { useEffect, useRef } from 'react';
import Intersection from './Intersection';

const Grid = ({ gridIndex, grid, handleMove }) => {
  const gridRef = useRef(null);
  const gridSize = 5;

  useEffect(() => {
    // Créer les lignes de la grille
    const gridElement = gridRef.current;
    if (!gridElement) return;

    const lines = document.createElement('div');
    lines.className = 'grid-lines';
    
    // Lignes horizontales et verticales
    for (let i = 0; i < gridSize; i++) {
      const hLine = document.createElement('div');
      hLine.style.cssText = `
        position: absolute;
        left: 10%;
        right: 10%;
        height: 1px;
        background: rgba(0,0,0,0.3);
        top: ${10 + i * 20}%;
      `;
      lines.appendChild(hLine);

      const vLine = document.createElement('div');
      vLine.style.cssText = `
        position: absolute;
        top: 10%;
        bottom: 10%;
        width: 1px;
        background: rgba(0,0,0,0.3);
        left: ${10 + i * 20}%;
      `;
      lines.appendChild(vLine);
    }
    
    gridElement.appendChild(lines);

    return () => {
      if (gridElement && lines.parentNode === gridElement) {
        gridElement.removeChild(lines);
      }
    };
  }, [gridSize]);

  return (
    <div className="grid" ref={gridRef} data-grid-index={gridIndex}>
      {grid.map((value, index) => {
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        return (
          <Intersection
            key={index}
            gridIndex={gridIndex}
            index={index}
            row={row}
            col={col}
            value={value}
            handleMove={handleMove}
          />
        );
      })}
    </div>
  );
};

export default Grid;
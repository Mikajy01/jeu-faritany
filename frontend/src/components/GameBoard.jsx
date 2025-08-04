import React from 'react';
import Grid from './Grid';

const GameBoard = ({ gameState, handleMove }) => {
    console.log(gameState)
  return (
    <div className="game-board">
      <h2 style={{ color: '#333', textAlign: 'center', marginBottom: '20px' }}>Plateau de Jeu</h2>
      <div className="grid-container">
        {gameState.grids.map((grid, gridIndex) => (
          <Grid 
            key={gridIndex}
            gridIndex={gridIndex}
            grid={grid}
            handleMove={handleMove}
          />
        ))}
      </div>
    </div>
  );
};

export default GameBoard;
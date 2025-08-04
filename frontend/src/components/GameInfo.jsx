import React from 'react';

const GameInfo = ({ gameState, connectionStatus, gameLog, resetGame }) => {
  const connectionStatusClass = () => {
    if (connectionStatus.includes('Connecté')) return 'connected';
    if (connectionStatus.includes('Erreur') || connectionStatus.includes('Déconnecté')) return 'disconnected';
    return 'waiting';
  };

  return (
    <div className="game-info">
      <h1>🎯 Jeu d'Encerclement</h1>
      
      <div id="connectionStatus" className={`connection-status ${connectionStatusClass()}`}>
        {connectionStatus}
      </div>

      <div className="player-info">
        <div className={`player ${gameState.currentPlayer === 1 ? 'active' : ''}`} id="player1Info">
          <div>Joueur 1</div>
          <div style={{ color: '#e74c3c' }}>●</div>
          <div className="score" id="player1Score">{gameState.scores.player1}</div>
        </div>
        <div className={`player ${gameState.currentPlayer === 2 ? 'active' : ''}`} id="player2Info">
          <div>Joueur 2</div>
          <div style={{ color: '#3498db' }}>●</div>
          <div className="score" id="player2Score">{gameState.scores.player2}</div>
        </div>
      </div>

      <div className="status" id="gameStatus">
        {!gameState.gameActive 
          ? 'En attente d\'un adversaire...' 
          : gameState.playerId === gameState.currentPlayer 
            ? 'À votre tour de jouer' 
            : 'En attente du joueur adverse...'}
      </div>

      <button onClick={resetGame}>Nouvelle Partie</button>

      <h3>📋 Journal de jeu</h3>
      <div className="game-log">
        {gameLog.map((entry, index) => (
          <div key={index} className="log-entry">{entry}</div>
        ))}
      </div>

      <h3>📖 Règles</h3>
      <div style={{ fontSize: '14px', opacity: '0.9' }}>
        <p>• Placez vos points sur les intersections libres</p>
        <p>• Encerclez les points adverses pour marquer des points</p>
        <p>• Le joueur avec le plus de points gagne</p>
      </div>
    </div>
  );
};

export default GameInfo;
export class GameState {
  constructor(data = {}) {
    this.grid = this._parseGrid(data.grid);
    this.currentPlayer = data.currentPlayer || 1;
    this.playerId = data.playerId || null;
    this.gameId = data.gameId || null;
    this.code = data.code || null;
    this.scores = data.scores || { player1: 0, player2: 0 };
    this.gameActive = data.gameActive ?? false;
    this.gameOver = data.gameOver || null;
    this.capturedAreas = data.capturedAreas || [];
    this.player1Score = data.player1Score || 0;
    this.player2Score = data.player2Score || 0;
    this.player1Online = data.player1Online ?? true;
    this.player2Online = data.player2Online ?? true;
    this.timeControl = data.timeControl || {
      moveTimeLimit: 0,
      gameDurationLimit: 0,
      gameMode: "TIME",
      targetScore: 20,
    };
    this.clock = data.clock || {
      remainingMoveTime: 0,
      remainingGameTime: 0,
      gameStartTime: null,
      lastMoveTimestamp: null,
    };
  }

  _parseGrid(gridData) {
    const gridMap = new Map();
    if (gridData) {
      Object.entries(gridData).forEach(([key, value]) => {
        if (value !== 0) gridMap.set(key, value);
      });
    }
    return gridMap;
  }

  static fromServer(data) {
    return new GameState({
      ...data.gameState,
      gameId: data.gameState?.gameId || data.code,
      playerId: data.playerId,
    });
  }
}

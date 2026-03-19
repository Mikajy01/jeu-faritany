import { DEFAULT_GRID_SIZE } from "../../constants/game";

export class GameState {
  grid: Map<string, any>;
  move: any;
  currentPlayer: number;
  playerId: number | null;
  gameId: string | null;
  code: string | null;
  gridSize: number;
  scores: any;
  gameActive: boolean;
  gameOver: any;
  capturedAreas: any[];
  player1Score: number;
  player2Score: number;
  player1Online: boolean;
  player2Online: boolean;
  player1Left: boolean;
  player2Left: boolean;
  timeControl: any;
  clock: any;

  constructor(data: any = {}) {
    this.grid = this._parseGrid(data.grid);
    this.move = data.move ?? null;
    this.currentPlayer = data.currentPlayer || 1;
    this.playerId = data.playerId || null;
    this.gameId = data.gameId || null;
    this.code = data.code || null;
    this.gridSize =
      typeof data.gridSize === "number" ? data.gridSize : DEFAULT_GRID_SIZE;
    this.scores = data.scores || { player1: 0, player2: 0 };
    this.gameActive = data.gameActive ?? false;
    this.gameOver = data.gameOver || null;
    this.capturedAreas = data.capturedAreas || [];
    this.player1Score = data.player1Score || 0;
    this.player2Score = data.player2Score || 0;
    this.player1Online = data.player1Online ?? true;
    this.player2Online = data.player2Online ?? true;
    this.player1Left = data.player1Left ?? false;
    this.player2Left = data.player2Left ?? false;
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

  _parseGrid(gridData: any) {
    const gridMap = new Map();
    if (gridData) {
      Object.entries(gridData).forEach(([key, value]) => {
        if (value !== 0) gridMap.set(key, value);
      });
    }
    return gridMap;
  }

  static fromServer(data: any) {
    return new GameState({
      ...data.gameState,
      gameId: data.gameState?.gameId || data.code,
      playerId: data.playerId,
      move: data.move,
    });
  }
}

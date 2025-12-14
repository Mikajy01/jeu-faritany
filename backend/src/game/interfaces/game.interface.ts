export interface Coordinate {
  x: number;
  y: number;
}

export interface GridState {
  [key: string]: number; // "x,y": playerId
}

export interface Scores {
  player1: number;
  player2: number;
}

export interface Territory {
  points: Coordinate[];
  owner: number | null;
  stones: Coordinate[];
}

export interface GameState {
  grid: GridState;
  currentPlayer: number;
  scores: Scores;
  gameActive: boolean;
  gameId: string;
  deadStones: string[];
  capturedAreas: Territory[];
}

export interface MoveResult {
  success: boolean;
  reason?: string;
  gameState?: GameState;
  move?: {
    x: number;
    y: number;
    player: number;
  };
  capturedStones?: string[];
  capturedAreas?: Territory[];
}

export interface FinalScore {
  player1: number;
  player2: number;
  territories: Territory[];
}

export interface PolygonBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}
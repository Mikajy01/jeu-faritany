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

/**
 * Configuration du temps de jeu
 */
export interface TimeControl {
  moveTimeLimit: number;        // seconds (max par coup)
  gameDurationLimit: number;    // seconds (durée max de la partie)
}

/**
 * État runtime des pendules
 */
export interface ClockState {
  remainingMoveTime: number;    // seconds
  remainingGameTime: number;    // seconds
  lastMoveTimestamp: number;    // Date.now()
}

export interface GameState {
  grid: GridState;
  currentPlayer: number;
  scores: Scores;

  gameActive: boolean;

  timeControl: TimeControl;
  clock: ClockState;

  lastPlayer: number;           // 1 or 2
  gameType: 'public' | 'private' | 'AI';
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
  timedOutPlayer?: number; // 🆕 Pour identifier quel joueur a timeout
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
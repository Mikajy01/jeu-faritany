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
 * Type de mode de jeu
 */
export type GameMode = 'TIME' | 'SCORE';

/**
 * Configuration du temps de jeu et objectifs
 */
export interface TimeControl {
  moveTimeLimit: number; // seconds (max par coup)
  gameDurationLimit: number; // seconds (durée max de la partie, seulement pour mode TIME)
  gameMode: GameMode;
  targetScore: number; // Score à atteindre pour gagner (seulement pour mode SCORE)
}

/**
 * État runtime des pendules
 */
export interface ClockState {
  remainingMoveTime: number; // seconds for current move
  remainingGameTime: number; // initial limit (seconds)
  gameStartTime: number; // Date.now() when game started
  lastMoveTimestamp: number; // Date.now() of last move
}

export interface GameState {
  grid: GridState;
  currentPlayer: number;
  scores: Scores;

  gameActive: boolean;
  gridSize: number;

  timeControl: TimeControl;
  clock: ClockState;

  lastPlayer: number; // 1 or 2
  gameType: 'public' | 'private' | 'AI';
  gameId: string;
  joinCode?: string; // 4-digit code for private rooms

  deadStones: string[];
  capturedAreas: Territory[];
  gameOver?: boolean; // ✨ Nouveau
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

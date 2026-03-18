import { GAME_CONSTANTS } from '../../common/constants/game.constant';
import {
  GridState,
  Scores,
  Territory,
  GameState,
} from '../interfaces/game.interface';

export class GameStateEntity {
  grid: GridState;

  currentPlayer: number;
  lastPlayer: number;

  scores: Scores;
  gameActive: boolean;

  gameType: 'public' | 'private' | 'AI';
  gameId: string;
  joinCode?: string;

  gridSize: number;

  deadStones: Set<string>;
  capturedAreas: Territory[];
  gameOver: boolean; // ✨ Nouveau

  /**
   * Configuration du temps et objectifs
   */
  timeControl: {
    moveTimeLimit: number; // seconds
    gameDurationLimit: number; // seconds (pour mode TIME)
    gameMode: 'TIME' | 'SCORE';
    targetScore: number; // score à atteindre (pour mode SCORE)
  };

  /**
   * État runtime des pendules
   */
  clock: {
    remainingMoveTime: number; // seconds for current move
    remainingGameTime: number; // seconds total game (limit)
    gameStartTime: number; // timestamp
    lastMoveTimestamp: number; // timestamp
  };

  constructor(gridSize: number = GAME_CONSTANTS.GRID_SIZE) {
    this.grid = {};

    this.currentPlayer = 1;
    this.lastPlayer = 0;

    this.scores = { player1: 0, player2: 0 };
    this.gameActive = false;
    this.gameOver = false; // ✨ Initialisé à false

    this.gameType = 'public';
    this.gameId = this.generateGameId();
    this.gridSize = gridSize;

    this.deadStones = new Set();
    this.capturedAreas = [];

    // Temps par défaut (en secondes) et mode par défaut
    this.timeControl = {
      moveTimeLimit: GAME_CONSTANTS.DEFAULT_MOVE_TIME_LIMIT,
      gameDurationLimit: GAME_CONSTANTS.DEFAULT_TOTAL_TIME_LIMIT,
      gameMode: GAME_CONSTANTS.DEFAULT_GAME_MODE,
      targetScore: GAME_CONSTANTS.DEFAULT_TARGET_SCORE,
    };

    this.clock = {
      remainingMoveTime: GAME_CONSTANTS.DEFAULT_MOVE_TIME_LIMIT,
      remainingGameTime: GAME_CONSTANTS.DEFAULT_TOTAL_TIME_LIMIT,
      gameStartTime: Date.now(),
      lastMoveTimestamp: Date.now(),
    };
  }

  /**
   * Applique les paramètres de temps à l'état de l'horloge
   */
  applyTimeControl() {
    this.clock.remainingMoveTime = this.timeControl.moveTimeLimit;
    this.clock.remainingGameTime = this.timeControl.gameDurationLimit;
    this.clock.gameStartTime = Date.now();
    this.clock.lastMoveTimestamp = Date.now();
  }

  private generateGameId(): string {
    return Math.random().toString(36).substring(2, 11);
  }

  /**
   * Version sérialisable (Socket / JSON)
   */
  toSerializable(): GameState {
    return {
      grid: { ...this.grid },
      currentPlayer: this.currentPlayer,
      lastPlayer: this.lastPlayer,

      scores: { ...this.scores },
      gameActive: this.gameActive,

      gameType: this.gameType,
      gameId: this.gameId,
      joinCode: this.joinCode,
      gridSize: this.gridSize,

      timeControl: { ...this.timeControl },
      clock: { ...this.clock },

      deadStones: Array.from(this.deadStones),
      capturedAreas: [...this.capturedAreas],
      gameOver: this.gameOver, // ✨ Inclus dans la sérialisation
    };
  }

  /**
   * Reset complet de la partie (garde le même ID pour la revanche)
   */
  reset() {
    this.grid = {};
    this.currentPlayer = 1;
    this.lastPlayer = 0;

    this.scores = { player1: 0, player2: 0 };
    this.gameActive = true; // ✨ Redémarrer immédiatement après reset
    this.gameOver = false; // ✨ Reset de l'état game over

    this.deadStones = new Set();
    this.capturedAreas = [];

    this.clock = {
      remainingMoveTime: this.timeControl.moveTimeLimit,
      remainingGameTime: this.timeControl.gameDurationLimit,
      gameStartTime: Date.now(),
      lastMoveTimestamp: Date.now(),
    };
  }
}

import { GridState, Scores, Territory } from '../interfaces/game.interface';

export class GameStateEntity {
  grid: GridState;

  currentPlayer: number;
  lastPlayer: number;

  scores: Scores;
  gameActive: boolean;

  gameType: 'public' | 'private' | 'AI';
  gameId: string;

  deadStones: Set<string>;
  capturedAreas: Territory[];

  /**
   * Configuration du temps
   */
  timeControl: {
    moveTimeLimit: number;      // seconds
    gameDurationLimit: number;  // seconds
  };

  /**
   * État runtime des pendules
   */
  clock: {
    remainingMoveTime: number;  // seconds
    remainingGameTime: number;  // seconds
    lastMoveTimestamp: number;  // Date.now()
  };

  constructor() {
    this.grid = {};

    this.currentPlayer = 1;
    this.lastPlayer = 0;

    this.scores = { player1: 0, player2: 0 };
    this.gameActive = false;

    this.gameType = 'public';
    this.gameId = this.generateGameId();

    this.deadStones = new Set();
    this.capturedAreas = [];

    // Temps par défaut
    this.timeControl = {
      moveTimeLimit: 0,
      gameDurationLimit: 0,
    };

    this.clock = {
      remainingMoveTime: 0,
      remainingGameTime: 0,
      lastMoveTimestamp: Date.now(),
    };
  }

  private generateGameId(): string {
    return Math.random().toString(36).substring(2, 11);
  }

  /**
   * Version sérialisable (Socket / JSON)
   */
  toSerializable() {
    return {
      grid: { ...this.grid },
      currentPlayer: this.currentPlayer,
      lastPlayer: this.lastPlayer,

      scores: { ...this.scores },
      gameActive: this.gameActive,

      gameType: this.gameType,
      gameId: this.gameId,

      timeControl: { ...this.timeControl },
      clock: { ...this.clock },

      deadStones: Array.from(this.deadStones),
      capturedAreas: [...this.capturedAreas],
    };
  }

  /**
   * Reset complet de la partie
   */
  reset() {
    this.grid = {};
    this.currentPlayer = 1;
    this.lastPlayer = 0;

    this.scores = { player1: 0, player2: 0 };
    this.gameActive = false;

    this.gameId = this.generateGameId();

    this.deadStones = new Set();
    this.capturedAreas = [];

    this.clock = {
      remainingMoveTime: this.timeControl.moveTimeLimit,
      remainingGameTime: this.timeControl.gameDurationLimit,
      lastMoveTimestamp: Date.now(),
    };
  }
}

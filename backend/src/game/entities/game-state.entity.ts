import { GridState, Scores, Territory } from '../interfaces/game.interface';

export class GameStateEntity {
  grid: GridState;
  currentPlayer: number;
  scores: Scores;
  gameActive: boolean;
  gameType: 'public' | 'private' | 'AI';
  gameId: string;
  deadStones: Set<string>;
  capturedAreas: Territory[];

  constructor() {
    this.grid = {};
    this.currentPlayer = 1;
    this.scores = { player1: 0, player2: 0 };
    this.gameActive = false;
    this.gameType = 'public';
    this.gameId = this.generateGameId();
    this.deadStones = new Set();
    this.capturedAreas = [];
  }

  private generateGameId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  toSerializable() {
    return {
      grid: { ...this.grid },
      currentPlayer: this.currentPlayer,
      scores: { ...this.scores },
      gameActive: this.gameActive,
      gameType: this.gameType,
      gameId: this.gameId,
      deadStones: Array.from(this.deadStones),
      capturedAreas: [...this.capturedAreas],
    };
  }

  reset() {
    this.grid = {};
    this.currentPlayer = 1;
    this.scores = { player1: 0, player2: 0 };
    this.gameActive = false;
    this.gameId = this.generateGameId();
    this.deadStones = new Set();
    this.capturedAreas = [];
  }
}

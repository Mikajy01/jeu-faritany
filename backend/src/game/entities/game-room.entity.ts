import { GAME_CONSTANTS } from 'src/common/constants/game.constant';
import { GameStateEntity } from './game-state.entity';

export class GameRoomEntity {
  private players: Map<string, number>;
  private gameState: GameStateEntity;
  readonly gridSize: number;

  constructor() {
    this.players = new Map();
    this.gameState = new GameStateEntity();
    this.gridSize = GAME_CONSTANTS.GRID_SIZE;
  }

  addPlayer(socketId: string, playerNumber: number): number {
    this.players.set(socketId, playerNumber);
    if (this.players.size === 2) {
      this.gameState.gameActive = true;
    }
    return playerNumber;
  }

  removePlayer(socketId: string): void {
    this.players.delete(socketId);
    if (this.players.size < 2) {
      this.gameState.gameActive = false;
    }
  }

  getPlayerNumber(socketId: string): number | undefined {
    return this.players.get(socketId);
  }

  getPlayerCount(): number {
    return this.players.size;
  }

  getGameState(): GameStateEntity {
    return this.gameState;
  }

  getSocketIdByPlayerNumber(playerNumber: number): string | undefined {
    for (const [socketId, num] of this.players) {
      if (num === playerNumber) return socketId;
    }
    return undefined;
  }

  resetGame(): void {
    this.gameState.reset();
  }

  isEmpty(): boolean {
    return this.players.size === 0;
  }
}

import { GAME_CONSTANTS } from 'src/common/constants/game.constant';
import { GameStateEntity } from './game-state.entity';

export class GameRoomEntity {
  private players: Map<string, number>; // socketId -> playerNumber (1 or 2)
  private gameState: GameStateEntity;
  readonly gridSize: number;

  constructor() {
    this.players = new Map();
    this.gameState = new GameStateEntity();
    this.gridSize = GAME_CONSTANTS.GRID_SIZE;
  }

  /**
   * Adds a player to the room in an available slot (1 or 2)
   */
  addPlayer(socketId: string): number | undefined {
    if (this.players.size >= 2) return undefined;

    // Trouver le slot libre (1 ou 2)
    const usedSlots = Array.from(this.players.values());
    const playerNumber = usedSlots.includes(1) ? 2 : 1;

    this.players.set(socketId, playerNumber);
    
    if (this.players.size === 2) {
      this.gameState.gameActive = true;
    }
    return playerNumber;
  }

  /**
   * Removes a player and stops the game
   */
  removePlayer(socketId: string): void {
    if (this.players.has(socketId)) {
      this.players.delete(socketId);
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

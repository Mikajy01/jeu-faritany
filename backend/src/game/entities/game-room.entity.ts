import { GAME_CONSTANTS } from 'src/common/constants/game.constant';
import { GameStateEntity } from './game-state.entity';
import { Logger } from '@nestjs/common';

export class GameRoomEntity {
  private players: Map<string, number>; // socketId -> playerNumber (1 or 2)
  private userToPlayer: Map<string, number>; // userId -> playerNumber (1 or 2)
  private gameState: GameStateEntity;
  readonly gridSize: number;

  private readonly logger = new Logger(GameRoomEntity.name);

  constructor(gridSize: number = GAME_CONSTANTS.GRID_SIZE) {
    this.players = new Map();
    this.userToPlayer = new Map();
    this.gameState = new GameStateEntity(gridSize);
    this.gridSize = gridSize;
  }

  /**
   * Adds a player to the room in an available slot (1 or 2)
   */
  addPlayer(socketId: string, userId?: string): number | undefined {
    this.logger.log(
      `addPlayer called with socketId=${socketId}, userId=${userId}`,
    );

    // Si l'utilisateur est déjà présent via son socketId
    if (this.players.has(socketId)) {
      const player = this.players.get(socketId);
      this.logger.log(
        `Socket ${socketId} already registered as player ${player}`,
      );
      return player;
    }

    if (this.players.size >= 2) {
      this.logger.log(
        `Room already full (${this.players.size} players). Rejecting socket ${socketId}`,
      );
      return undefined;
    }

    // Utiliser le socketId comme userId de secours si absent
    const effectiveUserId = userId || socketId;
    this.logger.log(`Effective userId resolved to ${effectiveUserId}`);

    // Si l'utilisateur a déjà un numéro attribué (reconnexion)
    if (this.userToPlayer.has(effectiveUserId)) {
      const playerNumber = this.userToPlayer.get(effectiveUserId)!;
      this.logger.log(
        `User ${effectiveUserId} reconnecting. Reassigning playerNumber=${playerNumber} to socket ${socketId}`,
      );

      this.players.set(socketId, playerNumber);
      return playerNumber;
    }

    // Trouver le slot libre (1 ou 2) en regardant les numéros déjà attribués
    const usedSlots = Array.from(this.userToPlayer.values());
    this.logger.log(`Currently used slots: ${usedSlots.join(', ') || 'none'}`);

    const playerNumber = usedSlots.includes(1) ? 2 : 1;
    this.logger.log(
      `Assigning playerNumber=${playerNumber} to user ${effectiveUserId}`,
    );

    this.players.set(socketId, playerNumber);
    this.userToPlayer.set(effectiveUserId, playerNumber);

    this.logger.log(
      `Player registered: socket=${socketId}, user=${effectiveUserId}, playerNumber=${playerNumber}`,
    );

    if (this.userToPlayer.size === 2) {
      this.gameState.gameActive = true;
      this.logger.log(`Two players connected. Game is now ACTIVE`);
    } else {
      this.logger.log(
        `Waiting for second player. Current player count=${this.userToPlayer.size}`,
      );
    }

    return playerNumber;
  }

  /**
   * Removes a player (disconnect but keep user mapping for rejoin)
   */
  removePlayer(socketId: string): void {
    if (this.players.has(socketId)) {
      this.players.delete(socketId);
    }
  }

  /**
   * Fully removes a player and their user mapping (explicit leave)
   */
  leavePlayer(socketId: string): void {
    const playerNumber = this.players.get(socketId);
    if (playerNumber) {
      this.players.delete(socketId);

      // Trouver l'userId associé à ce playerNumber
      for (const [userId, num] of this.userToPlayer) {
        if (num === playerNumber) {
          this.userToPlayer.delete(userId);
          break;
        }
      }
    }
  }

  getPlayerNumber(socketId: string): number | undefined {
    return this.players.get(socketId);
  }

  getPlayerNumberByUserId(userId: string): number | undefined {
    return this.userToPlayer.get(userId);
  }

  getPlayerCount(): number {
    return this.userToPlayer.size;
  }

  getOnlinePlayerCount(): number {
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

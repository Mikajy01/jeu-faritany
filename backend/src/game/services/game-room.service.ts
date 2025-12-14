import { Injectable, Logger } from '@nestjs/common';
import { GameRoomEntity } from '../entities/game-room.entity';
import { GameLogicService } from './game-logic.service';
import { ScoringService } from './scoring.service';
import { MoveResult, FinalScore } from '../interfaces/game.interface';
import { CoordinateUtil } from '../../common/utils/coordinate.util';
import { GAME_CONSTANTS } from 'src/common/constants/game.constant';

@Injectable()
export class GameRoomService {
  private readonly logger = new Logger(GameRoomService.name);
  private readonly gameRooms = new Map<string, GameRoomEntity>();

  constructor(
    private readonly gameLogicService: GameLogicService,
    private readonly scoringService: ScoringService,
  ) {}

  /**
   * Create a new room with optional type (public|private|AI)
   * Returns the created game id (6-char code for public/private)
   */
  createRoom(type: 'public' | 'private' | 'AI' = 'public', ownerId: string) {
    const newRoom = new GameRoomEntity();
    // set game type on the game state so it's persisted with the room
    newRoom.getGameState().gameType = type;
    newRoom.addPlayer(ownerId, 1);

    if (type === 'AI') {
      const gameId = newRoom.getGameState().gameId;
      this.gameRooms.set(gameId, newRoom);
      this.logger.log(`Created AI room ${gameId}`);
      return { gameId, type };
    }

    const code = this.generateUniqueCode(6);
    // override generated id with the human-friendly code
    newRoom.getGameState().gameId = code;
    this.gameRooms.set(code, newRoom);
    this.logger.log(`Created ${type} room ${code}`);
    return { gameId: code, type };
  }

  private generateUniqueCode(length: number) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    do {
      code = Array.from({ length })
        .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
        .join('');
    } while (this.gameRooms.has(code));
    return code;
  }

  /**
   * Find or create a game room for a player
   * Single Responsibility: Room management
   */
  findOrCreateRoom(socketId: string): {
    room: GameRoomEntity;
    playerNumber: number;
  } {
    // Try to find a room with only one player
    for (const [roomId, room] of this.gameRooms) {
      if (room.getPlayerCount() === 1) {
        const playerNumber = 2;
        room.addPlayer(socketId, playerNumber);
        this.logger.log(
          `Player ${socketId} joined room ${roomId} as Player ${playerNumber}`,
        );
        return { room, playerNumber };
      }
    }

    // Create a new room
    const newRoom = new GameRoomEntity();
    const playerNumber = 1;
    newRoom.addPlayer(socketId, playerNumber);
    const gameId = newRoom.getGameState().gameId;
    this.gameRooms.set(gameId, newRoom);
    this.logger.log(`Created new room ${gameId} for player ${socketId}`);

    return { room: newRoom, playerNumber };
  }

  /**
   * Get a room by game ID
   */
  getRoom(gameId: string): GameRoomEntity | undefined {
    return this.gameRooms.get(gameId);
  }

  /**
   * Join a room by its game id/code
   */
  joinRoomByCode(
    gameId: string,
    socketId: string,
  ): { room?: GameRoomEntity; playerNumber?: number; error?: string } {
    const room = this.gameRooms.get(gameId);
    if (!room) return { error: 'Room not found' };

    if (room.getPlayerCount() >= 2) return { error: 'Room full' };

    const playerNumber = room.getPlayerCount() === 0 ? 1 : 2;
    room.addPlayer(socketId, playerNumber);
    this.logger.log(
      `Player ${socketId} joined room ${gameId} as Player ${playerNumber}`,
    );
    return { room, playerNumber };
  }

  /**
   * Join a random public room. If none available, creates a new public room and joins it.
   */
  joinRandomPublicRoom(socketId: string): {
    room: GameRoomEntity;
    playerNumber: number;
  } {
    for (const [roomId, room] of this.gameRooms) {
      if (
        room.getPlayerCount() === 1 &&
        room.getGameState().gameType === 'public'
      ) {
        const playerNumber = 2;
        room.addPlayer(socketId, playerNumber);
        this.logger.log(
          `Player ${socketId} joined public room ${roomId} as Player ${playerNumber}`,
        );
        return { room, playerNumber };
      }
    }

    // No available public room, create one and join as player 1
    const { gameId } = this.createRoom('public', socketId);
    const room = this.gameRooms.get(gameId)!;
    const playerNumber = 1;
    room.addPlayer(socketId, playerNumber);
    this.logger.log(
      `Player ${socketId} created and joined new public room ${gameId} as Player ${playerNumber}`,
    );
    return { room, playerNumber };
  }

  /**
   * Remove player from room
   */
  removePlayer(gameId: string, socketId: string): void {
    const room = this.gameRooms.get(gameId);
    if (!room) return;

    room.removePlayer(socketId);
    this.logger.log(`Player ${socketId} removed from room ${gameId}`);

    // Clean up empty rooms
    if (room.isEmpty()) {
      this.gameRooms.delete(gameId);
      this.logger.log(`Room ${gameId} deleted (empty)`);
    }
  }

  /**
   * Make a move in a game room
   * Dependency Inversion: Depends on GameLogicService abstraction
   */
  makeMove(gameId: string, socketId: string, x: number, y: number): MoveResult {
    const room = this.gameRooms.get(gameId);
    if (!room) {
      return { success: false, reason: 'Room not found' };
    }

    const playerNumber = room.getPlayerNumber(socketId);
    if (!playerNumber) {
      return { success: false, reason: 'Player not in room' };
    }

    const gameState = room.getGameState();
    return this.gameLogicService.makeMove(
      x,
      y,
      playerNumber,
      gameState,
      room.gridSize,
    );
  }

  /**
   * Calculate final score for a game
   */
  calculateFinalScore(gameId: string): FinalScore | null {
    const room = this.gameRooms.get(gameId);
    if (!room) return null;

    const gameState = room.getGameState();

    // Create getCellState closure
    const getCellState = (x: number, y: number): number => {
      const key = CoordinateUtil.toKey(x, y);
      if (gameState.deadStones.has(key)) {
        return GAME_CONSTANTS.EMPTY_CELL;
      }
      return gameState.grid[key] || GAME_CONSTANTS.EMPTY_CELL;
    };

    return this.scoringService.calculateFinalScore(
      gameState.scores,
      getCellState,
      room.gridSize,
    );
  }

  /**
   * Reset a game
   */
  resetGame(gameId: string): boolean {
    const room = this.gameRooms.get(gameId);
    if (!room) return false;

    room.resetGame();
    this.logger.log(`Game ${gameId} reset`);
    return true;
  }

  /**
   * Get room count for monitoring
   */
  getRoomCount(): number {
    return this.gameRooms.size;
  }
}

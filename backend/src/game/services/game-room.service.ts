import { Injectable, Logger } from '@nestjs/common';
import { GameRoomEntity } from '../entities/game-room.entity';
import { GameLogicService } from './game-logic.service';
import { ScoringService } from './scoring.service';
import { MoveResult, FinalScore } from '../interfaces/game.interface';
import { CoordinateUtil } from '../../common/utils/coordinate.util';
import { GAME_CONSTANTS } from 'src/common/constants/game.constant';
import { CreateGameDto } from '../dto/create-game.dto';

@Injectable()
export class GameRoomService {
  private readonly logger = new Logger(GameRoomService.name);
  private readonly gameRooms = new Map<string, GameRoomEntity>();
  private readonly socketToRoom = new Map<string, string>();

  constructor(
    private readonly gameLogicService: GameLogicService,
    private readonly scoringService: ScoringService,
  ) {}

  /**
   * Create a new room with optional type (public|private|AI)
   * Returns the created game id
   */
  createRoom(
    type: 'public' | 'private' | 'AI' = 'public',
    ownerSocketId: string,
    createGameDto: CreateGameDto,
  ) {
    const newRoom = new GameRoomEntity();
    const gameState = newRoom.getGameState();

    gameState.gameType = type;
    gameState.timeControl.moveTimeLimit =
      createGameDto.moveTimeLimit ?? GAME_CONSTANTS.DEFAULT_MOVE_TIME_LIMIT;
    gameState.timeControl.gameDurationLimit =
      createGameDto.gameDurationLimit ??
      GAME_CONSTANTS.DEFAULT_TOTAL_TIME_LIMIT;
    gameState.timeControl.gameMode =
      createGameDto.gameMode ?? GAME_CONSTANTS.DEFAULT_GAME_MODE;
    gameState.timeControl.targetScore =
      createGameDto.targetScore ?? GAME_CONSTANTS.DEFAULT_TARGET_SCORE;

    // Appliquer les nouveaux réglages de temps au clock
    gameState.applyTimeControl();

    let gameId = gameState.gameId;
    if (type !== 'AI') {
      gameId = this.generateUniqueCode(6);
      gameState.gameId = gameId;
    }

    newRoom.addPlayer(ownerSocketId);
    this.gameRooms.set(gameId, newRoom);
    this.socketToRoom.set(ownerSocketId, gameId);

    this.logger.log(
      `Created ${type} room ${gameId} by player ${ownerSocketId}`,
    );
    return { gameId, type };
  }

  /**
   * Generates a unique short code for the game
   */
  private generateUniqueCode(length: number): string {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
    let result = '';
    let isUnique = false;

    while (!isUnique) {
      result = '';
      for (let i = 0; i < length; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * characters.length),
        );
      }
      if (!this.gameRooms.has(result)) {
        isUnique = true;
      }
    }
    return result;
  }

  /**
   * Get a room by game ID
   */
  getRoom(gameId: string): GameRoomEntity | undefined {
    return this.gameRooms.get(gameId);
  }

  /**
   * Get game ID by player socket ID
   */
  getGameIdBySocket(socketId: string): string | undefined {
    return this.socketToRoom.get(socketId);
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

    const playerNumber = room.addPlayer(socketId);
    if (!playerNumber) return { error: 'Room full' };

    this.socketToRoom.set(socketId, gameId);

    this.logger.log(
      `Player ${socketId} joined room ${gameId} as Player ${playerNumber}`,
    );
    return { room, playerNumber };
  }

  /**
   * Join a random public room.
   */
  joinRandomPublicRoom(
    socketId: string,
    createGameDto: CreateGameDto = {},
  ): {
    room: GameRoomEntity;
    playerNumber: number;
  } {
    for (const [roomId, room] of this.gameRooms) {
      if (
        room.getPlayerCount() === 1 &&
        room.getGameState().gameType === 'public'
      ) {
        const playerNumber = room.addPlayer(socketId)!;
        this.socketToRoom.set(socketId, roomId);

        this.logger.log(
          `Player ${socketId} joined public room ${roomId} as Player ${playerNumber}`,
        );
        return { room, playerNumber };
      }
    }

    // No available public room, create one with the provided settings
    const { gameId } = this.createRoom('public', socketId, createGameDto);
    const room = this.gameRooms.get(gameId)!;

    return { room, playerNumber: 1 };
  }

  /**
   * Remove player from room
   */
  removePlayer(gameId: string, socketId: string): void {
    const room = this.gameRooms.get(gameId);
    if (!room) return;

    room.removePlayer(socketId);
    this.socketToRoom.delete(socketId);

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

  forcePassTurn(gameId: string) {
    const room = this.gameRooms.get(gameId); // 🟢 Maintenant 'rooms' existe !
    if (!room) {
      this.logger.error(
        `Attempted to force pass on non-existent room: ${gameId}`,
      );
      return { success: false };
    }

    const gameState = room.getGameState();
    const previousPlayer = gameState.currentPlayer;

    // 1. Changer de joueur (1 -> 2 ou 2 -> 1)
    gameState.currentPlayer = previousPlayer === 1 ? 2 : 1;

    // 2. Réinitialiser le chrono pour le nouveau joueur
    const now = Date.now();
    gameState.clock.lastMoveTimestamp = now;
    gameState.clock.remainingMoveTime = gameState.timeControl.moveTimeLimit;

    // 3. Mettre à jour l'historique du dernier joueur ayant agi
    gameState.lastPlayer = previousPlayer;

    this.logger.log(
      `Timeout: Player ${previousPlayer} skipped. Now Player ${gameState.currentPlayer}'s turn.`,
    );

    return {
      success: true,
      previousPlayer,
      gameState: gameState.toSerializable(),
    };
  }

  /**
   * Supprimer une room (quand la partie est finie ou vide)
   */
  removeRoom(gameId: string) {
    this.gameRooms.delete(gameId);
  }

  /**
   * Calculate final score for a game
   * MODIFIÉ: Utilise maintenant calculateScores() au lieu de calculateFinalScore()
   */
  calculateFinalScore(gameId: string): FinalScore | null {
    const room = this.gameRooms.get(gameId);
    if (!room) return null;

    const gameState = room.getGameState();

    // Recalculer les scores basés sur les deadStones
    const scores = this.scoringService.calculateScores(
      gameState.grid,
      gameState.deadStones,
    );

    const finalScore: FinalScore = {
      player1: scores.player1,
      player2: scores.player2,
      territories: gameState.capturedAreas, // Utilise les cycles actifs comme territoires
    };

    // Log avec le gagnant pour information
    let winner: string = 'Draw';
    if (scores.player1 > scores.player2) {
      winner = 'Player 1';
    } else if (scores.player2 > scores.player1) {
      winner = 'Player 2';
    }

    this.logger.log(
      `Final score for game ${gameId}: P1=${scores.player1}, P2=${scores.player2}, Winner=${winner}`,
    );

    return finalScore;
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

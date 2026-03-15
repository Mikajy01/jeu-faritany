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
   * Returns the created game id and join code if private
   */
  createRoom(
    type: 'public' | 'private' | 'AI' = 'public',
    createGameDto: CreateGameDto,
    ownerSocketId?: string,
    ownerUserId?: string,
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
    let joinCode: string | undefined;

    if (type !== 'AI') {
      gameId = this.generateUniqueCode(6);
      gameState.gameId = gameId;

      if (type === 'private') {
        joinCode = Math.floor(1000 + Math.random() * 9000).toString();
        gameState.joinCode = joinCode;
      }
    }

    if (ownerSocketId) {
      newRoom.addPlayer(ownerSocketId, ownerUserId);
      this.socketToRoom.set(ownerSocketId, gameId);
    }

    this.gameRooms.set(gameId, newRoom);

    this.logger.log(
      `Created ${type} room ${gameId} ${joinCode ? `with joinCode ${joinCode}` : ''}`,
    );
    return { gameId, type, joinCode };
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
   * Bind a socket ID to a room ID
   */
  bindSocketToRoom(socketId: string, gameId: string): void {
    this.socketToRoom.set(socketId, gameId);
    this.logger.log(`Socket ${socketId} bound to room ${gameId}`);
  }

  /**
   * Verify if a player can join or rejoin a room
   */
  validateJoinRequest(
    gameId: string,
    userId: string,
    joinCode?: string,
  ): {
    room?: GameRoomEntity;
    playerNumber?: number;
    error?: string;
    isRejoin?: boolean;
  } {
    const room = this.gameRooms.get(gameId);
    if (!room) return { error: 'Room not found' };

    const gameState = room.getGameState();

    // 1. Check if it's a re-join (player already in room by userId)
    const existingPlayerNumber = room.getPlayerNumberByUserId(userId);
    if (existingPlayerNumber) {
      return { room, playerNumber: existingPlayerNumber, isRejoin: true };
    }

    // 2. New player joining - Verify join code for private rooms
    if (gameState.gameType === 'private') {
      if (!joinCode || gameState.joinCode !== joinCode) {
        return { error: 'Invalid join code' };
      }
    }

    // 3. Check if room is full
    // Utiliser getPlayerCount qui compte les entrées dans userToPlayer
    if (room.getPlayerCount() >= 2) return { error: 'Room full' };

    // Note: On ne détermine pas le playerNumber définitif ici pour éviter les race conditions
    // On renvoie juste une estimation pour l'UI REST
    return { room, playerNumber: room.getPlayerCount() + 1, isRejoin: false };
  }

  /**
   * Join or create a random public room.
   */
  joinOrCreateRandomPublicRoom(
    socketId?: string,
    createGameDto: CreateGameDto = {},
    userId?: string,
  ): {
    room: GameRoomEntity;
    playerNumber: number;
    gameId: string;
    isNew: boolean;
  } {
    for (const [roomId, room] of this.gameRooms) {
      if (
        room.getPlayerCount() === 1 &&
        room.getGameState().gameType === 'public'
      ) {
        let playerNumber = 2;
        if (socketId) {
          playerNumber = room.addPlayer(socketId, userId)!;
          this.socketToRoom.set(socketId, roomId);
        }

        this.logger.log(
          `${socketId ? `Player ${socketId}` : 'A player'} joined public room ${roomId} as Player ${playerNumber}`,
        );
        return { room, playerNumber, gameId: roomId, isNew: false };
      }
    }

    // No available public room, create one with the provided settings
    const { gameId } = this.createRoom(
      'public',
      createGameDto,
      socketId,
      userId,
    );
    const room = this.gameRooms.get(gameId)!;

    return { room, playerNumber: 1, gameId, isNew: true };
  }

  /**
   * Remove player from room (disconnect)
   */
  removePlayer(gameId: string, socketId: string): void {
    const room = this.gameRooms.get(gameId);
    if (!room) return;

    room.removePlayer(socketId);
    this.socketToRoom.delete(socketId);

    this.logger.log(`Player ${socketId} disconnected from room ${gameId}`);

    // Nettoyage automatique : si plus personne n'est connecté à la salle
    if (room.getOnlinePlayerCount() === 0) {
      // NOTE: Le clearTimeouts doit être appelé par le GameManagerService
      // avant d'appeler removePlayer si on veut arrêter les timers proprement.
      this.gameRooms.delete(gameId);
      this.logger.log(`Room ${gameId} deleted (no active connections)`);
    }
  }

  /**
   * Explicitly leave a room (remove mapping)
   */
  leaveRoom(gameId: string, socketId: string): void {
    const room = this.gameRooms.get(gameId);
    if (!room) return;

    room.leavePlayer(socketId);
    this.socketToRoom.delete(socketId);

    this.logger.log(`Player ${socketId} explicitly left room ${gameId}`);

    if (room.getPlayerCount() === 0) {
      this.gameRooms.delete(gameId);
      this.logger.log(`Room ${gameId} deleted (no players left)`);
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
   * Get all active public rooms
   */
  getPublicRooms() {
    const rooms: any[] = []; // ✨ Ajout du type any[] pour éviter l'erreur 'never'
    for (const [gameId, room] of this.gameRooms) {
      const state = room.getGameState();
      if (state.gameType === 'public' && !state.gameOver) {
        rooms.push({
          gameId,
          playerCount: room.getPlayerCount(),
          gameActive: state.gameActive,
          createdAt: state.clock.gameStartTime,
        });
      }
    }
    // Trier par plus récent
    return rooms.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get room count for monitoring
   */
  getRoomCount(): number {
    return this.gameRooms.size;
  }
}

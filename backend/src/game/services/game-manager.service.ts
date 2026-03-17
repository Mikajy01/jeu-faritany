import { Injectable, Logger } from '@nestjs/common';
import { GameRoomService } from './game-room.service';
import { NotificationService } from './notification.service';
import { AiService } from './ai.service';
import { GameLogicService } from './game-logic.service';
import { GAME_CONSTANTS } from 'src/common/constants/game.constant';
import { MakeMoveDto } from '../dto/make-move.dto';

@Injectable()
export class GameManagerService {
  private readonly logger = new Logger(GameManagerService.name);
  private readonly moveTimeoutTimers = new Map<string, NodeJS.Timeout>();
  private readonly gameTimeoutTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly gameRoomService: GameRoomService,
    private readonly notificationService: NotificationService,
    private readonly aiService: AiService,
    private readonly gameLogicService: GameLogicService,
  ) {}

  /**
   * Schedule safety timeouts for move and game duration
   */
  scheduleTimeouts(gameId: string) {
    this.clearTimeouts(gameId);

    const room = this.gameRoomService.getRoom(gameId);
    if (!room || !room.getGameState().gameActive) return;

    const gameState = room.getGameState();

    // 0. Pas de limite de temps en mode IA
    if (gameState.gameType === 'AI') {
      return;
    }

    const currentPlayer = gameState.currentPlayer;

    // 1. Timeout pour le coup en cours (moveTimeLimit)
    const moveDelay = gameState.clock.remainingMoveTime * 1000;
    const moveTimer = setTimeout(() => {
      this.logger.log(
        `Move timeout for player ${currentPlayer} in game ${gameId}`,
      );
      this.handleMoveTimeout(gameId);
    }, moveDelay);
    this.moveTimeoutTimers.set(gameId, moveTimer);

    // 2. Timeout pour le temps global partagé (gameDurationLimit) - UNIQUEMENT SI MODE TIME
    if (gameState.timeControl.gameMode === 'TIME') {
      // Calculé à partir du début réel de la partie
      const elapsedSinceStart = Date.now() - gameState.clock.gameStartTime;
      const gameDelay = Math.max(
        0,
        gameState.clock.remainingGameTime * 1000 - elapsedSinceStart,
      );

      const gameTimer = setTimeout(() => {
        this.logger.log(`Global game duration timeout for game ${gameId}`);
        this.handleGameOver(gameId, currentPlayer, 'TIMEOUT');
      }, gameDelay);
      this.gameTimeoutTimers.set(gameId, gameTimer);
    }
  }

  /**
   * Clear all safety timeouts for a game
   */
  clearTimeouts(gameId: string) {
    const moveTimer = this.moveTimeoutTimers.get(gameId);
    if (moveTimer) {
      clearTimeout(moveTimer);
      this.moveTimeoutTimers.delete(gameId);
    }

    const gameTimer = this.gameTimeoutTimers.get(gameId);
    if (gameTimer) {
      clearTimeout(gameTimer);
      this.gameTimeoutTimers.delete(gameId);
    }
  }

  /**
   * Handle move timeout (Pass turn)
   */
  private async handleMoveTimeout(gameId: string) {
    const result = this.gameRoomService.forcePassTurn(gameId);

    if (result.success) {
      this.notificationService.notifyBothPlayers(gameId, 'moveTimeout', {
        gameState: result.gameState,
        timedOutPlayer: result.previousPlayer,
        message: `Temps par coup écoulé pour le joueur ${result.previousPlayer} ! Son tour est passé.`,
      });

      // Re-planifier les timeouts pour le nouveau joueur
      this.scheduleTimeouts(gameId);

      const room = this.gameRoomService.getRoom(gameId);
      if (
        room &&
        room.getGameState().gameType === 'AI' &&
        room.getGameState().currentPlayer === 2
      ) {
        await this.triggerAiMove(gameId);
      }
    }
  }

  /**
   * Handle game over
   */
  handleGameOver(
    gameId: string,
    loserPlayer: number,
    reason: 'TIMEOUT' | 'RESIGN' | 'FINISH',
  ) {
    this.clearTimeouts(gameId);

    const room = this.gameRoomService.getRoom(gameId);
    if (!room) return;

    const gameState = room.getGameState();
    gameState.gameActive = false;
    gameState.gameOver = true; // ✨ Marquer comme terminé

    // Déterminer le gagnant par score si FINISH, sinon l'autre joueur
    let winner = 0;
    if (reason === 'FINISH' || reason === 'TIMEOUT') {
      if (gameState.scores.player1 > gameState.scores.player2) {
        winner = 1;
      } else if (gameState.scores.player2 > gameState.scores.player1) {
        winner = 2;
      } else {
        winner = 0; // Match nul
      }
    } else {
      winner = loserPlayer === 1 ? 2 : 1;
    }

    this.notificationService.notifyBothPlayers(gameId, 'gameOver', {
      winner,
      reason,
      scores: gameState.scores,
      message:
        reason === 'TIMEOUT'
          ? winner === 0
            ? 'Temps global écoulé ! Match nul.'
            : `Temps global écoulé ! Le joueur ${winner} gagne au score.`
          : reason === 'RESIGN'
            ? `Le joueur ${loserPlayer} a abandonné. Le joueur ${winner} gagne.`
            : reason === 'FINISH'
              ? winner === 0
                ? 'Match nul !'
                : `Partie terminée ! Le joueur ${winner} gagne.`
              : `Partie terminée ! Le joueur ${winner} gagne.`,
    });

    this.logger.log(
      `Game Over for ${gameId}: ${winner === 0 ? 'Draw' : 'Player ' + winner + ' won'} (${reason})`,
    );
  }

  /**
   * Handle making a move (called from gateway)
   */
  async makeMove(gameId: string, socketId: string, moveDto: MakeMoveDto) {
    const room = this.gameRoomService.getRoom(gameId);
    if (!room) return { success: false, reason: 'Room not found' };

    const gameState = room.getGameState();
    if (!gameState.gameActive)
      return { success: false, reason: 'Game not active' };

    const result = this.gameRoomService.makeMove(
      gameId,
      socketId,
      moveDto.x,
      moveDto.y,
    );

    if (result.success) {
      // 1. Clear previous timeouts
      this.clearTimeouts(gameId);

      // 2. Check for game over (reached target score in SCORE mode)
      if (result.gameState && !result.gameState.gameActive) {
        const player = room.getPlayerNumber(socketId) || 0;
        this.logger.log(`Game ${gameId} ended by score objective`);
        this.handleGameOver(gameId, player, 'FINISH');
        return result;
      }

      // 3. Schedule next timeouts
      this.scheduleTimeouts(gameId);

      this.notificationService.notifyBothPlayers(gameId, 'moveMade', {
        gameState: result.gameState,
        move: result.move,
        capturedStones: result.capturedStones,
        capturedAreas: result.capturedAreas,
      });

      if (result.gameState && result.gameState.gameActive) {
        if (
          result.gameState.gameType === 'AI' &&
          result.gameState.currentPlayer === 2
        ) {
          await this.triggerAiMove(gameId);
        }
      }
      return result;
    } else {
      return result;
    }
  }

  /**
   * Orchestrate AI move
   */
  async triggerAiMove(gameId: string) {
    const room = this.gameRoomService.getRoom(gameId);
    if (!room) return;

    try {
      const gameState = room.getGameState();
      const difficulty = 5; // Default to expert

      const aiMove = this.aiService.calculateNextMove(
        gameState as any,
        GAME_CONSTANTS.GRID_SIZE,
        difficulty,
      );

      const result = this.gameRoomService.makeMove(
        gameId,
        GAME_CONSTANTS.AI_PLAYER_ID,
        aiMove.x,
        aiMove.y,
      );

      if (result.success) {
        // Re-planifier les timeouts
        this.scheduleTimeouts(gameId);

        this.logger.log(`AI (P2) moved at (${aiMove.x}, ${aiMove.y})`);
        this.notificationService.notifyBothPlayers(gameId, 'moveMade', {
          gameState: result.gameState,
          move: result.move,
          capturedStones: result.capturedStones,
          capturedAreas: result.capturedAreas,
        });
      } else {
        this.logger.error(`AI failed to move: ${result.reason}`);
        await this.handleAiMoveFailure(gameId);
      }
    } catch (error) {
      this.logger.error('Error during AI execution', error);
      await this.handleAiMoveFailure(gameId);
    }
  }

  private async handleAiMoveFailure(gameId: string) {
    const room = this.gameRoomService.getRoom(gameId);
    if (!room) return;

    try {
      const gameState = room.getGameState();
      this.logger.warn('AI retrying with random move');

      const aiMove = this.aiService.calculateNextMove(
        gameState as any,
        GAME_CONSTANTS.GRID_SIZE,
        2,
      );

      const result = this.gameRoomService.makeMove(
        gameId,
        GAME_CONSTANTS.AI_PLAYER_ID,
        aiMove.x,
        aiMove.y,
      );

      if (result.success) {
        // Re-planifier les timeouts
        this.scheduleTimeouts(gameId);

        this.notificationService.notifyBothPlayers(gameId, 'moveMade', {
          gameState: result.gameState,
          move: result.move,
          capturedStones: result.capturedStones,
          capturedAreas: result.capturedAreas,
        });
      } else {
        this.notificationService.notifyBothPlayers(gameId, 'gameError', {
          reason: 'AI cannot make a move - game ending',
        });
      }
    } catch (fallbackError) {
      this.logger.error('AI fallback also failed', fallbackError);
    }
  }

  /**
   * Handle player disconnection
   */
  handlePlayerDisconnected(gameId: string, socketId: string) {
    const room = this.gameRoomService.getRoom(gameId);
    if (room) {
      const playerNumber = room.getPlayerNumber(socketId);

      // ✨ Nettoyer les timeouts si c'est le dernier joueur à partir
      if (room.getOnlinePlayerCount() <= 1) {
        this.clearTimeouts(gameId);
      }

      // ✨ Utiliser le service pour gérer le retrait et le nettoyage éventuel de la room
      this.gameRoomService.removePlayer(gameId, socketId);

      this.notificationService.notifyBothPlayers(gameId, 'playerDisconnected', {
        playerNumber,
        message: playerNumber
          ? `Le joueur ${playerNumber} s'est déconnecté.`
          : "Un joueur s'est déconnecté.",
      });
    }
  }

  /**
   * Handle game creation logic that involves starting timers/AI
   */
  afterGameCreated(gameId: string, type: string) {
    if (type === 'AI') {
      const room = this.gameRoomService.getRoom(gameId);
      if (room) {
        room.getGameState().gameActive = true;
        this.scheduleTimeouts(gameId);
      }
    }
  }

  /**
   * Handle player joining logic that involves starting timers
   */
  afterPlayerJoined(gameId: string) {
    const room = this.gameRoomService.getRoom(gameId);
    if (room && room.getOnlinePlayerCount() === 2) {
      room.getGameState().gameActive = true;
      this.scheduleTimeouts(gameId);
    }
  }
}

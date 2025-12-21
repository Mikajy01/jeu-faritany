// game/game.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { GameRoomService } from './services/game-room.service';
import { MakeMoveDto } from './dto/make-move.dto';
import { CreateGameDto } from './dto/create-game.dto';
import { JoinGameDto } from './dto/join-game.dto';
import { NotificationService } from './services/notification.service';
import { AiService } from './services/ai.service';
import { GAME_CONSTANTS } from 'src/common/constants/game.constant';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class GameGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);
  private readonly socketToRoom = new Map<string, string>();
  private readonly socketToPlayer = new Map<string, number>();

  constructor(
    private readonly gameRoomService: GameRoomService,
    private readonly notificationService: NotificationService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Initialize gateway and pass server to notification service
   */
  afterInit(server: Server): void {
    this.notificationService.setServer(server);
    this.logger.log('WebSocket Gateway initialized');
  }

  /**
   * Handle new connection
   */
  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  /**
   * Handle disconnection
   */
  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);

    const gameId = this.socketToRoom.get(client.id);
    if (gameId) {
      this.gameRoomService.removePlayer(gameId, client.id);
      this.notificationService.notifyBothPlayers(gameId, 'playerDisconnected');

      // Clean up
      this.socketToRoom.delete(client.id);
      this.socketToPlayer.delete(client.id);
    }
  }

  /**
   * Create a new game (public | private | AI)
   * - For public/private returns a 6-character code
   * - AI placeholder: created but AI implementation left for later
   */
  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage('createGame')
  handleCreateGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CreateGameDto,
  ) {
    const type = (payload && payload.type) || 'public';

    if (type === 'AI') {
      // 1. Créer la room via le service
      const result = this.gameRoomService.createRoom('AI', client.id);
      const gameId = result.gameId;

      // 2. IMPORTANT : Inscrire immédiatement l'IA comme Joueur 2
      // On utilise l'ID constant défini plus haut
      this.gameRoomService.joinRoomByCode(gameId, GAME_CONSTANTS.AI_PLAYER_ID);

      // 3. Configuration socket pour le joueur humain
      client.join(gameId);
      client.join(`${gameId}-p1`);
      this.socketToRoom.set(client.id, gameId);
      this.socketToPlayer.set(client.id, 1);

      // 4. Récupérer l'état initial (maintenant avec 2 joueurs)
      const room = this.gameRoomService.getRoom(gameId);

      if (!room) {
        client.emit('createError', { reason: 'Failed to create AI game' });
        return;
      }
      const gameState = room.getGameState();

      // 5. Envoyer la confirmation et le DÉMARRAGE immédiat
      client.emit('gameCreated', {
        code: gameId,
        type: 'AI',
        playerId: 1,
      });

      // Notifier que le jeu commence (puisqu'on a les 2 joueurs : Humain + IA)
      this.notificationService.notifyBothPlayers(gameId, 'gameStart', {
        gameState: gameState.toSerializable(),
        playerCount: 2,
      });

      // Track player
      this.socketToRoom.set(GAME_CONSTANTS.AI_PLAYER_ID, gameId);
      this.socketToPlayer.set(GAME_CONSTANTS.AI_PLAYER_ID, 2);

      this.notificationService.notifyPlayerOne(gameId, 'gameStart', {
        playerId: 1,
        gameState: gameState.toSerializable(),
        playerCount: room.getPlayerCount(),
      });

      this.logger.log(`AI game started: ${gameId}`);
      return;
    }

    if (type === 'public' || type === 'private') {
      const result = this.gameRoomService.createRoom(
        type as 'public' | 'private',
        client.id,
      );
      const gameId = result.gameId;
      const playerNumber = 1;

      // Join rooms
      client.join(gameId);
      client.join(`${gameId}-p${playerNumber}`);

      // Track player
      this.socketToRoom.set(client.id, gameId);
      this.socketToPlayer.set(client.id, playerNumber);

      client.emit('gameCreated', {
        code: gameId,
        type,
        playerId: playerNumber,
      });
      this.logger.log(
        `${type} game created: ${gameId} by player ${playerNumber}`,
      );
      return;
    }

    client.emit('createError', { reason: 'Invalid game type' });
  }

  /**
   * Handle player joining a specific game by code
   * payload: { code: string }
   */
  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage('joinGame')
  handleJoinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinGameDto,
  ) {
    const code = payload && payload.code;
    if (!code) {
      client.emit('joinError', { reason: 'Missing game code' });
      return;
    }

    const result = this.gameRoomService.joinRoomByCode(code, client.id);
    if (result.error) {
      client.emit('joinError', { reason: result.error });
      return;
    }

    const room = result.room!;
    const playerNumber = 2;
    const gameState = room.getGameState();
    const gameId = gameState.gameId;

    // Join rooms
    client.join(gameId);
    client.join(`${gameId}-p${playerNumber}`);

    // Track player
    this.socketToRoom.set(client.id, gameId);
    this.socketToPlayer.set(client.id, playerNumber);

    // Notify both players about the join
    this.notificationService.notifyPlayerTwo(gameId, 'gameJoined', {
      playerId: 2,
      gameState: gameState.toSerializable(),
      playerCount: room.getPlayerCount(),
    });

    this.notificationService.notifyPlayerOne(gameId, 'gameStart', {
      playerId: 1,
      gameState: gameState.toSerializable(),
      playerCount: room.getPlayerCount(),
    });

    // if (room.getPlayerCount() === 2) {
    //   this.notificationService.notifyBothPlayers(gameId, 'gameStart', {
    //     gameState: gameState.toSerializable(),
    //   });
    //   this.logger.log(`Game ${gameId} started`);
    // }

    this.logger.log(
      `Player ${client.id} joined game ${gameId} as player ${playerNumber}`,
    );

    // If room is full, start game
    if (room.getPlayerCount() === 2) {
      //   this.notificationService.notifyBothPlayers(gameId, 'gameStart', {
      //     gameState: gameState.toSerializable(),
      //   });
      this.logger.log(`Game ${gameId} started`);
    }
  }

  /**
   * Join a random public game (no code required). Creates one if none available.
   */
  @SubscribeMessage('joinPublic')
  handleJoinPublic(@ConnectedSocket() client: Socket) {
    const { room, playerNumber } = this.gameRoomService.joinRandomPublicRoom(
      client.id,
    );
    const gameState = room.getGameState();
    const gameId = gameState.gameId;

    // Join rooms
    client.join(gameId);
    client.join(`${gameId}-p${playerNumber}`);

    // Track player
    this.socketToRoom.set(client.id, gameId);
    this.socketToPlayer.set(client.id, playerNumber);

    // Notify the joining player
    client.emit('gameJoined', {
      playerId: playerNumber,
      gameState: gameState.toSerializable(),
      playerCount: room.getPlayerCount(),
    });

    this.logger.log(
      `Player ${client.id} joined public game ${gameId} as player ${playerNumber}`,
    );

    // If room is full, start game
    if (room.getPlayerCount() === 2) {
      this.notificationService.notifyBothPlayers(gameId, 'gameStart', {
        gameState: gameState.toSerializable(),
      });
      this.logger.log(`Game ${gameId} started`);
    }
  }

  /**
   * Handle move
   */
  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage('makeMove')
  async handleMakeMove(
    // Async pour gérer le délai IA
    @ConnectedSocket() client: Socket,
    @MessageBody() moveDto: MakeMoveDto,
  ) {
    const gameId = this.socketToRoom.get(client.id);
    if (!gameId) return;

    // 1. Exécuter le coup de l'humain
    const result = this.gameRoomService.makeMove(
      gameId,
      client.id,
      moveDto.x,
      moveDto.y,
    );

    if (result.success) {
      // Notifier tout le monde du coup humain
      this.notificationService.notifyBothPlayers(gameId, 'moveMade', {
        gameState: result.gameState,
        move: result.move,
        capturedStones: result.capturedStones,
        capturedAreas: result.capturedAreas,
      });

      // === DÉCLENCHEMENT DU TOUR DE L'IA ===
      // Si la partie est de type IA et que c'est maintenant au tour du Joueur 2
      if (
        result.gameState &&
        result.gameState.gameType === 'AI' &&
        result.gameState.currentPlayer === GAME_CONSTANTS.PLAYER_TWO
      ) {
        await this.triggerAiMove(gameId);
      }
      // ======================================
    } else {
      client.emit('moveError', { reason: result.reason });
    }
  }

  /**
   * Méthode privée pour gérer le tour de l'IA
   */
  private async triggerAiMove(gameId: string) {
    const room = this.gameRoomService.getRoom(gameId);
    if (!room) return;

    try {
      const gameState = room.getGameState();

      // OPTION 1: Difficulté fixe (Expert)
      const difficulty = 5; // 1=Random, 2=Defensive, 3=Offensive, 4=Strategic, 5=Expert

      // OPTION 2: Difficulté basée sur les paramètres de la room (si vous l'avez stocké)
      // const difficulty = room.aiDifficulty || 5;

      // Calculer le coup de l'IA avec le niveau choisi
      const aiMove = this.aiService.calculateNextMove(
        gameState as any,
        GAME_CONSTANTS.GRID_SIZE,
        difficulty,
      );

      // L'IA joue
      const result = this.gameRoomService.makeMove(
        gameId,
        GAME_CONSTANTS.AI_PLAYER_ID,
        aiMove.x,
        aiMove.y,
      );

      if (result.success) {
        this.logger.log(
          `AI (P2) moved at (${aiMove.x}, ${aiMove.y}) - Difficulty: ${difficulty}`,
        );

        // Notifier le frontend
        this.notificationService.notifyBothPlayers(gameId, 'moveMade', {
          gameState: result.gameState,
          move: result.move,
          capturedStones: result.capturedStones,
          capturedAreas: result.capturedAreas,
        });
      } else {
        this.logger.error(`AI failed to move: ${result.reason}`);

        // Fallback: essayer un coup aléatoire
        this.handleAiMoveFailure(gameId);
      }
    } catch (error) {
      this.logger.error('Error during AI execution', error);
      this.handleAiMoveFailure(gameId);
    }
  }

  /**
   * Gestion des échecs de l'IA
   */
  private handleAiMoveFailure(gameId: string) {
    const room = this.gameRoomService.getRoom(gameId);
    if (!room) return;

    try {
      const gameState = room.getGameState();

      // Essayer avec un coup aléatoire (niveau 1)
      this.logger.warn('AI retrying with random move (difficulty 1)');

      const aiMove = this.aiService.calculateNextMove(
        gameState as any,
        GAME_CONSTANTS.GRID_SIZE,
        2, // Coup aléatoire
      );

      const result = this.gameRoomService.makeMove(
        gameId,
        GAME_CONSTANTS.AI_PLAYER_ID,
        aiMove.x,
        aiMove.y,
      );

      if (result.success) {
        this.notificationService.notifyBothPlayers(gameId, 'moveMade', {
          gameState: result.gameState,
          move: result.move,
          capturedStones: result.capturedStones,
          capturedAreas: result.capturedAreas,
        });
      } else {
        // L'IA ne peut vraiment pas jouer, terminer la partie
        this.notificationService.notifyBothPlayers(gameId, 'gameError', {
          reason: 'AI cannot make a move - game ending',
        });
      }
    } catch (fallbackError) {
      this.logger.error('AI fallback also failed', fallbackError);
    }
  }
  /**
   * Handle score calculation request
   */
  @SubscribeMessage('calculateScore')
  handleCalculateScore(@ConnectedSocket() client: Socket) {
    const gameId = this.socketToRoom.get(client.id);
    if (!gameId) {
      client.emit('scoreError', { reason: 'Not in a game' });
      return;
    }

    const finalScore = this.gameRoomService.calculateFinalScore(gameId);
    if (finalScore) {
      this.notificationService.notifyBothPlayers(
        gameId,
        'finalScore',
        finalScore,
      );
      this.logger.log(`Final score calculated for game ${gameId}`);
    } else {
      client.emit('scoreError', { reason: 'Failed to calculate score' });
    }
  }

  /**
   * Handle game reset
   */
  @SubscribeMessage('resetGame')
  handleResetGame(@ConnectedSocket() client: Socket) {
    const gameId = this.socketToRoom.get(client.id);
    if (!gameId) {
      client.emit('resetError', { reason: 'Not in a game' });
      return;
    }

    const success = this.gameRoomService.resetGame(gameId);
    if (success) {
      const room = this.gameRoomService.getRoom(gameId);
      if (room) {
        this.notificationService.notifyBothPlayers(gameId, 'gameReset', {
          gameState: room.getGameState().toSerializable(),
        });
        this.logger.log(`Game ${gameId} reset`);
      }
    } else {
      client.emit('resetError', { reason: 'Failed to reset game' });
    }
  }
}

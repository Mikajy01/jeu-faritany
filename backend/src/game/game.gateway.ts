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
import { GameManagerService } from './services/game-manager.service';
import { MakeMoveDto } from './dto/make-move.dto';
import { CreateGameDto } from './dto/create-game.dto';
import { JoinGameDto } from './dto/join-game.dto';
import { NotificationService } from './services/notification.service';
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

  constructor(
    private readonly gameRoomService: GameRoomService,
    private readonly gameManagerService: GameManagerService,
    private readonly notificationService: NotificationService,
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
    const gameId = this.gameRoomService.getGameIdBySocket(client.id);
    if (gameId) {
      this.gameManagerService.handlePlayerDisconnected(gameId, client.id);
    }
  }

  /**
   * Create a new game (public | private | AI)
   */
  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage('createGame')
  handleCreateGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CreateGameDto,
  ) {
    this.logger.log(`Create game request: ${JSON.stringify(payload)}`);
    const type = payload?.type || 'public';

    const result = this.gameRoomService.createRoom(type, client.id, payload);
    const gameId = result.gameId;

    client.join(gameId);
    client.join(`${gameId}-p1`);

    client.emit('gameCreated', {
      code: gameId,
      type,
      playerId: 1,
    });

    if (type === 'AI') {
      // For AI games, immediately join the AI bot
      this.gameRoomService.joinRoomByCode(gameId, GAME_CONSTANTS.AI_PLAYER_ID);

      const room = this.gameRoomService.getRoom(gameId);
      if (room) {
        this.notificationService.notifyBothPlayers(gameId, 'gameStart', {
          gameState: room.getGameState().toSerializable(),
          playerCount: 2,
        });
      }
    }

    this.gameManagerService.afterGameCreated(gameId, type);
    this.logger.log(`${type} game created: ${gameId} by player 1`);
  }

  /**
   * Handle player joining a specific game by code
   */
  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage('joinGame')
  handleJoinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinGameDto,
  ) {
    const code = payload?.code;
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
    const playerNumber = result.playerNumber!;
    const gameId = room.getGameState().gameId;

    client.join(gameId);
    client.join(`${gameId}-p${playerNumber}`);

    this.notificationService.notifyPlayer(gameId, playerNumber, 'gameJoined', {
      playerId: playerNumber,
      gameState: room.getGameState().toSerializable(),
      playerCount: room.getPlayerCount(),
    });

    if (room.getPlayerCount() === 2) {
      this.notificationService.notifyBothPlayers(gameId, 'gameStart', {
        gameState: room.getGameState().toSerializable(),
        playerCount: 2,
      });
      this.gameManagerService.afterPlayerJoined(gameId);
    }

    this.logger.log(
      `Player ${client.id} joined game ${gameId} as player ${playerNumber}`,
    );
  }

  /**
   * Join a random public game
   */
  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage('joinPublic')
  handleJoinPublic(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CreateGameDto,
  ) {
    const { room, playerNumber } = this.gameRoomService.joinRandomPublicRoom(
      client.id,
      payload,
    );
    const gameId = room.getGameState().gameId;

    client.join(gameId);
    client.join(`${gameId}-p${playerNumber}`);

    client.emit('gameJoined', {
      playerId: playerNumber,
      gameState: room.getGameState().toSerializable(),
      playerCount: room.getPlayerCount(),
    });

    if (room.getPlayerCount() === 2) {
      this.notificationService.notifyBothPlayers(gameId, 'gameStart', {
        gameState: room.getGameState().toSerializable(),
        playerCount: 2,
      });
      this.gameManagerService.afterPlayerJoined(gameId);
    }

    this.logger.log(
      `Player ${client.id} joined public game ${gameId} as player ${playerNumber}`,
    );
  }

  /**
   * Handle resignation
   */
  @SubscribeMessage('resignGame')
  handleResign(@ConnectedSocket() client: Socket) {
    const gameId = this.gameRoomService.getGameIdBySocket(client.id);
    if (gameId) {
      this.gameManagerService.handlePlayerDisconnected(gameId, client.id);
    }
  }

  /**
   * Handle move
   */
  @SubscribeMessage('makeMove')
  async handleMakeMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() moveDto: MakeMoveDto,
  ) {
    const gameId = this.gameRoomService.getGameIdBySocket(client.id);
    if (!gameId) return;

    const result = await this.gameManagerService.makeMove(
      gameId,
      client.id,
      moveDto,
    );

    if (!result.success) {
      client.emit('moveError', { reason: result.reason });
    }
  }

  /**
   * Handle score calculation request
   */
  @SubscribeMessage('calculateScore')
  handleCalculateScore(@ConnectedSocket() client: Socket) {
    const gameId = this.gameRoomService.getGameIdBySocket(client.id);
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
    } else {
      client.emit('scoreError', { reason: 'Failed to calculate score' });
    }
  }

  /**
   * Handle game reset
   */
  @SubscribeMessage('resetGame')
  handleResetGame(@ConnectedSocket() client: Socket) {
    const gameId = this.gameRoomService.getGameIdBySocket(client.id);
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
      }
    } else {
      client.emit('resetError', { reason: 'Failed to reset game' });
    }
  }
}

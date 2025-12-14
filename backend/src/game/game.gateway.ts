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
      const result = this.gameRoomService.createRoom('AI', client.id);
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
        type: 'AI',
        playerId: playerNumber,
        note: 'AI opponent not implemented yet',
      });
      this.logger.log(`AI game created: ${gameId}`);
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
      this.logger.log(`${type} game created: ${gameId} by player ${playerNumber}`);
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
  handleMakeMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() moveDto: MakeMoveDto,
  ) {
    const gameId = this.socketToRoom.get(client.id);
    if (!gameId) {
      client.emit('moveError', { reason: 'Not in a game' });
      return;
    }

    const result = this.gameRoomService.makeMove(
      gameId,
      client.id,
      moveDto.x,
      moveDto.y,
    );

    if (result.success) {
      this.notificationService.notifyBothPlayers(gameId, 'moveMade', {
        gameState: result.gameState,
        move: result.move,
        capturedStones: result.capturedStones,
        capturedAreas: result.capturedAreas,
      });
      this.logger.log(
        `Move made in game ${gameId}: (${moveDto.x}, ${moveDto.y}) by player ${result.move?.player}`,
      );
    } else {
      client.emit('moveError', { reason: result.reason });
      this.logger.warn(`Invalid move in game ${gameId}: ${result.reason}`);
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
      this.notificationService.notifyBothPlayers(gameId, 'finalScore', finalScore);
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
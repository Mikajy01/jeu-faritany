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
    this.logger.log(`Client disconnected: ${client.id}`);

    const gameId = this.gameRoomService.getGameIdBySocket(client.id);
    if (gameId) {
      const room = this.gameRoomService.getRoom(gameId);
      const isPublic = room?.getGameState().gameType === 'public';

      this.gameManagerService.handlePlayerDisconnected(gameId, client.id);

      // ✨ Mettre à jour la liste des salles si c'était une salle publique
      if (isPublic) {
        this.broadcastPublicRooms();
      }
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

    const result = this.gameRoomService.createRoom(
      type as any,
      payload,
      client.id,
      payload.userId,
    );
    const gameId = result.gameId;

    client.join(gameId);
    client.join(`${gameId}-p1`);

    client.emit('gameCreated', {
      code: gameId,
      type,
      playerId: 1,
    });

    if (type === 'public') {
      this.broadcastPublicRooms();
    }

    if (type === 'AI') {
      // For AI games, immediately join the AI bot
      this.gameRoomService
        .getRoom(gameId)
        ?.addPlayer(GAME_CONSTANTS.AI_PLAYER_ID, 'AI_USER');

      const room = this.gameRoomService.getRoom(gameId);
      if (room) {
        this.notificationService.notifyBothPlayers(gameId, 'gameStart', {
          gameState: room.getGameState().toSerializable(),
          playerCount: 2,
        });
        this.gameManagerService.afterGameCreated(gameId, type);
      }
    }
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

    const result = this.gameRoomService.validateJoinRequest(
      code,
      payload.userId || client.id, // Fallback au socket ID si pas de userId
      payload.joinCode,
    );
    if (result.error) {
      client.emit('joinError', { reason: result.error });
      return;
    }

    const room = result.room!;
    const playerNumber = room.addPlayer(client.id, payload.userId)!;
    const gameId = room.getGameState().gameId;

    // ✨ Lier le socket à la room pour les futurs coups
    this.gameRoomService.bindSocketToRoom(client.id, gameId);

    client.join(gameId);
    client.join(`${gameId}-p${playerNumber}`);

    // Utiliser client.emit directement pour être sûr qu'il reçoive son playerId
    client.emit('gameJoined', {
      playerId: playerNumber,
      gameState: room.getGameState().toSerializable(),
      playerCount: room.getPlayerCount(),
      onlineCount: room.getOnlinePlayerCount(),
    });

    // ✨ Mettre à jour la liste des salles si c'est une salle publique
    if (room.getGameState().gameType === 'public') {
      this.broadcastPublicRooms();
    }

    if (room.getOnlinePlayerCount() === 2) {
      this.notificationService.notifyBothPlayers(gameId, 'gameStart', {
        gameState: room.getGameState().toSerializable(),
        playerCount: 2,
      });
      this.gameManagerService.afterPlayerJoined(gameId);
    } else {
      // Re-notifier l'autre joueur que quelqu'un est là
      this.notificationService.notifyBothPlayers(gameId, 'playerJoined', {
        playerCount: room.getPlayerCount(),
        onlineCount: room.getOnlinePlayerCount(),
      });
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
    const { room, playerNumber } =
      this.gameRoomService.joinOrCreateRandomPublicRoom(
        client.id,
        payload,
        payload.userId,
      );
    const gameId = room.getGameState().gameId;

    // ✨ Lier le socket à la room
    this.gameRoomService.bindSocketToRoom(client.id, gameId);

    client.join(gameId);
    client.join(`${gameId}-p${playerNumber}`);

    this.notificationService.notifyPlayer(gameId, playerNumber, 'gameJoined', {
      playerId: playerNumber,
      gameState: room.getGameState().toSerializable(),
      playerCount: room.getPlayerCount(),
      onlineCount: room.getOnlinePlayerCount(),
    });

    // ✨ Mettre à jour la liste des salles pour tout le monde
    this.broadcastPublicRooms();

    if (room.getOnlinePlayerCount() === 2) {
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
   * Handle leaving a room
   */
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@ConnectedSocket() client: Socket) {
    const gameId = this.gameRoomService.getGameIdBySocket(client.id);
    if (gameId) {
      const room = this.gameRoomService.getRoom(gameId);
      const isPublic = room?.getGameState().gameType === 'public';

      // ✨ Nettoyer les timeouts avant de quitter/supprimer
      this.gameManagerService.clearTimeouts(gameId);

      this.gameRoomService.leaveRoom(gameId, client.id);
      client.leave(gameId);

      // ✨ Mettre à jour la liste des salles si c'était une salle publique
      if (isPublic) {
        this.broadcastPublicRooms();
      }

      this.logger.log(`Player ${client.id} left room ${gameId}`);
    }
  }

  /**
   * Handle resignation
   */
  @SubscribeMessage('resignGame')
  handleResignGame(@ConnectedSocket() client: Socket) {
    const gameId = this.gameRoomService.getGameIdBySocket(client.id);
    if (!gameId) return;

    const room = this.gameRoomService.getRoom(gameId);
    if (!room) return;

    const playerNumber = room.getPlayerNumber(client.id);
    if (!playerNumber) return;

    this.gameManagerService.handleGameOver(gameId, playerNumber, 'RESIGN');

    // ✨ Mettre à jour la liste si c'est public
    if (room.getGameState().gameType === 'public') {
      this.broadcastPublicRooms();
    }
    this.logger.log(`Player ${playerNumber} resigned in game ${gameId}`);
  }

  private broadcastPublicRooms() {
    const rooms = this.gameRoomService.getPublicRooms();
    this.server.emit('publicRoomsUpdate', rooms);
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
   * Handle game reset (rematch request)
   */
  @SubscribeMessage('resetGame')
  handleResetGame(@ConnectedSocket() client: Socket) {
    const gameId = this.gameRoomService.getGameIdBySocket(client.id);
    if (!gameId) {
      client.emit('resetError', { reason: 'Not in a game' });
      return;
    }

    const room = this.gameRoomService.getRoom(gameId);
    if (!room) return;

    const playerNumber = room.getPlayerNumber(client.id);
    if (!playerNumber) return;

    const gameState = room.getGameState();
    const type = gameState.gameType;

    if (type === 'AI') {
      // Pour l'IA, on reset immédiatement
      const success = this.gameRoomService.resetGame(gameId);
      if (success) {
        this.notificationService.notifyBothPlayers(gameId, 'gameReset', {
          gameState: room.getGameState().toSerializable(),
        });
        // Redémarrer les timers/IA
        this.gameManagerService.afterGameCreated(gameId, 'AI');
      }
    } else {
      // Pour le multijoueur, on gère les intentions de revanche
      if (!gameState['rematchVotes']) {
        gameState['rematchVotes'] = new Set<number>();
      }

      const votes = gameState['rematchVotes'] as Set<number>;
      votes.add(playerNumber);

      if (votes.size === 2) {
        // Les deux joueurs veulent rejouer
        const success = this.gameRoomService.resetGame(gameId);
        if (success) {
          delete gameState['rematchVotes'];

          // ✨ IMPORTANT: S'assurer que gameActive est bien à true
          room.getGameState().gameActive = true;

          this.notificationService.notifyBothPlayers(gameId, 'gameReset', {
            gameState: room.getGameState().toSerializable(),
          });
          // Redémarrer les timers
          this.gameManagerService.afterPlayerJoined(gameId);
        }
      } else {
        // Un seul joueur a voté, on notifie l'autre
        this.notificationService.notifyBothPlayers(gameId, 'rematchRequest', {
          playerNumber,
          message: `Le joueur ${playerNumber} souhaite rejouer !`,
        });
      }
    }
  }
}

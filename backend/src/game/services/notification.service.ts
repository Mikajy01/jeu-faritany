// game/services/notification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private server: Server;

  /**
   * Initialize the service with Socket.IO server instance
   * Called once from the gateway
   */
  setServer(server: Server): void {
    this.server = server;
  }

  /**
   * Notify only Player 1 in a room
   */
  notifyPlayerOne(roomId: string, event: string, data?: any): void {
    this.server.to(`${roomId}-p1`).emit(event, data);
    this.logger.debug(`Notified Player 1 in room ${roomId}: ${event}`);
  }

  /**
   * Notify only Player 2 in a room
   */
  notifyPlayerTwo(roomId: string, event: string, data?: any): void {
    this.server.to(`${roomId}-p2`).emit(event, data);
    this.logger.debug(`Notified Player 2 in room ${roomId}: ${event}`);
  }

  /**
   * Notify both players in a room
   */
  notifyBothPlayers(roomId: string, event: string, data?: any): void {
    this.server.to(roomId).emit(event, data);
    this.logger.debug(`Notified both players in room ${roomId}: ${event}`);
  }

  /**
   * Notify a specific player by number
   */
  notifyPlayer(
    roomId: string,
    playerNumber: number,
    event: string,
    data?: any,
  ): void {
    if (playerNumber === 1) {
      this.notifyPlayerOne(roomId, event, data);
    } else if (playerNumber === 2) {
      this.notifyPlayerTwo(roomId, event, data);
    } else {
      this.logger.warn(`Invalid player number: ${playerNumber}`);
    }
  }

  /**
   * Notify all players except a specific player
   */
  notifyOpponent(
    roomId: string,
    playerNumber: number,
    event: string,
    data?: any,
  ): void {
    const opponentNumber = playerNumber === 1 ? 2 : 1;
    this.notifyPlayer(roomId, opponentNumber, event, data);
  }
}

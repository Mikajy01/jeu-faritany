import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { GameRoomService } from './services/game-room.service';
import { CreateGameDto } from './dto/create-game.dto';

@Controller('game')
export class GameController {
  constructor(private readonly gameRoomService: GameRoomService) {}

  @Post('create')
  createRoom(@Body() createGameDto: CreateGameDto) {
    const type = createGameDto.type || 'public';
    // userId est optionnel ici car il sera lié lors du join WebSocket
    return this.gameRoomService.createRoom(type, createGameDto);
  }

  @Post('join-public')
  joinPublic(@Body() createGameDto: CreateGameDto) {
    const result = this.gameRoomService.joinOrCreateRandomPublicRoom(
      undefined,
      createGameDto,
    );
    return {
      gameId: result.gameId,
      gameType: 'public',
      isNew: result.isNew,
      playerNumber: result.playerNumber,
    };
  }

  @Post('validate-join')
  validateJoin(
    @Body() payload: { gameId: string; userId: string; joinCode?: string },
  ) {
    const result = this.gameRoomService.validateJoinRequest(
      payload.gameId,
      payload.userId,
      payload.joinCode,
    );

    if (result.error) {
      return { success: false, error: result.error };
    }

    const gameState = result.room!.getGameState();
    return {
      success: true,
      gameId: payload.gameId,
      gameType: gameState.gameType,
      playerNumber: result.playerNumber,
      isRejoin: result.isRejoin,
      gameActive: gameState.gameActive, // ✨ Statut de la partie
      joinCode: gameState.joinCode, // Retourner le code pour stockage local
    };
  }

  @Get('public-rooms')
  getPublicRooms() {
    return this.gameRoomService.getPublicRooms();
  }

  @Get('room/:gameId')
  getRoomInfo(@Param('gameId') gameId: string) {
    const room = this.gameRoomService.getRoom(gameId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const gameState = room.getGameState();
    return {
      gameId: gameState.gameId,
      gameType: gameState.gameType,
      gridSize: gameState.gridSize,
      playerCount: room.getPlayerCount(),
      gameActive: gameState.gameActive,
      gameOver: !!gameState.gameOver,
    };
  }
}

import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameController } from './game.controller';
import { GameRoomService } from './services/game-room.service';
import { GameLogicService } from './services/game-logic.service';
import { CycleDetectionService } from './services/cycle-detection.service';
import { ScoringService } from './services/scoring.service';
import { NotificationService } from './services/notification.service';
import { AiService } from './services/ai.service';
import { HybridTerritoryService } from './services/hybrid-territory.service';
import { GameManagerService } from './services/game-manager.service';

@Module({
  controllers: [GameController],
  providers: [
    GameGateway,
    GameRoomService,
    GameLogicService,
    NotificationService,
    CycleDetectionService,
    ScoringService,
    AiService,
    HybridTerritoryService,
    GameManagerService,
  ],
})
export class GameModule {}

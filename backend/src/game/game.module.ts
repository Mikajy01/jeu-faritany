import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameRoomService } from './services/game-room.service';
import { GameLogicService } from './services/game-logic.service';
import { CycleDetectionService } from './services/cycle-detection.service';
import { TerritoryService } from './services/territory.service';
import { ScoringService } from './services/scoring.service';
import { NotificationService } from './services/notification.service';
import { AiService } from './services/ai.service';
import { HybridTerritoryService } from './services/hybrid-territory.service';

@Module({
  providers: [
    GameGateway,
    GameRoomService,
    GameLogicService,
    NotificationService,
    CycleDetectionService,
    TerritoryService,
    ScoringService,
    AiService,
    HybridTerritoryService,
  ],
})
export class GameModule {}
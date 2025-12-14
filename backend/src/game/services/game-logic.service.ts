import { Injectable, Logger } from '@nestjs/common';
import { GameStateEntity } from '../entities/game-state.entity';
import { MoveResult } from '../interfaces/game.interface';
import { CycleDetectionService } from './cycle-detection.service';
import { TerritoryService } from './territory.service';
import { ScoringService } from './scoring.service';
import { CoordinateUtil } from '../../common/utils/coordinate.util';
import { GAME_CONSTANTS } from 'src/common/constants/game.constant';

@Injectable()
export class GameLogicService {
  private readonly logger = new Logger(GameLogicService.name);

  constructor(
    private readonly cycleDetectionService: CycleDetectionService,
    private readonly territoryService: TerritoryService,
    private readonly scoringService: ScoringService,
  ) {}

  /**
   * Process a move and return the result
   * Single Responsibility: Orchestrates move logic
   */
  makeMove(
    x: number,
    y: number,
    player: number,
    gameState: GameStateEntity,
    gridSize: number = GAME_CONSTANTS.GRID_SIZE,
  ): MoveResult {
    // Validate move
    const validation = this.validateMove(x, y, player, gameState);
    if (!validation.valid) {
      return { success: false, reason: validation.reason };
    }

    // Place stone
    const key = CoordinateUtil.toKey(x, y);
    gameState.grid[key] = player;

    // Detect cycles and capture stones
    const capturedStones = this.processCycleCaptures(x, y, player, gameState, gridSize);

    // Update scores
    if (capturedStones.length > 0) {
      gameState.scores = this.scoringService.updateScoreAfterCapture(
        gameState.scores,
        player,
        capturedStones.length,
      );
      this.logger.log(`Player ${player} captured ${capturedStones.length} stones`);
    }

    // Update territories
    this.updateCapturedAreas(gameState, gridSize);

    // Switch player
    gameState.currentPlayer = player === GAME_CONSTANTS.PLAYER_ONE 
      ? GAME_CONSTANTS.PLAYER_TWO 
      : GAME_CONSTANTS.PLAYER_ONE;

    return {
      success: true,
      gameState: gameState.toSerializable(),
      move: { x, y, player },
      capturedStones,
      capturedAreas: gameState.capturedAreas,
    };
  }

  /**
   * Validate if a move is legal
   * Open/Closed Principle: Easy to extend with new validation rules
   */
  private validateMove(
    x: number,
    y: number,
    player: number,
    gameState: GameStateEntity,
  ): { valid: boolean; reason?: string } {
    if (!gameState.gameActive) {
      return { valid: false, reason: 'Game not active' };
    }

    if (gameState.currentPlayer !== player) {
      return { valid: false, reason: 'Not your turn' };
    }

    const key = CoordinateUtil.toKey(x, y);
    if (gameState.grid[key] !== undefined) {
      return { valid: false, reason: 'Position occupied' };
    }

    return { valid: true };
  }

  /**
   * Process cycle detection and stone capture
   */
  private processCycleCaptures(
    x: number,
    y: number,
    player: number,
    gameState: GameStateEntity,
    gridSize: number,
  ): string[] {
    const capturedStones: string[] = [];

    // Create getCellState closure
    const getCellState = (cx: number, cy: number): number => {
      const cKey = CoordinateUtil.toKey(cx, cy);
      if (gameState.deadStones.has(cKey)) {
        return GAME_CONSTANTS.EMPTY_CELL;
      }
      return gameState.grid[cKey] || GAME_CONSTANTS.EMPTY_CELL;
    };

    // Find cycles
    const cycles = this.cycleDetectionService.findCycles(
      x,
      y,
      player,
      getCellState,
      gameState.deadStones,
      gridSize,
    );

    this.logger.debug(`Found ${cycles.length} cycles`);

    if (cycles.length > 0) {
      // Get longest cycle
      const longestCycle = this.cycleDetectionService.getLongestCycle(cycles);
      
      if (longestCycle) {
        // Capture stones inside cycle
        const captured = this.cycleDetectionService.captureInsideCycle(
          longestCycle,
          player,
          getCellState,
          gridSize,
        );

        this.logger.log(`Captured ${captured.size} opponent stones in cycle`);

        // Mark stones as dead
        captured.forEach((stone) => {
          gameState.deadStones.add(stone);
          capturedStones.push(stone);
        });
      }
    }

    return capturedStones;
  }

  /**
   * Update captured areas/territories
   */
  private updateCapturedAreas(gameState: GameStateEntity, gridSize: number): void {
    const getCellState = (x: number, y: number): number => {
      const key = CoordinateUtil.toKey(x, y);
      if (gameState.deadStones.has(key)) {
        return GAME_CONSTANTS.EMPTY_CELL;
      }
      return gameState.grid[key] || GAME_CONSTANTS.EMPTY_CELL;
    };

    const territories = this.territoryService.findTerritories(getCellState, gridSize);
    gameState.capturedAreas = this.territoryService.getOwnedTerritories(territories);
  }
}
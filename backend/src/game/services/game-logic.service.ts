import { Injectable, Logger } from '@nestjs/common';
import { GameStateEntity } from '../entities/game-state.entity';
import { MoveResult } from '../interfaces/game.interface';
import { CycleDetectionService } from './cycle-detection.service';
import { ScoringService } from './scoring.service';
import { HybridTerritoryService } from './hybrid-territory.service'; // NOUVEAU
import { CoordinateUtil } from '../../common/utils/coordinate.util';
import { GAME_CONSTANTS } from 'src/common/constants/game.constant';
import { Coordinate } from '../interfaces/game.interface';

@Injectable()
export class GameLogicService {
  private readonly logger = new Logger(GameLogicService.name);

  constructor(
    private readonly cycleDetectionService: CycleDetectionService,
    private readonly scoringService: ScoringService,
    private readonly hybridTerritoryService: HybridTerritoryService, // NOUVEAU
  ) {}

  makeMove(
    x: number,
    y: number,
    player: number,
    gameState: GameStateEntity,
    gridSize: number = GAME_CONSTANTS.GRID_SIZE,
  ): MoveResult {
    const now = Date.now();

    // Validate move
    const validation = this.validateMove(x, y, player, gameState);
    if (!validation.valid) {
      return { success: false, reason: validation.reason };
    }

    // Place stone
    const key = CoordinateUtil.toKey(x, y);
    gameState.grid[key] = player;

    const isSuicideMove = this.checkSuicideMove(
      x,
      y,
      player,
      gameState,
      gridSize,
    );

    if (isSuicideMove) {
      gameState.deadStones.add(key);
    }

    // Detect cycles and capture stones
    const capturedStones = this.processCycleCaptures(
      x,
      y,
      player,
      gameState,
      gridSize,
    );

    // Recalculer les scores
    gameState.scores = this.scoringService.calculateScores(
      gameState.grid,
      gameState.deadStones,
    );

    // Mise à jour des territoires
    this.updateCapturedAreasHybrid(gameState, gridSize);

    // Vérifier si un joueur a atteint l'objectif de score (si en mode SCORE)
    if (gameState.timeControl.gameMode === 'SCORE') {
      const target = gameState.timeControl.targetScore;
      if (
        gameState.scores.player1 >= target ||
        gameState.scores.player2 >= target
      ) {
        gameState.gameActive = false;
        gameState.gameOver = true; // ✨ Marquer comme terminé
        // La partie est terminée, l'appelant s'occupera de notifier le gagnant
      }
    }

    /**
     * 🔁 Switch player
     */
    gameState.currentPlayer =
      player === GAME_CONSTANTS.PLAYER_ONE
        ? GAME_CONSTANTS.PLAYER_TWO
        : GAME_CONSTANTS.PLAYER_ONE;

    gameState.lastPlayer = player;

    /**
     * 🔄 Reset du temps pour le prochain coup
     */
    gameState.clock.remainingMoveTime = gameState.timeControl.moveTimeLimit;
    gameState.clock.lastMoveTimestamp = now;

    return {
      success: true,
      gameState: gameState.toSerializable(),
      move: { x, y, player },
      capturedStones,
      capturedAreas: gameState.capturedAreas,
    };
  }

  /**
   * NOUVELLE MÉTHODE : Mise à jour hybride des territoires capturés
   * Combine la détection de cycles (prisons) et la détection BFS (territoires)
   */
  private updateCapturedAreasHybrid(
    gameState: GameStateEntity,
    gridSize: number,
  ): void {
    const getCellState = (x: number, y: number): number => {
      const key = CoordinateUtil.toKey(x, y);
      if (gameState.deadStones.has(key)) {
        return GAME_CONSTANTS.EMPTY_CELL;
      }
      return gameState.grid[key] || GAME_CONSTANTS.EMPTY_CELL;
    };

    // Utiliser le nouveau service hybride
    this.hybridTerritoryService.updateCapturedAreas(
      gameState,
      getCellState,
      gridSize,
    );
  }

  // ... reste du code identique (checkSuicideMove, validateMove, etc.)

  private checkSuicideMove(
    x: number,
    y: number,
    player: number,
    gameState: GameStateEntity,
    gridSize: number,
  ): boolean {
    const opponent =
      player === GAME_CONSTANTS.PLAYER_ONE
        ? GAME_CONSTANTS.PLAYER_TWO
        : GAME_CONSTANTS.PLAYER_ONE;

    const getCellStateBeforeMove = (cx: number, cy: number): number => {
      const cKey = CoordinateUtil.toKey(cx, cy);

      if (cx === x && cy === y) {
        return GAME_CONSTANTS.EMPTY_CELL;
      }

      if (gameState.deadStones.has(cKey)) {
        return GAME_CONSTANTS.EMPTY_CELL;
      }
      return gameState.grid[cKey] || GAME_CONSTANTS.EMPTY_CELL;
    };

    const opponentCycles = this.findAllPlayerCycles(
      opponent,
      getCellStateBeforeMove,
      gameState.deadStones,
      gridSize,
    );

    for (const cycle of opponentCycles) {
      const polygon = cycle.map((c) => [c.x, c.y] as [number, number]);

      if (polygon.length > 0) {
        const first = polygon[0];
        const last = polygon[polygon.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          polygon.push([first[0], first[1]]);
        }
      }

      if (this.isPointInPolygon([x, y], polygon)) {
        return true;
      }
    }

    return false;
  }

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

  private processCycleCaptures(
    x: number,
    y: number,
    player: number,
    gameState: GameStateEntity,
    gridSize: number,
  ): string[] {
    const capturedStones: string[] = [];

    const getCellState = (cx: number, cy: number): number => {
      const cKey = CoordinateUtil.toKey(cx, cy);
      if (gameState.deadStones.has(cKey)) {
        return GAME_CONSTANTS.EMPTY_CELL;
      }
      return gameState.grid[cKey] || GAME_CONSTANTS.EMPTY_CELL;
    };

    const cycles = this.cycleDetectionService.findCycles(
      x,
      y,
      player,
      getCellState,
      gameState.deadStones,
      gridSize,
    );

    if (cycles.length > 0) {
      const longestCycle = this.cycleDetectionService.getLongestCycle(cycles);

      if (longestCycle) {
        const captured = this.cycleDetectionService.captureInsideCycle(
          longestCycle,
          player,
          getCellState,
          gridSize,
        );

        const revivedStones = this.reviveAlliedStones(
          longestCycle,
          player,
          gameState,
          gridSize,
        );

        captured.forEach((stone) => {
          gameState.deadStones.add(stone);
          capturedStones.push(stone);
        });
      }
    }

    return capturedStones;
  }

  private reviveAlliedStones(
    cycle: Coordinate[],
    player: number,
    gameState: GameStateEntity,
    gridSize: number,
  ): string[] {
    const revivedStones: string[] = [];

    const polygon = cycle.map((c) => [c.x, c.y] as [number, number]);

    if (polygon.length > 0) {
      const first = polygon[0];
      const last = polygon[polygon.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        polygon.push([first[0], first[1]]);
      }
    }

    const bounds = this.getBounds(cycle);

    const deadStonesToRevive: string[] = [];

    for (const deadStoneKey of gameState.deadStones) {
      const coord = CoordinateUtil.fromKey(deadStoneKey);
      const stoneOwner = gameState.grid[deadStoneKey];

      if (stoneOwner === player) {
        if (
          coord.x >= Math.max(0, bounds.minX) &&
          coord.x <= Math.min(gridSize - 1, bounds.maxX) &&
          coord.y >= Math.max(0, bounds.minY) &&
          coord.y <= Math.min(gridSize - 1, bounds.maxY)
        ) {
          if (this.isPointInPolygon([coord.x, coord.y], polygon)) {
            deadStonesToRevive.push(deadStoneKey);
            revivedStones.push(deadStoneKey);
          }
        }
      }
    }

    deadStonesToRevive.forEach((key) => {
      gameState.deadStones.delete(key);
      const coord = CoordinateUtil.fromKey(key);
    });

    return revivedStones;
  }

  private findAllPlayerCycles(
    player: number,
    getCellState: (x: number, y: number) => number,
    deadStones: Set<string>,
    gridSize: number,
  ): Coordinate[][] {
    const allCycles: Coordinate[][] = [];
    const processedCycles = new Set<string>();

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        if (getCellState(x, y) === player) {
          const cycles = this.cycleDetectionService.findCycles(
            x,
            y,
            player,
            getCellState,
            deadStones,
            gridSize,
          );

          for (const cycle of cycles) {
            const cycleKey = this.getCycleKey(cycle);
            if (!processedCycles.has(cycleKey)) {
              processedCycles.add(cycleKey);
              allCycles.push(cycle);
            }
          }
        }
      }
    }

    return this.filterOverlappingCycles(allCycles);
  }

  private getCycleKey(cycle: Coordinate[]): string {
    const sorted = [...cycle].sort((a, b) => {
      if (a.x !== b.x) return a.x - b.x;
      return a.y - b.y;
    });
    return sorted.map((c) => `${c.x},${c.y}`).join('|');
  }

  private filterOverlappingCycles(cycles: Coordinate[][]): Coordinate[][] {
    if (cycles.length === 0) return [];

    const sorted = [...cycles].sort((a, b) => b.length - a.length);
    const result: Coordinate[][] = [];

    for (const cycle of sorted) {
      let overlaps = false;

      for (const existing of result) {
        if (this.cyclesOverlap(cycle, existing)) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        result.push(cycle);
      }
    }

    return result;
  }

  private cyclesOverlap(cycle1: Coordinate[], cycle2: Coordinate[]): boolean {
    const set1 = new Set(cycle1.map((c) => CoordinateUtil.toKey(c.x, c.y)));
    const set2 = new Set(cycle2.map((c) => CoordinateUtil.toKey(c.x, c.y)));

    let common = 0;
    for (const key of set1) {
      if (set2.has(key)) common++;
    }

    const minSize = Math.min(set1.size, set2.size);
    return common > minSize * 0.5;
  }

  private getBounds(points: Coordinate[]): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } {
    if (points.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };

    let minX = points[0].x,
      maxX = points[0].x;
    let minY = points[0].y,
      maxY = points[0].y;

    for (const p of points) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }

    return { minX, maxX, minY, maxY };
  }

  private isPointInPolygon(
    point: [number, number],
    polygon: [number, number][],
  ): boolean {
    let intersections = 0;
    const [x, y] = point;

    for (let k = 0; k < polygon.length - 1; k++) {
      const [x1, y1] = polygon[k];
      const [x2, y2] = polygon[k + 1];

      if (y < y1 !== y < y2 && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1) {
        intersections++;
      }
    }

    return intersections % 2 === 1;
  }
}

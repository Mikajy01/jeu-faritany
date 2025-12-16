import { Injectable, Logger } from '@nestjs/common';
import { GameStateEntity } from '../entities/game-state.entity';
import { MoveResult } from '../interfaces/game.interface';
import { CycleDetectionService } from './cycle-detection.service';
import { TerritoryService } from './territory.service';
import { ScoringService } from './scoring.service';
import { CoordinateUtil } from '../../common/utils/coordinate.util';
import { GAME_CONSTANTS } from 'src/common/constants/game.constant';
import { Coordinate } from '../interfaces/game.interface';

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

    const isSuicideMove = this.checkSuicideMove(
      x,
      y,
      player,
      gameState,
      gridSize,
    );

    if (isSuicideMove) {
      // Mark the stone as dead
      gameState.deadStones.add(key);
      this.logger.log(
        `Suicide move: Player ${player} placed stone at (${x},${y}) in enemy prison`,
      );
    }

    // Detect cycles and capture stones
    const capturedStones = this.processCycleCaptures(
      x,
      y,
      player,
      gameState,
      gridSize,
    );

    // NOUVELLE LOGIQUE: Recalculer tous les scores basés sur deadStones
    gameState.scores = this.scoringService.calculateScores(
      gameState.grid,
      gameState.deadStones,
    );

    if (capturedStones.length > 0) {
      this.logger.log(
        `Player ${player} captured ${capturedStones.length} stones. ` +
          `New scores: P1=${gameState.scores.player1}, P2=${gameState.scores.player2}`,
      );
    }

    // Mettre à jour les cycles actifs
    this.updateActiveCycles(gameState, gridSize);

    // Switch player
    gameState.currentPlayer =
      player === GAME_CONSTANTS.PLAYER_ONE
        ? GAME_CONSTANTS.PLAYER_TWO
        : GAME_CONSTANTS.PLAYER_ONE;
    this.logger.debug('capturedArreas:', gameState.capturedAreas);

    return {
      success: true,
      gameState: gameState.toSerializable(),
      move: { x, y, player },
      capturedStones,
      capturedAreas: gameState.capturedAreas,
    };
  }

  /**
   * Vérifie si la pierre placée est dans une prison ennemie
   */
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

      // Ignorer la pierre qu'on vient de placer pour la détection
      if (cx === x && cy === y) {
        return GAME_CONSTANTS.EMPTY_CELL;
      }

      if (gameState.deadStones.has(cKey)) {
        return GAME_CONSTANTS.EMPTY_CELL;
      }
      return gameState.grid[cKey] || GAME_CONSTANTS.EMPTY_CELL;
    };

    // Trouver tous les cycles de l'adversaire
    const opponentCycles = this.findAllPlayerCycles(
      opponent,
      getCellStateBeforeMove,
      gameState.deadStones,
      gridSize,
    );

    // Vérifier si le point (x, y) est dans un cycle ennemi
    for (const cycle of opponentCycles) {
      const polygon = cycle.map((c) => [c.x, c.y] as [number, number]);

      // Fermer le polygone
      if (polygon.length > 0) {
        const first = polygon[0];
        const last = polygon[polygon.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          polygon.push([first[0], first[1]]);
        }
      }

      if (this.isPointInPolygon([x, y], polygon)) {
        return true; // C'est un suicide move
      }
    }

    return false;
  }

  /**
   * Validate if a move is legal
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

    this.logger.debug(`Found ${cycles.length} cycles`);

    if (cycles.length > 0) {
      const longestCycle = this.cycleDetectionService.getLongestCycle(cycles);

      if (longestCycle) {
        const captured = this.cycleDetectionService.captureInsideCycle(
          longestCycle,
          player,
          getCellState,
          gridSize,
        );

        this.logger.log(`Captured ${captured.size} opponent stones in cycle`);

        // NOUVEAU: Raviver les pierres alliées dans la prison
        const revivedStones = this.reviveAlliedStones(
          longestCycle,
          player,
          gameState,
          gridSize,
        );

        if (revivedStones.length > 0) {
          this.logger.log(
            `Revived ${revivedStones.length} allied stones in captured prison`,
          );
        }

        // Marquer les pierres adverses comme mortes
        captured.forEach((stone) => {
          gameState.deadStones.add(stone);
          capturedStones.push(stone);
        });
      }
    }

    return capturedStones;
  }

  /**
 * Raviver les pierres alliées mortes qui se trouvent dans une prison qu'on vient de capturer
 */
private reviveAlliedStones(
  cycle: Coordinate[],
  player: number,
  gameState: GameStateEntity,
  gridSize: number,
): string[] {
  const revivedStones: string[] = [];
  
  // Créer le polygone de la prison
  const polygon = cycle.map(c => [c.x, c.y] as [number, number]);
  
  // Fermer le polygone
  if (polygon.length > 0) {
    const first = polygon[0];
    const last = polygon[polygon.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      polygon.push([first[0], first[1]]);
    }
  }

  const bounds = this.getBounds(cycle);

  // Parcourir toutes les pierres mortes
  const deadStonesToRevive: string[] = [];
  
  for (const deadStoneKey of gameState.deadStones) {
    const coord = CoordinateUtil.fromKey(deadStoneKey);
    const stoneOwner = gameState.grid[deadStoneKey];
    
    // Si c'est une pierre alliée morte
    if (stoneOwner === player) {
      // Vérifier si elle est dans le bounds (optimisation)
      if (
        coord.x >= Math.max(0, bounds.minX) &&
        coord.x <= Math.min(gridSize - 1, bounds.maxX) &&
        coord.y >= Math.max(0, bounds.minY) &&
        coord.y <= Math.min(gridSize - 1, bounds.maxY)
      ) {
        // Vérifier si elle est dans la prison
        if (this.isPointInPolygon([coord.x, coord.y], polygon)) {
          deadStonesToRevive.push(deadStoneKey);
          revivedStones.push(deadStoneKey);
        }
      }
    }
  }

  // Retirer les pierres ravivées de deadStones
  deadStonesToRevive.forEach((key) => {
    gameState.deadStones.delete(key);
    const coord = CoordinateUtil.fromKey(key);
    this.logger.debug(`Revived allied stone at (${coord.x}, ${coord.y})`);
  });

  return revivedStones;
}
  /**
   * Détecter et maintenir tous les cycles actifs
   * Un cycle reste actif tant que ses pierres ne sont pas capturées
   */
  private updateActiveCycles(
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

    gameState.capturedAreas = [];

    // Trouver tous les cycles pour chaque joueur
    for (const player of [
      GAME_CONSTANTS.PLAYER_ONE,
      GAME_CONSTANTS.PLAYER_TWO,
    ]) {
      const playerCycles = this.findAllPlayerCycles(
        player,
        getCellState,
        gameState.deadStones,
        gridSize,
      );

      // Convertir les cycles en territoires
      for (const cycle of playerCycles) {
        const territory = {
          points: this.getPointsInCycle(cycle, getCellState, gridSize),
          owner: player,
          stones: cycle,
        };
        gameState.capturedAreas.push(territory);
      }
    }

    this.logger.debug(`Active cycles: ${gameState.capturedAreas.length}`);
  }

  /**
   * Trouver tous les cycles d'un joueur sur le plateau
   */
  private findAllPlayerCycles(
    player: number,
    getCellState: (x: number, y: number) => number,
    deadStones: Set<string>,
    gridSize: number,
  ): Coordinate[][] {
    const allCycles: Coordinate[][] = [];
    const processedCycles = new Set<string>();

    // Parcourir toutes les pierres du joueur
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

          // Ajouter uniquement les cycles uniques
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

    // Garder seulement le cycle le plus long pour chaque zone
    return this.filterOverlappingCycles(allCycles);
  }

  /**
   * Créer une clé unique pour identifier un cycle
   */
  private getCycleKey(cycle: Coordinate[]): string {
    // Trier les coordonnées pour avoir une clé normalisée
    const sorted = [...cycle].sort((a, b) => {
      if (a.x !== b.x) return a.x - b.x;
      return a.y - b.y;
    });
    return sorted.map((c) => `${c.x},${c.y}`).join('|');
  }

  /**
   * Filtrer les cycles qui se chevauchent (garder le plus long)
   */
  private filterOverlappingCycles(cycles: Coordinate[][]): Coordinate[][] {
    if (cycles.length === 0) return [];

    // Trier par longueur décroissante
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

  /**
   * Vérifier si deux cycles se chevauchent
   */
  private cyclesOverlap(cycle1: Coordinate[], cycle2: Coordinate[]): boolean {
    const set1 = new Set(cycle1.map((c) => CoordinateUtil.toKey(c.x, c.y)));
    const set2 = new Set(cycle2.map((c) => CoordinateUtil.toKey(c.x, c.y)));

    // Si plus de 50% des pierres sont communes, considérer comme chevauchement
    let common = 0;
    for (const key of set1) {
      if (set2.has(key)) common++;
    }

    const minSize = Math.min(set1.size, set2.size);
    return common > minSize * 0.5;
  }

  /**
   * Obtenir tous les points à l'intérieur d'un cycle
   */
  private getPointsInCycle(
    cycle: Coordinate[],
    getCellState: (x: number, y: number) => number,
    gridSize: number,
  ): Coordinate[] {
    const points: Coordinate[] = [];
    const polygon = cycle.map((c) => [c.x, c.y] as [number, number]);

    // Fermer le polygone
    if (polygon.length > 0) {
      const first = polygon[0];
      const last = polygon[polygon.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        polygon.push([first[0], first[1]]);
      }
    }

    const bounds = this.getBounds(cycle);

    for (
      let x = Math.max(0, bounds.minX);
      x <= Math.min(gridSize - 1, bounds.maxX);
      x++
    ) {
      for (
        let y = Math.max(0, bounds.minY);
        y <= Math.min(gridSize - 1, bounds.maxY);
        y++
      ) {
        if (this.isPointInPolygon([x, y], polygon)) {
          points.push({ x, y });
        }
      }
    }

    return points;
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

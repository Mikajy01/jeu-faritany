import { Injectable, Logger } from '@nestjs/common';
import { Coordinate } from '../interfaces/game.interface';
import { CoordinateUtil } from '../../common/utils/coordinate.util';
import { PolygonUtil } from '../../common/utils/polygon.util';
import { DIRECTIONS, GAME_CONSTANTS } from 'src/common/constants/game.constant';

@Injectable()
export class CycleDetectionService {
  private readonly logger = new Logger(CycleDetectionService.name);

  /**
   * Find all cycles starting from a given position
   * Single Responsibility: Only handles cycle detection logic
   */
  findCycles(
    startX: number,
    startY: number,
    player: number,
    getCellState: (x: number, y: number) => number,
    deadStones: Set<string>,
    gridSize: number = GAME_CONSTANTS.GRID_SIZE,
  ): Coordinate[][] {
    const cycles: Coordinate[][] = [];
    const visited = new Set<string>();
    const path: Coordinate[] = [];

    const isInPath = (x: number, y: number): boolean => {
      return path.some((p) => p.x === x && p.y === y);
    };

    const isValid = (x: number, y: number): boolean => {
      return (
        CoordinateUtil.isValid(x, y, gridSize) &&
        getCellState(x, y) === player &&
        !deadStones.has(CoordinateUtil.toKey(x, y))
      );
    };

    const dfs = (
      x: number,
      y: number,
      startX: number,
      startY: number,
      depth: number,
    ): void => {
      const key = CoordinateUtil.toKey(x, y);
      visited.add(key);
      path.push({ x, y });

      for (const [dx, dy] of DIRECTIONS.ALL) {
        const nx = x + dx;
        const ny = y + dy;
        const nKey = CoordinateUtil.toKey(nx, ny);

        // Found a cycle
        if (
          nx === startX &&
          ny === startY &&
          depth >= GAME_CONSTANTS.MIN_CYCLE_LENGTH
        ) {
          cycles.push([...path]);
          continue;
        }

        // Continue exploring
        if (isValid(nx, ny) && !visited.has(nKey) && !isInPath(nx, ny)) {
          dfs(nx, ny, startX, startY, depth + 1);
        }
      }

      path.pop();
      visited.delete(key);
    };

    if (getCellState(startX, startY) === player) {
      dfs(startX, startY, startX, startY, 1);
    }

    return cycles;
  }

  /**
   * Capture opponent stones inside a cycle
   * Single Responsibility: Only handles capturing logic
   */
  captureInsideCycle(
    cycle: Coordinate[],
    player: number,
    getCellState: (x: number, y: number) => number,
    gridSize: number = GAME_CONSTANTS.GRID_SIZE,
  ): Set<string> {
    const opponent =
      player === GAME_CONSTANTS.PLAYER_ONE
        ? GAME_CONSTANTS.PLAYER_TWO
        : GAME_CONSTANTS.PLAYER_ONE;
    const captured = new Set<string>();

    if (!cycle || cycle.length < 3) {
      return captured;
    }

    try {
      const polygon = PolygonUtil.cycleToPoly(cycle);
      const bounds = PolygonUtil.getBounds(cycle);
      let pointsAnalyzed = 0;

      // Scan only within bounding box
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
          pointsAnalyzed++;

          if (getCellState(x, y) === opponent) {
            const isInside = PolygonUtil.isPointInPolygon([x, y], polygon);

            if (isInside) {
              const key = CoordinateUtil.toKey(x, y);
              captured.add(key);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('Error during cycle capture calculation:', error);
      this.logger.error('Problematic cycle:', cycle);
    }

    return captured;
  }

  /**
   * Get the longest cycle from a list of cycles
   */
  getLongestCycle(cycles: Coordinate[][]): Coordinate[] | null {
    if (cycles.length === 0) return null;
    return cycles.reduce(
      (max, c) => (c.length > max.length ? c : max),
      cycles[0],
    );
  }
}

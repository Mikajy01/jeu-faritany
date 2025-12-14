import { Injectable, Logger } from '@nestjs/common';
import { Coordinate, Territory } from '../interfaces/game.interface';
import { CoordinateUtil } from '../../common/utils/coordinate.util';
import { DIRECTIONS, GAME_CONSTANTS } from 'src/common/constants/game.constant';

@Injectable()
export class TerritoryService {
  private readonly logger = new Logger(TerritoryService.name);

  /**
   * Find all territories on the board
   * Single Responsibility: Territory detection
   */
  findTerritories(
    getCellState: (x: number, y: number) => number,
    gridSize: number = GAME_CONSTANTS.GRID_SIZE,
  ): Territory[] {
    const visited = new Set<string>();
    const territories: Territory[] = [];

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const key = CoordinateUtil.toKey(x, y);
        if (getCellState(x, y) === GAME_CONSTANTS.EMPTY_CELL && !visited.has(key)) {
          const territory = this.exploreTerritory(x, y, visited, getCellState, gridSize);
          if (territory.owner !== null) {
            territories.push(territory);
          }
        }
      }
    }

    return territories;
  }

  /**
   * Explore a territory starting from a point using flood fill
   * Single Responsibility: Territory exploration
   */
  private exploreTerritory(
    startX: number,
    startY: number,
    visited: Set<string>,
    getCellState: (x: number, y: number) => number,
    gridSize: number,
  ): Territory {
    const queue: Coordinate[] = [{ x: startX, y: startY }];
    const points: Coordinate[] = [];
    const boundaryPlayers = new Set<number>();
    const boundaryStones = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentKey = CoordinateUtil.toKey(current.x, current.y);

      if (visited.has(currentKey)) continue;
      visited.add(currentKey);

      if (getCellState(current.x, current.y) !== GAME_CONSTANTS.EMPTY_CELL) continue;

      points.push({ x: current.x, y: current.y });

      const adjacents = CoordinateUtil.getAdjacentCoords(
        current.x,
        current.y,
        DIRECTIONS.ORTHOGONAL,
        gridSize,
      );

      for (const adj of adjacents) {
        const adjKey = CoordinateUtil.toKey(adj.x, adj.y);
        const adjValue = getCellState(adj.x, adj.y);

        if (adjValue === GAME_CONSTANTS.EMPTY_CELL && !visited.has(adjKey)) {
          queue.push(adj);
        } else if (adjValue !== GAME_CONSTANTS.EMPTY_CELL) {
          boundaryPlayers.add(adjValue);
          boundaryStones.add(adjKey);
        }
      }
    }

    // Territory belongs to a player only if surrounded by one player's stones
    let owner: number | null = null;
    if (boundaryPlayers.size === 1) {
      owner = boundaryPlayers.values().next().value;
    }

    return {
      points,
      owner,
      stones: Array.from(boundaryStones).map((key) => CoordinateUtil.fromKey(key)),
    };
  }

  /**
   * Filter territories to only those with an owner
   */
  getOwnedTerritories(territories: Territory[]): Territory[] {
    return territories.filter((t) => t.owner !== null);
  }
}
import { Coordinate } from '../../game/interfaces/game.interface';
import { GAME_CONSTANTS } from '../constants/game.constant';

export class CoordinateUtil {
  static toKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  static fromKey(key: string): Coordinate {
    const [x, y] = key.split(',').map(Number);
    return { x, y };
  }

  static isValid(
    x: number,
    y: number,
    gridSize: number = GAME_CONSTANTS.GRID_SIZE,
  ): boolean {
    return x >= 0 && x < gridSize && y >= 0 && y < gridSize;
  }

  static getAdjacentCoords(
    x: number,
    y: number,
    directions: readonly (readonly [number, number])[],
    gridSize: number = GAME_CONSTANTS.GRID_SIZE,
  ): Coordinate[] {
    const adjacents: Coordinate[] = [];

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isValid(nx, ny, gridSize)) {
        adjacents.push({ x: nx, y: ny });
      }
    }

    return adjacents;
  }
}

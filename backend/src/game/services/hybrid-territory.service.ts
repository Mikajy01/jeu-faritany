import { Injectable, Logger } from '@nestjs/common';
import { CoordinateUtil } from '../../common/utils/coordinate.util';
import { GAME_CONSTANTS } from 'src/common/constants/game.constant';
import { Coordinate } from '../interfaces/game.interface';
import { GameStateEntity } from '../entities/game-state.entity';

export interface Territory {
  points: Coordinate[];
  owner: number | null;
  stones: Coordinate[];
}

@Injectable()
export class HybridTerritoryService {
  private readonly logger = new Logger(HybridTerritoryService.name);

  /**
   * Trouve tous les territoires en utilisant l'approche BFS
   * Compatible avec les cycles ET les territoires non-cycliques
   */
  findAllTerritories(
    getCellState: (x: number, y: number) => number,
    gridSize: number,
  ): Territory[] {
    const visited = new Set<string>();
    const territories: Territory[] = [];

    // Parcourir toutes les cases vides
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const key = CoordinateUtil.toKey(x, y);

        // Si c'est une case vide non visitée
        if (
          getCellState(x, y) === GAME_CONSTANTS.EMPTY_CELL &&
          !visited.has(key)
        ) {
          const territory = this.exploreTerritory(
            x,
            y,
            visited,
            getCellState,
            gridSize,
          );

          // Ne garder que les territoires avec un propriétaire unique
          if (territory.owner !== null) {
            territories.push(territory);
          }
        }
      }
    }

    return territories;
  }

  /**
   * Explore un territoire à partir d'un point de départ (BFS)
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

    let touchesEdge = false;

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentKey = CoordinateUtil.toKey(current.x, current.y);

      if (visited.has(currentKey)) continue;
      visited.add(currentKey);

      if (getCellState(current.x, current.y) !== GAME_CONSTANTS.EMPTY_CELL) {
        continue;
      }

      points.push({ x: current.x, y: current.y });

      const directions = [
        { dx: 0, dy: -1 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
      ];

      for (const dir of directions) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;

        if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize) {
          touchesEdge = true;
          continue;
        }

        const adjKey = CoordinateUtil.toKey(nx, ny);
        const adjValue = getCellState(nx, ny);

        if (adjValue === GAME_CONSTANTS.EMPTY_CELL) {
          if (!visited.has(adjKey)) {
            queue.push({ x: nx, y: ny });
          }
        } else {
          // C'est une pierre (frontière)
          boundaryPlayers.add(adjValue);
          boundaryStones.add(adjKey);
        }
      }
    }

    // Déterminer le propriétaire
    let owner: number | null = null;

    if (!touchesEdge && boundaryPlayers.size === 1) {
      owner = Array.from(boundaryPlayers)[0];
    }

    const stones = Array.from(boundaryStones).map((key) => {
      return CoordinateUtil.fromKey(key);
    });

    return { points, owner, stones };
  }

  /**
   * Obtenir les coordonnées adjacentes valides (4-connexité)
   */
  private getAdjacentCoords(
    x: number,
    y: number,
    gridSize: number,
  ): Coordinate[] {
    const adjacents: Coordinate[] = [];
    const directions = [
      { dx: 0, dy: -1 }, // Haut
      { dx: 1, dy: 0 }, // Droite
      { dx: 0, dy: 1 }, // Bas
      { dx: -1, dy: 0 }, // Gauche
    ];

    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;

      // Vérifier les limites du plateau
      if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
        adjacents.push({ x: nx, y: ny });
      }
    }

    return adjacents;
  }

  /**
   * Mise à jour simplifiée : remplace updateActiveCycles
   */
  updateCapturedAreas(
    gameState: GameStateEntity,
    getCellState: (x: number, y: number) => number,
    gridSize: number,
  ): void {
    const territories = this.findAllTerritories(getCellState, gridSize);

    // Remplacer capturedAreas par les territoires trouvés
    gameState.capturedAreas = territories;
  }
}

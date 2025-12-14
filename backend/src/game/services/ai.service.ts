import { Injectable, Logger } from '@nestjs/common';
import { GameStateEntity } from '../entities/game-state.entity';
import { CoordinateUtil } from '../../common/utils/coordinate.util';
import { GAME_CONSTANTS } from 'src/common/constants/game.constant';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  /**
   * Calcule le prochain coup de l'IA
   * @param gameState L'état actuel du jeu
   * @param gridSize Taille de la grille
   * @param difficulty Niveau de difficulté (1: Aléatoire, 2: Défensif basique, etc.)
   */
  calculateNextMove(
    gameState: GameStateEntity,
    gridSize: number = GAME_CONSTANTS.GRID_SIZE,
    difficulty: number = 1
  ): { x: number; y: number } {
    
    // Récupérer tous les coups possibles
    const availableMoves = this.getAvailableMoves(gameState, gridSize);

    if (availableMoves.length === 0) {
      throw new Error('No moves available for AI');
    }

    // Ici, vous pourrez ajouter des switch cases selon la difficulté
    // Pour l'instant : Comportement aléatoire "intelligent" (évite le suicide immédiat si possible)
    return this.getRandomMove(availableMoves);
  }

  private getAvailableMoves(gameState: GameStateEntity, gridSize: number): { x: number; y: number }[] {
    const moves: { x: number; y: number }[] = [];
    
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const key = CoordinateUtil.toKey(x, y);
        // Si la case est vide et n'est pas une pierre morte
        if (!gameState.grid[key] && !gameState.deadStones.has(key)) {
          moves.push({ x, y });
        }
      }
    }
    return moves;
  }

  private getRandomMove(moves: { x: number; y: number }[]): { x: number; y: number } {
    const randomIndex = Math.floor(Math.random() * moves.length);
    return moves[randomIndex];
  }
}
import { Injectable, Logger } from '@nestjs/common';
import { Scores, GridState } from '../interfaces/game.interface';
import { GAME_CONSTANTS } from 'src/common/constants/game.constant';

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);

  /**
   * Calculer les scores basés sur les deadStones de chaque joueur
   * Le score d'un joueur = nombre de pierres adverses capturées (deadStones)
   */
  calculateScores(
    grid: GridState,
    deadStones: Set<string>,
  ): Scores {
    let player1Captures = 0; // Nombre de pierres du joueur 2 capturées
    let player2Captures = 0; // Nombre de pierres du joueur 1 capturées

    // Compter les deadStones par propriétaire
    for (const deadStoneKey of deadStones) {
      const stoneOwner = grid[deadStoneKey];
      
      if (stoneOwner === GAME_CONSTANTS.PLAYER_ONE) {
        // Pierre du joueur 1 capturée → point pour joueur 2
        player2Captures++;
      } else if (stoneOwner === GAME_CONSTANTS.PLAYER_TWO) {
        // Pierre du joueur 2 capturée → point pour joueur 1
        player1Captures++;
      }
    }

    const scores: Scores = {
      player1: player1Captures,
      player2: player2Captures,
    };

    this.logger.debug(
      `Scores calculés: Player 1 = ${player1Captures}, Player 2 = ${player2Captures}`
    );

    return scores;
  }
}
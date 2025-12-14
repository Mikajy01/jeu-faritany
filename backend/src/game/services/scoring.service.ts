import { Injectable } from '@nestjs/common';
import { FinalScore, Scores, Territory } from '../interfaces/game.interface';
import { TerritoryService } from './territory.service';
import { GAME_CONSTANTS } from 'src/common/constants/game.constant';

@Injectable()
export class ScoringService {
  constructor(private readonly territoryService: TerritoryService) {}

  /**
   * Calculate final score including territories
   * Single Responsibility: Score calculation
   */
  calculateFinalScore(
    currentScores: Scores,
    getCellState: (x: number, y: number) => number,
    gridSize: number = GAME_CONSTANTS.GRID_SIZE,
  ): FinalScore {
    const territories = this.territoryService.findTerritories(getCellState, gridSize);
    
    const territoryScores = this.calculateTerritoryScores(territories);

    return {
      player1: currentScores.player1 + territoryScores.player1,
      player2: currentScores.player2 + territoryScores.player2,
      territories,
    };
  }

  /**
   * Calculate scores from territories
   */
  private calculateTerritoryScores(territories: Territory[]): Scores {
    let player1Territory = 0;
    let player2Territory = 0;

    territories.forEach((territory) => {
      if (territory.owner === GAME_CONSTANTS.PLAYER_ONE) {
        player1Territory += territory.points.length;
      } else if (territory.owner === GAME_CONSTANTS.PLAYER_TWO) {
        player2Territory += territory.points.length;
      }
    });

    return {
      player1: player1Territory,
      player2: player2Territory,
    };
  }

  /**
   * Update score after capturing stones
   */
  updateScoreAfterCapture(
    currentScores: Scores,
    player: number,
    capturedCount: number,
  ): Scores {
    const newScores = { ...currentScores };
    const playerKey = `player${player}` as keyof Scores;
    newScores[playerKey] += capturedCount;
    return newScores;
  }
}
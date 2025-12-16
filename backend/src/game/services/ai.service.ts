import { Injectable, Logger } from '@nestjs/common';
import { GameStateEntity } from '../entities/game-state.entity';
import { CoordinateUtil } from '../../common/utils/coordinate.util';
import { GAME_CONSTANTS } from 'src/common/constants/game.constant';
import { GameLogicService } from './game-logic.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly gameLogicService: GameLogicService,
  ) {}

  /**
   * Calcule le prochain coup de l'IA avec différents niveaux de difficulté
   */
  calculateNextMove(
    gameState: GameStateEntity,
    gridSize: number = GAME_CONSTANTS.GRID_SIZE,
    difficulty: number = 1
  ): { x: number; y: number } {
    const availableMoves = this.getAvailableMoves(gameState, gridSize);

    if (availableMoves.length === 0) {
      throw new Error('No moves available for AI');
    }

    switch (difficulty) {
      case 1:
        // Niveau 1: Aléatoire simple
        return this.getRandomMove(availableMoves);
      
      case 2:
        // Niveau 2: Défensif basique - évite les zones risquées
        return this.getDefensiveMove(gameState, availableMoves, gridSize);
      
      case 3:
        // Niveau 3: Offensif basique - cherche les captures simples
        return this.getOffensiveMove(gameState, availableMoves, gridSize);
      
      case 4:
        // Niveau 4: Stratégique - évalue plusieurs facteurs
        return this.getStrategicMove(gameState, availableMoves, gridSize);
      
      case 5:
        // Niveau 5: Expert - utilise Minimax simple
        return this.getExpertMove(gameState, availableMoves, gridSize);
      
      default:
        return this.getRandomMove(availableMoves);
    }
  }

  private getAvailableMoves(gameState: GameStateEntity, gridSize: number): { x: number; y: number }[] {
    const moves: { x: number; y: number }[] = [];
    
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const key = CoordinateUtil.toKey(x, y);
        if (!gameState.grid[key] && !gameState.deadStones.has(key)) {
          moves.push({ x, y });
        }
      }
    }
    return moves;
  }

  /**
   * Niveau 1: Coup aléatoire
   */
  private getRandomMove(moves: { x: number; y: number }[]): { x: number; y: number } {
    const randomIndex = Math.floor(Math.random() * moves.length);
    return moves[randomIndex];
  }

  /**
   * Niveau 2: Défensif - évite les positions vulnérables
   */
  private getDefensiveMove(
    gameState: GameStateEntity,
    moves: { x: number; y: number }[],
    gridSize: number
  ): { x: number; y: number } {
    // Prioriser les coups qui ne permettent pas à l'adversaire de former un cycle
    const scoredMoves = moves.map(move => {
      let score = 0;
      const key = CoordinateUtil.toKey(move.x, move.y);
      
      // Éviter les positions isolées
      score += this.evaluateIsolation(move, gameState, gridSize);
      
      // Éviter d'être entouré par l'adversaire
      score -= this.countOpponentNeighbors(move, gameState, gridSize) * 2;
      
      // Préférer le centre du plateau
      score += this.evaluateCenterPosition(move, gridSize);
      
      return { move, score };
    });

    // Choisir le meilleur coup défensif
    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0].move;
  }

  /**
   * Niveau 3: Offensif - cherche les captures
   */
  private getOffensiveMove(
    gameState: GameStateEntity,
    moves: { x: number; y: number }[],
    gridSize: number
  ): { x: number; y: number } {
    const scoredMoves = moves.map(move => {
      let score = 0;
      
      // Évaluer le potentiel de capture
      score += this.evaluateCapturePotential(move, gameState, gridSize) * 5;
      
      // Préférer les positions près des pierres adverses
      score += this.countOpponentNeighbors(move, gameState, gridSize);
      
      // Bonus pour le centre
      score += this.evaluateCenterPosition(move, gridSize) * 0.5;
      
      return { move, score };
    });

    // Si aucun coup offensif intéressant, revenir au défensif
    if (scoredMoves[0].score <= 0) {
      return this.getDefensiveMove(gameState, moves, gridSize);
    }

    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0].move;
  }

  /**
   * Niveau 4: Stratégique - équilibre attaque/défense
   */
  private getStrategicMove(
    gameState: GameStateEntity,
    moves: { x: number; y: number }[],
    gridSize: number
  ): { x: number; y: number } {
    const scoredMoves = moves.map(move => {
      let score = 0;
      
      // Facteurs offensifs (40% du score)
      score += this.evaluateCapturePotential(move, gameState, gridSize) * 4;
      score += this.countOpponentNeighbors(move, gameState, gridSize) * 0.5;
      
      // Facteurs défensifs (30% du score)
      score += this.evaluateIsolation(move, gameState, gridSize) * 3;
      score -= this.evaluateVulnerability(move, gameState, gridSize) * 2;
      
      // Facteurs positionnels (30% du score)
      score += this.evaluateCenterPosition(move, gridSize) * 2;
      score += this.evaluateBoardControl(move, gameState, gridSize) * 1.5;
      
      // Pénalité pour les coups trop évidents
      score -= this.evaluateObviousness(move, gameState, gridSize);
      
      return { move, score };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    
    // Parfois choisir le 2ème ou 3ème meilleur coup pour varier
    const topMoves = scoredMoves.slice(0, 3);
    const randomChoice = Math.random();
    if (randomChoice < 0.7) {
      return topMoves[0].move;
    } else if (randomChoice < 0.9) {
      return topMoves[1]?.move || topMoves[0].move;
    } else {
      return topMoves[2]?.move || topMoves[0].move;
    }
  }

  /**
   * Niveau 5: Expert - Minimax simple avec évaluation
   */
  private getExpertMove(
    gameState: GameStateEntity,
    moves: { x: number; y: number }[],
    gridSize: number
  ): { x: number; y: number } {
    const depth = 2; // Profondeur de recherche
    let bestMove = moves[0];
    let bestScore = -Infinity;

    // Limiter le nombre de coups évalués pour la performance
    const evaluatedMoves = moves.slice(0, Math.min(20, moves.length));

    for (const move of evaluatedMoves) {
      // Simuler le coup
      const simulatedState = this.cloneGameState(gameState);
      try {
        const result = this.gameLogicService.makeMove(
          move.x,
          move.y,
          gameState.currentPlayer,
          simulatedState,
          gridSize
        );

        if (result.success) {
          // Évaluer la position résultante
          const score = this.minimax(
            simulatedState,
            depth - 1,
            false,
            -Infinity,
            Infinity,
            gridSize
          );

          if (score > bestScore) {
            bestScore = score;
            bestMove = move;
          }
        }
      } catch (error) {
        this.logger.debug(`Move ${move.x},${move.y} invalid: ${error.message}`);
      }
    }

    return bestMove;
  }

  /**
   * Algorithme Minimax simplifié avec élagage alpha-beta
   */
  private minimax(
    state: GameStateEntity,
    depth: number,
    isMaximizing: boolean,
    alpha: number,
    beta: number,
    gridSize: number
  ): number {
    if (depth === 0) {
      return this.evaluateBoardState(state, gridSize);
    }

    const moves = this.getAvailableMoves(state, gridSize);
    
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves.slice(0, 10)) { // Limiter les branches
        const simulatedState = this.cloneGameState(state);
        try {
          const result = this.gameLogicService.makeMove(
            move.x,
            move.y,
            state.currentPlayer,
            simulatedState,
            gridSize
          );
          
          if (result.success) {
            const evalScore = this.minimax(simulatedState, depth - 1, false, alpha, beta, gridSize);
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break; // Élagage beta
          }
        } catch (error) {
          continue;
        }
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves.slice(0, 10)) {
        const simulatedState = this.cloneGameState(state);
        try {
          const result = this.gameLogicService.makeMove(
            move.x,
            move.y,
            state.currentPlayer,
            simulatedState,
            gridSize
          );
          
          if (result.success) {
            const evalScore = this.minimax(simulatedState, depth - 1, true, alpha, beta, gridSize);
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break; // Élagage alpha
          }
        } catch (error) {
          continue;
        }
      }
      return minEval;
    }
  }

  /**
   * Évalue l'état du plateau pour l'IA
   */
  private evaluateBoardState(state: GameStateEntity, gridSize: number): number {
    let score = 0;
    const aiPlayer = state.currentPlayer;
    const opponent = aiPlayer === GAME_CONSTANTS.PLAYER_ONE 
      ? GAME_CONSTANTS.PLAYER_TWO 
      : GAME_CONSTANTS.PLAYER_ONE;

    // Score basé sur les captures
    score += (state.scores[aiPlayer] - state.scores[opponent]) * 10;

    // Évaluer le contrôle du centre
    const center = Math.floor(gridSize / 2);
    for (let x = center - 1; x <= center + 1; x++) {
      for (let y = center - 1; y <= center + 1; y++) {
        if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
          const key = CoordinateUtil.toKey(x, y);
          if (state.grid[key] === aiPlayer) score += 2;
          else if (state.grid[key] === opponent) score -= 2;
        }
      }
    }

    return score;
  }

  /**
   * Méthodes d'évaluation auxiliaires
   */
  private evaluateCapturePotential(
    move: { x: number; y: number },
    gameState: GameStateEntity,
    gridSize: number
  ): number {
    // Vérifie si ce coup peut aider à former un cycle
    let potential = 0;
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    
    for (const [dx, dy] of directions) {
      const nx = move.x + dx;
      const ny = move.y + dy;
      if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
        const key = CoordinateUtil.toKey(nx, ny);
        const opponent = gameState.currentPlayer === GAME_CONSTANTS.PLAYER_ONE 
          ? GAME_CONSTANTS.PLAYER_TWO 
          : GAME_CONSTANTS.PLAYER_ONE;
        
        if (gameState.grid[key] === opponent) {
          potential++;
        }
      }
    }
    
    return potential;
  }

  private evaluateIsolation(
    move: { x: number; y: number },
    gameState: GameStateEntity,
    gridSize: number
  ): number {
    // Un coup est bien positionné s'il est près d'autres pierres alliées
    let friendlyNeighbors = 0;
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]];
    
    for (const [dx, dy] of directions) {
      const nx = move.x + dx;
      const ny = move.y + dy;
      if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
        const key = CoordinateUtil.toKey(nx, ny);
        if (gameState.grid[key] === gameState.currentPlayer) {
          friendlyNeighbors++;
        }
      }
    }
    
    return friendlyNeighbors;
  }

  private countOpponentNeighbors(
    move: { x: number; y: number },
    gameState: GameStateEntity,
    gridSize: number
  ): number {
    let opponentNeighbors = 0;
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    const opponent = gameState.currentPlayer === GAME_CONSTANTS.PLAYER_ONE 
      ? GAME_CONSTANTS.PLAYER_TWO 
      : GAME_CONSTANTS.PLAYER_ONE;
    
    for (const [dx, dy] of directions) {
      const nx = move.x + dx;
      const ny = move.y + dy;
      if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
        const key = CoordinateUtil.toKey(nx, ny);
        if (gameState.grid[key] === opponent) {
          opponentNeighbors++;
        }
      }
    }
    
    return opponentNeighbors;
  }

  private evaluateCenterPosition(
    move: { x: number; y: number },
    gridSize: number
  ): number {
    const center = gridSize / 2 - 0.5;
    const distance = Math.sqrt(
      Math.pow(move.x - center, 2) + Math.pow(move.y - center, 2)
    );
    // Plus on est près du centre, plus le score est élevé
    return Math.max(0, (gridSize - distance) / gridSize);
  }

  private evaluateVulnerability(
    move: { x: number; y: number },
    gameState: GameStateEntity,
    gridSize: number
  ): number {
    // Évalue si la position est vulnérable aux attaques
    let vulnerability = 0;
    
    // Positions en bordure sont moins vulnérables aux cycles
    if (move.x === 0 || move.x === gridSize - 1 || move.y === 0 || move.y === gridSize - 1) {
      vulnerability -= 2;
    }
    
    // Positions entourées par l'adversaire sont vulnérables
    vulnerability += this.countOpponentNeighbors(move, gameState, gridSize) * 0.5;
    
    return Math.max(0, vulnerability);
  }

  private evaluateBoardControl(
    move: { x: number; y: number },
    gameState: GameStateEntity,
    gridSize: number
  ): number {
    // Évalue le contrôle positionnel du plateau
    let control = 0;
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    
    for (const [dx, dy] of directions) {
      const nx = move.x + dx;
      const ny = move.y + dy;
      if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
        // Les cases vides adjacentes représentent une influence
        const key = CoordinateUtil.toKey(nx, ny);
        if (!gameState.grid[key]) {
          control++;
        }
      }
    }
    
    return control / 4; // Normalisé entre 0 et 1
  }

  private evaluateObviousness(
    move: { x: number; y: number },
    gameState: GameStateEntity,
    gridSize: number
  ): number {
    // Pénalise les coups trop évidents (comme répondre directement à une menace)
    // Cette méthode peut être raffinée selon votre jeu
    return 0; // À adapter selon vos besoins
  }

  /**
   * Clone l'état du jeu pour la simulation
   */
  private cloneGameState(state: GameStateEntity): GameStateEntity {
    // Implémentez le clonage de votre GameStateEntity
    // Ceci est un exemple basique, adaptez-le à votre implémentation
    const cloned = new GameStateEntity();
    cloned.grid = { ...state.grid };
    cloned.deadStones = new Set(state.deadStones);
    cloned.capturedAreas = { ...state.capturedAreas };
    cloned.scores = { ...state.scores };
    cloned.currentPlayer = state.currentPlayer;
    cloned.gameActive = state.gameActive;
    return cloned;
  }
}
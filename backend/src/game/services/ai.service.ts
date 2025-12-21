import { Injectable, Logger } from '@nestjs/common';
import { GameStateEntity } from '../entities/game-state.entity';
import { CoordinateUtil } from '../../common/utils/coordinate.util';
import { GAME_CONSTANTS } from 'src/common/constants/game.constant';
import { GameLogicService } from './game-logic.service';

interface Move {
  x: number;
  y: number;
}

interface ScoredMove {
  move: Move;
  score: number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly gameLogicService: GameLogicService) {}

  /**
   * Calcule le prochain coup de l'IA
   */
  calculateNextMove(
    gameState: GameStateEntity,
    gridSize: number = GAME_CONSTANTS.GRID_SIZE,
    difficulty: number = 1
  ): Move {
    const startTime = Date.now();
    const availableMoves = this.getAvailableMoves(gameState, gridSize);

    if (availableMoves.length === 0) {
      throw new Error('No moves available for AI');
    }

    let selectedMove: Move;

    switch (difficulty) {
      case 1:
        selectedMove = this.getRandomMove(availableMoves);
        break;
      case 2:
        selectedMove = this.getDefensiveMove(gameState, availableMoves, gridSize);
        break;
      case 3:
        selectedMove = this.getOffensiveMove(gameState, availableMoves, gridSize);
        break;
      case 4:
        selectedMove = this.getStrategicMove(gameState, availableMoves, gridSize);
        break;
      case 5:
        selectedMove = this.getExpertMove(gameState, availableMoves, gridSize);
        break;
      default:
        selectedMove = this.getRandomMove(availableMoves);
    }

    const elapsed = Date.now() - startTime;
    this.logger.debug(
      `AI (difficulty ${difficulty}) calculated move (${selectedMove.x},${selectedMove.y}) in ${elapsed}ms`
    );

    return selectedMove;
  }

  private getAvailableMoves(gameState: GameStateEntity, gridSize: number): Move[] {
    const moves: Move[] = [];
    
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const key = CoordinateUtil.toKey(x, y);
        if (!gameState.grid[key]) {
          moves.push({ x, y });
        }
      }
    }
    return moves;
  }

  /**
   * Niveau 1: Coup aléatoire
   */
  private getRandomMove(moves: Move[]): Move {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  /**
   * Niveau 2: Défensif - évite les positions vulnérables
   */
  private getDefensiveMove(
    gameState: GameStateEntity,
    moves: Move[],
    gridSize: number
  ): Move {
    const scoredMoves = moves.map(move => ({
      move,
      score: 
        this.evaluateIsolation(move, gameState, gridSize) * 2 +
        this.evaluateCenterPosition(move, gridSize) -
        this.countOpponentNeighbors(move, gameState, gridSize) * 2 -
        this.evaluateVulnerability(move, gameState, gridSize)
    }));

    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0].move;
  }

  /**
   * Niveau 3: Offensif - cherche les captures
   */
  private getOffensiveMove(
    gameState: GameStateEntity,
    moves: Move[],
    gridSize: number
  ): Move {
    const scoredMoves = moves.map(move => ({
      move,
      score:
        this.evaluateCapturePotential(move, gameState, gridSize) * 5 +
        this.evaluateCycleFormation(move, gameState, gridSize) * 3 +
        this.countOpponentNeighbors(move, gameState, gridSize) +
        this.evaluateCenterPosition(move, gridSize) * 0.5
    }));

    scoredMoves.sort((a, b) => b.score - a.score);
    
    // Si aucun coup offensif intéressant, revenir au défensif
    if (scoredMoves[0].score <= 2) {
      return this.getDefensiveMove(gameState, moves, gridSize);
    }

    return scoredMoves[0].move;
  }

  /**
   * Niveau 4: Stratégique - équilibre attaque/défense
   */
  private getStrategicMove(
    gameState: GameStateEntity,
    moves: Move[],
    gridSize: number
  ): Move {
    const scoredMoves = moves.map(move => {
      const offensiveScore = 
        this.evaluateCapturePotential(move, gameState, gridSize) * 4 +
        this.evaluateCycleFormation(move, gameState, gridSize) * 3 +
        this.countOpponentNeighbors(move, gameState, gridSize) * 0.5;

      const defensiveScore =
        this.evaluateIsolation(move, gameState, gridSize) * 2 -
        this.evaluateVulnerability(move, gameState, gridSize) * 2 +
        this.evaluateBlockingPotential(move, gameState, gridSize) * 3;

      const positionalScore =
        this.evaluateCenterPosition(move, gridSize) * 2 +
        this.evaluateBoardControl(move, gameState, gridSize) * 1.5 +
        this.evaluateEdgeAdvantage(move, gridSize);

      return {
        move,
        score: offensiveScore + defensiveScore + positionalScore
      };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    
    // Ajouter de la variabilité (70% meilleur, 20% 2ème, 10% 3ème)
    const rand = Math.random();
    if (rand < 0.7) return scoredMoves[0].move;
    if (rand < 0.9 && scoredMoves[1]) return scoredMoves[1].move;
    return scoredMoves[2]?.move || scoredMoves[0].move;
  }

  /**
   * Niveau 5: Expert - Minimax avec évaluation avancée
   */
  private getExpertMove(
    gameState: GameStateEntity,
    moves: Move[],
    gridSize: number
  ): Move {
    const depth = 5; // Augmenté à 3 pour plus de profondeur
    
    // Pré-filtrer les coups prometteurs pour optimiser
    const promisingMoves = this.getPromisingMoves(gameState, moves, gridSize, 15);
    
    let bestMove = promisingMoves[0];
    let bestScore = -Infinity;

    for (const move of promisingMoves) {
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
          const score = this.minimax(
            simulatedState,
            depth - 1,
            false,
            -Infinity,
            Infinity,
            gridSize,
            gameState.currentPlayer
          );

          if (score > bestScore) {
            bestScore = score;
            bestMove = move;
          }
        }
      } catch (error) {
        // Coup invalide, ignorer
        continue;
      }
    }

    return bestMove;
  }

  /**
   * Pré-filtre les coups les plus prometteurs
   */
  private getPromisingMoves(
    gameState: GameStateEntity,
    moves: Move[],
    gridSize: number,
    topN: number
  ): Move[] {
    const scoredMoves = moves.map(move => ({
      move,
      score:
        this.evaluateCapturePotential(move, gameState, gridSize) * 4 +
        this.evaluateCycleFormation(move, gameState, gridSize) * 3 +
        this.evaluateBlockingPotential(move, gameState, gridSize) * 3 +
        this.evaluateIsolation(move, gameState, gridSize) * 2 +
        this.evaluateCenterPosition(move, gridSize)
    }));

    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves.slice(0, topN).map(sm => sm.move);
  }

  /**
   * Minimax avec élagage alpha-beta
   */
  private minimax(
    state: GameStateEntity,
    depth: number,
    isMaximizing: boolean,
    alpha: number,
    beta: number,
    gridSize: number,
    aiPlayer: number
  ): number {
    if (depth === 0) {
      return this.evaluateBoardState(state, gridSize, aiPlayer);
    }

    const moves = this.getAvailableMoves(state, gridSize);
    const limitedMoves = moves.slice(0, 8); // Limiter les branches
    
    if (isMaximizing) {
      let maxEval = -Infinity;
      
      for (const move of limitedMoves) {
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
            const evalScore = this.minimax(
              simulatedState,
              depth - 1,
              false,
              alpha,
              beta,
              gridSize,
              aiPlayer
            );
            
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break; // Élagage
          }
        } catch (error) {
          continue;
        }
      }
      return maxEval;
      
    } else {
      let minEval = Infinity;
      
      for (const move of limitedMoves) {
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
            const evalScore = this.minimax(
              simulatedState,
              depth - 1,
              true,
              alpha,
              beta,
              gridSize,
              aiPlayer
            );
            
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break; // Élagage
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
  private evaluateBoardState(
    state: GameStateEntity,
    gridSize: number,
    aiPlayer: number
  ): number {
    let score = 0;
    const opponent = aiPlayer === GAME_CONSTANTS.PLAYER_ONE 
      ? GAME_CONSTANTS.PLAYER_TWO 
      : GAME_CONSTANTS.PLAYER_ONE;

    // 1. Score de base (captures)
    const scoreKey1 = aiPlayer === GAME_CONSTANTS.PLAYER_ONE ? 'player1' : 'player2';
    const scoreKey2 = opponent === GAME_CONSTANTS.PLAYER_ONE ? 'player1' : 'player2';
    score += (state.scores[scoreKey1] - state.scores[scoreKey2]) * 10;

    // 2. Territoires capturés
    if (state.capturedAreas) {
      for (const area of state.capturedAreas) {
        if (area.owner === aiPlayer) {
          score += area.points.length * 2;
        } else if (area.owner === opponent) {
          score -= area.points.length * 2;
        }
      }
    }

    // 3. Contrôle du centre
    const center = Math.floor(gridSize / 2);
    for (let x = center - 2; x <= center + 2; x++) {
      for (let y = center - 2; y <= center + 2; y++) {
        if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
          const key = CoordinateUtil.toKey(x, y);
          if (state.grid[key] === aiPlayer) score += 1.5;
          else if (state.grid[key] === opponent) score -= 1.5;
        }
      }
    }

    // 4. Pierres vivantes vs mortes
    let aiStones = 0, opponentStones = 0;
    for (const key in state.grid) {
      if (!state.deadStones.has(key)) {
        if (state.grid[key] === aiPlayer) aiStones++;
        else if (state.grid[key] === opponent) opponentStones++;
      }
    }
    score += (aiStones - opponentStones) * 0.5;

    return score;
  }

  // ==================== FONCTIONS D'ÉVALUATION ====================

  private evaluateCapturePotential(
    move: Move,
    gameState: GameStateEntity,
    gridSize: number
  ): number {
    let potential = 0;
    const opponent = gameState.currentPlayer === GAME_CONSTANTS.PLAYER_ONE 
      ? GAME_CONSTANTS.PLAYER_TWO 
      : GAME_CONSTANTS.PLAYER_ONE;
    
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    
    for (const [dx, dy] of directions) {
      const nx = move.x + dx;
      const ny = move.y + dy;
      
      if (this.isValidCoord(nx, ny, gridSize)) {
        const key = CoordinateUtil.toKey(nx, ny);
        if (gameState.grid[key] === opponent && !gameState.deadStones.has(key)) {
          potential += 2;
        }
      }
    }
    
    return potential;
  }

  /**
   * NOUVEAU: Évalue le potentiel de formation de cycle
   */
  private evaluateCycleFormation(
    move: Move,
    gameState: GameStateEntity,
    gridSize: number
  ): number {
    let score = 0;
    const player = gameState.currentPlayer;
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    
    let friendlyNeighbors = 0;
    
    // Compter les voisins alliés
    for (const [dx, dy] of directions) {
      const nx = move.x + dx;
      const ny = move.y + dy;
      
      if (this.isValidCoord(nx, ny, gridSize)) {
        const key = CoordinateUtil.toKey(nx, ny);
        if (gameState.grid[key] === player && !gameState.deadStones.has(key)) {
          friendlyNeighbors++;
        }
      }
    }
    
    // Plus il y a de voisins alliés, plus le potentiel de cycle est élevé
    if (friendlyNeighbors >= 2) {
      score += friendlyNeighbors * 2;
    }
    
    return score;
  }

  /**
   * NOUVEAU: Évalue le potentiel de blocage d'un cycle adverse
   */
  private evaluateBlockingPotential(
    move: Move,
    gameState: GameStateEntity,
    gridSize: number
  ): number {
    const opponent = gameState.currentPlayer === GAME_CONSTANTS.PLAYER_ONE 
      ? GAME_CONSTANTS.PLAYER_TWO 
      : GAME_CONSTANTS.PLAYER_ONE;
    
    let blockingScore = 0;
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    
    // Vérifier si on bloque un cycle potentiel ennemi
    let opponentNeighbors = 0;
    for (const [dx, dy] of directions) {
      const nx = move.x + dx;
      const ny = move.y + dy;
      
      if (this.isValidCoord(nx, ny, gridSize)) {
        const key = CoordinateUtil.toKey(nx, ny);
        if (gameState.grid[key] === opponent && !gameState.deadStones.has(key)) {
          opponentNeighbors++;
        }
      }
    }
    
    // Si entouré par l'adversaire, c'est un bon blocage
    if (opponentNeighbors >= 3) {
      blockingScore += 5;
    }
    
    return blockingScore;
  }

  private evaluateIsolation(
    move: Move,
    gameState: GameStateEntity,
    gridSize: number
  ): number {
    let friendlyNeighbors = 0;
    const directions = [
      [0, 1], [1, 0], [0, -1], [-1, 0],
      [1, 1], [-1, -1], [1, -1], [-1, 1]
    ];
    
    for (const [dx, dy] of directions) {
      const nx = move.x + dx;
      const ny = move.y + dy;
      
      if (this.isValidCoord(nx, ny, gridSize)) {
        const key = CoordinateUtil.toKey(nx, ny);
        if (gameState.grid[key] === gameState.currentPlayer) {
          friendlyNeighbors++;
        }
      }
    }
    
    return friendlyNeighbors;
  }

  private countOpponentNeighbors(
    move: Move,
    gameState: GameStateEntity,
    gridSize: number
  ): number {
    let count = 0;
    const opponent = gameState.currentPlayer === GAME_CONSTANTS.PLAYER_ONE 
      ? GAME_CONSTANTS.PLAYER_TWO 
      : GAME_CONSTANTS.PLAYER_ONE;
    
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    
    for (const [dx, dy] of directions) {
      const nx = move.x + dx;
      const ny = move.y + dy;
      
      if (this.isValidCoord(nx, ny, gridSize)) {
        const key = CoordinateUtil.toKey(nx, ny);
        if (gameState.grid[key] === opponent) {
          count++;
        }
      }
    }
    
    return count;
  }

  private evaluateCenterPosition(move: Move, gridSize: number): number {
    const center = gridSize / 2 - 0.5;
    const distance = Math.sqrt(
      Math.pow(move.x - center, 2) + Math.pow(move.y - center, 2)
    );
    return Math.max(0, (gridSize - distance) / gridSize * 2);
  }

  private evaluateVulnerability(
    move: Move,
    gameState: GameStateEntity,
    gridSize: number
  ): number {
    let vulnerability = 0;
    
    // Positions sur les bords sont moins vulnérables
    if (this.isEdgePosition(move, gridSize)) {
      vulnerability -= 1;
    }
    
    // Entouré par l'adversaire = vulnérable
    vulnerability += this.countOpponentNeighbors(move, gameState, gridSize) * 0.5;
    
    return Math.max(0, vulnerability);
  }

  private evaluateBoardControl(
    move: Move,
    gameState: GameStateEntity,
    gridSize: number
  ): number {
    let control = 0;
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    
    for (const [dx, dy] of directions) {
      const nx = move.x + dx;
      const ny = move.y + dy;
      
      if (this.isValidCoord(nx, ny, gridSize)) {
        const key = CoordinateUtil.toKey(nx, ny);
        if (!gameState.grid[key] && !gameState.deadStones.has(key)) {
          control++;
        }
      }
    }
    
    return control;
  }

  /**
   * NOUVEAU: Évalue l'avantage des positions de bord
   */
  private evaluateEdgeAdvantage(move: Move, gridSize: number): number {
    if (this.isEdgePosition(move, gridSize)) {
      return 1; // Léger bonus pour les bords
    }
    return 0;
  }

  // ==================== UTILITAIRES ====================

  private isValidCoord(x: number, y: number, gridSize: number): boolean {
    return x >= 0 && x < gridSize && y >= 0 && y < gridSize;
  }

  private isEdgePosition(move: Move, gridSize: number): boolean {
    return move.x === 0 || move.x === gridSize - 1 || 
           move.y === 0 || move.y === gridSize - 1;
  }

  /**
   * Clone profond de l'état du jeu
   */
  private cloneGameState(state: GameStateEntity): GameStateEntity {
    const cloned = new GameStateEntity();
    
    // Clone grid
    cloned.grid = { ...state.grid };
    
    // Clone deadStones
    cloned.deadStones = new Set(state.deadStones);
    
    // Clone capturedAreas
    if (state.capturedAreas) {
      cloned.capturedAreas = state.capturedAreas.map(area => ({
        points: [...area.points],
        owner: area.owner,
        stones: [...area.stones]
      }));
    }
    
    // Clone scores
    cloned.scores = { ...state.scores };
    
    // Copy primitives
    cloned.currentPlayer = state.currentPlayer;
    cloned.gameActive = state.gameActive;
    
    return cloned;
  }
}
import { Injectable, Logger } from '@nestjs/common';
import { GameStateEntity } from '../entities/game-state.entity';
import { CoordinateUtil } from '../../common/utils/coordinate.util';
import { GAME_CONSTANTS } from 'src/common/constants/game.constant';
import { GameLogicService } from './game-logic.service';

interface Move {
  x: number;
  y: number;
}

interface Pattern {
  positions: Move[];
  priority: number;
  type: 'capture' | 'defend' | 'extend' | 'block';
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  // Patterns tactiques pré-calculés pour reconnaissance rapide
  private readonly TACTICAL_PATTERNS = this.initializeTacticalPatterns();
  
  constructor(private readonly gameLogicService: GameLogicService) {}

  /**
   * STRATÉGIE PRINCIPALE : Pattern matching + heuristiques rapides
   * Pas de minimax lourd - focus sur reconnaissance de patterns
   */
  calculateNextMove(
    gameState: GameStateEntity,
    gridSize: number = GAME_CONSTANTS.GRID_SIZE,
    difficulty: number = 1
  ): Move {
    const startTime = Date.now();

    if (difficulty <= 2) {
      // Niveaux faciles : heuristiques simples
      return this.getSimpleMove(gameState, gridSize, difficulty);
    }

    // PHASE 1: Détection de menaces immédiates (ultra rapide)
    const criticalMove = this.findCriticalMove(gameState, gridSize);
    if (criticalMove) {
      this.logger.debug(`Critical move found in ${Date.now() - startTime}ms`);
      return criticalMove;
    }

    // PHASE 2: Pattern matching tactique
    const tacticalMove = this.findTacticalPattern(gameState, gridSize);
    if (tacticalMove) {
      this.logger.debug(`Tactical pattern found in ${Date.now() - startTime}ms`);
      return tacticalMove;
    }

    // PHASE 3: Évaluation positionnelle rapide
    const strategicMove = this.findStrategicMove(gameState, gridSize, difficulty);
    
    this.logger.debug(`Move calculated in ${Date.now() - startTime}ms`);
    return strategicMove;
  }

  /**
   * PHASE 1: Coups critiques (captures immédiates ou blocages urgents)
   */
  private findCriticalMove(
    gameState: GameStateEntity,
    gridSize: number
  ): Move | null {
    const opponent = this.getOpponent(gameState.currentPlayer);
    
    // 1. Chercher les captures IMMÉDIATES
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        if (gameState.grid[CoordinateUtil.toKey(x, y)]) continue;
        
        // Simuler le coup rapidement
        const capturedCount = this.countImmediateCaptures(
          { x, y },
          gameState,
          gridSize,
          gameState.currentPlayer
        );
        
        if (capturedCount >= 2) {
          return { x, y }; // Capture multiple = jouer immédiatement
        }
      }
    }

    // 2. Bloquer les menaces de capture adverses
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        if (gameState.grid[CoordinateUtil.toKey(x, y)]) continue;
        
        const opponentCaptures = this.countImmediateCaptures(
          { x, y },
          gameState,
          gridSize,
          opponent
        );
        
        if (opponentCaptures >= 3) {
          return { x, y }; // Bloquer menace critique
        }
      }
    }

    return null;
  }

  /**
   * Compte les captures immédiates d'un coup (sans simulation lourde)
   */
  private countImmediateCaptures(
    move: Move,
    gameState: GameStateEntity,
    gridSize: number,
    player: number
  ): number {
    const opponent = this.getOpponent(player);
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    let captures = 0;

    for (const [dx, dy] of directions) {
      const nx = move.x + dx;
      const ny = move.y + dy;
      
      if (!this.isValid(nx, ny, gridSize)) continue;
      
      const key = CoordinateUtil.toKey(nx, ny);
      if (gameState.grid[key] === opponent && !gameState.deadStones.has(key)) {
        // Vérifier si cette pierre serait entourée
        if (this.wouldBeTrapped(nx, ny, move, gameState, gridSize, player)) {
          captures++;
        }
      }
    }

    return captures;
  }

  /**
   * Vérifie si une pierre serait piégée après un coup
   */
  private wouldBeTrapped(
    stoneX: number,
    stoneY: number,
    newMove: Move,
    gameState: GameStateEntity,
    gridSize: number,
    attacker: number
  ): boolean {
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    let surroundedSides = 0;

    for (const [dx, dy] of directions) {
      const nx = stoneX + dx;
      const ny = stoneY + dy;
      
      if (!this.isValid(nx, ny, gridSize)) {
        surroundedSides++;
        continue;
      }

      const key = CoordinateUtil.toKey(nx, ny);
      
      // Si c'est le nouveau coup ou déjà occupé par l'attaquant
      if ((nx === newMove.x && ny === newMove.y) || gameState.grid[key] === attacker) {
        surroundedSides++;
      }
    }

    return surroundedSides >= 3; // Piégé si 3+ côtés entourés
  }

  /**
   * PHASE 2: Reconnaissance de patterns tactiques
   */
  private findTacticalPattern(
    gameState: GameStateEntity,
    gridSize: number
  ): Move | null {
    const moves = this.getAllEmptyPositions(gameState, gridSize);
    let bestMove: Move | null = null;
    let bestScore = -Infinity;

    for (const move of moves) {
      // Évaluer les patterns autour de ce coup
      const patternScore = this.evaluatePatterns(move, gameState, gridSize);
      
      if (patternScore > bestScore) {
        bestScore = patternScore;
        bestMove = move;
      }
    }

    // Seuil pour considérer un pattern comme intéressant
    return bestScore > 15 ? bestMove : null;
  }

  /**
   * Évalue les patterns tactiques autour d'une position
   */
  private evaluatePatterns(
    move: Move,
    gameState: GameStateEntity,
    gridSize: number
  ): number {
    let score = 0;
    const player = gameState.currentPlayer;
    const opponent = this.getOpponent(player);

    // Pattern 1: Extension de chaîne (créer des connexions)
    const friendlyNeighbors = this.countNeighbors(move, gameState, gridSize, player);
    if (friendlyNeighbors >= 2) {
      score += 10 + friendlyNeighbors * 3; // Connecter nos pierres
    }

    // Pattern 2: Coupe (séparer les chaînes adverses)
    const opponentGroups = this.countAdjacentGroups(move, gameState, gridSize, opponent);
    if (opponentGroups >= 2) {
      score += 15; // Couper entre deux groupes ennemis
    }

    // Pattern 3: Atari (menace de capture)
    const threatenedStones = this.countThreatenedStones(move, gameState, gridSize);
    score += threatenedStones * 8;

    // Pattern 4: Formation de territoire
    const territoryPotential = this.evaluateTerritoryFormation(move, gameState, gridSize);
    score += territoryPotential * 5;

    // Pattern 5: Sécurité de la position
    const liberty = this.countLiberties(move, gameState, gridSize);
    if (liberty <= 1) {
      score -= 20; // Position dangereuse
    }

    return score;
  }

  /**
   * Compte les groupes adjacents distincts
   */
  private countAdjacentGroups(
    move: Move,
    gameState: GameStateEntity,
    gridSize: number,
    player: number
  ): number {
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    const visited = new Set<string>();
    let groupCount = 0;

    for (const [dx, dy] of directions) {
      const nx = move.x + dx;
      const ny = move.y + dy;
      const key = CoordinateUtil.toKey(nx, ny);

      if (!this.isValid(nx, ny, gridSize) || visited.has(key)) continue;
      
      if (gameState.grid[key] === player && !gameState.deadStones.has(key)) {
        // Marquer tout le groupe comme visité
        this.markGroup(nx, ny, gameState, gridSize, player, visited);
        groupCount++;
      }
    }

    return groupCount;
  }

  /**
   * Marque récursivement un groupe de pierres connectées
   */
  private markGroup(
    x: number,
    y: number,
    gameState: GameStateEntity,
    gridSize: number,
    player: number,
    visited: Set<string>
  ): void {
    const key = CoordinateUtil.toKey(x, y);
    if (visited.has(key)) return;
    
    visited.add(key);
    
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      const nkey = CoordinateUtil.toKey(nx, ny);
      
      if (this.isValid(nx, ny, gridSize) && 
          gameState.grid[nkey] === player && 
          !gameState.deadStones.has(nkey)) {
        this.markGroup(nx, ny, gameState, gridSize, player, visited);
      }
    }
  }

  /**
   * Compte les pierres adverses menacées de capture
   */
  private countThreatenedStones(
    move: Move,
    gameState: GameStateEntity,
    gridSize: number
  ): number {
    const opponent = this.getOpponent(gameState.currentPlayer);
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    let threatened = 0;

    for (const [dx, dy] of directions) {
      const nx = move.x + dx;
      const ny = move.y + dy;
      
      if (!this.isValid(nx, ny, gridSize)) continue;
      
      const key = CoordinateUtil.toKey(nx, ny);
      if (gameState.grid[key] === opponent && !gameState.deadStones.has(key)) {
        // Vérifier les libertés restantes
        const liberties = this.countStoneLiberties(nx, ny, gameState, gridSize);
        if (liberties <= 2) {
          threatened++;
        }
      }
    }

    return threatened;
  }

  /**
   * Compte les libertés d'une pierre spécifique
   */
  private countStoneLiberties(
    x: number,
    y: number,
    gameState: GameStateEntity,
    gridSize: number
  ): number {
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    let liberties = 0;

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (!this.isValid(nx, ny, gridSize)) continue;
      
      const key = CoordinateUtil.toKey(nx, ny);
      if (!gameState.grid[key]) {
        liberties++;
      }
    }

    return liberties;
  }

  /**
   * Évalue le potentiel de formation de territoire
   */
  private evaluateTerritoryFormation(
    move: Move,
    gameState: GameStateEntity,
    gridSize: number
  ): number {
    const player = gameState.currentPlayer;
    let territoryScore = 0;

    // Vérifier dans un rayon de 2 cases
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        if (dx === 0 && dy === 0) continue;
        
        const nx = move.x + dx;
        const ny = move.y + dy;
        
        if (!this.isValid(nx, ny, gridSize)) continue;
        
        const key = CoordinateUtil.toKey(nx, ny);
        if (gameState.grid[key] === player && !gameState.deadStones.has(key)) {
          const distance = Math.abs(dx) + Math.abs(dy);
          territoryScore += (3 - distance); // Plus proche = meilleur
        }
      }
    }

    return territoryScore;
  }

  /**
   * Compte les libertés (cases vides adjacentes)
   */
  private countLiberties(
    move: Move,
    gameState: GameStateEntity,
    gridSize: number
  ): number {
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    let liberties = 0;

    for (const [dx, dy] of directions) {
      const nx = move.x + dx;
      const ny = move.y + dy;
      
      if (!this.isValid(nx, ny, gridSize)) continue;
      
      const key = CoordinateUtil.toKey(nx, ny);
      if (!gameState.grid[key]) {
        liberties++;
      }
    }

    return liberties;
  }

  /**
   * PHASE 3: Coup stratégique basé sur l'évaluation positionnelle
   */
  private findStrategicMove(
    gameState: GameStateEntity,
    gridSize: number,
    difficulty: number
  ): Move {
    const moves = this.getAllEmptyPositions(gameState, gridSize);
    
    let bestMove = moves[0];
    let bestScore = -Infinity;

    for (const move of moves) {
      let score = 0;

      // Facteur 1: Position centrale (début de partie)
      const center = gridSize / 2 - 0.5;
      const distToCenter = Math.abs(move.x - center) + Math.abs(move.y - center);
      score += (gridSize - distToCenter) * 2;

      // Facteur 2: Connexions
      const friendlyNeighbors = this.countNeighbors(move, gameState, gridSize, gameState.currentPlayer);
      score += friendlyNeighbors * 5;

      // Facteur 3: Influence territoriale
      const influence = this.calculateInfluence(move, gameState, gridSize);
      score += influence * 3;

      // Facteur 4: Sécurité
      const liberties = this.countLiberties(move, gameState, gridSize);
      score += liberties * 2;

      // Facteur 5: Contrôle des points clés
      if (this.isKeyPoint(move, gridSize)) {
        score += 8;
      }

      // Ajouter variabilité pour niveaux < 5
      if (difficulty < 5) {
        score += Math.random() * (6 - difficulty) * 2;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  /**
   * Calcule l'influence d'une position sur le plateau
   */
  private calculateInfluence(
    move: Move,
    gameState: GameStateEntity,
    gridSize: number
  ): number {
    const player = gameState.currentPlayer;
    const opponent = this.getOpponent(player);
    let influence = 0;

    // Évaluer l'influence dans un rayon
    for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        const nx = move.x + dx;
        const ny = move.y + dy;
        
        if (!this.isValid(nx, ny, gridSize)) continue;
        
        const distance = Math.abs(dx) + Math.abs(dy);
        if (distance === 0 || distance > 3) continue;
        
        const key = CoordinateUtil.toKey(nx, ny);
        const weight = 4 - distance;
        
        if (gameState.grid[key] === player) {
          influence += weight;
        } else if (gameState.grid[key] === opponent) {
          influence -= weight * 0.5;
        }
      }
    }

    return influence;
  }

  /**
   * Identifie les points stratégiques clés
   */
  private isKeyPoint(move: Move, gridSize: number): boolean {
    const third = Math.floor(gridSize / 3);
    const twoThirds = Math.floor(gridSize * 2 / 3);
    
    // Points stratégiques: intersections des lignes de tiers
    const keyPoints = [
      [third, third],
      [third, twoThirds],
      [twoThirds, third],
      [twoThirds, twoThirds]
    ];

    return keyPoints.some(([x, y]) => 
      Math.abs(move.x - x) <= 1 && Math.abs(move.y - y) <= 1
    );
  }

  /**
   * Coups simples pour niveaux faciles
   */
  private getSimpleMove(
    gameState: GameStateEntity,
    gridSize: number,
    difficulty: number
  ): Move {
    const moves = this.getAllEmptyPositions(gameState, gridSize);
    
    if (difficulty === 1) {
      // Niveau 1: Aléatoire
      return moves[Math.floor(Math.random() * moves.length)];
    }

    // Niveau 2: Préférence pour positions connectées
    const scoredMoves = moves.map(move => ({
      move,
      score: this.countNeighbors(move, gameState, gridSize, gameState.currentPlayer) * 3 +
             Math.random() * 5
    }));

    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0].move;
  }

  // ==================== UTILITAIRES ====================

  private getAllEmptyPositions(gameState: GameStateEntity, gridSize: number): Move[] {
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

  private countNeighbors(
    move: Move,
    gameState: GameStateEntity,
    gridSize: number,
    player: number
  ): number {
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    let count = 0;

    for (const [dx, dy] of directions) {
      const nx = move.x + dx;
      const ny = move.y + dy;
      
      if (!this.isValid(nx, ny, gridSize)) continue;
      
      const key = CoordinateUtil.toKey(nx, ny);
      if (gameState.grid[key] === player && !gameState.deadStones.has(key)) {
        count++;
      }
    }

    return count;
  }

  private getOpponent(player: number): number {
    return player === GAME_CONSTANTS.PLAYER_ONE 
      ? GAME_CONSTANTS.PLAYER_TWO 
      : GAME_CONSTANTS.PLAYER_ONE;
  }

  private isValid(x: number, y: number, gridSize: number): boolean {
    return x >= 0 && x < gridSize && y >= 0 && y < gridSize;
  }

  private initializeTacticalPatterns(): Pattern[] {
    // Patterns pré-calculés pour reconnaissance rapide
    // À étendre selon les patterns spécifiques de Dual Dot
    return [];
  }
}
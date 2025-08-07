const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    transports: ["websocket", "polling"],
  },
});

app.use(express.static(path.join(__dirname, "public")));

class GameRoom {
  constructor() {
    this.players = new Map();
    this.gridSize = 19;
    this.resetGame();
  }

  resetGame() {
    this.gameState = {
      grid: {}, // Changé en objet pour stocker { "x,y": player }
      currentPlayer: 1,
      scores: { player1: 0, player2: 0 },
      gameActive: false,
      gameId: this.generateGameId(),
      deadStones: new Set(),
      capturedAreas: [],
    };
  }

  generateGameId() {
    return Math.random().toString(36).substr(2, 9);
  }

  // Méthode pour convertir les coordonnées en clé
  coordToKey(x, y) {
    return `${x},${y}`;
  }

  // Méthode pour vérifier si une coordonnée est valide
  isValidCoord(x, y) {
    return x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize;
  }

  // Méthode pour obtenir les coordonnées adjacentes
  getAdjacentCoords(x, y) {
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    const adjacents = [];

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isValidCoord(nx, ny)) {
        adjacents.push({ x: nx, y: ny });
      }
    }

    return adjacents;
  }

  // Méthode pour obtenir l'état d'une cellule
  getCellState(x, y) {
    const key = this.coordToKey(x, y);
    if (this.gameState.deadStones.has(key)) {
      return 0;
    }
    return this.gameState.grid[key] || 0;
  }

  addPlayer(socketId, playerNumber) {
    this.players.set(socketId, playerNumber);
    if (this.players.size === 2) {
      this.gameState.gameActive = true;
    }
    return playerNumber;
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
    if (this.players.size < 2) {
      this.gameState.gameActive = false;
    }
  }

  getPlayerNumber(socketId) {
    return this.players.get(socketId);
  }

  findCycles(startX, startY, player) {
    const cycles = [];
    const visited = new Set();
    const path = [];
    const directions = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];

    const isInPath = (x, y) => path.some((p) => p.x === x && p.y === y);
    const isValid = (x, y) =>
      this.isValidCoord(x, y) &&
      this.getCellState(x, y) === player &&
      !this.gameState.deadStones.has(this.coordToKey(x, y));

    const dfs = (x, y, startX, startY, depth) => {
      const key = this.coordToKey(x, y);
      visited.add(key);
      path.push({ x, y });

      for (const [dx, dy] of directions) {
        const nx = x + dx,
          ny = y + dy;
        const nKey = this.coordToKey(nx, ny);

        if (nx === startX && ny === startY && depth >= 4) {
          cycles.push([...path]);
          continue;
        }

        if (isValid(nx, ny) && !visited.has(nKey) && !isInPath(nx, ny)) {
          dfs(nx, ny, startX, startY, depth + 1);
        }
      }

      path.pop();
      visited.delete(key);
    };

    if (this.getCellState(startX, startY) === player) {
      dfs(startX, startY, startX, startY, 1);
    }

    return cycles;
  }

  makeMove(x, y, player) {
    if (!this.gameState.gameActive)
      return { success: false, reason: "Game not active" };
    if (this.gameState.currentPlayer !== player)
      return { success: false, reason: "Not your turn" };

    const key = this.coordToKey(x, y);
    if (this.gameState.grid[key] !== undefined)
      return { success: false, reason: "Position occupied" };

    // Placer temporairement la pierre
    this.gameState.grid[key] = player;

    // Vérifier les captures classiques
    const capturedStones = this.checkCaptures(x, y, player);

    // Marquer les pierres capturées comme mortes
    capturedStones.forEach((stoneKey) => {
      this.gameState.deadStones.add(stoneKey);
    });

    // Vérifier si le coup est suicidaire
    if (this.isSuicideMove(x, y, player)) {
      // Annuler le coup
      delete this.gameState.grid[key];
      capturedStones.forEach((stoneKey) => {
        this.gameState.deadStones.delete(stoneKey);
      });
      return { success: false, reason: "Suicide move not allowed" };
    }

    const extraCapturedStones = [];
    const cycles = this.findCycles(x, y, player);
    console.log(cycles);
    if (cycles.length > 0) {
      const longestCycle = cycles.reduce(
        (max, c) => (c.length > max.length ? c : max),
        cycles[0]
      );
      const captured = this.captureInsideCycle(longestCycle, player); // tu vas devoir implémeter cette méthode qui récupère les pierres adverse emprisonné dans le longestC
      console.log("comptage de pière adverse capturé : ", captured);

      captured.forEach((stone) => {
        this.gameState.deadStones.add(stone);
        extraCapturedStones.push(stone);
      });
    }

    // Détecter les zones entièrement encerclées

    // Mettre à jour le score
    const totalCaptured = extraCapturedStones.length;
    console.log("score: ", totalCaptured);
    if (totalCaptured > 0) {
      this.gameState.scores[`player${player}`] += totalCaptured;
    }

    // Mettre à jour les zones capturées
    this.updateCapturedAreas();

    // Changer de joueur
    this.gameState.currentPlayer = player === 1 ? 2 : 1;

    return {
      success: true,
      gameState: this.getSerializableGameState(),
      move: { x, y, player },
      capturedStones: [...capturedStones, ...extraCapturedStones],
      capturedAreas: this.gameState.capturedAreas,
    };
  }

  captureInsideCycle(cycle, player) {
  const opponent = player === 1 ? 2 : 1;
  const captured = new Set();
  const polygon = cycle.map(({ x, y }) => [x + 0.5, y + 0.5]); // centrer sur la case
  const size = this.gridSize;

  const isInside = (x, y) => {
    const px = x + 0.5, py = y + 0.5;
    let crossings = 0;
    for (let i = 0; i < polygon.length; i++) {
      const [x1, y1] = polygon[i];
      const [x2, y2] = polygon[(i + 1) % polygon.length];
      if ((y1 <= py && py < y2 || y2 <= py && py < y1) &&
          (px - x1) * (y2 - y1) < (x2 - x1) * (py - y1)) {
        crossings++;
      }
    }
    return crossings % 2 === 1;
  };

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      if (
        this.getCellState(x, y) === opponent &&
        isInside(x, y)
      ) {
        captured.add(this.coordToKey(x, y));
      }
    }
  }

  return Array.from(captured);
}

  checkCaptures(x, y, player) {
    const opponent = player === 1 ? 2 : 1;
    const capturedStones = new Set();
    const adjacents = this.getAdjacentCoords(x, y);

    for (const adj of adjacents) {
      const adjKey = this.coordToKey(adj.x, adj.y);
      if (this.getCellState(adj.x, adj.y) === opponent) {
        const group = this.findConnectedGroup(adj.x, adj.y, opponent);
        if (this.hasNoLiberties(group)) {
          group.forEach((stone) => {
            capturedStones.add(this.coordToKey(stone.x, stone.y));
          });
        }
      }
    }

    return [...capturedStones];
  }

  isSuicideMove(x, y, player) {
    const group = this.findConnectedGroup(x, y, player);
    return this.hasNoLiberties(group);
  }

  findConnectedGroup(startX, startY, player) {
    const visited = new Set();
    const stack = [{ x: startX, y: startY }];
    const group = [];

    while (stack.length > 0) {
      const current = stack.pop();
      const currentKey = this.coordToKey(current.x, current.y);

      if (visited.has(currentKey)) continue;
      visited.add(currentKey);

      if (this.getCellState(current.x, current.y) !== player) continue;

      group.push({ x: current.x, y: current.y });

      const adjacents = this.getAdjacentCoords(current.x, current.y);
      for (const adj of adjacents) {
        const adjKey = this.coordToKey(adj.x, adj.y);
        if (!visited.has(adjKey)) {
          stack.push(adj);
        }
      }
    }

    return group;
  }

  hasNoLiberties(group) {
    for (const stone of group) {
      const adjacents = this.getAdjacentCoords(stone.x, stone.y);
      for (const adj of adjacents) {
        if (this.getCellState(adj.x, adj.y) === 0) {
          return false;
        }
      }
    }
    return true;
  }

  getSerializableGameState() {
    return {
      grid: { ...this.gameState.grid },
      currentPlayer: this.gameState.currentPlayer,
      scores: { ...this.gameState.scores },
      gameActive: this.gameState.gameActive,
      gameId: this.gameState.gameId,
      deadStones: Array.from(this.gameState.deadStones),
      capturedAreas: [...this.gameState.capturedAreas],
    };
  }

  calculateFinalScore() {
    const territories = this.findTerritories();
    let player1Territory = 0;
    let player2Territory = 0;

    territories.forEach((territory) => {
      if (territory.owner === 1) {
        player1Territory += territory.points.length;
      } else if (territory.owner === 2) {
        player2Territory += territory.points.length;
      }
    });

    return {
      player1: this.gameState.scores.player1 + player1Territory,
      player2: this.gameState.scores.player2 + player2Territory,
      territories,
    };
  }

  findTerritories() {
    const visited = new Set();
    const territories = [];

    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        const key = this.coordToKey(x, y);
        if (this.getCellState(x, y) === 0 && !visited.has(key)) {
          const territory = this.exploreTerritory(x, y, visited);
          if (territory.owner !== null) {
            territories.push(territory);
          }
        }
      }
    }

    return territories;
  }

  exploreTerritory(startX, startY, visited) {
    const queue = [{ x: startX, y: startY }];
    const points = [];
    const boundaryPlayers = new Set();
    const boundaryStones = new Set();

    while (queue.length > 0) {
      const current = queue.shift();
      const currentKey = this.coordToKey(current.x, current.y);

      if (visited.has(currentKey)) continue;
      visited.add(currentKey);

      if (this.getCellState(current.x, current.y) !== 0) continue;

      points.push({ x: current.x, y: current.y });

      const adjacents = this.getAdjacentCoords(current.x, current.y);
      for (const adj of adjacents) {
        const adjKey = this.coordToKey(adj.x, adj.y);
        const adjValue = this.getCellState(adj.x, adj.y);

        if (adjValue === 0 && !visited.has(adjKey)) {
          queue.push(adj);
        } else if (adjValue !== 0) {
          boundaryPlayers.add(adjValue);
          boundaryStones.add(adjKey);
        }
      }
    }

    let owner = null;
    if (boundaryPlayers.size === 1) {
      owner = boundaryPlayers.values().next().value;
    }

    return {
      points,
      owner,
      stones: Array.from(boundaryStones).map((key) => {
        const [x, y] = key.split(",").map(Number);
        return { x, y };
      }),
    };
  }

  updateCapturedAreas() {
    const territories = this.findTerritories();
    this.gameState.capturedAreas = territories.filter((t) => t.owner !== null);
  }
}

const gameRooms = new Map();

io.on("connection", (socket) => {
  console.log(`New player connected: ${socket.id}`);

  socket.on("joinGame", () => {
    let gameRoom;
    let playerNumber;

    for (const [roomId, room] of gameRooms) {
      if (room.players.size === 1) {
        gameRoom = room;
        playerNumber = 2;
        break;
      }
    }

    if (!gameRoom) {
      gameRoom = new GameRoom();
      playerNumber = 1;
      gameRooms.set(gameRoom.gameState.gameId, gameRoom);
    }

    gameRoom.addPlayer(socket.id, playerNumber);
    socket.join(gameRoom.gameState.gameId);
    socket.gameRoomId = gameRoom.gameState.gameId;
    socket.playerNumber = playerNumber;

    socket.emit("gameJoined", {
      playerId: playerNumber,
      gameState: gameRoom.getSerializableGameState(),
      playerCount: gameRoom.players.size,
    });

    if (gameRoom.players.size === 2) {
      io.to(gameRoom.gameState.gameId).emit("gameStart", {
        gameState: gameRoom.getSerializableGameState(),
      });
    }
  });

  socket.on("makeMove", (data) => {
    const gameRoom = gameRooms.get(socket.gameRoomId);
    if (!gameRoom) return;

    const playerNumber = gameRoom.getPlayerNumber(socket.id);
    const result = gameRoom.makeMove(data.x, data.y, playerNumber);

    if (result.success) {
      io.to(socket.gameRoomId).emit("moveMade", {
        gameState: result.gameState,
        move: result.move,
        capturedStones: result.capturedStones,
        capturedAreas: result.capturedAreas,
      });
    } else {
      socket.emit("moveError", { reason: result.reason });
    }
  });

  socket.on("calculateScore", () => {
    const gameRoom = gameRooms.get(socket.gameRoomId);
    if (!gameRoom) return;

    const finalScore = gameRoom.calculateFinalScore();
    io.to(socket.gameRoomId).emit("finalScore", finalScore);
  });

  socket.on("resetGame", () => {
    const gameRoom = gameRooms.get(socket.gameRoomId);
    if (!gameRoom) return;

    gameRoom.resetGame();
    io.to(socket.gameRoomId).emit("gameReset", {
      gameState: gameRoom.getSerializableGameState(),
    });
  });

  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    if (socket.gameRoomId) {
      const gameRoom = gameRooms.get(socket.gameRoomId);
      if (gameRoom) {
        gameRoom.removePlayer(socket.id);
        socket.to(socket.gameRoomId).emit("playerDisconnected");
        if (gameRoom.players.size === 0) {
          gameRooms.delete(socket.gameRoomId);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 5555;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

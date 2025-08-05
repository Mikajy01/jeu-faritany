const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        transports: ["websocket", "polling"]
    }
});

app.use(express.static(path.join(__dirname, 'public')));

class GameRoom {
    constructor() {
        this.players = new Map();
        this.gridSize = 19;
        this.resetGame();
    }

    resetGame() {
        this.gameState = {
            grid: Array(this.gridSize * this.gridSize).fill(0),
            currentPlayer: 1,
            scores: { player1: 0, player2: 0 },
            gameActive: false,
            gameId: this.generateGameId(),
            deadStones: new Set(),
            capturedAreas: []  // Nouvelle propriété pour les zones capturées
        };
    }

    generateGameId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // Nouvelle méthode pour obtenir l'état effectif d'une case
    getEffectiveCellState(index) {
        if (this.gameState.deadStones.has(index)) {
            return 0;  // Case considérée comme vide si pierre morte
        }
        return this.gameState.grid[index];
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

    makeMove(index, player) {
    if (!this.gameState.gameActive) return { success: false, reason: 'Game not active' };
    if (this.gameState.currentPlayer !== player) return { success: false, reason: 'Not your turn' };
    if (this.gameState.grid[index] !== 0) return { success: false, reason: 'Position occupied' };

    // Placer la pierre temporairement
    this.gameState.grid[index] = player;

    // Vérifier les captures classiques adjacentes
    const capturedStones = this.checkCaptures(index, player);

    // Marquer les pierres capturées comme mortes
    capturedStones.forEach(stoneIndex => {
        this.gameState.deadStones.add(stoneIndex);
    });

    // Vérifier si le coup est suicidaire
    if (this.isSuicideMove(index, player)) {
        // Annuler le coup
        this.gameState.grid[index] = 0;
        // Retirer les marques de pierres mortes
        capturedStones.forEach(stoneIndex => {
            this.gameState.deadStones.delete(stoneIndex);
        });
        return { success: false, reason: 'Suicide move not allowed' };
    }

    // === [NOUVEAU] Détecter les zones entièrement encerclées et capturer les pions adverses isolés dedans
    const extraCapturedStones = [];
    const territories = this.findTerritories();
    const ownedTerritories = territories.filter(t => t.owner === player);

    ownedTerritories.forEach(t => {
        t.points.forEach(index => {
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            directions.forEach(([dx, dy]) => {
                const adjIndex = this.getAdjacentIndex(index, dx, dy);
                if (adjIndex !== null) {
                    const cell = this.getEffectiveCellState(adjIndex);
                    if (cell !== 0 && cell !== player && !this.gameState.deadStones.has(adjIndex)) {
                        const group = this.findConnectedGroup(adjIndex, cell);
                        if (this.hasNoLiberties(group, cell)) {
                            extraCapturedStones.push(...group);
                        }
                    }
                }
            });
        });
    });

    // Supprimer doublons et ajouter à deadStones
    const newCaptures = [...new Set(extraCapturedStones)].filter(i => !this.gameState.deadStones.has(i));
    newCaptures.forEach(i => this.gameState.deadStones.add(i));
    capturedStones.push(...newCaptures);

    // Mettre à jour le score
    if (capturedStones.length > 0) {
        this.gameState.scores[`player${player}`] += capturedStones.length;
    }

    // Mettre à jour les zones capturées
    this.updateCapturedAreas();

    // Changer de joueur
    this.gameState.currentPlayer = player === 1 ? 2 : 1;

    console.log('capturedAreas: ', this.gameState.capturedAreas);

    return {
        success: true,
        gameState: this.getSerializableGameState(),
        move: { index, player },
        capturedStones,
        enclosedAreas: this.gameState.capturedAreas // Pour affichage/animation
    };
}


    checkCaptures(index, player) {
        const opponent = player === 1 ? 2 : 1;
        const capturedStones = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        // Vérifier les groupes adverses adjacents
        for (const [dx, dy] of directions) {
            const adjIndex = this.getAdjacentIndex(index, dx, dy);
            if (adjIndex !== null && this.getEffectiveCellState(adjIndex) === opponent) {
                const group = this.findConnectedGroup(adjIndex, opponent);
                if (this.hasNoLiberties(group, opponent)) {
                    capturedStones.push(...group);
                }
            }
        }

        return [...new Set(capturedStones)];
    }

    isSuicideMove(index, player) {
        const group = this.findConnectedGroup(index, player);
        return this.hasNoLiberties(group, player);
    }

    findConnectedGroup(startIndex, player) {
        const visited = new Set();
        const stack = [startIndex];
        const group = [];

        while (stack.length > 0) {
            const currentIndex = stack.pop();
            if (visited.has(currentIndex)) continue;
            visited.add(currentIndex);

            if (this.getEffectiveCellState(currentIndex) !== player) continue;

            group.push(currentIndex);

            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dx, dy] of directions) {
                const adjIndex = this.getAdjacentIndex(currentIndex, dx, dy);
                if (adjIndex !== null && !visited.has(adjIndex)) {
                    stack.push(adjIndex);
                }
            }
        }

        return group;
    }

    hasNoLiberties(group, player) {
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        for (const stoneIndex of group) {
            for (const [dx, dy] of directions) {
                const adjIndex = this.getAdjacentIndex(stoneIndex, dx, dy);
                if (adjIndex !== null && this.getEffectiveCellState(adjIndex) === 0) {
                    return false; // Liberté trouvée
                }
            }
        }

        return true; // Aucune liberté
    }

    getAdjacentIndex(index, dx, dy) {
        const row = Math.floor(index / this.gridSize);
        const col = index % this.gridSize;
        const newRow = row + dy;
        const newCol = col + dx;

        if (newRow < 0 || newRow >= this.gridSize || newCol < 0 || newCol >= this.gridSize) {
            return null;
        }

        return newRow * this.gridSize + newCol;
    }

    // Méthode pour sérialiser l'état du jeu
    getSerializableGameState() {
        return {
            grid: [...this.gameState.grid],
            currentPlayer: this.gameState.currentPlayer,
            scores: { ...this.gameState.scores },
            gameActive: this.gameState.gameActive,
            gameId: this.gameState.gameId,
            deadStones: Array.from(this.gameState.deadStones),
            capturedAreas: [...this.gameState.capturedAreas] // Inclure les zones capturées
        };
    }

    // Méthode pour calculer le score final
    calculateFinalScore() {
        const territories = this.findTerritories();
        let player1Territory = 0;
        let player2Territory = 0;

        territories.forEach(territory => {
            if (territory.owner === 1) {
                player1Territory += territory.points.length;
            } else if (territory.owner === 2) {
                player2Territory += territory.points.length;
            }
        });

        return {
            player1: this.gameState.scores.player1 + player1Territory,
            player2: this.gameState.scores.player2 + player2Territory,
            territories
        };
    }

    findTerritories() {
        const visited = new Set();
        const territories = [];

        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            if (this.getEffectiveCellState(i) === 0 && !visited.has(i)) {
                const territory = this.exploreTerritory(i, visited);
                if (territory.owner !== null) {
                    territories.push(territory);
                }
            }
        }

        return territories;
    }

    exploreTerritory(startIndex, visited) {
        const queue = [startIndex];
        const points = [];
        const boundaryPlayers = new Set();
        const boundaryStones = new Set(); // Nouveau: stocke les pierres frontières

        while (queue.length > 0) {
            const currentIndex = queue.shift();
            if (visited.has(currentIndex)) continue;
            visited.add(currentIndex);

            if (this.getEffectiveCellState(currentIndex) !== 0) continue;

            points.push(currentIndex);

            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dx, dy] of directions) {
                const adjIndex = this.getAdjacentIndex(currentIndex, dx, dy);
                if (adjIndex !== null) {
                    const adjValue = this.getEffectiveCellState(adjIndex);
                    if (adjValue === 0 && !visited.has(adjIndex)) {
                        queue.push(adjIndex);
                    } else if (adjValue !== 0) {
                        boundaryPlayers.add(adjValue);
                        boundaryStones.add(adjIndex); // Enregistrer la pierre frontière
                    }
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
            stones: Array.from(boundaryStones) // Retourner les pierres frontières
        };
    }

    // Nouvelle méthode pour mettre à jour les zones capturées
    updateCapturedAreas() {
        const territories = this.findTerritories();
        this.gameState.capturedAreas = territories.filter(t => t.owner !== null);
    }
}

const gameRooms = new Map();

io.on('connection', (socket) => {
    console.log(`New player connected: ${socket.id}`);

    socket.on('joinGame', () => {
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

        socket.emit('gameJoined', {
            playerId: playerNumber,
            gameState: gameRoom.getSerializableGameState(),
            playerCount: gameRoom.players.size
        });

        if (gameRoom.players.size === 2) {
            io.to(gameRoom.gameState.gameId).emit('gameStart', {
                gameState: gameRoom.getSerializableGameState()
            });
        }
    });

    socket.on('makeMove', (data) => {
        const gameRoom = gameRooms.get(socket.gameRoomId);
        if (!gameRoom) return;

        const playerNumber = gameRoom.getPlayerNumber(socket.id);
        const result = gameRoom.makeMove(data.index, playerNumber);

        if (result.success) {
            io.to(socket.gameRoomId).emit('moveMade', {
                gameState: result.gameState,
                move: result.move,
                capturedStones: result.capturedStones
            });
        } else {
            socket.emit('moveError', { reason: result.reason });
        }
    });

    socket.on('calculateScore', () => {
        const gameRoom = gameRooms.get(socket.gameRoomId);
        if (!gameRoom) return;

        const finalScore = gameRoom.calculateFinalScore();
        io.to(socket.gameRoomId).emit('finalScore', finalScore);
    });

    socket.on('resetGame', () => {
        const gameRoom = gameRooms.get(socket.gameRoomId);
        if (!gameRoom) return;

        gameRoom.resetGame();
        io.to(socket.gameRoomId).emit('gameReset', {
            gameState: gameRoom.getSerializableGameState()
        });
    });

    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        if (socket.gameRoomId) {
            const gameRoom = gameRooms.get(socket.gameRoomId);
            if (gameRoom) {
                gameRoom.removePlayer(socket.id);
                socket.to(socket.gameRoomId).emit('playerDisconnected');
                if (gameRoom.players.size === 0) {
                    gameRooms.delete(socket.gameRoomId);
                }
            }
        }
    });
});

const PORT = process.env.PORT || 5555;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
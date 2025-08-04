const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static(path.join(__dirname, 'public')));

class GameRoom {
    constructor() {
        this.players = new Map();
        this.gridSize = 19; // Grille 19x19 comme le Go
        this.gameState = {
            grid: Array(this.gridSize * this.gridSize).fill(0),
            currentPlayer: 1,
            scores: { player1: 0, player2: 0 },
            gameActive: false,
            gameId: this.generateGameId(),
            capturedAreas: []
        };
    }

    generateGameId() {
        return Math.random().toString(36).substr(2, 9);
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

        // Placer le point
        this.gameState.grid[index] = player;

        // Vérifier les captures
        const { capturedStones, enclosedAreas } = this.checkCapturesAndEnclosures(index, player);
        
        // Mettre à jour le score
        if (capturedStones.length > 0) {
            this.gameState.scores[`player${player}`] += capturedStones.length;
        }

        // Ajouter les zones entourées
        enclosedAreas.forEach(area => {
            this.gameState.capturedAreas.push({
                player,
                points: area,
                stones: capturedStones
            });
            this.gameState.scores[`player${player}`] += area.length;
        });

        // Changer de joueur
        this.gameState.currentPlayer = this.gameState.currentPlayer === 1 ? 2 : 1;

        return {
            success: true,
            gameState: this.gameState,
            move: { index, player },
            capturedStones,
            enclosedAreas
        };
    }

    checkCapturesAndEnclosures(index, player) {
        const opponent = player === 1 ? 2 : 1;
        const capturedStones = [];
        const enclosedAreas = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        // Vérifier les pierres adverses adjacentes
        for (const [dx, dy] of directions) {
            const adjIndex = this.getAdjacentIndex(index, dx, dy);
            if (adjIndex !== null && this.gameState.grid[adjIndex] === opponent) {
                const { captured, liberties } = this.checkGroupLiberties(adjIndex, opponent);
                if (liberties === 0) {
                    capturedStones.push(...captured);
                }
            }
        }

        // Vérifier les zones entourées
        const emptyAdjacents = [];
        for (const [dx, dy] of directions) {
            const adjIndex = this.getAdjacentIndex(index, dx, dy);
            if (adjIndex !== null && this.gameState.grid[adjIndex] === 0) {
                emptyAdjacents.push(adjIndex);
            }
        }

        for (const emptyIndex of emptyAdjacents) {
            const { area, isEnclosed, enclosingPlayer } = this.checkAreaEnclosure(emptyIndex);
            if (isEnclosed && enclosingPlayer === player) {
                enclosedAreas.push(area);
            }
        }

        return { capturedStones, enclosedAreas };
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

    checkGroupLiberties(startIndex, player) {
        const visited = new Set();
        const queue = [startIndex];
        const group = [];
        let liberties = 0;

        while (queue.length > 0) {
            const currentIndex = queue.pop();
            if (visited.has(currentIndex)) continue;
            visited.add(currentIndex);

            if (this.gameState.grid[currentIndex] !== player) {
                if (this.gameState.grid[currentIndex] === 0) liberties++;
                continue;
            }

            group.push(currentIndex);

            // Vérifier les 4 directions
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dx, dy] of directions) {
                const adjIndex = this.getAdjacentIndex(currentIndex, dx, dy);
                if (adjIndex !== null && !visited.has(adjIndex)) {
                    queue.push(adjIndex);
                }
            }
        }

        return { captured: group, liberties };
    }

    checkAreaEnclosure(startIndex) {
        const visited = new Set();
        const queue = [startIndex];
        const area = [];
        let isEnclosed = true;
        let enclosingPlayer = null;

        while (queue.length > 0) {
            const currentIndex = queue.pop();
            if (visited.has(currentIndex)) continue;
            visited.add(currentIndex);

            if (this.gameState.grid[currentIndex] !== 0) {
                if (enclosingPlayer === null) {
                    enclosingPlayer = this.gameState.grid[currentIndex];
                } else if (this.gameState.grid[currentIndex] !== enclosingPlayer) {
                    isEnclosed = false;
                }
                continue;
            }

            area.push(currentIndex);

            // Vérifier les 4 directions
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dx, dy] of directions) {
                const adjIndex = this.getAdjacentIndex(currentIndex, dx, dy);
                if (adjIndex === null) {
                    isEnclosed = false;
                } else if (!visited.has(adjIndex)) {
                    queue.push(adjIndex);
                }
            }
        }

        return { area, isEnclosed, enclosingPlayer };
    }

    resetGame() {
        this.gameState.grid = Array(this.gridSize * this.gridSize).fill(0);
        this.gameState.currentPlayer = 1;
        this.gameState.scores = { player1: 0, player2: 0 };
        this.gameState.capturedAreas = [];
        this.gameState.gameActive = this.players.size === 2;
    }
}

const gameRooms = new Map();
let waitingPlayers = [];

io.on('connection', (socket) => {
    console.log(`New player connected: ${socket.id}`);

    socket.on('joinGame', () => {
        let gameRoom;
        let playerNumber;

        for (let [roomId, room] of gameRooms) {
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
            gameState: gameRoom.gameState,
            playerCount: gameRoom.players.size
        });

        if (gameRoom.players.size === 2) {
            io.to(gameRoom.gameState.gameId).emit('gameStart', {
                gameState: gameRoom.gameState
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
                capturedStones: result.capturedStones,
                enclosedAreas: result.enclosedAreas
            });
        } else {
            socket.emit('moveError', { reason: result.reason });
        }
    });

    socket.on('resetGame', () => {
        const gameRoom = gameRooms.get(socket.gameRoomId);
        if (!gameRoom) return;

        gameRoom.resetGame();
        io.to(socket.gameRoomId).emit('gameReset', {
            gameState: gameRoom.gameState
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
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
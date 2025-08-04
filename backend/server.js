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
            capturedStones: new Set(),
            territories: []
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

        // Placer la pierre
        this.gameState.grid[index] = player;

        // Vérifier les captures
        const capturedStones = this.checkCaptures(index, player);
        
        // Mettre à jour le score
        if (capturedStones.length > 0) {
            this.gameState.scores[`player${player}`] += capturedStones.length;
            capturedStones.forEach(stone => this.gameState.capturedStones.add(stone));
        }

        // Vérifier les territoires
        const newTerritories = this.findTerritories();
        this.updateTerritories(newTerritories);

        // Changer de joueur
        this.gameState.currentPlayer = player === 1 ? 2 : 1;

        return {
            success: true,
            gameState: this.gameState,
            move: { index, player },
            capturedStones,
            territories: newTerritories
        };
    }

    checkCaptures(index, player) {
        const opponent = player === 1 ? 2 : 1;
        const capturedStones = new Set();
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        // Vérifier les groupes adverses adjacents
        for (const [dx, dy] of directions) {
            const adjIndex = this.getAdjacentIndex(index, dx, dy);
            if (adjIndex !== null && this.gameState.grid[adjIndex] === opponent) {
                const groupInfo = this.findGroupWithLiberties(adjIndex);
                if (groupInfo.liberties === 0) {
                    groupInfo.stones.forEach(stone => capturedStones.add(stone));
                }
            }
        }

        // Vérifier si le coup joué se capture lui-même (interdit)
        const selfGroup = this.findGroupWithLiberties(index);
        if (selfGroup.liberties === 0) {
            // Coup suicide - annuler le coup
            this.gameState.grid[index] = 0;
            return { success: false, reason: 'Suicide move not allowed' };
        }

        return Array.from(capturedStones);
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

    findGroupWithLiberties(startIndex) {
        const player = this.gameState.grid[startIndex];
        if (player === 0) return { stones: [], liberties: 0 };

        const visited = new Set();
        const queue = [startIndex];
        const group = [];
        let liberties = 0;

        while (queue.length > 0) {
            const currentIndex = queue.shift();
            if (visited.has(currentIndex)) continue;
            visited.add(currentIndex);

            if (this.gameState.grid[currentIndex] === 0) {
                liberties++;
                continue;
            }

            if (this.gameState.grid[currentIndex] !== player) continue;

            group.push(currentIndex);

            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dx, dy] of directions) {
                const adjIndex = this.getAdjacentIndex(currentIndex, dx, dy);
                if (adjIndex !== null && !visited.has(adjIndex)) {
                    queue.push(adjIndex);
                }
            }
        }

        return { stones: group, liberties };
    }

    findTerritories() {
        const visited = new Set();
        const territories = [];

        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            if (this.gameState.grid[i] === 0 && !visited.has(i)) {
                const territoryInfo = this.exploreTerritory(i, visited);
                if (territoryInfo.isEnclosed) {
                    territories.push({
                        player: territoryInfo.enclosingPlayer,
                        points: territoryInfo.area
                    });
                }
            }
        }

        return territories;
    }

    exploreTerritory(startIndex, visited) {
        const queue = [startIndex];
        const area = [];
        let isEnclosed = true;
        let enclosingPlayer = null;
        const boundaryPlayers = new Set();

        while (queue.length > 0) {
            const currentIndex = queue.shift();
            if (visited.has(currentIndex)) continue;
            visited.add(currentIndex);

            if (this.gameState.grid[currentIndex] !== 0) continue;

            area.push(currentIndex);

            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dx, dy] of directions) {
                const adjIndex = this.getAdjacentIndex(currentIndex, dx, dy);
                if (adjIndex === null) {
                    isEnclosed = false;
                } else {
                    const adjValue = this.gameState.grid[adjIndex];
                    if (adjValue === 0 && !visited.has(adjIndex)) {
                        queue.push(adjIndex);
                    } else if (adjValue !== 0) {
                        // Vérifier que la pierre n'est pas capturée
                        if (!this.gameState.capturedStones.has(adjIndex)) {
                            boundaryPlayers.add(adjValue);
                        }
                    }
                }
            }
        }

        // Un territoire est valide seulement s'il est entouré par un seul joueur
        if (boundaryPlayers.size === 1) {
            enclosingPlayer = boundaryPlayers.values().next().value;
        } else {
            isEnclosed = false;
        }

        return { area, isEnclosed, enclosingPlayer };
    }

    updateTerritories(newTerritories) {
        // Réinitialiser les territoires précédents
        this.gameState.territories = [];

        // Ajouter les nouveaux territoires valides
        for (const territory of newTerritories) {
            if (territory.player) {
                this.gameState.territories.push(territory);
                // Mettre à jour le score
                this.gameState.scores[`player${territory.player}`] += territory.points.length;
            }
        }
    }
}

const gameRooms = new Map();

io.on('connection', (socket) => {
    console.log(`New player connected: ${socket.id}`);

    socket.on('joinGame', () => {
        let gameRoom;
        let playerNumber;

        // Chercher une salle avec un joueur seul
        for (const [roomId, room] of gameRooms) {
            if (room.players.size === 1) {
                gameRoom = room;
                playerNumber = 2;
                break;
            }
        }

        // Si aucune salle disponible, créer une nouvelle salle
        if (!gameRoom) {
            gameRoom = new GameRoom();
            playerNumber = 1;
            gameRooms.set(gameRoom.gameState.gameId, gameRoom);
        }

        // Ajouter le joueur à la salle
        gameRoom.addPlayer(socket.id, playerNumber);
        socket.join(gameRoom.gameState.gameId);
        socket.gameRoomId = gameRoom.gameState.gameId;
        socket.playerNumber = playerNumber;

        // Envoyer les informations au joueur
        socket.emit('gameJoined', {
            playerId: playerNumber,
            gameState: gameRoom.gameState,
            playerCount: gameRoom.players.size
        });

        // Si deux joueurs sont connectés, démarrer le jeu
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
                gameState: gameRoom.gameState,
                move: result.move,
                capturedStones: result.capturedStones,
                territories: result.territories
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
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
export class NetworkGame {
    constructor() {
        this.socket = null;
        this.roomId = null;
        this.playerId = null;
        this.playerName = 'Игрок';
        this.isConnected = false;
        this.isHost = false;
        this.players = new Map();
        this.currentRoomId = null;
    }

    connect(roomId, playerName) {
        return new Promise((resolve, reject) => {
            this.socket = io();
            this.roomId = roomId;
            this.playerName = playerName;
            this.currentRoomId = roomId;
            
            this.socket.on('connect', () => {
                this.isConnected = true;
                this.playerId = this.socket.id;
                
                this.socket.emit('join_room', {
                    roomId: roomId,
                    playerName: playerName
                });
                
                resolve({
                    success: true,
                    playerId: this.playerId,
                    isHost: false,
                    roomId: roomId
                });
            });
            
            this.socket.on('player_joined', (data) => {
                this.players.clear();
                data.players.forEach(player => {
                    this.players.set(player.id, player);
                    if (player.id === this.playerId) {
                        this.isHost = player.isHost;
                    }
                });
                
                if (this.onPlayersUpdate) {
                    this.onPlayersUpdate(Array.from(this.players.values()));
                }
            });

            this.socket.on('room_state', (data) => {
                if (this.onRoomState) {
                    this.onRoomState(data);
                }
            });

            this.socket.on('game_object_added', (data) => {
                if (this.onGameObjectAdded) {
                    this.onGameObjectAdded(data.object);
                }
            });

            this.socket.on('game_object_removed', (data) => {
                if (this.onGameObjectRemoved) {
                    this.onGameObjectRemoved(data.objectId);
                }
            });

            this.socket.on('game_object_updated', (data) => {
                if (this.onGameObjectUpdated) {
                    this.onGameObjectUpdated(data.object);
                }
            });

            this.socket.on('clear_game_field', (data) => {
                if (this.onClearGameField) {
                    this.onClearGameField();
                }
            });
            
            this.socket.on('connect_error', (error) => {
                reject(error);
            });
            
            setTimeout(() => {
                if (!this.isConnected) {
                    reject(new Error('Connection timeout'));
                }
            }, 5000);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
        this.isConnected = false;
        this.players.clear();
    }

    // Game object synchronization
    sendGameObjectAdded(object) {
        if (!this.isConnected || !this.socket) return;
        this.socket.emit('game_object_added', { object });
    }

    sendGameObjectRemoved(objectId) {
        if (!this.isConnected || !this.socket) return;
        this.socket.emit('game_object_removed', { objectId });
    }

    sendGameObjectUpdated(object) {
        if (!this.isConnected || !this.socket) return;
        this.socket.emit('game_object_updated', { object });
    }

    sendClearGameField() {
        if (!this.isConnected || !this.socket) return;
        this.socket.emit('clear_game_field', {});
    }

    // Chat and game management
    sendMessage(message) {
        if (!this.isConnected || !this.socket) return;
        this.socket.emit('chat_message', { message });
    }

    startGame() {
        if (!this.isConnected || !this.socket || !this.isHost) return;
        this.socket.emit('start_game', {});
    }

    sendCorrectAnswer(playerId) {
        if (!this.isConnected || !this.socket || !this.isHost) return;
        this.socket.emit('correct_answer', { playerId });
    }

    // Event listeners
    onMessage(callback) {
        if (this.socket) {
            this.socket.on('chat_message', (data) => {
                callback(data);
            });
        }
    }

    onPlayersUpdate(callback) {
        this.onPlayersUpdate = callback;
    }

    onGameStart(callback) {
        if (this.socket) {
            this.socket.on('game_started', (data) => {
                callback(data);
            });
        }
    }

    onMovieReveal(callback) {
        if (this.socket) {
            this.socket.on('movie_reveal', (data) => {
                callback(data);
            });
        }
    }

    // Game object synchronization callbacks
    onRoomState(callback) {
        this.onRoomState = callback;
    }

    onGameObjectAdded(callback) {
        this.onGameObjectAdded = callback;
    }

    onGameObjectRemoved(callback) {
        this.onGameObjectRemoved = callback;
    }

    onGameObjectUpdated(callback) {
        this.onGameObjectUpdated = callback;
    }

    onClearGameField(callback) {
        this.onClearGameField = callback;
    }

    // Player management
    updatePlayerScore(playerId, points) {
        const player = this.players.get(playerId);
        if (player) {
            player.score += points;
        }
    }

    getPlayers() {
        return Array.from(this.players.values());
    }

    getCurrentRoomId() {
        return this.currentRoomId;
    }
}

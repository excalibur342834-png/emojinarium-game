import { NetworkGame } from './network.js';
import { GameEngine } from './game.js';
import { UIManager } from './ui.js';

class EmojinariumGame {
    constructor() {
        this.network = new NetworkGame();
        this.gameEngine = new GameEngine();
        this.uiManager = new UIManager();
        
        this.gameMode = 'single';
        this.isHost = false;
        this.currentMovie = null;
        
        this.initializeElements();
        this.initEventListeners();
    }

    initializeElements() {
        this.gameField = document.getElementById('gameField');
        this.sectionsContainer = document.getElementById('sectionsContainer');
        
        this.gameEngine.initialize(this.gameField);
        this.uiManager.initialize(this.sectionsContainer);
    }

    initEventListeners() {
        this.gameField.addEventListener('dragover', this.handleDragOver.bind(this));
        this.gameField.addEventListener('drop', this.handleDrop.bind(this));
        this.gameField.addEventListener('click', this.handleDoubleClick.bind(this));
        this.gameField.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });

        document.addEventListener('keydown', this.handleKeydown.bind(this));

        this.uiManager.initModal(
            (playerName, statusElement) => this.createRoom(playerName, statusElement),
            (roomId, playerName, statusElement) => this.joinRoom(roomId, playerName, statusElement),
            (playerName) => this.startSingleGame(playerName)
        );

        this.uiManager.initChat(this.sendChatMessage.bind(this));
    }

    async createRoom(playerName, statusElement) {
        try {
            const result = await this.network.createRoom(playerName);
            
            if (result.success) {
                this.isHost = true;
                this.gameMode = 'network';
                
                this.uiManager.showRoomCreated(result.roomId, statusElement);
                localStorage.setItem('lastRoomId', result.roomId);
                
                setTimeout(() => {
                    this.startNetworkGame();
                }, 2000);
            }
        } catch (error) {
            throw error;
        }
    }

    async joinRoom(roomId, playerName, statusElement) {
        try {
            const result = await this.network.joinRoom(roomId, playerName);
            
            if (result.success) {
                this.isHost = false;
                this.gameMode = 'network';
                
                statusElement.textContent = 'Успешно присоединились!';
                statusElement.className = 'status-message status-connected';
                localStorage.setItem('lastRoomId', roomId);
                
                setTimeout(() => {
                    this.startNetworkGame();
                }, 1000);
            }
        } catch (error) {
            throw error;
        }
    }

    startNetworkGame() {
        this.uiManager.showScreen('game');
        
        this.uiManager.initGameControls(
            () => this.generateNewMovie(),
            () => this.clearGameField(),
            () => this.disconnectGame(),
            this.isHost
        );
        
        if (this.isHost) {
            this.uiManager.toggleEmojiMenu(true);
            this.uiManager.toggleChat(true);
            this.generateNewMovie();
            this.uiManager.initSections(this.gameEngine.emojiCategories, this);
        } else {
            this.uiManager.toggleEmojiMenu(false);
            this.uiManager.toggleChat(true);
            this.uiManager.toggleMovieDisplay(false);
            this.createPlayerPlaceholder();
        }
        
        this.initNetworkListeners();
        this.updatePlayersList();
    }

    startSingleGame(playerName = 'Игрок') {
        this.gameMode = 'single';
        this.isHost = true;
        
        this.uiManager.showScreen('game');
        this.uiManager.toggleEmojiMenu(true);
        this.uiManager.toggleChat(false);
        
        this.uiManager.initGameControls(
            () => this.generateNewMovie(),
            () => this.clearGameField(),
            () => this.disconnectGame(),
            true
        );
        
        this.generateNewMovie();
        this.uiManager.initSections(this.gameEngine.emojiCategories, this);
    }

    initNetworkListeners() {
        this.network.onChatMessage((data) => {
            this.uiManager.addChatMessage(data.playerName, data.message, data.isCorrect);
        });

        this.network.onPlayersUpdate((players) => {
            this.updatePlayersList();
        });

        this.network.onGameStarted((data) => {
            this.uiManager.addChatMessage('Система', data.message, true);
            this.createPlayerPlaceholder();
        });

        this.network.onMovieReveal((movie) => {
            this.currentMovie = movie;
            this.uiManager.updateMovieDisplay(movie);
            this.uiManager.showLoading(false);
        });

        this.network.onRoomState((data) => {
            if (data.movie && !this.isHost) {
                this.currentMovie = data.movie;
            }
            
            if (data.gameObjects && data.gameObjects.length > 0) {
                data.gameObjects.forEach(obj => {
                    this.gameEngine.createGameObjectFromData(obj, this.isHost, this.network);
                });
            }
        });

        this.network.onGameObjectAdded((object) => {
            this.gameEngine.createGameObjectFromData(object, this.isHost, this.network);
        });

        this.network.onGameObjectRemoved((objectId) => {
            const object = this.gameEngine.gameObjects.get(objectId);
            if (object) {
                object.remove();
                this.gameEngine.gameObjects.delete(objectId);
            }
        });

        this.network.onGameObjectUpdated((object) => {
            const existingObject = this.gameEngine.gameObjects.get(object.id);
            if (existingObject) {
                existingObject.style.left = object.left + 'px';
                existingObject.style.top = object.top + 'px';
                existingObject.style.width = object.width + 'px';
                existingObject.style.height = object.height + 'px';
                existingObject.style.fontSize = object.fontSize + 'px';
                existingObject.style.transform = `rotate(${object.rotation}deg)`;
                existingObject.setAttribute('data-rotation', object.rotation);
            }
        });

        this.network.onClearGameField(() => {
            this.gameEngine.clearGameField(this.isHost, this.network);
        });

        this.network.onPlayerScored((data) => {
            this.network.updatePlayerScore(data.playerId, 1);
            this.updatePlayersList();
        });
    }

    async generateNewMovie() {
        this.uiManager.showLoading(true);
        try {
            const movie = await this.getRandomMovieFromKinopoisk();
            this.currentMovie = movie;
            
            this.uiManager.updateMovieDisplay(movie);
            this.gameEngine.clearGameField(this.isHost, this.network);
            this.uiManager.updateSectionsWithRandomEmojis(this.gameEngine.emojiCategories);
        } catch (error) {
            console.error('Ошибка загрузки фильма:', error);
            this.useFallbackMovies();
        } finally {
            this.uiManager.showLoading(false);
        }
    }

    async getRandomMovieFromKinopoisk() {
        const topMovies = [
            { title: "Побег из Шоушенка", year: "1994" },
            { title: "Крёстный отец", year: "1972" },
            { title: "Тёмный рыцарь", year: "2008" },
            { title: "Крёстный отец 2", year: "1974" },
            { title: "12 разгневанных мужчин", year: "1957" },
            { title: "Список Шиндлера", year: "1993" },
            { title: "Властелин колец: Возвращение короля", year: "2003" },
            { title: "Криминальное чтиво", year: "1994" },
            { title: "Властелин колец: Братство Кольца", year: "2001" },
            { title: "Хороший, плохой, злой", year: "1966" },
            { title: "Форрест Гамп", year: "1994" },
            { title: "Бойцовский клуб", year: "1999" },
            { title: "Властелин колец: Две крепости", year: "2002" },
            { title: "Начало", year: "2010" },
            { title: "Звёздные войны: Эпизод 5 - Империя наносит ответный удар", year: "1980" },
            { title: "Матрица", year: "1999" },
            { title: "Славные парни", year: "1990" },
            { title: "Пролетая над гнездом кукушки", year: "1975" },
            { title: "Семь", year: "1995" },
            { title: "Молчаление ягнят", year: "1991" }
        ];

        const randomIndex = Math.floor(Math.random() * topMovies.length);
        return topMovies[randomIndex];
    }

    useFallbackMovies() {
        const fallbackMovies = [
            { title: "Титаник", year: "1997" },
            { title: "Король Лев", year: "1994" },
            { title: "Матрица", year: "1999" },
            { title: "Гарри Поттер и философский камень", year: "2001" },
            { title: "Пираты Карибского моря", year: "2003" },
            { title: "Властелин Колец", year: "2001" },
            { title: "Звездные Войны", year: "1977" },
            { title: "Холодное Сердце", year: "2013" },
            { title: "Человек-паук", year: "2002" },
            { title: "Аватар", year: "2009" }
        ];
        
        const randomIndex = Math.floor(Math.random() * fallbackMovies.length);
        this.currentMovie = fallbackMovies[randomIndex];
        this.uiManager.updateMovieDisplay(this.currentMovie);
    }

    clearGameField() {
        this.gameEngine.clearGameField(this.isHost, this.network);
    }

    createPlayerPlaceholder() {
        const placeholder = this.gameField.querySelector('.field-placeholder');
        if (placeholder) {
            placeholder.innerHTML = `
                <div class="icon">🎭</div>
                <div>Создатель игры составляет сцену из фильма...</div>
                <div style="margin-top: 10px; font-size: 14px;">Угадайте фильм и напишите в чат!</div>
            `;
        }
    }

    handleDragStart(e) {
        if (e.target.classList.contains('menu-item')) {
            const item = e.target;
            
            const dragImage = document.createElement('div');
            dragImage.textContent = item.textContent;
            dragImage.style.fontSize = '40px';
            dragImage.style.opacity = '0.8';
            dragImage.style.position = 'fixed';
            dragImage.style.left = '-100px';
            dragImage.style.top = '-100px';
            document.body.appendChild(dragImage);
            
            e.dataTransfer.setData('text/plain', item.textContent);
            e.dataTransfer.setDragImage(dragImage, 20, 20);
            
            setTimeout(() => {
                document.body.removeChild(dragImage);
            }, 0);
            
            item.classList.add('dragging');
        }
    }

    handleDragEnd(e) {
        if (e.target.classList.contains('menu-item')) {
            e.target.classList.remove('dragging');
        }
    }

    handleDragOver(e) {
        e.preventDefault();
    }

    handleDrop(e) {
        e.preventDefault();
        const emoji = e.dataTransfer.getData('text/plain');
        if (emoji) {
            this.gameEngine.createGameObject(emoji, e.clientX, e.clientY, this.isHost, this.network);
        }
    }

    handleDoubleClick(e) {
        if (e.detail === 2) {
            const gameObject = e.target.closest('.game-object');
            if (gameObject) {
                this.gameEngine.removeGameObject(gameObject, this.isHost, this.network);
            }
        }
    }

    handleWheel(e) {
        if (e.target.classList.contains('game-object')) {
            e.preventDefault();
        }
    }

    handleKeydown(e) {
        if (e.key === 'Escape' && this.uiManager.currentExpandedSection) {
            this.uiManager.closeSection(this.uiManager.currentExpandedSection);
        }
    }

    sendChatMessage(message) {
        if (this.gameMode === 'network') {
            this.network.sendMessage(message);
        }
        this.uiManager.addChatMessage('Вы', message);
    }

    markCorrectAnswer(playerId) {
        if (this.gameMode === 'network' && this.isHost) {
            this.network.sendCorrectAnswer(playerId);
            const player = this.network.getPlayers().find(p => p.id === playerId);
            if (player) {
                this.uiManager.addChatMessage('Система', `✅ ${player.name} получает балл за правильный ответ!`, true);
            }
        }
    }

    updatePlayersList() {
        const players = this.network.getPlayers();
        this.uiManager.updatePlayersList(players, this.isHost, this.markCorrectAnswer.bind(this));
    }

    disconnectGame() {
        if (this.gameMode === 'network') {
            this.network.disconnect();
        }
        this.uiManager.showScreen('menu');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new EmojinariumGame();
});

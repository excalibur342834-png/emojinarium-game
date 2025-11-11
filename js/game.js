// js/game.js
import { getRandomMovie, getFallbackMovies } from './movies.js';

export class GameLogic {
    constructor() {
        this.gameField = document.getElementById('gameField');
        this.sectionsContainer = document.getElementById('sectionsContainer');
        this.movieTitle = document.getElementById('movieTitle');
        this.movieYear = document.getElementById('movieYear');
        this.loadingMovie = document.getElementById('loadingMovie');
        this.movieDisplay = document.getElementById('movieDisplay');
        this.emojiMenu = document.getElementById('emojiMenu');
        this.chatSection = document.getElementById('chatSection');
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.playersList = document.getElementById('playersList');
        
        this.objectCounter = 0;
        this.currentMovie = null;
        this.currentExpandedSection = null;
        this.sectionOrder = [];
        this.isRotating = false;
        this.rotationStartAngle = 0;
        this.rotationCurrentAngle = 0;
        this.emojiCategories = [];
        this.isHost = false;
        this.network = null;
    }

    async init(emojiCategories, isHost, network = null) {
        this.emojiCategories = emojiCategories;
        this.isHost = isHost;
        this.network = network;

        // Настройка интерфейса в зависимости от роли
        if (this.isHost) {
            this.emojiMenu.classList.remove('hidden');
            this.chatSection.classList.add('active');
            await this.generateNewMovie();
            this.initSections();
        } else {
            this.emojiMenu.classList.add('hidden');
            this.chatSection.classList.add('active');
            this.movieDisplay.style.display = 'none';
            this.createPlayerPlaceholder();
        }

        this.initEventListeners();
    }

    async generateNewMovie() {
        this.showLoading(true);
        try {
            const movie = await getRandomMovie();
            this.currentMovie = movie;
            
            this.movieTitle.textContent = movie.title;
            this.movieYear.textContent = `Год выпуска: ${movie.year}`;
            
            this.clearGameField();
            this.updateSectionsWithRandomEmojis();
        } catch (error) {
            console.error('Ошибка загрузки фильма:', error);
            this.useFallbackMovies();
        } finally {
            this.showLoading(false);
        }
    }

    useFallbackMovies() {
        const fallbackMovies = getFallbackMovies();
        const randomIndex = Math.floor(Math.random() * fallbackMovies.length);
        this.currentMovie = fallbackMovies[randomIndex];
        
        this.movieTitle.textContent = this.currentMovie.title;
        this.movieYear.textContent = `Год выпуска: ${this.currentMovie.year}`;
    }

    showLoading(show) {
        this.loadingMovie.style.display = show ? 'block' : 'none';
        this.movieYear.style.display = show ? 'none' : 'block';
    }

    getRandomEmojis(emojis, count) {
        const shuffled = [...emojis].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    updateSectionsWithRandomEmojis() {
        const sections = this.sectionsContainer.querySelectorAll('.section');
        sections.forEach((section, index) => {
            const content = section.querySelector('.section-content');
            const menuItems = content.querySelectorAll('.menu-item');
            
            const randomEmojis = this.getRandomEmojis(this.emojiCategories[index].emojis, 20);
            
            menuItems.forEach((item, itemIndex) => {
                if (itemIndex < randomEmojis.length) {
                    item.textContent = randomEmojis[itemIndex];
                }
            });
        });
    }

    initSections() {
        this.sectionsContainer.innerHTML = '';
        this.sectionOrder = [];
        
        this.emojiCategories.forEach((category, index) => {
            const section = document.createElement('div');
            section.className = 'section';
            section.setAttribute('data-original-index', index);
            
            this.sectionOrder.push(index);
            
            const sectionHeader = document.createElement('div');
            sectionHeader.className = 'section-header collapsed';
            sectionHeader.textContent = category.title;
            sectionHeader.setAttribute('data-section', index);
            
            const sectionContent = document.createElement('div');
            sectionContent.className = 'section-content';
            
            for (let i = 0; i < 20; i++) {
                const menuItem = document.createElement('div');
                menuItem.className = 'menu-item';
                menuItem.setAttribute('data-type', `emoji-${index}-${i}`);
                menuItem.setAttribute('draggable', 'true');
                menuItem.textContent = '⬜';
                sectionContent.appendChild(menuItem);
            }
            
            section.appendChild(sectionHeader);
            section.appendChild(sectionContent);
            this.sectionsContainer.appendChild(section);
        });

        this.updateSectionsWithRandomEmojis();
    }

    initEventListeners() {
        // Кнопки управления
        document.getElementById('newMovieBtn').addEventListener('click', () => {
            this.generateNewMovie();
        });

        document.getElementById('clearFieldBtn').addEventListener('click', () => {
            this.clearGameField();
        });

        // Чат
        this.sendBtn.addEventListener('click', () => {
            this.sendChatMessage();
        });

        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });

        // События для элементов меню (только для хоста)
        if (this.isHost) {
            this.sectionsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('section-header')) {
                    this.toggleSection(e.target);
                }
            });

            this.sectionsContainer.addEventListener('dragstart', this.handleDragStart.bind(this));
            this.sectionsContainer.addEventListener('dragend', this.handleDragEnd.bind(this));
        }

        // События для игрового поля
        this.gameField.addEventListener('dragover', this.handleDragOver.bind(this));
        this.gameField.addEventListener('drop', this.handleDrop.bind(this));
        this.gameField.addEventListener('click', this.handleDoubleClick.bind(this));
        this.gameField.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });

        this.initKeyboardListeners();
    }

    sendChatMessage() {
        const message = this.chatInput.value.trim();
        if (message) {
            if (this.network) {
                this.network.sendMessage(message);
            }
            this.addChatMessage('Вы', message);
            this.chatInput.value = '';
        }
    }

    addChatMessage(sender, message, isSystem = false) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isSystem ? 'system' : ''}`;
        
        const messageHeader = document.createElement('div');
        messageHeader.className = 'message-header';
        messageHeader.textContent = sender;
        
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        messageText.textContent = message;
        
        messageElement.appendChild(messageHeader);
        messageElement.appendChild(messageText);
        this.chatMessages.appendChild(messageElement);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    updatePlayersList(players = []) {
        this.playersList.innerHTML = '';
        
        players.forEach(player => {
            const playerElement = document.createElement('div');
            playerElement.className = 'player-item';
            
            const playerName = document.createElement('span');
            playerName.className = 'player-name';
            playerName.textContent = player.name + (player.isHost ? ' 👑' : '');
            
            const playerScore = document.createElement('span');
            playerScore.className = 'player-score';
            playerScore.textContent = player.score;
            
            playerElement.appendChild(playerName);
            playerElement.appendChild(playerScore);
            
            // Если хост, добавляем кнопку для отметки правильного ответа
            if (this.isHost && !player.isHost && this.network) {
                const correctBtn = document.createElement('button');
                correctBtn.className = 'correct-answer-btn';
                correctBtn.textContent = '✓';
                correctBtn.title = 'Отметить правильный ответ';
                correctBtn.addEventListener('click', () => {
                    this.network.sendCorrectAnswer(player.id);
                    this.addChatMessage('Система', `✅ ${player.name} получает балл за правильный ответ!`, true);
                });
                playerElement.appendChild(correctBtn);
            }
            
            this.playersList.appendChild(playerElement);
        });
    }

    updatePlayerScore(playerId, points) {
        if (this.network) {
            this.network.updatePlayerScore(playerId, points);
            this.updatePlayersList(this.network.getPlayers());
        }
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

    showInstructions(html) {
        const instructions = document.getElementById('instructions');
        instructions.innerHTML = html;
        instructions.classList.add('active');
    }

    // Методы для работы с игровыми объектами
    createGameObject(emoji, x, y) {
        const placeholder = this.gameField.querySelector('.field-placeholder');
        if (placeholder) {
            placeholder.remove();
        }

        const objectId = ++this.objectCounter;
        const object = document.createElement('div');
        object.className = 'game-object';
        object.setAttribute('data-id', objectId);
        object.setAttribute('data-rotation', '0');
        object.textContent = emoji;
        object.style.fontSize = '50px';
        object.style.width = '90px';
        object.style.height = '90px';

        const rect = this.gameField.getBoundingClientRect();
        const posX = x - rect.left - 45;
        const posY = y - rect.top - 45;

        object.style.left = `${Math.max(20, posX)}px`;
        object.style.top = `${Math.max(20, posY)}px`;

        // Добавляем панель управления только для хоста
        if (this.isHost) {
            const controls = document.createElement('div');
            controls.className = 'object-controls';
            
            const rotateHandle = document.createElement('div');
            rotateHandle.className = 'rotate-handle';
            rotateHandle.title = 'Зажмите и тяните для вращения';
            
            this.addRotationHandler(object, rotateHandle);
            controls.appendChild(rotateHandle);
            object.appendChild(controls);
        }

        this.makeDraggable(object);
        this.addResizeHandler(object);
        this.gameField.appendChild(object);

        // Отправляем в сеть если это хост
        if (this.isHost && this.network) {
            const objectData = {
                id: objectId,
                emoji: emoji,
                x: parseInt(object.style.left),
                y: parseInt(object.style.top),
                width: 90,
                height: 90,
                fontSize: 50,
                rotation: 0
            };
            this.network.sendGameObjectCreated(objectData);
        }

        return object;
    }

    createRemoteObject(objectData) {
        const object = document.createElement('div');
        object.className = 'game-object';
        object.setAttribute('data-id', objectData.id);
        object.setAttribute('data-rotation', objectData.rotation.toString());
        object.textContent = objectData.emoji;
        object.style.fontSize = `${objectData.fontSize}px`;
        object.style.width = `${objectData.width}px`;
        object.style.height = `${objectData.height}px`;
        object.style.left = `${objectData.x}px`;
        object.style.top = `${objectData.y}px`;
        object.style.transform = `rotate(${objectData.rotation}deg)`;

        this.gameField.appendChild(object);
        this.removePlaceholderIfNeeded();
    }

    updateRemoteObject(objectData) {
        const object = this.gameField.querySelector(`[data-id="${objectData.id}"]`);
        if (object) {
            object.style.left = `${objectData.x}px`;
            object.style.top = `${objectData.y}px`;
            object.style.width = `${objectData.width}px`;
            object.style.height = `${objectData.height}px`;
            object.style.fontSize = `${objectData.fontSize}px`;
            object.style.transform = `rotate(${objectData.rotation}deg)`;
            object.setAttribute('data-rotation', objectData.rotation.toString());
        }
    }

    removeRemoteObject(objectId) {
        const object = this.gameField.querySelector(`[data-id="${objectId}"]`);
        if (object) {
            object.remove();
            this.showPlaceholderIfEmpty();
        }
    }

    // Остальные методы (handleDragStart, handleDragEnd, addRotationHandler, makeDraggable и т.д.)
    // остаются аналогичными предыдущей версии, но с добавлением сетевой синхронизации

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
        this.createGameObject(emoji, e.clientX, e.clientY);
    }

    // ... остальные методы аналогичны предыдущей версии
}

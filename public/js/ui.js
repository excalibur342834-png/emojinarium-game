export class UIManager {
    constructor() {
        this.sectionsContainer = null;
        this.currentExpandedSection = null;
        this.sectionOrder = [];
    }

    initialize(sectionsContainer) {
        this.sectionsContainer = sectionsContainer;
    }

    initSections(emojiCategories, dragHandlers) {
        this.sectionsContainer.innerHTML = '';
        this.sectionOrder = [];
        
        emojiCategories.forEach((category, index) => {
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
            
            const randomEmojis = this.getRandomEmojis(category.emojis, 20);
            
            for (let i = 0; i < 20; i++) {
                const menuItem = document.createElement('div');
                menuItem.className = 'menu-item';
                menuItem.setAttribute('data-type', `emoji-${index}-${i}`);
                menuItem.setAttribute('draggable', 'true');
                menuItem.textContent = randomEmojis[i] || '⬜';
                
                menuItem.addEventListener('dragstart', (e) => {
                    dragHandlers.handleDragStart(e);
                });
                menuItem.addEventListener('dragend', (e) => {
                    dragHandlers.handleDragEnd(e);
                });
                
                sectionContent.appendChild(menuItem);
            }
            
            section.appendChild(sectionHeader);
            section.appendChild(sectionContent);
            this.sectionsContainer.appendChild(section);
        });

        this.sectionsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('section-header')) {
                this.toggleSection(e.target);
            }
        });
    }

    updateSectionsWithRandomEmojis(emojiCategories) {
        const sections = this.sectionsContainer.querySelectorAll('.section');
        sections.forEach((section, index) => {
            const content = section.querySelector('.section-content');
            const menuItems = content.querySelectorAll('.menu-item');
            
            const randomEmojis = this.getRandomEmojis(emojiCategories[index].emojis, 20);
            
            menuItems.forEach((item, itemIndex) => {
                if (itemIndex < randomEmojis.length) {
                    item.textContent = randomEmojis[itemIndex];
                }
            });
        });
    }

    toggleSection(header) {
        const section = header.parentElement;
        const content = header.nextElementSibling;
        const isExpanded = content.classList.contains('expanded');
        const originalIndex = parseInt(section.getAttribute('data-original-index'));
        
        if (this.currentExpandedSection && this.currentExpandedSection !== section) {
            this.closeSection(this.currentExpandedSection);
        }
        
        if (!isExpanded) {
            this.openSection(section, content, header, originalIndex);
        } else {
            this.closeSection(section);
        }
    }

    openSection(section, content, header, originalIndex) {
        content.classList.add('expanded');
        header.classList.remove('collapsed');
        section.classList.add('expanded');
        
        this.sectionsContainer.prepend(section);
        this.currentExpandedSection = section;
        
        setTimeout(() => {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        
        const menuItems = content.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.style.fontSize = '28px';
        });
    }

    closeSection(section) {
        const header = section.querySelector('.section-header');
        const content = section.querySelector('.section-content');
        const originalIndex = parseInt(section.getAttribute('data-original-index'));
        
        content.classList.remove('expanded');
        header.classList.add('collapsed');
        section.classList.remove('expanded');
        this.currentExpandedSection = null;
        
        const allSections = Array.from(this.sectionsContainer.querySelectorAll('.section:not(.expanded)'));
        
        let insertBeforeElement = null;
        for (let i = 0; i < allSections.length; i++) {
            const currentIndex = parseInt(allSections[i].getAttribute('data-original-index'));
            if (currentIndex > originalIndex) {
                insertBeforeElement = allSections[i];
                break;
            }
        }
        
        if (insertBeforeElement) {
            this.sectionsContainer.insertBefore(section, insertBeforeElement);
        } else {
            this.sectionsContainer.appendChild(section);
        }
    }

    initModal(onCreateRoom, onJoinRoom, onStartSingleGame) {
        const modal = document.getElementById('modeModal');
        const modeBtns = document.querySelectorAll('.mode-btn');
        const serverSettings = document.getElementById('serverSettings');
        const startBtn = document.getElementById('startBtn');
        const statusElement = document.getElementById('networkStatus');
        const createRoomBtn = document.getElementById('createRoomBtn');
        const joinRoomBtn = document.getElementById('joinRoomBtn');
        const roomIdInput = document.getElementById('roomId');
        const playerNameInput = document.getElementById('playerName');

        const savedRoomId = localStorage.getItem('lastRoomId');
        if (savedRoomId) {
            roomIdInput.value = savedRoomId;
        }

        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const gameMode = btn.dataset.mode;
                
                if (gameMode === 'network') {
                    serverSettings.classList.add('active');
                    statusElement.textContent = 'Выберите действие...';
                    statusElement.className = 'status-message status-waiting';
                } else {
                    serverSettings.classList.remove('active');
                }
            });
        });

        createRoomBtn.addEventListener('click', async () => {
            const playerName = playerNameInput.value.trim();

            if (!playerName) {
                statusElement.textContent = 'Введите ваше имя!';
                return;
            }

            statusElement.textContent = 'Создаем комнату...';
            createRoomBtn.disabled = true;
            joinRoomBtn.disabled = true;

            try {
                await onCreateRoom(playerName, statusElement);
            } catch (error) {
                statusElement.textContent = 'Ошибка создания комнаты!';
                statusElement.className = 'status-message status-waiting';
                createRoomBtn.disabled = false;
                joinRoomBtn.disabled = false;
            }
        });

        joinRoomBtn.addEventListener('click', async () => {
            const roomId = roomIdInput.value.trim();
            const playerName = playerNameInput.value.trim();

            if (!roomId) {
                statusElement.textContent = 'Введите ID комнаты!';
                return;
            }

            if (!playerName) {
                statusElement.textContent = 'Введите ваше имя!';
                return;
            }

            statusElement.textContent = 'Присоединяемся к комнате...';
            createRoomBtn.disabled = true;
            joinRoomBtn.disabled = true;

            try {
                await onJoinRoom(roomId, playerName, statusElement);
            } catch (error) {
                statusElement.textContent = error.message || 'Не удалось присоединиться! Проверьте ID комнаты.';
                statusElement.className = 'status-message status-waiting';
                createRoomBtn.disabled = false;
                joinRoomBtn.disabled = false;
            }
        });

        startBtn.addEventListener('click', () => {
            const playerName = playerNameInput.value.trim() || 'Игрок';
            onStartSingleGame(playerName);
        });
    }

    showRoomCreated(roomId, statusElement) {
        statusElement.textContent = `Комната создана! ID: ${roomId}`;
        statusElement.className = 'status-message status-connected';
        this.showCopyRoomIdButton(roomId, statusElement);
    }

    showCopyRoomIdButton(roomId, statusElement) {
        const oldBtn = document.querySelector('.copy-room-btn');
        if (oldBtn) {
            oldBtn.remove();
        }

        const copyBtn = document.createElement('button');
        copyBtn.className = 'action-btn copy-room-btn';
        copyBtn.textContent = '📋 Скопировать ID комнаты';
        copyBtn.style.marginTop = '10px';
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(roomId).then(() => {
                statusElement.textContent = 'ID комнаты скопирован!';
                setTimeout(() => {
                    statusElement.textContent = `Комната создана! ID: ${roomId}`;
                }, 2000);
            }).catch(() => {
                const tempInput = document.createElement('input');
                tempInput.value = roomId;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
                statusElement.textContent = 'ID скопирован!';
            });
        });
        
        const actionButtons = document.querySelector('.action-buttons');
        if (actionButtons) {
            actionButtons.parentNode.appendChild(copyBtn);
        }
    }

    initGameControls(onNewMovie, onClearField, onDisconnect, isHost = false) {
        const newMovieBtn = document.getElementById('newMovieBtn');
        const clearFieldBtn = document.getElementById('clearFieldBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');

        newMovieBtn.replaceWith(newMovieBtn.cloneNode(true));
        clearFieldBtn.replaceWith(clearFieldBtn.cloneNode(true));
        disconnectBtn.replaceWith(disconnectBtn.cloneNode(true));

        const newNewMovieBtn = document.getElementById('newMovieBtn');
        const newClearFieldBtn = document.getElementById('clearFieldBtn');
        const newDisconnectBtn = document.getElementById('disconnectBtn');

        if (isHost) {
            newNewMovieBtn.style.display = 'block';
            newClearFieldBtn.style.display = 'block';
            newNewMovieBtn.addEventListener('click', onNewMovie);
            newClearFieldBtn.addEventListener('click', onClearField);
        } else {
            newNewMovieBtn.style.display = 'none';
            newClearFieldBtn.style.display = 'none';
        }

        newDisconnectBtn.addEventListener('click', onDisconnect);
    }

    initChat(onSendMessage) {
        const sendBtn = document.getElementById('sendBtn');
        const chatInput = document.getElementById('chatInput');

        sendBtn.addEventListener('click', () => {
            const message = chatInput.value.trim();
            if (message && onSendMessage) {
                onSendMessage(message);
                chatInput.value = '';
            }
        });

        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const message = chatInput.value.trim();
                if (message && onSendMessage) {
                    onSendMessage(message);
                    chatInput.value = '';
                }
            }
        });
    }

    addChatMessage(sender, message, isSystem = false) {
        const chatMessages = document.getElementById('chatMessages');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isSystem ? 'system' : ''} ${message.includes('угадал') ? 'correct' : ''}`;
        
        const messageHeader = document.createElement('div');
        messageHeader.className = 'message-header';
        messageHeader.textContent = sender;
        
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        messageText.textContent = message;
        
        messageElement.appendChild(messageHeader);
        messageElement.appendChild(messageText);
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    updatePlayersList(players, isHost, onCorrectAnswer) {
        const playersList = document.getElementById('playersList');
        playersList.innerHTML = '';
        
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
            
            if (isHost && !player.isHost && onCorrectAnswer) {
                const correctBtn = document.createElement('button');
                correctBtn.className = 'correct-answer-btn';
                correctBtn.textContent = '✓';
                correctBtn.title = 'Отметить правильный ответ';
                correctBtn.addEventListener('click', () => {
                    onCorrectAnswer(player.id);
                });
                playerElement.appendChild(correctBtn);
            }
            
            playersList.appendChild(playerElement);
        });
    }

    updateMovieDisplay(movie) {
        const movieTitle = document.getElementById('movieTitle');
        const movieYear = document.getElementById('movieYear');
        
        if (movie) {
            movieTitle.textContent = movie.title;
            movieYear.textContent = `Год выпуска: ${movie.year}`;
        }
    }

    showLoading(show) {
        const loadingMovie = document.getElementById('loadingMovie');
        const movieYear = document.getElementById('movieYear');
        
        loadingMovie.style.display = show ? 'block' : 'none';
        movieYear.style.display = show ? 'none' : 'block';
    }

    showScreen(screen) {
        const modal = document.getElementById('modeModal');
        const gameHeader = document.getElementById('gameHeader');
        const gameContainer = document.getElementById('gameContainer');
        const instructions = document.getElementById('instructions');

        if (screen === 'game') {
            modal.style.display = 'none';
            gameHeader.style.display = 'block';
            gameContainer.style.display = 'flex';
            instructions.classList.add('active');
        } else if (screen === 'menu') {
            gameHeader.style.display = 'none';
            gameContainer.style.display = 'none';
            instructions.classList.remove('active');
            modal.style.display = 'flex';
        }
    }

    toggleEmojiMenu(show) {
        const emojiMenu = document.getElementById('emojiMenu');
        if (show) {
            emojiMenu.classList.remove('hidden');
        } else {
            emojiMenu.classList.add('hidden');
        }
    }

    toggleChat(show) {
        const chatSection = document.getElementById('chatSection');
        if (show) {
            chatSection.classList.add('active');
        } else {
            chatSection.classList.remove('active');
        }
    }

    toggleMovieDisplay(show) {
        const movieDisplay = document.getElementById('movieDisplay');
        movieDisplay.style.display = show ? 'block' : 'none';
    }

    getRandomEmojis(emojis, count) {
        const shuffled = [...emojis].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
}

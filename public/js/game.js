export class GameEngine {
    constructor() {
        this.gameField = null;
        this.objectCounter = 0;
        this.gameObjects = new Map();
        this.isRotating = false;
        this.rotationStartAngle = 0;
        this.rotationCurrentAngle = 0;
        
        this.emojiCategories = [
            {
                title: '😊 Эмоции и лица',
                emojis: ['😃','😄','😆','😂','😊','😇','🙂','💀','😉','😌','😍','🥰','😘','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','😣','😖','😫','🥺','😢','😭','😤','😠','😡','🤬','🤕','🤢','🥶','😈']
            },
            {
                title: '👨‍👩‍👧‍👦 Люди и жесты',
                emojis: ['👋','🤚','🖐️','✋','🖖','👌','✌️','🤞','🤟','🤘','🤙','👈','🖕','☝️','👍','👎','👊','✊','🤛','🤝','🙏','✍️','💪']
            },
            {
                title: '🐶 Животные и природа',
                emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐒','🐔','🐤','🐣','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🐢','🐍','🦎','🦖','🐙','🦑']
            },
            {
                title: '🍕 Еда и напитки',
                emojis: ['🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🌽','🥕','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭','🍔','🍟']
            },
            {
                title: '🚗 Транспорт и места',
                emojis: ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🚚','🚛','🚜','🏍️','🛵','🚲','🛴','🛹','🛶','⛵','🚤','🛥️','⛴️','✈️','🛩️','🚁','🚟','🚠','🚡','🛰️','🚀','🛸']
            },
            {
                title: '⚽ Спорт и активность',
                emojis: ['⚽','🏀','🥎','🏐','🏉','🥏','🎿','🏆','🏅','🏸','🎯','🎳','🥊','🥋']
            },
            {
                title: '🔢 Математика и символы',
                emojis: ['➕','➖','✖️','➗','♾️']
            },
            {
                title: '🔷 Геометрия и фигуры',
                emojis: ['🟠','🟣','🟤','🟧','🟨','🟩','🔶','🔺']
            },
            {
                title: '🎵 Музыка и искусство',
                emojis: ['🎵','🎤','🎧','🎷','🎸','🎹','🎺','🎻','🥁','🎭','🎨','🎬','🎮','🎯','🎲','♠️','♥️','♦️','♣️','🃏','🀄','🎭','🖼️','🎨','🧵','🧶','👓','🕶️']
            },
            {
                title: '🌍 Природа и космос',
                emojis: ['🌲','🌳','🌴','🌱','🌿','🍀','🎋','🍃','🍂','🍁','💐','🌷','🌹','🥀','🌺','🌼','🌻','🌜','🌒','🌙','🌎','🪐','💫','⭐','✨','⚡','💥','🔥','☁','🌪','⚡','❄','🌈','☀']
            },
            {
                title: '📚 Образование и офис',
                emojis: ['📚','📖','📕','📒','📜','📄','📑','🔖','🏷️','💰','💵','💳','💎','⚖️','🚪','📁','🗂️','📅','🗓️','📇','📈','📉','📊','📋','📌','📎']
            },
            {
                title: '⚡ Техника и гаджеты',
                emojis: ['📱','☎️','📞','📠','🔋','🔌','🖥️','🖨️','💾','📀','🎥','📺','📸','📹','💡','🔦','🕯️']
            },
            {
                title: '🎉 Праздники и события',
                emojis: ['🎉','🎊','🎂','🍰','🧁','🥧','🍫','🍬','🍭','🍪','🎀','🎁','🎈','🧨','✨','🎐','🎎','🎑','🧧','🪔','🎄','🎋','🎃','🏆','🎪','🎢']
            }
        ];
    }

    initialize(gameFieldElement) {
        this.gameField = gameFieldElement;
    }

    createGameObject(emoji, x, y, isHost = false, network = null) {
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

        const controls = document.createElement('div');
        controls.className = 'object-controls';
        
        const rotateHandle = document.createElement('div');
        rotateHandle.className = 'rotate-handle';
        rotateHandle.title = 'Зажмите и тяните для вращения';
        
        this.addRotationHandler(object, rotateHandle);
        controls.appendChild(rotateHandle);
        object.appendChild(controls);

        if (isHost) {
            this.makeDraggable(object, network);
            this.addResizeHandler(object, network);
        }

        this.gameField.appendChild(object);
        this.gameObjects.set(objectId, object);

        if (isHost && network) {
            const objectData = {
                id: objectId,
                emoji: emoji,
                left: parseInt(object.style.left),
                top: parseInt(object.style.top),
                width: parseInt(object.style.width),
                height: parseInt(object.style.height),
                fontSize: parseInt(object.style.fontSize),
                rotation: 0
            };
            network.sendGameObjectAdded(objectData);
        }

        return object;
    }

    createGameObjectFromData(objectData, isHost = false, network = null) {
        if (this.gameObjects.has(objectData.id)) return;

        const object = document.createElement('div');
        object.className = 'game-object';
        object.setAttribute('data-id', objectData.id);
        object.setAttribute('data-rotation', objectData.rotation);
        object.textContent = objectData.emoji;
        object.style.fontSize = objectData.fontSize + 'px';
        object.style.width = objectData.width + 'px';
        object.style.height = objectData.height + 'px';
        object.style.left = objectData.left + 'px';
        object.style.top = objectData.top + 'px';
        object.style.transform = `rotate(${objectData.rotation}deg)`;

        const placeholder = this.gameField.querySelector('.field-placeholder');
        if (placeholder) {
            placeholder.remove();
        }

        const controls = document.createElement('div');
        controls.className = 'object-controls';
        
        const rotateHandle = document.createElement('div');
        rotateHandle.className = 'rotate-handle';
        rotateHandle.title = 'Зажмите и тяните для вращения';
        
        this.addRotationHandler(object, rotateHandle);
        controls.appendChild(rotateHandle);
        object.appendChild(controls);

        if (isHost) {
            this.makeDraggable(object, network);
            this.addResizeHandler(object, network);
        }

        this.gameField.appendChild(object);
        this.gameObjects.set(objectData.id, object);
    }

    removeGameObject(object, isHost = false, network = null) {
        const objectId = parseInt(object.getAttribute('data-id'));
        object.remove();
        this.gameObjects.delete(objectId);

        if (isHost && network) {
            network.sendGameObjectRemoved(objectId);
        }

        if (this.gameField.querySelectorAll('.game-object').length === 0) {
            this.showPlaceholder();
        }
    }

    clearGameField(isHost = false, network = null) {
        this.gameField.innerHTML = '';
        this.gameObjects.clear();
        this.objectCounter = 0;
        this.showPlaceholder();

        if (isHost && network) {
            network.sendClearGameField();
        }
    }

    addRotationHandler(object, handle) {
        let rotationIndicator = null;

        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            this.isRotating = true;
            handle.classList.add('rotating');
            
            const rect = object.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            this.rotationStartAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
            this.rotationCurrentAngle = parseInt(object.getAttribute('data-rotation')) || 0;
            
            rotationIndicator = document.createElement('div');
            rotationIndicator.className = 'rotation-indicator';
            rotationIndicator.textContent = `${this.rotationCurrentAngle}°`;
            object.appendChild(rotationIndicator);

            const handleMouseMove = (moveEvent) => {
                if (!this.isRotating) return;
                
                const currentAngle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX) * (180 / Math.PI);
                const angleDiff = currentAngle - this.rotationStartAngle;
                const newRotation = (this.rotationCurrentAngle + angleDiff) % 360;
                
                object.setAttribute('data-rotation', newRotation.toString());
                object.style.transform = `rotate(${newRotation}deg)`;
                
                if (rotationIndicator) {
                    rotationIndicator.textContent = `${Math.round(newRotation)}°`;
                }
            };

            const handleMouseUp = () => {
                this.isRotating = false;
                handle.classList.remove('rotating');
                
                if (rotationIndicator && rotationIndicator.parentElement) {
                    rotationIndicator.remove();
                }
                
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });
    }

    makeDraggable(element, network = null) {
        let isDragging = false;
        let offsetX, offsetY;

        element.addEventListener('mousedown', (e) => {
            if (e.button !== 0 || e.target.classList.contains('rotate-handle')) return;

            isDragging = true;
            element.classList.add('dragging');

            const rect = element.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const rect = this.gameField.getBoundingClientRect();
            let x = e.clientX - rect.left - offsetX;
            let y = e.clientY - rect.top - offsetY;

            x = Math.max(0, Math.min(x, rect.width - element.offsetWidth));
            y = Math.max(0, Math.min(y, rect.height - element.offsetHeight));

            element.style.left = `${x}px`;
            element.style.top = `${y}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.classList.remove('dragging');
                
                if (network) {
                    const objectData = {
                        id: parseInt(element.getAttribute('data-id')),
                        emoji: element.textContent,
                        left: parseInt(element.style.left),
                        top: parseInt(element.style.top),
                        width: parseInt(element.style.width),
                        height: parseInt(element.style.height),
                        fontSize: parseInt(element.style.fontSize),
                        rotation: parseInt(element.getAttribute('data-rotation')) || 0
                    };
                    network.sendGameObjectUpdated(objectData);
                }
            }
        });
    }

    addResizeHandler(element, network = null) {
        let resizeIndicator = null;

        element.addEventListener('mouseenter', () => {
            resizeIndicator = document.createElement('div');
            resizeIndicator.className = 'size-indicator';
            resizeIndicator.textContent = `${parseInt(element.style.width)}px`;
            element.appendChild(resizeIndicator);
        });

        element.addEventListener('mouseleave', () => {
            if (resizeIndicator && resizeIndicator.parentElement) {
                resizeIndicator.remove();
            }
        });

        element.addEventListener('wheel', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const currentWidth = parseInt(element.style.width) || 90;
            const currentHeight = parseInt(element.style.height) || 90;
            const currentFontSize = parseInt(element.style.fontSize) || 50;

            const delta = e.deltaY > 0 ? -10 : 10;
            const newWidth = Math.max(40, Math.min(300, currentWidth + delta));
            const newHeight = Math.max(40, Math.min(300, currentHeight + delta));
            const newFontSize = Math.max(20, Math.min(120, currentFontSize + delta * 0.5));

            element.style.width = `${newWidth}px`;
            element.style.height = `${newHeight}px`;
            element.style.fontSize = `${newFontSize}px`;

            if (resizeIndicator) {
                resizeIndicator.textContent = `${newWidth}px`;
            }

            if (network) {
                const objectData = {
                    id: parseInt(element.getAttribute('data-id')),
                    emoji: element.textContent,
                    left: parseInt(element.style.left),
                    top: parseInt(element.style.top),
                    width: newWidth,
                    height: newHeight,
                    fontSize: newFontSize,
                    rotation: parseInt(element.getAttribute('data-rotation')) || 0
                };
                network.sendGameObjectUpdated(objectData);
            }
        });
    }

    showPlaceholder() {
        const placeholder = document.createElement('div');
        placeholder.className = 'field-placeholder';
        placeholder.innerHTML = `
            <div class="icon">🎬</div>
            <div>Перетащите эмодзи сюда, чтобы составить сцену из фильма!</div>
        `;
        this.gameField.appendChild(placeholder);
    }

    getRandomEmojis(emojis, count) {
        const shuffled = [...emojis].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
}

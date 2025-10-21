/**
 * SISTEMA DE INTERFAZ DE USUARIO - CID DEFENDER
 * Gestión de UI, controles visuales e integración de módulos
 */

class UIManager {
    constructor() {
        this.isInitialized = false;
        this.activeModals = new Set();
        this.towerSelectionActive = false;
        this.selectedTower = null;
    }

    /**
     * INICIALIZACIÓN DEL SISTEMA DE UI
     */
    init() {
        if (this.isInitialized) return;

        this.setupEventListeners();
        this.setupTowerUI();
        this.setupGameEventHandlers();
        
        this.isInitialized = true;
        utils.log('Sistema de UI inicializado');
    }

    setupEventListeners() {
        // Event listeners básicos ya están en game.js
        // Aquí agregamos listeners específicos de UI
        this.setupKeyboardShortcuts();
        this.setupMobileControls();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Solo procesar si estamos en juego
            if (game.currentState !== GAME_STATES.PLAYING) return;

            switch(e.key) {
                case '1':
                    this.selectTower('firewall');
                    break;
                case '2':
                    this.selectTower('encryption');
                    break;
                case '3':
                    this.selectTower('ids');
                    break;
                case '4':
                    this.selectTower('antivirus');
                    break;
                case 'Escape':
                    this.deselectTower();
                    break;
            }
        });
    }

    setupMobileControls() {
        // Para dispositivos táctiles, agregar controles específicos
        if ('ontouchstart' in window) {
            this.setupTouchControls();
        }
    }

    setupTouchControls() {
        const gameArea = document.getElementById('gameScreen');
        
        // Doble tap para construir torre
        let lastTap = 0;
        gameArea.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 500 && tapLength > 0) {
                // Doble tap detectado
                this.handleDoubleTap(e);
                e.preventDefault();
            }
            lastTap = currentTime;
        });
    }

    /**
     * SISTEMA DE CONSTRUCCIÓN DE TORRES
     */
    setupTowerUI() {
        this.createTowerSelectionPanel();
        this.createTowerInfoPanel();
    }

    createTowerSelectionPanel() {
        // Panel flotante para selección de torres
        const towerPanel = utils.createElement('div', {
            id: 'towerSelectionPanel',
            className: 'tower-panel'
        });

        const towerTypes = Object.values(towerManager.towerTypes);
        
        towerTypes.forEach((towerType, index) => {
            const config = towerManager.towerConfigs[towerType];
            const towerButton = utils.createElement('div', {
                className: 'tower-button',
                'data-tower-type': towerType
            }, [
                utils.createElement('div', { className: 'tower-icon' }, [this.getTowerIcon(towerType)]),
                utils.createElement('div', { className: 'tower-name' }, [config.name]),
                utils.createElement('div', { className: 'tower-cost' }, [`${config.cost} pts`]),
                utils.createElement('div', { className: 'tower-hotkey' }, [`${index + 1}`])
            ]);

            towerButton.addEventListener('click', () => this.selectTower(towerType));
            towerPanel.appendChild(towerButton);
        });

        document.getElementById('gameScreen').appendChild(towerPanel);
    }

    createTowerInfoPanel() {
        // Panel de información de torre seleccionada
        const infoPanel = utils.createElement('div', {
            id: 'towerInfoPanel',
            className: 'tower-info-panel hidden'
        });

        document.getElementById('gameScreen').appendChild(infoPanel);
    }

    selectTower(towerType) {
        if (towerManager.availableTowers.includes(towerType)) {
            towerManager.selectTowerType(towerType);
            this.towerSelectionActive = true;
            this.showTowerSelectionFeedback(towerType);
            utils.log(`Torre ${towerType} seleccionada para construcción`);
        } else {
            this.showMessage('Esta torre no está disponible aún', 'warning');
        }
    }

    deselectTower() {
        towerManager.selectedTowerType = null;
        this.towerSelectionActive = false;
        this.selectedTower = null;
        this.hideTowerInfoPanel();
    }

    showTowerSelectionFeedback(towerType) {
        const config = towerManager.towerConfigs[towerType];
        this.showMessage(`Seleccionado: ${config.name} - ${config.cost} puntos`, 'info');
    }

    /**
     * MANEJO DE CONSTRUCCIÓN EN CANVAS
     */
    handleCanvasClick(event) {
        if (game.currentState !== GAME_STATES.PLAYING) return;

        const rect = game.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (this.towerSelectionActive && towerManager.selectedTowerType) {
            this.attemptBuildTower(x, y);
        } else {
            this.handleTowerSelection(x, y);
        }
    }

    handleDoubleTap(event) {
        // Para móviles: doble tap en posición vacía muestra panel de torres
        const rect = game.canvas.getBoundingClientRect();
        const x = event.changedTouches[0].clientX - rect.left;
        const y = event.changedTouches[0].clientY - rect.top;

        if (!this.isTowerAtPosition(x, y)) {
            this.toggleTowerSelectionPanel();
        }
    }

    attemptBuildTower(x, y) {
        const config = towerManager.getSelectedTowerConfig();
        
        if (!config) return;

        // Verificar si puede construir
        if (towerManager.canBuildTower(game.score, x, y, game.towers)) {
            // Construir torre
            const tower = towerManager.buildTower(x, y, game.projectiles);
            if (tower) {
                game.towers.push(tower);
                game.score -= config.cost;
                this.showMessage(`Torre construida: -${config.cost} puntos`, 'success');
                this.playSound('build');
            }
        } else {
            this.showMessage('No se puede construir aquí o puntos insuficientes', 'error');
            this.playSound('error');
        }

        this.deselectTower();
    }

    handleTowerSelection(x, y) {
        // Verificar si hicieron click en una torre existente
        const clickedTower = game.towers.find(tower => 
            utils.distance(x, y, tower.x, tower.y) <= tower.radius
        );

        if (clickedTower) {
            this.selectExistingTower(clickedTower);
        } else {
            this.deselectTower();
        }
    }

    selectExistingTower(tower) {
        this.selectedTower = tower;
        this.showTowerInfoPanel(tower);
    }

    isTowerAtPosition(x, y) {
        return game.towers.some(tower => 
            utils.distance(x, y, tower.x, tower.y) <= tower.radius
        );
    }

    /**
     * PANEL DE INFORMACIÓN DE TORRES
     */
    showTowerInfoPanel(tower) {
        const infoPanel = document.getElementById('towerInfoPanel');
        const towerInfo = tower.getInfo();

        infoPanel.innerHTML = `
            <div class="tower-info-header">
                <h3>${towerInfo.name} Nivel ${towerInfo.level}</h3>
                <button class="close-btn" onclick="ui.hideTowerInfoPanel()">×</button>
            </div>
            <div class="tower-info-stats">
                <div class="stat">
                    <span>Daño:</span>
                    <span>${towerInfo.damage}</span>
                </div>
                <div class="stat">
                    <span>Rango:</span>
                    <span>${Math.round(towerInfo.range)}</span>
                </div>
                <div class="stat">
                    <span>Velocidad de Ataque:</span>
                    <span>${towerInfo.fireRate.toFixed(1)}/s</span>
                </div>
                <div class="stat">
                    <span>Habilidad:</span>
                    <span>${towerInfo.special}</span>
                </div>
            </div>
            <div class="tower-info-description">
                ${towerInfo.description}
            </div>
            <div class="tower-info-actions">
                <button class="upgrade-btn" onclick="ui.upgradeTower()" 
                        ${game.score < towerInfo.upgradeCost ? 'disabled' : ''}>
                    Mejorar (${towerInfo.upgradeCost} pts)
                </button>
                <button class="sell-btn" onclick="ui.sellTower()">
                    Vender (${Math.floor(towerManager.getTowerCost(tower.type) * 0.7)} pts)
                </button>
            </div>
        `;

        infoPanel.classList.remove('hidden');
    }

    hideTowerInfoPanel() {
        const infoPanel = document.getElementById('towerInfoPanel');
        infoPanel.classList.add('hidden');
        this.selectedTower = null;
    }

    upgradeTower() {
        if (!this.selectedTower) return;

        const upgradeCost = this.selectedTower.upgradeCost;
        
        if (game.score >= upgradeCost) {
            if (this.selectedTower.upgrade()) {
                game.score -= upgradeCost;
                this.showMessage(`Torre mejorada a nivel ${this.selectedTower.level}`, 'success');
                this.playSound('upgrade');
                this.showTowerInfoPanel(this.selectedTower); // Actualizar panel
            }
        } else {
            this.showMessage('Puntos insuficientes para mejorar', 'warning');
        }
    }

    sellTower() {
        if (!this.selectedTower) return;

        const sellValue = Math.floor(towerManager.getTowerCost(this.selectedTower.type) * 0.7);
        const towerIndex = game.towers.indexOf(this.selectedTower);
        
        if (towerIndex > -1) {
            game.towers.splice(towerIndex, 1);
            game.score += sellValue;
            this.showMessage(`Torre vendida: +${sellValue} puntos`, 'info');
            this.playSound('sell');
            this.hideTowerInfoPanel();
        }
    }

    /**
     * SISTEMA DE MENSAJES Y NOTIFICACIONES
     */
    showMessage(text, type = 'info') {
        const message = utils.createElement('div', {
            className: `message message-${type}`
        }, [text]);

        // Agregar al contenedor de mensajes
        let messageContainer = document.getElementById('messageContainer');
        if (!messageContainer) {
            messageContainer = utils.createElement('div', {
                id: 'messageContainer',
                className: 'message-container'
            });
            document.getElementById('gameScreen').appendChild(messageContainer);
        }

        messageContainer.appendChild(message);

        // Animación de entrada
        setTimeout(() => message.classList.add('show'), 10);

        // Auto-remover después de 3 segundos
        setTimeout(() => {
            message.classList.remove('show');
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 300);
        }, 3000);
    }

    showGameMessage(title, message, type = 'info') {
        const modal = utils.createElement('div', {
            className: `game-modal modal-${type}`
        }, [
            utils.createElement('div', { className: 'modal-header' }, [
                utils.createElement('h3', {}, [title])
            ]),
            utils.createElement('div', { className: 'modal-content' }, [
                utils.createElement('p', {}, [message])
            ]),
            utils.createElement('div', { className: 'modal-actions' }, [
                utils.createElement('button', { 
                    className: 'modal-btn',
                    onclick: () => this.closeModal(modal)
                }, ['Aceptar'])
            ])
        ]);

        document.body.appendChild(modal);
        this.activeModals.add(modal);

        // Animación de entrada
        setTimeout(() => modal.classList.add('show'), 10);
    }

    closeModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            this.activeModals.delete(modal);
        }, 300);
    }

    /**
     * SISTEMA DE SONIDOS
     */
    playSound(soundName) {
        // Sistema básico de sonidos - se puede expandir
        const sounds = {
            build: new Audio('assets/sounds/build.mp3'),
            upgrade: new Audio('assets/sounds/upgrade.mp3'),
            sell: new Audio('assets/sounds/sell.mp3'),
            error: new Audio('assets/sounds/error.mp3'),
            correct: new Audio('assets/sounds/correct.mp3'),
            wrong: new Audio('assets/sounds/wrong.mp3')
        };

        const sound = sounds[soundName];
        if (sound) {
            sound.volume = 0.3;
            sound.play().catch(e => {
                // Silenciar errores de audio (navegadores pueden bloquear autoplay)
                utils.log(`Audio error: ${e.message}`);
            });
        }
    }

    /**
     * ACTUALIZACIÓN DE UI DURANTE EL JUEGO
     */
    updateGameUI() {
        this.updateTowerButtons();
        this.updateScoreDisplay();
        this.updateWaveProgress();
    }

    updateTowerButtons() {
        const towerButtons = document.querySelectorAll('.tower-button');
        
        towerButtons.forEach(button => {
            const towerType = button.dataset.towerType;
            const config = towerManager.towerConfigs[towerType];
            const costElement = button.querySelector('.tower-cost');
            const isAvailable = towerManager.availableTowers.includes(towerType);
            const canAfford = game.score >= config.cost;

            // Actualizar estado visual del botón
            button.classList.toggle('available', isAvailable);
            button.classList.toggle('affordable', isAvailable && canAfford);
            button.classList.toggle('unavailable', !isAvailable);
            button.classList.toggle('too-expensive', isAvailable && !canAfford);

            // Actualizar texto de costo
            if (costElement) {
                costElement.textContent = `${config.cost} pts`;
                costElement.style.color = canAfford ? '#10b981' : '#ef4444';
            }
        });
    }

    updateScoreDisplay() {
        const scoreElement = document.getElementById('scoreValue');
        if (scoreElement) {
            scoreElement.textContent = game.score;
            // Efecto visual cuando cambia el score
            scoreElement.classList.add('score-update');
            setTimeout(() => scoreElement.classList.remove('score-update'), 500);
        }
    }

    updateWaveProgress() {
        const waveElement = document.getElementById('waveValue');
        if (waveElement) {
            waveElement.textContent = game.currentWave;
        }

        // Barra de progreso de oleada (opcional)
        const progressElement = document.querySelector('.wave-progress');
        if (progressElement) {
            const progress = (game.waveTimer / (game.config.waveInterval / 1000)) * 100;
            progressElement.style.width = `${progress}%`;
        }
    }

    /**
     * MANEJO DE EVENTOS DEL JUEGO
     */
    setupGameEventHandlers() {
        // Escuchar eventos personalizados del juego
        document.addEventListener('gameScoreUpdate', () => this.updateScoreDisplay());
        document.addEventListener('gameWaveUpdate', () => this.updateWaveProgress());
        document.addEventListener('towerUnlocked', (e) => this.onTowerUnlocked(e.detail));
        document.addEventListener('gamePaused', () => this.onGamePaused());
        document.addEventListener('gameResumed', () => this.onGameResumed());
    }

    onTowerUnlocked(towerType) {
        towerManager.addAvailableTower(towerType);
        this.showMessage(`¡Nueva torre desbloqueada: ${towerManager.towerConfigs[towerType].name}!`, 'success');
        this.playSound('build');
    }

    onGamePaused() {
        this.showMessage('Juego en pausa', 'info');
    }

    onGameResumed() {
        this.showMessage('Juego reanudado', 'info');
    }

    /**
     * UTILIDADES VISUALES
     */
    getTowerIcon(towerType) {
        const icons = {
            firewall: '🛡️',
            encryption: '🔒',
            ids: '👁️',
            antivirus: '💊'
        };
        return icons[towerType] || '⚙️';
    }

    toggleTowerSelectionPanel() {
        const panel = document.getElementById('towerSelectionPanel');
        panel.classList.toggle('hidden');
    }

    /**
     * LIMPIEZA Y RESET
     */
    cleanup() {
        this.activeModals.forEach(modal => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        });
        this.activeModals.clear();
        this.deselectTower();
    }
}

// Instancia global del manager de UI
const ui = new UIManager();

// Inicializar UI cuando el DOM esté listo
window.addEventListener('DOMContentLoaded', () => {
    ui.init();
});

// Tests de desarrollo
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    ui.runTests = function() {
        console.log('=== TESTING UI System ===');

        // Test inicialización
        console.log('✅ UI initialized:', this.isInitialized === true);

        // Test sistema de mensajes
        this.showMessage('Test message', 'info');
        console.log('✅ Message system: Message shown');

        // Test selección de torres
        this.selectTower('firewall');
        console.log('✅ Tower selection:', towerManager.selectedTowerType === 'firewall');

        // Test panel de información
        const testTower = new Tower({
            type: 'firewall',
            x: 300, y: 300,
            damage: 15, range: 120, fireRate: 1.0,
            color: '#3b82f6', radius: 20,
            projectileColor: '#60a5fa', special: null
        });
        
        this.showTowerInfoPanel(testTower);
        const infoPanel = document.getElementById('towerInfoPanel');
        console.log('✅ Tower info panel:', !infoPanel.classList.contains('hidden'));

        // Limpiar después de tests
        this.hideTowerInfoPanel();
        this.deselectTower();
    };
}
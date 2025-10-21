/**
 * SISTEMA DE INTERFAZ RENOVADO - CID DEFENDER
 * UI para la nueva mecánica de juego
 */

class UIManager {
    constructor() {
        this.isInitialized = false;
        this.activeModals = new Set();
        this.selectedTower = null;
        this.towerPanelVisible = true;
    }

    init() {
        if (this.isInitialized) return;

        this.setupEventListeners();
        this.createTowerSelectionPanel();
        this.createTowerInfoPanel();
        this.setupGameEventHandlers();
        
        this.isInitialized = true;
        console.log('✅ Sistema de UI inicializado');
    }

    setupEventListeners() {
        this.setupKeyboardShortcuts();
        this.setupMobileControls();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (!window.game || game.currentState !== GAME_STATES.PLAYING) return;

            switch(e.key) {
                case '1': this.selectTower('firewall'); break;
                case '2': this.selectTower('encryption'); break;
                case '3': this.selectTower('ids'); break;
                case '4': this.selectTower('antivirus'); break;
                case 'Escape': this.deselectTower(); break;
                case ' ': this.toggleTowerPanel(); break;
                case 's': this.toggleStatsPanel(); break;
            }
        });
    }

    setupMobileControls() {
        if ('ontouchstart' in window) {
            this.setupTouchControls();
        }
    }

    setupTouchControls() {
        const gameArea = document.getElementById('gameScreen');
        
        let lastTap = 0;
        gameArea.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 500 && tapLength > 0) {
                this.toggleTowerPanel();
                e.preventDefault();
            }
            lastTap = currentTime;
        });
    }

    createTowerSelectionPanel() {
        // Crear panel de selección de torres si no existe
        let towerPanel = document.getElementById('towerSelectionPanel');
        if (!towerPanel) {
            towerPanel = document.createElement('div');
            towerPanel.id = 'towerSelectionPanel';
            towerPanel.className = 'tower-panel';
            document.getElementById('gameScreen').appendChild(towerPanel);
        }

        this.updateTowerButtons();
    }

    updateTowerButtons() {
        const towerPanel = document.getElementById('towerSelectionPanel');
        if (!towerPanel || !towerManager) return;

        towerPanel.innerHTML = '';

        const towerTypes = ['firewall', 'encryption', 'ids', 'antivirus'];
        
        towerTypes.forEach((towerType, index) => {
            const config = towerManager.towerConfigs[towerType];
            if (!config) return;

            const isAvailable = towerManager.availableTowers.includes(towerType);
            const canAfford = window.game && window.game.score >= config.cost;
            
            const towerButton = document.createElement('div');
            towerButton.className = `tower-button ${isAvailable ? 'available' : 'unavailable'} ${isAvailable && canAfford ? 'affordable' : ''}`;
            towerButton.dataset.towerType = towerType;

            towerButton.innerHTML = `
                <div class="tower-icon">${config.icon}</div>
                <div class="tower-name">${config.name}</div>
                <div class="tower-cost">${config.cost} pts</div>
                <div class="tower-hotkey">${index + 1}</div>
            `;

            if (isAvailable) {
                towerButton.addEventListener('click', () => this.selectTower(towerType));
            }

            towerPanel.appendChild(towerButton);
        });

        console.log('🔄 Botones de torres actualizados');
    }

    createTowerInfoPanel() {
        let infoPanel = document.getElementById('towerInfoPanel');
        if (!infoPanel) {
            infoPanel = document.createElement('div');
            infoPanel.id = 'towerInfoPanel';
            infoPanel.className = 'tower-info-panel hidden';
            document.getElementById('gameScreen').appendChild(infoPanel);
        }
    }

    selectTower(towerType) {
        console.log(`🎯 Seleccionando torre: ${towerType}`);
        
        if (towerManager.availableTowers.includes(towerType)) {
            const success = towerManager.selectTowerType(towerType);
            if (success) {
                this.showMessage(`Seleccionado: ${towerManager.towerConfigs[towerType].name}`, 'info');
                console.log(`✅ Torre ${towerType} seleccionada`);
            }
        } else {
            this.showMessage('Esta torre no está disponible aún', 'warning');
            console.log(`❌ Torre ${towerType} no disponible`);
        }
    }

    deselectTower() {
        towerManager.selectedTowerType = null;
        this.selectedTower = null;
        this.hideTowerInfoPanel();
        console.log('🎯 Torre deseleccionada');
    }

    showTowerInfoPanel(tower) {
        this.selectedTower = tower;
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
                    <span>${towerInfo.range}</span>
                </div>
                <div class="stat">
                    <span>Velocidad:</span>
                    <span>${towerInfo.fireRate}/s</span>
                </div>
                <div class="stat">
                    <span>Habilidad:</span>
                    <span>${towerInfo.special}</span>
                </div>
                <div class="stat">
                    <span>Próximo nivel:</span>
                    <span>${towerInfo.nextLevel}</span>
                </div>
            </div>
            <div class="tower-info-description">
                ${towerInfo.description}
            </div>
            <div class="tower-info-actions">
                <button class="upgrade-btn" onclick="ui.upgradeTower()" 
                        ${window.game && window.game.score < towerInfo.upgradeCost ? 'disabled' : ''}>
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
        if (!this.selectedTower || !window.game) return;

        const upgradeCost = this.selectedTower.upgradeCost;
        
        if (game.score >= upgradeCost) {
            if (this.selectedTower.upgrade()) {
                game.score -= upgradeCost;
                this.showMessage(`Torre mejorada a nivel ${this.selectedTower.level}`, 'success');
                this.showTowerInfoPanel(this.selectedTower); // Actualizar panel
            }
        } else {
            this.showMessage('Puntos insuficientes para mejorar', 'warning');
        }
    }

    sellTower() {
        if (!this.selectedTower || !window.game) return;

        const sellValue = Math.floor(towerManager.getTowerCost(this.selectedTower.type) * 0.7);
        const towerIndex = game.towers.indexOf(this.selectedTower);
        
        if (towerIndex > -1) {
            game.towers.splice(towerIndex, 1);
            game.score += sellValue;
            this.showMessage(`Torre vendida: +${sellValue} puntos`, 'info');
            this.hideTowerInfoPanel();
        }
    }

    showMessage(text, type = 'info') {
        // Crear contenedor de mensajes si no existe
        let messageContainer = document.getElementById('messageContainer');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'messageContainer';
            messageContainer.className = 'message-container';
            document.getElementById('gameScreen').appendChild(messageContainer);
        }

        const message = document.createElement('div');
        message.className = `message message-${type} message-pop`;
        message.textContent = text;

        messageContainer.appendChild(message);

        // Auto-remover después de 3 segundos
        setTimeout(() => {
            message.classList.remove('message-pop');
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 300);
        }, 3000);
    }

    updateGameUI() {
        this.updateTowerButtons();
        this.updateScoreDisplay();
        this.updateWaveProgress();
        this.updateStatsDisplay();
    }

    updateScoreDisplay() {
        const scoreElement = document.getElementById('scoreValue');
        if (scoreElement && window.game) {
            scoreElement.textContent = game.score;
            scoreElement.classList.add('score-update');
            setTimeout(() => scoreElement.classList.remove('score-update'), 500);
        }
    }

    updateWaveProgress() {
        const waveElement = document.getElementById('waveValue');
        if (waveElement && window.game) {
            // NUEVO: Mostrar progreso de oleadas (actual/máximo)
            const maxWaves = game.config?.maxWaves || 10;
            waveElement.textContent = `${game.currentWave}/${maxWaves}`;
            
            // Efecto visual cuando avanza oleada
            if (game.currentWave > 0) {
                waveElement.classList.add('score-update');
                setTimeout(() => waveElement.classList.remove('score-update'), 1000);
            }
        }
    }

    updateStatsDisplay() {
        if (!window.game) return;

        const { stats } = window.game;
        
        // Actualizar elementos en el top-bar
        const correctElement = document.getElementById('correctAnswers');
        const wrongElement = document.getElementById('wrongAnswers');
        const accuracyElement = document.getElementById('accuracyRate');
        
        if (correctElement) correctElement.textContent = stats.correctAnswers;
        if (wrongElement) wrongElement.textContent = stats.wrongAnswers;
        if (accuracyElement) accuracyElement.textContent = `${stats.accuracy}%`;

        // Actualizar elementos en pantalla de pausa
        const pauseCorrect = document.getElementById('pauseCorrect');
        const pauseWrong = document.getElementById('pauseWrong');
        const pauseAccuracy = document.getElementById('pauseAccuracy');
        
        if (pauseCorrect) pauseCorrect.textContent = stats.correctAnswers;
        if (pauseWrong) pauseWrong.textContent = stats.wrongAnswers;
        if (pauseAccuracy) pauseAccuracy.textContent = `${stats.accuracy}%`;

        // Actualizar elementos en pantalla de pregunta
        const questionCorrect = document.getElementById('questionCorrect');
        const questionWrong = document.getElementById('questionWrong');
        const questionAccuracy = document.getElementById('questionAccuracy');
        
        if (questionCorrect) questionCorrect.textContent = stats.correctAnswers;
        if (questionWrong) questionWrong.textContent = stats.wrongAnswers;
        if (questionAccuracy) questionAccuracy.textContent = `${stats.accuracy}%`;
    }

    setupGameEventHandlers() {
        // Escuchar eventos personalizados del juego
        document.addEventListener('gameScoreUpdate', () => this.updateScoreDisplay());
        document.addEventListener('gameWaveUpdate', () => this.updateWaveProgress());
        document.addEventListener('gameStatsUpdate', () => this.updateStatsDisplay());
        document.addEventListener('towerUnlocked', (e) => this.onTowerUnlocked(e.detail));
        
        // NUEVO: Evento para notificar nueva oleada
        document.addEventListener('gameNewWave', (e) => this.onNewWave(e.detail));
    }

    onTowerUnlocked(towerType) {
        towerManager.addAvailableTower(towerType);
        this.showMessage(`¡Nueva torre desbloqueada: ${towerManager.towerConfigs[towerType].name}!`, 'success');
        this.updateTowerButtons();
    }

    // NUEVO: Manejar notificación de nueva oleada
    onNewWave(waveInfo) {
        const enemiesPerDefensor = Math.min(waveInfo.waveNumber, 3);
        this.showMessage(
            `¡Oleada ${waveInfo.waveNumber}! ${enemiesPerDefensor} enemigos por defensor`, 
            'warning'
        );
    }

    toggleTowerPanel() {
        const panel = document.getElementById('towerSelectionPanel');
        if (panel) {
            this.towerPanelVisible = !this.towerPanelVisible;
            panel.style.display = this.towerPanelVisible ? 'flex' : 'none';
        }
    }

    toggleStatsPanel() {
        // Función para alternar visibilidad del panel de estadísticas
        const statsPanel = document.querySelector('.top-bar .stats');
        if (statsPanel) {
            const isVisible = statsPanel.style.display !== 'none';
            statsPanel.style.display = isVisible ? 'none' : 'block';
            this.showMessage(isVisible ? 'Estadísticas ocultas' : 'Estadísticas visibles', 'info');
        }
    }

    showGameMessage(title, message, type = 'info') {
        const modal = document.createElement('div');
        modal.className = `game-modal modal-${type}`;
        
        modal.innerHTML = `
            <div class="modal-header">
                <h3>${title}</h3>
            </div>
            <div class="modal-content">
                <p>${message}</p>
            </div>
            <div class="modal-actions">
                <button class="modal-btn" onclick="ui.closeModal(this.parentNode.parentNode)">Aceptar</button>
            </div>
        `;

        document.body.appendChild(modal);
        this.activeModals.add(modal);

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
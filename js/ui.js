/**
 * SISTEMA DE INTERFAZ RENOVADO - CID DEFENDER
 * UI para la nueva mecánica de juego con balance de vida
 */

class UIManager {
    constructor() {
        this.isInitialized = false;
        this.activeModals = new Set();
        this.selectedTower = null;
        this.towerPanelVisible = true;
        this.statsPanelVisible = true;
    }

    init() {
        if (this.isInitialized) return;

        this.setupEventListeners();
        this.createTowerSelectionPanel();
        this.createTowerInfoPanel();
        this.createHealthInfoPanel(); // NUEVO: Panel de información de salud
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
                case 'h': this.toggleHealthPanel(); break; // NUEVO: Alternar panel de salud
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

    // NUEVO: Panel de información de salud de defensores
    createHealthInfoPanel() {
        let healthPanel = document.getElementById('healthInfoPanel');
        if (!healthPanel) {
            healthPanel = document.createElement('div');
            healthPanel.id = 'healthInfoPanel';
            healthPanel.className = 'health-info-panel';
            document.getElementById('gameScreen').appendChild(healthPanel);
        }

        this.updateHealthInfo();
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

    // NUEVO: Actualizar información de salud de defensores
    updateHealthInfo() {
        const healthPanel = document.getElementById('healthInfoPanel');
        if (!healthPanel || !window.game) return;

        const { defensores, currentWave } = window.game;
        
        let healthHTML = `
            <div class="health-header">
                <h4>💚 Estado Defensores</h4>
                <small>Oleada ${currentWave}</small>
            </div>
            <div class="health-stats">
        `;

        Object.values(defensores).forEach(defensor => {
            const healthPercent = (defensor.salud / defensor.maxSalud) * 100;
            const isMuerto = defensor.salud <= 0;
            const healthStatus = isMuerto ? 'dead' : healthPercent > 60 ? 'healthy' : healthPercent > 30 ? 'warning' : 'critical';
            
            healthHTML += `
                <div class="defensor-health ${healthStatus}">
                    <div class="defensor-name ${isMuerto ? 'dead-name' : ''}">${defensor.nombre} ${isMuerto ? '💀' : ''}</div>
                    <div class="health-bar">
                        <div class="health-fill" style="width: ${isMuerto ? 0 : healthPercent}%"></div>
                    </div>
                    <div class="health-numbers">${isMuerto ? 'COMPROMETIDO' : `${defensor.salud}/${defensor.maxSalud}`}</div>
                    <div class="health-percent">${isMuerto ? '0%' : Math.round(healthPercent)}%</div>
                </div>
            `;
        });

        healthHTML += `</div>`;
        healthPanel.innerHTML = healthHTML;
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
        this.updateHealthInfo(); // NUEVO: Actualizar información de salud
        this.updateDefensorHealthBars(); // NUEVO: Actualizar barras de salud en UI principal
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

    // NUEVO: Actualizar barras de salud de defensores en la UI principal
    updateDefensorHealthBars() {
        if (!window.game) return;

        const { defensores } = window.game;
        
        Object.keys(defensores).forEach(key => {
            const defensor = defensores[key];
            const pilarElement = document.getElementById(`pilar-${key.charAt(0).toLowerCase()}`);
            
            if (pilarElement) {
                const bar = pilarElement.querySelector('.pilar-bar');
                const healthText = pilarElement.querySelector('.health-text');
                const defensorName = pilarElement.querySelector('span');
                
                if (bar) {
                    const percent = (defensor.salud / defensor.maxSalud) * 100;
                    const isMuerto = defensor.salud <= 0;
                    
                    bar.style.width = `${isMuerto ? 0 : percent}%`;
                    
                    // Colores según porcentaje de salud o estado muerto
                    if (isMuerto) {
                        bar.style.background = '#6b7280';
                        bar.style.opacity = '0.5';
                        if (defensorName) {
                            defensorName.style.color = '#ef4444';
                            defensorName.style.textDecoration = 'line-through';
                        }
                    } else if (percent > 60) {
                        bar.style.background = '#10b981';
                    } else if (percent > 30) {
                        bar.style.background = '#f59e0b';
                    } else {
                        bar.style.background = '#ef4444';
                    }
                }
                
                // NUEVO: Agregar texto de salud si no existe
                if (!healthText && pilarElement) {
                    const healthElement = document.createElement('div');
                    healthElement.className = 'health-text';
                    healthElement.style.cssText = `
                        font-size: 10px;
                        color: #d1d5db;
                        margin-top: 2px;
                    `;
                    pilarElement.appendChild(healthElement);
                }
                
                // Actualizar texto de salud
                const healthTextElement = pilarElement.querySelector('.health-text');
                if (healthTextElement) {
                    if (defensor.salud <= 0) {
                        healthTextElement.textContent = 'COMPROMETIDO';
                        healthTextElement.style.color = '#ef4444';
                        healthTextElement.style.fontWeight = 'bold';
                    } else {
                        healthTextElement.textContent = `${defensor.salud}/${defensor.maxSalud}`;
                        healthTextElement.style.color = '#d1d5db';
                        healthTextElement.style.fontWeight = 'normal';
                    }
                }
            }
        });
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
        document.addEventListener('defensorHealthUpdate', () => this.updateHealthInfo()); // NUEVO
        document.addEventListener('gameNewWave', (e) => this.onNewWave(e.detail));
        
        // NUEVO: Escuchar eventos de daño a defensores
        document.addEventListener('defensorDamaged', (e) => this.onDefensorDamaged(e.detail));
        document.addEventListener('defensorHealed', (e) => this.onDefensorHealed(e.detail));
        
        // NUEVO: Escuchar evento cuando un defensor muere
        document.addEventListener('defensorMuerto', (e) => this.onDefensorMuerto(e.detail));
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
        
        // Mostrar información de curación si es oleada > 1
        if (waveInfo.waveNumber > 1) {
            this.showMessage('Defensores curados entre oleadas', 'info');
        }
    }

    // NUEVO: Manejar daño a defensores
    onDefensorDamaged(detail) {
        const { defensorName, damage, currentHealth, maxHealth } = detail;
        this.showMessage(`${defensorName} recibe ${damage} de daño`, 'error');
        
        // Efecto visual en la barra de salud
        this.animateHealthBar(defensorName, currentHealth, maxHealth);
        
        // Actualizar UI inmediatamente
        this.updateHealthInfo();
        this.updateDefensorHealthBars();
    }

    // NUEVO: Manejar curación de defensores
    onDefensorHealed(detail) {
        const { defensorName, healAmount, currentHealth, maxHealth } = detail;
        this.showMessage(`${defensorName} curado +${healAmount}`, 'success');
        
        // Efecto visual en la barra de salud
        this.animateHealthBar(defensorName, currentHealth, maxHealth, true);
        
        // Actualizar UI inmediatamente
        this.updateHealthInfo();
        this.updateDefensorHealthBars();
    }

    // NUEVO: Manejar cuando un defensor muere
    onDefensorMuerto(detail) {
        const { defensorName } = detail;
        this.showMessage(`💀 ${defensorName} ha sido comprometido!`, 'error');
        
        // Actualizar UI inmediatamente
        this.updateHealthInfo();
        this.updateDefensorHealthBars();
        
        // Efecto visual especial para defensor muerto
        this.animateDefensorMuerto(defensorName);
    }

    // NUEVO: Animación de barras de salud
    animateHealthBar(defensorName, currentHealth, maxHealth, isHeal = false) {
        const defensorKey = this.getDefensorKey(defensorName);
        const pilarElement = document.getElementById(`pilar-${defensorKey}`);
        
        if (pilarElement) {
            const bar = pilarElement.querySelector('.pilar-bar');
            if (bar) {
                // Efecto de parpadeo
                bar.classList.add(isHeal ? 'health-heal' : 'health-damage');
                setTimeout(() => {
                    bar.classList.remove('health-heal', 'health-damage');
                }, 600);
            }
        }
    }

    // NUEVO: Animación especial para defensor muerto
    animateDefensorMuerto(defensorName) {
        const defensorKey = this.getDefensorKey(defensorName);
        const pilarElement = document.getElementById(`pilar-${defensorKey}`);
        
        if (pilarElement) {
            // Efecto de parpadeo rojo
            pilarElement.classList.add('defensor-dead');
            setTimeout(() => {
                pilarElement.classList.remove('defensor-dead');
            }, 1000);
        }
    }

    // NUEVO: Obtener clave del defensor por nombre
    getDefensorKey(defensorName) {
        const mapping = {
            'Confidencialidad': 'c',
            'Integridad': 'i',
            'Disponibilidad': 'd'
        };
        return mapping[defensorName] || 'c';
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
            this.statsPanelVisible = !this.statsPanelVisible;
            statsPanel.style.display = this.statsPanelVisible ? 'block' : 'none';
            this.showMessage(this.statsPanelVisible ? 'Estadísticas visibles' : 'Estadísticas ocultas', 'info');
        }
    }

    // NUEVO: Alternar panel de información de salud
    toggleHealthPanel() {
        const healthPanel = document.getElementById('healthInfoPanel');
        if (healthPanel) {
            const isVisible = healthPanel.style.display !== 'none';
            healthPanel.style.display = isVisible ? 'none' : 'block';
            this.showMessage(isVisible ? 'Panel de salud oculto' : 'Panel de salud visible', 'info');
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
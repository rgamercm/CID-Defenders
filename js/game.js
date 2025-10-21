/**
 * CID DEFENDER - VERSIÓN RENOVADA
 * Nueva mecánica: Enemigos atacan personajes, preguntas como defensa
 * MEJORA: Juego se pausa completamente durante preguntas
 */

const GAME_STATES = {
    INTRO: 'intro',
    MENU: 'menu', 
    PLAYING: 'playing',
    PAUSED: 'paused',
    QUESTION: 'question', // Estado para cuando se muestra pregunta
    GAME_OVER: 'game_over',
    VICTORY: 'victory'
};

// NUEVO: Sistema de vida balanceada para defensores
const DEFENSORES = {
    CONFIDENCIALIDAD: { 
        nombre: "Confidencialidad", 
        salud: 100, 
        maxSalud: 100, // NUEVO: Salud máxima para cálculos
        color: '#3498db', 
        posicion: { x: 400, y: 150 }  // Vértice superior
    },
    INTEGRIDAD: { 
        nombre: "Integridad", 
        salud: 100, 
        maxSalud: 100, // NUEVO: Salud máxima para cálculos
        color: '#2ecc71', 
        posicion: { x: 250, y: 350 }  // Vértice inferior izquierdo
    },
    DISPONIBILIDAD: { 
        nombre: "Disponibilidad", 
        salud: 100, 
        maxSalud: 100, // NUEVO: Salud máxima para cálculos
        color: '#e74c3c', 
        posicion: { x: 550, y: 350 }  // Vértice inferior derecho
    }
};

class CIDDefenderGame {
    constructor() {
        this.currentState = GAME_STATES.INTRO;
        this.config = {
            canvasWidth: 800,
            canvasHeight: 500,
            startingScore: 200,
            waveInterval: 15000, // Aumentado a 15 segundos para mejor jugabilidad
            maxWaves: 5 // NUEVO: Límite de 5 oleadas
        };

        // Sistema de mensajes en pantalla - MEJORADO
        this.screenMessages = [];
        this.messageDuration = 3.0; // 3 segundos
        this.messageIdCounter = 0; // Para identificar mensajes únicos

        // Contadores de respuestas
        this.stats = {
            correctAnswers: 0,
            wrongAnswers: 0,
            totalAnswered: 0,
            accuracy: 100
        };

        this.canvas = null;
        this.ctx = null;
        this.score = this.config.startingScore;
        this.currentWave = 0;
        this.gameTime = 0;
        
        // Arrays del juego
        this.enemies = [];
        this.towers = [];
        this.projectiles = [];
        this.particles = [];
        
        // Defensores (personajes)
        this.defensores = JSON.parse(JSON.stringify(DEFENSORES));
        
        // Control de tiempo
        this.lastTime = 0;
        this.deltaTime = 0;
        this.waveTimer = 0;
        this.questionTimer = 0;
        
        // Estado de ataque actual
        this.ataqueActual = null; // { defensor, enemy, damage }
        this.currentQuestion = null;
        
        // Managers
        this.enemyManager = null;
        this.towerManager = null;
        this.questionManager = null;
        
        this.animationFrameId = null;
        this.isRunning = false;

        this.init();
    }

    init() {
        console.log('🎮 Inicializando CID Defender - Versión Renovada');
        
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('❌ Canvas no encontrado!');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        
        this.initManagers();
        this.setupEventListeners();
        this.showScreen('introScreen');
    }

    initManagers() {
        // Usar managers globales o crear fallbacks
        this.enemyManager = window.enemyManager || this.createEnemyManager();
        this.towerManager = window.towerManager || this.createTowerManager();
        this.questionManager = window.questionManager || this.createQuestionManager();
    }

    createEnemyManager() {
        return {
            spawnWave: (waveNumber) => {
                const enemies = [];
                // NUEVO: Sistema de oleadas mejorado
                const enemiesPerDefensor = Math.min(waveNumber, 3);
                const totalEnemies = enemiesPerDefensor * 3;
                
                for (let i = 0; i < totalEnemies; i++) {
                    const tipos = ['virus', 'trojan', 'ddos', 'phishing', 'ransomware'];
                    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
                    
                    const enemy = new Enemy({
                        type: tipo,
                        x: -30,
                        y: 100 + (i * 60),
                        health: 30 + (waveNumber * 10),
                        maxHealth: 30 + (waveNumber * 10),
                        speed: 40,
                        damage: 15 + (waveNumber * 2),
                        radius: 15,
                        color: this.getEnemyColor(tipo),
                        score: 20
                    });
                    enemies.push(enemy);
                }
                return enemies;
            }
        };
    }

    createTowerManager() {
        return {
            availableTowers: ['firewall', 'encryption', 'ids', 'antivirus'],
            towerConfigs: {
                firewall: { 
                    name: 'Firewall', cost: 100, 
                    damage: 25, range: 120, fireRate: 1.0,
                    color: '#3b82f6', special: 'block' 
                },
                encryption: { 
                    name: 'Cifrado', cost: 150, 
                    damage: 20, range: 100, fireRate: 1.2,
                    color: '#8b5cf6', special: 'slow' 
                },
                ids: { 
                    name: 'Sistema Detección', cost: 200, 
                    damage: 35, range: 140, fireRate: 0.8,
                    color: '#ef4444', special: 'splash' 
                },
                antivirus: { 
                    name: 'Antivirus', cost: 180, 
                    damage: 30, range: 110, fireRate: 1.1,
                    color: '#10b981', special: 'rapid_fire' 
                }
            },
            selectedTowerType: null,
            
            selectTowerType: function(type) {
                if (this.availableTowers.includes(type)) {
                    this.selectedTowerType = type;
                    return true;
                }
                return false;
            },
            
            canBuildTower: function(score, x, y, towers) {
                if (!this.selectedTowerType) return false;
                
                const config = this.towerConfigs[this.selectedTowerType];
                if (score < config.cost) return false;
                
                // Verificar distancia mínima entre torres
                const tooClose = towers.some(tower => {
                    const distance = Math.sqrt((x - tower.x) ** 2 + (y - tower.y) ** 2);
                    return distance < 60;
                });
                
                return !tooClose;
            }
        };
    }

    createQuestionManager() {
        return {
            getRandomQuestion: () => {
                const questions = [
                    {
                        question: "¿Qué garantiza que la información se mantenga secreta o privada, restringiendo el acceso?",
                        options: ["Integridad", "Confidencialidad", "Disponibilidad", "Balanceo"],
                        correct: 1,
                        explanation: "La Confidencialidad protege la información del acceso no autorizado."
                    },
                    {
                        question: "¿Qué pilar garantiza que los datos sean auténticos, precisos y confiables a lo largo de su ciclo de vida?",
                        options: ["Confidencialidad", "Integridad", "Disponibilidad", "Privacidad"],
                        correct: 1,
                        explanation: "La Integridad asegura que los datos no sean alterados indebidamente."
                    },
                    {
                        question: "¿Qué pilar garantiza que los sistemas y los datos sean accesibles para los usuarios cuando se necesiten?",
                        options: ["Integridad", "Confidencialidad", "Disponibilidad", "Precisión"],
                        correct: 2,
                        explanation: "La Disponibilidad asegura el acceso continuo a sistemas y datos."
                    }
                ];
                return questions[Math.floor(Math.random() * questions.length)];
            },
            getQuestionForDefensor: (defensorName) => {
                // Mapear nombres de defensores a categorías de preguntas
                const categoryMap = {
                    "Confidencialidad": "Confidencialidad",
                    "Integridad": "Integridad", 
                    "Disponibilidad": "Disponibilidad"
                };
                
                const category = categoryMap[defensorName] || "General";
                
                // Preguntas específicas por categoría
                const questionBank = {
                    "Confidencialidad": [
                        {
                            question: "¿Qué garantiza que la información se mantenga secreta o privada, restringiendo el acceso?",
                            options: ["Integridad", "Confidencialidad", "Disponibilidad", "Balanceo"],
                            correct: 1,
                            explanation: "La Confidencialidad protege la información del acceso no autorizado."
                        },
                        {
                            question: "¿Qué técnica hace ilegible la información para personas no autorizadas?",
                            options: ["Hashing", "Failover", "Cifrado", "Logs"],
                            correct: 2,
                            explanation: "El cifrado transforma la información en formato ilegible sin la clave adecuada."
                        },
                        {
                            question: "¿Qué sistema verifica la identidad con más de un factor para acceso seguro?",
                            options: ["RAID", "DRP", "MFA", "DNS"],
                            correct: 2,
                            explanation: "MFA (Multi-Factor Authentication) usa múltiples métodos de verificación."
                        }
                    ],
                    "Integridad": [
                        {
                            question: "¿Qué pilar garantiza que los datos sean auténticos, precisos y confiables?",
                            options: ["Confidencialidad", "Integridad", "Disponibilidad", "Privacidad"],
                            correct: 1,
                            explanation: "La Integridad asegura que los datos no sean alterados indebidamente."
                        },
                        {
                            question: "¿Qué técnica verifica que los datos no han sido modificados?",
                            options: ["Cifrado", "Hash", "VPN", "SNMP"],
                            correct: 1,
                            explanation: "Las funciones hash generan valores únicos que cambian si los datos se modifican."
                        },
                        {
                            question: "¿Qué concepto previene que se pueda negar el envío de información?",
                            options: ["Confidencialidad", "Disponibilidad", "Redundancia", "No repudio"],
                            correct: 3,
                            explanation: "El no repudio garantiza que no se pueda negar la autoría de una acción."
                        }
                    ],
                    "Disponibilidad": [
                        {
                            question: "¿Qué pilar garantiza el acceso a sistemas cuando se necesiten?",
                            options: ["Integridad", "Confidencialidad", "Disponibilidad", "Precisión"],
                            correct: 2,
                            explanation: "La Disponibilidad asegura el acceso continuo a sistemas y datos."
                        },
                        {
                            question: "¿Qué ataque compromete la Disponibilidad al saturar servicios?",
                            options: ["Phishing", "Ataque DDoS", "Spoofing", "Cifrado"],
                            correct: 1,
                            explanation: "Los ataques DDoS sobrecargan servicios haciendo que no estén disponibles."
                        },
                        {
                            question: "¿Qué técnica ayuda cuando el sistema primario falla?",
                            options: ["Estáticas", "Redundantes", "Cifradas", "Auténticas"],
                            correct: 1,
                            explanation: "La redundancia proporciona componentes de respaldo para mantener servicios."
                        }
                    ],
                    "General": [
                        {
                            question: "¿Qué principio de seguridad protege contra modificaciones no autorizadas?",
                            options: ["Confidencialidad", "Integridad", "Disponibilidad", "Autenticación"],
                            correct: 1,
                            explanation: "La Integridad protege contra modificaciones no autorizadas."
                        },
                        {
                            question: "¿Qué herramienta filtra el tráfico de red basándose en reglas?",
                            options: ["Antivirus", "Firewall", "IDS", "VPN"],
                            correct: 1,
                            explanation: "El firewall actúa como barrera entre redes, filtrando tráfico."
                        }
                    ]
                };
                
                const availableQuestions = questionBank[category] || questionBank["General"];
                return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
            }
        };
    }

    // NUEVO: Sistema de vida balanceada para defensores
    calculateDefensorHealth(waveNumber) {
        // Vida base + bonus por oleada, con límite máximo
        const baseHealth = 100;
        const waveBonus = Math.min(waveNumber * 15, 75); // Máximo +75% (175 vida)
        return baseHealth + waveBonus;
    }

    // NUEVO: Cálculo de daño balanceado según oleada
    calculateBalancedDamage(baseDamage, waveNumber) {
        const waveMultiplier = 1 + ((waveNumber - 1) * 0.12); // +12% por oleada
        return Math.floor(baseDamage * waveMultiplier);
    }

    // MODIFICADO: Eliminar curación automática entre oleadas
    // healDefensoresBetweenWaves() función ELIMINADA

    showScreenMessage(text, type = 'info', position = 'center') {
        const messageId = this.messageIdCounter++;
        
        // NUEVO: Posiciones diferentes para diferentes tipos de mensajes
        let baseY;
        switch(position) {
            case 'top':
                baseY = 80; // Para mensajes de oleadas
                break;
            case 'bottom':
                baseY = 400; // Para mensajes de daño/puntos
                break;
            case 'center':
            default:
                baseY = 200; // Para mensajes principales (respuestas)
                break;
        }
        
        const message = {
            id: messageId,
            text: text,
            type: type, // 'success', 'error', 'info', 'warning'
            position: position, // 'top', 'center', 'bottom'
            duration: this.messageDuration,
            timer: 0,
            x: this.config.canvasWidth / 2,
            y: baseY,
            alpha: 1.0,
            scale: 1.0,
            offset: 0 // Para separar mensajes del mismo tipo
        };
        
        // Calcular offset para mensajes del mismo tipo en la misma posición
        const samePositionMessages = this.screenMessages.filter(m => m.position === position);
        message.offset = samePositionMessages.length * 30; // Separación de 30px
        
        this.screenMessages.push(message);
        console.log(`📢 Mensaje en pantalla: ${text} (${type}) en posición ${position}`);
    }

    updateScreenMessages(deltaTime) {
        this.screenMessages = this.screenMessages.filter(message => {
            message.timer += deltaTime;
            
            // Animación de entrada y salida
            if (message.timer < 0.3) {
                // Escalado al aparecer
                message.scale = utils.easeInOut(message.timer / 0.3);
            } else if (message.timer > message.duration - 0.3) {
                // Escalado al desaparecer
                message.scale = utils.easeInOut((message.duration - message.timer) / 0.3);
            } else {
                message.scale = 1.0;
            }
            
            message.alpha = 1.0 - (message.timer / message.duration);
            
            // Efecto de flotación suave - solo para mensajes centrales
            if (message.position === 'center') {
                message.y = 200 + Math.sin(message.timer * 5) * 5 + message.offset;
            } else {
                message.y = this.getBaseY(message.position) + message.offset;
            }
            
            return message.timer < message.duration;
        });
    }

    // NUEVO: Función para obtener posición base según tipo
    getBaseY(position) {
        switch(position) {
            case 'top': return 80;
            case 'bottom': return 400;
            case 'center': 
            default: return 200;
        }
    }

    drawScreenMessages() {
        // Ordenar mensajes por posición para dibujar correctamente
        const sortedMessages = [...this.screenMessages].sort((a, b) => {
            const positionOrder = { 'top': 0, 'center': 1, 'bottom': 2 };
            return positionOrder[a.position] - positionOrder[b.position];
        });
        
        sortedMessages.forEach(message => {
            this.ctx.save();
            
            // Aplicar transformaciones para animación
            this.ctx.translate(message.x, message.y);
            this.ctx.scale(message.scale, message.scale);
            
            // Configurar estilo según el tipo de mensaje
            let fillColor, shadowColor, fontSize;
            switch (message.type) {
                case 'success':
                    fillColor = `rgba(16, 185, 129, ${message.alpha})`;
                    shadowColor = 'rgba(5, 150, 105, 0.8)';
                    fontSize = 'bold 28px Arial';
                    break;
                case 'error':
                    fillColor = `rgba(239, 68, 68, ${message.alpha})`;
                    shadowColor = 'rgba(185, 28, 28, 0.8)';
                    fontSize = 'bold 28px Arial';
                    break;
                case 'warning':
                    fillColor = `rgba(245, 158, 11, ${message.alpha})`;
                    shadowColor = 'rgba(180, 83, 9, 0.8)';
                    fontSize = 'bold 24px Arial';
                    break;
                default:
                    fillColor = `rgba(59, 130, 246, ${message.alpha})`;
                    shadowColor = 'rgba(30, 64, 175, 0.8)';
                    fontSize = 'bold 24px Arial';
            }
            
            // Sombra para mejor legibilidad
            this.ctx.shadowColor = shadowColor;
            this.ctx.shadowBlur = 8;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
            
            // Configurar texto
            this.ctx.fillStyle = fillColor;
            this.ctx.font = fontSize;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Dibujar mensaje
            this.ctx.fillText(message.text, 0, 0);
            
            this.ctx.restore();
        });
    }

    updateStats(isCorrect) {
        this.stats.totalAnswered++;
        
        if (isCorrect) {
            this.stats.correctAnswers++;
        } else {
            this.stats.wrongAnswers++;
        }
        
        // Calcular precisión
        this.stats.accuracy = this.stats.totalAnswered > 0 
            ? Math.round((this.stats.correctAnswers / this.stats.totalAnswered) * 100)
            : 100;
            
        console.log(`📊 Estadísticas actualizadas: ${this.stats.correctAnswers}C/${this.stats.wrongAnswers}I (${this.stats.accuracy}%)`);
        
        // Actualizar UI
        this.updateStatsUI();
    }

    updateStatsUI() {
        // Actualizar elementos de estadísticas si existen
        const correctElement = document.getElementById('correctAnswers');
        const wrongElement = document.getElementById('wrongAnswers');
        const accuracyElement = document.getElementById('accuracyRate');
        
        if (correctElement) correctElement.textContent = this.stats.correctAnswers;
        if (wrongElement) wrongElement.textContent = this.stats.wrongAnswers;
        if (accuracyElement) accuracyElement.textContent = `${this.stats.accuracy}%`;
    }

    getEnemyColor(tipo) {
        const colors = {
            virus: '#ef4444',
            trojan: '#f59e0b', 
            ddos: '#8b5cf6',
            phishing: '#06b6d4',
            ransomware: '#dc2626'
        };
        return colors[tipo] || '#ff6b6b';
    }

    setupEventListeners() {
        // Botones básicos del juego
        this.setupButton('startGame', () => this.startGame());
        this.setupButton('pauseGame', () => this.pauseGame());
        this.setupButton('resumeGame', () => this.resumeGame());
        this.setupButton('restartGame', () => this.restartGame());
        this.setupButton('exitToMenu', () => this.exitToMenu());
        this.setupButton('skipIntro', () => this.skipIntro());
        
        // Botones del menú principal - CORREGIDO
        this.setupButton('showInstructions', () => this.showInstructions());
        this.setupButton('exitGame', () => this.exitGame());
        this.setupButton('backToMenu', () => this.backToMenuFromInstructions()); // ← CORREGIDO
        
        // Botones de pausa
        this.setupButton('quitToMenu', () => this.quitToMenu());
        
        // Botones de game over
        this.setupButton('restartFromGameOver', () => this.restartFromGameOver());
        this.setupButton('menuFromGameOver', () => this.menuFromGameOver());
        
        // Botones de victoria
        this.setupButton('restartFromVictory', () => this.restartFromVictory());
        this.setupButton('menuFromVictory', () => this.menuFromVictory());
        
        // Eventos de teclado para torres
        document.addEventListener('keydown', (e) => {
            if (this.currentState !== GAME_STATES.PLAYING) return;
            
            switch(e.key) {
                case '1': this.selectTower('firewall'); break;
                case '2': this.selectTower('encryption'); break;
                case '3': this.selectTower('ids'); break;
                case '4': this.selectTower('antivirus'); break;
                case 'Escape': this.towerManager.selectedTowerType = null; break;
                case 'p': case 'P': this.pauseGame(); break;
            }
        });
        
        // Click en canvas para construir
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        
        console.log('✅ Todos los event listeners configurados correctamente');
    }
    
    setupButton(id, handler) {
        const element = document.getElementById(id);
        if (element) element.addEventListener('click', handler);
    }

    // === FLUJO PRINCIPAL DEL JUEGO ===

    startGame() {
        this.resetGame();
        this.setGameState(GAME_STATES.PLAYING);
        setTimeout(() => this.spawnWave(), 1000);
    }

    backToMenuFromInstructions() {
        console.log('🏠 Volviendo al menú desde instrucciones');
        this.showScreen('menuScreen');
        // Asegurarnos de que el estado del juego también se actualice
        this.currentState = GAME_STATES.MENU;
    }

    resetGame() {
        this.score = this.config.startingScore;
        this.currentWave = 0;
        this.gameTime = 0;
        this.waveTimer = 0;
        
        // Reset estadísticas
        this.stats = {
            correctAnswers: 0,
            wrongAnswers: 0,
            totalAnswered: 0,
            accuracy: 100
        };
        
        // NUEVO: Reset defensores con vida balanceada según oleada inicial
        const initialHealth = this.calculateDefensorHealth(1);
        this.defensores = {
            CONFIDENCIALIDAD: { 
                nombre: "Confidencialidad", 
                salud: initialHealth,
                maxSalud: initialHealth,
                color: '#3498db', 
                posicion: { x: 400, y: 150 }
            },
            INTEGRIDAD: { 
                nombre: "Integridad", 
                salud: initialHealth,
                maxSalud: initialHealth,
                color: '#2ecc71', 
                posicion: { x: 250, y: 350 }
            },
            DISPONIBILIDAD: { 
                nombre: "Disponibilidad", 
                salud: initialHealth,
                maxSalud: initialHealth,
                color: '#e74c3c', 
                posicion: { x: 550, y: 350 }
            }
        };
        
        console.log(`💚 Defensores inicializados con ${initialHealth} de vida`);
        
        // Limpiar arrays
        this.enemies = [];
        this.towers = [];
        this.projectiles = [];
        this.particles = [];
        this.screenMessages = [];
        
        this.updateUI();
        this.updateStatsUI();
    }

    setGameState(newState) {
        if (this.currentState === newState) return;
        this.currentState = newState;
        this.onStateChange(newState);
    }

    onStateChange(newState) {
        switch (newState) {
            case GAME_STATES.INTRO:
                this.showScreen('introScreen');
                this.playIntro();
                break;
            case GAME_STATES.MENU:
                this.showScreen('menuScreen');
                break;
            case GAME_STATES.PLAYING:
                this.showScreen('gameScreen');
                this.startGameLoop();
                break;
            case GAME_STATES.PAUSED:
                this.updatePauseStats();
                this.showScreen('pauseScreen');
                this.stopGameLoop();
                break;
            case GAME_STATES.QUESTION:
                this.showQuestionScreen();
                break;
            case GAME_STATES.GAME_OVER:
                this.updateFinalStats();
                this.showScreen('gameOverScreen');
                this.stopGameLoop();
                this.showFinalStats();
                break;
            case GAME_STATES.VICTORY:
                this.updateFinalStats();
                this.showScreen('victoryScreen');
                this.stopGameLoop();
                this.showFinalStats();
                break;
        }
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        const screen = document.getElementById(screenId);
        if (screen) screen.classList.add('active');
    }

    playIntro() {
        setTimeout(() => this.setGameState(GAME_STATES.MENU), 3000);
    }

    skipIntro() {
        this.setGameState(GAME_STATES.MENU);
    }

    // === BUCLE DEL JUEGO ===

    startGameLoop() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTime = performance.now();
        
        const gameLoop = (currentTime) => {
            if (!this.isRunning) return;
            
            this.deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;
            this.gameTime += this.deltaTime;
            
            this.update(this.deltaTime);
            this.render();
            
            this.animationFrameId = requestAnimationFrame(gameLoop);
        };
        
        this.animationFrameId = requestAnimationFrame(gameLoop);
    }

    stopGameLoop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    // MEJORA IMPORTANTE: El juego se pausa completamente durante preguntas
    update(deltaTime) {
        // Si estamos en estado QUESTION, solo actualizar mensajes y timer de pregunta
        if (this.currentState === GAME_STATES.QUESTION) {
            this.updateQuestionTimer(deltaTime);
            this.updateScreenMessages(deltaTime);
            return; // ⬅️ IMPORTANTE: No actualizar el resto del juego
        }
        
        // Solo actualizar el juego si estamos en estado PLAYING
        if (this.currentState === GAME_STATES.PLAYING) {
            this.updateTimers(deltaTime);
            this.updateEnemies(deltaTime);
            this.updateTowers(deltaTime);
            this.updateProjectiles(deltaTime);
            this.updateParticles(deltaTime);
            this.updateScreenMessages(deltaTime);
            this.checkGameConditions();
            this.updateUI();
        }
    }

    // NUEVA FUNCIÓN: Actualizar solo el timer de pregunta
    updateQuestionTimer(deltaTime) {
        this.questionTimer += deltaTime;
        const timerBar = document.querySelector('.timer-bar');
        if (timerBar) {
            const timeLeft = 1 - (this.questionTimer / 15);
            timerBar.style.width = `${Math.max(0, timeLeft) * 100}%`;
        }
        
        if (this.questionTimer >= 15) {
            this.onQuestionTimeOut();
        }
    }

    updateTimers(deltaTime) {
        this.waveTimer += deltaTime;
        
        // NUEVO: Solo generar oleadas si no hemos alcanzado el máximo
        if (this.currentWave < this.config.maxWaves && this.waveTimer >= this.config.waveInterval / 1000) {
            this.spawnWave();
            this.waveTimer = 0;
        }
    }

    // MEJORA: Enemigos se detienen completamente durante preguntas
    updateEnemies(deltaTime) {
        // Si estamos en estado QUESTION, no actualizar enemigos
        if (this.currentState === GAME_STATES.QUESTION) {
            return;
        }
        
        this.enemies = this.enemies.filter(enemy => {
            if (!enemy.targetDefensor) {
                // Asignar defensor objetivo
                const defensoresVivos = Object.values(this.defensores).filter(d => d.salud > 0);
                if (defensoresVivos.length > 0) {
                    enemy.targetDefensor = defensoresVivos[Math.floor(Math.random() * defensoresVivos.length)];
                }
            }
            
            if (enemy.targetDefensor && enemy.targetDefensor.salud > 0) {
                const target = enemy.targetDefensor.posicion;
                const dx = target.x - enemy.x;
                const dy = target.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    enemy.x += (dx / distance) * enemy.speed * deltaTime;
                    enemy.y += (dy / distance) * enemy.speed * deltaTime;
                }
                
                // Verificar si llegó al objetivo para atacar
                if (distance < 40) {
                    this.triggerAtaque(enemy, enemy.targetDefensor);
                    return false; // Eliminar enemigo después del ataque
                }
            }
            
            return enemy.health > 0 && enemy.x > -50;
        });
    }

    // MEJORA IMPORTANTE: Pausa completa del juego al activar ataque
    triggerAtaque(enemy, defensor) {
        // NUEVO: Daño balanceado según oleada
        const balancedDamage = this.calculateBalancedDamage(enemy.damage, this.currentWave);
        
        console.log(`⚔️ ${enemy.type} ataca a ${defensor.nombre}! Daño: ${balancedDamage} (base: ${enemy.damage})`);
        
        this.ataqueActual = {
            enemy: enemy,
            defensor: defensor,
            damage: balancedDamage,
            originalDamage: enemy.damage // Guardar para referencia
        };
        
        // MEJORA: Pausar completamente el juego
        this.setGameState(GAME_STATES.QUESTION);
    }

    // MEJORA: Torres no disparan durante preguntas
    updateTowers(deltaTime) {
        // Si estamos en estado QUESTION, no actualizar torres
        if (this.currentState === GAME_STATES.QUESTION) {
            return;
        }
        
        this.towers.forEach(tower => {
            tower.lastFireTime += deltaTime;
            
            if (tower.lastFireTime >= tower.cooldown) {
                const target = this.findTargetForTower(tower);
                if (target) {
                    this.fireTower(tower, target);
                    tower.lastFireTime = 0;
                }
            }
        });
    }

    findTargetForTower(tower) {
        const enemiesInRange = this.enemies.filter(enemy => 
            Math.sqrt((tower.x - enemy.x) ** 2 + (tower.y - enemy.y) ** 2) <= tower.range
        );
        
        if (enemiesInRange.length === 0) return null;
        
        // Diferentes estrategias según tipo de torre
        switch (tower.special) {
            case 'rapid_fire':
                return enemiesInRange[0]; // Primer enemigo
            case 'splash':
                // Enemigo con más enemigos cerca
                return enemiesInRange.reduce((best, current) => {
                    const nearbyBest = enemiesInRange.filter(e => 
                        Math.sqrt((best.x - e.x) ** 2 + (best.y - e.y) ** 2) <= 50
                    ).length;
                    const nearbyCurrent = enemiesInRange.filter(e => 
                        Math.sqrt((current.x - e.x) ** 2 + (current.y - e.y) ** 2) <= 50
                    ).length;
                    return nearbyCurrent > nearbyBest ? current : best;
                });
            default:
                return enemiesInRange[0];
        }
    }

    fireTower(tower, target) {
        const projectile = {
            x: tower.x,
            y: tower.y,
            target: target,
            damage: tower.damage,
            speed: 200,
            radius: 6,
            color: tower.color,
            special: tower.special
        };
        
        this.projectiles.push(projectile);
        this.createTowerEffect(tower.x, tower.y, tower.color);
    }

    // MEJORA: Proyectiles se detienen durante preguntas
    updateProjectiles(deltaTime) {
        // Si estamos en estado QUESTION, no actualizar proyectiles
        if (this.currentState === GAME_STATES.QUESTION) {
            return;
        }
        
        this.projectiles = this.projectiles.filter(projectile => {
            if (!projectile.target || projectile.target.health <= 0) return false;
            
            const dx = projectile.target.x - projectile.x;
            const dy = projectile.target.y - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < projectile.speed * deltaTime) {
                // Impacto
                this.applyTowerEffect(projectile);
                return false;
            }
            
            projectile.x += (dx / distance) * projectile.speed * deltaTime;
            projectile.y += (dy / distance) * projectile.speed * deltaTime;
            
            return true;
        });
    }

    applyTowerEffect(projectile) {
        const enemy = projectile.target;
        
        switch (projectile.special) {
            case 'splash':
                // Daño en área
                this.enemies.forEach(e => {
                    const dist = Math.sqrt((enemy.x - e.x) ** 2 + (enemy.y - e.y) ** 2);
                    if (dist <= 60) {
                        e.health -= projectile.damage * 0.6;
                    }
                });
                enemy.health -= projectile.damage;
                break;
                
            case 'slow':
                // Ralentizar
                enemy.speed *= 0.5;
                setTimeout(() => {
                    if (enemy.speed) enemy.speed *= 2;
                }, 3000);
                enemy.health -= projectile.damage;
                break;
                
            case 'block':
                // Bloquear ataques temporalmente
                enemy.damage = 0;
                setTimeout(() => {
                    if (enemy.damage === 0) enemy.damage = 15;
                }, 2000);
                enemy.health -= projectile.damage;
                break;
                
            default:
                enemy.health -= projectile.damage;
        }
        
        if (enemy.health <= 0) {
            this.score += enemy.score;
        }
        
        this.createHitEffect(projectile.target.x, projectile.target.y);
    }

    // MEJORA: Partículas se detienen durante preguntas
    updateParticles(deltaTime) {
        // Si estamos en estado QUESTION, no actualizar partículas
        if (this.currentState === GAME_STATES.QUESTION) {
            return;
        }
        
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            return particle.life > 0;
        });
    }

    // === SISTEMA DE ATAQUES Y PREGUNTAS ===

    // MODIFICADO: Sistema de oleadas sin curación automática
    spawnWave() {
        this.currentWave++;
        
        // MODIFICACIÓN: Eliminada la curación entre oleadas
        // if (this.currentWave > 1) {
        //     this.healDefensoresBetweenWaves();
        // }
        
        // Verificar límite de oleadas
        if (this.currentWave > this.config.maxWaves) {
            console.log('🎉 Máximo de oleadas alcanzado');
            return;
        }
        
        // MODIFICADO: Solo actualizar vida máxima, NO curar automáticamente
        const newMaxHealth = this.calculateDefensorHealth(this.currentWave);
        Object.values(this.defensores).forEach(defensor => {
            defensor.maxSalud = newMaxHealth;
            // MODIFICACIÓN: NO aumentar salud automáticamente al cambiar oleada
            // La única forma de curar es respondiendo correctamente
        });
        
        console.log(`🌊 Oleada ${this.currentWave} iniciada. Vida máxima defensores: ${newMaxHealth}`);
        
        const newEnemies = this.enemyManager.spawnWave(this.currentWave);
        this.enemies.push(...newEnemies);
        
        // Mensaje informativo - POSICIÓN SUPERIOR
        const enemiesPerDefensor = Math.min(this.currentWave, 3);
        this.showScreenMessage(`¡Oleada ${this.currentWave}! ${enemiesPerDefensor} enemigos por defensor`, 'warning', 'top');
        this.showScreenMessage(`Vida máxima: ${newMaxHealth}`, 'info', 'top');
    }

    showQuestionScreen() {
        if (!this.ataqueActual) {
            console.error('❌ No hay ataque actual para mostrar pregunta');
            this.setGameState(GAME_STATES.PLAYING);
            return;
        }
        
        try {
            // USAR LA NUEVA FUNCIÓN PARA PREGUNTAS ESPECÍFICAS
            if (this.ataqueActual && this.ataqueActual.defensor) {
                console.log(`🎯 Mostrando pregunta específica para: ${this.ataqueActual.defensor.nombre}`);
                this.currentQuestion = this.questionManager.getQuestionForDefensor(this.ataqueActual.defensor.nombre);
            } else {
                console.log('ℹ️  Usando pregunta general');
                this.currentQuestion = this.questionManager.getRandomQuestion();
            }
            
            this.questionTimer = 0;
            
            if (!this.currentQuestion) {
                console.error('❌ No se pudo obtener pregunta, usando fallback');
                this.currentQuestion = this.questionManager.getRandomQuestion();
            }
            
            document.getElementById('questionText').textContent = this.currentQuestion.question;
            
            const optionsContainer = document.getElementById('optionsContainer');
            optionsContainer.innerHTML = '';
            
            this.currentQuestion.options.forEach((option, index) => {
                const optionElement = document.createElement('div');
                optionElement.className = 'option';
                optionElement.textContent = option;
                optionElement.addEventListener('click', () => this.onAnswerSelected(index));
                optionsContainer.appendChild(optionElement);
            });
            
            this.showScreen('questionScreen');
            
        } catch (error) {
            console.error('❌ Error al mostrar pregunta:', error);
            // Fallback: volver al juego sin pregunta
            this.ataqueActual = null;
            this.setGameState(GAME_STATES.PLAYING);
        }
    }

    onAnswerSelected(selectedIndex) {
        if (!this.currentQuestion) {
            console.error('❌ No hay pregunta actual para validar');
            this.ataqueActual = null;
            this.setGameState(GAME_STATES.PLAYING);
            return;
        }

        const isCorrect = selectedIndex === this.currentQuestion.correct;
        
        // Actualizar estadísticas
        this.updateStats(isCorrect);
        
        if (isCorrect) {
            this.onCorrectAnswer();
        } else {
            this.onWrongAnswer();
        }
        
        // MEJORA: Limpiar el enemigo del ataque actual
        if (this.ataqueActual && this.ataqueActual.enemy) {
            // Eliminar el enemigo del array
            const enemyIndex = this.enemies.indexOf(this.ataqueActual.enemy);
            if (enemyIndex > -1) {
                this.enemies.splice(enemyIndex, 1);
                console.log(`🗑️ Enemigo eliminado después del ataque`);
            }
        }
        
        this.ataqueActual = null;
        this.currentQuestion = null;
        
        // MEJORA: Reanudar el juego completamente
        this.setGameState(GAME_STATES.PLAYING);
    }

    onQuestionTimeOut() {
        console.log('⏰ Tiempo agotado para responder');
        this.updateStats(false); // Respuesta incorrecta por tiempo
        this.onWrongAnswer();
        
        // MEJORA: Limpiar el enemigo del ataque actual
        if (this.ataqueActual && this.ataqueActual.enemy) {
            const enemyIndex = this.enemies.indexOf(this.ataqueActual.enemy);
            if (enemyIndex > -1) {
                this.enemies.splice(enemyIndex, 1);
            }
        }
        
        this.ataqueActual = null;
        this.currentQuestion = null;
        this.setGameState(GAME_STATES.PLAYING);
    }

    onCorrectAnswer() {
        console.log('✅ Respuesta correcta!');
        this.showScreenMessage('¡RESPUESTA CORRECTA!', 'success', 'center');
        
        if (this.ataqueActual) {
            // NUEVO: Curar al defensor atacado cuando se responde correctamente
            const healAmount = 25 + (this.currentWave * 2); // Curación base + bonus por oleada
            const defensor = this.ataqueActual.defensor;
            const saludAnterior = defensor.salud;
            
            defensor.salud = Math.min(defensor.salud + healAmount, defensor.maxSalud);
            const saludCurada = defensor.salud - saludAnterior;
            
            if (saludCurada > 0) {
                this.showScreenMessage(`+${saludCurada} salud para ${defensor.nombre}`, 'success', 'bottom');
                this.createHealEffect(defensor.posicion.x, defensor.posicion.y);
            }
            
            // El enemigo también recibe daño (pero ya será eliminado)
            this.ataqueActual.enemy.health -= this.ataqueActual.damage * 2;
            
            if (this.ataqueActual.enemy.health <= 0) {
                this.score += this.ataqueActual.enemy.score;
                this.createCelebrationEffect();
                this.showScreenMessage(`+${this.ataqueActual.enemy.score} puntos`, 'success', 'bottom');
            } else {
                this.showScreenMessage('¡Enemigo dañado!', 'success', 'bottom');
            }
        }
        
        this.score += 50;
        this.showScreenMessage('+50 puntos', 'success', 'bottom');
    }

    // NUEVO: Efecto visual de curación
    createHealEffect(x, y) {
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 80,
                vy: (Math.random() - 0.5) * 80 - 20, // Flotar hacia arriba
                life: 1.5,
                color: '#10b981'
            });
        }
    }

    onWrongAnswer() {
        console.log('❌ Respuesta incorrecta');
        this.showScreenMessage('RESPUESTA INCORRECTA', 'error', 'center');
        
        if (this.ataqueActual) {
            // El defensor recibe daño balanceado
            this.ataqueActual.defensor.salud -= this.ataqueActual.damage;
            this.createDamageEffect(this.ataqueActual.defensor.posicion.x, this.ataqueActual.defensor.posicion.y);
            
            this.showScreenMessage(`-${this.ataqueActual.damage} salud`, 'error', 'bottom');
            
            // Verificar si el defensor fue eliminado
            if (this.ataqueActual.defensor.salud <= 0) {
                this.ataqueActual.defensor.salud = 0;
                this.showScreenMessage(`${this.ataqueActual.defensor.nombre} ha sido comprometido!`, 'error', 'top');
                
                // NUEVO: Verificar Game Over inmediatamente cuando un defensor muere
                this.checkDefensorGameOver();
            }
        }
        
        this.showScreenMessage('¡Enemigo ataca!', 'warning', 'bottom');
    }

    // NUEVO: Función para verificar Game Over cuando un defensor muere
    checkDefensorGameOver() {
        const defensoresVivos = Object.values(this.defensores).filter(d => d.salud > 0).length;
        
        // MODIFICACIÓN: Game Over si al menos 1 defensor muere (en lugar de todos)
        if (defensoresVivos < 3) {
            console.log(`💀 GAME OVER: ${3 - defensoresVivos} defensor(es) comprometido(s)`);
            
            // Mostrar mensaje específico sobre qué defensores fueron comprometidos
            const defensoresMuertos = Object.values(this.defensores).filter(d => d.salud <= 0);
            const nombresMuertos = defensoresMuertos.map(d => d.nombre).join(', ');
            this.showScreenMessage(`¡${nombresMuertos} comprometidos!`, 'error', 'center');
            
            // Pequeña pausa antes del Game Over para mostrar el mensaje
            setTimeout(() => {
                this.setGameState(GAME_STATES.GAME_OVER);
            }, 1500);
        }
    }

    showFinalStats() {
        // Mostrar estadísticas finales en pantallas de fin de juego
        const finalStatsElement = document.getElementById('finalStats');
        if (finalStatsElement) {
            finalStatsElement.innerHTML = `
                <div style="margin: 15px 0; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 10px;">
                    <h4>Estadísticas de Respuestas:</h4>
                    <p>✅ Correctas: ${this.stats.correctAnswers}</p>
                    <p>❌ Incorrectas: ${this.stats.wrongAnswers}</p>
                    <p>🎯 Precisión: ${this.stats.accuracy}%</p>
                    <p>🌊 Oleada alcanzada: ${this.currentWave}</p>
                </div>
            `;
        }
    }

    // === SISTEMA DE CONSTRUCCIÓN ===

    selectTower(towerType) {
        if (this.towerManager.selectTowerType(towerType)) {
            console.log(`🏗️ ${towerType} seleccionada`);
        }
    }

    handleCanvasClick(event) {
        if (this.currentState !== GAME_STATES.PLAYING) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (this.towerManager.selectedTowerType) {
            this.attemptBuildTower(x, y);
        }
    }

    attemptBuildTower(x, y) {
        const config = this.towerManager.towerConfigs[this.towerManager.selectedTowerType];
        
        if (this.towerManager.canBuildTower(this.score, x, y, this.towers)) {
            const tower = {
                type: this.towerManager.selectedTowerType,
                x: x,
                y: y,
                damage: config.damage,
                range: config.range,
                fireRate: config.fireRate,
                color: config.color,
                radius: 20,
                special: config.special,
                lastFireTime: 0,
                cooldown: 1.0 / config.fireRate
            };
            
            this.towers.push(tower);
            this.score -= config.cost;
            this.createBuildEffect(x, y);
            
            console.log(`✅ Torre construida: ${config.name}`);
        } else {
            console.log('❌ No se puede construir aquí');
            this.createErrorEffect(x, y);
        }
        
        this.towerManager.selectedTowerType = null;
    }

    // === EFECTOS VISUALES ===

    createBuildEffect(x, y) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                life: 1,
                color: '#3b82f6'
            });
        }
    }

    createErrorEffect(x, y) {
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 80,
                vy: (Math.random() - 0.5) * 80,
                life: 0.7,
                color: '#ef4444'
            });
        }
    }

    createTowerEffect(x, y, color) {
        for (let i = 0; i < 4; i++) {
            this.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 60,
                vy: (Math.random() - 0.5) * 60,
                life: 0.5,
                color: color
            });
        }
    }

    createHitEffect(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 120,
                vy: (Math.random() - 0.5) * 120,
                life: 0.8,
                color: '#ffffff'
            });
        }
    }

    createDamageEffect(x, y) {
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 150,
                vy: (Math.random() - 0.5) * 150,
                life: 1,
                color: '#ef4444'
            });
        }
    }

    createCelebrationEffect() {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.config.canvasWidth / 2,
                y: this.config.canvasHeight / 2,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 2,
                color: `hsl(${Math.random() * 360}, 100%, 50%)`
            });
        }
    }

    // === RENDERIZADO ===

    render() {
        // Fondo
        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);
        
        this.drawGrid();
        this.drawTowers();
        this.drawEnemies();
        this.drawProjectiles();
        this.drawParticles();
        this.drawDefensores();
        this.drawScreenMessages();
        this.drawStatsOverlay();
        this.drawUI();
    }

    drawGrid() {
        this.ctx.strokeStyle = '#334155';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x < this.config.canvasWidth; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.config.canvasHeight);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.config.canvasHeight; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.config.canvasWidth, y);
            this.ctx.stroke();
        }
    }

    drawStatsOverlay() {
        // Dibujar panel de estadísticas en esquina superior derecha
        this.ctx.save();
        
        // Fondo del panel
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        this.ctx.strokeStyle = '#334155';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.roundRect(this.config.canvasWidth - 180, 10, 170, 80, 10);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Texto de estadísticas
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        
        this.ctx.fillText(`✅ Correctas: ${this.stats.correctAnswers}`, this.config.canvasWidth - 170, 30);
        this.ctx.fillText(`❌ Incorrectas: ${this.stats.wrongAnswers}`, this.config.canvasWidth - 170, 50);
        this.ctx.fillText(`🎯 Precisión: ${this.stats.accuracy}%`, this.config.canvasWidth - 170, 70);
        
        this.ctx.restore();
    }

    drawDefensores() {
        Object.values(this.defensores).forEach(defensor => {
            if (defensor.salud <= 0) {
                // NUEVO: Mostrar defensor muerto con efecto visual
                this.drawDefensorMuerto(defensor);
                return;
            }
            
            // Cuerpo del defensor
            this.ctx.fillStyle = defensor.color;
            this.ctx.beginPath();
            this.ctx.arc(defensor.posicion.x, defensor.posicion.y, 25, 0, Math.PI * 2);
            this.ctx.fill();
            
            // NUEVO: Barra de salud con porcentaje basado en salud máxima
            const saludPercent = defensor.salud / defensor.maxSalud;
            this.ctx.fillStyle = saludPercent > 0.6 ? '#10b981' : saludPercent > 0.3 ? '#f59e0b' : '#ef4444';
            this.ctx.fillRect(defensor.posicion.x - 25, defensor.posicion.y - 40, 50 * saludPercent, 4);
            
            // Nombre
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(defensor.nombre, defensor.posicion.x, defensor.posicion.y + 35);
            
            // NUEVO: Mostrar salud actual/máxima
            this.ctx.font = '10px Arial';
            this.ctx.fillText(`${defensor.salud}/${defensor.maxSalud}`, defensor.posicion.x, defensor.posicion.y + 50);
        });
    }

    // NUEVO: Dibujar defensor muerto
    drawDefensorMuerto(defensor) {
        // Cuerpo del defensor (gris y tachado)
        this.ctx.fillStyle = '#6b7280';
        this.ctx.beginPath();
        this.ctx.arc(defensor.posicion.x, defensor.posicion.y, 25, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Cruz roja sobre el defensor
        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(defensor.posicion.x - 15, defensor.posicion.y - 15);
        this.ctx.lineTo(defensor.posicion.x + 15, defensor.posicion.y + 15);
        this.ctx.moveTo(defensor.posicion.x + 15, defensor.posicion.y - 15);
        this.ctx.lineTo(defensor.posicion.x - 15, defensor.posicion.y + 15);
        this.ctx.stroke();
        
        // Texto "COMPROMETIDO"
        this.ctx.fillStyle = '#ef4444';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('COMPROMETIDO', defensor.posicion.x, defensor.posicion.y + 35);
    }

    drawEnemies() {
        this.enemies.forEach(enemy => {
            // Cuerpo del enemigo
            this.ctx.fillStyle = enemy.color;
            this.ctx.beginPath();
            this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Barra de salud
            const saludPercent = enemy.health / enemy.maxHealth;
            this.ctx.fillStyle = saludPercent > 0.6 ? '#10b981' : saludPercent > 0.3 ? '#f59e0b' : '#ef4444';
            this.ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 8, enemy.radius * 2 * saludPercent, 3);
            
            // Icono según tipo
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            const icons = {
                virus: '⚡', trojan: '🎁', ddos: '🌐', 
                phishing: '🎣', ransomware: '💀'
            };
            this.ctx.fillText(icons[enemy.type] || '❓', enemy.x, enemy.y);
        });
    }

    updatePauseStats() {
        // Actualizar estadísticas en pantalla de pausa
        const pauseCorrect = document.getElementById('pauseCorrect');
        const pauseWrong = document.getElementById('pauseWrong');
        const pauseAccuracy = document.getElementById('pauseAccuracy');
        
        if (pauseCorrect) pauseCorrect.textContent = this.stats.correctAnswers;
        if (pauseWrong) pauseWrong.textContent = this.stats.wrongAnswers;
        if (pauseAccuracy) pauseAccuracy.textContent = `${this.stats.accuracy}%`;
    }
    
    updateFinalStats() {
        // Actualizar puntuación final
        const finalScore = document.getElementById('finalScore');
        const victoryScore = document.getElementById('victoryScore');
        
        if (finalScore) finalScore.textContent = this.score;
        if (victoryScore) victoryScore.textContent = this.score;
    }

    exitGame() {
        console.log('🚪 Saliendo del juego');
        this.showExitConfirmation();
    }
    
    showExitConfirmation() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 3000;
        `;
        
        modal.innerHTML = `
            <div style="
                background: #1e293b;
                padding: 2rem;
                border-radius: 15px;
                border: 2px solid #475569;
                text-align: center;
                max-width: 400px;
                width: 90%;
            ">
                <h3 style="color: #60a5fa; margin-bottom: 1rem;">¿Salir del Juego?</h3>
                <p style="color: #d1d5db; margin-bottom: 2rem;">¿Estás seguro de que quieres salir de CID Defender?</p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button id="confirmExit" style="
                        padding: 0.8rem 1.5rem;
                        background: #ef4444;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                    ">Sí, Salir</button>
                    <button id="cancelExit" style="
                        padding: 0.8rem 1.5rem;
                        background: #3b82f6;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                    ">Cancelar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('confirmExit').addEventListener('click', () => {
            document.body.removeChild(modal);
            alert('¡Gracias por jugar CID Defender! Vuelve pronto.');
        });
        
        document.getElementById('cancelExit').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }
    
    backToMenu() {
        console.log('🏠 Volviendo al menú principal');
        this.setGameState(GAME_STATES.MENU);
    }
    
    quitToMenu() {
        console.log('🚪 Saliendo al menú principal');
        if (this.currentState === GAME_STATES.PAUSED) {
            this.setGameState(GAME_STATES.MENU);
        }
    }
    
    restartFromGameOver() {
        console.log('🔄 Reiniciando desde Game Over');
        this.startGame();
    }
    
    menuFromGameOver() {
        console.log('🏠 Menú desde Game Over');
        this.setGameState(GAME_STATES.MENU);
    }
    
    restartFromVictory() {
        console.log('🔄 Reiniciando desde Victoria');
        this.startGame();
    }
    
    menuFromVictory() {
        console.log('🏠 Menú desde Victoria');
        this.setGameState(GAME_STATES.MENU);
    }

    drawTowers() {
        this.towers.forEach(tower => {
            // Base de la torre
            this.ctx.fillStyle = tower.color;
            this.ctx.beginPath();
            this.ctx.arc(tower.x, tower.y, tower.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Indicador de rango (si está seleccionada)
            if (this.towerManager.selectedTowerType === tower.type) {
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
            
            // Icono
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            const icons = {
                firewall: '🛡️', encryption: '🔒', 
                ids: '👁️', antivirus: '💊'
            };
            this.ctx.fillText(icons[tower.type] || '⚙️', tower.x, tower.y);
        });
    }

    drawProjectiles() {
        this.projectiles.forEach(projectile => {
            this.ctx.fillStyle = projectile.color;
            this.ctx.beginPath();
            this.ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        });
    }

    drawUI() {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        
        this.ctx.fillText(`Puntos: ${this.score}`, 10, 20);
        this.ctx.fillText(`Oleada: ${this.currentWave}/${this.config.maxWaves}`, 10, 40);
        this.ctx.fillText(`Enemigos: ${this.enemies.length}`, 10, 60);
        
        // Defensores vivos
        const defensoresVivos = Object.values(this.defensores).filter(d => d.salud > 0).length;
        this.ctx.fillText(`Defensores: ${defensoresVivos}/3`, 10, 80);
        
        // NUEVO: Mostrar vida máxima actual de defensores
        if (Object.values(this.defensores).length > 0) {
            const vidaMaxima = Object.values(this.defensores)[0].maxSalud;
            this.ctx.fillText(`Vida máxima: ${vidaMaxima}`, 10, 100);
        }
    }

    // === CONDICIONES DE JUEGO ===

    checkGameConditions() {
        // NUEVO: Verificar si al menos 1 defensor está derrotado (Game Over)
        const defensoresVivos = Object.values(this.defensores).filter(d => d.salud > 0).length;
        if (defensoresVivos < 3) {
            console.log(`💀 GAME OVER: ${3 - defensoresVivos} defensor(es) comprometido(s)`);
            this.setGameState(GAME_STATES.GAME_OVER);
            return;
        }
        
        // NUEVO: Victoria después de 5 oleadas y sin enemigos
        if (this.currentWave >= this.config.maxWaves && this.enemies.length === 0) {
            this.setGameState(GAME_STATES.VICTORY);
            return;
        }
    }

    updateUI() {
        const scoreElement = document.getElementById('scoreValue');
        const waveElement = document.getElementById('waveValue');
        
        if (scoreElement) scoreElement.textContent = this.score;
        if (waveElement) waveElement.textContent = this.currentWave;
        
        // Actualizar barras de salud de defensores en la UI
        Object.keys(this.defensores).forEach((key, index) => {
            const defensor = this.defensores[key];
            const pilarElement = document.getElementById(`pilar-${key.charAt(0).toLowerCase()}`);
            if (pilarElement) {
                const bar = pilarElement.querySelector('.pilar-bar');
                if (bar) {
                    const percent = (defensor.salud / defensor.maxSalud) * 100; // NUEVO: Usar salud máxima
                    bar.style.width = `${percent}%`;
                    bar.style.background = percent > 50 ? '#10b981' : percent > 25 ? '#f59e0b' : '#ef4444';
                    
                    // NUEVO: Efecto visual cuando el defensor está muerto
                    if (defensor.salud <= 0) {
                        bar.style.background = '#6b7280';
                        bar.style.opacity = '0.5';
                    }
                }
            }
        });
    }

    pauseGame() {
        if (this.currentState === GAME_STATES.PLAYING) {
            this.setGameState(GAME_STATES.PAUSED);
        }
    }

    resumeGame() {
        if (this.currentState === GAME_STATES.PAUSED) {
            this.setGameState(GAME_STATES.PLAYING);
        }
    }

    restartGame() {
        this.startGame();
    }

    exitToMenu() {
        this.setGameState(GAME_STATES.MENU);
    }

    showInstructions() {
        console.log('📖 Mostrando instrucciones');
        this.setGameState(GAME_STATES.MENU); // Temporal - necesitamos crear estado INSTRUCTIONS
        this.showScreen('instructionsScreen');
    }
    
    exitGame() {
        console.log('🚪 Saliendo del juego');
        if (confirm('¿Estás seguro de que quieres salir del juego?')) {
            alert('¡Gracias por jugar CID Defender!');
        }
    }
}

// Inicializar el juego
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new CIDDefenderGame();
    window.game = game;
});
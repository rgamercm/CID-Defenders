/**
 * CID DEFENDER - VERSIÓN RENOVADA
 * Nueva mecánica: Enemigos atacan personajes, preguntas como defensa
 */

const GAME_STATES = {
    INTRO: 'intro',
    MENU: 'menu', 
    PLAYING: 'playing',
    PAUSED: 'paused',
    QUESTION: 'question',
    GAME_OVER: 'game_over',
    VICTORY: 'victory'
};

// Personajes defensores (reemplazan los pilares CID)
const DEFENSORES = {
    ADMINISTRADOR: { nombre: "Admin", salud: 100, color: '#3498db', posicion: { x: 100, y: 250 } },
    ANALISTA: { nombre: "Analista", salud: 100, color: '#2ecc71', posicion: { x: 400, y: 250 } },
    USUARIO: { nombre: "Usuario", salud: 100, color: '#e74c3c', posicion: { x: 700, y: 250 } }
};

class CIDDefenderGame {
    constructor() {
        this.currentState = GAME_STATES.INTRO;
        this.config = {
            canvasWidth: 800,
            canvasHeight: 500,
            startingScore: 200,
            waveInterval: 10000
        };

        // Sistema de mensajes en pantalla
        this.screenMessages = [];
        this.messageDuration = 3.0; // 3 segundos

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
                const count = Math.min(3 + waveNumber, 8);
                
                for (let i = 0; i < count; i++) {
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

    showScreenMessage(text, type = 'info') {
        const message = {
            text: text,
            type: type, // 'success', 'error', 'info', 'warning'
            duration: this.messageDuration,
            timer: 0,
            x: this.config.canvasWidth / 2,
            y: 150,
            alpha: 1.0,
            scale: 1.0
        };
        
        this.screenMessages.push(message);
        console.log(`📢 Mensaje en pantalla: ${text} (${type})`);
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
            
            // Efecto de flotación suave
            message.y = 150 + Math.sin(message.timer * 5) * 5;
            
            return message.timer < message.duration;
        });
    }

    drawScreenMessages() {
        this.screenMessages.forEach(message => {
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

    createQuestionManager() {
        return {
            getRandomQuestion: () => {
                const questions = [
                    {
                        question: "¿Qué protocolo cifra las comunicaciones web?",
                        options: ["HTTP", "FTP", "HTTPS", "SMTP"],
                        correct: 2,
                        explanation: "HTTPS usa SSL/TLS para cifrado"
                    },
                    {
                        question: "¿Qué herramienta previene acceso no autorizado?",
                        options: ["Antivirus", "Firewall", "Backup", "Monitor"],
                        correct: 1,
                        explanation: "El firewall filtra tráfico de red"
                    },
                    {
                        question: "¿Qué principio asegura que los datos no se modifiquen?",
                        options: ["Confidencialidad", "Integridad", "Disponibilidad", "Autenticación"],
                        correct: 1,
                        explanation: "La integridad protege contra modificaciones"
                    },
                    {
                        question: "¿Qué ataque satura servidores?",
                        options: ["Phishing", "DDoS", "Virus", "Troyano"],
                        correct: 1,
                        explanation: "DDoS sobrecarga servicios"
                    }
                ];
                return questions[Math.floor(Math.random() * questions.length)];
            }
        };
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
        
        // Reset defensores
        this.defensores = JSON.parse(JSON.stringify(DEFENSORES));
        
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

    update(deltaTime) {
        this.updateTimers(deltaTime);
        this.updateEnemies(deltaTime);
        this.updateTowers(deltaTime);
        this.updateProjectiles(deltaTime);
        this.updateParticles(deltaTime);
        this.updateScreenMessages(deltaTime);
        this.checkGameConditions();
        this.updateUI();
    }

    updateTimers(deltaTime) {
        this.waveTimer += deltaTime;
        
        if (this.waveTimer >= this.config.waveInterval / 1000) {
            this.spawnWave();
            this.waveTimer = 0;
        }
        
        // Timer para preguntas
        if (this.currentState === GAME_STATES.QUESTION) {
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
    }

    updateEnemies(deltaTime) {
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
                
                // Verificar si llegó al defensor
                if (distance < 40) {
                    this.triggerAtaque(enemy, enemy.targetDefensor);
                    return false; // Eliminar enemigo después del ataque
                }
            }
            
            return enemy.health > 0 && enemy.x > -50;
        });
    }

    triggerAtaque(enemy, defensor) {
        console.log(`⚔️ ${enemy.type} ataca a ${defensor.nombre}!`);
        
        this.ataqueActual = {
            enemy: enemy,
            defensor: defensor,
            damage: enemy.damage
        };
        
        this.setGameState(GAME_STATES.QUESTION);
    }

    updateTowers(deltaTime) {
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

    updateProjectiles(deltaTime) {
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

    updateParticles(deltaTime) {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            return particle.life > 0;
        });
    }

    // === SISTEMA DE ATAQUES Y PREGUNTAS ===

    spawnWave() {
        this.currentWave++;
        console.log(`🌊 Oleada ${this.currentWave}`);
        
        const newEnemies = this.enemyManager.spawnWave(this.currentWave);
        this.enemies.push(...newEnemies);
    }

    showQuestionScreen() {
        if (!this.ataqueActual) return;
        
        this.currentQuestion = this.questionManager.getRandomQuestion();
        this.questionTimer = 0;
        
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
    }

    onAnswerSelected(selectedIndex) {
        const isCorrect = selectedIndex === this.currentQuestion.correct;
        
        // Actualizar estadísticas
        this.updateStats(isCorrect);
        
        if (isCorrect) {
            this.onCorrectAnswer();
        } else {
            this.onWrongAnswer();
        }
        
        this.ataqueActual = null;
        this.setGameState(GAME_STATES.PLAYING);
    }

    onQuestionTimeOut() {
        this.updateStats(false); // Respuesta incorrecta por tiempo
        this.onWrongAnswer();
        this.ataqueActual = null;
        this.setGameState(GAME_STATES.PLAYING);
    }

    onCorrectAnswer() {
        console.log('✅ Respuesta correcta!');
        this.showScreenMessage('¡RESPUESTA CORRECTA!', 'success');
        
        if (this.ataqueActual) {
            // El enemigo recibe daño
            this.ataqueActual.enemy.health -= this.ataqueActual.damage * 2;
            
            if (this.ataqueActual.enemy.health <= 0) {
                this.score += this.ataqueActual.enemy.score;
                this.createCelebrationEffect();
                this.showScreenMessage(`+${this.ataqueActual.enemy.score} puntos`, 'success');
            } else {
                this.showScreenMessage('¡Enemigo dañado!', 'success');
            }
        }
        
        this.score += 50;
        this.showScreenMessage('+50 puntos', 'success');
    }

    onWrongAnswer() {
        console.log('❌ Respuesta incorrecta');
        this.showScreenMessage('RESPUESTA INCORRECTA', 'error');
        
        if (this.ataqueActual) {
            // El defensor recibe daño
            this.ataqueActual.defensor.salud -= this.ataqueActual.damage;
            this.createDamageEffect(this.ataqueActual.defensor.posicion.x, this.ataqueActual.defensor.posicion.y);
            
            this.showScreenMessage(`-${this.ataqueActual.damage} salud`, 'error');
        }
        
        this.showScreenMessage('¡Enemigo ataca!', 'warning');
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
            if (defensor.salud <= 0) return;
            
            // Cuerpo del defensor
            this.ctx.fillStyle = defensor.color;
            this.ctx.beginPath();
            this.ctx.arc(defensor.posicion.x, defensor.posicion.y, 25, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Barra de salud
            const saludPercent = defensor.salud / 100;
            this.ctx.fillStyle = saludPercent > 0.6 ? '#10b981' : saludPercent > 0.3 ? '#f59e0b' : '#ef4444';
            this.ctx.fillRect(defensor.posicion.x - 25, defensor.posicion.y - 40, 50 * saludPercent, 4);
            
            // Nombre
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(defensor.nombre, defensor.posicion.x, defensor.posicion.y + 35);
        });
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
            // En un entorno de navegador, no podemos cerrar la ventana automáticamente
            // por razones de seguridad, pero podemos redirigir o simplemente mostrar el mensaje
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
        this.ctx.fillText(`Oleada: ${this.currentWave}`, 10, 40);
        this.ctx.fillText(`Enemigos: ${this.enemies.length}`, 10, 60);
        
        // Defensores vivos
        const defensoresVivos = Object.values(this.defensores).filter(d => d.salud > 0).length;
        this.ctx.fillText(`Defensores: ${defensoresVivos}/3`, 10, 80);
    }

    // === CONDICIONES DE JUEGO ===

    checkGameConditions() {
        // Verificar si todos los defensores están derrotados
        const defensoresVivos = Object.values(this.defensores).filter(d => d.salud > 0).length;
        if (defensoresVivos === 0) {
            this.setGameState(GAME_STATES.GAME_OVER);
            return;
        }
        
        // Victoria después de 10 oleadas
        if (this.currentWave >= 10) {
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
            const pilarElement = document.getElementById(`pilar-${key.charAt(0)}`);
            if (pilarElement) {
                const bar = pilarElement.querySelector('.pilar-bar');
                if (bar) {
                    const percent = (defensor.salud / 100) * 100;
                    bar.style.width = `${percent}%`;
                    bar.style.background = percent > 50 ? '#10b981' : percent > 25 ? '#f59e0b' : '#ef4444';
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
            // En un entorno web, podríamos cerrar la ventana o redirigir
            window.close(); // Esto puede no funcionar en todos los navegadores
            // Alternativa: mostrar mensaje
            alert('¡Gracias por jugar CID Defender!');
        }
    }
    
    backToMenu() {
        console.log('🏠 Volviendo al menú principal');
        this.setGameState(GAME_STATES.MENU);
    }
    
    quitToMenu() {
        console.log('🚪 Saliendo al menú principal');
        this.setGameState(GAME_STATES.MENU);
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
}

// Inicializar el juego
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new CIDDefenderGame();
    window.game = game;
});
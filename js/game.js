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
        // Botones básicos
        this.setupButton('startGame', () => this.startGame());
        this.setupButton('pauseGame', () => this.pauseGame());
        this.setupButton('resumeGame', () => this.resumeGame());
        this.setupButton('restartGame', () => this.restartGame());
        this.setupButton('exitToMenu', () => this.exitToMenu());
        this.setupButton('skipIntro', () => this.skipIntro());
        
        // Eventos de teclado para torres
        document.addEventListener('keydown', (e) => {
            if (this.currentState !== GAME_STATES.PLAYING) return;
            
            switch(e.key) {
                case '1': this.selectTower('firewall'); break;
                case '2': this.selectTower('encryption'); break;
                case '3': this.selectTower('ids'); break;
                case '4': this.selectTower('antivirus'); break;
                case 'Escape': this.towerManager.selectedTowerType = null; break;
            }
        });
        
        // Click en canvas para construir
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
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

    resetGame() {
        this.score = this.config.startingScore;
        this.currentWave = 0;
        this.gameTime = 0;
        this.waveTimer = 0;
        
        // Reset defensores
        this.defensores = JSON.parse(JSON.stringify(DEFENSORES));
        
        // Limpiar arrays
        this.enemies = [];
        this.towers = [];
        this.projectiles = [];
        this.particles = [];
        
        this.updateUI();
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
                this.showScreen('pauseScreen');
                this.stopGameLoop();
                break;
            case GAME_STATES.QUESTION:
                this.showQuestionScreen();
                break;
            case GAME_STATES.GAME_OVER:
                this.showScreen('gameOverScreen');
                this.stopGameLoop();
                break;
            case GAME_STATES.VICTORY:
                this.showScreen('victoryScreen');
                this.stopGameLoop();
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
        
        if (isCorrect) {
            this.onCorrectAnswer();
        } else {
            this.onWrongAnswer();
        }
        
        this.ataqueActual = null;
        this.setGameState(GAME_STATES.PLAYING);
    }

    onQuestionTimeOut() {
        this.onWrongAnswer();
        this.ataqueActual = null;
        this.setGameState(GAME_STATES.PLAYING);
    }

    onCorrectAnswer() {
        console.log('✅ Respuesta correcta!');
        
        if (this.ataqueActual) {
            // El enemigo recibe daño
            this.ataqueActual.enemy.health -= this.ataqueActual.damage * 2;
            
            if (this.ataqueActual.enemy.health <= 0) {
                this.score += this.ataqueActual.enemy.score;
                this.createCelebrationEffect();
            }
        }
        
        this.score += 50;
    }

    onWrongAnswer() {
        console.log('❌ Respuesta incorrecta');
        
        if (this.ataqueActual) {
            // El defensor recibe daño
            this.ataqueActual.defensor.salud -= this.ataqueActual.damage;
            this.createDamageEffect(this.ataqueActual.defensor.posicion.x, this.ataqueActual.defensor.posicion.y);
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
}

// Inicializar el juego
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new CIDDefenderGame();
    window.game = game;
});
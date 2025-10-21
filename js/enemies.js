/**
 * SISTEMA DE ENEMIGOS - CID DEFENDER
 * Clases y comportamientos para las amenazas cibernéticas
 */

class EnemyManager {
    constructor() {
        this.enemyTypes = {
            VIRUS: 'virus',
            TROJAN: 'trojan', 
            DDOS: 'ddos',
            PHISHING: 'phishing',
            RANSOMWARE: 'ransomware'
        };
        
        this.enemyConfigs = {
            [this.enemyTypes.VIRUS]: {
                health: 50,
                speed: 40,
                damage: 10,
                radius: 12,
                color: '#ef4444',
                score: 10,
                spawnWeight: 3
            },
            [this.enemyTypes.TROJAN]: {
                health: 80,
                speed: 30,
                damage: 15,
                radius: 15,
                color: '#f59e0b',
                score: 15,
                spawnWeight: 2
            },
            [this.enemyTypes.DDOS]: {
                health: 30,
                speed: 60,
                damage: 5,
                radius: 8,
                color: '#8b5cf6',
                score: 5,
                spawnWeight: 4
            },
            [this.enemyTypes.PHISHING]: {
                health: 100,
                speed: 25,
                damage: 20,
                radius: 18,
                color: '#06b6d4',
                score: 20,
                spawnWeight: 1
            },
            [this.enemyTypes.RANSOMWARE]: {
                health: 150,
                speed: 20,
                damage: 25,
                radius: 22,
                color: '#dc2626',
                score: 30,
                spawnWeight: 1
            }
        };
    }

    /**
     * GENERACIÓN DE OLEADAS
     */
    spawnWave(waveNumber) {
        const enemies = [];
        const enemyCount = this.calculateEnemyCount(waveNumber);
        
        utils.log(`Generando oleada ${waveNumber} con ${enemyCount} enemigos`);
        
        for (let i = 0; i < enemyCount; i++) {
            const enemyType = this.selectRandomEnemyType(waveNumber);
            const enemy = this.createEnemy(enemyType, waveNumber, i);
            enemies.push(enemy);
        }
        
        return enemies;
    }

    calculateEnemyCount(waveNumber) {
        // Fórmula base: 5 enemigos + 2 por oleada, máximo 20
        return Math.min(5 + (waveNumber * 2), 20);
    }

    selectRandomEnemyType(waveNumber) {
        const weights = [];
        const types = Object.values(this.enemyTypes);
        
        // Ajustar pesos según oleada
        types.forEach(type => {
            let weight = this.enemyConfigs[type].spawnWeight;
            
            // En oleadas altas, aumentar probabilidad de enemigos fuertes
            if (waveNumber > 5) {
                if (type === this.enemyTypes.RANSOMWARE) weight += 2;
                if (type === this.enemyTypes.PHISHING) weight += 1;
            }
            
            weights.push(weight);
        });
        
        return utils.randomFromArray(types, weights);
    }

    createEnemy(type, waveNumber, index) {
        const config = this.enemyConfigs[type];
        
        // Aumentar dificultad según oleada
        const waveMultiplier = 1 + (waveNumber * 0.1);
        
        const enemy = new Enemy({
            type: type,
            x: this.getSpawnPosition(index).x,
            y: this.getSpawnPosition(index).y,
            health: config.health * waveMultiplier,
            maxHealth: config.health * waveMultiplier,
            speed: config.speed,
            damage: config.damage,
            radius: config.radius,
            color: config.color,
            score: config.score
        });
        
        return enemy;
    }

    getSpawnPosition(index) {
        // Posiciones de spawn distribuidas en el borde izquierdo
        const spawnPoints = [
            { x: -30, y: 100 },
            { x: -30, y: 200 },
            { x: -30, y: 300 },
            { x: -30, y: 400 },
            { x: -30, y: 150 },
            { x: -30, y: 250 },
            { x: -30, y: 350 }
        ];
        
        return spawnPoints[index % spawnPoints.length];
    }

    /**
     * ACTUALIZACIÓN DE ENEMIGOS
     */
    updateEnemies(enemies, deltaTime, pilars) {
        enemies.forEach(enemy => {
            if (enemy.update) {
                enemy.update(deltaTime, pilars);
            }
        });
        
        return enemies.filter(enemy => enemy.health > 0);
    }
}

class Enemy {
    constructor(config) {
        this.type = config.type;
        this.x = config.x;
        this.y = config.y;
        this.health = config.health;
        this.maxHealth = config.maxHealth;
        this.speed = config.speed;
        this.damage = config.damage;
        this.radius = config.radius;
        this.color = config.color;
        this.score = config.score;
        
        // Estado del enemigo
        this.targetPilar = null;
        this.path = [];
        this.currentPathIndex = 0;
        this.lastAttackTime = 0;
        this.attackCooldown = 1.0; // 1 segundo entre ataques
        
        // Efectos visuales
        this.hitEffectTimer = 0;
        this.isFlashing = false;
    }

    update(deltaTime, pilars) {
        // Buscar pilar objetivo si no tiene
        if (!this.targetPilar || this.targetPilar.health <= 0) {
            this.findTargetPilar(pilars);
        }
        
        // Movimiento hacia el objetivo
        if (this.targetPilar) {
            this.moveTowardsTarget(deltaTime);
        }
        
        // Actualizar efectos visuales
        this.updateEffects(deltaTime);
    }

    findTargetPilar(pilars) {
        // Encontrar el pilar más cercano con salud
        const viablePilars = Object.values(pilars).filter(pilar => pilar.health > 0);
        
        if (viablePilars.length === 0) return;
        
        // Para algunos enemigos, comportamiento especial
        switch (this.type) {
            case 'ddos':
                // Los DDoS atacan disponibilidad primero
                this.targetPilar = viablePilars.find(p => this.getPilarName(p) === 'disponibilidad') || 
                                  viablePilars[0];
                break;
            case 'phishing':
                // Phishing ataca confidencialidad primero
                this.targetPilar = viablePilars.find(p => this.getPilarName(p) === 'confidencialidad') || 
                                  viablePilars[0];
                break;
            case 'ransomware':
                // Ransomware ataca integridad primero
                this.targetPilar = viablePilars.find(p => this.getPilarName(p) === 'integridad') || 
                                  viablePilars[0];
                break;
            default:
                // Enemigos normales eligen al azar
                this.targetPilar = utils.randomFromArray(viablePilars);
        }
    }

    getPilarName(pilar) {
        const positions = {
            '100': 'confidencialidad',
            '400': 'integridad', 
            '700': 'disponibilidad'
        };
        return positions[pilar.position.x.toString()];
    }

    moveTowardsTarget(deltaTime) {
        const target = this.targetPilar.position;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalizar dirección
        if (distance > 0) {
            const moveX = (dx / distance) * this.speed * deltaTime;
            const moveY = (dy / distance) * this.speed * deltaTime;
            
            this.x += moveX;
            this.y += moveY;
        }
        
        // Verificar si llegó al objetivo
        if (distance < this.radius + 30) {
            this.attackPilar(deltaTime);
        }
    }

    attackPilar(deltaTime) {
        this.lastAttackTime += deltaTime;
        
        if (this.lastAttackTime >= this.attackCooldown) {
            this.targetPilar.health -= this.damage;
            this.lastAttackTime = 0;
            
            // Efecto visual de ataque
            this.isFlashing = true;
            this.hitEffectTimer = 0.2;
            
            utils.log(`${this.type} atacó pilar por ${this.damage} de daño`);
        }
    }

    updateEffects(deltaTime) {
        if (this.isFlashing) {
            this.hitEffectTimer -= deltaTime;
            if (this.hitEffectTimer <= 0) {
                this.isFlashing = false;
            }
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        this.isFlashing = true;
        this.hitEffectTimer = 0.1;
        
        return this.health <= 0;
    }

    draw(ctx) {
        // Guardar contexto
        ctx.save();
        
        // Efecto de flash cuando es golpeado
        if (this.isFlashing) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = this.color;
        }
        
        // Cuerpo principal del enemigo
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Detalles según tipo de enemigo
        this.drawEnemyDetails(ctx);
        
        // Barra de salud
        this.drawHealthBar(ctx);
        
        // Restaurar contexto
        ctx.restore();
    }

    drawEnemyDetails(ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Iconos según tipo
        switch (this.type) {
            case 'virus':
                ctx.fillText('⚡', this.x, this.y);
                break;
            case 'trojan':
                ctx.fillText('🎁', this.x, this.y);
                break;
            case 'ddos':
                ctx.fillText('🌐', this.x, this.y);
                break;
            case 'phishing':
                ctx.fillText('🎣', this.x, this.y);
                break;
            case 'ransomware':
                ctx.fillText('💀', this.x, this.y);
                break;
        }
    }

    drawHealthBar(ctx) {
        const healthPercent = this.health / this.maxHealth;
        const barWidth = this.radius * 2;
        const barHeight = 4;
        const barX = this.x - this.radius;
        const barY = this.y - this.radius - 8;
        
        // Fondo de la barra
        ctx.fillStyle = '#374151';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Salud actual
        if (healthPercent > 0.6) {
            ctx.fillStyle = '#10b981';
        } else if (healthPercent > 0.3) {
            ctx.fillStyle = '#f59e0b';
        } else {
            ctx.fillStyle = '#ef4444';
        }
        
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }

    /**
     * COMPORTAMIENTOS ESPECIALES POR TIPO
     */
    getSpecialAbility() {
        switch (this.type) {
            case 'trojan':
                return {
                    name: 'Camuflaje',
                    description: 'Más difícil de detectar por algunas torres',
                    effect: () => this.radius *= 0.8 // Más pequeño
                };
            case 'ddos':
                return {
                    name: 'Ataque Masivo', 
                    description: 'Ataca en grupo con otros DDoS',
                    effect: () => this.speed *= 1.2
                };
            case 'ransomware':
                return {
                    name: 'Cifrado',
                    description: 'Reduce la efectividad de las torres cercanas',
                    effect: () => {} // Se implementaría en el sistema de torres
                };
            default:
                return null;
        }
    }
}

// Instancia global del manager de enemigos
const enemyManager = new EnemyManager();

// Tests de desarrollo
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    enemyManager.runTests = function() {
        console.log('=== TESTING Enemy System ===');
        
        // Test creación de enemigos
        const testEnemy = new Enemy({
            type: 'virus',
            x: 100,
            y: 100,
            health: 50,
            maxHealth: 50,
            speed: 40,
            damage: 10,
            radius: 12,
            color: '#ef4444',
            score: 10
        });
        
        console.log('✅ Enemy class:', testEnemy instanceof Enemy);
        console.log('✅ Enemy properties:', testEnemy.type === 'virus');
        
        // Test generación de oleada
        const wave = this.spawnWave(1);
        console.log('✅ Wave generation:', wave.length > 0);
        console.log('✅ Wave enemies:', wave.every(e => e instanceof Enemy));
        
        // Test daño
        const initialHealth = testEnemy.health;
        testEnemy.takeDamage(10);
        console.log('✅ Damage system:', testEnemy.health === initialHealth - 10);
        
        // Test selección de tipo
        const types = [];
        for (let i = 0; i < 100; i++) {
            types.push(this.selectRandomEnemyType(1));
        }
        const hasVariety = new Set(types).size > 1;
        console.log('✅ Enemy variety:', hasVariety);
    };
}
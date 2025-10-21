/**
 * SISTEMA DE ENEMIGOS RENOVADO - CID DEFENDER
 * Enemigos que atacan defensores y activan preguntas
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
                name: 'Virus',
                health: 40,
                speed: 45,
                damage: 20,
                radius: 14,
                color: '#ef4444',
                score: 25,
                spawnWeight: 4,
                description: 'Se replica rápidamente'
            },
            [this.enemyTypes.TROJAN]: {
                name: 'Troyano',
                health: 60,
                speed: 35,
                damage: 25,
                radius: 16,
                color: '#f59e0b',
                score: 30,
                spawnWeight: 3,
                description: 'Se disfraza de software legítimo'
            },
            [this.enemyTypes.DDOS]: {
                name: 'Ataque DDoS',
                health: 30,
                speed: 55,
                damage: 15,
                radius: 12,
                color: '#8b5cf6',
                score: 20,
                spawnWeight: 3,
                description: 'Satura los servicios'
            },
            [this.enemyTypes.PHISHING]: {
                name: 'Phishing',
                health: 50,
                speed: 40,
                damage: 30,
                radius: 15,
                color: '#06b6d4',
                score: 35,
                spawnWeight: 2,
                description: 'Engaña para obtener credenciales'
            },
            [this.enemyTypes.RANSOMWARE]: {
                name: 'Ransomware',
                health: 80,
                speed: 30,
                damage: 35,
                radius: 18,
                color: '#dc2626',
                score: 40,
                spawnWeight: 1,
                description: 'Cifra archivos y exige rescate'
            }
        };
    }

    spawnWave(waveNumber) {
        const enemies = [];
        const baseCount = 2 + Math.floor(waveNumber / 2);
        const enemyCount = Math.min(baseCount, 6);
        
        console.log(`🎯 Generando oleada ${waveNumber} con ${enemyCount} enemigos`);
        
        for (let i = 0; i < enemyCount; i++) {
            const enemyType = this.selectRandomEnemyType(waveNumber);
            const enemy = this.createEnemy(enemyType, waveNumber, i);
            enemies.push(enemy);
        }
        
        return enemies;
    }

    selectRandomEnemyType(waveNumber) {
        const types = Object.values(this.enemyTypes);
        const weights = types.map(type => {
            let weight = this.enemyConfigs[type].spawnWeight;
            
            // En oleadas altas, más enemigos fuertes
            if (waveNumber > 3) {
                if (type === this.enemyTypes.RANSOMWARE) weight += 1;
                if (type === this.enemyTypes.PHISHING) weight += 1;
            }
            if (waveNumber > 6) {
                if (type === this.enemyTypes.RANSOMWARE) weight += 1;
            }
            
            return weight;
        });
        
        return this.weightedRandom(types, weights);
    }

    weightedRandom(items, weights) {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) return items[i];
        }
        
        return items[items.length - 1];
    }

    createEnemy(type, waveNumber, index) {
        const config = this.enemyConfigs[type];
        
        // Aumentar dificultad según oleada
        const waveMultiplier = 1 + ((waveNumber - 1) * 0.15);
        
        const enemy = new Enemy({
            type: type,
            name: config.name,
            x: this.getSpawnPosition(index).x,
            y: this.getSpawnPosition(index).y,
            health: Math.floor(config.health * waveMultiplier),
            maxHealth: Math.floor(config.health * waveMultiplier),
            speed: config.speed,
            damage: Math.floor(config.damage * waveMultiplier),
            radius: config.radius,
            color: config.color,
            score: config.score,
            description: config.description
        });
        
        return enemy;
    }

    getSpawnPosition(index) {
        const spawnPoints = [
            { x: -40, y: 100 },
            { x: -40, y: 200 },
            { x: -40, y: 300 },
            { x: -40, y: 150 },
            { x: -40, y: 250 },
            { x: -40, y: 350 }
        ];
        
        return spawnPoints[index % spawnPoints.length];
    }
}

class Enemy {
    constructor(config) {
        this.type = config.type;
        this.name = config.name;
        this.x = config.x;
        this.y = config.y;
        this.health = config.health;
        this.maxHealth = config.maxHealth;
        this.speed = config.speed;
        this.damage = config.damage;
        this.radius = config.radius;
        this.color = config.color;
        this.score = config.score;
        this.description = config.description;
        
        // Estado del enemigo
        this.targetDefensor = null;
        this.isAttacking = false;
        this.attackCooldown = 0;
        
        // Efectos visuales
        this.hitEffectTimer = 0;
        this.slowEffectTimer = 0;
        this.originalSpeed = config.speed;
    }

    update(deltaTime, defensores) {
        // Buscar defensor objetivo si no tiene
        if (!this.targetDefensor || this.targetDefensor.salud <= 0) {
            this.findTargetDefensor(defensores);
        }
        
        // Aplicar efectos temporales
        this.updateEffects(deltaTime);
        
        // Movimiento hacia el objetivo
        if (this.targetDefensor && this.targetDefensor.salud > 0) {
            this.moveTowardsTarget(deltaTime);
        }
        
        // Actualizar cooldown de ataque
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
    }

    findTargetDefensor(defensores) {
        const defensoresVivos = Object.values(defensores).filter(d => d.salud > 0);
        if (defensoresVivos.length === 0) return;
        
        // Comportamientos especiales según tipo
        switch (this.type) {
            case 'ddos':
                // DDoS prefiere atacar al administrador
                this.targetDefensor = defensoresVivos.find(d => d.nombre === "Admin") || defensoresVivos[0];
                break;
            case 'phishing':
                // Phishing prefiere atacar al usuario
                this.targetDefensor = defensoresVivos.find(d => d.nombre === "Usuario") || defensoresVivos[0];
                break;
            case 'ransomware':
                // Ransomware prefiere atacar al analista
                this.targetDefensor = defensoresVivos.find(d => d.nombre === "Analista") || defensoresVivos[0];
                break;
            default:
                // Enemigos normales eligen al azar
                this.targetDefensor = defensoresVivos[Math.floor(Math.random() * defensoresVivos.length)];
        }
        
        console.log(`🎯 ${this.name} apunta a ${this.targetDefensor.nombre}`);
    }

    moveTowardsTarget(deltaTime) {
        const target = this.targetDefensor.posicion;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalizar dirección y mover
        if (distance > 0) {
            const moveX = (dx / distance) * this.speed * deltaTime;
            const moveY = (dy / distance) * this.speed * deltaTime;
            
            this.x += moveX;
            this.y += moveY;
        }
        
        // Verificar si llegó al objetivo para atacar
        if (distance < 40 && this.attackCooldown <= 0) {
            this.prepareAttack();
        }
    }

    prepareAttack() {
        this.isAttacking = true;
        console.log(`⚔️ ${this.name} prepara ataque contra ${this.targetDefensor.nombre}`);
        
        // El ataque se completa en el próximo frame, activando la pregunta
    }

    updateEffects(deltaTime) {
        // Efecto de golpe
        if (this.hitEffectTimer > 0) {
            this.hitEffectTimer -= deltaTime;
        }
        
        // Efecto de ralentización
        if (this.slowEffectTimer > 0) {
            this.slowEffectTimer -= deltaTime;
            if (this.slowEffectTimer <= 0) {
                this.speed = this.originalSpeed;
                console.log(`🐢 ${this.name} recupera velocidad normal`);
            }
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        this.hitEffectTimer = 0.2;
        
        console.log(`💥 ${this.name} recibe ${amount} de daño - Salud: ${this.health}/${this.maxHealth}`);
        
        return this.health <= 0;
    }

    slow(factor, duration) {
        this.speed = this.originalSpeed * factor;
        this.slowEffectTimer = duration;
        console.log(`🐢 ${this.name} ralentizado al ${factor * 100}% por ${duration}s`);
    }

    blockAttacks(duration) {
        this.damage = 0;
        setTimeout(() => {
            this.damage = this.originalDamage || 15;
            console.log(`🛡️ ${this.name} puede atacar nuevamente`);
        }, duration * 1000);
        console.log(`🛡️ ${this.name} bloqueado por ${duration}s`);
    }

    draw(ctx) {
        ctx.save();
        
        // Efecto de flash cuando es golpeado
        if (this.hitEffectTimer > 0) {
            ctx.fillStyle = '#ffffff';
        } else if (this.slowEffectTimer > 0) {
            // Efecto azul cuando está ralentizado
            ctx.fillStyle = '#60a5fa';
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
        
        // Indicador de ataque
        if (this.isAttacking) {
            this.drawAttackIndicator(ctx);
        }
        
        ctx.restore();
    }

    drawEnemyDetails(ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Iconos según tipo
        const icons = {
            virus: '⚡',
            trojan: '🎁',
            ddos: '🌐',
            phishing: '🎣',
            ransomware: '💀'
        };
        
        ctx.fillText(icons[this.type] || '❓', this.x, this.y);
        
        // Nombre del enemigo (pequeño)
        ctx.font = '9px Arial';
        ctx.fillText(this.name, this.x, this.y + this.radius + 10);
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

    drawAttackIndicator(ctx) {
        // Círculo pulsante alrededor del enemigo cuando ataca
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        
        const pulseSize = this.radius + 8 + (Math.sin(Date.now() * 0.01) * 3);
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    getInfo() {
        return {
            name: this.name,
            type: this.type,
            health: this.health,
            maxHealth: this.maxHealth,
            damage: this.damage,
            speed: this.speed,
            description: this.description,
            score: this.score
        };
    }
}

// Instancia global del manager de enemigos
const enemyManager = new EnemyManager();
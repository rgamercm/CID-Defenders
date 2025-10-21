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

    // NUEVO: Sistema de spawn points distribuidos
    getSpawnPositions(waveNumber) {
        // Múltiples puntos de spawn distribuidos estratégicamente
        const spawnPoints = [
            // Lado izquierdo - arriba, centro, abajo
            { x: -30, y: 80 }, 
            { x: -30, y: 250 }, 
            { x: -30, y: 420 },
            
            // Lado superior - izquierda, centro, derecha
            { x: 150, y: -30 }, 
            { x: 400, y: -30 }, 
            { x: 650, y: -30 },
            
            // Lado derecho - arriba, centro, abajo
            { x: 830, y: 80 }, 
            { x: 830, y: 250 }, 
            { x: 830, y: 420 },
            
            // Lado inferior - izquierda, centro, derecha
            { x: 150, y: 530 }, 
            { x: 400, y: 530 }, 
            { x: 650, y: 530 }
        ];
        
        // En oleadas altas, usar más puntos de spawn
        if (waveNumber > 3) {
            spawnPoints.push(
                { x: -30, y: 150 }, { x: -30, y: 350 }, // Izquierda adicional
                { x: 830, y: 150 }, { x: 830, y: 350 }  // Derecha adicional
            );
        }
        
        return spawnPoints;
    }

    spawnWave(waveNumber) {
        const enemies = [];
        
        // NUEVO SISTEMA: Enemigos distribuidos proporcionalmente
        const enemiesPerDefensor = Math.min(waveNumber, 3);
        const totalEnemies = enemiesPerDefensor * 3;
        const spawnPoints = this.getSpawnPositions(waveNumber);
        
        console.log(`🎯 Generando oleada ${waveNumber}: ${enemiesPerDefensor} enemigos por defensor (${totalEnemies} total) desde ${spawnPoints.length} puntos de spawn`);
        
        // Nombres de los defensores en orden
        const defensorNames = ["Confidencialidad", "Integridad", "Disponibilidad"];
        
        for (let i = 0; i < totalEnemies; i++) {
            // Asignar defensor específico a cada enemigo (distribución circular)
            const defensorIndex = i % 3;
            const assignedDefensor = defensorNames[defensorIndex];
            
            // NUEVO: Distribuir enemigos entre diferentes puntos de spawn
            const spawnIndex = i % spawnPoints.length;
            const spawnPoint = spawnPoints[spawnIndex];
            
            const enemyType = this.selectRandomEnemyType(waveNumber);
            const enemy = this.createEnemy(enemyType, waveNumber, spawnPoint, assignedDefensor);
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

    createEnemy(type, waveNumber, spawnPoint, assignedDefensor = null) {
        const config = this.enemyConfigs[type];
        
        // Aumentar dificultad según oleada
        const waveMultiplier = 1 + ((waveNumber - 1) * 0.15);
        
        const enemy = new Enemy({
            type: type,
            name: config.name,
            x: spawnPoint.x,
            y: spawnPoint.y,
            health: Math.floor(config.health * waveMultiplier),
            maxHealth: Math.floor(config.health * waveMultiplier),
            speed: config.speed,
            damage: Math.floor(config.damage * waveMultiplier),
            radius: config.radius,
            color: config.color,
            score: config.score,
            description: config.description,
            assignedDefensor: assignedDefensor // NUEVO: Defensor asignado
        });
        
        console.log(`👾 Enemigo ${type} creado en (${spawnPoint.x}, ${spawnPoint.y}) para ${assignedDefensor}`);
        return enemy;
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
        this.assignedDefensor = config.assignedDefensor; // NUEVO: Defensor pre-asignado
        
        // Estado del enemigo
        this.targetDefensor = null;
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.originalDamage = config.damage; // Guardar daño original para efectos
        
        // Efectos visuales
        this.hitEffectTimer = 0;
        this.slowEffectTimer = 0;
        this.originalSpeed = config.speed;
    }

    update(deltaTime, defensores) {
        // Si tiene defensor asignado, usarlo como objetivo
        if (this.assignedDefensor && !this.targetDefensor) {
            this.targetDefensor = defensores[this.assignedDefensor];
        }
        
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
        
        // Si tenía un defensor asignado pero murió, buscar uno similar
        if (this.assignedDefensor) {
            const defensorNames = Object.keys(defensores);
            const similarDefensor = defensorNames.find(name => 
                defensores[name].salud > 0 && name !== this.assignedDefensor
            );
            if (similarDefensor) {
                this.targetDefensor = defensores[similarDefensor];
                return;
            }
        }
        
        // Comportamientos especiales según tipo
        switch (this.type) {
            case 'ddos':
                // DDoS prefiere atacar a la Disponibilidad
                this.targetDefensor = defensoresVivos.find(d => d.nombre === "Disponibilidad") || defensoresVivos[0];
                break;
            case 'phishing':
                // Phishing prefiere atacar a la Confidencialidad
                this.targetDefensor = defensoresVivos.find(d => d.nombre === "Confidencialidad") || defensoresVivos[0];
                break;
            case 'ransomware':
                // Ransomware prefiere atacar a la Integridad
                this.targetDefensor = defensoresVivos.find(d => d.nombre === "Integridad") || defensoresVivos[0];
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
            this.damage = this.originalDamage;
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
        
        // NUEVO: Indicador de defensor asignado
        if (this.assignedDefensor) {
            this.drawAssignedDefensorIndicator(ctx);
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

    drawAssignedDefensorIndicator(ctx) {
        // NUEVO: Indicador visual del defensor asignado
        const colors = {
            'Confidencialidad': '#3498db',
            'Integridad': '#2ecc71', 
            'Disponibilidad': '#e74c3c'
        };
        
        const color = colors[this.assignedDefensor] || '#ffffff';
        
        // Pequeño círculo de color en la parte superior
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y - this.radius - 5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Letra inicial del defensor
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const initial = this.assignedDefensor.charAt(0);
        ctx.fillText(initial, this.x, this.y - this.radius - 5);
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
            score: this.score,
            assignedDefensor: this.assignedDefensor // NUEVO: Incluir en info
        };
    }
}

// Instancia global del manager de enemigos
const enemyManager = new EnemyManager();
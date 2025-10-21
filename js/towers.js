/**
 * SISTEMA DE TORRES DEFENSIVAS - CID DEFENDER
 * Clases y comportamientos para las defensas de seguridad
 */

class TowerManager {
    constructor() {
        this.towerTypes = {
            FIREWALL: 'firewall',
            ENCRYPTION: 'encryption',
            IDS: 'ids',
            ANTIVIRUS: 'antivirus'
        };

        this.towerConfigs = {
            [this.towerTypes.FIREWALL]: {
                name: 'Firewall',
                description: 'Defensa básica que filtra amenazas simples',
                cost: 100,
                damage: 15,
                range: 120,
                fireRate: 1.0,
                color: '#3b82f6',
                radius: 20,
                projectileColor: '#60a5fa',
                special: null
            },
            [this.towerTypes.ENCRYPTION]: {
                name: 'Cifrado',
                description: 'Protege datos con cifrado avanzado',
                cost: 150,
                damage: 10,
                range: 100,
                fireRate: 1.5,
                color: '#8b5cf6',
                radius: 18,
                projectileColor: '#a78bfa',
                special: 'slow'
            },
            [this.towerTypes.IDS]: {
                name: 'Sistema de Detección',
                description: 'Detecta y elimina amenazas avanzadas',
                cost: 200,
                damage: 25,
                range: 140,
                fireRate: 0.7,
                color: '#ef4444',
                radius: 22,
                projectileColor: '#fca5a5',
                special: 'splash'
            },
            [this.towerTypes.ANTIVIRUS]: {
                name: 'Antivirus',
                description: 'Elimina malware conocido rápidamente',
                cost: 180,
                damage: 20,
                range: 110,
                fireRate: 0.9,
                color: '#10b981',
                radius: 19,
                projectileColor: '#34d399',
                special: 'rapid_fire'
            }
        };

        this.availableTowers = [];
        this.selectedTowerType = null;
    }

    /**
     * GESTIÓN DE TORRES DISPONIBLES
     */
    addAvailableTower(type) {
        if (this.towerConfigs[type] && !this.availableTowers.includes(type)) {
            this.availableTowers.push(type);
            utils.log(`Torre ${type} desbloqueada`);
            this.updateTowerUI();
        }
    }

    removeAvailableTower(type) {
        const index = this.availableTowers.indexOf(type);
        if (index > -1) {
            this.availableTowers.splice(index, 1);
            this.updateTowerUI();
        }
    }

    selectTowerType(type) {
        if (this.availableTowers.includes(type)) {
            this.selectedTowerType = type;
            utils.log(`Torre ${type} seleccionada para construcción`);
            return true;
        }
        return false;
    }

    getSelectedTowerConfig() {
        if (this.selectedTowerType) {
            return this.towerConfigs[this.selectedTowerType];
        }
        return null;
    }

    /**
     * CONSTRUCCIÓN DE TORRES
     */
    canBuildTower(score, x, y, existingTowers) {
        const config = this.getSelectedTowerConfig();
        if (!config) return false;

        // Verificar costo
        if (score < config.cost) {
            utils.log('Puntos insuficientes para construir torre');
            return false;
        }

        // Verificar posición válida (no muy cerca de otras torres)
        const tooClose = existingTowers.some(tower => {
            const distance = utils.distance(x, y, tower.x, tower.y);
            return distance < 60; // Distancia mínima entre torres
        });

        if (tooClose) {
            utils.log('Posición muy cerca de otra torre');
            return false;
        }

        // Verificar que está en área de construcción válida
        const validArea = this.isValidBuildArea(x, y);
        if (!validArea) {
            utils.log('Posición de construcción inválida');
            return false;
        }

        return true;
    }

    isValidBuildArea(x, y) {
        // Áreas donde se pueden construir torres (evitar bordes y pilares)
        const invalidAreas = [
            { x: 100, y: 250, radius: 50 }, // Alrededor de confidencialidad
            { x: 400, y: 250, radius: 50 }, // Alrededor de integridad
            { x: 700, y: 250, radius: 50 }, // Alrededor de disponibilidad
        ];

        return !invalidAreas.some(area => 
            utils.distance(x, y, area.x, area.y) < area.radius
        );
    }

    buildTower(x, y, projectiles) {
        const config = this.getSelectedTowerConfig();
        if (!config) return null;

        const tower = new Tower({
            type: this.selectedTowerType,
            x: x,
            y: y,
            damage: config.damage,
            range: config.range,
            fireRate: config.fireRate,
            color: config.color,
            radius: config.radius,
            projectileColor: config.projectileColor,
            special: config.special
        });

        // Reset selección después de construir
        this.selectedTowerType = null;

        return tower;
    }

    /**
     * ACTUALIZACIÓN DE TORRES
     */
    updateTowers(towers, deltaTime, enemies, projectiles) {
        towers.forEach(tower => {
            if (tower.update) {
                tower.update(deltaTime, enemies, projectiles);
            }
        });
    }

    /**
     * INTERFAZ DE USUARIO
     */
    updateTowerUI() {
        // Esta función se llamará desde el juego principal
        // para actualizar la UI de selección de torres
        utils.log('Actualizando UI de torres disponibles:', this.availableTowers);
    }

    getTowerCost(type) {
        return this.towerConfigs[type]?.cost || 0;
    }
}

class Tower {
    constructor(config) {
        this.type = config.type;
        this.x = config.x;
        this.y = config.y;
        this.damage = config.damage;
        this.range = config.range;
        this.fireRate = config.fireRate;
        this.color = config.color;
        this.radius = config.radius;
        this.projectileColor = config.projectileColor;
        this.special = config.special;

        // Estado de la torre
        this.target = null;
        this.lastFireTime = 0;
        this.cooldown = 1.0 / this.fireRate;
        this.level = 1;
        this.upgradeCost = 50;

        // Efectos visuales
        this.attackEffectTimer = 0;
        this.isAttacking = false;
    }

    update(deltaTime, enemies, projectiles) {
        // Buscar objetivo
        this.findTarget(enemies);

        // Atacar si hay objetivo
        if (this.target && this.target.health > 0) {
            this.lastFireTime += deltaTime;

            if (this.lastFireTime >= this.cooldown) {
                this.attack(projectiles);
                this.lastFireTime = 0;
            }
        }

        // Actualizar efectos visuales
        this.updateEffects(deltaTime);
    }

    findTarget(enemies) {
        // Filtrar enemigos en rango
        const enemiesInRange = enemies.filter(enemy => 
            utils.distance(this.x, this.y, enemy.x, enemy.y) <= this.range
        );

        if (enemiesInRange.length === 0) {
            this.target = null;
            return;
        }

        // Estrategia de selección de objetivo según tipo de torre
        switch (this.special) {
            case 'slow':
                // Prefiere enemigos rápidos
                this.target = enemiesInRange.reduce((fastest, current) => 
                    current.speed > fastest.speed ? current : fastest
                );
                break;
            case 'splash':
                // Prefiere grupos de enemigos
                this.target = this.findBestSplashTarget(enemiesInRange);
                break;
            case 'rapid_fire':
                // Prefiere enemigos con poca salud
                this.target = enemiesInRange.reduce((weakest, current) => 
                    current.health < weakest.health ? current : weakest
                );
                break;
            default:
                // Torre básica: el enemigo más cercano
                this.target = enemiesInRange.reduce((closest, current) => {
                    const distCurrent = utils.distance(this.x, this.y, current.x, current.y);
                    const distClosest = utils.distance(this.x, this.y, closest.x, closest.y);
                    return distCurrent < distClosest ? current : closest;
                });
        }
    }

    findBestSplashTarget(enemies) {
        // Encontrar el enemigo que tenga más enemigos cerca
        let bestTarget = enemies[0];
        let maxNearby = 0;

        enemies.forEach(enemy => {
            const nearby = enemies.filter(other => 
                utils.distance(enemy.x, enemy.y, other.x, other.y) <= 40 // Radio de splash
            ).length;

            if (nearby > maxNearby) {
                maxNearby = nearby;
                bestTarget = enemy;
            }
        });

        return bestTarget;
    }

    attack(projectiles) {
        if (!this.target) return;

        // Crear proyectil
        const projectile = new Projectile({
            x: this.x,
            y: this.y,
            target: this.target,
            damage: this.damage,
            speed: 200,
            radius: 4,
            color: this.projectileColor,
            special: this.special
        });

        projectiles.push(projectile);

        // Efecto visual de ataque
        this.isAttacking = true;
        this.attackEffectTimer = 0.1;

        utils.log(`${this.type} atacó a ${this.target.type}`);
    }

    updateEffects(deltaTime) {
        if (this.isAttacking) {
            this.attackEffectTimer -= deltaTime;
            if (this.attackEffectTimer <= 0) {
                this.isAttacking = false;
            }
        }
    }

    upgrade() {
        if (this.level >= 3) return false; // Máximo nivel

        this.level++;
        this.damage *= 1.5;
        this.range *= 1.2;
        this.fireRate *= 1.3;
        this.cooldown = 1.0 / this.fireRate;
        this.upgradeCost *= 2;

        utils.log(`Torre ${this.type} mejorada a nivel ${this.level}`);
        return true;
    }

    draw(ctx) {
        ctx.save();

        // Cuerpo de la torre
        if (this.isAttacking) {
            ctx.fillStyle = '#ffffff'; // Efecto de flash al atacar
        } else {
            ctx.fillStyle = this.color;
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Detalles según tipo
        this.drawTowerDetails(ctx);

        // Rango de ataque (solo cuando está seleccionada)
        if (this === game?.selectedTower) {
            this.drawRangeCircle(ctx);
        }

        // Indicador de nivel
        this.drawLevelIndicator(ctx);

        ctx.restore();
    }

    drawTowerDetails(ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Iconos según tipo de torre
        switch (this.type) {
            case 'firewall':
                ctx.fillText('🛡️', this.x, this.y);
                break;
            case 'encryption':
                ctx.fillText('🔒', this.x, this.y);
                break;
            case 'ids':
                ctx.fillText('👁️', this.x, this.y);
                break;
            case 'antivirus':
                ctx.fillText('💊', this.x, this.y);
                break;
        }
    }

    drawRangeCircle(ctx) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.setLineDash([]);
    }

    drawLevelIndicator(ctx) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        
        // Estrellas según nivel
        const stars = '★'.repeat(this.level);
        ctx.fillText(stars, this.x, this.y + this.radius + 10);
    }

    getInfo() {
        const config = towerManager.towerConfigs[this.type];
        return {
            name: config.name,
            description: config.description,
            level: this.level,
            damage: this.damage,
            range: this.range,
            fireRate: this.fireRate,
            upgradeCost: this.upgradeCost,
            special: this.getSpecialDescription()
        };
    }

    getSpecialDescription() {
        switch (this.special) {
            case 'slow':
                return 'Ralentiza enemigos';
            case 'splash':
                return 'Daño en área';
            case 'rapid_fire':
                return 'Fuego rápido';
            default:
                return 'Sin habilidad especial';
        }
    }
}

class Projectile {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.target = config.target;
        this.damage = config.damage;
        this.speed = config.speed;
        this.radius = config.radius;
        this.color = config.color;
        this.special = config.special;

        // Efectos especiales
        this.splashRadius = this.special === 'splash' ? 40 : 0;
        this.slowAmount = this.special === 'slow' ? 0.5 : 1;
        this.slowDuration = this.special === 'slow' ? 3.0 : 0;
    }

    update(deltaTime) {
        if (!this.target || this.target.health <= 0) {
            return false; // Proyectil debe ser eliminado
        }

        // Movimiento hacia el objetivo
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.speed * deltaTime) {
            // Golpeó al objetivo
            this.onHit();
            return false;
        }

        // Normalizar y mover
        this.x += (dx / distance) * this.speed * deltaTime;
        this.y += (dy / distance) * this.speed * deltaTime;

        return true;
    }

    onHit() {
        // Aplicar daño al objetivo principal
        this.target.takeDamage(this.damage);

        // Efectos especiales
        if (this.special === 'splash' && game) {
            // Daño en área
            game.enemies.forEach(enemy => {
                if (enemy !== this.target && 
                    utils.distance(this.target.x, this.target.y, enemy.x, enemy.y) <= this.splashRadius) {
                    enemy.takeDamage(this.damage * 0.5);
                }
            });
        }

        if (this.special === 'slow' && this.target.slow) {
            // Ralentizar enemigo
            this.target.slow(this.slowAmount, this.slowDuration);
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Efectos visuales para proyectiles especiales
        if (this.special === 'splash') {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}

// Instancia global del manager de torres
const towerManager = new TowerManager();

// Tests de desarrollo
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    towerManager.runTests = function() {
        console.log('=== TESTING Tower System ===');

        // Test configuraciones de torres
        console.log('✅ Tower configurations:', Object.keys(this.towerConfigs).length === 4);

        // Test sistema de disponibilidad
        this.addAvailableTower('firewall');
        console.log('✅ Tower availability:', this.availableTowers.includes('firewall'));

        // Test selección de torres
        const selectResult = this.selectTowerType('firewall');
        console.log('✅ Tower selection:', selectResult === true);

        // Test construcción
        const canBuild = this.canBuildTower(200, 300, 300, []);
        console.log('✅ Tower building check:', canBuild === true);

        // Test creación de torre
        const tower = this.buildTower(300, 300, []);
        console.log('✅ Tower creation:', tower instanceof Tower);

        // Test actualización de torres
        const testTowers = [tower];
        const testEnemies = [new Enemy({
            type: 'virus', x: 350, y: 300, health: 50, maxHealth: 50,
            speed: 40, damage: 10, radius: 12, color: '#ff0000', score: 10
        })];
        const testProjectiles = [];
        
        this.updateTowers(testTowers, 0.016, testEnemies, testProjectiles);
        console.log('✅ Tower updating:', testProjectiles.length > 0);
    };
}
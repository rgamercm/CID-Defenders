/**
 * SISTEMA DE TORRES MEJORADO - CID DEFENDER
 * Torres con habilidades especiales contra enemigos
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
                description: 'Bloquea ataques enemigos temporalmente',
                cost: 100,
                damage: 25,
                range: 120,
                fireRate: 1.0,
                color: '#3b82f6',
                radius: 20,
                projectileColor: '#60a5fa',
                special: 'block',
                upgradeCost: 80,
                icon: '🛡️'
            },
            [this.towerTypes.ENCRYPTION]: {
                name: 'Cifrado',
                description: 'Ralentiza enemigos con cifrado pesado',
                cost: 150,
                damage: 20,
                range: 100,
                fireRate: 1.2,
                color: '#8b5cf6',
                radius: 18,
                projectileColor: '#a78bfa',
                special: 'slow',
                upgradeCost: 100,
                icon: '🔒'
            },
            [this.towerTypes.IDS]: {
                name: 'Sistema de Detección',
                description: 'Daño en área contra grupos de enemigos',
                cost: 200,
                damage: 35,
                range: 140,
                fireRate: 0.8,
                color: '#ef4444',
                radius: 22,
                projectileColor: '#fca5a5',
                special: 'splash',
                upgradeCost: 120,
                icon: '👁️'
            },
            [this.towerTypes.ANTIVIRUS]: {
                name: 'Antivirus',
                description: 'Fuego rápido contra amenazas individuales',
                cost: 180,
                damage: 30,
                range: 110,
                fireRate: 1.5,
                color: '#10b981',
                radius: 19,
                projectileColor: '#34d399',
                special: 'rapid_fire',
                upgradeCost: 110,
                icon: '💊'
            }
        };

        this.availableTowers = ['firewall', 'encryption'];
        this.selectedTowerType = null;
    }

    addAvailableTower(type) {
        if (this.towerConfigs[type] && !this.availableTowers.includes(type)) {
            this.availableTowers.push(type);
            console.log(`🎉 Torre desbloqueada: ${this.towerConfigs[type].name}`);
            this.updateTowerUI();
        }
    }

    selectTowerType(type) {
        if (this.availableTowers.includes(type)) {
            this.selectedTowerType = type;
            console.log(`🎯 Torre seleccionada: ${this.towerConfigs[type].name}`);
            return true;
        }
        console.log(`❌ Torre no disponible: ${type}`);
        return false;
    }

    getSelectedTowerConfig() {
        if (this.selectedTowerType) {
            return this.towerConfigs[this.selectedTowerType];
        }
        return null;
    }

    canBuildTower(score, x, y, towers) {
        const config = this.getSelectedTowerConfig();
        if (!config) return false;

        // Verificar costo
        if (score < config.cost) {
            console.log(`💰 Puntos insuficientes: ${score}/${config.cost}`);
            return false;
        }

        // Verificar posición válida (no muy cerca de otras torres)
        const tooClose = towers.some(tower => {
            const distance = Math.sqrt((x - tower.x) ** 2 + (y - tower.y) ** 2);
            return distance < 60;
        });

        if (tooClose) {
            console.log('📍 Posición muy cerca de otra torre');
            return false;
        }

        // Verificar que está en área de construcción válida
        const validArea = this.isValidBuildArea(x, y);
        if (!validArea) {
            console.log('🚫 Área de construcción inválida');
            return false;
        }

        return true;
    }

    isValidBuildArea(x, y) {
        // Áreas prohibidas (cerca de defensores)
        const restrictedAreas = [
            { x: 100, y: 250, radius: 60 },  // Alrededor del Admin
            { x: 400, y: 250, radius: 60 },  // Alrededor del Analista
            { x: 700, y: 250, radius: 60 },  // Alrededor del Usuario
        ];

        return !restrictedAreas.some(area => 
            Math.sqrt((x - area.x) ** 2 + (y - area.y) ** 2) < area.radius
        );
    }

    buildTower(x, y) {
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
            special: config.special,
            upgradeCost: config.upgradeCost,
            name: config.name,
            description: config.description,
            icon: config.icon
        });

        console.log(`🏗️ Torre construida: ${config.name}`);
        return tower;
    }

    getTowerCost(type) {
        return this.towerConfigs[type]?.cost || 0;
    }

    updateTowerUI() {
        // Esta función será llamada desde UIManager
        console.log('🔄 Actualizando UI de torres');
    }
}

class Tower {
    constructor(config) {
        this.type = config.type;
        this.name = config.name;
        this.x = config.x;
        this.y = config.y;
        this.damage = config.damage;
        this.range = config.range;
        this.fireRate = config.fireRate;
        this.color = config.color;
        this.radius = config.radius;
        this.projectileColor = config.projectileColor;
        this.special = config.special;
        this.description = config.description;
        this.icon = config.icon;

        // Estado de la torre
        this.target = null;
        this.lastFireTime = 0;
        this.cooldown = 1.0 / this.fireRate;
        this.level = 1;
        this.upgradeCost = config.upgradeCost;

        // Efectos visuales
        this.attackEffectTimer = 0;
        this.isAttacking = false;
    }

    update(deltaTime, enemies, projectiles) {
        this.lastFireTime += deltaTime;

        if (this.lastFireTime >= this.cooldown) {
            this.target = this.findTarget(enemies);
            if (this.target) {
                this.fire(projectiles);
                this.lastFireTime = 0;
            }
        }

        // Actualizar efectos visuales
        this.updateEffects(deltaTime);
    }

    findTarget(enemies) {
        const enemiesInRange = enemies.filter(enemy => 
            Math.sqrt((this.x - enemy.x) ** 2 + (this.y - enemy.y) ** 2) <= this.range
        );

        if (enemiesInRange.length === 0) {
            return null;
        }

        // Estrategia de selección según tipo de torre
        switch (this.special) {
            case 'rapid_fire':
                // Antivirus: prioriza enemigos con poca salud
                return enemiesInRange.reduce((weakest, current) => 
                    current.health < weakest.health ? current : weakest
                );

            case 'splash':
                // IDS: busca enemigos con más enemigos cerca
                return this.findBestSplashTarget(enemiesInRange);

            case 'slow':
                // Cifrado: prioriza enemigos rápidos
                return enemiesInRange.reduce((fastest, current) => 
                    current.speed > fastest.speed ? current : fastest
                );

            case 'block':
                // Firewall: prioriza enemigos con más daño
                return enemiesInRange.reduce((strongest, current) => 
                    current.damage > strongest.damage ? current : strongest
                );

            default:
                // Torre básica: enemigo más cercano
                return enemiesInRange.reduce((closest, current) => {
                    const distCurrent = Math.sqrt((this.x - current.x) ** 2 + (this.y - current.y) ** 2);
                    const distClosest = Math.sqrt((this.x - closest.x) ** 2 + (this.y - closest.y) ** 2);
                    return distCurrent < distClosest ? current : closest;
                });
        }
    }

    findBestSplashTarget(enemies) {
        let bestTarget = enemies[0];
        let maxNearby = 0;

        enemies.forEach(enemy => {
            const nearby = enemies.filter(other => 
                Math.sqrt((enemy.x - other.x) ** 2 + (enemy.y - other.y) ** 2) <= 50
            ).length;

            if (nearby > maxNearby) {
                maxNearby = nearby;
                bestTarget = enemy;
            }
        });

        return bestTarget;
    }

    fire(projectiles) {
        if (!this.target) return;

        const projectile = new Projectile({
            x: this.x,
            y: this.y,
            target: this.target,
            damage: this.damage,
            speed: 200,
            radius: 6,
            color: this.projectileColor,
            special: this.special,
            tower: this
        });

        projectiles.push(projectile);

        // Efecto visual de ataque
        this.isAttacking = true;
        this.attackEffectTimer = 0.1;

        console.log(`🎯 ${this.name} ataca a ${this.target.name}`);
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
        if (this.level >= 3) {
            console.log('🚫 Torre ya está en nivel máximo');
            return false;
        }

        this.level++;
        this.damage = Math.floor(this.damage * 1.4);
        this.range = Math.floor(this.range * 1.15);
        this.fireRate *= 1.25;
        this.cooldown = 1.0 / this.fireRate;
        this.upgradeCost = Math.floor(this.upgradeCost * 1.5);

        console.log(`⬆️ ${this.name} mejorada a nivel ${this.level}`);
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

        // Detalles de la torre
        this.drawTowerDetails(ctx);

        // Indicador de nivel
        this.drawLevelIndicator(ctx);

        ctx.restore();
    }

    drawTowerDetails(ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Icono de la torre
        ctx.fillText(this.icon, this.x, this.y);

        // Nombre pequeño debajo
        ctx.font = '10px Arial';
        ctx.fillText(this.name, this.x, this.y + this.radius + 15);
    }

    drawLevelIndicator(ctx) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        // Estrellas según nivel
        const stars = '★'.repeat(this.level);
        ctx.fillText(stars, this.x, this.y - this.radius - 8);
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

    getInfo() {
        return {
            name: this.name,
            description: this.description,
            level: this.level,
            damage: this.damage,
            range: this.range,
            fireRate: this.fireRate.toFixed(1),
            upgradeCost: this.upgradeCost,
            special: this.getSpecialDescription(),
            nextLevel: this.level < 3 ? `Nivel ${this.level + 1}` : 'Máximo'
        };
    }

    getSpecialDescription() {
        const descriptions = {
            'block': '🛡️ Bloquea ataques enemigos',
            'slow': '🐢 Ralentiza enemigos',
            'splash': '💥 Daño en área',
            'rapid_fire': '⚡ Fuego rápido'
        };
        return descriptions[this.special] || 'Sin habilidad especial';
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
        this.tower = config.tower;

        // Efectos especiales
        this.splashRadius = this.special === 'splash' ? 50 : 0;
        this.slowAmount = this.special === 'slow' ? 0.5 : 1;
        this.slowDuration = this.special === 'slow' ? 2.0 : 0;
        this.blockDuration = this.special === 'block' ? 1.5 : 0;
    }

    update(deltaTime) {
        if (!this.target || this.target.health <= 0) {
            return false; // Proyectil debe ser eliminado
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.speed * deltaTime) {
            this.onHit();
            return false;
        }

        this.x += (dx / distance) * this.speed * deltaTime;
        this.y += (dy / distance) * this.speed * deltaTime;

        return true;
    }

    onHit() {
        console.log(`💥 Proyectil impacta a ${this.target.name}`);

        // Aplicar efectos según el tipo de torre
        switch (this.special) {
            case 'splash':
                this.applySplashDamage();
                break;
                
            case 'slow':
                this.target.slow(this.slowAmount, this.slowDuration);
                this.target.health -= this.damage;
                break;
                
            case 'block':
                this.target.blockAttacks(this.blockDuration);
                this.target.health -= this.damage;
                break;
                
            default:
                this.target.health -= this.damage;
        }

        // Verificar si el enemigo fue eliminado
        if (this.target.health <= 0) {
            console.log(`🎯 ${this.target.name} eliminado!`);
        }
    }

    applySplashDamage() {
        // Daño al objetivo principal
        this.target.health -= this.damage;
        
        // Buscar enemigos cercanos para daño en área
        const nearbyEnemies = window.game.enemies.filter(enemy => 
            enemy !== this.target && 
            Math.sqrt((this.target.x - enemy.x) ** 2 + (this.target.y - enemy.y) ** 2) <= this.splashRadius
        );
        
        nearbyEnemies.forEach(enemy => {
            const splashDamage = Math.floor(this.damage * 0.6);
            enemy.health -= splashDamage;
            console.log(`💥 Daño en área a ${enemy.name}: -${splashDamage}`);
        });
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
            ctx.arc(this.x, this.y, this.radius * 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}

// Instancia global del manager de torres
const towerManager = new TowerManager();
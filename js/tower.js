// 防御塔系统
class Tower extends HealthEntity {
    constructor(game, col, row, towerType) {
        const cellSize = CONFIG.GRID.CELL_SIZE;
        const offsetX = game.mapOffsetX || 0;
        const offsetY = game.mapOffsetY || 0;
        
        const x = offsetX + col * cellSize + cellSize / 2;
        const y = offsetY + row * cellSize + cellSize / 2;
        
        super(x, y, 18, 100);
        
        this.game = game;
        this.col = col;
        this.row = row;
        this.type = towerType;
        this.typeId = towerType.id;
        this.color = towerType.color;
        
        this.level = 1;
        this.maxLevel = towerType.upgrades ? towerType.upgrades.length + 1 : 1;
        
        this.damage = towerType.damage;
        this.range = towerType.range;
        this.attackSpeed = towerType.attackSpeed;
        this.bulletSpeed = towerType.bulletSpeed;
        this.bulletType = towerType.bulletType;
        
        this.splashRadius = towerType.splashRadius || 0;
        this.slowAmount = towerType.slowAmount || 0;
        this.slowDuration = towerType.slowDuration || 0;
        this.poisonDamage = towerType.poisonDamage || 0;
        this.poisonDuration = towerType.poisonDuration || 0;
        this.pierce = towerType.pierce || false;
        
        this.lastAttackTime = 0;
        this.target = null;
        this.angle = 0;
        this.targetAngle = 0;
        
        this.attackCooldown = 0;
    }
    
    canUpgrade() {
        return this.level < this.maxLevel;
    }
    
    getUpgradeCost() {
        if (!this.canUpgrade()) return 0;
        return this.type.upgrades[this.level - 1].cost;
    }
    
    upgrade() {
        if (!this.canUpgrade()) return false;
        
        const upgrade = this.type.upgrades[this.level - 1];
        
        this.level++;
        this.damage = upgrade.damage || this.damage;
        this.range = upgrade.range || this.range;
        this.attackSpeed = upgrade.attackSpeed || this.attackSpeed;
        
        if (upgrade.splashRadius !== undefined) this.splashRadius = upgrade.splashRadius;
        if (upgrade.slowAmount !== undefined) this.slowAmount = upgrade.slowAmount;
        if (upgrade.poisonDamage !== undefined) this.poisonDamage = upgrade.poisonDamage;
        
        this.setMaxHealth(this.maxHealth + 50, true);
        
        return true;
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        this.updateTarget();
        
        if (this.target) {
            this.updateAttack(deltaTime);
        }
        
        this.updateRotation(deltaTime);
    }
    
    updateTarget() {
        let nearestEnemy = null;
        let nearestDistance = Infinity;
        
        for (const enemy of this.game.enemies) {
            const distance = this.distanceTo(enemy);
            if (distance <= this.range && distance < nearestDistance) {
                nearestDistance = distance;
                nearestEnemy = enemy;
            }
        }
        
        this.target = nearestEnemy;
        
        if (this.target) {
            this.targetAngle = this.angleTo(this.target);
        }
    }
    
    updateAttack(deltaTime) {
        const now = Date.now();
        const attackCooldown = 1000 / this.attackSpeed;
        
        if (now - this.lastAttackTime < attackCooldown) return;
        
        if (!this.target || !this.target.active) return;
        
        if (this.bulletType === 'laser') {
            this.fireLaser();
        } else {
            this.fireBullet();
        }
        
        this.lastAttackTime = now;
    }
    
    fireBullet() {
        this.game.spawnBullet(this, this.target, this.bulletType);
    }
    
    fireLaser() {
        if (!this.target || !this.target.active) return;
        
        const hitEnemies = [];
        
        if (this.pierce) {
            for (const enemy of this.game.enemies) {
                if (this.isEnemyInLaserPath(enemy)) {
                    hitEnemies.push(enemy);
                }
            }
        } else {
            hitEnemies.push(this.target);
        }
        
        for (const enemy of hitEnemies) {
            if (enemy.active) {
                enemy.takeDamage(this.damage);
            }
        }
    }
    
    isEnemyInLaserPath(enemy) {
        const dx = this.target.centerX - this.centerX;
        const dy = this.target.centerY - this.centerY;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return false;
        
        const ex = enemy.centerX - this.centerX;
        const ey = enemy.centerY - this.centerY;
        
        const t = (ex * dx + ey * dy) / (length * length);
        
        if (t < 0 || t > 1) return false;
        
        const closestX = dx * t;
        const closestY = dy * t;
        const distance = Math.sqrt((ex - closestX) ** 2 + (ey - closestY) ** 2);
        
        return distance <= enemy.radius + 5;
    }
    
    updateRotation(deltaTime) {
        const angleDiff = this.targetAngle - this.angle;
        const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
        
        const rotationSpeed = 0.1;
        this.angle += normalizedDiff * rotationSpeed * (deltaTime / 16.67);
    }
    
    applyBulletEffect(enemy) {
        if (this.slowAmount > 0 && this.slowDuration > 0) {
            enemy.applySlow(this.slowAmount, this.slowDuration);
        }
        
        if (this.poisonDamage > 0 && this.poisonDuration > 0) {
            enemy.applyPoison(this.poisonDamage, this.poisonDuration);
        }
    }
    
    getSplashDamage() {
        return this.damage * 0.5;
    }
    
    onDamage(amount, source) {
        super.onDamage(amount, source);
        
        this.game.addParticle('build', this.centerX, this.centerY, '#ff0000');
        
        if (this.game.selectedTower === this) {
            this.game.uiManager.showTowerInfo(this);
        }
    }
    
    onDeath() {
        super.onDeath();
        
        this.game.addParticle('explosion', this.centerX, this.centerY, this.color);
        
        if (this.game.selectedTower === this) {
            this.game.selectedTower = null;
            this.game.uiManager.hideTowerInfo();
        }
        
        console.log(`防御塔 ${this.type.name} 被摧毁！`);
    }
    
    render(ctx) {
        ctx.save();
        
        const cellSize = CONFIG.GRID.CELL_SIZE;
        const offsetX = this.game.mapOffsetX || 0;
        const offsetY = this.game.mapOffsetY || 0;
        
        const cellX = offsetX + this.col * cellSize;
        const cellY = offsetY + this.row * cellSize;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(cellX + 4, cellY + 4, cellSize - 8, cellSize - 8);
        
        ctx.translate(this.centerX, this.centerY);
        ctx.rotate(this.angle);
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(5, -3, 20, 6);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.rotate(-this.angle);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.level.toString(), 0, 0);
        
        ctx.restore();
        
        if (this.bulletType === 'laser' && this.target && this.target.active) {
            this.renderLaser(ctx);
        }
        
        if (this.healthPercent < 1) {
            const healthBarWidth = this.radius * 2;
            const healthBarHeight = 3;
            const healthBarY = this.y - 5;
            
            this.renderHealthBar(ctx, this.x, healthBarY, healthBarWidth, healthBarHeight, '#333', '#4ecdc4');
        }
        
        if (this.canUpgrade()) {
            ctx.save();
            ctx.fillStyle = '#ffd700';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⬆', this.centerX, this.bottom + 5);
            ctx.restore();
        }
    }
    
    renderLaser(ctx) {
        ctx.save();
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.8;
        
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.moveTo(this.centerX, this.centerY);
        ctx.lineTo(this.target.centerX, this.target.centerY);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

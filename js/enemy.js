// 敌人系统
class Enemy extends HealthEntity {
    constructor(game, x, y, enemyType, healthMultiplier = 1) {
        super(x, y, enemyType.size, Math.floor(enemyType.health * healthMultiplier));
        
        this.game = game;
        this.type = enemyType;
        this.typeId = enemyType.id;
        this.color = enemyType.color;
        
        this.baseSpeed = enemyType.speed;
        this.speed = this.baseSpeed;
        this.damage = enemyType.damage;
        this.goldReward = enemyType.gold;
        this.expReward = enemyType.exp;
        
        this.canAttack = enemyType.canAttack || false;
        this.attackRange = enemyType.attackRange || 0;
        this.attackDamage = enemyType.attackDamage || 0;
        this.attackSpeed = enemyType.attackSpeed || 0;
        this.lastAttackTime = 0;
        
        this.pathIndex = 0;
        this.targetIndex = 1;
        
        this.slowEffect = null;
        this.poisonEffect = null;
        
        this.angle = 0;
        this.targetTower = null;
        
        this.damageCooldown = 100;
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        this.updateEffects(deltaTime);
        
        if (this.canAttack) {
            this.updateAttackBehavior(deltaTime);
        }
        
        this.moveAlongPath(deltaTime);
        
        this.checkIfReachedEnd();
    }
    
    updateEffects(deltaTime) {
        if (this.slowEffect) {
            this.slowEffect.remaining -= deltaTime;
            if (this.slowEffect.remaining <= 0) {
                this.speed = this.baseSpeed;
                this.slowEffect = null;
            }
        }
        
        if (this.poisonEffect) {
            this.poisonEffect.timer -= deltaTime;
            this.poisonEffect.remaining -= deltaTime;
            
            if (this.poisonEffect.timer <= 0 && this.poisonEffect.remaining > 0) {
                this.takeDamage(this.poisonEffect.damage);
                this.poisonEffect.timer = 1000;
            }
            
            if (this.poisonEffect.remaining <= 0) {
                this.poisonEffect = null;
            }
        }
    }
    
    updateAttackBehavior(deltaTime) {
        const now = Date.now();
        const attackCooldown = 1000 / this.attackSpeed;
        
        if (now - this.lastAttackTime < attackCooldown) return;
        
        let nearestTower = null;
        let nearestDistance = Infinity;
        
        for (const tower of this.game.towers) {
            const distance = this.distanceTo(tower);
            if (distance <= this.attackRange && distance < nearestDistance) {
                nearestDistance = distance;
                nearestTower = tower;
            }
        }
        
        if (nearestTower) {
            this.targetTower = nearestTower;
            nearestTower.takeDamage(this.attackDamage);
            this.lastAttackTime = now;
            
            this.game.addParticle('build', nearestTower.centerX, nearestTower.centerY, '#ff0000');
        }
    }
    
    moveAlongPath(deltaTime) {
        if (this.targetIndex < 0) return;
        
        const path = this.game.map.getPath();
        if (this.targetIndex >= path.length) {
            this.targetIndex = -1;
            return;
        }
        
        const targetCell = path[this.targetIndex];
        const targetPos = this.game.map.getCellCenter(targetCell.col, targetCell.row);
        
        const dx = targetPos.x - this.centerX;
        const dy = targetPos.y - this.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 1) {
            const moveSpeed = this.speed * (deltaTime / 16.67) * 2;
            const ratio = Math.min(moveSpeed / distance, 1);
            
            this.x += dx * ratio;
            this.y += dy * ratio;
            
            this.angle = Math.atan2(dy, dx);
        } else {
            this.pathIndex = this.targetIndex;
            this.targetIndex = this.game.map.getNextPathIndex(this.pathIndex);
        }
    }
    
    checkIfReachedEnd() {
        const endPos = this.game.map.getEndPosition();
        const endCellCenter = this.game.map.getCellCenter(endPos.col, endPos.row);
        
        const distance = Utils.distance(this.centerX, this.centerY, endCellCenter.x, endCellCenter.y);
        
        if (distance < this.radius + 5) {
            this.game.onEnemyReachedBase(this);
            this.destroy();
        }
    }
    
    applySlow(amount, duration) {
        this.slowEffect = {
            amount,
            remaining: duration,
            total: duration
        };
        this.speed = this.baseSpeed * amount;
    }
    
    applyPoison(damage, duration) {
        this.poisonEffect = {
            damage,
            remaining: duration,
            total: duration,
            timer: 1000
        };
    }
    
    onDeath() {
        super.onDeath();
        this.game.onEnemyKilled(this);
    }
    
    render(ctx) {
        ctx.save();
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        const eyeOffset = this.radius * 0.4;
        const eyeSize = this.radius * 0.2;
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.centerX + Math.cos(this.angle) * eyeOffset - Math.sin(this.angle) * eyeSize, 
                this.centerY + Math.sin(this.angle) * eyeOffset + Math.cos(this.angle) * eyeSize, 
                eyeSize, 0, Math.PI * 2);
        ctx.arc(this.centerX + Math.cos(this.angle) * eyeOffset + Math.sin(this.angle) * eyeSize, 
                this.centerY + Math.sin(this.angle) * eyeOffset - Math.cos(this.angle) * eyeSize, 
                eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.centerX + Math.cos(this.angle) * (eyeOffset + eyeSize * 0.3) - Math.sin(this.angle) * eyeSize, 
                this.centerY + Math.sin(this.angle) * (eyeOffset + eyeSize * 0.3) + Math.cos(this.angle) * eyeSize, 
                eyeSize * 0.5, 0, Math.PI * 2);
        ctx.arc(this.centerX + Math.cos(this.angle) * (eyeOffset + eyeSize * 0.3) + Math.sin(this.angle) * eyeSize, 
                this.centerY + Math.sin(this.angle) * (eyeOffset + eyeSize * 0.3) - Math.cos(this.angle) * eyeSize, 
                eyeSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        if (this.slowEffect) {
            ctx.strokeStyle = '#74b9ff';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, this.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        
        if (this.poisonEffect) {
            ctx.strokeStyle = '#00b894';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.5;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, this.radius + 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;
        }
        
        const healthBarWidth = this.radius * 2;
        const healthBarHeight = 4;
        const healthBarY = this.y - 8;
        
        this.renderHealthBar(ctx, this.x, healthBarY, healthBarWidth, healthBarHeight, '#333', 
            this.healthPercent > 0.5 ? '#00ff64' : this.healthPercent > 0.25 ? '#fdcb6e' : '#ff6b6b');
        
        if (this.canAttack && this.targetTower) {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(this.centerX, this.centerY);
            ctx.lineTo(this.targetTower.centerX, this.targetTower.centerY);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        ctx.restore();
    }
}

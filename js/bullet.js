// 子弹系统
class Bullet extends Entity {
    constructor(game, tower, target, bulletType) {
        super(tower.centerX, tower.centerY, 8, 8);
        
        this.game = game;
        this.tower = tower;
        this.target = target;
        
        this.typeId = bulletType;
        this.type = CONFIG.BULLET_TYPES[bulletType.toUpperCase()];
        
        this.color = this.type.color;
        this.size = this.type.size;
        this.hasParabola = this.type.hasParabola;
        this.parabolaHeight = this.type.parabolaHeight || 0;
        
        this.damage = tower.damage;
        this.speed = tower.bulletSpeed;
        
        this.startX = tower.centerX;
        this.startY = tower.centerY;
        this.targetX = target.centerX;
        this.targetY = target.centerY;
        
        this.distance = Utils.distance(this.startX, this.startY, this.targetX, this.targetY);
        this.traveled = 0;
        this.progress = 0;
        
        this.angle = Utils.angle(this.startX, this.startY, this.targetX, this.targetY);
        
        this.splashRadius = tower.splashRadius || 0;
        this.slowAmount = tower.slowAmount || 0;
        this.slowDuration = tower.slowDuration || 0;
        this.poisonDamage = tower.poisonDamage || 0;
        this.poisonDuration = tower.poisonDuration || 0;
        
        this.hasHit = false;
        this.targetLastPosition = { x: target.centerX, y: target.centerY };
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        if (!this.active || this.hasHit) return;
        
        if (this.target && this.target.active) {
            this.targetLastPosition.x = this.target.centerX;
            this.targetLastPosition.y = this.target.centerY;
        }
        
        const moveDistance = this.speed * (deltaTime / 16.67);
        
        if (this.hasParabola) {
            this.traveled += moveDistance;
            this.progress = Math.min(this.traveled / this.distance, 1);
            
            const pos = Utils.parabolicTrajectory(
                this.startX, this.startY,
                this.targetLastPosition.x, this.targetLastPosition.y,
                this.parabolaHeight,
                this.progress
            );
            
            this.setPosition(pos.x, pos.y);
        } else {
            const dx = this.targetLastPosition.x - this.centerX;
            const dy = this.targetLastPosition.y - this.centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
                const ratio = Math.min(moveDistance / dist, 1);
                this.x += dx * ratio;
                this.y += dy * ratio;
                this.angle = Math.atan2(dy, dx);
            }
        }
        
        this.checkCollisions();
        
        this.checkOutOfBounds();
    }
    
    checkCollisions() {
        for (const enemy of this.game.enemies) {
            if (!enemy.active) continue;
            
            const distance = Utils.distance(this.centerX, this.centerY, enemy.centerX, enemy.centerY);
            
            if (distance < this.size + enemy.radius) {
                this.hit(enemy);
                return;
            }
        }
    }
    
    checkOutOfBounds() {
        const mapWidth = CONFIG.GRID.COLS * CONFIG.GRID.CELL_SIZE;
        const mapHeight = CONFIG.GRID.ROWS * CONFIG.GRID.CELL_SIZE;
        const offsetX = this.game.mapOffsetX || 0;
        const offsetY = this.game.mapOffsetY || 0;
        
        const margin = 100;
        
        if (this.centerX < offsetX - margin || 
            this.centerX > offsetX + mapWidth + margin ||
            this.centerY < offsetY - margin || 
            this.centerY > offsetY + mapHeight + margin) {
            this.destroy();
        }
        
        if (this.progress >= 1) {
            this.destroy();
        }
    }
    
    hit(target) {
        if (this.hasHit) return;
        this.hasHit = true;
        
        target.takeDamage(this.damage);
        
        this.applyEffects(target);
        
        if (this.splashRadius > 0) {
            this.applySplashDamage(target);
        }
        
        this.game.addParticle('explosion', this.centerX, this.centerY, this.color);
        
        this.destroy();
    }
    
    applyEffects(enemy) {
        if (this.slowAmount > 0 && this.slowDuration > 0) {
            enemy.applySlow(this.slowAmount, this.slowDuration);
        }
        
        if (this.poisonDamage > 0 && this.poisonDuration > 0) {
            enemy.applyPoison(this.poisonDamage, this.poisonDuration);
        }
    }
    
    applySplashDamage(hitTarget) {
        const splashDamage = this.tower.getSplashDamage ? this.tower.getSplashDamage() : this.damage * 0.5;
        
        for (const enemy of this.game.enemies) {
            if (!enemy.active || enemy === hitTarget) continue;
            
            const distance = Utils.distance(this.centerX, this.centerY, enemy.centerX, enemy.centerY);
            
            if (distance < this.splashRadius) {
                const damageRatio = 1 - (distance / this.splashRadius) * 0.5;
                enemy.takeDamage(splashDamage * damageRatio);
                
                this.applyEffects(enemy);
            }
        }
    }
    
    render(ctx) {
        ctx.save();
        
        ctx.translate(this.centerX, this.centerY);
        ctx.rotate(this.angle);
        
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 5;
        
        if (this.hasParabola) {
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(this.size, 0);
            ctx.lineTo(-this.size, -this.size / 2);
            ctx.lineTo(-this.size / 2, 0);
            ctx.lineTo(-this.size, this.size / 2);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.shadowBlur = 0;
        
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-this.speed * 2, 0);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.size;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        ctx.restore();
    }
}

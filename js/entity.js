// 实体基类
class Entity {
    constructor(x = 0, y = 0, width = 0, height = 0) {
        this.id = Entity.generateId();
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.active = true;
        this.visible = true;
    }
    
    static generateId() {
        return `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    get centerX() {
        return this.x + this.width / 2;
    }
    
    get centerY() {
        return this.y + this.height / 2;
    }
    
    get left() {
        return this.x;
    }
    
    get right() {
        return this.x + this.width;
    }
    
    get top() {
        return this.y;
    }
    
    get bottom() {
        return this.y + this.height;
    }
    
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
    
    setSize(width, height) {
        this.width = width;
        this.height = height;
    }
    
    distanceTo(other) {
        return Utils.distance(this.centerX, this.centerY, other.centerX, other.centerY);
    }
    
    distanceToPoint(x, y) {
        return Utils.distance(this.centerX, this.centerY, x, y);
    }
    
    angleTo(other) {
        return Utils.angle(this.centerX, this.centerY, other.centerX, other.centerY);
    }
    
    angleToPoint(x, y) {
        return Utils.angle(this.centerX, this.centerY, x, y);
    }
    
    collidesWith(other) {
        return Utils.rectCollision(
            this.x, this.y, this.width, this.height,
            other.x, other.y, other.width, other.height
        );
    }
    
    containsPoint(x, y) {
        return Utils.pointInRect(x, y, this.x, this.y, this.width, this.height);
    }
    
    update(deltaTime) {
    }
    
    render(ctx) {
    }
    
    destroy() {
        this.active = false;
    }
}

// 圆形实体基类
class CircularEntity extends Entity {
    constructor(x = 0, y = 0, radius = 0) {
        super(x - radius, y - radius, radius * 2, radius * 2);
        this.radius = radius;
    }
    
    setRadius(radius) {
        this.radius = radius;
        this.width = radius * 2;
        this.height = radius * 2;
        this.x = this.centerX - radius;
        this.y = this.centerY - radius;
    }
    
    setPosition(x, y) {
        this.x = x - this.radius;
        this.y = y - this.radius;
    }
    
    collidesWith(other) {
        if (other instanceof CircularEntity) {
            return Utils.circleCollision(
                this.centerX, this.centerY, this.radius,
                other.centerX, other.centerY, other.radius
            );
        }
        return super.collidesWith(other);
    }
    
    containsPoint(x, y) {
        return Utils.pointInCircle(x, y, this.centerX, this.centerY, this.radius);
    }
}

// 可移动实体基类
class MovableEntity extends CircularEntity {
    constructor(x = 0, y = 0, radius = 0) {
        super(x, y, radius);
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 1;
        this.maxSpeed = 10;
        this.friction = 0.98;
    }
    
    setVelocity(vx, vy) {
        this.velocityX = vx;
        this.velocityY = vy;
    }
    
    setVelocityFromAngle(angle, speed) {
        this.velocityX = Math.cos(angle) * speed;
        this.velocityY = Math.sin(angle) * speed;
    }
    
    getSpeed() {
        return Math.sqrt(this.velocityX ** 2 + this.velocityY ** 2);
    }
    
    getAngle() {
        return Math.atan2(this.velocityY, this.velocityX);
    }
    
    applyForce(fx, fy) {
        this.velocityX += fx;
        this.velocityY += fy;
    }
    
    applyForceFromAngle(angle, magnitude) {
        this.velocityX += Math.cos(angle) * magnitude;
        this.velocityY += Math.sin(angle) * magnitude;
    }
    
    limitSpeed(maxSpeed) {
        const currentSpeed = this.getSpeed();
        if (currentSpeed > maxSpeed) {
            const ratio = maxSpeed / currentSpeed;
            this.velocityX *= ratio;
            this.velocityY *= ratio;
        }
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        const speedMultiplier = this.speed * (deltaTime / 16.67);
        
        this.x += this.velocityX * speedMultiplier;
        this.y += this.velocityY * speedMultiplier;
        
        this.velocityX *= this.friction;
        this.velocityY *= this.friction;
    }
    
    stop() {
        this.velocityX = 0;
        this.velocityY = 0;
    }
}

// 有生命值的实体基类
class HealthEntity extends MovableEntity {
    constructor(x = 0, y = 0, radius = 0, maxHealth = 100) {
        super(x, y, radius);
        this.maxHealth = maxHealth;
        this.health = maxHealth;
        this.invulnerable = false;
        this.invulnerableTime = 0;
        this.lastDamageTime = 0;
        this.damageCooldown = 0;
    }
    
    get healthPercent() {
        return this.health / this.maxHealth;
    }
    
    get isDead() {
        return this.health <= 0;
    }
    
    setMaxHealth(maxHealth, heal = false) {
        this.maxHealth = maxHealth;
        if (heal) {
            this.health = maxHealth;
        }
    }
    
    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }
    
    takeDamage(amount, source = null) {
        if (this.invulnerable) return false;
        
        if (this.damageCooldown > 0) {
            const now = Date.now();
            if (now - this.lastDamageTime < this.damageCooldown) {
                return false;
            }
        }
        
        this.health -= amount;
        this.lastDamageTime = Date.now();
        
        this.onDamage(amount, source);
        
        if (this.health <= 0) {
            this.health = 0;
            this.onDeath();
        }
        
        return true;
    }
    
    setInvulnerable(duration = 1000) {
        this.invulnerable = true;
        this.invulnerableTime = duration;
        
        if (duration > 0) {
            setTimeout(() => {
                this.invulnerable = false;
            }, duration);
        }
    }
    
    onDamage(amount, source) {
    }
    
    onDeath() {
        this.destroy();
    }
    
    renderHealthBar(ctx, x, y, width, height = 4, backgroundColor = '#333', foregroundColor = '#ff6b6b') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(x, y, width, height);
        
        const fillWidth = width * this.healthPercent;
        ctx.fillStyle = foregroundColor;
        ctx.fillRect(x, y, fillWidth, height);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }
}

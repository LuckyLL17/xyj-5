// 游戏核心引擎
class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 0;
        this.height = 0;
        
        this.state = CONFIG.GAME_STATES.LOADING;
        this.previousState = null;
        
        this.lastTime = 0;
        this.deltaTime = 0;
        this.elapsedTime = 0;
        this.frameCount = 0;
        this.fps = 0;
        
        this.gameSpeed = CONFIG.GAME_SPEED.NORMAL;
        this.isPaused = false;
        
        this.entities = [];
        this.towers = [];
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        
        this.gold = CONFIG.INITIAL.GOLD;
        this.baseHealth = CONFIG.INITIAL.BASE_HEALTH;
        this.kills = CONFIG.INITIAL.KILLS;
        this.currentWave = CONFIG.INITIAL.WAVE;
        
        this.map = null;
        this.waveManager = null;
        this.levelManager = null;
        this.uiManager = null;
        
        this.selectedTowerType = null;
        this.selectedTower = null;
        
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDown = false;
        
        this.animationFrameId = null;
    }
    
    async init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.setupEventListeners();
        
        this.map = new GameMap(this);
        await this.map.generate();
        
        this.waveManager = new WaveManager(this);
        this.levelManager = new LevelManager(this);
        this.uiManager = new UIManager(this);
        
        await this.levelManager.init();
        this.uiManager.init();
        
        this.state = CONFIG.GAME_STATES.WAVE_PREPARE;
        
        document.getElementById('loading-overlay').style.display = 'none';
        
        this.startGameLoop();
    }
    
    resize() {
        const container = document.getElementById('game-container');
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        const { COLS, ROWS, CELL_SIZE } = CONFIG.GRID;
        const mapWidth = COLS * CELL_SIZE;
        const mapHeight = ROWS * CELL_SIZE;
        
        this.mapOffsetX = (this.width - mapWidth) / 2;
        this.mapOffsetY = (this.height - mapHeight) / 2 - 40;
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('click', (e) => this.onClick(e));
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
            this.onMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.onMouseUp(e);
            if (e.changedTouches.length > 0) {
                const touch = e.changedTouches[0];
                this.onClick({ clientX: touch.clientX, clientY: touch.clientY });
            }
        });
        
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
    }
    
    getCanvasPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    getGridPosition(canvasX, canvasY) {
        const gridX = canvasX - this.mapOffsetX;
        const gridY = canvasY - this.mapOffsetY;
        
        const col = Math.floor(gridX / CONFIG.GRID.CELL_SIZE);
        const row = Math.floor(gridY / CONFIG.GRID.CELL_SIZE);
        
        return { col, row };
    }
    
    isPositionInMap(col, row) {
        return col >= 0 && col < CONFIG.GRID.COLS && row >= 0 && row < CONFIG.GRID.ROWS;
    }
    
    onMouseMove(e) {
        const pos = this.getCanvasPosition(e);
        this.mouseX = pos.x;
        this.mouseY = pos.y;
        
        if (this.selectedTowerType) {
            const gridPos = this.getGridPosition(pos.x, pos.y);
            if (this.isPositionInMap(gridPos.col, gridPos.row)) {
                this.hoverCell = gridPos;
            } else {
                this.hoverCell = null;
            }
        } else {
            this.hoverCell = null;
        }
    }
    
    onMouseDown(e) {
        this.mouseDown = true;
    }
    
    onMouseUp(e) {
        this.mouseDown = false;
    }
    
    onClick(e) {
        const pos = this.getCanvasPosition(e);
        const gridPos = this.getGridPosition(pos.x, pos.y);
        
        if (!this.isPositionInMap(gridPos.col, gridPos.row)) {
            this.selectedTowerType = null;
            this.selectedTower = null;
            this.uiManager.hideTowerInfo();
            this.uiManager.deselectTowerTypes();
            return;
        }
        
        if (this.selectedTowerType) {
            const buildSuccess = this.tryBuildTower(gridPos.col, gridPos.row);
            
            if (!buildSuccess && !this.canBuildAt(gridPos.col, gridPos.row)) {
                const clickedTower = this.getTowerAt(gridPos.col, gridPos.row);
                if (clickedTower) {
                    this.selectedTowerType = null;
                    this.selectedTower = clickedTower;
                    this.uiManager.hideTowerInfo();
                    this.uiManager.deselectTowerTypes();
                    this.uiManager.showTowerInfo(clickedTower);
                }
            }
            return;
        }
        
        const clickedTower = this.getTowerAt(gridPos.col, gridPos.row);
        if (clickedTower) {
            this.selectedTower = clickedTower;
            this.uiManager.showTowerInfo(clickedTower);
        } else {
            this.selectedTower = null;
            this.uiManager.hideTowerInfo();
        }
    }
    
    onKeyDown(e) {
        switch (e.key) {
            case 'Escape':
                this.selectedTowerType = null;
                this.selectedTower = null;
                this.uiManager.hideTowerInfo();
                this.uiManager.deselectTowerTypes();
                break;
            case ' ':
                e.preventDefault();
                if (this.state === CONFIG.GAME_STATES.WAVE_PREPARE) {
                    this.waveManager.startWave();
                }
                break;
            case 'p':
            case 'P':
                this.togglePause();
                break;
        }
    }
    
    getTowerAt(col, row) {
        return this.towers.find(tower => tower.col === col && tower.row === row);
    }
    
    canBuildAt(col, row) {
        if (!this.isPositionInMap(col, row)) return false;
        if (this.map.isPathCell(col, row)) return false;
        if (this.getTowerAt(col, row)) return false;
        return true;
    }
    
    tryBuildTower(col, row) {
        if (!this.selectedTowerType) return false;
        if (!this.canBuildAt(col, row)) return false;
        
        const towerType = CONFIG.TOWER_TYPES[this.selectedTowerType.toUpperCase()];
        if (!towerType) return false;
        
        if (this.gold < towerType.cost) {
            console.log('金币不足');
            return false;
        }
        
        this.gold -= towerType.cost;
        
        const tower = new Tower(this, col, row, towerType);
        this.towers.push(tower);
        this.entities.push(tower);
        
        this.uiManager.updateStats();
        
        this.addParticle('build', tower.centerX, tower.centerY, towerType.color);
        
        return true;
    }
    
    upgradeTower(tower) {
        if (!tower.canUpgrade()) return false;
        
        const upgradeCost = tower.getUpgradeCost();
        if (this.gold < upgradeCost) {
            console.log('金币不足');
            return false;
        }
        
        this.gold -= upgradeCost;
        tower.upgrade();
        
        this.uiManager.updateStats();
        this.uiManager.showTowerInfo(tower);
        
        this.addParticle('upgrade', tower.centerX, tower.centerY, '#ffd700');
        
        return true;
    }
    
    spawnEnemy(enemyConfig) {
        const startPos = this.map.getStartPosition();
        const cellSize = CONFIG.GRID.CELL_SIZE;
        
        const x = this.mapOffsetX + startPos.col * cellSize + cellSize / 2;
        const y = this.mapOffsetY + startPos.row * cellSize + cellSize / 2;
        
        const enemyType = CONFIG.ENEMY_TYPES[enemyConfig.type.toUpperCase()];
        if (!enemyType) return null;
        
        const enemy = new Enemy(this, x, y, enemyType, enemyConfig.healthMultiplier);
        this.enemies.push(enemy);
        this.entities.push(enemy);
        
        return enemy;
    }
    
    spawnBullet(tower, target, bulletType) {
        const bullet = new Bullet(this, tower, target, bulletType);
        this.bullets.push(bullet);
        this.entities.push(bullet);
        
        return bullet;
    }
    
    addParticle(type, x, y, color = '#fff') {
        const particle = {
            id: Entity.generateId(),
            type,
            x,
            y,
            color,
            life: 1,
            maxLife: 1,
            size: type === 'explosion' ? 30 : 20,
            active: true
        };
        
        this.particles.push(particle);
    }
    
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
        }
        
        if (entity instanceof Tower) {
            const towerIndex = this.towers.indexOf(entity);
            if (towerIndex > -1) this.towers.splice(towerIndex, 1);
        } else if (entity instanceof Enemy) {
            const enemyIndex = this.enemies.indexOf(entity);
            if (enemyIndex > -1) this.enemies.splice(enemyIndex, 1);
        } else if (entity instanceof Bullet) {
            const bulletIndex = this.bullets.indexOf(entity);
            if (bulletIndex > -1) this.bullets.splice(bulletIndex, 1);
        }
    }
    
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.life -= deltaTime / 500;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    renderParticles(ctx) {
        for (const particle of this.particles) {
            const alpha = particle.life / particle.maxLife;
            const size = particle.size * (1 - particle.life * 0.5);
            
            ctx.save();
            ctx.globalAlpha = alpha;
            
            if (particle.type === 'explosion') {
                const gradient = ctx.createRadialGradient(
                    particle.x, particle.y, 0,
                    particle.x, particle.y, size
                );
                gradient.addColorStop(0, particle.color);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.strokeStyle = particle.color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, size * (1 - alpha), 0, Math.PI * 2);
                ctx.stroke();
            }
            
            ctx.restore();
        }
    }
    
    onEnemyKilled(enemy) {
        this.kills++;
        this.gold += enemy.goldReward;
        this.levelManager.addExperience(enemy.expReward);
        
        this.addParticle('explosion', enemy.centerX, enemy.centerY, enemy.color);
        
        this.uiManager.updateStats();
    }
    
    onEnemyReachedBase(enemy) {
        this.baseHealth -= enemy.damage;
        this.uiManager.updateStats();
        
        if (this.baseHealth <= 0) {
            this.gameOver();
        }
    }
    
    gameOver() {
        this.state = CONFIG.GAME_STATES.GAME_OVER;
        
        const score = Utils.calculateScore(this.currentWave, this.kills);
        
        this.levelManager.updateUserData({
            totalKills: this.kills,
            totalWaves: this.currentWave,
            highScore: Math.max(this.levelManager.userData.highScore, score)
        });
        
        this.uiManager.showGameOver(score);
    }
    
    restart() {
        this.entities = [];
        this.towers = [];
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        
        this.gold = CONFIG.INITIAL.GOLD;
        this.baseHealth = CONFIG.INITIAL.BASE_HEALTH;
        this.kills = CONFIG.INITIAL.KILLS;
        this.currentWave = CONFIG.INITIAL.WAVE;
        
        this.selectedTowerType = null;
        this.selectedTower = null;
        
        this.state = CONFIG.GAME_STATES.WAVE_PREPARE;
        
        this.uiManager.updateStats();
        this.uiManager.hideTowerInfo();
        this.uiManager.deselectTowerTypes();
        this.uiManager.hideGameOver();
        this.uiManager.updateStartWaveButton();
    }
    
    togglePause() {
        if (this.state === CONFIG.GAME_STATES.WAVE_RUNNING) {
            this.previousState = this.state;
            this.state = CONFIG.GAME_STATES.PAUSED;
            this.isPaused = true;
        } else if (this.state === CONFIG.GAME_STATES.PAUSED) {
            this.state = this.previousState || CONFIG.GAME_STATES.WAVE_PREPARE;
            this.isPaused = false;
        }
    }
    
    startGameLoop() {
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    gameLoop() {
        const currentTime = performance.now();
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.elapsedTime += this.deltaTime;
        this.frameCount++;
        
        if (this.elapsedTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.elapsedTime = 0;
        }
        
        const adjustedDeltaTime = this.deltaTime * this.gameSpeed;
        
        if (this.state !== CONFIG.GAME_STATES.PAUSED && this.state !== CONFIG.GAME_STATES.GAME_OVER) {
            this.update(adjustedDeltaTime);
        }
        
        this.render();
        
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            if (entity.active) {
                entity.update(deltaTime);
            } else {
                this.removeEntity(entity);
            }
        }
        
        this.updateParticles(deltaTime);
        
        if (this.waveManager) {
            this.waveManager.update(deltaTime);
            
            if (this.state === CONFIG.GAME_STATES.WAVE_PREPARE && this.waveManager.isAutoStartEnabled) {
                if (!this.lastUIUpdateTime || Date.now() - this.lastUIUpdateTime > 1000) {
                    this.uiManager.updateStartWaveButton();
                    this.lastUIUpdateTime = Date.now();
                }
            }
        }
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        if (this.map) {
            this.map.render(this.ctx);
        }
        
        this.renderForbiddenAreas();
        
        for (const entity of this.entities) {
            if (entity.visible && entity.active) {
                entity.render(this.ctx);
            }
        }
        
        this.renderParticles(this.ctx);
        
        this.renderSelectedTowerRange();
        
        this.renderBuildPreview();
    }
    
    renderForbiddenAreas() {
        if (!this.selectedTowerType) return;
        
        const towerType = CONFIG.TOWER_TYPES[this.selectedTowerType.toUpperCase()];
        if (!towerType) return;
        
        const canAfford = this.gold >= towerType.cost;
        const cellSize = CONFIG.GRID.CELL_SIZE;
        
        this.ctx.save();
        this.ctx.globalAlpha = canAfford ? 0.25 : 0.4;
        this.ctx.fillStyle = canAfford ? 'rgba(255, 100, 100, 0.25)' : 'rgba(255, 0, 0, 0.4)';
        this.ctx.strokeStyle = canAfford ? 'rgba(255, 100, 100, 0.6)' : 'rgba(255, 0, 0, 0.7)';
        this.ctx.lineWidth = 1;
        
        for (const cell of this.map.path) {
            const x = this.mapOffsetX + cell.col * cellSize;
            const y = this.mapOffsetY + cell.row * cellSize;
            this.ctx.fillRect(x, y, cellSize, cellSize);
            this.ctx.strokeRect(x, y, cellSize, cellSize);
        }
        
        this.ctx.restore();
        
        if (this.hoverCell) {
            const { col, row } = this.hoverCell;
            if (this.isPositionInMap(col, row)) {
                const isPath = this.map.isPathCell(col, row);
                const hasTower = this.getTowerAt(col, row);
                
                if (isPath || hasTower) {
                    const x = this.mapOffsetX + col * cellSize;
                    const y = this.mapOffsetY + row * cellSize;
                    
                    this.ctx.save();
                    this.ctx.globalAlpha = 0.7;
                    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                    this.ctx.strokeStyle = '#ff0000';
                    this.ctx.lineWidth = 3;
                    this.ctx.fillRect(x, y, cellSize, cellSize);
                    this.ctx.strokeRect(x, y, cellSize, cellSize);
                    this.ctx.restore();
                }
            }
        }
    }
    
    renderSelectedTowerRange() {
        if (this.selectedTower) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillStyle = CONFIG.COLORS.RANGE;
            this.ctx.strokeStyle = CONFIG.COLORS.SELECTED;
            this.ctx.lineWidth = 2;
            
            this.ctx.beginPath();
            this.ctx.arc(this.selectedTower.centerX, this.selectedTower.centerY, this.selectedTower.range, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            this.ctx.restore();
        }
    }
    
    renderBuildPreview() {
        if (!this.selectedTowerType || !this.hoverCell) return;
        if (this.state !== CONFIG.GAME_STATES.WAVE_PREPARE && this.state !== CONFIG.GAME_STATES.WAVE_RUNNING) return;
        
        const { col, row } = this.hoverCell;
        if (!this.isPositionInMap(col, row)) return;
        
        const cellSize = CONFIG.GRID.CELL_SIZE;
        const x = this.mapOffsetX + col * cellSize;
        const y = this.mapOffsetY + row * cellSize;
        const centerX = x + cellSize / 2;
        const centerY = y + cellSize / 2;
        
        const canBuild = this.canBuildAt(col, row);
        const towerType = CONFIG.TOWER_TYPES[this.selectedTowerType.toUpperCase()];
        const canAfford = towerType ? this.gold >= towerType.cost : false;
        
        this.ctx.save();
        
        this.ctx.globalAlpha = 0.6;
        
        if (!canAfford) {
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
            this.ctx.strokeStyle = '#ff0000';
        } else {
            this.ctx.fillStyle = canBuild ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)';
            this.ctx.strokeStyle = canBuild ? '#00ff00' : '#ff0000';
        }
        
        this.ctx.lineWidth = 2;
        this.ctx.fillRect(x, y, cellSize, cellSize);
        this.ctx.strokeRect(x, y, cellSize, cellSize);
        
        if (towerType) {
            this.ctx.globalAlpha = 0.3;
            
            if (!canAfford) {
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            } else {
                this.ctx.fillStyle = CONFIG.COLORS.RANGE;
            }
            
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, towerType.range, 0, Math.PI * 2);
            this.ctx.fill();
            
            if (!canAfford) {
                this.ctx.strokeStyle = '#ff0000';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
            
            this.ctx.globalAlpha = 0.8;
            this.ctx.fillStyle = towerType.color;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
            this.ctx.fill();
            
            if (!canAfford) {
                this.ctx.strokeStyle = '#ff0000';
                this.ctx.lineWidth = 4;
                this.ctx.beginPath();
                this.ctx.moveTo(centerX - 10, centerY - 10);
                this.ctx.lineTo(centerX + 10, centerY + 10);
                this.ctx.moveTo(centerX + 10, centerY - 10);
                this.ctx.lineTo(centerX - 10, centerY + 10);
                this.ctx.stroke();
                
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, 18, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        }
        
        this.ctx.restore();
    }
}

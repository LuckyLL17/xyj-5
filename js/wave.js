// 波次系统
class WaveManager {
    constructor(game) {
        this.game = game;
        
        this.currentWave = 0;
        this.totalEnemies = 0;
        this.spawnedEnemies = 0;
        this.killedEnemies = 0;
        
        this.isWaveActive = false;
        this.isPaused = false;
        
        this.spawnTimer = 0;
        this.spawnInterval = CONFIG.WAVE.SPAWN_INTERVAL;
        this.enemyQueue = [];
        this.currentEnemyIndex = 0;
        
        this.waveConfig = null;
        
        this.autoStartTimer = 0;
        this.autoStartDelay = 3000;
        this.isAutoStartEnabled = true;
    }
    
    async startWave() {
        if (this.isWaveActive) return;
        
        this.currentWave = this.game.currentWave + 1;
        this.game.currentWave = this.currentWave;
        
        this.autoStartTimer = 0;
        this.isWaveStarting = true;
        
        this.game.uiManager.updateStartWaveButton();
        this.game.uiManager.showWaveText(`第 ${this.currentWave} 波准备中...`);
        
        const response = await MockAPI.getWaveEnemies(this.currentWave);
        
        this.isWaveStarting = false;
        
        if (response.success && response.data.enemies.length > 0) {
            this.game.state = CONFIG.GAME_STATES.WAVE_RUNNING;
            this.isWaveActive = true;
            
            this.waveConfig = response.data;
            this.enemyQueue = response.data.enemies;
            this.totalEnemies = response.data.totalEnemies;
            this.spawnedEnemies = 0;
            this.killedEnemies = 0;
            this.currentEnemyIndex = 0;
            
            this.spawnInterval = Math.max(
                CONFIG.WAVE.MIN_SPAWN_INTERVAL,
                CONFIG.WAVE.SPAWN_INTERVAL - (this.currentWave - 1) * CONFIG.WAVE.SPAWN_INTERVAL_DECREMENT
            );
            
            this.spawnTimer = 0;
            
            if (this.enemyQueue.length > 0) {
                this.spawnEnemy();
            }
            
            this.game.uiManager.updateStats();
            this.game.uiManager.showWaveText(`第 ${this.currentWave} 波`);
        } else {
            console.warn(`第 ${this.currentWave} 波没有敌人配置，自动跳过...`);
            this.completeWave();
        }
    }
    
    update(deltaTime) {
        if (!this.isWaveActive && this.isAutoStartEnabled && this.game.state === CONFIG.GAME_STATES.WAVE_PREPARE) {
            this.autoStartTimer += deltaTime;
            
            if (this.autoStartTimer >= this.autoStartDelay) {
                this.startWave();
                return;
            }
        }
        
        if (!this.isWaveActive || this.isPaused) return;
        
        this.spawnTimer += deltaTime;
        
        if (this.spawnTimer >= this.spawnInterval && this.currentEnemyIndex < this.enemyQueue.length) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }
        
        this.checkWaveComplete();
    }
    
    spawnEnemy() {
        if (this.currentEnemyIndex >= this.enemyQueue.length) return;
        
        const enemyConfig = this.enemyQueue[this.currentEnemyIndex];
        this.game.spawnEnemy(enemyConfig);
        
        this.spawnedEnemies++;
        this.currentEnemyIndex++;
    }
    
    checkWaveComplete() {
        if (!this.isWaveActive || this.totalEnemies === 0) return;
        
        const allSpawned = this.spawnedEnemies >= this.totalEnemies;
        const allDead = this.game.enemies.length === 0;
        
        if (allSpawned && allDead) {
            this.completeWave();
        }
    }
    
    completeWave() {
        this.isWaveActive = false;
        this.game.state = CONFIG.GAME_STATES.WAVE_PREPARE;
        
        const waveBonus = this.currentWave * 20;
        this.game.gold += waveBonus;
        
        this.game.uiManager.updateStats();
        this.game.uiManager.updateStartWaveButton();
        this.game.uiManager.hideWaveText();
        
        this.game.uiManager.showNotification(`第 ${this.currentWave} 波完成！获得 ${waveBonus} 金币`);
    }
    
    pauseWave() {
        this.isPaused = true;
    }
    
    resumeWave() {
        this.isPaused = false;
    }
    
    getWaveProgress() {
        return {
            currentWave: this.currentWave,
            totalEnemies: this.totalEnemies,
            spawnedEnemies: this.spawnedEnemies,
            killedEnemies: this.game.kills,
            remainingEnemies: this.game.enemies.length,
            isActive: this.isWaveActive
        };
    }
    
    reset() {
        this.currentWave = 0;
        this.totalEnemies = 0;
        this.spawnedEnemies = 0;
        this.killedEnemies = 0;
        this.isWaveActive = false;
        this.isPaused = false;
        this.spawnTimer = 0;
        this.enemyQueue = [];
        this.currentEnemyIndex = 0;
        this.waveConfig = null;
    }
}

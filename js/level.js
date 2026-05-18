// 等级系统
class LevelManager {
    constructor(game) {
        this.game = game;
        
        this.userData = null;
        this.level = 1;
        this.exp = 0;
        this.expNeeded = 100;
        
        this.totalExp = 0;
    }
    
    async init() {
        const response = await MockAPI.getUserData();
        
        if (response.success) {
            this.userData = response.data;
            this.level = this.userData.level;
            this.exp = this.userData.exp;
            
            const levelInfo = Utils.expToLevel(this.exp);
            this.expNeeded = levelInfo.expNeeded;
            this.totalExp = levelInfo.totalExp;
        }
        
        Storage.checkAndUnlockTowers(this.level);
        
        return true;
    }
    
    addExperience(amount) {
        this.exp += amount;
        this.totalExp += amount;
        
        const previousLevel = this.level;
        const levelInfo = Utils.expToLevel(this.exp);
        
        this.level = levelInfo.level;
        this.expNeeded = levelInfo.expNeeded;
        
        if (this.level > previousLevel) {
            this.onLevelUp(previousLevel, this.level);
        }
        
        this.game.uiManager.updateLevelDisplay();
        
        this.updateUserData({
            level: this.level,
            exp: this.exp
        });
        
        return this.level;
    }
    
    async onLevelUp(previousLevel, newLevel) {
        const response = await MockAPI.checkLevelUp(this.exp);
        
        if (response.success && response.data.newUnlocks.length > 0) {
            const unlockNames = response.data.newUnlocks.map(towerId => {
                const towerType = Object.values(CONFIG.TOWER_TYPES).find(t => t.id === towerId);
                return towerType ? towerType.name : towerId;
            }).join('、');
            
            this.game.uiManager.showNotification(`等级提升！解锁新防御塔：${unlockNames}`);
        } else {
            this.game.uiManager.showNotification(`等级提升！当前等级：${newLevel}`);
        }
        
        this.game.uiManager.updateTowerPanel();
    }
    
    async updateUserData(updates) {
        const response = await MockAPI.updateUserData(updates);
        
        if (response.success) {
            this.userData = response.data;
        }
        
        return response.success;
    }
    
    getLevelProgress() {
        const currentLevelExp = this.exp - this.totalExp;
        const progress = currentLevelExp / this.expNeeded;
        
        return {
            level: this.level,
            exp: this.exp,
            expNeeded: this.expNeeded,
            currentLevelExp,
            progress: Math.min(progress, 1)
        };
    }
    
    canUnlockTower(towerId) {
        const towerType = Object.values(CONFIG.TOWER_TYPES).find(t => t.id === towerId);
        
        if (!towerType) return false;
        
        return this.level >= towerType.unlockLevel;
    }
    
    isTowerUnlocked(towerId) {
        if (!this.userData) return false;
        return this.userData.unlockedTowers.includes(towerId);
    }
    
    getUnlockedTowers() {
        if (!this.userData) return ['arrow'];
        return this.userData.unlockedTowers;
    }
    
    getLockedTowers() {
        const allTowers = Object.values(CONFIG.TOWER_TYPES).map(t => t.id);
        const unlockedTowers = this.getUnlockedTowers();
        
        return allTowers.filter(towerId => !unlockedTowers.includes(towerId));
    }
    
    reset() {
        this.level = this.userData ? this.userData.level : 1;
        this.exp = this.userData ? this.userData.exp : 0;
        
        const levelInfo = Utils.expToLevel(this.exp);
        this.expNeeded = levelInfo.expNeeded;
        this.totalExp = levelInfo.totalExp;
    }
}

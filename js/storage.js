// 本地存储管理
const Storage = {
    // 保存数据到本地存储
    save(key, data) {
        try {
            const jsonData = JSON.stringify(data);
            localStorage.setItem(key, jsonData);
            return true;
        } catch (e) {
            console.error('存储数据失败:', e);
            return false;
        }
    },
    
    // 从本地存储读取数据
    load(key, defaultValue = null) {
        try {
            const jsonData = localStorage.getItem(key);
            if (jsonData === null) {
                return defaultValue;
            }
            return JSON.parse(jsonData);
        } catch (e) {
            console.error('读取数据失败:', e);
            return defaultValue;
        }
    },
    
    // 移除存储数据
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('移除数据失败:', e);
            return false;
        }
    },
    
    // 清空所有存储数据
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.error('清空数据失败:', e);
            return false;
        }
    },
    
    // 检查存储是否可用
    isAvailable() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    },
    
    // 用户数据相关
    getUserData() {
        const defaultData = {
            level: CONFIG.INITIAL.LEVEL,
            exp: CONFIG.INITIAL.EXP,
            totalKills: 0,
            totalWaves: 0,
            highScore: 0,
            unlockedTowers: ['arrow']
        };
        
        return this.load(CONFIG.STORAGE_KEYS.USER_DATA, defaultData);
    },
    
    saveUserData(data) {
        return this.save(CONFIG.STORAGE_KEYS.USER_DATA, data);
    },
    
    updateUserData(updates) {
        const data = this.getUserData();
        const updatedData = { ...data, ...updates };
        return this.saveUserData(updatedData);
    },
    
    // 排行榜相关
    getLeaderboard() {
        const defaultData = CONFIG.LEADERBOARD.DEFAULT_PLAYERS.map((player, index) => ({
            ...player,
            id: `default_${index}`,
            date: new Date(Date.now() - (index + 1) * 86400000).toISOString()
        }));
        
        return this.load(CONFIG.STORAGE_KEYS.LEADERBOARD, defaultData);
    },
    
    saveLeaderboard(leaderboard) {
        return this.save(CONFIG.STORAGE_KEYS.LEADERBOARD, leaderboard);
    },
    
    // 添加分数到排行榜
    addToLeaderboard(scoreData) {
        const leaderboard = this.getLeaderboard();
        
        const newEntry = {
            id: `player_${Date.now()}`,
            name: scoreData.name || '玩家',
            wave: scoreData.wave,
            kills: scoreData.kills,
            score: scoreData.score,
            date: new Date().toISOString()
        };
        
        leaderboard.push(newEntry);
        
        leaderboard.sort((a, b) => b.score - a.score);
        
        const topEntries = leaderboard.slice(0, CONFIG.LEADERBOARD.MAX_ENTRIES);
        
        this.saveLeaderboard(topEntries);
        
        return topEntries.findIndex(entry => entry.id === newEntry.id);
    },
    
    // 设置相关
    getSettings() {
        const defaultData = {
            soundEnabled: true,
            musicEnabled: true,
            gameSpeed: CONFIG.GAME_SPEED.NORMAL
        };
        
        return this.load(CONFIG.STORAGE_KEYS.SETTINGS, defaultData);
    },
    
    saveSettings(settings) {
        return this.save(CONFIG.STORAGE_KEYS.SETTINGS, settings);
    },
    
    // 检查防御塔是否解锁
    isTowerUnlocked(towerId) {
        const userData = this.getUserData();
        return userData.unlockedTowers.includes(towerId);
    },
    
    // 解锁防御塔
    unlockTower(towerId) {
        const userData = this.getUserData();
        if (!userData.unlockedTowers.includes(towerId)) {
            userData.unlockedTowers.push(towerId);
            this.saveUserData(userData);
            return true;
        }
        return false;
    },
    
    // 检查并解锁基于等级的防御塔
    checkAndUnlockTowers(level) {
        const userData = this.getUserData();
        const unlockedTowers = [...userData.unlockedTowers];
        let newUnlocks = [];
        
        for (const towerType of Object.values(CONFIG.TOWER_TYPES)) {
            if (towerType.unlockLevel <= level && !unlockedTowers.includes(towerType.id)) {
                unlockedTowers.push(towerType.id);
                newUnlocks.push(towerType.id);
            }
        }
        
        if (newUnlocks.length > 0) {
            userData.unlockedTowers = unlockedTowers;
            this.saveUserData(userData);
        }
        
        return newUnlocks;
    }
};

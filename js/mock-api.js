// Mock API - 模拟网络请求
const MockAPI = {
    // 延迟时间（毫秒）
    DELAY: {
        MIN: 100,
        MAX: 300
    },
    
    // 模拟异步延迟
    async simulateDelay() {
        const delay = Utils.randomInt(this.DELAY.MIN, this.DELAY.MAX);
        await Utils.delay(delay);
    },
    
    // 模拟成功响应
    createSuccessResponse(data, message = '操作成功') {
        return {
            success: true,
            data,
            message,
            timestamp: Date.now()
        };
    },
    
    // 模拟错误响应
    createErrorResponse(message = '操作失败', code = 500) {
        return {
            success: false,
            error: {
                code,
                message
            },
            timestamp: Date.now()
        };
    },
    
    // 获取用户数据
    async getUserData() {
        await this.simulateDelay();
        
        try {
            const userData = Storage.getUserData();
            return this.createSuccessResponse(userData, '获取用户数据成功');
        } catch (e) {
            return this.createErrorResponse('获取用户数据失败');
        }
    },
    
    // 更新用户数据
    async updateUserData(updates) {
        await this.simulateDelay();
        
        try {
            Storage.updateUserData(updates);
            const updatedData = Storage.getUserData();
            return this.createSuccessResponse(updatedData, '更新用户数据成功');
        } catch (e) {
            return this.createErrorResponse('更新用户数据失败');
        }
    },
    
    // 获取排行榜
    async getLeaderboard() {
        await this.simulateDelay();
        
        try {
            const leaderboard = Storage.getLeaderboard();
            return this.createSuccessResponse(leaderboard, '获取排行榜成功');
        } catch (e) {
            return this.createErrorResponse('获取排行榜失败');
        }
    },
    
    // 提交分数
    async submitScore(scoreData) {
        await this.simulateDelay();
        
        try {
            const rank = Storage.addToLeaderboard(scoreData);
            
            if (rank >= 0) {
                return this.createSuccessResponse({
                    rank: rank + 1,
                    ...scoreData
                }, `恭喜！你的排名是第 ${rank + 1} 名`);
            } else {
                return this.createSuccessResponse({
                    rank: -1,
                    ...scoreData
                }, '分数未进入排行榜前10名');
            }
        } catch (e) {
            return this.createErrorResponse('提交分数失败');
        }
    },
    
    // 获取游戏配置
    async getGameConfig() {
        await this.simulateDelay();
        
        const config = {
            towerTypes: CONFIG.TOWER_TYPES,
            enemyTypes: CONFIG.ENEMY_TYPES,
            waveConfig: CONFIG.WAVE,
            levelConfig: CONFIG.LEVEL
        };
        
        return this.createSuccessResponse(config, '获取游戏配置成功');
    },
    
    // 获取波次敌人配置
    async getWaveEnemies(waveNumber) {
        await this.simulateDelay();
        
        const waveConfig = CONFIG.WAVE;
        const enemyCount = waveConfig.BASE_ENEMY_COUNT + (waveNumber - 1) * waveConfig.ENEMY_COUNT_INCREMENT;
        const healthMultiplier = waveConfig.BASE_HEALTH_MULTIPLIER + (waveNumber - 1) * waveConfig.HEALTH_MULTIPLIER_INCREMENT;
        
        const enemies = [];
        const enemyTypes = Object.values(CONFIG.ENEMY_TYPES);
        
        for (let i = 0; i < enemyCount; i++) {
            let selectedType;
            
            if (waveNumber >= 5 && i === enemyCount - 1) {
                selectedType = CONFIG.ENEMY_TYPES.BOSS;
            } else if (waveNumber >= 3 && Utils.randomInt(1, 10) <= 3) {
                selectedType = CONFIG.ENEMY_TYPES.ATTACKER;
            } else {
                const availableTypes = enemyTypes.filter(t => t.id !== 'boss');
                selectedType = Utils.randomChoice(availableTypes);
            }
            
            enemies.push({
                type: selectedType.id,
                healthMultiplier,
                delay: i * 100
            });
        }
        
        return this.createSuccessResponse({
            wave: waveNumber,
            enemies,
            totalEnemies: enemyCount
        }, `获取第 ${waveNumber} 波敌人配置成功`);
    },
    
    // 解锁防御塔
    async unlockTower(towerId) {
        await this.simulateDelay();
        
        const towerType = Object.values(CONFIG.TOWER_TYPES).find(t => t.id === towerId);
        
        if (!towerType) {
            return this.createErrorResponse('防御塔类型不存在', 404);
        }
        
        const userData = Storage.getUserData();
        
        if (userData.unlockedTowers.includes(towerId)) {
            return this.createSuccessResponse({
                towerId,
                alreadyUnlocked: true
            }, '该防御塔已解锁');
        }
        
        if (userData.level < towerType.unlockLevel) {
            return this.createErrorResponse(`等级不足，需要等级 ${towerType.unlockLevel}`, 403);
        }
        
        const success = Storage.unlockTower(towerId);
        
        if (success) {
            return this.createSuccessResponse({
                towerId,
                towerName: towerType.name
            }, `成功解锁 ${towerType.name}`);
        } else {
            return this.createErrorResponse('解锁失败');
        }
    },
    
    // 检查升级
    async checkLevelUp(exp) {
        await this.simulateDelay();
        
        const levelInfo = Utils.expToLevel(exp);
        const userData = Storage.getUserData();
        
        const newUnlocks = Storage.checkAndUnlockTowers(levelInfo.level);
        
        return this.createSuccessResponse({
            ...levelInfo,
            newUnlocks,
            leveledUp: levelInfo.level > userData.level
        }, levelInfo.level > userData.level ? '恭喜升级！' : '等级检查完成');
    },
    
    // 保存游戏进度
    async saveGameProgress(gameData) {
        await this.simulateDelay();
        
        const saveData = {
            ...gameData,
            savedAt: Date.now()
        };
        
        Storage.save('tower_defense_save', saveData);
        
        return this.createSuccessResponse(saveData, '游戏进度保存成功');
    },
    
    // 加载游戏进度
    async loadGameProgress() {
        await this.simulateDelay();
        
        const saveData = Storage.load('tower_defense_save', null);
        
        if (saveData) {
            return this.createSuccessResponse(saveData, '游戏进度加载成功');
        } else {
            return this.createErrorResponse('没有找到保存的游戏进度', 404);
        }
    },
    
    // 删除游戏进度
    async deleteGameProgress() {
        await this.simulateDelay();
        
        Storage.remove('tower_defense_save');
        
        return this.createSuccessResponse(null, '游戏进度已删除');
    }
};

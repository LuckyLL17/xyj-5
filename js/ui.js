// UI 系统
class UIManager {
    constructor(game) {
        this.game = game;
        
        this.elements = {};
        this.notificationTimeout = null;
    }
    
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.updateStats();
        this.updateTowerPanel();
        this.updateLevelDisplay();
        this.updateStartWaveButton();
    }
    
    cacheElements() {
        this.elements = {
            goldDisplay: document.getElementById('gold-display'),
            baseHealthDisplay: document.getElementById('base-health-display'),
            killsDisplay: document.getElementById('kills-display'),
            waveDisplay: document.getElementById('wave-display'),
            
            levelDisplay: document.getElementById('level-display'),
            expDisplay: document.getElementById('exp-display'),
            expMaxDisplay: document.getElementById('exp-max-display'),
            experienceFill: document.getElementById('experience-fill'),
            
            towerList: document.getElementById('tower-list'),
            towerInfo: document.getElementById('tower-info'),
            towerInfoName: document.getElementById('tower-info-name'),
            towerInfoLevel: document.getElementById('tower-info-level'),
            towerInfoDamage: document.getElementById('tower-info-damage'),
            towerInfoRange: document.getElementById('tower-info-range'),
            towerInfoSpeed: document.getElementById('tower-info-speed'),
            upgradeBtn: document.getElementById('upgrade-btn'),
            
            startWaveBtn: document.getElementById('start-wave-btn'),
            waveText: document.getElementById('wave-text'),
            
            gameOverScreen: document.getElementById('game-over-screen'),
            gameOverTitle: document.getElementById('game-over-title'),
            finalWave: document.getElementById('final-wave'),
            finalKills: document.getElementById('final-kills'),
            finalScore: document.getElementById('final-score'),
            restartBtn: document.getElementById('restart-btn'),
            leaderboardBtn: document.getElementById('leaderboard-btn'),
            
            leaderboardScreen: document.getElementById('leaderboard-screen'),
            leaderboardBody: document.getElementById('leaderboard-body'),
            backBtn: document.getElementById('back-btn'),
            
            pauseBtn: document.getElementById('pause-btn')
        };
    }
    
    setupEventListeners() {
        this.elements.startWaveBtn.addEventListener('click', () => {
            if (this.game.state === CONFIG.GAME_STATES.WAVE_PREPARE) {
                this.game.waveManager.startWave();
            }
        });
        
        this.elements.upgradeBtn.addEventListener('click', () => {
            if (this.game.selectedTower) {
                this.game.upgradeTower(this.game.selectedTower);
            }
        });
        
        this.elements.restartBtn.addEventListener('click', () => {
            this.game.restart();
        });
        
        this.elements.leaderboardBtn.addEventListener('click', () => {
            this.showLeaderboard();
        });
        
        this.elements.backBtn.addEventListener('click', () => {
            this.hideLeaderboard();
        });
        
        this.elements.pauseBtn.addEventListener('click', () => {
            this.game.togglePause();
        });
    }
    
    updateStats() {
        if (this.elements.goldDisplay) {
            this.elements.goldDisplay.textContent = Utils.formatNumber(this.game.gold);
        }
        if (this.elements.baseHealthDisplay) {
            this.elements.baseHealthDisplay.textContent = this.game.baseHealth;
        }
        if (this.elements.killsDisplay) {
            this.elements.killsDisplay.textContent = Utils.formatNumber(this.game.kills);
        }
        if (this.elements.waveDisplay) {
            this.elements.waveDisplay.textContent = this.game.currentWave;
        }
    }
    
    updateLevelDisplay() {
        const levelProgress = this.game.levelManager.getLevelProgress();
        
        if (this.elements.levelDisplay) {
            this.elements.levelDisplay.textContent = levelProgress.level;
        }
        if (this.elements.expDisplay) {
            this.elements.expDisplay.textContent = Utils.formatNumber(levelProgress.currentLevelExp);
        }
        if (this.elements.expMaxDisplay) {
            this.elements.expMaxDisplay.textContent = Utils.formatNumber(levelProgress.expNeeded);
        }
        if (this.elements.experienceFill) {
            this.elements.experienceFill.style.width = `${levelProgress.progress * 100}%`;
        }
    }
    
    updateTowerPanel() {
        if (!this.elements.towerList) return;
        
        this.elements.towerList.innerHTML = '';
        
        const unlockedTowers = this.game.levelManager.getUnlockedTowers();
        const userLevel = this.game.levelManager.level;
        
        for (const towerKey of Object.keys(CONFIG.TOWER_TYPES)) {
            const towerType = CONFIG.TOWER_TYPES[towerKey];
            const isUnlocked = unlockedTowers.includes(towerType.id);
            const canUnlock = userLevel >= towerType.unlockLevel;
            const canAfford = this.game.gold >= towerType.cost;
            
            const towerItem = document.createElement('div');
            towerItem.className = `tower-item${!isUnlocked ? ' locked' : ''}`;
            towerItem.dataset.towerType = towerType.id;
            
            const iconBg = document.createElement('div');
            iconBg.className = 'tower-icon';
            iconBg.style.backgroundColor = towerType.color;
            iconBg.style.opacity = isUnlocked ? '1' : '0.5';
            iconBg.textContent = isUnlocked ? towerType.icon : '🔒';
            
            const nameDiv = document.createElement('div');
            nameDiv.className = 'tower-name';
            nameDiv.textContent = isUnlocked ? towerType.name : `等级 ${towerType.unlockLevel} 解锁`;
            
            const costDiv = document.createElement('div');
            costDiv.className = 'tower-cost';
            costDiv.textContent = isUnlocked ? `💰 ${towerType.cost}` : '';
            
            if (!canAfford && isUnlocked) {
                costDiv.style.color = '#ff6b6b';
            }
            
            towerItem.appendChild(iconBg);
            towerItem.appendChild(nameDiv);
            towerItem.appendChild(costDiv);
            
            if (isUnlocked) {
                towerItem.addEventListener('click', () => {
                    this.selectTowerType(towerType.id, towerItem);
                });
            }
            
            this.elements.towerList.appendChild(towerItem);
        }
    }
    
    selectTowerType(towerTypeId, element) {
        if (this.game.selectedTowerType === towerTypeId) {
            this.game.selectedTowerType = null;
            this.game.selectedTower = null;
            this.hideTowerInfo();
            this.deselectTowerTypes();
            return;
        }
        
        this.deselectTowerTypes();
        this.game.selectedTowerType = towerTypeId;
        this.game.selectedTower = null;
        this.hideTowerInfo();
        
        if (element) {
            element.classList.add('selected');
        }
    }
    
    deselectTowerTypes() {
        this.game.selectedTowerType = null;
        this.game.hoverCell = null;
        const towerItems = document.querySelectorAll('.tower-item');
        towerItems.forEach(item => item.classList.remove('selected'));
    }
    
    showTowerInfo(tower) {
        if (!this.elements.towerInfo) return;
        
        this.elements.towerInfo.style.display = 'block';
        
        if (this.elements.towerInfoName) {
            this.elements.towerInfoName.textContent = tower.type.name;
        }
        if (this.elements.towerInfoLevel) {
            this.elements.towerInfoLevel.textContent = `${tower.level}/${tower.maxLevel}`;
        }
        if (this.elements.towerInfoDamage) {
            this.elements.towerInfoDamage.textContent = tower.damage;
        }
        if (this.elements.towerInfoRange) {
            this.elements.towerInfoRange.textContent = tower.range;
        }
        if (this.elements.towerInfoSpeed) {
            this.elements.towerInfoSpeed.textContent = tower.attackSpeed.toFixed(1);
        }
        
        if (this.elements.upgradeBtn) {
            if (tower.canUpgrade()) {
                const upgradeCost = tower.getUpgradeCost();
                this.elements.upgradeBtn.textContent = `升级 (${upgradeCost} 金币)`;
                this.elements.upgradeBtn.disabled = this.game.gold < upgradeCost;
            } else {
                this.elements.upgradeBtn.textContent = '已满级';
                this.elements.upgradeBtn.disabled = true;
            }
        }
    }
    
    hideTowerInfo() {
        if (this.elements.towerInfo) {
            this.elements.towerInfo.style.display = 'none';
        }
    }
    
    updateStartWaveButton() {
        if (!this.elements.startWaveBtn) return;
        
        const nextWave = this.game.currentWave + 1;
        const waveManager = this.game.waveManager;
        
        if (this.game.state === CONFIG.GAME_STATES.WAVE_PREPARE) {
            this.elements.startWaveBtn.style.display = 'block';
            this.elements.startWaveBtn.disabled = false;
            
            if (waveManager && waveManager.isAutoStartEnabled) {
                const remainingTime = Math.ceil((waveManager.autoStartDelay - waveManager.autoStartTimer) / 1000);
                if (remainingTime > 0) {
                    this.elements.startWaveBtn.textContent = `开始第 ${nextWave} 波 (${remainingTime}秒后自动开始)`;
                } else {
                    this.elements.startWaveBtn.textContent = `开始第 ${nextWave} 波`;
                }
            } else {
                this.elements.startWaveBtn.textContent = `开始第 ${nextWave} 波`;
            }
        } else if (this.game.state === CONFIG.GAME_STATES.WAVE_RUNNING) {
            this.elements.startWaveBtn.style.display = 'none';
        }
    }
    
    showWaveText(text) {
        if (this.elements.waveText) {
            this.elements.waveText.textContent = text;
            this.elements.waveText.style.display = 'block';
        }
    }
    
    hideWaveText() {
        if (this.elements.waveText) {
            this.elements.waveText.style.display = 'none';
        }
    }
    
    showGameOver(score) {
        if (!this.elements.gameOverScreen) return;
        
        if (this.elements.gameOverTitle) {
            this.elements.gameOverTitle.textContent = '游戏结束';
        }
        if (this.elements.finalWave) {
            this.elements.finalWave.textContent = this.game.currentWave;
        }
        if (this.elements.finalKills) {
            this.elements.finalKills.textContent = Utils.formatNumber(this.game.kills);
        }
        if (this.elements.finalScore) {
            this.elements.finalScore.textContent = Utils.formatNumber(score);
        }
        
        this.elements.gameOverScreen.style.display = 'flex';
        
        MockAPI.submitScore({
            name: '玩家',
            wave: this.game.currentWave,
            kills: this.game.kills,
            score: score
        });
    }
    
    hideGameOver() {
        if (this.elements.gameOverScreen) {
            this.elements.gameOverScreen.style.display = 'none';
        }
    }
    
    async showLeaderboard() {
        if (!this.elements.leaderboardScreen || !this.elements.leaderboardBody) return;
        
        this.elements.leaderboardBody.innerHTML = '';
        
        const response = await MockAPI.getLeaderboard();
        
        if (response.success) {
            const leaderboard = response.data;
            
            leaderboard.forEach((entry, index) => {
                const row = document.createElement('tr');
                
                const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '';
                
                row.innerHTML = `
                    <td class="${rankClass}">${index + 1}</td>
                    <td>${entry.name}</td>
                    <td>${entry.wave}</td>
                    <td>${Utils.formatNumber(entry.kills)}</td>
                    <td>${Utils.formatNumber(entry.score)}</td>
                `;
                
                this.elements.leaderboardBody.appendChild(row);
            });
        }
        
        this.elements.leaderboardScreen.style.display = 'flex';
    }
    
    hideLeaderboard() {
        if (this.elements.leaderboardScreen) {
            if (this.game.state === CONFIG.GAME_STATES.GAME_OVER) {
                this.elements.leaderboardScreen.style.display = 'none';
                this.elements.gameOverScreen.style.display = 'flex';
            } else {
                this.elements.leaderboardScreen.style.display = 'none';
            }
        }
    }
    
    showNotification(message, duration = 3000) {
        let notification = document.getElementById('game-notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'game-notification';
            notification.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9);
                color: #fff;
                padding: 15px 30px;
                border-radius: 10px;
                font-size: 18px;
                font-weight: bold;
                z-index: 1000;
                pointer-events: none;
                transition: opacity 0.3s;
            `;
            document.body.appendChild(notification);
        }
        
        notification.textContent = message;
        notification.style.opacity = '1';
        
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }
        
        this.notificationTimeout = setTimeout(() => {
            notification.style.opacity = '0';
        }, duration);
    }
}

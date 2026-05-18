// 游戏配置
const CONFIG = {
    // 游戏状态
    GAME_STATES: {
        LOADING: 'loading',
        MENU: 'menu',
        PLAYING: 'playing',
        PAUSED: 'paused',
        WAVE_PREPARE: 'wave_prepare',
        WAVE_RUNNING: 'wave_running',
        GAME_OVER: 'game_over'
    },
    
    // 网格配置
    GRID: {
        COLS: 20,
        ROWS: 15,
        CELL_SIZE: 40
    },
    
    // 颜色配置
    COLORS: {
        GRID_LIGHT: '#1e3a5f',
        GRID_DARK: '#16213e',
        PATH: '#2d4a6f',
        PATH_BORDER: '#4a6a8f',
        BUILDABLE: '#1e3a5f',
        BUILDABLE_BORDER: '#2a4a7f',
        SELECTED: '#64c8ff',
        RANGE: 'rgba(100, 200, 255, 0.2)'
    },
    
    // 初始资源
    INITIAL: {
        GOLD: 200,
        BASE_HEALTH: 20,
        KILLS: 0,
        WAVE: 0,
        LEVEL: 1,
        EXP: 0
    },
    
    // 防御塔类型
    TOWER_TYPES: {
        ARROW: {
            id: 'arrow',
            name: '箭塔',
            icon: '🏹',
            color: '#4ecdc4',
            cost: 50,
            damage: 10,
            range: 120,
            attackSpeed: 1.0,
            bulletSpeed: 8,
            bulletType: 'arrow',
            unlockLevel: 1,
            description: '基础防御塔，攻速快',
            upgrades: [
                { cost: 50, damage: 15, range: 130, attackSpeed: 1.1 },
                { cost: 100, damage: 22, range: 140, attackSpeed: 1.2 },
                { cost: 200, damage: 35, range: 150, attackSpeed: 1.4 }
            ]
        },
        CANNON: {
            id: 'cannon',
            name: '炮塔',
            icon: '💥',
            color: '#ff6b6b',
            cost: 100,
            damage: 30,
            range: 100,
            attackSpeed: 0.6,
            bulletSpeed: 6,
            bulletType: 'cannon',
            unlockLevel: 2,
            description: '高伤害，范围攻击',
            splashRadius: 50,
            upgrades: [
                { cost: 100, damage: 45, range: 110, attackSpeed: 0.7, splashRadius: 60 },
                { cost: 200, damage: 65, range: 120, attackSpeed: 0.8, splashRadius: 70 },
                { cost: 400, damage: 100, range: 130, attackSpeed: 1.0, splashRadius: 80 }
            ]
        },
        ICE: {
            id: 'ice',
            name: '减速塔',
            icon: '❄️',
            color: '#74b9ff',
            cost: 75,
            damage: 5,
            range: 100,
            attackSpeed: 0.8,
            bulletSpeed: 7,
            bulletType: 'ice',
            unlockLevel: 3,
            description: '减速敌人移动速度',
            slowAmount: 0.5,
            slowDuration: 2000,
            upgrades: [
                { cost: 75, damage: 8, range: 110, attackSpeed: 0.9, slowAmount: 0.4 },
                { cost: 150, damage: 12, range: 120, attackSpeed: 1.0, slowAmount: 0.3 },
                { cost: 300, damage: 20, range: 130, attackSpeed: 1.1, slowAmount: 0.2 }
            ]
        },
        LASER: {
            id: 'laser',
            name: '激光塔',
            icon: '⚡',
            color: '#a29bfe',
            cost: 150,
            damage: 5,
            range: 150,
            attackSpeed: 10.0,
            bulletSpeed: 0,
            bulletType: 'laser',
            unlockLevel: 5,
            description: '持续伤害，穿透攻击',
            pierce: true,
            upgrades: [
                { cost: 150, damage: 8, range: 160, attackSpeed: 12.0 },
                { cost: 300, damage: 12, range: 170, attackSpeed: 15.0 },
                { cost: 600, damage: 20, range: 180, attackSpeed: 20.0 }
            ]
        },
        POISON: {
            id: 'poison',
            name: '毒塔',
            icon: '☠️',
            color: '#00b894',
            cost: 125,
            damage: 8,
            range: 110,
            attackSpeed: 0.7,
            bulletSpeed: 6,
            bulletType: 'poison',
            unlockLevel: 4,
            description: '持续毒素伤害',
            poisonDamage: 3,
            poisonDuration: 3000,
            upgrades: [
                { cost: 125, damage: 12, range: 120, attackSpeed: 0.8, poisonDamage: 5 },
                { cost: 250, damage: 18, range: 130, attackSpeed: 0.9, poisonDamage: 8 },
                { cost: 500, damage: 28, range: 140, attackSpeed: 1.0, poisonDamage: 12 }
            ]
        }
    },
    
    // 敌人类型
    ENEMY_TYPES: {
        NORMAL: {
            id: 'normal',
            name: '普通怪',
            color: '#ff7675',
            health: 50,
            speed: 1,
            damage: 1,
            gold: 10,
            exp: 10,
            size: 15,
            canAttack: false
        },
        FAST: {
            id: 'fast',
            name: '快速怪',
            color: '#fdcb6e',
            health: 30,
            speed: 2,
            damage: 1,
            gold: 8,
            exp: 15,
            size: 12,
            canAttack: false
        },
        TANK: {
            id: 'tank',
            name: '坦克怪',
            color: '#636e72',
            health: 200,
            speed: 0.5,
            damage: 2,
            gold: 25,
            exp: 25,
            size: 20,
            canAttack: false
        },
        BOSS: {
            id: 'boss',
            name: 'BOSS',
            color: '#d63031',
            health: 500,
            speed: 0.4,
            damage: 5,
            gold: 100,
            exp: 100,
            size: 25,
            canAttack: true,
            attackRange: 80,
            attackDamage: 10,
            attackSpeed: 0.5
        },
        ATTACKER: {
            id: 'attacker',
            name: '攻击怪',
            color: '#e17055',
            health: 80,
            speed: 0.8,
            damage: 1,
            gold: 15,
            exp: 20,
            size: 16,
            canAttack: true,
            attackRange: 60,
            attackDamage: 5,
            attackSpeed: 0.8
        }
    },
    
    // 波次配置
    WAVE: {
        BASE_ENEMY_COUNT: 5,
        ENEMY_COUNT_INCREMENT: 2,
        BASE_HEALTH_MULTIPLIER: 1.0,
        HEALTH_MULTIPLIER_INCREMENT: 0.15,
        SPAWN_INTERVAL: 1500,
        SPAWN_INTERVAL_DECREMENT: 50,
        MIN_SPAWN_INTERVAL: 500
    },
    
    // 等级系统
    LEVEL: {
        BASE_EXP: 100,
        EXP_MULTIPLIER: 1.5,
        MAX_LEVEL: 10
    },
    
    // 本地存储键
    STORAGE_KEYS: {
        USER_DATA: 'tower_defense_user_data',
        LEADERBOARD: 'tower_defense_leaderboard',
        SETTINGS: 'tower_defense_settings'
    },
    
    // 排行榜
    LEADERBOARD: {
        MAX_ENTRIES: 10,
        DEFAULT_PLAYERS: [
            { name: '塔防大师', wave: 15, kills: 256, score: 12800 },
            { name: '新手玩家', wave: 8, kills: 120, score: 6000 },
            { name: '策略高手', wave: 12, kills: 198, score: 9900 }
        ]
    },
    
    // 子弹类型
    BULLET_TYPES: {
        ARROW: {
            id: 'arrow',
            color: '#4ecdc4',
            size: 4,
            hasParabola: false
        },
        CANNON: {
            id: 'cannon',
            color: '#ff6b6b',
            size: 8,
            hasParabola: true,
            parabolaHeight: 50
        },
        ICE: {
            id: 'ice',
            color: '#74b9ff',
            size: 6,
            hasParabola: false
        },
        LASER: {
            id: 'laser',
            color: '#a29bfe',
            size: 3,
            hasParabola: false
        },
        POISON: {
            id: 'poison',
            color: '#00b894',
            size: 5,
            hasParabola: false
        }
    },
    
    // 游戏速度
    GAME_SPEED: {
        NORMAL: 1,
        FAST: 2,
        FASTEST: 3
    }
};

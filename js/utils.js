// 工具函数
const Utils = {
    // 计算两点之间的距离
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },
    
    // 计算两点之间的角度
    angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },
    
    // 线性插值
    lerp(start, end, t) {
        return start + (end - start) * t;
    },
    
    // 限制数值在范围内
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
    
    // 随机整数
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // 随机浮点数
    randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    // 从数组中随机选择一个元素
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    },
    
    // 碰撞检测 - 圆形
    circleCollision(x1, y1, r1, x2, y2, r2) {
        return this.distance(x1, y1, x2, y2) < r1 + r2;
    },
    
    // 碰撞检测 - 矩形
    rectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    },
    
    // 点是否在矩形内
    pointInRect(px, py, x, y, w, h) {
        return px >= x && px <= x + w && py >= y && py <= y + h;
    },
    
    // 点是否在圆形内
    pointInCircle(px, py, x, y, r) {
        return this.distance(px, py, x, y) <= r;
    },
    
    // 格式化数字（添加千位分隔符）
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    // 深拷贝
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    // 延迟执行
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // 计算抛物线轨迹
    parabolicTrajectory(startX, startY, targetX, targetY, height, t) {
        const midX = (startX + targetX) / 2;
        const midY = Math.min(startY, targetY) - height;
        
        const x = this.lerp(startX, targetX, t);
        
        const t1 = 1 - t;
        const y = t1 * t1 * startY + 2 * t1 * t * midY + t * t * targetY;
        
        return { x, y };
    },
    
    // 计算经验值所需的等级
    expToLevel(exp, baseExp = CONFIG.LEVEL.BASE_EXP, multiplier = CONFIG.LEVEL.EXP_MULTIPLIER) {
        let level = 1;
        let expNeeded = baseExp;
        let totalExp = 0;
        
        while (exp >= totalExp + expNeeded) {
            totalExp += expNeeded;
            level++;
            expNeeded = Math.floor(expNeeded * multiplier);
            
            if (level >= CONFIG.LEVEL.MAX_LEVEL) break;
        }
        
        return {
            level,
            currentExp: exp - totalExp,
            expNeeded,
            totalExp
        };
    },
    
    // 计算得分
    calculateScore(wave, kills) {
        return wave * 100 + kills * 10;
    },
    
    // 防抖
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // 节流
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// 地图系统
class GameMap {
    constructor(game) {
        this.game = game;
        this.cols = CONFIG.GRID.COLS;
        this.rows = CONFIG.GRID.ROWS;
        this.cellSize = CONFIG.GRID.CELL_SIZE;
        
        this.grid = [];
        this.path = [];
        this.pathCells = new Set();
        
        this.startPos = null;
        this.endPos = null;
    }
    
    async generate() {
        this.grid = [];
        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = {
                    type: 'buildable',
                    col,
                    row,
                    tower: null
                };
            }
        }
        
        this.generatePath();
        
        return true;
    }
    
    generatePath() {
        this.path = [];
        this.pathCells = new Set();
        
        const startCol = 0;
        const startRow = Math.floor(this.rows / 2);
        this.startPos = { col: startCol, row: startRow };
        
        const endCol = this.cols - 1;
        const endRow = Math.floor(this.rows / 2);
        this.endPos = { col: endCol, row: endRow };
        
        let currentCol = startCol;
        let currentRow = startRow;
        
        this.addToPath(currentCol, currentRow);
        
        while (currentCol < endCol) {
            const canGoRight = currentCol + 1 < endCol;
            const canGoUp = currentRow > 1;
            const canGoDown = currentRow < this.rows - 2;
            
            const choices = [];
            
            if (canGoRight) {
                choices.push({ col: currentCol + 1, row: currentRow, weight: 3 });
            }
            
            if (canGoUp && Math.random() > 0.5) {
                choices.push({ col: currentCol, row: currentRow - 1, weight: 1 });
            }
            
            if (canGoDown && Math.random() > 0.5) {
                choices.push({ col: currentCol, row: currentRow + 1, weight: 1 });
            }
            
            if (choices.length === 0) {
                currentCol++;
            } else {
                const totalWeight = choices.reduce((sum, c) => sum + c.weight, 0);
                let random = Math.random() * totalWeight;
                let selected = choices[0];
                
                for (const choice of choices) {
                    random -= choice.weight;
                    if (random <= 0) {
                        selected = choice;
                        break;
                    }
                }
                
                currentCol = selected.col;
                currentRow = selected.row;
            }
            
            this.addToPath(currentCol, currentRow);
        }
        
        while (currentRow !== endRow) {
            if (currentRow < endRow) {
                currentRow++;
            } else {
                currentRow--;
            }
            this.addToPath(currentCol, currentRow);
        }
        
        this.addToPath(endCol, endRow);
        
        for (const cell of this.path) {
            if (this.grid[cell.row] && this.grid[cell.row][cell.col]) {
                this.grid[cell.row][cell.col].type = 'path';
            }
        }
    }
    
    addToPath(col, row) {
        const key = `${col},${row}`;
        if (!this.pathCells.has(key)) {
            this.path.push({ col, row });
            this.pathCells.add(key);
        }
    }
    
    isPathCell(col, row) {
        const key = `${col},${row}`;
        return this.pathCells.has(key);
    }
    
    getStartPosition() {
        return this.startPos;
    }
    
    getEndPosition() {
        return this.endPos;
    }
    
    getPath() {
        return this.path;
    }
    
    getNextPathIndex(currentIndex) {
        if (currentIndex + 1 < this.path.length) {
            return currentIndex + 1;
        }
        return -1;
    }
    
    getCellCenter(col, row) {
        const offsetX = this.game.mapOffsetX || 0;
        const offsetY = this.game.mapOffsetY || 0;
        
        return {
            x: offsetX + col * this.cellSize + this.cellSize / 2,
            y: offsetY + row * this.cellSize + this.cellSize / 2
        };
    }
    
    getCellAtPosition(x, y) {
        const offsetX = this.game.mapOffsetX || 0;
        const offsetY = this.game.mapOffsetY || 0;
        
        const col = Math.floor((x - offsetX) / this.cellSize);
        const row = Math.floor((y - offsetY) / this.cellSize);
        
        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            return this.grid[row][col];
        }
        
        return null;
    }
    
    render(ctx) {
        const offsetX = this.game.mapOffsetX || 0;
        const offsetY = this.game.mapOffsetY || 0;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const x = offsetX + col * this.cellSize;
                const y = offsetY + row * this.cellSize;
                const cell = this.grid[row][col];
                
                const isLight = (row + col) % 2 === 0;
                
                if (cell.type === 'path') {
                    ctx.fillStyle = CONFIG.COLORS.PATH;
                    ctx.fillRect(x, y, this.cellSize, this.cellSize);
                    
                    ctx.strokeStyle = CONFIG.COLORS.PATH_BORDER;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, y, this.cellSize, this.cellSize);
                } else {
                    ctx.fillStyle = isLight ? CONFIG.COLORS.GRID_LIGHT : CONFIG.COLORS.GRID_DARK;
                    ctx.fillRect(x, y, this.cellSize, this.cellSize);
                    
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, y, this.cellSize, this.cellSize);
                }
            }
        }
        
        this.renderStartEnd(ctx, offsetX, offsetY);
    }
    
    renderStartEnd(ctx, offsetX, offsetY) {
        if (this.startPos) {
            const x = offsetX + this.startPos.col * this.cellSize;
            const y = offsetY + this.startPos.row * this.cellSize;
            
            ctx.fillStyle = 'rgba(0, 255, 100, 0.3)';
            ctx.fillRect(x, y, this.cellSize, this.cellSize);
            
            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = '#00ff64';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('入', x + this.cellSize / 2, y + this.cellSize / 2);
        }
        
        if (this.endPos) {
            const x = offsetX + this.endPos.col * this.cellSize;
            const y = offsetY + this.endPos.row * this.cellSize;
            
            ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
            ctx.fillRect(x, y, this.cellSize, this.cellSize);
            
            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = '#ff6464';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('基地', x + this.cellSize / 2, y + this.cellSize / 2);
            
            this.renderBase(ctx, x + this.cellSize / 2, y + this.cellSize / 2);
        }
    }
    
    renderBase(ctx, x, y) {
        const baseHealth = this.game.baseHealth;
        const maxHealth = CONFIG.INITIAL.BASE_HEALTH;
        const healthPercent = baseHealth / maxHealth;
        
        ctx.save();
        
        ctx.fillStyle = healthPercent > 0.5 ? '#4ecdc4' : healthPercent > 0.25 ? '#fdcb6e' : '#ff6b6b';
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.font = '16px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏠', x, y);
        
        ctx.restore();
    }
}

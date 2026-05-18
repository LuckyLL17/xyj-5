// 游戏主入口
let game = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('塔防游戏加载中...');
    
    try {
        if (!Storage.isAvailable()) {
            console.warn('本地存储不可用，部分功能可能受限');
        }
        
        game = new Game();
        
        await game.init();
        
        console.log('游戏初始化完成！');
        
        console.log('游戏控制:');
        console.log('- 点击下方防御塔图标选择要建造的塔');
        console.log('- 点击地图空白区域建造防御塔');
        console.log('- 点击已建造的防御塔可以升级');
        console.log('- 按空格键开始下一波');
        console.log('- 按 P 键暂停/继续游戏');
        console.log('- 按 ESC 键取消选择');
        
    } catch (error) {
        console.error('游戏初始化失败:', error);
        
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.innerHTML = `
                <div style="text-align: center;">
                    <div style="color: #ff6b6b; font-size: 24px; margin-bottom: 20px;">游戏加载失败</div>
                    <div style="color: #aaa;">${error.message || '未知错误'}</div>
                </div>
            `;
        }
    }
});

window.addEventListener('error', (e) => {
    console.error('游戏运行时错误:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('未处理的 Promise 错误:', e.reason);
});

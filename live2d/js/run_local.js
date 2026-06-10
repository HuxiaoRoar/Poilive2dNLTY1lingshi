// ==========================================
// run_local.js (Pixi.js 现代化混合调试版 - 修复上下文冲突)
// ==========================================

var pixiApp = null;             // 铁打的舞台 (全局只建一次)
var currentLive2dModel = null;  // 流水的演员
var isFirstLoad = true;
window.isModelLoading = false;  // ★ 新增：挂载到全局的加载锁，防止高频狂点


function InitPoi() {
    const canvas = document.getElementById('live2d');
    if (!canvas) {
        console.error("未找到指定的 Canvas 元素: live2d");
        window.isModelLoading = false; // 容错重置
        return;
    }

    // ------------------------------------------
    // ★【本地调试参数区】
    // ------------------------------------------
    const DEBUG_CONFIG = {
        scale: 0.15,   // 手动控制模型大小
        offsetX: 0,    // X轴水平偏移
        offsetY: 0     // Y轴垂直偏移
    };

    // A. 【核心修复】：PixiApp 舞台全局只初始化一次！绝不反复销毁重建！
    if (!pixiApp) {
        pixiApp = new PIXI.Application({
            view: canvas,
            backgroundAlpha: 0,
            clearBeforeRender: true,
            autoStart: true,
            width: 280,        // 逻辑宽度
            height: 250,       // 逻辑高度
            resolution: window.devicePixelRatio || 1, 
            autoDensity: true,                        
            antialias: true                           
        });
    }


    // B. 安全撤下旧演员 (核心防御区)
    if (currentLive2dModel) {
        try {
            // ★ 修复错误 1：在销毁前，强制清理并清空当前显卡的批渲染缓存与几何体状态
            if (pixiApp.renderer) {
                if (pixiApp.renderer.batch) pixiApp.renderer.batch.flush();
                if (pixiApp.renderer.geometry) pixiApp.renderer.geometry.reset();
            }

            // 从大舞台上将旧演员请下去
            pixiApp.stage.removeChild(currentLive2dModel);

            // 彻底释放模型和贴图占用的显存
            currentLive2dModel.destroy({ children: true, texture: true, baseTexture: true });

        } catch (e) {
            // ★ 修复错误 2 的核心：即使引擎 release 报 undefined 异常，也被此捕获吞掉
            // 绝不让异常拦截线程，确保下方的新模型加载逻辑 100% 能够顺利运行！
            console.warn("PoiLive2d: 释放旧模型时发生内部兼容警告，已安全跳过以确保正常渲染。", e);
        } finally {
            currentLive2dModel = null;
            // 再次重置 WebGL 状态机，给新模型留一张绝对干净的白纸
            if (pixiApp.renderer && pixiApp.renderer.geometry) {
                pixiApp.renderer.geometry.reset();
            }
        }
    }

    // C. 判断新演员身份与剧本路径
    var modelData = modelTexturesMax[currentModel];
    // 【核心判断】：如果数据是个字符串（文本），说明它是新版模型的 json 文件名！
    var isNewModel = typeof modelData === 'string';
    var modelUrl = "";

    if (isNewModel) {
        // 新版高清模型 (动态获取文件夹下的任意命名 json)
        // 例如：.../model/Hiyori/model0.model3.json
        modelUrl = message_Path + "model/" + encodeURIComponent(currentModel) + "/" + encodeURIComponent(modelData);
    } else {
        // 旧版模型 (走 API 换装换色)
        modelUrl = poilive2d_api_url + "?model=" + encodeURIComponent(currentModel) + "&tex=" + currentTexId;
    }

    // D. 请新演员上台
    PIXI.live2d.Live2DModel.from(modelUrl).then(model => {
        currentLive2dModel = model;
        pixiApp.stage.addChild(model);

        // ==========================================
        // ★ 核心魔法：全自动缩放与居中算法 ★
        // ==========================================

        // 1. 获取画框（Canvas）的【逻辑尺寸】 (必须用 screen，不能用 view)
        const canvasWidth = pixiApp.screen.width;
        const canvasHeight = pixiApp.screen.height;

        // 2. 获取当前上台模型（相片）的原生尺寸
        const modelWidth = model.width;
        const modelHeight = model.height;

        // 3. 计算自适应缩放比例 (Auto Scale)
        let autoScale = Math.min(canvasWidth / modelWidth, canvasHeight / modelHeight);
        autoScale = autoScale * 0.9; // 留白呼吸感 

        // 4. 正式应用
        model.scale.set(autoScale);

        // 5. 完美居中对齐 (Auto Center)
        model.x = (canvasWidth - modelWidth * autoScale) / 2;
        model.y = canvasHeight - (modelHeight * autoScale);

        // ==========================================

        // F. 鼠标视线跟随（眼神对视）
        model.interactive = true;
        pixiApp.stage.interactive = true;

        pixiApp.stage.off('pointermove');
        pixiApp.stage.on('pointermove', (event) => {
            if (currentLive2dModel) {
                currentLive2dModel.focus(event.data.global.x, event.data.global.y);
            }
        });

        // G. 动画淡入与控制台提示
        if (isFirstLoad) {
            showConsoleTips("加载"); // 只有第一次加载时才打印那一长串绿色的彩蛋
            isFirstLoad = false;     // 关掉开关
        } else {
            // 后续的变身变装，默默把幕布拉开，绝不弹日志烦人
            showConsoleTips("更换");
            $("#live2d").animate({ opacity: '1' }, 200);
        }
    }).catch(error => {
        console.error("Live2D 模型加载失败:", error);
    });
}

function showConsoleTips(content) {
    var style_green = "font-family:'微软雅黑';font-size:1em;background-color:#34a853;color:#fff;padding:4px;";
    var style_green_light = "font-family:'微软雅黑';font-size:1em;background-color:#42d268;color:#fff;padding:4px;";
    console.log("%cPoiLive2d%cPoi模型" + content + "完成", style_green, style_green_light);

    // 确保模型彻底渲染好之后，再拉开幕布（淡入）
    $("#live2d").animate({ opacity: '1' }, 200);
}

// 延迟启动，确保 DOM 就绪
setTimeout(InitPoi, 500);
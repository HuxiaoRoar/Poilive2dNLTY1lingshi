// ==========================================
// run_local.js (Pixi.js 现代化混合调试版 - 修复上下文冲突)
// ==========================================

var pixiApp = null;             // 铁打的舞台 (全局只建一次)
var currentLive2dModel = null;  // 流水的演员
var isFirstLoad = true;
window.isModelLoading = false;  // ★ 新增：挂载到全局的加载锁，防止高频狂点


function InitPoi() {
    // ==========================================
    // ★ 注入独立对话框 UI 与 Flat 2.0 按钮样式
    // ==========================================
    if (!document.getElementById('vts-dialog')) {
        $('#landlord').append(`
                <div id="vts-dialog">
                    <div id="vts-text"></div>
                    <div id="vts-choices"></div>
                </div>
            `);
    }
    
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

            // 2. ★ 终极必杀：强行介入原生 WebGL 上下文，暴力解除老版本 SDK 霸占的 Buffer
            const gl = pixiApp.renderer.gl;
            if (gl) {
                // 强制解绑顶点缓冲区和索引缓冲区
                gl.bindBuffer(gl.ARRAY_BUFFER, null);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            }

            // 3. 重置 PixiJS 的全局 WebGL 状态机，让它和真实显卡状态同步
            if (pixiApp.renderer.state) {
                pixiApp.renderer.state.reset();
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
    let modelData = poilive2d_models_info[currentModel];
    let modelUrl = '';

    // ==========================================
    // ★ 新增：多 .model3.json 换装支持 (数组处理)
    // ==========================================
    if (Array.isArray(modelData)) {
        // 此时 modelData 是类似 ['model0.model3.json', 'model1.model3.json'] 的数组
        // currentTex 是旧版用来记衣服序号的变量（通常从 1 开始）
        let index = (currentTexId - 1) % modelData.length;
        if (isNaN(index) || index < 0) index = 0; // 兜底保护，默认穿第 0 件衣服

        // 拼接出正确的纯静态路径
        modelUrl = message_Path + "model/" + currentModel + "/" + modelData[index];

    }
    // ==========================================
    // 原有：单 .model3.json 支持 (字符串处理)
    // ==========================================
    else if (typeof modelData === 'string') {
        modelUrl = message_Path + "model/" + currentModel + "/" + modelData;

    }
    // ==========================================
    // 原有：老版本 V2 动态换装 (数字处理，走 API)
    // ==========================================
    else if (typeof modelData === 'number') {
        modelUrl = poilive2d_api_url + "?model=" + currentModel + "&tex=" + currentTex;
    }

    // 防错拦截：如果没拿到合法的 URL，直接阻断，防止引擎报 Unknown 错
    if (!modelUrl) {
        console.error("PoiLive2d: 无法解析模型路径数据", modelData);
        window.isModelLoading = false;
        return;
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
        // ==========================================
        // ★ 核心解释器 (多任务并发 + 独立UI保护版)
        // ==========================================
        const rawJson = model.internalModel.settings.json || model.internalModel.settings;

        const rawMotions = rawJson.FileReferences?.Motions || rawJson.FileReferences?.motions || rawJson.Motions || rawJson.motions || {};
        const rawHitAreas = rawJson.HitAreas || rawJson.hit_areas || [];
        const rawExpressions = rawJson.FileReferences?.Expressions || rawJson.FileReferences?.expressions || rawJson.Expressions || rawJson.expressions || [];

        let vtsTimeout = null;

        // 新增 isTopLevel 参数：只有最顶层的用户点击，才有资格重置/隐藏当前界面的旧气泡
        function executeVTSAction(groupName, specificName = null, isTopLevel = false) {
            if (!groupName) return;

            const engineGroup = model.internalModel.motionManager?.motionGroups[groupName];
            const motionsInGroup = rawMotions[groupName] || [];

            let finalIndex = specificName ? motionsInGroup.findIndex(m => (m.Name || m.name) === specificName) : -1;

            if (finalIndex === -1 && (motionsInGroup.length > 0 || engineGroup)) {
                const maxLen = Math.max(motionsInGroup.length, engineGroup ? engineGroup.length : 0);
                if (maxLen > 0) finalIndex = Math.floor(Math.random() * maxLen);
            }

            if (finalIndex === -1) return;

            const motionDef = motionsInGroup[finalIndex] || {};

            const mFile = motionDef.File || motionDef.file;
            const mExp = motionDef.Expression || motionDef.expression;
            const mCmd = motionDef.Command || motionDef.command;
            const mText = motionDef.Text || motionDef.text;
            const mChoices = motionDef.Choices || motionDef.choices;
            const mSound = motionDef.Sound || motionDef.sound;

            // --- A. 播放动作与引擎内嵌音频 ---
            if (engineGroup && mFile) {
                model.motion(groupName, finalIndex);
            } else if (!mFile && !mCmd && !mSound) {
                console.log(`💬 指令 [${groupName}] 无核心动作配置，已安全放行。`);
            }

            // --- ★ B. 脱离骨骼的纯语音兜底播放 (防 # 号截断) ---
            if (!mFile && mSound) {
                const safeSoundPath = mSound.split('/').map(p => encodeURIComponent(p)).join('/');
                const audioUrl = message_Path + "model/" + encodeURIComponent(currentModel) + "/" + safeSoundPath;
                const audio = new Audio(audioUrl);
                audio.play().catch(e => console.warn("浏览器拦截了纯语音播报 (需用户先产生一次交互):", e));
            }

            // --- C. 切换表情 ---
            if (mExp) {
                const expIndex = rawExpressions.findIndex(e => (e.Name || e.name) === mExp);
                if (expIndex !== -1) model.expression(expIndex);
            }

            // --- D. 独立 UI 与连环选项路由 (保护机制) ---
            const $dialog = $('#vts-dialog');
            const $text = $('#vts-text');
            const $choices = $('#vts-choices');

            const hasText = !!mText;
            const hasChoices = mChoices && mChoices.length > 0;

            if (hasText || hasChoices) {
                $choices.empty();
                if (hasText) $text.text(mText).show();
                else $text.hide();

                if (hasChoices) {
                    mChoices.forEach(choice => {
                        const cText = choice.Text || choice.text;
                        const cNext = choice.NextMtn || choice.next_mtn;

                        $('<button class="vts-btn"></button>')
                            .text(cText)
                            .on('click', function () {
                                $dialog.fadeOut(200);
                                if (cNext) {
                                    const [nextGroup, nextSpecific] = cNext.split(':');
                                    // 用户点击了选项卡，等同于一次新的顶级交互
                                    executeVTSAction(nextGroup, nextSpecific, true);
                                }
                            }).appendTo($choices);
                    });
                }

                if (vtsTimeout) clearTimeout(vtsTimeout);

                if (!hasChoices) $dialog.css('bottom', '40px');
                else $dialog.css('bottom', '5px');

                const delay = motionDef.TextDelay || motionDef.text_delay || 0;
                const duration = motionDef.TextDuration || motionDef.text_duration || (hasChoices ? 999999 : 4000);

                setTimeout(() => {
                    $dialog.stop(true, true).fadeIn(300);
                    if (!hasChoices) {
                        vtsTimeout = setTimeout(() => { $dialog.fadeOut(300); }, duration);
                    }
                }, delay);

            } else if (isTopLevel) {
                $dialog.fadeOut(200);
            }

            // --- E. 多线程并发命令解析 (放在 UI 之后，防止父级截断子级的 UI) ---
            if (mCmd) {
                const commands = mCmd.split(';');
                commands.forEach(cmdStr => {
                    const cmd = cmdStr.trim();
                    if (!cmd) return;

                    if (cmd.startsWith('start_mtn')) {
                        const target = cmd.replace('start_mtn', '').trim();
                        const [nextGroup, nextSpecific] = target.split(':');
                        if (nextGroup) {
                            // 递归子任务 (isTopLevel 设为 false，不清理 UI)
                            executeVTSAction(nextGroup, nextSpecific, false);
                        }
                    } else if (cmd.startsWith('change_cos')) {
                        const targetJson = cmd.replace('change_cos', '').trim();
                        if (window.isModelLoading) return;
                        var maxTex = modelTexturesMax[currentModel];
                        if (Array.isArray(maxTex)) {
                            var targetIndex = maxTex.indexOf(targetJson);
                            if (targetIndex !== -1) {
                                currentTexId = targetIndex + 1;
                                if (poilive2d_config.texture_record === '1') {
                                    localStorage.setItem('live2d_tex_' + currentModel, currentTexId);
                                }
                                $("#live2d").stop().animate({ opacity: '0' }, 200, function () { InitPoi(); });
                            }
                        }
                    } else if (cmd.startsWith('open_url')) {
                        const url = cmd.replace('open_url', '').trim();
                        if (url) window.open(url, '_blank');
                    }
                });
            }

            // --- F. json 中独立的 next_mtn 链式调用 ---
            const mNextMtn = motionDef.NextMtn || motionDef.next_mtn;
            if (mNextMtn) {
                const [nextGroup, nextSpecific] = mNextMtn.split(':');
                if (nextGroup) executeVTSAction(nextGroup, nextSpecific, false);
            }
        }

        // ==========================================
        // 射线碰撞探测入口 (融合 Z轴排序 与 极致寻路强化)
        // ==========================================
        model.on('hit', (hitAreas) => {
            if (!hitAreas.length) return;

            // 1. Z轴高度排序 (解决重叠问题)
            let matchedAreas = hitAreas.map(hitArea => {
                const config = rawHitAreas.find(h => (h.Name === hitArea || h.name === hitArea) || (h.Id === hitArea || h.id === hitArea));
                const order = config ? (config.Order || config.order || 0) : 0;
                return { hitArea, config, order };
            });

            matchedAreas.sort((a, b) => b.order - a.order);
            const topmost = matchedAreas[0];

            const hitConfig = topmost.config;
            const hitArea = topmost.hitArea;

            let group = null;
            let specific = null;

            if (hitConfig && (hitConfig.Motion || hitConfig.motion)) {
                [group, specific] = (hitConfig.Motion || hitConfig.motion).split(':');
            } else {
                // 【核心修复】：使用 ?? 代替 ||，完美保护空字符串 "" 不被丢弃
                const areaId = hitConfig?.Id ?? hitConfig?.id ?? hitArea;
                const areaName = hitConfig?.Name ?? hitConfig?.name ?? hitArea;

                // 去重，合并所有可能的名称和 ID。
                // 【核心修复】：删除了之前的 .filter(Boolean)，因为对这个模型来说，空字符串也是合法的钥匙！
                const searchKeys = [...new Set([areaName, areaId, hitArea])];
                const prefixes = ["tap_", "Tap_", "Tap", "tap", ""];

                for (const key of searchKeys) {
                    if (key === null || key === undefined) continue;
                    for (const prefix of prefixes) {
                        if (rawMotions[prefix + key]) {
                            group = prefix + key;
                            break;
                        }
                    }
                    if (group) break;
                }
            }

            if (group) {
                console.log(`🎯 触发指令路由 -> 组: ${group} (优先级: ${topmost.order})`);
                executeVTSAction(group, specific, true);
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

        window.isModelLoading = false;
    }).catch(error => {
        console.error("Live2D 模型加载失败:", error);
        window.isModelLoading = false;
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
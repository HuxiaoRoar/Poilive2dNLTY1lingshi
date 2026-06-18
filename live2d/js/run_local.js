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
        
        modelUrl = poilive2d_api_url + "?model=" + currentModel + "&tex=" + currentTexId;
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

        // F. 鼠标视线跟随（眼神对视）
        // model.interactive = true;
        // pixiApp.stage.interactive = true;

        // pixiApp.stage.off('pointermove');
        // pixiApp.stage.on('pointermove', (event) => {
        //     if (currentLive2dModel) {
        //         currentLive2dModel.focus(event.data.global.x, event.data.global.y);
        //     }
        // });
        // ==========================================
        // ★ F. 核心重构：电竞级鼠标视线跟随 (彻底解决原版阻尼漂移)
        // ==========================================
        model.interactive = true;
        pixiApp.stage.interactive = true;
        pixiApp.stage.off('pointermove');

        // 我们自己维护的眼睛坐标记忆体
        let targetEyeX = 0;
        let targetEyeY = 0;
        let currentEyeX = 0;
        let currentEyeY = 0;

        if (window._poiPointerMoveHandler) {
            window.removeEventListener('pointermove', window._poiPointerMoveHandler);
        }
        
        window._poiPointerMoveHandler = (event) => {
            if (!currentLive2dModel) return;

            // 1. 获取 Canvas 元素在当前浏览器视口中的绝对位置
            const rect = pixiApp.view.getBoundingClientRect();

            // 2. 计算模型在屏幕上的“真实中心点”
            const modelCenterX = rect.left + rect.width / 2;
            const modelCenterY = rect.top + rect.height / 2;

            // 3. 计算鼠标距离模型中心的偏移量
            const dx = event.clientX - modelCenterX;
            const dy = event.clientY - modelCenterY;

            // 4. 全屏归一化：以屏幕宽高的一半作为最大追踪范围
            let nx = dx / (window.innerWidth / 2);
            let ny = -(dy / (window.innerHeight / 2)); // 保持负号，适配 L2D Y轴向上为正

            targetEyeX = Math.max(-1, Math.min(1, nx));
            targetEyeY = Math.max(-1, Math.min(1, ny));
        };

        // 将事件绑定到 window，实现鼠标离开画布依然能追踪
        window.addEventListener('pointermove', window._poiPointerMoveHandler);

        // 赋个初始值，防止第一次 update 拿到 undefined
        model.poiCurrentX = 0;
        model.poiCurrentY = 0;

        // ==========================================
        // ★ 核心解释器 (多任务并发 + 独立UI保护版)
        // ==========================================
        const rawJson = model.internalModel.settings.json || model.internalModel.settings;
        const rawMotions = rawJson.FileReferences?.Motions || rawJson.FileReferences?.motions || rawJson.Motions || rawJson.motions || {};
        const rawHitAreas = rawJson.HitAreas || rawJson.hit_areas || [];
        const rawExpressions = rawJson.FileReferences?.Expressions || rawJson.FileReferences?.expressions || rawJson.Expressions || rawJson.expressions || [];

        let vtsTimeout = null;
        // ==========================================
        // ★ 1. 解析通用的拖拽控制字典 (强化版：名字和ID双重绑定)
        // ==========================================
        const dragConfigMap = {};
        const paramHitItems = rawJson.Controllers?.ParamHit?.Items || rawJson.controllers?.param_hit?.items || [];

        paramHitItems.forEach(item => {
            if (item.HitArea && item.Id) {
                dragConfigMap[item.HitArea] = item;
                const hConfig = rawHitAreas.find(h => h.Name === item.HitArea || h.name === item.HitArea);
                if (hConfig && hConfig.Id) {
                    dragConfigMap[hConfig.Id] = item;
                }
            }
        });

        console.log("🛠️ [拖拽系统] 字典初始化完成，支持拖拽的区域：", Object.keys(dragConfigMap));
        let forcedParamValues = {};

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
            ['File', 'file', 'Sound', 'sound'].forEach(key => {
                if (motionDef[key] && motionDef[key].includes('#')) {
                    motionDef[key] = motionDef[key].split('/').map(p => encodeURIComponent(p)).join('/');
                }
            });           

            const mFile = motionDef.File || motionDef.file;
            const mExp = motionDef.Expression || motionDef.expression;
            const mCmd = motionDef.Command || motionDef.command || motionDef.PostCommand || motionDef.post_command;
            const mText = motionDef.Text || motionDef.text;
            const mChoices = motionDef.Choices || motionDef.choices;
            const mSound = motionDef.Sound || motionDef.sound;

            // --- A. 播放动作与引擎内嵌音频 ---
            let motionPromise = Promise.resolve();
            if (engineGroup && mFile) {
                model.motion(groupName, finalIndex);
            } else if (!mFile && !mCmd && !mSound && !mText && (!mChoices || mChoices.length === 0)) {
                console.log(`💬 指令 [${groupName}] 为空配置，已安全放行。`);
            }

            // --- ★ B. 脱离骨骼的纯语音兜底播放 (防 # 号截断) ---
            if (!mFile && mSound) {
                const audioUrl = message_Path + "model/" + encodeURIComponent(currentModel) + "/" + mSound;
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
                if (nextGroup) {
                    // ★ 问题1修复核心：等待 Promise 解析后，强行扔进异步队列 (setTimeout)，彻底斩断同步死循环
                    motionPromise.then(() => {
                        setTimeout(() => {
                            executeVTSAction(nextGroup, nextSpecific, false);
                        }, 50);
                    });
                }
            }
        }

        
        // ==========================================
        // ★ 2. 状态机：拦截并重构交互事件 (带详尽调试版)
        // ==========================================
        let pointerDownContext = null;
        let activeDragParam = null;
        let longPressTimer = null;
        let hasTriggeredLongPress = false;
        const LONG_PRESS_DURATION = 600; // 长按触发时间：600毫秒

        model.on('pointerdown', (e) => {
            const hitAreas = model.hitTest(e.data.global.x, e.data.global.y);
            if (!hitAreas.length) return;

            let matchedAreas = hitAreas.map(hitArea => {
                const config = rawHitAreas.find(h => (h.Name === hitArea || h.name === hitArea) || (h.Id === hitArea || h.id === hitArea));
                const order = config ? (config.Order || config.order || 0) : 0;
                return { hitArea, config, order };
            });
            matchedAreas.sort((a, b) => b.order - a.order);
            const topmost = matchedAreas[0];
            const hitAreaName = topmost.hitArea;

            hasTriggeredLongPress = false;
            if (longPressTimer) clearTimeout(longPressTimer);

            pointerDownContext = {
                startX: e.data.global.x,
                startY: e.data.global.y,
                hitArea: hitAreaName,
                topmostConfig: topmost.config,
                isDragging: false,
                hasTriggeredMaxMtn: false // ★ 新增：防止到达极限值时疯狂重复触发
            };

            const lookupKey = (topmost.config && topmost.config.Name) ? topmost.config.Name : hitAreaName;
            const config = dragConfigMap[hitAreaName] || dragConfigMap[lookupKey];

            if (config) {
                const initialMousePos = config.Axis === 0 ? e.data.global.x : e.data.global.y;
                const initialParamVal = forcedParamValues[config.Id] !== undefined
                    ? forcedParamValues[config.Id]
                    : model.internalModel.coreModel.getParameterValueById(config.Id);

                activeDragParam = {
                    config: config,
                    initialMousePos: initialMousePos,
                    initialParamVal: initialParamVal
                };
                console.log(`🛠️ [交互系统] 抓取部位: ${lookupKey}, 参数: ${config.Id}, 初始值: ${initialParamVal.toFixed(2)}`);
            }

            // 开启长按定时器
            longPressTimer = setTimeout(() => {
                if (pointerDownContext && !pointerDownContext.isDragging) {
                    hasTriggeredLongPress = true;
                    console.log(`🛠️ [交互系统] 触发长按！部位: ${lookupKey}`);
                    // 可选：如果有些部位纯靠长按触发，这里可以写死 fallback 逻辑
                }
            }, LONG_PRESS_DURATION);
        });       

        // ★ 灵敏度放大器：如果你觉得拖得太慢，把 5.0 改成 10.0；太快了就改成 2.0
        const SENSITIVITY = 5.0;

        model.on('pointermove', (e) => {
            if (!pointerDownContext) return;
            
            const dx = e.data.global.x - pointerDownContext.startX;
            const dy = e.data.global.y - pointerDownContext.startY;

            if (!activeDragParam) {
                // 唯一需要做的事：如果发生了滑动，掐死“长按定时器”，防止长按菜单误弹
                if (longPressTimer && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
                // 直接 return！绝对不设置 isDragging，永远保证松手时能触发点击发声
                // 同时也跳过了下方所有复杂的数学运算，性能拉满
                return;
            }

            // 移动超过5像素判定为拖拽
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                pointerDownContext.isDragging = true;

                // 彻底杜绝误触：一旦确认为拖拽，立刻销毁长按定时器！
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
            }

            if (pointerDownContext.isDragging && activeDragParam) {
                const config = activeDragParam.config;
                const currentMousePos = config.Axis === 0 ? e.data.global.x : e.data.global.y;
                const delta = currentMousePos - activeDragParam.initialMousePos;

                let newValue = activeDragParam.initialParamVal + (delta * (config.Factor || 1.0) * SENSITIVITY);

                let maxLimit = 30;
                let minLimit = -30;
                if (activeDragParam.initialParamVal >= 0 && activeDragParam.initialParamVal <= 1 && config.Id.toLowerCase().includes('opacity')) {
                    maxLimit = 1;
                    minLimit = 0;
                }

                // 将数值死死卡在安全范围内
                newValue = Math.max(minLimit, Math.min(maxLimit, newValue));
                forcedParamValues[config.Id] = newValue;

               
                // ★ 方案 A 核心：阈值极限触发机制 (解析 MaxMtn)                
                if (config.MaxMtn && !pointerDownContext.hasTriggeredMaxMtn) {
                    // 当参数被推到最大值或最小值时触发
                    if (newValue >= maxLimit || newValue <= minLimit) {
                        pointerDownContext.hasTriggeredMaxMtn = true;
                        console.log(`🛠️ [交互系统] 参数达到极限值！暴力触发隐藏菜单: ${config.MaxMtn}`);

                        const [mGroup, mSpecific] = config.MaxMtn.split(':');
                        // isTopLevel 传 true，确保弹出的对话框能覆盖掉之前的 UI
                        executeVTSAction(mGroup, mSpecific, true);
                    }
                }
            }
        });

        const handlePointerUp = (e) => {
            // ★ 松手时，无论如何先清理定时器
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }

            if (pointerDownContext) {
                // 只有在【没拖动】且【没触发长按】的情况下，才属于普通点击！
                if (!pointerDownContext.isDragging && !hasTriggeredLongPress) {
                    console.log("🛠️ [交互系统] 判定为[普通点击]。");
                    executeTapAction(pointerDownContext.topmostConfig, pointerDownContext.hitArea);
                } else if (pointerDownContext.isDragging) {
                    console.log("🛠️ [交互系统] 拖拽结束，已拦截点击事件。");
                } else if (hasTriggeredLongPress) {
                    console.log("🛠️ [交互系统] 长按动作已执行完毕，松手时不额外触发点击。");
                }
            }

            if (activeDragParam) {
                if (!activeDragParam.config.LockParam) {
                    delete forcedParamValues[activeDragParam.config.Id];
                }
            }

            activeDragParam = null;
            pointerDownContext = null;
        };

        model.on('pointerup', handlePointerUp);
        model.on('pointerupoutside', handlePointerUp);

        model.internalModel.on('beforeModelUpdate', () => {

            // -------- [A] 视线追踪重绘部分 --------
            const TRACKING_SPEED = 0.4;
            currentEyeX += (targetEyeX - currentEyeX) * TRACKING_SPEED;
            currentEyeY += (targetEyeY - currentEyeY) * TRACKING_SPEED;

            if (model.internalModel.focusController) {
                model.internalModel.focusController.focus(currentEyeX, currentEyeY, true);
            }

            // -------- [B] 拖拽形变重绘部分 --------
            for (const [paramId, value] of Object.entries(forcedParamValues)) {
                model.internalModel.coreModel.setParameterValueById(paramId, value);
            }

            if (Math.random() < 0.15) {
                console.log(`[视线追踪调试] 目标Target(X:${targetEyeX.toFixed(2)}, Y:${targetEyeY.toFixed(2)}) | 实际Current(X:${currentEyeX.toFixed(2)}, Y:${currentEyeY.toFixed(2)})`);
            }

        });


        function executeTapAction(hitConfig, hitArea) {
            let group = null;
            let specific = null;

            if (hitConfig && (hitConfig.Motion || hitConfig.motion)) {
                [group, specific] = (hitConfig.Motion || hitConfig.motion).split(':');
            } else {
                const areaId = hitConfig?.Id ?? hitConfig?.id ?? hitArea;
                const areaName = hitConfig?.Name ?? hitConfig?.name ?? hitArea;

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
                console.log(`🎯 触发指令路由 -> 组: ${group}`);
                executeVTSAction(group, specific, true);
            }
        }

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
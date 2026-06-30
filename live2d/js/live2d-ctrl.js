// ==========================================
// Live2D 核心状态与交互控制器 (Pixi.js 现代化兼容版)
// ==========================================

var theModel = Object.keys(poilive2d_models_info);
var modelTexturesMax = poilive2d_models_info;

if (theModel.length === 0) {
    theModel = ["天依"];
    modelTexturesMax = { "天依": 3 };
}

var currentModelIdx = 0;
var currentModel = theModel[0];
var currentTexId = 1;

// 1. 初始加载状态解析
function resolveInitialState() {
    var savedRoleName = localStorage.getItem('live2d_role_name');
    var foundIdx = theModel.indexOf(savedRoleName);

    if (poilive2d_config.role_record === '1' && savedRoleName !== null && foundIdx !== -1) {
        currentModelIdx = foundIdx;
    } else {
        currentModelIdx = Math.floor(Math.random() * theModel.length);
        if (poilive2d_config.role_record === '1') {
            localStorage.setItem('live2d_role_name', theModel[currentModelIdx]);
        }
    }
    currentModel = theModel[currentModelIdx];

    var maxTex = modelTexturesMax[currentModel];

    // 核心转换：统一算出到底有几套衣服
    var maxCount = Array.isArray(maxTex) ? maxTex.length : (typeof maxTex === 'number' ? maxTex : 1);

    if (maxCount <= 1) {
        currentTexId = 1;
    } else {
        var texKey = 'live2d_tex_' + currentModel;
        var savedTexId = localStorage.getItem(texKey);
        if (poilive2d_config.texture_record === '1' && savedTexId !== null && parseInt(savedTexId) <= maxCount) {
            currentTexId = parseInt(savedTexId);
        } else {
            currentTexId = Math.floor(Math.random() * maxCount) + 1;
            if (poilive2d_config.texture_record === '1') {
                localStorage.setItem(texKey, currentTexId);
            }
        }
    }
}
resolveInitialState();

// 2. 目录定位平滑滚动
function positionWrap() {
    $('.h2wrap, .h3wrap').click(function () {
        if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
            var $target = $(this.hash);
            $target = $target.length && $target || $('[name=' + this.hash.slice(1) + ']');
            if ($target.length) {
                var targetOffset = $target.offset().top;
                $('html,body').animate({ scrollTop: targetOffset }, 800);
                return false;
            }
        }
    });
}

// 3. 初始化 Live2D 容器、UI与拖拽
function initLive2d() {
    var isSingleLayout = poilive2d_config.btn_layout === '1';

    if (poilive2d_config.btn_all === '0') {
        $('body').append("<div class=\"show-button\">召唤</div>");
    } else {
        var marginTop = parseInt(poilive2d_config.btn_margin_top) || 64;
        var btnGap = 5;
        var dragMode = poilive2d_config.drag_mode || 'free_restore';
        var landlordDom = document.getElementById('landlord');

        var cursorStyle = '';
        if (dragMode === 'free_restore' || dragMode === 'free_keep') cursorStyle = 'cursor: move !important;';
        else if (dragMode === 'horizontal') cursorStyle = 'cursor: ew-resize !important;';
        else if (dragMode === 'vertical') cursorStyle = 'cursor: ns-resize !important;';

        var layoutStyle = `            
            .l2d-menu-left, .l2d-menu-right {
                position: absolute; display: flex; flex-direction: column; gap: ${btnGap}px;
                padding: 0; margin: 0; list-style: none; display: none; cursor: default !important;
            }
            .l2d-menu-left { left: 0; top: ${marginTop}px !important; }
            .l2d-menu-right { right: 0; top: ${marginTop}px !important; }
            #live2d { cursor: default !important; }
            .l2d-action, .l2d-action-L {
                position: relative !important; top: auto !important; bottom: auto !important;
                cursor: pointer; left: auto !important; right: auto !important; display: block;
            }
        `;

        if (isSingleLayout) {
            layoutStyle += `
                .l2d-menu-right { top: ${marginTop}px !important; right: -25px; }
                .message { transform: translateY(-30px); }
            `;
        }
        $('head').append('<style id="l2d-layout-override">' + layoutStyle + '</style>');

        var leftMenuHtml = '', rightMenuHtml = '';

        if (isSingleLayout) {
            if (poilive2d_config.btn_hide === '1') rightMenuHtml += '<li class="l2d-action" id="hide-button">隐藏</li>';
            if (poilive2d_config.btn_sing === '1') rightMenuHtml += '<li class="l2d-action" id="sing-button" onclick="getsong();">Sing</li>';
            if (poilive2d_config.btn_menu === '1') rightMenuHtml += '<li class="l2d-action" id="catalog-button">目录</li>';
            if (poilive2d_config.btn_model === '1') rightMenuHtml += '<li class="l2d-action" id="change-button">变身</li>';
            if (poilive2d_config.btn_texture === '1') rightMenuHtml += '<li class="l2d-action" id="switch-button">变装</li>';
            if (poilive2d_config.btn_hitokoto === '1') rightMenuHtml += '<li class="l2d-action" id="hitokoto-button">一言</li>';            
        } else {
            if (poilive2d_config.btn_model === '1') leftMenuHtml += '<li class="l2d-action-L" id="change-button">变身</li>';
            if (poilive2d_config.btn_texture === '1') leftMenuHtml += '<li class="l2d-action-L" id="switch-button">变装</li>';
            if (poilive2d_config.btn_hitokoto === '1') leftMenuHtml += '<li class="l2d-action-L" id="hitokoto-button">一言</li>';

            if (poilive2d_config.btn_hide === '1') rightMenuHtml += '<li class="l2d-action" id="hide-button">隐藏</li>';
            if (poilive2d_config.btn_sing === '1') rightMenuHtml += '<li class="l2d-action" id="sing-button" onclick="getsong();">Sing</li>';
            if (poilive2d_config.btn_menu === '1') rightMenuHtml += '<li class="l2d-action" id="catalog-button">目录</li>';            
        }

        if (leftMenuHtml) $('#landlord').append('<ul class="l2d-menu l2d-menu-left">' + leftMenuHtml + '</ul>');
        if (rightMenuHtml) $('#landlord').append('<ul class="l2d-menu l2d-menu-right">' + rightMenuHtml + '</ul>');
        $('body').append("<div class=\"show-button\">召唤</div>");
    }

    if ($('.l2d-menu').length > 0) {

        // ==========================================
        // 【变身】按钮点击事件
        // ==========================================
        $('#change-button').off('click').on('click', () => {
            if (window.isModelLoading) return;
            window.isModelLoading = true;

            var realIdx = theModel.indexOf(currentModel);
            if (realIdx === -1) realIdx = 0;

            if (poilive2d_config.switch_model === 'random') {
                var nextIdx;
                do { nextIdx = Math.floor(Math.random() * theModel.length); } while (nextIdx === realIdx && theModel.length > 1);
                currentModelIdx = nextIdx;
            } else {
                currentModelIdx = (realIdx + 1) % theModel.length;
            }

            currentModel = theModel[currentModelIdx];
            if (poilive2d_config.role_record === '1') localStorage.setItem('live2d_role_name', currentModel);

            var maxTex = modelTexturesMax[currentModel];
            var texKey = 'live2d_tex_' + currentModel;
            var savedTexId = localStorage.getItem(texKey);

            // 核心转换
            var maxCount = Array.isArray(maxTex) ? maxTex.length : (typeof maxTex === 'number' ? maxTex : 1);

            if (maxCount <= 1) {
                currentTexId = 1;
            } else {
                if (poilive2d_config.texture_record === '1' && savedTexId !== null && parseInt(savedTexId) <= maxCount) {
                    currentTexId = parseInt(savedTexId);
                } else {
                    currentTexId = Math.floor(Math.random() * maxCount) + 1;
                    if (poilive2d_config.texture_record === '1') localStorage.setItem(texKey, currentTexId);
                }
            }

            showMessage("已切换成 " + currentModel, 5000);

            // 【修改点 3】：使用 InitPoi 替代 loadlive2d，精简动画
            $("#live2d").animate({ opacity: '0' }, 200, function () {
                InitPoi(); // 引擎会在加载完成后自动 fadeIn 变亮，完美衔接
            });
        });

        // ==========================================
        // 【变装】按钮点击事件
        // ==========================================
        $('#switch-button').off('click').on('click', () => {
            if (window.isModelLoading) return;
            window.isModelLoading = true;

            var maxTex = modelTexturesMax[currentModel];
            // 核心转换
            var maxCount = Array.isArray(maxTex) ? maxTex.length : (typeof maxTex === 'number' ? maxTex : 1);

            if (maxCount <= 1) {
                showMessage("当前模型只有一套衣服，无法变装哦！", 4000);
                return; // 直接中止，啥也不干
            }

            currentTexId = parseInt(currentTexId);

            if (poilive2d_config.switch_texture === 'random') {
                var nextTex;
                do {
                    nextTex = Math.floor(Math.random() * maxCount) + 1;
                } while (nextTex === currentTexId && maxCount > 1);
                currentTexId = nextTex;
            } else {
                currentTexId = (currentTexId % maxCount) + 1;
            }

            if (poilive2d_config.texture_record === '1') {
                localStorage.setItem('live2d_tex_' + currentModel, currentTexId);
            }

            // 【修改点 5】：同样使用 InitPoi() 代替老黑盒，彻底告别灵异闪烁
            $("#live2d").animate({ opacity: '0' }, 200, function () {
                InitPoi();
            });
        });

        $('#catalog-button').on('click', () => {
            var tits = 0, catalog;
            if ($('article h2').length || $('article h3').length) {
                catalog = "<p class=\"l2d-cat\">这里有文章的目录哦~</p><br>";
                $('article h2, article h3').each(function () {
                    $(this).attr("id", "title-" + tits);
                    if (0 == $(this).filter('h2').val()) catalog += "<p class=\"l2d-h2cat\">&raquo;<a class=\"h2wrap\" href=\"#title-" + tits + "\">" + $(this).text() + "</a></p><br>";
                    if (0 == $(this).filter('h3').val()) catalog += "<p class=\"l2d-h3cat\">&raquo;<a class=\"h3wrap\" href=\"#title-" + tits + "\">" + $(this).text() + "</a></p><br>";
                    tits++;
                });
                setTimeout("positionWrap()", 200);
            } else {
                catalog = "然而这里并没有目录。";
            }
            showMessage(catalog, 10000);
        });

        $('#hitokoto-button').off('click').on('click', () => {
            showHitokoto();
        });
    }

    $('#landlord').hover(
        () => { $('.l2d-menu, #poi-corner-tools').fadeIn(200).css('display', 'flex'); },
        () => { $('.l2d-menu, #poi-corner-tools').fadeOut(200); }
    );

    $('#hide-button').off('click').on('click', () => {
        var msgs = poilive2d_config.mouse_hide_msgs;
        if (Array.isArray(msgs)) msgs = msgs.filter(function (item) { return item.trim() !== ''; });

        $('#landlord').css('transition', 'none');

        if (msgs && msgs.length > 0) {
            showMessage(msgs, 3000);
            $('#landlord').fadeOut(1500, function () {
                $('.show-button').fadeIn(300);
                $('#landlord').css('transition', '');
            });
        } else {
            $('#landlord').fadeOut(1000, function () {
                $('.show-button').fadeIn(300);
                $('#landlord').css('transition', '');
            });
        }
    });

    $('.show-button').off('click').on('click', () => {
        $('.show-button').fadeOut(200);

        var msgs = poilive2d_config.mouse_show_msgs;
        if (Array.isArray(msgs)) msgs = msgs.filter(function (item) { return item.trim() !== ''; });

        if (msgs && msgs.length > 0) {
            showMessage(msgs, 5000);
        }

        $('#landlord').css('transition', 'none').fadeIn(1000, function () {
            $('#landlord').css('transition', '');
        });
    });


    var landlordDom = document.getElementById('landlord');

    if (landlordDom) {
        var dragRecord = poilive2d_config.drag_record || '0';
        if (dragRecord === '1') {
            var savedLeft = localStorage.getItem('live2d_cell_left');
            var savedTop = localStorage.getItem('live2d_cell_top');

            // 只有当本地明确存在历史保存的有效坐标时，才强行覆盖内联定位
            if (savedLeft !== null && savedTop !== null && savedLeft !== 'auto' && savedTop !== 'auto') {
                landlordDom.style.setProperty('left', savedLeft, 'important');
                landlordDom.style.setProperty('top', savedTop, 'important');
                landlordDom.style.setProperty('right', 'auto', 'important');
                landlordDom.style.setProperty('bottom', 'auto', 'important');
            }
        } else {
            // 【新增防呆功能】：如果选项未开启（或被关闭），但本地残留有历史位置信息
            // 直接将本地缓存清除，下次再开启记录时完全按照后台默认位置走，解决拖出窗口无法找回的痛点
            if (localStorage.getItem('live2d_cell_left') !== null || localStorage.getItem('live2d_cell_top') !== null) {                
                localStorage.removeItem('live2d_cell_left');
                localStorage.removeItem('live2d_cell_top');
            }
        }
        
        // ==========================================
        // 1. 动态生成专属拖拽手柄 (物理隔离的载体)
        // ==========================================
        
        // ==========================================
        // ★ 新增：角落独立工具栏 (包裹拖拽手柄与微调齿轮)
        // ==========================================
        var isDockRight = (typeof poilive2d_config !== 'undefined' && poilive2d_config.role_dock === 'right');

        var cornerTools = document.createElement('div');
        cornerTools.id = 'poi-corner-tools';
        // 智能避让：角色靠右贴边，控件就去左下角；靠左，就去右下角
        if (isDockRight) {
            cornerTools.style.left = '2px';
        } else {
            cornerTools.style.right = '2px';
        }

        // 1. 专属拖拽手柄
        var dragHandle = document.createElement('div');
        dragHandle.id = 'poi-drag-handle';
        dragHandle.className = 'poi-corner-btn'; // 应用刚写的 20x20 样式

        var isFree = (dragMode === 'free_restore' || dragMode === 'free_keep');
        var isHorizontal = (dragMode === 'horizontal');
        var isVertical = (dragMode === 'vertical');

        if (isFree) {
            dragHandle.innerHTML = '✥';
            dragHandle.style.cursor = 'move';
            dragHandle.title = "按住自由拖动";
        } else if (isHorizontal) {
            dragHandle.innerHTML = '↔';
            dragHandle.style.cursor = 'ew-resize';
            dragHandle.title = "按住水平拖动";
        } else if (isVertical) {
            dragHandle.innerHTML = '↕︎';
            dragHandle.style.cursor = 'ns-resize';
            dragHandle.title = "按住垂直拖动";
        } else {
            dragHandle.innerHTML = '🔒';
            dragHandle.style.cursor = 'not-allowed';
            dragHandle.title = "位置已锁定";
        }

        // 2. 微调面板触发齿轮
        var adjustBtn = document.createElement('div');
        adjustBtn.id = 'adjust-button';
        adjustBtn.className = 'poi-corner-btn';
        adjustBtn.innerHTML = '⚙️';
        adjustBtn.title = "模型微调";

        // 3. 将按钮塞进工具栏，然后将工具栏挂载到容器底座上
        if (dragMode !== 'disable') {
            cornerTools.appendChild(dragHandle);
        }
        cornerTools.appendChild(adjustBtn);
        landlordDom.appendChild(cornerTools);



        // ==========================================
        // 3. 只有非 disable 状态，才挂载拖拽核心事件
        // ==========================================
        if (dragMode !== 'disable') {
            var isDraggingDiv = false, startX, startY, initialX, initialY;

            // 【核心防御】：事件只绑定在 dragHandle 上，模型身体彻底解放！
            dragHandle.addEventListener('mousedown', function (e) {
                if (e.button !== 0) return; // 仅限鼠标左键
                isDraggingDiv = true;
                startX = e.clientX;
                startY = e.clientY;
                initialX = landlordDom.offsetLeft;
                initialY = landlordDom.offsetTop;
                landlordDom.style.setProperty('transition', 'none', 'important');
                e.preventDefault(); // 阻止手柄上的文字被意外选中
            });

            // 移动和松开事件依然绑定在 document 上，保证拖动时鼠标滑出范围也不会断
            document.addEventListener('mousemove', function (e) {
                if (!isDraggingDiv) return;
                var dx = e.clientX - startX, dy = e.clientY - startY;

                // X轴位移：水平拖拽 或 自由拖拽
                if (isHorizontal || isFree) {
                    landlordDom.style.setProperty('left', (initialX + dx) + 'px', 'important');
                    landlordDom.style.setProperty('right', 'auto', 'important');
                }
                // Y轴位移：垂直拖拽 或 自由拖拽
                if (isVertical || isFree) {
                    landlordDom.style.setProperty('top', (initialY + dy) + 'px', 'important');
                    landlordDom.style.setProperty('bottom', 'auto', 'important');
                }
            });

            document.addEventListener('mouseup', function () {
                if (!isDraggingDiv) return;
                isDraggingDiv = false;
                landlordDom.style.setProperty('transition', 'all .3s ease-in-out', 'important');

                // 情形 A：如果是“自由拖拽（松手复原）”，则剥离位置，让它平滑滑回原位
                if (dragMode === 'free_restore') {
                    // 读取可能存在的历史记忆位置
                    var savedLeft = localStorage.getItem('live2d_cell_left');
                    var savedTop = localStorage.getItem('live2d_cell_top');

                    // 如果开启了记录位置信息，并且本地确实存有历史有效坐标
                    if (dragRecord === '1' && savedLeft !== null && savedTop !== null && savedLeft !== 'auto' && savedTop !== 'auto') {
                        // 让它平滑滑回复原到【记录位置信息】的地方，而不是初始位置
                        landlordDom.style.setProperty('left', savedLeft, 'important');
                        landlordDom.style.setProperty('top', savedTop, 'important');
                        landlordDom.style.setProperty('right', 'auto', 'important');
                        landlordDom.style.setProperty('bottom', 'auto', 'important');
                    } else {
                        // 否则（未开启记录或本地没有缓存），按原计划剥离样式，退回到设置里的初始地方
                        landlordDom.style.removeProperty('top');
                        landlordDom.style.removeProperty('left');
                        landlordDom.style.removeProperty('right');
                        landlordDom.style.removeProperty('bottom');
                    }
                }
                // 情形 B：如果是固定位置的模式（free_keep、horizontal、vertical）
                else {
                    // 如果开启了位置记录选项，在每次拖拽模型松手的时候记录模型当前位置
                    if (dragRecord === '1') {
                        var currentLeft = landlordDom.style.left || getComputedStyle(landlordDom).left;
                        var currentTop = landlordDom.style.top || getComputedStyle(landlordDom).top;

                        // 双重安全校验，确保提取到的不是非法的 'auto' 或空值
                        if (currentLeft && currentLeft !== 'auto') {
                            localStorage.setItem('live2d_cell_left', currentLeft);
                        }
                        if (currentTop && currentTop !== 'auto') {
                            localStorage.setItem('live2d_cell_top', currentTop);
                        }
                    }
                }
            });
        }
    }
    // ==========================================
    // ★ 方案 B：注入模型微调 UI 面板
    // ==========================================
    // ★ 智能判定：根据角色贴边情况决定左右

    var isDockRight = (typeof poilive2d_config !== 'undefined' && poilive2d_config.role_dock === 'right');
    
    // 只保留最核心的动态物理定位
    var defaultPosStyle = isDockRight 
        ? "position: absolute; right: 100%; margin-right: 15px; left: auto; bottom: 5px; top: auto;" 
        : "position: absolute; left: 100%; margin-left: 15px; bottom: 5px; top: auto;";

    // HTML 彻底解耦，不再包含内联样式
    var panelHtml = `
        <div id="poi-transform-panel" style="display:none; ${defaultPosStyle}">
            
            <div class="poi-panel-header">
                <b>模型微调</b>
                <span id="poi-tf-close" title="关闭">×</span>
            </div>
            
            <div class="poi-tf-row">
                <div><span>缩放比例</span> <input type="number" id="poi-tf-val-scale" step="0.01" style="width:45px; background:rgba(0,0,0,0.2); border:1px solid rgba(102,204,255,0.3); color:#fff; border-radius:4px; text-align:center; outline:none; font-family:inherit; padding:2px;"></div>
                <input type="range" id="poi-tf-range-scale" min="0.3" max="3.0" step="0.02">
            </div>
            
            <div class="poi-tf-row">
                <div><span>X轴偏移</span> <input type="number" id="poi-tf-val-x" step="1" style="width:45px; background:rgba(0,0,0,0.2); border:1px solid rgba(102,204,255,0.3); color:#fff; border-radius:4px; text-align:center; outline:none; font-family:inherit; padding:2px;"></div>
                <input type="range" id="poi-tf-range-x" min="-400" max="400" step="2">
            </div>
            
            <div class="poi-tf-row">
                <div><span>Y轴偏移</span> <input type="number" id="poi-tf-val-y" step="1" style="width:45px; background:rgba(0,0,0,0.2); border:1px solid rgba(102,204,255,0.3); color:#fff; border-radius:4px; text-align:center; outline:none; font-family:inherit; padding:2px;"></div>
                <input type="range" id="poi-tf-range-y" min="-400" max="400" step="2">
            </div>
            
            <button id="poi-tf-reset" class="vts-btn" style="width:100%;">恢复默认设置</button>
        </div>
    `;

    // 将面板挂载到 landlord 容器中
    if ($('#landlord').length > 0 && $('#poi-transform-panel').length === 0) {
        $('#landlord').append(panelHtml);
    }

    // --- 交互事件绑定 ---
    // 1. 将同步函数挂载到 window 上，成为全局可用（方便 run_local.js 唤醒它）
    window.syncTransformUIToData = function () {
        if (!window._poiTransform) return;
        $('#poi-tf-range-scale').val(window._poiTransform.scale);
        $('#poi-tf-val-scale').val(window._poiTransform.scale.toFixed(2)); // 改用 .val()

        $('#poi-tf-range-x').val(window._poiTransform.offsetX);
        $('#poi-tf-val-x').val(Math.round(window._poiTransform.offsetX));

        $('#poi-tf-range-y').val(window._poiTransform.offsetY);
        $('#poi-tf-val-y').val(Math.round(window._poiTransform.offsetY));
    };

    // 2. 监听按钮：打开面板
    $(document).on('click', '#adjust-button', function () {
        var $panel = $('#poi-transform-panel');

        if ($panel.is(':visible')) {
            // 如果面板当前是开着的，点击就把它关掉
            $panel.fadeOut(200);
        } else {
            // 如果面板是关着的，先抓取最新数据同步，再把它打开
            if (window.syncTransformUIToData) window.syncTransformUIToData();
            $panel.fadeIn(200);
        }
    });

    $(document).on('click', '#poi-tf-close', function () {
        $('#poi-transform-panel').fadeOut(200);
    });

    // 3. 当拖动滑动条时 -> 改变文本框数值 -> 改变模型
    $(document).on('input', '#poi-tf-range-scale, #poi-tf-range-x, #poi-tf-range-y', function () {
        if (!window._poiTransform) return;

        let scale = parseFloat($('#poi-tf-range-scale').val());
        let x = parseFloat($('#poi-tf-range-x').val());
        let y = parseFloat($('#poi-tf-range-y').val());

        // 同步给输入框
        $('#poi-tf-val-scale').val(scale.toFixed(2));
        $('#poi-tf-val-x').val(Math.round(x));
        $('#poi-tf-val-y').val(Math.round(y));

        window._poiTransform.scale = scale;
        window._poiTransform.offsetX = x;
        window._poiTransform.offsetY = y;
        window._poiTransform.apply();
    });

    // 4. 当直接在文本框里打字输入时 -> 改变滑动条 -> 改变模型
    $(document).on('input', '#poi-tf-val-scale, #poi-tf-val-x, #poi-tf-val-y', function () {
        if (!window._poiTransform) return;

        // 抓取打字输入的数值，如果输入为空或乱码，给个默认值保底
        let scale = parseFloat($('#poi-tf-val-scale').val()) || 1.0;
        let x = parseFloat($('#poi-tf-val-x').val()) || 0;
        let y = parseFloat($('#poi-tf-val-y').val()) || 0;

        // 同步给滑动条
        $('#poi-tf-range-scale').val(scale);
        $('#poi-tf-range-x').val(x);
        $('#poi-tf-range-y').val(y);

        window._poiTransform.scale = scale;
        window._poiTransform.offsetX = x;
        window._poiTransform.offsetY = y;
        window._poiTransform.apply();
    });

    // 5. 松手或输入完成后保存本地数据
    $(document).on('change', '#poi-tf-range-scale, #poi-tf-range-x, #poi-tf-range-y, #poi-tf-val-scale, #poi-tf-val-x, #poi-tf-val-y', function () {
        if (window._poiTransform) window._poiTransform.save();
    });

    // 6. 恢复默认设置按钮逻辑
    $(document).on('click', '#poi-tf-reset', function () {
        if (!window._poiTransform) return;
        window._poiTransform.scale = 1.0;
        window._poiTransform.offsetX = 0;
        window._poiTransform.offsetY = 0;
        window._poiTransform.apply();
        window._poiTransform.save();

        if (window.syncTransformUIToData) window.syncTransformUIToData(); // 回弹UI
        $('#poi-transform-panel').attr('style', `display:block; ${defaultPosStyle}`);
    });

    // --- ★ 新增：浮框自由拖拽逻辑 ---
    var isPanelDragging = false;
    var pStartX, pStartY, pInitLeft, pInitTop;

    // 鼠标按下把手
    $(document).on('mousedown', '.poi-panel-header', function (e) {
        // 如果点到的是关闭按钮，不触发拖拽
        if (e.target.id === 'poi-tf-close') return;

        isPanelDragging = true;
        var $panel = $('#poi-transform-panel');

        // 核心防御：按下时瞬间获取当前在页面上的物理像素位置
        var currentPos = $panel.position();

        // 瞬间将相对/百分比/margin样式打碎，固化为纯像素坐标，彻底杜绝拖拽瞬间的“跳跃闪烁”
        $panel.css({
            left: currentPos.left + 'px',
            top: currentPos.top + 'px',
            right: 'auto',
            bottom: 'auto',
            marginLeft: '0px',
            marginRight: '0px'
        });

        pStartX = e.clientX;
        pStartY = e.clientY;
        pInitLeft = currentPos.left;
        pInitTop = currentPos.top;

        e.preventDefault(); // 阻止文字被意外选中
    });

    // 鼠标移动中
    $(document).on('mousemove', function (e) {
        if (!isPanelDragging) return;

        var dx = e.clientX - pStartX;
        var dy = e.clientY - pStartY;

        $('#poi-transform-panel').css({
            left: (pInitLeft + dx) + 'px',
            top: (pInitTop + dy) + 'px'
        });
    });

    // 鼠标松开
    $(document).on('mouseup', function () {
        isPanelDragging = false;
    });

    
    // 恢复默认设置按钮逻辑 (视觉动效已全部交由 CSS 的 .vts-btn 处理)
    $(document).on('click', '#poi-tf-reset', function () {
        if (!window._poiTransform) return;

        window._poiTransform.scale = 1.0;
        window._poiTransform.offsetX = 0;
        window._poiTransform.offsetY = 0;

        window._poiTransform.apply();
        window._poiTransform.save();
        syncTransformUIToData(); // UI回弹到中间

        // ★ 点击重置时，让面板回到设定的默认位置，同样极简
        $('#poi-transform-panel').attr('style', `display:block; ${defaultPosStyle}`);
    });
}
initLive2d();

// 4. 音乐播放逻辑
var num = 2;
function getsong() {
    if (num % 2 == 0) {
        var songs_json = poilive2d_config.songs || [];
        if (songs_json.length === 0) {
            showMessage("站长还没有添加歌曲哦！", 5000);
            return;
        }
        var rnum = parseInt(Math.random() * songs_json.length);
        var songs_url = songs_json[rnum]["text"];
        var songs_name = songs_json[rnum]["selector"];
        showMessage("正在播放 [ " + songs_name + " ]", 5000);
        document.getElementById("sing").innerHTML = '<audio src="' + songs_url + '" id="myaudio" controls="controls" loop="false" hidden="true">';
        document.getElementById("sing-button").innerHTML = "Pause";
        document.getElementById('myaudio').play();
        num = num + 1;
    } else {
        document.getElementById("sing-button").innerHTML = "Sing";
        document.getElementById("sing").innerHTML = '<audio src="" id="myaudio" controls="controls" loop="false" hidden="true">';
        num = num + 1;
    }
}
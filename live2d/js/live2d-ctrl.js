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
        var dragMode = poilive2d_config.drag_mode || 'free';
        var cursorStyle = (dragMode === 'free' || dragMode === 'horizontal') ? 'cursor: move !important;' : '';

        var layoutStyle = `
            #landlord {${cursorStyle}}
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

    $('#landlord').hover(() => { $('.l2d-menu').fadeIn(200).css('display', 'flex'); }, () => { $('.l2d-menu').fadeOut(200); });

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

    var dragMode = poilive2d_config.drag_mode || 'free';
    var dragRelease = poilive2d_config.drag_release || 'restore';
    var landlordDom = document.getElementById('landlord');

    if (landlordDom) {
        // ==========================================
        // 1. 动态生成专属拖拽手柄 (物理隔离的载体)
        // ==========================================
        var dragHandle = document.createElement('div');
        dragHandle.id = 'poi-drag-handle';
        dragHandle.className = 'l2d-action'; // 复用你的按钮样式 (背景、高斯模糊等)

        // 为了美观，给手柄加一点基础内联排版（可根据你的实际菜单结构调整）
        dragHandle.style.cssText = 'display: flex; align-items: center; justify-content: center; user-select: none; font-size: 16px; margin-bottom: 5px;';

        // ==========================================
        // 2. 根据拖拽模式，赋予不同的图标和鼠标指针
        // ==========================================
        if (dragMode === 'free') {
            dragHandle.innerHTML = '<span>✥</span>'; // 十字方向标
            dragHandle.style.cursor = 'move';
            dragHandle.title = "按住自由拖动";
        } else if (dragMode === 'horizontal') {
            dragHandle.innerHTML = '<span>↔</span>'; // 左右水平标
            dragHandle.style.cursor = 'ew-resize';
            dragHandle.title = "按住水平拖动";
        } else {
            dragHandle.innerHTML = '<span>🔒</span>'; // 锁头
            dragHandle.style.cursor = 'not-allowed';
            dragHandle.title = "位置已锁定";
        }

        // 将手柄挂载到页面上。如果你有 .l2d-menu 菜单容器，就塞进菜单里；否则直接丢进 landlord
        var menuContainer = landlordDom.querySelector('.l2d-menu');
        if (menuContainer) {
            menuContainer.insertBefore(dragHandle, menuContainer.firstChild); // 放在菜单最上面
        } else {
            // 如果没有独立菜单容器，强制绝对定位在左上角附近
            dragHandle.style.position = 'absolute';
            dragHandle.style.top = '10px';
            dragHandle.style.left = '-35px';
            landlordDom.appendChild(dragHandle);
        }

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

                if (dragMode === 'horizontal' || dragMode === 'free') {
                    landlordDom.style.setProperty('left', (initialX + dx) + 'px', 'important');
                    landlordDom.style.setProperty('right', 'auto', 'important');
                }
                if (dragMode === 'free') {
                    landlordDom.style.setProperty('top', (initialY + dy) + 'px', 'important');
                    landlordDom.style.setProperty('bottom', 'auto', 'important');
                }
            });

            document.addEventListener('mouseup', function () {
                if (!isDraggingDiv) return;
                isDraggingDiv = false;
                landlordDom.style.setProperty('transition', 'all .3s ease-in-out', 'important');
                if (dragRelease === 'restore') {
                    landlordDom.style.removeProperty('top');
                    landlordDom.style.removeProperty('left');
                    landlordDom.style.removeProperty('right');
                    landlordDom.style.removeProperty('bottom');
                }
            });
        }
    }
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
// ==========================================
// Live2D 核心状态与交互控制器 (live2d-core.js)
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

    var texKey = 'live2d_tex_' + currentModel;
    var savedTexId = localStorage.getItem(texKey);
    var maxTex = modelTexturesMax[currentModel];

    if (poilive2d_config.texture_record === '1' && savedTexId !== null && parseInt(savedTexId) <= maxTex) {
        currentTexId = parseInt(savedTexId);
    } else {
        currentTexId = Math.floor(Math.random() * maxTex) + 1;
        if (poilive2d_config.texture_record === '1') {
            localStorage.setItem(texKey, currentTexId);
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

        $('#change-button').off('click').on('click', () => {
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

            var texKey = 'live2d_tex_' + currentModel;
            var savedTexId = localStorage.getItem(texKey);
            var maxTex = modelTexturesMax[currentModel];
            if (poilive2d_config.texture_record === '1' && savedTexId !== null && parseInt(savedTexId) <= maxTex) {
                currentTexId = parseInt(savedTexId);
            } else {
                currentTexId = Math.floor(Math.random() * maxTex) + 1;
                if (poilive2d_config.texture_record === '1') localStorage.setItem(texKey, currentTexId);
            }
            var apiUrl = poilive2d_api_url + "?model=" + encodeURIComponent(currentModel) + "&tex=" + currentTexId;
            loadlive2d('live2d', apiUrl);
            // 依赖 message.js 中的函数
            showMessage("已切换成 " + currentModel, 5000);
        });

        $('#switch-button').off('click').on('click', () => {
            $("#live2d").animate({ opacity: '0' }, 100);
            var maxTex = modelTexturesMax[currentModel];

            // 【终极装甲】：强制保证衣服 ID 是纯数字
            currentTexId = parseInt(currentTexId);

            // 1. 怎么切下一件？（看设置是顺序还是随机）
            if (poilive2d_config.switch_texture === 'random') {
                var nextTex;
                do {
                    nextTex = Math.floor(Math.random() * maxTex) + 1;
                } while (nextTex === currentTexId && maxTex > 1);
                currentTexId = nextTex;
            } else {
                currentTexId = (currentTexId % maxTex) + 1; // 顺序循环: 1,2,3...1
            }

            // 2. 存入记忆
            if (poilive2d_config.texture_record === '1') {
                localStorage.setItem('live2d_tex_' + currentModel, currentTexId);
            }

            // 3. 发起加载
            var apiUrl = poilive2d_api_url + "?model=" + encodeURIComponent(currentModel) + "&tex=" + currentTexId;
            loadlive2d('live2d', apiUrl, showConsoleTips("更换"));
        })

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
    // 隐藏按钮点击事件 (丝滑渐变终极修复版)
    $('#hide-button').off('click').on('click', () => {
        var msgs = poilive2d_config.mouse_hide_msgs;
        if (Array.isArray(msgs)) msgs = msgs.filter(function (item) { return item.trim() !== ''; });

        // 【关键修复】：强行关闭 CSS 过渡，防止与 jQuery 动画打架
        $('#landlord').css('transition', 'none');

        if (msgs && msgs.length > 0) {
            showMessage(msgs, 3000);
            $('#landlord').fadeOut(1500, function () {
                $('.show-button').fadeIn(300);
                // 动画结束后，清空临时加上的 transition，让它恢复原有设定的功能
                $('#landlord').css('transition', '');
            });
        } else {
            $('#landlord').fadeOut(1000, function () {
                $('.show-button').fadeIn(300);
                $('#landlord').css('transition', '');
            });
        }
    });

    // 召唤按钮点击事件 (丝滑渐变终极修复版)
    $('.show-button').off('click').on('click', () => {
        $('.show-button').fadeOut(200);

        var msgs = poilive2d_config.mouse_show_msgs;
        if (Array.isArray(msgs)) msgs = msgs.filter(function (item) { return item.trim() !== ''; });

        if (msgs && msgs.length > 0) {
            showMessage(msgs, 5000);
        }

        // 【关键修复】：同样先关闭 CSS 过渡，再执行淡入
        $('#landlord').css('transition', 'none').fadeIn(1000, function () {
            // 淡入结束后恢复
            $('#landlord').css('transition', '');
        });
    });

    var dragMode = poilive2d_config.drag_mode || 'free';
    var dragRelease = poilive2d_config.drag_release || 'restore';
    var landlordDom = document.getElementById('landlord');

    if (dragMode !== 'disable' && landlordDom) {
        var isDragging = false, startX, startY, initialX, initialY;
        landlordDom.addEventListener('mousedown', function (e) {
            if (e.target.closest('.l2d-menu') || e.target.classList.contains('l2d-action')) return;
            isDragging = true; startX = e.clientX; startY = e.clientY; initialX = landlordDom.offsetLeft; initialY = landlordDom.offsetTop;
            landlordDom.style.setProperty('transition', 'none', 'important');
        });
        document.addEventListener('mousemove', function (e) {
            if (!isDragging) return;
            var dx = e.clientX - startX, dy = e.clientY - startY;
            if (dragMode === 'horizontal' || dragMode === 'free') {
                landlordDom.style.setProperty('left', (initialX + dx) + 'px', 'important'); landlordDom.style.setProperty('right', 'auto', 'important');
            }
            if (dragMode === 'free') {
                landlordDom.style.setProperty('top', (initialY + dy) + 'px', 'important'); landlordDom.style.setProperty('bottom', 'auto', 'important');
            }
        });
        document.addEventListener('mouseup', function () {
            if (!isDragging) return;
            isDragging = false;
            landlordDom.style.setProperty('transition', 'all .3s ease-in-out', 'important');
            if (dragRelease === 'restore') {
                landlordDom.style.removeProperty('top'); landlordDom.style.removeProperty('left');
                landlordDom.style.removeProperty('right'); landlordDom.style.removeProperty('bottom');
            }
        });
    }
}
initLive2d();

// 4. 音乐播放逻辑 (已对接第三页设置)
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
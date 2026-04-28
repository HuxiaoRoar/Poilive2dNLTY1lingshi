function renderTip(template, context) {
    var tokenReg = /(\\)?\{([^\{\}\\]+)(\\)?\}/g;
    return template.replace(tokenReg, function (word, slash1, token, slash2) {
        if (slash1 || slash2) {
            return word.replace('\\', '');
        }
        var variables = token.replace(/\s/g, '').split('.');
        var currentObject = context;
        var i, length, variable;
        for (i = 0, length = variables.length; i < length; ++i) {
            variable = variables[i];
            currentObject = currentObject[variable];
            if (currentObject === undefined || currentObject === null) return '';
        }
        return currentObject;
    });
}

String.prototype.renderTip = function (context) {
    return renderTip(this, context);
};

// 1. 复制内容提示
if(poilive2d_config.tip_copy === '1'){
    $(document).on('copy', function (){
        var msgs = poilive2d_config.mouse_copy_msgs || ["复制了什么？欢迎转载，但要记得加上出处哦！"];
        var text = Array.isArray(msgs) ? msgs[Math.floor(Math.random() * msgs.length)] : msgs;
        showMessage(text, 5000);
    });
}

// 秘密通道
$("#landlord,#live2d").mousedown(function(e) {
    if (3 == e.which)
    showMessage("秘密通道:<br><a href=\""+home_Path+"\">首页</a> <a href=\""+home_Path+"wp-admin/\">登录</a>",5000);
})

// 2. 悬浮和点击事件
function initTips(){
    if(poilive2d_config.mouse_hover){
        $.each(poilive2d_config.mouse_hover, function (index, tips){
            $(tips.selector).mouseover(function (){
                var text = tips.text;
                if(Array.isArray(tips.text)) text = tips.text[Math.floor(Math.random() * tips.text.length)];
                text = text.renderTip({text: $(this).text()});
                showMessage(text, 3000);
            });
        });
    }
    if(poilive2d_config.mouse_click_msgs){
        $.each(poilive2d_config.mouse_click_msgs, function (index, tips){
            $(tips.selector).click(function (){
                var text = tips.text;
                if(Array.isArray(tips.text)) text = tips.text[Math.floor(Math.random() * tips.text.length)];
                text = text.renderTip({text: $(this).text()});
                showMessage(text, 3000);
            }); 
        });          
    }
}
initTips();

// 3. 进站欢迎语
(function (){
    $('#landlord').bind("contextmenu", function() {return false;});
    $('#landlord').bind("selectstart", function() {return false;});
    
    if (poilive2d_config.tip_welcome !== '1') return;

    var text = '';
    if(document.referrer !== ''){
        var referrer = document.createElement('a');
        referrer.href = document.referrer;
        if(`${home_Path}`.indexOf(referrer.hostname) > 0 ){return;}
        text = '你好呀，来自 <span style="color:#0099cc;">' + referrer.hostname + '</span> 的小伙伴！很高兴遇到你！欢迎！';
    } else {
        if (window.location.href == `${home_Path}`) {
            var now = (new Date()).getHours();
            if (now > 0 && now <= 5) {
                text = 'We can sleep all day and party all night!';
            } else if (now > 5 && now <= 7) {
                text = '早上好！早餐一定要吃哦！小笼包，叉烧包，奶黄芝麻豆沙包！挑一个吧！';
            } else if (now > 7 && now <= 11) {
                text = '上午好！工作顺利嘛，不要久坐，多起来走动走动哦！';
            } else if (now > 11 && now <= 14) {
                text = '已经中午了，准备吃什么呀？好饿好饿好饿(๑´ㅂ`๑)';
            } else if (now > 14 && now <= 17) {
                text = '午后容易犯困呢，打起精神别摸鱼啦，今天的目标完成了吗？';
            } else if (now > 17 && now <= 18) {
                text = '傍晚了！别忘了看看窗外的晚霞，很美丽呢，最美不过夕阳红~~';
            } else if (now > 18 && now <= 19) {
                text = '晚餐时间到！今晚又该吃什么呢？云吞面，麻辣烫，羊肉串，蟹壳黄！';    
            } else if (now > 19 && now <= 21) {
                text = '晚上好，今天过得怎么样？休息一会，开局游戏吧！';
            } else if (now > 21 && now <= 24) {
                text = '已经这么晚了呀，你也是深夜诗人吗？早点休息吧，晚安~~';
            } else {
                text = '欢迎来到本站！';
            }
        } else {
            text = '你正在阅读 <span style="color:#0099cc;">「 ' + document.title.split(' - ')[0] + ' 」</span>';
        }
    }
    if (text) showMessage(text, 12000);

    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            var msgs = poilive2d_config.mouse_hide_msgs || ["要出门了吗？路上小心！"];
            var outText = Array.isArray(msgs) ? msgs[Math.floor(Math.random() * msgs.length)] : msgs;
            showMessage(outText, 5000);
        } else {
            showMessage("欢迎回来!", 5000);
        }
    });
})();

// 4. 一言逻辑
var hitokoto_delay = parseInt(poilive2d_config.hitokoto_delay) || 0;
if(hitokoto_delay > 0){
    var getActed = false;
    window.hitokotoTimer = 0;
    var hitokotoInterval = false;

    $(document).mousemove(function(e){getActed = true;}).keydown(function(){getActed = true;});
    setInterval(function() { if (!getActed) ifActed(); else elseActed(); }, 1000);

    function ifActed() {
        if (!hitokotoInterval) {
            hitokotoInterval = true;
            hitokotoTimer = window.setInterval(showHitokoto, hitokoto_delay * 1000);
        }
    }

    function elseActed() {
        getActed = hitokotoInterval = false;
        window.clearInterval(hitokotoTimer);
    }
}

function showHitokoto(){
    var api = poilive2d_config.hitokoto_api || 'hitokoto';
    if(api === 'local') {
         showMessage("希望你每天都能开开心心！", 5000); 
    } else {
        $.getJSON('https://v1.hitokoto.cn/',function(result){
            showMessage(result.hitokoto, 5000);
        });
    }
}

// 5. 显示和隐藏消息
function showMessage(text, timeout){
    if(Array.isArray(text)) text = text[Math.floor(Math.random() * text.length)];
    $('.message').stop();
    $('.message').html(text).fadeTo(200, 1);
    if (timeout === null) timeout = 5000;
    hideMessage(timeout);
}

function hideMessage(timeout){
    $('.message').stop().css('opacity',1);
    if (timeout === null) timeout = 5000;
    $('.message').delay(timeout).fadeOut(200);
}

function positionWrap(){
    $('.h2wrap, .h3wrap').click(function() {
        if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
            var $target = $(this.hash);
            $target = $target.length && $target || $('[name=' + this.hash.slice(1) + ']');
            if ($target.length) {
                var targetOffset = $target.offset().top;
                $('html,body').animate({
                    scrollTop: targetOffset
                }, 800);
                return false;
            }
        }
    });
}


// 6. 初始化 Live2D (完美修复布局、层级与强制拖拽)
function initLive2d (){
    var theModel = new Array("天依", "Poi");
    var modelIdx = 0;
    var isSingleLayout = poilive2d_config.btn_layout === '1';

    if (poilive2d_config.btn_all === '0') {
        $('body').append("<div class=\"show-button\">召唤</div>");
    } else {

        var marginTop = parseInt(poilive2d_config.btn_margin_top) || 64; // 这是整体距顶部的距离
        var btnGap = 5; // 这是按钮之间的固定间隙
        var dragMode = poilive2d_config.drag_mode || 'free';

        var cursorStyle = (dragMode === 'free' || dragMode === 'horizontal') ? 'cursor: move !important;' : '';

        var layoutStyle = `
            /* 【修复问题 1】：给总容器施加绝对高的层级，彻底压制网页文本 */
            #landlord {${cursorStyle}}
            
            .l2d-menu-left, .l2d-menu-right {
                position: absolute;
                display: flex;
                flex-direction: column;
                gap: ${btnGap}px;
                padding: 0;
                margin: 0;
                list-style: none;                
                display: none; 
                cursor: default !important;
            }
            .l2d-menu-left { left: 0; top: ${marginTop}px !important; }
            .l2d-menu-right { right: 0; top: ${marginTop}px !important; }
            #live2d {
                cursor: default !important;
            }
            .l2d-action, .l2d-action-L {
                position: relative !important;
                top: auto !important;
                bottom: auto !important;
                cursor: pointer;
                left: auto !important;
                right: auto !important;
                display: block;
               
            }
        `;

        if (isSingleLayout) {
            layoutStyle += `
                .l2d-menu-right { top: ${marginTop}px !important; right: -25px; }
                .message { transform: translateY(-30px); }
            `;
        }
        
        $('head').append('<style id="l2d-layout-override">' + layoutStyle + '</style>');

        var leftMenuHtml = '';
        var rightMenuHtml = '';

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

    if ($('.l2d-menu').length > 0){
        $('#hide-button').on('click', () => {
            $('#landlord').css('display', 'none');
            $('.show-button').fadeIn(300);
        });
        $('#change-button').on('click', () => {
            modelIdx = (modelIdx + 1) % theModel.length;
            loadlive2d('live2d',message_Path+'model/'+theModel[modelIdx]+'/model.json.php');
            showMessage("已切换成"+theModel[modelIdx],5000);
        });
        $('#switch-button').on('click', () => {
            $("#live2d").animate({opacity:'0'},100);
            loadlive2d('live2d', message_Path+'model/'+theModel[modelIdx]+'/model.json.php',showConsoleTips("更换"));
        });
        
        $('#catalog-button').on('click', () => {
            var tits = 0;
            var catalog;
            if ($('article h2').length || $('article h3').length) {
                catalog = "<p class=\"l2d-cat\">这里有文章的目录哦~</p><br>";
                $('article h2, article h3').each(function(){
                    $(this).attr("id","title-" + tits);
                    if(0 == $(this).filter('h2').val()) catalog += "<p class=\"l2d-h2cat\">&raquo;<a class=\"h2wrap\" href=\"#title-"+tits+"\">"+$(this).text()+"</a></p><br>";
                    if(0 == $(this).filter('h3').val()) catalog += "<p class=\"l2d-h3cat\">&raquo;<a class=\"h3wrap\" href=\"#title-"+tits+"\">"+$(this).text()+"</a></p><br>";
                    tits++;
                });
                setTimeout("positionWrap()",200);
            } else {
                catalog = "然而这里并没有目录。";
            }
            showMessage(catalog, 10000);
        });
    }

    $('#landlord').hover(() => {
        $('.l2d-menu').fadeIn(200).css('display', 'flex');
    }, () => {
        $('.l2d-menu').fadeOut(200);
    });

    $('.show-button').on('click', () => {
        $('#landlord').css('display', 'block');
        $('.show-button').fadeOut(200);
    });

    // ----------------- 满血版强制拖拽逻辑 -----------------
    var dragMode = poilive2d_config.drag_mode || 'free';
    var dragRelease = poilive2d_config.drag_release || 'restore';
    var landlordDom = document.getElementById('landlord');
    
    if (dragMode !== 'disable' && landlordDom) {
        var isDragging = false;
        var startX, startY, initialX, initialY;
        
        landlordDom.addEventListener('mousedown', function(e) {
            if (e.target.closest('.l2d-menu') ||  e.target.classList.contains('l2d-action')) return; 
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = landlordDom.offsetLeft;
            initialY = landlordDom.offsetTop;
            landlordDom.style.setProperty('transition', 'none', 'important'); 
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            var dx = e.clientX - startX;
            var dy = e.clientY - startY;
            
            if (dragMode === 'horizontal' || dragMode === 'free') {
                landlordDom.style.setProperty('left', (initialX + dx) + 'px', 'important');
                landlordDom.style.setProperty('right', 'auto', 'important');
            }
            if (dragMode === 'free') {
                landlordDom.style.setProperty('top', (initialY + dy) + 'px', 'important');
                landlordDom.style.setProperty('bottom', 'auto', 'important');
            }
        });
        
        document.addEventListener('mouseup', function() {
            if (!isDragging) return;
            isDragging = false;
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
initLive2d ();

var num=2;
function getsong(){
    if(num%2==0){
        $.getJSON(`${live2d_Path}songs.json`,function(songs_json){
            var rnum = parseInt(Math.random()*songs_json.length);
            var songs_url = songs_json[rnum]["url"];
            var songs_name = songs_json[rnum]["name"];
            showMessage("正在播放 [ " + songs_name + " ]", 5000);
            document.getElementById("sing").innerHTML='<audio src='+songs_url+' id="myaudio" controls="controls" loop="false" hidden="true">';
            document.getElementById("sing-button").innerHTML="Pause";
            var myAuto = document.getElementById('myaudio');
            myAuto.play();
            num=num+1;
        });
    } else {
        document.getElementById("sing-button").innerHTML="Sing";
        document.getElementById("sing").innerHTML='<audio src="" id="myaudio" controls="controls" loop="false" hidden="true">';
        num=num+1;
    }
}
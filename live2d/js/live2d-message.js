// ==========================================
// 气泡消息与交互文本控制中心 (message.js)
// ==========================================

// 1. 核心消息控制函数
function showMessage(text, timeout) {
    if (Array.isArray(text)) text = text[Math.floor(Math.random() * text.length)];
    $('.message').stop();
    $('.message').html(text).fadeTo(200, 1);
    if (timeout === null) timeout = 5000;
    hideMessage(timeout);
}

function hideMessage(timeout) {
    $('.message').stop().css('opacity', 1);
    if (timeout === null) timeout = 5000;
    $('.message').delay(timeout).fadeOut(200);
}

// 2. 文本模板解析
function renderTip(template, context) {
    var tokenReg = /(\\)?\{([^\{\}\\]+)(\\)?\}/g;
    return template.replace(tokenReg, function (word, slash1, token, slash2) {
        if (slash1 || slash2) return word.replace('\\', '');
        var variables = token.replace(/\s/g, '').split('.');
        var currentObject = context;
        for (var i = 0, length = variables.length; i < length; ++i) {
            currentObject = currentObject[variables[i]];
            if (currentObject === undefined || currentObject === null) return '';
        }
        return currentObject;
    });
}
String.prototype.renderTip = function (context) { return renderTip(this, context); };

// 3. 基础交互事件绑定 (复制与右键)
if (poilive2d_config.tip_copy === '1') {
    $(document).on('copy', function () {
        var msgs = poilive2d_config.mouse_copy_msgs;
        // 容错处理
        if (Array.isArray(msgs)) msgs = msgs.filter(function (item) { return item.trim() !== ''; });

        // 判断：如果有内容才显示气泡，否则什么都不做
        if (msgs && msgs.length > 0) {
            showMessage(msgs, 5000);
        }
    });
}

$("#landlord,#live2d").mousedown(function (e) {
    if (3 == e.which) showMessage("秘密通道:<br><a href=\"" + home_Path + "\">首页</a> <a href=\"" + home_Path + "wp-admin/\">登录</a>", 5000);
});

// ==========================================
// 4. 鼠标悬浮与点击事件 (动态元素完美兼容版)
// ==========================================

function bindInteractEvents(eventData, eventType) {
    if (!eventData) return;

    if (typeof eventData === 'string') {
        try { eventData = JSON.parse(eventData); }
        catch (e) { console.warn("Live2D: 交互数据解析失败", e); return; }
    }

    // 建立一个字典，用来自动合并相同选择器的台词
    var aggregatedEvents = {};

    // 容错与合并处理
    if (Array.isArray(eventData)) {
        $.each(eventData, function (index, item) {
            if (item.selector && item.text) {
                var sel = item.selector.trim();
                if (!aggregatedEvents[sel]) aggregatedEvents[sel] = [];

                var msgs = item.text;
                // 【核心修复1】如果用户是在一个框里回车换行输入的，按换行符拆分成数组
                if (typeof msgs === 'string') msgs = msgs.split('\n');

                aggregatedEvents[sel] = aggregatedEvents[sel].concat(msgs);
            }
        });
    } else if (typeof eventData === 'object') {
        $.each(eventData, function (selector, msgs) {
            var sel = selector.trim();
            if (!aggregatedEvents[sel]) aggregatedEvents[sel] = [];

            if (typeof msgs === 'string') msgs = msgs.split('\n');
            aggregatedEvents[sel] = aggregatedEvents[sel].concat(msgs);
        });
    }

    // 【核心修复2】统一绑定事件，防止相同选择器互相覆盖
    $.each(aggregatedEvents, function (selector, msgs) {
        // 清洗数据，过滤掉空行和空格
        var finalMsgs = msgs.filter(function (m) {
            return typeof m === 'string' && m.trim() !== '';
        });

        if (finalMsgs.length > 0) {
            $(document).on(eventType, selector, function () {
                // showMessage 如果接收到的是数组，会自动进行随机抽取！
                showMessage(finalMsgs, 3000);
            });
        }
    });
}

// 绑定悬浮事件
bindInteractEvents(poilive2d_config.mouse_hover, 'mouseenter');
// 绑定点击事件
bindInteractEvents(poilive2d_config.mouse_click_msgs, 'click');

// ==========================================
// 4.5 动态条件交互事件绑定 (高级逻辑引擎)
// ==========================================
function bindConditionInteractEvents(eventData, eventType) {
    if (!eventData) return;

    if (typeof eventData === 'string') {
        try { eventData = JSON.parse(eventData); }
        catch (e) { console.warn("Live2D: 条件交互数据解析失败", e); return; }
    }

    // eventData 是咱们从后台拿到的一组对象数组: [{selector, condition, text_true, text_false}]
    if (Array.isArray(eventData)) {
        $.each(eventData, function (index, item) {
            var selector = item.selector ? item.selector.trim() : '';
            if (!selector) return; // 没写选择器直接跳过防报错

            var conditionStr = item.condition ? item.condition.trim() : '';

            // 兼容处理：把字符串按换行切成数组，如果本身就是数组则不用管
            var trueMsgs = Array.isArray(item.text_true) ? item.text_true : (typeof item.text_true === 'string' ? item.text_true.split('\n') : []);
            var falseMsgs = Array.isArray(item.text_false) ? item.text_false : (typeof item.text_false === 'string' ? item.text_false.split('\n') : []);

            // 绑定 jQuery 动态事件监听
            $(document).on(eventType, selector, function () {
                try {
                    var isTrue = true; // 默认如果没写条件，就当做满足条件（执行绿框）

                    if (conditionStr) {
                        // 【黑科技核心】：利用 .call(this) 注入当前触发元素的上下文！
                        // 这样在后台填写条件时，甚至可以使用 $(this).hasClass('xxx') 来精准判断当前悬浮的这个元素！
                        isTrue = new Function("return " + conditionStr).call(this);
                    }

                    // 根据条件结果，决定抽取绿框(true)还是红框(false)里的台词
                    var msgsToUse = isTrue ? trueMsgs : falseMsgs;

                    // 清洗数据，防止用户敲了多余的回车空行
                    var finalMsgs = msgsToUse.filter(function (m) {
                        return typeof m === 'string' && m.trim() !== '';
                    });

                    // 最终如果有词，就发射气泡 (showMessage 自带随机抽取功能)
                    if (finalMsgs.length > 0) {
                        showMessage(finalMsgs, 3000);
                    }
                } catch (e) {
                    console.warn("Live2D: 动态条件执行错误，请检查后台语法 ->", conditionStr, e);
                }
            });
        });
    }
}

// 激活悬浮判断！(对应你 JSON 里的 mouse_condition_hover)
bindConditionInteractEvents(poilive2d_config.mouse_condition_hover, 'mouseenter');

// 如果你后台也加了鼠标点击的动态条件，也可以直接用这行激活：
bindConditionInteractEvents(poilive2d_config.mouse_condition_click_msgs, 'mousedown');

// 5. 进站与切后台欢迎语 (全面对接后台高级设置)
(function () {
    $('#landlord').bind("contextmenu", function () { return false; });
    $('#landlord').bind("selectstart", function () { return false; });

    if (poilive2d_config.tip_welcome !== '1') return;

    var text = '';
    var textTitle = document.title.split(' - ')[0]; // 获取当前页面标题
    var now = new Date();

    // ==========================================
    // 优先级 1：节日提示 (最高优先级，过节最大！)
    // ==========================================
    var month = now.getMonth() + 1;
    var date = now.getDate();
    var todayStr = month + '-' + date; // 拼装成 "2-14", "5-1"

    var festivals = poilive2d_config.welcome_festival || [];
    for (var k = 0; k < festivals.length; k++) {
        if (festivals[k].selector === todayStr) {
            text = festivals[k].text;
            break; // 匹配到节日直接跳出
        }
    }

    // ==========================================
    // 优先级 2：外站来源 (如果今天不过节，看看是不是外面来的客人)
    // ==========================================
    if (!text && document.referrer !== '') {
        var referrer = document.createElement('a');
        referrer.href = document.referrer;
        var domain = referrer.hostname;

        // 如果不是站内跳转
        if (`${home_Path}`.indexOf(domain) === -1) {

            // 2.1 检查搜索引擎提示
            var searchEngines = poilive2d_config.welcome_search || [];
            for (var i = 0; i < searchEngines.length; i++) {
                if (domain.indexOf(searchEngines[i].selector) !== -1) {
                    text = searchEngines[i].text.renderTip({ title: textTitle });
                    break;
                }
            }

            // 2.2 检查特定域名提示 (如果搜索引擎没匹配上)
            if (!text) {
                var domains = poilive2d_config.welcome_domain || [];
                for (var j = 0; j < domains.length; j++) {
                    if (domain.indexOf(domains[j].selector) !== -1) {
                        text = domains[j].text.renderTip({ title: textTitle });
                        break;
                    }
                }
            }

            // 2.3 如果是从外站来，但没在列表里，给个通用提示
            if (!text) {
                text = '你好呀，来自 <span style="color:#0099cc;">' + domain + '</span> 的小伙伴！';
            }
        }
    }

    // ==========================================
    // 优先级 3 & 4：按时间问候 或 默认阅读文章提示
    // ==========================================
    if (!text) {
        if (window.location.href == `${home_Path}`) {
            // 在首页，检查每小时提示
            var hour = now.getHours();
            var hourlies = poilive2d_config.welcome_hourly || [];

            for (var m = 0; m < hourlies.length; m++) {
                var match = hourlies[m].selector.match(/t(\d+)-(\d+)/);
                if (match) {
                    var startHour = parseInt(match[1]);
                    var endHour = parseInt(match[2]);

                    if (hour > startHour && hour <= endHour) {
                        text = hourlies[m].text;
                        break;
                    }
                }
            }

            // 兜底提示
            if (!text) text = '欢迎来到本站！';

        } else {
            // 不在首页，在具体的文章页面
            text = '你正在阅读 <span style="color:#0099cc;">「 ' + textTitle + ' 」</span>';
        }
    }

    // 最终发射气泡
    if (text) showMessage(text, 12000);

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            // --- 切出页面逻辑 ---
            var msgs = poilive2d_config.tab_leave_msgs;
            if (Array.isArray(msgs)) msgs = msgs.filter(function (item) { return item.trim() !== ''; });

            if (msgs && msgs.length > 0) showMessage(msgs, 5000);
        } else {
            // --- 切回页面逻辑 ---
            var msgs = poilive2d_config.tab_return_msgs;
            if (Array.isArray(msgs)) msgs = msgs.filter(function (item) { return item.trim() !== ''; });

            if (msgs && msgs.length > 0) showMessage(msgs, 5000);
        }
    });
})();

// 6. 一言系统 (已对接第三页设置)
// ==========================================
// 6. 一言系统 (核心 API 调度与格式化)
// ==========================================
var hitokoto_delay = parseInt(poilive2d_config.hitokoto_delay) || 0;
if (hitokoto_delay > 0) {
    var getActed = false;
    window.hitokotoTimer = 0;
    var hitokotoInterval = false;

    $(document).mousemove(function (e) { getActed = true; }).keydown(function () { getActed = true; });
    setInterval(function () { if (!getActed) ifActed(); else elseActed(); }, 1000);

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

function showHitokoto() {
    // 获取后台配置
    var api = poilive2d_config.hitokoto_api || 'local';
    var mode = poilive2d_config.hitokoto_origin || '2'; // 0:合为一句, 1:分为两句, 2:不要介绍
    var templates = poilive2d_config.hitokoto_msgs || {};
    var template = templates[api] || "";

    // ----------------------------------------------------
    // 【核心渲染引擎】负责根据用户的 mode 选择，输出最终的气泡
    // ----------------------------------------------------
    function renderHitokoto(text, data) {
        // 模式 2：不要介绍（最简单，直接输出内容）
        if (mode === '2') {
            showMessage(text, 5000);
            return;
        }

        // 模式 0：合为一句 (为你预留的自定义编辑区 ！！！)
        if (mode === '0') {
            // 从后台配置中拿到对应的后缀模板
            var suffixes = poilive2d_config.hitokoto_suffixes || {};
            var suffixTemplate = suffixes[api] || " —— {source}";
            
            // 利用我们强大的 renderTip 进行变量替换
            var suffix = suffixTemplate.renderTip(data);
            
            showMessage(text + suffix, 5000);
            return;
        }

        // 模式 1：分为两句 (先后播放)
        if (mode === '1') {
            showMessage(text, 5000);
            setTimeout(function () {
                // 利用 renderTip 将 data 里的变量映射到你后台设置的模板句子里
                var intro = template.renderTip(data);
                if (intro) showMessage(intro, 5000);
            }, 5500); // 第一句话显示5秒，等待0.5秒后显示第二句
            return;
        }
    }

    // ----------------------------------------------------
    // 【数据源分发中枢】拉取数据并进行清洗，统一为 data 格式
    // ----------------------------------------------------
    if (api === 'local') {
        var localMsgs = poilive2d_config.hitokoto_local_msgs || ["希望你每天都能开开心心！|站长|系统"];
        var rnum = Math.floor(Math.random() * localMsgs.length);
        var rawText = localMsgs[rnum] || "";

        // 解析管道符 |
        var parts = rawText.split('|');
        var data = {
            text: parts[0] || '',
            source: parts[1] || '不祥',
            author: parts[2] || '佚名'
        };
        renderHitokoto(data.text, data);

    } else if (api === 'yiblue') {
        $.getJSON('https://www.luotianyi.blue/API/yiyan', function (result) {
            // 清洗你自己的接口数据
            var data = result;
            data.source = result.song;      // 把 song 映射为 source
            data.author = result.author;   // 把 author 映射为 author            
            renderHitokoto(result.lyric, data);
        }).fail(function () { showMessage("哎呀，站长的专属 API 好像在摸鱼...", 5000); });

    } else if (api === 'jinrishici') {
        // 判断用户选的是 SDK 还是 老 API
        var useSDK = poilive2d_config.hitokoto_jinrishici_sdk === '1';

        if (useSDK) {
            // ==========================
            // 模式 A：使用 SDK (个性化推荐)
            // ==========================
            function handleJinrishici(result) {
                var data = {
                    title: result.data.origin.title,
                    dynasty: result.data.origin.dynasty,
                    author: result.data.origin.author,
                    source: result.data.origin.title,
                    creator: result.data.origin.author
                };
                renderHitokoto(result.data.content, data);
            }

            if (typeof jinrishici !== "undefined") {
                jinrishici.load(function (result) { handleJinrishici(result); });
            } else {
                $.getScript('https://sdk.jinrishici.com/v2/browser/jinrishici.js', function () {
                    jinrishici.load(function (result) { handleJinrishici(result); });
                }).fail(function () { showMessage("今日诗词 SDK 加载失败啦...", 5000); });
            }
        } else {
            // ==========================
            // 模式 B：使用老 API (纯随机 JSON)
            // ==========================
            $.getJSON('https://v1.jinrishici.com/all.json', function (result) {
                var data = result;
                // V1 接口的 title 存放在 origin 字段中
                data.title = result.origin;
                // V1 接口可能没有朝代，我们做个简单的朝代映射增强兼容性
                data.dynasty = result.dynasty || "";
                data.source = result.origin;
                data.creator = result.author;

                renderHitokoto(result.content, data);
            }).fail(function () { showMessage("今日诗词 API 获取失败啦...", 5000); });
        }

    } else if (api === 'hitokoto') {
        $.getJSON('https://v1.hitokoto.cn/', function (result) {
            var data = result;
            data.source = result.from;      // hitokoto 的出处在 from 字段
            if (result.from_who && result.from_who.trim() !== "") {data.author = "（" + result.from_who + "）";} else {data.author = "";}
            renderHitokoto(result.hitokoto, data);
        }).fail(function () { showMessage("一言网络请求失败了喵...", 5000); });

    } else if (api === 'fghrsh') {
        // 请求 fghrsh 并指定 json 格式
        $.getJSON('https://api.fghrsh.net/hitokoto/rand/?encode=jsc&uid=3335', function (result) {
            var data = result;
            data.source = result.source || "不详";
            renderHitokoto(result.hitokoto, data);
        }).fail(function () { showMessage("FGHRSH 接口似乎断开连接了...", 5000); });
    }
}
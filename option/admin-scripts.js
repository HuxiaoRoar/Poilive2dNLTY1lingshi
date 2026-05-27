jQuery(document).ready(function ($) {

    // ==========================================
    // 0. 切换标签页的智能记忆逻辑
    // ==========================================

    var activeTab = localStorage.getItem('poilive2d_active_tab') || 'basic';

    // 先用 jQuery 维持住当前页面的物理显示（防止等下面样式拔掉时发生闪烁）
    $('#tab-' + activeTab).show();

    // 核心：成功接管！立刻拔掉内联的临时 !important 样式，将隐藏/显示的控制权彻底还给 jQuery
    $('#poilive2d-pre-render-style').remove();

    // 此时新页面已经完全可见，高度100%准备就绪，立刻自适应撑开多行文本框
    $('#tab-' + activeTab).find('textarea').each(function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight + 2) + 'px';
    });


    $('.poilive2d-tab-link').on('click', function (e) {
        e.preventDefault();
        if ($(this).hasClass('nav-tab-active')) return;

        $('.poilive2d-tab-link').removeClass('nav-tab-active');
        $(this).addClass('nav-tab-active');

        var targetTab = $(this).data('tab');
        var $currentContent = $('.poilive2d-tab-content:visible');
        var $newContent = $('#tab-' + targetTab);

        localStorage.setItem('poilive2d_active_tab', targetTab);

        // 平滑的淡出淡入
        $currentContent.fadeOut(150, function () {
            $newContent.fadeIn(150, function () {
                // 面板展现后，如果 PHP 已经给了具体高度，就不再去重新撑开它，避免闪烁
                $(this).find('textarea').each(function () {
                    if (this.style.height === 'auto' || !this.style.height) {
                        this.style.height = 'auto';
                        this.style.height = (this.scrollHeight + 2) + 'px';
                    }
                });
            });
        });
    });

    // ==========================================
    // 1. 基础 UI 初始化
    // ==========================================
    if (typeof $.fn.wpColorPicker === 'function') {
        $('.color-picker').wpColorPicker();
    }

    // 统筹加号按钮的移动逻辑
    function updateActionButtons(container, rowClass, addBtnClass) {
        container.find('.' + addBtnClass).remove();
        var lastRow = container.find('.' + rowClass).last();
        lastRow.append('<button type="button" class="button ' + addBtnClass + '">+</button>');
    }

    // 自动扩展文本框高度 (新增兼容了 auto-expand-textarea)
    $(document).on('input', '.group-text-area, .auto-expand-textarea', function () {
        // 先设为 auto 以允许用户删除文字时框体能往回缩
        this.style.height = 'auto';
        // 获取真实的文字高度并补偿 2px 的边框误差
        this.style.height = (this.scrollHeight + 2) + 'px';
    });


    // ==========================================
    // 2. 动态布局的增删交互
    // ==========================================

    // --- 分组行模式 ---
    $(document).on('click', '.add-text-row-styled', function () {
        var pool = $(this).closest('.group-right-pool');
        var clone = pool.find('.text-row').last().clone();
        clone.find('input').val('');
        pool.append(clone);
        updateActionButtons(pool, 'text-row', 'add-text-row-styled');
    });

    $(document).on('click', '.remove-row-styled', function () {
        var container = $(this).parent().parent();
        if (container.find('.text-row').length > 1) {
            $(this).parent().remove();
        } else {
            $(this).parent().find('input').val('');
        }
        if (container.hasClass('group-right-pool')) {
            updateActionButtons(container, 'text-row', 'add-text-row-styled');
        } else if (container.hasClass('single-repeater-container')) {
            updateActionButtons(container, 'text-row', 'add-single-row-styled');
        }
    });

    // --- 单列重复模式 ---
    $(document).on('click', '.add-single-row-styled', function () {
        var container = $(this).closest('.single-repeater-container');
        var clone = container.find('.text-row').last().clone();
        clone.find('input').val('');
        container.append(clone);
        updateActionButtons(container, 'text-row', 'add-single-row-styled');
    });

    // --- 增加新组 (通用) ---
    $(document).on('click', '.add-new-group', function (e) {
        e.preventDefault();
        var container = $('#' + $(this).data('target'));
        var clone = container.find('.selector-group-box').last().clone();
        clone.find('input, textarea').val('');
        if (clone.find('.group-right-pool').length > 0) {
            clone.find('.text-row').not(':first').remove();
            updateActionButtons(clone.find('.group-right-pool'), 'text-row', 'add-text-row-styled');
        }
        container.append(clone);
    });

    // ==========================================
    // 3. 提交前的数据打平 (给 PHP 看的)
    // ==========================================
    $('#poilive2d-settings-form').on('submit', function () {
        $('.grouped-rows-container, .grouped-textarea-container').each(function () {
            var containerId = $(this).attr('id').replace('_container', '');
            var globalIndex = 0;
            var isTextarea = $(this).hasClass('grouped-textarea-container');

            // 【核心修改 - 表单提交拦截】
            $(this).find('.selector-group-box').each(function () {
                var selector = $(this).find('.group-selector-input').val();
                if (!selector) return;
                var lines = isTextarea ? $(this).find('.group-text-area').val().split(/\r?\n/)
                    : $(this).find('.group-text-input').map(function () { return $(this).val(); }).get();
                var box = $(this);

                var validLines = lines.filter(function (v) { return v.trim() !== ''; });
                if (validLines.length > 0) {
                    // 一个 selector 只生成一个 hidden input
                    box.append('<input type="hidden" name="poilive2d_options[' + containerId + '][' + globalIndex + '][selector]" value="' + selector + '">');
                    // 对应的 text 循环生成带有 [] 的数组 input
                    validLines.forEach(function (val) {
                        box.append('<input type="hidden" name="poilive2d_options[' + containerId + '][' + globalIndex + '][text][]" value="' + val.trim() + '">');
                    });
                    globalIndex++;
                }
            });
            $(this).find('input:not([type=hidden]), textarea').removeAttr('name');
        });

        $('.single-repeater-container').each(function () {
            var containerId = $(this).attr('id').replace('_container', '');
            $(this).find('.single-text-input').each(function (i) {
                $(this).attr('name', 'poilive2d_options[' + containerId + '][' + i + ']');
            });
        });

        // (NEW) 将本地一言多行文本打平成数组
        $('.json-array-textarea').each(function () {
            var keyId = $(this).attr('id');
            var lines = $(this).val().split(/\r?\n/);
            var parent = $(this).parent();
            var index = 0;
            lines.forEach(function (val) {
                if (val.trim() !== '') {
                    parent.append('<input type="hidden" name="poilive2d_options[' + keyId + '][' + index + ']" value="' + val.trim() + '">');
                    index++;
                }
            });
            $(this).removeAttr('name'); // 防止原生提交字符串
        });

        $('.condition-interaction-container').each(function () {
            var containerId = $(this).attr('id').replace('_container', '');
            var globalIndex = 0;

            $(this).find('.selector-group-box').each(function () {
                var selector = $(this).find('.group-selector-input').val().trim();
                if (!selector) return;

                var condition = $(this).find('.group-condition-input').val().trim();
                var trueLines = $(this).find('.group-text-true').val().split(/\r?\n/).filter(function (v) { return v.trim() !== ''; });
                var falseLines = $(this).find('.group-text-false').val().split(/\r?\n/).filter(function (v) { return v.trim() !== ''; });

                // 只有当存在有效判断规则或台词时，才将其编入提交队列
                if (trueLines.length > 0 || falseLines.length > 0 || condition) {
                    var box = $(this);

                    // 生成基础文本 hidden
                    box.append('<input type="hidden" name="poilive2d_options[' + containerId + '][' + globalIndex + '][selector]" value="' + selector + '">');
                    box.append('<input type="hidden" name="poilive2d_options[' + containerId + '][' + globalIndex + '][condition]" value="' + condition + '">');

                    // 生成真数组 hidden
                    trueLines.forEach(function (val) {
                        box.append('<input type="hidden" name="poilive2d_options[' + containerId + '][' + globalIndex + '][text_true][]" value="' + val.trim() + '">');
                    });

                    // 生成假数组 hidden
                    falseLines.forEach(function (val) {
                        box.append('<input type="hidden" name="poilive2d_options[' + containerId + '][' + globalIndex + '][text_false][]" value="' + val.trim() + '">');
                    });

                    globalIndex++;
                }
            });
            // 剥夺原表单 name 属性，防止干扰
            $(this).find('input:not([type=hidden]), textarea').removeAttr('name');
        });

    });

    // ==========================================
    // 4. 🚀 JSON 编辑器：双向同步核心逻辑
    // ==========================================
    var jsonEditor;

    // A. 从图形界面抓取数据 -> 生成 JSON (仅限当前活动标签页)
    function scrapeDOMToJSON() {
        var data = {};
        // 【核心修改】：锁定当前显示的标签页
        var $currentTab = $('.poilive2d-tab-content:visible');

        // 1. 抓取简单控件
        $currentTab.find('[name^="poilive2d_options["]').each(function () {
            var name = $(this).attr('name');
            var match = name.match(/poilive2d_options\[(.*?)\]/);
            if (match && match[1]) {
                var key = match[1];
                if ($('#' + key + '_container').length) return;

                var val = $(this).val();
                if ($(this).is(':radio') && !$(this).is(':checked')) return;

                if ($(this).hasClass('json-array-textarea')) {
                    var lines = val.split(/\r?\n/).filter(function (v) { return v.trim() !== ''; });
                    data[key] = lines;
                    return;
                }

                var subMatch = name.match(/poilive2d_options\[.*?\]\[(.*?)\]/);
                if (subMatch && subMatch[1]) {
                    if (!data[key]) data[key] = {};
                    data[key][subMatch[1]] = val;
                } else {
                    data[key] = val;
                }
            }
        });

        // 2. 抓取分组行/文本框
        $currentTab.find('.grouped-rows-container, .grouped-textarea-container').each(function () {
            var key = $(this).attr('id').replace('_container', '');
            data[key] = [];
            var isTextarea = $(this).hasClass('grouped-textarea-container');

            $(this).find('.selector-group-box').each(function () {
                var sel = $(this).find('.group-selector-input').val();
                if (!sel) return;

                var lines = isTextarea ? $(this).find('.group-text-area').val().split(/\r?\n/)
                    : $(this).find('.group-text-input').map(function () { return $(this).val(); }).get();

                var validLines = lines.map(function(t) { return t.trim(); }).filter(function(t) { return t !== ''; });
                if (validLines.length > 0) {
                    data[key].push({ selector: sel, text: validLines });
                }
            });
        });

        // (NEW) 抓取动态条件容器
        $currentTab.find('.condition-interaction-container').each(function () {
            var key = $(this).attr('id').replace('_container', '');
            data[key] = [];

            $(this).find('.selector-group-box').each(function () {
                var sel = $(this).find('.group-selector-input').val().trim();
                if (!sel) return;

                var cond = $(this).find('.group-condition-input').val().trim();

                // 获取文本并过滤空行
                var tLines = $(this).find('.group-text-true').val().split(/\r?\n/).map(function (t) { return t.trim(); }).filter(function (t) { return t !== ''; });
                var fLines = $(this).find('.group-text-false').val().split(/\r?\n/).map(function (t) { return t.trim(); }).filter(function (t) { return t !== ''; });

                if (tLines.length > 0 || fLines.length > 0 || cond) {
                    data[key].push({
                        selector: sel,
                        condition: cond,
                        text_true: tLines,
                        text_false: fLines
                    });
                }
            });
        });

        // 3. 抓取单列重复
        $currentTab.find('.single-repeater-container').each(function () {
            var key = $(this).attr('id').replace('_container', '');
            data[key] = [];
            $(this).find('.single-text-input').each(function () {
                var val = $(this).val().trim();
                if (val) data[key].push(val);
            });
        });

        return data;
    }

    // B. 将 JSON 数据 -> 逆向渲染回图形界面
    function syncJSONToDOM(data) {
        $.each(data, function (key, value) {

            // 1. 重建分组行模式
            var $groupedRows = $('#' + key + '_container.grouped-rows-container');
            if ($groupedRows.length) {
                $groupedRows.empty();
                var groupedObj = {};
                (Array.isArray(value) ? value : []).forEach(function (item) {
                    // 严格校验：确保 selector 存在，且 text 必须是数组
                    if (item.selector && Array.isArray(item.text) && item.text.length > 0) {
                        if (!groupedObj[item.selector]) groupedObj[item.selector] = [];
                        // 直接拼接数组
                        groupedObj[item.selector] = groupedObj[item.selector].concat(item.text);
                    }
                });

                if ($.isEmptyObject(groupedObj)) groupedObj[''] = [''];

                $.each(groupedObj, function (sel, texts) {
                    var html = '<div class="selector-group-box" style="display: flex; margin-bottom: 10px; align-items: flex-start; gap: 10px;">' +
                        '<input type="text" class="regular-text group-selector-input" style="width: 200px; font-weight: bold; margin: 0;" value="' + sel + '" placeholder="选择器">' +
                        '<span style="font-weight: bold; margin-top: 5px;">:</span>' +
                        '<div class="group-right-pool" style="flex: 1; display: flex; flex-direction: column; gap: 5px;">';
                    texts.forEach(function (txt, idx) {
                        var isLast = (idx === texts.length - 1);
                        var btnAdd = isLast ? '<button type="button" class="button add-text-row-styled">+</button>' : '';
                        html += '<div class="text-row" style="display: flex; gap: 5px; align-items: center;">' +
                            '<input type="text" class="regular-text group-text-input" style="width: 600px; margin: 0;" value="' + txt + '" placeholder="提示文本">' +
                            '<button type="button" class="button remove-row-styled">-</button>' + btnAdd +
                            '</div>';
                    });
                    html += '</div></div>';
                    $groupedRows.append(html);
                });
                return;
            }

            // 2. 重建多行文本框模式
            var $groupedTextarea = $('#' + key + '_container.grouped-textarea-container');
            if ($groupedTextarea.length) {
                $groupedTextarea.empty();
                var gObj = {};
                (Array.isArray(value) ? value : []).forEach(function (item) {
                    // 严格校验：确保 selector 存在，且 text 必须是数组
                    if (item.selector && Array.isArray(item.text) && item.text.length > 0) {
                        if (!gObj[item.selector]) gObj[item.selector] = [];
                        // 直接拼接数组
                        gObj[item.selector] = gObj[item.selector].concat(item.text);
                    }
                });

                if ($.isEmptyObject(gObj)) gObj[''] = [''];

                $.each(gObj, function (sel, texts) {
                    var areaContent = texts.join('\n');
                    var html = '<div class="selector-group-box" style="display: flex; margin-bottom: 10px; align-items: flex-start; gap: 10px;">' +
                        '<input type="text" class="regular-text group-selector-input" style="width: 200px; font-weight: bold; margin: 0; height: 30px;" value="' + sel + '" placeholder="选择器">' +
                        '<span style="font-weight: bold; margin-top: 5px;">:</span>' +
                        '<div style="flex: 1;">' +
                        '<textarea class="large-text group-text-area" rows="1" style="width: 600px; line-height: 1.5; padding: 3px 8px; min-height: 30px; margin: 0; resize: vertical; overflow: hidden;">' + areaContent + '</textarea>' +
                        '</div></div>';
                    $groupedTextarea.append(html);
                });
                $groupedTextarea.find('.group-text-area').trigger('input');
                return;
            }

            // (NEW) 重建动态条件容器
            var $conditionContainer = $('#' + key + '_container.condition-interaction-container');
            if ($conditionContainer.length) {
                $conditionContainer.empty();

                var items = Array.isArray(value) ? value : [];
                if (items.length === 0) items = [{ selector: '', condition: '', text_true: [], text_false: [] }];

                items.forEach(function (item) {
                    if (item.selector) {
                        var tContent = Array.isArray(item.text_true) ? item.text_true.join('\n') : '';
                        var fContent = Array.isArray(item.text_false) ? item.text_false.join('\n') : '';
                        var cond = item.condition || '';

                        var html = '<div class="selector-group-box" style="display: flex; margin-bottom: 10px; align-items: flex-start; gap: 10px;">' +
                            // 左侧 200px 选框
                            '<input type="text" class="regular-text group-selector-input" style="box-sizing: border-box; width: 200px; font-weight: bold; margin: 0; height: 40px; line-height: 24px;" value="' + cond_escape(item.selector) + '" placeholder="触发元素 (如: .aplayer-pic)">' +
                            // 冒号
                            '<span style="font-weight: bold; margin-top: 10px;">:</span>' +
                            // 右侧容器
                            '<div style="flex: 1; display: flex; flex-direction: column; gap: 10px;">' +
                            // 条件输入框 200px
                            '<input type="text" class="regular-text group-condition-input" style="box-sizing: border-box; width: 600px; font-family: monospace; margin: 0; height: 40px; line-height: 24px; background-color: #f6f7f7;" value="' + cond_escape(cond) + '" placeholder="判定条件 (如: length > 0)">' +
                            // 绿框
                            '<textarea class="large-text group-text-true auto-expand-textarea" rows="1" style="box-sizing: border-box; width: 600px; line-height: 24px; padding: 7px 8px; min-height: 40px; margin: 0; resize: vertical; overflow: hidden; border: 1px solid #46b450; border-left: 4px solid #46b450;" placeholder="[满足条件时触发] 一行一条回复...">' + cond_escape(tContent) + '</textarea>' +
                            // 红框
                            '<textarea class="large-text group-text-false auto-expand-textarea" rows="1" style="box-sizing: border-box; width: 600px; line-height: 24px; padding: 7px 8px; min-height: 40px; margin: 0; resize: vertical; overflow: hidden; border: 1px solid #dc3232; border-left: 4px solid #dc3232;" placeholder="[不满足条件时触发] 一行一条回复...">' + cond_escape(fContent) + '</textarea>' +
                            '</div></div>';

                        $conditionContainer.append(html);
                    }
                });

                // 防止 XSS 注射破环 HTML
                function cond_escape(str) { return $('<div>').text(str).html(); }

                // 触发重新计算高度
                $conditionContainer.find('.auto-expand-textarea').trigger('input');
                return;
            }

            // 4. 处理单列重复容器 (repeater_single_callback)
            var $singleRepeater = $('#' + key + '_container.single-repeater-container');
            if ($singleRepeater.length) {
                $singleRepeater.empty();
                var items = Array.isArray(value) ? value : (value ? [value] : ['']);
                if (items.length === 0) items = [''];
                $.each(items, function (idx, item) {
                    var isLast = (idx === items.length - 1);
                    // 转义 HTML 防止 XSS
                    var escapedItem = $('<div>').text(item).html();
                    var rowHtml = '<div class="text-row" style="display: flex; gap: 5px; align-items: center; margin-bottom: 5px;">' +
                        '<input type="text" class="regular-text single-text-input" style="width: 600px; margin: 0;" value="' + escapedItem + '" placeholder="输入内容">' +
                        '<button type="button" class="button remove-row-styled">-</button>' +
                        (isLast ? '<button type="button" class="button add-single-row-styled">+</button>' : '') +
                        '</div>';
                    $singleRepeater.append(rowHtml);
                });
                return; // 处理完单列重复后跳过后续的简单控件逻辑
            }

            // 5. 填充简单数据与新文本框
            var $input = $('[name="poilive2d_options[' + key + ']"]');
            if ($input.length === 0) $input = $('#' + key); // 防止已经失去 name 属性时找不着对象

            // (NEW) 如果是数组文本框，把数组 join 回车拼接回去
            if ($input.hasClass('json-array-textarea')) {
                var stringVal = Array.isArray(value) ? value.join('\n') : value;
                $input.val(stringVal).trigger('input'); // 触发重新计算高度
                return;
            }

            if (typeof value === 'object' && !Array.isArray(value)) {
                $.each(value, function (subKey, subVal) {
                    $('[name="poilive2d_options[' + key + '][' + subKey + ']"]').val(subVal);
                });
            } else {
                if ($input.is(':radio')) {
                    $input.filter('[value="' + value + '"]').prop('checked', true);
                } else {
                    $input.val(value);
                    if ($input.hasClass('color-picker')) $input.wpColorPicker('color', value);
                    if ($input.is('select')) $input.trigger('change'); // 触发联动逻辑 (下拉菜单更改)
                }
            }
        });
    }

    // C. 弹窗交互控制
    $('#poilive2d-open-editor').on('click', function (e) {
        e.preventDefault();
        

        var currentData = scrapeDOMToJSON();
        $('#poilive2d-json-modal').css('display', 'flex');

        if (!jsonEditor) {
            jsonEditor = wp.codeEditor.initialize($('#poilive2d-json-textarea'), poilive2d_editor_settings).codemirror;
        }

        jsonEditor.setValue(JSON.stringify(currentData, null, 4));
        setTimeout(function () { jsonEditor.refresh(); }, 50);
    });

    $('#poilive2d-close-modal').on('click', function (e) {
        e.preventDefault();
        $('#poilive2d-json-modal').hide();
    });

    $('#poilive2d-sync-json').on('click', function (e) {
        e.preventDefault();
        try {
            var rawJson = jsonEditor.getValue();
            var parsedData = JSON.parse(rawJson);

            // 【核心逻辑】：先将修改后的 JSON 静默同步回当前页面的 DOM 表单
            syncJSONToDOM(parsedData);
            $('#poilive2d-json-modal').hide();

            // 【核心逻辑】：直接触发 WordPress 原生提交按钮，实现自动保存并刷新
            var $btn = $(this);
            $btn.text('保存中...').prop('disabled', true);
            $('#submit').trigger('click');

        } catch (err) {
            alert('解析 JSON 失败，请检查格式是否正确！\n错误详情: ' + err.message);
        }
    });

    // ==========================================
    // 5. 真正完美的恢复本页默认设置 (自动保存版)
    // ==========================================
    $('#poilive2d-reset-defaults').on('click', function () {
        if (!confirm('确定要将【当前标签页】的设置恢复为初始默认状态，并直接保存吗？\n\n注意：未保存的其他页面修改不会受影响。')) {
            return;
        }

        var defaults = typeof poilive2d_defaults !== 'undefined' ? poilive2d_defaults : {};
        var subsetToReset = {};

        // 收集当前可见标签页里所有的 key
        $('.poilive2d-tab-content:visible').find('[name^="poilive2d_options["], .grouped-rows-container, .grouped-textarea-container, .single-repeater-container, .json-array-textarea, .condition-interaction-container').each(function () {
            var key;
            var nameAttr = $(this).attr('name');
            var idAttr = $(this).attr('id');

            if (nameAttr) {
                var match = nameAttr.match(/poilive2d_options\[(.*?)\]/);
                if (match && match[1]) key = match[1];
            } else if (idAttr) {
                key = idAttr.replace('_container', '');
            }

            if (key && defaults[key] !== undefined) {
                subsetToReset[key] = defaults[key];
            }
        });

        // 1. 静默恢复数据到界面
        syncJSONToDOM(subsetToReset);

        // 2. 视觉反馈并触发自动保存
        var $btn = $(this);
        $btn.text('正在恢复并保存...').css('color', '#34a853').prop('disabled', true);

        // 给浏览器 100ms 缓冲时间渲染表单，然后猛击提交按钮
        setTimeout(function () {
            $('#submit').trigger('click');
        }, 100);
    });


    //快捷键保存。
    $(document).on('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            $('#poilive2d-settings-form').find('#submit').trigger('click');
            
        }
    });


    //首次加载提示。
    if (!localStorage.getItem('poilive2d_visited')) {
        // 显示提示
        var $tip = $('<div class="notice notice-success" style="position:fixed; top:50px; right:20px; z-index:9999;">Ctrl+S 快速保存设置！</div>');
        $('body').append($tip);
        setTimeout(function () { $tip.fadeOut(500, function () { $(this).remove(); }); }, 5000);
        localStorage.setItem('poilive2d_visited', '1');
    }

    
});


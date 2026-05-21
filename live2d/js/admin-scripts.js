jQuery(document).ready(function ($) {

    // ==========================================
    // 0. 终极联动与防闪烁模块 (加入 isInit 判定)
    // ==========================================
    function syncDisplay(isInit) {
        var api = $('#hitokoto_api').val();
        var origin = $('input[name="poilive2d_options[hitokoto_origin]"]:checked').val();

        // 1. 操作 CSS 类进行物理显隐
        $('#hitokoto_local_msgs').closest('tr').toggleClass('hidden-settings-row', api !== 'local');
        $('[name^="poilive2d_options[hitokoto_msgs]"]').first().closest('tr').toggleClass('hidden-settings-row', origin !== '1');
        $('[name^="poilive2d_options[hitokoto_suffixes]"]').first().closest('tr').toggleClass('hidden-settings-row', origin !== '0');
        $('input[name="poilive2d_options[hitokoto_jinrishici_sdk]"]').first().closest('tr').toggleClass('hidden-settings-row', api !== 'jinrishici');

        // 2. 专门拦截“切换后变一行”的幽灵 Bug
        // 如果是用户手动切换的（不是刚刷新的），就延迟20毫秒，等它彻底显示出来再重算高度
        if (!isInit) {
            setTimeout(function () {
                $('.group-text-area, .auto-expand-textarea').each(function () {
                    if ($(this).is(':visible')) {
                        this.style.height = 'auto'; // 先释放它的旧高度
                        this.style.height = (this.scrollHeight + 2) + 'px'; // 重新读取真正的文字高度
                    }
                });
            }, 20);
        }
    }

    // 绑定手动切换事件：传入 false，代表这是“中途操作”
    $(document).on('change', '#hitokoto_api, input[name="poilive2d_options[hitokoto_origin]"]', function () {
        syncDisplay(false);
    });

    // 页面加载时触发：传入 true，代表这是“刚出生”
    $(document).ready(function () {
        syncDisplay(true); // 此时会隐藏该隐藏的，但绝对不会触发重新计算

        // 页面刚加载时，只修正旧的动态输入框，坚决放过本地一言(auto-expand-textarea)，让 PHP 的高度完美保留！
        $('.group-text-area').each(function () {
            if ($(this).is(':visible')) {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight + 2) + 'px';
            }
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
    $('.group-text-area, .auto-expand-textarea').each(function () { $(this).trigger('input'); });


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

            $(this).find('.selector-group-box').each(function () {
                var selector = $(this).find('.group-selector-input').val();
                if (!selector) return;
                var lines = isTextarea ? $(this).find('.group-text-area').val().split(/\r?\n/)
                    : $(this).find('.group-text-input').map(function () { return $(this).val(); }).get();
                var box = $(this);
                lines.forEach(function (val) {
                    if (val.trim() !== '') {
                        box.append('<input type="hidden" name="poilive2d_options[' + containerId + '][' + globalIndex + '][selector]" value="' + selector + '">');
                        box.append('<input type="hidden" name="poilive2d_options[' + containerId + '][' + globalIndex + '][text]" value="' + val.trim() + '">');
                        globalIndex++;
                    }
                });
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
    });

    // ==========================================
    // 4. 🚀 JSON 编辑器：双向同步核心逻辑
    // ==========================================
    var jsonEditor;

    // A. 从图形界面抓取数据 -> 生成 JSON
    function scrapeDOMToJSON() {
        var data = {};

        // 1. 抓取简单控件 (文本、数字、颜色、下拉、新加的单行转数组输入框)
        $('#poilive2d-settings-form').find('[name^="poilive2d_options["]').each(function () {
            var name = $(this).attr('name');
            var match = name.match(/poilive2d_options\[(.*?)\]/);
            if (match && match[1]) {
                var key = match[1];
                if ($('#' + key + '_container').length) return;

                var val = $(this).val();
                if ($(this).is(':radio') && !$(this).is(':checked')) return;

                // (NEW) 识别专门的数组文本框，拆分成 Array
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
        $('.grouped-rows-container, .grouped-textarea-container').each(function () {
            var key = $(this).attr('id').replace('_container', '');
            data[key] = [];
            var isTextarea = $(this).hasClass('grouped-textarea-container');

            $(this).find('.selector-group-box').each(function () {
                var sel = $(this).find('.group-selector-input').val();
                if (!sel) return;

                var lines = isTextarea ? $(this).find('.group-text-area').val().split(/\r?\n/)
                    : $(this).find('.group-text-input').map(function () { return $(this).val(); }).get();

                lines.forEach(function (txt) {
                    if (txt && txt.trim()) {
                        data[key].push({ selector: sel, text: txt.trim() });
                    }
                });
            });
        });

        // 3. 抓取单列重复
        $('.single-repeater-container').each(function () {
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
                    if (!groupedObj[item.selector]) groupedObj[item.selector] = [];
                    groupedObj[item.selector].push(item.text);
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
                    if (!gObj[item.selector]) gObj[item.selector] = [];
                    gObj[item.selector].push(item.text);
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

            syncJSONToDOM(parsedData);

            $('#poilive2d-json-modal').hide();
            alert('同步成功！界面已更新，检查无误后请点击网页底部的“保存设置”以写入数据库。');
        } catch (err) {
            alert('解析 JSON 失败，请检查格式是否正确！\n错误详情: ' + err.message);
        }
    });

    // ==========================================
    // 5. 恢复本页默认设置
    // ==========================================
    $('#poilive2d-reset-defaults').on('click', function (e) {
        e.preventDefault();

        if (confirm('确定要将当前页面的设置恢复为初始默认值吗？\n\n注意：此操作仅改变当前页面设置，要点击底部的“保存设置”后才会真正生效。')) {
            if (typeof poilive2d_defaults !== 'undefined' && !$.isEmptyObject(poilive2d_defaults)) {
                syncJSONToDOM(poilive2d_defaults);
                alert('已成功填入默认值！检查无误后，请点击“保存设置”以生效。');
            } else {
                alert('恢复失败：未能读取到 defaults.json 文件。');
            }
        }        
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

    //离开提醒。
    var isDirty = false;

    // 监听表单变化
    $('#poilive2d-settings-form').on('change input', 'input, select, textarea', function () {
        isDirty = true;
    });

    // 表单提交时重置，避免保存后刷新还提示
    $('#poilive2d-settings-form').on('submit', function () {
        isDirty = false;
    });

    // 页面离开前检测
    $(window).on('beforeunload', function (e) {
        if (isDirty) {
            e.preventDefault();
            e.returnValue = '您有未保存的更改，确定要离开吗？';
            return e.returnValue;
        }
    });
});


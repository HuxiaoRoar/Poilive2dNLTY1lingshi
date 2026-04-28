jQuery(document).ready(function($) {
    
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

    // 自动扩展文本框高度
    $(document).on('input', '.group-text-area', function() {
        this.style.height = '30px';
        var newHeight = (this.scrollHeight > 30) ? this.scrollHeight : 30;
        this.style.height = newHeight + 'px';
    });
    $('.group-text-area').each(function() { $(this).trigger('input'); });


    // ==========================================
    // 2. 动态布局的增删交互
    // ==========================================
    
    // --- 分组行模式 ---
    $(document).on('click', '.add-text-row-styled', function() {
        var pool = $(this).closest('.group-right-pool');
        var clone = pool.find('.text-row').last().clone();
        clone.find('input').val('');
        pool.append(clone);
        updateActionButtons(pool, 'text-row', 'add-text-row-styled');
    });

    $(document).on('click', '.remove-row-styled', function() {
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
    $(document).on('click', '.add-single-row-styled', function() {
        var container = $(this).closest('.single-repeater-container');
        var clone = container.find('.text-row').last().clone();
        clone.find('input').val('');
        container.append(clone);
        updateActionButtons(container, 'text-row', 'add-single-row-styled');
    });

    // --- 增加新组 (通用) ---
    $(document).on('click', '.add-new-group', function(e) {
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
    $('#poilive2d-settings-form').on('submit', function() {
        $('.grouped-rows-container, .grouped-textarea-container').each(function() {
            var containerId = $(this).attr('id').replace('_container', '');
            var globalIndex = 0;
            var isTextarea = $(this).hasClass('grouped-textarea-container');

            $(this).find('.selector-group-box').each(function() {
                var selector = $(this).find('.group-selector-input').val();
                if (!selector) return;
                var lines = isTextarea ? $(this).find('.group-text-area').val().split(/\r?\n/) 
                                     : $(this).find('.group-text-input').map(function(){return $(this).val();}).get();
                var box = $(this);
                lines.forEach(function(val) {
                    if (val.trim() !== '') {
                        box.append('<input type="hidden" name="poilive2d_options[' + containerId + '][' + globalIndex + '][selector]" value="' + selector + '">');
                        box.append('<input type="hidden" name="poilive2d_options[' + containerId + '][' + globalIndex + '][text]" value="' + val.trim() + '">');
                        globalIndex++;
                    }
                });
            });
            $(this).find('input:not([type=hidden]), textarea').removeAttr('name');
        });

        $('.single-repeater-container').each(function() {
            var containerId = $(this).attr('id').replace('_container', '');
            $(this).find('.single-text-input').each(function(i) {
                $(this).attr('name', 'poilive2d_options[' + containerId + '][' + i + ']');
            });
        });
    });

    // ==========================================
    // 4. ? JSON 编辑器：双向同步核心逻辑
    // ==========================================
    var jsonEditor;

    // A. 从图形界面抓取数据 -> 生成 JSON (仅限当前 DOM 中存在的)
    function scrapeDOMToJSON() {
        var data = {};
        
        // 1. 抓取简单控件 (文本、数字、颜色、下拉)
        // 关键：我们只抓取当前表单内“看得见/存在于 DOM”的选项
        $('#poilive2d-settings-form').find('[name^="poilive2d_options["]').each(function() {
            var name = $(this).attr('name');
            // 正则匹配 poilive2d_options[xxx]
            var match = name.match(/poilive2d_options\[(.*?)\]/);
            if (match && match[1]) {
                var key = match[1];
                
                // 跳过复杂的分组容器，后面单独处理
                if ($('#' + key + '_container').length) return; 
                
                var val = $(this).val();
                if ($(this).is(':radio') && !$(this).is(':checked')) return;

                // 处理数组型简单控件，如 size[w]
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
        $('.grouped-rows-container, .grouped-textarea-container').each(function() {
            var key = $(this).attr('id').replace('_container', '');
            data[key] = [];
            var isTextarea = $(this).hasClass('grouped-textarea-container');

            $(this).find('.selector-group-box').each(function() {
                var sel = $(this).find('.group-selector-input').val();
                if (!sel) return;
                
                var lines = isTextarea ? $(this).find('.group-text-area').val().split(/\r?\n/) 
                                     : $(this).find('.group-text-input').map(function(){return $(this).val();}).get();
                
                lines.forEach(function(txt) {
                    if(txt && txt.trim()) {
                        data[key].push({selector: sel, text: txt.trim()});
                    }
                });
            });
        });

        // 3. 抓取单列重复
        $('.single-repeater-container').each(function() {
            var key = $(this).attr('id').replace('_container', '');
            data[key] = [];
            $(this).find('.single-text-input').each(function() {
                var val = $(this).val().trim();
                if(val) data[key].push(val);
            });
        });

        return data;
    }

    // B. 弹窗交互控制
    $('#poilive2d-open-editor').on('click', function(e) {
        e.preventDefault();
        
        // 检查配置是否存在，防止报错导致白屏
        if (typeof poilive2d_editor_settings === 'undefined') {
            alert('编辑器配置加载失败，请检查 PHP 中的 wp_add_inline_script。');
            return;
        }

        // 抓取当前表单数据
        var currentData = scrapeDOMToJSON();
        $('#poilive2d-json-modal').css('display', 'flex');
        
        // 初始化编辑器
        if (!jsonEditor) {
            jsonEditor = wp.codeEditor.initialize($('#poilive2d-json-textarea'), poilive2d_editor_settings).codemirror;
        }
        
        // 填入 JSON 并美化
        jsonEditor.setValue(JSON.stringify(currentData, null, 4));
        
        // 强制刷新尺寸计算
        setTimeout(function() {
            jsonEditor.refresh();
        }, 100);
    });

    // B. 将 JSON 数据 -> 逆向渲染回图形界面
    function syncJSONToDOM(data) {
        $.each(data, function(key, value) {
            
            // 1. 重建分组行模式
            var $groupedRows = $('#' + key + '_container.grouped-rows-container');
            if ($groupedRows.length) {
                $groupedRows.empty();
                var groupedObj = {};
                (Array.isArray(value) ? value : []).forEach(function(item) {
                    if(!groupedObj[item.selector]) groupedObj[item.selector] = [];
                    groupedObj[item.selector].push(item.text);
                });
                
                if($.isEmptyObject(groupedObj)) groupedObj[''] = [''];

                $.each(groupedObj, function(sel, texts) {
                    var html = '<div class="selector-group-box" style="display: flex; margin-bottom: 10px; align-items: flex-start; gap: 10px;">' +
                               '<input type="text" class="regular-text group-selector-input" style="width: 200px; font-weight: bold; margin: 0;" value="'+sel+'" placeholder="选择器">' +
                               '<span style="font-weight: bold; margin-top: 5px;">:</span>' +
                               '<div class="group-right-pool" style="flex: 1; display: flex; flex-direction: column; gap: 5px;">';
                    texts.forEach(function(txt, idx) {
                        var isLast = (idx === texts.length - 1);
                        var btnAdd = isLast ? '<button type="button" class="button add-text-row-styled">+</button>' : '';
                        html += '<div class="text-row" style="display: flex; gap: 5px; align-items: center;">' +
                                '<input type="text" class="regular-text group-text-input" style="width: 600px; margin: 0;" value="'+txt+'" placeholder="提示文本">' +
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
                (Array.isArray(value) ? value : []).forEach(function(item) {
                    if(!gObj[item.selector]) gObj[item.selector] = [];
                    gObj[item.selector].push(item.text);
                });
                if($.isEmptyObject(gObj)) gObj[''] = [''];

                $.each(gObj, function(sel, texts) {
                    var areaContent = texts.join('\n');
                    var html = '<div class="selector-group-box" style="display: flex; margin-bottom: 10px; align-items: flex-start; gap: 10px;">' +
                               '<input type="text" class="regular-text group-selector-input" style="width: 200px; font-weight: bold; margin: 0; height: 30px;" value="'+sel+'" placeholder="选择器">' +
                               '<span style="font-weight: bold; margin-top: 5px;">:</span>' +
                               '<div style="flex: 1;">' +
                               '<textarea class="large-text group-text-area" rows="1" style="width: 600px; line-height: 1.5; padding: 3px 8px; min-height: 30px; margin: 0; resize: vertical; overflow: hidden;">'+areaContent+'</textarea>' +
                               '</div></div>';
                    $groupedTextarea.append(html);
                });
                $groupedTextarea.find('.group-text-area').trigger('input');
                return;
            }

            // 3. 填充简单数据
            if (typeof value === 'object' && !Array.isArray(value)) {
                $.each(value, function(subKey, subVal) {
                    $('[name="poilive2d_options[' + key + '][' + subKey + ']"]').val(subVal);
                });
            } else {
                var $input = $('[name="poilive2d_options[' + key + ']"]');
                if ($input.is(':radio')) {
                    $input.filter('[value="' + value + '"]').prop('checked', true);
                } else {
                    $input.val(value);
                    if ($input.hasClass('color-picker')) $input.wpColorPicker('color', value);
                }
            }
        });
    }

    // C. 弹窗交互控制
    $('#poilive2d-open-editor').on('click', function(e) {
        e.preventDefault();
        
        // 抓取当前表单数据
        var currentData = scrapeDOMToJSON();
        $('#poilive2d-json-modal').css('display', 'flex');
        
        if (!jsonEditor) {
            jsonEditor = wp.codeEditor.initialize($('#poilive2d-json-textarea'), poilive2d_editor_settings).codemirror;
        }
        
        jsonEditor.setValue(JSON.stringify(currentData, null, 4));
        
        // 【关键修复】隐藏容器弹出的瞬间，刷新 CodeMirror 让他能算对尺寸，避免空白！
        setTimeout(function() {
            jsonEditor.refresh();
        }, 50);
    });

    $('#poilive2d-close-modal').on('click', function(e) {
        e.preventDefault();
        $('#poilive2d-json-modal').hide();
    });

    
    $('#poilive2d-sync-json').on('click', function(e) {
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
    $('#poilive2d-reset-defaults').on('click', function(e) {
        e.preventDefault(); // 阻止按钮默认提交表单的行为
        
        if (confirm('确定要将当前页面的设置恢复为初始默认值吗？\n\n注意：此操作仅改变当前页面设置，要点击底部的“保存设置”后才会真正生效。')) {
            
            // 检查 PHP 是否成功把默认数据传过来了
            if (typeof poilive2d_defaults !== 'undefined' && !$.isEmptyObject(poilive2d_defaults)) {
                
                // 神奇的地方：直接复用咱们给 JSON 编辑器写的反向渲染函数！
                // 因为当前 HTML 里只有本页的设置项，所以它绝对不会误伤其他页面的数据。
                syncJSONToDOM(poilive2d_defaults);
                
                alert('已成功填入默认值！检查无误后，请点击“保存设置”以生效。');
                
            } else {
                alert('恢复失败：未能读取到 defaults.json 文件。');
            }
        }
    });

});
<?php
defined('ABSPATH') or exit;

// 获取当前激活的标签页，默认为 'basic'
$active_tab = isset($_GET['tab']) ? $_GET['tab'] : 'basic';
?>

<div class="wrap" id="poilive2d-admin-wrap">
    <h2>PoiLive2D（新·洛天依） 控制面板</h2>
    
    <?php settings_errors('poilive2d_options_group'); ?>

    <h2 class="nav-tab-wrapper">
    <a href="javascript:void(0);" class="nav-tab poilive2d-tab-link" data-tab="basic">基础设置</a>
    <a href="javascript:void(0);" class="nav-tab poilive2d-tab-link" data-tab="style">样式设置</a>
    <a href="javascript:void(0);" class="nav-tab poilive2d-tab-link" data-tab="hitokoto">一言设置</a>
    <a href="javascript:void(0);" class="nav-tab poilive2d-tab-link" data-tab="interactive">交互设置</a>
    <a href="javascript:void(0);" class="nav-tab poilive2d-tab-link" data-tab="advanced">高级设置</a>
</h2>

<script type="text/javascript">
    (function() {
        var activeTab = localStorage.getItem('poilive2d_active_tab') || 'basic';
        
        // 1. 趁热打铁：此时上方的 HTML 刚画完，立刻给对应的标签按钮加上高亮
        var activeLink = document.querySelector('.poilive2d-tab-link[data-tab="' + activeTab + '"]');
        if (activeLink) {
            activeLink.className += ' nav-tab-active';
        }
        
        // 2. 降维打击：向 head 注入高优先级样式。当下方的表单 div 被解析时，目标页会无视 display:none 直接被画出来
        var style = document.createElement('style');
        style.id = 'poilive2d-pre-render-style';
        style.innerHTML = '#tab-' + activeTab + ' { display: block !important; }';
        document.head.appendChild(style);
    })();
</script>

<form method="POST" action="options.php" id="poilive2d-settings-form">
    <?php settings_fields('poilive2d_options_group'); ?>
    
    <div id="tab-basic" class="poilive2d-tab-content" style="display: none;">
        <?php do_settings_sections('poilive2d-basic'); ?>
    </div>

    <div id="tab-style" class="poilive2d-tab-content" style="display: none;">
        <?php do_settings_sections('poilive2d-style'); ?>
    </div>

    <div id="tab-hitokoto" class="poilive2d-tab-content" style="display: none;">
        <?php do_settings_sections('poilive2d-hitokoto'); ?>
    </div>

    <div id="tab-interactive" class="poilive2d-tab-content" style="display: none;">
        <?php do_settings_sections('poilive2d-interactive'); ?>
    </div>

    <div id="tab-advanced" class="poilive2d-tab-content" style="display: none;">
        <?php do_settings_sections('poilive2d-advanced'); ?>
    </div>
    
    <div class="submit-wrapper" style="display: flex; align-items: center; gap: 10px; margin-top: 20px;">
    <?php submit_button('保存所有设置', 'primary', 'submit', false); ?>
    <button type="button" class="button" id="poilive2d-reset-defaults" style="color: #b32d2e; border-color: #b32d2e;">恢复本页默认</button>
    <button type="button" class="button" id="poilive2d-open-editor">JSON 源码编辑器</button>
</div>
</form>

    <div id="poilive2d-json-modal" style="display:none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9999; align-items: center; justify-content: center;">
        <div class="modal-content" style="background: #fff; width: 900px; max-width: 90%; border-radius: 5px; box-shadow: 0 5px 15px rgba(0,0,0,0.5); padding: 20px;">
            <h3>JSON 配置编辑器</h3>
            <p class="description">你可以直接在此粘贴大段的 JSON 配置，点击“同步到界面”后，上方的图形化表单会自动更新（仅限当前选项卡的内容）。</p>
            <textarea id="poilive2d-json-textarea" style="width:100%; height:450px; font-family: monospace; border: 1px solid #ddd;"></textarea>
            <div style="margin-top: 15px;">
                <button type="button" class="button button-primary" id="poilive2d-sync-json">直接保存配置</button>
                <button type="button" class="button" id="poilive2d-close-modal">取消退出</button>
            </div>
        </div>
    </div>
</div>
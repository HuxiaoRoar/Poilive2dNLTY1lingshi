<?php
defined('ABSPATH') or exit;

// 获取当前激活的标签页，默认为 'basic'
$active_tab = isset($_GET['tab']) ? $_GET['tab'] : 'basic';
?>

<div class="wrap" id="poilive2d-admin-wrap">
    <h2>PoiLive2D（新·洛天依） 控制面板</h2>
    
    <?php settings_errors('poilive2d_options_group'); ?>

    <h2 class="nav-tab-wrapper">
        <a href="?page=poilive2d&tab=basic" class="nav-tab <?php echo $active_tab == 'basic' ? 'nav-tab-active' : ''; ?>">基础设置</a>
        <a href="?page=poilive2d&tab=style" class="nav-tab <?php echo $active_tab == 'style' ? 'nav-tab-active' : ''; ?>">样式设置</a>
        <a href="?page=poilive2d&tab=hitokoto" class="nav-tab <?php echo $active_tab == 'hitokoto' ? 'nav-tab-active' : ''; ?>">一言设置</a>
        <a href="?page=poilive2d&tab=interactive" class="nav-tab <?php echo $active_tab == 'interactive' ? 'nav-tab-active' : ''; ?>">交互设置</a>
        <a href="?page=poilive2d&tab=advanced" class="nav-tab <?php echo $active_tab == 'advanced' ? 'nav-tab-active' : ''; ?>">高级设置</a>
    </h2>

    <form method="POST" action="options.php" id="poilive2d-settings-form">
        
        <?php
        // 输出 WordPress 安全字段和隐藏的返回链接
        settings_fields('poilive2d_options_group');
        
        // 根据当前选中的 Tab，显示不同的内容区块
        if ($active_tab == 'basic') {
            do_settings_sections('poilive2d-basic');         
        } elseif ($active_tab == 'style') {
            do_settings_sections('poilive2d-style');
        } elseif ($active_tab == 'advanced') {           
            do_settings_sections('poilive2d-advanced');
        } elseif ($active_tab == 'hitokoto') {           
            do_settings_sections('poilive2d-hitokoto');
        }
        elseif ($active_tab == 'interactive') {           
            do_settings_sections('poilive2d-interactive');
        }
        ?>
        
        <div class="submit-wrapper" style="display: flex; align-items: center; gap: 10px; margin-top: 20px;">
            <?php submit_button('保存设置', 'primary', 'submit', false); ?>
            <button type="button" class="button" id="poilive2d-reset-defaults" style="color: #b32d2e; border-color: #b32d2e;">恢复本页默认</button>
            <button type="button" class="button" id="poilive2d-open-editor">JSON 源码编辑器</button>
        </div>
    </form>

    <div id="poilive2d-json-modal" style="display:none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9999; align-items: center; justify-content: center;">
        <div class="modal-content" style="background: #fff; width: 800px; max-width: 90%; border-radius: 5px; box-shadow: 0 5px 15px rgba(0,0,0,0.5); padding: 20px;">
            <h3>JSON 配置编辑器</h3>
            <p class="description">你可以直接在此粘贴大段的 JSON 配置，点击“同步到界面”后，上方的图形化表单会自动更新（仅限当前选项卡的内容）。</p>
            <textarea id="poilive2d-json-textarea" style="width:100%; height:450px; font-family: monospace; border: 1px solid #ddd;"></textarea>
            <div style="margin-top: 15px;">
                <button type="button" class="button button-primary" id="poilive2d-sync-json">同步到界面</button>
                <button type="button" class="button" id="poilive2d-close-modal">取消退出</button>
            </div>
        </div>
    </div>
</div>
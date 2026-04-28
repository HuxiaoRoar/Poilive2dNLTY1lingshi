<?php
defined('ABSPATH') or exit;

add_action('wp_enqueue_scripts', 'live2d_scripts');
function live2d_scripts()
{
    if (!wp_is_mobile()) {
        wp_enqueue_style('live2d-base', LIVE2D_URL . '/live2d/css/live2d.css', array(), LIVE2D_VERSION, 'all');
        wp_enqueue_script('live2d-jquery', LIVE2D_URL . '/live2d/js/jquery.min.js', array('jquery'), LIVE2D_VERSION, true);
        wp_enqueue_script('live2d-base', LIVE2D_URL . '/live2d/js/live2d.js', array('live2d-jquery'), LIVE2D_VERSION, true);
        wp_enqueue_script('live2d-message', LIVE2D_URL . '/live2d/js/message.js', array('live2d-jquery'), LIVE2D_VERSION, true);
        wp_enqueue_script('live2d-run', LIVE2D_URL . '/live2d/js/run_local.js', array('live2d-jquery'), LIVE2D_VERSION, true);
    }
}

add_action('wp_head', 'live2d_head');
function live2d_head()
{
    if (!wp_is_mobile()) {
        // 1. 获取所有设置项（合并默认值，确保没有任何遗漏）
        $options = get_option('poilive2d_options', array());
        $default_file = LIVE2D_PATH . '/inc/defaults.json';
        $defaults = file_exists($default_file) ? json_decode(file_get_contents($default_file), true) : array();
        $settings = wp_parse_args($options, $defaults);

        // 2. 注入全局 JS 变量 (第一页、第三页功能的核心)
        echo '<script type="text/javascript">';
        echo 'var live2d_Path = "' . LIVE2D_URL . '/live2d/model/天依/";';
        echo 'var message_Path = "' . LIVE2D_URL . '/live2d/";';
        echo 'var home_Path = "' . home_url() . '/";';
        echo 'var poilive2d_config = ' . wp_json_encode($settings) . ';';
        echo '</script>';

        // 3. 动态 CSS 生成：接管第二页的所有外观设置
        $css = '<style id="poilive2d-dynamic-style">';
        
        // --- 角色位置与大小 ---
        $r_w = isset($settings['role_size']['w']) ? intval($settings['role_size']['w']) : 280;
        $r_h = isset($settings['role_size']['h']) ? intval($settings['role_size']['h']) : 250;
        $dock = isset($settings['role_dock']) ? $settings['role_dock'] : 'left';
        $margin = isset($settings['role_margin']) ? intval($settings['role_margin']) : 30;
        $hide_w = isset($settings['role_hide_width']) ? intval($settings['role_hide_width']) : 860;

        $dock_css = ($dock === 'right') ? "right: {$margin}px !important; left: auto !important;" : "left: {$margin}px !important; right: auto !important;";
        
        // 增加 transform: translateZ(0) 强制硬件加速，锁定最顶层叠上下文
        $css .= "#landlord { width: {$r_w}px !important; height: {$r_h}px !important; {$dock_css} z-index: 99999 !important; transform: translateZ(0); }";
        $css .= "#live2d { width: {$r_w}px !important; height: {$r_h}px !important; }";
        
        if ($hide_w > 0) {
            $css .= "@media (max-width: {$hide_w}px) { #landlord { display: none !important; } }";
        }

        // --- 气泡样式设定 ---
        $b_w = isset($settings['bubble_size']['w']) && intval($settings['bubble_size']['w']) > 0 ? intval($settings['bubble_size']['w']).'px' : 'auto';
        $b_h = isset($settings['bubble_size']['h']) && intval($settings['bubble_size']['h']) > 0 ? intval($settings['bubble_size']['h']).'px' : 'auto';
        $b_font = isset($settings['bubble_font_size']) ? intval($settings['bubble_font_size']) : 15;
        $b_bottom = isset($settings['bubble_margin_top']) ? intval($settings['bubble_margin_top']) : 200;
        $b_bg = isset($settings['bubble_bg_color']) ? $settings['bubble_bg_color'] : 'rgba(250, 248, 247, 0.9)';
        $b_border = isset($settings['bubble_border_color']) ? $settings['bubble_border_color'] : 'rgba(102,204,255,.4)';
        $b_shadow = isset($settings['bubble_shadow_color']) ? $settings['bubble_shadow_color'] : 'rgba(102,204,255,.4)';
        $b_color = isset($settings['bubble_text_color']) ? $settings['bubble_text_color'] : '#02111d';
        $b_hl = isset($settings['bubble_highlight_color']) ? $settings['bubble_highlight_color'] : '#0099cc';

        // 加入 box-sizing: border-box !important; 彻底解决气泡超宽问题
        $css .= ".message { 
            box-sizing: border-box !important; 
            width: {$b_w}px !important; 
            height: {$b_h} !important; 
            font-size: {$b_font}px !important; 
            bottom: {$b_bottom}px !important; 
            background-color: {$b_bg} !important; 
            border-color: {$b_border} !important; 
            box-shadow: 0 3px 15px 2px {$b_shadow} !important; 
            color: {$b_color} !important; 
        }";
        // 控制气泡中加粗或带链接文字的高亮颜色
        $css .= ".message a, .message span { color: {$b_hl} !important; }";

        // --- 按钮样式设定 ---
        $btn_size = isset($settings['btn_size']) ? intval($settings['btn_size']) : 60;
        $btn_lh = isset($settings['btn_line_height']) ? intval($settings['btn_line_height']) : 20;
        $btn_bg = isset($settings['btn_color']) ? $settings['btn_color'] : 'rgba(0, 0, 0, 0.2)';
        $btn_hover = isset($settings['btn_hover_color']) ? $settings['btn_hover_color'] : '#f4f6f8';
        
        $css .= ".l2d-action, .l2d-action-L, .show-button { 
            width: {$btn_size}px !important; 
            min-height: {$btn_lh}px !important; 
            line-height: {$btn_lh}px !important; 
            background: {$btn_bg} !important; 
            border-color: {$b_border} !important;
            box-shadow: 0 3px 15px 2px {$b_shadow} !important;
            color: {$b_color} !important;
            backdrop-filter: blur(5px);
        }";
        
       
        $css .= ".l2d-action:hover, .l2d-action-L:hover, .show-button:hover { 
            background: {$btn_hover} !important; 
            border-color: {$b_border} !important;
            color: {$b_color} !important;
            
        }";

        $css .= '</style>';
        echo $css;
    }
}

add_action('wp_footer', 'live2d_footer');
function live2d_footer()
{
    if (!wp_is_mobile()) {
        ?>
        <div id="landlord">
            <div class="message" style="opacity:0"></div>
            <canvas id="live2d" width="280" height="250" class="live2d"></canvas>
            <div id="sing"></div>
        </div>
        <?php
    }
}
// 旧代码中的 hex2rgb 函数已被彻底废除，代码变得更加干净轻量！
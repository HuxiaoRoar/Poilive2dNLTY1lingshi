<?php
defined('ABSPATH') or exit;

add_action('wp_enqueue_scripts', 'live2d_scripts');
function live2d_scripts()
{
    if (!wp_is_mobile()) {
        wp_enqueue_style('live2d-base', LIVE2D_URL . '/live2d/css/live2d.css', array(), LIVE2D_VERSION, 'all');
        wp_enqueue_script('live2d-jquery', LIVE2D_URL . '/live2d/js/jquery.min.js', array('jquery'), LIVE2D_VERSION, true);
        wp_enqueue_script('pixi-js', plugin_dir_url(__FILE__) . 'live2d/js/pixi.min.js', array(), '7.4.2', true);

        wp_enqueue_script('live2d-core-v2', plugin_dir_url(__FILE__) . 'live2d/js/live2d-v2core.min.js', array(), null, true);
        wp_enqueue_script('live2d-core-v4', plugin_dir_url(__FILE__) . 'live2d/js/live2dcubismcore.min.js', array(), null, true);

        wp_enqueue_script('pixi-live2d-display', plugin_dir_url(__FILE__) . 'live2d/js/pixi-live2d-display.min.js', array('pixi-js', 'live2d-core-v2', 'live2d-core-v4'), null, true);

        wp_enqueue_script('poilive2d-message', plugin_dir_url(__FILE__) . 'live2d/js/live2d-message.js', array('jquery'), null, true);
        wp_enqueue_script('poilive2d-ctrl', plugin_dir_url(__FILE__) . 'live2d/js/live2d-ctrl.js', array('pixi-live2d-display', 'poilive2d-message'), null, true);                
        
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
        //echo 'var live2d_Path = "' . LIVE2D_URL . '/live2d/model/天依/";';
        echo 'var message_Path = "' . LIVE2D_URL . '/live2d/";';
        echo 'var home_Path = "' . home_url() . '/";';
        echo 'var poilive2d_api_url = "' . LIVE2D_URL . '/live2d/model/model-api.php";';// live2d
        echo 'var poilive2d_config = ' . wp_json_encode($settings) . ';';


        $live2d_model_dir = LIVE2D_PATH . '/live2d/model/';
        $models_info = array();
        $model_dirs = glob($live2d_model_dir . '*', GLOB_ONLYDIR);

        require_once plugin_dir_path(__FILE__) . 'live2d/live2d-optimizer.php';
        
        foreach ($model_dirs as $dir) {
            $m_name = basename($dir); // 文件夹名，作为前端播报的名称
            poilive2d_optimize_model_motions($dir, $m_name);
            
            // 1. 判断是否为新版 V3/V4 模型 (*.model3.json)
            $v3_models = glob($dir . '/*.model3.json');
            $v3_count = count($v3_models);
            
            if ($v3_count > 0) {
                if ($v3_count === 1) {
                    // 只有一个文件：保持极速直连模式，直接存入字符串
                    $models_info[$m_name] = basename($v3_models[0]); 
                } else {
                    // 有多个文件（多模型换装）：遍历所有的 json 并存入数组
                    $v3_array = array();
                    foreach ($v3_models as $v3_file) {
                        $v3_array[] = basename($v3_file); // 压入数组，如 ["model0.model3.json", "model1.model3.json"]
                    }
                    $models_info[$m_name] = $v3_array;
                }
                continue; 
            }

            // 2. 寻找老版 V2 模型的主配置文件 (支持 model.json 或 任意前缀的 *model.json)
            $v2_models = glob($dir . '/*model.json');
            if (count($v2_models) > 0) {
                $v2_json_name = basename($v2_models[0]); // 获取找到的第一个 V2 json 文件名

                // 统计该模型下的纯数字贴图数量 (用于判断是否有换装)
                $textures = glob($dir . '/textures/*.png');
                $valid_tex_count = 0;
                foreach ($textures as $tex) {
                    if (is_numeric(basename($tex, '.png'))) {
                        $valid_tex_count++;
                    }
                }

                // 【核心优化】：如果这个老模型只有 1 件衣服，或者干脆没有数字命名的贴图
                if ($valid_tex_count <= 1) {
                    // 把它伪装成新版模型！直接把文件名字符串传给前端
                    // 前端 JS 看到字符串，会直接绕过 API，丝滑加载这个 json
                    $models_info[$m_name] = $v2_json_name;
                } else {
                    // 如果有多件衣服，必须走老路子，传衣服数量给前端，让 model-api.php 负责动态换装
                    $models_info[$m_name] = $valid_tex_count;
                }
            }
        }

        echo 'var poilive2d_models_info = ' . wp_json_encode($models_info) . ';';
        
        echo '</script>';

        // 3. 动态 CSS 生成：接管第二页的所有外观设置
        $css = '<style id="poilive2d-dynamic-style">';
        
        // --- 角色位置与大小 ---
        $r_w = isset($settings['role_size']['w']) ? intval($settings['role_size']['w']) : 280;
        $r_h = isset($settings['role_size']['h']) ? intval($settings['role_size']['h']) : 250;
        $dock = isset($settings['role_dock']) ? $settings['role_dock'] : 'left';
        $margin = isset($settings['role_margin']) ? intval($settings['role_margin']) : 30;

        $v_dock = isset($settings['role_v_dock']) ? $settings['role_v_dock'] : 'bottom';
        $v_margin = isset($settings['role_v_margin']) ? intval($settings['role_v_margin']) : 0; // 默认贴底 0px


        $hide_w = isset($settings['role_hide_width']) ? intval($settings['role_hide_width']) : 860;

        $v_css = ($v_dock === 'top') ? "top: {$v_margin}px !important; bottom: auto !important;" : "bottom: {$v_margin}px !important; top: auto !important;";

        $h_css = ($dock === 'right') ? "right: {$margin}px !important; left: auto !important;" : "left: {$margin}px !important; right: auto !important;";
        
        
        // 增加 transform: translateZ(0) 强制硬件加速，锁定最顶层叠上下文
        $css .= "#landlord { width: {$r_w}px !important; height: {$r_h}px !important; {$h_css} {$v_css} z-index: 99 !important; transform: translateZ(0); }";
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
        $css .= ".message a, .message span { color: {$b_hl} }";

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
            -webkit-backdrop-filter: blur(5px);
            backdrop-filter: blur(5px);
        }";        
       
       $css .= ".poi-corner-btn { 
            min-height: {$btn_lh}px !important; 
            line-height: {$btn_lh}px !important; 
            border-color: {$b_border} !important;
            background: {$btn_bg} !important; 
            -webkit-backdrop-filter: blur(5px);
            backdrop-filter: blur(5px);
            box-shadow: 0 3px 6px  {$b_shadow} !important;
            color: {$b_color} !important;
        }";
        
        // 继承后台设置的：鼠标悬浮色
        $css .= ".poi-corner-btn:hover { 
            min-height: {$btn_lh}px !important; 
            line-height: {$btn_lh}px !important; 
            border-color: {$b_border} !important;
            background: {$btn_hover} !important; 
            border-color: {$b_border} !important;
            color: {$b_color} !important;
            -webkit-backdrop-filter: blur(5px);
            backdrop-filter: blur(5px);
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
            <canvas id="live2d" class="live2d"></canvas>
            <div id="sing"></div>
        </div>
        <?php
    }
}


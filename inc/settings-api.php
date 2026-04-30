<?php
/**
 * 洛天依 Live2D 设置中心 (Settings API 实现)
 */

defined('ABSPATH') or exit;

class PoiLive2D_Settings {

    private $options;
    private $defaults; // 新增：用来存放解析后的默认 JSON 数组

    public function __construct() {
        add_action('admin_init', array($this, 'page_init'));
        
        // 读取 defaults.json 文件
        $default_file = plugin_dir_path(__FILE__) . 'defaults.json';
        if (file_exists($default_file)) {
            // 将 JSON 文件内容解码为 PHP 数组
            $this->defaults = json_decode(file_get_contents($default_file), true);
        } else {
            $this->defaults = array();
        }

        add_action('admin_head', array($this, 'inject_admin_styles')); // 注入自定义 CSS
    }
    public function page_init() {

        // 注册统一的选项组，所有数据存入 'poilive2d_options' 数组
        register_setting(
            'poilive2d_options_group', 
            'poilive2d_options', 
            array($this, 'sanitize') 
        );

        /* ==========================================================================
         * TAB 1: 基础设置 (poilive2d-basic)
         * ========================================================================== */
        add_settings_section('section_basic_btns', '按钮开关设置：', null, 'poilive2d-basic');
        
        $this->add_field('poilive2d-basic', 'section_basic_btns', 'btn_all', '所有按钮', 'radio_callback');
        $this->add_field('poilive2d-basic', 'section_basic_btns', 'btn_layout', '按钮排列', 'radio_callback', ['1' => '单列', '0' => '双列']);
        $this->add_field('poilive2d-basic', 'section_basic_btns', 'btn_hide', '“隐藏”按钮', 'radio_callback');
        $this->add_field('poilive2d-basic', 'section_basic_btns', 'btn_sing', '“Sing”按钮', 'radio_callback');
        $this->add_field('poilive2d-basic', 'section_basic_btns', 'btn_model', '“变身”按钮（切换模型）', 'radio_callback');
        $this->add_field('poilive2d-basic', 'section_basic_btns', 'btn_texture', '“变装”按钮（切换材质）', 'radio_callback');
        $this->add_field('poilive2d-basic', 'section_basic_btns', 'btn_menu', '“目录”按钮', 'radio_callback');
        $this->add_field('poilive2d-basic', 'section_basic_btns', 'btn_hitokoto', '“一言”按钮', 'radio_callback');

        add_settings_section('section_basic_other', '其他设置：', null, 'poilive2d-basic');
        $this->add_field('poilive2d-basic', 'section_basic_other', 'tip_copy', '复制内容提示', 'radio_callback');
        $this->add_field('poilive2d-basic', 'section_basic_other', 'tip_welcome', '进入页面欢迎词', 'radio_callback');


        /* ==========================================================================
         * TAB 2: 样式设置 (poilive2d-style)
         * ========================================================================== */
        add_settings_section('section_style_role', '角色设置：', null, 'poilive2d-style');
        
        $this->add_field('poilive2d-style', 'section_style_role', 'role_record', '记录模型选择', 'radio_callback', ['1' => '是（下次进入，模型不变）', '0' => '否（下次进入，模型切换）']);
        $this->add_field('poilive2d-style', 'section_style_role', 'texture_record', '记录材质选择', 'radio_callback', ['1' => '是（下次进入，材质不变）', '0' => '否（下次进入，材质切换）']);
        $this->add_field('poilive2d-style', 'section_style_role', 'switch_model', '模型切换方式', 'select_callback', ['random' => '随机', 'sequential' => '顺序']);
        $this->add_field('poilive2d-style', 'section_style_role', 'switch_texture', '材质切换方式', 'select_callback', ['random' => '随机', 'sequential' => '顺序']);
        $this->add_field('poilive2d-style', 'section_style_role', 'role_size', '角色大小', 'size_callback', '宽度 x 高度');
        $this->add_field('poilive2d-style', 'section_style_role', 'role_hide_width', '小于指定宽度隐藏角色', 'number_callback', '设置为 0 时，角色常驻，不隐藏');
        $this->add_field('poilive2d-style', 'section_style_role', 'role_dock', '角色贴边选择', 'select_callback', ['left' => '靠左', 'right' => '靠右']);
        $this->add_field('poilive2d-style', 'section_style_role', 'role_margin', '角色页面边距(像素)', 'number_callback');
        $this->add_field('poilive2d-style', 'section_style_role', 'drag_mode', '拖拽方式', 'select_callback', ['disable' => '禁用', 'horizontal' => '仅水平拖拽', 'free' => '自由拖拽']);
        $this->add_field('poilive2d-style', 'section_style_role', 'drag_release', '松开鼠标后', 'select_callback', ['restore' => '还原位置', 'keep' => '保持位置']);

        add_settings_section('section_style_btn', '按钮样式设置：', null, 'poilive2d-style');
        $this->add_field('poilive2d-style', 'section_style_btn', 'btn_size', '按钮大小(像素)', 'number_callback');
        $this->add_field('poilive2d-style', 'section_style_btn', 'btn_line_height', '按钮行高(像素)', 'number_callback');
        $this->add_field('poilive2d-style', 'section_style_btn', 'btn_margin_top', '按钮距顶部边距(像素)', 'number_callback', '数字越大越靠下');
        $this->add_field('poilive2d-style', 'section_style_btn', 'btn_color', '按钮颜色', 'color_callback');
        $this->add_field('poilive2d-style', 'section_style_btn', 'btn_hover_color', '按钮悬浮颜色', 'color_callback');

        add_settings_section('section_style_bubble', '气泡样式设置：', null, 'poilive2d-style');
        $this->add_field('poilive2d-style', 'section_style_bubble', 'bubble_size', '气泡大小', 'size_callback', '宽度 x 高度');
        $this->add_field('poilive2d-style', 'section_style_bubble', 'bubble_font_size', '气泡字号(像素)', 'number_callback');
        $this->add_field('poilive2d-style', 'section_style_bubble', 'bubble_margin_top', '气泡距顶部边距(像素)', 'number_callback', '数字越大越靠上');
        $this->add_field('poilive2d-style', 'section_style_bubble', 'bubble_bg_color', '背景色', 'color_callback');
        $this->add_field('poilive2d-style', 'section_style_bubble', 'bubble_border_color', '边框颜色', 'color_callback');
        $this->add_field('poilive2d-style', 'section_style_bubble', 'bubble_shadow_color', '阴影颜色', 'color_callback');
        $this->add_field('poilive2d-style', 'section_style_bubble', 'bubble_text_color', '文字颜色', 'color_callback');
        $this->add_field('poilive2d-style', 'section_style_bubble', 'bubble_highlight_color', '高亮文字颜色', 'color_callback');


        /* ==========================================================================
         * TAB 3: 高级设置 (poilive2d-advanced)
         * ========================================================================== */
        add_settings_section('section_adv_hitokoto', '一言设置：', null, 'poilive2d-advanced');
        $this->add_field('poilive2d-advanced', 'section_adv_hitokoto', 'hitokoto_delay', '启用一言', 'number_callback', '一言延迟时间(秒)。如果设置为0，则禁用一言。');
        $this->add_field('poilive2d-advanced', 'section_adv_hitokoto', 'hitokoto_api', '一言 API', 'select_callback', [
            'jinrishici' => 'jinrishici.com', 'hitokoto' => 'v1.hitokoto.cn', 'fghrsh' => 'fghrsh.net', 'local' => '本地一言'
        ]);
        $this->add_field('poilive2d-advanced', 'section_adv_hitokoto', 'hitokoto_msgs', '一言API的消息', 'fixed_tips_callback', [
            'lwl12.com' => '这句一言来自 <span style={highlight}>『{source}』</span>|，是 <span style={highlight}>{creator}</span> 投稿的。',
            'fghrsh.net' => '来看看站长写的小作文 《{text}》 吧！',
            'jinrishici.com' => '希望你能找到心仪的东西！'

        ]);

        add_settings_section('section_adv_welcome', '进站欢迎设置：', null, 'poilive2d-advanced');
        
        $this->add_field('poilive2d-advanced', 'section_adv_welcome', 'welcome_hourly', '每小时提示', 'grouped_double_callback');
        $this->add_field('poilive2d-advanced', 'section_adv_welcome', 'welcome_search', '搜索引擎入站提示', 'grouped_double_callback');
        $this->add_field('poilive2d-advanced', 'section_adv_welcome', 'welcome_domain', '访问本站点的提示', 'grouped_double_callback');
        $this->add_field('poilive2d-advanced', 'section_adv_welcome', 'welcome_festival', '节日提示', 'grouped_double_callback');

        add_settings_section('section_adv_mouse', '鼠标交互设置：', null, 'poilive2d-advanced');
        $this->add_field('poilive2d-advanced', 'section_adv_mouse', 'mouse_hover', '自定义鼠标悬停提示', 'grouped_textarea_callback');
        $this->add_field('poilive2d-advanced', 'section_adv_mouse', 'mouse_click_msgs', '自定义鼠标点击提示', 'grouped_textarea_callback');
        $this->add_field('poilive2d-advanced', 'section_adv_mouse', 'mouse_copy_msgs', '复制信息时的提示', 'repeater_single_callback');
        $this->add_field('poilive2d-advanced', 'section_adv_mouse', 'mouse_hide_msgs', '隐藏角色的提示', 'repeater_single_callback');
        

        add_settings_section('section_adv_audio', 'Sing设置：', null, 'poilive2d-advanced');
        $this->add_field('poilive2d-advanced', 'section_adv_audio', 'songs', '播放列表', 'grouped_double_callback');
    }

    // 辅助函数：快速添加字段
    private function add_field($page, $section, $id, $title, $callback, $args = null) {
        add_settings_field($id, $title, array($this, $callback), $page, $section, array('id' => $id, 'args' => $args));
    }

    public function sanitize($input) {
        // 数据过滤保存逻辑
        return $input;
    }

    /* ==========================================================================
     * 各种 UI 控件的回调渲染函数
     * ========================================================================== */

    public function radio_callback($params) {
        $id = $params['id'];
        $options = isset($params['args']) ? $params['args'] : ['1' => '显示', '0' => '隐藏'];
        $val = $this->get_val($id, '1');
        
        echo '<fieldset>';
        foreach ($options as $v => $label) {
            echo '<label><input type="radio" name="poilive2d_options['.$id.']" value="'.$v.'" '.checked($v, $val, false).'> '.$label.'</label><br>';
        }
        echo '</fieldset>';
    }

    public function select_callback($params) {
        $id = $params['id'];
        $options = $params['args'];
        $val = $this->get_val($id, array_key_first($options));
        
        echo '<select name="poilive2d_options['.$id.']" id="'.$id.'">';
        foreach ($options as $v => $label) {
            echo '<option value="'.$v.'" '.selected($v, $val, false).'>'.$label.'</option>';
        }
        echo '</select>';
    }

    public function text_callback($params) {
        $id = $params['id'];
        $val = $this->get_val($id, '');
        echo '<input type="text" name="poilive2d_options['.$id.']" id="'.$id.'" value="'.esc_attr($val).'" class="regular-text">';
    }

public function number_callback($params) {
        $id = $params['id'];
        
        // 设置默认值
        $desc = '';
        $unit = 'px'; // 默认单位为 px

        // 兼容处理：判断传入的 args 是原来的字符串，还是包含了单位的数组
        if (isset($params['args'])) {
            if (is_array($params['args'])) {
                $desc = isset($params['args']['desc']) ? $params['args']['desc'] : '';
                $unit = isset($params['args']['unit']) ? $params['args']['unit'] : 'px';
            } else {
                $desc = $params['args'];
            }
        }

        // 智能识别：如果是“一言”的延迟设置，自动将单位切换为“秒”
        if ($id === 'hitokoto_delay') {
            $unit = '秒';
        }

        $val = $this->get_val($id, 0);
        
        echo '<input type="number" name="poilive2d_options['.$id.']" id="'.$id.'" value="'.esc_attr($val).'" class="small-text" step="1" min="0"> <span>' . $unit . '</span>';
        
        if ($desc) {
            echo '<p class="description">'.$desc.'</p>';
        }
    }


    public function size_callback($params) {
        $id = $params['id'];
        $desc = isset($params['args']) ? $params['args'] : '';
        $val = $this->get_val($id, ['w' => 280, 'h' => 250]);
        
        echo '<input type="number" name="poilive2d_options['.$id.'][w]" value="'.esc_attr($val['w']??'').'" class="small-text" min="0"> <span>x</span> ';
        echo '<input type="number" name="poilive2d_options['.$id.'][h]" value="'.esc_attr($val['h']??'').'" class="small-text" min="0"> <span>px</span>';
        if ($desc) echo '<p class="description">'.$desc.'</p>';
    }

    public function color_callback($params) {
        $id = $params['id'];
        $val = $this->get_val($id, 'rgba(236, 217, 188, 0.5)');
        echo '<input type="text" name="poilive2d_options['.$id.']" id="'.$id.'" value="'.esc_attr($val).'" class="color-picker" data-alpha-enabled="true">';
    }


    public function fixed_tips_callback($params) {
        $id = $params['id'];
        $defaults = $params['args'];
        $vals = $this->get_val($id, $defaults);
        
        echo '<fieldset>';
        foreach ($defaults as $key => $default_text) {
            $current_text = isset($vals[$key]) ? $vals[$key] : $default_text;
            echo '<p style="display: flex; align-items: center; margin-bottom: 8px;">';
            
            // 左半部分：灰色只读框
            echo '<input type="text" class="regular-text" style="width: 160px; background-color: #f0f0f1; color: #8c8f94; border-color: #dcdcdc; margin-right: 10px; cursor: not-allowed;" readonly value="'.esc_attr($key).'">';
            
            // 中间的冒号
            echo '<span style="margin-right: 10px; font-weight: bold; color: #555;">:</span>';
            
            // 右半部分：可编辑文本框
            echo '<input type="text" class="regular-text" style="width: 800px;" name="poilive2d_options['.$id.']['.$key.']" value="'.esc_attr($current_text).'">';
            
            echo '</p>';
        }
        echo '</fieldset>';
    }

    // --- 模式一：分组行模式 (优化对齐与按钮) ---
    public function grouped_double_callback($params) {
    $id = $params['id'];
    $raw_items = $this->get_val($id, array());
    $grouped = array();
    if (is_array($raw_items)) {
        foreach ($raw_items as $item) {
            if (isset($item['selector'])) $grouped[$item['selector']][] = $item['text'];
        }
    }
    if (empty($grouped)) $grouped[''] = array('');

    // --- 核心修改：根据 ID 动态分配占位符和文案 ---
    $placeholder_left  = ($id === 'songs') ? '歌曲名称 (如: 乐鸣东方)' : '选择器 (如: #logo)';
    $placeholder_right = ($id === 'songs') ? '音频链接 (如: https://.../song.mp3)' : '提示文本';
    $btn_text          = ($id === 'songs') ? '+ 增加新歌曲' : '+ 增加新选择器组';
    // ------------------------------------------------

    echo '<div class="grouped-rows-container" id="'.$id.'_container">';
    foreach ($grouped as $selector => $texts) {
        echo '<div class="selector-group-box" style="display: flex; margin-bottom: 10px; align-items: flex-start; gap: 10px;">';
        
        // 应用左侧动态 placeholder
        echo '<input type="text" class="regular-text group-selector-input" style="width: 200px; font-weight: bold; margin: 0;" value="'.esc_attr($selector).'" placeholder="'.esc_attr($placeholder_left).'">';
        
        echo '<span style="font-weight: bold; margin-top: 5px;">:</span>';
        echo '<div class="group-right-pool" style="flex: 1; display: flex; flex-direction: column; gap: 5px;">';
        
        foreach ($texts as $t_index => $text) {
            $is_last = ($t_index === count($texts) - 1);
            echo '<div class="text-row" style="display: flex; gap: 5px; align-items: center;">';
            
            // 应用右侧动态 placeholder
            echo '<input type="text" class="regular-text group-text-input" style="width: 600px; margin: 0;" value="'.esc_attr($text).'" placeholder="'.esc_attr($placeholder_right).'">';
            
            echo '<button type="button" class="button remove-row-styled">-</button>'; 
            if ($is_last) echo '<button type="button" class="button add-text-row-styled">+</button>';
            echo '</div>';
        }
        echo '</div></div>';
    }
    echo '</div>';
    
    // 应用底部按钮动态文案
    echo '<p><button type="button" class="button button-primary add-new-group" data-target="'.$id.'_container">'.esc_html($btn_text).'</button></p>';
}
    

    // --- 模式二：多行文本框模式 (解决高度对齐) ---
    public function grouped_textarea_callback($params) {
        $id = $params['id'];
        $raw_items = $this->get_val($id, array());
        $grouped = array();
        if (is_array($raw_items)) {
            foreach ($raw_items as $item) {
                if (isset($item['selector'])) $grouped[$item['selector']][] = $item['text'];
            }
        }
        if (empty($grouped)) $grouped[''] = array('');

        echo '<div class="grouped-textarea-container" id="'.$id.'_container">';
        foreach ($grouped as $selector => $texts) {
            $textarea_content = implode("\n", $texts);
            echo '<div class="selector-group-box" style="display: flex; margin-bottom: 10px; align-items: flex-start; gap: 10px;">';
            echo '<input type="text" class="regular-text group-selector-input" style="width: 200px; font-weight: bold; margin: 0; height: 30px;" value="'.esc_attr($selector).'" placeholder="选择器">';
            echo '<span style="font-weight: bold; margin-top: 5px;">:</span>';
            echo '<div style="flex: 1;">';
            // 关键：min-height: 30px 和 padding 与 input 保持一致，确保单行时对齐
            echo '<textarea class="large-text group-text-area" rows="1" style="width: 600px; line-height: 1.5; padding: 3px 8px; min-height: 30px; margin: 0; resize: vertical; overflow: hidden;" placeholder="一行一条回复...">'.esc_textarea($textarea_content).'</textarea>';
            echo '</div></div>';
        }
        echo '</div>';
        echo '<p><button type="button" class="button button-primary add-new-group" data-target="'.$id.'_container">+ 增加新选择器组</button></p>';
    }

    // --- 模式三：单列重复模式 (同步更新) ---
    public function repeater_single_callback($params) {
        $id = $params['id'];
        $items = $this->get_val($id, array(''));
        echo '<div class="single-repeater-container" id="'.$id.'_container">';
        foreach ($items as $index => $item) {
            $is_last = ($index === count($items) - 1);
            echo '<div class="text-row" style="display: flex; gap: 5px; align-items: center; margin-bottom: 5px;">';
            echo '<input type="text" class="regular-text single-text-input" style="width: 600px; margin: 0;" value="'.esc_attr($item).'" placeholder="输入内容">';
            echo '<button type="button" class="button remove-row-styled">-</button>';
            if ($is_last) echo '<button type="button" class="button add-single-row-styled">+</button>';
            echo '</div>';
        }
        echo '</div>';
    }

    // 在页面底部注入一段 CSS 解决你看到的按钮大小不一致问题
    public function inject_admin_styles() {
        echo '<style>
            .remove-row-styled, .add-text-row-styled, .add-single-row-styled {
                width: 30px !important;
                height: 30px !important;
                padding: 0 !important;
                line-height: 28px !important;
                text-align: center !important;
                font-weight: bold !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            .add-text-row-styled, .add-single-row-styled { color: #2271b1 !important; }
            .remove-row-styled { color: #b32d2e !important; }
        </style>';
    }
    
    
    private function get_val($id, $hard_default = '') {
        // 先获取数据库中已保存的选项
        if (!isset($this->options)) {
            $this->options = get_option('poilive2d_options');
        }
        
        // 优先级 1：如果数据库中有用户保存过的值，优先使用
        if (isset($this->options[$id])) {
            return $this->options[$id];
        } 
        // 优先级 2：如果在我们的 defaults.json 中找到了对应的值，使用 JSON 里的
        elseif (isset($this->defaults[$id])) {
            return $this->defaults[$id];
        } 
        // 优先级 3：如果都没找到，使用代码里填写的硬编码默认值
        else {
            return $hard_default;
        }
    }


    


}



new PoiLive2D_Settings();
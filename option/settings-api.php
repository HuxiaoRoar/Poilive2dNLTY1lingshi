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
        
    }
    public function page_init() {

        // 注册统一的选项组，所有数据存入 'poilive2d_options' 数组
        register_setting(
            'poilive2d_options_group', 
            'poilive2d_options', 
            array($this, 'sanitize') 
        );

        // 在 page_init 内部计算初始状态
        $opt = get_option('poilive2d_options');
        $current_api = isset($opt['hitokoto_api']) ? $opt['hitokoto_api'] : 'local';
        $current_origin = isset($opt['hitokoto_origin']) ? $opt['hitokoto_origin'] : '2';
        


        // 计算类名（如果逻辑不符，则加上 hidden-settings-row）
        $local_msgs_class = ($current_api === 'local') ? '' : 'hidden-settings-row';
        $msgs_class = ($current_origin === '1') ? '' : 'hidden-settings-row';
        $suffixes_class = ($current_origin === '0') ? '' : 'hidden-settings-row';
        $jinrishici_sdk_class = ($current_api === 'jinrishici') ? '' : 'hidden-settings-row';
        

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
         * TAB 3: 一言设置 (poilive2d-hitokoto)
         * ========================================================================== */

        add_settings_section('section_hitokoto_main', '一言设置：', null, 'poilive2d-hitokoto');
        $this->add_field('poilive2d-hitokoto', 'section_hitokoto_main', 'hitokoto_delay', '启用一言', 'number_callback', '一言延迟时间(秒)。如果设置为0，则禁用一言。');
        // 1. API 选择 
        $this->add_field('poilive2d-hitokoto', 'section_hitokoto_main', 'hitokoto_api', '一言 API', 'select_callback', [
            'yiblue'      => '依言(luotianyi.blue)', 
            'jinrishici'  => '今日诗词(jinrishici.com)', 
            'hitokoto'    => '官方一言(v1.hitokoto.cn)', 
            'fghrsh'      => 'fghrsh一言(fghrsh.net)', 
            'local'       => '本地一言'
        ]);
        //1.5 API 选择后续设置（依赖关系）
        $this->add_field('poilive2d-hitokoto', 'section_hitokoto_main', 'hitokoto_jinrishici_sdk', '今日诗词推荐模式', 'radio_callback', [
            '0' => '关闭个性化推荐（使用老 API，更随机）', 
            '1' => '开启个性化推荐（使用SDK，根据地域天气推荐）'
        ], $jinrishici_sdk_class);   
        $this->add_field('poilive2d-hitokoto', 'section_hitokoto_main', 'hitokoto_local_msgs', '本地一言列表', 'textarea_array_callback', null, $local_msgs_class);

        $this->add_field('poilive2d-hitokoto', 'section_hitokoto_main', 'hitokoto_origin', '一言与来源排列方式', 'radio_callback', [
            '0' => '合为一句。例：长风破浪会有时，直挂云帆济沧海 ——（唐）李白',
            '1' => '分为两句。例：第一句：长风破浪会有时，直挂云帆济沧海。第二句：这句诗词出自《行路难》，是 唐代诗人 李白 创作的！',
            '2' => '不要介绍。例：长风破浪会有时，直挂云帆济沧海']);
         
        // 2. 来源介绍格式 
        $this->add_field('poilive2d-hitokoto', 'section_hitokoto_main', 'hitokoto_msgs', '来源介绍格式', 'fixed_tips_callback', [
            'dependency' => 1,
            'config' => [
                'yiblue'     => ['label' => '依言', 'default' => '这句一言出自 {source}，是 {creator} 在依言投稿的！'],
                'jinrishici' => ['label' => '今日诗词', 'default' => '这句诗词出自 《{title}》，是 {dynasty}诗人 {author} 创作的！'],
                'hitokoto'   => ['label' => '官方一言', 'default' => '这句一言出自 『{source}』{author}，是 {creator} 投稿的。'],
                'fghrsh'     => ['label' => 'FGHRSH', 'default' => '来看看站长写的小作文 《{text}》 吧！'],
                'local'      => ['label' => '本地一言', 'default' => '这句一言来自 『{source}』，是 {creator} 投稿的。']
            ]
        ], $msgs_class);

        // 3. 后缀编辑格式 (改为 dependency => 0)
        $this->add_field('poilive2d-hitokoto', 'section_hitokoto_main', 'hitokoto_suffixes', '后缀编辑格式', 'fixed_tips_callback', [
            'dependency' => 0,
            'config' => [
                'yiblue'     => ['label' => '依言', 'default' => ' —— {creator}《{source}》'],
                'jinrishici' => ['label' => '今日诗词', 'default' => ' —— （{dynasty}）{author}《{title}》'],
                'hitokoto'   => ['label' => '官方一言', 'default' => ' —— {source}{author}'],
                'fghrsh'     => ['label' => 'FGHRSH', 'default' => ' —— 《{source}》'],
                'local'      => ['label' => '本地一言', 'default' => ' —— {source}（{creator}）']
            ]
        ], $suffixes_class);        

        /* ==========================================================================
         * TAB 4: 交互设置 (poilive2d-interactive)
         * ========================================================================== */       
        
        add_settings_section('section_interactive_condition', '高级鼠标交互设置：', null, 'poilive2d-interactive');        
        $this->add_field('poilive2d-interactive', 'section_interactive_condition', 'mouse_condition_hover', '条件判断交互-悬停', 'condition_interaction_callback', '无需判断的直接留空条件框即可。');
        $this->add_field('poilive2d-interactive', 'section_interactive_condition', 'mouse_condition_click_msgs', '条件判断交互-点击', 'condition_interaction_callback', '无需判断的直接留空条件框即可。');


add_settings_section('section_interactive_other', '进出交互设置：', null, 'poilive2d-interactive');
        $this->add_field('poilive2d-interactive', 'section_interactive_other', 'mouse_copy_msgs', '复制信息时的提示', 'repeater_single_callback');
        $this->add_field('poilive2d-interactive', 'section_interactive_other', 'mouse_hide_msgs', '隐藏角色的提示', 'repeater_single_callback');
        $this->add_field('poilive2d-interactive', 'section_interactive_other', 'mouse_show_msgs', '显示角色提示', 'repeater_single_callback');
        $this->add_field('poilive2d-interactive', 'section_interactive_other', 'tab_leave_msgs', '切出页面提示', 'repeater_single_callback');
        $this->add_field('poilive2d-interactive', 'section_interactive_other', 'tab_return_msgs', '切回页面提示', 'repeater_single_callback');

        add_settings_section('section_interactive_mouse', '常规鼠标交互设置：', null, 'poilive2d-interactive');        
        $this->add_field('poilive2d-interactive', 'section_interactive_mouse', 'mouse_hover', '鼠标悬停提示', 'grouped_textarea_callback');
        $this->add_field('poilive2d-interactive', 'section_interactive_mouse', 'mouse_click_msgs', '鼠标点击提示', 'grouped_textarea_callback');

        /* ==========================================================================
         * TAB 5: 高级设置 (poilive2d-advanced)
         * ========================================================================== */
        

        add_settings_section('section_adv_welcome', '进站欢迎设置：', null, 'poilive2d-advanced');
        
        $this->add_field('poilive2d-advanced', 'section_adv_welcome', 'welcome_hourly', '每小时提示', 'grouped_double_callback');
        $this->add_field('poilive2d-advanced', 'section_adv_welcome', 'welcome_search', '搜索引擎入站提示', 'grouped_double_callback');
        $this->add_field('poilive2d-advanced', 'section_adv_welcome', 'welcome_domain', '访问本站点的提示', 'grouped_double_callback');
        $this->add_field('poilive2d-advanced', 'section_adv_welcome', 'welcome_festival', '节日提示', 'grouped_double_callback');        

        add_settings_section('section_adv_audio', 'Sing设置：', null, 'poilive2d-advanced');
        $this->add_field('poilive2d-advanced', 'section_adv_audio', 'songs', '播放列表', 'grouped_double_callback');
    }

    // 辅助函数：快速添加字段
    private function add_field($page, $section, $id, $title, $callback, $args = null, $class = '') {
        add_settings_field(
            $id, 
            $title, 
            array($this, $callback), 
            $page, 
            $section, 
            array(
                'id' => $id, 
                'args' => $args,
                'class' => $class // WordPress 会把这个类加到 tr 标签上
            )
        );
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
    

    // --- 模式一：分组行模式 (优化对齐与按钮) ---
    public function grouped_double_callback($params) {
    $id = $params['id'];
    $raw_items = $this->get_val($id, array());
    $grouped = array();

    if (is_array($raw_items)) {
        foreach ($raw_items as $item) {
            
            if (isset($item['selector']) && !empty($item['text']) && is_array($item['text'])) {
                foreach ($item['text'] as $t) {
                    $grouped[$item['selector']][] = $t;
                }
            }
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
    

    // --- 模式二：多行文本框模式 (防闪烁自适应高度版) ---
    public function grouped_textarea_callback($params) {
        $id = $params['id'];
        
        // 1. 解析备注参数 (兼容字符串或数组格式)
        $desc = '';
        if (isset($params['args'])) {
            $desc = is_array($params['args']) ? (isset($params['args']['desc']) ? $params['args']['desc'] : '') : $params['args'];
        }

        $raw_items = $this->get_val($id, array());
        $grouped = array();
        
        // (继承上一步的纯净数组遍历逻辑)
        if (is_array($raw_items)) {
            foreach ($raw_items as $item) {
                if (isset($item['selector']) && !empty($item['text']) && is_array($item['text'])) {
                    foreach ($item['text'] as $t) {
                        $grouped[$item['selector']][] = $t;
                    }
                }
            }
        }
        if (empty($grouped)) $grouped[''] = array('');

        echo '<div class="grouped-textarea-container" id="'.$id.'_container">';
        foreach ($grouped as $selector => $texts) {
            $textarea_content = implode("\n", $texts);

            $line_count = 0;
            foreach ($texts as $line) {
                $len = mb_strlen($line, 'UTF-8');
                if ($len > 82) {
                    $line_count += ceil($len / 82); 
                } else {
                    $line_count += 1;
                }
            }
            if ($line_count == 0) $line_count = 1;

            // 2. 高度补偿：行高24px + 上下padding共16px = 单行40px
            $pre_height = max(40, $line_count * 24 + 16);

            echo '<div class="selector-group-box" style="display: flex; margin-bottom: 10px; align-items: flex-start; gap: 10px;">';
            // 左侧输入框：增加 box-sizing 锁定 40px 物理高度
            echo '<input type="text" class="regular-text group-selector-input" style="box-sizing: border-box; width: 200px; font-weight: bold; margin: 0; height: 40px; line-height: 24px;" value="'.esc_attr($selector).'" placeholder="选择器">';
            echo '<span style="font-weight: bold; margin-top: 10px;">:</span>';

            echo '<div style="flex: 1;">';            
            // 右侧文本框：修改 padding 为 7px 8px，增加 box-sizing
            echo '<textarea class="large-text group-text-area auto-expand-textarea" rows="1" style="box-sizing: border-box; width: 600px; line-height: 24px; padding: 7px 8px; min-height: 40px; height: '.$pre_height.'px; margin: 0; resize: vertical; overflow: hidden;" placeholder="一行一条回复...">'.esc_textarea($textarea_content).'</textarea>';
            echo '</div></div>';
        }
        echo '</div>';
        echo '<p><button type="button" class="button button-primary add-new-group" data-target="'.$id.'_container">+ 增加新选择器组</button></p>';

        // 3. 输出备注文案
        if (!empty($desc)) {
            echo '<p class="description">'.$desc.'</p>';
        }
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

    // --- 模式四：纯净多行数组模式 (防闪烁自适应高度版 - 包含超长折行计算) ---
    public function textarea_array_callback($params) {
        $id = $params['id'];
        
        // 1. 解析备注参数 (兼容字符串或数组格式)
        $desc = '';
        if (isset($params['args'])) {
            $desc = is_array($params['args']) ? (isset($params['args']['desc']) ? $params['args']['desc'] : '') : $params['args'];
        }
        
        $val = $this->get_val($id, array());
        if (!is_array($val)) $val = array();
        
        $content = implode("\n", $val);

        $line_count = 0;
        foreach ($val as $line) {
            $width = mb_strwidth($line, 'UTF-8');
            if ($width > 112) {
                $line_count += ceil($width / 112); 
            } else {
                $line_count += 1;
            }
        }
        if ($line_count == 0) $line_count = 1;

        // 2. 高度补偿：行高24px + 上下padding共16px = 单行40px
        $pre_height = max(40, $line_count * 24 + 16);

        // 3. 输出框体，匹配 40px 的视觉基准
// 输出框体：修改 padding 为 7px 8px，增加 box-sizing
        echo '<textarea name="poilive2d_options['.$id.']" id="'.$id.'" class="large-text auto-expand-textarea json-array-textarea" style="box-sizing: border-box; width: 800px; line-height: 24px; padding: 7px 8px; min-height: 40px; height: '.$pre_height.'px; resize: vertical; overflow: hidden;" placeholder="请输入本地一言，一行一条...">'.esc_textarea($content).'</textarea>';        
        // 4. 输出说明文案
        if (!empty($desc)) {
            echo '<p class="description">'.$desc.'</p>';
        }
    }

    // --- 模式五：动态条件交互模式 (对齐原生排版，带真假颜色描边) ---
    public function condition_interaction_callback($params) {
        $id = $params['id'];
        
        // 解析备注参数
        $desc = '';
        if (isset($params['args'])) {
            $desc = is_array($params['args']) ? (isset($params['args']['desc']) ? $params['args']['desc'] : '') : $params['args'];
        }

        $raw_items = $this->get_val($id, array());
        $items = array();
        
        // 数据清洗：格式化成标准二维数组
        if (is_array($raw_items)) {
            foreach ($raw_items as $item) {
                if (!empty($item['selector'])) {
                    $items[] = array(
                        'selector'   => $item['selector'],
                        'condition'  => isset($item['condition']) ? $item['condition'] : '',
                        'text_true'  => (isset($item['text_true']) && is_array($item['text_true'])) ? $item['text_true'] : array(),
                        'text_false' => (isset($item['text_false']) && is_array($item['text_false'])) ? $item['text_false'] : array(),
                    );
                }
            }
        }
        if (empty($items)) {
            $items[] = array('selector' => '', 'condition' => '', 'text_true' => array(''), 'text_false' => array(''));
        }

        echo '<div class="condition-interaction-container" id="'.$id.'_container">';
        foreach ($items as $item) {
            $true_content = implode("\n", $item['text_true']);
            $false_content = implode("\n", $item['text_false']);

            // 高度防闪烁计算：[真] 文本框 (完全对标 grouped_textarea_callback 的算法)
            $line_count_t = 0;
            foreach ($item['text_true'] as $line) {
                $len_t = mb_strlen($line, 'UTF-8');
                $line_count_t += ($len_t > 82) ? ceil($len_t / 82) : 1;
            }
            if ($line_count_t == 0) $line_count_t = 1;
            $pre_height_t = max(40, $line_count_t * 24 + 16);

            // 高度防闪烁计算：[假] 文本框
            $line_count_f = 0;
            foreach ($item['text_false'] as $line) {
                $len_f = mb_strlen($line, 'UTF-8');
                $line_count_f += ($len_f > 82) ? ceil($len_f / 82) : 1;
            }
            if ($line_count_f == 0) $line_count_f = 1;
            $pre_height_f = max(40, $line_count_f * 24 + 16);

            // 最外层容器：干掉白色背景和描边，使用 flex 横向排布，间距 10px 完美对齐上方 UI
            echo '<div class="selector-group-box" style="display: flex; margin-bottom: 10px; align-items: flex-start; gap: 10px;">';

            // 1. 左侧：触发元素选择器 (强制 200px 宽，40px 高)
            echo '<input type="text" class="regular-text group-selector-input" style="box-sizing: border-box; width: 200px; font-weight: bold; margin: 0; height: 40px; line-height: 24px;" value="'.esc_attr($item['selector']).'" placeholder="触发元素 (如: .aplayer-pic)">';
            
            // 2. 中间：冒号
            echo '<span style="font-weight: bold; margin-top: 10px;">:</span>';

            // 3. 右侧容器：里面装着【判定条件】和【真假文本框】
            echo '<div style="flex: 1; display: flex; flex-direction: column; gap: 10px;">';
            
            // 右侧第一行：判定条件 (强制 200px 宽，和左边对称，40px 高)
            echo '<input type="text" class="regular-text group-condition-input" style="box-sizing: border-box; width: 600px; font-family: monospace; margin: 0; height: 40px; line-height: 24px; background-color: #ffffff;" value="'.esc_attr($item['condition']).'" placeholder="判定条件 (如: length > 0)">';
            
            // 右侧第二行：满足条件时触发 (绿框，600px 宽)
            echo '<textarea class="large-text group-text-true auto-expand-textarea" rows="1" style="box-sizing: border-box; width: 600px; line-height: 24px; padding: 7px 8px; min-height: 40px; height: '.$pre_height_t.'px; margin: 0; resize: vertical; overflow: hidden; border: 1px solid #46b450; border-left: 4px solid #46b450;" placeholder="[满足条件时触发] 一行一条... 留空不触发">'.esc_textarea($true_content).'</textarea>';
            
            // 右侧第三行：不满足条件时触发 (红框，600px 宽)
            echo '<textarea class="large-text group-text-false auto-expand-textarea" rows="1" style="box-sizing: border-box; width: 600px; line-height: 24px; padding: 7px 8px; min-height: 40px; height: '.$pre_height_f.'px; margin: 0; resize: vertical; overflow: hidden; border: 1px solid #dc3232; border-left: 4px solid #dc3232;" placeholder="[不满足条件时触发] 一行一条... 留空不触发">'.esc_textarea($false_content).'</textarea>';
            
            echo '</div>'; // 右侧容器结束
            echo '</div>'; // 单组最外层结束
        }
        echo '</div>';
        echo '<p><button type="button" class="button button-primary add-new-group" data-target="'.$id.'_container">+ 增加新条件判定组</button></p>';
        
        if (!empty($desc)) {
            echo '<p class="description">'.$desc.'</p>';
        }
    }

    // --- 增强版：固定提示列表回调 ---
    public function fixed_tips_callback($params) {
        $id = $params['id'];
        $config = $params['args']['config'];
        $vals = $this->get_val($id, array()); 

        // 直接输出 fieldset，不再包裹任何带 display:none 的 div
        echo '<fieldset>';
        foreach ($config as $slug => $data) {
            $label = $data['label'];
            $default_text = $data['default'];
            $current_text = isset($vals[$slug]) ? $vals[$slug] : $default_text;
            
            echo '<p style="display: flex; align-items: center; margin-bottom: 8px;">';
            echo '<input type="text" class="regular-text" style="width: 200px; background-color: #f0f0f1; color: #8c8f94; border-color: #dcdcdc; margin-right: 10px; cursor: not-allowed;" readonly value="'.esc_attr($label).'">';
            echo '<span style="margin-right: 10px; font-weight: bold; color: #555;">:</span>';
            echo '<input type="text" class="regular-text" style="width: 800px;" name="poilive2d_options['.$id.']['.$slug.']" value="'.esc_attr($current_text).'">';
            echo '</p>';
        }
        echo '</fieldset>';
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
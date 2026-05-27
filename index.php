<?php
/*
Plugin Name:新·洛天依Live2D
Plugin URI: http://www.luotianyi.blue/2023-06/new·luotianyi-live2d.html
Description: 在你的博客里添加一个V4洛天依！基于众人插件修改而来，详情内容请看插件主页。
Version: 1.7.12
Author: 虎啸ROAR
Author URI: https://www.luotianyi.blue
License: GPLV2
*/

defined('ABSPATH') or exit;
define('LIVE2D_VERSION', '1.7.12');
define('LIVE2D_URL', plugins_url('', __FILE__));
define('LIVE2D_PATH', dirname(__FILE__));

if (file_exists(LIVE2D_PATH . '/option/settings-api.php')) {
    require_once LIVE2D_PATH . '/option/settings-api.php';
}

/*register_activation_hook(__FILE__, 'poilive2d_plugin_activate');*/
add_action('admin_init', 'poilive2d_plugin_redirect');



function poilive2d_plugin_redirect()
{
    if (get_option('do_activation_redirect', false)) {
       // delete_option('do_activation_redirect');
        wp_redirect(admin_url('options-general.php?page=poilive2d'));
    }
}

function poilive2d_register_plugin_settings_link($links)
{
    $settings_link = '<a href="options-general.php?page=poilive2d">设置</a>';
    array_unshift($links, $settings_link);
    return $links;
}
$plugin = plugin_basename(__FILE__);
add_filter("plugin_action_links_{$plugin}", 'poilive2d_register_plugin_settings_link');

if (is_admin()) {
    add_action('admin_menu', 'poilive2d_menu');
}

function poilive2d_menu()
{
    add_options_page('新·洛天依Live2D控制面板1', '新·洛天依Live2D设置1', 'administrator', 'poilive2d', 'poilive2d_pluginoptions_page');
}

function poilive2d_pluginoptions_page()
{
    require "option.php";
}

//设定默认值
$live2d_setting_default = array(
    'maincolor' => '#66ccff',
    'bgcolor' => '#faf8f7',
    'fontcolor' => '#02111d'
);

// 将脚本排队加载到后台页面
add_action('admin_enqueue_scripts', 'poilive2d_admin_scripts');

function poilive2d_admin_scripts($hook_suffix) {
    // 确保只在插件设置页面加载
    if (strpos($hook_suffix, 'poilive2d') === false) {
        return;
    }
    wp_enqueue_style('poilive2d-admin-css', plugin_dir_url(__FILE__) . 'option/admin-style.css', array(), '1.0');

    // 1. 加载 WordPress 核心 CodeMirror 资源
    $settings = wp_enqueue_code_editor( array( 'type' => 'application/json' ) );

    // 2. 加载颜色选择器等基础库
    wp_enqueue_style('wp-color-picker');
    wp_enqueue_script('wp-color-picker');

    wp_enqueue_script(
        'wp-color-picker-alpha',
        plugins_url('option/wp-color-picker-alpha.min.js', __FILE__),
        array('wp-color-picker'),
        '3.0.0',
        true
    );

    // 3. 【关键：先排队主脚本】
    wp_enqueue_script(
        'poilive2d-admin-js', 
        plugins_url('option/admin-scripts.js', __FILE__), 
        array('jquery', 'wp-color-picker-alpha'), 
        time(), // 使用时间戳防止缓存
        true
    );

    $default_file = LIVE2D_PATH . '/option/defaults.json';
    $defaults_data = file_exists($default_file) ? json_decode(file_get_contents($default_file), true) : array();

    // 4. 关键：注入两个变量（编辑器配置 + 默认数据）
    wp_add_inline_script( 
        'poilive2d-admin-js', 
        'var poilive2d_editor_settings = ' . wp_json_encode( $settings ) . ';' .
        'var poilive2d_defaults = ' . wp_json_encode( $defaults_data ) . ';', // 增加这行！
        'after'
    );

}


require LIVE2D_PATH . '/main.php';
?>
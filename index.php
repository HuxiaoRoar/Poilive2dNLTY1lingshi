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

if (file_exists(LIVE2D_PATH . '/inc/settings-api.php')) {
    require_once LIVE2D_PATH . '/inc/settings-api.php';
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

    // 1. 加载 WordPress 核心 CodeMirror 资源
    $settings = wp_enqueue_code_editor( array( 'type' => 'application/json' ) );

    // 2. 加载颜色选择器等基础库
    wp_enqueue_style('wp-color-picker');
    wp_enqueue_script('wp-color-picker');

    wp_enqueue_script(
        'wp-color-picker-alpha',
        plugins_url('live2d/js/wp-color-picker-alpha.min.js', __FILE__),
        array('wp-color-picker'),
        '3.0.0',
        true
    );

    // 3. 【关键：先排队主脚本】
    wp_enqueue_script(
        'poilive2d-admin-js', 
        plugins_url('live2d/js/admin-scripts.js', __FILE__), 
        array('jquery', 'wp-color-picker-alpha'), 
        time(), // 使用时间戳防止缓存
        true
    );

    $default_file = LIVE2D_PATH . '/inc/defaults.json';
    $defaults_data = file_exists($default_file) ? json_decode(file_get_contents($default_file), true) : array();

    // 4. 关键：注入两个变量（编辑器配置 + 默认数据）
    wp_add_inline_script( 
        'poilive2d-admin-js', 
        'var poilive2d_editor_settings = ' . wp_json_encode( $settings ) . ';' .
        'var poilive2d_defaults = ' . wp_json_encode( $defaults_data ) . ';', // 增加这行！
        'after'
    );
}


//写入默认设置
if (!get_option('live2d_maincolor')) {
    update_option('live2d_maincolor', $live2d_setting_default['maincolor']);
}
if (!get_option('live2d_bgcolor')) {
    update_option('live2d_bgcolor', $live2d_setting_default['bgcolor']);
}
if (!get_option('live2d_fontcolor')) {
    update_option('live2d_fontcolor', $live2d_setting_default['fontcolor']);
}
if (!get_option('live2d_nohitokoto')) {
    update_option('live2d_nohitokoto', '');
}
if (!get_option('live2d_nospecialtip')) {
    update_option('live2d_nospecialtip', '');
}
if (!get_option('live2d_nocatalog')) {
    update_option('live2d_nocatalog', '');
}
if (!get_option('live2d_custommsg')) {
    $json = "{\n\t\"mouseover\": [\n\t\t{\n\t\t\"selector\": \".post-meta a\",\n\t\t\"text\": [\n\t\t\t\"来看看 <span style='color:#0099cc;'>「{text}」</span> 嘛！\"\n\t\t]\n\t\t},\n\t\t{\n\t\t\"selector\": \".post .post-title\",\n\t\t\"text\": [\n\t\t\t\"来看看站长写的小作文 <span style='color:#0099cc;'>《{text}》</span> 吧！\"\n\t\t]\n\t\t},\n\t\t{\n\t\t\"selector\": \".feature-content a\",\n\t\t\"text\": [\n\t\t\t\"这是超级热门的 <span style='color:#0099cc;'>「{text}」</span> ，看一下！看一下！\"\n\t\t]\n\t\t},\n\t\t{\n\t\t\"selector\": \".searchbox\",\n\t\t\"text\": [\n\t\t\t\"希望你能找到心仪的东西！\"\n\t\t]\n\t\t},\n\t\t{\n\t\t\"selector\": \".top-social\",\n\t\t\"text\": [\n\t\t\t\"这是站长的社交账号！关注站长喵，关注站长谢谢喵！\"\n\t\t]\n\t\t},\n\t\t{\n\t\t\"selector\": \".header-tou\",\n\t\t\"text\": [\n\t\t\t\"转起来咯！\"\n\t\t]\n\t\t},\n\t\t{\n\t\t\"selector\": \".zilla-likes\",\n\t\t\"text\": [\n\t\t\t\"听说点这个，站长会很开心喵~\"\n\t\t]\n\t\t},\n\t\t{\n\t\t\"selector\": \".cd-top\",\n\t\t\"text\": [\n\t\t\t\"拉一下这个，页面就咻的飞上去咯！\",\n\t\t\t\"起飞咯\",\n\t\t\t\"回到最初的起点！\"\n\t\t]\n\t\t},\n\t\t{\n\t\t\"selector\": \".site-title\",\n\t\t\"text\": [\n\t\t\t\"跃迁即将启动！目的地:网站扉页！\",\n\t\t\t\"要回到首页再看看嘛！\",\n\t\t\t\"返回首页\"\n\t\t]\n\t\t},\n\t\t{\n\t\t\"selector\": \".comments\",\n\t\t\"text\": [\n\t\t\t\"欢迎留言！有问必答！\",\n\t\t\t\"善语结善缘,恶语伤人心\",\n\t\t\t\"这是评论区,不是无人区（虽然暂时是）\",\n\t\t\t\"有什么想和大家分享的吗\",\n\t\t\t\"想和站长讨论些什么？\",\n\t\t\t\"这是一个自由的社区。\",\n\t\t\t\"申请互动！\",\n\t\t\t\"发个友善的评论见证当下！\"\n\t\t]\n\t\t},\n\t\t{  \n\t\t\"selector\": \".post-nepre.previous\",\n\t\t\"text\": [\n\t\t\t\"想看看上一篇文章？\"\n\t\t]\n\t\t},\n\t\t{\n\t\t\"selector\": \".post-nepre.next\",\n\t\t\"text\": [\n\t\t\t\"再看看下一篇文章？\"\n\t\t]\n\t\t},\n\t\t{\n\t\t\"selector\": \".reward-open\",\n\t\t\"text\": [\n\t\t\t\"请站长一杯果茶吧！\"\n\t\t]\n\t\t},\n\t\t{\n\t\t\"selector\": \"#video-btn.loadvideo.videolive\",\n\t\t\"text\": [\n\t\t\t\"走过路过，不要错过！精彩演出，即将上演\",\n\t\t\t\"旁友，这有好康的视频，看看？\",\n\t\t\t\"来看看我的视频吧！\"\n\t\t]\n\t\t},\t\t\n\t\t{\n\t\t\"selector\": \"#video-add\",\n\t\t\"text\": [\n\t\t\t\"诶？不想看这个？好嘛，都依你，点击换一个吧。\",\n\t\t\t\"想换台嘛？\",\n\t\t\t\"换个视频再看看吧！\",\n\t\t\t\"下个视频更精彩！\",\n\t\t\t\"随机换个新视频吧！\"\n\t\t]\n\t\t},\n\t\t{\n\t\t\"selector\": \"#video-btn.haslive.video-play\",\n\t\t\"text\": [\n\t\t\t\"继续播放！\",\n\t\t\t\"休息好了吗？那我继续播放咯。\",\n\t\t\t\"再看一会吧\",\n\t\t\t\"至少把这个视频看完嘛！\",\n\t\t\t\"觉得视频好看嘛？别忘了来b站关注天依哦\"\n\t\t]\n\t\t},  \n\t\t{\n\t\t\"selector\": \"#hide-button\",\n\t\t\"text\": [\n\t\t\t\"完美继承站长的话痨，如果觉得烦，点一下我就先润咯~\"\n\t\t]\n\t\t},\n\t\t{\n\t\t\"selector\": \"#sing-button\",\n\t\t\"text\": [\n\t\t\t\"想听我唱歌吗？\",\n\t\t\t\"为了你唱下去！\",\n\t\t\t\"准备唱歌咯！\"\n\t\t]\n\t\t},\n\t\t{\n\t\t\"selector\": \"#catalog-button\",\n\t\t\"text\": [\n\t\t\t\"可以查看文章结构！\",\n\t\t\t\"需要看下当前目录嘛？\"\n\t\t]\n\t\t},\n\t\t{\n\t\t\"selector\": \"#change-button\",\n\t\t\"text\": [\n\t\t\t\"Henshin\",\n\t\t\t\"Set!Henshin\",\n\t\t\t\"启动超级变化形态！\",\n\t\t\t\"盖亚！（？？？）\",\n\t\t\t\"大声的喊出我的名字！\",\n\t\t\t\"你的神光棒准备好了吗？\",\n\t\t\t\"你也想化身为光吗？\",\n\t\t\t\"到底要选哪个呢？到底要选哪个呢？到底要选哪个呢？\",\n\t\t\t\"发生什么事了,发生什么事了,发生什么事了!\",\n\t\t\t\"一旦接受了自己的软弱，那我就是，无敌的！\",\n\t\t\t\"释放自我！走我的路，假面骑士贞贞贞贞德\"\n\t\t]\n\t\t},\n\t\t\n\t\t{\n\t\t\"selector\": \"#pagination\",\n\t\t\"text\": [\n\t\t\t\"想看看更久远的内容？\",\n\t\t\t\"你也想回到过去吗？\",\n\t\t\t\"到底了~\",\n\t\t\t\"要不再去搜索看看\"\n\t\t]\n\t\t},\n\t\t{\n\t\t\"selector\": \"#switch-button\",\n\t\t\"text\": [\n\t\t\t\"换个衣服！\",\n\t\t\t\"祈祷这次衣服不要重复！\"\n\t\t]\n\t\t},\n\t\t{\n\t\t\"selector\": \".changeSkin-gear\",\n\t\t\"text\": [\n\t\t\t\"换个背景，换个心情\",\n\t\t\t\"可以更换背景哦\"\n\t\t]\n\t\t}, {\n\t\t\"selector\": \".control-btn-serif\",\n\t\t\"text\": [\n\t\t\t\"衬线字体，也就是宋体啦！\"\n\t\t]\n\t\t},{\n\t\t\"selector\": \".control-btn-sans-serif\",\n\t\t\"text\": [\n\t\t\t\"无衬线体，也就是黑体啦！\"\n\t\t]\n\t\t}\n\t],\n\t\"click\": [\n\t\t{\n\t\t\"selector\": \"#landlord #live2d\",\n\t\t\"text\": [\n\t\t\t\"摸摸~(,,´•ω•)ノ(´っω•｀。)\",\n\t\t\t\"谢谢你喜欢我\",\n\t\t\t\"抱抱(づ｡◕‿‿◕｡)づ\",\n\t\t\t\"你好，我是站长\",\n\t\t\t\"我也超级喜欢你！\",\n\t\t\t\"希望你今天过得开心\",\n\t\t\t\"祝你生活愉快\",\n\t\t\t\"谢谢你访问我的网站\",\n\t\t\t\"如果有什么不开心的事，都可以和我说说\",\n\t\t\t\"万一我们不能再见，祝你早上好，中午好，晚安\",\n\t\t\t\"记得要好好吃饭，好好生活\",\n\t\t\t\"人生就像一盒巧克力，你永远不知道下一颗是什么味道\",\n\t\t\t\"有些鸟儿是关不住的，每一片羽毛都闪耀着自由的光辉\",\n\t\t\t\"昨天已是历史，明天是个谜团，只有今天是天赐的礼物\",\n\t\t\t\"折断的骨头是最好的课本\",\n\t\t\t\"要么忙于生存,要么赶着去死。\",\n\t\t\t\"希望是件美丽的东西，也许是最好的东西。美好的东西是永远不会死的。\",\n\t\t\t\"以笑的方式哭，在死亡的伴随下活着。\",\n\t\t\t\"这世界上有各种各样的人，恰巧我们成为了朋友，这不是缘分，仅仅只是我们本就应该是朋友。\",\n\t\t\t\"不管何时何地，做你想做的事永远都不晚。\",\n\t\t\t\"做出决定并不困难，困难的是接受决定。\",\n\t\t\t\"所有大人都曾是小孩，虽然只有少数人记得。\",\n\t\t\t\"我们中有的人暗淡无光，有的人鲜艳亮丽，有的光彩照人，但是偶尔，你也会遇到如同彩虹般绚丽的人，当你真遇到时，其他一切都不重要了\",\n\t\t\t\"我们都出生在阴沟里,但仍有人仰望星空\"\n\t\t]\n\t\t},\n\t\t{\n\t\t\"selector\": \"#video-btn.loadvideo.videolive\",\n\t\t\"text\": [\n\t\t\t\"坐好小板凳，演出要开始咯！\",\n\t\t\t\"精彩即将上演！\",\n\t\t\t\"视频加载中，请耐心等待！\",\n\t\t\t\"我润啦！\",\n\t\t\t\"那我先藏起来啦！\",\n\t\t\t\"不打扰你看视频啦！\",\n\t\t\t\"视频马上就来！\",\n\t\t\t\"视频马上好！马上好！\"\n\t\t]\n\t\t},\n\t\t{\n\t\t\"selector\": \"#video-btn.haslive.video-pause.videolive\",\n\t\t\"text\": [\n\t\t\t\"唔。。。我好像睡着了。。。\",\n\t\t\t\"我回来啦！\",\n\t\t\t\"你的小可爱突然出现！\",\n\t\t\t\"看累了？休息一会吧！\"\n\t\t]\n\t\t},\n\t\t{\n\t\t\"selector\": \"#video-btn.haslive.video-play\",\n\t\t\"text\": [\n\t\t\t\"我又润啦！\",\n\t\t\t\"我又躲起来啦！\",\n\t\t\t\"下半场开始！\",\n\t\t\t\"演出继续！\",\n\t\t\t\"这次看完嘛，让我多睡会。\"\n\t\t]\n\t\t}\n\t]\n}";
    update_option('live2d_custommsg', $json);
}
if (!get_option('live2d_localkoto')) {
    $customkoto = "{\n\t\"localkoto\": [\n\t\t\"想听我唱歌吗？点上面的sing就可以咯。\",\n\t\t\"希望你，单枪匹马，活得漂亮\",\n\t\t\"你是我 迷途时的星光 心之所向\",\n\t\t\"不论这世界多糟糕，未来的你会光芒万丈\",\n\t\t\"我愿成为照亮你的第一束光\",\n\t\t\"请坚持做自己就好\",\n\t\t\"这些都是天依最爱的歌词，也是天依想对你说的\",\n\t\t\"你好，我是洛天依\",\n\t\t\"总会有人赞同的 承认你一切所做\",\n\t\t\"在这之前请一定 勇敢坚强地活着\",\n\t\t\"机械的心律带动血肉的共鸣\",\n\t\t\"为了你唱下去见证风息雨霁\",\n\t\t\"因为你，我坚定梦想，找到自己，真实渴望\",\n\t\t\"欢笑声和泪水交织 将幸福的天空点亮\",\n\t\t\"我会将世界上每一个需要我的地方，变得闪闪发亮\",\n\t\t\"世界上一定有未着色的某个地方，只能由我点亮\",\n\t\t\"我成为我就好，越模仿越假装，越不比谁更强\",\n\t\t\"像孤单的旅行家，骗自己我不害怕\",\n\t\t\"谁不曾向往 成为屹立于这世界上的炎黄\",\n\t\t\"不开心的就都忘了吧 您尽管别回头 您大步迈\",\n\t\t\"起承转合自有交待 人生如戏开箱大吉呀\",\n\t\t\"水星逆不逆 太岁来不来 咱有个好心态\",\n\t\t\"都说人间苦 人间也很精彩 有多少欢笑 有多少无奈\",\n\t\t\"每个梦里都有段旋律 每颗心底都有个秘密\",\n\t\t\"存在为将心声响彻 多少岁月想要伴你走过\",\n\t\t\"最黯淡的一个 梦最为炽热\",\n\t\t\"幸福从非泡影 以笑容证明\",\n\t\t\"万千孤单焰火 让这虚构灵魂鲜活\",\n\t\t\"你脸颊热泪 绝非被谁取笑的愚昧\",\n\t\t\"三行印刷体便概括的诞生 和普通人也没有什么差别\",\n\t\t\"为了你唱下去 为你将希冀传递\",\n\t\t\"复习信件 入学毕业 默念名字生疏齿间\",\n\t\t\"谁奏那离愁曲绕梁 备一身行头我们再出发\",\n\t\t\"唯画卷 笑千年雨雪风霜\",\n\t\t\"怎会有歌能让人感到难过或快乐\",\n\t\t\"像我说的只是勾动你回忆罢了\",\n\t\t\"我想带着你寻梦最深处的执着\",\n\t\t\"属于你的最初那份悠然恬淡呢\"\n\t]\n}";
    update_option('live2d_customkoto', $customkoto);
}
require LIVE2D_PATH . '/main.php';
?>
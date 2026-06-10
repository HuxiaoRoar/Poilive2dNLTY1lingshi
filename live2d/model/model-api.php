<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");

// 1. 获取参数并进行简单的中文安全过滤
$model_name = isset($_GET['model']) ? basename($_GET['model']) : '天依';

$tex_id = isset($_GET['tex']) ? intval($_GET['tex']) : 0;

// 2. 定位到当前目录下的模型文件夹
$model_dir = __DIR__ . '/' . $model_name;

// ★ 核心修复：不再死板地寻找 model.json，而是动态匹配任何以 model.json 结尾的文件
$v2_models = glob($model_dir . '/*model.json');

if (empty($v2_models)) {
    die(json_encode(array('error' => '找不到模型配置文件: ' . $model_name)));
}

// 拿到找到的第一个 JSON 文件路径（比如 1.model.json）
$base_json_path = $v2_models[0]; 

// 3. 读取并解析纯净的 JSON
$json_content = file_get_contents($base_json_path);
$model_data = json_decode($json_content, true);

// 4. 扫描 textures 文件夹找衣服
$textures = glob($model_dir . '/textures/*.png');
$valid_tex_ids = array();
foreach ($textures as $tex) {
    $filename = basename($tex, '.png');
    if (is_numeric($filename)) {
        $valid_tex_ids[] = intval($filename);
    }
}

// ★ 对模型名称进行标准的 URL 编码
$safe_model_url = rawurlencode($model_name);

if (!empty($valid_tex_ids)) {
    if ($tex_id > 0 && in_array($tex_id, $valid_tex_ids)) {
        $selected_tex = $tex_id;
    } else {
        $selected_tex = $valid_tex_ids[array_rand($valid_tex_ids)];
    }
    // 使用 URL 安全的路径拼装
    $model_data['textures'] = array(
        $safe_model_url . '/textures/' . $selected_tex . '.png'
    );
}

// 5. 将骨架和动作文件加上 URL 安全的模型前缀
if (isset($model_data['model'])) {
    $model_data['model'] = $safe_model_url . '/' . ltrim($model_data['model'], '/');
}
if (isset($model_data['motions'])) {
    foreach ($model_data['motions'] as $key => $motions) {
        foreach ($motions as $index => $motion) {
            if (isset($motion['file'])) {
                $model_data['motions'][$key][$index]['file'] = $safe_model_url . '/' . ltrim($motion['file'], '/');
            }
        }
    }
}

// 6. 输出 JSON
echo json_encode($model_data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
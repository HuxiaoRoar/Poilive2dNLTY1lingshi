<?php
defined('ABSPATH') or exit;

/**
 * 专属微服务：带记忆的 Live2D 动作自动修复引擎
 * (纯文本无损注入版，绝不污染原 JSON 的浮点精度)
 */
function poilive2d_optimize_model_motions($model_dir, $model_name) {
    //delete_option('poilive2d_motion_optimization_cache'); // 开发调试时可用，清除缓存以重新优化
    $cache = get_option('poilive2d_motion_optimization_cache', array());

    if (isset($cache[$model_name])) {
        return;
    }

    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($model_dir));
    $motionFiles = array();
    foreach ($iterator as $file) {
        if ($file->isFile() && strtolower($file->getExtension()) === 'json' && strpos($file->getFilename(), '.motion3.json') !== false) {
            $motionFiles[] = $file->getPathname();
        }
    }

    foreach ($motionFiles as $filePath) {
        $jsonContent = file_get_contents($filePath);
        $motionJson = json_decode($jsonContent, true);

        // 如果 JSON 格式不正确，或已经有 Fade 参数，直接跳过
        if (!is_array($motionJson) || !isset($motionJson['Meta']) || isset($motionJson['Meta']['FadeInTime'])) {
            continue;
        }

        $duration = isset($motionJson['Meta']['Duration']) ? (float)$motionJson['Meta']['Duration'] : 1.0;
        $minFadeIn = $duration;
        $minFadeOut = $duration;

        // 计算逻辑保持不变
        if (!empty($motionJson['Curves'])) {
            foreach ($motionJson['Curves'] as $curve) {
                if (empty($curve['Segments']) || count($curve['Segments']) < 5) continue;
                
                $segs = $curve['Segments'];
                $times = [$segs[0]];
                $i = 2;
                
                while ($i < count($segs)) {
                    $curveType = $segs[$i];
                    if ($curveType == 1) { 
                        if (isset($segs[$i + 5])) $times[] = $segs[$i + 5];
                        $i += 7;
                    } else { 
                        if (isset($segs[$i + 1])) $times[] = $segs[$i + 1];
                        $i += 3;
                    }
                }
                
                if (count($times) >= 2) {
                    $firstDuration = $times[1] - $times[0];
                    $lastDuration = end($times) - $times[count($times) - 2];
                    
                    if ($firstDuration > 0 && $firstDuration < $minFadeIn) $minFadeIn = $firstDuration;
                    if ($lastDuration > 0 && $lastDuration < $minFadeOut) $minFadeOut = $lastDuration;
                }
            }
            
            $minFadeIn = max(0.01, min($minFadeIn, 0.5));
            $minFadeOut = max(0.01, min($minFadeOut, 0.5));
        } else {
            $minFadeIn = 0.3;
            $minFadeOut = 0.3;
        }
        
        $finalFadeIn = round($minFadeIn, 3);
        $finalFadeOut = round($minFadeOut, 3);

        if (($finalFadeIn + $finalFadeOut) > $duration) {            
            $finalFadeIn = min($finalFadeIn, $duration);                       
            $finalFadeOut = max(0.01, $duration - $finalFadeIn);            
            $finalFadeIn = round($finalFadeIn, 3);
            $finalFadeOut = round($finalFadeOut, 3);
        }



        // ==========================================
        // 核心改动：正则表达式纯文本微创注入
        // ==========================================
        if (is_writable($filePath)) {
            // 匹配 "Meta": { 这行文本，并在它的下一行直接插入我们算好的文本
            $injectionText = "$1\n\t\t\"FadeInTime\": {$finalFadeIn},\n\t\t\"FadeOutTime\": {$finalFadeOut},";
            
            // 仅对 "Meta": { 进行一次替换，绝不触碰文件里的其他内容
            $newJsonContent = preg_replace('/("Meta"\s*:\s*\{)/i', $injectionText, $jsonContent, 1);
            
            file_put_contents($filePath, $newJsonContent);
        } else {
            // 容错备份写入数据库
            $fallbackCache = get_option('poilive2d_motion_fades_fallback', []);
            $fallbackCache[basename($filePath)] = [
                'in' => $finalFadeIn,
                'out' => $finalFadeOut
            ];
            update_option('poilive2d_motion_fades_fallback', $fallbackCache);
        }
    }

    $cache[$model_name] = time(); 
    update_option('poilive2d_motion_optimization_cache', $cache);
}
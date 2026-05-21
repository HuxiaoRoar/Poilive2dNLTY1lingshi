function InitPoi(){
    // 这里的 model 可以先固定为 天依（中文完全没问题了）
    // var currentModel = "天依"; 
    // 使用 encodeURIComponent 编码中文，防止 URL 报错
    // var apiUrl = poilive2d_api_url + "?model=" + encodeURIComponent(currentModel);

    var apiUrl = poilive2d_api_url + "?model=" + encodeURIComponent(currentModel) + "&tex=" + currentTexId;   
    
    loadlive2d('live2d', apiUrl, showConsoleTips("加载"));
}

function showConsoleTips(content){
    var style_green = "font-family:'微软雅黑';font-size:1em;background-color:#34a853;color:#fff;padding:4px;";
    var style_green_light = "font-family:'微软雅黑';font-size:1em;background-color:#42d268;color:#fff;padding:4px;";
    console.log("%cPoiLive2d%cPoi模型" + content + "完成", style_green, style_green_light);$("#live2d").animate({opacity:'1'},100);
}
setTimeout("InitPoi()",500);
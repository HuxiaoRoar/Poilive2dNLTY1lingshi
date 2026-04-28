<?php
defined('ABSPATH') or exit;

// 1. 接收保存操作（先放个占位，后面我们再写保存逻辑）
if (isset($_POST['update_pluginoptions']) && $_POST['update_pluginoptions'] == 'true') {
    echo '<div id="message" class="updated"><h4>设置已成功保存</h4></div>';
}

// 2. 获取当前激活的标签页，默认为 'basic'
$active_tab = isset($_GET['tab']) ? $_GET['tab'] : 'basic';
?>

<div class="wrap">
    <h2>PoiLive2D（新·洛天依） 控制面板</h2>
    
    <h2 class="nav-tab-wrapper">
        <a href="?page=poilive2d&tab=basic" class="nav-tab <?php echo $active_tab == 'basic' ? 'nav-tab-active' : ''; ?>">基础设置</a>
        <a href="?page=poilive2d&tab=style" class="nav-tab <?php echo $active_tab == 'style' ? 'nav-tab-active' : ''; ?>">样式设置</a>
        <a href="?page=poilive2d&tab=advanced" class="nav-tab <?php echo $active_tab == 'advanced' ? 'nav-tab-active' : ''; ?>">高级设置</a>
    </h2>

    <form method="POST" action="">
        <input type="hidden" name="update_pluginoptions" value="true" />
        
        <?php
        // 根据当前选中的 Tab，显示不同的内容区块
        if ($active_tab == 'basic') {

            ?>
            <table class="form-table" role="presentation">
                <tbody>

                    <tr>
                        <td colspan="2" style="padding-top: 30px; padding-bottom: 0;">
                            <h4 style="font-size: 1.2em; font-weight: 600; margin: 0; border-bottom: 1px solid #ddd; padding-bottom: 8px;">按钮开关设置：</h4>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">所有按钮</th>
                        <td>
                            <fieldset>
                                <label><input type="radio" name="demo_radio" value="1" checked> 显示</label><br>
                                <label><input type="radio" name="demo_radio" value="0"> 隐藏</label>
                            </fieldset>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">按钮排列</th>
                        <td>
                            <fieldset>
                                <label><input type="radio" name="demo_radio" value="1" checked> 单列</label><br>
                                <label><input type="radio" name="demo_radio" value="0"> 双列</label>
                            </fieldset>
                        </td>
                    </tr>                    

                    <tr>
                        <th scope="row">“隐藏”按钮</th>
                        <td>
                            <fieldset>
                                <label><input type="radio" name="demo_radio" value="1" checked> 显示</label><br>
                                <label><input type="radio" name="demo_radio" value="0"> 隐藏</label>
                            </fieldset>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">“Sing”按钮</th>
                        <td>
                            <fieldset>
                                <label><input type="radio" name="demo_radio" value="1" checked> 显示</label><br>
                                <label><input type="radio" name="demo_radio" value="0"> 隐藏</label>
                            </fieldset>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">“变身”按钮（切换模型）</th>
                        <td>
                            <fieldset>
                                <label><input type="radio" name="demo_radio" value="1" checked> 显示</label><br>
                                <label><input type="radio" name="demo_radio" value="0"> 隐藏</label>
                            </fieldset>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">“变装”按钮（切换材质）</th>
                        <td>
                            <fieldset>
                                <label><input type="radio" name="demo_radio" value="1" checked> 显示</label><br>
                                <label><input type="radio" name="demo_radio" value="0"> 隐藏</label>
                            </fieldset>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">“目录”按钮</th>
                        <td>
                            <fieldset>
                                <label><input type="radio" name="demo_radio" value="1" checked> 显示</label><br>
                                <label><input type="radio" name="demo_radio" value="0"> 隐藏</label>
                            </fieldset>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">“一言”按钮</th>
                        <td>
                            <fieldset>
                                <label><input type="radio" name="demo_radio" value="1" checked> 显示</label><br>
                                <label><input type="radio" name="demo_radio" value="0"> 隐藏</label>
                            </fieldset>
                        </td>
                    </tr>

                    <tr>
                        <td colspan="2" style="padding-top: 30px; padding-bottom: 0;">
                            <h4 style="font-size: 1.2em; font-weight: 600; margin: 0; border-bottom: 1px solid #ddd; padding-bottom: 8px;">其他设置：</h4>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">复制内容提示</th>
                        <td>
                            <fieldset>
                                <label><input type="radio" name="demo_radio" value="1" checked> 显示</label><br>
                                <label><input type="radio" name="demo_radio" value="0"> 隐藏</label>
                            </fieldset>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">进入页面欢迎词</th>
                        <td>
                            <fieldset>
                                <label><input type="radio" name="demo_radio" value="1" checked> 显示</label><br>
                                <label><input type="radio" name="demo_radio" value="0"> 隐藏</label>
                            </fieldset>
                        </td>
                    </tr>
                </tbody>
            </table>
            <?php
            
        } elseif ($active_tab == 'style') {
            
            ?>

            <table class="form-table" role="presentation">
                <tbody>
                    
                    <tr>
                        <td colspan="2" style="padding-top: 30px; padding-bottom: 0;">
                            <h4 style="font-size: 1.2em; font-weight: 600; margin: 0; border-bottom: 1px solid #ddd; padding-bottom: 8px;">角色设置：</h4>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">记录模型选择</th>
                        <td>
                            <fieldset>
                                <label><input type="radio" name="demo_radio" value="1" checked> 是（下次进入，模型不变）</label><br>
                                <label><input type="radio" name="demo_radio" value="0"> 否（下次进入，模型切换）</label>
                            </fieldset>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="demo_select">模型切换方式</label></th>
                        <td>
                            <select name="demo_select" id="demo_select">
                                <option value="jinrishici">随机</option>
                                <option value="hitokoto">顺序</option>
                            </select>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="demo_select">材质切换方式</label></th>
                        <td>
                            <select name="demo_select" id="demo_select">
                                <option value="jinrishici">随机</option>
                                <option value="hitokoto">顺序</option>
                            </select>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="demo_number">角色大小</label></th>
                        <td>
                            <input name="demo_number" type="number" id="demo_number"  class="small-text" step="1" min="0"> <span>x</span> <input name="demo_number" type="number" id="demo_number"  class="small-text" step="1" min="0"><span>PX</span>
                            <p class="description">宽度 x 高度</p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="demo_number">小于指定宽度隐藏角色</label></th>
                        <td>
                            <input name="demo_number" type="number" id="demo_number"  class="small-text" step="1" min="0"> <span>PX</span> 
                            <p class="description">设置为 0 时，角色常驻，不隐藏</p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="demo_select">角色贴边选择</label></th>
                        <td>
                            <select name="demo_select" id="demo_select">
                                <option value="jinrishici">靠左</option>
                                <option value="hitokoto">靠右</option>
                            </select>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="demo_range">角色页面边距(px)</label></th>
                        <td>
                            <input type="range" name="demo_range" id="demo_range" value="0" min="0" max="100" style="vertical-align: middle;">
                            <span style="vertical-align: middle;">0</span>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="demo_select">拖拽方式</label></th>
                        <td>
                            <select name="demo_select" id="demo_select">
                                <option value="jinrishici">禁用</option>
                                <option value="hitokoto">仅水平拖拽</option>
                                <option value="hitokoto">自由拖拽</option>
                            </select>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="demo_select">松开鼠标后</label></th>
                        <td>
                            <select name="demo_select" id="demo_select">
                                <option value="jinrishici">还原位置</option>
                                <option value="hitokoto">保持位置</option>
                            </select>
                        </td>
                    </tr>

                    <tr>
                        <td colspan="2" style="padding-top: 30px; padding-bottom: 0;">
                            <h4 style="font-size: 1.2em; font-weight: 600; margin: 0; border-bottom: 1px solid #ddd; padding-bottom: 8px;">按钮样式设置：</h4>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="demo_number">按钮大小(px)</label></th>
                        <td>
                            <input name="demo_number" type="number" id="demo_number"  class="small-text" step="1" min="0"> <span>PX</span> 
                            
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="demo_number">按钮行高(px)</label></th>
                        <td>
                            <input name="demo_number" type="number" id="demo_number"  class="small-text" step="1" min="0"> <span>PX</span> 
                            
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="demo_number">按钮距顶部边距(px)</label></th>
                        <td>
                            <input name="demo_number" type="number" id="demo_number"  class="small-text" step="1" min="0"> <span>PX</span> 
                            <p class="description">数字越大越靠下</p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="demo_color">按钮颜色</label></th>
                        <td>
                            <input type="text" name="demo_color" id="demo_color" value="rgba(236, 217, 188, 0.5)" class="color-picker" data-alpha-enabled="true">
                            
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="demo_color">按钮悬浮颜色</label></th>
                        <td>
                            <input type="text" name="demo_color" id="demo_color" value="rgba(236, 217, 188, 0.5)" class="color-picker" data-alpha-enabled="true">
                            <p class="description">支持透明度调节的颜色选择器。</p>
                        </td>
                    </tr>

                    <tr>
                        <td colspan="2" style="padding-top: 30px; padding-bottom: 0;">
                            <h4 style="font-size: 1.2em; font-weight: 600; margin: 0; border-bottom: 1px solid #ddd; padding-bottom: 8px;">气泡样式设置：</h4>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="demo_number">气泡大小</label></th>
                        <td>
                            <input name="demo_number" type="number" id="demo_number"  class="small-text" step="1" min="0"> <span>x</span> <input name="demo_number" type="number" id="demo_number"  class="small-text" step="1" min="0"><span>PX</span>
                            <p class="description">宽度 x 高度</p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="demo_number">气泡字号(px)</label></th>
                        <td>
                            <input name="demo_number" type="number" id="demo_number"  class="small-text" step="1" min="0"> <span>PX</span>                             
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="demo_number">气泡距顶部边距(px)</label></th>
                        <td>
                            <input name="demo_number" type="number" id="demo_number"  class="small-text" step="1" min="0"> <span>PX</span> 
                            <p class="description">数字越大越靠上</p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="demo_color">背景色</label></th>
                        <td>
                            <input type="text" name="demo_color" id="demo_color" value="rgba(236, 217, 188, 0.5)" class="color-picker" data-alpha-enabled="true">
                            
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="demo_color">边框颜色</label></th>
                        <td>
                            <input type="text" name="demo_color" id="demo_color" value="rgba(236, 217, 188, 0.5)" class="color-picker" data-alpha-enabled="true">
                            
                        </td>
                    </tr>


                    <tr>
                        <th scope="row"><label for="demo_color">阴影颜色</label></th>
                        <td>
                            <input type="text" name="demo_color" id="demo_color" value="rgba(236, 217, 188, 0.5)" class="color-picker" data-alpha-enabled="true">
                            
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="demo_color">文字颜色</label></th>
                        <td>
                            <input type="text" name="demo_color" id="demo_color" value="rgba(236, 217, 188, 0.5)" class="color-picker" data-alpha-enabled="true">
                            
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="demo_color">高亮文字颜色</label></th>
                        <td>
                            <input type="text" name="demo_color" id="demo_color" value="rgba(236, 217, 188, 0.5)" class="color-picker" data-alpha-enabled="true">
                            
                        </td>
                    </tr>                

                </tbody>
            </table>
            <?php
            
        } elseif ($active_tab == 'advanced') {
            
            ?>
            <table class="form-table" role="presentation">
                <tbody>

                    <tr>
                        <td colspan="2" style="padding-top: 30px; padding-bottom: 0;">
                            <h4 style="font-size: 1.2em; font-weight: 600; margin: 0; border-bottom: 1px solid #ddd; padding-bottom: 8px;">一言设置：</h4>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="demo_number">启用一言</label></th>
                        <td>
                            <input name="demo_number" type="number" id="demo_number"  class="small-text" step="1" min="0"> <span>秒</span> 
                            <p class="description">一言延迟时间。如果设置为0，则禁用一言。</p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row"><label for="demo_select">一言 API</label></th>
                        <td>
                            <select name="demo_select" id="demo_select">
                                <option value="jinrishici">jinrishici.com</option>
                                <option value="hitokoto">v1.hitokoto.cn</option>
                                 <option value="fghrsh">fghrsh.net</option>
                                <option value="local">本地一言</option>
                            </select>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">一言API的消息</th>
                        <td>
                            <fieldset>
                                <p style="display: flex; align-items: center; margin-bottom: 8px;">
                                    <code style="display: inline-block; width: 160px; background: #f0f0f1; padding: 4px 8px; border-radius: 3px; margin-right: 10px;">lwl12.com</code>
                                    <input type="text" class="regular-text" style="width: 400px;" name="demo_fixed_1" value="这句一言来自 <span style={highlight}>『{source}』</span>|，是 <span style={highlight}>{creator}</span> 投稿的。">
                                </p>
                                
                                <p style="display: flex; align-items: center; margin-bottom: 8px;">
                                    <code style="display: inline-block; width: 160px; background: #f0f0f1; padding: 4px 8px; border-radius: 3px; margin-right: 10px;">fghrsh.net</code>
                                    <input type="text" class="regular-text" style="width: 400px;" name="demo_fixed_2" value="来看看站长写的小作文 《{text}》 吧！">
                                </p>
                                
                                <p style="display: flex; align-items: center; margin-bottom: 8px;">
                                    <code style="display: inline-block; width: 160px; background: #f0f0f1; padding: 4px 8px; border-radius: 3px; margin-right: 10px;">jinrishici.com</code>
                                    <input type="text" class="regular-text" style="width: 400px;" name="demo_fixed_3" value="希望你能找到心仪的东西！">
                                </p>
                            </fieldset>
                            <p class="description">请务必不要修改{}中的内容，lwl12.com接口会有没有作者的情况语句中需要用“|”进行分割</p>
                        </td>
                    </tr>


                    <tr>
                        <td colspan="2" style="padding-top: 30px; padding-bottom: 0;">
                            <h4 style="font-size: 1.2em; font-weight: 600; margin: 0; border-bottom: 1px solid #ddd; padding-bottom: 8px;">进站欢迎设置：</h4>
                        </td>
                    </tr>


                    <tr>
                        <th scope="row">每小时提示</th>
                        <td>
                            <fieldset>
                                <p style="display: flex; align-items: center; margin-bottom: 8px;">
                                    <code style="display: inline-block; width: 160px; background: #f0f0f1; padding: 4px 8px; border-radius: 3px; margin-right: 10px;">t5-7</code>
                                    <input type="text" class="regular-text" style="width: 400px;" name="demo_fixed_1" value="这句一言来自 <span style={highlight}>『{source}』</span>|，是 <span style={highlight}>{creator}</span> 投稿的。">
                                </p>
                                
                                <p style="display: flex; align-items: center; margin-bottom: 8px;">
                                    <code style="display: inline-block; width: 160px; background: #f0f0f1; padding: 4px 8px; border-radius: 3px; margin-right: 10px;">t7-11</code>
                                    <input type="text" class="regular-text" style="width: 400px;" name="demo_fixed_2" value="来看看站长写的小作文 《{text}》 吧！">
                                </p>
                                
                                <p style="display: flex; align-items: center; margin-bottom: 8px;">
                                    <code style="display: inline-block; width: 160px; background: #f0f0f1; padding: 4px 8px; border-radius: 3px; margin-right: 10px;">t11-15</code>
                                    <input type="text" class="regular-text" style="width: 400px;" name="demo_fixed_3" value="希望你能找到心仪的东西！">
                                </p>
                            </fieldset>
                            <p class="description">时间按照t{开始小时}-{结束小时}的方式填写，例如：t5-7或t7-11（避免改错，目前此项无法更改）</p>
                        </td>
                    </tr>


                    <tr>
                        <th scope="row">搜索引擎入站提示</th>
                        <td>
                            <fieldset>
                                <p style="display: flex; align-items: center; margin-bottom: 8px;">
                                    <code style="display: inline-block; width: 160px; background: #f0f0f1; padding: 4px 8px; border-radius: 3px; margin-right: 10px;">baidu</code>
                                    <input type="text" class="regular-text" style="width: 400px;" name="demo_fixed_1" value="Hello! 来自 百度搜索 的朋友<br>你是搜索 <span style={highlight}>{keyword}</span> 找到的我吗？">
                                </p>
                                
                                <p style="display: flex; align-items: center; margin-bottom: 8px;">
                                    <code style="display: inline-block; width: 160px; background: #f0f0f1; padding: 4px 8px; border-radius: 3px; margin-right: 10px;">bing</code>
                                    <input type="text" class="regular-text" style="width: 400px;" name="demo_fixed_2" value="Hello! 来自 必应搜索 的朋友<br>欢迎阅读<span style={highlight}>『{title}』</span>">
                                </p>
                                
                                <p style="display: flex; align-items: center; margin-bottom: 8px;">
                                    <code style="display: inline-block; width: 160px; background: #f0f0f1; padding: 4px 8px; border-radius: 3px; margin-right: 10px;">google</code>
                                    <input type="text" class="regular-text" style="width: 400px;" name="demo_fixed_3" value="Hello! 来自 谷歌搜索 的朋友<br>欢迎阅读<span style={highlight}>『{title}』</span>">
                                </p>
                            </fieldset>
                            <p class="description">请务必不要修改{}中的内容，{title}网站标题、{keyword}关键词、{website}站点名称</p>
                        </td>
                    </tr>


                    
                    <tr>
                        <th scope="row">访问本站点的提示</th>
                        <td>
                            <div id="custom_hover_msg_container">
                                
                                <p class="hover-msg-row" style="display: flex; align-items: center; margin-bottom: 10px;">
                                    <input type="text" class="regular-text" style="width: 160px; margin-right: 10px;" name="demo_dynamic[0][selector]" value="example.com" placeholder="CSS 选择器">
                                    <input type="text" class="regular-text" style="width: 400px; margin-right: 10px;" name="demo_dynamic[0][text]" value="示例" placeholder="提示文本">
                                    <button type="button" class="button">删除</button>
                                </p>

                                <p class="hover-msg-row" style="display: flex; align-items: center; margin-bottom: 10px;">
                                    <input type="text" class="regular-text" style="width: 160px; margin-right: 10px;" name="demo_dynamic[1][selector]" value="www.luotianyi.blue" placeholder="CSS 选择器">
                                    <input type="text" class="regular-text" style="width: 400px; margin-right: 10px;" name="demo_dynamic[1][text]" value="人海相遇，是个奇迹。" placeholder="提示文本">
                                    <button type="button" class="button">删除</button>
                                </p>
                                
                            </div>

                            <p>
                                <button type="button" class="button button-primary">+ 增加一条</button>
                            </p>
                            <p class="description">使用 jQuery 选择器指定触发元素，右侧填写提示内容。支持使用 <code>{text}</code> 获取目标文本。</p>
                        </td>
                    </tr>


                    <tr>
                        <th scope="row">节日提示</th>
                        <td>
                            <div id="custom_hover_msg_container">
                                
                                <p class="hover-msg-row" style="display: flex; align-items: center; margin-bottom: 10px;">
                                    <input type="text" class="regular-text" style="width: 160px; margin-right: 10px;" name="demo_dynamic[0][selector]" value="01-01" placeholder="CSS 选择器">
                                    <input type="text" class="regular-text" style="width: 400px; margin-right: 10px;" name="demo_dynamic[0][text]" value="元旦" placeholder="提示文本">
                                    <button type="button" class="button">删除</button>
                                </p>

                                <p class="hover-msg-row" style="display: flex; align-items: center; margin-bottom: 10px;">
                                    <input type="text" class="regular-text" style="width: 160px; margin-right: 10px;" name="demo_dynamic[1][selector]" value="05-01" placeholder="CSS 选择器">
                                    <input type="text" class="regular-text" style="width: 400px; margin-right: 10px;" name="demo_dynamic[1][text]" value="劳动节" placeholder="提示文本">
                                    <button type="button" class="button">删除</button>
                                </p>
                                
                            </div>

                            <p>
                                <button type="button" class="button button-primary">+ 增加一条</button>
                            </p>
                            <p class="description">使用 jQuery 选择器指定触发元素，右侧填写提示内容。支持使用 <code>{text}</code> 获取目标文本。</p>
                        </td>
                    </tr>



                    <tr>
                        <td colspan="2" style="padding-top: 30px; padding-bottom: 0;">
                            <h4 style="font-size: 1.2em; font-weight: 600; margin: 0; border-bottom: 1px solid #ddd; padding-bottom: 8px;">鼠标交互设置：</h4>
                        </td>
                    </tr>



                    <tr>
                        <th scope="row">自定义鼠标悬停提示</th>
                        <td>
                            <div id="custom_hover_msg_container">
                                
                                <p class="hover-msg-row" style="display: flex; align-items: center; margin-bottom: 10px;">
                                    <input type="text" class="regular-text" style="width: 160px; margin-right: 10px;" name="demo_dynamic[0][selector]" value="#video-add" placeholder="CSS 选择器">
                                    <input type="text" class="regular-text" style="width: 400px; margin-right: 10px;" name="demo_dynamic[0][text]" value="想换台嘛？" placeholder="提示文本">
                                    <button type="button" class="button">删除</button>
                                </p>

                                <p class="hover-msg-row" style="display: flex; align-items: center; margin-bottom: 10px;">
                                    <input type="text" class="regular-text" style="width: 160px; margin-right: 10px;" name="demo_dynamic[1][selector]" value="#sing-button" placeholder="CSS 选择器">
                                    <input type="text" class="regular-text" style="width: 400px; margin-right: 10px;" name="demo_dynamic[1][text]" value="准备唱歌咯！" placeholder="提示文本">
                                    <button type="button" class="button">删除</button>
                                </p>
                                
                            </div>

                            <p>
                                <button type="button" class="button button-primary">+ 增加一条</button>
                            </p>
                            <p class="description">使用 jQuery 选择器指定触发元素，右侧填写提示内容。支持使用 <code>{text}</code> 获取目标文本。</p>
                        </td>
                    </tr>


                    <tr>
                        <th scope="row"><label for="demo_number">鼠标点击选择器</label></th>
                        <td>
                            <input name="demo_number" type="text" id="demo_number"  class="small-text" value=".waifu #live2d"> 
                            
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">鼠标点击时的消息提示</th>
                           <td>
                            <p>
                                <input type="text" class="regular-text" value="是…是不小心碰到了吧">
                                <button type="button" class="button">-</button>
                            </p>
                            <p>
                                <button type="button" class="button">+ 点击此处增加一条</button>
                            </p>
                            <p class="description">点击角色会循环以上的每一行点击事件</p>
                        </td>
                    </tr>


                    <tr>
                        <th scope="row">复制信息时的提示</th>
                           <td>
                            <p>
                                <input type="text" class="regular-text" value="你都复制了些什么呀，转载要记得加上出处哦！">
                                <button type="button" class="button">-</button>
                            </p>
                            <p>
                                <button type="button" class="button">+ 点击此处增加一条</button>
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <th scope="row">隐藏角色的提示</th>
                           <td>
                            <p>
                                <input type="text" class="regular-text" value="我们还能再见面的吧…？">
                                <button type="button" class="button">-</button>
                            </p>
                            <p>
                                <button type="button" class="button">+ 点击此处增加一条</button>
                            </p>
                        </td>
                    </tr>




                </tbody>
            </table>
            <?php
        }
        
        // WordPress 自带的保存按钮
        submit_button('保存设置');
        ?>
    </form>
</div>
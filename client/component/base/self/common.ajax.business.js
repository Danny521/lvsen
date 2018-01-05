/**
 * ajax请求的全局配置
 * Created by Zhangyu on 2015/7/28.
 */
define(["jquery"], function(jQuery) {
    //全局ajax get请求清除缓存
    jQuery.ajaxSetup({
        cache: false,
        data: {
            "_": new Date().getTime()
        }
    });
});

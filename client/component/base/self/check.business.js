/**
 * 全局的判断逻辑
 * Created by Zhangyu on 2015/7/28.
 */
define(["jquery"], function(jQuery) {
    "use strict";
    /**
     * 使用环境中的单双屏信息获取，用来进行单双屏判断
     */
    jQuery(function() {
        //过滤非指挥调度、视频监控情况
        if (!(location.href.indexOf("/module/inspect/dispatch/") !== -1 || location.href.indexOf("/module/inspect/monitor/") !== -1)) {
            return;
        }
        var css = "position: absolute;left:-100px;top:-100px;width: 1px;height: 1px;";
        var html = ['<object id="Independent_UIOCX" class="UIOCX" type="applicatin/x-firebreath" width = "1" height = "1" style="' + css + '">',
            '<param name="onload" value="pluginLoaded"/></object>'
        ].join("");
        var $ocxObject = jQuery("object[type='applicatin/x-firebreath']");
        //如果没有，则新增ocx控件到文档中
        if ($ocxObject.length === 0) {
            jQuery(document.body).append(html);
        }
        //获取当前屏幕个数
        var playerDom = $ocxObject[0];
        window.JudgeExpand = function() {
            var esinfo = playerDom.getExpandScreenInfo();
            esinfo = JSON.parse(esinfo);
            return esinfo.Item.length;
        }
    });
    /**
     * 判断当前浏览器是否是ie及chrome30及以下版本，如果是，则返回true，此时不在弹出关闭信息窗。
     * add by hzc on 2015/6/8
     * @returns {boolean}
     * @constructor
     */
    var JudgeChromeX = function() {
        var version = 0;
        var userAgent = navigator.userAgent.toLowerCase();
        userAgent.replace(/chrome\/(\d+)\.(.*?)/gi, function ($0, $1) {
            version = $1 - 0;
        });
        return (version <= 30);
    };
    /**
     * 判断是否是IE
     * @returns {boolean}
     */
    var isIE = function() {
        return (!!window.ActiveXObject || "ActiveXObject" in window);
    };

    /**
     * 定义初始化入口
     * @type {{init: Function, initGlobal: Function}}
     */
    return {
        init: function () {
            return {
                isIE: isIE,
                JudgeChromeX: JudgeChromeX
            };
        },
        initGlobal: function () {
            (function () {
                this.isIE = isIE;
                this.JudgeChromeX = JudgeChromeX;
            }).call(window);
        }
    };
});
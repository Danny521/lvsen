/**
 * 公共页面逻辑
 * Created by Zhangyu on 2015/7/28.
 */
define(["broadcast", "jquery", "/component/base/self/toolkit.js", "localStorage"], function(broadcast, jQuery, toolkit, localStorage) {
    /**
     * 加载占位符相关js
     */
    jQuery("body").append('<script type="text/javascript" src="/libs/jquery/jquery.placeholder.js"></script>');

    /**
     * 页面加载完成后，初始化消息中心的相关逻辑
     */
    jQuery(function() {
        //解决兼容性问题【会导致ie6+chrome插件，录像面板报错】
         require(['localStorage'], function(localStorage) {
            var loginUser = localStorage.getItem("loginFlag");
            if (!loginUser) {
                return;
            }
        });

        if (location.href.match(/\%7B/gi)) {
            return;
        }
        if (location.href.indexOf("monitor/screen.html") === -1) {
           /* require(["Message"], function(Message) {
                window.message = new Message();
            });*/
        }

        toolkit.initGlobal();
        getIframeUserInfo();
        dealBrowserForwardBack();
        /**
         * [getUserInfo 获取用户信息]
         * @author songxj
         * @return {[type]} [用户标签]
         */
        function getIframeUserInfo() {
            var user = JSON.parse(window.localStorage.getItem("userInfo")) || {},
                orgID = (user && user.orgID) ? user.orgID : "null";

            // 如果orgID是null 则为超级管理员(超管不参与业务方面的东西) 默认本系统第一个组织 id为 1
            if (!$("#userEntry").length) {
                $("body").append('<a id="userEntry" style="display:none;"></a>');
            }

            var $userEntry = $("#userEntry");
            $userEntry.attr("data-userid", user.id);
            $userEntry.attr("data-loginname", user.loginName);
            $userEntry.attr("data-truename", user.name);
            $userEntry.attr("data-score", user.score);
            $userEntry.append(user.name);
        }
        /**
         * [dealBrowserForwardBack 处理浏览器的前进后退]
         * @author songxj
         */
        function dealBrowserForwardBack() {
            // 获取一二级导航和iframe的src
            var href = window.location.href,
                filterUrlArray = [
                    "/module/iframe/",
                    "/module/index/index.html",
                    "/module/viewlibs/workbench/local_import.html",
                    "/module/viewlibs/caselib/inc/tpl_createImage.html",
                    "/module/viewlibs/caselib/inc/tpl_createVideo.html"
                ];

            href = href.substring(href.indexOf("/module"));
            for (var i in filterUrlArray) {
                if(filterUrlArray.hasOwnProperty(i)) {
                    if (href === filterUrlArray[i]) {
                        return;
                    }
                }
            }

            var currentUrl = href.substring(1).split("/");
            if (href.indexOf("usercenter/") !== -1) { // 用户中心
                currentUrl[1] = "usercenter";
                currentUrl[2] = " ";
            }
            var paramsObj = Toolkit.paramOfUrl(href);
            // 通知父级iframe
            informParentWindowEvent({
                currentURL: href,
                firstNav: currentUrl[1], //一级导航
                secondNav: paramsObj.pagetype || currentUrl[2] //二级导航
            });
        }
        /**
         * [informParentWindowEvent 通知父窗口事件]
         * @param  {[type]} data [传给父窗口的数据，包括一二级导航和iframe的src]
         * @author songxj
         */
        function informParentWindowEvent(data) {
            top.sessionStorage.setItem("currentModule", data.currentURL);
            broadcast.emit("dealBrowserForwardBack", {"firstNav": data.firstNav, "secondNav": data.secondNav});
        }

    });
    /**
     * 动态注册ocx的相关逻辑
     */
    jQuery(function() {
        var enable = jQuery(document.body).attr("injectocx");
        if (enable == "true") {
            var css = "position:absolute;left:-1000px;width:1px;height:1px;";
            var html = [
                '<object id="injectocx" class="injectocx" type="applicatin/x-firebreath" width = "1" height = "1" style="' + css + '">',
                '<param name="onload" value="pluginLoaded"/>',
                '</object>'
            ].join("");
            jQuery(document.body).append(html);
            window.setTimeout(function() {
                var playerDom = jQuery("object[class='injectocx'][type='applicatin/x-firebreath']")[0];
                try {
                    playerDom.SetLayout(1);
                } catch(e){}
                window.injectocx = playerDom;
            }, 500);
        }
    });
});

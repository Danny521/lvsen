/**
 * 系统登出的逻辑控制
 * Created by Zhangyu on 2015/7/28.
 */
define(["jquery"], function(jQuery) {
    // 登录控制  登录页、插件下载页面 放开控制  by chencheng on 2015-2-4  解决IE11最新报错的问题
    jQuery(function() {
        if (window.localStorage && (!window.localStorage.getItem("loginFlag"))) {
            var path = window.location.pathname;
            //云台控制等cs窗口不做跳转
            if (path.match(/\/ptzctrl\/index\.html/gi)) {
                return
            }
            if (path.match(/\/history\/index\.html/gi)) {
                return
            }
            if (path.match(/\/effect\/index\.html/gi)) {
                return
            }
            if (path !== "/login/" && path !== "/product.html") {
                // songxj update
                top.location.href = "/login/";
            }
        }
    });

    // session 超时
    jQuery(document).ajaxComplete(function(event, xhr, settings) {
        if (xhr && xhr.getResponseHeader("Session-Status") === "Session-Out") {
            if (window.location.pathname.indexOf('/login') === -1) {
                //以防止登录页面重复载入
                var path = window.location.pathname;
                //云台控制等cs窗口不做跳转
                if (path.match(/\/ptzctrl\/index\.html/gi)) {
                    return;
                }
                if (path.match(/\/history\/index\.html/gi)) {
                    return;
                }
                if (path.match(/\/effect\/index\.html/gi)) {
                    return;
                }
                // songxj update
                top.location.href = "/login/";
            }
        }
    });

    //用户登出操作 (首页的登出单独处理)  by chencheng on 2015-1-26
    jQuery(document).on("click", "#navigator .wrapper .menu a#userLogout, div.index_welcome a.logout", function() {
        jQuery.ajax({
            url: "/service/logout",
            type: "get",
            sync: false,
            dataType: "json",
            success: function(res) {
                if (res.code === 200) {
                    window.localStorage.clear();
                    top.location.href = "/login/";
                } else {
                    notify.error(res.data.message);
                }
            }
        });
        return false;
    });
});
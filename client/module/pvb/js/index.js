/**
 * @description [加载视图库管理页面]
 * @author [songxuejie@netposa.com]
 * @data [2016/04/25]
 */
define(["jquery"], function(jQuery) {
    return (function(jQuery, scope) {
        /**
         * 获取视图库页面的url
         */
        var _getPvbUrl = function() {
                var menuList = window.localStorage.getItem("MenuList"), //从localStorage中获取一级导航
                    modules = [],
                    url;

                if (!menuList) {
                    return "";
                }

                menuList = JSON.parse(menuList);
                modules = menuList.data.modules;
                // 遍历所有模块，找到视图库模块的url
                $.each(modules, function(index, item) {
                    if (item.moduleName === "pvb" && item.childModule.length) {
                        url = item.childModule[0].url;
                    }
                });

                return url;
            },
            /**
             *设置iframe的地址
             */
            _setPvbUrl = function(url) {
                //设置iframe的地址
                $("#pvb-iframe").attr("src", url);
            };

        scope.init = function() {
            var path = window.location.href,
                pvbUrl = _getPvbUrl(),
                params;

            if (path.indexOf("?") !== -1) { // 跳转到视图库的其他页面 /module/pvb/index.html#/workbench/entry?videoId=
                params = path.split("#/")[1];
                pvbUrl = pvbUrl + params;
            } else { // 默认跳转到首页 /module/pvb/
                pvbUrl = pvbUrl + "home?frompvb";
            }

            _setPvbUrl(pvbUrl); //设置iframe的地址
        };
        return scope;
    }($, {}));
});

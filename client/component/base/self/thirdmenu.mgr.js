/**
 * pva第三层导航相关逻辑
 * Created by Zhangyu on 2015/7/28.
 */
define(["jquery"], function(jQuery) {
    /**
     * 设置第三层导航
     * @method setThirdMenu
     * @description 用后端返回的所有菜单的权限来过滤并分离三级菜单的数据，并存储于 ThirdModule 的 localStorage 中。
     */
    var setThirdMenu = function(data) {
        var modules = data.data.modules,
            tmp = [];
        jQuery.each(modules, function(index, value) {
            var childModule = value.childModule;
            if (!childModule) {
                return;
            }
            jQuery.each(childModule, function(index, val) {
                var thirdModule = val.childModule;
                if (!thirdModule) {
                    return;
                }
                jQuery.each(thirdModule, function(index, v) {
                    if (v) {
                        tmp.push(v);
                    }
                    window.localStorage.setItem('ThirdModule', JSON.stringify(tmp));
                });
            });
        });
    };
    /**
     * 获取第三层导航
     * @method getThirdMenu
     * @description 获取 存储于 ThirdModule 的 localStorage 中的数据，返回对象形式。
     */
    var _getThirdMenu = function() {
        var modules = window.localStorage.getItem('ThirdModule');
        var x = JSON.parse(modules);
        return x;
    };
    /**
     * 更新第三层导航
     * @method updateThirdNav
     * @description 用后端返回的三级菜单的权限来控制三级菜单的显隐。
     */
    var updateThirdNav = function() {
        var modules = _getThirdMenu(),
            $stat = jQuery("#stat"),
            tabs;
        if (modules) {
            jQuery("#major").hide();
            jQuery(".tab-header,.header").hide();
            tabs = $stat.length <= 0 ? jQuery("#aside .tabs") : $stat;
            tabs.find("li").hide();
        } else {
            return false;
        }
        jQuery.each(modules, function(index, val) {
            tabs.find("li." + val.moduleName).show();
        });
        for (var i = 0; i < modules.length; i++) {
            var module = tabs.find("li." + modules[i].moduleName);
            if (module.length > 0) {
                jQuery("#major").show();
                // 目前组织树顶级显示的是当前上级，如果click事件 会提示权限不足，先不显示提示
                if (notify.el) {
                    notify.el.style.visibility = "hidden";
                }
                window.setTimeout(function() {
                    if (notify.el) {
                        notify.el.style.visibility = "visible";
                    }
                }, 4500);
                jQuery(".tab-header,.header").show();
                return;
            }
        }
    };
    /**
     * 定义初始化入口
     * @type {{init: Function, initGlobal: Function}}
     */
    return {
        init: function () {
            return {
                setThirdMenu: setThirdMenu,
                updateThirdNav: updateThirdNav
            };
        },
        initGlobal: function () {
            (function () {
                this.setThirdMenu = setThirdMenu;
                this.updateThirdNav = updateThirdNav;
            }).call(window);
        }
    };
});
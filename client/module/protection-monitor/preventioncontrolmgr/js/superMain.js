define([
	"/component/base/self/portal.links.js",
	"/component/base/self/notify.js"
], function(portalLinks, Notify) {
	jQuery(function() {
		portalLinks.initGlobal();
		//初始化pva系统消息提示相关逻辑
		Notify.initGlobal();
		var contentMgr = {
			/**
		     * 获取第三层导航
		     * @method getThirdMenu
		     * @description 获取 存储于 ThirdModule 的 localStorage 中的数据，返回对象形式。
		     */
		    getThirdMenu: function() {
		        return JSON.parse(window.localStorage.getItem('ThirdModule'));
		    },
		    /**
		     * 更新第三层导航
		     * @method updateThirdNav
		     * @description 用后端返回的三级菜单的权限来控制三级菜单的显隐。
		     */
		    updateThirdNav: function() {
		        var self = this,
		        	modules = self.getThirdMenu(),
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
		        modules.each(function(val) {
		            tabs.find("li." + val.moduleName).show();
		        });

		        //  by chencheng on 2015-4-3  同步数据的权限直接挂在了系统配置下，在业务管理下的同步计划设置3级模块菜单无法显示
		        var validFunctionList = JSON.parse(window.localStorage.getItem("validFunctionList")).data.validFunctionResourceList;
		        for (var j = validFunctionList.length - 1; j >= 0; j--) {
		            // 拥有同步数据的权限 那么业务管理 显示同步计划3级模块  152 :数据同步权限
		            if (validFunctionList[j].id === 152) {
		                tabs.find("li.sync").show();
		                break;
		            }
		        }

		        for (var i = 0; i < modules.length; i++) {
		            var module = tabs.find("li." + modules[i].moduleName);
		            if (module.length > 0) {
		                jQuery("#major").show();
		                //解决三级菜单在门户连接的跳转问题，此处默认click事件需要根据门户连接的hash值进行动态调整，modify by zhangyu 2015.09.11
		                window.PortalLinks(function(){
		                    self.initContent(module);
		                });

		                jQuery(".tab-header,.header").show();

		                return;
		            }
		        }
		    },
		    /**
		     * [initContent 加载页面内容]
		     * @param  {[type]} el [三级导航选择器]
		     * @return {[type]}    [description]
		     */
		    initContent: function(el) {
		    	var panel = el.closest(".tab-panel");
				// 三联动
				el.addClass("active").siblings().removeClass("active");
				//左侧头修改
				panel.children(".tab-header").children("div[data-hview=" + el.attr("data-tab") + "]").addClass("active").siblings().removeClass("active");
				//左侧内容修改
				panel.children(".tab-content").children("div[data-view=" + el.attr("data-tab") + "]").addClass("active").siblings().removeClass("active");
				//内容切换
				jQuery("#major").children("." + el.attr("data-tab")).addClass("active").siblings().removeClass("active");
		    	if (el.attr("data-tab") === "people-control") {
		    		require(["js/superPeopleControl.js"]);
		    		return;
		    	}
		    }
		};

		contentMgr.updateThirdNav();
	});
});
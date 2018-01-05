define([
	"/component/base/self/portal.links.js",
	"/component/base/self/system.init.config.js",
	"/component/base/self/common.business.js",
	"jquery"
], function(portalLinks, SystemConfig) {
	jQuery(function() {
		//初始化系统部署配置全局函数
		SystemConfig.initGlobal();
		portalLinks.initGlobal();
		var contentMgr = {
			/**
			 * [initContent 初始化页面内容]
			 * @param  {[type]} $menuLi [三级导航选择器]
			 * @return {[type]}         [description]
			 */
			initContent: function($menuLi) {
				var panel = $menuLi.closest(".tab-panel");
				// 四联动
				//1、左侧按钮
				$menuLi.addClass("active").siblings().removeClass("active");
				//2、上面的title
				panel.children(".tab-header").children("div[data-hview=" + $menuLi.attr("data-tab") + "]").addClass("active").siblings().removeClass("active");
				//3、左侧内容切换
				panel.children(".tab-content").children("div[data-view=" + $menuLi.attr("data-tab") + "]").addClass("active").siblings().removeClass("active");
				//4、major里面的内容切换（主要内容）
				jQuery("#major").children("div[data-view=" + $menuLi.attr("data-tab") + "]").addClass("active").siblings().removeClass("active");
				//触发点击事件（改变#major里面的数据）
				this.tabClick($menuLi);
			},
			/**
			 * lw
			 * tab对应的点击事件(更改major页面的内容)
			 * 点击tab后具体的执行事件
			 **/
			tabClick: function(el) {
				var self = this;
				var panel = el.closest(".tab-panel");
				
				if (el.attr("data-tab") === "history-alarm") { //历史报警查询
					self.initHistoryPage();
					// 加载页面数据，包括组织树，右侧报警数据
					require(["js/superHistory.js"]);
				} else if (el.attr("data-tab") === "statistic-analysis") { //统计分析
					self.initStatisticPage();
					// 加载页面数据，包括组织树，右侧报警数据
					require(["js/superStatistic.js"]);
				} 
			},
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
		     * [getCurDateTime 获取当前日期时间]
		     * @return {[type]} [description]
		     */
			getCurDateTime: function() {
				var date = new Date();
				return date.getFullYear() + '-' + this.formatLenth(date.getMonth() + 1) + '-' + this.formatLenth(date.getDate()) + ' ' + this.formatLenth(date.getHours()) + ':' + this.formatLenth(date.getMinutes()) + ':' + this.formatLenth(date.getSeconds());
			},
			/**
			 * [getCurDate 获取当前时间]
			 * @return {[type]} [description]
			 */
			getCurDate: function() {
				var date = new Date();
				return date.getFullYear() + '-' + this.formatLenth(date.getMonth() + 1) + '-' + this.formatLenth(date.getDate())
			},
			/**
			 * [formatLenth 格式化数字]
			 * @param  {[type]} x   [要格式化的数字]
			 * @param  {[type]} len [转化后的长度]
			 * @return {[type]}     [格式化后的结果]
			 */
			formatLenth: function(x, len) {
				x = '' + x;
				len = len || 2;
				while (x.length < len) {
					x = '0' + x;
				}
				return x;
			},
			/**
			 * [initHistoryPage 初始化历史报警页面]
			 * @return {[type]} [description]
			 */
			initHistoryPage: function() {
				var startTime = this.getCurDate() + " 00:00:00",
					endTime  = this.getCurDateTime();
				var offleft = parseInt(jQuery("#countDetial").css("right"));
				jQuery("#major").css("right",'0');
				jQuery("#countDetial").show(0);
				jQuery("#historySearch")
					.find(".begin-time.input-time").val(startTime)
					.end()
					.find(".end-time.input-time").val(endTime);
			},
			/**
			 * [initStatisticPage 初始化统计分析页面]
			 * @return {[type]} [description]
			 */
			initStatisticPage: function() {
				var startTime = this.getCurDate() + " 00:00:00",
					endTime  = this.getCurDateTime();

				jQuery("#major").css("right","0");
				jQuery("#countDetial").hide(0);
				jQuery("#statisticAnalysis")
					.find(".begin-time.input-time").val(startTime)
					.end()
					.find(".end-time.input-time").val(endTime);
			}
		};
	    
	    // 显示三级导航
		contentMgr.updateThirdNav();
	});
});
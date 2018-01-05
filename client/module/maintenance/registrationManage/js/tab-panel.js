define([
	'js/global-varibale',
	'pubsub',
	'js/view/monitorSystem-view',
	'js/view/point-view',
	'js/view/camera-view',
	'js/registrationManage-org-tree',
	'jquery.watch',
	'base.self'
], function(globalVar,PubSub,monitorSystemView,pointView,cameraView,orgTree) {
	/**
	 *  tab 面板
	 **/
	var TabPanel = new Class({

		Implements: [Events, Options],

		options: {
			//监控系统
			MonitorSystem: null,
			//点位控制
			PointCtr: null,
			//摄像机控制
			CameraCtr: null,
			//默认监控系统激活
			active: "monitor-system"
		},

		initialize: function(options) {
			var self = this;
			self.setOptions(options);
			self.bindTabEvent();
			// monitorSystemView.init(this.options.MonitorSystem);
			pointView.init(this.options.PointCtr);
			cameraView.init(this.options.CameraCtr);
			jQuery("#aside").find(".tab-content").hide(0);
			
			globalVar.managerUnitName = "";
			if (jQuery("#aside .tabs li.cameraControl").is(":visible")) {
				return self.createOrgTree();
			}

		},
		//创建组织树
		createOrgTree: function() {
			var self = this;
			// 构建左侧组织结构树
			if (globalVar.orgTree) {
				globalVar.orgTree.options.leafClick = self.orgTreeItemClick.bind(self);
				globalVar.orgTree.options.treeClick = self.orgTreeItemClick.bind(self);
			} else {
				globalVar.orgTree = new orgTree.registrationManageOrgtree({
					node: "#aside .tab-content .registree",
					scrollbarNode: "#aside .tab-content .statScrollbarPanel",
					"rootUrl": "/service/org/get_root_org?"+ window.sysConfig.getOrgMode(), //获取根组织
					"searchUrl": "/service/org/get_child_orgs_by_name",
					"leafClick": self.orgTreeItemClick.bind(self),
					"treeClick": self.orgTreeItemClick.bind(self),
					"orgId": jQuery("#userEntry").attr("data-orgid")
				});
			}
			//搜索(每0.2s去监听输入框中的内容)
			jQuery("#registSearchInput").watch({
				wait: 200,
				captureLength: 0,
				callback: function(key) {
					globalVar.orgTree.search({
						queryKey: key
					});
				}
			});
			//搜索，以解决firefox下汉字输入不能自动查询的问题
			jQuery("#registSearchInput").off("click").on("click", function() {
				var value = jQuery("#registSearchInput").val();
				//触发查询
				globalVar.orgTree.search({
					queryKey: value
				});
			});
		},
		/*
		 *	组织树点击事件
		 *	@el:当前li元素
		 */
		orgTreeItemClick: function(el) {
			var li = el.closest("li"),
			isEnter = jQuery(".midleCtrPart").find(".tabinner.active").data("loadtype") === "entered" ? 1 : 0,
			serachData = {
				"isControl":""
			};
			globalVar.managerUnitName = li.data("name");
			serachData = cameraView.getSearchData();
			serachData.managerUnitName = globalVar.managerUnitName;
			this.options.CameraCtr.getSearchPlatformList(serachData);
		},
		/*
		 *	tab 点击事件
		 */
		bindTabEvent: function() {
			var self = this;
			var opt = self.options;
			//tab事件绑定
			jQuery(".tab-panel  .tabs li").on("click", function() {
				var el = jQuery(this);
				var panel = el.closest(".tab-panel");
				// 三联动
				el.addClass("active").siblings().removeClass("active");
				//左侧头修改
				panel.children(".tab-header").children("div[data-hview=" + el.attr("data-tab") + "]").addClass("active").siblings().removeClass("active");
				//3、左侧内容切换
				panel.children(".tab-content").children("div[data-view=" + el.attr("data-tab") + "]").addClass("active").siblings().removeClass("active");
				//内容切换
				jQuery("#major").children("." + el.attr("data-tab")).addClass("active").siblings().removeClass("active");
			
				self.tabClick(el, opt);

			});
			//触发第一个Tab的点击事件
			jQuery(".tab-panel.tabs li").first().click();
		},
		/**
		 * tab对应的点击事件
		 **/
		tabClick: function(el, opt) {
			var isEnter = null;
			if (el.attr("data-tab") === "monitor-system" && opt.active !== "monitor-system") { //布防管理
				opt.active = "monitor-system";
				jQuery("#major").css("left","50px");
				jQuery("#aside").find(".tab-content").hide(0);
			} else if (el.attr("data-tab") === "point-control" && opt.active !== "point-control") { //布控管理
				opt.active = "point-control";
				jQuery("#aside").find(".tab-content").hide(0);
				jQuery("#major").css("left","50px");
				isEnter = jQuery(".point-control .judge-enter-library").find("li.current").data("loadtype") === "entered" ? 1 : 0;
				this.options.PointCtr.loadYNEnterList(isEnter);
			} else if (el.attr("data-tab") === "camera-control" && opt.active !== "camera-control") { //人员布控库
				opt.active = "camera-control";
				jQuery("#mainContent").removeClass('hidden');
				jQuery("#doNewEditPanel,#showDetail").addClass('hidden');
				jQuery("#aside .tab-header").find(".camera-control span").show(0);
				isEnter = jQuery(".camera-control .midleCtrPart").find(".tabinner.active").data("loadtype") === "entered" ? 1 : 0;
				this.options.CameraCtr.getSearchPlatformList({
				 	"enterPlatformStatus":isEnter,
				 	"isControl":""
				});
				jQuery("#major").css("left","280px");
				jQuery("#aside").find(".tab-content").show(0);
			}

		}

	});
	return {
		TabPanel: TabPanel
	};
});
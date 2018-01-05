define([
	'js/view/people-control-view',
	'js/view/taskNumSet',
	'js/local-import',
	'js/preventcontrol-global-var',
	'js/preventcontrol-org-tree',
	'js/view/control-mgr-view',
	'js/controller/control-mgr-map-controller',
	'pubsub',
	'base.self',
], function(peopleControlView,taskSets,localImport,globalVar,orgTree,controlMgrView,mapController,PubSub) {
	/**
	 *  tab 面板
	 **/
	var TabPanel = new Class({

		Implements: [Events, Options],

		options: {
			//布防管理
			DefenceMgr: null,
			//布控管理
			ControlMgr: null,
			//人员布控
			PeopleControl: null,
			//默认人员布控激活
			active: "people-control"
		},

		initialize: function(options) {
			var self = this;
			self.setOptions(options);
			//self.createOrgTree();
			self.createTaskOrgTree();
			self.bindTabEvent();
		},
		createOrgTree: function() {
			var self = this;
			// 构建左侧组织结构树
			globalVar.orgTree = self.options.orgTree = new orgTree.preventControlOrgTree({
				//add by zhangyu,2014-11-3,权限添加
				"templateUrl": "/module/settings/devicemgr/inc/DefenseTree.html",
				"orgId": jQuery("#userEntry").attr("data-orgid"),
				
				//by chencheng  组织树会自动展开到当前组织   2014-11-3,权限添加
				callback: function(el) {
					if (el.closest("li").hasClass("root")) {
						el.closest("li").children("i.fold").click();
						self.treeItemClick(el);
					}
				}
			});
			//搜索
			jQuery("#searchInput").watch({
				wait: 200,
				captureLength: 0,
				callback: function(key) {
					self.options.orgTree.search({
						queryKey: key
					});
					return false;
				}
			});
			//搜索按钮的点击事件-解决firefox下汉字输入不查询的问题
			jQuery("#searchBtn").off("click").on("click", function() {
				var value = jQuery("#searchInput").val();
				//触发查询
				self.options.orgTree.search({
					queryKey: value
				});
			});
		},
		createTaskOrgTree: function() {
			var self = this;
			// 构建左侧组织结构树
			globalVar.taskOrgTree  = new orgTree.preventControlOrgTree({
				//add by zhangyu,2014-11-3,权限添加
				"templateUrl": "/module/protection-monitor/preventioncontrolmgr/inc/taskSetNumPanel.html",
				"orgId": jQuery("#userEntry").attr("data-orgid"),
				//by chencheng  组织树会自动展开到当前组织   2014-11-3,权限添加
				callback: function(el) {
					if (el.closest("li").hasClass("root")) {
						el.closest("li").children("i.fold").click();
					}
				}
			});
			
		},
		/*
		 *	tab 点击事件
		 */
		bindTabEvent: function() {
			var self = this;
			var opt = self.options;
			//tab事件绑定
			jQuery(".tab-panel  .tabs li").bind("click", function() {
				var el = jQuery(this);
				var panel = el.closest(".tab-panel");
				// 三联动
				el.addClass("active").siblings().removeClass("active");
				//左侧头修改
				panel.children(".tab-header").children("div[data-hview=" + el.attr("data-tab") + "]").addClass("active").siblings().removeClass("active");
				//左侧内容修改
				panel.children(".tab-content").children("div[data-view=" + el.attr("data-tab") + "]").addClass("active").siblings().removeClass("active");
				//内容切换
				jQuery("#major").children("." + el.attr("data-tab")).addClass("active").siblings().removeClass("active");
				if (globalVar.curDepartment.id) {
					self.tabClick(el, opt);
				} else {
					/**
					 * 如果是超级管理员的，则发请求获取根节点，否则 使用树的自动展开功能设置面包屑数据
					 * @author chencheng
					 * @date 2014-11-3
					 */
					if (jQuery("#userEntry").attr("data-orgid") === "null") {
						//首次设置面包屑参数
						jQuery.getJSON("/service/org/get_root_org?isOrgUser=isOrgUser&source=defence", function(tem) {
							//设置当前部门信息
							//资源树的id都为org_开始，为了保持一致，做成统一的id。不管是面包屑，还会当前组织，都在统一请求的时候做处理，防止混乱。
							globalVar.curDepartment = {
								id: "org_" + tem.data.org.id,
								name: tem.data.org.name,
								parentId: tem.data.org.parentId,
								department_id: tem.data.org.orgCode,
								department_level: tem.data.org.level,
								description: tem.data.org.description,
								expire: tem.data.org.dueDate,
								max_cameras: tem.data.org.maxCameraNumber,
								max_tasks: tem.data.org.maxDefenceTaskNumber,
								cur_cameras: tem.data.org.currentCameraCount,
								cur_tasks: tem.data.org.currentDefenceTaskCount
							};
							//设置面包屑数据
							globalVar.steps = [{
								id: "org_" + tem.data.org.id,
								name: tem.data.org.name
							}];
							PubSub.publish("getCamerasByOrgId",globalVar.curDepartment.id.substring(4));
							self.tabClick(el, opt);
						});
					}
				}
			});
			//触发第一个Tab的点击事件
			//jQuery(".tab-panel  .tabs li").first().click();
		},
		/* 权限判断 */
		hasPermission: function(orgId) {
			// 超级管理员
			if (jQuery("#userEntry").attr("data-orgid") === "null") {
				return true;
			}
			return globalVar.orgTree.hasAccessPower(orgId);
		},
		/**
		 * tab对应的点击事件
		 **/
		tabClick: function(el, opt) {
			var self  = this;
			if (el.attr("data-tab") === "defence-task" && opt.active !== "defence-task") { //布防管理
				opt.active = "defence-task";
				//清除上传插件
				localImport.UploadFile.destroy();
				//切换右侧内容,关闭视频播放区域
				controlMgrView.closeRuleVideoPanel();
			} else if (el.attr("data-tab") === "control-task" && opt.active !== "control-task") { //布控管理
				opt.active = "control-task";
				//初始化地图
				if (!globalVar.map) {
					//this.options.ControlMgr.initMap();
					mapController.initMap();
				}
				//设置中间高度
				controlMgrView.setMidBottomHeight();
				//加载人员布控任务列表
				var param = {
					pageNum: 1,
					pageSize: globalVar.configInfo.controlTaskPageSize
				};
				//去掉高级查询
				jQuery(".mid-top-panel").find(".search-list").show();
				jQuery(".mid-top-panel").find(".people-search-content").hide();
				//切换中间部分内容
				jQuery(".mid-top-panel").children(".control-task-list-head").addClass("active").siblings().removeClass("active");
				jQuery(".mid-bottom-panel").children(".control-task-people-list").addClass("active").siblings().removeClass("active");
				//清空面包屑
				jQuery("#major").find(".control-task .breadcrumb .section").html("&nbsp;");
				//调用布控任务列表
				this.options.ControlMgr.loadPeopleControlList("",param);
				//切换右侧内容,关闭视频播放区域
				controlMgrView.closeRuleVideoPanel();
				//移除地图上的摄像机
				if (globalVar.cameraLayer) {
					globalVar.cameraLayer.removeAllOverlays();
				}
				//清除上传插件
				localImport.UploadFile.destroy();
			} else if (el.attr("data-tab") === "people-control" && opt.active !== "people-control") { //人员布控库
				opt.active = "people-control";
				//设置中间高度
				peopleControlView.setMidHeight();
				jQuery(".tab-content").show();
				jQuery("#sidebar").css("width","280px");
				jQuery("#sideResize").show();
				jQuery("#major").css("left","280px");
				//加载人员布控库列表
				var param = {
					libName: "",
					pageNum: "", //1,
					pageSize: "" //globalVar.configInfo.peopleLibPageSize
				};
				//隐藏新增内容
				jQuery(".mid-top-panel").find(".create-people-lib-table").removeClass("active");
				//调用人员库列表
				this.options.PeopleControl.getPeopleLibraryList(param);
				//切换右侧内容,关闭视频播放区域
				controlMgrView.closeRuleVideoPanel();
			}else if(el.attr("data-tab") === "taskNum-set" && opt.active !== "taskNum-set"){
				opt.active = "taskNum-set";
				taskSets.init();
			}
		},
		/*
		 *	面包屑导航[收集数据]
		 */
		step: function(element) {
			var position = [];
			(function(el) {
				position.push({
					"name": el.attr("data-name"),
					"id": el.attr("data-id")
				});
				if (el.closest("ul").closest("li").attr("data-id")) {
					arguments.callee(el.closest("ul").closest("li"));
				}
			})(element);
			return position.reverse();
		},
		/*
		 *	组织树点击事件
		 *	@el:当前li元素
		 */
		treeItemClick: function(el) {
			var self = this;
			var li = el.closest("li");

			// 获取面包屑数据
			globalVar.steps = this.step(li);
			var opt = this.options;

			// 给当前元素赋予新的值
			globalVar.curDepartment = {
				id: li.attr("data-id"),
				name: li.attr("data-name"),
				parentId: li.attr("data-parentid"),
				department_id: li.attr("data-departid"),
				department_level: li.attr("data-level"),
				description: li.attr("data-des"),
				expire: li.attr("data-exp"),
				max_cameras: li.attr("data-maxcameras"),
				max_tasks: li.attr("data-maxtasks"),
				cur_cameras: li.attr("data-cur-cameras"),
				cur_tasks: li.attr("data-cur-tasks")
			};
			// 更新布防管理数据
			PubSub.publish("getCamerasByOrgId",globalVar.curDepartment.id.substring(4));
		},

		leafItemClick: function(el) {
			notify.warn("不能点击摄像机查看布防任务！");
			return false;
		}
	});
	return {
		TabPanel: TabPanel
	}
});
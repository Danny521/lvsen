/**
 * tab切换模块
 * @author chengyao
 * @date   2014-12-08 
 */
define([
	'pubsub',
	'./alarmanalysis-global-var',
	'./alarmanalysis-camera-tree', 
	'./alarmanalysis-org-tree',
	'jquery.watch',
	'base.self'],
	function(PubSub,globalVar, cameraTree, orgTree){
	var TabPanel = function(){
		//历史报警对象
		this.historyAlarm = null;
		//统计分析对象
		this.statisticAnalysis = null;
	};
	TabPanel.prototype = {
		initialize: function(history,statistic) {
			var self = this;
			self.historyAlarm = history;
			self.statisticAnalysis = statistic;
			self.bindTabEvent();
			if (jQuery("#aside .tabs li.alarmhistory").is(":visible")) {
				return self.createCameraTree();
			}

			if (jQuery("#aside .tabs li.alarmhistoryanalysis").is(":visible")) {
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
				globalVar.orgTree = new orgTree.alarmAnalysisOrgTree({
					node: "#aside .tab-content .statTree",
					scrollbarNode: "#aside .tab-content .statScrollbarPanel",
					"rootUrl": "/service/org/get_root_org?"+ window.sysConfig.getOrgMode(), //获取根组织
					"searchUrl": "/service/org/get_child_orgs_by_name",
					"leafClick": self.orgTreeItemClick.bind(self),
					"treeClick": self.orgTreeItemClick.bind(self),
					"orgId": jQuery("#userEntry").attr("data-orgid")
				});
			}
			//搜索(每0.2s去监听输入框中的内容)
			jQuery("#statSearchInput").watch({
				wait: 200,
				captureLength: 0,
				callback: function(key) {
					globalVar.orgTree.search({
						queryKey: key
					});
				}
			});
			//搜索，以解决firefox下汉字输入不能自动查询的问题
			jQuery("#statSearchBtn").off("click").on("click", function() {
				var value = jQuery("#statSearchInput").val();
				//触发查询
				globalVar.orgTree.search({
					queryKey: value
				});
			});
		},
		//创建组织机构下摄像机树
		createCameraTree: function() {
			var self = this;
			if (globalVar.cameraTree) {
				globalVar.cameraTree.options.leafClick = self.historytreeItemClick.bind(self);
				globalVar.cameraTree.options.treeClick = self.historytreeItemClick.bind(self);
			} else {
				globalVar.cameraTree = new cameraTree.alarmAnalysisCameraTree({
					node: "#aside .tab-content .hisTree",
					scrollbarNode: "#aside .tab-content .hisScrollbarPanel",
					"orgId": jQuery("#userEntry").attr("data-orgid"),
					"leafClick": self.historytreeItemClick.bind(self),
					"treeClick": self.historytreeItemClick.bind(self)
				});
			}
			//搜索
			jQuery("#hisSearchInput").watch({
				wait: 200,
				captureLength: 0,
				callback: function(key) {
					globalVar.cameraTree.search({
						queryKey: key
					});
				}
			});
			//搜索，以解决firefox下汉字输入不能自动查询的问题
			jQuery("#hisSearchBtn").off("click").on("click", function() {
				var value = jQuery("#hisSearchInput").val();
				//触发查询
				globalVar.cameraTree.search({
					queryKey: value
				});
			});
		},
		/*
		 *	lw
		 *	tab 点击事件
		 *	绑定点击左侧tab事件
		 */
		bindTabEvent: function() {
			var self = this;
			jQuery(".tab-panel  .tabs li").bind("click", function() {
				var el = jQuery(this);
				var panel = el.closest(".tab-panel");
				// 四联动
				//1、左侧按钮
				el.addClass("active").siblings().removeClass("active");
				//2、上面的title
				panel.children(".tab-header").children("div[data-hview=" + el.attr("data-tab") + "]").addClass("active").siblings().removeClass("active");
				//3、左侧内容切换
				panel.children(".tab-content").children("div[data-view=" + el.attr("data-tab") + "]").addClass("active").siblings().removeClass("active");
				//4、major里面的内容切换（主要内容）
				jQuery("#major").children("div[data-view=" + el.attr("data-tab") + "]").addClass("active").siblings().removeClass("active");
				//触发点击事件（改变#major里面的数据）
				self.tabClick(el);
			});
			//触发第一个Tab的点击事件
			//jQuery(".tab-panel  .tabs li").first().click();
		},
		/**
		 * lw
		 * tab对应的点击事件(更改major页面的内容)
		 * 点击tab后具体的执行事件
		 **/
		tabClick: function(el, opt) {
			var self = this;
			self.historyAlarm.hideVideoFrame(); //若有播放面板，隐藏之
			var panel = el.closest(".tab-panel");
			var endTime = Toolkit.getCurDateTime();
			jQuery(".end-time.input-time").val(endTime);
			if (el.attr("data-tab") === "history-alarm") { //历史报警查询
				//如果摄像树不存在则创建树
				if (!globalVar.cameraTree) {
					self.createCameraTree();
				} else if (!globalVar.cameraTree.leafClick) {
					globalVar.cameraTree.options.leafClick = self.historytreeItemClick.bind(self);
					globalVar.cameraTree.options.treeClick = self.historytreeItemClick.bind(self);
				}
				jQuery("#major").css("right","0px");
				jQuery("#countDetial").show(0);
				//显示主要内容部分
			} else if (el.attr("data-tab") === "statistic-analysis") { //统计分析
				//如果组织树不存在则创建树
				if (!globalVar.orgTree) {
					self.createOrgTree();
				} else if (!globalVar.orgTree.leafClick) {
					globalVar.orgTree.leafClick = self.orgTreeItemClick.bind(self);
					globalVar.orgTree.treeClick = self.orgTreeItemClick.bind(self);
				}
				
				jQuery("#major").css("right","0px");
				jQuery("#countDetial").hide(0);
				var param = {
					orgid:globalVar.curDepartment.id
				};
				//修改非admin用户默认显示不是所有月份数据默认都是加载全部数据 update by leon.z 2016.04.26
				PubSub.publish("getCountDate",param);
				// //tab切换第一进来不让加载，因为树会自动加载数据，后面切换需要加载 by wangxiaojun 2014.12.22
				// if(globalVar.falg){
				// 	/**
				// 	* 如果是超级管理员的话，树不会触发自动展开的事件就不会自动加载数据，所以判断是否是超级管
				// 	* 理员来确定是否要加载数据
				// 	*/
				// 	if (jQuery("#userEntry").attr("data-orgid") === "null"||self.hasPermission(jQuery("#userEntry").attr("data-orgid"))) {
				// 		//填充表格内容部分
				// 		PubSub.publish("getCountDate",param);
				// 	}
				// 	globalVar.falg = false;
				// } else {
				// 	globalVar.falg = false;
				// 	//模仿点击搜索事件(按原有搜索条件刷新列表)
				// 	//jQuery("#statisticAnalysis .conditions a.countSearch").click();
				// }
			
				setTimeout(function() {
					//页面模拟窗口改变大小，触发resize事件，针对不同的分辨率以实现布局的自适应
					$(window).resize();
				}, 700);
			} 
		},
		/*
		 *	lw
		 *	面包屑导航[收集数据]
		 *	用于点击左侧树的时候同步面包屑上的数据
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
		// 历史案件面包屑获取数据
		/**
		 * 用于点击左侧树的时候同步面包屑上的数据
		 * lw
		 * @date   2014-11-07
		 * @param  {[type]}   element [当前点击的树的Li元素]
		 * @return {[type]}           [description]
		 */
		treeStep: function(element) {
			var position = [];
			(function(el) {
				//是组织
				if (el.attr("data-type") === "tree") {
					var id = "";
					var recursion = "";
					if (el.attr("data-id").substring(0, 4) === "vorg") {
						// id = el.attr("data-id").replace("vorg","org").substring(4);
						id = el.attr("data-id");
						recursion = "false";
					} else {
						// id =  el.attr("data-id").substring(4);
						id = el.attr("data-id");
						recursion = "true";
					}
					position.push({
						"name": el.attr("data-name"),
						"id": id,
						"type": "false",
						"recursion": recursion
					});
				} else {
					//摄像机
					position.push({
						"name": el.attr("data-name"),
						"id": el.attr("data-id"),
						"type": "true",
						"recursion": "false"
					});
				}
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
		orgTreeItemClick: function(el) {
			var li = el.closest("li");
			var opt = this.options;
			var temSteps = globalVar.steps;
			var temCurDepartment = globalVar.curDepartment;
			// 获取面包屑数据
			globalVar.steps = this.step(li);
			//更新curDepartment的值
			// 给当前元素赋予新的值
			globalVar.curDepartment = {
				id: li.attr("data-id"),
				name: li.attr("data-name"),
				department_id: li.attr("data-departid"),
				department_level: li.attr("data-level")
			};
			// 更新统计分析查询的数据
			if (this.hasPermission(li.attr("data-id"))) {
				if(!globalVar.firstLoad && jQuery("#userEntry").attr("data-orgid") !== "null"){
					globalVar.firstLoad  = true;
					return;
				}
				//模拟点击搜索事件
				jQuery("#statisticAnalysis .conditions a.countSearch").click();
				
			} else {
				globalVar.steps = temSteps;
				globalVar.curDepartment = temCurDepartment;
				notify.info("权限不足！");
			}
		},
		/*
		 *	摄像机树点击事件
		 *	@el:当前li元素
		 */
		historytreeItemClick: function(el) {
			var self = this;
			var li = el.closest("li");
			// 临时保存之前的数据  权限不足时还原
			var temSteps = globalVar.treeSteps;
			var temCurDepartment = globalVar.curTreeDepartment;
			// 获取面包屑数据
			globalVar.treeSteps = this.treeStep(li);
			var opt = this.options;
			var id = globalVar.curTreeDepartment.id;
			self.historyAlarm.hideVideoFrame(); //隐藏视频播放面板
			jQuery("#aside .tree-container").find("li.leaf span").removeClass("active");
			if (li.attr("data-type") === "tree") {
				var id = "";
				var recursion = "";
				if (li.attr("data-id").substring(0, 4) === "vorg") {
					id = li.attr("data-id").replace("vorg", "org").substring(4);
					recursion = "false";
				} else {
					id = li.attr("data-id").substring(4);
					recursion = "true";
				}
				globalVar.curTreeDepartment = {
					id: id,
					name: li.attr("data-name"),
					type: "false",
					recursion: recursion
				};
				name = globalVar.curTreeDepartment.name;
			} else {
				//摄像机
				jQuery(el).addClass("active");
				globalVar.curTreeDepartment = {
					id: li.attr("data-id"),
					name: li.attr("data-name"),
					type: "true",
					recursion: "false"
				};
				name = li.closest("li.tree").attr("data-name");
			}
			// 更新历史案件查询的数据
			if (li.attr("data-type") === "tree") {
				if (self.hasPermissionForCTree(li.attr("data-id"))) {
					//模拟点击搜索事件
					jQuery("#historySearch .conditions .hisSearch").click();
				} else {
					globalVar.treeSteps = temSteps;
					globalVar.curTreeDepartment = temCurDepartment;
					notify.info("权限不足！");
				}
			} else {
				//模拟点击搜索事件
				jQuery("#historySearch .conditions .hisSearch").click();
			}
		},
		/**
		 * [hasPermission 组织权限判断]
		 * @author Wang Xiaojun
		 * @date   2014-11-03
		 * @param  orgId [组织id]
		 */
		hasPermission: function(orgId) {
			// 超级管理员
			if (jQuery("#userEntry").attr("data-orgid") === "null") {
				return true;
			}
			return globalVar.orgTree.hasAccessPower(orgId);
		},
		/**
		 * [hasPermissionForCTree 摄像机树 权限判断]
		 * @author Wang Xiaojun
		 * @date   2014-11-03
		 * @param  orgId [组织id]
		 */
		hasPermissionForCTree: function(orgId) {
			// 超级管理员
			if (jQuery("#userEntry").attr("data-orgid") === "null") {
				return true;
			}
			// 组织id 包含 "org_"   虚拟组织id 包含 "vorg_"  
			var index = 0;
			if (orgId.indexOf("vorg") !== -1) {
				index = 5;
			} else if (orgId.indexOf("org") !== -1) {
				index = 4;
			}
			return globalVar.cameraTree.hasAccessPower(orgId.substring(index));
		}
	};
	return new TabPanel();
});
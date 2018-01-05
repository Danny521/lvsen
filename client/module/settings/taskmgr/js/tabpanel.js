/**
 * 
 * @authors chencheng (chencheng@netposa.com)
 * @date    2014-12-02 
 * @description  左侧tab切换
 */
define(['./config','settings/common/tool/org-tree',"base.self"], function(settings,OrgTree){
	var TabPanel = new Class({

		Implements: [Events, Options],

		options: {

			syncMgr: null,

			orgTree: null,

			active: "tvwall"
		},

		initialize: function(options) {
			var self = this;
			self.setOptions(options);
			self.bindTabEvent();
			self.createOrgTree();
		},
		/**
		 * 创建组织树，并绑定上边搜索的相关事件
		 * @author chencheng
		 * @date   2014-11-06
		 */
		createOrgTree: function() {
			var self = this;
			// 构建左侧组织结构树
			settings.orgTree = self.options.orgTree = new OrgTree({
				"searchUrl": "/service/org/get_child_orgs_by_name",
				// "leafClick": self.treeItemClick.bind(self),
				// "treeClick": self.treeItemClick.bind(self),
				"orgId":jQuery("#userEntry").attr("data-orgid")
			});

			jQuery("#searchInput").bind("keyup", function(event) {
				if (event.keyCode === 13) {
					jQuery("#searchBtn").click();
					return false;
				}

				if(jQuery(this).val().trim() === "" && self.options.orgTree.isEmpty()){
					jQuery("#searchBtn").click();
				}
			});

			//搜索按钮点击事件
			jQuery("#searchBtn").bind("click", function(event) {
				var key = jQuery("#searchInput").val().trim();
				self.options.orgTree.search({
					queryKey: key
				});
				return false;
			});
		},
		getActiveTab: function() {
			return this.options.active;
		},
		/*
		 *	tab 点击事件
		 */
		bindTabEvent: function() {
			var self = this;
			var opt = self.options;

			jQuery(".tab-panel  .tabs li").bind("click", function() {
				var el = jQuery(this);
				var panel = el.closest(".tab-panel");
			
				// 三联动
				el.addClass("active").siblings().removeClass("active");
				panel.children(".tab-header").children("div[data-hview=" + el.attr("data-tab") + "]").addClass("active").siblings().removeClass("active");
				// jQuery("#content>div.main[data-view=" + el.attr("data-tab") + "]").addClass("active").siblings(".main").removeClass("active");

				if (el.attr("data-tab") === "tvwall") {
					opt.active = "tvwall";
					jQuery("div[data-view='tvwall']").show().siblings().hide();
					jQuery("#majorTv").show().siblings(".main").hide();
					
				} else if (el.attr("data-tab") === "sync") {
					opt.active = "sync";
					jQuery("div[data-view='sync']").show().siblings().hide();
					opt.syncMgr.init();
				}
			});
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
		/**
		 * 权限判断 只能操作本组织及下属组织的资源
		 * @author chencheng
		 * @date   2014-11-06
		 * @param  {[type]}   orgId 当前组织id
		 * @return {Boolean}        
		 */
		hasPermission:function (orgId) {
			// 超级管理员
			if(jQuery("#userEntry").attr("data-orgid") === "null"){
				return true;
			}
			return settings.orgTree.hasAccessPower(orgId);
		},
		/*
		 *	组织树点击事件
		 *	@el:当前li元素
		 */
		treeItemClick: function(el) {
			// 暂不使用
			return;
			var self = this;
			var li = el.closest("li");
			var opt = this.options;

			
			// 临时保存之前的数据  权限不足时还原
			var temSteps = settings.steps;
			var temCurDepartment = settings.curDepartment;
			// 获取面包屑数据
			settings.steps = this.step(li);

			// 给当前元素赋予新的值
			settings.curDepartment = {
				id: li.attr("data-id"),
				name: li.attr("data-name"),
				parentId: li.attr("data-parentid"),
				department_id: li.attr("data-departid"),
				department_level: li.attr("data-level"),
				description: li.attr("data-des"),
				expire: li.attr("data-exp"),
				orgTreeLevel:li.attr("data-tree-level")
			};

			// 更新数据
			if (opt.active === "org") {
				if(self.hasPermission(li.attr("data-id"))){
					opt.organizeMgr.getDepartments(settings.curDepartment.id, false);
				}else{
					settings.steps = temSteps;
					settings.curDepartment = temCurDepartment;
					notify.info("权限不足！");
				}

			} else if (opt.active === "user") {
				if(self.hasPermission(li.attr("data-id"))){
					opt.userMgr.getUsers(settings.curDepartment.id, '');
				}else{
					settings.steps = temSteps;
					settings.curDepartment = temCurDepartment;
					notify.info("权限不足！");
				}
			} else if (opt.active === "role") {
				if(self.hasPermission(li.attr("data-id"))){
					opt.roleMgr.getRoles(settings.curDepartment.id, '');
				}else{
					settings.steps = temSteps;
					settings.curDepartment = temCurDepartment;
					notify.info("权限不足！");
				}
			} else if (opt.active === "structure") {
				opt.orgRelationMgr.getStructure(settings.curDepartment.id);
			}
		}
	});
	return TabPanel ;

});
define([
	'./alarmanalysis-org-tree',
	'./alarmanalysis-global-var',
], function(orgTree, globalVar) {
	var statisticMgr = {
		createOrgTree: function() {
			var self = this;
			// 构建左侧组织结构树
			globalVar.orgTree = new orgTree.alarmAnalysisOrgTree({
				node: "#aside .tab-content .statTree",
				scrollbarNode: "#aside .tab-content .statScrollbarPanel",
				"orgId": jQuery("#userEntry").attr("data-orgid"),
				"leafClick": self.orgTreeItemClick.bind(self),
				"treeClick": self.orgTreeItemClick.bind(self),
			});
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
				// 这里只显示面包屑
				var html = window.statisticTemplate({
					"countAnalysisBread":globalVar.steps
				});
				jQuery("#statisticAnalysis .breadcrumb").html(html);
			} else {
				globalVar.steps = temSteps;
				globalVar.curDepartment = temCurDepartment;
				notify.info("权限不足！");
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
		getTml: function(callback) {
			jQuery.get(globalVar.templateURL).done(function(temp) {
				callback(Handlebars.compile(temp));
			});
		}
	}

	statisticMgr.createOrgTree();
	statisticMgr.getTml(function(template) {
		window.statisticTemplate = template;
		require(['/module/protection-monitor/alarmanalysis/js/main.js']);
	});
});
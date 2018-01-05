/**
 * [手动选择组织模块]
 * @param  {[type]} model         [model模块]
 * @param  {[type]} orgFilterTree) [简化摄像机树]
 * @return {[type]}                   [description]
 */
define([
	"/module/common/org-filter/js/org-filter-model.js",
	"/module/settings/common/tool/org-tree.js",
	"/module/common/js/map-drag.js"
], function(model, orgFilterTree,DragItems) {
	function orgFilter() {
		var self = this;		
		// 手动选择摄像机面板模板
		self.orgFilterPanelTml = null;
		// 手动选择摄像机摄像机树
		self.orgTree = null;
		// 确定后的回调函数
		self.closePanel = jQuery.noop;
	}
	orgFilter.prototype = {
		constructor: orgFilter,
		illegalCharacter:/([?"*'\/\\<>:|？“”‘’^&~]|(?!\s)'\s+|\s+'(?!\s))/ig,
		videoPlayerSigle:null,
		lastLeft:false,
		/**
		 * [init 初始化函数]
		 * @param  {[type]} cameras [已经选择的摄像机列表]
		 * @return {[type]}         [description]
		 */
		init: function(hideCallBack,selectOrgInfo) {
			var self = this;
			self.oldOrgList = selectOrgInfo;
			hideCallBack && (self.closePanel = hideCallBack);
			self.initOrgPanelTml(function (err) {
				if (err) {
					return notify.warn("加载模板失败");
				}
				self.initOrgTree();
			});
		},
		/**
		 * [initOrgPanelTml 加载选择摄像机面板]
		 * @param  {Function} callback [回调函数]
		 * @return {[type]}            [description]
		 */
		initOrgPanelTml: function(callback) {
			var self = this;
			// 获取模板
			model.getTml("orgFilter")
			.then(function(temp) {
				// 获取成功后加载Handlebars模板
				self.orgFilterPanelTml = Handlebars.compile(temp);
				callback(null);
			}, function(err) {
				callback(err);
			});
		},
		/**
		 * [initOrgTree 初始化摄像机树]
		 * @return {[type]} [description]
		 */
		initOrgTree: function() {		
			var self = this,
			    title = "选择组织机构";
			//记录点击编辑后的摄像机id
			// 加载已经选择的摄像机
			var html = self.orgFilterPanelTml();												
			self.chooseCameraPanel = new CommonDialog({
				title: title,
				classes: "control-choose-camera-panel",
				width: "460px",
				isFixed:false,
				prehide:function(){}
			});
			$(".common-dialog.control-choose-camera-panel").css({
				height:"601px",
				top:"51px;",
				prehide:function(){}
			});
			self.chooseCameraPanel.getBody().html(html);
			//设置模态框可拖动，jquery-ui.js中的方法若，若出错检查该js是否加载
			jQuery(".common-dialog.control-choose-camera-panel").draggable();	
			var $result = jQuery(".choose-result .result");
			self.orgTree = new orgFilterTree({
				"node": ".control-choose-camera-panel .simple-camera-tree-panel", //树的容器
				"orgId": $("#userEntry").data("orgid"),         //当前用户的组织id
				"searchNode": ".control-choose-camera-panel .simple-camera-tree-search-input",  //树内容搜索框的选择器
				"searchUrl": "/service/org/get_child_orgs_by_name",
				"templateUrl": "/module/settings/common/tool/single-selected-tree.html",
				"checkBoxClick":function($node){
					var rootNode = jQuery(".simple-camera-tree-panel");
					self.singleChoose(rootNode,$node);
				},
				"selectable": true
			});
			//绑定拖动事件
			new DragItems("mygroup-camera-list", 2);
			// 绑定摄像机选择面板的事件
			self.bindchooseCameraPanelEvent();
			// 显示已选择的摄像机数量
		//	self.setSelectedCount();
		},
		/**
		 * [chooseOrg 摄像机树上选择组织时，触发该函数]
		 * @param  {[type]} $node [description]
		 * @return {[type]}       [description]
		 */
		chooseOrg: function($node) {
			debugger
			var self = this,
				current = $node;
				self.selectIds = [];
			var caller = arguments.callee;
		//	if(current.closest("li").is("li.tree")){
				if(! current.is(".selected")){
					current.closest("li").children("ul").children("li").children("i.checkbox").each(function(index,tem){
						debugger
						var child = jQuery(tem);
							if(child.hasClass("selected")){
								var orgInfo = {
									id: child.closest("li").data("id"),
									name: child.closest("li").data("name")
								};
                                self.selectIds.push(orgInfo);
							}
							caller(child);
					});
				}else{
					if(current.closest("li").children("i.checkbox").hasClass("selected")){
						self.selectIds.push(current.closest("li").data("id"));
					}
					// current.closest("li").children("ul").children("li").children("i.checkbox").each(function(index,tem){
					// 	debugger
					// 	var child = jQuery(tem);
					// 		caller(child);
					// });
				}
		//	}	
		},
		/**
		 * [singleChoose 摄像机树上选择组织时，触发该函数]
		 * @param  {[type]} $node [description]
		 * @return {[type]}       [description]
		 */
		singleChoose: function(rootNode,$node) {
			var self = this;
			rootNode.find("i.radio-leaf").removeClass("active");
			$node.toggleClass("active");
			self.selectedOrg = {
				id: $node.closest("li").data("id"),
				name: $node.closest("li").data("name")
			};
		},
        /**
		 * [getSelectedOrgInfo 返回目标]
		 * @return {[type]} [description]
		 */
		getSelectedOrgInfo: function() {
			var self = this;
			return self.selectedOrg;
		},
		/**
		 * [bindchooseCameraPanelEvent 绑定摄像机选择面板的事件]
		 * @return {[type]} [description]
		 */
		bindchooseCameraPanelEvent: function() {
			var self = this;

			jQuery(".choose-footer").off("click")
			// 点击确定按钮，开始标识人脸摄像机
			.on("click", ".sure:not(.disabled)", function() {	
				self.chooseCameraPanel.hide();
				self.closePanel(self.selectedOrg);
			})
			// 点击取消，不做任何处理 直接关闭面板
			.on("click", ".cancle", function() {
				self.chooseCameraPanel.hide();
			});
		},
		/**
		 * [setSelectedCount 获取选择的摄像机数量]
		 * @return {[type]} [description]
		 */
		setSelectedCount: function() {
			var $chooseResult = jQuery(".choose-result"),
				L = $chooseResult.find(".result").find("li.leaf").length;
			jQuery("#chooseCounts").html(L);
			if (L == 0) {
				$chooseResult.find(".head").find("button").css({"display": "none"});
				$chooseResult.find(".result").empty().append("<li class='warmtip'>暂无组织，请在左侧勾选</li>");
			} else {
				$chooseResult.find(".head").find("button").css({"display": "block"});
				$chooseResult.find(".result").find("li.warmtip").remove();
			}
		}
	};

	return new orgFilter();
});
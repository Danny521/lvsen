define([
	// 布防任务model层
	"/module/protection-monitor/defencesetting/js/model/defence-model.js",
	// 布防任务左侧摄像机树模块
	'/module/protection-monitor/defencesetting/js/view/defence/first-camera-tree-view.js',
	// 布防任务右侧地图模块
	'/module/protection-monitor/defencesetting/js/view/defence/first-pva-map-view.js',
	// 第二步 选择算法，view层，点击下一步时用到
	'/module/protection-monitor/defencesetting/js/view/defence/second-view.js',
	// 全局变量
	'/module/protection-monitor/defencesetting/js/global-var.js'
], function(model, cameraTree, pvaMapView, secondView, globalVar) {
	return {
		options: {
			// 模板列表
			templateMap: {}
		},
		/**
		 * [init 初始化函数]
		 * @param  {[type]} options [参数列表]
		 * @return {[type]}         [description]
		 */
		init: function() {
			var self = this;
			self.initPage();
		},
		/**
		 * [initPage 初始化第一步页面元素]
		 * @return {[type]} [description]
		 */
		initPage: function() {
			var self = this;
			if (jQuery("#defence-first-step").length) {
				return startInitPage();
			}

			// 加载第一步，选择摄像机 页面模板
			self.loadTemplate("defence-first-step-template", function(err, temp) {
				if (err) {
					return notify.error(err);
				}
				jQuery("#defence-main-content").append(temp());
				// 加载摄像机列表
				cameraTree.init();
				// 加载地图
				pvaMapView.init();
				startInitPage();
			});

			function startInitPage() {
				// 显示第一步content区域
				jQuery("#defence-first-step").removeClass("setting-content-hide")
				.siblings(".defence-setting-content").addClass("setting-content-hide");
				// 高亮步骤1
				self.highLightStep("first");
				// 显示底部上一步下一步完成按钮
				self.showBottomBtn();
			}
		},
		/**
		 * [loadTemplate 加载模板]
		 * @param  {[type]}   tempName [模板内容]
		 * @param  {Function} callback [加载完成后的回调函数]
		 * @return {[type]}            [description]
		 */
		loadTemplate: function(tempName, callback) {
			var self = this,
				options = self.options;

			if (options.templateMap[tempName]) {
				return callback(null, options.templateMap[tempName]);
			}

			model.getTml(tempName)
			.then(function(temp) {
				options.templateMap[tempName] = Handlebars.compile(temp);
				callback(null, options.templateMap[tempName]);
			}, function() {
				callback("加载模板失败");
			});
		},
		/**
		 * [highLightStep 高亮显示步骤]
		 * @param  {[type]} num [要显示的步骤]
		 * @return {[type]}     [description]
		 */
		highLightStep: function(num) {
			var steps = [ "first", "second", "third" ],
				index = steps.indexOf(num) + 1;

			// num前边的都高亮
			for (var i = 0; i < index; i++) {
				jQuery("#defence-setting-nav").find("li." + steps[i] + "-step").addClass("active").find("i.bar").addClass('active');
			}

			// num后边的都还原
			for (; index < steps.length; index++) {
				jQuery("#defence-setting-nav").find("li." + steps[index] + "-step").removeClass("active").find("i.bar").removeClass('active');
			}
		},
		/**
		 * [showBottomBtn 显示隐藏底部按钮]
		 * @return {[type]} [description]
		 */
		showBottomBtn: function() {
			jQuery("#defence-setting-footer")
				.find("button").hide().end()
				.find(".next").show();

			// 绑定上一步下一步事件
			this.bindStepEvent();
		},
		/**
		 * [bindStepEvent 绑定底部按钮事件]
		 * @return {[type]} [description]
		 */
		bindStepEvent: function() {
			var self = this;
			jQuery("#defence-setting-footer").off("click")
			.on("click", ".next", function() {
				if (!globalVar.defence.cameraData) {
					notify.warn("请选择摄像机！");
					return false;
				}

				jQuery("#defence-first-step").addClass("setting-content-hide");
				// 第二步选择算法 view 模块
				secondView.init(true);
			});
		}
	};
});
define([
	// 布控任务的handlebar助手
	"/module/protection-monitor/defencesetting/js/view/control/helper.js",
	'/module/protection-monitor/defencesetting/js/model/control-model.js',
	'/module/protection-monitor/defencesetting/js/controller/control/first-controller.js',
	'/module/protection-monitor/defencesetting/js/controller/control/preventcontrol-global-var.js',
	'/module/protection-monitor/defencesetting/js/controller/control/protectcontrol-common-fun.js',
	'/module/protection-monitor/defencesetting/js/controller/control/camera-rule-video-controller.js',
	// 地图初始化controller模块
	'/module/protection-monitor/defencesetting/js/controller/control/first-pva-map-controller.js',
	'/module/protection-monitor/defencesetting/js/controller/control/control-linkage-control.js',
	'jquery-ui-timepicker-addon'
], function(helper, model, firstController, globalVar, commonFun, videoPlayer, pvaMap, linkageControl) {
	return {
		options: {},
		template: null,
		/**
		 * [init 初始化函数]
		 * @return {[type]} [description]
		 */
		init: function(options) {
			var self = this;
			// 初始化参数
 			self.setOptions(options);
			// 加载页面dom
			self.initPage();
			// 初始化全局template
			self.initTemp();
		},
		/**
		 * [setOptions 合并参数列表]
		 * @param {[type]} options [description]
		 */
		setOptions: function(options) {
			var self = this;
			jQuery.extend(self.options, options);
		},
		/**
		 * [initPage 初始化页面]
		 * @return {[type]} [description]
		 */
		initPage: function() {
			var self = this;
			// 加载主体框架模板列表
			self.loadTemplate("control-main-template", function(err, temp) {
				if (err) {
					return notify.error(err);
				}

				// 注册handlebar助手
				helper();
				jQuery("body").append(temp());
				self.bindEvent();
				/**
				 * 此处是布控任务设置的入口，
				 * 如果参数里没有任务id，那么，为新建任务
				 * 如果参数里有任务id，为编辑任务
				 */
				firstController.init({
					taskId: self.options.taskId
				});
			});
		},
		/**
		 * [loadTemplate 加载页面模板]
		 * @param  {[type]}   tempName [模板名称]
		 * @param  {Function} callback [回调函数]
		 * @return {[type]}            [description]
		 */
		loadTemplate: function(tempName, callback) {
			var self = this;

			if (self.template) {
				return callback(null, self.template);
			}

			model.getTml(tempName)
			.then(function(temp) {
				self.template = Handlebars.compile(temp);
				callback(null, self.template);
			}, function() {
				callback("加载模板失败");
			});
		},
		/**
		 * [bindEvent 绑定页面事件]
		 * @return {[type]} [description]
		 */
		bindEvent: function() {
			var self = this;
			jQuery("#control-setting-close").on("click", function() {
				if ("function" === typeof self.options.preClose) {
					self.options.preClose();
				}

				if (globalVar.videoPlayerSigle) {
					globalVar.videoPlayerSigle.stop(false, 0);
					globalVar.videoPlayerSigle = null;
				}
				videoPlayer.clearVideoInfo();
				pvaMap.options.map && pvaMap.options.map.destroyMap();
				// 重置地图变量
				self.resetMapController();
				// 重置全局变量
				self.resetGlobalVar();
				// 清除联动选择
				linkageControl.resetElement();
				// 清除当前变量
				self.options = {};
				linkageControl.taskId = 0;
				jQuery("#control-setting-content").fadeOut('500', function() {
					jQuery(this).remove();
					if ("function" === typeof self.options.afterClose) {
						self.options.afterClose();
					}
				});
			});

			jQuery("#control-setting-nav").find("a").on("click", function() {
				return false;
			});

			//添加日期插件
			jQuery("#control-main-content").on('focus', '.input-time', function() {
				var self = this;
				jQuery(this).datetimepicker({
					dateFormat: 'yy-mm-dd',
					showAnim: '',
					showTimepicker: false
					// maxDate: new Date()
				});
				//移动时间插件的位置，避免遮挡
				jQuery(".ui-datepicker").addClass("protect-control");
			});

			//窗口大小改变时，同时改变规则设置层的位置和大小
			jQuery(window).resize(function () {
				if (jQuery("#control-setting-content").is(":visible")) {
					//显示规则设置层
					self.resizeControlWin();
				}
			});
		},
		//请求模板，初始化全局变量
		initTemp: function() {
			var self = this;
			commonFun.loadTemplate(globalVar.templateUrl, function(compiler) {
				globalVar.template = compiler;
				//各模块参数设置
				var opt = {
					template: compiler,
					setPagination: globalVar.setPagination
				};
				//添加全局变量中的模板
				globalVar.template = compiler;
			}, function() {
				//模板加载失败
				notify.error("读取防控管理模板文件失败！");
			});
		},
		/**
		 * 根据宿主的位置和大小显示布防规则设置层
		 */
		resizeControlWin: function () {
			var height = jQuery(window).height() - 116;
			var width = jQuery(window).width();
			// 一二级导航最小宽度1310 故这里作此处理
			width = width < 1310 ? 1310 : width;
			jQuery("#control-setting-content").css({"width": width + "px", "height": height + "px"});
		},
		/**
		 * [resetGlobalVar 关闭面板时重置全局变量]
		 * @return {[type]} [description]
		 */
		resetGlobalVar: function() {
			//布防管理保存当前组织信息
			globalVar.curDepartment = {
				id: "",
				name: "",
				parentId: "",
				department_id: "",
				department_level: "",
				description: "",
				expire: "",
				max_cameras: 0,
				max_tasks: 0,
				cur_cameras: 0,
				cur_tasks: 0
			};
			//布防管理组织树
			globalVar.orgTree = null;
			//布控管理地图对象
			globalVar.map = null;
			//摄像机图层
			globalVar.cameraLayer = null;
			//视频播放对象
			globalVar.videoPlayerSigle = null;
			//信息窗
			globalVar.infowindow = null;
		},
		/**
		 * [resetMapController 关闭面板时，重置地图变量]
		 * @return {[type]} [description]
		 */
		resetMapController: function() {
			pvaMap.options = {
				//地图容器
				mapContainer: null,
				//地图对象
				map: null,
				//基础图层
				baseLayer: null,
				//卫星图层
				satelliteLayer: null,
				//测量工具
				measuretool: null,
				//鹰眼控件
				overviewctrl: null,
				//导航控件
				Navictrl: null,
				//版本控件
				versionCtrl: null,
				//比例尺控件
				scaleCtrl: null,
				//窗口
				infowindow: null,
				//是否全屏
				isFullscreen: false
			};
			//图层
			pvaMap.layers = {
				//地图上播放视频的图层
				cameraVideoLayer: null
			};
			//当前活动的点位信息
			pvaMap.currentCameraMarker = null;
			//标记当前信息窗的样式是否是点位点击模式，此时需要左右切换按钮
			pvaMap.curInfoWinIsMap = true;
			//播放器对象
			pvaMap.videoPlayerSigle = null;
			//资源图层
			pvaMap.resourceLayers = {
				clusterResource: null,
				clusterResourceNum: 0
			};
			//是否已加载摄像机资源
			pvaMap.isLoadedCameras = false;
			//鼠标悬浮到聚合图层上的摄像机时，打开摄像机视频的延时定时器
			pvaMap.playVideoDelayTimer = null;
			//视频延时加载的时间间隔
			pvaMap.delayTimerTimeSpan = 850;
			//当前鼠标移动过程中已经在播放的摄像机位置，为了避免重复加载
			pvaMap.curPlayingVideoInfo = {
				x: 0,
				y: 0
			};
			//当前活动摄像机数据
			pvaMap.currentCameraData = null;
		}
	};
});
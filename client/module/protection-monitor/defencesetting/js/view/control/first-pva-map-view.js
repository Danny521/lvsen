define([
	// 地图初始化controller模块
	'/module/protection-monitor/defencesetting/js/controller/control/first-pva-map-controller.js',
	// 布防任务设置model层
	"/module/protection-monitor/defencesetting/js/model/control-model.js",
	// 布防任务设置地图model层
	"/module/protection-monitor/defencesetting/js/model/map-model.js",
], function(pvaMapController, model, mapModel) {
	return {
		options: {
			templateMap: {},
			ocxDom: ""
		},
		currentCameraMarker: null,
		/**
		 * [init 初始化函数]
		 * 初始化提的模板，加载地图
		 * @return {[type]} [description]
		 */
		init: function() {
			//return;
			var self = this;
			// 初始化地图所需的模板
			self.loadTemplate("pvaMapTemplate", function(err, temp) {
				if (err) {
					return notify.error(err);
				}

				self.initMap();
			});
		},
		/**
		 * [loadTemplate 加载模板]
		 * @param  {[type]}   tempName [模板名称]
		 * @param  {Function} callback [加载完成后的回调]
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
		 * [initMap 初始化地图]
		 * @return {[type]} [description]
		 */
		initMap: function() {
			var self = this;
			// 初始化地图变量
			pvaMapController.initBaseMap();
			//初始化工具条
			self.initMapToolBar();
			//绑定地图相关事件
			self.bindEvents();
			// 绑定资源相关事件
			self.bindResourceEvents();
			// 加载资源对应的摄像机
			pvaMapController.loadResourceCameras();
			// 显示所有摄像机
			self.showResourceLayers();
			// 显示资源列表dom
			jQuery("#control-setting-mapId").find(".control-map-resource-layers").show();
		},
		/**
		 * [initMapToolBar 初始化地图工具栏]
		 * @return {[type]} [description]
		 */
		initMapToolBar: function() {
			var self = this,
				template = self.options.templateMap.pvaMapTemplate;
			//加载左侧地图名称
			jQuery('#control-setting-gismap').find(".map-region").html(template({ mapRegion: true }));
			//加载右侧工具栏
			jQuery('#control-setting-gismap').find(".map-operator").html(template({
				tools: {
					// 地图放大
					max: true,
					// 地图缩小
					min: true,
					//测距
					measureLength: true,
					//截图
					screenshot: true,
					//清除
					mapclear: true
				},
				//全屏
				fullScreen: true
			}));
			//加载卫星图层
			jQuery("#control-setting-mapId").find(".opera-container").html(template({
				//图层切换
				switchLayer: false
			}));
		},
		bindEvents: function() {
			var self = this,
				template = self.options.templateMap.pvaMapTemplate,
				mapManage = pvaMapController.options.map;
			//屏蔽地图右键
			jQuery("#control-setting-mapId > div.olMapViewport").bind('contextmenu', function () {
				return false;
			});
			//地图右键取消操作
			jQuery("#control-setting-mapId > div.olMapViewport").bind("mousedown", function (e) {
				//右键
				if (3 === e.which) {

				}
			});
			// 地图放大
			jQuery("#control-main-content").on("click", "#map-tool-right .map-tools-list .map-max", function () {
				mapManage.zoomIn();
				//激活鼠标文字跟踪
				mapManage.activateMouseContext("框选放大地图,右键取消。");
				// 绑定右键取消点击事件
				mapManage.removeEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK);
				mapManage.addEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK, function (point) {
					// 取消文本提示
					mapManage.deactivateMouseContext();
					// 取消左键点击事件
					mapManage.zoomInOutStop();
				});
			});
			// 地图缩小
			jQuery("#control-main-content").on("click", "#map-tool-right .map-tools-list .map-min", function () {
				mapManage.zoomOut();
				mapManage.activateMouseContext("框选缩小地图,右键取消。");
				// 绑定右键取消点击事件
				mapManage.removeEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK);
				mapManage.addEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK, function (point) {
					// 取消文本提示
					mapManage.deactivateMouseContext();
					// 取消左键点击事件
					mapManage.zoomInOutStop();
				});
			});
			//测距
			jQuery("#control-main-content").on("click", "#map-tool-right .map-tools-list .map-measure", function () {
				pvaMapController.options.measuretool.setMode(NPMapLib.MEASURE_MODE_DISTANCE);
			});
			//清除
			jQuery("#control-main-content").on("click", "#map-tool-right .map-tools-list .map-clear", function () {
				try {
					pvaMapController.layers.alarmCameraLayer.removeAllOverlays();
				} catch (e) {
				}
				//隐藏窗口
				self.closeInfoWindow();
			});
			//全屏
			jQuery("#control-main-content").on("click", "#map-tool-right .map-fullscreen", function () {
				pvaMapController.options.isFullscreen = true;
				self.fullscreen(this, template);
			});
			//退出全屏
			jQuery("#control-main-content").on("click", "#map-tool-right .map-exitfullscreen", function () {
				pvaMapController.options.isFullscreen = false;
				jQuery(".video-play-frame .video-top").removeClass("fullscreen-videotop");
				jQuery(".video-play-frame .video-down").removeClass("fullscreen-video-down");
				self.exitFullscreen(this, template);
			});
			//切换图层
			jQuery("#control-main-content").on("click", ".opera-container a.map-layer-normal,.opera-container a.map-layer-satellite", function () {
				self.switchMapLayer(this);
			});
		},
		/**
		 * 图层切换
		 **/
		switchMapLayer: function (obj) {
			var This = jQuery(obj);
			if (This.attr("layer") === "normal") {
				This.removeClass("map-layer-satellite").addClass("map-layer-normal");
				This.attr("layer", "sattilate");
				This.attr("title", "显示普通地图");
				This.find(".map-layer-text").text("地图");
				// 图层切换到卫星地图
				pvaMapController.options.map.setBaseLayer(pvaMapController.options.satelliteLayer);
			} else {
				This.removeClass("map-layer-normal").addClass("map-layer-satellite");
				This.attr("layer", "normal");
				This.attr("title", "显示卫星地图");
				This.find(".map-layer-text").text("卫星");
				// 图层切换到普通地图
				pvaMapController.options.map.setBaseLayer(pvaMapController.options.baseLayer);
			}
		},
		/**
		 * 全屏
		 **/
		fullscreen: function (obj, template) {
			var This = jQuery(obj);
			//隐藏地图外的其他内容
			jQuery("#navigator,#header").hide();
			jQuery("#control-setting-sidebar").hide();
			jQuery("#content .wrapper").css("top", "0px");
			jQuery("#control-setting-major").css({
				top: "0px",
				left: "0px"
			});
			//加载全屏模式下的工具条
			This.parent().empty().html(template({
				exitfullscreen: true
			}));
			//重新设置地图大小
			pvaMapController.options.map.updateSize();
		},
		/**
		 * 退出全屏
		 **/
		exitFullscreen: function (obj, template) {
			var This = jQuery(obj);
			//显示地图外的其他元素
			jQuery("#navigator,#header,#control-setting-sidebar").show();
			jQuery("#content .wrapper").css("top", "86px");
			jQuery("#control-setting-major").css({
				top: "96px",
				left: jQuery("#control-setting-sidebar").width()
			});
			//加载非全屏状态下的工具条
			This.parent().empty().html(template({
				fullscreen: true
			}));
			//重新设置地图大小
			pvaMapController.options.map.updateSize();
		},
		/**
		 * 隐藏全部图层
		 */
		hideAlllayers: function () {
			//视频播放图层
			pvaMapController.layers.cameraVideoLayer.hide();
		},
		/**
		 * 资源图层的事件绑定
		 */
		bindResourceEvents: function(){
			//资源图层切换事件绑定
			jQuery(".control-map-resource-layers").hover(function () {
				var This = jQuery(this);
				This.find("h2 span.contract-btn").addClass("down");
				This.stop();
				This.animate({
					width: "90px",
					height: "160px"
				}, 300, function () {
					This.find(".resource-layers").show();
				});
			}, function () {
				var This = jQuery(this);
				This.find("h2 span.contract-btn").removeClass("down");
				This.stop();
				This.animate({
					width: "48px",
					height: "26px"
				}, 1000, function () {
					This.find(".resource-layers").hide();
				});
			});
			//资源图层控制
			jQuery("#control-main-content").on("click", ".control-map-resource-layers ul li", function () {
				var This = jQuery(this),
					resourceMap = {
						"ResourceIndoor": "Indoor",       //室内
						"ResourceHiShpomt": "HiShpomt",   //制高点
						"ResourceElevated": "Elevated",   //高架
						"ResourceWater": "Water",         //水面
						"ResourceGround": "Ground"        //路面
					},
					resourceValue = resourceMap[this.id];

				This.toggleClass("active");
				if (This.hasClass("active")) {
					pvaMapController.resourceLayers.cluster.setMakrerTypeVisiable(resourceValue, true);
				} else {
					pvaMapController.resourceLayers.cluster.setMakrerTypeVisiable(resourceValue, false);
				}
			});
		},
		/**
		 * 在地图上显示摄像机信息
		 **/
		showMapCameraInfo: function () {
			var self = this,
				// 模板
				template = self.options.templateMap.pvaMapTemplate,
				// 摄像机数据
				camera = pvaMapController.currentCameraData,
				// 位置
				position = new NPMapLib.Geometry.Point(camera.longitude, camera.latitude),
				// 标题
				title = "",
				// 内容
				content = template({
					cameraInfo: camera
				}),
				//窗口参数
				opts = {
					width: 260, //信息窗宽度，单位像素
					height: 182, //信息窗高度，单位像素
					offset: new NPMapLib.Geometry.Size(0, -5),	 //信息窗位置偏移值
					arrow: true,
					autoSize: false
				};
			
			//触发加载信息窗口
			self.addInfoWindow(position, title, content, opts);
			// 绑定摄像机信息弹窗的事件
			self.bindInfoWinEvent();
		},
		/**
		 * [bindInfoWinEvent 绑定摄像机信息弹窗的事件]
		 * @return {[type]} [description]
		 */
		bindInfoWinEvent: function() {
			var self = this;
			//关闭地图窗口
			jQuery("#control-main-content .infowindow-top .infowindow-operator .icon_mark_close").off("click").click(function () {
				//关闭窗口
				self.closeInfoWindow();
				//将鼠标上次悬浮坐标置为0
				pvaMapController.curPlayingVideoInfo.x = 0;
				pvaMapController.curPlayingVideoInfo.y = 0;
			});
			//查看实时视频
			jQuery("#control-main-content .map-camera-info .camera-status-online").off("click").on("click", function () {
				//摄像机信息窗上查看实时视频
				self.playMapCameraVideo();
			});
		},
		/**
		 * 显示资源图层
		 */
		showResourceLayers: function () {
			try {
				var func = pvaMapController.resourceLayers.cluster.setMakrerTypeVisiable,
					resourceList = ["Indoor", "HiShpomt", "Elevated", "Water", "Ground"];

				_.each(resourceList, function(item, index) {
					func(item, true);
				});
			} catch (e) {}
		},
		/**
		 * 加载信息窗口
		 **/
		addInfoWindow: function (position, title, content, opts) {
			var self = this;
			//先关闭
			self.closeInfoWindow();
			//新建窗口元素
			pvaMapController.options.infowindow = new NPMapLib.Symbols.InfoWindow(position, "", content, opts);
			//将窗口加入在地图
			pvaMapController.options.map.addOverlay(pvaMapController.options.infowindow);
			//显示信息窗口
			pvaMapController.options.infowindow.open(new NPMapLib.Geometry.Size(opts.width, opts.height));
		},
		/**
		 * 关闭信息窗口
		 **/
		closeInfoWindow: function () {
			//触发视频资源的释放
			pvaMapController.clearVideoPlayer();
			//关闭信息窗
			if (pvaMapController.options.infowindow) {
				var BaseDiv = jQuery(pvaMapController.options.infowindow.getBaseDiv());
				BaseDiv.html("");
				pvaMapController.options.infowindow.close();
				pvaMapController.options.infowindow = null;
			}
		},
		/**
		 * [playMapCameraVideo 地图上，摄像机信息窗口，播放实时视频]
		 * @return {[type]} [description]
		 */
		playMapCameraVideo: function(camearaData) {
			var self = this,
				offsetTop = camearaData ? -5 : -22;
			camearaData = camearaData || pvaMapController.currentCameraData;
			camearaData = pvaMapController.formatCameraData(camearaData);
			// 播放之前，先检测摄像机各方面是否符合播放要求
			var checkValid = self.checkCameraBeforePlay(camearaData);
			if (!checkValid) {
				return false;
			}

			//在缩放之前关闭窗口,以解决ocx地图信息窗播放在缩放后关闭造成ocx画面残留的问题，add by zhangyu, 2014-10-31
			self.closeInfoWindow();
			// 播放之前设置相应的标志参数
			pvaMapController.setParamsBeforePlay(camearaData);
			var self = this,
				// 模板
				template = self.options.templateMap.pvaMapTemplate,
				//位置
				position = new NPMapLib.Geometry.Point(camearaData.lon, camearaData.lat),
				//内容
				content = template({
					ocx: camearaData
				}), 
				//窗口参数
				opts = {
					width: 400, //信息窗宽度，单位像素
					height: 330, //信息窗高度，单位像素
					offset: new NPMapLib.Geometry.Size(0, offsetTop),	 //信息窗位置偏移值
					arrow: true,
					autoSize: false,
					isAnimationOpen: false
				};

			//加载信息窗口
			self.addInfoWindow(position, "", content, opts);
			self.bindPlayVideoWinEvent();
			// 创建OCX
			self.createOcxOnMap(".map-video-container");
			// 播放视频
			pvaMapController.playVideo(camearaData);
		},
		/**
		 * [checkCameraBeforePlay 播放之前，检查摄像机数据的合法性]
		 * @param  {[type]} camearaData [要检查的摄像机数据]
		 * @return {[type]}             [description]
		 */
		checkCameraBeforePlay: function(camearaData) {
			// 如果camearaData是undefined，则返回
			if (!camearaData) {
				return false;
			}
			
			// 如果当前摄像机已经在播放，则返回
			if (pvaMapController.currentCameraMarker && pvaMapController.currentCameraMarker.getData().id === camearaData.id) {
				return false;
			}

			// 如果当前摄像机没有点位信息，则返回
			var longitude = camearaData.lon,
				latitude = camearaData.lat;
			if (!longitude && !latitude) {
				notify.warn("该摄像机没有坐标信息！");
				return false;
			}

			return true;
		},
		/**
		 * [bindPlayVideoWinEvent 地图上播放视频弹窗的事件]
		 * @return {[type]} [description]
		 */
		bindPlayVideoWinEvent: function() {
			var self = this;
			//弹出层的关闭点击事件
			jQuery("#control-main-content .infowindow-top .icon_mark_close").off("click").on("click", function () {
				//关闭弹出层
				self.closeInfoWindow();
				//清除地图上的摄像机标注
				pvaMapController.layers.cameraVideoLayer.removeAllOverlays();
				//清除当前活跃的点位信息
				pvaMapController.currentCameraMarker = null;
			});
		},
		/**
		 * 创建地图上的OCX
		 **/
		createOcxOnMap: function (_class) {
			this.options.ocxDom = this.options.ocxDom ? this.options.ocxDom : '<object id="UIOCXMAP" type="applicatin/x-firebreath" width ="398" height ="297"><param name="onload" value="pluginLoaded"/></object>';
			jQuery(_class).append(this.options.ocxDom);
		},
		/**
		 * [rectSelectCameras 框选摄像机]
		 * @return {[type]} [description]
		 */
		rectSelectCameras: function() {
			pvaMapController.rectSelectCameras();
		}
	};
});
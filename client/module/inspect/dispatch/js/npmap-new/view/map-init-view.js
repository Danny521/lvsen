/**
 * 初始化地图工具条
 * @type {Object}
 */
define([
	'js/npmap-new/map-common',
	'js/npmap-new/map-init',
	'js/npmap-new/map-variable',
	'npmapConfig',
	'jquery'
], function(Common, PVAMap, Variable) {

	var mapToolMainView = {
		//定义需要的地图工具
		toolConfig: {
			//行政区域
			regionSelect: true,
			//资源
			resource: {
				//摄像机
				camera: true,
				//卡口
				bayonet: true,
				//灯杆
				lightbar: true,
				//警车
				policecar: true,
				//警员
				policeman: true
			},
			//地图选择
			select: {
				//框选
				rectSelect: true,
				//圈选
				circleSelect: true
			},
			//全景鼠标跟随图标
			fullViewImg: true,
			//警力调度鼠标跟随图标
			policeScheduleImg: true,
			//视野范围搜索
			rangeSearch: true,
			tools: {
				// 地图放大
				max: true,
				// 地图缩小
				min: true,
				//测距
				measureLength: true,
				//截图--modify by zhangyu,2014-11-8,于秋要求隐藏此工具
				screenshot: false,
				//打印--modify by zhangyu,2014-11-8,于秋要求隐藏此工具
				print: false,
				//清除
				mapclear: true
			},
			//全屏
			fullScreen: true,
			//平面地图
			platMap: true,
			//图层切换
			switchLayer: true,
			//地图报警
			mapShowInfo: true
		},
		/**
		 * 加载地图
		 * @type {[type]}
		 */
		loadMap: function() {
			var config = {
				//地图容器，初始化地图时必须填写
				mapContainer: document.getElementById("mapId"),
				//底图种类, 默认为基本地图和卫星地图两种；目前仅视频指挥是两种，其他模块均为1种
				baseMapNum: 2,
				//是否添加鹰眼
				isOverviewCtrl: true,
				//是否导航条
				isNaviCtrl: true,
				//是否比例尺
				isScaleCtrl: true,
				//是否绘制工具
				isDrawTool: true,
				//是否测量工具
				isMeasureTool: true,
				//是否添加zoom动画效果
				isZoomAnimation: true
			};
			//将返回值付给全局变量
			var mapObject = PVAMap.initMap(config, "base");
			//地图对象
			Variable.map = mapObject.map;
			//基础图层
			Variable.baseLayer = mapObject.baseLayer;
			//卫星地图图层
			Variable.satelliteLayer = mapObject.satelliteLayer;
			//绘制工具
			Variable.drawtool = mapObject.drawtool;
			//测量工具
			Variable.measuretool = mapObject.measuretool;
			//加载图层
			Common.addBusiLayers();
			//地图事件
			this.addMapEvents();
		},
		/**
		 * 地图事件
		 * @author Li Dan
		 * @date   2015-01-06
		 */
		addMapEvents: function() {
			//屏蔽地图右键
			jQuery("#mapId").bind('contextmenu', function() {
				return false;
			});
			//地图右键取消操作
			jQuery("#mapId > div.olMapViewport").bind("mousedown", function(e) {
				//右键
				if (3 === e.which) {
					//业务中电子防区、防控圈中的按钮样式还原（临时）
					$(".map-draw").removeClass('active');
					//取消绘制
					if (Variable.isDrawing) {
						Variable.drawtool.cancel();
						Variable.map.deactivateMouseContext();
						Variable.isDrawing = false;
					}
					//取消测距
					if (Variable.measuretool) {
						Variable.measuretool.cancel();
					}
				}
			});
			//地图拖拽
			Variable.map.addEventListener(NPMapLib.MAP_EVENT_DRAGGING, function(e) {
				if (window.lbsInfowindow&&window.lbsInfowindow.camera) {
					if (window.videoPlayerSigle&&window.lbsInfowindow.camera) {
					//	window.videoPlayerSigle.refreshWindow(0);
					}
				}
			});
			//地图拖拽开始
			Variable.map.addEventListener(NPMapLib.MAP_EVENT_DRAG_START, function(e) {
				if (window.lbsInfowindow&&window.lbsInfowindow.camera) {
					if (window.videoPlayerSigle) {
						window.lbsInfowindow.hide();
					}
				}
			});
			//地图拖拽结束
			Variable.map.addEventListener(NPMapLib.MAP_EVENT_DRAG_END, function(e) {
				if (window.lbsInfowindow&&window.lbsInfowindow.camera) {
					if (window.videoPlayerSigle) {
						window.lbsInfowindow.show();
					//	window.videoPlayerSigle.refreshWindow(0);
					}
				}
			});
			//地图缩放结束
			Variable.map.addEventListener(NPMapLib.MAP_EVENT_ZOOM_END, function(e) {
				if (window.lbsInfowindow&&window.lbsInfowindow.camera) {
					if (window.videoPlayerSigle) {
					//	window.videoPlayerSigle.refreshWindow(0);
					}
				}
				var angleLayer = Variable.map.getLayerByName("camera-angle-layer");
				var cameraLayer = Variable.map.getLayerByName("camera-resource-layer");
				if (angleLayer) {
					if (Variable.map.getZoom() === Variable.map.getMaxZoom() && cameraLayer && cameraLayer.getVisible()) {
						angleLayer.show();
					} else {
						angleLayer.hide();
					}
				}
				//添加警力移动点位的刷新逻辑，by zhangyu on 2015/6/24
				require(["js/npmap-new/task/map-gps-refresh"], function(PointRefresh) {
					PointRefresh.init(Variable.map);
					PointRefresh.triggerResRefresh();
				});
			});
		}
	};
	return mapToolMainView;
});
/**
 * PVA 地图基础操作 封装
 */
define(["mootools", "OpenLayers"], function() {

	// 地图初始化和一些工具的定义
	window.PVAMap = new new Class({
		//参数
		options: {
			//地图容器
			mapContainer: document.getElementById("mapId"),
			// //地图对象
			map: null,
			// //基础图层
			baseLayer: null,
			//绘制工具
			drawtool: null,
			// //测量工具
			measuretool: null,
			// //鹰眼控件
			overviewctrl: null,
			// //导航控件
			Navictrl: null,
			// //版本控件
			versionCtrl: null,
			// //比例尺控件
			scaleCtrl: null,
			// //窗口
			infowindow: null
		},
		//初始化
		initialize: function() {
			var self = this;
			//加载地图
			this.initMap();
		},
		//初始化地图
		initMap: function() {
			//初始化地图
            this.options.map = mapConfig.initMap(this.options.mapContainer);
            /*var layers = [];
            if(mapConfig.baselayer){
                var layer = mapConfig.initLayer(mapConfig.baselayer, "baselayer");
				layers.push(layer[0]);
				if(layer.length === 2){
					layers.push(layer[1]);
				}
            }
            //加载基础图层
            this.options.map.addLayers(layers);*/
			//鹰眼
			this.options.overviewctrl = new NPMapLib.Controls.OverviewControl();
			this.options.map.addControl(this.options.overviewctrl);
			this.options.overviewctrl.changeView(true);
			//导航
			this.options.Navictrl = new NPMapLib.Controls.NavigationControl({navigationType:'netposa'});
			//this.options.Navictrl = new NPMapLib.Controls.NavigationControl();
			this.options.map.addControl(this.options.Navictrl);
			//比例尺
			this.options.scaleCtrl = new NPMapLib.Controls.ScaleControl();
			this.options.map.addControl(this.options.scaleCtrl);
			//绘制工具初始化
			this.options.drawtool = new NPMapLib.Tools.DrawingTool(this.options.map.id);
			//测量工具
			this.options.measuretool = new NPMapLib.Tools.MeasureTool(this.options.map.id, {
				lengthUnit: NPMapLib.MAP_UNITS_METERS, //长度单位
				areaUnit: NPMapLib.MAP_UNITS_SQUARE_KILOMETERS, //面积单位
				mode: NPMapLib.MEASURE_MODE_DISTANCE //测量模式
			});
			this.options.measuretool.startUp();

			//添加鼠标缩放时的动画,四个角-add by zhangyu 2014-10-23
			var zoomAnimation = new NPMapLib.Controls.zoomAnimationControl();
			this.options.map.addControl(zoomAnimation);
			//鼠标样式
			// this.options.map.addHandStyle();
		},
		/**
		 * 加载信息窗口
		 **/
		addInfoWindow: function(position, title, content, opts) {
			if (this.options.infowindow) {
				//先关闭
				this.closeInfoWindow();
			}
			//新建窗口元素
			this.options.infowindow = new NPMapLib.Symbols.InfoWindow(position, "", content, opts);
			//将窗口加入在地图
			this.options.map.addOverlay(this.options.infowindow);
			//绑定地图事件
			// this.options.MapTool.mapInfowinEvents();
			//显示信息窗口
			PVAMap.options.infowindow.open();
		},
		/**
		 * 关闭信息窗口
		 **/
		closeInfoWindow: function() {
			if (this.options.infowindow) {
				this.options.infowindow.close();
				this.options.infowindow = null;
			}
		},
		/**
		 * 将点位数组转换成geoJSON格式
		 **/
		convertArrayToGeoJson: function(pointarr, type) {
			if (pointarr === null || pointarr === '' || pointarr === 'undefined') {
				return;
			}
			var resultarr = [];
			var arr = [];
			for (var i = 0, j = pointarr.length; i < j; i++) {
				var point = [];
				point.push(pointarr[i].lon ? pointarr[i].lon : pointarr[i][0]);
				point.push(pointarr[i].lat ? pointarr[i].lat : pointarr[i][1]);
				arr.push(point);
			}
			resultarr.push(arr);
			var result = {
				"type": type,
				"coordinates": resultarr
			};
			return JSON.stringify(result);
		},
		/**
		 * 设置地图中心点
		 **/
		setMapToPoint: function(point) {
			var extent = this.options.map.getExtent();
			if (point.lon > extent.sw.lon && point.lon < extent.ne.lon && point.lat > extent.sw.lat && point.lat < extent.ne.lat) {
				return;
			}
			this.options.map.setCenter(point);
		},
		/**
		 * 通用线样式
		 **/
		polyline: function(points) {
			return new NPMapLib.Geometry.Polyline(points, {
				color: "#3D71BB", //颜色
				weight: 5, //宽度，以像素为单位
				opacity: 1, //透明度，取值范围0 - 1
				lineStyle: NPMapLib.LINE_TYPE_SOLID //样式
			});
		},
		/**
		 * 将GeoJSON数据转换成NPMAP Point
		 **/
		converGeoJSONToPoints: function(geoJson) {
			var points = [];
			if (geoJson.coordinates[0]) {
				for (var i = 0, j = geoJson.coordinates[0].length; i < j; i++) {
					var point = new NPMapLib.Geometry.Point(geoJson.coordinates[0][i][0], geoJson.coordinates[0][i][1]);
					points.push(point);
				}
			}
			return points;
		}
	});
});
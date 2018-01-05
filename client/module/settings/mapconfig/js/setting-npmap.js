jQuery(function() {

	// 地图初始化和一些工具的定义
	var PVAMap = window.PVAMap = new new Class({
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
           /* var layers = [];
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
			this.options.infowindow.close();
			this.options.infowindow = null;
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

	// 全局变量
	var mapSettings = {
		template: null,

		lineColor: "",
		mapMgr: "",

		polygonPoints: "",

		polygonArea: "",
		setPagination: function(total, selector, itemsPerPage, callback) {
			jQuery(selector).pagination(total, {
				items_per_page: itemsPerPage,
				first_loading:false,
				callback: function(pageIndex, jq) {
					callback(pageIndex + 1);


				}
			});
		},
		/* 保留8位小数 */
		float8: function(val) {
			var value = "" + val;
			var pattern = /^[1-9](\d)*.(\d)*$/;
			if (pattern.test(value)) {
				var point = value.indexOf(".");
				var tem = value.substring(point + 1);
				if (tem.length > 8) {
					tem = tem.substr(0, 8);
					return value.substring(0, point + 1) + tem;
				}
			}
			return value;

		},
		errorMessage: "网络或服务器异常！"
	};


	// 地图管理
	var MapMgr = new Class({

		Implements: [Options, Events],

		drawToolbar: null,

		options: {
			tmpUrl: "/module/settings/mapconfig/inc/map-fragment.html",
			cameraLayer: null,
			drawtool: ""
		},

		initialize: function(options) {
			this.options.drawtool = new NPMapLib.Tools.DrawingTool(PVAMap.options.map.id);
			this.setOptions(options);
			this.loadTmp();
			this.bindToolBarEvent();
			this.addLayers();
		},
		/*
		 *	加载模板
		 */
		loadTmp: function() {
			var self = this;
			jQuery.get(self.options.tmpUrl, function(res) {
				self.addHelper();
				self.template = Handlebars.compile(res);
			});
		},
		/*
		 *	添加助手
		 */
		addHelper: function() {
			 Handlebars.registerHelper('showCode', function(value) {
                return value !== "" ? "("+ value +")" :"";
            });
		},
		// 添加地图

		addLayers: function() {
			var self = this;
			self.options.cameraLayer = new NPMapLib.Layers.OverlayLayer("camera-point");
			PVAMap.options.map.addLayer(self.options.cameraLayer);
		},


		//关闭弹窗
		bindInfoWindowEvent: function() {
			var self = this;
			jQuery("#npgis .infowindow-title  i.closeBtn,#cancelMark").unbind("click");
			jQuery("#npgis .infowindow-title  i.closeBtn,#cancelMark").bind("click", function() {
				PVAMap.options.infowindow.close();
				PVAMap.options.infowindow = null;
				PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
				self.options.cameraLayer.removeAllOverlays();
			});
		},


		bindToolBarEvent: function() {
			var self = this;
			// 全屏
			jQuery("#gismap .map-tool a.map-tool-fullscreen").click(function() {
				jQuery("#gismap .map-tool a.map-tool-exitfullscreen").show();
				jQuery(this).hide();
				self.fullscreen();
			});

			// 退出全屏
			jQuery("#gismap .map-tool a.map-tool-exitfullscreen").click(function() {
				jQuery(this).hide();
				jQuery("#gismap .map-tool a.map-tool-fullscreen").show();
				self.exitFullscreen();

			});
		},

		/*
		 *	经纬度验证
		 */
		validateCoord: function(camera) {
			var pattern = /^[1-9](\d){0,2}[.]?(\d)*$/;
			if (pattern.test(camera.lon) && pattern.test(camera.lat) && camera.lon !== "" && camera.lat !== "" && parseInt(Math.abs(camera.lat),10) <= 90 && parseInt(Math.abs(camera.lon),10) <= 180) {
				return true;
			}
			return false;
		},
		/*
		 *	显示坐标
		 */
		showMark: function(lon, lat) {
			var self = this;
			// 判断是否有点击事件，有的话取消。
			if (NPMapLib.MAP_EVENT_CLICK) {
				PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
			}
			if (lon !== "" && lat !== "") {
				self.options.cameraLayer.removeAllOverlays();
				var position = new NPMapLib.Geometry.Point(lon, lat);
				//图片标注
				var symbol = new NPMapLib.Symbols.Icon("/module/common/images/map/map-marker.png", new NPMapLib.Geometry.Size(13, 21));
				//标注
				var marker = new NPMapLib.Symbols.Marker(position);
				marker.setIcon(symbol);
				//添加覆盖物
				self.options.cameraLayer.addOverlay(marker);
				// 把这个设置为中心点 2015-07-28注释掉这句
				//PVAMap.options.map.centerAndZoom(position, PVAMap.options.map.getZoom());
			} else {
				self.options.cameraLayer.removeAllOverlays();
			}

		},
		/*
		 *	显示摄像机
		 */
		showCamera: function(camera, el) {
			var self = this;
			self.options.cameraLayer.removeAllOverlays();
			var position = new NPMapLib.Geometry.Point(camera.lon, camera.lat);
			//图片标注
			var symbol = new NPMapLib.Symbols.Icon("/module/common/images/map/map-marker.png", new NPMapLib.Geometry.Size(13, 21));
			//标注
			var marker = new NPMapLib.Symbols.Marker(position);
			marker.setIcon(symbol);
			marker.setData(camera);
			//添加覆盖物
			self.options.cameraLayer.addOverlay(marker);
			var content = self.template({
				"cameraLocationPanel": {
					"name": camera.name,
					"code":camera.cameraCode,
					"longitude": mapSettings.float8(camera.lon),
					"latitude": mapSettings.float8(camera.lat)
				}
			});
			//窗口参数
			var opts = {
				width: 220, //信息窗宽度，单位像素 
				height: 150, //信息窗高度，单位像素
				offset: new NPMapLib.Geometry.Size(0, -15), //信息窗位置偏移值
				arrow: true,
				autoSize: false
			};

			if (PVAMap.options.infoWindow) {
				PVAMap.options.infowindow.close();
				PVAMap.options.infowindow = null;
			}
			PVAMap.addInfoWindow(position, '', content, opts);
			PVAMap.options.infowindow.open();
			PVAMap.options.map.setCenter(position);
			// 系统配置-地图配置-地图标注
			// settings:{
			// 	// 地图标注默认放大级别
			// 	markZoom:4      // 这个根据实际情况进行配置
			// },
			// 如果mapConfig中没有没有此配置段，请添加上
			if(PVAMap.options.map.getZoom() < mapConfig.settings.markZoom){
				PVAMap.options.map.centerAndZoom(position,mapConfig.settings.markZoom);
			}else{
				PVAMap.options.map.setCenter(position)
			}

			self.bindInfoWindowEvent();
			// 当前图层发生变化，设置到中心点。
			PVAMap.options.map.addEventListener(NPMapLib.MAP_EVENT_ZOOM_END, function(zoomLevel) {
				PVAMap.options.map.centerAndZoom(position, zoomLevel)
			});
			if(NPMapLib.MAP_EVENT_CLICK){
				PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
			}
			PVAMap.options.map.addEventListener(NPMapLib.MAP_EVENT_CLICK, function(point) {
				self.options.cameraLayer.removeAllOverlays();
				var position1 = new NPMapLib.Geometry.Point(point.lon, point.lat);
				camera.lon = point.lon;
				camera.lat = point.lat;
				//图片标注
				var newsymbol = new NPMapLib.Symbols.Icon("/module/common/images/map/map-marker.png", new NPMapLib.Geometry.Size(13, 21));
				//标注
				var newmarker = new NPMapLib.Symbols.Marker(position1);
				var newcamera = {
					"id": camera.id,
					"name": camera.name,
					"lon": point.lon,
					"lat": point.lat
				}
				newmarker.setIcon(newsymbol);
				newmarker.setData(newcamera);
				//添加覆盖物
				self.options.cameraLayer.addOverlay(newmarker);
				var newcontent = self.template({
					"cameraLocationPanel": {
						"name": camera.name,
						"code":camera.cameraCode,
						"longitude": mapSettings.float8(point.lon),
						"latitude": mapSettings.float8(point.lat)
					}
				});
				//窗口参数
				var newopts = {
					width: 220, //信息窗宽度，单位像素 
					height: 150, //信息窗高度，单位像素
					offset: new NPMapLib.Geometry.Size(0, -15), //信息窗位置偏移值
					arrow: true,
					autoSize: false
				};
				PVAMap.options.map.addEventListener(NPMapLib.MAP_EVENT_ZOOM_END, function(zoomLevel) {
					PVAMap.options.map.centerAndZoom(position1, zoomLevel)
				});
				if (PVAMap.options.infoWindow) {
					PVAMap.options.infowindow.close();
					PVAMap.options.infowindow = null;
				}
				// 添加window提示框
				PVAMap.addInfoWindow(position1, '', newcontent, newopts);
				PVAMap.options.infowindow.open();
				// 当前图层发生变化，设置到中心点。

				self.bindInfoWindowEvent();
				self.bindCreateMarkEvent(camera, el);
			});
			// 藏掉跟随图标
			// 	jQuery("#follower").hide();
			self.bindCreateMarkEvent(camera, el);
		},


		// 隐藏图层上的信息

		hideInfo: function() {
			var self = this;
			self.options.cameraLayer.removeAllOverlays();
		},

		/*
		 *	保存摄像机坐标
		 */
		bindCreateMarkEvent: function(data, el) {
			var self = this;
			jQuery("#gismap .location-box.add-location #saveMark").unbind("click");
			jQuery("#gismap .location-box.add-location #saveMark").click(function() {

				var camera = {
					"cameraId": data.id,
					"lon": jQuery("#gismap .location-box #longitude").val().trim(),
					"lat": jQuery("#gismap .location-box #latitude").val().trim(),
					"zoom":PVAMap.options.map.getZoom()
				};

				// var camera = {
				// 	"cameraId": data.id,
				// 	"lon": jQuery("#gismap .location-box #longitude").val().trim(),
				// 	"lat": jQuery("#gismap .location-box #latitude").val().trim()
				// };

				if (self.validateCoord(camera)) {
					self.saveCamera(camera, function() {
						PVAMap.options.infowindow.close();
						PVAMap.options.infowindow = null;
						PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
						// self.map.infoWindow.hide();
						// dojo.disconnect(self.clickHandler);

						el.attr("data-lon", camera.lon);
						el.attr("data-lat", camera.lat);

						// 更新图标
						var iEl = el.children("i.camera-style");
						// 球机
						if (iEl.hasClass("dom")) {
							if (!iEl.hasClass("dom-marked")) {
								iEl.addClass("dom-marked");
							}

						} else {
							// 枪机
							if (!iEl.hasClass("marked")) {
								iEl.addClass("marked");
							}
						}

						self.showMark(camera.lon, camera.lat);

						jQuery("content").unbind("mousemove");
						jQuery("content").unbind("mousedown");

					});

				} else {
					notify.warn("经纬度输入有误！");
				}
			});

		},

		/*
		 *	保存摄像机坐标信息
		 */
		saveCamera: function(camera, callback) {
			var self = this;
			jQuery.ajax({
				url: "/service/map/update_camera_point",
				type: "post",
				data: camera,
				dataType: 'json',
				success: function(res) {
					if (res.code === 200) {
						notify.success("标注成功！");
						callback();
					} else {
						notify.warn("标注失败！");
					}
				}
			});

		},

		/*
		 *	添加摄像机
		 */
		addCamera: function(data, el) {
			var self = this;
			// 清空图层
			self.options.cameraLayer.removeAllOverlays();
			if (PVAMap.options.infowindow) {
				PVAMap.options.infowindow.close();
				PVAMap.options.infowindow = null;
			}

			if (NPMapLib.MAP_EVENT_CLICK) {
				PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
			}
			// 地图的点击事件
			PVAMap.options.map.addEventListener(NPMapLib.MAP_EVENT_CLICK, function(point) {
				// 取消右击事件
				PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK);
				self.options.cameraLayer.removeAllOverlays();
				var position = new NPMapLib.Geometry.Point(point.lon, point.lat);
				//图片标注
				var symbol = new NPMapLib.Symbols.Icon("/module/common/images/map/map-marker.png", new NPMapLib.Geometry.Size(13, 21));
				//标注
				var marker = new NPMapLib.Symbols.Marker(position);
				marker.setIcon(symbol);
				marker.setData(data);
				//添加覆盖物
				self.options.cameraLayer.addOverlay(marker);
				var content = self.template({
					"cameraLocationPanel": {
						"name": data.name,
						"code":data.cameraCode,
						"longitude": mapSettings.float8(point.lon),
						"latitude": mapSettings.float8(point.lat)
					}
				});
				//窗口参数
				var opts = {
					width: 220, //信息窗宽度，单位像素 
					height: 150, //信息窗高度，单位像素
					offset: new NPMapLib.Geometry.Size(0, -15), //信息窗位置偏移值
					arrow: true,
					autoSize: false
				};

				if (PVAMap.options.infoWindow) {
					PVAMap.options.infowindow.close();
					PVAMap.options.infowindow = null;
				}
				PVAMap.addInfoWindow(position, '', content, opts);
				PVAMap.options.infowindow.open();
				self.bindInfoWindowEvent();
				self.bindCreateMarkEvent(data, el);
				// 藏掉跟随图标
				jQuery("#follower").hide();
			});
		},

		/*
		 *	全屏
		 */
		fullscreen: function() {
			var self = this;

			jQuery("#navigator,#header").hide();
			jQuery("#sidebar").hide();
			jQuery("#content .wrapper").css("top", "0px");
			jQuery("#major").css({
				top: "0px",
				left: "0px"
			});

			PVAMap.options.map.updateSize();
			// self.map.reposition();
		},
		/*
		 *	退出全屏
		 */
		exitFullscreen: function() {
			var self = this;

			jQuery("#navigator,#header").show();
			jQuery("#sidebar").show();
			jQuery("#content .wrapper").css("top", "86px");
			jQuery("#major").css({
				top: "10px",
				left: jQuery("#sidebar").width()
			});

			PVAMap.options.map.updateSize();
			// self.map.reposition();
		},

		// 根据坐标值在地图上显示多边形
		showPolygon: function(data, color, zoom) {
			var self = this;
			PVAMap.options.map.clearOverlays();
			self.options.cameraLayer.removeAllOverlays();
			if (PVAMap.options.infowindow) {
				PVAMap.options.infowindow.close();
				PVAMap.options.infowindow = null;
			}
			var geoData = JSON.parse(data);
			var len = geoData.coordinates[0].length;
			var point = [];
			for (var i = 0; i < len; i++) {
				point.push(new NPMapLib.Geometry.Point(geoData.coordinates[0][i][0], geoData.coordinates[0][i][1]));
			}
			var polygon = new NPMapLib.Geometry.Polygon(point, {
				color: color, //颜色
				fillColor: "#6980bc", //填充颜色
				weight: 2, //宽度，以像素为单位
				opacity: 0.8, //透明度，取值范围0 - 1
				fillOpacity: 0.5 //填充的透明度，取值范围0 - 1
			});
			PVAMap.options.map.addOverlay(polygon);
			if (zoom === "") {
				PVAMap.options.map.centerAndZoom(new NPMapLib.Geometry.Point(geoData.coordinates[0][0][0], geoData.coordinates[0][0][1]), zoom);
			} else {
				PVAMap.options.map.centerAndZoom(new NPMapLib.Geometry.Point(geoData.coordinates[0][0][0], geoData.coordinates[0][0][1]), zoom);
			}
			// 地图的缩放事件让面积图形的一个点作为中心点
			PVAMap.options.map.addEventListener(NPMapLib.MAP_EVENT_ZOOM_END, function(zoomLevel) {
					PVAMap.options.map.centerAndZoom(new NPMapLib.Geometry.Point(geoData.coordinates[0][0][0],geoData.coordinates[0][0][1]), zoomLevel)
			});
		},

		// 画多边形
		drawCover: function(lineColor, event) {
			var self = this;
			PVAMap.options.map.clearOverlays();
			if (PVAMap.options.infowindow) {
				PVAMap.options.infowindow.close();
				PVAMap.options.infowindow = null;
			}
			self.options.cameraLayer.removeAllOverlays();
			PVAMap.options.map.activateMouseContext("单击绘制区域，双击结束,右键取消！");
			self.options.drawtool.setMode(NPMapLib.DRAW_MODE_POLYLGON, self.callBackMethod);

			// 绑定右键取消点击事件
			PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK);
			PVAMap.options.map.addEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK, function(point) {
				// 取消文本提示
				PVAMap.options.map.deactivateMouseContext();
				// 取消左键点击事件
				PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
				self.options.drawtool.cancel()
			});
		},
		callBackMethod: function(result, geometry) {
			var self = this;
			geometry._color = mapSettings.lineColor;
			geometry._fillColor = "#6980bc";
			geometry._opacity = 0.8;
			var points = geometry._points;
			PVAMap.options.map.deactivateMouseContext();
			PVAMap.options.map.addOverlay(geometry);
			var units = "m";
			mapSettings.polygonArea = geometry.getArea(units).toFixed(3);
			mapSettings.polygonPoints = PVAMap.convertArrayToGeoJson(geometry._points, "Polygon");

		},

		// 获取多边形的面积
		getPolygonArea: function() {
			return mapSettings.polygonArea ? mapSettings.polygonArea : 0;
		},
		// 获取坐标
		getPolygonPoints: function() {
			return mapSettings.polygonPoints;
		},

		getZoom: function(argument) {
			return PVAMap.options.map.getZoom();
		}

	});


	// 地图标注管理（暂不使用）
	// var MapMarkMgr = new Class({

	// 	Implements: [Options, Events],

	// 	map: null,

	// 	options: {
	// 		logo: false,
	// 		scalebar: true,
	// 		sliderStyle: 'large',
	// 		showInfoWindowOnClick: true,
	// 		isKeyboardNavigation: true
	// 	},

	// 	initialize: function(options) {

	// 	}
	// });


	// 电子防线管理
	var EleDefenseLineMgr = new Class({

		Implements: [Options, Events],

		options: {
			itemsPerPage: 7
		},

		validateFlag: false,

		initialize: function(options) {
			this.setOptions(options);
			// this.getEleDefenseLines();
			this.bindEvents();

			// this.scrollBar = jQuery("#defenseScrollBar").tinyscrollbar({
			// 	thumbSize: 60
			// });

			// this.reload();
		},
		reload: function() {

			// this.scrollBar.tinyscrollbar_update('top');
			this.getEleDefenseLines();
		},

		/*
		 *	分页获取电子防线信息
		 */
		getEleDefenseLines: function() {
			var self = this;
			var itemsPerPage = this.options.itemsPerPage;
			jQuery.ajax({
				url: "/service/map/page_eledefense_line",
				type: "post",
				data: {
					current_page: 1,
					page_size: itemsPerPage
				},
				dataType: 'json',
				success: function(res) {
					if (res.code === 200) {
						var hasMorePages = res.data.total > 1 ? true : false;
						jQuery("#defenseList div.list").empty().html(mapSettings.template({
							"eledefenseLines": res.data.eledefenseline
						}));
						if(!hasMorePages){
							jQuery(".tab-content .pagination").empty();
						}
						// self.scrollBar.tinyscrollbar_update('top');
						self.bindListItemClick();

						if (res.data.total > 1) {
							mapSettings.setPagination(res.data.count, "#defenseScrollBar .pagination", itemsPerPage, function(nextPage) {
								jQuery.ajax({
									url: "/service/map/page_eledefense_line",
									type: "post",
									cache: false,
									data: {
										current_page: nextPage,
										page_size: itemsPerPage
									},
									dataType: 'json',
									success: function(res1) {
										if (res1.code === 200) {
											jQuery("#defenseList div.list").empty().html(mapSettings.template({
												"eledefenseLines": res1.data.eledefenseline
											}));
											if (res1.data.total <= 1) {
												jQuery(".tab-content .pagination").hide();
											} else {
												jQuery(".tab-content .pagination").show();
											}
											// self.scrollBar.tinyscrollbar_update('top');
											self.bindListItemClick();
										} else {
											notify.warn("网络异常！");
										}
									}
								});
							});
						}

					} else {
						notify.warn("网络异常！");
					}
				}
			});
		},
		/*
		 *	保存电子防线信息
		 */
		saveEleDefenseLine: function(obj, callback) {
			jQuery.ajax({
				url: "/service/map/save_eledefense_line",
				type: "post",
				data: obj,
				dataType: 'json',
				beforeSend:function(){
					jQuery("#sure").prop("disabled",true);
				},
				success: function(res) {
					if (res.code === 200) {
						notify.success("电子防线创建成功！");
						callback();
					} else {
						notify.warn("电子防线创建失败！");
					}
				},
				complete:function(){
					jQuery("#sure").prop("disabled",false);
				}
			});
		},
		/*
		 *	删除电子防线 @id:电子防线唯一标识符
		 */
		deleteEleDefenseLine: function(id) {
			var self = this;
			new ConfirmDialog({
				title: '删除电子防线',
				confirmText: '确定',
				message: "<p>确定要删除该电子防线吗？</p>",
				callback: function() {
					this.hide();

					jQuery.ajax({
						url: "/service/map/delete_eledefense_line",
						type: "get",
						data: {
							"id": id
						},
						dataType: 'json',
						success: function(res) {
							if (res.code === 200) {
								notify.success("电子防线删除成功！");
								self.getEleDefenseLines();
							} else {
								notify.warn("电子防线删除失败！");
							}
						}
					});
					return false;
				}
			});
		},
		/*
		 *	重名验证
		 */
		checkName: function(name) {
			var self = this;
			var result = false;
			if (self.request) {
				self.request.abort();
			}
			self.request = jQuery.ajax({
				url: "/service/map/get_eledefense_line",
				type: "post",
				data: {
					"name": name
				},
				async: false,
				dataType: 'json',
				success: function(res) {
					if (res.code === 200) {
						if (res.data.message) {
							result = true;
						}
					} else {
						notify.warn("网络异常！");
					}
				}
			});
			return result;
		},
		/*
		 *	电子防线列表 点击高亮显示边框
		 */
		bindListItemClick: function() {
			// 列表点选高亮显示
			jQuery("div[data-view='defense'] #defenseList div.item").unbind("click");
			jQuery("div[data-view='defense'] #defenseList div.item").click(function() {
				jQuery(this).addClass("selected").siblings(".item").removeClass("selected");

			});
		},
		/*
		 *	绑定相关按钮事件
		 */
		bindEvents: function() {
			var self = this;
			// 新增按钮事件
			//jQuery("div[data-view='defense'] button#add").unbind("click");
			jQuery("div[data-view='defense'] button#add").click(function(evt) {
				var defenseView = jQuery("div[data-view='defense']");
				defenseView.find(".group1").hide();
				defenseView.find("#defenseForm").show();
				defenseView.find("#defenseForm input#name").val("");
				defenseView.find("#defenseForm  #lineDescription").val("");
				// 清除之前的数据
				PVAMap.options.map.clearOverlays();


			});

			// 返回
			jQuery("div[data-view='defense'] button#back").unbind("click");
			jQuery("div[data-view='defense'] button#back").click(function() {
				jQuery("div[data-view='defense']").find(".group1").show();
				jQuery("div[data-view='defense']").find("#defenseForm").hide();

			});

			// 电子防线重名验证
			jQuery("div[data-view='defense'] input#name").unbind("blur");
			jQuery("div[data-view='defense'] input#name").blur(function() {
				var el = jQuery(this);
				var name = el.val().trim();
				if (name !== "") {
					if (!self.checkName(name)) {
						if (!el.hasClass("warn")) {
							el.addClass("warn");
						}
						notify.warn("该名称已存在！");
						self.validateFlag = false;
						return false;

					} else {
						el.removeClass("warn");
						self.validateFlag = true;
					}
				}

			});


			//新建 -> 提交表单 
			jQuery("div[data-view='defense'] button#sure").unbind("click");
			jQuery("div[data-view='defense'] button#sure").click(function() {

				var form = jQuery("div[data-view='defense']").find("#defenseForm");
				var points = mapSettings.mapMgr.getPolygonPoints();

				if (points) {
					var obj = {
						name: form.find("#name").val(),
						description: form.find("#lineDescription").val(),
						color: form.find("#chooseColor").val(),
						type: 1,
						pointinfo: JSON.stringify(points),
						code: "E11",
						area: mapSettings.mapMgr.getPolygonArea(),
						zoom: mapSettings.mapMgr.getZoom()
					};

					if (obj.name === "") {
						notify.warn("名称不能为空！");
						return false;
					} else if (obj.name.length > 50) {
						notify.warn("名称长度不大于50字符！");
						return false;
					} else if (obj.description.length > 200) {
						notify.warn("描述长度不大于200字符！");
						return false;
					} else {
						// 保存信息时再次进行重名验证
						if (!self.validateFlag) {
							var el = jQuery("div[data-view='defense'] input#name");
							var name = el.val().trim();

							if (!self.checkName(name)) {
								if (!el.hasClass("warn")) {
									el.addClass("warn");
								}
								notify.warn("该名称已存在！");
								return false;

							} else {
								el.removeClass("warn");
							}
						}
					}

					self.saveEleDefenseLine(obj, function() {
						jQuery(".tab-panel  .tabs li[data-tab='defense']").click();
					});
				} else {
					notify.warn("请在地图上添加防线！");
				}

			});

			// 选择颜色
			jQuery("#chooseColor").spectrum({
				color: "#ff0000",
				showInput: true,
				className: "full-spectrum",
				showInitial: true,
				showPalette: true,
				showSelectionPalette: true,
				maxPaletteSize: 10,
				preferredFormat: "hex",
				localStorageKey: "spectrum.demo",
				cancelText: "取消",
				chooseText: "确定",
				move: function(color) {

				},
				show: function() {

				},
				beforeShow: function() {

				},
				hide: function() {

				},
				change: function() {

				},
				palette: [
					"rgb(0, 0, 0)", "rgb(67, 67, 67)", "rgb(102, 102, 102)", "rgb(204, 204, 204)", "rgb(217, 217, 217)",
					"rgb(255, 255, 255)", "rgb(28, 69, 135)", "rgb(7, 55, 99)", "rgb(32, 18, 77)", "rgb(76, 17, 48)",
					"rgb(152, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 153, 0)", "rgb(255, 255, 0)", "rgb(0, 255, 0)",
					"rgb(0, 255, 255)", "rgb(74, 134, 232)", "rgb(0, 0, 255)", "rgb(153, 0, 255)", "rgb(255, 0, 255)",
					"rgb(230, 184, 175)", "rgb(244, 204, 204)", "rgb(252, 229, 205)", "rgb(255, 242, 204)", "rgb(217, 234, 211)",
					"rgb(208, 224, 227)", "rgb(201, 218, 248)", "rgb(207, 226, 243)", "rgb(217, 210, 233)", "rgb(234, 209, 220)",
					"rgb(221, 126, 107)", "rgb(234, 153, 153)", "rgb(249, 203, 156)", "rgb(255, 229, 153)", "rgb(182, 215, 168)",
					"rgb(162, 196, 201)", "rgb(164, 194, 244)", "rgb(159, 197, 232)", "rgb(180, 167, 214)", "rgb(213, 166, 189)",
					"rgb(204, 65, 37)", "rgb(224, 102, 102)", "rgb(246, 178, 107)", "rgb(255, 217, 102)", "rgb(147, 196, 125)",
					"rgb(118, 165, 175)", "rgb(109, 158, 235)", "rgb(111, 168, 220)", "rgb(142, 124, 195)", "rgb(194, 123, 160)",
					"rgb(166, 28, 0)", "rgb(204, 0, 0)", "rgb(230, 145, 56)", "rgb(241, 194, 50)", "rgb(106, 168, 79)",
					"rgb(69, 129, 142)", "rgb(60, 120, 216)", "rgb(61, 133, 198)", "rgb(103, 78, 167)", "rgb(166, 77, 121)",
					"rgb(91, 15, 0)", "rgb(102, 0, 0)", "rgb(120, 63, 4)", "rgb(127, 96, 0)", "rgb(39, 78, 19)",
					"rgb(12, 52, 61)"
				]
			});


			// 选择工具 - 画线
			jQuery("div[data-view='defense'] #defenseForm a.tool-line").unbind("click");
			jQuery("div[data-view='defense'] #defenseForm a.tool-line").click(function() {
				jQuery(this).addClass("active").siblings().removeClass("active");

			});

			// 选择工具 - 画面
			jQuery("div[data-view='defense'] #defenseForm a.tool-cover").unbind("click");
			jQuery("div[data-view='defense'] #defenseForm a.tool-cover").click(function(evt) {
				jQuery(this).addClass("active").siblings().removeClass("active");

				mapSettings.lineColor = jQuery("div[data-view='defense']").find("#chooseColor").val();
				mapSettings.mapMgr.drawCover(mapSettings.lineColor, evt);
			});

		},
		/*
		 *	显示多边形
		 */
		showPolygon: function(data, color, zoom) {
			mapSettings.mapMgr.showPolygon(data, color, zoom);
		}

	});

	function checkAdmin(){
		if(jQuery("#userEntry").data("loginname") == 'admin'){
			return 1;
		}else{
			return jQuery("#userEntry").attr("data-orgid");
		}
	};

	// 页面初始化
	(function init() {
		// 请求模板
		jQuery.get("/module/settings/mapconfig/inc/map-config.html", function(text) {
			mapSettings.template = Handlebars.compile(text);
		});


		// gismap
		var mapMgr = mapSettings.mapMgr = new MapMgr();

		// 地图标注
		// var mapMarkMgr = mapSettings.mapMarkMgr = new MapMarkMgr();

		// 电子防线
		var eleDefenseLineMgr = window.eleDefenseLineMgr = mapSettings.eleDefenseLineMgr = new EleDefenseLineMgr();

		// 创建左侧的摄像机树
		var cameraTree = mapSettings.cameraTree = new Camera({

			"node": "#leftTreePanel",

			"extraParams":{
				isRoot:1
			},
			"orgId": checkAdmin(),

			"leafClick": function(el, event) {

				var li = el.closest("li");

				var camera = {
					"id": li.attr("data-id"),
					"name": li.attr("data-name"),
					"lon": li.attr("data-lon"),
					"lat": li.attr("data-lat"),
					"cameraCode":li.attr("data-code"),
					"zoom":li.attr("data-zoom")
				};

				// camera.lon = "13461198.930737501";
				// camera.lat = "3663097.063535105";

				var follower = jQuery("#follower");

				if (camera.lat && camera.lat) {
					if (follower.length >= 0) {
						follower.hide();
					}
					mapMgr.showCamera(camera, li);
				} else {


					var className = "drag-helper-icon";
					if (li.children("i.leaf").hasClass("dom")) {
						className = "drag-helper-icon-alt";
					}

					if (follower.length === 0) {
						follower = jQuery("<div id='follower' class='" + className + "'></div>");
						jQuery("body").append(follower);
					} else {
						follower.removeClass("drag-helper-icon").removeClass("drag-helper-icon-alt").addClass(className);
					}


					follower.css({
						"top": event.clientY + 12,
						"left": event.clientX + 12
					}).show();

					jQuery("#content").unbind("mousemove");
					jQuery("#content").mousemove(function(evt) {
						follower.css({
							"top": evt.clientY + 12,
							"left": evt.clientX + 12
						});
					});
					PVAMap.options.map.addEventListener(NPMapLib.MAP_EVENT_MOUSE_MOVE, function(point, mouseevent) {
						if(jQuery(".map-tool-fullscreen").is(":hidden")){
							// follower.css({
							// 	"top": mouseevent.y + 12+38,	
							// 	"left": mouseevent.x + 12 
							// });
							follower.css({
								"top": mouseevent.clientY  + 12,	
								"left": mouseevent.clientX  + 12 
							});
						}else{
							// follower.css({
							// 	"top": mouseevent.y + 12 +135,
							// 	"left": mouseevent.x + 12 + 280
							// });
							follower.css({
								"top": mouseevent.clientY + 12,
								"left": mouseevent.clientX + 12 
							});
						}
					});

					// 右键取消(点位标注跟随图标)
					jQuery("#content").unbind("mousedown");
					jQuery("#content").mousedown(function(e) {
						if (e.button === 2) {
							jQuery("#content").unbind("mousedown");
							jQuery("#content").unbind("mousemove");
							follower.hide();
							PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
							// if (NPMapLib.MAP_EVENT_MOUSE_MOVE) {
							// 	PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_MOUSE_MOVE);
							// 	follower.hide();
							// }
						}

					});

					PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK);
					PVAMap.options.map.addEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK, function(point) {
						// 取消左键点击事件
						PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
						PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_MOUSE_MOVE);
						follower.hide();
						// 取消右击事件
						PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK);
						// self.options.drawtool.cancel()
					});

					mapMgr.addCamera(camera, li);
				}

			}
		});
		// by chencheng 超管特殊处理  其他自动展开到当前组织 @date 2014-11-4
        // // 默认展开第一级组织机构
        // $(cameraTree.options.node).on("treeExpandSuccess",function(){
        //     $(this).find("ul>li.root.tree>i.fold").triggerHandler("click");
        // });

		//搜索按钮点击事件
		jQuery("#searchBtn").bind("click", function(event) {
			var key = jQuery("#searchInput").val().trim();
			mapSettings.cameraTree.search({
				queryKey: key
			});
			//jQuery("#searchInput").val("");

			return false;

		});


		jQuery("#searchInput").watch({
			wait: 500,
			captureLength: 0,
			//监听的输入长度
			callback: function(key) {
				mapSettings.cameraTree.search({
					queryKey: jQuery.trim(key)
				});
			}
		});


		// 高级按钮搜索
		jQuery("#advanceSearch").bind("click", function(event) {
			jQuery("#aside div.normal-search-panel").hide();
			jQuery("#aside div.advance-search-panel").show().find("#cameraName").val("");
			jQuery("#aside .tree-container").css("top", "120px");
			mapSettings.cameraTree.updateScrollBar();
			return false;
		});

		// 高级面板-搜索[Yes]
		jQuery("#advSearch").bind("click", function(event) {
			var input = jQuery("#aside div.advance-search-panel #cameraName");
			var name = input.val().trim();

			mapSettings.cameraTree.search({
				queryKey: name,
				isMarked: jQuery("#markStatus option:selected").val()
			});
			//input.val("");//高级搜索时不清空
			return false;
		});

		jQuery("#aside div.advance-search-panel #cameraName").watch({
			wait: 500,
			captureLength: 0,
			//监听的输入长度
			callback: function(key) {
				mapSettings.cameraTree.search({
					queryKey: jQuery.trim(key),
					isMarked: jQuery("#markStatus option:selected").val()
				});
			}
		});

		// 高级面板-取消[No]
		jQuery("#advCancel").bind("click", function(event) {
			jQuery("#aside div.normal-search-panel").show();
			jQuery("#aside div.advance-search-panel").hide();
			jQuery("#aside .tree-container").css("top", "40px");
			// mapSettings.cameraTree.updateScrollBar();
			jQuery("#searchBtn").click();
			return false;
		});



		// tab 切换
		jQuery(".tab-panel  .tabs li").bind("click", function() {

			var el = jQuery(this);
			var panel = el.closest(".tab-panel");

			el.addClass("active").siblings().removeClass("active");
			panel.children(".tab-header").children("div[data-hview=" + el.attr("data-tab") + "]").addClass("active").siblings().removeClass("active");
			panel.children(".tab-content").children("div[data-view=" + el.attr("data-tab") + "]").addClass("active").siblings().removeClass("active");

			// 控制搜索框的显隐 (点位标注)
			if (el.attr("data-tab") === "mark") {
				if (NPMapLib.MAP_EVENT_CLICK) {
					PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
				}
				if (PVAMap.options.infowindow) {
					PVAMap.options.infowindow.close();
					PVAMap.options.infowindow = null;
				}
				PVAMap.options.map.clearOverlays();
				mapSettings.mapMgr.hideInfo();

			} else {
				// (高级搜索)恢复搜索初始状态  如果含有地图标注的权限,则更新资源树的状态 否则什么都不做
				if(jQuery(".tab-panel  .tabs li[data-tab='mark']").length > 0){
					jQuery("#advCancel").click();
				}

				if (PVAMap.options.infowindow) {
					PVAMap.options.infowindow.close();
					PVAMap.options.infowindow = null;
				}
				if (NPMapLib.MAP_EVENT_CLICK) {
					PVAMap.options.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
				}
				PVAMap.options.map.clearOverlays();
				mapSettings.mapMgr.hideInfo();
				mapSettings.eleDefenseLineMgr.reload();

				jQuery("div[data-view='defense']").find(".group1").show();
				jQuery("div[data-view='defense']").find("#defenseForm").hide();
			}
		});
		
		//屏蔽地图右键
		jQuery("#mapId > div.olMapViewport").bind('contextmenu', function() {
			return false;
		});
	})();


});
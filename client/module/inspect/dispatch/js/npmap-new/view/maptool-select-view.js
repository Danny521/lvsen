/*global NPMapLib:true*/
/**
 * 地图上框选、圈选
 * @author Li Dan
 * @date   2014-12-12
 */
define(['js/npmap-new/map-init','js/npmap-new/map-variable', 'pubsub', 'js/npmap-new/map-common', 'js/npmap-new/controller/mapsearch-common-fun',
		'js/npmap-new/map-const', 'js/npmap-new/view/maptool-fullscreen-view',
		"js/connection/view/left-for-map-select-view", "js/npmap-new/mapsearch-variable",
		"js/npmap-new/map-common-overlayer-ctrl",
		'jquery', 'npmapConfig'],

	function(PVAMap, Variable, pubsub, MapCommon, SearchCommon, Constant, FullScreen, LeftForMapSelectView, _g, MapOverLayerCtrl){

		var mapSelectView = function(){

			var self = this;

			//订阅事件，周围搜索摄像机时调用 by zhangyu on 2014/12/22
			pubsub.subscribe("showResultOnSearch", function(msg, data) {
				//地图撒点
				self.setCamerasToMap(data.result, data.from);
			});
		};

		mapSelectView.prototype = {
			//逻辑控制器对象
			controller: null,
			/**
			 * 初始化
			 * @param controller - 逻辑控制器
			 */
			init: function(controller) {
				this.controller = controller;
			},
			/**
			 * 地图工具栏选择功能项点击后的处理程序
			 * @param context - 事件的执行上下文
			 */
			dealOnClickSelectItem: function(context) {
				var This = jQuery(context), self = this, $pObj = jQuery("#map-tool-right");
				if (This.find("a.map-select").hasClass("rect")) {
					self.dealOnMapSelect($pObj.find(".map-tool-item .map-select-list li")[0]);
				} else if (This.find("a.map-select").hasClass("circle")) {
					self.dealOnMapSelect($pObj.find(".map-tool-item .map-select-list li")[1]);
				}
			},
			/**
			 * 地图框选、圈选点击后的处理程序
			 * @param context - 事件的执行上下文
			 */
			dealOnMapSelect: function(context) {
				var self = this;
				//第一步，根据当前视野范围内的摄像机个数来提示用户当前层级是否适合框选
				var extent = Variable.map.getExtent();
				if(self.controller.getCamerasNumByScope(extent) > mapConfig.selectLimitNum) {
					notify.warn("当前图层上的摄像机数量过多，建议放大图层后再进行选择！");
					return;
				}
				//第二步，只显示摄像机资源
				MapOverLayerCtrl.showAndHideOverLayers("on-rect-or-circle-map-select");
				//第三步，触发框选/圈选功能
				var $pSelectObj = jQuery(context).parents(".map-tool-item");
				if (jQuery(context).children(".map-rectangle-select")[0]) {
					$pSelectObj.find("i.select").attr("class", "map-tool-i select rect");
					$pSelectObj.find("a.map-select").attr("class", "map-select rect");
					self.rectSelect();
					//清除报警
					MapCommon.IfClickAlarmInfo();
					return;
				}
				if (jQuery(context).children(".map-circle-select")[0]) {
					$pSelectObj.find("i.select").attr("class", "map-tool-i select circle");
					$pSelectObj.find("a.map-select").attr("class", "map-select circle");
					self.circleSelect();
					MapCommon.IfClickAlarmInfo();
				}
				if (jQuery(context).children(".map-line-select")[0]) {
					$pSelectObj.find("i.select").attr("class", "map-tool-i select line");
					$pSelectObj.find("a.map-select").attr("class", "map-select line");
					self.lineSelect();
					MapCommon.IfClickAlarmInfo();
				}
				if (jQuery(context).children(".map-polygon-select")[0]) {
					$pSelectObj.find("i.select").attr("class", "map-tool-i select polygon");
					$pSelectObj.find("a.map-select").attr("class", "map-select polygon");
					self.polygonSelect();
					MapCommon.IfClickAlarmInfo();
				}
			},
			/**
			 * 框选
			 * @author Li Dan
			 * @date   2014-12-12
			 * @return {[type]}   [description]
			 */
			rectSelect: function(){
				var self = this;
				//设置选择模式
				Variable.drawtool.setMode(NPMapLib.DRAW_MODE_RECT, function(extent, geometry, rings) {
					self.rectCircleSelectCallback(extent, geometry, rings);
				});
				this.isDrawing = true;
				this.DrawType = 0; //表示框选，加日志的时候作为区别
				//激活鼠标文字跟踪
				Variable.map.activateMouseContext("按住鼠标左键开始绘制,</br>释放完成绘制。");
			},
			/**
			 * 圈选
			 * @author Li Dan
			 * @date   2014-12-12
			 * @return {[type]}   [description]
			 */
			circleSelect: function(){
				var self = this;
				//设置选择模式
				Variable.drawtool.setMode(NPMapLib.DRAW_MODE_CIRCLE, function(extent, geometry, rings, circlerings) {
					self.rectCircleSelectCallback(extent, geometry, rings, circlerings);
				});
				this.isDrawing = true;
				this.DrawType = 1; //表示圈选，加日志的时候作为区别
				//激活鼠标文字跟踪
				Variable.map.activateMouseContext("按住鼠标左键开始绘制,</br>释放完成绘制。");
			},
			/**
			 * 线选
			 * @author Li Dan
			 * @date   2015-09-14
			 * @return {[type]}   [description]
			 */
			lineSelect: function(){
				var self = this;
				//设置画笔
				Variable.drawtool.setMode(NPMapLib.DRAW_MODE_POLYLINE, function (extent, geometry, rings) {
					self.lineDrawCallback(extent, geometry, rings);
				});
				this.isDrawing = true;
				//激活鼠标文字跟踪
				Variable.map.activateMouseContext("按住鼠标左键开始绘制,</br>释放完成绘制。");
			},
			/**
			 * 多边形选
			 * @author Li Dan
			 * @date   2015-09-14
			 * @return {[type]}   [description]
			 */
			polygonSelect: function(extent, geometry, rings){
				var self = this;
				//设置画笔
				Variable.drawtool.setMode(NPMapLib.DRAW_MODE_POLYLGON, function (extent, geometry, rings) {
					self.rectCircleSelectCallback(extent, geometry, rings);
				});
				this.isDrawing = true;
				//激活鼠标文字跟踪
				Variable.map.activateMouseContext("按住鼠标左键开始绘制,</br>释放完成绘制。");
			},
			/**
			 * 多边形选回调函数
			 * @author Li Dan
			 * @date   2015-09-14
			 * @return {[type]}   [description]
			 */
			lineDrawCallback: function(extent, geometry, rings){
				var self = this;
				//注销鼠标跟踪文本
				Variable.map.deactivateMouseContext();
				//绘制新的缓冲区
				var params = new NPMapLib.Services.bufferParams();
				params.projection = Variable.map.getProjection();
				params.distance = 50;
				params.units = "m";
				params.geometry = geometry; //需要数据转换
				if (!PVAMap.geometryService) {
					PVAMap.geometryService = new NPMapLib.Services.BufferService(Variable.map, NPMapLib.MAPTYPE_NPGIS);
				}
				var buffer = PVAMap.geometryService.buffer(mapConfig.geometryServiceUrl, params, function(result){
					//缓冲区数据 geoJSON格式
					var bufferPoints = [];
					for (var i = 0, j = result.rings.length; i < j; i++) {
						var arr = JSON.parse(MapCommon.convertArrayToGeoJson(result.rings[i], "Polygon"));
						bufferPoints.push(arr.coordinates[0]);
					}
					self.rectCircleSelectCallback("", "", "", result.rings[0]);
				});
			},
			/**
			 * 框选、圈选回调
			 * @author Li Dan
			 * @date   2014-12-12
			 * @param  {[type]}   extent      [description]
			 * @param  {[type]}   geometry    [description]
			 * @param  {[type]}   rings       [description]
			 * @param  {[type]}   circlerings [description]
			 * @return {[type]}               [description]
			 */
			rectCircleSelectCallback: function(extent, geometry, rings, circlerings){
				this.isDrawing = false;
				//注销鼠标文字跟踪
				Variable.map.deactivateMouseContext();
				var points = "";
				if (circlerings) {
					points = MapCommon.convertArrayToGeoJson(circlerings, "Polygon");
				} else {
					points = MapCommon.convertArrayToGeoJson(geometry._points, "Polygon");
				}
				//发布搜索订阅
				var data = {
					geometry: points,
					current_page: 1,
					page_size: 20
				};
				pubsub.publish("pageGeometryCamera", data);
			},
			/**
			 * 搜索发送前处理
			 * @author Li Dan
			 * @date   2014-12-12
			 * @return {[type]}   [description]
			 */
			beforeSendSearch: function(){
				jQuery('#camerasPanel').addClass('loading');
			},
			/**
			 * 搜索成功后处理
			 * @author Li Dan
			 * @date   2014-12-12
			 * @return {[type]}   [description]
			 */
			searchSuccess: function(result){
				logDict.insertLog('m1', 'f2', 'o9', '', '摄像机');
				jQuery('#camerasPanel').removeClass('loading');
				//地图撒点
				this.setCamerasToMap(result, "rectcircle", true);
			},
			/**
			 * 在地图上撒点
			 * @param resultdata - 待展现的摄像机类容
			 * @param from - 附近搜索、视野范围内搜索时有效
			 * @param isSelect - 是否是框选、圈选标记位
			 */
			setCamerasToMap: function(resultdata, from, isSelect) {
				//图层切换
				MapOverLayerCtrl.showAndHideOverLayers("show-select-range-circle-camera-on-result", from);
				//存储当前数据类型
				_g.curDataType = "camera";
				_g.curDataFromTag = from;
				//如果是周围搜索摄像机
				if (from === "around") {
					//标记中心点
					SearchCommon.markCircleCenter();
					//清除掉中心点数据（如果结果中存在中心点数据，则需要清除）
					SearchCommon.clearSearchCenterData(resultdata.data.cameras);
				}
				if (typeof(resultdata.data) != "object") {
					return
				}
				if (!resultdata.data.cameras) {
					return
				}
				var cameraNum = resultdata.data.cameras.length;
				for (var i = 0; i < cameraNum; i++) {
					//点位信息
					var point = new NPMapLib.Geometry.Point(resultdata.data.cameras[i].longitude, resultdata.data.cameras[i].latitude);
					//标注
					var marker = new NPMapLib.Symbols.Marker(point);
					//图片标注
					var symbolInfo = SearchCommon.getSymbolByDataType("camera", false, "search");
					//创建文件标注，目的：记录当前监控点的信息，参数 id,title,img
					var label = new NPMapLib.Symbols.Label(Constant.letters[i]);
					label.setStyle({
						Color: "#ffffff"
					});
					label.setOffset(symbolInfo.labelOffset);
					marker.setIcon(symbolInfo.symbol);
					marker.setLabel(label);
					//记录摄像机信息
					marker.setData($.extend(resultdata.data.cameras[i], {
						markerType: "search-marker"
					}));
					//添加该覆盖物
					Variable.layers.searchResultLayer.addOverlay(marker);
					Variable.layers.searchResultLayer.setZIndex(500);
					//添加鼠标悬浮事件
					marker.addEventListener(NPMapLib.MARKER_EVENT_MOUSE_OVER, function (marker) {
						//如果当前摄像机点位已经被选中，则不再进行图标刷新
						if (marker.getData().longitude === Variable.lastClickData.longitude && marker.getData().latitude === Variable.lastClickData.latitude) {
							return;
						}
						//刷新图标
						var symbolInfo = SearchCommon.getSymbolByDataType("camera", true, "search");
						marker.setIcon(symbolInfo.symbol);
						marker.getLabel().setOffset(symbolInfo.labelOffset);
						marker.refresh();
						//响应左侧搜索结果列表
						LeftForMapSelectView.linkageToMapResultHover(marker.getData().id);
					});
					//添加鼠标移出事件
					marker.addEventListener(NPMapLib.MARKER_EVENT_MOUSE_OUT, function (marker) {
						//如果当前摄像机点位已经被选中，则不再进行图标刷新
						if (marker.getData().longitude === Variable.lastClickData.longitude && marker.getData().latitude === Variable.lastClickData.latitude) {
							return;
						}
						//刷新图标
						var symbolInfo = SearchCommon.getSymbolByDataType("camera", false, "search");
						marker.setIcon(symbolInfo.symbol);
						marker.getLabel().setOffset(symbolInfo.labelOffset);
						marker.refresh();
						//响应左侧搜索结果列表
						LeftForMapSelectView.linkageToMapResultHoverout(marker.getData().id);
					});
					//添加鼠标点击事件
					marker.addEventListener(NPMapLib.MARKER_EVENT_CLICK, function (marker) {
						//如果当前摄像机点位已经被选中，则不再进行图标刷新
						if (marker.getData().longitude === Variable.lastClickData.longitude && marker.getData().latitude === Variable.lastClickData.latitude) {
							return;
						}
						//设置当前活动摄像机标注
						Variable.currentCameraData = marker.getData();
						//显示摄像机信息窗口
						MapCommon.showCameraInfoAndPlay(marker);
						//响应左侧搜索结果列表
						LeftForMapSelectView.linkageToMapResultClick(marker.getData().id);
					});
				}
				//判断是否是输入搜索(第一个判断是视野范围内输入搜索摄像机用，第二个判断是附近输入搜索摄像机用)
				if (resultdata.extern || _g.isInputSearch) {
					LeftForMapSelectView.showInputResult(resultdata.data, from);
				} else {
					//左侧显示搜索结果
					LeftForMapSelectView.showSelectResult(resultdata.data, isSelect, from);
				}
				//退出全屏
				if (jQuery("#map-tool-right").find(".map-tool-item .map-exitfullscreen")[0]) {
					FullScreen.confirmExitFullscreen();
				}
			},
			/**
			 * 点击搜索结果的播放按钮/双击搜索结果项，响应地图元素，播放摄像机视频
			 * @param cameraId - 待比较的摄像机id
			 * @private
			 */
			linkageToMapGeometry: function(cameraId) {
				var markers = Variable.layers.searchResultLayer._overlays;
				try {
					for (var key in markers) {
						if (markers.hasOwnProperty(key) && markers[key].getData()) {
							var cameraData = markers[key].getData();
							//响应地图中该点
							if (cameraData.id === cameraId) {
								//刷新图标
								var symbolInfo = SearchCommon.getSymbolByDataType("camera", true, "search");
								markers[key].setIcon(symbolInfo.symbol);
								markers[key].getLabel().setOffset(symbolInfo.labelOffset);
								markers[key].refresh();
								//播放视频
								Variable.currentCameraData = cameraData;
								//在地图上居中该点
								var point = new NPMapLib.Geometry.Point(cameraData.longitude, cameraData.latitude);
								Variable.map.setCenter(point);
								//播放摄像机视频
								MapCommon.showCameraInfoAndPlay(markers[key]);
							}
						}
					}
				} catch (e) {}
			},
			/**
			 * 悬浮搜索结果
			 * @param camera - 鼠标移入的摄像机数据
			 */
			hoverSearchResultItem: function(camera) {
				//如果悬浮摄像机是当前已选中摄像机，撤销悬浮效果
				if (camera.longitude === parseFloat(Variable.lastClickData.longitude) && camera.latitude === parseFloat(Variable.lastClickData.latitude)) {
					return;
				}
				var markers = Variable.layers.searchResultLayer._overlays;
				try {
					for (var key in markers) {
						if (markers.hasOwnProperty(key) && markers[key].getData()) {
							//响应地图中该点
							if (markers[key].getData().id === camera.id) {
								var symbolInfo = SearchCommon.getSymbolByDataType("camera", true, "search");
								markers[key].setIcon(symbolInfo.symbol);
								markers[key].getLabel().setOffset(symbolInfo.labelOffset);
								markers[key].refresh();
								markers[key].setZIndex(1000);
							}
						}
					}
				} catch (e) {}
			},
			/**
			 * 鼠标移出搜索结果
			 * @param camera - 鼠标移出的摄像机数据
			 **/
			hoveroutSearchResultItem: function(camera) {
				//如果悬浮摄像机是当前已选中摄像机，撤销悬浮效果
				if (camera.longitude === parseFloat(Variable.lastClickData.longitude) && camera.latitude === parseFloat(Variable.lastClickData.latitude)) {
					return;
				}
				var markers = Variable.layers.searchResultLayer._overlays;
				try {
					for (var key in markers) {
						if (markers.hasOwnProperty(key) && markers[key].getData()) {
							//响应地图中该点
							if (markers[key].getData().id === camera.id) {
								var symbolInfo = SearchCommon.getSymbolByDataType("camera", false, "search");
								markers[key].setIcon(symbolInfo.symbol);
								markers[key].getLabel().setOffset(symbolInfo.labelOffset);
								markers[key].refresh();
							}
						}
					}
				} catch (e) {}
			}
		};

		return new mapSelectView();
});

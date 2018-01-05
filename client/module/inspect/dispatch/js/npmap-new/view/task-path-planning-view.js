/**
 * [路径规划视图]
 * @author Li Dan
 * @date   2015-07-27
 * @param  {[type]}   ){} [地图上的变量、地图上的通用方法、地图上的常量、jquery库]
 * @return {[type]}         [description]
 */
define([
	"js/npmap-new/map-variable",
	"js/sidebar/sidebar",
	"js/npmap-new/map-common",
	"js/npmap-new/map-const",
	"jquery",
	"js/connection/controller/left-favorite-route-controller",
	"js/npmap-new/map-infowindow",
	"handlebars"
], function(Variable, SideBar, MapCommon, MapConst, jQuery, FavoriteRouteController, Infowindow) {

	return (function(scope, $) {

		var
		//控制器对象 
			_controller = null,
			//模板对象
			_compiler = null,
			//模板页面
			_templateUrl = 'inc/map/map_path_planning.html',
			//起始标注
			_startMarker = null,
			//结束标注
			_endMarker = null,
			
			//路径分析服务
			service = null,
			//几何服务
			_geometryService = null,
			//搜索状态
			_searchStatus = {
				trafficModel: "car",
				routeType: 1
			},
			//高亮路线
			_HighLightPolyline = null,
			//缓冲区坐标
			_bufferPoint = null,
			//摄像机标注
			_cameraMarkers = [],
			//卡口标注
			_bayonetMarkers = [],
			//起点名称
			_startPointName = "我的标记",
			//终点名称
			_endPointName = "我的标记",
			//事件处理程序
			_eventHandler = {
				//选择驾车/步行
				SelectWays: function(e) {
					_selectWays.call(this);
					e.stopPropagation();
				},
				//在地图上选择起点或者终点
				GetPointOnMap: function(e) {
					_getPointOnMap.call(this);
					e.stopPropagation();
				},
				//搜索路线
				SearchPath: function(e) {
					_searchPath();
					e.stopPropagation();
				},
				//交换起点和终点
				SwitchPoints: function(e) {
					_switchPoints();
					e.stopPropagation();
				}
			},
			//搜索结果事件处理程序
			_resultEventHandler = {
				//选择路线：最短时间、最短距离、不走高速
				SelectRoute: function(e) {
					_SelectRoute.call(this);
					e.stopPropagation();
				},
				//路线收缩
				ContentContract: function(e) {
					_ContentContract.call(this);
					e.stopPropagation();
				},
				//高亮路线
				HighLightRoute: function(e) {
					_HighLightRoute.call(this);
					e.stopPropagation();
				},
				//收藏路线
				CollectRoute: function(e) {
					_CollectRoute.call(this);
					e.stopPropagation();
				},
				//发送到手机
				SendToPhone: function(e) {
					_SendToPhone.call(this);
					e.stopPropagation();
				}
			};
		//地址窗口事件处理程序
		_addressWinEventHandler = {
			//在地图上标注起点
			MarkPointOnMap: function() {
				_markPointOnMap.call(this);
			},
			//清除历史地址
			ClearHistoryAddress: function(e) {
				_clearHistoryAddress.call(this);
				e.stopPropagation();
			},
			//关闭窗口
			CloseAddressWin: function(e) {
				_closeAddressWin.call(this);
				e.stopPropagation();
			}
		};
		//途经点窗口事件处理
		_intermediateStopEventHandler = {
			//内容收缩
			ListContract: function(e) {
				_listContract.call(this);
				e.stopPropagation();
			},
			//复选框 显示或者隐藏复选框
			ShowOrHideStops: function(e) {
				_showOrHideStops.call(this);
				e.stopPropagation();
			}
		};
		//路径规划事件方法
		var
		//起点和终点输入框监测
			_watchInput = function() {
				$("input[name='start-point']").watch({
					wait: 200,
					captureLength: 0,
					//监听的输入长度
					callback: function(key) {
						if (key && key.trim()) {
							_getAddressByService($("input[name='start-point']"));
						} else {
							_getHistoryAddress($("input[name='start-point']"));
						}
					}
				});
				$("input[name='end-point']").watch({
					wait: 200,
					captureLength: 0,
					//监听的输入长度
					callback: function(key) {
						if (key && key.trim()) {
							_getAddressByService($("input[name='end-point']"));
						} else {
							_getHistoryAddress($("input[name='end-point']"));
						}
					}
				});
			},
			//选择路径
			_selectWays = function() {
				var el = $(this);
				//将其他tab置为灰色，当前tab置为高亮
				el.addClass('active').siblings().removeClass("active");
				//搜索状态赋值
				_searchStatus.trafficModel = el.data("type");
				//搜索框是否有填充
				//如果有填充，直接调用搜索
				var SearchForm = $(".route-search-container");
				if (SearchForm.find(".route-input-start input").val() && SearchForm.find(".route-input-end input").val()) {
					$("#routeSearchBtn").click();
				}
			},
			//在地图上获取坐标
			_getPointOnMap = function() {
				var el = $(this);
				var Input = el.parent().find("input");
				//临时方案 起点名称填写为“标点1”
				if (el.data('type') === 'start') {
					//开始在地图上进行标注
					_markOnMap("start", Input);
				}
				//临时方案 终点名称填写为“标点2”
				if (el.data('type') === 'end') {
					//开始在地图上进行标注
					_markOnMap("end", Input);
				}
			},
			//在地图上进行标注，参数：点位类型start/end,起点坐标，终点坐标
			_markOnMap = function(type, Input) {
				//注销地图点击事件
				if (NPMapLib.MAP_EVENT_CLICK) {
					Variable.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
				}
				// 添加文字提示
				Variable.map.activateMouseContext("点击左键标记位置，右键退出。");
				//更新鼠标样式
				window.map.removeHandStyle()
				window.map.setCursor('hand');
				//地图添加事件
				Variable.map.addEventListener(NPMapLib.MAP_EVENT_CLICK, function(point) {
					window.map.addHandStyle();
					// 取消文本提示
					Variable.map.deactivateMouseContext();
					//点位信息
					var position = new NPMapLib.Geometry.Point(point.lon, point.lat);
					//根据坐标获取地址
					_controller.getNameByCoor({
						lon: point.lon,
						lat: point.lat,
						Input: Input,
						type: type
					});
					// 移除点击事件
					Variable.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
				});
				// 绑定右键取消点击事件
				Variable.map.removeEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK);
				Variable.map.addEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK, function(point) {
					// 取消文本提示
					Variable.map.deactivateMouseContext();
					// 取消左键点击事件
					Variable.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
				});
			},
			//在地图上添加起点或者终点标注
			_addMarkerToMap = function(position, type, isCheck) {
				//图片标注
				var symbol = MapConst.symbol.markerSymbol();
				if (type === "start") {
					symbol = MapConst.guardRouteSymbol.startPoint();
				}
				if (type === "end") {
					symbol = MapConst.guardRouteSymbol.stopPoint();
				}
				//标注
				var marker = new NPMapLib.Symbols.Marker(position);
				marker.setIcon(symbol);
				var attributes = {
					name: "",
					remark: "",
					lon: position.lon,
					lat: position.lat
				};
				marker.setData(attributes);
				marker.setTitle("拖动改变路线");
				Variable.layers.routeAnalysisLayer.show();
				if (type === "start") {
					//如果已有起始点，则移除
					if (_startMarker && _startMarker.mapId) {
						_startMarker.setPosition(position);
					} else {
						_startMarker = marker;
						//添加覆盖物
						Variable.layers.routeAnalysisLayer.addOverlay(_startMarker);
						_startMarker.enableEditing();
						_startMarker.addEventListener(NPMapLib.MARKER_EVENT_DRAG_END, function() {
							//根据坐标获取地址
							require(['js/npmap-new/controller/task-path-planning-controller'], function(_controller) {
								_controller.getNameByCoor({
									lon: _startMarker._position.lon,
									lat: _startMarker._position.lat,
									Input: $("input[name='start-point']")
								});
								//如果已经含有终点，则直接进行搜索
								if ($("input[name='end-point']").val()) {
									_searchPath();
								}
							});
						});
					}
					//如果已经含有终点，则直接进行搜索
					if ($("input[name='end-point']").val()) {
						if (!isCheck) {
							_searchPath();
						}
					}
				}
				if (type === "end") {
					//如果已有终点，则移除
					if (_endMarker && _endMarker.mapId) {
						_endMarker.setPosition(position);
					} else {
						_endMarker = marker;
						//添加覆盖物
						Variable.layers.routeAnalysisLayer.addOverlay(_endMarker);
						_endMarker.enableEditing();
						_endMarker.addEventListener(NPMapLib.MARKER_EVENT_DRAG_END, function() {
							//根据坐标获取地址
							require(['js/npmap-new/controller/task-path-planning-controller'], function(_controller) {
								_controller.getNameByCoor({
									lon: _endMarker._position.lon,
									lat: _endMarker._position.lat,
									Input: $("input[name='end-point']")
								});
								//如果已经含有终点，则直接进行搜索
								if ($("input[name='start-point']").val()) {
									_searchPath();
								}
							});
						});
					}
					//如果已经含有起点，则直接进行搜索
					if ($("input[name='start-point']").val()) {
						if (!isCheck) {
							_searchPath();
						}
					}
				}
			},
			//获取历史搜索地址
			_getHistoryAddress = function(el) {
				var type = el.next().data("type");
				if (el.val()) {
					return;
				} else {
					_controller.getHistoryAddress({
						currentPage: 1,
						pageSize: 10,
						el: el,
						key: "",
						type: type
					});
				}
			},
			//通过地址匹配服务获取地址列表
			_getAddressByService = function(el) {
				var key = el.val(),
					type = el.next().data("type");
				if (key) {
					_controller.getAddressByName({
						el: el,
						type: type,
						keyWord: key
					});
				}
			},
			//设置数据到地址列表窗
			_setDataToAddressWin = function(el, data) {
				//移除之前的窗口
				if ($(".address-list")[0]) {
					$(".address-list").remove();
				}
				el.parent().append(_compiler({
					historyAddress: data
				}));
				//绑定地址窗口事件
				_bindAddressWinEvent();
			},
			//搜索路线
			_searchPath = function(isMapWin) {
				if(_startMarker === null){
					notify.warn("请输入正确的起点！");
					return;
				}
				if(_endMarker === null){
					notify.warn("请输入正确的终点！");
					return;
				}
				if(!isMapWin){
					var startInput = $(".route-input-box input[name='start-point']"),
						endInput = $(".route-input-box input[name='end-point']");
					if(startInput.val() === ""){
						notify.warn("请输入正确的起点！");
						return;
					}
					if(endInput.val() === ""){
						notify.warn("请输入正确的终点！");
						return;
					}
				}
				//交通方式:驾车/步行，路径类型：最短时间/最短距离/不走高速
				var trafficModel = _searchStatus.trafficModel,
					planRoadType = _searchStatus.routeType;
				//搜索服务
				var routeService = new NPMapLib.Services.RouteService(Variable.map, 7);
				var params = new NPMapLib.Services.routeParams();
				params.service = "na";
				params.request = "getroute";
				params.networkName = "shanghai_roadnet_supermap";
				//起始点
				params.startStop = _startMarker.getPosition();
				//终点
				params.endStop = _endMarker.getPosition();
				//通行方式 驾车 步行
				params.planRoadType = planRoadType;
				//计算方式 最短时间 最短距离 不走高速
				params.trafficModel = trafficModel;
				//障碍物
				params.geoBarriers = [];
				//算法类型
				params.algorithm = "Dijkstra";
				if (service) {
					service.abort();
				}
				if (isMapWin) {
					service = routeService.route(mapConfig.routeAnalysisService, params, _searchWinCallback);
				} else {
					service = routeService.route(mapConfig.routeAnalysisService, params, _searchCallback);
				}
			},
			//保存搜索地址
			_saveHistorySearch = function() {
				//记录搜索的地址
				//记录起点
				var startPoint = {
						type: "point",
						coordinate: [_startMarker._position.lon, _startMarker._position.lat]
					},
					startAddress = $(".route-input-start").find("input").data("address"),
					startName = $(".route-input-start").find("input").val(),
					startDistrictName = $(".route-input-start").find("input").data("districtname"),
					startGid = $(".route-input-start").find("input").data("gid"),
					searchedStart = {
						address: startAddress?startAddress:"",
						name: startName?startName:"我的标记",
						districtName: startDistrictName,
						gid: startGid,
						geometry: JSON.stringify(startPoint),

					};
				if(searchedStart.name !== "我的标记"){
					_controller.saveSearchedAddress(searchedStart);
				}
				//记录终点
				var endPoint = {
						type: "point",
						coordinate: [_endMarker._position.lon, _endMarker._position.lat]
					},
					endAddress = $(".route-input-end").find("input").data("address"),
					endName = $(".route-input-end").find("input").val(),
					endDistrictName = $(".route-input-end").find("input").data("districtname"),
					endGid = $(".route-input-end").find("input").data("gid"),
					searchedEnd = {
						address: endAddress?endAddress:"",
						name: endName?endName:"我的标记",
						districtName: endDistrictName,
						gid: endGid,
						geometry: JSON.stringify(endPoint)
					};
				if(searchedEnd.name !== "我的标记"){
					//记录终点
					_controller.saveSearchedAddress(searchedEnd);
				}
			},
			//距离单位转换
			_lengthConvert = function(length){
				if(length>1000){
					return (length/1000).toFixed(2) + "公里";
				}else{
					return length.toFixed(2) + "米";
				}
			},
			//时间转换
			_timeConvert = function(time){
				if(time>60){
					return (time/60).toFixed(2) + "小时";
				}else{
					return time.toFixed(2) + "分钟";
				}
			},
			//窗口搜索返回结果
			_searchWinCallback = function(result) {
				if (result.features.length > 0) {
					var data = {
						favoriteRoute: {
							startPointName: _startPointName,
							starPointLonlat: [result.messages.startPoint.lon, result.messages.startPoint.lat],
							endPointName: _endPointName,
							endPointLonlat: [result.messages.endPoint.lon, result.messages.endPoint.lat],
							routeLength: result.messages.length,
							time: result.messages.time,
							route: result.messages.segments,
							routeData: JSON.stringify(result.messages.segments),
							trafficModel: "car",
							routeType: 1,
							//数据转换
							routeLonlat: JSON.stringify(MapCommon.convertPointsToGeoJSON(result.features[0]._points))
						}
					};
					//左侧切换
					scope.showFavoriteRoute(data);
				} else {
					notify.warn("没有合适的路线！");
					return;
				}
			},
			//搜索返回结果
			_searchCallback = function(result) {
				//保存搜索地址
				_saveHistorySearch();
				if (result.features.length > 0) {
					var data = {
						startPointName: $(".route-input-start").find("input").val(),
						startPointLonlat: [result.messages.startPoint.lon, result.messages.startPoint.lat],
						endPointName: $(".route-input-end").find("input").val(),
						endPointLonlat: [result.messages.endPoint.lon, result.messages.endPoint.lat],
						routeLength: result.messages.length,
						time: result.messages.time,
						route: result.messages.segments,
						routeData: JSON.stringify(result.messages.segments),
						trafficModel: _searchStatus.trafficModel,
						routeType: _searchStatus.routeType,
						//数据转换
						routeLonlat: JSON.stringify(MapCommon.convertPointsToGeoJSON(result.features[0]._points))
					};
					//左侧显示搜索结果
					$(".route-search-result").empty().html(_compiler({
						SearchResult: data
					}));
					//步行 重新设置路径方式宽度
					/*var RouteTypeItem = $(".route-search-result .search-result-select li");
					if (_searchStatus.trafficModel === "walk") {
						RouteTypeItem.addClass("walk-model");
					} else {
						RouteTypeItem.removeClass("walk-model");
					}*/
					//绑定搜索结果事件
					_bindResultEvents();
					//地图上显示路径
					_showRouteOnMap(data.routeLonlat);
				} else {
					notify.warn("没有合适的路线！");
					return;
				}
			},
			//在地图上显示路径
			_showRouteOnMap = function(data) {
				data = JSON.parse(data);
				//显示图层
				Variable.layers.routeAnalysisLayer.show();
				//清除图层上的路线
				var removeOverlays = Variable.layers.routeAnalysisLayer._overlays;
				for (var key in removeOverlays) {
					if (removeOverlays[key].CLASS_NAME === "NPMapLib.Geometry.Polyline" || removeOverlays[key].CLASS_NAME === "NPMapLib.Geometry.Polygon") {
						Variable.layers.routeAnalysisLayer.removeOverlay(removeOverlays[key]);
					}
				}
				//绘制路线
				var points = [];
				for (var i = 0, j = data.coordinates.length; i < j; i++) {
					points.push(new NPMapLib.Geometry.Point(data.coordinates[i][0], data.coordinates[i][1]));
				}
				var Polyline = new NPMapLib.Geometry.Polyline(points);
				//在图层上加载新的路线
				Variable.layers.routeAnalysisLayer.show();
				Variable.layers.routeAnalysisLayer.addOverlay(Polyline);
				//在地图上显示虚线
				var length = data.coordinates.length;
				var startPoint = new NPMapLib.Geometry.Point(data.coordinates[0][0], data.coordinates[0][1]),
					endPoint = new NPMapLib.Geometry.Point(data.coordinates[length-1][0], data.coordinates[length-1][1]);
				var startpolyline = new NPMapLib.Geometry.Polyline([startPoint, _startMarker.getPosition()]),
					endpolyline = new NPMapLib.Geometry.Polyline([endPoint, _endMarker.getPosition()]);
				startpolyline.setLineStyle(NPMapLib.LINE_TYPE_DASH);
				endpolyline.setLineStyle(NPMapLib.LINE_TYPE_DASH);
				Variable.layers.routeAnalysisLayer.addOverlay(startpolyline);
				Variable.layers.routeAnalysisLayer.addOverlay(endpolyline);
				//居中显示路线
				var extent = Polyline.getExtent();
				Variable.map.zoomToExtent(extent);
				//显示缓冲区
				_getBuffer(Polyline);
			},
			/**
			 * 获取缓冲区
			 * @author Li Dan
			 * @date   2015-08-13
			 * @param  {[type]}   Polyline [description]
			 * @return {[type]}            [description]
			 */
			_getBuffer = function(Polyline) {
				//绘制新的缓冲区
				var params = new NPMapLib.Services.bufferParams();
				params.projection = Variable.map.getProjection();
				params.distance = 20;
				params.units = "m";
				params.geometry = Polyline; //需要数据转换
				if (!_geometryService) {
					_geometryService = new NPMapLib.Services.BufferService(Variable.map, NPMapLib.MAPTYPE_NPGIS);
				}
				var buffer = _geometryService.buffer(mapConfig.geometryServiceUrl, params, _showBuffer);
			},
			/**
			 * 显示缓冲区
			 * @author Li Dan
			 * @date   2015-08-13
			 * @param  {[type]}   result [description]
			 * @param  {[type]}   type   [description]
			 * @return {[type]}          [description]
			 */
			_showBuffer = function(result, type) {
				//缓冲区显示 NPGIS格式
				var temps = [],
					points = [];
				if (!type) {
					//从服务的回调接口中获取
					temps = result.rings;
				} else {
					//警卫路线编辑时，有现成的缓冲区数据
					points = result.coordinates;
					//数据转换
					for (var k = 0; k < points.length; k++) {
						var temp = [];
						for (var m = 0; m < points[k].length; m++) {
							var point = new NPMapLib.Geometry.Point(points[k][m][0], points[k][m][1]);
							temp.push(point);
						}
						if (temp.length > 0) {
							temps.push(temp);
						}
					}
				}
				//显示缓冲区
				var bufferResult = new NPMapLib.Geometry.Polygon(temps, {
					color: "#ACB9D1", //颜色
					fillColor: "#6980BC", //填充颜色
					weight: 1, //宽度，以像素为单位
					opacity: 1, //透明度，取值范围0 - 1
					fillOpacity: 0.7 //填充的透明度，取值范围0 - 1
				});
				Variable.layers.routeAnalysisLayer.addOverlay(bufferResult);
				//缓冲区坐标
				//geoJSON格式
				var bufferPoints = [];
				for (var i = 0, j = temps.length; i < j; i++) {
					var arr = JSON.parse(MapCommon.convertArrayToGeoJson(temps[i], "Polygon"));
					bufferPoints.push(arr.coordinates[0]);
				}
				_bufferPoints = {
					"type": "Polygon",
					"coordinates": bufferPoints
				};
				_bufferPoint = JSON.stringify(_bufferPoints);
				require(["js/npmap-new/controller/task-path-planning-controller"], function(_controller) {
					_controller.searchCameraNumByGeometry({
						geometry: _bufferPoint
					});
				});
			},
			/**
			 * 交换起点和终点
			 * @author Li Dan
			 * @date   2015-09-01
			 * @return {[type]}   [description]
			 */
			_switchPoints = function() {
				var startInput = $(".route-input-box input[name='start-point']"),
					endInput = $(".route-input-box input[name='end-point']");
				//填充input
				var startValue = startInput.val(), endValue = endInput.val();
				startInput.val(endValue);
				endInput.val(startValue);
				//交换_startMarker和_endMarker
				if(_startMarker && _endMarker){
					var startPosition = _endMarker._position, endPosition = _startMarker._position;
					_startMarker.setPosition(startPosition);
					_endMarker.setPosition(endPosition);
					if((startValue !== "") && (endValue !== "")){
						_searchPath();
					}
				}else if(_startMarker){
					_startMarker.setIcon(MapConst.guardRouteSymbol.stopPoint());
					_startMarker.refresh();
					_endMarker = _startMarker;
					_startMarker = null;
				}else if(_endMarker){
					_endMarker.setIcon(MapConst.guardRouteSymbol.startPoint());
					_endMarker.refresh();
					_startMarker = _endMarker;
					_endMarker = null;
				}
			};
		//搜索结果事件方法
		var
		//选择某种路径获取方式
			_SelectRoute = function() {
				var el = $(this);
				el.addClass('active').siblings().removeClass('active');
				//搜索状态赋值
				_searchStatus.routeType = el.data("type");
				//获取相应的路线并显示
				_searchPath();
			},
			//收缩搜索结果
			_ContentContract = function() {
				var el = $(this);
				if (el.hasClass("up")) {
					el.parent().next().slideUp(200);
					el.addClass('down').removeClass('up');
				} else if (el.hasClass('down')) {
					el.parent().next().slideDown(200);
					el.addClass('up').removeClass('down');
				}
			},
			//高亮某段路线
			_HighLightRoute = function() {
				var el = $(this);
				var routeLine = el.data("coordinate");
				//如果存在高亮路线，则移除
				if (_HighLightPolyline) {
					Variable.layers.routeAnalysisLayer.removeOverlay(_HighLightPolyline);
				}
				_HighLightPolyline = MapCommon.polyline(MapCommon.convertPolylineGeoJSONToPoints(routeLine));
				_HighLightPolyline.setColor("#FF1D1D");
				Variable.layers.routeAnalysisLayer.show();
				Variable.layers.routeAnalysisLayer.addOverlay(_HighLightPolyline);
			},
			//收藏路线
			_CollectRoute = function() {
				var el = $(this),
					LiItem = el.closest('li.search-result-item'),
					data = LiItem.data();
				//取消收藏
				if(el.find("i").hasClass('active')){
					id = data.id;
					FavoriteRouteController.deleteMyFavoriteRouteWithoutRefresh({
						id: id,
						_method: "delete"
					});
					el.find("i").removeClass('active');
				}else{
					var postdata = {
						startPointName: data.startpointname,
						startPointLonlat: data.startpointlonlat,
						endPointName: data.endpointname,
						endPointLonlat: data.endpointlonlat,
						routeLength: data.routelength,
						time: data.time,
						route: JSON.stringify(data.route),
						trafficModel: data.trafficmodel,
						routeType: data.routetype,
						routeLonlat: JSON.stringify(data.routelonlat)
					};
					FavoriteRouteController.saveMyFavoriteRoute(postdata, LiItem);
				}
			},
			//发送到手机
			_SendToPhone = function() {
				notify.warn("该功能暂未实现！");
			};
		var
		//关闭地址窗
			_closeAddressWin = function() {
				var el = $(this);
				//显示窗口下三角
				$("#npgis_contentDiv").css("z-index", 1);
				el.closest('.address-list').remove();
			},
			//清除搜索历史地址
			_clearHistoryAddress = function() {
				//调用后台服务
				_controller.clearHistoryAddress({
					_method: "delete"
				});
			},
			//在地图上标注起点
			_markPointOnMap = function() {
				var el = $(this);
				var geometry = el.data("geometry"),
					type = el.parent().parent().prev().data("type"),
					name = el.data("name"),
					address = el.data("address"),
					districtName = el.data("districtname"),
					gid = el.data("gid");
				//填充input
				var Input = el.closest('.address-list').parent().find("input");
				Input.val(name).data("address", address);
				Input.data("districtname", districtName);
				Input.data("gid", gid);
				//关闭窗口
				_closeAddressWin.call(this);
				//标注位置
				geometry.coordinates = geometry.coordinates ? geometry.coordinates : geometry.coordinate;
				var position = new NPMapLib.Geometry.Point(geometry.coordinates[0], geometry.coordinates[1]);
				_addMarkerToMap(position, type);
			};
		//路径规划页面显示后事件绑定
		//途经点窗口事件 处理
		var
		//内容收缩
			_listContract = function() {
				var el = $(this);
				if (el.hasClass('up')) {
					el.parent().next().slideUp(200);
					el.addClass('down').removeClass("up");
				} else if (el.hasClass('down')) {
					el.parent().next().show(200);
					el.addClass('up').removeClass('down');
				}
			},
			//显示或者隐藏复选框
			_showOrHideStops = function() {
				var el = $(this),
					type = el.data("type");
				if (el.hasClass('checked')) {
					//摄像机
					if (type === "camera") {
						_showOrHideResourceOnMap("hide", "camera");
					} else if (type === "bayonet") {
						//卡口

					}
					el.removeClass('checked');
				} else {
					//摄像机
					if (type === "camera") {
						_showOrHideResourceOnMap("show", "camera");
					} else if (type === "bayonet") {
						//卡口

					}
					el.addClass('checked');
				}
			},
			//在地图上显示或者隐藏资源
			_showOrHideResourceOnMap = function(operaType, resourceType) {
				if (operaType === "hide") {
					if (resourceType === "camera") {
						if (_cameraMarkers.length > 0) {
							for (var i = 0, j = _cameraMarkers.length; i < j; i++) {
								_cameraMarkers[i].hide();
							}
						}
					}
				} else {
					if (resourceType === "camera") {
						require(["js/npmap-new/controller/task-path-planning-controller"], function(_controller) {
							_controller.searchCameraByGeometry({
								geometry: _bufferPoint
							});
						});
					}
				}
			};
		var _bindEvents = function() {
			$(".left-route-planning").find("[data-handler]").map(function() {
				$(this).off($(this).data("event")).on($(this).data("event"), _eventHandler[$(this).data("handler")]);
			});
		};
		//搜索结果显示后事件绑定
		var _bindResultEvents = function() {
			$(".route-search-result").find("[data-handler]").map(function() {
				$(this).off($(this).data("event")).on($(this).data("event"), _resultEventHandler[$(this).data("handler")]);
			});
		};
		//地址窗口事件绑定
		var _bindAddressWinEvent = function() {
			$(".address-list").find("[data-handler]").map(function() {
				$(this).off($(this).data("event")).on($(this).data("event"), _addressWinEventHandler[$(this).data("handler")]);
			});
		};
		//地址窗口事件绑定
		var _bindIntermediateStopEventHandler = function() {
			$(".intermediate-stop").find("[data-handler]").map(function() {
				$(this).off($(this).data("event")).on($(this).data("event"), _intermediateStopEventHandler[$(this).data("handler")]);
			});
		};
		var
		/**
		 * 点击面包屑“home”，跳转到业务列表
		 * @private
		 */
			_backToBusiness = function() {
			//页面跳转
			SideBar.push({
				name: "#sidebar-body",
				markName: "business"
			});
			//清除地图上的覆盖物
			MapOverLayerCtrl.showAndHideOverLayers("map-business-clear");
		};
		//注册助手
		var _registerHelper = function() {
			//高亮显示当前选择的路径方式
			Handlebars.registerHelper("isActive", function(routeType, currType) {
				if (routeType === currType) {
					return "active";
				}
				return "";
			});
			//步行时不显示 不走高速
			Handlebars.registerHelper("isCar", function(trafficModel, options) {
				if (trafficModel === "car") {
					return options.fn(this);
				}
				return "";
			});
			//距离转换
			Handlebars.registerHelper("distanceConvert", function(distance) {
				return _lengthConvert(distance);
			});
			//时间转换
			Handlebars.registerHelper("timeConvert", function(time) {
				return _timeConvert(time);
			});
		};
		//初始化页面
		scope.init = function(controller) {
			//保存控制器对象
			_controller = controller;
			//初始化模板
			MapCommon.loadTemplate(_templateUrl, function(compiler) {
				//保存模板对象
				_compiler = compiler;
				//事件绑定
				_bindEvents();
				//监听输入框
				_watchInput();
				//注册助手
				_registerHelper();
			}, function() {
				notify("获取路径规划模板失败！");
			});
		};
		/**
		 * 显示地址列表
		 * @author Li Dan
		 * @date   2015-08-07
		 * @param  {[type]}   data [description]
		 * @return {[type]}        [description]
		 */
		scope.showAddressList = function(res, data) {
			if(res.totalCount === 0){
				if(data.type === "start"){
					notify.warn("请输入正确的起点！");
				}else{
					notify.warn("请输入正确的终点！");
				}
				return;
			}
			res = $.extend(res, {
				type: data.type
			});
			//隐藏窗口下三角
			$("#npgis_contentDiv").css("z-index", 10001);
			_setDataToAddressWin(data.el, res);
		};
		/**
		 * 设置地址搜索框
		 * @author Li Dan
		 * @date   2015-08-11
		 * @param  {[type]}   res  [description]
		 * @param  {[type]}   data [description]
		 */
		scope.setAddressInput = function(res, data) {
			data.Input.val(res.name ? res.name : "我的标记");
			data.Input.data("address", res.address);
			data.Input.data("districtname", res.districtName);
			data.Input.data("gid", res.gid);
			var position = new NPMapLib.Geometry.Point(data.lon, data.lat);
			var type = data.type;
			//在地图上添加标注
			_addMarkerToMap(position, type);
		};
		/**
		 * 设置历史地址列表
		 * @author Li Dan
		 * @date   2015-08-11
		 * @param  {[type]}   res [description]
		 */
		scope.setHistoryAddress = function(res, data) {
			var result = $.extend({
				features: res.data.favoriteRouteHistorys
			}, {}, {
				type: data.type
			});
			if(result.features && result.features.length>0){
				_setDataToAddressWin(data.el, result);
			}else{
				//显示窗口下三角
				$("#npgis_contentDiv").css("z-index", 1);
				$('.address-list').remove();
			}
		};
		/**
		 * 关闭历史地址框
		 * @author Li Dan
		 * @date   2015-08-12
		 * @param  {[type]}   res [description]
		 * @return {[type]}       [description]
		 */
		scope.closeAddressWin = function(res) {
			//显示窗口下三角
			$("#npgis_contentDiv").css("z-index", 1);
			$('.address-list').remove();
		};
		/**
		 * 通过名称获取地址
		 * @author Li Dan
		 * @date   2015-08-10
		 * @return {[type]}   [description]
		 */
		scope.getAddressByName = function(data) {
			if (data.keyWord && data.keyWord.trim()) {
				require(["js/npmap-new/controller/task-path-planning-controller"], function(_controller) {
					_controller.getAddressByName(data);
				});
			}else{
				require(["js/npmap-new/controller/task-path-planning-controller"], function(_controller) {
					_controller.getHistoryAddress({
						currentPage: 1,
						pageSize: 5,
						el: data.el,
						key: "",
						type: data.type
					});
				});
			}
		};
		/**
		 * 地图窗口调用路径规划
		 * @author Li Dan
		 * @date   2015-08-12
		 * @param  {[type]}   Point [description]
		 * @param  {[type]}   type  [description]
		 * @return {[type]}         [description]
		 */
		scope.planRouteByWin = function(position, type, name) {
			if(!name){
				if (type === "fromhere") {
					notify.warn("请输入终点");
				}else{
					notify.warn("请输入起点");
				}
				return;
			}
			if (type === "fromhere") {
				_addMarkerToMap(position, "start", "winsearch");
				_startPointName = "我的标记";
				_endPointName = name;
			} else if (type === "endhere") {
				_addMarkerToMap(position, "end", "winsearch");
				_startPointName = name;
				_endPointName = "我的标记";
			}
			_searchPath("mapwin");
			//关闭窗口
			window.infowindow.hide(true);
		};
		/**
		 * 查看收藏的路线
		 * @author Li Dan
		 * @date   2015-08-12
		 * @param  {[type]}   data [description]
		 * @return {[type]}        [description]
		 */
		scope.showFavoriteRoute = function(data) {
			//初始化模板
			MapCommon.loadTemplate(_templateUrl, function(compiler) {
				//注册助手
				_registerHelper();
				//渲染页面
				SideBar.push({
					name: "#sidebar-body",
					markName: "checkFavoriteRoute",
					template: $.trim(compiler({
						CheckFavoriteRoute: data
					}))
				});
				//事件绑定
				_bindEvents();
				//监听输入框
				_watchInput();
				//绑定搜索结果事件
				_bindResultEvents();
				$("#ReturnToFavorite").click(function() {
					$("#sidebar").find(".np-favorite").trigger('click');
				});
				if (typeof data.favoriteRoute.starPointLonlat === "string") {
					data.favoriteRoute.starPointLonlat = data.favoriteRoute.starPointLonlat.split(",");
				}
				if (typeof data.favoriteRoute.endPointLonlat === "string") {
					data.favoriteRoute.endPointLonlat = data.favoriteRoute.endPointLonlat.split(",");
				}
				//在地图上标注起点和终点
				var startPoint = new NPMapLib.Geometry.Point(data.favoriteRoute.starPointLonlat[0], data.favoriteRoute.starPointLonlat[1]),
					endPoint = new NPMapLib.Geometry.Point(data.favoriteRoute.endPointLonlat[0], data.favoriteRoute.endPointLonlat[1]);
				_addMarkerToMap(startPoint, "start", "check");
				_addMarkerToMap(endPoint, "end", "check");
				//在地图上显示路线
				_showRouteOnMap(data.favoriteRoute.routeLonlat);
				/*_bindAddressWinEvent();*/
			});
		};
		/**
		 * 在地图上设置缓冲区资源
		 * @author Li Dan
		 * @date   2015-08-13
		 * @param  {[type]}   res [description]
		 */
		scope.setCameraResourcesOnMap = function(res) {
			var cameras = res.data.cameras;
			Variable.layers.resourceOnRouteLayer.removeAllOverlays();
			Variable.layers.resourceOnRouteLayer.show();
			_cameraMarkers.splice(0, _cameraMarkers.length);
			//编辑摄像机列表
			for (var i = 0, j = cameras.length; i < j; i++) {
				var marker = new NPMapLib.Symbols.Marker(new NPMapLib.Geometry.Point(cameras[i].longitude, cameras[i].latitude));
				marker.setIcon(MapConst.guardRouteSymbol.cameraGunOnline());
				//根据不同类型的摄像机显示不同的图标
				if ((cameras[i].camera_type === 0) && (cameras[i].camera_status === 0)) {
					marker.setIcon(MapConst.guardRouteSymbol.cameraGunOnline());
				}
				if ((cameras[i].camera_type === 0) && (cameras[i].camera_status === 1)) {
					marker.setIcon(MapConst.guardRouteSymbol.cameraGunOffline());
				}
				if ((cameras[i].camera_type === 1) && (cameras[i].camera_status === 0)) {
					marker.setIcon(MapConst.guardRouteSymbol.cameraBallOnline());
				}
				if ((cameras[i].camera_type === 1) && (cameras[i].camera_status === 1)) {
					marker.setIcon(MapConst.guardRouteSymbol.cameraBallOffline());
				}
				marker.setData({
					"type": "buffer",
					"cameraId": cameras[i].id
				});
				_cameraMarkers.push(marker);
				Variable.layers.resourceOnRouteLayer.addOverlay(marker);
			}
		};
		scope.showIntermediateStopNum = function(num) {
			//显示搜索结果窗口
			MapCommon.loadTemplate(_templateUrl, function(compiler) {
				if($(".intermediate-stop")[0]){
					$(".intermediate-stop").remove();
				}
				$("#gismap").append(compiler({
					resourceArroundPolyline: {
						num: num
					}
				}));
				//途经点窗口事件绑定
				_bindIntermediateStopEventHandler();
			});
		};
		return scope;
	}({}, jQuery));
});
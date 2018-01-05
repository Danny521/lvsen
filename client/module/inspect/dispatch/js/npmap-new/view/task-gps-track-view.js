/**
 * [GPS监控]
 * @author SongJiang
 * @date   2015-08-27
 * @param  {[type]}   ){} [地图上的变量、地图上的通用方法、地图上的常量、jquery库]
 * @return {[type]}         [description]
 */
define([
	"js/npmap-new/map-variable",
	"js/sidebar/sidebar",
	"js/npmap-new/map-common",
	"js/npmap-new/map-const",
	"js/npmap-new/map-permission",
	"jquery",
	"jquery-ui",
	"jquery.datetimepicker"
], function(Variable, SideBar, MapCommon, MapConst, pvamapPermission, jQuery) {
	return (function(scope, $) {
		var
		//模板存储路径
			_templateUrl = "inc/connection/left-for-gps-resource-list.html",
			//控制器对象 
			_controller,

			_isMouseOverSCDiv = false,
			//缓冲区坐标点串信息
			_bufferPoint,
			//查询所有资源信息
			_cameraMarkers = [],
			//资源类型，默认资源为摄像机
			_resourceType = "camera",
			//几何服务
			_geometryService = null,
			//模板对象
			_compiler,
			//周边距离
			_bufferDistance = 10,
			//gps点位串
			_gpsPoints = [],
			//当前资源，小车播放时，最近资源
			_activeMarker = null,
			//播放速度
			_speed = 1,
			//速度倍数
			_speedTimes = 1,
			//setTimeOut实例id
			_timerId = null,
			//小车
			headerMarker = null,
			//动画线
			_animationLine = null;
		var //事件处理程序
			_eventHandler = {
			//发送电视墙
			SendToWall: function(e) {
				_sendToTvWall.call(this);
				e.stopPropagation();
			},
			//播放摄像机视频
			PlayCamera: function(e) {
				_playCameraOnMap.call(this);
				e.stopPropagation();
			},
			gotoResource: function(e) {
				_gotoResource.call(this);
				e.stopPropagation();
			}
		};
		var
			_gotoResource = function() {
				//跳转到资源面板
				$(".np-resource").trigger("click");
			},
			/**
			 * @author Song Jiang
			 * @date   2015-08-31
			 */
			_bindEvents = function() {
				$(".gps-control-track form ul li span.content .color").on("click", function() {
					jQuery(this).prev().trigger("focus");
				});
				// $(".arrow-down").on("click",function(){
				// 	$(".gps-control-track-resourceType").show();
				// });
				// $(".select_container .text").on("click",function(){
				// 	$(".gps-control-track-resourceType").show();
				// });
				$(".gps-control-track-resourceType ul li").on("click", function() {
					$(".select_container .text").text($(this).text());
					_resourceType = $(this).data("value");
					if (_bufferPoint) {
						_showOResourceOnMap(_resourceType);
					}
				});
				//下拉列表的鼠标移入移出事件
				jQuery(".select_container .text").hover(function() {
					_isMouseOverSCDiv = true;
				}, function() {
					_isMouseOverSCDiv = false;
				});
				jQuery(".arrow-down").hover(function() {
					_isMouseOverSCDiv = true;
				}, function() {
					_isMouseOverSCDiv = false;
				});
				jQuery(document).on("click", function() {
					if (!_isMouseOverSCDiv) {
						$(".gps-control-track-resourceType").hide();
					}
				});
				$("#queryGPS").on("click", function() {
					_clearResult();
					_searchGPSAndResouce($("#GPSCode").val(), $("#CarCode").val(), $("#beginTime").val(), $("#endTime").val(), $("#bufferDistance").val());
				});
			},
			_bindEventsBySelector = function(selector) {
				$(selector).map(function() {
					$(this).off($(this).data("event")).on($(this).data("event"), _eventHandler[$(this).data("handler")]);
				});
			},
			/**
			 * 判断字符串中是否有特殊字符
			 * @author Song Jiang
			 * @date   2015-09-02
			 * @param  {[type]}   str [检测字符串]
			 */
			_findSpecialCharacter = function(str) {
				var scharacter = "[@/'\"#$%&^*]+";
				var reg = new RegExp(scharacter);
				if (reg.test(str)) {
					return true;
				} else {
					return false;
				}
			},
			/**
			 * 获取GPS点位信息并且查找指定范围内的资源信息
			 * @author Song Jiang
			 * @date   2015-08-31
			 * @param  {[type]}   gpscode [gps编号]
			 * @param  {[type]}   carcode   [车牌号]
			 * @param  {[type]}   startTime [起始时间]
			 * @param  {[type]}   endTime   [终止时间]
			 * @param  {[type]}   resource [资源类型]
			 * @param  {[type]}   bufferDistance   [周边范围]
			 */
			_searchGPSAndResouce = function(gpscode, carcode, startTime, endTime, bufferDistance) {
				if (gpscode === "" && carcode === "") {
					notify.error("GPS编号和车牌号码不能同时为空");
					//$("#messageLable").text("GPS编号和车牌号码不能同时为空");
					return;
				}
				if (_findSpecialCharacter(gpscode)) {
					notify.error("请输入正确的GPS编号");
					// $("#messageLable").text("请输入正确的GPS编号");
					return;
				}
				if (_findSpecialCharacter(carcode)) {
					notify.error("请输入正确的车牌号");
					// $("#messageLable").text("请输入正确的车牌号");
					return;
				}
				if (gpscode.length > 30) {
					notify.error("GPS编号长度不能超过30字符");
					// $("#messageLable").text("GPS编号长度不能超过30字符");
					return;
				}
				if (carcode.length > 30) {
					notify.error("车牌号长度不能超过30字符");
					// $("#messageLable").text("车牌号长度不能超过30字符");
					return;
				}
				if (startTime === "") {
					notify.error("请输入正确的起始时间");
					// $("#messageLable").text("请输入正确的起始时间");
					return;
				}
				if (endTime === "") {
					notify.error("请输入正确的结束时间");
					//$("#messageLable").text("请输入正确的结束时间");
					return;
				}
				if (new Date(endTime.replace(/-/g, "/")) <= new Date(startTime.replace(/-/g, "/"))) {
					notify.error("起始时间需早于结束时间，请重新输入");
					//$("#messageLable").text("起始时间需早于结束时间，请重新输入");
					return;
				}
				if (new Date(endTime.replace(/-/g, "/")) - new Date(startTime.replace(/-/g, "/")) > 86400000) {
					notify.error("最多可查询24小时内的GPS信息");
					// $("#messageLable").text("最多可查询24小时内的GPS信息");
					return;
				}
				if (!parseInt(bufferDistance, 10) || parseInt(bufferDistance, 10) < 1 || parseInt(bufferDistance, 10) > 200) {
					notify.error("请输入正确的搜索区间");
					//$("#messageLable").text("请输入正确的搜索区间");
					return;
				}
				_bufferDistance = bufferDistance;
				Variable.layers.gpsControlLayer.removeAllOverlays();
				Variable.layers.gpsControlLayer.show();
				_findGPSPoints(gpscode, carcode, startTime, endTime);
			},
			/**
			 * 获取GPS点位信息
			 * @author Song Jiang
			 * @date   2015-08-31
			 * @param  {[type]}   gpscode [gps编号]
			 * @param  {[type]}   carcode   [车牌号]
			 * @param  {[type]}   startTime [起始时间]
			 * @param  {[type]}   endTime   [终止时间]
			 */
			_findGPSPoints = function(gpscode, carcode, startTime, endTime) {
				startTime = startTime.replace(/\-/g, "");
				startTime = startTime.replace(/\ /g, "");
				startTime = startTime.replace(/\:/g, "");
				endTime = endTime.replace(/\-/g, "");
				endTime = endTime.replace(/\ /g, "");
				endTime = endTime.replace(/\:/g, "");
				var data = {};
				if (gpscode != "") {
					data = {
						keyWord: gpscode,
						start: startTime,
						end: endTime
					}
				} else if (carcode != "") {
					data = {
						keyWord: carcode,
						start: startTime,
						end: endTime,
						isById: false
					}
				}
				require(["js/npmap-new/controller/task-gps-track-controller"], function(_controller) {
					_controller.searchGPSPoints(data);
				});
			},
			/**
			 * 添加播放控制控件
			 * @author Song Jiang
			 * @date   2015-09-07
			 * @param  {[type]}   line [播放线对象]
			 */
			_addPlayControl = function() {
				$(".GPSPlayControl").remove();
				if (_animationLine) {
					_animationLine.stop();
				}
				if (_gpsPoints.length == 0) {
					return;
				}
				var mapContainer = Variable.map.getContainer();
				$(mapContainer).append(_compiler({
					GPSPlayControl: true
				}));
				$(".GPSPlayControl-speedMessage").hide();
				$("#slider").slider({
					max: 2,
					min: -2,
					step: 1,
					slide: _silderChanged
				});
				$(".gps-play").on("click", function() {
					if (_animationLine) {
						_animationLine.setSpeed(_speed * _speedTimes);
						if (_animationLine.status == -1) {
							_animationLine.headerMarker.show();
							_animationLine.start();
							Variable.map.setCenter(_animationLine.headerMarker.getPosition(), Variable.map.getMaxZoom() - 2);
							$(this).removeClass('gps-play').addClass('gps-pause');
							$(this).attr("title", "暂停");
							$("#slider").slider('disable');
						} else if (_animationLine.status == 0) {
							Variable.layers.gpsControlLayer.removeOverlay(_animationLine.op_line);
							_animationLine._init();
							_animationLine.headerMarker.show();
							_animationLine.start();
							Variable.map.setCenter(_animationLine.headerMarker.getPosition(), Variable.map.getMaxZoom() - 2);
							$(this).removeClass('gps-play').addClass('gps-pause');
							$(this).attr("title", "暂停");
							$("#slider").slider('disable');
						} else if (_animationLine.status == 1) {
							_animationLine.pause();
							$(this).removeClass('gps-pause').addClass('gps-play');
							$(this).attr("title", "开始");
							$("#slider").slider('enable');
						}
					}
				});
				$(".gps-stop").on("click", function() {
					if (_animationLine) {
						_animationLine.stop();
						$("#gps-play").removeClass('gps-pause').addClass('gps-play');
						$("#slider").slider('enable');
					}
				});
			}
			/**
			 * 添加动画线对象
			 * @author Song Jiang
			 * @date   2015-08-31
			 */
		_addAnimationLine = function() {
				if (_activeMarker) {
					_activeMarker.flashStop();
				}
				_activeMarker = null;
				if (_gpsPoints.length == 0) {
					return;
				}
				var offset = new NPMapLib.Geometry.Size(0, -10);
				var headerMarker = new NPMapLib.Symbols.Marker(_gpsPoints[0], {
					offset: offset
				});
				headerMarker.setIcon(MapConst.guardRouteSymbol.carSymbol());
				_animationLine = new NPMapLib.Symbols.AnimationLine(Variable.map.id, _gpsPoints, {
					headerMarker: headerMarker,
					color: 'red',
					opacity: 0.6,
					weight: 4
				});
				_animationLine.panWay = 1;
				Variable.layers.gpsControlLayer.addOverlay(headerMarker);
				headerMarker.hide();
				_animationLine.setLayer(Variable.layers.gpsControlLayer);
				_animationLine.setSpeed(_speed * _speedTimes);
				//注册事件，主要是动画线结束后播放控制按钮样式调整
				_animationLine.events.register("preDraw", function(evt) {
					if (evt.index == _gpsPoints.length - 1) {
						$("#gps-play").removeClass('gps-pause').addClass('gps-play');
						if (_activeMarker) {
							_activeMarker.flashStop();
						}
					}
				});
				_animationLine.events.register("afterStep", function(evt) {
					if (!evt.point) {
						return;
					}
					var marker = _findShortestMarker(evt.point);
					if (!marker) {
						return;
					}
					if (_activeMarker != marker) {
						if (_activeMarker) {
							_activeMarker.flashStop();
						}
						_activeMarker = marker;
						_activeMarker.flash2(8);
					}
				});
			},
			/**
			 *查询最近的资源标注点位
			 **/
			_findShortestMarker = function(point) {
				var distance = 9999;
				var marker;
				for (var i = 0; i < _cameraMarkers.length; i++) {
					var p = _cameraMarkers[i].getPosition();
					var d = (point.lon - p.lon) * (point.lon - p.lon) + (point.lat - p.lat) * (point.lat - p.lat);
					if (distance > d) {
						distance = d;
						marker = _cameraMarkers[i];
					}
				}
				return marker;
			}
			/**
			 * 添加动画线对象
			 * @author Song Jiang
			 * @date   2015-08-31
			 */
		_addStartAndEndMarkers = function() {
				if (_gpsPoints.length == 0) {
					return;
				}
				var startPoint = _gpsPoints[0];
				var startMarker = new NPMapLib.Symbols.Marker(startPoint, {
					offset: new NPMapLib.Geometry.Size(0, 10)
				});
				startMarker.setIcon(MapConst.guardRouteSymbol.startPoint());
				Variable.layers.gpsControlLayer.addOverlay(startMarker);

				var endPoint = _gpsPoints[_gpsPoints.length - 1];
				var endMarker = new NPMapLib.Symbols.Marker(endPoint, {
					offset: new NPMapLib.Geometry.Size(0, 10)
				});
				endMarker.setIcon(MapConst.guardRouteSymbol.stopPoint());
				Variable.layers.gpsControlLayer.addOverlay(endMarker);
			},
			/**
			 * 清除结果信息，包括地图上的资源
			 * @author Song Jiang
			 * @date   2015-08-31
			 * @param  {[type]}   line [播放线对象]
			 */
			_clearResult = function() {
				$("#gps-control-track-result").empty().html("");
				_bufferPoints = null;
				//如果有动画，则停止
				if (_animationLine) {
					_animationLine.stop();
				}
				Variable.layers.gpsControlLayer.removeAllOverlays();
				Variable.layers.resourceOnGpsLayer.removeAllOverlays();
			},
			/**
			 *当滑动速度控制条时触发
			 **/
			_silderChanged = function(event, ui) {
				$(".GPSPlayControl-speedMessage").show();
				var value = ui.value;
				var message = "原速";
				if (value == 0) {
					_speedTimes = 1;
					message = "原速";
				} else if (value == -2) {
					_speedTimes = 0.33;
					message = "-3倍速";
				} else if (value == -1) {
					_speedTimes = 0.5;
					message = "-2倍速";
				} else if (value == 1) {
					_speedTimes = 2;
					message = "2倍速";
				} else if (value == 2) {
					_speedTimes = 3;
					message = "3倍速";
				}
				$(".GPSPlayControl-speedMessage .speedMessage").text(message);
				if (_timerId) {
					clearTimeout(_timerId);
				}
				_timerId = setTimeout(function() {
					$(".GPSPlayControl-speedMessage").hide();
				}, 3000);
			},
			/**
			 * 获取GPS点位路线
			 * @author Song Jiang
			 * @date   2015-08-31
			 * @param  {[type]}   points [gps点位数组]
			 */
			_getGPSLineByPoints = function(points) {
				var ps = [];
				for (var i = 0; i < points.length; i++) {
					if (points[i] && points[i].lon && points[i].lat) {
						var point = new NPMapLib.Geometry.Point(points[i].lon, points[i].lat);
						ps.push(point);
					}
				}
				var line = new NPMapLib.Geometry.Polyline(ps, {
					color: "#00a8ff", //颜色
					weight: 4 //宽度，以像素为单位
				});
				return line;
			},
			//在地图上显示资源
			_showOResourceOnMap = function(resourceType) {
				$("#gps-control-track-result").empty().html("");
				Variable.layers.resourceOnGpsLayer.removeAllOverlays();
				if (resourceType === "camera") {
					require(["js/npmap-new/controller/task-gps-track-controller"], function(_controller) {
						_controller.searchCameraByGeometry({
							geometry: _bufferPoint
						});
					});
				} else {}
			},
			/**
			 * 选中左侧搜索结果，在地图上播放摄像机
			 * @private
			 */
			_playCameraOnMap = function() {
				var $this = $(this),
					$cameraLiDom = $this.closest(".camera-item"),
					camera = $cameraLiDom.data();
				//判断是否已经在播放
				if ($this.hasClass("camera-stop")) {
					//更新样式
					$this.addClass("camera-play").removeClass("camera-stop").attr("title", "播放实时视频");
					$cameraLiDom.removeClass("active");
					//关闭信息窗
					window.infowindow.closeInfoWindow();
					return;
				}
				//判断资源权限 by zhangyu on 2015/2/11
				if (!pvamapPermission.checkCameraPermissionById(camera.id, "play-batch-real-video-on-select-result")) {
					return;
				}
				//判断是否有视频指挥模块的实时视频的权限，如果有则进入，没有就提示。  by zhangyu 2015.02.11
				if (!pvamapPermission.checkRealStreamPlay("search-result-dbclick-on-btn")) {
					return;
				}
				//切换按钮样式到停止状态
				$this.removeClass("camera-play").addClass("camera-stop").attr("title", "停止播放");
				$cameraLiDom.addClass("active").siblings().removeClass("active").find(".camera-stop").addClass("camera-play").removeClass("camera-stop");
				//响应地图上的点位，并播放视频
				_linkageToMapGeometry(camera.id);

			},

			/**
			 * 防控圈分组上防控圈摄像机列表点击
			 * @param cameraId - 摄像机id
			 */
			_linkageToMapGeometry = function(cameraId) {
				var markers = Variable.layers.resourceOnGpsLayer._overlays;
				try {
					for (var key in markers) {
						if (markers.hasOwnProperty(key) && markers[key].getData()) {
							var cameraData = markers[key].getData();
							//响应地图中该点
							if (cameraData.id && cameraData.id === cameraId) {
								//播放视频
								Variable.currentCameraData = $.extend(cameraData, {
									longitude: markers[key].getPosition().lon,
									latitude: markers[key].getPosition().lat,
									subType: "resource",
									type: "other",
									markerType: "resource-marker"
								});
								//重新赋值
								markers[key].setData(Variable.currentCameraData);
								//在地图上居中该点
								var point = new NPMapLib.Geometry.Point(cameraData.longitude, cameraData.latitude);
								Variable.map.setCenter(point);
								//播放摄像机视频
								// MapCommon.showCameraInfoAndPlay(markers[key]);
								MapCommon.showSingleCameraInfoAndPlay(markers[key]);
							}
						}
					}
				} catch (e) {};
			};

		/**
		 * 发送到电视墙
		 * @private
		 */
		_sendToTvWall = function() {
				//获取摄像机参数
				var data = $(this).closest(".camera-item").data();
				//发送到电视墙
				require(["js/npmap-new/map-common-tvwall", "js/npmap-new/map-variable"], function(TVWall, Variable) {
					//保存电视墙所需要的数据信息
					Variable.currentCameraData = data;
					//发送到电视墙
					TVWall.sendToTvwall();
				});
			},
			/**
			 * 获取缓冲区
			 * @author Song Jiang
			 * @date   2015-08-27
			 * @param  {[type]}   Polyline [description]
			 * @param  {[type]}   bufferDistance [周边范围]
			 * @return {[type]}            [description]
			 */
			_getBuffer = function(Polyline, bufferDistance) {
				//绘制新的缓冲区
				var params = new NPMapLib.Services.bufferParams();
				params.projection = Variable.map.getProjection();
				params.distance = bufferDistance ? bufferDistance : 10;
				params.units = "m";
				params.geometry = Polyline; //需要数据转换
				if (!_geometryService) {
					_geometryService = new NPMapLib.Services.BufferService(Variable.map, NPMapLib.MAPTYPE_NPGIS);
				}
				var buffer = _geometryService.buffer(mapConfig.geometryServiceUrl, params, _showBuffer);
			},
			/**
			 * 显示缓冲区
			 * @author Song Jiang
			 * @date   2015-08-27
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
					color: "#18affd", //颜色
					fillColor: "#18affd", //填充颜色
					weight: 0, //宽度，以像素为单位
					opacity: 0.16, //透明度，取值范围0 - 1
					fillOpacity: 0.16
				});
				Variable.layers.gpsControlLayer.addOverlay(bufferResult);
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
				_showOResourceOnMap(_resourceType);
			};
		//初始化页面
		scope.init = function(controller) {
			MapCommon.hideAllLayers();
			MapCommon.hideResourceLayers();
			//保存控制器对象
			_controller = controller;
			//初始化模板
			MapCommon.loadTemplate(_templateUrl, function(compiler) {
				//保存模板对象
				_compiler = compiler;
				$(".gps-control-track-operation").append(_compiler({
					resourceType: true
				}));
				$(".gps-control-track-resourceType").hide();
				var date = new Date();
				$("#endTime").val(date.format("yyyy-MM-dd hh:mm:ss"));
				var hours = date.getHours();
				date.setHours(hours - 1);
				$("#beginTime").val(date.format("yyyy-MM-dd hh:mm:ss"));
				$('.time').datetimepicker({
					showSecond: true,
					dateFormat: 'yy-mm-dd',
					timeFormat: 'HH:mm:ss',
					timeText: '',
					hourText: ' 时',
					minuteText: ' 分',
					secondText: ' 秒',
					showAnim: ''
				});
				$("#bufferDistance").val(50);
				//清除结果列表信息
				$("#gps-control-track-result").empty();
				//事件绑定
				_bindEvents();
			}, function() {
				notify("获取GPS监控模板失败！");
			});
		};
		/**
		 * 在地图上设置缓冲区资源
		 * @author Song Jiang
		 * @date   2015-08-13
		 * @param  {[type]}   res [description]
		 */
		scope.setCameraResourcesOnMap = function(res) {
			_cameraMarkers = [];
			var cameras = res.data.cameras;
			Variable.layers.resourceOnGpsLayer.removeAllOverlays();
			Variable.layers.resourceOnGpsLayer.show();
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
				marker.setData(cameras[i]);
				_cameraMarkers.push(marker);
				Variable.layers.resourceOnGpsLayer.addOverlay(marker);
				marker.addEventListener(NPMapLib.MARKER_EVENT_MOUSE_OVER, function(m) {
					var icon = m.getIcon();
					var size = new NPMapLib.Geometry.Size(28, 28);
					icon.setImageSize(size);
					m.setIcon(icon);
					m.refresh();
				});
				marker.addEventListener(NPMapLib.MARKER_EVENT_MOUSE_OUT, function(m) {
					var icon = m.getIcon();
					var size = new NPMapLib.Geometry.Size(26, 26);
					icon.setImageSize(size);
					m.setIcon(icon);
					m.refresh();
				});
				marker.addEventListener(NPMapLib.MARKER_EVENT_CLICK, function(m) {
					_linkageToMapGeometry(m.getData().id);
				});
			}
			_addPlayControl();
			_addStartAndEndMarkers();
			_addAnimationLine();
		};

		//将资源展示在左边结果列表里面
		scope.showResultInLeft = function(res) {
			//左侧显示搜索结果
			$("#gps-control-track-result").empty().html(_compiler({
				data: res.data
			}));
			_bindEventsBySelector(".gps-control-track-result .camera-play");
			_bindEventsBySelector(".gps-control-track-result .camera-twtall");
		};
		//将gps点位数据以线的形式添加到地图中，并进行周边查询资源
		scope.showGPSLine = function(res) {
			var gps = res.data.gps;
			var points = [];
			for (var i = 0; i < gps.length; i++) {
				var p = new NPMapLib.Geometry.Point(gps[i].lon, gps[i].lat);
				points.push(p);
			};
			_gpsPoints = points;
			if (_gpsPoints.length == 0) {
				return;
			}
			var line = _getGPSLineByPoints(points);
			Variable.layers.gpsControlLayer.addOverlay(line);
			var extent = line.getBounds();
			map.zoomToExtent(extent);
			_getBuffer(line, parseInt(_bufferDistance));
		};
		//切换GPS路线
		scope.showPoliceGPSLine = function(data) {
			$("#dataPager").empty();
			MapCommon.hideAllLayers();
			MapCommon.hideResourceLayers();
			MapCommon.loadTemplate(_templateUrl, function(compiler) {
				//渲染页面
				SideBar.push({
					name: "#sidebar-body",
					markName: "checkFavoriteRoute",
					template: $.trim(compiler({
						CheckGPSLine: data
					}))
				});
				//保存模板对象
				_compiler = compiler;
				$(".gps-control-track-operation").append(_compiler({
					resourceType: true
				}));
				$(".gps-control-track-resourceType").hide();
				$("#GPSCode").val(data.key);
				var date = new Date();
				$("#endTime").val(date.format("yyyy-MM-dd hh:mm:ss"));
				var hours = date.getHours();
				date.setHours(hours - 1);
				$("#beginTime").val(date.format("yyyy-MM-dd hh:mm:ss"));
				$('.time').datetimepicker({
					showSecond: true,
					dateFormat: 'yy-mm-dd',
					timeFormat: 'HH:mm:ss',
					timeText: '',
					hourText: ' 时',
					minuteText: ' 分',
					secondText: ' 秒',
					showAnim: ''
				});
				$("#bufferDistance").val(200);
				_bindEventsBySelector(".gps-to-resource");
				// //事件绑定
				_bindEvents();
				require(["js/npmap-new/controller/task-gps-track-controller"], function(_controller) {
					_controller.searchGPSInfoByID({
						code: data.key
					});
				});
			}, function() {
				notify("获取GPS监控模板失败！");
			});
		};
		scope.wirteCarCode = function(res) {
			if (res.data.gps.length > 0) {
				$("#CarCode").val(res.data.gps[0].lprVale);
			}
		};
		return scope;
	}({}, jQuery));
});
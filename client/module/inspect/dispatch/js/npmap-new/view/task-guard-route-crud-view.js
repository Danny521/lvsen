/*global NPMapLib:true;NPMapLib.Services:true;*/
/**
 * Created by Zhangyu on 2015/4/29.
 */
define([
	"js/npmap-new/map-init",
	"js/npmap-new/map-common",
	"js/npmap-new/map-const",
	"js/npmap-new/map-variable",
	"js/npmap-new/map-permission",
	"js/npmap-new/map-common-overlayer-ctrl",
	"jquery"
], function (PVAMap, MapCommon, MapConst, Variable, pvamapPermission, MapOverLayerCtrl, jQuery) {

	return (function (scope, $) {
		var //左侧页面对象
			_leftPanel = null,
			//控制器对象
			_controller = null,
			//缓冲区对象
			_lastBuffer = null,
			//线条对象
			_lastPolyline = null,
			//警卫路线的起点
			_startPoint = null,
			//警卫路线的终点
			_stopPoint = null,
			//警卫路线点位信息
			_pointinfo = null,
			//缓冲区点位数据
			_bufferPoint = null,
			//绘制参数
			_drawParams = null,
			//警卫路线地图标注列表
			_markerList = [];

		var /**
			 * 绘制警卫路线的回调函数
			 * @param extent - 绘制回传参数
			 * @param geometry - 地图点位对象
			 * @param rings - 其他待用
			 * @private
			 */
			_drawPoliceLineCallback= function (extent, geometry, rings) {
				var linepoints = geometry._points;
				//标记结束绘制警卫路线
				Variable.isDrawGraphicFlag = false;
				//警卫路线绘制结束时，隐藏资源图层
				MapOverLayerCtrl.showAndHideOverLayers("on-show-guard-route-info", "on-draw-end");
				//注销鼠标跟踪文本
				Variable.map.deactivateMouseContext();
				//获取线条对象并保存
				var polyline = MapCommon.polyline(linepoints);
				_lastPolyline = polyline;
				//加载线
				Variable.layers.guardRouteLayer.addOverlay(polyline);
				//新建/编辑时，为了实现点击路线触发编辑功能，故将警卫路线线条设置ZIndex，方便点选
				polyline.setZIndex(1);
				//加载起点和终点
				var startPoint = linepoints[0];
				var stopPoint = linepoints[linepoints.length - 1];
				var startMarker = new NPMapLib.Symbols.Marker(new NPMapLib.Geometry.Point(startPoint.lon, startPoint.lat));
				startMarker.setIcon(MapConst.guardRouteSymbol.startPoint());
				var stopMarker = new NPMapLib.Symbols.Marker(new NPMapLib.Geometry.Point(stopPoint.lon, stopPoint.lat));
				stopMarker.setIcon(MapConst.guardRouteSymbol.stopPoint());
				Variable.layers.guardRouteLayer.addOverlay(startMarker);
				Variable.layers.guardRouteLayer.addOverlay(stopMarker);
				//将起点和终点记录下来，以便用户在修改了起点和终点的时候使用
				Variable.guardRoutePoints = {
					startGraphic: startMarker,
					endGraphic: stopMarker
				};
				//存储绘制对象
				_startPoint = MapCommon.convertArrayToGeoJson([startPoint], "Point");
				_stopPoint = MapCommon.convertArrayToGeoJson([stopPoint], "Point");
				_pointinfo = MapCommon.convertArrayToGeoJson(linepoints, "Polyline");
				//显示缓冲区与否
				if (_drawParams.distance > 0) {
					//显示缓冲区
					_refreshBufferArea(_drawParams.distance, polyline);
				}
				//实现警卫路线的编辑，拖拽功能
				_activeGuardRoute(polyline);
			},
			/**
			 * 实现警卫路线的编辑，拖拽功能（警卫路线新建、编辑时有效）
			 * @param ployLineObj - 待编辑的线条对象
			 * @private
			 */
			_activeGuardRoute = function (ployLineObj) {
				//第六步：触发编辑功能
				ployLineObj.enableEditing(NPMapLib.ModifyFeature_RESHAPE);
				//第七步：对警卫路线添加编辑监听事件(拖动警卫路线的回调函数)
				ployLineObj.addEventListener(NPMapLib.POLYLINE_EVENT_LINE_MODIFIED, function (result) {
					var startPoint = result.getStartPoint(), endPoint = result.getEndPoint();
					if (startPoint) {
						Variable.guardRoutePoints.startGraphic.setPosition(startPoint);
						Variable.guardRoutePoints.startGraphic.refresh();
					}
					if (endPoint) {
						Variable.guardRoutePoints.endGraphic.setPosition(endPoint);
						Variable.guardRoutePoints.endGraphic.refresh();
					}
					//清除掉之前的缓冲区
					if (_lastBuffer) {
						Variable.layers.guardRouteLayer.removeOverlay(_lastBuffer);
					}
					//清除掉之前的摄像机
					var guardRouteOverlays = Variable.layers.guardRouteLayer.getOverlays();
					var cameraOverlays = [];
					var list = [];
					for (var k in guardRouteOverlays) {
						list.push(guardRouteOverlays[k]);
					}
					guardRouteOverlays = list;
					//获取需要移除的摄像机
					for (var i = 0, j = guardRouteOverlays.length; i < j; i++) {
						if (guardRouteOverlays[i].getData().type === "buffer") {
							cameraOverlays.push(guardRouteOverlays[i]);
						}
					}
					//将之前的摄像机移除掉
					for (var m = 0, n = cameraOverlays.length; m < n; m++) {
						Variable.layers.guardRouteLayer.removeOverlay(cameraOverlays[m]);
					}
					//刷新缓冲区域
					if (_drawParams.distance > 0) {
						_refreshBufferArea(_drawParams.distance, result);
					}
					//设置隐藏域内容
					var startPoint = result._points[0], stopPoint = result._points[result._points.length - 1], polyline = result._points;
					_startPoint = MapCommon.convertArrayToGeoJson([startPoint], "Point");
					_stopPoint = MapCommon.convertArrayToGeoJson([stopPoint], "Point");
					_pointinfo = MapCommon.convertArrayToGeoJson(polyline, "Polyline");
				});
			},
			/**
			 * 显示及刷新警卫路线旁边的缓冲区区域
		     * @param distance - 缓冲区范围
			 * @param ployLineObj - 警卫路线线条对象
			 */
			_refreshBufferArea = function (distance, ployLineObj) {
				//绘制新的缓冲区
				var params = new NPMapLib.Services.bufferParams();
				params.projection = Variable.map.getProjection();
				params.distance = parseInt(distance);
				params.units = "m";
				params.geometry = ployLineObj; //需要数据转换
				if (!PVAMap.geometryService) {
					PVAMap.geometryService = new NPMapLib.Services.BufferService(Variable.map, NPMapLib.MAPTYPE_NPGIS);
				}
				var buffer = PVAMap.geometryService.buffer(mapConfig.geometryServiceUrl, params, _showBuffer);
			},
			/**
			 * 显示缓冲区
			 * @param result - 地图几何服务回传参数
			 * @param type - 地图几何服务回传参数
			 * @private
			 */
			_showBuffer = function (result, type) {
				//缓冲区显示 NPGIS格式
				var temps = [], points = [];
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
				Variable.layers.guardRouteLayer.addOverlay(bufferResult);
				//缓冲区存储 geoJSON格式
				var savePoints = [];
				for (var i = 0, j = temps.length; i < j; i++) {
					var arr = JSON.parse(MapCommon.convertArrayToGeoJson(temps[i], "Polygon"));
					savePoints.push(arr.coordinates[0]);
				}
				savePoints = {
					"type": "Polygon",
					"coordinates": savePoints
				};
				_bufferPoint = savePoints = JSON.stringify(savePoints);
				//编辑/新建时，为了实现点击路线触发编辑功能，故将警卫路线缓冲区设置ZIndex，方便点选
				bufferResult.setZIndex(0);
				//存储新的buffer,下次编辑时移除用
				_lastBuffer = bufferResult;
				//在左侧显示摄像机列表
				if (!type) {
					//从服务的回调函数中来,获取区域范围内的摄像机
					_controller.getLeftCamerasInGeometry({
						geometry: savePoints
					}, 0);
				}
			},
			/**
			 * 显示警卫路线摄像机到地图上
			 * @param cameras - 待显示的摄像机列表
			 * @param id - 警卫路线id，编辑时有效
			 * @param type - 操作类型，edit为编辑
			 * @private
			 */
			_showGuardRouteCamerasOnMap = function(cameras, id, type) {
				//删除之前的地图标注
				if (_markerList.length != 0) {
					for (var i = 0; i < _markerList.length; i++) {
						Variable.layers.guardRouteLayer.removeOverlay(_markerList[i]);
					}
					_markerList.length = 0;
				}
				//编辑摄像机列表
				for (var i = 0, j = cameras.length; i < j; i++) {
					var marker = new NPMapLib.Symbols.Marker(new NPMapLib.Geometry.Point(cameras[i].longitude, cameras[i].latitude));
					marker.setIcon(MapConst.guardRouteSymbol.cameraGunOnline());
					//为了统一从dom和DB中获取的摄像机cameratype、camerastatus属性的名字，这里对摄像机这两个属性进行格式化
					cameras[i].cameratype = cameras[i].hasOwnProperty("cameratype") ? cameras[i].cameratype : cameras[i].camera_type;
					cameras[i].camerastatus = cameras[i].hasOwnProperty("camerastatus") ? cameras[i].camerastatus : cameras[i].camera_status;
					var score = cameras[i].score;
					//根据不同类型的摄像机显示不同的图标
					if ((cameras[i].cameratype === 0) && (cameras[i].camerastatus === 0)) {
						marker.setIcon((pvamapPermission.checkCameraPermissionByScore(score)) ? MapConst.guardRouteSymbol.cameraGunOnline() : MapConst.guardRouteSymbol.cameraGunOnlineForbid());
					}
					if ((cameras[i].cameratype === 0) && (cameras[i].camerastatus === 1)) {
						marker.setIcon((pvamapPermission.checkCameraPermissionByScore(score)) ? MapConst.guardRouteSymbol.cameraGunOffline() : MapConst.guardRouteSymbol.cameraGunOfflineForbid());
					}
					if ((cameras[i].cameratype === 1) && (cameras[i].camerastatus === 0)) {
						marker.setIcon((pvamapPermission.checkCameraPermissionByScore(score)) ? MapConst.guardRouteSymbol.cameraBallOnline() : MapConst.guardRouteSymbol.cameraBallOnlineForbid());
					}
					if ((cameras[i].cameratype === 1) && (cameras[i].camerastatus === 1)) {
						marker.setIcon((pvamapPermission.checkCameraPermissionByScore(score)) ? MapConst.guardRouteSymbol.cameraBallOffline() : MapConst.guardRouteSymbol.cameraBallOfflineForbid());
					}
					marker.setData({
						"id": id,
						"type": "buffer",
						"cameraId": cameras[i].id
					});
					_markerList.push(marker);
					if (type === "check") {
						//分组列表中直接显示警卫路线摄像机
						Variable.layers.guardRouteAllLayer.addOverlay(marker);
					} else {
						//警卫路线编辑状态下显示摄像机
						Variable.layers.guardRouteLayer.addOverlay(marker);
					}
				}
			},
			/**
			 * 地图框选结果回调函数
			 * @param extent - 地图回调参数
			 * @param geometry - 地图回调参数
			 * @param rings - 地图回调参数
			 * @private
			 */
			_rectSelectCamerasToGuardrouteCallback = function(extent, geometry, rings) {
				//标记框选结束
				Variable.isRectSelectRouteCameraFlag = false;
				//框选摄像机结束，隐藏资源图层
				MapOverLayerCtrl.showAndHideOverLayers("on-show-guard-route-info", "on-rect-select-end");
				//注销鼠标跟踪文本
				Variable.map.deactivateMouseContext();
				var points = MapCommon.convertArrayToGeoJson(geometry._points, "Polygon");
				//从服务的回调函数中来,获取区域范围内的摄像机
				_controller.getLeftCamerasInGeometry({
					geometry: points
				}, 1);
			},
			/**
			 * 隐藏其他图层，只显示警卫路线图层
			 * @private
			 */
			_showGuardRouteLayerOnly = function() {
				//图层切换
				MapOverLayerCtrl.showAndHideOverLayers("on-show-guard-route-info", "route-detail");
			},
			/**
			 * 编辑警卫路线时显示警卫路线缓冲区及激活警卫路线编辑功能
			 * @param data - 警卫路线数据
			 * @param startPoint - 警卫路线开始点位
			 * @param stopPoint - 警卫路线结束点位
			 * @param ployLineObj - 警卫路线线条信息
			 * @private
			 */
			_showPoliceLineBufferAndActive = function (data, startPoint, stopPoint, ployLineObj) {
				//第五步：显示缓冲区并缓存路线信息到影藏域
				if (data.bufferpoint) {
					//显示缓冲区域
					_showBuffer(data.bufferpoint, 1);
					//隐藏域赋值
					_bufferPoint = MapCommon.convertArrayToGeoJson(data.bufferpoint.coordinates[0], "Polygon");
				}
				//存储绘制对象
				_startPoint = MapCommon.convertArrayToGeoJson([startPoint], "Point");
				_stopPoint = MapCommon.convertArrayToGeoJson([stopPoint], "Point");
				_pointinfo = MapCommon.convertArrayToGeoJson(data.pointinfo.coordinates[0], "Polyline");
				//实现警卫路线的编辑，拖拽功能(第六步、第七步)
				_activeGuardRoute(ployLineObj);
			};
		/**
		 * 绘制警卫路线
		 * @param params - 绘制参数
		 * @param leftPanel - 左侧页面对象，供回调使用
		 */
		scope.drawRoute = function(params, leftPanel){
			//保存参数
			_drawParams = params;
			//保存左侧页面对象，供回调
			_leftPanel = leftPanel;
			//标记正在绘制警卫路线
			Variable.isDrawGraphicFlag = true;
			//警卫路线绘制开始时，显示资源图层
			MapOverLayerCtrl.showAndHideOverLayers("on-show-guard-route-info", "on-draw");
			//清空页面对象
			//scope.clearRouteMapContext();
			//设置画笔
			Variable.drawtool.setMode(NPMapLib.DRAW_MODE_POLYLINE, function (extent, geometry, rings) {
				//绘制回调
				_drawPoliceLineCallback(extent, geometry, rings);
			});
			//激活鼠标跟踪文本
			Variable.map.activateMouseContext("单击开始绘制警卫路线，双击结束");
		};
		/**
		 * 动态修改缓冲区大小
		 * @param distance
		 */
		scope.modifyBuffer = function(distance) {
			//修改绘制参数
			$.extend(_drawParams, {distance: distance});
			//修改缓冲区
			if (_lastPolyline) {
				Variable.layers.guardRouteLayer.removeOverlay(_lastBuffer);
				//清除掉之前缓冲区上的摄像机（说明：getOverlays()方法得到的不是一个数组所以需要将）
				var guardRouteLayerOverlays = Variable.layers.guardRouteLayer.getOverlays();
				var list = [];
				for (var k in guardRouteLayerOverlays) {
					if (guardRouteLayerOverlays.hasOwnProperty(k)) {
						list.push(guardRouteLayerOverlays[k]);
					}
				}
				for (var m = 0, n = list.length; m < n; m++) {
					if (list[m].getData().type === "buffer") {
						Variable.layers.guardRouteLayer.removeOverlay(list[m]);
					}
				}
				//重新绘制缓冲区
				_refreshBufferArea(distance, _lastPolyline);
			}
		};
		/**
		 * 框选摄像机
		 * @param leftPanel - 左侧显示面板对象，用于回显
		 */
		scope.rectSelectCamerasToGuardroute = function(leftPanel) {
			if(_lastPolyline) {
				//保存左侧页面对象，供回调
				_leftPanel = leftPanel;
				//标记框选开始
				Variable.isRectSelectRouteCameraFlag = true;
				//框选摄像机时，显示资源图层
				MapOverLayerCtrl.showAndHideOverLayers("on-show-guard-route-info", "on-rect-select");
				//开启框选工具
				Variable.drawtool.setMode(NPMapLib.DRAW_MODE_RECT, _rectSelectCamerasToGuardrouteCallback);
				//激活鼠标跟踪文本
				Variable.map.activateMouseContext("按住鼠标左键拖选区域，释放完成绘制");
			} else {
				notify.warn("您还未绘制警卫路线，请点击起点开始绘制！");
			}
		};
		/**
		 * 范围内摄像机结果处理、勾选摄像机列表的结果处理，过滤掉重复的摄像机
		 * @param data - 新的摄像机数据
		 * @param needFormat - 是否需要格式化摄像机数据（勾选摄像机列表的结果处理有效）
		 */
		scope.setGeometryCameras = function (data, needFormat) {
			var cameras_odd = [], //存储原有的摄像机
				cameras_new = [], //存储新增摄像机
				cameras_odd = _leftPanel.getAlreadyCameras();
			//过滤新增摄像机中重复的内容
			for (var m = 0, n = data.length; m < n; m++) {
				if (cameras_odd.length > 0) {
					var flag = false;
					for (var v = 0, w = cameras_odd.length; v < w; v++) {
						if (data[m].id === cameras_odd[v].id) {
							flag = true;
							break;
						}
					}
					if (!flag) {
						cameras_new.push(data[m]);
					}
				} else {
					cameras_new.push(data[m]);
				}
			}
			//显示到地图上
			if (cameras_new.length > 0) {
				for (var i = 0; i < cameras_new.length; i++) {
					//如果是勾选来的摄像机数据，则需要格式化数据内容
					if(needFormat) {
						cameras_new[i].camera_status = cameras_new[i].status;
						cameras_new[i].camera_type = cameras_new[i].cameratype;
						cameras_new[i].cameraCode = cameras_new[i].cameracode;
						cameras_new[i].hd_channel = cameras_new[i].hd_channel ? cameras_new[i].hd_channel : cameras_new[i].hdchannel;
						cameras_new[i].sd_channel = cameras_new[i].sd_channel ? cameras_new[i].sd_channel : cameras_new[i].sdchannel;
					}
					//获取内容并显示
					var data = cameras_new[i];
					var marker = new NPMapLib.Symbols.Marker(new NPMapLib.Geometry.Point(data.longitude, data.latitude));
					_markerList.push(marker);
					data.cameraType = data.camera_type;
					var score = data.score;
					//获取摄像机状态与类型，以正确的显示摄像机图标
					var cameratype = MapCommon.getCameraTypeAndStatus(data);
					if (cameratype === "ballonline") {
						marker.setIcon((pvamapPermission.checkCameraPermissionByScore(score)) ? MapConst.guardRouteSymbol.cameraBallOnline() : MapConst.guardRouteSymbol.cameraBallOnlineForbid());
					} else if (cameratype === "balloffline") {
						marker.setIcon((pvamapPermission.checkCameraPermissionByScore(score)) ? MapConst.guardRouteSymbol.cameraBallOffline() : MapConst.guardRouteSymbol.cameraBallOfflineForbid());
					} else if (cameratype === "gunonline") {
						marker.setIcon((pvamapPermission.checkCameraPermissionByScore(score)) ? MapConst.guardRouteSymbol.cameraGunOnline() : MapConst.guardRouteSymbol.cameraGunOnlineForbid());
					} else {
						marker.setIcon((pvamapPermission.checkCameraPermissionByScore(score)) ? MapConst.guardRouteSymbol.cameraGunOffline() : MapConst.guardRouteSymbol.cameraGunOfflineForbid());
					}
					marker.setData({
						"cameraId": data.id
					});
					Variable.layers.guardRouteLayer.addOverlay(marker);
				}
			}
			//渲染左侧列表
			_leftPanel.renderLeftCameraList({
				cameras: cameras_new
			}, 1);
			//摄像机数量统计
			var num = $(".np-new-route-opera .camera-num").html();
			num = num?parseInt(num):0;
			$(".np-new-route-opera .camera-num").html(num + cameras_new.length);
		};
		/**
		 * 响应左侧删除摄像机事件
		 * @param cameraId - 摄像机id
		 */
		scope.deleteCameraMarker = function(cameraId) {
			//遍历
			for (var i = 0, j = _markerList.length; i < j; i++) {
				var tempData = _markerList[i].getData();
				//判断是否是该摄像机
				if (cameraId === tempData.cameraId) {
					Variable.layers.guardRouteLayer.removeOverlay(_markerList[i]);
					//查找地图上点位是否已经打开信息窗，如果已经打开，则关闭
					if(window.infowindow.checkInfoWindowExists() && Variable.lastClickData.longitude === tempData.longitude && Variable.lastClickData.latitude === tempData.latitude) {
						window.infowindow.closeInfoWindow();
					}
					_markerList.splice(i, 1);
					break;
				}
			}
		};
		/**
		 * 获取缓冲区摄像机列表后，渲染到左侧面板中
		 * @param data - 摄像机列表
		 */
		scope.setLeftCamerasInGeometry = function(data) {
			//渲染左侧列表
			_leftPanel.renderLeftCameraList(data, 0);
			//显示摄像机到地图上
			_showGuardRouteCamerasOnMap(data.cameras, "buffer", "");
		};
		/**
		 * 清空地图上图层上下文
		 * 1、编辑警卫路线时
		 * 2、添加警卫路线时
		 */
		scope.clearRouteMapContext = function() {
			//缓冲区对象
			_lastBuffer = null;
			//线条对象
			_lastPolyline = null;
			//警卫路线的起点
			_startPoint = null;
			//警卫路线的终点
			_stopPoint = null;
			//警卫路线点位信息
			_pointinfo = null;
			//缓冲区点位数据
			_bufferPoint = null;
			//警卫路线地图标注列表
			_markerList = [];
		};
		/**
		 * 显示警卫路线信息到地图上(编辑警卫路线回显时，分组警卫路线列表项点击选择时)
		 * @param routeData - 待显示的警卫路线数据
		 * @param tag - 为0编辑警卫路线，为1点选左侧分组上的警卫路线列表
		 * @param leftPanel - 左侧页面对象，供回调使用
		 * @param params - 编辑时，绘制线条中缓冲区范围
		 */
		scope.setRouteInfoOnMap = function(routeData, tag, leftPanel, params) {
			//保存左侧页面对象，供回调
			_leftPanel = leftPanel;
			//如果是编辑警卫路线，则清除页面上下文（如缓冲区等）
			if(tag === 0) {
				scope.clearRouteMapContext();
				//保存参数
				_drawParams = params;
			}
			//只显示警卫路线图层
			_showGuardRouteLayerOnly();
			//准备数据
			var data = routeData,
				pointinfo = routeData.pointinfo,
				zoom = routeData.zoom,
				layer = null;
			//设置图层
			if (tag === 1) {
				layer = Variable.layers.guardRouteAllLayer;
			} else {
				layer = Variable.layers.guardRouteLayer;
			}
			//在地图上显示路线
			var points = MapCommon.converGeoJSONToPoints(pointinfo),
				polyline = null;
			if (points) {
				polyline = MapCommon.polyline(points);
				polyline.setData({
					id: data.id
				});
				_lastPolyline = polyline;
				layer.addOverlay(polyline);
				//编辑/显示时，为了实现点击路线触发编辑功能，故将警卫路线线条设置ZIndex，方便点选
				polyline.setZIndex(1);
			}
			//居中显示路线
			var centerPoint = points[0];
			//设置地图缩放级别
			if (zoom > -1) {
				Variable.map.centerAndZoom(centerPoint, zoom);
			}
			//显示起点和终点
			var startPoint = points[0],
				stopPoint = points[points.length - 1];
			var startMarker = new NPMapLib.Symbols.Marker(new NPMapLib.Geometry.Point(startPoint.lon, startPoint.lat));
			startMarker.setIcon(MapConst.guardRouteSymbol.startPoint());
			startMarker.setData({
				id: data.id
			});
			var stopMarker = new NPMapLib.Symbols.Marker(new NPMapLib.Geometry.Point(stopPoint.lon, stopPoint.lat));
			stopMarker.setIcon(MapConst.guardRouteSymbol.stopPoint());
			stopMarker.setData({
				id: data.id
			});
			layer.addOverlay(startMarker);
			layer.addOverlay(stopMarker);
			//记录当前警卫路线起点和终点
			Variable.guardRoutePoints = {
				startGraphic: startMarker,
				endGraphic: stopMarker
			};
			//显示摄像机
			if (tag === 1) {
				//左侧点选时
				var cameras = _leftPanel.getThisGuardRouteCameras(data.id);
				//显示摄像机到地图上
				_showGuardRouteCamerasOnMap(cameras, data.id, "check");
			} else {
				//编辑警卫路线时显示摄像机(先获取)
				_controller.getCamerasInRoute({
					policeLineId: data.id,
					obj: null,
					clicktype: "edit-route"
				});
				//显示警卫路线并激活
				_showPoliceLineBufferAndActive(data, startPoint, stopPoint, polyline);
			}
		};
		/**
		 * 在地图上取消某条警卫路线和摄像机
		 * @param routeId - 警卫路线id，用于筛选
		 */
		scope.cancelGuardRouteOnMapById = function(routeId) {
			if (Variable.layers.guardRouteAllLayer) {
				var graphics = [];
				var overlayers = Variable.layers.guardRouteAllLayer.getOverlays();
				var list = [];
				for (var k in overlayers) {
					overlayers.hasOwnProperty(k) && list.push(overlayers[k]);
				}
				overlayers = list;
				for (var i = 0, j = overlayers.length; i < j; i++) {
					if (overlayers[i]) {
						if (overlayers[i].getData()) {
							if (overlayers[i].getData().id === routeId) {
								graphics.push(overlayers[i]);
							}
						}
					}
				}
				for (var m = 0, n = graphics.length; m < n; m++) {
					Variable.layers.guardRouteAllLayer.removeOverlay(graphics[m]);
				}
			}
		};
		/**
		 * 警卫路线分组上警卫路线摄像机列表点击，警卫路线编辑、新加时摄像机列表的点击
		 * @param camera - 摄像机数据
		 * @param tag - 为1标示点击警卫路线分组摄像机列表定位播放，为0标示点击新建、编辑警卫路线时页面摄像机列表定位播放
		 */
		scope.linkageToMapGeometry = function(camera, tag) {
			var markers = (tag === 1) ? Variable.layers.guardRouteAllLayer._overlays : Variable.layers.guardRouteLayer._overlays;
			try {
				for (var key in markers) {
					if (markers.hasOwnProperty(key) && markers[key].getData()) {
						var cameraData = markers[key].getData();
						//响应地图中该点
						if (cameraData.cameraId && cameraData.cameraId === camera.id) {
							//播放视频
							Variable.currentCameraData = $.extend(cameraData, camera, {
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
							MapCommon.showCameraInfoAndPlay(markers[key]);
						}
					}
				}
			} catch (e) {}
		};
		/**
		 * 点击分组下警卫路线的标题头，显示警卫路线，如果该警卫路线已经显示，则重新聚焦
		 * @param data - 警卫路线数据
		 */
		scope.showRouteOnFocus = function(data) {
			var pointinfo = data.pointinfo;
			//居中显示警卫路线
			var points = MapCommon.converGeoJSONToPoints(pointinfo);
			var centerPoint = points[0];
			Variable.map.setCenter(centerPoint);
		};
		/**
		 * 警卫路线编辑、保存时收集信息
		 */
		scope.getRouteInfo = function(){
			return{
				zoom: Variable.map.getZoom(),
				startPoint: _startPoint,
				stopPoint: _stopPoint,
				pointinfo: _pointinfo,
				bufferPoint: _bufferPoint
			};
		};
		/**
		 * 编辑警卫路线，获取摄像机列表后的展现
		 * @param data - 待显示的摄像机数据
		 * @param routeId - 警卫路线id
		 */
		scope.showCamerasOnEditRoute = function(data, routeId) {
			//将摄像机显示在左侧列表中
			_leftPanel.renderLeftCameraList(data, 0);
			//统计警卫路线摄像机数目
			$(".np-new-route-opera .camera-num").html(data.cameras.length);
			//在地图上显示摄像机
			_showGuardRouteCamerasOnMap(data.cameras, routeId, "edit");
		};
		/**
		 * 判断是否绘制警卫路线，供勾选判断使用、供框选右键结束判断
		 */
		scope.checkPloylineExists = function() {
			return _lastPolyline ? true : false;
		};

		//初始化页面
		scope.init = function (conctroller) {
			//保存控制器对象
			_controller = conctroller;
		};

		return scope;

	}({}, jQuery));

});
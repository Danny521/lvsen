/**
 * Created by Zhangyu on 2015/4/24.
 */
define([
	"js/npmap-new/map-init",
	"js/npmap-new/map-common",
	"js/npmap-new/map-variable",
	"js/npmap-new/map-permission",
	"js/npmap-new/map-const",
	"js/npmap-new/map-common-overlayer-ctrl",
	"jquery"
], function (PVAMap, MapCommon, Variable, pvamapPermission, Constant, MapOverLayerCtrl, jQuery) {

	return (function (scope, $) {
		var //控制器对象
			_controller = null,
			//防控圈的缓冲区对象
			_lastBuffer = null,
			//防控圈线条对象
			_lastPolygon = null,
			//防控圈绘制参数
			_drawCircleParams = null,
			//左侧面板对象
			_leftPanel = null,
			//当前绘制的防控圈的点位数据
			_pointinfo = null,
			//防控圈缓冲区数据
			_bufferPoints = null,
			//当前摄像机地图点位对象数组
			_markerList = [];

		var /**
			 * 绘制防控圈结束
			 * @author Li Dan
			 * @date   2014-12-24
			 */
			_drawEnd = function(extent, geometry, rings) {
				//标记绘制防控圈完成
				Variable.isDrawCircleFlag = false;
				//防控圈绘制结束时，隐藏资源图层
				MapOverLayerCtrl.showAndHideOverLayers("on-show-defence-circle-info", "on-draw-end");
				//注销鼠标跟踪文本
				Variable.map.deactivateMouseContext();
				//显示绘制图形
				var linepoints = geometry._points;
				var polyline = MapCommon.polyline(linepoints, _drawCircleParams.lineColor);
				_lastPolygon = polyline;
				//加载线
				Variable.layers.defenseCircle.addOverlay(polyline);
				polyline.setZIndex(1);
				//将绘制结果保存起来
				_pointinfo = MapCommon.convertArrayToGeoJson(linepoints, "Polyline");
				//刷新缓冲区
				if (_drawCircleParams.distance > 0) {
					_refreshBufferArea(_drawCircleParams.distance, polyline);
				}
				//实现防控圈的编辑，拖拽功能
				_activeDefenceCircle(polyline);
			},
			/**
			 * [显示及刷新防控圈旁边的缓冲区区域]
			 * @author Li Dan
			 * @date   2014-12-23
			 */
			_refreshBufferArea = function(distance, ployLineObj) {
				//绘制新的缓冲区
				var params = new NPMapLib.Services.bufferParams();
				params.projection = Variable.map.getProjection();
				params.distance = distance;
				params.units = "m";
				params.geometry = ployLineObj; //需要数据转换
				if (!PVAMap.geometryService) {
					PVAMap.geometryService = new NPMapLib.Services.BufferService(Variable.map, NPMapLib.MAPTYPE_NPGIS);
				}
				var buffer = PVAMap.geometryService.buffer(mapConfig.geometryServiceUrl, params, function (result) {
					_showBuffer(result);
				});
			},
			/**
			 * 实现防控圈的编辑，拖拽功能
		     * @param ployLineObj - 绘制的防控圈线条数据
			 * @private
			 */
			_activeDefenceCircle = function(ployLineObj) {
				//第六步：触发编辑功能
				ployLineObj.enableEditing(NPMapLib.ModifyFeature_RESHAPE);
				//第七步：对警卫路线添加编辑监听事件(拖动警卫路线的回调函数)
				ployLineObj.addEventListener(NPMapLib.POLYLINE_EVENT_LINE_MODIFIED, function (result) {
					//清除掉之前的缓冲区
					if (_lastBuffer) {
						Variable.layers.defenseCircle.removeOverlay(_lastBuffer);
					}
					//清除掉之前的摄像机
					var defenseCircleOverlays = Variable.layers.defenseCircle.getOverlays();
					var cameraOverlays = [];
					var list = [];
					for (var k in defenseCircleOverlays) {
						defenseCircleOverlays.hasOwnProperty(k) && list.push(defenseCircleOverlays[k]);
					}
					defenseCircleOverlays = list;
					//获取需要移除的摄像机
					for (var i = 0, j = defenseCircleOverlays.length; i < j; i++) {
						if (defenseCircleOverlays[i].getData().type === "buffer") {
							cameraOverlays.push(defenseCircleOverlays[i]);
						}
					}
					//将之前的摄像机移除掉
					for (var m = 0, n = cameraOverlays.length; m < n; m++) {
						Variable.layers.defenseCircle.removeOverlay(cameraOverlays[m]);
					}
					//刷新缓冲区域
					if (_drawCircleParams.distance > 0) {
						_refreshBufferArea(_drawCircleParams.distance, result);
					}
					//设置隐藏域内容
					polyline = result._points;
					//保存线条内容数据
					_pointinfo = MapCommon.convertArrayToGeoJson(polyline, "Polyline");
				});
			},
			/**
			 * 显示缓冲区
			 * [缓冲区加载]
			 */
			_showBuffer = function(result) {
				//从服务的回调接口中获取
				var bufferPoints = [];
				for (var i = 0, j = result.rings.length; i < j; i++) {
					var arr = JSON.parse(MapCommon.convertArrayToGeoJson(result.rings[i], "Polygon"));
					bufferPoints.push(arr.coordinates[0]);
				}
				bufferPoints = {
					"type": "Polygon",
					"coordinates": bufferPoints
				};
				bufferPoints = JSON.stringify(bufferPoints);
				//存储buffer数据
				_bufferPoints = bufferPoints;
				//显示缓冲区
				var bufferResult = new NPMapLib.Geometry.Polygon(result.rings, {
					color: "#000000", //颜色
					fillColor: "#000000", //填充颜色
					weight: 0, //宽度，以像素为单位
					opacity: 0.24, //透明度，取值范围0 - 1
					fillOpacity: 0.24 //填充的透明度，取值范围0 - 1
				});
				_lastBuffer = bufferResult;
				Variable.layers.defenseCircle.addOverlay(bufferResult);
				bufferResult.setZIndex(0);
				//获取缓冲区范围内的摄像机
				_controller.getCamerasInRange({
					geometry: bufferPoints
				}, 0);
			},
			/**
			 * 框选摄像机信息结束
			 * @author Li Dan
			 * @date   2014-12-24
			 */
			_slectEnd = function(extent, geometry, rings) {
				//绘制标志
				Variable.isRectSelectCircleCameraFlag = false;
				//框选摄像机结束时，显示资源图层
				MapOverLayerCtrl.showAndHideOverLayers("on-show-defence-circle-info", "on-rect-select-end");
				//注销鼠标文字跟踪
				Variable.map.deactivateMouseContext();
				//获取绘制坐标信息
				var points = MapCommon.convertArrayToGeoJson(geometry._points, "Polygon");
				//获取框选范围内的摄像机
				_controller.getCamerasInRange({
					geometry: points
				}, 1);
			},
			/**
			 * 过滤重复摄像机
			 * @param newCameras - 未选中的摄像机
			 * @param oldCameras - 已选中的摄像机
			 * @returns {Array} - 新的摄像机数据
			 * @private
			 */
			_filterCameras = function(newCameras, oldCameras) {
				var resultCameras = [];
				//过滤新增摄像机中重复的内容
				for (var m = 0, n = newCameras.length; m < n; m++) {
					var flag = false;
					if (oldCameras.length > 0) {
						for (var k = 0, l = oldCameras.length; k < l; k++) {
							if (newCameras[m].id + "" === oldCameras[k].id + "") {
								flag = true;
								break;
							}
						}
					}
					if (!flag) {
						newCameras[m].camera_status = newCameras[m].status ? newCameras[m].status : newCameras[m].camera_status;
						newCameras[m].camera_type = newCameras[m].cameratype ? newCameras[m].cameratype : newCameras[m].camera_type;
						newCameras[m].cameraCode = newCameras[m].cameracode ? newCameras[m].cameracode : newCameras[m].cameraCode;
						newCameras[m].hd_channel = newCameras[m].hd_channel ? newCameras[m].hd_channel : newCameras[m].hdchannel;
						newCameras[m].sd_channel = newCameras[m].sd_channel ? newCameras[m].sd_channel : newCameras[m].sdchannel;
						resultCameras.push(newCameras[m]);
					}
				}
				return resultCameras;
			};

		/**
		 * 显示缓冲区范围内的摄像机
		 * @param cameras - 摄像机数据
		 */
		scope.setCamerasInBuffer = function(cameras) {
			for (var i = 0, j = cameras.length; i < j; i++) {
				var data = cameras[i];
				data.cameraType = data.camera_type;
				var marker = new NPMapLib.Symbols.Marker(new NPMapLib.Geometry.Point(data.longitude, data.latitude));
				var cameratype = MapCommon.getCameraTypeAndStatus(data);
				var score = data.score;
				if (cameratype === "ballonline") {
					marker.setIcon((pvamapPermission.checkCameraPermissionByScore(score)) ? Constant.guardRouteSymbol.cameraBallOnline() : Constant.guardRouteSymbol.cameraBallOnlineForbid());
				} else if (cameratype === "balloffline") {
					marker.setIcon((pvamapPermission.checkCameraPermissionByScore(score)) ? Constant.guardRouteSymbol.cameraBallOffline() : Constant.guardRouteSymbol.cameraBallOfflineForbid());
				} else if (cameratype === "gunonline") {
					marker.setIcon((pvamapPermission.checkCameraPermissionByScore(score)) ? Constant.guardRouteSymbol.cameraGunOnline() : Constant.guardRouteSymbol.cameraGunOnlineForbid());
				} else {
					marker.setIcon((pvamapPermission.checkCameraPermissionByScore(score)) ? Constant.guardRouteSymbol.cameraGunOffline() : Constant.guardRouteSymbol.cameraGunOfflineForbid());
				}
				marker.setData({
					"type": "buffer"
				});
				Variable.layers.defenseCircle.addOverlay(marker);
			}
		};

		/**
		 * 画防控圈
		 * @param opt - 绘制防控圈的配置信息
		 */
		scope.drawCircle = function(opt) {
			//清空缓冲区
			_lastBuffer = null;
			//绘制参数
			_drawCircleParams = opt;
			//标记正在绘制防控圈
			Variable.isDrawCircleFlag = true;
			//防控圈绘制开始时，隐藏资源图层
			MapOverLayerCtrl.showAndHideOverLayers("on-show-defence-circle-info", "on-draw");
			//清除isShow属性不存在的图层（新建新防控圈时始终保证其他的圈一直显示状态）
			var graphics = Variable.layers.defenseCircle.getOverlays();
			var list = [];
			for (var k in graphics) {
				list.push(graphics[k]);
			}
			if (list) {
				for (var i = 0, j = list.length; i < j; i++) {
					if (!(list[i].getData().isShow)) {
						list[i].disableEditing();
						Variable.layers.defenseCircle.removeOverlay(list[i]);
					}
				}
			}
			//激活绘制工具
			Variable.drawtool.setMode(NPMapLib.DRAW_MODE_POLYLINE, function(extent, geometry, rings){
				_drawEnd(extent, geometry, rings);
			});
			//激活鼠标跟踪文本
			Variable.map.activateMouseContext("单击绘制防控圈，双击结束，右键取消");
		};
		/**
		 * 动态修改缓冲区大小
		 * @param distance
		 */
		scope.modifyBuffer = function(distance) {
			//修改绘制参数
			$.extend(_drawCircleParams, {distance: distance});
			//修改缓冲区
			if (_lastBuffer) {
				Variable.layers.defenseCircle.removeOverlay(_lastBuffer);
				//清除掉之前缓冲区上的摄像机（说明：getOverlays()方法得到的不是一个数组所以需要将）
				var defenseCircleOverlays = Variable.layers.defenseCircle.getOverlays();
				var list = [];
				for (var k in defenseCircleOverlays) {
					defenseCircleOverlays.hasOwnProperty(k) && list.push(defenseCircleOverlays[k]);
				}
				for (var m = 0, n = list.length; m < n; m++) {
					if (list[m].getData().type === "buffer") {
						Variable.layers.defenseCircle.removeOverlay(list[m]);
					}
				}
				//重新绘制缓冲区
				_refreshBufferArea(distance, _lastPolygon);
			}
		};
		/**
		 * 框选摄像机
		 * @param leftPanel - 左侧控制器对象，回调使用
		 */
		scope.rectSelectCameras = function(leftPanel) {
			//框选摄像机
			if (_lastPolygon) {
				//左侧面板对象
				_leftPanel = leftPanel;
				//绘制标志
				Variable.isRectSelectCircleCameraFlag = true;
				//框选摄像机开始时，显示资源图层
				MapOverLayerCtrl.showAndHideOverLayers("on-show-defence-circle-info", "on-rect-select");
				//激活绘制工具
				Variable.drawtool.setMode(NPMapLib.DRAW_MODE_RECT, _slectEnd);
				//激活鼠标文字跟踪
				Variable.map.activateMouseContext("拖动鼠标框选摄像机，右键取消");
			} else {
				notify.warn("请先绘制防控圈！");
			}
		};
		/**
		 * 显示缓冲区范围内的摄像机
		 * @param cameras - 摄像机数据
		 */
		scope.setCamerasInGeometry = function(cameras) {
			var newCameras = cameras,
				oldCameras = [];
			//获取以前的摄像机
			oldCameras = _leftPanel.getAlreadyCameras();
			//过滤并生成新的摄像机数组
			var resultCameras = [];
			//加载新增摄像机
			if (oldCameras.length > 0) {
				//过滤摄像机
				resultCameras = _filterCameras(newCameras, oldCameras);
			} else {
				resultCameras = newCameras;
			}
			//渲染左侧摄像机获取模板
			_leftPanel.renderLeftCameraList(resultCameras);
			//在地图上显示新增的摄像机
			if (resultCameras) {
				//清空点位数组
				_markerList.length = 0;
				//遍历新的摄像机数据
				for (var i = 0, j = resultCameras.length; i < j; i++) {
					var data = resultCameras[i];
					var marker = new NPMapLib.Symbols.Marker(new NPMapLib.Geometry.Point(data.longitude, data.latitude));
					_markerList.push(marker);
					data.cameraType = data.camera_type;
					//获取摄像机状态与类型，以正确的显示摄像机图标
					var cameratype = MapCommon.getCameraTypeAndStatus(data);
					var score = data.score;
					if (cameratype === "ballonline") {
						marker.setIcon((pvamapPermission.checkCameraPermissionByScore(score))?Constant.guardRouteSymbol.cameraBallOnline():Constant.guardRouteSymbol.cameraBallOnlineForbid());
					} else if (cameratype === "balloffline") {
						marker.setIcon((pvamapPermission.checkCameraPermissionByScore(score))?Constant.guardRouteSymbol.cameraBallOffline():Constant.guardRouteSymbol.cameraBallOfflineForbid());
					} else if (cameratype === "gunonline") {
						marker.setIcon((pvamapPermission.checkCameraPermissionByScore(score))?Constant.guardRouteSymbol.cameraGunOnline():Constant.guardRouteSymbol.cameraGunOnlineForbid());
					} else {
						marker.setIcon((pvamapPermission.checkCameraPermissionByScore(score))?Constant.guardRouteSymbol.cameraGunOffline():Constant.guardRouteSymbol.cameraGunOfflineForbid());
					}
					marker.setData({
						id: data.id
					});
					Variable.layers.defenseCircle.addOverlay(marker);
				}
			}
		};
		/**
		 * 相应左侧删除摄像机事件，同步删除地图上标记
		 * @param id - 摄像机标记id
		 */
		scope.deleteCameraMark = function(id) {
			for (var i = 0, j = _markerList.length; i < j; i++) {
				if (id === _markerList[i].getData().id) {
					Variable.layers.defenseCircle.removeOverlay(_markerList[i]);
					break;
				}
			}
		};
		/**
		 * 点击防控圈分组时，显示组内所有的防控圈
		 * @param CircleDoms - 组内搜索防控圈的dom对象集合，以便解析并显示
		 */
		scope.showCirclesAndBufferOnMap = function(CircleDoms) {
			//显示防控圈组的防控圈列表，隐藏资源图层，显示防控圈相关图层
			MapOverLayerCtrl.showAndHideOverLayers("on-show-defence-circle-info", "group-detail");
			//获取防控圈列表
			if (CircleDoms.length) {
				var dataZoom = {
					zoom: jQuery(CircleDoms[0]).data().zoom,
					point: MapCommon.converGeoJSONToPoints($(CircleDoms[0]).data().pointinfo)[0]
				}
			}
			//在地图上显示信息
			for (var i = 0, j = CircleDoms.length; i < j; i++) {
				var data = $(CircleDoms[i]).data();
				//显示缓冲区
				if (data.bufferpoint) {
					//显示缓冲区到地图上
					var bufferpoints = data.bufferpoint.coordinates;
					var temps = [];
					for (var k = 0; k < bufferpoints.length; k++) {
						var temp = [];
						for (var m = 0; m < bufferpoints[k].length; m++) {
							var point = new NPMapLib.Geometry.Point(bufferpoints[k][m][0], bufferpoints[k][m][1]);
							temp.push(point);
						}
						if (temp.length > 0) {
							temps.push(temp);
						}
					}
					var bufferResult = new NPMapLib.Geometry.Polygon(temps, {
						color: "#000000", //颜色
						fillColor: "#000000", //填充颜色
						weight: 0, //宽度，以像素为单位
						opacity: 0.24, //透明度，取值范围0 - 1
						fillOpacity: 0.24 //填充的透明度，取值范围0 - 1
					});
					bufferResult.setData({
						id: data.id
					});
					Variable.layers.defenseCircle.addOverlay(bufferResult);
					bufferResult.setZIndex(0);
				}
				//显示防控圈
				if (data.pointinfo) {
					var points = MapCommon.converGeoJSONToPoints(data.pointinfo);
					if (points) {
						var polyline = MapCommon.polyline(points, data.color);
						polyline.setData({
							id: data.id
						});
						Variable.layers.defenseCircle.addOverlay(polyline);
						polyline.setZIndex(1);
					}
				}
				//获取最小图层级别的防控圈信息：图层级别、第一个点
				if (data.zoom < dataZoom.zoom) {
					dataZoom.zoom = data.zoom;
					dataZoom.point = points[0];
				}
			}
			//居中显示
			if (dataZoom && dataZoom.zoom > -1) {
				Variable.map.centerAndZoom(dataZoom.point, dataZoom.zoom);
			}
		};
		/**
		 * 根据防控圈的id去掉高亮并隐藏摄像机
		 * @param id - 防控圈id
		 * @param isSearch - 是否为搜索模式
		 */
		scope.hideCamerasAndRemoveHighligh = function(id, isSearch) {
			var graphics = Variable.layers.defenseCircle.getOverlays();
			var list = [];
			for (var k in graphics) {
				graphics.hasOwnProperty(k) && list.push(graphics[k]);
			}
			graphics = list
			var removeGraphics = [];
			for (var m = 0, n = graphics.length; m < n; m++) {
				//如果当前标注id是该防控圈的，并且处于高亮状态，移除
				if (graphics[m]) {
					var tempDataId = graphics[m].getData().circleId;
					if (isSearch) {
						if (tempDataId === id) {
							removeGraphics.push(graphics[m]);
						}
					} else {
						if ((tempDataId === id) && (graphics[m].getData().circleType === "highlight")) {
							removeGraphics.push(graphics[m]);
						}
					}
				}
			}
			for (var i = 0, j = removeGraphics.length; i < j; i++) {
				Variable.layers.defenseCircle.removeOverlay(removeGraphics[i]);
			}
		};
		/**
		 * 在地图上加载防控圈信息
		 * @param data - 防控圈数据
		 * @param id - 防控圈所属组id
		 * @param drawParams - 防控圈绘制参数（编辑时读上一次的）
		 */
		scope.setCircleInfoOnMap = function(data, id, drawParams) {
			//存储绘制参数
			_drawCircleParams = drawParams;
			//第一步：地图显示居中以及比例
			/*var zoom = data.zoom, location = JSON.parse(data.pointInfo).coordinates[0][0];
			var pt = new NPMapLib.Geometry.Point(location[0], location[1]);
			Variable.map.centerAndZoom(pt, zoom);*/
			//第二步：显示缓冲区
			if (data.bufferPoint) {
				_bufferPoints = data.bufferPoint;
				var bufferpoints = JSON.parse(data.bufferPoint).coordinates;
				var temps = [];
				for (var k = 0; k < bufferpoints.length; k++) {
					var temp = [];
					for (var m = 0; m < bufferpoints[k].length; m++) {
						var point = new NPMapLib.Geometry.Point(bufferpoints[k][m][0], bufferpoints[k][m][1]);
						temp.push(point);
					}
					if (temp.length > 0) {
						temps.push(temp);
					}
				}
				var bufferResult = new NPMapLib.Geometry.Polygon(temps, {
					color: "#000000", //颜色
					fillColor: "#000000", //填充颜色
					weight: 0, //宽度，以像素为单位
					opacity: 0.24, //透明度，取值范围0 - 1
					fillOpacity: 0.24 //填充的透明度，取值范围0 - 1
				});
				_lastBuffer = bufferResult;
				Variable.layers.defenseCircle.addOverlay(bufferResult);
				bufferResult.setZIndex(0);
			}
			//第三步：显示防控圈
			if (data.pointInfo) {
				_pointinfo = data.pointInfo;
				var points = MapCommon.converGeoJSONToPoints(JSON.parse(data.pointInfo));
				if (points) {
					var polyline = MapCommon.polyline(points, data.color);
					_lastPolygon = polyline;
					Variable.layers.defenseCircle.addOverlay(polyline);
					polyline.setZIndex(1);
					//实现防控圈的编辑，拖拽功能
					_activeDefenceCircle(polyline);
					//设置地图范围
					var extent = polyline.getExtent();
					Variable.map.zoomToExtent(extent);
				}
			}
			//第四步：显示摄像机
			_markerList.length = 0; //存放地图上的摄像机列表
			if (data.cameras) {
				//显示摄像机
				for (var i = 0, j = data.cameras.length; i < j; i++) {
					var tempData = data.cameras[i];
					var marker = new NPMapLib.Symbols.Marker(new NPMapLib.Geometry.Point(tempData.longitude, tempData.latitude));
					marker.setData({
						id: data.cameras[i].id
					});
					_markerList.push(marker);
					tempData.cameraType = tempData.camera_type;
					//获取摄像机状态与类型，以正确的显示摄像机图标
					var cameratype = MapCommon.getCameraTypeAndStatus(tempData);
					var score = tempData.score;
					if (cameratype === "ballonline") {
						marker.setIcon((pvamapPermission.checkCameraPermissionByScore(score)) ? Constant.guardRouteSymbol.cameraBallOnline() : Constant.guardRouteSymbol.cameraBallOnlineForbid());
					} else if (cameratype === "balloffline") {
						marker.setIcon((pvamapPermission.checkCameraPermissionByScore(score)) ? Constant.guardRouteSymbol.cameraBallOffline() : Constant.guardRouteSymbol.cameraBallOfflineForbid());
					} else if (cameratype === "gunonline") {
						marker.setIcon((pvamapPermission.checkCameraPermissionByScore(score)) ? Constant.guardRouteSymbol.cameraGunOnline() : Constant.guardRouteSymbol.cameraGunOnlineForbid());
					} else {
						marker.setIcon((pvamapPermission.checkCameraPermissionByScore(score)) ? Constant.guardRouteSymbol.cameraGunOffline() : Constant.guardRouteSymbol.cameraGunOfflineForbid());
					}
					Variable.layers.defenseCircle.addOverlay(marker);
				}
			}
			//第五步：在地图上显示组内其他防控圈
			scope.showOtherCirclesInGroup(id, data);
		};

		/**
		 * 根据分组id显示组内其他防控圈
		 * @param id - 分组id
		 * @param data - 当前防控圈信息
		 */
		scope.showOtherCirclesInGroup = function(id, data) {
			if (!data) {
				//新建防控圈
				_controller.getOtherCirclesInGroup({
					id: id,
					res: {
						pointInfo: null
					}
				});
			} else {
				//编辑防控圈
				_controller.getOtherCirclesInGroup({id: id, res: data});
			}
		};

		/**
		 * 编辑时显示该分组下其他的防控圈
		 * @param tem - 当前分组下的防控圈数据
		 * @param res - 待编辑的防控圈数据
		 */
		scope.setOtherCirclesInGroup = function(tem, res) {
			//显示组内已有的全部防控圈
			if (tem.count) {
				for (var i = 0, j = tem.count; i < j; i++) {
					if (tem.defenseCircles[i].pointInfo !== res.pointInfo) {
						var points = MapCommon.converGeoJSONToPoints(JSON.parse(tem.defenseCircles[i].pointInfo));
						if (points) {
							var polyline = MapCommon.polyline(points, tem.defenseCircles[i].color);
							Variable.layers.defenseCircle.addOverlay(polyline);
							polyline.setZIndex(1);
							polyline.setData({
								isShow: true
							});
						}
					}
				}
			}
		};
		/**
		 * 保存防控圈时，收集地图上的防控圈信息
		 */
		scope.getCircleInfo = function() {
			return {
				pointInfo: _pointinfo,
				zoom: Variable.map.getZoom(),
				bufferPoint: _bufferPoints
			}
		};
		/**
		 * 高亮防控圈并显示该防控圈摄像机
		 * @param Dom - 防控圈项dom对象
		 * @param isSearch - 是否是搜索模式下
		 */
		scope.showCamerasAndHighlightCircle = function(Dom, isSearch) {
			var data = Dom.data();
			var CameraDoms = Dom.find(".defence-camera-list li.camera-item");
			var circleId = data.id;
			//显示防控圈
			if (isSearch) {
				//显示缓冲区
				if (data.bufferpoint) {
					var bufferpoints = data.bufferpoint.coordinates;
					var temps = [];
					for (var k = 0; k < bufferpoints.length; k++) {
						var temp = [];
						for (var m = 0; m < bufferpoints[k].length; m++) {
							var point = new NPMapLib.Geometry.Point(bufferpoints[k][m][0], bufferpoints[k][m][1]);
							temp.push(point);
						}
						if (temp.length > 0) {
							temps.push(temp);
						}
					}
					var bufferResult = new NPMapLib.Geometry.Polygon(temps, {
						color: "#000000", //颜色
						fillColor: "#000000", //填充颜色
						weight: 0, //宽度，以像素为单位
						opacity: 0.24, //透明度，取值范围0 - 1
						fillOpacity: 0.24 //填充的透明度，取值范围0 - 1
					});
					bufferResult.setData({
						id: circleId
					});
					Variable.layers.defenseCircle.addOverlay(bufferResult);
					bufferResult.setZIndex(0);
				}
				//显示防控圈
				if (data.pointinfo) {
					var points = MapCommon.converGeoJSONToPoints(data.pointinfo);
					if (points) {
						var polyline = MapCommon.polyline(points, data.color);
						polyline.setData({
							id: circleId
						});
						Variable.layers.defenseCircle.addOverlay(polyline);
						polyline.setZIndex(1);
					}
					//居中显示
					/*var point = points[0];
					if (data.zoom > -1) {
						Variable.map.centerAndZoom(point, data.zoom);
					}*/
					var extent = polyline.getExtent();
					Variable.map.zoomToExtent(extent);
				}
			} else {
				//高亮防控圈
				var points = MapCommon.converGeoJSONToPoints(data.pointinfo);
				if (points) {
					var polyline = MapCommon.polyline(points, "#ff0000");
					polyline.setData({
						circleId: circleId,
						circleType: "highlight"
					});
					Variable.layers.defenseCircle.addOverlay(polyline);
					polyline.setZIndex(1);
				}
				//居中显示
				/*var point = points[0];
				if (data.zoom > -1) {
					Variable.map.centerAndZoom(point, data.zoom);
				}*/
				var extent = polyline.getExtent();
				Variable.map.zoomToExtent(extent);
			}
			//显示摄像机
			for (var i = 0, j = CameraDoms.length; i < j; i++) {
				var data = $(CameraDoms[i]).data();
				var marker = new NPMapLib.Symbols.Marker(new NPMapLib.Geometry.Point(data.longitude, data.latitude));
				data.cameraType = data.type;
				//获取摄像机状态与类型，以正确的显示摄像机图标
				var cameratype = MapCommon.getCameraTypeAndStatus(data);
				var score = data.score;
				if (cameratype === "ballonline") {
					marker.setIcon((pvamapPermission.checkCameraPermissionByScore(score)) ? Constant.guardRouteSymbol.cameraBallOnline() : Constant.guardRouteSymbol.cameraBallOnlineForbid());
				} else if (cameratype === "balloffline") {
					marker.setIcon((pvamapPermission.checkCameraPermissionByScore(score)) ? Constant.guardRouteSymbol.cameraBallOffline() : Constant.guardRouteSymbol.cameraBallOfflineForbid());
				} else if (cameratype === "gunonline") {
					marker.setIcon((pvamapPermission.checkCameraPermissionByScore(score)) ? Constant.guardRouteSymbol.cameraGunOnline() : Constant.guardRouteSymbol.cameraGunOnlineForbid());
				} else {
					marker.setIcon((pvamapPermission.checkCameraPermissionByScore(score)) ? Constant.guardRouteSymbol.cameraGunOffline() : Constant.guardRouteSymbol.cameraGunOfflineForbid());
				}
				marker.setData($.extend({
					circleId: circleId,
					circleType: "highlight"
				}, data));
				Variable.layers.defenseCircle.addOverlay(marker);
			}
		};

		/**
		* 防控圈分组上防控圈摄像机列表点击
		* @param cameraId - 摄像机id
		*/
		scope.linkageToMapGeometry = function(cameraId) {
			var markers = Variable.layers.defenseCircle._overlays;
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
							MapCommon.showCameraInfoAndPlay(markers[key]);
						}
					}
				}
			} catch (e) {};
		};

		/**
		 * 判断是否绘制防控圈，供框选右键结束判断
		 */
		scope.checkPloylineExists = function() {
			return _lastPolygon ? true : false;
		};

		//初始化页面
		scope.init = function (conctroller) {
			//保存控制器对象
			_controller = conctroller;
		};

		return scope;

	}({}, jQuery));

});
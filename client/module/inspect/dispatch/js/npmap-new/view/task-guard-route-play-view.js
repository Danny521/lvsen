/**
 * Created by Zhangyu on 2015/5/7.
 */
define([
	"js/npmap-new/map-variable",
	"js/npmap-new/map-const",
	"jquery"
], function (Variable, Const, jQuery) {

	return (function (scope, $) {

		var //初始化左侧播放面板控制对象
			_leftPlayPanel = null,
			//记录警卫路线对应的gps小车信息
			_gpsMarkerInfo = [];
		/**
		 * 记录gps信息
		 * @param gpsInfo - gps信息
		 * @private
		 */
		var _addToMarkerList = function(gpsInfo) {
			var i, isNew = false;
			//遍历信息，看有没有
			for (i = 0; i < _gpsMarkerInfo.length; i++) {
				if(gpsInfo.routeId === _gpsMarkerInfo[i].routeId) {
					break;
				}
			}
			//如果没有则添加
			if(i === _gpsMarkerInfo.length) {
				//标记是新的
				isNew = true;
				//记录信息
				_gpsMarkerInfo.push(gpsInfo);
			}
			return {
				isNew: isNew,
				index: i
			}
		};
		/**
		 * 停止播放警卫路线
		 * @param routeId - 待停止的警卫路线id
		 */
		scope.stopGuardRouteById = function(routeId) {
			//遍历信息，看有没有
			for (var i = 0; i < _gpsMarkerInfo.length; i++) {
				if(routeId === _gpsMarkerInfo[i].routeId) {
					//清除该路线下的地图gps覆盖物
					Variable.layers.gpsCarLayer.removeOverlay(_gpsMarkerInfo[i].marker.id);
					Variable.layers.gpsCarLayer.removeOverlay(_gpsMarkerInfo[i].gpsName.id);
					//删除该项
					_gpsMarkerInfo.splice(i, 1);
				}
			}
			//判断是否为空,则清除
			if(_gpsMarkerInfo.length === 0) {
				//叠加GPS小车图层
				Variable.layers.gpsCarLayer.removeAllOverlays();
				Variable.layers.gpsCarLayer.hide();
			}
		};
		/**
		 * 根据获取的gps即时信息显示警卫路线小车的位置
		 * @param gpsInfo - gps信息
		 */
		scope.refreshGpsCarPos = function(gpsInfo) {
			//判断当前是否用到了gps图层
			if(_gpsMarkerInfo.length === 0) {
				//叠加GPS小车图层
				Variable.layers.gpsCarLayer.removeAllOverlays();
			}
			Variable.layers.gpsCarLayer.show();
			//记录当前的gps信息
			var curGpsInfo = _addToMarkerList(gpsInfo);
			//判断有无坐标信息
			if (gpsInfo.x && gpsInfo.y) {
				//点位信息
				var point = new NPMapLib.Geometry.Point(gpsInfo.x, gpsInfo.y);
				//判断是否已经存在点位对象
				if(curGpsInfo.isNew) {
					//图片标注
					var symbol = Const.guardRouteSymbol.carSymbol();
					//标注
					var marker = new NPMapLib.Symbols.Marker(point);
					//创建文件标注，目的：记录当前监控点的信息，参数 id,title,img
					var label = new NPMapLib.Symbols.Label("GPS编号：" + gpsInfo.id);

					label.setStyle({
						Color: "red"
					});
					label.setOffset(new NPMapLib.Geometry.Size(-2, 22));
					marker.setIcon(symbol);
					marker.setLabel(label);

					//添加路线名称
					var gpsName = new NPMapLib.Symbols.Label("路线名称：" + gpsInfo.name);
					gpsName.setStyle({
						Color: "red"
					});
					gpsName.setOffset(new NPMapLib.Geometry.Size(-2, 40));
					gpsName.setPosition(point);
					//添加该覆盖物
					Variable.layers.gpsCarLayer.addOverlay(marker);
					Variable.layers.gpsCarLayer.addOverlay(gpsName);
					//存储点位信息
					_gpsMarkerInfo[curGpsInfo.index].marker = marker;
					_gpsMarkerInfo[curGpsInfo.index].gpsName = gpsName;
				} else {
					//该点位对象已经存在，则只需要移动下位置
					_gpsMarkerInfo[curGpsInfo.index].marker.setPosition(point);
					_gpsMarkerInfo[curGpsInfo.index].gpsName.setPosition(point);
				}
			}
		};
		/**
		 * 显示警卫路线播放时，地图上正在播放的摄像机
		 * @param camera - 摄像机信息
		 */
		scope.setActiveCameraOnMap = function(camera) {
			if (camera.longitude && camera.latitude) {
				var point = new NPMapLib.Geometry.Point(camera.longitude, camera.latitude);
				var cameratype = camera.cameratype;
				if (cameratype || cameratype === 0) {
					cameratype = cameratype;
				} else {
					cameratype = camera.camera_type;
				}
				//重置当前播放摄像机位置
				if (Variable.currCameraOfGuardRoute) {
					//重置图标
					if (cameratype === 0) {
						Variable.currCameraOfGuardRoute.setIcon(Const.guardRouteSymbol.currentCameraGun());
					}
					if (cameratype === 1) {
						Variable.currCameraOfGuardRoute.setIcon(Const.guardRouteSymbol.currentCameraBall());
					}
					//重置位置
					Variable.currCameraOfGuardRoute.setPosition(point);
					Variable.currCameraOfGuardRoute.refresh();
				} else {
					Variable.currCameraOfGuardRoute = new NPMapLib.Symbols.Marker(point);
					if (cameratype === 0) {
						Variable.currCameraOfGuardRoute.setIcon(Const.guardRouteSymbol.currentCameraGun());
					}
					if (cameratype === 1) {
						Variable.currCameraOfGuardRoute.setIcon(Const.guardRouteSymbol.currentCameraBall());
					}
					Variable.layers.guardRouteLayer.show();
					Variable.layers.guardRouteLayer.addOverlay(Variable.currCameraOfGuardRoute);
				}
				//居中
				Variable.map.setCenter(point);
			} else {
				notify.warn("该摄像机没有坐标信息！");
			}
		};

		/**
		 * 清除当前正在播放的摄像机
		 */
		scope.clearCameraOfGuardRoute = function(){
			if (Variable.currCameraOfGuardRoute) {
				Variable.layers.guardRouteLayer.removeOverlay(Variable.currCameraOfGuardRoute);
				Variable.layers.guardRouteLayer.hide();
				Variable.currCameraOfGuardRoute = null;
			}
		};
		/**
		 * 初始化
		 * @param leftPanel
		 */
		scope.init = function(leftPanel) {
			//初始化左侧播放面板控制对象，用来回调
			_leftPlayPanel = leftPanel;
		};

		return scope;

	}({}, jQuery));

});
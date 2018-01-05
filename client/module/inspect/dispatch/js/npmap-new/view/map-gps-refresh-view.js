/**
 * Created by Zhangyu on 2015/6/24.
 */
define([
	"jquery",
	"npmapConfig"
], function (jQuery) {

	return (function (scope, $) {
		var //控制器对象
			_controller = null;

		/**
		 * 触发刷新警力资源点位
		 * 警力资源显示时（地图工具栏，警力资源显示框勾选），如果地图图层达到了聚合的散开图层级别，则进行刷新
		 */
		scope.policePointMoving = function() {
			var movingMarkersInfo = {},
				movingMarkersIds = [],
				overlayLayer = window.map.getLayerByName("police-resource-layer");
			//如果当前图层存在，且显示出来了
			if (overlayLayer && overlayLayer.isVisible()) {
				//获取当前的视野范围
				var extent = window.map.getExtent();
				//获取视野范围内的点位对象
				var markers = overlayLayer.containFeatures(extent),
					extentRangeMarkerNum = markers.length;
				//判断是否超出了刷新数量上限，如果超出则当前此刷新直接返回
				if(extentRangeMarkerNum > mapConfig.pointRefresherConfig.refreshLimitNum) {
					//为了缓解压力，超过上限数量的刷新直接返回
					return;
				}
				//获取存在的点位对象信息
				for (var i = 0; i < extentRangeMarkerNum; i++) {
					var id = markers[i].getData().key;
					movingMarkersIds.push(id);
					movingMarkersInfo[id] = markers[i];
				}
				//发送请求
				_controller.getGpsInfoByIds(movingMarkersIds.join(","), movingMarkersInfo);
			}
		};
		/**
		 * 触发刷新,刷新地图视野范围内的警力资源
		 * @param data - 实时读取的警力点位信息
		 * @param markers - 待刷新的地图点位对象
		 */
		scope.policePointPosRefresh = function(data, markers) {
			for(var i = 0, len = data.length; i < len; i++) {
				var key = data[i].key,
					lon = data[i].lon,
					lat = data[i].lat;
				var curPoint = new NPMapLib.Geometry.Point(lon, lat);
				//更新marker位置
				markers[key].setPosition(curPoint);
			}
			//再次请求
			scope.policePointRefreshTimer();
		};
		/**
		 * 触发更新定时
		 */
		scope.policePointRefreshTimer = function() {
			if(mapConfig.pointRefresherConfig.refreshTimer) {
				window.clearTimeout(mapConfig.pointRefresherConfig.refreshTimer);
			}
			//重新延时
			mapConfig.pointRefresherConfig.refreshTimer = window.setTimeout(scope.policePointMoving, mapConfig.pointRefresherConfig.refreshTimeSpan);
		};

		//初始化页面
		scope.init = function (conctroller) {
			//保存控制器对象
			_controller = conctroller;
		};

		return scope;

	}({}, jQuery));

});
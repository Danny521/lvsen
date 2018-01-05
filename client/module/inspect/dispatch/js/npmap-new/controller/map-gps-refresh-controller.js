/**
 * Created by Zhangyu on 2015/6/24.
 */
define([
	"js/npmap-new/view/map-gps-refresh-view",
	"js/npmap-new/model/map-gps-refresh-model",
	"jquery"
], function (View, Model, jQuery) {

	return (function (scope, $) {
		//初始化页面
		View.init(scope);
		/**
		 * 触发资源点位动态刷新
		 */
		scope.triggerResRefresh = function() {
			//判断是否允许刷新
			if(!mapConfig.pointRefresherConfig.enable) {
				return;
			}
			//清空已有定时器
			scope.stopResRefresh();
			//如果当前已经达到了聚合图层散开图层时
			if (window.map.getZoom() >= mapConfig.clusterMarkerConfig.maxZoom) {
				//且勾选了警力资源，才进行刷新
				if($(".map-resource-list").find(".policecar-resource i.checkbox").hasClass("checked")) {
					//刷新
					mapConfig.pointRefresherConfig.refreshTimer = window.setTimeout(function () {
						View.policePointMoving();
					}, 1000);
				}
			}
		};

		/**
		 * 触发资源点位的停止刷新
		 */
		scope.stopResRefresh = function() {
			//清空已有定时器
			if(mapConfig.pointRefresherConfig.refreshTimer) {
				window.clearTimeout(mapConfig.pointRefresherConfig.refreshTimer);
			}
		};

		/**
		 * 视野范围内刷新gps资源点位，根据gps IDs读取实时位置并刷新
		 * @param data - gps IDs，读取参数
		 * @param markers - 地图上视野内需要动态刷新的gps点位
		 */
		scope.getGpsInfoByIds = function(data, markers) {
			//请求后台读取数据
			Model.getGpsInfoByIds({
				id: data
			}, {}).then(function (res) {
				if (res.code === 200) {
					View.policePointPosRefresh(res.data.gpsInfo || [], markers);
				} else {
					notify.error("警力实时数据读取失败！");
				}
			}, function () {
				notify.error("警力实时数据读取失败！网络或服务器异常！");
			});
		};

		return scope;

	}({}, jQuery));

});
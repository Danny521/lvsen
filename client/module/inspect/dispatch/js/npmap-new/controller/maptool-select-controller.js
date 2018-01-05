define([
	"js/npmap-new/view/maptool-select-view",
	"pubsub",
	"js/npmap-new/model/maptool-select-model",
	"js/npmap-new/model/maptool-searchInscope-model",
	"js/connection/controller/left-for-map-select-controller"
], function(mapSelectView, pubsub, Model, ScopeModel) {

	var mapSelectController = function() {
		var self = this;
		//初始化展现层
		mapSelectView.init(self);
		//订阅事件
		pubsub.subscribe("pageGeometryCamera", function(msg, obj) {
			self.setSearchCameras(obj);
		});
	};

	mapSelectController.prototype = {
		/**
		 * 设置选择的摄像机到左侧和地图上
		 * @author Li Dan
		 * @date   2014-12-12
		 * @param  {[type]}   data [description]
		 */
		setSearchCameras: function(data) {
			Model.CamerasInGeometry(data, {
				beforSend: function() {
					mapSelectView.beforeSendSearch();
				}
			}).then(function(result) {
				result.data.reqParam = data;
				mapSelectView.searchSuccess(result);
			});
		},
		/**
		 * 获取当前视野范围内的摄像机数量(同步)
		 * @param extent - 视野范围内的坐标范围
		 */
		getCamerasNumByScope: function(extent) {
			var result = 0,
				params = {
					minLongitude: extent.sw.lon,
					minLatitude: extent.sw.lat,
					maxLongitude: extent.ne.lon,
					maxLatitude: extent.ne.lat,
					currentPage: 1,
					pageSize: 20
				};
			ScopeModel.getCameraInscope(params, {
				async: false
			}).then(function (res) {
				if (res.code === 200) {
					//返回视野范围内的摄像机个数
					result = res.data.count
				}
			});
			return result;
		}
	};

	return new mapSelectController();
});
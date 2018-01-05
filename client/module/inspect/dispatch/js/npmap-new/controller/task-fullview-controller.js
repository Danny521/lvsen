define(['js/npmap-new/view/task-fullview-view', 'pubsub', 'js/npmap-new/model/task-fullview-model'],
	function(Fullview, pubsub, Model){
	var FullViewController = function(){
		var self = this;
		//订阅 获取区域范围内的摄像机
		pubsub.subscribe("getSectorCameras", function(msg, obj){
			self.getSectorCameras(obj);
		});

		//订阅 获取区域范围内的摄像机
		pubsub.subscribe("getPositionCameras", function(msg, obj){
			self.getPositionCameras(obj);
		});
	};

	FullViewController.prototype = {

		//获取区域范围内摄像机URL
		GET_SECTOR_CAMERAS_URL: '/service/map_new/get_geometry_camera',
		/**
		 * 获取区域范围内的摄像机
		 * @author Li Dan
		 * @date   2014-12-17
		 */
		getSectorCameras: function(obj){
			Model.GetSecterCameras(obj, {}).then(function(result){
				Fullview.setSectorCameras(result, obj.centerPoint, obj.position, obj.key);
			});
		},
		/**
		 * 获取8个方位的摄像机
		 * @author songxj
		 * @param  {[type]}
		 */
		getPositionCameras: function(obj) {
			Model.getPositionCameras(obj.ajaxDataArr).then(function() {
				Fullview.setPositionCameras(arguments, obj.ajaxDataArr, obj.callback);
			}, function(err) {

			});
		}
	};

	return new FullViewController();
});

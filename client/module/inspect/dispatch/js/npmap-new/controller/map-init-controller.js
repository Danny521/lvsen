/**
 * 视频指挥初始化页面控制器
 * @type {[type]}
 */
define([
	'js/npmap-new/view/map-init-view',
	'js/npmap-new/model/map-init-model',
	'pubsub'
], function(mapToolMainView, Model, pubsub) {

		var mapToolMainController = function() {
			var self = this;
			//订阅事件 获取摄像机信息并播放
			pubsub.subscribe("getCameraInfoAndPlay", function(msg, obj) {
				self.getCameraInfoAndPlay(obj);
			});
		};

		mapToolMainController.prototype = {
			/**
			 * 初始化
			 * @type {[type]}
			 */
			init: function() {
				//加载地图
				mapToolMainView.loadMap();
				//初始化工具栏（LBS托管）
				require(['/module/inspect/dispatch/js/npmap-new/task/map-toolbar.js'], function(MapToolBar) {
					MapToolBar.init.call(MapToolBar, window.map);
					//地图初始化完成，触发视频监控的地图定位播放
					pubsub.publish("mapInitialComplete");
				});
			},
			/**
			 * 获取摄像机信息并播放
			 * @type {[type]}
			 */
			getCameraInfoAndPlay: function(data) {
				Model.GetCamerainfoByID({
					id: data.id
				}, {}).then(function(result) {
					mapToolMainView.clusterCameraOnClick(result, data.e, data.preid);
				});
			}
		};

		return new mapToolMainController();
	});
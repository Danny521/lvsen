/**
 * Created by Zhangyu on 2015/4/25.
 */
define([
	"js/npmap-new/view/task-defence-circle-view",
	"js/npmap-new/model/task-defence-circle-model"
], function (View, Model) {

	return (function (scope) {
		//初始化页面
		View.init(scope);
		/**
		 * 获取缓冲区内或者框选范围内的摄像机
		 * @param data - 缓冲区数据
		 * @param tag - 为0标示显示缓冲区的摄像机，为1标示显示框选的摄像机
		 */
		scope.getCamerasInRange = function(data, tag) {

			Model.getCamerasInRange(data, {}).then(function (res) {
				if (res.code === 200) {
					if(tag === 0) {
						//显示摄像机到缓冲区
						View.setCamerasInBuffer(res.data.cameras);
					} else {
						//显示摄像机到框选区，并渲染左侧
						View.setCamerasInGeometry(res.data.cameras);
					}
				} else if (res.code === 500) {
					notify.error(res.data.message + "！");//错误码：" + res.code);
				} else {
					notify.error("获取摄像机失败！错误码：" + res.code);
				}
			});
		};
		/**
		 * 获取防控圈组下的其他防控圈
		 * @param data - 框选地图范围数据
		 */
		scope.getOtherCirclesInGroup = function(data) {

			Model.getOtherCirclesInGroup(data, {}).then(function(res) {
				if (res.code === 200) {
					View.setOtherCirclesInGroup(res.data, data.res);
				} else {
					notify.error("获取组内其他防空圈数据失败！");//错误码：" + res.code);
				}
			});
		};

		return scope;

	}({}));

});
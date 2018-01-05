/**
 * Created by Zhangyu on 2015/4/29.
 */
define([
	"js/npmap-new/view/task-guard-route-crud-view",
	"js/npmap-new/model/task-guard-route-crud-model"
], function (View, Model) {

	return (function (scope) {
		//初始化页面
		View.init(scope);

		/**
		 * 获取范围内的摄像机
		 * @param data - 参数信息
		 * @param tag - 为0标示显示缓冲区的摄像机，为1标示显示框选的摄像机
		 */
		scope.getLeftCamerasInGeometry = function(data, tag) {

			Model.getLeftCamerasInGeometry(data, {}).then(function(res) {
				if (res.code === 200) {
					if(tag === 0) {
						//显示摄像机到缓冲区
						View.setLeftCamerasInGeometry(res.data);
					} else {
						//显示摄像机到框选区，并渲染左侧
						View.setGeometryCameras(res.data.cameras);
					}
				} else if (res.code === 500) {
					notify.error(res.data.message + "！");//错误码：" + res.code);
				} else {
					notify.error("获取摄像机异常！");//错误码：" + res.code);
				}
			}, function(){
				notify.error("网络或服务器异常！");
			});
		};

		/**
		 * 获取路线下的摄像机列表
		 * @param data - 参数信息
		 */
		scope.getCamerasInRoute = function(data) {

			Model.getCamerasInRoute({
				policeLineId: data.policeLineId
			}, {}).then(function(res) {
				if (res.code === 200) {
					if (data.clicktype === "edit-route") {
						//编辑警卫路线时
						View.showCamerasOnEditRoute(res.data, data.policeLineId);
					} else {
						//点选左侧警卫路线列表时
						View.setCamerasInRoute(res.data, data.obj, data.clicktype);
					}
				} else if (res.code === 500) {
					notify.error(res.data.message + "！");//错误码：500");
				} else {
					notify.error("获取警卫路线摄像机数据异常！");//错误码：" + res.code);
				}
			}, function(){
				notify.error("网络或服务器异常！");
			});
		};

		return scope;

	}({}));

});
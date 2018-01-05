/**
 * Created by Zhangyu on 2015/4/29.
 */
define(["ajaxModel"], function (ajaxModel) {

	return (function (scope) {

		var//标记是否使用模拟数据
			_isUseMock = false,

			//设置请求的根路径
			_serviceHost = "/service/",

			//设置请求上下文
			_serviceContext = "",

			//设置请求的url集合
			_ACTIONS_URL = {
				//获取范围内的摄像机
				Get_Left_Cameras_InGeometry: _isUseMock ? "js/npmap-new/model/lightbar.json" : _serviceHost + _serviceContext + "map_new/get_geometry_camera",
				//获取警卫路线下的摄像机列表
				Get_Cameras_In_Route: _isUseMock ? "js/npmap-new/model/lightbar.json" : _serviceHost + _serviceContext + "map_new/get_cameras_list_byPoliceLineId"
			};

		/**
		 * 获取范围内的摄像机
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getLeftCamerasInGeometry = function (data, custom) {
			return ajaxModel.postData(_ACTIONS_URL.Get_Left_Cameras_InGeometry, data, custom);
		};

		/**
		 * 获取警卫路线下的摄像机列表
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getCamerasInRoute = function (data, custom) {
			return ajaxModel.postData(_ACTIONS_URL.Get_Cameras_In_Route, data, custom);
		};

		return scope;

	}({}));
});
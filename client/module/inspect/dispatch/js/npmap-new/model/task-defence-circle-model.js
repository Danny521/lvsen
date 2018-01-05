/**
 * Created by Zhangyu on 2015/4/25.
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
				//获取缓冲区内的摄像机
				Get_Cameras_In_Range: _isUseMock ? "js/npmap-new/model/lightbar.json" : _serviceHost + _serviceContext + "map_new/get_geometry_camera",
				//获取缓冲区内的摄像机Get_Cameras_In_Geometry
				Get_Cameras_In_Geometry: _isUseMock ? "js/npmap-new/model/lightbar.json" : _serviceHost + _serviceContext + "map_new/get_geometry_camera",
				//获取防控圈组下的防控圈
				Get_Other_Circles_In_Group: _isUseMock ? "js/npmap-new/model/lightbar.json" : _serviceHost + _serviceContext + "map/defenseCircleGroup/"
			};

		/**
		 * 获取缓冲区内或者框选范围内的摄像机
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getCamerasInRange = function (data, custom) {
			return ajaxModel.postData(_ACTIONS_URL.Get_Cameras_In_Range, data, custom);
		};
		/**
		 * 获取防控圈组下的防控圈
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getOtherCirclesInGroup = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Get_Other_Circles_In_Group+ data.id + "/defenseCircles", {}, custom);
		};

		return scope;

	}({}));
});
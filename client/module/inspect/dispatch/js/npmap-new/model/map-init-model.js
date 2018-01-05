/**
 * Created by Zhangyu on 2015/4/16.
 */
define(["ajaxModel"], function(ajaxModel) {

	return (function (scope) {

		var//标记是否使用模拟数据
			_isUseMock = false,

			//设置请求的根路径
			_serviceHost = "/service/",

			//设置请求上下文
			_serviceContext = "",

			//设置请求的url集合
			_ACTIONS_URL = {
				//获取摄像机点位URL
				Get_All_Camera: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "map_new/map_all_camera",
				//根据ID获取摄像机详细信息
				Get_Camerainfo_By_ID: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "video_access_copy/accessChannels"
			};

		/**
		 * 获取摄像机点位URL
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.GetAllCamera = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Get_All_Camera, data, custom);
		};

		/**
		 * 根据ID获取摄像机详细信息
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.GetCamerainfoByID = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Get_Camerainfo_By_ID, data, custom);
		};

		//获取模板
		scope.getTemplate = function(url) {
			return ajaxModel.getTml(url);
		};

		return scope;

	}({}));
});
/**
 * Created by Zhangyu on 2015/4/17.
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
				//几何图形内摄像机搜索
				Cameras_In_Geometry: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "map_new/page_geometry_camera"
			};

		/**
		 * 几何图形内摄像机搜索
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.CamerasInGeometry = function (data, custom) {
			return ajaxModel.postData(_ACTIONS_URL.Cameras_In_Geometry, data, custom);
		};

		return scope;

	}({}));
});
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
				//获取区域范围内摄像机
				Get_Secter_Cameras: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "map_new/get_geometry_camera"
			};

		/**
		 * 获取区域范围内摄像机
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.GetSecterCameras = function (data, custom) {
			return ajaxModel.postData(_ACTIONS_URL.Get_Secter_Cameras, data, custom);
		};
		/**
		 * 获取8个方位的摄像机
		 * @author songxj
		 * @param  {[type]}
		 * @return {[type]}
		 */
		scope.getPositionCameras = function(ajaxDataArr) {
			var ajaxArr = [];
			ajaxDataArr.forEach(function(item) {
				ajaxArr.push(ajaxModel.postData(_ACTIONS_URL.Get_Secter_Cameras, item))
			});

			return jQuery.when.apply(null, ajaxArr); //用when可以确保8个请求一并处理完，再用返回的结果做其他事情
		};

		return scope;

	}({}));
});

/**
 * Created by Zhangyu on 2015/1/6.
 * 在显示信息窗时，获取资源的详细信息
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
				//重新获取地图上已存在的移动数据点位信息
				Get_Gps_Detail: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "map_new/"
			};

		/**
		 * 重新获取地图上已存在的移动数据点位信息
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getGpsDetail = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Get_Gps_Detail + data.id + "/getGpsDetailInfo", data, custom);
		};

		return scope;

	}({}));
});
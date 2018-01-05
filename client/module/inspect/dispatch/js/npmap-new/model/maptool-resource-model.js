/**
 * Created by Zhangyu on 2015/4/18.
 */
define(["ajaxModel", "jquery"], function(ajaxModel, jQuery) {

	return (function (scope, $) {

		var//标记是否使用模拟数据
			_isUseMock = false,

			//设置请求的根路径
			_serviceHost = "/service/",

			//设置请求上下文
			_serviceContext = "",

			//设置请求的url集合
			_ACTIONS_URL = {
				//从数据库中获取灯杆数据
				Get_Lamppost_Data: _isUseMock ? "js/npmap-new/model/lightbar.json" : _serviceHost + _serviceContext + "map_new/lamppost",
				//从服务中获取gps数据
				Get_Gps_Data: _isUseMock ? "js/npmap-new/model/gps.json" : _serviceHost + _serviceContext + "map_new/gps",  //默认type=1
				//从服务中获取350M数据
				Get_350M_Data: _isUseMock ? "js/npmap-new/model/get_350_data.json" : _serviceHost + _serviceContext + "map_new/gps?type=2"
			};

		/**
		 * 从数据库中获取灯杆数据
		 * @param data - 参数信息
		 * @param custom - 额外的ajax配置信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getLamppostData = function (data, custom) {
			return ajaxModel.getDataByAjaxObj(_ACTIONS_URL.Get_Lamppost_Data, data, custom);
		};

		/**
		 * 从服务中获取gps数据
		 * @param data - 参数信息
		 * @param custom - 额外的ajax配置信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getGpsData = function (data, custom) {
			return ajaxModel.getDataByAjaxObj(_ACTIONS_URL.Get_Gps_Data, data, custom);
		};

		/**
		 * 从服务中获取gps数据
		 * @param data - 参数信息
		 * @param custom - 额外的ajax配置信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.get350MData = function (data, custom) {
			return ajaxModel.getDataByAjaxObj(_ACTIONS_URL.Get_350M_Data, data, custom);
		};

		return scope;

	}({}, jQuery));
});
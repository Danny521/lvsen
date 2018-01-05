/**
 * Created by Zhangyu on 2015/6/24.
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
				//根据gps IDs串获取gps集合的实时信息
				Get_Gps_Info_By_Ids: _isUseMock ? "js/npmap-new/model/lightbar.json" : _serviceHost + _serviceContext + "map_new/multi/gps"
			};

		/**
		 * 判断电子防线的名字是否重名
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.getGpsInfoByIds = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Get_Gps_Info_By_Ids, data, custom);
		};

		return scope;

	}({}));
});
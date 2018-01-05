/**
 * Created by Zhangyu on 2015/4/27.
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
				//获取我的关注列表
				Get_Myattention_List: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "map/page_attention_point"
			};

		/**
		 * 获取我的关注列表
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.GetMyattentionList = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Get_Myattention_List, data, custom);
		};

		return scope;

	}({}));
});
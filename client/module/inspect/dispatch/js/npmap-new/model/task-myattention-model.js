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
				//添加到我的关注
				Add_To_Myattention: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "map/add_attention_point",
				//取消我的关注
				Cancel_From_Myattention: _isUseMock ? "../inc/defence_events_list.json" : _serviceHost + _serviceContext + "map/delete_attention_point"
			};

		/**
		 * 添加到我的关注
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.AddToMyattention = function (data, custom) {
			return ajaxModel.postData(_ACTIONS_URL.Add_To_Myattention, data, custom);
		};

		/**
		 * 取消我的关注
		 * @param data - 参数信息
		 * @param custom - 额外参数信息
		 * @returns {*} - ajax对象，deffered
		 */
		scope.CancelFromMyattention = function (data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.Cancel_From_Myattention, data, custom);
		};

		return scope;

	}({}));
});
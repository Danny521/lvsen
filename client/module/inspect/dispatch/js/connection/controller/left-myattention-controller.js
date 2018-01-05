/**
 * Created by Zhangyu on 2015/4/27.
 */
define([
	"js/connection/view/left-myattention-view",
	"js/connection/model/left-myattention-model",
	"js/npmap-new/controller/task-myattention-controller",
	"jquery"
], function (View, Model, MapAttentionController, jQuery) {

	return (function (scope, $) {
		//初始化页面
		View.init(scope);
		/**
		 * 相应左侧收藏夹中我的关注tab点击事件
		 */
		scope.dealOnLoadMyAttention = function(params) {
			//兼容分页
			var data = $.extend({
				current_page: 1,
				page_size: 10
			}, params);
			//请求
			Model.GetMyattentionList(data, {}).then(function (res) {
				if (res.code === 200) {
					View.showMyAttentionList(res.data, params);
				} else {
					notify.error("读取我的关注信息列表失败！");//错误码：" + res.code);
				}
			});
		};

		return scope;

	}({}, jQuery));

});
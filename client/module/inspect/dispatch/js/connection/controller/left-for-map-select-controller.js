/**
 * Created by Zhangyu on 2015/5/5.
 */
define([
	"js/connection/view/left-for-map-select-view",
	"js/connection/model/left-for-map-select-model",
	"js/npmap-new/view/maptool-select-view"
], function (View, Model, mapSelectView) {

	return (function (scope) {

		View.init(scope, mapSelectView);
		/**
		 * 检验新建分组重名
		 * @param name
		 */
		scope.isGroupNameExist = function(name) {

			var result = false;

			Model.isGroupNameExist({
				groupName: name
			}, {
				async: false
			}).then(function (res) {
				if (res.code === 200) {
					if(!res.data.flag) {
						result = true;
					}
				} else {
					notify.error("获取我的分组信息失败！");//错误码：" + res.code);
				}
			}, function () {
				notify.error("网络或服务器异常！");
			});

			return result;
		};
		/**
		 * 添加新建分组
		 * @param data
		 */
		scope.saveGroup = function(data){
			Model.addCameraGroup(data, {}).then(function(res) {
				if(res.code === 200){
					//提示
					notify.success("分组创建成功！");
					//记录日志
					logDict.insertLog("m1", "f1", "o1", "b1", data.name);
					//刷新页面
					View.refreshOnSaveGroup();
				} else {
					notify.error("分组创建失败！");//错误码：" + res.code);
				}
			}, function () {
				notify.error("网络或服务器异常！");
			});
		};

		return scope;

	}({}));

});
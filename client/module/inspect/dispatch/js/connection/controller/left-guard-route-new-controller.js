/**
 * Created by Zhangyu on 2015/4/28.
 */
define([
	"js/connection/view/left-guard-route-new-view",
	"js/connection/model/left-guard-route-new-model",
	"js/npmap-new/view/task-guard-route-crud-view",
	"jquery",
	"js/npmap-new/controller/task-guard-route-crud-controller"
], function (View, Model, MapRouteView, jQuery) {

	return (function (scope, $) {
		//初始化页面
		View.init(scope, MapRouteView);
		/**
		 * 检验警卫路线的名字是否已经存在
		 * @param data - 参数信息
		 * @returns {boolean}
		 */
		scope.checkRouteNameExists = function(data) {
			var result = false;
			//验证
			Model.checkRouteNameExists(data, {
				async: false
			}).then(function (res) {
				if(res.code === 200) {
					//如果不存在，则保存，否则提示并放弃
					if (res.data.message) {
						result = true;
					}
				} else {
					notify.error("读取警卫路线信息失败！");//错误码：" + res.code);
				}
			}, function () {
				notify.error("网络或服务器异常！");
			});

			return result;
		};
		/**
		 * 新建警卫路线
		 * @param data - 参数信息
		 */
		scope.saveNewGuardroute = function(data) {
			Model.saveNewGuardroute(data, {}).then(function(res) {
				if (res.code === 200) {
					//提示
					notify.success("新建警卫路线成功！");
					//日志
					logDict.insertLog("m1", "f2", "o1", "b13", data.name);
					//刷新页面
					View.refreshOnSave();
				} else if (res.code === 500) {
					notify.error(res.data.message + "！");//错误码：500");
				} else {
					notify.error("新建警卫路线失败！");//错误码：" + res.code);
				}
			}, function () {
				notify.error("网络或服务器异常！");
			});
		};
		/**
		 * 编辑警卫路线
		 * @param data - 参数信息
		 */
		scope.saveEditGuardroute = function(data) {
			Model.saveEditGuardroute(data, {}).then(function(res) {
				if (res.code === 200) {
					//提示
					notify.success("编辑警卫路线成功！");
					//日志
					logDict.insertLog("m1", "f2", "o2", "b13", data.name);
					//刷新页面
					View.refreshOnSave();
				} else if(res.code === 500){
					notify.error(res.data.message+"！");//错误码：500");
				} else {
					notify.error("编辑警卫路线失败！");//错误码：" + res.code);
				}
			}, function () {
				notify.error("网络或服务器异常！");
			});
		};
		/**
		 * 获取摄像机组织内的摄像机列表
		 * @param data - 参数信息
		 * @returns {boolean}
		 */
		scope.getTreeCameraByOrgIds = function(data) {
			var result = null;
			//验证
			Model.getTreeCameraByOrgIds(data, {
				async: false
			}).then(function (res) {
				if(res.code === 200) {
					result = res.data.cameras;
				} else {
					notify.error("获取摄像机列表失败！");//错误码：" + res.code);
				}
			}, function () {
				notify.error("网络或服务器异常！");
			});

			return result;
		};

		return scope;

	}({}, jQuery));

});
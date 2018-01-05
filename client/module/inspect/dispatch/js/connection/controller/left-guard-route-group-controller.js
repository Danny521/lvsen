/**
 * Created by Zhangyu on 2015/4/28.
 */
define([
	"js/connection/view/left-guard-route-group-view",
	"js/connection/model/left-guard-route-group-model",
	"js/npmap-new/view/task-guard-route-crud-view",
	"jquery",
	"js/connection/controller/left-guard-route-new-controller",
	"js/npmap-new/controller/task-guard-route-crud-controller"
], function (View, Model, MapRouteView, jQuery) {

	return (function (scope, $) {
		//初始化页面
		View.init(scope, MapRouteView);

		/**
		 * 响应左侧逻辑按钮点击事件，显示已有的警卫路线分组列表
		 */
		scope.dealOnGuardRouteGroup = function () {

			Model.getGroupList({}).then(function (res) {
				if (res.code === 200) {
					//成功,填充分组
					View.refreshOnGetGroupList(res.data);
				} else if (res.code === 500) {
					notify.error(res.data.message + "！");//错误码：500");
				} else {
					notify.error("获取分组列表异常！");//错误码：" + res.code);
				}
			}, function () {
				notify.error("网络或服务器异常！");
			});
		};

		/**
		 * 获取分组下的警卫路线
		 * @param groupId - 分组id
		 */
		scope.getRoutesInGroup = function (groupId) {

			Model.getRoutesInGroup({
				groupId: groupId
			}, {}).then(function (res) {
				if (res.code === 200) {
					View.setGuardroutesInGroup(res.data, groupId);
				} else if (res.code === 500) {
					notify.error(res.data.message + "！");//错误码：500");
				} else {
					notify.error("获取分组下警卫路线列表失败！");//错误码：" + res.code);
				}
			}, function () {
				notify.error("网络或服务器异常！");
			});
		};

		/**
		 * 执行删除警卫路线分组
		 * @param groupid - 分组id
		 * @param name - 分组名字
		 */
		scope.dealDelGroup = function (groupid, name) {

			//调用服务，删除分组
			Model.dealDelGroup({
				id: groupid,
				_method: "delete"
			}).then(function (res) {
				if (res.code === 200) {
					//更新删除成功
					notify.success(res.data.message);
					//添加日志--删除XX警卫路线分组
					logDict.insertLog("m1", "f2", "o3", "b14", name);
					//删除成功后，避免重复刷新，提高人性化，直接删除dom节点
					View.refreshOnDelGroup(groupid);

				} else if (res.code === 500) {
					notify.error(res.data.message + "！");//错误码：" + res.code);
				} else {
					notify.error("删除分组失败！");//错误码：" + res.code);
				}
			}, function () {
				notify.error("网络或服务器异常！");
			});
		};

		/**
		 * 保存分组前判断分组名字是否存在
		 * @param groupId - 分组id
		 * @param groupName - 分组名字
		 */
		scope.checkGroupNameExists = function (groupId, groupName) {

			var result = false,
				data = (groupId === -1) ? { name: groupName } : { id: groupId, name: groupName };

			Model.checkGroupNameExists(data, {
				async: false
			}).then(function (res) {
				if (res.code === 200) {
					//如果不存在，则保存，否则提示并放弃
					if (res.data.success === "true") {
						result = true;
					} else {
						notify.warn("分组名已存在！");
					}
				} else if (res.code === 500) {
					notify.error(res.data.message + "！");//错误码：" + res.code);
				} else {
					notify.error("分组名判断异常！");//错误码：" + res.code);
				}
			}, function () {
				notify.error("网络或服务器异常！");
			});
			return result;
		};

		/**
		 * 更新&保存分组信息
		 * @param groupname - 分组名字
		 * @param groupid - 分组id
		 */
		scope.dealSaveGroup = function (groupname, groupid) {

			//调用服务，更新分组信息
			Model.dealSaveGroup({
				policeLineGroupId: groupid,
				name: groupname
			}).then(function (res) {
				if (res.code === 200) {
					//更新分组成功
					if (groupid === -1) {
						//提示
						notify.success("分组添加" + res.data.message);
						//添加日志--新增XX警卫路线分组
						logDict.insertLog("m1", "f2", "o1", "b14", groupname);
						//刷新页面
						View.refreshOnSaveGroup(res.data.groupId, groupname, 0);
					} else {
						notify.success("分组编辑" + res.data.message);
						//添加日志--编辑XX警卫路线分组
						logDict.insertLog("m1", "f2", "o2", "b14", groupname);
						//刷新页面
						View.refreshOnSaveGroup(groupid, groupname, 1);
					}
				} else if (res.code === 500) {
					notify.error(res.data.message + "！");//错误码：" + res.code);
				} else {
					notify.error("保存分组异常！");//错误码：" + res.code);
				}
			}, function () {
				notify.error("网络或服务器异常！");
			});
		};

		/**
		 * 搜索警卫路线
		 * @param data - 参数信息
		 */
		scope.searchGuardRoutes = function (data) {
			Model.searchGuardRoutes(data, {}).then(function (res) {
				if (res.code === 200) {
					//添加日志--搜索XX警卫路线
					logDict.insertLog("m1", "f2", "o13", "b13", data.name);
					//显示搜索结果
					View.showSearchRoutes(res.data, data.name);
				} else if (res.code === 500) {
					notify.error(res.data.message+"！");//错误码：" + res.code);
				} else {
					notify.error("查询警卫路线失败！");//错误码：" + res.code)
				}
			}, function () {
				notify.error("网络或服务器异常！");
			});
		};

		/**
		 * 删除警卫路线
		 * @param routeId - 警卫路线id
		 * @param routeName - 警卫路线名字
		 */
		scope.delGuardRoute = function(routeId, routeName) {

			Model.delGuardRoute({
				id: routeId
			}, {}).then(function (res) {
				if (res.code === 200) {
					//提示
					notify.success("删除警卫路线成功！");
					//添加日志--删除XX警卫路线
					logDict.insertLog("m1", "f2", "o3", "b13", routeName);
					//刷新页面
					View.delGuardRouteSuccess(routeId);
				} else if (res.code === 500) {
					notify.error(res.data.message + "！");//错误码：" + res.code);
				} else {
					notify.error("删除警卫路线失败！");//错误码：" + res.code)
				}
			}, function () {
				notify.error("网络或服务器异常！");
			});
		};

		/**
		 * 设置警卫路线播放时间间隔
		 * @param data - 参数信息
		 * @param name - 警卫路线的名字，写日志使用
		 */
		scope.saveGuardrouteConfig = function(data, name) {

			Model.saveGuardrouteConfig(data, {}).then(function (res) {
				if(res.code === 200) {
					//提示
					notify.success("设置成功！");
					//添加日志--配置XX警卫路线
					logDict.insertLog("m1", "f2", "o11", "b13", name);
					//刷新页面
					View.refreshOnSaveConfig(data.Id);

				} else if (res.code === 500) {
					notify.error(res.data.message + "！");//错误码：" + res.code);
				} else {
					notify.error("保存警卫路线设置失败！");//错误码：" + res.code)
				}
			}, function () {
				notify.error("网络或服务器异常！");
			});
		};

		/**
		 * 获取路线下的摄像机列表
		 * @param data - 参数信息
		 */
		scope.getCamerasInRoute = function(data) {

			Model.getCamerasInRoute({
				policeLineId: data.routeData.id
			}, {}).then(function(res) {
				if (res.code === 200) {
					//点选左侧警卫路线列表时
					View.setCamerasInRoute(res.data, data.clicktype, data.routeData);
				} else if (res.code === 500) {
					notify.error(res.data.message + "！");//错误码：500");
				} else {
					notify.error("获取警卫路线摄像机数据异常！");//错误码：" + res.code);
				}
			}, function(){
				notify.error("网络或服务器异常！");
			});
		};

		/**
		 * 获取路线下的摄像机列表-同步
		 * @param routeId - 警卫路线id
		 */
		scope.getCamerasInRouteAsync = function(routeId) {

			var result = [];

			Model.getCamerasInRoute({
				policeLineId: routeId
			}, {
				async: false
			}).then(function(res) {
				if (res.code === 200) {
					//点选左侧警卫路线列表时
					result = res.data.cameras;
				} else if (res.code === 500) {
					notify.error(res.data.message + "！");//错误码：500");
				} else {
					notify.error("获取警卫路线摄像机数据异常！");//错误码：" + res.code);
				}
			}, function(){
				notify.error("网络或服务器异常！");
			});

			return result;
		};
		/**
		 * 根据gpsId获取gps的即时位置信息
		 * @param gpsId - gps标示
		 */
		scope.getGpsPositionById = function(gpsId) {
			var result = {};

			Model.getGpsPositionById({
				id: gpsId
			}, {
				async: false,
				cache: false
			}).then(function(res) {
				if (res.code === 200) {
					//返回获取到的gps点位信息
					if (res.data.gpsInfo) {
						result = res.data.gpsInfo;
					} else {
						notify.warn("当前GPS无信号！");
					}
				} else if (res.code === 500) {
					notify.error(res.data.message + "！");//错误码：500");
				} else {
					notify.error("获取gps信号异常！");//错误码：" + res.code);
				}
			}, function(){
				notify.error("网络或服务器异常！");
			});

			return result;
		};

		return scope;

	}({}, jQuery));

});
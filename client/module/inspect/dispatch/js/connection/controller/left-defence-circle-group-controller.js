/**
 * Created by Zhangyu on 2015/4/24.
 */
define([
	"js/connection/view/left-defence-circle-group-view",
	"js/connection/model/left-defence-circle-model",
	"js/npmap-new/view/task-defence-circle-view",
	"js/connection/view/left-defence-circle-new-view",
	"js/npmap-new/map-common-overlayer-ctrl",
	"jquery",
	"js/connection/controller/left-defence-circle-new-controller"
], function (View, Model, MapCircleView, newCircleView, MapOverLayerCtrl, jQuery) {

	return (function (scope, $) {
		//初始化页面
		View.init(scope, MapCircleView);

		/**
		 * 响应左侧逻辑按钮点击事件，显示已有的防空圈列表
		 * @param params - 分页时有效
		 */
		scope.dealOnDefenceCircle = function (params) {
			//参数
			var data = $.extend({
				currentPage: 1,
				pageSize: 10
			}, params);
			//请求防空圈列表
			Model.getDefenceCircleGroups(data, {}).then(function (res) {
				if (res.code === 200) {
					View.setDefenceCircleGroups(res.data);
				} else {
					notify.error("获取防空圈分组列表失败！");//错误码:" + res.code);
				}
			})
		};
		/**
		 * 根据组id获取改组下的防空圈列表
		 * @param id - 组id
		 */
		scope.getCirclesByGroupID = function (id) {

			Model.getCirclesByGroupID({
				id: id
			}, {}).then(function (res) {
				if (res.code === 200) {
					View.showCirclesInGroup(res.data, id);
				} else {
					notify.error("获取防空圈列表失败！");//错误码:" + res.code);
				}
			});
		};
		/**
		 * 根据分组id删除分组
		 * @param id - 分组id
		 */
		scope.delDefenceCircleGroup = function (id) {
			//配置参数
			var data = {
				id: id,
				_method: "delete"
			};
			//删除
			Model.delDefenceCircleGroup(data, {}).then(function (res) {
				if (res.code === 200) {
					//提示用户
					notify.success("删除防控圈组成功!");
					//刷新页面
					View.refreshOnDelGroup(id);
				} else {
					notify.error("删除防空圈分组失败！");//错误码:" + res.code);
				}
			});
		};
		/**
		 * 验证分组名称是否重名
		 * @param data - 待验证的数据
		 */
		scope.checkCircleGroupName = function (data) {
			//验证
			Model.checkCircleGroupNameExists(data, {}).then(function (res) {
				if (res.code === 200) {
					if (res.data.message) {
						scope.saveOrEditDefenceCircleGroup(data);
					} else {
						notify.warn("分组名称已经存在!");
					}
				} else {
					notify.error("网络或服务器失败！");//错误码:" + res.code);
				}
			});
		};
		/**
		 * 保存/编辑分组
		 * @param data - 待写入的数据
		 */
		scope.saveOrEditDefenceCircleGroup = function (data) {

			Model.saveOrEditCircleGroup(data, {}).then(function (res) {
				if (res.code === 200) {
					//提示用户
					if (data.id) {
						notify.success("分组编辑成功！");
					} else {
						notify.success("分组创建成功！");
					}
					//刷新页面
					View.refreshOnSaveOrEditGroup(data);
				} else {
					notify.error("分组" + (data.id) ? "编辑" : "创建" + "失败！");//错误码:" + res.code);
				}
			});
		};
		/**
		 * 删除防空圈
		 * @param data - 参数信息
		 */
		scope.delDefenceCircleById = function (data) {
			Model.delDefenceCircleById(data, {}).then(function (res) {
				if (res.code === 200) {
					//提示
					notify.success("删除防控圈成功！");
					//刷新页面
					View.refreshOnDelCircle(data.id);
				} else {
					notify.error("删除防控圈失败！");//错误码:" + res.code);
				}
			});
		};
		/**
		 * 获取防空圈信息
		 * @param data - 参数信息
		 */
		scope.getCircleInfo = function (data) {

			Model.getCircleInfo(data, {}).then(function (res) {
				if (res.code === 200) {
					//编辑防空圈时，隐藏资源图层，显示防空圈相关的图层
					MapOverLayerCtrl.showAndHideOverLayers("on-show-defence-circle-info", "edit-circle");
					//渲染页面
					newCircleView.setCircleInfo(res.data.defenseCircle, data.groupId, scope);
				} else {
					notify.error("获取防控圈信息失败！");//错误码:" + res.code);
				}
			}, function () {
				notify.error("获取防控圈信息失败, 服务器或网络异常！");
			});
		};
		/**
		 * 获取防控圈组下防控圈个数
		 * @param data - 参数信息
		 * @returns {number} - 当前组下防空圈的个数
		 */
		scope.getDefenceCircleNumsInGroup = function (data) {
			var result = 0;
			//同步查询
			Model.getDefenceCircleNumsInGroup(data, {
				async: false
			}).then(function (res) {
				if (res.code === 200) {
					result = res.data.count;
				} else {
					notify.error("获取防控圈信息失败！");//错误码:" + res.code);
				}
			});
			//同步返回
			return result;
		};
		/**
		 * 获取防空圈信息
		 * @param id - 防控圈id
		 * @param isHighlight - 是否高亮显示
		 * @param isSearch - 是否是来自搜索
		 */
		scope.getCircleCameras = function (id, isHighlight, isSearch) {

			Model.getCircleInfo({
				id: id
			}, {}).then(function (res) {
				if (res.code === 200) {
					//渲染页面
					View.setCircleCameras(res.data, id, isHighlight, isSearch);
				} else {
					notify.error("获取防控圈信息失败！");//错误码:" + res.code);
				}
			}, function () {
				notify.error("获取防控圈信息失败, 服务器或网络异常！");
			});
		};

		/**
		 * 搜索防空圈
		 * @author Li Dan
		 * @date   2014-12-22
		 */
		scope.searchDefenceCircles = function (name) {
			Model.getSearchDefenceCircles({
				name: name
			}, {}).then(function (res) {
				if (res.code === 200) {
					View.setSearchedDefenceCircles(res.data);
				} else {
					notify.error("搜索防控圈失败！");//错误码:" + res.code);
				}
			});
		};

		return scope;

	}({}, jQuery));

});
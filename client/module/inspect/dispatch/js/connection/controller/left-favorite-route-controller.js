/**
 * Created by Zhangyu on 2015/4/27.
 */
define([
	"js/connection/view/left-favorite-route-view",
	"js/connection/model/left-favorite-route-model"
], function(View, Model) {

	return (function(scope) {
		//初始化页面
		View.init(scope);
		/**
		 * 相应左侧收藏夹中我的关注tab点击事件
		 */
		scope.dealOnLoadMyFavoriteRoute = function() {
			var data = {
				currentPage: 1,
				pageSize: 20
			};
			Model.GetFavoriteRoutesList(data, {}).then(function(res) {
				if (res.code === 200) {
					View.showMyFavoriteRouteList(res.data);
					//日志

				} else if (res.code === 500) {
					notify.error(res.data.message + "!");
				} else {
					notify.error("收藏失败，网络或服务器异常！");
				}
			});
		};
		/**
		 * 添加路径到我的收藏
		 * @author Li Dan
		 * @date   2015-08-04
		 * @return {[type]}   [description]
		 */
		scope.saveMyFavoriteRoute = function(data, LI) {
			Model.SaveMyFavoriteRoute(data, {}).then(function(res) {
				if (res.code === 200) {
					notify.success("收藏成功！");
					View.dealFavoriteRoute(LI, res.data.id);
					//日志

				} else if (res.code === 500) {
					notify.error(res.data.message + "!");
				} else {
					notify.error("收藏失败，网络或服务器异常！");
				}
			});
		};
		/**
		 * 删除我收藏的路径
		 * @author Li Dan
		 * @date   2015-08-04
		 * @param  {[type]}   data [description]
		 * @return {[type]}        [description]
		 */
		scope.deleteMyFavoriteRoute = function(data) {
			Model.DeleteMyFavoriteRoute(data, {}).then(function(res) {
				if (res.code === 200) {
					notify.success("取消收藏成功！");
					scope.dealOnLoadMyFavoriteRoute();
					//日志

				} else if (res.code === 500) {
					notify.error(res.data.message + "!");
				} else {
					notify.error("取消收藏失败，网络或服务器异常！");
				}
			});
		};
		/**
		 * 删除我收藏的路径不刷新列表
		 * @author Li Dan
		 * @date   2015-08-04
		 * @param  {[type]}   data [description]
		 * @return {[type]}        [description]
		 */
		scope.deleteMyFavoriteRouteWithoutRefresh = function(data) {
			Model.DeleteMyFavoriteRoute(data, {}).then(function(res) {
				if (res.code === 200) {
					notify.success("取消收藏成功！");
					//日志

				} else if (res.code === 500) {
					notify.error(res.data.message + "!");
				} else {
					notify.error("取消收藏失败，网络或服务器异常！");
				}
			});
		};
		/**
		 * 查看收藏的路线
		 * @author Li Dan
		 * @date   2015-08-05
		 * @param  {[type]}   data [description]
		 * @return {[type]}        [description]
		 */
		scope.checkFavoriteRoute = function(data) {
			Model.CheckFavoriteRoute(data, {}).then(function(res) {
				if (res.code === 200) {
					//跳转到查看页面
					View.showFavoriteRoute(res.data);
					//日志

				} else if (res.code === 500) {
					notify.error(res.data.message + "!");
				} else {
					notify.error("取消收藏失败，网络或服务器异常！");
				}
			});
		};
		return scope;

	}({}));

});
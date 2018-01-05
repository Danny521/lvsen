/**
 * Created by Zhangyu on 2015/4/27.
 */
define(["ajaxModel"], function(ajaxModel) {

	return (function(scope) {

		var //标记是否使用模拟数据
			_isUseMock = false,

			//设置请求的根路径
			_serviceHost = "/service/",

			//设置请求上下文
			_serviceContext = "",

			//设置请求的url集合
			_ACTIONS_URL = {
				//分页获取收藏路线
				GET_FAVORITE_ROUTES: _serviceHost + _serviceContext + "map_new/favoriteRoutes",
				//保存路径
				SAVE_FAVORITE_ROUTES: _serviceHost + _serviceContext + "map_new/favoriteRoute",
				//取消保存
				CANCEL_FAVORITE_ROUTES: _serviceHost + _serviceContext + "map_new/favoriteRoute",
				//获取收藏的路线
				CHECK_FAVORITE_ROUTE: _serviceHost + _serviceContext + "map_new/favoriteRoute"
			};
		/**
		 * 获取收藏的路线
		 * @author Li Dan
		 * @date   2015-08-11
		 * @param  {[type]}   data   [description]
		 * @param  {[type]}   custom [description]
		 */
		scope.GetFavoriteRoutesList = function(data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.GET_FAVORITE_ROUTES, data, custom);
		};
		/**
		 * 保存路线
		 * @author Li Dan
		 * @date   2015-08-04
		 * @param  {[type]}   data   [description]
		 * @param  {[type]}   custom [description]
		 */
		scope.SaveMyFavoriteRoute = function(data, custom) {
			return ajaxModel.postData(_ACTIONS_URL.SAVE_FAVORITE_ROUTES, data, custom);
		};
		/**
		 * 删除收藏的路线
		 * @author Li Dan
		 * @date   2015-08-04
		 * @param  {[type]}   data   [description]
		 * @param  {[type]}   custom [description]
		 * @return {[type]}          [description]
		 */
		scope.DeleteMyFavoriteRoute = function(data, custom) {
			return ajaxModel.postData(_ACTIONS_URL.CANCEL_FAVORITE_ROUTES, data, custom);
		};
		/**
		 * 查看我收藏的路线
		 * @author Li Dan
		 * @date   2015-08-05
		 * @param  {[type]}   data   [description]
		 * @param  {[type]}   custom [description]
		 */
		scope.CheckFavoriteRoute = function(data, custom) {
			return ajaxModel.getData(_ACTIONS_URL.CHECK_FAVORITE_ROUTE, data, custom);
		};
		return scope;

	}({}));
});
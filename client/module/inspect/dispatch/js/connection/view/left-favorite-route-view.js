/**
 * Created by Zhangyu on 2015/4/27.
 */
define([
	"js/npmap-new/map-common",
	"jquery"
], function(MapCommon, jQuery) {

	return (function(scope, $) {
		var //控制器对象
			_controller = null,
			//保存模板对象
			_compiler = null,
			//模板对象
			_templateUrl = "inc/connection/left-favorite.html";
		//事件定义
		var
			_eventHandler = {
				//删除收藏的路线
				DeleteFavoriteRoute: function(e) {
					_DeleteFavoriteRoute.call(this);
					e.stopPropagation();
				},
				//查看收藏的路线
				CheckFavoriteRoute: function(e) {
					_CheckFavoriteRoute.call(this);
					e.stopPropagation();
				}
			};

		//事件实现
		var
		//删除收藏的路线
			_DeleteFavoriteRoute = function() {
				var el = $(this),
					id = el.data("id");
				//保存路径
				_controller.deleteMyFavoriteRoute({
					id: id,
					_method: "delete"
				});
			},
			//查看收藏的路线
			_CheckFavoriteRoute = function() {
				var el = $(this),
					id = el.data("id");
				_controller.checkFavoriteRoute({
					id: id
				});
			};
		//事件绑定
		var _bindEvents = function() {
			$(".favorite-body").find("[data-handler]").map(function() {
				$(this).off($(this).data("event")).on($(this).data("event"), _eventHandler[$(this).data("handler")]);
			});
		};
		//助手
		var _registerHelper = function() {
			//高亮显示当前选择的路径方式
			Handlebars.registerHelper("TrafficModel", function(trafficModel) {
				if (trafficModel === "car") {
					return "驾车";
				} else if (trafficModel === "walk") {
					return "步行";
				}
				return "未知";
			});

		};
		//初始化页面
		scope.init = function(conctroller) {
			//保存控制器对象
			_controller = conctroller;
			//初始化信息窗模板
			MapCommon.loadTemplate(_templateUrl, function(compiler) {
				//保存模板对象
				_compiler = compiler;
				//注册助手
				_registerHelper();
			}, function() {
				notify("数据模板初始化失败！");
			});
		};
		/**
		 * 显示收藏的路线列表
		 * @author Li Dan
		 * @date   2015-08-04
		 * @return {[type]}   [description]
		 */
		scope.showMyFavoriteRouteList = function(data) {
			$(".favorite .favorite-body").empty().html($.trim(_compiler({
				favoriteRoutes: data
			})));
			//绑定事件
			_bindEvents();
		};
		/**
		 * 显示收藏的路线
		 * @author Li Dan
		 * @date   2015-08-12
		 * @param  {[type]}   data [description]
		 * @return {[type]}        [description]
		 */
		scope.showFavoriteRoute = function(data) {
			require(["js/npmap-new/view/task-path-planning-view"], function(PathPlanningView) {
				data.favoriteRoute.route = JSON.parse(data.favoriteRoute.route);
				PathPlanningView.showFavoriteRoute(data);
			});
		};
		/**
		 * 收藏路径后添加id属性
		 * @author Li Dan
		 * @date   2015-08-17
		 * @return {[type]}   [description]
		 */
		scope.dealFavoriteRoute = function(LI, id) {
			LI.find("i").addClass('active');
			LI.data("id", id);
		};
		return scope;

	}({}, jQuery));

});
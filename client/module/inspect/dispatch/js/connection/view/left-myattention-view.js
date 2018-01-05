/**
 * Created by Zhangyu on 2015/4/27.
 */
define([
	"js/npmap-new/map-common",
	"js/npmap-new/view/task-myattention-view",
	"jquery"
], function (MapCommon, MapAttentionView, jQuery) {

	return (function (scope, $) {
		var //模板对象
			_compiler = null,
			//控制器对象
			_controller = null,
			//我的关注，是否是第一次加载
			_isFirstLoad = true,
			//模板对象
			_templateUrl = "inc/connection/left-favorite.html",
			//事件处理程序
			_eventHandler = {
				//在地图上显示我的关注点位
				SetAttentionToMap: function (e) {
					_showAttentionMarkOnMap.call(this);
					e.stopPropagation();
				}
			};

		var /**
			 * 电子防线列表显示后的事件绑定
			 * @private
			 */
			_bindEvents = function() {
				$(".favorite-body").find("[data-handler]").map(function () {
					$(this).off($(this).data("event")).on($(this).data("event"), _eventHandler[$(this).data("handler")]);
				});
			},
			/**
			 * 选中列表中的关注点，并显示在地图上
		     * @private
			 */
			_showAttentionMarkOnMap = function() {
				var data = $(this).data();
				//收集待显示的关注点信息
				var attention = {
					markerId: data.id,
					lon: data.x,
					lat: data.y,
					name: data.name,
					zoom: data.zoom,
					remark: data.description
				};
				// 查看我的关注的日志
				logDict.insertLog("m1", "f2", "o4", "b11", data.name + '点位');
				//在地图上显示
				MapAttentionView.showAttentionMark(attention, scope);
			};
		/**
		 * 取消关注后的列表刷新事件
		 * @param marker - 取消关注的地图对象
		 */
		scope.refreshOnCancel = function(marker) {
			var $attentionDom = $(".favorite .favorite-body").find("div.row[data-id='" + marker.getData().markerId + "']");
			$attentionDom.slideUp(200, function(){
				$(this).remove();
			});
		};
		/**
		 * 显示我的关注列表
		 * @param data - 待显示的数据
		 * @param params - 查询结果时的参数，（分页请求时有效）
		 */
		scope.showMyAttentionList = function(data, params) {
			if(!params) {
				//如果不是分页获取的，则需要显示分页
				_isFirstLoad = true;
			}
			//显示列表
			$(".favorite .favorite-body").empty().html($.trim(_compiler({
				favoriteMark: true,
				data: data
			})));
			//绑定事件
			_bindEvents();
			//判断是否已经显示分页了
			if(!_isFirstLoad) {
				return;
			}
			//判断是否显示分页
			if (data.total > 1) {
				$(".pagination").pagination(data.count, {
					items_per_page: 10,
					num_display_entries: 2,
					num_edge_entries: 1,
					callback: function (pageIndex) {
						if(pageIndex === 0 && _isFirstLoad) {
							_isFirstLoad = false;
							return;
						}
						//分页请求
						_controller.dealOnLoadMyAttention({
							current_page: pageIndex + 1
						});
					}
				});
			} else {
				$(".pagination").empty();
			}
		};

		//初始化页面
		scope.init = function (conctroller) {
			//保存控制器对象
			_controller = conctroller;
			//初始化信息窗模板
			MapCommon.loadTemplate(_templateUrl, function (compiler) {
				//保存模板对象
				_compiler = compiler;
			}, function () {
				notify("数据模板初始化失败！");
			});
		};

		return scope;

	}({}, jQuery));

});
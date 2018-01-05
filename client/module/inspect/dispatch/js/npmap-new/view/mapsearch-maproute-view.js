/**
 * Created by Zhangyu on 2015/4/23.
 */
define(["js/npmap-new/map-common", "js/npmap-new/map-variable", "jquery"], function(mapCommon, Variable, jQuery) {

	return (function (scope, $) {
		var //当前显示的资源类型
			_curDataType = "route",
			//保存控制器对象
			_controller = null,
			//模板渲染对象
			_compiler = null,
			//模板地址
			_templateUrl="inc/connection/left-resource-list.html",
			//路网的暂存结果
			_routeData = null,
			//事件处理程序
			_eventHandler = {
				//路网左侧资源的点击事件
				LeftRouteItemClick: function (e) {
					var curRoutePos = parseInt($(this).data("pos"));
					//显示道路
					scope.setRouteLine(curRoutePos);
					//阻止冒泡
					e.stopPropagation();
				},
				//全局搜索
				ClickSearchBtn: function(e) {
					_triggerSearchBtn.call(this);
					e.stopPropagation();
				}
			};

		var /**
			 * 资源列表显示后的事件绑定
			 * @param selector - 事件绑定选择器
			 * @param type - 搜索资源的类型
			 * @private
			 */
			_bindEvents = function(selector,type) {

				$(selector).find("[data-handler]").map(function () {
					$(this).off($(this).data("event")).on($(this).data("event"), _eventHandler[$(this).data("handler")]);
				});
				//绑定搜索框
				if(type) {
					_bindSearchInput(type);
				}
			},
			/**
			 * 绑定搜索框的事件
			 * @param type - 当前数据类型
			 * @private
			 */
			_bindSearchInput = function(type) {
				//搜索框dom对象
				var $searchDom = $(".np-input-search"),
					$searchBtn = $(".np-input-search-btn");
				//取消所有事件
				$searchDom.off();
				$searchBtn.off();
				//根据资源类型绑定搜索框
				if (type === "route") {
					//绑定资源搜索
					$searchDom.watch({
						wait: 200,
						captureLength: 0,
						//监听的输入长度
						callback: function(key) {
							key = (key === "") ? "高速" : key;
							//搜素资源
							_controller.QueryMap(key, type);
						}
					});
				}
				//绑定筛选事件（搜索按钮事件）
				_bindEvents(".np-search-panel");
			},
			/**
			 * 点击搜索按钮时触发
			 * @private
			 */
			_triggerSearchBtn = function() {
				var key = $.trim($(".np-input-search").val());
				//搜素道路
				_controller.searchResource(key, _curDataType);
			};

		scope.init = function(controller) {
			//保存控制器对象
			_controller = controller;
			//初始化信息窗模板
			mapCommon.loadTemplate(_templateUrl, function(compiler){
				//保存模板对象
				_compiler = compiler;
			}, function() {
				notify("左侧资源数据模板初始化失败！");
			});
		};
		/**
		 * 显示路网搜索列表
		 * @param data - 路网数据
		 */
		scope.showRouteList = function(data) {
			//保存搜索类型
			_curDataType = "route";
			//路网信息暂存
			_routeData = data;
			//渲染框架
			if($(".np-res-container").length === 0) {
				$(".sidebar-tree").empty().html($.trim(_compiler({
					resFrame: true
				})));
			}
			//渲染模板
			$(".np-res-container").empty().html($.trim(_compiler({
				maproute: true,
				items: data
			})));
			//绑定事件
			_bindEvents(".sidebar-tree", "route");
		};
		/**
		 * 将路网上的路线绘制到地图上（暂定为:搜索完毕不直接放大并展现路径位置，只有一条记录时除外）
		 * @param pos - 待显示的路网数据id
		 */
		scope.setRouteLine= function(pos) {
			var tempData = _routeData[pos];
			//移除资源定位图层的覆盖物
			Variable.layers.resourceShowLayer.removeAllOverlays();
			//显示资源定位图层
			Variable.layers.resourceShowLayer.show();
			//遍历显示
			for (var i = 0; i < tempData.feature.geometry.length; i++) {
				var item = tempData.feature.geometry[i];
				var points = [];
				for (var j = 0; j < item.length; j++) {
					points.push(new NPMapLib.Geometry.Point(item[j][0], item[j][1]));
				}
				var routeLine = new NPMapLib.Geometry.Polyline(points);
				Variable.layers.resourceShowLayer.addOverlay(routeLine);
			}

			//初始化地图层级变化参考量
			var pointx = tempData.feature.geometry[0][0][0], pointy = tempData.feature.geometry[0][0][1];
			var centerPoint = new NPMapLib.Geometry.Point(pointx, pointy);
			//放大图层并移动当前路径到中心位置
			Variable.map.setCenter(centerPoint, Variable.map.getMinZoom() + 3);
		};

		return scope;

	}({}, jQuery))
});
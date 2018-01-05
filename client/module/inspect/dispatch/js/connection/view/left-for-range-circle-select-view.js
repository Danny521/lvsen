/**
 * Created by Zhangyu on 2015/4/27.
 */
define([
	"js/sidebar/sidebar",
	"js/npmap-new/map-common",
	"jquery"
], function (SideBar, MapCommon, jQuery) {

	return (function (scope, $) {
		var //地图搜索结果展现对象
			_mapSearchView = null,
			//保存模板对象
			_compiler = null,
			//模板对象
			_templateUrl = "inc/connection/left-for-range-circle-select.html",
			//事件处理程序
			_eventHandler = {
				//左侧搜索结果点击事件
				LeftResultItemClick: function (e) {
					if(e.type === "click"){
						//点击
						_searchResultItemClick.call(this);
					} else if(e.type==="mouseenter") {
						//鼠标移入
						_searchResultItemOver.call(this);
					} else {
						//鼠标移出
						_searchResultItemOut.call(this);
					}
					e.stopPropagation();
				}
			};

		var /**
			 * 绑定事件
			 * @param selector - 选择器，为适应动态绑定
			 * @private
			 */
			_bindEvents = function(selector) {

				$(selector).find("[data-handler]").map(function () {
					$(this).off($(this).data("event")).on($(this).data("event"), _eventHandler[$(this).data("handler")]);
				});

			},
			/**
			 * 左侧搜索结果的鼠标点击事件
			 * @private
			 */
			_searchResultItemClick = function(){
				var resData = $(this).data(),
					dataFrom = $(this).closest(".np-range-circle-search-list").data("fromtype");
				//触发地图上点位
				_mapSearchView.clickSearchResultItem(resData, dataFrom);
				//修改左侧样式
				if(!$(this).hasClass("selected")) {
					$(this).addClass("active selected").siblings().removeClass("active selected");
				}
			},
			/**
			 * 左侧搜索结果的鼠标移入事件
			 * @private
			 */
			_searchResultItemOver = function(){
				var resData = $(this).data(),
					dataFrom = $(this).closest(".np-range-circle-search-list").data("fromtype");
				//触发地图上点位
				_mapSearchView.hoverSearchResultItem(resData, dataFrom);
			},
			/**
			 * 左侧搜索结果的鼠标移出事件
			 * @private
			 */
			_searchResultItemOut = function(){
				var resData = $(this).data(),
					dataFrom = $(this).closest(".np-range-circle-search-list").data("fromtype");
				//触发地图上点位
				_mapSearchView.hoveroutSearchResultItem(resData, dataFrom);
			};

		/**
		 * 显示视野范围内、附近搜索相关资源
		 * @param pageData - 当前页数据
		 * @param dataType - 当前数据类型
		 * @param dataFromTag - 当前数据来源
		 */
		scope.showCircleSelectResult = function(pageData, dataType, dataFromTag) {
			//加载左侧列表,插入框架
			SideBar.push({
				name: "#sidebar-body",
				markName: "CircleRangeResultPanel",
				template: $.trim(_compiler({
					searchResult: true,
					showHeader: true,
					police: (dataType === "gps"),
					policeman: (dataType === "350M"),
					lightbar: (dataType === "lightbar"),
					bayonet: (dataType === "bayonet"),
					alarm: (dataType === "alarm"),
					dataType: dataType,
					searchFrom: dataFromTag,
					searchPlace: (dataFromTag === "range") ? "视野范围内找" : "在附近找",
					searchTypeName: (dataType === "gps") ? "警力" : (dataType === "350M") ? "警员" : (dataType === "lightbar") ? "灯杆" : (dataType === "alarm") ? "报警" : (dataType === "bayonet") ? "卡口" : "",
					count: pageData.count,
					data: pageData,
					homeBreadUrl: $(".np-sidebar-header").find("li.active").data("mark")
				}))
			});
			//绑定事件
			_bindEvents(".np-range-circle-search-list");
		};

		/**
		 * 显示视野范围内、附近搜索相关资源在输入搜索时使用
		 * @param pageData - 当前页数据
		 * @param dataType - 当前数据类型
		 * @param dataFromTag - 当前数据来源
		 */
		scope.showInputSearchResult = function(pageData, dataType, dataFromTag) {
			//加载左侧列表,插入框架
			$(".np-search-all").children().remove(".np-camera-search-result").end().append($.trim(_compiler({
				searchResult: true,
				showHeader: false,
				police: (dataType === "gps"),
				policeman: (dataType === "350M"),
				lightbar: (dataType === "lightbar"),
				bayonet: (dataType === "bayonet"),
				alarm: (dataType === "alarm"),
				route: (dataType === "route"),
				dataType: dataType,
				searchFrom: dataFromTag,
				count: pageData.count,
				data: pageData,
				homeBreadUrl: $(".np-sidebar-header").find("li.active").data("mark")
			})));
			//更新总数
			$(".np-for-search-header .np-for-search-count").find(".count").text(pageData.count);
			//绑定事件
			_bindEvents(".np-range-circle-search-list");
		};

		/**
		 * 地图元素点击后联动到搜索结果
		 * @param index - 地图点位标记的位置
		 */
		scope.linkageToMapResultClick = function(index) {
			var $leftItemDom = $(".np-range-circle-search-list").find("li.np-range-circle-search-item[data-index='" + index + "']");
			//关联选中样式
			if(!$leftItemDom.hasClass("selected")) {
				//设置选中样式
				$leftItemDom.addClass("active selected").siblings().removeClass("active selected");
			}
		};
		/**
		 * 地图元素悬浮后联动到搜索结果
		 * @param index - 地图点位标记的位置
		 */
		scope.linkageToMapResultHover = function(index) {
			var $leftItemDom = $(".np-range-circle-search-list").find("li.np-range-circle-search-item[data-index='" + index + "']");
			//设置当前的鼠标样式
			if(!$leftItemDom.hasClass("selected")) {
				$leftItemDom.addClass("active");
			}
		};
		/**
		 * 地图元素移除悬浮后联动到搜索结果
		 * @param index - 地图点位标记的位置
		 */
		scope.linkageToMapResultHoverout = function(index) {
			var $leftItemDom = $(".np-range-circle-search-list").find("li.np-range-circle-search-item[data-index='" + index + "']");
			//设置当前的鼠标样式
			if(!$leftItemDom.hasClass("selected")) {
				$leftItemDom.removeClass("active");
			}
		};

		//初始化页面
		scope.init = function (MapSearchView) {
			//地图搜索结果展现对象
			_mapSearchView = MapSearchView;
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
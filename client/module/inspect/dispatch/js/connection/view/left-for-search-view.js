/**
 * Created by Zhangyu on 2015/4/27.
 */
define([
	"js/sidebar/sidebar",
	"js/npmap-new/map-common",
	"jquery"
], function (SideBar, MapCommon, jQuery) {

	return (function (scope, $) {
		var //保存调用时的上下文
			_context = null,
			//保存当前搜索的参数信息
			_searchData = null,
			//编辑当前数据来源
			_dataFrom = "",
			//保存模板对象
			_compiler = null,
			//模板对象
			_templateUrl = "inc/connection/left-for-search.html",
			//事件处理程序
			_eventHandler = {
				//搜索摄像机
				SearchCamera: function (e) {
					_searchDataFun("camera", 0);
					//隐藏分页
					$("#dataPager").empty();
					//e.stopPropagation();
				},
				//搜索卡口
				SearchBayonet: function (e) {
					_searchDataFun("bayonet", 5);
					//隐藏分页
					$("#dataPager").empty();
					//e.stopPropagation();
				},
				//搜索警车
				SearchPolice: function (e) {
					_searchDataFun("gps", 2);
					//隐藏分页
					$("#dataPager").empty();
					//e.stopPropagation();
				},
				//搜索警员
				SearchPoliceman: function (e) {
					_searchDataFun("350M", 3);
					//隐藏分页
					$("#dataPager").empty();
					//e.stopPropagation();
				},
				//搜索灯杆
				SearchLightbar: function (e) {
					_searchDataFun("lightbar", 4);
					//隐藏分页
					$("#dataPager").empty();
					//e.stopPropagation();
				},
				//搜索报警信息
				SearchAlarm: function(e) {
					_searchDataFun("alarm", 1);
					//隐藏分页
					$("#dataPager").empty();
				}
			};

		var /**
			 * 绑定事件
			 * @private
			 */
			_bindEvents = function() {
				//绑定事件
				$(".np-search-all").find("[data-handler]").map(function () {
					$(this).off($(this).data("event")).on($(this).data("event"), _eventHandler[$(this).data("handler")]);
				});
				//触发默认事件，目前暂定为摄像机
				$(".np-search-all").find(".np-input-search-fliter li[data-handler='SearchCamera']").trigger("click");
			},
			/**
			 * 输入搜索视野范围内及附近资源
			 * @param type - 资源类型（视野范围内搜索时用）
			 * @param typeNum - 资源类型 （附近搜索时用）
			 * @private
			 */
			_searchDataFun = function(type, typeNum) {
				//触发查询
				if (_dataFrom === "range") {
					//视野范围内搜索
					_context.getResourceDataByExtent.call(_context, type, _searchData.value);

				} else {
					//附近搜索
					_context.currCircleSearchType = typeNum;
					_context.dealSearchInCircle.call(_context, _searchData.value);
				}
			};
		/**
		 * 显示视野范围内、附近输入搜索相关资源
		 * @param dataFromTag - 当前数据来源
		 * @param data - 当前数据信息
		 */
		scope.showSearchResult = function(dataFromTag, data, context) {
			//保存执行上下文
			_context = context;
			//保存搜索参数
			_searchData = data;
			//保存数据来源
			_dataFrom = dataFromTag;
			//加载左侧列表,插入框架
			SideBar.push({
				name: "#sidebar-body",
				markName: "SearchResultPanel",
				template: $.trim(_compiler({
					searchResult: true,
					searchPlace: (dataFromTag === "range") ? "视野范围内找" : "在附近找",
					searchFrom: dataFromTag,
					searchValue: data.value,
					homeBreadUrl: $(".np-sidebar-header").find("li.active").data("mark")
				}))
			});
			//绑定事件
			_bindEvents();
		};

		//初始化页面
		scope.init = function (fn) {
			//初始化信息窗模板
			MapCommon.loadTemplate(_templateUrl, function (compiler) {
				//保存模板对象
				_compiler = compiler;
				//执行回调函数
				fn & fn();
			}, function () {
				notify("数据模板初始化失败！");
			});
		};

		return scope;

	}({}, jQuery));

});
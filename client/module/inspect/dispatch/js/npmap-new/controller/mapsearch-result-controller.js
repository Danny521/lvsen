/**
 * Created by Zhangyu on 2015/4/9.
 */
define([
	"js/npmap-new/mapsearch-variable",
	"js/npmap-new/controller/mapsearch-common-fun",
	"js/npmap-new/view/mapsearch-result-view",
	"js/npmap-new/map-variable",
	"js/npmap-new/map-infowindow",
	"jquery",
	"jquery.pagination"
], function(_g, commonFuns, view, mapVariable, InfoWindow, jQuery) {

	return (function (scope, $) {

		var /**
			 * 翻页的触发的数据请求
			 * @param curPageIndex - 当前页码
			 */
			_getSinglePageData = function (curPageIndex) {

				_g.curDataType = (_g.curDataType === "tfz") ? "350M" : _g.curDataType;
				//显示当前分页的查询结果
				var beginIndex = (curPageIndex - 1) * _g.pageSize, endIndex = curPageIndex * _g.pageSize, pageData = {
					items: commonFuns.formatResultData(_g.resultData.items.slice(beginIndex, endIndex), 0),
					count: _g.resultData.count
				};
				//当用户点击查看更多时
				view.showItems(pageData);
			};
		/**
		 * 显示搜索的数据结果
		 * @param itemList - 搜索的结果列表
		 * @param dataType - 搜索的数据类型
		 * @param tag - 搜索数据的来源，around、range
		 */
		scope.showSearchResult = function (itemList, dataType, tag) {
			//重新包装搜索结果
			_g.resultData = {
				items: itemList,
				count: itemList.length
			};
			_g.curDataType = dataType;
			_g.curDataFromTag = tag;
			//如果是资源显示，则不需要分页，直接显示
			if(tag === "resource") {
				//_showResourcePointOnMapSync(_g.resultData);
				view.showItems(_g.resultData);
				return;
			}
			//需要分页，初始化分页控件,如果不够一页，则不显示分页
			if (_g.resultData.count > _g.pageSize) {
				//请求第一页
				_getSinglePageData(1);
				//绑定分页插件
				$(".pagination").pagination(_g.resultData.count, {
					orhide: true,
					items_per_page: _g.pageSize,
					ellipse_text: "...",
					num_display_entries: 2,
					num_edge_entries: 1,
					first_loading: false,
					callback: function (pageIndex) {
						_getSinglePageData(pageIndex + 1);
						//换页的时候关闭已经显示的信息窗
						InfoWindow.closeInfoWindow();
					}
				});
			} else {
				//只有一页
				_getSinglePageData(1);
				//清空分页
				$(".pagination").empty();
			}
		};

		return scope;

	}({}, jQuery));
});
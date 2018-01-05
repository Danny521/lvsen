/*global NPMapLib:true*/
/**
 * Created by Zhangyu on 2014/12/22.
 * 全局搜索主控逻辑的页面展现
 */
define([
	"js/npmap-new/mapsearch-variable",
	"js/npmap-new/controller/mapsearch-common-fun",
	"js/npmap-new/view/mapsearch-resultonmap-view",
	"js/npmap-new/map-variable",
	"js/connection/view/left-for-range-circle-select-view",
	"jquery",
	"pubsub"
], function(_g, commonFuns, showResultView, mapVariable, RangeCircleSelectView, jQuery, PubSub) {

	return (function(scope, $) {

		RangeCircleSelectView.init(scope);

		/**
		 * 点击搜索结果后的交互操作，与地图进行联动
		 * @param resData - 鼠标点击的dom元素信息
		 * @param dataFrom - 当前项的数据来源，range是视野范围内，around是附近查找
		 * @private
		 */
		scope.clickSearchResultItem = function (resData, dataFrom) {
			//根据不同类型的数据处理
			if (dataFrom === "around") {
				markers = mapVariable.layers.globalSearchRoundLayer._overlays;
			} else {
				markers = mapVariable.layers.rangeSearchLayer._overlays;
			}
			try {
				for (var key in markers) {
					var markerData = markers[key].getData();
					if (markers.hasOwnProperty(key) && markerData) {
						//响应地图中该点
						if (markerData.index === resData.index) {
							markerInfo = commonFuns.getSymbolByDataType(markerData.type, true, "search");
							markers[key].setIcon(markerInfo.symbol);
							markers[key].getLabel().setOffset(markerInfo.labelOffset);
							markers[key].refresh();
							//记录当前活动的摄像机标注
							mapVariable.currentCameraData = markerData;
							//在地图上居中该点
							var point = new NPMapLib.Geometry.Point(markerData.feature.geometry.x, markerData.feature.geometry.y);
							mapVariable.map.setCenter(point);
							//显示信息窗口
							PubSub.publishSync("showInfoWindowOnMap1", {
								data: markerData,
								sence: "",
								fn: function(){
									//设置当前活动摄像机标注
									mapVariable.currentCameraMarker = markers[key];
								}
							});
						}
					}
				}
			} catch (e) {
			}
		};
		/**
		 * 鼠标悬浮搜索结果，与地图进行联动
		 * @param resData - 鼠标点击的dom元素信息
		 * @param dataFrom - 当前项的数据来源，range是视野范围内，around是附近查找
		 * @private
		 */
		scope.hoverSearchResultItem = function (resData, dataFrom) {
			//根据不同类型的数据处理
			var markers = null, markerInfo = null;
			//如果悬浮摄像机是当前已选中摄像机，撤销悬浮效果
			if (resData.lon === parseFloat(mapVariable.lastClickData.longitude) && resData.lat === parseFloat(mapVariable.lastClickData.latitude)) {
				return;
			}
			//获取地图上元素点位信息
			if (dataFrom === "around") {
				markers = mapVariable.layers.globalSearchRoundLayer._overlays;
			} else {
				markers = mapVariable.layers.rangeSearchLayer._overlays;
			}
			try {
				for (var key in markers) {
					var markerData = markers[key].getData();
					if (markers.hasOwnProperty(key) && markerData) {
						//响应地图中该点
						if (markerData.index === resData.index) {
							markerInfo = commonFuns.getSymbolByDataType(markerData.type, true, "search");
							markers[key].setIcon(markerInfo.symbol);
							markers[key].getLabel().setOffset(markerInfo.labelOffset);
							markers[key].refresh();
							markers[key].setZIndex(1000);
						}
					}
				}
			} catch (e) {}
		};
		/**
		 * 鼠标移出悬浮搜索结果，与地图进行联动
		 * @param resData - 鼠标点击的dom元素信息
		 * @param dataFrom - 当前项的数据来源，range是视野范围内，around是附近查找
		 * @private
		 */
		scope.hoveroutSearchResultItem = function (resData, dataFrom) {
			//根据不同类型的数据处理
			var markers = null, markerInfo = null;
			//如果悬浮摄像机是当前已选中摄像机，撤销悬浮效果
			if (resData.lon === parseFloat(mapVariable.lastClickData.longitude) && resData.lat === parseFloat(mapVariable.lastClickData.latitude)) {
				return;
			}
			//获取地图上元素点位信息
			if (dataFrom === "around") {
				markers = mapVariable.layers.globalSearchRoundLayer._overlays;
			} else {
				markers = mapVariable.layers.rangeSearchLayer._overlays;
			}
			try {
				for (var key in markers) {
					var markerData = markers[key].getData();
					if (markers.hasOwnProperty(key) && markerData) {
						//响应地图中该点
						if (markerData.index === resData.index) {
							markerInfo = commonFuns.getSymbolByDataType(markerData.type, false, "search");
							markers[key].setIcon(markerInfo.symbol);
							markers[key].getLabel().setOffset(markerInfo.labelOffset);
							markers[key].refresh();
						}
					}
				}
			} catch (e) {
			}
		};
		/**
		 * 显示更多时，渲染单页数据使用
		 * @param pageData - 单页数据信息
		 */
		scope.showItems = function (pageData) {
			//将当前分页的列表项定位到地图上
			if (_g.curDataType === "map" || _g.curDataType === "gps" || _g.curDataType === "bayonet" || _g.curDataType === "lightbar" || _g.curDataType === "350M" || _g.curDataType === "alarm") {
				//在地图上定位该分页的数据
				showResultView.setItemsPosition(pageData);
			}
			if (_g.curDataFromTag !== "resource") {
				if (_g.isInputSearch) {
					//填充模板并显示（如果是输入搜索）
					RangeCircleSelectView.showInputSearchResult(pageData, _g.curDataType, _g.curDataFromTag);
				} else {
					//填充模板并显示
					RangeCircleSelectView.showCircleSelectResult(pageData, _g.curDataType, _g.curDataFromTag);
				}
			}
		};

		return scope;

	}({}, jQuery));
});

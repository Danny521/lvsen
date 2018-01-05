/*global NPMapLib:true, mapConfig:true*/
/**
 * Created by Zhangyu on 2014/12/22.
 * 全局搜索结果数据展现显示逻辑
 */
define([
	"js/npmap-new/controller/mapsearch-common-fun",
	"js/npmap-new/mapsearch-variable",
	"js/npmap-new/map-variable",
	"js/npmap-new/map-const",
	"js/connection/view/left-for-range-circle-select-view",
	"js/npmap-new/view/mapsearch-resource-cluster-view",
	"js/npmap-new/map-common-overlayer-ctrl",
	"jquery",
	"pubsub"
], function(commonFuns, _g, mapVariable, mapConst, RangeCircleSelectView, ResClusterView, MapOverLayerCtrl, jQuery, PubSub) {

	var View  = function(){};

	View.prototype = {
		/**
		 * 搜索结果的地图定位处理程序
		 * @param pageDatas - 待定位点位坐标数据
		 */
		setItemsPosition: function(pageDatas) {
			var self = this;
			//图层切换
			MapOverLayerCtrl.showAndHideOverLayers("show-range-circle-res-on-result", (_g.curDataFromTag === "around" || _g.curDataFromTag === "range") ? _g.curDataFromTag : _g.curDataType);
			//如果是周围搜索，这需要标记中心点
			if(_g.curDataFromTag === "around") {
				//清除掉中心点数据（如果结果中存在中心点数据，则需要清除）
				if(commonFuns.clearSearchCenterData(pageDatas.items)){
					//如果清除，则需要更新总数
					pageDatas.count--;
				}
			} else if(_g.curDataFromTag === "resource") {
				//灯杆、警车、警员资源，需要添加聚合图层
				ResClusterView.loadResourceCluster(pageDatas.items, _g.curDataType);
				return;
			}
			//遍历当前页数据，并显示在地图上
			for (var i = 0; i < pageDatas.items.length; i++) {
				var tempData = pageDatas.items[i];
				//监控点标注
				var mapX = tempData.feature.geometry.x, mapY = tempData.feature.geometry.y;
				if (mapX && mapY) {
					var markerPos = new NPMapLib.Geometry.Point(mapX, mapY);
					var marker = new NPMapLib.Symbols.Marker(markerPos);
					//根据数据类型，获取对应的图标
					markerInfo = commonFuns.getSymbolByDataType(tempData.type, false, (tempData.subType === "resource") ? "res" : "more");
					marker.setIcon(markerInfo.symbol);
					//判断是否是资源，如果是，则不需要文字标注
					//if (tempData.subType !== "resource") {
						label = new NPMapLib.Symbols.Label(tempData.num);
						label.setStyle({
							Color: "#ffffff"
						});
						label.setOffset(markerInfo.labelOffset);
						marker.setLabel(label);
					//}
					//设置数据
					var markerData = jQuery.extend(tempData, {
						index: i,
						markerType: "search-marker"
					});
					marker.setData(markerData);

					/*if (tempData.subType === "resource") {
						//如果是资源，则添加到资源图层
						self.showResourceMarkerOnMapLayer(marker);
					} else*/ if (tempData.subType === "around") {
						//周围搜索的结果均显示在globalSearchRoundLayer上，方便清除刷新
						mapVariable.layers.globalSearchRoundLayer.addOverlay(marker);
					} else if(tempData.subType === "range") {
						//视野范围内显示图层
						mapVariable.layers.rangeSearchLayer.addOverlay(marker);
					}

					//给图层元素绑定事件-点击事件
					marker.addEventListener("click", function (mark) {
						self.clickMapPoint(mark);
					});
					//给图层元素绑定事件-鼠标移入事件
					marker.addEventListener("mouseover", function (mark) {
						self.hoverMapPoint(mark)
					});
					//给图层元素绑定事件-鼠标移出事件
					marker.addEventListener("mouseout", function (mark) {
						self.hoverOutMapPoint(mark)
					});
				}
			}
		},
		/**
		 * 当点击了地图上的点位时，回调函数
		 * @param mark - 待处理的地图元素对象
		 */
		clickMapPoint: function(mark) {
			//如果当前摄像机点位已经被选中，则不再进行图标刷新
			if (mark.getData().feature.geometry.x === mapVariable.lastClickData.longitude && mark.getData().feature.geometry.y === mapVariable.lastClickData.latitude) {
				return;
			}
			//记录当前点击数据
			mapVariable.currentCameraData = mark.getData();
			//显示信息窗口
			PubSub.publishSync("showInfoWindowOnMap1", {
				data: mark.getData(),
				sence: "",
				fn: function(){
					//设置当前活动摄像机标注
					mapVariable.currentCameraMarker = mark;
				}
			});
			//设置左侧搜索结果
			RangeCircleSelectView.linkageToMapResultClick(mark.getData().index);
		},

		/**
		 * 当鼠标移入了地图上的点位时，回调函数
		 * @param mark - 待处理的地图元素对象
		 */
		hoverMapPoint: function(mark) {
			//如果当前摄像机点位已经被选中，则不再进行图标刷新
			if (mark.getData().feature.geometry.x === mapVariable.lastClickData.longitude && mark.getData().feature.geometry.y === mapVariable.lastClickData.latitude) {
				return;
			}
			//不是中心点，才刷新图标
			var markerInfo = commonFuns.getSymbolByDataType(mark.getData().type, true, (mark.getData().subType === "resource") ? "res" : "handle");
			//修改图标样式
			mark.setIcon(markerInfo.symbol);
			/*(mark.getData().subType !== "resource") ? */mark.getLabel().setOffset(markerInfo.labelOffset)/* : ""*/;
			mark.refresh();

			//设置左侧搜索结果
			RangeCircleSelectView.linkageToMapResultHover(mark.getData().index);
		},

		/**
		 * 当鼠标移出了地图上的点位时，回调函数
		 * @param mark - 待处理的地图元素对象
		 */
		hoverOutMapPoint: function(mark) {
			//如果当前摄像机点位已经被选中，则不再进行图标刷新
			if (mark.getData().feature.geometry.x === mapVariable.lastClickData.longitude && mark.getData().feature.geometry.y === mapVariable.lastClickData.latitude) {
				return;
			}
			//不是中心点，才刷新图标
			var markerInfo = commonFuns.getSymbolByDataType(mark.getData().type, false, (mark.getData().subType === "resource") ? "res" : "handle");
			//修改图标样式
			mark.setIcon(markerInfo.symbol);
			/*(mark.getData().subType !== "resource") ? */mark.getLabel().setOffset(markerInfo.labelOffset)/* : ""*/;
			mark.refresh();

			//设置左侧搜索结果
			RangeCircleSelectView.linkageToMapResultHoverout(mark.getData().index);
		}
	};

	return new View();
});

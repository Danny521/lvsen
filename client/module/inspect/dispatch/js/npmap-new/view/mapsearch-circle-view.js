/*global NPMapLib: true*/
/**
 * Created by Zhangyu on 2014/12/22.
 * 全局搜索附近搜索相关展现逻辑
 */
define([
	"js/npmap-new/controller/mapsearch-common-fun",
	"js/npmap-new/map-variable",
	"js/npmap-new/map-const",
	"pubsub"
], function(commonFuns, mapVariable, MapConst, PubSub){

	var View = function(){
		var self = this;

		self.GisToolKit = new NPMapLib.GisToolKit();
	};

	View.prototype = {
		//标记范围内搜索时，拖动按钮的鼠标按下状态
		isDown: false,
		//标记范围内搜索时，拖动按钮的鼠标移入状态
		isOver: false,
		//标记范围内搜索时，拖动编辑状态
		isEdit: false,
		//圈圈搜索时需要地图工具库
		GisToolKit: null,
		/**
		 * 搜索圈内的摄像机、卡口、报警、警力（gps、350）
		 * @param centerPoint - 搜索中心点的位置
		 * @param extern - 输入搜索时的搜索关键字
		 */
		searchInCircle: function(centerPoint, extern) {
			var self = this;
			//在缩放之前关闭窗口,以解决ocx地图信息窗播放在缩放后关闭造成ocx画面残留的问题，add by zhangyu, 2014-11-11
			window.infowindow.hide(true);
			window.gateController.closePop();
			//居中定位显示圆圈
			if (mapVariable.map.getZoom() < mapConfig.circleSearchZoom) {
				mapVariable.map.centerAndZoom(centerPoint, mapConfig.circleSearchZoom);
			}
			// 圆圈
			mapVariable.GlobalSearch.searchCircle = new NPMapLib.Geometry.Circle(centerPoint, 1000, {
				color: "#acb9d1", //颜色
				fillColor: "#6980bc", //填充颜色
				weight: 2, //宽度，以像素为单位
				opacity: 1, //透明度，取值范围0 - 1
				fillOpacity: 0.2 //填充的透明度，取值范围0 - 1
			});
			mapVariable.map.addOverlay(mapVariable.GlobalSearch.searchCircle);
			mapVariable.GlobalSearch.searchCircle.setZIndex(9999);
			//搜索范围文本背景图像标记
			mapVariable.GlobalSearch.searchTextBg = new NPMapLib.Symbols.Marker(centerPoint);
			mapVariable.GlobalSearch.searchTextBg.setIcon(MapConst.symbol.dragCircleSymbol());
			mapVariable.GlobalSearch.searchTextBg.setOffset(new NPMapLib.Geometry.Size(22, -1));
			var label = new NPMapLib.Symbols.Label("1000米", {
				offset: new NPMapLib.Geometry.Size(15, 7)
			});
			//设置样式
			label.setStyle({
				fontSize: 12, //文字大小
				fontFamily: "宋体", //字体
				align: "left" //对方方式
			});
			mapVariable.GlobalSearch.searchTextBg.setLabel(label);
			//设置偏移量
			var p = mapVariable.GlobalSearch.searchCircle.getCenter();
			p.lon = p.lon + self.GisToolKit.getDistanceByProjection(1000, mapVariable.map);
			mapVariable.GlobalSearch.searchTextBg.setPosition(p);
			mapVariable.GlobalSearch.searchTextBg.isEnableEdit = true;
			mapVariable.map.addOverlay(mapVariable.GlobalSearch.searchTextBg);
			mapVariable.GlobalSearch.searchTextBg.setZIndex(10000);
			//禁用拖拽事件
			mapVariable.map.disableEditing();
			//如果是周围搜索，这需要标记中心点
			commonFuns.markCircleCenter();
			//查询并显示默认查询结果
			PubSub.publish("dealSearchInCircle1", {
				value: extern
			});
			//绑定周围搜索圈圈的鼠标点击、移入、移出事件
			mapVariable.GlobalSearch.searchTextBg.addEventListener("featuremousedown", function () {
				self.searchTextBgMouseDown();
				//更新图片
				mapVariable.GlobalSearch.searchTextBg.setIcon(MapConst.symbol.dragCircleHoverSymbol());
				mapVariable.GlobalSearch.searchTextBg.refresh();
			});
			mapVariable.GlobalSearch.searchTextBg.addEventListener("mouseover", function () {
				self.searchTextBgMouseOver();
				//更新图片
				mapVariable.GlobalSearch.searchTextBg.setIcon(MapConst.symbol.dragCircleHoverSymbol());
				mapVariable.GlobalSearch.searchTextBg.refresh();
			});
			mapVariable.GlobalSearch.searchTextBg.addEventListener("mouseout", function () {
				self.searchTextBgMouseOut();
				//更新图片
				mapVariable.GlobalSearch.searchTextBg.setIcon(MapConst.symbol.dragCircleSymbol());
				mapVariable.GlobalSearch.searchTextBg.refresh();
			});
			//点击启动拖拽事件
			if (NPMapLib.MARKER_EVENT_CLICK) {
				mapVariable.GlobalSearch.searchTextBg.removeEventListener(NPMapLib.MARKER_EVENT_CLICK);
			}
			mapVariable.GlobalSearch.searchTextBg.addEventListener(NPMapLib.MARKER_EVENT_CLICK, function () {
				mapVariable.map.enableEditing();
			});
			//拖拽事件
			mapVariable.GlobalSearch.searchTextBg.addEventListener("draging", function () {
				self.searchTextBgDraging();
			});
			// 拖拽结束后重新获取数据
			mapVariable.GlobalSearch.searchTextBg.addEventListener("dragend", function () {
				var extent = mapVariable.GlobalSearch.searchCircle.getExtent();
				mapVariable.map.zoomToExtent(extent);
				self.searchTextBgDragend(extern);
			});
			//添加完成后定位到合适范围
			var extent = mapVariable.GlobalSearch.searchCircle.getExtent();
			mapVariable.map.zoomToExtent(extent);
		},
		/**
		 * 周围搜索圆圈鼠标按下事件
		 */
		searchTextBgMouseDown: function(){

			var self = this;

			self.isDown = true;
			self.isOver = true;
		},
		/**
		 * 周围搜索圆圈鼠标移入事件
		 */
		searchTextBgMouseOver: function(){

			var self = this;

			if (!self.isEdit) {
				mapVariable.map.enableEditing();
				self.isEdit = true;
			}
			self.isOver = true;
		},
		/**
		 * 周围搜索圆圈鼠标移出事件
		 */
		searchTextBgMouseOut: function(){

			var self = this;

			if (!self.isDown) {
				if (self.isEdit) {
					mapVariable.map.disableEditing();
					self.isEdit = false;
				}
			}
			self.isOver = false;
		},
		/**
		 * 周围搜索圈的拖拽事件
		 */
		searchTextBgDraging: function(){
			var self = this;
			var p = mapVariable.GlobalSearch.searchCircle.getCenter();
			var r = mapVariable.GlobalSearch.searchTextBg.getPosition().lon - mapVariable.GlobalSearch.searchCircle.getCenter().lon;
			if (r < self.GisToolKit.getDistanceByProjection(500, mapVariable.map)) {
				p.lon = p.lon + self.GisToolKit.getDistanceByProjection(500, mapVariable.map);
				r = 500;
			} else if (r > self.GisToolKit.getDistanceByProjection(5000, mapVariable.map)) {
				p.lon = p.lon + self.GisToolKit.getDistanceByProjection(5000, mapVariable.map);
				r = 5000;
			} else {
				p.lon = mapVariable.GlobalSearch.searchTextBg.getPosition().lon;
				r = self.GisToolKit.getPlatDistanceByProjection(r, mapVariable.map);
			}
			//重置圆半径文本
			var label = mapVariable.GlobalSearch.searchTextBg.getLabel();
			label.setContent(Math.round(r) + "米");
			mapVariable.GlobalSearch.searchTextBg.setLabel(label);
			mapVariable.GlobalSearch.searchTextBg.setPosition(p);
			mapVariable.GlobalSearch.searchTextBg.refresh();
			//重置圆的半径
			mapVariable.GlobalSearch.searchCircle.setRadius(r);
			mapVariable.GlobalSearch.searchCircle.refresh();
		},
		/**
		 * 周围搜索框的拖拽结束事件
		 * @param extern - 输入搜索时的搜索关键字
		 */
		searchTextBgDragend: function(extern){
			var self = this;

			if (!self.isOver) {
				if (self.isEdit) {
					mapVariable.map.disableEditing();
					self.isEdit = false;
				}
			}
			self.isDown = false;
			//拖拽结束后，执行查询
			PubSub.publish("dealSearchInCircle1", {
				value: extern
			});
		}
	};

	return new View();
});

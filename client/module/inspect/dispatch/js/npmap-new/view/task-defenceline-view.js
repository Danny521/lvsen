define([
	"js/npmap-new/map-variable",
	"js/npmap-new/map-common",
	"OpenLayers"
], function(Variable, MapCommon) {

	return (function (scope) {

		var //防线区域面积
			_polygonArea,
			//防线点位信息
			_polygonPoints,
			//绘制电子防线的线条颜色
			_drawLineColor,
			//电子防线绘制完成事件
			_callBackMethod = function(result, geometry) {
				//显示绘制区域
				geometry._color = _drawLineColor;
				geometry._fillColor = "#6980bc";
				geometry._opacity = 0.8;
				Variable.layers.defenseLineLayer.addOverlay(geometry);
				//取消绘制提示
				Variable.map.deactivateMouseContext();
				//收集绘制信息
				var units = "m";
				_polygonArea = geometry.getArea(units).toFixed(3);
				_polygonPoints = MapCommon.convertArrayToGeoJson(geometry._points, "Polygon");

			};
		/**
		 * 触发绘制电子防线
		 */
		scope.drawDefenceLine = function(color){
			_drawLineColor = color;
			//显示该图层
			Variable.layers.defenseLineLayer.show();
			//清除电子防线图层的覆盖物
			Variable.layers.defenseLineLayer.removeAllOverlays();
			//关闭信息窗
			window.infowindow.closeInfoWindow();
			//触发绘制
			Variable.drawtool.setMode(NPMapLib.DRAW_MODE_POLYLGON, _callBackMethod);
			//显示绘制提示
			Variable.map.activateMouseContext("单击开始绘制，双击结束，右键取消绘制");
		};
		/**
		 * 显示电子防线到地图上
		 * @param pointinfo - 点位信息
		 * @param color - 颜色
		 * @param zoom - 缩放比例
		 */
		scope.showDefenceLine = function (pointinfo, color, zoom) {
			//显示该图层
			Variable.layers.defenseLineLayer.show();
			//清除电子防线图层的覆盖物
			Variable.layers.defenseLineLayer.removeAllOverlays();
			//该电子防线的数据
			var pointinfo = JSON.parse(JSON.parse(pointinfo));
			//显示电子防线
			if (pointinfo) {
				var pt = new NPMapLib.Geometry.Point(pointinfo.coordinates[0][0][0], pointinfo.coordinates[0][0][1]);
				//居中定位
				Variable.map.centerAndZoom(pt, zoom);
				var bufferpoints = pointinfo.coordinates[0];
				var temps = [];
				for (var m = 0; m < bufferpoints.length; m++) {
					var point = new NPMapLib.Geometry.Point(bufferpoints[m][0], bufferpoints[m][1]);
					temps.push(point);
				}
				var bufferResult = new NPMapLib.Geometry.Polygon(temps, {
					color: color, //颜色
					fillColor: "#000000", //填充颜色
					weight: 3, //宽度，以像素为单位
					opacity: 0.24, //透明度，取值范围0 - 1
					fillOpacity: 0.24 //填充的透明度，取值范围0 - 1
				});
				Variable.layers.defenseLineLayer.addOverlay(bufferResult);
			}
		};
		/**
		 * 获取当前地图缩放层级【电子防线保存时用】
		 */
		scope.clearLineOnMap = function() {
			Variable.layers.defenseLineLayer.removeAllOverlays();
		};
		/**
		 * 获取多边形的面积【电子防线保存时用】
		 */
		scope.getPolygonArea = function() {
			return _polygonArea ? _polygonArea : 0;
		};
		/**
		 * 获取坐标【电子防线保存时用】
		 */
		scope.getPolygonPoints = function() {
			return _polygonPoints;
		};
		/**
		 * 获取当前地图缩放层级【电子防线保存时用】
		 */
		scope.getZoom = function() {
			return Variable.map.getZoom();
		};
		/**
		 * 清空之前的点位信息【电子防线保存时用】
		 */
		scope.clearPolygonPoints = function() {
			_polygonPoints = null;
		};

		return scope;

	}({}));
});
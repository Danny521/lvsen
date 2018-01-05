(function() {
	/*
	write by songjiang 20150819
	主要实现几个对象与几种几何格式的转换暂时支持geojson wkt，
	主要支持marker的生成，解决偏移使用困难问题
	*/
	var e = MapPlatForm.Base.MapGeometry = function() {
		this.CLASS_NAME = 'MapPlatForm.Base.MapGeometry';
	};
	e.prototype.getGeometryByGeoJson = function(geojson) {
		var geometry = GeoJSON.read(geojson);
		return geometry;
	};
	e.prototype.getGeometryByWKT = function(wkt) {
		var geometry = WKT.read(wkt);
		return geometry;
	};
	e.prototype.getFGeoJsonByGeometry = function(geometry) {
		var geoJson = GeoJSON.write(geometry);
		return geoJson;
	};
	e.prototype.getGGeoJsonByGeometry = function(geometry) {
		var feature = GeoJSON.write(geometry);
		var featureJson = JSON.parse(feature);
		var geometry = JSON.stringify(featureJson.geometry);
		return geometry;
	};
	e.prototype.geWKTByGeometry = function(geometry) {
		// body...
		var wkt = WKT.write(geometry);
		return wkt;
	};
	/**
	 * [创建标注]
	 * @date   2015-09-06
	 * @param  {[type]}   point      [坐标点]
	 * @param  {[markerParam]} 
	 * {
			url: "/common/images/map/map-icon/map-marker.png", [图片路径]
			size: {											   [图片大小]
				width: 26,
				height: 29
			},
			markerType: 1									   [以中心点为中心 0，以底部为中心 1]
		}
	 */
	e.prototype.createMarker = function(point, markerParam) {
		// body...
		//图片
		markerType = markerParam.markerType ? markerParam.markerType : MapPlatForm.ModdleMarker;
		var icon = new NPMapLib.Symbols.Icon(markerParam.url, new NPMapLib.Geometry.Size(markerParam.size.width, markerParam.size.height));
		if (markerType == MapPlatForm.ModdleMarker) {
			icon.setAnchor(new NPMapLib.Geometry.Size(-markerParam.size.width / 2, -markerParam.size.height / 2));
		}
		var marker = new NPMapLib.Symbols.Marker(point);
		marker.setIcon(icon);
		if (markerParam.text) {
			label = new NPMapLib.Symbols.Label(markerParam.text);
			label.setStyle({
				Color: "#ffffff"
			});
			markerParam.labelOffset = markerParam.labelOffset ? markerParam.labelOffset : {
				width: 0,
				height: 0
			};
			//label的偏移量
			var labelOffset = new NPMapLib.Geometry.Size(markerParam.labelOffset.width, markerParam.labelOffset.height);
			//设置label的偏移量
			label.setOffset(labelOffset);
			//marker上添加label
			marker.setLabel(label);
		}
		return marker;
	};
	e.prototype.getIconByParam = function(param){
		markerType = param.markerType ? param.markerType : MapPlatForm.ModdleMarker;
		var icon = new NPMapLib.Symbols.Icon(param.url, new NPMapLib.Geometry.Size(param.size.width, param.size.height));
		if (markerType == MapPlatForm.ModdleMarker) {
			icon.setAnchor(new NPMapLib.Geometry.Size(-param.size.width / 2, -param.size.height / 2));
		}
		return icon;
	};
	//获取覆盖物要素数组的范围
	e.prototype.getExtentByOverlays = function(overlays) {
		var minx, miny, maxx, maxy;
		for (var i = overlays.length - 1; i >= 0; i--) {
			var extent = overlays[i].getExtent();
			if (!minx || !miny || !maxx || !maxy) {
				minx = extent.left;
				miny = extent.bottom;
				maxx = extent.right;
				maxy = extent.top;
			} else {
				if (minx > extent.left) {
					minx = extent.left;
				}
				if (miny > extent.bottom) {
					miny = extent.bottom;
				}
				if (maxx < extent.right) {
					maxx = extent.right;
				}
				if (maxy < extent.top) {
					maxy = extent.top;
				}
			}
		}
		return new NPMapLib.Geometry.Extent(minx,miny,maxx,maxy);
	}
})();
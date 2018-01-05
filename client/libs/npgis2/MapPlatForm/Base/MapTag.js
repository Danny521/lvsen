(function(){
	var e = MapPlatForm.Base.MapTag = function(map,layer){
		this.CLASS_NAME = 'MapTag';
		//绑定当前图层
		this.layer = layer;
		this.map = map;
		if(!this.layer){
			this.layer = this.map.getDefaultLayer();
		}
		self = this;
	};
	//添加点位标注,鼠标点击地图增加标注
	e.prototype.addTagMarker = function(imageUrl,size,callback){
	    this.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
        this.map.addEventListener(NPMapLib.MAP_EVENT_CLICK, function(lonlat){
			self._addMarker(lonlat,imageUrl,size,function(marker){
					//添加完成标注或编辑结束触发
				if(callback instanceof Function){
					callback(marker);
				}
			});
        });
	};
	//添加兴趣点标注
	e.prototype.addPOIMarker = function(imageUrl,size,callback){
		this.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
        this.map.addEventListener(NPMapLib.MAP_EVENT_CLICK, function(lonlat){
			self._addMarker(lonlat,imageUrl,size,function(marker){
				//添加完成标注或者编辑标注时触发
				if(callback instanceof Function){
					callback(marker);
				}
			});
        });
	};

	//增加路口标注信息。点击地图增加标注
	e.prototype.addRoadCross = function(imageUrl,size,callback) {
		// body...
		this.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
		this.map.addEventListener(NPMapLib.MAP_EVENT_CLICK, function(lonlat){
				self._addMarker(lonlat,imageUrl,size,function(marker){
					//添加完成标注或编辑结束后触发
				if(callback instanceof Function){
					callback(marker);
				}
			});
		});
	};
	//添加标注实现方法
	e.prototype._addMarker = function(lonlat,imageUrl,size,callback){
		var point = new NPMapLib.Geometry.Point(lonlat.lon, lonlat.lat);
	    //图片
	    imageUrl = imageUrl?imageUrl:"Base/Images/tagMarker.png";
	    size = size?size:new NPMapLib.Geometry.Size(32, 32);
	    var icon = new NPMapLib.Symbols.Icon(imageUrl, size);
	    //设置偏移量，这里取坐标点为图片中心点
	    //icon.setAnchor(new NPMapLib.Geometry.Size(-size.width / 2, -size.height / 2));
	    var marker = new NPMapLib.Symbols.Marker(point);
	    marker.setIcon(icon);
	    self.layer.addOverlay(marker);
	    callback(marker);
        self.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
	};
	//清除类，清除地图绑定事件
	e.prototype.dispose = function(){
		this.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK);
	}
})();
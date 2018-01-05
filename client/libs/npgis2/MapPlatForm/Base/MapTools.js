(function(){
	/*
	write by songjiang 20150814
	地图基础工具类，主要实现地图中工具的方法。
	主要有测距，测面，绘线，绘矩形，多边形，圆，以及添加移除圆搜索控件，
	*/
	var e = MapPlatForm.Base.MapTools = function(map){
		this.CLASS_NAME = 'MapTools';
		//当前绑定地图
		this.map = map;
		//当前测量工具类
		this.measureTool = null;
		//当前绘制工具类
		this.drawTool = null;
		this.searchCircle =null;
		this.editMarker=null;
	};
	/*初始化测量工具
	*/
	e.prototype._initMeasureTool = function() {
		this.measureTool = new NPMapLib.Tools.MeasureTool(this.map.id, {
													lengthUnit: NPMapLib.MAP_UNITS_METERS, //长度单位
													areaUnit: NPMapLib.MAP_UNITS_SQUARE_KILOMETERS,	//面积单位
													mode: NPMapLib.MEASURE_MODE_DISTANCE //测量模式
													});
	};
	/*初始化绘制工具
	*/
	e.prototype._initDrawTool = function(){
		this.drawTool = new NPMapLib.Tools.DrawingTool(this.map.id);
	};
	/*距离测量
	*/
	e.prototype.measureDistance = function(){
		if(!this.measureTool){
			this._initMeasureTool();
		}
		this.cancelMeasure();
		this.cancelDraw();
		this.measureTool.startUp();
		this.measureTool.setMode(NPMapLib.MEASURE_MODE_DISTANCE);
	};
	//面积测量
	e.prototype.measureArea = function(){
		if(!this.measureTool){
			this._initMeasureTool();
		}
		this.cancelMeasure();
		this.cancelDraw();
		this.measureTool.startUp();
		this.measureTool.setMode(NPMapLib.MEASURE_MODE_AREA);
	};
	//停止量算
	e.prototype.cancelMeasure = function(){
		if(this.measureTool){
			try{
				this.measureTool.stop();
			}
			catch(e){
				this.measureTool.cancel();
			}
		}
	};
	//停止绘制
	e.prototype.cancelDraw = function(){
		if(this.drawTool){
			this.drawTool.cancel();
		}
	};
	//绘制线
	//callBackMethod 结束后回调方法
	e.prototype.drawLine = function(callBackMethod){
		if(!this.drawTool){
			this._initDrawTool();
		}
		this.cancelMeasure();
		this.cancelDraw();
		this.drawTool.startUp(callBackMethod);
		this.drawTool.setMode(NPMapLib.DRAW_MODE_POLYLINE, callBackMethod);
	};
	//绘制矩形
	//callBackMethod 结束后回调方法
	e.prototype.drawRectangle =function(callBackMethod){
		if(!this.drawTool){
			this._initDrawTool();
		}
		this.cancelMeasure();
		this.cancelDraw();
		this.drawTool.startUp(callBackMethod);
		this.drawTool.setMode(NPMapLib.DRAW_MODE_RECT, callBackMethod);
	};
	//绘制圆
	//callBackMethod 结束后回调方法
	e.prototype.drawCircle =function(callBackMethod){
		if(!this.drawTool){
			this._initDrawTool();
		}
		this.cancelMeasure();
		this.cancelDraw();
		this.drawTool.startUp(callBackMethod);
		this.drawTool.setMode(NPMapLib.DRAW_MODE_CIRCLE, callBackMethod);
	};
	//绘制多边形
	//callBackMethod 结束后回调方法
	e.prototype.drawPolygon =function(callBackMethod){
		if(!this.drawTool){
			this._initDrawTool();
		}
		this.cancelMeasure();
		this.cancelDraw();
		this.drawTool.startUp(callBackMethod);
		this.drawTool.setMode(NPMapLib.DRAW_MODE_POLYLGON, callBackMethod);
	};
	/*
	添加圆查询控件，用来支持圆搜索
	point要添加圆的圆心坐标点位
	callback调整圆结束时触发
	*/
	e.prototype.addCircleSearchControl = function(center,callback){
		var self = this;
		var radius = 2000;//默认圆半径
		var tempCallBack = callback;
        //圆形
        this.searchCircle = new NPMapLib.Geometry.Circle(center, radius, {
            color: "#6980bc", //颜色
            fillColor: "#6980bc", //填充颜色
            weight: 1, //宽度，以像素为单位
            opacity: 1, //透明度，取值范围0 - 1
            fillOpacity: 0.3 //填充的透明度，取值范围0 - 1
        });
        this.map.addOverlay(this.searchCircle);
        //图片大小
        var size = new NPMapLib.Geometry.Size(76, 24);
        //图片
        var icon = new NPMapLib.Symbols.Icon("Images/editCircle.png", size);
        //图像标记
        this.editMarker = new NPMapLib.Symbols.Marker(center);
        this.editMarker.setIcon(icon);
        this.editMarker.setOffset(new NPMapLib.Geometry.Size(20, 0));
        var label = new NPMapLib.Symbols.Label("2000米", {
            offset: new NPMapLib.Geometry.Size(15, 9)
        });

        //设置样式 
        label.setStyle({
            fontSize: 12, //文字大小 
            fontFamily: '宋体', //字体 
            align: 'left' //对方方式 
        });
        this.editMarker.setLabel(label);
        //设置偏移量
        var p = this.searchCircle.getCenter();
        p.lon = p.lon + new NPMapLib.GisToolKit().getDistanceByProjection(2000, this.map);
        this.editMarker.setPosition(p);
        this.editMarker.isEnableEdit = true;
        this.map.addOverlay(this.editMarker);
        this.editMarker.addEventListener("featuremousedown", function(marker) {
            isDown = true;
            isOver = true;
        });
        var isDown = false;//状态指示器，用来控制拖拽按钮
        var isOver = false;
        var isEdit = false;
        this.editMarker.addEventListener("mouseover", function(marker) {
            if (!isEdit) {
                self.map.enableEditing();
                isEdit = true;
            }
            isOver = true;
        });
        this.editMarker.addEventListener("mouseout", function(marker) {
            if (!isDown) {
                if (isEdit) {
                    self.map.disableEditing();
                    isEdit = false;
                }
            }
            isOver = false;
        });
        this.editMarker.addEventListener("draging", function(marker) {
            var p = self.searchCircle.getCenter();
            var r = marker.getPosition().lon - self.searchCircle.getCenter().lon;
            r = new NPMapLib.GisToolKit().getPlatDistanceByProjection(r, self.map);
            if (r < 500) {
                p.lon = p.lon + new NPMapLib.GisToolKit().getDistanceByProjection(500, self.map);;
                r = 500;
            } else if (r > 5000) {
                p.lon = p.lon + new NPMapLib.GisToolKit().getDistanceByProjection(5000, self.map);;
                r = 5000;
            } else {
                p.lon = marker.getPosition().lon;
            }
            var label = marker.getLabel();
            label.setContent(Math.round(r) + "米");
            marker.setLabel(label);
            self.searchCircle.setRadius(r);
            self.searchCircle.refresh();
            marker.setPosition(p);
            marker.refresh();
        });
        this.editMarker.addEventListener("dragend", function(marker) {
            if (!isOver) {
                if (isEdit) {
                    self.map.disableEditing();
                    isEdit = false;
                }
            }
            if(tempCallBack && (tempCallBack instanceof Function)){
            	tempCallBack(self.searchCircle);
            }
            var extent = self.searchCircle.getExtent();
        	self.map.zoomToExtent(extent);
            isDown = false;
        });
        this.map.disableEditing();
        //添加完成后定位到合适范围
        var extent = self.searchCircle.getExtent();
        this.map.zoomToExtent(extent);

        if(tempCallBack && (tempCallBack instanceof Function)){
            tempCallBack(self.searchCircle);
        }
	};
	e.prototype.removeCircleSearchControl = function() {
		// 移除图标和圆时，先移除图标上的所有的事件
		if(this.editMarker){
			this.editMarker.removeEventListener("dragend");
			this.editMarker.removeEventListener("draging");
			this.editMarker.removeEventListener("mouseout");
			this.editMarker.removeEventListener("mouseover");
			this.editMarker.removeEventListener("featuremousedown");
		}
		this.map.removeOverlay(this.editMarker);
		this.map.removeOverlay(this.searchCircle);
		this.map.disableEditing();
	}
})();
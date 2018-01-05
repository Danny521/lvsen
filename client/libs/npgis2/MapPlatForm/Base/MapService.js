(function(){
	var e = MapPlatForm.Base.MapService = function(map){
		this.CLASS_NAME = 'MapService';
		this.map = map;
		this.mapConfig = new MapPlatForm.Base.MapConfig();
		//当前的路径搜索服务
		this.routeService = null;
		//绑定当前图层
	};

	//根据路名查询
	e.prototype.queryRoadByName = function(roadName,callBack){
		var url = this.mapConfig.dataServiceURL+"query/getRoadsByName";
		var service = new NPMapLib.Services.QueryService(NPMapLib.MAPTYPE_NPGIS);
		var params = new NPMapLib.Services.queryParams();
		params = {
			roadName:roadName
		}
		service.query(url,params,function(result){
			var lines = [];
			for (var i = result.length - 1; i >= 0; i--) {
				var geometry = eval('(' + result[i].feature + ')');
				var line = GeoJSON.read(geometry);
				if(line instanceof Array){
					for (var j = line.length - 1; j >= 0; j--) {
						line[j].data = result[i];
						lines.push(line[j]);
					}
				}
				else{
					line.data = result[i];
					lines.push(line);
				}
			}
			if(callBack instanceof Function){
				callBack(lines);
			}
		});
	};

	//根据几个对象获取缓冲区对象
	//geometry要分析的几何对象
	//缓存范围（m为单位）
	e.prototype.getGeometryBuffer = function(geometry,buffer,callBack){
		var url = this.mapConfig.dataServiceURL+"gis/buffer";
		var params = new NPMapLib.Services.bufferParams();
        params.projection = this.map.getProjection();
        params.distance = buffer;
        params.units = "m";
        params.geometry = geometry;
        var service = new NPMapLib.Services.BufferService(this.map, NPMapLib.MAPTYPE_NPGIS);
        service.buffer(url, params, callBack);
	};

	//根据兴趣点名称查询。支持中文，拼音全拼，拼音首字母查询
	//name 查询关键字
	//callBack查询结束触发回调，传递点位对象数据
	//maxResult页最大行数，默认为10行
	//rowIndex页数，默认为1
	e.prototype.queryPOIByName = function(name,callBack,maxResult,rowIndex){
		var url = this.mapConfig.dataServiceURL+"query/poiname";
		var service = new NPMapLib.Services.QueryService(NPMapLib.MAPTYPE_NPGIS);
		var params = new NPMapLib.Services.queryParams();
		params.keyWord = name;
		params.maxResult = maxResult;
		params.rowIndex = rowIndex;
		service.query(url,params,function(result){
			var points=[];
			for (var i = 0; i < result.features.length; i++) {
				var geometry = eval('(' + result.features[i].geometry + ')');
				if(geometry.type === "Point" || geometry.type === "point"){
					var point = new NPMapLib.Geometry.Point(
						geometry.coordinates[0],
						geometry.coordinates[1]);
					point.data = result.features[i];
					points.push(point);
				}
			}
			if(callBack instanceof Function){
				callBack(points,result);
			}
		});
	};

	//根据坐标查询兴趣点信息，用于地理信息数据匹配，通过已知坐标获取相应地址信息
	//point坐标信息
	//callBack回调方法，将获取的结果信息传回，参数类型为NPMapLib.Geometry.Point,
	e.prototype.queryPOIByCoord = function(point,callBack) {
		var url = this.mapConfig.dataServiceURL+"query/poicoord";
		var service = new NPMapLib.Services.QueryService(NPMapLib.MAPTYPE_NPGIS);
		var params = new NPMapLib.Services.queryParams();
		params = {
			coord: point.lon+","+point.lat
		};
		service.query(url,params,function(result){
			var point;
			if(result && result.geometry){
				var geometry = eval('(' + result.geometry + ')');
				if(geometry.type === "Point" || geometry.type === "point"){
					point = new NPMapLib.Geometry.Point(
						geometry.coordinates[0],
						geometry.coordinates[1]);
					point.data = result;
				}
			}
			if(callBack instanceof Function){
				callBack(point);
			}
		});
	};
	//添加兴趣点
	e.prototype.addPOI = function(point,callBack){
		var url = this.mapConfig.dataServiceURL+"query/addPoi";
		var service = new NPMapLib.Services.QueryService(NPMapLib.MAPTYPE_NPGIS);
		var params = new NPMapLib.Services.queryParams();
		params = {
			name:point.data.name,
			poiType:point.data.type,
			address:point.data.address,
			x:point.lon,
			y:point.lat
		};
		service.updata(url,params,function(result){
			if(result){
				point.data = result;
				if(callBack instanceof Function){
					callBack(point);
				}
			}
			else{
				if(callBack instanceof Function){
					callBack(null);
				}
			}
		});
	};
	//更新兴趣点信息
	e.prototype.updataPOI = function(point,callBack){
		var url = this.mapConfig.dataServiceURL+"query/updataPoi";
		var service = new NPMapLib.Services.QueryService(NPMapLib.MAPTYPE_NPGIS);
		var params = new NPMapLib.Services.queryParams();
		params = {
			gid:point.data.gid,
			name:point.data.name,
			poiType:point.data.type,
			address:point.data.address,
			x:point.lon,
			y:point.lat
		};
		service.updata(url,params,function(result){
			if(result){
				point.data = result;
				if(callBack instanceof Function){
					callBack(point);
				}
			}
			else{
				if(callBack instanceof Function){
					callBack(null);
				}
			}
		});
	};
	//根据几何对象进行空间查询
	//geometry空间几何对象
	//callBack请求返回回调。
	//maxResult页最大行数，默认为10行
	//rowIndex页数，默认为1
	e.prototype.queryPOIByGeometry = function(geometry,callBack,maxResult,rowIndex){
		var url = this.mapConfig.dataServiceURL+"query/searchInBounds";
		var wktGeo = WKT.write(geometry);
		var service = new NPMapLib.Services.QueryService(NPMapLib.MAPTYPE_NPGIS);
		var params = new NPMapLib.Services.queryParams();
		params.wkt = wktGeo;
		params.maxResult = maxResult;
		params.rowIndex = rowIndex;
		service.query(url,params,function(result){
			var points=[];
			for (var i = 0; i < result.data.length; i++) {
				var geometry = eval('(' + result.data[i].geometry + ')');
				if(geometry.type === "Point" || geometry.type === "point"){
					var point = new NPMapLib.Geometry.Point(
						geometry.coordinates[0],
						geometry.coordinates[1]);
					point.data = result.data[i];
					points.push(point);
				}
			}
			if(callBack instanceof Function){
				callBack(points,result.pageCount,result.totalCount);
			}
		});
	};
	//根据条件查询兴趣点
	//filter的格式暂时是filedName=keyWord，等号前面是字段名称，等号后面是关键字
	//callBack请求返回回调。
	//maxResult页最大行数，默认为10行
	//rowIndex页数，默认为1
	e.prototype.queryPOIByFilter = function(filter,callBack,maxResult,rowIndex){
		var url = this.mapConfig.dataServiceURL+"query/poiname";
		var service = new NPMapLib.Services.QueryService(NPMapLib.MAPTYPE_NPGIS);
		var params = new NPMapLib.Services.queryParams();
		params.maxResult = maxResult;
		params.rowIndex = rowIndex;
		var fs = filter.split('=');
		params.type = fs[0];
		params.keyWord = fs[1];
		service.query(url,params,function(result){
			var points=[];
			for (var i = 0; i < result.features.length; i++) {
				var geometry = eval('(' + result.features[i].geometry + ')');
				if(geometry.type === "Point" || geometry.type === "point"){
					var point = new NPMapLib.Geometry.Point(
						geometry.coordinates[0],
						geometry.coordinates[1]);
					point.data = result.features[i];
					points.push(point);
				}
			}
			if(callBack instanceof Function){
				callBack(points,result.pageCount,result.totalCount);
			}
		});
	};
	//根据几何对象及条件查询兴趣点数据
	//geometry空间几何对象
	//filter的格式暂时是filedName=keyWord，等号前面是字段名称，等号后面是关键字
	e.prototype.queryPOIByGeometryAndFilter = function(geometry,filter,callBack){
		var url = this.mapConfig.dataServiceURL+"query/searchInBounds";
		var wktGeo = WKT.write(geometry);
		var service = new NPMapLib.Services.QueryService(NPMapLib.MAPTYPE_NPGIS);
		var params = new NPMapLib.Services.queryParams();
		params.wkt = wktGeo;
		params.maxResult = maxResult;
		params.rowIndex = rowIndex;
		var fs = filter.split('=');
		params.type = fs[0];
		params.keyWord = fs[1];
		service.query(url,params,function(result){
			var points=[];
			for (var i = 0; i < result.features.length; i++) {
				var geometry = eval('(' + result.features[i].geometry + ')');
				if(geometry.type === "Point" || geometry.type === "point"){
					var point = new NPMapLib.Geometry.Point(
						geometry.coordinates[0],
						geometry.coordinates[1]);
					point.data = result.features[i];
					points.push(point);
				}
			}
			if(callBack instanceof Function){
				callBack(points,result.pageCount,result.totalCount);
			}
		});
	};
	//根据路名查询路口信息
	//name为查询路名信息，如果是两条路，则用|隔开
	e.prototype.queryRoadCrossByName = function(name,callBack){
		var url = this.mapConfig.dataServiceURL+"query/getRoadCrossByName";
		var service = new NPMapLib.Services.QueryService(NPMapLib.MAPTYPE_NPGIS);
		var params = new NPMapLib.Services.queryParams();
		params.roadName = name;
		service.query(url,params,function(result){
			var points=[];
			for (var i = 0; i < result.length; i++) {
				var point = new NPMapLib.Geometry.Point(
					result.lon,
					result.lat);
				point.data = result;
				points.push(point);
			}
			if(callBack instanceof Function){
				callBack(points);
			}
		});
	};
	//根据几何对象查询路口信息
	e.prototype.queryRoadCrossByGeometry = function(geometry,callBack){
		var wktGeo = WKT.write(geometry);
		var url = this.mapConfig.dataServiceURL+"query/searchRoadCrossInBounds";
		var service = new NPMapLib.Services.QueryService(NPMapLib.MAPTYPE_NPGIS);
		var params = new NPMapLib.Services.queryParams();
		params.wkt = wktGeo;
		service.query(url,params,function(result){
			var points=[];
			for (var i = 0; i < result.length; i++) {
				var point = new NPMapLib.Geometry.Point(
					result.lon,
					result.lat);
				point.data = result;
				points.push(point);
			}
			if(callBack instanceof Function){
				callBack(points);
			}
		});
	};
	//添加路口信息，将路口信息存在point.data中
	e.prototype.addRoadCross = function(point){
		var url = this.mapConfig.dataServiceURL+"query/addRoadCross";
		var service = new NPMapLib.Services.QueryService(NPMapLib.MAPTYPE_NPGIS);
		var params = new NPMapLib.Services.queryParams();
		params = {
			name:point.data.name,
			x:point.lon,
			y:point.lat
		};
		service.updata(url,params,function(result){
			var point;
			if(result){
				point.data = result;
				if(callBack instanceof Function){
					callBack(point);
				}
			}
			else{
				if(callBack instanceof Function){
					callBack(null);
				}
			}
		});
	};
	//更新路口信息，将路口信息存在point.data中
	e.prototype.updataRoadCross = function(point){
		var url = this.mapConfig.dataServiceURL+"query/updataRoadCross";
		var service = new NPMapLib.Services.QueryService(NPMapLib.MAPTYPE_NPGIS);
		var params = new NPMapLib.Services.queryParams();
		params = {
			gid:point.data.gid,
			name:point.data.name,
			x:point.lon,
			y:point.lat
		};
		service.updata(url,params,function(result){
			var point;
			if(result){
				point.data = result;
				if(callBack instanceof Function){
					callBack(point);
				}
			}
			else{
				if(callBack instanceof Function){
					callBack(null);
				}
			}
		});
	};
	//根据起始坐标查询路线
	/*param: {
	*	startStop: startPoint,//起始点
	*	endStop: endPoint,//终止点
	*	trafficModel: traficModel,//交通方式:"car"、"walk"
	*	planRoadType: planRoadType//路径选择: 最短时间 1、最短距离 2、不走高速 3
	}*/
	e.prototype.searchRouteByCoor = function(param, callBack){
		var service = new NPMapLib.Services.RouteService(this.map, 7);
		var params = new NPMapLib.Services.routeParams();
		params.service = "na";
		params.request = "getroute";
		params.networkName = "shanghai_roadnet_supermap";//后续从配置文件取
		params.startStop = param.startStop;
		params.endStop = param.endStop;
		params.trafficModel = param.trafficModel;
		params.planRoadType = param.planRoadType;
		params.geoBarriers = [];
		params.algorithm = "Dijkstra";
		if (this.routeService) {
			this.routeService.abort();
			this.routeService = null;
		}
		this.routeService = service.route(this.mapConfig.dataServiceURL+"/gis/na", params, callBack);
	};
})();
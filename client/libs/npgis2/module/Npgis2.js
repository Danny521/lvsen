MapPlatForm={},MapPlatForm.Base={},MapPlatForm.ModdleMarker=0,MapPlatForm.BottomMarker=1,MapPlatForm.CustomMarker=2,function(){var a=MapPlatForm.Base.MapConfig=function(){this.CLASS_NAME="MapConfig",this.dataServiceURL="/npgisdataservice/",this.mapServiceURL="",this.mapInfo=null};a.prototype._addLayerToMap=function(a,b){var c=[];if(b&&b.length>0){for(var d,e,f,g=0,h=this.mapInfo.vectorLayer.length;h>g;g++)d=this.mapInfo.vectorLayer[g],f=d.layerType.split("."),e=new NPMapLib.Layers[f[f.length-1]](d.layerOpt.url,d.layerName,d.layerOpt),c.push(e);a.addLayers(c)}return c.length>0?c[0]:void 0},a.prototype.createMap=function(a,b){this.mapInfo=b;var c=new NPMapLib.Map(a,b.mapOpts),d=this._addLayerToMap(c,b.vectorLayer),e=this._addLayerToMap(c,b.sattilateLayer);return{map:c,vectorLayer:d,sattilateLayer:e}}}(),function(){var a=MapPlatForm.Base.MapGeometry=function(a){this.CLASS_NAME="MapPlatForm.Base.MapGeometry",this.map=a};a.prototype.getGeometryByGeoJson=function(a){var b=GeoJSON.read(a);return b},a.prototype.getGeometryByWKT=function(a){var b=WKT.read(a);return b},a.prototype.getFGeoJsonByGeometry=function(a){var b=GeoJSON.write(a,this.map);return b},a.prototype.getGGeoJsonByGeometry=function(a){var b=GeoJSON.write(a,this.map),c=JSON.parse(b),a=JSON.stringify(c.geometry);return a},a.prototype.getWKTByGeometry=function(a){var b=WKT.write(a,this.map);return b},a.prototype.getExtent2Polygon=function(a){var b=[];b.push(new NPMapLib.Geometry.Point(a.sw.lon,a.sw.lat)),b.push(new NPMapLib.Geometry.Point(a.ne.lon,a.sw.lat)),b.push(new NPMapLib.Geometry.Point(a.ne.lon,a.ne.lat)),b.push(new NPMapLib.Geometry.Point(a.sw.lon,a.ne.lat)),b.push(new NPMapLib.Geometry.Point(a.sw.lon,a.sw.lat));var c=new NPMapLib.Geometry.Polygon(b);return c},a.prototype.createMarker=function(a,b){markerType=b.markerType?b.markerType:MapPlatForm.ModdleMarker;var c=new NPMapLib.Symbols.Icon(b.url,new NPMapLib.Geometry.Size(b.size.width,b.size.height));markerType==MapPlatForm.ModdleMarker&&c.setAnchor(new NPMapLib.Geometry.Size(-b.size.width/2,-b.size.height/2)),markerType==MapPlatForm.CustomMarker&&c.setAnchor(new NPMapLib.Geometry.Size(-b.iconOffset.width,-b.iconOffset.height));var d=new NPMapLib.Symbols.Marker(a);if(d.setIcon(c),b.text){label=new NPMapLib.Symbols.Label(b.text),label.setStyle({Color:"#ffffff"}),b.labelOffset=b.labelOffset?b.labelOffset:{width:0,height:0};var e=new NPMapLib.Geometry.Size(b.labelOffset.width,b.labelOffset.height);label.setOffset(e),d.setLabel(label)}return d},a.prototype.getIconByParam=function(a){markerType=a.markerType?a.markerType:MapPlatForm.ModdleMarker;var b=new NPMapLib.Symbols.Icon(a.url,new NPMapLib.Geometry.Size(a.size.width,a.size.height));return markerType==MapPlatForm.ModdleMarker&&b.setAnchor(new NPMapLib.Geometry.Size(-a.size.width/2,-a.size.height/2)),markerType==MapPlatForm.CustomMarker&&b.setAnchor(new NPMapLib.Geometry.Size(-markerParam.iconOffset.width,-markerParam.iconOffset.height)),b},a.prototype.getExtentByOverlays=function(a){for(var b,c,d,e,f=a.length-1;f>=0;f--){var g=a[f].getExtent();b&&c&&d&&e?(b>g.left&&(b=g.left),c>g.bottom&&(c=g.bottom),d<g.right&&(d=g.right),e<g.top&&(e=g.top)):(b=g.left,c=g.bottom,d=g.right,e=g.top)}return new NPMapLib.Geometry.Extent(b,c,d,e)}}(),function(){var e=MapPlatForm.Base.MapService=function(a){this.CLASS_NAME="MapService",this._currentService=null,this.map=a,this.mapConfig=new MapPlatForm.Base.MapConfig,this.mapGeometry=new MapPlatForm.Base.MapGeometry(this.map),this.routeService=null};e.prototype.queryRoadByName=function(roadName,callBack){var url=this.mapConfig.dataServiceURL+"query/getRoadsByName",service=new NPMapLib.Services.QueryService(NPMapLib.MAPTYPE_NPGIS),params=new NPMapLib.Services.queryParams;params={roadName:roadName},this.queryRoadByNameService&&(this.queryRoadByNameService.abort(),this.queryRoadByNameService=null),this.queryRoadByNameService=service.query(url,params,function(result){for(var lines=[],i=result.length-1;i>=0;i--){var geometry=eval("("+result[i].feature+")"),line=GeoJSON.read(geometry);if(line instanceof Array)for(var j=line.length-1;j>=0;j--)line[j].data=result[i],lines.push(line[j]);else line.data=result[i],lines.push(line)}callBack instanceof Function&&callBack(lines)})},e.prototype.getGeometryBuffer=function(a,b,c){var d=this.mapConfig.dataServiceURL+"gis/buffer",e=new NPMapLib.Services.bufferParams;e.projection=this.map.getProjection(),e.distance=b,e.units="m",e.geometry=a;var f=new NPMapLib.Services.BufferService(this.map,NPMapLib.MAPTYPE_NPGIS);this.geometryBufferService&&(this.geometryBufferService.abort(),this.geometryBufferService=null),this.geometryBufferService=f.buffer(d,e,c)},e.prototype.queryPOIByName=function(name,callBack,maxResult,rowIndex){var url=this.mapConfig.dataServiceURL+"query/poiname",service=new NPMapLib.Services.QueryService(NPMapLib.MAPTYPE_NPGIS),params=new NPMapLib.Services.queryParams;params.keyWord=name,params.maxResult=maxResult,params.rowIndex=rowIndex,this.queryPOIByNameService&&(this.queryPOIByNameService.abort(),this.queryPOIByNameService=null),this.queryPOIByNameService=service.query(url,params,function(result){for(var points=[],i=0;i<result.features.length;i++){var geometry=eval("("+result.features[i].geometry+")");if("Point"===geometry.type||"point"===geometry.type){var point=new NPMapLib.Geometry.Point(geometry.coordinates[0],geometry.coordinates[1]);point.data=result.features[i],points.push(point)}}callBack instanceof Function&&callBack(points,result)})},e.prototype.queryPOIByCoord=function(point,callBack){var url=this.mapConfig.dataServiceURL+"query/poicoord",service=new NPMapLib.Services.QueryService(NPMapLib.MAPTYPE_NPGIS),params=new NPMapLib.Services.queryParams;params={coord:point.lon+","+point.lat},this.queryPOIByCoordService&&(this.queryPOIByCoordService.abort(),this.queryPOIByCoordService=null),this.queryPOIByCoordService=service.query(url,params,function(result){var point;if(result&&result.geometry){var geometry=eval("("+result.geometry+")");("Point"===geometry.type||"point"===geometry.type)&&(point=new NPMapLib.Geometry.Point(geometry.coordinates[0],geometry.coordinates[1]),point.data=result)}callBack instanceof Function&&callBack(point)})},e.prototype.addPOI=function(a,b){var c=this.mapConfig.dataServiceURL+"query/addPoi",d=new NPMapLib.Services.QueryService(NPMapLib.MAPTYPE_NPGIS),e=new NPMapLib.Services.queryParams;e={name:a.data.name,poiType:a.data.type,address:a.data.address,x:a.lon,y:a.lat},this.addPOIService&&(this.addPOIService.abort(),this.addPOIService=null),this.addPOIService=d.updata(c,e,function(c){c?(a.data=c,b instanceof Function&&b(a)):b instanceof Function&&b(null)})},e.prototype.updataPOI=function(a,b){var c=this.mapConfig.dataServiceURL+"query/updataPoi",d=new NPMapLib.Services.QueryService(NPMapLib.MAPTYPE_NPGIS),e=new NPMapLib.Services.queryParams;e={gid:a.data.gid,name:a.data.name,poiType:a.data.type,address:a.data.address,x:a.lon,y:a.lat},this.updataPOIService&&(this.updataPOIService.abort(),this.updataPOIService=null),this.updataPOIService=d.updata(c,e,function(c){c?(a.data=c,b instanceof Function&&b(a)):b instanceof Function&&b(null)})},e.prototype.queryPOIByGeometry=function(geometry,callBack,maxResult,rowIndex){var url=this.mapConfig.dataServiceURL+"query/searchInBounds",wktGeo=this.mapGeometry.getWKTByGeometry(geometry),service=new NPMapLib.Services.QueryService(NPMapLib.MAPTYPE_NPGIS),params=new NPMapLib.Services.queryParams;params.wkt=wktGeo,params.maxResult=maxResult,params.rowIndex=rowIndex,this.queryPOIByGeometryService&&(this.queryPOIByGeometryService.abort(),this.queryPOIByGeometryService=null),this.queryPOIByGeometryService=service.query(url,params,function(result){for(var points=[],i=0;i<result.data.length;i++){var geometry=eval("("+result.data[i].geometry+")");if("Point"===geometry.type||"point"===geometry.type){var point=new NPMapLib.Geometry.Point(geometry.coordinates[0],geometry.coordinates[1]);point.data=result.data[i],points.push(point)}}callBack instanceof Function&&callBack(points,result.pageCount,result.totalCount)})},e.prototype.queryPOIByFilter=function(filter,callBack,maxResult,rowIndex){var url=this.mapConfig.dataServiceURL+"query/poiname",service=new NPMapLib.Services.QueryService(NPMapLib.MAPTYPE_NPGIS),params=new NPMapLib.Services.queryParams;params.maxResult=maxResult,params.rowIndex=rowIndex;var fs=filter.split("=");params.type=fs[0],params.keyWord=fs[1],this.queryPOIByFilterService&&(this.queryPOIByFilterService.abort(),this.queryPOIByFilterService=null),this.queryPOIByFilterService=service.query(url,params,function(result){for(var points=[],i=0;i<result.features.length;i++){var geometry=eval("("+result.features[i].geometry+")");if("Point"===geometry.type||"point"===geometry.type){var point=new NPMapLib.Geometry.Point(geometry.coordinates[0],geometry.coordinates[1]);point.data=result.features[i],points.push(point)}}callBack instanceof Function&&callBack(points,result.pageCount,result.totalCount)})},e.prototype.queryPOIByGeometryAndFilter=function(geometry,filter,callBack,maxResult,rowIndex){var url=this.mapConfig.dataServiceURL+"query/searchInBounds",wktGeo=this.mapGeometry.getWKTByGeometry(geometry),service=new NPMapLib.Services.QueryService(NPMapLib.MAPTYPE_NPGIS),params=new NPMapLib.Services.queryParams;params.wkt=wktGeo,params.maxResult=maxResult,params.rowIndex=rowIndex;var fs=filter.split("=");params.type=fs[0],params.keyWord=fs[1],this.queryPOIByGeometryAndFilterService&&(this.queryPOIByGeometryAndFilterService.abort(),this.queryPOIByGeometryAndFilterService=null),this.queryPOIByGeometryAndFilterService=service.query(url,params,function(result){for(var points=[],i=0;i<result.data.length;i++){var geometry=eval("("+result.data[i].geometry+")");if("Point"===geometry.type||"point"===geometry.type){var point=new NPMapLib.Geometry.Point(geometry.coordinates[0],geometry.coordinates[1]);point.data=result.data[i],points.push(point)}}callBack instanceof Function&&callBack(points,result.pageCount,result.totalCount)})},e.prototype.queryRoadCrossByName=function(a,b){var c=this.mapConfig.dataServiceURL+"query/getRoadCrossByName",d=new NPMapLib.Services.QueryService(NPMapLib.MAPTYPE_NPGIS),e=new NPMapLib.Services.queryParams;e.roadName=a,this.queryRoadCrossByNameService&&(this.queryRoadCrossByNameService.abort(),this.queryRoadCrossByNameService=null),this.queryRoadCrossByNameService=d.query(c,e,function(a){for(var c=[],d=0;d<a.length;d++){var e=new NPMapLib.Geometry.Point(a[d].lon,a[d].lat);e.data=a[d],c.push(e)}b instanceof Function&&b(c)})},e.prototype.queryRoadCrossByGeometry=function(a,b){var c=this.mapGeometry.getWKTByGeometry(a),d=this.mapConfig.dataServiceURL+"query/searchRoadCrossInBounds",e=new NPMapLib.Services.QueryService(NPMapLib.MAPTYPE_NPGIS),f=new NPMapLib.Services.queryParams;f.wkt=c,this.queryRoadCrossByGeometryService&&(this.queryRoadCrossByGeometryService.abort(),this.queryRoadCrossByGeometryService=null),this.queryRoadCrossByGeometryService=e.query(d,f,function(a){for(var c=[],d=0;d<a.data.length;d++){var e=new NPMapLib.Geometry.Point(a.data[d].lon,a.data[d].lat);e.data=a.data,c.push(e)}b instanceof Function&&b(c)})},e.prototype.addRoadCross=function(a){var b=this.mapConfig.dataServiceURL+"query/addRoadCross",c=new NPMapLib.Services.QueryService(NPMapLib.MAPTYPE_NPGIS),d=new NPMapLib.Services.queryParams;d={name:a.data.name,x:a.lon,y:a.lat},this.addRoadCrossService&&(this.addRoadCrossService.abort(),this.addRoadCrossService=null),this.addRoadCrossService=c.updata(b,d,function(a){var b;a?(b.data=a,callBack instanceof Function&&callBack(b)):callBack instanceof Function&&callBack(null)})},e.prototype.updataRoadCross=function(a){var b=this.mapConfig.dataServiceURL+"query/updataRoadCross",c=new NPMapLib.Services.QueryService(NPMapLib.MAPTYPE_NPGIS),d=new NPMapLib.Services.queryParams;d={gid:a.data.gid,name:a.data.name,x:a.lon,y:a.lat},this._updataRoadCrossService&&(this._updataRoadCrossService.abort(),this._updataRoadCrossService=null),this._updataRoadCrossService=c.updata(b,d,function(a){var b;a?(b.data=a,callBack instanceof Function&&callBack(b)):callBack instanceof Function&&callBack(null)})},e.prototype.searchRouteByCoor=function(a,b){var c=new NPMapLib.Services.RouteService(this.map,7),d=new NPMapLib.Services.routeParams;d.service="na",d.request="getroute",d.networkName="shanghai_roadnet_supermap",d.startStop=a.startStop,d.endStop=a.endStop,d.trafficModel=a.trafficModel,d.planRoadType=a.planRoadType,d.geoBarriers=[],d.algorithm="Dijkstra",this.routeService&&(this.routeService.abort(),this.routeService=null),this.routeService&&(this.routeService.abort(),this.routeService=null),this.routeService=c.route(this.mapConfig.dataServiceURL+"/gis/na",d,b)},e.prototype.cancelService=function(){this.queryPOIByFilterService&&(this.queryPOIByFilterService.abort(),this.queryPOIByFilterService=null),this.addRoadCrossService&&(this.addRoadCrossService.abort(),this.addRoadCrossService=null),this.queryPOIByGeometryService&&(this.queryPOIByGeometryService.abort(),this.queryPOIByGeometryService=null),this.updataPOIService&&(this.updataPOIService.abort(),this.updataPOIService=null),this._updataRoadCrossService&&(this._updataRoadCrossService.abort(),this._updataRoadCrossService=null),this.addPOIService&&(this.addPOIService.abort(),this.addPOIService=null),this.queryRoadByNameService&&(this.queryRoadByNameService.abort(),this.queryRoadByNameService=null),this.queryRoadCrossByGeometryService&&(this.queryRoadCrossByGeometryService.abort(),this.queryRoadCrossByGeometryService=null),this.queryPOIByGeometryAndFilterService&&(this.queryPOIByGeometryAndFilterService.abort(),this.queryPOIByGeometryAndFilterService=null),this.queryRoadCrossByNameService&&(this.queryRoadCrossByNameService.abort(),this.queryRoadCrossByNameService=null)}}(),function(){var a=MapPlatForm.Base.MapTag=function(a,b){this.CLASS_NAME="MapTag",this.layer=b,this.map=a,this._activeMarker,this.callback=null,this._mapGeometry=new MapPlatForm.Base.MapGeometry(a),this.markerParam=null,this.layer||(this.layer=this.map.getDefaultLayer()),self=this};a.prototype._clickCallBack=function(){var a=self._mapGeometry.createMarker(self._activeMarker.getPosition(),self.markerParam);self.layer.addOverlay(a),a.enableEditing(),self.delAdrawMarker(),self.callback&&self.callback instanceof Function&&self.callback(a)},a.prototype.adrawMarker=function(a,b){this.markerParam=a,this.delAdrawMarker(),this.callback=b,this.layer.removeOverlay(this._activeMarker),this._activeMarker=null,this.map.activateMouseContext("点击添加标注,右键取消"),self=this;var c=this.map.getMouseContextStyle();c.height="20px",this.map.addEventListener(NPMapLib.MAP_EVENT_MOUSE_MOVE,function(a){self._activeMarker?self._activeMarker.setPosition(a):(self._activeMarker=self._mapGeometry.createMarker(a,self.markerParam),self.layer.addOverlay(self._activeMarker),self._activeMarker.addEventListener("click",self._clickCallBack))}),this.map.addEventListener(NPMapLib.MAP_EVENT_RIGHT_CLICK,function(){self._activeMarker&&self.delAdrawMarker()}),this.map.addEventListener(NPMapLib.MAP_EVENT_CLICK,self._clickCallBack),this.map.getContainer().onmouseenter=function(){self._activeMarker&&self._activeMarker.show()},this.map.getContainer().onmouseleave=function(){self._activeMarker&&self._activeMarker.hide()}},a.prototype.delAdrawMarker=function(){this.map&&(this.layer.removeOverlay(this._activeMarker),this.map.deactivateMouseContext(),this.map.removeEventListener(NPMapLib.MAP_EVENT_CLICK),this.map.removeEventListener(NPMapLib.MAP_EVENT_MOUSE_OVER),this.map.removeEventListener(NPMapLib.MAP_EVENT_MOUSE_OUT),this.map.removeEventListener(NPMapLib.MAP_EVENT_MOUSE_MOVE))}}(),function(){var a=MapPlatForm.Base.MapTools=function(a){this.CLASS_NAME="MapTools",this.map=a,this.measureTool=null,this.drawTool=null,this.searchCircle=null,this.editMarker=null};a.prototype._initMeasureTool=function(){this.measureTool=new NPMapLib.Tools.MeasureTool(this.map.id,{lengthUnit:NPMapLib.MAP_UNITS_METERS,areaUnit:NPMapLib.MAP_UNITS_SQUARE_KILOMETERS,mode:NPMapLib.MEASURE_MODE_DISTANCE})},a.prototype._initDrawTool=function(){this.drawTool=new NPMapLib.Tools.DrawingTool(this.map.id),this.map.MapTools=this},a.prototype.measureDistance=function(){this.measureTool||this._initMeasureTool(),this.cancelMeasure(),this.cancelDraw(),this.measureTool.startUp(),this.measureTool.setMode(NPMapLib.MEASURE_MODE_DISTANCE)},a.prototype.measureArea=function(){this.measureTool||this._initMeasureTool(),this.cancelMeasure(),this.cancelDraw(),this.measureTool.startUp(),this.measureTool.setMode(NPMapLib.MEASURE_MODE_AREA)},a.prototype.cancelMeasure=function(){if(this.measureTool)try{this.measureTool.stop(),this.measureTool.cancel()}catch(a){this.measureTool.cancel()}},a.prototype.cancelDraw=function(){this.drawTool&&this.drawTool.cancel()},a.prototype.drawLine=function(a){this.drawTool||this._initDrawTool(),this.cancelMeasure(),this.cancelDraw(),this.drawTool.startUp(a),this.drawTool.setMode(NPMapLib.DRAW_MODE_POLYLINE,a,{cursor:"crosshair"})},a.prototype.drawRectangle=function(a){this.drawTool||this._initDrawTool(),this.cancelMeasure(),this.cancelDraw(),this.drawTool.startUp(a),this.drawTool.setMode(NPMapLib.DRAW_MODE_RECT,a,{cursor:"crosshair"})},a.prototype.drawCircle=function(a){this.drawTool||this._initDrawTool(),this.cancelMeasure(),this.cancelDraw(),this.drawTool.startUp(a),this.drawTool.setMode(NPMapLib.DRAW_MODE_CIRCLE,a,{cursor:"crosshair"})},a.prototype.drawPolygon=function(a){this.drawTool||this._initDrawTool(),this.cancelMeasure(),this.cancelDraw(),this.drawTool.startUp(a),this.drawTool.setMode(NPMapLib.DRAW_MODE_POLYLGON,a,{cursor:"crosshair"})},a.prototype.addCircleSearchControl=function(a,b,c,d){var e=this,f=1e3;c?f=c:c=500,d||(d=5e3);var g=b;this.searchCircle=new NPMapLib.Geometry.Circle(a,f,{color:"#acb9d1",fillColor:"#6980bc",weight:2,opacity:1,fillOpacity:.2});var h=this.map.getDefaultLayer();h.addOverlay(this.searchCircle);var i=new NPMapLib.Geometry.Size(76,24),j=OpenLayers.Util.getImageLocation("editCircle.png"),k=new NPMapLib.Symbols.Icon(j,i);this.editMarker=new NPMapLib.Symbols.Marker(a),this.editMarker.setIcon(k),this.editMarker.setOffset(new NPMapLib.Geometry.Size(20,0));var l=new NPMapLib.Symbols.Label(f+"米",{offset:new NPMapLib.Geometry.Size(15,9)});l.setStyle({fontSize:12,fontFamily:"宋体",align:"left"}),this.editMarker.setLabel(l);var m=this.searchCircle.getCenter();m.lon=m.lon+(new NPMapLib.GisToolKit).getDistanceByProjection(f,this.map),this.editMarker.setPosition(m),this.map.enableEditing(),this.editMarker.enableEditing(),this.editMarker.isEnableEdit=!0,h.addOverlay(this.editMarker),this.editMarker.addEventListener("featuremousedown",function(){n=!0,o=!0});var n=!1,o=!1,p=!1;this.editMarker.addEventListener("mouseover",function(){p||(e.map.enableEditing(),p=!0),o=!0}),this.editMarker.addEventListener("mouseout",function(){n||p&&(e.map.disableEditing(),p=!1),o=!1}),this.editMarker.addEventListener("draging",function(a){var b=e.searchCircle.getCenter(),f=a.getPosition().lon-e.searchCircle.getCenter().lon;f=(new NPMapLib.GisToolKit).getPlatDistanceByProjection(f,e.map),c>f?(b.lon=b.lon+(new NPMapLib.GisToolKit).getDistanceByProjection(c,e.map),f=c):f>d?(b.lon=b.lon+(new NPMapLib.GisToolKit).getDistanceByProjection(d,e.map),f=d):b.lon=a.getPosition().lon;var g=a.getLabel();g.setContent(Math.round(f)+"米"),a.setLabel(g),e.searchCircle.setRadius(f),e.searchCircle.refresh(),a.setPosition(b),a.refresh()}),this.editMarker.addEventListener("dragend",function(){o||p&&(e.map.disableEditing(),p=!1),g&&g instanceof Function&&g(e.searchCircle);var a=e.searchCircle.getExtent();e.map.zoomToExtent(a),n=!1}),this.map.disableEditing();var q=e.searchCircle.getExtent();this.map.zoomToExtent(q),g&&g instanceof Function&&g(e.searchCircle)},a.prototype.removeCircleSearchControl=function(){this.editMarker&&(this.editMarker.removeEventListener("dragend"),this.editMarker.removeEventListener("draging"),this.editMarker.removeEventListener("mouseout"),this.editMarker.removeEventListener("mouseover"),this.editMarker.removeEventListener("featuremousedown"));var a=this.map.getDefaultLayer();a.removeOverlay(this.editMarker),a.removeOverlay(this.searchCircle),this.map.disableEditing()}}();
/*global NPMapLib:true*/
/**
 * Created by Zhangyu on 2014/12/18.
 * 全局搜索公共函数
 */
define([
	"js/npmap-new/mapsearch-variable",
	"js/npmap-new/map-variable",
	"js/npmap-new/map-const",
	"js/npmap-new/map-common",
	"jquery",
	"pubsub",
	"base.self"
], function(_g, mapVariable, MapConst, mapCommonFun, jQuery, PubSub){
	/**
	 * 全局搜索结果的数据格式化
	 * @type {{CompressRouteData: CompressRouteData, CheckMapData: CheckMapData, parseGpsExtraData: parseGpsExtraData, extendData: extendData}}
	 */
	var formatData = (function($) {

		/**
		 * 解析gps额外的数据  额外数据都放在value字段中了   "value":"speed:72.33503270750184,direction:98.77846291505877,carType:1"
		 * @param obj - 待解析的gps数组对象
		 */
		var _parseGpsExtraData = function (obj) {
			if (!obj.value) {
				return;
			}
			var arr = obj.value.split(",");
			for (var i = arr.length - 1; i >= 0; i--) {
				var tem = arr[i].split(":");
				obj[tem[0]] = tem[1];
			}
		};

		return {
			/**
			 * 对路网数据片段进行压缩合并，主要是对其feature.geometry.paths字段进行合并
			 * @param list - 待压缩的路网数据
			 * @returns {Array} - 返回压缩过滤后的数据
			 */
			compressRouteData: function (list) {
				var resultList = [], tempData = null;
				//第一步：对list数据根据value值进行排序
				list.sort(function (a, b) {
					if (a.value > b.value) {
						return 1;
					} else {
						return -1;
					}
				});
				if (list.length <= 0) {
					return [];
				}
				if (list.length > 1) {
					tempData = list[0];
					//第二步：对排序后的list进行合并操作
					for (var i = 1, length = list.length; i < length; i++) {
						//只对线型对象考虑
						if (tempData.feature.featureType === "NPMapLib.Geometry.Polyline") {
							if (list[i].value === tempData.value) {
								//合并
								$.each(list[i].feature.geometry, function () {
									tempData.feature.geometry.push(this);
								});
							} else {
								//将之前的tempdata添加到结果数组中
								resultList.push(tempData);
								//填充新的tempdata
								tempData = list[i];
							}
						}
					}
					//添加最后一个tempdata
					resultList.push(tempData);
				}
				return resultList;
			},

			/**
			 * 对map上兴趣点的数据进行筛选，如果不是点，则忽略
			 * @param list - 待过滤的兴趣点数据
			 * @returns {Array} - 过滤后的兴趣点数据
			 */
			checkMapData: function (list) {
				var resultList = [];
				for (var i = 0, length = list.length; i < length; i++) {
					//只对点对象进行考虑(且有地址的)
					if (list[i].feature.featureType === "NPMapLib.Geometry.Point" && $.trim(list[i].feature.attributes.R_ADDR) !== "") {
						//将之添加到结果数组中
						resultList.push(list[i]);
					}
				}
				return resultList;
			},

			/**
			 * 对灯杆、gps、350M、周围报警信息alarm数据进行扩展，便于在地图上展示
			 * @param list - 待扩展的搜索数据
			 * @param type - 数据类型
			 * @returns {*} - 扩展后的搜索数据
			 */
			extendData: function (list, type) {
				var x = "", y = "";
				for (var i = 0, length = list.length; i < length; i++) {
					list[i].feature = {};
					list[i].feature.geometry = {};
					if (type === "lightbar") {
						x = list[i].longitude;
						y = list[i].latitude;
					}
					if (type === "alarm") {
						x = list[i].longitude;
						y = list[i].latitude;
					} else if (type === "gps") {
						x = list[i].lon;
						y = list[i].lat;
						list[i].key = list[i].key || list[i].gpsId;
						if(list[i].time){
							list[i].time = Toolkit.mills2datetime(list[i].time);	
						}
						list[i].gpsName = list[i].gpsName || list[i].key;
						_parseGpsExtraData(list[i]);

					} else if (type === "350M") {
						x = list[i].lon;
						y = list[i].lat;
						if(list[i].time){
							list[i].time = Toolkit.mills2datetime(list[i].time);	
						}
						_parseGpsExtraData(list[i]);
					} else if (type === "bayonet") {
						x = list[i].x;
						y = list[i].y;
					}
					list[i].feature.geometry.x = x;
					list[i].feature.geometry.y = y;
				}
				return list;
			}
		};
	}(jQuery));

	return {
		/**
		 * 重新包装搜索结果
		 * @param list - 待包装的搜索结果列表
		 * @param type - 包装的场景类型
		 * @param typeName - 数据类型
		 * @param subTypeName - 数据来源类型
		 * @returns {*} - 包装后的数据
		 */
		formatResultData: function (list, type, typeName, subTypeName) {

			if (type === 0) {
				//翻页的时候进行对切割后的数组进行属性包装
				var markFlag = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
				jQuery.each(list, function (index) {
					jQuery.extend(this, {
						num: markFlag[index], //添加一个num属性，对分页结果进行编码，以方便撒点功能的实现
						index: index
					});
				});
			} else {
				if (typeName === "route") {
					//对路网数据进行压缩,并过滤掉不是线的对象
					list = formatData.compressRouteData(list);
				} else if (typeName === "map") {
					//对地图数据进行过滤，过滤掉不是点的对象(如果调用的是从数据库中取的接口，则不需要对数据进行过滤)
					if (_g.searchInfoConfig.map.useMapServer) {
						list = formatData.checkMapData(list);
					}
				} else if (typeName === "lightbar" || typeName === "gps" || typeName === "350M" || typeName === "alarm" || typeName === "bayonet") {
					//对搜索出的数据进行过滤，如果不需要，则忽略
					list = formatData.extendData(list, typeName);
				}
				//搜索结果时扩展类别属性
				jQuery.each(list, function (index) {
					jQuery.extend(this, {
						type: typeName, //搜索结果出来后，根据结果类型扩展类别
						subType: subTypeName, //global:标记是从全局搜索来的，range:标记是从视野范围内来的，around:标记是从周围资源搜索来的, area:从各行政区来的,resource:从地图工具栏资源入口来的
						isMap: (typeName === "map"), //此处扩展用来区别不同类型的需要展现在左侧树上的信息
						isRoute: (typeName === "route"),
						isLightBar: (typeName === "lightbar"),
						isGps: (typeName === "gps"),
						is350M: (typeName === "350M"),
						isAlarm: (typeName === "alarm"),
						isBayonet: (typeName === "bayonet"),
						pos: index //用来当用户点击了左侧的搜索列表，获取该对象在搜索结果中的位置，以备获取该对象（路网数据点击左侧时用）
					});
				});
			}

			return list;
		},
		/**
		 * 周围搜索时显示中心点图标
		 */
		markCircleCenter: function(){
			//显示中心点图层
			mapVariable.layers.SearchCenterLayer.removeAllOverlays();
			mapVariable.layers.SearchCenterLayer.show();
			//显示中心点
			if(mapVariable.GlobalSearch.searchCircle && mapVariable.currentCameraData) {
				//中心点
				var center = mapVariable.GlobalSearch.searchCircle.getCenter();
				//标注
				var marker = new NPMapLib.Symbols.Marker(center);
				//设置图标
				marker.setIcon(MapConst.symbol.searchCenterSymbol());
				//记录摄像机信息
				marker.setData(mapVariable.currentCameraData);
				//添加该覆盖物
				mapVariable.layers.SearchCenterLayer.addOverlay(marker);
				mapVariable.layers.SearchCenterLayer.setZIndex(600);
				//添加鼠标点击事件
				marker.addEventListener(NPMapLib.MARKER_EVENT_CLICK, function(mark) {
					var pos = {
						longitude: mark.getData().longitude || mark.getData().lon || mark.getData().feature.geometry.x,
						latitude: mark.getData().latitude || mark.getData().lat || mark.getData().feature.geometry.y
					}
					//如果当前摄像机点位已经被选中，则不再进行图标刷新
					if (pos.longitude === mapVariable.lastClickData.longitude && pos.latitude === mapVariable.lastClickData.latitude) {
						//如果信息窗存在，则显示
						if(window.infowindow.checkInfoWindowExists()){
							window.infowindow.show();
						}
						return;
					}
					//设置当前活动摄像机标注
					mapVariable.currentCameraData = mark.getData();
					//显示摄像机信息窗口
					if (mark.getData().subType) {
						PubSub.publishSync("showInfoWindowOnMap1", {
							data: mark.getData(),
							sence: "",
							fn: function () {
								//设置当前活动摄像机标注
								mapVariable.currentCameraMarker = mark;
							}
						});
					} else {
						mapCommonFun.showCameraInfoAndPlay(mark);
					}
				});
			}
		},
		/**
		 * 清除掉中心点数据（如果结果中存在中心点数据，则需要清除）
		 * @param data - 待对比的搜索数据
		 * @returns {boolean} - 返回是否清除了中心点
		 */
		clearSearchCenterData: function(data) {
			var result = false;
			if(mapVariable.GlobalSearch.searchCircle) {
				var centerPoint = mapVariable.GlobalSearch.searchCircle.getCenter();
				for (var i = 0, len = data.length; i < len; i++) {
					var temp = data[i], pos = {
						longitude: temp.longitude || temp.feature.geometry.x,
						latitude: temp.latitude || temp.feature.geometry.y
					}
					if (parseFloat(pos.longitude) === centerPoint.lon && parseFloat(pos.latitude) === centerPoint.lat) {
						//在坐标相同的情况下，如果中心点为摄像机，而搜索的为报警，则也不需要删除
						if(!(!mapVariable.currentCameraMarker.getData().type && _g.curDataType === "alarm")) {
							//删除掉中心点元素
							data.splice(i, 1);
							result = true;
							break;
						}
					}
				}
				//重新赋值顺序标示
				var markFlag = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
				jQuery.each(data, function (index) {
					//重写/扩展一下两个属性
					jQuery.extend(this, {
						num: markFlag[index],
						index: index
					});
				});
			}
			return result;
		},
		/**
		 * 判断点位是否是周围搜索的中心点
		 * @param marker - 待对比的数据
		 * @returns {boolean}
		 */
		checkPointIsCircleCenter: function(marker) {
			return (marker.getIcon && marker.getIcon().getImageUrl && marker.getIcon().getImageUrl().indexOf("map-search-center.png") >= 0)
		},
		/**
		 * 清除当前选中点位的图标
		 * @param marker - 待分析的地图点位标注
		 * 信息窗关闭时，触发新的圈圈查询时
		 */
		clearActiveSymbol: function(marker) {
			if (marker) {
				//如果存在子类型，且不为资源类型，才进行图标刷新
				if (marker.getData().subType) {
					//如果是中心点，则不再刷新
					if (this.checkPointIsCircleCenter(marker)) {
						return;
					}
					if (marker.getData().subType !== "resource") {
						//非资源类型，可能是周围索索，也可能是视野范围内搜索
						var markerInfo = this.getSymbolByDataType(marker.getData().type, false, "handle");
						//修改图标样式
						marker.setIcon(markerInfo.symbol);
						marker.getLabel().setOffset(markerInfo.labelOffset);
						marker.refresh();
					} else {
						if (marker.getData().type === "tempmarker" || (marker.getIcon && marker.getIcon().getImageUrl().indexOf("map-marker.png") >= 0)) {
							//左侧树资源定位，关闭信息窗时直接删除图标(临时图标)
							mapVariable.layers.resourceShowLayer.removeAllOverlays();
							mapVariable.layers.resourceShowLayer.hide();
						} else if (marker.getData().type !== "other") {
							//资源类型的卡口、灯杆、警员、警力
							if(marker.getData().type !== "bayonet") {
								var markerInfo = this.getSymbolByDataType(marker.getData().type, false, "res");
								//修改图标样式
								var style = {
									externalGraphic: MapConst.mapIcon[marker.getData().type].res["small"].img,
									graphicWidth: MapConst.mapIcon[marker.getData().type].res["small"].size.width,
									graphicHeight: MapConst.mapIcon[marker.getData().type].res["small"].size.height
								}
								marker.changeStyle(style, true);
							} else {
								//卡口资源不需要还原
							}
						} else {
							/**
							 * 1、警卫路线左侧摄像机列表点击播放
							 */
						}
					}
				}
				//摄像机资源时的处理
				if (!marker.getData().subType) {
					if (marker.CLASS_NAME && marker.CLASS_NAME === "NPMapLib.Symbols.Marker") {
						//如果是中心点，则不再刷新
						if (this.checkPointIsCircleCenter(marker)) {
							return;
						}
						//框选、圈选、周围搜索摄像机、视野范围内摄像机
						//左侧树点击事件，图标地址为空，且没有文字标注
						(marker.getIcon().getImageUrl() !== "") && marker.setIcon(MapConst.symbol.normalCameraSymbol());
						marker.getLabel() && marker.getLabel().setOffset(new NPMapLib.Geometry.Size(1, 9));
						marker.refresh();
					} else {
						//聚合图层点位，类型为clustermarker
						var data = marker.getData() || marker.location;
						var type = data.cameraType, isonline = data.isOnline, hdsdType = data.hdsdType, imgURL = "";
						if (type) {
							if (isonline === 0) {
								if (hdsdType) imgURL = MapConst.mapIcon.camera.res["1010"]; else imgURL = MapConst.mapIcon.camera.res["1000"];
							}
							if (isonline === 1 || isonline === null) {
								if (hdsdType) imgURL = MapConst.mapIcon.camera.res["1110"]; else imgURL = MapConst.mapIcon.camera.res["1100"];
							}
						} else {
							if (isonline === 0) {
								if (hdsdType) imgURL = MapConst.mapIcon.camera.res["0010"]; else imgURL = MapConst.mapIcon.camera.res["0000"];
							}
							if (isonline === 1 || isonline === null) {
								if (hdsdType) imgURL = MapConst.mapIcon.camera.res["0110"]; else imgURL = MapConst.mapIcon.camera.res["0100"];
							}
						}

						var style = {
							externalGraphic: imgURL,
							graphicWidth: MapConst.mapIcon.camera.res["smallSize"].width,
							graphicHeight: MapConst.mapIcon.camera.res["smallSize"].height
						}
						marker.changeStyle(style, true);
					}
				}
			}
		},
		/**
		 * 点击搜索附近资源时，清空之前的圈圈等覆盖物
		 * @param tag - 标记来源，0是全局搜索相关调用；1是警力调度、我的关注调用；2是视频监控等调用
		 */
		clearOnSearchAround: function(tag) {

			//清除掉当前的圈圈
			if (mapVariable.GlobalSearch.searchCircle) {
				mapVariable.map.removeOverlay(mapVariable.GlobalSearch.searchCircle);
				mapVariable.map.removeOverlay(mapVariable.GlobalSearch.searchTextBg);
			}
			if(tag === 0) {
				//隐藏我的关注、警力调度
				mapVariable.layers.myAttentionLayer.removeAllOverlays();
				mapVariable.layers.markerLayer.removeAllOverlays();
			}
		},

		/**
		 * 在地图上撒点、绘线、绘圈前，清空地图环境
		 */
		ClearMapOnResult: function() {
			//如果是资源显示，则不需要隐藏资源相关的图层
			if(_g.curDataFromTag !== "resource") {

			}
		},

		/**
		 * 根据不同的数据来源和类型，显示不同的图标
		 * @param type - 当前的数据类型
		 * @param isActive - 标记当前进行类型转换的状态，激活状态为true，普通状态为false
		 * @param tag - 标记是否需要进行类型转换，来源有：
		 * @returns {*}：返回需要的坐标对象
		 */
		getSymbolByDataType: function(type, isActive, tag) {

			var symbolImg = null,
				labelSize = null,
				filterType = type;
			//判断是否进行类型转换
			if (tag === "more" || tag === "handle" || tag === "search") {
				filterType = isActive ? "active" : "normal";
			}
			//如果是资源类型
			if(tag === "res") {
				if (isActive) {
					filterType = (type === "gps") ? "gps-active" : (type === "350M") ? "350m-active" : (type === "lightbar") ? "lightbar-active" : "active";
				}
			}
			//根据不同的类型获取不同的图标
			switch (filterType) {
				case "map":
					symbolImg = MapConst.symbol.mapPlaceSymbol();
					labelSize = new NPMapLib.Geometry.Size(-2, 12);
					break;
				case "lightbar":
					symbolImg = MapConst.symbol.lightbarSymbol();
					labelSize = new NPMapLib.Geometry.Size(-2, 12);
					break;
				case "gps":
					symbolImg = MapConst.symbol.gpsSymbol();
					labelSize = new NPMapLib.Geometry.Size(-2, 12);
					break;
				case "350M":
					symbolImg = MapConst.symbol.tfzMSymbol();
					labelSize = new NPMapLib.Geometry.Size(-2, 12);
					break;
				case "lightbar-active":
					symbolImg = MapConst.symbol.lightbarActiveSymbol();
					break;
				case "gps-active":
					symbolImg = MapConst.symbol.gpsActiveSymbol();
					break;
				case "350m-active":
					symbolImg = MapConst.symbol.tfzMActiveSymbol();
					break;
				case "active":
					symbolImg = MapConst.symbol.activeCameraSymbol();
					labelSize = new NPMapLib.Geometry.Size(0, 10);
					break;
				case "normal":
					symbolImg = MapConst.symbol.normalCameraSymbol();
					labelSize = new NPMapLib.Geometry.Size(0, 9);
					break;
				default:
					symbolImg = MapConst.symbol.normalCameraSymbol();
					labelSize = new NPMapLib.Geometry.Size(-2, 12);
					break;
			}
			return {
				symbol: symbolImg, //需要加载的图标对象
				labelOffset: labelSize //图标上文字的位置对象
			};
		}
	};
});
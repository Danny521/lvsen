/**
 * Created by Zhangyu on 2015/5/10.
 */
define([
	"js/sidebar/map-layer-control",
	"js/npmap-new/map-variable",
	"js/npmap-new/map-common",
	"jquery"
], function (MapLayerCtrl, Variable, MapCommonFun, jQuery) {

	return (function (scope, $) {

		var /*摄像机资源图层*/
			cameraLayer = [
				"Indoor",   //室内
				"HiShpomt", //制高点
				"Elevated", //高架
				"Water",    //水面
				"Ground"    //路面
			],
			/*资源图层*/
			resourceLayer = [
				"PVD-GATE-LAYER",           //pva卡口资源图层
				"lightbar-resource-layer",  //灯杆资源图层
				"police-resource-layer",    //警车资源图层
				"policeman-resource-layer"  //警员资源图层
			],
			/*业务图层*/
			businesslayer = [
				"guard-route-all",          //警卫路线分组页面逻辑图层，可展现多条警卫路线
				"route-layer",              //路网数据展现图层
				"guard-route-layer",        //新建/编辑警卫路线图层
				"defence-circle-layer",     //防空圈图层
				"my-attention-layer",       //我的关注图层
				"defenseline-layer",        //电子防线图层
				"marker-layer",             //警力调度图层
				"search-result-layer",      //地图框选、圈选、视野范围内搜索、附近搜索摄像机图层
				"gps-car",                  //警卫路线gps小车图层
				"alarm-info",               //地图报警点位图层
				"search-center-layer",      //附近搜索中心点图层
				"global-search-around-layer",//除摄像机外附近搜索展现图层
				"range-search-layer",        //除摄像机外视野范围内搜索展现图层
				"resource-show-layer",        //左侧资源定位显示图层
				"gps-control-layer",         //GPS监控图层
				"resource-gps-control-layer",  //GPS监控资源图层
				"route-analysis-layer",			//路径规划图层
				"resource-route-layer"			//路径规划资源图层
			],
			//进入全景时，隐藏的资源图层列表，方便在退出时显示
			_preShowResList = [],
			//周围搜索的数据类型
			_dataTypeInfo = {
				0: "camera",
				1: "alarm",
				2: "policecar",
				3: "policeman",
				4: "lightbar",
				5: "bayonet"
			};

		var /**
			 * 清除地图上圈圈搜索（附近搜索）相关覆盖物
			 * @private
			 */
			_hideBusinessCircle = function() {
				if (Variable.GlobalSearch.searchCircle) {
					Variable.map.removeOverlay(Variable.GlobalSearch.searchCircle);
					Variable.map.removeOverlay(Variable.GlobalSearch.searchTextBg);
				}
			},
			/**
			 * 获取当前资源图层的显示状态，如果没有勾选则不显示
			 * @param layer - 要显示的图层名字
			 * @param type - 图层类型
			 * @private
			 */
			_getResourceShowStatus = function(layer, type) {
				if (type === "cluster") {
					//摄像机资源图层
					return $(".camera-type-list").find(".list-item-camera[data-type='" + layer + "'] i.checkbox").hasClass("checked");
				} else if (type === "openLayer") {
					var resultArr = [];
					//非摄像机、非卡口图层
					for (var i = 0; i < layer.length; i++) {
						if (layer[i] === "PVD-GATE-LAYER") {
							($(".map-resource-list").find(".bayonet-resource i.checkbox").hasClass("checked")) ? resultArr.push(layer[i]) : "";
						} else if (layer[i] === "lightbar-resource-layer") {
							($(".map-resource-list").find(".lightbar-resource i.checkbox").hasClass("checked")) ? resultArr.push(layer[i]) : "";
						} else if (layer[i] === "police-resource-layer") {
							($(".map-resource-list").find(".policecar-resource i.checkbox").hasClass("checked")) ? resultArr.push(layer[i]) : "";
						} else {
							($(".map-resource-list").find(".policeman-resource i.checkbox").hasClass("checked")) ? resultArr.push(layer[i]) : "";
						}
					}
					return resultArr;
				} else {
					//卡口图层
					return $(".map-resource-list").find(".bayonet-resource i.checkbox").hasClass("checked");
				}
			},
			/**
			 * 显示资源图层
		     * @param flag - 是否显示，false影藏，true显示
			 * @param layer - 特定显示或者关闭的资源图层
			 * @private
			 */
			_showOrHideResourceLayers = function(flag, layer) {
				var operateLayers = layer || cameraLayer;
				//判断是显示还是隐藏
				var operaName = flag ? "show" : "hide";
				//显示摄像机资源资源图层
				for (var i = operateLayers.length - 1; i >= 0; i--) {
					//判断是否勾选，在显示的情况下如果没有勾选，则不显示
					if(!flag || _getResourceShowStatus(operateLayers[i], "cluster")) {
						try {
							Variable.resourceLayers.cluster.setMakrerTypeVisiable(operateLayers[i], flag);
						} catch (e) {}
					}
				}
				//显示除摄像机资源外的资源图层
				MapLayerCtrl[operaName](flag ? _getResourceShowStatus(resourceLayer, "openLayer") : resourceLayer);
				//由于上述方法不顶用，显示/隐藏卡口用下面的方式
				flag && _getResourceShowStatus("PVD-GATE-LAYER", "bayonet") ? window.gateController.showLayer() : window.gateController.hideLayer();
			},
			/**
			 * 清除图层上的覆盖物
			 * @param arr - 要清除的图层数组
			 * @private
			 */
			_clearLayer = function(arr) {
				arr.each(function(item) {
					var layer = window.map.getLayerByName(item);
					layer && layer.removeAllOverlays();
				});
			};
		/**
		 * 业务逻辑处理时，根据使用场景的不同，清除地图上响应的覆盖物，以达到业务流程清晰的目的
		 * @param sence - 使用场景
		 * @param fromFlag - 数据来源（视野范围内range,附近搜索around,如果是资源，则显示type）
		 */
		scope.showAndHideOverLayers = function (sence, fromFlag) {
			// 清除业务图层覆盖物
			var lbslayer = window.map.getLayerByName("pva-graphics");
			if (lbslayer) {
				lbslayer.removeAllOverlays();
			}

			switch (sence) {
			/**
			 * 清除地图上的所有业务覆盖物
			 * scence：
			 * 1、地图工具栏上的清除按钮
			 * 2、左侧“业务”板块，面包屑的首页按钮
			 * 3、左侧面板主tab的切换（资源、业务、收藏夹）
			 */
				case "map-business-clear":
					//隐藏业务图层
					MapLayerCtrl.hide(businesslayer);
					//清除图层覆盖物
					_clearLayer(businesslayer);
					//显示资源图层
					_showOrHideResourceLayers(true);
					//清除业务搜索圈圈
					_hideBusinessCircle();
					//清除信息窗
					window.infowindow && window.infowindow.closeInfoWindow();
					//隐藏分页
					// $(".pagination").empty();
					$(".pagination").hide();
					break;
			/**
			 * scence：
			 * 点击地图工具栏中“显示报警信息”按钮，显示报警信息
			 */
				case "click-map-toor-bar-show-alarm":
					//隐藏业务图层
					MapLayerCtrl.hide(businesslayer);
					//清除图层覆盖物
					_clearLayer(businesslayer);
					//清除业务搜索圈圈
					_hideBusinessCircle();
					//隐藏资源图层
					_showOrHideResourceLayers(false);
					//清除信息窗
					window.infowindow.closeInfoWindow();
					//显示报警业务图层
					MapLayerCtrl.show(["alarm-info"]);
					break;
			/**
			 * scence：
			 * 1、点击地图工具栏中“显示报警信息”按钮，隐藏报警信息
			 * 2、点击地图工具栏中“选择”、“圈选”、“框选”按钮（map-common.js）
			 * 3、点击地图工具栏，视野范围内搜索“分组摄像机”、“资源”、“输入搜素”按钮（map-common.js）
			 * 4、保存（新建/编辑）防空圈、保存（新建/编辑）警卫路线、保存（新建）电子防线
			 * 5、新建/编辑警卫路线、新建/编辑防空圈、新建电子防线时，回跳分组时的面包屑事件
			 */
				case "click-map-toor-bar-hide-alarm":
					//显示资源图层
					_showOrHideResourceLayers(true);
					//隐藏报警业务图层
					MapLayerCtrl.hide(["alarm-info"]);
					//清除图层覆盖物
					_clearLayer(["alarm-info"]);
					//清除信息窗
					window.infowindow.closeInfoWindow();
					break;
			/**
			 * scence：
			 * 显示视野范围内、附近搜索、框选/圈选摄像机结果显示时
			 */
				case "show-select-range-circle-camera-on-result":
					//隐藏业务图层
					MapLayerCtrl.hide(businesslayer);
					//清除图层上的东东
					_clearLayer(["search-result-layer"]);
					//根据数据来源显示响应的图层
					if (fromFlag === "around") {
						//显示结果图层
						MapLayerCtrl.show(["search-result-layer", "my-attention-layer", "marker-layer"]);
					} else {
						//显示结果图层
						MapLayerCtrl.show(["search-result-layer"]);
						//清除业务搜索圈圈
						_hideBusinessCircle();
						//清除信息窗
						window.infowindow.closeInfoWindow();
					}
					break;

			/**
			 * scence：
			 * 显示视野范围内、附近搜索非摄像机资源结果显示时
			 */
				case "show-range-circle-res-on-result":
					//隐藏业务图层
					MapLayerCtrl.hide(businesslayer);
					//根据数据来源显示响应的图层
					if (fromFlag === "around") {
						//清除图层上的东东
						_clearLayer(["global-search-around-layer"]);
						//显示附近结果图层
						MapLayerCtrl.show(["global-search-around-layer", "my-attention-layer", "marker-layer", "search-center-layer"]);
					} else if (fromFlag === "range") {
						//清除图层上的东东
						_clearLayer(["range-search-layer"]);
						//显示视野范围内结果图层
						MapLayerCtrl.show(["range-search-layer"]);
						//清除业务搜索圈圈
						_hideBusinessCircle();
						//清除信息窗
						window.infowindow.closeInfoWindow();
					} else {
						//资源
						if (fromFlag === "lightbar") {
							MapLayerCtrl.show(["lightbar-resource-layer"]);
						} else if (fromFlag === "gps") {
							MapLayerCtrl.show(["police-resource-layer"]);
						} else if (fromFlag === "350M") {
							MapLayerCtrl.show(["policeman-resource-layer"]);
						}
						//判断是否有中心点，有则显示
						if(Variable.GlobalSearch.searchCircle && Variable.currentCameraData) {
							MapLayerCtrl.show(["search-center-layer"]);
						}
					}
					break;
			/**
			 * scence：
			 * 警力调度点击时
			 */
				case "click-on-map-police-schedule":
					//显示警力调度和关注点图层
					MapLayerCtrl.show(["my-attention-layer", "marker-layer"]);
					break;

			/**
			 * scence：
			 * 隐藏地图资源图层（灯杆、警员、警车）
			 */
				case "click-on-map-res-hide":

					if (fromFlag === "lightbar") {
						//如果取消的是灯杆资源
						MapLayerCtrl.hide(["lightbar-resource-layer"]);
					} else if (fromFlag === "policecar") {
						//如果取消的是警车资源
						MapLayerCtrl.hide(["police-resource-layer"]);
					} else if (fromFlag === "policeman") {
						//如果取消的是警员资源
						MapLayerCtrl.hide(["policeman-resource-layer"]);
					}
					break;

			/**
			 * scence：
			 * 隐藏或者显示地图摄像机资源图层
			 */
				case "click-on-show-hide-camera-resource":
					if (fromFlag) {
						MapLayerCtrl.show(["cluster"]);
					} else {
						MapLayerCtrl.hide(["cluster"]);
					}
					break;

			/**
			 * scence：
			 * 全景追逃的进入和退出时，fromFlag为true进入，为false退出
			 */
				case "on-in-or-out-fullview":
					var $resourceList = $(".map-resource-list");
					//根据标记现实或者隐藏
					if (fromFlag) {
						//获取非摄像机资源dom列表
						var $resLayerListDom = $resourceList.children("li[data-type!='camera']");
						//清空列表
						_preShowResList.length = 0;
						//进入全景时（隐藏摄像机以外的其他资源图层）
						$resLayerListDom.each(function () {
							var $this = $(this);
							//如果勾选的则取消
							if ($this.find("i.checkbox").hasClass("checked")) {
								_preShowResList.push($this.data("type"));
								//隐藏触发
								$this.trigger("click", "need");
							}
						});
					} else {
						//退出全景时（显示之前隐藏的资源图层）
						_preShowResList.each(function (item) {
							$resourceList.children("li[data-type='" + item + "']").trigger("click");
						});
					}
					break;

			/**
			 * scence：
			 * 地图上框选/圈选时，只显示摄像机资源
			 */
				case "on-rect-or-circle-map-select":
					var $resourceList = $(".map-resource-list");
					//获取非摄像机资源dom列表
					var $resLayerListDom = $resourceList.children("li[data-type!='camera']");
					//进入全景时（隐藏摄像机以外的其他资源图层）
					$resLayerListDom.each(function () {
						var $this = $(this);
						//如果勾选的则取消
						if ($this.find("i.checkbox").hasClass("checked")) {
							//隐藏触发
							$this.trigger("click", "need");
						}
					});
					break;

			/**
			 * scence：
			 * 1、地图上附近搜索摄像机、卡口、灯杆、警力、报警时只显示对应的资源图层
			 * 2、地图上视野范围内搜索摄像机、卡口、灯杆、警力、报警时只显示对应的资源图层
			 */
				case "on-range-circle-map-select":
					var $resourceList = $(".map-resource-list");
					//获取非当前请求资源的dom列表
					var $resLayerListDom = $resourceList.children("li[data-type!='" + _dataTypeInfo[fromFlag] + "']");
					//进入全景时（隐藏摄像机以外的其他资源图层）
					$resLayerListDom.each(function () {
						var $this = $(this);
						//如果勾选的则取消
						if ($this.children("i.checkbox").hasClass("checked")) {
							//隐藏触发
							$this.trigger("click", "need");
						} else {
							//判断是否是摄像机，如果是则遍历其下类型
							if($this.data("type") === "camera") {
								$this.find(".camera-type-list li").each(function(){
									var $subTypeDom = $(this);
									//如果勾选的则取消
									if ($subTypeDom.find("i.checkbox").hasClass("checked")) {
										//隐藏触发
										$subTypeDom.trigger("click", "need");
									}
								});
							}
						}
					});
					break;

			/**
			 * scence：
			 * 1、“route-detail”，显示警卫路线时隐藏资源图层，只显示警卫路线相关图层
			 * 2、“route-search”，搜索警卫路线时，显示资源
			 * 3、“check-none”, 取消完勾选的警卫路线时，显示资源
			 * 4、“new-route”，新建警卫路线的时候
			 * 5、“edit-route”，编辑警卫路线的时候
			 * 6、“on-draw”,触发绘制警卫路线时
			 * 7、“on-draw-end”，警卫路线绘制结束回调时
			 * 8、“on-right-end”，右键取消警卫路线绘制时
			 * 9、“on-rect-select”，框选摄像机时，显示资源图层
			 * 10、“on-rect-select-end”，框选摄像机结束，隐藏资源图层
			 * 11、“on-right-select-end”，框选摄像机右键结束，隐藏资源图层
			 */
				case "on-show-guard-route-info":
					//显示警卫路线编辑/新建图层
					!(window.map.getLayerByName("guard-route-layer").getVisible()) && MapLayerCtrl.show(["guard-route-layer"]);
					//显示警卫路线显示图层
					!(window.map.getLayerByName("guard-route-all").getVisible()) && MapLayerCtrl.show(["guard-route-all"]);
					//根据场景切换图层
					if (fromFlag === "route-detail") {
						//隐藏资源图层
						_showOrHideResourceLayers(false);
						//清除业务图层
						_clearLayer(["guard-route-layer"]);
					} else if (fromFlag === "route-search" || fromFlag === "check-none" || fromFlag === "new-route") {
						//显示资源图层
						_showOrHideResourceLayers(true);
						//清除业务图层
						_clearLayer(["guard-route-layer", "guard-route-all"]);
					} else if(fromFlag === "edit-route"){
						//编辑警卫路线
						_clearLayer(["guard-route-layer", "guard-route-all"]);
					} else if(fromFlag === "on-draw" || fromFlag === "on-rect-select") {
						//警卫路线绘制开始，显示资源图层
						_showOrHideResourceLayers(true);
					} else if(fromFlag === "on-draw-end") {
						//清除已有的警卫路线信息
						_clearLayer(["guard-route-layer"]);
						//警卫路线绘制结束，隐藏资源图层
						_showOrHideResourceLayers(false);
					} else if(fromFlag === "on-right-end") {
						//右键退出，警卫路线绘制结束，隐藏资源图层
						_showOrHideResourceLayers(false);
					} else if(fromFlag === "on-rect-select-end") {
						//框选摄像机列表结束，隐藏资源图层
						_showOrHideResourceLayers(false);
					} else {
						//右键退出框选摄像机列表，隐藏资源图层
						_showOrHideResourceLayers(false);
					}
					break;

			/**
			 * scence：
			 * 1、“group-detail”，显示防控圈分组下的防空圈时隐藏资源图层，只显示防控圈相关图层
			 * 2、“circle-search”，搜索防控圈时，显示资源
			 * 3、“new-circle”，新建防控圈的时候
			 * 4、“edit-circle”，编辑防控圈的时候
			 * 5、“circle-detail”，显示防控圈详情时
			 * 6、“circle-detail”，搜索结果的点击查看详情时
			 * 7、“check-none”，搜索结果checkbox全部取消时
			 * 8、“on-draw”，绘制防空圈时
			 * 9、“on-draw-end”，绘制防控圈结束时
			 * 10、“on-right-end”，绘制防控圈右键结束时
			 * 11、“on-rect-select”，防空圈绘制完成后，框选缓冲区上的摄像机开始时
			 * 12、“on-rect-select-end”，防空圈绘制完成后，框选缓冲区上的摄像机结束时
			 * 13、“on-right-select-end”，防空圈绘制完成后，框选缓冲区上的摄像机右键退出
			 */
				case "on-show-defence-circle-info":
					//显示防控圈图层
					!(window.map.getLayerByName("defence-circle-layer").getVisible()) && MapLayerCtrl.show(["defence-circle-layer"]);
					//根据使用场景切换图层
					if (fromFlag === "group-detail") {
						//隐藏资源图层
						_showOrHideResourceLayers(false);
						//清除业务图层
						_clearLayer(["defence-circle-layer"]);
					} else if (fromFlag === "circle-search" || fromFlag === "new-circle" || fromFlag === "check-none") {
						//显示资源图层
						_showOrHideResourceLayers(true);
						//清除业务图层
						_clearLayer(["defence-circle-layer"]);
					} else if(fromFlag === "edit-circle"){
						//隐藏资源图层
						_showOrHideResourceLayers(false);
						//编辑防控圈
						_clearLayer(["defence-circle-layer"]);
					} else if(fromFlag === "circle-detail") {
						//隐藏资源图层
						_showOrHideResourceLayers(false);
					} else if(fromFlag === "on-draw" || fromFlag === "on-rect-select") {
						//显示资源图层
						_showOrHideResourceLayers(true);
					} else if(fromFlag === "on-draw-end") {
						//显示资源图层
						_showOrHideResourceLayers(false);
					} else if(fromFlag === "on-right-end") {
						//显示资源图层
						_showOrHideResourceLayers(false);
					} else if(fromFlag === "on-rect-select-end") {
						//框选摄像机列表结束，隐藏资源图层
						_showOrHideResourceLayers(false);
					} else {
						//右键退出框选摄像机列表，隐藏资源图层
						_showOrHideResourceLayers(false);
					}
					break;

			/**
			 * scence：
			 * 1、点击了左侧资源项，清空图层环境，以显示对应类型资源的信息窗
			 * 2、点击了地图上的资源点位，清空图层环境，以显示对应类型资源的信息窗
			 */
				case "on-click-left-resource-item":
					//隐藏业务图层
					MapLayerCtrl.hide(businesslayer);
					//清空资源显示图层
					_clearLayer(["resource-show-layer"]);
					break;

				default:
					break;

			}
		};

		//初始化
		scope.init = function() {
			//初始化
			MapLayerCtrl.init(window.map, {
				hide: [],
				show: []
			});
		};

		scope.showOrHideResource = function(flag) {
			_showOrHideResourceLayers(flag);
		};
		return scope;

	}({}, jQuery));

});
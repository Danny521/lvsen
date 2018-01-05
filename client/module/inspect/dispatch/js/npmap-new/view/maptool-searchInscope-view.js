define([
		'pubsub',
		'js/npmap-new/map-variable',
		'js/npmap-new/map-common',
		'js/npmap-new/view/maptool-select-view',
		'js/npmap-new/map-common-overlayer-ctrl',
		'js/npmap-new/mapsearch-variable',
		'scrollbar'
	],

	function(pubsub, Variable, MapCommon, SelectView, MapOverLayerCtrl, _g) {

		var searchInScopeView = function() {
			var self = this;

			self.bindEvents();
			//初始化信息窗模板
			MapCommon.loadTemplate(this.templateUrl, function(compiler){
				//保存模板对象
				self.compiler = compiler;
			}, function() {
				notify("视野内搜索模板初始化失败！");
			});
		};

		searchInScopeView.prototype = {
			templateUrl: "inc/map/searchInscope-template.html",
			//模板渲染对象
			compiler: null,
			/**
			 * 绑定事件
			 * @author Li Dan
			 * @date   2014-12-16
			 * @return {[type]}   [description]
			 */
			bindEvents: function() {
				var self = this;
				//分组搜索
				jQuery(document).on("click", "#map-tool-right .map-tool-item .map-searcharound-content li .data-content a.groups", function() {
					//恢复报警
					MapCommon.IfClickAlarmInfo();
					//搜索分组视野范围内摄像机
					self.viewSearchByGroup(this);
				});
				//分组搜索（GPS&资源）
				jQuery(document).on("click", "#map-tool-right .map-tool-item .map-searcharound-content li .data-content a.others", function() {
					var type = jQuery(this).attr("data-type");
					//恢复报警
					MapCommon.IfClickAlarmInfo();
					//搜索视野范围内的GPS等信息
					self.viewSearchOthersByGroup(this, type);
				});
				//输入搜索
				jQuery(document).on("click", "#viewSearch .view-search-footer .search-view-btn", function() {
					var inputValue = jQuery.trim(jQuery(this).prev().find(".search-value").val());
					//搜索视野范围内的资源等信息
					if(inputValue === "") {
						notify.warn("搜索内容不能为空！");
					} else {
						//判断输入长度
						if(inputValue.length > 30) {
							notify.warn("搜索内容应在30个字符以内！");
							return;
						}
						//恢复报警
						MapCommon.IfClickAlarmInfo();
						//进入搜索流程
						self.viewSearchOthersByGroup(this, "normal", inputValue);
					}
				});
			},
			/**
			 * 获取分组
			 * @author Li Dan
			 * @date   2014-12-16
			 * @return {[type]}   [description]
			 */
			getGroups: function() {
				pubsub.publish("getGroups", {});
			},
			/**
			 * 设置分组
			 * @author Li Dan
			 * @date   2014-12-16
			 * @param  {[type]}   result [description]
			 */
			setGroups: function(result) {
				// 渲染分组信息
				var content = this.compiler({
					viewCameras: result.data
				});
				jQuery("#mapSearchAroundContent").html(content);
				//添加滚动条
				jQuery("#viewSearch").tinyscrollbar({
					thumbSize: 60
				});
			},
			/**
			 * 隐藏分组
			 * @author Li Dan
			 * @date   2014-12-16
			 * @return {[type]}   [description]
			 */
			hideGroups: function(obj) {
				var This = jQuery(obj);
				jQuery(".map-searcharound-content").fadeOut(200);
				This.closest(".map-tool-item").find(".map-groups").removeClass("active");
			},
			/**
			 * 搜索视野范围内分组摄像机
			 * @author Li Dan
			 * @date   2014-12-16
			 * @param  {[type]}   obj [description]
			 * @return {[type]}       [description]
			 */
			viewSearchByGroup: function(obj) {
				//获取视野范围
				var extent = Variable.map.getExtent();
				var This = jQuery(obj);
				This.closest(".map-tool-item").find(".map-groups").removeClass("active");
				var Content = This.closest("#mapSearchAroundContent");
				Content.next().fadeOut(200);
				Content.fadeOut(200);
				//切换地图资源图层
				MapOverLayerCtrl.showAndHideOverLayers("on-range-circle-map-select", 0);
				//发布请求 获取某分组视野范围内的摄像机
				var data = {
					groupId: This.attr("groupid"),
					type: This.attr("grouptype"),
					current_page: 1,
					page_size: 20,
					x1: extent.sw.lon,
					y1: extent.sw.lat,
					x2: extent.ne.lon,
					y2: extent.ne.lat
				};
				pubsub.publish("getGroupCameraInScope", data);
			},
			/**
			 * 设置视野范围内摄像机
			 * @author Li Dan
			 * @date   2014-12-16
			 */
			setGroupCamerasInscope: function(result, data) {
				logDict.insertMedialog("m1", "查看分组的详情", "", "o4");
				jQuery('#camerasPanel').removeClass('loading');
				//修改为非输入搜索{视野范围内搜索分组摄像机}
				_g.isInputSearch = false;
				//直接显示结果
				SelectView.setCamerasToMap(result, "range");
			},
			/**
			 * 视野范围内搜索摄像机
			 * @param result - 摄像机结果
			 */
			setRangeCameras: function(result) {
				//修改为非输入搜索{视野范围内搜索摄像机}
				_g.isInputSearch = false;
				//直接显示结果
				SelectView.setCamerasToMap(result, "range");
			},
			/**
			 * 搜索视野范围内的GPS&资源
			 * @author Li Dan
			 * @date   2014-12-16
			 * @return {[type]}   [description]
			 * @return {[extern]}   [输入搜索时保存输入的值]
			 */
			viewSearchOthersByGroup: function(obj, type, extern) {
				var self = this;
				var This = jQuery(obj);
				This.closest(".map-tool-item").find(".map-groups").removeClass("active");
				var Content = This.closest("#mapSearchAroundContent");
				Content.next().fadeOut(200);
				Content.fadeOut(200);
				//地图层级
				if (Variable.map.getZoom() < mapConfig.viewSearchZoom) {
					Variable.map.setZoom(mapConfig.viewSearchZoom);
				}
				//获取视野范围(延时500ms)
				setTimeout(function() {
					//视野范围内搜索资源数据
					self.getResourceDataByExtent(type, extern);
				}, 500);
			},
			/**
			 * 视野范围内搜索资源数据,从上面函数中抽出，以备gps、350数据动态刷新使用，add by zhangyu,2014-11-13
			 * @param type - 当前搜索的数据类型，gps、lightbar、camera、350M、卡口
			 * @param extern - 额外参数，输入搜索时保存输入的值
			 */
			getResourceDataByExtent: function(type, extern) {
				//获取当前地图范围
				var self = this, extent = Variable.map.getExtent();
				var location = {
					y1: MapCommon.parseFloat(extent.sw.lat, 6),
					x1: MapCommon.parseFloat(extent.sw.lon, 6),
					y2: MapCommon.parseFloat(extent.ne.lat, 6),
					x2: MapCommon.parseFloat(extent.ne.lon, 6),
					keyWord: extern
				};
				if (type === "camera") {
					//发布请求 获取视野范围内的摄像机
					pubsub.publish("getCameraInscope", {extent: extent, extern: extern});
					//切换地图资源图层
					MapOverLayerCtrl.showAndHideOverLayers("on-range-circle-map-select", 0);
				} else if (type === "bayonet") {
					//发布请求 获取视野范围内的卡口
					pubsub.publish("getBayonetInscope", {location: location, extern: extern});
					//切换地图资源图层
					MapOverLayerCtrl.showAndHideOverLayers("on-range-circle-map-select", 5);
				} else if (type === "lightbar") {
					//发布请求 获取视野范围内的灯杆
					pubsub.publish("getLightbarInscope", {location: location, extern: extern});
					//切换地图资源图层
					MapOverLayerCtrl.showAndHideOverLayers("on-range-circle-map-select", 4);
				} else if (type === "gps") {
					//发布请求 获取视野范围内的警车
					pubsub.publish("getGpsInscope", {location: location, extern: extern});
					//切换地图资源图层
					MapOverLayerCtrl.showAndHideOverLayers("on-range-circle-map-select", 2);
				} else if (type === "350M") {
					//发布请求 获取视野范围内的警员
					pubsub.publish("get350MInscope", {location: location, extern: extern});
					//切换地图资源图层
					MapOverLayerCtrl.showAndHideOverLayers("on-range-circle-map-select", 3);
				} else if (type === "alarm") {
					//发布请求 获取视野范围内的警员
					pubsub.publish("getAlarmInscope", {location: location, extern: extern});
					//切换地图资源图层
					MapOverLayerCtrl.showAndHideOverLayers("on-range-circle-map-select", 1);
				} else {
					//输入查询
					require(["js/connection/view/left-for-search-view"], function (LeftPanelSearchView) {
						LeftPanelSearchView.init(function () {
							LeftPanelSearchView.showSearchResult("range", {
								type: type,
								value: extern
							}, self);
						});
					});
				}
			}
		};

		return new searchInScopeView();
	});
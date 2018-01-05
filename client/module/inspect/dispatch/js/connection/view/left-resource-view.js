/**
 * Created by Zhangyu on 2015/4/21.
 */
define([
	"js/npmap-new/map-variable",
	"js/npmap-new/map-common",
	"js/npmap-new/map-const",
	"js/npmap-new/map-common-overlayer-ctrl",
	"/module/common/tree/tree-controller.js",
	"jquery",
	"pubsub",
	"js/connection/subscribe-for-camera-tree",
	"jquery.pagination"
], function(Variable, MapCommon, Constant, MapOverLayerCtrl, CameraTree, jQuery, PubSub){

	return (function(scope, $){
		//响应左侧卡口树点击时,渲染大头钉
		PubSub.subscribe("triggerOnClickBayonetTree", function(msg, data){
			_showResouceOnMap(data);
		});

		var //当前显示的资源类型
			_curDataType = "camera",
			//左侧资源分组，是否是第一次加载
			_isFirstLoad = true,
			//资源切换时(此值不同)，影藏资源分页
			_preResType = "",
			//保存控制器对象
			_controller = null,
			//模板渲染对象
			_compiler = null,
			//模板地址
			_templateUrl = "inc/connection/left-resource-list.html",
			//左侧树对象
			_tree = window.tree = new CameraTree(),
			//分页单页数据量
			_pageSize = 15,
			//事件处理程序
			_eventHandler = {
				//电子防线绘制按钮的业务逻辑处理事件
				LeftResItemClick: function (e) {
					var data = $(this).data();
					if(data.type === "gps") {
						//如果是警力，则需要获取详细数据
						_controller.getGpsDetails(data);
					} else {
						_showResouceOnMap(data);
					}
					e.stopPropagation();
				},
				//GPS历史轨迹
				ViewGPSLineClick:function(e){
					var data = $(this).data();
					require(["js/npmap-new/task/gps-track"], function(view) {
						view.policeGps(data.carcode);
					});
					e.stopPropagation();
				},
				//高标清筛选摄像机
				SHCameraFliter: function (e) {
					_fliterCameraTreeBySH.call(this);
					//e.stopPropagation();
				},
				//在线\离线筛选摄像机
				OnOffCameraFliter: function (e) {
					_fliterCameraTreeByOO.call(this);
					//e.stopPropagation();
				},
				//全局搜索
				ClickSearchBtn: function(e) {
					_triggerSearchBtn.call(this);
					e.stopPropagation();
				},
				//清除组织
				clearOrg: function(e) {
					e.stopPropagation();
					jQuery(e.target).closest(".org-res-filter").removeClass("active");
					_tree.clearfilterArray("org");
					jQuery(e.target).siblings("span").attr("data-orgid","").attr("data-orgname","").attr("title","").text("筛选组织...");
				},
				//显示已选组织
				showSelectedOrgs: function(e) {
					e.stopPropagation();
					var $This = jQuery(this),
						orgIds = $This.siblings("span").attr("data-orgid").split(","),
						orgNames = $This.siblings("span").attr("title").split(","),
						container = jQuery("#sidebar-body").children('.resource').children(".sidebar-tree");
						//如果没有过滤的组织，直接返回
						if(!!!orgIds[0]){
							return;
						}
						if($This.hasClass("expand1")){
							$This.removeClass("expand1").addClass("expand2");
						}else{
							$This.removeClass("expand2").addClass("expand1");
						}
						if(!!orgIds[0]){
							var LiStr = "";
							for(var i=0,Len=orgIds.length; i<Len; i++){
								var name = orgNames[i],
									id = orgIds[i];
								LiStr += '<li data-name='+name+'  data-id='+id+' title='+name+'><span>'+ name +'</span><a class="close" data-type="video-res" data-event="click" data-handler="removeSingle"></a></li>';
							}
							jQuery("#sidebar-body").find(".select-org-Panel").show();
							jQuery("#sidebar-body").find(".select-org-Panel ul").empty().append(LiStr);
						}
						if($This.hasClass("expand1")){
							jQuery("#sidebar-body").find(".select-org-Panel").show();
							var panel = jQuery("#sidebar-body").find(".resource");
								panel.find(".sidebar-search-div").find(".sidebar-search-panel").hide();
								panel.find(".sidebar-resource-type-container").hide();
								panel.find(".sidebar-filter-container").hide();
								panel.find(".sidebar-tree").css("top","105px");
								_tree.renderInspectTree(false, container, true);
						}else{
							jQuery("#sidebar-body").find(".select-org-Panel").hide();
							var panel = jQuery("#sidebar-body").find(".resource");
							panel.find(".sidebar-search-div").find(".sidebar-search-panel").show();
							panel.find(".sidebar-resource-type-container").show();
							panel.find(".sidebar-filter-container").show();
							panel.find(".sidebar-tree").css("top","160px");
							panel.find(".sidebar-search-div").find(".sidebar-search-panel").find("input.sidebar-search-submit").trigger("click");
						}
						//绑定过滤框事件
						_bindOrgPanelEvent();
				},
				//删除单个组织
				removeSingle: function(e){
					e.stopPropagation();
					var $This = jQuery(this),
						type = $This.data("type") === "video-res" ? "org" : "customize",
						orgid = $This.closest("li").attr("data-id"),
						container = jQuery("#sidebar-body").children('.resource').children(".sidebar-tree");
						$This.closest("li").remove();
						_tree.deleteSingleOrgId(type,orgid);
						_tree.rePaintFilter(type);
						var Panel = jQuery("#sidebar-body").find(".select-org-Panel"),
							Lis = Panel.find("ul").children("li");
						if(Lis.length === 0){
							Panel.hide();
							var panel = jQuery("#sidebar-body").find(".resource");
							panel.find(".sidebar-search-div").find(".sidebar-search-panel").show();
							panel.find(".sidebar-resource-type-container").show();
							panel.find(".sidebar-filter-container").show();
							panel.find(".sidebar-tree").css("top","160px");
							panel.find(".sidebar-search-div").find(".sidebar-search-panel").find("input.sidebar-search-submit").trigger("click");
						}
				}
			};

		var /**
			 * 资源列表显示后的事件绑定
			 * @param selector - 当前待绑定上下文的选择器
			 * @param type - 当前的数据类型，绑定搜索框使用
			 * @private
			 */
			_bindEvents = function(selector, type) {

				$(selector).find("[data-handler]").map(function () {
					$(this).off($(this).data("event")).on($(this).data("event"), _eventHandler[$(this).data("handler")]);
				});
				//有资源请求后绑定
				if(type) {
					//绑定搜索框
					_bindSearchInput(type);
					//绑定组织过滤
					_bindOrgFilterEvent();
				}
			},
			/**
			 * 绑定组织过滤
			 * @private
			 */
			_bindOrgFilterEvent = function() {
                _bindEvents(".org-res-filter");
			},
			/**
			 * 绑定组织容器事件
			 * @private
			 */
			_bindOrgPanelEvent = function() {
                _bindEvents(".select-org-Panel");
			},
			/**
			 * 绑定搜索框的事件
			 * @param type - 当前数据类型
			 * @private
			 */
			_bindSearchInput = function(type) {
				//搜索框dom对象
				var $searchDom = $(".np-input-search"),
					$searchBtn = $(".np-input-search-btn"),
					$container = $(".sidebar-tree");
				//取消所有事件
				$searchDom.off();
				$searchBtn.off();
				//根据资源类型绑定搜索框
				if (type === "camera") {
					//绑定摄像机搜索
					_tree.bindSearchEvent($searchDom, "org", $container);
					//绑定搜索按钮
					_tree.bindSearchClickEvent($searchBtn, $searchDom, "org", $container);
					//隐藏分页
					$(".pagination").empty();

				} else if (type === "lightbar" || type === "police" || type === "policeman" || type === "bayonet") {
					//绑定资源搜索
					$searchDom.watch({
						wait: 200,
						captureLength: 0,
						//监听的输入长度
						callback: function(key) {
							//判断输入长度
							if(key.length > 30) {
								notify.warn("搜索内容应在30个字符以内！");
								return;
							}
							//根据类型进行处理
							if (type === "bayonet") {
								//绑定卡口搜索
								window.gateController.searchNodes(key);
								//隐藏分页
								$(".pagination").empty();
							} else {
								//重置标记位
								_isFirstLoad = true;
								//搜素资源
								_controller.searchResource({
									currentPage: 1,
									pageSize: _pageSize,
									code: key
								}, type);
							}
						}
					});
					//绑定筛选事件（搜索按钮事件）
					_bindEvents(".np-search-panel");
				}
			},
			/**
			 * 包装信息
			 * @param data - 待包装的数据
			 * @private
			 */
			_extendData = function(data){
				data.feature = {};
				data.feature.geometry = {};
				data.feature.geometry.x = data.lon;
				data.feature.geometry.y = data.lat;
				data.subType = data.subType || data.subtype;
			},
			/**
			 * 根据资源类型获取资源图层的名称
			 * @param type - 资源类型
			 * @returns {string}
			 * @private
			 */
			_getLayerNameByType = function(type) {

				switch (type) {
					case "bayonet": return "PVD-GATE-LAYER";
					case "lightbar": return "lightbar-resource-layer";
					case "gps": return "policecar-resource-layer";
					case "350M": return "policeman-resource-layer";
				}

			},
			/**
			 * 显示左侧选中的资源
			 * @param data - 资源的数据
			 * @private
			 */
			_showResouceOnMap = function(data) {
				if(!(data.lon && data.lat)){
					notify.warn("当前点位没有坐标信息！");
					return;
				}
				//定义中心点
				var pt = new NPMapLib.Geometry.Point(data.lon, data.lat);
				//如果不为卡口则需要地图定位，否则卡口程序已经完成
				if(data.type !== "bayonet") {
					//检查坐标合法性
					if(!mapConfig.checkPosIsCorrect(data.lon, data.lat)) {
						return;
					}
					//在缩放之前关闭窗口,以解决ocx地图信息窗播放在缩放后关闭造成ocx画面残留的问题，add by zhangyu, 2014-10-31
					if(window.infowindow){
						window.infowindow.closeInfoWindow();
					}
					//点击左侧资源时，缩放地图层级并居中该点
					MapCommon.centerAndZoomOnShowInfowin(pt);
				}
				//包装信息
				_extendData(data);
				//清除图层环境
				MapOverLayerCtrl.showAndHideOverLayers("on-click-left-resource-item");
				//根据情况显示资源定位图层
				var layer = window.map.getLayerByName(_getLayerNameByType(data.type));
				if(!(layer && layer.getVisible()) || (data.type === "bayonet" && !$(".map-resource-list").find(".bayonet-resource i.checkbox").hasClass("checked"))) {
					Variable.layers.resourceShowLayer.show();
					data.markerType = "map-marker";
				} else {
					Variable.layers.resourceShowLayer.hide();
					data.markerType = "resource-marker";
				}
				//显示图标
				var marker = new NPMapLib.Symbols.Marker(pt);
				marker.setIcon(Constant.symbol.markerSymbol());
				marker.setData(data);
				Variable.layers.resourceShowLayer.addOverlay(marker);
				//将该标注作为当前活动摄像机
				Variable.currentCameraData = data;
				//如果不为卡口，则需要弹出信息窗，否则卡口程序已经完成
				if(data.type !== "bayonet") {
					//显示信息窗口
					PubSub.publishSync("showInfoWindowOnMap1", {
						data: data,
						sence: "",
						fn: function () {
							//设置当前活动摄像机标注
							Variable.currentCameraMarker = marker;
						}
					});
				} else {
					//设置当前活动摄像机标注
					Variable.currentCameraMarker = marker;
				}
			},
			/**
			 * 根据高标清筛选摄像机树
			 * @private
			 */
			_fliterCameraTreeBySH = function() {

				if ($(this).hasClass("np-sh-all")) {
					//高标清不限
					_tree.showSHTree($(".sidebar-tree"), "all");
				} else if ($(this).hasClass("np-hd")) {
					//高清
					_tree.showSHTree($(".sidebar-tree"), "hd");
				} else {
					//标清
					_tree.showSHTree($(".sidebar-tree"), "sd");
				}
			},
			/**
			 * 根据在线/离线筛选摄像机树
			 * @private
			 */
			_fliterCameraTreeByOO = function(){

				if ($(this).hasClass("np-oo-all")) {
					//在离线不限
					_tree.showOffOnlineTree($(".sidebar-tree"), "all");
				} else if ($(this).hasClass("np-on")) {
					//在线
					_tree.showOffOnlineTree($(".sidebar-tree"), "online");
				} else {
					//离线
					_tree.showOffOnlineTree($(".sidebar-tree"), "offline");
				}
				//触发查询
				$(".np-input-search-btn").trigger("click");
			},
			/**
			 * 点击搜索按钮时触发
			 * @private
			 */
			_triggerSearchBtn = function() {
				var key = $.trim($(".np-input-search").val());
				//判断输入长度
				if(key.length > 30) {
					notify.warn("搜索内容应在30个字符以内！");
					return;
				}
				//搜素资源
				if (_curDataType === "bayonet") {
					//绑定卡口搜索
					window.gateController.searchNodes(key);
					//隐藏分页
					$(".pagination").empty();
				} else {
					//重置标记位
					_isFirstLoad = true;
					//灯杆、警车、警员
					_controller.searchResource({
						currentPage: 1,
						pageSize: _pageSize,
						code: key
					}, _curDataType);
				}
			},
			/**
			 * 根据类型渲染分页
			 * @param extendData - 分页信息
			 * @param type - 数据类型
			 * @private
			 */
			_renderPager = function(extendData, type) {
				//判断是否已经显示分页了
				if (!_isFirstLoad) {
					return;
				}
				//收集分页信息
				var totalCount = extendData.totalCount || extendData.count,
					totalPage = extendData.totalPage || extendData.pageCount;
				//分页加载
				if (totalPage > 1) {
					$(".pagination").pagination(totalCount, {
						items_per_page: _pageSize,
						num_display_entries: 2,
						num_edge_entries: 1,
						callback: function (pageIndex) {
							if (pageIndex === 0 && _isFirstLoad) {
								_isFirstLoad = false;
								return;
							}
							_controller.searchResource({
								currentPage: pageIndex + 1,
								pageSize: _pageSize,
								code: $.trim($(".np-input-search").val())
							}, type);
						}
					});
				} else {
					$(".pagination").empty();
				}
			};

		scope.init = function(controller) {
			//保存控制器对象
			_controller = controller;
			//初始化信息窗模板
			MapCommon.loadTemplate(_templateUrl, function (compiler) {
				//保存模板对象
				_compiler = compiler;
			}, function () {
				notify("左侧资源数据模板初始化失败！");
			});
			//绑定筛选事件
			_bindEvents(".np-search-panel");
			if (window.inspectSuperMainCamerasLoaded) {
				_bindEvents(".np-camera-tree-fliter", "camera");
			}
		};
		/**
		 * 根据资源类型加载左侧资源列表
		 * @param data - 待加载的资源数据
		 * @param extendData - 额外数据，如分页类的信息
		 * @param type - 待加载的资源数据类型
		 */
		scope.showResource =  function(data, extendData, type) {
			var $containerDom = $(".np-res-container");
			//渲染框架
			if($containerDom.length === 0) {
				$(".sidebar-tree").empty().html($.trim(_compiler({
					resFrame: true
				})));
				//重新赋值
				$containerDom = $(".np-res-container");
			}
			//渲染模板
			$containerDom.empty().html($.trim(_compiler({
				lightbar: (type === "lightbar"),
				police: (type === "police"),
				policeman: (type === "policeman"),
				bayonet: (type === "bayonet"),
				maproute: (type === "maproute"),
				items: data
			})));
			window.permission.reShow();
			//记录当前渲染的类型
			_curDataType = type;
			//绑定事件
			_bindEvents(".sidebar-tree", type);
			//警力、灯杆资源下才进行分页
			if(type === "police" || type === "lightbar") {
				//渲染分页
				_renderPager(extendData, type);
			}
		};

		/**
		 * 点击左侧列表后，显示Gps信息窗
		 * @param data - Gps详细信息
		 */
		scope.showGpsInfowindow = function(data){
			_showResouceOnMap(data);
		};
		/**
		 * 加载左侧资源树
		 */
		scope.loadCameraTree = function() {
			//比较并设置资源类别
			if(_preResType !== "camera"){
				//隐藏分页
				$(".pagination").empty();
				//设置类别
				_preResType = "camera";
				//重置第一次加载对象
				_isFirstLoad = true;
			}
			//加载摄像机资源
			var key = $.trim($(".np-input-search").val());
			//记录当前渲染的类型
			_curDataType = "camera";
			//初始化
			_tree.renderOrgTree(false, $(".sidebar-tree"));
			//取消等待
			$(".sidebar-tree").removeClass("loading");
			//绑定筛选事件
			_bindEvents(".np-camera-tree-fliter", "camera");
			//如果不为空，则显示搜索结果
			if(key !== "") {
				//判断输入长度
				if(key.length > 30) {
					notify.warn("搜索内容应在30个字符以内！");
					return;
				}
				//待完善（有搜索数值时按照数值进行搜索）
				$(".np-input-search-btn").trigger("click");
			}
		};
		/**
		 * 加载卡口资源
		 */
		scope.loadBayonetRes = function(){
			//比较并设置资源类别
			if(_preResType !== "bayonet"){
				//隐藏分页
				$(".pagination").empty();
				//设置类别
				_preResType = "bayonet";
				//重置第一次加载对象
				_isFirstLoad = true;
			}
			//记录当前渲染的类型
			_curDataType = "bayonet";
			//加载卡口
			if(window.gateController) {
				//加载摄像机资源
				var key = $.trim($(".np-input-search").val());
				//加载卡口树
				window.gateController._init($('.sidebar-tree'));
				//初始化input输入框事件
				_bindSearchInput("bayonet");
				//勾选卡口资源
				//$(".map-resource .map-resource-list").find(".list-item[data-type='bayonet'] i.checkbox").addClass("checked");
				//判断是否有搜索关键字，如果有则按搜索进行筛选
				if (key !== "") {
					//判断输入长度
					if (key.length > 30) {
						notify.warn("搜索内容应在30个字符以内！");
						return;
					}
					//绑定卡口搜索
					window.gateController.searchNodes(key);
					//隐藏分页
					$(".pagination").empty();
				}
			}
		};
		/**
		 * 加载灯杆资源
		 */
		scope.loadLightbarRes = function(){
			//比较并设置资源类别
			if(_preResType !== "lightbar") {
				//隐藏分页
				$(".pagination").empty();
				//设置类别
				_preResType = "lightbar";
				//重置第一次加载对象
				_isFirstLoad = true;
			}
			//加载灯杆
			_controller.loadLightbarList({
				code: $.trim($(".np-input-search").val())
			});
		};
		/**
		 * 加载警车资源
		 */
		scope.loadPoliceRes = function(){
			//比较并设置资源类别
			if(_preResType !== "police"){
				//隐藏分页
				$(".pagination").empty();
				//设置类别
				_preResType = "police";
				//重置第一次加载对象
				_isFirstLoad = true;
			}
			//加载警车
			_controller.loadPoliceList({
				code: $.trim($(".np-input-search").val())
			});
		};
		/**
		 * 加载警员资源
		 */
		scope.loadPolicemanRes = function(){
			//比较并设置资源类别
			if(_preResType !== "policeman") {
				//隐藏分页
				$(".pagination").empty();
				//设置类别
				_preResType = "policeman";
				//重置第一次加载对象
				_isFirstLoad = true;
			}
			//加载警员
			_controller.loadPolicemanList({
				code: $.trim($(".np-input-search").val())
			});
		};
		/**
		 * 加载道路资源
		 */
		scope.loadMapRouteRes = function(){
			//比较并设置资源类别
			if(_preResType !== "maproute") {
				//隐藏分页
				$(".pagination").empty();
				//设置类别
				_preResType = "maproute";
				//重置第一次加载对象
				_isFirstLoad = true;
			}
			//加载道路
			_controller.loadRouteList($.trim($(".np-input-search").val()) || "高速");
		};

		return scope;

	}({}, jQuery));

});
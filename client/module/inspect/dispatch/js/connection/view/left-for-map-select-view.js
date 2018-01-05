/**
 * Created by Zhangyu on 2015/4/26.
 */
define([
	"js/sidebar/sidebar",
	"js/npmap-new/map-variable",
	"js/npmap-new/map-common",
	"js/npmap-new/map-const",
	"js/npmap-new/map-permission",
	"js/npmap-new/map-common-tvwall",
	"js/map-record-download",
	"jquery",
	"pubsub"
], function (SideBar, Variable, MapCommon, Constant, pvamapPermission, TVWall,RecordDownload, jQuery, PubSub) {
	return (function (scope, $) {
		var //地图选择页面对象
			_mapSelectView = null,
			//是否需要显示分页
			_isFirstLoad = true,
			//用来比较是否来自同一个源，用来重置分页变量以重新分页
			_preFrom = "",
			//用来比较是否来自同一个源，用来重置分页变量以重新分页（输入搜索时有效）
			_preValue = "",
			//用来比较圈选时是否是同一个搜索半径，用来重新渲染分页
			_preRadius = 0,
			//控制器对象
			_controller = null,
			//保存模板对象
			_compiler = null;
			//模板对象
			_templateUrl = "inc/connection/left-for-map-select.html",
			//事件处理程序
			_eventHandler = {
				//播放摄像机视频
				PlayCamera: function (e) {
					_playCameraOnMap.call(this);
					e.stopPropagation();
				},
				//添加视频布防
				AddDefence: function (e) {
					_setVideoDefence.call(this);
					e.stopPropagation();
				},
				//添加到我的分组
				AddToMyGroup: function (e) {
					_addCameraToMyGroup.call(this);
					//e.stopPropagation();
				},
				//发送到电视墙
				SendToWall: function (e) {
					_sendToTvWall.call(this);
					e.stopPropagation();
				},
				//纠错
				recovery: function (e) {
					notify.info("待完善");
					e.stopPropagation();
				},
				//新建分组
				AddToNewGroup: function (e) {
					_showCreatePanel.call(this);
					e.stopPropagation();
				},
				//历史录像下载
				HistoryVideoDownload: function (e) {
					RecordDownload.start();
				},
				//添加到布控
				AddToProtectMonitor: function (e) {
					_addToProtectMonitor.call(this);
					e.stopPropagation();
				},
				//搜索结果项上的绑定事件，单击、双击、鼠标移入、鼠标移出
				EventOnResultItem: function(e) {
					if (e.type === "dblclick") {
						//双击
						_playCameraOnMap.call(this);
						e.stopPropagation();
					} else if (e.type === "mouseenter") {
						//鼠标移入
						_hoverSearchResultItem.call(this);
						e.stopPropagation();
					} else if (e.type === "mouseleave") {
						//鼠标移出
						_hoveroutSearchResultItem.call(this);
						e.stopPropagation();
					} else {
						//单击事件，待扩展
					}
				},
				//勾选搜索结果
				CheckSelectResult: function(e){
					_checkSelectResult.call(this);
					e.stopPropagation();
				},
				//保存新建的摄像机分组
				SaveNewCameraGroup: function(e) {
					_saveCameraGroup.call(this);
					e.stopPropagation();
				},
				//取消新建分组
				CancelNewCameraGroup: function(e) {
					_cancelCameraGroup.call(this);
					e.stopPropagation();
				},
				//重名校验
				CheckGroupName: function(e) {
					var name = $.trim($(".np-create-new-group .np-new-group-name").val());
					_validataGroupName.call(this, name, false);
					e.stopPropagation();
				}
			};

		var /**
			 * 绑定事件
			 * @param selector - 选择器，为适应动态绑定
			 * @private
			 */
			_bindEvents = function (selector) {
				//绑定事件
				$(selector).find("[data-handler]").map(function () {
					$(this).off($(this).data("event")).on($(this).data("event"), _eventHandler[$(this).data("handler")]);
				});
				//拖动元素到电视墙上
				$(selector).find(".np-result-item-name").each(function (index, item) {
					var data = $(this).closest("li.np-map-select-camera-item").data();
					TVWall.dragToTvwall(item, data);
				});
			},
			/**
			 * 设置视频布防
			 * @private
			 */
			_setVideoDefence = function() {
				var data = $(this).closest("li.np-map-select-camera-item").data();
				//判断是否有权限访问该摄像头 by zhangyu on 2015/2/11
				if(!pvamapPermission.checkDefencePermissionById(data.id, "access-defense-on-select-camera")){
					return;
				}

				// require(["/module/common/defencesetting/js/main.js"], function(DefenceLogical) {
				// 	//进入布防
				// 	DefenceLogical.DefenceInitial(data, "mapping");
				// });
				window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/protection-monitor/newStructAlarmmgr/?defenceCamearaId=" + data.id);
			},
			/**
			 * 选中左侧搜索结果，在地图上播放摄像机
			 * @private
			 */
			_playCameraOnMap = function(){
				var $liDom = $(this).closest(".np-map-select-camera-item"), camera = $(this).closest(".np-map-select-camera-item").data();
				//判断资源权限 by zhangyu on 2015/2/11
				if(!pvamapPermission.checkCameraPermissionById(camera.id, "play-batch-real-video-on-select-result")) {
					return;
				}
				//判断是否有视频指挥模块的实时视频的权限，如果有则进入，没有就提示。  by zhangyu 2015.02.11
				if(!pvamapPermission.checkRealStreamPlay("search-result-dbclick-on-btn")) {
					return;
				}
				//响应地图上的点位，并播放视频
				_mapSelectView.linkageToMapGeometry(camera.id);
				//修改左侧样式
				if(!$liDom.hasClass("selected")) {
					$liDom.addClass("active selected").siblings().removeClass("active selected");
				}
			},
			/**
			 * 鼠标移入搜索结果项，地图元素响应
			 * @private
			 */
			_hoverSearchResultItem = function() {
				var camera = $(this).data();
				//响应地图上的点位，并播放视频
				_mapSelectView.hoverSearchResultItem(camera);
			},
			/**
			 * 鼠标移出搜索结果项，地图元素响应
			 * @private
			 */
			_hoveroutSearchResultItem = function() {
				var camera = $(this).data();
				//响应地图上的点位，并播放视频
				_mapSelectView.hoveroutSearchResultItem(camera);
			},
			/**
			 * 发送到电视墙
			 * @private
			 */
			_sendToTvWall = function() {
				//获取摄像机参数
				Variable.currentCameraData = $(this).closest("li.np-map-select-camera-item").data();
				//发送到电视墙
				TVWall.sendToTvwall();
			},
			/**
			 * 显示添加分组面板，批量操作点击“新建分组”
			 * @private
			 */
			_showCreatePanel = function() {
				var $newGroupDom = $(".np-camera-search-result");
				//判断是否勾选了摄像机
				if($(".np-map-select-camera-item").find(".np-check.checked").length === 0) {
					notify.warn("请至少选择一个要添加分组的摄像机！");
					return;
				}
				//隐藏批量操作面板
				$newGroupDom.find(".np-batch-operator").hide();
				//显示新建分组面板
				$newGroupDom.find(".np-create-new-group").slideDown(200);
				$newGroupDom.find('.search-result-content').animate({
					top: "196px"
				});
			},
			/**
			 * 添加摄像机到我的分组
			 * @private
			 */
			_addCameraToMyGroup = function() {
				var $this = $(this).parent(), cameraId = $this.closest(".np-map-select-camera-item").data("id");
				treeCtrl.appendToGroup(cameraId, $this);
			},
			/**
			 * 勾选搜索结果
			 * @private
			 */
			_checkSelectResult = function() {
				var $this = $(this);
				//改变当前checkbox样式
				$this.toggleClass("checked");
				//根据类型判断
				if ($this.hasClass("np-check-all")) {
					//全选
					if ($this.hasClass("checked")) {
						//选中
						$(".np-map-select-camera-item").find(".np-check").addClass("checked");
					} else {
						//取消
						$(".np-map-select-camera-item").find(".np-check").removeClass("checked");
					}
				} else {
					//单个选择
					if ($this.hasClass("checked")) {
						//选中(判断是否全部选中)
						if ($(".np-map-select-camera-item").find(".np-check").not(".checked").length === 0) {
							$(".np-check-all").addClass("checked");
						}
					} else {
						//取消
						$(".np-check-all").removeClass("checked");
					}
				}
			},
			/**
			 * 批量布控
			 * @private
			 */
			_addToProtectMonitor = function() {
				//判断是否勾选了摄像机
				if($(".np-map-select-camera-item").find(".np-check.checked").length === 0) {
					notify.warn("请至少选择一个要添加分组的摄像机！");
					return;
				}
				notify.info("待完善");
			},
			/**
			 * 保存分组前进行验证
			 * @private
			 */
			_validataGroupName = function(name, require){
				var $nameInputDom = $(".np-create-new-group .np-new-group-name"),
					namePattern = /([?"*'\/\\<>:|？“”‘’^&~]|(?!\s)'\s+|\s+'(?!\s))/ig;
				//保存时需要判断是否为空
				if (require && (!name || name === "")) {
					$nameInputDom.focus();
					notify.warn("请输入分组名称！");
					return false;
				}
				if (name.length > 50) {
					$nameInputDom.focus();
					notify.warn("组名长度不能超过50字符！");
					return false;
				}
				if (namePattern.test(name)) {
					$nameInputDom.focus();
					notify.warn("组名不能包含特殊字符！");
					return false;
				}
				//重名验证
				if(!_controller.isGroupNameExist(name)) {
					$nameInputDom.focus();
					notify.warn("该组名已存在！");
					return false;
				}
				return true;
			},
			/**
			 * 保存新建分组
			 * @private
			 */
			_saveCameraGroup = function() {
				var $resultItemDom = $(".np-map-select-camera-item").find(".np-check.checked"),
					name = $.trim($(".np-create-new-group .np-new-group-name").val()),
					cameras = [];
				// 检查分组名是否合法
				if(!_validataGroupName(name, true)) {
					return;
				}
				//检测摄像机
				if($resultItemDom.length === 0) {
					notify.warn("请至少选择一个要添加分组的摄像机！");
					return;
				}
				//收集摄像机
				$resultItemDom.each(function() {
					cameras.push($(this).data("id"));
				});
				//保存分组
				_controller.saveGroup({
					type: "org",
					name: name,
					camera: cameras.join('/'),
					groups: ""
				});
			},
			/**
			 * 取消保存新建分组
			 * @private
			 */
			_cancelCameraGroup = function() {
				$(this).closest(".np-create-new-group").slideUp(200);
				//收起结果容器
				$('.search-result-content').animate({
					top: "94px"
				});
			},
			/**
			 * 摄像机圈选、框选、附近搜索、视野范围内搜索分页
			 * @param data - 结果数据
			 * @param from - 搜索来源，附近搜索（around）、视野范围内搜素（range）、框选搜索（rectcircle）
			 * @private
			 */
			_renderPager = function(data, from) {
				//判断是否已经显示分页了
				if(!_isFirstLoad) {
					return;
				}
				//分页加载
				if (data.pageCount > 1) {
					$("#dataPager").pagination(data.count, {
						items_per_page: 20,
						num_display_entries: 2,
						num_edge_entries: 1,
						callback: function (pageIndex) {
							if(pageIndex === 0 && _isFirstLoad) {
								_isFirstLoad = false;
								return;
							}
							//根据不同的来源访问不同的接口
							if(from === "rectcircle") {
								//地图圈选/框选
								PubSub.publish("pageGeometryCamera", $.extend(data.reqParam, {
									current_page: pageIndex + 1
								}));
							} else if(from === "around"){
								//附近搜索
								PubSub.publish("circleSearch", $.extend(data.reqParam, {
									current_page: pageIndex + 1
								}));
							} else {
								if(data.reqParam.current_page) {
									//视野范围内搜索-分组摄像机
									PubSub.publish("getGroupCameraInScope", $.extend(data.reqParam, {
										current_page: pageIndex + 1
									}));
								} else {
									//视野范围内搜索-摄像机
									PubSub.publish("getCameraInscope", $.extend(data.reqParam, {
										currentPage: pageIndex + 1
									}));
								}
							}
						}
					});
				} else {
					$("#dataPager").empty();
				}
			},
			/**
			 * 判断是否重新加载分页
			 * @param from - 数据来源
			 * @param data - 数据
			 * @private
			 */
			_checkChangeFlag = function(from, data) {
				if (_preFrom !== from) {
					//如果改变了来源，则重新加载分页(不论是否是输入查询)
					_isFirstLoad = true;
					//重置来源
					_preFrom = from;
					//清空分页
					$(".pagination").empty();
					//重置关键字
					if(from === "around") {
						_preRadius = parseInt(Variable.GlobalSearch.searchCircle.getRadius());
					}
				} else {
					//如果未改变来源，则判断是否是输入查询，且输入内容变化
					if (data.keyWord && _preValue !== data.keyWord) {
						//如果改变了来源，则重新加载分页(非输入查询)
						_isFirstLoad = true;
						//重置关键字
						_preValue = data.keyWord;
						//清空分页
						$(".pagination").empty();
					}
					//如果是地图框选，则根据搜索半径变化，清空并重新渲染分页
					if(from === "around") {
						var curRadius = parseInt(Variable.GlobalSearch.searchCircle.getRadius());
						if( _preRadius !== curRadius){
							//如果改变了来源，则重新加载分页(非输入查询)
							_isFirstLoad = true;
							//重置关键字
							_preRadius = curRadius;
						}
					}
				}
			};
		/**
		 * 显示地图上框选、圈选的搜索结构
		 * @param data - 结果信息
		 * @param isSelect - 判断是否是框选/圈选，如果是则显示接续选择按钮
		 * @param from - 搜索来源，附近搜索（around）、视野范围内搜素（range）、框选搜索（rectcircle）
		 */
		scope.showSelectResult = function (data, isSelect, from) {
			//判断是否重新加载分页
			_checkChangeFlag(from, data);
			//加载左侧列表,插入框架
			SideBar.push({
				name: "#sidebar-body",
				markName: "SelectResultPanel",
				template: $.trim(_compiler({
					searchResult: true,
					showHeader: true,
					searchPlace: (from === "rectcircle") ? "地图选择" : (from === "range") ? "视野范围内找" : (from === "around") ? "在附近找" : "",
					count: data.count || data.cameras.length,
					data: data,
					homeBreadUrl: $(".np-sidebar-header").find("li.active").data("mark")
				}))
			});
			//权限控制
			permission.reShow();
			//刷新权限,显示继续选择按钮 by zhangyu on 2015/2/12
			if (isSelect) {
				pvamapPermission.refreshPageByPermission("render-on-set-camera-to-map");
			}
			//事件绑定
			_bindEvents(".np-camera-search-result");
			//渲染分页
			_renderPager(data, from);
		};
		/**
		 * 在地图上附近、视野范围内输入搜索摄像机
		 * @param data - 结果信息
		 * @param from - 搜索来源，附近搜索（around）、视野范围内搜素（range）
		 */
		scope.showInputResult = function (data, from) {
			//判断是否重新加载分页
			_checkChangeFlag(from, data);
			//加载左侧列表,插入框架
			$(".np-search-all").children().remove(".np-camera-search-result").end().append($.trim(_compiler({
				searchResult: true,
				showHeader: false,
				searchPlace: (from === "range") ? "视野范围内找" : (from === "around") ? "在附近找" : "",
				count: data.cameras.length,
				data: data,
				homeBreadUrl: $(".np-sidebar-header").find("li.active").data("mark")
			})));
			//更新总数
			$(".np-for-search-header .np-for-search-count").find(".count").text(data.cameras.length);
			//权限控制
			permission.reShow();
			//事件绑定
			_bindEvents(".np-camera-search-result");
			//渲染分页
			_renderPager(data, from);
		};
		/**
		 * 地图元素点击后联动到搜索结果
		 * @param cameraId - 摄像机id
		 */
		scope.linkageToMapResultClick = function(cameraId) {
			var $leftItemDom = $(".np-map-select-camera-list").find("li.np-map-select-camera-item[data-id='" + cameraId + "']");
			//关联选中样式
			if(!$leftItemDom.hasClass("selected")) {
				//设置选中样式
				$leftItemDom.addClass("active selected").siblings().removeClass("active selected");
			}
		};
		/**
		 * 地图元素悬浮后联动到搜索结果
		 * @param cameraId - 摄像机id
		 */
		scope.linkageToMapResultHover = function(cameraId) {
			var $leftItemDom = $(".np-map-select-camera-list").find("li.np-map-select-camera-item[data-id='" + cameraId + "']");
			//设置当前的鼠标样式
			if(!$leftItemDom.hasClass("selected")) {
				$leftItemDom.addClass("active");
			}
		};
		/**
		 * 地图元素移除悬浮后联动到搜索结果
		 * @param cameraId - 摄像机id
		 */
		scope.linkageToMapResultHoverout = function(cameraId) {
			var $leftItemDom = $(".np-map-select-camera-list").find("li.np-map-select-camera-item[data-id='" + cameraId + "']");
			//设置当前的鼠标样式
			if(!$leftItemDom.hasClass("selected")) {
				$leftItemDom.removeClass("active");
			}
		};
		/**
		 * 分组创建成功后刷新页面
		 */
		scope.refreshOnSaveGroup = function() {
			var $newGroupDom = $(".np-create-new-group");
			//清空输入值
			$newGroupDom.find(".np-new-group-name").val("");
			//收起添加分组面板
			$newGroupDom.slideUp(200);
			//收起结果容器
			$('.search-result-content').animate({
				top: "94px"
			});
		};

		//初始化页面
		scope.init = function (conctroller, mapSelectView) {
			//保存地图页面对象
			_mapSelectView = mapSelectView;
			//保存控制器对象
			_controller = conctroller;
			//初始化信息窗模板
			MapCommon.loadTemplate(_templateUrl, function (compiler) {
				//保存模板对象
				_compiler = compiler;
			}, function () {
				notify("数据模板初始化失败！");
			});
		};

		return scope;

	}({}, jQuery));

});
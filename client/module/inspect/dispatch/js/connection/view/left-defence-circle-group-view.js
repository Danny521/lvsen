/**
 * Created by Zhangyu on 2015/4/24.
 */
define([
	"js/npmap-new/map-common",
	"js/npmap-new/map-permission",
	"js/npmap-new/map-common-overlayer-ctrl",
	"jquery",
	"jquery.pagination"
], function (MapCommon, pvamapPermission, MapOverLayerCtrl, jQuery) {

	return (function (scope, $) {

		var	//地图部分防控圈对象
			_mapCircleView = null,
			//防控圈分组，是否是第一次加载
			_isFirstLoad = true,
			//模板渲染对象
			_compiler = null,
			//控制器对象
			_controller = null,
			//模板对象
			_templateUrl = "inc/connection/left-defence-circle.html",
			//事件处理程序
			_eventHandler = {
				//显示或者隐藏某分组下的防控圈列表
				ShowHideCircles: function (e) {
					if ($(e.target).parent().hasClass('route-team-button')) {
						return;
					}
					_showHideCircleList.call(this);
					//e.stopPropagation();
				},
				//删除防控圈分组
				DeleteCircleGroup: function (e) {
					_deleteCircleGroup.call(this);
					e.stopPropagation();
				},
				//保存编辑的防控圈分组名字
				SaveEditGroupName: function (e) {
					_editGroupName.call(this);
					e.stopPropagation();
				},
				//保存添加新的分组
				SaveNewCircleGroup: function (e) {
					_saveNewGroup.call(this);
					e.stopPropagation();
				},
				//添加新防控圈到分组
				AddNewCircle: function (e) {
					_checkCurGroupCircleNum.call(this);
					e.stopPropagation();
				},
				//在编辑防控圈分组名字时，输入框点击事件需要取消冒泡
				ModifyGroupNameFocus: function (e) {
					e.stopPropagation();
				},
				//编辑防控圈
				EditCircle: function (e) {
					_editCircle.call(this);
					e.stopPropagation();
				},
				//删除防控圈
				DeleteCircle: function (e) {
					_delCircle.call(this);
					e.stopPropagation();
				},
				//显示防控圈下的摄像机
				ShowHideCameras: function (e) {
					_showHideCameraList.call(this);
					e.stopPropagation();
				},
				//搜索防控圈
				SearchCircles: function(e) {
					_searchCircles.call(this);
					e.stopPropagation();
				},
				//播放摄像机视频
				PlayCamera: function(e) {
					_playCameraOnMap.call(this);
					e.stopPropagation();
				},
				//添加布防
				AddDefence: function(e) {
					_setVideoDefence.call(this);
					e.stopPropagation();
				},
				//发送电视墙
				SendToWall: function(e) {
					_sendToTvWall.call(this);
					e.stopPropagation();
				}
			};

		var /**
			 * 绑定事件
			 * @param selector - 选择器，为适应动态绑定
			 * @private
			 */
			_bindEvents = function(selector) {

				$(selector).find("[data-handler]").map(function () {
					$(this).off($(this).data("event")).on($(this).data("event"), _eventHandler[$(this).data("handler")]);
				});

			},
			/**
			 * 点击防控圈分组标题栏事件，隐藏或显示防控圈列表
		     * @private
			 */
			_showHideCircleList = function(){
				var $circleListContainer = $(this).next();
				//判断是显示还是收缩
				if(!$circleListContainer.is(":visible")) {
					//判断是否已经加载过，如果是，则直接显示
					if (!$circleListContainer.hasClass("loaded")) {
						//没有加载过，需要请求
						var groupId = $(this).closest(".route-team").data("id");
						//请求当前组下的防控圈列表
						_controller.getCirclesByGroupID(groupId);
					}
				}
			},
			/**
			 * 删除防控圈分组
			 * @private
			 */
			_deleteCircleGroup = function() {
				//获取待删除的分组信息
				var id = $(this).closest(".route-team").data("id");
				//提示用户
				new ConfirmDialog({
					title: '删除防控圈组',
					confirmText: '确定',
					message: "确定要删除该防控圈组吗？",
					callback: function() {
						this.hide();
						//删除
						_controller.delDefenceCircleGroup(id);
					}
				});
			},
			/**
			 * 检验分组名字是否合法
			 * @param groupName - 待检验的分组名字
			 * @returns {boolean} - 是否合法
			 * @private
			 */
			_checkGroupName = function(groupName) {
				if(!groupName || groupName === "") {
					notify.warn("分组名字不能为空！");
					return false;
				}
				if(groupName.length > 30) {
					notify.warn("分组名字应在30个字符以内！");
					return false;
				}
				return true;
			},
			/**
			 * 保存修改的防控圈分组名字
			 * @private
			 */
			_editGroupName = function() {
				//收集待保存的信息
				var $obj = $(this),
					data = {
						id: $obj.closest(".route-team").data("id"),
						name: $.trim($obj.prev().val())
					};
				//检查分组名字是否合法
				if(!_checkGroupName(data.name)) {
					return;
				}
				//验证重名
				_controller.checkCircleGroupName(data);
			},
			/**
			 * 保存新建的分组
			 * @private
			 */
			_saveNewGroup = function() {
				//收集待保存的信息
				var data = {
					name: $.trim($(".new-team .new-team-name").val())
				};
				//检查分组名字是否合法
				if(!_checkGroupName(data.name)) {
					return;
				}
				//验证重名=== "'
				_controller.checkCircleGroupName(data);
			},
			/**
			 * 编辑防控圈
			 * @private
			 */
			_editCircle = function() {
				var $this = $(this),
					id = $this.data("id"),
					groupId = $this.data("groupid");
				//发布请求 获取某个防控圈信息
				_controller.getCircleInfo({id: id, groupId: groupId});
			},
			/**
			 * 删除防控圈
			 * @private
			 */
			_delCircle = function() {
				var data = $(this).closest("li.circle-item").data();
				//确认删除
				new ConfirmDialog({
					title: '删除防控圈',
					confirmText: '确定',
					message: "确定要删除该防控圈吗？",
					callback: function() {
						this.hide();
						//执行删除
						_controller.delDefenceCircleById({
							id: data.id,
							_method: "delete"
						});
					}
				});
			},
			/**
			 * 判断当前分组下的防控圈是否超限（最大5条）
			 * @private
			 */
			_checkCurGroupCircleNum = function() {
				var groupId = $(this).closest(".route-team").data("id");
				//发布请求 获取该防控圈组下的防控圈数目
				var circlesNum = _controller.getDefenceCircleNumsInGroup({
					id: groupId
				});
				//验证
				if(circlesNum <= 5){
					_initNewCirclePage.call(this, groupId);
				} else {
					notify.warn("防控圈分组下最多能建6条防控圈！");
				}
			},
			/**
			 * 创建新的防控圈，初始化创建页面
			 * @param groupId - 当前分组id
			 * @private
			 */
			_initNewCirclePage = function(groupId) {
				//新建防控圈时，显示防控圈相关图层和资源图层
				MapOverLayerCtrl.showAndHideOverLayers("on-show-defence-circle-info", "new-circle");
				//初始化
				require(["js/connection/view/left-defence-circle-new-view"], function(newCircleView){
					newCircleView.initPageOnNew(groupId, _controller);
				});
			},
			/**
			 * 点击防控圈列表，显示或者隐藏防控圈下的摄像机列表
			 * @private
			 */
			_showHideCameraList = function() {
				var $this = $(this);
				//先判断是否是搜索模式
				var isSearch = false;
				if (!($this.closest("div.route-team")[0])) {
					isSearch = true;
				}
				//判断是否已经被选中
				var $checkboxDom = $this.find("b.checkbox"), $cameraListDom = $this.next(), id = $this.closest(".circle-item").data("id");
				if (!$checkboxDom.hasClass("checked")) {
					//新建防控圈时，显示防控圈相关图层和资源图层
					MapOverLayerCtrl.showAndHideOverLayers("on-show-defence-circle-info", "circle-detail");
					//选中
					$checkboxDom.addClass("checked");
					//判断是否加载过
					if (!$this.hasClass("loaded")) {
						//如果搜索状态，则只显示摄像机
						if (isSearch) {
							_controller.getCircleCameras(id, false, true); //搜索时不高亮
						} else {
							_controller.getCircleCameras(id, true, false); //分组下高亮
						}
					} else {
						if (isSearch) {
							//显示摄像机列表
							$cameraListDom.slideDown(200);
							//在地图上显示该防控圈的摄像机不高亮
							_mapCircleView.showCamerasAndHighlightCircle($this.parent(), isSearch);
						} else {
							//显示摄像机列表
							$cameraListDom.slideDown(200);
							//在地图上显示该防控圈的摄像机并高亮
							_mapCircleView.showCamerasAndHighlightCircle($this.parent());
						}
					}
				} else {
					$checkboxDom.removeClass("checked");
					//隐藏下拉列表
					$cameraListDom.slideUp(200);
					//隐藏高亮和摄像机
					_mapCircleView.hideCamerasAndRemoveHighligh(id, isSearch);
					//如果在搜索的情况下，checkbox均被取消，则显示资源图层
					if(isSearch && $this.closest(".search-business-result").find("b.checkbox.checked").length === 0) {
						//已经全部取消
						MapOverLayerCtrl.showAndHideOverLayers("on-show-defence-circle-info", "check-none");
					}
				}
			},
			/**
			 * 搜索防控圈
			 * @private
			 */
			_searchCircles = function() {
				var key = $.trim($(".sidebar-search-div input.search-circle").val());
				//搜索防控圈时，显示清空防控圈相关图层并显示资源列表
				MapOverLayerCtrl.showAndHideOverLayers("on-show-defence-circle-info", "circle-search");
				//判断输入长度
				if(key.length > 30) {
					notify.warn("搜索内容应在30个字符以内！");
					return;
				}
				//判断查询是否为空，如果是，则显示分组
				if (key.trim() === "") {
					//重置标记位
					_isFirstLoad = true;
					//返回防控圈组列表
					_controller.dealOnDefenceCircle();
					return;
				} else {
					//隐藏分页
					$(".pagination").empty();
				}
				//搜素防控圈
				_controller.searchDefenceCircles(key);
			},
			/**
			 * 设置视频布防
			 * @private
			 */
			_setVideoDefence = function() {
				var data = $(this).closest("li.np-circle-camera-item").data();
				//判断是否有权限访问该摄像头 by zhangyu on 2015/2/11
				if(!pvamapPermission.checkDefencePermissionById(data.id, "access-defense-on-select-camera")){
					return;
				}
				/**require(["/module/protection-monitor/defencesetting/js/main.js"], function(DefenceLogical) {
					//进入布防
					DefenceLogical.init({
						cameraId:data.id,
						evtype:0
					});
				});
				**/
				window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/protection-monitor/newStructAlarmmgr/?defenceCamearaId=" + data.id);
			},
			/**
			 * 选中左侧搜索结果，在地图上播放摄像机
			 * @private
			 */
			_playCameraOnMap = function(){
				var $this = $(this), $cameraLiDom = $this.closest(".np-circle-camera-item"), camera = $this.closest(".np-circle-camera-item").data();
				//判断是否已经在播放
				if($this.hasClass("camera-stop")) {
					//更新样式
					$this.addClass("camera-play").removeClass("camera-stop").attr("title", "播放实时视频");
					$cameraLiDom.removeClass("active");
					//关闭信息窗
					window.infowindow.closeInfoWindow();
					return;
				}
				//判断资源权限 by zhangyu on 2015/2/11
				if(!pvamapPermission.checkCameraPermissionById(camera.id, "play-batch-real-video-on-select-result")) {
					return;
				}
				//判断是否有视频指挥模块的实时视频的权限，如果有则进入，没有就提示。  by zhangyu 2015.02.11
				if(!pvamapPermission.checkRealStreamPlay("search-result-dbclick-on-btn")) {
					return;
				}
				//切换其他分组/防控圈的摄像机播放状态(定位播放摄像机一次只允许播放一条防控圈)
				if($this.closest(".search-business-result")[0]){
					//搜索的情况下
					$this.closest(".search-business-result").find(".camera-item-button .camera-stop").removeClass("camera-stop").addClass("camera-play").attr("title", "播放实时视频");
				} else {
					//分组的情况下
					$this.closest(".np-defence-circle-group").find(".camera-item-button .camera-stop").removeClass("camera-stop").addClass("camera-play").attr("title", "播放实时视频");
				}
				//切换按钮样式到停止状态
				$this.removeClass("camera-play").addClass("camera-stop").attr("title", "停止播放");
				$cameraLiDom.addClass("active").siblings().removeClass("active").find(".camera-stop").addClass("camera-play").removeClass("camera-stop");
				//响应地图上的点位，并播放视频
				_mapCircleView.linkageToMapGeometry(camera.id);
			},
			/**
			 * 发送到电视墙
			 * @private
			 */
			_sendToTvWall = function() {
				//获取摄像机参数
				var data = $(this).closest("li.np-circle-camera-item").data();
				//发送到电视墙
				require(["js/npmap-new/map-common-tvwall", "js/npmap-new/map-variable"], function(TVWall, Variable) {
					//保存电视墙所需要的数据信息
					Variable.currentCameraData = data;
					//发送到电视墙
					TVWall.sendToTvwall();
				});
			};

		//初始化页面
		scope.init = function (conctroller, mapCircleView) {
			//保存地图防控圈对象
			_mapCircleView = mapCircleView;
			//保存控制器对象
			_controller = conctroller;
			//初始化信息窗模板
			MapCommon.loadTemplate(_templateUrl, function (compiler) {
				//保存模板对象
				_compiler = compiler;
			}, function () {
				notify("防控圈数据模板初始化失败！");
			});
			//搜索防控圈
			$(".sidebar-search-div input.search-circle").watch({
				wait: 200,
				captureLength: 0,
				//监听的输入长度
				callback: function(key) {
					//搜索防控圈时，清空防控圈相关图层，显示资源列表
					MapOverLayerCtrl.showAndHideOverLayers("on-show-defence-circle-info", "circle-search");
					//根据关键字进行查询
					if (key.trim() === "") {
						//重置标记位
						_isFirstLoad = true;
						//返回防控圈组列表
						_controller.dealOnDefenceCircle();
						return;
					} else {
						//隐藏分页
						$(".pagination").empty();
					}
					//判断输入长度
					if(key.length > 30) {
						notify.warn("搜索内容应在30个字符以内！");
						return;
					}
					//搜素防控圈
					_controller.searchDefenceCircles(key);
				}
			});
		};
		/**
		 * 显示防控圈分组列表
		 * @param data - 待显示的分组数据
		 */
		scope.setDefenceCircleGroups = function(data) {
			//渲染防控圈列表
			$(".defence-circle").find('.np-defence-circle-group').children().remove(".route-team, .search-business-result, .no-result-style").end().append(_compiler({
				groups: true,
				list: data
			}));
			//绑定事件
			_bindEvents(".defence-circle");

			//判断是否已经显示分页了
			if(!_isFirstLoad) {
				return;
			}
			//判断是否显示分页
			if (data.total > 1) {
				$(".pagination").pagination(data.groupCount, {
					items_per_page: 10,
					num_display_entries: 2,
					num_edge_entries: 1,
					callback: function (pageIndex) {
						if(pageIndex === 0 && _isFirstLoad) {
							_isFirstLoad = false;
							return;
						}
						//分页请求
						_controller.dealOnDefenceCircle({
							currentPage: pageIndex + 1,
							pageSize: 10
						});
					}
				});
			} else {
				$(".pagination").empty();
			}
		};
		/**
		 * 显示分组下的防控圈
		 * @param data - 防控圈列表
		 * @param id - 分组id
		 */
		scope.showCirclesInGroup = function(data, id) {
			var $container = $(".route-team[data-id='" + id + "']").find(".route-team-body");
			//渲染防控圈列表
			$container.empty().html(_compiler({
				circles: true,
				list: data
			}));
			$container.addClass("loaded");
			//绑定事件
			_bindEvents(".route-team[data-id='" + id + "'] .route-team-body");
			//在地图上显示防控圈及缓冲区
			_mapCircleView.showCirclesAndBufferOnMap($container.find(".circle-item"));
		};
		/**
		 * 分组删除后刷新列表
		 * @param id - 分组id
		 */
		scope.refreshOnDelGroup = function(id) {
			$(".route-team[data-id='" + id + "']").slideUp(300, function() {
				$(this).remove();
				//判断是否是最后一个
				if ($(".np-defence-circle-group .np-circle-group-item").length === 0) {
					$(".defence-circle").find('.np-defence-circle-group').append("<p class='no-result-style'>暂没有分组数据。</p>");
				}
			});
		};
		/**
		 * 分组修改或编辑后刷新列表
		 * @param data - 分组信息
		 */
		scope.refreshOnSaveOrEditGroup = function(data) {
			if (data.id) {
				var $groupDom = $(".route-team[data-id='" + data.id + "']");
				//编辑分组
				$groupDom.find(".route-team-name").attr("title", data.name).text(data.name);
				//收起修改面板（模拟取消事件）
				$groupDom.find(".route-team-form button.cancle-button").trigger("click");
			} else {
				//重置标记位
				_isFirstLoad = true;
				//添加分组
				_controller.dealOnDefenceCircle();
				//收起添加面板(模拟取消事件的点击)
				$(".defence-circle .new-team").find("button.cancle-button").trigger("click");
			}
		};
		/**
		 * 删除防控圈后刷新页面
		 * @param id - 已删除的防控圈id
		 */
		scope.refreshOnDelCircle = function(id) {
			var $delCircleDom = $(".defence-circle .circle-item[data-id='" + id + "']"),
				$circleNumDom = $delCircleDom.closest(".route-team").find(".route-team-number em");
			//改变该组防控圈的总数
			var total = $.trim($circleNumDom.text());
			if (total !== "") {
				total = parseInt(total) - 1;
			} else {
				total = 0;
			}
			$circleNumDom.text(total);
			//删除列表DOM行
			$delCircleDom.slideUp(200, function() {
				//判断是否是最后一个
				if($delCircleDom.siblings().length === 0) {
					$delCircleDom.closest(".route-team-body").append("<p class='no-result-style'>该分组下暂没有防控圈。</p>");
				}
				//删除节点
				$(this).remove();
			});
			//删除图层上该防控圈内容
			_mapCircleView.hideCamerasAndRemoveHighligh(id, true);
		};
		/**
		 * 显示防控圈下的摄像机列表
		 * @param data - 摄像机数据
		 * @param id - 防控圈id
		 * @param isHighlight - 在地图上是否高亮
		 * @param isSearch - 是否是搜索状态下
		 */
		scope.setCircleCameras = function(data, id, isHighlight, isSearch) {
			var $circleItemDom = $(".defence-circle").find("li.circle-item[data-id='" + id + "']");
			//渲染防控圈摄像机列表
			$circleItemDom.append($.trim(_compiler({
				cameraList: true,
				data: data
			})));
			//刷新权限,显示继续选择按钮 by zhangyu on 2015/2/12
			pvamapPermission.refreshPageByPermission("render-on-defense-circle-camera-list");
			//由于搜索防控圈和分组展现防控圈的dom样式不一样，故下面对两个均设置
			$circleItemDom.find(".route-team-info, .result-info").addClass("loaded");
			//显示该防控圈的摄像机并高亮
			if (isHighlight) {
				_mapCircleView.showCamerasAndHighlightCircle($circleItemDom);
			}
			if (isSearch) {
				_mapCircleView.showCamerasAndHighlightCircle($circleItemDom, true); //true表示只显示摄像机不高亮圈
			}
			//绑定事件
			_bindEvents(".defence-camera-list .camera-item");
		};
		/**
		 * 搜索防控圈后的页面展现
		 * @param data - 待展现的防控圈数据
		 */
		scope.setSearchedDefenceCircles = function(data) {
			//加载页面框架,渲染防控圈列表
			$(".defence-circle").find('.np-defence-circle-group').children().remove(".route-team, .search-business-result, .no-result-style").end().append(_compiler({
				showSearch: true,
				list: data
			}));
			//绑定事件
			_bindEvents(".defence-circle .search-business-result");
		};

		return scope;

	}({}, jQuery));

});
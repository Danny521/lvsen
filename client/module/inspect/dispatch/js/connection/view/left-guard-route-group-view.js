/**
 * Created by Zhangyu on 2015/4/28.
 */
define([
	"js/connection/view/left-guard-route-play-view",
	"js/npmap-new/map-variable",
	"js/npmap-new/map-common",
	"js/npmap-new/map-permission",
	"js/npmap-new/map-common-overlayer-ctrl",
	"jquery",
	"jquery.pagination"
], function (LeftGuardRoutePlayView, Variable, MapCommon, pvamapPermission, MapOverLayerCtrl, jQuery) {

	return (function (scope, $) {

		LeftGuardRoutePlayView.init(scope);

		var //控制器对象
			_controller = null,
			//警卫路线地图控制对象
			_mapRouteView = null,
			//模板渲染对象
			_compiler = null,
			//警卫路线分组，是否是第一次加载
			_isFirstLoad = true,
			//模板对象
			_templateUrl = "inc/connection/left-guard-route-group.html",
			//事件处理程序
			_eventHandler = {
				//显示/隐藏路线列表
				ShowHideRoutes: function (e) {
					if ($(e.target).parent().hasClass('route-team-button')) {
						return;
					}
					if ($(e.target).hasClass("route-team-form")) {
						e.stopPropagation();
						return;
					}
					_showHideRoutes.call(this);
					//e.stopPropagation();
				},
				//添加警卫路线到分组
				AddGuardRoute: function (e) {
					//验证警卫路线播放，如果是，则不可以进行操作
					if (_checkPlayStatus()) {
						_initNewRoutePage.call(this);
					}
					e.stopPropagation();
				},
				BuildNewRouteGroup: function(e) {
					var curDom = this;
					//验证警卫路线播放，如果是，则不可以进行操作
					if (_checkPlayStatus()) {
						$(this).closest('.route-header').find('.new-team').off('click', '.cancle-button').on('click', '.cancle-button', function(e) {
							$(curDom).trigger('click');
						}).stop(0).slideToggle(500).find('input').val('');
						$(this).closest('.route-header').siblings('.route-group-container').animate({
								top: $(this).closest('.route-header').siblings('.route-group-container').position().top > 100 ? "95px" : "207px"
							},
							500);
					}
					e.stopPropagation();
				},
				//新建警卫路线分组
				SaveNewRouteGroup: function (e) {
					//验证警卫路线播放，如果是，则不可以进行操作
					if (_checkPlayStatus()) {
						_saveEditGroupName.call(this, 0);
					}
					e.stopPropagation();
				},
				//保存修改分组名字
				ModifyGroupName: function (e) {
					_saveEditGroupName.call(this, 1);
					e.stopPropagation();
				},
				//删除分组
				DeleteGroup: function (e) {
					//验证警卫路线播放，如果是，则不可以进行操作
					if (_checkPlayStatus()) {
						_delGuardRouteGroup.call(this);
					}
					e.stopPropagation();
				},
				//鼠标在分组名输入框中点击时，取消冒泡
				ModifyGroupNameFocus: function (e) {
					e.stopPropagation();
				},
				//搜索警卫路线
				SearchRoutes: function (e) {
					//验证警卫路线播放，如果是，则不可以进行操作
					if (_checkPlayStatus()) {
						_searchRoutes.call(this);
					}
					e.stopPropagation();
				},
				//播放警卫路线
				PlayRoute: function (e) {
					LeftGuardRoutePlayView.tiggerPlayGuardRoute.call(this);
					e.stopPropagation();
				},
				//播放暂停警卫路线
				StopPausePlay: function (e) {
					LeftGuardRoutePlayView.tiggerStopPlayGuardRoute.call(this);
					e.stopPropagation();
				},
				//配置警卫路线
				ConfigRoute: function (e) {
					//验证警卫路线播放，如果是，则不可以进行操作
					if (_checkPlayStatus()) {
						_showHideConfigPanel.call(this);
					}
					e.stopPropagation();
				},
				//编辑警卫路线
				EditRoute: function (e) {
					//验证警卫路线播放，如果是，则不可以进行操作
					if (_checkPlayStatus()) {
						_editGuardRoute.call(this);
					}
					e.stopPropagation();
				},
				//删除警卫路线
				DelRoute: function (e) {
					//验证警卫路线播放，如果是，则不可以进行操作
					if (_checkPlayStatus()) {
						_delGuardRoute.call(this);
					}
					e.stopPropagation();
				},
				//警卫路线配置保存
				ConfigRouteSave: function (e) {
					_saveRouteConfig.call(this);
					e.stopPropagation();
				},
				//警卫路线配置取消
				ConfigRouteCancel: function (e) {
					_cancelRouteConfig.call(this);
					e.stopPropagation();
				},
				//展现或者隐藏警卫路线的摄像机列表
				ShowHideCameraList: function (e) {
					if ($(e.target).hasClass('np-route-header-info') || $(e.target).parent().hasClass('np-route-header-info')) {
						_showHideCamerasList.call(this);
					}
					e.stopPropagation();
				},
				//选中警卫路线
				CheckGuardRoute: function (e) {
					_checkGuardRoute.call(this);
					e.stopPropagation();
				},
				//播放警卫路线摄像机
				PlayCamera: function (e) {
					//验证警卫路线播放，如果是，则不可以进行操作
					if (_checkPlayStatus()) {
						_playCameraOnMap.call(this);
					}
					e.stopPropagation();
				},
				//添加警卫路线摄像机到视频布防
				AddDefence: function (e) {
					//验证警卫路线播放，如果是，则不可以进行操作
					if (_checkPlayStatus()) {
						_setVideoDefence.call(this);
					}
					e.stopPropagation();
				},
				//发送警卫路线摄像机到电视墙
				SendToWall: function (e) {
					//验证警卫路线播放，如果是，则不可以进行操作
					//if(_checkPlayStatus()){
					_sendToTvWall.call(this);
					//}
					e.stopPropagation();
				},
				//警卫路线分组面板上的home面包屑
				GuardRouteGroupHome: function (e) {
					if (Variable.isUserDoPlayRoute) {
						notify.warn("当前正在播放警卫路线，请先停止播放，再进行操作！");
						e.stopPropagation();
					}
				},
				//上一个摄像机按钮的点击事件
				preRouteCamera: function (e) {
					LeftGuardRoutePlayView.tiggerPreRouteCamera.call(this);
					e.stopPropagation();
				},
				//下一个摄像机按钮的点击事件
				nextRouteCamera: function (e) {
					LeftGuardRoutePlayView.tiggerNextRouteCamera.call(this);
					e.stopPropagation();
				}
			};
		var	/**
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
			 * 显示/隐藏警卫路线列表
		     * @private
			 */
			_showHideRoutes = function(){
				var $routeListContainer = $(this).next();
				//判断是显示还是收缩
				if(!$routeListContainer.is(":visible")) {
					//判断是否已经加载过，如果是，则直接显示
					if (!$routeListContainer.hasClass("loaded")) {
						//没有加载过，需要请求
						var groupId = $(this).closest(".np-guard-route-group").data("id");
						//请求当前组下的防空圈列表
						_controller.getRoutesInGroup(groupId);
					}
				}
			},
			/**
			 * 删除警卫路线分组
			 * @private
			 */
			_delGuardRouteGroup = function() {
				//删除分组
				var groupId = $(this).closest(".np-guard-route-group").data("id"),
					name = $(this).closest(".np-guard-route-group").data("name");
				//用户确认
				new ConfirmDialog({
					title: '删除警卫路线分组',
					confirmText: '确定',
					message: "确定要删除该警卫路线分组吗？",
					callback: function() {
						this.hide();
						//执行删除
						_controller.dealDelGroup(groupId, name);
					}
				});
			},
			/**
			 * 校验待保存的警卫路线分组名字
			 * @param groupId - 待保存的警卫路线分组名字的分组id，修改名字时有效
			 * @param groupName - 待保存的警卫路线分组名字
			 * @private
			 */
			_checkGroupName = function(groupId, groupName){
				//获取分组的id和名字
				var partern = /^[\w\u4e00-\u9fa5]+$/gi;
				//第一步：对组名进行检测（只允许中文 数字 字母 下划线）
				if (!groupName || groupName === "") {
					notify.warn("组名不能为空！");
					return false;
				}
				if (!partern.test(groupName)) {
					notify.warn("组名中含有除中文、数字、字母、下划线以外的其他字符，请检查更正！");
					return false;
				}
				if(groupName.length > 30) {
					notify.warn("分组名字应在30个字符以内！");
					return false;
				}
				//检验重名
				if(!_controller.checkGroupNameExists(groupId, groupName)){
					return false
				}

				return true;
			},
			/**
			 * 保存编辑警卫路线的名字
			 * @param tag - 为0新建，为1编辑
			 * @private
			 */
			_saveEditGroupName = function(tag){
				//获取分组的id和名字
				var groupName = (tag === 0) ? $.trim($(".np-guard-route .new-team .np-new-group-name").val()) : $.trim($(this).prev().val()),
					groupId = (tag === 0) ? -1 : $(this).closest(".np-guard-route-group").data("id");
				//校验名字
				if(!_checkGroupName(groupId, groupName)) {
					return;
				}
				//保存警卫路线分组
				_controller.dealSaveGroup(groupName, parseInt(groupId));
			},
			/**
			 * 搜索警卫路线
			 * @private
			 */
			_searchRoutes = function() {
				var key = $.trim($(".np-guard-route input.np-search-route").val());
				//查询警卫路线时，清楚警卫路线相关图层，显示资源列表
				MapOverLayerCtrl.showAndHideOverLayers("on-show-guard-route-info", "route-search");
				//判断输入长度
				if(key.length > 30) {
					notify.warn("搜索内容应在30个字符以内！");
					return;
				}
				//判断查询是否为空，如果是，则显示分组
				if (key.trim() === "") {
					//返回警卫路线组列表
					_controller.dealOnGuardRouteGroup();
					return;
				}
				//重置标记位
				_isFirstLoad = true;
				//搜素警卫路线
				_controller.searchGuardRoutes({
					current_page: 1,
					page_size: 10,
					name: key
				});
			},
			/**
			 * 删除警卫路线
			 * @private
			 */
			_delGuardRoute = function() {
				var $routeDom = $(this).closest("li.np-route-item"),
					routeId = $routeDom.data("id"),
					routeName = $routeDom.data("name");
				//用户确认
				new ConfirmDialog({
					title: '删除警卫路线',
					confirmText: '确定',
					message: "确定要删除该警卫路线吗？",
					callback: function() {
						this.hide();
						//删除
						_controller.delGuardRoute(routeId, routeName);
					}
				});
			},
			/**
			 * 配置警卫路线，隐藏或者显示设置面板
			 * @private
			 */
			_showHideConfigPanel = function() {
				var $configPanelDom = $(this).closest("li.np-route-item").find(".np-route-config");
				//收起和展开
				if ($configPanelDom.is(":visible")) {
					//收起
					$configPanelDom.slideUp(200);
				} else {
					//展开
					$configPanelDom.slideDown(200);
				}
			},
			/**
			 * 取消设置警卫路线
			 * @private
			 */
			_cancelRouteConfig = function() {
				$(this).closest(".np-route-config").slideUp(200);
			},
			/**
			 * 警卫路线配置保存
			 * @private
			 */
			_saveRouteConfig = function() {
				var $thisRouteDom = $(this).closest("li.np-route-item"),
					$configPanelDom = $(this).closest("li.np-route-item").find(".np-route-config"),
					routeId = $thisRouteDom.data("id"),
					name = $thisRouteDom.data("name"),
					time = $.trim($configPanelDom.find("input.np-config-time").val()),
					gpsId = $.trim($configPanelDom.find("input.np-config-gpsid").val()),
					code = $.trim($configPanelDom.find("input.np-config-code").val()),
					reg = /^\+?[1-9][0-9]*$/; //正整数
				//检测时间
				if(!time.match(/^\d+$/g)){
					notify.warn("间隔时间必须为大于0的正整数");
					return;
				}
				if(time.match(/^0$/g)){
					notify.warn("间隔时间必须为大于0的正整数");
					return;
				}
				//检车车队代号和gps编号
				if(gpsId.length > 20) {
					notify.warn("GPS编号应在20个字符以内！");
					return;
				}
				if(code.length > 20) {
					notify.warn("车队代号应在20个字符以内！");
					return;
				}
				if (reg.test(time)) {
					//发布请求 设置警卫路线时间
					var data = {
						Id: routeId,
						gpsId: gpsId,
						code: code
					};
					_controller.saveGuardrouteConfig(data, name);
				}
			},
			/**
			 * 添加警卫路线按钮处理事件，初始化页面
			 * @private
			 */
			_initNewRoutePage = function() {
				var groupId = $(this).closest(".np-guard-route-group").data("id");
				//新建警卫路线时，清除警卫路线相关资源图层，显示资源列表
				MapOverLayerCtrl.showAndHideOverLayers("on-show-guard-route-info", "new-route");
				//初始化
				require(["js/connection/view/left-guard-route-new-view"], function (newRouteView) {
					newRouteView.initPageOnNew(groupId, _controller);
				});
			},
			/**
			 * 操作警卫路线分组上的相关功能时，需要判断播放状态，合适就继续，否则截止
			 * @private
			 */
			_checkPlayStatus = function() {
				//如果是正在播放状态
				if (Variable.isUserDoPlayRoute){
					notify.warn("当前正在播放警卫路线，请先停止播放，再进行操作！");
					return false;
				}
				return true;
			},
			/**
			 * 编辑警卫路线
			 * @private
			 */
			_editGuardRoute = function() {
				var groupId = $(this).closest(".np-guard-route-group").data("id"),
					routedata = $(this).closest("li.np-route-item").data();
				//编辑警卫路线时，清除警卫路线相关图层并显示，隐藏资源图层
				MapOverLayerCtrl.showAndHideOverLayers("on-show-guard-route-info", "edit-route");
				//初始化
				require(["js/connection/view/left-guard-route-new-view"], function (newRouteView) {
					newRouteView.editGuardRoute(routedata, groupId, _controller);
				});
			},
			/**
			 * 显示隐藏摄像机列表
			 * @private
			 */
			_showHideCamerasList = function() {
				scope.showGuardRoute(this, "titleclick");
			},
			/**
			 * 勾选警卫路线处理程序
			 * @private
			 */
			_checkGuardRoute = function() {
				var $this = $(this), $LiDom = $this.closest("li.np-route-item");
				//更新checkbox状态
				$this.toggleClass("checked");
				//切换状态
				$LiDom.toggleClass("active");
				//根据是否已经展开显示和隐藏地图上的警卫路线
				if ($LiDom.hasClass("active")) {
					$LiDom.addClass("active");
					_mapRouteView.setRouteInfoOnMap($LiDom.data(), 1, scope);
				} else {
					$LiDom.removeClass("active");
					_mapRouteView.cancelGuardRouteOnMapById($LiDom.data().id);
					//判断是否都取消完了
					if($(".np-route-checkbox.checked").length === 0) {
						//当警卫路线前面的选中为零时，切换图层，显示资源列表
						MapOverLayerCtrl.showAndHideOverLayers("on-show-guard-route-info", "check-none");
					}
				}
			},
			/**
			 * 设置视频布防
			 * @private
			 */
			_setVideoDefence = function() {
				var data = $(this).closest("li.np-group-route-camera-item").data();
				//判断是否有权限访问该摄像头 by zhangyu on 2015/2/11
				if(!pvamapPermission.checkDefencePermissionById(data.id, "access-defense-on-select-camera")){
					return;
				}
				window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/protection-monitor/newStructAlarmmgr/?defenceCamearaId=" + data.id);
				/**require(["/module/common/defencesetting/js/main.js"], function(DefenceLogical) {
					//进入布防
					DefenceLogical.DefenceInitial(data, "mapping");
				});
**/
			},
			/**
			 * 选中左侧搜索结果，在地图上播放摄像机
			 * @private
			 */
			_playCameraOnMap = function(){
				var $this = $(this), $cameraLiDom = $this.closest(".np-group-route-camera-item"), camera = $this.closest(".np-group-route-camera-item").data();
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
				//切换其他分组/路线的摄像机播放状态(定位播放摄像机一次只允许播放一条警卫路线)
				if($this.closest(".np-search-guard-route-list")[0]){
					//搜索的情况下
					$this.closest(".np-search-guard-route-list").find(".camera-item-button .camera-stop").removeClass("camera-stop").addClass("camera-play").attr("title", "播放实时视频");
				} else {
					//分组的情况下
					$this.closest(".np-guard-route").find(".camera-item-button .camera-stop").removeClass("camera-stop").addClass("camera-play").attr("title", "播放实时视频");
				}
				//切换按钮样式到停止状态
				$this.removeClass("camera-play").addClass("camera-stop").attr("title", "停止播放");
				$cameraLiDom.addClass("active").siblings().removeClass("active").find(".camera-stop").addClass("camera-play").removeClass("camera-stop");
				//响应地图上的点位，并播放视频
				_mapRouteView.linkageToMapGeometry(camera, 1);
			},
			/**
			 * 发送到电视墙
			 * @private
			 */
			_sendToTvWall = function() {
				//获取摄像机参数
				var data = $(this).closest("li.np-group-route-camera-item").data();
				//发送到电视墙
				require(["js/npmap-new/map-common-tvwall", "js/npmap-new/map-variable"], function(TVWall, Variable) {
					//保存电视墙所需要的数据信息
					Variable.currentCameraData = data;
					//发送到电视墙
					TVWall.sendToTvwall();
				});
			};
		/**
		 * 渲染并显示分组
		 * @param data - 待显示的分组数据
		 */
		scope.refreshOnGetGroupList = function(data) {
			//渲染模板
			$(".np-guard-route").find('.np-route-group-container').children().remove(".np-guard-route-group, .np-search-guard-route-list, .no-result-style").end().append($.trim(_compiler({
				guardrouteGroupList: data
			})));
			//绑定事件
			_bindEvents(".np-guard-route");
			//隐藏分页
			$(".pagination").empty();
		};
		/**
		 * 显示分组下的警卫路线列表
		 * @param data - 待显示的数据
		 * @param groupId - 当前警卫路线分组id
		 */
		scope.setGuardroutesInGroup = function(data, groupId) {
			var $groupLiDom = $(".np-guard-route .np-guard-route-group[data-id='" + groupId + "']");
			//渲染数据
			$groupLiDom.find(".np-guard-route-list").empty().html($.trim(_compiler({
				guardrouteList: data
			}))).addClass("loaded");
			//刷新权限,显示继续选择按钮 by zhangyu on 2015/2/12
			pvamapPermission.refreshPageByPermission("render-on-guardroute-fill-group");
			//绑定事件
			_bindEvents(".np-guard-route .np-routes-list");
		};
		/**
		 * 删除分组，刷新页面
		 * @param groupId - 删除分组时的分组id
		 */
		scope.refreshOnDelGroup = function(groupId) {
			//删除成功后刷新页面
			$(".np-guard-route .np-guard-route-group[data-id='" + groupId + "']").slideUp(200, function () {
				$(this).remove();
				//判断是否是最后一个
				if($(".np-guard-route .np-guard-route-group").length === 0) {
					$(".np-guard-route").find('.np-route-group-container').append("<p class='no-result-style'>当前没有分组数据。</p>");
				}
			});
		};
		/**
		 * 保存编辑/新建分组后刷新页面
		 * @param groupId - 分组id（编辑时有效）
		 * @param groupName - 分组名称（编辑时有效）
		 * @param tag - 为0新建、为1为修改
		 */
		scope.refreshOnSaveGroup = function(groupId, groupName, tag) {
			if (tag === 0) {
				var $newPanelDom = $(".np-guard-route .new-team");
				//刷新列表
				_controller.dealOnGuardRouteGroup();
				//收起添加面板(模拟取消事件的点击)
				$newPanelDom.find("button.cancle-button").trigger("click");
			} else {
				var $routeGroup = $(".np-guard-route .np-guard-route-group[data-id='" + groupId + "']");
				//更新信息
				$routeGroup.data("name", groupName);
				$routeGroup.find(".route-team-name").attr("title", groupName).text(groupName);
				//收起添加面板(模拟取消事件的点击)
				$(".np-guard-route-group[data-id='" + groupId + "'] .route-team-form").find("button.cancle-button").trigger("click");
			}
		};

		//初始化页面
		scope.init = function (conctroller, MapRouteView) {
			//保存控制器对象
			_controller = conctroller;
			//保存警卫路线地图控制对象
			_mapRouteView = MapRouteView;
			//初始化信息窗模板
			MapCommon.loadTemplate(_templateUrl, function (compiler) {
				//保存模板对象
				_compiler = compiler;
			}, function () {
				notify("数据模板初始化失败！");
			});
			//搜索警卫路线
			$(".np-guard-route input.np-search-route").watch({
				wait: 200,
				captureLength: 0,
				//监听的输入长度
				callback: function(key) {
					//验证警卫路线播放，如果是，则不可以进行操作
					if(!_checkPlayStatus()){
						return;
					}
					//查询警卫路线时，清除警卫路线相关图层，显示资源列表
					MapOverLayerCtrl.showAndHideOverLayers("on-show-guard-route-info", "route-search");
					//判断输入长度
					if(key.length > 30) {
						notify.warn("搜索内容应在30个字符以内！");
						return;
					}
					//重置标记位
					_isFirstLoad = true;
					//判断是否为空，然后请求分组
					if (key.trim() === "") {
						//返回警卫路线组列表
						_controller.dealOnGuardRouteGroup();
						return;
					}
					//搜素警卫路线
					_controller.searchGuardRoutes({
						current_page: 1,
						page_size: 10,
						name: key
					});
				}
			});
		};
		/**
		 * 显示搜索结果
		 * @param data
		 */
		scope.getGuardRouteListSuccess = function(data) {

			$(".np-guard-route").find('.np-route-group-container').children().remove(".np-guard-route-group, .np-search-guard-route-list, .no-result-style").end().append($.trim(_compiler({
				searchResult: data
			})));
			//刷新权限,显示继续选择按钮 by zhangyu on 2015/2/12
			pvamapPermission.refreshPageByPermission("render-on-get-guard-route-list");
			//绑定事件
			_bindEvents(".np-guard-route .np-routes-list");
		};
		/**
		 * 处理 警卫路线列表
		 * @author Li Dan
		 * @date   2014-12-24
		 */
		scope.showSearchRoutes = function(data, name) {
			//加载搜索结果
			scope.getGuardRouteListSuccess(data);
			//判断是否已经显示分页了
			if(!_isFirstLoad) {
				return;
			}
			//分页加载
			if (data.total > 1) {
				$(".pagination").pagination(data.count, {
					items_per_page: 10,
					num_display_entries: 2,
					num_edge_entries: 1,
					callback: function (pageIndex) {
						if(pageIndex === 0 && _isFirstLoad) {
							_isFirstLoad = false;
							return;
						}
						_controller.searchGuardRoutes({
							current_page: pageIndex + 1,
							page_size: 10,
							name: name
						});
					}
				});
			} else {
				$(".pagination").empty();
			}
		};
		/**
		 * 删除警卫路线后的刷新
		 * @param routeId - 已删除的警卫路线id
		 */
		scope.delGuardRouteSuccess = function(routeId){
			var $routeDom = $(".np-routes-list li[data-id='" + routeId + "']");
			//获取当前内容是否是搜索后的结果
			var isSearchMode = $routeDom.closest(".np-routes-list").hasClass("np-search-guard-route-list");
			//删除当前对象
			$routeDom.slideUp(200, function () {
				if (isSearchMode) {
					//搜索情况下
					var curPageIndex = parseInt($(".pagination").find(".current").html()), //获取当前页
						curPageLiCount = $(this).siblings(".np-route-item").length;
					//评估分组，是否需要减一页
					if (curPageLiCount === 0) {
						if (curPageIndex > 1) {
							//显示上一页
							$(".pagination").find(".prev").trigger("click");
							//如果只剩一页数据，则影藏分页条
							if (curPageIndex === 2) {
								$(".pagination").empty();
							}
						} else {
							//第一页都删完了，全部删除
							$(".np-routes-list").html("<p class='no-result-style'>没有查询到符合的警卫路线。</p>");
						}
					}
				} else {
					//判断是否是最后一个
					if ($routeDom.siblings().length === 0) {
						var $groupNumDom = $routeDom.closest(".np-guard-route-group").find(".route-team-header .route-team-number em");
						$groupNumDom.text(0);
						$routeDom.parent().append("<p class='no-result-style'>该分组下暂没有警卫路线。</p>");
					} else {
						//修改剩余路线编号
						$routeDom.siblings().find(".np-route-index").each(function (index) {
							$(this).text(index + 1);
						});
						//修改分组上的警卫路线条数
						var $groupNumDom = $routeDom.closest(".np-guard-route-group").find(".route-team-header .route-team-number em"), curNum = parseInt($groupNumDom.text());
						$groupNumDom.text(curNum - 1);
					}
				}
				//在地图上删除该警卫路线信息
				_mapRouteView.cancelGuardRouteOnMapById(routeId);
				//删除当前对象
				$(this).remove();
			});
		};

		/**
		 * 保存警卫路线设置后刷新页面
		 * @param routeId - 警卫路线id
		 */
		scope.refreshOnSaveConfig = function (routeId) {
			$(".np-route-item[data-id='" + routeId + "']").find(".np-route-config").slideUp(200);
		};

		/**
		 * 显示影藏警卫路线
		 * @param obj - 当前触发的dom对象
		 * @param clicktype - 事件类型
		 */
		scope.showGuardRoute = function(obj, clicktype) {
			var This = $(obj);
			if (This.hasClass("loaded")) {
				if (clicktype === "playclick") {
					LeftGuardRoutePlayView.playGuardRoute(This);
				} else {
					This.closest("li.np-route-item").find(".np-group-camera-content").slideToggle(200);
				}
			} else {
				This.addClass("loaded");
				if (clicktype !== "playclick") {
					This.closest("li").find("p.play,div.content").slideToggle(200);
				}
				//根据警卫路线的id获取警卫路线下的摄像机列表
				var routeData = This.closest("li.np-route-item").data();
				//读取数据库中的摄像机列表
				_controller.getCamerasInRoute({
					routeData: routeData,
					clicktype: clicktype
				});
			}
		};

		/**
		 * 获取某警卫路线相关的摄像机
		 * @param routeId - 根据路线id获取对应的摄像机列表
		 * @returns {Array} - 摄像机列表
		 * @private
		 */
		scope.getThisGuardRouteCameras = function(routeId) {
			var cameras = [],
				$routeDom = $(".np-routes-list").find(".np-route-item[data-id='" + routeId + "']");
			//如果摄像机已经加载
			if ($routeDom.hasClass("loaded")) {
				var $CameraItemLI = $routeDom.find("ul.np-group-camera-list li");
				for (var i = 0, j = $CameraItemLI.length; i < j; i++) {
					cameras.push($($CameraItemLI[i]).data());
				}
				return cameras;
			} else {
				//读取数据库中的摄像机列表
				return _controller.getCamerasInRouteAsync(routeId);
			}
		};

		/**
		 * 获取警卫路线摄像机后处理
		 * @param data - 待显示的警卫路线摄像机数据
		 * @param clicktype - 操作类型
		 * @param routeId - 警卫路线id
		 */
		scope.setCamerasInRoute = function(data, clicktype, routeData) {
			var $routeDom = $(".np-routes-list").find(".np-route-item[data-id='" + routeData.id + "']");
			//第一步：填充摄像机列表
			$routeDom.children().remove(".np-group-camera-content").end().append($.trim(_compiler({
				cameraList: true,
				cameraData: data,
				routeData: routeData
			})));
			//绑定事件
			_bindEvents(".np-group-camera-content");
			//刷新权限,显示继续选择按钮 by zhangyu on 2015/2/12
			pvamapPermission.refreshPageByPermission("render-on-guardroute-fill-route");
			//第二步：在地图上显示路线
			if ($routeDom.hasClass("active")) {
				_mapRouteView.showRouteOnFocus($routeDom.data());
			} else {
				$routeDom.find(".np-route-checkbox").trigger("click");
			}
			//拖动元素到电视墙上
			$(".np-group-route-camera-item").find(".np-group-route-camera-name").each(function (index, item) {
				var data = $(this).closest("li.np-group-route-camera-item").data();
				$(item).draggable({
					helper: "clone",
					zIndex: 1000,
					cursor: "pointer",
					scope: 'tasks',
					appendTo: ".tvList",
					cursorAt: {
						"left": -10
					},
					start: function (event, ui) {
						window.gTvwallArrayGis === [];
						//参数 0：cameracode 1：id 2：name 3：hdchannel 4：sdchannel
						var cameracode = data.cameracode, id = data.id, name = data.name, hdchannel = data.hdchannel, sdchannel = data.sdchannel;
						window.gTvwallArrayGis = [cameracode, id, name, hdchannel, sdchannel];
					}
				});
			});
			if (clicktype === "playclick") {
				LeftGuardRoutePlayView.playGuardRoute($routeDom);
			}
		};
		/**
		 * 播放警卫路线前获取该警卫路线的摄像机列表
		 * @param routeLI - 待播放警卫路线的Li文档对象
		 * @param routeId - 警卫路线的id
		 * @param time - 事件间隔
		 */
		scope.getRouteCameras = function($routeLI, routeId, time) {
			var cameras = [];
			//如果摄像机已经加载
			if ($routeLI.hasClass("loaded")) {
				var CameraItemLI = $routeLI.find("ul.np-group-camera-list li.np-group-route-camera-item");
				for (var i = 0, j = CameraItemLI.length; i < j; i++) {
					cameras.push($(CameraItemLI[i]).data());
				}
			} else {
				//同步请求摄像机列表
				cameras = _controller.getCamerasInRouteAsync(routeId);
			}
			//播放视频
			LeftGuardRoutePlayView.startPlayGuardRoute($routeLI, time, routeId, cameras);
		};
		/**
		 * 警卫路线播放时根据gpsid获取gps即时位置信息
		 * @param gpsId - gpsid
		 */
		scope.getGpsPositionById = function(gpsId) {
			return _controller.getGpsPositionById(gpsId);
		};

		return scope;

	}({}, jQuery));

});
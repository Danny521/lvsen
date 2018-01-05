/**
 * Created by Zhangyu on 2015/4/28.
 */
define([
	"js/npmap-new/map-common-overlayer-ctrl",
	"js/sidebar/sidebar",
	"js/npmap-new/map-common",
	"js/npmap-new/map-permission",
	"js/npmap-new/map-drag",
	"js/npmap-new/map-variable",
	"jquery"
], function (MapOverLayerCtrl, SideBar, MapCommon, pvamapPermission, DragItems, Variable, jQuery) {

	return (function (scope, $) {
		var //警卫路线分组控制器对象，用于回调
			_groupController = null,
			//地图警卫路线对象
			_mapRouteView = null,
			//控制器对象
			_controller = null,
			//模板渲染对象
			_compiler = null,
			//模板对象
			_templateUrl = "inc/connection/left-guard-route-new.html",
			//事件处理程序
			_eventHandler = {
				//勾选摄像机
				CheckSelectCamera: function (e) {
					_selectCheckCamera.call(this);
					e.stopPropagation();
				},
				//绘制警卫路线
				DrawRoute: function(e) {
					_drawPoliceLine.call(this);
					e.stopPropagation();
				},
				//框选摄像机
				RectSelectCamera: function (e) {
					_rectSelectCamera.call(this);
					e.stopPropagation();
				},
				//检查警卫路线重名
				CheckRouteName: function (e) {
					_checkRouteName.call(this);
					e.stopPropagation();
				},
				//动态修改缓冲区
				ModifyBuffer: function (e) {
					_modifyBuffer.call(this);
					e.stopPropagation();
				},
				//保存警卫路线
				SaveGuardRoute: function (e) {
					_saveRoute.call(this);
					e.stopPropagation();
				},
				//警卫路线摄像机列表的向上排序移动
				SortUp: function(e){
					//向上移动摄像机Dom
					_moveUpOrDown.call(this);
					e.stopPropagation();
				},
				//警卫路线摄像机列表的向下排序移动
				SortDown: function(e){
					//向下移动摄像机Dom
					_moveUpOrDown.call(this);
					e.stopPropagation();
				},
				//警卫路线摄像机列表的删除摄像机事件
				DeleteCamera: function(e){
					//删除摄像机对象
					_delRouteCamera.call(this);
					e.stopPropagation();
				},
				//编辑、新建警卫路线时，点击摄像机列表项，在地图上播放摄像机视频
				PlayCamera: function(e) {
					//在地图上播放摄像机
					_playCameraOnMap.call(this);
					e.stopPropagation();
				},
				//勾选摄像机之后获取勾选
				GetCheckCameras: function(e) {
					_getCheckedCameras.call(this);
					e.stopPropagation();
				},
				//警卫路线编辑、新建过程中，点击面包屑“警卫路线”，提示用是否放弃编辑或者保存
				BackToRouteGroup: function(e) {
					_isBackToGroup.call(this);
					e.stopPropagation();
				},
				//新建/编辑警卫路线时，点击面包屑中的“home”按钮，回到业务列表
				GoBackToBusiness: function(e){
					_isBackToBusiness.call(this);
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
			 * 检测缓冲大小的合法性
			 * @param dis
			 * @private
			 */
			_checkDistance = function(dis) {
				//是否为空
				if(dis === "") {
					notify.warn("搜索范围不能为空！");
					return false;
				}
				//判断是否是数字
				var partern = /^\+?[0-9][0-9]*$/gi;
				//判断是否是数子
				if (!partern.test(dis)) {
					notify.warn("搜索范围必须是非负整数值！");
					return false;
				}
				//检验合法性
				var distance = parseInt(dis);
				if (distance < 0 || distance > 1000) {
					notify.warn("搜索距离应在0~1000米！");
					return false;
				} else {
					return true;
				}
			},
			/**
			 * 动态修改缓冲区大小
			 * @private
			 */
			_modifyBuffer = function() {
				var dis = $.trim(jQuery(this).val());
				//检测缓冲大小的合法性
				if(!_checkDistance(dis)) {
					return;
				}
				//改变缓冲区size
				_mapRouteView.modifyBuffer(dis);
			},
			/**
			 * 校验警卫路线名字是否重名
			 * @private
			 */
			_checkRouteName = function() {
				var $container = $(".np-new-guard-route"),
					id = $.trim($container.find(".np-new-route-info").data("id")),
					groupId = $.trim($container.find(".np-new-route-info").data("groupid"));
				var data = {
					id:  (id && id !== "") ? id : "",
					name: $.trim($(this).val()),
					groupId: groupId
				};
				if(data.name.length > 30) {
					notify.warn("警卫路线名称应在30个字符以内！");
					return;
				}
				//重名验证
				if(!_checkRouteNameExists(data)) {
					notify.warn("该警卫路线名称已存在！");
				}
			},
			/**
			 * 检测警卫路线名字重名(共用，保存时也要校验)
			 * @param data - 防控圈信息
			 * @private
			 */
			_checkRouteNameExists = function(data){
				var params = {
					id: data.id || data.routeId || "",
					name: data.name,
					groupId: data.groupId
				}
				return _controller.checkRouteNameExists(params);
			},
			/**
			 * 绘制警卫路线
			 * @private
			 */
			_drawPoliceLine = function() {
				var dis = $.trim($("#distance").val());
				//检测缓冲大小的合法性
				if(!_checkDistance(dis)) {
					return;
				}
				//配置绘制参数
				var drawParam = {
					distance: dis
				};
				//触发绘制警卫路线
				_mapRouteView.drawRoute(drawParam, scope);
			},
			/**
			 * 框选摄像机
			 * @private
			 */
			_rectSelectCamera = function() {
				_mapRouteView.rectSelectCamerasToGuardroute(scope);
			},
			/**
			 * 向上向下移动摄像机元素
			 * @private
			 */
			_moveUpOrDown = function() {
				var $this = $(this).closest("li.camera-item"),
					ThisNext = $this.next(),
					ThisPrev = $this.prev();
				if ($(this).hasClass("camera-up")) {
					if (ThisPrev) {
						$this.after(ThisPrev);
					}
					return;
				}
				if ($(this).hasClass("camera-down")) {
					if (ThisNext) {
						ThisNext.after($this);
					}
				}
			},
			/**
			 * 删除警卫路线摄像机
			 * @private
			 */
			_delRouteCamera = function() {
				//删除地图上的对象
				var cameraId = $(this).closest("li.camera-item").data("id");
				_mapRouteView.deleteCameraMarker(cameraId);
				//执行删除
				$(this).closest("li").slideUp(200, function(){
					$(this).remove();
					var num = $(".np-new-route-opera .camera-num").html();
					num = num?parseInt(num)-1:0;
					$(".np-new-route-opera .camera-num").html(num);
				});
			},
			/**
			 * 保存警卫路线（包括编辑和新建）
			 * @private
			 */
			_saveRoute = function() {
				var routeId = $(".np-new-route-info").data("id"),
					groupId = $(".np-new-route-info").data("groupid");
				if (routeId === "") {
					scope.saveGuardRoute("save", "", groupId);
				} else {
					scope.saveGuardRoute("edit", routeId, groupId);
				}
			},
			/**
			 * 警卫路线保存时验证数据合法性
			 * @param data - 待保存的数据
			 * @returns {boolean} - 返回检测通过与否
			 * @private
			 */
			_validateData = function(data) {
				//如果没有地图信息则不能提交
				if (!data.pointinfo) {
					notify.warn("请在地图上绘制警卫路线！");
					return false;
				}
				//判断警卫路线的名字
				if (!data.name || data.name === "") {
					notify.warn("警卫路线名称不能为空！");
					return false;
				}
				if(data.name.length > 30) {
					notify.warn("警卫路线名称应在30个字符以内！");
					return false;
				}
				//重名验证
				if (!_checkRouteNameExists(data)) {
					notify.warn("该警卫路线名称已存在！");
					return false;
				}
				//检测起始点名称
				if (!data.startName || data.startName === "") {
					notify.warn("起点名称不能为空！");
					return false;
				}
				if(data.startName.length > 30) {
					notify.warn("起点名称应在30个字符以内！");
					return false;
				}
				//检测终点名称
				if (!data.stopName || data.stopName === "") {
					notify.warn("终点名称不能为空！");
					return false;
				}
				if(data.stopName.length > 30) {
					notify.warn("终点名称应在30个字符以内！");
					return false;
				}
				//检车gps编号和车队代码
				if(data.gpsId.length > 20) {
					notify.warn("GPS编号应在20个字符以内！");
					return false;
				}
				if(data.code.length > 20) {
					notify.warn("车队代号应在20个字符以内！");
					return false;
				}
				//检测搜索范围的合法性
				if (!_checkDistance(data.distance)) {
					return false;
				}
				//检测摄像机列表是否为空
				return true;
			},
			/**
			 * 选中左侧搜索结果，在地图上播放摄像机
			 * @private
			 */
			_playCameraOnMap = function(){
				var $this = $(this), camera = $this.closest(".np-route-camera").data();
				//判断资源权限 by zhangyu on 2015/2/11
				if(!pvamapPermission.checkCameraPermissionById(camera.id, "play-batch-real-video-on-select-result")) {
					return;
				}
				//判断是否有视频指挥模块的实时视频的权限，如果有则进入，没有就提示。  by zhangyu 2015.02.11
				if(!pvamapPermission.checkRealStreamPlay("search-result-dbclick-on-btn")) {
					return;
				}
				//响应地图上的点位，并播放视频
				_mapRouteView.linkageToMapGeometry(camera, 0);
			},
			/**
			 * 勾选警卫路线摄像机
			 * @private
			 */
			_selectCheckCamera = function() {
				//判断是否已经绘制了警卫路线
				if(!_mapRouteView.checkPloylineExists()) {
					notify.warn("您还未绘制警卫路线，请点击起点开始绘制！");
					return;
				}
				var operaName = _getOperaType();
				//渲染勾选警卫路线摄像机相关
				SideBar.push({
					name: "#sidebar-body",
					markName: "selectRouteCameras",
					template: $.trim(_compiler({
						selectRouteCameras: true,
						operaName: operaName
					}))
				});
				//延迟加载
				window.setTimeout(function(){
					//渲染勾选树
					window.tree.renderOrgTree(true, $(".np-camera-check-tree"));
					//绑定事件
					_bindEvents(".np-route-select-camera");
				}, 50);
			},
			/**
			 * 获取勾选摄像机树上已经勾选的摄像机
			 * @private
			 */
			_getCheckedCameras = function() {
				var childrenNode = [], //用于存放被勾选的tree节点下面的所有leaf节点，
					groupsId = [], camerasData = [], //用于存放leaf节点的相关信息
					self = this, nodes = $('li.node > a > i.checked').closest("li.node"); //被选中的tree节点和leaf节点
				// 遍历选择的数据
				Array.from(nodes).forEach(function (item) {
					var node = $(item);
					// 判断是树节点还是叶子
					if (node.is('[data-type="group"]')) { //若为根节点并且有data-child-ids属性
						if (node.find("i.checkbox").hasClass('checked')) {
							groupsId.push(node.data('id')); //取出tree的id,放入到groupsId数组中
							childrenNode.push(node.find(".node[data-type='camera']")); //将该父节点下面的所有子节点放入到childrenNode数组中
						}
					} else {
						camerasData.push(node.data()); //将该leaf节点的data-信息放到到camerasData数组中
						childrenNode.each(function (i) {
							camerasData.pop($(i).data()); //从camerasData中移除重复(即：childrenNode)的部分
						});
					}

				});
				//对摄像机组只内的摄像机进行请求获取
				if (groupsId.length > 0) {
					//发送请求
					var cameraList = _controller.getTreeCameraByOrgIds({
						groups: groupsId.join("/"),
						type: $(".camera-tree.tree-outtest-container").data("treetype")
					});
					//拼接结果
					camerasData = camerasData.concat(cameraList);
				}
				//跳转到新建/编辑警卫路线页面
				_changePanelOnSelectOver(camerasData);
			},
			/**
			 * 警卫路线编辑/新建,勾选摄像机后返回
			 * @param camerasData - 摄像机数据
			 * @private
			 */
			_changePanelOnSelectOver = function(camerasData){
				//渲染新建/编辑警卫路线页面
				SideBar.push({
					name: "#sidebar-body",
					markName: "newOrEidtRoute"
				});
				//刷新摄像机列表
				_mapRouteView.setGeometryCameras(camerasData, true);
			},
			/**
			 * 警卫路线编辑、新建过程中，点击面包屑“警卫路线”，提示用是否放弃编辑或者保存
			 * @private
			 */
			_isBackToGroup = function() {
				//提示用户
				new ConfirmDialog({
					title: _getOperaType() + "警卫路线离开提示",
					confirmText: '确定',
					message: "您正在" + _getOperaType() + "警卫路线，确定要离开吗？",
					callback: function () {
						this.hide();
						//确定
						SideBar.push({
							name: "#sidebar-body",
							markName: "route"
						});
	                    //取消绘制警卫路线
	                    if (Variable.isDrawGraphicFlag) {
	                        Variable.drawtool.cancel();
	                        Variable.map.deactivateMouseContext();
	                        Variable.isDrawGraphicFlag = false;
	                        require(["js/npmap-new/view/task-guard-route-crud-view"], function(GuardRouteCrudView) {
	                            //警卫路线绘制右键结束时，如果已经绘制了线条，则隐藏资源图层
	                            GuardRouteCrudView.checkPloylineExists() && MapOverLayerCtrl.showAndHideOverLayers("on-show-guard-route-info", "on-right-end");
	                        });
	                    }
						//清除地图上的覆盖物
						MapOverLayerCtrl.showAndHideOverLayers("map-business-clear");
					}
				});
			},
			/**
			 * 获取当前警卫路线编辑的类型，新建/编辑
			 * @returns {string} - 操作类型
			 * @private
			 */
			_getOperaType = function() {
				var $editOrNewRouteDom = $(".np-new-guard-route"), operaName = "";

				if ($editOrNewRouteDom.length === 0) {
					//勾选摄像机
					operaName = $(".np-route-select-camera").data("opera");
				} else {
					//编辑/新建页面
					var routeId = $(".np-new-guard-route").find(".np-new-route-info").data("id");
					operaName = (routeId && $.trim(routeId) !== "") ? "编辑" : "新建";
				}

				return operaName;
			},
			/**
			 * 点击面包屑“home”，跳转到业务列表
			 * @private
			 */
			_backToBusiness = function() {
				//页面跳转
				SideBar.push({
					name: "#sidebar-body",
					markName: "business"
				});
				//清除地图上的覆盖物
				MapOverLayerCtrl.showAndHideOverLayers("map-business-clear");
				//取消绘制警卫路线
                if (Variable.isDrawGraphicFlag) {
                    Variable.drawtool.cancel();
                    Variable.map.deactivateMouseContext();
                    Variable.isDrawGraphicFlag = false;
                    require(["js/npmap-new/view/task-guard-route-crud-view"], function(GuardRouteCrudView) {
                        //警卫路线绘制右键结束时，如果已经绘制了线条，则隐藏资源图层
                        GuardRouteCrudView.checkPloylineExists() && MapOverLayerCtrl.showAndHideOverLayers("on-show-guard-route-info", "on-right-end");
                    });
                }
			},
			/**
			 * 点击home按钮
			 * @private
			 */
			_isBackToBusiness = function() {

				//提示用户
				new ConfirmDialog({
					title: _getOperaType() + "警卫路线离开提示",
					confirmText: '确定',
					message: "您正在" + _getOperaType() + "警卫路线，确定要离开吗？",
					callback: function () {
						this.hide();
						//确定
						_backToBusiness();
					}
				});
			};
		/**
		 * 新建警卫路线，初始化页面
		 * @param groupId - 待新建警卫路线的组id
		 * @param groupController - 组控制器，回调使用
		 */
		scope.initPageOnNew = function(groupId, groupController) {
			//清除地图上页面的上下文
			_mapRouteView.clearRouteMapContext();
			//保存组控制器
			_groupController = groupController;
			//加载框架
			SideBar.push({
				name: "#sidebar-body",
				markName: "newOrEidtRoute",
				template: $.trim(_compiler({
					routeFrame: true,
					data: {
						eventType: "新建"
					}
				}))
			});
			//设置表单内容
			$(".np-new-guard-route .np-new-route-content").empty().html(_compiler({
				addOrEditRoute: true,
				data: {
					groupId: groupId
				}
			}));
			//绑定事件
			_bindEvents(".np-new-guard-route");
		};
		/**
		 * 编辑警卫路线，渲染左侧页面
		 * @param routeData - 警卫路线数据
		 * @param groupId - 所属分组id
		 * @param groupController - 组控制器，回调使用
		 */
		scope.editGuardRoute = function(routeData, groupId, groupController) {
			//保存组控制器
			_groupController = groupController;
			//加载地图信息
			_mapRouteView.setRouteInfoOnMap(routeData, 0, scope, {
				distance: routeData.distance
			});
			//加载框架
			SideBar.push({
				name: "#sidebar-body",
				markName: "newOrEidtRoute",
				template: $.trim(_compiler({
					routeFrame: true,
					data: {
						eventType: "编辑"
					}
				}))
			});
			//设置表单内容
			$(".np-new-guard-route .np-new-route-content").empty().html(_compiler({
				addOrEditRoute: true,
				data: {
					groupId: groupId,
					routeData: routeData
				}
			}));
			//绑定事件
			_bindEvents(".np-new-guard-route");
		};
		/**
		 * 获取当前警卫路线已存在的摄像机列表
		 * @returns {Array} - 摄像机数据
		 */
		scope.getAlreadyCameras = function () {
			var $LIs = $(".np-new-guard-route .np-route-camera-list").find("li.camera-item"),
				oldCameras = [];
			//遍历左侧摄像机列表
			for (var i = 0, j = $LIs.length; i < j; i++) {
				var camera = $($LIs[i]).data();
				oldCameras.push(camera);
			}
			//返回
			return oldCameras;
		};
		/**
		 * 显示左侧的摄像机
		 * @param data - 待显示的摄像机列表
		 * @param tag - 为0表示展现缓冲区的摄像机,编辑时渲染的摄像机，为1标示展现框选后的摄像机
		 */
		scope.renderLeftCameraList = function(data, tag) {
			if(tag === 0) {
				$(".np-new-guard-route").find(".np-route-camera-list").empty().html($.trim(_compiler({
					cameraList: true,
					routedata: data
				})));
			} else {
				$(".np-new-guard-route").find(".np-route-camera-list").append($.trim(_compiler({
					cameraList: true,
					routedata: data
				})));
			}
			//绑定拖动事件
			new DragItems("np-route-camera-list", 2); //add by zhangyu, 2014-4-24,绑定鼠标拖动功能
			//绑定摄像机事件
			_bindEvents(".np-new-guard-route .np-route-camera-list");
		};

		/**
		 * 保存警卫路线
		 * @param type edit为编辑，save为新建
		 * @param routeId 警卫路线id，编辑时有效
		 * @param groupId 分组id
		 */
		scope.saveGuardRoute = function (type, routeId, groupId) {
			//取消绘制警卫路线
            if (Variable.isDrawGraphicFlag) {
                Variable.drawtool.cancel();
                Variable.map.deactivateMouseContext();
                Variable.isDrawGraphicFlag = false;
            }
			//获取摄像机列表
			var $cameras = $(".np-route-camera-list li.np-route-camera");
			var cameras = "", sorts = "";
			for (var i = 0, j = $cameras.length; i < j; i++) {
				if (i === j - 1) {
					cameras += $($cameras[i]).data("id");
					sorts += i + 1;
				} else {
					cameras += $($cameras[i]).data("id") + "-";
					sorts += i + 1 + "-";
				}
			}
			//获取地图上的参数
			var routeInfo = _mapRouteView.getRouteInfo();
			//配置保存参数
			var data = {
				name: $.trim($("#routeName").val()),
				gpsId: $.trim($("#gpsId").val()),
				code: $.trim($("#carCode").val()),
				startName: $.trim($("#startName").val()),
				startPoint: routeInfo.startPoint,
				stopName: $.trim($("#stopName").val()),
				stopPoint: routeInfo.stopPoint,
				pointinfo: routeInfo.pointinfo,
				distance: $.trim($("#distance").val()),
				bufferPoint: routeInfo.bufferPoint,
				cameras: cameras,
				zoom: routeInfo.zoom,
				sorts: sorts
			};
			//触发保存
			data.groupId = groupId;
			data.type = type;
			data.routeId = routeId;
			//参数校验
			if (!_validateData(data)) {
				return;
			}
			if (type === "save") {
				//新建---保存
				_controller.saveNewGuardroute(data);
			} else {
				//编辑---保存
				data._method = "put";
				_controller.saveEditGuardroute(data);
			}
		};
		/**
		 * 保存成功后，刷新页面，跳转至警卫路线列表
		 */
		scope.refreshOnSave = function() {
			//插入框架
			SideBar.push({
				name: "#sidebar-body",
				markName: "route"
			});
			//刷新警卫路线列表
			_groupController.dealOnGuardRouteGroup();
			//清除地图上的覆盖物
			MapOverLayerCtrl.showAndHideOverLayers("map-business-clear");
		};

		//初始化页面
		scope.init = function (conctroller, mapRouteView) {
			//保存地图警卫路线对象
			_mapRouteView = mapRouteView;
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
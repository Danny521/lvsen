/**
 * Created by Zhangyu on 2015/4/24.
 */
define([
	"js/npmap-new/map-common-overlayer-ctrl",
	"js/sidebar/sidebar",
	"js/npmap-new/map-common",
	"jquery"
], function (MapOverLayerCtrl, SideBar, MapCommon, jQuery) {

	return (function (scope, $) {
		var //组控制器，用户回调刷新
			_groupController = null,
			//地图部分防控圈对象
			_mapCircleView = null,
			//控制器对象
			_controller = null,
			//保存模板对象
			_compiler = null,
			//模板对象
			_templateUrl = "inc/connection/left-defence-circle-new.html",
			//事件处理程序
			_eventHandler = {
				SaveOrEditCircle: function(e) {
					_saveOrEditCircle.call(this);
					e.stopPropagation();
				},
				//新建或者编辑防控圈时，初始化绘制工具
				DrawLine: function (e) {
					_drawDefenceCircle.call(this);
					e.stopPropagation();
				},
				//新建或者编辑防控圈时，初始化框选工具
				MapSelect: function (e) {
					_selectCameras.call(this);
					e.stopPropagation();
				},
				//修改缓冲区大小
				ModifyBuffer: function(e) {
					_modifyBuffer.call(this);
					e.stopPropagation();
				},
				//删除摄像机
				DeleteCamera: function(e) {
					_deleteCamera.call(this);
					e.stopPropagation();
				},
				//用户输入防控圈名字时，进行重名校验
				CheckCircleName: function(e) {
					//重名验证
					_checkCircleName.call(this);
					e.stopPropagation();
				},
				//编辑、新建防控圈时，点击"防控圈"面包屑，回跳到分组页面
				BackToCircleGroup: function(e) {
					_isBackToGroup.call(this);
					e.stopPropagation();
				},
				//新建/编辑防控圈时，点击面包屑中的“home”按钮，回到业务列表
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
			 * 触发绘制防控圈
			 * @private
			 */
			_drawDefenceCircle = function() {
				var dis = $.trim($("#distance").val());
				//检测缓冲大小的合法性
				if(!_checkDistance(dis)) {
					return;
				}
				//配置绘制参数
				var drawParam = {
					lineColor: $(this).next().attr("data-color") || "#FF000",
					distance: dis
				};
				//清空左侧的摄像机列表
				$(".defence-circle-new .defence-circle-camera").find(".camera-list").empty();
				//触发绘制防控圈
				_mapCircleView.drawCircle(drawParam);
			},
			/**
			 * 框选摄像机
			 * @private
			 */
			_selectCameras = function() {
				_mapCircleView.rectSelectCameras(scope);
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
				_mapCircleView.modifyBuffer(dis);
			},
			/**
			 * 删除左侧摄像机列表中的某个摄像机
			 * @private
			 */
			_deleteCamera = function() {
				var $thisItem = $(this).closest("li.camera-item"), cameraId = $thisItem.data().id;
				//删除左侧摄像机
				$thisItem.slideUp(200, function() {
					$(this).remove();
				});
				//删除地图上的点位
				_mapCircleView.deleteCameraMark(cameraId);
			},
			/**
			 * 保存防控圈（包括新建保存和编辑保存）
			 * @private
			 */
			_saveOrEditCircle = function() {
				var $container = $(".defence-circle-new");
				//获取摄像机列表信息
				var cameraIds = "";
				$container.find(".camera-list li.camera-item").each(function () {
					cameraIds += $(this).data("id") + "-";
				});
				cameraIds = cameraIds.substring(0, cameraIds.length - 1);
				//获取防控圈在地图上的信息
				var circleInfo = _mapCircleView.getCircleInfo();
				//组装参数
				var data = {
					name: $.trim($("#name").val()),
					pointInfo: circleInfo.pointInfo,
					color: $container.find(".color-selected").data("color"),
					zoom: circleInfo.zoom,
					distance: $.trim($("#distance").val()),
					bufferPoint: circleInfo.bufferPoint,
					type: "",
					userId: "",
					groupId: $container.find(".defence-circle-build-content").data("groupid"),
					cameraIds: cameraIds,
					description: $.trim($("#discription").val())
				};
				//如果含有id表明是编辑，则添加属性
				var id = $.trim($container.find(".defence-circle-build-content").data("id"));
				if (id && id !== "") {
					data.id = id;
				}
				//验证参数
				if (_validateData(data)) {
					//发布请求 保存防控圈
					_controller.saveOrEditCircle(data);
				}
			},
			/**
			 * 防控圈保存时验证数据合法性
			 * @param data - 待保存的数据
			 * @returns {boolean} - 返回检测通过与否
			 * @private
			 */
			_validateData = function(data) {
				//如果没有地图信息则不能提交
				if (!data.pointInfo) {
					notify.warn("请在地图上绘制防控圈！");
					return false;
				}
				//判断防控圈的名字
				if(!data.name || data.name === "") {
					notify.warn("防控圈名称不能为空！");
					return false;
				}
				if(data.name.length > 30) {
					notify.warn("防控圈名称应在30个字符以内！");
					return false;
				}
				//重名验证
				if(!_checkCircleNameExists(data)) {
					notify.warn("防控圈名称已存在！");
					return false;
				}
				//检测搜索范围的合法性
				if(!_checkDistance(data.distance)) {
					return false;
				}
				//检测描述字数
				//检测摄像机列表是否为空
				return true;
			},
			/**
			 * 用户输入防控圈名字时，进行重名校验
			 * @private
			 */
			_checkCircleName = function() {
				var $container = $(".defence-circle-new"),
					id = $.trim($container.find(".defence-circle-build-content").data("id"));
				var data = {
					id:  (id && id !== "") ? id : "",
					groupId: $container.find(".defence-circle-build-content").data("groupid"),
					name: $.trim($("#name").val())
				}
				if(data.name.length > 30) {
					notify.warn("防控圈名称应在30个字符以内！");
					return;
				}
				//重名验证
				if(!_checkCircleNameExists(data)) {
					notify.warn("防控圈名称已存在！");
				}
			},
			/**
			 * 检测防控圈名字重名
			 * @param data - 防控圈信息
			 * @private
			 */
			_checkCircleNameExists = function(data){
				var data = {
					id: data.id ? data.id : "",
					groupId: data.groupId,
					name: data.name
				}
				return _controller.checkCircleNameExists(data);
			},
			/**
			 * 警卫路线编辑、新建过程中，点击面包屑“警卫路线”，提示用是否放弃编辑或者保存
			 * @private
			 */
			_isBackToGroup = function() {
				//提示用户
				new ConfirmDialog({
					title: _getOperaType() + "防控圈离开提示",
					confirmText: '确定',
					message: "您正在" + _getOperaType() + "防控圈，确定要离开吗？",
					callback: function () {
						this.hide();
						//确定
						SideBar.push({
							name: "#sidebar-body",
							markName: "defence-circle"
						});
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

				//编辑/新建页面
				var circleId = $(".defence-circle-new").find(".defence-circle-build-content").data("id");

				var operaName = (circleId && $.trim(circleId) !== "") ? "编辑" : "新建";

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
			},
			/**
			 * 点击home按钮
			 * @private
			 */
			_isBackToBusiness = function() {

				//提示用户
				new ConfirmDialog({
					title: _getOperaType() + "防控圈离开提示",
					confirmText: '确定',
					message: "您正在" + _getOperaType() + "防控圈，确定要离开吗？",
					callback: function () {
						this.hide();
						//确定
						_backToBusiness();
					}
				});
			};
		/**
		 * 获取当前防控圈已存在的摄像机列表
		 * @returns {Array} - 摄像机数据
		 */
		scope.getAlreadyCameras = function () {
			var $LIs = $(".defence-circle-new .defence-circle-camera").find("li.camera-item"),
				oldCameras = [];
			//遍历左侧摄像机列表
			for (var i = 0, j = $LIs.length; i < j; i++) {
				var camera = jQuery($LIs[i]).data();
				oldCameras.push(camera);
			}
			//返回
			return oldCameras;
		};
		/**
		 * 地图上框选摄像机后，渲染左侧摄像机列表
		 * @param data - 带渲染的摄像机列表数据
		 */
		scope.renderLeftCameraList = function(data) {
			var params = {
				newCircleCameraList: true,
				circleCameras: {
					cameras: data
				}
			};
			//渲染列表
			$(".defence-circle-new .defence-circle-camera").find(".camera-list").append(_compiler(params));
			//绑定删除事件
			_bindEvents(".defence-circle-new .camera-list");
		};

		/**
		 * 设置防控圈信息(编辑时)
		 * @param data - 防控圈信息
		 * @param groupId - 分组id
		 * @param groupController - 组控制器，用户回调刷新
		 */
		scope.setCircleInfo = function(data, groupId, groupController) {
			//保存组控制器
			_groupController = groupController;
			//加载地图信息
			_mapCircleView.setCircleInfoOnMap(data, groupId, {
				lineColor: data.color || "#FF000",
				distance: data.distance
			});
			//插入框架
			SideBar.push({
				name: "#sidebar-body",
				markName: "newOrEidtCircle",
				template: $.trim(_compiler({
					circleFrame: true,
					data: {
						eventType: "编辑"
					}
				}))
			});
			//渲染编辑列表
			data.groupId = groupId;
			scope.setCirclePage(data);
		};

		/**
		 * 根据防控圈内容，【编辑】时渲染左侧数据列表
		 * @param data - 防控圈内容
		 */
		scope.setCirclePage = function(data) {

			//设置表单内容
			$(".defence-circle-new .defence-circle-build").empty().html(_compiler({
				addOrEditCircle: true,
				data: data
			}));

			//触发获取颜色点击事件
			$(".defenseCircleAdd .CircleForm .color-select").trigger("click");

			//绑定事件
			_bindEvents(".defence-circle-new");
		};
		/**
		 * 保存防控圈后的刷新事件
		 */
		scope.refreshOnSave = function(){
			//插入框架
			SideBar.push({
				name: "#sidebar-body",
				markName: "defence-circle"
			});
			//刷新防控圈列表
			_groupController.dealOnDefenceCircle();
			//清除地图上的覆盖物
			MapOverLayerCtrl.showAndHideOverLayers("map-business-clear");
		};

		/**
		 * 新建防控圈时，初始化页面的组id
		 * @param groupId - 组id
		 * @param groupController - 组控制器，用户回调刷新
		 */
		scope.initPageOnNew = function(groupId, groupController) {
			//保存组控制器
			_groupController = groupController;
			//插入框架
			SideBar.push({
				name: "#sidebar-body",
				markName: "newOrEidtCircle",
				template: $.trim(_compiler({
					circleFrame: true,
					data: {
						eventType: "新建"
					}
				}))
			});
			//设置表单内容
			$(".defence-circle-new .defence-circle-build").empty().html(_compiler({
				addOrEditCircle: true,
				data: {
					groupId: groupId
				}
			}));
			//绑定事件
			_bindEvents(".defence-circle-new");
			//在地图上显示其他防控圈的信息
			_mapCircleView.showOtherCirclesInGroup(groupId);
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
		};



		return scope;

	}({}, jQuery));

});
/**
 * Created by Zhangyu on 2015/4/23.
 */
define([
	"js/npmap-new/map-common-overlayer-ctrl",
	"js/sidebar/sidebar",
	"js/npmap-new/map-common",
	"jquery",
	"base.self"
], function(MapOverLayerCtrl, SideBar, mapCommon, jQuery) {

	return (function (scope, $) {

		var //控制器对象
			_controller = null,
			//控制器对象
			_mapDefencelineView = null,
			//模板渲染对象
			_compiler = null,
			//模板地址
			_templateUrl = "inc/connection/left-defence-line.html",
		    //事件处理程序
			_eventHandler = {
				//电子防线绘制按钮的业务逻辑处理事件
				DrawDefenceLine: function (e) {
					_dealOnDrawDefenceLine();
					e.stopPropagation();
				},
				//保存新的电子防线
				SaveDefenceLine: function(e) {
					_saveNewDefenceLine();
					e.stopPropagation();

				},
				//删除电子防线
				DeleteLine: function (e) {
					_getDeleteLineInfo.call(this);
					e.stopPropagation();
				},
				//在地图上显示电子防线
				ShowLineOnMap: function(e) {
					_getShowLineInfo.call(this);
					e.stopPropagation();
				},
				//电子防线的名字输入框验证重名
				CheckExitsName: function(e) {
					var name = $(this).val().trim();
					if(name !== "") {
						_controller.checkName($(this).val().trim(), null, 1);
					}
					e.stopPropagation();
				},
				//点击“电子防线”面包屑事件
				GoBackToLineList: function(e) {
					_isBackToLineList.call(this);
					e.stopPropagation();
				},
				//返回到业务列表
				GoBackToBusiness: function(e){
					_isBackToBusiness.call(this);
					e.stopPropagation();
				}
			};

		var	/**
			 * 收集待删除电子防线的信息
			 * @private
			 */
			_getDeleteLineInfo = function() {
				var el = $(this);
				//收集要删除的电子防线信息
				var id = el.data("id"), name = el.data("name");
				//弹出确认框
				new ConfirmDialog({
					title: '删除电子防线',
					confirmText: '确定',
					message: "确定要删除该电子防线吗？",
					callback: function () {
						this.hide();
						//删除电子防线
						_controller.deleteDefenceLine(id, name);
						return false;
					}
				});
			},
			/**
			 * 收集待显示的电子防线信息
		     * @private
			 */
			_getShowLineInfo = function() {
				var el = $(this);
				//收集要删除的电子防线信息
				var pointinfo = el.data("pointinfo"), color = el.attr("data-color"), zoom = el.data("zoom"), title = el.data("name");

				//显示电子防线
				_controller.showDefenceLineOnMap(pointinfo, color, zoom, title);
			},
			/**
			 * 触发绘制电子防线
			 * @private
			 */
			_dealOnDrawDefenceLine = function(){
				var color = $(".electronic-defense-new").find(".color-selected").attr("data-color");
				_controller.drawDefenceLineOnMap(color);
			},
			/**
			 * 保存电子防线
			 * @private
			 */
			_saveNewDefenceLine = function() {
				//获取电子防线相关的点位信息
				var points = _mapDefencelineView.getPolygonPoints(), container = $(".electronic-defense-new");

				if (points) {
					var obj = {
						name: container.find("#lineName").val(),
						description: container.find("#lineDescription").val(),
						color: container.find(".color-selected").attr("data-color"),
						type: 1,
						pointinfo: JSON.stringify(points),
						code: "E11",
						area: _mapDefencelineView.getPolygonArea(),
						zoom: _mapDefencelineView.getZoom()
					};

					if (obj.name === "") {
						notify.warn("名称不能为空！");
						return;
					}
					if (obj.name.length > 30) {
						notify.warn("名称长度不大于30字符！");
						return;
					}
					if (obj.description.length > 100) {
						notify.warn("描述长度不大于100字符！");
						return;
					} else {
						// 保存信息时再次进行重名验证
						_controller.checkName(obj.name.trim(), obj, 0);
					}
				} else {
					notify.warn("请在地图上添加防线！");
				}
			},
			/**
			 * 电子防线新建过程中，点击面包屑“电子防线”，提示用是否放弃保存
			 * @private
			 */
			_isBackToLineList = function() {

				var $this = $(this);

				if($this.siblings("a.np-save").is(":visible")) {
					//提示用户
					new ConfirmDialog({
						title: "新建电子防线离开提示",
						confirmText: '确定',
						message: "您正在新建电子防线，确定要离开吗？",
						callback: function () {
							this.hide();
							//页面跳转
							$this.closest('.electronic-defense').find('.electronic-defense-list').show().closest('.electronic-defense').find('.electronic-defense-new').hide();
							$this.closest('.route-header-title').find('b:odd, span:odd').remove();
							$this.removeClass('np-electronic-defense pointer').siblings('.np-build').show().siblings('.np-save').hide();
							//清除地图上的覆盖物
							MapOverLayerCtrl.showAndHideOverLayers("map-business-clear");
						}
					});
				}
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

				var $this = $(this);

				if($this.siblings("a.np-save").is(":visible")) {
					//提示用户
					new ConfirmDialog({
						title: "新建电子防线离开提示",
						confirmText: '确定',
						message: "您正在新建电子防线，确定要离开吗？",
						callback: function () {
							this.hide();
							//页面跳转
							_backToBusiness();
						}
					});
				} else {
					_backToBusiness();
				}
			};

		/**
		 * 电子防线列表显示后的事件绑定
		 * @private
		 */
		var _bindEvents = function() {

			$(".electronic-defense").find("[data-handler]").map(function () {
				$(this).off($(this).data("event")).on($(this).data("event"), _eventHandler[$(this).data("handler")]);
			});
		};
		/**
		 * 页面初始化，加载模板
		 */
		scope.init = function(controller, mapDefenceLine) {
			//保存控制器
			_controller = controller;
			//保存地图显示先关逻辑对象
			_mapDefencelineView = mapDefenceLine;
			//初始化信息窗模板
			mapCommon.loadTemplate(_templateUrl, function(compiler){
				//保存模板对象
				_compiler = compiler;
			}, function() {
				notify("电子防线列表数据模板初始化失败！");
			});
		};
		/**
		 * 显示电子防线列表
		 * @param data - 电子防线数据
		 */
		scope.showDefenceLineList = function(data){

			$(".electronic-defense-list").empty().html(_compiler({
				"defencelines": data
			}));
			//权限相关
			permission && permission.reShow();
			//绑定事件
			_bindEvents();
		};
		/**
		 * 删除电子防线时，刷新页面列表内容
		 * @param id - 已删除的电子防线id
		 */
		scope.refreshOnDelete = function(id) {
			// 清除图层
			_mapDefencelineView.clearLineOnMap();
			//更新dom
			$(".electronic-defense-list-item[data-id='" + id + "']").slideUp(200, function() {
				$(this).remove();
			});
		};
		/**
		 * 保存电子防线时，刷新页面列表内容
		 */
		scope.refreshOnSave = function() {
			// 清除图层
			_mapDefencelineView.clearLineOnMap();
			//保存成功后，清空之前的区域信息
			_mapDefencelineView.clearPolygonPoints();
			//页面跳转
			var $saveBtn = $("#SaveLineBtn");
			$saveBtn.closest('.electronic-defense').find('.electronic-defense-list').show().closest('.electronic-defense').find('.electronic-defense-new').hide();
			$saveBtn.closest('.route-header-title').find('b:odd, span:odd').remove();
			$saveBtn.removeClass('np-electronic-defense pointer').siblings('.np-build').show().siblings('.np-save').hide();
			//刷新列表
			_controller.dealOnDefenceLine();
			//清除地图上的覆盖物
			MapOverLayerCtrl.showAndHideOverLayers("map-business-clear");
		};

		return scope;

	}({}, jQuery));
});
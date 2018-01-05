/**
 * 布控任务管理view模块
 */
define([
	"pubsub",
	'js/preventcontrol-global-var',
	'js/protectcontrol-common-fun',
	'js/controller/camera-rule-controller',
	'js/view/control-linkage-view',
	'js/controller/control-linkage-control',
	'js/cameras-loader',
	'jquery.watch',
	'permission'
	],function(PubSub,globalVar,commonFun,cameraRuleSetting,linkageView,linkageControl,camerasLoader){
	var View = function(){};
	View.prototype = {
		init:function(){
			this.bindEvents();
			linkageView.init();
			this.registerHelper();
		},
		//绑定事件
		bindEvents: function() {
			var self = this;
			//新建人员布控任务
			jQuery("#CreatePeopleDefenceTask").click(function() {
				//self.editOrAddTask();
				PubSub.publish("editOrAddTask",{
					Taskname:"",
					id:""
				});
			});
			//人员布控任务操作
			jQuery(document).on("click", ".mid-bottom-panel .control-task-people-list .people-control-list .people-control-list-item p.buttons span", function() {
				//操作类型
				var This = jQuery(this);
				var type = This.data("type"),
					id = This.data("id"),
					status = This.data("status"),
					Taskname = This.closest(".people-control-list-item").find(".head").html();
				//编辑人员布控任务
				if (type === "edit") {
					PubSub.publish("editOrAddTask",{
						Taskname:Taskname,
						id:id
					});
				}
				//撤销人员布控任务
				if (type === "cancel") {
					if (status === 0) {
						commonFun.confirmDialog("确定要撤控该任务吗？", function() {
							PubSub.publish("cancelTask",{
								id:id,
								status:2,
								from:"list",
								Taskname:Taskname
							});
						});
					} else if (status === 2) {
						PubSub.publish("cancelTask",{
							id:id,
							status:0,
							from:"list",
							Taskname:Taskname
						});
					}
				}
				//删除人员布控任务
				if (type === "delete") {
					commonFun.confirmDialog("确定要删除该任务吗？", function() {
						PubSub.publish("removeTask",{
							id:id,
							Taskname:Taskname
						});
					});
				}
			});
			//人员布控任务高级搜索
			jQuery("#PeopleTaskSearch").click(function() {
				var param = {
					name: jQuery(".people-search-content").find("input[name='name']").val(),
					status: parseInt(jQuery(".people-search-content").find(".select_container .text").attr("data-value")),
					type: 1,
					pageNum: 1,
					pageSize: globalVar.configInfo.controlTaskPageSize
				};
				//self.loadPeopleControlList(param);
				PubSub.publish("loadPeopleControlList",param);
			});
			//布控任务编辑返回
			jQuery("#DefenceTaskEditReturn").click(function() {

				var msg = "";
				if (jQuery("#PeopleTaskFrom").find("input[name='id']").val() !== "") {
					msg = "布控任务编辑中";
				} else {
					msg = "布控任务新建中";
				}
				commonFun.confirmDialog(msg + "，确定要返回吗？", function() {
					//切换中间部分内容
					jQuery(".mid-top-panel").children(".control-task-list-head").addClass("active").siblings().removeClass("active");
					jQuery(".mid-bottom-panel").children(".control-task-people-list").addClass("active").siblings().removeClass("active");

					//清空面包屑
					jQuery("#major").find(".control-task .breadcrumb .section").html("&nbsp;");
					jQuery(".mid-bottom-panel").resize();
					//清除地图标注
					if (globalVar.cameraLayer) {
						globalVar.cameraLayer.removeAllOverlays();
					}
					//隐藏布控视频页面
					self.closeRuleVideoPanel();
					//隐藏摄像机资源
					//PubSub.publish("hideResourceLayers");
					//jQuery("#mapId").find(".map-resource-layers").hide();
					//隐藏信息窗口
					if (jQuery("#npgis_contentDiv")) {
						self.closeInfoWindow();
					}
					// 清除联动选择
					linkageControl.resetElement();
					linkageControl.taskId = 0;
				});
			});
			//布控摄像机删除
			jQuery(document).on("click", "#PeopleTaskFrom .camera-list .camera-item .camera-opera .delete", function() {
				var LI = jQuery(this).closest("li.camera-item");
				//var id = LI.data("id");
				//移除地图上标注
				var cameraGraphics = globalVar.cameraLayer._overlays;
				var This = jQuery(this);
				var id = This.data("id"),
					longitude = This.data("longitude"),
					latitude = This.data("latitude");
				//地图标注匹配，反色显示
				for (var key in cameraGraphics) {
					if(parseInt(cameraGraphics[key].getData().id)=== id) {
						globalVar.cameraLayer.removeOverlay(cameraGraphics[key]);
					}
				}
				//移除行
				LI.remove();
				//判断是否打开该视频并关闭
				if (jQuery(".control-video .alarm-events-content-video .content-top-video-tool").attr("data-id") == id) {
					self.closeRuleVideoPanel();
				}
			});
			//布控摄像机设置按钮的点击事件
			jQuery(document).on("click", "#PeopleTaskFrom .camera-list .camera-item .camera-opera .config", function(e) {
				e.stopPropagation();
				var list = [$(this).data("id")-0];
				if(!permission.stopFaultRightById(list)[0]){
					notify.info("暂无权限访问该摄像机",{timeout:1500});
					return false;
				}
				//关闭地图上的信息窗
				self.closeInfoWindow();
				//恢复当前设置页面dom对象状态
				jQuery(".control-camera-config.active .rule-modify input[type='button']").val("设置");
				jQuery(".control-camera-config.active .min-face input[type='button']").val("标定");
				jQuery(".control-camera-config.active .max-face input[type='button']").val("标定");
				//显示摄像机设置表单
				var This = jQuery(this);
				var LI = This.closest("li.camera-item");
				var ConfigForm = LI.find(".control-camera-config");
				//设置区的样式
				ConfigForm.toggleClass("active");
				//打开新的设置区域
				if (ConfigForm.hasClass("active")) {
					var id = LI.data("id"),
						name = LI.data("name"),
						code = LI.data("cameracode");
					//清除掉其他摄像机的设置框并保存
					self.saveAndCloseOtherPanel(LI);
					//右侧内容切换
					var template = globalVar.template({
						cameraname: name,
						cameracode: code,
						cameraid: id,
						alarmEventsContent: true
					});
					jQuery('#major .control-video').empty().html(template);
					//显示视频播放层
					jQuery('#major .control-video').show();
					//播放当前摄像头视频
					cameraRuleSetting.videoContrl.playCurCameraVideo(LI.data());
				} else {
					//关闭播放区域
					self.closeRuleVideoPanel();
				}
			});
			//布控摄像机设置面板中的保存按钮事件
			jQuery(document).on("click", "#PeopleTaskFrom .camera-list .camera-item .control-camera-config .save-protect .ui.button.save", function(e) {
				e.stopPropagation();
				//恢复当前设置页面dom对象状态
				jQuery(".control-camera-config.active .rule-modify input[type='button']").val("设置");
				jQuery(".control-camera-config.active .min-face input[type='button']").val("标定");
				jQuery(".control-camera-config.active .max-face input[type='button']").val("标定");
				//保存当前设置的框线规则到隐藏域
				var ruleInfo = self.checkRuleVilid(this);
				//对框线规则进行差错验证
				if (!ruleInfo.result) {
					return false;
				}
				//设置隐藏域
				jQuery(this).siblings("input[name='minSize']").val(ruleInfo.minFace);
				jQuery(this).siblings("input[name='maxSize']").val(ruleInfo.maxFace);
				//收起设置区域
				jQuery(this).closest(".control-camera-config").toggleClass("active");
				//关闭播放区域
				self.closeRuleVideoPanel();
			});
			//布控摄像机设置面板中的取消按钮事件
			jQuery(document).on("click", "#PeopleTaskFrom .camera-list .camera-item .control-camera-config .save-protect .ui.button.cancel", function(e) {
				e.stopPropagation();
				//恢复当前设置页面dom对象状态
				jQuery(".control-camera-config.active .rule-modify input[type='button']").val("设置");
				jQuery(".control-camera-config.active .min-face input[type='button']").val("标定");
				jQuery(".control-camera-config.active .max-face input[type='button']").val("标定");
				//收起设置区域
				jQuery(this).closest(".control-camera-config").toggleClass("active");
				//关闭播放区域
				self.closeRuleVideoPanel();
			});
			//框线规则调整按钮的点击事件
			jQuery(document).on("click", "#PeopleTaskFrom .camera-list .camera-item .control-camera-config .rule-modify .ui.button", function(e) {
				e.stopPropagation();
				//显示当前摄像机的框线规则
				cameraRuleSetting.CameraRuleSetting.showCameraRule(this);
			});
			//框线规则最小人脸标定点击事件
			jQuery(document).on("click", "#PeopleTaskFrom .camera-list .camera-item .control-camera-config .min-face .ui.button", function(e) {
				e.stopPropagation();
				cameraRuleSetting.CameraRuleSetting.showCameraMinSize(this);
			});
			//框线规则最大人脸标定点击事件
			jQuery(document).on("click", "#PeopleTaskFrom .camera-list .camera-item .control-camera-config .max-face .ui.button", function(e) {
				e.stopPropagation();
				cameraRuleSetting.CameraRuleSetting.showCameraMaxSize(this);
			});
			//框选摄像机
			jQuery(document).on("click", "#PeopleTaskFrom .camera-list-head .opera .map-select", function(e) {
				e.stopPropagation();
				//判断视频窗口是否打开，如打开需要提示关闭
				if (jQuery(".control-video .alarm-events-content-video").is(":visible")) {
					notify.warn("请先取消设置当前摄像机的布控规则！");
					return;
				}
				//框选摄像机
				PubSub.publish("rectSelectCameras");
			});
			//勾选摄像机
			jQuery(document).on("click", "#PeopleTaskFrom .camera-list-head .opera .tree-select", function(e) {
				e.stopPropagation();
				//判断视频窗口是否打开，如打开需要提示关闭
				if (jQuery(".control-video .alarm-events-content-video").is(":visible")) {
					notify.warn("请先取消设置当前摄像机的布控规则！");
					return;
				}
				//切换中间部分内容
				jQuery(".mid-top-panel").children(".people-control-tree-select-head").addClass("active").siblings().removeClass("active");
				jQuery(".mid-bottom-panel").children(".people-control-checkbox-tree").addClass("active").siblings().removeClass("active");
				//加载摄像机
				camerasLoader.CamerasLoader.loadCameras({
					type: 'org',
					activate: false,
					container: jQuery(".people-control-checkbox-tree")
				});
			});
			//勾选摄像机页面返回
			jQuery("#GetDefenceCameraReturn").click(function() {
				//切换中间部分内容
				jQuery(".mid-top-panel").children(".people-control-edit-head").addClass("active").siblings().removeClass("active");
				jQuery(".mid-bottom-panel").children(".people-control-edit-form").addClass("active").siblings().removeClass("active");
			});
			//复选树点击事件
			jQuery(document).on("click", ".people-control-checkbox-tree .checkbox", function(e) {
				//self.selectCameras(this);
				PubSub.publish("selectCameras",this);
				e.stopPropagation(); //用来阻止冒泡到jQuery('.treeMenu .node .group')   防止点击后会展开树
			});
			//触发获取勾选的摄像机
			jQuery("#GetDefenceCamera").click(function() {
				//var newCameras = self.getCheckedCameras();
				PubSub.publish("getCheckedCameras");
			});
			//布控任务编辑保存
			jQuery("#DefenceTaskEditSave").click(function() {
				var PeopleTaskForm = jQuery("#PeopleTaskFrom"),
					checkedItems = PeopleTaskForm.find(".control-library li i.checked"),
					cameraItems = PeopleTaskForm.find(".camera-list li.camera-item");

				if (PeopleTaskForm.find(".camera-list li.camera-item[data-cstatus=1]").length) {
					notify.warn("保存失败，摄像机离线时，不能添加到布控任务中");
					return false;
				}
				
				//用于存储布控库列表和摄像机列表
				var libraries = [],
					cameras = [];
				//设置布控库列表
				for (var i = 0, j = checkedItems.length; i < j; i++) {
					var itemdata = jQuery(checkedItems[i]).parent().data();
					var data = {
						id: itemdata.id,
						name: itemdata.libflag
					}
					libraries.push(data);
				}
				//设置摄像机列表
				for (var m = 0, n = cameraItems.length; m < n; m++) {
					cameras.push(self.getCameraParam(cameraItems[m]));
				}

				var data = {
					id: PeopleTaskForm.find("input[name='id']").val(),
					name: PeopleTaskForm.find("input[name='taskName']").val(),
					libraries: JSON.stringify(libraries),
					startTime: PeopleTaskForm.find("input[name='startTime']").val(),
					endTime: PeopleTaskForm.find("input[name='endTime']").val(),
					type: 1,
					level: PeopleTaskForm.find(".select_container .text").attr("data-value"),
					cameras: JSON.stringify(cameras)
				};
				//验证提交
				PubSub.publish("editTaskChckAndSave",data);
			});
			//人员布控任务查看
			jQuery(document).on("click", ".people-control-list-item p.head", function() {
				var id = jQuery(this).data("id");
				PubSub.publish("checkTask",id);
			});
			//查看任务时编辑任务
			jQuery("#CheckEditTask").click(function() {
				PubSub.publish("editOrAddTask", {
					id: jQuery("#PeopleTaskCheckFrom").find("input[name='id']").val(),
					Taskname: ""
				});
			});
			//查看任务时撤控任务
			jQuery("#CheckCanecelTask").click(function() {
				var taskId = parseInt(jQuery("#PeopleTaskCheckFrom").find("input[name='id']").val()),
					status = parseInt(jQuery("#PeopleTaskCheckFrom").find("input[name='status']").val());
				var Taskname = jQuery("#PeopleTaskCheckFrom").find(".taskname").html();
				if (status === 0) {
					commonFun.confirmDialog("确定要撤销该任务吗？", function() {
						PubSub.publish("cancelTask",{
							id:taskId,
							status:2,
							from:"check",
							Taskname:Taskname
						});
					});
				} else if (status === 2) {
					PubSub.publish("cancelTask",{
						id:taskId,
						status:0,
						from:"check",
						Taskname:Taskname
					});
				}
			});
			//布控查看返回
			jQuery("#DefenceTaskCheckReturn").click(function() {
				//切换中间部分内容
				jQuery(".mid-top-panel").children(".control-task-list-head").addClass("active").siblings().removeClass("active");
				jQuery(".mid-bottom-panel").children(".control-task-people-list").addClass("active").siblings().removeClass("active");
				jQuery(".mid-bottom-panel").resize();
				//清空面包屑
				jQuery("#major").find(".control-task .breadcrumb .section").html("&nbsp;");
				//清除地图标注
				if (globalVar.cameraLayer) {
					globalVar.cameraLayer.removeAllOverlays();
				}
				//隐藏摄像机资源
				PubSub.publish("hideResourceLayers");
			});
			//布控库选择
			jQuery(document).on("click", ".control-library li i.checkbox", function() {
				jQuery(this).toggleClass("checked");
			});
			// 点击高级显示高级搜索 by Wang Xiaojun 2014-10-23
			jQuery(document).on("click", ".search-list .advanced-query", function() {
				jQuery(".search-list").hide();
				jQuery(".people-search-content").show();
				//设置左侧中心区域的高度
				self.setMidBottomHeight();
			});
			// 点击高级搜索中取消返回 by Wang Xiaojun 2014-10-23
			jQuery(document).on("click", "#GoBack", function() {
				jQuery(".search-list").show().find("input[name='q_personlib']").val("");
				jQuery(".people-search-content .name").val("");
				jQuery(".people-search-content").hide();
				//设置左侧中心区域的高度
				self.setMidBottomHeight();
				var param = {
					name: jQuery(".people-search-content").find("input[name='name']").val(),
					status: 3,
					type: 1,
					pageNum: 1,
					pageSize: globalVar.configInfo.controlTaskPageSize
				};
				//self.loadPeopleControlList(param);
				PubSub.publish("loadPeopleControlList",param);
			});
			//搜索监听函数
			jQuery('#ConmenSearch').watch({
				wait: 200,
				captureLength: 0,
				//监听的输入长度
				callback: function(key) {
					//触发查询
					self.searchControlTask(key);
				}
			});
			jQuery("#ConmenSearch").next().off("click").on("click", function(){
				var value = jQuery("#ConmenSearch").val();
				//触发查询
				self.searchControlTask(value);
			});

			jQuery(window).resize(function () {
				//自适应布控任务管理左侧中间高度
				self.setMidBottomHeight();
			});
		},
		/**
		 * 非高级搜索下搜索人员布控任务列表
		 * @param searchValue - 待搜索的值
		 */
		searchControlTask: function(searchValue) {
			var param = {
				name: searchValue,
				status: 3,
				type: 1,
				pageNum: 1,
				pageSize: globalVar.configInfo.controlTaskPageSize
			};
			PubSub.publish("loadPeopleControlList", param);
		},
		//注册handler助手
		registerHelper: function() {
			//过滤时间
			Handlebars.registerHelper("TimeFilter", function(value) {
				return Toolkit.mills2str(value);
			});
			Handlebars.registerHelper("ControlStatus", function(status) {
				if (status === 0) {
					return "布控中";
				}
				if (status === 1) {
					return "已过期";
				}
				if (status === 2) {
					return "已撤销";
				}
				if (status === -1) {
					return "未开始";
				}
				return "未知";
			});
			//将通道对象数组转化为json字符串，以备后期使用
			Handlebars.registerHelper("cameraStatusAndTypeByChannels", function(hd, sd, type, options) {
				var status = 1,
					isonline = false;
				hd.each(function(item, index) {
					if (item.channel_status === 0) {
						status = 0;
						isonline = true;
					}
				});
				if (!isonline) {
					sd.each(function(item, index) {
						if (item.channel_status === 0) {
							status = 0;
						}
					});
				}
				if (type) {
					if (status === 0) {

						if(hd.length>0){
							return "camera-ball-hd-online";
						}else{

							return "camera-ball-online";
						}
					}
					if (status === 1) {

						if(hd.length>0){
							return "camera-ball-hd-offline";
						}else{

							return "camera-ball-offline";
						}

					}
				} else {
					if (status === 0) {
						if(hd.length>0){
							return "camera-gun-hd-online";
						}else{
							return "camera-gun-online";
						}
					}
					if (status === 1) {
						if(hd.length>0){
							return "camera-gun-hd-offline";

						}else{

							return "camera-gun-offline";
						}
					}
				}
			});
			Handlebars.registerHelper("Checked", function(flag) {
				if (flag === "true") {
					return "checked";
				}
				return "";
			});
			Handlebars.registerHelper('translate', function(channel, options) { //将通道对象数组转化为json字符串，以备后期使用
				return channel ? JSON.stringify(channel) : '';
			});
			//撤控,恢复权限(status===2时恢复)
			Handlebars.registerHelper("hasPermisson",function(status){
				if (status === 2 && permission.klass["restore-surveillance-task"]) {
					return "permission-restore-surveillance-task";
				}else if (status !== 2 && permission.klass["cancel-surveillance-task"]) {
					return "permission-cancel-surveillance-task";
				}
			});
			//布控任务列表的助手
			Handlebars.registerHelper('FilterControlList', function(value, type, dataType, options) { //将通道对象数组转化为json字符串，以备后期使用
				if (dataType === "status") {
					//撤控/恢复
					if (type === "text") {
						return (value === 2) ? "恢复" : '撤控';
					} else if (type === "display") {
						//已过期和未开始的任务不需要撤控功能
						if (value !== 1 && value !== -1) {
							return options.fn(this);
						}
					}
				} else if (dataType === "selectCtrl") {
					if (parseInt(value) === type) {
						return "selected";
					}
				}
			});
			//编辑&查看布控任务时的助手
			Handlebars.registerHelper('FilterControlDetails', function(value, type, dataType, options) {
				if (dataType === "time") {
					return Toolkit.mills2str(value);
				} else if (dataType === "level") {
					if (value) {
						if (type === "text") {
							return (value === 1) ? "一般" : (value === 2) ? "重要" : "严重";
						} else {
							return value;
						}
					} else {
						if (type === "text") {
							return "一般";
						} else {
							return 1;
						}
					}
				}
			});
			Handlebars.registerHelper("cameraInstallType", function(num) {
				if (num === 1) {
					return "室内";
				}
				if (num === 2) {
					return "制高点";
				}
				if (num === 3) {
					return "高架";
				}
				if (num === 4) {
					return "水面";
				}
				if (num === 5) {
					return "路面";
				}
				if (num === 6) {
					return "其他";
				}
				return "";
			});
			Handlebars.registerHelper("isOnline", function(num, options) {
				if (num === 0 || num === null) {
					return options.fn({
						'data': true
					});;
				} else {
					return options.fn({
						'data': false
					});;
				}
			});
			//获取摄像机类型和状态
			Handlebars.registerHelper("cameraStatusAndType", function(type, isonline) {
				if (type) {
					if (isonline === 0 || isonline === null) {
						return "camera-ball-online";
					}
					if (status === 1) {
						return "camera-ball-offline";
					}
				} else {
					if (isonline === 0 || isonline === null) {
						return "camera-gun-online";
					}
					if (status === 1) {
						return "camera-gun-offline";
					}
				}
				return "camera-gun-offline";
			});
		},
		//设置中间部分高度
		setMidBottomHeight: function() {
			var height = jQuery(window).height() - 136 - jQuery(".tab-content").find("div[data-view='control-task'] .mid-top-panel").height();
			jQuery(".tab-content").find("div[data-view='control-task'] .mid-bottom-panel").height(height);
		},
		 // 关闭播放区域
		closeRuleVideoPanel: function() {
			//如果当前显示了播放面板
			if (jQuery(".control-video .alarm-events-content-video").is(":visible")) {
				//收起时关闭播放器并-清空播放器对象信息
				cameraRuleSetting.videoContrl.clearVideoInfo();
				//影藏播放层
				jQuery('#major .control-video').hide();
			}
		},
		/**
		 * 关闭信息窗口
		 **/
		closeInfoWindow: function() {
			var self = this;
			//如果有视频播放，关闭视频
			if (globalVar.videoPlayerSigle) {
				globalVar.videoPlayerSigle.stop(false, 0);
				globalVar.videoPlayerSigle = null;
			}
			if (globalVar.infowindow) {
				var BaseDiv = jQuery(globalVar.infowindow.getBaseDiv());
				BaseDiv.html("");
				globalVar.infowindow.close();
				globalVar.infowindow = null;
			}
		},
		/**
		 *  保存之前打开设置区域内容，然后关闭设置区
		 */
		saveAndCloseOtherPanel: function(obj) {
			var otherPanel = obj.siblings().find(".active.control-camera-config");
			//保存当前设置的框线规则到隐藏域
			var minWidth = parseInt(otherPanel.find(".second-line input[name='minW']").val()),
				minHeight = parseInt(otherPanel.find(".second-line input[name='minH']").val()),
				maxWidth = parseInt(otherPanel.find(".third-line input[name='maxW']").val()),
				maxHeight = parseInt(otherPanel.find(".third-line input[name='maxH']").val());
			var minFace = (minWidth > minHeight) ? minHeight : minWidth,
				maxFace = (maxWidth > maxHeight) ? maxWidth : maxHeight;
			//设置隐藏域
			otherPanel.find(".forth-line input[name='minSize']").val(minFace);
			otherPanel.find(".forth-line input[name='maxSize']").val(maxFace);
			//收起设置区域
			otherPanel.toggleClass("active");
		},
		/**
		 * 获取当前设置的布控摄像机区域并进行差错验证
		 */
		checkRuleVilid: function(obj) {
			var minWidth = parseInt(jQuery(obj).closest(".control-camera-config").find(".second-line input[name='minW']").val()),
				minHeight = parseInt(jQuery(obj).closest(".control-camera-config").find(".second-line input[name='minH']").val()),
				maxWidth = parseInt(jQuery(obj).closest(".control-camera-config").find(".third-line input[name='maxW']").val()),
				maxHeight = parseInt(jQuery(obj).closest(".control-camera-config").find(".third-line input[name='maxH']").val()),
				curCameraRate = cameraRuleSetting.videoContrl.getCameraRate();
			//对最大最小人脸尺寸进行差错验证
			if (!commonFun.filterNumbers(minWidth, false) || !commonFun.filterNumbers(minHeight, false)) {
				notify.warn("最小人脸中输入的值必须是非负数值，请检查更正！");
				return {
					result: false
				};
			}
			if (!commonFun.filterNumbers(maxWidth, false) || !commonFun.filterNumbers(maxHeight, false)) {
				notify.warn("最大人脸中输入的值必须是非负数值，请检查更正！");
				return {
					result: false
				};
			}
			//对最小最大人脸进行摄像机边界检测
			if (minWidth > curCameraRate.width || minHeight > curCameraRate.height) {
				notify.warn("最小人脸中输入的值超过了当前摄像机的分辨率，请检查更正！");
				return {
					result: false
				};
			}
			if (maxWidth > curCameraRate.width || maxHeight > curCameraRate.height) {
				notify.warn("最大人脸中输入的值超过了当前摄像机的分辨率，请检查更正！");
				return {
					result: false
				};
			}
			//由于布控算法人脸检测区域为正方形，所以取最小人脸的最小边和最大人脸的最大边
			var minFace = (minWidth > minHeight) ? minHeight : minWidth,
				maxFace = (maxWidth > maxHeight) ? maxWidth : maxHeight;
			return {
				minFace: minFace,
				maxFace: maxFace,
				result: true
			};
		},

		//过滤重复摄像机
		filterCameras: function(newCameras, oldCameras) {
			var resultCameras = [];
			//过滤新增摄像机中重复的内容
			for (var m = 0, n = newCameras.length; m < n; m++) {
				var flag = false;
				if (oldCameras.length > 0) {
					for (var k = 0, l = oldCameras.length; k < l; k++) {
						if (newCameras[m].id + "" === oldCameras[k].id + "") {
							flag = true;
							break;
						}
					}
				}
				if (!flag) {
					newCameras[m].camera_status = newCameras[m].camera_status ? newCameras[m].camera_status : newCameras[m].status;
					newCameras[m].camera_type = newCameras[m].camera_type ? newCameras[m].camera_type : newCameras[m].cameratype;
					newCameras[m].cameraCode = newCameras[m].cameraCode ? newCameras[m].cameraCode : newCameras[m].cameracode;
					newCameras[m].hd_channel = newCameras[m].hd_channel ? newCameras[m].hd_channel : newCameras[m].hdchannel;
					newCameras[m].sd_channel = newCameras[m].sd_channel ? newCameras[m].sd_channel : newCameras[m].sdchannel;
					resultCameras.push(newCameras[m]);
				}
			}
			return resultCameras;
		},
		//悬浮摄像机列表在地图上反色显示摄像机
		hoverCameraList: function() {
			var self = this;
			jQuery(".camera-list .camera-item").unbind("mouseenter mouseleave");
			jQuery(".camera-list .camera-item").hover(function() {
				var cameraGraphics = globalVar.cameraLayer._overlays;
				var This = jQuery(this);
				var id = This.data("id"),
					longitude = This.data("longitude"),
					latitude = This.data("latitude");
				//地图标注匹配，反色显示
				for (var key in cameraGraphics) {
					if (cameraGraphics[key].getData().id === id) {
						var icon = cameraGraphics[key].getIcon()._imageUrl;
						var newIcon = icon.substring(icon.lastIndexOf("/") + 1, icon.indexOf("."));
						var marker = new NPMapLib.Symbols.Icon("/module/inspect/dispatch/images/map/map-icon/" + newIcon.replace("small", "big") + ".png", new NPMapLib.Geometry.Size(30, 30));
						marker.setAnchor(new NPMapLib.Geometry.Size(-15,-15));
						cameraGraphics[key].setIcon(marker);
						cameraGraphics[key].refresh();
					}
				}
				//居中显示点位
				var point = new NPMapLib.Geometry.Point(longitude, latitude);
				globalVar.map.setCenter(point);
			}, function() {
				var cameraGraphics = globalVar.cameraLayer._overlays;
				var id = jQuery(this).data("id");
				//地图标注匹配，取消反色
				for (var key in cameraGraphics) {
					if (cameraGraphics[key].getData().id === id) {
						var icon = cameraGraphics[key].getIcon()._imageUrl;
						var newIcon = icon.substring(icon.lastIndexOf("/") + 1, icon.indexOf("."));
						var marker = new NPMapLib.Symbols.Icon("/module/inspect/dispatch/images/map/map-icon/" + newIcon.replace("big", "small") + ".png", new NPMapLib.Geometry.Size(26, 26));
						marker.setAnchor(new NPMapLib.Geometry.Size(-13,-13));
						cameraGraphics[key].setIcon(marker);
						cameraGraphics[key].refresh();
					}
				}
			});
		},
		//获取摄像机参数
		getCameraParam: function(cameraLI) {
			var data = jQuery(cameraLI).data();
			var camera = {},
				channel = [];
			var status = 1,
				isonline = false,
				hd = data.hdchannel,
				sd = data.sdchannel;
			//备用不在线通道
			var offlineChannel = null;
			//获取一个在线通道
			hd.each(function(item, index) {
				if (item.channel_status === 0) {
					channel.push(item);
					isonline = true;
				} else {
					offlineChannel = item;
				}
			});
			if (!isonline) {
				sd.each(function(item, index) {
					if (!isonline) {
						if (item.channel_status === 0) {
							channel.push(item);
							isonline = true;
						} else {
							if (!offlineChannel) {
								offlineChannel = item;
							}
							channel.push(offlineChannel);
						}
					}
				});
			}
			//设置摄像机其他参数
			var controlInfo = jQuery(cameraLI).find(".control-camera-config");
			var minSize = controlInfo.find("input[name='minSize']").val(),
				maxSize = controlInfo.find("input[name='maxSize']").val(),
				left = controlInfo.find("input[name='left']").val(),
				top = controlInfo.find("input[name='top']").val(),
				right = controlInfo.find("input[name='right']").val(),
				bottom = controlInfo.find("input[name='bottom']").val();
			//设置摄像机通道
			camera['channels'] = channel;
			//设计摄像机布控参数
			camera['minSize'] = parseInt(minSize);
			camera['maxSize'] = parseInt(maxSize);
			camera['left'] = parseInt(left);
			camera['top'] = parseInt(top);
			camera['right'] = parseInt(right);
			camera['bottom'] = parseInt(bottom);
			//设置相关其他参数
			camera['id'] = data.id;
			camera['name'] = data.name;
			camera['longitude'] = data.longitude;
			camera['latitude'] = data.latitude;
			camera['camera_type'] = data.cameratype;
			camera['camera_code'] = data.cameracode;

			return camera;
		}
	};
	return new View();
});
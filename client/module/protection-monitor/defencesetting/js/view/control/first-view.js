/**
 * 布控任务管理view模块
 */
define([
	"pubsub",
	'/module/protection-monitor/defencesetting/js/controller/control/preventcontrol-global-var.js',
	'/module/protection-monitor/defencesetting/js/controller/control/protectcontrol-common-fun.js',
	'/module/protection-monitor/defencesetting/js/controller/control/camera-rule-controller.js',
	'/module/protection-monitor/defencesetting/js/view/control/control-linkage-view.js',
	'/module/protection-monitor/defencesetting/js/model/control-model.js',
	// 布控任务右侧地图模块
	'/module/protection-monitor/defencesetting/js/view/control/first-pva-map-view.js',
	'/module/protection-monitor/defencesetting/js/controller/control/first-pva-map-controller.js',
	'/module/protection-monitor/defencesetting/js/view/control/first-choose-camera-view.js',
	'jquery.watch',
	'permission'
],function(PubSub,globalVar,commonFun,cameraRuleSetting,linkageView, model, pvaMap, pvaMapController, chooseCamera){
	return {
		template: null,
		init: function(callback) {
			var self = this;
			// 加载页面dom
			self.initPage(callback);
		},
		/**
		 * [initPage 初始化页面]
		 * @return {[type]} [description]
		 */
		initPage: function(callback) {
			var self = this;
			if (jQuery("#control-first-step").length) {
				return startInitPage();
			}

			// 加载第一步，创建布控任务页面模板
			self.loadTemplate("control-first-template", function(err, temp) {
				if (err) {
					return notify.error(err);
				}

				jQuery("#control-main-content").append(temp());
				startInitPage();
				linkageView.init();
				self.bindEvents();
				// 初始化地图
				pvaMap.init();
				callback && callback();
			});

			function startInitPage() {
				// 显示第一步content区域
				jQuery("#control-first-step").removeClass("setting-content-hide")
				.siblings(".control-setting-content").addClass("setting-content-hide");
				// 高亮步骤1
				self.highLightStep("first");
				// 显示底部上一步下一步完成按钮
				self.showBottomBtn();
			}
		},
		/**
		 * [loadTemplate 加载页面模板]
		 * @param  {[type]}   tempName [模板名称]
		 * @param  {Function} callback [回调函数]
		 * @return {[type]}            [description]
		 */
		loadTemplate: function(tempName, callback) {
			var self = this;

			if (self.template) {
				return callback(null, self.template);
			}

			model.getTml(tempName)
			.then(function(temp) {
				self.template = Handlebars.compile(temp);
				callback(null, self.template);
			}, function() {
				callback("加载模板失败");
			});
		},
		/**
		 * [highLightStep 高亮显示步骤]
		 * @param  {[type]} num [要显示的步骤]
		 * @return {[type]}     [description]
		 */
		highLightStep: function(num) {
			var steps = [ "first", "second", "third", "complete" ],
				index = steps.indexOf(num) + 1;

			// num前边的都高亮
			for (var i = 0; i < index; i++) {
				jQuery("#control-setting-nav").find("li." + steps[i] + "-step").addClass("active").find("i.bar").addClass('active');
			}

			// num后边的都还原
			for (; index < steps.length; index++) {
				jQuery("#control-setting-nav").find("li." + steps[index] + "-step").removeClass("active").find("i.bar").removeClass('active');
			}
		},
		/**
		 * [showBottomBtn 显示隐藏底部按钮]
		 * @return {[type]} [description]
		 */
		showBottomBtn: function() {
			jQuery("#control-setting-footer")
				.find("button").hide().end()
				.find("#DefenceTaskEditSave").show();
		},
		//绑定事件
		bindEvents: function() {
			var self = this;
			//布控摄像机删除
			jQuery("#control-main-content").on("click", "#control-first-step #PeopleTaskFrom .camera-list .camera-item .camera-opera .delete", function() {
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
				if (jQuery("#control-first-step .control-video .alarm-events-content-video .content-top-video-tool").attr("data-id") == id) {
					self.closeRuleVideoPanel();
				}
			});
			//布控摄像机设置按钮的点击事件
			jQuery("#control-main-content").on("click", "#control-first-step #PeopleTaskFrom .camera-list .camera-item .camera-opera .config", function(e) {
				e.stopPropagation();
				jQuery(this).toggleClass("active");
				// var list = [$(this).data("id")-0];
				// if(!permission.stopFaultRightById(list)[0]){
				// 	notify.info("暂无权限访问该摄像机",{timeout:1500});
				// 	return false;
				// }
				//关闭地图上的信息窗
				self.closeInfoWindow();
				//恢复当前设置页面dom对象状态
				jQuery("#control-first-step .control-camera-config.active .rule-modify input[type='button']").val("设置");
				jQuery("#control-first-step .control-camera-config.active .min-face input[type='button']").val("标定");
				jQuery("#control-first-step .control-camera-config.active .max-face input[type='button']").val("标定");
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
					jQuery('#control-setting-major .control-video').empty().html(template);
					//显示视频播放层
					jQuery('#control-setting-major .control-video').show();
					//播放当前摄像头视频
					cameraRuleSetting.videoContrl.playCurCameraVideo(LI.data());
				} else {
					//关闭播放区域
					self.closeRuleVideoPanel();
				}
			});
			//布控摄像机设置面板中的保存按钮事件
			jQuery("#control-main-content").on("click", "#control-first-step #PeopleTaskFrom .camera-list .camera-item .control-camera-config .save-protect .ui.button.save", function(e) {
				e.stopPropagation();
				//恢复当前设置页面dom对象状态
				jQuery("#control-first-step .control-camera-config.active .rule-modify input[type='button']").val("设置");
				jQuery("#control-first-step .control-camera-config.active .min-face input[type='button']").val("标定");
				jQuery("#control-first-step .control-camera-config.active .max-face input[type='button']").val("标定");
				//保存当前设置的框线规则到隐藏域
				var ruleInfo = self.checkRuleVilid(this);
				//对框线规则进行差错验证
				if (!ruleInfo.result) {
					return false;
				}
				jQuery(this).closest("li.camera-item").find(".config").toggleClass('active');
				//设置隐藏域
				jQuery(this).siblings("input[name='minSize']").val(ruleInfo.minFace);
				jQuery(this).siblings("input[name='maxSize']").val(ruleInfo.maxFace);
				//收起设置区域
				jQuery(this).closest(".control-camera-config").toggleClass("active");
				//关闭播放区域
				self.closeRuleVideoPanel();
			});
			//布控摄像机设置面板中的取消按钮事件
			jQuery("#control-main-content").on("click", "#control-first-step #PeopleTaskFrom .camera-list .camera-item .control-camera-config .save-protect .ui.button.cancel", function(e) {
				e.stopPropagation();
				jQuery(this).closest("li.camera-item").find(".config").toggleClass('active');
				//恢复当前设置页面dom对象状态
				jQuery("#control-first-step .control-camera-config.active .rule-modify input[type='button']").val("设置");
				jQuery("#control-first-step .control-camera-config.active .min-face input[type='button']").val("标定");
				jQuery("#control-first-step .control-camera-config.active .max-face input[type='button']").val("标定");
				//收起设置区域
				jQuery(this).closest(".control-camera-config").toggleClass("active");
				//关闭播放区域
				self.closeRuleVideoPanel();
			});
			//框线规则调整按钮的点击事件
			jQuery("#control-main-content").on("click", "#control-first-step #PeopleTaskFrom .camera-list .camera-item .control-camera-config .rule-modify .ui.button", function(e) {
				e.stopPropagation();
				//显示当前摄像机的框线规则
				cameraRuleSetting.CameraRuleSetting.showCameraRule(this);
			});
			//框线规则最小人脸标定点击事件
			jQuery("#control-main-content").on("click", "#control-first-step #PeopleTaskFrom .camera-list .camera-item .control-camera-config .min-face .ui.button", function(e) {
				e.stopPropagation();
				cameraRuleSetting.CameraRuleSetting.showCameraMinSize(this);
			});
			//框线规则最大人脸标定点击事件
			jQuery("#control-main-content").on("click", "#control-first-step #PeopleTaskFrom .camera-list .camera-item .control-camera-config .max-face .ui.button", function(e) {
				e.stopPropagation();
				cameraRuleSetting.CameraRuleSetting.showCameraMaxSize(this);
			});
			//框选摄像机
			jQuery("#control-main-content").on("click", "#control-first-step #PeopleTaskFrom .camera-list-head .opera .map-select", function(e) {
				e.stopPropagation();
				//判断视频窗口是否打开，如打开需要提示关闭
				if (jQuery("#control-first-step .control-video .alarm-events-content-video").is(":visible")) {
					notify.warn("请先取消设置当前摄像机的布控规则！");
					return;
				}

				//框选摄像机
				pvaMap.rectSelectCameras();
			});
			//勾选摄像机
			jQuery("#control-main-content").on("click", "#control-first-step #PeopleTaskFrom .camera-list-head .opera .tree-select", function(e) {
				e.stopPropagation();
				//判断视频窗口是否打开，如打开需要提示关闭
				if (jQuery("#control-first-step .control-video .alarm-events-content-video").is(":visible")) {
					notify.warn("请先取消设置当前摄像机的布控规则！");
					return;
				}

				//获取以前的摄像机
				var LIs = jQuery("#control-first-step #PeopleTaskFrom").find(".camera-list").find("li.camera-item"),
					oldCameras = [];
				LIs.each(function() {
					oldCameras.push(jQuery(this).data());
				});

				document.getElementById("npgis") && (document.getElementById("npgis").style.visibility = "hidden");
				chooseCamera.init(oldCameras);
			});
			//布控任务编辑保存
			jQuery("#control-setting-content").on("click", "#DefenceTaskEditSave", function() {
				var PeopleTaskForm = jQuery("#control-first-step #PeopleTaskFrom"),
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
			//布控库选择
			jQuery("#control-main-content").on("click", "#control-first-step .control-library li i.checkbox", function() {
				jQuery(this).toggleClass("checked");
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
			if (jQuery("#control-first-step .control-video .alarm-events-content-video").is(":visible")) {
				//收起时关闭播放器并-清空播放器对象信息
				cameraRuleSetting.videoContrl.clearVideoInfo();
				//影藏播放层
				jQuery('#control-setting-major .control-video').hide();
			}
		},
		/**
		 * 关闭信息窗口
		 **/
		closeInfoWindow: function() {
			//将鼠标上次悬浮坐标置为0
			pvaMapController.curPlayingVideoInfo.x = 0;
			pvaMapController.curPlayingVideoInfo.y = 0;
			pvaMap.closeInfoWindow();
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
			otherPanel.siblings(".camera-opera").find(".config").toggleClass("active");
			
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
		},
		/**
		 * [showFinish 布防任务创建成功后 显示第四步 完成  延迟1秒后 关闭设置窗口]
		 * @return {[type]} [description]
		 */
		showFinish: function() {
			var self = this;
			self.highLightStep("complete");
			setTimeout(function() {
				jQuery("#control-setting-close").trigger("click");
			}, 3000);
		}
	};
});
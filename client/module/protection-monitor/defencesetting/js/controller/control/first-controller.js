/**
 * 布控任务管理control
 * @author chengyao
 * @date   2014-12-08
 */
define([
	'/module/protection-monitor/defencesetting/js/view/control/first-view.js',
	'/module/protection-monitor/defencesetting/js/model/preventcontrol-model.js',
	'/module/protection-monitor/defencesetting/js/controller/control/preventcontrol-global-var.js',
	'pubsub',
	'/module/protection-monitor/defencesetting/js/controller/control/control-linkage-control.js', // 联动规则设置
	// 地图初始化controller模块
	'/module/protection-monitor/defencesetting/js/controller/control/first-pva-map-controller.js',
	'/module/inspect/dispatch/js/npmap-new/map-const.js',
	'/module/common/js/player2.js',
	'OpenLayers',
	'npmapConfig',
	'permission'
], function(controlMgrView,ajaxService,globalVar,PubSub, linkageControl, pvaMapController, MapConst) {
	return {
		template: null,
		init: function(options) {
			var self = this;
			//初始化View对象
			controlMgrView.init(function() {
				//订阅事件
				PubSub.unsubscribe(self.editTaskChckAndSaveToken);
				self.editTaskChckAndSaveToken = PubSub.subscribe("editTaskChckAndSave",function(msg,param){self.editTaskChckAndSave(msg,param)});
				// 自动触发创建任务
				self.editOrAddTask(null, {
					id: options.taskId
				});
			});
		},
		//提交布控表单的事件执行
		editTaskChckAndSave: function(msg,param){
			var self = this;
			//提交前的验证
			$.when(self.checkTastForm(param)).done(function() {
				//jQuery("#mapId").find(".control-map-resource-layers").hide();
				self.editTaskSave(param);
			}).fail(function(){});
		},
		//人员布控表单验证
		checkTastForm: function(data) {
			var dfd = $.Deferred(),
				flag = false;
			//重名验证
			var param = {
				id: data.id,
				name: data.name
			};
			ajaxService.ajaxEvents.controlTaskCheck(param, function(res) {
				if (res.code === 200) {
					(function() {
						if (data.name === "") {
							notify.warn("请填写任务名称！");
							flag = true;
							return;
						}
						if (data.startTime === "") {
							notify.warn("请选择起始时间！");
							flag = true;
							return;
						}
						if (data.endTime === "") {
							notify.warn("请选择结束时间！");
							flag = true;
							return;
						}
						if (parseInt(data.startTime.replace(/-/g, "")) > parseInt(data.endTime.replace(/-/g, ""))) {
							notify.warn("起始时间不能大于结束时间！");
							flag = true;
							return;
						}
						if (parseInt(data.endTime.replace(/-/g, "")) < parseInt(Toolkit.getCurDate().replace(/-/g, ""))) {
							notify.warn("结束时间不能小于当前时间！")
							flag = true;
							return;
						}
						if (JSON.parse(data.cameras).length === 0) {
							notify.warn("请选择摄像机！");
							flag = true;
							return;
						}
						if (JSON.parse(data.libraries).length === 0) {
							notify.warn("请选择布控库！");
							flag = true;
							return;
						}
						if (res.data.exists === true) {
							notify.warn("该任务名已经存在，请重新命名");
							flag = true;
							return;
						}
					})();
					if (flag) {
						dfd.reject(false);
					} else {
						dfd.resolve(1);
					}
				} else if (res.code === 500) {
					notify.warn(res.data.message);
					dfd.reject();
				} else {
					notify.warn("重名验证失败,网络或服务器异常!");
					dfd.reject();
				}
			}, function() {
				notify.warn("重名验证失败,请检查网络!");
				dfd.reject();
			});
			return dfd.promise();
		},
		//编辑任务
		editOrAddTask: function(msg,param) {
			//id, Taskname
			var self = this;
			var id = param.id,
				Taskname = param.Taskname;
			
			if (id) {
				//根据id获取布控任务详情
				var data = {id:id};
				ajaxService.ajaxEvents.getControlTaskInfo(data, function(res) {
					if (res.code === 200) {
						// 这里要获取联动规则
						linkageControl.taskId = id;
						linkageControl.getLinkageByTaskId(id, function(err, data) {
							if (err) {
								return notify.warn("获取联动信息异常！");
							}

							//linkageControl.setLinkageParams(data);
							//渲染模板
							var template = globalVar.template({
									EditPeopleControlTask: res.data
								}),
								$form = jQuery("#control-first-step").find(".people-control-edit-form");
							$form.html(template);
							//更新权限[完善布防布控权限设置，bug【40590】add by zhangyu 2016.04.01]
							window.permission.reShow();
							// jQuery("#DefenceTaskEditSave").removeAttr("disabled"); //将保存按钮置为可用
							//设置中间高度
							controlMgrView.setMidBottomHeight();
							//获取摄像机列表
							var template = globalVar.template({
								DefenceEditCameraList: res.data
							});
							
							$form.find(".camera-list").empty().html(template);
							//在地图上显示摄像机标注
							pvaMapController.showCamerasOnMap(res.data.cameras);
							//悬浮事件绑定
							pvaMapController.hoverCameraList();
						});
					}else if (res.code === 500) {
						notify.warn(res.data.message);
					}else{
						notify.warn("获取布控任务详细异常！");
					}
				},function(){
					notify.error("获取布控任务详细失败，服务器或网络异常！");
				});
			} else {
				
				// //设置中间高度
				// controlMgrView.setMidBottomHeight();
				//获取所有的布控库
				ajaxService.ajaxEvents.getAllPersonLib({libName: ""}, function(res) {
					if (res.code === 200) {
						//渲染模板
						var template = globalVar.template({
							EditPeopleControlTask: res.data
						});
						jQuery("#control-first-step").find(".people-control-edit-form").html(template);
						//更新权限[完善布防布控权限设置，bug【40590】add by zhangyu 2016.04.01]
						window.permission.reShow();
						// jQuery("#DefenceTaskEditSave").removeAttr("disabled"); //将保存按钮置为可用
					} else if (res.code === "500") {
						notify.error(res.data.message + "！错误码：" + res.code);
					} else {
						notify.error("新建布控任务，读取布控库列表失败！错误码：" + res.code);
					}
				}, function() {
					notify.error("新建布控任务，读取布控库列表失败，服务器或网络异常！");
				});
			}
		},
		//保存编辑任务
		editTaskSave: function(param) {
			var self = this,
				url = "";
			//编辑布控任务时额外的参数
			if (param.id && param.id !== "") {
				param._method = "put";
				param.isTaskto = false;
			}
			
			if (linkageControl.phoneList.length) {
				jQuery.ajax({
					type: "get",
					url: "/service/defence/sms/test"
				}).then(function(res) {
					if (res.code === 200) {
						return startSaveTask();
					}

					needConfirm();
				}, function() {
					needConfirm();
				});

				return;
			}

			function needConfirm() {
				var confirmDialog = new ConfirmDialog({
					message: '检测到短信服务异常，确定继续创建任务？',
					callback: function() {
						startSaveTask();
					}
				});
			}

			startSaveTask();
			function startSaveTask() {
				jQuery("#DefenceTaskEditSave").attr("disabled", "disabled");
				var commonDialog = new CommonDialog({
					title: '保存布控中,请等待！'
				});

				ajaxService.ajaxEvents.saveControlTask(param, function(res) {
					commonDialog.hide();
					if (res.code === 200) {
						if (param.id && param.id !== "") {
							logDict.insertMedialog("m9", "编辑" + param.name + "布控任务", "f12", "o2");
							jQuery(".control-task .breadcrumb span").html(" ");
						} else {
							logDict.insertMedialog("m9", "新建" + param.name + "布控任务", "f12", "o1");
						}

						// 如果是编辑
						if (param.id) {
							//且选择了联动
							if (jQuery("#PeopleTaskFrom .linkage-check").hasClass("active-linkage")) {
								addLinkage(param.id, JSON.parse(param.cameras));
								return;
							} else {
								linkageControl.resetElement();
								linkageControl.taskId = 0;
								// 显示完成
								controlMgrView.showFinish();
								return;
							}
						}
						// 如果是新增 直接添加联动规则
						addLinkage(res.data && res.data.message, JSON.parse(param.cameras));
						// 添加联动规则
						function addLinkage(taskId, cameraData) {
							linkageControl.addLinkageBatch(taskId, cameraData, function(err) {
								if (err) {
									return notify.error("保存任务成功，创建联动规则失败");
								}
								
								notify.success("保存任务成功！");
								//清除点击联动标识
								jQuery("#PeopleTaskFrom .linkage-check").removeClass("active-linkage");
								// 清除联动选择
								linkageControl.resetElement();
								linkageControl.taskId = 0;
								// 显示完成
								controlMgrView.showFinish();
							});
						}
					} else if (res.code === 500) {
						notify.error(res.data.message + "！错误码：" + res.code);
						jQuery("#DefenceTaskEditSave").removeAttr("disabled");
					} else {
						notify.error("保存布控任务失败！错误码：" + res.code);
						jQuery("#DefenceTaskEditSave").removeAttr("disabled");
					}
				}, function() {
					notify.error("保存布控任务失败,服务器或网络异常！");
					jQuery("#DefenceTaskEditSave").removeAttr("disabled");
				});
			}
		},
		//(勾选资源树)保存选择的摄像机之后的处理事件
		dealCheckedCameras: function(newCameras){
			var self = this;
			//列表中的摄像机
			var oldCameras = [];
			//获取以前的摄像机
			// var LIs = jQuery("#PeopleTaskFrom").find(".camera-list").find("li.camera-item");
			// for (var i = 0, j = LIs.length; i < j; i++) {
			// 	var camera = jQuery(LIs[i]).data();
			// 	oldCameras.push(camera);
			// }
			var resultCameras = [];
			//加载新增摄像机
			if (oldCameras.length > 0) {
				//过滤摄像机
				resultCameras = pvaMapController.filterCameras(newCameras, oldCameras);
			} else {
				resultCameras = newCameras;
				for (var m = 0, n = resultCameras.length; m < n; m++) {
					resultCameras[m].camera_type = resultCameras[m].camera_type !== undefined ? resultCameras[m].camera_type : resultCameras[m].cameratype;
					resultCameras[m].cameraCode = resultCameras[m].cameraCode !== undefined ? resultCameras[m].cameraCode : resultCameras[m].cameracode;
					resultCameras[m].hd_channel = resultCameras[m].hd_channel !== undefined ? resultCameras[m].hd_channel : resultCameras[m].hdchannel;
					resultCameras[m].sd_channel = resultCameras[m].sd_channel !== undefined ? resultCameras[m].sd_channel : resultCameras[m].sdchannel;
				}
			}
			//获取模板
			var template = globalVar.template({
				DefenceAddCameras: {
					cameras: resultCameras
				}
			});
			var CameraContainer = jQuery("#PeopleTaskFrom .camera-list");
			CameraContainer.html("");
			//如果已经含有摄像机，则追加
			if (CameraContainer.find("li.camera-item").length > 0) {
				CameraContainer.append(template);
			} else {
				//如果没有摄像机，则填充
				CameraContainer.html(template);
			}
			//添加摄像机图层
			if (!globalVar.cameraLayer) {
				globalVar.cameraLayer = new NPMapLib.Layers.OverlayLayer("camera-layer");
				pvaMapController.options.map.addLayer(globalVar.cameraLayer);
			}
			//在地图上显示新增的摄像机
			if (resultCameras) {
				self.markerList = [];
				for (var i = 0, j = resultCameras.length; i < j; i++) {
					var data = resultCameras[i];
					var marker = new NPMapLib.Symbols.Marker(new NPMapLib.Geometry.Point(data.longitude, data.latitude));
					self.markerList.push(marker);
					data.cameraType = data.camera_type;
					data.hdchannel = data.hd_channel;
					data.sdchannel = data.sd_channel;
					//获取摄像机状态与类型，以正确的显示摄像机图标
					var cameratype = pvaMapController.getCameraTypeAndStatus(data);

					if(data.hdchannel.length>0){
						if (cameratype === "ballonline") {
							marker.setIcon(MapConst.guardRouteSymbol.cameraBallOnline());
						} else if (cameratype === "balloffline") {
							marker.setIcon(MapConst.guardRouteSymbol.cameraBallOffline());
						} else if (cameratype === "gunonline") {
							marker.setIcon(MapConst.guardRouteSymbol.cameraGunOnline());
						} else {
							marker.setIcon(MapConst.guardRouteSymbol.cameraGunOffline());
						}
					}else{
						if (cameratype === "ballonline") {
							marker.setIcon(MapConst.guardRouteSymbol.cameraBallOnline());
						} else if (cameratype === "balloffline") {
							marker.setIcon(MapConst.guardRouteSymbol.cameraBallOffline());
						} else if (cameratype === "gunonline") {
							marker.setIcon(MapConst.guardRouteSymbol.cameraGunOnline());
						} else {
							marker.setIcon(MapConst.guardRouteSymbol.cameraGunOffline());
						}
					}
					marker.setData({
						id: data.id
					});
					globalVar.cameraLayer.addOverlay(marker);
				}
			}
			//悬浮事件绑定
			pvaMapController.hoverCameraList();
		},
		//checkbox样式改变 第一个参数是当前点击的元素  第二个参数是被选中是的类名 
		check: function(elm, klass, target) {
			var node = (typeof elm === "string") ? jQuery(elm) : elm,
				isChecked = node.hasClass(klass); // || jQuery(allNode).find(childNode+":checked");
			if (isChecked) {
				node.removeClass(klass);
				node.parent("a").removeClass("active");
			} else {
				node.addClass(klass);
				node.parent("a").addClass("active");
			}
			this.checkAll(node, klass, target);
			return false;
		},
		//选择组织节点
		checkAll: function(elm, klass, target) { //如果查看此函数建议阅读者查看对应的DOM结构
			var node = (typeof elm === "string") ? jQuery(elm) : elm,
				//当前点击的checkbox元素elm
				parentNode = node.parent().parent().parent().siblings().children("." + target),
				//elm的父级节点的checkbox元素
				childrenNode = node.parent().siblings().find("." + target); //elm的父级节点下面（展开）的所有checkbox元素(备注：因为elm的父级节和elm下级的elm的父级节是同一个对象)
			//如果elm有父节点，要去判断它父节点的checkbox的样式
			if (parentNode.length > 0) {
				//备注：elm.parent().siblings()代表是elm下被展开的部分
				var allNode = parentNode.parent().siblings().find("." + target),
					nodeLen = allNode.length,
					//对应于allNode，只是此处找的是checked
					checked = parentNode.parent().siblings().find("." + klass),
					checkedLen = checked.length;
				//如果elm下级的所有checkbox都被选中，则elm的
				if (nodeLen === checkedLen) {
					parentNode.addClass(klass);
					parentNode.parent("a").addClass("active");
				} else {
					parentNode.removeClass(klass);
					parentNode.parent("a").removeClass("active");
				}
			}
			//如果孩子节点存在，切换孩子节点样式
			if (childrenNode.length > 0) {
				if (node.hasClass(klass)) {
					childrenNode.addClass(klass);
					childrenNode.parent("a").addClass("active");
				} else {
					childrenNode.removeClass(klass);
					childrenNode.parent("a").removeClass("active");
				}
			}
		}
	};
});
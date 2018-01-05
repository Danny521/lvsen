/**
 * 布控任务管理control
 * @author chengyao
 * @date   2014-12-08
 */
define([
	'js/controller/control-mgr-map-controller',
	'js/view/control-mgr-view',
	'js/model/preventcontrol-model',
	'js/preventcontrol-global-var',
	'/module/inspect/dispatch/js/npmap-new/map-const.js',
	'pubsub',
	'js/controller/control-linkage-control', // 联动规则设置
	'new-player',
	'OpenLayers',
	'/module/common/js/npmap-config.js',
	'permission'
], function(mapController,controlMgrView,ajaxService,globalVar,MapConst,PubSub, linkageControl) {
	var controlMgr = new Class({
		Implements: [Events, Options],
		options: {
			template: null,
			itemsPerPage: 5,
			setPagination: jQuery.noop
		},
		initialize: function(options) {
			var self = this;
			this.setOptions(options);
			//初始化View对象&地图控制对象
			controlMgrView.init();
			mapController.init();
			//订阅事件
			PubSub.subscribe("editOrAddTask",function(msg,param){self.editOrAddTask(msg,param)});
			PubSub.subscribe("cancelTask",function(msg,param){self.cancelTask(msg,param)});
			PubSub.subscribe("removeTask",function(msg,param){self.removeTask(msg,param)});
			PubSub.subscribe("loadPeopleControlList",function(msg,param){self.loadPeopleControlList(msg,param)});			
			PubSub.subscribe("selectCameras",function(msg,param){self.selectCameras(msg,param)});
			PubSub.subscribe("getCheckedCameras",function(){self.getCheckedCameras()});
			PubSub.subscribe("editTaskChckAndSave",function(msg,param){self.editTaskChckAndSave(msg,param)});
			PubSub.subscribe('checkTask',function(msg,param){self.checkTask(msg,param)});
		},
		//提交布控表单的事件执行
		editTaskChckAndSave: function(msg,param){
			var self = this;
			//提交前的验证
			$.when(self.checkTastForm(param)).done(function() {
				//jQuery("#mapId").find(".map-resource-layers").hide();
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

		//加载人员布控列表
		loadPeopleControlList: function(msg,param) {
			var self = this;
			//隐藏摄像机资源
			PubSub.publish("hideResourceLayers");
			//清除地图上的摄像机
			//清除地图标注
			if (globalVar.cameraLayer) {
				globalVar.cameraLayer.removeAllOverlays();
			}
			//获取布控任务列表
			ajaxService.ajaxEvents.searchControlTask(param, function(res) {
				if (res.code === 200) {
					if (res.data.count <= param.pageSize) {
						var template = globalVar.template({
							PeopleControlTaskList: res.data
						});
						jQuery(".mid-bottom-panel .control-task-people-list .control-task-people-list-inner").html(template);
						permission.reShow();
						jQuery(".mid-bottom-panel .pagination").hide();
					} else {
						//渲染分页
						jQuery(".mid-bottom-panel .pagination").show();
						self.options.setPagination(res.data.count, ".mid-bottom-panel .pagination", param.pageSize, function(nextPage) {
							param.pageNum = nextPage;
							// TODO  分页回调函数
							ajaxService.ajaxEvents.searchControlTask(param, function(res) {
								if (res.code === 200) {
									var template = globalVar.template({
										PeopleControlTaskList: res.data
									});
									jQuery(".mid-bottom-panel .control-task-people-list .control-task-people-list-inner").html(template);
									permission.reShow();
								} else if (res.code === 500) {
									notify.warn(res.data.message);
								} else {
									notify.warn("分页中服务器或网络异常！");
								}
							}, function() {
								notify.error("分页中服务器或网络错误！");
							});
						});
					}
				} else if (res.code === 500) {
					notify.error(res.data.message + "！错误码：" + res.code);
				} else {
					notify.error("获取布控任务列表失败！错误码：" + res.code);
				}
			}, function() {
				notify.error("获取布控任务列表失败，服务器或网络错误！");
			});
		},
		//编辑任务
		editOrAddTask: function(msg,param) {
			//id, Taskname
			var self = this;
			var id = param.id,
				Taskname = param.Taskname;
			//如果还未加载摄像机资源，开始加载
			if (!mapController.isLoadedCameras) {
				mapController.loadResourceCameras();
				jQuery("#mapId").find(".map-resource-layers").show();
			}
			//显示所有的摄像机资源
			mapController.showResourceLayers();
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

							linkageControl.setLinkageParams(data);
							//设置面包屑内容
							var name = res.data.task.name;
							jQuery("#major").find(".control-task .breadcrumb .section").html(name);
							//切换中间部分内容
							jQuery(".mid-top-panel").children(".people-control-edit-head").addClass("active").siblings().removeClass("active");
							jQuery(".mid-bottom-panel").children(".people-control-edit-form").addClass("active").siblings().removeClass("active");
							//渲染模板
							var template = globalVar.template({
								EditPeopleControlTask: res.data
							});
							jQuery(".mid-bottom-panel .people-control-edit-form").html(template);
							//更新权限[完善布防布控权限设置，bug【40590】add by zhangyu 2016.04.01]
							window.permission.reShow();
							jQuery("#DefenceTaskEditSave").removeAttr("disabled"); //将保存按钮置为可用
							//设置中间高度
							controlMgrView.setMidBottomHeight();
							//获取摄像机列表
							var template = globalVar.template({
								DefenceEditCameraList: res.data
							});
							jQuery(".mid-bottom-panel .people-control-edit-form .camera-list").empty().html(template);
							//在地图上显示摄像机标注
							mapController.showCamerasOnMap(res.data.cameras);
							//悬浮事件绑定
							controlMgrView.hoverCameraList();
						})
					}else if (res.code === 500) {
						notify.warn(res.data.message);
					}else{
						notify.warn("获取布控任务详细异常！");
					}
				},function(){
					notify.error("获取布控任务详细失败，服务器或网络异常！");
				});
			} else {
				//切换中间部分内容
				jQuery(".mid-top-panel").children(".people-control-edit-head").addClass("active").siblings().removeClass("active");
				jQuery(".mid-bottom-panel").children(".people-control-edit-form").addClass("active").siblings().removeClass("active");
				//设置中间高度
				controlMgrView.setMidBottomHeight();
				//获取所有的布控库
				ajaxService.ajaxEvents.getAllPersonLib({libName: ""}, function(res) {
					if (res.code === 200) {
						//渲染模板
						var template = globalVar.template({
							EditPeopleControlTask: res.data
						});
						jQuery(".mid-bottom-panel .people-control-edit-form").html(template);
						//更新权限[完善布防布控权限设置，bug【40590】add by zhangyu 2016.04.01]
						window.permission.reShow();
						jQuery("#DefenceTaskEditSave").removeAttr("disabled"); //将保存按钮置为可用
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
		//查看任务
		checkTask: function(msg,id) {
			var self = this;
			//设置中间高度
			controlMgrView.setMidBottomHeight();
			PubSub.publish("hideResourceLayers");
			ajaxService.ajaxEvents.checkSingleTask({id: id}, function(res) {
				//设置面包屑内容
				var name = res.data.task.name;
				jQuery("#major").find(".control-task .breadcrumb .section").html(name);
				//添加日志
				logDict.insertMedialog("m9", "查看" + res.data.task.name + "布控任务", "f12", "o4");
				//切换中间部分内容
				jQuery(".mid-top-panel").children(".people-control-check-head").addClass("active").siblings().removeClass("active");
				jQuery(".mid-bottom-panel").children(".people-control-check-form").addClass("active").siblings().removeClass("active");
				//渲染模板
				var template = globalVar.template({
					CheckPeopleControlTask: res.data.task
				});
				jQuery(".mid-bottom-panel .people-control-check-form").html(template);
				//渲染库列表
				var tem = globalVar.template({
					checkPeopleLibraries: res.data.libraries
				});
				jQuery(".mid-bottom-panel .people-control-check-form .control-library").html(tem);
				//设置中间高度
				controlMgrView.setMidBottomHeight();
				//获取摄像机列表			
				var template = globalVar.template({
					DefenceCheckCameraList: res.data
				});
				jQuery(".mid-bottom-panel .people-control-check-form .camera-list").html(template);
				//在地图上显示摄像机标注
				mapController.showCamerasOnMap(res.data.cameras);
				//悬浮事件绑定
				controlMgrView.hoverCameraList();
				//更改头上按钮文字
				if(res.data.task.status === 0){
					jQuery("#CheckCanecelTask").val("撤控");
					jQuery("#CheckCanecelTask").attr("title","撤控当前的布控任务");
					//权限相关by chengyao
					if (permission.klass["cancel-surveillance-task"]) {
						jQuery("#CheckCanecelTask").show();
					}else{
						jQuery("#CheckCanecelTask").hide();
					}
				} else if(res.data.task.status === 2){
					jQuery("#CheckCanecelTask").val("恢复");
					jQuery("#CheckCanecelTask").attr("title","恢复当前的布控任务");
					if (permission.klass["restore-surveillance-task"]) {
						jQuery("#CheckCanecelTask").show();
					}else{
						jQuery("#CheckCanecelTask").hide();
					}
				} else {
					jQuery("#CheckCanecelTask").hide();
				}
			}, function() {
				notify.error("获取布控任务详细失败，服务器或网络异常！");
			});
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
					// 如果是编辑，先删除所有联动信息，再重新添加
					if (param.id) {
						// 删除
						linkageControl.removeLinkageByTaskId(param.id, function(err) {
							if (err) {
								return notify.error("保存任务成功，创建联动规则失败");
							}
							// 重新添加
							addLinkage(param.id);
						});

						return;
					}
					// 如果是新增 直接添加联动规则
					addLinkage(res.data && res.data.message);
					// 添加联动规则
					function addLinkage(taskId) {
						linkageControl.addLinkageBatch(taskId, function(err) {
							if (err) {
								return notify.error("保存任务成功，创建联动规则失败");
							}
							
							notify.success("保存任务成功！");
							//切换中间部分内容
							jQuery(".mid-top-panel").children(".control-task-list-head").addClass("active").siblings().removeClass("active");
							jQuery(".mid-bottom-panel").children(".control-task-people-list").addClass("active").siblings().removeClass("active");
							//设置中间高度
							controlMgrView.setMidBottomHeight();
							//加载人员布控任务列表
							var param1 = {
								pageNum: 1,
								pageSize: globalVar.configInfo.controlTaskPageSize
							};
							self.loadPeopleControlList("",param1);
							//隐藏布控视频页面
							controlMgrView.closeRuleVideoPanel();
							// 清除联动选择
							linkageControl.resetElement();
							linkageControl.taskId = 0;
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
		},
		//撤销任务
		cancelTask: function(msg,params) {
			//id, status, from, Taskname
			var self = this, popTitle = '',	data = {
					id:params.id,
					status:params.status,
					from:params.from,
					Taskname:params.Taskname
				};
			if(params.status === 2){
				popTitle = "撤控";
			}else{
				popTitle = "恢复";
			}
			var commonDialog = new CommonDialog({
				title: popTitle + '布控中,请等待'
			});
			ajaxService.ajaxEvents.cancelControlTask(data, function(res) {
				commonDialog.hide();
				if (res.code === 200) {
					if (data.status === 2) {
						logDict.insertMedialog("m9", "撤控" + data.Taskname + "布控任务", "f12");
					} else {
						logDict.insertMedialog("m9", "恢复" + data.Taskname + "布控任务", "f12");
					}
					notify.success((data.status === 0) ? "恢复成功！" : "撤控成功！");
					var param = {
						pageNum: 1,
						pageSize: globalVar.configInfo.controlTaskPageSize
					};
					if (data.from === "check") {
						jQuery("#DefenceTaskCheckReturn").trigger("click");
					}
					self.loadPeopleControlList("",param);
				} else if (res.code === 500) {
					notify.error(res.data.message + "！错误码：" + res.data);
				} else {
					notify.error(((params.status === 0) ? "恢复" : "撤销") + "布控任务失败！错误码：" + res.code);
				}
			}, function() {
				notify.error(((params.status === 0) ? "恢复" : "撤销") + "布控任务失败，服务器或网络错误！");
			});
		},
		//删除任务
		removeTask: function(msg,params) {
			//id, Taskname
			var self = this;
			var data = {
				id : params.id,
				Taskname : params.Taskname
			};
			ajaxService.ajaxEvents.removeTask(data, function(res) {
				if (res.code === 200) {
					// 这里删除联动规则
					linkageControl.removeLinkageByTaskId(params.id, function(err) {
						notify.success("删除布控任务成功！");
						logDict.insertMedialog("m9", "删除" + params.Taskname + "布控任务", "f12", "o3");
						var param = {
							pageNum: 0,
							pageSize: globalVar.configInfo.controlTaskPageSize
						};
						self.loadPeopleControlList("",param);
					});
				} else if (res.code === 500) {
					notify.error(res.data.message + "！");
				} else {
					notify.error("删除布控任务失败！");
				}
			}, function() {
				notify.error("删除布控任务可失败，服务器或网络问题！");
			});
		},
		//获取被勾选组织下所有的摄像机信息列表
		getCheckedCameras: function() {
			var childrenNode = [],
				//用于存放被勾选的tree节点下面的所有leaf节点，
				groupsId = [],
				camerasData = [],
				//用于存放leaf节点的相关信息
				self = this,
				nodes = jQuery('li.node > a > i.checked').closest("li.node"); //被选中的tree节点和leaf节点
			// 遍历选择的数据
			Array.from(nodes).forEach(function(item) {
				var node = jQuery(item);
				// 判断是树节点还是叶子
				if (node.is('[data-type="group"]')) { //若为根节点并且有data-child-ids属性
					if (node.attr("data-child-ids")) {
						groupsId.push(node.data('id')); //取出tree的id,放入到groupsId数组中
						childrenNode.push(node.find(".node[data-type='camera']")); //将该父节点下面的所有子节点放入到childrenNode数组中
					}
				} else {
					camerasData.push(node.data()); //将该leaf节点的data-信息放到到camerasData数组中
					childrenNode.each(function(i) {
						camerasData.pop(jQuery(i).data()); //从camerasData中移除重复(即：childrenNode)的部分
					});
				}

			});
			if (groupsId.length > 0) {
				var param = {
					groups: groupsId.join("/"),
					type: "org"
				};
				ajaxService.ajaxEvents.getSelectCamerInfo(param, {async: false},function(res) {
					if (res.code === 200) {
					camerasData = camerasData.concat(res.data.cameras);
					}else if (res.code === 500) {
						notify.warn(res.data.message);
					}else{
						notify.warn("获取该组织下的摄像机异常!");
					}
				},function(){
					notify.error("获取该组织下的摄像机失败,请查看网络状况！");
				});
			}
			//return camerasData;
			self.dealCheckedCameras(camerasData);
		},
		//(勾选资源树)保存选择的摄像机之后的处理事件
		dealCheckedCameras: function(newCameras){
			var self = this;
			//切换中间部分内容
			jQuery(".mid-top-panel").children(".people-control-edit-head").addClass("active").siblings().removeClass("active");
			jQuery(".mid-bottom-panel").children(".people-control-edit-form").addClass("active").siblings().removeClass("active");
			//列表中的摄像机
			var oldCameras = [];
			//获取以前的摄像机
			var LIs = jQuery(".mid-bottom-panel .people-control-edit-form .camera-list li.camera-item");
			for (var i = 0, j = LIs.length; i < j; i++) {
				var camera = jQuery(LIs[i]).data();
				oldCameras.push(camera);
			}
			var resultCameras = [];
			//加载新增摄像机
			if (oldCameras.length > 0) {
				//过滤摄像机
				resultCameras = controlMgrView.filterCameras(newCameras, oldCameras);
			} else {
				resultCameras = newCameras;
				for (var m = 0, n = resultCameras.length; m < n; m++) {
					resultCameras[m].camera_type = resultCameras[m].camera_type ? resultCameras[m].camera_type : resultCameras[m].cameratype;
					resultCameras[m].cameraCode = resultCameras[m].cameraCode ? resultCameras[m].cameraCode : resultCameras[m].cameracode;
					resultCameras[m].hd_channel = resultCameras[m].hd_channel ? resultCameras[m].hd_channel : resultCameras[m].hdchannel;
					resultCameras[m].sd_channel = resultCameras[m].sd_channel ? resultCameras[m].sd_channel : resultCameras[m].sdchannel;
				}
			}
			//获取模板
			var template = globalVar.template({
				DefenceAddCameras: {
					cameras: resultCameras
				}
			});
			var CameraContainer = jQuery("#PeopleTaskFrom .camera-list");
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
				globalVar.map.addLayer(globalVar.cameraLayer);
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
					var cameratype = mapController.getCameraTypeAndStatus(data);
					// if (cameratype === "ballonline") {
					// 	marker.setIcon(globalVar.cameraSymbol.cameraBallOnline());
					// } else if (cameratype === "balloffline") {
					// 	marker.setIcon(globalVar.cameraSymbol.cameraBallOffline());
					// } else if (cameratype === "gunonline") {
					// 	marker.setIcon(globalVar.cameraSymbol.cameraGunOnline());
					// } else {
					// 	marker.setIcon(globalVar.cameraSymbol.cameraGunOffline());
					// }

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
			controlMgrView.hoverCameraList();
		},
		//checkbox树选择摄像机
		selectCameras: function(msg,elm) {
			var self = elm,
				node = jQuery(elm),
				childCounts, 
				that = this,
				childIds;
			//点击的是group节点
			if (node.parent().hasClass('group')) {
				var gruop = node.closest('.group').closest('.node');
				var groupId = gruop.attr("data-id");
				//第一次点击时添加data-child-counts属性
				if (!gruop.attr("data-child-counts")) {
					var data = {
						group: groupId,
						type: 'org'
					};
					ajaxService.ajaxEvents.getCmeraIdByOrg(data, function(res) {
						if (res.code === 200) {
							gruop.attr("data-child-counts", res.data.count);
							gruop.attr("data-child-ids", res.data.ids);
							that.check(node, "checked", "checkbox");
						} else if (res.code === 500) {
							notify.warn(res.data.message);
						} else {
							notify.warn("获取摄像机id列表异常!");
						}
					}, function() {
						notify.error("获取摄像机id列表失败!");
					});
				} else {
					that.check(node, "checked", "checkbox");
				}
				//点击的是leaf节点
			} else {
				that.check(node, "checked", "checkbox");
			}

			return false;
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
	});
	return {
		controlMgr: controlMgr
	}
});
/**
 * 布防任务管理
 * @author chengyao
 * @date   2014-12-08
 */
define([
	'js/view/defence-mgr-view',
	'js/preventcontrol-global-var',
	'js/model/preventcontrol-model',
	'pubsub',
	'handlebars',
	'permission'
], function(defenceMgrView,globalVar,ajaxService,PubSub) {
	var defenceMgr = new Class({
		Implements: [Events, Options],
		options: {
			template: null,
			setPagination: jQuery.noop
		},
		defenseTypeList: null,
		//当前存在的路数限制对应的数据库id(如果当前组织没有设置过路数，则默认为-1)
		defenceLimitId: -1,
		//当前页面摄像机
		currPageCameraData: null,

		initialize: function(options) {
			var self = this;
			//初始化view对象
			defenceMgrView.init();
			this.setOptions(options);
			this.setLeftTreeHeight();
			//订阅事件
			PubSub.subscribe("switchCameraProtectStatus",self.switchCameraProtectStatus);
			PubSub.subscribe("getAllCameraTasks",function(msg,param){self.getAllCameraTasks(msg,param)});
			PubSub.subscribe("getDefenseTasksByCameraid",function(msg,param){self.getDefenseTasksByCameraid(msg,param)});
			PubSub.subscribe("getCameraList",function(msg,param){self.getCameraList(msg,param)});
			PubSub.subscribe("delProtectCamera",function(msg,param){self.delProtectCamera(msg,param)});
			PubSub.subscribe("delTaskById",function(msg,param){self.delTaskById(msg,param)});
			PubSub.subscribe("getCamerasByOrgId",function(msg,param){self.getCamerasByOrgId(msg,param)});
			PubSub.subscribe("moveIntoView",function(msg,param){self.moveIntoView(msg,param)});
			PubSub.subscribe("toggleAllTaskStatus",function(msg,param){self.toggleAllTaskStatus(msg,param)});
		},
		//设置左侧内容高度
		setLeftTreeHeight: function() {
			jQuery(".tree-container").height(jQuery(window).height() - 180);
		},
		moveIntoView:function(msg,data){
			if(data){
				ajaxService.ajaxEvents.moveIntoView(data,function(res){
					if(res.code===200){
						setTimeout(function(){
							window.location.href = '/module/viewlibs/doubtlib?cameraChannelId='+data.cameraChannelId+'&jobId='+data.jobId;
						},500);
					}else if (res.code === 500) {
						notify.error(res.data.message + "！错误码：" + res.code);
					} else {
						notify.error("查看标注结果失败" + res.code);
					}
				})
			}else{
				notify.error("获取数据失败!" );
			}

		},
		//查看所有布防任务(点击眼睛的时候执行)
		getAllCameraTasks:function(msg,param){
			var self  = this,
				$this =  param.This;
			delete param.This;	//移除jquery对象,因为ajax请求参数不能序列化该对象,会导致报错
			//获取所有布防摄像机下的布防任务
			ajaxService.ajaxEvents.getAllCameraAllTask(param, function(res) { //success
				if (res.code === 200) {
					//组装数据
					var newData = Array.clone(self.currPageCameraData);
					for (var i = 0, j = newData.length; i < j;) {
						//过滤掉不存在的摄像机，查询完了之后，页面的摄像机id会有变化
						if (param.ids.toString().indexOf(newData[i].id.toString()) >= 0) {
							//当前搜索结果中包含该摄像机，则给当前摄像机添加任务列表
							for (var key in res.data.defenceTasks) {
								if (parseInt(key) === newData[i].id) {
									newData[i].defenceTasks = res.data.defenceTasks[key];
								}
							}
							i++;
						} else {
							//当前搜索结果中不包含该摄像机，则直接跳过
							newData.splice(i, 1);
							j--;
						}
					}
					jQuery("#protectMgr .table_lists_wrap  table tbody").html(self.options.template({
						"alarmingCameraItems": {
							cameraList: newData
						}
					}));
					permission.reShow();
					//标记显示完毕
					setTimeout(function() {
						$this.removeClass("blue disabled").text("收起全部");
					}, 500);
				} else if (res.code === 500) {
					notify.error(res.data.message + "！错误码：" + res.code);
					$this.removeClass("disabled");
				} else {
					notify.error("获取布防摄像机列表失败！错误码：" + res.code);
					$this.removeClass("disabled");
				}
			}, function() { //error
				notify.error("获取布防摄像机列表失败，服务器或网络异常！");
				$this.removeClass("disabled");
			});
		},
		//根据orgId获取摄像机列表
		getCamerasByOrgId: function(msg,orgId) {
			// jQuery("div#protectMgr").empty().show().siblings(".main").hide();
			//获取某组织下摄像机列表
			var condition = {
				orgId: orgId,
				cameraName: "",
				evType: "",
				pageNo: 1,
				pageSize: globalVar.configInfo.defencePageSize
			};
			this.getCameraList("",{
				condition:condition,
				isSearch:false
			});
		},
		//获取摄像机列表
		getCameraList: function(msg,param) {
			//condition, isSearch
			var self = this,
				$closeOpenAllTasks = jQuery("#closeOpenAllTasks");
			//调用获取摄像机列表接口
			ajaxService.ajaxEvents.getCameraList(param.condition, function(res) { //success
				if (res.code === 200) {
					//重置查看所有任务的眼睛按钮
					jQuery(".defence-task .table_lists th.opera a.icon_look").removeClass("show").attr("title", "展开所有布防任务");
					//设置当前页面摄像机数据
					self.currPageCameraData = res.data.defenceCameras;
					//设置隐藏域中的事件类型，用于记录搜索上次搜索摄像机时的条件
					jQuery("#hiddenEvType").val(param.condition.evType);
					var html = "";
					if (!param.isSearch) {
						html = self.options.template({
							"alarmingCameraList": {
								"bread": globalVar.steps,
								"closeOpenAllTasks": $closeOpenAllTasks.length ? $closeOpenAllTasks.hasClass("blue") ? "blue" : "" : "",
								"isAdmin": jQuery("#userEntry").attr("data-loginname") === "admin" ? true : false
							}
						});
						jQuery("#protectMgr").html(html);
					}
					//清空表格
					jQuery("#protectMgr .table_lists_wrap  table tbody").empty();
					jQuery("#protectMgr .table_lists_wrap  table tbody").html(self.options.template({
						"alarmingCameraItems": {
							cameraList: res.data.defenceCameras
						}
					}));
					permission.reShow();
					defenceMgrView.bindBreadEvent();
				} else if (res.code === 500) {
					notify.warn(res.data.message);
				}
			}, function() { //error
				notify.error("获取布防摄像机列表失败！")
			});
		},
		//获取布防摄像机布防任务列表
		getDefenseTasksByCameraid: function(msg,param) {
			//id, TR
			var self = this;
			//调用获取布防摄像机布防任务列表
			var data = {
				cameraId: param.cameraId,
				evType: jQuery("#hiddenEvType").val()
			};
			var $TR = param.TR;
			delete param.TR;	//移除jquery对象,防止ajax请求序列化过程中报错
			ajaxService.ajaxEvents.getTaskByCamera(data, function(res) { //success
				if (res.code === 200) {
					var defenseTasksList = self.options.template({
						defenseTasks: res.data.defenceTasks
					});
					$TR.after(jQuery(defenseTasksList));
					permission.reShow();
				} else if (res.code === 500) {
					notify.warn(res.data.message + "！错误码：" + res.code);
				}
			}, function() {
				notify.error("获取摄像机布防任务失败!");
			});
		},
		/**
		 * [toggleAllTaskStatus 一键展开或者关闭全部任务]
		 * @param  {[type]} msg   [description]
		 * @param  {[type]} param [description]
		 * @return {[type]}       [description]
		 */
		toggleAllTaskStatus: function(msg,param) {
			var self = this,
				cameraIds = self.getAllCameras(),
				text = param.status === 1 ? "开启" : "关闭",
				$node = jQuery(param.node),
				commonDialog;

			if (cameraIds.length === 0) {
				return notify.warn("暂无布防摄像机");
			}

			ajaxService.ajaxEvents.toggleAllTaskStatus({
				cameraIds: cameraIds.join(),
				status: param.status,
				_method: "PUT"
			}, {
				beforeSend: function() {
					commonDialog = new CommonDialog({
						title: "一键" + text + "任务",
		            	height: "203px",
		            	width: "443px",
		            	classes: "protection-common-loading",
					});
					jQuery(".protection-common-loading").find(".close").hide();
					commonDialog.getBody().html("<div class='loading-content'><div class='icon'>一键" + text + "任务中，请等待...</div></div>");
				},
				complete: function() {
					commonDialog.hide();
				}
			}, function(res) { //success
				if (res.code === 200) {
					notify.success("一键" + text + "任务成功!");
					if (param.status === 1) {
						$node.removeClass('blue').text("一键关闭任务");
					} else {
						$node.addClass('blue').text("一键开启任务");
					}
					setTimeout(function() {
						// 更新布防管理数据
						PubSub.publish("getCamerasByOrgId",globalVar.curDepartment.id.substring(4));
					}, 1500);
				} else if (res.code === 500) {
					notify.warn(res.data.message + "！错误码：" + res.code);
				}
			}, function() {
				notify.error("一键" + text + "任务失败，网络异常!");
			});
		},
		getAllCameras: function() {
			var cameraIds = [];
			jQuery("#content_list").find(".camera_list").each(function() {
				cameraIds.push(jQuery(this).attr("data-id"));
			});
			
			return cameraIds;
		},
		//开启/停止布防某摄像机
		switchCameraProtectStatus: function(msg,param) {
			//type, taskId, This, name
			//调用开启/停止布防接口
			var data = {
				"taskId": param.taskId,
				"status": param.type,
				"_method": "put"
			};
			ajaxService.ajaxEvents.switchCameraProtectStatus(data, function(res) { //success
				if (res.code === 200) {
					if (param.type === 0) {
						notify.success("暂停布防任务成功！");
						param.This.removeClass("unprotected").addClass("protected");
						param.This.attr("title", "已暂停");
					} else {
						notify.success("开启布防任务成功！");
						param.This.removeClass("protected").addClass("unprotected");
						param.This.attr("title", "已开启");
					}
				} else if (res.code === 500) {
					notify.warn(res.data.message);
				}
			},function(){
				if (param.type === 0) {
					notify.error("暂停布防任务失败！");
				} else {
					notify.error("开启布防任务失败！");
				}
			});
		},
		//删除布防摄像机
		delProtectCamera: function(msg,param) {
			//cameraId, TR, name
			var self = this;
			//删除该摄像机的布防信息
			var data = {
				"cameraId": param.cameraId,
				"_method": "delete"
			};
			ajaxService.ajaxEvents.delProtectCamera(data, function(res) { //success
				if (res.code === 200) {
					notify.success("删除布防摄像机成功！");
					//移除该摄像机下的布防任务
					if (param.TR.next().hasClass("alarming_list")) {
						param.TR.next().remove();
					}
					var tBodyObj = param.TR.closest("tbody");
					//移除当前行
					var condition = {
						orgId: globalVar.curDepartment.id.substring(4),
						cameraName: "",
						evType: "",
						pageNo: 1,
						pageSize: globalVar.configInfo.defencePageSize
					}
					self.getCameraList("",{
						condition:condition,
						isSearch:false
					});
					//判断摄像机是否全部移除
					var cameraCount = tBodyObj.find("tr.camera_list").length;
					if (cameraCount !== 0) {
						//重新编排摄像机前的序号
						tBodyObj.find("tr.camera_list").each(function(index, item) {
							jQuery(this).find(".code").html(index + 1);
						});
					} else {
						tBodyObj.html(" <tr class='no-camera-line'>" + "<td colspan='3' class='no-camera-info'>没有查询到与搜索条件相匹配的布防摄像机！</td>" + "</tr>");
					}
				} else if (res.code === 500) {
					notify.warn(res.data.message);
				}
			}, function() { //error
				notify.error("删除布防任务失败！");
			});
		},
		//删除布防摄像机任务
		delTaskById: function(msg,param) {
			//taskId, TR, name, taskName
			var data = {
				"taskId": param.taskId,
				"_method": "delete"
			};
			ajaxService.ajaxEvents.delTaskById(data, function(res) {
				if (res.code === 200) {
					notify.success("删除布防任务成功！");
					logDict.insertMedialog("m9", "删除" + param.name + "摄像机的" + param.taskName + "布防任务", "f12", "o3");
					//判断当前摄像下还有无任务
					var cameraTr = param.TR.prev();
					if (cameraTr.hasClass("camera_list")) {
						if (cameraTr.nextUntil(".camera_list").find("#alarming_list_inner li").length> 1) {
							console.log($(param.node).closest('li'))
							//移除当前行
							$(param.node).closest('li').remove();
						} else {
							//删除最后一个任务
							var tBodyObj = param.TR.closest("tbody");
							//移除该任务及该任务归属摄像机
							param.TR.prev().remove();
							param.TR.remove();
							//重新编排摄像机前的序号
							tBodyObj.find("tr.camera_list").each(function(index, item) {
								jQuery(this).find(".code").html(index + 1);
							});
						}
					} else {
						//移除当前行
						param.TR.remove();
					}
				} else if (res.code === 500) {
					notify.warn(res.data.message);
				} else {
					notify.warn("删除布防任务异常！");
				}
			}, function() {
				notify.error("删除布防任务失败,请检查网络!");
			});
		},
		//根据当前的组织id，获取当前组织下的布防限制信息
		getDefenceLimitInfo: function(obj) {
			var self = this;
			var data = {
				orgId: globalVar.curDepartment.id.substring(4)
			};
			ajaxService.ajaxEvents.getDefenceLimitInfo(data, function(res) { //success
				if (res.code === 200) {
					self.showSettingDialog(res.data, obj);
				} else if (res.code === 500) {
					notify.warn(res.data.message);
				} else {
					notify.warn("获取当前组织下布防路数信息异常！");
				}
			}, function() { //error
				notify.error("获取当前组织下布防路数信息失败,请检查网络！");
			});
		},
		//显示设置框
		showSettingDialog: function(data, obj) {
			var self = this;
			//初始化弹出框
			var html = self.options.template({
				"setDefenseLimitNums": true,
				"maxCameras": data.maxCameraNumber,
				"maxTasks": data.maxDefenceTaskNumber,
				"curCameras": data.currentSettingCameraNumber,
				"curTasks": data.currentSettingDefenceTaskNumber,
				"minCameras": data.minCameraNumber,
				"minTasks": data.minDefenceTaskNumber,
				"curCameraCount": data.currentCameraCount,
				"curTaskCount": data.currentDefenceTaskCount
			});
			self.defenceLimitId = data.defenceLimitId;
			//加入到文档中
			jQuery("#content_list").find(".defence-mgr-pub-dialog").remove().end().append(html);
			//移动位置并显示弹出框
			self.refreshSettingDialog(obj);
		},
		//保存布防路数设置信息
		saveLimitInfo: function() {
			var self = this,
				maxCamerasNum = jQuery.trim(jQuery(".cameras-limit-num input").val()),
				maxTasksNum = jQuery.trim(jQuery(".tasks-limit-num input").val());
			//差错验证
			if (!self.invaliteLimitInfo(maxCamerasNum, maxTasksNum)) {
				return;
			}
			//写入数据库
			var data = {
				id: self.defenceLimitId,
				orgId: globalVar.curDepartment.id.substring(4),
				maxCameraNumber: parseInt(maxCamerasNum),
				maxDefenceTask: parseInt(maxTasksNum)
			};
			ajaxService.ajaxEvents.saveLimitInfo(data, function(res) {
				if (res.code === 200) {
					notify.success("布防路数信息设置成功！");
					jQuery(".defence-mgr-pub-dialog").hide();
					//根据组织id更新左侧树
					jQuery(".treePanel li[data-id='" + globalVar.curDepartment.id + "']").find(".name em:first").text("(" + maxCamerasNum + "路)");
				} else if (res.code === 500) {
					notify.warn(res.data.message);
				} else {
					notify.warn("布防路数信息设置异常！");
				}
			}, function() {
				notify.error("布防路数信息设置失败，请检查网络！");
			});
		},
		//验证布防摄像机数和布防任务数的合法性
		invaliteLimitInfo: function(maxCamerasNum, maxTasksNum) {
			//差错判断
			if (maxCamerasNum === "" || maxTasksNum === "") {
				notify.warn("最大布防摄像机数或最大布防任务数不能为空！");
				return false;
			}
			//判断是否是数子
			if (!/^[1-9]\d*$/gi.test(maxCamerasNum) || !/^[1-9]\d*$/gi.test(maxTasksNum)) {
				notify.warn("最大布防摄像机数或最大布防任务数必须是正整数！");
				return false;
			}
			//判断范围(必须在十万以内)
			if (parseInt(maxCamerasNum) > 100000) {
				notify.warn("最大布防摄像机数应在10万以内！");
				return false;
			}
			if (parseInt(maxTasksNum) > 100000) {
				notify.warn("最大布防任务数应在10万以内！");
				return false;
			}
			//判断条件（不能超过当前组织的父组织能够允许的最大分配额度,也不能小于当前组织子组织已经分配的额度总和）
			var maxLimitCameraN = parseInt(jQuery(".cameras-limit-num").attr("data-max-cameras")),
				minLimitCameraN = parseInt(jQuery(".cameras-limit-num").attr("data-min-cameras")),
				curLimitCameraN = parseInt(jQuery(".cameras-limit-num").attr("data-cur-cameras"));
			if (parseInt(maxCamerasNum) < curLimitCameraN) {
				//小于当前的，则限制
				notify.warn("当前设置的最大布防摄像机数小于已设置的布防摄像机总数，请重新设置！");
				return false;
			}
			if (maxLimitCameraN !== -1 && parseInt(maxCamerasNum) > maxLimitCameraN) {
				//有上限，进行比较
				notify.warn("当前设置的最大布防摄像机数超出其最大可设置范围，请重新设置！");
				return false;
			}
			if (minLimitCameraN !== -1 && parseInt(maxCamerasNum) < minLimitCameraN) {
				//有下限，进行比较
				notify.warn("当前设置的最大布防摄像机数不能小于其子机构设置值的和，请重新设置！");
				return false;
			}
			var maxLimitTaskN = parseInt(jQuery(".tasks-limit-num").attr("data-max-tasks")),
				minLimitTaskN = parseInt(jQuery(".tasks-limit-num").attr("data-min-tasks")),
				curLimitTaskN = parseInt(jQuery(".tasks-limit-num").attr("data-cur-tasks"));
			if (parseInt(maxTasksNum) < curLimitTaskN) {
				//小于当前的，则限制
				notify.warn("当前设置的最大布防任务数小于已设置的布防任务总数，请重新设置！");
				return false;
			}
			if (maxLimitTaskN !== -1 && parseInt(maxTasksNum) > maxLimitTaskN) {
				//有上限，进行比较
				notify.warn("当前设置的最大布防任务数超出其最大可设置范围，请重新设置！");
				return false;
			}
			if (minLimitTaskN !== -1 && parseInt(maxTasksNum) < minLimitTaskN) {
				//有下限，进行比较
				notify.warn("当前设置的最大布防任务数不能小于其子机构设置值的和，请重新设置！");
				return false;
			}
			return true;
		},
		//开启布防任务时检查布防路数是否合法
		checkLimitAllow: function(taskId, obj, name, callback) {
			//第一步：判断当前摄像机是否还有其他正在进行的任务
			var taskIngCount = obj.closest("td").find(".unprotected").length,
				checkType = -1;
			if (taskIngCount > 0) {
				//当前摄像机还有其他正在进行的任务，故只需判断任务限制
				checkType = 1;
			} else {
				//当前摄像机没有其他正在进行的任务，需先判断摄像机限制，再判断任务限制
				checkType = 2;
			}
			//读取布防信息，进行布防路数限制
			var data = {
				orgId: globalVar.curDepartment.id.substring(4)
			};
			ajaxService.ajaxEvents.getDefenceLimitInfo(data, function(res) {
				if (res.code === 200) {
					var curTaskNumber = res.data.currentSettingDefenceTaskNumber, //设置的最大布防任务数
						curTaskCount = res.data.currentDefenceTaskCount, //当前的布防任务数
						minTaskNumber = res.data.minDefenceTaskNumber, //最小布防任务数
						curCameraNumber = res.data.currentSettingCameraNumber, //设置的最大布防摄像机数
						curCameraCount = res.data.currentCameraCount, //当前布防摄像机数
						minCameraNumber = res.data.minCameraNumber; //最小布防摄像机数
					if (res.code === 200) {
						//根据判断类型进行判断
						if (checkType === 1) {
							//只判断布防任务
							if (curTaskNumber !== 0) {
								curTaskCount = (curTaskCount === -1) ? 0 : curTaskCount;
								minTaskNumber = (minTaskNumber === -1) ? 0 : minTaskNumber;
								if ((curTaskNumber - curTaskCount - minTaskNumber) > 0) {
									callback(taskId, obj, name);
								} else {
									notify.warn("当前组织下可设置的布防任务资源已用完，请释放正在进行的任务后重试！");
								}
							} else {
								//无限设置
								callback(taskId, obj, name);
							}
						} else {
							//先判断摄像机
							if (curCameraNumber !== 0) {
								curCameraCount = (curCameraCount === -1) ? 0 : curCameraCount;
								minCameraNumber = (minCameraNumber === -1) ? 0 : minCameraNumber;
								if ((curCameraNumber - curCameraCount - minCameraNumber) > 0) {
									//判断布防任务
									if (curTaskNumber !== -1) {
										curTaskCount = (curTaskCount === -1) ? 0 : curTaskCount;
										minTaskNumber = (minTaskNumber === -1) ? 0 : minTaskNumber;
										if ((curTaskNumber - curTaskCount - minTaskNumber) > 0) {
											callback(taskId, obj, name);
										} else {
											notify.warn("当前组织下可设置的布防任务资源已用完，请释放正在进行的任务后重试！");
										}
									} else {
										callback(taskId, obj, name);
									}
								} else {
									notify.warn("当前组织下可设置的布防摄像机资源已用完，请释放正在布防的摄像机后重试！");
								}
							} else {
								//无限制增加摄像机的情况
								if (curTaskNumber !== 0) {
									//判断布防任务
									curTaskCount = (curTaskCount === -1) ? 0 : curTaskCount;
									minTaskNumber = (minTaskNumber === -1) ? 0 : minTaskNumber;
									if ((curTaskNumber - curTaskCount - minTaskNumber) > 0) {
										callback(taskId, obj, name);
									} else {
										notify.warn("当前组织下可设置的布防任务资源已用完，请释放正在进行的任务后重试！");
									}
								} else {
									//无限制增加任务的情况
									callback(taskId, obj, name);
								}
							}
						}
					} else if (res.code === 500) {
						notify.warn(res.data.message);
					} else {
						notify.warn("获取当前组织下布防路数信息异常！");
					}
				}
			}, function() {
				notify.error("获取当前组织下布防路数信息失败,请检查网络！");
			});
		}
	});
	return {
		defenceMgr: defenceMgr
	}
});
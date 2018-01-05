/***********************************
 ** Date：2015.9.28
 ** Author:Leon.z
 ** Description:对接新布防布控接口
 **
 ***********************************/
define([
	'../model/preventcontrol-model',
	'pubsub',
	'../global-varibale',
	'base.self',
	'permission'
], function(ajaxCtrModel, PubSub, global) {
	var commonDeal = function() {}
	commonDeal.prototype = {
		isShowDelTaskDialog: false,
		/**
		 * [isHasIndexCache 判断布防删除任务时，是否当前摄像机正在播放]
		 * @param  {[type]}  cameraId [description]
		 * @return {Boolean}          [description]
		 */
		isHasIndexCache: function(cameraId) {
			var index = -1,
				cacheIndexArr = [];
			for (var i = 0; i < 16; i++) {
				if (global.videoPlayer.cameraData[i] !== -1) {
					if (parseInt(global.videoPlayer.cameraData[i].cId) === parseInt(cameraId)) {
						index = i;
						return index
					}
				}
			}
			return index;
		},
		getControlIndexCache: function(taskId, callback) {
			var cameraList = [];
			ajaxCtrModel.ajaxEvents.checkSingleTask({
				id: taskId
			}, function(res) {
				if (res.code === 200 && res.data.cameras) {
					for (var i = 0, le = res.data.cameras.length; i < le; i++) {
						cameraList.push(res.data.cameras[i].id)
					}
					callback & callback(cameraList);
				}
			}, function() {
				notify.error('获取当前任务下的摄像机列表失败!')
			})
		},
		/**
		 * [isHasIndexCache 判断布控删除任务时，是否当前摄像机正在播放]
		 * @param  {[type]}  cameraId [description]
		 * @return {Boolean}          [description]
		 */
		isHasCtrIndexCache: function(taskid, callback) {
			var self = this,
				ctrCacheIndexArr = [];
			self.getControlIndexCache(taskid, function(cacheList) {
				var cachelength = cacheList.length;
				if (cachelength > 0) {
					for (var i = 0; i < cachelength; i++) {
						for (var j = 0; j < 16; j++) {
							if (global.videoPlayer.cameraData[j] !== -1) {
								if (parseInt(global.videoPlayer.cameraData[j].cId) === parseInt(cacheList[i])) {
									ctrCacheIndexArr.push(j);
								}
							}
						}
					}
					callback && callback(ctrCacheIndexArr);
				}

			});
		},
		//布防删除
		defenceTaskRemove: function(id, node, isFromSingelTask) {
			var self = this;
			var data = {
				"cameraId": id,
				"_method": "delete"
			},
			deleted = function(data,id){
				ajaxCtrModel.ajaxEvents.delProtectCamera(data, function(res) {
					if (res.code === 200) {

						var nowCacheIndex = self.isHasIndexCache(id);
						if(nowCacheIndex!==-1){
							global.videoPlayer.stop(false, nowCacheIndex);
							global.curScreenCameraIds[nowCacheIndex] = null;	
						}
						
						if (jQuery("#defenceTaskList li").length < 0) {
							jQuery("#defenceTaskList li.style-text-info").show();
						}
						node.closest('li').remove();
						if(jQuery("#defenceTaskList").find("li").length<=0){
							jQuery("#defenceTaskList").append('<li class="style-text-info">当前暂无任务信息！</li>');
						}
						if(isFromSingelTask){
							return;
						}
						notify.success("删除布防摄像机成功！");
					}

				});
			};
			if (id) {
				if(isFromSingelTask){
					deleted(data,id);
					return;
				}
				global.confirmDialog("删除摄像机后将会删除该摄像机的布防任务，</br>确定要删除吗？", function() {
					deleted(data,id);
				});
			}

		},
		//预留接口，布防编辑
		defenceTaskEdit: function(data) {
			if (jQuery("#major").attr("data-currpart") === "ocx") {
				jQuery("#ocxPanel").addClass('indetify');
			}
			if (jQuery(".video-play-frame-new").is(":visible")) {
				jQuery(".video-play-frame-new").addClass('indetify')
			}
			require(["/module/protection-monitor/defencesetting/js/main.js"], function(mainSetPort) {
				if (data) {
					//处理地图模式下窗口打开新建布防任务窗口未关闭问题update by leon.z 2016/3/16
					PubSub.publish("closeInfoWindow",{});
					mainSetPort.init({
						taskType: 0,
						cameraId: data.cameraId,
						taskId: data.taskId,
						preClose: function() {
							if (jQuery("#major").attr("data-currpart") === "ocx") {
								jQuery("#ocxPanel").removeClass('indetify');
							}

							jQuery(".video-play-frame-new").removeClass('indetify');

						}

					})
				}
			});
		},
		/**
		 * [controlTaskEdit 布控编剧]
		 * @param  {[type]} taskId [description]
		 * @return {[type]}        [description]
		 */
		controlTaskEdit: function(taskId) {
			if (jQuery("#major").attr("data-currpart") === "ocx") {
				jQuery("#ocxPanel").addClass('indetify');
			}
			if (jQuery(".video-play-frame-new").is(":visible")) {
				jQuery(".video-play-frame-new").addClass('indetify')
			}
			require(["/module/protection-monitor/defencesetting/js/main.js"], function(mainSetPort) {
				if (taskId) {
					//处理地图模式下窗口打开新建布防任务窗口未关闭问题update by leon.z 2016/3/16
					PubSub.publish("closeInfoWindow",{});
					mainSetPort.init({
						taskType: 1,
						taskId: taskId,
						preClose: function() {
							if (jQuery("#major").attr("data-currpart") === "ocx") {
								jQuery("#ocxPanel").removeClass('indetify');
							}

							jQuery(".video-play-frame-new").removeClass('indetify');
							jQuery(".header li[data-handler='controlTsakSet']").trigger("click");
						}

					})
				}
			});
		},
		/**
		 * [controlTaskRemove 删除布控任务]
		 * @param  {[type]} taskid [description]
		 * @param  {[type]} node   [description]
		 * @return {[type]}        [description]
		 */
		controlTaskRemove: function(taskid, node) {
			var self = this,
				currcacheList = [];
			self.isHasCtrIndexCache(taskid, function(cacheList) {
				currcacheList = Array.clone(cacheList)
			});
			global.confirmDialog("确定要删除该任务吗？", function() {
				ajaxCtrModel.ajaxEvents.removeTask({
					id: taskid
				}, function(res) {
					if (res.code === 200) {
						var nowCtrCacheLength = currcacheList.length;
						if (nowCtrCacheLength > 0) {
							for (var i = 0; i < nowCtrCacheLength; i++) {
								global.videoPlayer.stop(false, i);
								global.curScreenCameraIds[i] = null;
							}
						}
						notify.success("删除布控任务成功！");
						node.remove();
					}
				})
			});
		},
		/**
		 * [controlTaskRestoreCancle 恢复布控任务]
		 * @param  {[type]} node   [任务节点]
		 * @return {[type]}        [description]
		 */
		controlTaskRestoreCancle: function(node) {
			//id, status, from, Taskname
			var self = this,
				popTitle = '',
				status = node.attr("data-status") - 0,
				data = {
					id: node.attr("data-taskid"),
					status: status === 0 ? 2 : 0,
					from: "list",
					Taskname: node.find(".text").text()
				};

			if (status === 2) {
				popTitle = "恢复";
			} else {
				popTitle = "撤控";
			}

			var commonDialog = new CommonDialog({
				title: popTitle + '布控中,请等待'
			});

			ajaxCtrModel.ajaxEvents.cancelControlTask(data, function(res) {
				commonDialog.hide();
				if (res.code === 200) {
					if (status === 2) {
						logDict.insertMedialog("m9", "恢复" + data.Taskname + "布控任务", "f12");
					} else {
						logDict.insertMedialog("m9", "撤控" + data.Taskname + "布控任务", "f12");
					}
					notify.success((status === 2) ? "恢复成功！" : "撤控成功！");
					jQuery(".header li[data-handler='controlTsakSet']").trigger("click");
				} else if (res.code === 500) {
					notify.error(res.data.message + "！错误码：" + res.data);
				} else {
					notify.error(((data.status === 2) ? "恢复" : "撤销") + "布控任务失败！错误码：" + res.code);
				}
			}, function() {
				notify.error(((data.status === 2) ? "恢复" : "撤销") + "布控任务失败，服务器或网络错误！");
			});
		},
		/**
		 * [denfenceTaskBuld 新建布防任务]
		 * @return {[type]} [description]
		 */
		denfenceTaskBuld: function() {
			//ajaxCtrModel.ajaxEvents.getMaxLimit({}, function(res) {
				//if (res.code === 200 && res.data) {
					if (jQuery("#major").attr("data-currpart") === "ocx") {
						jQuery("#ocxPanel").addClass('indetify');
					}
					if (jQuery(".video-play-frame-new").is(":visible")) {
						jQuery(".video-play-frame-new").addClass('indetify')
					}
					require(["/module/protection-monitor/defencesetting/js/main.js"], function(mainSetPort) {
						//处理地图模式下窗口打开新建布防任务窗口未关闭问题update by leon.z 2016/3/16
						PubSub.publish("closeInfoWindow",{});
						mainSetPort.init({
							taskType: 0,
							preClose: function() {
								if (jQuery("#major").attr("data-currpart") === "ocx") {
									jQuery("#ocxPanel").removeClass('indetify');
								}
								jQuery(".video-play-frame-new").removeClass('indetify');
								jQuery(".header li[data-handler='defenceTsakSet']").trigger("click");
							}
						})

					});
				/*}else if(res.code === 200 && !res.data){
					notify.error('您所在的组织创建的布防任务数已经达到该组织最大限额，不能再创建布防任务！');
					return false;
				}else if(res.code ===500 ){
					notify.error(res.data?res.data:"服务异常，新建失败！");
				}
			}, function() {
				notify.error('服务异常，新建失败！')
			})*/
			
		},
		/**
		 * [ctrTaskBuld 新建布控任务]
		 * @return {[type]} [description]
		 */
		ctrTaskBuld: function() {
			if (jQuery("#major").attr("data-currpart") === "ocx") {
				jQuery("#ocxPanel").addClass('indetify');
			}
			if (jQuery(".video-play-frame-new").is(":visible")) {
				jQuery(".video-play-frame-new").addClass('indetify')
			}
			require(["/module/protection-monitor/defencesetting/js/main.js"], function(mainSetPort) {
				//处理地图模式下窗口打开新建布防任务窗口未关闭问题update by leon.z 2016/3/16
				PubSub.publish("closeInfoWindow",{});
				mainSetPort.init({
					taskType: 1,
					preClose: function() {
						if (jQuery("#major").attr("data-currpart") === "ocx") {
							jQuery("#ocxPanel").removeClass('indetify');
						}
						jQuery(".video-play-frame-new").removeClass('indetify');
						jQuery(".header li[data-handler='controlTsakSet']").trigger("click");
					}
				})

			});

		},
		/**
		 * [toggleAllTaskStatus 一键展开或者关闭全部任务]
		 * @param  {[type]} msg   [description]
		 * @param  {[type]} param [description]
		 * @return {[type]}       [description]
		 */
		toggleAllTaskStatus: function(param, callback) {

			var self = this,
				cameraIds = self.getAllCameras(),
				status = param.type === "pause" ? 0 : 1,
				text = status === 1 ? "开启" : "关闭",
				commonDialog;
			if (cameraIds.length <= 0) {
				return notify.warn("暂无布防摄像机");
			}
			ajaxCtrModel.ajaxEvents.toggleAllTaskStatus({
				cameraIds: cameraIds.join(),
				status: status,
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
					callback && callback(status);
				} else if (res.code === 500) {
					notify.warn(res.data.message + "！错误码：" + res.code);
				}
			}, function() {
				notify.error("一键" + text + "任务失败，网络异常!");
			});

		},
		getAllCameras: function() {
			var cameraIds = [];
			jQuery("#defenceTaskList").find("li.defence-list-item").each(function() {
				cameraIds.push(jQuery(this).attr("data-cameraid"));
			});
			return cameraIds;
		},

		setTaskStatus: function(opts, node) {
			if (opts) {
				var cameraId = opts.cameraId;
				if (jQuery("#setPanel").attr("cameraId") === cameraId && jQuery("#setPanel").is(":visible")) {
					jQuery("#setPanel").hide().removeAttr("cameraId");
					node.closest('li').removeClass('active');
					jQuery(".defenceTool").removeClass("active");
					return;
				}
				jQuery("#setPanel").hide()
				ajaxCtrModel.ajaxEvents.getTaskByCamera({
					cameraId: cameraId,
					evType: ""
				}, function(res) {
					if (res.code === 200 && res.data.defenceTasks) {
						var res = {
							tasklistPanel: true,
							tasklistData: res.data.defenceTasks,
						}
						if(res.tasklistData.length<0){
							return;
						}
						jQuery("#setPanel .TasklistPanel").html(global.compiler(res));
						jQuery("#setPanel").show().css({
							left: node.offset().left - 45 + "px",
							top: node.offset().top + 15 + "px"
						}).attr("cameraId", cameraId);
						node.closest('li').addClass('active').siblings('li').removeClass("active");
						jQuery(".defenceTool").removeClass("active");
						node.closest('li').find(".defenceTool").addClass("active");
						//更新权限[完善布防布控权限设置，bug【40590】add by zhangyu 2016.04.01]
						window.permission.reShow();
					}
				}, function() {
					notify.error('获取当前摄像机下的布防任务列表失败!')
				})
			}

		},
		/**
		 * [changeTaskByCid 布防布控开启关闭任务]
		 * @param  {[type]} opts [description]
		 * @param  {[type]} node [description]
		 * @return {[type]}      [description]
		 */
		changeTaskByCid: function(opts, node) {
			var This = node,
				taskId = opts.taskId,
				name = opts.taskName,
				cameraId = opts.cameraId,
				types = opts.enableTask,
				list = [],
				self = this;

			list.push(cameraId);
			if(node.hasClass('disabled')){
				return ;
			}
			node.addClass('disabled')
			//根据摄像机id判断该用户是否拥有播放权限。 by wangxiaojun 2015.01.20
			permission.stopFaultRightById(list, true, function(rights) {
				if (rights[0] === true) {
					
					self.switchCameraProtectStatus({
						type: parseInt(types),
						taskId: taskId,
						This: This,
						name: name
					});
				} else {
					if (This.attr("data-type") === "run") {
						notify.info("暂无权限访问该摄像机不能进行开启任务操作！");
					} else {
						notify.info("暂无权限访问该摄像机不能进行暂停任务操作！");
					}
					node.removeClass('disabled');
				}
			});
		},
		/**开启/停止布防某摄像机**/
		switchCameraProtectStatus: function(param) {
			//type, taskId, This, name
			//调用开启/停止布防接口
			var data = {
				"taskId": param.taskId,
				"status": param.type,
				"_method": "put"
			};
			
			ajaxCtrModel.ajaxEvents.switchCameraProtectStatus(data, function(res) { //success
				if (res.code === 200) {
					if (param.type === 0) {
						notify.success("暂停布防任务成功！");
						param.This.addClass("icon-run").removeClass("icon-pause");
						param.This.closest('li').find("em").addClass("grey");
						param.This.closest('li').attr("data-enable",0);
						param.This.attr({
							"data-type": "run",
							"title": "开启任务"
						})
					} else {
						notify.success("开启布防任务成功！");
						param.This.removeClass("icon-run").addClass("icon-pause");
						param.This.closest('li').find("em").removeClass("grey");
						param.This.closest('li').attr("data-enable",1);
						param.This.attr({
							"data-type": "pause",
							"title": "暂停任务"
						});
					}
					setTimeout(function() {
						param.This.removeClass('disabled');
					}, 1000);
				} else if (res.code === 500) {
					param.This.removeClass('disabled');
					notify.warn(res.data.message);
				}
			}, function() {
				if (param.type === 0) {
					notify.error("暂停布防任务失败！");
				} else {
					notify.error("开启布防任务失败！");
				}
			});
		},
		/**
		 * [innerTaskremoveByCid 判断是否有权限删除摄像机下的单个任务，并删除单个任务]
		 * @param  {[type]} opts [description]
		 * @param  {[type]} node [description]
		 * @return {[type]}      [description]
		 */
		innerTaskremoveByCid: function(opts, node) {
			var self = this;
			var This = node,
				taskId = opts.taskId,
				name = jQuery("#defenceTaskList").find("li.active .text").text(),
				taskName = opts.taskName;
			self.isShowDelTaskDialog = true;
			if (taskId) {
				//判断权限by zhangyu on 2015/3/31
				var list = [];
				list.push(opts.cameraId);
				if (permission.klass["delete-defence-task"] === "delete-defence-task") {
					permission.stopFaultRightById(list, true, function(rights) {
						if (rights[0] === true) {
							global.confirmDialog("确定要删除该任务吗？", function() {
								self.delTaskById({
									taskId: taskId,
									This: This,
									cameraId:opts.cameraId
								});
								self.isShowDelTaskDialog = false;
							}, function() {
								self.isShowDelTaskDialog = false;

							});
						} else {
							notify.info("暂无权限删除该摄像机的布防任务！");
						}
					});
				} else {
					notify.info("暂无权限删除该摄像机的布防任务！");
				}
			}
		},
		//删除布防摄像机任务
		delTaskById: function(param) {
			var self = this,data = {
				"taskId": param.taskId,
				"_method": "delete",
				"cId":param.cameraId
			};
			ajaxCtrModel.ajaxEvents.delTaskById(data, function(res) {
				if (res.code === 200) {
					notify.success("删除布防任务成功！");
					//判断当前摄像下还有无任务
					param.This.closest('li').remove();
					if (jQuery("#setPanel .TasklistPanel").find("li").length <= 0) {
						jQuery("#setPanel").hide();
						self.defenceTaskRemove(data.cId,jQuery("#defenceTaskList li.active"),true);
						//jQuery("#defenceTaskList li.active").find("i.icon-delete").click();
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
	}

	return new commonDeal();

})
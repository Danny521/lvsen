/**
 * Created by Zhangyu on 2014/12/10.
 * 布防规则设置，人脸布控相关逻辑控制器
 */
define([
	"/module/protection-monitor/defencesetting/js/model/defence-model.js",
	"/module/protection-monitor/defencesetting/js/view/defence/third-protect-view.js",
	"/module/protection-monitor/defencesetting/js/controller/defence/defence-setting-common-fun.js",
	"/module/protection-monitor/defencesetting/js/global-var.js",
	"pubsub",
	"jquery"
], function(model, view, DefenceTools, globalVar, PubSub, jQuery) {
	var Controller = function () {
		var self = this;
		//订阅事件-获取当前摄像机未参与的布控任务列表
		PubSub.unsubscribe(self.getNotInTasksToken);
		self.getNotInTasksToken = PubSub.subscribe("getNotInTasks", self.getNotInTasks);
		//订阅事件-删除摄像机的某个布控任务
		PubSub.unsubscribe(self.delProtectTaskToken);
		self.delProtectTaskToken = PubSub.subscribe("delProtectTask", function(msg, data) {
			self.delProtectTask(data.taskId, data.obj);
		});
		//订阅事件-删除摄像机的某个布控任务
		PubSub.unsubscribe(self.getProtectTaskDetailToken);
		self.getProtectTaskDetailToken = PubSub.subscribe("getProtectTaskDetail", function(msg, data) {
			self.getProtectTaskDetail(data.taskId, data.container);
		});
		//订阅事件-将当前摄像机添加到已有的布控任务中，可以一次性添加多个
		PubSub.unsubscribe(self.insertCameraToProtectTasksToken);
		self.insertCameraToProtectTasksToken = PubSub.subscribe("insertCameraToProtectTasks", function(msg, data) {
			self.insertCameraToProtectTasks(data.selectIds, data.selectData);
		});
		//订阅事件-在展开某个布控任务的详细信息时记录框线规则信息
		PubSub.unsubscribe(self.recordFaceRuleInfoToken);
		self.recordFaceRuleInfoToken = PubSub.subscribe("recordFaceRuleInfo", function(msg, data) {
			self.recordFaceRuleInfo(data.data, data.obj);
		});
		//订阅事件-保存人脸布控任务信息，修改了布控区域相关
		PubSub.unsubscribe(self.saveTaskDetailByTaskIdToken);
		self.saveTaskDetailByTaskIdToken = PubSub.subscribe("saveTaskDetailByTaskId", function() {
			self.saveTaskDetailByTaskId();
		});
	};

	Controller.prototype = {
		/**
		 * 初始化页面
		 */
		init: function () {

		},

		/**
		 *  根据摄像机id获取该摄像机已参与的所有布控任务列表
		 */
		getCurCameraProtectLists: function () {

			//读取数据并渲染
			model.getData("getCurCameraProtectLists", {
				id: globalVar.defence.cameraData.id,
				flag: "Y",
				pageSize: 100,
				pageNum: 1
			}, {
				beforesend: function () {
					view.showLoading("areadyin");
				}
			}, "/" + globalVar.defence.cameraData.id).then(function (res) {
				if (res.code === 200) {
					//渲染页面
					view.initPage(res.data.tasks);
				} else if (res.code === 500) {
					notify.error(res.data.message + "！错误码：" + res.code);
				} else {
					notify.error("读取当前摄像机参加的布控任务列表失败！错误码：" + res.code);
				}
			}, function () {
				notify.error("读取当前摄像机参加的布控任务列表失败，服务器或网络异常！");
			});
		},

		/**
		 * 获取当前摄像机未参与的布控任务列表
		 */
		getNotInTasks: function () {

			model.getData("getNoSelectProtectByCameraId", {
				id: globalVar.defence.cameraData.id,
				flag: "N",
				pageSize: 1000,
				pageNum: 1
			}, {
				beforesend: function () {
					view.showLoading("notin");
				}
			}, "/" + globalVar.defence.cameraData.id).then(function (res) {
				if (res.code === 200) {
					//渲染页面
					view.showNotInTasks(res.data.tasks);
				} else if (res.code === 500) {
					notify.error(res.data.message + "！错误码：" + res.data);
				} else {
					notify.error("加载当前摄像机未参与的布控任务列表失败！错误码：" + res.code);
				}
			}, function () {
				notify.error("获取布控任务详细信息失败，服务器或网络异常！");
			});
		},

		/**
		 * 删除摄像机的某个布控任务
		 * @param taskId - 任务id
		 * @param obj - 布控任务所在的容器
		 */
		delProtectTask: function (taskId, obj) {
			model.postData("deleteCameraByTaskId", {
				taskId: parseInt(taskId),
				cameraId: parseInt(globalVar.defence.cameraData.id),
				_method: "delete"
			}, undefined, "/" + parseInt(taskId) + "/camera/" + parseInt(globalVar.defence.cameraData.id)).then(function (res) {
				if (res.code === 200) {
					notify.success("删除成功！");
					//更新界面
					view.refreshPageAfterDel(obj, taskId);
				} else if (res.code === 500) {
					notify.error(res.data.message + "！错误码：" + res.code);
				} else {
					notify.error("删除该摄像机的布控任务失败！错误码：" + res.code);
				}
			}, function () {
				notify.error("删除该摄像机的布控任务失败，服务器或网络异常！");
			});
		},

		/**
		 * 获取布控任务的详细信息
		 * @param taskId - 布控任务的id
		 * @param container - 当前布控任务的父元素容器
		 */
		getProtectTaskDetail: function (taskId, container) {

			model.getData("getProtectTaskDetails", {
				taskId: taskId,
				cameraId: parseInt(globalVar.defence.cameraData.id)
			}, {
				beforesend: function () {
					view.showLoading("detail", container);
				}
			}, "/" + taskId + "/camera/" + parseInt(globalVar.defence.cameraData.id)).then(function (res) {
				if (res.code === 200) {
					//渲染模板
					view.showTaskDetails(res.data, container);
				} else if (res.code === 500) {
					notify.error(res.data.message + "！错误码：" + res.code);
				} else {
					notify.error("获取布控任务详细信息失败！错误码：" + res.code);
				}
			}, function () {
				notify.error("获取布控任务详细信息失败，服务器或网络异常！");
			});
		},

		/**
		 * 获取摄像机中的一个在线通道，优先高清
		 * @param camera - 摄像机信息
		 * @returns {Array} - 返回的可用通道
		 */
		getOnlineChannel: function(camera) {
			//备用不在线通道
			var offlineChannel = null, channel = [], isonline = false;
			//获取一个在线通道
			camera.hd_channel.each(function (item) {
				if (item.channel_status === 0) {
					channel.push(item);
					isonline = true;
				} else {
					offlineChannel = item;
				}
			});
			if (!isonline) {
				camera.sd_channel.each(function (item) {
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
			return channel;
		},

		/**
		 * 将当前摄像机添加到已有的布控任务中，可以一次性添加多个
		 * @param protectIds - 要参加的布控任务id数组
		 * @param selectData - 要参加的布控任务信息对象数组，以备添加成功后动态渲染页面
		 */
		insertCameraToProtectTasks: function (protectIds, selectData) {
			var self = this;

			model.getData("getOnlineChannel", {
				cameraId: parseInt(globalVar.defence.cameraData.id)
			}).then(function (res) {
				if (res.code === 200) {
					var camera = res.data.data;
					//扩展默认规则参数
					jQuery.extend(camera, {
						"minSize": 60,
						"maxSize": 200,
						"left": 0,
						"top": 0,
						"right": 0,
						"bottom": 0
					});
					//过滤可用通道
					camera.channels = self.getOnlineChannel(camera);
					//插入任务
					self.dealInsertCameraToTask([camera], protectIds, selectData);
				} else if (res.code === 500) {
					notify.error(res.data.message + "！错误码：" + res.code);
				} else {
					notify.error("获取摄像机的详细信息失败！错误码：" + res.code);
				}
			}, function () {
				notify.error("获取摄像机的详细信息失败，请查看网络状况！");
			});
		},

		/**
		 * 将摄像机添加到任务中
		 * @param camera - 当前摄像机的信息
		 * @param protectIds - 选择的任务ids
		 * @param selectData - 选择的任务对象数组，用于成功后的渲染
		 */
		dealInsertCameraToTask: function(camera, protectIds, selectData) {

			model.postData("insertCameraToProtectTask", {
				camera: JSON.stringify(camera),
				taskId: protectIds.join(",")
			}).then(function(res){
				if (res.code === 200) {
					notify.success("成功添加摄像机到已选择的布控任务！");
					//渲染模板
					view.refreshPageAfterInsert(selectData);
				} else if (res.code === 500) {
					notify.error(res.data.message + "！错误码：" + res.code);
				} else {
					notify.error("添加摄像机到已选择的布控任务中失败！错误码：" + res.code);
				}
			},function(){
				notify.error("添加摄像机到已选择的布控任务中失败，服务器或网络异常！");
			});
		},

		/**
		 * 获取当前的摄像机当前任务的布控规则
		 */
		getCameraControlRule: function() {
			var globalRuleInfo = globalVar.defence.ruleInfo;
			//从页面控件中获取最大、最小人脸大小，因为可能是手输入的
			var minW = parseInt(globalRuleInfo.faceProtectInfo.containerObj.find(".min-face .face-protect-info[name='faceFlagW']").val()), minH = parseInt(globalRuleInfo.faceProtectInfo.containerObj.find(".min-face .face-protect-info[name='faceFlagH']").val()), maxW = parseInt(globalRuleInfo.faceProtectInfo.containerObj.find(".max-face .face-protect-info[name='faceFlagW']").val()), maxH = parseInt(globalRuleInfo.faceProtectInfo.containerObj.find(".max-face .face-protect-info[name='faceFlagH']").val());
			//对最大最小人脸尺寸进行差错验证
			if (!DefenceTools.invalidate.filterNumbers(minW, false) || !DefenceTools.invalidate.filterNumbers(minH, false)) {
				notify.warn("最小人脸中输入的值必须是非负数值，请检查更正！");
				return { result: false };
			}
			if (!DefenceTools.invalidate.filterNumbers(maxW, false) || !DefenceTools.invalidate.filterNumbers(maxH, false)) {
				notify.warn("最大人脸中输入的值必须是非负数值，请检查更正！");
				return { result: false };
			}
			//对最小最大人脸进行摄像机边界检测
			var curCameraRate = DefenceTools.getCameraRate();
			if (minW > curCameraRate.width || minH > curCameraRate.height) {
				notify.warn("最小人脸中输入的值超过了当前摄像机的分辨率，请检查更正！");
				return { result: false };
			}
			if (maxW > curCameraRate.width || maxH > curCameraRate.height) {
				notify.warn("最大人脸中输入的值超过了当前摄像机的分辨率，请检查更正！");
				return { result: false };
			}
			//由于布控算法人脸检测区域为正方形，所以取最小人脸的最小边和最大人脸的最大边
			var min = (minW > minH) ? minH : minW;
			var max = (maxW > maxH) ? maxW : maxH;
			//返回正确的结果
			return {
				minSize: min,
				maxSize: max,
				left: globalRuleInfo.faceProtectInfo.pointsInfo.left,
				top: globalRuleInfo.faceProtectInfo.pointsInfo.top,
				right: globalRuleInfo.faceProtectInfo.pointsInfo.right,
				bottom: globalRuleInfo.faceProtectInfo.pointsInfo.bottom,
				result: true
			};
		},

		/**
		 * 保存人脸布控任务信息，修改了布控区域相关
		 */
		saveTaskDetailByTaskId: function() {
			var globalRuleInfo = globalVar.defence.ruleInfo;
			var self = this, cameras = globalRuleInfo.faceProtectInfo.data.cameras;
			//获取在线通道
			cameras[0].channels = self.getOnlineChannel(cameras[0]);
			//获取框线规则信息
			var ruleInfo = self.getCameraControlRule();
			//对框线规则进行差错验证
			if (!ruleInfo.result) {
				return;
			}
			//填充框线规则
			cameras[0].minSize = ruleInfo.minSize;
			cameras[0].maxSize = ruleInfo.maxSize;
			cameras[0].left = ruleInfo.left;
			cameras[0].top = ruleInfo.top;
			cameras[0].right = ruleInfo.right;
			cameras[0].bottom = ruleInfo.bottom;
			//准备参数信息
			var data = {
				id: globalRuleInfo.faceProtectInfo.data.task.id,
				name: globalRuleInfo.faceProtectInfo.data.task.name,
				libraries: JSON.stringify(globalRuleInfo.faceProtectInfo.data.libraries),
				startTime: Toolkit.mills2str(globalRuleInfo.faceProtectInfo.data.task.startTime),
				endTime: Toolkit.mills2str(globalRuleInfo.faceProtectInfo.data.task.endTime),
				type: 1,//1人员，2车辆
				level: globalRuleInfo.faceProtectInfo.data.task.level,
				cameras: JSON.stringify(cameras),
				_method: "put",
				isTaskto: true
			};
			//保存到数据库
			model.postData("saveTaskDetailByTaskId", data, undefined, "/" + data.id).then(function(res){
				if (res.code === 200) {
					notify.success("保存任务成功！");
					//刷新页面
					view.refreshPageAfterSave();
				} else if (res.code === 500) {
					notify.error(res.data.message + "！错误码：" + res.code);
				} else {
					notify.error("保存任务失败！错误码：" + res.code);
				}
			}, function() {
				notify.error("保存任务失败，服务器或网络异常！");
			});
		},

		/**
		 * 点开摄像机参与的某个布控任务时，记录并填充参与该任务中的
		 * @param data - 读取该摄像机参与到该任务的信息
		 * @param containerObj - 信息的dom容器
		 */
		recordFaceRuleInfo: function(data, containerObj){
			var globalRuleInfo = globalVar.defence.ruleInfo;
			//先重置是否改变标记(防止用户改动后未关闭时切换到其他任务)
			if(globalRuleInfo.faceProtectInfo.hasChange){
				globalRuleInfo.faceProtectInfo.hasChange = false;
			}
			//执行填充
			globalRuleInfo.faceProtectInfo.minSize = parseInt(data.cameras[0].minSize ? data.cameras[0].minSize: 60);
			globalRuleInfo.faceProtectInfo.maxSize = parseInt(data.cameras[0].maxSize ? data.cameras[0].maxSize: 200);
			globalRuleInfo.faceProtectInfo.pointsInfo.left = parseFloat(data.cameras[0].left ? data.cameras[0].left: 0);
			globalRuleInfo.faceProtectInfo.pointsInfo.top = parseFloat(data.cameras[0].top ? data.cameras[0].top: 0);
			globalRuleInfo.faceProtectInfo.pointsInfo.right = parseFloat(data.cameras[0].right ? data.cameras[0].right: 0);
			globalRuleInfo.faceProtectInfo.pointsInfo.bottom = parseFloat(data.cameras[0].bottom ? data.cameras[0].bottom: 0);
			globalRuleInfo.faceProtectInfo.data = data;

			globalRuleInfo.faceProtectInfo.containerObj = containerObj;
		},

		/**
		 * 获取当前布控任务的人脸检测区域信息,眼睛查看的时候调用
		 * @param cameraRate - 当前摄像机分辨率
		 * @returns {{text: string, type: string, points: number[], drawRate: *}[]} - 返回人脸检测区域
		 */
		getFaceRuleDetails: function(cameraRate){
			var globalRuleInfo = globalVar.defence.ruleInfo;
			var ruleInfo = [{
				text: "人脸检测区域",
				type: "rect",
				points: [4],
				drawRate: cameraRate
			}];
			//获取当前的坐标区域
			var x = 50, y = 50, width = cameraRate.width - 100, height = cameraRate.height - 100;
			x = (globalRuleInfo.faceProtectInfo.pointsInfo.left === 0) ? x : globalRuleInfo.faceProtectInfo.pointsInfo.left;
			y = (globalRuleInfo.faceProtectInfo.pointsInfo.left === 0) ? y : globalRuleInfo.faceProtectInfo.pointsInfo.top;
			width = ((globalRuleInfo.faceProtectInfo.pointsInfo.right - globalRuleInfo.faceProtectInfo.pointsInfo.left) > 0) ? (globalRuleInfo.faceProtectInfo.pointsInfo.right - globalRuleInfo.faceProtectInfo.pointsInfo.left) : width;
			height = ((globalRuleInfo.faceProtectInfo.pointsInfo.bottom - globalRuleInfo.faceProtectInfo.pointsInfo.top) > 0) ? (globalRuleInfo.faceProtectInfo.pointsInfo.bottom - globalRuleInfo.faceProtectInfo.pointsInfo.top) : height;
			//装载坐标信息
			ruleInfo[0].points[0] = [];
			ruleInfo[0].points[0][0] = x;
			ruleInfo[0].points[0][1] = y;

			ruleInfo[0].points[1] = [];
			ruleInfo[0].points[1][0] = parseFloat(x) + parseFloat(width);
			ruleInfo[0].points[1][1] = y;

			ruleInfo[0].points[2] = [];
			ruleInfo[0].points[2][0] = parseFloat(x) + parseFloat(width);
			ruleInfo[0].points[2][1] = parseFloat(y) + parseFloat(height);

			ruleInfo[0].points[3] = [];
			ruleInfo[0].points[3][0] = x;
			ruleInfo[0].points[3][1] = parseFloat(y) + parseFloat(height);
			//返回布控任务的规则区域
			return ruleInfo;
		}
	};

	return new Controller();
});
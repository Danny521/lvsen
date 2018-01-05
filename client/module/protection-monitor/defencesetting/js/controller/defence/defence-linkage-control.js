define([
	"/module/protection-monitor/defencesetting/js/model/control-linkage-model.js",
	"/module/common/checkLinkage/js/cache.js"
], function(linkageModel, Cache) {
	function Controller() {

		this.sendObj = {
			ptz: null,
			tvWall: {
				model: null,
				chanel: null
			},
			isSendMessage: false,
			isLinkGis: false,
			isLinkMobile:false
		};
		this.chanelList = [];
		// 任务id，如果为0为新建任务，如果不为0，为编辑任务
		this.taskId = 0;
	}
	Controller.prototype = {
		constructor: Controller,
		/**
		 * [resetElement 重置缓存的元素]
		 * @return {[type]} [description]
		 */
		resetElement: function() {
			var self = this;
			self.sendObj.ptz = null;
			self.sendObj.tvWall.model = null;
			self.sendObj.tvWall.chanel = null;
			self.sendObj.isSendMessage = false;
			self.sendObj.isLinkGis = false;
			self.sendObj.isLinkMobile = false;
		},
		/**
		 * [getLinkageParams 获取要发送给后台的参数]
		 * @param  {[type]} taskId [任务id]
		 * @return {[type]}        [参数列表]
		 */
		getLinkageParams: function(taskId, pccId, cameraData) {
			var self = this,
				params = [];
			//短信
		    Cache.submitLinkageData.phoneList.forEach(function(item) {
				params.push({
					task_id: taskId,
					pcc_task_id: pccId,
					type: 1,
					category: 1,
					way: item.way,
					start_time: Cache.timeArea.startHour + ":" + Cache.timeArea.startMinute,
					end_time: Cache.timeArea.endHour + ":" + Cache.timeArea.endMinute
				});
			});
			//邮箱
			Cache.submitLinkageData.emailList.forEach(function(item){
                params.push({
					task_id: taskId,
					pcc_task_id: pccId,
					type: 2,
					category: 1,
					way: item.way
				});
			});
			// 组装是否发送消息提醒参数
			if (Cache.submitLinkageData.sendMessage) {
				params.push({
					task_id: taskId,
					pcc_task_id: pccId,
					type: 3,
					way: "Y",
					start_time: "",
					end_time: "",
					category: 1,
					camera_id:cameraData.id,
		            channel_id:cameraData.curChannelId,
					user_id: jQuery("#userEntry").data("userid")
				});
			}
			//是否联动地图
			if (Cache.submitLinkageData.showGIS) {
				params.push({
					task_id: taskId,
					pcc_task_id: pccId,
					type: 6,
					way: "Y",
					start_time: "",
					end_time: "",
					category: 1,
					camera_id:cameraData.id,
		            channel_id:cameraData.curChannelId,
					user_id: jQuery("#userEntry").data("userid")
				});
			}
			//是否联动移动端
			if (Cache.submitLinkageData.showMobile) {
				params.push({
					task_id: taskId,
					pcc_task_id: pccId,
					type: 7,
					way: "Y",
					start_time: "",
					end_time: "",
					category: 1,
					camera_id:cameraData.id,
		            channel_id:cameraData.curChannelId,
					user_id: jQuery("#userEntry").data("userid")
				});
			}
			//电视墙
			if (Cache.submitLinkageData.tvwallList.length > 0) {
				Cache.submitLinkageData.tvwallList.forEach(function(item) {
					params.push({
						task_id: taskId,
						pcc_task_id: pccId,
						type: 5,
						way: "Y",
						start_time: "",
						end_time: "",
						category: 1,
						tvwallLayout_id: item.tvwallLayout_id || "",
						tvwallLayout_name: item.tvwallLayout_name || "",
						mdTvwallLayout_id: item.mdTvwallLayout_id || "",
						mdTvwallLayout_sceen: item.mdTvwallLayout_sceen || "",
						camera_id: item.camera_id,
						channel_id: item.channel_id,
						user_id: jQuery("#userEntry").data("userid")
					});
				});
			}
			//监控画面
			if(Cache.submitLinkageData.monitorCameraList.length > 0){
				Cache.submitLinkageData.monitorCameraList.forEach(function(item){
					params.push({
						task_id: taskId,
						pcc_task_id: pccId,
						type: 8,
						way: "Y",
						start_time: "",
						end_time: "",
						category: 1,
						cameraData: item.cameraData,
						camera_id: item.camera_id,
						channel_id: item.channel_id,
						user_id: jQuery("#userEntry").data("userid")
					});
				})
			}
			//预置位
			if (Cache.submitLinkageData.PTZCameraList.length > 0) {
				Cache.submitLinkageData.PTZCameraList.forEach(function(item) {
					params.push({
						task_id: taskId,
						pcc_task_id: pccId,
						type: 4,
						way: "Y",
						start_time: "",
						end_time: "",
						category: 1,
						preset_id: item.preset_id || "",
						preset_name: item.preset_name || "",
						camera_id: item.camera_id,
						channel_id: item.channel_id,
						user_id:jQuery("#userEntry").data("userid")
					});
				})
			}

			return params;
		},
		/**
		 * [addLinkageBatch 批量添加联动规则]
		 * @param {[type]}   taskId   [任务id]
		 * @param {Function} callback [description]
		 */
		addLinkageBatch: function(taskId, pccId, cameraData, callback) {
			var self = this,
				params = self.getLinkageParams(taskId, pccId, cameraData),
                option = "";
			if (params.length > 0) {
				option = JSON.stringify(params);
			}
			// 发送联动请求
			linkageModel.postData("addLinkageBatch", {
					taskId: taskId,
					anVoList: option
				})
				.then(function(res) {
					if (res.code === 200) {
						//清空联动数据缓存
						Cache.clearCache(Cache.submitLinkageData);
						return callback(null);
					}
					callback(res.message || "添加联动规则失败");
				}, function(err) {
					callback("添加联动规则失败");
				})
		},
		/**
		 * [getLinkageByTaskId 根据任务id获取联动列表]
		 * @param  {[type]}   id       [任务id]
		 * @param  {Function} callback [回调函数]
		 * @return {[type]}            [description]
		 */
		getLinkageByTaskId: function(id, callback) {
			var self = this;
			linkageModel.getData("getLinkage", {
				task_id: id,
				category: 1
			}).then(function(res) {
				if (res.code === 200) {
					return callback(null, res.data);
				}
				callback("获取联动规则异常！");
			}, function() {
				callback("网络异常！");
			});
		},
		/**
		 * [setLinkageParams 编辑时，获取联动列表后，写入缓存]
		 * @param {[type]} data [description]
		 */
		setLinkageParams: function(data) {
			var self = this;
			// 设置之前先清空
			self.resetElement();
			data.forEach(function(item) {
				// 预置位
				if (item.type === 4) {
					self.sendObj.ptz = {
						preset_id: item.preset_id,
						preset_name: item.preset_name
					}
					return;
				}
				// 电视墙
				if (item.type === 5) {
					self.sendObj.tvWall = {
						model: {
							tvwallLayout_id: item.tvwallLayout_id,
							tvwallLayout_name: item.tvwallLayout_name
						},
						chanel: {
							mdTvwallLayout_id: item.mdTvwallLayout_id,
							mdTvwallLayout_sceen: item.mdTvwallLayout_sceen
						}
					}
					return;
				}
				// 收集是否发送消息提醒
				if (item.type === 3 && item.way === "Y") {
					self.sendObj.isSendMessage = true;
				}
				//是否联动地图
				if (item.type === 6 && item.way === "Y") {
					self.sendObj.isLinkGis = true;
				}
				//是否联动移动端
				if (item.type === 7 && item.way === "Y") {
					self.sendObj.isLinkMobile = true;
				}
			})
		},
		/**
		 * [removeLinkageByTaskId 根据任务id清空联动规则]
		 * @param  {[type]}   id       [任务id]
		 * @param  {Function} callback [回调函数]
		 * @return {[type]}            [description]
		 */
		removeLinkageByTaskId: function(id, callback) {
			var self = this;
			linkageModel.getData("deleteLinkage", {
				task_id: id
			}).then(function(res) {
				if (res.code === 200) {
					return callback(null);
				}

				callback("删除联动规则异常！");
			}, function() {
				callback("网络异常！");
			});
		}
	};

	return new Controller();
})
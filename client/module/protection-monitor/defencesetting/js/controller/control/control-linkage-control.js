define([
	"/module/protection-monitor/defencesetting/js/model/control-linkage-model.js",
	"/module/common/checkLinkage/js/cache.js"
], function(linkageModel, Cache) {
	function Controller() {
		// 手机号码列表
		this.phoneList = [];
		// 短信通知时间段
		this.timeArea = {
			startHour: "00",
			startMinute: "00",
			endHour: "24",
			endMinute: "00"
		};
		// 邮箱列表
		this.emailList = [];
		// 是否发生消息通知
		this.sendMessage = false; // Y
		// 任务id，如果为0为新建任务，如果不为0，为编辑任务
		this.taskId = "";
	}
	Controller.prototype = {
		constructor: Controller,
		/**
		 * [checkValid 检测手机号和邮箱的合法性]
		 * @param  {[type]} type  [检测类型：手机号或邮箱]
		 * @param  {[type]} value [值]
		 * @return {[type]}       [true or false]
		 */
		checkValid: function(type, value) {
			var regMap = {
					telephone: /^(1[3578][0-9]{9})$/,
					email: /\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/
				};

			return regMap[type].test(value);
		},
		/**
		 * [checkRepeat 检测手机号或邮箱是否重复]
		 * @param  {[type]} type  [检测类型]
		 * @param  {[type]} value [值]
		 * @return {[type]}       [true or false]
		 */
		checkRepeat: function(type, value) {
			var typeMap = {
					telephone: "phoneList",
					email: "emailList"
				};

			return this[typeMap[type]].indexOf(value) === -1 ? false : true;
		},
		/**
		 * [removeElement 删除缓存的手机号或者邮箱]
		 * @param  {[type]} type  [需要删除的类型]
		 * @param  {[type]} value [值]
		 * @return {[type]}       [缓存的值的数量]
		 */
		removeElement: function(type, value) {
			var typeMap = {
					telephone: "phoneList",
					email: "emailList"
				};

			var list = this[typeMap[type]],
				index = list.indexOf(value);
			list.splice(index, 1)

			return list.length;
		},
		/**
		 * [resetElement 重置缓存的元素]
		 * @return {[type]} [description]
		 */
		resetElement: function() {
			// 手机号码列表
			this.phoneList = [];
			// 短信通知时间范围
			this.timeArea = {
				startHour: "00",
				startMinute: "00",
				endHour: "24",
				endMinute: "00"
			};
			// 邮箱列表
			this.emailList = [];
			// 是否发生消息通知
			this.sendMessage = false;
		},
		/**
		 * [getLinkageParams 获取要发送给后台的参数]
		 * @param  {[type]} taskId [任务id]
		 * @return {[type]}        [参数列表]
		 */
		getLinkageParams: function(taskId, cameraData) {
			var self = this,
				params = [];
			//短信
		    Cache.submitLinkageData.phoneList.forEach(function(item) {
				params.push({
					task_id: taskId,
					type: 1,
					category: 0,
					way: item.way,
					start_time: Cache.timeArea.startHour + ":" + Cache.timeArea.startMinute,
					end_time: Cache.timeArea.endHour + ":" + Cache.timeArea.endMinute
				});
			});
			//邮箱
			Cache.submitLinkageData.emailList.forEach(function(item){
                params.push({
					task_id: taskId,
					type: 2,
					category: 0,
					way: item.way
				});
			});
			// 组装是否发送消息提醒参数
			if (Cache.submitLinkageData.sendMessage) {
				cameraData.forEach(function(item) {
					params.push({
						task_id: taskId,
						pcc_task_id: "",
						type: 3,
						way: "Y",
						start_time: "",
						end_time: "",
						category: 0,
						camera_id: item.id,
						channel_id: item.channels[0].id,
						user_id: jQuery("#userEntry").data("userid")
					});
				})
			}
			//是否联动地图
			if (Cache.submitLinkageData.showGIS) {
				cameraData.forEach(function(item) {
					params.push({
						task_id: taskId,
						pcc_task_id: "",
						type: 6,
						way: "Y",
						start_time: "",
						end_time: "",
						category: 0,
						camera_id: item.id,
						channel_id: item.channels[0].id,
						user_id: jQuery("#userEntry").data("userid")
					});
				})
			}
			//是否联动移动端
			if (Cache.submitLinkageData.showMobile) {
				cameraData.forEach(function(item) {
					params.push({
						task_id: taskId,
						pcc_task_id: "",
						type: 7,
						way: "Y",
						start_time: "",
						end_time: "",
						category: 0,
						camera_id: item.id,
						channel_id: item.channels[0].id,
						user_id: jQuery("#userEntry").data("userid")
					});
				})
			}
			//电视墙
			if (Cache.submitLinkageData.tvwallList.length > 0) {
				Cache.submitLinkageData.tvwallList.forEach(function(item) {
					params.push({
						task_id: taskId,
						pcc_task_id: "",
						type: 5,
						way: "Y",
						start_time: "",
						end_time: "",
						category: 0,
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
						pcc_task_id: "",
						type: 8,
						way: "Y",
						start_time: "",
						end_time: "",
						category: 0,
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
						pcc_task_id: "",
						type: 4,
						way: "Y",
						start_time: "",
						end_time: "",
						category: 0,
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
		addLinkageBatch: function(taskId, cameraData, callback) {
			var self = this,
				params = self.getLinkageParams(taskId, cameraData),
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
						return callback(null);
					}

					callback(res.message || "添加联动规则失败");
				}, function(err) {
					callback("添加联动规则失败");
				})
		},
		/**
		 * [setSmsTime 关闭面板前，设置短信通知的时间范围]
		 */
		setSmsTime: function() {
			var self = this,
				$node = jQuery("#linkageChooseContent").find(".telephone-content");
			// 如果为全天
			if ($node.find(".whole-day").find("i").hasClass("active")) {
				self.timeArea = {
					startHour: "00",
					startMinute: "00",
					endHour: "24",
					endMinute: "00"
				};
			} else {
				self.timeArea = {
					startHour: $node.find(".begintime").find(".text1").val(),
					startMinute: $node.find(".begintime").find(".text2").val(),
					endHour: $node.find(".endtime").find(".text1").val(),
					endMinute: $node.find(".endtime").find(".text2").val()
				};
			}
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
				task_id: id
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
			var self = this,
				loadTime = false;
			// 设置之前先清空
			self.resetElement();
			data.forEach(function(item) {
				// 收集手机号
				if (item.type === 1) {
					self.phoneList.push(item.way);
					if (!loadTime) {
						self.timeArea = {
							startHour: item.start_time.split(":")[0],
							startMinute: item.start_time.split(":")[1],
							endHour: item.end_time.split(":")[0],
							endMinute: item.end_time.split(":")[1]
						};
						loadTime = true;
					}

					return;
				}
				// 收集邮箱
				if (item.type === 2) {
					self.emailList.push(item.way);
					return;
				}
				// 收集是否发送消息提醒
				if (item.type === 3 && item.way === "Y") {
					self.sendMessage = true;
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
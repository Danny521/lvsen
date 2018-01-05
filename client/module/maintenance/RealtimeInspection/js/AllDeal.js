/**
 * 实时巡检任务设置
 * @author Leon.z
 * @date   2015/10/13.
 */
define([
	"js/global-varibale",
	"js/mainEvents",
	"js/model/realtimeInspectModel",
	'js/inspect-camera-tree',
	"base.self"
], function(_g, mainEvents, ajaxModel, CameraTree) {
	var mainDeal = function() {}
	mainDeal.prototype = {
		options: {
			compiler: null,
		},
		init: function(compiler) {
			var self = this;
			//初始化模板加载
			self.options.compiler = compiler || _g.compiler;
			//第一次加载任务列表
			self.loadInspectData("", function() {
				self.loadAgin();
			});
		},

		taskNameCheck: null,

		/**
		 * [loadInspectData 记载任务列表]
		 * @param  {[type]}   searchName [用于全局搜索时传递参数]
		 * @param  {Function} callback   [回调函数]
		 * @return {[type]}              [description]
		 */
		loadInspectData: function(searchName, callback) {
			var self = this;
			var param = {};
			if (searchName) {
				param = {
					flag: 2,
					search: searchName,
					pageSize: 5,
					pageNo: _g.currentPage
				}
			} else {
				param = {
					flag: 2,
					search: "",
					pageSize: 5,
					pageNo: _g.currentPage
				}
			}
			ajaxModel.ajaxEvents.getRealInspectData(param, function(res) {
				if (res.code === 200) {
					var html = self.options.compiler({
						taskList: true,
						taskListItem: res.data.list,
					});
					jQuery("#onlineBox").empty().html(html);

					if (res.data.list.length == 0) {
						if (searchName) {
							jQuery("#onlineBox .style-text-info").text("未搜索到匹配实时巡检任务!");
							jQuery(".searchbox").show();
						} else {
							jQuery(".searchbox").hide();
							jQuery("#notask").show();
							jQuery("#mainCount").hide();
							jQuery("#task .newtask").removeAttr("disabled").removeClass("disabled");
							if (_g.timer) {
								clearInterval(_g.timer);
							}
						}
						jQuery("#listPanel .pagepart").hide();
					} else if (res.data.list.length > 0) {
						jQuery(".searchbox").show();
						jQuery("#notask").hide();
						jQuery("#mainCount").show();
						jQuery("#listPanel .pagepart").show();
						jQuery("#listPanel .pagepart").html(self.options.compiler({
							"pagebar": true
						}));
						//渲染分页
						_g.setPagination(res.data.totalRecords, "#listPanel .pagination", param.pageSize, _g.currentPage - 1, function(nextPage) {
							// TODO  分页回调函数
							param.pageNo = nextPage;
							_g.currentPage = nextPage
							ajaxModel.ajaxEvents.getRealInspectData(param, function(res) {
								if (res.code === 200) {
									var html = self.options.compiler({
										taskList: true,
										taskListItem: res.data.list,
									});
									jQuery("#onlineBox").empty().html(html);
									self.loadAgin();
								} else {
									notify.warn("服务器或网络异常！");
								}
							});
						});
						if (typeof callback === "function") {
							callback();
						}
					}

				} else {
					notify.error("获取实时巡检数据失败");
				}

			}, function(error) {
				notify.error("获取实时巡检数据失败")
			});
		},
		/**
		 * [bindStatusChange 更新正在巡检任务进度条]
		 * @param  {Array} currRunTaskidList [description]
		 * @param  {Function} callback [description]
		 * @return {[type]}            [description]
		 */
		bindStatusChange: function(currRunTaskidList,firstTaskId,callback) {
			if (_g.timer) {
				clearInterval(_g.timer);
			}
			_g.timer = setInterval(function() {
				if(currRunTaskidList.length === 0){
					clearInterval(_g.timer);
				}
				var tasksIds = currRunTaskidList.join(",");
				ajaxModel.ajaxEvents.getRealInspectTaskPro({
					taskid: tasksIds
				}, function(res) {
					if (res.code === 200) {
						var loadData = res.data;
						for (var i = 0, le = loadData.length; i < le; i++) {
							if (loadData[i] !== null) {
								var node = jQuery("#onlineBox li[data-taskid='" + loadData[i].checkTaskId + "']");
								node.find(".progressBar .currPro").width(loadData[i].progress + "%");
								if (loadData[i].progress >= 89) {
									node.find(".progressBar .processHelper").html(loadData[i].progress + "%").css("left", "89%");
								} else {
									node.find(".progressBar .processHelper").html(loadData[i].progress + "%").css("left", loadData[i].progress + "%");
								}
								if (loadData[i].progress >= 100) {
									node.attr("data-taskstatus",3);
									node.find("div.statuslist").find(".taskstatus").text("已巡检");
									//删除巡检完成的任务ID
									var index = currRunTaskidList.indexOf(loadData[i].checkTaskId + "");
										currRunTaskidList.splice(1,index);
									if (typeof callback === "function") {
										callback(firstTaskId);
									}
								}
							}
						}
					} else if (code === 500) {
						
					}
				});
			}, 4000);
		},
		/**
		 * [loadTree 加载组织树]
		 * @return {[type]} [description]
		 */
		loadTree: function(elem) {
			var self = this;
			_g.cameraTree = new CameraTree({
				node: elem,
				nodeHeight: jQuery('.tree-container .viewport').css('height', jQuery(".tree-container").height()),
				selectable: true
			});
			setTimeout(function() {
				jQuery('.treePanel li.root i.fold').trigger("click");
			}, 100)
		},
		/**
		 * [setTaskPanel 新建任务设置面板]
		 */
		setTaskPanel: function() {
			var self = this;
			var html = self.options.compiler({
				taskSet: true
			});
			jQuery(".inspctDetailPanel").show().html(html);
			if (jQuery(".inspctDetailPanel .taskset-top").length > 0) {
				setTimeout(function() {
					self.loadTree("#aside .inspctDetailPanel .statTree");
				}, 100);

			}
		},
		/**
		 * [setPlanPanel 新建计划]
		 */
		setPlanPanel: function() {
			var self = this,
				rData = {
					planSet: true
				};
			var html = self.options.compiler(rData);
			jQuery(".planDetailPanel").show().html(html);
			if (jQuery(".planDetailPanel .planset-top").length > 0) {
				setTimeout(function() {
					self.loadTree("#aside .treePanel.statTree");
				}, 100);

			}
		},
		/**
		 * [setPlanFre 新建计划设置频率面板]
		 */
		setPlanFre: function(val) {
			var self = this,
				rData;
			if (val === '2') {
				rData = {
					planWeek: true
				}
			}
			if (val === '3') {
				rData = {
					planMonth: true
				}
			}
			var html = self.options.compiler(rData);
			jQuery("#weekOrMonth").html(html).addClass('plan-date');

		},
		/**
		 * [saveTaskAndDeal 设置巡检任务保存并回调处理函数]
		 * @param  {[type]} data [description]
		 * @return {[type]}      [description]
		 */
		saveTaskAndDeal: function(data) {
			var self = this;
			if (data) {
				if (!data.flag) {
					$.extend(true, data, {
						flag: 2
					});
				}
				var commonDialog = new AlertDialog({
					title: '保存巡检任务中,请等待！',
					confirmText: '关闭'
				});
				ajaxModel.ajaxEvents.addRealInspectTask(data, function(res) {
					if (res && res.code === 500) {
						notify.warn(res.data);
						return;
					}
					if (res && res.code === 200) {
						self.taskTimer(res.data.taskId);
						jQuery(".inspctDetailPanel").hide();
						jQuery("#listPanel").show();					
						logDict.insertLog('m2', 'f13', 'o1', '', data.name + '巡检任务'); // 新增日志
					}
					_g.currentPage = 1;
					if (_g.timer) {
						clearInterval(_g.timer);
					}
					self.loadInspectData("", function() {
						self.loadAgin();
					});
				}, function() {
					notify.warn("网络异常");
				});
			}
		},
		taskTimer: function(id) {
			var self = this,
				url = '/service/inspect/task/get_add_inspect_task_flag',
				data = {
					taskId: id
				},
				taskTm = window.taskTm;
			if (taskTm) {
				clearInterval(taskTm);
			}
			taskTm = setInterval(function() {
				jQuery.ajax({
					url: url,
					data: data,
					type: 'get',
				}).then(function(res) {
					if (res && res.data === true) {
						clearInterval(taskTm)
						jQuery('.common-dialog .button').trigger('click');
					}
				})
			}, 1000);

			jQuery('.common-dialog .button, .common-dialog .close').on('click', function() {
				if (taskTm) {
					clearInterval(taskTm);
				}
			})
		},

		/**
		 * [deleteTask 删除巡检任务]
		 * @param  {[type]} taskId [description]
		 * @return {[type]}        [description]
		 */
		deleteTask: function(taskId, taskName) {
			var self = this,
				flag = false;
			if (taskId) {
				ajaxModel.ajaxEvents.DeleteRealInspectTask({
					taskid: taskId
				}, function(res) {
					if (res.code === 200) {
						notify.success(res.data);
						logDict.insertLog('m2', 'f13', 'o3', '', taskName + '巡检任务'); // 新增日志
						if (_g.timer) {
							clearInterval(_g.timer);
						}
						_g.currentPage = 1;
						self.loadInspectData("", function() {
							self.loadAgin();
						});
					}

				});
			}
		},
		/**
		 * [loadAgin 从新跟新巡检列表]
		 * @return {[type]} [description]
		 */
		loadAgin: function(taskId) {
			var self = this,
				currRunTaskidList = [];
			jQuery("#onlineBox").find("li").each(function() {
				var status = jQuery(this).attr("data-taskStatus");
				if (status === 2 || status === "2") {
					var taskId = jQuery(this).attr("data-taskid");
					if(jQuery(this).hasClass("active")){
						currRunTaskidList.unshift(taskId);
					}else{
						currRunTaskidList.push(taskId);
					}
				}
			});
			//说明有正在运行的任务
			if(currRunTaskidList.length>0){
				var firstTaskId = "";
				if(taskId){
					firstTaskId = taskId;
				}else{
					//默认显示正在运行的第一个任务
					firstTaskId = currRunTaskidList[0];
				}
				jQuery("#onlineBox li[data-taskid='" + firstTaskId + "']").addClass("active").siblings().removeClass("active");
				jQuery("#mainCount .btnTools").find("button").removeAttr("disabled").removeClass("disabled");
				self.bindStatusChange(currRunTaskidList, firstTaskId, function(id) {
					self.getInspectTaskInfo(id);
				});
			}else{
				var activeChild = jQuery("#onlineBox li.active");
					//判断若存在高亮的任务
					if(activeChild.length > 0){
						var taskId = activeChild.attr("data-taskid");
							self.getInspectTaskInfo(taskId);
					}else{
						//不存在高亮的任务
						var firstChild = jQuery("#onlineBox li:first-child"),
							taskId = firstChild.attr("data-taskid");
							firstChild.addClass("active");
							self.getInspectTaskInfo(taskId);
					}
			}
		},

		/**
		 * [getInspectPlanInfo 获取点击巡检计划信息]
		 * @param  {[type]} taskId [description]
		 * @return {[type]}        [description]
		 */
		getInspectPlanInfo: function(planId, sCondition) {
			var self = this;

			if (planId) {
				var sData = {
					planTaskId: planId,
					pageNo: 1,
					pageSize: 10,
					exportType:sCondition?sCondition.exportType:""
				}
				if (sCondition) {

					if (sCondition.camName) {
						sData.cameraName = sCondition.camName;
						logDict.insertLog('m2', 'f14', 'o13', '', sCondition.camName + '巡检计划');
					}
					if (sCondition.camStatus) {
						sData.status = sCondition.camStatus;
					}
					if (sCondition.camStartTime) {
						sData.startTime = sCondition.camStartTime;
					}
					if (sCondition.camEndTime) {
						sData.endTime = sCondition.camEndTime;
					}
				}

				ajaxModel.ajaxEvents.getRealInspectPlanInfo(sData, function(res) {

					if (res && res.code === 200) {

						if (res.data.list || sCondition) {
							jQuery("#mainCount").show();
							jQuery("#notask").hide();

							jQuery('#major .header').css('border-bottom', 'none');
							var html = self.options.compiler({
								planResult: res.data
							});
							jQuery("#major h3.title").html(html);
							var html = self.options.compiler({
								camList: res.data.list
							});
							jQuery("#examinetable").html(html)
							if (res.data.list && res.data.list.length > 0) {
								jQuery("#exTable").show().html(self.options.compiler({
									"pagebar": true
								}));
							}

							_g.setPagination(res.data.totalRecords, "#exTable", 10, res.data.pageNo - 1, function(nextPage) {
								// TODO  分页回调函数
								sData.pageNo = nextPage;
								_g.currentPage = nextPage;
								ajaxModel.ajaxEvents.getRealInspectPlanInfo(sData, function(res) {
									if (res && res.code === 200) {
										if (res.data.list || sCondition) {
											jQuery("#mainCount").show();
											jQuery("#notask").hide();
											var html = self.options.compiler({
												camList: res.data.list
											});
											jQuery("#examinetable").html(html)
										} else {
											jQuery("#mainCount").hide();
											jQuery("#notask").show();


										}
									}
								});
							});
						} else {
							jQuery("#mainCount").hide();
							jQuery("#notask").show();

						}

					} else {
						notify.warn('暂无结果')
					}
				});



			}
		},


		/**
		 * [getInspectPlanInfo 巡检计划导出]
		 * @param  {[type]} taskId [description]
		 * @return {[type]}        [description]
		 */
		getInspectPlanExport: function(planId, sCondition) {
			var self = this;
			if (planId) {
				var sData = {};
				sData.planTaskId = planId;
				sData.title = sCondition.title;
				sData.fileName = sCondition.fileName;
				if (sCondition) {
					sData.cameraName = sCondition.camName || "";
					sData.status = sCondition.camStatus || "";
					sData.startTime = sCondition.camStartTime || "";
					sData.endTime = sCondition.camEndTime || "";
					sData.exportType = sCondition.exportType||"";
				}
				if (sData) {
					var url = encodeURI(encodeURI("/service/inspect/real/taskPlan/export?title=" + sData.title + "&fileName=" + sData.fileName +"&exportType=" + sData.exportType + "&planTaskId=" + sData.planTaskId + "&startTime=" + sData.startTime + "&endTime=" + sData.endTime + "&cameraName=" + sData.cameraName + "&status=" + sData.status));
					jQuery("#major .myExport").attr("src", url);
				}
			}
		},

		/**
		 * [getInspectTaskInfo 获取点击巡检任务信息]
		 * @param  {[type]} taskId [description]
		 * @return {[type]}        [description]
		 */
		getInspectTaskInfo: function(taskId, camName, extype, camStatus) {
			var self = this;
			if (taskId) {
				var sData = {
					taskid: taskId,
					pageNo: 1,
					pageSize: 10,
					cameraName: camName || "",
					exportType: extype || "",
					status: camStatus || ""
				}
				ajaxModel.ajaxEvents.getRealInspectTaskInfo(sData, function(res) {

					var html = self.options.compiler({
						totalResult: res.data
					});
					jQuery("#major h3.title").html(html);
					jQuery('#major .header').css('border-bottom', '1px solid #DFDFDF');

				});
				if (camName) {
					logDict.insertLog('m2', 'f13', 'o13', '', camName + '巡检任务');
				}
				ajaxModel.ajaxEvents.getRealInspectTaskRecord({
					taskId: sData.taskid,
					cameraName: sData.cameraName,
					exportType: sData.exportType,
					status: sData.status,
					pageNo: sData.pageNo,
					pageSize: sData.pageSize
				}, function(res) {
					if (res && res.code === 200) {
						var html = self.options.compiler({
							camList: res.data.list
						});
						jQuery("#examinetable").html(html)
						_g.setPagination(res.data.totalRecords, "#exTable", sData.pageSize, res.data.pageNo - 1, function(nextPage) {

							// TODO  分页回调函数
							sData.pageNo = nextPage;
							_g.currentPage = nextPage;
							ajaxModel.ajaxEvents.getRealInspectTaskRecord({
								taskId: sData.taskid,
								cameraName: sData.cameraName,
								exportType: sData.exportType,
								status: sData.status,
								pageNo: sData.pageNo,
								pageSize: sData.pageSize
							}, function(res) {
								if (res && res.code === 200) {
									var html = self.options.compiler({
										camList: res.data.list
									});
									jQuery("#examinetable").html(html)
								}
							});
						});
					}
				});
			}
		},
		/**
		 * [reloadInspectTask 重新启动巡检任务]
		 * @param  {[type]} taskId [description]
		 * @return {[type]}        [description]
		 */
		reloadInspectTask: function(taskId, node) {
			var self = this;
			if (taskId) {
				var commonDialog = new CommonDialog({
					title: '保存巡检任务中,请等待！'
				});
				ajaxModel.ajaxEvents.reloadRealInspectTask({
					taskid: taskId
				}, function(res) {
					commonDialog.hide();
					if (res.code === 200) {
						notify.success(res.data);
						node.attr("data-taskstatus", 2);
						node.find(".status").addClass("hidden");
						node.find(".taskstatus ").text("巡检中");
						setTimeout(function() {
							node.click();
							self.loadAgin();
						}, 500);
					} else if (res.code === 500) {
						notify.warn(res.data);
					}
				});
			}

		},

		/**
		 * [checkName 名称校验]
		 * @param  {[type]} data [description]
		 * @return {[type]}      [description]
		 */
		checkName: function(sData) {
			var self = this;
			ajaxModel.ajaxEvents.checkName(sData, function(res) {
				if (res && res.code === 200) {
					self.taskNameCheck = true;
				} else {
					self.taskNameCheck = false;
					return false;
				}

			});
		},
		/**
		 * [checkPlanName 计划列表名称校验]
		 * @param  {[type]} data [description]
		 * @return {[type]}      [description]
		 */
		checkPlanName: function(sData, callback) {
			var self = this;
			ajaxModel.ajaxEvents.checkPlanName(sData, function(res) {
				if (res && res.code === 200) {
					if (res.data.taskKey === "1") { // 重复
						return callback(false);
					}
					return callback(true); // 不重复
				}
				return callback(true);
			});
		},
		/**
		 * [exportExcel 导出表单]
		 * @param  {[type]} data [description]
		 * @return {[type]}      [description]
		 */
		exportExcel: function(data) {
			if (data) {
				var url = encodeURI(encodeURI("/service/inspect/real/inspect/export?title=" + data.title + "&fileName=" + data.fileName + "&exportType=" + data.exportType + "&taskId=" + data.taskId + "&status=" + data.camStatus + "&cameraName=" + data.camName));
				jQuery("#major .myExport").attr("src", url);
			}
		}
	}
	return new mainDeal();
});
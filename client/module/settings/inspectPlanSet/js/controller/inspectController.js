/**
 * 巡航模块业务入口
 * @author:Leon.z
 * @date  :2016.2.1
 */
define([
	'pubsub',
	'/module/settings/inspectPlanSet/js/model/inspectModel.js',
	'/module/settings/inspectPlanSet/js/view/inspectPlan-view.js',
	'js/globar-varibal.js',
	'handlebars'
], function(PubSub, inspectModel, inspectView, _g) {
	var inspectCtr = function() {
		this.compiler = {};
	}
	inspectCtr.prototype = {
		init: function(compiler) {
			var self = this;
			self.compiler = compiler || _g.compiler;
			self.loadInspectData("", function() {
				jQuery("#onlineBox").find("li:first").click();
			});
		},
		/**
		 * [loadInspectData 加载任务列表]
		 * @param  {[type]}   searchName [用于全局搜索时传递参数]
		 * @param  {Function} callback   [回调函数]
		 * @return {[type]}              [description]
		 */
		loadInspectData: function(searchName, callback) {
			var self = this;
			var param = {};
			if (searchName) {
				param = {
					searchKey: searchName
				}
			} else {
				param = {
					searchKey: "",
					pageSize: 5,
					pageNo: _g.currentPage
				}
			}
			inspectModel.ajaxEvents.getInspectTaskList(param, function(res) {
				if (res.code === 200 && res.data) {
					var html = self.compiler({
						taskListInit: true,
						taskList: res.data.list,
					});
					jQuery("#onlineBox").empty().html(html);
					permission.reShow();
					if (res.data.list.length == 0) {
						if (searchName) {
							jQuery("#onlineBox .style-text-info").text("未搜索到与之匹配的巡航任务!");
							jQuery("#sidebar .searchbox").show();
						} else {
							jQuery("#sidebar .searchbox").hide();
							jQuery("#notask").show();
							jQuery(".mainPlanList").hide();
							jQuery("#major .subHeader").find(".subtitle").text("--");
							jQuery("#major .subHeader").find(".subtime").text("--");
							jQuery("#major .subHeader").find(".subnums").text("--");

						}
						jQuery("#sidebar .pagepart").hide();
					} else if (res.data.list.length > 0) {
						jQuery("#sidebar .searchbox").show();
						jQuery("#notask").hide();
						jQuery(".mainPlanList").show();
						jQuery("#sidebar .pagepart").show();
						jQuery("#sidebar .pagepart").html(self.compiler({
							"pagebar": true
						}));
						//渲染分页
						_g.setPagination(res.data.totalRecords, ".pagepart .pagination", param.pageSize, _g.currentPage - 1, function(nextPage) {
							// TODO  分页回调函数
							param.pageNo = nextPage;
							_g.currentPage = nextPage
							inspectModel.ajaxEvents.getInspectTaskList(param, function(res) {
								if (res.code === 200) {
									var html = self.compiler({
										taskListInit: true,
										taskList: res.data.list,
									});
									jQuery("#onlineBox").empty().html(html);
									permission.reShow();
								} else {
									notify.warn("服务器或网络异常！");
								}
							});
						});

					}
					if (typeof callback === "function") {
						callback();
					}
				} else {
					notify.error("获取计划巡航数据失败");
				}

			}, function(error) {
				notify.error("获取计划巡航数据失败")
			});
		},
		/**
		 * [getInspectTaskInfo 获取巡航任务信息]
		 * @param  {[type]} taskId [description]
		 * @return {[type]}        [description]
		 */
		getInspectTaskInfo: function(parmas) {
			var self = this;
			if (parmas && 　parmas.taskName && parmas.taskTimePart) {
				jQuery("#major .subHeader").find(".subtitle").text(parmas.taskName).attr("title", parmas.taskName);
				jQuery("#major .subHeader").find(".subtime").text(parmas.taskTimePart).attr("title", parmas.taskTimePart);
			}
			if (parmas.taskId) {
				var sData = {
					task_id: parmas.taskId,
					pageNo: 1,
					pageSize: 20
				}
				inspectModel.ajaxEvents.getSingleDetail(sData, {
					beforeSend: function() {
						jQuery("#major .mainPlanList").html("<p class='loading'></p>")
					}
				}, function(res) {
					if (res && res.code === 200) {
						jQuery("#major .mainPlanList").find(".loading").remove();
						var html = self.compiler({
							taskListDetail: true,
							taskListDetailList: res.data.list
						});
						jQuery("#major .mainPlanList").html(html).show();
						jQuery("#major .mainPlanList").find('img').load(function() {
							self.renderPicMiddle($('.mainPlanList'));
						});
						jQuery("#major .subHeader").find(".subnums").text(res.data.totalRecords).attr("title", res.data.totalRecords);
						if (res.data.list.length == 0) {
							return jQuery("#major .mainPlanList").html("<p class='notask'>暂无任务详情信息！</p>");
						} else if (res.data.list.length > 0) {
							if(jQuery("#major").find(".pagination").length===0){
								jQuery("#major").append(self.compiler({
									"pagebar": true
								}));
							}
							
							_g.setPagination(res.data.totalRecords, "#major .pagination", sData.pageSize, res.data.pageNo - 1, function(nextPage) {
								// TODO  分页回调函数
								sData.pageNo = nextPage;
								_g.currentPage = nextPage;
								inspectModel.ajaxEvents.getSingleDetail(sData, {
									beforeSend: function() {
										jQuery("#major .mainPlanList").html("<p class='loading'></p>")
									}
								}, function(res) {
									if (res && res.code === 200) {
										jQuery("#major .mainPlanList").find(".loading").remove();
										var html = self.compiler({
											taskListDetail: true,
											taskListDetailList: res.data.list
										});
										jQuery("#major .mainPlanList").html(html);
										jQuery("#major .mainPlanList").find('img').load(function() {
											self.renderPicMiddle($('.mainPlanList'));
										});
										if (res.data.list.length == 0) {
											return jQuery("#major .mainPlanList").html("<p class='notask'>暂无任务详情信息！</p>");
										}
									}
								});
							});
						}
					}
				});
			}
		},
		/**
		 * [renderPicMiddle 让巡航任务详情图片居中显示]
		 * @param  {[type]} node [description]
		 * @return {[type]}      [description]
		 */
		renderPicMiddle:function(node){
			var self = this,
			    imgArray = $(node).find('img'),
				$img = '',
				img = {
					width: 0,
					height: 0,
					ratio: 1
				},
				imgParent = {
					width: 0,
					height: 0,
					ratio: 1
				};
			$.each(imgArray, function(index, val) {
				self.imageSizeSet($(val))
			});
		},
		/**
		 * 搜索结果的图片等比例显示
		 * @private
		 */
		imageSizeSet:function(imgObj) {
			//获取图片参数
			var $img = imgObj,
				imgSrc = $img.attr("src"),
				pW = $img.parent().width(),
				pH = $img.parent().height();
			//消除中间变量
			Toolkit.resizeImg(pW, pH, imgSrc, $img, function() {
				$img.show();
			});
		},
		/**
		 * [startInspectTask 开启任务]
		 * @param  {[type]} taskid [任务id]
		 * @param  {[type]} $node  [当前dom]
		 * @return {[type]}        [description]
		 */
		startInspectTask: function(taskid, $node) {
			if (taskid) {
				var taskName = $node.closest('li').find(".taskTitle").text();
				inspectModel.ajaxEvents.startTaskByTaskid({
					task_id: taskid
				}, function(res) {
					if (res.code === 200 && res.data) {
						notify.success(res.data);
						logDict.insertMedialog("m3", "开启：" + taskName + "巡航任务", "f13"); //添加日志
						$node.addClass("running active").removeClass('startTask').attr("title", "停止任务");
					}
				});
			}
		},
		/**
		 * [pauseInspectTask 停止任务]
		 * @param  {[type]} taskid [任务id]
		 * @param  {[type]} $node  [当前dom]
		 * @return {[type]}        [description]
		 */
		pauseInspectTask: function(taskid, $node) {
			if (taskid) {
				var taskName = $node.closest('li').find(".taskTitle").text();
				inspectModel.ajaxEvents.pauseTaskByTaskid({
					task_id: taskid
				}, function(res) {
					if (res.code === 200 && res.data) {
						notify.success(res.data);
						logDict.insertMedialog("m3", "停止：" + taskName + "巡航任务", "f13"); //添加日志
						$node.addClass("startTask").removeClass('running active').attr("title", "开启任务");
					}
				});
			}
		},
		/**
		 * [deleteTask 删除巡航任务]
		 * @param  {[type]} taskId [任务id]
		 * @return {[type]}        [description]
		 */
		deleteTask: function(taskId, taskName) {
			var self = this;
			if (taskId) {
				inspectModel.ajaxEvents.deleteTaskByTaskid({
					task_id: taskId
				}, function(res) {
					if (res.code === 200) {
						notify.success(res.data);
						_g.currentPage = 1;
						logDict.insertMedialog("m3", "删除：" + taskName + "巡航任务", "f13", "o3"); //添加日志
						self.loadInspectData("", function() {
							jQuery("#onlineBox").find("li:first").click();
						});
					}

				});
			}
		},
		/**
		 * [renderInspectPosition 获取当前摄像机预置位信息]
		 * @param  {[type]} cameraData [description]
		 * @return {[type]}            [description]
		 */
		renderInspectPosition: function(cameraData) {
			var self = this;
			_g.cameraData = cameraData;
			inspectModel.ajaxEvents.getPresetsByCameraId({
				cameraId: cameraData.id
			}, function(res) {
				if (res.code === 200 && res.data) {
					var opts = {
						middlePosition: true,
						inspectList: res.data.presets
					}
					jQuery("#popContainer .midCenter .inspectList").empty().html(self.compiler(opts));
				}
			});
		},
		/**
		 * [renderCameraList 选择的摄像机以及预置位信息]
		 * @param  {[type]} params [description]
		 * @return {[type]}        [description]
		 */
		renderCameraList: function(params) {
			var self = this;
			if (params) {
				_g.inspectPresetsCache = _g.inspectPresetsCache.filter(function(item) {
					return parseInt(item.cameraId) !== parseInt(params.cameraId);
				});
				if (params.isAppend) {
					_g.inspectPresetsCache.push({
						cameraId: params.cameraId,
						id: params.id,
						cameraName: _g.cameraData.name,
						inspectPosName: params.inspectPosName
					});
				}
				_g.selectedNums = _g.inspectPresetsCache.length;
				self.renderTemp();

			}
		},
		/**
		 * [deleteSingleCam 删除已选中的单个摄像机列表]
		 * @param  {[type]} cid [description]
		 * @return {[type]}     [description]
		 */
		deleteSingleCam: function(cid) {
			if (cid) {
				_g.inspectPresetsCache = _g.inspectPresetsCache.filter(function(item) {
					return parseInt(item.cameraId) !== parseInt(cid);
				});
				_g.selectedNums = _g.inspectPresetsCache.length;
				jQuery("#popContainer .midCenter .inspectList li[data-cameraid='" + cid + "']").find(".radio").removeClass('active');
				jQuery("#popContainer .popContent .midRight .header").find("em").text(_g.selectedNums);
			}
		},
		/**
		 * [renderTemp 渲染右侧已选列表]
		 * @return {[type]} [description]
		 */
		renderTemp: function() {
			if (_g.inspectPresetsCache.length) {
				var html = "";
				for (var i = 0, le = _g.inspectPresetsCache.length; i < le; i++) {
					html += ['<li data-name="' + _g.inspectPresetsCache[i].inspectPosName + '" data-cameraId="' + _g.inspectPresetsCache[i].cameraId + '">',
						'<span title="'+_g.inspectPresetsCache[i].cameraName + '-' + _g.inspectPresetsCache[i].inspectPosName+'"><i class="camera-ball-online"></i>' + _g.inspectPresetsCache[i].cameraName + '-' + _g.inspectPresetsCache[i].inspectPosName + '</span>',
						'<span><i class="icon-close"></i></span>',
						'</li>'
					].join("");
				}
				jQuery("#popContainer .midRight .cameraList ul").html(html);

			} else {
				jQuery("#popContainer .midRight .cameraList ul").html("");
			}
			jQuery("#popContainer .popContent .midRight .header").find("em").text(_g.selectedNums);
		},
		/**
		 * [sendCheckData 提交巡航任务]
		 * @param  {[type]}  datas        [description]
		 * @param  {Boolean} isUserDefine [description]
		 * @return {[type]}               [description]
		 */
		sendCheckData: function(datas, isUserDefine) {
			var self = this,
				flag = false;
			var userDefinedList = [];
			datas.relations.forEach(function(item) {
				userDefinedList.push(item.camera_id)
			})
			if (datas) {
				self.checkFormData(datas, function(flag) {
					if (!flag) {
						return;
					}
					jQuery("#popContainer").find(".saveForm").addClass('disabled');
					var fn = datas.task_id ? inspectModel.ajaxEvents.editInspectTask : inspectModel.ajaxEvents.addInspectTask,
						key = datas.task_id ? {
							edit_params: JSON.stringify(datas)
						} : {
							add_params: JSON.stringify(datas)
						};
					fn(key, function(res) {
						if (res.code === 200) {
							notify.success(res.data);
							if (isUserDefine) {
								inspectModel.ajaxEvents.createNewGroup({
									type: "org",
									name: datas.task_name,
									camera: userDefinedList.join("/"),
									groups: ""
								}, function(res) {
									if (res.code === 200) {
										//return notify.success(res.data.message);
									} else if (res.code === 500) {
										notify.error("创建分组失败!");
									}
								});
							}
							jQuery("#popContainer").find(".saveForm").removeClass('disabled');
							jQuery("#popContainer .popHeader").find(".icon_close").trigger("click");
							if(datas.task_id){
								logDict.insertMedialog("m3", "编辑：" + datas.task_name + "巡航任务", "f13", "o2"); //添加日志
							}else{
								logDict.insertMedialog("m3", "新建：" + datas.task_name + "巡航任务", "f13", "o1"); //添加日志
							}
							
							self.loadInspectData("", function() {
								jQuery("#onlineBox").find("li:first").click();
							});
						}
					});

				});
			}
		},
		/**
		 * [checkFormData 提交任务前验证]
		 * @param  {[type]} dataFormat [description]
		 * @return {[type]}            [description]
		 */
		checkFormData: function(dataFormat, callback) {
			var self = this;
			var node = jQuery("#popContainer .pop_c_t").find(".icon_arrow"),
			start_day = jQuery("#popContainer").find(".startDay").val(),
			end_day = jQuery("#popContainer").find(".endDay").val(),
			nowName  = jQuery("#popContainer").find("input[name='task_Name']").val();
			if (dataFormat) {
				if (dataFormat.task_name === "") {
					notify.warn("任务名称不能为空!");
					return callback(false);
				}
				if (dataFormat.task_name.length>30) {
					notify.warn("任务名称不能超过30字!");
					return callback(false);
				}
				self.checkNameRecg(dataFormat,nowName,function(flag) {
					if (!flag) {
						return callback(false);
					}
					if(node.hasClass("active")){
						if (start_day === "" || end_day=== "") {
							notify.warn("请将任务执行日期设置完整!");
							return callback(false);
						}
						if (start_day && end_day && Toolkit.str2mills(start_day + " 00:00:00") > Toolkit.str2mills(end_day + " 00:00:00")) {
							notify.warn("任务执行开始日期不能大于结束日期!");
							return callback(false);
						}
					}
					if (dataFormat.start_hour === "" || dataFormat.end_hour == "") {
						notify.warn("请将运行时段设置完整!");
						return callback(false);
					}
					if (dataFormat.start_hour && dataFormat.end_hour && Toolkit.str2mills("2016-01-01 " + dataFormat.start_hour) > Toolkit.str2mills("2016-01-01 " + dataFormat.end_hour)) {
						notify.warn("任务运行时段开始时间不能大于结束时间!");
						return callback(false);
					}
					if (dataFormat.relations.length <= 0) {
						notify.warn("任务预置位选择不能为空!");
						return callback(false);
					}
					callback(true)
				});



			}

		},
		/**
		 * [checkNameRecg 检测是否重名]
		 * @param  {[type]}   name     [description]
		 * @param  {Function} callback [description]
		 * @return {[type]}            [description]
		 */
		checkNameRecg: function(dataFormat,nowName,callback) {
			if(dataFormat.task_id){
				if(_g.oldTaskName===nowName)
				return callback && callback(true);
			}
			inspectModel.ajaxEvents.validName({
				task_name: dataFormat.task_name
			}, function(res) {
				if (res.code !== 200) {
					notify.warn(res.data);
					jQuery("#popContainer").find("input[name='task_Name']").focus();
					callback && callback(false)
				} else {
					callback && callback(true)
				}
			});
		}
	}

	return new inspectCtr();

})
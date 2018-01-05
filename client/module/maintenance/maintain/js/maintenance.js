/**
 * @fileOverview  
 * @author xukai
 * @date 2015.6.2
 * @version 
 */
define(["require", "ajaxModel", "./../../common/js/camera-tree", "js/helper", "js/jquery.mockjax", "js/jquery.mockjson", "jquery-ui-timepicker-addon", "jquery.pagination"], function(require, ajaxModel, CameraTree, helper) {
	jQuery(function() {

		var maintenance = new new Class({

			Implements: [Events, Options],

			options: {
				userScore: "",
				loadSetData: null,
				lastPross: 0,
				inspectCache: [],
				timer: null,
				hisTaskName:"",
				hisTime:"",
				setHisOrg:"",
				setHisNum:0,
			},

			tpl: {},

			url: { //接口列表
				"taskList": "/service/inspect/task/get_task_list", //获取任务列表
				"taskInfo": "/service/inspect/task/get_info_by_task_id", //获取单个任务对应的市级信息列表
				"addTask": "/service/inspect/task/add_inspect_task", //新建任务
				"taskProgress": "/service/inspect/task/task_process", //获取任务进度
				"editTask": "/service/inspect/task/edit_inspect_task", //编辑任务
				"delTask": "/service/inspect/task/delete_inspect_task", //删除任务
				"monthAvgList": "/service/inspect/report/getMonthAvgList", //获取单月份数据
				"oneMonthResult": "/service/inspect/report/getOneTaskResult", //当前月份统计
				"cityReport": "/service/inspect/report/update_city_report_num",
				"isExistsTaskName": "/service/inspect/task/is_exists_taskName", //重名检测
				"getSetData": "/service/inspect/config/get_inspect_config", //获取设置信息详情
				"addSetData": "/service/inspect/config/add_inspect_config" //添加设置
			},

			statuesTimer: null, //定时器

			taskNameCheck: true,

			initialize: function(options) {
				var self = this;
				/**判断是否为admin用户,只有admin用户才有设置权限 update by leon.z **/
				var score = self.options.userScore = jQuery("#userEntry").data("loginname");
				if (score === "admin") {
					jQuery("#task").find(".setPanel").show();
				}
				self.loadSetData();
				this.bindEvent();
				self.timePlugin();
				self.options.inspectCache = [];
			},
			/**
			 * [loadSetData 初始加载设置信息，并缓存]
			 * @return {[type]} [description]
			 */
			loadSetData: function() {
				var self = this;
				self.ajaxFun("", self.url.getSetData, null, function(err, loadData) {
					if (err) {
						notify.error(err.data);
						return false;
					}
					var level = ["省级", "市级"];
					self.options.loadSetData = loadData;
					if (loadData) {
						jQuery(".setPanelPart").find(".orgName").val(level[parseInt(loadData.org_level) - 1]);
						jQuery(".setPanelPart").find(".tinyInput").val(loadData.min_camera_num);

						self.options.setHisOrg = level[parseInt(loadData.org_level) - 1];
						self.options.setHisNum = loadData.min_camera_num;
					} else {
						if (self.options.userScore === "admin") {
							jQuery("#task .newtask").attr("disabled", "disabled").addClass("disabled");
						}
						jQuery(".setPanelPart").find(".orgName").val(level[0]);
						jQuery(".setPanelPart").find(".tinyInput").val(400);
					}
				})

			},
			loadTpl: function(name, render, callback) {
				var self = this,
					url = "inc/" + name + ".html";
				if (self.tpl[name] && !render) {
					return callback(self.tpl[name]);
				}
				ajaxModel.getTml(url).then(function(temp) {
					if (temp) {
						self.tpl[name] = Handlebars.compile(temp);
						callback(self.tpl[name]);
					}
				});
			},

			ajaxFun: function(sendData, sendUrl, sType, callback) {
				if (sType) {
					sType = "get";
				} else {
					sType = "post"
				}

				$.ajax({
					url: sendUrl,
					type: sType,
					datatype: "json",
					data: sendData,
					success: function(res) {
						if (res && res.code === 200) {
							//notify.success('数据获取成功！');						
							callback(null, res.data);
						} else if (res && res.code === 500) {
							//notify.error('暂无数据！');						
							callback(res);
						}
					},
					error: function() {
						//notify.error('数据获取异常！');
						callback({
							data: '数据获取异常！'
						});
					}

				});

			},

			timePlugin: function() { //时间控件			
				jQuery(document).on('focus', '.input-time', function() {
					var self = this;
					jQuery(this).datetimepicker({
						showSecond: true,
						dateFormat: 'yy-mm-dd',
						timeFormat: 'HH:mm:ss',
						minDate: new Date(),
						timeText: '',
						hourText: '时',
						minuteText: '分',
						secondText: '秒',
						showAnim: ''
					});
				});
			},
			/**
			 * [sendSetData 提交设置]
			 * @return {[type]} [description]
			 */
			sendSetData: function() {
				var self = this,
					level = jQuery(".setPanelPart").find(".orgName").val() === "市级" ? 2 : 1,
					minCamNo = jQuery(".setPanelPart").find(".tinyInput").val(),
					sendData = {};
				sendData = {
					org_level: level,
					min_camera_num: minCamNo
				}
				if (!isNaN(minCamNo)) {
					if (minCamNo.length > 10) {
						notify.warn("上联摄像机路数最小值不能大于9999999999");
						return;
					} 
				} else {
					notify.warn("上联摄像机路数最小值必须是数字！");
					return;
				}
				self.ajaxFun(sendData, self.url.addSetData, null, function(err, res) {
					if (err) {
						notify.error(err.data);
						return false;
					}
					notify.success(res);
					self.options.loadSetData = sendData;
					jQuery("#task .newtask").removeAttr("disabled").removeClass("disabled");
					jQuery(".setPanelPart").find(".panelFooter .cancle,.popTitle .close").click();
					self.bindEvent();
				})
			},
			/**
			 * [checkScore 检测是否用户有权限可设置任务]
			 * @return {[type]} [description]
			 */
			checkScore: function() {
				var self = this;
				if (self.options.loadSetData) {
					return true;
				}
				return false;
			},
			bindEvent: function() {
				var self = this;
				jQuery("#task").find(".newtask").on("click", function() {
					if (jQuery(this).hasClass("disabled")) {
						return;
					}
					var flag = self.checkScore();
					if (flag) {
						self.loadTpl("maintenance_newtask", false, function(tep) { //输出模板
							jQuery("#task .tasklist").text("新建任务");
							jQuery("#task .newtask , .searchbox , .refresh").hide();
							jQuery("#task").find(".setPanel").hide();
							jQuery("#onlineBox").html(tep).css("top", "0");

							self.bindCancle();
						});
					} else {
						notify.warn("暂未配置任务参数，请联系管理员!");
						return;
					}

				});

				jQuery(".reportcam").off().on("click", function() {
					//self.reprotCam();
				});
				self.loadTaskList(1, 4); //获取第一页数据，每页4条			 
				self.swTable();
				self.search();
				jQuery("#rightTable").css("height", jQuery("#major").height() - 100 + "px");

				jQuery(".refresh").off().on("click", function() {
					curPage = jQuery(".pagination").find(".current");
					key = jQuery("#taskSearchSimple").val();
					if (curPage.length > 0) {
						self.loadTaskList(curPage.text(), 4, key);
					} else {
						self.loadTaskList(1, 4, key);
					}
					//notify.success("刷新完成");
				});
				/** [description] */
				jQuery("#task").off("click", ".setPanel").on("click", ".setPanel", function(e) {
					jQuery(this).addClass("active");
					window.top.showHideNav("hide");
					jQuery(".popLayer").fadeIn(200, function() {
						jQuery(".setPanelPart").show();
					});
				});
				jQuery(".setPanelPart").off("click", ".panelFooter .sure").on("click", ".panelFooter .sure", function(e) {
					if (checkContent()) {
						self.sendSetData();
					}
				});
				jQuery(".setPanelPart").off("click", ".panelFooter .cancle,.popTitle .close").on("click", ".panelFooter .cancle,.popTitle .close", function(e) {
					jQuery(".setPanel").removeClass("active");
					window.top.showHideNav("show");
					jQuery(".setPanelPart").hide(0, function() {
						jQuery(".setPanelPart").find(".orgName").val(self.options.setHisOrg)
						jQuery(".setPanelPart").find(".tinyInput")[0].placeholder = self.options.setHisNum
						jQuery(".setPanelPart").find(".tinyInput").val(self.options.setHisNum)
						jQuery(".popLayer").fadeOut(200);
					});
				});
				jQuery(".setPanelPart").off("click", ".arrow").on("click", ".arrow", function(e) {
					jQuery(this).toggleClass("active");
					jQuery("#selectOrg").slideToggle(100);
				});
				jQuery("#selectOrg").on("click", "li", function(e) {
					var text = jQuery(this).text();
					jQuery(".setPanelPart .orgName").val(text);
					jQuery("#selectOrg").slideUp(100);
					jQuery(".setPanelPart .arrow").removeClass("active");

				});

				function checkContent() {
					var r = /^[0-9]*[1-9][0-9]*$/;
					if (jQuery(".setPanelPart .orgName").val() === "") {
						notify.warn("请选择组织级别!");
						return false
					}
					if (jQuery(".setPanelPart .tinyInput").val() === "") {
						notify.warn("请输入上联基准数!");
						return false
					}
					if (!r.test(jQuery(".setPanelPart .tinyInput").val())) {
						notify.warn("请输入正确的上联基准数!");
						return false
					}
					return true
				}
			},
			listEvent: function() {
				var self = this;
				/**遍历巡检任务状态**/
				jQuery(".taskitem").each(function(index, param) {
					var $status = $(this).attr("data-status");
					var taskId = $(this).attr("data-id");
					if ($status === "1") {
						$(this).find(".edit").show();
					} else {
						$(this).find(".edit").hide();
					}
					if ($status === "1" || $status === "2") {
						self.options.inspectCache.push(taskId)
					}

				});
				if (self.statuesTimer) {
					clearInterval(self.statuesTimer);
				}
				if (self.options.inspectCache.length > 0) {
					self.bindStatusChange(self.options.inspectCache, function() {
						self.reloadTaskList();
					});
					self.statuesTimer = setInterval(function() {
						self.bindStatusChange(self.options.inspectCache, function() {
							self.reloadTaskList();
						});
					}, 3000);
				}
				jQuery(".edit").off().on("click", function(e) {
					e.stopPropagation();
					var that = jQuery(this).parent();
					jQuery(this).addClass('active');
					self.options.hisTaskName = that.siblings(".edittask").find("input")[0].getAttribute("value");
					self.options.hisTime =  that.siblings(".edittask").find("input")[1].getAttribute("value");
					that.siblings(".edittask").show();
					that.siblings(".statuslist").hide();
				});

				jQuery('.tname').off().on('change', function() {
					var val = {
						'name': jQuery(this).val().trim(),
						'flag': 1 //flag :1为定时巡检.2为实时巡检
					}
					self.checkName(val);
				})

				jQuery(".save").on("click", function(e) {
					e.stopPropagation();
					if (!self.taskNameCheck) {
						notify.warn('任务名称重复');
						return;
					}
					var that = jQuery(this).closest("ul.edittask"),
						taskid = jQuery(this).closest("li.taskitem").attr("data-id");
					name = that.find("input")[0].value || that.find("input")[0].placeholder,
						time = that.find("input")[1].value || that.find("input")[1].placeholder, sData;
					if (name) {
						sData = {
							"taskId": taskid,
							"name": name,
							"taskDate": time
						}
						self.ajaxFun(sData, self.url.editTask, null, function(err, loadData) {
							if (err) {
								notify.error(err.data);
								return false;
							} else {
								notify.success("修改成功");
								that.siblings("h6").find("span").text(name);
								logDict.insertLog('m2', 'f3', 'o2', '', sData.name + '->视频巡检任务'); // 新建任务
								jQuery("#aside").find(".refresh").trigger("click");
							}
						});

					}

					that.hide();
					that.siblings(".statuslist").show();

				});

				jQuery(".exit").off("click").on("click", function(e) {
					e.stopPropagation();
					var that = jQuery(this).closest("ul.edittask");
					that.closest('li').find(".edit").removeClass("active");
					that.find("input")[0].value = self.options.hisTaskName;
					that.find("input")[1].value = self.options.hisTime
					that.hide();
					that.siblings(".statuslist").show();

				});

				jQuery(".cls").off().on("click", function(e) {
					var that = jQuery(this).closest("li.taskitem");
					e.stopPropagation();
					var taskName = that.find("h6 span:eq(0)").text();
					new ConfirmDialog({
						message: "确定要删除该任务吗？",
						callback: function() {
							if (that.attr("data-status") === 2 || that.attr("data-status") === '2') {
								clearInterval(self.statuesTimer)
							}

							var sData = {
								"taskId": that.attr("data-id")
							};
							self.ajaxFun(sData, self.url.delTask, null, function(err) {
									if (err) {
										notify.error(err.data);
										return false;
									}
									that.attr("data-del", "true");
									that.hide();
									notify.success("删除成功");
									logDict.insertLog('m2', 'f3', 'o3', '', taskName + '->视频巡检任务'); // 删除日志
									self.loadTaskList(1, 4, "");
							});
						}
					});

				});
			},

			loadTaskList: function(pageNo, pageSize, search) {
				var self = this;
				self.options.inspectCache = [];
				if (search) {
					page = {
						"pageNo": pageNo,
						"pageSize": pageSize,
						"search": search,
						"flag": 1
					}
				} else {
					page = {
						"pageNo": pageNo,
						"pageSize": pageSize,
						"flag": 1

					}
				};
				self.loadTpl("new_task_list", false, function(temp) {
					self.ajaxFun(page, self.url.taskList, null, function(err, loadData) {
						if (err) {
							notify.error(err.data);
							return false;
						}
						if(search){
							logDict.insertMedialog('m2', '查询与"' + search + '"相关的视频巡检任务', 'f3', "o17");
						}else{
							//logDict.insertMedialog('m2', '查询全部视频巡检任务', 'f3', "o17");
						}
						
						var html = temp({
							loadData: loadData.list
						});
						$("#onlineBox").html(html);
						if (loadData.list.length == 0) {
							if (search) {
								jQuery("#onlineBox .style-text-info").text("未搜索到匹配实时巡检任务!");
								jQuery(".searchbox").show();
							} else {
								jQuery(".searchbox").hide();
								jQuery("#notask").show();
								jQuery(".righttotal").hide();
								jQuery("#rightTable").hide();
								jQuery("#onlineBox").css("top", "0");
							}
						} else {
							jQuery(".searchbox").show();
							jQuery(".righttotal").show();
							jQuery("#notask").hide();
							jQuery("#rightTable").show();
							jQuery("#onlineBox").css("top", "45px");
						}
						self.listEvent();
						self.swList();
						//self.timePlugin();
						self.changeClor();
						//分页函数
						if (loadData.totalPages <= 1) {
							return;
						}
						self.setPages({
							totalCounts: loadData.totalRecords,
							pageCounts: pageSize,
							currentPage: pageNo - 1
						}, search);


					});
				});
			},
			bindStatusChange: function(taskList, callback) {
				var self = this;
				var list = taskList.join(",");
				self.ajaxFun({
					taskIds: list
				}, self.url.taskProgress, null, function(err, loadData) {
					if (err) {
						clearInterval(self.statuesTimer);
						return;
					}
					if (loadData) {
						for (var i = 0, le = loadData.length; i < le; i++) {
							if (loadData[i] !== null) {
								var node = jQuery("#onlineBox").find("li[data-id='" + loadData[i].checkTaskId + "']");
								node.find(".taskstatus").addClass("inspect").removeClass("gray　inspecting ");
								node.find(".edit").hide();
								node.find(".taskstatus").text("巡检中");
								node.find(".progressBar .currPro").width(loadData[i].progress + "%");
								if (loadData[i].progress >= 91) {
									node.find(".progressBar .processHelper").html(loadData[i].progress + "%").css("left", "91%");
								} else {
									node.find(".progressBar .processHelper").html(loadData[i].progress + "%").css("left", loadData[i].progress + "%");
								}
								if (loadData[i].progress >= 100) {
									if (typeof callback === "function") {
										callback();
									}
									clearInterval(self.statuesTimer);

								}
							}

						}
					}
				});
				/*self.statuesTimer = setInterval(function() {
					self.ajaxFun({
						taskId: taskId
					}, self.url.taskProgress, null, function(err, loadData) {
						if (err) {
							notify.error(err.data)
							return;
						}
						if (loadData) {
							node.find(".progressBar .currPro").width(loadData+ "%");
							if (loadData >= 91) {
								node.find(".progressBar .processHelper").html(loadData + "%").css("left", "91%");
							} else {
								node.find(".progressBar .processHelper").html(loadData + "%").css("left", loadData + "%");
							}
							if (loadData[i].progress >= 100) {
								clearInterval(self.statuesTimer);
								if (typeof callback === "function") {
									callback(taskId);
								}
							}
							
						}
					});
				}, 3000);*/
			},
			reloadTaskList: function() {
				setTimeout(function() {
					jQuery("#aside").find(".refresh").click();
				}, 500);
			},
			bindCancle: function() {


				var self = this,
					change = function() {
						jQuery("#task .tasklist").text("任务列表");
						jQuery("#task .newtask , .searchbox , .refresh").show();
						if (self.options.userScore === "admin") {
							jQuery("#task").find(".setPanel").show();
						}
						if(jQuery("#onlineBox").find("li").length>0){
							jQuery("#onlineBox").css("top", "45px");
						}
						self.bindEvent();
						//self.swList();				
					};

				jQuery('#taskName').off().on('change', function() {
					var val = {
						'name': jQuery(this).val().trim(),
						'flag': 1 //flag :1为定时巡检.2为实时巡检
					}
					self.checkName(val);
				})

				jQuery(".exit").on("click", change);

				jQuery(".save").on("click", function() {
					var $node = jQuery(this);
					if (!self.taskNameCheck && jQuery('#taskName').val().length) {
						notify.warn('任务名称重复');
						return;
					}
					sData = {
						"name": jQuery("#taskName").val(),
						"taskDate": jQuery("#taskDate").val(),
						"flag": 1
					};
					if (sData.name && sData.taskDate) {
						$node.attr("disabled", "disabled");
						self.ajaxFun(sData, self.url.addTask, null, function(err, loadData) {
							if (err) {
								notify.error(err.data);
								$node.removeAttr("disabled");
								return false;
							}
							logDict.insertLog('m2', 'f3', 'o1', '', sData.name + '->视频巡检任务'); // 新建任务
							notify.success("保存成功");
							jQuery("#onlineBox").css("top", "45px");
							change();

						});
					} else {
						jQuery(this).removeAttr("disabled");
						notify.error("请填写完整");
					}
				});

			},

			swTable: function() {
				var self = this,
					sUl = jQuery("#swTable").children();
				jQuery("#swTable li").off().on("click", function() {
					jQuery(this).addClass("active").siblings().removeClass("active");

					if (sUl[1].className == "") {
						$("#onlineTable").show();
						$("#intactTable").hide();
					} else {
						$("#intactTable").show();
						$("#onlineTable").hide();
					}
				});

			},

			swList: function() {
				var self = this;
				jQuery("#onlineBox").off().on("click", "ul li.taskitem", function() {
					var li = this;
					var taskName = jQuery(this).find("h6>span:eq(0)").text();
					jQuery(this).addClass("active").siblings(".taskitem").removeClass("active");
					sData = {
						"task_id": jQuery(this).attr("data-id")
					};
					self.loadTpl("right_table", true, function(temp) {
						self.ajaxFun(sData, self.url.taskInfo, null, function(err, loadData) {
							if (err) {
								notify.error(err.data);
								return false;
							}
							for (var i in loadData) {
								loadData[i].taskStatus = Number(jQuery(li).attr("data-status"));
							}
							self.loadTotal(sData);
							var html = temp({
								loadData: loadData
							});
							$("#rightTable").html(html);
							$("#swTable").find("li em").text(taskName);
							self.swTable();
							self.changeClor();
						});



					});
				});
				jQuery("#onlineBox ul li.taskitem:first").trigger("click");
			},

			search: function() {
				var self = this;
				jQuery(".searchbox").off().on("click", "button", function() {
					var key = jQuery("#taskSearchSimple").val();
					self.loadTaskList(1, 4, key);
				});
			},

			setPages: function(options, keywords) {
				var self = this;
				jQuery(".pagination").pagination(options.totalCounts, {
					items_per_page: options.pageCounts,
					current_page: options.currentPage,
					first_loading: false,
					callback: function(nextPage) {
						nextPage++;
						self.loadTaskList(nextPage, options.pageCounts, keywords)
					}
				})
			},

			loadTotal: function(sData) {
				var self = this;
				if (sData) {
					self.ajaxFun(sData, self.url.oneMonthResult, null, function(err, loadData) {
						if (err) {
							notify.error(err.data);
							return false;
						}
						var liArr = ["actual_city_num", "quality_city_num",
							"actual_camera_num", "actual_online_num", "online_rate", "coor_collect_num", "coor_rate"
						];
						jQuery(".righttotal").find("th").each(function(index) {
							if (index === 4 || index === 6) {
								loadData[liArr[index]] = (loadData[liArr[index]] * 100).toFixed(2) + "%";
							} else {

								loadData[liArr[index]] = loadData[liArr[index]] === null ? "0个" : loadData[liArr[index]] + "个";
							}
							jQuery(this).find("p:last").text(loadData[liArr[index]]);


						});
					})
				}

			},

			taskitem: function() {
				var time = new Date(),
					m = time.getMonth() + 1;
				if (m < 10) {
					month = time.getFullYear().toString() + "0" + m;
				} else {
					month = time.getFullYear().toString() + m;
				}
				return month;
			},

			reprotCam: function() {
				var self = this;
				self.loadTpl("report_cam", false, function(temp) {
					sData = {
						"month_id": self.getMyMonth()
					}
					self.ajaxFun(sData, self.url.monthAvgList, null, function(err, loadData) {
						if (err) {
							notify.error(err.data);
							return false;
						}
						var html = temp({
							loadData: loadData
						});
						jQuery("#domPanel").append(html);
						MaskLayer.show();

						jQuery(".reportcamera").find("input").off().on("change", function() {
							if (jQuery(this).val()) {
								if (!/^\d+$/.test(jQuery(this).val())) {
									notify.error("请输入合法数据")
									return;
								}
							}
						})
						jQuery(".dombg").find(".save").off().on("click", function() {
							self.reportFinish()
						})
						jQuery(".dombg").find(".cancel").off().on("click", function() {
							jQuery(".dombg").remove();
							MaskLayer.hide();
						});

					});
				});

			},

			reportFinish: function() {
				var self = this,
					sData = {
						"month_id": self.getMyMonth() - 1,
						"data": self.getRepostData()
					};

				self.ajaxFun({
					params_json: JSON.stringify(sData)
				}, self.url.cityReport, null, function(err, loadData) {
					if (err) {
						notify.error(err.data);
						return false;
					}

					jQuery(".dombg").remove();
					MaskLayer.hide();
					location.reload();
				});



			},
			getRepostData: function() {
				var data = [],
					$ele = $(".reportcamera");

				$ele.find("li").each(function() {
					var value = $(this).find("input").val().trim(),
						cityId = $(this).attr("data-cityid");

					if (!value) {
						return;
					}

					data.push({
						"city_id": cityId,
						"reported_camera_num": value
					});
				});
				return data;
			},

			changeClor: function() {
				jQuery(".taskstatus").each(function(i) {
					if (jQuery(this).text() == "已巡检") {
						jQuery(this).addClass("inspect")
					} else if (jQuery(this).text() == "未巡检") {
						jQuery(this).addClass("inspecting")
					}
				});
			},

			checkName: function(val) {
				var self = this;

				ajaxModel.getData(self.url.isExistsTaskName, val).then(function(res) {
					if (res && res.code === 200) {
						self.taskNameCheck = true;
					} else {
						notify.warn(res.data);
						self.taskNameCheck = false;
					}
				})
			}

		});
		return maintenance;
	});
});
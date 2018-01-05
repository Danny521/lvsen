define([
	"js/alarmanalysis-camera-tree.js",
	'./alarmanalysis-global-var',
	"handlebars"
], function(cameraTree, globalVar) {
	var historyMgr = {
		/**
		 * [createCameraTree 创建摄像机树]
		 * @return {[type]} [description]
		 */
		createCameraTree: function() {
			globalVar.cameraTree = new cameraTree.alarmAnalysisCameraTree({
				node: "#aside .tab-content .hisTree",
				scrollbarNode: "#aside .tab-content .hisScrollbarPanel",
				"orgId": jQuery("#userEntry").attr("data-orgid")
			});
		},
		/**
		 * [getTml 回去模板]
		 * @param  {Function} callback [回调函数]
		 * @return {[type]}            [description]
		 */
		getTml: function(callback) {
			jQuery.get(globalVar.templateURL).done(function(temp) {
				callback(Handlebars.compile(temp));
			});
		},
		/**
		 * [mills2datetime 将时间戳转化成时间格式]
		 * @param  {[type]} num [时间戳]
		 * @return {[type]}     [description]
		 */
		mills2datetime: function(num) {
			if (num) {
				var date = new Date(num);
				return date.getFullYear() + '-' + this.formatLenth(date.getMonth() + 1) + '-' + this.formatLenth(date.getDate()) + " " + this.formatLenth(date.getHours()) + ":" + this.formatLenth(date.getMinutes()) + ":" + this.formatLenth(date.getSeconds());
			}
			return "";
		},
		/**
		 * [formatLenth 格式化数字]
		 * @param  {[type]} x   [要格式化的数字]
		 * @param  {[type]} len [转化后的长度]
		 * @return {[type]}     [格式化后的结果]
		 */
		formatLenth: function(x, len) {
			x = '' + x;
			len = len || 2;
			while (x.length < len) {
				x = '0' + x;
			}
			return x;
		},
		/**
		 * [registerHelper 注册助手]
		 * @return {[type]} [description]
		 */
		registerHelper: function() {
			var self = this;
			Handlebars.registerHelper("isFirstLi", function(evtype) {
				if (evtype === 0 || evtype === "0") {
					return "first";
				} else {
					return "";
				}
			});
			Handlebars.registerHelper("countTitle", function(evtype) {
				switch (parseInt(evtype)) {
					case 0:
						return new Handlebars.SafeString("全&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;部");
					case 4096:
						return "人数统计";
					case 2:
						return "绊线检测";
					case 262144:
						return "出门检测";
					case 4:
						return "区域入侵";
					case 256:
						return "非法停车";
					case 32:
						return "徘徊检测";
					case 64:
						return "物品遗留";
					case 128:
						return "物品丢失";
					case 2048:
						return "人群聚集";
					case 65536:
						return "离岗检测";
					case 1048576:
						return "打架检测";
					case 4194304:
						return "拥堵检测";
					case 8388608:
						return "可疑尾随检测";
					case 1024:
						return "奔跑检测";
					case 131072:
						return "车流统计";
					case 16777216:
						return "烟火检测";
					case 8192:
						return "车牌识别";
					case 524288:
						return "人脸检测";
					case 33554432:
						return "手动报警";
					case 134217728:
						return "人员布控";
				}
			});
			Handlebars.registerHelper("barColor", function(color) {
				return color.barColor
			});
			Handlebars.registerHelper("proColor", function(color) {
				return color.ProColor
			});
			Handlebars.registerHelper("withCtr", function(total,curr) {
				if (total-0 === 0) {
					return 0;
				}

				return (curr/total)*100+"%"
			});
			Handlebars.registerHelper("formCount", function(count) {
				if(count==='' || count===null){
					return 0
				}else{
					return count;
				}
			});
			//毫秒数转化为时间
			Handlebars.registerHelper("mills2datatime", function(num) {
				if (num) {
					var datastr = self.mills2datetime(num);
					return datastr;
				}
				return "未知";
			});
			// 奇偶行
			Handlebars.registerHelper("even", function(value) {
				if (value % 2 !== 0) {
					return "even";
				}
			});
			Handlebars.registerHelper("cameranameOrReportplace", function(cameraName, reportPlace, eventType) {
				if(eventType === 33554432){
					if(reportPlace ===""|| reportPlace===null){
						return "未知";
					} else {
						return reportPlace;
					} 
				} else {
					return cameraName;
				}
			});
			Handlebars.registerHelper("isPlace", function(str, options) {
				if (str === "" || str === null) {
					return "未知";
				} else {
					return str;
				}
			});
			Handlebars.registerHelper("int2level", function(num) {
				if (num === 0) {
					return "--";
				} else if (num === 1) {
					return "一般";
				} else if (num === 2) {
					return "重要";
				} else if (num === 3) {
					return "严重";
				} else {
					return "未知";
				}
			});
			Handlebars.registerHelper("null2unkown", function(str) {
				if (str) {
					return str;
				} else {
					return "未知";
				}
			});
			Handlebars.registerHelper("int2status", function(num) {
				if (num === 0) {
					return "未处理";
				} else if (num === 1) {
					return "有效";
				} else if (num === 2) {
					return "无效";
				} else if (num === 3) {
					return "未知";
				}
			});
		}
	};

	historyMgr.registerHelper();
	historyMgr.createCameraTree();
	historyMgr.getTml(function(template) {
		window.historyTemplate = template;
		function hasPermissionForCTree(orgId) {
			// 超级管理员
			if (jQuery("#userEntry").attr("data-orgid") === "null") {
				return true;
			}
			// 组织id 包含 "org_"   虚拟组织id 包含 "vorg_"  
			var index = 0;
			if (orgId.indexOf("vorg") !== -1) {
				index = 5;
			} else if (orgId.indexOf("org") !== -1) {
				index = 4;
			}
			return {
				enabled: globalVar.cameraTree.hasAccessPower(orgId.substring(index)),
				orgId: orgId.substring(index)
			}
		}

		//获取历史报警填充模板(major部分所有内容)
		function getHistoryDate(data) {
			var self = this;
			var formR = data.isRight;
			if (!data.isSearch) {
				data.startTime = jQuery("#historySearch").find(".begin-time.input-time").val();
				data.endTime = jQuery("#historySearch").find(".end-time.input-time").val();
			}
			
			var param = {
				resourceType: (data.type === "true") ? 2 : 1,
				id: data.id,
				recursion: data.recursion,
				startTime: data.startTime,
				endTime: data.endTime,
				eventType: data.alarmType,
				dealStatus: data.dealStatus,
				currentPage: 1,
				pageSize: 10
			};
			jQuery.ajax({
				url: "/service/defence/three/history/" + param.id,
				type: "get",
				data: param,
				beforeSend: function() { //beforeSend
					jQuery("#historyTable").html("<div class='loading'></div>");
					jQuery("#historySearch .pagepart").hide();
					if(!data.isSearch){
						jQuery("#countDetial .countList").html("<div class='loading'></div>");
					}
				},
				success: function(tem) { //success
					if (tem.code === 200) {
						globalVar.hisCount = tem.data.count;
						if(!data.isSearch){
							jQuery.ajax({
								url: "/service/defence/three/history/count/" + param.id,
								type: "get",
								data: param,
								success: function(countRes) {
									if (countRes.code === 200) {
										countRes.data.countByEventType = countRes.data.countByEventType || [];
										return getCountListDetial(countRes.data, param);
									}

									notify.error("获取历史报警总数失败！");
								},
								error: function() {
									notify.error("获取历史报警总数失败！");
								}
							});
						}
						//eventType与eventTypeName转化
						if (tem.data.events.length) {
							for (var i = 0; i < tem.data.events.length; i++) {
								tem.data.events[i].eventTypeName = globalVar.getEventTypeName(tem.data.events[i].eventType);
							}
						}
						//渲染内容
						if (tem.data.count === 0) {
							jQuery("#historySearch .pagepart").hide();
							jQuery("#historySearch .table_lists_wrap #historyTable").html('<span class="none">此机构下没有相关历史报警信息</span>');
						} else if (tem.data.count > 0 && tem.data.total === 1) {
							jQuery("#historySearch .pagepart").hide();
							jQuery("#historySearch .table_lists_wrap #historyTable").html(template({
								"historySearchItems": {
									historySearch: tem.data.events
								}
							}));
						} else {
							jQuery("#historySearch .pagepart").show();
							html = template({
								"pagebar": true
							});
							jQuery("#historySearch .pagepart").html(html);
							//eventType与eventTypeName转化
							if (tem.data.events.length) {
								for (var i = 0; i < tem.data.events.length; i++) {
									tem.data.events[i].eventTypeName = globalVar.getEventTypeName(tem.data.events[i].eventType);
								}
							}
							jQuery("#historySearch .table_lists_wrap #historyTable").html(template({
								historySearchItems: {
									historySearch: tem.data.events
								}
							}));
							//渲染分页
							globalVar.setPagination(tem.data.count, "#historySearch .pagination", 10, function(nextPage) {
								// TODO  分页回调函数
								param.currentPage = nextPage;
								jQuery.ajax({
									url: "/service/defence/three/history/" + param.id,
									type: "get",
									data: param,
									success: function(res) {
										if (res.code === 200 && res.data.events) {
											//eventType与eventTypeName转化
											if (res.data.events.length) {
												for (var i = 0; i < res.data.events.length; i++) {
													res.data.events[i].eventTypeName = globalVar.getEventTypeName(res.data.events[i].eventType);
												}
											}
											jQuery("#historySearch .table_lists_wrap #historyTable").html(template({
												historySearchItems: {
													historySearch: res.data.events
												}
											}));
										} else {
											notify.warn("服务器或网络异常！");
										}
									}
								});
							});
						}
					} else if (tem.code === 500) {
						notify.warn(tem.data.message);
					} else {
						notify.error("获取历史报警数据失败！");
					}
					if (data.isSearch) {
						logDict.insertMedialog("m9", "查询历史报警信息", "f11", "o17"); //加日志
					}

					require(['/module/protection-monitor/alarmanalysis/js/main.js']);
				},
				error: function() {
					notify.error("获取历史报警数据失败，请检查网络！");
					require(['/module/protection-monitor/alarmanalysis/js/main.js']);
				}
			});
		}

		function getCountListDetial(data,param){
			var self = this,html ="",lastColorIndex="",cloneArray=[];
			var color =[{
				barColor:"#87CEEE",
				ProColor:"#4169E1"
			},{
				barColor:"#bdfc99",
				ProColor:"#308014"
			},{
				barColor:"#dda0dd",
				ProColor:"#9933fa"
			},{
				barColor:"#ffc0cb",
				ProColor:"#ff00ff"
			},{
				barColor:"#c0c0c0",
				ProColor:"#808a87"
			},{
				barColor:"#ffe384",
				ProColor:"#ffd700"
			},{
				barColor:"#7fffd4",
				ProColor:"#40e0d0"
			}];
			if(data){
				cloneArray =Array.clone(color);
				$.each(data.countByEventType,function(index,item){
					var currIndex=Math.floor(Math.random()*cloneArray.length);
					var colors = cloneArray[currIndex];
					cloneArray.splice(currIndex,1);
					if(cloneArray.length<=0){
						cloneArray = Array.clone(color);
					}
					$.extend(true,item,{color:colors,id:param.id,type:param.resourceType});
				});
				html = template({
					alarmCountList: true,
					alarmListDetail: data.countByEventType
				});
				jQuery("#countDetial .countList").html(html)
				if(data.countByEventType.length===0){
					jQuery("#countDetial .countList ").find("li:first-child").after("<p class='style-text-info txtCenter'>暂无报警任务统计数据！</p>")
				}
				
			}
		}
		// 获取摄像机树根组织
		jQuery.getJSON("/service/video_access_copy/list_cameras?type=org&isRoot="+ window.sysConfig.getResMode(), function(tem) {
			if (tem.code === 200 && tem.data.cameras) {
				var name = tem.data.cameras[0].name;
				globalVar.curTreeDepartment = {
					"id": tem.data.cameras[0].id.substring(4),
					"type": "false",
					"recursion": "true"
				}
				if (tem.data.cameras.length > 0) {
					globalVar.treeSteps.push({
						"name": tem.data.cameras[0].name,
						"id": tem.data.cameras[0].id, //by wangxiaojun
						"type": "false",
						"recursion": "true"
					});
				}

				//渲染面包屑
				var html = template({
					"historyBread" : globalVar.treeSteps
				});
				jQuery("#historySearch").find(".breadcrumb").html(html);

				if (jQuery("#userEntry").attr("data-orgid") === "null") { //by wangxiaojun 判断是不是超管
					//初始化填充历史报警数据
					var data = {
						type:globalVar.treeSteps[0].type,
						id:globalVar.treeSteps[0].id.substring(4),
						recursion:true
					}
					getHistoryDate(data);
				} else {
					//非admin用户的初始化读取，by zhangyu on 2015/6/10
					var res = hasPermissionForCTree(jQuery("#userEntry").attr("data-orgid"));
					if(res.enabled){
						//初始化填充历史报警数据
						var data = {
							type: false,
							id: res.orgId,
							recursion: true
						};
						
						getHistoryDate(data);
					}
				}
			}
		});
		
	});
});
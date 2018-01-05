/**
 * main文件的view模块
 */
define([
	'../tab-panel',
	'../alarmanalysis-global-var',
	'../alarmanalysis-common-fun',
	'../controller/history-alarm-controller',
	'../controller/statistic-analysis-controller',
	'pubsub',
	'jquery-ui-timepicker-addon',
	'handlebars',
	'permission'],function(Panel,globalVar,commonFun,history,statistic,PubSub){
	var view = function(){};
	view.prototype = {
		templateUrl: "/module/protection-monitor/alarmanalysis/inc/alarmanalysis_template.html",
		init:function(){
			var self = this;
			self.registerHelper();
			self.bindDataPicker();
			self.initTemp();
		},
		//注册助手
		registerHelper:function() {
			//如果有内容则显示textarea，没有内容则不显示textarea
			Handlebars.registerHelper("overflowText", function(text, type) {
				if (text !== "" && text !== null && type === 33554432) {
					return "handAlarm-content";
				} else if (text !== "" && text !== null) {
					return "r-content";
				}
			});
			//过滤布控报警候选人列表中分值的颜色
			Handlebars.registerHelper("ScoreColor", function(index) {
				if (index === 0) {
					return "first";
				} else if (index === 1) {
					return "second";
				} else {
					return "";
				}
			});
			Handlebars.registerHelper("rightORwrong", function(num) {
				if (num === 0) {
					return "";
				} else if (num === 1) {
					return "right";
				} else if (num === 2) {
					return "wrong";
				} else if (num === 3) {
					return "unknow";
				}
			});
			// 奇偶行
			Handlebars.registerHelper("even", function(value) {
				if (value % 2 !== 0) {
					return "even";
				}
			});
			//毫秒数转化为时间
			Handlebars.registerHelper("mills2datatime", function(num) {
				if (num) {
					var datastr = Toolkit.mills2datetime(num);
					return datastr;
				}
				return "未知";
			});
			//报警类型编号转化为报警类型name
			Handlebars.registerHelper("eventType2eventName",function(eventType){
				return globalVar.getEventTypeName(eventType);
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
			Handlebars.registerHelper("AlarmLevelFilter", function(value, type) {
				if (type === "value") {
					return value;
				} else {
					return (value === 1) ? "一般" : (value === 2) ? "重要" : "严重";
				}
			});
			Handlebars.registerHelper("null2unkown", function(str) {
				if (str) {
					return str;
				} else {
					return "未知";
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
			//返回图片列表的第一张图
			Handlebars.registerHelper("list1", function(arr) {
				if (arr === null || arr[0] === "" || arr.length === 0) {
					return "/module/common/images/nopic.jpg";
				} else {
					return arr[0];
				}
			});
			//矩阵反转
			Handlebars.registerHelper("list1s", function(arr) {
				if (arr && arr.length) {
					return arr[0];
				} else {
					return "";
				}
			});
			Handlebars.registerHelper("list2", function(arr) {
				if (arr && arr.length) {
					return arr[1];
				} else {
					return "";
				}
			});
			Handlebars.registerHelper("list3", function(arr) {
				if (arr && arr.length) {
					return arr[2];
				} else {
					return "";
				}
			});

			Handlebars.registerHelper("isPlace", function(str, options) {
					if (str === "" || str === null) {
						return "未知";
					} else {
						return str;
					}
			});
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

		},
		//添加全局的日期插件
		bindDataPicker: function() {
			jQuery(document).on('focus', '.input-time', function() {
				var self = this;
				jQuery(this).datetimepicker({
					showSecond: true,
					dateFormat: 'yy-mm-dd',
					timeFormat: 'HH:mm:ss',
					timeText: '',
					hourText: '时',
					minuteText: '分',
					secondText: '秒',
					showAnim: ''
				});
			});
		},
		//初始化模板,初始化全局变量
		initTemp:function(){
			var self = this;
			commonFun.loadTemplate(self.templateUrl, function(compiler) {
				// 初始化各tab初始化时要传递的参数
				var opt = {
					"template": compiler,
					"setPagination": globalVar.setPagination
				};
				// 初始化各tab要调用的对象
				var historyAlarm = new history.HistoryAlarm(opt);
				var statisticAnalysis = new statistic.StatisticAnalysis(opt);
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
				// 初始化左侧tab
				Panel.initialize(historyAlarm,statisticAnalysis);
				// 获取组织树根组织
				jQuery.getJSON("/service/org/get_root_org?"+ window.sysConfig.getOrgMode(), function(res) {
					if (res.code === 200 && res.data.org) {
						if (jQuery("#userEntry").attr("data-orgid") === "null") { //by wangxiaojun 判断是不是超管
							//初始化填充历史报警数据
							globalVar.curDepartment = res.data.org;
						} else {
							//非admin用户的初始化读取，by zhangyu on 2015/6/10
							var res = hasPermissionForCTree(jQuery("#userEntry").attr("data-orgid"));
							if(res.enabled){
								//初始化填充历史报警数据
								globalVar.curDepartment.id = res.orgId;
							}
						}
						globalVar.steps.push({
							"name": globalVar.curDepartment.name,
							"id": globalVar.curDepartment.id,
							"parentId": globalVar.curDepartment.parentId
						});
					}
				});
				// 绑定事件
				historyAlarm.bindHistory();
			}, function() {
				//模板加载失败
				notify.error("读取报警分析模板文件失败！");
			});
		}

	}
	return new view();
});
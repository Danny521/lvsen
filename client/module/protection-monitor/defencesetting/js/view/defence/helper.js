define([
	// 布防设置工具类函数
	"/module/protection-monitor/defencesetting/js/controller/defence/defence-setting-common-fun.js",
	// 布防设置 第三步设置参数view模块
	"/module/protection-monitor/defencesetting/js/view/defence/third-view.js",
	// 全局变量
	'/module/protection-monitor/defencesetting/js/global-var.js',
	"handlebars"
], function(DefenceTools, thirdView, globalVar) {
	/**
	 * 定义模板渲染助手
	 */
	return function () {
		//获取摄像机类型和状态
		Handlebars.registerHelper("cameraStatusAndType", function (type, isonline) {
			if (type) {
				if (isonline === 0 || isonline === null) {
					return "camera-ball-online";
				}
				if (status === 1) {
					return "camera-ball-offline";
				}
			} else {
				if (isonline === 0 || isonline === null) {
					return "camera-gun-online";
				}
				if (status === 1) {
					return "camera-gun-offline";
				}
			}
			return "camera-gun-offline";
		});
		//安装类型
		Handlebars.registerHelper("cameraInstallType", function (num) {
			if (num === 1) {
				return "室内";
			}
			if (num === 2) {
				return "制高点";
			}
			if (num === 3) {
				return "高架";
			}
			if (num === 4) {
				return "水面";
			}
			if (num === 5) {
				return "路面";
			}
			if (num === 6) {
				return "其他";
			}
			return "";
		});
		//摄像机是否在线
		Handlebars.registerHelper("isOnline", function (num, options) {
			if (num === 0 || num === null) {
				return options.fn({
					'data': true
				});
			} else {
				return options.fn({
					'data': false
				});
			}
		});
		//视频播放时显示摄像机编码
		Handlebars.registerHelper("cameraCodeShow", function (data, options) {
			var data = data + "";
			if (data === "null" || data === "" || data === null || data === 'undefined') {
				return "";
			} else if (data.indexOf("(") > -1) {
				return data;
			} else {
				return "(" + data + ")";
			}
		});
		/**
		 * 根据算法事件是否开启显示图标样式
		 */
		Handlebars.registerHelper("FliterEventIcon", function (evType, taskid, enableTask) {
			return DefenceTools.getRuleIconById(evType, taskid, enableTask);
		});
		/**
		 * 根据算法事件是否开启显示文字描述样式
		 */
		Handlebars.registerHelper("FliterEventText", function (enableTask) {
			if (enableTask !== 0 && enableTask !== -1) {

				return "color-blue";
			}
		});
		//根据算法事件是否有任务开启
		Handlebars.registerHelper("EventActive", function(enableTask) {
			if (enableTask !== 0 && enableTask !== -1) {
				return "active";
			}
		});
		/**
		 * [判断算法列表是否存在已经设置的算法，如果有就展开]
		 * @author Wang Xiaojun
		 * @date   2014-10-28
		 * @param  subrules [获取的算法列表的每个算法的内容]
		 * @param  type     [根据type判断是算法的填充框，还是小图标]
		 * @return  string [根据enableTask的值判断，如果有不等于-1和0的值，就说明这个算法设置过，就让这个所在的算法列表展开]
		 */
		Handlebars.registerHelper("CheckCategoryId", function (subrules, type, index) {
			//第一个分类默认展开
			if(index === 0){
				return (type === "icon") ? "icon_uparrow icon_downarrow" : "";
			}
			//其他分类通过判断是否展开
			if(subrules) {
				for (var i = 0; i < subrules.length; i++) {
					if (subrules[i].enableTask !== -1 && subrules[i].enableTask !== 0) {
						return (type === "icon") ? "icon_uparrow icon_downarrow" : "";
					}
					if (i === subrules.length - 1) {
						if (subrules[i].enableTask === -1 || subrules[i].enableTask === 0) {
							return (type === "icon") ? "icon_uparrow" : "hidden_normal";
						}
					}
				}
			}
		});
		//判断联动规则是否存在来决定checkbox是否勾选
		Handlebars.registerHelper("checked", function (arr, num) {
			if (!arr) {
				return "";
			}
			for (var i = 0; i < arr.length; i++) {
				if (arr && parseInt(arr[i]) === num) {
					return "checked";
				}
			}
		});
		//判断人流或车流
		Handlebars.registerHelper("personORcar", function (num) {
			return (num === "4096") ? "人流(人/时):" : "车流(辆/时):";
		});
		//过滤当前算法需要的参数
		Handlebars.registerHelper("FilterParam", function (type, detailObj, options) {
			if (type === "filter" && detailObj.hasOwnProperty("EnableMaxRectFilter") && detailObj.hasOwnProperty("EnableMinRectFilter")) {
				//如果含有该属性，则显示
				return options.fn(this);
			}
			if (type === "alarmTime" && detailObj.hasOwnProperty("wDuration")) {
				return options.fn(this);
			}
			if (type === "fDensity" && detailObj.hasOwnProperty("fDensity")) {
				return options.fn(this);
			}
			if (type === "sensitivity" && detailObj.hasOwnProperty("Sensitivity")) {
				return options.fn(this);
			}
			if (type === "eventPicture" && detailObj.hasOwnProperty("enableOverlay") && detailObj.hasOwnProperty("enable")) {
				return options.fn(this);
			}
			if (type === "time" && detailObj.hasOwnProperty("taskTime")) {
				return options.fn(this);
			}
			if (type === "region" && detailObj.hasOwnProperty("region")) {
				return options.fn(this);
			}
			if (type === "fSpeed" && detailObj.hasOwnProperty("fSpeed")) {
				return options.fn(this);
			}
			if (type === "wChaos" && detailObj.hasOwnProperty("wChaos")) {
				return options.fn(this);
			}
			if (type === "wSpeed" && detailObj.hasOwnProperty("wSpeed")) {
				return options.fn(this);
			}
			if (type === "nLPHeight" && detailObj.hasOwnProperty("nLPHeight")) {
				return options.fn(this);
			}
			if (type === "streamSpeed" && detailObj.hasOwnProperty("streamSpeed")) {
				return options.fn(this);
			}
		});
		//如果已经设置过该规则，则显示已设置的值，否则默认
		Handlebars.registerHelper("FilterValue", function (strInfo, type) {
			if (!strInfo || strInfo.split(",").length !== 4) {
				//全比率
				return 1;
			} else {
				if (type === "Width") {
					return (parseFloat(strInfo.split(",")[2]) !== 0) ? (strInfo.split(",")[2] * thirdView.curCameraRate.width).toFixed(1) : "宽";
				} else {
					return (parseFloat(strInfo.split(",")[3]) !== 0) ? (strInfo.split(",")[3] * thirdView.curCameraRate.height).toFixed(1) : "高";
				}
			}
		});
		//如果使用了最大最小过滤、事件存图，则checkbox是选中状态
		Handlebars.registerHelper("CheckboxFilter", function (flag, options) {
			if (flag === "1") {
				return options.fn(this);
			}
		});
		//如果使用了最大最小过滤、事件存图，则checkbox是选中状态
		Handlebars.registerHelper("SetSensitivity", function (sensitivity, type) {
			if (type === "class") {
				return (sensitivity === "1") ? "two" : (sensitivity === "3") ? "thr" : "four";
			} else if (type === "value") {
				return (sensitivity === "1") ? 0 : (sensitivity === "3") ? 1 : 2;
			} else if (type === "text") {
				return (sensitivity === "1") ? "低" : (sensitivity === "3") ? "中" : "高";
			} else {
				return (sensitivity === "1") ? "left: 47.33px;" : (sensitivity === "3") ? "left: 104.66px;" : "left: 154px;";
			}
		});
		//如果已经有设置了等级，则选中
		Handlebars.registerHelper("FilterLevel", function (level, data) {
			if (level === undefined && data === 1) {
				return "active";
			}

			if (parseInt(level) === data) {
				return "active";
			}
		});
		//右上角眼睛的点击事件，则判断是否需要选中
		Handlebars.registerHelper("FilterSelected", function (module, evType) {
			if (module === "see_rule_list") {
				if (evType !== globalVar.defence.curSelectedRule) {
					return "icon_none";
				}
			}
		});
		//根据传过来的值判断灵敏度高中低那个被选中
		Handlebars.registerHelper("select", function (value, data) {
			if (parseInt(value) === data) {
				return "active";
			}
		});
		//如果车流人流量为空，则填充默认值
		Handlebars.registerHelper("stream", function (streamSpeed, value) {
			if (streamSpeed) {
				return streamSpeed;
			} else {
				return value;
			}
		});
	};
});
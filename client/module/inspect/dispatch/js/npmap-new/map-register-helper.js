/**
 * Created by Zhangyu on 2015/4/17.
 */
define(["js/npmap-new/map-permission", "js/npmap-new/map-variable", "OpenLayers", "handlebars"], function(pvamapPermission, Variable) {
	var helper = {
		//加载信息窗上的助手
		infowindow: function () {
			//返回摄像机属性类型
			Handlebars.registerHelper("cameraInstallType", function (num) {
				switch (num) {
					case 1:
						return "室内";
					case 2:
						return "制高点";
					case 3:
						return "高架";
					case 4:
						return "水面";
					case 5:
						return "路面";
					case 6:
						return "其他";
					default:
						return "";
				}
			});
		},
		//地图报警信息窗上的助手
		alarmInfowindow: function () {
			Handlebars.registerHelper("beginTime", function (num) {
				return parseInt(num) - 30000;
			});

			Handlebars.registerHelper("enTime", function (num) {
				return parseInt(num) + 30000;
			});

			Handlebars.registerHelper("intToAllLevel", function (num) {
				if (num === 1) {
					return "报警级别--一般";
				} else if (num === 2) {
					return "报警级别--重要";
				} else if (num === 3) {
					return "报警级别--严重";
				}
			});

			Handlebars.registerHelper("intTostatus", function (num) {
				if (num === 0) {
					return "未处理";
				}
				if (num === 1) {
					return "有效";
				}
				if (num === 2) {
					return "无效";
				}
			});

			Handlebars.registerHelper("mills2datatime", function (num) {
				if (num) {
					var datastr = Toolkit.mills2datetime(num);
					return datastr;
				}
				return "";
			});

			Handlebars.registerHelper("intTolevel", function (num) {
				if (num === 1) {
					return "一般";
				}
				if (num === 2) {
					return "重要";
				}
				if (num === 3) {
					return "严重";
				}
			});
		},
		//警力调度模块的助手
		policeSchedule: function () {
			Handlebars.registerHelper("nullToName", function (str) {
				if (str) {
					return str;
				} else {
					return "我的标记";
				}
			});

			Handlebars.registerHelper("nullToremark", function (str) {
				if (str) {
					return str;
				} else {
					return "我的备注";
				}
			});
		},
		//全景功能
		fullView: function () {
			Handlebars.registerHelper("Showmeter", function (obj, lon, lat) {
				var point = new NPMapLib.Geometry.Point(lon, lat);
				var meter = Math.round(Variable.map.getDistance(obj, point));
				return "(" + meter + "米)";
			});
		},
		//公共部分
		common: function () {
			//将通道对象数组转化为json字符串，以备后期使用
			Handlebars.registerHelper('translate', function (channel, options) {
				return channel ? JSON.stringify(channel) : '';
			});
			//左边显示搜索结果
			Handlebars.registerHelper("isOnline", function (hd, sd, options) {
				var status = 1;
				hd.each(function (item, index) {
					if (item.channel_status === 0) {
						status = 0;
					}
				});
				sd.each(function (item, index) {
					if (item.channel_status === 0) {
						status = 0;
					}
				});
				if (status === 0) {
					return options.fn({
						'data': true
					});
				}
				if (status === 1) {
					return options.fn({
						'data': false
					});
				}
				return options.fn();
			});
		}
	}

	//加载助手
	for (var fun in helper) {
		if (helper.hasOwnProperty(fun) && typeof helper[fun] === "function") {
			helper[fun]();
		}
	}
});
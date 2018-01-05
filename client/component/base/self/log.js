/**
 * 前端日志就相关逻辑
 * @authors yuqiu (yuqiu_xa@netposa.com)
 * @date    2015-01-15 14:16:05
 * @version $Id$
 */

define(["jquery", "mootools"], function(jQuery) {
	//日志管理
	var logDict = new Class({

		o: {
			"oprt": { /*动作*/
				"o1": "新建",
				"o2": "编辑",
				"o3": "删除",
				"o4": "查看",
				"o5": "下载",
				"o6": "发送",
				"o7": "标注",
				"o8": "区域选择",
				"o9": "区域选择",
				"o10": "取消",
				"o11": "配置",
				"o12": "开启",
				"o13": "搜索",
				"o14": "选择",
				"o15": "设置",
				"o16": "处理",
				"o17": "查询",
				"o18": "导出",
				"o19": "手动巡检",
				"o20": "自动巡检",
				"o21": "禁用",
				"o22": "启用",
				"o23": "分配",
				"o24": "更改",
				"o25": "检测",

				"o26": "保存",
				"o27": "关联",
				"o28": "人工标注",
				"o29": "图像处理",
				"o30": "提交审核",
				"o31": "审核",
				"o32": "评论",

				"o33": "入库",
				"o34": "导入",
				"o35": "创建",
				"o36": "通过",
				"o37": "打回",
				"o38": "提交",

				"o39": "视野范围内查询",
				"o40": "同步"
			},
			"module": {
				"m1": "视频指挥",
				"m2": "运维管理",
				"m3": "系统配置",
				"m4": "视图库",
				"m5": "图像研判",
				"m6": "云空间",
				"m7": "登录",
				"m8": "注销",
				"m9": "布防布控",
				"m10":"权限申请"
			},
			"func": {
				"f1": "视频监控",
				"f2": "指挥调度",
				"f3": "视频巡检",
				"f4": "统计报表",
				"f5": "入网检测",
				"f6": "组织用户",
				"f7": "设备管理",
				"f8": "业务管理",
				"f9": "地图配置",
				"f10": "报警管理",
				"f11": "报警分析",
				"f12": "防控管理",
                "f13": "实时巡检",
                "f14": "计划巡检",
                "f15": "电子防区",
                "f16": "计划巡航",
                "f17": "图像处理",
                "f18": "视图分析",
                "f19": "目标排查"
			},
			"moduleFunc": {
				"function0": "地图操作",
			    "function1": "实时视频",
			    "function2": "历史录像",
			    "function3": "警力调度",
			    "function4": "警卫路线",
			    "function5": "防控圈",
			    "function6": "电子防区",
			    "function7": "室内地图",
			    "function8": "全景追逃",
			    "function9": "轨迹分析",
			    "function10": "GPS监控",
			    "function11": "路径导航",
			    "function12": "云台操作",
			    "function13": "视频操作",
			    "function14": "我的分组",
			    "function15": "监巡分组",
			    "function16": "电视墙操作",
			    "function17": "布防任务管理",
			    "function18": "布控任务管理",
			    "function19": "布控库管理",
			    "function20": "报警信息",
			    "function21": "统计信息",
			    "function22": "我的工作台",
			    "function23": "基础资源库",
			    "function24": "统计分析",
			    "function25": "系统配置",
			    "function26": "图像处理",
			    "function27": "视图分析",
			    "function28": "目标排查",
			    "function29": "实时巡检",
			    "function30": "视频巡检",
			    "function31": "统计报表",
			    "function32": "日志管理",
			    "function33": "组织管理",
			    "function34": "用户管理",
			    "function35": "角色管理",
			    "function36": "服务器管理",
			    "function37": "摄像机管理",
			    "function38": "数据字典管理",
			    "function39": "业务管理",
			    "function40": "地图配置",
			    "function41": "系统授权",
			    "function42": "联动设置",
			    "function43": "计划巡航",
			    "function44": "云空间"
			},
			"objs": {
				"b1": "我的分组",
				"b2": "监巡分组",
				"b3": "实时视频(经典模式)",
				"b4": "实时视频(地图模式)",
				"b5": "实时视频(轮巡模式)",
				"b6": "历史视频(经典模式)",
				"b7": "历史视频(地图模式)",
				"b8": "历史视频(轮巡模式)",
				"b9": "电视墙",
				"b10": "扩展屏",
				"b11": "我的关注",
				"b12": "系统分组",
				"b13": "警卫路线",
				"b14": "警卫路线分组",
				"b15": "报警信息",
				"b16": "历史报警信息",
				"b17": "布防规则",
				"b18": "布防任务",
				"b19": "巡检任务",
				"b20": "巡检计划",
				"b21": "巡检结果统计列表",
				"b22": "故障率统计列表",
				"b221": "摄像机类型统计",
				"b23": "入网检测报告",
				"b24": "用户",
				"b25": "下属部门",
				"b26": "角色",
				"b27": "默认布局",
				"b28": "图片文件",
				"b29": "视频文件",
				"b30": "案事件",
				"b31": "案事件表单",
				"b32": "结构化信息",
				"b33": "线索",
				"b34": "线索表单",
				"b35": "图片表单",
				"b36": "视频表单",
				"b37": "结构化信息表单",
				"b38": "视频",
				"b39": "图片",
				"b40": "案事件审核",
				"b41": "结构化信息审核",
				"b42": "类别统计列表",

				"b43": "摄像机",
				"b44": "卡口",
				"b45": "灯杆",
				"b46": "警力",
				"b47": "报警信息",
				"b48": "防控圈组",
				"b49": "防控圈"
			}
		},

		insertLogs: "/service/log",

		initialize: function(options) {},
		//凡是涉及到开流的操作必须传入cameraname,如实时流，历史录像，发送到扩展屏或者电视墙
		insertLog: function(module, func, opra, obj, name, cameraname, callback) {
			var description;
			try {
				var that = this,
					type = "1";
				if (func === "f7" || func === "f8" || func === "f9" || func === "f16") {
					type = "2";
				}
				if (obj) {
					if (that.o.objs[obj]) {
						description = that.o.oprt[opra] + ": " + name + " -> " + that.o.objs[obj];
						//description = that.o.oprt[opra] + name + that.o.objs[obj];
					} else {
						/*obj自定义*/
						description = that.o.oprt[opra] + ": " + name + " -> " + obj;
						//description = that.o.oprt[opra] + name + obj;
					}
				} else {
					description = that.o.oprt[opra] + ": " + name;
					//description = that.o.oprt[opra] + name;
				}
				var datajson = {
					"module": that.o.module[module],
					"function": that.o.func[func] || '',
					"description": description,
					"type": type
				};
                if(cameraname){
                   datajson.objName = cameraname;
                   datajson.objType = 1;
				}
				that.postMessage(datajson, opra, callback);

			} catch (e) {}
		},
        //凡是涉及到开流的操作必须传入cameraname,如实时流，历史录像，发送到扩展屏或者电视墙
		insertMedialog: function(mo, description, func, opra, cameraname, callback) {
			/*mo:主模块,func:次模块,description:日志描述语*/
			try {
				var that = this,
					type = "1";
				if (func === "f7" || func === "f8" || func === "f9"|| func === "f16") {
					type = "2";
				}
				var data = {
					"module": that.o.module[mo],
					"function": that.o.func[func] || '',
					"description": description,
					"type": type
				};
                if(cameraname){
                   data.objName = cameraname;
                   data.objType = 1;
				}
				that.postMessage(data, opra, callback);

			} catch (e) {}
		},

		postMessage: function(data, opra, callback) {

			var that = this,
				logInfo = window.localStorage.getItem("logInfo"),
                logObj = JSON.parse(logInfo),
                opraData = {
                operateType: 5,    //操作类型 0：登录；1：查询；2：新增；3：修改；4：删除 5：其他
				operateResult: 1,  //操作结果 1:成功；0：失败  默认记录成功日志
				errorCode:200,     //失败原因代码 默认200
				operateCondition:"" //操作条件，暂时不考虑
            };
            if(opra){
               switch(opra){
               	   case "o1":
               	      opraData.operateType = 2;
               	   break;
                   case "o2":
                      opraData.operateType = 3;
               	   break;
               	   case "o3":
                      opraData.operateType = 4;
               	   break;
               	   case "o4":
                      opraData.operateType = 1;
               	   break;
               	   case "o17":
                      opraData.operateType = 1;
               	   break;
               	   default:
               	   break;
               }	
            }
            var param = jQuery.extend({},data,logObj,opraData);    
		    
			jQuery.ajax({
				url: that.insertLogs,
				dataType: "json",
				type: "post",
				data: param,
				cache: true,
				success: function(res) {
					if (res && res.code === 200) {
						if (callback) {
							callback(that.o.module[data.module], that.o.func[data["function"]], that.o.oprt[opra]);
						}
					}
				}
			});
		}
	});
	/**
	 * 定义初始化入口
	 * @type {{init: Function, initGlobal: Function}}
	 */
	return {
		init: function () {
			return new logDict();
		},
		initGlobal: function () {
			(function () {
				this.logDict = new logDict();
			}).call(window);
		}
	};
});
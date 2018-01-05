/**
 * main文件的view模块，布防布控主入口
 */
define([
	'../global-varibale',
	'pubsub',
	'../controller/common-task-controller',
	'../model/alarm-model',
	'../view/common-task-view',
	'../controller/common-map-controller',
	'../controller/common-alarmRight-controller',
	'handlebars'
], function(global, PubSub, commonctr, ajaxModel, commonView, mapCtr, comrightCtr) {
	var view = function() {};
	view.prototype = {
		commonObj: null,
		templateUrl: "/module/protection-monitor/newStructAlarmmgr/inc/newAlarmmgr_template.html",
		init: function() {
			var self = this;
			//存储全局控制器
			global.commonObj = commonctr;
			//初始化模板
			self.initTemp();
			//初始化地图
			mapCtr.init(); 
			//注册助手
			self.registerHelper();
			//初始出事中间页面视频模式
			/*jQuery("#mapId").css({
				"z-index": -100
			});
			jQuery("#mapId").find(".header").show();
			jQuery("#major").attr("data-currPart", 'ocx');
			*/
			//初始出事中间页面地图模式
			jQuery('#major').attr("data-currPart", "map");
			jQuery("#mapId").find(".header").show();
			jQuery("#mapId").css({
				"z-index": 0,
				display: "block"
			});

			self.showEventsByParam();		
		},
		//初始化模板,初始化全局变量
		initTemp: function() {
			var self = this;
			global.loadTemplate(self.templateUrl, function(compiler) {
				global.compiler = compiler;
				var opt = {
						compiler: compiler
					};
				//初始化业务层入口
				commonctr.init(opt);
				//加载右侧报警布局
				comrightCtr.init();
				//初始化事件绑定
				self._bindEvents(".header"); 
			});
		},
		//注册助手
		registerHelper: function() {
			Handlebars.registerHelper('isOnlineActive', function(cameraType, isOnline) {
				if ((cameraType === "0" || cameraType === 0) && (isOnline === "0" || isOnline === 0)) {
					return "camera-gun-online";
				} else if ((cameraType === "0" || cameraType === 0) && isOnline === "1") {
					return "";
				} else if ((cameraType === "1" || cameraType === 1) && (isOnline === "0" || isOnline === 0)) {
					return "camera-ball-online";
				} else if ((cameraType === "1" || cameraType === 1) && isOnline === "1") {
					return "camera-ball-offline";
				}

			});
			Handlebars.registerHelper('isOnlineActive1', function(isOnline) {
				if (isOnline === "0" || isOnline === 0) {
					return "online";
				}
				if (isOnline === "1" || isOnline === 1) {
					return "offline";
				}

			});
			Handlebars.registerHelper('controlTaskStatusClass', function(status) {
				// 布控中
				if (status === 0) {
					return "";
				}
				// 已过期
				if (status === 1) {
					return "unUsed";
				}
				// 已撤销
				if (status === 2) {
					return "unUsed";
				}
				// 未开始
				if (status === -1) {
					return "";
				}
				return "";
			});
			Handlebars.registerHelper('restoreSurveillanceTask', function(status) {
				// 布控中
				if (status === 0) {
					return new Handlebars.SafeString('<i class="icon-cancle permission permission-cancel-surveillance-task" data-type = "cancle" title="撤控"></i>');
				}
				// 已过期
				if (status === 1) {
					return "";
				}
				// 已撤销
				if (status === 2) {
					return new Handlebars.SafeString('<i class="icon-restore permission permission-restore-surveillance-task" data-type = "restore" title="恢复"></i>');
				}
				// 未开始
				if (status === -1) {
					return new Handlebars.SafeString('<i class="icon-cancle permission permission-cancel-surveillance-task" data-type = "cancle" title="撤控"></i>');
				}
				return "";
			});
			Handlebars.registerHelper('controlTaskStatusText', function(status) {
				// 已过期
				if (status === 1) {
					return new Handlebars.SafeString('<span class="icon-unUsed">已过期</span>');
				}
				// 已撤销
				if (status === 2) {
					return new Handlebars.SafeString('<span class="icon-unUsed">已撤销</span>');
				}

				return "";
			});
		},
		/**
		 * 事件处理程序集
		 * @type {Object}
		 */
		_eventHandler: {
			defenceTsakSet: function(e) {
				global.commonObj.defenceTsakSet();
				commonView.activePanel(jQuery(this));
				if (jQuery("#setPanel").is(":visible")) {
					jQuery("#setPanel").hide();
				}
				e.stopPropagation();
			},
			controlTsakSet: function(e) {
				global.commonObj.controlTsakSet();
				commonView.activePanel(jQuery(this));
				if (jQuery("#setPanel").is(":visible")) {
					jQuery("#setPanel").hide();
				}
				e.stopPropagation();
			},
			alarmInfoALL: function(e) {
				global.commonObj.alarmInfoShowALL();
				commonView.activePanel(jQuery(this));
				e.stopPropagation();

			},
			alarmCurrent: function(e) {
				global.commonObj.alarmInfoCurrShow();
				commonView.activePanel(jQuery(this));
				e.stopPropagation();
			},
			sceenStyle: function(e) {
				commonView.showChangeLayout(jQuery(this));
				e.stopPropagation();
			},
			mapStyle: function(e) {
				commonView.changeWrapper(jQuery(this));
				e.stopPropagation();
			}
		},
		/**
		 * 绑定事件
		 * @param selector - 选择器，为适应动态绑定
		 * @private
		 */
		_bindEvents: function(selector) {
			var self = this;
			$(selector).find("[data-handler]").map(function() {
				$(this).off("click").on("click", self._eventHandler[$(this).data("handler")]);
			});
		},
		showEventsByParam: function(){
			var location = Toolkit.paramOfUrl(window.location.href);
            if ('defenceId' in location) {
                var alarmId=location.defenceId;
                var cameraId=location.cameraId;
                var latitude=location.latitude;
                var longitude=location.longitude;

                var params;
				params = {
					cameraId:cameraId,
					alarmId:alarmId,
					latitude:latitude,
					longitude:longitude
				};
				mapCtr.setCamerasPosition(params);
				mapCtr.linkToAlarmListEvent(params.cameraId, "click", params.alarmId);
			
                return;
            }
		}
	};
	return new view();
});
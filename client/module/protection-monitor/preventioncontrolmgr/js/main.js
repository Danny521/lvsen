define(['base.self'], function() {
	require([
		'js/tab-panel',
		'js/preventcontrol-global-var',
		/*'js/controller/defence-mgr-controller',
		'js/controller/control-mgr-controller',*/
		'js/controller/people-control-controller',
		'js/protectcontrol-common-fun',
		'pubsub',
		'domReady',
		'base.self',
		'jquery-ui-timepicker-addon'
	], function (tabPanel,globalVar,/*DefenceMGR,ControlMGR,*/PeopleCONTROL,commonFun,PubSub,domReady) {

		var view= {
			init: function() {
				var self = this;
				self.initTemp();
				self.bindEvent();
				// //消息通知的引入
				// define(["Message"],function(Message){
				// 	var message  = new Message();
				// });
			},
			//绑定全局事件
			bindEvent: function() {
				//添加日期插件
				jQuery(document).on('focus', '.input-time', function() {
					var self = this;
					jQuery(this).datetimepicker({
						dateFormat: 'yy-mm-dd',
						showAnim: '',
						showTimepicker: false
						// maxDate: new Date()
					});
					//移动时间插件的位置，避免遮挡
					jQuery(".ui-datepicker").addClass("protect-control");
				});
				jQuery(document).on('focus', '.birthday-time', function() {
					var self = this;
					jQuery(this).datetimepicker({
						dateFormat: 'yy-mm-dd',
						showAnim: '',
						showTimepicker: false,
						maxDate: new Date()
					});
					//如果被移动，则清除
					jQuery(".ui-datepicker").removeClass("protect-control");
				});

				jQuery(document).on('click', '#date-icon', function() {
					jQuery(".birthday-time").focus();
				});
				//屏蔽地图右键
				jQuery("#mapId").bind('contextmenu', function() {
					// 取消文本提示
					globalVar.map.deactivateMouseContext();
					// 取消左键点击事件
					globalVar.map.zoomInOutStop();
					return false;
				});
			},

			//请求模板，初始化全局变量
			initTemp: function() {
				var self = this;
				commonFun.loadTemplate(globalVar.templateUrl, function(compiler) {
					globalVar.template = compiler;
					//各模块参数设置
					var opt = {
						template: compiler,
						setPagination: globalVar.setPagination
					};
					//添加全局变量中的模板
					globalVar.template = compiler;
					//初始化各个模块
					new tabPanel.TabPanel({
						//布防管理
						//DefenceMgr: new DefenceMGR.defenceMgr(opt),
						//布控管理
						//ControlMgr: new ControlMGR.controlMgr(opt),
						//人员布控
						PeopleControl: new PeopleCONTROL.peopleControl(opt)
					});
				}, function() {
					//模板加载失败
					notify.error("读取防控管理模板文件失败！");
				});
			}
		};

		//初始化页面
		(function init() {
			view.init();
		} ());
		domReady(function() {
		});
	});
});

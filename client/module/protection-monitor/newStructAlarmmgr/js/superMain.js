/**
 * Created by Leon.z 2015-8-20
 * 报警管理的主入口函数，读取requirejs配置
 */
define(['handlebars', 'jquery', 'jquery-ui', '/module/common/js/player2.js'],function () {
	jQuery(function() {
		var 
		/**
		 * [loadDomData 按传入的ajax列表展示页面]
		 * @param  {[type]} ajaxArray [description]
		 * @return {[type]}           [description]
		 */
		loadDomData = function(ajaxArray) {
			ajaxArray.forEach(function(item) {
				jQuery.ajax({
					type: item.type,
					data: item.data,
					url: item.url
				}).then(item.complateMethod, item.complateMethod);
			});
		},
		//注册助手
		registerHelper = function() {
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
			
			// 显示摄像机的播放状态
			Handlebars.registerHelper("changeCameraIcon", function(id, type) {
				return "";
			});
		},
		/**
		 * [ajaxArray ajax请求的列表，代表着页面展现的顺序]
		 * @type {Array}
		 */
		ajaxArray = [
			// 获取html模板
			{
				type: "get",
				url: "/module/protection-monitor/newStructAlarmmgr/inc/newAlarmmgr_template.html",
				complateMethod: function(result) {
					window.template = Handlebars.compile(result);
				}
			},
			// 获取所有布防任务
			{
				type: "get",
				url: "/service/defence/get_all_defence_task/",
				data: {
					orgId:1,
					cameraName:"",
					evType:"",
					pageNo:1,
					pageSize:10	
				},
				complateMethod: function(res) {
					if (res.code === 200) {
						var opts = {
							alarmDefenceframe: true,
							defenceTaskList:true,
							alarmDefenceList:res.data
						},
						html = window.template(opts);

						jQuery("#aside").empty().append(html);
					}

					require([
						"/module/protection-monitor/newStructAlarmmgr/js/main.js"
					]);
				}
			}
		],
		/**
		 * [checkNeedDefence 检测是否要进行布防任务设置]
		 * @param  {Function} callback [description]
		 * @return {[type]}            [description]
		 */
		checkNeedDefence = function(callback) {
			var search = window.location.search;
			if (!search || search.indexOf("defenceCamearaId=") === -1) {
				typeof callback === "function" && callback();
				return;
			}

			var cameraId = search.split("defenceCamearaId=")[1];
			jQuery('#major').attr("data-currPart", "map");
			jQuery("#mapId").find(".header").show();
			jQuery("#mapId").css({
				"z-index": 0,
				display: "block"
			});

			// 此处加载真正的main.js文件
			require(["/module/protection-monitor/defencesetting/js/main.js"], function(mainSetPort) {
				jQuery("#ocxPanel").addClass('indetify');
				jQuery(".video-play-frame-new").addClass('indetify');
				mainSetPort.init({
					taskType: 0,
					cameraId: cameraId,
					preClose: function() {
						if (jQuery("#major").attr("data-currpart") === "ocx") {
							jQuery("#ocxPanel").removeClass('indetify');
						}
						jQuery(".video-play-frame-new").removeClass('indetify');
						jQuery(".header li[data-handler='defenceTsakSet']").trigger("click");
						/** 修复从其他模块进入布防布控完成布防后刷新页面停留在编辑页面，暂时处理 add by Leon.z */
						window.location.search = "/module/protection-monitor/newStructAlarmmgr/";
					}
				});
				typeof callback === "function" && callback();
			});
		};
		/**
		 * [初始化时执行checkNeedDefence函数，判断当前页面是否由别的页面跳转过来，需要做布防设置]
		 * @param  {[type]} ) []
		 * @return {[type]}   [description]
		 */
		checkNeedDefence(function() {
			jQuery("#content").removeClass("unvisible");
			// 注册助手
			registerHelper();
			// 加载首屏数据
			loadDomData(ajaxArray);
		});
	});
});
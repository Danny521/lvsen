define([
	// 布防任务view层
	"/module/protection-monitor/defencesetting/js/view/defence/main-view.js",
	// 布控任务view层
	"/module/protection-monitor/defencesetting/js/view/control/main-view.js",
	"handlebars",
	"permission"
], function(defenceView, controlView) {
	return {
		init: function(options) {
			var	
				self = this,
				/**
				 * 任务类型 
				 * 0为布防 
				 * 1为布控
				 */
			 	taskType = options.taskType,
			 	/**
			 	 * 摄像机id
			 	 * 如果是编辑，或者从别的页面跳转过来，会带上摄像机ID或者taskId或者evtype
			 	 * 有摄像机时，处理逻辑和没摄像机不一样
			 	 */
				cameraId = options.cameraId,
				taskId = options.taskId,
				// 布防算法类型
				evtype = options.evtype,
				// 面板关闭之前执行的函数
				preClose = options.preClose,
				// 面板关闭之后执行的函数
				afterClose = options.afterClose,
				viewMap  = [ defenceView, controlView ];

			if (taskType !== 0 && taskType !== 1) {
				return false;
			}
			viewMap[taskType].init({
				cameraId: cameraId,
				taskId: taskId,
				evtype: evtype,
				preClose: preClose,
				afterClose: afterClose
			});
		}
	};
});
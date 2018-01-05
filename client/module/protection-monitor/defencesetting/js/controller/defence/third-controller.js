define([
	// 布防任务model层
	"/module/protection-monitor/defencesetting/js/model/defence-model.js",
	// 全局变量
	'/module/protection-monitor/defencesetting/js/global-var.js',
	// 布防设置工具类函数
	"/module/protection-monitor/defencesetting/js/controller/defence/defence-setting-common-fun.js",
	// 对当前绘制的区域列表进行管理（增删查改...）
	"/module/protection-monitor/defencesetting/js/controller/defence/third-arealist-controller.js",
	// 布防规则设置，划线相关逻辑控制器
	"/module/protection-monitor/defencesetting/js/controller/defence/third-drawlines-controller.js",
	// 布防规则设置-算法详细规则设置-视频截图相关控制器
	"/module/protection-monitor/defencesetting/js/controller/defence/third-video-snapshot-controller.js",
	// 布防规则设置，人脸布控相关逻辑控制器
	"/module/protection-monitor/defencesetting/js/controller/defence/third-protect-controller.js",
	// 布防任务保存相关控制器
	"/module/protection-monitor/defencesetting/js/controller/defence/third-tasksave-controller.js",
	//联动规则
	"/module/protection-monitor/defencesetting/js/controller/defence/defence-linkage-control.js"
], function(model, globalVar, DefenceTools, areaListController, linesController, snapshotController, protectController, saveTaskController,linkageControl) {
	return {
		/**
		 * [init 初始化函数]
		 * @return {[type]} [description]
		 */
		init: function() {
			areaListController.init();
			linesController.init();
			snapshotController.init();
			protectController.init();
			saveTaskController.init();
		},
		/**
		 * [getRuleParams 获取当前规则的详细参数]
		 * @param  {Function} callback [description]
		 * @return {[type]}            [description]
		 */
		getRuleParams: function(callback) {
			var self = this,
				ruleInfo = globalVar.defence.ruleInfo;

			model.getData("getAlarmRuleDetial", {
				evType: parseInt(ruleInfo.options.curRuleId),
				taskId: parseInt(ruleInfo.options.curTaskId)
			}).then(function(res) {
				//判断数据是否请求成功
				if (res.code === 200) {
					//清除上一次绘制的框线
					DefenceTools.clearSelectedRuleInfo();
					//目前只有人脸检测有布防布控的任务，而且布局不一样，故添加标记，以渲染模板
					if (ruleInfo.options.curRuleName === "人脸检测") {
						jQuery.extend(res.data, { isFace: true });
					}

					if(ruleInfo.options.curRuleName === "实时标注"){
						jQuery.extend(res.data, { isMark: true },true);
					}
					
					jQuery.extend(res.data, {
						ruleDetial: true,
						eventType: ruleInfo.options.curRuleId
					});
					//添加联动规则
					if (parseInt(ruleInfo.options.curTaskId) !== 0) {
						linkageControl.taskId = ruleInfo.options.curTaskId;
						linkageControl.getLinkageByTaskId(ruleInfo.options.curTaskId, function(err, data) {
							if (err) {
								return notify.warn("获取联动信息异常！");
							}
							//linkageControl.setLinkageParams(data);
						});
					}
					//存储当前事件规则的参数信息
					ruleInfo.curRuleParamInfo = res.data;
					//清空算法规则框线区域
					areaListController.clearAreaListInfo();

					//标记当前操作的位置
					globalVar.defence.curOperationPos = 1;
					//清除上一次绘制的框线
					globalVar.defence.videoPlayer.releaseAllImage(0);
					//加载参数列表
					callback(null, res.data, areaListController);
				} else {
					callback("读取规则参数信息失败！");
				}
			}, function() {
				callback("读取规则参数信息失败！");
			});
		}
	};
});
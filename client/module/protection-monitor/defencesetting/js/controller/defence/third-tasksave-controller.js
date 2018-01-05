/*global logDict:true, SHOW_PLAYING_VIDEO_STREAM:true*/
/**
 * Created by Zhangyu on 2014/12/11.
 * 布防任务保存相关控制器
 */
define([
	"/module/protection-monitor/defencesetting/js/global-var.js",
	"/module/protection-monitor/defencesetting/js/controller/defence/defence-setting-common-fun.js",
	"/module/protection-monitor/defencesetting/js/model/defence-model.js",
	"/module/protection-monitor/defencesetting/js/view/defence/third-tasksave-view.js",
	"/module/protection-monitor/defencesetting/js/controller/defence/third-arealist-controller.js",
	"/module/protection-monitor/defencesetting/js/controller/defence/defence-linkage-control.js",
	"pubsub",
	"jquery"
], function(globalVar, DefenceTools, model, view, areaListController,linkageControl, PubSub, jQuery) {
	var Controller = function(){
		var self = this;

		//订阅事件-保存布防任务
		PubSub.unsubscribe(self.saveCameraRuleDetailToken);
		self.saveCameraRuleDetailToken = PubSub.subscribe("saveCameraRuleDetail", function(msg, data) {
			self.saveCameraRuleDetail(data);
		});
		//订阅事件-删除布防任务
		PubSub.unsubscribe(self.delCameraRuleDetailToken);
		self.delCameraRuleDetailToken = PubSub.subscribe("delCameraRuleDetail", function() {
			self.delCameraRuleDetail();
		});
	};

	Controller.prototype = {
		/**
		 * 初始化函数
		 */
		init: function() {
			view.init();
		},

		/**
		 * 某摄像机某布防事件规则的保存事件，收集保存信息
		 * @param data - 待保存的页面dom信息
		 */
		saveCameraRuleDetail: function (data) {
			if (areaListController.hasInvalidArea()) {
				notify.error("存在超出视频范围的布防区域，布防任务保存失败");
				jQuery("#RuleDetailSave").removeClass("disabled");
				return false;
			}
			
			var self = this, isOk = true, gloablRuleInfo = globalVar.defence.ruleInfo;
			//第一步：判断布防路数限制是否合法
			//self.checkLimitAllow(gVariable.curCameraData.orgid, function(){
			//第二步：收集参数
			for (var name in gloablRuleInfo.curRuleParamInfo) {
				if (gloablRuleInfo.curRuleParamInfo.hasOwnProperty(name)) {
					//获取摄像机的分辨率
					var curCameraRate = DefenceTools.getCameraRate();
					//遍历参数列表，格式化数据
					switch (name) {
						//灵敏度
						case "Sensitivity":
							gloablRuleInfo.curRuleParamInfo.Sensitivity = data.sensitivity;
							break;
						//时间段
						case "taskTime":
							gloablRuleInfo.curRuleParamInfo.taskTime = gloablRuleInfo.timeTemplateObj.formateTimeSlot();
							if (!gloablRuleInfo.curRuleParamInfo.taskTime) {
								notify.warn("报警时间段设置有误，请重新设置！");
								isOk = false;
							}
							if (gloablRuleInfo.curRuleParamInfo.taskTime.length === 0) {
								notify.warn("报警时间段不能为空，请设置！");
								isOk = false;
							}
							break;
						//图片抓拍，报警规则叠加[暂默认为1]
						/*case "enableOverlay":
						 jQuery(".rules .event-picture-store input[type='checkbox']").each(function(){
						 if(jQuery(this).attr("name") === "enable"){
						 //抓拍标记
						 gloablRuleInfo.curRuleParamInfo.enable = jQuery(this).prop("checked") ? "1" : "0";
						 } else {
						 //规则叠加标记
						 gloablRuleInfo.curRuleParamInfo.enableOverlay = jQuery(this).prop("checked") ? "1" : "0";
						 }
						 });
						 break;*/
						//过滤器
						case "EnableMinRectFilter":
							//获取最大最小过滤器
							var rateArr = [], minFilterWidth = 0, minFilterHeight = 0, maxFilterWidth = 0, maxFilterHeight = 0;
							//获取过滤值
							
							jQuery(".rules .event-rect-filter input[type='checkbox']").each(function () {
								if (jQuery(this).attr("name") === "EnableMinRectFilter") {
									//最小过滤
									gloablRuleInfo.curRuleParamInfo.EnableMinRectFilter = jQuery(this).prop("checked") ? "1" : "0";
									//非法尾随检测和奔跑检测中，必须进行过滤检测
									if (gloablRuleInfo.curRuleParamInfo.EnableMinRectFilter === "0" && (gloablRuleInfo.options.curRuleId === "8388608" || gloablRuleInfo.options.curRuleId === "1024")) {
										notify.warn((gloablRuleInfo.options.curRuleId === "8388608") ? "非法尾随检测任务必须设置最小物体！" : "奔跑检测任务必须设置最小物体！");
										isOk = false;
										return false;//跳出each循环
									}
									//对过滤值进行差错验证
									var minWidthVal = jQuery(this).parent().parent().find("input[name='minW']").val(), minHeightVal = jQuery(this).parent().parent().find("input[name='minH']").val();
									
									
									if(minWidthVal <= 0 || isNaN(minWidthVal)){
										notify.warn("最小物体中输入的值必须是数值且不为0，请检查更正！");
										isOk = false;
										return false;//跳出each循环

									};

									if (!DefenceTools.invalidate.filterNumbers(minWidthVal, false) || !DefenceTools.invalidate.filterNumbers(minHeightVal, false)) {
										notify.warn("最小物体中输入的值必须是非负数值，请检查更正！");
										isOk = false;
										return false;//跳出each循环
									}
									minFilterWidth = parseFloat(minWidthVal);
									minFilterHeight = parseFloat(minHeightVal);
									if (minFilterWidth > curCameraRate.width || minFilterHeight > curCameraRate.height) {
										notify.warn("最小物体中输入的值超过了当前摄像机的分辨率，请检查更正！");
										isOk = false;
										return false;//跳出each循环
									}
									//获取过滤值
									var minFilterRate = jQuery(this).closest("span").attr("data-rate");
									rateArr = minFilterRate.split(",");
									if (rateArr.length === 4) {
										gloablRuleInfo.curRuleParamInfo.MinRectFilter = "0.000000, 0.000000," + parseFloat(minFilterWidth * parseFloat(rateArr[2]) / (curCameraRate.width * parseFloat(rateArr[2]))).toFixed(6) + "," + parseFloat(minFilterHeight * parseFloat(rateArr[3]) / (curCameraRate.height * parseFloat(rateArr[3]))).toFixed(6);
									} else {
										gloablRuleInfo.curRuleParamInfo.MinRectFilter = "0.000000, 0.000000," + parseFloat(minFilterWidth).toFixed(6) + "," + parseFloat(minFilterHeight).toFixed(6);
									}
								} else {
									//最大过滤
									gloablRuleInfo.curRuleParamInfo.EnableMaxRectFilter = jQuery(this).prop("checked") ? "1" : "0";
									//非法尾随检测和奔跑检测中，必须进行过滤检测
									if (gloablRuleInfo.curRuleParamInfo.EnableMaxRectFilter === "0" && (gloablRuleInfo.options.curRuleId === "8388608" || gloablRuleInfo.options.curRuleId === "1024")) {
										notify.warn((gloablRuleInfo.options.curRuleId === "8388608") ? "非法尾随检测任务必须设置最大物体！" : "奔跑检测任务必须设置最大物体！");
										isOk = false;
										return false;//跳出each循环
									}
									//对过滤值进行差错验证
									var maxWidthVal = jQuery(this).parent().parent().find("input[name='maxW']").val(), maxHeightVal = jQuery(this).parent().parent().find("input[name='maxH']").val();
									if(maxWidthVal <= 0 || isNaN(maxHeightVal)){
										notify.warn("最大物体中输入的值必须是数值且不为0，请检查更正！");
										isOk = false;
										return false;//跳出each循环

									};
									if (!DefenceTools.invalidate.filterNumbers(maxWidthVal, false) || !DefenceTools.invalidate.filterNumbers(maxHeightVal, false)) {
										notify.warn("最大物体中输入的值必须是非负数值，请检查更正！");
										isOk = false;
										return false;//跳出each循环
									}
									maxFilterWidth = parseFloat(maxWidthVal);
									maxFilterHeight = parseFloat(maxHeightVal);
									if (maxFilterWidth > curCameraRate.width || maxFilterHeight > curCameraRate.height) {
										notify.warn("最大物体中输入的值超过了当前摄像机的分辨率，请检查更正！");
										isOk = false;
										return false;//跳出each循环
									}
									//获取过滤值
									var maxFilterRate = jQuery(this).closest("span").attr("data-rate");
									rateArr = maxFilterRate.split(",");
									if (rateArr.length === 4) {
										gloablRuleInfo.curRuleParamInfo.MaxRectFilter = "0.000000, 0.000000," + parseFloat(maxFilterWidth * parseFloat(rateArr[2]) / (curCameraRate.width * parseFloat(rateArr[2]))).toFixed(6) + "," + parseFloat(maxFilterHeight * parseFloat(rateArr[3]) / (curCameraRate.height * parseFloat(rateArr[3]))).toFixed(6);
									} else {
										gloablRuleInfo.curRuleParamInfo.MaxRectFilter = "0.000000, 0.000000," + parseFloat(maxFilterWidth).toFixed(6) + "," + parseFloat(maxFilterHeight).toFixed(6);
									}
								}
							});
							break;
						//框线区域
						case "region":
							var region = areaListController.formateAreaInfo();
							if (region && region.length > 3) {
								notify.warn("最多支持三个布防区域，请删除多余的布防区域，再进行操作！");
								isOk = false;
							} else if (region && region.length > 0 && region.length <= 3) {
								gloablRuleInfo.curRuleParamInfo.region = region;
							} else {
								notify.warn("布防区域数据为空，请先绘制布防区域，再进行操作！");
								isOk = false;
							}
							break;
						//报警时间
						case "wDuration":
						    //gloablRuleInfo.curRuleParamInfo.wDuration = data.wduration;
							gloablRuleInfo.curRuleParamInfo.wDuration = jQuery('#manyData .event-alarm-time .speedSlider').slider('value');
							// if (gloablRuleInfo.options.curRuleId !== "32") {
							// 	if (!DefenceTools.invalidate.filterIntegers(gloablRuleInfo.curRuleParamInfo.wDuration, 1, 5)) {
							// 		notify.warn("告警时间是1~5的正整数，请检查更正！");
							// 		isOk = false;
							// 	}
							// } else {
							// 	//徘徊检测的告警时间范围是1到600秒
							// 	if (!DefenceTools.invalidate.filterIntegers(gloablRuleInfo.curRuleParamInfo.wDuration, 1, 600)) {
							// 		notify.warn("告警时间是1~5的正整数，请检查更正！");
							// 		isOk = false;
							// 	}
							// }
							break;
						//人群密度
						case "fDensity":
							if (!DefenceTools.invalidate.filterNumbers(data.fdensity, true)) {
								notify.warn("人群密度是0到1之间的数值，请检查更正！");
								isOk = false;
							} else {
								gloablRuleInfo.curRuleParamInfo.fDensity = parseFloat(data.fdensity);
							}
							break;
						//打架速度
						case "wSpeed":
							//gloablRuleInfo.curRuleParamInfo.wSpeed = data.wspeed;
							//打架速度和混乱度显示为灵敏度
							gloablRuleInfo.curRuleParamInfo.wSpeed = data.sensitivity;
							if (!DefenceTools.invalidate.filterIntegers(gloablRuleInfo.curRuleParamInfo.wSpeed, 1, 100)) {
								notify.warn("打架速度是1~100的正整数，请检查更正！");
								isOk = false;
							}
							break;
						//打架混乱度
						case "wChaos":
							//gloablRuleInfo.curRuleParamInfo.wChaos = data.wchaos;
							gloablRuleInfo.curRuleParamInfo.wChaos = data.sensitivity;
							if (!DefenceTools.invalidate.filterIntegers(gloablRuleInfo.curRuleParamInfo.wChaos, 1, 100)) {
								notify.warn("打架混乱度是1~100的正整数，请检查更正！");
								isOk = false;
							}
							break;
						//触发报警速度
						case "fSpeed":
							if (!DefenceTools.invalidate.filterNumbers(data.fspeed, true)) {
								notify.warn("触发报警速度是0到1之间的数值，请检查更正！");
								isOk = false;
							} else {
								gloablRuleInfo.curRuleParamInfo.fSpeed = parseFloat(data.fspeed);
							}
							break;
						//车牌标定
						case "nLPHeight":
							if (!DefenceTools.invalidate.filterNumbers(data.carflagw, false) || !DefenceTools.invalidate.filterNumbers(data.carflagh, false)) {
								notify.warn("车牌的宽、高必须是数值，请检查更正！");
								isOk = false;
							} else {
								var carFlagWidth = parseFloat(data.carflagw), carFlagHeight = parseFloat(data.carflagh);
								if (carFlagWidth <= 0 || carFlagHeight <= 0) {
									notify.warn("车牌的宽、高必须是正数，请检查更正！");
									isOk = false;
								} else {
									if (parseFloat(carFlagWidth) > curCameraRate.width || parseFloat(carFlagHeight) > curCameraRate.height) {
										notify.warn("车牌大小中输入的值超过了当前摄像机的分辨率，请检查更正！");
										isOk = false;
									} else {
										gloablRuleInfo.curRuleParamInfo.nLPWidth = carFlagWidth;
										gloablRuleInfo.curRuleParamInfo.nLPHeight = carFlagHeight;
									}
								}
							}
							break;
						//车流、人流
						case "streamSpeed":
							gloablRuleInfo.options.curStreamSpeed = data.curstreamspeed;
							if (!DefenceTools.invalidate.filterIntegers(gloablRuleInfo.options.curStreamSpeed, 0, 100000)) {
								notify.warn("流速必须是1~99999的正整数，请检查更正！");
								isOk = false;
							}
							break;

						default:
							break;
					}
					if (!isOk) {
						//一旦发现有错误，则不再进行参数循环（for循环）
						break;
					}
				}
			}
			if (isOk) {
				//报警等级
				var severity = parseInt(data.level);
				//联动规则
				gloablRuleInfo.options.curLinkOptions = data.linkoptions;
				//如果参数没有错误，保存布防规则信息到数据库
				self.dealSaveCameraRuleDetail(severity);
			} else {
				setTimeout(function() {
					jQuery("#RuleDetailSave").removeClass('disabled');
				}, 1000);
			}
			//});
		},

		/**
		 * 将某个摄像机的某个布防事件的规则信息存储到数据库，以备触发报警(添加或者更新)
		 * @param severity - 当前布防任务的报警等级
		 */
		dealSaveCameraRuleDetail: function (severity) {
			var gloablRuleInfo = globalVar.defence.ruleInfo;
			//删除掉参数中多余的值（self.curRuleParamInfo为布防在算法参数，不需要以下应用参数）
			delete gloablRuleInfo.curRuleParamInfo.ruleDetial;	//渲染模板时添加，此处清除
			delete gloablRuleInfo.curRuleParamInfo.eventType;	//渲染模板时添加，此处清除
			delete gloablRuleInfo.curRuleParamInfo.streamSpeed;	//默认参数中添加，此处清除
			delete gloablRuleInfo.curRuleParamInfo.linkOptions;	//回显是后端返回，此处清除
			//存储数据库（添加或者更新）
			model.postData("saveCameraRuleDetail", {
				channelId: globalVar.defence.cameraData.curChannelId,		//摄像机视频播放的通道id
				cameraId: globalVar.defence.cameraData.id,	//摄像机id
				name: gloablRuleInfo.options.curRuleName,	//布防规则名称
				evType: parseInt(gloablRuleInfo.options.curRuleId),	//布防规则标示id
				enableTask: 1,	//报警规则开启如否(1开启，0关闭)
				severity: severity,	//报警等级(1一般，2重要，3严重)
				taskId: parseInt(gloablRuleInfo.options.curTaskId),		//任务id，如果该布防规则已经设置过，则有id值，否则为0
				params: JSON.stringify(gloablRuleInfo.curRuleParamInfo),	//算法参数部分
				frontParam: areaListController.formateDrawData(0),	//存储绘图坐标信息，为了修改回显
				streamSpeed : gloablRuleInfo.options.curStreamSpeed,	//车流/人流速度
				linkOptions : gloablRuleInfo.options.curLinkOptions/*,	//联动规则
				modulename : gloablRuleInfo.options.modulename,	//算法名称
				moduleversion : gloablRuleInfo.options.moduleversion	//算法版本*/
			}).then(function(res){
				if (res.code === 200) {
					if (res.data.message === "失败") {
						notify.error("布防任务保存失败！");
						setTimeout(function() {
							jQuery("#RuleDetailSave").removeClass('disabled');
						}, 1000);
						return;
					}
					notify.success("布防任务保存成功！");
					//添加日志--选择XX摄像机设置XX布防规则
					logDict.insertMedialog("m9", "选择" + globalVar.defence.cameraData.name + "摄像机设置" + gloablRuleInfo.options.curRuleName + "布防规则", "f10");
					// //触发显示实时流&删除图像
					// PubSub.publish(SHOW_PLAYING_VIDEO_STREAM, {});
					// //触发禁用绘图工具
					// PubSub.publish("hideVideoTool", {});
					// //标记当前的操作位置
					// globalVar.defence.curOperationPos = 0;
					// //更新算法规则列表
					// view.updateRuleListOnSave(res.data.taskId);
					// 保存成功后，显示第四步 完成
					//view.showFinish();
					
                    //如果是编辑
					if (parseInt(gloablRuleInfo.options.curTaskId) !== 0) {
						//且选择了联动
						if (jQuery("#manyData .defence .linkBtn").hasClass("active-linkage")) {
							addLinkage(res.data.taskId, res.data.pccTaskId, globalVar.defence.cameraData);
							return;
						} else {
							// 清除联动选择
							linkageControl.resetElement();
							linkageControl.taskId = 0;
							view.showFinish();
							return;
						}
					}
					// 如果是新增 直接添加联动规则
					addLinkage(res.data.taskId,res.data.pccTaskId,globalVar.defence.cameraData);
					// 添加联动规则
					function addLinkage(taskId,pccId,cameraData) {
						linkageControl.addLinkageBatch(taskId,pccId,cameraData,function(err) {
							if (err) {
								return notify.error("保存任务成功，创建联动规则失败");
							}
							notify.success("保存任务成功！");
							//清除点击联动标识
							jQuery("#manyData .defence .linkBtn").removeClass("active-linkage");
							// 清除联动选择
							linkageControl.resetElement();
							linkageControl.taskId = 0;
							view.showFinish();
						});

					}
					view.showFinish();
				} else if (res.code === 500) {
					notify.error("布防任务保存失败！");
					setTimeout(function() {
						jQuery("#RuleDetailSave").removeClass('disabled');
					}, 1000);
				} else {
					notify.error("布防任务保存失败！");
					setTimeout(function() {
						jQuery("#RuleDetailSave").removeClass('disabled');
					}, 1000);
				}
			}, function(){
				notify.error("布防任务保存失败，请查看网络！");
				setTimeout(function() {
					jQuery("#RuleDetailSave").removeClass('disabled');
				}, 1000);
			});
		},

		/**
		 * 某摄像机某布防事件规则的删除事件
		 */
		delCameraRuleDetail: function () {
			var gloablRuleInfo = globalVar.defence.ruleInfo;
			model.postData("delCameraRuleDetail", {
				taskId: gloablRuleInfo.options.curTaskId,
				_method: "delete"
			}, undefined, "/" + gloablRuleInfo.options.curTaskId).then(function(res) {
				if (res.code === 200) {
					notify.success("布防任务删除成功！");
					//触发显示实时流&删除图像
					PubSub.publish(SHOW_PLAYING_VIDEO_STREAM, {});
					//触发禁用绘图工具
					PubSub.publish("hideVideoTool", {});
					//标记当前的操作位置
					globalVar.defence.curOperationPos = 0;
					//更新算法列表
					view.updateRuleListOnDel();
				} else if (res.code === 500) {
					notify.error(res.data.message);
				} else {
					notify.error("布防任务删除异常。");
				}
			},function() {
				notify.error("布防任务删除异常,请查看网络！");
			});
		},

		/**
		 * 添加布防任务时，检查是否超过布防路数限制
		 * @param orgId - 当前组织的id
		 * @param callback - 检查成功后的保存函数回调
		 * @returns {boolean} - 检查是否成功
		 */
		checkLimitAllow: function(orgId, callback){
			var self = this, result = true, checkType = -1;
			var gloablRuleInfo = globalVar.defence.ruleInfo;
			//开启保存进度
			PubSub.publish("showHideProgress", {
				showFlag: true,
				msg: "正在准备保存信息"
			});
			//第一步：如果当前摄像机正在布防，则不做路数限制
			if(gloablRuleInfo.options.curTaskId !== "0" && gloablRuleInfo.options.curTaskStatus === "1"){
				//当前任务正在布防中，此种情况为修改，直接回调保存
				callback();
				//关闭进度提示
				PubSub.publish("showHideProgress", {
					showFlag: false
				});
				return result;
			} else {
				//判断当前摄像机是否有其他任务
				var taskIngCount = jQuery(".default-rule-list dd").find("span[data-status='1']").length;
				if(taskIngCount > 0){
					//此时摄像机已在用,此时需要进行任务限制判断
					checkType = 1;
				} else {
					//当前摄像机没有正在运行的任务，故为不在用状态，需要先判断摄像机限制判断，再进行任务判断
					checkType = 2;
				}
			}
			//判断是否可以直接引用组织id
			if(orgId){
				self.dealCheckLimitAllow(orgId, checkType, callback);
			} else {
				//通过cameraid获取对应的组织id，然后再进行验证
				model.getData("getOrgidByCameraid", {
					cameraId: parseFloat(gloablRuleInfo.options.curCameraId)
				}).then(function (res) {
					if (res.code === 200) {
						self.dealCheckLimitAllow(res.data.orgId, checkType, callback);
					} else if (res.code === 500) {
						notify.error(res.data.message);
						//关闭进度提示
						PubSub.publish("showHideProgress", {
							showFlag: false
						});
					} else {
						notify.error("获取当前摄像机的组织信息失败！");
						//关闭进度提示
						PubSub.publish("showHideProgress", {
							showFlag: false
						});
					}
				}, function () {
					notify.error("获取当前摄像机的组织信息，请查看网络状况！");
					//关闭进度提示
					PubSub.publish("showHideProgress", {
						showFlag: false
					});
				});
			}
			return result;
		},

		/**
		 * 读取当前组织的布防信息，对当前的用户操作进行验证
		 * @param orgId - 当前摄像机的组织id
		 * @param type - 检查类型
		 * @param callback - 检查成功后的保存函数回调
		 */
		dealCheckLimitAllow: function(orgId, type, callback){

			//从左侧树进入直接可以获取组织id进行判断
			model.getData("checkCameraLimitAllow", {
				orgId: orgId
			}).then(function(res){
				var curTaskNumber = res.data.currentSettingDefenceTaskNumber,   //设置的最大布防任务数
					curTaskCount = res.data.currentDefenceTaskCount,    //当前的布防任务数
					minTaskNumber = res.data.minDefenceTaskNumber,      //最小布防任务数
					curCameraNumber = res.data.currentSettingCameraNumber,  //设置的最大布防摄像机数
					curCameraCount = res.data.currentCameraCount,   //当前布防摄像机数
					minCameraNumber = res.data.minCameraNumber;     //最小布防摄像机数
				if (res.code === 200) {
					//根据判断类型进行判断
					if(type === 1){
						//只判断布防任务
						if(curTaskNumber !== 0) {
							curTaskCount = (curTaskCount === -1) ? 0 : curTaskCount;
							minTaskNumber = (minTaskNumber === -1) ? 0 : minTaskNumber;
							if ((curTaskNumber - curTaskCount - minTaskNumber) > 0) {
								callback();
							} else {
								notify.warn("当前组织下可设置的布防任务资源已用完，请释放正在进行的任务后重试！");
							}
						} else {
							//无限设置
							callback();
						}
					} else {
						//先判断摄像机
						if(curCameraNumber !== 0) {
							curCameraCount = (curCameraCount === -1) ? 0 : curCameraCount;
							minCameraNumber = (minCameraNumber === -1) ? 0 : minCameraNumber;
							if ((curCameraNumber - curCameraCount - minCameraNumber) > 0) {
								//判断布防任务
								if(curTaskNumber !== 0) {
									curTaskCount = (curTaskCount === -1) ? 0 : curTaskCount;
									minTaskNumber = (minTaskNumber === -1) ? 0 : minTaskNumber;
									if ((curTaskNumber - curTaskCount - minTaskNumber) > 0) {
										callback();
									} else {
										notify.warn("当前组织下可设置的布防任务资源已用完，请释放正在进行的任务后重试！");
									}
								} else {
									callback();
								}
							} else {
								notify.warn("当前组织下可设置的布防摄像机资源已用完，请释放正在布防的摄像机后重试！");
							}
						} else {
							//无限制增加摄像机的情况
							if(curTaskNumber !== 0) {
								//判断布防任务
								curTaskCount = (curTaskCount === -1) ? 0 : curTaskCount;
								minTaskNumber = (minTaskNumber === -1) ? 0 : minTaskNumber;
								if ((curTaskNumber - curTaskCount - minTaskNumber) > 0) {
									callback();
								} else {
									notify.warn("当前组织下可设置的布防任务资源已用完，请释放正在进行的任务后重试！");
								}
							} else {
								//无限制增加任务的情况
								callback();
							}
						}
					}
				} else if (res.code === 500) {
					notify.error(res.data.message);
				} else {
					notify.error("获取当前组织下布防路数信息失败！");
				}
				//关闭进度提示
				PubSub.publish("showHideProgress", {
					showFlag: false
				});
			}, function(){
				notify.error("获取当前组织下布防路数信息，请查看网络状况！");
				//关闭进度提示
				PubSub.publish("showHideProgress", {
					showFlag: false
				});
			});
		}
	};

	return new Controller();
});

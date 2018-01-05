define([
	// 布防任务model层
	"/module/protection-monitor/defencesetting/js/model/defence-model.js",
	// 布防设置工具类函数
	"/module/protection-monitor/defencesetting/js/controller/defence/defence-setting-common-fun.js",
	// 全局变量
	'/module/protection-monitor/defencesetting/js/global-var.js',
	// 布防任务设置第三步 设置参数
	'/module/protection-monitor/defencesetting/js/view/defence/third-view.js',
	// 对当前绘制的区域列表进行管理（增删查改...）
	"/module/protection-monitor/defencesetting/js/controller/defence/third-arealist-controller.js"
], function(model, DefenceTools, globalVar, thirdView, areaListController) {
	return {
		//车流人流刷新间隔为1秒
		refreshCarOrPeopleCountInterval: 1000,
		/**
		 * 获取当前摄像机待播放channel，目前是取任意一个
		 */
		getCameraPlayChannel: function () {
			//获取待播放的通道id
			var camchannelid = null,
				cameraData = globalVar.defence.cameraData;
			if (cameraData.hdchannel.length > 0) {
				camchannelid = cameraData.hdchannel[0].id; //目前只有1个
			} else if (cameraData.sdchannel.length > 0) {
				for (var i = 0; i < cameraData.sdchannel.length; i++) {
					if (cameraData.sdchannel[i].pvg_group_id === 2 || cameraData.sdchannel[i].pvg_group_id === 3) { //1表示编码器，没有录像；2表示DVR
						camchannelid = cameraData.sdchannel[i].id;
						break;
					}
				}
			}
			cameraData.curChannelId = camchannelid;
		},
		getRuleList: function(callback) {
			var ajaxList = [
				model.getData("defenceRuleList", {}),
				model.getData("getDefenceInfoByCameraId", { cameraId: globalVar.defence.cameraData.id })
			];

			model.when(ajaxList).then(function (res, resex) {
				//判断数据是否请求成功
				if (res.code === 200 && resex.code === 200) {
					//格式化数据
					var data = DefenceTools.formateData(res.data, "rule_list", resex.data.defenceStatusList);
					//渲染模板&绑定事件
					callback(null, data);
				} else {
					callback("读取布防规则列表失败！");
				}
			}, function () {
				callback("读取布防规则列表失败！");
			});
		},
		/**
		 * 收集算法参数
		 * @param $span - 当前算法的span的jQuery对象
		 */
		collectRuleInfo: function($span) {
			var ruleInfo = globalVar.defence.ruleInfo;
			// 赋值规则信息
			ruleInfo.options = {
				curRuleId: $span.attr("data-id"),                  //当前待设置的算法id
				curRuleName: $span.attr("data-name"),              //当前算法事件的名称
				curTaskId: $span.attr("data-taskid"),              //如果当前算法有设置过，则存储当前算法规则对应的taskid                        
				curStreamSpeed: "",	                               //记录当前车流/人流速度
				curTaskStatus: $span.attr("data-status"),          //记录当前任务的状态(开启为1，关闭为0)
				curLinkOptions: [],	                               //记录当前联动规则
				curModuleName: $span.attr("data-modulename"),
				curModuleVersion: $span.attr("data-moduleversion")
			};

			ruleInfo.isDefenceFlag = true;
			
			thirdView.init();
		},
		/**
		 * 进入布防规则设置页面，播放当前摄像头的视频
		 */
		playCurCameraVideo: function (cameraData) {
			var self = this;
			//清空播放器对象信息
			DefenceTools.clearVideoInfo();
			globalVar.defence.videoPlayer = new VideoPlayer({
				layout: 1,
				uiocx: "UIOCXDEFEND",
				displayMode: 1
			});
			//播放视频
			setTimeout(function() {
				globalVar.defence.videoPlayer.defencePlay({
					"hdChannel": cameraData.hdchannel, //高清通道
					"sdChannel": cameraData.sdchannel, //标清通道
					"cId": cameraData.id,
					"cName": cameraData.name,
					"cType": cameraData.cameratype,	//摄像机类型：0枪机，1球机
					"cStatus": cameraData.cstatus//摄像机在线离线状态：0在线，1离线
					
				});
				if (cameraData.cameratype === 1 && cameraData.cstatus === 0) {
					if(permission.klass["ptz-control"] !== "ptz-control"){
						globalVar.defence.videoPlayer.switchPTZ(false, 0);
					} else {
						globalVar.defence.videoPlayer.switchPTZ(true, 0);
					}
				}
			}, 1000);
		},
		getHistoryRuleList: function(data, callback) {
			var self = this;
			if (globalVar.defence.curOperationPos === 0) {
				if (DefenceTools.checkedPlayer(2)) {
					//读取数据库，显示算法规则列表-非规则的详细设置页面
					self.showEventTypeList(data.obj, callback);
				}
			} else {
				//规则的详细设置页面-直接显示，不在读取数据库
				if (jQuery(data.obj).hasClass("icon_eye_active")) {
					jQuery(data.obj).removeClass("icon_eye_active").attr("title", "查看规则");
					//清除绘图
					globalVar.defence.videoPlayer.releaseAllImage(0);
				} else {
					if (!DefenceTools.checkedPlayer(2)) {
						return callback("正在加载摄像机视频，请稍后...");
					}

					if (jQuery("#TempSnapCover").length !== 0) {
						return callback("请先播放摄像机再进行操作！");
					}

					if (globalVar.defence.ruleInfo.isDefenceFlag) {
						//获取当前区域列表
						var curAreaList = areaListController.getCurAreaList();
						if (curAreaList.length !== 0) {
							jQuery(data.obj).addClass("icon_eye_active").attr("title", "隐藏规则");
							//显示当前规则对应的框线规则
							DefenceTools.ruleLineOpera.dealGraphicOnVideo(curAreaList, DefenceTools.getDisplayRate()/*getCameraRate()*/);
						} else {
							callback("当前暂没有任何区域，请先在视频上添加！");
						}
					} else {
						if (globalVar.defence.ruleInfo.faceProtectInfo.containerObj && globalVar.defence.ruleInfo.faceProtectInfo.containerObj.is(":visible")) {
							jQuery(data.obj).addClass("icon_eye_active").attr("title", "隐藏规则");
							//显示当前规则对应的框线规则
							var cameraRate = DefenceTools.getCameraRate();
							var ruleInfo = protectController.getFaceRuleDetails(cameraRate);
							DefenceTools.ruleLineOpera.dealGraphicOnVideo(ruleInfo, DefenceTools.getDisplayRate()/*getCameraRate()*/);
						} else {
							callback("当前未选择任何布控任务，请先选择布控任务！");
						}
					}
				}
			}
		},
		/**
		 * 点击右上角眼睛时，发送请求，读取已设置过的算法规则列表数据
		 * @param obj 右上角眼睛的dom对象
		 */
		showEventTypeList: function (obj, callback) {
			//读取数据库，显示算法规则列表-非规则的详细设置页面
			var self = this, 
				data = {
					id: globalVar.defence.cameraData.id,
					total: true
				};

			model.getData("getAlarmTypeList", data, undefined, data.id).then(function(res){
				if (res.code === 200) {
					//点击右上角的眼睛，显示列表
					self.dealRuleListOnVideo(obj, res.data, callback);
				} else if (res.code === 500) {
					callback(res.data.message);
				} else {
					callback("获取事件信息异常！");
				}
			}, function(){
				callback("获取事件信息列表异常，请查看网络情况！");
			});
		},
		/**
		 * 点击右上角眼睛时，显示设置过的算法规则列表浮动层
		 * @param obj 右上角眼睛的dom对象
		 * @param data 从数据库读取的已设置过的算法规则数据
		 */
		dealRuleListOnVideo: function (obj, data, callback) {

			if (!DefenceTools.checkedPlayer(2)) {
				return callback("正在加载摄像机视频，请稍后...");
			}

			//格式化数据
			data = DefenceTools.formateData(data, "eye_event_list");
			if (!data.list || data.list.length === 0) {
				return callback("当前暂没有布防任务，请先添加布防任务！");
			}

			//扩展数据
			jQuery.extend(data, { "module": "see_rule_list"});
			// 返回到view层，显示结果
			callback(null, data);
		},
		/**
		 * 右上角眼睛，规则下拉列表的点击事件，在视频上叠加框线规则
		 * @param data - 参数
		 */
		showRuleOnVideo: function(data){
			var self = this;

			if (globalVar.defence.curSelectedRule === data.selectedRule) {
				//取消选中
				DefenceTools.clearSelectedRuleInfo();
			} else {
				//记录当前选中的规则，以备再次勾选
				globalVar.defence.curSelectedRule = parseInt(jQuery(data.obj).attr("event-type"));
				//解析数据并显示规则框线(由于ocx直接绘制在显示分辨率下，故不再进行摄像机分辨率转化)
				var cameraRate = DefenceTools.getDisplayRate();//getCameraRate();//不再通过截图获取，而是采用ocx的方法。
				//清除上一次绘制的框线
				globalVar.defence.videoPlayer.releaseAllImage(0);
				//关闭上以规则开启的定时器
				clearInterval(globalVar.defence.refreshCarOrPeopleTimer);
				globalVar.defence.preCarOrPeopleCount = 0;
				//在视频上绘制框线规则
				if (globalVar.defence.curSelectedRule === 131072 || globalVar.defence.curSelectedRule === 4096) {
					//如果当前显示的规则是人流统计或者车流统计，则启动定时器，刷新统计数据
					globalVar.defence.refreshCarOrPeopleTimer = setInterval(function () {
						var pointsArr = JSON.parse(data.PointsInfo);
						//查询数据库，对人流、车流部分进行统计查询
						self.GetCarOrPeopleNum(pointsArr, cameraRate, globalVar.defence.curSelectedRule);
					}, self.refreshCarOrPeopleCountInterval);
				} else {
					DefenceTools.ruleLineOpera.dealGraphicOnVideo(JSON.parse(data.PointsInfo), {
						width: cameraRate.width,
						height: cameraRate.height
					});
				}
			}
		},
		/**
		 * 查看人流、车流框线规则时，开启定时器，1秒读取一次后台统计数据(读取数据库)
		 * @param pointsArr 当前框线规则的坐标信息
		 * @param cameraRate 当前ocx的展现宽高（px）
		 * @param eventType 当前的算法规则（人流/车流）
		 */
		GetCarOrPeopleNum: function (pointsArr, cameraRate, eventType) {
			var cameraId = globalVar.defence.cameraData.id;
			//请求数据库
			model.getData("GetCarOrPeopleNum", {
				id: cameraId,
				eventType: eventType,
				curPageIndex: 1,
				pageSize: 1000
			}, undefined, cameraId).then(function(res){
				if (res.code === 200) {
					/**
					 * 考虑到请求有延迟，故当定时器关闭时最后一次发出的请求结果返回时仍然显示框线，造成流程不够清晰，这里进行判断
					 * 一旦定时器关闭，将不再显示框线
					 */
					if (globalVar.defence.curSelectedRule === -1) {
						return;
					}
					var resultArr = [], count = 0, firstCount = 0, secondCount = 0;
					if (res.data.defenceEvents.length > 0) {
						//获取方各个向上的数据
						firstCount = parseInt(res.data.defenceEvents[0].firstCount);
						secondCount = parseInt(res.data.defenceEvents[0].secondCount);
						//剔除掉-1的情况
						firstCount = (firstCount < 0) ? 0 : firstCount;
						secondCount = (secondCount < 0) ? 0 : secondCount;
						//项目组于2014-08-22确认，firstcount和secondcount是表示两个方向上的统计
						//由于当前不支持多框线规则处理，故统一为采用第一个框线规则的统计数据,均为两个方向上的和
						count = firstCount + secondCount;
					} else {
						count = 0;
					}
					//判断是否需要更新，因为有些请求会延时，如果异步后续回传的计数比当前值少，则忽略
					if (globalVar.defence.preCarOrPeopleCount >= count) {
						//如果当前值比获取的值大，继续画之前的
						resultArr.push(globalVar.defence.preCarOrPeopleCount);
					} else {
						//记录新值
						globalVar.defence.preCarOrPeopleCount = count;
						resultArr.push(count);
					}
					//更新规则数组，改变线的名字
					for (var i = 0; i < pointsArr.length; i++) {
						pointsArr[i].text = pointsArr[i].text + ",当前计数：" + resultArr[0];
					}
					//绘图(先清除)
					globalVar.defence.videoPlayer.releaseAllImage(0);
					DefenceTools.ruleLineOpera.dealGraphicOnVideo(pointsArr, {
						width: cameraRate.width,
						height: cameraRate.height
					});
				} else if (res.code === 500) {
					notify.error(res.data.message);
				} else {
					notify.error("获取统计信息异常！");
				}
			}, function() {
				notify.error("获取统计信息，请查看网络状况！");
			});
		}
	};
});
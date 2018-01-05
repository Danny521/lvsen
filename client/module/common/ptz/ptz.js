/*global cruiseCache:true*/
var cameraCache = new Hash();//为每个打开的视频,保留对应的云台参数.

var Camera = new Class({
	cameraId: null,
	cameraNo: null,
	cameraType: null,
	presets: '',
	presetsMap: new Hash(),
	autoCruise: '',
	timeCruise: '',
	cruisetype: 0,
	// 巡航分类	0自动巡航	1时间段巡航
	status: 0,
	// 巡航状态	0没开启	1开启	2等待
	sortNo: 0,//预置位列表sortNo最大 + 1, 是下次添加预置位的序号,预置位是通过序号排序的.
	scan: 1,
	// 云台自动扫描 1初始未扫描 2扫描状态
	lockStatus: 0, //0未锁 1锁定
	monopolyStatus: 1, //1未独占 0独占
	wipe: 0,
	// 云台雨刷 0初始化 关  1开启
	light: 0
	// 云台灯光 0初始化 关  1开启
});
//云台面板,选项卡高亮li 默认有一个li是高亮的,球机是'云台控制',枪机是'色彩调节'
var isActiveLi = jQuery('#ptzCamera').find('.header li:eq(0)');

var gPtz = function() {

	var eventListener = new Events();

	return {
		set: {
			cameraId: null,
			cameraNo: null,
			cameraType: null
		},

		//隐藏云台 不需要用到的页面调用
		hidePtz: function(){
			jQuery('#ptzCamera').hide().addClass('ptz-hidden');
		},
		//显示云台
		showPtz: function(){
			jQuery('#ptzCamera').show().removeClass('active ptz-hidden');
		},

		//聚焦, 鼠标聚焦不同通道时调用
		setFocus: function(params) {
			this.set.cameraId = params.cameraId;
			this.set.cameraNo = params.cameraNo;
			this.set.cameraType = params.cameraType;
		},

		//打开视频时调用云台用 params{cameraId:摄像机id,cameraNo:摄像机路径,cameraType:摄像机类型,cameraChannel:当前播放的channel}
		setParams: function(params) {
			if (cameraCache.has(params.cameraId)) {//已打开过的视频
				this.setFocus(params);
			} else {//未打开过的视频
				var options = new Camera();
				options.cameraId = params.cameraId;
				options = Object.merge({}, options, params);

				this.set = params;

				cameraCache.set(params.cameraId, options);//将当前打开视频的云台摄像机等参数保存

				if(params.cameraType === 0){ //枪机不获取预置位
					return;
				}

				this.getPresets(params.cameraId);

				this.getCruise(options.cruisetype);

				var self = this;
				eventListener.addEvent('success', function(data) {//添加预置位成功后,重新获取预置位列表
					self.getPresets(data.paramsId, data.flag);
				});

				eventListener.addEvent('save', function(data) {//设置巡航后保存,重新获取巡航
					self.getCruise(data.cruisetype, data.flag);
				});

				eventListener.addEvent('change', function(data) {//删除预置位或修改预置位名后,重新获取巡航.
					self.getCruise(data.cruisetype, data.flag);
				});
			}
		},
		getParams: function() {
			return this.set;
		},
		//获取预置位编号
		getSortNo: function(cameraId) {
			var camera = cameraCache.get(cameraId);
			if (camera) {
				return camera.sortNo;
			}
		},
		//获取li的index
		getLiIndex: function(lis) {
			for (var i = 0; i < lis.length; i++) {
				jQuery(lis[i]).find('.num').html(i + 1);
			}
		},
		//预置位排序 type=0升序 type=1降序; 预置位排序功能不实现了,所以现在是默认升序排列.
		sortPreset: function(cameraId, type) {
			//var camera = cameraCache.get(cameraId);
			var self = this,
				data = {
					"cameraId": cameraId,
					"type": type
				};
			jQuery.when(gPTZService.getOrderedPresets(data), Toolkit.loadTempl('/module/common/ptz/presets.template.html')).done(function(res, templateSrc) {
				res = res[0];
				if (templateSrc instanceof Array) {
					templateSrc = templateSrc[0];
				}

				if (res && res.code === 200) {
					var template = Handlebars.compile(templateSrc);
					jQuery("#ptzCamera .content [data-tab=preset] ul").html(template(res.data));
					self.getLiIndex(jQuery('#ptzCamera .content [data-tab=preset] ul li'));
				} else {
					notify.warn('获取预置位失败！');
				}
			});
		},
		//获取预置位
		getPresets: function(paramsId, flag) {
			var camera = cameraCache.get(paramsId),
				data = {
					cameraId: paramsId
				},
				success = function(res) {
					if (res && res.code === 200) {
						if (!res.data || !res.data.presets) {//没有添加任何预置位
							return;
						}

						camera.presets = res.data.presets;
						var presetCache = new Hash();

						for (var i = 0; i < res.data.presets.length; i++) {
							presetCache.set(res.data.presets[i].id, res.data.presets[i].name);

							if (res.data.presets[i].sortNo > camera.sortNo) {
								camera.sortNo = res.data.presets[i].sortNo;
							}
						}
						camera.sortNo = camera.sortNo + 1;//存储预置位最大序号+1,此为下个预置位的序号
						camera.presetsMap = presetCache;//存储预置位列表,用于重命名验证

						if (flag === 'create') {
							jQuery('#ptzCamera .header [data-tab=preset]').trigger('click');
						}

						return res.data.presets;
					}
				};
			gPTZService.getPresets(data, success);
		},
		//修改预置位名
		updatePreset: function(cameraId, elem, inputVal, originalVal, id) {
			var camera = cameraCache.get(cameraId),
				type = camera.cruisetype,
				data = {
					presetId: id,
					presetName: inputVal
				},
				success = function(res) {
					if (res && res.code === 200) {
						camera.presetsMap.set(id, inputVal);
						elem.html(inputVal);
						elem.attr('title', inputVal);

						eventListener.fireEvent('change', {
							'cruisetype': type,
							'flag': 'change'
						});
						notify.success('修改预置位名成功！');
					} else if(res && res.code === 400){
						notify.warn(res.data.message);
					}else {
						notify.warn('修改预置位名失败！');
						elem.html(originalVal);
					}
				};

			gPTZService.modifyPreset(data, success);
		},
		//删除预置位
		removePreset: function(presetId, li) {
			var self = this;
			var camera = cameraCache.get(this.set.cameraId);
			var type = camera.cruisetype;
			var data = {
				presetId: presetId,
				cameraId: camera.cameraId
			};
			var success = function(res) {
				if (res && res.code === 200) {
					li.fadeOut(function() {
						li.remove();
					});
					self.getLiIndex(li.siblings());
					camera.presetsMap.erase(presetId);
					notify.success('删除成功!');
					eventListener.fireEvent('change', {
						'cruisetype': type,
						'flag': 'change'
					});
				} else if(res && res.code === 400){
					notify.warn(res.data.message);
				}
			};

			gPTZService.deletePreset(data, success);
		},
		//调用预置位
		callPreset: function(params) {
			var self = this,
				data = {
					cameraId: params.cameraId,
					cameraNo: params.cameraNo,
					presetId: params.presetId
				},
				success = function(res) {
					if(res && res.code === 200){

					}else if(res && res.code === 400){
						notify.warn(res.data.message);
					}else{
						notify.warn('调用预置位失败！');
					}
				};

			return gPTZService.applyPreset(data, success);
		},
		//获取巡航
		getCruise: function(cruisetype, flag) {
			var camera = cameraCache.get(this.set.cameraId),
				autoCruiseData = {
					"cameraId": camera.cameraId,
					"type": 0
				},
				periodCruiseData = {
					"cameraId": camera.cameraId,
					"type": 1
				};


			jQuery.when(gPTZService.getCruise(autoCruiseData), gPTZService.getCruise(periodCruiseData)).done(function(res1, res2) {
				res1 = res1[0];
				res2 = res2[0];

				if (res1 && res1.code === 200 && res2 && res2.code === 200) {
					if (!res1.data || !! res1.data.message) {
						camera.autoCruise = -1;
					} else {
						camera.autoCruise = res1.data.autoCruise;
					}

					if (!res2.data || !! res2.data.message) {
						camera.timeCruise = -1;
					} else {
						camera.timeCruise = res2.data.timeCruise;
					}

					camera.cruisetype = cruisetype;
					cameraCache.set(camera.cameraId, camera);

					if (flag === 'save') {
						jQuery('#ptzCamera .header [data-tab=cruise]').trigger('click');
					}

				} else {
					notify.warn('获取巡航失败！');
				}

			});
		},
		//保存巡航
		saveCruise: function(cruisetype, cruise) {
			var camera = cameraCache.get(this.set.cameraId),
				data = {
					cameraId: camera.cameraId,
					type: cruisetype,
					cruise: JSON.stringify(cruise)
				},
				success = function(res) {
					if (res && res.code === 200) {
						jQuery('#ptzCamera').show();
						jQuery('#setCruise').hide();
						camera.cruisetype = cruisetype;
						eventListener.fireEvent('save', {
							'cruisetype': cruisetype,
							'flag': 'save'
						});

					}else if(res && res.code === 400){
						notify.warn(res.data.message);
					}else {
						notify.warn('巡航设置失败！');
					}
				};

			gPTZService.addCruise(data, success);
		},

		//云台控制
		/*
			params {cameraId:为摄像机标识,cameraNo:为摄像机路径,cmd:为发送命令的数值,param:具体参数}
			cmd: 0右 1右上 2上 3左上 4左 5左下 6下 7右下  param:速度0-15
			cmd: 8自动扫描 param:99	
			cmd: 10光圈 11焦距 12聚焦 param:-1增大  1减小(注意-1为增大,+1为减小)
			cmd: 17雨刷开关 18灯光电源 param:1开 0关		
		*/
		setPTZDir: function(params) {
			//camera = cameraCache.get(params.cameraId),
			var data = {
					cameraId: params.cameraId,
					cameraNo: params.cameraNo,
					cmd: params.cmd,
					param: params.param,
					channelId: params.playingChannelId
				},
				success = function(res) {
					if (res && res.code === 200) {
						if (params.cmd === 8) {							
							cameraCache.get(params.cameraId).scan = 2;
						}
					} else if(res && res.code === 400){
						notify.warn(res.data.message);
					} else {}
				};

			return gPTZService.setDirection(data, success);
		},

		//云台停止
		/*
			params {cameraId:为摄像机标识,cameraNo:为摄像机编号,cmd:为发送命令的数值}
			cmd: 0右 1右上 2上 3左上 4左 5左下 6下 7右下  param:速度0
			cmd: 9扫描停止 param:0
			cmd: 10光圈 11焦距 12聚焦 param:0停止
		*/
		stopPTZDir: function(params) {
			//var camera = cameraCache.get(params.cameraId),			
			var	data = {
					cameraId: params.cameraId,
					cameraNo: params.cameraNo,
					cmd: params.cmd,
					param: 0,
					channelId: params.playingChannelId
				},
				success = function(res) {
					if (res && res.code === 200) {
						if ( !! params.scan) {
							cameraCache.get(params.cameraId).scan = 1;
						}
					}  else if(res && res.code === 400){
						notify.warn(res.data.message);
					}else {}
				};

			gPTZService.setDirection(data, success);
		},
		//云台控制--入网检测使用(不需要传递cameraid和channelid)
		/*
			params {cameraId:为摄像机标识,cameraNo:为摄像机路径,cmd:为发送命令的数值,param:具体参数}
			cmd: 0右 1右上 2上 3左上 4左 5左下 6下 7右下  param:速度0-15
			cmd: 8自动扫描 param:99	
			cmd: 10光圈 11焦距 12聚焦 param:-1增大  1减小(注意-1为增大,+1为减小)
			cmd: 17雨刷开关 18灯光电源 param:1开 0关		
		*/
		setPTZDir_Direct: function(params) {
			//camera = cameraCache.get(params.cameraId),
			var data = {
					cameraNo: params.cameraNo,
					cmd: params.cmd,
					param: params.param
				},
				success = function(res) {
					if (res && res.code === 200) {
						if (params.cmd === 8) {							
							cameraCache.get(params.cameraId).scan = 2;
						}
					} else if(res && res.code === 400){
						notify.warn(res.data.message);
					} else {}
				};

			return gPTZService.setDirection_Direct(data, success);
		},

		//云台停止--入网检测使用(不需要传递cameraid和channelid)
		/*
			params {cameraId:为摄像机标识,cameraNo:为摄像机编号,cmd:为发送命令的数值}
			cmd: 0右 1右上 2上 3左上 4左 5左下 6下 7右下  param:速度0
			cmd: 9扫描停止 param:0
			cmd: 10光圈 11焦距 12聚焦 param:0停止
		*/
		stopPTZDir_Direct: function(params) {
			//var camera = cameraCache.get(params.cameraId),			
			var	data = {
					cameraNo: params.cameraNo,
					cmd: params.cmd,
					param: 0
				},
				success = function(res) {
					if (res && res.code === 200) {
						if ( !! params.scan) {
							cameraCache.get(params.cameraId).scan = 1;
						}
					}  else if(res && res.code === 400){
						notify.warn(res.data.message);
					}else {}
				};

			gPTZService.setDirection_Direct(data, success);
		},

		//创建预置位 params{cameraId:摄像机id, cameraNo:摄像机路径 ,name:预置位名,sortNo:预置位序号,stopTime:预置位停留时间,binaryImageStream图片的二进制字符串}
		createPreset: function(params) {			
			var data = {
				cameraId: params.cameraId,
				cameraNo: params.cameraNo,
				name: params.name,
				sortNo: params.sortNo,
				stopTime: 10,
				binaryImageStream: encodeURI(params.picInfo)
			},
				success = function(res) {
					if (res && res.code === 200) {
						notify.success("添加预置位成功！");
						jQuery('#ptzCamera .header [data-tab=preset]').trigger('click');
						eventListener.fireEvent('success', {
							paramsId: params.cameraId,
							flag: 'create'
						});						
					}  else if(res && res.code === 400){
						notify.warn(res.data.message);
					} else {
						notify.warn("添加预置位失败！");
					}
				};

			gPTZService.addPreset(data, success);
		},

		//得到云台是否锁定状态 params{cameraId:摄像机id,cameraNo:摄像机编号} 返回值0未锁定 1锁定
		getPtzStatus: function(params) {			
			var data = {
				cameraId: params.cameraId,
				cameraNo: params.cameraNo
			},
				success = function(res) {
					if (res && res.code === 200) {
						cameraCache.get(params.cameraId).lockStatus = parseInt(res.data.lock);
						cameraCache.get(params.cameraId).lockUname = res.data.userName;
						return res.data.lock;
					} else {
						
					}
				};

			gPTZService.checkLock(data, success);
		},

		//云台锁定 params{cameraId:摄像机id, cameraNo:路径, lockTime:锁定时间}
		lock: function(params) {			
			var data = {
				cameraId: params.cameraId,
				cameraNo: params.cameraNo,
				lockTime: params.lockTime
			},
				success = function(res) {
					console.log("res="+JSON.stringify(res));
					if (res && res.code === 200) {
						if (params.lockTime === 0) {
							notify.success('云台解锁成功！');
							return 2;
						} else {
							notify.success('云台锁定成功！');
							return 1;
						}
					} else if(res && res.code === 400){
						notify.warn(res.data.message);
					} else {
						if (params.lockTime === 0) {
							notify.warn('云台解锁失败！');
							return -2;
						} else {
							notify.warn('云台锁定失败！');
							return -1;
						}
					}
				};

			gPTZService.lock(data, success);
		},

		//获取云台是否独占 params{cameraId:摄像机id} 返回值0独占  1未独占
		getPtzMonopolyStatus: function(params){
			var data = {
				cameraId: params.cameraId
			},
				success = function(res) {
					if (res && res.code === 200) {
						cameraCache.get(params.cameraId).monopolyStatus = parseInt(res.data.status);
						cameraCache.get(params.cameraId).monopolyUname = res.data.userName;
						cameraCache.get(params.cameraId).monopolyUid = res.data.userId;
						return res.data.status;
					} else {
						cameraCache.get(params.cameraId).monopolyStatus = -1;						
					}
				};

			gPTZService.checkMonopoly(data, success);

		},

		//云台独占 params{cameraId:摄像机id}
		ptzMonopoly: function(params){
			var data = {
				cameraId: params.cameraId
			},
				success = function(res) {
					if(res && res.data && res.data.message){
						if(res.code === 200){
							notify.success(res.data.message);							
						} else {
							notify.warn(res.data.message);
						}
					}
				};
			gPTZService.monopoly(data, success);			
		}	
	};

}();

var gPTZService = (function() {
	var serviceHost = "/service",
		serviceContext = "ptz";

	var ACTIONS_URL = {
		SET_DIRECTION: serviceHost + "/" + serviceContext + "/" + "set_dir",
		SET_DIRECTION_DIRECT: serviceHost + "/" + serviceContext + "/" + "set_dir_direct",

		ADD_PRESET: serviceHost + "/" + serviceContext + "/" + "create_preset",
		DELETE_PRESET: serviceHost + "/" + serviceContext + "/" + "remove_preset",
		GET_PRESETS: serviceHost + "/" + serviceContext + "/" + "get_presets",
		GET_ORDERED_PRESETS: serviceHost + "/" + serviceContext + "/" + "sort_presets",
		MODIFY_PRESET: serviceHost + "/" + serviceContext + "/" + "update_preset",
		APPLY_PRESET: serviceHost + "/" + serviceContext + "/" + "call_preset",

		GET_CRUISE: serviceHost + "/" + serviceContext + "/" + "get_cruise",
		ADD_CRUISE: serviceHost + "/" + serviceContext + "/" + "save_cruise",

		LOCK: serviceHost + "/" + serviceContext + "/" + "lock",
		CHECK_LOCK: serviceHost + "/" + serviceContext + "/" + "ptz_status",
		CHECK_MONOPOLY: serviceHost + "/" + serviceContext + "/" + "ptz_monopoly_status",
		MONOPOLY: serviceHost + "/" + serviceContext + "/" + "ptz_monopoly"
	};

	var callService = function(actionUrl, requestType, data, success, error) {
		//console.log("Before Sending ptzService request, actionURL is:" + actionUrl + ", data=" + JSON.stringify(data));
		return jQuery.ajax({
			url: actionUrl,
			type: requestType,
			data: data,
			success: success,
			error: error,
			dataType: "json",
			cache: false
		});
	};

	var callGetService = function(actionUrl, data, success, error) {
		return callService(actionUrl, "get", data, success, error);
	};

	var callPostService = function(actionUrl, data, success, error) {
		return callService(actionUrl, "post", data, success, error);
	};

	return {
		setDirection: function(data, success, error) {
			/*data = {
			"cameraId": 37,
			"cameraNo": "av/VS800编码器_183/1",
			"cmd": 0, //[0,19]
			"speed": "8" //[1,15]
			}*/
			return callPostService(ACTIONS_URL.SET_DIRECTION, data, success, error);
		},

		setDirection_Direct: function(data, success, error) {
			/*data = {
			"cameraId": 37,
			"cameraNo": "av/VS800编码器_183/1",
			"cmd": 0, //[0,19]
			"speed": "8" //[1,15]
			}*/
			return callPostService(ACTIONS_URL.SET_DIRECTION_DIRECT, data, success, error);
		},

		addPreset: function(data, success, error) {
			/*data = {
			"cameraId": 37,
			"cameraNo": "av/VS800编码器_183/1",
			"name": "brantTest",
			"sortNo": 11,
			"stopTime": 10 // 这个参数目前没啥意思，默认传10
			}*/
			return callPostService(ACTIONS_URL.ADD_PRESET, data, success, error);
		},

		deletePreset: function(data, success, error) {
			/*data = {
			"presetId": 492
			}*/
			return callPostService(ACTIONS_URL.DELETE_PRESET, data, success, error);
		},

		getPresets: function(data, success, error) {
			/*data = {
			"cameraId": 37
			}*/
			return callGetService(ACTIONS_URL.GET_PRESETS, data, success, error);
		},

		getOrderedPresets: function(data, success, error) {
			/*
			获取升序排列的预置位
			data = {
				cameraId": 37,
				"type": 0
			}*/

			/*
			获取降序排列的预置位
			data = {
				cameraId": 37,
				"type": 1
			}*/
			return callGetService(ACTIONS_URL.GET_ORDERED_PRESETS, data, success, error);
		},

		modifyPreset: function(data, success, error) {
			/*data = {
			"presetId": 472,
			"presetName": "testPresetName"
			}*/
			return callPostService(ACTIONS_URL.MODIFY_PRESET, data, success, error);
		},

		applyPreset: function(data, success, error) {
			/*data = {
			"cameraId": 37,
			"cameraNo": "av/VS800编码器_183/1",
			"presetId": 481
			}*/
			return callPostService(ACTIONS_URL.APPLY_PRESET, data, success, error);
		},

		getCruise: function(data, success, error) {
			/*
			获取自动巡航
			data = {
				cameraId": 37,
				"type": 0
			}*/

			/*
			获取时间段巡航
			data = {
				cameraId": 37,
				"type": 1
			}*/
			return callGetService(ACTIONS_URL.GET_CRUISE, data, success, error);
		},

		addCruise: function(data, success, error) {
			/*
			自动巡航数据格式
			data = {
			"cameraId": 37,
			"type": 0,
			"cruise": '{"startTime":1389715500000,"endTime":1389801300000,"preset":[{"id":826,"sortNo":1,"presetId":"443","presetName":"x","internalTime":"3"},{"id":827,"sortNo":2,"presetId":"472","presetName":"a","internalTime":"3"},{"id":828,"sortNo":3,"presetId":"443","presetName":"x","internalTime":"5"}],"presetId":"489"}'
			}*/

			/*
			时间段巡航数据格式
			data = {
			"cameraId": 37,
			"type": 1,
			"cruise": '{"preset":[{"id":783,"sortNo":1,"presetId":"472","presetName":"a","startTime":1389765600000,"endTime":1389765900000},{"id":784,"sortNo":2,"presetId":"481","presetName":"yy","startTime":1389766500000,"endTime":1389766800000},{"id":785,"sortNo":3,"presetId":"489","presetName":"ffff","startTime":1389766800000,"endTime":1389767100000}],"presetId":"481"}'
			}*/
			return callPostService(ACTIONS_URL.ADD_CRUISE, data, success, error);
		},

		lock: function(data, success, error) {
			/*
			锁定监视器1000秒
			data = {
			"cameraId": 37,
			"cameraNo": "av/VS800编码器_183/1",
			"lockTime": 1000
			}*/

			/*
			解锁摄像机
			data = {
			"cameraId": 37,
			"cameraNo": "av/VS800编码器_183/1",
			"lockTime": 0
			}*/
			return callPostService(ACTIONS_URL.LOCK, data, success, error);
		},

		checkLock: function(data, success, error) {
			/*data = {
			"cameraId": 37,
			"cameraNo": "av/VS800编码器_183/1"
			}*/
			return callGetService(ACTIONS_URL.CHECK_LOCK, data, success, error);
		},
		monopoly: function(data, success ,error){
			return callPostService(ACTIONS_URL.MONOPOLY, data, success, error);
		},

		checkMonopoly: function(data, success ,error){
			return callGetService(ACTIONS_URL.CHECK_MONOPOLY, data, success, error);
		}
	};
})();
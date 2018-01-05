define(['/module/common/popLayer/js/popImg.js', '../js/model/preventcontrol-model.js', 'base.self'], function(popImg, alarmModel) {
	return {
		//存储ocx对象
		videoPlayer: null,
		//存储布控任务数据
		contrlTask: {},
		//视频窗口索引
		currIndex: -1,
		AlarmMgrOptions: {
			//地图对象
			PVAMap: null,
			//逻辑对象
			AlarmLogical: null,
			//左侧树的逻辑对象
			RuleLogical: null,
			//模板对象
			template: null,
			//初始化web请求对象
			callServiceObj: null,
			//当前的报警数据(每次刷新都重新赋值)
			curAlarmDataList: {},
			//记录之前所处的模式(默认报警列表模式)
			curPageMode: "alarm-list-mode",
			//图层
			layers: {
				//报警点位图层
				alarmCameraLayer: null,
				//地图上播放视频的图层
				cameraVideoLayer: null
			},
			//窗口
			infowindow: null,
			//报警列表的定时刷新信息
			refreshAlarmListInfo: {
				timer: null, //定时器
				timeSpan: 1000 * 10, //10秒钟刷新一次
				isClearRefreshTimer: false //标记是否清除了刷新定时器，默认为否
			},
		},
		videoPlayerSigle: null,
		//记录当前是哪个报警选择
		curAlarmMode: "alarm-all-mode",
		curInfoWinIsMap: true,
		//历史调阅播放器
		videoPcurAlarmModeigle: null,
		isMouseOverPubDiv: false,
		//当前活动摄像机数据
		currentCameraData: null,
		//ocx层
		ocxDom: null,
		//暂时储存soket.io对象
		messageCache: null,
		//布防布控图标
		vedioSymbols: {
			//布防摄像机
			alarmMarkerDefence: function() {
				return new NPMapLib.Symbols.Icon("/module/protection-monitor/newStructAlarmmgr/images/map-marker-alarm-defence.png", new NPMapLib.Geometry.Size(30, 30));
			},
			//布控摄像机
			alarmMarkerCtr: function() {
				return new NPMapLib.Symbols.Icon("/module/protection-monitor/newStructAlarmmgr/images/map-marker-alarm-ctr.png", new NPMapLib.Geometry.Size(30, 30));
			},
			//布防布控摄像机
			alarmMarkerAll: function() {
				return new NPMapLib.Symbols.Icon("/module/protection-monitor/newStructAlarmmgr/images/map-marker-alarm-all.png", new NPMapLib.Geometry.Size(30, 30));
			}
		},
		//图标
		symbols: {
			//正常情况下的报警图标
			alarmMarkerNormal: function() {
				return new NPMapLib.Symbols.Icon("/module/protection-monitor/newStructAlarmmgr/images/map-marker-alarm-normal.png", new NPMapLib.Geometry.Size(39, 38));
			},
			//点击或者鼠标移动时的报警图标
			alarmMarkerActive: function() {
				return new NPMapLib.Symbols.Icon("/module/protection-monitor/newStructAlarmmgr/images/map-marker-alarm-active.png", new NPMapLib.Geometry.Size(39, 38));
			},
			//标注
			markerSymbol: function() {
				return new NPMapLib.Symbols.Icon("/module/protection-monitor/newStructAlarmmgr/images/map-marker-pointer.png", new NPMapLib.Geometry.Size(13, 21));
			}
		},
		currentCameraMarker: null,
		compiler: '',
		commonObj: {},
		curScreenCameraIds: [null, null, null, null], //存储当前ocx播放的摄像机id数组，以便筛选报警
		currentAlarmListCache: [], //存储当前消息推送
		currNowAlarmList: [],
		currIndexcId: null,
		//布控报警图片预览在相对屏幕在等比例大小
		protectImgPreviewRate: {
			widthRate: 3 / 5,
			heightRate: 3 / 4
		},
		curMapCameraIds: [],
		curMapCtrTaskList: [],
		isChange: true,
		isPauseTaskPush: false,
		//实时滚动信息
		scrollInfo: {
			scrollList:[],//缓存需要滚动的报警列表
			container: null,    //报警信息滚动的容器
			data: null,         //报警信息显示栏
			dataW: 0,           //报警信息宽度
			containerW: 0,      //容器宽度
			curOffsetLeft: 0,   //当前报警信息距离左侧的位移
			containerLeft: 0,   //容器左侧的绝对位移
			defaultOffsetLeft: 0,   //报警信息距离左侧的默认位移
			timeSpan: 100,  //定时间隔
			dis: 5, //定时器移动的单位距离
			timerObj: null,  //滚动定时器对象
			isFirstCall: true   //标记当前是否是第一次请求滚动，后续滚动将不再初始化位移
		},
		/**
		 * 加载模板通用函数
		 * @param url - 模板地址url
		 * @param callbackSuccess - 模板加载成功后的执行函数
		 * @param callbackError - 模板加载失败后的执行函数
		 */
		loadTemplate: function(url, callbackSuccess, callbackError) {
			var compiler = null;
			//加载模板
			jQuery.when(Toolkit.loadTempl(url)).done(function(timeTemplate) {
				if (timeTemplate instanceof Array) {
					timeTemplate = timeTemplate[0];
				}
				//模板加载成功
				compiler = Handlebars.compile(timeTemplate);
				//成功的回调函数
				if (callbackSuccess && typeof callbackSuccess === "function") {
					callbackSuccess(compiler);
				}
			}).fail(function() {
				//错误的函数
				if (callbackError && typeof callbackError === "function") {
					callbackError();
				}
			});
		},
		/**
		 * 对报警信息列表部分的弹出框进行最大限制
		 * @author chengyao
		 * @date   2014-10-28
		 * @param  {[img对象]}   imgObj
		 * @param  {[百分比]}   width  [宽度的缩放比例]
		 * @param  {[百分比]}   height [高度的缩放比例]
		 */
		maxImgLimit: function(imgObj, width, height) {
			var desWidth = imgObj ? 0 : imgObj.width(),
				desHeight = imgObj ? 0 : imgObj.height(),
				maxHeight = document.documentElement.clientHeight * height,
				maxWidth = document.documentElement.clientWidth * width;
			if (desWidth >= maxWidth || desWidth === 0) {
				desWidth = maxWidth;
			}
			if (desHeight >= maxHeight || desHeight === 0) {
				desHeight = maxHeight;
			}
			return {
				width: desWidth,
				height: desHeight
			};
		},
		/**
		 * 用户确认框
		 * @param msg-用户确认时提示的信息
		 * @param callback-确认后回调的函数
		 */
		confirmDialog: function(msg, callback, closureCallBack) {
			new ConfirmDialog({
				title: '提示',
				confirmText: '确定',
				message: msg,
				callback: function() {
					if (callback && typeof callback === "function") {
						callback();
					}
				},
				closure: function() {
					if (closureCallBack && typeof closureCallBack === "function") {
						closureCallBack();
					}
				}
			});
		},
		/**
		 * 根据规则id获取规则名称
		 * @param ruleid 规则id
		 */
		getRuleName: function(ruleid) {
			switch (ruleid) {
				case 4096:
					return "人数统计";
				case 2:
					return "绊线检测";
				case 262144:
					return "出门检测";
				case 4:
					return "区域入侵";
				case 256:
					return "非法停车";
				case 32:
					return "徘徊检测";
				case 64:
					return "物品遗留";
				case 128:
					return "物品丢失";
				case 2048:
					return "人群聚集";
				case 65536:
					return "离岗检测";
				case 1048576:
					return "打架检测";
				case 4194304:
					return "拥堵检测";
				case 8388608:
					return "可疑尾随检测";
				case 1024:
					return "奔跑检测";
				case 131072:
					return "车流统计";
				case 16777216:
					return "烟火检测";
				case 8192:
					return "车牌识别";
				case 524288:
					return "人脸检测";
				case 33554432:
					return "手动报警";
				case 134217728:
					return "人员布控";
			}
		},
		/**
		 * [PreventTaskPaush 判断是否有报警正在处理中，如果有，暂停推送数据]
		 * @param {[type]} flag [description]
		 */
		PreventTaskPaush: function(flag) {
			this.isPauseTaskPush = flag || false;
			var cutArry = [];
			jQuery(".scrollbar-panel").addClass("loading");
			if (this.curAlarmMode === "alarm-all-mode" && !this.isPauseTaskPush) {
				if (this.currentAlarmListCache && this.currentAlarmListCache.length >= 20) {
					cutArry = this.currentAlarmListCache.slice(-20);
				} else {
					cutArry = this.currentAlarmListCache;
				}

			}
			if (this.curAlarmMode === "alarm-now-mode" && !this.isPauseTaskPush) {
				if (this.currNowAlarmList && this.currNowAlarmList.length >= 20) {
					cutArry = this.currNowAlarmList.slice(-20);
				} else {
					cutArry = this.currNowAlarmList;
				}
			}
			jQuery(".content-alarms-list").find("p.style-text-info").siblings().remove();
			for (var i = cutArry.length - 1; i >= 0; i--) {
				jQuery(".content-alarms-list").find("p.style-text-info").hide().before(this.compiler({
					alarmevent: true,
					alarms: cutArry[i].content
				}));
				jQuery(".scrollbar-panel").removeClass("loading");
			}
		},
		/**
		 * [sliceFaceImg 取得图片路径]
		 * @param  {[type]} imgPath [description]
		 * @return {[type]}         [description]
		 */
		sliceFaceImg: function(imgPath) {
			if (imgPath.indexOf("/img/") > -1) {
				var strArr = imgPath.substr(imgPath.indexOf("/defence_img"), imgPath.length);
			} else {
				return imgPath;
			}

			return strArr;
		},
		/**新增对接李瑞霞查看图片接口,使用统一查看大图接口**/
		histNewimplent: function(params, callback) {
			var self = this,
				imgTime = parseInt(params.imgTime),
				faceImg = self.sliceFaceImg(params.faceImg),
				index = params.index || 0,
				imgName = params.imgName;
			alarmModel.ajaxEvents.getBase64Url({
				filePath: faceImg
			}, function(res) {
				if (res.code === 200 && typeof res.data === "string") {
					var base64 = res.data;
					var imgData = {
		                baseInfo: {
		                    filePath: "/img" + faceImg,// 图片路径
		                    storageTime: imgTime, // 创建时间
		                },
		                operatorOptions: {
		                	downloadUrl: "/service/storage/download?filePath=" + faceImg + "&isBucket=false", // 下载地址
		                	saveToCloudbox: { // 保存到云空间
		                		fileName: imgName,
								filePath: base64.replace(/\r|\n/g, ""),
								catchTime: imgTime
		                    }
		                },
		                callback: callback
		            };
		            popImg.initial(imgData);
				} else if (res.code === 500) {
					notify.error("获取图片信息失败！")
					return;

				}
			}, function(error) {
				notify.error("获取图片信息失败！")
				return;
			});

		},

	};



})

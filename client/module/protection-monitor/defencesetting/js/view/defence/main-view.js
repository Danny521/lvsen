/**
 * 布防任务 总view区，包括上一步、下一步页面切换展示
 */
define([
	// 布防任务的handlebar助手
	"/module/protection-monitor/defencesetting/js/view/defence/helper.js",
	// 布防任务第一步，选择摄像机。
	"/module/protection-monitor/defencesetting/js/view/defence/first-view.js",
	// 布防任务第二步，选择算法。这里之所以加入第二步，是因为有可能是编辑进来的，直接到第二步
	"/module/protection-monitor/defencesetting/js/view/defence/second-view.js",
	// 布防任务设置model层
	"/module/protection-monitor/defencesetting/js/model/defence-model.js",
	// 全局变量
	'/module/protection-monitor/defencesetting/js/global-var.js',
	// 地图初始化controller模块
	'/module/protection-monitor/defencesetting/js/controller/defence/first-pva-map-controller.js',
	"/module/protection-monitor/defencesetting/js/controller/defence/defence-linkage-control.js",
	// 事件总线中事件的描述
	"/module/protection-monitor/defencesetting/js/controller/defence/event-handler.js"
], function(helper, firstStepView, secondStepView, model, globalVar, pvaMapController,linkageControl) {
	return {
		/**
		 * [options 参数列表]
		 * @type {Object}
		 */
		options: {
			// 模板列表
			templateMap: {}
		},
		/**
		 * [init 初始化函数]
		 * @param  {[type]} options [参数列表 可能包括 摄像机id、任务id、算法类型]
		 * @return {[type]}         [description]
		 */
		init: function(options) {
			var self = this;
			// 初始化参数
			self.setOptions(options);
			// 初始化页面主体框架
			self.initPage();
		},
		/**
		 * [setOptions 合并参数列表]
		 * @param {[type]} options [description]
		 */
		setOptions: function(options) {
			var self = this;
			jQuery.extend(self.options, options);
		},
		/**
		 * [initPage 初始化页面]
		 * @return {[type]} [description]
		 */
		initPage: function() {
			var self = this;
			// 加载主体框架模板列表
			self.loadTemplate("defence-main-template", function(err, temp) {

				if (err) {
					return notify.error(err);
				}
				// 注册handlebar助手
				helper();
				jQuery("body").append(temp());
				self.resizeDefenceWin();
				self.bindEvent();
				// 如果没有摄像机id，则加载第一步，有的话加载第二步
				/**
				 * 这里需要做下说明。此处是布防任务设置的入口，
				 * 如果参数里没有摄像机id，那么，为新建任务
				 * 如果参数里有摄像机id，并且没有算法id，为编辑当前摄像机
				 * 如果参数里有摄像机id，并且有算法id，为编辑当前摄像机的当前算法
				 */
				if (self.options.cameraId === undefined) {
					return firstStepView.init();
				}

				globalVar.defence.editCamera = true;
				self.getCameraInfo({
					cameraId: self.options.cameraId,
					taskId: self.options.taskId,
					evtype: self.options.evtype
				});
			});
		},
		/**
		 * [loadTemplate 加载页面模板]
		 * @param  {[type]}   tempName [模板名称]
		 * @param  {Function} callback [回调函数]
		 * @return {[type]}            [description]
		 */
		loadTemplate: function(tempName, callback) {
			var self = this,
				options = self.options;

			if (options.templateMap[tempName]) {
				return callback(null, options.templateMap[tempName]);
			}

			model.getTml(tempName)
			.then(function(temp) {
				options.templateMap[tempName] = Handlebars.compile(temp);
				callback(null, options.templateMap[tempName]);
			}, function() {
				callback("加载模板失败");
			});
		},
		/**
		 * [bindEvent 绑定页面事件]
		 * @return {[type]} [description]
		 */
		bindEvent: function() {
			var self = this;
			jQuery("#defence-setting-close").on("click", function() {
				if ("function" === typeof self.options.preClose) {
					self.options.preClose();
				}
				
				if(globalVar.defence.asignTimer){
					window.clearInterval(globalVar.defence.asignTimer);
				}
				// 清除地图
				pvaMapController.options.map && pvaMapController.options.map.destroyMap();
				// 重置地图变量
				self.resetMapController();
				// 重置全局变量
				self.resetGlobalVar();
				// 清除当前变量
				self.options = {
					templateMap: {}
				};
				//清除布防规则联动缓存
				linkageControl.resetElement();
				jQuery("#defence-setting-content").fadeOut('500', function() {
					jQuery(this).remove();
					if ("function" === typeof self.options.afterClose) {
						self.options.afterClose();
					}
				});
			});

			jQuery("#defence-setting-nav").find("a").on("click", function() {
				return false;
			})

			//窗口大小改变时，同时改变规则设置层的位置和大小
			jQuery(window).resize(function () {
				if (jQuery("#defence-setting-content").is(":visible")) {
					//显示规则设置层
					self.resizeDefenceWin();
				}
			});
		},
		/**
		 * 根据宿主的位置和大小显示布防规则设置层
		 */
		resizeDefenceWin: function () {
			var height = jQuery(window).height() - 30;
			var width = jQuery(window).width();
			// 一二级导航最小宽度1310 故这里作此处理
			width = width < 1310 ? 1310 : width;
			jQuery("#defence-setting-content").css({"width": width + "px", "height": height + "px"});
		},
		/**
		 * 获取摄像机的详细信息(布防入口用)
		 * @param paramsInfo - 参数信息
		 */
		getCameraInfo: function (paramsInfo) {
			var self = this;

			model.getData("getCameraInfoById", {
				cameraId: paramsInfo.cameraId
			}).then(function (res) {
				if (res.code === 200) {
					if (res.data.message === "成功！") {
						// 标记进入设置页面的状态
						if (self.options.evtype !== undefined) {
							globalVar.defence.editEvtype = true;
							globalVar.defence.curOperationPos = 1;
						}

						//扩展参数
						jQuery.extend(paramsInfo, res.data.data);
						paramsInfo.hdchannel = paramsInfo.hd_channel;
						paramsInfo.sdchannel = paramsInfo.sd_channel;
						paramsInfo.cstatus = paramsInfo.camera_status;
						paramsInfo.cameratype = paramsInfo.camera_type;
						globalVar.defence.cameraData = paramsInfo;
						
						// 加载第二步
						secondStepView.init(true, self.options.evtype)
					}
				} else if (res.code === 500) {
					notify.error(res.data.message);
				} else {
					notify.error("获取摄像机的详细信息失败！");
				}
			}, function () {
				notify.error("获取摄像机的详细信息失败，请查看网络状况！");
			});
		},
		/**
		 * [resetGlobalVar 关闭时，重置全局变量]
		 * @return {[type]} [description]
		 */
		resetGlobalVar: function() {
			globalVar.defence = {
				// 第一步 选择摄像机的数据缓存
				cameraData: null,
				// 第二步选择算法
				ruleInfo: {
					options: {
						curRuleId: "",      //当前待设置的算法id
						curRuleName: "",    //当前算法事件的名称
						curTaskId: "",      //如果当前算法有设置过，则存储当前算法规则对应的taskid
						curTaskStatus: -1,   //记录当前任务的状态(开启为1，关闭为0)
						curStreamSpeed: "",	//记录当前车流/人流速度
						curLinkOptions: [],	//记录当前联动规则
						modulename: "",
						moduleversion: ""
					},
					//时间模板对象
					timeTemplateObj: null,
					//当前算法参数信息（保存时用）
					curRuleParamInfo: null,
					//标记当前处于布防还是布控(默认是布防)
					isDefenceFlag: true,
					humInfo:{
						minSize: 50,    
						maxSize: 200,
					},
					//人脸布控的规则参数信息
					faceProtectInfo: {
						minSize: 60,    //最小人脸尺寸
						maxSize: 200,   //最大人脸尺寸
						pointsInfo: {    //人脸布控区域的坐标
							left: 0,
							top: 0,
							right: 0,
							bottom: 0
						},
						hasChange: false,   //当前参数是否有更改，如果有，则显示保存按钮
						containerObj: null, //标记当前所处任务的容器，用来操作对其内的规则显示
						data: null,  //当前任务的详细信息，保存时用
						isExpand: false //标记当前任务是否展开，眼睛查看时用
					},
					//屏蔽区域区域多边形数据
	        		shieldPolyData: [],
	        		//处理区域多边形数据
	       			procPolyData: []
				},
				// 第二步右侧视频播放对象
				videoPlayer: null,
				//判断是鼠标是否处于下拉列表浮动层中
				isMouseOverPubDiv: false,
				//当前显示的框线规则id
				curSelectedRule: -1,
				//刷新定时器（人流统计&车流统计框线规则查看时触发）
				refreshCarOrPeopleTimer: null,
				//车流人流计数器,记录上一次的值
				preCarOrPeopleCount: 0,
				//当前页面的位置，任务规则详细设置页面为1，否则为0
				curOperationPos: 0,
				// 初始化的时候 是否带了摄像机进入
				editCamera: false,
				// 初始化的时候，是否带了算法进入
				editEvtype: false
			}
		},
		/**
		 * [resetMapController 关闭面板时，重置地图变量]
		 * @return {[type]} [description]
		 */
		resetMapController: function() {
			pvaMapController.options = {
				//地图容器
				mapContainer: null,
				//地图对象
				map: null,
				//基础图层
				baseLayer: null,
				//卫星图层
				satelliteLayer: null,
				//测量工具
				measuretool: null,
				//鹰眼控件
				overviewctrl: null,
				//导航控件
				Navictrl: null,
				//版本控件
				versionCtrl: null,
				//比例尺控件
				scaleCtrl: null,
				//窗口
				infowindow: null,
				//是否全屏
				isFullscreen: false
			};
			//图层
			pvaMapController.layers = {
				//地图上播放视频的图层
				cameraVideoLayer: null
			};
			//当前活动的点位信息
			pvaMapController.currentCameraMarker = null;
			//标记当前信息窗的样式是否是点位点击模式，此时需要左右切换按钮
			pvaMapController.curInfoWinIsMap = true;
			//播放器对象
			pvaMapController.videoPlayerSigle = null;
			//资源图层
			pvaMapController.resourceLayers = {
				clusterResource: null,
				clusterResourceNum: 0
			};
			//是否已加载摄像机资源
			pvaMapController.isLoadedCameras = false;
			//鼠标悬浮到聚合图层上的摄像机时，打开摄像机视频的延时定时器
			pvaMapController.playVideoDelayTimer = null;
			//视频延时加载的时间间隔
			pvaMapController.delayTimerTimeSpan = 850;
			//当前鼠标移动过程中已经在播放的摄像机位置，为了避免重复加载
			pvaMapController.curPlayingVideoInfo = {
				x: 0,
				y: 0
			};
			//当前活动摄像机数据
			pvaMapController.currentCameraData = null;
		}
	};
})
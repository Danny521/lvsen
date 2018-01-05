/*global TvLayoutBase:true */
/**
 * [电视墙具体操作类]
 * @author wumengmeng
 * @date   2014-10-30
 * @param  {[type]}   $ [description]
 * @return {[type]}     [description]
 */
define([
	'/module/common/tvwall/js/models/tv-layout-detail-model.js',
	'/module/common/tvwall/js/views/tvwall-views.js',
	'permission',
	'ajaxModel',
	'ocxError',
	'/module/common/js/player2.js'
	/*'/module/inspect/dispatch/js/sidebar/plugin-moveDom.js'*/
], function(TvLayoutDetailModel, tvwallViews, permission, ajaxModel, ocxErrCode, player /*,moveDom*/) {
	function TvLayoutDetail() {
		this.initialize(this.options);
		this.cTypeCache = null;
		this.videoPlayerSigle = null;
	}
	/**
	 * [prototype 操作类定义(原型链继承)]
	 * @type {TvLayoutBaseModel}
	 */
	TvLayoutDetail.prototype = new TvLayoutDetailModel();
	/**
	 * [initialize 初始化]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   options [description]
	 * @return {[type]}           [description]
	 */
	TvLayoutDetail.prototype.initialize = function(options) {
		var that = this;
		tvwallViews.detailView();
		that.offWall();
		that.playRealStream();
		that.allUnderWall();
		that.loadTep();
	};

	TvLayoutDetail.prototype.loadTep = function() {
		var that = this,
		    url = "/module/common/tvwall/inc/history-play-bar.html";
			jQuery.get(url).then(function (tpl) {
				that.historyPlayBarTmp =  tpl;
				var str='/module/common/tvwall/css/style.css';
				var str2='/libs/jquery/jquery-ui.js';
                jQuery('head').append('<link rel="stylesheet" href="' + str +'">');
                jQuery('head').append('<script src="' + str2 +'">');
		    });

	};
	
	
	
	/**
	 * [allUnderWall 全部下墙]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   options [description]
	 * @return {[type]}           [description]
	 */
	TvLayoutDetail.prototype.allUnderWall = function(options) {
		jQuery(document).on('click', '#autoMousewheel .offwall', function() {
			var $tv = jQuery(this).closest('.tv'),
			    serverId = $tv.attr('data-serverid'),
				screenId = $tv.attr('data-screenid');
			ajaxModel.postData('/service/md/allstream/close/' + serverId + '/screen/' + screenId).then(function(res) {
				if (res && res.code === 200) {
					//that.rendLoop()
					notify.success('下墙成功！');
					//取消左侧分组对应的相机播放状态、
					var $smscreen = $tv.find(".smscreen");
					for(var i = 0; i<$smscreen.length; i++) {
						if($($smscreen[i]).data("cameraid")){
							var cameraId = $($smscreen[i]).data("cameraid");
							jQuery("#camerasPanel .tree").find(".node li[data-id="+ cameraId +"]").removeClass("selected");
						}
					}
					//取消布局通道的选中状态
					$tv.find(".dis-screen1").removeClass("selected");
					var historyBar = window.tvWallHistoryBarObj;
					if (historyBar && historyBar.param) {
						if (serverId == historyBar.param.serverId && screenId == historyBar.param.screen) {
							//关闭历史进度条
							jQuery(".playbar-close").trigger("click");
							if (historyBar.timmer) {
								window.clearInterval(historyBar.timmer);
							}
						}
					}
					logDict.insertMedialog("m1", "所有摄像机下墙成功！");
				}
			})
		})
	};
	/**
	 * [playRealStream 播放实时视频]
	 * @return {[type]} [description]
	 */
	TvLayoutDetail.prototype.playRealStream = function(){
		var that = this;
		jQuery(document).on('click', '.smscreen .real-stream', function(){
			var self = jQuery(this);
			var cameraId = self.closest(".smscreen").data("cameraid");
			jQuery("#autoMousewheel li").find(".dis-screen1").removeClass("selected");
			self.closest(".dis-screen1").addClass("selected");
			if (cameraId) {
				jQuery.ajax({
					url: "/service/video_access_copy/accessChannels",
					type: "get",
					data: {
						id: cameraId,
					},
					success: function(res) {
						var message = '<object id="UIOCX_CURR" style="width: 100%; height: 300px;" type="applicatin/x-firebreath">'+
                '<param name="onload" value="pluginLoaded"/></object>';
						if (res.code === 200 && res.data) {
							new CommonDialog({
								title: res.data.cameraInfo.name,
								classes: "ocxPanel",
								width: "600px",
								message: message,
								isFixed: true,
								prehide: function() {
									that.clearVideoInfo();
								}
							});
							if (!that.videoPlayerSigle) {
								that.videoPlayerSigle = new VideoPlayer({
									uiocx: 'UIOCX_CURR',
									layout: 1,
								});
							}
							that.playCurrVideo(res.data.cameraInfo);
						}
					},
					error: function() {
						notify.warn("获取摄像机数据失败！");
					}
				});
			}
		});	
	};
	/**
	 * 播放视频
	 */
	TvLayoutDetail.prototype.playCurrVideo = function(data) {
		var self = this;
		var options = {};
		if(data.sd_channel.length>0){
			options.ip = data.sd_channel[0].ip;
			options.port = data.sd_channel[0].port;
			options.user = data.sd_channel[0].username;
			options.password = data.sd_channel[0].password;
			options.path = data.sd_channel[0].av_obj;
		} else{
			options.ip = data.hd_channel[0].ip;
			options.port = data.hd_channel[0].port;
			options.user = data.hd_channel[0].username;
			options.password = data.hd_channel[0].password;
			options.path = data.hd_channel[0].av_obj;
		}
		var optStr = JSON.stringify({
			ip: options.ip,
			port: options.port,
			user: options.user,
			passwd: options.password,
			path: options.path,
			type: 1
		});
		self.videoPlayerSigle.playStreams(optStr, 0, function(index, result, userParam) {
			//console.log("播放实时视频", index, result, userParam);
		});
	};
	/**
	 * 渲染播放窗口
	 */
	TvLayoutDetail.prototype.getOcxTemp = function(callback) {
		var self = this;
		ajaxModel.getTml("/module/inspect/monitor/inc/mygroup-ocxPlay.html")
			.then(function(temp) {
				// 获取成功后加载Handlebars模板
				self.groupOcxTemp = Handlebars.compile(temp);
				callback()
			}, function(err) {
				callback(err);
			});
	};
	/**
	 * 清除播放器相关
	 */
	TvLayoutDetail.prototype.clearVideoInfo = function() {
		var self = this;
		if (self.videoPlayerSigle) {
			self.videoPlayerSigle.playerObj.Stop(false, 0);
			self.videoPlayerSigle = null;
		}
	};
	// TvLayoutDetail.prototype.sendToExpend = function(data){
	// 	var data = {
	// 		"layout": 1,
	// 		"cameras": data
	// 	};
	// 	window.sendExtendScreen(BroadCast, data);
	// };
	/**
	 * [renderDetailMode 渲染电视墙模板详细信息]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   layoutObj [description]
	 * @return {[type]}             [description]
	 */
	TvLayoutDetail.prototype.renderDetailMode = function(layoutObj) {
		var that = this;
		this.beforeRender();		
		this.options.layoutObj = layoutObj;//布局详细信息（creatId: "1" defaultValue: "1" id: "1" monitorLayout: Array[4] name: "aa"）
		this.isChange = false;//标识是否是改变布局还是初始化时的渲染
		this.loadLayout();//渲染布局模板(电视墙模板)
	};
	/**
	 * [afterRender  下墙操作之后对布局模板处理]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @return {[type]}   [description]
	 */
	TvLayoutDetail.prototype.afterRender = function() {
		var that = this;
		$(this.options.layoutContainer).find("li").each(function() {
			that.addStyle($(this));//设置电视墙样式
			that.bindSplitPanel($(this));//针对万解(先不看)
			that.bindDroppable($(this));
			that.bindCloseWall($(this));
			that.bindCloseAllWall($(this));
		});
	};
	/**
	 * [bindDroppable 摄像机操作]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   $dom [description]
	 * @return {[type]}        [description]
	 */
	TvLayoutDetail.prototype.bindDroppable = function($dom) {
		var that = this;		
		//视频监巡模块摄像机双击上墙操作
		$dom.on("dblclick",'.smscreen', function(e) {
			if ($("#preview") && $("#preview").length !== 0 && (e.button === 0)) {
				if (window.gTvwallArrayGis !== undefined && window.gTvwallArrayGis.length !== 0) {
					var flag = permission.stopFaultRightById([window.gTvwallArrayGis[1]])[0];
					if (flag) {
						if ((permission.klass["sendto-tvwall"] === "sendto-tvwall") && (permission.klass["real-time-view"] === "real-time-view")) {
							//that.onWallBygis($(this), $dom);
							//that.onWallByData($(this), $dom);
							that.onWallByData($(this))
						} else {
							notify.info("暂无权限发送到电视墙");
							window.gTvwallArrayGis = [];
							return;
						}
					} else {
						notify.info("暂无权限发送到电视墙");
						window.gTvwallArrayGis = [];
						return;
					}
				}
			}
		});
		
		//拖动上墙
		// $dom.find(".dis-screen1 .smul").bind("mouseup", function(e) {		
			
		// 	if ($("#preview").length === 0) {
		// 		if (window.gTvwallArrayGis !== undefined && window.gTvwallArrayGis.length !== 0) {
		// 			var flag = permission.stopFaultRightById([window.gTvwallArrayGis[1]])[0];
		// 			//判断是否有发送电视墙权限
		// 			if (flag) {
		// 				if ((permission.klass["sendto-tvwall"] === "sendto-tvwall") && (permission.klass["real-time-view"] === "real-time-view")) {
		// 					logDict.insertMedialog("m1", "发送名为" + window.gTvwallArrayGis[2] + "的摄像机到电视墙", "f1");
							
		// 					//that.onWallBygis($(this), $dom);
		// 					that.onWallBygis($(this), $dom);
		// 				} else {
		// 					notify.info("暂无权限发送到电视墙");
		// 					window.gTvwallArrayGis = [];
		// 					return;
		// 				}
		// 			} else {
		// 				notify.info("暂无权限发送到电视墙");
		// 				window.gTvwallArrayGis = [];
		// 				return;
		// 			}
		// 		}
		// 	}
		// });
		
		
		
		
		
		
		
	};
	/**
	 * [bindCloseWall 下墙操作]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   $dom [description]
	 * @return {[type]}        [description]
	 */
	TvLayoutDetail.prototype.bindCloseWall = function($dom) {
		var that = this;
		$dom.find(".dis-screen1 .close").unbind("click").bind("click", function() {
			that.downWall($(this).closest('div[class^="tvinner"]'), $dom);
		});
	};
	/**
	 * [bindCloseAllWall 全部下墙]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   $dom [description]
	 * @return {[type]}        [description]
	 */
	TvLayoutDetail.prototype.bindCloseAllWall = function($dom) {
		var that = this;
		$dom.find(".tv-channel>.close").unbind("click").bind("click", function() {
			that.downAllWall($dom);
		});
	};
	/**
	 * [changeTvWallST 卍解分屏]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   $dom [description]
	 * @param  {[type]}   res  [description]
	 * @return {[type]}        [description]
	 */
	TvLayoutDetail.prototype.changeTvWallST = function($dom, res, screenno) {
		var that = this;
		$dom.find(".dis-screen1").html(that.options.template({
			"splitWall": {
				screenno: screenno,
				layoutDetail: res.data
			}
		}));
		that.bindDroppable($dom);
		that.bindCloseWall($dom);
	};
	/**
	 * [bindEventsForDeatil 添加部分事件]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @return {[type]}   [description]
	 */
	TvLayoutDetail.prototype.bindEventsForDeatil = function() {
		var that = this;
		//为设置高/标清图标添加mouseover效果
		jQuery(".tvList").on("mouseover", ".hover_class_cort", function(e) {
			var $activeDom = jQuery(this).find(".issdContain"),
				$checkIssd = jQuery(this).closest("li").attr("data-monissd").trim(),
				$domFlag = $activeDom.find(".issdflag[data-monissd=" + $checkIssd + "] i");
			$activeDom.toggleClass("active");
			$activeDom.find(".issdflag i").removeClass("heck");
			$domFlag.addClass("heck");
			jQuery(this).find(".issd-select").addClass("issd-select_bak");
		});
		//为设置高/标清图标添加mouseout效果
		jQuery(".tvList").on("mouseout", ".hover_class_cort", function(e) {
			var $activeDom = jQuery(this).find(".issdContain");
			$activeDom.removeClass("active");
			jQuery(this).find(".issd-select").removeClass("issd-select_bak");
		});
	};
	/**
	 * [changeIssdSH 高/标清的切换前端样式变化]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   $clickDom [点击事件dom]
	 * @param  {[type]}   $issd     [当前高、标清状态]
	 * @return {[type]}             [description]
	 */
	TvLayoutDetail.prototype.changeIssdSH = function($clickDom, $issd) {
		var iscdcode = "";
		if ($issd === "0") {
			iscdcode = "[标]";
		}
		if ($issd === "1") {
			iscdcode = "[高]";
		}
		$clickDom.closest("li").attr("data-monissd", $issd);
		$clickDom.closest("li").find(".sdcode_sh").text(iscdcode);
		$clickDom.closest(".issdContain").find("i").removeClass("heck");
		$clickDom.find("i").addClass("heck");
		//高清添加sdcode_gl蓝色显示
		if (iscdcode === "[高]") {
			$clickDom.closest("li").find(".sdcode_sh").addClass("sdcode_gl");
		} else {
			$clickDom.closest("li").find(".sdcode_sh").removeClass("sdcode_gl");
		}
	};
	/**
	 * [bindSplitPanel 分屏]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   $dom [description]
	 * @return {[type]}        [description]
	 */
	TvLayoutDetail.prototype.bindSplitPanel = function($dom) {
		var that = this;
		$dom.find(".dropdown").unbind("click").bind("click", function() {
			var $splitPanel = $dom.find(".split-panel");
			if ($splitPanel.css("display") === "inline-block") {
				$splitPanel.css("display", "none");
			} else {
				$splitPanel.css("display", "inline-block");
			}
			return false;
		});
		$dom.find(".split-panel>a").unbind("click").bind("click", function() {
			var currentSplit = $(this).attr("data-layout");
			//that.splitWall(Number(currentSplit), $dom);
			$dom.find(".split-panel").css("display", "none");
			$dom.find(".cel-screen").css("background", "url('../../common/images/bg/clyt-" + Number(currentSplit) + ".png') no-repeat scroll 0 0 rgba(0, 0, 0, 0)");
			that.swScreen(Number(currentSplit), $dom) //对单个屏幕进行分屏
			that.setLayout($dom);
			return false;
		});
	};
	
	//实时渲染分屏状态
	TvLayoutDetail.prototype.rendScreenStatus = function (dom) {
		var self = this,
			serverId = dom.find('.tv').attr('data-serverid'),
			url = "/service/md/stream/status/" + serverId + "?timestamp=" + new Date().getTime();
		//获取第一个解码器的布局
		jQuery.get(url, {serverId: serverId}).then(function (res) {
				if (res.code === 200) {
					//渲染布局
					var data = JSON.parse(res.data.streamStatus);
					console.log(data)					
					data.each(function (e, i) {
						var ele = $('#autoMousewheel').find('.tv[data-screenid=' + e.screen + ']').find('li.smscreen[data-id=' + (e.window + 1) + ']');
						//ele.attr('data-screen', e.screen).attr('data-server', serverId);						
						
						if (ele[0] && ele[0].className == 'smscreen'){
							ele.css('background-image', '').html(function () {
							if (e.status < 0) {
								ele.css('color', '#ff5959');
								return '<b>' + e.title + '</b></br>' + ocxErrCode(e.status);
							}
							if (e.status === 0) {
								ele.css('color', '#fff');
								return '<b>' + e.title + '</b></br>' + '正常解码中';
							}
							if (e.status === 1000) {
								ele.css('color', '#ffb456');
								return '<b>' + e.title + '</b></br>' + '未打开';
							}
							if (e.status === 1001) {
								ele.css('color', '#ffb456');
								return '<b>' + e.title + '</b></br>' + '等待流';
							}
							if (e.status === 1002) {
								ele.css('color', '#ffb456');
								return '<b>' + e.title + '</b></br>' + '流中断';
							}
							if (e.status === 1003) {
								ele.css('color', '#ffb456');
								return '<b>' + e.title + '</b></br>' + '被抢占';
							}
						});
						if (ele.find('i.cls').length){
							
						} else {
							ele.append('<i class="cls"></i>');
							//self.offWall();
						}	
						}
					});
				};
				if (res.code === 500) {
					notify.error(res.data.message);
				};
			});
		
	};
		

	/**
	 * [screenJudge description 分屏点击判断]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @return {[type]}   [description]
	 */
	TvLayoutDetail.prototype.screenJudge = function(ele) {
		var self = this,
			sData = {
				serverId: ele.closest('.tv').attr('data-serverid'),
				screen: ele.closest('.tv').attr('data-screenid'),
				window: ele.attr('data-id') - 1
			},
			url = '/service/md/screenWindowInfo/' + sData.serverId;
		if (ele.text() !== '') {
			ajaxModel.getData(url, sData).then(function(res) {
				if (res && res.code === 200 && ele.find('i.cls').length) {
					self.cTypeCache = res.data.playingInfo.avType;
					// videoType 2表示历史 1表示实时
					if (res.data.playingInfo.videoType === 2) {
						//jQuery(".history-play-bar-panel").length存在表示电视墙模块
						if (jQuery(".history-play-bar-panel").length) {
							// status 1表示正在播放 2表示暂停
							var flag = res.data.playingInfo.status === 1 ? true : false;
							//切换布局时关闭历史进度条
						    jQuery(".playbar-close").trigger("click");
							jQuery(".history-play-bar-panel").empty().append(self.historyPlayBarTmp);
							jQuery(".history-play-bar-panel").show();
							//  moveDom(jQuery(".history-play-bar-panel"));
							jQuery(".history-play-bar-panel").draggable();
							jQuery(".history-play-bar-panel").css({
								top: jQuery(window).height() / 2,
								left: jQuery(window).width() / 2
							});
							//历史录像播放条初始化
							require(["/module/common/tvwall/js/controllers/history-play.js"], function(historyPlay) {

								var config = {
									playSpeed: res.data.playingInfo.speed,
									isPlayed: flag,
									beginTime: res.data.playingInfo.startTime,
									endTime: res.data.playingInfo.endTime,
									playPosition: res.data.playingInfo.currentTime,
									param: sData,
									cameraInfo: {
										cameraId: res.data.playingInfo.cameraId,
										channelId: res.data.playingInfo.channelId
									}
								};
								self.historyBar = new historyPlay(config);
								var timmer = self.historyBar.getTimmer();
                                window.tvWallHistoryBarObj = {
                                	param:sData,
                                	timmer:timmer
                                };
							});
						}
					}else{
						//点击实时流关闭历史进度条
						if(self.historyBar){
							self.historyBar.closeHistoryPanel();
						}
						jQuery(".playbar-close").trigger("click");
						var historyBar = window.tvWallHistoryBarObj;
						if (historyBar && historyBar.timmer) {
							window.clearInterval(historyBar.timmer);
						}
						if (res.data.playingInfo.avType === 0) { //枪机				
							$("#ptzCamera .content").hide();
							$(".view.ptz.ui.tab").hide();
							$("#ptzCamera").removeClass("active");
						}
						if (res.data.playingInfo.avType === 1) { //球机
							self.ptzCtrl(res.data.playingInfo); //弹出云台
						} else {
							$("#ptzCamera .content").hide();
							$(".view.ptz.ui.tab").hide();
							$("#ptzCamera").removeClass("active");
						}
					}	

				} else {
					$("#ptzCamera .content").hide();
					$(".view.ptz.ui.tab").hide();
					$("#ptzCamera").removeClass("active");
				}
			});
		}
	};
	
	/**
	 * [setPtz; description 云台控制面板]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   splitNum [description]
	 * @return {[type]}            [description]
	 */
	TvLayoutDetail.prototype.setPtz = function (ptzData) {		
		tvPTZ.init().setData({
			cameraId: ptzData.data.cameraId,
			cameraNo: ptzData.data.path || "",
			cType: ptzData.data.avType,
			cameraChannel: {id: ptzData.data.channelId}
		}, 0);
	};
	/**
	 * 云台空值参数设置
	 * @param  {[type]} cData [待设置摄像机参数]
	 * @return {[type]}       [description]
	 */
	function _ptzSetParams(cData) {

		console.log("cData:", cData);

		window.gPtz.setParams({
			cameraId: cData.cameraId,
			cameraNo: null,
			cameraType: cData.avType,
			cameraChannel: {
				id: cData.channelId
			}
		});
	};
	/**
	 * 显示云台控制面板
	 * @return {[type]} [description]
	 */
	TvLayoutDetail.prototype.showPtzCtrlPanel = function() {
		var self = this,
			tmpUrl = '/module/common/ptz/control.html';

		self.getTpl(tmpUrl, function(tml) {
			//判断是否已经存在控制面板
			if (!jQuery('#sidebar').find('#ptzCamera').length) {
				jQuery('#sidebar').append(self.options.tmp);
				jQuery("#ptzCamera ul.tabular").css('width', '100%');
			}
			//显示控制面板
			jQuery("#ptzCamera .content").show();
			jQuery(".view.ptz.ui.tab").show();
			$("#ptzCamera").removeClass('active');
			//绑定收起/展开事件
			jQuery('#ptzCamera .header').off().on('click', function() {
				if (self.cTypeCache === 1) {
					if ($("#ptzCamera").hasClass('active')) {
						jQuery("#ptzCamera .content").show();
						jQuery(".view.ptz.ui.tab").show();
					} else {
						jQuery("#ptzCamera .content").hide();
						jQuery(".view.ptz.ui.tab").hide();
					}
				}
			});
		});
	};
	/**
	 * [ptzCtrl; description 云台控制面板]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   splitNum [description]
	 * @return {[type]}            [description]
	 */
	TvLayoutDetail.prototype.ptzCtrl = function(cData) {
		var self = this;
		//判断有无历史录像查看权限
		if (!permission.klass["ptz-control"]) {
			notify.warn("暂无云台控制权限");
			return;
		}
		//显示云台空值面板
		self.showPtzCtrlPanel();
		//根据是否已经加载进行模块引入
		if(window.PTZController){
			//已经加载了
			_ptzSetParams(cData);

			return;
		}
		//初始化控制参数
		require([
			'/module/common/ptz/control.js',
			'/module/common/ptz/ptz.js'
		], function() {
			//已经加载了
			_ptzSetParams(cData);
		});
	};
	
		/**
	 * [getTpl; description 获取模板]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   splitNum [description]
	 * @return {[type]}            [description]
	 */
	TvLayoutDetail.prototype.getTpl = function(url, callback) {
		var self = this;		
		if (self.options.tmp) {
			return callback(self.options.tmp);
		}
		ajaxModel.getTml(url).then(function (temp) {
			if (temp) {
				self.options.tmp = temp;
				callback(self.options.tmp);
			}
		});
		
	};
	
	
	
	/**
	 * [changeSplitPanel description]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   splitNum [description]
	 * @return {[type]}            [description]
	 */
	TvLayoutDetail.prototype.changeSplitPanel = function(splitNum) {
		var $dom = $("#major .tvList .tv .dis-screen1"),
			domWidth = $dom.width(),
			domHeight = $dom.height(),
			num = Math.sqrt(splitNum);
		$("#major .dis-screen1 .tvinner-split").width((domWidth - num) / num);
	};
	/**
	 * [getCameraName 获取名称]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @return {[type]}   [description]
	 */
	TvLayoutDetail.prototype.getCameraName = function() {
		var cameraName = "";
		if (window.gTvwallArrayGis[0]) {
			if (!/^[\d]+$/.test(window.gTvwallArrayGis[0])) {
				cameraName = window.gTvwallArrayGis[2] + window.gTvwallArrayGis[0];
			} else {
				cameraName = window.gTvwallArrayGis[2] + "(" + window.gTvwallArrayGis[0] + ")";
			}
		} else {
			cameraName = window.gTvwallArrayGis[2];
		}
		return cameraName;
	};
	/**
	 * [matchCameraIsOrMoni 匹配监视器]
	 * @author wumengmeng
	 * @date   2014-12-11
	 * @param  {[type]}   postdata [description]
	 * @return {[type]}            [description]
	 */
	TvLayoutDetail.prototype.matchCameraIsOrMoni = function(postdata) {
		var dropData = "";
		if (window.gTvwallArrayGis[3] || window.gTvwallArrayGis[4]) {
			if (window.gTvwallArrayGis[3] && window.gTvwallArrayGis[3] !== "[]") {
				if (window.gTvwallArrayGis[4] && window.gTvwallArrayGis[4] !== "[]") {
					dropData = postdata.sdcode;
				} else {
					dropData = "1";
				}
			} else {
				dropData = window.gTvwallArrayGis[3] === "[]" ? "0" : "1";
			}
			if (postdata.sdcode !== dropData) {
				console.log(postdata,"0000000",dropData)
				notify.error("摄像机与监视器不匹配！");
				window.gTvwallArrayGis = [];
				if ($("#preview") && $("#preview").length !== 0) {
					$("#preview").remove();
				}
				return false;
			}
			return true;
		} else {
			notify.info("摄像机上墙参数不足！");
		}
	};
	return TvLayoutDetail;
});
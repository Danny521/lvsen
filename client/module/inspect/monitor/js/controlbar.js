/* global gPtz:true, VideoPlayer:true, cameraCache:true, gPTZService:true, extendScreenDate:true */
define(['mootools',
	'underscore',
	'broadcast',
	'/module/ptz-controller/effect/effect.js',
	'/module/ptz-controller/ptzctrl/js/ptzctrl.js',
	'/module/ptz-controller/ptzctrl/js/gptz-core.js',
	'/module/common/tvwall/js/models/tvwall-insert.js',
	'/module/common/tvwall/js/controllers/tvwall-wheel.js',
	'/module/inspect/monitor/js/player-control.js',
	'jquery.jcarousel',
	'/module/ptz-controller/history/vodhistory.js',
	'/module/common/popLayer/js/popImg.js'
], function(mt, _, BroadCast, Effect, PtzController, gPtz, insert, mouseTip, playerControl, jcarousel, vodHistory, POPIMG) {
	var ControlBar = window.ControlBar = new new Class({
		Implements: [Options, Events],
		streamRateTimer: null,
		streamRateTimerGrab: null,
		uploadedImg: [],
		originPic: [], //抓图是用来保存原图信息
		history: "new", //两个版本历史调阅开关 new old
		version: "shanghai", //shanghai//main
		indexCame: 0,
		gh: [],
		inspect: null,
		alarmInfo: {
			"img": "",
			"absTime": "",
			"alarmReason": "",
			"alarmPerson": "",
			"alarmPlace": "",
			"level": "",
			"cameraId": "",
			"cameraChannelId": ""
		},
		initialize: function(options) {
			var self = this;
			// this.setOptions(options); //传一个播放器对象进来
		},
		setInspect: function(inspect) {
			this.inspect = inspect;
		},
		/**
		 * [initControlParam 初始化下拉面板中的内容]
		 * @author huzc
		 * @date   2015-03-04
		 */
		initControlParam: function() {
			var paramAry = jQuery('#selectBlockContents').find('div p');
			for (var i = 0; i < paramAry.length; i++) {
				jQuery(paramAry[i]).removeClass('active');
			}
		},
		/**
		 * [hidSelectBlock 隐藏下拉选择]
		 * @author huzc
		 * @date   2015-03-04
		 */
		hidSelectBlock: function() {
			var selectWrap = jQuery('.select-wrap'),
				ary = jQuery('#selectBlockContent div'),
				pAry;

			selectWrap.removeClass('active');
			for (var i = 0; i < ary.length; i++) {
				jQuery(ary[i]).removeClass('show');
				pAry = jQuery(ary[i]).find('p');
				for (var j = 0; j < pAry.length; j++) {
					jQuery(pAry[j]).removeClass('checked disabled');
				}
			}
			jQuery('.tools-up i').removeClass('clicked'); // 移除已点击标志
			var self = jQuery('.add-preset-point'),
				container = jQuery('.input-pannel'),
				presets = jQuery('.add-presets');
			self.removeClass('clicked');
			presets.removeClass('active');
			container.removeClass('active');
		},
		/**
		 * [adaptiveDisplayIco 自适应显示视频遮挡层上的ico 优化版]
		 * @author huzc
		 * @date   2015-03-04
		 */
		adaptiveDisplayIco: function() {
			var allW = jQuery('#upBlockContent').width();
			var rightMargin = 15;
			var leftW = 190;
			var availableW = allW - leftW - rightMargin;
			var iCount = jQuery('.tools-up i:visible').size();
			var iW = iCount * 27;
			var surplusW;
			var index;
			if (availableW < iW) {
				surplusW = iW - availableW;
				iIndex = parseInt(surplusW / 27);
				jQuery('.tools-up i:visible').filter(function(index) {
					return index <= iIndex;
				}).hide();
			}
		},
		/**
		 * [getStreamMonitor 播放器上显示取码流速率]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[对象]}   player [播放器对象]
		 */
		getStreamMonitor: function(player) {
			var rate = player.getStreamMonitor(player.curChannel); //这个参数是后台的刷新频率，前端有刷新，所以此参数无效
			if (rate !== 'ERROR') {
				jQuery('#streamMonitor').text('  (' + rate + ')');
			} else {
				jQuery('#streamMonitor').text('');
			}
		},
		/**
		 * [getStreamMonitorByGrabIndex 获取截图窗口码流速率]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[type]}   player [播放器对象]
		 */
		getStreamMonitorByGrabIndex: function(player) {
			var rate = player.getStreamMonitor(player.grabIndex); //这个参数是后台的刷新频率，前端有刷新，所以此参数无效
			if (rate !== 'ERROR') {
				jQuery('#streamMonitor').text('  (' + rate + ')');
			}
			/*else{
				jQuery('#streamMonitor').text('');
			}*/
		},

		/**
		 * [showWhich 工具函数 多个按钮共用一个遮罩时控制显示]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[type]}   $clickBtn       [description]
		 * @param  {[type]}   $blockContainer [description]
		 * @param  {[type]}   $contentDiv     [description]
		 * @param  {[type]}   $inspectDiv     [description]
		 * @return {[type]}                   [description]
		 */
		showWhich: function($clickBtn, $blockContainer, $contentDiv, $inspectDiv) {
			if ($clickBtn.hasClass('clicked')) {
				$clickBtn.removeClass('clicked active');
				$blockContainer.removeClass('active');
				$contentDiv.removeClass('active');
				$inspectDiv.hide();

			} else {
				// 第一次点击此按钮
				$clickBtn.addClass('clicked active').parent().siblings().find('i').removeClass('clicked');
				$contentDiv.addClass('active').siblings().removeClass('active');
				$blockContainer.css('left', 10000); //先将显示的内容区移到屏幕外，消除闪一下的问题
				$blockContainer.addClass('active');
				$inspectDiv.show();
			}
		},
		/**
		 * [nameFormat 文件名称格式]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[字符串]}   value [字符串]
		 * @return {[布尔]}         [是否是指定格式]
		 */
		nameFormat: function(value) {
			var pattern = /([?"*'\/\\<>:|？“”‘’]|(?!\s)'\s+|\s+'(?!\s))/ig;
			if (value.test(pattern)) {
				notify.warn('名称不能包含下列任何字符 \\ / : * ? \" \' < > |');
				return false;
			} else {
				return true;
			}
		},
		/**
		 * [displayIframe 通道上方控制区域,初始化下拉选择的显示 oClicked代表点击的按钮对象]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[对象]}   oClicked [jq对象]
		 */
		displayIframe: function(oClicked) { //
			var oSelectWrap = jQuery('.select-wrap'),
				oBtnSib = oClicked.siblings(), //按钮兄弟节点
				className = oClicked.attr('class'),
				oSelectContent = jQuery('#selectBlockContent'),
				oSelectList = oSelectContent.find('.' + className.split(' ')[0]);
			if (oClicked.hasClass('clicked')) {
				oSelectWrap.removeClass('active'); //1.将iframe隐藏
				oSelectList.removeClass('show'); //2.将点击内容隐藏
				oClicked.removeClass('clicked active'); //3.移除clicked
			} else {
				for (var i = 0; i < oBtnSib.length; i++) {
					jQuery(oBtnSib[i]).removeClass('clicked');
				}
				oSelectWrap.css('left', 10000);
				oSelectWrap.addClass('active'); //2.将iframe显示
				oSelectList.addClass('show').siblings().removeClass('show'); //3.将点击的内容显示,将兄弟内容隐藏
				if (!jQuery(".screenshot-preview").is(":visible")) {
					this.setBlockPos(oClicked, oSelectList, oSelectWrap, '.video-control', 0, 0); //4.设置iframe的left height
				}
				oClicked.addClass('clicked'); //6.给这个按钮增加clicked
			}
		},

		/**
		 * [setBlockPos 设置遮罩层的位置,遮罩对象相对浏览器左的偏移]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[jq对象]}   oClicked      [jq对象]
		 * @param  {[jq对象]}   oSelectList   [jq对象]
		 * @param  {[jq对象]}   oSelectIframe [jq对象]
		 * @param  {[字符串]}   className     [选择器]
		 * @param  {[数字]}   tbborder      [description]
		 * @param  {[数字]}   lrborder      [description]
		 */
		setBlockPos: function(oClicked, oSelectList, oSelectIframe, className, tbborder, lrborder) { //className:选择器 遮罩对象相对浏览器左的偏移
			var height = parseInt(oSelectList.css('height')) + 2 * tbborder,
				width = parseInt(oSelectList.css('width')) + 2 * lrborder,
				//分享按钮相对父容器的左偏移	按钮本身的宽度
				thisLeft = oClicked.offset().left,
				parentLeft = jQuery(className).offset().left,
				thisWidth = oClicked.width();

			//下拉内容的left	top值
			var oIfrLeft = thisLeft + thisWidth - parseInt(width) - parentLeft;
			if (height !== 0 || width !== 0) {
				oSelectIframe.css({
					'height': height,
					'width': width,
					'left': oIfrLeft
				});
			}
		},
		/**
		 * [setFramePos 根据原来的弹出框的位置重新设定iframe的位置。这个是为了解决在谷歌下弹出框不能,显示在ocx上再叠加的iframe，定位iframe的位置，setBlockPos所以决定重新写一个，防止引起其他问题。 ]
		 * @author wangxiaojun
		 * @date   2015-01-22
		 * @param  {[type]}   oClicked      [description]
		 * @param  {[type]}   oSelectList   [description]
		 * @param  {[type]}   oSelectIframe [description]
		 * @param  {[type]}   className     [选择器]
		 * @param  {[type]}   tbborder      [description]
		 * @param  {[type]}   lrborder      [description]
		 * @param  {[type]}   frameDiv      [description]
		 */
		setFramePos: function(oClicked, oSelectList, oSelectIframe, className, tbborder, lrborder, frameDiv) { //className:选择器 遮罩对象相对浏览器左的偏移
			var height = parseInt(oSelectList.css('height')) + 2 * tbborder,
				width = parseInt(oSelectList.css('width')) + 2 * lrborder,
				//分享按钮相对父容器的左偏移	按钮本身的宽度
				thisLeft = oClicked.offset().left,
				parentLeft = jQuery(className).offset().left,
				thisWidth = oClicked.width();

			//下拉内容的left	top值
			var oIfrLeft = thisLeft + thisWidth - parseInt(width) - parentLeft;
			if (height !== 0 || width !== 0) {
				oSelectIframe.css({
					'height': height,
					'width': width,
					'left': oIfrLeft
				});
				frameDiv.css({
					'height': height,
					'width': width,
					'left': oIfrLeft
				});
			}
		},
		/**
		 * [resizePlayer 播放器自适应宽高]
		 * @author huzc
		 * @date   2015-03-04
		 */
		resizePlayer: function() {
			var playerWidth = jQuery(".screen").width(); //视频容器的宽度
			var playerHeight = jQuery(".screen").height(); //视频容器的高度
			if (jQuery("#history_timeline")[0]) {
				var hisH = jQuery("#history_timeline").height();
				var display = jQuery("#history_timeline").css("display");
				if (display == "none") {
					hisH = 0
				}
				playerHeight = playerHeight - hisH;
			}
			/*jQuery('#UIOCX').width(playerWidth);
			jQuery('#UIOCX').height(playerHeight + 1);*/ //因为跨浏览器ocx不支持jQuery获取，所以改用下面方法
			jQuery(".UIOCX").width(playerWidth);
			jQuery(".UIOCX").height(playerHeight + 1);
		},
		/**
		 * [setControlBarPos 设置控制条的位置]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[对象]}   player [播放器对象]
		 * @param  {[数字]}   index  [分屏序号]
		 * @param  {[布尔]}   force  [主要是在resize时，如果抓图开启状态下用的]
		 */
		setControlBarPos: function(player, index, force) { //console.log(327)
			if (player.cameraData[index] !== -1) {
				var channelPositionObj = player.getVideoRectByIndex(index);
				if (typeof(channelPositionObj) == "object") {
					//抓图开启状态下，不移动遮挡层
					if (jQuery('.screenshot-preview').is(':visible') && !force) {
						return;
					}
					jQuery('.video-control').css({
						left: channelPositionObj.Left,
						top: channelPositionObj.Top,
						width: channelPositionObj.Width,
						height: channelPositionObj.Height
					});
					//在分屏长度改变时动态设置max-width的长度,目的是让摄像机名称显示完整,350为所有最右边的按钮所占像素
					jQuery(".video-title").css("max-width", channelPositionObj.Width - 350);
				}
			}
		},
		/**
		 * [checkPTZMonopolyStatus 云台独占状态 返回值0独占  1未独占]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[对象]}   player [播放器对象]
		 */
		checkPTZMonopolyStatus: function(player) {
			var data = {
					cameraId: player.cameraData[player.curChannel].cId
				},
				success = function(res) {
					if (res && res.code === 200) {
						player.cameraData[player.curChannel].isMonopoly = parseInt(res.data.status);
						var isMonopoly = player.cameraData[player.curChannel].isMonopoly;
						if (isMonopoly === 0) {
							jQuery('#engrossPtz').addClass('checked');
						} else {
							jQuery('#engrossPtz').removeClass('checked');
						}
					}
				};
			gPTZService.checkMonopoly(data, success); //获取云台是否独占 0独占 1未独占
		},
		/**
		 * [ptzUserable 云台不可用的情况]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[type]}   msg [description]
		 * @return {[布尔]}       [云台是否可用]
		 */
		ptzUserable: function(msg) {
			var obj = this.getInspectStatus(this.player.focusChannel - 0);
			if (obj.isGoing && obj.type && obj.action) {
				notify.warn("正在轮巡！");
				return false;
			}
			//监巡且非暂停状态
			if (obj.isGoing && !obj.type && !obj.action) {
				notify.warn("正在监巡！");
				return false;
			}

			if (jQuery('[data-tabor="inspect-layout"]').is(".active")) {
				notify.warn('监巡布局设置,暂不能' + msg + '！');
				return false;
			}

			return true;
		},
		/**
		 * [splitVideoPieces 视频片段列表html片段]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[数组]}   recordPieces [数组]
		 * @return {[字符串]}                [html字符串]
		 */
		splitVideoPieces: function(recordPieces) {
			var list = '';
			var translate = function(mills) {
				return Toolkit.mills2datetime(mills);
			};
			if (recordPieces && (recordPieces instanceof Array)) {
				for (var i = 0; i < recordPieces.length; i++) {
					list += '<li data-depth="' + recordPieces[i][2] + '"><span class="starttime">' + translate(recordPieces[i][0]) + '</span><span> 至 </span><span class="endtime">' + translate(recordPieces[i][1]) + '</span><i class="delete"></i></li>';
				}
			}
			return list;
		},
		/**
		 * [getWidth 获取元素宽度]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[字符串]}   str [选择器字符串]
		 * @return {[数字]}       [元素宽度]
		 */
		getWidth: function(str) {
			var Flag = 1;
			var display = jQuery(str).css("display");
			if (display == "none") {
				Flag = 0;
			}
			var w = jQuery(str).width();
			var w1 = parseInt(jQuery(str).css("margin-left"));
			var w2 = parseInt(jQuery(str).css("margin-right"));
			var w3 = parseInt(jQuery(str).css("padding-left"));
			var w4 = parseInt(jQuery(str).css("padding-right"));
			if (!w1) {
				w1 = 0
			}
			if (!w2) {
				w2 = 0
			}
			if (!w3) {
				w3 = 0
			}
			if (!w4) {
				w4 = 0
			}
			w = w + w1 + w2 + w3 + w4;
			var w = Flag * w;
			return w;
		},
		/**
		 * [playType 设置云台面板的在实时和历史情况下的显示状态]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[数字]}   n          [特征数字1实时，2历史]
		 * @param  {[对象]}   player     [播放器对象]
		 * @param  {[数字]}   curChannel [分屏序号]
		 */
		playType: function(n, player, curChannel) {
			if (n == 1) { //实时
				jQuery("#ptzCamera .content .ui.tab").hide();
				jQuery("#ptzCamera .ui.tabular li").hide();
				//预置位
				if (permission.klass['delete-preset'] || permission.klass['call-preset'] || permission.klass['set-preset']) {
					jQuery("#ptzCamera .ui.tabular .preset").show();
				} else {
					jQuery("#ptzCamera .ui.tabular .preset").hide();
				}
				//云台
				if (permission.klass['ptz-control']) {
					jQuery("#ptzCamera .ui.tabular .ptz").show();
					if (!jQuery("#ptzCamera .ui.tabular .ptz").hasClass('active')) {
						jQuery("#ptzCamera .ui.tabular .ptz").trigger('click');
					}
					jQuery("#ptzCamera .content .ui.tab.ptz").show();
				} else {
					jQuery("#ptzCamera .ui.tabular .ptz").hide();
					jQuery("#ptzCamera .ui.tabular .effect").trigger("click");
				}
				//巡航
				if (permission.klass['preset-cruise']) {
					jQuery("#ptzCamera .ui.tabular .cruise").show();
				} else {
					jQuery("#ptzCamera .ui.tabular .cruise").hide();
				}
				//历史回放
				if (permission.klass['view-history']) {

				} else {

				}
				jQuery("#ptzCamera .ui.tabular .effect").show();

				jQuery("#ptzCamera .ui.tabular .hisplay").hide();
				jQuery("#ptzCamera .content .view.ui.tab.hisplay").hide();
			}
			if (n == 2) { //历史
				jQuery("#ptzCamera .ui.tabular li").hide();
				jQuery("#ptzCamera .ui.tabular .hisplay").show();
				jQuery("#ptzCamera .ui.tabular .effect").show();
				jQuery("#ptzCamera .content .view.ui.tab").hide();
				jQuery("#ptzCamera .content .view.ui.tab.hisplay").show();
				jQuery("#ptzCamera .header .hisplay").addClass('active').siblings().removeClass('active');
				//jQuery("#ptzCamera .header .ui.tabular .hisplay").trigger("click");
				jQuery("#masklayer").hide();
				//window.SelectCameraId=cameraId;
				var A = window.PlayerControler.givePlayTime();
				jQuery(".his_beginTime").val(A[0]);
				jQuery(".his_endTime").val(A[1]);
				//jQuery("#ptzCamera .content .view.hisplay.ui.tab .resultList").html("暂无数据,请查询");
				if (curChannel >= 0) {
					//var Channelid=player.getcamid(player.cameraData,curChannel);
					var Channelid = player.findcamid(player.cameraData[curChannel]);
					window.SelectCamera.Channelid = Channelid;
				}
				window.SelectCamera || (window.SelectCamera.index = curChannel);
			}
		},
		/**
		 * [hisClick 该接口功能复杂，控制云台，属性，以及播放器界面的状态，该接口待切分优化]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[对象]}   player     [播放器对象]
		 * @param  {[数字]}   curChannel [分屏序号]
		 */
		hisClick: function(player, curChannel) {
			var self = this;
			jQuery(document).trigger('click');
			jQuery('#setCruise, .xdsoft_datetimepicker').hide();
			jQuery('#ptzCamera').addClass("active");
			player.focusChannel = curChannel;
			player.manualFocusChannel = curChannel;
			/*
			if (player.cameraData[curChannel] === -1) {//切换到未播放视频通道,隐藏云台
				jQuery('#ptzCamera').removeClass('active');
				return;
			};
			*/
			if (typeof(player.cameraData[curChannel]) === "object") {
				var cameraId = player.cameraData[curChannel].cId;
				var cameraNo;
				if (player.cameraData[curChannel].path) {
					var cameraNo1 = player.cameraData[curChannel].path;
				}
				if (player.cameraData[curChannel].playingChannel) {
					var cameraNo2 = player.cameraData[curChannel].playingChannel.path;
				}
				if (player.cameraData[curChannel].history) {
					var cameraNo3 = player.cameraData[curChannel].history.path;
				}
				cameraNo = cameraNo1 || cameraNo2 || cameraNo3;

				var cameraType = player.cameraData[curChannel].cType;
				//监巡暂停,轮巡锁定时情况
				/*if (!window.ptzShow('click', cameraId, cameraNo, cameraType)) {
					window.isActiveLi.removeClass('active');
					return;
				}*/

				// 单击视频左侧资源树对应的节点高亮
				jQuery(".treeMenu .node.selected .leaf .camera").closest('.node.activated').removeClass('activated');
				jQuery(".treeMenu .node.selected .leaf .camera").closest('.node[data-id=' + cameraId + '][data-type=leaf]').addClass('activated');

				/*if (cameraId) { //单击切换云台参数

					gPtz.setParams({
						cameraId: cameraId,
						cameraNo: cameraNo,
						cameraType: cameraType
					});

					if (cameraType === 0) {
						// jQuery('#ptzCamera').find('.header li:eq(1)').trigger('click');
					} else {
						// window.isActiveLi.trigger('click');
					}
					if (window.isActiveLi.is(jQuery('[data-tab=ptz]'))) {
						jQuery('#ptzCamera .ptz .equipment select').trigger('change');
					}
				}*/
			}

			var str = player.playerObj.GetVideoAttribute(curChannel - 0) + "";
			var controlLeft = parseInt(jQuery('.video-control').css("left")); //10000
			if (str == "ERROR") {
				if (controlLeft !== 10000) { //空屏点击无效
					jQuery("#ptzCamera .header .ui.tabular>ul>li").removeClass("active");
					jQuery("#ptzCamera .header .ui.tabular .hisplay").addClass("active");
					if (jQuery("#downBlockContent .video-type .real").hasClass("active")) {
						self.playType(1, player, curChannel);
						// jQuery('#ptzCamera').addClass('active');
					} else if (jQuery("#downBlockContent .video-type .record").hasClass("active")) {
						self.playType(2, player, curChannel);
					}
				}
			} else {
				var jsonobj = JSON.parse(str);
				self.playType(jsonobj.videoType, player, curChannel);
				// jQuery('#ptzCamera').addClass('active');
				if (jsonobj.videoType == 2) {
					jQuery("#ptzCamera .header .ui.tabular>ul>li").removeClass("active");
					jQuery("#ptzCamera .header .ui.tabular .hisplay").addClass("active");
				}
			}
		},
		/**
		 * [setPos 设置播放器播放历史的进度条进度]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[对象]}   player [播放器对象]
		 * @param  {[数字]}   index  [分屏序号]
		 */
		setPos: function(player, index) {
			var index = index || player.curChannel;
			var ListData = window.SelectCamera && window.SelectCamera.ListData[index];
			var hasPlayTime = player.getPlayTime(index);
			//高亮录像列表
			vodHistory.highlightPiece(hasPlayTime);
			//更新进度条
			if (!ListData) {
				return
			}
			if (player.cameraData[index] <= 0) {
				return;
			}
			var str = player.playerObj.GetVideoAttribute(index) + "";
			if (str == "ERROR") {
				return;
			}
			var beginTime = ListData.beginTime;
			var endTime = ListData.endTime;
			//console.log("hasPlayTime="+hasPlayTime+",beginTime="+beginTime+",endTime="+endTime);
			var obj = {
				beginTime: beginTime,
				endTime: endTime
			};
			window.PlayerControler.setPos(obj, "playtime", hasPlayTime);
		},
		/**
		 * [ListenPlayerProgress 监听播放器进度条]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[对象]}   player [播放器对象]
		 * @param  {[数字]}   index  [分屏序号]
		 * @param  {[布尔]}   flag   [暂时未使用]
		 */
		ListenPlayerProgress: function(player, index, flag) {
			var self = this;
			if (!window.ProgressTimer) {
				window.ProgressTimer = [];
			}
			if (window.ProgressTimer[index]) {
				clearInterval(window.ProgressTimer[index]);
			}
			for (var i = 0; i <= 15; i++) {
				clearInterval(window.ProgressTimer[i]);
			}
			window.ProgressTimer[index] = setInterval(function() {
				self.setPos(player, index);
			}, 500);
		},
		/**
		 * [getChannelIdByCameraId 从某分屏信息查找摄像机id,从而获通道信息，该接口极其重要]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[数组]}   A     [视频指挥页面16项数组记录的信息]
		 * @param  {[数字]}   index [分屏序号]
		 * @param  {[函数]} fn    [回调函数]
		 */
		getChannelIdByCameraId: function(A, index, fn) {
			var camera = A[index];
			var cameraId = camera.cameraId;
			jQuery.ajax({
				url: "/service/video_access_copy/accessChannels",
				dataType: 'json',
				type: 'get',
				data: {
					id: cameraId
				},
				success: function(res) {
					if (fn) {
						fn(res)
					};
				}
			});
		},
		/**
		 * [Judge_SubScreen_VodeType 判断某分屏播放的是实时还是历史]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[对象]}   player [播放器对象]
		 * @param  {[数字]}   index  [分屏序号]
		 */
		Judge_SubScreen_VodeType: function(player, index) {
			var str = player.playerObj.GetVideoAttribute(index);
			if (str == "ERROR") {
				return this.channelDataList[index].status;
			} else {
				var jsonobj = JSON.parse(str);
				if (jsonobj.videoType == 2) //历史
				{
					return "his";
				} else if (jsonobj.videoType == 1) //实时
				{
					return "real";
				} else {
					return "ERROR";
				}
			}
		},
		/**
		 * [setPicList 重新设置抓图列表中图片位置和翻页按钮显示]
		 * @author huzc
		 * @date   2015-03-04
		 */
		setPicList: function() {
			var downWidth = jQuery("#downBlockContent").width(),
				forwardBtnWidth = $(".preview-panel .forward").outerWidth(true), //前翻页的按钮宽度
				exitBtnWidth = $(".preview-panel .exit").outerWidth(true), //退出按钮的宽度
				afterwardBtnWidth = $(".preview-panel .afterward").outerWidth(true), //后翻页的按钮宽度
				everyPicWidth = $('#picbox img').outerWidth(true), //每个图片的宽度
				picCounts = jQuery(".preview-panel img").size(), //截图的个数
				allPicWidth = picCounts * everyPicWidth, //当前所有截图的宽度
				$visualArea = jQuery(".visual-area"); //可是区域jQuery对象

			jQuery('#picbox').css('left', 0);
			if ((downWidth - exitBtnWidth) >= allPicWidth) { //当前宽度足以显示图片
				$visualArea.width(allPicWidth).css('left', 0);
				jQuery(".forward,.afterward").hide();
			} else {
				jQuery(".forward,.afterward").show();
				jQuery(".afterward").addClass('disable');
				jQuery(".forward").removeClass('disable');
				$visualArea.css('left', forwardBtnWidth).width(downWidth - exitBtnWidth - forwardBtnWidth - afterwardBtnWidth); //这个地方的宽度为什么是这个？不需要减去前面的上一页么？
			}
		},
		/**
		 * [PlayHis_for_InspectPoll 轮巡锁定或监巡暂停情况的历史调阅]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[数字]}   index [分屏序号]
		 */
		PlayHis_for_InspectPoll: function(index) {
			var self = this;
			var player = self.player;
			var DataList = self.channelDataList[index];
			self.getChannelIdByCameraId(player.cameraData, index, function(res) {
				if (res.code === 200) {
					var data = res.data.cameraInfo;
					player.stopStream(index);
					DataList.status = "his";
					self.setPlayerUI(index, "his");
					self.hisClick(player, index);
					self.playType(2, player, index);
					self.real2history = true;
					var camid = player.findcamid(data);
					if (camid > 0 && index >= 0 && window.SelectCamera) {
						window.SelectCamera.Channelid = camid;
						var title = player.cameraData[index].cName;
						title = title.replace(/\(\d+\)$/gi, "");
						window.SelectCamera.selectName = title;
						window.SelectCamera.ListData[index].selectName = title;

						if (!window.SelectCamera.MenuData) {
							window.SelectCamera.MenuData = {};
						}
						window.SelectCamera.MenuData[title] = data;
						window.SelectCamera.selectName = title;
					}
					jQuery("#ptzCamera .content .view.hisplay.ui.tab .asearch").trigger("click");
				}
			});
		},
		/**
		 * [displayBtnsByCameraType 根据摄像机类型(球机或者非球机)显示隐藏部分按钮]
		 * @param  {[布尔]} boolean [该参数可以省略，将根据cType进行显隐。如果true:显示Btns  如果false:隐藏Btns]
		 */
		displayBtnsByCameraType: function(boolean) {
			var presetFlag = permission.klass['set-preset'] ? true : false;
			// var presetFlag = permission.klass['set-preset']?true:false;
			if (boolean === undefined) {
				if (this.player.cameraData[this.player.curChannel].cType === 1) { //球机时显示‘多功能’‘添加预置位’按钮
					jQuery('.tools-dwon .add-preset-point').show();
					jQuery('.tools-up .ptz-control').show();
					if (!permission.klass["ptz-engross"] && !permission.klass["ptz-lock"]) {
						jQuery('.tools-up .multi').hide();
					} else {
						jQuery('.tools-up .multi').show();
					}
				} else { //非球机时隐藏‘多功能’‘添加预置位’按钮
					jQuery('.tools-dwon .add-preset-point').hide();
					jQuery('.tools-up .multi').hide();
					jQuery('.tools-up .ptz-control').hide();
				}

			} else if (boolean === true) {
				jQuery('.tools-dwon .add-preset-point').show();
				jQuery('.tools-up .multi').show();
				jQuery('.tools-up .ptz-control').show();
			} else if (boolean === false) {
				jQuery('.tools-dwon .add-preset-point').hide();
				jQuery('.tools-up .multi').hide();
				jQuery('.tools-up .ptz-control').hide();
			}
		},
		/**
		 * [LoopInspectRenderUI 监巡轮巡播放器界面显示  该函数是在鼠标进入到ocx窗口时执行]
		 * @author hzc
		 * @date   2015-03-04
		 * @param  {[数字]}   index [分屏序号]
		 */
		LoopInspectRenderUI: function(index) {
			var self = this;
			var index = index - 0;
			var unlockedChannels = [];
			jQuery("#upBlockContent .tools-up .close").hide();
			jQuery("#downBlockContent .tools-dwon .real-sound").hide();
			jQuery("#downBlockContent .tools-dwon .real-talk").hide();
			var inspectStatus = this.getInspectStatus(index);
			if (inspectStatus.isGoing) {
				if (inspectStatus.type) { //轮巡
					jQuery("#downBlockContent .lockunlock").show();
					if (!inspectStatus.action) { //未锁定状态
						self.unlockUI(index);
					} else { //锁定状态
						self.lockUI(index);
					}
					//如果index是未参加轮巡的窗口就默认他原来的状态 add bywujingwen on 2015..09.14
					var layout = this.player.getLayout(),
						unlockedChannels = this.inspect.groups[0].freeWindow,
						occupyWindow = [],
						totalWindow = [];
					for (var i = 0; i < layout; i++) {
						totalWindow.push(i.toString());
					}
					occupyWindow = _.difference(totalWindow, unlockedChannels);
					for (var j = 0; j < occupyWindow.length; j++) {
						if (index.toString() === occupyWindow[j]) {
							jQuery("#upBlockContent .tools-up .close").show();
							jQuery("#downBlockContent .lockunlock").hide();
							return;
						}
					}
				} else { //监巡
					if (!inspectStatus.action) { //监巡未暂停
						self.runingUI(index);
					} else {
						self.pauseUI(index);
					}
				}
			}
		},
		/**
		 * [getServerRecordStatus 获取服务器录像状态，该接口不稳定]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[数字]}   cameraId  [摄像机id]
		 * @param  {[数字]}   channelId [通道id]
		 * @param  {函数} callback  [回调参数]
		 */
		getServerRecordStatus: function(cameraId, channelId, callback) {
			var self = this;
			jQuery.ajax({
				url: '/service/ptz/videoStatus',
				dataType: 'json',
				type: 'get',
				cache: false,
				data: {
					'cameraId': cameraId,
					'channelId': channelId
				},
				success: function(res) {
					if (res && res.code === 200) {
						var isRecording = (res.data.isRecording === 0); //0是启动，其余为未启动
						var curChannel = self.player.cameraData[self.player.curChannel];
						if (typeof(curChannel) == "object" /* && !curChannel.recordFlag*/ ) {
							curChannel.recordFlag = isRecording ? true : false;
						}

						if (callback) {
							callback(isRecording)
						}
					} else {
						//notify.warn('获取服务器录像状态失败！');
					}
				}
			});
		},
		/**
		 * [isGrabingStatus 检测是否正处于抓图状态]
		 * @author huzc
		 * @date   2015-03-04
		 * @return {布尔}  [是否正处于抓图状态]
		 */
		isGrabingStatus: function() {
			var i = this.player.cameraData.length;
			var flag = false;
			while (i--) {
				if (this.player.cameraData[i] !== -1) {
					flag = flag || this.player.cameraData[i].picFlag ? true : false;
				}
			}
			return flag;
		},
		/**
		 * 录像片段播放后的结束回调
		 * @param index - 窗口索引
		 */
		playHistoryPiece: function(index) {
			//先填满
			jQuery(".ctrlbar").css("right", "0");
			jQuery(".played").width("100%");
			//录像播放结束的回调
			window.setTimeout(function() {
				jQuery(".ctrlbar").css("left", "0");
				jQuery(".played").width(0);
			}, 500);

			if (window.ProgressTimer[index]) {
				window.clearInterval(window.ProgressTimer[index]);
			}
			//更新样式
			jQuery(".video-btn .toggle-pause").removeClass("toggle-pause").addClass("toggle-play paused");
			//更新标记位
			window.isPlayOver = true;
			//提示播放结束
			notify.warn("播放结束。");
		},
		/**
		 * [PlayListPiece 播放历史录像片段,该分屏已经存在播放数据的基础上,才可执行此函数;]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[数字]}   index [分屏索引]
		 * @param  {[数字]}   order [ 播放片段序号]
		 * @param  {Function} fn    [回调函数]
		 */
		PlayListPiece: function(player, index, order, searchBeginTime, searchEndTime, fn) {
			var self = this;
			var ListData = window.SelectCamera.ListData[index];
			var L = ListData.searchData.videos.length;
			var attrstr = player.playerObj.GetVideoAttribute(index) + "",
				status = 0;
			window.isPlayOver = false;
			if (attrstr != "ERROR") {
				var jsonobj = JSON.parse(attrstr);
				if (jsonobj.videoType == 2 && !player.cameraData[index].history.isNeedLoadPvg) {
					status = 1;
				}
			}
			if (status === 1) {
				//如果在单窗口上播放所有的录像片段
				if (window.hisRecordPlayMode === "single") {
					//获取要播放片段的开始时间
					var T = ListData.searchData.videos[order][0],
						seekTime = T - searchBeginTime;
					if (seekTime < 0) {
						seekTime = 0;
					}
					player.playerObj.SetPlayMode(2, seekTime, index);
					return;
				}
				/**
				 * 获取待播放的窗口索引,bug[36836]
				 * 此处修改主要是为了项目上的已有需求及基线的问题，综合进行录像播放的修改，
				 * 原有录像片段的播放逻辑是一直在实时流打开的页面上进行，现在修改为如果窗口存在多个，则优先找空闲窗口
				 * add by zhangyu, 2016.04.28
				 */
				//找空闲窗口播放
				var curPieceBeginTime = ListData.searchData.videos[order][0],
					curPieceEndTime = ListData.searchData.videos[order][1];
				//序号为order的历史录像片段播放
				player.PlayListTime(index, order, curPieceBeginTime, curPieceEndTime, self.playHistoryPiece);
			} else {
				//默认处理流程，搜索的时间段全部播放，从第一段开始（传递order为-1标示播放搜索范围全部录像段）
				player.PlayListTime(index, -1, searchBeginTime, searchEndTime, self.playHistoryPiece);
			}
		},

		PlayNextPiece: function(player, index, order, searchBeginTime, searchEndTime, fn) {
			var self = this;
			var ListData = window.SelectCamera.ListData[index];
			var L = ListData.searchData.videos.length;
			//播放前，判断是否是最后一段，置变量，进行播放结束后的播放按钮状态归位
			if (order == L - 1) {
				window.SelectCamera.isLastPiece = true;
			} else {
				window.SelectCamera.isLastPiece = false;
			}
			//序号为order的历史录像片段播放完毕的回调
			player.PlayListTime(index, order, searchBeginTime, searchEndTime, function(index, result, data) {
				if (order == L - 1) {
					return;
				}
				if (typeof(fn) == "function") {
					fn(order + 1);
				}
				//自动播放下一段
				self.PlayNextPiece(player, index, order + 1, searchBeginTime, searchEndTime, fn);
			});
		},
		/**
		/**
		 * [SearchToSeek 传入开始时间和结束时间，通道号，搜索历史录像片段数据先播放第一段，然后定位到指定时刻seek播放;]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[数字]}   index     [分屏序号]
		 * @param  {[数字]}   Channelid [通道号]
		 * @param  {[数字]}   beginTime [开始时间]
		 * @param  {[数字]}   endTime   [结束时间]
		 * @param  {[数字]}   T         [指定的播放时间 相对于beginTime的毫秒数]
		 */
		SearchToSeek: function(index, Channelid, beginTime, endTime, T) {
			var self = this;
			var player = this.player;
			var ListData = window.SelectCamera.ListData;
			HistoryHandler.getvideos(Channelid, beginTime, endTime, function(data, flag) {
				if (flag == false) {
					return;
				}
				var L = data.videos.length;
				if (data.videos.length == 0) {
					return;
				}
				var html = PTZController.ListSearch(data);
				var start = data.videos[0][0];
				var end = data.videos[L - 1][1];
				ListData[index].selectName = window.SelectCamera.selectName;
				ListData[index].searchData = Object.clone(data);
				window.SelectCamera.searchData = data;
				window.SelectCamera.searchHTML = html;
				window.SelectCamera.ListData[index].subindex = 0;
				//执行play2接口播放历史,播放第0个片段
				self.PlayListPiece(player, index, 0);
				setTimeout(function() {
					var beginTime = ListData[index].beginTime;
					var endTime = ListData[index].endTime;
					var dis = endTime - beginTime;
					var seekTime = T - beginTime;
					var N = player.playerObj.SetPlayMode(2, seekTime, index);
				}, 600);

			});
		},
		/**
		 * [playSingleSeek 若同步：传入播放时间，计算出在指定分屏内存储的历史片段的序号K，播放第K段历史录像,然后定位到时间T播放;非同步：在焦点分屏搜索历史片段播放]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[数字]}   index [分屏序号]
		 * @param  {[数字]}   now   [当前时刻]
		 * @param  {[数字]}   T     [需要定位播放的时刻,从"绝对时刻"1970年1月1日开始]
		 */
		playSingleSeek: function(player, index, now, T) {
			var self = this;
			//var player = this.player;
			var ListData = window.SelectCamera.ListData;
			var str = player.playerObj.GetVideoAttribute(index) + "";
			if (str == "ERROR") {
				var Channelid = player.findcamid(player.cameraData[index]);
				self.SearchToSeek(index, Channelid, T, now, T);
				return;
			}
			var videoType = JSON.parse(str).videoType;
			if (videoType == 2) {
				if (ListData[index].searchData) {
					var videos = ListData[index].searchData.videos;
				} else {
					var videos = window.SelectCamera.searchData.videos;
				}
				//var videos=ListData[index].searchData.videos;
				var L = videos.length;
				var K = L - 1;
				var FlaginSet = (T >= videos[0][0] && T < videos[L - 1][1]); //播放时间在历史片段集合里；
				if (FlaginSet) {

					K = self.getOrder(T, player, index);
					self.PlayListPiece(player, index, K);
					setTimeout(function() {
						var beginTime = ListData[index].beginTime;
						var endTime = ListData[index].endTime;
						var dis = endTime - beginTime;
						var seekTime = T - beginTime;
						var N = player.playerObj.SetPlayMode(2, seekTime, index);
					}, 600);
				} else {
					var Channelid = player.findcamid(player.cameraData[index]);
					self.SearchToSeek(index, Channelid, T, now, T);
				}
			}
		},
		/**
		 * [JudgeAsynSeek 判断是否勾选了同步checkbox再对index分屏的历史录像seek定位]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[数字]}   hisK          [是否存在播放历史分屏]
		 * @param  {[数字]}   FirstHisIndex [某一个播放历史的分屏 非index，该分屏作为index的参照分屏]
		 * @param  {[数字]}   index         [准备操作的分屏序号]
		 */
		JudgeAsynSeek: function(obj) {
			var hisK = obj.hisK;
			var FirstHisIndex = obj.FirstHisIndex;
			var index = obj.index;
			var player = obj.player;
			var self = this;
			//var player = this.player;
			var FlagAsyn = jQuery("#synchronized").prop("checked");
			if (FlagAsyn == false) {
				window.PlayerControler.playSomeTimeAgo(10, player, index);
				return;
			}
			if (hisK == 0) {
				window.PlayerControler.playSomeTimeAgo(10, player, index);
				return;
			} else {
				var Time = self.getHistoryPlayTime(player, FirstHisIndex);
				var now = (new Date()).getTime();
				if (FlagAsyn) {
					var str = player.playerObj.GetVideoAttribute(index);
					if (str !== "ERROR" && JSON.parse(str).videoType == 2) {
						self.playSingleSeek(player, index, now, Time);
					}
				}
			}
		},
		/**
		 * [getHistoryPlayTime 获取某一个播放历史录像的分屏的播放的时刻，返回毫秒]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[数字]}   index [分屏序号]
		 * @return {[数字]}         [播放历史的时间]
		 */
		getHistoryPlayTime: function(player, index) {
			var self = this;
			//var player = self.player;
			var Data = window.SelectCamera.ListData[index];
			var beginTime = Data.beginTime;
			var endTime = Data.endTime;
			var T = player.playerObj.GetPlayTime(index);
			return beginTime + T;
		},
		/**
		 * [frameTagNames 获取帧标记名称] 此函数在当前文件中没有被使用到，判断是否要被删除，added by yangll
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[对象]}   obj [json 参数 获取所有帧标记名称，则参数为空{}，获取自己的则为{onlySelf:true}]
		 * @param  {Function} fn  [回调参数]
		 */
		frameTagNames: function(obj, fn) {
			jQuery.ajax({
				url: '/service/frame/frameTagNames', //onlySelf=true,false
				dataType: 'json',
				type: 'get',
				cache: false,
				data: obj,
				success: function(res) {
					if (res && res.code === 200) {
						fn(res.data);
					} else {
						notify.warn('获取失败！');
					}
				}
			});
		},
		/**
		 * [getOrder 计算时间T在ListData数组里记录时间列表中的顺序;]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[数字]}   T     [指定时间]
		 * @param  {[数字]}   index [窗口索引]
		 * @return {[数字]}         [T在ListData数组里记录时间列表中的顺序;]
		 */
		getOrder: function(T, player, index) {
			var self = this;
			//var player = self.player;
			var obj = player.getFirstHisIndex(index);
			var hisK = obj.count;

			var Time = this.getHistoryPlayTime(player, obj.index);
			var ListData = window.SelectCamera.ListData;
			if (ListData[index].searchData) {
				var videos = ListData[index].searchData.videos;
			} else {
				var videos = window.SelectCamera.searchData.videos;
			}
			var L = videos.length;
			var K = L - 1;
			var FlaginSet = (T >= videos[0][0] && T < videos[L - 1][1]); //播放时间在历史片段集合里；
			if (FlaginSet) {
				for (var i = L - 1; i >= 0; i--) {
					if (T >= videos[i][0]) {
						K = i;
						break;
					}
				}
				return K;
			} else {
				return -1;
			}
		},
		/**
		 * [ShowServerRecordIcon 启动服务器录像，显示按钮状态;]
		 * @author huzc
		 * @date   2015-03-04
		 */
		ShowServerRecordIcon: function() {
			var self = this;
			var player = self.player;
			var curObj = player.cameraData[player.curChannel - 0];
			var playingCameraId, playingChannelId;
			if (typeOf(curObj) !== 'object') {
				return;
			}
			if (curObj.playingChannel) { //经典模式
				playingCameraId = curObj.cId;
				playingChannelId = curObj.playingChannel.id;
			} else { //监巡轮巡
				playingCameraId = curObj.cameraId;
				playingChannelId = curObj.cId;
			}
			self.getServerRecordStatus(playingCameraId, playingChannelId, function(flag) {
				//0为启动，其他为未启动
				if (flag) {
					jQuery('.local-video').addClass('active');
					jQuery('.local-video').attr('title', '停止服务器录像');
				} else {
					jQuery('.local-video').removeClass('active');
					jQuery('.local-video').attr('title', '启动服务器录像');
				}
			});
		},
		/**
		 * [getServerRecordType 获取服务器录像状态]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[数字]}   cameraId  [摄像机id]
		 * @param  {[数字]}   channelId [通道id]
		 * @param  {Function} callback  [回调]
		 */
		getServerRecordType: function(cameraId, channelId, callback) {
			jQuery.ajax({
				url: "/service/ptz/videoStatus",
				dataType: "json",
				type: "get",
				cache: false,
				data: {
					"cameraId": cameraId,
					"channelId": channelId
				},
				success: function(res) {
					if (res && res.code === 200) {
						//0是启动，其他是未启动【pvg68830】
						var isRecording = (res.data.isRecording === 0);
						if (callback) {
							callback(isRecording, true)
						}
					} else {
						if (callback) {
							callback(null, false)
						}
					}
				}
			});
		},
		/**
		 * [updateLockMonopolyStatus description]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[type]}   lockStatus     [description]
		 * @param  {[type]}   monopolyStatus [description]
		 * @param  {[type]}   index          [description]
		 * @return {[type]}                  [description]
		 */
		updateLockMonopolyStatus: function(lockStatus, monopolyStatus, index) {
			var $lock = jQuery('#lockPtz');
			var $monopoly = jQuery('#engrossPtz');
			if (gVideoPlayer) {
				var data = gVideoPlayer.cameraData[index];
				if (data !== undefined) {
					data['isLocked'] = lockStatus;
					data['isMonopoly'] = monopolyStatus;
				}
			}

			if (lockStatus) {
				$lock.addClass('checked');
			} else {
				$lock.removeClass('checked');
			}
			if (monopolyStatus) {
				$monopoly.addClass('checked');
			} else {
				$monopoly.removeClass('checked');
			}
		},
		/**
		 * [lockUI 锁定动作之后的UI 相对于“轮巡” ]
		 * @author Mayue
		 * @date   2015-05-15
		 * @param  {[type]}   index [description]
		 * @return {[type]}         [description]
		 */
		lockUI: function(index) {
			var self = this;
			self.pauseUI(index);
			jQuery("#downBlockContent .lockunlock").addClass("unlock-channel").show();
		},
		/**
		 * [unlockUI 解锁动作之后的UI  相对于“轮巡”  ]
		 * @author Mayue
		 * @date   2015-05-20
		 * @param  {[type]}   index [description]
		 * @return {[type]}         [description]
		 */
		unlockUI: function(index) {
			var self = this;
			self.runingUI(index);
			//此处的‘unlock-channel’和‘lock-channel’类名代表的是动作不是状态	 所以前者代表锁关闭的图标  后端代表锁打开的图标
			jQuery("#downBlockContent .lockunlock").show().removeClass("unlock-channel").addClass("lock-channel");
		},
		/**
		 * [pauseUI 监巡暂停时的UI  相对于“监巡”   和runingUI函数相反]
		 * @author Mayue
		 * @date   2015-05-20
		 * @return {[type]}   [description]
		 */
		pauseUI: function(index) {
			var self = this;
			/*if (permission.klass['set-preset']) {
				if (this.player.cameraData[index].cType===1) {
					jQuery('#downBlockContent .add-preset-point').show();
				}else{
					jQuery('#downBlockContent .add-preset-point').hide();
				}
			}else{
				jQuery('#downBlockContent .add-preset-point').hide();
			}*/
			self.displayBtnsByCameraType();
			jQuery("#upBlockContent .tools-up .zoom").show();
			jQuery("#printScreen").show();
			jQuery("#printScreen2").show();
			jQuery('#upBlockContent .tools-up .color-adjust').show();
			jQuery("#upBlockContent .tools-up .frame-mark").show();
			jQuery("#upBlockContent .tools-up .zoom").show();
			jQuery("#upBlockContent .tools-up .share").show();
			jQuery("#upBlockContent .tools-up .location-play").show();
			jQuery('#downBlockContent .video-type,#downBlockContent .alarm').show();
			jQuery('#ratio .definition, #ratio .line, #downBlockContent .video-type').show();
			jQuery("#downBlockContent .tools-dwon .real-sound").show();
			jQuery("#downBlockContent .tools-dwon .real-talk").show();
			//对语音对讲进行特殊处理
			self.setTalkSoundLayout(index);
			//加入权限判断
			if (!permission.klass["view-history"]) {
				console.log("没有历史录像权限");
				permission.reShow("#downBlockContent .video-type", function() {
					console.log("隐藏历史录像按钮");
				});
			}
		},
		/**
		 * [runingUI 监巡非暂停时的UI  相对于“监巡”   和pauseUI函数相反]
		 * @author Mayue
		 * @date   2015-05-20
		 * @return {[type]}   [description]
		 */
		runingUI: function(index) {
			this.displayBtnsByCameraType(false);
			jQuery("#printScreen").hide();
			jQuery("#printScreen2").hide();
			jQuery('#upBlockContent .tools-up .color-adjust').hide();
			jQuery("#upBlockContent .tools-up .frame-mark").hide();
			jQuery("#upBlockContent .tools-up .zoom").hide();
			jQuery("#upBlockContent .tools-up .share").hide();
			jQuery("#upBlockContent .tools-up .location-play").hide();
			jQuery('#downBlockContent .add-preset-point').hide();
			jQuery('#downBlockContent .video-type,#downBlockContent .alarm').hide();
			jQuery('#ratio .definition, #ratio .line, #downBlockContent .video-type').hide();
			jQuery("#downBlockContent .tools-dwon .real-sound").hide();
			jQuery("#downBlockContent .tools-dwon .real-talk").hide();
			//jQuery("#selectBlockContent .share [data-type='1']").addClass('disabled');//发送到扩展屏不可用
		},
		/**
		 * [judgePermissionPtz description]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[type]}   cameraID [description]
		 * @param  {[type]}   index    [description]
		 * @return {[type]}            [description]
		 */
		judgePermissionPtz: function(cameraID, index) {
			var self = this;
			var userID = jQuery('#userEntry').attr('data-userid');
			if (self.player && self.player.cameraData && self.player.cameraData[index] && self.player.cameraData[index].cType && self.player.cameraData[index].cType === 1) {
				jQuery.when(gPTZService.checkLock({
					"cameraId": cameraID
				}), gPTZService.checkMonopoly({
					"cameraId": cameraID
				})).done(function(lockRes, monopolyRes) {
					if (lockRes[0].code === 200 && monopolyRes[0].code === 200) {
						var lockData = lockRes[0].data;
						var monopolyData = monopolyRes[0].data;
						var lockStatus = lockData.lock; //"1"锁定  "0"未锁定
						var monopolyStatus = monopolyData.status; // "1"未独占  "0"独占
						var flag = false;

						var lockStatusTem = lockStatus === '1' ? true : false;
						var monopolyStatusTem = monopolyStatus === '0' ? true : false;

						self.updateLockMonopolyStatus(lockStatusTem, monopolyStatusTem, index);

						//未锁定  未独占时
						if (lockStatus === '0' && monopolyStatus === '1') {
							flag = true;
							//self.player.switchPTZ(true, index);
						} else { //独占或者锁定至少有一个发生时（操作）
							//只有当上面操作是当前用户自己执行的，且自己没有锁定时，才执行下面代码(即可以控制云台)
							if (lockData.userId === parseInt(userID) || monopolyData.userId === parseInt(userID)) {
								if (lockStatus === '0') {
									flag = true;
									//self.player.switchPTZ(true, index);
								}
							}
						}
						self.player.switchPTZ(flag, index);
					}
				})
			}
		},
		/**
		 * [setServerRecordStatus 获取服务器录像状态]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[type]}   obj [description]
		 */
		setServerRecordStatus: function(obj) {
			jQuery.ajax({
				url: "/service/ptz/" + (obj.isRecording ? "stop_video" : "start_video"),
				dataType: "json",
				type: "get",
				data: {
					cameraId: obj.cameraId,
					channelId: obj.channelId
				},
				success: function(res) {
					if (res && res.code === 200) {
						if (obj.callback) {
							obj.callback(obj.isRecording);
						}
					} else if (res && res.code === 500) {
						notify.warn(res.data.message);
					} else {
						var name = obj.isRecording ? "停止" : "启动";
						notify.warn(name + "服务器录像失败！");
					}
				}
			});
		},
		/**
		 * [repairData 修补cameraData数据,该接口极其重要]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[数字]}   id    [摄像机id]
		 * @param  {[数字]}   index [分屏序号]
		 */
		repairData: function(id, index, player) {
			var self = this;
			if (typeof(player.cameraData[index]) != "object") {
				return;
			}
			player.getCameraDataById(id, index, function(data) {
				player.cameraData[index].cStatus = data.cameraInfo.camera_status;
				player.cameraData[index].cCode = data.cameraInfo.cameraCode;
				player.cameraData[index].cType = data.cameraInfo.camera_type;
			}, 5000);
		},
		/**
		 * [showStreamRate 播放器界面显示流量]
		 * @author huzc
		 * @date   2015-03-04
		 */
		showStreamRate: function() {
			var self = this;
			var player = self.player;
			var index = player.curChannel;
			var Flag = player.playerObj.GetVideoAttribute(index);
			if (Flag !== "ERROR") {
				var tmp = player.getPlaySpeed(index);
				jQuery('#downBlockContent .times-play').text('x' + tmp);
				if (self.streamRateTimer) {
					clearInterval(self.streamRateTimer);
				}
				var text = window.SelectCamera && window.SelectCamera.ListData[index].times;
				if (text) {
					jQuery('#downBlockContent .times-play').text('x' + text);
				}
				self.streamRateTimer = setInterval(function() {
					self.getStreamMonitor(player);
					if (window.SelectCamera) {
						var text = window.SelectCamera && window.SelectCamera.ListData[index].times;
						if (text) {
							jQuery('#downBlockContent .times-play').text('x' + text);
						}
					}

				}, 1000); //每1秒刷新一次码流速率
			} else {
				jQuery('#streamMonitor').text('');
			}
		},
		/**
		 * [showTitle description]
		 * @author Mayue
		 * @date   2015-05-11
		 * @param  {[type]}   name [description]
		 * @param  {[type]}   code [description]
		 * @return {[type]}        [description]
		 */
		showTitle: function(name, code) {
			var title;
			if (code) {
				title = name + "(" + code + ")";
			} else {
				title = name;
			}
			jQuery('#upBlockContent .video-title').attr("title", title);
			jQuery('#upBlockContent .video-title').text(title);
		},
		/**
		 * [uploadImage 抓图上传] 
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[对象]}   data  [上传参数]
		 * @param  {[数字]}   index [分屏序号]
		 * @param  {Function} fn    [回调参数]
		 */
		uploadImage: function(data, index, fn) {
			var self = this;
			jQuery.ajax({
				url: '/service/pcm/add_screenshot',
				type: 'post',
				dataType: 'json',
				data: data,
				beforeSend: function() {
					//jQuery(".picture-dialog footer input").addClass('disabled');
				},
				success: function(res) {
					if (res.code === 200) {
						/*var index = jQuery(".picture-dialog img").attr('data-index');*/
						self.uploadedImg.push(parseInt(index));
						if (self.originPic[index]) {
							self.originPic[index].status = true;
							if (typeof(fn) == "function") {
								fn(self.uploadedImg, self.originPic, index);
							}
						}
						//jQuery(".picture-dialog footer input").removeClass('disabled').addClass('isuploader').val('已上传');
						notify.success('图片上传成功！');


					} else {
						notify.error('上传失败，请检查您的网络连接！');
					}
				},
				error: function() {
					//jQuery(".picture-dialog footer input").removeClass('disabled');
					notify.error('请检查您的网络连接！');
				}
			});
		},
		/**
		 * [presetUI 预置位按钮权限控制特殊处理]
		 * @author huzc
		 * @date   2015-03-04
		 * @param  {[数字]}   index [分屏序号]
		 */
		presetUI: function(index) {
			var self = this;
			var player = self.player;
			permission.reShow("#downBlockContent", function() {
				//预置位的特殊处理
				if (permission.klass["set-preset"]) {
					if (player.cameraData[index].cType === 1) {
						jQuery('#downBlockContent .add-preset-point').show();
					} else {
						jQuery('#downBlockContent .add-preset-point').hide();
					}
				} else {
					jQuery('#downBlockContent .add-preset-point').hide();
				}
				self.adaptiveDisplayIco();
			});
		},
		/**
		 * [getPlayTime 播放历史的时候取播放时间]
		 * @author huzc
		 * @date   2015-03-09
		 * @param  {[数字]}   time   [时间]
		 * @param  {[对象]}   player [播放器对象]
		 * @param  {[数字]}   index  [分屏序号]
		 * @return {[数字]}          [时间]
		 */
		getPlayTime: function(time, player, index) {
			var time = time;
			var self = this;
			var player = self.player = player;
			var attrstr = player.playerObj.GetVideoAttribute(index);
			if (attrstr != "ERROR") {
				var videoType = JSON.parse(attrstr).videoType;
				if (videoType == 2) {
					var T = player.getPlayTime(index) - 0;
					//var delta=window.SelectCamera.ListData[index].timePoint;
					var beginTime = window.SelectCamera && window.SelectCamera.ListData[index].beginTime;
					time = Toolkit.formatDate(new Date(beginTime + T));
				}
			}
			return time;
		},
		/**
		 * [updataInspect 更新controlbar中给的inspect实例]
		 * @author Mayue
		 * @date   2015-04-28
		 * @param  {[type]}   inspectInstance [description]
		 * @return {[type]}                   [description]
		 */
		updataInspect: function(inspectInstance) {
			this.inspect = inspectInstance;
		},
		/**
		 * [getInspectStatus 监巡判定]
		 * 该函数依赖于updataInspect的执行。
		 * @author Mayue
		 * @date   2015-04-23
		 * @return {[type]}   [返回值参看下面注释]
		 *{
		 *	isGoing : Boolean  (false:监巡或者轮巡未启动,下面2个属性将不存在，true:监巡或者轮巡启动中)
		 * 	type : Boolean  (false:监巡，true:轮巡)
		 *  action : Boolean  (对于监巡：该值代表暂停true或者未暂停false    对于轮巡：该值代表锁定true或者未锁定false)
		 *}
		 */
		getInspectStatus: function(index) {
			return this.inspect ? this.inspect.getInspectStatus(index) : {
				'isGoing': false
			};
		},
		/**
		 * [setPositon description]
		 * @author huzc
		 * @date   2015-05-12
		 * @param  {[type]}   enable      [description]
		 * @param  {[type]}   player      [description]
		 * @param  {[type]}   dbChannel   [description]
		 * @param  {[type]}   setPlayerUI [description]
		 */
		setPositon: function(enable, player, dbChannel, setPlayerUI) {
			var self = this;
			var str = player.playerObj.GetVideoAttribute(dbChannel) + "";
			if (str == "ERROR") { /*notify.warn("窗口无录像");*/
				self.setControlBarPos(player, dbChannel);
			} else {
				var jsonobj = JSON.parse(str);
				if (jsonobj.videoType == 1) { //播放实时流
					var definitionType = player.cameraData[dbChannel].definitionType; //definitionType  0:标清  1:高清
					//没有高清通道不切换
					var hasHD = false;
					var hdChannel = player.cameraData[dbChannel].hdChannel;

					self.setControlBarPos(player, dbChannel, enable);
					//全局变量needSwitchVideoStream是判断是否需要切换码流  标/高清码流   by    zhangxinyu   2015-9-15
					if (window.needSwitchVideoStream) {
						if (player.curMaxWinChannel === -1 && definitionType !== 0) {
							player.switchDefinition(dbChannel, 0, true);
						} else if (player.curMaxWinChannel !== -1 && definitionType !== 1) {
							player.switchDefinition(dbChannel, 1, true);
						}
					}
					if (enable) {
						self.setPicList();
					}

				} else if (jsonobj.videoType == 2) {
					setPlayerUI(dbChannel);
				}
			}
		},
		/**
		 * [previewPanel 处理抓图显示面板, 遍历通道数组，看是否有通道处于抓图状态，若有，则不显示抓图按钮]
		 * @author huzc
		 * @date   2015-05-12
		 * @return {[type]}   [description]
		 */
		previewPanel: function(player) {
			var previewPanel = jQuery(".screenshot-preview") /*.removeClass("show")*/ ;
			for (var t = 0; t < player.cameraData.length; t++) {
				if (player.cameraData[t] !== -1 && player.cameraData[t].picFlag === true) { //有抓图
					if (t !== player.curChannel) { //当前聚焦通道没有抓图
						jQuery("#printScreen").hide();
						jQuery("#printScreen2").hide();

						jQuery("#downBlock").removeClass("printscreen");
						previewPanel.hide();
					} else { //当前聚焦通道为抓图通道
						jQuery("#printScreen").show();
						jQuery("#printScreen2").show();
						jQuery("#downBlock").addClass("printscreen");
						previewPanel.show();
					}
					break;
				} else { //没有抓图
					jQuery("#downBlock").removeClass("printscreen");
					previewPanel.hide();
				}
			}
		},
		/**
		 * OCX中的鼠标事件，用于显示ocx工具栏和云台控制按钮
		 * @Author zhangyu
		 * @Date   2015-10-16T22:25:38+0800
		 * @param  {[type]}                 curChannel [鼠标事件回传的当前所在屏的索引]
		 * @return {[type]}                            [description]
		 */
		ocxMouseEventDeal: function(curChannel) {
			var self = this,
				//读取轮巡状态
				inspectStatus = self.getInspectStatus(curChannel - 0),
				//将当前鼠标所在通道号赋值给全局变量player.curChannel
				index = self.player.curChannel = curChannel,
				//获取当前屏的摄像机数据
				cameraData = self.player.cameraData[curChannel];
			//现在后端的云台控制权限是跟摄像机直接关联，permission接口不返回云台控制权限了，所以把此处的判断去掉
		//	if (window.permission.klass["ptz-control"]) {
				self.player.ptzRedArrow(curChannel - 0);
		//	}

			//如果截图功能打开状态，在鼠标移动 遮挡层不移动位置
			if (jQuery(".screenshot-preview").is(":visible")) {
				return;
			}
			//该属性是在发送扩展屏时添加的，因为有些窗口需要保存数据，但是鼠标进入又不要工具条，所以添加该属性判断
			if (cameraData.isSend === true) {
				return;
			}
			//ocx工具栏记录当前屏索引
			jQuery("#videoControl").data("index", self.player.curChannel);
			//在线状态,采用GetVideoAttribute判断当前通道是否在播放
			self.showStreamRate();
			self.showTitle(cameraData.cName, cameraData.cCode);
			//隐藏 #selectBlock
			self.hidSelectBlock();
			if (cameraData.zoomType === 0) {
				jQuery(".tools-up i.zoom").addClass('clicked');
			} else {
				jQuery(".tools-up i.zoom").removeClass('aa clicked');
			}
			//清除三角标志
			jQuery('.flag').removeClass('active');
			//初始化控制参数
			self.initControlParam();
			//关闭截图图片展示区域
			if (jQuery("#picbox").html() === "") {
				jQuery('.screenshot-preview .exit').trigger('click');
			}
			// 遍历通道数组，看是否有通道处于抓图状态，若有，则不显示抓图按钮
			self.previewPanel(self.player);
			//如果当前通道没有视频，就将其隐藏，该逻辑不能放在上面，不然在关闭一个视频后，遮挡层不能正确消失
			if (self.player.cameraData[curChannel] === -1 || self.player.cameraData[curChannel].zoomSrcChannel !== undefined) {
				jQuery('.video-control').css('left', 10000); //使遮挡层消失
				player.curChannel = -1; //恢复默认值
			}
			if (!self.player.cameraData[self.player.curChannel - 0].hdChannel) {
				// 监巡进行中隐藏标清和高清的切换  隐藏历史调阅按钮
				jQuery('#ratio .definition, #ratio .line, #downBlockContent .video-type').hide();
			} else {
				jQuery('#ratio .definition, #ratio .line, #downBlockContent .video-type').show();
			}

			//当当前窗口index===4时，“中心画面”的图标隐藏 by songxj
			if (curChannel === "4") {
				jQuery(".center-icon").css("visibility", "hidden");
			} else {
				jQuery(".center-icon").css("visibility", "visible");
			}

			// GPU:  所有视频窗口GPU图标的显示、隐藏 by songxj
			if (self.initCheckIsSupportGPU()) { // 改sxj
				jQuery("#upBlockContent .tools-up i.gpu").css("visibility", "visible");
			} else {
				jQuery("#upBlockContent .tools-up i.gpu").css("visibility", "hidden");
			}


			// GPU: 设置所有视频窗口的GPU图标状态 by songxj
			var currentWinIndexByGPU = self.player.curChannel, // 当前窗口index
				currentCameraByGPU = self.player.cameraData[currentWinIndexByGPU],
				hwdecoderByGPU = self.getSingleVideoGPUHwdecoderValue(currentCameraByGPU),
				$totalGPUBt = jQuery("#major .header .ui.menu.atached .item i.icon.gpu"),
				$GPUIcon = jQuery("#upBlockContent .tools-up i.gpu"),
				curWindowAddClass,
				curWindowRemoveClass,
				curWindowAttrTitle,
				otherWindowAddClass,
				otherWindowRemoveClass,
				otherWindowAttrTitle;

			if (typeof hwdecoderByGPU !== "undefined") { // 单独操作视频窗口
				if (hwdecoderByGPU === 1) { // 当前的GPU状态是开启
					curWindowAddClass = "closeGPU";
					curWindowRemoveClass = "startGPU";
					curWindowAttrTitle = "关闭硬件加速（GPU）";

					// 音频播放 (开启硬解,视频色彩调节、数字放大、慢放、快放、单帧播放,这些功能均可用) 隐藏掉
					self.setUsedGPUDisabledControlBarIconShowOrHide(false);
				} else if (hwdecoderByGPU === 0) { // 当前的GPU状态是关闭
					curWindowAddClass = "startGPU";
					curWindowRemoveClass = "closeGPU";
					curWindowAttrTitle = "开启硬件加速（GPU）";

					// 音频播放 (开启硬解,视频色彩调节、数字放大、慢放、快放、单帧播放,这些功能均可用)  显示
					self.setUsedGPUDisabledControlBarIconShowOrHide(true);
				}
				$GPUIcon.removeClass(curWindowRemoveClass).addClass(curWindowAddClass).attr("title", curWindowAttrTitle);
			} else { // 根据上方总的GPU按钮状态进行设置
				if ($totalGPUBt.hasClass("startGPU")) { // 当前的GPU状态是关闭
					otherWindowAddClass = "startGPU";
					otherWindowRemoveClass = "closeGPU";
					otherWindowAttrTitle = "开启硬件加速（GPU）";

					// 音频播放 (开启硬解,视频色彩调节、数字放大、慢放、快放、单帧播放,这些功能均可用)  显示
					self.setUsedGPUDisabledControlBarIconShowOrHide(true);
				} else if ($totalGPUBt.hasClass("closeGPU")) { // 当前的GPU状态是开启
					otherWindowAddClass = "closeGPU";
					otherWindowRemoveClass = "startGPU";
					otherWindowAttrTitle = "关闭硬件加速（GPU）";

					// 音频播放 (开启硬解,视频色彩调节、数字放大、慢放、快放、单帧播放,这些功能均可用)  隐藏掉
					self.setUsedGPUDisabledControlBarIconShowOrHide(false);
				}
				$GPUIcon.removeClass(otherWindowRemoveClass).addClass(otherWindowAddClass).attr("title", otherWindowAttrTitle);
			}

			var frameMarkcontent = jQuery("#downBlockContent .videoProgress .frameMarkcontent");
			frameMarkcontent.html("");
			//设置ocx工具栏按钮
			self.setPlayerUI(curChannel);
		},
		/**
		 * 鼠标移入ocx区域时的处理逻辑
		 * @Author zhangyu
		 * @Date   2015-10-20T17:10:24+0800
		 * @param  {[type]}                 evt [description]
		 * @return {[type]}                     [description]
		 */
		onMouseLeaveEventDeal: function(evt) {
			var self = this,
				playerX = jQuery('.screen').offset().left,
				playerY = jQuery('.screen').offset().top;
			//IE8下当鼠标移至输入法上面时pageX值是-3
			if (evt.pageX !== -3 && evt.pageX !== -1) {
				//隐藏 #selectBlock
				self.hidSelectBlock();
				//如果截图功能打开状态，在鼠标移动 遮挡层不移动位置
				if (!jQuery(".screenshot-preview").is(":visible")) {
					//使遮挡层消失
					jQuery('.video-control').css('left', 10000);
				}
				//恢复默认值
				self.player.curChannel = -1;
				//清除非抓图状态下的速率计时器
				if (self.streamRateTimer) {
					clearInterval(self.streamRateTimer);
					self.streamRateTimer = null;
				}
			}
		},
		/**
		 * 寻找当前能用的通道
		 * 主要是解决返回字段已不一致的问题，如sdChannel/sdchannel
		 * @return {[type]} [description]
		 */
		findRealChannel: function(cameraObj) {
			var sdChannel = cameraObj.sdChannel || cameraObj.sdchannel,
				hdChannel = cameraObj.hdChannel || cameraObj.hdchannel;
			//返回可用通道
			return ((sdChannel.length === 0) ? hdChannel[0] : sdChannel[0]);
		},
		/**
		 * 对语音及对讲按钮的显示进行支持性判断
		 * @param {[type]} index [description]
		 */
		setTalkSoundLayout: function(index) {
			var self = this,
				curObj = self.player.cameraData[index],
				$soundObj = jQuery(".tools-dwon .real-sound"),
				$talkObj = jQuery(".tools-dwon .real-talk");
			//找到播放通道
			if (!curObj) {
				return;
			}
			//var playChannel = self.findRealChannel(curObj);
			////因组织树加载时间长，因后端联查了摄像机是否支持语音对讲，现不联查是否支持语音对讲，在点击语音对讲时查询该摄像机是否支持语音对讲 by zhangxinyu
			//判断是否支持对讲
			// if (!playChannel.audioName) {
			// 	jQuery(".tools-dwon .real-talk").hide();
			// }
			//判断语音对讲状态
			var curTalkObj = self.player.playerObj.GetOption(JSON.stringify({
					"talkback": {
						"pos": index
					}
				})),
				curTalkStatus = JSON.parse(curTalkObj);
			if (curTalkStatus.talkback.status === 1) {
				$talkObj.addClass("real-talk-off");
			} else {
				$talkObj.removeClass("real-talk-off");
			}
			//判断声音接入状态
			if (self.player.playerObj.IsSoundEnable(index) === 1) {
				$soundObj.addClass("real-sound-off");
			} else {
				/**
				 * 判断当前情况下是否需要开启声音
				 * 实时--》历史--》实时这种情况下，声音开启状态不能保存，故在cameraData中添加了issoudin字段，标记是否开启
				 * 从历史切换回实时后，根据此字段进行开启
				 */
				if (self.player.cameraData[index].isSoundIn) {
					self.player.playerObj.SoundEnable(true, index);
				} else {
					$soundObj.removeClass("real-sound-off");
				}
			}
		},
		/**
		 * [setUsedGPUDisabledControlBarIconShowOrHide 设置当使用GPU模式后，controlBar部分不可用图标的显示隐藏]
		 * @author songxj
		 * @param {[type]} flag [true: 显示 false:隐藏]
		 */
		setUsedGPUDisabledControlBarIconShowOrHide: function(flag) {
			var $realSound = jQuery("#downBlockContent .tools-dwon i.real-sound"); // 音频播放

			if (flag) { // 音频播放 显示
				$realSound.css("visibility", "visible");
			} else {
				// 音频播放 隐藏掉
				$realSound.css("visibility", "hidden");
			}
		},
		/**
		 * [initCheckGPU 检测是否支持GPU]
		 * @author songxj
		 * @return {[type]} [true:支持GPU false:不支持GPU]
		 */
		initCheckIsSupportGPU: function() {
			var self = this,
				$gpuBt = jQuery("#npplay .ui.atached.menu i.icon.gpu"),
				option = self.player.getOption(JSON.stringify({
					"hwdecoder": ""
				})),
				hwdecoder = JSON.parse(option).hwdecoder,
				isSupportGPU = hwdecoder.support; // 1:支持 0:不支持
			if (isSupportGPU) { // 支持  改1
				$gpuBt.removeClass("disabled");
				return true;
			} else { // 不支持
				$gpuBt.addClass("disabled");
				return false;
			}
		},
		/**
		 * [refreshAllPalyVideoData 刷新所有的播放的视频数据]
		 * @author songxj
		 */
		refreshAllPalyVideoData: function() {
			var self = this,
				player = self.player,
				cameraDatas = player.cameraData,
				playIndex,
				playModel,
				historyData;

			// 重新播放视频
			for (var i = 0; i < cameraDatas.length; i++) {
				(function(index) {
					if (cameraDatas[index] !== -1) {
						// 刷新单个视频数据
						self.refreshSinglePalyVideoData(cameraDatas[index], index);
					}
				})(i);
			}
		},
		/**
		 * [refreshSinglePalyVideoData 刷新单个视频数据]
		 * @author songxj
		 * @param  {[type]} cameraData  [摄像机数据]
		 * @param  {[type]} windowIndex [播放窗口index]
		 */
		refreshSinglePalyVideoData: function(cameraData, windowIndex) {
			var self = this,
				player = self.player,
				playModel,
				historyData;
			// 检测当前播放模式 历史还是实时
			playModel = self.checkCurrentPlayIsHistoryOrRealtime(windowIndex);
			// 停止播放视频
			//player.stopStream(windowIndex);
			if (playModel === 1) { // 实时
				player.playSH(cameraData, windowIndex);
			} else if (playModel === 2) { // 历史
				historyData = cameraData.history;
				self.PlayNextPiece(player, windowIndex, historyData.order, historyData.beginTime, historyData.endTime);
			}
		},
		/**
		 * [getSingleVideoGPUHwdecoderValue 获取单个视频GPU的标识hwdecoder]
		 * @author songxj
		 * @param  {[type]} cameraData [摄像机数据]
		 * @return {[type]}            [hwdecoder]
		 */
		getSingleVideoGPUHwdecoderValue: function(cameraData) {
			var sdChannel = cameraData.sdChannel || cameraData.sdchannel,
				hdChannel = cameraData.hdChannel || cameraData.hdchannel;
			if (sdChannel.length !== 0) {
				return sdChannel[0].hwdecoder;
			} else if (hdChannel.length !== 0) {
				return hdChannel[0].hwdecoder;
			}
			return undefined;
		},
		/**
		 * [setSingleVideoGPUHwdecoderValue 设置单个视频GPU的标识hwdecoder]
		 * @author songxj
		 * @param {[type]} cameraData [摄像机数据]
		 * @param {[type]} hwdecoder  [hwdecoder]
		 */
		setSingleVideoGPUHwdecoderValue: function(cameraData, hwdecoder) {
			if (cameraData.sdChannel.length !== 0) {
				cameraData.sdChannel[0].hwdecoder = hwdecoder;
			} else if (cameraData.hdChannel.length !== 0) {
				cameraData.hdChannel[0].hwdecoder = hwdecoder;
			}

			try {
				if (cameraData.sdchannel.length !== 0) {
					cameraData.sdchannel[0].hwdecoder = hwdecoder;
				} else if (cameraData.hdchannel.length !== 0) {
					cameraData.hdchannel[0].hwdecoder = hwdecoder;
				}
			} catch (e) {

			}
		},
		/**
		 * [setSingleVideoGPU 设置单个视频GPU]
		 * @author songxj
		 * @param {[type]} $this [视频controlbar上的GPU图标]
		 */
		setSingleVideoGPU: function($this) {
			var self = this,
				player = self.player,
				currentWinIndex = player.curChannel, // 当前窗口index
				currentCamera = player.cameraData[currentWinIndex],
				playModel; // 当前窗口的摄像机数据

			if ($this.hasClass("startGPU")) { // 开启GPU硬解
				// 设置启用GPU硬解参数 1: 启用GPU硬解
				// 先隐藏掉ocx
				jQuery(".screen").css({
					"visibility": "hidden"
				});
				//隐藏ocx工具栏【bug41020，add by zhangyu, 2016.04.13】
				jQuery('.video-control').css('left', 10000);
				// 弹框进行风险提示
				var GPUDialog = new ConfirmDialog({
					title: "风险提示",
					message: "启用硬解加速，会显著降低视频显示对系统资源的消耗，可能会发生小概率蓝屏现象，确认开启吗？",
					width: 360,
					callback: function() {
						self.setSingleVideoGPUHwdecoderValue(currentCamera, 1);
						// 刷新当前视频数据
						self.refreshSinglePalyVideoData(currentCamera, currentWinIndex);
					},
					prehide: function() {
						// 显示ocx
						setTimeout(function() {
							jQuery(".screen").css({
								"visibility": "visible"
							});
						}, 100);
					}
				});
			} else if ($this.hasClass("closeGPU")) { // 关闭GPU硬解
				// 设置启用GPU硬解参数 0: 关闭GPU硬解
				self.setSingleVideoGPUHwdecoderValue(currentCamera, 0);
				// 刷新当前视频数据
				self.refreshSinglePalyVideoData(currentCamera, currentWinIndex);
			}
		},
		/**
		 * [initSetAllSingleVideoGPUParam 初始化设置所有单个视频的GPU参数hwdecoder]
		 * @author songxj
		 */
		initSetAllSingleVideoGPUParam: function() {
			var self = this,
				player = self.player,
				cameraDatas = player.cameraData,
				currentCamera,
				hwdecoder;
			for (var i = 0; i < cameraDatas.length; i++) {
				(function(index) {
					currentCamera = cameraDatas[index];
					if (currentCamera !== -1) {
						hwdecoder = self.getSingleVideoGPUHwdecoderValue(currentCamera);
						if (typeof hwdecoder !== "undefined") {
							self.setSingleVideoGPUHwdecoderValue(currentCamera, undefined);
						}
					}
				})(i);
			}

		},
		/**
		 * [checkCurrentPlayIsHistoryOrRealtime 检测当前播放模式是历史还是实时]
		 * @author songxj
		 * @param  {[type]} windowIndex [窗口Index]
		 * @return {[type]}             [1:实时流 2:历史]
		 */
		checkCurrentPlayIsHistoryOrRealtime: function(windowIndex) {
			var self = this,
				player = self.player,
				historyOrRealtimeStr = player.playerObj.GetVideoAttribute(windowIndex) + "",
				historyOrRealtimeObj;

			if (historyOrRealtimeStr !== "ERROR") {
				historyOrRealtimeObj = JSON.parse(historyOrRealtimeStr);
				return historyOrRealtimeObj.videoType;
			}
		},
		/**
		 * [confirmStartGPUEvent 确定开启GPU硬解事件]
		 * @author songxj
		 */
		confirmStartGPUEvent: function() {
			var self = this,
				startGPUReturnValue = self.player.setOption(JSON.stringify({
					"hwdecoder": {
						"mode": "all"
					}
				})),
				historyOrRealtimeFlag; // 当前播放的是历史还是实时视频
			// 开启GPU硬解模式
			if (startGPUReturnValue === 0) { // 成功 改2sxj
				// 刷新播放的视频，以切换到GPU模式
				self.refreshAllPalyVideoData();
				// gpu按钮文字改为“关闭GPU硬解”
				jQuery("i.icon.gpu").removeClass("startGPU").addClass("closeGPU").css("background-position", "0 -64px").attr("title", "关闭GPU硬解");
				// 单个视频上的GPU图标改为“当前状态是开启”（即可进行关闭动作）
				self.initSetAllSingleVideoGPUParam();
				jQuery("#upBlockContent .tools-up i.gpu").removeClass("startGPU").addClass("closeGPU").attr("title", "关闭GPU硬解");
				// 提示成功
				//notify.warn("启用GPU硬解成功！");
				console.log("启用GPU硬解成功！");
			} else { // 失败
				// 提示失败
				//notify.warn("启用GPU硬解失败！");
				console.log("启用GPU硬解失败！");
			}
		},
		/**
		 * [closeGPUEvent 关闭GPU硬解事件]
		 * @author songxj
		 */
		closeGPUEvent: function() {
			var self = this,
				closeGPUReturnValue = self.player.setOption(JSON.stringify({
					"hwdecoder": {
						"mode": "none"
					}
				}));
			// 关闭GPU硬解模式
			if (closeGPUReturnValue === 0) { // 成功 改sxj
				// 刷新播放的视频，以切换到CPU模式
				self.refreshAllPalyVideoData();
				// gpu按钮文字改为“开启GPU硬解”
				jQuery("i.icon.gpu").removeClass("closeGPU").addClass("startGPU").css("background", "url(/module/inspect/monitor/images/gpu.png) 0 0 no-repeat").attr("title", "开启GPU硬解");
				// 单个视频上的GPU图标改为“当前状态是关闭”（即可进行开启动作）
				self.initSetAllSingleVideoGPUParam();
				jQuery("#upBlockContent .tools-up i.gpu").removeClass("closeGPU").addClass("startGPU").attr("title", "开启GPU硬解");
				// 提示成功
				//notify.warn("关闭GPU硬解成功！");
				console.log("关闭GPU硬解成功！");
			} else { // 失败
				// 提示失败
				//notify.warn("关闭GPU硬解失败！");
				console.log("关闭GPU硬解失败！");
			}
		},
		/**
		 * [dealClickGPUBtEvent 处理GPU按钮点击事件]
		 * @author songxj
		 */
		dealClickGPUBtEvent: function($this) {
			var self = this,
				gpuBt = $this;
			if (gpuBt.attr("class").indexOf("startGPU") !== -1) { // 启用GPU硬解
				// 先隐藏掉ocx
				jQuery(".screen").css({
					"visibility": "hidden"
				});
				// 弹框进行风险提示
				var GPUDialog = new ConfirmDialog({
					title: "风险提示",
					message: "启用GPU硬解，会显著降低视频显示对系统资源的消耗，可能会发生小概率蓝屏现象， 确认开启吗？",
					width: 360,
					callback: function() {
						self.confirmStartGPUEvent();
					},
					prehide: function() {
						// 显示ocx
						setTimeout(function() {
							jQuery(".screen").css({
								"visibility": "visible"
							});
						}, 100);
					}
				});
			} else if (gpuBt.attr("class").indexOf("closeGPU") !== -1) { // 关闭GPU硬解
				self.closeGPUEvent();
			}
		},
		// 绑定事件
		bindEvents: function(ocxPlayer) {
			var self = this;
			var player = self.player = ocxPlayer;
			var uidefault = {
				"real": //默认实时的界面
				{
					upleft: [".video-title"],
					upright: [".tools-up .gpu", ".tools-up .location-play", ".tools-up .ptz-control", ".tools-up .color-adjust", ".tools-up .frame-mark", ".tools-up #printScreen", ".tools-up #printScreen2", ".tools-up .ratio", ".tools-up .zoom", ".tools-up .share", ".tools-up .multi", ".tools-up .close", ".tools-up .center-icon", ".tools-up .fullscreen-icon"],
					downleft: [".video-type .real", ".video-type  .record", ".alarm .manual-alarm"],
					downmid: [],
					downright: [".tools-dwon .local-video", ".tools-dwon .add-preset-point", ".tools-dwon .full-screen", '.tools-dwon .frame-mark', ".tools-dwon .real-sound", ".tools-dwon .real-talk"]
				},
				"poll": //默认轮训的界面
				{
					upleft: [".video-title"],
					upright: [".tools-up #printScreen", ".tools-up .ratio", ".tools-up .zoom", ".tools-up .share", ".tools-up .multi", ".tools-up .close"],
					downleft: [".video-type .real", ".video-type  .record", ".alarm .manual-alarm"],
					downmid: [],
					downright: [".tools-dwon .lock-channel", ".tools-dwon .frame-mark", ".tools-dwon .local-video", ".tools-dwon .add-preset-point"]
				},
				"his": //默认历史的界面
				{
					upleft: [".video-title"],
					upright: [".tools-up .gpu", ".tools-up .frame-mark", ".tools-up .zoom", "#printScreen", ".tools-up .ratio", ".tools-up .close"],
					downleft: [".video-type .real", ".video-type .record"], //,"#downBlockContent .times-play"
					downmid: [],
					downright: []
				}
			};
			var channelDataList = [];
			for (var i = 0; i <= 15; i++) {
				channelDataList[i] = {
					status: "real",
					sync: false,
					real: uidefault.real,
					his: uidefault.his,
					poll: uidefault.poll
				};
			}
			this.channelDataList = channelDataList;
			//播放器监听事件

			/* 通道拖动 */
			player.on('switch', function(srcChannel, desChannel) {
				var tem = player.cameraData[srcChannel];
				player.cameraData[srcChannel] = player.cameraData[desChannel];
				player.cameraData[desChannel] = tem;
				if (window.SelectCamera) {
					var temp = Object.clone(window.SelectCamera.ListData[srcChannel]);
					window.SelectCamera.ListData[srcChannel] = Object.clone(window.SelectCamera.ListData[desChannel]);
					window.SelectCamera.ListData[desChannel] = Object.clone(temp);
				}
				player.curChannel = desChannel;
				setPlayerUI(desChannel);
				player.focusChannel = desChannel;
				player.manualFocusChannel = desChannel;
				self.setControlBarPos(player, desChannel); //拖动后在新窗口上显示遮挡层  修改人：马越
				//当抓图是开启状态时，当然这个if也可以不写，写上主要是方便后面的人员查看时更加清楚
				if (jQuery(".screenshot-preview").is(":visible") && (jQuery('.screenshot-preview').attr('screen') - 0) === srcChannel) {
					jQuery('.screenshot-preview').attr('screen', desChannel);
					player.grabIndex = desChannel; //将新的窗口索引传给抓图索引
					self.setControlBarPos(player, desChannel, true);

					//如上清除非抓图状态下的计时器
					if (self.streamRateTimer) {
						clearInterval(self.streamRateTimer);
						self.streamRateTimer = null;
					}
					//如上清除抓图状态下的计时器
					if (self.streamRateTimerGrab) {
						clearInterval(self.streamRateTimerGrab);
					}
					self.getStreamMonitorByGrabIndex(player);
					self.streamRateTimerGrab = setInterval(function() {
						self.getStreamMonitorByGrabIndex(player);
					}, 1000); //每1秒刷新一次码流速率
				}
			});

			/* 窗口布局改变 */
			player.addEvent('layoutchange', function(oldCount, newCount) {
				// 改变菜单区的布局按钮
				jQuery('.icon.split').css('background-position', '0px ' + (Math.sqrt(newCount) - 1) * (-34) + 'px');
			});

			//
			/* -----------------------鼠标点击通道时的事件 end-------------------------*/
			player.on('click', function(curChannel, x, y) {
				var videoInfo = player.playerObj.GetVideoAttribute(curChannel);
				var flag = false;
				var inspectStatus = self.getInspectStatus(curChannel - 0);
				player.manualFocusChannel = curChannel;
				if (videoInfo !== 'ERROR') { //播放成功
					if (JSON.parse(videoInfo).videoType === 1) { //实时视频
						if (player.cameraData[curChannel] !== -1) { //有存储的数据
							if (!inspectStatus.isGoing) {
								flag = true;
							}

							if (inspectStatus.isGoing) {
								if (inspectStatus.type) { //轮巡
									if (inspectStatus.action) { //锁定的通道
										flag = true;
									}
								} else { //监巡
									if (inspectStatus.action) { //暂停
										flag = true;
									}
								}
							}
						}
					}
				}
				if (flag) {
					jQuery('#ptzCamera').addClass('active');
					if (jQuery('#ptzCamera >.header>.ui.tabular>li.ptz').hasClass('active')) {
						if (player.cameraData[curChannel].cType === 1) { //球击
							mask.hideMask();
						} else { //枪击
							mask.showMask();
						}
					}

				} else {
					//jQuery('#ptzCamera').removeClass('active');
				}

				if (jQuery("#ptzCamera>.header>ul>li.active").size() === 0) {
					jQuery("#ptzCamera>.header>ul>li:visible").eq(0).addClass('active').siblings().removeClass('active');
					jQuery("#ptzCamera>.header>ul>li:visible").eq(0).trigger('click');
				}
			});
			/* -----------------------鼠标点击通道时的事件 end-------------------------*/

			/* -----------------------鼠标进入通道时的事件 start-------------------------*/
			player.on('enter', function(curChannel, x, y) {
				/**
				 * add by zhangyu, 2015.10.16:
				 * 由于工具栏，历史播放时间轴事件绑定太难控制，故在此在此绑定
				 */
				window.PlayerControler.bindEvents();
				//针对新布防布控需要新增 create by leon.z
				var cameraId = player.cameraData[curChannel].cId;
				if (jQuery("#taskSelect").length > 0) {
					jQuery("#taskSelect").text("查看任务");
					jQuery("#taskSelect").attr("data-cameraId", cameraId).attr("data-Cindex", curChannel);
					if (jQuery("#taskContent").is(":visible")) {
						jQuery("#taskContent,#taskPart").hide(0);
					}
				}
				/**
				 * modify by zhangyu 2015.09.16:
				 * 由于ocx的覆盖，鼠标从ocx移出父容器.screen的mouseleave事件并不能很好的触发，
				 * 导致根据player.curChannel !== curChannel判断在空屏下（特别是单屏时）已经不成立，即空屏下鼠标移入ocx后player.curChannel/curChannel两值已经相等，
				 * 后续打开视频流后，此判断为否，导致ocx工具栏和云台控制方向不能正常初始化，
				 * 特此添加player.cameraData[curChannel] !== -1判断，当当前屏为装载流（空屏时），不在运行逻辑，保证player.curChannel/curChannel在有流时的互斥，以正常初始化ocx工具栏
				 */
				if (player.curChannel !== curChannel) {
					//如果移入的是空白屏,且非截图，则是工具栏消失
					if (player.cameraData[curChannel] === -1 && !jQuery(".screenshot-preview").is(":visible")) {
						//使遮挡层消失,
						jQuery('.video-control').css('left', 10000);
						//恢复默认值
						player.curChannel = -1;
					} else {
						//如果移入的不是空白屏，则需要初始化并显示工具栏
						self.ocxMouseEventDeal(curChannel);
					}
				}
			});

			player.on('mousemove', function(curChannel, btn, x, y) {
				/**
				 * add by zhangyu 2015.10.16:
				 * 由于ocx工具栏在单屏下显示/隐藏功能不好控制，故在此进行判断
				 */
				if (player.curChannel === curChannel && parseInt(jQuery("#videoControl").css("left")) === 10000) {
					self.ocxMouseEventDeal(curChannel);
				}
			});
			/**
			 * 注册ocx焦点切换事件，以便共享云台控制部分逻辑
			 * @Author zhangyu
			 * @Date   2015-10-19T16:39:13+0800
			 * @param  {[type]}                 oldIndex  [description]
			 * @param  {[type]}                 newIndex) {				alert(oldIndex, newIndex);			} [description]
			 * @return {[type]}                           [description]
			 */
			player.on("focuschange", function(oldIndex, newIndex) {
				PtzController.onFocusChange(newIndex);
			});

			/*---------------------------------鼠标进入通道时的事件 end--------------------------------------------*/

			/* 通道双击 --高标清自动切换 全屏高清  仅仅在非轮巡监巡模式下有效 start*/
			player.on('dblclick', function(dbChannel) {
				var dbChannel = dbChannel - 0;
				if (window.permission.klass["ptz-control"]) {
					player.ptzRedArrow(dbChannel);
				}
				// 复位部分按钮
				jQuery('#upBlockContent .tools-up i').each(function(index, elm) {
					if (jQuery(elm).hasClass('clicked')) {
						if (!jQuery(elm).attr('id') === 'printScreen') {
							jQuery(elm).trigger('click');
						}
					}
				});
				//调用ocx获取放大状态
				var zoomJson = player.getOption(JSON.stringify({
						"zoomstatus": {
							"pos": dbChannel
						}
					})),
					zoomStatusObj = JSON.parse(zoomJson);
				//0代表取消放大,2代表放大
				if (zoomStatusObj.zoomstatus.status === 0) {
					//新增的两行代码是双击放大的缩略图时
					jQuery(".tools-up i.zoom").removeClass('clicked  aa');
					delete player.cameraData[dbChannel].zoomType;
				}

				//如果是1分屏退出
				var layout = player.getLayout();
				//一分屏不进行高标清切换  其实这个时候，一屏的双击放大还是它自己大小，所以不做任何处理
				if (layout === 1) {
					return;
				}
				jQuery('.add-preset-point').removeClass('clicked');
				jQuery('.input-pannel').removeClass('active');
				jQuery('.add-presets').removeClass('active');
				/*该功能已经在视频指挥页面取消，仅仅只在扩展屏页面使用 start*/
				var fullscreen = jQuery('#downBlockContent .full-screen');
				var title = fullscreen.hasClass('active') ? '退出单屏' : '单屏';
				fullscreen.toggleClass('active');
				fullscreen.toggleClass("oneScreen");
				fullscreen.attr('title', title);
				/*该功能已经在视频指挥页面取消，仅仅只在扩展屏页面使用 end*/

				if (player.isHaveMaxWindow()) { //存在最大化窗口
					player.curMaxWinChannel = dbChannel;
				} else { //不存在最大化窗口
					player.curMaxWinChannel = -1;
				}

				//抓图开启状态
				if (jQuery(".screenshot-preview").is(":visible") && (player.grabIndex - 0) !== -1) {
					if (player.grabIndex === dbChannel) { //如果双击窗口是抓图窗口
						self.setPositon(true, player, dbChannel, setPlayerUI);
						self.setControlBarPos(player, player.grabIndex, true);

					} else { //如果双击窗口不是是抓图窗口
						if (player.curMaxWinChannel !== -1) { //放大状态
							jQuery('.video-control').css('left', 9999);
						} else { //非放大状态
							self.setControlBarPos(player, player.grabIndex, true);
						}
					}
				} else { //抓图未开启状态
					self.setPositon(false, player, dbChannel, setPlayerUI);
				}

			});
			/* 通道双击 --高标清自动切换 全屏高清  仅仅在非轮巡监巡模式下有效 end*/

			/* 通道单击 -----start*/
			player.on('click', function(index, x, y) {
				jQuery('.marker-pannel').removeClass("active");
			});
			/* 通道单击 ------end*/
			/**
			 * 鼠标移出播放器区域  该方案不可用的主要原因是，因为鼠标放在遮挡层上是触发该事件，离开后鼠标又触发enter事件，死循环了
			 * 为了避免.screen 的mouseleave事件在快速移动鼠标下不好使，故加上一句鼠标y位置来触发离开事件
			 * @Author zhangyu
			 * @Date   2015-10-20T17:01:34+0800
			 * @param  {[type]}                 index [description]
			 * @param  {[type]}                 x     [description]
			 * @param  {[type]}                 y)    {							}   [description]
			 * @return {[type]}                       [description]
			 */
			player.on('leave', function(index, x, y) {
				//console.log("leave ocx");
				self.onMouseLeaveEventDeal({
					pageX: x
				});
			});

			/*jQuery(document).on('mouseleave', '.screen', function(evt) {
				console.log("leave dom");
				self.onMouseLeaveEventDeal({
					pageX: evt.pageX
				});
			});*/

			var resizeTimer = null;
			//监听播放器自适应宽高
			jQuery(window).on('resize', function(evt) {
				self.resizePlayer(); //自适应ocx
				//抓图开启状态
				if (self.isGrabingStatus()) {
					jQuery('.video-control').hide(); //隐藏遮挡层
					resizeTimer && clearTimeout(resizeTimer);
					resizeTimer = setTimeout(function() {
						jQuery('.video-control').show();
						/*保险操作 根据代码逻辑是不需要的，但是加上ocx在中间捣乱，加上如下比较保险 start--马越*/
						/*jQuery('.screenshot-preview').show();
						jQuery('#downBlock').height(84);*/
						/*保险操作 end*/
						self.setControlBarPos(player, player.grabIndex, true);
						self.setPicList();
					}, 100);
					//抓图关闭状态
				} else {
					jQuery('.video-control').css('left', 10000); //使遮挡层消失
					player.curChannel = -1; //恢复默认值
				}

			});

			//将ocx全屏显示
			jQuery(document).on('click', '.header .fullscreen', function(evt) {
				player.displayFullScreen();
			});

			//将单个通道的视频放到到目前ocx控件大小  new add：全景出逃全屏 by songxj
			jQuery(document).off('click', '#upBlockContent .fullscreen-icon').on('click', '#upBlockContent .fullscreen-icon', function() {
				var index = player.curChannel;
				var str = player.playerObj.GetVideoAttribute(index) + "";
				if (str == "ERROR") {
					notify.warn("窗口无视频播放");
					return
				}
				var jsonobj = JSON.parse(str);
				if (jsonobj.videoType == 1) //播放实时流
				{

					player.toggleWindowMaximize(index);
				} else if (jsonobj.videoType == 2) //播放历史
				{
					player.playerObj.SetWindowMaximize(index);
				}
				var channelPositionObj = player.getVideoRectByIndex(index);
				var curLeft = channelPositionObj.Left;
				var curTop = channelPositionObj.Top;
				var curHeight = channelPositionObj.Height;
				var curWidth = channelPositionObj.Width;
				jQuery('.video-control').css({
					left: curLeft,
					top: curTop,
					width: curWidth,
					height: curHeight
				});
				jQuery(this).toggleClass('fullViewActive');
				var title = jQuery(this).hasClass('fullViewActive') ? '退出全屏' : '全屏';
				jQuery(this).attr('title', title);
			});

			//将单个通道的视频放到到目前ocx控件大小
			jQuery(document).on('click', '#downBlockContent .full-screen', function() {
				jQuery(this).toggleClass('active');
				var index = player.curChannel;
				var str = player.playerObj.GetVideoAttribute(index) + "";
				if (str == "ERROR") {
					notify.warn("窗口无录像");
					return
				}
				var jsonobj = JSON.parse(str);
				//播放实时流
				if (jsonobj.videoType === 1) {

					player.toggleWindowMaximize(index);
				} else if (jsonobj.videoType === 2) {
					//播放历史
					player.playerObj.SetWindowMaximize(index);
				}
				var channelPositionObj = player.getVideoRectByIndex(index);
				var curLeft = channelPositionObj.Left;
				var curTop = channelPositionObj.Top;
				var curHeight = channelPositionObj.Height;
				var curWidth = channelPositionObj.Width;
				jQuery('.video-control').css({
					left: curLeft,
					top: curTop,
					width: curWidth,
					height: curHeight
				});
				var title = jQuery(this).hasClass('active') ? '退出单屏' : '单屏';
				jQuery(this).attr('title', title);
			});

			//关闭单个视频通道
			var CloseSingleVideo = function(index) {
				player.stop(false, index);
				//使遮挡层消失
				jQuery('.video-control').css('left', 10000);
				//恢复默认值
				player.curChannel = -1;
				//刷新ocx
				player.playerObj.RefreshVideoWindow(index);
				//当抓图是开启状态时，当然这个if也可以不写，写上主要是方便后面的人员查看时更加清楚
				if (jQuery(".screenshot-preview").is(":visible")) {
					jQuery('.screenshot-preview .exit').trigger('click');
				}
				jQuery("#downBlockContent .times-play").html("x1");
				player.playerObj.SetStreamLostByIndex(0, index);
			};

			/**
			 * 关闭单个或者多个通道时，清楚web对话框的标识
			 * @Author zhangyu
			 * @Date   2015-10-20T11:51:02+0800
			 * @param  {[type]}                 type  [description]
			 * @param  {[type]}                 index [description]
			 * @return {[type]}                       [description]
			 */
			var closeWebDialog = function(type, index) {
				if (type === "all") {
					//关闭全部对话框
					player.playerObj.CloseWebDialog(-1);
					//清除全部标记位
					var L = player.playerObj.GetLayout(),
						ptzDialogHD = player.PtzDialog;
					//遍历布局
					for (var i = 0; i <= L - 1; i++) {
						var cd = player.cameraData[i];
						if (typeof(cd) == "object") {
							delete player.cameraData[i].PtzController;
							delete player.cameraData[i].vodHistory;
							delete player.cameraData[index].Effect;
						}
					}
					if (ptzDialogHD > 0) {
						player.playerObj.CloseWebDialog(ptzDialogHD);
						delete player.PtzDialog;
					}
				} else {
					//关闭单个对话框
					if (typeof(player.cameraData[index]) === "object") {
						if (index === player.DialogIndex) {
							player.cameraData[index].vodHistory && player.playerObj.CloseWebDialog(player.cameraData[index].vodHistory.dialogId);
							player.cameraData[index].Effect && player.playerObj.CloseWebDialog(player.cameraData[index].Effect);
							//如果当前有云台，则删除云台
							if (player.PtzDialog) {
								player.playerObj.CloseWebDialog(player.PtzDialog);
								delete player.PtzDialog;
							}
						}
					}
				}
			};

			//关闭单个通道
			jQuery(document).on('click', '#upBlockContent .close', function() {
				var index = player.curChannel;
				//关闭帧标记信息填写框
				jQuery('.close-frame').trigger('click');
				//关闭ocx web对话框
				closeWebDialog("single", index);
				//关闭视频流
				CloseSingleVideo(index - 0);
				/*开始：add by wujingwen */
				if (window.playDelFla) {
					var ele = jQuery('#sidebar-body > [data-tabor="inspect-create"] .cameraslist li');
					ele.eq(index).find(".remove-ipc").trigger("click")
				}
				/*结束*/
			});

			//关闭所有通道
			jQuery(document).on('click', '.header .close', function(event) {
				player.stopAll();
				jQuery('.close-frame').trigger('click');
				//使遮挡层消失
				jQuery('.video-control').css('left', 10000);
				//恢复默认值
				player.curChannel = -1;
				//当抓图是开启状态时，当然这个if也可以不写，写上主要是方便后面的人员查看时更加清楚
				if (jQuery(".screenshot-preview").is(":visible")) {
					jQuery('.screenshot-preview .exit').trigger('click');
				}
				//关闭ocx网页对话框
				closeWebDialog("all");
				//上海分支，时间轴
				if (self.version == "shanghai") {
					var N = player.playerObj.GetLayout();
					for (var i = 0; i <= N - 1; i++) {
						(function(i) {
							if (typeof(player.cameraData[i]) == "object") {
								delete player.cameraData[i].PtzController;
								delete player.cameraData[i].Effect;
								delete player.cameraData[i].vodHistory;
							}
							player.stop(false, i);
							//player.playerObj.Stop(false, i);
							player.playerObj.RefreshVideoWindow(i);
							self.channelDataList[i].sync = false;
							player.cameraData[i] = -1;
							player.playerObj.SetStreamLostByIndex(0, i);
						})(i);
					}
					var opened = jQuery("#camerasPanel>.treeMenu .tree ul>li.node.opened");
					opened.removeClass("opened");
					opened.removeClass("selected");
					jQuery("#camerasPanel>.treeMenu .tree ul>li.node.activated").removeClass("activated")
					return;
				}
			});

			//选择分屏
			jQuery(document).on('click', '.ui.atached.menu .split', function(event) {
				//将function-container容器 和 选择内容 显示
				var that = jQuery(this),
					$container = jQuery('.function-container'),
					$split = jQuery('.split-panel');
				$layout = jQuery("#layout");
				self.showWhich(that, $container, $split, $layout);
				self.setBlockPos(that, $split, $container, '#major .header', 1, 1);
				//重新定义ocx上来遮挡的iframe的位置。 by wangxiaojun 2015.01.22
				self.setFramePos(that, $split, $container, '#major .header', 1, 1, $layout);
				jQuery('.close-frame').trigger('click');
			});

			// 开启GPU硬件加速 (包括视频调度-->扩展屏 和 视频监控模块) by songxj
			jQuery(document).on('click', '#major .ui.atached.menu .gpu', function() {
				var isSupportGPU = self.initCheckIsSupportGPU();
				if (!isSupportGPU) { // 不支持GPU 改1sxj
					//notify.warn("不支持GPU硬解！");
					// 先隐藏掉ocx
					jQuery(".screen").css({
						"visibility": "hidden"
					});
					new AlertDialog({
						message: "您的系统暂不支持硬件加速（GPU）",
						prehide: function() {
							// 显示ocx
							setTimeout(function() {
								jQuery(".screen").css({
									"visibility": "visible"
								});
							}, 100);
						}
					});
					return;
				}
				self.dealClickGPUBtEvent(jQuery(this));
			});

			//添加至监巡
			jQuery(document).on('click', '#npplay .ui.atached.menu .inspect', function(event) {
				//将function-container容器 和 选择内容 显示
				var that = jQuery(this),
					container = jQuery('.function-container'),
					inspect = jQuery('.add-inspect');
				// inspectDiv = jQuery("#inspectDiv");
				layout = jQuery("#layout");
				jQuery('.ui.atached.menu .split').removeClass('active');
				self.showWhich(that, container, inspect, layout);
				self.setBlockPos(that, inspect, container, '#major .header', 2, 0);
				//重新定义ocx上来遮挡的iframe的位置。 by wangxiaojun 2015.01.22
				self.setFramePos(that, inspect, container, '#major .header', 2, 0, layout);

			});

			//将监巡内容收起
			jQuery(document).on('click', '#addcancelbtn', function() {
				jQuery('#resetInspectInfo').trigger('click');
				jQuery('.function-container').removeClass('active');
				jQuery('.add-inspect').removeClass('active');
				jQuery('.ui.atached.menu .inspect').removeClass('clicked');
				jQuery('#pauseTime').val('');
				jQuery("#layout").hide(); //隐藏ocx遮挡的iframe  by wangxiaojun 2015.01.22
			});

			//设置布局
			jQuery(document).on('click', '.split-panel i', function(e, data) {
				var layout = jQuery(this).data('layout');
				if (data && data.num) {
					layout = data.num;
				}
				if (layout != 1) {
					jQuery('#downBlockContent .full-screen').removeClass("oneScreen");
				} else {
					jQuery('#downBlockContent .full-screen').addClass("oneScreen");
				}
				player.setLayoutBySH(layout);
				jQuery('.icon.split').css('background-position', '0px ' + (Math.sqrt(layout) - 1) * (-34) + 'px');
				jQuery('.function-container').toggleClass('active');
				jQuery('.split-panel').toggleClass('active');
				jQuery("#layout").hide(); //影藏为了在谷歌下显示下拉框在ocx上添加的iframe。 by wangxiaojun 2015.01.22
				jQuery('.ui.atached.menu .split').removeClass('clicked active').attr('title', layout + '分屏');
				//当抓图是开启状态时，当然这个if也可以不写，写上主要是方便后面的人员查看时更加清楚
				if (jQuery(".screenshot-preview").is(":visible")) {
					/*self.setControlBarPos(player, player.grabIndex);
					self.setPicList();*/
					//清除截图相关dom by wangxiaojun 2015.09.26
					jQuery('.preview-panel div.exit').trigger('click');
					self.setControlBarPos(player, player.grabIndex);
				}
				//使遮挡层消失
				jQuery('.video-control').css('left', 10000);
				//恢复默认值
				player.curChannel = -1;
			});
			//实时录像和历史录像按钮切换的时候，界面的变化
			function setPlayerUI(index, _status) {
				var status = channelDataList[index].status;
				//var status="real";
				if (_status) {
					status = _status;
				} else {
					var str = player.playerObj.GetVideoAttribute(index);
					if (str == "ERROR") //播放失败
					{
						jQuery("#downBlockContent .videoProgress").hide();
						var content = jQuery("#downBlockContent .videoProgress .frameMarkcontent");
						content.html("");
						if (typeof(window.PlayerControler) === "object") {
							window.PlayerControler.videoInit();
						}
						if (player.cameraData[index] == -1) {
							self.setControlBarPos(player, index);
							if (!jQuery('.screenshot-preview').is(':visible')) {
								//使遮挡层消失
								jQuery('.video-control').css('left', 10000);
								//恢复默认值
								player.curChannel = -1;
							}
							return;
						}
					} //播放成功
					else {
						var jsonobj = JSON.parse(str);
						if (jsonobj.videoType == 1) {
							status = "real";
						} else if (jsonobj.videoType == 2) {
							status = "his";
						}
					}
				}
				jQuery("#videoControl").show(); //console.log(2108)
				self.setControlBarPos(player, index);
				var channelPositionObj = player.getVideoRectByIndex(index);
				//仅仅只在抓图未开启时做遮挡层定位
				if (!jQuery(".screenshot-preview").is(":visible")) {
					jQuery('.video-control').css({
						left: channelPositionObj.Left,
						top: channelPositionObj.Top,
						width: channelPositionObj.Width,
						height: channelPositionObj.Height
					});
				}

				//获取分屏数
				var N = player.playerObj.GetLayout() - 0;

				jQuery("#downBlockContent .video-type").show();
				if (status == "real") //实时
				{
					if (location.pathname.indexOf('/inspect/surveillance') !== -1) { //仅仅只在视频指挥页面使用，扩展屏不使用
						var curObj = player.cameraData[player.curChannel - 0];
						if (curObj === undefined) {
							return;
						}
						var playingCameraId, playingChannelId;
						if (curObj.playingChannel) { //经典模式
							playingCameraId = curObj.cId;
							playingChannelId = curObj.playingChannel.id;
						} else { //监巡轮巡
							playingCameraId = curObj.cameraId;
							playingChannelId = curObj.cId;
						}
						self.getServerRecordStatus(playingCameraId, playingChannelId, function() {
							//启动服务器图标变化
							if (player.cameraData[player.curChannel] && player.cameraData[player.curChannel].recordFlag) {
								jQuery('.local-video').addClass('active');
								jQuery('.local-video').attr('title', '停止服务器录像');
							} else {
								jQuery('.local-video').removeClass('active');
								jQuery('.local-video').attr('title', '启动服务器录像');
							}
						});

					}
					var node1 = jQuery("#downBlockContent .video-type .record");
					node1.removeClass("active");
					var node = jQuery("#downBlockContent .video-type .real");
					node.addClass("active");
					jQuery("#downBlockContent .times-play").hide();
					jQuery("#downBlockContent .video-btn").hide();
					jQuery("#upBlockContent .tools-up i").hide();
					jQuery("#downBlockContent .stop-play").hide();
					jQuery("#downBlockContent .videoProgress").hide();
					jQuery("#downBlockContent .alarm").show();

					jQuery.each(uidefault.real.upright, function(n, val) {
						jQuery(val).show();
						jQuery(val).css("width", 24);
					});
					jQuery.each(uidefault.real.upleft, function(n, val) {
						jQuery(val).show();

					});
					jQuery.each(uidefault.real.downleft, function(n, val) {
						jQuery(val).show();
					});

					jQuery("#downBlockContent .tools-dwon i").hide();
					jQuery.each(uidefault.real.downright, function(n, val) {
						jQuery(val).show();
						jQuery(val).css("width", 24);
					});

					self.ShowServerRecordIcon();
					self.displayBtnsByCameraType(); //根据摄像机类型(球机或者非球机)显示或者隐藏部分按钮

					if (jQuery('#camerasPanel .patrol .joint-layer').is(':visible') && jQuery("#sidebar #sidebar-head [data-tab='patrol']").hasClass('active')) { //监巡布局设置状态
						jQuery("#upBlockContent .tools-up .close").hide();
					} else {
						jQuery("#upBlockContent .tools-up .close").show();
					}
					jQuery("#downBlockContent .lockunlock").hide();
					var inspectStatus = self.getInspectStatus(index);
					if (inspectStatus.isGoing) {
						//轮训或者监巡状态下渲染UI
						self.LoopInspectRenderUI(index);
					} else {
						//console.log("置0");
						self.indexCame = 0; //如果为轮巡要置0
					}
					// return;
					/*if (N == 9) {
						jQuery("#upBlockContent .tools-up .frame-mark").hide();
					}
					if (N == 16) {
						jQuery("#upBlockContent .tools-up i").hide();
						jQuery("#upBlockContent .tools-up .close").show();
					}*/

					//对语音对讲,声音接入进行特殊处理
					self.setTalkSoundLayout(player.curChannel - 0);
					//云台按钮的特殊处理
					if (permission.klass["set-preset"] || permission.klass["ptz-control"] || permission.klass["preset-cruise"] || permission.klass["call-preset"] || permission.klass["delete-preset"]) {
						if (player.cameraData[index].cType === 1) {
							jQuery('#upBlockContent .ptz-control').show();
						} else {
							jQuery('#upBlockContent .ptz-control').hide();
						}
					} else {
						jQuery('#upBlockContent .ptz-control').hide();
					}
					var inspectStatus = self.getInspectStatus();
					if (!inspectStatus.isGoing) {
						permission.reShow("#downBlockContent", function() {

							//预置位的特殊处理
							if (permission.klass["set-preset"]) {
								if (player.cameraData[index].cType === 1) {
									jQuery('#downBlockContent .add-preset-point').show();
								} else {
									jQuery('#downBlockContent .add-preset-point').hide();
								}
							} else {
								jQuery('#downBlockContent .add-preset-point').hide();
							}
							self.adaptiveDisplayIco();
						});
					}

				} else if (status == "his") //历史
				{
					var node = jQuery("#downBlockContent .video-type .real");
					node.removeClass("active");
					var node = jQuery("#downBlockContent .video-type .record");
					node.addClass("active");
					//jQuery("#downBlockContent .times-play").show();
					jQuery("#downBlockContent .video-btn").show();
					//jQuery("#downBlockContent .alarm").hide();
					jQuery("#upBlockContent .tools-up i").hide();
					//jQuery("#downBlockContent .lockunlock ").hide();

					jQuery.each(uidefault.his.upright, function(n, val) {
						jQuery(val).show();
						jQuery(val).css("width", 24);
					});

					jQuery("#downBlockContent .tools-dwon i").hide();
					jQuery.each(uidefault.his.downright, function(n, val) {
						jQuery(val).show();
						jQuery(val).css("width", 24);
					});

					jQuery.each(uidefault.his.upleft, function(n, val) {
						jQuery(val).show();
					});

					jQuery.each(uidefault.his.downleft, function(n, val) {
						jQuery(val).show();
					});
					jQuery('#upBlockContent i.color-adjust').show();
					/*
					if (permission.klass["ptz-control"]) {
						if (player.cameraData[index].cType === 1) {
							jQuery('#upBlockContent i.color-adjust').show();
						} else {
							jQuery('#upBlockContent i.color-adjust').hide();
						}
					} else {
						jQuery('#upBlockContent i.color-adjust').hide();
					}*/

					jQuery("#downBlockContent .alarm").hide();
					jQuery("#downBlockContent .stop-play").hide();
					jQuery("#downBlockContent .times-play").show();
					//jQuery("#downBlockContent .times-play").hide();
					jQuery("#downBlockContent .videoProgress").show();

					var N = player.getLayout();
					N = Math.sqrt(N);
					// var w = jQuery("#UIOCX").width() / N; //因为跨浏览器ocx不支持jQuery获取，所以改用下面方法
					var w = jQuery(".UIOCX").width() / N;
					var dis = jQuery("#downBlockContent .tools-dwon").css("display");
					if (dis != "none") {
						jQuery("#downBlockContent .tools-dwon").css("display", "inline-block");
						jQuery("#downBlockContent .tools-dwon i").css("display", "inline-block");
					}

					jQuery("#downBlockContent .tools-dwon i.local-video").hide();
					jQuery("#downBlockContent .tools-dwon i.add-preset-point").hide();

					var autowidth = function() {
						var w = jQuery("#downBlockContent").width();
						var w0 = self.getWidth(".video-type");
						var w1 = self.getWidth(".alarm");
						var w2 = self.getWidth(".video-btn");
						var w3 = self.getWidth(".times-play");
						var w4 = self.getWidth(".tools-dwon");
						w = w - w0 - w1 - w2 - w3 - w4 - 20;
						return w;
					}
					var wvp = autowidth();
					jQuery(".played").css("width", 0);
					jQuery(".ctrlbar").css("left", 0);

					jQuery("#downBlockContent .videoProgress").css("display", "inline-block");
					jQuery("#downBlockContent .videoProgress").css("width", (wvp) + "px");

					if (self.channelDataList[index].sync == true) {
						jQuery("#downBlockContent .times-play").hide();
						jQuery("#downBlockContent .video-btn").hide();
					}
					jQuery("#downBlockContent .lockunlock ").hide();
					//显示进度
					var content = jQuery("#downBlockContent .videoProgress .frameMarkcontent");
					content.html("");

					if (typeof(window.PlayerControler) == "object") {
						window.PlayerControler.videoInit();
						//console.log(player,index,content)
						//window.PlayerControler.renderFrameMark(player, index, content);
						require(["/module/framemark/js/frame-mark.js"], function(FrameMarker) {
							FrameMarker.renderFrameMark(player, index, content);
						});
					}
					//如果已经播放完毕，则不再进行定位、监听和按钮状态变化
					if (!window.isPlayOver) {

						self.setPos(player, index);
						var str = player.playerObj.GetVideoAttribute(index);
						if (str !== "ERROR") {
							self.ListenPlayerProgress(player, index);
						}

						var times = window.SelectCamera && window.SelectCamera.ListData[index].times;
						if (times) { //点击过暂停按钮
							var node = jQuery(".video-btn .toggle-pause");
							node.removeClass("toggle-pause");
							node.addClass("toggle-play");
						} else {
							var node = jQuery(".video-btn .toggle-play");
							node.removeClass("toggle-play");
							node.addClass("toggle-pause");
						}
					}

					permission.reShow("#upBlockContent");
					permission.reShow("#downBlockContent");
					jQuery('#upBlockContent .tools-up .multi').hide();
					jQuery('#upBlockContent .ptz-control').hide();
					jQuery(".tools-dwon .local-video").hide();
					jQuery(".tools-dwon .add-preset-point").hide();
					jQuery(".tools-dwon .real-talk").hide();
					jQuery("#downBlockContent .alarm").hide();
					var inspectStatus = self.getInspectStatus(index);
					//轮询锁定状态
					if (inspectStatus.isGoing && inspectStatus.type && inspectStatus.action) {
						if (window.loop_inspect_obj && window.loop_inspect_obj.targetWindow) {
							if (window.loop_inspect_obj.targetWindow.indexOf(index + "") > -1) {
								jQuery('#upBlockContent .tools-up .close').hide();
							}
						}
					}
				}
			}
			this.setPlayerUI = setPlayerUI;
			//ControlBar.setPlayerUI=setPlayerUI;

			//新版本历史调阅
			if (self.history == "new") {
				//点击实时按钮
				jQuery(document).on('click', '#downBlockContent .video-type i.real', function(e) {

					var obj = jQuery(this);
					var index = player.curChannel;
					var attrstr = player.playerObj.GetVideoAttribute(index) + "";
					if (attrstr != "ERROR") {
						var jsonobj = JSON.parse(attrstr);
						if (jsonobj.videoType == 1) {
							return;
						}
					}
					jQuery("#zoom p").removeClass('checked');
					jQuery(".win-dialog.history-record").remove();
					//如果存在录像面板，则关闭(先查看实时流，再查看历史流)
					if (player.cameraData[index].vodHistory) {
						player.playerObj.CloseWebDialog(player.cameraData[index].vodHistory.dialogId);
						delete player.cameraData[index].vodHistory;
						if (window.SelectCamera.ListData[index].vodHistory) {
							delete window.SelectCamera.ListData[index].vodHistory;
						}
					}
					//如果存在录像面板，则关闭(此种情况是先查看历史流，再查看实时流)
					if (window.SelectCamera.ListData[index].vodHistory) {
						var did = window.SelectCamera.ListData[index].vodHistory.dialogId,
							caIndex = window.SelectCamera.ListData[index].vodHistory.index;
						if (index == caIndex) {
							player.playerObj.CloseWebDialog(did);
							delete window.SelectCamera.ListData[index].vodHistory;
						}
					}
					//切换到历史的时候，如果添加帧标记窗口存在，则关闭
					if (jQuery(".marker-pannel").hasClass("active")) {
						jQuery(".marker-pannel").removeClass("active");
					}
					player.playerObj.Play("", index);
					player.stopStream(index);

					var DataList = channelDataList[index];
					player.playerObj.SetFocusWindow(index);

					DataList.status = "real";
					setPlayerUI(index, "real");
					var obj = player.cameraData[index];
					var title = window.SelectCamera && window.SelectCamera.ListData[index].selectName;
					var inspectStatus = self.getInspectStatus(index);
					//轮询锁定状态
					var FlagLoop = inspectStatus.isGoing && inspectStatus.type && inspectStatus.action;
					//监巡暂停状态
					var FlagInspectPausing = inspectStatus.isGoing && !inspectStatus.type && inspectStatus.action;
					if (FlagLoop || FlagInspectPausing) {
						/*开始add by wujingwen on 2015.10.24 获取playdata*/
						var definitionType = player.isHaveMaxWindow() ? 1 : 0;
						if (player.getLayout() === 1) {
							definitionType = 1;
						}
						/*结束*/
						var playdata = player.getPlayData(obj, "real", definitionType);
						//var playdata = player.getPlayData(obj, "real");
						if (!playdata) {
							//notify.warn("该摄像头没有实时视频或者发生异常!");return;
							playdata = obj;
						}
						//var playdata=obj;
						playdata.type = 1;
						playdata.displayMode = 0;
						obj.path = playdata.path;

						var id = obj.id || player.cameraData[index].cId || player.cameraData[index].cameraId;
						var permissionFlag = permission.stopFaultRightById([id])[0];
						if (permissionFlag === false) {
							notify.info("暂无权限访问该摄像头");
							return;
						}
						var N = player.playStream(playdata, index);

						player.cameraData[index].cplayStatus = N;
						player.cameraData[index].definitionType = playdata.definitionType;
						jQuery("#ptzCamera .header [data-tab=effect]").trigger("click");
						jQuery("#ptzCamera .header [data-tab=ptz]").trigger("click");

						//setHisPanle(index);
						self.hisClick(player, index);
						setTimeout(function() {
							self.playType(1, player, index);
							self.presetUI(index);
						}, 0);
						if (typeof(player.cameraData[index]) == "object") { //!player.cameraData[index].playingChannel
							if (!obj.id) {
								obj.id = player.cameraData[index].cId
							}
							var playingChannel = {
								"ip": playdata.ip,
								"port": playdata.port,
								"user": playdata.user,
								"passwd": playdata.passwd,
								"path": playdata.path,
								"id": obj.id,
								"type": 1,
								"cplayStatus": obj.cplayStatus,
								"cName": obj.cName,
								"cType": obj.cType,
								"cCode": obj.cCode,
								"ratioType": obj.ratioType
							};
							player.cameraData[index].playingChannel = playingChannel;
						}
						return;
					}

					if (!window.SelectCamera.MenuData) {
						notify.warn("发生异常");
						return;
					}
					var data = window.SelectCamera.MenuData[title];
					if (obj == -1) {
						if (!data) {
							notify.warn("发生异常");
							return;
						} else {
							obj = window.SelectCamera.MenuData[title];
							player.cameraData[index] = obj;
						}
					}

					var definitionType = player.isHaveMaxWindow() ? 1 : 0;
					if (player.getLayout() === 1) {
						definitionType = 1;
					}
					var playdata = player.getPlayData(obj, "real", definitionType);
					if (!playdata) {
						notify.warn("该摄像头没有实时视频或者发生异常!");
						return;
					}
					playdata.type = 1;
					playdata.displayMode = 0;
					obj.path = playdata.path;
					var id = obj.id || player.cameraData[index].cId || player.cameraData[index].cameraId;
					var permissionFlag = permission.stopFaultRightById([id])[0];
					if (permissionFlag === false) {
						notify.info("暂无权限访问该摄像头");
						return;
					}
					var N = player.playStream(playdata, index);
					player.cameraData[index].cplayStatus = N;
					player.cameraData[index].definitionType = playdata.definitionType;
					player.cameraData[index].zoomType = 1;
					//修复数据格式
					self.repairData(player.cameraData[index].cId, index, player);
					jQuery("#ptzCamera .header [data-tab=effect]").trigger("click");
					jQuery("#ptzCamera .header [data-tab=ptz]").trigger("click");

					if (typeof(player.cameraData[index]) == "object") { //!player.cameraData[index].playingChannel
						if (!obj.id) {
							obj.id = player.cameraData[index].cId || player.cameraData[index].id;
						}
						var playingChannel = {
							"ip": playdata.ip,
							"port": playdata.port,
							"user": playdata.user,
							"passwd": playdata.passwd,
							"path": playdata.path,
							"id": obj.id,
							"type": 1,
							"cplayStatus": obj.cplayStatus,
							"cName": obj.cName,
							"cType": obj.cType,
							"cCode": obj.cCode,
							"ratioType": obj.ratioType
						};
						player.cameraData[index].playingChannel = playingChannel;
					}
					// 调云台
					gPtz.setParams({
						cameraId: obj.cId,
						cameraNo: playdata.path,
						cameraType: obj.cType,
						cameraChannel: player.cameraData[index].playingChannel
					});
					if (obj.cType === 1) {
						gVideoPlayer.switchPTZ(true, index);
						// player.playerObj.SetWindowPTZByIndex(true, index);
					}

					self.hisClick(player, index);
					//调用上面的函数self.hisClick(player, index)会设置manualFocusChannel为index，不合理
					player.manualFocusChannel = -1;
					setTimeout(function() {
						self.playType(1, player, index);
						self.presetUI(index);
					}, 0);
					return false;
				});

				//点击历史按钮
				jQuery(document).on('click', '#downBlockContent .video-type i.record', function(e) {
					//日志记录，查看XX摄像机历史录像,add by wujingwen, 2015.08.14
					if (location.href.indexOf("dispatch") >= 0) {
						logDict.insertMedialog("m1", "查看：" + window.SelectCamera.selectName + "->摄像机历史视频", "f2", "o4", window.SelectCamera.selectName);
					} else {
						logDict.insertMedialog("m1", "查看：" + window.SelectCamera.selectName + "->摄像机历史视频", "f1", "o4", window.SelectCamera.selectName);
					}
					var index = player.curChannel;
					var inspectStatus = self.getInspectStatus(index - 0);
					if (inspectStatus.isGoing && inspectStatus.type && !inspectStatus.action) {
						notify.warn("轮巡未锁定状态不允许调阅历史录像！");
						return;
					}
					if (inspectStatus.isGoing && !inspectStatus.type && !inspectStatus.action) {
						notify.warn("监巡未暂停状态不允许调阅历史录像！");
						return;
					}
					//切换到历史的时候，如果添加帧标记窗口存在，则关闭
					if (jQuery(".marker-pannel").hasClass("active")) {
						jQuery(".marker-pannel").removeClass("active");
					}
					var obj = jQuery(this);
					var attrstr = player.playerObj.GetVideoAttribute(index) + "";
					if (attrstr != "ERROR") {
						var jsonobj = JSON.parse(attrstr);
						if (jsonobj.videoType == 2) {
							notify.warn("当前播放的已经是历史，不允许切换!");
							return;
						}
					}

					jQuery("#zoom p").removeClass('checked');
					player.cameraData[index].zoomType = null;
					player.stopZoom(index);
					self.hidSelectBlock();
					window.SelectCamera && (window.SelectCamera.ListData[index].times = null);
					var node = jQuery(".video-btn .toggle-play");
					node.removeClass("toggle-play");
					node.addClass("toggle-pause");
					var tmp = player.getPlaySpeed(index);
					jQuery('#downBlockContent .times-play').text('x' + tmp);
					player.stopStream(index);
					var DataList = channelDataList[index];
					player.playerObj.SetFocusWindow(index);
					var str = JSON.stringify(player.cameraData);

					//历史录像
					DataList.status = "his";

					setPlayerUI(index, "his");

					var camid = player.findcamid(player.cameraData[index]);
					var temphdsd = player.cameraData[index].temphdsd;
					e.preventDefault();
					e.stopPropagation();


					var id = player.cameraData[index].cId || player.cameraData[index].cameraId;
					var permissionFlag = permission.stopFaultRightById([id - 0])[0];
					if (permissionFlag === false) {
						notify.info("暂无权限访问该摄像头");
						return;
					}

					if (camid == 0 || camid == -1) {
						if (camid == -1) {
							notify.warn("该摄像机为编码器录像，没有历史录像!");
							return;
						}
						//轮询锁定状态
						var FlagLoop = inspectStatus.isGoing && inspectStatus.type && inspectStatus.action;
						//监巡暂停状态
						var FlagInspectPausing = inspectStatus.isGoing && !inspectStatus.type && inspectStatus.action;

						if (FlagLoop || FlagInspectPausing) {
							//轮询锁定状态或监巡暂停状态历史调阅
							window.SelectCamera.cameraId = player.cameraData[index].cId;
							self.PlayHis_for_InspectPoll(index);
							return;
						}
						notify.warn("该摄像头没有录像或者发生异常index=" + index);
						jQuery(".UIOCX")[0].SetStreamLostByIndex(0, index);
						return;
					}

					player.stopStream(index);
					DataList.status = "his";


					setPlayerUI(index, "his");
					//self.hisClick(player, index);
					// jQuery('#ptzCamera').addClass('active');
					//self.playType(2, player, index);

					self.real2history = true;

					if (camid > 0 && index >= 0) {
						window.SelectCamera.Channelid = camid;
						var cameraId = player.cameraData[index].cId;
						window.SelectCamera.cameraId = cameraId;
						var channelName = player.getPlayChannel(player.cameraData, index).av_obj;
						window.SelectCamera.channelName = channelName;

						var title = player.cameraData[index].cName;
						title = title.replace(/\(\d+\)$/gi, "");
						window.SelectCamera.selectName = title;
						if (!window.SelectCamera.MenuData) {
							window.SelectCamera.MenuData = {};
						}
						window.SelectCamera.MenuData[title] = player.cameraData[index];
						window.SelectCamera && (window.SelectCamera.ListData[index].selectName = title);
						window.SelectCamera && (window.SelectCamera.ListData[index].definitionType = temphdsd);
					}

					//jQuery("#ptzCamera .content .view.hisplay.ui.tab .asearch").trigger("click");
					//弹出查询历史录像窗口，自动搜索历史录像
					/**
					 * bug[33631]
					 * 不知道为啥此处需要重新读取窗口索引，注释掉即可，delete by zhangyu on 2015/5/24
					 */
					/*var A=player.getFreeWindows();
					var index=A[0];*/
					player.setFocusWindow(index);
					var pobj = {
						index: index,
						data: player.cameraData[index],
						player: player,
						fn: function() {
							jQuery(".search-history button.search").trigger("click");
						}
					};
					pobj.data.userRoleScore = window.localStorage.getItem("userRoleScore"); /*存用户级别，在用下载权限的时候使用*/
					vodHistory.showDialog({
						center: true
					}, pobj);
				});
			}

			jQuery(".add-preset-point").on("click", function() {

				var $this = jQuery(this),
					cData = player.cameraData[player.curChannel];
				//"cType":摄像机类型（1:球机 0:枪机 ）
				if (cData.cType === undefined) {
					return;
				}

				//监巡和轮巡时不能进行云台的预置位添加,云台不可用情况
				if (!self.ptzUserable("添加预置位")) {
					return;

				}
				//parseInt() 函数可解析一个字符串，并返回一个整数,10是指十进制
				var cType = parseInt(cData.cType, 10);
				if (cType === 0) { //枪机
					notify.warn("不能对枪机添加预置位！");
					return;
				}
				//"cStatus":摄像机状态（0:在线 1:离线）
				if (parseInt(cData.cStatus, 10) === 1 || cData.cplayStatus === 2) {
					notify.warn("摄像头处于离线状态！");
					return;
				}

				var container = jQuery(".input-pannel"),
					presets = jQuery(".add-presets");
				if ($this.hasClass("clicked")) {
					//隐藏面板
					$this.removeClass("clicked");
					presets.removeClass("active");
					container.removeClass("active");
				} else {
					//显示面板
					$this.addClass("clicked");
					presets.addClass("active");
					container.addClass("active");
					/**
					 * 拆分添加预置位的逻辑代码到单独的js文件中去，此处按事件驱动，按需加载路径 
					 * 2016.05.11 added by yangll
					 */
					require(["/module/inspect/controllbar/add-preset-point.js"], function(addPresetPoint) {
						addPresetPoint.init(player, cData);
					});
				}
			});

			//添加帧标记
			jQuery(document).on("click", ".frame-mark", function() {
				var index = player.curChannel;
				var str = player.playerObj.GetVideoAttribute(index) + "";
				if (str == "ERROR") {
					notify.warn("未播放视频或录像，操作无效");
					return;
				}
				var inspectStatus = self.getInspectStatus(index - 0);
				if (inspectStatus.isGoing && inspectStatus.type && !inspectStatus.action) {
					notify.warn("轮巡未锁定状态不允许添加帧标记！");
					return;
				}
				//初始化帧标记面板
				jQuery("#markerTitle").val("");
				jQuery("#markerLevel").val("");
				jQuery('#markerLevel').css("background-color", "rgb(77,77,77)");
				jQuery('#markerLevel').attr("level", -1);
				jQuery('.frame-marker textarea').val("");


				var offset = player.getVideoRectByIndex(index);
				var $container = jQuery('.marker-pannel');

				//因为跨浏览器ocx不支持jQuery获取，所以改用下面方法
				var x = jQuery("#UIOCXLeftTop").offset().left;
				var y = jQuery("#UIOCXLeftTop").offset().top;
				var $this = jQuery(this);
				var $marker = jQuery('.frame-marker');
				if ($this.hasClass('clicked')) {
					$this.removeClass('clicked');
					$marker.removeClass('active');
					$container.removeClass('active');
				} else {
					$this.addClass('clicked');
					$marker.addClass('active');
					//描述信息置空
					jQuery('.frame-marker textarea').html(''); 
					//等级还原
					jQuery('#markerLevel option:first').attr('selected', 'selected'); 
					$container.addClass('active');
				}

				jQuery($container).appendTo("body");
				$container.css({
					left: x + (offset.Left - 0) + (offset.Width - $container.width()) / 2,
					top: y + (offset.Top - 0) + (offset.Height - $container.height()) / 2
				});

				/**
				 * 拆分添加帧标记的逻辑代码到单独的js文件中去，此处按事件驱动，按需加载路径 
				 * 2016.05.11 added by yangll
				 */
				require(["/module/inspect/controllbar/add-frame-mark.js"], function(addFrameMark) {
					addFrameMark.init(player, self);
				});

			});

		


			
			/**
			 * 启动/暂停pvg录像
			 */
			jQuery(document).on("click", ".local-video", function() {
				var $this = jQuery(this),
					channelData = player.cameraData[player.curChannel],
					cameraId = channelData.cId,
					channelId = channelData.playingChannel.id;
				//获取当前通道的录像服务状态
				var obj = {
					cameraId: cameraId,
					channelId: channelId,
					node: $this,
					isRecording: $this.hasClass("active"),
					callback: function(isRecording) {
						if (isRecording) {
							$this.removeClass("active");
							$this.attr("title", "启动服务器录像");
							notify.success("停止服务器录像成功！");
						} else {
							$this.addClass("active");
							$this.attr("title", "停止服务器录像");
							notify.success("启动服务器录像成功！");
						}
					}
				};

				//设置录像的服务状态
				self.setServerRecordStatus(obj);
			});

			//轮巡锁定
			jQuery(document).on('click', '.lockunlock', function(e) {
				e.preventDefault();
				e.stopPropagation();
				if (jQuery(this).is(".unlock-channel")) { //当前处于锁定状态，点击解锁
					self.inspect.unlock();
					/*jQuery(this).removeClass("unlock-channel");
					jQuery("#printScreen").hide();
					jQuery('#upBlockContent .tools-up .share').hide();
					jQuery(this).removeClass("unlock-channel");
					jQuery("#upBlockContent .tools-up .frame-mark").hide();
					jQuery("#upBlockContent .tools-up .zoom").hide();
					jQuery('#downBlockContent .video-type,#downBlockContent .alarm').show();*/
					self.unlockUI(self.player.curChannel - 0);
					self.displayBtnsByCameraType(false);
					//jQuery("#selectBlockContent .share [data-type='1']").hide();//隐藏发送扩展屏
				} else {
					self.inspect.lock();
					self.lockUI(self.player.curChannel - 0);
					/*jQuery(this).addClass("unlock-channel");
					jQuery("#upBlockContent .tools-up .zoom").show();
					jQuery('#downBlockContent .video-type,#downBlockContent .alarm').hide();*/
					self.displayBtnsByCameraType();
					//jQuery("#selectBlockContent .share [data-type='1']").show();//隐藏发送扩展屏
				}
			});

			//上面控制条按钮点击
			jQuery(document).on('click', '.tools-up i', function() {
				var $this = jQuery(this),
					$selectBlockContent = jQuery('#selectBlockContent'),
					thisLeft = $this.offset().left,
					classNames = $this.attr('class'),
					parentLeft = jQuery('.video-control').offset().left,
					bankIndex = classNames.indexOf(' '),
					className = bankIndex !== -1 ? classNames.substring(0, bankIndex) : classNames,
					oSelectList = $selectBlockContent.find('.' + className.split(' ')[0]).find('p.proportion'),
					oSelectList2 = $selectBlockContent.find('.' + className.split(' ')[0]).find('p.definition'),
					zoomList = $selectBlockContent.find('.' + className.split(' ')[0]).find('p'),
					optValue;
				//如果当前的索引值为空，则直接反回
				if (player.curChannel === -1) {
					return;
				}
				//高标清、轮巡状态获取
				var definition = player.cameraData[player.curChannel].definitionType,
					inspectStatus = self.getInspectStatus(player.curChannel - 0);
				//显示下拉列表
				jQuery('#selectBlock').removeClass('hidden');
				//根据不同的操作进行不同的处理
				switch (className) {
					case 'ratio':
						var $ratio = jQuery('#ratio p:gt(4)');
						//高标/标清勾选
						oSelectList2.eq(1 - definition).addClass('checked').siblings('.definition').removeClass('checked');
						// 监巡轮巡进行中隐藏标清和高清的切换
						if (inspectStatus.isGoing) {
							$ratio.hide();
						} else {
							$ratio.show();
							//如果视频打开不成功, 高清/标清隐藏
							if (player.cameraData[player.curChannel].cplayStatus === 1) {
								$ratio.hide();
							} else {
								var curChannel = self.player.cameraData[self.player.curChannel];
								if ((curChannel.sdChannel && curChannel.hdChannel) && (!curChannel.sdChannel.length || !curChannel.hdChannel.length)) {
									$ratio.hide();
								} else {
									$ratio.show();
								}
							}
						}

						//播放器获取画面比例
						optValue = player.getRatio(player.curChannel) - 1;
						oSelectList.eq(optValue).addClass('checked').siblings('.proportion').removeClass('checked');
						break;
					case 'zoom':
						//放大
						var zoomType = player.cameraData[player.curChannel].zoomType;
						if (zoomType === 0) {
							zoomList.eq(zoomType).addClass('checked').siblings().removeClass('checked');
						}
						//修改OCX放大功能（取消放大下拉框） by zhangxinyu 2015-08-06
						jQuery("#zoom").remove();
						var inspectStatus = self.getInspectStatus(player.curChannel - 0);
						if ($this.hasClass('aa')) {
							$this.removeClass('aa');
							player.cameraData[player.curChannel].zoomType = null;
							player.stopZoom(player.curChannel);
							self.hidSelectBlock();
							return;
						} else {
							if (inspectStatus.isGoing) { //如果是轮巡未锁定或者监巡未暂停状态则禁用数字放大
								if (inspectStatus.type) { //轮巡
									if (inspectStatus.action) { //锁定
										$this.addClass('checked').siblings().removeClass('checked');
										player.cameraData[player.curChannel].zoomType = 0;
									} else { //未锁定
										jQuery(".tools-up .zoom").trigger('click');
										return notify.warn("请先锁定当前窗口后再重试放大功能");
									}
								} else { //监巡
									if (inspectStatus.action) { //暂停中
										$this.addClass('checked').siblings().removeClass('checked');
										player.cameraData[player.curChannel].zoomType = 0;
									} else { //未暂停
										jQuery(".tools-up .zoom").trigger('click');
										return notify.warn("请先暂停监巡后再重试放大功能");
									}
								}
							} else {
								$this.addClass('aa').siblings().removeClass('clicked');
								player.cameraData[player.curChannel].zoomType = 0;
							}
						}
						player.digitalZoom(0, player.curChannel); //局部放大
						//end
						break;
					case 'share':
						//分享
						break;
					case 'multi':
						//多功能
						var path = player.cameraData[player.curChannel].path ? player.cameraData[player.curChannel].path : player.cameraData[player.curChannel].playingChannel.path,
							data = {
								cameraId: player.cameraData[player.curChannel].cId,
								cameraNo: path
							},
							success = function(res) {
								if (res && res.code === 200) {
									//返回的是字符串0 表示未锁定
									player.cameraData[player.curChannel].isLocked = !!parseInt(res.data.lock);
									var isLocked = player.cameraData[player.curChannel].isLocked;
									if (isLocked) {
										jQuery('#lockPtz').addClass('checked');
									} else {
										jQuery('#lockPtz').removeClass('checked');
									}
								} else {
									notify.warn("获取云台状态失败!");
								}
							};
						var cType = parseInt(player.cameraData[player.curChannel].cType);
						if (cType === 0) { //枪机
							jQuery('#engrossPtz, #lockPtz,#imageShield').addClass('disabled');
						} else if (cType === 1) { //球机
							gPTZService.checkLock(data, success); //获取云台锁定状态 0未锁定 1锁定

							self.checkPTZMonopolyStatus(player); //获取云台独占状态 0独占  1未独占
						} else {
							notify.warn('未获取到摄像机类型！');
						}

						var isMute = player.cameraData[player.curChannel].isMute = player.isSoundEnable(player.curChannel);
						if (isMute) {
							jQuery('#mute').addClass('checked');
						} else {
							jQuery('#mute').removeClass('checked');
						}
						break;
					default:
						//关闭
						jQuery('.flag').removeClass('active');
				}
				self.displayIframe($this);
			});

			//点击 下拉选择子项将select-iframe隐藏
			jQuery(document).on('click', '#selectBlockContent div p', function(event) {
				var type = jQuery(this).data('type'),
					LOCKTIME, //云台锁定时间
					btnId = jQuery(this).parent().attr('id'); //代表类型。例如比例、放大。。。。
				var inspectStatus = self.getInspectStatus(player.curChannel - 0);
				if (jQuery(this).hasClass('disabled')) {
					return;
				}
				switch (btnId) {
					case 'ratio':
						if (type < 6) {
							player.setRatio(type, player.curChannel); //设置画面比例
							if (player.cameraData[player.curChannel].playingChannel) { //扩展屏用
								player.cameraData[player.curChannel].playingChannel.ratioType = type;
							} else {
								player.cameraData[player.curChannel].ratioType = type;
							}
						} else if (type === 6) {
							//高清处理流程
							if (!player.cameraData[player.curChannel].hdChannel.length) {
								notify.warn('该摄像机不存在高清通道，无法切换到高清模式');
								break;
							} else {
								player.addEvent('HDvideo', function() {
									jQuery(self).addClass('checked').siblings('.definition').removeClass('checked');
								});
								player.switchDefinition(player.curChannel, 1); //type: 0:标清  1：高清
							}
						} else if (type === 7) {
							//标清处理流程
							if (!player.cameraData[player.curChannel].sdChannel.length) {
								notify.warn('该摄像机不存在标清通道，无法切换到标清模式');
								break;
							} else {
								player.addEvent('SDvideo', function() {
									jQuery(self).addClass('checked').siblings('.definition').removeClass('checked');
								});
								player.switchDefinition(player.curChannel, 0); //type: 0:标清  1：高清
							}
						}
						break;
					case 'zoom': //放大

						//检测是否处于放大状态，如果是则先关闭放大
						var that = jQuery(this);
						/*var lastZoomType = that.parent().find('.checked').data('type');
						if (lastZoomType !== null) {
							player.stopZoom(player.curChannel);
						}*/

						if (that.hasClass('checked')) {
							that.removeClass('checked');
							player.cameraData[player.curChannel].zoomType = null;
							player.stopZoom(player.curChannel);
							self.hidSelectBlock();
							return;
						} else {
							if (inspectStatus.isGoing) { //如果是轮巡未锁定或者监巡未暂停状态则禁用数字放大
								if (inspectStatus.type) { //轮巡
									if (inspectStatus.action) { //锁定
										that.addClass('checked').siblings().removeClass('checked');
										player.cameraData[player.curChannel].zoomType = type;
									} else { //未锁定
										jQuery(".tools-up .zoom").trigger('click');
										return notify.warn("请先锁定当前窗口后再重试放大功能");
									}
								} else { //监巡
									if (inspectStatus.action) { //暂停中
										that.addClass('checked').siblings().removeClass('checked');
										player.cameraData[player.curChannel].zoomType = type;
									} else { //未暂停
										jQuery(".tools-up .zoom").trigger('click');
										return notify.warn("请先暂停监巡后再重试放大功能");
									}
								}
							} else {
								that.addClass('checked').siblings().removeClass('checked');
								player.cameraData[player.curChannel].zoomType = type;
							}
						}
						switch (type) {
							case 0: //局部放大
								player.digitalZoom(0, player.curChannel);
								break;
							case 1: //3D放大
								player.digitalZoom(1, player.curChannel);
								break;
							case 2:
								break;
						}
						break;
					case 'share': //分享
						//TODO
						switch (type) {
							case 0: //发送电视墙
								var cameraData = player.cameraData[player.curChannel];
								var cameracode = cameraData.cCode;
								var id = cameraData.cId;
								var name = cameraData.cName;
								var hdchannel = cameraData.hdChannel;
								var sdchannel = cameraData.sdChannel;
								//监巡、轮巡时
								if (inspectStatus.isGoing) {
									hdchannel = [];
									sdchannel = {
										'id': cameraData.cId,
										'ip': cameraData.ip,
										'password': cameraData.passwd,
										'port': cameraData.port,
										'username': cameraData.user,
										'channel_status': cameraData.cStatus,
										'pvg_group_id': 2
									}
								}
								//将数组转换成字符串
								if (typeof hdchannel === 'object') {
									hdchannel = hdchannel ? JSON.stringify(hdchannel) : '';
								}
								if (typeof sdchannel === 'object') {
									sdchannel = sdchannel ? JSON.stringify(sdchannel) : '';
								}
								window.gTvwallArrayGis = [cameracode, id, name, hdchannel, sdchannel];
								//初始化并显示电视墙
								insert.initData();
								jQuery(".major-reset").css({
									'width': '100%',
									'right': 0
								});
								new mouseTip().bindEvents();
								if (cameracode !== '') {
									name = name + '(' + cameracode + ')';
								}
								logDict.insertLog('m1', 'f1', 'o6', 'b9', name, name); //日志
								break;
							case 1: //发送到扩展屏
								var extendDate = {};
								var cameraOriginal = player.cameraData[player.curChannel];
								var camera = Object.clone(cameraOriginal);
								var cName = camera.cName;
								var cCode = camera.cCode;
								// var isClose = false;
								//轮询锁定状态
								var FlagLoop = inspectStatus.isGoing && inspectStatus.type && inspectStatus.action;
								//监巡暂停状态
								var FlagInspectPausing = inspectStatus.isGoing && !inspectStatus.type && inspectStatus.action;
								var str = gVideoPlayer.getVideoInfo(player.curChannel);
								if (str !== '') {
									var videoType = str.videoType;
									if (videoType === 2) {
										return notify.warn('历史视频暂时不支持发送扩展屏');
									}
								}
								if (inspectStatus.isGoing) {
									if (inspectStatus.type) {
										if (!inspectStatus.action) {
											return notify.info('请先锁定当前窗口后再重试发送扩展屏功能');
										}
									} else {
										if (!inspectStatus.action) {
											return notify.info('请先暂停监巡后再重试发送扩展屏功能');
										}
									}
								}
								// var Flag = (FlagLoop || FlagInspectPausing) ? camera : (camera && camera.playingChannel);
								var ratioType = player.getRatio(player.curChannel - 0);
								// if (Flag) {
								//isClose = !(window.LoopInspect && LoopInspect.isGoing);
								/*extendDate = {
									cCode: camera.cCode,
									cName: camera.cName,
									cType: camera.cType,
									id: camera.cId,
									ip: camera.ip || camera.playingChannel.ip,
									passwd: camera.passwd || camera.playingChannel.passwd,
									path: camera.path || camera.playingChannel.path,
									port: camera.port || camera.playingChannel.port,
									ratioType: ratioType,
									type: camera.type || camera.playingChannel.type,
									user: camera.user || camera.playingChannel.user,
									cStatus: camera.cStatus
								};*/
								extendDate = {
									cCode: camera.cCode,
									cName: camera.cName,
									cType: camera.cType,
									cId: camera.cId,
									cStatus: camera.cStatus,
									hdChannel: camera.hdChannel,
									sdChannel: camera.sdChannel
								};

								if (inspectStatus.isGoing) {
									if (inspectStatus.type) { //轮巡监巡
										self.inspect.unlock();
										player.playerObj.Stop(false, player.curChannel);
										cameraOriginal.isSend = true;
									} else {
										player.playerObj.Stop(false, player.curChannel);
										cameraOriginal.isSend = true;
									}
								} else if (jQuery('.patrol>.joint-layer').is(':visible')) {
									player.playerObj.Stop(false, player.curChannel);
									cameraOriginal.isSend = true;
								} else {
									player.stop(false, player.curChannel);
								}
								player.refreshWindow(player.curChannel);
								// }

								// window.open('temiframe.html', 'temiframe');
								// window.openExpandScreen('temiframe.html', 'temiframe');
								//

								var data = {
									'layout': player.getLayout(),
									'cameras': Array.from(Object.clone(extendDate))
								};
								window.sendExtendScreen(BroadCast, data);
								/*if(isIE()){
									if(window.expandWinHandle&&typeof(window.expandWinHandle.document)!=="unknown"){
										BroadCast.emit("ExtendSreen",data);
									}else{
										window.expandWinHandle = window.openExpandScreen("/module/inspect/monitor/screen.html", "screen");
										setTimeout(function(){
											BroadCast.emit("ExtendSreen",data);
										},2000);
									}
								}
								else{
									if(window.expandWinHandle&&window.expandWinHandle.window){
										BroadCast.emit("ExtendSreen",data);
									}else{
										window.expandWinHandle = window.openExpandScreen("/module/inspect/monitor/screen.html", "screen");
										setTimeout(function(){
											BroadCast.emit("ExtendSreen",data);
										},2000);
									}
								}*/
								if (cCode !== '') {
									cName = cName + "(" + cCode + ")";
								}
								logDict.insertLog('m1', 'f1', 'o6', 'b10', cName, cName); //日志
								break;
							case 2: //发送到视图库
								notify.warn('暂不支持');
								break;

						}
						break;
					case 'multi': //多功能
						switch (type) {
							case 0: //云台独占
								var isMonopoly = player.cameraData[player.curChannel].isMonopoly;
								gPtz.ptzMonopoly({
									cameraId: player.cameraData[player.curChannel].cId,
									monopolyStatus: isMonopoly
								});
								break;
							case 1: //云台锁定
								// LOCKTIME = isLocked ? 0 : 1000;//设为0表示解锁	1000 pvg默认锁定时间
								if (!self.ptzUserable('进行云台锁定操作')) {
									return;
								}
								var isLocked = player.cameraData[player.curChannel].isLocked,
									cType = parseInt(player.cameraData[player.curChannel].cType);
								if (cType === 1) {
									if (isLocked) {
										player.cameraData[player.curChannel].isLocked = false;
										LOCKTIME = 0; //设为0表示解锁
									} else {
										player.cameraData[player.curChannel].isLocked = true;
										LOCKTIME = 1000; //pvg默认锁定时间
									}
									var path = player.cameraData[player.curChannel].path ? player.cameraData[player.curChannel].path : player.cameraData[player.curChannel].playingChannel.path;
									gPtz.lock({
										cameraId: player.cameraData[player.curChannel].cId,
										cameraNo: path,
										// operation:isLocked?1:0,
										lockTime: LOCKTIME

									});
									// player.playerObj.PtzLock(LOCKTIME, player.curChannel);//只需要往后端发送一次请求就好，ocx这里的可以取消，具体可以问下马越或者方圆
									var Flag = (LOCKTIME = 0) ? 1 : 0;
									player.switchPTZ(Flag, player.curChannel); //console.log('controlbar3575')
									// player.playerObj.SetWind owPTZByIndex(Flag, player.curChannel);
								}
								break;
							case 2:
								//TODO
								break;
							case 3: //声音开关
								var toggleMute = !player.cameraData[player.curChannel].isMute;
								player.toggleSound(player.curChannel);
								//存储声音状态以便扩展屏中声音状态一致
								player.cameraData[player.curChannel].isMute = toggleMute;
								break;
							case 4:
								//TODO
								break;
							default:
						}
						break;
					default:
				}
				self.hidSelectBlock();
			});

			//截图
			/*jQuery(document).on('click', '#printScreen', function() {
				player.printScreen(player.curChannel);
			});*/

			/*---------------------------------------------------------------------------------------------------------------------*/
			// 手动报警
			jQuery(document).on("click", "#downBlockContent .manual-alarm", function() {
				require(["/module/inspect/manual-alarm/js/manual-alerm-view.js"], function(manualView) {
					manualView.init(player);
				});
				return;
			});

			//解决打开控制台截图列表显示不正确的BUG #2235
			/*jQuery(window).on("resize",function(){
			   jQuery("#picbox").hide();
			   var html=jQuery("#picbox").html();
			   setTimeout(function(){
				  jQuery("#picbox").html(html);
				  jQuery("#picbox").show();
			   },10);
			});*/

			//连拍
			jQuery(document).on('click', '#printScreen2', function(evt) {
				evt.preventDefault();
				evt.stopPropagation();
				//下面两行代码本来是多余的，主要是为了修复关闭预览面板之后，工具栏不显示等bug的
				jQuery("#printScreen").trigger("click");
				jQuery(".preview-panel #picbox img:eq(0)").remove();

				var index = player.curChannel;
				var inspectStatus = self.getInspectStatus(index - 0);
				if (inspectStatus.isGoing && inspectStatus.type && !inspectStatus.action) {
					notify.warn("轮巡未锁定状态不允许截图！");
					return;
				}
				if (inspectStatus.isGoing && !inspectStatus.type && !inspectStatus.action) {
					notify.warn("监巡未暂停状态不允许截图！");
					return;
				}

				var Flag = player.playerObj.GetVideoAttribute(index);
				if (Flag == "ERROR") {
					player.cameraData[index].picFlag = false;
					return notify.warn("视频没有正常打开，暂不能抓图！", {
						timeout: 800
					});
				}
				if (!jQuery("#downBlock").hasClass('printscreen')) {
					jQuery("#downBlock").addClass("printscreen"); //拍图时下方控制区增加额外样式
					jQuery('#picbox,#preview_img').empty();
				}

				//显示图片预览区
				if (jQuery("#picbox img").length < 10) {
					if (!player.cameraData[index].picFlag) { //若是第一次点击抓图按钮,需要清除之前的抓图
						jQuery(".screenshot-preview").show().addClass('show');
						jQuery("#picbox").css('left', '0');
						jQuery("#preview_img").html(''); //清空上次内容
						jQuery("#picbox").html(''); //清空上次内容
					} else {} //非第一次抓图，需要取出点击截图按钮时#picbox的left值

					player.playerObj.ContinuousCatchScaleDownPictures(index, 3, 320, 0, true, 5, function(id, result, brPicture, brRawPicture, userParam) {
						var pic;
						var img = jQuery("<img class='viewer-image' stype='1' needupload='true'/>"); //stype='1'表示是特殊情况 needupload是否需要上传
						var li = jQuery("<li>");
						//pic = player.grabCompressEx2(player.curChannel, 320, 0);
						self.originPic.unshift({
							'url': brRawPicture,
							'status': false
						});
						//console.log("brRawPicture="+brRawPicture);
						player.cameraData[index].picFlag = true; //抓图标示位，每次只允许一个通道处于抓图状态
						img.attr("src", "data:image/jpg;base64," + brPicture);
						//img.attr("src", "/assets/images/badges.png");//测试base64和非base64的差异
						//li.append(img.clone());
						jQuery("#preview_img").attr("data-cid", player.cameraData[index].cId);
						jQuery("#preview_img").prepend('<li><img></li>');
						jQuery("#picbox").prepend(img);
						showBtn();
						jQuery(".screenshot-preview").attr("screen", index);
						//self.originPic = player.grabOriginalEx(player.curChannel);

					}, 0);
				} else {
					notify.warn("您已达到抓图上限！您可以点击缩略图预览大图并进行上传！");
				}
				evt.preventDefault();
			});

			/*-------------------------------抓图 **start--------------------------------------------------
			-------------------------添加抓图代码时，请注意同步修改OnMouseMoveWindow事件中用于控制抓图按钮是否显示的部分。
			目前没有修改OnMouseMoveWindow事件  added by yangll*/
			jQuery(document).on("click", "#printScreen", function(event) {

				var index = player.curChannel,
					inspectStatus = self.getInspectStatus(index - 0);
				if (inspectStatus.isGoing && inspectStatus.type && !inspectStatus.action) {
					notify.warn("轮巡未锁定状态不允许截图！");
					return;
				}
				if (inspectStatus.isGoing && !inspectStatus.type && !inspectStatus.action) {
					notify.warn("监巡未暂停状态不允许截图！");
					return;
				}

				var Flag = player.playerObj.GetVideoAttribute(index);
				if (Flag == "ERROR") {
					player.cameraData[index].picFlag = false;
					return notify.warn("视频没有正常打开，暂不能抓图！", {
						timeout: 800
					});
				}
				if (!jQuery("#downBlock").hasClass("printscreen")) {
					//抓图时下方控制区增加额外样式
					jQuery("#downBlock").addClass("printscreen"); 
					//会考虑在index.html中将id=preview_img的html代码片段删去的
					//jQuery("#picbox, #preview_img").empty();
					jQuery("#picbox").empty();
				}

				require(["/module/inspect/controllbar/print-screen.js"], function(printScreen) {
					printScreen.init(player,self);
				});
				event.preventDefault();
			});
			/*-------------------------------抓图 **end--------------------------------------------------*/
			
			//切换分屏布局时将控制条隐藏
			player.addEvent('STOP', function() {
				//使遮挡层消失
				jQuery('.video-control').css('left', 10000);
				//恢复默认值
				player.curChannel = -1;
			});



			/*设置倍速显示*/
			var showPlaySpeed = function(index) {
				var tmp = player.getPlaySpeed(index);
				jQuery('#downBlockContent .times-play').text('x' + tmp);
			};

			// 慢速播放 在视频控制条上的
			jQuery('#downBlockContent').on('click', '.video-btn .slow-play', function() {
				var index = player.curChannel;
				var str = player.playerObj.GetVideoAttribute(index) + "";
				if (str == "ERROR") {
					notify.warn("未播放视频或录像，操作无效");
					return;
				}

				var index = player.curChannel;
				var tmp = player.getPlaySpeed(index);
				if (tmp === '1/8') {
					notify.warn('已经是最小倍速！');
					return false;
				}
				if (window.SelectCamera && window.SelectCamera.ListData[index].times) {
					window.SelectCamera.ListData[index].times = null;
					var node = jQuery(".video-btn .toggle-play");
					node.removeClass("toggle-play");
					node.addClass("toggle-pause");
				}
				player.setPlaySpeed(-1, index);
				jQuery('#downBlockContent .video-btn .toggle-play').addClass('paused times');
				showPlaySpeed(index);
				//self.startRepaint(index);
			});

			// 快速播放 在视频控制条上的
			jQuery('#downBlockContent').on('click', '.video-btn .quick-play', function() {
				var index = player.curChannel;
				var str = player.playerObj.GetVideoAttribute(index) + "";
				if (str == "ERROR") {
					notify.warn("未播放视频或录像，操作无效");
					return;
				}

				var index = player.curChannel;
				var tmp = player.getPlaySpeed(index);
				if (tmp === '8') {
					notify.warn('已经是最大倍速！');
					return false;
				}
				if (window.SelectCamera && window.SelectCamera.ListData[index].times) {
					window.SelectCamera.ListData[index].times = null;
					var node = jQuery(".video-btn .toggle-play");
					node.removeClass("toggle-play");
					node.addClass("toggle-pause");
				}
				player.setPlaySpeed(1, index);
				jQuery('#downBlockContent .video-btn .toggle-play').addClass('paused times');
				showPlaySpeed(index);
			});

			var PlayorPause = function(stype, obj) {
				var index = player.curChannel;
				if (jQuery(obj).hasClass('times')) {
					player.setPlaySpeed(0, index);
					showPlaySpeed(index);
					jQuery(obj).removeClass('paused times');
				} else {
					var N;
					//如果已经播放完毕，则seek到录像片段的开始位置
					if (window.isPlayOver) {
						player.playerObj.SetPlayMode(2, 0, index);
						//启动监听
						var str = player.playerObj.GetVideoAttribute(index);
						if (str !== "ERROR") {
							self.ListenPlayerProgress(player, index);
						}
						window.isPlayOver = false;
					} else {
						N = player.togglePlay(index);
					}

					if (stype == "play") {
						jQuery(obj).removeClass("toggle-play");
						jQuery(obj).addClass("toggle-pause");
					} else {
						jQuery(obj).removeClass("toggle-pause");
						jQuery(obj).addClass("toggle-play");
					}
					if (N == -20008) {
						var camid = player.findcamid(player.cameraData[index]);
						return;
					}
					if (N < 0) {
						var str = player.getErrorCode(N);
						notify.warn("播放失败:" + str);
					}
					jQuery(obj).toggleClass('paused');
				}
			}

			// 播放/暂停 在视频控制条上的
			jQuery('#downBlockContent').on('click', '.video-btn .toggle-play', function() {
				var index = player.curChannel;
				var str = player.playerObj.GetVideoAttribute(index) + "";
				if (str == "ERROR") {
					notify.warn("未播放视频或录像，操作无效");
					return;
				}
				PlayorPause("play", this);
				var index = player.curChannel;
				if (!window.SelectCamera) {
					return;
				}
				var tmp = window.SelectCamera.ListData[index].times || window.SelectCamera.ListData[index].speed;
				jQuery('#downBlockContent .times-play').text('x' + tmp);
				window.SelectCamera.ListData[index].times = null;
				player.cameraData[index].singleframe = false;
			});

			// 播放/暂停 在视频控制条上的
			jQuery('#downBlockContent').on('click', '.video-btn .toggle-pause', function() {
				var index = player.curChannel;
				var str = player.playerObj.GetVideoAttribute(index) + "";
				if (str == "ERROR") {
					notify.warn("未播放视频或录像，操作无效");
					return;
				}

				var index = player.curChannel;
				var tmp = player.getPlaySpeed(index);
				if (window.SelectCamera) {
					window.SelectCamera.ListData[index].times = tmp;
				}
				PlayorPause("pause", this);
			});

			// 停止 在视频控制条上的
			jQuery('#downBlockContent').on('click', '.video-btn .stop-play', function() {
				//jQuery('#upBlockContent .tools-up .close').trigger('click');
				var index = player.curChannel;
				var str = player.playerObj.GetVideoAttribute(index) + "";
				if (str == "ERROR") {
					notify.warn("未播放视频或录像，操作无效");
					return;
				}

				var index = player.curChannel;
				player.stopStream(index);
			});

			// 下载历史录像 在视频控制条上的
			jQuery('#upBlockContent').on('click', '.tools-up .download', function() {
				//jQuery('#upBlockContent .tools-up .close').trigger('click');
				player.setFocusWindow(index);
				var index = player.curChannel;
				HistoryHandler.downloadRecord(index);
			});

			jQuery(function() { //added by yangll :此函数的作用是什么，也是设置分屏吗
				var layoutCount = 1;

				function permissionLayoutCount() {
					if (permission.klass["sixteen-channel"] === "sixteen-channel") {
						layoutCount = 4;
					} else if (permission.klass["nine-channel"] === "nine-channel") {
						layoutCount = 3;
					} else if (permission.klass["four-channel"] === "four-channel") {
						layoutCount = 2;
					} else {
						layoutCount = 1;
					}
				}
				permissionLayoutCount();
				if (layoutCount === 1) {
					jQuery("#npplay .menu .dropdown i").attr('title', '1分屏');
					jQuery("#npplay .menu .dropdown i").css({
						'backgroundPosition': '0px 0px'
					});
					/*设置一分屏*/
					setTimeout(function() {
						self.player.setLayout(1);
					}, 200);
				}
			});
			//fix bug
			jQuery(document).on("keyup", "#markerName,#markerDescription", function() { //added by yangll: 此函数的功能是什么
				var L = jQuery(this).attr("maxLength");
				var str = jQuery(this).val();
				if (str.length > L) {
					str = str.substr(0, L);
					jQuery(this).val(str);
				}
			});

			// 工具条-GPU硬解 by songxj
			jQuery(document).on('click', ".tools-up .gpu", function(e) {
				e.preventDefault();
				e.stopPropagation();
				self.setSingleVideoGPU(jQuery(this));
			});

			//工具条-地图定 位播放
			jQuery(document).on('click', ".tools-up .location-play", function(e) {
				e.preventDefault();
				e.stopPropagation();
				var index = player.curChannel;
				var data = player.cameraData[index];
				var pobj = {
					index: index,
					data: data
				};
				var id = data.cId;
				//window.open("/module/inspect/dispatch/point-play.html#"+id,"dispatch");
				/**
				 * bug[33758],由于接收方式根据hash变化来的，故同一个摄像机点两次，接收方接不到消息，所以在hash上添加了当前时间，加以区别
				 * add by zhangyu on 2015/6/4
				 */
				var T = (new Date()).getTime();
				window.openExpandScreen("/module/inspect/dispatch/point-play.html#" + id + "@" + T, "dispatch");
			});

			//工具条-云台，预置位，巡航
			jQuery(document).on('click', ".tools-up .ptz-control", function(e) {
				e.preventDefault();
				e.stopPropagation();
				var index = player.curChannel;
				var data = player.cameraData[index];
				var pobj = {
					index: index,
					data: data,
					player: player,

				};
				//加入权限
				pobj.data.klass = window.permission.klass;
				player.playerObj.SetFocusWindow(index);
				PtzController.showDialog({
					center: true
				}, pobj);
			});

			//工具条-色彩调节
			jQuery(document).on('click', ".tools-up .color-adjust", function(e) {
					require(["/module/inspect/controllbar/color-adjust.js"], function(colorAdjust) {
						colorAdjust.init(player);
					});
				e.preventDefault();
				e.stopPropagation();
			});
			//工具条 历史按钮
			jQuery(document).on("click", ".tools-dwon i.history-record", function(e) {
				e.preventDefault();
				e.stopPropagation();
				var index = player.curChannel;
				var data = player.cameraData[index];
				var pobj = {
					index: index,
					data: data,
					player: player,
					fn: function() {
						jQuery(".search-history button.search").trigger("click");
					}
				};
				pobj.data.userRoleScore = window.localStorage.getItem("userRoleScore"); /*存用户级别，在用下载权限的时候使用*/
				player.playerObj.SetFocusWindow(index);
				vodHistory.showDialog({
					center: true
				}, pobj);
			});
			//开启或者关闭声音接入
			jQuery(document).on('click', ".real-sound", function(e) {
				e.preventDefault();
				e.stopPropagation();
				var index = player.curChannel,
					N;
				if (player.playerObj.IsSoundEnable(index)) {
					//关闭声音
					N = player.playerObj.SoundEnable(false, index);
					if (N === 0) {
						jQuery(this).attr("title", "开启声音").removeClass("real-sound-off");
						//更新缓存对象
						player.cameraData[index].isSoundIn = false;
					} else {
						console.log("声音关闭失败！");
					}
				} else {
					//开启声音
					N = player.playerObj.SoundEnable(true, index);
					if (N === 0) {
						jQuery(this).attr("title", "关闭声音").addClass("real-sound-off");
						//更新缓存对象
						player.cameraData[index].isSoundIn = true;
					} else {
						console.log("声音开启失败！");
					}
				}
			});
			//开启或者关闭语音对讲
			jQuery(document).on('click', ".real-talk", function(e) {
				e.preventDefault();
				e.stopPropagation();
				var $this = jQuery(this),
					index = player.curChannel,
					N;
				if ($this.hasClass("real-talk-off")) {
					//关闭对讲
					N = player.playerObj.SetOption(JSON.stringify({
						"stoptalkback": {
							"pos": parseInt(index)
						}
					}));
					if (N === 0) {
						$this.attr("title", "开启对讲").removeClass("real-talk-off");
					} else {
						console.log("语音对讲关闭失败！");
					}
				} else {
					isRealTalk(index, N, $this);
				}
			});

			//判断该摄像机是否支持语音对讲 by zhangxinyu
			function isRealTalk(index, N, self) {
				var curObj = player.cameraData[index],
					channelId = player.findcamid(curObj),
					params = {
						channelId: channelId
					};
				jQuery.ajax({
					url: "/service/video_access_copy/getAudioInfo",
					type: "get",
					data: params,
					dataType: "json",
					success: function(res) {
						if (res.code === 200) {
							if (res.data && res.data.audioInfo && res.data.audioInfo.name) {
								//开启对讲
								N = player.playerObj.SetOption(JSON.stringify({
									"starttalkback": {
										"pos": parseInt(index),
										"mode": 3
									}
								}));
								if (N === 0) {
									self.attr("title", "关闭对讲").addClass("real-talk-off");
									//如果当前声音开启，则需要关闭
									if (jQuery(".real-sound").hasClass("real-sound-off")) {
										jQuery(".real-sound").trigger("click");
									}
								} else {
									if (N === -21011) {
										notify.warn("未发现音频录入设备。");
									}
									console.log("语音对讲开启失败！");
								}
							} else {
								notify.warn("该摄像机不支持语音对讲功能！");
							}
						} else if (res.code === 500) {
							notify.error(res.data.message);
						} else {
							notify.warn("服务器或网络异常！");
						}
					}
				});
			};

			// 播放/暂停 在视频控制条上的
			var Timer = null;
			jQuery('#downBlockContent').on('dblclick', '.video-btn .single-frame', function(evt) {
				clearTimeout(Timer); //在双击事件中，先清除前面click事件的时间处理
				evt.preventDefault();
				evt.stopPropagation();
			});

			jQuery('#downBlockContent').on('click', '.video-btn .single-frame', function() {
				clearTimeout(Timer);
				var index = player.curChannel;
				var str = player.playerObj.GetVideoAttribute(index) + "";
				if (str == "ERROR") {
					notify.warn("未播放视频或录像，操作无效");
					return;
				}
				if (!player.cameraData[index].singleframe) {
					player.cameraData[index].singleframe = true;
					jQuery(".video-btn .toggle-pause").trigger("click");
				}
				player.playerObj.SetPlayMode(0, -2, index);
			});

			PlayerControler.removeEvents("dragEnd", {
				internal: false
			});
			PlayerControler.addEvent("dragEnd", function(obj) {
				player = player || window.gVideoPlayer;
				var index = obj.index - 0,
					ListData = window.SelectCamera.ListData[index],
					$seekPosObj = jQuery("#winPopup-showframe div"),
					N,
					time;
				if (typeof(ListData) == "object") {
					var beginTime = ListData.beginTime;
					var endTime = ListData.endTime;
					//如果有浮动seek标记，则直接读取时间进行播放，不在进行重新计算
					if ($seekPosObj && $seekPosObj.text() !== "") {
						var seekTime = Toolkit.str2mills($seekPosObj.text().trim());
						time = seekTime - beginTime;
					} else {
						var per = obj.per;
						var dis = endTime - beginTime;
						time = parseInt((endTime - beginTime) * per);
					}
					window.SelectCamera.ListData[index].timePoint = 0;
					var vodType = ListData.vodType;
					if (time < 0) {
						time = 0;
					}
					console.log("seek time:", Toolkit.mills2datetime(time + beginTime), time, "录像开始时间：", Toolkit.mills2datetime(beginTime), "录像结束时间：", Toolkit.mills2datetime(endTime));
					//校时1s钟
					var time = time - 1000;
					//seek 偶尔会失败
					N = player.playerObj.SetPlayMode(2, (time < 0 ? 0 : time), index);
					if (N < 0) {
						notify.warn("定位播放失败:" + player.getErrorCode(N + ""));
					}
					//300毫秒后重新读取进度条，由于ocx中更新状态为200毫秒，故需要等ocx写入值之后再进行
					//后续改用SetPlayMode的回调函数进行
					if (self.timer) {
						window.clearTimeout(self.timer);
					}
					self.timer = setTimeout(function() {
						self.ListenPlayerProgress(player, index, true);
					}, 3000);
				}
			});
		}
	});
	return ControlBar;
});
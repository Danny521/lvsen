/**
 * @description 播放器的使用封装
 **/
define(['/module/common/js/player2.js','base.self'],function(){

	var player = {
		Implements: [Options, Events],
		player: null,/*保存VideoPlayer类的实例对象*/
		playStatus: -1,/*视频播放是否正常*/
		firstFrameBase64: '',/*视频第一帧的 base64 流*/
		intervalFlag:null,// 计时器
		totalWidth:800,
		cameraData:null,
		enableUpdateTime: true,
		options: {},
		playParm:null,
		initPlayer: function(playParm) {
			var self = this,
				fileName = playParm.fileName;

			// 检查是否有ocx播放插件
			if (window.checkPlayer && window.checkPlayer()) {
				return;
			}

			self.player = new VideoPlayer({
				layout: 1,
				resize:true,
				uiocx: 'UIOCX'
			});

			self.playParm = playParm;
			/*PFS回调函数*/
			var PFSResultCallback = function() {
				self.duration = self.player.getVideoInfo(0).duration;
				self.totalWidth = jQuery(self.player.playerObj).width();
				self.setAllTime();
				//self.updateTimeDisplay();
				if (self.intervalFlag === null) {
					self.intervalFlag = window.setInterval(self.updateTimeDisplay.bind(self), 500);
				}
				//默认播放，更新按钮样式
				jQuery(".video-block .switch").attr("title", "暂停").addClass('active');
				//绑定事件
				self.bindEvents();
			};
			/*历史录像回调函数*/
			var historyResultCallback = function() {
				self.duration = self.player.getVideoInfo(0).duration ? self.player.getVideoInfo(0).duration : self.playParm.endtime - self.playParm.begintime;
				self.totalWidth = jQuery(self.player.playerObj).width();
				self.setAllTime();
				//self.updateTimeDisplay();
				if (self.intervalFlag === null) {
					self.intervalFlag = window.setInterval(self.updateTimeDisplay.bind(self), 500);
				}
				//默认播放，更新按钮样式
				jQuery(".video-block .switch").attr("title", "暂停").addClass('active');
				//绑定事件
				self.bindEvents();
			};
			if (self.playParm.videoType === 1) { // PFS视频播放
				self.playPFSVideo(fileName, PFSResultCallback);
			} else { // 历史录像播放
				self.player.getCameraDataById(self.playParm.cameraId, 0, function(data) {
					self.getHistoryList(self.player.findcamid(data), historyResultCallback); // self.player.findcamid():获取摄像机通道id
				});
			}
		},
		playPFSVideo: function(fileName, resultCallback) {
			var self = this,
				videoObj = {
					"type": 3,
					"filename": fileName
				};

			self.player.playNPFS(videoObj, 0, jQuery.noop, resultCallback);
		},
		getHistoryList:function(channelId,callback){

			var _t = this,
				begintime = _t.playParm.begintime,
				endtime = _t.playParm.endtime,
				channelId= channelId;
			/*获取录像片段和录像深度*/
			jQuery.ajax({
				url: '/service/history/list_history_videos_other',
				data: {
					channel_id: channelId,
					begin_time: begintime,
					end_time: endtime
				},
				cache: false,
				type: 'GET',
				async: true,
				success: function(res)
				{
					if (res.code === 200)
					{
						var camera =res.data;
						console.log("camera.videos:",camera.videos);
						if(camera.videos && camera.videos.length>0){
							var vodType =camera.videos[0][2];
						}else{
							notify.warn("该录像无法播放！");
							return false;
						}

						_t.cameraData = camera;
						_t.player.playHis(0,begintime,endtime,vodType,camera);
						callback && callback();
					}
					else if(res.code === 500)
					{
						if (res.data == "pvg异常(-17:输出参数缓冲区太小)" || res.data == "未知异常异常:RMIP_ERR_OUT_BUF_TOO_SMALL 值:-17") {
							notify.warn("该摄像机没有这个时间段的录像或查询录像异常！错误码：-17");
						} else if (res.data == "未知异常异常:RMIP_ERR_NO_POSA_INTERFACE 值:-11") {
							notify.warn("该摄像机没有查询到录像！错误码：-11");
						} else {
							// notify.warn(res.data + "! 错误码: " + res.code);
							notify.warn("pvg异常,录像暂时无法播放！");
						}
					}
				}
			});
		},

		/**
		 * @name getThumbnailInfo
		 * @description 获取第一帧图片信息  返回base64位字符串（已处理换行）
		 */
		getThumbnailInfo: function() {
			return this.firstFrameBase64.replace(/[\n\r]/ig, '');
		},

		/**
		 * @name setAllTime
		 * @description 设置视频播放的各个时间
		 */
		setAllTime:function(){
			var self = this;
			jQuery(".video-block .alltime").text(self.time2Str(self.duration));
			jQuery(".video-block .alltime").attr("alltime-ms", self.duration);
		},
		/**
		 * @name handleTime
		 * @param  {Number} 需要返回的不同时间的参数 type:1(小时) 2(分钟) 3(秒)
		 * @description 处理时间，返回处理过后的时间 24 进制
		 * @return {String | Number} 返回处理过后的时间 24 进制
		 */
		handleTime: function(type, time) {
			var t;
			switch(type) {
				case 1:
					t = Math.floor(time / (1000 * 60 * 60));
					break;
				case 2:
					t = Math.floor(time / (1000 * 60));
					break;
				case 3:
					t = Math.floor(time / 1000);
					break;
				default:
					break;
			}
			if(t < 10){t = '0' + t;}
			return t;
		},

		/**
		 * @name time2Str
		 * @param  {Number} 毫秒数
		 * @description 秒处理为时分秒  "14859247"-->"04:07:39" （毫秒部分被省略）
		 * @return {string} 24小时制的时间字符串
		 */
		time2Str: function(time) {
			var h = Math.floor(time / (1000 * 60 * 60)),
				m = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60)),
				s = Math.floor(((time % (1000 * 60 * 60)) % (1000 * 60)) / 1000),
				result;
			h = h < 10 ? "0" + h : h;
			m = m < 10 ? "0" + m : m;
			s = s < 10 ? "0" + s : s;
			result = h + ":" + m + ":" + s;
			return result;
		},

		/**
		 * @name str2Time
		 * @param  {string} 时间字符串
		 * @description 毫时分秒处理为毫秒  "04:07:39" --> "14859000"
		 * @return {Number} 毫秒数
		 */
		str2Time: function(str) {
			var time_array = str.split(":");
			var hTime = parseInt(time_array[0]) * 60 * 60 * 1000;
			var mTime = parseInt(time_array[1]) * 60 * 1000;
			var sTime = parseInt(time_array[2]) * 1000;
			var result = hTime + mTime + sTime;
			return result;
		},

		/**
		 * @name dragPoint
		 * @description 拖动播放小圆点，拖动播放器上的小圆点(进度条)，然后在停止拖动处播放
		 */
		dragPoint: function() {
			var startX = 0,
				self = this,
				totalTime = parseInt(jQuery(".alltime").attr('alltime-ms')),
				oldWidth = 0;
				jQuery('.video-block .play-point').unbind();
				jQuery('.video-block .play-point').bind('mousedown',function(e){
					document.body.onselectstart = function() { //add by Leon.z 未处理当拖动小圆点时触发其他选择事件造成的bug
						return false;
					}
					startX = e.pageX;
					oldWidth = jQuery(".progress-bar .bullet").width();
					if(self.intervalFlag!==null){
						/*点击滚珠,暂停时间更新,清空interval的值*/
						window.clearInterval(self.intervalFlag);
						self.intervalFlag = null;
					}

					jQuery(document).bind('mousemove', dragEvent);
					jQuery(document).bind('mouseup', unbindDragEvent);
				});

			var dragEvent = function(e) {

				var changeWidth = e.pageX - startX;
				var tem = oldWidth + changeWidth;
				var newWidth = tem > self.totalWidth ? self.totalWidth : tem;
					newWidth = newWidth < 0 ? 0 : newWidth;
				var newTime = totalTime * (newWidth / self.totalWidth);

				jQuery(".nowtime").text(self.time2Str(newTime));
				jQuery(".nowtime").attr('nowtime-ms', newTime);
				jQuery(".progress-bar .bullet").width(newWidth);
			};

			var unbindDragEvent = function() {

				jQuery(document).unbind('mousemove', dragEvent);
				jQuery(document).unbind('mouseup', unbindDragEvent);

				var t = parseInt(jQuery(".nowtime").attr('nowtime-ms'));
				var c = self.player.playByTime(t, 0);

				if(self.intervalFlag === null){
					self.intervalFlag = window.setInterval(self.updateTimeDisplay.bind(self), 500);
				}
			};
		},
		 /**
		 * @name updateTimeDisplay
		 * @description 更新播放时间等。
		 */
		updateTimeDisplay:function(){
			var self = this;
			if (self.enableUpdateTime) {
				var allTime =self.duration,
					nowTime = self.player.getPlayTime(0);
				if (nowTime >= allTime) {
					/*ocx获取的当前时间有误差,当获取的当前时间大约总时长的时候就停止*/
					jQuery(".video-block .switch").attr("title", "播放").removeClass('active');
					nowTime = allTime;
					self.player.playByTime(0, 0); /*设置播放时间为从0ms开始*/
					self.rePlay = true; /*在播放结束后 点击播放再次播放的时候用*/
					clearInterval(self.intervalFlag);
					self.intervalFlag = null;
					self.videoSwitch(jQuery(".video-block .switch"), self);
				}

				if (nowTime !== -1) { // 切换分页时会导致视频还未播放,此时返回值为-1,下方的播放条的时间有一下不正确
					jQuery(".video-block .nowtime").attr('nowTime-ms', nowTime);
					jQuery(".video-block .nowtime").text(self.time2Str(nowTime));
					jQuery(".progress-bar .bullet").width(self.totalWidth * (nowTime / allTime))
				}
			}
		},
		/**
		 * @name getCoords
		 * @param {object} DOM 对象
		 * @description 获得页面中某个元素的左，上，右和下分别相对浏览器视窗(视口)的位置。
		 */
		getCoords : function(el){
			var self = this,
				box = el.getBoundingClientRect(),
				doc = el.ownerDocument,
				body = doc.body,
				html = doc.documentElement,
				clientTop = html.clientTop || body.clientTop || 0,
				clientLeft = html.clientLeft || body.clientLeft || 0,
				top  = box.top  + (self.pageYOffset || html.scrollTop  ||  body.scrollTop ) - clientTop,
				left = box.left + (self.pageXOffset || html.scrollLeft ||  body.scrollLeft) - clientLeft;
			return { 'top': top, 'left': left };
		},

		/**
		 * @name getXPosition
		 * @param {object} 事件对象
		 * @description 获得鼠标指针和 e 元素的 x 方向的距离。
		 * @see getCoords
		 */
		getXPosition:function(e){
			return e.pageX - this.getCoords(e.target).left;
		},

		/**
		 * @name changePositionToTime
		 * @param {object} 事件对象
		 * @description 将距离转化为时间，并播放，用来拖动按钮之后，从某时刻开始播放
		 */
		changePositionToTime : function(e){
			var position   = this.getXPosition(e),
				totalWidth = this.totalWidth,
				time       = this.duration * (position/totalWidth),
				nowtime    = jQuery(".video-block .nowtime");

			this.player.playByTime(time,0);
			nowtime.attr('nowTime-ms', time);
			nowtime.text(this.time2Str(time));
		},

		/**
		 * @name getPlaySpeed
		 * @description 获取播放速度
		 */
		getPlaySpeed:function(){
			var self = this;
			var speed = self.player.getPlaySpeed(0);
			var speedDom = jQuery(".video-block .speed");
			if (speed==="1") {
				speedDom.hide();
			}else{
				speedDom.show();
				speedDom.find("em").text(speed+"x");
			}
		},

		/**
		 * @name stopPfs
		 * @description 停止播放(不是真正的停止,仅仅只是用暂停来模拟停止)
		 */
		stopPfs:function(argument) {
			var self = this;
			//debugger
			//(bool, index, disable)
			self.playerTimer=null;
			clearInterval(self.playerTimer)
			self.player.stop(false,0,true);
			self.player.refreshWindow(0);
			if (self.intervalFlag!==null) {
				clearInterval(self.intervalFlag);
				self.intervalFlag = null;
			}
			jQuery(".time .nowtime").text("00:00:00");//修改UI显示
			jQuery(".video-block .switch").removeClass("active").addClass('over');//修改switch按钮样式
			jQuery(".video-block .switch").attr("title", "播放");
			jQuery(".progress-bar .bullet").width(0);
			jQuery(".video-block .speed").hide();
			self.playStatus = true;
		},
		stop:function(){
			//pause
			var self = this;
			self.playerTimer=null;
			clearInterval(self.playerTimer)
			self.player.pause(0);
			self.player.refreshWindow(0);
			if (self.intervalFlag!==null) {
				clearInterval(self.intervalFlag);
				self.intervalFlag = null;
			}
			jQuery(".time .nowtime").text("00:00:00");//修改UI显示
			jQuery(".video-block .switch").removeClass("active").addClass('over');//修改switch按钮样式
			jQuery(".video-block .switch").attr("title", "播放");
			jQuery(".progress-bar .bullet").width(0);
			jQuery(".video-block .speed").hide();
			self.playStatus = true;
		},
		pauseVideo: function(){
			var self = this;
			clearInterval(self.intervalFlag);
			self.intervalFlag = null;
			jQuery(".video-block .switch").attr("title", "播放");
			self.player.pause(0);
		},
		videoSwitch:function(t,_self){

			var self = _self;
			self.enableUpdateTime = true;
			/* 暂停，如果当前元素含有 active 类的话，则暂定，并清除定时器(更新时间)*/
			if(jQuery(t).hasClass("active")) {
				self.pauseVideo();
			} else {
				if(self.rePlay){
				 	jQuery(".time .nowtime").text("00:00:00");
					jQuery(".progress-bar .bullet").width(0);
					self.rePlay = false;
				 } else {
					if (!self.playStatus) {
						//停止回放时
						self.player.playByTime(0, 0);
					}
					self.player.togglePlay(0);
				 }
				/*播放，如果当前元素未含有 active 类的话，则播放，并设定定时器(更新时间)*/
				if(self.intervalFlag === null){
					self.intervalFlag = window.setInterval(self.updateTimeDisplay.bind(self), 500);
				}
				/*暂停后的播放*/
				jQuery(".video-block .switch").attr("title", "暂停");
			}
			//修改样式
			jQuery(t).toggleClass('active');
			self.playStatus = true;
		},

		/**
		 * @name bindEvents
		 * @description 绑定事件
		 */
		bindEvents: function() {
			var self = this;
			/**
			 * 如果正在播放，则点击进度条改变播放的进度，并取消事件传播
			 */
			jQuery('.video-block .progress-bar').unbind('click');
			jQuery('.video-block .progress-bar').bind('click',function(e){
				e.preventDefault();
				e.stopImmediatePropagation();

				if(e.target.className === 'play-point'){
					return ;
				}

				self.changePositionToTime(e);
				e.stopPropagation();
			});

			/**
			 * 全屏
			 */
			jQuery('.video-block .fullwin').unbind('click');
			jQuery('.video-block .fullwin').bind('click',function(e){
				e.preventDefault();
				e.stopImmediatePropagation();
				self.player.displayFullScreen();
			});

			/**
			 * 慢放
			 * @see setPlaySpeed
			 */
			jQuery('.video-block .rewind').unbind('click');
			jQuery('.video-block .rewind').bind('click',function(e){
				e.preventDefault();
				e.stopImmediatePropagation();
				self.enableUpdateTime = true;

				var switchBtn = jQuery(".video-block .switch");
				if (!switchBtn.hasClass("active")) {
					switchBtn.trigger("click");
				}
				/*self.player.setPlaySpeed(-1, 0);
				self.getPlaySpeed();
				self.playStatus = true;*/

				setTimeout(function() {
					var speed = self.player.getPlaySpeed(0);
					if (speed === "1/8") {
						notify.warn("已达到最小倍速播放。");
						return;
					}
					self.player.setPlaySpeed(-1, 0);
					self.getPlaySpeed();
					self.playStatus = true;
				}, 1000);
			});

			/**
			 * 快放
			 * @see setPlaySpeed
			 */
			jQuery('.video-block .forward').unbind('click');
			jQuery('.video-block .forward').bind('click',function(e){
				e.preventDefault();
				e.stopImmediatePropagation();
				self.enableUpdateTime = true;

				var switchBtn = jQuery(".video-block .switch");
				if (!switchBtn.hasClass("active")) {
					switchBtn.trigger("click");
				}
				/*self.player.setPlaySpeed(1, 0);
				self.getPlaySpeed();
				self.playStatus = true;*/

				setTimeout(function() {
					var speed = self.player.getPlaySpeed(0);
					if (parseInt(speed) === 8) {
						notify.warn("已达到最大倍速播放。");
						return;
					}
					self.player.setPlaySpeed(1, 0);
					self.getPlaySpeed();
					self.playStatus = true;
				}, 1000);
			});
			/**
			 * 停止播放
			 * @see stopPfs
			 */
			jQuery('.video-block .stop').unbind('click');
			jQuery('.video-block .stop').bind('click',function(e){
				e.preventDefault();
				e.stopImmediatePropagation();
				//self.stop();
				self.pauseVideo();
				jQuery(".time .nowtime").text("00:00:00");
				jQuery(".progress-bar .bullet").width(0);
				jQuery(".video-block .switch").removeClass("active");
				self.playStatus = false;
			});
			/**
			 * 暂停/播放，并更新播放时间
			 */
			jQuery('.video-block .switch').unbind('click');
			jQuery('.video-block .switch').bind('click',function(e){
				e.preventDefault();
				e.stopImmediatePropagation();
				self.videoSwitch(this,self)
			});
			/*拖动播放小圆点*/
			self.dragPoint();
		}

	};
	return player;
 });


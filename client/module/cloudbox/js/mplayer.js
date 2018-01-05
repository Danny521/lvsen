/**
 * @description 云空间播放器的使用封装
 **/
define(['basePlayer', 'js/cloud-view.js', 'base.self'], function(NativePlayer, VIEW) {

	var player = {
		//Extends: NativePlayer,
		Implements: [Options, Events],

		/**
		 * 保存VideoPlayer类的实例对象
		 */
		player: null,

		/**
		 * 视频播放是否正常
		 */
		playStatus: false,

		/**
		 * 视频第一帧的 base64 流
		 */
		firstFrameBase64: '',

		intervalFlag: null, // 计时器
		/**
		 * 验证人工标注时间填写是否通过.true为通过,false不通过.
		 */
		validateFlag: false,

		totalWidth: 800,

		enableUpdateTime: true,

		options: {},

		playParm: null,
		/**
		 * @name initPlayer
		 * @param  {object} 播放视频的地址对象
		 * @description 初始化播放器
		 * @use initPlayer({filename:"NPFS:XXXX"})
		 */
		initPlayer: function(playParm) {
			var self = this;
			if (window.checkPlayer && window.checkPlayer()) {
				return;
			}
			self.player = new NativePlayer({
				"layout": 1,
				"uiocx": "#UIOCX"
			});
			self.playParm = playParm;
			// 如果有播放时间段,获取时间范围
			var isPlayR = window.SCOPE && SCOPE.dContext && SCOPE.dContext.timeBegin && SCOPE.dContext.timeEnd;
			self.timeBegin = isPlayR ? (SCOPE.dContext.timeBegin - 0) : null;
			self.timeEnd = isPlayR ? (SCOPE.dContext.timeEnd - 0) : null;
			self.playRange = isPlayR ? true : false;
			// 标识是否按指定时间播放
			var callback = function() {
				self.duration = self.player.getVideoInfo(0).duration;
				self.totalWidth = jQuery(self.player.ocx).width();
				self.setAllTime();
				jQuery(".video-block .switch").removeClass('active').attr("title", "播放"); //样式为暂停
				/*截取第一帧图像*/
				self.firstFrameBase64 = self.player.playerSnap(0);
				self.player.pause(0);

				//if (!self.playRange) {
				//使得播放状条及时间都归0
				self.enableUpdateTime = false;
				jQuery(".nowtime").text('00:00:00').attr('nowtime-ms', '00:00:00');
				jQuery(".progress-bar .bullet").width(0);
				//}
				jQuery('.entity-preview .entity-box .mark-buttons').show(); //显示标记按钮
				self.bindEvents();
				//第一帧结束后编辑播放成功
				self.playStatus = true;
			};

			var callback_1 = function() {
				self.duration = self.player.getVideoInfo(0).duration;
				self.totalWidth = parseInt(self.player.ocx.style.width);
				self.setAllTime();
				jQuery(".video-block .switch").removeClass('active').attr("title", "播放"); //样式为暂停
				/*截取第一帧图像*/
				self.updateTimeDisplay();
				self.player.pause(0);
				self.firstFrameBase64 = self.player.playerSnap(0);

				self.bindEvents();
			};

			if (self.playRange) {
				self.player.playPfs2(playParm, 0, function() {
					self.player.playFormStartToEnd(self.timeBegin, self.timeEnd, true, 0);
					callback_1();
					//第一帧结束后编辑播放成功
					self.playStatus = true;
				})
			} else {
				self.player.playPfs2(playParm, 0, callback);
			}

			// 播放
			// if (self.player.playPfs2(playParm, 0, callback)) {
			// 	// 视频播放成功后 指定时间范围内的播放
			// 	if (self.playRange) {
			// 		self.player.playFormStartToEnd(self.timeBegin, self.timeEnd, true, 0);
			// 		self.updateTimeDisplay();
			// 		console.log('1:',self.time2Str(self.player.getPlayTime(0)));
			// 		setTimeout(function(){
			// 			console.log('2:',self.time2Str(self.player.getPlayTime(0)));
			// 		},1000);
			// 	}
			// }
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
		setAllTime: function() {
			var self = this;
			jQuery(".video-block .alltime").text(self.time2Str(self.duration));
			jQuery(".video-block .alltime").attr("alltime-ms", self.duration);
		},
		//获取原始视频总时间
		getAllTime: function() {
			var self = this;
			return self.duration;
		},
		/**
		 * @name handleTime
		 * @param  {Number} 需要返回的不同时间的参数 type:1(小时) 2(分钟) 3(秒)
		 * @description 处理时间，返回处理过后的时间 24 进制
		 * @return {String | Number} 返回处理过后的时间 24 进制
		 */
		handleTime: function(type, time) {
			var t;
			switch (type) {
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
			if (t < 10) {
				t = '0' + t;
			}
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
			jQuery('.video-block .play-point').bind('mousedown', function(e) {
				document.body.onselectstart = function() { //add by Leon.z 未处理当拖动小圆点时触发其他选择事件造成的bug
					return false;
				}
				startX = e.pageX;
				oldWidth = jQuery(".progress-bar .bullet").width();

				if (self.intervalFlag !== null) {
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

				if (self.intervalFlag === null) {
					self.intervalFlag = window.setInterval(self.updateTimeDisplay.bind(self), 500);
				}
			};
		},
		/**
		 * @name updateTimeDisplay
		 * @description 更新播放时间等。
		 */
		updateTimeDisplay: function() {
			var self = this;
			if (self.enableUpdateTime) {
				var allTime = self.player.getVideoInfo(0).duration,
					nowTime = self.player.getPlayTime(0);
				jQuery(".video-block .nowtime").attr('nowTime-ms', nowTime);
				jQuery(".video-block .nowtime").text(self.time2Str(nowTime));
				jQuery(".progress-bar .bullet").width(self.totalWidth * (nowTime / allTime));
			}
		},

		/**
		 * @name dragMark
		 * @description 拖动标记，拖动播放器上的红色标记(标记区间)
		 */
		dragMark: function() {
			var startX = 0,
				self = this,
				oldLeft = 0,
				totalLeft = self.totalWidth - 6,
				targetElm = null,
				totalTime = parseInt(jQuery(".alltime").attr('alltime-ms'));

			jQuery(document).on('mousedown', '.start-mark,.end-mark', function(event) {
				targetElm = event.srcElement ? event.srcElement : event.target;
				startX = event.pageX;
				oldLeft = parseInt(jQuery(this).css('left'));
				jQuery(document).bind('mousemove', dragEvent);
				jQuery(document).bind('mouseup', unbindDragEvent);
			});

			var dragEvent = function(e) {
				var changeLeft = e.pageX - startX;
				var tem = oldLeft + changeLeft;
				var tem2 = tem > totalLeft ? totalLeft : tem;
				var newLeft = tem2 > 0 ? tem2 : 0;
				jQuery(targetElm).css('left', newLeft);

				//开始标记
				if (jQuery(targetElm).is('.start-mark')) {
					var sMarkTime = totalTime * (newLeft / totalLeft);
					jQuery("#markStartTime").val(self.time2Str(sMarkTime));
					jQuery("#markStartTime").trigger('blur');

					//结束标记
				} else {
					var eMarkTime = totalTime * (newLeft / totalLeft);
					jQuery("#markEndTime").val(self.time2Str(eMarkTime));
					jQuery("#markStartTime").trigger('blur');
				}
			};
			var unbindDragEvent = function() {
				jQuery(document).unbind('mousemove', dragEvent);
			};
		},
		//标记input开始时间、标记结束时间 change事件
		/**
		 * @name markInputChange
		 * @description 标记输入框 input 的开始时间、标记的结束时间 以及 change 事件
		 */
		markInputChange: function() {
			var self = this;
			jQuery(document).on('change', '#markStartTime,#markEndTime', function(event) {
				var totalLeft = self.totalWidth - 6;
				var totalTime_ms = parseInt(jQuery(".alltime").attr('alltime-ms'));
				var t = jQuery(this).val();
				var t_ms = self.str2Time(t);
				var targetElm = event.srcElement ? event.srcElement : event.target;

				//开始标记
				if (jQuery(targetElm).is('#markStartTime')) {
					jQuery('.start-mark').css('left', totalLeft * (t_ms / totalTime_ms));
					//结束标记
				} else {
					jQuery('.end-mark').css('left', totalLeft * (t_ms / totalTime_ms));
				}
			});
		},

		/**
		 * @name manualMarkBtn
		 * @description 人工标注按钮-点击
		 */
		manualMarkBtn: function() {
			var self = this;
			jQuery(document).on('click', '#manualMark', function(event) {
				var base64Str = self.firstFrameBase64 = self.player.playerSnap(0);
				if (base64Str !== "ERROR") {
					jQuery(".picture-box .marked-picture").attr('src', 'data:image/jpg;base64,' + base64Str);
				} else {
					notify.warn('获取标记图片失败');
				}
			});
		},

		/**
		 * @name markStartTimeBtn
		 * @description 人工标注-开始时间按钮
		 */
		markStartTimeBtn: function() {
			var self = this;
			jQuery(document).on('click', '.mark-start,.mark-end', function(event) {
				var markTime = jQuery(".video-block .nowtime").text(),
					msTime = jQuery(".video-block .nowtime").attr('nowTime-ms'),
					totalTime = parseInt(jQuery('.alltime').attr("alltime-ms")),
					markLeft = self.totalWidth * (msTime / totalTime);
				if (jQuery(this).is(".mark-start")) {
					jQuery(".progress-bar .start-mark").show();
					jQuery(".progress-bar .start-mark").css("left", markLeft);
					jQuery("#markStartTime").val(markTime);
					jQuery("#markStartTime").attr('startTime', msTime);
					jQuery('#markEndTime').trigger('change');
				} else {
					jQuery(".progress-bar .end-mark").show();
					jQuery(".progress-bar .end-mark").css("left", markLeft);
					jQuery("#markEndTime").val(markTime);
					jQuery("#markEndTime").attr('endTime', msTime);
					jQuery('#markEndTime').trigger('change');
				}
			});
		},
		//人工标注-结束时间
		markEndTimeBtn: function() {

		},

		/**
		 * @name toggleMarkType
		 * @description 智能标注与人工标注切换
		 */
		toggleMarkType: function() {
			jQuery(document).on('click', '#intelligenceMark, #manualMark', function() {
				var type = '';
				var another = '';
				if (jQuery(this).is('#intelligenceMark')) {
					type = 'intelligence';
					another = 'manual';
				} else {
					type = 'manual';
					another = 'intelligence';
				}
				jQuery(this).addClass('disabled');
				jQuery('[class^=' + type + ']').show();
				jQuery('[class^=' + another + ']').hide();
				jQuery('[id^=' + another + ']').removeClass('disabled');
			});
		},

		/**
		 * @name intellMarkBtn
		 * @description 智能标注按钮-绑定点击事件
		 */
		intellMarkBtn: function() {
			jQuery(document).on('click', '#intelligenceMark', function() {
				jQuery('#content > .tips').show();
				jQuery('#header .remain-tasks').val(jQuery('#header .remain-tasks').val() + 1);
			});
		},

		/**
		 * @name startIntellMark
		 * @description 开始智能标注
		 */
		startIntellMark: function() {
			jQuery(document).on('click', '.intelligence-field .start', function() {
				jQuery('#content > .tips').show();
				var arr = [];
				var list = jQuery(".items input[type=checkbox]:checked");
				for (var i = 0; i < list.length; i++) {
					arr.push(jQuery(list[i]).attr('data-type'));
				}
				var analyze_type = arr.join(','),
					id = jQuery('.entity-preview').attr('data-videoid');

				jQuery.ajax({
					url: '/service/pvd/commit_task',
					dataType: 'json',
					type: 'post',
					data: {
						id: id,
						analyze_type: analyze_type
					},
					success: function() {
						jQuery('.intelligence-field').hide();
						jQuery('#intelligenceMark').removeClass('disabled');
						var count = jQuery('#header .tasks-count').html().trim();
						jQuery('#header .tasks-count').html(parseInt(count) + 1);

						setTimeout(function() {
							jQuery('#content > .tips').hide();
						}, 5000);
					}
				});
			});
		},

		/**
		 * @name selectIntellMarkType
		 * @description 选择智能标注类型
		 */
		selectIntellMarkType: function() {
			jQuery(document).on('click', '.intelligence-field .items input[type=checkbox]', function() {
				var len = jQuery(".items input[type=checkbox]:checked").length;
				if (len === 0) {
					jQuery('.intelligence-field .start').attr('disabled', true).addClass('disable');
				} else {
					jQuery('.intelligence-field .start').attr('disabled', false).removeClass('disable');
				}
			});
		},

		/**
		 * @name cancelIntellMark
		 * @description 取消智能标注
		 */
		cancelIntellMark: function() {
			jQuery(document).on('click', '.call-off', function() {
				jQuery('.intelligence-field').hide();
				jQuery('#intelligenceMark').removeClass('disabled');
			});
		},

		/**
		 * @name cancelManualMark
		 * @description 取消人工标注
		 */
		cancelManualMark: function() {
			jQuery(document).on('click', '.manual-field .cancel', function() {
				jQuery('.manual-field').hide();
				jQuery('#manualMark').removeClass('disabled');
				jQuery('#markStartTime').val('');
				jQuery('#markEndTime').val('');
				jQuery(".track-type").val('0');
			});
		},

		/**
		 * @name selectMarkType
		 * @description 选择人工标记类型
		 */
		selectMarkType: function() {
			jQuery(document).on('change', ".track-type", function() {
				var reg = /[\d]{1,3}:[0-5]\d:[0-5]\d/,
					objs = jQuery('.marktime'),
					flag = true,
					dest = '';
				for (var i = 0; i < objs.length; i++) {
					if (!reg.test(jQuery(objs[i]).val()) || jQuery(objs[i]).val() === '') {
						flag = false;
					}
				}
				if (flag) {
					if (jQuery(this).val().trim().toInt() === 0) {
						jQuery('.write-info').attr('disabled', true).removeClass('active').addClass('disable');
					} else {
						jQuery('.write-info').attr('disabled', false).removeClass('disable').addClass('active');
					}
				} else {
					jQuery('.mark-correct').addClass('error').html('请正确填写:目标出现/消失时间');
				}

				switch (jQuery(".track-type").val()) {
					case 'person':
						dest = "/assets/works/medialib/create_person.html?id=";
						break;
					case 'car':
						dest = "/assets/works/medialib/create_car.html?id=";
						break;
					case 'exhibit':
						dest = "/assets/works/medialib/create_exhibit.html?id=";
						break;
					case 'scene':
						dest = "/assets/works/medialib/create_scene.html?id=";
						break;
					default:
				}
				jQuery(".write-info").attr("href", dest);
			});
		},

		/**
		 * @name markTimeVerify
		 * @description 开始标记和结束标记时间 change 时， 进行的一些错误信息的提示
		 */
		markTimeVerify: function() {
			var self = this;
			jQuery(document).on('change', "#markStartTime , #markEndTime", function() {
				var markTime = jQuery(this).val(),
					markStartTime = jQuery('#markStartTime').val(),
					markEndTime = jQuery('#markEndTime').val();

				if (markTime === '') {
					jQuery('.mark-correct').addClass('error').html('目标时间不能为空!');
					self.validateFlag = false;
				} else if (!/^(\d{1,2}):(\d{1,2}):(\d{1,2})$/.test(markTime)) {
					jQuery('.mark-correct').addClass('error').html('目标时间格式有误!');
					self.validateFlag = false;
				} else {
					self.validateFlag = true;
					if (jQuery(".track-type").val() !== 0) {
						jQuery(".write-info").show();
					}
					jQuery('.mark-correct').removeClass('error');
				}

				if (self.validateFlag) {
					if (markStartTime >= markEndTime) {
						self.validateFlag = false;
						jQuery('.mark-correct').addClass('error').html('开始时间不能大于等于结束时间!');
					} else {
						jQuery('.mark-correct').removeClass('error');
					}
				}
			});
		},

		/**
		 * @name markTimeBlur
		 * @description 开始标记和结束标记时间Blur时，手动触发 change 事件，触发其他逻辑，例如信息提示
		 */
		markTimeBlur: function() {
			jQuery("#markStartTime , #markEndTime").on('blur', function() {
				jQuery(this).trigger('change');
			});
		},

		/**
		 * @name writeInfo
		 * @description 填写信息 绑定点击事件，当点击之后向后端发送保存结构化信息的请求
		 */
		writeInfo: function() {
			var self = this;
			jQuery(document).on("click", "#videoMark .write-info", function(e) {
				var trackType = jQuery(".track-type").val().trim(),
					markStime_ms = jQuery("#markStartTime").attr('startTime'),
					markEtime_ms = jQuery("#markEndTime").attr('endTime'),
					picSrc = jQuery(".marked-picture").attr('src');

				jQuery("#markStartTime, #markEndTime").trigger('change');

				var id = jQuery('.entity-preview').attr('data-videoid');
				var infoid = jQuery('.entity-preview').attr('data-id'); //创建结构化信息页面的视图id，不是videoid
				var dest = jQuery('.write-info').attr('href');

				e.preventDefault();

				if (self.validateFlag) {
					jQuery.ajax({
						url: '/service/pvd/save_structured_video_info',
						dataType: 'json',
						type: 'post',
						data: {
							videoId: id,
							videoBaseCode: picSrc,
							videoPath: MediaLoader.videoPath
						},
						success: function(res) {
							if (res && res.code === 200) {
								var name = jQuery("h3.title").text();
								window.open("/module/iframe/?windowOpen=1&iframeUrl=" + dest + id + '&type=video' + "&trackType=" + trackType + "&markstime_ms=" + markStime_ms + "&markEtime_ms=" + markEtime_ms + "&mediaid=" + res.data.id + "&name=" + name + "&infoid=" + infoid);
							}
						}
					});
				}
			});
		},

		/**
		 * @name setMarkPosition
		 * @description 将标记的时间设置到界面上
		 */
		setMarkPosition: function() {
			var oBeginTime = $(".progress-bar .start-mark"),
				beginTime = oBeginTime.attr("data-beginTime"),
				oEndTime = $(".progress-bar .end-mark"),
				endTime = oEndTime.attr("data-endTime"),
				allTime = this.duration,
				totalWidth = this.totalWidth;

			if (beginTime && endTime) {
				oBeginTime.css({
					left: totalWidth * (beginTime / allTime)
				});
				oEndTime.css({
					left: totalWidth * (endTime / allTime)
				});
			}
		},

		/**
		 * @name getCoords
		 * @param {object} DOM 对象
		 * @description 获得页面中某个元素的左，上，右和下分别相对浏览器视窗(视口)的位置。
		 */
		getCoords: function(el) {
			var self = this,
				box = el.getBoundingClientRect(),
				doc = el.ownerDocument,
				body = doc.body,
				html = doc.documentElement,
				clientTop = html.clientTop || body.clientTop || 0,
				clientLeft = html.clientLeft || body.clientLeft || 0,
				top = box.top + (self.pageYOffset || html.scrollTop || body.scrollTop) - clientTop,
				left = box.left + (self.pageXOffset || html.scrollLeft || body.scrollLeft) - clientLeft;
			return {
				'top': top,
				'left': left
			};
		},

		/**
		 * @name getXPosition
		 * @param {object} 事件对象
		 * @description 获得鼠标指针和 e 元素的 x 方向的距离。
		 * @see getCoords
		 */
		getXPosition: function(e) {
			return e.pageX - this.getCoords(e.target).left;
		},

		/**
		 * @name changePositionToTime
		 * @param {object} 事件对象
		 * @description 将距离转化为时间，并播放，用来拖动按钮之后，从某时刻开始播放
		 */
		changePositionToTime: function(e) {
			var position = this.getXPosition(e),
				totalWidth = this.totalWidth,
				time = this.duration * (position / totalWidth),
				nowtime = jQuery(".video-block .nowtime");

			this.player.playByTime(time, 0);
			nowtime.attr('nowTime-ms', time);
			nowtime.text(this.time2Str(time));
		},

		/**
		 * @name getPlaySpeed
		 * @description 获取播放速度
		 */
		getPlaySpeed: function() {
			var self = this;
			var speed = self.player.getPlaySpeed(0);
			if (speed === "1/16") {
				notify.warn("已达到最小倍速播放。");
				return;
			}
			if (parseInt(speed) === 16) {
				notify.warn("已达到最大倍速播放。");
				return;
			}
			var speedDom = jQuery(".video-block .speed");
			if (speed === "1") {
				speedDom.hide();
			} else {
				speedDom.show();
				speedDom.find("em").text(speed + "x");
			}
		},

		/**
		 * @name stopPfs
		 * @description 停止播放(不是真正的停止,仅仅只是用暂停来模拟停止)
		 */
		stopPfs: function(argument) {
			var self = this;
			self.player.stop(0);
			self.player.refreshWindow(0);
			if (self.intervalFlag !== null) {
				clearInterval(self.intervalFlag);
				self.intervalFlag = null;
			}
			jQuery(".time .nowtime").text("00:00:00"); //修改UI显示
			jQuery(".video-block .switch").removeClass("active").addClass('over'); //修改switch按钮样式
			jQuery(".video-block .switch").attr("title", "播放");
			jQuery(".progress-bar .bullet").width(0);
			jQuery(".video-block .speed").hide();
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
			jQuery('.video-block .progress-bar').bind('click', function(e) {
				e.preventDefault();
				e.stopImmediatePropagation();

				if (e.target.className === 'play-point') {
					return;
				}

				self.changePositionToTime(e);
				e.stopPropagation();
			});

			/**
			 * 抓图 云空间中使用
			 * 原始视频抓图
			 */
			jQuery('.video-block .video-grab').unbind('click');
			jQuery('.video-block .video-grab').bind('click', function(e) {
				e.preventDefault();
				e.stopImmediatePropagation();
				if (!self.playStatus) {
					notify.warn("当前视频未进行播放！");
					return;
				}

				//CM.showLayer($(this));

				VIEW.showLayer($(this));
				//暂停播放
			});

			/**
			 * 全屏
			 */
			jQuery('.video-block .fullwin').unbind('click');
			jQuery('.video-block .fullwin').bind('click', function(e) {
				e.preventDefault();
				e.stopImmediatePropagation();
				self.player.displayFullScreen();
			});

			/**
			 * 慢放
			 * @see setPlaySpeed
			 */
			jQuery('.video-block .rewind').unbind('click');
			jQuery('.video-block .rewind').bind('click', function(e) {
				e.preventDefault();
				e.stopImmediatePropagation();
				self.enableUpdateTime = true;

				var switchBtn = jQuery(".video-block .switch");
				if (!switchBtn.hasClass("active")) {
					switchBtn.trigger("click", {
						"type": "slow"
					});
				}
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
			jQuery('.video-block .forward').bind('click', function(e) {
				e.preventDefault();
				e.stopImmediatePropagation();
				self.enableUpdateTime = true;

				var switchBtn = jQuery(".video-block .switch");
				if (!switchBtn.hasClass("active")) {
					switchBtn.trigger("click", {
						"type": "fast"
					});
				}
				//点击停止后点击慢放/快放，第一次会获取不到速率报error,临时采用延时 by zhangxinyu on 2015-10-23
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
			jQuery('.video-block .stop').bind('click', function(e) {
				e.preventDefault();
				e.stopImmediatePropagation();
				self.stopPfs();
				self.playStatus = false;
			});
			/**
			 * 暂停/播放，并更新播放时间
			 */
			jQuery('.video-block .switch').unbind('click');
			jQuery('.video-block .switch').bind('click', function(e) {
				e.preventDefault();
				e.stopImmediatePropagation();
				self.enableUpdateTime = true;
				/* 暂停，如果当前元素含有 active 类的话，则暂定，并清除定时器(更新时间)*/
				if (jQuery(this).is(".active")) {
					clearInterval(self.intervalFlag);
					self.intervalFlag = null;
					jQuery(".video-block .switch").attr("title", "播放");
					if (self.player.pause(0) !== true) {
						return;
					}
				} else {
					/*播放，如果当前元素未含有 active 类的话，则播放，并设定定时器(更新时间)*/
					if (self.intervalFlag === null) {
						self.intervalFlag = window.setInterval(self.updateTimeDisplay.bind(self), 500);
					}
					/*关闭后的播放*/
					if (jQuery(this).hasClass("over")) {
						if (self.player.playPfs(self.playParm, 0)) {
							// 视频播放成功后 指定时间范围内的播放
							if (self.playRange) {
								self.player.playFormStartToEnd(self.timeBegin, self.timeEnd, true, 0);
								self.updateTimeDisplay();
							}
						}
						jQuery(this).removeClass("over");
						jQuery(".video-block .switch").attr("title", "暂停");
					} else {
						/*暂停后的播放*/
						jQuery(".video-block .switch").attr("title", "暂停");
						self.player.togglePlay(0);
					}
				}
				//修改样式
				jQuery(this).toggleClass('active');
				self.playStatus = true;
			});
			/*拖动播放小圆点*/
			self.dragPoint();
		}
	};
	return player;
});

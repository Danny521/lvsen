/**
 * Created by Mayue on 14-3-24.
 */
var Mplayer = new new Class({
	Implements: [Options, Events],
	player: null,
	//保存VideoPlayer类的实例对象
	playStatus: -1,
	//视频播放是否正常
	firstFrameBase64: '',
	intervalFlag:null,//计时器
//	resourceId:'',
	//存放视频播放时第一帧的截图信息

	validateFlag: false, //验证人工标注时间填写是否通过.true为通过,false不通过.
	totalWidth:800,

	options: {

	},

	initialize: function(options) {
		var self = this;
		this.setOptions(options);

		/*setTimeout(function(){
			 self.initPlayer();
			 self.bindEvents();
		},500);*/
		/*setTimeout(function() {
			self.bindEvents();
		}, 500)*/
	},

	//初始化播放器 （对外使用） playParm:{filename:"NPFS:XXXX"};
	initPlayer: function(playParm) {
		var self = this;
		self.player = new VideoPlayer({
			"layout": 1,
			"eventEnable": false
		});

		self.totalWidth = jQuery('#UIOCX').attr('width');
		setTimeout(function(){
			self.playStatus = self.player.playNPFS(playParm, 0);
			if(self.playStatus===0){
				jQuery('.entity-preview .entity-box .mark-buttons').show();
				setTimeout(function(){
					self.firstFrameBase64 = self.player.playerSnap(0);
				},1000);
				self.bindEvents();
			}
		},1000);

	},
	//获取第一帧图片信息  返回base64位字符串（已处理换行）
	getThumbnailInfo: function() {
		return this.firstFrameBase64.replace(/[\n\r]/ig, '');
	},
	//处理时间type:1(小时) 2(分钟) 3(秒)
	handleTime: function(type, time) {
		switch(type) {
		case 1:
			var h = Math.floor(time / (1000 * 60 * 60));
			return h = h < 10 ? "0" + h : h;
		case 2:
			var m = Math.floor(time / (1000 * 60));
			return m = m < 10 ? "0" + m : m;
		case 3:
			var s = Math.floor(time / 1000);
			return s = s < 10 ? "0" + s : s;
		default:
			break;
		}
	},
	//毫秒处理为时分秒  "14859247"-->"04:07:39" （毫秒部分被省略）
	time2Str: function(time) {
		var h = Math.floor(time / (1000 * 60 * 60)),
			m = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60)),
			s = Math.floor(((time % (1000 * 60 * 60)) % (1000 * 60)) / 1000)
			result = '';
		h = h < 10 ? "0" + h : h;
		m = m < 10 ? "0" + m : m;
		s = s < 10 ? "0" + s : s;
		result = h + ":" + m + ":" + s;
		return result;
	},

	//时分秒处理为毫秒  "04:07:39" --> "14859000"
	str2Time: function(str) {
		var time_array = str.split(":");
		var hTime = parseInt(time_array[0]) * 60 * 60 * 1000;
		var mTime = parseInt(time_array[1]) * 60 * 1000;
		var sTime = parseInt(time_array[2]) * 1000;
		var result = hTime + mTime + sTime;
		return result;
	},
	//拖动播放小圆点
	dragPoint: function() {
		var startX = 0,
			self = this,
			totalTime = parseInt(jQuery(".alltime").attr('alltime-ms')),
			/*totalTime = parseInt(14859247),*/
			oldWidth = 0;
		jQuery(document).on('mousedown', ".video-block .play-point", function(e) {
			document.body.onselectstart = function() { //add by Leon.z 未处理当拖动小圆点时触发其他选择事件造成的bug
				return false;
			}
			startX = e.pageX;
			oldWidth = jQuery(".progress-bar .bullet").width();
			if(self.intervalFlag!==null){
				window.clearInterval(self.intervalFlag);
				self.intervalFlag=null
			}
			jQuery(document).bind('mousemove', dragEvent);
			jQuery(document).bind('mouseup', unbindDragEvent);

		});
		var dragEvent = function(e) {
				var changeWidth = e.pageX - startX;
				var tem = oldWidth + changeWidth;
				var newWidth = tem > self.totalWidth ? self.totalWidth : tem;
				var newTime = totalTime * (newWidth / self.totalWidth);
				jQuery(".nowtime").text(self.time2Str(newTime));
				jQuery(".nowtime").attr('nowtime-ms', newTime);
				jQuery(".progress-bar .bullet").width(newWidth);
		};
		var unbindDragEvent = function() {
				jQuery(document).unbind('mousemove', dragEvent);
				var t = parseInt(jQuery(".nowtime").attr('nowtime-ms'));
				var c= self.player.playByTime(t, 0);
				if(self.intervalFlag===null){
					self.intervalFlag = window.setInterval(self.updateTimeDisplay.bind(self), 500);
				}
		};
	},
	//拖动标记
	dragMark: function() {
		var startX = 0,
			self = this,
			oldLeft = 0,
			totalLeft = self.totalWidth-6,
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
				if(jQuery(targetElm).is('.start-mark')) {
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
	markInputChange: function() {
		var self = this;
		jQuery(document).on('change', '#markStartTime,#markEndTime', function(event) {
			var totalLeft = self.totalWidth-6;
			var totalTime_ms = parseInt(jQuery(".alltime").attr('alltime-ms'));
			var t = jQuery(this).val();
			var t_ms = self.str2Time(t);
			var targetElm = event.srcElement ? event.srcElement : event.target;

			//开始标记
			if(jQuery(targetElm).is('#markStartTime')) {
				jQuery('.start-mark').css('left', totalLeft * (t_ms / totalTime_ms));
				//结束标记
			} else {
				jQuery('.end-mark').css('left', totalLeft * (t_ms / totalTime_ms));
			}
		});
	},
	//人工标注按钮-点击
	manualMarkBtn: function() {
		var self = this;
		jQuery(document).on('click', '#manualMark', function(event) {
			var base64Str = self.firstFrameBase64 = self.player.playerSnap(0);
			if(base64Str !== "ERROR") {
				jQuery(".picture-box .marked-picture").attr('src', 'data:image/jpg;base64,' + base64Str);
			} else {
				notify.warn('获取标记图片失败')
			}
		});
	},
	//人工标注-开始时间按钮
	markStartTimeBtn: function() {
		jQuery(document).on('click', '.mark-start,.mark-end', function(event) {
			var markTime = jQuery(".video-block .nowtime").text(),
				msTime = jQuery(".video-block .nowtime").attr('nowTime'),
				totalTime = parseInt(jQuery('.alltime').attr("alltime-ms")),
				markLeft = self.totalWidth*(msTime/totalTime);
			if(jQuery(this).is(".mark-start")){
				jQuery(".progress-bar .start-mark").show();
				jQuery(".progress-bar .start-mark").css("left",markLeft);
				jQuery("#markStartTime").val(markTime);
				jQuery("#markStartTime").attr('startTime', msTime);
				jQuery('#markEndTime').trigger('change');
			}else{
				jQuery(".progress-bar .end-mark").show();
				jQuery(".progress-bar .end-mark").css("left",markLeft);
				jQuery("#markEndTime").val(markTime);
				jQuery("#markEndTime").attr('endTime', msTime);
				jQuery('#markEndTime').trigger('change');
			}

			/*var eTime = jQuery("#markEndTime").val(),
				sTime = jQuery(".video-block .nowtime").text(),
				msTime = jQuery(".video-block .nowtime").attr('nowTime');
			if(sTime >= eTime) {
				notify.warn("目标开始时间不能大于或等于目标结束时间");
			} else {
				jQuery("#markStartTime").val(sTime);
				jQuery("#markStartTime").attr('startTime', msTime);
			}*/
		});
	},
	//人工标注-结束时间
	markEndTimeBtn: function() {
		/*jQuery(document).on('click', '.mark-end', function(event) {
			jQuery(".progress-bar .end-mark").show();
			var sTime = jQuery("#markStartTime").val(),
				eTime = jQuery(".video-block .nowtime").text(),
				msTime = jQuery(".video-block .nowtime").attr('nowTime');
			if(sTime === '') {
				notify.warn("请先选择目标开始时间");
			} else {
				if(sTime >= eTime) {
					notify.warn("目标开始时间不能大于或等于目标结束时间");
				} else {
					jQuery("#markEndTime").val(eTime);
					jQuery("#markEndTime").attr('endTime', msTime);
				}
			}
		});*/
	},
	//智能标注与人工标注切换
	toggleMarkType: function() {
		jQuery(document).on('click', '#intelligenceMark, #manualMark', function() {
			var type = '';
			var another = '';
			if(jQuery(this).is('#intelligenceMark')) {
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
	//智能标注按钮-点击事件
	intellMarkBtn: function() {
		jQuery(document).on('click', '#intelligenceMark', function() {
			jQuery('#content > .tips').show();
			jQuery('#header .remain-tasks').val(jQuery('#header .remain-tasks').val() + 1);
		});
	},
	//开始智能标注
	startIntellMark: function(){
		jQuery(document).on('click', '.intelligence-field .start' ,function () {
			jQuery('#content > .tips').show();
			var arr = [];
			var list = jQuery(".items input[type=checkbox]:checked");
			for(var i=0; i<list.length; i++){
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

					setTimeout(function(){
						jQuery('#content > .tips').hide();
					},5000);
				}
			});
		});
	},
	//选择智能标注类型
	selectIntellMarkType: function(){
		jQuery(document).on('click','.intelligence-field .items input[type=checkbox]',function() {
			var len = jQuery(".items input[type=checkbox]:checked").length;
			if(len === 0){
				jQuery('.intelligence-field .start').attr('disabled', true).addClass('disable')
			}else{
				jQuery('.intelligence-field .start').attr('disabled', false).removeClass('disable');
			}
		});
	},
	//取消智能标注
	cancelIntellMark: function () {
		jQuery(document).on('click', '.call-off', function() {
			jQuery('.intelligence-field').hide();
			jQuery('#intelligenceMark').removeClass('disabled');
		});
	},

	//取消人工标注
	cancelManualMark: function() {
		jQuery(document).on('click', '.manual-field .cancel', function() {
			jQuery('.manual-field').hide();
			jQuery('#manualMark').removeClass('disabled');
			jQuery('#markStartTime').val('');
			jQuery('#markEndTime').val('');
			jQuery(".track-type").val('0');
		});
	},
	//选择人工标记类型
	selectMarkType: function() {
		jQuery(document).on('change', ".track-type", function() {
			var reg = /[\d]{1,3}:[0-5]\d:[0-5]\d/,
				objs = jQuery('.marktime'),
				flag = true,
				dest = '';
			for(var i = 0; i < objs.length; i++) {
				if(!reg.test(jQuery(objs[i]).val()) || jQuery(objs[i]).val() === '') {
					flag = false;
				}
			}
			if(flag) {
				if(jQuery(this).val().trim().toInt() === 0) {
					jQuery('.write-info').attr('disabled', true).removeClass('active').addClass('disable');
				} else {
					jQuery('.write-info').attr('disabled', false).removeClass('disable').addClass('active');
				}
			} else {
				jQuery('.mark-correct').addClass('error').html('请正确填写:目标出现/消失时间');
				//jQuery('.mark-correct').addClass('error').html('请正确填写目标出现/消失时间');
			}

			// return create_car.html?id=15&trackType=car&markstime_ms=10764&markEtime_ms=14726&videoPath=NPFS:192.168.60.40:9000/username=admin&password=admin
			switch(jQuery(".track-type").val()) {
				case 'person':
					dest = "/medialib/create_person?id=";
					break;
				case 'car':
					dest = "/medialib/create_car?id=";
					break;
				case 'exhibit':
					dest = "/medialib/create_exhibit?id=";
					break;
				case 'scene':
					dest = "/medialib/create_scene?id=";
					break;
				default:
			}
			jQuery(".write-info").attr("href", dest);

		});
	},
	//开始标记和结束标记时间change时  错误信息的提示
	markTimeVerify: function() {
		var self = this;
		jQuery(document).on('change', "#markStartTime , #markEndTime", function() {
			var markTime = jQuery(this).val(),
				markStartTime = jQuery('#markStartTime').val(),
				markEndTime = jQuery('#markEndTime').val();

			if(markTime === '') {
				jQuery('.mark-correct').addClass('error').html('目标时间不能为空!');
				self.validateFlag = false;
			} else if(!/^(\d{1,2}):(\d{1,2}):(\d{1,2})$/.test(markTime)) {
				jQuery('.mark-correct').addClass('error').html('目标时间格式有误!');
				self.validateFlag = false;
			} else {
				self.validateFlag = true;
				if(jQuery(".track-type").val() !== 0) {
					jQuery(".write-info").show();
				}
				jQuery('.mark-correct').removeClass('error');
			}

			if(self.validateFlag) {
				if(markStartTime >= markEndTime) {
					self.validateFlag = false;
					jQuery('.mark-correct').addClass('error').html('开始时间不能大于等于结束时间!');
				} else {
					jQuery('.mark-correct').removeClass('error');
				}
			}
		});
	},
	//开始标记和结束标记时间Blur时
	markTimeBlur: function() {
		jQuery("#markStartTime , #markEndTime").on('blur', function() {
			jQuery(this).trigger('change');
		});
	},
	//填写信息 点击事件
	writeInfo: function() {
		var self = this;
		jQuery(document).on("click", "#videoMark .write-info", function(e) {
			var trackType = jQuery(".track-type").val().trim(),
				markStime_ms = jQuery("#markStartTime").attr('startTime'),
				markEtime_ms = jQuery("#markEndTime").attr('endTime'),
				picSrc = jQuery(".marked-picture").attr('src');

			jQuery("#markStartTime, #markEndTime").trigger('change');

			var id =  jQuery('.entity-preview').attr('data-videoid');
			var infoid=jQuery('.entity-preview').attr('data-id');//创建结构化信息页面的视图id，不是videoid
			var dest = jQuery('.write-info').attr('href');

			e.preventDefault();

			if(self.validateFlag){
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
						if(res && res.code === 200)	{
							var name=jQuery("h3.title").text();
							window.open("/module/iframe/?windowOpen=1&iframeUrl=" + dest + id +'&type=video' + "&trackType=" + trackType + "&markstime_ms=" + markStime_ms + "&markEtime_ms=" + markEtime_ms + "&mediaid=" + res.data.id+"&name="+name+"&infoid="+infoid);
						}
					}
				});
			}
		});
	},
	updateTimeDisplay:function(){
		var self = this,
			allTime = self.player.getVideoInfo(0).duration,
//			allTime = 155000,
			nowTime = self.player.getPlayTime(0);
//			nowTime = 4000;
//		console.log("OO",self.playStatus)
		jQuery(".video-block .nowtime").attr('nowTime', nowTime);
		jQuery(".video-block .nowtime").text(self.time2Str(nowTime));
		jQuery(".progress-bar .bullet").width(self.totalWidth * (nowTime / allTime));
	},
	bindEvents: function() {
		var self = this;
		jQuery(function() {
			//人工标注按钮-点击  临时测试
			//self.manualMarkBtn();
			//self.toggleMarkType();
			//self.cancelManualMark();
			//播放成功的情况下
			if(self.playStatus === 0) {

				//显示总时长
				var videoInfo = self.player.getVideoInfo(0);
				var allTime = videoInfo.duration;
				var totalWidth = 800;
				jQuery(".video-block .alltime").text(self.time2Str(allTime));
				jQuery(".video-block .alltime").attr("alltime-ms", allTime);

				//显示当前播放时间
				self.updateTimeDisplay();
				if(self.intervalFlag === null){
					self.intervalFlag = window.setInterval(self.updateTimeDisplay.bind(self), 500);

				}

				//抓图
				jQuery(document).on('click', ".video-block .grab", function() {
					self.player.printScreen(0);
				});
				//全屏
				jQuery(document).on('click', ".video-block .fullwin", function() {
					self.player.displayFullScreen();
				});

				//慢放
				jQuery(document).on('click', ".video-block .rewind", function() {
					var speed = self.player.getPlaySpeed(0);
                    if (speed === "1/8") {
                        notify.warn("已达到最小倍速播放。");
                        return;
                    }
					self.player.setPlaySpeed(-1, 0);
				});

				//快放
				jQuery(document).on('click', ".video-block .forward", function() {
					var speed = self.player.getPlaySpeed(0);
                    if (parseInt(speed) === 8) {
                        notify.warn("已达到最大倍速播放。");
                        return;
                    }
					self.player.setPlaySpeed(1, 0);
				});

				//暂停/播放
				jQuery(document).on('click', ".video-block .switch", function() {
					//暂停
					if(jQuery(this).is(".active")) {

						clearInterval(self.intervalFlag);
						self.intervalFlag = null;
						if(self.player.pauseNPFS(0) !== 0) return;
						//播放
					} else {
						if(self.player.togglePlay(0)) return;
					}
					//修改样式
					jQuery(this).toggleClass('active');
				}).trigger('click');
				//拖动播放小圆点
				self.dragPoint();
				//拖动标记
				self.dragMark();
				//标记input开始时间、标记结束时间 change事件
				self.markInputChange();
				//人工标注按钮-点击
				self.manualMarkBtn();
				//人工标注-开始时间按钮
				self.markStartTimeBtn();
				//人工标注-结束时间按钮
				self.markEndTimeBtn();
				//智能标注与人工标注切换
				self.toggleMarkType();
				//智能标注按钮-点击
				//self.intellMarkBtn();
				//取消人工标注
				self.cancelManualMark();
				self.selectMarkType();
				self.markTimeVerify();
				self.markTimeBlur();
				self.writeInfo();

				self.startIntellMark(); //开始智能标注
				self.selectIntellMarkType(); //选择智能标注类型
				self.cancelIntellMark();//取消智能标注
			}
		});
	}

});


/*
var a = {
	"filename":"NPFS:192.168.60.245:9000/username=admin&password=admin#/video/dc649c5c-9e1f-439e-89ff-cf0ddba042fd.mbf"
};*/


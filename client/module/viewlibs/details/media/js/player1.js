define(['basePlayer','base.self'], function(NativePlayer){
    var Mplayer = new new Class({
        Implements: [Options, Events],
        player: null,
        playStatus: -1,
        //视频播放是否正常
        firstFrameBase64: '',
        intervalFlag: null, //计时器
        validateFlag: false, //验证人工标注时间填写是否通过.true为通过,false不通过.
        totalWidth: 710, //播放器遮挡层宽度,该值后面会被新获取的值覆盖掉
        playParm: null, //播放器参数
        options: {},
        enableUpdateTime: true, // 是否更新时间 防止ocx全屏后 视频闪烁
        initialize: function(options) {
            var self = this;
            this.setOptions(options);
        },
        //初始化播放器 （对外使用） playParm:{filename:"NPFS:XXXX"};
        initPlayer: function(playParm) {
            var self = this;
            self.playParm = playParm;
            if (playParm === null || playParm === "") {
                notify.warn("播放路径格式不正确，播放路径为：" + JSON.stringify(playParm));
                return;
            };

            // var playParm = {filename:"NPFS:192.168.60.245:9000/username=admin&password=admin#/video/079a866d-41f9-4adb-baab-822228cfbba2.mbf"};
            self.player = new NativePlayer({
                "layout": 1,
                "uiocx": '#UIOCX'
            });

            self.totalWidth = document.getElementById('UIOCX').width;

            // 全屏和退出全屏时 停止播放进度 防止ocx全屏后视频闪动
            var operateSign = true;
            self.player.addEvent("OCXCANCELFULL", function() {
                // 启用更新时间
                self.enableUpdateTime = true;
            });
            self.player.addEvent("OCXFULLSCR", function() {
                // 禁用更新时间
                self.enableUpdateTime = false;
            });

            // 获取时间范围
            if (window.MediaLoader && MediaLoader.structInfo) {
                self.timeBegin = MediaLoader.structInfo.timeBegin;
                self.timeEnd = MediaLoader.structInfo.timeEnd;
                if (self.timeBegin === "暂未填写") {
                    self.timeBegin = undefined;
                }
                if (self.timeEnd === "暂未填写") {
                    self.timeEnd = undefined;
                }
            };

            // 标识是否按指定时间播放
            self.playRange = (self.timeBegin === null || self.timeBegin === undefined || self.timeEnd === null || self.timeEnd === undefined) ? false : true;

            // 播放
            if (self.player.playPfs2(playParm, 0, function() {
                self.playStatus = true;
                // 在第一帧时 暂停播放
                self.player.pause(0);
                jQuery(".video-block .switch").removeClass('active'); //样式为暂停
                jQuery(".video-block .switch").attr("title", "播放");

                self.bindEvents();
                self.firstFrameBase64 = self.player.playerSnap(0);

                if (self.playRange) {
                    // 显示视频片段区域标记
                    $(document).off("mousedown.player_mark");
                    var startMark = jQuery(".video-block .progress-bar .start-mark");
                    var endMark = jQuery(".video-block .progress-bar .end-mark");
                    var progressBar = jQuery(".video-block .progress-bar");
                    var allTime = self.player.getVideoInfo(0).duration;
                    var sleft = progressBar.width() * (self.timeBegin / allTime) - 5;
                    var eleft = progressBar.width() * (self.timeEnd / allTime) + 5;
                    sleft = sleft < 0 ? 0 : sleft;
                    eleft = eleft > progressBar.width() ? progressBar.width() : eleft;
                    startMark.css({
                        left: sleft
                    }).show();
                    endMark.css({
                        left: eleft
                    }).show();
                } else {
                    //使得播放状条及时间都归0
                    self.enableUpdateTime = false;
                    jQuery(".nowtime").text('00:00:00');
                    jQuery(".nowtime").attr('nowtime-ms', '00:00:00');
                    jQuery(".progress-bar .bullet").width(0);
                }

                jQuery('.entity-preview .entity-box .mark-buttons').show(); //显示标记按钮
            })) {

                // 视频播放成功后 指定时间范围内的播放
                if (self.playRange) {
                    self.player.playFormStartToEnd(self.timeBegin, self.timeEnd, true, 0);
                };
            };
        },
        //获取播放当前帧图片信息  返回base64位字符串（已处理换行）
        getThumbnailInfo: function() {
            return this.firstFrameBase64.replace(/[\n\r]/ig, '');
        },
        hideCurrentOcx: function() {
            document.getElementById("UIOCX").style.marginLeft = '-9999px';
        },
        destoryCurrentOcx: function() {
            document.getElementById("UIOCX").style.display = 'none';
        },
        showCurrentOcx: function() {
            document.getElementById("UIOCX").style.marginLeft = '';
        },
        //处理时间type:1(小时) 2(分钟) 3(秒)
        handleTime: function(type, time) {
            switch (type) {
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
            var startX = 0, //小圆点的位置
                self = this,
                totalTime = parseInt(jQuery(".alltime").attr('alltime-ms')), //总时间
                oldWidth = 0; //进度左侧部分(已播放部分)
            jQuery(document).on('mousedown', ".video-block .play-point", function(e) {
                document.body.onselectstart = function(){ //add by Leon.z 未处理当拖动小圆点时触发其他选择事件造成的bug
                    return false;
                }
                startX = e.pageX;
                oldWidth = jQuery(".progress-bar .bullet").width();
                if (self.intervalFlag !== null) {
                    window.clearInterval(self.intervalFlag);
                    self.intervalFlag = null;
                }
                jQuery(document).bind('mousemove', dragEvent);
                jQuery(document).bind('mouseup', unbindDragEvent);

            });
            var dragEvent = function(e) {
                var changeWidth = e.pageX - startX; //改变的宽度
                var tem = oldWidth + changeWidth;
                var newWidth = tem > self.totalWidth ? self.totalWidth : tem;
                newWidth = newWidth < 0 ? 0 : newWidth; //改变的宽度(处理后)
                var newTime = totalTime * (newWidth / self.totalWidth);
                jQuery(".nowtime").text(self.time2Str(newTime));
                jQuery(".nowtime").attr('nowtime-ms', newTime);
                jQuery(".progress-bar .bullet").width(newWidth);
            };
            var unbindDragEvent = function() {
                jQuery(document).unbind('mousemove', dragEvent);
                var t = parseInt(jQuery(".nowtime").attr('nowtime-ms'));
                var c = self.player.playByTime(t, 0);
                if (self.intervalFlag === null) {
                    self.intervalFlag = window.setInterval(self.updateTimeDisplay.bind(self), 500);
                }
                jQuery(document).unbind('mouseup', unbindDragEvent);
            };
        },
        //拖动标记
        dragMark: function() {
            var startX = 0,
                self = this,
                oldLeft = 0,
                totalLeft = self.totalWidth - 6,
                targetElm = null,
                totalTime = parseInt(jQuery(".alltime").attr('alltime-ms'));
            jQuery(document).on('mousedown.player_mark', '.start-mark,.end-mark', function(event) {
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
                    jQuery("#timeBegin").val(self.time2Str(sMarkTime));
                    jQuery("#timeBegin").trigger('blur');

                    //结束标记
                } else {
                    var eMarkTime = totalTime * (newLeft / totalLeft);
                    jQuery("#timeEnd").val(self.time2Str(eMarkTime));
                    jQuery("#timeBegin").trigger('blur');
                }
            };
            var unbindDragEvent = function() {
                jQuery(document).unbind('mousemove', dragEvent);

            };
        },
        //开始标记和结束标记时间Blur时
        markTimeBlur: function() {
            jQuery("#timeBegin , #timeEnd").on('blur', function() {
                jQuery(this).trigger('change');
            });
        },
        updateTimeDisplay: function() {
            var self = this;
            if (self.enableUpdateTime) {
                var allTime = self.player.getVideoInfo(0).duration;
                var nowTime = self.player.getPlayTime(0);
                jQuery(".video-block .nowtime").attr('nowTime', nowTime);
                jQuery(".video-block .nowtime").text(self.time2Str(nowTime));
                jQuery(".progress-bar .bullet").width(self.totalWidth * (nowTime / allTime));
            }
        },
        //停止播放(不是真正的停止,仅仅只是用暂停来模拟停止)
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
            jQuery(".video .video-block .speed").hide();
        },
        //获取播放速度
        getPlaySpeed: function() {
            var self = this;
            var speed = self.player.getPlaySpeed(0);
            var speedDom = jQuery(".video .video-block .speed");
            if (speed === "1") {
                speedDom.hide();
            } else {
                speedDom.show();
                speedDom.find("em").text(speed + "x");
            }

        },
        //暂停后播放
        togglePlay: function() {
            var self = this;
            if (self.intervalFlag === null) {
                self.intervalFlag = window.setInterval(self.updateTimeDisplay.bind(self), 500);
            }
            self.player.togglePlay(0);
            jQuery(".video-block .switch").attr("title", "暂停");
            jQuery(".video-block .switch").removeClass("over").addClass('active');
        },
        pause: function() {
            var self = this;
            self.player.pause(0);
            jQuery(".video-block .switch").removeClass("active");
            if (self.intervalFlag !== null) {
                clearInterval(self.intervalFlag);
                self.intervalFlag = null;
            }
        },
        allTime:function(){
            var self = this;
            return self.player.getVideoInfo(0).duration;
        },
        bindEvents: function() {
            var self = this;
            jQuery(function() {
                if (self.playStatus === true) {

                    //显示总时长
                    var videoInfo = self.player.getVideoInfo(0); //视频播放信息对象
                    var allTime = videoInfo.duration; //视频总时长ms
                    jQuery(".video-block .alltime").text(self.time2Str(allTime));
                    jQuery(".video-block .alltime").attr("alltime-ms", allTime);

                    //显示当前播放时间

                    self.updateTimeDisplay();
                    if (self.intervalFlag === null) {
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
                        self.enableUpdateTime = true;
                        var switchBtn = jQuery(".video-block .switch");
                        if (!switchBtn.hasClass("active")) {
                            switchBtn.trigger("click");
                        }
                        //点击停止后点击慢放/快放，第一次会获取不到速率报error,临时采用延时 by zhangxinyu on 2015-10-23
                        setTimeout(function() {
                            var speed = self.player.getPlaySpeed(0);
                            if (speed === "1/8") {
                                notify.warn("已达到最小倍速播放。");
                                return;
                            }
                            self.player.setPlaySpeed(-1, 0);
                            self.getPlaySpeed();
                        }, 1000);
                    });

                    //快放
                    jQuery(document).on('click', ".video-block .forward", function() {
                        self.enableUpdateTime = true;
                        var switchBtn = jQuery(".video-block .switch");
                        if (!switchBtn.hasClass("active")) {
                            switchBtn.trigger("click");
                        }
                        setTimeout(function() {
                            var speed = self.player.getPlaySpeed(0);
                            if (parseInt(speed) === 8) {
                                notify.warn("已达到最大倍速播放。");
                                return;
                            }
                            self.player.setPlaySpeed(1, 0);
                            self.getPlaySpeed();
                        }, 1000); 
                    });

                    //暂停/播放
                    jQuery(document).on('click', ".video-block .switch", function() {
                        self.enableUpdateTime = true;
                        //暂停
                        if (jQuery(this).is(".active")) {
                            clearInterval(self.intervalFlag);
                            self.intervalFlag = null;
                            jQuery(".video-block .switch").attr("title", "播放");
                            if (self.player.pause(0) !== true)
                                return;
                            //播放（包括暂停后的播放和关闭后的播放）
                        } else {
                            if (self.intervalFlag === null) {
                                self.intervalFlag = window.setInterval(self.updateTimeDisplay.bind(self), 500);
                            }

                            if (jQuery(this).hasClass("over")) { //关闭后的播放
                                if (self.player.playPfs(self.playParm, 0)) {
                                    // 视频播放成功后 指定时间范围内的播放
                                    if (self.playRange) {
                                        self.player.playFormStartToEnd(self.timeBegin, self.timeEnd, true, 0);
                                    };
                                }
                                jQuery(this).removeClass("over");
                                jQuery(".video-block .switch").attr("title", "暂停");
                            } else { //暂停后的播放
                                jQuery(".video-block .switch").attr("title", "暂停");
                                if (self.player.togglePlay(0))
                                    return;
                            }

                        }
                        //修改样式
                        jQuery(this).toggleClass('active');
                    });

                    //停止播放
                    jQuery(document).on('click', ".video-block .stop", function() {
                        self.stopPfs();
                    });
                    //点击标记片段
                    jQuery("#mark_extract").on("click", function() {
                        //切换视频
                        jQuery(".video_edit .edit_class[data-flag='tool_hideen']").trigger("click");
                        jQuery(".video_edit .video-block .progress-bar .start-mark").show(1);
                        jQuery(".video_edit .video-block .progress-bar .end-mark").show(1);
                        //设置标记结束的位置为起始位置后30秒
                        var allTime = self.player.getVideoInfo(0).duration;
                        jQuery(".video_edit .video-block .progress-bar i.end-mark").css('left', self.totalWidth * (30000 / allTime) + 'px');
                    });
                    //拖动播放小圆点
                    self.dragPoint();
                    //拖动标记
                    self.dragMark();
                    self.markTimeBlur();
                }
            });
        }
    });

    return Mplayer;
});
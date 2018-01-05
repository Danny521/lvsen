define([
    'basePlayer',
    'pubsub',
    'ocxError',
    'jquery',
    'mootools'
], function(NativePlayer, PubSub, OcxError) {
    // var paperH = Raphael('image_struct',700,424);   //创建画布
    var Mplayer = new Class({
        Implements: [Options, Events],
        player: null,
        playStatus: -1,
        //视频播放是否正常
        firstFrameBase64: '',
        intervalFlag: null, //计时器
        validateFlag: false, //验证人工标注时间填写是否通过.true为通过,false不通过.
        totalWidth: 700,
        playParm: null, //播放器参数
        hasVideoThumbnail: false,
        videoId: 0,
        options: {},
        enableUpdateTime: true, // 是否更新时间 防止ocx全屏后 视频闪烁
        initialize: function(options) {
            var self = this;
            this.setOptions(options);
            this.subscribe();
        },
        //初始化播放器 （对外使用） playParm:{filename:"NPFS:XXXX"};
        subscribe: function() {
            PubSub.subscribe('origPlayerScreenShotClose', function() {
                // 播放
                var switchBtn = jQuery(".video-block .switch");
                if (switchBtn.data("initPlayStatus")) {
                    switchBtn.trigger("click");
                }
            })
        },
        initPlayer: function(playParm) {
            var self = this;
            self.playParm = playParm;
            self.hasVideoThumbnail = playParm.hasVideoThumbnail;
            self.videoId = playParm.videoId;
            if (playParm === null || playParm === "") {
                notify.warn("播放路径格式不正确，播放路径为：" + JSON.stringify(playParm));
                return;
            };

            // var playParm = {filename:"NPFS:192.168.60.245:9000/username=admin&password=admin#/video/079a866d-41f9-4adb-baab-822228cfbba2.mbf"};
            self.player = new NativePlayer({
                "layout": 1,
                "uiocx": '#UIOCX'
            });

            self.totalWidth = document.getElementById('UIOCX').offsetWidth;
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
            //            if (window.opener && window.opener.gMessJson && (window.opener.gMessJson.timeBegin !== undefined || window.opener.gMessJson.timeBegin !== null)) {
            //                self.timeBegin = window.opener.gMessJson.timeBegin;
            //                self.timeEnd = window.opener.gMessJson.timeEnd;
            //            }
            // 标识是否按指定时间播放
            self.playRange = (self.timeBegin === null || self.timeBegin === undefined || self.timeEnd === null || self.timeEnd === undefined) ? false : true;
            // 播放
            self.player.playPfs2(playParm, 0, function(res) {
                self.playStatus = true;
                // 在第一帧时 暂停播放
                self.player.pause(0);

                if (!self.hasVideoThumbnail) {
                    $.ajax({
                        url: '/service/pia/updateVideoThumbnail',
                        dataType: 'json',
                        type: 'post',
                        data: {
                            id: parseInt(self.videoId),
                            videoThumbnail: self.player.grabCompressEx2(0, 200, 100)
                        },
                        success: function(res) {
                            if (res && res.code === 200) {
                                self.hasVideoThumbnail = true;
                                PubSub.publish('saveNewVideoThumbnailSuccess');
                            } else {
                                notify.warn('存储视频缩略图失败！');
                            }
                        },
                        error: function() {
                            notify.warn('存储视频缩略图失败！');
                        }
                    })
                }
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

                //当前视频信息事件发布
                PubSub.publish("imagePlayerInfo", self.player.getVideoInfo(0));
            }, 0 , function(index, result, userParam) {
                if (result != 0) {
                    jQuery(".video-block .switch").removeClass('active'); //样式为暂停
                    jQuery(".video-block .switch").attr("title", "播放");
                    notify.warn(OcxError(result) + ":" + result);
                };
            });
        },
        //获取播放当前帧图片信息  返回base64位字符串（已处理换行）
        getThumbnailInfo: function() {
            return this.firstFrameBase64.replace(/[\n\r]/ig, '');
        },
        pause: function() {
            var r = this.player.pause(0);
            jQuery(".video-block .switch").attr("title", "播放");
            return r;
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
            if (typeOf(time) === 'string') {
                time = parseInt(time);
            }
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
                var t = parseInt(jQuery(".nowtime").attr('nowtime-ms'));
                var c = self.player.playByTime(t, 0);
                PubSub.publish('showPlayerAndHideOcxPaper');
                if (self.intervalFlag === null) {
                    self.intervalFlag = window.setInterval(self.updateTimeDisplay.bind(self), 500);
                }
                jQuery(document).unbind('mouseup', unbindDragEvent); //禁止删除啊，删除后会导致BUG #2114  马越
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
                var startLeft = jQuery('.start-mark').css('left').split('px')[0] - 0;
                var endLeft = jQuery('.end-mark').css('left').split('px')[0] - 0;
                if (jQuery(targetElm).is('.start-mark') && (newLeft >= endLeft)) {
                    newLeft = endLeft - 1;
                } else if (jQuery(targetElm).is('.end-mark') && (newLeft <= startLeft)) {
                    newLeft = startLeft;
                }

                jQuery(targetElm).css('left', newLeft);

                //开始标记
                if (jQuery(targetElm).is('.start-mark')) {
                    var sMarkTime = totalTime * (newLeft / totalLeft);
                    if (jQuery("#timeEnd").val() === self.time2Str(sMarkTime)) { //开始时间和结束时间不能相等，最小相差必须是1秒。不然ocx指定时间段播放也会出问题
                        sMarkTime = sMarkTime - 1000;
                    }
                    jQuery("#timeBegin").val(self.time2Str(sMarkTime));
                    jQuery("#timeBegin").trigger('blur');

                    //结束标记
                } else {
                    var eMarkTime = totalTime * (newLeft / totalLeft);
                    if (jQuery("#timeBegin").val() === self.time2Str(eMarkTime)) { //开始时间和结束时间不能相等，最小相差必须是1秒。不然ocx指定时间段播放也会出问题
                        eMarkTime = eMarkTime + 1000;
                    }
                    jQuery("#timeEnd").val(self.time2Str(eMarkTime));
                    jQuery("#timeBegin").trigger('blur');
                }
            };
            var unbindDragEvent = function() {
                jQuery(document).unbind('mousemove', dragEvent);
            };
        },
        //取消人工标注
        cancelManualMark: function() {
            jQuery(document).on('click', '.manual-field .cancel', function() {
                jQuery('.manual-field').hide();
                jQuery('#manualMark').removeClass('disabled');
                jQuery('#timeBegin').val('');
                jQuery('#timeEnd').val('');
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
        //开始标记和结束标记时间change时  错误信息的提示
        markTimeVerify: function() {
            var self = this;
            jQuery(document).on('change', "#timeBegin , #timeEnd", function() {
                var markTime = jQuery(this).val(),
                    timeBegin = jQuery('#timeBegin').val(),
                    timeEnd = jQuery('#timeEnd').val();

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
                    if (timeBegin >= timeEnd) {
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
            jQuery("#timeBegin , #timeEnd").on('blur', function() {
                jQuery(this).trigger('change');
            });
        },
        //填写信息 点击事件
        writeInfo: function() {
            var self = this;
            jQuery(document).on("click", "#videoMark .write-info", function(e) {
                var trackType = jQuery(".track-type").val().trim(),
                    markStime_ms = jQuery("#timeBegin").attr('startTime'),
                    markEtime_ms = jQuery("#timeEnd").attr('endTime'),
                    picSrc = jQuery(".marked-picture").attr('src');

                jQuery("#timeBegin, #timeEnd").trigger('change');

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
        stop: function(index) {
            var self = this;
            self.playStatus = false;
            self.player && self.player.stop(index);
        },
        //停止播放(不是真正的停止,仅仅只是用暂停来模拟停止)
        stopPfs: function(argument) {
            var self = this;
            self.playStatus = false;
            self.player.stop(0);
            self.player.refreshWindow(0);
            if (self.intervalFlag !== null) {
                clearInterval(self.intervalFlag);
                self.intervalFlag = null;
            }
            jQuery(".time .nowtime").text("00:00:00"); //修改UI显示
            jQuery(".video-block .switch").removeClass("active").addClass('over').attr("title", "播放"); //修改switch按钮样式
            jQuery(".progress-bar .bullet").width(0);
            jQuery(".video-block .speed").hide();
        },
        //获取播放速度
        getPlaySpeed: function() {
            var self = this;
            var speed = self.player.getPlaySpeed(0);
            var speedDom = jQuery(".video-block .speed");
            if (speed === "1") {
                speedDom.hide();
            } else {
                speedDom.show();
                speedDom.find("em").text(speed + "x");
            }

        },
        /**
         * [clickProcessBar 点击进度条播放当前时刻]
         * @return {[type]} [description]
         */
        clickProcessBar: function() {
            var self = this,
                progress_bar = $(".file-container").find(".progress-bar"),
                bullet = progress_bar.find(".bullet"),
                videoInfo = self.player.getVideoInfo(0),
                allTime = videoInfo.duration;
            self.progress_bar = progress_bar;
            // 按点击进度播放
            self.progress_bar.on("click", function(event) {
                 var activePlay =  jQuery(".video-block").find(".switch").hasClass("active");
                if (self.progress_bar.width() > 0) {
                    if(!activePlay){
                        jQuery(".video-block").find(".switch").trigger('click');
                    }
                    var bulletRatio = (event.pageX - self.progress_bar.offset().left) / self.progress_bar.width();
                    bullet.width(Math.min(bulletRatio * 100, 100) + "%");

                    var time = bulletRatio * allTime;
                    time = Math.min(Math.max(time, 0), allTime);
                    self.player.playByTime(time, 0);
                };
            });
        },
        bindEvents: function() {
            var self = this;
            jQuery(function() {
                if (self.playStatus === true) {

                    //显示总时长
                    var videoInfo = self.player.getVideoInfo(0);
                    var allTime = videoInfo.duration;
                    var totalWidth = 700;
                    jQuery(".video-block .alltime").text(self.time2Str(allTime));
                    jQuery(".video-block .alltime").attr("alltime-ms", allTime);

                    //显示当前播放时间
                    self.updateTimeDisplay();
                    if (self.intervalFlag === null) {
                        self.intervalFlag = window.setInterval(self.updateTimeDisplay.bind(self), 500);
                    }
                    //抓图
                    jQuery(document).find(".video-block .grab").off("click").on('click', function(event) {
                        if (!self.playStatus) {
                            notify.warn("当前视频未进行播放！");
                            return;
                        }
                        // self.player.printScreen(0);
                        event.stopImmediatePropagation();
                        var data = self.player.playerSnap(0).replace(/[\n\r]/ig, '');
                        if (data === "ERROR") {
                            notify.error("抓图失败，请重试！");
                        } else {
                            // 暂停播放
                            var switchBtn = jQuery(".video-block .switch");
                            switchBtn.data("initPlayStatus", switchBtn.hasClass('active'));
                            if (switchBtn.data("initPlayStatus")) {
                                switchBtn.trigger("click");
                            }
                            PubSub.publish('screenshot', {
                                    data: data,
                                    message: 'origPlayerScreenShotClose'
                                })
                                /*self.fireEvent("screenshot", {
                                                      data : data,
                                                      message : 'origPlayerScreenShotClose'
                                                  });*/
                        }
                    });

                    //全屏
                    jQuery(document).find(".video-block .fullwin").off("click").on('click', function() {
                        self.player.displayFullScreen();
                    });

                    //慢放
                    jQuery(document).find(".video-block .rewind").off("click").on('click', function() {
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
                        }, 1000);
                    });

                    //快放
                    jQuery(document).find(".video-block .forward").off("click").on('click', function() {
                        self.enableUpdateTime = true;
                        var switchBtn = jQuery(".video-block .switch");
                        if (!switchBtn.hasClass("active")) {
                            switchBtn.trigger("click", {
                                "type": "fast"
                            });
                        }
                        setTimeout(function() {
                            var speed = self.player.getPlaySpeed(0);
                            if (parseInt(speed) === 8) {
                                notify.warn("已达到最大倍速播放。");
                                return;
                            }
                            self.player.setPlaySpeed(1, 0);
                            self.getPlaySpeed();
                            PubSub.publish('showPlayerAndHideOcxPaper');
                        }, 1000);
                    });

                    //暂停/播放
                    jQuery(document).find(".video-block .switch").off("click").on('click', function(e, stauts) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        self.enableUpdateTime = true;
                        //暂停
                        if (jQuery(this).hasClass("active")) {
                            PubSub.publish('imagePlayerStop');
                            clearInterval(self.intervalFlag);
                            self.intervalFlag = null;
                            if (self.player.pause(0) === true) {
                                jQuery(".video-block .switch").removeClass('active').attr("title", "播放");
                            };

                            //播放（包括暂停后的播放和关闭后的播放）
                        } else {
                            if (!stauts || stauts !== "pause") {
                                //视频播放事件总线
                                PubSub.publish("imagePlayerPause");
                                PubSub.publish('showPlayerAndHideOcxPaper');
                                if (self.intervalFlag === null) {
                                    self.intervalFlag = window.setInterval(self.updateTimeDisplay.bind(self), 500);
                                };

                                if (jQuery(this).hasClass("over")) { //关闭后的播放
                                    jQuery(this).removeClass("over");
                                    if (self.playParm === null || self.playParm === "") {
                                        notify.warn("播放路径格式不正确，播放路径为：" + self.playParm);
                                        return;
                                    };
                                    self.player.playPfs(self.playParm, 0, function(res) {
                                        if (res >= 0) {
                                            // 视频播放成功后 指定时间范围内的播放
                                            self.playStatus = true;
                                            if (self.playRange) {
                                                self.player.playFormStartToEnd(self.timeBegin, self.timeEnd, true, 0);
                                            };
                                            jQuery(".video-block .switch").addClass('active').attr("title", "暂停");
                                        }
                                    });
                                } else { //暂停后的播放
                                    self.playStatus = true;
                                    var stauts = self.player.togglePlay(0);
                                    if (stauts === 0) {
                                        jQuery(".video-block .switch").addClass('active').attr("title", "暂停");
                                    }
                                };
                            };
                        };
                    });
                    //停止播放
                    jQuery(document).find(".video-block .stop").off("click").on('click', function() {
                        self.stopPfs();
                    });
                    //点击标记片段
                    jQuery("#mark_extract").on("click", function(event) {
                        //阻止事件冒泡
                        event.preventDefault();
                        event.stopImmediatePropagation();
                        //切换视频
                        jQuery(".video_edit .edit_class[data-flag='tool_hideen']").trigger("click");
                        var startMark = jQuery(".video_edit .video-block .progress-bar .start-mark");
                        var endMark = jQuery(".video_edit .video-block .progress-bar .end-mark");
                        startMark.show();
                        endMark.show();
                        //设置标记结束的位置为起始位置后30秒
                        var nowtime = self.player.getPlayTime(0);
                        var pointPos = jQuery('.video-block .progress-bar .bullet').width() + 10; //10代表播放器小豆豆宽度的一半
                        var allTime = self.player.getVideoInfo(0).duration;
                        var timeleft = (nowtime - 15 * 1000) < 0 ? 0 : (nowtime - 15 * 1000);
                        var timeright = (nowtime + 15 * 1000) > allTime ? allTime : (nowtime + 15 * 1000);
                        var nowleft = timeleft * (self.totalWidth / allTime);
                        var nowrigth = timeright * (self.totalWidth / allTime);
                        //不能超出边界
                        if ((nowtime + 15 * 1000) > allTime) {
                            nowrigth = self.totalWidth - 5;
                        }
                        jQuery('#timeBegin').val(self.time2Str(timeleft));
                        jQuery('#timeEnd').val(self.time2Str(timeright));
                        startMark.css('left', nowleft);
                        endMark.css('left', nowrigth);
                    });
                    //拖动播放小圆点
                    self.dragPoint();
                    //拖动标记
                    self.dragMark();
                    self.clickProcessBar();
                    //人工标注按钮-点击
                    // self.manualMarkBtn();
                    //取消人工标注
                    self.cancelManualMark();
                    self.selectMarkType();
                    self.markTimeVerify();
                    self.markTimeBlur();
                    self.writeInfo();
                }
            });
        }
    });

    return Mplayer;
})
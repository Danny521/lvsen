/**
 * [CommonOnePlayer
 * 主要功能：
 *  视频播放(可初始化多个视频播放器,只要创建多个对象),
 *  按指定时间段播放(显示播放时间段的标记按钮),
 *  视频片段集播放(可指定片段间最小时间间隔，用来合并小于间隔的片段为一个大的片段; 可指定片段和非片段的播放速度),
 *  视频的标注(可选择视频片段时间)
 * ]
 * @type {Class}
 */
define([
    'pubsub',
    'basePlayer',
    '/module/imagejudge/resource-process/js/screenShot.js',
    'jquery',
    'mootools',
    'base.self'
], function(PubSub, NativePlayer, screenShot){
    var CommonOnePlayer = new Class({
        Implements: [Events],
        id: "", // 播放器的id
        player: null, // nativePlayer对象
        tpl: "", // 播放器模板
        inited: false, // 播放器初始化状态[true: 已初始化, false:待初始化]
        playStatus: 0, // 播放器播放状态[0: 未播放, 1: 播放, 2:暂停, 3:停止]
        disableUpdatePlayTime: false, //是否禁用播放器时间更新
        disableUpdateProgressbar: false, //是否禁用播放器进度更新
        viewMarkTime: [], // 经过间隔处理的剪切型视频片段时间范围集合
        firstFrameBase64: "", // 第一帧画面
        playerScreenShotIsStop : false,
        options: {
            needModel : true,
            flag : false,
            container: null,
            tplUrl: '/module/imagejudge/resource-process/inc/player1.html',
            fileUrl: "",
            fileName : '',
            shootTime : null,
            //fileUrl: "NPFS:192.168.60.206:9000/username=admin&password=admin#/video/9a5caeb0-4499-4cf3-923d-ef29ce93f796.mp4",
            //fileUrl: "NPFS:192.168.60.206:9000/username=admin&password=admin#/video/43034c53-3ff1-4f43-a76d-0a2eb8e93541.mbf",

            // 人工标注时用到这三个属性
            // 当enableMarkTime===true时,enableDragMark=true,允许拖动标记按钮
            // 当enableMarkTime===true时,markTime、enableDragMark为必选
            enableMarkTime: false, // 是否启用
            enableDragMark: true, // 是否可拖动标记按钮
            markTime: { // 时间片段
                startTime: 0,
                endTime: 0
            },

            // 显示人工标注视频片段时用到这两个属性
            // 视频会在此时间片段内播放
            // 当enablePlayMarkTime===true时,enableDragMark=false,不允许拖动标记按钮
            // 当enablePlayMarkTime===true时,playMarkTime为必选
            enablePlayMarkTime: false, // 是否启用
            playMarkTime: { // 时间片段
                startTime: 0,
                endTime: 0
            },

            // 显示剪切型视频片段用到这三个属性
            // 视频会根据时间片段播放
            // 当enableCutMarkTime===true时,minCutMarkTimeInterval、cutMarkTime为必选
            enableCutMarkTime: false, // 是否启用
            minCutMarkTimeInterval: 0, // 指定视频片段最小时间间隔,用来合并视频片段
            // cutMarkTime: [{
            // 	startTime: 10000,
            // 	endTime: 100000
            // }, {
            // 	startTime: 200000,
            // 	endTime: 250000
            // }]
            cutMarkTime: [], // 视频片段集
            cutMarkSpeed: "1", // 有标记播放速度
            cutNoMarkSpeed: "8" // 无标记播放速度

        },
        initialize: function(options) {
            this.id = this.uuid();
            this.setOptions(options);
            this.subscribe();
        },
        subscribe : function(){
            var self =this;
            PubSub.subscribe('cutPlayerScreenShotClose', function () {
                if(self.playerScreenShotIsStop && !self.isPlaying()){
                    self.play();
                    self.playerScreenShotIsStop = false;
                }
            })
        },
        setOptions: function(options) {
            if (options) {
                this.tempCacheMarkInfo = null;
            };

            this.options = $.extend({}, this.options, options || {});

            // 当标记视频的时候 标记按钮可拖动
            if (this.options.enableMarkTime === true) {
                this.options.enableDragMark = true;
            };

            // 当显示标记视频的时候 标记按钮不可拖动
            if (this.options.enablePlayMarkTime === true) {
                this.options.enableDragMark = false;
            };
        },
        init: function(options) {
            var self = this;
            // 已经初始化的播放器 不再进行初始化
            if (self.inited) {
                return;
            };

            self.setOptions(options);

            // 验证播放参数
            if (self.options.fileUrl === null || self.options.fileUrl === undefined || self.options.fileUrl === "") {
                notify.warn("播放路径格式不正确，播放路径为：" + JSON.stringify(self.options.fileUrl));
                return;
            };

            if(self.options.needModel){
                // 获取播放器模板
                $.when(Toolkit.loadTempl(self.options.tplUrl)).done(function(tpl) {
                    self.tpl = tpl;
                    // 渲染播放器元素
                    $(self.tpl).appendTo(self.options.container);
                    self.createElements();
                    self.bindEvents();
                    self.playFirstFrame();
                    self.inited = true;
                    self.fireEvent("inited");
                });
            }else{
                self.createElements();
                self.bindEvents();
                self.playFirstFrame();
                self.inited = true;
                self.fireEvent("inited");
            }

        },
        createElements: function() {
            var self = this;
            var container = $(self.options.container).find(".player-container").attr("id", self.id);
            self.container = container;
            var play_times = container.find(".play-times");
            var play_buttons = container.find(".play-buttons");
            var other_buttons = container.find(".others-buttons");

            self.progress_bar = container.find(".progress-bar-inner");
            self.bullet = container.find(".progress-bar-inner .progress-bullet");
            self.palypoint = self.bullet.find(".progress-play-point");
            self.mark_start = self.progress_bar.find(".progress-mark-start");
            self.mark_end = self.progress_bar.find(".progress-mark-end");

            self.time_nowtime = play_times.find(".time-nowtime");
            self.time_alltime = play_times.find(".time-alltime");
            self.time_speed = play_times.find(".time-speed");

            self.btn_slow = play_buttons.find(".btn-slow");
            self.btn_play = play_buttons.find(".btn-play");
            self.btn_forward = play_buttons.find(".btn-forward");
            self.btn_stop = play_buttons.find(".btn-stop");

            self.btn_screenshot = other_buttons.find(".btn-screenshot");
            self.btn_fullwin = other_buttons.find(".btn-fullwin");
            // 创建nativePlayer对象
            self.player = new NativePlayer({
                layout: 1,
                uiocx: self.options.container,
                class : '.player-obj'
            });
        },
        bindEvents: function() {
            var self = this;

            // 慢放
            self.btn_slow.on("click", function(event) {
                self.slow();
            });

            // 播放或暂停
            self.btn_play.on("click", function(event) {
                self.togglePlay();
            });

            // 快放
            self.btn_forward.on("click", function(event) {
                self.forward();
            });

            // 停止
            self.btn_stop.on("click", function(event) {
                self.stop();
            });

            // 截图
            self.btn_screenshot.on("click", function(event) {
                if(self.playStatus === 3){
                    notify.warn("当前视频未进行播放！");
                    return;
                }
                var data = self.player.playerSnap(0).replace(/[\n\r]/ig, '');
                if (data === "ERROR") {
                    notify.error("抓图失败，请重试！");
                } else {
                    if (self.isPlaying()) {
                        self.pause();
                        self.playerScreenShotIsStop  = true;
                    }
                    screenShot.init({
                        data : data,
                        message: 'cutPlayerScreenShotClose',
                        fileName : self.options.fileName,
                        shootTime : self.transFromShootTime(self.options.shootTime),
                        nowTime : self.player.getPlayTime(0)
                    });
                }
            });

            // 全屏
            self.btn_fullwin.on("click", function(event) {
                if (!self.player.isFullScreen()) {
                    self.player.displayFullScreen();
                };
            });

            // 按点击进度播放
            self.progress_bar.on("click", function(event) {
                self.options.flag = true;
                if (self.progress_bar.width() > 0) {
                    var bulletRatio = (event.pageX - self.progress_bar.offset().left) / self.progress_bar.width();
                    self.bullet.width(Math.min(bulletRatio * 100, 100) + "%");

                    var time = bulletRatio * self.allTime;
                    time = Math.min(Math.max(time, 0), self.allTime);
                    self.playByTime(time);
                    $('.speed-mark').trigger('change');//解决在有目标区快进/快退时然后点击进度播放播放速度变为正常的问题
                    self.tempCacheMarkInfo = null;
                };
            });

            // 按拖动进度播放
            $(document).on("mousedown", ".player-container[id=" + self.id + "] .progress-play-point", function(event) {
                self.options.flag = true;
                self.disableUpdateProgressbar = true;
                $(document).on("mousemove.common_pfs_player_point", function(event) {
                    if (self.progress_bar.width() > 0) {

                        var bulletRatio = (event.pageX - self.progress_bar.offset().left) / self.progress_bar.width();
                        self.bullet.width(Math.min((bulletRatio * 100), 100) + "%");

                        var time = bulletRatio * self.allTime;
                        time = Math.min(Math.max(time, 0), self.allTime);
                        self.playByTime(time);
                        $('.speed-mark').trigger('change');//解决在有目标区快进/快退时然后拖动进度播放播放速度变为正常的问题
                        self.tempCacheMarkInfo = null;
                    };
                });
            }).on("mouseup", function(event) {
                $(document).off("mousemove.common_pfs_player_point");
                self.disableUpdateProgressbar = false;
            });

            // 标记按钮
            $(document).on("mousedown", ".player-container[id=" + self.id + "] .progress-mark-start", function(event) {
                if (self.options.enableDragMark) {
                    $(document).on("mousemove.common_pfs_player_start", function(event) {
                        self.mark_start.css({
                            left: Math.min(Math.max(event.pageX - self.progress_bar.offset().left, 0), self.mark_end.position().left)
                        });
                        self.options.markTime = {
                            startTime: self.px2time(self.mark_start.position().left),
                            endTime: self.px2time(self.mark_end.position().left)
                        };
                    });
                };
            }).on("mouseup", function(event) {
                $(document).off("mousemove.common_pfs_player_start");
            });
            $(document).on("mousedown", ".player-container[id=" + self.id + "] .progress-mark-end", function(event) {
                if (self.options.enableDragMark) {
                    $(document).on("mousemove.common_pfs_player_end", function(event) {
                        self.mark_end.css({
                            left: Math.min(Math.max(event.pageX - self.progress_bar.offset().left, self.mark_start.position().left), self.progress_bar.width())
                        });
                        self.options.markTime = {
                            startTime: self.px2time(self.mark_start.position().left),
                            endTime: self.px2time(self.mark_end.position().left)
                        };
                    });
                };
            }).on("mouseup", function(event) {
                $(document).off("mousemove.common_pfs_player_end");
            });

            // 拖动标记按钮
            self.mark_start.on("click", function(event) {
                event.preventDefault();
                event.stopImmediatePropagation();
            });
            self.mark_end.on("click", function(event) {
                event.preventDefault();
                event.stopImmediatePropagation();
            });

            // 全屏和退出全屏时 停止播放进度 防止ocx全屏后视频闪动
            self.player.addEvent("OCXCANCELFULL", function() {
                self.disableUpdatePlayTime = false;
            });
            self.player.addEvent("OCXFULLSCR", function() {
                self.disableUpdatePlayTime = true;
            });

            // 更新播放时间
            self.updatePlayTime(100);
        },
        transFromShootTime : function(shoottime){
            var resultTime ="";
            if(shoottime && shoottime!=''){
                var d = new Date(shoottime);
                resultTime = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
            }
            return resultTime;

        },
        getVideoInfo : function(){
            var self =this;
            return self.player.getVideoInfo(0);
        },
        playFirstFrame: function () {
            var self = this;
            // 播放视频第一帧
            var res = self.player.playPfs2({
                filename: self.options.fileUrl
            }, 0, function(result) {
                // 在第一帧时 暂停播放
                if (self.pause()) {
                    self.firstFrameBase64 = self.player.playerSnap(0);
                }
                // 判断播放结果
                if (result === 0) {
                    //self.playStatus = 1;
                    // 视频信息 包括宽度 高度 时间
                    self.videoInfo = self.player.getVideoInfo(0);
                    self.allTime = self.videoInfo.duration;
                    self.nowTime = self.player.getPlayTime(0);

                    // 播放视频片段
                    self.playByMarkTime();
                    // 播放剪切视频片段
                    self.playByCutMarkTime();

                    // 显示片段标记或按钮
                    setTimeout(function() {
                        self.showMark();
                    }, 10);

                } else {
                    notify.warn("播放失败！请刷新页面后重试");
                }
            });
            if (res < 0) {
                notify.warn("播放失败！请刷新页面后重试");
            }
        },
        setCutMarkTime: function(cutMarkTime) {
            var self = this;
            if (cutMarkTime !== undefined) {
                self.setOptions({
                    enableCutMarkTime: true,
                    cutMarkTime: cutMarkTime
                });
            }
            if (self.options.enableCutMarkTime) {
                self.progress_bar.find(".progress-mark-section").remove();
                $.each(self.getCutMarkOverTime(), function(index, elem) {
                    self.createCutMarkOver(elem);
                });
            };
        },
        setFileUrl: function(fileUrl) {
            if (this.options.fileUrl !== fileUrl) {
                this.stop();
                this.setOptions({
                    fileUrl: fileUrl
                });
                this.playFirstFrame();
            };
        },
        playByMarkTime: function(startTime, endTime) {
            var self =this;
            var endCallBack = function(){
                self.btn_play.removeClass('active').attr("title", "播放");
                self.playStatus = 3;//此处因为未更新视频状态导致bug。等待处理，暂时先处理为从头开始播放
            };
            if (startTime !== undefined && endTime !== undefined) {
                this.setOptions({
                    enablePlayMarkTime: true,
                    playMarkTime: {
                        startTime: startTime,
                        endTime: endTime
                    }
                });
                this.playByRange(this.options.playMarkTime.startTime, this.options.playMarkTime.endTime, false, 0, endCallBack);
                this.showMark();
            } else {
                if (this.options.enablePlayMarkTime) {
                    this.playByRange(this.options.playMarkTime.startTime, this.options.playMarkTime.endTime);
                    this.showMark();
                }
            }
        },
        playByCutMarkTime: function() {

            if (this.options.enableCutMarkTime && this.options.cutMarkTime.length > 0) {
                if (this.tempCacheMarkInfo) {
                    if (this.timeInRange(this.nowTime, this.tempCacheMarkInfo.startTime, this.tempCacheMarkInfo.endTime)) {
                        return;
                    };
                };

                var marks = this.options.cutMarkTime,
                    start = 0;

                if (this.nowTime > marks[marks.length - 1].endTime) {
                    this.tempCacheMarkInfo = {
                        startTime: marks[marks.length - 1].endTime,
                        endTime: this.allTime
                    };
                    this.playBySpeed(this.options.cutNoMarkSpeed);
                    return;
                }
                for (var i = 0, len = marks.length; i < len; i++) {
                    if (this.nowTime > start && this.nowTime < marks[i].startTime) {
                        this.inTimeRange = false;
                        this.tempCacheMarkInfo = {
                            startTime: start,
                            endTime: marks[i].startTime
                        };
                        // 无标记
                        this.playBySpeed(this.options.cutNoMarkSpeed);
                        return;
                    };
                    if (this.nowTime > marks[i].startTime && this.nowTime < marks[i].endTime) {
                        this.inTimeRange = true;
                        this.tempCacheMarkInfo = marks[i];
                        // 有标记
                        this.playBySpeed(this.options.cutMarkSpeed);
                        return;
                    };
                    start = marks[i].endTime;
                };


            };
        },
        playBySpeed: function(speed) {
            var self =this;
            if (this.isPlaying()) {
                var currSpeed = this.getPlaySpeed();
                currSpeed = eval(currSpeed + "");
                speed = eval(speed + "");
                // console.log("currSpeed", "=", currSpeed, " , speed=", speed);
                if (speed !== currSpeed) {
                    if (speed > currSpeed) {
                        this.setPlaySpeed(1);
                        setTimeout(function(){
                            self.options.flag = false;
                        },100);
                    } else {
                        this.setPlaySpeed(-1);
                        setTimeout(function(){
                            self.options.flag = false;
                        },100);
                    }
                    this.playBySpeed(speed);
                }
            }
        },
        playByRange: function(startTime, endTime, repeat, index, endCallBack) {
            var self = this,
                startTime = startTime,
                endTime = endTime,
                repeat = repeat||false,
                index = index|| 0,
                endCallBack = endCallBack|| function(){};
            self.play(function() {
                self.player.playFormStartToEnd2(startTime, endTime, repeat, index, endCallBack);
            });
        },
        timeInRange: function(time, beginTime, endTime) {
            return (time >= beginTime && time <= endTime);
        },
        showMark: function() {
            var self = this;

            // 根据当前播放位置显示视频标记按钮
            if (self.options.enableMarkTime) {
                self.options.markTime = self.options.markTime ? self.options.markTime : {};
                self.options.markTime.startTime = self.px2offsettime(-30);
                self.options.markTime.endTime = self.px2offsettime(30);
                self.mark_start.css({
                    left: self.time2px(self.options.markTime.startTime)
                }).show();
                self.mark_end.css({
                    left: self.time2px(self.options.markTime.endTime)
                }).show();
            };

            // 按指定时间片段显示视频标记按钮
            if (self.options.enablePlayMarkTime) {
                self.mark_start.css({
                    left: self.time2px(self.options.playMarkTime.startTime)
                }).show();
                self.mark_end.css({
                    left: self.time2px(self.options.playMarkTime.endTime)
                }).show();
            };

            // 显示视频片段
            if (self.options.enableCutMarkTime) {
                self.setCutMarkTime();
            };
        },
        hideMark: function() {
            var self = this;
            if (self.options.enableMarkTime) {
                self.mark_start.hide();
                self.mark_end.hide();
                self.options.enableMarkTime = false;
            };
            if (self.options.enablePlayMarkTime) {
                self.mark_start.hide();
                self.mark_end.hide();
                self.options.enablePlayMarkTime = false;
            };
            if (self.options.enableCutMarkTime) {
                self.options.enableCutMarkTime = false;
                self.progress_bar.find(".progress-mark-section").remove();
            };
        },
        createCutMarkOver: function(markInfo) {
            var startX = this.time2px(markInfo.startTime);
            var endX = this.time2px(markInfo.endTime);
            $('<div class="progress-mark-section"></div>')
                .css("left", startX)
                .width(endX - startX)
                .appendTo(this.progress_bar);
        },
        getCutMarkOverTime: function() {
            var self = this;
            self.viewMarkTime = [];
            $.each(this.options.cutMarkTime, function(index, markInfo) {
                if (index === 0) {
                    self.viewMarkTime.push({
                        startTime: markInfo.startTime,
                        endTime: markInfo.endTime
                    });
                } else {
                    // 当时间段之间的范围小于指定的范围对时间段进行合并
                    if ((markInfo.startTime - self.viewMarkTime[self.viewMarkTime.length - 1].endTime) < self.options.minCutMarkTimeInterval) {
                        self.viewMarkTime[self.viewMarkTime.length - 1].endTime = markInfo.endTime;
                    } else {
                        self.viewMarkTime.push({
                            startTime: markInfo.startTime,
                            endTime: markInfo.endTime
                        });
                    };
                };
            });
            return self.viewMarkTime;
        },
        time2px: function(time) {
            return Math.min(Math.max((time / this.allTime) * this.progress_bar.width(), 0), this.progress_bar.width());
        },
        px2time: function(px) {
            return Math.min(Math.max((px / this.progress_bar.width()) * this.allTime, 0), this.allTime);
        },
        px2offsettime: function(px) {
            return Math.min(Math.max(this.nowTime + this.px2time(px), 0), this.allTime);
        },
        updatePlayTime: function(interval) {
            var self = this;

            this.videoInfo = this.player.getVideoInfo(0);
            this.allTime = this.videoInfo.duration;
            this.nowTime = this.player.getPlayTime(0);

            if (!this.disableUpdatePlayTime) {
                this.allTime = this.allTime ? this.allTime : 0;
                this.time_alltime.text(this.time2str(this.allTime));

                this.nowTime = this.nowTime ? this.nowTime : 0;
                this.time_nowtime.text(this.time2str(this.nowTime));

                if (!this.disableUpdateProgressbar && this.allTime > 0 && this.progress_bar.width() > 0 && this.palypoint.width() > 0) {
                    self.bullet.width(Math.min((this.nowTime / this.allTime) * 100, 100) + "%");
                };
            };

            // 按时间片段集播放
            this.playByCutMarkTime();

            this.updatePlayTimeTimeoutId = setTimeout(function() {
                self.updatePlayTime(interval);
            }, interval);
        },
        time2str: function(time) {
            if (typeof time === 'string') {
                time = parseInt(time);
            };
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
        str2time: function(str) {
            var time_array = str.split(":");
            return (parseInt(time_array[0]) * 60 * 60 * 1000) + (parseInt(time_array[1]) * 60 * 1000) + (parseInt(time_array[2]) * 1000);
        },
        slow: function() {
            var self =this;
            this.playStatus = 1;
            this.setPlaySpeed(-1);
            setTimeout(function(){
                self.options.flag = false;
            },100);
        },
        togglePlay: function() {
            console.log(this.isPlaying())
            if (this.isPlaying()) {
                this.pause();
            } else {
                this.play();
            };
        },
        pause: function() {
            var result = this.player.pause(0);
            if (result) {
                this.playStatus = 2;
                this.btn_play.removeClass('active').attr("title", "播放");
            };
            return result;
        },
        play: function(callback) {
            var result = false,
            self = this;
            console.log(this.isPlaying(),this.isPause())
            if (this.isPlaying()) {
                result = true;
            };
            if (this.isPause()) {
                this.player.resumePlayEX(0);
                result = true;
            };
            var isStop = this.isStop();
            if (isStop) {
                this.player.playPfs({
                    filename: this.options.fileUrl
                }, 0, function(res){
                     if(res>=0){
                        callback && callback();
                        donextPlayPart();
                     }
                });
            }
            var donextPlayPart = function(res){
                self.playStatus = 1;
                self.btn_play.addClass('active').attr("title", "暂停");

                self.videoInfo = self.player.getVideoInfo(0);
                self.allTime = self.videoInfo.duration;
                self.nowTime = self.player.getPlayTime(0);

                if (isStop) {
                    self.options.enableCutMarkTime = true;
                    self.setCutMarkTime();
                };

            };
            if (result) {
                callback && callback();
                donextPlayPart();
            };
        },
        playByTime: function(time) {
            var self = this;
            self.play(function(){
                self.player.playByTime(time, 0);
            });
        },
        getAllTime : function(){
            return this.allTime;
        },
        forward: function() {
            var self =this;
            this.playStatus = 1;
            this.setPlaySpeed(1);
            setTimeout(function(){
                self.options.flag = false;
            },100);
        },
        stop: function() {
            if (this.player.stop(0)) {
                this.playStatus = 3;
                this.player.refreshWindow(0);

                this.time_nowtime.text("00:00:00");
                this.time_speed.hide();
                this.bullet.width("0%");
                this.btn_play.removeClass("active").attr("title", "播放");

                this.hideMark();
            };
        },
        setPlaySpeed: function(speed) {
            var self = this;
            var eventDeal = function() {
                var oldSpeed = self.getPlaySpeed();
                if (speed > 0) { //快放
                    if (parseInt(oldSpeed) === 8) {
                        notify.warn("已达到最大倍速播放。");
                        return;
                    }
                } else { //慢放
                    if (oldSpeed === "1/8") {
                        notify.warn("已达到最小倍速播放。");
                        return;
                    }
                }
                var oldSpeed = self.getPlaySpeed();

                // 设置播放速度
                self.player.setPlaySpeed(speed, 0);

                // 获取播放速度
                var newSpeed = self.getPlaySpeed();

                // 更新播放速度显示
                if (newSpeed === "1") {
                    self.time_speed.hide();
                } else {
                    self.time_speed.show().find("span").text(newSpeed + "x");
                };

                oldSpeed = eval(oldSpeed);
                newSpeed1 = eval(newSpeed);
                if (newSpeed1 !== newSpeed) {
                    self.fireEvent("speedChange", [self.inTimeRange, newSpeed, self.options.flag]);
                }
            };
            self.play(eventDeal);
        },
        getPlaySpeed: function() {
            return this.player.getPlaySpeed(0); 
        },
        isPlaying: function() {
            return this.playStatus === 1 ? true : false;
        },
        isPause: function() {
            return this.playStatus === 2 ? true : false;
        },
        isStop: function() {
            return this.playStatus === 3 ? true : false;
        },
        hide: function() {
            if (this.isPlaying()) {
                this.pause();
            };
            //this.container.addClass("hidden");
        },
        show: function() {
            //this.container.removeClass('hidden');
        },
        uuid: function() {
            var s = [];
            var hexDigits = "0123456789abcdef";
            for (var i = 0; i < 36; i++) {
                s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
            }
            s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
            s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
            s[8] = s[13] = s[18] = s[23] = "-";

            var uuid = s.join("");
            return uuid;
        }
    });

    return CommonOnePlayer;
})
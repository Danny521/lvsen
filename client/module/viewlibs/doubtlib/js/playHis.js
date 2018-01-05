define(['base.self'], function() {
    var MplayerHis = new new Class({
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
                        self.player.setPlaySpeed(-1, 0);
                        self.getPlaySpeed();

                    });

                    //快放
                    jQuery(document).on('click', ".video-block .forward", function() {
                        self.enableUpdateTime = true;
                        var switchBtn = jQuery(".video-block .switch");
                        if (!switchBtn.hasClass("active")) {
                            switchBtn.trigger("click");
                        }
                        self.player.setPlaySpeed(1, 0);
                        self.getPlaySpeed();
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
                                self.player.playPfs2(self.playParm, 0, function() {
                                    // 视频播放成功后 指定时间范围内的播放
                                    if (self.playRange && self.loop) {
                                        self.player.playFormStartToEnd(self.timeBegin, self.timeEnd, true, 0);
                                    };
                                });
                                jQuery(this).removeClass("over");
                                jQuery(".video-block .switch").attr("title", "暂停");
                            } else if (jQuery(this).hasClass("rangeend")) { //指定位置的播放
                                self.player.playPfs2(self.playParm, 0, function() {
                                    // 视频播放成功后 指定时间范围内的播放
                                    if (self.playRange && self.loop) {
                                        self.player.playFormStartToEnd(self.timeBegin, self.timeEnd, true, 0);
                                    };
                                });
                                jQuery(this).removeClass("rangeend");
                                jQuery(".video-block .switch").attr("title", "暂停");
                            } else { //暂停后的播放
                                jQuery(".video-block .switch").attr("title", "暂停");
                                if (self.playRange && self.loop) {
                                    self.player.playFormStartToEnd(self.timeBegin, self.timeEnd, true, 0);
                                } else if (self.playRange && self.firstPlay) {
                                    self.firstPlay = false;
                                    self.player.playFormStartToEnd2(self.timeBegin, self.timeEnd, false, 0, self.togglePlaystatus, 1);
                                } else {
                                    self.player.playFormStartToEnd(0, 0, true, 0);
                                }
                                self.player.togglePlay(0);
                            }

                        }
                        //修改样式
                        jQuery(this).toggleClass('active');
                    });

                    //停止播放
                    jQuery(document).on('click', ".video-block .stop", function() {
                        self.stopPfs();
                    });
                    //循环播放
                    jQuery(document).on('click', ".video-block .sequence", function() {
                        //if(self.loop){return;};
                        //将倍率隐藏
                        jQuery(".video-block .speed").hide();

                        self.enableUpdateTime = true;
                        self.loop = true;
                        //如果播放则先暂停再播放
                        if (jQuery(".video-block .switch").is(".active")) {
                            self.player.pause(0);
                            jQuery(".video-block .switch").removeClass('active');
                            jQuery(".video-block .switch").addClass('rangeend');
                        }
                        jQuery(".video-block .switch").trigger("click");
                        //hide() sequence
                        jQuery(".video-block .sequence").hide();
                        jQuery(".video-block .loop").show();
                    });

                    //顺序播放
                    jQuery(document).on('click', ".video-block .loop", function() {
                        //if(!self.loop){return;};
                        //将倍率隐藏
                        jQuery(".video-block .speed").hide();
                        self.enableUpdateTime = true;
                        self.loop = false;
                        self.firstPlay = false;
                        //如果播放则先暂停再播放
                        if (jQuery(".video-block .switch").is(".active")) {
                            self.player.pause(0);
                            jQuery(".video-block .switch").removeClass('active');
                            jQuery(".video-block .switch").addClass('rangeend');
                        }
                        var switchBtn = jQuery(".video-block .switch");
                        if (!switchBtn.hasClass("active")) {
                            switchBtn.trigger("click");
                        }
                        //hide() loop
                        jQuery(".video-block .loop").hide();
                        jQuery(".video-block .sequence").show();
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
    return MplayerHis;
})
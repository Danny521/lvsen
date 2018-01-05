
/**
 * Created by Wangchaofan on 2015/1/10.
 * 叠加型视频播放控件
 */
define([
    'underscore',
    'pubsub',
    '/module/imagejudge/resource-process/js/overlayPlayer.js',
    '/module/imagejudge/resource-process/js/screenShot.js',
    'jquery',
    'mootools'
], function (_, PubSub, overlayPlayer, screenShot) {
    var currentSpeed = 0,//当前视频播放速度
        isPlaying = false,//当前视频是否正在播放
        isStopping = false,//当前视频是否处于停止状态
        allTime = 0,//视频总时间
        nowTime = 0,//视频当前时间
        
        screenShotIsStop = false,//是否退出抓屏状态
        progress_bar = null,//视频播放进度条对象
        bullet = null,//视频播放进度显示对象
        time_nowtime = null,//视频播放时间对象
        time_alltime = null,//视频总时间对象
        time_speed = null,//速度对象
        density = null,//密度切换对象
        btn_slow = null,//慢放按钮对象
        btn_play = null,//播放/暂停按钮对象
        btn_forward = null,//快进播放按钮对象
        btn_stop = null,//停止播放按钮对象
        btn_screenshot = null,//截图按钮对象
        btn_fullwin = null,//全屏按钮对象
        densityTitle = null,
        densityExplain = null,
        m_options = {
            inited : false,
            fileName : '',
            filePath : '',
            data: null,//视频播放数据
            shootTime: '',//视频拍摄时间
            playAllTime : 0,//视频总时间
            isNeedMod : true,////是否需要加载模板
            container : '#common-player-overlay',//叠加型视频模板append的dom对象id
            overlayTplUrl: '/module/imagejudge/resource-process/inc/overlayPlayer.html',//加载模板路径
            uiocx: '#OVERLAY'//OCX对象ID
        };

    var setOptions = function (Options) {
        _.extend(m_options, Options);
    };

    /** 叠加型视频初始化
     * Options 对象
     *  @data 视频播放数据
     *  @date 视频拍摄时间
     *  @isNeedMod 是否需要加载模板
     *  @container 叠加型视频模板append的dom对象  #id
     *  @overlayTplUrl 加载模板路径
     *  @uiocx OCX对象ID
     */

    var init = function (Options) {
        setOptions(Options);
        if(m_options.inited){
            playFirstFrame();
            return;
        }
        overlayPlayer.init({
            container: m_options.container,
            isNeedMod : m_options.isNeedMod,
            overlayTplUrl : m_options.overlayTplUrl,
            uiocx : m_options.uiocx
        }).then(function(){
            m_options.isNeedMod =false;
            createElements();
            bindEvents();
            playFirstFrame();
            subscribe();
        });
        m_options.inited = true;
    };
    /*
    处理PubSub发送的消息
     */
    var subscribe = function () {
        PubSub.subscribe('overlayPlayerScreenShotClose', function () {
            if (screenShotIsStop && !isPlaying) {
                isStopping = false;
                overlayPlayer.Pause(isPlaying);
                isPlaying = true;
                btn_play.addClass('active').attr("title", "暂停");
                screenShotIsStop = false;
            }
        })
    };
    /*
    创建视频播放进度条上功能按钮对象
     */
    var createElements = function () {
        progress_bar = $("#overlay_bar_inner");
        bullet = $("#overlay_progress_bullet");
        time_nowtime = $('#overlay_time_nowtime');
        time_alltime = $('#overlay_time_alltime');
        time_speed = $('#overlay_time_speed');
        density = $('.overlay_density #overlay-select-density');
        densityTitle = $('.overlay_density span');
        btn_slow = $('#overlay_btn_slow');
        btn_play = $('#overlay_btn_play');
        btn_forward = $('#overlay_btn_forward');
        btn_stop = $('#overlay_btn_stop');
        btn_screenshot = $('#overlay_btn_screenshot');
        btn_fullwin = $('#overlay_btn_fullwin');
        densityExplain = $('.densityExplain');
    };

    /** 播放成功与失败的结果回调
     * param
     *  @lResult                0 成功， 非0失败，  当成功时， 后面参数的值才有效。
     *  @ulDuration         浓缩后，视频时长。
     *  @lWidth                视频宽度。
     *  @lHeight               视频高度。
     *  @lPlayUserParam  用户调用时传入的参数。
     */
    var getVideoInfo = function (lResult, ulDuration, lWidth, lHeight, lPlayUserParam) {
        dealPlayError(lResult);
        allTime = ulDuration;
        time_alltime.text(time2str(ulDuration));
    }

    /** 播放时间回调
     * param
     *  @ulTime              当前的播放时间 。
     *  @lPlayTimeUserParam  用户调用时传入的参数。
     * Remark
     *  可以使用该回调计算播放进度  （ulTime / ulDuration(浓缩后)） * 100 %
     */
    var PlayTimeCB = function (ulTime, lPlayTimeUserParam) {
        nowTime = ulTime;
        time_nowtime.text(time2str(ulTime));
        bullet.width(Math.min(( nowTime / allTime * 100), 100) + "%");
        if (nowTime === allTime) {
            overlayPlayer.Seek(0);
        }
    };

    var pDisplayFirstFrameCB = function () {
        overlayPlayer.Pause(true);
        btn_play.removeClass('active').attr("title", "播放");
        isPlaying = false;
    }

    var bindEvents = function () {
        //播放||暂停
        btn_play.off('click').on('click', function () {
            if (isStopping) {
                //播放视频
                var ret = overlayPlayer.Play(m_options.data,  {
                    "srcduration" :  m_options.playAllTime,
                    "shootingtime": m_options.shootTime,
                    "shootingtimeformat":"YYYY-mm-DD HH:MM:SS"
                }, getVideoInfo, 1, function () {
                }, 1, PlayTimeCB);
                btn_play.addClass('active').attr("title", "暂停");
                isStopping = false;
                isPlaying = true;
                dealPlayError(ret);
            } else {
                if (!isPlaying) {
                    isStopping = false;
                    overlayPlayer.Pause(isPlaying);
                    isPlaying = true;
                    btn_play.addClass('active').attr("title", "暂停");
                } else {
                    overlayPlayer.Pause(isPlaying);
                    isPlaying = false;
                    btn_play.removeClass('active').attr("title", "播放");
                }
            }
        })

        //快放事件
        btn_forward.off('click').on('click', function () {
            if (currentSpeed === 3) {
                return;
            } else {
                currentSpeed++;
                overlayPlayer.SetSpeed(currentSpeed);

                // 更新播放速度显示
                if (currentSpeed === 0) {
                    time_speed.hide();
                } else {
                    time_speed.show().find("span").text(getSpeedStr(currentSpeed) + "x");
                }
            }

            //如果视频暂停让视频播放
            if (!btn_play.hasClass("active")) {
                btn_play.trigger('click');
            }
        })

        //慢放事件
        btn_slow.off('click').on('click', function () {
            if (currentSpeed === -3) {
                return;
            } else {
                currentSpeed--;
                overlayPlayer.SetSpeed(currentSpeed);
            }

            // 更新播放速度显示
            if (currentSpeed === 0) {
                time_speed.hide();
            } else {
                time_speed.show().find("span").text(getSpeedStr(currentSpeed) + "x");
            }

            //如果视频暂停让视频播放
            if (!btn_play.hasClass("active")) {
                btn_play.trigger('click');
            }
        })

        // 点击进度条事件
        progress_bar.off('click').on("click", function (event) {
            if (progress_bar.width() > 0) {
                var bulletRatio = (event.pageX - progress_bar.offset().left) / progress_bar.width();
                bullet.width(Math.min(bulletRatio * 100, 100) + "%");

                var time = bulletRatio * allTime;
                time = Math.min(Math.max(time, 0), allTime);
                if (isStopping) {
                    btn_play.trigger('click');
                }
                overlayPlayer.Seek(time);
            }
            if (!btn_play.hasClass("active")) {
                btn_play.trigger('click');
            }
        });

        //拖动进度条事件
        $(document).on("mousedown", "#overlay_play_point", function (event) {
            disableUpdateProgressbar = true;
            $(document).on("mousemove.common_pfs_player_point", function (event) {
                if (progress_bar.width() > 0) {

                    var bulletRatio = (event.pageX - progress_bar.offset().left) / progress_bar.width();
                    bullet.width(Math.min((bulletRatio * 100), 100) + "%");

                    var time = bulletRatio * allTime;
                    time = Math.min(Math.max(time, 0), allTime);
                    overlayPlayer.Seek(time);
                }
            });
            if (!btn_play.hasClass("active")) {
                btn_play.trigger('click');
            }
        }).on("mouseup", function (event) {
            $(document).off("mousemove.common_pfs_player_point");
            disableUpdateProgressbar = false;
        });

        //全屏事件
        btn_fullwin.off('click').on('click', function () {
            overlayPlayer.SetFullScreen(true);
        });

        //停止视频事件
        btn_stop.off('click').on('click', function () {
            time_nowtime.text("00:00:00");
            time_speed.hide();
            currentSpeed = 0;
            bullet.width("0%");
            btn_play.removeClass("active").attr("title", "播放");
            overlayPlayer.Stop();
            isPlaying = false;
            isStopping = true;
        })

        //退出全屏事件
        jQuery(document).on('keypress', function (event) {
            if (event.which === 27) {
                if (window.console) {
                    overlayPlayer.SetFullScreen(false);
                }
            }
        });

        //截图事件
        btn_screenshot.off('click').on('click', function () {
            if (isStopping) {
                notify.warn("当前视频未进行播放！");
                return;
            }
            var data = overlayPlayer.CatchPictureForBase64Code();
            if (data === '') {
                notify.error("抓图失败，请重试！");
            } else {
                if (isPlaying) {
                    overlayPlayer.Pause(isPlaying);
                    isPlaying = false;
                    btn_play.removeClass('active').attr("title", "播放");
                    screenShotIsStop = true;
                }
                screenShot.init({
                    data : data,
                    message: 'overlayPlayerScreenShotClose',
                    fileName : m_options.fileName,
                    shootTime : m_options.shootTime,
                    nowTime : nowTime
                });
            }
        })

        densityTitle.on('mouseover', function(){
            densityExplain.removeClass('hidden');
        });
        densityTitle.on('mouseout', function(){
            densityExplain.addClass('hidden');
        });
        //切换密度事件
        density.off('change').on('change', function () {
            isStopping = false;
            bullet.width('0%');
            overlayPlayer.Stop();
            overlayPlayer.SetConfig({
                "objsperfarme": parseInt(density.val()),
                "displayscale" : ((window.ocxDefaultRatio === 1) ? "original" : "stretch")
            })
            if (!isPlaying) {
                isPlaying = true;
                btn_play.addClass("active").attr("title", "暂停");
            }
            //重新设置速度
            time_speed.hide();
            currentSpeed = 0;
            //播放视频
            var ret = overlayPlayer.Play(m_options.data, {
                "srcduration" :  m_options.playAllTime,
                "shootingtime": m_options.shootTime,
                "shootingtimeformat":"YYYY-mm-DD HH:MM:SS"
            }, getVideoInfo, 1, function () {
            }, 1, PlayTimeCB);
            dealPlayError(ret);
        })
    };




    //获取视频播放数速度对应的显示速度
    var getSpeedStr = function (n) {
        var arr = ['1/8', '1/4', '1/2', '0', '2', '4', '8'];
        return  arr[n + 3];
    };

    //格式化毫秒数成为HH:MM:SS
    var time2str = function (time) {
        if (typeof time === 'string') {
            time = parseInt(time);
        }
        var h = Math.floor(time / (1000 * 60 * 60)),
            m = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60)),
            s = Math.floor(((time % (1000 * 60 * 60)) % (1000 * 60)) / 1000)
        var result = '';
        h = h < 10 ? "0" + h : h;
        m = m < 10 ? "0" + m : m;
        s = s < 10 ? "0" + s : s;
        result = h + ":" + m + ":" + s;
        return result;
    };

    //错误提示信息
    var notifyError = function (error, str, callback) {
        var str = str || '',
            callback = callback || function () {
            };
        switch (error) {
            case -1 :
                notify.error(str);
                break;
            case -1001 :
                notify.error('PFS出错导致' + str);
                break;
            case -1002 :
                notify.error('参数错误导致' + str);
                break;
            case -1003 :
                notify.error('无运动目标导致' + str);
                break;
            case -1004 :
                notify.error('运动目标无背景导致' + str);
                break;
            case -1005 :
                notify.error('获取目标错误导致' + str);
                break;
            case -1006 :
                notify.error('播放库出错导致' + str);
                break;
            case -1008 :
                notify.error('内存错误导致' + str);
                break;
            case -1009 :
                notify.error('此版本还未支持导致' + str);
                break;
            case -1010 :
                notify.error('OGL2D错误导致' + str);
                break;
            case -1011 :
                notify.error('文件导出不支持功能导致' + str);
                break;
            case -1012 :
                notify.error('AVI文件相关问题导致' + str);
                break;
            case -2000 :
                notify.error('文件导出被占用导致' + str);
                break;
            default :
                callback();
                break;
        }
    };

    //视频播放错误提示信息
    var dealPlayError = function (error) {
        if (error !== 0) {
            notifyError(error, '视频播放失败')
            PubSub.publish("overlayPlayError");
        }
    };

    //播放视频第一帧
    var playFirstFrame = function () {
        //设置当前视频个数
        overlayPlayer.SetConfig({
            "objsperfarme": parseInt(density.val()),
            "displayscale" : ((window.ocxDefaultRatio === 1) ? "original" : "stretch")
        })
        //切换播放视频时初始化工具条速度显示
        time_speed.hide();
        //播放视频
        var ret = overlayPlayer.Play(m_options.data,  {
            "srcduration" :  m_options.playAllTime,
            "shootingtime": m_options.shootTime,
            "shootingtimeformat":"YYYY-mm-DD HH:MM:SS"
        }, getVideoInfo, 1, pDisplayFirstFrameCB, 1, PlayTimeCB);
        //处理播放失败
        dealPlayError(ret);
    };
    return {
        init: init,
        OverlayPlayer:overlayPlayer
    }
})
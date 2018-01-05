/**
 * Created by Wangchaofan on 2015/1/10.
 * 叠加型视频OCX接口封装
 */
define([
    'underscore',
    'pubsub',
    'jquery',
    'mootools',
    'base.self'
], function (_, PubSub) {
    var ocx = null,
        m_options = {
            isNeedMod: true,//是否需要加载模板
            container: null,//加载模板的容器
            overlayTplUrl: '',//加载模板路径
            uiocx: ''//OCX对象ID
        };
    /*
    复制参数
     */
    var setOptions = function (Options) {
        ocx = null;
        _.extend(m_options, Options);

    }
    /*
    获取OCX对象
     */
    var getOcxObj = function () {
        if (m_options.uiocx.indexOf('#') === 0) {
            ocx = document.getElementById(m_options.uiocx.slice(1));
        } else {
            ocx = $(m_options.uiocx)[0];
        }
    }
    /*
    初始化OCX叠加性视频对象
     */
    var init = function (options) {
        var defer = $.Deferred();
        setOptions(options);
        if (m_options.isNeedMod) {
            $.when(Toolkit.loadTempl(m_options.overlayTplUrl)).done(function (tpl) {
                $(tpl).appendTo(m_options.container);
                getOcxObj();
                bindEvents();
                defer.resolve();
            });
        } else {
            getOcxObj();
            bindEvents();
            defer.resolve();
        }
        return defer.promise();
    }
    /** 开始播放
     * param
     *  @pzURL PCC输出的所有目标对象Json格式，参考备注Json(2)。
     *  @pzExParam Json格式的扩展参数，方便以后扩展，参考备注Json(3)。
     *  @pPlayCB SDK本次播放成功与失败的结果反馈, 参考备注Callback(1)。
     *  @lPlayUserParam 用户参数，PlayCB()会传给用户。
     *  @pDisplayFirstFrameCB 显示第一帧画面回调，参考备注Callback(2)。
     *  @lDisplayFirstFrameUserParam 用户参数，DisplayFirstFrameCB()会传给用户 。
     *  @pPlayTimeCB 播放时间回调，参考备注Callback(3)。
     *  @lPlayTimeUserParam 用户参数， PlayTimeCB()会传给用户。
     *  @pPlayObjThumbnailCB 当前播放的运动目标缩略图回调，仅在Config中"enableplayobjthumbnail":true时，才会触发回调， 参考备注Callback(4)。
     *  @lPlayObjThumbnailUserParam 用户参数，PlayObjThumbnailCB()会传给用户。
     * remark
     *  与Stop成对使用。
     *  如果用户在开始新的Play时，未Stop上次的播放，则Play会自动停止上次的播放且开始本次播放。
     *  如果Play直接返回错误，则不会触发任何回调
     */
    var Play = function (pzURL, pzExParam, pPlayCB, lPlayUserParam, pDisplayFirstFrameCB, lDisplayFirstFrameUserParam, pPlayTimeCB, lPlayTimeUserParam, pPlayObjThumbnailCB, lPlayObjThumbnailUserParam) {
        var pzExParam = pzExParam !== undefined ? JSON.stringify(pzExParam) : '',
            pPlayCB = pPlayCB !== undefined ? pPlayCB : function () {
            },
            lPlayUserParam = lPlayUserParam !== undefined ? lPlayUserParam : 1,
            pDisplayFirstFrameCB = pDisplayFirstFrameCB !== undefined ? pDisplayFirstFrameCB : function () {
            },
            lDisplayFirstFrameUserParam = lDisplayFirstFrameUserParam !== undefined ? lDisplayFirstFrameUserParam : 1,
            pPlayTimeCB = pPlayTimeCB !== undefined ? pPlayTimeCB : function () {
            },
            lPlayTimeUserParam = lPlayTimeUserParam !== undefined ? lPlayTimeUserParam : 1,
            pPlayObjThumbnailCB = pPlayObjThumbnailCB !== undefined ? pPlayObjThumbnailCB : function () {
            },
            lPlayObjThumbnailUserParam = lPlayObjThumbnailUserParam !== undefined ? lPlayObjThumbnailUserParam : 1;
        var json_str = JSON.stringify(pzURL);
        var result = ocx.Play(json_str, pzExParam, pPlayCB, lPlayUserParam, pDisplayFirstFrameCB, lDisplayFirstFrameUserParam, pPlayTimeCB, lPlayTimeUserParam, pPlayObjThumbnailCB, lPlayObjThumbnailUserParam)
        return result;
    };
    /** 停止播放
     * remark
     * 停止播放不会改变config的配置信息，新的播放还会继续使用上一次的配置信息，除非你再次调用SetConfig.
     */
    var Stop = function () {
        var result = ocx.Stop();
        return (result === 0);
    };
    /** 暂停
     * param
     *  @bPause TRUE 暂停， FALSE 继续
     * remark
     *   bPause为FALSE时，也能恢复因Step触发的暂停而开始正常播放。
     */
    var Pause = function (bPause) {
        var result = ocx.Pause(bPause);
        return (result === 0);
    };
    /** 单帧步进
     * param
     *  @bNext TRUE下一帧， FALSE 上一帧。
     * remark
     *   会触发播放为暂停状态, 可使用Pause(FALSE)，恢复播放。
     */
    var Step = function (bNext) {
        var result = ocx.Step(bNext);
        return (result === 0);
    };
    /** 抓图并输出到本地文件
     * param
     *  @pzPath 文件全（绝对）路径
     * remark
     *  视频截图并保存到用户指定的文件中。
     *  仅支持JPEG。
     */
    var CatchPictureForFile = function (pzPath) {
        var result = ocx.CatchPictureForFile(pzPath);
        return (result === 0)
    };
    /** 抓图并输出为base64编码
     * param
     *  @lType 图片格式，bmp = 1,  gif=2,  jpg=3,  png=4,  建议使用jpg格式，速度快、字节少、且质量高。
     *  @lWidth  图片宽
     *  @lHeight 图片高
     * remark
     *  返回值图片的base64编码，为""时，表示截图失败.
     *  param lWidth&lHeight说明如下
     *   lWidth>0 且lHeight<=0时，lWidth取有效值（0<lWidth<4则lWidth=4； lWidth>3840则lWidth=3840），根据width按视频原始比例自适应高度。
     *   lWidth<=0且lHeight>0 时，lheight取有效值（0<lHeight<4则lHeight=4； lHeight>2160则lHeight=2160），根据height按视频原始比例自适应宽度。
     *   lWidth>0 且lHeight>0 时，lWidth取有效值，lHeight取有效值，按有效宽高取图。
     *   lWidth=0 且lHeight=0 时，原始大小。
     *   lWidth<0 且lHeight<0 时, 自动压缩比例。
     */
    var CatchPictureForBase64Code = function (lType, lWidth, lHeight) {
        var lType = lType || 3,
            lWidth = lWidth || 0,
            lHeight = lHeight || 0;
        return  ocx.CatchPictureForBase64Code(lType, lWidth, lHeight);
    };
    var SetConfig = function (config) {
        var result = ocx.SetConfig(JSON.stringify(config));
        return (result === 0)
    };
    /** 获取过滤信息  -  预留暂不使用
     * remark
     * 返回Json格式的当前过滤条件信息
     */
    var GetFilter = function () {
        var result = ocx.GetFilter();
        return (result === 0);
    };
    /** 设置过滤条件信息  -  预留暂不使用
     * param
     *  @pzFilter Json格式
     * remark
     *  pzFilter为""时，表示取消之前所有的过滤条件
     *  如果Json中未涉及其他条件选项时，将不该变其他条件的设置。
     *  config ={
     *      "objsperfarme"  : 5
     *  }
     */
    var SetFilter = function (pzFilter) {
        var result = ocx.SetFilter(pzFilter);
        return (result === 0);
    };
    /** 设置播放速度
     * param
     *  @lSpeedMode 速度模式，[-4, 4]    -4：慢16倍, -3：慢8倍， -2：慢4倍， -1：慢2倍， 0：正常， 1：快2倍， 2：快4倍， 3：快8倍， 4：快16倍
     */
    var SetSpeed = function (lSpeedMode) {
        var result = ocx.SetSpeed(lSpeedMode);
        return (result === 0);
    };
    var GetSpeed = function () {
        return ocx.GetSpeed();
    };
    /** 定位
     * param
     *  @ulTime 定位时间,范围, [0， 浓缩duration), 即   0<=ulTime< 浓缩duration 。
     */
    var Seek = function (ulTime) {
        var result = ocx.Seek(ulTime);
        return (result === 0);
    };
    /** 全屏画面/正常画面
     * param
     *  @bFullScreen TRUE 全屏， FALSE 恢复正常
     */
    var SetFullScreen = function (bFullScreen) {
        var result = ocx.SetFullScreen(bFullScreen);
        return (result === 0);
    };
    var setFileUrl = function () {
        ocx.setFileUrl(true);
    };
    /**
     * 事件绑定
     **/
    var bindEvents = function () {
        /** 双击鼠标左键按下事件
         * param
         *  @ulFlag, 指定了不同的虚拟键是否被按下。这个参数可以是下列值之一：
         *    · 0x0008 如果CTRL键被按下  ，则设置此位。
         *    · 0x0001 如果鼠标左键被按下，则设置此位。
         *    · 0x0010 如果鼠标中键被按下，则设置此位。
         *    · 0x0002 如果鼠标右键被按下，则设置此位。
         *    · 0x0004 如果SHIFT键被按下 ，则设置此位。
         *  @x  点x坐标。
         *  @y  点y坐标。
         *  @lObjID 如果双击在运动目标上，则值>=0, 否则为 -1， 当值>=0时，后面的参数才有效。
         *  @ulStartTime 运动目标在原视频中的开始时间。
         *  @ulEndTime  运动目标在原视频中的结束时间。
         *  @brReserved  保留，以便后续扩展使用。
         */
        var addEvent = function (obj, name, func) {
            if (window.attachEvent) {

                obj.attachEvent('on' + name, func);

            } else {

                obj.addEventListener(name, func, false);
            }
        };

        addEvent(ocx, 'LButtonDblClick', function (ulFlag, x, y, lObjID, ulStartTime, ulEndTime, brReserved) {
            if (lObjID > 0 || lObjID === 0) {
                PubSub.publish('overlayLButtonDblClick', {
                    startTime: ulStartTime,
                    endTime: ulEndTime
                })
            }
        });
        addEvent(ocx, 'SelectObjChanged', function (lObjID, ulStartTime, ulEndTime, brReserved) {
            //暂时处理成这样，全屏放大时暂停延迟属于ocx性能问题
          //  PubSub.publish('SelectObjChanged', lObjID);
            if (lObjID === -1) {
                if ($('#overlay_btn_play').attr('title') !== '暂停') {
                    $('#overlay_btn_play').trigger('click');
                }
            } else {
                if ($('#overlay_btn_play').attr('title') === '暂停') {
                    $('#overlay_btn_play').trigger('click');
                }
            }
        });
    }
    return {
        init: init,
        Play: Play,
        Stop: Stop,
        Pause: Pause,
        Step: Step,
        CatchPictureForFile: CatchPictureForFile,
        CatchPictureForBase64Code: CatchPictureForBase64Code,
        SetConfig: SetConfig,
        GetFilter: GetFilter,
        SetFilter: SetFilter,
        SetSpeed: SetSpeed,
        GetSpeed: GetSpeed,
        Seek: Seek,
        SetFullScreen: SetFullScreen,
        setFileUrl: setFileUrl,
        bindEvents: bindEvents
    }
})
/**
 * [图像研判视频截屏]
 * @author 王超凡
 * @date   2015-03-30
 * @param  {[object]}   options[面板可配置参数]
 */
define([
    'pubsub',
    'underscore',
    'permission',
    'base.self'
], function (PubSub, _, permission) {
    var m_options = {
        data: '',    //截图数据
        message: '', //截图窗口关闭消息
        fileName: '', //文件名
        filePath: '', //文件路径
        catchTime: 0,  //抓图时间
        shootTime: ''   //拍摄时间
    };
    var screenshotParams = {};
    var init = function (options) {
        _.extend(m_options, options);
        screenShot();
    };

    var screenShot = function () {
            if ($("#layerbox").length > 0) {
                $("#layerbox,.dialogbox").show();
            } else {
                var html =
                    '<div class="dialogbox">' +
                    '<iframe id="vIframe" src="about:blank" class="dialog" allowTransparency="true"></iframe>' +
                    '<div class="dialog">' +
                    '   <a href="javascript: void(0)"  title="关闭" class="close"></a>' +
                    '   <div class="dialog_title">' +
                    '       <h6>抓图预览</h6>' +
                    '   </div>' +
                    '   <div class="dialog_body">' +
                    /*'        <span>保存成功</span>' +*/
                    '        <img src="" id="screenshot" data-name="">' +
                    '   </div>' +
                    '   <div class="dialog_foot">' +
                    '        <a class="permission permission-tobaselib" href="#" title="入库" class="" data-action="toMediaLib">入库</a>' +
                    '        <a class="permission permission-import" href="#" title="保存" data-action="saveScreenshot">保存</a>' +
                    '   </div>' +
                    '</div>' +
                    '</div>' +
                    '<div class="dialog-layer" id="layerbox"><iframe src="about:blank"></iframe></div>';

                $(html).appendTo("body").show()
                    .find(".close").on("click", function (event) {
                        event.preventDefault();
                        event.stopImmediatePropagation();
                        PubSub.publish(m_options.message);
                        $("#layerbox,.dialogbox").hide();
                        $("#screenshot").attr({
                            "src": ""
                        });
                    }).end().find('[data-action="toMediaLib"]').on("click", function () {
                        $.ajax({
                            url: "/service/pcm/add_screenshot_to_view",
                            data: {
                                fileName: m_options.fileName,
                                filePath: screenshotParams.playerSnap,
                                catchTime: screenshotParams.nowtime,
                                shootTime: Toolkit.str2mills(m_options.shootTime)
                            },
                            method: "post",
                            success: function (data) {
                                if (data && data.code && data.code === 200) {
                                    // 视频抓图入新的视图库 by songxj 2016/04/11
                                    require(["pvbEnterLib"], function(EnterLib) {
                                        var imgObj = {
                                            type: "img",
                                            filePath: data.data.url
                                        };
                                        EnterLib.init(imgObj);
                                    });
                                    logDict.insertMedialog('m6', m_options.fileName + ' 截图入视图库'); // 截图入库日志
                                } else {
                                    notify.error("保存失败，请重试！");
                                }
                            },
                            error: function (xhr, textStatus, errorThrown) {
                                // 如果http状态为200，说明后台返回数据成功，但数据格式错误
                                if (xhr.status === 200) {
                                    notify.warn('保存失败! 返回数据格式错误');
                                }
                                // 其它状态为HTTP错误状态
                                else {
                                    (xhr.status !== 0) && notify.warn('保存失败! HTTP状态码: ' + xhr.status);
                                }
                            }
                        });
                    }).end().find('[data-action="saveScreenshot"]').on("click", function () {
                        jQuery.ajax({
                            url: '/service/pcm/add_screenshot',
                            type: 'post',
                            dataType: 'json',
                            data: {
                                fileName: m_options.fileName,
                                filePath: screenshotParams.playerSnap,
                                catchTime: screenshotParams.nowtime,
                                shootTime: Toolkit.str2mills(m_options.shootTime)
                            },
                            success: function (data) {
                                if (data && data.code && data.code === 200) {
                                    notify.success("保存到云空间成功！");
                                    // 关闭截屏
                                    $(".dialogbox").find(".close").trigger("click");
                                } else {
                                    notify.error("保存失败，请重试！");
                                }
                            },
                            error: function (xhr, textStatus, errorThrown) {
                                // 如果http状态为200，说明后台返回数据成功，但数据格式错误
                                if (xhr.status === 200) {
                                    notify.warn('保存失败! 返回数据格式错误');
                                }
                                // 其它状态为HTTP错误状态
                                else {
                                    (xhr.status !== 0) && notify.warn('保存失败! HTTP状态码: ' + xhr.status);
                                }
                            }
                        });
                    });

                // 权限
                permission.reShow();
            }

            var data = m_options.data;

            screenshotParams.nowtime = m_options.nowTime;
            screenshotParams.screenShotSrc = "data:image/jpg;base64," + data;
            screenshotParams.base64 = data;
            screenshotParams.playerSnap = data;

            var img = new Image();
            img.onload = function () {
                var cSize = {
                    width: $(".dialogbox .dialog_body").width(),
                    height: $(".dialogbox .dialog_body").height()
                };

                /*显示抓图图片*/
                $("#screenshot").attr({
                    "src": screenshotParams.screenShotSrc
                }).css({
                    width: cSize.width,
                    height: cSize.height,
                    top: 0,
                    left: 0
                });
            };
            img.src = screenshotParams.screenShotSrc;
    }

    return{
        init: init
    }
})

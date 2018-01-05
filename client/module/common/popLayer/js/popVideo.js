/**
 *
 * @authors lrxia (lrxia@netposa.com)
 * @date    2015/7/8
 * @version $
 */
define(['ajaxModel','/module/common/popLayer/js/download.js','/module/common/popLayer/js/mplayer.js', 'handlebars','/module/common/popLayer/js/my-handlebar.js','/module/common/js/player2.js'], function (ajaxModule,downloadLocal,MPLAYER) {
    var SCOPE = {
        dContext:{},
        templateHtml: null, // 缓存模板html
        pop_tpl_url: '/module/common/popLayer/inc/d_video_w.html',
        fileType: 1,
        videoType: -1, // 视频类型： 1:PFS 2:历史录像
        isDownload: true, // 默认有下载
        isToViewLib: true, // 默认有入库
        isDeleteVideo: false, // 默认没有删除
        showRightDetailInfo: true, // 是否显示右侧信息
        mPlayer: null
    };
    var popVideoEvent ={
        init:function(){
            var _t =this;
            if (SCOPE.videoType === 1) { // PFS视频
                $(".bg-wrap").on('click', '.down-load',_t.downLoadPFSClick);/*下载PFS*/
                $(".bg-wrap").on('click','a.save-to-repository',_t.storagePFSClick);/*入库*/
                $(".bg-wrap").on('click','a.del',_t.delPFSVideoClick);/*删除*/
            } else { // 历史录像
                $(".bg-wrap").on('click', '.down-load',_t.downLoadHistoryClick);/*下载历史录像*/
            }

            $(".bg-wrap").on('click', '.left-bar', _t.prevClick); /*上一页*/
            $(".bg-wrap").on('click', '.right-bar', _t.nextClick); /*下一页*/
            $(".bg-wrap").on('click', '.bg-close',_t.bgCloseClick);/*关闭弹框*/
            $(".bg-wrap").on('click','.s-bar',_t.sBarClick);
        },
        prevClick: function() { // 上一页
            SCOPE.custom.currentIndex--;
            SCOPE.custom.toggleVideo(SCOPE.custom.currentIndex, function(data) {
                if (data) {
                    popVideo.initVideo(data);
                } else {
                    SCOPE.custom.currentIndex++;
                    notify.info("已经是第一个可查看的资源");
                }
            });
        },
        nextClick: function() { // 下一页
            SCOPE.custom.currentIndex++;
            SCOPE.custom.toggleVideo(SCOPE.custom.currentIndex, function(data) {
                if (data) {
                    popVideo.initVideo(data);
                } else {
                    SCOPE.custom.currentIndex--;
                    notify.info("已经是最后一个可查看的资源了!");
                }
            });
        },
        downLoadPFSClick: function() { // PFS视频下载
            var url = "/service/pcm/get_download_file?id="+SCOPE.dContext.baseInfo.videoId;/*生成下载路径*/

            /*弹出下载框*/
            popVideoEvent.downloadPFSDialog(url);
        },
        downloadPFSDialog: function(url, callback) {
            var insertDom = jQuery('<iframe id="forDownload" src=' + url + '></iframe>');
            if (jQuery('#forDownload').length < 1) {
                jQuery('body').append(insertDom);
            } else {
                jQuery('#forDownload').attr("src", url);
            }
        },
        downLoadHistoryClick: function(e) { // 历史录像下载
            var opt = {
                beginTime: (Toolkit.mills2datetime(SCOPE.dContext.baseInfo.beginTime)) + ".000",
                endTime: (Toolkit.mills2datetime(SCOPE.dContext.baseInfo.endTime)) + ".000",
                ip: MPLAYER.cameraData.ip,
                passwd: MPLAYER.cameraData.password,
                path: MPLAYER.cameraData.path,
                port: MPLAYER.cameraData.port,
                type: 2,
                user: MPLAYER.cameraData.username,
                vodType: MPLAYER.cameraData.videos[0][2]
            };

            downloadLocal(opt, SCOPE.dContext.baseInfo.fileName, SCOPE.mPlayer.player.playerObj);
        },
        bgCloseClick:function(){
            // 执行回调函数
            SCOPE.callback && SCOPE.callback();
            //隐藏导航,bug[37719], add by zhangyu, 2015.10.25
            window.top.showHideNav("show");
            $('.bg-wrap').hide();
            //关闭弹出层时让视频停止播放
            $(".video-block .stop").trigger("click");
            //删除data-flag属性，避免关闭详情页时还提示“当前已经是第一个可查看资源”
            $(".bg-content").removeAttr("data-flag");
        },
        sBarClick:function(){
            var leftContent = $('.bg-content');
            var rightContent = $('.bg-sider');
            $(this).hasClass('active') ? $(this).removeClass('active') : $(this).addClass('active');
            if(leftContent.css('right') === '8px'){
                leftContent.css('right','258px');
                rightContent.css('right','0px');
            }else{
                leftContent.css('right','8px');
                rightContent.css('right','-250px');
            }
        },
        storagePFSClick: function(e) {
            var e = e || window.event,
                tar = e.target || e.srcElement;
            if (jQuery(tar).attr('data-action') === 'medialib') {
                module.medialib();
            }
            return false;
        },
        delPFSVideoClick: function(e) {
            popVideoEvent.delPFSVideo();
        },
        delPFSVideo: function() {
            var type = SCOPE.fileType - 0,
                ajaxDel,
                options = SCOPE.dContext.operatorOptions;

            ajaxDel = function() {
                return ajaxModule.postData('/service/pcm/delete_video_info', {
                    ids: SCOPE.dContext.baseInfo.videoId
                });
            };

            new ConfirmDialog({
                title: "提示",
                message: '您确定要删除视频<em style = "color:#414141;font-weight:bold">\"' + SCOPE.dContext.baseInfo.fileName + '\"</em> 吗?',
                width: 360,
                callback: function() {
                    ajaxDel().done(function(data) {
                        if (data && data.code === 200) {
                            notify.info('删除成功!');
                            // 将关闭按钮trigger
                            jQuery(".bg-close").trigger("click");
                            options && options.deleteVideo && options.deleteVideo.callback && options.deleteVideo.callback();
                            //callback && callback();
                        }
                    }).fail(function(data) {
                        notify.info('删除失败，请重试!');
                    });
                }
            });
           /* VIEW.dialog(msg, function() {
                ajaxDel().done(function(data) {
                    if (data && data.code === 200) {
                        notify.info('删除成功!');
                        callback && callback();
                        logDict.insertMedialog('m6', '删除 ' + VIEW.getTname(true)); // 删除 日志
                    }
                }).fail(function(data) {
                    notify.info('删除失败，请重试!');
                });
            });*/
        }
    };
    var OnBeforeNavigate2=function(data){
        jQuery("#input-data").val(data);
        var html="<iframe id='OnBeforeNavigate2' etype='input' eid='input-data' src='about:blank' style='width:0px;height:0px;'></iframe>";
        if(jQuery("#OnBeforeNavigate2")[0]){
            jQuery("#OnBeforeNavigate2").remove();
        }
        jQuery(document.body).append(html);
    };
    var view_tool = {
        newWindow: function(url, name, callback) {
            var myWindow = window.open("/module/iframe/?windowOpen=1&iframeUrl=" + url, name);
            callback && callback(url, myWindow);
        }
    };
    var module = {
        /**
         * @name medialib
         * @description 云管理跳转到视图库[入库]
         */
        medialib: function() {
            Cookie.dispose('data');
            window.localStorage.removeItem("dataImgToView");
            var self = this,
                filePath = SCOPE.dContext.baseInfo.filePath,
                id = typeof SCOPE.dContext.operatorOptions.toViewLib !== "undefined" ? SCOPE.dContext.operatorOptions.toViewLib.id : "",
                type = SCOPE.fileType - 0,
                shoottime = typeof SCOPE.dContext.operatorOptions.toViewLib !== "undefined" ? SCOPE.dContext.operatorOptions.toViewLib.shootTime : 0,
                structuredType = typeof SCOPE.dContext.operatorOptions.toViewLib !== "undefined" ? SCOPE.dContext.operatorOptions.toViewLib.structuredType - 0 : "",
                fileName = SCOPE.dContext.baseInfo.fileName,
                typeurl = ["", "video", "image"],
                beginTime = SCOPE.dContext.baseInfo.beginTime,
                endTime = SCOPE.dContext.baseInfo.endTime;

            var data = {
                "resourceId":'',
                "mediaPath": filePath,/*视图库图片显示src*/
                "shootTime": shoottime,
                "fileType": type + '',
                "medialibId": "",
                "structType": structuredType,
                //"base64Pic": typeof SCOPE.dContext.operatorOptions.toViewLib !== "undefined" ? SCOPE.dContext.operatorOptions.toViewLib.base64Pic : "",/*视图库保存信息的时候 会用到*/
                "fileName": fileName,
                "IsSnap":false
            };

            if(id && id!=''){
                /*云空间的时候用来获取图片base64Pi src*/
                cloudCallback();
            }else{
                openNewWindow();
            }
            function cloudCallback() {
                ajaxModule.loadData("/service/pcm/storage/file/" + id).then(function(data){
                    if (data && data.code === 200) {
                        data.cloud="cloud";
                        data.base64Pic = data.data.path;
                        openNewWindow();
                    } else {
                        notify.info('入库失败,错误码:' + data.code);
                    }
                });
            };
            function openNewWindow(){
                Cookie.write('data', JSON.stringify(data));
                window.localStorage.setItem("dataImgToView",JSON.stringify(data));
                view_tool.newWindow("/module/viewlibs/toMediaLib/update_" + typeurl[type] + "_bak.html");
            }
        }
    };
    var popVideo = {
        // 区分当前的视频类型
        judgeCurrentVideoType: function(fileNameParam) {
            if (fileNameParam && (fileNameParam.indexOf("NPFS:") === 0 || fileNameParam.indexOf("http://") === 0)) { // PFS视频播放
                // 记录当前视频类型为PFS
                SCOPE.videoType = 1;
            } else {
                SCOPE.videoType = 2;
            }
        },
        appendWarpHtml:function(option){
            if (option.popBgWarp) {
                // 若使用模块内部的UIOCX，则为非弹出式，故不显示右侧信息
                SCOPE.showRightDetailInfo = false;
                SCOPE.dContext.showRightDetailInfo = false;

                this.eleWarp = option.popBgWarp;
            } else {
                var warpHTML = '<div class="bg-wrap">' +
                    '<div class="bg-close"></div>' +
                    '<div class="inner-wrap"></div>' +
                    '</div>';
                if(!$('.bg-wrap')[0]){
                    $('body').append(warpHTML);
                    //绑定视频插件上的事件，只绑定一次
                    popVideoEvent.init();
                };

                this.eleWarp = $('.bg-wrap').find('.inner-wrap');
            }
        },
        renderNoData:function(){
            //隐藏导航,bug[37719], add by zhangyu, 2015.10.25
            //window.top.showHideNav("hide");
            $('.bg-wrap').show().find('.inner-wrap').html('<div class="loading"></div>');
        },
        initial:function(option, custom){
            var self = this;
            self.eleWarp = null;
            // 区分视频类型：PFS or 历史录像
            self.judgeCurrentVideoType(option.baseInfo.fileName);
            self.appendWarpHtml(option);
            SCOPE.custom = custom;
            self.initVideo(option);
        },
        initVideo: function(option) {
            var self = this;
            self.initOptionParams(option);
            SCOPE.callback = option.callback || jQuery.npoop; //关闭后的回调函数
            self.renderNoData();
            self.getPopHtml();
        },
        initIconsBarIsShow: function() { // 初始化下方图标条的显示或隐藏
            /* if (SCOPE.dContext.popBgWarp) {
                jQuery(".content-controll-bar").css("visibility", "hidden");
            } else {
                jQuery(".content-controll-bar").css("visibility", "visible");
            }*/
            if (SCOPE.dContext.popBgWarp) {
                jQuery(".bg-content .main-content.video-content").css({
                    top: 0,
                    bottom: "60px",
                    left: 0,
                    right: 0
                });
                jQuery(".content-controll-bar").css("display", "none");
                $(".bg-wrap").hide();
                // 隐藏 右侧信息
                $(".bg-sider,.s-bar").hide();
            } else {
                jQuery(".content-controll-bar").css("display", "inline-block");
                $(".bg-wrap").show();
                // 显示 右侧信息
                $(".bg-sider,.s-bar").show();
                // 初始化下方按钮是否显示
                self.initIconsIsShow();
            }
        },
        initPrevAndNextIconIsShow: function(custom) { // 初始化上下翻页的图标是否显示
            if (custom) {
                $(".left-bar,.right-bar").show();
            } else { // 未定义，只有一个视频，故隐藏上下图标
                $(".left-bar,.right-bar").hide();
            }
        },
        initOptionParams: function(option) {
            var self = this,
                fileNameParam = option.baseInfo.fileName,
                fileName,
                fileFormat,
                operatorOptions = option.operatorOptions,
                deleteVideo;

            SCOPE.dContext = option;

            // 若是PFS视频，则视频格式直接从后缀名中获取,且从中截取视频名称
            if (SCOPE.videoType === 1) { // PFS视频播放
                // 记录当前视频类型为PFS
                SCOPE.videoType = 1;
                // 先将fileName存起来，供PFS播放时使用
                SCOPE.dContext.baseInfo.filePath = fileNameParam;
                // 视频格式
                fileFormat = fileNameParam.substring(fileNameParam.lastIndexOf(".") + 1);
                SCOPE.dContext.baseInfo.fileFormat = fileFormat ? fileFormat : "";
                // 视频名称
                fileName = fileNameParam.substring(fileNameParam.lastIndexOf("/") + 1, fileNameParam.lastIndexOf("."));
                SCOPE.dContext.baseInfo.fileName = fileName ? fileName : "";

                if (operatorOptions) {
                    // 是否显示入库, 默认显示入库
                    SCOPE.dContext.operatorOptions.isToViewLib = typeof option.operatorOptions.isToViewLib !== "undefined" ? option.operatorOptions.isToViewLib : SCOPE.isToViewLib;
                    // 是否显示删除,默认不显示删除
                    deleteVideo = SCOPE.dContext.operatorOptions.deleteVideo;
                    if (deleteVideo) {
                        deleteVideo.isDeleteVideo = typeof deleteVideo.isDeleteVideo !== "undefined" ? deleteVideo.isDeleteVideo : SCOPE.isDeleteVideo;
                        deleteVideo.callback = typeof deleteVideo.callback !== "undefined" ? deleteVideo.callback : jQuery.noop();
                    }
                }

            } else {
                // 记录当前视频类型为历史录像
                SCOPE.videoType = 2;
                // 将入库隐藏
                SCOPE.dContext.operatorOptions && (SCOPE.dContext.operatorOptions.isToViewLib = false);
                // 将删除隐藏
                SCOPE.dContext.operatorOptions && (SCOPE.dContext.operatorOptions.deleteVideo = undefined);
            }

            // 是否显示右侧信息，默认不显示
            SCOPE.dContext.showRightDetailInfo = typeof option.showRightDetailInfo !== "undefined" ? option.showRightDetailInfo : SCOPE.showRightDetailInfo;

            // 是否显示下载，默认下载
            if (operatorOptions) {
                SCOPE.dContext.operatorOptions.isDownload = typeof option.operatorOptions.isDownload !== "undefined" ? option.operatorOptions.isDownload : SCOPE.isDownload;
            }
        },
        getPopHtml:function(){
            var _t = this;
            // 确保模板只被请求一次
            if (SCOPE.templateHtml) {
                _t.appendHtml();
            } else {
                jQuery.ajax({
                    type: "get",
                    url: SCOPE.pop_tpl_url,
                    success: function(html) {
                        SCOPE.templateHtml = html;
                        _t.appendHtml();
                    }
                });
            }
        },
        appendHtml:function(){
            var _t = this;
            _t.eleWarp.html(Handlebars.compile(SCOPE.templateHtml)(SCOPE.dContext));
            _t.eleWarp.find(".video-content").attr({
                "data-fileType":SCOPE.fileType,
                "data-index":SCOPE.dContext.curListIndex,
                "data-structureName":$(".content .overview .list-content dd").filter("[data-index='" + SCOPE.dContext.curListIndex + "']").find(".l-name a").attr("data-filename")
            });
            SCOPE.videoContent = _t.eleWarp.find(".video-content")[0];
            // 初始化下方配置项条的显示或隐藏(根据是否弹出)
            _t.initIconsBarIsShow();
            // 初始化上下翻页图标的显示或隐藏
            _t.initPrevAndNextIconIsShow(SCOPE.custom);

            _t.makeUp();

        },
        makeUp:function(){
            var _t = this;
            var json = SCOPE.dContext.baseInfo;
            if (json && json!= null) {
                if (json.sourceType + '' === '1') {
                    json.hasVideo = true;
                } else {
                    json.hasVideo = false;
                }
                _t.playCameras();
            } else {
                _t.renderNoData();
            }
        },
        playCameras: function() {
            /**
             * 初始化视频播放器，并播放
             * */

            if (SCOPE.mPlayer === null) {
                SCOPE.mPlayer = MPLAYER;
            }

            var playParm = {
                videoType: SCOPE.videoType,
                begintime:SCOPE.dContext.baseInfo.beginTime,
                endtime:SCOPE.dContext.baseInfo.endTime,
                cameraId:SCOPE.dContext.baseInfo.cameraId,
                fileName:SCOPE.dContext.baseInfo.filePath
            };
            SCOPE.mPlayer.initPlayer(playParm);
        }
    };

   return popVideo;
});

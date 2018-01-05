/**
 *
 * @authors lrxia (lrxia@netposa.com)
 * @date    2015/7/6
 * @version $
 */

define(['ajaxModel','/module/common/popLayer/js/set_center.js', 'handlebars','/module/common/popLayer/js/my-handlebar.js','permission'], function (ajaxModule,SETCENTER) {
    var SCOPE = {
        dContext:{},
        pop_tpl_url: '/module/common/popLayer/inc/d-pic.html', // 模板url
        fileType: '2', // 1:视频 2:图片
        cloudboxPostUrl: '/service/pcm/add_screenshot', // 云空间url
        cloudboxMethod: 'post', // 云空间请求方式
        showRightDetailInfo: true,
        oneToOneIcon: true, // 1:1图标 默认显示
        toViewLibIcon: true, // 入库图标 默认显示
        imgProcessIcon: true, // 图像处理图标 默认显示
        imgRotateIcon: false, // 图像旋转 默认隐藏
        horizontalTurnIcon: false, // 水平翻转 默认隐藏
        verticalTurnIcon: false // 垂直翻转 默认隐藏
    };
    var popImgEvent = {
        init:function(){
            var _t =this;
            $(".bg-wrap").on('click', '.left-bar', _t.prevClick); /*上一页*/
            $(".bg-wrap").on('click', '.right-bar', _t.nextClick); /*下一页*/
            $(".bg-wrap").on('click','.elel',_t.elelClick);/*1:1*/
            $(".bg-wrap").on('click','.viewer-tool-rotate',_t.rotateRight); /*旋转*/
            $(".bg-wrap").on('click','.viewer-tool-horizontalturn',_t.horizontalTurn); /*水平翻转*/
            $(".bg-wrap").on('click','.viewer-tool-verticalturn',_t.verticalTurn); /*垂直翻转*/
            $(".bg-wrap").on('click','a.permission',_t.storageClick);/*入库*/
            $(".bg-wrap").on('click', 'a.download, .down-load',_t.downLoadClick);/*下载*/
            $(".bg-wrap").on('click','a.save-to-cloud',_t.saveTocloudClick)/*保存到云空间*/
            $(".bg-wrap").on('click','a.image-analysis',_t.savePicAnalysisClick)/*图像研判*/
            $(".bg-wrap").on('click', '.bg-close',_t.bgCloseClick);/*关闭弹框*/
            $(".bg-wrap").on('click','.close-eyes',function(){ $(".eyes").hide();});
            $(".bg-wrap").on('click','.s-bar',_t.sBarClick);
            /*图片随浏览器窗口自适应*/
            $(window).bind('resize', _t.resizeFun);
        },
        resizeFun: function() {
            if ($(".bg-wrap").is(":visible")) {
                SETCENTER.picReset(SCOPE.dContext.baseInfo.filePath);
            }
        },
        elelClick:function(){
            var state = SETCENTER.state;
            state.width = state._originWidth;
            state.height = state._originHeight;
            state.posX = ($(".pic-wrap").width()-state.width)/2;
            state.posY = ($(".pic-wrap").height()-state.height)/2;
            SETCENTER.refreshTransform();
            $(".eyes").hide();
            $(".outline").css({
                "top":0,
                "left":0,
                "width":235+"px",
                "height":175+"px"
            })
        },
        storageClick: function(e) {
            var e = e || window.event,
                tar = e.target || e.srcElement;
            if (jQuery(tar).attr('data-action') === 'medialib') {
                // 图片入新的视图库 by songxj 2016/04/07
                require(["pvbEnterLib"], function(EnterLib) {
                    var imgObj = {
                        type: "img",
                        fileFormat: SCOPE.dContext.baseInfo.fileFormat,
                        filePath: SCOPE.dContext.baseInfo.filePath,
                        resourceObj: {
                            fileName: SCOPE.dContext.baseInfo.fileName,
                            fileDate: SCOPE.dContext.baseInfo.shoottime,
                            fileDesc: SCOPE.dContext.baseInfo.remark
                        }
                    };
                    EnterLib.init(imgObj);
                });
            }
            return false;
        },
        downLoadClick:function(){
            /*弹出下载框*/
            downloadDialog(SCOPE.dContext.operatorOptions.downloadUrl);

            function downloadDialog(url, callback) {
                var insertDom = jQuery('<iframe id="forDownload" src=' + url + '></iframe>');
                if ($('#forDownload').length < 1) {
                    $('body').append(insertDom);
                } else {
                    $('#forDownload').attr("src", url);
                }
            }
        },
        prevClick: function() { // 上一页
            SCOPE.custom.currentIndex--;
            SCOPE.custom.toggleImg(SCOPE.custom.currentIndex, function(data) {
                if (data) {
                    popImg.initPic(data);
                } else {
                    SCOPE.custom.currentIndex++;
                    notify.info("已经是第一个可查看的资源");
                }
            });
        },
        nextClick: function() { // 下一页
            SCOPE.custom.currentIndex++;
            SCOPE.custom.toggleImg(SCOPE.custom.currentIndex, function(data) {
                if (data) {
                    popImg.initPic(data);
                } else {
                    SCOPE.custom.currentIndex--;
                    notify.info("已经是最后一个可查看的资源了!");
                }
            });
        },
        rotateRight: function() { // 右旋转
            var state = SETCENTER.state;
            state.rotate += state.horizontal * state.vertical * 90;
            SETCENTER.refreshTransform();
        },
        horizontalTurn: function() { // 水平翻转
            var state = SETCENTER.state;
            state.horizontal *= -1;
            SETCENTER.refreshTransform();
        },
        verticalTurn: function() { // 垂直翻转
            var state = SETCENTER.state;
            state.vertical *= -1;
            SETCENTER.refreshTransform();
        },
        saveTocloudClick:function(){
            jQuery.ajax({
                url: SCOPE.cloudboxPostUrl,
                type: SCOPE.cloudboxMethod,
                dataType: 'json',
                data: SCOPE.dContext.operatorOptions.saveToCloudbox,
                success: function(res) {
                    if (res && res.code === 200) {
                        notify.success('图片上传成功！');
                       } else {
                        notify.warn('图片上传失败！');
                    }
                }
            });
        },
        savePicAnalysisClick:function(){
            //进入图像研判
            analysis.imagesjude();
        },
        bgCloseClick:function() {
            var self = this;
            //解绑resize函数
            //$(window).unbind("resize", self.resizeFun);
            //add buy leon.z 执行回调函数
            SCOPE.callback && SCOPE.callback();
            //隐藏导航,bug[37719], add by zhangyu, 2015.10.25
            window.top.showHideNav("show");
            //隐藏弹出层
            $('.pop-img-iframe,.bg-wrap').fadeOut();
            //删除data-flag属性，避免关闭详情页时还提示“当前已经是第一个可查看资源”
            $(".bg-content").removeAttr("data-flag");
            //云台预置位图片查看时，关闭图片插件需要显示云台控制面板
            require(["pubsub"], function(PubSub) {
                PubSub.publishSync("showPtzPanel");
            });
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
           SETCENTER.picReset(SCOPE.dContext.baseInfo.filePath);
        }

    };
    var view_tool = {
        newWindow: function(url, name, callback) {
            var myWindow = window.open("/module/iframe/?windowOpen=1&iframeUrl=" + url, name);
            callback && callback(url, myWindow);
        }
    };

    var _ajaxModule = {
        loadDetails:function(url){
            var msg = '<div class="loading"></div>',
                custom = {
                    beforeSend:function(){
                        //隐藏导航,bug[37719], add by zhangyu, 2015.10.25
                        window.top.showHideNav("hide");
                        $('.pop-img-iframe').fadeIn();
                        $('.bg-wrap').fadeIn().find('.inner-wrap').html(msg);
                    }
                };
            return ajaxModule.getData(url,undefined,custom);
        },
        loadData: function(url, parentNode) {
            var msg = "<div class='no-data' style='text-align:center;padding:30px;'><i class='loading-img'></i>正在加载…</div>",
                custom = {
                    beforeSend:function(){
                        if (parentNode) {
                            parentNode.html(msg);
                        }
                    }
                };
            return ajaxModule.getData(url,undefined,custom);
        },
        /*
        * 提交数据
        */
        postData: function(url, data) {
            return ajaxModule.postData(url,data);
        }
    };
    /**
     * [analysis 扩展李瑞霞接口，添加图像研判功能]
     * @type {function}
     * update by leon.z
     * 2015-11-09
     */
    var analysis = {
        createRandom:function(from,to){
            var arr=[];
            var json={};
            while(arr.length<1)
            {
                //产生单个随机数
                var ranNum=Math.ceil(Math.random()*(to-from))+from;
                //通过判断json对象的索引值是否存在 来标记 是否重复
                if(!json[ranNum])
                {
                    json[ranNum]=1;
                    arr.push(ranNum);
                }

            }
            return arr;
        },
        /**
         * @name imagesjude
         * @description 云管理跳转到图像研判图像处理
         */
        imagesjude: function() {
            var self = this,
                fileName = SCOPE.dContext.baseInfo.fileName,
                fileType = SCOPE.fileType - 0,
                filePath = SCOPE.dContext.baseInfo.filePath,
                localPath = SCOPE.dContext.operatorOptions.toImgJudge ? SCOPE.dContext.operatorOptions.toImgJudge.localPath : null;
            jQuery.ajax({
                url: SCOPE.cloudboxPostUrl,
                type: SCOPE.cloudboxMethod,
                dataType: 'json',
                data: SCOPE.dContext.operatorOptions.saveToCloudbox,
                success: function(res) {
                    if (res && res.code === 200) {
                        var id = res.data.cid;
                        var data = {
                            clouds: JSON.stringify({
                                cloud: [{
                                    id: id,
                                    type: fileType,
                                    parentId: 1
                                }]
                            })
                        };
                        ajaxModule.postData('/service/pia/resource_cloud', data).then(function(data) {
                            if (data && data.code === 200) {
                                // 存成功后重新拿取后端的 id
                                _ajaxModule.loadData("/service/pia/resource_file?cid=" + id).then(function(res) {
                                    var passData = {
                                        id: res.data.id,
                                        cid: id,
                                        filePath: filePath,
                                        localPath: localPath || filePath,
                                        fileName: fileName,
                                        fileType: fileType,
                                        cloud: "cloud"
                                    };
                                    Cookie.write('imagejudgeData', JSON.stringify(passData));
                                    view_tool.newWindow('/module/imagejudge/resource-process/index.html?&type=1', ("singlePicProcess" + (self.createRandom(0, 50)[0])));
                                    logDict.insertMedialog('m6', fileName + ' 在图像研判模块进行图像处理'); // 到图像研判 日志
                                });
                            }
                        })
                    } else {
                        notify.warn('图片上传失败！');
                    }
                }
            });

        }

    };
    var popImg = {
        initial: function(option, custom){
            var self = this;
            self.appendWarpHtml();
            SCOPE.custom = custom;
            self.initPic(option);
        },
        initPic: function(option) {
            var self = this;
            SCOPE.dContext = option;
            SCOPE.callback = option.callback || jQuery.npoop; //关闭后的回调函数
            self.renderNoData();
            self.makeUp();
        },
        initPrevAndNextIconIsShow: function(custom) { // 初始化上下翻页的图标是否显示
            if (custom) {
                $(".left-bar,.right-bar").show();
            } else { // 未定义，只有一张图片，故隐藏上下图标
                $(".left-bar,.right-bar").hide();
            }
        },
        initIconsIsShow: function(option) { // 初始化下方按钮是否显示
            var self = this,
                isShowRightDetailInfo = typeof option.showRightDetailInfo !== "undefined" ? option.showRightDetailInfo : SCOPE.showRightDetailInfo,
                baseInfo = option.baseInfo,
                operatorOptions = option.operatorOptions,
                downloadUrl,
                saveToCloudbox,
                oneToOneFlag,
                toViewLibFlag,
                imgProcessFlag,
                imgRotateFlag,
                horizontalTurnFlag,
                verticalTurn;

            // 是否展示右侧详细信息
            if (isShowRightDetailInfo) {
                $(".bg-sider,.s-bar").show();
                $(".bg-wrap .bg-content").css("right", "250px");
            } else {
                $(".bg-sider,.s-bar").hide();
                $(".bg-wrap .bg-content").css("right", "0");
            }

            // 初始化下方按钮是否显示
            if (operatorOptions) {
                downloadUrl = operatorOptions.downloadUrl,
                saveToCloudbox = operatorOptions.saveToCloudbox,
                oneToOneFlag = typeof operatorOptions.oneToOneIcon !== "undefined" ? operatorOptions.oneToOneIcon : SCOPE.oneToOneIcon,
                toViewLibFlag = typeof operatorOptions.toViewLibIcon !== "undefined" ? operatorOptions.toViewLibIcon : SCOPE.toViewLibIcon,
                imgProcessFlag = typeof operatorOptions.imgProcessIcon !== "undefined" ? operatorOptions.imgProcessIcon : SCOPE.imgProcessIcon;
                imgRotateFlag = typeof operatorOptions.imgRotateIcon !== "undefined" ? operatorOptions.imgRotateIcon : SCOPE.imgRotateIcon;
                horizontalTurnFlag = typeof operatorOptions.horizontalTurnIcon !== "undefined" ? operatorOptions.horizontalTurnIcon : SCOPE.horizontalTurnIcon;
                verticalTurnFlag = typeof operatorOptions.verticalTurnIcon !== "undefined" ? operatorOptions.verticalTurnIcon : SCOPE.verticalTurnIcon;

                // 1:1
                oneToOneFlag ? jQuery(".elel").show() : jQuery(".content-controll-bar").find(".elel").remove();
                // 旋转
                imgRotateFlag ? jQuery(".viewer-tool-rotate").show() : jQuery(".content-controll-bar").find(".viewer-tool-rotate").remove();
                // 水平翻转
                horizontalTurnFlag ? jQuery(".viewer-tool-horizontalturn").show() : jQuery(".content-controll-bar").find(".viewer-tool-horizontalturn").remove();
                // 垂直翻转
                verticalTurnFlag ? jQuery(".viewer-tool-verticalturn").show() : jQuery(".content-controll-bar").find(".viewer-tool-verticalturn").remove();

                // 下载
                typeof downloadUrl !== "undefined" && downloadUrl ? jQuery(".down-load.permission-download").show() : jQuery(".content-controll-bar").find(".down-load.permission-download").remove();
                // 入视图库
                toViewLibFlag ? jQuery(".save-to-repository").show() : jQuery(".content-controll-bar").find(".save-to-repository").remove();
                // 图像处理
                imgProcessFlag ? jQuery(".image-analysis").show() : jQuery(".content-controll-bar").find(".image-analysis").remove();
                // 保存至云空间
                typeof saveToCloudbox !== "undefined" ? jQuery(".save-to-cloud").show() : jQuery(".content-controll-bar").find(".save-to-cloud").remove();
            } else { // 将operatorOptions中涉及的所有按钮隐藏
                jQuery(".content-controll-bar").find(".permission-download,.save-to-cloud").remove();
            }
        },
        appendWarpHtml:function(){
            var warpHTML = '<iframe src="about:blank" class="pop-img-iframe" frameborder="0" marginwidth="0" marginheight="0"></iframe><div class="bg-wrap">' +
                '<div class="bg-close"></div>' +
                '<div class="inner-wrap"></div>' +
                '</div>';
            if(!$('.bg-wrap')[0]){
                $('body').append(warpHTML);
                //绑定图片插件上的事件，只绑定一次
                popImgEvent.init();
            }

        },
        renderNoData:function(){
            //隐藏导航,bug[37719], add by zhangyu, 2015.10.25
            window.top.showHideNav("hide");
            $('.pop-img-iframe').show();
            $('.bg-wrap').show().find('.inner-wrap').html('<div class="loading"></div>');
        },
        getFileFormatByFilePath: function(filePath) { // 根据文件路径获取文件格式
            var fileFormat = filePath.substring(filePath.lastIndexOf("."));
            return fileFormat ? fileFormat.substring(1) : "";
        },
        getPopHtml:function(){
            var _t = this;
            jQuery.ajax({
                type: "get",
                url: SCOPE.pop_tpl_url,
                success: function(html) {
                    var fileFormat =  SCOPE.dContext.baseInfo.fileFormat ?  SCOPE.dContext.baseInfo.fileFormat :_t.getFileFormatByFilePath(SCOPE.dContext.baseInfo.filePath);
                    $('.bg-wrap').find('.inner-wrap').html(Handlebars.compile(html)(SCOPE.dContext.baseInfo));
                    $('.bg-wrap').find('.big-pic').hide().attr('src',SCOPE.dContext.baseInfo.filePath);
                    $('.bg-wrap').find(".bg-content").attr({
                        "data-fileType":SCOPE.fileType,
                        "data-index":SCOPE.dContext.baseInfo.curListIndex,
                        "data-structureName":$(".content .overview .list-content dd").filter("[data-index='" + SCOPE.dContext.baseInfo.curListIndex + "']").find(".l-name a").attr("data-filename")
                    });
                    // 初始化下方图标项的显示或隐藏
                    _t.initIconsIsShow(SCOPE.dContext);
                    _t.initPrevAndNextIconIsShow(SCOPE.custom);
                    // 权限(根据是否有对应的模块权限,隐藏图片查看的下方配置按钮) by songxj
                    permission.reShow();
                    SETCENTER.init(SCOPE.dContext.baseInfo.filePath);
                }
            });
        },
        makeUp:function(){
            var _t = this,
                json = SCOPE.dContext,
                msg = '<div class="loading"></div>';
            //隐藏导航,bug[37719], add by zhangyu, 2015.10.25
            window.top.showHideNav("hide");
            $('.pop-img-iframe').fadeIn();
            $('.bg-wrap').fadeIn().find('.inner-wrap').html(msg);
            if (json != null) {
                _t.makeUpCallBack(json);
            } else {
                _t.renderNoData()
            }

        },
        makeUpCallBack:function(res){
            var _t =this;
            _t.getPopHtml()
        }
    };
    return popImg;
})




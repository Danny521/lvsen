define([
    'underscore',
    'js/player',
    'pubsub',
    'DrawEditor',
    'jquery',
    'mootools',
    'raphael',
    'toolBar',
    'pvaConfig'
], function(_, Mplayer, PubSub){
    var playerImpl = new Mplayer({

    });
    var videoAnalyst = new Class({
        Implements: [Options, Events],
        message : '',//截屏消息
        hasVideoThumbnail : false,//当前视频视频已经存在缩略图
        playerContent : {},//当前视频的画面区域宽高
        playerSizeBeforeHideWidth : 0,
        options: {
            template: "",
            paperId: 'image_struct',
            imagePath: null,
            base64Pic: null,
            imageBg: "",
            template_right: null, //模版缓存
            rightContain: $("#main_right_video"),
            toolContain: ".video_edit .video_tool",
            templateUrl: "/module/imagejudge/resource-process/inc/videoTool.html",
            video_right_templurl: "/module/imagejudge/resource-process/inc/videoRight.html", //模版请求路径
            serviceUrl: "/service/pia/save_structured_info?_=" + (new Date()).getTime(), //保存到云端请求
            obj: {
                "fileType": "",
                "path": "",
                "id": "",
                "pid": "",
                "parentid": "",
                "shoottime": "",
                "fileName": "",
                "filePath": "",
                "pvdSourceId": "",//pvdSourceId视图库已有id
                "isClue": null
            },

            //当前多边形业务类型
            currentPolyType: '',
            //当前矩形对象数组
            currentRectObjs: [],
            //屏蔽区域区域多边形数据
            shieldPolyData: [],
            //处理区域多边形数据
            procPolyData: [],
            //视频初始化宽高
            initPlayerSize: {
                width: 863,
                height: 497
            },
            //当前视频宽高
            currentPlayerSize: {
                width: 0,
                height: 0
            },
            //自适应窗口大小后视频宽高
            PlayerSizeAfterWindowResize: {
                width: 0,
                height: 0
            },
            //视频原始信息宽高
            originalPlayerSize: {},
            procPolyShow: false,
            shieldPolyShow: false
        },
        initialize: function (options) {
            var that = this;
            that.setOptions(options);
            DrawEditor.imagejudge = true;
            that.DrawEditorBindEvents();
            that.subscribe();
            // 加载模板
            that.getRightTempl(true);
        },
        //智能标注区域删除事件
        DrawEditorBindEvents : function(){
            var that = this;
            DrawEditor.onselect = function (id, text) {
                var textArr = ['目标高度', '最大人脸', '最小人脸', '最小尺寸', '最大尺寸'];
                if(!_.isUndefined(_.find(textArr, function(item){
                    return text === item;
                }))){
                    return;
                };
                $(window.document).off("keydown").on("keydown", function (event) {
                    // 按delete键删除选中元素
                    if (event.keyCode == 46) {
                        var shieldData = that.getNodeHasDomId(that.options.shieldPolyData, id);
                        if (shieldData.isHas) {
                            that.options.shieldPolyData.splice(shieldData.index, 1);
                            if(that.options.shieldPolyData.length === 0){
                                $('#videoRight_showShield').hide();
                            }
                            if ($("#type-region-shield").prop("checked")) {
                                $("#btn-toggle-region-shield").button("enable");
                            }

                        }
                        var propData = that.getNodeHasDomId(that.options.procPolyData, id);
                        if (propData.isHas) {
                            that.options.procPolyData = [];
                            $('#videoRight_showProc').hide();
                            if ($("#type-region-proc").prop("checked")) {
                                $("#btn-toggle-region-proc").button("enable");
                            }
                        }

                        DrawEditor.deletedom(id);
                    }
                });

            };
        },
        //pubSub消息接收处理
        subscribe: function () {
            var that = this;
            //视频播放消息处理
            PubSub.subscribe("imagePlayerPause", function () {
                that.options.procPolyShow = false;
                that.options.shieldPolyShow = false;
                $('#videoRight_showShield').hide();
                $('#videoRight_showProc').hide();
                DrawEditor.clearPaper();
                $("#UIOCX_Paper").addClass('hidden');
            });
            //视频暂停消息处理
            PubSub.subscribe('imagePlayerStop', function () {
                if(that.options.shieldPolyData.length !== 0){
                    $('#videoRight_showShield').show();
                }
                if(that.options.procPolyData.length !== 0){
                    $('#videoRight_showProc').show();
                }
            })
            //获取视频信息消息处理
            PubSub.subscribe('imagePlayerInfo', function (msg, data) {
                that.clearPolyStatus();
                that.clearPolydata();
                that.DrawEditorInited = false;
                that.options.originalPlayerSize = {
                    width: data.width,
                    height: data.height
                }
            })
            PubSub.subscribe('showPlayerAndHideOcxPaper', function(){
                that.hideOrShowPlayer('#UIOCX', false);
            })
        },
        //去除智能标注区域状态
        clearPolyStatus: function () {
            var that = this;
            that.options.procPolyShow = false;
            that.options.shieldPolyShow = false;
        },
        ////去除智能标注区域数据
        clearPolydata: function () {
            var that = this;
            that.options.shieldPolyData = [];
            that.options.procPolyData = [];
            if ($('#type-region-proc').prop('checked')) {
                $("#btn-toggle-region-proc").button("enable");
            }
            if ($('#type-region-shield').prop('checked')) {
                $("#btn-toggle-region-shield").button("enable");
            }
        },
        //获取视图分析右侧静态模版
        getRightTempl: function (async) {
            var that = this;
            jQuery.ajax({
                type: "GET",
                url: that.options.video_right_templurl,
                async: async,
                success: function (tem) {
                    that.options.template_right = Handlebars.compile(tem);
                }
            });
        },
        //点击人工标注标注缩略图显示
        markBtnHtml: function () {
            jQuery(".draw_tools .icon_cancel").show(1);
            jQuery(".video_edit .edit_class").trigger("click");
            //document.getElementById("UIOCX").ShowOrHideOCX(false);
            jQuery(".video_edit dd div[data-flag='tool_hideen']").css({left :'-9999px', position: 'absolute'});
            jQuery(".video_edit dd div[data-flag='tool_show']").css('position', 'relative');
            jQuery(".video_edit dd div[data-flag='tool_show']").show(1);
        },
        //判断浏览器版本
        checkWebBrowser: function (browser) {
            if (navigator.userAgent.indexOf(browser) > 0) {
                return true;
            } else {
                return false;
            }
        },
        //设置图片大小
        setImage: function (img_url, img) {
            var self = this;
            // 改变图片的src
            img.src = img_url;
            jQuery("#picture").val(img_url);

            var image_struct = jQuery('#image_struct').hide(1);
            var uiloading = jQuery(".image-container-inner #loading").show(1);

            var check = function () {

                if (img.width > 0 || img.height > 0) {
                    // 清空画布
                    paperH.clear();
                    self.drawboard && self.drawboard.clear();
                    // 计算处理区域尺寸
                    var size = self.getPaperSize();

                    // 自适应图片尺寸
                    self.setImageSize(img, size);

                    // 设置 画布尺寸 等于 图片尺寸
                    var imgPaper = jQuery("#image_struct");
                    imgPaper.width(img.width).height(img.height);
                    paperH.setSize(img.width, img.height);
                    // 如果画布尺寸 小于 容器尺寸 居中画布
                    /*取消之前的画布left和top设置*/
                    imgPaper.css({
                        left: 0,
                        top:0
                    });
                    /*重新设置画布left和top*/
                    if (imgPaper.width() < size.width) {
                        imgPaper.css({
                            left: (size.width - imgPaper.width()) / 2
                        });
                    }
                    if (imgPaper.height() < size.height) {
                        imgPaper.css({
                            top: (size.height - imgPaper.height()) / 2
                        });
                    }


                    // 绘制图片
                    self.raphaelImg = paperH.image(img_url, 0, 0, img.width, img.height);

                    image_struct.show(1);
                    uiloading.hide();
                    clearInterval(set);
                }
            };
            var set = setInterval(check, 40);
        },
        //设置图片的大小
        setImageSize: function (img, paperSize) {
            if (img.width > paperSize.width || img.height > paperSize.height) {
                if (img.width / img.height > paperSize.width / paperSize.height) {
                    img.height = paperSize.width * img.height / img.width;
                    img.width = paperSize.width;
                } else {
                    img.width = img.width / img.height * paperSize.height;
                    img.height = paperSize.height;
                }
            }
            return img;
        },
        //将base64图片存储转化为图片url
        base64ToUrl: function (base64Str, $dom) {
            var imagePath;
            var that = this;
            $.ajax({
                url: "/service/pvd/upload/base64",
                type: "post",
                dataType: "json",
                data: {
                    "picture": base64Str
                },
                success: function (res) {
                    if (res.code === 200) {
                        that.options.imagePath = res.data.path;
                        $dom.attr('src', that.options.imagePath);
                        //获取视频抓取图片的宽高
                        that.options.imageBg = that.options.imagePath;
                        //给base64pic赋值为图片路径（url）
                        that.options.base64Pic = that.options.imagePath;
                        var img_url = that.options.imageBg;
                        var img = new Image();
                        that.setImage(img_url, img);
                    } else if (res.code === 500) {
                        notify.error(res.data.message);
                    } else {
                        notify.warn('图片转换异常! ' + (res ? res.code ? "状态码: " + res.code : "" : ""));
                    }
                },
                error: function (xhr, textStatus, errorThrown) {
                    // 如果http状态为200，说明后台返回数据成功，但数据格式错误
                    if (xhr.status === 200) {
                        notify.warn('图片转换异常! 数据格式错误');
                    }
                    // 其它状态为HTTP错误状态
                    else {
                        (xhr.status !== 0) && notify.warn('图片转换异常! HTTP状态码: ' + xhr.status);
                    }
                }
            });
        },
        /**
         * [getMarkPicUrl 将标注后内容与背景图生成一张图片]
         * @author limengmeng
         * @date   2014-11-03
         * @param  {[string]}   markJson [标记内容返回的接送串]
         * @return {[string]}       [标注后的图片地址]
         */
        getMarkPicUrl: function (markJson) {
            /*返回一个promise,带标记过后的图片url地址*/
            /*markJson为points数据,对象格式*/
            var self = this,
                markPicUrl;
            jQuery.ajax({
                url: "/service/pia/mark",
                type: "post",
                async: false,
                data: {
                    points: markJson
                },
                success: function (res) {
                    if (res.code === 200 && res.data && res.data.markPath) {
                        markPicUrl = res.data.markPath;
                    } else if (res.code === 500) {
                        notify.warn('获取标注图片异常! ' + (res ? res.code ? "状态码: " + res.code : "" : ""));
                    } else {
                        notify.warn('获取标注图片异常! 返回数据为空');
                    }
                },
                error: function (xhr, textStatus, errorThrown) {
                    // 如果http状态为200，说明后台返回数据成功，但数据格式错误
                    if (xhr.status === 200) {
                        notify.warn('获取标注图片异常! 数据格式错误');
                    }
                    // 其它状态为HTTP错误状态
                    else {
                        (xhr.status !== 0) && notify.warn('获取标注图片异常! HTTP状态码: ' + xhr.status);
                    }
                }
            });
            return markPicUrl;
        },
        //人工标注按钮-点击
        manualMarkBtn: function (paperH) {
            var that = this;
            jQuery('#mark_target').on('click', function (event) {
                event.preventDefault();
                event.stopImmediatePropagation();
                //~~~~暂停
                jQuery(".video-block .switch").trigger('click', ["pause"]);

                var base64Str = playerImpl.firstFrameBase64 = playerImpl.player.getPicInfo(0);
                if (base64Str !== "ERROR") {
                    //给appearTime加上当前播放时间
                    var appearTime = $("#appearTime").val();
                    if (appearTime && (appearTime = $.trim(appearTime)) !== "") {
                        var timePlay = $(".video-block .time .nowtime").attr("nowtime");
                        timePlay = (timePlay = $.trim(timePlay)) ? timePlay - 0 : 0;
                        appearTime = Toolkit.str2mills(appearTime) + timePlay;
                        appearTime = Toolkit.mills2datetime(appearTime);
                        $("#appearTime").val(appearTime);
                    }

                    that.options.imagePath = 'data:image/jpg;base64,' + base64Str;
                    var formatPath = encodeURI(base64Str.replace(/[\n\r]/ig, ''));
                    that.base64ToUrl(formatPath, jQuery(".video_form span img"));
                    jQuery(".video_edit .beginhide").show(1);

                    //切换图片
                    that.markBtnHtml();

                } else {
                    notify.warn('获取标记图片失败');
                }

            });
        },
        videoToolPaper: function () {
            var that = this;
            //~~~~
            var size = this.getPaperSize();
            window.paperH = Raphael('image_struct', size.width, size.height); //创建画布
            playerImpl.initPlayer({ //调用播放器
                filename: that.options.obj.path,
                hasVideoThumbnail : that.hasVideoThumbnail,
                videoId : that.options.obj.smartId
            });
            that.manualMarkBtn(paperH);
            that.bindToolEvents();
            that.sendData(that.options.obj.path, that.options.obj.id, that.options.obj.shoottime, that.options.obj.fileType, that.options.obj.pvdSourceId);
            //权限处理
            if (permission !== undefined) {
                permission.reShow();
            }

        },
        //获取画布尺寸
        getPaperSize: function () {
            var editArea = $(".video_edit"),
                toolArea = editArea.find(">dt:first"),
                containerArea = editArea.find(".file-container"),
                nameArea = editArea.find(".file-name"),

                width = editArea.width(),
                height = editArea.height() - toolArea.outerHeight(true) - nameArea.outerHeight(true);

            containerArea.width(width).height(height)
                .find(".image-container-inner").width(width).height(height);

            return {
                width: width,
                height: height
            };
        },
        imageToolPaper: function () {
            var that = this;
            //~~~~
            var sourceId = that.options.obj.id||that.options.obj.pid
            var size = this.getPaperSize();
            window.paperH = Raphael('image_struct', size.width, size.height); //创建画布
            //获取图片的宽高
            var img_url = that.options.obj.path;
            that.options.imageBg = that.options.obj.path;
            //设置图片路径
            $("#picture").val(that.options.obj.filePath);
            // 创建对象
            var img = new Image();
            // 改变图片的src
            img.src = img_url;
            that.setImage(img_url, img);
            that.bindToolEvents();
            that.sendData(that.options.obj.path, sourceId, that.options.obj.shoottime, that.options.obj.fileType, that.options.obj.pvdSourceId);
            $(".video_edit .edit_class[data-flag=tool_show]").trigger("click");
            jQuery(".video_form span img").attr('src', that.options.obj.path);
            jQuery(".draw_tools .icon_cancel").show(100);
            //权限处理
            if (permission) {
                permission.reShow();
            }
        },
        //渲染视图分析右侧页面
        renderVideorightmpl: function () {
            var that = this,
                $dom;

            // 如果模板没有被初始化 使用同步请求初始化
            if (!that.options.template_right) {
                that.getRightTempl(false);
            }
            if (that.options.obj.fileType && that.options.obj.fileType === "1") {
                that.videoRenderTempl();
                that.videoToolPaper();
            } else if (that.options.obj.fileType && that.options.obj.fileType === "2") {
                that.imageRenderTempl();
            } else {
                that.videoRenderTempl();
            }
        },
        //加载视频模版
        videoRenderTempl: function (isLayout) {
            var that = this;

            // 停止播放
            playerImpl&&playerImpl.playStatus&&playerImpl.stop(0);

            $dom = $(that.options.template_right({
                "video": {}
            }));
            that.options.rightContain.html($dom);

            if (that.isActiveData) {
                jQuery("#video-imagebg").hide();
            }

            // 权限
            permission && permission.reShow();

            // 检测ocx版本
            if(window.checkPlayer && window.checkPlayer()) {
                return;
            }

            //~~~~
            that.autosizePlayer();

            that.bindEvents();
            $("#main_right_video .beginhide").css("display", "none");
            $("#main_right_video .edit_class[data-flag=tool_hideen]").trigger("click");

            $(".video_content .filename span").text(that.options.obj.fileName);
            if (jQuery("#resourceTreePanel ul li").length === 0 || jQuery("#resourceTreePanel ul li.active").length === 0) {
                jQuery("#main_right_video .video_edit").css("display", "none");
                return;
            }
        },
        // 自适应视频尺寸
        autosizePlayer: function () {

            var size = this.getPaperSize();

            var playBlock = $(".file-container [data-flag=tool_hideen] .video-block");
            playBlock.width(size.width).find(".progress-bg,.progress-bar,.panel").width(size.width);

            var ocx = $(".file-container [data-flag=tool_hideen] #UIOCX");

            this.options.currentPlayerSize.width = ocx.width() || this.playerSizeBeforeHideWidth;
            this.options.currentPlayerSize.height = ocx.height();

            var ocxHeight = size.height - playBlock.outerHeight(true);
            ocx.width(size.width).height(ocxHeight).attr("width", size.width).attr("height", ocxHeight).removeClass("hidden");

            /*$("#frame-img").width(ocx.width()).height(ocx.height());*/
            this.getFrameImgPos();
            if (this.smartMarkPaper) {
                this.smartMarkPaper.setSize(ocx.width(), ocx.height());
            }

            if (DrawEditor.paper) {
                DrawEditor.paper.setSize(ocx.width(), ocx.height());
            }

            return this.playerContent

        },
        // 自适应画布尺寸
        autosizePaper: function () {
            var that = this;
            var img = new Image();
            img.src = that.options.imageBg;

            that.setImage(img.src, img);
            that.redrawPoly();
        },
        //加载图片模版
        imageRenderTempl: function () {
            var that = this;

            //如果前一次打开的是视频 停止播放
            playerImpl && playerImpl.playStatus&&playerImpl.stop(0);

            $dom = $(that.options.template_right({
                "image": {}
            }));
            that.options.rightContain.html($dom);

            if (that.isActiveData) {
                jQuery("#video-imagebg").hide();
            }

            that.bindEvents();
            that.imageToolPaper();
        },
        //绑定操作类
        bindToolEvents: function () {
            var that = this;
            $(".video_edit dd div[data-flag='tool_show']").hide();
            $(".video_edit .edit_class").on("click", function (e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                //人工标注视频/图片切换
                $(this).addClass("current").siblings("a").removeClass("current");
                var tab_index = $(".video_edit dt a").index(this);
                $(".video_edit dd div").eq(tab_index).show().siblings("div").hide();
                //编辑工具类显/隐
                var showFlag = $(".video_edit .current").attr("data-flag");
                if (showFlag === "tool_show") {
                    that.markTargettemplate();

                } else {
                    if ($(".draw_tools")) {
                        $(".draw_tools").remove();
                    }
                }
            });
        },
        //绘图标注类
        toolsBIndEvents: function () {
            var that = this;

            //创建画板
            var drawboard = that.drawboard = new DrawBoard({
                container: "#image_struct", // 容器对象
                paper: window.paperH, // 画布对象
                shapeType: null, // 绘制图形的类型
                stroke: "red", // 图形划过的颜色 后台解析使用rgb 不能换格式
                strokeWidth: 3, // 图形划过的宽度
                onDrawEnd: function () {
                    // 值允许画一次
                    $('.draw_tools').find(".icon_current").triggerHandler('click');
                    this.setOptions({
                        shapeType: null
                    });
                }
            });

            // 切换工具选项部分
            $('.draw_tools').find(".icon_rec,.icon_cir,.icon_arrow,.icon_text").on('click', function (e) {
                // 切换当前选中状态
                $(this).toggleClass("icon_current").parent("span").siblings("span").find("i").removeClass('icon_current');

                var currTool = $(this).closest('.draw_tools').find(".icon_current");
                if (currTool.size() > 0) {
                    // 切换鼠标样式
                    $("#image_struct").css({
                        cursor: 'crosshair'
                    });

                    // 设置工具类型
                    if (currTool.hasClass('icon_rec')) {
                        drawboard.setOptions({
                            shapeType: "rect"
                        });
                    }
                    if (currTool.hasClass('icon_cir')) {
                        drawboard.setOptions({
                            shapeType: "ellipse"
                        });
                    }
                    if (currTool.hasClass('icon_arrow')) {
                        drawboard.setOptions({
                            shapeType: "line"
                        });
                    }
                    if (currTool.hasClass('icon_text')) {
                        drawboard.setOptions({
                            shapeType: "text"
                        });
                    }
                } else {
                    $("#image_struct").css({
                        cursor: 'default'
                    });
                }
            });

            // 选择颜色部分
            $('.draw_tools .icon_Color').click(function () {
                $('.draw_tools ul').is(":hidden") ? $('.draw_tools ul').show(1) : $('.draw_tools ul').hide(1);
            });
            $(".draw_tools span ul li").click(function () {
                $(this).addClass("current").siblings("li").removeClass("current");
                $('.draw_tools .icon_Color').css('background', $(this).attr('data-value'));
                $(this).parent("ul").hide();
            });
            $(".draw_tools ul li").click(function () {
                if ($(this).attr('data-value')) {
                    drawboard.setOptions({
                        stroke: $(this).attr('data-value')
                    });
                }
            });
            // 清除
            $('.draw_tools .icon_cancel').click(function () {
                if (that.options.imageBg !== "") {
                    // 清除画板
                    drawboard && drawboard.clear();

                    var img_url = that.options.imageBg;
                    var img = new Image();
                    // 改变图片的src
                    img.src = img_url;
                    that.setImage(img_url, img);
                }
            });
        },
        //获取标记目标模版
        markTargettemplate: function () {
            var that = this,
                $dom;
            if (that.options.template) {
                $dom = $(that.options.template({}));
                $(that.options.toolContain).html($dom);
                that.toolsBIndEvents();
                $(".video_content .filename span").text(that.options.obj.fileName);

            } else {
                jQuery.get(that.options.templateUrl, function (tem, options) {
                    that.options.template = Handlebars.compile(tem);
                    $dom = $(that.options.template({}));
                    $(that.options.toolContain).html($dom);
                    that.toolsBIndEvents();
                    $(".video_content .filename span").text(that.options.obj.fileName);

                });
            }
        },
        //设置已有值
        sendData: function (path, id, shoottime, fileType, pvdSourceId) {
            //将时间戳转化为年月日
            if (shoottime.indexOf('-') === -1) {
                shoottime = shoottime - 0;
                var d = new Date(shoottime);
                shoottime = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
            }
            $("#appearTime").val(shoottime);
            //添加一个pvdSourceId 用来说明该视图已经在视图库中
            $("#pvdSourceId").val(pvdSourceId);
            $("#sourceId").val(id);
            $("#sourceType").val(fileType);
        },
        //左侧数点击加载右侧模版
        leafClick: function () {
            var that = this;
            var curNode = jQuery("#resourceTreePanel ul li.active");
            that.playerSizeBeforeHideWidth = 0;
            if (curNode.attr("data-filetype") !== undefined) {
                that.options.obj.fileType = curNode.attr("data-filetype").trim();
                that.options.obj.path =  curNode.attr(parseInt(curNode.attr("data-filetype")) === 1?"data-localpath":"data-videothumbnail").trim();
                that.options.obj.filePath = curNode.attr("data-filepath").trim();
                that.options.obj.id = curNode.attr("data-cid").trim();
                that.options.obj.pid = curNode.attr("data-pid").trim();
                that.options.obj.smartId = curNode.attr("data-id").trim();
                that.options.obj.parentid = curNode.attr("data-parentid").trim();
                that.options.obj.shoottime = curNode.attr("data-shootTime").trim();
                that.options.obj.fileName = curNode.attr("data-name").trim();
                that.options.obj.fileName = curNode.attr("data-name").trim();
                that.options.obj.isClue = curNode.attr("data-isClue").trim() || null;
                that.options.sourceId = curNode.attr("data-id").trim() || null;
                that.options.obj.pvdSourceId = curNode.attr("data-pid").trim() || null;
                if(curNode.attr("data-videoThumbnail").trim()){
                    that.hasVideoThumbnail = true;
                }else{
                    that.hasVideoThumbnail = false;
                };
                that.isActiveData = true;
            } else {
                that.isActiveData = false;
            }

            // 重置
            that.options.imageBg = "";
            // 渲染模板
            that.renderVideorightmpl();
        },
        //格式化数据
        modifyData: function (data, prefix, suffix, name, value) {
            var len = data.length;
            var str = prefix || "{",
                item = '';
            for (var i = 0; i < len; i++) {
                item = data[i];
                str = str + '"' + item.name + '":"' + item.value + '",';
            }
            if (name !== undefined && value !== undefined) {
                str = str + '"' + name + '":"' + value + '",';
            }
            str = str.substr(0, str.length - 1);
            str = str + (suffix || "}");
            return str;
        },
        //入库
        jumpMedialib: function (json, savePicJson) {
            var that = this;
            that.options.labelshoottime = that.options.obj.shoottime;
            //获取标注后的图片
            var markPicPath = that.getMarkPicUrl(savePicJson);
            // 标记目标片入新的视图库 by songxj 2016/04/12
            require(["pvbEnterLib"], function(EnterLib) {
                var fileName = that.options.obj.fileName,
                    tempDate = that.options.obj.shoottime,
                    shoottime = new Date(Date.parse(tempDate.replace(/-/g, "/"))).getTime(),
                    imgObj = {
                        type: "img",
                        filePath: markPicPath,
                        resourceObj: {
                            fileName: fileName,
                            fileDate: shoottime,
                            fileDesc: jQuery("#remark").val()
                        }
                    };
                EnterLib.init(imgObj);
            });
        },
        //隐藏显示OCX视频切换
        hideOrShowPlayer: function(dom, hide) {
            var self = this;
            if (hide) {
                if($(dom).width()===0){
                    return;
                }
                console.log('beforeHide:' + self.playerSizeBeforeHideWidth);
                self.playerSizeBeforeHideWidth = $(dom).width();
                $(dom).width(0);
            } else {
                if($(dom).width === self.playerSizeBeforeHideWidth||self.playerSizeBeforeHideWidth === 0){
                    return;
                }
                $(dom).width(self.playerSizeBeforeHideWidth);
            }
        },
        //保存到云端
        saveTocloud: function (json, savePicJson, cId, pId, sourceId, name) {
            var that = this;
            var posturl = "/service/pia/save_structured_info?_=" + (new Date()).getTime();
            /*var json1 = JSON.parse(json);
             json1.picture = that.options.obj.filePath;*/
            $.ajax({
                url: posturl,
                type: "post",
                data: {
                    "lable": json,
                    "points": savePicJson
                },
                dataType: "json",
                success: function (res) {
                    if (res.code === 200) {
                        notify.success("已保存到云端！");
                        //添加日志
                        var type = (parseInt(that.options.obj.fileType, 10) === 2 ? '图片' : '视频'),
                            name = that.options.obj.fileName,
                            structuredType = jQuery("#structuredType").val();
                        logDict.insertMedialog('m4', name + type + '生成' + structuredType + '结构化信息至云空间');
                        //添加弹窗 点击跳转到云端的地址
                        var confirmYun = new ConfirmDialog({
                            title: '保存到云端地址',
                            message: "<div class='dialogContent'><div class='icon'></div><i class='icon1'></i><div class='detail'><span class='opera'>已完成保存到云端操作！</span><br/><span class='detail_word'><a href='/module/iframe/?windowOpen=1&iframeUrl=/module/cloudbox?type=3&id=" + res.data.id + "&cId=" + cId + "&pId=" + pId + "&sourceId=" + sourceId + "&name=" + name  + "&title=video" + "' target='_blank'>点此处查看详情</a></span></div><div class='dialog_btn'><input type='button' class='close input-submit' value='关闭窗口'></div></div>",
                            showFooter: false
                        });
                        $(".common-dialog .close").on("click", function () {
                            //window.close();
                            confirmYun.hide();
                        });
                    } else {
                        notify.warn('保存云端失败! ' + (res ? res.code ? "状态码: " + res.code : "" : ""));
                    }
                },
                error: function (xhr, textStatus, errorThrown) {
                    // 如果http状态为200，说明后台返回数据成功，但数据格式错误
                    if (xhr.status === 200) {
                        notify.warn('保存云端失败! 数据格式错误');
                    }
                    // 其它状态为HTTP错误状态
                    else {
                        (xhr.status !== 0) && notify.warn('保存云端失败! HTTP状态码: ' + xhr.status);
                    }
                }
            });
        },
        isChecked: function (cmd) {
            if (cmd) {
                return 1;
            } else {
                return 0;
            }
        },
        //保存入库
        bindEvents: function () {
            var that = this;
            if (that.checkWebBrowser("MSIE 8.0")) {
                $("#remark").on('propertychange', function () {
                    if (this.value.length > 200) notify.warn("请输入小于200个字符");
                });
            } else {
                $("#remark").on('input', function () {
                    if (this.value.length > 200) notify.warn("请输入小于200个字符");
                });
            }
            $(".video_edit .edit_class[data-flag='tool_show']").on('click', function() {
                jQuery(".video_edit dd div[data-flag='tool_hideen']").css({left :'-9999px', position: 'absolute'});
                jQuery(".video_edit dd div[data-flag='tool_show']").css('position', 'relative');
                $(".video_edit dd div[data-flag='tool_show']").show(1);


                $("#main_right_video .location h6").removeClass("active").filter("#manual").addClass("active");
            });
            $(".video_edit .edit_class[data-flag='tool_hideen']").on('click', function() {
                $('.video-block').show();
                jQuery(".video_edit dd div[data-flag='tool_hideen']").css({left :'0px', position: 'relative'});
            });
            //保存结构化信息
            $("#save_cloud").on("click", function (e) {
                e.preventDefault();

                if (jQuery("#resourceTreePanel ul li.active").size() == 0) {
                    notify.warn("请先选择文件！");
                    return false;
                }
                var cId = jQuery("#resourceTreePanel ul li.active").attr("data-cid");
                var pId = jQuery("#resourceTreePanel ul li.active").attr("data-pid");
                var sourceId = jQuery("#resourceTreePanel ul li.active").attr("data-id");
                var name = jQuery("#resourceTreePanel ul li.active").attr("data-name");
                if (that.options.imageBg == "" || $("#structuredType").val().trim() === "") {
                    notify.warn("信息未填写完整！");
                    return false;
                }

                var $dom = $("#mark_form"),
                    data = $dom.serializeArray(),
                    rafData = savePicJson(),

                    json = that.modifyData(data, '{', '}');


                var rafDataObj = JSON.parse(rafData);
                if (rafDataObj.length === 0) {
                    notify.warn("资源加载中,请加载完毕在进行操作!");
                    return false;
                }


                //保存到云管理类调用
                if ($("#remark").val().length > 200) {
                    notify.warn("请输入小于200个字符");
                    return false;
                }

                rafData = savePicJson();
                that.saveTocloud(json, rafData, cId, pId, sourceId, name);
            });
            $("#structuredType").on("change", function () {
                $(this).attr("data-type", $(this).find("option[value=" + $(this).val() + "]").attr("data-type"));
            });

            //结构化信息入库
            $("#jump_medialib").on("click", function (e) {
                e.preventDefault();
                if (jQuery("#resourceTreePanel ul li.active").size() == 0) {
                    notify.warn("请先选择文件！");
                    return false;
                }

                /*if (that.options.imageBg == "" || $("#structuredType").val().trim() === "") {
                    notify.warn("信息未填写完整！");
                    return false;
                }*/
                if (that.options.imageBg == "") {
                    notify.warn("请选择标记目标！");
                    return false;
                }

                var picJson = savePicJson();
                var picJsonObj = JSON.parse(picJson);
                if (picJsonObj.length === 0) {
                    notify.warn("资源加载中,请加载完毕在进行操作!");
                    return false;
                }


                //获取当前结构化信息类型:人、车、物、场景、运动目标、其他
                window.typeData = $("#structuredType").attr("data-type");
                //var rafData = savePicJson(); //获取标注json
                //获取序列化表单信息
                var $dom = $("#mark_form"),
                    data = $dom.serializeArray();
                //只有云管理过来的才传structId
                var json = that.modifyData(data, '{', '}', "structId", that.options.obj.id);
                json = JSON.stringify(data);
                if ($("#remark").val().length > 200) {
                    notify.warn("请输入小于200个字符");
                    return;
                }
                //增加日志
                var type = (parseInt(that.options.obj.fileType, 10) === 2 ? '图片' : '视频'),
                    name = that.options.obj.fileName;
                logDict.insertMedialog('m4', name + type + '完成人工标注');
                //入库类调用
                picJson = savePicJson();
                that.jumpMedialib(json, picJson);
            });


            //接入CAPE有关
            $(function () {
                $('#cape').on('click', function () {
                    var path = 'file:///D:/Program%20Files/CAPE/start_cape/start_cape.bat';
                    try {
                        var objShell = new ActiveXObject("wscript.shell");
                        objShell.Run(path, 0);
                        objShell = null;
                        if ($('#cape-show').length > 0) {
                            $('#cape-show').show();
                        } else {
                            $('body').append('<div id="cape-show" style="width:100%; height:100%; z-index:1000; opacity:1; position:absolute;"><div style="width:100%; height:100%; opacity:0.2; filter:Alpha(opacity=20); position:absolute; background:#000;"></div><img style="position:absolute; left:50%; top:50%; margin-left:-29px; margin-top:-5px;" src="/module/common/images/animate/horizontal-loading.gif"/></div>');
                        }
                        $('#cape-show').delay(1000 * 20).hide(100);
                    } catch (path) {
                        alert('找不到文件"' + path + '"(或它的组件之一)。请确定路径和文件名是否正确，而且所需的库文件均可用。')
                    }
                });
            });

            //点击人工标注
            $("#manual").on("click", function (event) {
                event.preventDefault();
                event.stopImmediatePropagation();

                $("#smartMarkform").hide(1);
                $("#mark_form").show(1);
                $("#manual").addClass("active");
                $("#smartDimension").removeClass("active");

            });
            //点击智能标注
            $("#smartDimension").on("click", function (event) {
                event.preventDefault();
                event.stopImmediatePropagation();

                if ($(this).find(".button-disabled").size() > 0) {
                    return false;
                }

                $("#mark_form").hide(1);
                $("#smartMarkform").show(1);
                $("#smartDimension").addClass("active");
                $("#manual").removeClass("active");


                // 点击智能标注后选中视频
                $(".video_edit .edit_class[data-flag='tool_hideen']").trigger("click");
            });
            //生成智能标注
            $("#smartMarkSave").on("click", function (event) {
                var $dom = jQuery("#resourceTreePanel ul li.active");
                event.preventDefault();
                event.stopImmediatePropagation();

                if ($dom.size() == 0) {
                    notify.warn("请选择视频文件！");
                    return false;
                }
                if($dom.find("planOuter .planInner").hasClass("badBkColor")){
                    $dom.find("planOuter .planInner").removeClass("badBkColor");
                    $dom.find("planOuter .planInner").addClass("goodBkColor");
                }

                if (!$("#smartMarkform .type-mark input").is(":checked")) {
                    notify.warn("请选择类型！");
                    return false;
                }

                var resNode = jQuery("#resourceTreePanel ul li[data-id=" + that.options.obj.smartId + "]");
                var taskkey = resNode.data("taskkey");
                var taskstatus = resNode.data("taskstatus");

                // 处理过的任务
                if (taskkey) {
                    if (taskstatus) {

                        // 正在处理的提示用户是否重新开始任务
                        // 等待中(1) 待处理(2)
                        if (taskstatus == 1 || taskstatus == 2) {
                            new ConfirmDialog({
                                title: '提示',
                                message: "当前有正在处理的任务,确认停止并开始新任务?",
                                callback: function () {
                                    importTool.resourceTree &&
                                    importTool.resourceTree.smartStopImpt &&
                                    importTool.resourceTree.smartStopImpt(taskkey, function (res) {
                                        if (res && res.code === 200) {
                                            startSmart();
                                        }
                                    });
                                }
                            });
                        }

                        // 处理成功的提示用户是否再次处理
                        // 成功(4)
                        if (taskstatus == 32) {
                            new ConfirmDialog({
                                title: '提示',
                                message: "该文件已智能标注过,确认再次处理?",
                                callback: function () {
                                    startSmart();
                                }
                            });
                        }

                        // 处理失败或取消的直接生成标注
                        // 失败(8) 取消(16)
                        if (taskstatus == 8 || taskstatus == 16) {
                            startSmart();
                        }
                    } else {
                        //notify.warn("任务状态为空,无法生成!");
                        //没拿到任务状态时无法判断是否处理过,直接开启
                        startSmart();
                    }
                }
                // 未处理的任务直接生成标注
                else {
                    startSmart();
                }
            });
            // 高级设置点击
            $("#smartMarkform li.type .videdoRight_advancedSet").off("click").on("click", function (event) {
                event.preventDefault();
                event.stopImmediatePropagation();
                var tp = $(this).parent("li.type").next("li.type-params");
                if (tp.is(":visible")) {
                    tp.hide();
                } else {
                    $("#smartMarkform li.type-params").hide();
                    tp.show();
                }
            });
            //处理区域绘制
            var drawPrcoPoly = function () {
                DrawEditor.strokecolor = 'blue';
                DrawEditor.add_poly({
                    points: that.options.procPolyData[0].ploygon,
                    text: '',
                    domid: that.options.procPolyData[0].domid
                });
            }
            //屏蔽区域绘制
            var drawShiledPoly = function () {
                DrawEditor.strokecolor = 'red';
                _.map(that.options.shieldPolyData, function(item){
                    DrawEditor.add_poly({
                        points: item.ploygon,
                        text: '',
                        domid: item.domid
                    });
                })
            }
            //改变控制处理区域和屏蔽区域的图形的显隐
            var changeEyeIcon = function($dom){
                if($dom.hasClass('operate-icon-view-open')){
                    $dom.removeClass('operate-icon-view-open');
                    $dom.addClass('operate-icon-view-close');
                }else {
                    $dom.removeClass('operate-icon-view-close');
                    $dom.addClass('operate-icon-view-open');
                }
            };
            //控制处理区域的图形显隐的点击事件
            $('#videoRight_showProc').on('click', function () {
                if (that.options.procPolyData.length === 0) {
                    notify.warn('当前没有处理区域数据，请添加!');
                } else {
                    changeEyeIcon($('#videoRight_showProc'));
                    if (that.options.procPolyShow) {
                        DrawEditor.clearPaper();
                        that.showAreaSelect();
                        if (that.options.shieldPolyShow) {
                            drawShiledPoly();
                        }
                        that.options.procPolyShow = false;
                    } else {
                        that.showAreaSelect();
                        drawPrcoPoly();
                        that.options.procPolyShow = true;
                    }
                }
            })
            //控制屏蔽区域的图形显隐的点击事件
            $('#videoRight_showShield').on('click', function () {
                if (that.options.shieldPolyData.length === 0) {
                    notify.warn('当前没有屏蔽区域数据，请添加！')
                } else {
                    changeEyeIcon($('#videoRight_showShield'));
                    if (that.options.shieldPolyShow) {
                        DrawEditor.clearPaper();
                        that.showAreaSelect();
                        if (that.options.procPolyShow) {
                            drawPrcoPoly();
                        }
                        that.options.shieldPolyShow = false;
                    } else {
                        that.showAreaSelect();
                        drawShiledPoly();
                        that.options.shieldPolyShow = true;
                    }
                }
            })
            // 点击查看标注
            $("#look-mark-result").off("click").on("click", function (event) {
                event.preventDefault();
                event.stopImmediatePropagation();

                // 设置面板参数
                var resource, vid, shoottime, fileUrl, isClue;
                if (that.options.obj.id !== (null || undefined || "")) {
                    resource = 1;
                    vid = that.options.obj.id;
                } else {
                    if (that.options.obj.pid !== (null || undefined || "")) {
                        resource = 2;
                        vid = that.options.obj.pid;
                    }
                }
                shoottime = Toolkit.str2mills(that.options.obj.shoottime);
                fileUrl = that.options.obj.path;
                isClue = that.options.obj.isClue;
                var data ={
                    id : that.options.obj.smartId,
                    name : that.options.obj.fileName,
                    vid : vid,
                    fileUrl: fileUrl, // 文件路径
                    resource: resource, // 来源
                    shoottime: shoottime, // 拍摄时间
                    isClue: isClue//生成线索
                }
                Cookie.write('overlayPlayerData', JSON.stringify(data));
                window.openExpandScreen('/module/imagejudge/resource-process/inc/smartmark-look.html');
            });

            // 判断参数是否为数字并符合指定范围
            $(".type-params-item .spinner").on("keydown", function () {
                $(this).data("oldValue", $(this).spinner("value"));
            }).on("keyup", function () {
                var val = $(this).spinner("value");
                if (val === null || isNaN(val)) {
                    val = $(this).data("oldValue");
                }
                $(this).spinner("value", Math.min(Math.max(val, $(this).spinner("option", "min")), $(this).spinner("option", "max")));
            });
            //灰化智能标注运动目标参数编辑框
            var disabledVideoRight_target = function () {
                $('.videoRight_target').prop('checked', false);
                $('.type-params-item [name="move-height"]').spinner({
                    disabled: true
                });
                $('.type-params-item [name="move-sensitivity"]').spinner({
                    disabled: true
                });
            }
            //灰化智能标注人脸参数编辑框
            var disabledVideoRight_Face = function () {
                $('.videoRight_face').prop('checked', false);
                $('.type-params-item [name="face-minFace"]').spinner({
                    disabled: true
                });
                $('.type-params-item [name="face-maxFace"]').spinner({
                    disabled: true
                });
            }
            //灰化智能标注车辆参数编辑框
            var disabledVideoRight_size = function () {
                $('.videoRight_size').prop('checked', false);
                $('.type-params-item [name="car-minPlate"]').spinner({
                    disabled: true
                });
                $('.type-params-item [name="car-maxPlate"]').spinner({
                    disabled: true
                });
                $('.type-params-item [name="car-defaultProvince"]').attr('disabled', 'disabled');
            }
            //灰化智能标注剪切型(灵敏度)参数编辑框
            var disabledVideoRight_bright = function () {
                $('.videoRight_bright').prop('checked', false);
                $('.type-params-item [name="cut-frmThresh"]').spinner({
                    disabled: true
                });
                $('.type-params-item [name="cut-sensitiveThresh"]').spinner({
                    disabled: true
                });
            }
            var disabledVideoRight_overlayBright = function () {
                $('.videoRight_overlayBright').prop('checked', false);
                $('.type-params-item [name="overlay-frmThresh"]').spinner({
                    disabled: true
                });
                $('.type-params-item [name="overlay-sensitiveThresh"]').spinner({
                    disabled: true
                });
            }
            //智能标注运动目标-目标高度
            $('#videoRight_targetHeight').on('click', function () {
                if (!that.checkVideoLoaded()) {
                    return notify.warn("正在加载摄像机视频，请稍后...");
                }
                that.clearPolyStatus();
                disabledVideoRight_Face();
                disabledVideoRight_size();
                disabledVideoRight_bright();
                disabledVideoRight_overlayBright();
                if ($(this).prop('checked')) {
                    //$('.type-params-item .move-height-spinner').spinner();
                    $(".type-params-item .move-height-spinner").spinner({
                        disabled: false
                    });
                    var val = $('.type-params-item .move-height-spinner').spinner("value"),
                        text = '目标高度';
                    if (that.include(that.options.currentRectObjs, text).hasText) {
                        return;
                    } else {
                        DrawEditor.clearPaper();
                        that.options.currentRectObjs = [];
                        that.options.currentRectObjs.push({
                            $dom: $('.type-params-item .move-height-spinner'),
                            text: text
                        });
                        that.initRect(val, text);
                    }
                } else {
                    //$('.type-params-item .move-height-spinner').spinner( "destroy" );
                    DrawEditor.clearPaper();
                    if (that.options.currentRectObjs.length !== 0 && that.options.currentRectObjs[0].text === '目标高度') {
                        that.options.currentRectObjs = [];
                    }
                    $(".type-params-item .move-height-spinner").spinner({
                        disabled: true
                    });
                }
            })
            //智能标注运动目标-灵敏度
            $('#videoRight_delicacyLevel').on('click', function () {
                if (!that.checkVideoLoaded()) {
                    return notify.warn("正在加载摄像机视频，请稍后...");
                }
                disabledVideoRight_Face();
                disabledVideoRight_size();
                disabledVideoRight_bright();
                disabledVideoRight_overlayBright();

                if ($(this).prop('checked')) {
                    $(".type-params-item .move-sensitivity-spinner").spinner({
                        disabled: false
                    });
                } else {
                    $(".type-params-item .move-sensitivity-spinner").spinner({
                        disabled: true
                    });
                }
            })

            //智能标注运动目标-最小人脸
            $('#videoRight_minimumFace').on('click', function () {
                if (!that.checkVideoLoaded()) {
                    return notify.warn("正在加载摄像机视频，请稍后...");
                }
                that.clearPolyStatus();
                disabledVideoRight_target();
                disabledVideoRight_size();
                disabledVideoRight_bright();
                disabledVideoRight_overlayBright();

                if ($(this).prop('checked')) {
                    $('.type-params-item [name="face-minFace"]').spinner({
                        disabled: false
                    });
                    var val = $('.type-params-item [name="face-minFace"]').spinner("value"),
                        text = '最小人脸',
                        rectData = that.include(that.options.currentRectObjs, text);
                    if (rectData.hasText) {
                        return;
                    } else {
                        if (that.options.currentRectObjs.length !== 0 && that.options.currentRectObjs[0].text !== '最大人脸') {
                            that.options.currentRectObjs = [];
                            DrawEditor.clearPaper();
                        }
                        that.options.currentRectObjs.push({
                            $dom: $('.type-params-item [name="face-minFace"]'),
                            text: text
                        });
                        that.initRect(val, text);
                    }
                } else {
                    $('.type-params-item [name="face-minFace"]').spinner({
                        disabled: true
                    });
                    DrawEditor.clearPaper();
                    var maxFaceData = that.include(that.options.currentRectObjs, '最大人脸');
                    if (that.options.currentRectObjs.length !== 0 && !maxFaceData.hasText) {
                        that.options.currentRectObjs = [];
                        return;
                    }
                    if (maxFaceData.hasText) {
                        var tempNode = that.options.currentRectObjs[maxFaceData.index];
                        that.options.currentRectObjs = [];
                        that.options.currentRectObjs[0] = tempNode;
                        that.reDrawRect({
                            elem: $('.type-params-item [name="face-maxFace"]'),
                            width: tempNode.size.width,
                            height: tempNode.size.height,
                            x: tempNode.size.x,
                            y: tempNode.size.y,
                            text: '最大人脸'

                        });
                    }
                }
            })
            //智能标注运动目标-最大人脸
            $('#videoRight_maximumFace').on('click', function () {
                if (!that.checkVideoLoaded()) {
                    return notify.warn("正在加载摄像机视频，请稍后...");
                }
                that.clearPolyStatus();
                disabledVideoRight_target();
                disabledVideoRight_size();
                disabledVideoRight_bright();
                disabledVideoRight_overlayBright();

                if ($(this).prop('checked')) {
                    $('.type-params-item [name="face-maxFace"]').spinner({
                        disabled: false
                    });
                    var val = $('.type-params-item [name="face-maxFace"]').spinner("value"),
                        text = '最大人脸',
                        rectData = that.include(that.options.currentRectObjs, text);
                    if (rectData.hasText) {
                        return;
                    } else {
                        if (that.options.currentRectObjs.length !== 0 && that.options.currentRectObjs[0].text !== '最小人脸') {
                            DrawEditor.clearPaper();
                            that.options.currentRectObjs = [];
                        }
                        that.options.currentRectObjs.push({
                            $dom: $('.type-params-item [name="face-maxFace"]'),
                            text: text
                        });
                        that.initRect(val, text);
                    }
                } else {
                    $('.type-params-item [name="face-maxFace"]').spinner({
                        disabled: true
                    });
                    DrawEditor.clearPaper();
                    var minFaceData = that.include(that.options.currentRectObjs, '最小人脸');
                    if (that.options.currentRectObjs.length !== 0 && !minFaceData.hasText) {
                        that.options.currentRectObjs = [];
                        return;
                    }
                    if (minFaceData.hasText) {
                        var tempNode = that.options.currentRectObjs[minFaceData.index];
                        that.options.currentRectObjs = [];
                        that.options.currentRectObjs[0] = tempNode;
                        that.reDrawRect({
                            elem: $('.type-params-item [name="face-minFace"]'),
                            width: tempNode.size.width,
                            height: tempNode.size.height,
                            x: tempNode.size.x,
                            y: tempNode.size.y,
                            text: '最小人脸'

                        });
                    }
                }
            })

            //智能标注运动目标-最小尺寸
            $('#videoRight_minimumSize').on('click', function () {
                if (!that.checkVideoLoaded()) {
                    return notify.warn("正在加载摄像机视频，请稍后...");
                }
                that.clearPolyStatus();
                disabledVideoRight_Face();
                disabledVideoRight_target();
                disabledVideoRight_bright();
                disabledVideoRight_overlayBright();

                if ($(this).prop('checked')) {
                    $('.type-params-item [name="car-minPlate"]').spinner({
                        disabled: false
                    });
                    var val = $('.type-params-item [name="car-minPlate"]').spinner("value"),
                        text = '最小尺寸',
                        rectData = that.include(that.options.currentRectObjs, text);
                    if (rectData.hasText) {
                        return;
                    } else {
                        if (that.options.currentRectObjs.length !== 0 && that.options.currentRectObjs[0].text !== '最大尺寸') {
                            DrawEditor.clearPaper();
                            that.options.currentRectObjs = [];
                        }
                        that.options.currentRectObjs.push({
                            $dom: $('.type-params-item [name="car-minPlate"]'),
                            text: text
                        });
                        that.initRect(val, text);
                    }
                } else {
                    $('.type-params-item [name="car-minPlate"]').spinner({
                        disabled: true
                    });
                    DrawEditor.clearPaper();
                    var maxPlateData = that.include(that.options.currentRectObjs, '最大尺寸');
                    if (that.options.currentRectObjs.length !== 0 && !maxPlateData.hasText) {
                        that.options.currentRectObjs = [];
                        return;
                    }
                    if (maxPlateData.hasText) {
                        var tempNode = that.options.currentRectObjs[maxPlateData.index];
                        that.options.currentRectObjs = [];
                        that.options.currentRectObjs[0] = tempNode;
                        that.reDrawRect({
                            elem: $('.type-params-item [name="car-maxPlate"]'),
                            width: tempNode.size.width,
                            height: tempNode.size.height,
                            x: tempNode.size.x,
                            y: tempNode.size.y,
                            text: '最大尺寸'

                        });
                    }
                }
            })
            //智能标注运动目标-最大尺寸
            $('#videoRight_maximumSize').on('click', function () {
                if (!that.checkVideoLoaded()) {
                    return notify.warn("正在加载摄像机视频，请稍后...");
                }
                that.clearPolyStatus();
                disabledVideoRight_Face();
                disabledVideoRight_target();
                disabledVideoRight_bright();
                disabledVideoRight_overlayBright();

                if ($(this).prop('checked')) {
                    $('.type-params-item [name="car-maxPlate"]').spinner({
                        disabled: false
                    });
                    var val = $('.type-params-item [name="car-maxPlate"]').spinner("value"),
                        text = '最大尺寸',
                        rectData = that.include(that.options.currentRectObjs, text);
                    if (rectData.hasText) {
                        return;
                    } else {
                        if (that.options.currentRectObjs.length !== 0 && that.options.currentRectObjs[0].text !== '最小尺寸') {
                            DrawEditor.clearPaper();
                            that.options.currentRectObjs = [];
                        }
                        that.options.currentRectObjs.push({
                            $dom: $('.type-params-item [name="car-maxPlate"]'),
                            text: text
                        });
                        that.initRect(val, text);
                    }
                } else {
                    $('.type-params-item [name="car-maxPlate"]').spinner({
                        disabled: true
                    });
                    DrawEditor.clearPaper();
                    var minPlateData = that.include(that.options.currentRectObjs, '最小尺寸');
                    if (that.options.currentRectObjs.length !== 0 && !minPlateData.hasText) {
                        that.options.currentRectObjs = [];
                        return;
                    }
                    if (minPlateData.hasText) {
                        var tempNode = that.options.currentRectObjs[minPlateData.index];
                        that.options.currentRectObjs = [];
                        that.options.currentRectObjs[0] = tempNode;
                        that.reDrawRect({
                            elem: $('.type-params-item [name="car-minPlate"]'),
                            width: tempNode.size.width,
                            height: tempNode.size.height,
                            x: tempNode.size.x,
                            y: tempNode.size.y,
                            text: '最小尺寸'

                        });
                    }
                }
            })
            //智能标注运动目标-省默认名
            $('#videoRight_defaultProvinceName').on('click', function () {
                if (!that.checkVideoLoaded()) {
                    return notify.warn("正在加载摄像机视频，请稍后...");
                }
                $('.videoRight_face').prop('checked', false);
                disabledVideoRight_Face();
                disabledVideoRight_target();
                disabledVideoRight_bright();
                disabledVideoRight_overlayBright();

                if ($(this).prop('checked')) {
                    $('.type-params-item [name="car-defaultProvince"]').removeAttr('disabled');
                } else {
                    $('.type-params-item [name="car-defaultProvince"]').attr('disabled', 'disabled');
                }
            })

            //智能标注运动目标-剪切型-亮度灵敏度
            $('#videoRight_brightSensibility').on('click', function () {
                if (!that.checkVideoLoaded()) {
                    return notify.warn("正在加载摄像机视频，请稍后...");
                }
                disabledVideoRight_size();
                disabledVideoRight_Face();
                disabledVideoRight_target();
                disabledVideoRight_overlayBright();

                if ($(this).prop('checked')) {
                    $('.type-params-item [name="cut-frmThresh"]').spinner({
                        disabled: false
                    });
                } else {
                    $('.type-params-item [name="cut-frmThresh"]').spinner({
                        disabled: true
                    });
                }
            })
            //智能标注运动目标-剪切型-面积灵敏度
            $('#videoRight_areaSensibility').on('click', function () {
                 if (!that.checkVideoLoaded()) {
                    return notify.warn("正在加载摄像机视频，请稍后...");
                }
                disabledVideoRight_size();
                disabledVideoRight_Face();
                disabledVideoRight_target();
                disabledVideoRight_overlayBright();

                if ($(this).prop('checked')) {
                    $('.type-params-item [name="cut-sensitiveThresh"]').spinner({
                        disabled: false
                    });
                } else {
                    $('.type-params-item [name="cut-sensitiveThresh"]').spinner({
                        disabled: true
                    });
                }
            })

            // 运动目标高度取值范围
            $(".type-params-item .move-height-spinner").spinner({
                min: 10,
                max: 1000, // 最大值为视频 宽高中 较小的一个
                disabled: true
            });
            // 运动目标灵敏度
            $(".type-params-item .move-sensitivity-spinner").spinner({
                min: 1,
                max: 5,
                disabled: true
            });
            // 最小最大人脸
            $(".type-params-item .face-spinner").spinner({
                min: 60,
                max: 1000, // 最大值为视频 宽高中 较小的一个
                disabled: true
            })
            // 车辆最大最小尺寸
            $(".type-params-item .car-spinner").spinner({
                min: 40,
                max: 1000, // 最大值为视频 宽高中 较小的一个
                disabled: true
            })
            // 灵敏度
            $(".type-params-item .frmThresh-spinner").spinner({
                min: 1,
                max: 5,
                disabled: true
            });
            // 面积灵敏度
            $(".type-params-item .sensitiveThresh-spinner").spinner({
                min: 1,
                max: 100,
                disabled: true
            });
            //重绘矩形区域
            var reDrawOnlyOneRect = function ($dom, index, text) {
                DrawEditor.clearPaper();
                that.reDrawRect({
                    elem: $dom,
                    width: that.options.currentRectObjs[index].size.width,
                    height: $dom.spinner('value'),
                    x: that.options.currentRectObjs[index].size.x,
                    y: that.options.currentRectObjs[index].size.y,
                    text: text

                });
                that.options.currentRectObjs[index].size.height = $dom.spinner('value');
            }
            //目标高度change事件
            $(".type-params-item .move-height-spinner").on('spinchange', function () {
                reDrawOnlyOneRect($(".type-params-item .move-height-spinner"), 0, '目标高度');
            })
            //最小人脸change事件
            $('.type-params-item [name="face-minFace"]').on('spinchange', function () {
                var rectData = that.include(that.options.currentRectObjs, '最小人脸');
                reDrawOnlyOneRect($('.type-params-item [name="face-minFace"]'), rectData.index, '最小人脸');
                if (that.options.currentRectObjs.length === 2) {
                    var index = rectData.index === 0 ? 1 : 0;
                    that.reDrawRect({
                        elem: $('.type-params-item [name="face-maxFace"]'),
                        width: that.options.currentRectObjs[index].size.width,
                        height: that.options.currentRectObjs[index].size.height,
                        x: that.options.currentRectObjs[index].size.x,
                        y: that.options.currentRectObjs[index].size.y,
                        text: '最大人脸'

                    });
                }
            })
            //最大人脸change事件
            $('.type-params-item [name="face-maxFace"]').on('spinchange', function () {
                var rectData = that.include(that.options.currentRectObjs, '最大人脸');
                reDrawOnlyOneRect($('.type-params-item [name="face-maxFace"]'), rectData.index, '最大人脸');
                if (that.options.currentRectObjs.length === 2) {
                    var index = rectData.index === 0 ? 1 : 0;
                    that.reDrawRect({
                        elem: $('.type-params-item [name="face-minFace"]'),
                        width: that.options.currentRectObjs[index].size.width,
                        height: that.options.currentRectObjs[index].size.height,
                        x: that.options.currentRectObjs[index].size.x,
                        y: that.options.currentRectObjs[index].size.y,
                        text: '最小人脸'

                    });
                }
            })
            //最小尺寸change事件
            $('.type-params-item [name="car-minPlate"]').on('spinchange', function () {
                var rectData = that.include(that.options.currentRectObjs, '最小尺寸');
                reDrawOnlyOneRect($('.type-params-item [name="car-minPlate"]'), rectData.index, '最小尺寸');
                if (that.options.currentRectObjs.length === 2) {
                    var index = rectData.index === 0 ? 1 : 0;
                    that.reDrawRect({
                        elem: $('.type-params-item [name="car-maxPlate"]'),
                        width: that.options.currentRectObjs[index].size.width,
                        height: that.options.currentRectObjs[index].size.height,
                        x: that.options.currentRectObjs[index].size.x,
                        y: that.options.currentRectObjs[index].size.y,
                        text: '最大尺寸'

                    });
                }
            })
            //最大尺寸处理事件
            $('.type-params-item [name="car-maxPlate"]').on('spinchange', function () {
                var rectData = that.include(that.options.currentRectObjs, '最大尺寸');
                reDrawOnlyOneRect($('.type-params-item [name="car-maxPlate"]'), rectData.index, '最大尺寸');
                if (that.options.currentRectObjs.length === 2) {
                    var index = rectData.index === 0 ? 1 : 0;
                    that.reDrawRect({
                        elem: $('.type-params-item [name="car-minPlate"]'),
                        width: that.options.currentRectObjs[index].size.width,
                        height: that.options.currentRectObjs[index].size.height,
                        x: that.options.currentRectObjs[index].size.x,
                        y: that.options.currentRectObjs[index].size.y,
                        text: '最小尺寸'

                    });
                }
            })
            // 点击剪切型视频 默认选中运动目标
            var cancelChecked = function ($dom, $spinner) {
                if ($dom.prop('checked')) {
                    $dom.prop('checked', false);
                    $spinner.spinner({
                        disabled: true
                    });
                }
            }
            //剪切型参数点击事件
            $("#type-summary-cut").on("click", function () {
                if (this.checked) {
                    $('#videoRight_targetHeight').removeAttr('disabled');
                    $('#videoRight_delicacyLevel').removeAttr('disabled');
                    $("#type-mark-move").prop("checked", this.checked);
                    $("#type-mark-move").attr('disabled', 'disabled');
                    $('#videoRight_brightSensibility').removeAttr('disabled');
                    $('#videoRight_areaSensibility').removeAttr('disabled');
                } else {
                    $('#videoRight_brightSensibility').attr('disabled', 'disabled');
                    $('#videoRight_areaSensibility').attr('disabled', 'disabled');
                    cancelChecked($('#videoRight_brightSensibility'), $('.type-params-item [name="cut-frmThresh"]'));
                    cancelChecked($('#videoRight_areaSensibility'), $('.type-params-item [name="cut-sensitiveThresh"]'));
                    if (!$("#type-summary-overlay").prop('checked')) {
                        $("#type-mark-move").removeAttr('disabled');
                    }
                }
            });
            //叠加性参数点击事件
            $('#type-summary-overlay').on('click', function () {
                if (this.checked) {
                    $('#videoRight_targetHeight').removeAttr('disabled');
                    $('#videoRight_delicacyLevel').removeAttr('disabled');
                    $("#type-mark-move").prop("checked", this.checked);
                    $("#type-mark-move").attr('disabled', 'disabled');
                } else {
                    if (!$("#type-summary-cut").prop('checked')) {
                        $("#type-mark-move").removeAttr('disabled');
                    }
                }
            })
            //修改当前dom 状态
            var changeDisabled = function (mainDom, friDom, secDom, thirdDom) {
                var $dom = thirdDom || secDom;
                mainDom.on('click', function () {
                    if (mainDom.prop('checked')) {
                        friDom.removeAttr('disabled');
                        secDom.removeAttr('disabled');
                        $dom.removeAttr('disabled');
                    } else {
                        if (mainDom.selector === '#type-mark-move') {
                            if ($('#type-summary-cut').prop('checked')) {
                                $('#type-summary-cut').trigger('click');
                            }
                            if ($('#type-summary-overlay').prop('checked')) {
                                $('#type-summary-overlay').trigger('click');
                            }
                        }
                        DrawEditor.clearPaper();
                        that.options.currentRectObjs = [];
                        cancelChecked($('#videoRight_targetHeight'), $(".type-params-item .move-height-spinner"));
                        cancelChecked($('#videoRight_delicacyLevel'), $(".type-params-item .move-sensitivity-spinner"));
                        cancelChecked($('#videoRight_minimumFace'), $('.type-params-item [name="face-minFace"]'));
                        cancelChecked($('#videoRight_maximumFace'), $('.type-params-item [name="face-maxFace"]'));
                        cancelChecked($('#videoRight_minimumSize'), $('.type-params-item [name="car-minPlate"]'));
                        cancelChecked($('#videoRight_maximumSize'), $('.type-params-item [name="car-maxPlate"]'));
                        if ($('#videoRight_defaultProvinceName').prop('checked')) {
                            $('#videoRight_defaultProvinceName').prop('checked', false);
                        }
                        $('.type-params-item [name="car-defaultProvince"]').attr('disabled', 'disabled');
                        friDom.attr('disabled', 'disabled');
                        secDom.attr('disabled', 'disabled');
                        $dom.attr('disabled', 'disabled');
                    }
                })
            };

            changeDisabled($("#type-mark-move"), $('#videoRight_targetHeight'), $('#videoRight_delicacyLevel'));
            changeDisabled($("#type-mark-face"), $('#videoRight_minimumFace'), $('#videoRight_maximumFace'));
            changeDisabled($("#type-mark-car"), $('#videoRight_minimumSize'), $('#videoRight_maximumSize'), $('#videoRight_defaultProvinceName'));
            // 处理区域选中
            $("#type-region-proc").click(function () {
                if (!that.checkVideoLoaded()) {
                    return notify.warn("正在加载摄像机视频，请稍后...");
                }
                if (that.options.procPolyData.length !== 1) {
                    if (this.checked) {
                        $("#btn-toggle-region-proc").button("enable");
                    } else {
                        $("#btn-toggle-region-proc").button("disable");
                    }
                }
            });


            $("#type-region-shield").click(function () {
                if (!that.checkVideoLoaded()) {
                    return notify.warn("正在加载摄像机视频，请稍后...");
                }
                if (that.options.shieldPolyData.length !== 5) {
                    if (this.checked) {
                        $("#btn-toggle-region-shield").button("enable");
                    } else {
                        $("#btn-toggle-region-shield").button("disable");
                    }
                }
            });
            // 点击区域选择按钮
            $("#btn-toggle-region-proc").button({
                icons: {
                    primary: "ui-icon-pencil"
                }
            }).on("click", function () {
                DrawEditor.strokecolor = 'blue';
                that.options.currentPolyType = 'proc';
                that.hideOrShowPlayer('#UIOCX', true);
                that.showPoly('proc');
            });
            $("#btn-toggle-region-shield").button({
                icons: {
                    primary: "ui-icon-pencil"
                }
            }).on("click", function () {
                DrawEditor.strokecolor = 'red';
                that.options.currentPolyType = 'shield';
                that.hideOrShowPlayer('#UIOCX', true);
                that.showPoly('shield');
            });

            // 生成标注
            function startSmart() {
                var params = {};

                // 运动目标
                if ($("#type-mark-move").prop("checked")) {
                    params.motionObject = {
                        // 目标高度
                        height: $('.type-params-item [name="move-height"]').spinner("value"),
                        // 灵敏度
                        sensitivity: $('.type-params-item [name="move-sensitivity"]').spinner("value")
                    };
                }
                // 人脸
                if ($("#type-mark-face").prop("checked")) {
                    params.face = {
                        // 最小人脸
                        minFace: $('.type-params-item [name="face-minFace"]').spinner("value"),
                        // 最大人脸
                        maxFace: $('.type-params-item [name="face-maxFace"]').spinner("value")
                    };
                }
                // 车辆
                if ($("#type-mark-car").prop("checked")) {
                    params.vehicle = {
                        // 融合帧数
                        //integrationFrameRate: $('.type-params-item [name="car-integrationFrameRate"]').spinner("value"),
                        // 最小尺寸
                        minPlate: $('.type-params-item [name="car-minPlate"]').spinner("value"),
                        // 最大尺寸
                        maxPlate: $('.type-params-item [name="car-maxPlate"]').spinner("value"),
                        // 跳桢数
                        //skipFrames: $('.type-params-item [name="car-skipFrames"]').spinner("value"),
                        // 默认省
                        province: $('.type-params-item [name="car-defaultProvince"]').val()
                    };
                }
                // 剪切型
                if ($("#type-summary-cut").prop("checked")) {
                    // 视频摘要
                    params.videoSummary = {
                        model: "Shear",
                        // 亮度灵敏度
                        frmThresh: $('.type-params-item [name="cut-frmThresh"]').spinner("value"),
                        // 面积灵敏度
                        sensitiveThresh: $('.type-params-item [name="cut-sensitiveThresh"]').spinner("value")
                    };
                }
                // 叠加型
                if ($("#type-summary-overlay").prop("checked")) {
                    // 视频摘要
                    if ($("#type-summary-cut").prop("checked")) {
                        params.videoSummary.model = "Shear|Overlay";
                    } else {
                        params.videoSummary = {
                            model: "Overlay"
                        }
                    }
                }
                // 处理区域
                if ($("#type-region-proc").prop("checked")) {
                    var procPolyData = JSON.parse(JSON.stringify(that.options.procPolyData));
                    params.roi = {
                        // 处理区域
                        procRgn: {
                            ploygon: that.getXY(
                                that.filterData(
                                    that.getRedrawPolySize(
                                        procPolyData,
                                        that.playerContent,
                                        that.options.originalPlayerSize
                                    ), 'ploygon')[0].ploygon)
                        }
                    };
                }
                // 屏蔽区域
                if ($("#type-region-shield").prop("checked")) {
                    var shieldPolydata = JSON.parse(JSON.stringify(that.options.shieldPolyData));
                    params.roi = params.roi !== undefined ? params.roi : {};
                    params.roi.shieldRgn = [];
                    _.map(that.filterData(
                        that.getRedrawPolySize(
                            shieldPolydata,
                            that.playerContent,
                            that.options.originalPlayerSize
                        ), 'ploygon'),  function(item){
                        params.roi.shieldRgn.push({
                            ploygon: that.getXY(item.ploygon)
                        })
                    })
                }

                $.ajax({
                    url: "/service/pia/smart",
                    type: "post",
                    data: {
                        "id": that.options.obj.smartId,
                        "smartMark": JSON.stringify(params)
                    },
                    dataType: "json",
                    success: function (res) {
                        if (res.code === 200) {
                            notify.success("添加任务成功");
                            var flagResour = jQuery("#resourceTreePanel ul li.active").attr("data-id");
                            importTool.resourceTree.storeData = flagResour;
                            importTool.resourceTree.reload();
                            PubSub.publish("videoBeginSmart");
                            //logDict.insertMedialog('m4', new Date().getTime() + '视频标注时间开始');
                        } else if (res.code === 500) {
                            notify.error("连接PCC异常！");
                        } else {
                            notify.warn('智能标注失败! ' + (res ? res.code ? "状态码: " + res.code : "" : ""));
                        }
                    },
                    error: function (xhr, textStatus, errorThrown) {
                        // 如果http状态为200，说明后台返回数据成功，但数据格式错误
                        if (xhr.status === 200) {
                            notify.warn('智能标注失败! 数据格式错误');
                        }
                        // 其它状态为HTTP错误状态
                        else {
                            (xhr.status !== 0) && notify.warn('智能标注失败! HTTP状态码: ' + xhr.status);
                        }
                    }
                });
            };

            if (!that.screenshotParams) {
                that.screenshotParams = {};
                // 截屏
                PubSub.subscribe('screenshot', function(message, imgObj){
                        var imgData = imgObj.data;
                        that.message = imgObj.message;
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
                                    PubSub.publish(that.message);
                                    $("#layerbox,.dialogbox").hide();
                                    $("#screenshot").attr({
                                        "src": ""
                                    });
                                }).end().find('[data-action="toMediaLib"]').on("click", function () {
                                    $.ajax({
                                        url: "/service/pcm/add_screenshot_to_view",
                                        data: {
                                            fileName: that.options.obj.fileName,
                                            filePath: that.screenshotParams.playerSnap,
                                            catchTime: that.screenshotParams.nowtime,
                                            shootTime: Toolkit.str2mills(that.options.obj.shoottime)
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
                                                logDict.insertMedialog('m6', that.options.obj.fileName + ' 截图入视图库'); // 截图入库日志
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
                                            fileName: that.options.obj.fileName,
                                            filePath: that.screenshotParams.playerSnap,
                                            catchTime: that.screenshotParams.nowtime,
                                            shootTime: Toolkit.str2mills(that.options.obj.shoottime)
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

                        var data = imgData;

                        that.screenshotParams.nowtime = $(".time .nowtime").attr("nowtime") - 0;
                        that.screenshotParams.screenShotSrc = "data:image/jpg;base64," + data;
                        that.screenshotParams.base64 = data;
                        that.screenshotParams.playerSnap = data;

                        var img = new Image();
                        img.onload = function () {
                            var cSize = {
                                width: $(".dialogbox .dialog_body").width(),
                                height: $(".dialogbox .dialog_body").height()
                            };

                            /*显示抓图图片*/
                            $("#screenshot").attr({
                                "src": that.screenshotParams.screenShotSrc
                            }).css({
                                width: cSize.width,
                                height: cSize.height,
                                top: 0,
                                left: 0
                            });
                        };
                        img.src = that.screenshotParams.screenShotSrc;

                })

            }

            // 查看标注按钮显示
            if (!that.initedShowResultBtn) {
                var resNode, taskkey, taskstatus, btn = $("#look-mark-result");

                function showResultBtn() {
                    resNode = jQuery("#resourceTreePanel ul li[data-id=" + that.options.obj.smartId + "]");
                    taskkey = resNode.data("taskkey");
                    taskstatus = resNode.data("taskstatus");

                    // 已处理成功的任务
                    // taskstatus = 4; // 测试用 为了让按钮显示
                    if (taskkey && taskstatus && taskstatus == 32) {
                        btn.removeClass("hidden");
                    } else {
                        btn.addClass("hidden");
                    }

                    setTimeout(function () {
                        showResultBtn();
                    }, 1000);
                };
                showResultBtn();
            }

            // 播放器大小自适应
            $(window).on("resize.video", function () {
                var self =this;

                //视频窗口和智能标注区域图像自适应屏幕
//                if (that.options.obj.fileType && that.options.obj.fileType === "1") {
//                    that.options.PlayerSizeAfterWindowResize = that.autosizePlayer();
//                    that.autosizePaper();
//                } else if (that.options.obj.fileType && that.options.obj.fileType === "2") {
//                    that.autosizePaper();
//                }

                //视频窗口自适应&&清除智能标注图像
                if (that.options.obj.fileType && that.options.obj.fileType === "1") {
                    that.autosizePlayer();
                    that.autosizePaper();
                    $('#type-region-proc').prop('checked', false);
                    $('#type-region-shield').prop('checked', false);
                    $('#btn-toggle-region-shield').button("disable");
                    DrawEditor.clearPaper();
                    $("#UIOCX_Paper").addClass('hidden');
                    that.options.procPolyData= [];
                    that.options.shieldPolyData = [];
                    $('#videoRight_showProc').hide();
                    $('#videoRight_showShield').hide();
                }else if (that.options.obj.fileType && that.options.obj.fileType === "2") {
                    that.autosizePaper();
                }
            });
        },
       //截图
        videoScreenShot: function () {
            var me = this;
            //下面这条实现ocx截图后的格式封装，在再ie9及以上版本均可以，ie8对大于32kb的图像数据不兼容；
            //故此处更改为后台进行图片包装，然后用地址显示
            var imgData = DefenceLogical.videoPlayer.playerSnap(0),
                imgPath = "data:image/jpg;base64," + DefenceLogical.videoPlayer.playerSnap(0); //IE8+
            //考虑到以后高清高速摄像机的图片会非常大，故只在ie8的情况下进行上传处理
            if (me.checkWebBrowser("MSIE 8.0")) {

                me.callServiceObj = (new callModuleService()).initial("/snap", "", false);
                //发起ajax同步请求，然后根据获取到的图片地址进行解析显示
                me.callServiceObj.LogicalEvents.FormateImgData( //参数
                    {
                        base64: imgData,
                        ext: "png"
                    },
                    function () { //beforesend

                    },
                    function (res) { //success
                        if (res.code === 200) {
                            imgPath = res.data.path;
                        } else if (res.code === 500) {
                            notify.error(res.data.message);
                        } else {
                            notify.error("画布初始化异常！");
                        }
                    },
                    function () { //error
                        notify.error("画布初始化异常！");
                    });
            }
            //初始化图像对象
            var imgObj = jQuery("<img>").attr({
                "src": imgPath,
                "id": "UIOCX_Paper",
                "draggable": false
            }).css({
                left: -1000 + "px"
            });

            return {
                imgObj: imgObj
            };
        },
        //判断当前对象数组中对象是否含有text这个key 并返回这个对象在数组中的位置
        include: function (arr, text) {
            var Index = _.indexOf(arr, _.find(arr,  function(item){
                return item.text === text;
            }))
            return{
                index: Index,
                hasText: Index !== -1
            }
        },
        //重绘矩形数据
        reDrawRect: function (options) {
            DrawEditor.strokecolor = 'red';
            this.showRect(options)
        },
        //初始化矩形
        initRect: function (val, text) {
            var self = this;
            var rectData = self.include(self.options.currentRectObjs, text);
            DrawEditor.strokecolor = 'red';
            if (self.options.currentRectObjs[rectData.index].size === undefined) {
                self.showRect({
                    elem: rectData.$dom,
                    width: val,
                    height: val,
                    text: text
                });

                self.options.currentRectObjs[rectData.index].size = {
                    width: val,
                    height: val,
                    x: 100,
                    y: 100
                }
            } else {
                self.showRect({
                    elem: rectData.$dom,
                    width: val,
                    height: val,
                    x: self.options.currentRectObjs[rectData.index].size.x,
                    y: self.options.currentRectObjs[rectData.index].size.y,
                    text: text
                });
            }
        },
        //显示矩形
        showRect: function (options) {
            var self = this;
            this.showAreaSelect();
            //DrawEditor.clearPaper();
            DrawEditor.add_rect({
                x: options.x || 100,
                y: options.y || 100,
                width: options.width,
                height: options.height,
                text: options.text || ""
            });
            DrawEditor.spinnerElem = options.elem;
        },
        //获得重绘的矩形尺寸
        getRedrawPolySize: function (data, newSize, oldSize) {
            var self = this;

            var wScale = oldSize.width / newSize.width;
            var hScale = oldSize.height / newSize.height;
            _.map(data,  function(item){
                _.map(item.ploygon,  function(node){
                    node[0] = parseInt(node[0] * wScale);
                    node[1] =parseInt(node[1] * hScale);
                })
            })
            return data;
        },
        //重绘处理区域和屏蔽区域
        redrawPoly: function () {
            var self = this;
            $("#UIOCX_Paper").addClass("hidden");
            DrawEditor.clearPaper();
            var oldSize = self.options.PlayerSizeAfterWindowResize;
            var newSize = self.playerContent;
            if (oldSize.width === 0 && oldSize.height === 0) {
                oldSize = {
                    width: 1,
                    height: 1
                }
                newSize = oldSize;
            }
            var procPoint = self.getRedrawPolySize(self.options.procPolyData, oldSize, newSize);
            var shieldPoints = self.getRedrawPolySize(self.options.shieldPolyData, oldSize, newSize);
            if (!jQuery('.video-block .switch').hasClass("active")) {
                this.showAreaSelect();
            }
            if (self.options.procPolyData.length !== 0) {
                DrawEditor.strokecolor = 'blue';
                DrawEditor.add_poly({
                    points: procPoint[0].ploygon,
                    text: '',
                    domid: procPoint[0].domid
                });
            }
            if (self.options.shieldPolyData.length !== 0) {
                DrawEditor.strokecolor = 'red';
                _.map(shieldPoints, function(item){
                    DrawEditor.add_poly({
                        points: item.ploygon,
                        text: '',
                        domid: item.domid
                    });
                })
            }
        },
        //显示多边形区域
        showPoly: function (options) {
            var self = this;
            if (self.options.currentRectObjs.length !== 0) {
                self.options.currentRectObjs = [];
                DrawEditor.clearPaper();
            }
            DrawEditor.spinnerElem = null;
            self.showAreaSelect();
            DrawEditor.setPenType('poly');
            DrawEditor.showhelp('poly');
        },
        // 显示多边形域层
        getNodeHasDomId: function (arr, id) {
            var Index = _.indexOf(arr,  _.find(arr,  function(item){
                return item.domid === id;
            }))

            return{
                index : Index,
                isHas : Index !== -1
            }
        },
        //过滤key为tye的对象数据
        filterData: function (arr, type) {
            var returnData = [];
            _.map(arr,  function(item){
                returnData.push({
                    'ploygon': item[type]
                });
            })
            return returnData;
        },
        //获取区域坐标
        getXY: function (arr) {
            var returnData = [];
            _.map(arr,  function(item){
                    returnData.push({
                        x: item[0],
                        y: item[1]
               })
            })
            return returnData
        },
        polyObj: {
            'proc': function (obj, self) {
                self.options.procPolyData.push({
                    domid: obj.domid,
                    ploygon: obj.points
                });
                self.options.procPolyShow = true;
                $("#btn-toggle-region-proc").button("disable");
                $('#videoRight_showProc').show();
            },
            'shield': function (obj, self) {
                self.options.shieldPolyData.push({
                    domid: obj.domid,
                    ploygon: obj.points
                })
                self.options.shieldPolyShow = true;
                if (self.options.shieldPolyData.length === 5) {
                    $('#btn-toggle-region-shield').button("disable");
                }else if(self.options.shieldPolyData.length === 1){
                    $('#videoRight_showShield').show();
                }
            }
        },
        /**
         * 判断摄像机视频是否已经加载画面
         * @returns {boolean}
         */
        checkVideoLoaded: function() {
            var videoAttr = playerImpl.player.getVideoInfo(0);
            if (videoAttr !== "ERROR") {
                //如果分辨率非最小分辨率摄像机（摄像机没有加载出画面）
                if (videoAttr.width <= 0 || videoAttr.height <= 0) {
                    return false;
                } else {
                    this.options.originalPlayerSize = {
                        width: videoAttr.width,
                        height: videoAttr.height
                    };

                    return true;
                }
            } else {
                //获取不到时，此时摄像机完全没有加载
                return false;
            }
        },
        //对区域多边形只有一个左边变化时标记
        hasOnlyOnePointChange: function (newPoints, oldPoints) {
            var flag = 0;
            _.map(newPoints, function(item, index){
                if (item[0] !== oldPoints[index][0] || item[1] !== oldPoints[index][1]) {
                    flag++;
                }
            })
            return (flag === 1);
        },
        //判断当前点是否越过画布
        pointOutPaper: function (points, oldPoints) {
            var self = this;
            if (!self.hasOnlyOnePointChange(points, oldPoints)) {
                return false;
            }
            for (var i = 0; i < points.length; i++) {
                if (points[i][0] <= 0 || points[i][1] <= 0 || points[i][0] >= self.options.currentPlayerSize.width || points[i][1] >= self.options.currentPlayerSize.height) {
                    return true;
                }
            }
            return false;
        },
        //获取当前视频的播放区域
        getFrameImgPos : function(){
            var self = this,
                ocxPaper = $("#UIOCX_Paper"),
                ocxImage = $('#frame-img'),
                originalPlayerSize = self.options.originalPlayerSize,
                currentPlayerSize = self.options.currentPlayerSize;

            originalPlayerSize = ocxDefaultRatio === 2 ? currentPlayerSize : originalPlayerSize;
            if(originalPlayerSize.width/currentPlayerSize.width > originalPlayerSize.height/currentPlayerSize.height){
                //height用黑色背景填充
                self.playerContent.width = currentPlayerSize.width;
                self.playerContent.height = (originalPlayerSize.height/originalPlayerSize.width)*currentPlayerSize.width;
                ocxPaper.width(self.playerContent.width).height(self.playerContent.height);
                ocxImage.width(self.playerContent.width).height(self.playerContent.height);
                ocxPaper.css({
                    "margin-top" : (currentPlayerSize.height-self.playerContent.height)/2,
                    "margin-left" : 0
                })
                ocxImage.css({
                    "margin-top" : (currentPlayerSize.height-self.playerContent.height)/2,
                    "margin-left" : 0
                })
            }else{
                //width用黑色背景填充
                self.playerContent.height = currentPlayerSize.height;
                self.playerContent.width = (originalPlayerSize.width/originalPlayerSize.height)*currentPlayerSize.height;
                ocxPaper.width(self.playerContent.width).height(self.playerContent.height);
                ocxImage.width(self.playerContent.width).height(self.playerContent.height);
                ocxPaper.css({
                    "margin-top" : 0,
                    "margin-left" : (currentPlayerSize.width-self.playerContent.width)/2
                })
                ocxImage.css({
                    "margin-top" : 0,
                    "margin-left" : (currentPlayerSize.width-self.playerContent.width)/2
                })
            }
        },
        showAreaSelect: function () {
            var self = this,
                ocxPaper = $("#UIOCX_Paper");

            if (ocxPaper.is(":hidden")) {
                // 暂停
                var playBtn = $(".video-block .switch");
                playBtn.data("play_state", playBtn.hasClass("active"));
                if (playBtn.data("play_state")) {
                    playBtn.trigger("click");
                }

                // 截取当前图片
                $("#frame-img").attr("src", "data:image/png;base64," + playerImpl.player.playerSnap(0)).removeClass("hidden");

                var ocx = $(".file-container [data-flag=tool_hideen] #UIOCX");
                this.options.currentPlayerSize.width = ocx.width() || self.playerSizeBeforeHideWidth;
                this.options.currentPlayerSize.height = ocx.height();
                self.getFrameImgPos();
                ocxPaper.removeClass("hidden");
                if (!self.DrawEditorInited) {
                    DrawEditor.init("UIOCX_Paper", ocxPaper.width(), ocxPaper.height());
                    var ocx = $(".file-container [data-flag=tool_hideen] #UIOCX");
                    self.options.currentPlayerSize.width = ocx.width() || self.playerSizeBeforeHideWidth;
                    self.options.currentPlayerSize.height = ocx.height();
                    DrawEditor.strokewidth = 5;
                    DrawEditor.fontsize = 14;
                    DrawEditor.onchange = function (obj) {

                        if (obj.type === 'rect') {
                            var rectData = self.include(self.options.currentRectObjs, obj.text);
                            self.options.currentRectObjs[rectData.index].size = obj.box;
                            $(self.options.currentRectObjs[rectData.index].$dom).spinner("value", obj.box.height);
                        }

                        if (obj.type === 'polyline') {
                            var procData = self.getNodeHasDomId(self.options.procPolyData, obj.domid);
                            var shieldData = self.getNodeHasDomId(self.options.shieldPolyData, obj.domid);
                            if (procData.isHas === true) {
                                if (self.pointOutPaper(obj.points, self.options.procPolyData[procData.index].ploygon)) {
                                    DrawEditor.deletedom(obj.domid);
                                    DrawEditor.strokecolor = 'blue';
                                    DrawEditor.add_poly({
                                        points: self.options.procPolyData[procData.index].ploygon,
                                        text: '',
                                        domid: obj.domid
                                    })
                                    return;
                                }
                                self.options.procPolyData[procData.index].ploygon = obj.points;
                            } else if (shieldData.isHas === true) {
                                if (self.pointOutPaper(obj.points, self.options.shieldPolyData[shieldData.index].ploygon)) {
                                    DrawEditor.deletedom(obj.domid);
                                    DrawEditor.strokecolor = 'red';
                                    DrawEditor.add_poly({
                                        points: self.options.shieldPolyData[shieldData.index].ploygon,
                                        text: '',
                                        domid: obj.domid
                                    })
                                    return;
                                }
                                self.options.shieldPolyData[shieldData.index].ploygon = obj.points;
                            } else {
                                self.polyObj[self.options.currentPolyType](obj, self)
                            }
                        }
                    }
                    self.DrawEditorInited = true;
                }
            }
        }
    });

    return videoAnalyst;
})

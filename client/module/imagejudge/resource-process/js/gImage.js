
define([
    'js/imageReq',
    'pubsub',
    '/module/imagejudge/resource-process/js/dealImageExplainConf.js',
    'permission',
    'scrollbar',
    'base.self',
    'jquery-ui',
    'jquery.datetimepicker',
    'raphael',
    'jquery.Jcrop'
], function(imageReq, PubSub, conf){
    var gImage = new new Class({

        Implements: [Options, Events],
        mainExplainText : '旋转',//当前选择的图像操作
        jcrop_api: '', //裁剪对象

        cutRatio: 0, //宽高比 自由裁剪,裁剪比例锁定时用

        oldOriginalBounds: [0, 0], //原图的原始尺寸
        oldImgId: '', //原图的id

        compareStatus: 1, //1不是对比的状态,2对比状态

        originalBounds: [], //当前图片原始尺寸

        displayBounds: [], //页面显示的尺寸

        algorithmsList: [], //存储算法列表和版本

        historyList: [], //历史记录列表

        imgLoadTimer: '', //图片是否加载成功计时器

        curProcessId: '', //准备基于当前图片处理时,保存的id
        curProcessImg: '', //准备基于当前图片处理时,保存的src

        beforeProcessId: '', //图片处理前保存一份的图片id
        beforeProcessImg: '', //例如'左右翻转,镜像'后,curProcessId会改变,但是beforeProcessId不会改变,点击取消时,可以回到beforeProcessId

        picProcessRes: null, //图片处理的响应
        timeoutTimer: 0, //超时计时器

        passData: '', //其他页面跳转到图像处理页面传的数据

        imgLoadedList: new Hash(),

        lastTargetImg: null, // 记录最后一次处理的图片信息，如果是缩放不进行记录(排除缩放本身)

        cutInFuzzy : false, //标记当前是否在模糊处理的截图状态

        sliderMaxSizeDealing : false,

        targetImg: $("#targetImg"),
        targetImgPaper: $("#targetImgPaper").css({
            position: "absolute",
            visibility: "hidden",
            backgroundColor: "transparent",
            zIndex: 50
        }),

        initialize: function(options) {
            var self = this;

            this.setOptions(options);

            this.addEventsListener();

            //获取算法列表

            imageReq.getAlgorithms();

            this.bindEvents();
        },

        /**
         * [setImage 左侧树点击事件,设置中间的图片,重新初始化]
         * @author limengmeng
         * @date   2014-10-29
         * @param  {[json]}   data [返回当前选择图片的相关信息]
         */
        setImage: function(data) {

            // 如果data不存在获取当前选中节点的数据
            // 如果没有选中节点 选中第一个节点
            if (!data) {
                var liEl = jQuery("#resourceTreePanel ul li.active");
                if (liEl.size() === 0) {
                    return;
                };
                jQuery('#targetImg').show();
                data = {
                    id: liEl.attr("data-id"),
                    fileName: liEl.attr("data-name"),
                    filePath: liEl.attr('data-filepath'),
                    fileType: liEl.attr('data-filetype'),
                    localPath: liEl.attr("data-videothumbnail"),
                    cid: liEl.attr("data-cid"),
                    pid: liEl.attr("data-pid")
                };
            };

            var self = this;
            self.passData = data;

            //去掉请选择文件背景
            jQuery("#main_right_image .image_content .image_area").css({
                "background": "url()"
            });

            // 加载图片要处理的图片
            self.getImage(data.localPath).done(function() {
                var picture = jQuery('#targetImg'),
                    id = picture.attr('data-id'),
                    moduleActive = jQuery('.basic_editing .module.open');

                jQuery('#main_right_image').removeClass('image_main_right');
                //图片处理过未添加到历史记录都给出提示.
                if (id && self.curProcessId && id !== self.curProcessId && !self.isInHistoryList(picture.attr('src').trim())) {
                    self.confirmDialog(moduleActive, false, data);
                    return;
                } else {
                    self.setInit(data);
                };
            });

        },
        /**
         * [getImage 获取图片，如果图片已缓存直接返回，不存在则加载]
         * @author zhangepngfei
         * @date   2014-10-28
         * @param  {[string]}   path [图片地址]
         * @return {[object]}        [jQuery.Deferred().promise() 对象]
         */
        getImage: function(path) {
            if (!path) {
                return
            };

            var self = this,
                dtd = jQuery.Deferred(),
                loadedImg,
                img,
                picture = jQuery('#targetImg'),
                uiloading = jQuery(".image_area #loading");

            loadedImg = self.imgLoadedList.get(path);

            if (loadedImg === null) {
                picture.hide();
                uiloading.show();

                img = new Image();
                img.src = path;
                img.onload = function() {
                    picture.show();
                    uiloading.hide();

                    self.imgLoadedList.set(path, img);
                    dtd.resolve(img);
                };
            } else {
                dtd.resolve(loadedImg);
            };

            return dtd.promise();
        },

        //
        /**
         * [setInit 设置当前图片的信息]
         * @author limengmeng
         * @date   2014-10-29
         * @param  {[json]}   data [当前图片信息json]
         */
        setInit: function(data) {
            var self = this,
                picture = jQuery('#targetImg'),
                orginImg = jQuery('#orginImg'),
                oldImg = jQuery('#oldImg');

            if (data) { //传参data,从左侧树传过来的数据,更新图片显示.
                picture.attr('src', data.localPath);
                picture.attr('data-id', data.id);
                picture.attr('data-name', data.fileName);
                picture.attr('data-pfsUrl', data.filePath);
                picture.attr('data-filetype', data.fileType);

                orginImg.attr('src', data.localPath);
                orginImg.attr('data-id', data.id);
                orginImg.attr('data-cid', data.cid);
                orginImg.attr('data-pid', data.pid);

                oldImg.attr('data-imgurl', data.localPath);
                oldImg.attr('data-id', data.id);
                oldImg.attr('data-name', data.fileName);
                oldImg.attr('data-pfsUrl', data.filePath);

                jQuery(".history_image em.snapshot").text(data.fileName);

                self.imgName = picture.attr("data-name");
            }

            //初始化当前id
            self.curProcessId = picture.attr('data-id');
            self.curProcessImg = picture.attr('src');
            self.beforeProcessId = picture.attr('data-id');
            self.beforeProcessImg = picture.attr('src');

            // 重置最后一次处理图片信息为空
            self.lastTargetImg = null;
            self.zoomed =false;

            //在对比状态更换图片,让状态改为非对比状态
            self.compareStatus = 1;
            if (window.mask !== undefined) {
                window.mask.hideMask();
            }
            orginImg.hide();
            jQuery('#imgCompare').removeClass('active');

            //图片原始尺寸置空
            this.oldOriginalBounds = [];
            self.oldImgId = orginImg.attr('data-id');
            self.getOriginImage(orginImg.attr('src'));

            // 隐藏快照列表
            self.hideHistory();
            // // 如果已经打开快照列表 重新获取新的快照列表
            // if (jQuery('.history_image').hasClass("active")) {
            //     // 获取快照列表
            //     imageReq.getHistoryList({
            //         oldImageId: self.oldImgId
            //     });
            // };

            //视图库图片详情点击图像处理,入库只能存为结构化信息.'存为图片'隐藏
            if (data.source && data.source === 'viewlib') {
                jQuery(".view_btn ul.drop-menu li:lt(1)").hide();
            } else {
                jQuery(".view_btn ul.drop-menu li:lt(1)").show();
            };

            // 判断右侧是否有已打开面板
            // 如果是恢复默认值，此处触发两次点击事件，可使值恢复初始值
            // 如果否默认打开第一个
            if (jQuery(".control_panel .control_item.active .module-head").hasClass('active')) {
                jQuery(".control_panel .control_item.active .module-head.active").trigger("click").trigger("click");
            } else {
                jQuery(".control_panel .control_item.active .module-head").first().trigger("click");
            };

        },
        // 隐藏快照列表
        hideHistory: function() {
            jQuery('.history_image').removeClass('active');
            jQuery(".image_content").css("bottom", "34px");
        },
        // 记录日志
        /**
         * [log 记录日志]
         * @author limengmeng
         * @date   2014-10-29
         * @param  {[string]}   description [日志描述]
         * @return {[]}               []
         */
        log: function(description) {
            logDict.insertMedialog('m5', description, "f17");
        },
        //添加监听事件
        addEventsListener: function() {
            var self = this;
            //获取算法列表
            PubSub.subscribe('getAlgorithms', function(msg, data){
                self.algorithmsList = data.algorithms;
            })

            //处理中
            PubSub.subscribe('processing', function (msg) {
                var loading = jQuery('#loading');
                var picture = jQuery('#targetImg');
                picture.hide();
                loading.show();
                window.mask.showMask();

                // 判断是否需要隐藏画布
                if ($(".module-head.ts").hasClass("active")) {
                    self.hideTsPaper();
                }

                if (self.timeoutTimer < 120) { // 递归检测 60秒 60000/500=120
                    self.imgLoadTimer = setTimeout(self.checkProcessStatus.bind(self), 500); // 递归检测
                } else {
                    PubSub.publish('processFail');
                }
            });

            //处理成功
            PubSub.subscribe('processed' , function(msg){
                if (self.imgLoadTimer !== null) {
                    clearTimeout(self.imgLoadTimer);
                    self.imgLoadTimer = null;
                }
                var picture = jQuery('#targetImg');
                var loading = jQuery('#loading');
                picture.show();
                loading.hide();
                window.mask.hideMask();
                if (jQuery('.motion_fuzzy .switch').is('.on')) {
                    jQuery('#diskHolder').show();
                }

                self.timeoutTimer = 0;

                picture.attr('src', self.picProcessRes.imageUrl.trim());
                picture.attr('data-name', self.picProcessRes.imageName);
                picture.attr('data-id', self.picProcessRes.id);
                picture.attr('data-pfsUrl', self.picProcessRes.imagePFSUrl);

                // 记录最后一次处理的图片信息 排除图片缩放
                if (!self.picProcessRes.imgsf) {
                    self.lastTargetImg = {
                        'src': self.picProcessRes.imageUrl.trim(),
                        'name': self.picProcessRes.imageName,
                        'id': self.picProcessRes.id,
                        'pfsUrl': self.picProcessRes.imagePFSUrl
                    };
                };


                //裁剪成功后,将新的图片放入历史记录
                if (self.picProcessRes.cut) {
                    self.curProcessId = self.picProcessRes.id;
                    self.curProcessImg = self.picProcessRes.imageUrl;
                    self.beforeProcessId = self.picProcessRes.id;
                    self.beforeProcessImg = self.picProcessRes.imageUrl;

                    //点击确定,收起module
                    jQuery('.cut_img').removeClass('active');
                    jQuery('.cut_img').next('dd').removeClass('active open');

                    imageReq.addHistoryRecord({
                        id: self.picProcessRes.id,
                        oldImageId: self.oldImgId
                    });
                }
                //图片处理成功,重新获取其尺寸
                self.getOriginImage(self.picProcessRes.imageUrl).done(function() {
                    // 判断是否要显示画布
                    if ($(".ImageCorrect").is(":visible") && $(".module-head.ts").hasClass("active")) {
                        self.showTsPaper();
                    }
                });
            });
            //处理失败
            PubSub.subscribe('processFail', function (msg) {
                if (self.imgLoadTimer !== null) {
                    clearTimeout(self.imgLoadTimer);
                    self.imgLoadTimer = null;
                    self.timeoutTimer = 0;
                }
                self.cancelProcess();
            });
            //添加到历史记录成功
            PubSub.subscribe('addHistory', function(msg, data){
                var param = data.args;
                var data = data.data;
                // 如果已经打开快照列表 重新获取新的快照列表
                if (jQuery('.history_image').hasClass("active")) {
                    // 获取快照列表
                    imageReq.getHistoryList({
                        oldImageId: self.oldImgId
                    });
                }
                // 如果没打开直接打开 也会重新加载列表
                else {
                    if (param.oldImageId === self.oldImgId) {
                        jQuery('.history_image span').trigger('click');
                    }
                }

                self.updateScrollBar();

                if(self.cutInFuzzy){
                    jQuery(".main_nav a").not($('.current')).trigger('click');
                    notify.success('截图成功！');
                    self.cutInFuzzy = false;
                }else{
                    notify.success('添加到快照列表成功！');
                }
            });
            //获取历史记录列表
            PubSub.subscribe('getHistoryList', function(msg, data){
                if (!data.imageList.length) {
                    jQuery("#saveHistory").addClass('hidden');
                    jQuery("#clearHistory").addClass('hidden');
                } else {
                    jQuery("#saveHistory").removeClass("hidden");
                    jQuery("#clearHistory").removeClass("hidden");
                };
                jQuery.when(Toolkit.loadTempl('/module/imagejudge/resource-process/inc/historyRecord.html')).done(function(templateSrc) {
                    if (templateSrc instanceof Array) {
                        templateSrc = templateSrc[0];
                    }
                    self.historyList = data.imageList;

                    var template = Handlebars.compile(templateSrc);
                    jQuery('.history_image_list ul').html(template(data));

                    var count = jQuery('.history_image_list ul li').length;
                    var hisWidth = count * 110;
                    jQuery('.history_image_list ul').width(hisWidth);
                    jQuery('.history_image_list div.overview').width(hisWidth + 10);

                    self.addScrollbar();
                });
            });
            //获取单个历史记录
            PubSub.subscribe('getHistoryItem', function(msg, data) {
                jQuery('#targetImg').attr('src', data.image.imageUrl);
                jQuery('#targetImg').attr('data-id', data.image.id);
                jQuery('#targetImg').attr('data-name', data.image.imageName);
                jQuery('#targetImg').attr('data-pfsurl', data.image.path);
                //将选中的历史记录列表内容赋值给原图，意为将选中的图片作为原图
                jQuery('#orginImg').attr('src', data.image.imageUrl);
                jQuery('#orginImg').attr('data-id', data.image.id);
                jQuery('#orginImg').attr('data-name', data.image.imageName);
                jQuery('#orginImg').attr('data-pfsurl', data.image.path);
                self.curProcessId = data.image.id;
                self.curProcessImg = data.image.imageUrl;
                self.beforeProcessId = data.image.id;
                self.beforeProcessImg = data.image.imageUrl;
                self.getOriginImage(data.image.imageUrl).done(function() {
                    // 打开合并选项 恢复默认值
                    jQuery('.module.open').prev().trigger('click').trigger("click");
                });
            });
            //删除历史记录的一项
            PubSub.subscribe('deleteHistoryItem', function(message, data) {
                var siblings = data.li.siblings();
                var id = data.li.attr('data-id');
                if (siblings.length === 0) {
                    jQuery('.history_image span').triggerHandler('click');
                    jQuery('#oldImg').triggerHandler('click');
                    jQuery("#saveHistory").addClass('hidden');
                    jQuery("#clearHistory").addClass('hidden');
                } else {
                    var next = data.li.next('li');
                    var result = next.length > 0 ? next : data.li.prev('li');
                    result.trigger('click');
                }
                data.li.fadeOut(function() {
                    data.li.remove();
                    self.updateScrollBar();
                });
                self.updateHistoryList('delete', parseInt(id));
            });

            //清空历史记录
            PubSub.subscribe('clearHistory', function(msg, data) {
                jQuery("#saveHistory").addClass('hidden');
                jQuery("#clearHistory").addClass('hidden');
                jQuery('.history_image_list .history_item').each(function(index, element) {
                    jQuery(element).remove();
                });

                self.updateScrollBar();
                self.updateHistoryList('deleteAll');

                var picture = jQuery('#targetImg');
                //使当前curProcessId,beforeProcessId 和 显示id相同,这样就不会出现'是否应用当前修改'弹框.
                self.curProcessId = picture.attr('data-id');
                self.beforeProcessId = picture.attr('data-id');

                jQuery("#oldImg").triggerHandler('click');
                jQuery('.history_image').removeClass('active');
                jQuery(".image_content").css("bottom", "34px");
                jQuery(window).resize();
            });


            //图片处理
            PubSub.subscribe('picProcess', function(msg, data){
                self.picProcessRes = data;
                self.cimgName = data.imageName;
                if (self.jcrop_api) {
                    jQuery('#cut_cancle').triggerHandler('click');
                }
                if (data.current) {
                    self.curProcessId = data.id;
                    self.curProcessImg = data.imageUrl.trim();
                }
                self.checkProcessStatus();
            })

            //保存到云空间后
            self.addEvent('save2clound', function(data) {
                self.passData.notSave = false; //保存成功后,设为false,表示已保存
                var type = data.data.type;
                var id = data.data.id;
                var cId = data.cId;
                var pId = data.pId;
                var sourceId = data.sourceId;
                var name = data.name;
                var dialogYUN = new ConfirmDialog({
                    title: '保存到云端地址',
                    message: "<div class='dialogContent'><div class='icon'></div><i class='icon1'></i><div class='detail'><span class='opera'>已完成保存到云端操作！</span><br/><span class='detail_word'><a href='/module/iframe/?windowOpen=1&iframeUrl=/module/cloudbox?type=" + type + "&id=" + id +"&cId=" + cId + "&pId=" + pId + "&sourceId=" + sourceId + "&name=" + name + "&title=image" +"' target='_blank'>点此处查看详情</a></span></div><div class='dialog_btn'><input type='button' class='close ui button blue input-submit' value='关闭本页'></div></div>",
                    showFooter: false
                });
                dialogYUN.find('.close').on('click', function() {
                    dialogYUN.hide();
                });
            });

        },
        //检查处理状态
        checkProcessStatus: function() {
            var self = this;
            self.timeoutTimer++;
            imageReq.getProcessStatus(self.picProcessRes.id);
        },
        /**
         * [getOriginImage 获取原图片尺寸]
         * @author zhangepngfei
         * @date   2014-10-28
         * @param  {[string]}   path [图片地址]
         * @return {[object]}        [jQuery.Deferred().promise() 对象]
         */
        getOriginImage: function(path) {
            var self = this;
            path = path ? path : self.curProcessImg;
            return self.getImage(path).done(function(orginImg) {

                if (self.oldOriginalBounds.length === 0) {
                    self.oldOriginalBounds = [orginImg.width, orginImg.height];
                };

                self.originalBounds = [orginImg.width, orginImg.height];

                //如果compareTarget存在,点击快照,compartTarget高宽随之改变
                if (self.compareTarget) {
                    self.compareTarget.width = orginImg.width;
                    self.compareTarget.height = orginImg.height;
                };

                jQuery(window).trigger("resize");
            });
        },
        //
        /**
         * [isOverBoundary 判断图片原始尺寸是否符合调节]
         * @author limengmeng
         * @date   2014-10-29
         * @param  {[int]}   width  [能够调节的最大宽度]
         * @param  {[int]}   height [能够调节的最大高度]
         * @return {Boolean}         [返回是否符合调节条件]
         */
        isOverBoundary: function(width, height) {
            var self = this;
            if (self.originalBounds[0] <= width && self.originalBounds[1] <= height) {
                return true;
            } else {
                return false;
            };
        },

        //事件绑定
        bindEvents: function() {
            var self = this;
            permission.reShow();

            //图像处理菜单效果
            self.horizontalMenu();

            //右侧菜单手风琴效果
            self.foldMenu();

            /*基础编辑 start*/

            //窗口大小变化
            self.windowResize();

            //旋转角度滑块
            self.rotatSlider();

            //剪裁功能
            self.imgCrop();

            //对比
            self.imgCompare();
            //点击原图
            self.backToOriginalImg();

            //图像缩放
            self.imgSF();
            /*基础编辑 end*/

            /*历史记录*/
            self.historyRecord();

            /*图像增强*/
            self.addImgEnhanceSlider();

            /*锐化*/
            self.sharpenSlider();

            /*颜色处理*/
            self.colorProcessing();

            /*中值滤波去噪*/
            self.addFilterSlider();

            /*图像校正*/
            self.imageCorrectSlider();
            self.perspectiveCorrection();

            /*运动模糊*/
            self.addFuzzyProcess();

            /*去雾*/
            self.defog();
            /* 形态学 */
            self.morphErosionSilider();
            /*图像滤波*/
            self.addImgFilter();

            /* 保存 入库 */
            self.saveOrInlib();

            self.sharpenOrHidden();
            self.saveAllPic();
            self.explainToggle();

            /** 图像复原 */
            self.picRecoverySlider();
            /** 色彩分离 */
            self.colorSeparateSlider();
            /**移行*/
            self.moveRowSlider();
            /**奇偶场*/
            self.oddEvenSlider();
            /**单帧超分*/
            self.overDpiSlider();
        },
        /**
         * 换图像处理操作解释div隐藏和显示
         */
        explainToggle : function(){
            $('.editReminder .editExplainImg').click(function(){
                $('.editReminder').addClass('hidden');
                $('.editExplainImgHide').removeClass('hidden');
            });
            $('.editExplainImgHide').click(function(){
                $('.editExplainImgHide').addClass('hidden');
                $('.editReminder').removeClass('hidden');
            })
        },
        /*
         * 全部保存
         */
        saveAllPic: function() {
            var self = this;
            jQuery(document).on("click", "#saveHistory", function() {
                var id = jQuery("#oldImg").attr("data-id");
                var dialogTip = new ConfirmDialog({
                    title: '提示',
                    message: "确定全部保存处理后的图片？",
                    callback: function() {
                        jQuery.ajax({
                            url: "/service/pcm/image/" + id + "?originId=" + (self.passData.cid||self.passData.pid),
                            type: "get",
                            dataType: "json",
                            success: function(res) {
                                if (res && res.code === 200) {
                                    notify.success(res.data.message);
                                } else {
                                    notify.error(res.data.message);
                                }
                            }
                        });
                    }
                });
            });

        },
        /*保存 or 入库*/
        saveOrInlib: function() {
            var self = this;
            // 保存图片
            jQuery(".view_btn .save-image").click(function() {
                if (!self.curProcessId) {
                    notify.warn("请先选择图片!");
                    return false;
                };
                var picture = jQuery("#targetImg");
                var orginImg = jQuery('#orginImg');
                var cid = self.passData.cid;
                var pid = self.passData.pid;
                var sourceId = jQuery("#resourceTreePanel ul li.active").attr("data-id");
                var cId = jQuery("#resourceTreePanel ul li.active").attr("data-cid");
                var pId = jQuery("#resourceTreePanel ul li.active").attr("data-pid");
                var name = jQuery("#resourceTreePanel ul li.active").attr("data-name");
                if (picture.attr('data-filetype') === '2') {
                    var param = {
                        "originId": cid||pid,
                        "originName": jQuery('#oldImg').attr('data-name'),
                        "path": picture.attr("data-pfsurl"),
                        "name": picture.attr('data-name'),
                        'fileType': '2'
                    };
                    jQuery.ajax({
                        url: '/service/pcm/add_handle_image',
                        type: 'post',
                        dataType: 'json',
                        data: param,
                        success: function(res) {
                            if (res && res.code === 200) {
                                var cname = self.cimgName === undefined ? "" : self.cimgName;
                                self.log("“" + self.imgName + "”的处理结果“" + cname + "”保存到云空间");

                                self.fireEvent('save2clound', {
                                    data : res.data,
                                    sourceId : sourceId,
                                    cId : cId,
                                    pId : pId,
                                    name : name
                                });
                            } else {
                                notify.warn('图片保存失败！');
                            }
                        }
                    });
                }
            });

            // 入库按钮
            jQuery(".view_btn a.inlib").click(function() {
                if (!self.curProcessId) {
                    notify.warn("请先选择图片!");
                    return false;
                };
                //jQuery(".view_btn ul.drop-menu").toggle();
                // 图片入新的视图库 by songxj 2016/04/08
                require(["pvbEnterLib"], function(EnterLib) {
                    var imgOriginName = jQuery("#resourceTreePanel").find("li.leaf[data-id='" + self.oldImgId + "']").find("span").text();
                    var imgObj = {
                        type: "img",
                        filePath: jQuery("#targetImg").attr("src"),
                        resourceObj: {
                            fileName: imgOriginName
                        }
                    };
                    EnterLib.init(imgObj);
                });
            });

            jQuery(".view_btn ul>li:eq(1)").click(function() {
                jQuery(this).toggleClass("close");
                jQuery(this).find("b").toggleClass("icon_downarrow icon_uparrow");
                jQuery(".view_btn ul>li:gt(1)").toggle();

            });

            // 处理
            jQuery(".view_btn ul.drop-menu li[data-type]").click(function() {
                var picture = jQuery("#targetImg"),
                    orginImg = jQuery('#orginImg'),
                    path = jQuery("#targetImg").attr("src"),
                    backPath = jQuery("#targetImg").attr("data-pfsurl");
                window.typeData = jQuery(this).attr('data-type');
                var originName = jQuery("#resourceTreePanel").find("li.leaf[data-id='" + self.oldImgId + "']").find("span").text();
                if (window.typeData === "image") { //存为图片
                    var data = {
                        "cloudId": orginImg.attr("data-cid"),
                        "mediaPath": path,
                        "path": backPath,
                        "shootTime": "",
                        "source": 'unviewlib',
                        "fileType": "2",
                        "originName": originName
                    };
                    //图片未处理
                    if (picture.attr("src") === orginImg.attr('src')) {
                        if (!orginImg.attr("data-cid")) {
                            notify.warn("图片已在视图库中！");
                        } else {
                            $.ajax({
                                url: "/service/pcm/storage/source/exist",
                                type: "get",
                                async: false,
                                data: {
                                    "sourceId": orginImg.attr("data-cid")
                                },
                                dataType: "json",
                                success: function(res) {
                                    if (res.code === 200) {
                                        if (res.data.flag) {
                                            notify.warn("图片已在视图库中！");
                                            return;
                                        } else {
                                            // 设置cookie传值
                                            Cookie.dispose('data');
                                            Cookie.write('data', JSON.stringify(data));
                                            window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/"+"viewlibs/toMediaLib/update_image_bak.html");
                                        }

                                    }
                                }
                            });
                        }
                    } else {
                        // 设置cookie传值
                        Cookie.dispose('data');
                        Cookie.write('data', JSON.stringify(data));
                        window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/"+"viewlibs/caselib/create_image_bak.html");
                    }
                } else { //存为结构化信息 两种情况:来源是视图库则不需要填写所属视图表单, 其他情况需填写所属视图表单
                    if (self.passData.source && self.passData.source === 'viewlib') { //来源于视图库
                        var imageId = self.passData.imageId; // 国标编码
                        var path = jQuery('#targetImg').attr('src');
                        var shootTime = self.passData.shootTime;
                        shootTime = shootTime ? Toolkit.str2mills(shootTime) : 0;
                        var incidentId = self.passData.incidentId ? self.passData.incidentId : null;

                        window.gMessJson = {
                            "mediaPath": path, //视图路径
                            "shootTime": shootTime, //绝对拍摄时间
                            "path": backPath,
                            "appearTime": shootTime, //绝对标注时间
                            //"imageJson": '', //标志图片json
                            "fileType": "2", //文件类型
                            "medialibId": imageId, //视图库
                            "incidentId": incidentId, //案事件id,
                            "incidentName": self.passData.incidentName,
                            "fileName": self.passData.fileName, //日志需要
                            "source": 'viewlib',
                            "originName": originName,
                            "sourceId": self.passData.pid, //视图库中图片id
                            "base64Pic": jQuery("#targetImg").attr("src") //用于保存结构化信息的picture
                        };

                        window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/"+"viewlibs/caselib/create_" + window.typeData + "_bak.html");

                    } else {
                        //图像处理以后生成的是新图片没有云管理的id存为结构化信息的时候，处理和视图库一样
                        //页面传值 0：视图id 1：视图路径path 2：拍摄时间 3：图片json 4: 资源类型
                        window.gMessJson = {
                            "cloudId": self.passData.cid, //云管理id
                            "mediaPath": path, //视图路径
                            "path": backPath,
                            "shootTime": "", //绝对拍摄时间
                            "appearTime": "", //绝对标注时间
                            "medialibId": "", //视图库id没有
                            "fileType": "2", //文件类型
                            "fileName": self.passData.fileName, //日志需要
                            "imageJson": null,
                            "lable": null,
                            "source": '',//unviewlib
                            "originName": originName,
                            "base64Pic": jQuery("#targetImg").attr("src") //用于保存结构化信息的picture
                        };
                        //若图像未处理需要判断原图是否在视图库中
                        var picture = jQuery("#targetImg");
                        var orginImg = jQuery('#orginImg');
                        //原始图片路径和当前路径相同说明未处理
                        if (picture.attr("src") === orginImg.attr('src')) {
                            if (!orginImg.attr("data-cid")) {
                                $.ajax({
                                    url: "/service/pvd/get_video_info",
                                    type: "get",
                                    async: false,
                                    data: {
                                        "fileType": "2",
                                        "orgId": null,
                                        "id": orginImg.attr("data-pid"),
                                        "rs": 0
                                    },
                                    dataType: "json",
                                    success: function(res) {
                                        if (res.code === 200) {
                                            if (res.data.image) {
                                                window.gMessJson.medialibId = res.data.image.imageId;
                                                window.gMessJson.incidentId = res.data.image.incidentId;
                                                window.gMessJson.incidentName = res.data.image.incidentName;
                                                window.gMessJson.appearTime = res.data.image.shootTime;
                                                window.gMessJson.source = ""; //此时说明图片已在视图库中，不用再入库图片信息
                                                //window.gMessJson.source = 'viewlib';
                                                window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/"+"viewlibs/caselib/create_" + window.typeData + "_bak.html");
                                            } else {
                                                notify.warn(res.data.message);
                                            }

                                        }else{
                                            notify.warn('获取视图信息失败! ' + (res ? res.code ? "状态码: " + res.code : "" : ""));
                                        }
                                    },
                                    error: function(xhr, textStatus, errorThrown) {
                                        // 如果http状态为200，说明后台返回数据成功，但数据格式错误
                                        if (xhr.status === 200) {
                                            notify.warn('获取视图信息失败! 数据格式错误');
                                        }
                                        // 其它状态为HTTP错误状态
                                        else {
                                            (xhr.status !== 0) && notify.warn('获取视图信息失败! HTTP状态码: ' + xhr.status);
                                        };
                                    }
                                });
                            } else {
                                $.ajax({
                                    url: "/service/pcm/storage/source/exist",
                                    type: "get",
                                    async: false,
                                    data: {
                                        "sourceId":orginImg.attr("data-cid") //self.passData.cid
                                    },
                                    dataType: "json",
                                    success: function(res) {
                                        if (res.code === 200) {
                                            if (res.data.flag) {
                                                window.gMessJson.medialibId = res.data.sourceId;
                                                window.gMessJson.incidentId = res.data.incidentId;
                                                window.gMessJson.incidentName = res.data.incidentName;
                                                window.gMessJson.imageJson = res.data.imageJson ? res.data.imageJson : null;
                                                window.gMessJson.originName = originName;
                                                window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/"+"viewlibs/caselib/create_" + window.typeData + "_bak.html");
                                            } else {
                                                window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/"+"viewlibs/toMediaLib/update_" + window.typeData + "_bak.html");
                                            }

                                        }
                                    }
                                });
                            }
                        } else {
                            window.gMessJson.cloudId = null;
                            window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/"+"viewlibs/toMediaLib/update_" + window.typeData + "_bak.html");
                        }
                    }
                }

                jQuery(".view_btn a.inlib").click();
            });
        },

        /**
         * 设置文件类型
         */
        setFileType: function(filetype) {
            jQuery('#targetImg').attr('data-filetype', filetype);
        },
        /*
         * 锐化 显隐 效果
         */
        sharpenOrHidden: function() {
            jQuery("#main_right_image .auto_sharpen_button").on("click", function() {
                var dom = jQuery(this).closest(".module").find(".sharpen_filter:first");
                if (!jQuery(this).prop("checked")) {
                    dom.css("display", "block");
                } else {
                    dom.css("display", "none");
                }
            });
        },

        /**
         * [getAlgorithm 获取算法]
         * @author limengmeng
         * @date   2014-10-29
         * @param  {[string]}   name [算法名称]
         * @return {[object]}        [当前算法]
         */
        getAlgorithm: function(name) {
            var self = this;
            var result = '';
            for (var i = 0; i < self.algorithmsList.length; i++) {
                var algorithm = self.algorithmsList[i];
                if (algorithm.algorithmName === name) {
                    result = algorithm;
                    break;
                }
            }
            return Object.clone(result);
        },

        /**
         * [getImgSize 获取图片大小并判断调节大小]
         * @author limengmeng
         * @date   2014-10-29
         * @return {[]}   []
         */
        getImgSize: function() {
            var self = this,
                width = jQuery('.image_area').width(),
                height = jQuery('.image_area').height(),
                path = jQuery('#targetImg').attr('src');

            self.displayBounds = [width, height];
        },

        /**
         * [setImgCenter 当前显示图片添加拖动标形，并使其居中]
         * @author limengmeng
         * @date   2014-10-29
         * @param  {[object]}   bounds [图片应该显示的比例]
         */
        setImgCenter: function(bounds) {
            var self = this;
            var targetImg = jQuery('#targetImg');
            targetImg.css({
                width: bounds[0],
                height: bounds[1],
                cursor: "move",
                left: Math.round((self.displayBounds[0] - bounds[0]) / 2),
                top: Math.round((self.displayBounds[1] - bounds[1]) / 2)
            });
            if ($(".ImageCorrect").is(":visible") && $(".module-head.ts").hasClass("active")) {
                self.showTsPaper();
            }
        },

        //窗口大小改变时调用
        windowResize: function() {
            var self = this;
            jQuery(window).on('resize', function() {
                if (self.compareStatus === 1) {
                    self.imgZoom();
                } else {
                    self.compare();
                }
            });
        },

        /**
         * [imgZoom 对图形进行缩放处理]
         * @author limengmeng
         * @date   2014-10-29
         * @return {[]}   []
         */
        imgZoom: function() {
            var self = this,
                picture = jQuery('#targetImg'),
                width = jQuery('.image_area').width(),
                height = jQuery('.image_area').height();
            self.displayBounds = [width, height];

            var bounds = [],
            //显示尺寸和原始图片的比例 宽比例xr  高比例yr
                xr = self.displayBounds[0] / self.originalBounds[0],
                yr = self.displayBounds[1] / self.originalBounds[1];

            //取宽比例和宽比例中的较小值
            var xmin = xr < 1 ? xr : 1,
                ymin = yr < 1 ? yr : 1,
                r = xmin < ymin ? xmin : ymin;

            //图片应显示的比例
            bounds[0] = r < 1 ? self.originalBounds[0] * r : self.originalBounds[0];
            bounds[1] = r < 1 ? self.originalBounds[1] * r : self.originalBounds[1];

            //让图片居中且设置图片宽高
            self.setImgCenter(bounds);

            //图片在页面显示最小值
            var minVal = Math.round(r * 100),
                sliderObj = jQuery("#zoomSlider"),
                val = '';

            sliderObj.slider({
                range: 'min',
                max: 300,
                min: minVal,
                value: minVal,
                step: 1,
                slide: function() {
                    if (self.compareStatus === 2) { //对比情况
                        sliderObj.slider("disable");
                    } else {
                        sliderObj.slider("enable");
                        val = jQuery(this).slider('value');
                        jQuery(this).closest('.view').find('em').html(val + '%');
                        self.setImgCenter([self.originalBounds[0] * val / 100, self.originalBounds[1] * val / 100]);
                    }
                },
                change: function() {
                    if (self.compareStatus === 2) { //对比情况
                        sliderObj.slider("disable");
                    } else {
                        sliderObj.slider("enable");
                        val = jQuery(this).slider('value');
                        jQuery(this).closest('.view').find('em').html(val + '%');
                        self.setImgCenter([self.originalBounds[0] * val / 100, self.originalBounds[1] * val / 100]);
                    }
                }
            });

            jQuery(document).on("mouseleave", '.image_area', function() {
                if (picture.is('.ui-draggable')) {
                    picture.draggable("destroy");
                }
            });
            jQuery(document).on("mouseenter", '.image_area', function() {
                if (self.compareStatus === 1) {
                    self.imgDraggable(picture);
                }
            });

            //比例值初始化
            sliderObj.closest('.view').find('em').html(sliderObj.slider('value') + '%');

            //点击缩小放大按钮
            jQuery('.view_control i').on('click', function() {
                var type = parseInt(jQuery(this).data('type')),
                    oldVal = jQuery("#zoomSlider").slider('value'),
                    newVal = oldVal + 1 * type;

                if ((oldVal <= minVal && type === -1) || (oldVal >= 300 && type === 1)) {
                    return false;
                }

                jQuery("#zoomSlider").slider('value', newVal);
                jQuery("#zoomSlider").closest('.view').find('em').html(newVal + '%');
            });

            //自适应
            jQuery('#adaptTo').on('click', function() {
                if ($(this).hasClass("disabled")) {
                    return false;
                };

                jQuery('#targetImg').css({
                    width: bounds[0],
                    height: bounds[1]
                });
                sliderObj.slider('value', minVal);
            });

            $(document).on("mousewheel", "#targetImg", function(event, delta) {
                event.preventDefault();
                self.handleMouseWheel(delta * 10, minVal);
            });
        },
        getImagePercent : function(){
            var percent = jQuery("#zoomSlider").closest('.view').find('em').text();
            return parseInt(percent.substring(0, percent.length-1))
        },
        imgDraggable: function(img) {
            var self = this;
            img.draggable({
                drag: function(event, ui) {
                    self.targetImgPaper.css({
                        top: ui.position.top,
                        left: ui.position.left
                    });
                }
            });
        },

        /**
         * [handleMouseWheel 滚轮事件]
         * @author limengmeng
         * @date   2014-10-29
         * @param  {[int]}   wheelDelta [鼠标滚动属性中滚动值]
         * @param  {[int]}   minVal     [滚动最小值]
         * @return {[]}              []
         */
        handleMouseWheel: function(wheelDelta, minVal) {
            var self = this,
                oldVal = jQuery("#zoomSlider").slider('value'),
                newVal = oldVal + wheelDelta;
            if ((oldVal <= minVal && wheelDelta < 0) || (oldVal >= 300 && wheelDelta > 0)) {
                return false;
            }

            if (newVal < minVal) {
                newVal = minVal;
            }
            if (newVal > 300) {
                newVal = 300;
            }
            if (self.compareStatus === 1) {
                jQuery("#zoomSlider").slider('value', newVal);
                jQuery("#zoomSlider").closest('.view').find('em').html(newVal + '%');
            }
        },

        /*基础编辑  Start*/

        /**
         * [rotatSlider 旋转图片]
         * @author limengmeng
         * @date   2014-10-29
         * @return {[]}   []
         */
        rotatSlider: function() {
            var self = this;
            jQuery("#rotatSlider").slider({
                range: 'min',
                max: 90,
                min: -90,
                value: 0,
                step: 1,
                slide: function() {
                    var val = jQuery(this).slider('value');
                    jQuery('#rotatInput').val(val);
                },
                change: function() {
                    var val = jQuery(this).slider('value');
                    jQuery('#rotatInput').val(val);
                    if (val === 0) {
                        self.cancelProcess();
                    } else {
                        if (val < 0) {
                            val = self.convertDeg(val);
                        }
                        self.rotatReq(val);
                    }
                }
            });

            //输入框改变旋转角度
            jQuery('#rotatInput').on('change', function() {
                var text = jQuery(this).val();

                if (!self.intRange(text, -90, 90, '旋转角度')) {
                    return;
                }

                jQuery('#rotatSlider').slider('value', parseInt(text.trim()));

            }).on('keydown', function(event) {
                if (event.keyCode === 13) {
                    jQuery(this).triggerHandler('change');
                }
            });

            jQuery('.func_rotat a[class$=rotat]').on('click', function() {
                var deg = jQuery(this).data('type'),
                    id = jQuery('#targetImg').attr('data-id'),
                    imageUrl = jQuery('#targetImg').attr('src');

                self.rotatReq(deg, id, imageUrl);
            });
            //镜像
            jQuery('.func_rotat a[class$=mirror]').on('click', function() {
                var type = jQuery(this).data('type'),
                    name = '图像镜像',
                    algorithm = self.getAlgorithm(name),
                    id = jQuery('#targetImg').attr('data-id'),
                    imageUrl = jQuery('#targetImg').attr('src');

                imageReq.pictureProcess({
                    algorithmName: name, //算法名称
                    params: {
                        Type: type
                    },
                    version: algorithm.version,
                    id: id,
                    oldImageId: self.oldImgId,
                    imageUrl: imageUrl,
                    current: true
                });
            });
        },

        //调整旋转角度值
        convertDeg: function(val) {
            return 360 + val;
        },

        //旋转请求
        rotatReq: function(deg, id, imgUrl) {
            var self = this;
            self.log("选择“" + self.imgName + "”图片完成旋转处理操作");

            var name = '图像仿射变换算法',
                algorithm = self.getAlgorithm(name),
                oldImageId = self.oldImgId,
                width = self.originalBounds[0],
                height = self.originalBounds[1],
                argId = self.curProcessId,
                argImg = self.curProcessImg,
                current = false;

            if (id && imgUrl) {
                argId = id;
                argImg = imgUrl;
                current = true; //要替换curProcessId和curProcessImg时传true
            }
            //图片旋转处理
            imageReq.pictureProcess({
                algorithmName: name, //算法名称
                params: {
                    Sx: 1,
                    Sy: 1,
                    Px: Math.round(width / 2),
                    Py: Math.round(height / 2),
                    Pr: Math.round(width / 2),
                    Pc: Math.round(height / 2),
                    Tr: 0,
                    Tc: 0,
                    Phi: parseInt(deg),
                    Interpolation: 'constant'
                },
                version: algorithm.version,
                id: argId,
                oldImageId: oldImageId,
                imageUrl: argImg,
                current: current
            });
        },

        /**
         * [imgSfParams 图片缩放参数]
         * @author limengmeng
         * @date   2014-10-29
         * @param  {[string]}   name   [算法名称]
         * @param  {[json]}   params [算法处理参数]
         * @return {[]}          []
         */
        imgSfParams: function(name, params) {
            var self = this,
                algorithm = self.getAlgorithm(name),
                orginImg = jQuery('#orginImg'),
                id,
                imageUrl;


            //如果图片还没处理过,缩放是按原图（处理是排除自己的，排除缩放本身）
            //如果处理过,缩放是按照处理过的图片进行

            // 图片已经处理过
            if (self.lastTargetImg) {
                id = self.lastTargetImg.id;
                imageUrl = self.lastTargetImg.src;
            }
            // 图片还未处理过
            else {
                id = orginImg.attr('data-id');
                imageUrl = orginImg.attr('src');
            };

            var oldImageId = self.oldImgId;
            imageReq.pictureProcess({
                algorithmName: name, //算法名称			　
                version: algorithm.version,
                params: params,
                id: id,
                oldImageId: oldImageId,
                imageUrl: imageUrl,
                imgsf: true // 标识是否为图片处理
            });

            self.log("选择“" + self.imgName + "”图片完成缩放处理操作");
        },

        /**
         * [imgSF 图片缩放入口]
         * @author limengmeng
         * @date   2014-10-29
         * @return {[type]}   [description]
         */
        imgSF: function() {
            var self = this;
            //选择缩放方式
            jQuery('.sf_type').on('change', function() {
                var arr = jQuery(this).val();
                //缩放方式改变 显示联动
                if (arr === "1:1") {
                    jQuery(".sf_num").css("display", "none");
                    jQuery(".sf_filter").css("display", "block");
                } else {
                    jQuery(".sf_module_active .sf_num input.width").val(self.oldOriginalBounds[0]);
                    jQuery(".sf_module_active .sf_num input.height").val(self.oldOriginalBounds[1]);
                    jQuery(".sf_num").css("display", "block");
                    jQuery(".sf_filter").css("display", "none");
                }
            });

            jQuery("#sf_btn").on("change", function() {
                var val = jQuery(this).val();
                if (!self.intRange(val, 10, 400, '缩放比例')) {
                    return;
                }
                self.sliderMaxSizeDealing =false;
                jQuery("#sf_slider").slider('value', val);
            }).on('keydown', function(event) {
                if (event.keyCode === 13) {
                    jQuery(this).triggerHandler('change');
                }
            });


            //图片缩放滑块
            jQuery("#sf_slider").slider({
                range: 'min',
                max: 400,
                min: 10,
                value: 100,
                step: 10,
                slide: function() {
                    var val = jQuery(this).slider('value');
                    jQuery('#sf_btn').val(val);
                },
                change: function(){
                    if(self.sliderMaxSizeDealing){
                        return;
                    }
                    var name = "图像缩放算法";
                    var val = jQuery(this).slider('value');
                    var imageUrl = '';
                    jQuery('#sf_btn').val(val);
                    if (self.lastTargetImg) {
                        imageUrl = self.lastTargetImg.src;
                    }else{
                        imageUrl = jQuery('#orginImg').attr('src');
                    }

                    if (val === 100) {
                        self.cancelProcess();
                    } else {
                        var vals = Number(val);
                        vals = vals / 100;
                        self.checkImgPixel(imageUrl, vals, name);
                    };
                }
            });

            // 自由比例缩放 宽高控制
            jQuery(".sf_module_active .sf_num input.width,.sf_num input.height").on("change", function() {
                var val = jQuery(this).val();
                var type = jQuery(this).attr("class");

                // 宽度或高度的范围 是原图尺寸的宽度或高度 乘以 10% 和 400%
                var size = self.oldOriginalBounds[(type === "width" ? 0 : 1)];
                if (!self.intRange(val, Math.round(size * 0.1), size * 4, (type === "width" ? "宽度" : "高度"))) {
                    return;
                };

                var widthVal = jQuery(".sf_num .width").val(),
                    heightVal = jQuery(".sf_num .height").val(),
                    name = "图像缩放算法";

                self.imgSfParams(name, {
                    ScaleWidth: Math.max(Number(widthVal / self.oldOriginalBounds[0]), 0.1),
                    ScaleHeight: Math.max(Number(heightVal / self.oldOriginalBounds[1]), 0.1),
                    Interpolation: "constant"
                });
            }).on('keydown', function(event) {
                if (event.keyCode === 13) {
                    jQuery(this).triggerHandler('change');
                }
            });
        },
        //检查当前图片是否可以缩放  可以缩放则进行缩放&&不可以缩放则提示信息
        checkImgPixel: function(imgPath, multiple, name){
           if(imgPath === ''){
               return;
           };
            var self = this;
            $.ajax({
                type : 'GET',
                data : {
                    'imgPath' : imgPath,
                    'multiple' : multiple
                },
                url : '/service/pic/checkImgPixel',
                dataType: "json",
                success : function(data){
                    if(data.code === 200){
                        if(data.data.percent/100 < multiple){
                            //notify.info('当前图片PCC能够处理的最大限度为：'+ data.data.percent + '%');
                            notify.info('图片参数错误');
                            self.sliderMaxSizeDealing =true;
                            jQuery("#sf_slider").slider('value', data.data.percent);
                            self.sliderMaxSizeDealing =false;
                            jQuery('#sf_btn').val(data.data.percent);
                            self.imgSfParams(name, {
                                ScaleWidth: data.data.percent/100,
                                ScaleHeight: data.data.percent/100,
                                Interpolation: "constant"
                            })

                        }else{
                            self.imgSfParams(name, {
                                ScaleWidth: multiple,
                                ScaleHeight: multiple,
                                Interpolation: "constant"
                            })
                        }
                    }else{
                        notify.info(data.data.message);
                    }
                }
            })
        },
        /**
         * [imgCrop 图片裁剪功能]
         * @author limengmeng
         * @date   2014-10-29
         * @return {[]}   []
         */
        imgCrop: function() {
            var self = this;
            //裁剪图片
            jQuery('#basicEdit .module-head.cut_img').on('click', function() {
                if (jQuery(this).hasClass('active')) {
                    jQuery('#targetImg').Jcrop({
                        bgColor: 'black',
                        bgOpacity: 0.5,
                        onChange: self.showSize,
                        onSelect: self.showSize
                    }, function() {
                        self.jcrop_api = this;
                        jQuery('.jcrop-holder').css({
                            left: jQuery('#targetImg')[0].style.left,
                            top: jQuery('#targetImg')[0].style.top
                        });
                        if(self.originalBounds.length !== 0){
                            jQuery('.cut_num .width').off('change');
                            jQuery('.cut_num .height').off('change');
                            self.jcrop_api.setSelect([60, 60, 260, 250]);
                        }
                    });
                }
            });

            //选择裁剪方式
            jQuery('.cut_type').on('change', function() {
                if(!self.jcrop_api){
                    return;
                }
                var arr = jQuery(this).val().split(':'),
                    check = jQuery('.lock_num input'),
                    type = '';

                if (parseInt(arr[0]) === 0) {
                    check.prop('checked', null);
                    self.jcrop_api.setOptions({
                        aspectRatio: 0,
                        sideHandles: true
                    });
                } else {
                    type = parseInt(arr[0]) / parseInt(arr[1]);
                    check.prop('checked', 'checked');
                    self.jcrop_api.setOptions({
                        aspectRatio: type,
                        sideHandles: false
                    });
                }
            });

            //是否锁定裁剪比例
            jQuery('.lock_num input').on('click', function() {
                if(!self.jcrop_api){
                    return;
                }
                var checked = jQuery(this).prop('checked'),
                    free = jQuery('.cut_type').find('.free'),
                    width = jQuery('.cut_num .width').val(),
                    height = jQuery('.cut_num .height').val();

                //checkbox取消勾选,select变成'自由裁剪'
                if (!checked) {
                    free.prop('selected', 'selected');
                }

                //checkbox勾选且select为'自由裁剪',用当前宽高作为比例.
                var flag = checked && free.prop('selected');
                if (flag) {
                    self.cutRatio = width / height;
                }

                self.jcrop_api.setOptions(
                    flag ? {
                        aspectRatio: width / height
                    } : {
                        aspectRatio: 0
                    }
                );
            });

            //填写宽高
            jQuery('.cut_num input').on('change', function() {
                var self = this,
                    ratio = '',
                    another = '',
                    curInput = parseInt(jQuery(this).val().trim()), //当前改变的输入框.
                    clazz = jQuery(this).attr('class'), //当前改变的是宽or高
                    checked = jQuery('.lock_num input').prop('checked'), //锁定比例
                    arr = jQuery('.cut_type').val().split(':'); //裁剪方式
                if(!self.jcrop_api){
                    return;
                }
                if (!self.intRange(jQuery('.cut_num input').eq(0).val(), 24, null, "宽度") ||
                    !self.intRange(jQuery('.cut_num input').eq(1).val(), 24, null, "高度")) {
                    return;
                };

                if (parseInt(arr[0]) === 0 && checked) { //'自由裁剪',裁剪比例锁定 ratio=width/height
                    ratio = self.cutRatio;
                    another = (clazz === 'width') ? Math.round(curInput / ratio) : Math.round(curInput * ratio);
                    jQuery('.' + clazz).siblings('input').val(another);
                } else if (parseInt(arr[0]) === 0 && !checked) {
                    another = parseInt(jQuery('.' + clazz).siblings('input').val());
                } else { //非自由裁剪时用
                    ratio = parseInt(arr[0]) / parseInt(arr[1]);
                    another = (clazz === 'width') ? Math.round(curInput / ratio) : Math.round(curInput * ratio);
                    jQuery('.' + clazz).siblings('input').val(another);
                }

                var coords = (clazz === 'width') ? [60, 60, 60 + curInput, 60 + another] : [60, 60, 60 + another, 60 + curInput];
                self.jcrop_api.setSelect(coords);
            }).on('keydown', function(event) {
                if (event.keyCode === 13) {
                    jQuery(this).triggerHandler('change');
                }
            });

            jQuery('#cut_ok').on('click', function() {
                if(!self.jcrop_api){
                    return;
                }
                var c = self.jcrop_api.tellSelect(),
                    picture = jQuery('#targetImg'),
                    id = jQuery('#targetImg').attr('data-id'),
                    imageUrl = jQuery('#targetImg').attr('src'),
                    oldImageId = self.oldImgId,
                    name = '图像裁剪',
                    algorithm = self.getAlgorithm(name),

                //原始图片高宽
                    ow = self.originalBounds[0],
                    oh = self.originalBounds[1],

                //图片显示的高宽
                    pw = picture.width(),
                    ph = picture.height(),

                    rw = ow / pw,
                    rh = oh / ph,

                //原始图片上的选框
                    oSelectX = Math.round(c.x * rw),
                    oSelectY = Math.round((ph - c.y2) * rh),
                    oSelectWidth = Math.round(c.w * rw),
                    oSelectHeight = Math.round(c.h * rh);

                if (oSelectWidth < 24 || oSelectHeight < 24) {
                    notify.warn('裁剪高宽值需大于24！');
                    return false;
                }
                self.log("选择“" + self.imgName + "”图片完成裁剪处理操作");
                imageReq.pictureProcess({
                    algorithmName: name, //算法名称
                    params: {
                        Row: parseInt(oSelectY),
                        Col: parseInt(oSelectX),
                        Width: parseInt(oSelectWidth),
                        Height: parseInt(oSelectHeight)
                    },
                    version: algorithm.version,
                    id: id,
                    oldImageId: oldImageId,
                    imageUrl: imageUrl,
                    cut: true
                });

            });

            jQuery('#cut_cancle').on('click', function() {
                if (self.jcrop_api) {
                    self.jcrop_api.destroy();
                }
            });
        },

        /*基础编辑  End*/

        /*图片增强 Start*/

        //图片增强
        addImgEnhanceSlider: function() {
            var self = this,
                name = '图像增强';

            jQuery('.color_item').each(function(index, element) {
                var input = jQuery(element).find('input');
                var sliderObj = jQuery(element).find('.common_slider');

                sliderObj.slider({
                    range: 'min',
                    min: -100,
                    max: 100,
                    value: 0,
                    step: 1,
                    slide: function() {
                        input.val(jQuery(this).slider('value'));
                    },
                    change: function() {
                        var algorithm = self.getAlgorithm(name),
                            oldImageId = self.oldImgId,
                            inputs = jQuery(".enhance").find('input');
                        input.val(jQuery(this).slider('value'));
                        var bright = parseInt(jQuery(inputs[0]).val().trim()), //亮度默认值
                            contrast = parseInt(jQuery(inputs[2]).val().trim()), //对比度默认值
                            saturation = parseInt(jQuery(inputs[3]).val().trim()), //饱和度默认值
                            sharpen = parseInt(jQuery(inputs[1]).val().trim()); //清晰度默认值

                        if (bright === 0 && contrast === 0 && saturation === 0 && sharpen === 0) {
                            self.cancelProcess();
                        } else {
                            self.log("选择“" + self.imgName + "”图片完成图像增强处理操作");
                            imageReq.pictureProcess({
                                algorithmName: name, //算法名称
                                params: {
                                    "Bright": bright, //亮度默认值
                                    "Contrast": contrast, //对比度默认值
                                    "Saturation": saturation, //饱和度默认值
                                    "Sharpen": sharpen //清晰度默认值
                                },
                                version: algorithm.version,
                                id: self.curProcessId,
                                oldImageId: oldImageId,
                                imageUrl: self.curProcessImg
                            });
                        }
                    }
                });

                //输入框改变图像增强
                input.on('change', function() {
                    var text = jQuery(this).val();
                    if (!self.intRange(text, -100, 100, '图像增强参数')) {
                        return;
                    }
                    sliderObj.slider('value', parseInt(text.trim()));
                }).on('keydown', function(event) {
                    if (event.keyCode === 13) {
                        jQuery(this).triggerHandler('change');
                    }
                });
            });
        },
        /*图片增强 End*/

        /**
         * [spaceSharpen 空间域锐化]
         * @author limengmeng
         * @date   2014-10-29
         * @param  {[int]}   val1 [锐化强度]
         * @param  {[int]}   val2 [锐化程度]
         * @return {[]}        []
         */
        spaceSharpen: function(val1, val2) {
            if (val1 == 0 || val2 == 0) {
                return;
            };
            var self = this,
                name = "清晰化函数",
                algorithm = self.getAlgorithm(name),
                oldImageId = self.oldImgId;
            imageReq.pictureProcess({
                algorithmName: name, //算法名称			　
                version: algorithm.version,
                params: {
                    MaskWidth: parseInt(val1),
                    MaskHeight: parseInt(val1),
                    Factor: parseInt(val2)
                },
                id: self.curProcessId,
                oldImageId: oldImageId,
                imageUrl: self.curProcessImg
            });
        },
        /*空间锐化 End*/

        /**
         * [sharpenAuto 自适应锐化]
         * @author limengmeng
         * @date   2014-10-29
         * @param  {[int]}   val [锐化强度]
         * @return {[]}       []
         */
        sharpenAuto: function(val) {
            if (val == 0) {
                return;
            };

            var self = this,
                name = "自适应锐化",
                algorithm = self.getAlgorithm(name),
                oldImageId = self.oldImgId;
            imageReq.pictureProcess({
                algorithmName: name, //算法名称			　
                version: algorithm.version,
                params: {
                    Threshold: parseInt(val * 255 / 100)
                },
                id: self.curProcessId,
                oldImageId: oldImageId,
                imageUrl: self.curProcessImg
            });

            self.log("选择“" + self.imgName + "”图片完成自适应锐化处理操作");
        },

        //锐化滚动条
        sharpenSlider: function() {
            var self = this,
                name = '锐化',
                picture = jQuery('#targetImg'),
                sliderObj1 = jQuery("#spLevel .common_slider"),
                input1 = jQuery('.sharpen_filter input').eq(0),
                sliderObj2 = jQuery("#spStrength .common_slider"),
                input2 = jQuery('.sharpen_filter input').eq(1);
            sliderObj1.slider({
                range: 'min',
                min: 0,
                max: 100,
                value: 0,
                step: 1,
                slide: function() {
                    input1.val(jQuery(this).slider('value'));
                },
                change: function() {
                    var val = jQuery(this).slider('value');
                    input1.val(val);
                    if (val === 0) {
                        self.cancelProcess();
                    } else {
                        // 自适应锐化
                        if (jQuery("#main_right_image .auto_sharpen_button").prop("checked")) {
                            var sharpenStrength = jQuery("#sharpenStrength").val();
                            self.sharpenAuto(sharpenStrength);
                        } else { //空间锐化
                            var sharpenLevel = jQuery("#sharpenLevel").val();
                            var sharpenStrength = jQuery("#sharpenStrength").val();
                            self.spaceSharpen(sharpenLevel, sharpenStrength);
                        }

                        self.log("选择“" + self.imgName + "”图片完成锐化处理操作");
                    }
                }
            });

            sliderObj2.slider({
                range: 'min',
                min: 0,
                max: 100,
                value: 0,
                step: 1,
                slide: function() {
                    input2.val(jQuery(this).slider('value'));
                },
                change: function() {
                    var val = jQuery(this).slider('value');
                    input2.val(val);
                    if (val === 0) {
                        self.cancelProcess();
                    } else {
                        // 自适应锐化
                        if (jQuery("#main_right_image .auto_sharpen_button").prop("checked")) {
                            var sharpenStrength = jQuery("#sharpenStrength").val();
                            self.sharpenAuto(sharpenStrength);

                        } else { //空间锐化
                            var sharpenLevel = jQuery("#sharpenLevel").val();
                            var sharpenStrength = jQuery("#sharpenStrength").val();
                            self.spaceSharpen(sharpenLevel, sharpenStrength);
                        }
                    }
                }
            });

            input1.on("change", function() {
                var text = jQuery(this).val();
                if (!self.intRange(text, 0, 100, '锐化')) {
                    return;
                }
                sliderObj1.slider('value', parseInt(text.trim()));
            }).on('keydown', function(event) {
                if (event.keyCode === 13) {
                    jQuery(this).triggerHandler('change');
                }
            });

            input2.on('change', function() {
                var text = jQuery(this).val();
                if (!self.intRange(text, 0, 100, '锐化')) {
                    return;
                }
                sliderObj2.slider('value', parseInt(text.trim()));
            }).on('keydown', function(event) {
                if (event.keyCode === 13) {
                    jQuery(this).triggerHandler('change');
                }
            });

            //使用推荐值
            jQuery(".sharpen a.recommend_value").click(function() {
                var btn = jQuery(this);
                if (btn.attr("data-type") === "sharpen") {
                    // 自适应锐化
                    if (jQuery("#main_right_image .auto_sharpen_button").prop("checked")) {
                        sliderObj2.slider('value', 12);
                    }
                    // 空间锐化
                    else {
                        sliderObj1.slider('value', 7);
                        sliderObj2.slider('value', 50);
                    }
                }
            });

        },
        /*锐化 End*/

        /*颜色处理 Start*/
        colorProcessing: function() {
            var self = this;
            var colorNameArr = ['彩色', '去色', '色调均化', '颜色翻转', '白平衡', '亮度标准化', '亮度翻转'];
            var colorOperArr = ['色彩-灰度转换', '去色', '自动色彩平衡', '反色', '自动白平衡', '亮度拉伸', '亮度反转'];
            jQuery('.colorProcess dd .colorPro').on('click', function() {
                var name = colorNameArr[jQuery(this).data('type')];
                var algorithm = self.getAlgorithm(name);
                var oldImageId = self.oldImgId;
                imageReq.pictureProcess({
                    algorithmName: name, //算法名称			　
                    version: algorithm.version,
                    params: {},
                    id: self.curProcessId,
                    oldImageId: oldImageId,
                    imageUrl: self.curProcessImg
                });

                var operName = colorOperArr[jQuery(this).data('type')];
                self.log("选择“" + self.imgName + "”图片完成" + operName + "处理操作");
            });
        },
        /*颜色处理 End*/

        /*图像校正 Start*/
        /**
         * [lensDistoreCorrection 镜头畸变校正]
         * @author limengmeng
         * @date   2014-10-29
         * @param  {[int]}   val [校正程度]
         * @return {[]}       []
         */
        lensDistoreCorrection: function(val) {
            var self = this,
                name = "镜头畸变校正算法",
                algorithm = self.getAlgorithm(name),
                oldImageId = self.oldImgId;
            imageReq.pictureProcess({
                algorithmName: name, //算法名称			　
                version: algorithm.version,
                params: {
                    CenterRow: self.originalBounds[0] / 2,
                    CenterCol: self.originalBounds[1] / 2,
                    Kappa: parseInt(val * 100),
                    Mode: "fullsize"
                },
                id: self.curProcessId,
                oldImageId: oldImageId,
                imageUrl: self.curProcessImg
            });

            self.log("选择“" + self.imgName + "”图片完成图像镜头畸变校正处理操作");
        },
        //图像校正之镜头畸变校正滚动条
        imageCorrectSlider: function() {
            var self = this;
            var input = jQuery('.ImageCorrect .arbitrary_rotat').find('input');
            var picture = jQuery('#targetImg');
            jQuery("#imageCorrButton").slider({
                range: 'min',
                max: 100,
                min: 0,
                value: 0,
                step: 1,
                slide: function() {
                    var val = jQuery(this).slider('value');
                    input.val(val);
                },
                change: function() {
                    var val = jQuery(this).slider('value');
                    input.val(val);
                    if (val === 0) {
                        self.cancelProcess();
                    } else {
                        self.lensDistoreCorrection(val);
                    }
                }
            }).closest('.image_correct').find(".arbitrary_rotat input").on("change", function() {
                var val = jQuery(this).val();
                if (!self.intRange(val, 0, 100, '校正程度')) {
                    return;
                }
                $(this).closest(".image_correct").find(".sliding_bar .common_slider").slider("value", parseInt(val));
            }).on('keydown', function(event) {
                if (event.keyCode === 13) {
                    jQuery(this).triggerHandler('change');
                }
            });

            //使用推荐值
            jQuery(".ImageCorrect .module .control_btn .btn").on("click", function() {
                var btn = jQuery(this);
                if (btn.attr("data-type") === "lensDisCron") {
                    jQuery("#imageCorrButton").slider('value', btn.attr('data-default'));
                }
            });
        },
        //透视变换校正
        perspectiveCorrection: function() {
            var self = this;
            var name = "图像透视校正算法";
            jQuery("#perspColl").on("click", function() {
                var algorithm = self.getAlgorithm(name);
                var oldImageId = self.oldImgId;
                imageReq.pictureProcess({
                    algorithmName: name, //算法名称			　
                    version: algorithm.version,
                    params: {
                        // pcc的原点是按图片左下角的点,显示的原点是左上角,纵坐标需要转换一下(图片高度-点的纵坐标)
                        Row1: self.originalBounds[1] - (self.tsPaperPointBounds[3].y + self.tsPaperPointBounds[0].height / 2),
                        Col1: self.tsPaperPointBounds[3].x + self.tsPaperPointBounds[0].width / 2,
                        Row2: self.originalBounds[1] - (self.tsPaperPointBounds[2].y + self.tsPaperPointBounds[1].height / 2),
                        Col2: self.tsPaperPointBounds[2].x + self.tsPaperPointBounds[1].width / 2,
                        Row3: self.originalBounds[1] - (self.tsPaperPointBounds[1].y + self.tsPaperPointBounds[2].height / 2),
                        Col3: self.tsPaperPointBounds[1].x + self.tsPaperPointBounds[2].width / 2,
                        Row4: self.originalBounds[1] - (self.tsPaperPointBounds[0].y + self.tsPaperPointBounds[3].height / 2),
                        Col4: self.tsPaperPointBounds[0].x + self.tsPaperPointBounds[3].width / 2
                    },
                    id: self.curProcessId,
                    oldImageId: oldImageId,
                    imageUrl: self.curProcessImg
                });

                self.log("选择“" + self.imgName + "”图片完成图像透视变换校正处理操作");
            });
        },
        showTsPaper: function() {
            var self = this;

            self.targetImg.css({
                cursor: 'default'
            });
            self.targetImgPaper.css({
                visibility: "visible"
            });
            // 获取画布
            self.getTsPaper();
            // 定位画布
            self.setTsPaperSize();
            // 清除画布
            self.tsPaper.clear();
            // 获取要显示点的坐标
            var pointBounds = self.getTsPaperPointBounds();
            // 获取缩放后的点的坐标
            var zoomPointBounds = self.toTsPaperZoomBounds(pointBounds);
            // 画线
            var line = self.tsPaper.path(self.createTsPaperPath(zoomPointBounds)).attr({
                stroke: "red"
            });
            // 画点
            self.tsPaperPoints = [];
            $.each(zoomPointBounds, function(i, bounds) {
                self.tsPaperPoints.push(self.createTsPaperPoint(line, bounds));
            });
        },
        hideTsPaper: function() {
            this.targetImg.css({
                cursor: 'move'
            });
            this.targetImgPaper.css({
                visibility: "hidden"
            });
            this.tsPaperPointBounds = null;
        },
        getTsPaper: function() {
            var self = this;
            if (!self.tsPaper) {
                Raphael.el.pointDraggable = function(onMove) {
                    return this.drag(function(dx, dy, x, y, event) {
                        // this.pOffsetX =  this.attr("width")/ 2;
                        // this.pOffsetY = this.attr("height") / 2;
                        this.attr({
                            x: Math.min(Math.max(this.x0 + dx, 0 /**- this.pOffsetX**/ ), self.targetImg.width() - this.attr("width")),
                            y: Math.min(Math.max(this.y0 + dy, 0 /**- this.pOffsetY**/ ), self.targetImg.height() - this.attr("height"))
                        });
                        onMove && onMove.call(this);
                    }, function(x, y, event) {
                        this.x0 = this.attr("x");
                        this.y0 = this.attr("y");
                    }, function(evt) {});
                };
                self.tsPaper = Raphael("targetImgPaper", self.targetImg.width(), self.targetImg.height());
            };
            return self.tsPaper;
        },
        setTsPaperSize: function() {
            if (this.tsPaper) {
                this.targetImgPaper.css({
                    width: this.targetImg.width(),
                    height: this.targetImg.height(),
                    left: this.targetImg.position().left,
                    top: this.targetImg.position().top
                });
                this.tsPaper.setSize(this.targetImg.width(), this.targetImg.height());
            }
        },
        createTsPaperPoint: function(line, bounds) {
            var self = this;
            return self.tsPaper.rect(bounds.x, bounds.y, bounds.width, bounds.height).attr({
                "stroke": "red",
                "cursor": "move",
                "fill": "red",
                "fill-opacity": 0
            }).pointDraggable(function() {
                // 获取拖动后点的坐标
                self.tsPaperZoomPointBounds = $.map(self.tsPaperPoints, function(point) {
                    return {
                        x: point.attr("x"),
                        y: point.attr("y"),
                        width: point.attr("width"),
                        height: point.attr("height")
                    };
                });
                // 使用拖动后点的坐标重新绘制线
                line.attr("path", self.createTsPaperPath(self.tsPaperZoomPointBounds));
                // 获取不缩放的点的坐标
                self.toTsPaperPointBounds(self.tsPaperZoomPointBounds);
            });
        },
        createTsPaperPath: function(pointBounds) {
            var path = ["M"];
            $.each(pointBounds, function(i, bounds) {
                if (i === 0) {
                    path.push((bounds.x + bounds.width / 2) + "," + (bounds.y + bounds.height / 2));
                } else if (i === 1) {
                    path.push("L" + (bounds.x + bounds.width / 2) + "," + (bounds.y + bounds.height / 2));
                } else {
                    path.push("," + (bounds.x + bounds.width / 2) + "," + (bounds.y + bounds.height / 2));
                }
            });
            path.push("Z");
            return path.join("");
        },
        getTsPaperPointBounds: function() {
            var self = this;
            if (!self.tsPaperPointBounds) {
                var imgWidth = self.originalBounds[0];
                var imgHeight = self.originalBounds[1];
                var pointSize = 10;
                self.tsPaperPointBounds = [{
                    x: 0,
                    y: 0,
                    width: pointSize,
                    height: pointSize
                }, {
                    x: imgWidth - pointSize,
                    y: 0,
                    width: pointSize,
                    height: pointSize
                }, {
                    x: imgWidth - pointSize,
                    y: imgHeight - pointSize,
                    width: pointSize,
                    height: pointSize
                }, {
                    x: 0,
                    y: imgHeight - pointSize,
                    width: pointSize,
                    height: pointSize
                }];
            };
            return self.tsPaperPointBounds;
        },
        toTsPaperZoomBounds: function(pointBounds) {
            var self =this;
            var wr = self.targetImg.width() / self.originalBounds[0];
            var hr = self.targetImg.height() / self.originalBounds[1];
            self.tsPaperZoomPointBounds = $.map(pointBounds, function(bounds) {
                return {
                    x: bounds.x * wr,
                    y: bounds.y * hr,
                    width: bounds.width,
                    height: bounds.height
                };
            });
            return self.tsPaperZoomPointBounds;
        },
        toTsPaperPointBounds: function(viewBounds) {
            var self = this;
            var wr = self.originalBounds[0] / self.targetImg.width();
            var hr = self.originalBounds[1] / self.targetImg.height();
            self.tsPaperPointBounds = $.map(viewBounds, function(bounds) {
                return {
                    x: bounds.x * wr,
                    y: bounds.y * hr,
                    width: bounds.width,
                    height: bounds.height
                };
            });
            return self.tsPaperPointBounds;
        },
        /*图像校正 End*/

        /*噪声处理 Start*/
        //滤波去噪 sliberBar
        addFilterSlider: function() {
            var self = this,
                input = jQuery('.enhance .median_filter').find('input'),
                sliderObj = jQuery('.enhance .median_filter .common_slider'),
                picture = jQuery('#targetImg'),
                val = '';

            sliderObj.slider({
                range: 'min',
                min: 0,
                max: 100,
                value: 0,
                step: 1,
                slide: function() {
                    val = jQuery(this).slider('value');
                    input.val(val);
                },
                change: function() {
                    val = jQuery(this).slider('value');
                    input.val(val);
                    if (val === 0) {
                        self.cancelProcess();
                    } else {
                        self.filterDenoise(val);
                    }
                }
            });

            input.on('change', function() {
                var text = jQuery(this).val();
                if (!self.intRange(text, 0, 100, '处理程度')) {
                    return;
                }
                sliderObj.slider('value', parseInt(text.trim()));

            }).on('keydown', function(event) {
                if (event.keyCode === 13) {
                    jQuery(this).triggerHandler('change');
                }
            });
            //使用推荐值
            jQuery(".enhance a.recommend_value").click(function() {
                var btn = jQuery(this);
                if (btn.attr("data-type") === "filter") {
                    sliderObj.slider('value', btn.attr('data-default'));
                }
            });
        },

        /**
         * [filterDenoise 滤波去噪]
         * @author limengmeng
         * @date   2014-10-29
         * @param  {[int]}   val [处理程度]
         * @return {[]}       []
         */
        filterDenoise: function(val) {
            var self = this;
            if(self.checkImgSize(1280,720,'噪声处理')){
                var self = this,
                    name = '中值滤波去噪',
                    algorithm = self.getAlgorithm(name);
                // var id = jQuery('#targetImg').attr('data-id');
                // var imageUrl = jQuery('#targetImg').attr('src');
                var oldImageId = self.oldImgId;
                self.log("选择“" + self.imgName + "”图片完成噪声处理操作");
                imageReq.pictureProcess({
                    algorithmName: name, //算法名称			　
                    version: algorithm.version,
                    params: {
                        MaskWidth: parseInt(val),
                        MaskHeight: parseInt(val)
                    },
                    id: self.curProcessId,
                    oldImageId: oldImageId,
                    imageUrl: self.curProcessImg
                });
            }
        },
        /*噪声处理 End*/

        /*模糊处理 Start*/
        //模糊处理
        addFuzzyProcess: function() {
            var self = this;
            // 方向slider
            var angleInput = jQuery(".enhance input.director");
            angleInput.show();
            var fuzzyInput = jQuery(".enhance input.fuzzy-value"),
                focusInput = jQuery(".enhance input.focus-value"),
            //模糊输入框和slider
                inputs = jQuery('.fuzzy .fuzzy_item input'),
                sliderObjs = jQuery('.fuzzy .fuzzy_item .common_slider');

            var directorSlider = jQuery(".enhance .common_slider.director");
            directorSlider.show();
            var fuzzySlider = jQuery(".enhance .common_slider.fuzzy-value"),
                focusSlider = jQuery(".enhance .common_slider.focus-value"),
                switchBtn = jQuery('.motion_fuzzy .switch'),
                diskHolder = jQuery("#diskHolder");

            // 开关
            switchBtn.on('click', function() {
                jQuery(this).toggleClass('off on');
                if (jQuery(this).is('.on')) {
                    angleInput.show();
                    directorSlider.show();
                    diskHolder.show();
                    self.showDisk(0);
                } else {
                    diskHolder.hide();
                    angleInput.val(0);
                    directorSlider.slider("value", 0);
                }
            });

            angleInput.on('change', function() {
                var text = jQuery(this).val();
                if (!self.intRange(text, -90, 90, '运动方向')) {
                    return;
                }
                directorSlider.slider('value', parseInt(text.trim()));
            }).on('keydown', function(event) {
                if (event.keyCode === 13) {
                    jQuery(this).triggerHandler('change');
                }
            });

            inputs.each(function(index, element) {
                var input = jQuery(element);
                input.on('change', function() {
                    var text = jQuery(this).val();
                    if (!self.floatRange(text, 0, 30, '模糊程度')) {
                        return;
                    }
                    jQuery(sliderObjs[index]).slider('value', text.trim());
                }).on('keydown', function(event) {
                    if (event.keyCode === 13) {
                        jQuery(this).triggerHandler('change');
                    }
                });
            });

            // 使用推荐值
            jQuery(".enhance a.recommend_value").click(function() {
                var btn = jQuery(this);
                var defaultVal = btn.attr("data-default");
                // 运动模糊
                if (btn.attr("data-type") === "motion") {
                    fuzzySlider.slider('value', defaultVal);
                }
                // 去聚焦模糊
                if (btn.attr("data-type") === "focus") {
                    focusSlider.slider('value', defaultVal);
                }
            });

            directorSlider.slider({
                range: 'min',
                min: -90,
                max: 90,
                value: 0,
                step: 1,
                slide: function() {
                    angleInput.val(directorSlider.slider('value'));
                    self.showDisk(angleInput.val());
                },
                change: function() {
                    angleInput.val(directorSlider.slider('value'));
                    var angle = angleInput.val();
                    var radius = fuzzyInput.val();
                    if (switchBtn.is(".on")) {
                        diskHolder.show();
                        self.showDisk(angle);
                    } else {
                        diskHolder.hide();
                    }

                    if (directorSlider.slider('value') === 0 && switchBtn.is('.on')) {
                        if (fuzzySlider.slider('value') === 0) {
                            self.cancelProcess();
                        } else {
                            self.motionFuzzy(radius, angle);
                        }
                    } else if (directorSlider.slider('value') !== 0 && switchBtn.is('.on')) {
                        if (fuzzySlider.slider('value') !== 0) {
                            self.motionFuzzy(radius, angle);
                        }
                    }
                }
            });

            fuzzySlider.slider({
                range: 'min',
                min: 0,
                max: 30,
                value: 0,
                step: 0.1,
                slide: function() {
                    fuzzyInput.val(fuzzySlider.slider('value'));
                },
                change: function() {
                    fuzzyInput.val(fuzzySlider.slider('value'));
                    var angle = angleInput.val().trim();
                    var radius = fuzzyInput.val().trim(); //模糊程度

                    if (radius !== "0") {
                        if (switchBtn.is(".off")) {
                            switchBtn.toggleClass("off on");
                            angleInput.show().val(0);
                            jQuery("#diskHolder").show();

                            directorSlider.show().slider("value", 0);
                        }

                        self.motionFuzzy(radius, angle);
                    } else if (radius === "0" && directorSlider.slider('value') === 0) {
                        self.cancelProcess();
                    };
                }
            });

            focusSlider.slider({
                range: 'min',
                min: 0,
                max: 30,
                value: 0,
                step: 0.1,
                slide: function() {
                    focusInput.val(focusSlider.slider('value'));
                },
                change: function() {
                    focusInput.val(focusSlider.slider('value'));

                    //回到0时,不做处理,图片处理前
                    if (focusInput.val().trim() === '0') {
                        self.cancelProcess();
                    } else {
                        self.focusFuzzy(focusInput.val());
                    }
                }
            });
        },

        /**
         * [motionFuzzy 去运动模糊]
         * @author limengmeng
         * @date   2014-10-29
         * @param  {[num]}   length [模糊程度]
         * @param  {[num]}   angle  [运动方向]
         * @return {[]}          []
         */
        motionFuzzy: function(length, angle) {
            var self = this;
            if(self.checkImgSize(704,576,'模糊处理')){
                if (length == 0) {
                    return
                };

                var name = '去运动模糊',
                    algorithm = self.getAlgorithm(name),
                    id = jQuery('#targetImg').attr('data-id'),
                    imageUrl = jQuery('#targetImg').attr('src'),
                    oldImageId = self.oldImgId;
                self.log("选择“" + self.imgName + "”图片完成运动模糊处理操作");
                imageReq.pictureProcess({
                    algorithmName: name, //算法名称			　
                    version: algorithm.version,
                    params: {
                        Length: parseFloat(length),
                        Angle: parseFloat(angle),
                        Qyality: 0.66,
                        IterationsCount: 100,
                        Approach: 'wiener'
                    },
                    id: self.curProcessId,
                    oldImageId: oldImageId,
                    imageUrl: self.curProcessImg
                });
            }
        },
        /*去聚散焦 确定按钮*/
        /**
         * [focusFuzzy 去散焦模糊]
         * @author limengmeng
         * @date   2014-10-29
         * @param  {[num]}   radius [模糊程度]
         * @return {[]}          []
         */
        focusFuzzy: function(radius) {
            var self = this;
            if(self.checkImgSize(704,576,'模糊处理')){
                if (radius == 0) {
                    return
                };

                radius = parseFloat(radius);
                var name = '去散焦模糊';
                var algorithm = self.getAlgorithm(name);
                /*var id = jQuery('#targetImg').attr('data-id');
                 var imageUrl = jQuery('#targetImg').attr('src');*/
                var oldImageId = self.oldImgId;
                self.log("选择“" + self.imgName + "”图片完成散焦模糊处理操作");
                imageReq.pictureProcess({
                    algorithmName: name, //算法名称			　
                    version: algorithm.version,
                    params: {
                        Radius: radius,
                        Edgefeather: 0.60,
                        Correctstrength: 0.66,
                        Qyality: 0.66,
                        IterationsCount: 100,
                        Approach: 'wiener'
                    },
                    id: self.curProcessId,
                    oldImageId: oldImageId,
                    imageUrl: self.curProcessImg
                });
            }
        },
        /*模糊处理 End*/

        /*去雾 Start*/
        //去雾
        defog: function() {
            var self = this;
            jQuery('#defog').on('click', function() {
                var type = jQuery(this).data('type'),
                    name = '去雾',
                    algorithm = self.getAlgorithm(name),
                    oldImageId = self.oldImgId;
                self.log("选择“" + self.imgName + "”图片完成去雾处理操作");
                imageReq.pictureProcess({
                    algorithmName: name, //算法名称			　
                    version: algorithm.version,
                    params: {},
                    id: self.curProcessId,
                    oldImageId: oldImageId,
                    imageUrl: self.curProcessImg
                });
            });
        },
        /*去雾 End*/

        /*图像滤波 Start*/
        //图像滤波
        filterImg: function(name, params) {
            var self = this;
            if(self.checkImgSize(1280,720,'图像滤波')){
                var self = this;
                var algorithm = self.getAlgorithm(name);
                // var id = jQuery('#targetImg').attr('data-id');
                // var imageUrl = jQuery('#targetImg').attr('src');
                var oldImageId = self.oldImgId;
                imageReq.pictureProcess({
                    algorithmName: name, //算法名称         　
                    version: algorithm.version,
                    params: params,
                    id: self.curProcessId,
                    oldImageId: oldImageId,
                    imageUrl: self.curProcessImg
                });

                self.log("选择“" + self.imgName + "”图片完成" + name + "处理操作");
            }

        },
        //添加图像滤波滑块 包含中值滤波，高通滤波，低通滤波
        addImgFilter: function() {
            var self = this;
            jQuery("#imageFilterMir, #imageFilterHigh, #imageFilterLow").slider({
                range: 'min',
                min: 0,
                max: 100,
                value: 0,
                step: 1,
                slide: function() {
                    var val = jQuery(this).slider('value');
                    jQuery(this).closest(".median_filter").find("input").val(val);
                },
                change: function() {
                    var val = jQuery(this).slider('value');
                    jQuery(this).closest(".median_filter").find("input").val(val);

                    if (val === 0) {
                        self.cancelProcess();
                    } else {
                        if (jQuery(this).data("type") == "1") { //中值图像滤波
                            self.filterImg(jQuery(this).data("name"), {
                                MaskWidth: parseInt(val),
                                MaskHeight: parseInt(val)
                            });
                        } else { //高、低通图像滤波
                            self.filterImg(jQuery(this).data("name"), {
                                Freq: parseInt(val)
                            });
                        }
                    };
                }
            }).closest('.median_filter').find(".arbitrary_rotat input").on("change", function() {
                var val = jQuery(this).val();
                if (!self.intRange(val, 0, 100, '处理程度')) {
                    return;
                }
                $(this).closest(".median_filter").find(".sliding_bar .common_slider").slider("value", parseInt(val));
            }).on('keydown', function(event) {
                if (event.keyCode === 13) {
                    jQuery(this).triggerHandler('change');
                }
            });

            //使用推荐值
            jQuery(".imageFilter a.recommend_value").click(function() {
                var val = jQuery(this).data("default");
                jQuery(this).closest(".module").find(".median_filter .sliding_bar .common_slider").slider("value", parseInt(val));
            });

        },
        /*图像滤波 End*/

        /*形态学操作 Start*/
        /**
         * [erosionMorph 形态学操作腐蚀、膨胀]
         * @author limengmeng
         * @date   2014-10-29
         * @param  {[string]}   name       [算法名称]
         * @param  {[int]}   erosionVal [作用程度]
         * @param  {[string]}   algorithm  [算法版本]
         * @return {[]}              []
         */
        erosionMorph: function(name, erosionVal, algorithm) {
            var self = this,
                argId = jQuery('#targetImg').attr('data-id'),
                imageUrl = jQuery('#targetImg').attr('src'),
                oldImageId = self.oldImgId;
            imageReq.pictureProcess({
                algorithmName: name, //算法名称
                params: {
                    Mask: parseInt(erosionVal),
                    Tpye: 0
                },
                version: algorithm.version,
                id: argId,
                oldImageId: oldImageId,
                imageUrl: imageUrl
            });

            self.log("选择“" + self.imgName + "”图片完成形态学" + name +　"处理操作");
        },
        //形态学操作 siliderBar
        morphErosionSilider: function() {
            var self = this;
            //腐蚀
            jQuery("#morpherosionBar").on("change", function() {
                if (jQuery(this).val() == 0) {
                    self.cancelProcess();
                } else {
                    var name = "腐蚀";
                    var algorithm = self.getAlgorithm(name);
                    var erosionVal = jQuery("#morpherosionBar").val();
                    self.erosionMorph(name, erosionVal, algorithm);
                }
            });
            // 膨胀
            jQuery("#expandBar").on("change", function() {
                if (jQuery(this).val() == 0) {
                    self.cancelProcess();
                } else {
                    var name = "膨胀";
                    var algorithm = self.getAlgorithm(name);
                    var erosionVal = jQuery("#expandBar").val();
                    self.erosionMorph(name, erosionVal, algorithm);
                }
            });
            //腐蚀使用推荐值
            jQuery(".morphology a.recommend_value:first").click(function() {
                var btn = jQuery(this);
                if (btn.attr("data-type") === "filter") {
                    var erosionVal = jQuery(this).data("default");
                    jQuery("#morpherosionBar").val(erosionVal).trigger("change");
                }
            });
            //膨胀使用推荐值
            jQuery(".morphology a.recommend_value:last").click(function() {
                var btn = jQuery(this);
                if (btn.attr("data-type") === "filter") {
                    var erosionVal = jQuery(this).data("default");
                    jQuery("#expandBar").val(erosionVal).trigger("change");
                }
            });
        },

        /*形态学操作 End*/

         //图像复原滚动条
        picRecoverySlider: function() {
            var self = this,
                name = '图像复原',
                picture = jQuery('#targetImg'),
                sliderObj1 = jQuery("#noiControl .common_slider"),
                input1 = jQuery('.recovery_filter input').eq(0),
                sliderObj2 = jQuery("#smLevel .common_slider"),
                input2 = jQuery('.recovery_filter input').eq(1);

                input2.val(2.5);
            sliderObj1.slider({
                range: 'min',
                min: 0,
                max: 1.5,
                value: 0,
                step: 0.1,
                slide: function() {
                    input1.val(jQuery(this).slider('value'));
                },
                change: function() {
                    var val = jQuery(this).slider('value');
                    input1.val(val);
                    self.dealPicRecovery(val,input2.val());
                }
            });

            sliderObj2.slider({
                range: 'min',
                min: 2.5,
                max: 4,
                value: 2.5,
                step: 0.1,
                slide: function() {
                    input2.val(jQuery(this).slider('value'));
                },
                change: function() {
                    var val = jQuery(this).slider('value');
                    input2.val(val);
                    self.dealPicRecovery(input1.val(),val);
                }
            });

            input1.on("change", function() {
                var text = jQuery(this).val();
                if (!self.floatRange(text, 0, 1.5, '噪声抑制')) {
                    return;
                }
                sliderObj1.slider('value', parseFloat(text.trim()));
            });

            input2.on('change', function() {
                var text = jQuery(this).val();
                if (!self.floatRange(text, 2.5, 4, '平滑程度')) {
                    return;
                }
                sliderObj2.slider('value', parseFloat(text.trim()));
            });

            //使用推荐值
            jQuery(".picRecovery a.recommend_value").click(function() {
                var btn = jQuery(this);
                if(parseFloat(input1.val())===0.3 && parseFloat(input2.val())===3){
                    return;
                }else{
                     // 自适应图像复原
                    sliderObj1.slider('value', 0.3);
                    sliderObj2.slider('value', 3);
                }
            });

        },
        /*图像复原 End*/

        /**
         * [dealPicRecovery 处理图像复原]
         * @author mabo
         * @date   2016-4-9
         * @param  {[int]}   val1 [噪声抑制] val2[平滑程度]
         * @return {[]}       []
         */
        dealPicRecovery: function(val1,val2) {
            // alert("val1:"+val1+"--val2:"+val2);
            // return;
            var self = this;
            if(self.checkImgSize(300,300,'图像复原')){
                var self = this,
                name = "DCT复原",
                algorithm = self.getAlgorithm(name),
                oldImageId = self.oldImgId;
                imageReq.pictureProcess({
                    algorithmName: name, //算法名称         　
                    version: algorithm.version,
                    params: {
                        fAlpha: parseFloat(val1),
                        fH: parseFloat(val2)
                    },
                    id: self.curProcessId,
                    oldImageId: oldImageId,
                    imageUrl: self.curProcessImg
                });
            }
             
            
        },


        //色彩分离滚动条
        colorSeparateSlider: function() {
            var self = this,
                name = '色彩分离',
                picture = jQuery('#targetImg'),
                sliderObj1 = jQuery("#csControl .common_slider"),
                input1 = jQuery('.colorSeparate_filter input').eq(0);
                input1.val(2);
            sliderObj1.slider({
                range: 'min',
                min: 2,
                max: 255,
                value: 0,
                step: 1,
                slide: function() {
                    input1.val(jQuery(this).slider('value'));
                },
                change: function() {
                    var val = jQuery(this).slider('value');
                    input1.val(val);
                    self.dealColorSeparate(val);
                }
            });
            input1.on("change", function() {
                var text = jQuery(this).val();
                if (!self.floatRange(text, 2, 255, '色阶等级')) {
                    return;
                }
                sliderObj1.slider('value', parseInt(text.trim()));
            });
            //使用推荐值
            jQuery(".colorSeparate a.recommend_value").click(function() {
                var btn = jQuery(this);
                if(parseInt(input1.val())===30 ){
                    return;
                }else{
                     // 自适应图像复原
                    sliderObj1.slider('value', 30);
                }
            });

        },
        /*色彩分离 End*/
        /**
         * [dealColorSeparate 处理色彩分离]
         * @author mabo
         * @date   2016-4-9
         * @param  {[int]}   val [色阶等级]
         * @return {[]}       []
         */
        dealColorSeparate: function(val) {
            var self = this,
                name = "色调分离",
                algorithm = self.getAlgorithm(name),
                oldImageId = self.oldImgId;
            imageReq.pictureProcess({
                algorithmName: name, //算法名称         　
                version: algorithm.version,
                params: {
                    Levels: parseInt(val)
                },
                id: self.curProcessId,
                oldImageId: oldImageId,
                imageUrl: self.curProcessImg
            });
        },

        //移行
        moveRowSlider: function() {
            var self = this,
                picture = jQuery('#targetImg'),
                sliderObj1 = jQuery("#offsetDiv .common_slider"),
                input1 = jQuery('.moveRow_filter input').eq(0),
                oparateBar = jQuery("#operateBar");
                input1.val(0);
            sliderObj1.slider({
                range: 'min',
                min: -100,
                max: 100,
                value: 0,
                step: 1,
                slide: function() {
                    input1.val(jQuery(this).slider('value'));
                },
                change: function() {
                    var val = jQuery(this).slider('value');
                    input1.val(val);
                    self.dealmoveRow(val,oparateBar.val());
                }
            });
            input1.on("change", function() {
                var text = jQuery(this).val();
                if (!self.floatRange(text, -100, 100, '偏移量')) {
                    return;
                }
                sliderObj1.slider('value', parseInt(text.trim()));
            });

            oparateBar.on("change", function() {
                var type = jQuery(this).val();
                self.dealmoveRow(input1.val(),type);
            });

        },
        /*移行 End*/
        /**
         * [dealColorSeparate 处理移行]
         * @author mabo
         * @date   2016-4-9
         * @param  {[int]}   val1 [偏移量] val2[操作类型]
         * @return {[]}       []
         */
        dealmoveRow: function(val1,val2) {
            if(val2=="none"){
                return;
            }
            var self = this,
                name = "移行",
                algorithm = self.getAlgorithm(name),
                oldImageId = self.oldImgId;
            imageReq.pictureProcess({
                algorithmName: name, //算法名称         　
                version: algorithm.version,
                params: {
                    shift: parseInt(val1),
                    Mode: val2
                },
                id: self.curProcessId,
                oldImageId: oldImageId,
                imageUrl: self.curProcessImg
            });
        },

        //奇偶场
        oddEvenSlider: function(){
            var self = this;
            jQuery("#oddEvenBar").on("change", function() {
                if (jQuery(this).val() == "none") {
                    self.cancelProcess();
                } else {
                    var type = jQuery("#oddEvenBar").val();
                    self.dealOddEven(type);
                }
            });
        },
        /**
         * [dealOddEven 处理奇偶场]
         * @author mabo 2016-4-9
         * @param  {[type]} val [操作类型]
         * @return {[type]}     [description]
         */
        dealOddEven: function(val){
            var self = this,
                name = "奇偶场分离",
                algorithm = self.getAlgorithm(name),
                oldImageId = self.oldImgId;
            imageReq.pictureProcess({
                algorithmName: name, //算法名称         　
                version: algorithm.version,
                params: {
                    Mode: val
                },
                id: self.curProcessId,
                oldImageId: oldImageId,
                imageUrl: self.curProcessImg
            });

        },

        //超分辨率
        overDpiSlider: function(){
            var self = this;
            jQuery("#overDpiBar").on("change", function() {
                if (jQuery(this).val() == "0") {
                    self.cancelProcess();
                } else {
                    var type = jQuery("#overDpiBar").val();
                    self.dealOverDpi(type);
                }
            });
        },
        /**
         * [dealOverDpi 处理超分辨率]
         * @author mabo 2016-4-9
         * @param  {[type]} val [操作类型]
         * @return {[type]}     [description]
         */
        dealOverDpi: function(val){
            var self = this,
                name = "单帧超分",
                algorithm = self.getAlgorithm(name),
                oldImageId = self.oldImgId;
            imageReq.pictureProcess({
                algorithmName: name, //算法名称         　
                version: algorithm.version,
                params: {
                    nScale: parseInt(val)
                },
                id: self.curProcessId,
                oldImageId: oldImageId,
                imageUrl: self.curProcessImg
            });

        },

        //图像操作提示
        setDealImageExplain : function(obj){
            if(obj){
                if($('.editReminder').hasClass('hidden')){
                    $('.editReminder').removeClass('hidden');
                }
            }else{
                if(!$('.editReminder').hasClass('hidden')){
                    $('.editReminder').addClass('hidden');
                }
                return;
            }
            var self = this;
            if(obj !== conf.sharpen.sharpen){
                self.delSharpenImageExplain();
            }
            var mainText = (obj&&obj.mainText)||'',
                explainText = (obj&&obj.explainText)||'';
            $('.editReminder .editExplainTitle').text(mainText);
            $('.editReminder .editExplainContent').text(explainText);
        },
        setSharpenImageExplain : function(){
            $('.editReminder .uEditExplainTitle').text(conf.sharpen.adaptSharpen.mainText);
            $('.editReminder .uEditExplainContent').text(conf.sharpen.adaptSharpen.explainText);
        },
        delSharpenImageExplain : function(){
            if($('.editReminder .uEditExplainTitle') !== ''){
                $('.editReminder .uEditExplainTitle').text('');
                $('.editReminder .uEditExplainContent').text('');
            }
        },
        /**
         * 获取图像处理操作解释
         */
        getMenuExplain : function(text){
            var self =this;
            if(text == '图像增强'){
                self.mainExplainText = '图像增强';
                self.setDealImageExplain(conf.imageEnhance.enhance);
            }else if(text == '噪声处理') {
                self.mainExplainText = '噪声处理';
                self.setDealImageExplain(conf.noiseDeal.noiseDeal);
            }else if(text == '锐化') {
                self.mainExplainText = '锐化';
                self.setDealImageExplain(conf.sharpen.sharpen);
                self.setSharpenImageExplain();
            }else if(text == '颜色处理') {
                self.mainExplainText = '色彩-灰度转换';
                self.setDealImageExplain(conf.colorDeal.greyTransform);
            }else if(text == '图像校正'){
                self.mainExplainText = '镜头畸变校正';
                self.setDealImageExplain(conf.imageRevise.distortionRevise);
            }else if(text == '去雾'){
                self.mainExplainText = '去雾';
                self.setDealImageExplain(conf.removeFog.removeFog);
            }else if(text == '图像滤波'){
                self.mainExplainText = '中值滤波';
                self.setDealImageExplain(conf.imageSmoothing.midValueSmoothing);
            }else if(text == '形态学操作'){
                self.mainExplainText = '腐蚀';
                self.setDealImageExplain(conf.formOperation.corrosion);
            }else if(text == '模糊处理'){
                self.mainExplainText = '去运动模糊';
                self.setDealImageExplain(conf.dealFuzzy.removeSport);
            }else if(text == '图像复原'){
                self.mainExplainText = '图像复原';
                self.setDealImageExplain(conf.picRecovery.picRecovery);
            }else if(text == '色彩分离'){
                self.mainExplainText = '色彩分离';
                self.setDealImageExplain(conf.colorSeparate.colorSeparate);
            }else if(text == '移行'){
                self.mainExplainText = '移行';
                self.setDealImageExplain(conf.moveRow.moveRow);
            }else if(text == '奇偶场'){
                self.mainExplainText = '奇偶场';
                self.setDealImageExplain(conf.oddEven.oddEven);
            }else if(text == '超分辨率'){
                self.mainExplainText = '超分辨率';
                self.setDealImageExplain(conf.overDpi.overDpi);
            }else if(text == '基础编辑'){
                self.setDealImageExplain();
            }
        },
        //横向菜单
        horizontalMenu: function() {
            var self = this;
            var picture = jQuery('#targetImg');
            //头部切换（常规处理+高级处理）
            jQuery(".main_nav a").off('click').on('click', function() {
                if(jQuery(this).text() === '常规处理'){
                    self.mainExplainText = '旋转';
                    self.setDealImageExplain();
                }else{
                    self.mainExplainText = '去运动模糊';
                    self.setDealImageExplain(conf.dealFuzzy.removeSport);
                }
                jQuery(this).addClass("current").siblings("a").removeClass("current");
                var tab_index = jQuery(".main_nav a").index(this);

                jQuery('.sub_nav li:eq(' + tab_index + ')').addClass('active').siblings().removeClass('active');
                jQuery('.sub_nav li.active a:eq(0)').triggerHandler('click');

            });

            //基础编辑 图像增强 噪声处理、模糊处理、去噪  切换5个控制项
            jQuery(".sub_nav a").off('click').on('click', function() {
                self.getMenuExplain(jQuery(this).text());
                //当前控制项添加current类控制样式
                jQuery(this).addClass("current").siblings("a").removeClass("current");
                var tab_index = jQuery(".sub_nav a").index(this);

                //当前控制项对应的,操作模块显示,其他全隐藏
                var controlItems = jQuery('.control_panel .control_item');
                controlItems.removeClass('active');
                jQuery(controlItems.get(tab_index)).addClass('active');

                //5个模块下的第一个module是显示的
                var firstModuleHead = jQuery('.control_panel .control_item.active dt:eq(0)');
                firstModuleHead.removeClass('active');
                firstModuleHead.next('dd').removeClass('active');
                firstModuleHead.triggerHandler('click');
            });
        },

        //将所有slider初始化为默认值
        //给slider所选元素加入defaultvalue属性，使得可以自定义slider的默认值
        //module 为要处理的dom
        defaultSliderValue: function(module) {
            module.find('.common_slider').each(function(index, element) {

                var defaultValue = jQuery(element).data("defaultvalue");
                if (defaultValue !== undefined) {
                    defaultValue -= 0;
                    if (defaultValue !== jQuery(element).slider('value')) {
                        jQuery(element).slider('value', defaultValue);
                    }
                } else {
                    if (jQuery(element).slider('value') !== 0) {
                        jQuery(element).slider('value', 0);
                    }
                };
            });
        },
        /*
            右侧图片操作解释切换
         */
        RightMenuExplainObj : {
            '旋转' : function(self){
                self.setDealImageExplain();
            },
            '裁剪' : function(self){
                self.setDealImageExplain();
            },
            '缩放' : function(self){
                self.setDealImageExplain();
            },
            '图像增强' : function(self){
                self.setDealImageExplain(conf.imageEnhance.enhance);
            },
            '噪声处理' : function(self){
                self.setDealImageExplain(conf.noiseDeal.noiseDeal);
            },
            '锐化' : function(self){
                self.setDealImageExplain(conf.sharpen.sharpen);
                self.setSharpenImageExplain();
            },
            '色彩-灰度转换' : function(self){
                self.setDealImageExplain(conf.colorDeal.greyTransform);
            },
            '去色' : function(self){
                self.setDealImageExplain(conf.colorDeal.removeColor);
            },
            '自动色彩平衡' : function(self){
                self.setDealImageExplain(conf.colorDeal.colorBalance);
            },
            '反色' : function(self){
                self.setDealImageExplain(conf.colorDeal.reverseColor);
            },
            '自动白平衡' : function(self){
                self.setDealImageExplain(conf.colorDeal.whiteBalance);
            },
            '亮度拉伸' : function(self){
                self.setDealImageExplain(conf.colorDeal.brightStretch);
            },
            '亮度反转' : function(self){
                self.setDealImageExplain(conf.colorDeal.brightReversal);
            },
            '镜头畸变校正' : function(self){
                self.setDealImageExplain(conf.imageRevise.distortionRevise);
            },
            '透视变换校正' : function(self){
                self.setDealImageExplain(conf.imageRevise.exchangeRevise);
            },
            '去运动模糊' : function(self){
                self.setDealImageExplain(conf.dealFuzzy.removeSport);
            },
            '去散焦模糊' : function(self){
                self.setDealImageExplain(conf.dealFuzzy.removeDefocus);
            },
            '去雾' : function(self){
                self.setDealImageExplain(conf.removeFog.removeFog);
            },
            '中值滤波' : function(self){
                self.setDealImageExplain(conf.imageSmoothing.midValueSmoothing);
            },
            '高通滤波' : function(self){
                self.setDealImageExplain(conf.imageSmoothing.heiValueSmoothing);
            },
            '低通滤波' : function(self){
                self.setDealImageExplain(conf.imageSmoothing.lowValueSmoothing);
            },
            '腐蚀' : function(self){
                self.setDealImageExplain(conf.formOperation.corrosion);
            },
            '膨胀' : function(self){
                self.setDealImageExplain(conf.formOperation.swell);
            }
        },
        getRightMenuExplain : function(text){
            var self =this;
            self.RightMenuExplainObj[text](self);
        },
        //右侧菜单手风琴效果
        foldMenu: function() {
            var self = this;
            var picture = jQuery('#targetImg');
            jQuery('.basic_editing .module-head').mouseover(function(){
                if($(this).find('span').text() !== self.mainExplainText){
                    self.getRightMenuExplain(jQuery(this).find('span').text());
                }
            })
            jQuery('.basic_editing .module-head').mouseout(function(){
                if($(this).find('span').text() !== self.mainExplainText){
                    self.getRightMenuExplain(self.mainExplainText);
                }

            })
            jQuery('.basic_editing .module-head').on('click', function() {
                self.mainExplainText = jQuery(this).find('span').text();
                var that = this;
                var module = jQuery(that).next('dd');
                var moduleActive = jQuery('.basic_editing .module.open'); //处理当前图片的module

                // 显示隐藏透视变换校正画布
                if ($(".ImageCorrect").is(":visible") && $(this).hasClass("ts") && !$(this).hasClass("active")) {
                    self.showTsPaper();
                } else {
                    self.hideTsPaper();
                }

                //隐藏去模糊运动圆圈
                if (jQuery('.motion_fuzzy .switch').is('.on')) {
                    jQuery('.motion_fuzzy .switch').triggerHandler('click');
                };

                //处理前的图片与基于当前图片处理的id不同,给出弹框
                var flag1 = parseInt(picture.attr('data-id')) !== parseInt(self.curProcessId); //当前显示图片id跟处理图片前的id(curId)不等
                var flag2 = parseInt(picture.attr('data-id')) !== parseInt(self.beforeProcessId); //当前显示图片跟翻转前的id(beforeProcessId)不等
                var flag3 = self.isInHistoryList(picture.attr('src').trim()); //当前显示id存在历史记录中

                if (picture.attr('data-id') === "") {
                    flag1 = false;
                    flag2 = false;
                };

                //修改确定按钮为保存快照
                jQuery(that).toggleClass('active').siblings('.module-head').removeClass('active');
                module.toggleClass('active');
                module.siblings('.module').removeClass('active');

                //所有module中,展开的并且可以看到的module加open类.其他移除.只会存在一个open
                if (module.is('.active')) {
                    module.closest('.control_panel').find('.module').removeClass('open');
                    module.addClass('open');
                } else {
                    module.closest('.control_panel').find('.module').removeClass('open');
                }

                //已存在选框,再次点击module-head时,移除选框
                if (self.jcrop_api) {
                    self.jcrop_api.destroy();
                }
            });

            // 取消按钮
            jQuery('.module .cancle').on('click', function() {
                var module = jQuery(this).closest('.module');
                var moduleHead = module.prev('.module-head');
                module.removeClass('active open');
                moduleHead.removeClass('active');

                // 隐藏透视变换校正
                if (moduleHead.hasClass("ts")) {
                    self.hideTsPaper();
                }

                //隐藏去模糊运动圆圈
                if (jQuery(this).closest('.module').is('.motion_fuzzy_module') && jQuery('.motion_fuzzy .switch').is('.on')) {
                    jQuery('.motion_fuzzy .switch').triggerHandler('click');
                }

                // 旋转 和 缩放 操作相对于原图
                if (module.is('.rotat_module') || module.is(".sf_module_active")) {
                    self.curProcessId = self.beforeProcessId;
                    self.curProcessImg = self.beforeProcessImg;
                    picture.attr('data-id', self.curProcessId);
                    picture.attr('src', self.curProcessImg);
                    self.getOriginImage(picture.attr('src'));

                }
                // 其他操作相对于当前处理的图片
                else {
                    picture.attr('data-id', self.curProcessId);
                    picture.attr('src', self.curProcessImg);
                };
                 self.lastTargetImg = "";
            });

            // 确认按钮
            jQuery('.module .btn_yes:not(#cut_ok)').on('click', function() {
                //若为选中提示先选中视图文件
                if (jQuery("#resourceTreePanel ul li").length === 0 || jQuery("#resourceTreePanel ul li.active").length === 0) {
                    return;
                }
                var id = jQuery('#targetImg').attr('data-id'),
                    imageUrl = jQuery('#targetImg').attr('src'),
                    orginImgId = jQuery('#orginImg').attr('data-id'),
                    oldImageId = self.oldImgId;
                self.curProcessId = id;
                self.curProcessImg = imageUrl;
                self.beforeProcessId = id;
                self.beforeProcessImg = imageUrl;
                if(id === orginImgId){
                    notify.warn('图片未处理，请先处理后再保存至快照！');
                    return false;
                }
                if (self.isInHistoryList(imageUrl.trim())) { //已经存在历史记录中,不重复添加
                    notify.warn('已存在快照列表中！');
                    return false;
                }

                if (jQuery(this).closest('.module').is('.motion_fuzzy_module') && jQuery('.motion_fuzzy .switch').is('.on')) { //如果是去运动模糊,确定时,去掉运动方向的圆圈
                    jQuery('.motion_fuzzy .switch').triggerHandler('click');
                }

                imageReq.addHistoryRecord({
                    id: id,
                    oldImageId: oldImageId
                });
            });
        },

        //模糊处理的图片如果尺寸超出704*576,给提示
        checkImgSize : function(width,height,tip){
            var self =this;
            if (!self.isOverBoundary(width, height)) {
                var dialog = new ConfirmDialog({
                    message: tip + '宽高限制为:' + width + '*' + height + '！' + '是否要对图片进行截图处理？',
                    callback: function() {
                        jQuery(".main_nav a:first-child").trigger('click');
                        jQuery('#basicEdit .module-head.cut_img').trigger('click');
                        setTimeout(function(){
                            /**
                             * 修改强制转换为number类型 而不是Int 这里需要保留小数 要求显示的像素值精确
                             * haoyong 2016-04-25
                             */
                            var wd = Number(width*(self.getImagePercent()/100));
                            var hg = Number(height*(self.getImagePercent()/100));
                            jQuery('.cut_num .width').val(wd);
                            jQuery('.cut_num .height').val(hg);
                            self.jcrop_api.setSelect([0, 0, wd, hg])
                        }, 100)
                        self.cutInFuzzy = true;
                    },
                    prehide:function(){
                        jQuery(".motion_fuzzy .switch").toggleClass('off on');
                    }
                });
                return false;
            };
            return true;
        },

        /*
         两种情况下会调用提示框
         1.图片处理后,点击右侧其他操作块module.传参:module为图片处理的模块,that点击的其他操作块的头module_head
         2.图片处理后,点击左侧树更换其他照片.传参:module为图片处理的模块,that=false,data为右侧点击的其他树上的数据.
         */
        confirmDialog: function(module, that, data) {
            var self = this;
            //若为选中提示先选中视图文件
            if (jQuery("#resourceTreePanel ul li").length === 0 || jQuery("#resourceTreePanel ul li.active").length === 0) {
                return;
            }
            var picture = jQuery('#targetImg');
            var dialog = new ConfirmDialog({
                message: "是否应用当前修改？",
                callback: function() {
                    //触发当前改变图片的模块的保存按钮.
                    if (module.length > 0) {
                        module.find('.control_btn .btn_yes').triggerHandler('click');
                    }
                    if (that) {
                        jQuery(that).triggerHandler('click');
                    }
                    if (data) {
                        self.setInit(data);
                    }
                },
                closure: function() {
                    self.cancelProcess();
                    if (that) {
                        jQuery(that).triggerHandler('click');
                    };
                    if (data) {
                        self.setInit(data);
                    };
                }
            });
        },
        //正则
        intRange: function(val, min, max, msg) {
            var value = val.trim();
            if (value === '') {
                notify.warn('请填写' + msg + '！');
                return false;
            }

            if (!/^\-?\d+$/.test(value)) {
                notify.warn('请填写整数！');
                return false;
            }

            var text = parseInt(value);
            if (min !== null && max === null && text < min) {
                notify.warn('请填写大于 ' + min + ' 的值！');
                return false;
            }
            if (min === null && max !== null && text > max) {
                notify.warn('请填写小于 ' + max + ' 的值！');
                return false;
            }
            if (min !== null && max !== null && (text < min || text > max)) {
                notify.warn('请填写 ' + min + ' 到 ' + max + ' 的值！');
                return false;
            }
            return true;
        },

        //左侧图片操作验证
        floatRange: function(val, min, max, msg) {
            var value = val.trim();
            if (value === '') {
                notify.warn('请填写' + msg + '！');
                return false;
            }

            if (!/^\-?[0-9](\d)*[.]?(\d)*$/.test(value)) {
                notify.warn('请填写数字！');
                return false;
            }

            var text = parseFloat(value);
            if (min !== null && max === null && text < min) {
                notify.warn('请填写大于 ' + min + ' 的值！');
                return false;
            }
            if (min === null && max !== null && text > max) {
                notify.warn('请填写小于 ' + max + ' 的值！');
                return false;
            }
            if (min !== null && max !== null && (text < min || text > max)) {
                notify.warn('请填写 ' + min + ' 到 ' + max + ' 的值！');
                return false;
            }
            return true;
        },

        //选框改变时,高宽值随之改变
        showSize: function(c) {
            //获取当前图片显示比例
            var ratio = $(".view").find("em.image-ratio")[0].innerText;
            ratio = ratio.toString().substr(0,ratio.length-1)/100;

            jQuery('.cut_num .width').val(Math.round(c.w/ratio));
            jQuery('.cut_num .height').val(Math.round(c.h/ratio));
        },

        //回到原图
        backToOriginalImg: function() {
            var self = this,
                picture = jQuery('#targetImg'),
                oldImg = jQuery('#oldImg'),
                moduleActive = jQuery('.module.open');
            oldImg.on('click', function() {

                // 启用缩放
                self.enableZoom();

                if (self.jcrop_api) {
                    self.jcrop_api.destroy();
                }
                jQuery('#diskHolder').hide();


                var flag1 = parseInt(picture.attr('data-id')) !== parseInt(self.curProcessId); //当前显示图片id跟处理图片前的id(curId)不等
                var flag2 = parseInt(picture.attr('data-id')) !== parseInt(self.beforeProcessId); //当前显示图片跟翻转前的id(beforeProcessId)不等
                var flag3 = self.isInHistoryList(picture.attr('src').trim()); //当前显示id存在历史记录中
                var data = {
                    id: oldImg.attr('data-id'),
                    cid: oldImg.attr('data-cid'),
                    pid: oldImg.attr('data-pid'),
                    fileName: oldImg.attr('data-name'),
                    filePath: oldImg.attr('data-pfsUrl'),
                    localPath: oldImg.attr('data-imgurl')
                };

                if (picture.attr('data-id') === "") {
                    flag1 = false;
                    flag2 = false;
                };

                if ((flag1 || flag2)) {
                    if (moduleActive.length > 0) {
                        self.confirmDialog(moduleActive, oldImg, data);
                        return false;
                    }
                } else {
                    self.setInit(data);
                    // 打开合并面板恢复默认值
                    jQuery('.module.open').prev().trigger('click');
                }

                self.defaultSliderValue(jQuery('.module.open'));
            });
        },
        //对比
        imgCompare: function() {
            var self = this;
            jQuery('#imgCompare').on('click', function() {
                jQuery(this).toggleClass('active');
                var oldImg = jQuery('#oldImg');
                var picture = jQuery('#targetImg');
                if (jQuery(this).is('.active')) {
                    self.compareStatus = 2; //状态改为对比状态

                    if (self.jcrop_api) {
                        //裁剪时,点击对比,移除裁剪选框,并收起
                        self.jcrop_api.destroy();
                        jQuery('.cut_img').removeClass('active');
                        jQuery('.cut_img').next('dd').removeClass('active open');
                    }
                    jQuery('#diskHolder').hide(); //隐藏运动圆圈

                    window.mask.showMask(); //右侧遮罩层

                    //对比移除拖拽
                    if (picture.is('.ui-draggable')) {
                        picture.draggable("destroy");
                    }

                    self.compareOrgin = {
                        "id": self.oldImgId,
                        "name": "处理前的图片",
                        "width": self.oldOriginalBounds[0],
                        "height": self.oldOriginalBounds[1],
                        "path": oldImg.attr('data-imgurl')
                    };
                    self.compareTarget = {
                        "id": picture.attr('data-id'),
                        "name": "处理后的图片",
                        "width": self.originalBounds[0],
                        "height": self.originalBounds[1],
                        "path": picture.attr('src'),
                    };

                    // 禁用缩放
                    self.disableZoom();

                    // 判断是否需要隐藏画布
                    if ($(".module-head.ts").hasClass("active")) {
                        self.hideTsPaper();
                    }
                } else {
                    self.compareStatus = 1; //状态改为非对比状态
                    window.mask.hideMask();
                    jQuery('#orginImg').hide();
                    if (jQuery('.motion_fuzzy .switch').is('.on')) { //非对比状态,对比前存在圆圈让其重现.
                        jQuery('#diskHolder').show();
                    }
                    //oldImg.triggerHandler('click');

                    //非对比可拖拽
                    self.imgDraggable(picture);

                    // 启用缩放
                    self.enableZoom();

                    // 判断是否需要显示画布
                    if ($(".ImageCorrect").is(":visible") && $(".module-head.ts").hasClass("active")) {
                        self.showTsPaper();
                    }
                }

                jQuery(window).resize();
            });
        },
        // 禁用缩放
        disableZoom: function() {
            jQuery("#zoomSlider").slider("disable");
            jQuery('#adaptTo').addClass("disabled");
        },
        // 启用缩放
        enableZoom: function() {
            jQuery("#zoomSlider").slider("enable");
            jQuery('#adaptTo').removeClass("disabled");
        },
        //历史记录
        historyRecord: function() {
            var self = this;

            jQuery('.history_image span').on('click', function() {
                if (!self.oldImgId) {
                    return false
                };

                var history = jQuery('.history_image');
                history.toggleClass('active');

                if (history.is('.active')) {
                    jQuery(".image_content").css("bottom", "134px");
                    imageReq.getHistoryList({
                        oldImageId: self.oldImgId
                    });
                } else {
                    jQuery(".image_content").css("bottom", "34px");
                }

                jQuery(window).resize();
            });

            //显示删除按钮
            jQuery(".history_image ul").on('mouseover', 'li', function() {
                jQuery(this).children("a").show();
            }).on('mouseleave', 'li', function() {
                jQuery(this).children("a").hide();
            });

            //选择单个历史记录
            jQuery('.history_image ul').on('click', 'li', function() {
                var id = jQuery(this).attr('data-id');
                imageReq.getHistoryItem({
                    id: id
                });
                jQuery(this).addClass('active').siblings().removeClass('active');
            });

            //删除历史记录
            jQuery('.history_image_list').on('click', 'li .icon_delete', function() {
                var id = jQuery(this).closest('li').attr('data-id');
                var li = jQuery(this).closest('li');
                imageReq.deleteHistoryItem({
                    id: id,
                    li: li
                });
            });

            //清除历史列表
            jQuery('#clearHistory').on('click', function() {
                if (jQuery('.history_image_list ul li').length === 0) {
                    return false;
                }

                var dialog = new ConfirmDialog({
                    title: '清空列表',
                    message: "确定要清空列表吗？",
                    callback: function() {
                        imageReq.clearHistory({
                            currentId: self.oldImgId,
                            oldImageId: self.oldImgId
                        });
                    }
                });
            });
        },

        /**
         * [updateHistoryList 更新历史列表参数historyList]
         * @author limengmeng
         * @date   2014-10-29
         * @param  {[string]}   opt [操作参数]
         * @param  {[int]}   id  [历史列表中当前选中项的id]
         * @return {[]}       []
         */
        updateHistoryList: function(opt, id) { //delete
            if (opt === 'delete') {
                for (var i = 0; i < this.historyList.length; i++) {
                    if (this.historyList[i].id === parseInt(id)) {
                        this.historyList.erase(this.historyList[i]);
                    }
                }
            } else if (opt === 'deleteAll') {
                this.historyList.empty();
            }
        },

        /**
         * [isInHistoryList 判断当前的显示的图片是否在历史记录中]
         * @author limengmeng
         * @date   2014-10-29
         * @param  {[string]}   imgurl [当前图片地址]
         * @return {Boolean}         [是否存在历史记录中]
         */
        isInHistoryList: function(imgurl) {
            var result = false;
            for (var i = 0; i < this.historyList.length; i++) {
                if (this.historyList[i].localPath.trim() === imgurl) {
                    result = true;
                    break;
                }
            }
            return result;
        },

        //历史记录横向滚动条
        addScrollbar: function() {
            this.historyScrollbar = jQuery(".history_image_list");
            this.historyScrollbar.tinyscrollbar({ //内容区添加滚动条
                axis: "x",
                thumbSize: 36
            });
            this.updateScrollBar();
        },
        //更新滚动条
        updateScrollBar: function() {
            if (this.historyScrollbar) {
                this.historyScrollbar.tinyscrollbar_update('relative');
            }
        },

        /**
         * [showDisk 模糊处理显示方向盘 大小为200 * 200]
         * @author limengmeng
         * @date   2014-10-29
         * @param  {[num]}   degree [运动方向]
         * @return {[]}          []
         */
        showDisk: function(degree) {
            if (!arguments.callee.init) {
                arguments.callee.init = true;
                arguments.callee.disk = Raphael("diskHolder", 200, 200);
                arguments.callee.disk.circle(100, 100, 98).attr({
                    fill: "none",
                    "stroke-width": 2,
                    "stroke": "#FF0000"
                });

                arguments.callee.arrowLine = arguments.callee.disk.path("M0,100L10,105L10,102L190,102L190,105L200,100L190,95L190,98L10,98L10,95Z0,100");
                arguments.callee.arrowLine.attr({
                    "stroke-width": 0,
                    fill: "red",
                    stroke: "#FF0000"
                });
            } else {
                arguments.callee.arrowLine.transform("");
                arguments.callee.arrowLine.rotate(0 - degree, 100, 100);
            }
        },

        //图片处理完后,回到默认值,即不做任何处理了,也不会添加到历史记录中
        cancelProcess: function() {
            var self = this;
            self.curProcessId = self.beforeProcessId;
            self.curProcessImg = self.beforeProcessImg;

            var picture = jQuery('#targetImg');
            picture.attr('data-id', self.curProcessId);
            picture.attr('src', self.curProcessImg);
            picture.show();
            window.mask.hideMask();
            jQuery("#loading").hide();
            self.getOriginImage(picture.attr('src'));
        },

        // 图像对比
        compare: function() {
            var self = this,
                target = self.compareTarget,
                orgin = self.compareOrgin;

            if (!target || !orgin) {
                return;
            }

            //    | %4 |     A 44%   | 4% |   B 44%     | 4% |
            // 垂直 5:90:5  水平 4:44:4:44:4
            // 默认隐藏
            jQuery("#orginImg").show();
            var container = jQuery("div.image_area"),
                cw = container.width(),
                ch = container.height();

            //取宽比例和宽比例中的较大值
            var oRate = parseInt(orgin.width) / parseInt(orgin.height),
                tRate = parseInt(target.width) / parseInt(target.height);

            // 按比例切分
            var bw = cw * 44 / 100,
                bh = ch * 9 / 10;

            // 获取元素
            var eOrigin = jQuery("#orginImg"),
                eTarget = jQuery("#targetImg");
            eOrigin.attr('src', orgin.path);

            // 原图像
            if (oRate >= 1) {
                if (5 * bh / 9 - bw / (2 * oRate) === 0) {
                    container.css("min-height", ch);
                }
                eOrigin.css({
                    "width": bw + "px",
                    "top": 5 * bh / 9 - bw / (2 * oRate) + "px",
                    "height": bw / oRate + "px",
                    "left": bw / 11 -10+ "px"
                });
            } else {
                eOrigin.css({
                    "width": bh * oRate + "px",
                    "height": bh + "px",
                    "top": bh / 18 + "px",
                    "left": 13 * bw / 22 - bh * oRate / 2 - 10 + "px"
                });
            }

            // 处理后的当前图像
            if (tRate >= 1) {
                eTarget.css({
                    "width": bw + "px",
                    "top": 5 * bh / 9 - bw / (2 * tRate) + "px",
                    "height": bw / tRate + "px",
                    "left": 13 * bw / 11 + 20 + "px"
                });
            } else {
                eTarget.css({
                    "width": bh * tRate + "px",
                    "height": bh + "px",
                    "top": bh / 18 + "px",
                    "left": 37 * bw / 22 - bh * tRate / 2 + 20 + "px"
                });
            }
        }
    });

    // 遮罩层
    jQuery(function() {
        window.mask = (function(maskAreaEle) {
            var maskEle = null,
                createMask = function() {
                    var maskHtml = '<div id="masklayer"><iframe src="javascript:;"></iframe></div>';
                    if (!maskEle) {
                        maskEle = jQuery(maskHtml).appendTo(maskAreaEle);
                    }
                };
            return {
                showMask: function() {
                    if (!maskEle) {
                        createMask();
                    }
                    maskEle.show();
                },

                hideMask: function() {
                    if (maskEle) {
                        maskEle.hide();
                    }
                }
            };
        })(jQuery(".control_panel"));
    });


    return gImage;
})

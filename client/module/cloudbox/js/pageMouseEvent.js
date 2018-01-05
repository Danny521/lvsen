/**
 *
 * @authors lrxia (lrxia@netposa.com)
 * @date    2015/6/15
 * @version $
 */
/*有待优化
 *js/ajax-module.js 引入只为新建文件夹时候发送请求
 * resourceImport ,permission 为上传按钮弹框 和 实现上传
 * js/param-parse.js (PARSE_TOOL) 位全部删除引入
 * */
define([
    'js/ajax-module.js',
    'js/showDetail-list.js',
    'js/assist-controller.js',
    'js/cloud-module-skip.js',
    'js/cloud-nav.js',
    'js/cloud-view.js',
    'resourceImport',
    'js/param-parse.js',
    'js/publicEvent.js',
    'base.self',
    'permission'
], function(ajaxModule, showDetailList, ASSIST_CONTROLLER, moduleSkip, cloudNav, VIEW, resourceImportPanel, PARSE_TOOL, PUBLICEVENT) {
    return {
        bindEventInit: function() {
            var _t = this;
            VIEW.checkBox();
            jQuery(document).on('focus', '.datepicker', _t.datepickerFocus);
            jQuery("#content").on("click", ".list-content .l-name a, .list-content dd .blocktype", _t.listContentLiClick);
            jQuery(document).on('click', '.bg-close', _t.bgCloseClick);
            jQuery(document).on('click', 'a.navi', _t.naviClick);
            jQuery(document).on('click', '#go_back', _t.goBackClick);
            jQuery("div.sidebar ul").on("click", "li,a", _t.sidebarLiClick);
            jQuery(document).on("click", ".creat_new_floder", _t.creatNewFloderClick);
            jQuery(document).on("click", ".create-new-file-cancel", _t.createNewFileCancel);
            jQuery(document).on("click", ".create-new-file-ok", _t.createNewFileOk);
            jQuery(document).on('click', '.local-upload', _t.localUploadFileClick); /*上传*/
            jQuery(document).on('click', '#submitBtn', _t.submitBtnClick);
            jQuery(document).on('click', '#multi_del', _t.multiDelClick);
            jQuery(document).on('click', '.listpic', _t.listpicClick);
            jQuery(document).on('click', '.thumbnail', _t.thumbnailClick);
            jQuery(document).on('click', 'span.s-style', function() { /*结构化后的面包屑*/
                var $this = jQuery(this);
                SCOPE.markType = $this.attr('data-cat');
                SCOPE.pageNo = 0;

                if (SCOPE.cList === SCOPE.sList) {
                    _t.showStructure();
                }
                if (SCOPE.cList === SCOPE.sListByvideo) {
                    _t.getStructureListByVideoId();
                }
                $this.addClass('current').siblings().removeClass('current');
            });
            /*解决ie9下 按回车键 触发上传事件问题*/
            $(document).unbind('keydown');
            $(document).bind('keydown', function(e) {
                if (e.keyCode == 13) {
                    return false
                }
            });
            PUBLICEVENT.eventBindInit();
            /** @description 获取左侧最下面空间使用量*/
            this.getStorage();


        },
        datepickerFocus: function() {
            jQuery(this).datetimepicker({
                showSecond: true,
                dateFormat: 'yy-mm-dd',
                timeFormat: 'HH:mm:ss',
                stepHour: 1,
                stepMinute: 1,
                stepSecond: 1,
                timeText: '',
                hourText: '时',
                minuteText: '分',
                secondText: '秒',
                maxDate: new Date(),
                showAnim: ''
            }).datetimepicker('show');
        },
        listContentLiClick: function() {
            /*SCOPE.context 获取当前点击的数据*/
            localStorage.removeItem('upDataInfo_y')
            var type = SCOPE.context.fileType - 0,
                pvdId = SCOPE.context.pvdId,
                fileName = SCOPE.context.fileName,
                id = SCOPE.context.id;

            SCOPE.curListIndex = jQuery(this).closest('dd').index();
            /**
             * 查看详情时保存了当前文件的id,SCOPE.context.id实时性太强,self.theId比较稳定
             */
            SCOPE.theId = SCOPE.context.id;
            /**
             * 搜索前变更clist = searchlist,打开搜索中结果的文件夹,必须还原之前的接口,这里用oldlist在搜索前记录
             */
            if (SCOPE.cList === SCOPE.searchList) {
                SCOPE.cList = SCOPE.cOldList;
            }
            if (!pvdId) {

                /*非案事件文件*/
                if (type === 0) {
                    SCOPE.pageNo = 0;

                    showDetailList.getFolderDetail(id, fileName, {
                        data: id,
                        type: 'id',
                        fileType: 0,
                        url: SCOPE.aList
                    });

                } else {
                    ASSIST_CONTROLLER.getDetails($(this).attr("data-filename"));
                    /*如果在弹出框的时候 事件已经被绑定 则不再初始化*/
                    if (!POPLAYER.isEventInit) {
                        POPLAYER.bindEvent();
                    }

                }

            } else {
                /*案事件内容*/
                if (type === 0) {
                    showDetailList.getFolderDetail(id, fileName, {
                        data: id,
                        type: 'id',
                        fileType: 0
                    });
                } else {
                    /*具体内容跳转到视图库*/
                  //  moduleSkip.viewIncident();
                    //可以重复入库，在此处不需要跳转到视图库，还是打开弹框  2016.4.12 zhangming  begin
                    ASSIST_CONTROLLER.getDetails($(this).attr("data-filename"));
                    /*如果在弹出框的时候 事件已经被绑定 则不再初始化*/
                    if (!POPLAYER.isEventInit) {
                        POPLAYER.bindEvent();
                    }
                    //可以重复入库，在此处不需要跳转到是图库，还是打开弹框  2016.4.12  end
                }
            }
            return false;
        },
        bgCloseClick: function() {
            var strtuctureType = {
                1: "人员",
                2: "车辆",
                3: "物品",
                4: "场景",
                5: "运动目标",
                6: "其他"
            };
            //关闭弹出层时让视频停止播放
            var IsStruct = $(".tab-title .tab-structed-video").hasClass("active"),
                IsOrigal = $(".tab-title .video-original").hasClass("active"),
                IsCut = $(".tab-title .video-abstract").hasClass("active"),
                IsMilit = $(".tab-title .video-multi").hasClass("active");
            ASSIST_CONTROLLER.cutPlayer && ASSIST_CONTROLLER.cutPlayer.clearPlayTime();
            if(ASSIST_CONTROLLER.mPlayer && ASSIST_CONTROLLER.mPlayer.intervalFlag){
                window.clearInterval(ASSIST_CONTROLLER.mPlayer.intervalFlag)
            }
            if (IsStruct || IsMilit || IsCut || IsOrigal) {
                jQuery(".video-block .stop").trigger("click");
            }
            //显示导航,bug[37719], add by zhangyu, 2015.10.25
            window.top.showHideNav("show");
            jQuery('.bg-wrap').fadeOut(100);
            if(ASSIST_CONTROLLER.mPlayer){
                ASSIST_CONTROLLER.mPlayer = null;
            }
            if(ASSIST_CONTROLLER.cutPlayer){
                ASSIST_CONTROLLER.cutPlayer = null;
            }
            if(ASSIST_CONTROLLER.overlayPlayer){
                ASSIST_CONTROLLER.overlayPlayer = null
            }
            //删除data-flag属性，避免关闭详情页时还提示“当前已经是第一个可查看资源”
            $(".bg-content").removeAttr("data-flag");
            if (SCOPE.context.fileType === "2") {
                cloudNav.deleteLastTypeSteps(SCOPE.context.fileName, {
                    data: SCOPE.context.id,
                    type: 'info',
                    fileType: 2,
                    url: SCOPE.pDetails
                })
            }
            if (SCOPE.context.fileType === "1") {
                cloudNav.deleteLastTypeSteps(SCOPE.context.fileName, {
                    data: SCOPE.context.id,
                    type: 'info',
                    fileType: 1,
                    url: SCOPE.vDetails
                })
            }
            if (SCOPE.context.fileType === "3") {
                cloudNav.deleteLastTypeSteps(SCOPE.context.fileName || strtuctureType[SCOPE.context.structuredType], {
                    data: SCOPE.context.id,
                    type: 'info',
                    fileType: 3,
                    url: SCOPE.sDetails
                })
            }
            if (localStorage.getItem('upDataInfo_y')) {
                var type = SCOPE.context.fileType - 0;
                jQuery('div.sidebar').find('li[data-cat=' + type + ']').trigger('click');
            }
        },
        goBackClick: function() {
            jQuery('.location').find('.navi:last').trigger('click');
        },
        naviClick: function() {
            var index = jQuery(this).index('a.navi'),
                data = SCOPE.jump2steps[index].data,
                type = SCOPE.jump2steps[index].type,
                originId = SCOPE.jump2steps[index].originId;
            /**
             * 点击左侧文件类型,全部,视频,图片,结构化
             * */
            if (type === 'data-cat') {
                jQuery('div.sidebar li.a' + data + ' h6').trigger('click');
            }
            /**
             * 点击结构化信息分类人车,物等
             * */
            if (type === 'data-type') {
                jQuery('div.sidebar li a.s' + data).trigger('click');
            }
            /**
             * 点击某个文件夹或者结构化信息详情
             * */
            if (type === 'id') {
                SCOPE.cList = SCOPE.jump2steps[index].url;
                /*记录文件夹id*/
                SCOPE.context.id = data;
                SCOPE.theId = data;
                /*directoryId为文件Id,根目录为0*/
                SCOPE.directoryId = data;
                /*裁剪数据*/
                SCOPE.steps.length = index + 1;
                SCOPE.jump2steps.length = index + 1;
                cloudNav.updateSteps();
                //self.showP();
                showDetailList.showP();
                VIEW.toggleSearch(true);

                SCOPE.fileName = '';
                SCOPE.eTime = '';
                SCOPE.bTime = '';

                ASSIST_CONTROLLER.makeUpWpage(function(html) {
                    VIEW.afterMakeup83(html);
                });
            }
            /**
             * info:查看视频,图片详情
             * */
            if (type === 'info') {
                SCOPE.cList = SCOPE.jump2steps[index].url;
                /*记录文件夹id*/
                SCOPE.context.id = originId || data;
                SCOPE.theId = originId || data;
                //SCOPE.jump2steps[index].fileType === 1 ? ASSIST_CONTROLLER.getVideoDetail() : ASSIST_CONTROLLER.getPictureDetail();
                if (SCOPE.jump2steps[index].fileType === 1) {
                    SCOPE.wideType = 1;
                    jQuery(".sidebar .r-siderbar li.a1").trigger("click");
                    ASSIST_CONTROLLER.getVideoDetail(SCOPE.theId, {
                        data: SCOPE.theId,
                        type: 'info',
                        fileType: 1,
                        url: SCOPE.vDetails
                    });
                } else {
                    jQuery(".sidebar .r-siderbar li.a2").trigger("click");
                    SCOPE.wideType = 2;
                    ASSIST_CONTROLLER.getPictureDetail(SCOPE.theId, {
                        data: SCOPE.theId,
                        type: 'info',
                        fileType: 2,
                        url: SCOPE.pDetails
                    });
                }

                /*SCOPE.steps.length = index + 1;
                 SCOPE.jump2steps.length = index + 1;
                 cloudNav.updateSteps();*/
            }
            /**
             * 如果需要查看一个由视频/图片生成的结构化信息详情列表
             * */
            if (type === 'sList') {
                showDetailList.showP();
                SCOPE.cList = SCOPE.jump2steps[index].url;
                SCOPE.theId = SCOPE.jump2steps[index].data;
                SCOPE.steps.length = index + 1;
                SCOPE.jump2steps.length = index + 1;
                cloudNav.updateSteps();
                VIEW.toggleSearch();

                ASSIST_CONTROLLER.makeUpWpage(function(html) {
                    VIEW.afterMakeup83(html);
                    VIEW.tResize();
                });
            }
            /*点击上一步退回搜索结果列表,这里会执行*/
            if (type === 'search') {
                showDetailList.showP();
                SCOPE.cList = SCOPE.jump2steps[index].url;
                SCOPE.directoryId = SCOPE.jump2steps[index].directoryId;
                SCOPE.fileName = SCOPE.jump2steps[index].fileName;
                /*记录文件夹id*/
                SCOPE.steps.length = index + 1;
                SCOPE.jump2steps.length = index + 1;
                cloudNav.updateSteps();
                VIEW.toggleSearch(true);

                ASSIST_CONTROLLER.makeUpWpage(function(html) {
                    VIEW.afterMakeup83(html);
                    VIEW.tResize();
                });
            }
        },
        sidebarLiClick: function(e) {

            //SCOPE.context.id = '';
            /**
             * 样式切换
             */
            VIEW.toggleClass(jQuery(this));
            /**
             * 初始化搜索
             */
            VIEW.initSearch();
            /**
             * 重置标题以及全选按钮
             */
            VIEW.initTitle();
            /**
             * 默认是进入当前类别的根目录
             */
            SCOPE.directoryId = 0; /*根目录directoryId = 0*/
            /**
             * 通过tag确定执行流程，通过分类 id 来确定右侧显示不同的内容，并设置面包屑
             */
            if (jQuery(this)[0].nodeName === 'LI') {
                var cat = jQuery(this).attr("data-cat") - 0;
                SCOPE.wideType = cat;
                SCOPE.pageNo = 0;
                switch (cat) {
                    case 0:
                        cloudNav.steps_all();
                        showDetailList.init();
                        break;
                    case 1:
                        cloudNav.steps_video();
                        showDetailList.showVideo();
                        break;
                    case 2:
                        cloudNav.steps_img();
                        showDetailList.showPicture();
                        break;
                    case 3:
                        cloudNav.steps_struc();
                        SCOPE.sType = ''; /*空值表示全部*/
                        showDetailList.showStructure();
                        break;
                    case 4:
                        cloudNav.steps_case();
                        showDetailList.showEvent();
                        break;
                }
                /**
                 * 显示不同的搜索样式
                 */
                cat === 3 ? VIEW.toggleSearch(false) : VIEW.toggleSearch(true);
            }
            /**
             * 如果是结构化信息里面的不同类型则执行此处
             */
            if (jQuery(this)[0].nodeName === 'A') {
                SCOPE.pageNo = 0;
                /**
                 * 给二级筛选设置高亮
                 */
                VIEW.initSsource();

                SCOPE.sType = jQuery(this).attr('data-type') - 0;
                /*whichSText依赖sType*/

                cloudNav.steps_struc_type();

                showDetailList.showStructure();
            }
            e.stopPropagation();
        },
        creatNewFloderClick: function() {
            var string = ['<dd class="new-file">',
                '<label class="check-label">',
                '<input type="checkbox" class="checkbox">',
                '</label>',
                '<h6 class="l-name">',
                '<i class="new-floder-icn"></i>',
                '<input placeholder="新建文件夹" class="new-floder-name">',
                '<span class="create-new-file-ok"></span>',
                '<span class="create-new-file-cancel"></span>',
                '</h6>',
                '<em class="l-size">---</em>',
                '<p class="l-time">---</p>',
                '</dd>'
            ].join("");
            if ($(".overview .list-content .new-file").length > 0) {
                return;
            } else {
                $(".list-content").prepend(string);
            }
            jQuery(".new-floder-name").focus();
        },
        createNewFileCancel: function() {
            $(".new-file").remove();
            $(".new-floder-name").val("新建文件夹");
        },
        createNewFileOk: function() {
            var floderName = $(".new-floder-name").val(),
                parentId = SCOPE.directoryId;
            if (floderName === "") {
                notify.info("请输入文件夹名称")
                return;
            }
            ajaxModule.createNewFloder(floderName, parentId).then(function(res) {
                if (res && res.code === 200) {
                    SCOPE.pageNo = 0;
                    ASSIST_CONTROLLER.makeUpWpage(function(html) {
                        VIEW.afterMakeup83(html);
                    });
                    $(this).attr({
                        "currentId": res.data
                    })
                    jQuery(".new-floder-name").removeClass("error");
                } else if (res && res.code === 511) {//文件重名
                    notify.warn("该文件夹名称已被使用!");
                    jQuery(".new-floder-name").addClass("error");
                    return;
                } else {
                    notify.warn(res.data);
                }
            })
        },
        localUploadFileClick: function() {
            resourceImportPanel.setOptions({
                cloud: false
            });
            resourceImportPanel.open();
            $(this).attr({
                "data-currentId": SCOPE.directoryId
            })
        },
        submitBtnClick: function() {
            var fileName = jQuery('#fileName').val().trim(),
                bTime = jQuery('#beginTime').val().trim(),
                eTime = jQuery('#endTime').val().trim();

            SCOPE.fileName = fileName;

            if (bTime !== '' && eTime !== '' && (bTime > eTime)) {
                notify.info('起始时间不能大于结束!', {
                    outtime: '1000'
                });
                return;
            } else {
                SCOPE.bTime = bTime;
                SCOPE.eTime = eTime;
            }

            SCOPE.cOldList = SCOPE.cList; /*cOldList保存之前的接口类型*/

            if (SCOPE.cList !== SCOPE.eList) { /*案事件搜索有单独接口*/
                SCOPE.cList = SCOPE.searchList; /*定位搜索接口*/
                VIEW.toggleClass(jQuery('.a0'));
                cloudNav.search_normal();
            } else {
                cloudNav.search_case();
            }

            showDetailList.showP();

            ASSIST_CONTROLLER.makeUpWpage(function(html) {
                VIEW.afterMakeup83(html);
            });
        },
        getStorage: function() {
            ajaxModule.loadData("/service/pcm/get_config").done(function(data) {
                VIEW.rendStorage(data);
            });
        },
        multiDelClick: function() {
            var msg = "您确认删除所有选中内容!",
                api = PARSE_TOOL.getDelApi() || "delete_dir"; /*删除接口*/
            var callback = function() {
                if (SCOPE.wideType === 0) {
                    ajaxModule.postData("/service/pcm/delete_all_files", {
                        type1: 0,
                        directorIds: PARSE_TOOL.getIds()[0],
                        type2: 1,
                        viewIds: PARSE_TOOL.getIds()[1],
                        type3: 2,
                        structureIds: PARSE_TOOL.getIds()[2]
                    }).then(function(res) {
                        if (res && res.code === 200) {
                            notify.info("删除成功!");
                            jQuery('.sidebar').find("li[data-cat=" + SCOPE.wideType + "]").trigger('click');
                        } else {
                            notify.info("删除失败!");
                        }
                    });
                } else {
                    ajaxModule.postData("/service/pcm/" + api, {
                        ids: PARSE_TOOL.getIds()
                    }).then(function(res) {
                        if (res && res.code === 200) {
                            notify.info("删除成功!");
                            jQuery('.sidebar').find("li[data-cat=" + SCOPE.wideType + "]").trigger('click');
                        } else {
                            notify.info("删除失败!");
                        }
                    });
                }
            };
            VIEW.dialog(msg, callback);
        },
        listpicClick: function() {
            jQuery("#content").removeClass("block");
            jQuery(this).addClass('listpic_current').siblings().removeClass('thumbnail_current');
        },
        thumbnailClick: function() {
            jQuery("#content").addClass("block");
            jQuery(this).addClass('thumbnail_current').siblings().removeClass('listpic_current');
        },
        /**
         * @name showStructure
         * @description 显示结构化信息列表
         */
        showStructure: function() {
            SCOPE.cList = SCOPE.sList;
            SCOPE.pageNo = 0;
            jQuery('.pagination').html('');
            jQuery('.pagination').show();
            VIEW.toggleSearch(false);
            ASSIST_CONTROLLER.makeUpWpage(function(html) {
                VIEW.afterMakeup83(html);
            });
        },

        /**
         * @name getStructureListByVideoId
         * @param {{number}} 视频的 id
         * @description 通过视频 id 获得此视频的结构化信息
         */
        getStructureListByVideoId: function(id) {
            SCOPE.cOldList = 'get_video_list';
            SCOPE.cList = SCOPE.sListByvideo;
            SCOPE.pageNo = 0;
            jQuery('.pagination').html('');
            jQuery('.pagination').show();
            VIEW.toggleSearch();
            if (id) {
                SCOPE.context.id = id;
                SCOPE.theId = id;
                jQuery(".sidebar .r-siderbar").find('li[data-cat="3"]').find("h6").addClass("current");
                jQuery(".sidebar .r-siderbar").find('li[data-cat="3"]').find("i").addClass("icon_structured_blue");
                jQuery(".sidebar .r-siderbar").find('li[data-cat="3"]').siblings().find("h6").removeClass("current");
                jQuery(".sidebar .r-siderbar").find('li[data-cat="3"]').siblings().find("i").removeClass("icon_event_blue");
            }
            ASSIST_CONTROLLER.makeUpWpage(function(html) {
                VIEW.afterMakeup83(html);
            });
        }
    }

});
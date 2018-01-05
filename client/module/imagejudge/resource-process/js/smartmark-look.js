/**
 * [智能标注内容查看面板类]
 * @author wangchaofan
 * @date   2014-11-28
 * @param  {[object]}   options[面板可配置参数]
 */
define([
    'pubsub',
    'handlebars',
    '/module/imagejudge/resource-process/js/BlankPanel.js',
    '/module/imagejudge/resource-process/js/player1.js',
    '/module/imagejudge/resource-process/js/overlayPlayerBar.js',
    '/module/imagejudge/resource-process/js/imageInfoConf.js',
    'underscore',
    '/module/common/viewPic/viewPic.js',
    'jquery.pagination'
], function(PubSub, Handlebars, BlankPanel, CommonOnePlayer, overlayPlayBar, imageInfoConf, _, viewPic) {
    var SmartMarkLookPanel = new Class({
        Extends: BlankPanel,
        viewPicObj: null, //点击快照弹出遮罩层对象
        viewPicData: [], //点击快照弹出遮罩层数据
        timeFn: null, //解决快照双击事件触发单机事件
        viewCloseMessage: 'viewPicIsClosed', //初始化快照弹出层传入“遮罩层关闭时广播的消息名”
        viewDeleteMessage: 'viewPicIsDelete', //初始化快照弹出层传入“遮罩层图片删除时广播的消息名”
        readSnapShootMessage: 'viewPicIsRead', //初始化快照弹出层传入“阅读快照时时广播的消息名”
        oldSelectTargetId: '', //选中快照的id
        allOldSelectTargetId: [], //已读快照id
        selectTargetPage: 1, // 选中快照的页码
        currentPage: 1, //快照当前页
        origPlayer: null, // 原始视频播放器对象
        cutPlayer: null, // 剪切视频播放器对象
        screenType: 'snapshoot', //当前的页签是快照还是叠加型视频
        FORCED_UPDATE: false, // 是否强制提示更新 OCX
        overlayPlayerInited: false, //判断当前叠加型视频是否加载过
        overlayFilterChange: false, //切换快照和叠加型视频时 过滤条件清空 判断叠加型视频是否处于有条件过滤状态
        thumbnailWidth: 134, //已标注缩略图宽度
        thumbnailToLeftIndex: 0, //缩略图左移个数
        thumbnailContainerWidth: 0, //缩略图控件宽度
        currentThumbnailObj: null, //当前缩略图对象
        thumbnailNum: 0, //缩略图个数
        thumbnailTpl: '/module/imagejudge/resource-process/inc/thumbnail.html', //缩略图静态模版
        options: {
            // 页面模板路径
            selfTpl: '/module/imagejudge/resource-process/inc/smartmark-look.html',

            // 原始视频信息
            origVideoInfo: {
                id: '', //当前视频id
                fileName: '', //视频名称
                resource: 0, // 来源
                vid: "",
                shoottime: 0, // 拍摄时间
                fileUrl: "", // 文件路径
                isClue: null //是否可以生成线索
            },

            // 目标快照配置信息
            targetOptions: {
                url: '/service/pia/searchStructuredCommonInfo', // 查询接口地址
                //url:'/module/imagejudge/resource-process/js/testDate.js',
                detailUrl: '/service/pia/getStructuredInfo', // 查询详细接口地址
                targetTplUrl: '/module/imagejudge/resource-process/inc/targetInfo.html', // 快照信息模板地址
                defaultPic: '/module/imagejudge/resource-process/images/default_snapshoot.png', //默认缩略图
                imageUrl: '/service/pfsstorage/image',
                page: 1, //当前页
                pageSize: 0 //当前页显示信息条数(默认请求所有数据)
            },

            // 剪切型视频配置信息
            cutOptions: {
                url: '/service/pia/getClipSummary', // 查询接口地址
                addUrl: '/service/pvd/clue', // 生成线索
                removeUrl: '/service/pia/deleteStructuredInfo' // 删除结构化信息
            },

            //叠加型视频配置信息
            overlayOptions: {
                url: '/service/pia/getOverlaySummary ' //查询接口地址
            },
            //存放数据
            allDate: {
                targetDate: ""
            }
        },
        initialize: function(options) {
            var self = this;
            // 调用父类构造器
            self.parent(options);
            // 监听模板加载，加载完毕后初始化页面
            self.createPageElement();
            self.getMarkedVideoInfo();
            self.bindPageEvent();
            // 重置初始化快照列表状态
            //如果左侧目标快照列表加载太慢，右侧视频一直在播放，没有暂停 【bug#41558】
            self.tab_snapshoot.trigger("click");
            //更新播放器地址
            self.origPlayer && self.origPlayer.setFileUrl(self.options.origVideoInfo.fileUrl);
            self.cutPlayer && self.cutPlayer.setFileUrl(self.options.origVideoInfo.fileUrl);
            self.subscribe();
        },
        //处理pubSub发送的消息
        subscribe: function() {
            var self = this;
            //叠加性视频播放失败
            PubSub.subscribe('overlayPlayError', function() {
                self.overlayPlayerInited = false;
            });
            //叠加型视频目标双击事件
            PubSub.subscribe('overlayLButtonDblClick', function(msg, data) {
                self.origPlayer.playByTime(data.startTime);
                self.pauseOverlayPlayer();
            });
            //叠加性视频目标选中事件
            PubSub.subscribe('SelectObjChanged', function(msg, reMark) {
                if (reMark === -1) {
                    if ($('#overlay_btn_play').attr('title') !== '暂停') {
                        $('#overlay_btn_play').trigger('click');
                    }
                } else {
                    self.pauseOverlayPlayer();
                }
            });
            //快照显示弹出层关闭消息处理
            PubSub.subscribe(self.viewCloseMessage, function(mes, currentPage) {
                    self.hideOrShowPlayer('#common-player-orig', false, 'orig');
                    self.queryTarget(undefined, currentPage);
                    self.addReadImgStatus();
                })
                //快照显示弹出层删除消息处理
            PubSub.subscribe(self.viewDeleteMessage, function(message, data) {
                    _.without(self.allOldSelectTargetId, data.id);
                    self.removeTarget(data);
                })
                //快照弹出层已读消息处理
            PubSub.subscribe(self.readSnapShootMessage, function(message, id) {
                if (_.indexOf(self.allOldSelectTargetId, id) === -1) {
                    self.allOldSelectTargetId.push(id);
                };
            })
        },
        //获取已经智能标注的视频信息
        getMarkedVideoInfo: function() {
            var self = this;
            $.ajax({
                url: '/service/pia/querySimpleResource',
                dataType: 'json',
                type: 'GET',
                data: {},
                success: function(res) {
                    if (res && res.code === 200) {
                        self.thumbnailNum = res.data.list.length;
                        self.loadMarkedVideoTemplate(res.data);

                    } else {
                        notify.warn('获取已标注视频信息失败！');

                    }
                },
                error: function() {
                    notify.warn('获取已标注视频信息失败！');
                }
            })
        },
        //将当前视屏缩略图数据移至首位
        currentThumbnailToFirst: function(data) {
            var self = this;
            var arr1 = _.filter(data.list, function(item) {
                return item.id === self.options.origVideoInfo.id;
            });
            var arr2 = _.reject(data.list, function(item) {
                return item.id === self.options.origVideoInfo.id;
            });
            var returnArr = _.union(arr1, arr2);
            return {
                list: returnArr
            };
        },
        loadMarkedVideoTemplate: function(data) {
            var self = this;
            var template = '';
            $.get(self.thumbnailTpl, function(tmp) {
                template = Handlebars.compile(tmp);
                self.thumbnailContent.append(template(self.currentThumbnailToFirst(data)));
                self.bindThumbnailEvent();
            })
        },
        bindThumbnailEvent: function() {
            var self = this;
            self.markedVideoImage = self.markedVideoThumbnails.find('.thumbnail_content .markedVideoImage');
            self.hoverImage = self.markedVideoImage.find('.hoverImage');

            self.currentThumbnailObj = self.markedVideoImage.find('.hoverCurrentImage').eq(0);
            self.currentThumbnailObj.removeClass('hidden');

            self.markedVideoImage.on('mouseover', function() {
                    if ($(this).find('.hoverCurrentImage').hasClass('hidden')) {
                        $(this).find('.hoverImage').removeClass('hidden');
                    }
                }).on('mouseout', function() {
                    if ($(this).find('.hoverCurrentImage').hasClass('hidden')) {
                        $(this).find('.hoverImage').addClass('hidden');
                    }
                })
                //已智能标注的视频缩略图点击事件
            self.markedVideoImage.off('click').on('click', function() {
                var cid = $(this).data('cid'),
                    pid = $(this).data('pid');
                if ($(this).find('.hoverCurrentImage').hasClass('hidden')) {
                    self.options.origVideoInfo.vid = cid || pid;
                    self.options.origVideoInfo.resource = self.getVideoResource(cid, pid);
                    self.options.origVideoInfo.shoottime = $(this).data('shoottime');
                    self.options.origVideoInfo.fileUrl = $(this).data('fileurl');
                    self.options.origVideoInfo.isClue = $(this).data('isclue');
                    self.options.origVideoInfo.fileName = $(this).find('.ThumbnailTitle').text();
                    self.overlayPlayerInited = false;
                    self.setOrigPlayerTitle();
                    self.tab_snapshoot.trigger("click");
                    //更新播放器地址
                    self.origPlayer && self.origPlayer.setFileUrl(self.options.origVideoInfo.fileUrl);
                    self.cutPlayer && self.cutPlayer.setFileUrl(self.options.origVideoInfo.fileUrl);
                    self.currentThumbnailObj.addClass('hidden');
                    self.currentThumbnailObj = $(this).find('.hoverCurrentImage');
                    $(this).find('.hoverImage ').addClass('hidden');
                    self.currentThumbnailObj.removeClass('hidden');
                } else {
                    //当前智能视频
                    //do something
                }
            })
        },
        getVideoResource: function(cid, pid) {
            if (cid) {
                return 1;
            } else if (pid) {
                return 2;
            }
        },
        createPageElement: function() {
            var self = this;

            var container = $(".smarkresult-container");
            self.smarkresult_container = container;

            self.origPlayerTitle = container.find('.smarkresult-content-item .origPlayerTitle');
            self.content_query = container.find(".smarkresult-content-query");
            self.targettype = self.content_query.find(".targettype");
            self.targetcolor = self.content_query.find(".targetcolor");
            self.snapshootNum = $("#snapshootNum");

            self.content_cutsetting = container.find(".smarkresult-content-cutsetting");
            self.speed_mark = self.content_cutsetting.find(".speed-mark");
            self.speed_nomark = self.content_cutsetting.find(".speed-nomark");
            self.content_result = container.find(".smarkresult-content-result");
            self.tab_snapshoot = self.content_result.find(".tabs .ui.tabular li[data-tab=snapshoot]");
            self.tab_snapshoot_window = self.content_result.find(".tabs .content .ui.playerTab[data-tab=snapshoot] ");
            self.tab_overlay = self.content_result.find(".tabs .ui.tabular li[data-tab=overlay]");
            self.tab_cut = self.content_result.find(".tabs .ui.tabular li[data-tab=cut]");
            self.tab_cut_content = self.content_result.find(".tabs .ui.playerTab[data-tab=cut]");
            self.tab_overlay_content = self.content_result.find(".tabs .ui.playerTab[data-tab=overlay]");
            self.tab_cut_content_loading = self.tab_cut_content.find(".loading");
            self.tab_overlay_content_loading = self.tab_overlay_content.find(".loading");
            self.tab_cut_content_noresult = self.tab_cut_content.find(".noresult");
            self.tab_overlay_content_noresult = self.tab_overlay_content.find(".noresult");
            self.tab_overlay_content_density = self.tab_overlay_content.find(".overlay-select-density");

            self.target_view = self.content_result.find(".snapshoot-view");
            self.target_view_loading = self.target_view.find(".loading");
            self.target_page = self.content_result.find(".snapshoot-page");
            self.target_pagination = self.target_page.find(".pagination");

            self.target_search_input = self.content_result.find(".snapshoot-tools .tool-search-input");
            self.target_search_btn = self.content_result.find(".snapshoot-tools .tool-search-btn");

            self.checkMarkedVideo = $('.checkMarkVideo').find('span');
            self.markedVideoThumbnails = $('.markedVideoThumbnail');
            self.markedVideoIcon = self.checkMarkedVideo.find('.checkVideoUnderIcon');
            self.thumbnailContent = self.markedVideoThumbnails.find('.thumbnail_content');
            self.thumbnailToLeft = self.markedVideoThumbnails.find('.thumbnail_Left');
            self.thumbnailToRight = self.markedVideoThumbnails.find('.thumbnail_right');
            self.preview = $('#np-preview-picture');
            // 初始化原始视频组件
            self.setOrigPlayerTitle();
            //初始化原始视频
            self.origPlayer = new CommonOnePlayer({
                container: '#common-player-orig',
                fileUrl: self.options.origVideoInfo.fileUrl,
                fileName: self.options.origVideoInfo.fileName,
                shootTime: self.options.origVideoInfo.shoottime,
                needModel: false
            });
            self.origPlayer.init();
        },
        //设置快照总数
        setOrigPlayerTitle: function() {
            var self = this;
            this.origPlayerTitle.text(self.options.origVideoInfo.fileName)
        },
        setSnapShootNum: function(num) {
            this.snapshootNum.text(num);
        },
        //清除快照和叠加型视频筛选条件
        clearFilterCondition: function() {
            var self = this;
            self.targettype.find(":checkbox").prop("checked", false);
            self.targetcolor.find(".color-item > .color").removeClass("selected");
        },
        //目标快照生成限线索
        postStructureInfo: function(targetInfo) {
            var self = this;
            //            var resource = self.options.origVideoInfo.resource;

            //            //resource   1云空间 2视图库
            //            if (resource === 1 || self.options.origVideoInfo.isClue !== '1') {
            //                notify.warn("不可生成线索");
            //                return;
            //            }
            $.when(self.ajax({
                url: self.options.cutOptions.addUrl,
                type: "POST",
                moduleName: "线索",
                data: {
                    id: targetInfo.id,
                    type: targetInfo.type
                }
            })).done(function(data) {
                notify.success("生成线索成功！");
                self.tab_snapshoot.trigger("click");
            });
        },
        //暂停剪切型视频
        pauseCutPlayer: function() {
            var self = this;
            if (self.cutPlayer !== null) {
                self.cutPlayer.pause();
            }
        },
        //暂停叠加型视频
        pauseOverlayPlayer: function() {
            var self = this;
            if ($('#overlay_btn_play').attr('title') === '暂停') {
                $('#overlay_btn_play').trigger('click');
            }
        },
        playerSize: {
            'cut': {
                height: 0
            },
            'overlay': {
                height: 0
            },
            'orig': {
                height: 0
            }
        },
        //隐藏显示OCX视频切换
        hideOrShowPlayer: function(dom, hide, type) {
            var self = this;
            if (hide) {
                if ($(dom).width() === 1 && $(dom).height() === 1) {
                    return;
                }
                self.playerSize[type].height = $(dom).height();
                $(dom).width(1);
                $(dom).height(1);
                $(dom).css({
                    left: -9999,
                    position: 'absolute'

                })
            } else {
                if ($(dom).height === self.playerSize[type].height) {
                    return;
                }
                $(dom).width('100%');
                $(dom).height(self.playerSize[type].height);
                $(dom).css({
                    left: 0,
                    position: 'inherit'
                })
            }
        },
        //对不可生成线索的视频的目标快照的生成线索进行隐藏
        hideAddStructureInfo: function() {
            var self = this;
            if (self.options.origVideoInfo.resource === 1 || parseInt(self.options.origVideoInfo.isClue) !== 1) {
                self.target_view.find('.tool-add').addClass('hidden');
            }
        },
        //获取当前点击的快照在快照列表中的位置
        getClickTargetIndex: function(id) {
            var self = this;
            var index = 0;
            for (var i = 0; i < self.viewPicData.length; i++) {
                if (self.viewPicData[i].id === id) {
                    index = i;
                    break;
                }
            }
            return index;
        },
        //添加页面事件
        bindPageEvent: function() {
            var self = this;
            //目标快照和叠见型视频筛选
            var screenTypeObj = {
                'snapshoot': function() {
                    self.tab_snapshoot.trigger("click");
                    self.oldSelectTargetId = '';
                    self.allOldSelectTargetId = [];
                    self.removeTargetSelectStatus();
                },
                'overlay': function(str) {
                    self.overlayPlayerInited = false;
                    self.overlayPlayerInited = false;
                    self.tab_overlay.trigger("click");
                    var filterData = self.getOverlayParam();
                    if ((filterData.color !== '' || filterData.type !== '') && str === 'ok') {
                        self.overlayFilterChange = true;
                    }
                }
            }
            document.body.onselectstart = function(){ //add by Leon.z 未处理当拖动小圆点时触发其他选择事件造成的bug
                return false;
            }
            //目标快照页签点击事件
            self.tab_snapshoot.on("click", function(event) {
                self.hideOrShowPlayer('#common-player-cut', true, 'cut');
                self.hideOrShowPlayer('#common-player-overlay', true, 'overlay');
                self.tab_snapshoot_window.show();
                self.pauseOverlayPlayer();
                self.pauseCutPlayer();
                // 初始化快照列表
                if (self.screenType !== 'snapshoot') {
                    $('#sq-move').attr('value', '5');
                    $('#sq-move-label').text('运动目标');
                    $('#sq-face-label').text('人脸（人员）');
                    self.clearFilterCondition();
                }
                self.options.allDate.targetDate = "";
                self.queryTarget();
                self.content_query.removeClass("hidden");
                self.content_cutsetting.addClass("hidden");
                self.screenType = 'snapshoot';
            });

            //剪切型页签点击事件
            self.tab_cut.on("click", function(event) {
                self.hideOrShowPlayer('#common-player-overlay', true, 'overlay');
                self.hideOrShowPlayer('#common-player-cut', false, 'cut');
                self.tab_snapshoot_window.hide();
                self.pauseOverlayPlayer();
                // 显示视频片段标记
                self.showCutMarkTime();

                self.content_query.addClass("hidden");
                self.content_cutsetting.removeClass("hidden");
            });

            //叠加型视频页签点击事件
            self.tab_overlay.on("click", function(event) {
                self.hideOrShowPlayer('#common-player-cut', true, 'cut');
                self.hideOrShowPlayer('#common-player-overlay', false, 'overlay');
                self.tab_snapshoot_window.hide();
                if (self.overlayFilterChange) {
                    self.overlayPlayerInited = false;
                    self.overlayFilterChange = false;
                }
                self.pauseCutPlayer();
                if (self.screenType !== "overlay") {
                    $('#sq-move').attr('value', '3');
                    $('#sq-move-label').text('物体');
                    $('#sq-face-label').text('人体');
                    self.clearFilterCondition();
                }
                self.content_query.removeClass("hidden");
                self.content_cutsetting.addClass("hidden");
                //显示叠加型视频
                if (!self.overlayPlayerInited) {
                    self.hideOrShowPlayer('#common-player-overlay .player-container', true, 'overlay');
                    self.getOverlayPlayerInfo();
                    $('.overlay_density #overlay-select-density') && $('.overlay_density #overlay-select-density').val('3');
                } else {
                    self.tab_overlay_content_loading.addClass("hidden");
                }
                self.screenType = "overlay";
            });

            // 选择/取消选择颜色
            self.targetcolor.find(".color-item > .color").on("click", function() {
                $(this).toggleClass("selected");
            });

            // 目标快照和叠加型视频筛选条件重置
            self.content_query.find("#smartMark_resetBtn").on("click", function() {
                self.targettype.find(":checkbox").prop("checked", false);
                self.targetcolor.find(".color-item > .color").removeClass("selected");
                screenTypeObj[self.screenType]('reset');
            });


            // 目标快照和叠加型视频筛选条件确定
            self.content_query.find("#smartMark_okBtn").on("click", function() {
                screenTypeObj[self.screenType]('ok');
            });

            // 搜索
            self.target_search_btn.on("click", function() {
                self.options.allDate.targetDate = "";
                self.queryTarget({
                    key: self.target_search_input.val()
                });
                self.oldSelectTargetId = '';
                self.allOldSelectTargetId = [];
                self.removeTargetSelectStatus();
            });

            //搜索框回车
            self.target_search_input.on('keydown', function(event) {
                if (event.keyCode === 13) {
                    self.target_search_btn.trigger('click');
                }
            });
            //搜索框为空
            self.target_search_input.on('blur', function(event) {
                if ($(this).val().trim() == '') {
                    self.target_search_btn.trigger('click');
                }
            });

            // 点击目标快照
            $(self.target_view).on("dblclick", ".view-item-inner", function() {
                
                clearTimeout(self.timeFn);
                if (self.oldSelectTargetId !== '') {
                    self.removeTargetSelectStatus();
                }
                self.oldSelectTargetId = $(this).data("id");
                if (_.indexOf(self.allOldSelectTargetId, $(this).data("id")) === -1) {
                    self.allOldSelectTargetId.push($(this).data("id"));
                };
                self.addTargetSelectStatus();
                self.selectTargetPage = self.currentPage;
                $(this).find('.readImg').removeClass('hidden');
                var targetInfo = {
                    id: $(this).data("id"),
                    startTime: $(this).data("starttime"),
                    endTime: $(this).data("endtime"),
                    type: $(this).data("type")
                };

                // 播放当前快照
                self.playTarget(targetInfo);
            });
            //目标快照单击事件
            $(self.target_view).on('click', ".view-item-inner", function() {
                var id = $(this).data('id');
                clearTimeout(self.timeFn);
                //处理双击事件对单单击事件的触发
                self.timeFn = setTimeout(function() {
                    self.hideOrShowPlayer('#common-player-orig', true, 'orig');
                    self.viewPicObj = viewPic.init({
                        size: self.origPlayer.getVideoInfo(),
                        index: self.getClickTargetIndex(id),
                        data: self.viewPicData,
                        markedIsUsable: false,
                        handleIsUsable: false,
                        editTitleIsUsable: false,
                        downloadIsUsable: true,
                        addCluesUsable: self.options.origVideoInfo.resource === 2 && parseInt(self.options.origVideoInfo.isClue) === 1,
                        storeIsUsable: self.options.origVideoInfo.resource === 1,
                        message: {
                            closeMessage: self.viewCloseMessage,
                            deleteMessage: self.viewDeleteMessage,
                            readSnapShootMessage: self.readSnapShootMessage
                        }
                    });
                    self.preview.show(500);
                }, 300)
            });
            // 目标快照生成线索
            $(self.target_view).on("click", ".tool-add", function(event) {
                event.stopPropagation();

                var elem = $(this).closest(".view-item-inner");
                var targetInfo = {
                    id: elem.data("id"),
                    type: elem.data("type")
                };
                self.postStructureInfo(targetInfo);
            });

            // 删除结构化信息
            $(self.target_view).on("click", ".tool-remove", function(event) {
                event.stopPropagation();

                //如果删除的快照是已读状态 删除已读快照id数组中对应的id
                _.without(self.allOldSelectTargetId, $(this).data('id'));
                var elem = $(this).closest(".view-item-inner");
                var targetInfo = {
                    id: elem.data("id"),
                    type: elem.data("type")
                };
                self.hideOrShowPlayer('#common-player-orig', true, 'orig');
                setTimeout(function() {
                    new ConfirmDialog({
                        title: '提示',
                        message: "您确定要删除吗?",
                        callback: function() {
                            self.removeTarget(targetInfo);
                            self.hideOrShowPlayer('#common-player-orig', false, 'orig');
                        },
                        closure: function() {
                            self.hideOrShowPlayer('#common-player-orig', false, 'orig');
                        },
                        prehide: function() {
                            self.hideOrShowPlayer('#common-player-orig', false, 'orig');
                        }
                    });
                }, 50);
            });

            // 有目标播放速度
            self.speed_mark.on("change", function() {
                if (self.cutPlayer) {
                    self.cutPlayer.setOptions({
                        cutMarkSpeed: $(this).val()
                    });
                }
            });
            // 无目标播放速度
            self.speed_nomark.on("change", function() {
                if (self.cutPlayer) {
                    self.cutPlayer.setOptions({
                        cutNoMarkSpeed: $(this).val()
                    });
                }
            });

            //已经智能标注过的视频列表向左点击时间
            self.thumbnailToLeft.on('click', function() {
                self.thumbnailContainerWidth = self.thumbnailContent.width();
                if (self.thumbnailNum * self.thumbnailWidth < self.thumbnailContainerWidth || self.thumbnailToLeftIndex === 0) {
                    notify.info('当前已显示第一个缩略图！');
                } else {
                    self.thumbnailToLeftIndex--;
                    self.thumbnailContent.find('.markedVideoImage').eq(self.thumbnailToLeftIndex).removeClass('hidden');
                }
            });
            //已经智能标注过的视频列表向右点击时间
            self.thumbnailToRight.on('click', function() {
                self.thumbnailContainerWidth = self.thumbnailContent.width();
                if ((self.thumbnailNum - self.thumbnailToLeftIndex) * self.thumbnailWidth < self.thumbnailContainerWidth) {
                    notify.info('当前已显示最后一个缩略图！');
                } else {
                    self.thumbnailContent.find('.markedVideoImage').eq(self.thumbnailToLeftIndex).addClass('hidden');
                    self.thumbnailToLeftIndex++;
                }
            });
            //已经智能标注过的视频显示和隐藏按钮点击事件
            self.checkMarkedVideo.off('click').on('click', function() {
                self.changeMarkedVideoIcon();
            })
        },
        //已经智能标注过的视频显示和隐藏切换
        changeMarkedVideoIcon: function() {
            var self = this;
            if (self.markedVideoThumbnails.hasClass('hidden')) {
                self.markedVideoThumbnails.removeClass('hidden')
                self.markedVideoIcon.removeClass('checkVideoUnderIcon');
                self.markedVideoIcon.addClass('checkVideoUpIcon');
            } else {
                self.markedVideoThumbnails.addClass('hidden');
                self.markedVideoIcon.removeClass('checkVideoUpIcon');
                self.markedVideoIcon.addClass('checkVideoUnderIcon');
            }
        },
        //初始化剪切型视频对象
        initCutPalyer: function() {
            var self = this;
            // 初始化剪切型视频组件
            if (!self.cutPlayerInited) {
                self.cutPlayer = new CommonOnePlayer({
                    container: '#common-player-cut',
                    fileUrl: self.options.origVideoInfo.fileUrl,
                    enableCutMarkTime: true,
                    cutMarkSpeed: self.speed_mark.val(),
                    cutNoMarkSpeed: self.speed_nomark.val(),
                    fileName: self.options.origVideoInfo.fileName,
                    shootTime: self.options.origVideoInfo.shoottime
                });
                self.cutPlayer.init();
                self.cutPlayer.addEvent("speedChange", function(inTimeRange, speed, falg) {
                    // 无目标播放速度
                    if (!falg) {
                        if (inTimeRange) {
                            self.speed_mark.val(speed);
                        } else {
                            self.speed_nomark.val(speed);
                        }
                    }
                });
                self.cutPlayerInited = true;
            }
        },
        //获取叠加型视频数据请求参数
        getOverlayParam: function() {
            var self = this;
            var param = self.getQueryTargetParams({});
            return {
                color: param.color || '',
                type: param.type || '',
                resource: param.resource,
                vid: param.vid
            }
        },
        //获取叠加型视频数据并生成视频
        getOverlayPlayerInfo: function() {
            var self = this;
            $.when(self.ajax({
                url: self.options.overlayOptions.url,
                type: 'GET',
                data: self.getOverlayParam(),
                beforeSend: function() {
                    self.tab_overlay_content_loading.removeClass("hidden");
                    self.tab_overlay_content_noresult.addClass("hidden");
                }
            }).done(function(data) {
                if (data && data.videoSummaryOverlay && data.videoSummaryOverlay.length > 0) {
                    overlayPlayBar.init({
                        data: data.videoSummaryOverlay,
                        fileName: self.options.origVideoInfo.fileName,
                        filePath: self.options.origVideoInfo.fileUrl,
                        shootTime: self.transFromShootTime(self.options.origVideoInfo.shoottime),
                        playAllTime: self.origPlayer.getAllTime()
                    });
                    self.tab_overlay_content_loading.addClass("hidden");
                    self.hideOrShowPlayer('#common-player-overlay .player-container', false, 'overlay');
                    self.overlayPlayerInited = true;
                } else {
                    self.tab_overlay_content_loading.addClass("hidden");
                    self.overlayPlayerInited = false;
                    //$('#overlay_player_window').hide();
                    self.tab_overlay_content_noresult.removeClass("hidden");
                }
            }))
        },
        //获取月份
        getMonth: function(month) {
            if (parseInt(month) < 10) {
                month = '0' + month;
            }
            return month
        },
        //格式化传给OCX的时间参数
        transFromShootTime: function(shoottime) {
            var self = this;
            var d = new Date(shoottime);
            var Hours = parseInt(d.getHours()) < 10 ? ('0' + d.getHours()) : d.getHours();
            var Data = parseInt(d.getDate()) < 10 ? ('0' + d.getDate()) : d.getDate();
            var Minutes = parseInt(d.getMinutes()) < 10 ? ('0' + d.getMinutes()) : d.getMinutes();
            var Seconds = parseInt(d.getSeconds()) < 10 ? ('0' + d.getSeconds()) : d.getSeconds();
            shoottime = d.getFullYear() + "." + self.getMonth((d.getMonth() + 1)) + "." + Data + " " + Hours + ":" + Minutes + ":" + Seconds;
            return shoottime;

        },
        //显示剪切型视频播放进度条有目标出现时间段
        showCutMarkTime: function() {
            var self = this;
            $.when(self.ajax({
                url: self.options.cutOptions.url,
                type: "GET",
                moduleName: "获取视频片段",
                data: {
                    resource: self.options.origVideoInfo.resource,
                    vid: self.options.origVideoInfo.vid
                },
                beforeSend: function() {
                    if (!self.cutPlayerInited) {
                        self.tab_cut_content_loading.removeClass("hidden");
                    }
                    self.tab_cut_content_noresult.addClass("hidden");
                    self.hideOrShowPlayer('#common-player-cut .player-container', true, 'cut');
                }
            })).done(function(data) {
                self.tab_cut_content_loading.addClass("hidden");
                if (data.videoSummaryShear && data.videoSummaryShear.timePeriodList && data.videoSummaryShear.timePeriodList.length > 0) {
                    self.initCutPalyer();
                    setTimeout(function() {
                        self.cutPlayer.setCutMarkTime(data.videoSummaryShear.timePeriodList);
                    }, 1000);
                    self.hideOrShowPlayer('#common-player-cut .player-container', false, 'cut');
                } else {
                    self.tab_cut_content_noresult.removeClass("hidden");
                    //self.cutPlayer && self.cutPlayer.hide();
                }
            });
        },
        //在原始视频中播放目标出现时间
        playTarget: function(targetInfo) {
            var self = this;
            self.origPlayer.playByMarkTime(targetInfo.startTime - 0, targetInfo.endTime - 0);
        },
        //删除目标快照
        removeTarget: function(targetInfo) {
            var self = this;
            $.when(self.ajax({
                url: self.options.cutOptions.removeUrl,
                type: "POST",
                moduleName: "删除结构化信息",
                data: {
                    resource: self.options.origVideoInfo.resource,
                    id: targetInfo.id,
                    type: targetInfo.type
                }
            })).done(function(data) {
                notify.success("删除成功！");
                self.options.allDate.targetDate = "";
                self.tab_snapshoot.trigger("click");
                self.origPlayer.hideMark();
            });
        },
        // 查询目标快照
        queryTarget: function(params, pageNum) {
            var self = this;
            var postParams = self.getQueryTargetParams(params);
            if (pageNum) {
                postParams.currentPage = pageNum;
            }
            if (self.options.allDate.targetDate) {
                self.options.targetOptions.currentPage = postParams.currentPage;
                self.renderTarget(self.options.allDate.targetDate)
            } else {
                $.when(self.ajax({
                    url: self.options.targetOptions.url,
                    type: "GET",
                    moduleName: "获取结构化信息",
                    data: postParams,
                    beforeSend: function() {
                        self.target_view_loading.removeClass("hidden");
                    }
                })).done(function(date) {
                    self.options.allDate.targetDate = date;
                    if (self.viewPicData.length == 0) {
                        postParams.pageSize = 9;
                        postParams.currentPage = 0;
                    } else {
                        postParams.pageSize = date.totalRecords;
                    }
                    self.getViewPicData(date.list);
                    self.setSnapShootNum(date.totalRecords);
                    self.renderTarget(date);
                });
            }
        },
        //获取显示图片的弹出层需要的图片信息
        getViewPicData: function(list) {
            var self = this;
            self.viewPicData = [];
            _.map(list, function(item, index) {
                self.viewPicData.push({
                    id: item.id,
                    type: item.type,
                    img: "/img" + item.thumbnails,
                    picture: "/img" + item.picture,
                    startTime: item.startTime,
                    title: item.remark || '未知'
                });
                if (item.objectMap && item.objectMap.movingObject) {
                    self.viewPicData[index].detail = [{
                        title: '类型',
                        description: imageInfoConf.typeNameObj[item.objectMap.movingObject.type] || '未知'
                    }, {
                        title: '出现时间',
                        description: self.getTargetTime(item.objectMap.movingObject.timeBegin)
                    }, {
                        title: '消失时间',
                        description: self.getTargetTime(item.objectMap.movingObject.timeEnd)
                    }, {
                        title: '颜色',
                        description: imageInfoConf.stdCarColorNameObj[item.objectMap.movingObject.color] || '未知'
                    }]
                    if (item.typeName === '人体') {
                        self.viewPicData[index].detail.push({
                            title: '头颜色',
                            description: imageInfoConf.stdCarColorNameObj[item.objectMap.movingObject.headColor] || '未知'
                        }, {
                            title: '上身颜色',
                            description: imageInfoConf.stdCarColorNameObj[item.objectMap.movingObject.footColor] || '未知'
                        })
                    }
                } else if (item.objectMap && item.objectMap.person) {
                    self.viewPicData[index].title = '人脸';
                    self.viewPicData[index].detail = [{
                        title: '出现时间',
                        description: self.getTargetTime(item.objectMap.person.ctmTimeBegin)
                    }, {
                        title: '消失时间',
                        description: self.getTargetTime(item.objectMap.person.ctmTimeEnd)
                    }]
                } else if (item.objectMap && item.objectMap.car) {
                    self.viewPicData[index].detail = [{
                        title: '出现时间',
                        description: self.getTargetTime(item.objectMap.car.ctmTimeBegin)
                    }, {
                        title: '消失时间',
                        description: self.getTargetTime(item.objectMap.car.ctmTimeEnd)
                    }, {
                        title: '号牌种类',
                        description: imageInfoConf.stdLicenseTypeObj[item.objectMap.car.stdLicenseType] || '未知'
                    }, {
                        title: '车牌颜色',
                        description: imageInfoConf.stdLicenseColorNameObj[item.objectMap.car.stdLicenseColor] || '未知'
                    }, {
                        title: '车牌号码',
                        description: item.objectMap.car.stdLicenseNumber || '未知'
                    }, {
                        title: '车辆类型',
                        description: imageInfoConf.stdCarTypeObj[item.objectMap.car.stdCarType] || '未知'
                    }, {
                        title: '车身颜色',
                        description: imageInfoConf.stdCarColorNameObj[item.objectMap.car.stdCarColor] || '未知'
                    }, {
                        title: '车标',
                        description: imageInfoConf.stdCarBrandObj[item.objectMap.car.stdCarBrand] || '未知'
                    }]
                } else {
                    self.viewPicData[index].detail = [{
                        title: '详细信息',
                        description: '没有查询到数据'
                    }]
                }

            });
        },
        //对快照接口返回数据处理获取快照图片信息
        getTargetImageData: function(data) {
            var self = this;
            if (data.list && data.list.length !== 0) {
                for (var i = 0; i < data.list.length; i++) {
                    if (data.list[i].thumbnails) {
                        data.list[i].thumbnails = self.options.targetOptions.imageUrl + '?filePath=' + data.list[i].thumbnails;
                    }
                }
            }
            return data;
        },
        //获取目标快照筛选条件
        getQueryTargetParams: function(otherParams) {
            var self = this;
            var params = {};
            // 目标类型
            self.targettype.find(":checkbox:checked").each(function() {
                params.type = params.type ? params.type : [];
                params.type.push($(this).val());
            });
            if (params.type) {
                params.type = params.type.join(",");
            }
            // 目标颜色
            self.targetcolor.find(".color-item > .color.selected").each(function() {
                params.color = params.color ? params.color : [];
                params.color.push($(this).data("value"));
            });
            if (params.color) {
                params.color = params.color.join(",");
            }
            // 关键字
            if ($.trim(self.target_search_input.val()) !== "") {
                params.key = $.trim(self.target_search_input.val());
            }

            // 合并查询参数
            params = $.extend({
                resource: self.options.origVideoInfo.resource,
                vid: self.options.origVideoInfo.vid,
                currentPage: self.options.targetOptions.page,
                pageSize: self.options.targetOptions.pageSize
            }, params, otherParams || {});
            self.options.targetOptions.currentPage = params.currentPage;
            return params;
        },
        //移除快照被选中的状态
        removeTargetSelectStatus: function() {
            var self = this;
            $(".view-item-inner[data-id=" + self.oldSelectTargetId + "]").removeClass('targetViewActive');
        },
        //添加快照被选中的状态
        addTargetSelectStatus: function() {
            var self = this;
            $(".view-item-inner[data-id=" + self.oldSelectTargetId + "]").addClass('targetViewActive');

        },
        //添加快照已读的状态
        addReadImgStatus: function() {
            var self = this;
            _.map(self.allOldSelectTargetId, function(item) {
                if ($(".view-item-inner[data-id=" + item + "]").find('.readImg') !== 0) {
                    $(".view-item-inner[data-id=" + item + "]").find('.readImg').removeClass('hidden');
                }
            })
        },
        //获取当前快照被选中的状态
        getTargetSelectStatus: function(currentPage) {
            var self = this;
            if (self.selectTargetPage === currentPage) {
                setTimeout(function() {
                    self.addTargetSelectStatus();
                }, 50)
            }
        },
        //格式化目标快照开始时间
        getTargetTime: function(startTime) {
            var self = this;
            return Toolkit.mills2datetime((self.options.origVideoInfo.shoottime - 0) + (startTime - 0));
        },
        //数据分组
        sliceAllDateArr: function(data) {
            var dateArr = [],
                len = data.length,
                pageNum = Math.ceil(len / 9),
                i = 0;
            if (i <= pageNum) {
                dateArr[i] = [];
                for (var j = 0; j < len; j++) {
                    if (j != 0 && j % 9 == 0) {
                        i++;
                        dateArr[i] = [];
                    }
                    dateArr[i].push(data[j]);
                }
            }
            return dateArr;
        },
        //请求目标快照缩略图
        findthumbnail: function(data) {
            var self = this;
            for (var i = 0; i < data.length; i++) {
                if (!data[i].thumbnails) {
                    jQuery.ajax({
                        url: '/service/pia/getStructuredImg',
                        type: 'get',
                        async: false,
                        data: {
                            id: data[i].id,
                            type: data[i].type,
                            source: self.options.origVideoInfo.resource
                        }
                    }).then(function(res) {
                        if (res.code === 200) {
                            data[i].thumbnails = "/img" + res.data;
                        }
                    });
                } else {
                    if (data[i].thumbnails.indexOf("/img") < 0) {
                        data[i].thumbnails = "/img" + data[i].thumbnails;
                    }
                }
            }
            return data;
        },
        // 渲染目标快照
        renderTarget: function(data) {
            var self = this;
            self.currentPage = data.pageNo;
            if (self.targetTpl) {
                // 隐藏加载
                self.target_view_loading.addClass("hidden");
                var dataArr = self.sliceAllDateArr(data.list);
                // 渲染列表
                if (data.totalRecords == 0) {
                    self.target_view.empty()
                } else {
                    //获取快照的缩略图  by zhangxinyu on 2015-11-1
                    var pageList = dataArr[self.options.targetOptions.currentPage - 1];
                    self.findthumbnail(pageList);
                    self.target_view.empty().append(self.targetTpl({
                        tplName: "list",
                        list: pageList
                            //list: data.list
                    }));
                }

                self.hideAddStructureInfo();
                // 渲染分页
                self.target_pagination.pagination(data.totalRecords, {
                    items_per_page: self.options.targetOptions.pageSize,
                    items_per_page: 9,
                    //current_page: data.pageNo - 1,
                    current_page: self.options.targetOptions.currentPage - 1,
                    first_loading: false,
                    callback: function(index) {
                        self.queryTarget(self.getQueryTargetParams({
                            currentPage: index + 1
                        }));
                    }
                });
                self.getTargetSelectStatus(data.pageNo);
                self.addReadImgStatus();
            } else {
                $.when(Toolkit.loadTempl(self.options.targetOptions.targetTplUrl)).done(function(tpl) {
                    self.targetTpl = Handlebars.compile(tpl);
                    Handlebars.registerHelper('getPicUrl', function(picUrl) {
                        if (!picUrl) {
                            picUrl = self.options.targetOptions.defaultPic;
                        }
                        return picUrl;
                    });
                    Handlebars.registerHelper('getTargetTime', function(startTime) {
                        return Toolkit.mills2datetime((self.options.origVideoInfo.shoottime - 0) + (startTime - 0));
                    });
                    Handlebars.registerHelper('compareValue', function(v1, v2, options) {
                        if (v1 === v2) {
                            return options.fn(this);
                        } else {
                            return options.inverse(this);
                        }
                    });

                    self.renderTarget(data);
                });
            }
        },
        //加载数据
        ajax: function(options) {
            var self = this;
            var dfd = $.Deferred();
            var errorMsg = (options.moduleName ? options.moduleName : "") + "失败！";
            $.ajax({
                type: options.type || "GET",
                cache: false,
                url: options.url,
                data: options.data || {},
                success: function(res) {
                    if (res.code === 200) {
                        dfd.resolve(res.data);
                    } else {
                        // notify.warn(errorMsg + " 返回信息：" + res.code + ":" + res.data);
                        notify.warn(errorMsg + " 状态码：" + res.code);
                        dfd.reject();
                    }
                },
                beforeSend: options.beforeSend || function() {},
                error: function(xhr) {
                    if (xhr.status === 200) {
                        notify.warn(errorMsg + " 返回数据格式错误！");
                    } else {
                        (xhr.status !== 0) && notify.warn(errorMsg + ' HTTP状态码: ' + xhr.status);
                    }
                    dfd.reject();
                }
            });
            return dfd.promise();
        }
    });

    return SmartMarkLookPanel;
})
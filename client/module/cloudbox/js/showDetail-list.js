/**
 *
 * @authors lrxia (lrxia@netposa.com)
 * @date    2015/6/15
 * @version $
 */

define(['js/assist-controller.js', 'js/cloud-view.js', 'js/cloud-nav.js', 'jquery.pagination', 'js/PARAM-STATUS.js', 'js/details-controller.js'], function(ASSIST_CONTROLLER, VIEW, cloudNav) {
    VIEW.resize();
    var pageNode = jQuery('.pagination');
    return {
        init: function() {
            this.showAllList();
        },
        showAllList: function() {
            SCOPE.cList = SCOPE.aList;
            this.showP();
            /**
             * 根据其他模块跳转过来的 url 的参数显示详细内容，其他模块的保存，然后查看详情
             */
            var location = Toolkit.paramOfUrl(window.location.href),
                hash = window.location.hash;
            if ('type' in location && !hash) {
                this.showDetail();
                return;
            }
            if (hash === "#nomenu") {
                if ('type' in location && location.type === "video#nomenu") {
                    jQuery("div.sidebar ul li.a1").trigger('click');
                    window.location.hash = "#done";
                    return;
                } else if ("type" in location && location.type === "structured") {
                    //jQuery("div.sidebar ul li.a3").trigger('click');
                    /*查看视频的结构化信息列表*/
                    cloudNav.steps_strulist_of_video(location);
                    /*最麻烦就在数据的维护,在从其他模块跳进来时,很多函数依赖了数据模型,这时这些数据必须模拟出来*/
                    SCOPE.wideType = 3;
                    SCOPE.sType = 5;
                    SCOPE.markType = 1; /*智能标注*/
                    this.getStructureListByVideoId(location.id);
                    window.location.hash = "#done";
                    return;
                }
            }
            ASSIST_CONTROLLER.makeUpWpage(function(html) {
                VIEW.afterMakeup83(html);
            });
        },
        showDetail: function() {
            var location = Toolkit.paramOfUrl(window.location.href),
                hash = window.location.hash;
            SCOPE.theId = location.id;
            SCOPE.context.id = location.id;

            VIEW.toggleClass(jQuery('.a' + location.type));
            /**
             * 根据其他模块跳转过来的 url 的参数显示详细内容，其他模块的保存，然后查看详情
             */
            if ('type' in location && !hash) {
                switch (location.type) {
                    case "0":
                        SCOPE.wideType = 0;
                        this.getFolderDetail(location.id);
                        break;
                    case "1":
                        cloudNav.steps_video();
                        SCOPE.wideType = 1;
                        ASSIST_CONTROLLER.getVideoDetail(location.id, {
                            data: location.id,
                            type: 'info',
                            fileType: 1,
                            url: SCOPE.vDetails
                        });
                        break;
                    case "2":
                        cloudNav.steps_handleByImage_of_image(location);
                        SCOPE.wideType = 2;
                        //图片详情点击图片结果集跳转结果集列表 by zhangxinyu on 2015-10-30
                        if (location.sign === "detailToList") {
                            this.getPictureHandleInfo(location.id, location);
                        } else {
                            ASSIST_CONTROLLER.getPictureDetail(location.id, {
                                data: location.id,
                                type: 'info',
                                fileType: 2,
                                url: SCOPE.vDetails
                            });
                            this.getPictureHandleInfo(location.cId || location.pId, location);
                        }
                        setTimeout(function() {
                            $(".picture-content .right-bar").addClass("skip");
                            $(".picture-content .left-bar").addClass("skip");
                        }, 1000)
                        break;
                    case "3":
                        cloudNav.steps_strulistByHandle_of_image(location);
                        SCOPE.wideType = 3;
                        ASSIST_CONTROLLER.getStructureDetail(location.id, "", {
                            data: location.id,
                            type: 'id',
                            fileType: 3,
                            url: SCOPE.sDetails
                        }, function() {
                            VIEW.toggleClass(jQuery('.s' + SCOPE.dContext.structuredType));
                        });
                        this.getPictureHandleInfo(location.cId || location.pId, location);
                        setTimeout(function() {
                            $(".right-bar").addClass("skip");
                            $(".left-bar").addClass("skip");
                        }, 1000)
                        break;
                    case "4":
                        /*查看视频的结构化信息列表*/
                        cloudNav.steps_strulist_of_video(location);
                        /*最麻烦就在数据的维护,在从其他模块跳进来时,很多函数依赖了数据模型,这时这些数据必须模拟出来*/
                        SCOPE.wideType = 3;
                        SCOPE.sType = 5;
                        SCOPE.markType = 1; /*智能标注*/
                        this.getStructureListByVideoId(location.id);
                        break;
                }
                window.location.href = window.location.href + "#done";
                $(".right-bar").addClass("skip");
                $(".left-bar").addClass("skip");
            }
        },
        showVideo: function() {
            SCOPE.cList = SCOPE.vList;
            this.showP();
            VIEW.toggleSearch(false);
            ASSIST_CONTROLLER.makeUpWpage(function(html) {
                VIEW.afterMakeup83(html);
            });
        },
        showPicture: function() {
            SCOPE.cList = SCOPE.iList;
            this.showP();
            VIEW.toggleSearch(false);
            ASSIST_CONTROLLER.makeUpWpage(function(html) {
                VIEW.afterMakeup83(html);
            });
        },
        showStructure: function() {
            SCOPE.cList = SCOPE.sList;
            this.showP();
            VIEW.toggleSearch(false);
            ASSIST_CONTROLLER.makeUpWpage(function(html) {
                VIEW.afterMakeup83(html);
            });
        },
        showEvent: function() {
            SCOPE.cList = SCOPE.eList;
            this.showP();
            SCOPE.fileName = '';
            SCOPE.bTime = '';
            SCOPE.eTime = '';
            ASSIST_CONTROLLER.makeUpWpage(function(html) {
                VIEW.afterMakeup83(html);
            });
        },
        getStructureListByVideoId: function(id) {
            SCOPE.cOldList = 'get_video_list';
            SCOPE.cList = SCOPE.sListByvideo;
            /*SCOPE.cList = SCOPE.sList;*/
            this.showP();
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
        },
        getPictureHandleInfo: function(id, location) {
            SCOPE.cOldList = 'get_image_list';
            SCOPE.cList = SCOPE.sListByvideo;
            if (location) {
                if (location.title === "image") {
                    SCOPE.cList = SCOPE.phList;
                }
            }
            this.showP();
            VIEW.toggleSearch(true);
            if (id) {
                SCOPE.theId = id;
                SCOPE.context.id = id;
            }
            ASSIST_CONTROLLER.makeUpWpage(function(html) {
                VIEW.tResize();
                VIEW.afterMakeup83(html);
            });
        },
        getFolderDetail: function(id, name, dataJson) {
            /*打开文件夹调用get_xxx_list接口*/
            /*为了在导航处显示文件夹名称,参数name必须传递*/
            SCOPE.cList = SCOPE.aList;
            if (id) {
                SCOPE.directoryId = id;
                SCOPE.theId = id;
                SCOPE.context.id = id;
            }

            ASSIST_CONTROLLER.makeUpWpage(function(html) {
                VIEW.afterMakeup83(html);
                if (dataJson) {
                    cloudNav.pushSteps(name, dataJson);
                }
            });
        },
        showP: function() {
            SCOPE.pageNo = 0;
            pageNode.html('');
            pageNode.show();
        },
        hideP: function() {
            pageNode.hide();
        }

    };

})
/**
 * [notifyClass 日志展现类]
 * @author wumengmeng
 * @date   2014-10-28
 * @return {[type]}            [description]
 */

define(["ajaxModel","jquery.pagination",
    "jquery.datetimepicker",
    "jquery-ui",
    "jquery-ui-1.10.1.custom.min",
    "jquery-ui-timepicker-addon",
    "handlebars","base.self"],function(ajaxModel){

    var NotifyClass = new  Class({
        Implements: [Options, Events],
        /**
         * [options description]
         * @param notifyTempUrl：消息模版路径
         * @param initModuleNum：统计选中消息个数
         * @param paginationContain：分页容器
         * @param pageSize：分页每页显示的条数
         * @param cPage：记录当前页
         * @param notifyContain：消息列表容器
         * @type {Object}
         */
        options: {
            notifyTplUrl: "/module/settings/usercenter/inc/notify-tpl.html",
            taskTplUrl : "/module/settings/usercenter/inc/task-tpl.html",
            initModuleNum: null,
            paginationContain: "#pagination",
            processedPagination : "#processed-pagination",
            processingPagination : "#processing-pagination",
            pageSize: 20,
            cPage: "1",
            notifyContain: "#content-List",
            taskContaining  : "#processing-list",
            taskContained  : "#processed-list"
        },
        /**
         * [urls description]
         * @type {GET_NOTIFY_URL：获取消息url}
         * @type {MARK_NOTIFY_URL：标注消息url}
         * @type {DELETE_NOTIFY_URL：删除消息url}
         * @type {SET_NOTIFY_OPERA_URL：全部标注消息url}
         */
        urls: {
            GET_NOTIFY_Number : "/service/userCenter/unreadMessagesCount/",//"",    // method get
            GET_NOTIFY_URL: "/service/userCenter/messages/",    // method get
            MARK_NOTIFY_URL: "/service/userCenter/messages/",   // method post 可批量
            DELETE_NOTIFY_URL: "/service/userCenter/messages/", //method delete 可批量
            UPDATE_NOTIFY_STATUS: "/service/userCenter/messages/status/",
            /*SET_NOTIFY_OPERA_URL: "/socket/pusher/updatallmsg/",*/
            GET_ALL_PROCESSING_TASK     : "/service/userCenter/handling/tasks/", // method get
            GET_ALL_PROCESSED_TASK : "/service/userCenter/finished/tasks/",  // method get
            DELETE_TASK  : "/service/userCenter/tasks/", // method delete
            REMOVE_ALL_TASK     : "/service/userCenter/tasks/empty/", // method delete
            CANCEL_PROCESSING_TASK : "/service/pcctask/cancel/", //method delete
            TASK_STATUS : "/service/userCenter/tasks/",

            USER : "/service/usr/get_usr"
        },
        /**
         * [notifyTpl 缓存消息模版]
         * @type {[type]}
         */
        notifyTpl: {},
        /**
         * [userData 保存当前登录用户信息]
         * @type {[type]}
         */
        userData: null,
        /**
         * [totalCount 保存总条数]
         * @type {[type]}
         */
        totalCount: null,
        /**
         * [checkAllFlag 标注 false：未勾选全部， true：已勾选全部]
         * @type {Boolean}
         */
        checkAllFlag: false,

        timer : 0,

        initialize: function(options) {
            this.setOptions(options);
            //屏幕自适应
            this.resize();
            this.matchHref();
            this.addEvent();
            this.registerHelper();
            this.loadNotifyTemplete();
            this.updateAllTaskStatus();
            this.hashChange();
        },
        /**
         * [matchHref 匹配地址栏若有未读消息]
         * @author wumengmeng
         * @date   2014-10-28
         * @return {[type]}   [description]
         */
        resize : function(){
            var contentList = jQuery("#content-List"),
                taskList    = jQuery("#processing-list, #processed-list"),
                taskHeader  = jQuery("#tabs").height(),
                majorHeight = jQuery("#major").height(),
                secHeight = jQuery(".content-sec-header").height(),
                filterHeight = jQuery(".filter-box").height();

            contentList.height(Number(majorHeight) - Number(secHeight) - Number(filterHeight) - 116); // 消息通知
            taskList.height(Number(majorHeight) - Number(taskHeader)); // 任务管理
            taskList.find("ul").height(Number(majorHeight) - Number(taskHeader) - 95); // 任务管理 内容
            jQuery(window).resize(function() {
                //majorHeight = (jQuery("#major").height() - 175) >= 295 ? jQuery("#major").height() : 450;
                majorHeight = jQuery("#major").height();
                contentList.height(Number(majorHeight) - Number(secHeight) - Number(filterHeight) - 116); // 消息通知
                taskList.height(Number(majorHeight) - Number(taskHeader)); // 任务管理
                taskList.find("ul").height(Number(majorHeight) - Number(taskHeader) - 95); // 任务管理 内容
            });
        },

        matchHref: function() {
            var hash = Toolkit.getHashOfUrl();

            if(hash && hash.indexOf("user")>-1){
                jQuery("#myUL li[data-tab=baseInf]").trigger("click");
            }
            if(hash && hash.indexOf("message")>-1){
                jQuery("#myUL li[data-tab=notifyInf]").trigger("click");
            }
            if(hash && hash.indexOf("task/processed")>-1){
                jQuery("#myUL li[data-tab=advanceInf]").trigger("click");
                jQuery("#tabs li[data-tab=processed]").trigger("click");
            }
            if(hash && hash.indexOf("task")>-1){
                jQuery("#myUL li[data-tab=advanceInf]").trigger("click");
            }
            $("#loading").hide();
            return false;
        },
        /**
         * [registerHelper 模版助手]
         * @author wumengmeng
         * @date   2014-10-28
         * @return {[type]}   [description]
         */
        registerHelper: function() {
            var self = this;
            // 是否是第一个
            Handlebars.registerHelper("first", function(value) {
                if (value === 0) {
                    return "first";
                }
            });
            // 奇偶行
            Handlebars.registerHelper("even", function(value) {
                if (value % 2 === 0) {
                    return "even";
                }
            });
            Handlebars.registerHelper("isRead", function(value) {
                if (value === 0) {
                    return "unread";
                }
            });
            Handlebars.registerHelper("mills2datetime", function(value) {
                if (value) {
                    return Toolkit.mills2datetime(value);
                }
            });
            Handlebars.registerHelper("processed", function(value) {
                if (!value) {
                    return "";
                }else{
                    return "done";
                }
            });
            Handlebars.registerHelper("des", function(value) {
                if (!value) {
                    return "　　　　";
                }else{
                    return value;
                }
            });
            Handlebars.registerHelper("type2Class", function(type) {
                /*
                * 0 智能标注
                * 1 下载
                * 2 入库
                * */
                var result;
                switch (type){
                    case 0 :
                        result = "maker";
                        break;
                    case 1 :
                        result = "download";
                        break;
                    case 2 :
                        result = "viewlabs";
                        break;
                    default :
                        result = "";
                        break;
                }
                return result;
            });

            Handlebars.registerHelper("type2ClassName", function(type) {
                /*
                * 0 智能标注
                * 1 下载
                * 2 入库
                * */
                var result;
                switch (type){
                    case 0 :
                        result = "【智能标注】";
                        break;
                    case 1 :
                        result = "【录像下载】";
                        break;
                    case 2 :
                        result = "【入视图库】";
                        break;
                    default :
                        result = "";
                        break;
                }
                return result;
            });
            // 是否为空，为空的话不让为空
            Handlebars.registerHelper("NoEmpty", function(value) {
                if (!value) {
                    return "　";
                }else{
                    return value;
                }
            });
            // 是否全部选择 勾选框
            Handlebars.registerHelper("isAllChecked", function() {
            	return self.checkAllFlag ? "checked" : "";
            });
            // 是否全部选择 背景颜色
            Handlebars.registerHelper("isAllCheckedBg", function() {
                return self.checkAllFlag ? "hasChecked" : "";
            });
            // 是否有开始和结束时间
            Handlebars.registerHelper("hasTime", function(beginTime, endTime) {
                if(beginTime || endTime){
                    return "（" + Toolkit.mills2datetime(beginTime) + " - " + Toolkit.mills2datetime(endTime) + "）";
                }
            });
            // 任务是否失败
            Handlebars.registerHelper("isTaskFail", function(status, progress, options) {
                if(progress == 100){
                    progress -= 1;
                }
                if(progress == 0){
                    progress += 1;
                }
                if (status === 8 || status === 16) {
                    return options.fn();
                } else {
                    return options.inverse({progress:progress});
                }
            });
        },
        /**
         * [loadNotifyTemplete 初始化模版]
         * @author wumengmeng
         * @date   2014-10-28
         * @return {[type]}   [description]
         */
        loadNotifyTemplete: function() {
            var self = this;

            // 消息提醒模板
            ajaxModel.getTml(self.options.notifyTplUrl).then(function(tmp){
                self.notifyTpl.notifyTpl = Handlebars.compile(tmp);
                self.loadNoifyUrl();
            });

            // 任务管理模版
            ajaxModel.getTml(self.options.taskTplUrl).then(function(tmp){
                self.notifyTpl.taskTpl = Handlebars.compile(tmp);
                self.loadTask("processing");
            });

            self.showModuleUnReadNumber();

        },
        /**
         * [getPostDatas 获取数据]
         * @author wumengmeng
         * @date   2014-10-28
         * @return {Object}       [description]
         */
        getPostDatas: function(isDelete) {

            this.userData = JSON.parse(localStorage.getItem("permission")).data;

            var time      = jQuery(".createtime li.active").attr("data-key").trim(),
                sortType  = 0,
                date      = this.translateTime(time) || {};

            if (jQuery(".ordertimes .ordertime").hasClass("order")) {
                sortType = 1;
            }

            if (jQuery(".createtime li.active").attr("data-key") === "6") {
                //.replace("-","/") 处理 IE 兼容的日期格式，IE不支持 2015-02-03 这种格式
                date.startTime = (new Date(jQuery(".custom-time .startTime").val().replace("-","/"))).getTime();
                date.endTime   = (new Date(jQuery(".custom-time .endTime").val().replace("-","/"))).getTime();
            }

            var dataJson = {
                "currentPage" : isDelete ? 1 : this.options.cPage,
                "pageSize"    : this.options.pageSize,
                "startTime"   : date.startTime, //时间
                "endTime"     : date.endTime,
                "sortType"    : sortType,
                "moduleId"    : jQuery(".casetype li.active").attr("data-key").trim(), //类型
                "keyword"     : jQuery(".createKey").val(),
                "status"      : "" //jQuery(".small-marker-content a.active").attr("data-key")
            };

            return dataJson;
        },

        translateTime : function(val){
            var val  = val - 0,
                date = {},
                time = (new Date).getTime();

            function getTimeFromDay(from){

                var date = new Date(),
                    day  = date.getDate(),
                    month = date.getMonth(),
                    year = date.getFullYear();

                date.setFullYear(year,month,(day - from));
                date.setHours(0,0,0,0);

                return date.getTime();
            }

            switch (val) {
                case 0 : // 全部
                    date = {
                        startTime : "",
                        endTime   : ""
                    };
                    break;
                case 10 : // 近 10 分钟
                    date = {
                        startTime : time - 10*60*1000,
                        endTime   : time
                    };
                    break;
                case 1 :  // 近 1 小时
                    date = {
                        startTime : time - 60*60*1000,
                        endTime   : time
                    };
                    break;
                case 2 :  // 今日
                    date = {
                        startTime : getTimeFromDay(0),
                        endTime   : time
                    };
                    break;
                case 3 :  // 昨日
                    date = {
                        startTime : getTimeFromDay(1),
                        endTime   : getTimeFromDay(0)
                    };
                    break;
                case 4 : // 近 7 日
                    date = {
                        startTime : getTimeFromDay(7),
                        endTime   : time
                    };
                    break;

            }

            return date;
        },
        /**
         * [showModuleUnReadNumber 初始化 模块未读展示]
         * @author wumengmeng
         * @date   2014-10-28
         * @return {[type]}   [description]
         */
        showModuleUnReadNumber: function() {
            var self = this;
            ajaxModel.getData(self.urls.GET_NOTIFY_Number).then(function(res){
                if (res && res.code === 200) {
                    //self.totalCount = res.data.taskCount + res.data.messageCount;
                    var data = res.data.message,
                        totalCount = res.data.messageCount,
                        all        = jQuery(".casetype li .icon.all");

                    if(totalCount>0){
                        all.removeClass("isZero").text(totalCount>99?"99+":totalCount);
                    }else{
                        all.addClass("isZero").text(totalCount);
                    }


                    for(var i=0;i<data.length;i++){
                        var count  = data[i]["count"],
                            target = jQuery(".casetype li[data-module=module" + data[i]["moduleId"] + "]").find(".icon");
                        if(count>0){
                            target.removeClass("isZero").text(count>99?"99+":count);
                        }else{
                            target.addClass("isZero").text(count);
                        }
                    }
                    self.updateNodify(res.data);
                }
            });
        },
        /**
         * [updateNodify 更新头部右侧未读数据]
         * @author wumengmeng
         * @date   2014-10-28
         * @return {[type]}   [description]
         */
        updateNodify : function(msg){
            var message = $("#notifyMessage"),
                task    = $("#notifyTask"),
                notify  = $("#notify");

            if(msg.messageCount>0 || msg.taskCount>0){
                notify.show();
            }else{
                notify.hide();
            }

            if(msg.messageCount>0){
                message.show();
                message.text(msg.messageCount);
            }else{
                message.hide();
            }

            if(msg.taskCount>0){
                task.show();
                task.text(msg.taskCount);
            }else{
                task.hide();
            }
        },
        /**
         * [loadNoifyUrl 获取数据]
         * @author wumengmeng
         * @date   2014-10-28
         * @return {[type]}           [description]
         */
        loadNoifyUrl: function(isDelete) {
            var self = this;
            var dataJson = self.getPostDatas(isDelete);

            ajaxModel.getData(self.urls.GET_NOTIFY_URL,dataJson).then(function(res){
                if (res && res.code === 200) {
                    var data       = res.data,
                        totalCount = data.result.totalCount;

                    self.totalCount = totalCount;

                    if(totalCount === 0){
                        $("#ntList .notify-pagination").hide();
                    }else{
                        $("#ntList .notify-pagination").show();
                    }

                    jQuery(self.options.notifyContain).html(self.notifyTpl.notifyTpl(data.result));
                    self.setPagination(totalCount, self.options.paginationContain, self.options.pageSize, function(nextPage) {
                        /* bug #32916 */
                        if (!self.checkAllFlag) {
                            jQuery(".checkbox").removeClass("checked");
                            jQuery(".second-header").hide();
                        }

                        self.options.cPage = nextPage; /*当前页*/

                        ajaxModel.getData(self.urls.GET_NOTIFY_URL,self.getPostDatas()).done(function(res){
                            if (res && res.code === 200) {
                                jQuery(self.options.notifyContain).html(self.notifyTpl.notifyTpl(res.data.result));
                            }
                        });
                    });
                }
            },function(){
                notify.remove();
                notify.error("请查看网络状况！");
            });
        },

        loadTask : function(module){
            var self = this,
                currentPage = this.options.cPage,
                pageSize    = this.options.pageSize,
                target,
                url,
                d,
                p,
                q;

            if(module === "processing"){
                url    = self.urls.GET_ALL_PROCESSING_TASK;
                target = self.options.taskContaining;
                q      = $("#processing q");
                d      = {processing : ""};
                p      = self.options.processingPagination;
            }else{
                url    = self.urls.GET_ALL_PROCESSED_TASK;
                target = self.options.taskContained;
                q      = $("#processed q");
                d      = {processed : ""};
                p      = self.options.processedPagination;
            }
            ajaxModel.getData(url,{currentPage:currentPage,pageSize:pageSize}).then(function(res){
                if (res && res.code === 200) {
                    var data       = res.data,
                        totalCount = data.result.totalCount,
                        rows       = data.result.rows;

                    if(rows.length<=0){
                        d       = {noData:"true"};
                        $("#processing-pagination").removeClass("showPage");
                        $(".button-box, #clearAllRecords").hide();
                    }else{
                        if(module === "processing"){
                            d.processed  = "";
                            d.processing = rows;
                            $("#processing-pagination").addClass("showPage");
                        }else{
                            d.processed  = rows;
                            d.processing = "";
                            $("#processed-pagination").addClass("showPage");
                            $(".button-box, #clearAllRecords").show();
                        }
                    }

                    //self.totalCount = totalCount;
                    q.text(totalCount);
                    $("#processed q").text(data.finishedCount);
                    if(d.noData){
                        jQuery(target)
                        	.find("ul")
                        	.find("li:gt(0)").remove()
                        	.end().append(self.notifyTpl.taskTpl(d));
                    }else{
                        //初始化 显示 各模块条数
                        jQuery(target).find("ul").html(self.notifyTpl.taskTpl(d));
                    }
                    self.setPagination(totalCount, p, self.options.pageSize, function(nextPage) {
                        self.options.cPage = nextPage; /*当前页*/

                        ajaxModel.getData(url,{currentPage:nextPage,pageSize:pageSize}).done(function(res){
                            if (res && res.code === 200) {
                                var data       = res.data,
                                    rows       = data.result.rows;

                                if(rows.length<=0){
                                    d       = {noData:"true"};
                                    $("#processing-pagination").removeClass("showPage");
                                    $(".button-box, #clearAllRecords").hide();
                                }else{
                                    if(module === "processing"){
                                        d.processed  = "";
                                        d.processing = rows;
                                        $("#processing-pagination").show();
                                    }else{
                                        d.processed  = rows;
                                        d.processing = "";
                                        $("#processed-pagination").show();
                                        $("#clearAllRecords").show();
                                    }
                                }
                                if(d.noData){
                                    jQuery(target)
                                    	.find("ul")
                                    	.find("li:gt(0)").remove()
                                    	.end().append(self.notifyTpl.taskTpl(d));
                                }else{
                                    //初始化 显示 各模块条数
                                    jQuery(target).find("ul").html(self.notifyTpl.taskTpl(d));
                                }
                            }
                        });
                    });
                }
            },function(){
                notify.remove();
                notify.error("请查看网络状况！");
            });
        },

        /**
         * [setPagination 分页插件调用类]
         * @author wumengmeng
         * @date   2014-10-28
         * @param  {[type]}   total        [需要分页的信息的总条数]
         * @param  {[type]}   selector     [需要插入分页的容器]
         * @param  {[type]}   itemsPerPage [分页每页显示条数]
         * @param  {Function} callback     [分页成功回调函数]
         */
        setPagination: function(total, selector, itemsPerPage, callback) {
            var self = this;
            $(selector).pagination(total, {
                items_per_page: itemsPerPage,
                orhide: true,
                prev_show_always: false,
                next_show_always: false,
                first_loading: false,
                callback: function(pageIndex, jq) {
                    callback(pageIndex + 1);
                    if(!self.checkAllFlag){
                        self.allCheckTrigger();
                    }
                }
            });
        },

        /**
         * [deletMsgAjax 消息通知删除]
         * @author wumengmeng
         * @date   2014-10-28
         * @param  {[type]}   msgIdArr [选中消息的id数组]
         * @return {[type]}            [description]
         */
        deletMsgAjax: function(json,message) {
            var self = this;
            new ConfirmDialog({
                title: '删除确认',
                width: 335,
                classes: 'dialogBox',
                message: message || "<p>确定删除该消息提醒？</p>",
                callback: function() {

                    ajaxModel.postData(self.urls.DELETE_NOTIFY_URL, json).done(function(res) {
                        if (res && res.code === 200) {
                            notify.success("删除成功！");
                            self.showModuleUnReadNumber();
                            self.loadNoifyUrl(true);
                            jQuery(".second-header").css("display") === "none" ? "" : jQuery(".second-header").css("display", "none");
                            jQuery(".allcheck").removeClass("checked");
                            self.checkAllFlag = false;
                        } else {
                            notify.error("删除失败！");
                        }
                    });
                }
            });

        },

        // 所有操作，只改变界面的状态
        /*multiProcessing : function(isStart){
            var target = $(".operation");
            if(isStart){
                target.find(".resume").removeClass("resume").addClass("pause");
                target.find(".starting").removeClass("starting").addClass("pause");
            }else{
                target.find(".pause").removeClass("pause").addClass("starting");
            }
        },*/

        // 任务管理 正在处理 全部开始/全部暂停
       /* AllProcessing : function(isStart){
            var self = this;
            ajaxModel.getData(self.urls.ALL_PROCESSING, {
                "type": isStart
            }).done(function(res) {
                if (res && res.code === 200) {
                    notify.success("操作成功！");
                    self.multiProcessing(isStart);
                } else {
                    notify.error("操作失败！");
                }
            });*/



            /*new ConfirmDialog({
                title: '提示 processing-button ',
                width: 640,
                message: "确定清除所有任务记录？",
                callback: function() {

                    ajaxModel.postData(self.urls.DELETE_NOTIFY_URL, {
                        "msgid": msgIdArr.join(",")
                    }).done(function(res) {
                        if (res && res.code === 200) {
                            notify.success("清除成功！");
                            $("#processed q").text(0);
                            jQuery(".second-header").css("display") === "none" ? "" : jQuery(".second-header").css("display", "none");
                        } else {
                            notify.error("清除失败！");
                        }
                    });
                }
            });*/
        //},

        // 任务管理 处理完成 清除记录
        deleteRecords : function(msgId, mess){
            var self    = this,
                message = "确认清除所有任务记录？",
                url     = self.urls.REMOVE_ALL_TASK,
                data    = {_method:"delete"},
                msgId   = msgId || "";


            if(msgId){
                message = mess || "确认清除此任务记录？";
                data    =  {_method:"delete"};
                url     = self.urls.DELETE_TASK;
            }

            new ConfirmDialog({
                title: '清除确认',
                width: 335,
                classes: 'dialogBox',
                message: "<p>" + message + "</p>",
                callback: function() {

                    ajaxModel.postData(url + msgId, data).done(function(res) {
                        if (res && res.code === 200) {
                            notify.success("清除成功！");
                            if(!msgId){
                                self.loadTask("");
                                /*$("#processed q").text(0);
                                $("#processed-list li").remove();*/
                            }else{
                                var target = $("#processed-list li[data-taskkey=" + msgId + "]"),
                                    text   = $("#processed q").text();
                                target.fadeOut(function(){
                                    target.remove();
                                });
                                $("#processed q").text(text - 1);
                            }
                        } else {
                            notify.error("清除失败！");
                        }
                    });
                }
            });
        },

        // 取消一条正在进行的任务
        cancelProcessingTask : function(msgId){
            var self    = this,
                url     = self.urls.CANCEL_PROCESSING_TASK;

            new ConfirmDialog({
                title: '取消确认',
                width: 335,
                classes: 'dialogBox',
                message: "<p>确定取消此任务？</p>",
                callback: function() {

                    ajaxModel.postData(url + msgId).done(function(res) {
                        if (res && res.code === 200) {
                            notify.success("取消成功！");
                            if(msgId){
                                var target = $("#processing-list li[data-taskkey=" + msgId + "]"),
                                    text   = $("#processing q").text();
                                target.fadeOut(function(){
                                    target.remove();
                                });
                                $("#processing q").text(text - 1);
                            }
                        } else {
                            notify.error("取消失败！");
                        }
                    });
                }
            });
        },
        /**
         * [markMsgAjax 状态标注]
         * @author wumengmeng
         * @date   2014-10-28
         * @param  {object}   dataJson [消息状态标注需要给后台传递的参数]
         * @param  {object}   needClick [处理完成后，是否触发checkbox的点击事件]
         * @return {[type]}            [description]
         */
        markMsgAjax: function(dataJson, needClick) {
            var self = this;
            ajaxModel.postData(self.urls.MARK_NOTIFY_URL, dataJson).then(function(res) {
                if (res && res.code === 200) {
                    self.showModuleUnReadNumber();
                    var ids   = dataJson.ids.split("-"),
                        value = dataJson.value,
                        len   = ids.length;

                    for(var i=0;i<len;i++){
                        var target = $(".content-list[data-msgid=" + ids[i] + "]");
                        if((value-0) === 1){
                            target.removeClass("unread");
                            target.attr({"data-msgstatus":1});
                            target.find(".message0").removeClass("message0").addClass("message1");
                        }else{
                            target.addClass("unread");
                            target.attr({"data-msgstatus":0});
                            target.find(".message1").removeClass("message1").addClass("message0");
                        }

                        if (needClick) {
                            target.find(".checkbox").trigger('click');
                        }
                    }
                } else {
                    notify.error("修改失败！");
                }
            },function(){
                notify.remove();
                notify.error("请查看网络状况！");
            });
        },
        /**
         * [recordCheckedMsg 被勾选的消息的条数]
         * @author wumengmeng
         * @date   2014-10-28
         * @return {[type]}   [description]
         */
        recordCheckedMsg: function() {
            var domIdArr  = [],
                statusArr = [],
                domArr    = jQuery("#content-List .checked");

            for (var i = 0; i < domArr.length; i++) {
                domIdArr.push(domArr.eq(i).closest("ul").attr("data-msgId"));
                statusArr.push((domArr.eq(i).closest("ul").attr("data-msgstatus")-0===0)?1:0);
            }

            return {
                "domIdArr": domIdArr,
                "statusArr": statusArr
            };
        },
        /**
         * [checkAllAjax 标记为已读 未读 批量操作接口]
         * @author wumengmeng
         * @date   2014-10-28
         * @param  {object}   dataJson [勾选消息参数]
         * @param  {string}   mess     [弹窗提示信息]
         * @return {[type]}            [description]
         */
        checkAllAjax: function(dataJson, mess) {
            var self = this;
            new ConfirmDialog({
                title: '更改状态确认',
                width: 335,
                classes: 'dialogBox',
                message: "<p>" + mess + "</p>",
                callback: function() {
                    ajaxModel.postData(self.urls.UPDATE_NOTIFY_STATUS, dataJson).then(function(res){
                        if (res && res.code === 200) {
                            //notify.success("修改成功！");
                            self.showModuleUnReadNumber();
                            self.loadNoifyUrl(true);
                            $(".allcheck.checkbox").removeClass("checked");
                            jQuery(".second-header").css("display") === "none" ? "" : jQuery(".second-header").css("display", "none");
                            self.checkAllFlag = false;
                        } else {
                            notify.error(res.data.message);
                        }
                    },function(){
                        notify.remove();
                        notify.error("请查看网络状况！");
                    });
                }
            });

        },
        /**
         * [cancelCheckAll 取消全选]
         * @author wumengmeng
         * @date   2014-10-28
         * @return {[type]}   [description]
         */
        cancelCheckAll: function() {
            if (jQuery(".allcheck").hasClass("checked")) {
                jQuery(".checkbox").removeClass("checked");
                $(".checkAms").removeClass("nocheck");
                $(".cancelAms").hide();
                this.checkAllFlag = false;
                //self.allCheckTrigger();
                jQuery(".second-header").css("display", "none");
                $(".small-marker-content a").removeClass("active");
            }
        },
        /**
         * [allCheckTrigger 根据状态判断全选框]
         * @author wumengmeng
         * @date   2014-10-28
         * @return {[type]}   [description]
         */
        allCheckTrigger: function() {
            if (jQuery(".each-checkbox").length > jQuery("#content-List .checked").length) {
                jQuery(".allcheck").removeClass("checked");
                $(".checkAms").removeClass("nocheck");
                $(".cancelAms").hide();
                this.checkAllFlag = false;
            }else if(jQuery(".each-checkbox").length === jQuery("#content-List .checked").length){
                jQuery(".allcheck").addClass("checked");
            } else {
                jQuery(".allcheck").trigger("click");
            }
        },
        updateAllTaskStatus : function(){
            var self = this;
            var updateAllTaskStatus = function(){
                var lis = $("#processing-list li"),
                    len = lis.length,
                    ids = [],
                    taskKey;

                for(var i=0;i<len;i++){
                    taskKey = lis.eq(i).attr("data-taskKey");
                    taskKey && ids.push(taskKey);
                }

                if(ids.length<=0){
                    setTimeout(updateAllTaskStatus,1000);
                    return false;
                }
                ajaxModel.getData(self.urls.TASK_STATUS,{taskKeys:ids.join(",")}).then(function(res){
                    if(res && res.code === 200){
                       var result = res.data.result,
                           len    = result.length,
                           target;
                        for(var i=0;i<len;i++){
                            target = $("#taskKey" + result[i].taskKey);
                            if(result[i].taskStatus === 8 || result[i].taskStatus === 16){ // 8 失败 16 取消
                                var text = result[i].taskStatus === 16 ? "已暂停" : "任务失败";
                                target.find(".processing").addClass("fail");
                                target.closest("li").attr("title",text);
                                target.find(".process-bar").html('<span>' + text + '</span>');
                            }else if(result[i].progress && result[i].progress > 0) {
                                target.closest("li").attr("title","");
                                target.find(".process-bar .percentage").show().css("width", result[i].progress+'%').attr({
                                    title: result[i].progress+'%'
                                });
                                target.find(".rateNum .rateN").show().attr({
                                    title: result[i].progress + '%'
                                }).html(result[i].progress + '%');
                            }
                            if(result[i].taskStatus === 32){ //完成
                                self.loadTask("processing");
                                self.loadTask("");
                                target.fadeOut(function(){
                                    target.remove();
                                });
                            }
                        }
                    }
                    setTimeout(updateAllTaskStatus,1000);
                },function(){
                    setTimeout(updateAllTaskStatus,1000);
                });
            };
            updateAllTaskStatus();
        },

        countNum : function(){
            var total = self.totalCount;
            $(".inline-list.second-header i").text(total);
        },

        createHead: function() {
            var head ='<div id="userDetail"><div id="rolePanel">';
            return head;
        },

        setTempFlag:function(start,end){
            var s = '',e = '';
            if (start) {
                s = Toolkit.mills2str(start);
                e = Toolkit.mills2str(end);
                return 'class="temp"' + 'title="' + s + "~" + e + '"';
            }
            return '';
        },

        assembleTable: function(arr) {
            var self = this,
                opt = true;

            var orgs = arr || [];



            var tableHtml = "<ul class='func-section'>";

            //if(opt.mode === "createRole" || opt.mode === "editRole"){
                tableHtml = self.createHead() + tableHtml;
           // }
            for (var i = 0; i < orgs.length; i++) {
                var allUnfold      = opt ? "active" : "",
                    arrowDirection = opt ? "down" : "";
                var liEl = '<li class="module-item ' + allUnfold + '">';
                var head = '<div class="module-nav-item"><span><label '+ self.setTempFlag(orgs[i].beginTime,orgs[i].endTime) +' data-name="'+orgs[i].name+'" for="plvl1_'+orgs[i].id+'">'+orgs[i].name+'</label></span><i class="func-folder '+ arrowDirection +'"></i></div><div class="module-nav-content">';
                liEl += head;

                opt = false;

                var orgs2 = orgs[i].systemFunctionOrganizationList || [];
                var funcs2 = orgs[i].systemFunctionList || [];

                if(orgs2.length > 0){
                    liEl +='<ul>';
                    var lvl2 ='';
                    for (var j = 0; j < orgs2.length; j++) {
                        lvl2 += '<li class="sub-menu"><div class="sub-menu-item"><span><label '+ self.setTempFlag(orgs2[j].beginTime,orgs2[j].endTime) +' data-name="'+orgs2[j].name+'" for="plvl2_'+orgs2[j].id+'">'+orgs2[j].name+'</label></span></div><div class="sub-menu-content">';
                        var func3 = orgs2[j].systemFunctionList || [];
                        if(func3.length >0){
                            lvl2 +='<ul>';

                            var lvl3 = '';
                            for (var k = 0; k < func3.length; k++) {
                                lvl3 += '<li class="func-item"><span><label '+ self.setTempFlag(func3[k].beginTime,func3[k].endTime) +' data-name="'+func3[k].name+'" for="lvl3_'+func3[k].id+'">'+func3[k].name+'</label></span></li>';
                            }
                            lvl2 += lvl3;
                            lvl2 +='</ul>';
                        }
                        lvl2 +='</div><div class="clearfix"></div></li>';
                    }
                    liEl += lvl2;
                    liEl += '</ul>';
                }

                // 二级直接是子功能节点
                if(funcs2.length > 0){
                    liEl += '<ul class="sub-funcs">';
                    for (var n = 0; n < funcs2.length; n++) {
                        liEl += '<li class="func-item"><span><label '+ self.setTempFlag(funcs2[n].beginTime,funcs2[n].endTime) +' data-name="'+funcs2[n].name+'" for="lvl2_'+funcs2[n].id+'">'+funcs2[n].name+'</label></span></li>';
                    }
                    liEl += '</ul>';
                }

                liEl += '</div></li>';
                tableHtml += liEl;
            }
            tableHtml+= '</ul></div></div>'

            return tableHtml;

        },

        changePageSize : function(obj,e){
            var value = e.attr("value");
            obj.find(".change-item-input").val(value);
            this.options.pageSize = value;
            this.options.cPage = 1;
        },

        hashChange : function(){
            var self = this,
                oHash = window.location.hash; // 原始 hash
            function hashChange(){
                var nHash = window.location.hash; // 新 hash
                if(oHash !== nHash){
                    self.matchHref();
                    oHash = nHash;
                }
            }
            setInterval(hashChange,1000)
        },

        /**
         * 取消所有勾选的消息提醒
         * @author LuoLong
         * @date   2015-04-29
         * @param  {[type]}   [description]
         * @return {[type]}   [description]
         */
        cancleAllCheckBox : function() {
            jQuery(".checkbox").removeClass("checked");
            jQuery(".content-list.hasChecked").removeClass("hasChecked");
            jQuery(".checkAms").removeClass("nocheck");
            jQuery(".cancelAms, .second-header").hide();
            jQuery(".small-marker-content a").removeClass("active");
            this.checkAllFlag = false;
        },

        /**
         * 点击单个checkbox时，重新加载second-header
         * @author LuoLong
         * @date   2015-05-08
         * @param  {[type]}   data [description]
         * @return {[type]}        [description]
         */
        reloadSecondHeader : function() {
            var self = this,
                total = self.totalCount,
                checkedCount = jQuery("#content-List .checked").length,
                $secondHeader = jQuery(".second-header");

            if (checkedCount === 0) {
                $secondHeader.hide(); //隐藏二级标题
                return false;
            }

            $secondHeader.find("i").text(checkedCount);
            if ($secondHeader.is(":hidden")) { //二级标题如果是隐藏的
                $secondHeader
                    .find(".checkAms").show().end()  //显示勾选所有通知
                    .find(".cancelAms").hide().end() //隐藏取消勾选
                    .show(); //显示二级标题

                return false;
            }

            if (checkedCount === total) { //如果已勾选的等于总条数
                $secondHeader
                    .find(".checkAms").hide().end() //隐藏勾选所有通知
                    .find(".cancelAms").show(); //显示取消勾选
                //self.checkAllFlag = true; //改变是否全部勾选状态
            } else {
                $secondHeader
                    .find(".checkAms").show().end() //显示勾选所有通知
                    .find(".cancelAms").hide(); //隐藏取消勾选
                //self.checkAllFlag = false; //改变是否全部勾选状态
            }
        },

        isDeleted : function(id,url){
            var data = this.getViewlibsType(url,id);
            return $.get(data.api,data.data);
        },


        getViewlibsType : function(url,id){
            var API = {
                "incident" : "/service/pvd/get_incident_info",
                "person"   : "/service/pvd/get_person_info",
                "car"      : "/service/pvd/get_car_info",
                "exhibit"  : "/service/pvd/get_exhibit_info",
                "scene"    : "/service/pvd/get_scene_info",
                "move"     : "/service/pvd/moving/" + id + "?fileType=moving&id=" + id + "&orgId=",
                "others"   : "/service/pvd/rest/" + id + "?fileType=rest&id=" + id + "&orgId=",
                "video"    : "/service/pvd/get_video_info"
            };

            var name = url.split("?")[0].split("/").pop();

            switch (name){
                case "person.html" :
                    return {
                        api:API.person,
                        data : {
                            id :id,
                            orgid : null,
                            res  : 0
                        }
                    };
                    break;
                case "car.html":
                    return {
                        api:API.car,
                        data : {
                            id :id,
                            orgid : null,
                            res  : 0
                        }
                    };
                    break;
                case "exhibit.html":
                    return {
                        api:API.exhibit,
                        data : {
                            id :id,
                            orgid : null,
                            res  : 0
                        }
                    };
                    break;
                case "scene.html":
                    return {
                        api:API.scene,
                        data : {
                            id :id,
                            orgid : null,
                            res  : 0
                        }
                    };
                    break;
                case "move.html":
                    return {
                        api:API.move,
                        data : {}
                    };
                    break;
                case "others.html":
                    return {
                        api:API.others,
                        data : {}
                    };
                    break;
                case "video.html":
                    return {
                        api:API.video,
                        data : {
                            id :id,
                            fileType:1,
                            orgid : null,
                            res  : 0
                        }
                    };
                    break;
                case "picture.html":
                    return {
                        api:API.video,
                        data : {
                            id :id,
                            fileType:2,
                            orgid : null,
                            res  : 0
                        }
                    };
                    break;
                case "incident_detail.html":
                    return {
                        api:API.incident,
                        data : {
                            id :id,
                            orgid : null,
                            res  : 0
                        }
                    };
                    break;
            }
        },
        /**
         * [dealWindowOpenEvent 处理window.open事件（用iframe方式实现）]
         * @author songxj
         * @param  {[type]} url  [iframe的src]
         * @param  {[type]} name [window name]
         */
        dealWindowOpenEvent: function(url, name) {
            var self = this;
            if (url) {
                window.open("/module/iframe/?windowOpen=1&iframeUrl=" + url);
            }
        },
        /**
         * [addEvent 事件绑定]
         * @author wumengmeng
         * @date   2014-10-28
         */
        addEvent: function() {
            var self = this;
            /**
             * [筛选事件]
             * @author wumengmeng
             * @date   2014-10-28
             * @return {[type]}   [description]
             */
            jQuery(".small-marker-content a").on("click", function() {
                var parent = jQuery("#content-List .inline-list[data-msgstatus=" + jQuery(this).attr("data-key") + "] .each-checkbox");

                self.cancelCheckAll();
                jQuery(this).addClass("active").siblings("a").removeClass("active");
                jQuery("#content-List .inline-list .each-checkbox").removeClass("checked");
                parent.addClass("checked");
                jQuery("#content-List ul").removeClass("hasChecked");
                parent.closest("ul").addClass("hasChecked");

                self.allCheckTrigger();
            });
            /**
             * [消息状态]
             * @author wumengmeng
             * @date   2014-10-28
             * @return {[type]}   [description]
             */
            jQuery(".big-marker-content a").on("click", function() {
                var recordCheckedMsg = self.recordCheckedMsg();
                var postData         = self.getPostDatas();
                var value = jQuery(this).attr("data-key");
                var msg = value==0 ? "确定将所有页消息标记为未读吗" : "确定将所有页消息标记为已读吗";

                if (recordCheckedMsg.domIdArr.length === 0) {
                    notify.warn("请选择要修改状态的消息！");
                    return;
                }
                if (self.checkAllFlag) {
                    var dataJson = {
                        "value": value
                    };

                    if (postData.startTime && postData.endTime) {
                        dataJson.startTime = postData.startTime;
                        dataJson.endTime = postData.endTime;
                    }
                    postData.moduleId && (dataJson.moduleId = postData.moduleId);
                    postData.keyword && (dataJson.keyword = postData.keyword);

                    self.checkAllAjax(dataJson, msg);
                } else {
                    var dataJson = {
                        "moduleId" : postData.moduleId,
                        "ids": recordCheckedMsg.domIdArr.join("-"),
                        "value":value
                    };
                    self.markMsgAjax(dataJson, true);
                }
            });
            /**
             * [模糊搜索]
             * @author wumengmeng
             * @date   2014-10-28
             * @return {[type]}   [description]
             */
            jQuery(".filter-panel .seach").on("click", function() {
                self.options.cPage = 1;
                self.loadNoifyUrl();
            });


            jQuery(".input-text.createKey").on("keyup", function() {

                self.timer && clearTimeout(self.timer);

                self.timer = setTimeout(function(){
                    self.options.cPage = 1;
                    self.loadNoifyUrl();
                },1500);

            });
            /**
             * [批量删除]
             * @author wumengmeng
             * @date   2014-10-28
             * @return {[type]}   [description]
             */
            jQuery(document).on("click", ".block-delete", function() {
                var recordCheckedMsg = self.recordCheckedMsg();
                var getPostDatas     = self.getPostDatas();

                if (recordCheckedMsg.domIdArr.length === 0) {
                    notify.warn("请选择要删除的消息！");
                    return;
                }

                if (self.checkAllFlag) {
                    var dataJson = {
                        "flag"    : "dele",
                        moduleId  :  getPostDatas.moduleId,
                        "_method" : "delete"
                    };
                    self.deletMsgAjax(dataJson, "消息删除后将无法恢复，您确定要删除吗?");
                } else {
                    var msgIdArr = recordCheckedMsg.domIdArr;
                    var dataJson = {
                        moduleId :  getPostDatas.moduleId,
                        ids : msgIdArr.join("-"),
                        "_method" : "delete"
                    };
                    self.deletMsgAjax(dataJson, "消息删除后将无法恢复，您确定要删除吗?");
                }
            });
            /**
             * [单条删除]
             * @author wumengmeng
             * @date   2014-10-28
             * @return {[type]}   [description]
             */
            jQuery(document).on("click", "#content-List .delete", function() {
                var id = jQuery(this).closest("ul").attr("data-msgid");
                self.deletMsgAjax({
                    ids:id,
                    "_method":"delete"
                });
            });
            /**
             * [勾选所有消息]
             * @author wumengmeng
             * @date   2014-10-28
             * @return {[type]}   [description]
             */
            jQuery(".second-header .checkAms").on("click", function() {
                if (!jQuery(".checkbox-select div.allcheck").hasClass("checked")) {
                    jQuery(".checkbox-select div.allcheck").trigger("click");
                }
                jQuery(this).addClass("nocheck");
                jQuery(".cancelAms").css("display", "inline-block");
                jQuery("#ntList .second-header i").text(self.totalCount);
                self.checkAllFlag = true;
            });
            /**
             * [取消消息]
             * @author wumengmeng
             * @date   2014-10-28
             * @return {[type]}   [description]
             */
            jQuery(".second-header .cancelAms").on("click", function() {
                self.cancleAllCheckBox();
                return false;
            });
            /**
             * [全部标注为已读]
             * @author wumengmeng
             * @date   2014-10-28
             * @return {[type]}   [description]
             */
            jQuery("#major").on("click", ".set-all-readed", function() {
                var dataJson = {
                        "value": jQuery(this).attr("data-key")
                    },
                    postData = self.getPostDatas();

                if (postData.startTime && postData.endTime) {
                    dataJson.startTime = postData.startTime;
                    dataJson.endTime = postData.endTime;
                }
                postData.moduleId && (dataJson.moduleId = postData.moduleId);
                postData.keyword && (dataJson.keyword = postData.keyword);


                self.checkAllAjax(dataJson, "确定将所有页消息标记为已读吗？");
            });
            /**
             * [showSecond 时间插件]
             * @type {Boolean}
             */
            jQuery('.input-time').datetimepicker({ //时间控件
                showSecond: true,
                dateFormat: 'yy-mm-dd',
                timeFormat: 'HH:mm:ss',
                timeText: '',
                hourText: ' 时:',
                minuteText: ' 分:',
                secondText: ' 秒:',
                showAnim: ''
            });
            /**
             * [全局checkbox模拟]
             * @author wumengmeng
             * @date   2014-10-28
             * @return {[type]}   [description]
             */
            jQuery(".allcheck").on("click", function() {
                if (jQuery(this).hasClass("checked")) {
                    jQuery(".checkbox").removeClass("checked");
                    jQuery(".content-list.hasChecked").removeClass("hasChecked");
                    jQuery(".second-header").css("display", "none");
                    $(".checkAms").removeClass("nocheck");
                    $(".cancelAms").hide();
                    self.checkAllFlag = false;
                } else {
                    jQuery(".checkbox").addClass("checked");
                    jQuery(".second-header").css("display", "block");
                    jQuery(".checkAms").removeClass("nocheck");
                    jQuery(".cancelAms").hide();
                    jQuery(".content-list").addClass("hasChecked");
                    $(".inline-list.second-header i").text($("#content-List .checkbox.checked").length);
                }
                $(".small-marker-content a").removeClass("active");
                //self.countNum();
            });
            /**
             * [单条消息]
             * @author wumengmeng
             * @date   2014-10-28
             * @return {[type]}   [description]
             */
            jQuery(document).on("click", ".each-checkbox", function() {

                jQuery(this).toggleClass("checked");
                jQuery(this).closest(".content-list").toggleClass("hasChecked");

                self.allCheckTrigger();
                self.reloadSecondHeader();
                /*if (jQuery("#content-List .checked").length === 0) {
                    jQuery(".second-header").css("display", "none");
                }

                if($(".inline-list.second-header li:first i").text()-0 === self.totalCount){
                    $(".cancelAms").trigger("click");
                }*/


                //self.countNum();
            });
            /**
             * [tab切换(update)]
             * @author wumengmeng
             * @date   2014-10-28
             * @param  {[type]}   event [description]
             * @return {[type]}         [description]
             */
            jQuery(".filter-info").hover(function(event) {
                if (jQuery(event.target).hasClass("allcheck")) {
                    return;
                }
                if (!jQuery(".filter-info div.small-marker-content").hasClass("show-or-hide")) {
                    jQuery(".filter-info div.small-marker-content").addClass("show-or-hide");
                    jQuery(".checkbox-select").addClass("activen");
                }
            });
            jQuery(".set-info").hover(function() {
                if (!jQuery(".set-info div.big-marker-content").hasClass("show-or-hide")) {
                    jQuery(".set-info div.big-marker-content").addClass("show-or-hide");
                    jQuery(".set-marker").addClass("activen");
                }
            });

            jQuery(".filter-info").on("mouseleave", function() {
                if (jQuery(".filter-info div.small-marker-content").hasClass("show-or-hide")) {
                    jQuery(".filter-info div.small-marker-content").removeClass("show-or-hide");
                    jQuery(".checkbox-select").removeClass("activen");
                }
            });
            jQuery(".set-info").on("mouseleave", function() {
                if (jQuery(".set-info div.big-marker-content").hasClass("show-or-hide")) {
                    jQuery(".set-info div.big-marker-content").removeClass("show-or-hide");
                    jQuery(".set-marker").removeClass("activen");
                }
            });
            /**
             * [模拟]
             * @author wumengmeng
             * @date   2014-10-28
             * @param  {[type]}   event [description]
             * @return {[type]}         [description]
            jQuery("#content-List").on("click", ".each-checkbox", function(event) {
                jQuery(this).toggleClass("checked");
                jQuery(this).closest(".content-list").toggleClass("hasChecked");
            });*/

            /**
             * [tab切换（old）]
             * @author wumengmeng
             * @date   2014-10-28
             * @return {[type]}   [description]
             */
            jQuery(".notify-type li").hover(function() {
                jQuery(this).find(".notify-select").addClass("active");
            }, function() {
                jQuery(this).find(".notify-select").removeClass("active");
            });
            /**
             * [自定义搜索]
             * @author wumengmeng
             * @date   2014-10-28
             * @return {[type]}   [description]
             */
            jQuery(".custom").on("click", function() {
                jQuery(this).addClass("active");
            });

            jQuery(".notify-select div").click(function() {
                jQuery(this).addClass("sel").siblings("div").removeClass("sel");
                var text = jQuery(this).text();
                jQuery(this).closest("li").find(".notifySL").text(text);
                self.loadNoifyUrl();
            });

            jQuery(".createtime li,.casetype li").click(function() {
                $(".createKey").val("");
                jQuery("#ntList .second-header").css("display", "none");
                self.cancelCheckAll();
                jQuery(this).addClass("active").siblings("li").removeClass("active");
                //if (jQuery(this).attr("data-key") !== "6") {
                    self.options.cPage = 1;
                    self.loadNoifyUrl();
               // }
            });
            /**
             * [自定义时间筛选]
             * @author wumengmeng
             * @date   2014-10-28
             * @return {[type]}   [description]
             */
            jQuery(document).on("click", ".custom .custom-time .btn", function() {
                var startTime = jQuery('.custom-time .input-time').eq(0).val(),
                    endTime   = jQuery('.custom-time .input-time').eq(1).val();

                if(!startTime || !endTime){
                    notify.remove();
                    return notify.info("自定义时间区间不可以为空！", {
                        timeout: 1500
                    });
                }

                if (startTime >= endTime) {
                    notify.remove();
                    return notify.info("起始时间必须小于截止时间！", {
                        timeout: 1500
                    });
                } else {
                    self.options.cPage = 1;
                    self.loadNoifyUrl();
                }
            });
            /**
             * [点击已读消息 将已读消息变为未读消息]
             * @author wumengmeng
             * @date   2014-10-28
             * @return {[type]}   [description]
             */
            jQuery("#content-List").on("click", ".des-content", function() {
                //跳转
                var elm      = jQuery(this);
                var dom      = jQuery(this).closest(".inline-list");
                //var jpData   = JSON.parse(dom.attr("data-msgcontenturl"));
                var url      = dom.attr("data-url");
                var id       = dom.attr("data-taskid");
                var msgid    = dom.attr("data-msgid");
                var dataJson = {
                    "value": "1",
                    "ids": msgid,
                    "moduleId": dom.attr("data-moduleId").trim()
                };
                switch (dataJson.moduleId) {
                    case "1":
                        //视频指挥
                        /*window.location.href = "/cloudmanagement/index/0?type=0&id=" + jpData.id + "#done";
                        if (dom.attr("data-msgstatus") === "1") {
                            return;
                        }*/

                        if (url.indexOf("/module/viewlibs/details/media/video.html") !== -1) { // 历史录像入库后跳转到新视图库 by songxj
                            var videoId = url.substring(url.indexOf("&id=") + 4, url.indexOf("&pagetype"));
                            // 跳转
                            url = "/module/pvb/index.html#/workbench/entry?videoId=" + videoId;
                            self.dealWindowOpenEvent(url, "viewlib");
                        } else {
                             self.dealWindowOpenEvent(url, "userCenter");
                        }
                        /*if(url){
                            window.open("/module/iframe/?windowOpen=1&iframeUrl=" + url,"userCenter")
                        }*/
                        self.markMsgAjax(dataJson);
                        break;
                    case "10":
                        //交通管理
                        if (url.indexOf("ftp") != -1) {
                            window.open(url);
                        } else {
                            self.dealWindowOpenEvent(url, "");
                        }
                        self.markMsgAjax(dataJson);
                        break;
                    case "8":
                        if (url.indexOf("ftp") != -1) {
                            window.open(url);
                        } else if(url.indexOf("permissionApply") != -1){
                            url = url+"?id=" + msgid;
                            self.dealWindowOpenEvent(url, "");
                        }else {
                            self.dealWindowOpenEvent(url, "");
                        }
                        self.markMsgAjax(dataJson);
                        break;
                    case "3":
                        //视图库
                        /*window.location.href = "/viewlibs/caselib/incident_detail/3?incidentname=" + jpData.name + "&id=" + jpData.id + "&pagetype=workbench&orgid=";
                        if (dom.attr("data-msgstatus") === "1") {
                            return;
                        }*/
                        // 跳转到新视图库 by songxj
                        var videoId = url.substring(url.indexOf("&id=") + 4, url.indexOf("&pagetype"));
                        url = "/module/pvb/index.html#/workbench/entry?videoId=" + videoId;
                        self.dealWindowOpenEvent(url, "viewlib");
                        break;
                    //case "4":
                        //布防布控
                        //break;
                    case "4":
                        //图像研判
                        /*if (jpData.status === "0") {
                            window.location.href = "/viewlibs/workbench/index/3?incidentid=" + jpData.id + "&fileid=345c47efec7445caa8200b54cbd9dac8&filename=12&filetype=2&home=workbench&pagetype=traillist&orgid=&incidentname=" + jpData.name;
                        } else {
                            window.location.href="/imagejudge/image/4";
                                var passData = {
                                    pid: jpData.id, //视图库中此图片的id
                                    fileName: jpData.name,
                                    filePath: "",
                                    fileType: "1",
                                    localPath: "",
                                    source: 'viewlib',
                                    shootTime: ""
                                };
                                Cookie.write('imagejudgeData', JSON.stringify(passData));
                                window.open("/module/iframe/?windowOpen=1&iframeUrl=" + "/imagejudge/image/4?&type=3", "singleAnalyze");
                        }

                        if (dom.attr("data-msgstatus") === "1") {
                            return;
                        }*/
                        self.dealWindowOpenEvent(url, "userCenter");
                        /*if(url){
                            console.log("url:",url);
                            window.open("/module/iframe/?windowOpen=1&iframeUrl=" + url,"userCenter")
                        }*/
                        self.markMsgAjax(dataJson);
                        break;
                    case "5":
                        //运维管理
                        self.dealWindowOpenEvent(url, "maintain");
                        /*if(url){
                            window.open("/module/iframe/?windowOpen=1&iframeUrl=" + url, "maintain");
                        }*/
                        self.markMsgAjax(dataJson);
                        break;
                    case "6":
                        //系统配置
                        self.dealWindowOpenEvent(url, "settings");
                        /*if(url){
                            window.open("/module/iframe/?windowOpen=1&iframeUrl=" + url, "maintain");
                        }*/
                        self.markMsgAjax(dataJson);
                        break;
                    case "60":
                        var userId =  + window.localStorage.getItem("userId") || $("#userEntry").attr("data-userid");

                        var confirmDialog = self.confirmDialog = new ConfirmDialog({
                            title: '权限变更',
                            width: 800,
                            message: "<img src='/module/common/images/animate/horizontal-loading.gif'>"
                        });

                        confirmDialog.element.find(".wrapper section").addClass("loadingnow");

                        ajaxModel.getData(self.urls.USER,{id:userId}).then(function(res){

                            var html = self.assembleTable(res.data.functionOrgIdList);
                            confirmDialog.element.find(".wrapper section").removeClass("loadingnow").html(html);
                            confirmDialog.show();

                        },function(){
                            confirmDialog.element.find(".wrapper section").html("服务器错误！");
                        });

                        self.markMsgAjax(dataJson);
                        //权限变更
                        break;
                }
                //状态改变
            });

            $("#processed").on("click",function(){
                if($("#processed-list li").length<=1){
                    self.loadTask("processed");
                }
            });
            $("#processing").on("click",function(){
                if($("#processed-list li").length<=0){
                    self.loadTask("processing");
                }
            });

            // 清除全部 处理完成任务
            $("#clearAllRecords").on("click",function(){
                if($("#processed-list li").length ===1 && $("#processed-list li").text() === "暂无数据!"){
                    return false;
                }
                self.deleteRecords();
            });

            /*$("#processing-button .button").on("click",function(){
                var isStart = $(this).data("start");
                self.AllProcessing(isStart);
            });*/

            // 删除单个任务 已完成
            $("#processing-list, #processed-list").on("click","a.remove",function(){
                var taskkey = $(this).attr("data-taskkey");
                self.deleteRecords(taskkey);
                return false;
            });

            // 点击链接时，查看该任务是否已被删除
            $("#processed-list").on("click",".direct",function(e){
                e.preventDefault();
                var status = $(this).closest("li").attr('data-status'),
                    taskkey = $(this).attr("data-taskkey"),
                    videoId = $(this).attr("data-videoid"),
                    href = $(this).attr("href");

                if (href.indexOf("/module/viewlibs/details/media/video.html") !== -1) { // 历史录像入库完成跳转到新视图库
                    // 跳转到新视图库(资源是否被删除,在视图库中进行处理) by songxj
                    var url = "/module/pvb/index.html#/workbench/entry?videoId=" + videoId;
                    self.dealWindowOpenEvent(url);
                } else {
                    window.open(href);
                }
            });

            // 取消一条正在进行的任务
            $("#processing-list").on("click",".remove",function(){
                var taskkey = $(this).attr("data-taskkey");
                self.cancelProcessingTask(taskkey);
            });

            //本页面跳转
            $("body").on("click","#notifyInfo a",function(e){
                e.stopPropagation();
                e.preventDefault();
                alert(369)
                //setTimeout(self.matchHref,100);
                return false;
            });


            // 查看用户权限
            $("body").on("click",".module-nav-item",function(){
                $(this).find("i").toggleClass("down");
                $(this).siblings(".module-nav-content").toggle();
                self.confirmDialog.show();
            });



            // 显示多少条
            $(".change-item-input").on("click",function(){
                var val = $(this).val();
                $(".change-item-list li").show();
                $(".change-item-list li[value=" + val + "]").hide();
                $(".change-item-list").show();
                return false;
            });

            $("body").on("click", ".list-wrapper", function(e){
                self.changePageSize($(this),$(e.target));
                var active = $(".casetype li.active"),
                    target = active.length > 0 ? active : $(".casetype li:first");

                $(".small-marker-content a").removeClass("active"); // 取消已读未读勾选
                jQuery("#ntList .second-header").css("display", "none");
                self.cancelCheckAll();
                self.loadNoifyUrl()
                //target.trigger("click");
                //$(".change-item-list").hide();
            });
            $("body").on("click",function(e){
                $(".change-item-list").hide();
            });
        }
    });
    return NotifyClass;
});

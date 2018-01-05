define(["require",
    "orgnScrollbar",
    "js/tools",
    "./../../common/js/camera-tree",
    "./../../../common/js/common.player",
    "base.self",
    "jquery-ui-timepicker-addon",
    "jquery.pagination",
    "js/register-help",
    "js/dirty-check"
],function(require,scrollBar,tools,CameraTree,VideoPlayer){
    jQuery(function() {
        var $ = jQuery,
            initAbnormal   = tools.initAbnormal,
            checkboxAction = tools.checkboxAction,
            cache = {};


        //$("#header a.item").removeClass("active");
        //$("#maintenance").addClass("active");

        setTimeout(function(){scrollBar.init()},0);

            // 搜索切换
            (function() {
                $("#sidebar").on("click", ".changemodel", function() {
                    var self = $(this);
                    if (self.attr("click") === "click") {
                        if (self.parents('.combine').length >= 1) {
                            jQuery('.combineinput').show();
                        }
                        self.siblings(".serchbox.simple").show();
                        self.siblings(".serchbox.advance,.submit").hide();
                        self.siblings(".form-panel form").removeClass("form");
                        self.attr("click", "");
                        self.text("高级>>");
                        self.removeClass("ui button cancel");
                        $("#treePanel").css({"top":88});
                        //jQuery('.header .' + mintenance.witchTask).trigger('click');
                    } else {
                        if (self.parents('form').find('.combineinput')) {
                            jQuery('.combineinput').hide();
                        }
                        self.siblings(".serchbox.simple").hide();
                        self.siblings(".serchbox.advance,.submit").show();
                        self.siblings(".form-panel form").addClass("form");
                        self.attr("click", "click");
                        self.text("取消");
                        self.addClass("ui button cancel");
                        $("#treePanel").css({"top":172});
                    }
                    // 更新滚动条
                    scrollBar.init();
                });
            }());

            //审核任务
            //显示
            $("#sidebar").on("click", "a.audit", function() {
                $(this).parent().siblings(".audit").show();
                return false;
            });
            //隐藏
            $("#sidebar").on("click", ".cancel.button", function() {
                $(this).parent(".audit").hide();
                if(mintenance.witchTask === 'mytask' && jQuery(this).hasClass('changemodel')){
                    jQuery('.header .mytask').trigger('click');
                }
            });
            //提交
            $("#sidebar").on("submit", "form.audit", function() {
                var taskId = $(this).attr("task-id"),
                    auditOpinion = $(this).children("textarea").val();

                if (!auditOpinion) {
                    $(this).children("textarea").focus();
                    notify.warn("请填写审核意见！");
                    return false;
                }
                $.ajax({
                    url: "/service/check/audit_task",
                    data: {
                        taskId: taskId,
                        auditOpinion: auditOpinion
                    },
                    type: "post",
                    dataType: "json",
                    success: function(data) {
                        if (data && data.code && data.code === 200) {
                            notify.success('审核意见提交成功！');
                        } else {
                            notify.error('审核意见提交失败，请重试！');
                        }
                    }
                });

                return false;
            });

            var mintenance = {
                layout:4,  // 默认巡检几分屏
                isAddEvent : false, // 播放器注册事件
                mapIssueHtml: '',

                mapMarker: [],
                /*保存地图上布点后所有当前点的对象集合*/

                mapvideoPlayer: null,
                /*地图上面的播放器对象*/

                videoPlayer: null,
                /*经典模式播放器对象*/

                pointertrigger: false,
                /*模式切换是需要知道左侧是否已经进入某个任务,以此判断是否需要加载视频*/

                mymap: null,
                /*地图对象*/

                mapObj:null,

                witchTask: 'mytask',
                /*判断当前任务类型:mytask | checktask*/

                model: 'classic',
                /*判断当前模式,地图模式maptype | 经典模式classic*/

                curCameraIndex: 0,
                /*当前播放的视频在任务中cameras数组中的索引*/

                maxLen: 0,
                /*当前播放的视频所在cameras数组的长度*/
                optChange: 0,
                /*记录异常信息是否改变*/

                tpl: {}, // 模板缓存

                taskData: "",

                action: "", // 动作

                data: {
                    isStatusChanged:false,
                    cameraData : {},
                    search     : {},
                    cameraIds  : [],
                    isBadId    : [], // 存储异常摄像机的ID
                    camerasId  : [],
                    expandTree : {
                        index: -1,
                        starusElmLen: 0,
                        isLast: 0,
                        prevCameras: []
                    }

                }, // 数据缓存

                polling : {
                    isGettingData : false
                },

                prePlay : [], // 预播放的句柄

                videoPlayer : null,

                loadTpl: function(name) {
                    var self = this;
                    var dfd = $.Deferred();
                    if (self.tpl[name]) {
                        dfd.resolve(self.tpl[name]);
                        return dfd.promise();
                    }
                    $.ajax({
                        type: "get",
                        url: "inc/" + name + ".html",
                        success: function(html) {
                            self.tpl[name] = html;
                            dfd.resolve(html);
                        },
                        error:function(){
                            dfd.reject();
                        }
                    });
                    return dfd.promise();
                },

                loadData: function(name) {
                    var self = this;
                    var dfd = $.Deferred();
                    $.ajax({
                        type: "get",
                        cache: false,
                        url: "/service/check/" + name,
                        success: function(datas) {
                            self.taskData = datas.data;
                            dfd.resolve(datas);
                        },
                        error: function() {
                            notify.error("获取数据失败，服务器错误，请稍后重试！！");
                            dfd.reject();
                        }
                    });
                    return dfd.promise();
                },

                getTaskdata: function() {
                    return this.taskData;
                },

                render: function(name, data) {
                    return Handlebars.compile(this.tpl[name])(data);
                },

                makeUp: function(name, data, callback) {
                    $.when(mintenance.loadData(data), mintenance.loadTpl(name))
                        .done(function(json) {
                            if (callback) {
                                callback(mintenance.render(name, json.data));
                            }
                        })
                        .fail(function() {
                            notify.error("获取数据失败，服务器错误，请稍后重试！！");
                        });
                },
                check: function(container, klass, node) {
                    var checkbox = $(container).find(klass);
                    var checked = $(container).find(klass + ":checked");
                    var checkall = $(container).find(node);
                    if (checkbox.length == checked.length) {
                        checkall.prop({
                            "checked": true
                        });
                    } else {
                        checkall.prop({
                            "checked": false
                        });
                    }
                },
                checkAll: function(container, klass, node) {
                    var checkbox = $(container).find(klass);
                    var checkall = $(container).find(node);
                    if (checkall.is(":checked")) {
                        checkbox.prop({
                            "checked": true
                        });
                    } else {
                        checkbox.prop({
                            "checked": false
                        });
                    }
                },
                isDisabled:function(obj){
                    return obj.hasClass("disable");
                }
            };

            //try{
            mintenance.videoPlayer = new VideoPlayer({
                layout: mintenance.layout,
                uiocx: 'UIOCX'
            });

            gVideoPlayer = mintenance.videoPlayer;

            require(["./../../../common/ptz/ptz","./../../../common/ptz/control"]);

            //} catch (err) {}


            /*mintenance.videoPlayer = new VideoPlayer({
                layout: mintenance.layout
            });

            gVideoPlayer = mintenance.videoPlayer;*/

            require(["js/pagination"]);

            /*function nav(){
                $("#header a.item").removeClass("active");
                $("#maintenance").addClass("active");
            }
            nav();*/

            $(".header .mytask").click(function() {
                pagination.redrawMytaskAndPages('first');
            });

            //审核任务
            $(".header .checktask").click(function() {
                mintenance.makeUp("maintenance_checktask", "audit_tasks_list", function(html) {
                    $("#sidebar>.header").show();
                    $("#treePanel").css({
                        "top": 36
                    });
                    $("#checktask").html(html);
                });
                mintenance.witchTask = 'checktask';
                mintenance.curCameraIndex = 0;
            });

            /**
             * @function
             * @name autoExpandFirstTree
             * @param {object} CameraTree 实例
             * @description 默认树形展开一级
             * */
            function autoExpandFirstTree(obj){
                $(obj.options.node).bind("treeExpandSuccess",function(){
                    var self = $(this);
                    $(obj.options.node).unbind("treeExpandSuccess");
                    setTimeout(function(){self.find("li.tree.root>i.fold").triggerHandler("click");},100);
                });
            }

            // 新建任务
            $(".header .task").click(function() {
                pagination.hidePage();
                $.when(mintenance.loadTpl("maintenance_newtask")).done(function(html) {
                    $("#sidebar>.header>ul").hide();
                    $("#treePanel").css({
                        "top": 38
                    });

                    var htmlt,htmls;

                    htmlt = $(html);

                    htmls = (htmlt[2] || htmlt[1]).innerHTML;

                    $("#sidebar .header .newinsertheader").remove();
                    $("#newtask").html(htmls);
                    $("#sidebar>.header").append(htmlt[0].innerHTML);

                    // 执行树形菜单
                    var cameraTree = null,
                        cameraTree = new CameraTree({
                        node: $(".cameras-list .treePanel"),
                        nodeHeight: jQuery('#treePanel .viewport').css('height', jQuery("#treePanel").height() - (40 + 70 + 70 + 65)),
                        selectable: true,
                        mode: "create"
                    });


                    /**
                     * @description 默认树形展开一级
                     * */
                    autoExpandFirstTree(cameraTree);

                    // 更新滚动条
                    scrollBar.init();

                    jQuery("#tasknewtask").unbind("click");
                    jQuery("#tasknewtask").bind("click", function() {

                        var self     = $(this),
                            data     = getTaskInfo($("#newtask"), false, cameraTree),
                            disabled = self.attr("data-disabled");

                        if (!data) {
                            return false;
                        }

                        if(disabled === "disabled"){
                            notify.warn('任务正在提交，请稍等！');
                            return false;
                        }

                        self.attr({"data-disabled":"disabled"});

                        $.ajax({
                            url: "/service/check/add_task",
                            type: "post",
                            data: data,
                            dataType: "json",
                            success: function(oData) {
                                if (oData && oData.code && oData.code === 200) {
                                    notify.success('添加任务成功！');
                                    jQuery("#newtask,.action.task").removeClass("active");
                                    jQuery(".header,.header>ul").show();
                                    jQuery("#mytask,.camera.mytask").addClass("active");
                                    jQuery("#treePanel").css({"top":"88px"});

                                    logDict.insertLog('m2','f3','o1','b19',data.taskName); // 新建日志

                                    pagination.redrawMytaskAndPages('add');
                                    cameraTree = null;
                                    $("#newtask,#mytask").children().remove();
                                } else {
                                    notify.error('添加任务失败，请重试！');
                                    self.attr({"data-disabled":""});
                                }
                            },
                            error:function(){
                                notify.error('网络出错，添加任务失败，请重试！');
                                self.attr({"data-disabled":""});
                            }
                        });
                        return false;
                    });
                });
            });

            //新建任务回车提交
            $("#sidebar").on("keyup","#taskName, #newtaskName",function(e){
                if(e.keyCode === 13){
                    jQuery("#tasknewtask").trigger("click");
                }
            });

            // 处理摄像机 id 适配修改属性数据的格式
            // {id:295, cameraId:372, orgId:1, inspectDate:null, status:0, taskId:0, exceptInfo:null, remark:null,…}
            function modifyCamerasId(data) {
                var id = [];
                for (var i = 0; i < data.length; i++) {
                    id.push(data[i].cameraId)
                }
                return id;
            }

            /*删除任务*/
            jQuery('#mytask,#checktask').on('click', '.delete', function() {
                var taskId = jQuery(this).attr('task-id').trim(),
                    self   = $(this);

                new ConfirmDialog({
                    title: '警告',
                    width: 640,
                    message: "您确定要删除此任务吗？",
                    callback: function() {
                        jQuery.post("/service/check/delete_task", {
                            "taskId": taskId
                        }, function(data, xhr, textStatus) {

                            if(textStatus && textStatus.status === 302) {
                                self.modifyLogonStatus();
                                return false;
                            }

                            if(data && data.code === 200) {
                                notify.success('删除成功！',{timeout:'1000'});
                                pagination.redrawMytaskAndPages('remove');
                                self.closest(".groups").remove();
                                logDict.insertLog('m2','f3','o3','b19',self.attr("task-name")); // 删除日志
                            } else {
                                notify.error('删除失败,请重试！',{timeout:'1000'});
                            }
                        }, "json");
                    }
                });
                return false;
            });

            // 我的任务 设置
            $("#treePanel").on("click", ".set", function() {

                var id   = $(this).attr("task-id"),
                    load = $(this).parent(".item-footer").siblings(".item-header"),
                    html,
                    fragment,
                    htmlt,
                    htmls;

                /**
                 * 用了简单的方式防止重复执行代码
                 */
                if (mintenance.polling.isGettingData) {
                    notify.warn("正在获取数据中，请稍后！", {timeout: 1500});
                    return false;
                }

                mintenance.polling.isGettingData = true;

                pagination.hidePage();

                load.children("i.loading").show();

                $.when(mintenance.loadTpl("maintenance_settask"), mintenance.loadData("get_task?taskId=" + id)).done(function(htm, data) {
                    $("#sidebar>.header>ul").hide();
                    $(".group-item i.loading").hide();
                    $("#treePanel").css({
                        "top": 36
                    });

                    mintenance.polling.isGettingData = false;

                    mintenance.action = ".header .mytask";
                    html     = mintenance.render("maintenance_settask", data.data);
                    fragment = html.replace("advance", "advance active");

                    htmlt    = $(fragment);

                    htmls    = (htmlt[2] || htmlt[1]).innerHTML;
                    //$("#mytask").html(fragment);

                    $("#sidebar .header .newinsertheader").remove();
                    $("#mytask").html(htmls);
                    $("#sidebar>.header").append(htmlt[0].innerHTML);

                    mintenance.data.mytask = {};
                    mintenance.data.mytask.cameras = data.data.task.cameras;
                    mintenance.data.modifyCamerasList = data.data.task.cameras;
                    mintenance.data.modifyOrgList = data.data.taskorgids;

                    // 执行树形菜单
                    var cameraTree = null,
                        cameraTree = new CameraTree({
                        node: $(".cameras-list .treePanel"),
                        nodeHeight: jQuery('#treePanel .viewport').css('height', jQuery("#treePanel").height() - (40 + 70 + 70 + 65)),
                        selectable: true,
                        mode: "edit",
                        defaultOrgs: data.data.taskorgids,
                        defaultCameras: modifyCamerasId(data.data.task.cameras||[])
                        /*,
                        checkboxClick: function(el) {
                            addOrDeleteCameraIdforData(el);
                        }*/
                    });

                    /**
                     * @description 默认树形展开一级
                     * */
                    autoExpandFirstTree(cameraTree);

                    // 更新滚动条
                    scrollBar.init();

                    jQuery("#mytaskconfigtask").unbind("click");
                    jQuery("#mytaskconfigtask").bind("click", function() {
                        var self = $(this),
                            taskId = self.attr("task-id"),
                            data = getTaskInfo($("#mytask"), true, cameraTree),
                            disabled = self.attr("data-disabled");


                        if (!data) {
                            return false;
                        }

                       //return false

                        if(disabled === "disabled"){
                            notify.warn('任务正在提交，请稍等！');
                            return false;
                        }

                        self.attr({"data-disabled":"disabled"});

                        data.taskId = taskId;

                        $.ajax({
                            url: "/service/check/set_task",
                            type: "post",
                            data: data,
                            dataType: "json",
                            success: function(oData) {
                                if (oData && oData.code && oData.code === 200) {
                                    notify.success('任务更新成功！');
                                    //self.siblings("a").trigger("click");

                                    logDict.insertLog('m2','f3','o15','b19',data.taskName); // 设置日志

                                    pagination.redrawMytaskAndPages();
                                } else {
                                    notify.error('任务更新失败，请重试！');
                                    self.attr({"data-disabled":""});
                                }
                            },
                            error:function(){
                                notify.error('网络出错，更新任务失败，请重试！');
                                self.attr({"data-disabled":""});
                            }
                        });
                        return false;
                    });



                }).fail(function(){
                    mintenance.polling.isGettingData = false;
                    $(".group-item i.loading").hide();
                    //notify.error("获取模板或数据失败，服务器错误，请稍后重试！");
                });

                return false;


            });

            // 我的任务 查看 审核内容
            jQuery("#sidebar").on("click", ".groups ins", function() {
                var self = $(this),
                    taskId = self.closest(".status").attr("task-id"),
                    auditOpinion = "";

                $.when(mintenance.loadData("get_task_auditOpions?taskId=" + taskId)).done(function(data) {
                    auditOpinion = data.data.taskAudits;
                    if (auditOpinion.length >= 1) {
                        self.text(auditOpinion[auditOpinion.length - 1].auditOpinion);
                        self.unbind();
                    } else {
                        self.text("未审核");
                        self.unbind();
                    }
                });
            });
            // 任务上报
            jQuery("#sidebar").on("click", ".report", function() {
                var self = $(this),
                    data = self.attr("task-id");

                $.ajax({
                    url: "/service/check/report_task",
                    type: "post",
                    data: {
                        taskId: data
                    },
                    dataType: "json",
                    success: function(data) {
                        if (data && data.code && data.code === 200) {
                            notify.success('任务上报成功！');
                            self.parent().prepend('<q class="hasreported">已上报</q>');
                            self.remove();
                        } else {
                            notify.error('任务上报失败，请重试！');
                        }
                    }
                });
                return false;
            });
            // 提交任务
            jQuery("#sidebar").on("click", "#submittask", function() {
                mintenance.data.isStatusChanged = false;
                var checked  = $(".camearstatus:contains('正常')").length + $(".camearstatus:contains('异常')").length,
                data = $(this).attr("task-id");

                if(checked<=0){
                    notify.warn("请巡检后再提交任务！");
                    return false;
                }

                $.ajax({
                    url: "/service/check/commit_task",
                    type: "post",
                    data: {
                        taskId: data
                    },
                    dataType: "json",
                    success: function(data) {
                        if (data && data.code && data.code === 200) {
                            notify.success('任务提交成功！');
                            $(".back-home").trigger("click");
                        } else {
                            notify.error('任务提交失败，请重试！');
                        }
                    }
                });
                return false;
            });


            //配置计划
            $(".header .plan").click(function() {
                pagination.redrawPlanAndPages();
            });

            // 配置计划 新建提交
            /*	jQuery("#sidebar").on("click","#newplansubmit",function(){
                planSubmit($(this));
                return false;
            });*/

            // 配置计划 启用/禁用/ 从摸板新建任务
            jQuery("#sidebar").on("click", ".configplanisopen", function() {
                var self = $(this),
                    taskId = self.attr("task-id"),
                    status = self.attr("task-status"),
                    isOpen;

                if (status === "新建任务") {
                    configPlanNewTask(taskId);
                    return false;
                } else if (status === "启用") {
                    isOpen = 2;
                } else {
                    isOpen = 1;
                }
                $.ajax({
                    url: "/service/check/start_task_plan",
                    type: "post",
                    data: {
                        id: taskId,
                        status: isOpen
                    },
                    dataType: "json",
                    success: function(data) {
                        if (data && data.code && data.code === 200) {
                            if (status === "启用") {
                                notify.success('计划禁用成功！');
                                self.text("禁用");
                                self.addClass("closed").removeClass("opened");
                                self.attr("task-status", "禁用");
                                logDict.insertLog('m2','f3','o21','',self.attr('task-name')+'计划'); // 禁用日志
                            } else {
                                notify.success('计划启用成功！');
                                self.text("启用");
                                self.addClass("opened").removeClass("closed");
                                self.attr("task-status", "启用");
                                logDict.insertLog('m2','f3','o22','',self.attr('task-name')+'计划'); // 启用日志
                            }
                        } else {
                            if (status === "启用") {
                                notify.error('计划禁用失败，请重试！');
                            } else {
                                notify.error('计划启用失败，请重试！');
                            }
                        }
                    }
                });
                return false;
            });
            //配置计划 删除
            jQuery('#plan').on('click', '.delete', function() {
                var taskId = jQuery(this).attr('task-id').trim(),
                    self   = $(this);
                new ConfirmDialog({
                    title: '警告',
                    width: 640,
                    message: "您确定要删除此计划吗？",
                    callback: function() {
                        jQuery.post("/service/check/delete_task_plan", {
                            "id": taskId
                        }, function(data, xhr, textStatus) {

                            if (textStatus && textStatus.status === 302) {
                                self.modifyLogonStatus();
                                return false;
                            }

                            if (data && data.code === 200) {

                                pagination.redrawPlanAndPages('remove');
                                notify.success('删除成功！');
                                logDict.insertLog('m2','f3','o3','',self.attr("task-name")+'计划'); // 删除日志
                            } else {
                                notify.info("删除失败，请重试");
                            }
                        }, "json");
                    }
                });
                return false;
            });


            function configPlanNewTask(id) {
                $.when(mintenance.loadTpl("maintenance_configplan_settask"), mintenance.loadData("get_task_plan?id=" + id)).done(function(html, data) {

                    mintenance.action = ".header .plan";
                    //$("#plan").html(mintenance.render("maintenance_configplan_settask", data.data));

                    var htmlt, htmls;

                    htmlt = $(mintenance.render("maintenance_configplan_settask", data.data));

                    htmls = (htmlt[2] || htmlt[1]).innerHTML;

                    $("#sidebar>.header .newinsertheader").remove();
                    $("#plan").html(htmls);
                    $("#sidebar>.header").append(htmlt[0].innerHTML);

                    mintenance.data.modifyCamerasList = data.data.taskPlan.cameras;

                    // 执行树形菜单
                    var cameraTree = null;
                    cameraTree = new CameraTree({
                        node: $(".cameras-list .treePanel"),
                        nodeHeight: jQuery('#treePanel .viewport').css('height', jQuery("#treePanel").height() - (40 + 70 + 70 + 65)),
                        selectable: true
                    });

                    /**
                     * @description 默认树形展开一级
                     * */
                    autoExpandFirstTree(cameraTree);
                });
                return false;
            }

            //新建计划
            $("#sidebar").on("click", "#newplan", function() {

                pagination.hidePage();
                $.when(mintenance.loadTpl("maintenance_newplan")).done(function(html) {
                    $("#sidebar>.header>ul").hide();
                    $("#treePanel").css({
                        "top": 36
                    });
                    var html = mintenance.render("maintenance_newplan",{newPlan:true}),
                        htm = html.replace("back-home", "back-plan"),
                        htmlt,
                        htmls;

                    htmlt = $(htm);

                    htmls = (htmlt[2] || htmlt[1]).innerHTML;
                    //$("#plan").html(htm);

                    $("#sidebar>.header .newinsertheader").remove();
                    $("#plan").html(htmls);
                    $("#sidebar>.header").append(htmlt[0].innerHTML);

                    // 执行树形菜单
                    var cameraTree = null;
                    cameraTree = new CameraTree({
                        node: $(".cameras-list .treePanel"),
                        nodeHeight: jQuery('#treePanel .viewport').css('height', jQuery("#treePanel").height() - (40 + 70 + 70 + 65)),
                        selectable: true,
                        mode: "create"
                    });

                    /**
                     * @description 默认树形展开一级
                     * */
                    autoExpandFirstTree(cameraTree);

                    // 更新滚动条
                    scrollBar.init();

                    // 新建计划 提交
                    jQuery("#newplansubmit").unbind("click");
                    jQuery("#newplansubmit").bind("click", function() {
                        var self     = $(this),
                            disabled = self.attr("data-disabled");

                        if(disabled === "disabled"){
                            notify.warn('计划正在提交，请稍等！');
                            return false;
                        }

                        planSubmit($(this), false, cameraTree,'add');
                        return false;
                    });

                });
            });

            //新建计划 返回
            $("#sidebar").on("click", ".back-plan", function() {

                jQuery('.header .plan').trigger('click');
                return false;
            });

            // 配置计划 设置
            $("#treePanel").on("click", ".configplan", function() {

                pagination.hidePage();
                var id = $(this).attr("task-id"),
                    htmlt,
                    htmls;


                $.when(mintenance.loadTpl("maintenance_setplan"), mintenance.loadData("get_task_plan?id=" + id)).done(function(html, data) {
                    $("#sidebar>.header>ul").hide();
                    $("#treePanel").css({
                        "top": 36
                    });
                    //$("#plan").html(mintenance.render("maintenance_setplan", data.data));

                    htmlt = $(mintenance.render("maintenance_setplan", data.data));

                    htmls = (htmlt[2] || htmlt[1]).innerHTML;

                    $("#sidebar>.header .newinsertheader").remove();
                    $("#plan").html(htmls);
                    $("#sidebar>.header").append(htmlt[0].innerHTML);

                    var frequency = data.data.taskPlan.frequency,
                        param = data.data.taskPlan.param,
                        plandate = $("#plandate");

                    if (frequency == 2) {
                        $.when(mintenance.loadTpl("option_day")).done(function(html) {
                            html = $(html).find("#taskDate").val(param).end();
                            plandate.html(html)
                        });
                        plandate.show();
                    }
                    if (frequency == 3) {
                        $.when(mintenance.loadTpl("option_date")).done(function(html) {
                            html = $(html).find("#taskDate").val(param).end();
                            plandate.html(html)
                        });
                        plandate.show();
                    }



                    mintenance.data.modifyCamerasList = data.data.taskPlan.cameras;
                    mintenance.data.modifyOrgList = data.data.taskorgids;


                    // 执行树形菜单
                    var cameraTree = null;
                    cameraTree = new CameraTree({
                        node: $(".cameras-list .treePanel"),
                        nodeHeight: jQuery('#treePanel .viewport').css('height', jQuery("#treePanel").height() - (40 + 70 + 70 + 65)),
                        selectable: true,
                        mode: "edit",
                        defaultOrgs: data.data.taskorgids,
                        defaultCameras: modifyCamerasId(data.data.taskPlan.cameras)
                    });

                    /**
                     * @description 默认树形展开一级
                     * */
                    autoExpandFirstTree(cameraTree);

                    // 更新滚动条
                    scrollBar.init();

                    // 配置计划 设置提交
                    jQuery("#configplansubmit").unbind("click");
                    jQuery("#configplansubmit").bind("click", function() {
                        var self     = $(this),
                            disabled = self.attr("data-disabled");

                        if(disabled === "disabled"){
                            notify.warn('计划正在提交，请稍等！');
                            return false;
                        }

                        planSubmit($(this), $(this).attr("task-id"), cameraTree);
                        return false;
                    });
                });

                //}else{
                /*	mintenance.makeUp("maintenance_setplan","get_task_plan?id="+id,function(html){
                        $("#sidebar>.header").hide();
                        $("#treePanel").css({"top":0});
                        var htm = html.replace("back-home","back-plan");
                        $("#plan").html(htm);

                        // 执行树形菜单
                        new CameraTree({
                            node: $(".cameras-list .treePanel"),
                            nodeHeight: jQuery('#treePanel .viewport').css('height', jQuery("#treePanel").height() - (40 + 70 + 70 + 65)),
                            selectable: true
                        });
                    });
                }*/
                return false;
            });

            $("#sidebar").on("change", "#newplanfrequency", function() {
                var val = $(this).val(),
                    //taskDate = $("#taskDate").closest(".ui.input"),
                    plandate = $("#plandate"),
                    html;

                if (val == 1) {
                    plandate.hide();
                    return false;
                }
                if (val == 2) {
                    html = $.when(mintenance.loadTpl("option_day")).done(function(html) {
                        plandate.html(html)
                    });
                    plandate.show();
                    return false;
                }
                if (val == 3) {
                    html = $.when(mintenance.loadTpl("option_date")).done(function(html) {
                        plandate.html(html)
                    });
                    plandate.show();
                    return false;
                }
            })

            function planSubmit(el, isConfig, tree,add) {
                var //$(this).parent(".setting-head").siblings(".serchbox.advance").find
                    canSubmit = $("#newtaskName").attr("data-cansubmit"),
                    taskName  = $("#newtaskName").val(),
                    frequency = $("#newplanfrequency").val() - 0,
                    param     = $("#taskDate").val() - 0,
                    status    = el.attr("task-status"),
                    cameras   = {
                        cameras: []
                    },
                    array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
                    checkbox,
                    tmp,
                    data,
                    list,
                    url;

                if (tree) {
                    list = tree.getOutPutData();
                }

                if (canSubmit === "false") {
                    notify.remove();
                    notify.warn("计划名称重复，请修正后重试！");
                    return false;
                }

                if (!taskName) {
                    $("#newtaskName").focus();
                    notify.warn("计划名称不能为空！");
                    return false;
                } else if (taskName.length<2){
                    $("#newtaskName").focus();
                    notify.warn("计划名称最小长度为两个文字！");
                    return false;//[\u4E00-\u9FA5]+[a-zA-Z0-9_]*|
                } else if (!/^(?!_)(?!.*?_$)[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(taskName)) { // 过滤用户名非法字符
                    $("#newtaskName").focus();
                    notify.warn("计划名称由中文数字字母和下划线组成！");
                    return false;
                } else if (taskName.length > 50) {
                    $("#newtaskName").focus();
                    notify.warn("计划名称长度不得大于50个字！");
                    return false;
                }

                switch (frequency) {
                    case 0:
                        param = 0;
                        $("#taskDate").val("");
                        break;
                    case 1:
                        param = -1;
                        $("#taskDate").val("");
                        break;
                    case 2:
                        if (indexOf(array.slice(0, 7), param) === -1) {
                            notify.warn("请选择正确的计划日期！");
                            return false;
                        }
                        break;
                    case 3:
                        if (indexOf(array, param) === -1) {
                            notify.warn("请选择正确的计划日期！");
                            return false;
                        }
                        break;
                }

                checkbox = $("#plan").find(".checkbox.selected");

                if (checkbox.length < 1 && !isConfig) {
                    notify.warn("请选择此计划的摄像机！");
                    return false;
                }

                if (isConfig) {
                    data = {
                        id: isConfig,
                        taskName: taskName,
                        frequency: frequency,
                        param: param,
                        status:status,
                        cameras: JSON.stringify({
                            "cameras": list
                        })
                    };
                    url = "/service/check/set_task_plan";
                } else {
                    data = {
                        taskName: taskName,
                        frequency: frequency,
                        param: param,
                        cameras: JSON.stringify({
                            "cameras": list
                        })
                    };
                    url = "/service/check/add_task_plan";
                }

                jQuery("#newplansubmit,#configplansubmit").attr({"data-disabled":"disabled"});

                $.ajax({
                    url: url,
                    type: "post",
                    data: data,
                    dataType: "json",
                    success: function(oData) {
                        if (oData && oData.code && oData.code === 200) {
                            if (isConfig) {
                                notify.success('计划更新成功！');
                                logDict.insertLog('m2','f3','o15','',data.taskName+'计划'); // 设置日志
                            } else {
                                notify.success('新建计划成功！');
                                logDict.insertLog('m2','f3','o1','',data.taskName+'计划'); // 新建日志
                            }
                            //el.siblings("a").trigger("click");

                            pagination.redrawPlanAndPages(add);
                        } else {
                            if (isConfig) {
                                notify.error('计划更新失败，请重试！');
                            } else {
                                notify.error('新建计划失败，请重试！');
                            }
                            jQuery("#newplansubmit,#configplansubmit").attr({"data-disabled":""});
                        }
                    },
                    error:function(){
                        notify.warn('网络出错，操作未成功完成，请重试！');
                        jQuery("#newplansubmit,#configplansubmit").attr({"data-disabled":""});
                    }
                });

                return false;
            }

            // 合并
            $(".header .combine").click(function() {
                mintenance.makeUp("maintenance_combine", "merge_tasks_list", function(html) {
                    $("#sidebar>.header>ul").hide();
                    $("#treePanel").css({
                        "top": 88
                    });
                    $("#combine").html(html);
                });
                mintenance.witchTask = 'combine';
            });
            //合并 提交
            jQuery("#sidebar").on("click", "#tabcombine", function() {
                var taskName = $("#taskName").val(),
                    checkbox = $(this).parent(".setting-head").siblings(".groups").find(".checkbox:checked"),
                    tasks = {
                        tasks: []
                    },
                    tmp;

                if (!taskName) {
                    $("#taskName").focus();
                    notify.warn("请填写新的任务名称！");
                    return false;
                }

                if (checkbox.length < 1) {
                    $("#taskName").focus();
                    notify.warn("请选择要合并的任务！");
                    return false;
                }

                for (var i = 0; i < checkbox.length; i++) {
                    tmp = {};
                    tmp.taskId = checkbox.eq(i).attr("task-id");
                    tasks.tasks.push(tmp);
                }

                $.ajax({
                    url: "/service/check/merge_tasks",
                    type: "post",
                    data: {
                        taskName: taskName,
                        tasks: JSON.stringify(tasks)
                    },
                    dataType: "json",
                    success: function(data) {
                        if (data && data.code && data.code === 200) {
                            notify.success('任务合并成功！');
                        } else {
                            notify.error('任务合并失败，请重试！');
                        }
                    }
                });
                return false;
            });

            function clearMapIcon() {
                //mintenance.mymap.map.graphics.clear();
                mintenance.mapObj.map.removeOverlays();
                jQuery('.titleButton.close').trigger('click');
                mintenance.data[mintenance.witchTask] = {};
                mintenance.maxLen = 0;
                mintenance.curCameraIndex = 0;
            }

            // 返回
            $("#sidebar").on("click", ".back-home", function() {

                if(mintenance.data.isStatusChanged){
                    new ConfirmDialog({
                        title: '警告',
                        width: 640,
                        message: "确定返回？如果返回此任务中的摄像机的巡检状态将丢失！",
                        callback: function() {
                            backHome();
                        }
                    });
                }else{
                    backHome();
                }
            });

            // 返回实际执行的函数
            function backHome(){
                clearMapIcon();
                var node = mintenance.action || ".header .mytask";


                if(node === '.header .mytask'){
                    jQuery('.mytask').addClass('active');
                    jQuery('#mytask').addClass('active').siblings().removeClass('active');
                    pagination.redrawMytaskAndPages();
                }else{
                    $(node).trigger("click");
                }

                mintenance.action                       = "";
                mintenance.pointertrigger               = false; /*退出了分任务*/
                mintenance.data.expandTree.index        = -1;
                mintenance.data.expandAllTree           = -1;
                mintenance.data.allTreeIds              = [];
                mintenance.data.expandTree.prevId       = 0;
                mintenance.data.expandTree.starusElmLen = 0;
                mintenancePlayer.data                   = null;
                mintenance.data.mytask                  = {};
                mintenance.data.mytask.cameras          = null;
                mintenance.data.modifyCamerasList       = null;
                mintenance.data.modifyOrgList           = null;
                mintenance.data.isBadId                 = [];
                mintenance.curCameraIndex               = 0;
                mintenance.data.expandTree.prevCameras  = [];
                mintenance.newCameras                   = [];
                mintenance.data.cameraData              = [];
                mintenance.data.cameraOrgIds            = [];
                mintenance.data.isBadcameraOrgIds       = [];
                mintenance.data.isStatusChanged         = false;
                mintenance.data.isSingle                = false;
                mintenance.data.search.polling          = false;
                mintenance.data.camerasId               = [];
                mintenance.polling.isGettingData        = false;
                mintenance.layout                       = 4;

                mintenance.getAutomaticStatus.pause();

                $("#newtask,#mytask").children().remove();

                $("#video-control").hide();
                if(mintenance.model === 'maptype'){
                    mintenance.mapObj.closeInfoWindow();
                    $("#classic").trigger("click");
                }

                //if(mintenance.model === 'classic'){
                if(mintenance.videoPlayer){
                    mintenance.videoPlayer.switchPTZ(false,0);
                    mintenance.videoPlayer.stopAll();
                    mintenance.videoPlayer.refreshAllWindow();
                    mintenance.videoPlayer.perAllCloseStream();
                    mintenance.videoPlayer.setStyleToAll();
                    try {
                        mintenance.videoPlayer.setLayout(4);
                    } catch(err){}
                    $("#major .header .rMenu .item i.icon.split").css("background-position", "0px -34px");
                    $("#selectPanel").attr("data-layout", 4);
                    mintenance.videoPlayer.cameraData = [];
                }

                checkboxAction(true); // 禁止所有输入等
                //initAbnormal(jQuery('.controller-area'));
                //}
                //if(mintenance.model === 'maptype'){
                if(mintenance.mapvideoPlayer){
                    mintenance.mapvideoPlayer.switchPTZ(false,0);
                    mintenance.mapvideoPlayer.stopAll();
                    mintenance.mapvideoPlayer.refreshWindow();
                }
                initAbnormal(jQuery(".map-issue"));
                //}
                mintenancePlayer && mintenancePlayer.hidePtz();

            }


            //合并 checkall
            $("#treePanel").on("click", ".checkall input", function() {
                mintenance.checkAll(".combine", ".checkbox", ".checkall input");
            });
            //合并 checkbox
            $("#treePanel").on("click", ".checkbox", function() {
                mintenance.check(".combine", ".checkbox", ".checkall input");
            });

            // 改变巡检列表展现方式以及排序
            function changeModeAndSort(el, isSort) {
                var tab = el,
                    opration = tab.closest(".opration"),
                    cameras_list = opration.siblings(".cameras-list"),
                    tasks_list = opration.siblings(".tasks-list"),
                    treeList = cameras_list.find(".treePanel .error-no-data").length > 0,
                    cameras,
                    camerasId = [],
                    taskId,
                    task,
                    isSort = isSort ? "&type=" + isSort : "";

                tab.addClass('active').siblings().removeClass('active');

                var type = tab.attr('data-tab');


                if (type === "list" && treeList) {

                    return false;

                } else {

                    task = mintenance.witchTask;
                    taskId = mintenance.data[task].taskId;
                    //if (!mintenance.data.camerasId || mintenance.data.camerasId.length <= 0) {
                        cameras = mintenance.data[task].cameras;
                        for (var i = 0; i < cameras.length; i++) {
                            camerasId.push(cameras[i].cameraId);
                        }
                    /*} else {
                        for (var j = 0; j < mintenance.data.camerasId.length; j++) {
                            camerasId.push(mintenance.data.camerasId[j].cameraId);
                        }
                    }*/

                    if (camerasId.length <= 0) {
                        tasks_list.html("<p style='text-align: center;'>摄像机列表为空<!--,请勾选摄像机后继续-->！</p>");
                    } else {
                        mintenance.makeUp("maintenance_polling_block", "get_camera_results?cameraId=" + camerasId.join(",") + "&taskId=" + taskId + isSort, function(html) {
                            tasks_list.html(html);
                        });
                    }
                }
                jQuery('.polling[data-tab="' + type + '"]').show().siblings(".polling").hide();
                return false;
            }

            // 巡检 模式切换
            jQuery("#sidebar").on("click", '.polling-model>a', function() {
                changeModeAndSort($(this), 2);
                return false;
            });
            // 巡检 排序时间
            jQuery("#sidebar").on("click", '.polling-model .bytime .time', function() {
                changeModeAndSort($(this), 1);
                $(this).parent(".bytime").addClass("actived");
                $(".byhand").removeClass("actived");
                $(".cameras-list.polling").hide();
                $(".tasks-list.polling").show();
                return false;
            });
            // 巡检 排序手动
            jQuery("#sidebar").on("click", '.polling-model .byhand .action', function() {
                changeModeAndSort($(this), 2);
                $(this).parent(".byhand").addClass("actived");
                $(".bytime").removeClass("actived");
                $(".cameras-list.polling").hide();
                $(".tasks-list.polling").show();
                return false;
            });

            // 检查任务名称是否可用

            jQuery("#sidebar").on("change", "#taskName,#newtaskName", function() {
                var self = $(this),
                    taskName = self.val().trim(),
                    type = self.attr("data-type");

                type = ((type === "task") ? 0 : 1);

                if (taskName) {
                    $.ajax({
                        url: "/service/check/verify_task_name",
                        type: "post",
                        data: {
                            taskName: taskName,
                            type: type
                        },
                        success: function(res) {
                            if (res.code && res.code === 200 && res.data.taskKey === "1") {
                                if (type === 0) {
                                    notify.warn("任务名称重复，请修正后重试！");
                                } else {
                                    notify.warn("计划名称重复，请修正后重试！");
                                }

                                self.attr("data-cansubmit", false);
                                self.val("").focus().val(taskName);
                                return false;
                            }else{
                                self.attr("data-cansubmit", true);
                            }
                        }
                    });
                }
                return false;
            });



            // 通用函数

            /* 获取选择任务的信息 包括摄像机id */
            function getTaskInfo(elm, isConfig, tree) {

                var canSubmit,
                    taskName,
                    taskDate,
                    checkbox,
                    cameras  = [],
                    advance  = elm.children(".serchbox.advance"),
                    taskDate = advance.find("#taskDate").val() || advance.find("#ntaskDate").val(),
                    tmp,
                    li;

                canSubmit = advance.find("#taskName").attr("data-cansubmit");
                taskName = advance.find("#taskName").val().trim();
                taskDate = taskDate ? taskDate.trim() : "2049-01-30";
                checkbox = elm.children(".cameras-list").find(".treePanel .checkbox.selected");
                //li = checkbox.parent("li[data-type=leaf]");

                if (tree) {
                    var data = tree.getOutPutData();
                }

                if (canSubmit === "false") {
                    notify.remove();
                    notify.warn("任务名称重复，请修正后重试！");
                    return false;
                }

                if (!taskName) {
                    $("#taskName").focus();
                    notify.warn("任务名称不能为空！");
                    return false;
                } else if (taskName.length<2){
                    $("#taskName").focus();
                    notify.warn("任务名称最小长度为两个文字！");
                    return false;
                } else if (!/^(?!_)(?!.*?_$)[a-zA-Z0-9_\-\u4e00-\u9fa5]+$/.test(taskName)) { // 过滤用户名非法字符
                    $("#taskName").focus();
                    notify.warn("任务名称由中文数字字母和下划线中划线组成！");
                    return false;
                } else if (taskName.length > 50) {
                    $("#taskName").focus();
                    notify.warn("任务名称长度不得大于50个字！");
                    return false;
                }

                if (!taskDate) {
                    $("#taskDate").focus();
                    notify.warn("请填写任务提交日期！");
                    return false;
                } else {
                    if (!(/^((((1[6-9]|[2-9]\d)\d{2})-(0?[13578]|1[02])-(0?[1-9]|[12]\d|3[01]))|(((1[6-9]|[2-9]\d)\d{2})-(0?[13456789]|1[012])-(0?[1-9]|[12]\d|30))|(((1[6-9]|[2-9]\d)\d{2})-0?2-(0?[1-9]|1\d|2[0-8]))|(((1[6-9]|[2-9]\d)(0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00))-0?2-29-))$/).test(taskDate)) {
                        $("#taskDate").focus();
                        notify.warn("任务提交日期格式错误！");
                        return false;
                    }
                }

                if (checkbox.length < 1 && !isConfig) {
                    notify.warn("请选择要巡检的摄像机！");
                    return false;
                }

                /*		for (var i = 0; i < li.length; i++) {
                    tmp = {};
                    tmp.cameraId = li.eq(i).attr("data-id");
                    tmp.orgId = li.eq(i).attr("data-org");
                    cameras.push(tmp);
                }*/

                if (isConfig) {  // 编辑修改
                    return {
                        taskName: taskName,
                        taskDate: taskDate,
                        cameras: JSON.stringify({
                            "cameras": data
                        })
                    };
                }

                return {  // 新增
                    taskName: taskName,
                    taskDate: taskDate,
                    cameras: JSON.stringify({
                        "cameras": data
                    })
                };
            }


            //每次 勾选/取消勾选 摄像机，都对数据进行处理
            function addOrDeleteCameraIdforData(el) {
                var task = mintenance.witchTask,
                    data = mintenance.data[task],
                    cameras = mintenance.data.camerasId || data.cameras,
                    camerasId = [],
                    len = cameras.length,
                    li = el.parent("li"),
                    id = li.attr("data-id") - 0,
                    selected = el.hasClass("selected"),
                    tmp;

                for (var j = 0; j < len; j++) {
                    camerasId.push({
                        cameraId: cameras[j].cameraId,
                        orgId: cameras[j].orgId
                    });
                }

                for (var i = 0; i < len; i++) {
                    tmp = indexOfObject(camerasId, id, "cameraId");
                    if (selected && tmp > -1) {
                        camerasId.slice(0);
                        camerasId.splice(tmp, 1)
                        mintenance.data.camerasId = camerasId;
                        len = camerasId.length;
                        return false;
                    }
                    if (!selected) {
                        camerasId.push({
                            cameraId: id,
                            orgId: li.attr("data-org")
                        });
                        mintenance.data.camerasId = camerasId;
                        return false;
                    }
                }

            }


            function indexOfObject(array, context, key) {

                for (var i = 0; i < array.length; i++) {
                    if (array[i][key] === context) {
                        return i;
                    }
                }
                return -1;
            }


            function indexOf(array, context) {
                if (typeof Array.prototype.indexOf != "function") {
                    for (var i = 0; i < array.length; i++) {
                        if (array[i] === context) {
                            return i;
                        }
                    }
                    return -1;
                } else {
                    return array.indexOf(context);
                }
            }

            function getDataByCameraId(id) {
                var task = mintenance.witchTask,
                    data = mintenance.data[task],
                    cameras = data.cameras,
                    len = cameras.length;

                for (var i = 0; i < len; i++) {
                    if (cameras[i].cameraId === (id - 0)) {
                        cameras[i].taskDate = data.taskDate;
                        return cameras[i];
                    }
                }
                return false;
            }


            var mintenancePlayer = {
                init: function() {
                    if (this.videoPlayer) {
                        return this;
                    }
                    try {
                        var player = mintenance.videoPlayer;
                        this.videoPlayer = player;
                    } catch (err) {}
                    return this;
                },
                videoPlayer: null,
                data: null,
                setData: function(data,index) { // data 摄像机信息 index 通道
                    this.data  = data;
                    this.index = index;
                    if(this.isSupportPtz()){
                        this.showPtz();
                    }else{
                        this.hidePtz();
                    }
                    return this;
                },
                play: function() {

                    var self = this;
                    try {
                        self.videoPlayer.play(self.data,0);
                    } catch (err) {}
                    if (this.isSupportPtz() > 0) {
                        this.showPtz();

                    } else {
                        this.hidePtz();
                    }
                },
                isSupportPtz: function() { // 0 不支持  1 支持
                    if (this.data) {
                        return this.data.cType;
                    } else {
                        return -1;
                    }

                },
                showPtz: function() {
                    var self = this;
                    $("#ptzCamera .content").show();
                    $(".view.ptz.ui.tab").show();
                    gPtz.setParams({
                        cameraId: this.data.cId,
                        cameraNo: this.data.path,
                        cameraType: this.data.cType,
                        cameraChannel:this.data.cameraChannel
                    });
                    $("#ptzCamera").addClass("active");

                    // 设置云台
                    this.PTZ();
                },
                hidePtz: function() {
                    $("#ptzCamera .content").hide();
                    $(".view.ptz.ui.tab").hide();
                    $("#ptzCamera").removeClass("active");
                },
                isPTZShowing: function() {
                    return $("#ptzCamera .content").is(":visible");
                },
                PTZ:function(close){
                    /*for(var i=0;i<mintenance.layout;i++){
                        if(mintenance.videoPlayer){
                            mintenance.videoPlayer.switchPTZ(false,i);
                        }
                    }*/
                    if(!close){
                        if(mintenance.videoPlayer){
                            mintenance.videoPlayer.switchPTZ(true,this.index||0);
                        }
                    }
                }
            };
            mintenancePlayer.init();

            $("#sidebar").on("click", "#ptzCamera .header", function() {
                var data = mintenancePlayer.isSupportPtz();
                if (data === -1) {
                    notify.error("当前场景不可使用云台！");
                    return false;
                }
                if (data === 0) {
                    notify.error("当前摄像机不支持云台！");
                    return false;
                }
                if (mintenancePlayer.isPTZShowing()) {
                    mintenancePlayer.hidePtz();
                    return false;
                } else {
                    mintenancePlayer.showPtz();
                    return false;
                }
            });


            (function resizePlayer() {
                var playerWidth = jQuery(".camera-area").width(); //视频容器的宽度
                var playerHeight = jQuery(".camera-area").height(); //视频容器的高度
                jQuery('#UIOCX').width(playerWidth);
                jQuery('#UIOCX').height(playerHeight);

                jQuery(window).resize(function(event) {
                    playerWidth = jQuery(".camera-area").width();
                    playerHeight = jQuery(".camera-area").height();
                    jQuery('#UIOCX').width(playerWidth);
                    jQuery('#UIOCX').height(playerHeight);
                });

            }());

            /*document.onselectstart = function() {
                event.returnValue = event.srcElement.type === "text";
            };*/


            window.mintenance       = mintenance;
            window.mintenancePlayer = mintenancePlayer;

        //});

    });


});
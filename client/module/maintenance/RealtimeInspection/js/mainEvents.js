/**
 * Created by Leon.z on 2015/10/13.
 */
define([
    "js/global-varibale",
    "js/AllDeal",
    "/module/common/popLayer/js/popImg.js",
    "./../../common/js/camera-tree",
    "orgnScrollbar",
    "base.self",
    "handlebars",
    'jquery-ui-timepicker-addon',
    'js/search-task'
], function(_g, mainDeal, POPIMG, CameraTree, scrollBar) {
    var mainEventPort = function() {
        this.mainDealObj = {};
    }
    mainEventPort.prototype = {
        init: function(obj) {
            var self = this;
            self.mainDealObj = obj
            self.bindEvents();
            self.registerHelper();
            self.compiler = null;
            _g.loadTemplate('/module/maintenance/RealtimeInspection/inc/pageTmp.html', function(compiler) {
                self.compiler = compiler;
            });
            var h = jQuery('#sidebar').height();
           jQuery('#aside').height(h-100) 
        },
        registerHelper: function() {
            Handlebars.registerHelper('isNew', function(status) {
                if (status === 2 || status === "2") {
                    return "active"
                }
                return "";
            });
            Handlebars.registerHelper('isHidden', function(status) {
                if (status === 3 || status === "3") {
                    return ""
                } else if (status === 5 || status === "5") {
                    return ""
                } else if (status === 6 || status === "6") {
                    return ""
                }
                return "hidden";
            });
            Handlebars.registerHelper('isred', function(status) {
                if (status === 5 || status === "5") {
                    return "colorRed"
                } else if (status === 6 || status === "6") {
                    return "colorRed"
                }else if (status === 7 || status === "7") {
                    return "colorRed"
                }
                return "";
            });
            Handlebars.registerHelper('taskNamehlp', function(status) {
                if (status === 5 || status === "5") {
                    return "任务失败"
                } else if (status === 6 || status === "6") {
                    return "任务失败"
                } else if (status === 7 || status === "7") {
                    return "任务失败"
                } else if (status === 1 || status === "1") {
                    return "未巡检"
                } else if (status === 2 || status === "2") {
                    return "巡检中"
                } else if (status === 3 || status === "3") {
                    return "已巡检"
                }
                return "已巡检";
            });
            Handlebars.registerHelper('iserrorHidden', function(status) {
                if (status === 5 || status === "5") {
                    return ""
                } else if (status === 6 || status === "6") {
                    return ""
                } else if (status === 7 || status === "7") {
                    return ""
                }
                return "hidden";
            });
            Handlebars.registerHelper('taskerroinfo', function(status) {
                if (status === 5 || status === "5") {
                    jQuery("#onlineBox li.taskitem .statuslist").find("p").removeClass("hasPad");
                    return "占用"
                } else if (status === 6 || status === "6") {
                    jQuery("#onlineBox li.taskitem .statuslist").find("p").removeClass("hasPad");
                    return "数据回写异常"
                }else if (status === 7 || status === "7") {
                    jQuery("#onlineBox li.taskitem .statuslist").find("p").removeClass("hasPad");
                    return "PCC异常"
                }
                return "未知";
            });
            Handlebars.registerHelper('isHasPad', function(status) {
                if (status === 5 || status === "5") {
                    return ""
                } else if (status === 6 || status === "6") {
                    return ""
                }else if (status === 7 || status === "7") {
                    return ""
                }
                return "hasPad";
            });

            Handlebars.registerHelper('insResult', function(status) {
                if (status === 1 || status === "1") {
                    return "正常"
                } else {
                    return "异常"
                }
            });

            Handlebars.registerHelper('instype', function(status) {
                if (status) {
                    return status;
                } else {
                    return "无";
                }
            });

            //是否启用
            Handlebars.registerHelper('isOpen', function(data) {
                var isOpen = '';
                switch (data) {
                    case 1:
                        isOpen = '启用';
                        break;
                    case 2:
                        isOpen = '禁用';
                        break;
                    default:
                        isOpen = "新建任务";
                }
                return isOpen;
            });
            //是否禁用  启用的另一版 返回数据不一样
            Handlebars.registerHelper('isClosed', function(data) {
                var isOpen = '';
                switch (data) {
                    case 1:
                        isOpen = 'opened';
                        break;
                    case 2:
                        isOpen = 'closed';
                        break;
                    default:
                        isOpen = "closed";
                }
                return isOpen;
            });
            Handlebars.registerHelper('dateThen', function(param, frequency) {
                var dateThen = '',
                    numToString = [
                        "一", "二", "三", "四", "五", "六", "七", "八", "九", "十",
                        "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
                        "二十一", "二十二", "二十三", "二十四", "二十五", "二十六", "二十七", "二十八", "二十九", "三十",
                        "三十一"
                    ];

                switch (frequency) {
                    case 0:
                        dateThen = '-----';
                        break;
                    case 1:
                        dateThen = '每天';
                        break;
                    case 2:
                        dateThen = '下周' + (numToString[parseInt(param, 10) - 1] === '七' ? "日" : numToString[parseInt(param, 10) - 1]);
                        break;
                    case 3:
                        dateThen = "下月" + numToString[parseInt(param, 10) - 1] + "号";
                        break;
                }
                return dateThen;
            });

            Handlebars.registerHelper('rate', function(data) {
                var frequency = '';
                switch (data) {
                    case 1:
                        frequency = '每天';
                        break;
                    case 2:
                        frequency = '每周';
                        break;
                    case 3:
                        frequency = '每月';
                        break;
                }
                return frequency;
            });

            Handlebars.registerHelper('dateNow', function(param, frequency) {
                var dateNow = '',
                    numToString = [
                        "一", "二", "三", "四", "五", "六", "七", "八", "九", "十",
                        "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
                        "二十一", "二十二", "二十三", "二十四", "二十五", "二十六", "二十七", "二十八", "二十九", "三十",
                        "三十一"
                    ];

                switch (frequency) {
                    case 0:
                        dateNow = '-----';
                        break;
                    case 1:
                        dateNow = '每天';
                        break;
                    case 2:
                        dateNow = '每周' + (numToString[parseInt(param, 10) - 1] === '七' ? "日" : numToString[parseInt(param, 10) - 1]);
                        break;
                    case 3:
                        dateNow = "每月" + numToString[parseInt(param, 10) - 1] + "号";
                        break;
                }
                return dateNow;
            });

            Handlebars.registerHelper('ifequal', function(val1, val2, string, elseString) {
                if (val1 === val2) {
                    return string;
                } else if (elseString) {
                    return elseString;
                }
            });

            Handlebars.registerHelper('timeValid', function(val) {
                return Toolkit.mills2datetime(val).substring(11);
            });

        },

        //拷贝以前巡检模块的方法-开始
        tpl: {}, // 模板缓存

        witchTask: 'mytask',
        /*判断当前任务类型:mytask | checktask*/

        pageNode: jQuery('.pagination'),

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
                error: function() {
                    dfd.reject();
                }
            });
            return dfd.promise();
        },

        render: function(name, data) {
            return Handlebars.compile(this.tpl[name])(data);
        },

        loadData: function(name, sData) {
            var self = this;
            var dfd = $.Deferred();
            $.ajax({
                type: "get",
                cache: false,
                url: "/service/check/" + name,
                data: sData || null,
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

        autoExpandFirstTree: function() {
            // $(obj.options.node).bind("treeExpandSuccess", function() {
                // var self = $(this);
                // $(obj.options.node).unbind("treeExpandSuccess");
                setTimeout(function() {
                    jQuery(".treePanel li.tree.root>i.fold").trigger("click");
                }, 100);
            // });
        },

        redrawPlanAndPages: function(arg) {
            if (arg === 'search') {
                this.comeFromSearchPlan = 'search';
            } else {
                this.comeFromSearchPlan = '';
            }
            // 分页处理
            this.drawPlan(arg);
        },

        redrawMytaskAndPages: function(arg) {
            /*如果要重新绘制分页必须值空pagination*/
            /*除了直接点击分页,产生跳转是插件自动完成,只需加载内容即可*/
            if (arg === 'search') {
                this.comeFromSearchTask = 'search';
            } else {
                this.comeFromSearchTask = '';
            }
            if (arg === 'first') {
                this.mytask = 1;
            }
            this.pageNode.html(' ');
        },

        drawPlan: function(arg) {
            var self = this,
                htmlt,
                htmls,
                pageNode,
                sData = {
                    pageNo: 1,
                    pageSize: 3,
                };

            if (self.comeFromSearchPlan === "search") {
                sData.name = jQuery.trim(jQuery(".plan-task-list .search input[type='text']").val());
            }

            $.when(self.loadTpl("mintenance_config_plan_list"), self.loadData("task_plan_list", sData)).done(function(html, mytask) {
                var tasks = mytask.data.taskPlans,
                    bottomPageNo = tasks.bottomPageNo;
                self.total = tasks.totalRecords;
                if (arg === 'remove' && tasks.list.length === 0) {
                    if (self.plan === 1) {
                        self.plan = 1;
                    } else {
                        self.plan -= 1;
                    }
                }

                html = self.render("mintenance_config_plan_list", mytask.data.taskPlans);

                htmlt = $(html);
                htmls = (htmlt[2] || htmlt[1]).innerHTML;
                pageNode = self.pageNode.html();

                $("#sidebar>.header .newinsertheader").remove();
                $("#plan").html(htmls).show();
                $("#sidebar>.header").append(htmlt[0].innerHTML);
                if (tasks.list.length === 0) {
                    jQuery("#mainCount").hide();
                    jQuery("#notask").show();
                } else {
                    jQuery("#mainCount").show();
                    jQuery("#notask").hide();
                }

                if (self.total > sData.pageSize) {

                    jQuery("#plnPage").html(self.compiler({
                        "pagebar": true
                    }));
                    jQuery("#plnPage").find(".pagination").show();
                }
                _g.setPagination(self.total, "#plnPage .pagination", sData.pageSize, sData.pageNo - 1, function(nextPage) {
                    // TODO  分页回调函数
                    sData.pageNo = nextPage;
                    _g.currentPage = nextPage;

                    self.loadData("task_plan_list", sData).done(function(res) {
                        if (res && res.code === 200) {

                            var html = self.render("mintenance_config_plan_list", res.data.taskPlans),
                                htmlt = $(html),
                                htmls = (htmlt[2] || htmlt[1]).innerHTML,
                                pageNode = self.pageNode.html();
                            $("#sidebar>.header .newinsertheader").remove();
                            $("#plan").html(htmls).show();
                            $("#sidebar>.header").append(htmlt[0].innerHTML);
                        }
                    })

                });

                // 更新滚动条
                scrollBar.init();

                if (self.comeFromSearchPlan === 'search') {
                    jQuery('form.newinsertheader .simple input[name=planName]').trigger('focus');
                }

                jQuery('.group-item:first').trigger('click')
            });

            self.witchTask = 'plan';

        },

        // 处理摄像机 id 适配修改属性数据的格式
        modifyCamerasId: function(data) {
            var id = [];
            for (var i = 0; i < data.length; i++) {
                id.push(data[i].cameraId)
            }
            return id;
        },

        indexOf: function(array, context) {
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
        },

        planSubmit: function(isEdit, el, isConfig, tree, add) {
            var self = this;
            var //$(this).parent(".setting-head").siblings(".serchbox.advance").find
                canSubmit = $("#newtaskName").attr("data-cansubmit"),
                taskName = $("#newtaskName").val(),
                time = $("#newtaskTime").val(),
                frequency = $("#newplanfrequency").val() - 0,
                param = $("#taskDate").val() - 0,
                status = 1,
                cameras = {
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
            } else if (taskName.length < 2) {
                $("#newtaskName").focus();
                notify.warn("计划名称最小长度为两个文字！");
                return false; //[\u4E00-\u9FA5]+[a-zA-Z0-9_]*|
            } else if (!/^(?!_)(?!.*?_$)[a-zA-Z0-9_\：\-\: \u4e00-\u9fa5]+$/.test(jQuery.trim(taskName))) {
                //} else if (!/^(?!_)(?!.*?_$)[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(taskName)) { // 过滤用户名非法字符
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
                    if (self.indexOf(array.slice(0, 7), param) === -1) {
                        notify.warn("请选择正确的计划日期！");
                        return false;
                    }
                    break;
                case 3:
                    if (self.indexOf(array, param) === -1) {
                        notify.warn("请选择正确的计划日期！");
                        return false;
                    }
                    break;
            }

            checkbox = $(".new-plan").find(".checkbox.selected");

            if (checkbox.length < 1 && !isConfig) {
                notify.warn("请选择此计划的摄像机！");
                return false;
            }

            if (isEdit) {
                data = {
                    id: isConfig,
                    taskName: taskName,
                    time : time,
                    frequency: frequency,
                    param: param,
                    status: status,
                    cameras: JSON.stringify({
                        "cameras": list
                    })
                };
                url = "/service/check/set_task_plan";
            } else {
                data = {
                    time : time,
                    taskName: taskName,
                    frequency: frequency,
                    param: param,
                    cameras: JSON.stringify({
                        "cameras": list
                    })
                };
                url = "/service/check/add_task_plan";
            }


            jQuery("#newplansubmit,#configplansubmit").attr({
                "data-disabled": "disabled"
            });

            $.ajax({
                url: url,
                type: "post",
                data: data,
                dataType: "json",
                success: function(oData) {
                    if (oData && oData.code && oData.code === 200) {
                        if (isEdit) {
                            notify.success('计划更新成功！');
                            logDict.insertLog('m2', 'f14', 'o15', '', data.taskName + '计划'); // 设置日志
                        } else {
                            notify.success('新建计划成功！');
                            logDict.insertLog('m2', 'f14', 'o1', '', data.taskName + '计划'); // 新建日志
                        }

                        jQuery('.new-plan .back-home').trigger("click");

                        self.redrawPlanAndPages(add);
                    } else {
                        if (isEdit) {
                            notify.error(oData.data.message || '计划更新失败，请重试！');
                        } else {
                            notify.error(oData.data.message || '新建计划失败，请重试！');
                        }
                        jQuery("#newplansubmit,#configplansubmit").attr({
                            "data-disabled": ""
                        });
                    }
                },
                error: function() {
                    notify.warn('网络出错，操作未成功完成，请重试！');
                    jQuery("#newplansubmit,#configplansubmit").attr({
                        "data-disabled": ""
                    });
                }
            });

            return false;
        },


        //拷贝以前巡检模块的方法-结束

        bindEvents: function() {
            var self = this;

            jQuery('#inspectionTime').datetimepicker({
                dateFormat: "yy/mm/dd",
                showTimepicker: false,
                maxDate: new Date()
            });

            /**任务和计划切换显示**/
            jQuery('.task-tab').on("click", "div", function() {
                jQuery(this).addClass('active').siblings('div').removeClass('active');
                jQuery('.sbar input, #allStatus').val("");
                if(jQuery(".cameraPanel").is(":visible")){
                   jQuery(".cameraPanel").addClass("hidden");
                }
                //jQuery('
                if (jQuery(this).index() === 0) { // 任务列表
                    jQuery("#mainCount").show();
                    jQuery("#notask").hide();
                    jQuery('.tsk-lst, .ex-task').show().siblings('.plan-lists').hide();
                    jQuery('.plan-show, .ex-plan').hide();
                    jQuery('.taskitem:first').trigger('click');
                    if (!jQuery("#onlineBox").find(".taskitem").length) {
                        jQuery("#mainCount").hide();
                        jQuery("#notask").show();
                    }
                } else { // 计划列表
                    jQuery('.plan-lists, .ex-plan, .plan-show').show().siblings('.tsk-lst, .ex-task').hide();
                    self.redrawPlanAndPages();
                }
            });
            /**新建巡检计划**/
            jQuery(document).on("click", "#plan .newplan", function() {
                jQuery("#planListPanel").hide();
                self.mainDealObj.setPlanPanel()
            });
            /**巡检计划新建返回**/
            jQuery(document).on("click", ".planDetailPanel #returnBackToInspect", function() {
                _g.confirmDialog("正在编辑，是否放弃此次编辑内容？", function() {
                    jQuery("#listPanel").show();
                    jQuery(".planDetailPanel").hide();
                });
            });
            /**新建巡检计划**/
            jQuery(document).on("change", "#planFre", function() {
                self.mainDealObj.setPlanFre(jQuery(this).val());
            });


            //新建计划
            $("#sidebar").on("click", "#newplan", function() {

                //pagination.hidePage();
                $.when(self.loadTpl("maintenance_newplan")).done(function(html) {
                    var html = self.render("maintenance_newplan", {
                            newPlan: true
                        }),
                        htm = html.replace("back-home", "back-plan"),
                        htmlt,
                        htmls;

                    htmlt = $(htm);

                    htmls = (htmlt[2] || htmlt[1]).innerHTML;
                    $(".new-plan").html(htmls).show().siblings().hide();
                    // 执行树形菜单
                    var cameraTree = null;
                    cameraTree = new CameraTree({
                        node: $(".cameras-list .treePanel"),
                        nodeHeight: jQuery('#treePanel .viewport').css('height', jQuery("#treePanel").height() - (40 + 70 + 70 + 65)),
                        selectable: true,
                        mode: "create"
                    });

                    // 绑定联动选择事件
                    // mailMask.bindEvt();
                    /**
                     * @description 默认树形展开一级
                     * */
                    self.autoExpandFirstTree();

                    // 更新滚动条
                    scrollBar.init();

                    // 新建计划 提交
                    jQuery(document).off("click", "#newplansubmit").on("click", "#newplansubmit", function() {
                        var time = jQuery("#newtaskTime").val().trim();
                        if(time===""){
                            notify.warn("执行时间不能为空");
                            return;
                        }

                        // 校验计划列表名称
                        var sData = {
                            'taskPlanName': jQuery("#newtaskName").val().trim()
                        };
                        self.mainDealObj.checkPlanName(sData, function(nameFlag) {
                            // 检测计划名称是否重复
                            if (!nameFlag && jQuery('#newtaskName').val().length) {
                                notify.warn('计划名称重复');
                                return;
                            }

                            var that = $(this),
                                disabled = that.attr("data-disabled");

                            if (disabled === "disabled") {
                                notify.warn('计划正在提交，请稍等！');
                                return false;
                            }

                            self.planSubmit(false, $(this), false, cameraTree, 'add');

                            return false;
                        });
                    });

                    //初始化日期工具条
                    jQuery(document).on('focus', '#newtaskTime', function(e) {
                        e.stopPropagation();
                        var self = this;
                        jQuery(this).datetimepicker({
                            showSecond: true,
                            timeOnly: true,
                            timeFormat: 'HH:mm:ss',
                            timeText: '',
                            hourText: '时',
                            minuteText: '分',
                            secondText: '秒',
                            showAnim: '',
                            minDateTime:new Date()
                        });
                    });

                });
            });

            //新建计划 返回
            $("#sidebar").on("click", ".back-plan", function() {
                jQuery('.header .plan').trigger('click');
                return false;
            });

            // 返回
            $("#sidebar").on("click", ".back-home", function() {
                $(".new-plan").hide().siblings().show();
            });


            // 配置计划 设置
            $("#plan").on("click", ".configplan", function() {
                var id = $(this).attr("task-id");

                $.when(self.loadTpl("maintenance_newplan"), self.loadData("get_task_plan?id=" + id)).done(function(html, data) {
                    var html = self.render("maintenance_newplan", {
                            EditPlan: true
                        }),
                        htm = html.replace("back-home", "back-plan"),
                        htmlt,
                        htmls;

                    htmlt = $(htm);

                    htmls = (htmlt[2] || htmlt[1]).innerHTML;
                    $(".new-plan").html(htmls).show().siblings().hide();
                    //新增渲染页面数据
                    if (data.code === 200) {
                        var taskName = data.data.taskPlan.taskName;
                        $("#newtaskName").val(taskName);
                        var time = data.data.taskPlan.planDate;
                        var strTime = Toolkit.mills2datetime(time).substring(11);
                        $("#newtaskTime").val(strTime);

                        var frequency = data.data.taskPlan.frequency,
                            param = data.data.taskPlan.param,
                            plandate = $("#plandate");
                        if (frequency === 1) {
                            jQuery("#newplanfrequency").val(frequency);
                        }
                        if (frequency === 2) {
                            $.when(self.loadTpl("option_day")).done(function(html) {
                                html = $(html).find("#taskDate").val(param).end();
                                plandate.html(html)
                            });
                            plandate.show();
                            jQuery("#newplanfrequency").val(frequency);
                            jQuery("#taskDate").val(param);

                        }
                        if (frequency === 3) {
                            $.when(self.loadTpl("option_date")).done(function(html) {
                                html = $(html).find("#taskDate").val(param).end();
                                plandate.html(html)
                            });
                            plandate.show();
                            jQuery("#newplanfrequency").val(frequency);
                            jQuery("#taskDate").val(param);
                        }


                    }
                    // 执行树形菜单
                    var cameraTree = null;
                    cameraTree = new CameraTree({
                        node: $(".cameras-list .treePanel"),
                        nodeHeight: jQuery('#treePanel .viewport').css('height', jQuery("#treePanel").height() - (40 + 70 + 70 + 65)),
                        selectable: true,
                        mode: "edit",
                        defaultOrgs: data.data.taskorgids,
                        defaultCameras: self.modifyCamerasId(data.data.taskPlan.cameras)
                    });

                    /**
                     * @description 默认树形展开一级
                     * */
                    self.autoExpandFirstTree();

                    // 更新滚动条
                    scrollBar.init();

                    // 配置计划 设置提交
                    jQuery(document).off("click", "#configplansubmit");
                    jQuery(document).on("click", "#configplansubmit", function() {
                        var sData = {
                            'taskPlanId': id,
                            'taskPlanName': jQuery("#newtaskName").val().trim()
                        };
                        self.mainDealObj.checkPlanName(sData, function(nameFlag) {
                            // 检测计划名称是否重复
                            if (!nameFlag && jQuery('#newtaskName').val().length) {
                                notify.warn('计划名称重复');
                                return;
                            }

                            disabled = $(this).attr("data-disabled");
                            if (disabled === "disabled") {
                                notify.warn('计划正在提交，请稍等！');
                                return false;
                            }

                            self.planSubmit(true, $(this), id, cameraTree);
                            return false;
                        });
                    });
                    //初始化日期工具条
                    jQuery(document).on('focus', '#newtaskTime', function(e) {
                        e.stopPropagation();
                        var self = this;
                        jQuery(this).datetimepicker({
                            showSecond: true,
                            timeOnly: true,
                            timeFormat: 'HH:mm:ss',
                            timeText: '',
                            hourText: '时',
                            minuteText: '分',
                            secondText: '秒',
                            showAnim: '',
                            minDateTime:new Date()
                        });
                    });

                });


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
                    html = $.when(self.loadTpl("option_day")).done(function(html) {
                        plandate.html(html)
                    });
                    plandate.show();
                    return false;
                }
                if (val == 3) {
                    html = $.when(self.loadTpl("option_date")).done(function(html) {
                        plandate.html(html)
                    });
                    plandate.show();
                    return false;
                }
            })


            /*删除计划*/
            jQuery('#plan').on('click', '.delete', function() {
                var taskId = jQuery(this).attr('task-id').trim(),
                    that = $(this);

                new ConfirmDialog({
                    title: '警告',
                    width: 640,
                    message: "您确定要删除此计划吗？",
                    callback: function() {
                        jQuery.post("/service/check/delete_task_plan", {
                            "id": taskId
                        }, function(data, xhr, textStatus) {

                            if (textStatus && textStatus.status === 302) {
                                that.modifyLogonStatus();
                                return false;
                            }

                            if (data && data.code === 200) {
                                notify.success('删除成功！', {
                                    timeout: '1000'
                                });
                                jQuery('.task-tab .active').trigger('click');
                                //self.redrawMytaskAndPages('remove');
                                that.closest(".groups").remove();
                                logDict.insertLog('m2','f14','o3','b20',that.attr("task-name")); // 删除日志
                            } else {
                                notify.error('删除失败,请重试！', {
                                    timeout: '1000'
                                });
                            }
                        }, "json");
                    }
                });
                return false;
            });

            /**点击计划查看详情**/
            jQuery(document).on("click", ".group-item", function() {
                jQuery('#allStatus option:first').prop('selected',true);                
                jQuery('#camName, #inspectionTime').val("");
                jQuery(this).addClass('active').siblings('.group-item').removeClass('active')
                var planId = jQuery(this).find('.item-footer a').attr('task-id');
                self.mainDealObj.getInspectPlanInfo(planId);
            });

            /**新建巡检任务**/
            jQuery(document).on("click", "#task .newtask", function() {
                jQuery("#listPanel").hide();
                self.mainDealObj.setTaskPanel()
             
            });
            /**巡检任务新建返回**/
            jQuery(document).on("click", ".inspctDetailPanel #returnBackToInspect", function() {
                _g.confirmDialog("正在编辑，是否放弃此次编辑内容？", function() {
                    jQuery("#listPanel").show();
                    jQuery(".inspctDetailPanel").hide();
                });

            });

            /**巡检任务重名校验**/
            jQuery(document).on("change", ".taskNameSet", function() {
                var sData = {
                    'name': jQuery(this).val().trim(),
                    'flag': 2 //flag :1为定时巡检.2为实时巡检
                };
                self.mainDealObj.checkName(sData);
            });

            /**巡检任务保存**/
            jQuery(document).on("click", ".inspctDetailPanel #RuleDetailSave", function() {
                if (!self.mainDealObj.taskNameCheck && jQuery('.taskNameSet').val().length) {
                    notify.warn('任务名称重复');
                    return;
                }                
                var taskName = jQuery(this).closest('.inspctDetailPanel').find(".taskNameSet").val(),
                    orgids = [];
                jQuery(".treePanel").find("li.tree").each(function(index, item) {
                    var isChecked = jQuery(item).children("i.checkbox.selected").length,
                        parentTreeLevel = jQuery(item).attr("data-tree-level") - 1,
                        parentLi = jQuery(item).closest("li.tree[data-tree-level=" + parentTreeLevel + "]");
                    if (!isChecked) {
                        return;
                    }
                    if (!parentLi.length) {
                        orgids.push(jQuery(item).attr("data-id"));
                        return;
                    }
                    if (!parentLi.children("i.checkbox.selected").length) {
                        orgids.push(jQuery(item).attr("data-id"))
                    }
                });
                var params = {
                    orgs: orgids.join(","),
                    name: taskName
                }
                if (_g.checkForm(params)) {
                    self.mainDealObj.saveTaskAndDeal(params);
                }

            });

            /**点击查看截图**/
            jQuery(document).on('click', '.img-view', function() {
                var dataSrc = jQuery(this).attr('data-src'),
                    imgPath = dataSrc.substring(dataSrc.indexOf("?filePath=") + 10),
                    imgData;
                //console.log("dataSrc:",dataSrc,",imgPath:",imgPath);
                if (!imgPath) {
                    notify.warn("视频丢失，无法获取图片");
                    return;
                }

                imgData = {
                    showRightDetailInfo: false,
                    baseInfo: {
                        filePath: dataSrc, // 图片路径
                        fileName: jQuery(this).closest('tr').find('td:first').text()
                    }
                }

                POPIMG.initial(imgData);
            });

            /**巡检摄像机搜索**/
            jQuery(document).on('click', '.search-btn', function() {
                if (jQuery('.task-tab .active').index() === 0) { // 搜索任务列表
                    var taskId = jQuery('.taskitem.active').attr('data-taskid'),
                        camName = jQuery('#camName').val(),
                        camStatus = jQuery('#allStatus').val();
                    if (jQuery(".cameraPanel").is(":visible")) {
                        exportType = jQuery("#cameraStatus").val() === "1" ? "online" : "offline";
                    } else {
                        exportType = "";
                    }
                    self.mainDealObj.getInspectTaskInfo(taskId, camName, exportType ,camStatus);
                } else { // 搜索计划列表
                    var planId = jQuery('.group-item.active').find('.item-footer a').attr('task-id'),
                        sCondition = {
                            camName: jQuery('#camName').val(),
                            camStatus: jQuery('#allStatus').val(),
                        },
                        inspectionDate;
                    if (jQuery('#inspectionTime').val()) {
                        inspectionDate = jQuery('#inspectionTime').val();
                        sCondition.camStartTime = new Date(inspectionDate + ' 00:00:00').getTime().toString();
                        sCondition.camEndTime = new Date(inspectionDate + ' 23:59:59').getTime().toString();
                    }
                    if(jQuery(".cameraPanel").is(":visible")){
                        sCondition.exportType = jQuery("#cameraStatus").val()==="1"?"online":"offline" || "";
                    }else{
                        sCondition.exportType = ""
                    }
                    self.mainDealObj.getInspectPlanInfo(planId, sCondition);
                }

            });
            jQuery(document).on('change', '#allStatus', function(e) {
                var selectMode = jQuery(this).val();
                if(selectMode===2 || selectMode==="2"){
                    jQuery("#mainCount").find(".cameraPanel").removeClass("hidden");
                }else{
                    jQuery("#mainCount").find(".cameraPanel").addClass('hidden');
                }
            });
            /**导出计划**/
            jQuery(document).on("click", ".export-all[data-type='myext']", function() {
                var planId = jQuery('.group-item.active').find('.item-footer a').attr('task-id'),
                sCondition = {
                    camName: jQuery('#camName').val() || "",
                    camStatus: jQuery('#allStatus').val() || "",
                    title: "配置巡检计划结果",
                    fileName: "配置巡检计划结果"
                };
                if (jQuery(".cameraPanel").is(":visible")) {
                    sCondition.exportType = jQuery("#cameraStatus").val() === "1" ? "online" : "offline";
                } else {
                    sCondition.exportType = ""
                }
                sCondition.camStartTime = jQuery('#inspectionTime').val() ? new Date(jQuery('#inspectionTime').val() + ' 00:00:00').getTime().toString() : "";
                sCondition.camEndTime = jQuery('#inspectionTime').val() ? new Date(jQuery('#inspectionTime').val() + ' 23:59:59').getTime().toString() : "";
                console.log(sCondition.exportType) 
                self.mainDealObj.getInspectPlanExport(planId, sCondition);
            });



            /**删除巡检任务**/
            jQuery(document).on("click", "#onlineBox .taskitem .cls", function(e) {
                e.stopPropagation();
                var taskId = jQuery(this).closest('li').attr("data-taskid"),
                    taskName = jQuery(this).siblings('span.taskTitle').text();
                _g.confirmDialog("确定要删除该任务吗？", function() {
                    self.mainDealObj.deleteTask(taskId,taskName);
                });
            });
            /**巡检任务列表点击**/
            jQuery(document).on("click", "#onlineBox li.taskitem", function(e) {
               // e.stopPropagation();
                jQuery('#allStatus option:first').prop('selected',true);
                jQuery('#camName, #inspectionTime').val("");
                jQuery(this).addClass("active").siblings().removeClass("active");
                if(jQuery(".cameraPanel").is(":visible")){
                   jQuery(".cameraPanel").addClass("hidden");
                }
                //导出按钮可用
                jQuery("#mainCount .btnTools").find("button").removeAttr("disabled").removeClass("disabled");
                var taskId = jQuery(this).closest('li').attr("data-taskid");
                self.mainDealObj.getInspectTaskInfo(taskId);
                self.mainDealObj.loadAgin(taskId);
            });
            /**巡检任务模糊搜索**/
            jQuery(document).on("keyup", "#taskSearchSimple", function(evt) {
                var name = jQuery(this).val();
                self.mainDealObj.loadInspectData(name, function() {
                    jQuery("#onlineBox").find("li").each(function() {
                        var status = jQuery(this).attr("data-taskStatus");
                        if (status === 2 || status === "2") {
                            var taskId = jQuery(this).attr("data-taskid");
                            self.mainDealObj.getInspectTaskInfo(taskId);
                            _g.currRunTaskid = taskId;
                            jQuery(this).addClass('active');
                            self.mainDealObj.bindStatusChange(function() {
                                self.mainDealObj.getInspectTaskInfo(taskId);
                                self.reloadStatus(true, taskId);
                            });
                        }
                    });
                });
            });
            /**巡检任务模糊搜索，屏蔽鼠标回车键功能**/
            jQuery(document).on("keydown", "#taskSearchSimple", function(evt) {
                  evt = evt || window.event;
                  var charCode = evt.which || evt.keyCode;
                  if(charCode === 13){
                     evt.stopPropagation();
                     evt.preventDefault();
                     return;
                  }
            });
            /**巡检任务重启**/
            jQuery(document).on("click", "#onlineBox .taskitem p.status", function(e) {
                e.stopPropagation();
                var taskid = jQuery(this).closest('li').attr("data-taskid");
                jQuery("#taskSearchSimple").val("");
                jQuery(this).closest('li').find(".progressBar").hide(); 
                self.mainDealObj.reloadInspectTask(taskid,jQuery(this).closest('li'));
            });
            /**巡检任务结果导出**/
            jQuery(document).on("click", "#mainCount .ex-task .button", function() {
                var params={};
                params = {
                    title: jQuery("#onlineBox").find("li.active h6>span").text(),
                    fileName: jQuery("#onlineBox").find("li.active h6>span").text() + "_" + jQuery(this).text(),
                    taskId: jQuery("#onlineBox").find("li.active").attr("data-taskid"),
                    camName: jQuery('#camName').val(),
                    camStatus: jQuery('#allStatus').val()
                };
                if (jQuery(".cameraPanel").is(":visible")) {
                    params.exportType = jQuery("#cameraStatus").val() === "1" ? "online" : "offline";
                } else {
                    params.exportType = ""
                }
                self.mainDealObj.exportExcel(params);
            });
            /**计划列表-->搜索**/
            jQuery(document).on("click", ".plan-task-list .search .searchPlan", function() {
                //触发查询
                self.redrawPlanAndPages("search");
            });
            jQuery(document).on("keyup", ".plan-task-list .search input[type='text']", function() {
                //触发查询
                self.redrawPlanAndPages("search");
            });
            jQuery(document).on("input propertychange", function(e) {
                e.stopPropagation();
                var le = jQuery(this).val().length;
                if (le > 20) {
                    notify.warn("您输入的字数过长！");
                    return false;
                }
            });

        },
        /**按钮重置**/
        reloadStatus: function(newStruct, taskid) {
            if (newStruct) {
                jQuery("#onlineBox li[data-taskid='" + taskid + "']").attr("data-taskstatus", 3);
                jQuery("#onlineBox li[data-taskid='" + taskid + "']").addClass("active").siblings().removeClass("active");
                jQuery("#onlineBox li[data-taskid='" + taskid + "']").find(".taskstatus").text("已巡检");
                jQuery("#onlineBox li[data-taskid='" + taskid + "']").find(".status").removeClass("hidden");
                jQuery("#task .newtask").removeAttr("disabled").removeClass("disabled");
                jQuery("#task .newtask").attr("title", "新建任务");
                jQuery("#onlineBox li[data-taskid='" + taskid + "']").find(".progressBar").hide();
            }
            jQuery("#mainCount .btnTools").find("button").removeAttr("disabled").removeClass("disabled");
        },

    }
    return new mainEventPort();
});

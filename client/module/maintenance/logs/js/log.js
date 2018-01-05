/*global Tree:true,*/
define(["orgnScrollbar","base.self","tree","jquery-ui-timepicker-addon","jquery.pagination","permission"],function(scrollBar){
    /**
     * 获取日志列表数据
     * @author wumengmeng
     * @date   2014-10-28
     * @param  type: 1应用日志 2设置日志 3安全日志 4系统日志
     * @param  typeName：日志名称
     * @param  template：模版缓存
     * @param  cPage：记录当前页码
     * @param  breadcrumbData：面包屑收集的数据
     * @param  logDatas：日志当页数据存储
     * @param  pageSize
     * @param  pageTotal：保存总条数
     * @param  templateUrl：模版加载路径
     * @param  paginationContain：分页容器
     * @return null
     */
    var tree = {};
    var logMgr = new new Class({
        Implements: [Options, Events],
        type: '1',
        typeName: '应用日志',
        template: null,
        cPage: 1,
        heightIndex: '0',
        orgList: {},
        isLoaded: false,
        LogData: null,
        options: {
            breadcrumbData: [],
            logDatas: {},
            pageSize: "50",
            pageTotal: null,
            templateUrl: "/module/maintenance/logs/inc/log-manager.html",
            paginationContain: '.pagination'
        },
        serviceUrl: {
            GET_LOG_LIST: "/service/log",
            EXPORT_LOGS: "/service/log/export",
            AUTO_CLEAR_LOGS: "/service/log/autoclear"
        },
        /**
         * 页面初始化
         * @author wumengmeng
         * @date   2014-10-28
         * @param  {[type]}   options [initiLoad：初始化加载日志，checkAll：全选，checkDeatils: 单选，bindLoadEvents：事件绑定]
         * @return {[type]}           [description]
         */
        initialize: function(options) {
            this.setOptions(options);
            this.initiLoad();
            this.checkAll();
            this.checkDetails();
            this.bindLoadEvents(); /*页面加载之后绑定一些事件*/

            // 加载有权限的组织id
            this.loadTreeList();

            // 左侧边栏的滚动条
            this.scrollBar();

            //this.nav();
        },
        scrollBar : function(){
            scrollBar.init(null,function(){return jQuery("#treePanel").height()-10});
        },
        /*nav : function(){
            $("#header a.item").removeClass("active");
            $("#logs").addClass("active");
        },*/
        loadTreeList: function(orgId) {
            var rootOrgId = $("#userEntry").attr("data-orgid") === "null" ? 0 : $("#userEntry").attr("data-orgid"),
                dfd = $.Deferred(),
                self = this;
            $.ajax({
                type: "get",
                dataType: "json",
                url: "/service/resource/get_org_path?orgId=" + rootOrgId,
                success: function(data) {
                    self.orgList = data;
                    dfd.resolve(data);
                },
                error: function() {
                    dfd.reject();
                }
            });
            return dfd.promise();
        },
        getDepartment: function() {
            var node = jQuery('div.breadcrumb').find('a').last();
            this.curDepartmentData = {
                name: node.text(),
                id: node.attr('data-id')
            };
        },
        /**
         * initiLoad页面初始化加载项,左侧组织资源树、时间控件、请求页面模版
         * @author wumengmeng
         * @date   2014-10-28
         * @return {[type]}   [leafClick树叶子点击事件，treeClick树点击事件，callback：树加载完成事件]
         */
        initiLoad: function() {
            var self = this;
            //rootOrgId = $("#userEntry").attr("data-orgid") === "null" ? 0 : $("#userEntry").attr("data-orgid"),
            //组织资源树
            var tree = new Tree({
                node: $("#result .treePanel"),
                nodeHeight: jQuery('#treePanel .viewport').css('height', jQuery("#treePanel").height() - 20),
                //defaultRootId : rootOrgId,
                leafClick: function(el) {
                    self.treeBindEvents(el);
                },
                treeClick: function(el) {
                    self.treeBindEvents(el);
                },
                callback: function(el) {
                    /*if (el.closest("li").hasClass("root")) {
                     el.closest("li").children("i.fold").click();
                     self.treeBindEvents(el);
                     }*/
                    if ($(tree.options.node).find("ul>li").length === 1 || $(tree.options.node).find("ul>li").length === 2) {
                        $(tree.options.node).find("ul>li.root.tree>i.fold").triggerHandler("click");
                        //var elm = $("#userEntry").attr("data-orgid") === "null" ? $(tree.options.node).find("ul>li.root.tree>i.fold") : $(tree.options.node).find("li[data-id=" + $("#userEntry").attr("data-orgid") + "] span.name");
                        //console.log(elm);
                        //self.treeBindEvents(elm);
                    }
                }
            });

            $(tree.options.node).on("treeExpandSuccess", function() {
                triggerTree();
            });

            var timer;

            function triggerTree() {
                if (self.orgList.data) {
                    if (!self.isLoad) {
                        var elm = $("#userEntry").attr("data-orgid") === "null" ? $(tree.options.node).find("ul>li.root.tree>i.fold") : $(tree.options.node).find("li[data-id=" + $("#userEntry").attr("data-orgid") + "] span.name");
                        if (elm.length > 0) {
                            self.treeBindEvents(elm);
                            self.isLoad = true;
                        }
                    }
                    timer && clearTimeout(timer);
                } else {
                    timer = setTimeout(triggerTree, 50);
                }
            }

            // 树形搜索   事件初始化一次就行了
            jQuery("#searchInput").unbind("keyup").bind("keyup", function(event) {
                if (event.keyCode === 13) {
                    jQuery("#searchBtn").click();
                    return false;
                }
            });
            //搜索
            $("#searchBtn").unbind("click").bind("click", function() {
                var key = jQuery("#searchInput").val().trim();
                tree.search({
                    queryKey: key
                });
                return false;
            });

            jQuery('.input-time').datetimepicker({ //时间控件
                showSecond: true,
                // maxDate: new Date,
                dateFormat: 'yy-mm-dd',
                timeFormat: 'HH:mm:ss',
                timeText: '',
                hourText: ' 时:',
                minuteText: ' 分:',
                secondText: ' 秒:',
                showAnim: ''
            });

            self.registerHelper();
            //请求页面模版
            $.get(self.options.templateUrl, function(tem) {
                if (tem) {
                    self.template = Handlebars.compile(tem);
                }
            });
            updateThirdNav(); // 权限控制
            //屏幕自适应
            (function() {
                var playerWidth = jQuery("#major .content").width();
                var playerHeight = parseInt(jQuery("#major .content").height(), 10) - 32 - 40 - 135;
                jQuery('.viewport-logs').width(playerWidth);
                jQuery('.viewport-logs').height(playerHeight);

                jQuery(window).resize(function(event) {
                    playerWidth = jQuery("#major .content").width();
                    playerHeight = parseInt(jQuery("#major .content").height(), 10) - 32 - 40 - 135;
                    jQuery('.viewport-logs').width(playerWidth);
                    jQuery('.viewport-logs').height(playerHeight);
                });
            })();
        },
        /**
         * registerHelper模版助手
         * @author wumengmeng
         * @date   2014-10-28
         * @return {[type]}   [description]
         */
        registerHelper: function() {
            // 奇偶行
            Handlebars.registerHelper("even", function(value) {
                if (value % 2 === 0) {
                    return " even";
                }
            });
            //时间格式化
            Handlebars.registerHelper("mills2string", function(num) {
                // 依赖base.js Toolkit
                return Toolkit.mills2datetime(num);
            });
            // 日志去除空格回车换行符等
            Handlebars.registerHelper("trimLog", function(text) {
                return text.replace(/\r|\n|\t/ig, '').replace(/\r\n/ig,'');
            });
            //日志名称显示
            Handlebars.registerHelper("logName", function(value, block) {
                switch (value) {
                    case "1":
                        return "应用日志";
                    case "2":
                        return "设置日志";
                    case "3":
                        return "安全日志";
                    case "4":
                        return "系统日志";
                }
            });
        },
        /**
         * treeBindEvents组织资源树绑定事件
         * @author wumengmeng
         * @date   2014-10-28
         * @param  {[type]}   el [description]
         * @return {[type]}      [description]
         */
        treeBindEvents: function(el) {
            var self = this,
                active = $("#stat li.active"),
                isRoot = $("#userEntry").attr("data-orgid") === "null" ? true : false,
                id = el.closest("li").attr("data-id") - 0,
                list = self.orgList || {},
                len = list && list.data && list.data.childs && list.data.childs.length || 0,
                i = 0,
                flag = true;

            for (; i < len; i++) {
                if (id === list.data.childs[i]) {
                    flag = false;
                }
            }
            if (flag && !isRoot) {
                notify.warn("没有权限查看该组织信息！");
                return false;
            }
            self.loadLogDetals(); //空白日志详情
            self.cPage = '1';
            self.options.breadcrumbData = self.breadrumb(el.closest("li"));
            self.curDepartmentData = self.options.breadcrumbData[self.options.breadcrumbData.length - 1];
            self.loadBreadcrumTpl(self.options.breadcrumbData);
            self.loadLogDatas(el);
            self.initForm($("#log-operate"));

            // 同步上来的组织 不显示设置 导出按钮，只可查看 by chencheng on 2015-3-30
            var liEl = el.closest("li"),
                isSync = false;

            if(liEl.attr("data-sync") === ''){
                isSync =  liEl.attr("data-ip") !== '' ? true : false;

            }else if (liEl.attr("data-sync") === 'true') {
                isSync = true;
            } else {
                isSync = false;
            }

            if(isSync){
                $(".group-log-operate").hide();
            }else{
                $(".group-log-operate").show();
                permission.reShow();
            }
            

            $("#fornormal input.input-time").val(""); // bug #29795 2015.01.6 liangchuang

            $(".breadcrumb .section:last").addClass("noactive");
            jQuery('.breadcrumb .noactive').html(self.typeName);
            self.cacelCheckedLogs();
        },
        /**
         * breadrumb面包屑渲染
         * @author wumengmeng
         * @date   2014-10-28
         * @param  {[type]}   $dom [description]
         * @return {[type]}        [description]
         */
        breadrumb: function($dom) {
            var location = [];
            (function(el) {
                location.push({
                    "name": el.attr("data-name"),
                    "id": el.attr("data-id")
                });
                if (el.closest("ul").closest("li").attr("data-id")) {
                    arguments.callee(el.closest("ul").closest("li"));
                }
            })($dom);
            return location.reverse();
        },
        initForm : function(obj){
            obj[0].reset();
        },
        /**
         * 统计所有日志个数
         * @author wumengmeng
         * @date   2014-10-28
         * @param  {[type]}   allLogs [description]
         * @return {[type]}           [description]
         */
        allLogs: function(allLogs) {
            jQuery('.log-nums').html(allLogs);
        },
        /**
         * 渲染模版显示
         * @author wumengmeng
         * @date   2014-10-28
         * @param  {[type]}   data [description]
         * @return {[type]}        [description]
         */
        loadBreadcrumTpl: function(data) {
            var self = this;
            var $domCont = $("#major .location");
            if (self.template) {
                $domCont.html(self.template({
                    "breadrumb": data
                }));
            }
            //面包屑点击事件
            $(".breadcrumb a.section").unbind("click").bind("click", function() {
                var id = $(this).attr("data-id") - 0,
                    list = self.orgList || {},
                    len = list && list.data && list.data.childs && list.data.childs.length || 0,
                    isRoot = $("#userEntry").attr("data-orgid") === "null" ? true : false,
                    j = 0,
                    flag = true;

                for (; j < len; j++) {
                    if (id === list.data.childs[j]) {
                        flag = false;
                    }
                }
                if (flag && !isRoot) {
                    notify.warn("没有权限查看该组织信息！");
                    return false;
                }
                self.curDepartmentData.id = id;
                for (var i = 0; i < self.options.breadcrumbData.length; i++) {
                    if (Number(self.options.breadcrumbData[i].id) === id) {
                        self.options.breadcrumbData = self.options.breadcrumbData.slice(0, i + 1);
                    }
                }

                self.loadBreadcrumTpl(self.options.breadcrumbData);
                $(".breadcrumb .section:last").addClass("noactive");
                jQuery('.breadcrumb .noactive').html(self.typeName);
                //渲染日志模版
                self.loadLogDatas($(this));
                self.cacelCheckedLogs();
            });
        },
        /**
         * 渲染日志列表
         * @author wumengmeng
         * @date   2014-10-28
         * @param  {[type]}   data [description]
         * @return {[type]}        [description]
         */
        loadLogTpl: function(data) {
            var that = this;
            var $logCont = $("#content .viewport-logs");
            if (that.template) {
                $logCont.html(that.template({
                    "logsList": data
                }));
            }
        },
        /**
         * 渲染日志详情列表
         * @author wumengmeng
         * @date   2014-10-28
         * @param  {[type]}   data [description]
         * @return {[type]}        [description]
         */
        loadLogDetals: function(data) {
            var that = this;
            var $logCont = $("#log-details .details-list");
            if (that.template) {
                $logCont.html(that.template({
                    "logDetail": data
                }));
            }
        },
        /**
         * loadDataSuccess获取日志请求成功后事件绑定
         * @author wumengmeng
         * @date   2014-10-28
         * @param  {[type]}   allLogs [description]
         * @param  {[type]}   data    [description]
         * @return {[type]}           [description]
         */
        loadDataSuccess: function(allLogs, data) {
            var self = this;
            self.loadLogTpl(data);
            self.bindEvents();
            self.options.logDatas = data;
            if (allLogs > self.options.pageSize) {
                jQuery('#pagination').show();
            }
            //清空日志详情列表
            $("#log-details .details-list").html("");
            $(".team_list dd[data-index=" + self.heightIndex + "]").trigger("click");
        },
        /**
         * 获取日志列表请求
         * @author wumengmeng
         * @date   2014-10-28
         * @param  {[type]}   dataJson [description]
         * @return {[type]}            [description]
         */
        loadLogUrl: function(dataJson) {
            var self = this,
                centerPanel = null;

            $.ajax({
                url: self.serviceUrl.GET_LOG_LIST,
                type: "get",
                data: dataJson,
                dataType: "json",
                timeout: 60000,
                cache: false,
                beforeSend:function(){
                    centerPanel = new FloatDialog({
                        "html": "正在加载日志数据，请稍候..."
                    }).show();
                },
                success: function(res) {
                    if (res && res.code === 200) {
                        var allLogs = res.data.count;
                        self.loadDataSuccess(allLogs, res.data);
                        self.allLogs(allLogs); /*显示总条数*/
                        self.LogData = res.data.logs;
                        self.cacelCheckedLogs();
                        self.setPagination(res.data.count, self.options.paginationContain, self.options.pageSize, function(nextPage) {
                            self.cPage = nextPage; /*当前页*/
                            dataJson.currentPage = self.cPage;
                            //翻页取消全选操作
                            // $(".checkall").prop("checked", false);
                            self.cacelCheckedLogs();

                            $.ajax({
                                url: self.serviceUrl.GET_LOG_LIST,
                                type: "get",
                                dataType: "json",
                                timeout: 60000,
                                data: dataJson,
                                cache: false,
                                beforeSend:function(){
                                    centerPanel = new FloatDialog({
                                        "html": "正在加载日志数据，请稍候..."
                                    }).show();
                                },
                                success: function(res) {
                                    if (res && res.code === 200) {
                                        self.loadDataSuccess(allLogs, res.data);
                                        self.cacelCheckedLogs();
                                    } else if (res.code === 500) {
                                        notify.error(res.data.message, {
                                            timeout: 1000
                                        });
                                    }
                                },
                                complete:function(){
                                    centerPanel.hide();
                                },
                                error:function() {
                                    notify.warn("请求失败，请重新再试！");
                                }
                            });
                        });
                    } else if (res && res.code === 500) {
                        notify.error(res.data.message, {
                            timeout: 1000
                        });
                    }
                },
                complete:function(){
                    centerPanel.hide();
                },
                error:function() {
                    notify.warn("请求失败，请重新再试！");
                }
            });
        },
        /**
         * 获取当前页码
         * @author wumengmeng
         * @date   2014-10-28
         * @return {[type]}   [description]
         */
        getCurrentPage: function() {
            return this.options.pageSize;
        },
        /**
         * 获取日志列表数据
         * @author wumengmeng
         * @date   2014-10-28
         * @param  type: 日志类别(1:应用日志;2:设置日志,3:安全日志,4:系统日志)
         * @param  orgId: 组织id，keyword：关键字，actionInfo：行为过滤，startTime：开始时间
         * @param  flag：根节点标识位 1：代表根节点，非根节点可不传，endTime：终止时间，currentPage：当前页码，pageSize：每页显示的记录数
         * @return null
         */
        loadLogDatas: function($dom) {
            var self = this;
            var rootId = $(".treePanel li.root").attr("data-id");
            var dataJson = {
                "type": self.type,
                "orgId": self.curDepartmentData.id,
                "keyword": '',
                "actionInfo": '',
                "startTime": '',
                "flag": "",
                "endTime": '',
                "currentPage": self.cPage,
                "pageSize": self.options.pageSize
            };
            //若是根节点多传flag:1,与管理员区别
            if ($dom.parent(".breadcrumb") && $dom.attr("data-id") === rootId) { //处理面包屑
                dataJson.flag = "1";
            } else if ($dom.closest("li").attr("data-id") === rootId) { //处理左侧树
                dataJson.flag = "1";
            } else if ($dom.parent("#stat") && $(".breadcrumb a").length === 1) { //左侧选项卡
                dataJson.flag = "1";
            }
            if(self.type === 2) {
                dataJson.actionInfo = "";
            }
            self.loadLogUrl(dataJson);
        },
        /**
         * 导出
         * @author wumengmeng
         * @date   2014-10-28
         * @param  {[type]}   id [description]
         * @return {[type]}      [description]
         */
        downloadFile: function(id) {
            $("#downloadFile").attr("src",this.serviceUrl.EXPORT_LOGS + "/" + id + '?type=' + this.type + "&_=" + new Date().getTime());
        },
        /**
         * 选中当前日志，获取对应详情信息
         * @author wumengmeng
         * @date   2014-10-28
         * @param  {[type]}   $dom [description]
         * @return {[type]}        [description]
         */
        currentLogDetail: function($dom) {
            var that = this;
            var currentId = $dom.attr("data-id"),
                logsArr = that.options.logDatas.logs,
                currentArr = {}; //收集当前点击日志信息
            for (var i = 0; i < logsArr.length; i++) {
                if (currentId === logsArr[i].id) {
                    currentArr = logsArr[i];
                    currentArr.type = that.typeName;
                }
            }
            return currentArr;
        },
        /**
         * 获取当前选中的日志
         * @author wumengmeng
         * @date   2014-10-28
         * @param  {[type]}   $dom [description]
         * @return {[type]}        [description]
         */
        currentBoxChecked: function($dom) {
            var checkedIdArr = [];
            for (var i = 0; i < $dom.length; i++) {
                if ($dom.eq(i).prop("checked")) {
                    checkedIdArr.push($dom.eq(i).closest("dd").attr("data-id"));
                }
            }
            return checkedIdArr;
        },
        /**
         * dfnIsOrhide 统计提示行显示，全选则显示选中条数
         * @author wumengmeng
         * @date   2014-10-28
         * @return {[type]}   [description]
         */
        dfnIsOrhide: function() {
            if (this.LogData.length !== 0) {
                $(".team_list .checkall").prop('checked') ? jQuery(".team_list dfn").css("display", "block") : jQuery(".team_list dfn").css("display", "none");
                this.countCheckedLogs();
            }

        },
        /**
         * 全选
         * @author wumengmeng
         * @date   2014-10-28
         * @return {[type]}   [全选框选中]
         */
        checkAll: function() {
            var that = this;
            $(".checkall").on("click", function(evt) {
                var bool = this.checked;
                $(".team_list .checkbox").prop('checked', bool);
                that.dfnIsOrhide();
            });
        },
        /**
         * 反选
         * @author wumengmeng
         * @date   2014-10-28
         * @return {[type]}   [description]
         */
        checkDetails: function() {
            var that = this;
            $("#content").on("click", ".team_list .checkbox", function() {
                if ($(".team_list .checkbox:checked").length === $(".team_list .checkbox").length) {
                    $(".checkall").prop("checked", true);
                    that.countCheckedLogs();
                } else {
                    $(".checkall").prop("checked", false);
                }
                that.dfnIsOrhide();
            });
        },
        /**
         * 分页插件调用
         * @author wumengmeng
         * @date   2014-10-28
         * @param  {[type]}   total        [description]
         * @param  {[type]}   selector     [description]
         * @param  {[type]}   itemsPerPage [description]
         * @param  {Function} callback     [description]
         */
        setPagination: function(total, selector, itemsPerPage, callback) {
            var that = this;
            $(selector).pagination(total, {
                items_per_page: itemsPerPage,
                orhide: false,
                first_loading: false,
                callback: function(pageIndex, jq) {
                    callback(pageIndex + 1);
                }
            });
        },
        /**
         * upDownEvent上一条、下一条操作
         * @author wumengmeng
         * @date   2014-10-28
         * @param  {[type]}   pos  [description]
         * @param  {[type]}   $dom [description]
         * @return {[type]}        [description]
         */
        upDownEvent: function(pos, $dom) {
            var self = this;
            var mainHeight = $(".viewport-logs").height();
            //自动更新滚动条
            $(".viewport-logs").scrollTop(($(".team_list dd.active").attr("data-index") / self.options.pageSize) * mainHeight * 3.5 * self.options.pageSize / 50);
            //当前日志
            var currentObj = $(".viewport-logs .team_list dd.active"),
                currentIndex = currentObj.index(),
                currentIndexUp = 0,
                currentIndexDown = 0;
            if (pos === 'down') {
                currentIndexDown = Number(currentIndex) + 1;
                if (Number(currentIndex) >= this.options.pageSize - 1) {
                    self.heightIndex = 0;
                    $("#pagination .current").next().trigger("click");
                } else {
                    self.heightIndex = currentIndexDown;
                    $(".team_list dd[data-index=" + currentIndexDown + "]").trigger("click");
                }
            } else {
                currentIndexUp = Number(currentIndex) - 1;
                if (Number(currentIndex) === 0 && self.cPage > 1) {
                    self.heightIndex = this.options.pageSize - 1;
                    $("#pagination .prev").trigger("click");
                    setTimeout(function() {
                        $(".viewport-logs").scrollTop(mainHeight * 3.5 * self.options.pageSize / 50);
                    }, 500);
                } else {
                    self.heightIndex = currentIndexUp;
                    $(".team_list dd[data-index=" + currentIndexUp + "]").trigger("click");
                }
            }
        },
        /**
         * bindLoadEvents左侧选项卡切换选择并绑定事件
         * @author wumengmeng
         * @date   2014-10-28
         * @return {[type]}   [description]
         */
        bindLoadEvents: function() {
            var self = this;
            jQuery('#sidebar').on('click', '#stat li', function() {
                var index = jQuery(this).index(),
                    pre   = $('#stat li.active').index(),
                    val = '',
                    $dom = jQuery("#sidebar>.header .title.result");

                self.type = index + 1;

                if(index !== pre){
                   self.initForm($("#log-operate"));
                }

                switch (self.type) {
                    case 1:
                        val = '应用日志';
                        $dom.css("background-position", "-34px 8px");
                        break;
                    case 2:
                        val = '设置日志';
                        $dom.css("background-position", "-34px -46px");
                        break;
                    case 3:
                        val = "安全日志";
                        $dom.css("background-position", "-34px -100px");
                        break;
                    default: //4
                        val = "系统日志";
                        $dom.css("background-position", "-34px -154px");
                        break;
                }
                self.cPage = '1';
                self.typeName = val;
                self.loadLogDetals(); //空白日志详情
                jQuery('.breadcrumb .noactive').html(val);
                jQuery('div.title').html(val);
                jQuery(".log-title .title-left").html(val);
                self.loadLogDatas($(this));
                if (self.type === 2) {
                    jQuery("#actionClass").prev().hide();
                    jQuery("#actionClass").hide();
                } else {
                    jQuery("#actionClass").prev().show();
                    jQuery("#actionClass").show();
                }
                self.cacelCheckedLogs();
            });
            jQuery("#fornormal input").unbind("keydown").bind("keydown", function(event) {
                if (event.keyCode === 13) {
                    $("#submitBtn").click();
                    return false;
                }
            });
            $("#submitBtn").on("click", function() {
                // console.log(new Date().format("yyyy-MM-dd hh:mm:ss"))
                var begin_time = $("#beginTime").val(), //开始时间
                    end_time   = $("#endTime").val(), //结束时间
                    valueKey   = $("#valueKey").val(), //关键字
                    actionKey  = $("#actionClass").val() === "所有行为" ? "" : $("#actionClass").val(), //$("#actionClass").val(), //行为过滤
                    timer      = Toolkit.formatDate(new Date());
                if (begin_time > timer || end_time > timer) {
                    notify.info("开始时间不能大于当前时间！", {
                        timeout: 1000
                    });
                    return;
                }

                /*if (!begin_time){
                    begin_time = "2015-01-01 00:00:01";
                }*/

                if (!end_time) {
                    end_time = timer;
                }

                if (begin_time > end_time) {
                    notify.info("开始时间不能晚于结束时间！", {
                        timeout: 1000
                    });
                    return;

                }

                self.cPage = '1';
                var dataJson = {
                    "type": self.type,
                    "orgId": self.curDepartmentData.id,
                    "keyword": valueKey,
                    "actionInfo": actionKey,
                    "startTime": begin_time, //起始时间
                    "endTime": end_time, //终止时间
                    "flag": "",
                    "currentPage": self.cPage, //当前页数
                    "pageSize": self.options.pageSize //log.getCurrentPage() //每页显示的记录数
                };
                var rootId = $(".treePanel li.root").attr("data-id");
                //若是根节点多传flag:1,与管理员区别
                if ($(".location .breadcrumb a.section:last").attr("data-id") === rootId) { //处理面包屑
                    dataJson.flag = "1";
                }
                if (self.type === 2) {
                    dataJson.actionInfo = "";
                }
                self.loadLogUrl(dataJson);
            });

            /*二级导航高亮*/
            //jQuery("#header .ui .item").eq(2).addClass("active").siblings().removeClass("active");
        },
        /**
         * countCheckedLogs统计选中的日志
         * @author wumengmeng
         * @date   2014-10-28
         * @return {[type]}   [description]
         */
        countCheckedLogs: function() {
            var $dom = jQuery(".team_list dfn");
            var $domChecked = jQuery(".team_list dd .checkbox");
            var $domIdArr = this.currentBoxChecked($domChecked);
            $dom.find("b").text($domIdArr.length);
        },
        cacelCheckedLogs: function() {
            $(".team_list .checkall").prop('checked', false);
            jQuery(".team_list dfn").css("display", "none");
        },
        /**
         * [deleteDialog 删除请求]
         * @author wumengmeng
         * @date   2014-10-28
         * @param  {[type]}   deleteType [删除类型 clearDay：手动删除，autoClear：自动删除]
         * @param  {[type]}   clearDay   [删除的天数]
         * @param  {[type]}   postData   [请求参数]
         * @return {[type]}              [description]
         */
        deleteDialog: function(deleteType, clearDay, postData) {
            var that = this;
            var deleteUrl;
            if (deleteType === "clearDay") {
                deleteUrl = that.serviceUrl.GET_LOG_LIST;
            } else if (deleteType === "autoClear") {
                deleteUrl = that.serviceUrl.AUTO_CLEAR_LOGS + "/" + clearDay;
            }
            new ConfirmDialog({
                title: '警告',
                width: 640,
                message: "您确定要删除" + clearDay + "天前的日志记录吗？",
                callback: function() {
                    $.ajax({
                        url: deleteUrl,
                        dataType: 'json',
                        data: postData,
                        type: 'post',
                        success: function(res) {
                            if (res && res.code === 200) {
                                $("#stat li.active").trigger("click");
                                notify.success(res.data.message, {
                                    timeout: 1000
                                });
                            } else {
                                notify.error(res.data.message, {
                                    timeout: 1000
                                });
                            }
                        }
                    });
                }
            });
        },
        /**
         * bindEvents事件绑定类
         * @author wumengmeng
         * @date   2014-10-28
         * @return {[type]}   [description]
         */
        bindEvents: function() {
            var that = this;
            //日至列表选中高亮
            $(".team_list dd").on("click", function(evt) {
                $(this).addClass("active").siblings().removeClass("active");
                that.loadLogDetals(that.currentLogDetail($(this)));
            });
            //上一页
            $("#log-details .forhead_log").unbind("click").bind("click", function(evt) {
                that.upDownEvent('up');
            });
            //下一页
            $("#log-details .next_log").unbind("click").bind("click", function(evt) {
                that.upDownEvent('down');
            });
            //删除日志
            $("#deleBtn").unbind("click").bind("click", function() {
                $(".deleteDiv").css("display", "block");
            });
            //关闭删除窗
            $(".deleClose .close").unbind("click").bind("click", function() {
                $(".deleteDiv").css("display", "none");
            });
            //手动删除指定时间的日志
            $(".deleCont .btn").unbind("click").bind("click", function() {
                var clearDay = $(".handclear .deleDays").val();
                if (!/^[\d]+$/.test(clearDay)) {
                    notify.warn('请输入正整数');
                    return;
                }
                var postData = {
                    "createDate": clearDay,
                    "type": that.type,
                    "_method": "delete"
                };
                if (clearDay) {
                    that.deleteDialog("clearDay", clearDay, postData);
                } else {
                    notify.warn("请先填入删除天数！", {
                        timeout: 1000
                    });
                    $(".handclear .deleDays").focus();
                }
            });
            //自动删除指定时间的日志
            $(".saveCont .btn").unbind("click").bind("click", function() {
                var autoClear = $(".content-floor .deleDays").val();

                if (!/^[\d]+$/.test(autoClear)) {
                    notify.warn('请输入正整数');
                    return;
                }
                if (autoClear) {
                    that.deleteDialog("autoClear", autoClear, {
                        type: that.type
                    });
                } else {
                    notify.warn("请先填入删除天数！", {
                        timeout: 1000
                    });
                    $(".content-floor .deleDays").focus();
                }
            });
            //导出
            $("#exportBtn").off("click");
            $("#exportBtn").on("click", function() {
                var $dom = jQuery(".team_list dd .checkbox");
                var $domIdArr = that.currentBoxChecked($dom);
                if ($domIdArr.length === 0) {
                    notify.warn("请先选择您需要导出的日志！", {
                        timeout: 1000 * 2
                    });
                    return;
                }
                that.downloadFile(that.currentBoxChecked($dom).join("-"));
            });

        }
    });
});
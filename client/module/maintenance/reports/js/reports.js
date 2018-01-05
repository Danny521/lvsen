/**
 * Created by NetPosa on 14-2-10.
 */
define(["ajaxModel","orgnScrollbar","js/examine","jquery-ui-timepicker-addon","jquery.pagination","permission","require"],function(ajaxModel,scrollBar,examine){
    jQuery(function(){
        var $ = jQuery;

        /*$("#header a.item").removeClass("active");
        $("#reports").addClass("active");*/
        setTimeout(function(){scrollBar.init(null,function(){return jQuery("#treePanel").height()-10})},0);

        var mintenance = {

            tpl   : {},  // 模板缓存

            action : "",   // 动作

            data : {},   // 数据缓存

            pageSize: 50 , // 每页默认显示 50 条。

            brokenRateStandard: 10,//故障率阈值
            
            hideTreeList : function () {
                
                 $("#treePanel .overview , #sideResize , #npplay h3").hide();
                 $("#sidebar").addClass("ishide");
                 $("#major").css("left","50px");
                 
            },
            
            showTreeList : function () {
                $("#treePanel .overview , #sideResize , #npplay h3 ").show();
                 $("#sidebar").removeClass("ishide");
                 $("#major").css("left","280px");
                 
            },

            loadTpl : function(name){
                var self = this;
                var dfd = $.Deferred();
                if(self.tpl[name]){
                    dfd.resolve(self.tpl[name]);
                    return dfd.promise();
                }
                $.ajax({
                    type:"get",
                    url : "/module/maintenance/reports/inc/" + name + ".html",
                    success : function(html){
                        self.tpl[name] = html;
                        dfd.resolve(html);
                    },
                    error:function(){
                        dfd.reject();
                    }

                });
                return dfd.promise();
            },

            loadTpl2 : function(name){
                var self = this;
                var dfd = $.Deferred();
                if(self.tpl[name]){
                    dfd.resolve(self.tpl[name]);
                    return dfd.promise();
                }
                $.ajax({
                    type:"get",
                    url : "/module/maintenance/reports/inc/" + name + ".html",
                    success : function(html){
                        self.tpl[name] = html;
                        dfd.resolve(html);
                    }

                });
                return dfd.promise();
            },

            loadData : function(name){
                var dfd = $.Deferred();
                $.ajax({
                    type:"get",
                    dataType:"json",
                    url : "/service/check/" + name,
                    success : function(data){
                        dfd.resolve(data);
                    }
                });
                return dfd.promise();
            },

            loadTreeList : function(orgId){
                var rootOrgId = $("#userEntry").attr("data-orgid") === "null" ? 0 : $("#userEntry").attr("data-orgid"),
                    dfd = $.Deferred();
                $.ajax({
                    type:"get",
                    dataType:"json",
                    url : "/service/resource/get_org_path?orgId="+1,
                    success : function(data){
                        mintenance.loadTreeListData = data;
                        dfd.resolve(data);
                    },
                    error:function(){
                        dfd.reject();
                    }
                });
                return dfd.promise();
            },

            render : function(name,data){
                return Handlebars.compile(this.tpl[name])(data);
            },

            makeUp : function(name,data,callback){
                $.when(mintenance.loadData(data),mintenance.loadTpl(name))
                    .done(function(json){
                        if(callback) {
                            callback(mintenance.render(name,json.data));
                        }
                    })
                    .fail(function(){
                        alert("获取数据失败！");
                    });
            },
            check:function(container,klass,node){
                var checkbox = $(container).find(klass);
                var checked  = $(container).find(klass+":checked");
                var checkall = $(container).find(node);
                if (checkbox.length == checked.length) {
                    checkall.prop({"checked":true});
                }else{
                    checkall.prop({"checked":false});
                }
            },
            checkAll:function(container,klass,node){
                var checkbox = $(container).find(klass);
                var checkall = $(container).find(node);
                if (checkall.is(":checked")) {
                    checkbox.prop({"checked":true});
                }else{
                    checkbox.prop({"checked":false});
                }
            }
        };
        mintenance.loadTreeList();
        //  复选框
        $("#tablechart").on("click",".checkall",function(){
            mintenance.checkAll("#tablechart",".checkbox",".checkall");
        });
        $("#tablechart").on("click",".checkbox",function(){
            mintenance.check("#tablechart",".checkbox",".checkall");
        });

        $("#resultdetail").on("click",".checkall",function(){
            mintenance.checkAll("#resultdetail",".checkbox",".checkall");
        });
        $("#resultdetail").on("click",".checkbox",function(){
            mintenance.check("#resultdetail",".checkbox",".checkall");
        });

        $("#tablebreakdown").on("click",".checkall",function(){
            mintenance.checkAll("#tablebreakdown",".checkbox",".checkall");
        });
        $("#tablebreakdown").on("click",".checkbox",function(){
            mintenance.check("#tablebreakdown",".checkbox",".checkall");
        });

        $("#startTime,#startTimebreakdown").attr("placeholder",Toolkit.getCurMonth());
        $("#endTime,#endTimebreakdown").attr("placeholder",Toolkit.getCurDate());
		//考虑到内蒙的需求，暂不需要对巡检摄像机列表单独展现巡检的三级组织机构，by zhangyu on 2015/3/17
		/*$("#tableresult .overview").on("click","tr.list td",function(){
            if($(this).attr("class") && indexOf($(this).attr("class").slice(" "),"checkboxth") < 0){
                // 09.22 上海需求修改
                $(this).parent().addClass("bg");
                $(this).parent().siblings().removeClass("bg");
                getCameraCheckedInfoById($(this));
            }

        });*/
        //查看图片
        $("#tableresult .overview").on("click",".image",function(){
            var $image = $(this);
            var id = $(this).attr("data-id"),
                remark;
            if(!id){
                return false;
            }
            $.ajax({
                url:"/service/check/records/image",
                type:"post",
                data:{
                    "id":id
                },
                success:function(data){
                    if(data && data.code === 200){
                        var url = data.data.url;
                        remark  = data.data.remark ? "备注：" + data.data.remark : "";

                        $image.attr("href",url);
                        $image.attr({"name":remark});
                        $image.addClass("thickbox");
                        window.thickbox(null,function(){
                            $("#TB_load").text("图片加载失败！").css({"color":"#FFF"});
                        });
                        $image.triggerHandler("click");
                    }else{
                        notify.warn("获取图片信息失败！");
                    }
                }
            });
            return false;
        });

        // 查看单个摄像机巡检详情
        $("#tableresult .overview").on("click","tr.list td a.checkedinfo",function(){
            getCameraAllCheckedInfo($(this));
            return false;
        });

        // 详情返回
        $("#tableresult").on("click",".back.ui.button.blue",function(){
            toggle(false);
            return false;
        });

        // 排序
        $("#resultdetail").on("click",".order.byorg",function(){
            var self   = $(this),
                order  = self.attr("data-order"),
                order1 = $(".order.bydate").attr("data-order") === 'asc' ? 1 : 0,
                order2 = order === 'asc' ? 1 : 0,
                data   = sortByOrgNameOrDate("",true,order1,order2),
                html   = mintenance.render("maintenance_inspect_result_all_checked_info",data);
            $("#resultdetail .result").html(html);
            //表格隔行变色
            changeBgbytroddAndEven($("#resultdetail"));
            // 更新小箭头
            if(order === 'asc'){
                self.attr({"data-order":'desc'});
                self.find("i").removeClass("asc").addClass("desc");
            }else{
                self.attr({"data-order":'asc'});
                self.find("i").removeClass("desc").addClass("asc");
            }
            return false;
        });
        $("#resultdetail").on("click",".order.bydate",function(){
            var self   = $(this),
                order  = self.attr("data-order"),
                order1 = $(".order.byorg").attr("data-order") === 'asc' ? 1 : 0,
                order2 = order === 'asc' ? 1 : 0,
                data   = sortByOrgNameOrDate("",false,order1,order2),
                html   = mintenance.render("maintenance_inspect_result_all_checked_info",data);
            $("#resultdetail .result").html(html);
            //表格隔行变色
            changeBgbytroddAndEven($("#resultdetail"));
            // 更新小箭头
            if(order === 'asc'){
                self.attr({"data-order":'desc'});
                self.find("i").removeClass("asc").addClass("desc");
            }else{
                self.attr({"data-order":'asc'});
                self.find("i").removeClass("desc").addClass("asc");
            }
            return false;
        });

        $("#tablechartbreakdown .overview").on("click","td",function(){
            if(!$(this).attr("class") || $(this).attr("class") && indexOf($(this).attr("class").slice(" "),"checkboxth") < 0){
                $(this).parent().addClass("bg");
                $(this).parent().siblings().removeClass("bg");
            }
        });

        // 通过摄像机ID获取此摄像机各个机构巡检的状态
        function getCameraCheckedInfoById(el){
            var cameraId = [],
                ex,
                tr,
                w,
                orgId,
                taskId,
                startTime,
                endTime,
                status;

            if(el.length < 1){
                notify.error("请选择摄像机！");
                return false;
            }

            tr = el.parent("tr");
            ex = tr.next(".orgscheckedinfo");
            w  = tr.width();
            if(ex.length>0){
                ex.remove();
                updateScollbar();
                return false;
            }

            orgId     = $("#resultorgid").val();
            taskId    = el.parent("tr").attr("task-id");
            startTime = $("#startTime").val().trim();
            endTime   = $("#endTime").val().trim();
            status    = $("#status").val();

            startTime = (startTime && startTime.indexOf("时间")<0) ? (startTime + " 00:00:00") : "";
            endTime   = (endTime && endTime.indexOf("时间")<0) ? (endTime + " 23:59:59") : "";

            for(var i=0;i<el.length;i++){
                cameraId.push(el.siblings(".checkboxth").children("input").attr("data-id"));
            }

            cameraId = el.parent("tr").attr("data-id");

            // orgId 和 taskId 现在后端没用 2014.07.07
            $.when(mintenance.loadData("records/"+ cameraId + "?startTime=" + startTime + "&endTime=" + endTime + "&status=" + status),mintenance.loadTpl("maintenance_inspect_result_allorgs")).done(function(data,html){
                if(data.code === 200 && data.data.records.length>0) {
                    tr.siblings(".orgscheckedinfo").remove();
                    tr.after(mintenance.render("maintenance_inspect_result_allorgs",data.data));
                    tr.next(".orgscheckedinfo").css({"width": w}).find("table").css({"width": w});
                    updateScollbar();
                }else{
                    notify.warn(data.data.message);
                }
            });
        }

        // 通过摄像机ID以及时间范围获取此摄像机巡检的所有记录  // 名称和厂商不可查询
        function getCameraAllCheckedInfo(el,cameraId){
            var cameraId = cameraId || el.attr("data-id"),
                t,
                status,
                cameraName,
                startTime,
                cameraCode,
                endTime;

            startTime  = $.trim($("#startTime").val());
            endTime    = $.trim($("#endTime").val());
            status     = $.trim($("#status").val());
            cameraName = el.parent("td").siblings(".cameraName").text();
            cameraCode = el.parent("td").siblings(".cameraCode").text();

            startTime = (startTime && startTime.indexOf("时间")<0) ? (startTime + " 00:00:00") : "";
            endTime   = (endTime && endTime.indexOf("时间")<0) ? (endTime + " 23:59:59") : "";

            $.when(mintenance.loadData("records/history/"+ cameraId +"?startTime=" + startTime + "&endTime=" + endTime + "&status=" + status),mintenance.loadTpl("maintenance_inspect_result_all_checked_info")).done(function(data,html){
                t = $("#resultdetail");
                t.find(".result").html(mintenance.render("maintenance_inspect_result_all_checked_info",data.data));
                toggle(true);
                updateScollbar(t,1);
                $("#resultdetail input.checkall").prop({"checked":false});
                mintenance.data.checkedInfo = data.data;
                //表格隔行变色
                changeBgbytroddAndEven(t);
                $("#resultcameraid").val(cameraId);
                $("#exportresult").attr("data-camera-name",(cameraCode ? cameraName + "(" + cameraCode + ")" : cameraName));
            });
        }

        // 单个摄像机巡检详情的图表
        function eChartsForCheckedInfo(data){
            var myChart = echarts.init(document.getElementById('chart'));
        }

        // 按组织名称和巡检时间排序
        function sortByOrgNameOrDate(data,by,order1,order2){
            var record = data || mintenance.data.checkedInfo.records;
            if(by){
                record.sort(sortBy("orgId",sortBy("inspectDate","",order1),order2));
            }else{
                record.sort(sortBy("inspectDate",sortBy("orgId","",order1),order2));
            }
            return {records:record};
        }

        function sortBy(name, minor,order) {
            return function(o, p) {
                var a, b;
                if (o && p && typeof o === 'object' && typeof p === 'object') {
                    a = o[name];
                    b = p[name];
                    if (a === b) {
                        return typeof minor === 'function' ? minor(o, p) : 0;
                    }
                    if (typeof a === typeof b) {
                        if(order){
                            return a < b ? 1 : -1;
                        }
                        return a < b ? -1 : 1;
                    }
                    return typeof a < typeof b ? -1 : 1;
                } else {
                    throw ("error");
                }
            };
        }


        //加载摄像机类型统计
        function makeTableAndChartsForCameraStat(el){

            var li,steps,id,url,data;
            if(el){

                li    = el.closest("li"),// 面包屑
                    steps = step(li),// 获取面包屑数据
                    id    = el.parent("li").attr("data-id"),
                    url   = "camera/count?orgId="+id,
                    text  = "此组织没有摄像机！";

                makeBread(steps);

            }else{

                data  = $("#searchboxbreakdown").serialize(),
                    url   = "camera/count?orgId="+id,
                    text  = "未搜索到符合条件的摄像机！";
            }
            $("#tablecameraStat .result").html("<ul id='loading'><li><div class='no-data'><i class='loading-img'/></i>正在统计，请稍后。。。</div></li></ul>");
            $.when(mintenance.loadTpl2("maintenance_inspect_cameraStat"),mintenance.loadTpl2("maintenance_inspect_cameraSum"),mintenance.loadData(url)).done(function(html,html2,data){
                if(!data || !data.data || data.code !== 200){
                    notify.error("未获取到可用的数据！");
                    return false;
                }
                if(data.data.statisticsInfos.length<=0){
                    notify.error(text);
                    $("#tablecameraStat .result").html(text);
                    return false;
                }
                $("#tablechartcameraStat .viewport").height($(window).height() - 100);
                $("#searchcameraStat").show();
                var sumCam={
                    orgName:"总计",
                    totalCnt:0,
                    hdCnt:0,
                    sdCnt:0,
                    ptzAbleCnt:0,
                    ptzUnableCnt:0
                };
                for(var i=0; i<data.data.statisticsInfos.length; i++){
                    sumCam.totalCnt += data.data.statisticsInfos[i].totalCnt;
                    sumCam.hdCnt += data.data.statisticsInfos[i].hdCnt;
                    sumCam.sdCnt += data.data.statisticsInfos[i].sdCnt;
                    sumCam.ptzAbleCnt += data.data.statisticsInfos[i].ptzAbleCnt;
                    sumCam.ptzUnableCnt += data.data.statisticsInfos[i].ptzUnableCnt;
                }
                $("#tablecameraStat .result").html(mintenance.render("maintenance_inspect_cameraStat",data.data));
                $("#tablecameraStat #sumCamera").html(mintenance.render("maintenance_inspect_cameraSum",sumCam));
                $("#searchboxcameraStat,#tablechartcameraStat .head").show();
                $("input.checkall").prop({"checked":false});

                setTimeout(function(){
                    var $view = $("#tablecameraStat");
                    if($view.data("tinyscrollbar")){
                        $view.tinyscrollbar_update('relative');
                    }else{
                        $view.data({"tinyscrollbar":true});
                        $view.tinyscrollbar({
                            thumbSize: 36
                        });
                    }
                },500);
                //表格隔行变色
                changeBgbytroddAndEven($("#tablecameraStat"));                
            })
        }


        // 单个摄像机详情和统计信息切换
        function toggle(isShow){
            if(isShow){
                $("#resultdetail, .back").show();
                $("#mfs,span.cameraName").hide();
            }else{
                $("#resultdetail, .back").hide();
                $("#mfs,span.cameraName").show();
                $("#resultcameraid").val("");
                $("#exportresult").attr("data-camera-name","");
            }
        }

        var tree = {
            leftTree: null
        };
        var onceClickCameraStat = false;//点击摄像机类型统计时只加载一次根组织的数据
        var onceClickBreakdown = false;
        var onceClickResult = false;
        // 统计结果切换
        $("#stat").on("click","li",function(e){
            var className = e.target.className;
            var resultdetail;
            if(className.indexOf("result") !== -1){                
               // $("#tablecameraStat , #tablebreakdown , #tabexamine").removeClass("active");
               // $("#tableresult").addClass("active");
               // $("#sidebar .header .title").text("巡检结果查询");
               // $("#sidebar .header .title").addClass("result").removeClass("breakdown").removeClass("cameraStat");
               // mintenance.showTreeList();
                //resultdetail = $("#resultdetail:visible");
                if(resultdetail.length>0){
                    toggle(false);
                }
            }
            else if(className.indexOf("examine") != -1){
                $("#tableresult , #tablecameraStat , #tablebreakdown").removeClass("active");
                $("#tabexamine").addClass("active");
                $("#sidebar .header .title").text("视频考核");               
               $("#sidebar .header .title").addClass("result").removeClass("breakdown").removeClass("cameraStat");
                examine.loadArr = [true, false, false];
                examine.monthOld = "";
		        examine.weekOld = "";
                examine.load();
                mintenance.hideTreeList();
            }
            else if(className.indexOf("breakdown") != -1){
                $("#tableresult ,  #tablecameraStat , #tabexamine").removeClass("active");
               mintenance.showTreeList();
                $("#tablebreakdown").addClass("active");
                $("#sidebar .header .title").text("故障率统计");
                $("#sidebar .header .title").addClass("breakdown").removeClass("result").removeClass("cameraStat");
                doNextTrigger();
            }else if(className.indexOf("cameraStat") != -1){
                $("#tableresult , #tablebreakdown , #tablebreakdown").removeClass("active");
               mintenance.showTreeList();
                $("#tablecameraStat").addClass("active");
                $("#sidebar .header .title").text("摄像机类别统计");
                $("#sidebar .header .title").addClass("cameraStat").removeClass("result").removeClass("breakdown");
                doNextTrigger();
               
            }
            function doNextTrigger(){
                setTimeout(function(){                   
                   var rootId = $("#userEntry").attr("data-orgid") === "null" ? $(".ui.tab.result .treePanel li").attr("data-id") : $("#userEntry").attr("data-orgid");
                   $("#treePanel li[data-id='" + 1 + "']>span").trigger("click");
                    onceClickCameraStat = true;
                },200);
                setTimeout(function() {
                    if (!onceClickCameraStat) {
                        var rootId = $("#userEntry").attr("data-orgid") === "null" ? $(".ui.tab.result .treePanel li").attr("data-id") : $("#userEntry").attr("data-orgid");
                        $(".ui.tab.result .treePanel li[data-id='" + 1 + "']>span").trigger("click");
                        onceClickCameraStat = true;
                    }
                }, 500);
                
            }
        });
       $("#stat li:first").trigger("click");
       setTimeout(function(){                   
                   if(!onceClickBreakdown){
                       //var rootId = $(".ui.tab.result .treePanel li").attr("data-id");
                       var rootId = $("#userEntry").attr("data-orgid") === "null" ? $(".ui.tab.result .treePanel li").attr("data-id") : $("#userEntry").attr("data-orgid");
                       $("#treePanel li[data-id='" + rootId + "']>span").trigger("click");
                       onceClickBreakdown = true;
                   }
               },200);
    

        $.when(mintenance.loadTpl("maintenance_inspect_result_options"),$.getJSON("/service/config/all_manufacturer")).done(function(html,data){
            $("#mfs").html("厂商："+mintenance.render("maintenance_inspect_result_options",data[0].data));
        });

        var rootOrgId = $("#userEntry").attr("data-orgid") === "null" ? true : false;

        tree = new Tree({
                node:$("#result .treePanel"),
                nodeHeight:jQuery('#treePanel .viewport').css('height', jQuery("#treePanel").height() - 100),
                //defaultRootId : rootOrgId,
                leafClick:function(el){
                    var active = $("#stat li.active"),
                        id     = el.closest("li").attr("data-id") - 0,
                        list   = mintenance.loadTreeListData || {},
                        len    = list && list.data && list.data.childs && list.data.childs.length || 0,
                        i      = 0,
                        flag   = true;

                    for(;i<len;i++){
                        if(id === list.data.childs[i]){
                            flag = false;
                        }
                    }
                    if(flag && !rootOrgId){
                        notify.warn("没有权限查看该组织信息！");
                        return false;
                    }
                    $("#resultorgid").val(id);
                    $("#exportresult,#exportbreakdown,#exportcameraStat").attr("data-org-name",el.text());
                    if(indexOf(active.attr("class"),"result") > -1){
                        makeTableAndCharts(0,el,pagination);
                    }else if(indexOf(active.attr("class"),"breakdown") > -1){
                        makeTableAndChartsForBreakDown(el);
                    }else if(indexOf(active.attr("class"),"cameraStat") > -1){
                        makeTableAndChartsForCameraStat(el);
                    }
                },
                treeClick:function(el){
                    var active = $("#stat li.active"),
                        id     = el.closest("li").attr("data-id") - 0,
                        list   = mintenance.loadTreeListData || {},
                        len    = list && list.data && list.data.childs && list.data.childs.length || 0,
                        i      = 0,
                        flag   = true;

                    for(;i<len;i++){
                        if(id === list.data.childs[i]){
                            flag = false;
                        }
                    }
                    if(flag && !rootOrgId){
                        notify.warn("没有权限查看该组织信息！");
                        return false;
                    }
                    $("#resultorgid").val(id);
                    $("#exportresult,#exportbreakdown,#exportcameraStat").attr("data-org-name",el.text());
                    if(indexOf(active.attr("class"),"result") > -1){
                        makeTableAndCharts(0,el,pagination);
                    }else if(indexOf(active.attr("class"),"breakdown") > -1){
                        makeTableAndChartsForBreakDown(el);
                    }else if(indexOf(active.attr("class"),"cameraStat") > -1){
                        makeTableAndChartsForCameraStat(el);
                    }
                }
            });

        $(tree.options.node).on("treeExpandSuccess",function(){
            if($(this).find("ul>li").length === 1 || $(this).find("ul>li").length === 2){
                $(this).find("ul>li.root.tree>i.fold").triggerHandler("click");
            }
        });

        // 搜索以及树形点击调用 填充 右侧表格及图表函数(2014.09.24 修改后取消图表功能)
        function makeTableAndCharts(index,el,pagination){

            var li,steps,id,url,data,text,tmp = "";

            $("#resultcameraid").val(); // 清空摄像机ID
            toggle(false);

            if(el){

                li    = el.closest("li"); // 面包屑
                steps = step(li); // 获取面包屑数据
                id    = $("#resultorgid").val();
                url   = "records?orgId="+id + "&startTime=" + "" + "&endTime=" + "" + "&status=" + "" + "&manufacturerId=" + "" + "&cameraName=" + "" + "&currentPage=1&pageSize="+mintenance.pageSize;
                text  = "未找到符合条件的摄像机！";

                makeBread(steps);

            }else{
                data  = $("#searchbox").serializeArray();
                for(var i=0;i<data.length;i++){
                    if(data[i].name === "startTime"){
                        tmp += "&" + data[i].name + "=" + ((data[i].value && data[i].value.indexOf("时间")<0) ? data[i].value : "") + ((data[i].value && data[i].value.indexOf("时间")<0) ? " 00:00:00" : "");
                    }else if(data[i].name === "endTime"){
                        tmp += "&" + data[i].name + "=" + ((data[i].value && data[i].value.indexOf("时间")<0) ? data[i].value : "") + ((data[i].value && data[i].value.indexOf("时间")<0) ? " 23:59:59" : "");
                    }else{
                        tmp += "&" + data[i].name + "=" + encodeURIComponent((data[i].value && data[i].value.indexOf("名称")<0) ? data[i].value : "");
                    }
                    if(data[i].name === 'orgId' && !data[i].value){
                        notify.error("请先选择要查询的组织机构！");
                        return false;
                    }
                }
                url   = "records?" + tmp + "&currentPage=" + (index || 1) + "&pageSize=" + mintenance.pageSize;
                text  = "未找到符合条件的摄像机！";
            }

            $("#tableresult .result").html("<ul id='loading'><li><div class='no-data'><i class='loading-img'/></i>正在加载…</div></li></ul>");

            $.when(mintenance.loadTpl("maintenance_inspect_result"),mintenance.loadData(url)).done(function(html,data){

                if(pagination){
                    pagination(data.data.count || 0);
                }

                if(!data || !data.data || data.code !==200 || !data.data.records || data.data.records.length<=0){
                    //notify.warn("未获取到可用的数据！");
                    $("#tableresult .result").html(text);
                    updateScollbar(false,1);
                    return false;
                }

                data.data.curPage = (index===0?0:index-1) * mintenance.pageSize;
                $("#tableresult .result").html(mintenance.render("maintenance_inspect_result",data.data));

                $("#search,#tab,#tablechart .head").show();
                $("input.checkall").prop({"checked":false});

                setTimeout(function(){updateScollbar(false,1)},100);
                //表格隔行变色
                changeBgbytroddAndEven($("#tableresult"));
            }).fail(function(){
                    $("#tablebreakdown .result").html("数据或网络错误，请重试！");
                });
        }

        // 分页
        function pageCallBack(index){
            makeTableAndCharts(index+1);
        }
        function pagination(count){
            $("#pagination").pagination(count,{
                items_per_page:50,
                show_cur_all:true,
                orhide:true,
                first_loading:false,
                callback:pageCallBack
            });
        }

        function updateScollbar(obj,scrollTo){
            var $view = obj || $("#tablechart"),
                width = $(window).width() - $("#treePanel .form-panel").width();

            if($view.data("tinyscrollbar")){
                $view.tinyscrollbar_update(scrollTo||'relative');
            }else{
                $view.data({"tinyscrollbar":true});
                $view.tinyscrollbar({
                    thumbSize: 36
                });
            }

            $(".ui.table.inspectresult.head").width(width-($("#tablechart .scrollbar.disable").length>0 ? 0:9));
            $(".ui.table.resultdetail.head").width(width-($("#resultdetail .scrollbar.disable").length>0 ? 0:9));
        }

        function makeTableAndChartsForBreakDown(el){

            var li,steps,id,url,data,text;
            if(el){

                li    = el.closest("li"),// 面包屑
                steps = step(li),// 获取面包屑数据
                id    = el.parent("li").attr("data-id"),
                url   = "brokenRate?orgId="+id+"&startTime=&endTime=&",
                text  = "此组织未包含需要巡检的摄像机！";

                makeBread(steps);

            }else{
                data  = {
                    'startTime':jQuery('#startTimebreakdown').val()?jQuery('#startTimebreakdown').val() + ' 00:00:00':'',
                    'endTime':jQuery('#endTimebreakdown').val()?jQuery('#endTimebreakdown').val() + ' 23:59:59':'',
                    'orgId':jQuery('#orgidbreakdown').val()                   
                },//$("#searchboxbreakdown").serialize().replace(/.*(startTime\=[\d\-]+).*(endTime\=[\d\-]+)/,'$1 00:00:00&$2 23:59:59'),
                url   = "brokenRate?"+'startTime=' + data.startTime + '&endTime=' + data.endTime + '&orgId=' + data.orgId,
                text  = "未搜索到符合条件的摄像机！";                
            }

            $("#tablebreakdown .result").html("<ul id='loading'><li><div class='no-data'><i class='loading-img'/></i>正在加载…</div></li></ul>");

            $.when(mintenance.loadTpl("maintenance_inspect_breakdown"),mintenance.loadData(url)).done(function(html,data){

                if(!data || !data.data || data.code !== 200){
                    notify.warn("未获取到可用的数据！");
                    $("#tablebreakdown .result").html(text);
                    tablebreakdown1_echarts.xAxis[0].data = [];
                    tablebreakdown1_echarts.series = [];
                    return false;
                }
                if(data.data.infos.length<=0){
                    notify.warn(text);
                    $("#tablebreakdown .result").html(text);
                    tablebreakdown1_echarts.xAxis[0].data = [];
                    tablebreakdown1_echarts.series = [];
                    return false;
                }
                //统计
                var infos = data.data.infos;
                var statistics = {
                    "orgId": 0,
                    "orgName": "统计",
                    "camCnt": 0,
                    "selfBuildCnt": 0,
                    "markCnt": 0,
                    "deviceCorrCnt": 0,
                    "selfCheckCameraCnt": 0,
                    "selfCheckCameraBrokenCnt": 0,
                    "selfCheckCnt": 0,
                    "selfCheckBrokenCnt": 0,
                    "allCheckCameraCnt": 0,
                    "allCheckCameraBrokenCnt": 0,
                    "allCheckCnt": 0,
                    "allCheckBrokenCnt": 0
                };
                for(var i = 0; i<infos.length; i++){
                    statistics.camCnt += infos[i].camCnt;
                    statistics.selfBuildCnt += infos[i].selfBuildCnt;
                    statistics.markCnt += infos[i].markCnt;
                    statistics.deviceCorrCnt += infos[i].deviceCorrCnt;
                    statistics.selfCheckCameraCnt += infos[i].selfCheckCameraCnt;
                    statistics.selfCheckCnt += infos[i].selfCheckCnt;
                    statistics.selfCheckBrokenCnt += infos[i].selfCheckBrokenCnt;
                    statistics.allCheckCameraCnt += infos[i].allCheckCameraCnt;
                    statistics.allCheckCameraBrokenCnt += infos[i].allCheckCameraBrokenCnt;
                    statistics.allCheckCnt += infos[i].allCheckCnt;
                    statistics.allCheckBrokenCnt += infos[i].allCheckBrokenCnt;
                }
                var info = modifyBerakDownDataForEChart(data.data.infos);
                infos.push(statistics);
                $("#tablebreakdown .result").html(mintenance.render("maintenance_inspect_breakdown",data.data));
                $("#orgidbreakdown").val(li&&li.attr("data-id") || $(".treePanel .cur:last").data("id"));
                $("#searchboxbreakdown,#tablechartbreakdown .head").show();
                $("input.checkall").prop({"checked":false});

                tablebreakdown1_echarts.xAxis[0].data = info.xAxis[0].data;
                tablebreakdown1_echarts.series = info.series;
                echarts.init(document.getElementById('tablebreakdown1')).setOption(tablebreakdown1_echarts);

                setTimeout(function(){
                    var $view = $("#tablechartbreakdown");
                    if($view.data("tinyscrollbar")){
                        $view.tinyscrollbar_update('relative');
                    }else{
                        $view.data({"tinyscrollbar":true});
                        $view.tinyscrollbar({
                            thumbSize: 36
                        });
                    }
                },500);
                //表格隔行变色
                changeBgbytroddAndEven($("#tablebreakdown"));
            }).fail(function(){
                $("#tablebreakdown .result").html("数据或网络错误，请重试！");
            });
        }

        function modifyBerakDownDataForEChart(data){
            var length = data.length,
                orgName = [],
                allCheckCameraCnt = [],//巡检次数
                allCheckCameraBrokenCnt = [],//故障次数
                camCnt = [],//监控点总数
                markCnt = [];

            for(var i = 0; i<length; i++){
                orgName.push(data[i].orgName);
                allCheckCameraCnt.push(data[i].allCheckCameraCnt-data[i].allCheckCameraBrokenCnt);
                allCheckCameraBrokenCnt.push(data[i].allCheckCameraBrokenCnt);
                camCnt.push(data[i].camCnt-data[i].markCnt);
                markCnt.push(data[i].markCnt);
            }
            var xAxis = [
                {
                    type : 'category',
                    data : orgName/*['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']*/
                }
            ];
            var series = [

                {
                    name:'故障数',
                    type:'bar',
                    stack: 'inspect',
                    data:allCheckCameraBrokenCnt,/*[320, 332, 301, 334, 390, 330, 320]*/
                    itemStyle:{
                        normal:{
                            color:"#d24248"
                        }
                    }
                },
                {
                    name:'完好数',//巡检摄像机数
                    type:'bar',
                    stack: 'inspect',
                    data:allCheckCameraCnt,/*[310, 332, 301, 334, 390, 330, 320]*/

                    itemStyle:{
                        normal:{
                            color:"#f28c90"
                        }
                    }
                },
                {
                    name:'已标点数',
                    type:'bar',
                    stack: 'camera',
                    data:markCnt,/*[320, 332, 301, 334, 390, 330, 320]*/
                    itemStyle:{
                        normal:{
                            color:"#3d9cc9"
                        }
                    }
                },
                {
                    name:'未标点数',//监控点总数
                    type:'bar',
                    stack: 'camera',
                    data:camCnt,/*[320, 332, 301, 334, 390, 330, 320]*/
                    itemStyle:{
                        normal:{
                            color:"#8ecfee"
                        }
                    }
                }
            ];
            return {
                xAxis  : xAxis,
                series : series
            }
        }

        // 搜索表单提交
        $("#searchbox").submit(function(){
            var isHistory = $(".back.ui.button.blue:visible").length > 0,
                cameraId  = $("#resultcameraid").val();

            if(isHistory){
                getCameraAllCheckedInfo($(this),cameraId);
                return false;
            }
            makeTableAndCharts(0,"",pagination);
            return false;
        });
        $("#searchboxbreakdown").submit(function(){
            makeTableAndChartsForBreakDown();
            return false;
        });

        // 表格隔行变色
        function changeBgbytroddAndEven(el){
            var overview = $(el).find(".overview");
            overview.find("tr:odd").addClass("odd");
            overview.find("tr:even").addClass("even");
        }



        //设置各个元素的高度
        (function(){
            var interval;
            jQuery(window).resize(function(){
                interval && clearTimeout(interval);
                interval = setTimeout(resize,200);
            });
            function resize(){
                var WH = $(window).height(),//642px
                    availableWH = WH - 185 - 20 - 210;//227px

                // 故障率统计
                $("#tablechartbreakdown .viewport").height(availableWH+85);//availableWH - 40
                $("#tablebreakdown .tips").height(availableWH+140);//availableWH

                // 巡检结果统计
                $("#tablechart").height(WH-90);
                $("#tablechart .viewport").height(WH-166);

                // 摄像机详细巡检信息
                $("#resultdetail").height(WH-80);
                $("#resultdetail .viewport").height(WH-216);

                // 摄像机分类统计
                $("#tablechartcameraStat").height(WH-20);
                $("#tablechartcameraStat .viewport").height(WH - 20);

                updateScollbar();
                updateScollbar($("#resultdetail"));
                updateScollbar($("#tablechartbreakdown"));
            }
            resize();
        }());


        //导出 巡检结果统计
        $(".camera-area").on("click","#exportresult",function(){
            var el,data,url,name,exname,orgName;
            if($(".back.ui.button.blue:visible").length>0){
                el      = $("#resultdetail");
                data    = getSelectedCamorOrg(el,"history");
                url     = '/service/check/records/history/export';
                orgName = $(this).attr("data-org-name");
                exname  = $(this).attr("data-camera-name");
                name    = encodeURIComponent('摄像机历史巡检记录-' + exname);
            }else{
                el      = $("#tablechart");
                data    = getSelectedCamorOrg(el,"result");
                url     = '/service/check/records/export';
                orgName = $(this).attr("data-org-name");
                name    = encodeURIComponent('摄像机巡检结果统计-' + orgName);
            }

            if(!data){
                notify.warn("请选择要导出的摄像机！");
                return false;
            }
            notify.info("正在处理请稍候...",{timeout:1000});
            $.ajax({
                url:url,
                type:"post",
                data:{records:JSON.stringify(data)},
                success:function(data){
                    if(data && data.code === 200){
                        downloadFileByURI(data.data.fileName,name)
                    }else{
                        notify.warn("导出失败！");
                    }
                }
            });
            logDict.insertLog('m2','f4','o18','b21',orgName); // 导出日志
            return false;
        });

        //导出 故障率统计
        $(".camera-area").on("click","#exportbreakdown",function(){
            var el     = $("#tablebreakdown"),
                data   = getSelectedCamorOrg(el,"breakdown"),
                url    = '/service/check/brokenRate/export',
                exname = $(this).attr("data-org-name");
            if(!data){
                notify.error("请选择要导出的组织机构！");
                return false;
            }
            notify.info("正在处理请稍候...",{timeout:1000});
            $.ajax({
                url:url,
                type:"post",
                data:{records:JSON.stringify(data)},
                success:function(data){
                    if(data && data.code === 200){
                        downloadFileByURI(data.data.fileName,encodeURIComponent("故障率统计-"+exname));
                    }else{
                        notify.warn("导出失败！");
                    }
                }
            });
            logDict.insertLog('m2','f4','o18','b22',exname); // 导出日志
            return false;
        });

        // 通过返回的文件名下载文件
        function downloadFileByURI(file,Name,url){
            $("#download_frame").attr("src",url || '/service/check/export/file?fileName=' + file + "&saveName=" + encodeURIComponent(Name));
        }


        // 获取被选中的摄像机/机构
        function getSelectedCamorOrg(el,action){
            var target  = el.find("table.content").find(".checkbox:checked"),
                len     = target.length,
                records = {records:[]},
                elmData,
                tmp     = {},
                elm;

            if(target.length < 1){
                return false;
            }

            if(action === "breakdown"){
                for(var i =0;i<len;i++){
                    elm = $(target[i]);
                    elmData = elm.data();
                    tmp = {
                        orgName :elmData.orgname,
                        camCnt : elmData.camcnt,
                        markCnt : elmData.markcnt,
                        selfCheckCameraCnt : elmData.selfcheckcameracnt,
                        selfCheckCameraBrokenCnt : elmData.selfcheckcamerabrokencnt,
                        selfCheckRate : elmData.selfcheckrate,
                        markRate : elmData.markrate
                    };
                    records.records.push(tmp);
                }
                return records;
            }

            // 导出单个摄像机的巡检历史列表
            if(action === 'history') {
                for(var i= 0;i<len;i++){
                    elm = $(target[i]).parent("td");
                    tmp = {
                        //index        : elm.siblings("td.index").text(),
                        orgName        : elm.siblings("td.orgName").text(),
                        userName       : elm.siblings("td.userName").text(),
                        inspectDate    : elm.siblings("td.inspectDate").text(),
                        status         : elm.siblings("td.status").text(),
                        mode           : elm.siblings("td.mode").text(),
                        exceptionInfos : elm.siblings("td.exceptionInfos").text(),
                        remark         : elm.siblings("td.remark").text()
                    };
                    records.records.push(tmp);
                }
                return records;
            }

            // 导出某个组织下摄像机的巡检列表
            for(var i =0;i<len;i++){
                elm = $(target[i]).parent("td");
                tmp = {
                    //index          : elm.siblings("td.index").text(),
                    cameraName       : elm.siblings("td.cameraName").text(),
                    orgName          : $("#result li.cur:last").attr("data-name"),
                    manufacturerName : elm.siblings("td.manufacturerName").text(),
                    userName         : elm.siblings("td.userName").text(),
                    inspectDate      : elm.siblings("td.inspectDate").text(),
                    status           : elm.siblings("td.status").text(),
                    mode             : elm.siblings("td.mode").text(),
                    exceptionInfos   : elm.siblings("td.exceptionInfos").text(),
                    remark           : elm.siblings("td.remark").text()
                };
                records.records.push(tmp);
            }

            return records;
        }

        var tablebreakdown1_echarts = {
            tooltip : {
                //标准柱状图
                show: true,
                trigger: 'item'
            },
            legend: {
                data:['故障数','完好数','已标点数','未标点数'],
                x:"center"
            },
            grid : {
                borderWidth:0,
                borderColor:"#fff"
            },
            xAxis : [
                {
                    type : 'category',
                    data:[],
                    splitLine:{
                        show:false
                    },
                    axisLabel:{
                        textStyle:{
                            fontFamily:"微软雅黑"
                        },
                        rotate:-25
                    }
                }
            ],
            yAxis : [
                {
                    type : 'value',
                    splitLine:{
                        show:false
                    },
                    axisLabel:{
                        textStyle:{
                            fontFamily:"微软雅黑"
                        }
                    }
                }
            ],
            series : [

            ],
            color:[
                '#ff7f50', '#87cefa', '#da70d6', '#32cd32', '#6495ed',
                '#ff69b4', '#ba55d3', '#cd5c5c', '#ffa500', '#40e0d0',
                '#1e90ff', '#ff6347', '#7b68ee', '#00fa9a', '#ffd700',
                '#6b8e23', '#ff00ff', '#3cb371', '#b8860b', '#30e0e0'
            ]
        };

        // 面包屑导航事件
        function makeBread(steps) {
            var len  = steps.length,
                html = "";
            for(var i=0;i<len;i++){
                if(i<len-1){
                    html += '<a data-id="'+ steps[i].id +'">'+ steps[i].name + '</a> > ';
                }else{
                    html += steps[i].name;
                }
            }
            $(".header.hidden .title").html(html);
        }

        // 面包屑导航 绑定事件
        function bindEventForBread() {
            $("#npplay").on("click",".header.breadcrumb a",function(){
                var id = $(this).attr("data-id");
                $(".ui.tab.result .treePanel li[data-id='" + id + "']>span").trigger("click");
            });
        }

        bindEventForBread();

        //面包屑导航
        function step(element) {
            var position = [];
            (function(el) {
                position.push({
                    "name": el.attr("data-name"),
                    "id": el.attr("data-id")
                });
                //position.push(el.attr("data-name"));
                if (el.closest("ul").closest("li").attr("data-id")) {
                    arguments.callee(el.closest("ul").closest("li"));
                }
            })(element);

            return position.reverse();
        }

        //助手
        // 处理时间
        Handlebars.registerHelper('newDate', function(date){
            return date.split(".0")[0];

        });
        // 处理异常信息为空的情况
        Handlebars.registerHelper('exception', function(exceptionInfos){
            return exceptionInfos ? exceptionInfos : "无";

        });
        // 处理巡检正异常的状态
        Handlebars.registerHelper('checkedStatus', function(status){
            var text;
            switch (status){
                case 0 :
                    text = '无';
                    break;
                case 1 :
                    text = '正常';
                    break;
                case 2 :
                    text = '异常';
                    break;
                default :
                    text = '无';
                    break;
            };
            return text;
        });
        //异常状态
        Handlebars.registerHelper('badstatus', function(status){
            if(status === 2){
                return "badstatus";
            }
        });
        //故障率
        Handlebars.registerHelper("selfCheckCameraRate",function(selfCheckCameraCnt,camCnt){
            if(camCnt !== 0){
                return (selfCheckCameraCnt/camCnt*100).toFixed(2)+"%";
            }else{
                return "/";
            }
        });
        //故障率超标的样式
        Handlebars.registerHelper("redBroken",function(selfCheckCameraCnt,camCnt){
            if(camCnt !== 0){
                return (selfCheckCameraCnt/camCnt*100).toFixed(2)>mintenance.brokenRateStandard ? "redBroken":"";
            }
        });
        //标点率
        Handlebars.registerHelper("markCntRate",function(markCnt,selfBuildCnt){
            if(selfBuildCnt !== 0){
                return (markCnt/selfBuildCnt*100).toFixed(2)+"%";
            }else{
                return "/";
            }
        });
        //自检率
        Handlebars.registerHelper("deviceCorrCntRate",function(deviceCorrCnt,selfCheckCameraCnt){
            if(selfCheckCameraCnt !== 0){
                return (deviceCorrCnt/selfCheckCameraCnt).toFixed(2)*100+"%";
            }else{
                return "/";
            }
        });
        // 序号
        Handlebars.registerHelper('orderIndex', function(index,number){
            return (index - 0) + (number - 0) + 1;

        });
        // 厂商
        Handlebars.registerHelper('manufacturerName', function(manufacturerName){
            return manufacturerName ? manufacturerName : '未知';

        });
        // 巡检类型
        Handlebars.registerHelper('isAuto', function(autoStatus){
            return (autoStatus === 1 || autoStatus === 2) ? "自动" : "手动";
            
        });
        // 是否有备注信息，返回结果不同
        Handlebars.registerHelper('hasRemark', function(remark){
            return remark ? "备注：" + remark : "";

        });

        // 时间控件
        $( "#startTime").datepicker({
            changeMonth: true,
            maxDate: new Date,
            onClose: function( selectedDate ) {
                $( "#endTime" ).datepicker( "option", "minDate", selectedDate );
            }
        });
        $( "#endTime" ).datepicker({
            changeMonth: true,
            maxDate: new Date,
            onClose: function( selectedDate ) {
                $( "#startTime" ).datepicker( "option", "maxDate", selectedDate );
            }
        });
        // 时间控件
        $( "#startTimebreakdown").datepicker({
            changeMonth: true,
            maxDate: new Date,
            onClose: function( selectedDate ) {
                $( "#endTimebreakdown" ).datepicker( "option", "minDate", selectedDate );
            }
        });
        $( "#endTimebreakdown" ).datepicker({
            changeMonth: true,
            maxDate: new Date,
            onClose: function( selectedDate ) {
                $( "#startTimebreakdown" ).datepicker( "option", "maxDate", selectedDate );
            }
        });


        function indexOf(array,context){
            if(typeof Array.prototype.indexOf != "function"){
                for(var i=0;i<array.length;i++){
                    if(array[i] === context){
                        return i;
                    }
                }
                return -1;
            }else{
                return array.indexOf(context);
            }
        }



        (function(){
            var timer,
                width,
                resize = function(){
                    timer && clearTimeout(timer);
                    width = $(this).width();
                    timer = setTimeout(function(){
                        if(width<1310 && width>1200){
                            $("#search").addClass("width-1280-1310");
                        }else{
                            $("#search").removeClass("width-1280-1310");
                        }
                    },50);
                };
            resize();
            $(window).resize(resize);
        })();


        // 树形搜索
        jQuery("#searchInput").bind("keyup", function(event) {
            if (event.keyCode === 13) {
                jQuery("#searchBtn").click();
                return false;
            }
            if($(this).val().trim() === ""){
                return false;
            }
        });

        //搜索按钮点击事件
        jQuery("#searchBtn").bind("click", function(event) {
            var key = jQuery("#searchInput").val().trim();
            tree.search({
                queryKey: key
            });
            return false;

        });

        document.onselectstart = function() {
            event.returnValue = event.srcElement.type === "text";
        };


    });
});
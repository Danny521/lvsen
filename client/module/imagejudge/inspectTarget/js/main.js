require(['/require-conf.js'], function(){
    require([
        'underscore',
        'cloudTree/tool.js',
        'js/PARAM-STATUS.js',
        'js/target-view.js',
        'js/target-model.js',
        '/module/common/viewPic/viewPic.js',
        'pubsub',
        'js/my-handlebars.js',
        'base.self',
        'handlebars',
        'jquery.pagination',
        'permission',
        'scrollbar'
    ],function(_, RT, scope, view, model, viewPic, PubSub){
        var TF = new Class({
            Implements: [Options, Events],
            options: {
                templateUrl:"/module/imagejudge/inspectTarget/inc/target.html",
                template:null/*这是一个经过handlebars编译后的模版对象*/
            },
            pageNode:jQuery('#pagination'),/*(内容)分页对象*/
            leftPageNode:jQuery('#listPagination'),/*左侧列表分页Jquery对象*/
            viewPicData : [],
            preview : $('#np-preview-picture'),
            resourceName : '',
            initialize: function(options) {
                this.setOptions(options);
                this.loadTmp();
                this.subscribe();
            },
            /**
             * 事件订阅
             */
            subscribe: function() {
                var self = this;
                PubSub.subscribe("viewPicDelete", function (msg, data) {
                    self.removeTarget(data);
                });
            },
            /*
             *	加载模板
             */
            loadTmp:function(){
                var self =  this;
                jQuery.get(self.options.templateUrl,function(data){
                    self.options.template = Handlebars.compile(data);
                    self.bindEvents();
                });
            },
            /*
             *	模板渲染
             */
            render:function(data){
                return this.options.template(data);
            },
            dealStructureInfo: function (arr) {
                var self =this;
                self.getViewPicData(arr);
                return arr;
            },
            getViewPicData : function(arr){
                var self = this;
                _.map(arr,  function(item,index){
                    self.viewPicData[index] = {
                        id : item.id,
                        img: item.ctm_THUMBNAIL,
                        picture : item.ctm_THUMBNAIL,
                        resource: item.resource,
                        type: parseInt(item.structured_type),
                        startTime : self.getTargetTime(item.std_APPEAR_TIME),
                        title : item.name,
                        detail: [
                            {
                                title: '出现时刻',
                                description: self.getTargetTime(item.std_APPEAR_TIME)
                            },
                            {
                                title : '所属视图',
                                description: self.resourceName
                            },
                            {
                                title : '备注信息',
                                description: item.name
                            }
                        ]
                    };
                })
            },
            //删除目标快照
            removeTarget: function(targetInfo) {
                $.when($.ajax({
                    url: "/service/pia/StructuredInfo",
                    type: "POST",
                    moduleName: "删除结构化信息",
                    data: {
                        resource: targetInfo.resource,
                        id: targetInfo.id,
                        type: targetInfo.type,
                        _method: "DELETE"
                    }
                })).done(function() {
                    notify.success("删除成功！");
                });
            },
            /*
             *	绑定页面相关按钮事件
             */
            bindEvents: function() {
                var self = this;
                /*
                 * 把历史纪录手动保存成检索结果
                 */
                jQuery(document).on('click','#saveHistoryList',function(){
                    var $this = jQuery(this),
                        newResultName = jQuery('#newResultName'),
                        name = newResultName.val().trim();
                    /*验证是否重名*/
                    if(name === ''){
                        newResultName.focus();
                        return;
                    }
                    self.isRepeat(name,function(key,res){
                        if(key && res.data.result === 'true'){
                            //scope.tempName = name;
                            notify.info('该检索名称已经存在');
                            newResultName.val('').focus();
                            return;
                        }
                        self.saveH2R(scope.cHistoryId,name);
                    });
                });
                var target_select = jQuery(".target_select"); /*历史记录/检索记录父元素缓存*/

                // 初始化的时候加载检索历史列表
                target_select.find('em').click(function() {
                    var tab_index = target_select.find('em').index(this);
                    self.leftPageNode.html('');/*清空分页*/
                    scope.curListPage = 1;/*设置默认第一页*/
                    if (tab_index == 1) {
                        // 历史搜索记录
                        scope.curListType = 2;
                        self.getHistoryData(jQuery(".inner_cont div").eq(tab_index));
                        // 清空记录按钮
                        jQuery(".target_title a").show();
                    }
                });
                // 默认显示检索记录列表
                target_select.find('em').eq(1).click();

                /*左侧查看历史记录的详情*/
                jQuery(document).on('click','.history-details',function(){
                    var id = jQuery(this).attr('data-cat');
                    scope.cHistoryId = id;
                    scope.pageNo = 1;

                    scope.cId = id;
                    var data = {
                        np:scope.perPage,
                        p:scope.pageNo,
                        o:1
                    };
                    /*主内容区分页内容清空*/
                    self.pageNode.html('');
                    scope.pageNo = 1;
                    /*每次搜索前，初始化(目标出现时间,创建时间)排序样式*/
                    view.initOrder();
                    self.getDetails(id,data,1,jQuery(this));/*第三个参数为1,说明搜索区域需要隐藏,内容区域需要显示*/
                });
                /*清空历史记录*/
                jQuery("#clear_all_history").click(function(){
                    if(jQuery('.history_cont').find('.retrieve_list').length <= 0){
                        notify.info("没有可删除的历史记录!");
                        return ;
                    }
                    var callback = function(){
                        model.clearAllHistory('/service/pia/delete',function(key,info){
                            if(key){
                                jQuery('#h-list').trigger('click');
                                notify.info('历史记录已经清空!');
                            }else{
                                notify.info("清除失败! " + info);
                            }
                        })
                    };
                    view.makeDialog("历史记录将被清空!",callback);
                });
                /*一次性获取搜索区域dom对象*/
                var searchValue = jQuery('#searchValue'),
                    select_file_btn = jQuery('.select_file_btn'),/*资源文件*/
                    isTimeCheck = jQuery('#isTimeCheck'),
                    isResultCheck = jQuery('#isResultCheck'),
                    isResultSaved = jQuery('#isResultSaved'),
                    searchResult = jQuery('#searchResult'),/*在结果中查询*/
                    resultSaveValue = jQuery('#resultSaveValue'),/*保存结果值*/
                    doSearch = jQuery('#doSearch'),
                    toggle_search = jQuery('.toggle-search'),
                    controlBar = jQuery('.control-toggle'),
                    search_result = jQuery('.search-result'),
                    search_area = jQuery('.search_area'),
                    begin_time = jQuery('#begin_time'),
                    end_time = jQuery('#end_time'),
                    ud_start_time = jQuery('#ud_start_time'),
                    ud_end_time = jQuery('#ud_end_time');
                /* 选择云空间/视图库*/
                jQuery(document).off("click",".cloud-panel .tabselect").on("click",".cloud-panel .tabselect",function() {
                    // 1 云盘	2 视图库
                    if(scope.searchData.source === jQuery(this).attr("data-type") - 0){
                        return;
                    }
                    scope.searchData.source = jQuery(this).attr("data-type") - 0;/*记录目标来源数据*/
                    //覆盖原来选好的资源，删除已选择好的条件，显示类型，恢复原来的布局
                    if(jQuery('.sour_name .close').length > 0){
                        jQuery("#selectResult").find(".search_select").remove();
                        jQuery(".search-selections.file_type.div-type.type").show();
                        jQuery(".search-result").css("top",'245px');
                        jQuery(".search_area").css("height","215px");
                        jQuery("#timeSelect").css("border-top","none");
                        jQuery("#timeSelect").find('#begin_time,#end_time').attr('disabled','true');
                        jQuery("#timeSelect,.search-selections").find("span,label,em").addClass("disable");
                    }
                });
                /*文件类型全部（默认）*/
                scope.searchData.l = 0;
                /*资源来源默认云空间*/
                scope.searchData.source = 1;
                scope.sourceFrom = 1;
                /*默认资源id为空*/
                scope.searchData.id = '';
                /*资源类别值空*/
                scope.searchData.kind = '';
                /*关键词值空*/
                scope.searchData.clue = '';
                searchValue.val('');
                // 执行检索
                doSearch.click(function(){
                    /*初始化页码为第一页*/
                    scope.pageNo = 1;
                    /*创建时间降序（默认）*/
                    scope.searchData.o = 1;
                    scope.searchData.m = '';
                    /*要保存的检索结果名称,初始化为空值*/
                    scope.searchData.name = '';
                    /*检测检索前的必有字段*/
                    if(searchValue.val().trim() === '' /*|| isTimeCheck.prop('checked') === false*/){
                        notify.info('检索关键字不能为空');
                        searchValue.focus();
                        return;
                    }

                    if(scope.searchData.id === ''){
                        notify.info('请选择资源');
                        select_file_btn.trigger('click');
                        return;
                    }

                    if(scope.searchData.ts && scope.searchData.te){

                        if(begin_time.val().trim() > end_time.val().trim()){
                            notify.info('起始时间不能大于结束时间');
                            return;
                        }

                        scope.searchData.ts = begin_time.val().trim();
                        scope.searchData.te = end_time.val().trim();

                    }else{
                        scope.searchData.ts = "";
                        scope.searchData.te = "";
                    }

                    /*每次搜索前，初始化(目标出现时间,创建时间)排序样式*/
                    view.initOrder();
                    /*每页多少条记录(默认)*/
                    scope.searchData.np = scope.perPage;
                    /*当前页1(默认)*/
                    scope.searchData.p = scope.pageNo;
                    /*检索内容关键字*/
                    scope.searchData.clue = searchValue.val().trim().split(/\s+/).join(',');
                    scope.searchData.clue_inner = jQuery("#searchInput").val().trim().split(/\s+/).join(',');
                    if(isResultCheck.prop('checked') && searchResult.val() !== ''){
                        scope.searchData.rId = searchResult.val();
                    }else{
                        scope.searchData.rId = '';
                    }
                    var callback = function(data){
                        //点击检索按钮后，放开类型和时间的选择
                        jQuery("#timeSelect").find('#begin_time,#end_time').removeAttr('disabled');
                        jQuery("#timeSelect,.search-selections").find(".disable").removeClass();

                        if(data === 'err'){
                            jQuery('ul.contentList').html('<p style="color:#ccc">加载检索结果失败!</p>');
                        }else{
                            jQuery('.contentList').html(self.render({'contentList':{'list': self.dealStructureInfo(data.list)}}));
                            /*检索之后是否提交过searchData.name字段*/
                            if(scope.searchData.name === ''){
                                if(data.list.length > 0){
                                    /*只生成历史记录,并且有检索到结果的情况下,记录历史记录id,用户可能会执行保存到检索操作*/
                                    scope.cHistoryId = data.ids;
                                    /*隐藏掉保存将历史保存为检索的表单项*/
                                    view.unDesableSave();
                                }else{
                                    view.disableSave();
                                }
                            }else{
                                /*基于资源有新的检索名生成,这里需要刷新选项"在检索结果中检索的列表"*/
                                self.getListName(scope.searchData.id,function(key,data){
                                    if(key){
                                        jQuery('#searchResult').html(self.render({'listOptions':{'list': self.dealStructureInfo(data.list)}}));
                                    }
                                });
                                if(scope.curListType === 1){
                                    /*新的检索生成,刷新一下左侧列表*/
                                    jQuery('#j-list').trigger('click');
                                }
                                view.disableSave();
                            }
                            if(scope.curListType === 2){
                                /*当前左侧列表是在历史记录上高亮时*/
                                jQuery('#h-list').trigger('click');
                            }
                            if(isResultSaved.prop('checked')){
                                isResultSaved.trigger('click');
                                scope.searchData.name = '';
                                resultSaveValue.val('');
                            }
                            if(isResultCheck.prop('checked')){
                                isResultCheck.trigger('click');
                                scope.searchData.rId = '';
                            }
                            /*搜索结果出来后,搜索区域跟结果展示区域的界面变化*/
                            if(scope.sStatus){
                                // controlBar.hide();
                                scope.toggle_key = true;
                                toggle_search.text('展开检索条件');
                                search_area.css({'top':'0px'});
                                search_result.css({'top':'245px'}).show();
                                scope.sStatus = false;
                            }
                        }
                    };

                    /*是否选择保存检索结果*/
                    if(isResultSaved.prop('checked')){
                        var n = resultSaveValue.val().trim();
                        if(n === ''){
                            notify.info('请输入要保存的检索名称');
                            resultSaveValue.focus();
                            return;
                        }

                        self.isRepeat(n,function(key,res){
                            if(key && res.data.result === 'true'){
                                //scope.tempName = n;
                                notify.info('该检索名称已经存在');
                                resultSaveValue.val('').focus();
                                return;
                            }
                            scope.searchData.name = n;
                            self.markupContent(callback);
                        });
                    }else{
                        scope.searchData.name = '';
                        self.markupContent(callback);
                    }
                    self.resourceName = $('#selectResult .sour_name span').text();
                });

                /*click文件类型,人 ,车 ,物*/
                jQuery(document).on('click','.search-selections span',function(){
                    var $this = jQuery(this);
                    // view.toggleClass('active',$this);
                    scope.searchData.l = $this.attr('data-cat')-0;
                    if(scope.searchData.clue === '' || scope.searchData.id === '' ){
                        return;
                    }
                    doSearch.trigger('click');/*触发检索*/
                });

                //点击列表下的搜索按钮
                jQuery(document).on("click","#searchBtn",function(){
                    if(scope.searchData.clue === '' || scope.searchData.id === '' ){
                        notify.warn("请先按条件检索！");
                        return;
                    }

                    doSearch.trigger('click');/*触发检索*/
                });

                jQuery(document).on("click",".ui-datepicker-close",function(){
                    var begin = begin_time.val().trim(),
                        end = end_time.val().trim();
                    scope.searchData.ts = begin_time.val().trim();
                    scope.searchData.te = end_time.val().trim();
                    doSearch.trigger('click');/*触发检索*/

                });

                var cTreeTpl = "/module/imagejudge/inspectTarget/cloudTree/cTree.html";
                self.cTree = new RT({
                    "selectable":true,
                    "node": "#cloudTreePanel",
                    "source":1,/*同self.searchData.source*/
                    "type":3,
                    "templateUrl":cTreeTpl,
                    "scrollbarNode": "#cloudTree",
                    "callback":function(data){
                        /*因为树支持多选,所以返回的是数组*/
                        var data = data[0];
                        /*资源种类0文件夹,1视频*/
                        scope.searchData.kind = data.type;
                        scope.searchData.id = data.id;
                        /*在搜索框下显示选中的资源*/
                        view.addFileLabel(data.fileName);
                        /*更换资源后,展开搜索区*/
                        // view.toggle_up_down();
                        /*选择资源后,判断是否有关键字,从而判断按钮是否要禁掉*/
                        if(searchValue.val() !== ''){
                            doSearch.removeClass('disable-btn');
                        }
                        /*选择资源后,加载旗下之前生成过的检索列表名*/
                        self.getListName(data.id,function(key,data){
                            if(key){
                                searchResult.html(self.render({'listOptions':{'list':data.data.list}}));
                            }
                        });
                    }
                });

                jQuery(document).on("click",".select_file_btn",function(){
                    // 添加一二级导航遮罩 by songxj
                    window.top.showHideMasker("show");
                    permission.reShow();
                    if(scope.searchData.source === 1){
                        /*资源当前选项为"云空间"*/
                        self.cTree.setOptions({'source':1,'type':3}).show().reload();
                    }
                    if(scope.searchData.source === 2){
                        /*资源当前选项为"视图库"*/
                        self.cTree.setOptions({'source':2,'type':1}).show().reload();
                        //初始化选择为视图库时active
                        jQuery('.select_file_all').addClass('active').siblings().removeClass('active');
                    }
                });

                jQuery(document).on("click",".tab .tabselect",function(){
                    if(jQuery(this).attr("data-type") == 1){
                        self.cTree.setOptions({'source':1,'type':3}).show().reload();
                        jQuery(this).closest(".tab").find(".tab2").removeClass("active");
                    } else if(jQuery(this).attr("data-type") == 2){
                        self.cTree.setOptions({'source':2,'type':1}).show().reload();
                        jQuery(this).closest(".tab").find(".tab1").removeClass("active");

                    }
                    jQuery(this).addClass("active");
                });

                /*移除选中的资源*/
                jQuery(document).on('click','.choose-file .close',function(){
                    jQuery(this).parent('.choose-file').remove();
                    scope.searchData.id = '';
                    scope.searchData.kind = '';
                    doSearch.addClass('disable-btn');
                });
                /*click 目标出现时间(1:降序,2:排序)*/
                jQuery(document).on('click','#apperTime',function(){
                    if(scope.searchData.clue === '' || scope.searchData.id === '' ){
                        notify.warn("请先按条件检索！");
                        return;
                    }

                    scope.searchData.m === 2 ? scope.searchData.m = 1 : scope.searchData.m = 2;
                    view.apperTimeClick();/*icon样式变化*/
                    scope.searchData.o = '';
                    var data = {
                        np:scope.perPage,
                        p:scope.pageNo,
                        m:scope.searchData.m
                    };
                    self.getDetails(scope.cId,data);
                });
                /*click 创建时间 1,降序,2,升序*/
                jQuery(document).on('click','#buildTime',function(){
                    if(scope.searchData.clue === '' || scope.searchData.id === '' ){
                        notify.warn("请先按条件检索！");
                        return;
                    }

                    scope.searchData.o === 2 ? scope.searchData.o = 1 :scope.searchData.o = 2;
                    view.buildTimeClick();
                    scope.searchData.m = '';
                    var data = {
                        np:scope.perPage,
                        p:scope.pageNo,
                        o:scope.searchData.o
                    };
                    self.getDetails(scope.cId,data);
                });

                jQuery(document).on('click','.contentList .thumb-anchor',function(){
                    var id =$(this).data('id');
                    clearTimeout(self.timeFn);
                    self.timeFn = setTimeout(function(){
                        viewPic.init({
                            index: self.getClickTargetIndex(id),
                            data: self.viewPicData,
                            markedIsUsable: false,
                            handleIsUsable: false,
                            editTitleIsUsable: false,
                            addCluesUsable: false,
                            storeIsUsable: true,
                            downloadIsUsable: false,
                            message: {
                                deleteMessage: "viewPicDelete"
                            }
                        });
                        //隐藏导航,bug[37719], add by zhangyu, 2015.10.25
                        window.top.showHideNav("hide");
                        //显示遮罩层
                        self.preview.show(500);
                    }, 300)
                });

                //点击类型
                jQuery(".search-selections span").off("click").on("click",function(){
                    if(jQuery(this).is(".disable")){
                        notify.warn("请先进行检索操作！")
                        return ;
                    }
                    var str = jQuery(this).attr("data-cat"),
                        html="";
                    if(str=== "0"){
                        html ='<span class="search_select">类型：<span>全部</span><i class="close">&nbsp&nbsp</i></span>';
                    }else if(str=== "1"){
                        html ='<span class="search_select">类型：<span>人员</span><i class="close">&nbsp&nbsp</i></span>';
                    }else if(str=== "2"){
                        html ='<span class="search_select">类型：<span>车辆</span><i class="close" data-type="1">&nbsp&nbsp</i></span>';
                    }else if(str=== "3"){
                        html ='<span class="search_select">类型：<span>物品</span><i class="close" data-type="1">&nbsp&nbsp</i></span>';
                    }else if(str=== "4"){
                        html ='<span class="search_select">类型：<span>场景</span><i class="close" data-type="1">&nbsp&nbsp</i></span>';
                    }else if(str=== "5"){
                        html ='<span class="search_select">类型：<span>运动目标</span><i class="close" data-type="1">&nbsp&nbsp</i></span>';
                    }else if(str=== "6"){
                        html ='<span class="search_select">类型：<span>其他</span><i class="close" data-type="1">&nbsp&nbsp</i></span>';
                    }
                    jQuery("#selectResult .select-cancel").before(html);
                    jQuery(".search-selections.file_type.div-type.type").hide();
                    jQuery(".search-result").css("top",'203px');
                    jQuery(".search_area").css("height","175px");
                    jQuery("#timeSelect").css("border-top","1px dashed #e1e1e1");


                });
                //点击已选条件关闭 data-type为0：资源类型 1：选择的类型
                jQuery(document).off("click","#selectResult .search_select .close").on("click","#selectResult .search_select .close",function(){
                    jQuery(this).closest(".search_select").remove();
                    if(jQuery(this).attr("data-type") === "0"){
                        jQuery("#searchValue").val("请先选择资源");
                        jQuery("#searchValue").attr("placeholder","请先选择资源");
                        jQuery("#searchValue").val("");
                        scope.searchData.id = '';
                        scope.searchData.kind = '';
                        doSearch.addClass('disable-btn');
                        jQuery("#timeSelect").find('#begin_time,#end_time').attr('disabled','true');
                        jQuery("#timeSelect,.search-selections").find("span,label,em").addClass("disable");
                        begin_time.val("");
                        end_time.val("");
                    } else {
                        jQuery(".search-selections.file_type.div-type.type").show();
                        jQuery(".search-result").css("top",'245px');
                        jQuery(".search_area").css("height","215px");
                        jQuery("#timeSelect").css("border-top","none");
                        scope.searchData.l = 0;
                        $('#doSearch').trigger('click');
                    }
                });

                //点击全部取消按钮
                jQuery(document).off("click","#selectResult .select-cancel").on("click","#selectResult .select-cancel",function(){
                    jQuery(".search-selections.file_type.div-type.type").show();
                    jQuery(this).closest("#selectResult").find(".search_select").remove();
                    jQuery(".search-result").css("top",'245px');
                    jQuery(".search_area").css("height","215px");
                    jQuery("#timeSelect").css("border-top","none");
                    jQuery("#timeSelect").find('#begin_time,#end_time').attr('disabled','true').val("");
                    jQuery("#timeSelect,.search-selections").find("span,label,em").addClass("disable");
                    jQuery("#searchValue").val("请先选择资源");
                    jQuery("#searchValue").attr("placeholder","请先选择资源");
                    jQuery("#searchValue").val("");

                    scope.searchData.id = '';
                    scope.searchData.kind = '';
                    scope.searchData.clue = '';
                    self.pageNode.html('');
                    $('.contentList').html('');

                });
            },
            getTargetTime : function(startTime){
                var date = new Date(startTime),
                    formatLenth = Toolkit.formatLenth;
                return date.getFullYear() + '-' + formatLenth(date.getMonth() + 1) + '-' + formatLenth(date.getDate()) + ' ' + formatLenth(date.getHours()) + ':' + formatLenth(date.getMinutes()) + ':' + formatLenth(date.getSeconds());
            },
            getClickTargetIndex : function(id){
                var self =this;
                for(var i = 0; i <self.viewPicData.length; i++){
                    if(id == self.viewPicData[i].id){
                        return i;
                    }
                }
            },
            /*
             * 查看记录详情,包括点击事件升序降序,分页
             * @ id   检索/历史记录的id
             * @ data 查找需要的数据
             * @ key  1,不用重新渲染搜索部分.2,重新渲染搜索部分
             */
            getDetails:function(id,data,key,jqObj){
                /*jqObj只有点击左侧列表加载内容时会传入*/
                var self = this,
                    url = 'history/result/' + id,
                    callback = function(res){
                        if(res === 'err'){
                            view.detailFail();
                        }else{
                            var params = JSON.parse(res.params);/*params是字符串json*/
                            params.resourceName = (res.resourceName === null || res.resourceName === '') ? '未知名称' : res.resourceName;
                            self.resourceName = params.resourceName;
                            /*加载内容后用sourceFrom记录内容来源*/
                            if(params.source === 1){
                                scope.sourceFrom = 1;
                            }else{
                                scope.sourceFrom = 2;
                            }
                            /*绘制历史/检索记录内容*/
                            jQuery('.contentList').html(self.render({'contentList':{'list': self.dealStructureInfo(res.list)}}));

                            // if(jqObj && jqObj.hasClass('tasklist-detail')){
                            // 	/*如果查看的检索记录,则需要赋值两个参数从详情结果中*/
                            // 	/*左侧列表展开有检索结果,完成时间的信息,这两条信息后端从详情中返回*/
                            // 	jqObj.siblings('dd').find('.finish-time').html(self.parseDate(res.finishTime));
                            // 	jqObj.siblings('dd').find('.result-num').html(res.totalRecords + " 条数据");
                            // 	/*隐藏掉将历史保存为检索的表单项*/
                            // 	view.disableSave();
                            // }
                            /*点击了某条历史记录,并且结果不为空*/
                            if(jqObj && jqObj.hasClass('history-details')){
                                if(res.list.length > 0){
                                    view.unDesableSave();
                                }else{
                                    /*隐藏掉将历史保存为检索的表单项*/
                                    view.disableSave();
                                }
                            }
                            if(key === 1){
                                /*key===1说明事件从左侧列表触发*/
                                /*绘制历史/检索记录当时的搜索条件*/
                                if(params.l === '0'){
                                    jQuery(".search-selections.file_type.div-type.type").show();
                                    jQuery(".search-result").css("top",'245px');
                                    jQuery(".search_area").css("height","215px");
                                    jQuery("#timeSelect").css("border-top","none");
                                    jQuery("#timeSelect").find('#begin_time,#end_time').removeAttr('disabled');
                                    jQuery("#timeSelect,.search-selections").find(".disable").removeClass();
                                }else{
                                    jQuery(".search-selections.file_type.div-type.type").hide();
                                    jQuery(".search-result").css("top",'203px');
                                    jQuery(".search_area").css("height","175px");
                                    jQuery("#timeSelect").css("border-top","1px dashed #e1e1e1");
                                }
                                self.reRenderSearchArea(params);
                                jQuery('#resultSaveValue').val('');
                                scope.searchData.name = '';
                            }
                        }
                    };
                self.renderContent(url,data,callback);
            },
            reRenderSearchArea:function(params){
                /*
                 * 用户查看详情之后,把当时的搜索条件复原到记录参数的对象,然后更新视图,
                 * 如果用户再次切换了文件类型,则直接复用这里的参数
                 */
                var self = this,
                    parseData = {},
                    searchResult = jQuery('#searchResult'),
                    isResultCheck = jQuery('#isResultCheck');
                /*还原检索参数到保存参数的对象*/
                parseData.source = scope.searchData.source = params.source;/*目标来源,云,视图库*/
                parseData.clue = scope.searchData.clue = params.clue.join(' ');/*搜索关键字*/
                parseData.kind = scope.searchData.kind = params.kind;/*资源类型,案事件,视频*/
                parseData.id = scope.searchData.id = params.id;/*文件id*/
                parseData.l = scope.searchData.l = params.l;/*文件类型,全部,人,车,物*/
                parseData.te = scope.searchData.te = params.te;/*目标出现结束时间*/
                parseData.ts = scope.searchData.ts = params.ts;/*目标出现开始时间*/
                parseData.rId = scope.searchData.rId = params.rId;/*检索时依赖检索集的id*/
                parseData.resourceName = params.resourceName;/*资源文件名*/
                self.resourceName = params.resourceName;
                /*这里必须获取整个检索名称列表一次,因为列表要还原,当前选项要高亮*/
                if(parseData.source !== undefined && parseData.kind !== undefined && parseData.id !== undefined){
                    self.getListName(parseData.id,function(key,data){
                        if(key){
                            searchResult.html(self.render({'listOptions':{'list':data.data.list}}));
                            if(parseData.rId){
                                //isResultCheck.prop('checked',true).closest('.select_list').css({'color':'#000'}).find('select').css({'color':'#000'});//;
                                if(!isResultCheck.prop('checked')){
                                    isResultCheck.trigger('click');
                                }
                                searchResult.val(parseData.rId);
                            }
                        }
                    });
                }else{
                }
                /*还原搜素关键字*/
                jQuery('#searchValue').val(parseData.clue);
                /*还原资源来源*/
                jQuery('.search_type b').text(parseData.source == 2 ? "视图库" : "云空间");
                /*如果有目标起始时间段*/
                if(parseData.te !== '' && parseData.ts !== ''){
                    /*还原目标出现范围开始时间*/
                    jQuery('#begin_time').val(parseData.ts);
                    /*还原目标出现范围结束时间*/
                    jQuery('#end_time').val(parseData.te);
                    /*选中目标出现范围复选框*/
                }else{
                    jQuery('#begin_time').val('');
                    jQuery('#end_time').val('');
                }
                /*还原资源展示*/
                self.resourceName = parseData.resourceName;
                view.addFileLabel(parseData.resourceName,parseData.l);
                /*让检索按钮显示可用样式*/
                jQuery('#doSearch').removeClass('disable-btn');
            },

            renderList:function(url,callback,data){
                /*加载左侧列表*/
                var self = this,
                    loadPar = scope.curListType === 1 ? jQuery('.retrieve_cont') : jQuery('.history_cont'),
                    obj = {};
                obj.np = scope.listPerPage;
                obj.p = scope.curListPage;
                model.loadData(url, obj, 'get', loadPar).then(function(res){
                    if(res && res.code === 200){
                        var PageCallBack = function(index) {
                            scope.curListPage = index + 1;
                            self.renderList(url,callback,res.data);
                        };
                        if(callback){
                            callback(res.data);
                        }
                        /*绘制分页*/
                        if (self.leftPageNode.html() === '') {
                            self.leftPageNode.pagination(res.data.totalRecords, {
                                'items_per_page': scope.listPerPage,
                                'first_loading':false,
                                'num_display_entries': 2,
                                'num_edge_entries': 0,
                                'callback': PageCallBack
                            });
                        }
                    }else{
                        notify.info('请求出错！错误码:' + res.code);
                        if(callback){
                            callback('err');
                        }
                    }
                },function(res){
                    if(callback){
                        callback('err');
                    }
                    notify.info('无法获取列表信息,http错误码 : '+ res);
                });
            },
            markupContent: function (callback) {
                var self = this,
                    url = 'target';
                /*主内容区分页内容清空*/
                self.pageNode.html('');
                scope.pageNo = 1;
                self.renderContent(url, scope.searchData, callback);
            },
            renderContent:function(url,postData,callback){
                var self = this;
                var upType = postData.o?"create": postData.m?"update":"";//区分筛选
                jQuery.when(model.loadData(url,postData,'get',jQuery('.contentList'))).then(function(data){
                    if(data && data.code === 200){
                        var totals = data.data.totalRecords;
                        /*记录资源来源,用以在对资源点击时跳转到云或者视图库使用*/
                        postData.source === 1 ? scope.sourceFrom = 1 : scope.sourceFrom = 2;
                        if(data.data.ids){
                            /*保存当次检索生成的历史记录的id,用以定位分页,时间排序*/
                            /*只有重新执行检索接口的时候才会记录cId*/
                            scope.cId = data.data.ids;
                        }
                        jQuery('.totalResults').text(totals);
                        /*分页回调函数*/
                        var PageCallBack = function(index) {
                            scope.pageNo = index + 1;
                            /*对作用域中的参数对象重新设置页数数据*/
                            postData.p = scope.pageNo;
                            /*
                             这里调用分页不应走检索接口
                             用cid调用了getDetails,如此不再生成历史
                             */
                            var data = {
                                np:scope.perPage,
                                p:scope.pageNo,
                                o:scope.searchData.l
                            };
                            self.getDetails(scope.cId,data);
                        };
                        /*获取到数据后的dom操作*/
                        if(callback){
                           _.map(data.data.list,function(item,index){
                                 $.extend(true, item, {selectType:upType});
                           })
                        callback(data.data);
                        }
                        /*绘制分页*/
                        if (self.pageNode.html() === '') {
                            self.pageNode.pagination(totals, {
                                'items_per_page': scope.perPage,
                                'first_loading':false,
                                'orhide' : false,
                                'callback': PageCallBack,
                                'prev_text' : '上一页',
                                'next_text' : '下一页',
                                'imageJudge' : true
                            });
                        }
                    }else{
                        if(callback){
                            callback('err');
                        }
                        notify.info('检索结果返回错误,错误码:'+ data.code);
                    }
                },function(res){
                    if(callback){
                        callback('err');
                    }
                    notify.info('无法查看详情信息,http错误码 : '+ res);
                });
            },
            saveH2R:function(id,name){
                /*把历史记录保存成检索记录*/
                var self = this,
                    url = '/service/pia/history/storage/'+id+"?name="+encodeURI(name),
                    callback = function(key,info){
                        if(key){
                            notify.info('保存成功');
                            if(scope.curListType === 1){
                                jQuery('#j-list').trigger('click');
                            }
                            view.disableSave();
                        }else{
                            notify.info('保存失败! ' +  info);
                        }
                    };
                model.saveH2R(url,callback);
            },
            isRepeat:function(name,callback){
                /*检索结果是否已经存在*/
                var url = '/service/pia/judge/resultname?name='+ encodeURI(name);
                model.isRepeat(url,callback);
            },
            /*获取检索结果名称列表,用以select选择*/
            getListName:function(id,callback){
                /*在资源选中并点击确定时,执行此函数,这时source,kind已经在searchData上面赋值*/
                var self = this,
                    url = '/service/pia/result/list/'+id,
                    data = {
                        source:scope.searchData.source,
                        kind:scope.searchData.kind
                    };
                model.getListName(url,data,callback);
            },
            /*
             *	获取左侧历史记录列表
             */
            getHistoryData:function(container){
                var url = "history",
                    self = this;
                self.renderList(url,function(data){
                    if(data === 'err'){
                        container.html('<p style="color:#ccc;">无法请求到历史列表!</p>');
                    }else{
                        container.html(self.render({"historyTasks":{'list':data.list}}));
                        jQuery(".retrieve_list .icon_close").click(function(e){
                            e.preventDefault();
                            e.stopImmediatePropagation();
                            self.delRetrieval('/service/pia/delete?id=',jQuery(this).closest('.history-details'),jQuery(this).attr('data-cat'));
                        });
                        jQuery(".history_cont .retrieve_list").eq(0).click();
                    }
                    container.show().siblings("div").hide();
                });
            },
            /*
             *	获取左侧检索结果列表
             */
            getRetrievals:function(container){
                var self = this;
                var url = "result";
                self.renderList(url,function(data){
                    if(data === 'err'){
                        container.html('<p style="color:#ccc;">无法请求到检索列表!</p>');
                    }else{
                        container.html(self.render({"taskList":{'list':data.list}}));
                        jQuery(".retrieve_list .icon_close").click(function(e){
                            e.preventDefault();
                            e.stopImmediatePropagation();
                            self.delRetrieval('/service/pia/delete?id=',jQuery(this).closest('.retrieve_list'),jQuery(this).attr('data-cat'));
                        });
                        view.bindAccordion(container);
                    }
                    container.show().siblings("div").hide();
                });
            },
            delRetrieval:function(url,node,id){
                var $dtDom = null;
                /*删除当前检索*/
                var callback = function(){
                    model.modefiyData(url + id,function(key,data){
                        if(key){
                            if(node.parent().find('dd').length === 1){
                                $dtDom = node.parent().find('dt');
                            }
                            node.fadeOut('',function(){
                                node.remove();
                                $dtDom&&$dtDom.remove();
                                $dtDom = null;
                            });
                            jQuery('.choose-file .close').trigger('click');
                        }else{
                            notify.info('删除失败' + data);
                        }
                    });
                };
                if(node.hasClass('history-details')){
                    callback();
                }else{
                    view.makeDialog('您将删除一条检索结果!',callback);
                }
            },
            parseDate:function(mills){
                var date = new Date(mills),
                    formatLenth = Toolkit.formatLenth;
                return date.getFullYear() + '-' + formatLenth(date.getMonth() + 1) + '-' + formatLenth(date.getDate()) + ' ' + formatLenth(date.getHours()) + ':' + formatLenth(date.getMinutes()) + ':' + formatLenth(date.getSeconds());
            }
        });
        jQuery(function(){
            var tf = new TF();
        });
    });


})

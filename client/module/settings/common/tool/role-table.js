/**
 * 
 * @authors chencheng (chencheng@netposa.com)
 * @date    2014-12-02 
 * @description  角色功能列表
 */

define(["ajaxModel","base.self"], function(ajaxModel){

    /**
 * 角色功能列表 包含角色的新增、编辑、详情和用户的详情
 * @type {Class}
 */
    var RolePanel = new Class({
        Implements: [Options],
        options: {
            getRolesUrl: "/service/role/get_org_roles",		/* 获取当前组织下的角色列表 */
            getRoleFuncUrl:"/service/role/get_role_function",    /* 获取某个角色的功能列表 */
            getRoleFuncsUrl:"/service/resource/get_function_pemission",  /* 获取全部的功能列表 */
            orgId: 1,
            roleId: null,
            defaultFuncs:[],	/* 用户详情	 */
            mode:"createRole",    /* 可能的值 ["createRole" | "editRole" | "roleDetail" | "userDetail"] */
            node: "#createRole #rolePanel",
            expand:false,		/* 是否全部展开所有的功能列表 */
            callback:jQuery.noop  	/* 角色面板渲染后的回调事件  目前主要用于显示下面的 操作按钮(操作按钮默认隐藏) */
        },
        /**
         * 高亮显示映射 一般用于查看（对应三级导航）
         * @type {Object}
         */
        highlightMap: {
            "87": "日志查看",
            "124": "查看历史报警信息",
            "125": "查看统计信息",
            "126": "查看布防任务列表",
            "127": "查看布控任务",
            "128": "查看布控库",
            "129": "查看巡检任务",
            "130": "查看巡检结果",
            "131": "查看摄像机类别统计",
            "133": "查看组织拓扑图",
            "134": "查看组织信息",
            "135": "查看用户信息",
            "136": "查看角色模板",
            "137": "查看服务器信息",
            "138": "查看视频设备信息",
            "139": "查看摄像机信息",
            "140": "查看关联关系",
            "141": "查看数据字典",
            "142": "查看电视墙布局",
            "144": "查看摄像机标注点位",
            "145": "查看故障率统计",
            "122": "查看电子防线",

            "12" : "视频监控",
            "35" : "指挥调度",
            "13" : "电视墙"

        },
        initialize: function(options) {
            this.setOptions(options);
            var mode = this.options.mode;
            // 角色创建编辑
            if (mode === "createRole" || mode === "editRole" || mode === "roleDetail") {
                this.loadData();
            } else if (mode === "userDetail") {
                this.render(this.options.defaultFuncs);
            }

        },
        /*
         * 初始化加载数据 获取所有的功能列表
         */
        loadData: function() {
            var self = this;
            jQuery.ajax({
                url: self.options.getRoleFuncsUrl,
                method: "get",
                dataType: "json",
                data: {},
                success: function(res) {
                    if (res.code === 200 && res.data.systemFunctionOrganizationList) {
                        self.render(res.data.systemFunctionOrganizationList);
                    } else {
                        notify.warn("网络或服务器异常！");
                    }
                }
            });
        },
        /**
         * 渲染功能列表
         * @author chencheng
         * @date   2014-12-29
         * @param  {[type]}   arr 功能权限数组
         * @return {[type]}       [description]
         */
        render:function(arr){
            var self = this,
                opt = self.options;

            var container = jQuery(opt.node);
                // 插入功能列表结构
                container.empty().html(self.assembleTable(arr));
                // 插入结构后的回调 显示下边的操作按钮
                opt.callback();
                //视图库权限和视频指挥设备权限联动（视图库录入和历史录像入库联动）
                setTimeout(function() {
                    var $lidom = jQuery("#rolePanel .module-item input[data-id=2001]"), //视图库节点
                        $videoToLibs = jQuery("#rolePanel .func-item input[data-id=2002]"); //视图库入库节点
                    if($lidom && $lidom.length > 0){
                        $videoToLibs.closest("span").show();
                        if($lidom.is(":checked")){
                            $videoToLibs.removeAttr("disabled").parent().removeClass("disable");
                        } else {
                            $videoToLibs.attr("disabled", "disabled").prop("checked", false).parent().addClass("disable");
                        }
                    } else {
                        $videoToLibs.closest("span").hide();
                    }
                }, 200);
                
                // 绑定相关按钮的事件
                self.bindEvent();
                
                // 当前的使用模式
                var mode = opt.mode;
                // 将查看功能置前
                if(mode === "createRole" || mode === "editRole" || mode === "roleDetail"){
                    self.highlight(container.find("label[for^='lvl3_']"),"");
                    self.highlight(container.find("label[for^='plvl2_']"),"before");
                    self.check(['lvl3_36']);
                }

                // 编辑角色 或者详情页  自动勾选
                if(opt.roleId){
                    self.getRoleFunc(opt.roleId);
                }

                if(mode === "roleDetail"){
                    // 默认将全部功能置灰
                    container.find("ul span").css("opacity",0.7);
                    container.find("ul input").unbind('click').click(function(event) {
                        return false;
                    });
                }

                // 创建 编辑角色 获取可复制的角色模板
                if(mode === "createRole" || mode === "editRole"){
                //    self.getRoles(opt.orgId);
                    // 将不拥有的全部功能权限置灰
                    self.setPermission(mode);
                }
        },
        /**
         * 角色详情自动关闭 没有的功能模块
         * @author chencheng
         * @date   2015-01-06
         * @return {[type]}   [description]
         */
        closeSubFuncPanel:function(){
            var self = this,
                modules = jQuery(self.options.node).find("ul.func-section li.module-item");

            for (var i = modules.length - 1; i >= 0; i--) {
                var el = jQuery(modules[i]);
                if(el.find("input:checked").length > 0){
                    el.children('div.module-nav-item').click();
                }
            }
        },
        /**
         * hasPermission 判断用户的功能权限
         * @author chencheng
         * @date   2014-10-27
         * @param  {string}   type       ["tree" ,"leaf"]
         * @param  {[string]}   id         node上元素的id属性值
         * @param  {[object]}   permission 用户拥有的权限信息
         * @return {Boolean}
         */
        hasPermission:function(type,id,permission){
            var orgs = permission.validFunctionOrgList ? permission.validFunctionOrgList:[];
            var funcs = permission.validFunctionResourceList ? permission.validFunctionResourceList: [];

            var flag = false;
            if (type === "tree") {
                for (var i = 0; i < orgs.length; i++) {
                    if (orgs[i].id == id) {
                        flag = true;
                        break;
                    }
                }
            }

            if (type === "leaf") {
                for (var j = 0; j < funcs.length; j++) {
                    if (funcs[j].id == id) {
                        flag = true;
                        break;
                    }
                }
            }

            return flag;

        },
        setPermission:function(mode){           
            var self =  this;
            var p = JSON.parse(window.localStorage.getItem("sPermissionList")).data;
            var inputs = jQuery(this.options.node).find("ul").find("span:not(.disable) input");
            for (var i = 0; i < inputs.length; i++) {
                var el = jQuery(inputs[i]);
                if(!self.hasPermission(el.attr("data-type"),el.attr("data-id"),p)){
                    el.closest('span').addClass('disable');
                    el.closest('span').find("input").unbind("click").click(function(event) {
                        return false;
                    }).removeAttr("checked");
                    // el.closest('span').prepend('<i class="role-check"></i>').addClass('disable').find("input").remove();
                }

            }
             var container = jQuery(self.options.node);
             var view_his = container.find("span input[data-name*='历史录像查看']"),
                 download_his = container.find("span input[data-name*='历史录像下载']"),
                 ruku_his = container.find("span input[data-name*='历史录像入库']"),
                 mark = download_his.parent().hasClass('disable'),
                 ruku_mark = ruku_his.parent().hasClass('disable');                 
             if(mode === "createRole"){
                //此段代码是当历史录像查看没有勾选时将历史录像下载、历史录像入库变成灰色  add by chenmc 2015/8/19                
 
                    //默认历史录像下载是灰色
                     download_his.attr("disabled",true);    
                     ruku_his.attr("disabled",true);   
                     download_his.parent().addClass('disable');
                     ruku_his.parent().addClass('disable');
                     view_his.on('click',function(){  
                         var flag=$(this).prop("checked");
                         if( !mark){
                              download_his.prop("checked",false); 
                            if(flag == true){
                                download_his.attr("disabled",false);  
                                download_his.parent().removeClass('disable');
                             }else{                               
                                download_his.attr("disabled",true);      
                                download_his.parent().addClass('disable');
                             }
                         }

                         if( !ruku_mark){
                             ruku_his.prop("checked",false); 
                            if(flag == true){
                                ruku_his.attr("disabled",false);  
                                ruku_his.parent().removeClass('disable');
                             }else{                                
                                
                                ruku_his.attr("disabled",true);      
                                ruku_his.parent().addClass('disable');
                             }
                         }

                     });
            }
        },
        /*
        *	根据组织id获取该角色列表
        */
        getRoles:function(orgId){
            var self = this;
            jQuery.getJSON(self.options.getRolesUrl+"?orgId="+orgId+"&userId="+jQuery("#userEntry").attr("data-userid"),function (res) {
                if(res.code === 200 && res.data.roles ){
                    var roles = res.data.roles;
                    var fregment = "<option value=''>选择角色复制权限</option>";
                    for(var i = roles.length-1;i >=0 ;i--){
                        fregment += "<option value='"+roles[i].id+"'>"+roles[i].name+"</option>";
                    }
                    jQuery(self.options.node).find("#selectRole").html(fregment).unbind("change").bind("change",function() {
                        var roleId = jQuery(this).find("option:selected").val();
                        if(roleId !== ""){
                            self.getRoleFunc(roleId);
                        } else {
                            jQuery("#rolePanel input").attr("checked", false);
                        }
                    });

                }else{
                    notify.warn("网络或服务器异常！");
                }
            });
        },
        /*
        *	根据角色id获取该角色的功能权限
        */
        getRoleFunc:function(id){
            var self = this;
            jQuery.ajax({
                url: self.options.getRoleFuncUrl,
                method: "get",
                dataType: "json",
                data: {"id":id},
                success: function(res) {
                    if (res.code === 200 && res.data.role.roleResourceAccessRules && res.data.role.roleResourceOrganizationAccessRules) {
                        self.update({"funcs":res.data.role.roleResourceAccessRules,"funcOrgs":res.data.role.roleResourceOrganizationAccessRules}, true);
                        if (jQuery('.func-item input[data-id="46"]').prop('checked')){
                            jQuery('.func-item input[data-id="47"],.func-item input[data-id="159"]').prop('disabled',false).closest('span').removeClass('disable')
                        } else {
                             jQuery('.func-item input[data-id="47"],.func-item input[data-id="159"]').prop('disabled',true).closest('span').addClass('disable')
                        }
                    } else {
                        notify.warn("网络或服务器异常！");
                    }
                }
            });
        },
        /**
         * 勾选当前元素及子元素
         * @author chencheng
         * @date   2014-12-24
         */
        selectChilds:function(element){
            var self = this,
                container = jQuery(self.options.node).find("ul.func-section");

            (function (el){
                var callSelf = arguments.callee;
                if(el.attr("data-type") === "tree"){
                    var pid =  el.attr("id");
                    // var chids = container.find("span:not(.disable) input[data-parentid='"+ pid +"']");
                    var chids = container.find("input[data-parentid='"+ pid +"']");
                    chids.each(function(index, item) {
                        var child = jQuery(item);
                        callSelf(child);
                    });
                }

                // if(!el.closest('span').hasClass('disable')){
                    el.prop("checked",true);
                // }

            })(element);
        },
        /*
        *	根据角色 回显功能列表 {funcs:[],funcOrgs:[]}
        */
        update:function(obj, needCheckAll){
            var self = this;
            var container = jQuery(this.options.node);
            var checkAll = container.find(".checkAll");
            container.find("input:checkbox").prop("checked",false);

            var funcsArr = obj.funcs;
                funcOrgsArr = obj.funcOrgs;

            for (var i = funcOrgsArr.length - 1; i >= 0; i--) {
                var p = container.find('[data-type="tree"]').filter("input[data-id='"+funcOrgsArr[i].resourceOrganizationId+"']");

                self.selectChilds(p);
            }

            for (var j = funcsArr.length - 1; j >= 0; j--) {
                var c = container.find('[data-type="leaf"]').filter("input[data-id='"+funcsArr[j].resourceId+"']");
                    self.selectChilds(c);
            }

            if(self.options.mode === "roleDetail" || self.options.mode === "editRole"){
                // 角色详情自动关闭 没有的功能模块
                self.closeSubFuncPanel();
            }

            // 联动全选按钮
            if(self.options.mode === "editRole" || needCheckAll){
                var modules = container.find("input:checkbox[id^='plvl1']");
                checkAll.prop("checked",true);
                for (var i = modules.length - 1; i >= 0; i--) {
                    if (!jQuery(modules[i]).prop("checked")) {
                        checkAll.prop("checked", false);
                        break;
                    }
                }
            }
            //此段代码是当历史录像查看没有勾选时将历史录像下载变成灰色  add by chenmc 2015/8/19
            var container = jQuery(self.options.node);
            var view_his = container.find("span input[data-name*='历史录像查看']"),
                 download_his = container.find("span input[data-name*='历史录像下载']"),
                 ruku_his = container.find("span input[data-name*='历史录像入库']"),
                 mark = download_his.parent().hasClass('disable'),
                 ruku_mark = ruku_his.parent().hasClass('disable');
            if(self.options.mode === "editRole"){
                 var singnal=view_his.prop("checked");
                 console.log(singnal,'888')
                  if(singnal){
                     //download_his.prop("checked",true); 
                     download_his.attr("disabled",false);      
                     download_his.parent().removeClass('disable');

                     //ruku_his.prop("checked",true); 
                     ruku_his.attr("disabled",false);      
                     ruku_his.parent().removeClass('disable');
                  } else {
                      //download_his.prop("checked",false); 
                     download_his.attr("disabled",true);      
                     download_his.parent().addClass('disable');

                    // ruku_his.prop("checked",false); 
                     ruku_his.attr("disabled",true);      
                     ruku_his.parent().addClass('disable');
                  }
                   view_his.on('click',function(){
                         var flag=$(this).prop("checked");
                            if(! mark){
                                 if(flag == true){
                                    download_his.attr("disabled",false);  
                                    download_his.parent().removeClass('disable');
                                 }else{
                                    download_his.prop("checked",false); 
                                    download_his.attr("disabled",true);      
                                    download_his.parent().addClass('disable');
                                 }
                            }

                            if(! ruku_mark){
                                 if(flag == true){
                                    ruku_his.attr("disabled",false);  
                                    ruku_his.parent().removeClass('disable');
                                 }else{
                                    ruku_his.prop("checked",false); 
                                    ruku_his.attr("disabled",true);      
                                    ruku_his.parent().addClass('disable');
                                 }
                            }

                   });
            }
        },
        /*
        *	创建表头 可复制角色模板列表
        */
        createHead: function() {
        //    var head ='<div class="header-select"><span><input class="checkAll" data-type="tree" id="plvl0_0" type="checkbox"/><label for="plvl0_0">全选</label></span><select id="selectRole"></select></div>';
            var head ='<div class="header-select"><span><input class="checkAll" data-type="tree" id="plvl0_0" type="checkbox"/><label for="plvl0_0">全选</label></span></div>';
            return head;
        },
        /**
         * 临时权限添加样式  主要用于用户详情的显示
         * @author chencheng
         * @date   2014-12-26
         * @param  {[type]}   start 开始时间
         * @param  {[type]}   end   结束时间
         */
        setTempFlag:function(start,end){
            var s = '',e = '';
            if (start) {
                s = Toolkit.mills2str(start);
                e = Toolkit.mills2str(end);
                return 'class="temp"' + 'title="' + s + "~" + e + '"';
            }
            return '';
        },
        /**
         * 高亮查看功能 [3级导航]
         * @author chencheng
         * @date   2014-12-31
         * @return {[type]}   [description]
         */
        highlight:function(nodes, type){
            var map = this.highlightMap,
                el,
                eFor;

            for (var i = nodes.length - 1; i >= 0 ; i--) {
                el  = jQuery(nodes[i]);
                eFor = el.attr("for");

				// 2015.05.04 修改适应更多的情况 梁创
				if (map[(eFor.split("_")[1])]) {
					el.addClass('highlight').addClass(type).addClass(eFor);
					el.closest("li").addClass('highlight').addClass(type);
				}
                /*if (map[el.attr("for").substring(5)]) {
                    el.addClass('highlight');
                    el.closest("li").addClass('highlight');
                }*/
            }
        },
        /*
        * 按照给出的 id 默认选中某个选项
        */
        check : function(ids){
            var len = ids.length;

            if(len>0){
                for(var i=0;i<len;i++){
                    $("#"+ids[i]).prop("checked",true);
                }
            }
        },
        /*
         *	根据数据组装table
         */
        assembleTable: function(arr) {
            var self = this,
                opt = self.options;

            var orgs = arr || [];

            var allUnfold = opt.expand ? "active" : "";
                arrowDirection = opt.expand ? "up" : "down";

            var tableHtml = "<ul class='func-section'>";

            if(opt.mode === "createRole" || opt.mode === "editRole"){
                tableHtml = self.createHead() + tableHtml;
            }
            for (var i = 0; i < orgs.length; i++) {
                var liEl = '<li class="module-item ' + allUnfold + '">';
                var head = '<div class="module-nav-item"><span><input data-type="tree" data-name="'+orgs[i].name+'" data-id="'+orgs[i].id+'" id="plvl1_'+orgs[i].id+'" data-parentid="plvl0_'+orgs[i].masterOrgId+'" type="checkbox"/><label '+ self.setTempFlag(orgs[i].beginTime,orgs[i].endTime) +' data-name="'+orgs[i].name+'" for="plvl1_'+orgs[i].id+'">'+orgs[i].name+'</label></span><i class="func-folder '+ arrowDirection +'"></i></div><div class="module-nav-content">';
                liEl += head;

                var orgs2 = orgs[i].systemFunctionOrganizationList || [];
                var funcs2 = orgs[i].systemFunctionList || [];

                if(orgs2.length > 0){
                    liEl +='<ul>';
                    var lvl2 ='';
                    for (var j = 0; j < orgs2.length; j++) {
                        lvl2 += '<li class="sub-menu"><div class="sub-menu-item"><span><input data-type="tree" data-name="'+orgs2[j].name+'" data-id="'+orgs2[j].id+'" id="plvl2_'+orgs2[j].id+'" data-parentid="plvl1_'+orgs2[j].masterOrgId+'" type="checkbox"><label '+ self.setTempFlag(orgs2[j].beginTime,orgs2[j].endTime) +' data-name="'+orgs2[j].name+'" for="plvl2_'+orgs2[j].id+'">'+orgs2[j].name+'</label></span></div><div class="sub-menu-content">';
                        var func3 = orgs2[j].systemFunctionList || [];
                        if(func3.length >0){
                            lvl2 +='<ul>';

                            var lvl3 = '';
                            for (var k = 0; k < func3.length; k++) {
                                lvl3 += '<li class="func-item"><span><input data-type="leaf" data-name="'+func3[k].name+'" data-id="'+func3[k].id+'" id="lvl3_'+func3[k].id+'" data-parentid="plvl2_'+func3[k].orgId+'" type="checkbox"><label '+ self.setTempFlag(func3[k].beginTime,func3[k].endTime) +' data-name="'+func3[k].name+'" for="lvl3_'+func3[k].id+'">'+func3[k].name+'</label></span></li>';
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
                        liEl += '<li class="func-item"><span><input data-type="leaf" data-name="'+funcs2[n].name+'" data-id="'+funcs2[n].id+'" id="lvl2_'+funcs2[n].id+'" data-parentid="plvl1_'+funcs2[n].orgId+'" type="checkbox"><label '+ self.setTempFlag(funcs2[n].beginTime,funcs2[n].endTime) +' data-name="'+funcs2[n].name+'" for="lvl2_'+funcs2[n].id+'">'+funcs2[n].name+'</label></span></li>';
                    }
                    liEl += '</ul>';
                }

                liEl += '</div></li>';
                tableHtml += liEl;
            }
            tableHtml+= '</ul>'

            return tableHtml;

        },
        // 勾选向下级联动
        linkageDown:function(element){
            var self = this ;
            var container = jQuery(self.options.node).find("ul.func-section"),
                flag = element.prop("checked");
            (function (el){
                var callSelf = arguments.callee;
                if(el.attr("data-type") === "tree"){
                    var pid =  el.attr("id");
                    var chids = container.find("span:not(.disable) input[data-parentid='"+ pid +"']")
                    chids.each(function(index, item) {
                        var child = jQuery(item);
                        callSelf(child);
                    });
                }
                el.prop("checked",flag);

                if (el.attr("data-id") === "46") {//历史录像查看
                    if (flag) {
                        container.find("span input[data-name*='历史录像下载'], span input[data-name*='历史录像入库']").removeAttr("disabled").parent().removeClass("disable");
                    } else {
                        container.find("span input[data-name*='历史录像下载'], span input[data-name*='历史录像入库']").attr("disabled", "disabled").prop("checked", false).parent().addClass("disable");
                    }
                }

                if (el.attr("data-id") === "2001") {//视图库录入
                    if (flag) {
                        container.find("span input[data-name*='入库']").removeAttr("disabled").parent().removeClass("disable");
                    } else {
                        container.find("span input[data-name*='入库']").attr("disabled", "disabled").prop("checked", false).parent().addClass("disable");
                    }
                }
            })(element);
        },
        /**
         * 勾选向上联动
         * @author chencheng
         * @date   2014-12-24
         */
        linkageUp:function(element,bool){
            var self = this ;
            var container = jQuery(self.options.node);
            (function (el){
                var callSelf = arguments.callee,
                    pid =  el.attr("data-parentid");
                var parent = container.find("span:not(.disable) input[id='"+ pid +"']"),
                    siblings = container.find("span:not(.disable) input[data-parentid='"+ pid +"']");

                var flag = true;
                siblings.each(function(index, item) {
                    var child = jQuery(item);
                    if(!child.prop("checked")){
                        flag = false;
                    }
                });
                parent.prop("checked",flag);
                if (parent.length > 0 && (!parent.hasClass("checkAll"))) {
                    callSelf(parent);
                }
            })(element);

        },
        /*
         *	绑定事件
         */
        bindEvent: function() {
            var self = this,
                container = jQuery(self.options.node),
                checkAll = container.find(".checkAll");

            jQuery("#rolePanel .module-nav-item").unbind("click").bind("click",function(){
                var el = jQuery(this);
                el.children("i.func-folder").toggleClass('up down').closest('li.module-item').toggleClass('active');
            });
            // 角色创建，自动展开第一级
            if(self.options.mode === "createRole"){
                jQuery("#rolePanel .module-nav-item").get(0).click();
            }

            // 全选
            checkAll.unbind('click').bind('click',function(){
                container.find("ul").find("span:not(.disable) input").prop("checked",checkAll.prop("checked"));
                if (checkAll.prop("checked")) {
                    container.find("span input[data-name*='历史录像下载'], span input[data-name*='历史录像入库']").removeAttr("disabled").prop("checked", true).parent().removeClass("disable");
                } else {
                    container.find("span input[data-name*='历史录像下载'], span input[data-name*='历史录像入库']").attr("disabled", "disabled").prop("checked", false).parent().addClass("disable");
                }
            });
            // checkbox 勾选事件
            container.find("ul").find("span:not(.disable) input").unbind("click").bind('click', function(event) {
                event.stopPropagation();
                var el = jQuery(this);
                setTimeout(function() {
                    self.linkageDown(el);
                    self.linkageUp(el);
                }, 0); 
            });

            container.find("ul").find("label").unbind("click").bind('click', function(event) {
                event.stopPropagation();
            });
          
            // 特殊处理   单屏显示  四屏显示  九屏显示  十六屏显示
            // var screen1 = container.find("span:not(.disable) input[data-name*='单屏']"),
            // 	screen4 = container.find("span:not(.disable) input[data-name*='四屏']"),
            // 	screen9 = container.find("span:not(.disable) input[data-name*='九屏']"),
            // 	screen16 = container.find("span:not(.disable) input[data-name*='十六屏']");
                
            // screen16.bind("click",function(){
            // 	if(screen16.prop("checked")){
            // 		screen1.prop("checked",true);
            // 		screen4.prop("checked",true);
            // 		screen9.prop("checked",true);
            // 	}
            // });
            // screen9.bind("click",function(){
            // 	if(screen9.prop("checked")){
            // 		screen1.prop("checked",true);
            // 		screen4.prop("checked",true);
            // 	}
            // });
            // screen4.bind("click",function(){
            // 	if(screen4.prop("checked")){
            // 		screen1.prop("checked",true);
            // 	}
            // });
        },
        /*
         *	输出勾选项的相关数据 2014-12-24
         */
        getArrData:function(){
            var self = this,
                funcs = [],
                funcParents = [],
                container = jQuery(self.options.node);

            var checkAll = jQuery("#rolePanel .checkAll"),
                allChecked = checkAll.prop("checked");
                // 如果全选勾选,暂时先去掉勾选状态
                allChecked ? checkAll.prop("checked", false) : '';
                (function (el){
                    var callSelf = arguments.callee;
                    if(el.prop("checked")){
                        if(el.attr("data-type") === "tree"){
                            funcParents.push({"functionOrgId":el.attr("data-id")});
                        }else{
                            funcs.push({"functionId":el.attr("data-id")});
                        }
                    }else{
                        if(el.attr("data-type") === "tree"){
                            container.find("input[data-parentid='"+ el.attr("id") +"']").each(function(index, item) {
                                callSelf(jQuery(item))
                            });
                        }
                    }
                })(checkAll);
                // 还原全选勾选的状态
                allChecked ? checkAll.prop("checked", true) : '';

            return {"funcs":funcs,"funcParents":funcParents};
        }

    });

    return RolePanel;
});

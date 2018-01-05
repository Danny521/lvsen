define([
	'js/apply_controller',
    'handlebars'
	], function(Controller) {
    return (function (scope, $) {
    	var _controller = null,
    		_templateUrl = "/module/permissionApply/inc/main.html",
    		taskId = null; //默认加载面板路径;

		scope.init = function(objCtr) {
			var userId = jQuery("#userEntry").attr("data-userid"),
                url = window.location.href;
            _controller = objCtr;
            scope.registerHelper();
            //admin和普通用户区分
            if(userId === "1" || userId === 1){
                if(url.indexOf("id") !== -1){
                    _controller.getUserPermission(url.split("=")[1]);
                    taskId  = url.split("=")[1];
                }else{
                    scope.renderListTpl();
                }
            }else{
                scope.render();
            }
		};
        scope.renderListTpl = function(){
            var tpl = {
                    "approvalList": true
                };
            // 请求页面模板
            jQuery.get(_templateUrl, function(tem) {
                if (tem) {
                    var template = Handlebars.compile(tem);
                    jQuery("#major").html(template(tpl));
                    _controller.getApprovalList();
                }
            });   
        };
        scope.registerHelper = function(){
            Handlebars.registerHelper('getUserName', function(value) {
                var point = value.indexOf("申请");
                if(point<=-1){
                    return value;
                }else{
                    return value.substring(0,point);
                }
            });
            Handlebars.registerHelper('getMsg', function(value) {
                var point = value.indexOf("申请");
                if(point<=-1){
                    return "";
                }else{
                     return value.substring(point);
                }
            });
            Handlebars.registerHelper('formatTime', function(value) {
                var date = new Date(value),
                    second = "";
                if(date.getSeconds() <10){
                    second = "0" + date.getSeconds();
                }else{
                    second = date.getSeconds();
                }
                return date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate() + "/ " + date.getHours() + ":" + date.getMinutes() + ":" + second;
            });
        };
        scope.renderList = function(data){
            var tpl = {
                    "approvalListData": true,
                    "data": data
                };
            // 请求页面模板
            jQuery.get(_templateUrl, function(tem) {
                if (tem) {
                    var template = Handlebars.compile(tem);
                    jQuery("#major table").html(template(tpl));
                    scope.bindEvent1();
                }
            });   
        }
		scope.render = function(data,flag){
			var tpl = "";
			if(data){
				tpl = {
	                "approvalMsg": data
	            };
			}else{
				tpl = {
                    "applyMsg": true
                };
			}
            // 请求页面模板
            jQuery.get(_templateUrl, function(tem) {
                if (tem) {
                    var template = Handlebars.compile(tem);
                    if(flag){
                        jQuery("#major .approvalList").hide().after(template(tpl));
                    }else{
                        jQuery("#major").html(template(tpl));
                    }
                    _controller.loadData(data);
                }
            });		
		}
		/**
         * 渲染所有权限数据
         * @param  {[type]} arr [description]
         * @return {[type]}     [description]
         */
        scope.renderAdmin = function(arr,data){
            
            var container = jQuery("#rolePanel"),
                mainModule = data.mainModule.split(","),
                thirdModule = data.thirdModule.split(",");
            // 插入功能列表结构
            container.empty().html(scope.assembleTable1(arr));
            var treeModule = container.find('[data-type="tree"]');
            // 绑定相关按钮的事件
            scope.bindEvent1();
            jQuery("#rolePanel").find("i.func-folder.down").trigger("click");

            for (var i = mainModule.length - 1; i >= 0; i--) {
                var p = container.find('[data-type="tree"]').filter("input[data-id='"+mainModule[i]+"']");
                p.prop("checked",true);
            }
            for (var i = thirdModule.length - 1; i >= 0; i--) {
                var p = container.find('[data-type="leaf"]').filter("input[data-id='"+thirdModule[i]+"']");
                p.prop("checked",true);
            }
        };
        /**
         * 渲染所有权限数据
         * @param  {[type]} arr [description]
         * @return {[type]}     [description]
         */
        scope.renderCommon = function(arr){
            var container = jQuery("#rolePanel");
            // 插入功能列表结构
            container.empty().html(scope.assembleTable(arr));

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
            scope.bindEvent();
            // 展开各模块具体权限
            jQuery("#rolePanel").find("i.func-folder.down").trigger("click");
            // 渲染该用户的具体权限
            _controller.getRoleFunc(jQuery("#userEntry").attr("data-userid"));
        };
        /**
         * 临时权限添加样式  主要用于用户详情的显示
         * @author chencheng
         * @date   2014-12-26
         * @param  {[type]}   start 开始时间
         * @param  {[type]}   end   结束时间
         */
        scope.setTempFlag = function(start,end){
            var s = '',e = '';
            if (start) {
                s = Toolkit.mills2str(start);
                e = Toolkit.mills2str(end);
                return 'class="temp"' + 'title="' + s + "~" + e + '"';
            }
            return '';
        };
         /*
        *   创建表头 可复制角色模板列表
        */
        scope.createHead = function() {
            var head ='<div class="header-select"><span><input class="checkAll" data-type="tree" id="plvl0_0" type="checkbox"/><label for="plvl0_0">全选</label></span></div>';
            return head;
        };
        scope.assembleTable = function(arr) {
            
            var orgs = arr || [];
            var allUnfold = "";
            var arrowDirection = "down";

            var tableHtml = scope.createHead() + "<ul class='func-section'>";
            for (var i = 0; i < orgs.length; i++) {
                var liEl = '<li class="module-item ' + allUnfold + '">';
                var head = '<div class="module-nav-item"><span><input data-type="tree" data-name="'+orgs[i].name+'" data-id="'+orgs[i].id+'" id="plvl1_'+orgs[i].id+'" data-parentid="plvl0_'+orgs[i].masterOrgId+'" type="checkbox"/><label '+ scope.setTempFlag(orgs[i].beginTime,orgs[i].endTime) +' data-name="'+orgs[i].name+'" for="plvl1_'+orgs[i].id+'">'+orgs[i].name+'</label></span><i class="func-folder '+ arrowDirection +'"></i></div><div class="module-nav-content">';
                liEl += head;

                var orgs2 = orgs[i].systemFunctionOrganizationList || [];
                var funcs2 = orgs[i].systemFunctionList || [];

                if(orgs2.length > 0){
                    liEl +='<ul>';
                    var lvl2 ='';
                    for (var j = 0; j < orgs2.length; j++) {
                        lvl2 += '<li class="sub-menu"><div class="sub-menu-item"><span><input data-type="tree" data-name="'+orgs2[j].name+'" data-id="'+orgs2[j].id+'" id="plvl2_'+orgs2[j].id+'" data-parentid="plvl1_'+orgs2[j].masterOrgId+'" type="checkbox"><label '+ scope.setTempFlag(orgs2[j].beginTime,orgs2[j].endTime) +' data-name="'+orgs2[j].name+'" for="plvl2_'+orgs2[j].id+'">'+orgs2[j].name+'</label></span></div><div class="sub-menu-content">';
                        var func3 = orgs2[j].systemFunctionList || [];
                        if(func3.length >0){
                            lvl2 +='<ul>';

                            var lvl3 = '';
                            for (var k = 0; k < func3.length; k++) {
                                lvl3 += '<li class="func-item"><span><input data-type="leaf" data-name="'+func3[k].name+'" data-id="'+func3[k].id+'" id="lvl3_'+func3[k].id+'" data-parentid="plvl2_'+func3[k].orgId+'" type="checkbox"><label '+ scope.setTempFlag(func3[k].beginTime,func3[k].endTime) +' data-name="'+func3[k].name+'" for="lvl3_'+func3[k].id+'">'+func3[k].name+'</label></span></li>';
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
                        liEl += '<li class="func-item"><span><input data-type="leaf" data-name="'+funcs2[n].name+'" data-id="'+funcs2[n].id+'" id="lvl2_'+funcs2[n].id+'" data-parentid="plvl1_'+funcs2[n].orgId+'" type="checkbox"><label '+ scope.setTempFlag(funcs2[n].beginTime,funcs2[n].endTime) +' data-name="'+funcs2[n].name+'" for="lvl2_'+funcs2[n].id+'">'+funcs2[n].name+'</label></span></li>';
                    }
                    liEl += '</ul>';
                }

                liEl += '</div></li>';
                tableHtml += liEl;
            }
            tableHtml+= '</ul>'

            return tableHtml;

        };
         /*
        *   创建表头 可复制角色模板列表
        */
        scope.createHead1 = function() {
            var head ='<div class="header-select"><span><input class="checkAll" data-type="tree" id="plvl0_0" type="checkbox"  disabled="true"　readOnly="true"/><label for="plvl0_0">全选</label></span></div>';
            return head;
        };
        scope.assembleTable1 = function(arr) {
            
            var orgs = arr || [];
            var allUnfold = "";
            var arrowDirection = "down";

            var tableHtml = "<ul class='func-section'>";
            for (var i = 0; i < orgs.length; i++) {
                var liEl = '<li class="module-item ' + allUnfold + '">';
                var head = '<div class="module-nav-item"><span><input data-type="tree" data-name="'+orgs[i].name+'" data-id="'+orgs[i].id+'" id="plvl1_'+orgs[i].id+'" data-parentid="plvl0_'+orgs[i].masterOrgId+'" type="checkbox"  disabled="true"　readOnly="true" /><label '+ scope.setTempFlag(orgs[i].beginTime,orgs[i].endTime) +' data-name="'+orgs[i].name+'" for="plvl1_'+orgs[i].id+'">'+orgs[i].name+'</label></span><i class="func-folder '+ arrowDirection +'"></i></div><div class="module-nav-content">';
                liEl += head;

                var orgs2 = orgs[i].systemFunctionOrganizationList || [];
                var funcs2 = orgs[i].systemFunctionList || [];

                if(orgs2.length > 0){
                    liEl +='<ul>';
                    var lvl2 ='';
                    for (var j = 0; j < orgs2.length; j++) {
                        lvl2 += '<li class="sub-menu"><div class="sub-menu-item"><span><input data-type="tree" data-name="'+orgs2[j].name+'" data-id="'+orgs2[j].id+'" id="plvl2_'+orgs2[j].id+'" data-parentid="plvl1_'+orgs2[j].masterOrgId+'" type="checkbox"  disabled="true"　readOnly="true" ><label '+ scope.setTempFlag(orgs2[j].beginTime,orgs2[j].endTime) +' data-name="'+orgs2[j].name+'" for="plvl2_'+orgs2[j].id+'">'+orgs2[j].name+'</label></span></div><div class="sub-menu-content">';
                        var func3 = orgs2[j].systemFunctionList || [];
                        if(func3.length >0){
                            lvl2 +='<ul>';

                            var lvl3 = '';
                            for (var k = 0; k < func3.length; k++) {
                                lvl3 += '<li class="func-item"><span><input data-type="leaf" data-name="'+func3[k].name+'" data-id="'+func3[k].id+'" id="lvl3_'+func3[k].id+'" data-parentid="plvl2_'+func3[k].orgId+'" type="checkbox"  disabled="true"　readOnly="true"><label '+ scope.setTempFlag(func3[k].beginTime,func3[k].endTime) +' data-name="'+func3[k].name+'" for="lvl3_'+func3[k].id+'">'+func3[k].name+'</label></span></li>';
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
                        liEl += '<li class="func-item"><span><input data-type="leaf" data-name="'+funcs2[n].name+'" data-id="'+funcs2[n].id+'" id="lvl2_'+funcs2[n].id+'" data-parentid="plvl1_'+funcs2[n].orgId+'" type="checkbox"  disabled="true"　readOnly="true"><label '+ scope.setTempFlag(funcs2[n].beginTime,funcs2[n].endTime) +' data-name="'+funcs2[n].name+'" for="lvl2_'+funcs2[n].id+'">'+funcs2[n].name+'</label></span></li>';
                    }
                    liEl += '</ul>';
                }

                liEl += '</div></li>';
                tableHtml += liEl;
            }
            tableHtml+= '</ul>'

            return tableHtml;

        };
        /**
         * 勾选当前元素及子元素
         * @author chencheng
         * @date   2014-12-24
         */
        scope.selectChilds = function(element,data){
        	
            var container = jQuery("#rolePanel").find("ul.func-section"),
            	childrenModule = data.systemFunctionOrganizationList;

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
        };
                /*
         *  绑定事件
         */
        scope.bindEvent = function() {
            var container = jQuery("#rolePanel"),
                checkAll = container.find(".checkAll");

            jQuery("#rolePanel .module-nav-item").unbind("click").bind("click",function(){
                var el = jQuery(this);
                el.children("i.func-folder").toggleClass('up down').closest('li.module-item').toggleClass('active');
            });

            // 全选
            checkAll.unbind('click').bind('click',function(){
            	
            	scope.changeButton1(false);
                container.find("ul").find("span:not(.disable) input").prop("checked",checkAll.prop("checked"));
                if (checkAll.prop("checked")) {
                    container.find("span input[data-name*='历史录像下载'], span input[data-name*='入库']").removeAttr("disabled").prop("checked", true).parent().removeClass("disable");
                } else {
                    container.find("span input[data-name*='历史录像下载'], span input[data-name*='入库']").attr("disabled", "disabled").prop("checked", false).parent().addClass("disable");
                }
            });
            // checkbox 勾选事件
            container.find("ul").find("span:not(.disable) input").unbind("click").bind('click', function(event) {
                
                scope.changeButton1(false);
                event.stopPropagation();
                var el = jQuery(this);
                setTimeout(function() {
                    scope.linkageDown(el);
                    scope.linkageUp(el);
                }, 0); 
            });

            container.find("ul").find("label").unbind("click").bind('click', function(event) {
                event.stopPropagation();
            });
            
            jQuery("#departDetail").find("#saveRole").unbind("click").bind('click', function(event) {
                if(jQuery(this).hasClass("active")){
                    notify.warn("不能重复请求相同权限");
                    return;
                }
                var arr12 = [],
                    arr3 = [];
                event.stopPropagation();
                var checked = container.find("ul").find("span:not(.disable) input");
                checked.each(function(index,item){
                    if(checked.eq(index).is(':checked')){
                        if(checked.eq(index).attr("data-type") === "tree"){
                            arr12.push(checked.eq(index).attr("data-id"));
                        }else{
                            arr3.push(checked.eq(index).attr("data-id"));
                        }
                    }
                });
                if(arr3.length>0){
                	_controller.editPermission(arr12,arr3);
                }else{
                	notify.warn("请选择要申请的权限");
                }
            });
        };
        /*
         *  绑定事件
         */
        scope.bindEvent1 = function() {
            var container = jQuery("#rolePanel");
            jQuery(".approvalList .approvalicon").unbind("click").bind("click",function(){
                taskId = jQuery(this).attr("data-id");
                _controller.getUserPermission(taskId,true);
            });

            jQuery("#rolePanel .module-nav-item").unbind("click").bind("click",function(){
                var el = jQuery(this);
                el.children("i.func-folder").toggleClass('up down').closest('li.module-item').toggleClass('active');
            });
            jQuery(".approvalMsgDetail .delect").unbind("click").bind("click",function(){
                if(jQuery("#major .approvalList").length){
                    jQuery("#major .approvalMsgDetail").remove();
                    jQuery("#major .approvalList").show();
                }else{
                    var point = window.location.href.indexOf("?");
                    window.location.href = window.location.href.substring(0,point);
                }
            });
            jQuery(".approvalMsgDetail").find("#saveRole").unbind("click").bind('click', function(event) {
                event.stopPropagation();
                var userId = jQuery("#roleForm").find("#roleName").attr("data-id"),
                    content = jQuery("#roleForm").find("#description").html(),
                    data = {
                        "userId":userId,
                        "result":1,
                        "reason":content,
                        "id":taskId
                    };
                _controller.postApplyResult(data);
            });
            jQuery(".approvalMsgDetail").find("#cancel").unbind("click").bind('click', function(event) {
                event.stopPropagation();
                var userId = jQuery("#roleForm").find("#roleName").attr("data-id"),
                    content = jQuery("#roleForm").find("#description").val(),
                    data = {
                        "userId":userId,
                        "result":0,
                        "reason":content,
                        "id":taskId
                    };
                if(content===""){
                    notify.warn("请填写打回原因");
                    return
                }
                _controller.postApplyResult(data);
            });
        };
        scope.changeButton1 = function(flag) {
            if(flag){
                $("#saveRole").addClass("active"); 
            }else{
                $("#saveRole").removeClass("active");  
            }
            
        };
        /*
        *   根据角色 回显功能列表 {funcs:[],funcOrgs:[]}
        */
        scope.update = function(obj){
            
            var container = jQuery("#rolePanel");
            var checkAll = container.find(".checkAll");
            var childrenModule = [];
            var treeModule = [];
			var data = obj.funcs;
			var needCheckAll = true;

            for(var i=0;i<data.length;i++){
            	treeModule.push(data[i]);
            	if(data[i].systemFunctionOrganizationList){
            		for(var j=0;j<data[i].systemFunctionOrganizationList.length;j++){
	            		treeModule.push(data[i].systemFunctionOrganizationList[j]);
	            		for(var k=0;k<data[i].systemFunctionOrganizationList[j].systemFunctionList.length;k++){
	            			childrenModule.push(data[i].systemFunctionOrganizationList[j].systemFunctionList[k]);
	            		}
	            	}
            	}
            	if(data[i].systemFunctionList){
            		treeModule.push(data[i]);
            		for(var k=0;k<data[i].systemFunctionList.length;k++){
            			childrenModule.push(data[i].systemFunctionList[k]);
            		}
            	}
            }

            container.find("input:checkbox").prop("checked",false);

            for (var j = childrenModule.length - 1; j >= 0; j--) {
                var c = container.find('[data-type="leaf"]').filter("input[data-id='"+childrenModule[j].id+"']");
                c.prop("checked",true);
            }
            for (var j = treeModule.length - 1; j >= 0; j--) {
                var c = container.find('[data-type="tree"]').filter("input[data-id='"+treeModule[j].id+"']");
                (function (el){
	                var pid =  el.attr("id");
	                var siblings = container.find("span:not(.disable) input[data-parentid='"+ pid +"']");

	                var flag = true;
	                siblings.each(function(index, item) {
	                    var child = jQuery(item);
	                    if(!child.prop("checked")){
	                        flag = false;
	                    }
	                });
	                el.prop("checked",flag);
	            })(c);
            }
            
            //此段代码是当历史录像查看没有勾选时将历史录像下载变成灰色  add by chenmc 2015/8/19
            var container = jQuery("#rolePanel");
            var view_his = container.find("span input[data-name*='历史录像查看']"),
                download_his = container.find("span input[data-name*='历史录像下载']"),

                view_lib = container.find(".func-item span input[data-name*='视图库']"),
                ruku_his = container.find("span input[data-name*='入库']"),

                mark = download_his.parent().hasClass('disable'),
                ruku_mark = ruku_his.parent().hasClass('disable');

         	var singnal1=view_his.prop("checked"),
         		singnal2=view_lib.prop("checked");
        	console.log(singnal1,'888');
        	console.log(singnal2,'999');
            if(singnal1){
                //download_his.prop("checked",true); 
                download_his.attr("disabled",false);      
                download_his.parent().removeClass('disable');

                //ruku_his.prop("checked",true); 
                // ruku_his.attr("disabled",false);      
                // ruku_his.parent().removeClass('disable');
            } else {
	            //download_his.prop("checked",false); 
	            download_his.attr("disabled",true);      
	            download_his.parent().addClass('disable');

	            // ruku_his.prop("checked",false); 
	            // ruku_his.attr("disabled",true);      
	            // ruku_his.parent().addClass('disable');
	        }
	        if(singnal2){
                //download_his.prop("checked",true); 
                ruku_his.attr("disabled",false);      
                ruku_his.parent().removeClass('disable');

                //ruku_his.prop("checked",true); 
                // ruku_his.attr("disabled",false);      
                // ruku_his.parent().removeClass('disable');
            } else {
	            //download_his.prop("checked",false); 
	            ruku_his.attr("disabled",true);      
	            ruku_his.parent().addClass('disable');

	            // ruku_his.prop("checked",false); 
	            // ruku_his.attr("disabled",true);      
	            // ruku_his.parent().addClass('disable');
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

                // if(! ruku_mark){
                //      if(flag == true){
                //         ruku_his.attr("disabled",false);  
                //         ruku_his.parent().removeClass('disable');
                //      }else{
                //         ruku_his.prop("checked",false); 
                //         ruku_his.attr("disabled",true);      
                //         ruku_his.parent().addClass('disable');
                //      }
                // }
           	});
           	view_lib.on('click',function(){
                var flag=$(this).prop("checked");
                // if(! mark){
                //      if(flag == true){
                //         download_his.attr("disabled",false);  
                //         download_his.parent().removeClass('disable');
                //      }else{
                //         download_his.prop("checked",false); 
                //         download_his.attr("disabled",true);      
                //         download_his.parent().addClass('disable');
                //      }
                // }

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
        };
        // 勾选向下级联动
        scope.linkageDown = function(element){
            
            var container = jQuery("#rolePanel").find("ul.func-section"),
                flag = element.prop("checked");
            (function (el){
                var callSelf = arguments.callee;
                if(el.attr("data-type") === "tree"){
                    var pid =  el.attr("id");
                    var chids = container.find("span input[data-parentid='"+ pid +"']")
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
        };
        /**
         * 勾选向上联动
         * @author chencheng
         * @date   2014-12-24
         */
        scope.linkageUp = function(element,bool){
            var container = jQuery("#rolePanel");
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
        };
        return scope;
    }({}, jQuery));
});
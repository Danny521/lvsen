define(['jquery','mootools'],function(){
    var DefenseCamera = new Class({
        Implements: [Events, Options],
        options: {
            // url:"/service/video_access/list_cameras",    //根据父组织获取子组织
            // rootUrl:"/service/video_access/list_cameras",            //获取根组织
            url:"/service/video_access_copy/list_cameras",  //根据父组织获取子组织
            rootUrl:"/service/video_access_copy/list_cameras",          //获取根组织
            searchUrl:"/service/video_access_copy/search_camera",   //根据组织名搜索
            searchCameraUrl:"/service/video_access_copy/search_only_camera",    //高级搜索 只搜摄像头
            templateUrl:"/module/protection-monitor/common/inc/simple-camera-tree.html",
            getParentsUrl:"/service/resource/get_org_path",  // 获取父节点路径
            getRunCammeras: "/service/faceReco/storing/ipc_run",
            node:".treePanel",
            searchNode: ".simple-camera-tree-search-input",
            template:null,
            queryKey:"",
            isMarked:"",    // 已标注[1] or 未标注[0]
            scrollbar:null,
            type:"org",
            scrollbarNode:"#aside .scrollbarPanel",
            // 是否需要有复选框
            selectable:true,
            // 默认是否选择
            defaultSelected: false,
            // tree是否需要复选框
            treeNeedSelectBox: true,
            // 点击复选框按钮时，是否触发叶子的点击事件
            checkboxTriggerLeaf: false,
            // 点击复选框按钮时，是否触发组织的点击事件
            checkboxTriggerOrg: false,
            // 数据加载完成后并且数据不为空的回调函数
            loadedCallback:jQuery.noop,
            showAllCameras: false, // 是否选择所有摄像机，包括人脸摄像机和普通摄像机
            checkIpcCamera: false, // 是否勾选人脸摄像机
            camerasCache: [], //已选择的摄像机缓存，展开摄像机树时，需要勾选
            defaultRootId:0,
            orgId:null,
            leafClick:jQuery.noop,
            leafDblClick:jQuery.noop,
            treeClick:jQuery.noop,
            treeDblClick:jQuery.noop,
            dropDown:jQuery.noop,
            curOrgLevel:1,  //当前组织在树中的层级
            orgPathList:[], // 当前组织路径
            thumbSize:72,
            // runningCameras: [], // 当前正在工作的摄像机列表
            callback:jQuery.noop,
            isLoading: false
        },
        requestObj:null,
        initialize: function(options) {
            this.setOptions(options);
            // scrollbar 默认scroll容器的类名为 scrollbarPanel
            var tem = this.options,
                self = this;
            //tem.scrollbar = jQuery(tem.node).html("").closest("div"+ tem.scrollbarNode);
            //tem.scrollbar.tinyscrollbar({thumbSize : tem.thumbSize});
            //self.getRunningCameras(function() {
                jQuery(self.options.node).html("");
                /**if(tem.orgId && tem.orgId !== "null"){
                    self.getOrgPathList(tem.orgId);
                }
                **/
                self.getOrgPathList(tem.orgId);
                self.loadTemplate();
            //});
        },
        // getRunningCameras: function(callback) {
        //     var self = this;
        //     self.options.runningCameras = [];
        //     jQuery.ajax({
        //         type: "post",
        //         url: self.options.getRunCammeras,
        //         success: function(res) {
        //             if (res.code === 200) {
        //                 res.data.forEach(function(item) {
        //                     self.options.runningCameras.push(item.id-0);
        //                 });
        //             }
        //             callback();
        //         },
        //         error: function() {
        //            callback(); 
        //         }
        //     });
        // },
        reload:function(options){
            var tem = this.options;
            jQuery(tem.node).html("");
            tem.queryKey ="";
            this.loadData({"parentId":tem.defaultRootId},jQuery(tem.node),true);
        },
        search:function (options) {
            this.setOptions(options);
            var tem = this.options;
            jQuery(tem.node).html("");
            if(tem.queryKey !== ""){
                this.loadData({"key":tem.queryKey,"mark":tem.isMarked,"type":"org","count":50,"offset":0},jQuery(tem.node),false);
            }else{
                this.reload();
            }
        },
        /*
         *  权限控制
         */
        hasAccessPower:function(orgId){
            var result = false;
            // 本部门级下属部门id
            var childs = this.orgChilds;
            // 如果是上级部门
            for (var i = childs.length-1; i >= 0 ; i--) {
                if (orgId == childs[i]) {
                    result = true;
                    break;
                }
            }
            return result;

        },
        // 获取当前组织路径  顶级>上级>当前
        getOrgPathList:function(currentOrgId){
            var self = this;
            jQuery.ajax({
                url: self.options.getParentsUrl,
                type: "get",
                dataType: "json",
                async:false,
                data: {orgId: currentOrgId || 1 },
                success:function (res) {
                    if(res.code === 200){
                        // self.options.orgPathList = self.cutOrgPath(res.data.orgPathList.reverse());
                        self.options.orgPathList =res.data.orgPathList.reverse();

                        // 保存当前组织及下属组织id 用于权限判断
                        self.orgChilds = res.data.childs ? res.data.childs : [];

                    }else{
                        notify.warn("网络或服务器异常！");
                    }
                }
            });

        },
        // 修改org path id [20,70,155]
        cutOrgPath:function(orgPath){
            var currentOrg = jQuery("#userEntry").attr("data-orgid");
            if(orgPath.length <= 2){
                return orgPath ;
            }else{
                // 从当前组织的上一组织开始显示
                var index = orgPath.indexOf(parseInt(jQuery("#userEntry").attr("data-orgid"),10)) - 1;
                return orgPath.slice(index);
            }
            return [];
        },
        loadTemplate:function() {
            var self  = this;
            jQuery.get(self.options.templateUrl,function(tmp){
                var tem = self.options;
                self.addHelper();
                tem.template = Handlebars.compile(tmp);
                self.loadData(null,jQuery(tem.node),true);
            });
        },
        addHelper:function(){
            var self = this;
            Handlebars.registerHelper('isTree1', function(type,options) {
                if(type === "group"){return options.fn();   }
            });

            Handlebars.registerHelper('status', function (type, status,hd_channel, options) {
                if(hd_channel&&hd_channel.length>0){
                    if (type === 1) {
                        if (status === 0) {
                            return 'dom dom-marked hd';
                        } else {
                            return 'dom hd';
                        }
                    } else {
                        if (status === 0) {
                            return 'marked hd';
                        } else {
                            return 'hd';
                        }
                    }

                } else {
                    if (type === 1) {
                        if (status === 0) {
                            return 'dom dom-marked';
                        } else {
                            return 'dom';
                        }
                    } else {
                        if (status === 0) {
                            return 'marked';
                        } else {
                            return '';
                        }
                    }
                } 
            });


            Handlebars.registerHelper('typeNameTransform', function(type,options) {
                if(type === "group"){
                    return "tree";  
                }else{
                    return "leaf";
                }
            });

            Handlebars.registerHelper('eq', function(value1,value2,options) {
                
                if(value2 === value1 ){
                    return options.fn();
                }else{
                    return options.inverse();
                }
            });

            Handlebars.registerHelper("mills2str", function(num) {
                // 依赖base.js Toolkit
                return Toolkit.mills2str(num);
            });
            Handlebars.registerHelper("isCode",function(str){
                if(str){
                    return "("+ str +")";
                }
            });

            Handlebars.registerHelper('hasNoRight', function(cameraScore,options) {
                var userScore = $("#userEntry").attr("data-score") - 0;
                return userScore < cameraScore ? "disabled" : "";
            });

            Handlebars.registerHelper('groupStatus', function(sharedStatus) {
                if(sharedStatus === 0){
                    return "";
                }else if(sharedStatus === 1){
                    return "shareToY";
                }else if(sharedStatus === 2){
                    return "shareToM";
                }
            });

            // 是否显示复选框
            Handlebars.registerHelper('showCheckBox', function(selectable, treeNeedSelectBox, type, selected, id, buildTypeId) {
                if (!selectable) {
                    return "";
                }
                // 类型为摄像机时
                if (type !== "group" && !self.options.showAllCameras) {
                    return new Handlebars.SafeString('<i class="checkbox ' + selected + '"></i>');
                }
                
                // 类型为摄像机时 需要勾选人脸摄像机时
                if (type !== "group" && self.options.showAllCameras && self.options.checkIpcCamera) {
                    var isSelect = self.options.camerasCache.indexOf(id-0) > -1 ? "selected" : selected;
                    return new Handlebars.SafeString('<i class="checkbox ' + isSelect + '"></i>');
                }

                // 类型为摄像机时
                if (type !== "group" && self.options.showAllCameras && !self.options.checkIpcCamera) {
                    return new Handlebars.SafeString('<i class="checkbox ' + selected + '"></i>');
                }
                // 类型为组织时，并且组织也需要复选框
                if (treeNeedSelectBox) {
                    return new Handlebars.SafeString('<i class="checkbox ' + selected + '"></i>');
                }

                return "";
            });
            // 是否是摄像机树
            Handlebars.registerHelper('ipcCamera', function() {
                if(self.options.showAllCameras){
                    return "";
                }

                return "ipcCamera";
            });
            Handlebars.registerHelper('hasNoRight', function(cameraScore,options) {
                var userScore = jQuery("#userEntry").attr("data-score") - 0;
                return userScore < cameraScore ? "disabled" : "";
            });
        },
        /*
        *   部门相关操作->更新左侧的树
        */
        // 删除[delete]  新增[create]  修改[edit]
        updateLiSpan:function (type,params) {
            var self = this;
            var el = jQuery(this.options.node).find("li[data-id="+params.id+"]");
            if(type === "delete"){
                var parent = el.closest("ul").closest("li");
                parent.children("ul").html("");
                parent.removeClass("active");
                parent.removeAttr("data-loaded");
                parent.children("i.fold").click();
                
            }else if(type ==="edit"){

                el.attr("data-id",params.id);
                el.attr("data-name",params.name);
                el.attr("data-departid",params.parentId);
                el.children("span.name").html(params.name);
                el.children("span").attr("title",params.name);

            }else if(type === "create"){
                
                // 如果当前部门已展开 就重新加载改节点
                if(el.children("i.fold").length !== 0){
                    if(el.attr("data-loaded")){
                        el.children("ul").html("");
                        el.removeAttr("data-loaded");
                        el.removeClass("active");
                        el.children("i.fold").click();
                    }
                }else{
                    // 在叶子节点下添加子部门
                    el.prepend("<i class='fold'></i>");
                    el.removeClass("leaf").addClass("tree");
                    el.attr("data-type","tree");
                    el.children("i.leaf").addClass("tree").removeClass("leaf");

                    el.children("i.fold").click(function(){
                        var current = jQuery(this).closest("li");
                        if(current.attr("data-type") === "tree"){
                            if(!current.attr("data-loaded")){
                                self.loadData({"id":current.attr("data-id")},current,false);
                            }else{
                                self.toggle(current.children("ul"));
                            }
                        }
                        current.toggleClass("active");
                        return false;
                    }).click();
                }
            }
            //this.updateScrollBar();
        },
        render:function(data){
            return this.options.template(data);
        },
        /*updateScrollBar:function(){
            this.options.scrollbar.tinyscrollbar_update('relative');
        },*/
        dropDown:function(event,ui){
            this.options.dropDown(event,ui);
        },
        bindEvent:function(parentNode,initFlag){
            var self = this;
            var target = parentNode.find("ul li.tree span");
            if(initFlag){
                target = parentNode.find("ul li span");
            }
            // 树节点 span单击事件
            target.on("click",function(event){
                self.addClickEffect(jQuery(this));
                self.processTreeClick(jQuery(this));
                return false;
            });

            // 树节点 span双击事件
            target.on("dblclick",function(event){
                self.processTreeDblClick(jQuery(this));
            });

            // + 点击事件
            target.closest("li").children("i.fold").click(function(){
                if (self.options.isLoading) {
                    notify.warn("资源正在加载，请稍后");
                    return false;
                }

                var current = jQuery(this).closest("li");
                if(current.attr("data-type") === "tree"){
                    if(!current.attr("data-loaded")){
                        self.loadData({"id":current.attr("data-id")},current,false);
                    }else{
                        self.toggle(current.children("ul"));
                    }
                }
                current.toggleClass("active");

                return false;
            });

            // 叶子节点单击事件
            parentNode.find("ul li.leaf span").on("click",function(event){
                var id = jQuery(this).closest("li").attr("data-id");
                if (permission.stopFaultRightById([id - 0])[0] === false) {
                    notify.info("暂无权限访问该摄像头");
                    return;
                }
                self.addClickEffect(jQuery(this));
                self.processLeafClick(jQuery(this),event);
                return false;
            });

            // 叶子节双击事件
            parentNode.find("ul li.leaf span").on("dblclick",function(event){
                self.processLeafDblClick(jQuery(this));
                return false;
            });


            // 叶子节点前的图片点击事件
            parentNode.find("ul li.leaf i.leaf").on("click",function(event){
                // 直接调用span的点击事件
                self.processLeafClick(jQuery(this).closest("li").children("span"));
                return false;
            });

            // self.options.callback(target);

            
            //拖动事件

            //parentNode.find("ul li.leaf span").draggable({
            //  cursorAt: { left: 5 },
            //  appendTo:"body",
            //  zIndex: 800,
            //  helper: function(event){
            //      // console.log(jQuery(event.currentTarget));
            //      // var el = jQuery("<div class='drag-helper-icon'></div>")
            //      // return el;

            //      var className = "drag-helper-icon";

            //      var el = jQuery(event.currentTarget).closest("li").children("i.leaf");
            //      if(el.hasClass("dom")){
            //          className = "drag-helper-icon-alt";
            //      }
            //      var helper = jQuery("<div class='"+className+"'></div>");

            //      // TODO 可以追加其他属性
            //      return helper;
            //  },
            //  stop:function(event,ui){
            //      self.dropDown(event,ui);
            //  }

            //});
                
            

            // 选择框点击事件
            if(self.options.selectable){
                parentNode.find("li>i.checkbox").click(function(){
                    var tem = jQuery(this),
                        isLeaf = jQuery(this).closest("li").hasClass("leaf"),
                       id = jQuery(this).closest("li").attr("data-id");
                    if (permission.stopFaultRightById([id - 0])[0] === false) {
                        notify.info("暂无权限访问该摄像头");
                        return;
                    }
                    // 如果需要触发叶子点击事件，则自动触发
	                if (self.options.checkboxTriggerLeaf && isLeaf) {
		                self.processLeafClick(jQuery(this).closest("li").children("span"));
	                } else if (self.options.checkboxTriggerOrg && !isLeaf) {
                        self.processTreeClick(jQuery(this).closest("li").children("span"));
                    } else {
		                tem.toggleClass("selected");
	                }
                    self.walkUp(tem);
                    self.walkDown(tem);
                    return false;
                });
            } 

            //搜索
            jQuery(self.options.searchNode).watch({
                wait: 500,
                captureLength: 0,
                callback: function(key) {
                    self.search({
                        queryKey: key
                    });
                    return false;
                }
            });
            //搜索按钮的点击事件-解决firefox下汉字输入不查询的问题
            jQuery(self.options.searchNode).off("click").on("click", function() {
                var value = jQuery(self.options.searchNode).val();
                //触发查询
                
                self.search({
                    queryKey: value
                });
            });

            // 自动展开当前部门
            setTimeout(function(){
                self.autoExpand();
            }, 500);
            
        },
        // 自动展开
        autoExpand:function(){

            var self = this;
            
            // 当前部门 暂不展开  length > 0 即可展开
            if(self.options.orgPathList.length > 0){
                jQuery(self.options.node).find("li").each(function(index,item){
                    if(jQuery(item).attr("data-id") === ("org_"+self.options.orgPathList[0])){
                        var el = jQuery(item);
                        self.options.orgPathList.shift();
                        el.children("i.fold").click();

                        if(el.attr("data-id") === ("org_" + self.options.orgId)){
                            // self.options.curOrgLevel = el.attr("data-tree-level");
                           // el.children("span").click();
                        }

                    }
                });
            }
            
        },
        /*
         *  向上查找
         */ 
        walkUp:function(item){
            var current = item;
            var caller = arguments.callee;
            if(current.closest("li").is("li.root") ){
                return;
            }
            if(current.closest("li").is("li") ){
                var parent = current.closest("li").closest("ul").closest("li").children("i.checkbox");
                if(! current.is(".selected")){
                    parent.removeClass("selected");
                    caller(parent);
                }else{
                    var result = true;
                    current.closest("li").siblings("li").children("i.checkbox").each(function(index,checkbox){
                        if(!jQuery(checkbox).is("i.selected")){
                            result = false;
                        }
                    });
                    if(result){
                        item.closest("li").closest("ul").closest("li").children("i.checkbox").addClass("selected");
                    }
                    caller(parent);
                }
            }
        },
        /*
         *  向下查找
         */
        walkDown:function(item){
            var caller = arguments.callee;
            var current = item;
            if(current.closest("li").is("li.tree")){
                if(! current.is(".selected")){
                    current.closest("li").children("ul").children("li").children("i.checkbox").each(function(index,tem){
                        var child = jQuery(tem);
                            child.removeClass("selected");
                            caller(child);
                        });
                }else{
                    current.closest("li").children("ul").children("li").children("i.checkbox").each(function(index,tem){
                        var child = jQuery(tem);
                            if(!child.is("i.selected")){
                                child.addClass("selected");
                            }
                            caller(child);
                        });
                }
            }
        },
        /*
         *  添加点击样式
         */
        addClickEffect:function(element) {
            var node = element.closest("li");
            (function(el) {
                if(!el.is(".cur")){
                    el.addClass("cur");
                }
                el.siblings("li").removeClass("cur").find("li").removeClass("cur");
                if (el.closest("ul").closest("li").attr("data-id")) {
                    arguments.callee(el.closest("ul").closest("li"));
                }
            })(node);
            // node.find("li").removeClass("cur");
            // 不改自己点选图标
            node.find("li").removeClass("cur");

        },
        /*
         *  处理叶子节点点击事件
         */
        processLeafClick:function(el,event){
            this.options.leafClick(el,event);
        },
        processLeafDblClick:function(el){
            this.options.leafDblClick(el);
        },
        processTreeClick:function(el){
            this.options.treeClick(el);
        },
        processTreeDblClick:function(el){
            this.options.treeDblClick(el);
        },
        /*
         *  控制元素的显示/隐藏
         */
        toggle:function(el){
            if(el.css("display") === "none"){
                el.css("display","block");
            }else{
                el.css("display","none");
            }
            //this.updateScrollBar();
        },
        /*
         *  向页面中添加html
         */
        appendHTML:function(receiveData,parentNode,context,init, key){
            parentNode.attr("data-loaded",1);
            var self = this;
            
            if (!self.options.showAllCameras) {
                receiveData = receiveData.filter(function(item) {
                    if(item.type === "group"){
                        return true;  
                    }else{
                        return item.buildTypeId === 1;
                    }
                });
            }
            
            if (receiveData.length === 0) {
                parentNode.append("<ul><li><div class='no-data'>暂无数据 !</div></li></ul>");
                return ;
            }

            var level = 1,
                key = key || "";

            if(!init){
                level = parseInt(parentNode.attr("data-tree-level"),10)+1;
            }
            
            if(context.options.selectable){
                if(parentNode.children("i.checkbox").is("i.selected") || ((init || key) && context.options.defaultSelected)){
                    parentNode.append(context.render({"cameras":receiveData, "treeNeedSelectBox": context.options.treeNeedSelectBox, "level":level,"init":init, "selected":"selected","selectable":context.options.selectable,"size":receiveData.length}));
                }else{
                    parentNode.append(context.render({"cameras":receiveData, "treeNeedSelectBox": context.options.treeNeedSelectBox, "level":level,"init":init, "selected":"","selectable":context.options.selectable,"size":receiveData.length}));
                }
            }else{
                parentNode.append(context.render({"cameras":receiveData,"level":level,"init":init, "selectable":context.options.selectable,"size":receiveData.length}));
            }

            //context.updateScrollBar();
            context.bindEvent(parentNode,init);
            
            var $chekbox = parentNode.find(".checkbox:last");
            self.walkUp($chekbox);
            // 数据加载完成之后，如果有回调函数，则执行回调函数
            typeof context.options.loadedCallback === "function" && context.options.loadedCallback();
        },
        /*
         *  加载数据
         */
        loadData:function(params,parentNode,initFlag){  
            // 解决click事件 防止重复请求
            parentNode.children("i.fold").unbind("click");

            var self = this,
                url = self.options.url+"?type="+self.options.type+"&isRoot=1",
                getRootFlag = false,
                requestType = "get"; 

            self.options.isLoading = true;
            if(initFlag){
                getRootFlag = true;
                url =  self.options.rootUrl+"?type="+self.options.type+"&isRoot=1";
            }

            if(self.options.queryKey !== ""){
                params.key = self.options.queryKey;
                url =  self.options.searchUrl;
                requestType = "get";
                self.options.queryKey = "";
            }

            if(self.options.isMarked !== ""){
                params.mark = self.options.isMarked;
                url =  self.options.searchCameraUrl;
                requestType = "get";
                self.options.isMarked = "";
            }

            if(self.requestObj && self.requestObj.status != 200){
                self.requestObj.abort();
            }

            self.requestObj = jQuery.ajax({
                url:url,
                type:requestType,
                data:params,
                dataType:'json', 
                setTimeout:60000,
                beforeSend:function(){
                    parentNode.append("<ul id='loading'><li><div class='no-data'><i class='loading-img'/></i>正在加载…</div></li></ul>");
                },
                success:function(res){
                    var receiveData = [];
                    if(getRootFlag){
                        if(res && res.code === 200 && res.data.cameras){
                            receiveData = res.data.cameras;
                            self.appendHTML(receiveData,parentNode,self,initFlag);
                        }else{
                            parentNode.attr("data-loaded",1);
                            parentNode.append("<ul><li><div class='no-data'>暂无数据 !</div></li></ul>");
                            //self.updateScrollBar();
                        }
                        // 如果传入了回调函数，则执行
                        typeof self.options.callback === "function" && self.options.callback();
                    }else{
                        if(res && res.code === 200 && res.data.cameras.length > 0){
                            receiveData = res.data.cameras;
                            if(params.key){
                                if(receiveData.length>49) {
                                    notify.warn("搜索到的结果较多，默认显示50条，请使用更精确的关键字查询其他结果！");
                                }
                                self.appendHTML(receiveData.splice(0,49), parentNode, self, initFlag, params.key);

                            }else{
                                self.appendHTML(receiveData,parentNode,self,initFlag);
                            }
                        }else{
                            parentNode.attr("data-loaded",1);
                            parentNode.append("<ul><li><div class='no-data'>暂无数据 !</div></li></ul>");
                            //self.updateScrollBar();
                        }
                    }

                    
                },
                complete:function(){
                    self.options.isLoading = false; 
                    
                    if(parentNode.children("ul#loading")){
                        parentNode.children("ul#loading").remove();
                    }
                    // 回复click事件
                    parentNode.children("i.fold").on("click",function(event){
                        // self.processTreeClick(jQuery(this));
                        var current = jQuery(this).closest("li");
                        if(current.attr("data-type") === "tree"){
                            if(!current.attr("data-loaded")){
                                self.loadData({"parentId":current.attr("data-id")},current,false);
                            }else{
                                self.toggle(current.children("ul"));
                            }
                        }
                        current.toggleClass("active");
                        return false;
                    });

                }
            });
        },
        /**
         * [getCameras 获取选中的摄像机]
         * @return {[type]} [description]
         */
        getTreeCameras: function() {
            var cameraTree = {
                    orgs: [],
                    cameras: []
                },
                $li,
                self = this;
            // 获取组织数据
            jQuery(self.options.node).find("li.tree").each(function() {
                var $li = jQuery(this),
                    thisCheck = $li.children(".checkbox.selected").length,
                    isRoot = $li.hasClass("root"),
                    parentTreeLevel = $li.attr("data-tree-level")-1,
                    $parentLi = $li.closest("li.tree[data-tree-level=" + parentTreeLevel + "]"),
                    parentCheck = $parentLi.children(".checkbox.selected").length;
                
                //如果当前树没有选中，则获取该树下的摄像机
                if (!thisCheck) {
                    cameraTree.cameras = cameraTree.cameras.concat(self.getCameras($li));
                    return;
                }

                //如果当前树是根目录，则添加
                if (isRoot) {
                    return cameraTree.orgs.push($li.attr("data-id").replace("org_", ""));
                }

                //如果父级树没有选中 或者 父级树是跟目录，则添加到数据集
                if (!parentCheck) { //  || $parentLi.hasClass("root")
                    return cameraTree.orgs.push($li.attr("data-id").replace("org_", ""));
                }
            });

            // 获取摄像机数据 搜索之后会用到
            jQuery(self.options.node).children("ul").children("li.leaf").each(function() {
                if (jQuery(this).children(".checkbox.selected").length) {
                    cameraTree.cameras.push(jQuery(this).attr("data-id")); 
                }
            })
            
            return cameraTree;
        },
        /**
         * [getCameras 获取选中的摄像机]
         * @param  {[type]} $li [当前未选中的树]
         * @return {[type]}     [description]
         */
        getCameras: function($li) {
            var cameras = [];
            $li.children("ul").children("li.leaf").each(function() {
                if (jQuery(this).children(".checkbox.selected").length) {
                    cameras.push(jQuery(this).attr("data-id")); 
                }
            })

            return cameras;
        },
    });

    return  DefenseCamera;
});
/**
 * Created by NetPosa on 2014/12/2.
 * 资源(摄像机)树
 */
define(["pubsub","jquery","mootools","handlebars"],function(PubSub){
    var CameraTree = new Class({
        Implements: [Events, Options],
        options: {
            url:"/service/resource/get_valid_camera_orgs_by_parent", //get_camera_orgs_by_parent,
            //url:"/works/get_camera_orgs_by_parent",
            //rootUrl:"/service/resource/get_root_camera",
            rootUrl:"/service/resource/get_root_camera",
            searchUrl:"/service/org/get_child_orgs_by_name",	//根据组织名搜索
            getParentsUrl:"/service/resource/get_org_path",  // 获取父节点路径
            templateUrl:"/module/maintenance/RealtimeInspection/inc/cameraTree.html",
            node:".treePanel",
            template:null,
            queryKey:"",
            scrollbar:null,
            scrollbarNode:"#aside .scrollbarPanel",
            selectable:false,
            defaultOrgs:[],
            defaultCameras:[],//编辑默认数据
            defaultRootId:0,
            orgId:null,
            mode:"create",	// "create", "edit" , "detail"
            orgPathList:[],
            leafClick:jQuery.noop,
            leafDblClick:jQuery.noop,
            treeClick:jQuery.noop,
            treeDblClick:jQuery.noop,
            checkboxClick:jQuery.noop,
            success:jQuery.noop,
            error:jQuery.noop,
            complete:jQuery.noop
        },
        initialize: function(options) {
            this.setOptions(options);
            var tem = this.options;
            jQuery(this.options.node).empty();
            this.loadTemplate();
            if(tem.orgId){
                this.getOrgPathList(tem.orgId);
            }


        },
        reload:function(options){
            var tem = this.options;
            jQuery(tem.node).empty();
            tem.queryKey ="";
            this.loadData({"parentId":tem.defaultRootId},jQuery(tem.node),true);
        },
        search:function (options) {
            this.setOptions(options);
            var tem = this.options;
            jQuery(tem.node).empty();
            if(tem.queryKey !==""){
                this.loadData({"name":tem.queryKey},jQuery(tem.node),false);
            }else{
                this.reload();
            }
        },
        getOrgPathList:function(currentOrgId){
            var self    = this,
                options = self.options;
            jQuery.get(options.getParentsUrl+"?orgId="+currentOrgId,function(res){
                if(res.code === 200){
                    options.orgPathList = res.data.orgPathList;
                }else{
                    notify.warn("网络或服务器异常！");
                }
            });
        },
        getMode : function(){
            return this.options.mode;
        },
        loadTemplate:function() {
            var self = this,
                tem  = self.options;
            jQuery.get(self.options.templateUrl,function(tmp){
                self.addHelper();
                tem.template = Handlebars.compile(tmp);
                // if(tem.mode ==="create"){
                //console.log(tem);
                self.loadData({"masterOrgId":self.options.defaultRootId},jQuery(tem.node),true);
                // }else if(tem.mode ==="edit"){
                // }

            });
        },
        addHelper:function(){
            Handlebars.registerHelper('isTree', function(type,options) {
                if(type === "tree"){return options.fn();	}
            });
            Handlebars.registerHelper("mills2str", function(num) {
                // 依赖base.js Toolkit
                return Toolkit.mills2str(num);
            });
            Handlebars.registerHelper("isBall", function(type) {
                return type === 1 ? "camera1" : "";
            });
            Handlebars.registerHelper('hasNo', function(number,options) {
                return number ? "(" + number + ")" : "";
            });
            Handlebars.registerHelper('isVirtual', function(strId,options) {
                if(strId && strId.indexOf("vorg")>0){
                    return "(本部)";
                }
            });
        },
        render:function(data){
            return this.options.template(data);
        },
        bindEvent:function(parentNode,initFlag){
            var self   = this,
                node   = initFlag ? "ul li span" : "ul li.tree span",
                target = parentNode.find(node);

            // 树节点 span 单击事件
            parentNode.on("click","span",function(event){
                var tem = jQuery(this);
                self.addClickEffect(tem);
                self.processTreeClick(tem);
                return false;
            });

            // 树节点 span 双击事件
            parentNode.on("dblclick","span",function(event){
                self.processTreeDblClick(jQuery(this));
            });

            // + 点击事件
            target.closest("li").children("i.fold").click(function(){
                var current = jQuery(this).closest("li"),
                    vId     = current.attr("data-virtual"),// ? current.attr("ata-virtual") : current.attr("data-id");
                    parma   = null;

                if(vId && vId.indexOf("vorg")>=0){
                    parma = {
                        "masterOrgId" : current.attr("data-id"),
                        "vOrgId"      : vId
                    }
                }else{
                    parma = {
                        "masterOrgId" : current.attr("data-id")
                    }
                }

                if(current.attr("data-type") === "tree"){
                    if(!current.attr("data-loaded")){
                        self.loadData(parma,current,false);
                    }else{
                        self.toggle(current.children("ul"));
                    }
                }
                current.toggleClass("active");
                return false;
            });

            // 叶子节点单击事件
            parentNode.on("click","ul li.leaf span",function(event){
                self.addClickEffect(jQuery(this));
                self.processLeafClick(jQuery(this),event);
                return false;
            });

            // 叶子节双击事件
            parentNode.on("dblclick","ul li.leaf span",function(event){
                self.processLeafDblClick(jQuery(this));
                return false;
            });


            // 叶子节点前的图片点击事件
            parentNode.on("click","ul li.leaf i.leaf",function(event){
                // 直接调用span的点击事件
                self.processLeafClick(jQuery(this).closest("li").children("span"),event);
                return false;
            });

            // 选择框点击事件
            if(self.options.selectable){
                parentNode.on("click","li>i.checkbox",function(){
                    var tem = jQuery(this);

                    self.processCheckboxClick(tem);

                    tem.toggleClass("selected");

                    self.walkUp(tem);
                    self.walkDown(tem);

                    return false;
                });
            }

            // 自动展开当前部门
            self.autoExpand();
        },

        autoExpand:function(){
            var self    = this,
                options = self.options;

            // 当前部门 暂不展开  length > 0 即可展开
            if(options.orgPathList.length > 1){

                jQuery(options.node).find("li").each(function(index,item){
                    var $item = jQuery(item);
                    if(parseInt($item.attr("data-id"),10) === parseInt(options.orgPathList[0],10)){
                        options.orgPathList.shift();
                        $item.children("i.fold").click();

                    }
                });
            }

        },

        /*
         *	向上查找
         */
        walkUp:function(item){
            var current = item;
            var caller = arguments.callee;
            if(current.closest("li").is("li.root") ){
                return;
            }
            if(current.closest("li").is("li") ){
                var parent = current.closest("li").closest("ul").closest("li").children("i.checkbox");
                if(!current.is(".selected")){
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
         *	向下查找
         */
        walkDown:function(item){
            var current   = item,
                caller    = arguments.callee,
                closestLi = current.closest("li"),
                checkbox  = closestLi.children("ul").children("li").children("i.checkbox");

            if(current.closest("li").is("li.tree")){
                if(!current.is(".selected")){
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
         *	获取改变的数据
         */
        getEditData:function(){

            var outData = [],
                self    = this;

            (function walk(item){

                //console.log("itemLength: " + item.length);
                //console.log(item);

                // item 为li元素

                var caller   = arguments.callee,
                    current  = item,
                    defalt   = current.attr("data-default"),
                    id       = current.attr("data-id"),
                    org      = current.attr("data-org") || "undefined",
                    checkbox = current.children("ul").children("li").children("i.checkbox");

                //console.log("itemLength: " + current.length);
                //console.log(current);

                //console.log("________________");

                //console.log(defalt);

                // 当前元素勾选
                // console.log(current.children("i.checkbox").has(".selected"));
                //console.log(current.children("i.checkbox").is(".selected"));
                if(current.children("i.checkbox").is(".selected")){
                    if(!current.attr("data-default")){

                        outData.push({
                            "id":current.attr("data-id"),
                            "resourceType":"2",
                            "isResource":"0",
                            "isReject":"0",
                            "isDelete":"0",
                            "vOrgId":current.attr("data-virtual"),  // 是否是虚拟组织，空为否
                            "orgId":org || current.parent("ul").parent("li").attr("data-org")
                        });
                        // console.log(org);
                    }
                    //console.log(org);
                }else{
                    // 当前元素（默认）-> 未勾选
                    if(current.attr("data-default")){

                        // 默认勾选被去掉 则 delete掉
                        outData.push({
                            "id":current.attr("data-id"),
                            "resourceType":"2",
                            "isResource":"0",
                            "isReject":"0",
                            "isDelete":"1",
                            "vOrgId":current.attr("data-virtual"),  // 是否是虚拟组织，空为否
                            "orgId":org || current.parent("ul").parent("li").attr("data-org")
                        });
                        //console.log(org);
                        // 遍历其子节点
                        current.children("ul").children("li").children("i.checkbox").each(function(index,tem){
                            var child = jQuery(tem),
                                li    = child.closest("li"),
                                id    = li.attr("data-id"),
                                org   = li.attr("data-org") || "undefined";

                            // 查找勾选的
                            if(child.is("i.selected")){
                                if(child.closest("li").attr("data-res") === "camera"){

                                    // console.log("摄像机："+li.attr("data-name")+"     >>默认非勾选")
                                    outData.push({
                                        "id":child.closest("li").attr("data-id"),
                                        "resourceType":"2",
                                        "isResource":"1",
                                        "isReject":"0",
                                        "isDelete":"0",
                                        "orgId":li.parent("ul").parent("li").attr("data-org")
                                    });
                                    //console.log(org);
                                }else{
                                    outData.push({
                                        "id":child.closest("li").attr("data-id"),
                                        "resourceType":"2",
                                        "isResource":"0",
                                        "isReject":"0",
                                        "isDelete":"0",
                                        "vOrgId":child.closest("li").attr("data-virtual"),  // 是否是虚拟组织，空为否
                                        "orgId":org
                                    });
                                    //console.log(org);
                                }

                            }else{
                                // 遍历展开过的
                                if(child.closest("li").attr("data-loaded")){
                                    caller(child.closest("li"));
                                }
                            }
                        });

                    }else{
                        current.children("ul").children("li").children("i.checkbox").each(function(index,tem){
                            var child  = jQuery(tem),
                                li     = child.closest("li"),
                                id     = li.attr("data-id"),
                                org    = li.attr("data-org") || "undefined",
                                res    = li.attr("data-res"),
                                loaded = li.attr("data-loaded"),
                                defalt = li.attr("data-default");

                            if(child.is("i.selected")){
                                // 摄像机 (筛选没有默认值的)
                                if(!child.closest("li").attr("data-default")){

                                    if(child.closest("li").attr("data-res") === "camera"){
                                        // console.log("摄像机："+child.closest("li").attr("data-name")+"     >>非默认勾选")
                                        outData.push({
                                            "id":child.closest("li").attr("data-id"),
                                            "resourceType":"2",
                                            "isResource":"1",
                                            "isReject":"0",
                                            "isDelete":"0",
                                            "orgId":li.parent("ul").parent("li").attr("data-org")
                                        });//console.log(org);

                                    }else{
                                        // 组织
                                        // console.log("组织-|："+child.closest("li").attr("data-name")+"     >>child 非默认勾选")

                                        if(!child.closest("li").attr("data-default")){
                                            outData.push({
                                                "id":child.closest("li").attr("data-id"),
                                                "resourceType":"2",
                                                "isResource":"0",
                                                "isReject":"0",
                                                "isDelete":"0",
                                                "vOrgId":child.closest("li").attr("data-virtual"),  // 是否是虚拟组织，空为否
                                                "orgId":org
                                            });//console.log(org);
                                        }

                                    }
                                }
                            }else{
                                // 子元素也没有勾选
                                if(child.closest("li").attr("data-default")){
                                    // 当前节点是摄像机
                                    if(child.closest("li").attr("data-res") === "camera"){
                                        outData.push({
                                            "id":child.closest("li").attr("data-id"),
                                            "resourceType":"2",
                                            "isResource":"1",
                                            "isReject":"0",
                                            "isDelete":"1",
                                            "orgId":li.parent("ul").parent("li").attr("data-org")
                                        });//console.log(org);
                                    }else{
                                        // 当前节点是组织
                                        if(child.closest("li").attr("data-loaded")){
                                            caller(child.closest("li"));
                                        }else{
                                            outData.push({
                                                "id":child.closest("li").attr("data-id"),
                                                "resourceType":"2",
                                                "isResource":"0",
                                                "isReject":"0",
                                                "isDelete":"1",
                                                "vOrgId":child.closest("li").attr("data-virtual"),  // 是否是虚拟组织，空为否
                                                "orgId":org
                                            });//console.log(org);
                                        }
                                    }

                                }else{
                                    if(child.closest("li").attr("data-loaded")){
                                        caller(child.closest("li"));
                                    }
                                }

                            }
                        });

                    }

                }

            })(jQuery(self.options.node).children("ul").children("li"));

            return outData;

        },
        /*
         *	获取新建数据
         */
        getCreateData:function(){
            var outData = [];
            var self = this;

            (function walk(item){

                // item 为li元素

                var caller = arguments.callee,
                    current = item;

                // 当前元素勾选
                if(current.children("i.checkbox").is(".selected")){
                    outData.push({
                        "id":current.attr("data-id"),
                        "resourceType":"2",
                        "isResource":"0",  // 是否为摄像机 0 是组织 1 摄像机
                        "isReject":"0",
                        "isDelete":"0",
                        "vOrgId":current.attr("data-virtual"),  // 是否是虚拟组织，空为否
                        "orgId":current.attr("data-org") || "undefined"
                    });
                }else{
                    current.children("ul").children("li").children("i.checkbox").each(function(index,tem){
                        var child = jQuery(tem),
                            li    = child.closest("li"),
                            id    = li.attr("data-id"),
                            org   = li.attr("data-org") || "undefined";

                        if(child.is("i.selected")){
                            // 摄像机
                            if(li.attr("data-res") === "camera"){
                                // console.log("摄像机："+child.closest("li").attr("data-name")+"     >>非默认勾选")
                                outData.push({
                                    "id":id,
                                    "resourceType":"2",
                                    "isResource":"1",
                                    "isReject":"0",
                                    "isDelete":"0",
                                    "orgId":li.parent("ul").parent("li").attr("data-org")
                                });
                            }else{
                                // 组织
                                // console.log("组织-|："+child.closest("li").attr("data-name")+"     >>child 非默认勾选")
                                outData.push({
                                    "id":id,
                                    "resourceType":"2",
                                    "isResource":"0",
                                    "isReject":"0",
                                    "isDelete":"0",
                                    "vOrgId":li.attr("data-virtual"),
                                    "orgId":org
                                });
                            }
                        }else{
                            // 只遍历展开过的
                            if(li.attr("data-loaded")){
                                caller(li);
                            }

                        }
                    });

                }

            })(jQuery(self.options.node).children("ul").children("li"));

            return outData;

        },

        getSelectedLeafs : function(){
            var self     = this,
                options  = self.options,
                node     = options.node,
                checkBox = $(node).find("li.leaf .checkbox.selected"),
                len      = checkBox.length,
                ids      = [];

            for(var i=0;i<len;i++){
                ids.push(checkBox.eq(i).closest("li").attr("data-id"));
            }

            return ids;
        },

        /*
         *	添加点击样式
         */
        addClickEffect:function(element) {
            var node = element.closest("li");
            (function(el) {
                var li = el.closest("ul").closest("li");

                if(!el.is(".cur")){
                    el.addClass("cur");
                }
                el.siblings("li").removeClass("cur").find("li").removeClass("cur");
                if (li.attr("data-id")) {
                    arguments.callee(li);
                }
            })(node);
            node.find("li").removeClass("cur");
        },
        /*
         *	处理叶子节点点击事件
         */
        processLeafClick:function(el,e){
            this.options.leafClick(el,e);
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
        processCheckboxClick:function(el){
            this.options.checkboxClick(el);
        },
        /*
         *	控制元素的显示/隐藏
         */
        toggle:function(el){
            if(el.css("display") == "none"){
                el.css("display","block");
            }else{
                el.css("display","none");
            }
        },
        /*
         *	输出改变的数据
         */
        getOutPutData:function(){
            var mode = this.options.mode;
            if(mode ==="create"){
                return this.getCreateData();
            }else if(mode ==="edit"){
                //console.log("Edit");
                return this.getEditData();
            }else{
                return [];
            }
        },
        /*
         *	初始化默认勾选改部门下的资源
         */
        selectEl:function(){
            // 默认将当前所在组织勾选
            var self = this;

            if(self.options.mode === "create"){
                // 默认勾选该组织

                if(self.options.orgId){
                    jQuery(self.options.node).find("li[data-id='"+self.options.orgId+"']").each(function(index,item){
                        var el = jQuery(item);
                        if(el.attr("data-res") === "org"){
                            var checkbox = el.children("i.checkbox");
                            if(!checkbox.hasClass("selected") && !checkbox.attr("data-check")){
                                checkbox.addClass("selected");
                                checkbox.attr("data-check","1");
                            }
                        }
                    });
                }

            }else{
                // 编辑状态，勾选默认值

                var orgs = self.options.defaultOrgs;
                var cameras = self.options.defaultCameras;
                var target;

                // 筛选组织
                for(var i = orgs.length-1;i>=0;i--){
                    // 默认组织勾选 并添加 data-default 属性
                    if(orgs[i].indexOf("vorg")>=0){
                        target = "li[data-virtual='"+orgs[i]+"']";
                    }else{
                        target = "li[data-id='"+orgs[i]+"']";
                    }
                    jQuery(self.options.node).find(target).each(function(index,item){
                        var el = jQuery(item);
                        if(el.attr("data-res") === "org"){
                            var checkbox = el.children("i.checkbox");
                            if(!checkbox.hasClass("selected") && !checkbox.attr("data-check")){
                                checkbox.addClass("selected");
                                checkbox.attr("data-check","1");
                            }
                            el.attr("data-default","1");
                        }
                    });
                }

                //筛选摄像机
                for(var j = cameras.length-1;j>=0;j--){

                    // 默认摄像机勾选 并添加 data-default 属性
                    jQuery(self.options.node).find("li[data-id='"+cameras[j]+"']").each(function(index,item){
                        var el = jQuery(item);
                        if(el.attr("data-res") === "camera"){
                            var checkbox = el.children("i.checkbox");
                            if(!checkbox.hasClass("selected") && !checkbox.attr("data-check")){
                                checkbox.addClass("selected");
                                checkbox.attr("data-check","1");
                            }
                            el.attr("data-default","1");
                        }
                    });
                }
            }



        },
        /*
         *	向页面中添加html
         */
        appendHTML:function(receiveData,receiveData2,parentNode,context,init){
            var self       = this,
                html,
                level      = 1,
                options    = self.options,
                success    = options.success,
                selectable = context.options.selectable,
                div;

            parentNode.attr("data-loaded",1);

            if(!init){
                level = parseInt(parentNode.attr("data-tree-level"))+1;
            }
            //console.log("Render Beg Time : " + (new Date()).getTime());
            if(selectable){
                if(parentNode.children("i.checkbox").is("i.selected")){
                    html = context.render({"orgs":receiveData,"level":level,"cameras":receiveData2,"init":init,"selected":"selected","selectable":selectable,"size":receiveData.length});
                }else{
                    html = context.render({"orgs":receiveData,"level":level,"cameras":receiveData2,"init":init,"selected":"","selectable":selectable,"size":receiveData.length});
                }
            }else{
                html = context.render({"orgs":receiveData,"level":level,"cameras":receiveData2,"init":init,"selectable":selectable,"size":receiveData.length});

            }

            div = document.createElement("div");
            div.innerHTML = html;

            //console.log("Render End Time : " + (new Date()).getTime());
            parentNode.append(html);
            //console.log("Append End Time : " + (new Date()).getTime());

            if(options.selectable){
                this.selectEl();
                if(parentNode.attr("data-default")){
                    this.walkDown(parentNode.children("i.checkbox"));
                }
            }

            // 向页面中添加成功 html 后回调，并触发事件，方便其他调用
            if(success){
                success();
                success = null;
            }
            parentNode.trigger("treeExpandSuccess",html);
            PubSub.publish("CameraTreeExpandSuccess");

            context.bindEvent(parentNode,init);
        },
        /*
         *	加载数据
         */
        loadData:function(params,parentNode,initFlag){

            // 解决click事件 防止重复请求
            parentNode.children("i.fold").unbind("click");

            var self        = this,
                options     = self.options,
                url         = options.url,
                getRootFlag = false,
                requestType = "get";

            if(parseInt(params.masterOrgId,10) === 0){
                url         = options.rootUrl;
                params      = null;
                getRootFlag = true;
            }
            if(options.queryKey !== ""){
                params.name = options.queryKey;
                url         = options.searchUrl;
                requestType = "post";
            }

            jQuery.ajax({
                url:url,
                type:requestType,
                data:params,
                dataType:'json',
                setTimeout:60000,
                beforeSend:function(){
                    parentNode.append("<ul id='loading'><li><div class='no-data'><i class='loading-img'/></i>正在加载…</div></li></ul>");
                },
                success:function(res){
                    var receiveData = [],cameras;
                    if(getRootFlag){
                        if(res && res.code === 200){
                            receiveData = res.data.orgList || [],
                                cameras = res.data.cameraList;
                            if(receiveData.length === 0 && (cameras === null || cameras.length ===0)){
                                parentNode.attr("data-loaded",1);
                                parentNode.append("<ul><li><div class='no-data'>暂无数据 !</div></li></ul>");

                            }else{
                                self.appendHTML(receiveData,cameras,parentNode,self,initFlag);
                            }

                        }

                    }else{
                        if(res && res.code === 200){
                            receiveData = res.data.orgList || [],
                                cameras = res.data.cameraList;
                            if(receiveData.length === 0 && (cameras === null || cameras.length ===0)){
                                parentNode.attr("data-loaded",1);
                                parentNode.append("<ul><li><div class='no-data'>暂无数据 !</div></li></ul>");
                            }else{
                                self.appendHTML(receiveData,cameras,parentNode,self,initFlag);
                            }


                        }
                    }
                },
                error:function(){
                    notify.warn("网络或服务器异常！");
                    parentNode.attr("data-loaded",1);
                    parentNode.append("<ul><li><div class='error-no-data'><p>网络或服务器异常,</p><p>摄像机列表加载失败！</p></div></li></ul>");
                    self.options.error();
                    parentNode.triggerHandler("treeExpandError");
                },
                complete:function(){
                    if(parentNode.find("ul#loading").length>0){
                        parentNode.find("ul#loading").remove();
                    }
                    // 回复click事件
                    parentNode.children("i.fold").on("click",function(event){
                        // self.processTreeClick(jQuery(this));
                        var current = jQuery(this).closest("li");
                        if(current.attr("data-type") === "tree"){
                            if(!current.attr("data-loaded")){
                                self.loadData({"masterOrgId":current.attr("data-id")},current,false);
                            }else{
                                self.toggle(current.children("ul"));
                            }
                        }
                        current.toggleClass("active");
                        return false;
                    });
                    self.options.complete();
                    parentNode.triggerHandler("treeExpandComplete");

                }
            });
        }
    });
    return CameraTree;
});
/*var CameraTree = new Class({
 Implements: [Events, Options],
 options: {
 url:"/service/resource/get_camera_orgs_by_parent",
 rootUrl:"/service/resource/get_root_camera",
 searchUrl:"",
 templateUrl:"/module/maintenance/common/inc/cameraTree.html",
 node:".treePanel",
 template:null,
 queryKey:"",
 scrollbar:null,
 scrollbarNode:"#aside .scrollbarPanel",
 selectable:false,
 defaultOrgs:[],
 defaultCameras:[],//编辑默认数据
 defaultRootId:0,
 orgId:null,
 mode:"create",	// "create", "edit" , "detail"
 leafClick:jQuery.noop,
 leafDblClick:jQuery.noop,
 treeClick:jQuery.noop,
 treeDblClick:jQuery.noop,
 checkboxClick:jQuery.noop,
 success:jQuery.noop,
 error:jQuery.noop,
 complete:jQuery.noop
 },
 initialize: function(options) {
 this.setOptions(options);
 // scrollbar 默认scroll容器的类名为 scrollbarPanel
 var tem = this.options;
 jQuery(tem.node).height(Object.prototype.toString.call(tem.nodeHeight) === "[object Function]" ? tem.nodeHeight() : tem.nodeHeight);
 jQuery(this.options.node).html("");
 this.loadTemplate();
 },
 loadTemplate:function() {
 var self  = this;
 jQuery.get(self.options.templateUrl,function(tmp){
 var tem = self.options;
 self.addHelper();
 tem.template = Handlebars.compile(tmp);

 // if(tem.mode ==="create"){
 self.loadData({"masterOrgId":self.options.defaultRootId},jQuery(tem.node),true);
 // }else if(tem.mode ==="edit"){
 // }

 });
 },
 addHelper:function(){
 Handlebars.registerHelper('isTree', function(type,options) {
 if(type == "tree"){return options.fn();	}
 });
 Handlebars.registerHelper("mills2str", function(num) {
 // 依赖base.js Toolkit
 return Toolkit.mills2str(num);
 });
 },
 render:function(data){
 return this.options.template(data);
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
 var current = jQuery(this).closest("li");
 if(current.attr("data-type") == "tree"){
 if(!current.attr("data-loaded")){
 self.loadData({"masterOrgId":current.attr("data-id")},current,false);
 }else{
 self.toggle(current.children("ul"));
 }
 }
 current.toggleClass("active");

 return false;
 });

 // 叶子节点单击事件
 parentNode.find("ul li.leaf span").on("click",function(event){
 self.addClickEffect(jQuery(this));
 self.processLeafClick(jQuery(this));
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

 // 选择框点击事件
 if(self.options.selectable){
 parentNode.find("li>i.checkbox").click(function(){
 var tem = jQuery(this);

 self.processCheckboxClick(tem);

 tem.toggleClass("selected");

 self.walkUp(tem);
 self.walkDown(tem);

 return false;
 });
 }
 },

 *//*
 *	向上查找
 *//*
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
 *//*
 *	向下查找
 *//*
 walkDown:function(item){
 var caller = arguments.callee;
 var current = item;
 if(current.closest("li").is("li.tree")){
 if(! current.is(".selected")){
 current.closest("li").children("ul").children("li").children("i.checkbox").each(function(index,tem){
 var child = jQuery(tem)
 child.removeClass("selected");
 caller(child);
 });
 }else{
 current.closest("li").children("ul").children("li").children("i.checkbox").each(function(index,tem){
 var child = jQuery(tem)
 if(!child.is("i.selected")){
 child.addClass("selected");
 }
 caller(child);
 });
 }
 }
 },
 *//*
 *	获取改变的数据
 *//*
 getEditData:function(){

 var outData = [];
 var self = this;

 (function walk(item){

 // item 为li元素

 var caller = arguments.callee;
 var current = item;

 // console.log(current.attr("data-name"));

 // 当前元素勾选
 if(current.children("i.checkbox").is(".selected")){
 if(!current.attr("data-default")){

 outData.push({
 "id":current.attr("data-id"),
 "resourceType":"2",
 "isResource":"0",
 "isReject":"0",
 "isDelete":"0",
 "orgId":current.attr("data-org")
 });
 }

 }else{
 // 当前元素（默认）-> 未勾选
 if(current.attr("data-default")){

 // 默认勾选被去掉 则 delete掉
 outData.push({
 "id":current.attr("data-id"),
 "resourceType":"2",
 "isResource":"0",
 "isReject":"0",
 "isDelete":"1",
 "orgId":current.attr("data-org")
 });

 // 遍历其子节点
 current.children("ul").children("li").children("i.checkbox").each(function(index,tem){
 var child = jQuery(tem);

 // 查找勾选的
 if(child.is("i.selected")){
 if(child.closest("li").attr("data-res") === "camera"){

 // console.log("摄像机："+child.closest("li").attr("data-name")+"     >>默认非勾选")
 outData.push({
 "id":child.closest("li").attr("data-id"),
 "resourceType":"2",
 "isResource":"1",
 "isReject":"0",
 "isDelete":"0",
 "orgId":child.closest("li").attr("data-org")
 });

 }else{
 outData.push({
 "id":child.closest("li").attr("data-id"),
 "resourceType":"2",
 "isResource":"0",
 "isReject":"0",
 "isDelete":"0",
 "orgId":child.closest("li").attr("data-org")
 });

 }

 }else{
 // 遍历展开过的
 if(child.closest("li").attr("data-loaded")){
 caller(child.closest("li"));
 }
 }
 });

 }else{
 current.children("ul").children("li").children("i.checkbox").each(function(index,tem){
 var child = jQuery(tem);

 if(child.is("i.selected")){
 // 摄像机 (筛选没有默认值的)
 if(!child.closest("li").attr("data-default")){

 if(child.closest("li").attr("data-res") === "camera"){
 // console.log("摄像机："+child.closest("li").attr("data-name")+"     >>非默认勾选")
 outData.push({
 "id":child.closest("li").attr("data-id"),
 "resourceType":"2",
 "isResource":"1",
 "isReject":"0",
 "isDelete":"0",
 "orgId":child.closest("li").attr("data-org")
 });

 }else{
 // 组织
 // console.log("组织-|："+child.closest("li").attr("data-name")+"     >>child 非默认勾选")

 if(!child.closest("li").attr("data-default")){
 outData.push({
 "id":child.closest("li").attr("data-id"),
 "resourceType":"2",
 "isResource":"0",
 "isReject":"0",
 "isDelete":"0",
 "orgId":child.closest("li").attr("data-org")
 });
 }

 }

 }

 }else{
 // 子元素也没有勾选
 if(child.closest("li").attr("data-default")){
 // 当前节点是摄像机
 if(child.closest("li").attr("data-res") === "camera"){

 outData.push({
 "id":child.closest("li").attr("data-id"),
 "resourceType":"2",
 "isResource":"1",
 "isReject":"0",
 "isDelete":"1",
 "orgId":child.closest("li").attr("data-org")
 });
 }else{
 // 当前节点是组织
 if(child.closest("li").attr("data-loaded")){
 caller(child.closest("li"));
 }else{
 outData.push({
 "id":child.closest("li").attr("data-id"),
 "resourceType":"2",
 "isResource":"0",
 "isReject":"0",
 "isDelete":"1",
 "orgId":child.closest("li").attr("data-org")
 });
 }
 }

 }else{
 if(child.closest("li").attr("data-loaded")){
 caller(child.closest("li"));
 }
 }

 }
 });

 }

 }

 })(jQuery(self.options.node).children("ul").children("li"));

 // console.log(outData.length)

 return outData;

 },
 *//*
 *	获取新建数据
 *//*
 getCreateData:function(){
 var outData = [];
 var self = this;

 (function walk(item){

 // item 为li元素

 var caller = arguments.callee;
 var current = item;

 // console.log(current.attr("data-name"));

 // 当前元素勾选
 if(current.children("i.checkbox").is(".selected")){
 outData.push({
 "id":current.attr("data-id"),
 "resourceType":"2",
 "isResource":"0",
 "isReject":"0",
 "isDelete":"0",
 "orgId":current.attr("data-org")
 });

 }else{

 current.children("ul").children("li").children("i.checkbox").each(function(index,tem){
 var child = jQuery(tem);

 if(child.is("i.selected")){
 // 摄像机
 if(child.closest("li").attr("data-res") === "camera"){
 // console.log("摄像机："+child.closest("li").attr("data-name")+"     >>非默认勾选")
 outData.push({
 "id":child.closest("li").attr("data-id"),
 "resourceType":"2",
 "isResource":"1",
 "isReject":"0",
 "isDelete":"0",
 "orgId":child.closest("li").attr("data-org")
 });

 }else{
 // 组织
 // console.log("组织-|："+child.closest("li").attr("data-name")+"     >>child 非默认勾选")

 outData.push({
 "id":child.closest("li").attr("data-id"),
 "resourceType":"2",
 "isResource":"0",
 "isReject":"0",
 "isDelete":"0",
 "orgId":child.closest("li").attr("data-org")
 });


 }

 }else{
 // 只遍历展开过的
 if(child.closest("li").attr("data-loaded")){
 caller(child.closest("li"));
 }

 }
 });

 }

 })(jQuery(self.options.node).children("ul").children("li"));

 // console.log(outData.length)

 return outData;

 },

 *//*
 *	添加点击样式
 *//*
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
 node.find("li").removeClass("cur");
 },
 *//*
 *	处理叶子节点点击事件
 *//*
 processLeafClick:function(el){
 this.options.leafClick(el);
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
 processCheckboxClick:function(el){
 this.options.checkboxClick(el);
 },
 *//*
 *	控制元素的显示/隐藏
 *//*
 toggle:function(el){
 if(el.css("display") == "none"){
 el.css("display","block");
 }else{
 el.css("display","none");
 }
 },
 *//*
 *	输出改变的数据
 *//*
 getOutPutData:function(){
 if(this.options.mode ==="create"){
 return this.getCreateData();
 }else if(this.options.mode ==="edit"){
 return this.getEditData();
 }else{
 return [];
 }
 },
 *//*
 *	初始化默认勾选改部门下的资源
 *//*
 selectEl:function(){
 // 默认将当前所在组织勾选
 var self = this;

 if(self.options.mode === "create"){
 // 默认勾选该组织

 if(self.options.orgId){
 jQuery(self.options.node).find("li[data-id='"+self.options.orgId+"']").each(function(index,item){
 var el = jQuery(item);
 if(el.attr("data-res") == "org"){
 var checkbox = el.children("i.checkbox")
 if(!checkbox.hasClass("selected") && !checkbox.attr("data-check")){
 checkbox.addClass("selected");
 checkbox.attr("data-check","1");
 }
 }
 });
 }

 }else{
 // 编辑状态，勾选默认值

 var orgs = self.options.defaultOrgs;
 var cameras = self.options.defaultCameras;

 // 筛选组织
 for(var i = orgs.length-1;i>=0;i--){

 // 默认组织勾选 并添加 data-default 属性
 jQuery(self.options.node).find("li[data-id='"+orgs[i]+"']").each(function(index,item){
 var el = jQuery(item);
 if(el.attr("data-res") == "org"){
 var checkbox = el.children("i.checkbox")
 if(!checkbox.hasClass("selected") && !checkbox.attr("data-check")){
 checkbox.addClass("selected");
 checkbox.attr("data-check","1");
 }
 el.attr("data-default","1");
 }
 });
 }

 //筛选摄像机
 for(var j = cameras.length-1;j>=0;j--){

 // 默认摄像机勾选 并添加 data-default 属性
 jQuery(self.options.node).find("li[data-id='"+cameras[j]+"']").each(function(index,item){
 var el = jQuery(item);
 if(el.attr("data-res") == "camera"){
 var checkbox = el.children("i.checkbox")
 if(!checkbox.hasClass("selected") && !checkbox.attr("data-check")){
 checkbox.addClass("selected");
 checkbox.attr("data-check","1");
 }
 el.attr("data-default","1");
 }
 });
 }
 }



 },
 *//*
 *	向页面中添加html
 *//*
 appendHTML:function(receiveData,receiveData2,parentNode,context,init){
 var self = this,
 html;
 parentNode.attr("data-loaded",1);
 if(context.options.selectable){
 if(parentNode.children("i.checkbox").is("i.selected")){
 html = context.render({"orgs":receiveData,"cameras":receiveData2,"init":init,"selected":"selected","selectable":context.options.selectable,"size":receiveData.length});
 parentNode.append(html);
 }else{
 html = context.render({"orgs":receiveData,"cameras":receiveData2,"init":init,"selected":"","selectable":context.options.selectable,"size":receiveData.length});
 parentNode.append(html);
 }
 }else{
 html = context.render({"orgs":receiveData,"cameras":receiveData2,"init":init,"selectable":context.options.selectable,"size":receiveData.length});
 parentNode.append(html);
 }

 if(this.options.selectable){
 this.selectEl();
 }

 // 向页面中添加成功 html 后回调，并触发事件，方便其他调用
 if(self.options.success){
 self.options.success();
 self.options.success = null;
 }
 parentNode.trigger("treeExpandSuccess",html);

 context.bindEvent(parentNode,init);
 },
 *//*
 *	加载数据
 *//*
 loadData:function(params,parentNode,initFlag){

 // 解决click事件 防止重复请求
 parentNode.children("i.fold").unbind("click");

 var self = this,
 url = self.options.url,
 getRootFlag = false,
 requestType = "get";

 if(params.masterOrgId == 0){
 url =  self.options.rootUrl;
 params = null;
 getRootFlag = true;
 }
 if(self.options.queryKey != ""){
 params.name = self.options.queryKey;
 url =  self.options.searchUrl;
 requestType = "post";
 }

 jQuery.ajax({
 url:url,
 type:requestType,
 data:params,
 dataType:'json',
 setTimeout:60000,
 beforeSend:function(){
 parentNode.append("<ul id='loading'><li><div class='no-data'><i class='loading-img'/></i>正在加载…</div></li></ul>");
 },
 success:function(res){
 if(getRootFlag){
 if(res && res.code === 200){
 var receiveData = res.data.orgList,
 cameras = res.data.cameraList;
 if(receiveData.length === 0 && cameras.length ===0){
 parentNode.attr("data-loaded",1);
 parentNode.append("<ul><li><div class='no-data'>暂无数据 !</div></li></ul>");

 }else{
 self.appendHTML(receiveData,cameras,parentNode,self,initFlag);
 }

 }

 }else{
 if(res && res.code === 200){
 var receiveData = res.data.orgList,
 cameras = res.data.cameraList;
 if(receiveData.length === 0 && cameras.length ===0){
 parentNode.attr("data-loaded",1);
 parentNode.append("<ul><li><div class='no-data'>暂无数据 !</div></li></ul>");
 }else{
 self.appendHTML(receiveData,cameras,parentNode,self,initFlag);
 }


 }
 }
 },
 error:function(){
 notify.warn("网络或服务器异常！");
 parentNode.attr("data-loaded",1);
 parentNode.append("<ul><li><div class='error-no-data'><p>网络或服务器异常,</p><p>摄像机列表加载失败！</p></div></li></ul>");
 self.options.error();
 parentNode.triggerHandler("treeExpandError");
 },
 complete:function(){
 if(parentNode.find("ul#loading").length>0){
 parentNode.find("ul#loading").remove();
 }
 // 回复click事件
 parentNode.children("i.fold").on("click",function(event){
 // self.processTreeClick(jQuery(this));
 var current = jQuery(this).closest("li");
 if(current.attr("data-type") == "tree"){
 if(!current.attr("data-loaded")){
 self.loadData({"masterOrgId":current.attr("data-id")},current,false);
 }else{
 self.toggle(current.children("ul"));
 }
 }
 current.toggleClass("active");
 return false;
 });
 self.options.complete();
 parentNode.triggerHandler("treeExpandComplete");

 }
 });
 }
 });*/
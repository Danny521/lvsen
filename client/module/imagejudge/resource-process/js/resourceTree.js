/*
 *	左侧资源树
 */
define([
    'handlebars',
    'pubsub',
    'base.self',
    'scrollbar'
], function(Handlebars, PubSub){
    jQuery.ajaxSetup({
        cache: false,
        data: {
            t: new Date().getTime()
        }
    });

    var ResourceTree = new Class({
        Implements: [Events, Options],
        options: {
            url: "/service/pia/resource_expend",
            rootUrl: "/service/pia/resource_view",
            // rootUrl: "/assets/js/apps/imagejudge/resourceData.json",
            autoUpdUrl: "/service/pia/smart/status",
            // autoUpdUrl: "/assets/js/apps/imagejudge/taskDatas.json",
            templateUrl: "/module/imagejudge/resource-process/inc/resourceTree.html", //模板路径
            searchUrl: "/service/pia/resource_view",
            smartMarkUrl: "/service/pia/smart/reset",
            smartStopUrl: "/service/pia/smart/cancel",
            insertUrl: "/service/pia/save_file",
            node: "#resourceTreePanel", //容器选择符
            template: null,
            templateStatus: null,
            showImportPanel: true,
            queryKey: "",
            fileType: "", //	[1:视频	  2:图片  "":全部]
            scrollbar: null,
            scrollbarNode: "#resourceTree",
            selectable: false,
            defaultRootId: 0,
            currentResourceNode: null, //  保存当前选中的节点
            getRootDatas: null,
            delResoure: jQuery.noop,
            leafClick: jQuery.noop,
            treeClick: jQuery.noop,
            init: jQuery.noop
        },
        reloadTimer : null,
        storeData: null,
        afterReloadDomId : -1,//reload之前左侧资源树选中节点id
        initialize: function(options) {
            this.setOptions(options);
            // scrollbar 默认scroll容器的类名为 scrollbarPanel
            var tem = this.options;
            tem.scrollbar = jQuery(tem.node).html("").closest("div" + tem.scrollbarNode);
            tem.scrollbar.tinyscrollbar({
                thumbSize: 72
            });
            this.updateScrollBar();

            jQuery(this.options.node).empty();
            this.loadTemplate();
            var self = this;

            //屏幕自适应滚动条
            (function() {
                jQuery(window).resize(function(event) {
                    self.updateScrollBar();
                });
            })();
            PubSub.subscribe('saveNewVideoThumbnailSuccess', function(){

                //重新加在左侧资源树后让以前选中的视频重新获得样式 reloadTimer解决在reload中两次load的问题
                clearTimeout(self.reloadTimer);
                self.reloadTimer = setTimeout(function () {
                    self.reload();
                }, 100);
            });
            PubSub.subscribe("videoBeginSmart", function(){
                self.freshTreeDatas();
            })
        },

        /*
        *判断当前是否有智能标注的任务在运行
        */
        hasVideoSmarting : function(){
            var flag = false;
            $.each(jQuery("#resourceTreePanel ul li[data-filetype=1]"), function(index, node){
                if(!($(node).find('.rtask-status-waiting').hasClass('hidden')) || !($(node).find('.rtask-status-processing').hasClass('hidden'))){
                    flag = true;
                }
            })
            return flag;
        },
        /*
         * 刷新状态数据
         */
        freshTreeDatas: function() {
            var self = this;
            if (self.taskStautsTimeout) {
                clearTimeout(self.taskStautsTimeout);
            }
            self.taskStautsRequst = jQuery.ajax({
                url: self.options.autoUpdUrl,
                type: "get",
                success: function(res) {
                    if (res && res.code === 200) {
                        self.freshTreeStatus(res.data.tasks);
                    }
                },
                complete: function() {
                    //判断当前是否有智能标注的任务在运行
                    if(self.hasVideoSmarting()){
                        self.taskStautsTimeout = setTimeout(function() {
                            self.freshTreeDatas();
                        }, 5000);
                   }
                }
            });
        },
        /*
         *  刷新树状态
         */
        freshTreeStatus: function(dataFresh) {
            if (!dataFresh) {
                return;
            };

            var self = this,
                taskKey, progress, taskStatus, curNode, i;

            for (i = 0; i < dataFresh.length; i++) {
                taskKey = dataFresh[i].taskKey;
                progress = dataFresh[i].progress;
                taskStatus = dataFresh[i].taskStatus;

                curNode = jQuery("#resourceTreePanel ul li[data-taskkey=" + taskKey + "]");
                if (curNode.size() == 0) {
                    continue;
                };
                curNode.data("taskstatus", taskStatus);

                // 等待中(1) 待处理(2) 成功(4) 失败(8) 取消(16)
                curNode.find(".rtask-status-waiting").addClass("hidden");
                curNode.find(".rtask-status-processing").addClass("hidden");
                curNode.find(".rtask-status-finished").addClass("hidden");
                curNode.find(".rtask-status-failed").addClass("hidden");
                curNode.find(".rtask-status-stoped").addClass("hidden");
			switch (taskStatus) {
				case 1: //等待中
					curNode.find(".rtask-status-waiting").removeClass("hidden");
					break;
				case 2: //待处理
                    if(curNode.find(".planOuter").hasClass('hidden')){
                        curNode.find(".planOuter").removeClass('hidden');
                    }
                    curNode.find(".rtask-status-processing").removeClass("hidden");
                    curNode.find("span.rtask-status-processing").text("处理中：" + progress + "%");
                    curNode.find(".planOuter .planInner").width(progress + "%");
                    curNode.find(".planOuter .planInner").attr("title", (progress + "%"));
					break;
                case 4:
                    if(progress === 100){
                        progress = 99;
                    }
                    if(curNode.find(".planOuter").hasClass('hidden')){
                        curNode.find(".planOuter").removeClass('hidden');
                    }
                    curNode.find(".rtask-status-processing").removeClass("hidden");
                    curNode.find(".planOuter .planInner").width(progress + "%");
                    curNode.find(".planOuter .planInner").attr("title", (progress + "%"));
                    break;
				case 8: //失败
                    if(curNode.find(".planOuter .planInner").hasClass("goodBkColor")){
                        curNode.find(".planOuter .planInner").removeClass("goodBkColor");
                        curNode.find(".planOuter .planInner").addClass("badBkColor");
                    }
					curNode.find(".rtask-status-failed").removeClass("hidden");
					break;
				case 16: //取消
                    curNode.find(".planOuter").addClass('hidden');
					curNode.find(".rtask-status-stoped").removeClass("hidden");
					break;
                case 32: //成功
                    curNode.find(".planOuter").addClass('hidden');
                    curNode.find(".rtask-status-finished").removeClass("hidden");
                  //logDict.insertMedialog('m4', new Date().getTime() + '视频标注时间结束');
                    break;
			};
		};
	},

        /*
         *	重新加载数据
         */
        reload: function() {
            jQuery(this.options.node).empty();
            this.loadData({
                "parentId": this.options.defaultRootId,
                "type": this.options.fileType
            }, jQuery(this.options.node), true);

        },
        /*
         *	按文件类型搜索 @resourceType ["image"、"vedio"]
         */
        search: function(resourceType) {
            this.options.showImportPanel = false;
            if (resourceType === "image") {
                this.options.fileType = 2;
            } else if (resourceType === "vedio") {
                this.options.fileType = 1;
            } else {
                this.options.fileType = "";
            }
            this.reload();
        },

        loadTemplate: function() {
            var self = this;
            jQuery.get(self.options.templateUrl, function(tmp) {
                var tem = self.options;
                self.addHelper();
                tem.template = Handlebars.compile(tmp);

                self.loadData({
                    "parentId": self.options.defaultRootId,
                    "type": self.options.fileType
                }, jQuery(tem.node), true);

            });
        },
        addHelper: function() {
            Handlebars.registerHelper('isTree', function(type, options) {
                if (type === "tree") {
                    return options.fn();
                }
            });
            Handlebars.registerHelper("mills2str", function(num) {
                // 依赖base.js Toolkit
                return Toolkit.mills2str(num);
            });
            Handlebars.registerHelper("eq", function(val1, val2, options) {
                if (val1 === val2) {
                    return options.fn();
                } else {
                    return options.inverse();
                }
            });

            Handlebars.registerHelper("isType", function(val1, val2, options) {
                if (Number(val1) === val2) {
                    return options.fn(this);
                } else {
                    return options.inverse(this);
                }
            });
            Handlebars.registerHelper("getImagePath", function(type, path) {
                if (type === '2') {
                        if(path){
                            return path
                        }else{
                        return '/module/imagejudge/resource-process/images/imageIcon.png'
                    }
                } else {
                    if(path){
                        return path;
                    }else{
                        return  '/module/imagejudge/resource-process/images/videoIcon.png';
                    }
                }
            });
        },
        render: function(data) {
            return this.options.template(data);
        },
        updateScrollBar: function() {
            this.options.scrollbar.tinyscrollbar_update('relative');
        },
        bindEvent: function(parentNode, initFlag) {
            var self = this;
            var target = parentNode.find("ul li.tree span");
            if (initFlag) {
                target = parentNode.find("ul li span");
            }

            // 删除按钮点击事件
            parentNode.find("ul>li>div").children("a.close").click(function() {
                var current = jQuery(this).closest("li");
                var id = current.attr("data-id");
                // type[1:文件夹	2:文件 ]
//                var type = current.attr("data-type") === "tree" ? 1 : 2;
                self.options.delResoure({
                    "ids": current.attr("data-cid")||current.attr("data-pid")
//                    "type": type
                }, current);
                return false;
            });


            // 叶子节点单击事件
            parentNode.find("ul li.leaf").on("click", function(event) {
                self.afterReloadDomId = jQuery(this).data('id');
                self.prevSelectNodeId = jQuery("#resourceTreePanel ul li.active").attr("data-id");
                jQuery(this).addClass("active");
                jQuery(this).siblings("li").removeClass("active");
                jQuery(self.options.node).find("li").removeClass("graybg");
                jQuery(this).closest("li").addClass("graybg");
                self.processLeafClick(jQuery(this));
                return false;
            });

            parentNode.find("ul li.tree").on("click", function(event) {
                jQuery(self.options.node).find("li").removeClass("graybg");
                jQuery(this).closest("li").addClass("graybg").children("i.tree").click();
                self.options.treeClick(jQuery(this));
                return false;
            });


            // 树节点前的图片点击事件
            parentNode.find("ul li.tree i.tree,ul li.root i.root").on("click", function(event) {

                var current = jQuery(this).closest("li");

                if (current.attr("data-type") === "tree") {

                    if (!current.attr("data-loaded")) {
                        self.loadData({
                            "parentId": current.attr("data-id"),
                            "type": self.options.fileType
                        }, current, false);
                    } else {
                        self.toggle(current.children("ul"));
                    }
                }

                current.toggleClass("active");
                return false;
            });

            self.smartEvent();



            // 选择框点击事件
            if (self.options.selectable) {
                parentNode.find("li>i.checkbox").click(function() {
                    var tem = jQuery(this);
                    tem.toggleClass("selected");

                    self.walkUp(tem);
                    self.walkDown(tem);

                    return false;
                });
            }
        },
        smartEvent: function() {
            var self = this;
            var parentNode = jQuery("#resourceTree");

            // 重新分析事件
            parentNode.find(".do_tree .redo").on("click", function() {
                var dataJson = jQuery(this).closest("li").attr("data-id");
                var msg = '是否重新分析 \" <em style = "color:#414141;font-weight:bold">' + jQuery(this).closest("li").attr("data-name") + '\"</em> 任务?';
                new ConfirmDialog({
                    title: '提示',
                    message: msg,
                    callback: function() {
                        self.smartMarkImpt(dataJson);
                    }
                });
            });

            // 停止任务事件
            parentNode.find(".do_tree .stop-do").on("click", function() {
                var dataJson = jQuery(this).closest("li").attr("data-taskkey");
                var msg = '是否停止 \" <em style = "color:#414141;font-weight:bold">' + jQuery(this).closest("li").attr("data-name") + '\"</em> 任务?';
                new ConfirmDialog({
                    title: '提示',
                    message: msg,
                    callback: function() {
                        self.smartStopImpt(dataJson);
                    }
                });
            });

            //查看结果
            parentNode.find(".do_tree .forlook").on("click", function() {
                var cId = jQuery(this).closest("li.leaf").attr("data-cid");
                var pId = jQuery(this).closest("li.leaf").attr("data-pid");
                if (cId) {
                    var objs = {
                        "id": cId,
                        "name": jQuery(this).closest("li.leaf").attr("data-name"),
                        "type": jQuery(this).closest("li.leaf").attr("data-filetype")
                    };
                    window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/"+"cloudbox/index.html?type=4&id=" + objs.id + "&name=" + objs.name);
                }
                if (pId) {
                    var objs = {
                        "id": pId,
                        "name": jQuery(this).closest("li.leaf").attr("data-name"),
                        "type": jQuery(this).closest("li.leaf").attr("data-filetype")
                    };
                    if(jQuery(this).closest("li.leaf").attr("data-incidentId")){
                        objs.incidentid = jQuery(this).closest("li.leaf").attr("data-incidentId");
                        objs.incidentName = jQuery(this).closest("li.leaf").attr("data-incidentName");
                        window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/"+"viewlibs/workbench/index.html?incidentid="+objs.incidentid+"&incidentname="+objs.incidentName+"&fileid=" + objs.id + "&filename=" + objs.name + "&filetype=" + objs.type + "&home=workbench&pagetype=traillist&orgid=");
                    }else{
                        window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/"+"viewlibs/workbench/index.html?fileid=" + objs.id + "&filename=" + objs.name + "&filetype=" + objs.type + "&home=workbench&pagetype=structlist&orgid=");
                    }

                }
            });
        },
        /*
         *  智能标注重新分析接口
         */
        smartMarkImpt: function(dataJson) {
            var self = this;
            jQuery.ajax({
                url: self.options.smartMarkUrl + "/" + dataJson,
                type: "post",
                dataType: "json",
                success: function(res) {
                    if (res && res.code === 200) {
                        notify.success("添加任务成功");
                        self.reload();
                    } else {
                        notify.error("添加任务失败!");
                    }
                }
            });
        },
        /*
         * 智能标注取消接口
         */
        smartStopImpt: function(dataJson, callback) {
            var self = this;
            jQuery.ajax({
                url: self.options.smartStopUrl + "/" + dataJson,
                type: "post",
                dataType: "json",
                success: callback ? callback : function(res) {
                    if (res && res.code === 200) {
                        notify.success("停止任务成功");
                        self.reload();
                    } else {
                        notify.error("停止任务失败!");
                    }
                }
            });
        },
        /*
         *	向上查找
         */
        walkUp: function(item) {
            var current = item;
            var caller = arguments.callee;
            if (current.closest("li").is("li.root")) {
                return;
            }
            if (current.closest("li").is("li")) {
                var parent = current.closest("li").closest("ul").closest("li").children("i.checkbox");
                if (!current.is(".selected")) {
                    parent.removeClass("selected");
                    caller(parent);
                } else {
                    var result = true;
                    current.closest("li").siblings("li").children("i.checkbox").each(function(index, checkbox) {
                        if (!jQuery(checkbox).is("i.selected")) {
                            result = false;
                        }
                    });
                    if (result) {
                        item.closest("li").closest("ul").closest("li").children("i.checkbox").addClass("selected");
                    }
                    caller(parent);
                }
            }
        },
        /*
         *	向下查找
         */
        walkDown: function(item) {
            var caller = arguments.callee;
            var current = item;
            if (current.closest("li").is("li.tree")) {
                if (!current.is(".selected")) {
                    current.closest("li").children("ul").children("li").children("i.checkbox").each(function(index, tem) {
                        var child = jQuery(tem);
                        child.removeClass("selected");
                        caller(child);
                    });
                } else {
                    current.closest("li").children("ul").children("li").children("i.checkbox").each(function(index, tem) {
                        var child = jQuery(tem);
                        if (!child.is("i.selected")) {
                            child.addClass("selected");
                        }
                        caller(child);
                    });
                }
            }
        },

        /*
         *	添加点击样式
         */
        addClickEffect: function(element) {
            var node = element.closest("li");
            (function(el) {
                if (!el.is(".cur")) {
                    el.addClass("cur");
                }
                el.siblings("li").removeClass("cur").find("li").removeClass("cur");
                if (el.closest("ul").closest("li").attr("data-id")) {
                    arguments.callee(el.closest("ul").closest("li"));
                }
            })(node);
            node.find("li").removeClass("cur");
        },
        /*
         *	处理叶子节点点击事件
         */
        processLeafClick: function(el) {
            this.options.leafClick(el);
            this.updateScrollBar();

        },
        processLeafDblClick: function(el) {
            this.options.leafDblClick(el);
        },
        processTreeClick: function(el) {
            this.options.treeClick(el);
        },
        processTreeDblClick: function(el) {
            this.options.treeDblClick(el);
        },
        /*
         *	控制元素的显示/隐藏
         */
        toggle: function(el) {
            if (el.css("display") === "none") {
                el.css("display", "block");
            } else {
                el.css("display", "none");
            }
            this.updateScrollBar();
        },
        /*
         *	加载数据
         */
        loadData: function(params, parentNode, initFlag) {

            // 解决click事件 防止重复请求
            parentNode.children("i.fold").unbind("click");

            var self = this,
                url = self.options.url,
                getRootFlag = false,
                requestType = "get";

            if (initFlag) {
                url = self.options.rootUrl;
            }

            if (self.options.queryKey !== "") {
                params.type = self.options.queryKey;
                url = self.options.searchUrl;
                requestType = "post";
            }

            jQuery.ajax({
                url: url,
                type: requestType,
                data: params,
                // dataType:'json',
                setTimeout: 60000,
                beforeSend: function() {
                    parentNode.append("<ul id='loading'><li><div class='no-data'><i class='loading-img'/></i>正在加载…</div></li></ul>");
                },
                success: function(res) {

                    if (res && res.code === 200) {
                        if(!res.data.resources){
                            return;
                        }
                        self.options.getRootDatas = res.data.resources;
                        if (res.data.resources.length === 0) {
                            parentNode.attr("data-loaded", 1);
                            parentNode.append("<ul><li><div class='no-data'>暂无资源 !</div></li></ul>");
                            self.updateScrollBar();
                        } else {
                            self.appendHTML(res.data.resources, parentNode, self, initFlag);
                        };
                    } else {
                        notify.warn("获取资源列表失败！状态码：" + res.code);
                    };
                },
                error: function(xhr, textStatus, errorThrown) {
                    // 如果http状态为200，说明后台返回数据成功，但数据格式错误
                    if (xhr.status === 200) {
                        notify.warn('获取资源列表失败！ 数据格式错误');
                    }
                    // 其它状态为HTTP错误状态
                    else {
                        (xhr.status !== 0) && notify.warn('获取资源列表失败! HTTP状态码: ' + xhr.status);
                    };
                },
                complete: function() {

                    if (parentNode.children("ul#loading")) {
                        parentNode.children("ul#loading").remove();
                    }
                    parentNode.children("li").on("click", function() {
                        jQuery(this).addClass("active");
                        jQuery(this).siblings("li").removeClass("active");
                    });

                    // 回复click事件
                    parentNode.children("i.fold").on("click", function(event) {
                        // self.processTreeClick(jQuery(this));
                        var current = jQuery(this).closest("li");
                        if (current.attr("data-type") === "tree") {
                            if (!current.attr("data-loaded")) {
                                self.loadData({
                                    "masterOrgId": current.attr("data-id")
                                }, current, false);
                            } else {
                                self.toggle(current.children("ul"));
                            }
                        }
                        current.toggleClass("active");
                        return false;
                    });


                    // 当数据加载完毕后触发 dataLoaded事件
                    self.fireEvent("dataLoaded", [self.options.getRootDatas]);
                }
            });
        },
        /*
         *	向页面中添加html
         */
        appendHTML: function(receiveData, parentNode, context, init) {
            var self = this;
            parentNode.attr("data-loaded", 1);
            var level = 1;
            if (!init) {
                level = parseInt(parentNode.attr("data-tree-level")) + 1;
            }
            if (context.options.selectable) {
                if (parentNode.children("i.checkbox").is("i.selected")) {
                    parentNode.append(context.render({
                        "records": receiveData,
                        "level": level,
                        "init": init,
                        "selected": "selected",
                        "selectable": context.options.selectable,
                        "size": receiveData.length
                    }));
                } else {
                    parentNode.append(context.render({
                        "records": receiveData,
                        "level": level,
                        "init": init,
                        "selected": "",
                        "selectable": context.options.selectable,
                        "size": receiveData.length
                    }));
                }
            } else {
                parentNode.append(context.render({
                    "records": receiveData,
                    "level": level,
                    "init": init,
                    "selectable": context.options.selectable,
                    "size": receiveData.length
                }));
            }

            context.updateScrollBar();
            context.bindEvent(parentNode, init);

            // 获取任务状态
            this.freshTreeDatas();

            // 当树加载完毕后出发此事件
            PubSub.publish("treeLoaded", self.afterReloadDomId);
            self.afterReloadDomId = -1;
        }
    });

    return ResourceTree;
})

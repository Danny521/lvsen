define(["broadcast", "/component/base/self/toolkit.js", "/component/base/self/notify.js", "/component/base/self/common.business.js", "jquery", "mootools", "handlebars", "underscore"], function(broadcast, toolkit) {
    // 重构导航高亮
    (function() {
        var Menu = new new Class({

            Implements: [Events, Options],

            options: {
                url: "/service/usr/module?parentId=",
                tpl: '{{#each modules}}<a class="item {{moduleName}} {{isCurrent current}} {{isDisplay}}" data-id="{{id}}" target="_self" href="{{url}}">{{name}}</a>{{/each}}',
                thirdMenuTpl: '{{#each modules}}<li class="item" data-id="{{id}}" target="_self" data-href="{{url}}">{{name}}</li>{{/each}}',
                callbacks: [
                    function(html) {
                        jQuery("#navigator .menu .right").siblings().remove();
                        jQuery("#navigator .menu .right").after(html);
                        jQuery(".inverted.black.menu.nav a").css({
                            "visibility": "visible"
                        });
                    },
                    function(html) {
                        jQuery("#header .menu .right").after(html);
                        jQuery("#header .menu .right").siblings().each(function(index) {
                            var self = $(this);
                            self.css({
                                "display": "inline-block"
                            })
                        });
                    }
                ],
                callback: jQuery.noop,
                filter: jQuery.noop
            },

            module: {
                inspect: "/module/inspect/surveillance/",
                deploy: "/module/protection-monitor/alarmmgr/",
                media: "/module/viewlibs/workbench/",
                imageprocess: "/module/imagejudge/resource-process/",
                maintain: "/module/maintenance/maintain/",
                config: "/module/settings/usermgr/",
                cloud: "/module/cloudbox/",
                permissionApply: "/module/permissionApply/"
            },

            // 定义地址栏与菜单项的字典 暂时没用
            map: {
                inspect: ["/module/inspect/surveillance/", "/module/inspect/tvwall/" ],
                deploy: ["/module/protection-monitor/alarmmgr/", "/module/protection-monitor/alarmanalysis/", "/module/protection-monitor/preventioncontrolmgr/"],
                media: ["/module/viewlibs/workbench/", "/module/viewlibs/caselib/", "/module/viewlibs/doubtlib/", "/module/viewlibs/peoplelib/", "/module/viewlibs/carlib/", "/module/viewlibs/statistic/"],
                imageprocess: ["/module/imagejudge/resource-process/?type=1", "/module/imagejudge/resource-process/?type=2","/module/imagejudge/inspectTarget/" ],
                maintain: ["/module/maintenance/maintain/", "/module/maintenance/reports/", "/module/maintenance/netdetection/", "/module/maintenance/logs/", "/module/maintenance/status-monitor/"],
                config: ["/module/settings/usermgr/", "/module/settings/devicemgr/", "/module/settings/taskmgr/", "/module/settings/mapconfig/"],
                cloud: ["/module/cloudbox/"],
                permissionApply: ["/module/permissionApply/"]
            },

            // 数据缓存
            data: [],
            mainMenu: window.localStorage.getItem('mainMenu'),
            // 权限缓存
            permission: null,

            // 当前所访问模块的数据
            current: null,

            // iframe存储静态链接的映射对象(代替sessionStorage从index首页进来时使用，因为在ie6,ie8下有问题)
            iframeStorageLinks: {
                "dispatch": "/module/inspect/dispatch/", // 视频指挥-->指挥调度
                "monitor": "/module/inspect/monitor/", // 视频指挥-->视频监控
                "tvwall": "/module/inspect/tvwall/", // 视频指挥-->电视墙
                "newStructAlarmmgr": "/module/protection-monitor/newStructAlarmmgr/", // 布防布控-->报警管理
                "alarmanalysis": "/module/protection-monitor/alarmanalysis/", // 布防布控-->报警分析
                "preventioncontrolmgr": "/module/protection-monitor/preventioncontrolmgr/", // 布防布控-->防控管理
                "gate": "/module/gate/vim/index.html", // 交通管理
                "pvb": "/module/pvb/index.html", // 视图库
                "imageprocess": "/module/imagejudge/resource-process/?type=1", // 图像研判-->图像处理
                "videoanalysis": "/module/imagejudge/resource-process/?type=2", // 图像研判-->视图分析
                "inspectTarget": "/module/imagejudge/inspectTarget/", // 图像研判-->目标排查
                "faceSearch": "/module/imagejudge/faceSearch/index.htm#query", // 图像研判-->人脸检索
                "RealtimeInspection": "/module/maintenance/RealtimeInspection/", // 运维管理-->实时巡检
                "maintain": "/module/maintenance/maintain/", // 运维管理-->视频巡检
                "reports": "/module/maintenance/reports/", // 运维管理-->报表统计
                "netdetection": "/module/maintenance/netdetection/", // 运维管理-->入网检测 暂时未用
                "logs": "/module/maintenance/logs/", // 运维管理-->日志管理
                "configdetection": "/module/maintenance/configdetection/works/configMonitor.html", // 运维管理-->配置检测
                "sipdetection": "/module/maintenance/sipdetection/src/works/watch.html", // 运维管理-->国标检测
                "user": "/module/settings/usermgr/", // 配置-->用户管理
                "devicemgr": "/module/settings/devicemgr/", // 系统配置-->设备管理
                "taskmgr": "/module/settings/taskmgr/", // 系统配置-->业务管理
                "mapconfig": "/module/settings/mapconfig/", // 系统配置-->地图配置
                "authorization": "/module/settings/authorization/", // 系统配置-->系统授权
                "mail": "/module/settings/mail/", // 系统配置-->联动配置
                "cloud": "/module/cloudbox/", // 云空间
                "permissionApply": "/module/permissionApply/",
                "usercenter": "/module/usercenter/" // 用户中心
            },
            initialize: function(options) {
                debugger
                toolkit.initGlobal(); // songxj new add
                this.setOptions(options);
                this.registerHelper();
                // 初始化一二级导航和iframe地址 // songxj new add
                this.renderNavigator({
                    refreshFirst: true,
                    refreshSecond: true,
                    norefreshIframe: false

                });
                // 注册事件 iframe的地址发生改变时通知父级窗口
                this.bindDealWindowLocationEvent(); // songxj new add
                // 注册事件 子页面中点击地图上的"全屏"或者"退出全屏"时通知父级窗口
                this.bindDealFullScreenEvent(); // songxj new add
                this.bindDealBrowserForwardBackEvent();
            },
            /**
             * [renderNavigator 初始化一二级导航和iframe地址]
             * @author songxj
             */
            renderNavigator: function(params) {
                debugger
                var self = this,
                    currentNav = self.getCurrentNav(params);
                // 显示一级导航 并且高亮当前一级导航
                self.showFirstNav(currentNav.firstNav, params.refreshFirst);
                // 显示二级导航 并且高亮当前二级导航
                params.refreshSecond && self.showSecondNav(currentNav.firstNav, currentNav.secondNav, currentNav.currentURL);
                // 设置ifram的src
                !params.norefreshIframe && self.updateIframeSrc(currentNav.currentURL);
                // 绑定导航的click事件
                self.bindNavClickEvent();
            },
            /**
             * [getCurrentNav 获取一二级导航和当前iframe的地址]
             * @author songxj
             * @return {[type]} [一二级导航、iframe地址的对象]
             */
            getCurrentNav: function(params) {
                var self = this,
                    url = decodeURIComponent(window.location.href),
                    currentModuleUrl,
                    formRealParams,
                    currentHash = window.location.hash,
                    currentHash = currentHash.substring(1),
                    iframeStorageCurrentLink = self.iframeStorageLinks[currentHash];

                // 若首页进来有hash，则让页面重定向（从而去掉hash）
                if (currentHash) {
                    if (navigator.userAgent.indexOf("MSIE") !== -1) { // IE浏览器
                        top.location.replace("/module/iframe/");
                    } else {
                        history.pushState(null, "", location.pathname);
                    }
                }

                // 检测是否通过window.open打开新页面(门户跳转链接、表单提交均走此处)
                if (!params.passWindowOpen && self.checkUrlParamsIsContain(url, "windowOpen=1")) {
                    currentModuleUrl = url.slice(url.indexOf("iframeUrl=") + 10);

                    // 检测是否通过表单提交(此处用于视图库中的搜索)
                    if (self.checkUrlParamsIsContain(url, "type=formSubmit")) {
                        formRealParams = currentModuleUrl.slice(currentModuleUrl.indexOf("type=formSubmit") + 16);
                        currentModuleUrl = currentModuleUrl.slice(0, currentModuleUrl.indexOf("&type=formSubmit"));
                        if (formRealParams) {
                            currentModuleUrl += "?" + formRealParams;
                        }
                    }

                    // 设置sessionStorage
                    sessionStorage.setItem("currentModule", currentModuleUrl);

                    // 将当前地址的参数去掉，以免在打开新页面后，点击一级导航出现问题
                    if (navigator.userAgent.indexOf("MSIE") !== -1) { // IE浏览器
                        top.location.replace("/module/iframe/");
                    } else {
                        history.replaceState(null,'',location.pathname);
                    }
                }

                if (iframeStorageCurrentLink) { // 从首页进来，根据hash,将映射表中的地址存入sessionStorage中
                    sessionStorage.setItem("currentModule", iframeStorageCurrentLink);
                }
                var currentModule = sessionStorage.getItem("currentModule");


                // 特殊处理：若用户新打开浏览器的tab页，并手动输入 ip/module/iframe/， 那么，跳转到pva首页
                url = url.slice(url.indexOf("/module"));
                if (!currentModule && url === ("/module/iframe/" || "/module/iframe")) {
                    location.href = "/module/index/index.html";
                    return;
                }

                var currentUrl = currentModule.substring(1).split("/");
                if (currentModule.indexOf("usercenter/") !== -1) { // 用户中心
                    currentUrl[1] = "usercenter";
                    currentUrl[2] = " ";
                }

                var paramsObj = Toolkit.paramOfUrl(currentModule);
                return {
                    currentURL: currentModule,
                    firstNav: params.firstNav || currentUrl[1], //一级导航
                    secondNav: params.secondNav || paramsObj.pagetype || currentUrl[2] //二级导航
                };
            },
            /**
             * [checkUrlParamsIsContain 检测当前页面url参数是否包含param参数]
             * @author songxj
             * @param  {[type]} url [当前页面url]
             * @param  {[paramStr]} url [要检测的参数]
             * @return {[type]}     [true:包含]
             */
            checkUrlParamsIsContain: function(url, paramStr) {
                if (url.indexOf(paramStr) === -1) {
                    return false;
                }

                return true;
            },
            /**
             * [stopBroadCastTellAllWindow 阻止广播通知所有window窗口（让其只通知当前窗口）]
             * @param  {[type]} currentUrl [description]
             * @return {[type]}            [description]
             */
            stopBroadCastTellAllWindow: function(currentUrl) {
                if (currentUrl !== jQuery("#pva-iframe")[0].contentWindow.location.href) {
                    return true;
                }
            },
            /**
             * [bindDealBrowserForwardBackEvent 绑定处理浏览器的前进后退情况]
             * @author songxj
             */
            bindDealBrowserForwardBackEvent: function() {
                var self = this;
                broadcast.on("dealBrowserForwardBack", function(data) {
                    // window.open的特殊处理：在页面加载完成时，通知当前iframe页面的父级进行一二级导航高亮（而不是所有的父级页面）
                    if (self.stopBroadCastTellAllWindow(data.url)) {
                        return;
                    }
                    // 一二级导航高亮
                    self.showFirstNav(data.firstNav, false);
                    var url = data.url.slice(data.url.indexOf("/module"));
                    self.showSecondNav(data.firstNav, data.secondNav, url);
                });
            },
            /**
             * [bindDealWindowLocationEvent 绑定处理window.location.href的情况，让一二级导航高亮]
             * @author songxj
             */
            bindDealWindowLocationEvent: function() {
                var self = this;
                broadcast.on("dealWindowLocation", function(data) {
                    // 阻止通知所有window窗口
                    if (self.stopBroadCastTellAllWindow(data.dataUrl)) {
                        return;
                    }

                    // 设置sessionStorage
                    sessionStorage.setItem("currentModule", data.dataUrl);
                    self.renderNavigator({
                        refreshFirst: false,
                        refreshSecond: true,
                        dataUrl: data.dataUrl,
                        firstNav: data.firstNav,
                        secondNav: data.secondNav,
                        norefreshIframe: data.norefreshIframe
                    });
                });
            },
            /**
             * [bindDealFullScreenEvent 绑定处理地图上的全屏和退出全屏情况，让一二级导航隐藏或者显示]
             * @author songxj
             */
            bindDealFullScreenEvent: function() {
                var self = this;
                broadcast.on("dealFullScreen", function(data) {
                    // 阻止通知所有window窗口
                    if (self.stopBroadCastTellAllWindow(data.url)) {
                        return;
                    }

                    if (data.fullscreenFlag) {
                        jQuery(".iframe").css("top", "0");
                        jQuery("#navigator,#header").hide();
                    } else {
                        jQuery(".iframe").css("top", "41px");
                        jQuery("#navigator,#header").show();
                    }
                });
            },
            /**
             * [showFirstNav 显示一级导航]
             * @author songxj
             * @param  {[type]} firstNavName [一级导航名称]
             */
            showFirstNav: function(firstNavName, refreshFirst) {
                var self = this;
                if (refreshFirst) {
                    // 先移除一级导航
                    jQuery("#navigator .menu .right").siblings().remove();
                    // 重新添加一级导航
                    jQuery("#navigator .menu .right").after(self.mainMenu);
                    jQuery(".inverted.black.menu.nav a").css({
                        "visibility": "visible"
                    });
                }
                jQuery("#cloudbox").hide();
                //删除后端返回的云空间数据 在右侧展示
                jQuery(".inverted .cloud").remove();
                // 高亮当前一级导航
                $('#navigator').find('a.item').each(function(index, val) {
                    // songxj new update
                    var href = jQuery(val).attr('data-url');
                    if (href && href.contains(firstNavName)) {
                        jQuery(val).addClass('active');
                    } else {
                        jQuery(val).removeClass('active');
                    }
                });
            },
            /**
             * [showSecondNav 显示二级导航]
             * @author songxj
             * @param  {[type]} firstNavName  [一级导航名称]
             * @param  {[type]} secondNavName [二级导航名称]
             */
            showSecondNav: function(firstNavName, secondNavName, url) {
                debugger
                var self = this;
                jQuery(".iframe").css("top", "41px");
                jQuery("#header").show();
                jQuery("#header .menu .right").siblings().remove();
                // 修改二级导航
                jQuery("#header .menu .right").after(window.localStorage.getItem(firstNavName));
                // 二级导航高亮
                $('#header').find('a.item').each(function(index, val) {
                    var href = jQuery(val).attr('data-url');
                    if (href && href.contains(secondNavName)) {
                        jQuery(val).addClass('active').siblings().removeClass("active");
                        return false;
                    }
                });
                // 修改二级模块名称
                self.updateSecondModuleName(firstNavName);
            },
            /**
             * 修改iframe的src
             * @author  songxj
             * @param  {[type]} src [iframe的路径]
             */
            updateIframeSrc: function(src) {
                if (src.indexOf("usercenter") !== -1) {
                    var param = src.substring(src.indexOf("usercenter/"));
                    src = "/module/settings/" + param;
                }

                if(src.indexOf("logs") !== -1) {
                    src = "/logs/";
                }
                jQuery("#pva-iframe").attr("src", src);
            },
            /**
             * 修改模块名称(header处)
             * @author songxj
             */
            updateSecondModuleName: function(firstNav) {
                var self = this;
                // 用户中心特殊处理
                if(firstNav && firstNav.indexOf("usercenter") !== -1) {
                    return jQuery("#badges").text("用户中心").attr("data-url", '/module/settings/usercenter/');
                }

                firstNav = firstNav+"/";
                $('#navigator a.item').each(function(index, val) {
                    var href = jQuery(val).attr('data-url');
                    if (href && href.contains(firstNav)) {
                        var moduleText = jQuery(val).text();
                        // 云空间模块名称特殊处理
                        if (moduleText === "我的云空间") {
                            moduleText = "云空间";
                        }
                        // 视图库模块名称特殊处理
                        if (moduleText === "视图库") {
                            moduleText = "视频图像信息库";
                        }
                        jQuery("#badges").text(moduleText).attr("data-url", href);
                        return false;
                    }
                });
            },
            /**
             * [clickNavCommon 一二级导航点击事件公共的方法]
             * @author songxj
             * @param  {[type]} elem [当前点击的元素]
             */
            clickNavCommon: function(elem) {
                
                var self = this;
                // 记录当前模块
                var currentUlr = elem.data("url");

                sessionStorage.setItem("currentModule", currentUlr);
                

                self.renderNavigator({
                    refreshFirst: false,
                    refreshSecond: true,
                    passWindowOpen: true,
                    currentUlr: currentUlr
                });
            },
            /**
             * 一二级导航点击事件
             * @author songxj
             */
            bindNavClickEvent: function() {
                var self = this;
                jQuery(document)
                .off("click", "#navigator a.item").on("click", "#navigator a.item", function(e) { // 一级导航事件
                    // 点击登陆用户
                    if (jQuery(this).attr("id") === "userEntry") {
                        return;
                    }
                    // 点击登出，不走此处逻辑
                    if (jQuery(this).attr("id") === "userLogout") {
                        return;
                    }
                    self.clickNavCommon(jQuery(this));
                })
                .off("click", "#header a.item").on("click", "#header a.item", function(e) { // 二级导航事件
                    if (jQuery(this).hasClass("xinzhou")) {
                        top.location.href = jQuery(this).attr("data-url");
                        return false;
                    }

                    // 图像研判-->图像处理，试图分析遵照内部的特殊处理，此处不做处理
                    if (jQuery(this).hasClass("navdisabled")) {
                        return false;
                    }
                    self.clickNavCommon(jQuery(this));
                })
                .off("click", "#navigator .about-icon").on("click", "#navigator .about-icon", function(e) { // 一级导航事件("关于"功能)
                    require(["/about/about.js"], function(About) {
                        About.showAbout();
                    });
                });

                jQuery(document)
                .off("mouseenter", "#header a.item").on("mouseenter", "#header a.item", function(e) { // 二级导航鼠标悬停事件，渲染三级导航
                    var id = jQuery(this).data("id");
                        ThirdModule = window.localStorage.getItem('ThirdModule'),
                        ThirdArray = [];
                        ThirdModule = JSON.parse(ThirdModule);
                    var Len = ThirdModule.length;
                        if(Len >0){
                            for(var i=0; i<Len; i++){
                                if((ThirdModule[i]["id"]+"").indexOf(id) >-1){
                                    ThirdArray.push(ThirdModule[i]);
                                }
                            }
                        }
                        //存在三级菜单
                        if(ThirdArray.length>0){
                            var ulString = "div"
                        }
                });
            },

           //判断当前页面是否是用户中心而使用不同打开方式
            userCenterPage: function (elem) {
                if (/settings\/usercenter/.test(jQuery('#pva-iframe').attr('src'))) {
                    location.href = elem.attr("href");
                } else {
                    elem.attr("target",'_blank')
                }
            },
            registerHelper: function() {
                Handlebars.registerHelper('isCurrent', function(current) {
                    return current ? "active" : "";
                });
            },
            toJSON: function(string) {
                function toJSON(string) {
                    var str = string;

                    if (typeof str === 'string') {
                        str = JSON.parse(string);
                    }
                    if (typeof str === 'string') {
                        return toJSON(str);
                    } else {
                        return str;
                    }
                }

                return toJSON(string);
            }
        });
    })();


    setTimeout(function() {
        // 用户中心不用改地址 还是用之前的静态地址  by chencheng on 2015-1-16
        if(window.location.href.indexOf("/module/settings/usercenter/") === -1){
           $("#badges").attr("href",$(".menu.atached.nav a:first").attr("href"));
        }

        $("#userEntry").removeClass("active");
        var lastChild = $(".ui.small.menu.nav .right.menu").find("a.last-child");
        if(window.location.toString().indexOf("/module/cloudbox/")>=0){
            lastChild.addClass("active");
        }
        // by songxj update
        //lastChild.attr("href", "/module/cloudbox/");
    }, 500);

    /**
     * 二级导航高亮
     */
    // var menuItem = JSON.parse(window.localStorage.getItem("activeMenu"));
    // if(menuItem){
    //     menuItem =  menuItem.viewlibs;
    //     jQuery("#header .menu a.item").each(function(index, el) {
    //         if (jQuery(el).attr("href").indexOf(menuItem) !== -1) {
    //             jQuery(el).addClass("active").siblings(".item").removeClass("active");
    //         }
    //     });
    // }

});

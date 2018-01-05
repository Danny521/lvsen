define([
    "jquery",
    "ajaxModel",
    "handlebars",
    "/component/base/self/notify.js", 
    "pvaConfig"
], function($, ajaxModel) {

    "use strict";

    var URL = {
            moduleUrl: window.projectMode === "develop" ? window.mockDataUrl + "/service/usr/module" : "/service/usr/module",
            getUser: window.projectMode === "develop" ? window.mockDataUrl + "/service/usr/get_usr" : "/service/usr/get_usr" 
        },
        //定义首页模块列表模板
        _indexTplString = '{{#each modules}}<li><a href="javascript:void(0);" class="icon_{{moduleName}}" data-target="{{moduleName}}" data-url="{{url}}"></a><span>{{name}}</span></li>{{/each}}',
        //定义一级导航模板
        _firstNavTplString = '{{#each modules}}<a class="item {{moduleName}}" data-id="{{id}}" target="_self" data-url="{{url}}">{{name}}</a>{{/each}}';

    var /**
         * 额外加载
         * @private
         */
        _loadExtra = function() {
            //绑定退出按钮事件
            require(["/component/base/self/loginout.js"]);
            //初始化三级导航
            require(["/component/base/self/thirdmenu.mgr.js"], function(ThirdMenu) {
                //初始化全局三级导航逻辑代码块
                ThirdMenu.initGlobal();
            });
        },
        /**
         * 渲染首页内容
         * @param tem - 请求的渲染模块信息
         * @private
         */
        _handleNavData = function(tem) {
            //过滤未授权时菜单紊乱问题[临时处理，后续基线会直接处理接口，add by zhangyu 2016.06.21]
            var modules = tem.data.modules;
            if(!modules || modules.length < 1) {
                return;
            }
            var childModule = modules[0].childModule;
            if(childModule){
                if(childModule.length === 1 && !childModule[0].childModule && modules[0].moduleName === "config" && childModule[0].moduleName === "authorization") {
                    modules[0].url = childModule[0].url;
                }
            }
            //存储模块信息
            window.localStorage.setItem("MenuList", JSON.stringify(tem));
            //渲染首页一级模块
            var modulesInfo = tem.data.modules;
            $("#indexModules").find(".firstList").html(Handlebars.compile(_indexTplString)({
                "modules": modulesInfo
            }));
            //首页事件绑定
            _bindEvents();
            //存储一级导航
            _saveFirstNav(modulesInfo);
            //将三级菜单的数据过滤出来，并写到 localstorage 中。
            window.setThirdMenu(tem);
        },
        /**
         * 存储一级导航相关信息
         * @param modulesInfo - 模块列表信息
         * @private
         */
        _saveFirstNav = function(modulesInfo) {
            //遍历模块列表
            $.each(modulesInfo, function(index, val) {
                if (val.childModule) {
                    //存储各层级导航（二级导航）
                    val.url && window.localStorage.setItem(val.url.split("/")[2], Handlebars.compile(_firstNavTplString)({
                        "modules": val.childModule
                    }));
                } else {
                    //如果没有二级模块，则存储为空
                    window.localStorage.setItem(val.url.split("/")[2], "");
                }
            });
            //存储一级导航
            window.localStorage.setItem("mainMenu", Handlebars.compile(_firstNavTplString)({
                "modules": modulesInfo
            }));
        },
        /**
         * 首页事件绑定
         * @private
         */
        _bindEvents = function() {
            //首页模块导航点击事件
            $("#indexModules").find("a").on("click", function () {
                var data = $(this).data(),
                    currentHash;
                // 模块链接特殊处理
                if (data.url.indexOf("/module/gate/vim/index.html") !== -1) { // 交通管理
                    currentHash = "gate";
                } else if (data.url.indexOf("/module/pvb/") !== -1) { // 视图库
                    currentHash = "pvb";
                } else if (data.url.indexOf("/module/imagejudge/resource-process/?type=1") !== -1) { // 图像研判-->图像处理
                    currentHash = "imageprocess";
                } else if (data.url.indexOf("/module/imagejudge/resource-process/?type=2") !== -1) { // 图像研判-->视图分析
                    currentHash = "videoanalysis";
                } else if (data.url.indexOf("/module/cloudbox/") !== -1) { // 云空间
                    currentHash = "cloud";
                }  else if (data.url.indexOf("/module/permissionApply/") !== -1) { // 权限申请
                    currentHash = "permissionApply";
                } else {
                    currentHash = data.url.substring(1).split("/")[2];
                }
                window.location.href = "/module/iframe/#" + currentHash;
            });

            // 首页用户名称点击事件 by songxj new add
            $(".index_welcome").on("click", ".welcome a", function () {
                window.location.href = "/module/iframe/#usercenter";
            });
            //关于按钮的点击事件
            $(".about").off("click").on("click", function () {
                require(["/about/about.js"], function (About) {
                    About.showAbout();
                });
            });
        },
        /**
         * 显示用户欢迎信息
         * @param userName - 当前登录的用户名
         * @private
         */
        _showWelcomeInfo = function(userName) {
             $(".index_welcome .welcome").html("<a data-url='/module/usercenter/'>" + userName + "</a> ,欢迎使用系统");
        },
        /**
         * 渲染登录统计信息
         * @private
         */
        _randerUserCount = function(userName) {
            _showWelcomeInfo(userName);
        },
        /**
         * AJAX请求加载模块，第一次登陆或者登出后登陆，没有localStorage的时候，用ajax请求来加载模块和存储localStorage
         * 获取当前用户的权限模块
         */
        _loadModules = function() {
            ajaxModel.getData(URL.moduleUrl, {
                //当parentId为0时说明是用户登录时的请求
                "parentId": "0"
            }, {}).then(function (res) {
                if (res.code === 200) {
                    _handleNavData(res);
                    //异步请求缓存用户信息
                    _loadUserInfo(res.data.userId);
                }
            });
        },
        /**
         * 异步请求缓存系统系统详细权限
         * @private
         */
        _loadValidFunctionList = function() {
            ajaxModel.getData("/service/usr/permission", {}, {}).then(function (res) {
                if (res.code === 200) {
                    window.localStorage.setItem("validFunctionList", JSON.stringify(res));
                }
            });
        },
        /**
         * 异步请求缓存用户信息
         * @param userId - 用户id
         * @private
         */
        _loadUserInfo = function(userId) {
            ajaxModel.getData(URL.getUser, {
                "id": userId
            },{}).then(function(res){
                if (res.code === 200) {
                    //缓存用户信息-用户id
                    window.localStorage.setItem("userId", userId);
                    //缓存用户信息-用户信息
                    window.localStorage.setItem("userInfo", JSON.stringify({
                        "id": res.usr.id,
                        "name": res.usr.name,
                        "loginName": res.usr.loginName,
                        "score": res.usr.score,
                        "stauts": res.usr.stauts,
                        "department" : res.usr.department,
                        "password": res.usr.password
                    }));
                    //渲染登录统计数据
                    _randerUserCount(res.usr.name);
                }
            });
        },
        /**
         * 刷新后的首页渲染，读取缓存信息
         * @private
         */
        _localLoadModules = function() {
            var permissionJson = JSON.parse(window.localStorage.getItem("permission")),
                tem = JSON.parse(window.localStorage.getItem("MenuList"));
            //渲染登录统计信息
            _randerUserCount(permissionJson.data.usr.name);
            //渲染首页模块列表
            $("#indexModules").find(".firstList").html(Handlebars.compile(_indexTplString)({
                "modules": tem.data.modules
            }));
            //绑定事件
            _bindEvents();
        },
        /**
         * 初始化首页
         * @private
         */
        _init = function() {
            //加载首页内容
            _loadModules();
            //加载权限
         //   _loadValidFunctionList();
        };

    //页面加载完成后的处理
    (function () {
        //额外加载
        _loadExtra();
        //初始化页面
        _init();
    }());
});

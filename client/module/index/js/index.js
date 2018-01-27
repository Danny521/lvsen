define([
    "jquery",
    "ajaxModel",
    "handlebars",
    "/component/base/self/notify.js", 
    "pvaConfig"
], function($, ajaxModel) {

    "use strict";

    var URL = {
            moduleUrl: window.projectMode === "develop" ? window.mockDataUrl + "/service/sys/menu/treeList" : "/service/sys/menu/treeList",
            userUrl: window.projectMode === "develop" ? window.mockDataUrl + "/service/sys/user/info" : "/service/sys/user/info"
        },
        //定义首页模块列表模板
        _indexTplString = '{{#each modules}}<li><a href="javascript:void(0);" class="icon_{{menuName}}" data-target="{{menuName}}" data-id="{{menuId}}"  data-url="{{url}}"></a><span>{{name}}</span></li>{{/each}}',
        //定义一级导航模板
        _firstNavTplString = '{{#each modules}}<a class="item {{menuName}}" data-id="{{menuId}}" target="_self" data-url="{{url}}">{{name}}</a>{{/each}}',
         //定义二级导航模板
         _secondNavTplString = '{{#each modules}}<a class="item {{menuName}}" data-id="{{menuId}}" target="_self" data-url="{{url}}">{{name}}</a><a class="split-line"></a>{{/each}}';

    var /**
         * 额外加载
         * @private
         */
        _loadExtra = function() {
            //绑定退出按钮事件
            require(["/component/base/self/loginout.js"]);
            // //初始化三级导航
            // require(["/component/base/self/thirdmenu.mgr.js"], function(ThirdMenu) {
            //     //初始化全局三级导航逻辑代码块
            //     ThirdMenu.initGlobal();
            // });
        },
        /**
         * 渲染首页内容
         * @param tem - 请求的渲染模块信息
         * @private
         */
        _handleNavData = function(tem) {
            var modules = tem.data[0].list;
            if(!modules || modules.length < 1) {
                return;
            }
            //存储模块信息
            window.localStorage.setItem("MenuList", JSON.stringify(modules));
            //渲染首页一级模块
            $("#indexModules").find(".firstList").html(Handlebars.compile(_indexTplString)({
                "modules": modules
            }));
            //首页事件绑定
            _bindEvents();
            //存储一二级导航
            _saveNav(modules);
            //将三级菜单的数据过滤出来，由于现在的设计没有三级导航，因此暂时不考虑
        //    window.setThirdMenu(tem);
        },
        /**
         * 存储一二级导航相关信息
         * @param modulesInfo - 模块列表信息
         * @private
         */
        _saveNav = function(modulesInfo) {
            //遍历模块列表
            $.each(modulesInfo, function(index, val) {
                if (val.list.length > 0) {
                    //存储各层级导航（二级导航）
                    val.url && window.localStorage.setItem(val.url.split("/")[2], Handlebars.compile(_secondNavTplString)({
                        "modules": val.list
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
                    currentHash =  data.url.substring(1).split("/")[2];
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
            ajaxModel.getData(URL.moduleUrl, {}, {}).then(function (res) {
                if (res.code === 200) {
                    _handleNavData(res);
                    //异步请求缓存用户信息
                    _loadUserInfo();
                }else{
                    notify.warn("获取模块信息失败！");
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
         * @private
         */
        _loadUserInfo = function() {
            ajaxModel.getData(URL.userUrl, {},{}).then(function(res){
                if (res.code === 200) {
                    //缓存用户信息-用户id
                    window.localStorage.setItem("userId", res.data.userId);
                    //缓存用户信息-用户权限
                //  window.localStorage.setItem("permission", JSON.stringify(res));
                    //缓存用户信息-用户信息
                    window.localStorage.setItem("userInfo", JSON.stringify({
                        "id": res.data.userId,
                        "name": res.data.username,
                        "loginName": res.data.account,
                        "status": res.data.status,
                        "roleIdList": res.data.roleIdList
                    }));
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
                "modules": tem
            }));
            //绑定事件
            _bindEvents();
        },
        /**
         * 初始化首页
         * @private
         */
        _init = function() {
            //如果已经存在缓存，则直接读取缓存
            if (window.localStorage.getItem("permission") && window.localStorage.getItem("MenuList")) {
                _localLoadModules();
            } else {
                //加载首页内容
                _loadModules();
                //加载权限
            //    _loadValidFunctionList();
            }
        };

    //页面加载完成后的处理
    (function () {
        //额外加载
        _loadExtra();
        //初始化页面
        _init();
    }());
});

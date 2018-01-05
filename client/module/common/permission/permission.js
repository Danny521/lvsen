/**
 * 权限和后端返回数据的 id 映射表，请保持不变,
 * 且以 下面 map.validFunctionList 中的映射表为准
 **/

var additive = "additive"; // 是否显示叠加型视频摘要，默认显示, additive = ""; 不显示

/**
 * @module Permission
 * @author LiangChuang
 * @version 0.9
 * @description 实战中权限的控制，主要包含 视图库 图像研判 云空间
 * @usage 如果动态插入了权限相关的元素，则 permission.reShow(); 即可
 **/
define(function() {
    var Permission = new Class({

        //Extends : Permission,

        Implements: [Events, Options],

        options: {
            /**
             * 权限获取 API
             */
            url: "/usr/permission",

            /**
             * 权限与 class 对应关系表
             */
            //map : '/assets/js/modules/permission/permission.json',

            /**
             * 权限与 class 对应关系表
             */
            map: {
                "validFunctionList": {
                    "5": "create",
                    "6": "review",
                    "7": "process",
                    "21": "browse",
                    "22": "delete",
                    "25": "analysis",
                    "28": "import",
                    "29": "download",

                    "36": "real-time-view",
                    "37": "one-channel",
                    "38": "four-channel",
                    "39": "nine-channel",
                    "40": "sixteen-channel",

                    // 已删除权限，为了保证稳定暂时未删，鉴定通过后即可删除 2015.05.06 梁创
                    "41": "frame-marker", // 标记管理 已删除
                    "42": "save-screenshot", // 截图保存 已删除
                    "43": "sendto-extended-screen", // 发送到扩展屏 已删除
                    "44": "manual-alarm", // 手动报警 已删除
                    "45": "server-record", // 服务器录像 已删除
                    "51": "preset-cruise", // 预置位巡航 已删除
                    "56": "map", // 地图模式 已删除

                    "46": "view-history", //历史录像查看
                    "47": "download-history",
                    "48": "set-preset",
                    "49": "delete-preset",
                    "50": "call-preset",

                    "146": "ptz-engross", //云台独占
                    "52": "ptz-control", //云台锁定
                    "53": "ptz-lock",
                    "54": "sendto-tvwall",
                    "55": "change-tvwall-layout",

                    "57": "set-defence-task",
                    "58": "set-ganged-rule",
                    "59": "export-alarm-msg",
                    "60": "export-stat",
                    "61": "edit-defence-task",
                    "62": "delete-defence-task",
                    "63": "new-surveillance-task",
                    "64": "edit-surveillance-task",
                    "65": "cancel-surveillance-task",
                    "66": "restore-surveillance-task",
                    "67": "delete-surveillance-task",
                    "68": "new-surveillance-lib",
                    "69": "edit-surveillance-lib",
                    "70": "delete-surveillance-lib",
                    "71": "new-surveillance-person",
                    "72": "edit-surveillance-person",
                    "73": "move-surveillance-person",
                    "74": "delete-surveillance-person",
                    "75": "import-surveillance-persons",
                    "76": "mdelete-surveillance-persons",
                    "77": "new-inspect-plan",
                    "78": "edit-inspect-plan",
                    "79": "delete-inspect-plan",
                    "80": "new-inspect-task",
                    "81": "edit-inspect-task",
                    "82": "delete-inspect-task",
                    "83": "inpect-map",
                    "84": "export-inspect-result",
                    "85": "export-inspect-table",
                    "86": "export-camera-categories",
                    "87": "view-logs",
                    "88": "export-logs",
                    "15": "net-testing",
                    "35": "config-testing",
                    "89": "new-orgnz",
                    "90": "edit-orgnz",
                    "91": "delete-orgnz",
                    "92": "delete-orgnz-forever",
                    "93": "restore-orgnz",
                    "135": "view-user",
                    "94": "new-user",
                    "95": "edit-user",
                    "96": "delete-user",
                    "97": "delete-user-forever",
                    "98": "restore-user",
                    "99": "new-role",
                    "100": "edit-role",
                    "101": "delete-role",
                    "102": "new-server",
                    "103": "edit-server",
                    "152": "delete-server",
                    "104": "distribute-server",
                    "105": "new-video-equip",
                    "106": "edit-video-equip",
                    "107": "delete-video-equip",
                    "108": "distribute-video-equip",
                    "109": "new-camera",
                    "110": "edit-camera",
                    "111": "delete-camera",
                    "112": "distribute-camera",
                    "113": "new-dict",
                    "114": "edit-dict",
                    "115": "delete-dict",
                    "116": "set-tvwall-layout",
                    "143": "delete-tvwall-layout",
                    "117": "maker-camera-point",
                    "200": "maker-camera-batch-import",
                    "118": "edit-camera-point",
                    "119": "delete-camera-point",
                    "120": "new-edefense",
                    "121": "delete-edefense",
                    "122": "view-edefense",
                    "126": "expand-defence-task",
                    "131": "show-defence-task",
                    "150": "mainten-real-time-view",
                    "151": "mainten-ptz-control",

                    "149": "defense-real-time-view",
                    "123": "alarminfo-real-time-view",
                    "155": "sync",

                    // 视频指挥改版新增权限 2015.05.06 梁创
                    "159": "toviewlabs-history", //历史录像入库
                    "160": "new-cruise", // 新建巡航计划
                    "161": "edit-cruise", // 编辑巡航计划
                    "162": "call-cruise", // 启用巡航计划
                    "163": "delete-cruise", // 删除巡航计划
                    "164": "dispatch", // 警力调度
                    "165": "line", // 警卫路线
                    "166": "defense-circle", // 防控圈
                    "167": "electronic-defense", // 电子防线
                    "168": "pursuit", // 全景追逃
                    "169": "trajectory-analysis", // 轨迹分析
                    "170": "gps-monitoring", // GPS监控
                    "171": "path-planning", // 路径规划
                    "172": "favorite", // 收藏夹
                    "173": "inspect-group", // 监巡分组
                    "174": "marker-management", // 标记管理
                    "176": "edit-ele-defense-area",//编辑电子防区
                    "177": "view-ele-defense-area",//查看电子防区
                    "199": "plat-map",//室内地图

                    //计划巡航
                    "201": "plan-cruise-new-task",
                    "202": "plan-cruise-start-task",
                    "203": "plan-cruise-edit-task",
                    "204": "plan-cruise-delete-task",

                    //增加 淮安项目  运维管理-注册管理权限
                    "1179": "monitorsystem-view", //查看监控系统信息
                    "1180": "monitorsystem-new", //新建监控系统
                    "1181": "monitorsystem-edit", // 编辑监控系统
                    "1182": "monitorsystem-cancel", // 注销监控系统
                    "1183": "point-view", // 查看点位信息
                    "1184": "point-new", // 新建点位
                    "1185": "point-edit", //编辑点位
                    "1186": "point-cancel", // 注销点位
                    "1187": "point-excel-import", // 点位excel批量导入
                    "1188": "camera-view", // 查看摄像机信息
                    "1189": "camera-new", //新建摄像机
                    "1190": "camera-edit", // 编辑摄像机
                    "1191": "camera-cancel", // 注销摄像机
                    "1192": "camera-excel-import", // 摄像机excel批量导入
                    "1193": "point-batch-enter", // 点位批量进入平台
                    "1194": "camera-batch-enter", // 摄像机批量进入平台

                    "999": "additive",
                    "2001": "view-libs",  //基础库在pva的权限标识
                    "2002": "tobaselib"   //基础库入库权限
                }
            }
        },

        /**
         * 权限缓存，拿到的数据缓存到这里
         */
        functionList: {},

        /**
         * 存储权限映射表，方便取用
         */
        map: null,

        /**
         * 权限和 class 映射表
         */
        klass: {},

        /**
         * @name initialize
         * @date   2014-11-07
         * @param  {[object]} 提供初始化时的一些参数，见上面参数列表
         * @description 初始化模块类
         */
        initialize: function(options) {
            var self = this;

            self.setOptions(options);

            /**
             * 加载字典文件
             */
            self.loadMap();

            /**
             * 加载权限
             */
            self.loadvalidFunctionList();

            /**
             * 显示该显示的类，隐藏该隐藏得类
             */
            self.show();

            self.setUserRoleScore();
        },

        /**
         * @name strToJson
         * @param {string} 要对象化的字符串，必须是可用的纯对象字符串
         * @return {object} 字符串对象对象化后的对象
         * @description 将字符串转换成对象
         */
        strToJson: function(str) {
            while (typeof str != 'object') {
                str = JSON.decode(str);
            }
            return str;
        },

        setUserRoleScore: function() {

            var userRole = $("#userEntry").attr("data-score"),
                userRole = userRole ? userRole - 0 : (window.localStorage.getItem("userRoleScore") - 0);

            window.localStorage.setItem("userRoleScore", userRole);
        },

        /**
         * @name loadData
         * @param {string} 接口的 url 部分，不包括最后一个 / 之后的部分
         * @param {string} 接口的名称，最后一个 / 之后的部分
         * @description 封装的简单的加载接口数据的函数
         * @return {{object}} promise 对象
         */
        loadData: function(url, name) {
            var dfd = $.Deferred();

            $.ajax({
                type: "get",
                cache: false,
                url: url + name,
                success: function(datas) {
                    dfd.resolve(datas);
                },
                error: function() {
                    dfd.reject();
                    notify.error("获取数据失败！");
                }
            });
            return dfd.promise();
        },

        /**
         * @name loadMap
         * @description 加载字典文件(id和权限映射表文件)，如果以对象方式定义，则直接取回，否则 ajax 取回
         */
        loadMap: function() {
            var self = this;
            if ($.isPlainObject(self.options.map)) {
                self.map = self.options.map;
                return false;
            }
            $.when(self.loadData("", this.options.map)).done(function(map) {
                self.map = JSON.parse(map);
            });
        },

        /**
         * @name loadvalidFunctionList
         * @description 加载可用的资源权限，在登录成功后第一个页面已经获取并存于 localstorage 中，如果 LC 里面有，则直接拿，否则去后端取。
         */
        loadvalidFunctionList: function() {
            var self = this,
                functionList = self.strToJson(window.localStorage.getItem("validFunctionList"));

            if (functionList) {
                self.functionList = functionList;
                return;
            }
            $.when(self.loadData("", self.options.url)).done(function(functionList) {
                self.functionList = functionList;
                window.localStorage.setItem('validFunctionList', JSON.encode(functionList));
            });
        },

        /**
         * @name validFunctionList
         * @description 加载完成处理权限和 class 之间的映射，如果 validFunctionListMap 存在，直接返回，否则不断的查看 functionList 和 map 是否加载完成，加载完成则处理，否则继续查看
         * @return {{object}} promise 对象
         */
        validFunctionList: function() {
            var self = this,
                dfd = $.Deferred(),
                validFunctionListMap = window.localStorage.getItem('validFunctionListMap');

            if (validFunctionListMap) {
                self.klass = self.strToJson(validFunctionListMap);
                return dfd.resolve(self.klass);
            }

            (function validFunctionList2class() {
                if (self.functionList && self.map) {
                    // 处理权限和 class 之间的映射
                    self.validFunctionList2Class();
                    dfd.resolve(self.klass);
                } else {
                    setTimeout(validFunctionList2class, 50);
                }
            }());
            return dfd.promise();
        },

        /**
         * @name validFunctionList2Class
         * @description 处理权限和 class 之间的映射，处理完成，并将最终处理的结果存起来备用，
         */
        validFunctionList2Class: function() {
            var self = this,
                listMap = window.localStorage.getItem('validFunctionListMap');

            if (listMap) {
                self.klass = self.strToJson(listMap);
                return self.strToJson(listMap);
            }

            var list = self.functionList.data.validFunctionResourceList,
                len = list.length,
                map = self.map.validFunctionList,
                klass = self.klass,
                i = 0,
                key;

            for (; i < len; i++) {
                for (key in map) {
                    if (map.hasOwnProperty(key) && key === ("" + list[i].id)) {
                        klass.done = "done";
                        klass[map[key]] = map[key];
                    }
                }
            }
            window.localStorage.setItem('validFunctionListMap', JSON.encode(klass));
        },

        /**
         * @name show
         * @description 显示该显示的类，隐藏该隐藏得类
         */
        show: function(el, callback) {
            var self = this,
                $el = el ? $(el) : false;
            $.when(self.validFunctionList()).done(function() {
                var r = self.klass,
                    key;

                if ($el) {
                    $el.find(".permission").hide().addClass("permissionHidden");
                } else {
                    $(".permission").hide().addClass("permissionHidden");
                }

                r["additive"] = additive;

                for (key in r) {
                    if ($el) {
                        $el.find(".permission-" + r[key]).not(".must-hide").addClass("show").show().removeClass("permissionHidden");
                        $el.find(".permission-" + r[key]).find(".must-hide").hide();
                    } else {
                        $(".permission-" + r[key]).not(".must-hide").addClass("show").show().removeClass("permissionHidden");
                        $(".permission-" + r[key]).find(".must-hide").hide();
                    }
                }
                callback && callback();
            });
        },
        remove: function(arr) {
            var len = arr.length;
            for (var i = 0; i < len; i++) {
                $(arr[i]).remove();
            }
        },
        /**
         * @name reShow
         * @description 显示该显示的类，隐藏该隐藏得类， show 的别名，用在每次动态加载了权限相关的模板之后调用
         */
        reShow: function(el, callback) {
            var self = this;
            self.show(el, callback);
        },

        /**
         * @method stopFaultRightByScore
         * @description 权限控制，对比用户与资源的权限，如果用户权限小于资源权限则返回 false。
         * @param {Number} right 资源的权限
         * @param {String || Boolean} [msg] 需要提示的文字，如果为 false 则不提示
         * @return {Boolean} 是否有权限 无权限 为 false，有权限 true
         */
        stopFaultRightByScore: function(score, msg) {
            var userRole = $("#userEntry").attr("data-score") - 0;
            if (typeOf(score) === "array") {
                return score.map(function(value) {
                    return value <= userRole;
                });
            } else {
                if (msg && (score - 0) > userRole) {
                    if (msg === true) {
                        notify.info("暂无权限访问该摄像头", {
                            timeout: 1500
                        });
                    } else {
                        notify.info(msg, {
                            timeout: 1500
                        });
                    }
                }
                return (score - 0) <= userRole;
            }

        },

        /**
         * @method stopFaultRightById
         * @description 权限控制，对比用户与资源的权限，如果用户权限小于资源权限则返回 false。
         * @param {Array} cameraIds 摄像机的 ID
         * @param {Boolean} [async] 是否是异步 不填默认为 fasle 同步
         * @param {function} [callback] 回调函数，只有在 async 为 true 的时候，才会调用，传入 @return 的值
         * @return {Array} tmp 对应传入的摄像机id，返回是否有权限 无权限 为 false
         */
        stopFaultRightById: function(cameraIds, async, callback) {
            var userRole = $("#userEntry").attr("data-score"),
                userRole = userRole ? userRole - 0 : (window.localStorage.getItem("userRoleScore") - 0),
                tmp = [];

            var getScore = function() {
                jQuery.ajax({
                    url: "/service/camera/score/list",
                    type: "post",
                    data: {
                        cameraIds: cameraIds.join(",")
                    },
                    async: async || false,
                    success: function(score) {
                        if (score.code === 200) {
                            var cameras = score.data.result,
                                hasRight;

                            cameraIds.forEach(function(value) {
                                cameras.forEach(function(val) {
                                    if ((value - 0) === (val.cameraId - 0)) {
                                        hasRight = val.score <= userRole;
                                        tmp.push(hasRight);
                                    }
                                });
                            });

                            if (async && callback) {
                                callback(tmp);
                            }
                            return tmp;
                        }
                    }
                });
            };

            getScore();
            return tmp;
        },
        hasRightToPlay: function() {
            var right = this.klass["mainten-real-time-view"] === "mainten-real-time-view";
            if (!right) {
                notify.info("暂无权限播放实时视频", {
                    timeout: 1500
                });
            }
            return right;
        }
    });



    // 使用方法 即可让相应权限的元素显示
    /**
     * @name permission
     * @instance Permission
     * @description 初始化新实例
     */
    var permission = new Permission();
    window.permission = permission; //防止 require 化 不完全，使用方式导致的错误。

    return permission;
});
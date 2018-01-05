/**
 ** @Date：2016.3.30
 ** @Author: haoyong
 ** @Description: 监控系统的控制器层，负责初始化主页监控系统块的页头和表体等内容
 */
define([
    "jquery",
    "../model/monitorSystem-model",
    "../global-varibale",
    "../view/monitorSystem-view",
    "../view/commonHelper"
], function (jQuery, Model, global, View, commonHelper) {
    return (function (scope, $) {
        var //模板的路径
            tableHeaderTpl = "/module/maintenance/registrationManage/inc/monitorSystemTableHeaderTpl.html",
            tableBodyTpl = "/module/maintenance/registrationManage/inc/monitorSystemTableBodyTpl.html",
            createTpl = "/module/maintenance/registrationManage/inc/monitorSystemNewTpl.html";
        scope.init = function () {

            //初始化监控系统模块助手
            commonHelper.monitorSystemHelper.monitorSystemHelper();

            //初始化View层
            View.init(scope);

            var self = this;

            //渲染监控系统表头
            self.loadTableHeader();

            //渲染监控系统表体内容
            self.loadTableData();
        };


        /**
         * 加载表头,标题,新建按钮等内容
         */
        scope.loadTableHeader = function () {
            global.loadTemplate(tableHeaderTpl, function (compiler) {
                var htmlStr = compiler({"header": true});
                $(".monitor-system").find(".breadcrumb").after(htmlStr);
                View.bindEvents(".createBtnBox");//:visible

            });

        };

        /**
         * 新建或编辑监控系统
         * @param data
         */
        scope.createOrEditMonitorSystem = function (data) {
            var param = {
                /*"managerUnitCode": data.managerUnitCode ,*/
                 // 用managerUnitCode代替organizationId（后台需求）
                "managerUnitCode": data.organizationId ,
                "managerUnitName": data.managerUnitName,
                "monitorSystemName": data.monitorSystemName,
                /*"monitorSystemId":  data.monitorSystemId,*/
                "monitorSystemLocation": data.monitorSystemLocation,
                "networkType": data.networkType,
                "isNetwork": data.isNetwork,
                "isNationalStandard": data.isNationalStandard,
                "videoStoragePeriod": data.videoStoragePeriod,
                "contactName": data.contactName,
                "contactPhone": data.contactPhone,
                "managerUnitAddress": data.managerUnitAddress
            };

            if (data.id) {
               //编辑监控系统，提供两个id属性
                param.monitorSystemId = data.monitorSystemId;
                param.id = data.id;
                Model.ajaxEvents.updateMonitorSystem({params: JSON.stringify(param)}, function (res) {
                    scope._dealCreateOrEditMonitorSystemResponse(res);
                }, function () {
                    notify.error("修改失败");
                });
            } else {
                //新建监控系统
                //param.monitorSystemId = data.monitorSystemId;
                Model.ajaxEvents.createMonitorSystem({params: JSON.stringify(param)}, function (res) {
                    scope._dealCreateOrEditMonitorSystemResponse(res);
                }, function () {
                    notify.error("新建失败");
                });
            }
            console.log("createOrEditMonitorSystem", param);
        };


        /**
         * 公共处理新建或编辑监控系统服务端返回的数据
         * @param res 服务端返回数据
         * @private
         */
        scope._dealCreateOrEditMonitorSystemResponse = function (res) {
            if (res.code === 200) {
                $(".monitor-system table").children().not(":first").remove();
                scope.loadTableData();
                notify.success("提交成功");
            } else if (res.code === 500) {
                notify.warn("服务器出错");
            }
        };

        /**
         * 根据ID注销监控系统
         * @param data get方法传过去参数：ID和reason
         * */
        scope.logOffMonitorSystemById = function (data) {
            Model.ajaxEvents.logOffMonitorSystem(data, function (res) {
                    if (res.code === 200) {
                        $(".monitor-system table").children().not(":first").remove();
                        scope.loadTableData();
                        notify.success("注销成功");
                    } else {
                        notify.warn("注销失败");
                    }
                },
                function () {
                    notify.error("服务器错误，注销失败");
                });
        };

        /**
         * 获取管理单位（组织结构）列表，提供view层渲染到对应的下拉菜单option上
         */
        scope.getManagerUnitNameList = function () {
            var managerUnitNameList = [[-1, -2, -3], ["读取列表失败", "请勿新建", "服务端异常"]];
            Model.ajaxEvents.getManagerUnitNameList({}, function (res) {
                    var i = 0;
                    for (var key in res.data.orgFirstDir) {
                        if (res.data.orgFirstDir.hasOwnProperty(key)) {
                            managerUnitNameList[0][i] = key;
                            managerUnitNameList[1][i] = res.data.orgFirstDir[key];
                            i++;
                        }
                    }
                },
                function () {
                    notify.error("组织结构列表获取失败");
                });
            return managerUnitNameList;

        };


        /**
         * 读取数据 加载表体内容
         */
        scope.loadTableData = function () {
            Model.ajaxEvents.getTableData({
                beforesend: function () {
                    $(".monitor-system").find(".load").show(0);
                }
            },{}, function (data) {
                    if (data.code === 200) {
                        global.loadTemplate(tableBodyTpl, function (compiler) {
                            var htmlStr = compiler({
                                "dataList": true,
                                "data": data.data.monitor_system_list
                            });

                            $(".monitor-system").find(".load").hide();
                            $("#contentTable").append(htmlStr);
                            permission.reShow();

                            //给注销的项加灰色样式
                            View.addLogOffStyle();
                            View.dealWithLogOffRight();
                          //  View.bindEvents(".editAndDelItemTd");
                            View.bindEvents(".monitor-system td");
                        });

                    } else {
                        notify.error(data.data.message);
                    }
                }, function () {
                    notify.error("服务器获取数据失败");
                }
            );
        };

        /**
         * 渲染新建弹出框
         * @param editOrCreate 新建=>1 编辑=>0
         * @param data 编辑的情况下使用的数据，用来填充表单
         */
        scope.loadNew = function (editOrCreate, data) {
            var htmlStr = null;
            global.loadTemplate(createTpl, function (compiler) {
                if ("1" === editOrCreate) {
                    //编辑的情况下传数据data
                    htmlStr = compiler({
                        "newFram": true,
                        "editOrCreate": editOrCreate,
                        "data": data
                    });
                } else {
                    htmlStr = compiler({
                        "newFram": true,
                        "editOrCreate": editOrCreate
                    });
                }
                window.top.showHideNav("hide");
                $(".monitor-system").append(htmlStr);//mask默认display none
                $(".monitor-system .mask").fadeIn(200);
                View.bindEvents(".monitorDialog:visible");
            });
        };


        return scope;
    }({}, jQuery));
})
;
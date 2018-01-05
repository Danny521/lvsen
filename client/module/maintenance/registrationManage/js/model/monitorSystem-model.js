/**
 * Created by haoyong on 2016/3/25.
 * 监控系统模块【monitorSystem-model】
 */
define([
    "jquery",
    "ajaxModel"
], function ($, ajaxModel) {
    var Model = {

        isUseMock: 0,

        //设置请求的根路径
        serviceHost: "/service/",

        //设置请求上下文
        serviceContext: "regist/",

        //设置请求的url集合
        setActionUrl: function () {
            var self = this;
            return {
                //获取监控系统内容列表
                Get_Data_List: (self.isUseMock ? "/module/maintenance/registrationManage/inc/monitorSystem.json" : self.serviceHost + self.serviceContext + "monitor_system/list"),

                //创建监控系统
                Create_MonitorSystem: (self.isUseMock ? "null" : self.serviceHost + self.serviceContext + "monitor_system/add"),

                //修改监控系统
                Update_MonitorSystem: (self.isUseMock ? "null" : self.serviceHost + self.serviceContext + "monitor_system/update"),

                //根据ID选择监控系统
                Select_MonitorSystem_By_Id: (self.isUseMock ? "null" : self.serviceHost + self.serviceContext + "monitor_system/get"),

                //获取组织结构名列表（管理单位名称）
                Get_ManagerUnitName_List: (self.isUseMock ? "null" : self.serviceHost + self.serviceContext + "monitor_system/getOrgFirstDir"),

                //注销监控系统
                LogOff_MonitorSystem_By_Id: (self.isUseMock ? "null" : self.serviceHost + self.serviceContext + "monitor_system/cancel")
            };
        },
        ajaxEvents: function () {
            var self = this;
            self.URLS = self.setActionUrl();
            return {
                //获取监控系统内容列表
                getTableData: function (custom, data, success, error) {
                    return ajaxModel.getData(self.URLS.Get_Data_List, data, custom).then(success, error);
                },

                //创建监控系统
                createMonitorSystem: function (data, success, error) {
                    return ajaxModel.postData(self.URLS.Create_MonitorSystem, data).then(success, error);
                },

                //修改监控系统
                updateMonitorSystem: function (data, success, error) {
                    return ajaxModel.postData(self.URLS.Update_MonitorSystem, data).then(success, error);
                },

                //根据ID选择监控系统 没有使用
                /*getMonitorSystemById: function (data, success, error) {
                    return ajaxModel.getData(self.URLS.Select_MonitorSystem_By_Id, data).then(success, error);
                },*/

                //获取组织结构名列表（管理单位名称） 同步
                getManagerUnitNameList: function (data, success, error) {
                    return ajaxModel.getData(self.URLS.Get_ManagerUnitName_List, data, {async: false}).then(success, error);
                },

                //注销监控系统
                logOffMonitorSystem: function (data, success, error) {
                    return ajaxModel.getData(self.URLS.LogOff_MonitorSystem_By_Id, data).then(success, error);
                }
            };
        }
    };
    return {
        ajaxEvents: Model.ajaxEvents()
    };
});

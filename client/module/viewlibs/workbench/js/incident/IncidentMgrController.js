define([
    '/module/viewlibs/common/js/UploadTool.js',
    'js/conf',
    'underscore',
    'ajaxModel',
    'js/incident/incidentMgrView',
    'base.self',
    'common.cascade',
    'permission',
    'jquery.validate',
    'thickbox'
], function(UploadTool, conf, _, ajaxModel, incidentMgrView) {

    var options = {

        mode: "create", // [ "create" |  "edit" ]

        createIncidentUrl: "/service/pvd/save_incident_info",

        editIncidentUrl: "/service/pvd/edit_incident_info",

        getIncidentUrl: "/service/pvd/get_incident_info",

        uploadContainerId: null, //弹窗创建案事件 上传插件的container Id

        callback: function(id) { //   案事件创建完成的回调函数
            var param = {
                id: id,
                incidentname: jQuery("#incident_name").val().trim(),
                pagetype: "workbench",
                orgid: ""
            };
            if (window.location.href.indexOf("_incident_inspect") > -1) { //创建，更新案事件
                if (typeof(parent.onCreateIncident) == "function") {
                    parent.onCreateIncident(param);
                }
            } else {
                window.location.href = "/module/viewlibs/details/incident/incident_detail.html?" + jQuery.param(param);
            }
        }
    };

    var init = function(Options) {
        _.extend(options, Options);
        incidentMgrView.addHelper(options);
        if (options.mode === "create") {
            createIncident();
        } else if (options.mode === "edit") {
            var id = Toolkit.paramOfUrl(window.location.href).id;
            if (id) {
                editIncident(id);
            }
        }
    }

    var createIncident = function() {
        var self = this;
        jQuery(".form-panel").html(options.template({
            "incident": {}
        }));
        bindEvent();
    };

    var bindEvent = function() {
        var self = this;
        // 权限控制
        permission.reShow();

        // 地址级联
        new CommonCascade({
            firstSelect: '#incident_province',
            secondSelect: '#incident_city',
            thirdSelect: '#incident_country'

        });

        // 案事件副类别
        new CommonCascade({
            firstSelect: "#incident_classifyPartFirst",
            secondSelect: "#incident_classifyPartSecond",
            path: "/module/viewlibs/workbench/inc/incident_subcategory.json"
        });

        // 初始化上传插件
        new UploadTool({
            "uploadContainerId": options.uploadContainerId,
            "fileUploaded": function(file, res) {
                jQuery("#incident_cover").attr("src", res.picture);
                jQuery("#incident_cover").closest("a.thickbox").attr("href", res.picture);
            }
        })

        // 手风琴折叠效果
        incidentMgrView.getAccordionEffect();

        // 查看大图
        thickbox();

        // 时间控件
        incidentMgrView.getTimePicker();

        // 案事件创建面板 关闭
        incidentMgrView.caseEventClose();

        // 证件类型 证件号码联动
        incidentMgrView.credentialsTypeAndNumLinked();

        //解决表单验证时案发时间填写后错误信息不隐藏的问题
        incidentMgrView.removeMessage();

        // 提交表单
        validateForm(function() {
            var incident = incidentMgrView.getFormData();
            var locationUrl = Toolkit.paramOfUrl(window.location.href);
            var params = {
                    "incidentInfo": JSON.stringify(incident)
                }
                // 关联新建案事件
            if (locationUrl.id && locationUrl.type) {
                params.resourceId = locationUrl.id;
                params.type = locationUrl.type;
            }
            var opt = options;
            var url = opt.mode === "create" ? opt.createIncidentUrl : opt.editIncidentUrl;
            var action = options.mode === "create" ? "创建" : "编辑";
            jQuery("#incident_save").attr("disabled", "disabled");
            ajaxModel.postData(url, params).then(function(res) {
                if (res.code === 200) {
                    // 添加日志
                    if (options.mode === "create") {
                        logDict.insertMedialog('m4', "创建“" + incident.name + "”案事件", "", "o1");
                        // 关联创建案事件
                        if (Toolkit.paramOfUrl().res && Toolkit.paramOfUrl().res !== "") {
                            var msg = Toolkit.paramOfUrl().res + "线索关联“" + incident.name + "”案事件";
                            logDict.insertMedialog('m4', msg);
                        }
                    } else {
                        logDict.insertMedialog('m4', "编辑“" + incident.name + "”案事件表单", "", "o2");
                    }
                    options.callback(res.data.id);

                } else {
                    notify.error("案事件" + action + "失败！");
                }
                jQuery("#incident_save").removeAttr("disabled");
            })

        });


    };

    var validateForm = function(callback) {
        jQuery.validator.setDefaults({
            invalidHandler: function() {
                return false;
            },
            ignore: "",
            errorPlacement: function(error, element) {
                if (element.is(".select")) {
                    error.insertAfter(element);
                    error.addClass("for-select");
                } else {
                    error.insertAfter(element);
                }
            },
            submitHandler: function() {
                if (jQuery("#incidentForm").valid()) {
                    callback();
                    return false;
                } else {
                    notify.info("请正确填写相关信息！");
                }
                return false;
            }
        });

        jQuery("#incidentForm").validate({
            rules: {
                associateId: {
                    maxlength: 50,
                    departmentCode: true,
                    remote: {
                        url: "/service/pvd/is_HasNo",
                        type: "post",
                        data: {
                            associateId: function() {
                                return jQuery("#incident_associateId").val().trim();
                            }
                        }
                    }
                },
                name: {
                    maxlength: 100,
                    required: true,
                    nameFormat: true,
                    remote: {
                        url: "/service/pvd/incidentName/check",
                        type: "post",
                        data: {
                            incidentName: function() {
                                return jQuery("#incident_name").val().trim();
                            },
                            id: jQuery("#incident_id").val() ? jQuery("#incident_id").val() : null
                        }
                    }
                },
                category: {
                    required: true,
                    maxlength: 2
                },
                timeUpper: {
                    required: true,
                    maxlength: 50,
                    datetime: true,
                    compareCurrent: true,
                    timeCompareBig: "#incident_timeLower"
                },
                timeLower: {
                    required: true,
                    maxlength: 50,
                    datetime: true,
                    compareCurrent: true,
                    timeCompareSmall: "#incident_timeUpper"
                },
                province: {
                    required: true
                },
                streets: {
                    maxlength: 200
                },
                description: {
                    maxlength: 200
                },
                suspectCount: {
                    positiveInteger: true,
                    maxlength: 2
                },
                crimeMethod: {
                    maxlength: 200
                },
                reporter: {
                    maxlength: 20
                },
                reporterCompany: {
                    maxlength: 100
                },
                archive: {
                    maxlength: 50
                },
                reporterCardnumb: {
                    identificationSelect: "#incident_reporterCardtype",
                    maxlength: 50
                }
            },
            success: function(label) {
                label.remove();
            },
            // 对于验证失败的字段都给出相应的提示信息
            messages: conf.incidentMsg
        });
    };

    var editIncident = function(id) {
        var self = this;
        ajaxModel.getData(options.getIncidentUrl, {
            "id": id,
            "rs": 0
        }).then(function(res) {
            if (res.code === 200 && res.data.incident) {
                jQuery(".form-panel").html(options.template({
                    "incident": res.data.incident
                }));

                var imageUrl = jQuery.trim(res.data.incident.picture);
                if (imageUrl === "") {
                    imageUrl = "/module/common/images/upload.png";
                }

                jQuery("#incident_cover").attr("src", imageUrl);
                jQuery(".cover-box a.thickbox").attr("href", imageUrl);

                bindEvent();
            } else {
                notify.warn("获取案事件信息失败！");
            }
        })
    };

    return {
        init: init
    };
})
define([
    '/module/viewlibs/common/js/AutoComplete.js',
    'underscore',
    '/module/viewlibs/workbench/js/conf.js',
    'handlebars',
    'jquery',
    'jquery.validate',
    'common.cascade'
], function(AutoComplete, _, conf, Handlebars){
    var videoValid = function ($dom) {
        $dom.find("#form").validate({
            ignore: "",
            rules: {
                incidentname: {
                    isExistIncident: true,
                    isChoseIncident: true
                },
                fileFormat: "required",
                shootTime: {
                    required: true,
                    maxlength: 50,
                    datetime: true,
                    compareCurrent: true
                },
                category: "required",
                name: {
                    required: true,
                    maxlength: 30,
                    nameFormat: true
                },
                description: {
                    required: true,
                    maxlength: 200
                },
                province: "required",
                streets: {
                    maxlength: 200
                },

                longitude: {
                    required: true,
                    maxlength: 12,
                    longitude: true
                },
                latitude: {
                    required: true,
                    maxlength: 12,
                    latitude: true
                },
                duration: {
                    required: true,
                    maxlength: 6,
                    positiveInteger: true
                },
                enterTime: {
                    required: true,
                    maxlength: 50,
                    datetime: true,
                    compareCurrent: true
                },
                startTime: {
                    required: true,
                    maxlength: 50,
                    datetime: true,
                    timeCompareBig: $dom.find('#endTime'),
                    compareCurrent: true
                },
                endTime: {
                    required: true,
                    maxlength: 50,
                    datetime: true,
                    compareCurrent: true,
                    timeCompare: $dom.find('#startTime')
                },
                width: {
                    required: true,
                    maxlength: 5,
                    positiveInteger: true,
                    compareWH: true
                },
                height: {
                    required: true,
                    maxlength: 5,
                    positiveInteger: true,
                    compareWH: true
                },
                sourceId: {
                    maxlength: 2
                },
                device: {
                    maxlength: 20
                },
                supplement: {
                    maxlength: 30
                },
                earmark: {
                    maxlength: 30
                },
                subject: {
                    maxlength: 30
                },
                keywords: {
                    maxlength: 30
                },
                keyman: {
                    maxlength: 30
                }
            },
            success: function (label) {
                // set &nbsp; as text for IE
                label.remove();
            },
            // 对于验证失败的字段都给出相应的提示信息
            messages: conf.videoValidMsg
        });
    };

    var imageValid = function ($dom) {
        $dom.find("#imageForm").validate({
            ignore: "",
            rules: {
                incidentname: {
                    isExistIncident: true,
                    isChoseIncident: true
                },
                fileFormat: "required",
                shootTime: {
                    required: true,
                    compareCurrent: true
                },
                category: "required",
                name: {
                    required: true,
                    maxlength: 30,
                    nameFormat: true
                },
                description: {
                    required: true,
                    maxlength: 200
                },
                province: {
                    required: true,
                    maxlength: 50
                },
                streets: {
                    maxlength: 200
                },

                longitude: {
                    required: true,
                    maxlength: 12,
                    longitude: true
                },
                latitude: {
                    required: true,
                    maxlength: 12,
                    latitude: true
                },
                width: {
                    required: true,
                    maxlength: 5,
                    positiveInteger: true
                },
                height: {
                    required: true,
                    maxlength: 5,
                    positiveInteger: true
                },
                sourceId: {
                    maxlength: 2
                },
                device: {
                    maxlength: 20
                },
                supplement: {
                    maxlength: 30
                },
                earmark: {
                    maxlength: 30
                },
                subject: {
                    maxlength: 30
                },
                keywords: {
                    maxlength: 30
                },
                keyman: {
                    maxlength: 30
                }
            },
            success: function (label) {
                label.remove();
            },
            // 对于验证失败的字段都给出相应的提示信息
            messages: conf.imageValidMsg
        });
    };

    var fillCascade= function () {
        //默认籍贯上海市
        if (window.parent) {
            var content = window.parent.document.getElementById("content");
            var province = content.getAttribute('data-province');
            var city = content.getAttribute('data-city');
            jQuery('.create #province').attr('data-default', province);
            jQuery('.create #city').attr('data-default', city);

        }
        //省市区三级地址级联
        new CommonCascade({
            firstSelect: "#province",
            secondSelect: "#city",
            thirdSelect: "#country"
        });
        if ($('.input-time').length !== 0) {
            $('.input-time').datetimepicker(conf.dateTimePickerConf);
        }
    };

    var loadCommon = function(){
        $(function () {
            fillCascade();
            if (window.location.href.indexOf("tpl_createImage") !== -1) {
                imageValid($("#content"));
            } else {
                videoValid($("#content"));
            }
            jQuery("#content").on('click', '.module-head', function () { //展开收拢表单
                jQuery(this).closest(".module").addClass("active");
                jQuery(this).closest(".module").siblings().removeClass("active");
                jQuery(".module.active>.module-body").tinyscrollbar({ //内容区添加滚动条
                    thumbSize: 36
                });
            });
            //初始化自动匹配输入案事件名称
            var incidentName = new AutoComplete({
                node: "#incidentname",
                url: '/service/pvd/get_incident_menu',
                hasSelect: true,
                hasEnter: true,
                left: "0px",
                top: "24px",
                panelClass: "suggest-panel",
                checkCallback: function (data) {
                    jQuery("#incidentname").next('label.error').remove();
                }
            });
            jQuery("#existingIncident").on('click', function () {
                if (jQuery("#existingIncident").is(':checked')) {
                    jQuery("#incidentname").removeAttr('disabled');
                    jQuery("#incidentname").removeClass('error');
                    jQuery("#incidentname").next('label.error').remove();
                }
            });
            jQuery("#createIncident").on('click', function () {
                if (jQuery("#createIncident").is(':checked')) {
                    jQuery("#incidentname").removeClass('error');
                    jQuery("#incidentname").next('label.error').remove();
                    jQuery("#incidentname").attr('disabled', true);
                }
            });
            jQuery("#unIncident").on('click', function () {
                if (jQuery("#unIncident").is(':checked')) {
                    jQuery("#incidentname").removeClass('error');
                    jQuery("#incidentname").next('label.error').remove();
                    jQuery("#incidentname").attr('disabled', true);
                }
            });
        });
    }

    return {
        loadCommon : loadCommon,
        videoValid : videoValid,
        fillCascade : fillCascade,
        imageValid : imageValid
    }
})
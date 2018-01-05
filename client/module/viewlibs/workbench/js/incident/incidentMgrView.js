define([
    'handlebars',
    'js/conf',
    'jquery',
    'jquery-ui-1.10.1.custom.min',
    'jquery-ui-timepicker-addon'
], function(Handlebars, conf) {
    var addHelper = function(options) {
        Handlebars.registerHelper("selected", function(value1, value2) {
            if (value1 === value2) {
                return "selected";
            }
        });

        //  毫秒转日期
        Handlebars.registerHelper("mills2str", function(num) {
            return Toolkit.mills2datetime(num);
        });

        options.template = Handlebars.compile(jQuery("#incidentTemplate").html());
    };

    var getAccordionEffect = function() {
        jQuery(".accordion").find(".module-head").on("click", function() {
            jQuery(this).closest("div.module").addClass("active");
            jQuery(this).closest("div.module").siblings().removeClass("active");
        });
    }

    var getTimePicker = function() {
        jQuery(".input-date-time").datetimepicker(conf.dateTimePickerConf);
    }

    // 案事件创建面板 关闭
    var caseEventClose = function() {
        if (jQuery("#incidentPanel").length > 0) {
            jQuery("#incidentPanel .close-panel").click(function(event) {
                jQuery(".incident-panel-group").hide();
            });
        }
    }

    var credentialsTypeAndNumLinked = function() {
        jQuery("select[name='reporterCardtype']").change(function(event) {
            var val = jQuery(this).find("option:selected").val();
            if (val === "") {
                jQuery("input[name='reporterCardnumb']").val("");
                jQuery("input[name='reporterCardnumb']").prop("disabled", true);
                jQuery("input[name='reporterCardnumb']").next("label").remove();
            } else {
                jQuery("input[name='reporterCardnumb']").prop("disabled", false);
            }
        }).change();
    }

    var buidIndexStr = function() {
        var arr = [];
        jQuery("#incidentForm").find('select option:selected').each(function(index, item) {
            if (jQuery(item).val() !== "") {
                arr.push(jQuery(item).text());
            }
        });

        jQuery("#incidentForm").find('input:not(.input-date-time)').each(function(index, item) {
            arr.push(jQuery.trim(jQuery(item).val()));
        });

        return jQuery.trim(arr.slice(0, -2).join(" "));
    };

    var removeMessage = function() {
        jQuery("#incident_timeUpper").blur(function() {
            jQuery(this).next().remove();
        });
        jQuery("#incident_timeLower").blur(function() {
            jQuery(this).next().remove();
        });
    };

    var getFormData = function() {
        var incident = {};
        var arr = jQuery("#incidentForm").serializeArray();
        for (var i = arr.length - 1; i >= 0; i--) {
            incident[arr[i].name] = jQuery.trim(arr[i].value);
        }

        incident.picture = jQuery("#incident_cover").attr("data-default") === jQuery("#incident_cover").attr("src") ? "" : jQuery("#incident_cover").attr("src");
        incident.id = jQuery("#incident_id").val();

        // 构造地址字符串
        var p = jQuery("#incident_province").children("option:selected").val() !== "" ? jQuery("#incident_province").children("option:selected").text() : "";
        var c = jQuery("#incident_city").children("option:selected").val() !== "" ? jQuery("#incident_city").children("option:selected").text() : "";
        var a = jQuery("#incident_country").children("option:selected").val() !== "" ? jQuery("#incident_country").children("option:selected").text() : "";
        var s = jQuery("#incident_streets").val().trim() !== "" ? jQuery("#incident_streets").val().trim() : "";
        incident.location = p + " " + c + " " + a + " " + s;
        incident.remark = buidIndexStr();

        return incident;
    };

    return {
        addHelper: addHelper,
        getAccordionEffect: getAccordionEffect,
        getTimePicker: getTimePicker,
        caseEventClose: caseEventClose,
        credentialsTypeAndNumLinked: credentialsTypeAndNumLinked,
        getFormData: getFormData,
        removeMessage: removeMessage
    }
})
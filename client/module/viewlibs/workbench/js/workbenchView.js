define([
    'broadcast',
    'handlebars',
    'underscore',
    '/module/viewlibs/workbench/js/conf.js',
    '/module/viewlibs/common/filterData.js',
    'jquery'
], function(broadcast, Handlebars, _, conf, FilterData) {
    window.filterData.b = '';
    window.filterData.sf = '';
    window.filterData.r = '';
    /*var filterData = {
        b: '', //案事件id（线索结果集）
        sf:'',//文件类型（结构化信息结果集）
        r:'' //资源(视频或者图片)id（结构化信息结果集）
    };*/
    var SK = '',
        ST = '';
    var trlSceneT = function() {
        jQuery.ajax({
            url: "/module/viewlibs/json/scene_u.json",
            type: "get",
            async: false,
            dataType: 'json',
            success: function(res) {
                ST = res;
            }
        });
    };
    var translateData = function() {
        var self = this;
        jQuery.ajax({
            url: "/module/viewlibs/common/structkey.json",
            type: "get",
            dataType: 'json',
            async: false,
            success: function(res) {
                SK = res;
            }
        });
    };
    var mergeStr = function(obj) {
        var str = '';
        var j = obj.length;
        for (var i = 0; i < j; i++) {
            if (obj[i] && obj[i] !== "暂未填写") {
                str = str + obj[i] + '，';
            }
        }
        str = str.substr(0, str.length - 1);
        return str;
    };
    var addHelper = function() {
        //助手
        trlSceneT();
        translateData();

        function carhelp(licenseNumber, licenseType, carColor) {
            if ((!licenseType || licenseType === "暂未填写") && (!licenseNumber || licenseNumber === "暂未填写") && (!carColor || carColor === "暂未填写")) {
                return '车辆';
            } else {
                var obj = [licenseNumber, licenseType, carColor];
                var str = mergeStr(obj);
                return str;
            }
        };

        function exhibithelp(name, shape, color) {
            if ((!name || name === "暂未填写") && (!shape || shape === "暂未填写") && (!color || color === "暂未填写")) {
                return '物品';
            } else {
                var exhibitdata = [name, shape, color];
                var str = mergeStr(exhibitdata);
                return str;
            }
        };

        function movehelp(type, color, height, gray) {
            if ((!type || type === "暂未填写") && (!color || color === "暂未填写") && (!height || height === "暂未填写") && (!gray || gray === "暂未填写")) {
                return '运动目标';
            } else {
                var movingdata = [type, color, height, gray];
                var str = mergeStr(movingdata);
                return str;
            }
        };

        function personhelp(name, gender, jacketColor, trousersColor) {
            if ((!name || name === "暂未填写") && (!gender || gender === "暂未填写") && (!jacketColor || jacketColor === "暂未填写") && (!trousersColor || trousersColor === "暂未填写")) {
                return '人员';
            } else {
                var persondata = [name, gender, jacketColor, trousersColor];
                var str = mergeStr(persondata);
                return str;
            }
        };

        function resthelp(restName) {
            if (!restName || restName === "暂未填写") {
                return '其他';
            } else {
                return restName;
            }
        };

        function scenehelp(categoryMain, subcategoryMain, weather) {
            if ((!categoryMain || categoryMain === "暂未填写") && (!weather || weather === "暂未填写")) {
                return '场景';
            } else {
                var scenedata = [ST[categoryMain] ? ST[categoryMain][0] : "", ST[subcategoryMain] ? ST[subcategoryMain][0] : '', SK.weather[weather]];
                var str = mergeStr(scenedata);
                return str;
            }
        };
        Handlebars.registerHelper('casecar', function(licenseNumber, licenseType, carColor) {
            return carhelp(licenseNumber, licenseType, carColor);
        });

        Handlebars.registerHelper('caseexhibit', function(name, shape, color) {
            return exhibithelp(name, shape, color);
        });
        Handlebars.registerHelper('casemove', function(type, color, height, gray) {
            return movehelp(type, color, height, gray);
        });

        Handlebars.registerHelper('caseperson', function(name, gender, jacketColor, trousersColor) {
            return personhelp(name, gender, jacketColor, trousersColor);
        });

        Handlebars.registerHelper('caseothers', function(restName) {
            return resthelp(restName);
        });
        Handlebars.registerHelper('casesence', function(categoryMain, subcategoryMain, weather) {
            return scenehelp(categoryMain, subcategoryMain, weather);
        });


        Handlebars.registerHelper("eq", function(name, str, options) {
            return name === str ? options.fn(this) : options.inverse(this);
        });

        //注： rest类型和others相同即其他结构化类型，后台返回为rest，前台标示为others
        //move类型和moving相同即运动目标结构化类型，后台返回为moving，前台标示为move
        Handlebars.registerHelper("isType", function(type, incidentid, options) {
            var result;
            if (_.isNull(incidentid)) { //案事件无关的
                result = type
            } else { //案事件相关的
                if (_.has(conf.typeObj.data, type)) {
                    result = conf.typeObj.data[type];
                }
            }
            return result;
        });
        Handlebars.registerHelper("isIncident", function(type, options) {
            return type === "incident" ? options.fn(this) : options.inverse(this);
        });
        Handlebars.registerHelper("isTrail", function(incidentid, options) {
            return _.isNull(incidentid) ? options.inverse(this) : options.fn(this);
        });
        Handlebars.registerHelper("isTrack", function(type, incidentid, options) {
            if (!_.isNull(incidentid)) {
                return (_.has(conf.trackObj.data, type)) ? options.fn(this) : options.inverse(this);
            }
        });
        Handlebars.registerHelper("isStruct", function(type, incidentid, options) {
            if (_.isNull(incidentid)) {
                return (_.has(conf.trackObj.data, type)) ? options.fn(this) : options.inverse(this);
            }
        });
        Handlebars.registerHelper("isIncidentPicVideo", function(type, incidentid, options) {
            if (!_.isNull(incidentid)) {
                return (type === "image" || type === "video") ? options.fn(this) : options.inverse(this);
            }
        });
        Handlebars.registerHelper("isPicVideo", function(type, incidentid, options) {
            if (_.isNull(incidentid)) {
                return (type === "image" || type === "video") ? options.fn(this) : options.inverse(this);
            }
        });
        Handlebars.registerHelper("statue", function(status, options) {
            if (_.has(conf.statueObj.data, status)) {
                return conf.statueObj.data[status];
            }
        });
        Handlebars.registerHelper("classstatue", function(status, options) {
            if (_.has(conf.classStatueObj.data, status)) {
                return conf.classStatueObj.data[status];
            }
        });
        Handlebars.registerHelper("trackType", function(type, options) {
            if (_.has(conf.trackObj.data, type)) {
                return conf.trackObj.data[type];
            }
        });
        Handlebars.registerHelper("mills2str", function(mills, options) {
            return Toolkit.formatDate(new Date(mills));
        });
        Handlebars.registerHelper("displaytype", function(name, incidentid, options) {
            var result = name;
            if (incidentid) {
                result = 'i' + result;
            }
            return result;
        });


        Handlebars.registerHelper("showImage", function(path, options) {
            return jQuery.trim(path) !== "" ? path : "/module/common/images/upload.png";
        });
        Handlebars.registerHelper("showTrueNameln", function() {
            var arg = Array.prototype.slice.call(arguments);
            var trueName = [];
            if (arg.length !== 0) {
                var len = arg.length;
                for (var i = 1; i < len - 1; i++) {
                    if (!arg[i] || arg[i] === "暂未填写") {
                        continue;
                    }
                    var temp = (arg[i] + '').replace(/<em class="height-light">/gi, "");
                    trueName[i - 1] = temp.replace(/<\/em>/gi, "");
                }
                switch (arg[0]) {
                    case "car":
                        return carhelp(trueName[0], trueName[1], trueName[2]);
                        break;
                    case "person":
                        return personhelp(trueName[0], trueName[1], trueName[2], trueName[3]);
                        break;
                    case "scene":
                        return scenehelp(trueName[0], trueName[1], trueName[2]);
                        break;
                    case "exhibit":
                        return exhibithelp(trueName[0], trueName[1], trueName[2]);
                        break;
                    case "moving":
                        return movehelp(trueName[0], trueName[1], trueName[2], trueName[4]);
                        break;
                    case "rest":
                        return resthelp(trueName[0]);
                        break;
                }
            }
        });
        //用来去掉高亮字符外标签
        Handlebars.registerHelper("showTrueName", function(param, options) {
            if (!!param) {
                var incidentname = param.replace(/<em class="height-light">/gi, ""),
                    incidentname = incidentname.replace(/<\/em>/gi, "");
                return incidentname;
            }
        });

        //面包屑助手
        Handlebars.registerHelper("showName", function(pagetype, options) {
            if (_.has(conf.showNameObj.data, pagetype)) {
                return conf.showNameObj.data[pagetype];
            }
        });
        Handlebars.registerHelper("showHome", function(home, options) {
            if (_.has(conf.showHomeObj.data, home)) {
                return conf.showHomeObj.data[home];
            }
        });

        Handlebars.registerHelper("showHomeHref", function(home, options) {
            if (_.has(conf.showHomeHrefObj.data, home)) {
                return conf.showHomeHrefObj.data[home];
            }
        });
        Handlebars.registerHelper("showInc", function(data, options) {
            if (data.pagetype === 'traillist') {
                if (data.filetype === "1") { //视频
                    url = "/service/pvd/get_video_structeds";
                    FilterData.setUrl(url);
                } else if (data.filetype === "2") { //图片
                    url = "/service/pvd/get_image_structeds";
                    FilterData.setUrl(url);
                } else {
                    url = "/service/pvd/get_incident_structeds";
                    FilterData.setUrl(url);
                }
                window.filterData.b = data.incidentid;
                return options.fn(this);
            } else if (data.pagetype === 'structlist') {
                url = "/service/pvd/structeds/" + data.fileid;
                FilterData.setUrl(url);
                window.filterData.sf = data.filetype;
                return options.inverse(this);
            }
        });
        Handlebars.registerHelper("showfile", function(filetype, options) {
            return filetype === undefined ? options.inverse(this) : options.fn(this);
        });
        Handlebars.registerHelper("showIncHref", function(data, options) {
            var orgid = data.orgid === undefined ? '' : data.orgid;
            var result = '/module/viewlibs/details/incident/incident_detail.html?id=' + data.incidentid + "&incidentname=" + data.incidentname + "&pagetype=" + data.home + "&orgid=" + orgid;
            return result;
        });
        Handlebars.registerHelper("showFileHref", function(data, options) {
            var orgid = (data.orgid === undefined ? '' : data.orgid);
            window.filterData.r = data.fileid;
            var fileUrl;

            if (data.filetype === "1") { //视频
                fileUrl = '/module/viewlibs/details/media/video.html?';
            } else if (data.filetype === "2") { //图片
                fileUrl = '/module/viewlibs/details/media/picture.html?';
            }
            if (data.pagetype === 'traillist') {
                fileUrl = fileUrl + "incidentname=" + data.incidentname + "&";
            }

            var result = fileUrl + 'fileType=' + data.filetype + '&id=' + data.fileid + "&pagetype=" + data.home + "&orgid=" + orgid;
            return result;
        });
    };

    var isStructOrThreadList = function(pagetype) {
        //如果是结构化、线索信息列表，二次搜索显示在面包屑后面
        if (pagetype === 'traillist') {
            jQuery(".sheader").remove();
            jQuery("#content .wrapper .breadcrumb").addClass("newsheader");
            jQuery("#content .wrapper .breadcrumb").append('<li><span class="divider">&gt;</span><input type="text" value="" name="" class="input-text create" /><input class="secondseach" readonly="" /></li>');
        } else if (pagetype === 'structlist') {

            jQuery(".sheader").remove();
            jQuery("#content .wrapper .breadcrumb").addClass("newsheader");
            jQuery("#content .wrapper .breadcrumb").append('<li><span class="divider">&gt;</span><input type="text" value="" name="" class="input-text create" /><input class="secondseach" readonly="" /></li>');
        }
        var clue = Toolkit.paramOfUrl(location.href).clue;
        if (clue == 2 && jQuery("#content .wrapper ul.breadcrumb li").length == 5) {
            jQuery("#content .wrapper ul.breadcrumb li").eq(3).html("结构化列表信息");
        }
    };

    var loadCrumbs = function(source, param, filterData) {
        var template = Handlebars.compile(source);
        jQuery('.breadcrumb').show().append(template({
            data: param
        }));
        //修改面包屑 如果url里有clue=2则为结构化信息
        var clue = Toolkit.paramOfUrl(location.href).clue;
        if (clue == 2 && jQuery("#content .wrapper ul.breadcrumb li").length == 3) {
            jQuery("#content .wrapper ul.breadcrumb li").eq(2).html("结构化列表信息");
        }
        isStructOrThreadList(param.pagetype);
        /**时间控件*/
        jQuery('.input-time').datetimepicker(conf.dateTimePickerConf);
        FilterData.setUrl(url);
        var filtermap = FilterData.getFilter()
        filtermap = Object.merge(filtermap, filterData);
        FilterData.loadResource(filtermap); //载入筛选信息
    };

    var checkCaseEventTriggerClick = function() {
        jQuery('[data-filter="a"] .caseinfo a').trigger('click');
        jQuery('[data-filter="f"] .case a').trigger('click');
        jQuery('[data-filter="v"] [data-type="willaudit"] a').trigger('click');
        if (!parent.jQuery('.workbench[data-id="14"]').hasClass("active")) {
            parent.jQuery('.workbench[data-id="14"]').addClass("active").siblings().removeClass("active");
        }
    };

    var checkedInfoTriggerClick = function() {
        jQuery('[data-filter="a"] .doubt a').trigger('click');
        jQuery('[data-filter="f"] .struct a').trigger('click');
        jQuery('[data-filter="v"] [data-type="willaudit"] a').trigger('click');
        if (!parent.jQuery('.workbench[data-id="14"]').hasClass("active")) {
            parent.jQuery('.workbench[data-id="14"]').addClass("active").siblings().removeClass("active");
        }
    };

    var timeSortFlash = function() {
        jQuery(document).off('click', '.filter[data-filter="f"] a').on("click", ".filter[data-filter='f'] a", function(e) {
            var item = jQuery(this).closest('li');
            var msg = '';
            if (!item.is('[data-type="all"]')) {
                jQuery('[data-filter="m"]').show();
                if (item.is('[data-type="case"]')) {
                    jQuery('[data-filter="m"] .name').text('案发时间');
                    msg = "起案事件";
                } else if (item.is('[data-type="trail"]') || item.is('[data-type="struct"]')) {
                    jQuery('[data-filter="m"] .name').text('目标出现时间');

                    msg = "条线索";
                    if (item.is('[data-type="struct"]')) {
                        msg = "条结构化信息";
                    }
                } else {
                    jQuery('[data-filter="m"] .name').text('拍摄时间');
                    if (item.is('[data-type="video"]')) {
                        msg = "个视频";
                    } else {
                        msg = "个图片";
                    }
                }
                jQuery(".order-cases .total .infotype").text(msg);
            } else {
                jQuery('[data-filter="m"]').hide();
                jQuery(".order-cases .total .infotype").text('个资源信息');
            }
        });
    };

    var resetReminderInfo = function() {
        jQuery(document).off('click', '.filter[data-filter="a"] a').on("click", ".filter[data-filter='a'] a", function(e) {
            jQuery('[data-filter="m"]').hide();
            jQuery(".order-cases .total .infotype").text('个资源信息');

        });
    };

    //我的工作台单页面跳转内容，暂时没有用的。
    var jumpFun = function(showtype, initParams) {
        switch (showtype) {
            case 'incident':
                {
                    jQuery('#content').html('');
                    require(['/module/viewlibs/details/incident/js/init.js'], function(init) {
                        jQuery('.workbench').each(function() {
                            jQuery(this).remove();
                        });
                        jQuery('head').append('<link type="text/css" rel="stylesheet" href="/module/viewlibs/common/pagination.css" class="incident" /><link type="text/css" rel="stylesheet" href="/libs/thickbox/thickbox.css"  class="incident"/><link type="text/css" rel="stylesheet" href="/module/viewlibs/details/incident/css/incident_detail.css" class="incident"/>');
                        jQuery('.sheader').remove();
                        init(jQuery('#content'), initParams);
                    });
                };
                break;
            case 'iimage':
            case 'image':
                {
                    jQuery('#content').html('');
                    require(['/module/viewlibs/details/media/js/initImage.js'], function(init) {
                        jQuery('.workbench').each(function() {
                            jQuery(this).remove();
                        });
                        jQuery('head').append('<link type="text/css" rel="stylesheet"  href="/libs/jquery/jquery-ui.css" class="mediaImage" /> <link type="text/css" rel="stylesheet" href="/module/viewlibs/details/media/css/picture.css" class="mediaImage"/>');
                        jQuery('.sheader').remove();
                        init(jQuery('#content'), initParams);
                    });
                };
                break;
            case 'ivideo':
            case 'video':
                {
                    jQuery('#content').html('');
                    require(['/module/viewlibs/details/media/js/initVideo.js'], function(init) {
                        jQuery('.workbench').each(function() {
                            jQuery(this).remove();
                        });
                        jQuery('head').append('<link type="text/css" rel="stylesheet" href="/component/panel/main.css" class="mediaVideo" /><link rel="stylesheet" type="text/css" href="/module/viewlibs/doubtlib/css/entity.css" class="mediaVideo" /><link type="text/css" rel="stylesheet" href="/module/viewlibs/details/media/css/video.css" class="mediaVideo" />');
                        jQuery('.sheader').remove();
                        init(jQuery('#content'), initParams);
                    });
                };
                break;
            case 'icar':
            case 'car':
            case 'iperson':
            case 'person':
            case 'iexhibit':
            case 'exhibit':
            case 'iscene':
            case 'scene':
            case 'imove':
            case 'move':
            case 'iothers':
            case 'others':
                {
                    jQuery('#content').html('');
                    require(['/module/viewlibs/details/struct/js/initStruct.js'], function(init) {
                        jQuery('.workbench').each(function() {
                            jQuery(this).remove();
                        });
                        jQuery('head').append('<link type="text/css" rel="stylesheet"  href="/libs/jquery/jquery-ui.css" class="structDetail" /><link type="text/css" rel="stylesheet" href="/libs/jquery/jquery.datetimepicker.css" class="structDetail" /><link type="text/css" rel="stylesheet" href="/module/viewlibs/common/common.css" class="structDetail" /><link type="text/css" rel="stylesheet" href="/module/viewlibs/doubtlib/css/entity.css" class="structDetail" /><link type="text/css" rel="stylesheet" href="/libs/thickbox/thickbox.css" class="structDetail" /><link type="text/css" rel="stylesheet" href="/module/viewlibs/doubtlib/css/tab.css" class="structDetail" />');
                        jQuery('.sheader').remove();
                        init(jQuery('#content'), initParams);
                    });
                };
                break;
        };

    };

    var thumbnailLink = function(setUrl, pagetype) {
        jQuery(document).off('click', '.items-list .thumb-figure .thumb-anchor').on("click", ".items-list .thumb-figure .thumb-anchor", function() {
            var thumb = jQuery(this).closest("li"),
                showtype = thumb.attr("data-showType"), //用于展示的类型
                id = thumb.attr("data-id"),
                temUrl = '',
                incidentName = thumb.find("[data-incidentname]").attr("data-incidentname");
            if (incidentName === undefined) {
                if (_.has(_.pick(conf.unIncidentTypeObj.data, 'rest', 'moving'), showtype)) {
                    showtype = conf.unIncidentTypeObj.data[showtype];
                }
            } else if (_.has(_.pick(conf.typeObj.data, 'rest', 'moving'), showtype)) { //转换其他的类型关键字
                showtype = conf.typeObj.data[showtype];
            }
            temUrl = '&pagetype=' + pagetype + "&orgid=" + FilterData.getOrgId();
            initParams = setUrl(showtype, incidentName).split('?')[1] + id + temUrl;
            //jumpFun(showtype,initParams);
            var url = setUrl(showtype, incidentName) + id + temUrl;
            broadcast.emit("dealWindowLocation", {
                "dataUrl": url,
                "firstNav": "viewlibs",
                "secondNav": "workbench"
            }); // songxj new add
            window.location.href = url;

        });
    };

    var mainOfficialLink = function(pagetype) {
        /**缩略图下方（视、图、结构化信息）主文案链接*/
        jQuery(document).off('click', '.items-list  .synopsis .name').on("click", ".items-list  .synopsis .name", function() {
            jQuery(this).closest("li").find(".thumb-anchor").trigger('click');
        });

        /**案事件文案链接（包括所属和主文案）*/
        jQuery(document).off('click', '.items-list  .synopsis .casename').on("click", ".items-list  .synopsis .casename", function() {
            var incidentId = jQuery(this).attr("data-incidentid");
            var incidentName = jQuery(this).attr("data-incidentname");
            var highlight = FilterData.getHightlight();
            window.location.href = '/module/viewlibs/details/incident/incident_detail.html?id=' + incidentId + "&incidentname=" + incidentName + "&pagetype=" + pagetype + "&orgid=" + FilterData.getOrgId();
        });
    };

    var onceSearch = function() {
        //二次搜索
        jQuery(document).off('click', '.sheader .secondseach,.newsheader .secondseach').on("click", ".sheader .secondseach,.newsheader .secondseach", function() {
            FilterData.secondSeach();
        });
        //二次搜索回车
        jQuery(".sheader .create,.newsheader .create").keydown(function(event) {
            if (event.keyCode === 13) {
                FilterData.secondSeach();
            }
        });
    };

    return {
        addHelper: addHelper,
        loadCrumbs: loadCrumbs,
        filterData: filterData,
        checkCaseEventTriggerClick: checkCaseEventTriggerClick,
        checkedInfoTriggerClick: checkedInfoTriggerClick,
        timeSortFlash: timeSortFlash,
        resetReminderInfo: resetReminderInfo,
        thumbnailLink: thumbnailLink,
        mainOfficialLink: mainOfficialLink,
        onceSearch: onceSearch
    };
});
define([
    '/module/viewlibs/common/js/ChoosePanel.js',
    '/module/viewlibs/common/js/Pie.js',
    '/module/viewlibs/common/panel_import.js',
    '/module/viewlibs/common/js/uploadIcp.js',
    'handlebars',
    'base.self',
    'jquery-ui-1.10.1.custom.min',
    'jquery-ui-timepicker-addon',
    'common.cascade',
    'echarts-plain',
    'jquery.pagination',
    'scrollbar',
    'thumbs-balance',
    'permission'
], function(ChoosePanel, iPie, panelImport, uploadDialog) {
    //因渲染问题暂时写成window
    window.filterData = {
        p: 1, //    第几页(默认 0 代表全部)
        np: 12 // 每页包含多少项（最大500，最小1，默认值为50）
    };
    var organization = '',
        orgId = '',
        url = '/service/pvd/work_bench',
        template_url = '/module/viewlibs/workbench/inc/tpl_workbench.html';
    //实时结构化疑情信息库需求
    var realtimeUrl = {
        GET_DIRECTORY_LIST: '/service/pvd/realtime/directory', //获取摄像头信息列表
        GET_STRUCTURES_LIST: '/service/pvd/realtime/structures', //获取某个摄像头下的结构化信息列表
        REDIRECT_DIRECTORY: '/module/viewlibs/doubtlib/inc/video_doubtlib.html', //摄像头信息列表页面
        REDIRECT_STRUCTURES: '/module/viewlibs/doubtlib/inc/videoinfo_doubtlib.html' //摄像头下的结构化信息列表页面
    }
    var getChildList = function(list) {
        if (typeOf(list) === 'array') {
            var result = [];
            var len = list.length;
            while (len--) {
                if (list[len].childList.length) {
                    result = result.append(list[len].childList);
                }
            }
            return result;
        }
    }

    var getChildOrgs = function(callback, isAdd) {
        var self = this;
        var currentUser = window.localStorage.getItem('currentUser');
        var childOrgs = window.localStorage.getItem('childOrgs');
        if (childOrgs) {
            cUser = JSON.parse(currentUser);
            if (cUser.organization === 'leaf') {
                jQuery("#setImportantIncident").remove(); //移除设置重大案事件按钮
                callback();
                return;
            } else {
                var sHtml = window.localStorage.getItem('strorageHtml');
                if (sHtml) {
                    jQuery('.filter-panel [data-filter="n"]').before(sHtml);
                    handleDisplay(cUser.organization, callback);
                }
            }

        } else {
            jQuery.get('/service/org/current', function(res) {
                if (res.code === 200) {
                    var orgName = res.data.org.name;
                    var orgId = res.data.org.id;

                    var organization = organization = res.data.org.isChild;
                    var selfObj = [{
                        'id': orgId,
                        'name': orgName,
                        'isSelf': 0
                    }];
                    if (!isAdd) {
                        orgId = res.data.org.id;
                    }
                    var localCurrent = {
                        'id': orgId,
                        'name': orgName,
                        'organization': organization
                    };
                    //写入localStorage
                    window.localStorage.setItem('currentUser', JSON.stringify(localCurrent));

                    jQuery.when(jQuery.get('/service/org/tree/' + orgId)).done(function(response) {
                        var resData = response.data.orgs;
                        if (response.code === 200) {
                            var renderData = {};
                            if (organization === 'root') { //省厅
                                var branchData = getChildList(resData);
                                renderData = {
                                    'province': selfObj,
                                    'city': resData,
                                    'branch': branchData
                                };
                            } else if (organization === 'tree') { //市局
                                renderData = {
                                    'province': null,
                                    'city': selfObj,
                                    'branch': resData
                                };
                            } else if (organization === 'leaf') { //分局
                                renderData = {
                                    'province': null,
                                    'city': null,
                                    'branch': selfObj
                                };
                                jQuery("#setImportantIncident").remove();
                                callback();
                                return;
                            }
                            //写入localStorage
                            window.localStorage.setItem('childOrgs', JSON.stringify(renderData));

                            //如果下级返回空数组，表示以及是最下级部分，不再显示“存储单位”
                            jQuery.when(Toolkit.loadTempl('/module/viewlibs/common/tpl_storage_unit.html').done(function(source) {

                                var template = Handlebars.compile(source);
                                var strorageHtml = template(renderData);
                                window.localStorage.setItem('strorageHtml', strorageHtml);
                                jQuery('.filter-panel [data-filter="n"]').before(template(renderData));
                                handleDisplay(organization, callback);
                            }));
                        }
                    });
                }
            });
        }

    };

    var handleDisplay = function(organization, callback) {
        var self_li = jQuery('.filter .container .box [data-self="0"]');
        //如果是市局
        if (organization === 'tree') {
            jQuery('.filter .container .moreinfo .tabular [data-tab="province"]').addClass('disabled').removeAttr('data-tab');
            jQuery('.filter .container .box dt.province').remove();
        }
        self_li.addClass('active');
        jQuery('.filter .container .current').text(jQuery(self_li[0]).find('a').text());
        //如果当前是自己的话，将orgid为空，如果不为空，则代表下级orgid  该参数的会影响页面跳转时的传参
        //jQuery('.filter .container .current').attr('data-key',jQuery(self_li[0]).attr('data-key'));

        jQuery('[data-filter="c"] li').eq(0).addClass("active");
        //更换饼区信息
        //jQuery('.filter-panel [data-filter="c"]').hide()
        var msg = jQuery('[data-filter="c"] li a').eq(0).text();
        // jQuery("#sidebar .module-head .location").text('(' + msg + ')');
        callback();
    };

    // var secondSeach = function () {
    //     var self = this;
    //     var secondSeachData = {};
    //     var firstSearch = getFilter();
    //     if(jQuery(".sheader input.input-text").val()){
    //         secondSeachData['condition'] = jQuery(".sheader input.input-text").val();
    //     }else{
    //         secondSeachData['condition'] = jQuery(".newsheader input.input-text").val();
    //     }
    //     secondSeachData = Object.merge(firstSearch, secondSeachData);

    //     loadResource(secondSeachData);
    // };
    var secondSeach = function() {
        var ajaxData = getRealTimeFilter();
        if (jQuery(".filter-box .header .tabs li[data-tab='video']").attr("data-click") === "true") {
            jQuery(".filter-box .header .tabs li[data-tab='video']").attr("data-click", "info");
            loadVideoResource(realtimeUrl.GET_STRUCTURES_LIST, ajaxData, realtimeUrl.REDIRECT_STRUCTURES);
            return;
        } else if (jQuery(".filter-box .header .tabs li[data-tab='video']").attr("data-click") === "info") {
            if (sessionStorage.getItem("cameraId")) {
                ajaxData.cameraChannelId = sessionStorage.getItem("cameraId");
            }
            loadVideoResource(realtimeUrl.GET_STRUCTURES_LIST, ajaxData, realtimeUrl.REDIRECT_STRUCTURES);
        } else {
            var self = this;
            var secondSeachData = {};
            var firstSearch = getFilter();
            if (jQuery(".sheader input.input-text").val()) {
                secondSeachData['condition'] = jQuery(".sheader input.input-text").val();
            } else {
                secondSeachData['condition'] = jQuery(".newsheader input.input-text").val();
            }
            secondSeachData = Object.merge(firstSearch, secondSeachData);
            loadResource(secondSeachData);
        }
    };

    var getHightlight = function() {
        var hrefStr = location.href;
        var hrefLen = hrefStr.length;
        var sIndex = hrefStr.indexOf("3-");
        var askIndex = hrefStr.indexOf("?");
        var diff = hrefLen - sIndex;
        var result = '';
        if ((askIndex === -1) && diff < 5) {
            result = hrefStr.substring(sIndex);
        } else {
            result = hrefStr.split('?')[0].split('/').getLast();
        }
        return result;
    };

    var removeResource = function(item) {
        var id = jQuery(item).data("id"),
            type = jQuery(item).data("type"),
            url = "",
            self = this;
        switch (type) {
            case "video":
            case "image":
                url = "/service/pvd/delete_video_info";
                break;
            default:
                url = "/service/pvd/delete_" + type + "_info";
                break;
        }
        jQuery(item).remove();
        jQuery.ajax({
            url: url,
            data: {
                id: id, //资源id
                fileType: type //资源类型，主要针对delete_video_info
            },
            type: "post",
            success: function() {
                jQuery(item).remove();
                notify.success("删除成功！", {
                    timeout: 500
                });
                loadResource(getFilter()); //重新加载资源
            }
        });
    };

    var renderResult = function(data) {
        var self = this;
        jQuery.when(Toolkit.loadTempl(template_url)).done(function(source) {
            var template = Handlebars.compile(source);
            jQuery("#content .main  .box .items-panel").remove();
            var isSearch = jQuery("#content .main  .box .items-panel").hasClass("isSearch");
            jQuery("#content .main  .box .content ").prepend(template({
                list: data
            }));
            if (isSearch) {
                return;
            }
            // 根据窗口大小绘制底部案件缩略图的间距
            (function() {
                var unit = 190,
                    side = 10,
                    adapt = jQuery('.auto-adapt'),
                    panel = adapt.parent(),
                    items = adapt.children('li');

                var repaintIncident = function() {
                    var width = panel.width(),
                        count = ((width + side * 2) / unit).toInt();
                    items.css('margin', 10);
                    adapt.css('width', width + side * 2);

                    var over = (width + side * 2) - unit * count,
                        margin = ((over / count) / 2).toInt();

                    items.css({
                        marginLeft: side + margin,
                        marginRight: side + margin
                    });

                    panel.children('.loading').remove();
                    adapt.removeClass('hide');
                };

                jQuery(window).on('resize', repaintIncident).triggerHandler('resize');
            })();
        });

    };

    var setPagination = function(total, selector, itemsPerPage, ajaxData, callbacks) {
        if (!ajaxData.dataType) {
            jQuery(selector).pagination(total, {
                orhide: false,
                first_loading: false,
                num_display_entries: 4, //连续分页主体部分显示的分页条目数
                items_per_page: itemsPerPage, //每页显示的条目数
                prev_text: "上一页",
                next_text: "下一页",
                ellipse_text: "...", //省略的页数用什么文字表示
                num_edge_entries: 2, //两侧显示的首尾分页的条目数  默认是2
                callback: function(pageIndex, jq) {
                    callbacks(pageIndex + 1);
                }
            });
        } else {
            jQuery(selector).pagination(total, {
                orhide: false,
                first_loading: false,
                num_display_entries: 4, //连续分页主体部分显示的分页条目数
                items_per_page: itemsPerPage, //每页显示的条目数
                current_page: ajaxData.currentPage - 1, //当前选中的页面，默认是0，表示第1页
                prev_text: "上一页",
                next_text: "下一页",
                ellipse_text: "...", //省略的页数用什么文字表示
                num_edge_entries: 2, //两侧显示的首尾分页的条目数  默认是2
                callback: function(pageIndex, jq) {
                    callbacks(pageIndex + 1);
                }
            });
        }
    }

    var getFilter = function() {

        var $filter = jQuery('[data-filter]');
        var count = $filter.size();
        var filtermap = {};
        var self = this;

        //遍历筛选参数key:val
        while (count--) {
            var fKey = jQuery($filter[count]).attr("data-filter");
            var fVal = jQuery($filter[count]).attr("data-key");
            if (fVal === undefined) { //获取筛选区的筛选值
                fVal = jQuery($filter[count]).find('.active').attr("data-key");
                filtermap[fKey] = fVal;
            } else { //获取非筛选区的筛选值（排序区）
                if (jQuery($filter[count]).hasClass('active')) {
                    filtermap[fKey] = fVal;
                }
            }
            //自定义时间
            if (jQuery($filter[count]).is('input')) {
                filtermap[fKey] = jQuery($filter[count]).val();
            }
            // 创建人员
            if (fKey === "n") {
                fVal = jQuery($filter[count]).find(".create").val();
                filtermap[fKey] = fVal;
            }
            // 存储单位
            if (fKey === "c") {
                fVal = jQuery($filter[count]).find('.current').attr("data-key");
                filtermap[fKey] = fVal;
            }
        }

        //合并分页参数
        filtermap = Object.merge(filtermap, window.filterData);
        return filtermap;
    };
    /**
     * [getRealTimeFilter description]
     * @author zhangxinyu
     * @date   2015-6-25
     * @return {[type]}       filtermap  [object]
     */
    var getRealTimeFilter = function() {
        var filtermap = {};
        var date = new Date();
        var year = date.getFullYear();
        var month = date.getMonth();
        var day = date.getDate();
        var timestamp = Date.parse(new Date());
        var timeType = jQuery('[data-filter="t"] ul .active').attr("data-key"); //创建时间类型
        filtermap.structureType = (jQuery('[data-filter="l"] ul .active').attr("data-key")) * 1; //信息类型(number类型)
        switch (timeType) {
            case "0": //全部
                filtermap.startTime = '';
                filtermap.endTime = '';
                break;
            case "1": //今日
                filtermap.startTime = Toolkit.strToUnix(year + "-" + (month + 1) + "-" + day + " " + "00:00:00");
                filtermap.endTime = timestamp;
                break;
            case "2": //昨日
                filtermap.startTime = Toolkit.strToUnix(year + "-" + (month + 1) + "-" + (day - 1) + " " + "00:00:00");
                filtermap.endTime = Toolkit.strToUnix(year + "-" + (month + 1) + "-" + (day - 1) + " " + "23:59:59");
                break;
            case "3": //近7天
                filtermap.startTime = timestamp - 7 * 24 * 60 * 60 * 1000;
                filtermap.endTime = timestamp;
                break;
            case "4": //近30天
                filtermap.startTime = timestamp - 30 * 24 * 60 * 60 * 1000;
                filtermap.endTime = timestamp;
                break;
            case "9": //近1小时
                filtermap.startTime = timestamp - 60 * 60 * 1000;
                filtermap.endTime = timestamp;
                break;
            case "7": //近10分钟
                filtermap.startTime = timestamp - 10 * 60 * 1000;
                filtermap.endTime = timestamp;
                break;
        }
        filtermap.key = jQuery(".sheader input.input-text").val(); //搜索关键字
        if (jQuery('[data-filter="o"]').hasClass("active")) {
            filtermap.createSort = (jQuery('[data-filter="o"]').attr("data-key")) * 1; //创建时间排序(number类型) 2 升序 1降序 
        } else {
            filtermap.objectSort = (jQuery('[data-filter="m"]').attr("data-key")) * 1; //目标出现时间排序(number类型) 2 升序 1降序  
        }
        filtermap.id = "";
        filtermap.jobId = "";
        filtermap.cameraChannelId = "";
        filtermap.currentPage = filterData.p; //第几页
        filtermap.pageSize = filterData.np; //每页显示条数
        return filtermap;
    };

    var loadResource = function(params) {
        var self = this,
            rs = 0;
        var pagetype = Toolkit.paramOfUrl(location.href).pagetype;
        var home = Toolkit.paramOfUrl(location.href).home;
        if (!home) {
            home = location.href.split("?")[0].test("/workbench/");
            home = "workbench";
        }
        if (pagetype !== "workbench") {
            if (pagetype === "structlist" && home && home === "workbench") {
                rs = 0;
            } else {
                rs = 1;
            }
        }
        //移除二次搜索选项中内容
        if (!params.condition) {
            jQuery(".sheader .input-text").val('');
        }

        jQuery("#content .main .box .content .items-panel").remove(); //移除内容区列表
        // 保持单例模式
        if (self.ajaxRequest) {
            self.ajaxRequest.abort();
            self.ajaxRequest = null;
        }

        self.ajaxRequest = jQuery.ajax({
            url: url + "?timestamp=" + new Date().getTime(), //self.url调用父类中的url
            type: 'get',
            data: Object.merge(params, {
                rs: rs
            }),
            cache: false,
            success: function(res) {
                if (res.code === 200) {
                    jQuery("#content .main .box .loading").remove(); //隐藏loading效果
                    var totalPages = ''; //总页树
                    var totalRecords = ''; //总资源数
                    var pageNo = ''; //当前页码
                    var renderData = null; //将要渲染的数据
                    //线索集
                    if (res.data.incidentName) {
                        jQuery(".breadcrumb .incident-link a").text(res.data.incidentName);
                        totalPages = res.data.records.totalPages;
                        totalRecords = res.data.records.totalRecords;
                        pageNo = res.data.records.pageNo;
                        renderData = res.data.records.list;
                    } else if (res.data.structures) {
                        totalPages = res.data.structures.totalPages;
                        totalRecords = res.data.structures.totalRecords;
                        //pageNo = res.data.pageNo;
                        renderData = res.data.structures.rows;
                    } else { //非线索集
                        totalPages = res.data.totalPages;
                        totalRecords = res.data.totalRecords;
                        pageNo = res.data.pageNo;
                        renderData = res.data.list;
                    }
                    //如果资源树等于0时，则当前页面也置为0
                    if (totalRecords === 0) {
                        pageNo = 0;
                    }

                    jQuery(".order-cases .total .count").text(totalRecords); //资源总数
                    jQuery(".order-cases .total .totalpage").text("/" + totalPages); //总页数
                    jQuery(".order-cases .total .curpage").text(pageNo); //当前页码
                    //修改疑情库tabs切换指向正确的handlebars模板
                    if (jQuery(".filter-box .header .tabs li[data-tab='video']").attr("data-click") === "false") {
                        template_url = '/module/viewlibs/doubtlib/inc/tpl_doubtlib.html';
                    }
                    // findthumbnail(renderData);//获取资源你的缩略图
                    renderResult(renderData);
                    if (totalPages < 0) { //少于一页时将所有筛选结果数据直接渲染模板
                        jQuery(".order-cases .total .count").text(totalRecords); //资源总数
                        jQuery(".order-cases .total .totalpage").text("/" + totalPages); //总页数
                        jQuery(".order-cases .total .curpage").text(pageNo); //当前页码
                        renderResult(renderData);
                        jQuery(".itempager").hide();
                    } else {
                        jQuery(".itempager").show();
                        setPagination(totalRecords, '.box .content .pagepart', filterData.np, {}, function(nextPage) {
                            jQuery.ajax({
                                url: url + '?timestamp=' + new Date().getTime(),
                                type: "get",
                                data: Object.merge(params, {
                                    p: nextPage,
                                    rs: rs
                                }),
                                dataType: 'json',
                                success: function(res) {
                                    if (res.code === 200) {
                                        var totalPages = '';
                                        var totalRecords = '';
                                        var pageNo = '';
                                        var renderData = null;

                                        //线索集
                                        if (res.data.incidentName) {
                                            //修改面包屑
                                            jQuery(".breadcrumb .incident-link a").text(res.data.incidentName);
                                            totalPages = res.data.records.totalPages;
                                            totalRecords = res.data.records.totalRecords;
                                            pageNo = res.data.records.pageNo;
                                            renderData = res.data.records.list;
                                        } else { //非线索集
                                            totalPages = res.data.totalPages;
                                            totalRecords = res.data.totalRecords;
                                            pageNo = res.data.pageNo;
                                            renderData = res.data.list;
                                        }
                                        //findthumbnail(renderData);//获取资源你的缩略图
                                        renderResult(renderData);
                                        jQuery(".box .content .itempager .current").html(nextPage); //修改下面分页当前页码
                                        jQuery(".order-cases .total .count").text(totalRecords);
                                        jQuery(".order-cases .total .totalpage").text("/" + totalPages);
                                        jQuery(".order-cases .total .curpage").text(pageNo);
                                        //jQuery(".itempager").show();//显示分页按钮
                                        //jQuery(".total .itempager").css("display","inline-block");
                                        if (jQuery(".pagination").length === 1) { //若当前没有加载排序区的分页节点，则追加
                                            var clone = jQuery(".itempager").clone(true);
                                            jQuery(".total").append(clone);
                                            jQuery(".total .jumpto,.total .goto").remove();
                                        } else { //否则用下方的分页节点去替换排序区的分页节点
                                            var clone = jQuery(".itempager:eq(1)").clone(true);
                                            jQuery(".pagination:eq(0)").replaceWith(clone);
                                            jQuery(".total .jumpto,.total .goto").remove();
                                            //jQuery(".pagination").show();
                                            jQuery(jQuery(".pagination")[0]).css("display", 'inline-block');

                                        }
                                    } else {
                                        notify.error(res.data);
                                    }


                                },
                                error: function() {
                                    notify.warn("网络错误，请重试！");
                                    jQuery(".main .content .loading").html("网络错误，请重试！").addClass("error");
                                }
                            });
                        });
                    }
                    if (jQuery(".pagination").length === 1) { //若当前没有加载排序区的分页节点，则追加
                        var clone = jQuery(".itempager").clone(true);
                        jQuery(".total").append(clone);
                        jQuery(".total .jumpto,.total .goto").remove();
                    } else { //否则用下方的分页节点去替换排序区的分页节点
                        var clone = jQuery(".itempager:eq(1)").clone(true);
                        jQuery(".pagination:eq(0)").replaceWith(clone);
                        jQuery(".total .jumpto,.total .goto").remove();
                        //jQuery(".pagination").show();
                        jQuery(jQuery(".pagination")[0]).css("display", 'inline-block');

                    }
                } else {
                    notify.error(res.data);
                }

            },
            error: function(err, errstatus, errthr) {
                //notify.warn("网络错误，请重试！");
                if (errstatus !== "abort") {
                    jQuery(".main .content .loading").html("网络错误，请重试！").addClass("error");
                }
            }
        });
    };
    /**
     * [loadVideoResource 针对疑情信息库中实时结构化需求]
     * @author zhangxinyu
     * @date   2015-6-25
     * @param  {[type]}                 ajaxUrl     [后端接口地址]
     * @param  {[type]}                 ajaxData    [参数]
     * @param  {[type]}                 redirectUrl [跳转页面]
     * @return {[type]}
     */
    var loadVideoResource = function(ajaxUrl, ajaxData, redirectUrl) {
        var self = this;
        //移除二次搜索选项中内容
        if (!ajaxData.key) {
            jQuery(".sheader .input-text").val('');
        }
        //更改筛选样式,合并请求参数
        if (ajaxData.dataType) {
            ajaxData = mergeData(ajaxData);
        }
        jQuery("#content .main .box .content .items-panel").remove(); //移除内容区列表
        // 保持单例模式
        if (self.ajaxRequest) {
            self.ajaxRequest.abort();
            self.ajaxRequest = null;
        }

        //请求实时视频标注的摄像头列表数据
        self.ajaxRequest = jQuery.ajax({
            url: ajaxUrl + "?timestamp=" + new Date().getTime(),
            type: 'get',
            data: ajaxData,
            cache: false,
            success: function(res) {

                if (res.code === 200) {
                    jQuery("#content .main .box .loading").remove(); //隐藏loading效果
                    var totalPages = ''; //总页树
                    var totalRecords = ''; //总资源数
                    var pageNo = '1'; //当前页码
                    var renderData = null; //将要渲染的数据
                    if (res.data.directory) {
                        renderData = res.data.directory;
                        totalPages = res.data.directory.totalPage;
                        totalRecords = res.data.directory.totalCount;
                        //pageNo = res.data.directory.pageNo;
                    } else if (res.data.structures) {
                        renderData = res.data.structures;
                        totalPages = res.data.structures.totalPage;
                        totalRecords = res.data.structures.totalCount;
                        //pageNo = res.data.structures.pageNo;
                        if (ajaxData.currentPage > 1) {
                            pageNo = ajaxData.currentPage;
                        }
                    }
                    //如果资源树等于0时，则当前页面也置为0
                    if (totalRecords === 0) {
                        pageNo = 0;
                    }

                    jQuery(".order-cases .total .count").text(totalRecords); //资源总数
                    jQuery(".order-cases .total .totalpage").text("/" + totalPages); //总页数
                    jQuery(".order-cases .total .curpage").text(pageNo); //当前页码
                    template_url = redirectUrl;
                    renderResult(renderData.rows);
                    if (totalPages < 0) { //少于一页时将所有筛选结果数据直接渲染模板
                        jQuery(".order-cases .total .count").text(totalRecords); //资源总数
                        jQuery(".order-cases .total .totalpage").text("/" + totalPages); //总页数
                        jQuery(".order-cases .total .curpage").text(pageNo); //当前页码
                        template_url = redirectUrl;
                        renderResult(renderData.rows);
                        jQuery(".itempager").hide();
                    } else {
                        jQuery(".itempager").show();

                        setPagination(totalRecords, '.box .content .pagepart', filterData.np, ajaxData, function(nextPage) {

                            jQuery("#content .main .box .content .items-panel").empty();
                            jQuery("#content .main .box .content .items-panel").html("<div class='loading'></div>");

                            jQuery.ajax({
                                url: ajaxUrl + '?timestamp=' + new Date().getTime(),
                                type: "get",
                                data: Object.merge(ajaxData, {
                                    currentPage: nextPage
                                }),
                                dataType: 'json',
                                success: function(res) {
                                    if (res.code === 200) {
                                    jQuery("#content .main .box .content .items-panel").find("div.loading").remove();
                                        var totalPages = '';
                                        var totalRecords = '';
                                        var renderData = null;
                                        if (res.data.directory) {
                                            renderData = res.data.directory;
                                            totalPages = res.data.directory.totalPage;
                                            totalRecords = res.data.directory.totalCount;
                                        } else if (res.data.structures) {
                                            renderData = res.data.structures;
                                            totalPages = res.data.structures.totalPage;
                                            totalRecords = res.data.structures.totalCount;
                                        }
                                        template_url = redirectUrl;
                                        renderResult(renderData.rows);
                                        jQuery(".box .content .itempager .current").html(nextPage); //修改下面分页当前页码
                                        jQuery(".order-cases .total .count").text(totalRecords);
                                        jQuery(".order-cases .total .totalpage").text("/" + totalPages);
                                        jQuery(".order-cases .total .curpage").text(nextPage);
                                        if (jQuery(".pagination").length === 2 || ajaxData.currentPage >= 1) { //若当前没有加载排序区的分页节点，则追加
                                            jQuery(".total .pagination").remove();
                                            var clone = jQuery(".itempager").clone(true);
                                            jQuery(".total").append(clone);
                                            jQuery(".total .pagination").css("display", "inline");
                                            jQuery(".total .jumpto,.total .goto").remove();
                                        } else { //否则用下方的分页节点去替换排序区的分页节点
                                            var clone = jQuery(".itempager:eq(2)").clone(true);
                                            jQuery(".pagination:eq(1)").replaceWith(clone);
                                            jQuery(".total .jumpto,.total .goto").remove();
                                            jQuery(jQuery(".pagination")[1]).css("display", 'inline-block');
                                        }
                                    } else {
                                        notify.error(res.data);
                                    }
                                },
                                error: function() {
                                    notify.warn("网络错误，请重试！");
                                    jQuery(".main .content .loading").html("网络错误，请重试！").addClass("error");
                                }
                            });
                        });
                    }

                    if (jQuery(".pagination").length === 2 || ajaxData.currentPage >= 1) { //因默认加载疑情信息，切换实时视频分页加载两次
                        jQuery(".total .pagination").remove();
                        var clone = jQuery(".itempager").clone(true);
                        jQuery(".total").append(clone);
                        jQuery(".total .pagination").css("display", "inline");
                        jQuery(".total .jumpto,.total .goto").remove();
                    } else { //否则用下方的分页节点去替换排序区的分页节点
                        var clone = jQuery(".itempager:eq(2)").clone(true);
                        jQuery(".pagination:eq(1)").replaceWith(clone);
                        jQuery(".total .jumpto,.total .goto").remove();
                        jQuery(jQuery(".pagination")[1]).css("display", 'inline-block');
                    }
                } else {
                    notify.error(res.data);
                }

            },
            error: function(err, errstatus, errthr) {
                //notify.warn("网络错误，请重试！");
                console.log("error");
                if (errstatus !== "abort") {
                    jQuery(".main .content .loading").html("网络错误，请重试！").addClass("error");
                }
            }
        });
    };
    // var findthumbnail = function(data) {
    //     for (var i = 0; i < data.length; i++) {
    //         if (!data[i].thumbnail) {
    //             jQuery.ajax({
    //                 url: '/service/pia/getOverlaySummary',
    //                 type: 'get',
    //                 async: false,
    //                 data: {
    //                     vid: data[i].id,
    //                     type: "viewlibs"
    //                 }
    //             }).then(function(data) {
    //                 if (data.code === 200) {
    //                     data[i].thumbnail = data.data.thumbnail;
    //                 }
    //             })
    //         }
    //     }
    // }
    var showPie = function() {
        var self = this;

        // 编译模板
        if (!self.pieTemplate) {
            self.pieTemplate = Handlebars.compile(jQuery("#pieLegendTemplate").html());
        }
        var url = "/service/pvd/get_count"; //获取统计信息后端接口

        //如果是省厅用户则url换成另外一个后端接口
        /*if (jQuery('[data-filter="c"]').is(":visible")) {
         var orgId = jQuery('[data-filter="c"] li.active').attr("data-key");
         orgId = orgId === undefined ? "" : orgId;
         url = "/service/pvd/get_incident_num_byOrgId?orgId=" + orgId;
         }*/

        // 获取统计数据
        jQuery.get(url, function(res) {
            if (res.code === 200) {
                // 设置条数
                jQuery("#sidebar ul.statistics span.no-commit").html(res.data.noSubmitIncident);
                jQuery("#sidebar ul.statistics span.no-pass").html(res.data.noPassIncident);

                jQuery("#sidebar ul.statistics span.struct-no-commit").html(res.data.noSubmitStruct);
                jQuery("#sidebar ul.statistics span.struct-no-pass").html(res.data.noPassStruct);

                // 待审核 案事件 结构化信息
                jQuery("#sidebar ul.statistics span.auditing").html(res.data.waitAuditInc);
                jQuery("#sidebar ul.statistics span.struct-auditing").html(res.data.waitAuditStr);

                // 渲染饼图
                var arr = []
                arr[0] = {
                    value: res.data.incidentNum,
                    name: '案事件',
                    color: "#788BAF"
                };
                //arr[1] = {value:res.data.structedsNum, name:'结构化信息',color:"#AF789C"};
                arr[1] = {
                    value: res.data.structNum,
                    name: '结构化信息',
                    color: "#AF789C"
                };


                // 设置图例
                jQuery("#sidebar ul.pie-legend").html(self.pieTemplate({
                    items: arr


                }));
                // 显示饼图
                Pie.show(arr);

            } else {
                notify.warn("获取统计信息失败！");
            }
        });
    }

    //获取上传数据
    var getUploadData = function() {
        var ids = [];
        jQuery('.thumb-figure').find(".checked").closest("li").each(function(index, el) {
            ids.push("'" + jQuery(this).attr("data-id") + "'") ;
        });

        if (ids.length === 0) {
            notify.warn("请选择案事件！");
            return false;
        }

        return {
            ids: ids.join()
        };
    };
    var bindEvents = function() {
        var self = this;
        /**加载资源*/
        /*self.loadResource(self.getFilter());*/

        /**筛选区点击事件*/
        jQuery(document).off('click', '.filter-panel .filter ul li a').on("click", ".filter-panel .filter ul li a", function(e) {
            var item = jQuery(this).closest("li"); //点击元素对应的li
            jQuery('[data-filter="n"] .create').val(''); //清空创建人员输入框
            item.addClass("active").siblings().removeClass("active"); //高亮筛选文字

            var childStr = item.attr("data-child"); //获取它下面要显示的data-filter的值
            //强关联项(包含data-child的筛选区都是强关联区，意思就是它的每个选项都和下面要显示或者不显示紧紧关联，不包含该属性的都是弱关联，即它的状态不影响其他元素的显隐)
            if (childStr !== undefined) {
                var childDate = childStr.split(",");
                var childLen = childDate.length;
                if (childStr !== 'no') { //强关联项，下面有关联项显示的
                    jQuery(".morefilter").hide();
                    item.closest(".morefilter").show();
                    var tem = childLen;
                    while (tem--) {
                        jQuery('[data-filter=' + childDate[tem] + ']').show();
                        jQuery('[data-filter=' + childDate[tem] + ']').find('[data-key]').show();
                        jQuery('[data-filter=' + childDate[tem] + '] [data-type="all"]').addClass("active").siblings().removeClass("active");
                    }

                    var hideStr = item.attr("data-hidekey"); //强关联项中要隐藏的data-key的值
                    if (!!hideStr) {
                        var hideDate = hideStr.split(",");
                        var hideLen = hideDate.length;
                        for (var i = 0; i < childLen; i++) {
                            var tem = jQuery('[data-filter=' + childDate[i] + ']');
                            for (var j = 0; j < hideLen; j++) {
                                tem.find('[data-key=' + hideDate[j] + ']').hide();
                            }
                        }
                    }
                } else {
                    jQuery(".morefilter").hide();
                    item.closest(".morefilter").show();
                }
            }

            //如果是存储单位
            var unit = jQuery(this).closest('[data-filter]');
            if (unit.attr('data-filter') === 'c') {
                var activekey = orgId = item.attr('data-key');
                unit.find('.box li.active').removeClass('active');

                var activeli = unit.find('[data-key="' + activekey + '"]');
                activeli.addClass('active');
                var cName = jQuery(activeli[0]).text();
                jQuery('.filter .container .current').text(cName);
                if (activeli.attr('data-self') === '0') {
                    jQuery('.filter .container .current').removeAttr('data-key');
                } else {
                    jQuery('.filter .container .current').attr('data-key', activekey);
                }
                jQuery('.filter-panel .filter .container .more').trigger('click');
            }

            //点击的不是“自定义时间”  !!!强调!!  这部分代码必须放在最后
            if (!jQuery(this).is(".custom-a")) {
                //如果自定义展开，则收起自定义，同时选中全部
                if (jQuery('.custom').hasClass("active")) {
                    jQuery(".createtime [data-key='0'] a").trigger("click");
                }
                //摄像头下的结构化信息列表
                if (jQuery(".filter-box .header .tabs li[data-tab='video']").attr("data-click") === "info") {
                    //布防管理查询疑情库数据筛选操作
                    jQuery('<div class="loading"></div>').appendTo(jQuery("#content .main .box .content"));
                    var ajaxData = getRealTimeFilter();
                    ajaxData.cameraChannelId = sessionStorage.getItem("cameraId");
                    loadVideoResource(realtimeUrl.GET_STRUCTURES_LIST, ajaxData, realtimeUrl.REDIRECT_STRUCTURES);
                } else {
                    loadResource(getFilter());
                }
            }
            window.permission && permission.reShow();
            e.preventDefault();
        });

        /**排序*/
        jQuery(document).off('click', '.order-cases .cases li a').on("click", ".order-cases .cases li a", function(e) {
            e.preventDefault();
            var item = jQuery(this).closest("li");
            if (item.is(".active")) { //当前处于激活状态则变换排序方式（升序变降序等）
                var dir = item.find("i");

                if (dir.is(".dir_down")) { //降序
                    dir.removeClass("dir_down").addClass("dir_up");
                    item.attr("data-key", "2"); //升序
                } else {
                    dir.addClass("dir_down").removeClass("dir_up");
                    item.attr("data-key", "1"); //降序
                }
            } else {
                item.addClass("active").siblings().removeClass("active");
            }
            if (jQuery(".filter-box .header .tabs li[data-tab='video']").attr("data-click") === "info") {
                //摄像头下的结构化列表
                jQuery('<div class="loading"></div>').appendTo(jQuery("#content .main .box .content"));
                
                var ajaxData = getRealTimeFilter();
                ajaxData.cameraChannelId = sessionStorage.getItem("cameraId");
                loadVideoResource(realtimeUrl.GET_STRUCTURES_LIST, ajaxData, realtimeUrl.REDIRECT_STRUCTURES);
            } else if (jQuery(".filter-box .header .tabs li[data-tab='video']").attr("data-click") === "true") {
                //摄像头列表
                jQuery('<div class="loading"></div>').appendTo(jQuery("#content .main .box .content"));
                var ajaxData = getRealTimeFilter();
                loadVideoResource(realtimeUrl.GET_DIRECTORY_LIST, ajaxData, realtimeUrl.REDIRECT_DIRECTORY);
            } else {
                loadResource(getFilter());
            }
        });

        /**时间控件*/
        jQuery('.input-time').datetimepicker({
            showSecond: true,
            dateFormat: 'yy-mm-dd',
            timeFormat: 'HH:mm:ss',
            timeText: '',
            hourText: '时',
            minuteText: '分',
            secondText: '秒',
            showAnim: ''
        });

        /**自定义时间筛选*/
        jQuery(document).off('click', '.custom .custom-time .btn').on("click", ".custom .custom-time .btn", function() {
            var starttime = jQuery('.custom-time .input-time:eq(0)').val(),
                endtime = jQuery('.custom-time .input-time:eq(1)').val();
            if (starttime >= endtime) {
                return notify.error("起始时间必须小于截止时间！", {
                    timeout: 800
                });
            } else {
                if (jQuery(".filter-box .header .tabs li[data-tab='video']").attr("data-click") === "info") {
                    var ajaxData = getRealTimeFilter();
                    ajaxData.cameraChannelId = sessionStorage.getItem("cameraId");
                    ajaxData.startTime = Date.parse(new Date(starttime));
                    ajaxData.endTime = Date.parse(new Date(endtime));
                    loadVideoResource(realtimeUrl.GET_STRUCTURES_LIST, ajaxData, realtimeUrl.REDIRECT_STRUCTURES);
                } else if (jQuery(".filter-box .header .tabs li[data-tab='video']").attr("data-click") === "true") {
                    var ajaxData = getRealTimeFilter();
                    ajaxData.startTime = Date.parse(new Date(starttime));
                    ajaxData.endTime = Date.parse(new Date(endtime));
                    loadVideoResource(realtimeUrl.GET_DIRECTORY_LIST, ajaxData, realtimeUrl.REDIRECT_DIRECTORY);
                } else {
                    loadResource(getFilter());
                }
            }
        });

        //收起、更多 存储单位 按钮事件
        jQuery(document).off('click', '.filter-panel .filter .container .more').on("click", ".filter-panel .filter .container .more", function() {
            if (jQuery(this).is(".down")) {
                jQuery('.filter .container .current').hide();
                jQuery('.filter .container .unit-seach').show();
                jQuery(".filter-panel .filter .container .moreinfo").show();
                //jQuery(this).find('em').attr("title", "收起");
                jQuery(this).find("em").text("收起");
            } else {
                jQuery('.filter .container .current').show();
                jQuery('.filter .container .unit-seach').hide();
                jQuery(".filter-panel .filter .container .moreinfo").hide();
                jQuery(this).find("em").text("更多");
            }
            jQuery(this).toggleClass("down up");
        });

        /**
         * [description]  搜索存储单位从列表中
         * @return {[type]} [description]
         */
        jQuery(document).off('click', '.filter .container input.seach').on('click', '.filter .container input.seach', function() {

            var selector = $(this).closest('.status').siblings('div.moreinfo').find('.tab[data-tab="all"]'),
                seachText = $(this).siblings('input').val(),
                liArray = '';
            if (seachText === '' || seachText.length === 0) {
                selector.find('ul.search-result').empty().hide().siblings('dt').show();
            } else {
                selector.find('ul.search-result').empty(); //清空上次的记录
                selector.find('li a').each(function(index, el) {
                    if ($(this).text().test(seachText)) {
                        liArray = $(liArray).add($(el).parent('li').clone(true, true));
                    }
                });
                if (!liArray.length) {
                    liArray = '<li>未搜索到任何数据！</li>'
                }
                selector.find('ul.search-result').append(liArray).show().siblings('dt').hide();
            }
        });
        //添加回车事件
        jQuery(document).off('keydown', '.filter .container input.unit').on("keydown", ".filter .container input.unit", function(event) {
            if (event.keyCode === 13) {
                jQuery('.filter .container input.seach').trigger('click');
            }
        });
        //导入案事件信息
        jQuery(document).off('click', '#import').on("click", "#import", function() {
            jQuery.ajax({
                url: '/service/pvd/incidentUpload?timestamp=' + new Date().getTime(),
                type: 'get',
                success: function(res) {
                    if (res.code === 200) {
                        notify.success("导入案事件成功！");
                        setTimeout(function() {
                            location.reload();
                        }, 2000);
                    }
                },
                error: function(err, errstatus, errthr) {
                    notify.warn("导入案事件失败");
                }
            });
        });

        //导出案事件信息
        jQuery(document).off('click', '#export').on("click", "#export", function() {
            jQuery.ajax({
                url: '/service/pvd/incidentDownload?timestamp=' + new Date().getTime(),
                type: 'get',
                success: function(res) {
                    if (res.code === 200) {
                        notify.success("导出案事件成功！");
                    }
                },
                error: function(err, errstatus, errthr) {
                    notify.warn("导出案事件失败");
                }
            });
        });

        /**缩略图编辑*/
        /*jQuery(document).on("click", ".items-list .thumb-figure .operator .edit ", function() {
         var showtype = jQuery(this).closest("li").data("showType"), //用于展示的类型
         id = jQuery(this).closest("li").data("id"),
         type = jQuery(this).closest("li").data("type"); //数据库用到的源类型
         showtype = showtype ? showtype : type;
         window.location.href = "/works/medialib/update_" + showtype + ".html?id=" + id + "&origntype=" + type;
         });*/

        /**资源删除*/
        /*jQuery(document).on("click", '.thumb-figure.ease .operator  .remove', function() {
         var item = jQuery(this).closest("li");
         new ConfirmDialog({
         title: '警告',
         warn: true,
         message: "<div class='dialog-messsage'><h4>您确定要删除该资源吗？</h4>",
         callback: function() {
         self.removeResource(item);
         }
         });
         });*/
        /*上传ICP 复选框选择事件*/
        jQuery(".content").off("click", ".checkbox").on("click", ".checkbox", function(e) {
            var $ele = jQuery(this),
                checkNum = jQuery(".thumb-figure").find(".checkbox.checked").length;
            if ($ele.hasClass("disable")) {
                return false;
            }

            if (checkNum === 12) {
                notify.warn("一次最多选择12个案事件！");
                return false;
            }

            $ele.toggleClass("checked");
            checkNum = jQuery(".thumb-figure").find(".checkbox.checked").length;
            checkNum === 0 ? jQuery(".upload-icp").hide() : jQuery(".upload-icp").show();
        });

        /*上传ICP 上传按钮事件*/
        jQuery(".upload-icp").unbind("click").bind("click", function(e) {
            new ConfirmDialog({
                title: '提示',
                message: '<h3>您确认要上传ICP吗？</h3>',
                callback: function() {
                    setTimeout(function() {
                        var postData = getUploadData();
                        if (!postData) {
                            return false;
                        }

                        new uploadDialog({
                            uploadData: postData,
                            callback: function() {
                                // 隐藏上传ICP的按钮
                                jQuery(".upload-icp").hide();
                                // 重新加载资源
                                loadResource(getFilter());
                            }
                        });
                    }, 100);
                }
            });
            
            return false;
        });
    };
    /*
     organization = '',
     orgId = '',
     url = '',
     filterData = {
     p: 1, //   第几页(默认 0 代表全部)
     np: 12 // 每页包含多少项（最大500，最小1，默认值为50）
     }
     */
    var rightListClick = function() {
        //右键禁用，免得打开太多tab页面，出现导航混乱。
        $(document).bind("contextmenu", function(e) {
            return false;
        });

        var workbenchActive = '{"viewlibs":"workbench"}';
        //本地导入
        jQuery('#sidebar').on('click', '#importResource', function() {
            parent.jQuery('.workbench[data-id="14"]').addClass("active").siblings().removeClass("active");
            panelImport.open();
        });

        //创建案事件
        jQuery('#sidebar').on("click", ".create-incident", function() {
            localStorage.setItem("activeMenu", workbenchActive);
            window.location.href = '/module/viewlibs/workbench/create_incident.html';
        });
        jQuery("#setImportantIncident").click(function() {
            new ChoosePanel();
            return false;
        });
    };
    /**
     * [addPortTool 内部员工使用的案事件导入导出入口]
     * @author zhangxinyu
     * @date   2015-07-30
     * @return {[type]}          [description]
     */
    var addPortTool = function() {
        var userName = jQuery.parseJSON(localStorage.getItem("user_login_info")).username;
        if (userName === "STKYS") {
            jQuery("#import").closest("div").show();
            jQuery("#export").closest("div").show();
        }
    };
    /**
     * [mergeData 合并请求参数]
     * @author zhangxinyu
     * @date   2015-07-29
     * @param  {[type]} ajaxData [description]
     * @return {[type]}          [description]
     */
    var mergeData = function(ajaxData) {
        jQuery('.info-type [data-key=' + ajaxData.dataType + ']').addClass("active").siblings().removeClass("active"); //信息类型
        jQuery('.createtime [data-key=' + ajaxData.timeType + ']').addClass("active").siblings().removeClass("active"); //创建时间
        if (ajaxData.timeType === "6") {
            jQuery('[data-filter="s"]').val(ajaxData.startTime);
            jQuery('[data-filter="e"]').val(ajaxData.endTime);
        }
        if (ajaxData.sortType.split(",")[0] === "o") { //排序类型 o:创建时间 m:目标出现时间
            jQuery('[data-filter="o"]').addClass("active").siblings().removeClass("active");
            if (ajaxData.sortType.split(",")[1] === "1") {
                jQuery('[data-filter="o"]').attr("data-key", "1").find("i").attr("class", "dir_down");
            } else {
                jQuery('[data-filter="o"]').attr("data-key", "2").find("i").attr("class", "dir_up");
            }
        } else {
            jQuery('[data-filter="m"]').addClass("active").siblings().removeClass("active");
            if (ajaxData.sortType.split(",")[1] === "1") {
                jQuery('[data-filter="m"]').attr("data-key", "1").find("i").attr("class", "dir_down");
            } else {
                jQuery('[data-filter="m"]').attr("data-key", "2").find("i").attr("class", "dir_up");
            }
        }

        var filtermap = {};
        var date = new Date();
        var year = date.getFullYear();
        var month = date.getMonth();
        var day = date.getDate();
        var timestamp = Date.parse(new Date());
        var timeType = jQuery('[data-filter="t"] ul .active').attr("data-key"); //创建时间类型
        filtermap.structureType = (jQuery('[data-filter="l"] ul .active').attr("data-key")) * 1; //信息类型(number类型)
        switch (timeType) {
            case "0": //全部
                filtermap.startTime = '';
                filtermap.endTime = '';
                break;
            case "1": //今日
                filtermap.startTime = Toolkit.strToUnix(year + "-" + (month + 1) + "-" + day + " " + "00:00:00");
                filtermap.endTime = timestamp;
                break;
            case "2": //昨日
                filtermap.startTime = Toolkit.strToUnix(year + "-" + (month + 1) + "-" + (day - 1) + " " + "00:00:00");
                filtermap.endTime = Toolkit.strToUnix(year + "-" + (month + 1) + "-" + (day - 1) + " " + "23:59:59");
                break;
            case "3": //近7天
                filtermap.startTime = timestamp - 7 * 24 * 60 * 60 * 1000;
                filtermap.endTime = timestamp;
                break;
            case "4": //近30天
                filtermap.startTime = timestamp - 30 * 24 * 60 * 60 * 1000;
                filtermap.endTime = timestamp;
                break;
            case "9": //近1小时
                filtermap.startTime = timestamp - 60 * 60 * 1000;
                filtermap.endTime = timestamp;
                break;
            case "7": //近10分钟
                filtermap.startTime = timestamp - 10 * 60 * 1000;
                filtermap.endTime = timestamp;
                break;
            case "6": //自定义
                filtermap.startTime = Toolkit.strToUnix(ajaxData.startTime);
                filtermap.endTime = Toolkit.strToUnix(ajaxData.endTime);
                break;
        }
        if (jQuery('[data-filter="o"]').hasClass("active")) {
            filtermap.createSort = (jQuery('[data-filter="o"]').attr("data-key")) * 1; //创建时间排序(number类型) 2 升序 1降序 
        } else {
            filtermap.objectSort = (jQuery('[data-filter="m"]').attr("data-key")) * 1; //目标出现时间排序(number类型) 2 升序 1降序  
        }

        ajaxData = Object.merge(ajaxData, filtermap);

        //删除后跳转结构化信息列表（删除某个结构化信息（该页列表只有一个或者列表只有一项））
        if (ajaxData.del_option === 1) {
            ajaxData.currentPage = ajaxData.currentPage - 1;
        } else if (ajaxData.del_option === 2) {
            // jQuery(".order-cases .total .count").text("0"); //资源总数
            // jQuery(".order-cases .total .totalpage").text("/0"); //总页数
            // jQuery(".order-cases .total .curpage").text("0"); //当前页码
            // jQuery(".items-panel .content").empty();
            // return;
            ajaxData.currentPage = 1;
        }

        return ajaxData;
    };
    var init = function(options) {
        showPie();
        addPortTool();
        bindEvents();
        rightListClick();
    }
    return {
        init: init,
        getChildList: getChildList,
        /**获取下级机构的信息*/
        getChildOrgs: getChildOrgs,
        //模板渲染完后处理显示细节
        handleDisplay: handleDisplay,
        //案事件信息库二次搜索
        secondSeach: secondSeach,
        //获取高亮的导航对应的url  3-x   3代表视图库
        getHightlight: getHightlight,
        /**资源删除ajax*/
        removeResource: removeResource,
        /**内部员工导入导出工具*/
        addPortTool: addPortTool,
        getFilter: getFilter,
        showPie: showPie,
        loadResource: loadResource,
        // 实时结构化(疑情信息库)
        loadVideoResource: loadVideoResource,
        getRealTimeFilter: getRealTimeFilter,
        rightListClick: rightListClick,
        setUrl: function(Url) {
            url = Url;
        },
        setnp: function(num) {
            window.filterData = {
                p: 1,
                np: num
            };
        },
        setTemplate_url: function(url) {
            template_url = url;
        },
        getOrgId: function() {
            return orgId;
        },
        setOrgId: function(OrgId) {
            orgId = OrgId;
        }
    }
});
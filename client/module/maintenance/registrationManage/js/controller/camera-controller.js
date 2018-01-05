/*
 ** @Date：2016.3.24
 ** @Author:Leon.z
 ** @Description:摄像机模块控制入口
 */
define([
    '../global-varibale',
    '../model/registrationManage-model',
    '../view/camera-view',
    'js/view/commonHelper'
], function (_g, ajaxCtrModel, cameraView, commonHelper) {
    var cameraCtr = function () {
        this.init();
    };
    cameraCtr.prototype = {
        options: {
            defaultTemplateUrl: "/module/maintenance/registrationManage/inc/cameraTemplate.html", //默认加载面板路径
            lastType: null //缓存最后一次下拉菜单类型
        },
        init: function () {
            var self = this;
            self.loadDefaultTemp();//初始化模板
            cameraView._bindEvents(jQuery("#mainContent"));//绑定主页事件
            commonHelper.cameraRegister.cameraHelper();//加载模板助手
        },
        /**
         * [loadDefaultTemp 初始化模板]
         * @return {[type]} [description]
         */
        loadDefaultTemp: function () {
            var self = this;
            _g.loadTemplate(self.options.defaultTemplateUrl, function (compiler) {
                self.compiler = compiler;
                _g.cameraCompiler = compiler;
            });
        },
        /**
         * [getPointOrManageId 判断点位id，监控系统id是否存在或注销]
         * @param  {[type]}   pointId  [description]
         * @param  {[type]}   manageId [description]
         * @param  {Function} callback [description]
         * @return {[type]}            [description]
         */
        getPointOrManageId: function (pointId, manageId, callback) {
            if (manageId === "") {
                notify.warn("请填写所属监控系统编号!");
                return false;
            } else if (!/^([0-9]\d*|[0]{1,1})$/.test(manageId)) {
                notify.warn("所属监控系统编号必须为数字码!");
                return false;
            } else if (pointId === "") {
                notify.warn("请填写所属点位编号!");
                return false;
            } else if (!/^([0-9]\d*|[0]{1,1})$/.test(pointId)) {
                notify.warn("所属点位编号必须为数字码!");
                return false;
            }
            jQuery.when($.ajax({
                url: "/service/regist/cameraDevice/judgePointId",
                type: "GET",
                data: {"pointId": pointId}
            }), $.ajax({
                url: "/service/regist/cameraDevice/judgeMonitorSystemId",
                type: "GET",
                data: {"monitorSystemId": manageId}
            })).done(function (res1, res2) {
                if (res1[0].code === 500) {
                    notify.warn("点位编号不存在或已注销!");
                    return;
                }
                if (res2[0].code === 500) {
                    notify.warn("系统编号不存在或已注销!");
                    return;
                }
                callback && callback();
            });
        },
        /**
         * [getSearchPlatformList 搜索]
         * @param  {[type]} data [description]
         * @return {[type]}      [description]
         */
        getSearchPlatformList: function (data) {
            if (!data) {
                return;
            }
            var self = this,
                params = {
                    "enterPlatformStatus": data.enterPlatformStatus,
                    "status": data.status || "",
                    "managerUnitName": data.managerUnitName || "",
                    "devicePurpose": data.devicePurpose || "",
                    "deviceType": data.deviceType || "",
                    "deviceClassify": data.deviceClassify || "",
                    "deviceManufacturer": data.deviceManufacturer || "",
                    "monitorType": data.monitorType || "",
                    "isControl": data.isControl,
                    "policeDept": data.policeDept || "",
                    "installPosition": data.installPosition || "",
                    "userId": jQuery("#userEntry").data("userid") || 1,
                    "currentPage": 1,
                    "pageSize": '10'
                },
                tableLyout = params.enterPlatformStatus ? "enterTab" : "unenterTab",
                colspan = params.enterPlatformStatus ? 9 : 10;
            ajaxCtrModel.ajaxEvents.getSearchPlatformList(params, {
                beforeSend: function () {
                    jQuery("#" + tableLyout).find("tbody.dataInsert").html('<tr><td class="loading" colspan="' + colspan + '"></td></tr>');
                }
            }, function (res) {
                if (res.code === 200 && Object.prototype.toString.call(res.data.list) === "[object Array]") {
                    var cameraHtml = "";
                    if (params.enterPlatformStatus) {
                        cameraHtml = self.compiler({
                            "enterDataListPart": true,
                            "enterDataList": res.data.list || []
                        });
                    } else {
                        cameraHtml = self.compiler({
                            "unenterDataListPart": true,
                            "unenterDataList": res.data.list || []
                        });
                    }
                    cameraView.TABLELENGTH = res.data.totalRecords;
                    console.log(cameraView.TABLELENGTH);
                    jQuery("#" + tableLyout).find("tbody.dataInsert").html(cameraHtml);
                    permission.reShow();
                    if (res.data.list.length <= 0) {
                        jQuery(".tablePart .pagepart").hide();
                    }
                    if (res.data.list.length > 0) {
                        jQuery(".tablePart .pagepart").html(self.compiler({
                            "pagebar": true
                        })).show();

                        _g.setPagination(res.data.totalRecords, ".tablePart .pagination", params.pageSize, params.currentPage - 1, function (nextPage) {
                            // TODO  分页回调函数
                            params.currentPage = nextPage;

                            ajaxCtrModel.ajaxEvents.getSearchPlatformList(params, {
                                beforeSend: function () {
                                    jQuery("#" + tableLyout).find("tbody.dataInsert").html('<tr><td class="loading" colspan="' + colspan + '"></td></tr>');
                                }
                            }, function (res) {
                                if (res.code === 200 && Object.prototype.toString.call(res.data.list) === "[object Array]") {
                                    var cameraHtml = "";
                                    if (params.enterPlatformStatus) {
                                        cameraHtml = self.compiler({
                                            "enterDataListPart": true,
                                            "enterDataList": res.data.list || []
                                        });
                                    } else {
                                        cameraHtml = self.compiler({
                                            "unenterDataListPart": true,
                                            "unenterDataList": res.data.list || []
                                        });
                                    }
                                    cameraView.TABLELENGTH = res.data.totalRecords;
                                    jQuery("#" + tableLyout).find("tbody.dataInsert").html(cameraHtml);
                                    permission.reShow();
                                    cameraView._bindEvents(jQuery("#" + tableLyout));
                                    jQuery(".midleCtrPart").find(".totalNum").text(cameraView.TABLELENGTH);
                                } else {
                                    notify.warn("加载摄像机数据失败!");
                                    return;
                                }
                            });
                        });
                    }
                    cameraView._bindEvents(jQuery("#" + tableLyout));
                    jQuery(".midleCtrPart").find(".totalNum").text(cameraView.TABLELENGTH);

                } else if (res.code === 500) {
                    notify.warn("加载摄像机数据失败!");
                    return;
                }
            }, function () {
                return notify.error("加载数据失败!");
            });
        },

        /**
         * [logOutCurrCamera 注销]
         * @param  {[type]}  cancelreason [注销原因]
         * @param  {[type]}  ids          [注销id]
         * @param  {Boolean} isEnter      [是否在进入平台选项]
         * @return {[type]}               [description]
         */
        logOutCurrCamera: function (data, isEnter, callback) {
            var param = {
                "id": data.id,
                "cancelReason": data.cancelReason
            };
            ajaxCtrModel.ajaxEvents.cancelCmeraData(param, function (res) {
                if (res.code === 200) {
                    notify.success(res.data.message);
                    callback && callback(isEnter);
                }
            }, function (error) {
                return notify.error("加载数据失败!");
            });
        },
        /**
         * [batchEnterPlatform 批量进入平台]
         * @param  {[type]}   ids      [description]
         * @param  {Function} callback [description]
         * @return {[type]}            [description]
         */
        batchEnterPlatform: function (clist, callback) {
            ajaxCtrModel.ajaxEvents.batchEnterPlatform({
                ids: clist.join(",")
            }, function (res) {
                if (res.code === 200) {
                    notify.success(res.data.message);
                    callback && callback();
                }
            }, function (error) {
                return notify.error("加载数据失败!");
            });
        },
        /**
         * [showPub 展示下拉菜单]
         * @param  {[type]}  node        [description]
         * @param  {[type]}  types       [description]
         * @param  {Boolean} isAddOrEdit [是否为编辑或者新增时]
         * @return {[type]}              [description]
         */
        showPub: function (node, types, isAddOrEdit) {
            var self = this,
                position = {
                    left: jQuery(node).offset().left,
                    top: jQuery(node).offset().top,
                    clientW: jQuery(node)[0].clientWidth
                };
            if (self.lastType !== types) {
                var nodes = isAddOrEdit ? jQuery("#doNewEditPanel .detailPanel") : jQuery("#mainContent .selectPanel");
                nodes.find("span.active").removeClass('active');
            }
            self.getPubData(jQuery(node), position, types, isAddOrEdit);
            self.lastType = types;
        },
        /**
         * [getPubData 渲染下拉]
         * @param  {[type]}  node        [description]
         * @param  {[type]}  position    [description]
         * @param  {[type]}  types       [description]
         * @param  {Boolean} isAddOrEdit [description]
         * @return {[type]}              [description]
         */
        getPubData: function (node, position, types, isAddOrEdit) {
            var self = this,
                html = [],
                key = '',
                type = isAddOrEdit ? "addOrEdit" : "mainConent";
            if (types === "keyPart" || types === "devicePurpose" || types === "deviceClassify" || types === "deviceManufacturer" || types === "status" ||
                types === "monitorType" || types === "isControl" || types === "policeDept" || types === "posPart" || types === "deviceType" || types === "enterPlatformStatus") {
                key = "staticPub";
                showMinePub(key, types);
            } else {
                key = "loadPub";
            }

            function showMinePub(key, types) {
                //新建下拉菜单交替点击会逐渐少一个项 取消使用缓存下拉菜单 新建时直接读取 1-最后的选项 haoyong
                var ii = 0;
                if (isAddOrEdit) {
                    //if(self.lastType !== types){
                    ii = 1;
                    //_g.cameraPubTypeList[key][types].splice(0,1);
                    //}
                }
                /*else{
                 if(_g.cameraPubTypeList[key][types][0].value!=="全部"){
                 _g.cameraPubTypeList[key][types].unshift({
                 "code": "",
                 "value": "全部"
                 });
                 }
                 }*/
                for (var i = ii, le = _g.cameraPubTypeList[key][types].length; i < le; i++) {
                    html.push("<li title='" + _g.cameraPubTypeList[key][types][i].value + "' data-code ='" + _g.cameraPubTypeList[key][types][i].code + "'data-event='click' data-handler='setSpanVal'>" + _g.cameraPubTypeList[key][types][i].value + "</li>");
                }
                jQuery(".pubdiv ul").html(html.join("")).closest('.pubdiv').show(0);
                jQuery(".pubdiv").css({
                    "left": position.left + "px",
                    "top": (position.top + 26) + "px",
                    "width": position.clientW + "px"
                }).attr("data-type", type);
                node.addClass("active");
                cameraView._bindEvents(jQuery(".pubdiv"));
            }
        },
        /**
         * [newOrEditPanel 新建或编辑渲染]
         * @param  {Boolean}  isNew    [是否为新建数据？"编辑":"新建"]
         * @param  {Function} callback [回调view层]
         * @return {[type]}            [description]
         */
        newOrEditPanel: function (isNew, callback) {
            var self = this,
                addOrEditHtml = "";
            if (!isNew) {
                addOrEditHtml = self.compiler({
                    "editOrAddPanelData": true
                });
            } else {
                addOrEditHtml = self.compiler({
                    "editOrAddPanelData": isNew
                });
            }
            jQuery("#doNewEditPanel").html(addOrEditHtml).removeClass('hidden');
            callback && callback();

        },
        /**
         * [saveCameraData 保存提交数据]
         * @param  {[type]}   saveData [description]
         * @param  {Function} callback [description]
         * @return {[type]}            [description]
         */
        saveCameraData: function (saveData, callback) {
            if (!saveData) {
                return;
            }
            saveData.userId = jQuery("#userEntry").data("userid") || 1;
            var commonDialog = new CommonDialog({
                title: '保存摄像机数据中,请等待！'
            });
            var fn = saveData.id ? ajaxCtrModel.ajaxEvents.updateCmeraData : ajaxCtrModel.ajaxEvents.saveCameraData,
                errMsg = saveData.id ? "编辑摄像机信息失败!" : "添加摄像机信息失败！";
            fn({
                params: JSON.stringify(saveData)
            }, function (res) {
                if (res.code === 200) {
                    notify.success("保存数据成功");
                    commonDialog.hide();
                    callback && callback();
                } else if (res.code === 500) {
                    notify.error(errMsg);
                }
            }, function () {
                notify.error(errMsg);
            });

        },
        /**
         * [getDetailInfo 查看设备详情]
         * @return {[type]} [description]
         */
        getDetailInfo: function (detailData, callback) {
            var self = this;
            if (!detailData) {
                return;
            }
            var html = self.compiler({
                "cameraDetailData": detailData
            });
            jQuery("#showDetail").html(html).removeClass('hidden');
            cameraView._bindEvents(jQuery("#showDetail"));
            callback && callback();
        },
        /**
         * [checkSearchData 检测提交数据]
         * @param  {[type]}   checkData [description]
         * @param  {Function} callback  [description]
         * @return {[type]}             [description]
         */
        checkSearchData: function (checkData, isMain, callback) {
            if (!isMain) {
                callback && callback();
            }
            if (checkData && isMain) {
                if (checkData.deviceName === "") {
                    notify.warn("请填写设备名称!");
                    return false;
                } else if (checkData.deviceType === "") {
                    notify.warn("请选择设备类型!");
                    return false;
                } else if (checkData.devicePixel && !/^([1-9]\d*|[0]{1,1})$/.test(parseFloat(checkData.devicePixel))) {
                    notify.warn("设备像素必须为正整数!");
                    return false;
                } else if (checkData.policeDept === "") {
                    notify.warn("请选择警种!");
                    return false;
                } else if (checkData.countyNumber === "") {
                    notify.warn("请填写区级编号!");
                    return false;
                } else if (!/^([0-9]\d*|[0]{1,1})$/.test(checkData.countyNumber)) {
                    notify.warn("区级编号必须为数字码!");
                    return false;
                } else if (checkData.basicAccessUnitNum === "") {
                    notify.warn("请填写基层单位接入编号!");
                    return false;
                } else if (!/^([0-9]\d*|[0]{1,1})$/.test(checkData.basicAccessUnitNum)) {
                    notify.warn("基层单位接入编号必须为数字码!");
                    return false;
                }
                callback && callback();
            }
        },

        /**
         * 根据相机ID显示对应板块 在点位模块中调用此函数
         * @param data 摄像机ID
         * @returns no
         */
        showCameraInfoById: function (data) {
            var self = this;
            if (!data) {
                return;
            }
            var params = {
                "id": data
            };
            ajaxCtrModel.ajaxEvents.getCameraByID(params, function (res) {
                if (res.code === 200) {
                    jQuery("#aside .tabs").find("li[data-tab = 'camera-control']").trigger("click");
                    jQuery("#major").css("left", "50px");
                    jQuery("#aside").find(".tab-content").hide(0);

                    //渲染摄像机详情
                    var html = self.compiler({
                        "cameraDetailData": res.data
                    });
                    jQuery("#showDetail").html(html).removeClass('hidden');
                    cameraView._bindEvents(jQuery("#showDetail"));

                    // this.getDetailInfo(res.data, function () {
                    $(".cameraControl ").addClass("active").siblings().removeClass("active");
                    jQuery("#mainContent,#doNewEditPanel").addClass('hidden');
                    _g.currCameraDeatilData = res.data;
                    //  });
                }
            }, function () {
                notify.error("获取摄像机设备信息失败");
            });
        }
    };
    return new cameraCtr();
});
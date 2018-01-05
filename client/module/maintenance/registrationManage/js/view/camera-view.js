/*
 ** @Date：2016.3.24
 ** @Author:Leon.z
 ** @Description:摄像机视图层入口
 */
define([
    '../global-varibale'
], function (global) {
    var CameraView = function () {
    };
    CameraView.prototype = {
        searchData: {
            "devicePurpose": "", //设备用途
            "deviceType": 0, //摄像机类型
            "deviceClassify": "", //设备分类
            "deviceManufacturer": "", //设备厂家
            "monitorType": "", //监控类型
            "isControl": "", //是否可控
            "policeDept": "", //所属管种部门
            "installPosition": "", //安装位置
            "status": "", //摄像机状态
            "enterPlatformStatus": 1, //是否查询进入平台数据
            "managerUnitName": "" //设备管理单位名称
        },
        sendData: {
            "deviceName": "'", //设备名称
            "deviceType": "", //设备类型
            "deviceClassify": "", //设备分类
            "deviceManufacturer": "", //设备厂家
            "devicePixel": "", //设备像素
            "monitorType": "", //监控类型
            "isControl": 1, //是否可控
            "installPosition": "", //设备安装位置
            "devicePurpose": "", //设备用途
            "policeDept": "", //所属警种
            "monitorSystemId": "", //所属监控系统id
            "pointId": "", //所属点位系统id
            "managerUnitCode": "",
            "managerUnitName": "",
            "deviceCreateDate": "", //设备建设时间
            "enterPlatformStatus": "", //设备状态
            "deviceLongitude": "", //设备经度
            "deviceLatitude": "", //设备纬度
            "monitorPointHeight": "", //设备海拔
            "countyNumber": "", //区级编号
            "basicAccessUnitNum": "", //基层接入编号
            "userId": null
        },
        TABLELENGTH: 0, //加载table数据记录条数
        currUser: "",
        tempType: "", //临时记录设备类型
        init: function (objCtr) {
            var self = this;
            self.cameraCtr = global.cameraCtr = objCtr; //缓存摄像机模块业务对象
            //判断是否为管理员用户,非管理员不能查看注销的和别人的数据
            var currUser = self.currUser = jQuery("#userEntry").data("loginname");
            if (currUser !== "admin") {
                jQuery("#mainContent .searchp1").find(".hideStatusPart").hide();
                jQuery("#mainContent .midleCtrPart").find(".enterPlatform ").addClass('hidden');
            }
        },
        _eventHandler: function () {
            var self = this;
            return {
                /**
                 * 判断可选输入框的内容是否正确 blur事件的响应句柄
                 * @param e 事件对象
                 * @returns {boolean} 返回检查结果 正确、不正确
                 */
                "inputCodeCheck": function (e) {
                    e.stopPropagation();
                    //TODO 检验是否是合法code
                    var type = $(this).closest("span").data("pubtype"),
                        data = global.cameraPubTypeList.staticPub[type],
                        arrCode = [],//获取所有code值匹配
                        arrValue = [],//所有的值
                        le = data.length;
                    for (var i = 1; i < le; i++) {
                        arrCode[i] = data[i].code;
                        arrValue[i] = data[i].value;
                    }
                    var currValue = $(this).val();
                    // alert($.inArray(currValue,arrValue));

                    //如果输入全称 判断是否正确（场景：选择下拉选项又去编辑）
                    if (isNaN(currValue) && currValue.trim() !== "" && $.inArray(currValue, arrValue) === -1) {
                        notify.warn("请输入正确的数字编码");
                        $(this).val("");
                        return false;
                    } else if ((isNaN(currValue) && currValue.trim() !== "" && $.inArray(currValue, arrValue) !== -1)) {
                        return true;
                    }

                    //手动输入的不是数字
                    if (currValue.trim() !== "" && isNaN(currValue)) {
                        notify.warn("请输入正确的数字编码");
                        $(this).val("");
                        return false;
                    }

                    //手动输入的编码不存在
                    if (currValue.trim() !== "" && $.inArray(currValue, arrCode) === -1) {
                        notify.warn("请输入正确的数字编码");
                        $(this).val("");
                        return false;
                    }
                    $(this).attr("data-code", currValue);

                },

                /**
                 * [loadPubData 加载下拉菜单]
                 * @param  {[type]} e [description]
                 * @return {[type]}   [description]
                 */
                loadPubData: function (e) {
                    e.stopPropagation();
                    var pubType = $(this).data("pubtype");
                    if ($(this).hasClass("active")) {
                        $(this).removeClass("active");
                        jQuery(".pubdiv").hide(0);
                        return;
                    }

                    self.cameraCtr.showPub($(this), pubType, false);
                },
                /**
                 * [setSpanVal 下拉列表点击选择事件]
                 */
                setSpanVal: function () {

                    //添加根据设备类型自动判断是否可控的功能 haoyong
                    //默认是可控 如果是00 04 99(枪机 照相机 其他)触发选中不可控
                    var code = -1;
                    if (self.tempType === "deviceType") {
                        code = jQuery(this).data("code").toString();
                        if ((code === "00") || (code === "04") || (code === "99")) {
                            jQuery(".radiohPart .icon-radio").eq(1).trigger("click");
                        } else {
                            jQuery(".radiohPart .icon-radio").eq(0).trigger("click");
                        }
                        self.tempType = "";//注销self.tempType
                        code = -1;
                    }

                    //选择厂家设备 如果选了其他 显示一个文本框 haoyong
                    if (self.tempType === "deviceManufacturer") {
                        code = jQuery(this).data("code").toString();
                        if (code === "99") {
                            jQuery(".otherDeviceManufacturer").show(0);
                        } else {
                            jQuery(".otherDeviceManufacturer").hide(0);
                        }
                        self.tempType = "";//注销self.tempType
                    }

                    var currVal = jQuery(this).text(),
                        pubListType = jQuery(this).parents(".pubdiv").attr("data-type"),
                        currCode = jQuery(this).data("code"),
                        nodes = pubListType === "mainConent" ? jQuery("#mainContent .selectPanel span.active") : jQuery("#doNewEditPanel .detailPanel span.active");
                    if (nodes.find("input").length !== 0) {
                        nodes.find("input").val(currVal);
                        nodes.find("input").attr("data-code", currCode);
                    } else {
                        nodes.find("span:eq(0)").text(currVal).attr("title", currVal);
                        nodes.find("span:eq(0)").attr("data-code", currCode);
                    }

                    jQuery(".pubdiv").hide(0);
                    nodes.removeClass('active');
                },
                /**
                 * [withActive 搜索中radio选择]
                 * @return {[type]} [description]
                 */
                withActive: function () {
                    var type = jQuery(this).data("checktype");
                    jQuery(this).addClass('active').siblings("i").removeClass('active');
                },
                /**
                 * [searchMachData 搜索]
                 * @return {[type]} [description]
                 */
                searchMachData: function () {
                    self.searchData = self.getSearchData();

                    self.cameraCtr.checkSearchData(self.searchData, false, function () {
                        self.cameraCtr.getSearchPlatformList(self.searchData);
                    });
                },
                /**
                 * [loadPlatformData 进入未进入平台数据切换]
                 * @return {[type]} [description]
                 */
                loadPlatformData: function () {
                    var loadType = jQuery(this).data("loadtype");
                    jQuery(this).addClass('active').siblings().removeClass('active');
                    if (loadType === "entered") {
                        self.cameraCtr.getSearchPlatformList({
                            "enterPlatformStatus": 1,
                            "isControl": ""
                        });
                        if (self.currUser === "admin") {
                            jQuery(".midleCtrPart").find(".enterPlatform").addClass('hidden');
                        }
                        jQuery(".tablePart .enterPlatTable").removeClass("hidden");
                        jQuery(".tablePart .unenterPlatTable").addClass('hidden');
                    } else {
                        self.cameraCtr.getSearchPlatformList({
                            "enterPlatformStatus": 0,
                            "isControl": ""
                        });
                        if (self.currUser === "admin") {
                            jQuery(".midleCtrPart").find(".enterPlatform").removeClass('hidden');
                        }
                        permission.reShow();
                        jQuery(".tablePart .unenterPlatTable").find(".icon-checkbox.active").removeClass('active');
                        jQuery(".tablePart .unenterPlatTable").removeClass("hidden");
                        jQuery(".tablePart .enterPlatTable").addClass('hidden');
                    }

                },
                /**
                 * [withTabCheckboxActive 未进入平台数据单选]
                 * @return {[type]} [description]
                 */
                withTabCheckboxActive: function (e) {
                    e.stopPropagation();
                    var $node = jQuery(this);
                    if ($node.hasClass('disabled')) {
                        return;
                    }
                    $node.toggleClass('active');
                    var length = $node.closest('table').find(".dataInsert .icon-checkbox.active").length;
                    if (length === self.TABLELENGTH) {
                        $node.closest('table').find(".icon-checkbox:first").addClass('active');
                    } else {
                        $node.closest('table').find(".icon-checkbox:first").removeClass('active');
                    }
                },
                /**
                 * [checkedAllTr 未进入平台数据全选]
                 * @return {[type]} [description]
                 */
                checkedAllTr: function (e) {
                    e.stopPropagation();
                    if (jQuery(this).hasClass('active')) {
                        jQuery(this).removeClass('active');
                        jQuery(this).closest('table').find(".icon-checkbox.active").removeClass('active');
                        return;
                    }
                    jQuery(this).addClass('active');
                    jQuery(this).closest('table').find(".icon-checkbox").addClass('active');

                },
                /**
                 * [newCameraData 新建摄像机]
                 * @return {[type]} [description]
                 */
                newCameraData: function () {
                    jQuery("#major").css("left", "50px");
                    jQuery("#aside").find(".tab-content").hide(0);
                    self.cameraCtr.newOrEditPanel(false, function () {
                        jQuery("#mainContent,#showDetail").addClass("hidden");
                        self._bindEvents(jQuery("#doNewEditPanel"));
                    });

                },
                /**
                 * [loadPanelPubData 编辑新增时候下拉菜单]
                 * @return {[type]} [description]
                 */
                loadPanelPubData: function (e) {
                    e.stopPropagation();
                    var pubType = $(this).data("pubtype");
                    if ($(this).hasClass("active")) {
                        $(this).removeClass("active");
                        jQuery(".pubdiv").hide(0);
                        return;
                    }
                    self.tempType = pubType;
                    self.cameraCtr.showPub($(this), pubType, true);
                },
                /**
                 * [savePanelData 提交编辑或者新增设备信息]
                 * @return {[type]} [description]
                 */
                savePanelData: function () {
                    self.sendData.monitorSystemId = jQuery(".detailPanel").find("input[name='monitorSystemId']").val();
                    self.sendData.pointId = jQuery(".detailPanel").find("input[name='pointId']").val();
                    self.sendData.deviceType = jQuery(".detailPanel").find(".deviceType").attr("data-code");
                    self.sendData.deviceClassify = jQuery(".detailPanel").find(".deviceClassify").attr("data-code");

                    //设备厂家改成文本格式 haoyong
                    self.sendData.deviceManufacturer = jQuery(".detailPanel").find(".deviceManufacturer").attr("title");
                    if (!$(".otherDeviceManufacturer").is(':hidden')) {
                        self.sendData.deviceManufacturer = jQuery(".otherDeviceManufacturer").find("input").val();
                    }
                    //self.sendData.deviceManufacturer = jQuery(".detailPanel").find(".deviceManufacturer").attr("data-code");
                    self.sendData.devicePixel = jQuery(".detailPanel").find("input[name='devicePixel']").val();
                    self.sendData.monitorType = jQuery(".detailPanel").find(".monitorType").attr("data-code");
                    self.sendData.isControl = jQuery(".detailPanel .radiohPart").find(".icon-radio.active").data('isctr');

                    //修整haoyong
                    self.sendData.installPosition = jQuery(".detailPanel").find(".installPosition").val();

                    self.sendData.devicePurpose = jQuery(".detailPanel").find(".devicePurpose").attr("data-code");
                    self.sendData.policeDept = jQuery(".detailPanel").find(".policeDept").attr("data-code");
                    self.sendData.deviceCreateDate = jQuery(".detailPanel").find("input[name='deviceCreateDate']").val();
                    self.sendData.enterPlatformStatus = jQuery(".detailPanel").find(".enterPlatformStatus").text() === "已进入平台" ? 1 : 0;
                    self.sendData.deviceName = jQuery(".detailPanel").find("input[name='deviceName']").val();
                    self.sendData.countyNumber = jQuery(".detailPanel").find("input[name='countyNumber']").val();
                    self.sendData.basicAccessUnitNum = jQuery(".detailPanel").find("input[name='basicAccessUnitNum']").val();
                    if (jQuery(this).data("id")) {
                        self.sendData.id = jQuery(this).data("id");
                    }
                    console.log("self.sendData", self.sendData);
                    /*return;*/
                    self.cameraCtr.getPointOrManageId(self.sendData.pointId, self.sendData.monitorSystemId, function () {
                        self.cameraCtr.checkSearchData(self.sendData, true, function () {
                            self.cameraCtr.saveCameraData(self.sendData, function () {
                                jQuery("#doNewEditPanel,#showDetail").addClass('hidden');
                                jQuery("#mainContent").removeClass('hidden');
                                jQuery("#major").css("left", "280px");
                                jQuery("#aside").find(".tab-content").show(0);
                                if (self.sendData.enterPlatformStatus === 1) {
                                    jQuery(".camera-control").find("span[data-loadtype='entered']").trigger("click");
                                    return;
                                } else {
                                    jQuery(".camera-control").find("span[data-loadtype='unentered']").trigger("click");
                                }
                            });
                        });
                    });
                },
                /**
                 * [gobackOrgin 返回上一级]
                 * @return {[type]} [description]
                 */
                gobackOrgin: function (e) {
                    jQuery("#mainContent").removeClass('hidden');
                    jQuery("#doNewEditPanel,#showDetail").addClass('hidden');
                    jQuery("#major").css("left", "280px");
                    jQuery("#aside").find(".tab-content").show(0);
                },
                /**
                 * [cancelPanel 取消新增或者编辑]
                 * @return {[type]} [description]
                 */
                cancelPanel: function () {
                    global.confirmDialog("你确定取消此次任务？", function () {
                        jQuery("#mainContent").removeClass('hidden');
                        jQuery("#doNewEditPanel,#showDetail").addClass('hidden');
                        jQuery("#major").css("left", "280px");
                        jQuery("#aside").find(".tab-content").show(0);
                    });
                },
                /**
                 * [EditCamera 编辑设备信息]
                 */
                EditCamera: function (e) {
                    e.stopPropagation();
                    if (jQuery(this).hasClass("disabled")) {
                        return;
                    }
                    jQuery("#major").css("left", "50px");
                    jQuery("#aside").find(".tab-content").hide(0);
                    if (jQuery(".pubdiv").is(":visible")) {
                        jQuery(".pubdiv").hide(0);
                    }
                    var $node = jQuery(this).closest('tr'),
                        currTrData = self.getCurrTrData($node);
                    self.cameraCtr.newOrEditPanel(currTrData, function () {
                        jQuery("#mainContent,#showDetail").addClass("hidden");
                        self._bindEvents(jQuery("#doNewEditPanel"));
                    });
                },
                /**
                 * [getDetailInfo 获取当前设备详情]
                 * @return {[type]} [description]
                 */
                getDetailInfo: function () {
                    var $node = jQuery(this).closest('tr'),
                        currTrData = self.getCurrTrData($node);
                    jQuery("#major").css("left", "50px");
                    jQuery("#aside").find(".tab-content").hide(0);
                    global.currCameraDeatilData = Object.create(currTrData);
                    self.cameraCtr.getDetailInfo(currTrData, function () {
                        jQuery("#mainContent,#doNewEditPanel").addClass('hidden');
                        self._bindEvents(jQuery("#showDetail"));
                    });
                },
                /**
                 * [enterEditPanel 进入编辑面板form详情]
                 * @return {[type]} [description]
                 */
                enterEditPanel: function () {
                    console.log(global.currCameraDeatilData);
                    self.cameraCtr.newOrEditPanel(global.currCameraDeatilData, function () {
                        jQuery("#mainContent,#showDetail").addClass("hidden");
                        self._bindEvents(jQuery("#doNewEditPanel"));
                    });
                },
                /**
                 * [logoutCamera 注销设备]
                 * @return {[type]} [description]
                 */
                logoutCamera: function (e) {
                    e.stopPropagation();
                    var $node = jQuery(this),
                        currid = $node.data("id"),
                        logtypes = $node.data("logouttype"),
                        isEnter = jQuery(".midleCtrPart").find(".tabinner.active").data("loadtype") === "entered" ? true : false;
                    if ($node.hasClass('disabled')) {
                        return;
                    }
                    if (jQuery(".pubdiv").is(":visible")) {
                        jQuery(".pubdiv").hide(0);
                    }
                    global.setLgoutPanel.setLogout({
                        "type": "camera",
                        "id": currid,
                        callback: function (reason, ids) {
                            var param = {
                                "cancelReason": reason,
                                "id": ids
                            };
                            self.cameraCtr.logOutCurrCamera(param, isEnter, function (isEnter) {
                                if (logtypes === "addOrEdit") {
                                    jQuery("#doNewEditPanel").addClass('hidden');
                                    jQuery("#mainContent").removeClass('hidden');
                                }
                                jQuery('.logOffDialog').hide(0, function () {
                                    jQuery(".commonLayer").fadeOut(200);
                                });
                                if (isEnter === true) {
                                    jQuery(".camera-control").find("span[data-loadtype='entered']").trigger("click");
                                    return;
                                } else {
                                    jQuery(".camera-control").find("span[data-loadtype='unentered']").trigger("click");
                                }

                            });
                        }
                    });
                },
                /**
                 * [bulkImport 批量导入]
                 * @return {[type]} [description]
                 */
                bulkImport: function () {
                    global.setBatchUplaodPanel.BatchUplaod({
                        "type": "camera",
                        "ExcelTemp": "/module/maintenance/registrationManage/inc/注册管理摄像机导入模版.xls",
                        "url": "/service/regist/cameraDevice/importFile",
                        "callback": function (file, res) {
                            var commonDialog = new CommonDialog({
                                title: '导入摄像机数据中,请等待！'
                            });
                            setTimeout(function () {
                                commonDialog.hide();
                                jQuery(".camera-control").find("span[data-loadtype='unentered']").trigger("click");
                            }, 1000);
                        }
                    });
                },
                /**
                 * [enterPlatform 进入平台]
                 * @return {[type]} [description]
                 */
                enterPlatform: function () {
                    var cameraList = [];
                    jQuery("#unenterTab .dataInsert tr[data-status='1']").find(".icon-checkbox.active").each(function () {
                        cameraList.push(jQuery(this).closest("tr").data("id"));
                    });
                    self.cameraCtr.batchEnterPlatform(cameraList, function () {
                        jQuery(".camera-control").find("span[data-loadtype='entered']").trigger("click");
                    });
                }

            };
        },
        getSearchData: function () {
            var self = this,
                searchDatas = {
                    "enterPlatformStatus": jQuery(".midleCtrPart").find(".tabinner.active").data("loadtype") === "entered" ? 1 : 0,
                    "status": jQuery(".selectPanel").find(".cameraStatus").attr("data-code"),
                    "managerUnitName": global.managerUnitName || "",
                    "devicePurpose": jQuery(".selectPanel").find(".searchUseTitle").attr("data-code"),
                    "deviceType": jQuery(".selectPanel").find(".deviceType").attr("data-code"),
                    "deviceClassify": jQuery(".selectPanel").find(".searchManageType").attr("data-code"),
                    "deviceManufacturer": jQuery(".selectPanel").find(".searchManageFactory").attr("data-code"),
                    "monitorType": jQuery(".selectPanel").find(".monitorType").attr("data-code"),
                    "isControl": jQuery(".selectPanel").find(".iscontroll").attr("data-code"),
                    "policeDept": jQuery(".selectPanel").find(".orginDepartment").attr("data-code"),
                    "installPosition": jQuery(".selectPanel").find(".position").attr("data-code"),
                };
            return searchDatas;

        },
        /**
         * [getCurrTrData 获取当前tr数据详情]
         * @param  {[type]} $node [description]
         * @return {[type]}       [description]
         */
        getCurrTrData: function ($node) {
            var self = this,
                editData = {
                    "id": $node.data("id"),
                    "deviceId": $node.data("deviceid"),
                    "deviceName": $node.find(".deviceName").text(),
                    "deviceType": $node.data("devicetype"),
                    "deviceClassify": $node.data("deviceclassify"),
                    "deviceManufacturer": $node.data("devicemanufacturer"),
                    "devicePixel": $node.data("devicepixel"),
                    "monitorType": $node.data("monitortype"),
                    "isControl": $node.data("iscontrol"),
                    "installPosition": $node.data("installposition"),
                    "devicePurpose": $node.data("devicepurpose"),
                    "policeDept": $node.data("policedept"),
                    "monitorSystemId": $node.data("monitorsystemid"),
                    "pointId": $node.data("pointid"),
                    "deviceLongitude": $node.data("devicelongitude"),
                    "deviceLatitude": $node.data("devicelatitude"),
                    "monitorPointHeight": $node.data("monitorpointheight"),
                    "deviceCreateDate": $node.data("devicecreatedate"),
                    "managerUnitName": $node.find(".managerUnitName").text() || "",
                    "countyNumber": $node.data("countynumber"),
                    "basicAccessUnitNum": $node.data("basicaccessunitnum"),
                    "IP": $node.data("ip"),
                    "enterPlatformStatus": $node.data("enterplatformstatus"),
                    'status': $node.data("status"),
                    "cancelReason": $node.data("cancelreason")
                };
            return editData;
        },

        /**
         * 绑定事件
         * @param selector - 选择器，为适应动态绑定
         * @private
         */
        _bindEvents: function (selector) {
            var self = this,
                handler = self._eventHandler();
            $(selector).find("[data-handler]").map(function () {
                $(this).off($(this).data("event")).on($(this).data("event"), handler[$(this).data("handler")]);
            });
            //当有下拉框存在点击dom隐藏
            if (jQuery(".pubdiv").is(":visible")) {
                jQuery(document).on("click", function (e) {
                    e.stopPropagation();
                    jQuery(".pubdiv").hide(0);
                });
            }
        }
    };
    return new CameraView();
});
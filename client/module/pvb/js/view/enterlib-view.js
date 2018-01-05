/**
 * @description [入视图库View]
 * @author [songxuejie@netposa.com]
 * @data [2016/03/30]
 */
define([
    "jquery",
    "cxSelect",
    "jquery-ui-timepicker-addon",
    "/component/base/self/dialog.js",
    "/module/common/popLayer/js/popVideo.js",
    "text!/module/pvb/inc/enterLib.html",
    "style!/module/pvb/css/enterlib.css",
    "style!/module/common/popLayer/css/details.css"
], function (jQuery, cxSelect, datetimepicker, Dialog, PopVideo, tpl) {
    "use strict";

    return (function (scope, $) {
        var // 控制器对象
            _controller = null,
        // 存储容器对象
            _$container = null,
        // 入库对话框
            _enterLibDialog = null,
            /**
             * [_initDialog 初始化对话框]
             */
            _initDialog = function () {
                Dialog.initGlobal();
                _enterLibDialog = new CommonDialog({
                    width: 998,
                    classes: "enterlib-dialog",
                    title: "视图入库",
                    prehide: function () { // dialog关闭
                        // 视频停止播放
                        _$container.find(".resource-container").find(".video-block .stop").trigger("click");
                        // 删除弹框
                        _enterLibDialog.remove();
                    }
                });
                _enterLibDialog.getBody().html(tpl);
            },
            /**
             * [_showPFSVideo 播放PFS视频]
             * @param  {[type]} filePath [PFS文件路径]
             * @return {[type]}          [description]
             */
            _showPFSVideo = function (resourceObj) {
                showRightInputResource(resourceObj);
                var pfsObj = {
                    popBgWarp: $('.resource-container'),
                    showRightDetailInfo: false, // 是否显示右侧信息，默认显示
                    baseInfo: {
                        fileName: resourceObj.filePath
                    }
                };
                PopVideo.initial(pfsObj);
            },
            /**
             * [_showHistoryVideo 播放历史视频]
             * @param  {[type]} resourceObj [历史视频资源对象]
             */
            _showHistoryVideo = function (resourceObj) {
                var historyObj = {
                    popBgWarp: $('.resource-container'),
                    showRightDetailInfo: false, // 是否显示右侧信息，默认显示
                    baseInfo: {
                        fileName: "当前",
                        cameraId: resourceObj.cameraId,
                        beginTime: resourceObj.beginTime,
                        endTime: resourceObj.endTime,
                        fileFormat: "smf"
                    }
                };
                _$container.find(".enterlib-form [name=std_file_format]").addClass("file-format-show");
                _$container.find(".enterlib-form [name=std_file_format_sel]").removeClass("file-format-show");
                PopVideo.initial(historyObj);
            },
            /**
             * [_showImg 显示图片]
             * @param  {[type]} filePath [description]
             */
            _showImg = function (resourceObj) {
                //特殊处理视频监控-标记管理的入库图片地址
                if (resourceObj.resourceObj && resourceObj.resourceObj.showFrameMarkImgPath) {
                    _$container.find(".resource-container").append("<img class='enterlib-img' src='" + resourceObj.resourceObj.showFrameMarkImgPath + "' />");
                } else {
                    _$container.find(".resource-container").append("<img class='enterlib-img' src='" + resourceObj.filePath + "' />");
                }
                showRightInputResource(resourceObj);
            },
            /**
             * [_showDialogLeftResource 展示左侧视频or图片资源]
             * @param  {[type]} resourceObj [description]
             * @return {[type]}             [description]
             */
            _showDialogLeftResource = function (resourceObj) {
                if (resourceObj.type === "PFS") {
                    _showPFSVideo(resourceObj);
                } else if (resourceObj.type === "history") {
                    _showHistoryVideo(resourceObj);
                } else if (resourceObj.type === "img") {
                    _showImg(resourceObj);
                }
            };

        /**
         * 初始化显示从上一个页面传递的值
         */
        function showRightInputResource(resourceObj) {
            if (!resourceObj.fileFormat && resourceObj.filePath) {
                var array = (resourceObj.filePath).split(".");
                var file_format = array[array.length - 1];
                _$container.find(".enterlib-form [name=std_file_format]")[0].value = file_format;
            } else if (resourceObj.fileFormat) {
                _$container.find(".enterlib-form [name=std_file_format]")[0].value = resourceObj.fileFormat;
            }
            if (resourceObj.resourceObj) {
                if (resourceObj.resourceObj.fileName) {
                    _$container.find(".enterlib-form [name=resource_name]")[0].value = resourceObj.resourceObj.fileName;
                }
                if (resourceObj.resourceObj.fileDate) {
                    _$container.find(".enterlib-form [name=shoot_time]")[0].value = Toolkit.mills2datetime(resourceObj.resourceObj.fileDate);
                }
                if (resourceObj.resourceObj.fileDesc) {
                    _$container.find(".enterlib-form [name=resource_description]")[0].value = resourceObj.resourceObj.fileDesc;
                }
            }


        }

        /**
         * [初始化省市县三级下拉]
         */
        function initCommonCascade() {
            $(".js-ctm").cxSelect({
                url: '/component/cascade/cityData.json',
                selects: ['province', 'city', 'area']
            });
        };
        /**
         * [初始化时间插件
         */
        function initDatePicker() {

            $(".enterlib-form .time input").datetimepicker({
                showSecond: true,
                dateFormat: 'yy-mm-dd',
                timeFormat: 'HH:mm:ss',
                timeText: '',
                hourText: '时',
                minuteText: '分',
                secondText: '秒',
                maxDate: new Date(),
                showAnim: ''
            });
        };
        /**
         * 初始化页面绑定事件
         * @param addResourceDialog
         */
        function bindEvent(resourceObj) {
            _$container = $(".enterlib-container");
            //初始化地区下拉选择器
            initCommonCascade();
            //初始化事件选择器
            initDatePicker();
            // 上传按钮点击
            bindEnterStoreBtnClick(resourceObj, _enterLibDialog);
            // 校验按钮事件
            checkBtnClick();
        };
        /**
         * 校验按钮事件(该功能暂不实现)
         */
        function checkBtnClick() {
            _$container.off('click.check').on("click.check", ".check", function (e) {
                e.stopPropagation();
                notify.warn("该功能暂未开放！");
            });
        };
        /**
         * 绑定入库按钮点击事件
         */
        function bindEnterStoreBtnClick(resourceObj) {
            _$container.off('click.enter').on("click.enter", ".js-save", function (e) {
                e.stopPropagation();
                var self = $(this);
                var status = validationForm(resourceObj.type);
                //暂时解决时间插件出现英文问题,导致保存方法报错问题
                try{
                    if(resourceObj.shoot_time.length<11){
                        resourceObj.shoot_time=resourceObj.shoot_time+" 00:00:00"
                    }
                }catch(e){

                }

                if (status) {
                    if (resourceObj.type == 'img' || resourceObj.type == 'PFS') {
                        //图片和视频入库
                        saveFormData(resourceObj);
                    } else if (resourceObj.type == 'history') {
                        //封装历史录像类型参数
                        var formparams = getFormDataForHistory(resourceObj);
                        _controller.EnterStoreCon(formparams, _enterLibDialog);
                    }


                }
            });
        };
        /**
         * [saveFormData 图片和视频入库]
         */
        function saveFormData(resourceObj) {
            var file_format = "";
            if (!resourceObj.fileFormat && resourceObj.filePath) {
                var array = (resourceObj.filePath).split(".");
                file_format = array[array.length - 1];
            } else if (resourceObj.fileFormat) {
                file_format = resourceObj.fileFormat;
            }
            //上传64位编码的图片先调接口转换，再入库
            if (resourceObj.filePath && resourceObj.filePath.indexOf("data:image/jpg;base64") != -1) {
                var params = {};
                var base64data= resourceObj.filePath;
                var i = base64data.indexOf('base64,');
                params.picture=base64data.substr(i + 7);
                $.when(_controller.getImgUrl(params)).then(
                    function (result) {
                        resourceObj.filePath=result.data.pfspath;
                        var formparams = getImgParams(resourceObj, file_format);
                        _controller.EnterStoreCon(formparams, _enterLibDialog);
                    },
                    function () {
                        notify.error("图片地址转换失败！");
                    });
            } else {
                var formparams = getImgParams(resourceObj, file_format);
                _controller.EnterStoreCon(formparams, _enterLibDialog);
            }

        };
        function getImgParams(resourceObj, file_format) {
            var optionsParams = {};
            var son_type = 8
            if (resourceObj.type == "PFS") {
                son_type = 7;
            }
            var params = {
                son_type: son_type, //资源类型 img:8    video:7
                std_path: resourceObj.filePath, //图片存储路径
                std_file_format: file_format,//fileFormat, //文件格式
                thumbnail: son_type == 8 ? resourceObj.filePath : null,//缩略图地址  可为空
                ctm_file_size: 0//fileSize可为空
            };
            //取表单值
            var arr = $("#resForm").serializeArray();
            var formData = {};
            for (var i = arr.length - 1; i >= 0; i--) {
                formData[arr[i].name] = $.trim(arr[i].value);
            }
            params.ctm_province = formData.ctm_province;
            params.ctm_city = formData.ctm_city;
            params.ctm_country = formData.ctm_country;
            params.ctm_streets = formData.ctm_streets;
            params.resource_name = formData.resource_name;
            params.shoot_time = formData.shoot_time;
            params.resource_description = formData.resource_description;
            params.user_name = "";//前台不需传值，后台赋值
            optionsParams.type = resourceObj.type;
            optionsParams.params = params;
            return optionsParams;
        }

        /**
         * [getFormDataForHistory 获取表单数据并封装历史录像参数集合]
         */
        function getFormDataForHistory(resourceObj) {
            var params = {};
            var optionsParams = {};
            var arr = $("#resForm").serializeArray();
            var formData = {};
            for (var i = arr.length - 1; i >= 0; i--) {
                formData[arr[i].name] = $.trim(arr[i].value);
            }
            params = {
                channelId: resourceObj.channelId,//20563
                vodType: resourceObj.vodType,//0
                fileType: "1",//1:视频   0：图片
                incidentId: null,
                fileFormat: resourceObj.type == "img" ? formData.std_file_format : formData.std_file_format_sel,
                shootTime: formData.shoot_time,
                category: null,//"F1",
                name: formData.resource_name,
                description: formData.resource_description,
                province: formData.ctm_province,
                city: formData.ctm_city,
                country: formData.ctm_country == undefined ? " " : formData.ctm_country,
                streets: formData.ctm_streets == undefined ? " " : formData.ctm_streets,
                longitude: 121.47297317,//resourceObj.longitude,
                latitude: 31.27992079,//resourceObj.latitude,
                duration: 183,//resourceObj.duration,
                enterTime: 1460539417000,//resourceObj.enterTime,
                startTime: resourceObj.beginTime,
                endTime: resourceObj.endTime,
                width: 500,//resourceObj.width,
                height: 300,//resourceObj.height,
                sourceId: null,
                device: null,
                codeFormat: null,
                supplement: null,
                earmark: null,
                subject: null,
                keywords: null,
                keyman: null,
                secrecy: null,
                language: null,
                picker: null,
                pickerCompany: null,
                quality: 0,
                pic: null,
                location: (formData.ctm_province != undefined ? formData.ctm_province : " ") + " "
                + (formData.ctm_city != undefined ? formData.ctm_city : " ") + " "
                + (formData.ctm_country != undefined ? formData.ctm_country : " ") + " "
                + (formData.ctm_streets != undefined ? formData.ctm_streets : " "),
                remark: ""
            }
            optionsParams.type = resourceObj.type;
            optionsParams.params = params;
            return optionsParams;
        };
        /**
         * 表单数据验证
         */
        function validationForm(type) {
            var name = $('input[name="resource_name"]'),
                time = $('input[name="shoot_time"]'),
                province = $('select[name="ctm_province"]'),
                city = $('select[name="ctm_city"]'),
                street = $('input[name="ctm_streets"]'),
                textarea = $('.enterlib-form textarea'),
                std_file_format = $('select[name="std_file_format_sel"]'),
                flag = true;
            if (name.val().trim().length == 0) {
                name.val('');
                name.attr("placeholder", "请输入视图名称").addClass("error-tip");
                flag = false;
                return;
            }
            if (containSpecial(name.val().trim())) {
                flag = false;
                notify.warn("视图名称只能输入汉字，英文,数字或者下划线！");
                return;
            }
            if (name.val().trim().length > 30) {
                name.addClass("error-tip");
                name.next('.sign').html('*30字以内');
                flag = false;
                return;
            }
            // 校验拍摄日期
            flag = checkShootTime(time);

            if (!province.val()) {
                province.attr("placeholder", "请选择所在省份").addClass("error-tip");
                flag = false;
                return;
            } else {
                if (!city.val()) {
                    city.attr("placeholder", "请选择所在城市").addClass("error-tip");
                    flag = false;
                    return;
                }
            }
            if (street.val().length > 50) {
                street.addClass("error-tip");
                street.next('.sign').html('*50字以内');
                flag = false;
                return;
            }
            if (textarea.val().length > 150) {
                textarea.addClass("error-tip");
                textarea.next('.sign').html('*150字以内');
                flag = false;
                return;
            }
            //历史图像type=="history"  校验是否选择  文件格式
            if (type == "history" && !std_file_format.val()) {
                std_file_format.attr("placeholder", "请选择文件格式").addClass("error-tip");
                flag = false;
                return;
            }
            return flag;
        }

        //校验是否含有特殊字符
        var containSpecial = function (str) {
            //var containSpecial = RegExp(/[(\ )(\~)(\!)(\@)(\#) (\$)(\%)(\^)(\&)(\*)(\()(\))(\（)(\）)(\-)(\+)(\=) (\[)(\])(\{)(\})(\|)(\\)(\;)(\:)(\')(\")(\,)(\.)(\/) (\<)(\>)(\?)(\)]+/);
            var containSpecial = RegExp(/^[\u4e00-\u9fa5_a-zA-Z0-9]+$/);
            return (!containSpecial.test(str) );
        }

        /**
         * [checkShootTime 校验拍摄日期]
         * @return {[type]} [description]
         */
        function checkShootTime($time) {
            var curDate = new Date().getTime(),
                selectedDateStr = $time.val(),
                selectedDate;
            // 校验拍摄日期是否为空
            if (!selectedDateStr) {
                $time.attr("placeholder", "请输入拍摄时间").addClass("error-tip");
                return false;
            }
            // 校验拍摄日期是否超过最大值当前时间
            selectedDate = new Date(selectedDateStr).getTime();
            if (selectedDate > curDate) {
                notify.warn("拍摄日期不能大于当前日期");
                $time.attr("placeholder", "拍摄日期不能大于当前日期").addClass("error-tip");
                return false;
            }
            return true;
        }

        /**
         * [init View初始化]
         * @param  {[type]} controller [控制器对象]
         * @param  {[type]} obj        [图片:{type:"img"} PFS:{type:"PFS",filePath: ""} 历史录像:{type: "history",cameraId: 11,beginTime:1448961325000,endTime: 1448961367000}]
         */
        scope.init = function (controller, resourceObj) {

            // 控制器对象
            _controller = controller;
            // 初始化对话框
            _initDialog();
            // 存储容器对象
            _$container = $(".enterlib-container");
            // 渲染对话框左侧的资源（图片或者视频）
            _showDialogLeftResource(resourceObj);
            //初始化页面选择器和事件绑定
            bindEvent(resourceObj);
        };

        return scope;
    }({}, jQuery));
});

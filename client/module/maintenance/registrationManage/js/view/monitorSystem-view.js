/**
 * @Date：2016.3.24
 * @Author:haoyog
 * @Description:监控系统view层，处理一些事件绑定，样式改变，区块渲染
 */
define([
    "jquery",
    '../../../../inspect/monitor/js/pubsub',
    '../global-varibale',
    '/component/base/self/regexp.extend.js'
], function (jQuery, PubSub, global) {

    return (function (scope, $) {
        var _controller = null,//保存控制器
            _$tempSelector,

            managerUnitCodeOptionsList = [
                ["1482", "1483", "1484", "1485", "1486", "1487", "1488"],
                ["代码：1482", "代码：1483", "代码：1484", "代码：1485", "代码：1486", "代码：1487", "代码：1488"]
            ],
            networkTypeOptionsList = [
                ["00", "01", "02", "03"],
                ["公安信息网", "图像传输专网", "互联网", "其他"]
            ],
            /**
             * 保存点击 "编辑，删除"的按钮，把操作对象的ID记录下来 作为提交接口的参数
             */
            _MSID = -1,
            _monitorSystemId = "",

            /**
             * 事件句柄集合
             * @private
             */
            _eventHandler = {

                /**
                 * 弹出新建对话框
                 * @param e
                 */
                "showCreateBox": function (e) {
                    e.stopPropagation();
                    e.preventDefault();

                    //框架隐藏 在控制层做的
                    //window.top.showHideNav("hide");

                    //调用控制层弹出窗口，传参空对象（新建不需要数据）
                    _controller.loadNew('0', {});
                },

                /**
                 * 模拟radio的选中
                 * @param e
                 */
                "checkRadio": function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    $(this).addClass("active").siblings().removeClass("active");
                },

                /**
                 * 模拟点击下拉菜单，显示选项集合
                 * @param e
                 */
                "showSelectOptions": function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    _$tempSelector = $(".pubdiv");
                    if (_$tempSelector.is(".active")) {
                        _$tempSelector.removeClass("active").hide();
                        _$tempSelector.find("ul").empty();
                    } else {
                        var types = jQuery(this).data("type"),
                            position = {
                                "left": jQuery(this).offset().left,
                                "top": jQuery(this).offset().top,
                                "clientW": jQuery(this)[0].clientWidth
                            };

                        var htmlStr = [];

                        var publist = (function (types) {
                            switch (types) {
                                case "monitorSystemName":
                                    return [];
                                //break;
                                case "managerUnitCode":
                                    return managerUnitCodeOptionsList;
                                //break;
                                case "networkType":
                                    return networkTypeOptionsList;
                                //break;
                                default:
                                    return [];
                            }
                        }(types));

                        //组织结构单独处理(调接口拿数据)
                        if ("managerUnitName" === types) {
                            publist = _controller.getManagerUnitNameList();
                            //修改pubdiv样式
                            _$tempSelector.css({
                                "display": "block",
                                "max-height": "155px;!important",
                                "overflow": "auto"
                            });
                        }
                        for (var i = 0, le = publist[0].length; i < le; i++) {
                            htmlStr.push('<li data-name="' + types + '" data-value="' + publist[0][i] + '" value="' + publist[0][i] + '" data-event="click" data-handler="selectOptionClick">' + publist[1][i] + "</li>");
                        }
                        _$tempSelector.find("ul").html(htmlStr.join(""));
                        _$tempSelector.show(0).css({
                            "left": position.left + "px",
                            "top": (position.top + 30) + "px",
                            "width": position.clientW + "px"
                        }).addClass("active");

                        scope.bindEvents(_$tempSelector);
                    }
                },

                /**
                 * 模拟点击菜单项
                 * @param e
                 */
                "selectOptionClick": function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    var value = $(this).data("value"),//选中的值
                        text = $(this).text(),//选中的文本
                        name = $(this).data("name");//选中的data-name值
                    var spanEle = $(".formEdit").find("span[data-name=" + name + "]");
                    spanEle.eq(0).text(text).attr({
                        "data-value": value,
                        "data-text": text
                    });
                    _$tempSelector = $(".pubdiv");
                    _$tempSelector.hide().removeClass("active");
                    _$tempSelector.find("ul").empty();

                },


                /**
                 * 保存新建的系统：验证表单 并提交到接口
                 * @param e 事件对象
                 * @returns {boolean} 出错返回
                 */
                "saveOneMonitorSystem": function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    var /*errorflag = 0, *///表单错误标识，为了让each真正结束
                        data = {};     //一边验证一边获取表单数据


                    /* 由于很多穿插的模拟下拉菜单和radio 循环打包验证顺序会乱掉 so一个个验证*/
                    var $commonElement = $(".monitor-system .editMonitor"),//根节点
                        $curEle,//当前节点
                        value; //当前值

                    //监控系统名称
                    $curEle = $commonElement.find("[data-name='monitorSystemName']");
                    value = $curEle.val();
                    if (value.trim() === "") {
                        _warmWithRedBorder($curEle);
                        notify.warn("请填写监控系统名称");
                        return false;
                    }
                    if (value.length > 40) {
                        _warmWithRedBorder($curEle);
                        notify.warn("监控系统名称不能多于40个字符");
                        return false;
                    }

                    data.monitorSystemName = value;

                    //管理单位名称 组织结构
                    $curEle = $commonElement.find("[data-name='managerUnitName']");
                    value = $curEle.attr("data-value");
                    if (value.trim() === "") {
                        _warmWithRedBorder($($curEle).parent());
                        notify.warn("请选择管理单位名称-组织结构");
                        return false;
                    }
                    data.organizationId = value;
                    data.managerUnitName = $($curEle).attr("data-text");
                    //系统所在地
                    $curEle = $commonElement.find("[data-name='monitorSystemLocation']");
                    value = $curEle.val();
                    data.monitorSystemLocation = value;

                    //承载网络
                    $curEle = $commonElement.find("[data-name='networkType']");
                    value = $curEle.attr("data-value");
                    if (value.trim() === "") {
                        _warmWithRedBorder($($curEle).parent());
                        notify.warn("请选择承载网络");
                        return false;
                    }
                    data.networkType = value;

                    //是否联网
                    if ($commonElement.find("[data-name='isNetwork']").filter(".active").length === 0) {
                        notify.warn("请选择是否联网");
                        return false;
                    }
                    data.isNetwork = $commonElement.find("[data-name='isNetwork']").filter(".active").eq(0).data("value").toString();


                    // 是否符合标准
                    if ($commonElement.find("i[data-name='isNationalStandard']").filter(".active").length === 0) {
                        notify.warn("请选择是否符合国际标准");
                        return false;
                    }
                    data.isNationalStandard = $commonElement.find("i[data-name='isNationalStandard']").filter(".active").eq(0).data("value").toString();

                    //录像存储周期
                    $curEle = $commonElement.find("[data-name='videoStoragePeriod']");
                    value = $curEle.val().trim();
                    if ((value !== "") && isNaN(value)) {
                        notify.warn("录像存储周期（天数）必须是数字");
                        _warmWithRedBorder($curEle);
                        return false;
                    }
                    data.videoStoragePeriod = value;

                    //
                    $curEle = $commonElement.find("[data-name='contactName']");
                    value = $curEle.val();
                    data.contactName = value;

                    //联系方式
                    $curEle = $commonElement.find("[data-name='contactPhone']");
                    value = $curEle.val().trim();
                    if ((value !== "") && !(RegExp.isPhone(value))) {
                        notify.warn("联系电话格式错误");
                        _warmWithRedBorder($curEle);
                        return false;
                    }
                    data.contactPhone = value;

                    //单位地址
                    $curEle = $commonElement.find("[data-name='managerUnitAddress']");
                    value = $curEle.val();
                    data.managerUnitAddress = value;

                    //id
                    if ((typeof _MSID !== "undefined") && _MSID !== -1) {
                        data.id = _MSID.toString();

                        _MSID = -1;//注销
                    }
                    data.monitorSystemId = _monitorSystemId;
                    _monitorSystemId = "";//注销
                    _controller.createOrEditMonitorSystem(data);
                    $(".cancleDialog").trigger("click");
                },

                /**
                 * 取消新建/编辑对话框
                 * @param e
                 */
                "cancleCreateOrEdit": function (e) {
                    //这里允许冒泡 为了使下拉菜单触发document点击事件
                    //e.stopPropagation();
                    e.preventDefault();
                    //显示导航
                    window.top.showHideNav("show");
                    $(".monitor-system .mask").fadeOut(200, function () {
                        $(this).remove();//清除弹出框
                    });
                },


                /**
                 *
                 * 编辑系统 读取数据 弹出编辑框
                 * @param e 事件对象
                 */
                "editTheSystem": function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    var data = {};
                    var spanBtnSelf = this;
                    $(spanBtnSelf).parentsUntil("table").find("[data-name]").each(function () {
                        data[$(this).data("name")] = $(this).data("value");

                        //添加额外value对应的文本项，只用于填充表单，提交请求时用value值
                        if ($(this).data("name") === "networkType") {
                            data["networkType-text"] = $(this)[0].innerText;
                        }
                    });

                    _MSID = $(this).data("id");
                    _monitorSystemId = data.monitorSystemId;
                    _controller.loadNew("1", data);//1 => 编辑
                },


                /**
                 * 注销一个系统项，弹出对话框
                 * @param e 事件对象
                 */
                "logOffTheSystem": function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    global.setLgoutPanel.setLogout({
                        "systemName": "监控",
                        "type": "monitorSystem",
                        "id": $(this).data("id"),
                        callback: function (reason, id) {
                            var data = {};
                            data.cancelReason = reason;
                            data.id = id;

                            _MSID = -1;//注销 _MSID

                            _controller.logOffMonitorSystemById(data);

                            $(".cancleDialog").trigger("click");
                        }
                    });
                },

                /**
                 * 取消新建或编辑窗口
                 * @param e
                 */
                "cancleCreate": function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    $(".logOffDialog").fadeOut(200);
                    $(".commonLayer").fadeOut(200);
                }
            },

            /**
             * 表单验证错误提示 对当前发现的错误表单项以红色边框标识 用户有操作之后（失去焦点）标识消失
             * @param selecter 当前选择器
             * @private 仅供内部使用
             */
            _warmWithRedBorder = function (selecter) {
                //
                $(selecter).css({"border-color": "#e00"});
                $(selecter).focus();
                $(selecter).off("blur").on("blur", function () {
                    //为了避免重复绑定blur事件 先off
                    $(selecter).css({"border-color": "#999"});
                });
            },

            /**
             * 判断是否是管理员登录
             * @returns {boolean}
             * @private
             */
            _isAdmin = function () {
                var loginName = $("#userEntry").attr("data-loginname");

                return loginName.toString() === "admin";
            };

        scope.dealWithLogOffRight = function () {
            if (!_isAdmin()) {
                $(".monitor-system .delIcon").remove();
            }
        };

        /**
         * 绑定事件
         * @param selector 选择器
         * @private
         */
        scope.bindEvents = function (selector) {
            var handeler = _eventHandler;
            $(selector).find("[data-event]").each(function () {
                $(this).off($(this).data("event"), handeler[$(this).data("handler")]).on($(this).data("event"), handeler[$(this).data("handler")]);
            });
            if ((_$tempSelector = jQuery(".pubdiv")).hasClass("active")) {
                //点击任意地方清空下拉菜单
                jQuery(document).on("click", function () {
                    /*alert(1);*/
                    _$tempSelector.removeClass("active").hide();
                    _$tempSelector.find("ul").empty();
                });
                //窗口大小改变以及失去串口焦点清空下拉菜单
                jQuery(window).on("resize blur", function () {
                    _$tempSelector.removeClass("active").hide();
                    _$tempSelector.find("ul").empty();
                });
            }
        };

        /**
         * 给注销的表项添加样式-取消事件绑定 整体透明度减小 无法选中等
         */
        scope.addLogOffStyle = function () {
            $("td[data-name='status']").each(function () {
                if ($(this).data("value").toString() === "0") {
                    $(this).parent().hover().children().css({
                        "cursor": "default",
                        "opacity": "0.45",
                        "filter": "alpha(opacity=45)",
                        "-moz-opacity": "0.45",
                        "-khtml-opacity": "0.45"
                    });
                    $(this).parent().hover().css({
                        "background-color": "#FFF",
                        "border-left": "none",
                        "border-right": "none"
                    });
                    $(this).parent().attr("title", "已注销");
                    var sel = $(this).siblings().find("span i");
                    sel.filter(".editIcon").addClass("editLogOff").removeAttr("data-event");
                    sel.filter(".editIcon").addClass("editLogOff").removeAttr("title");
                    sel.filter(".delIcon").addClass("delLogOff").removeAttr("data-event");
                    sel.filter(".delIcon").addClass("delLogOff").removeAttr("title");
                }
            });
        };

        scope.init = function (conctroller) {
            //保存控制器对象
            _controller = conctroller;
        };

        return scope;
    }({}, jQuery));

})
;
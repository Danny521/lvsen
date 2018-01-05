/**
 * [下拉框]
 * @author songxj
 * @date 2015-10-16
 */
define(["ajaxModel", "jquery", 'underscore', 'handlebars'], function(ajaxModel, jQuery, _) {
    return (function (scope, $) {
        var
            _templateHtml = null, // 缓存模板列表
            _templateURL = "/module/common/select-box/select.html", // 模版请求地址
            _cssURL = "/module/common/select-box/select.css", // 样式文件
            /**
             * [_calculatePubdivPosition 计算下拉列表的宽度和位置]
             * @author songxj
             * @param  {[type]} $selector [文本框元素]
             * @param  {[type]} $pubdiv   [下拉列表容器元素]
             */
            _calculatePubdivPosition = function ($selector, $pubdiv) {
                var selectorWidth = $selector.width(),
                    selectorHeight = $selector.height(),
                    offset = $selector.position(),
                    selectorLeft = offset.left,
                    selectorTop = offset.top;
                $pubdiv.width(selectorWidth).css("left", selectorLeft +2).css("top", (selectorTop + selectorHeight)).show();
            },
            /**
             * [_dealCheckboxChooseStyle 处理下拉列表中checkbox选中样式]
             * @author songxj
             * @param  {[type]} $this [下拉列表中checkbox行元素]
             */
            _dealCheckboxChooseStyle = function($this,$selector) {
                var $currentCheckbox = $this.find("i.checkbox"),
                    $allCheckboxs = $this.closest(".pubdiv").find("i.checkbox"),
                    isSelectedAllFlag = true;
                $currentCheckbox.toggleClass("checked");
                $allCheckboxs.each(function() {
                    if (!$(this).hasClass("checked")) {
                        isSelectedAllFlag = false;
                        return false;
                    }
                });
                //全选
                if(isSelectedAllFlag){
                    $selector.closest(".select_wrapper").find(".pubdiv").find(".first").find("a.allcheck").addClass("checked");
                }else{
                    $selector.closest(".select_wrapper").find(".pubdiv").find(".first").find("a.allcheck").removeClass("checked");
                }
            },
             /**
             * [_dealSelectAllOrClearOrDone 处理全选，清除，完成事件]
             * @author songxj
             * @param  {[type]} $this [下拉列表中checkbox行元素]
             */
            _dealSelectAllOrClearOrDone = function($this,$selector,callback){
                var  $allCheckboxs = $selector.closest(".select_wrapper").find(".pubdiv").find("i.checkbox");
                //点击全选
                if($this.hasClass("allcheck")){
                    $this.toggleClass("checked");
                    if($this.hasClass("checked")){
                        $allCheckboxs.addClass("checked");
                    }else{
                        $allCheckboxs.removeClass("checked");
                    }
                    callback && _dealMutil($selector,callback);
                //点击清除    
                }else if($this.hasClass("allclear")){
                    $allCheckboxs.removeClass("checked");
                    $selector.closest(".select_wrapper").find(".pubdiv").find(".first").find("a.allcheck").removeClass("checked");
                    callback && _dealMutil($selector,callback);
                //点击完成    
                }else{
                    callback && _dealMutil($selector,callback);
                    _switchArrow($selector.closest(".select_wrapper").find(".select_container"));
                    $selector.closest(".select_wrapper").find(".pubdiv").remove();
                }
            },
            /**
             * [_dealSelectListMuliSelect 处理下拉列表多选情况]
             * @author songxj
             * @param  {[type]}   $this     [下拉列表中checkbox行元素]
             * @param  {[type]}   $selector [文本框元素]
             * @param  {Function} callback  [回调函数]
             */
            _dealSelectListMuliSelect = function($this, $selector, callback) {
                // 处理checkbox选中样式
                _dealCheckboxChooseStyle($this,$selector);
                _dealMutil($selector,callback);
            },
            /**
             * 多选对外暴露接口
             */
            _dealMutil = function($selector,callback){
                var $allCheckboxs = $selector.closest(".select_wrapper").find(".pubdiv").find("i.checkbox"),
                    mutiliCallbackData = [],
                    ids = [];
                // 拼凑callback返回的数据
                $allCheckboxs.each(function() {
                    if ($(this).hasClass("checked")) {
                        mutiliCallbackData.push({
                            name: $(this).siblings("em").text(),
                            id: $(this).closest("li").attr("data-id")
                        });
                        ids.push($(this).closest("li").attr("data-id"));
                    }
                });
                //清除操作回显默认值
                if(ids.length === 0){
                    var text = $selector.find("span.text").attr("data-defaultvalue");
                    $selector.find("span.text").attr("title",text).text(text);
                }else{
                    var names = _.pluck(mutiliCallbackData,"name"),
                        nameList = names.join(","),
                        subNameList = "";
                    if(nameList.length > 12){
                        subNameList = nameList.substring(0,12)+"...";
                    }else{
                        subNameList = nameList;
                    }
                    $selector.find("span.text").attr("title",nameList).text(subNameList);
                }
                $selector.closest(".select_wrapper").find("input.filter-item-value").val(ids.join(","));

                // 执行回调函数
                callback && callback(mutiliCallbackData);
            },
            /**
             * [_dealNormalSelectList 处理正常的下拉列表的情况]
             * @author songxj
             * @param  {[type]}   $this     [下拉列表行元素]
             * @param  {[type]}   $selector [文本框元素]
             * @param  {Function} callback  [回调函数]
             */
            _dealNormalSelectList = function($this, $selector, callback) {
                var $selectorField = $selector.find(".text"),
                    selectorClass = $selector.attr("class"),
                    liType = $this.attr("data-id"),
                    callbackData = {selector: selectorClass, data:{}},
                    text = $this.text();

                // 将值写入下拉框,并删除下拉列表
                $selectorField.attr("data-id", liType).text(text);
                _switchArrow($this.closest(".pubdiv").siblings(".select_container"));
                $this.closest(".pubdiv").remove();

                // 给callback返回的数据写值
                callbackData.data["name"] = text;
                callbackData.data["value"] = liType;

                // 执行回调函数
                callback && callback(callbackData);
            },
            /**
             * [_bindSelectListEvent 下拉列表事件]
             * @author songxj
             * @param  {[type]}   $selector   [文本框元素]
             * @param  {[type]}   selectModle [下拉列表类型 multiSelect：多选  其他：非多选]
             * @param  {Function} callback    [回调函数]
             */
            _bindSelectListEvent = function ($selector, selectModle, callback) {
                /*下拉列表中下拉项的点击事件*/
                $selector.closest(".select_wrapper").find(".pubdiv li").on("click", function() {
                    if (selectModle === "multiSelect") { // 多选，肯定有回调函数
                        // 处理下拉列表多选情况
                        _dealSelectListMuliSelect($(this), $selector, callback);
                    } else { // 非多选，有回调函数时执行回调函数
                        // 处理正常的下拉列表的情况
                        _dealNormalSelectList($(this), $selector, callback);
                    }
                });
                /*全选，清除，完成按钮点击事件*/
                $selector.closest(".select_wrapper").find(".pubdiv a").on("click", function(e) {
                    _dealSelectAllOrClearOrDone($(this),$selector,callback);
                });
                /*下拉列表hover事件：标记当前鼠标是否离开下拉列表的状态*/
                $selector.closest(".select_wrapper").find(".pubdiv").hover(function() {
                    $(this).removeClass("leave");
                }, function() {
                    $(this).addClass("leave");
                });
            },
            /**
             * [_switchArrow 切换向上、向下箭头]
             * @author songxj
             * @param  {[type]} $selector [文本框元素]
             */
            _switchArrow = function ($selector) {
                var $pubdiv = $selector.siblings(".pubdiv"),
                    $arrow = $selector.find(".arrow");

                $pubdiv.is(":visible") ? $arrow.addClass("arrow-down").removeClass("arrow-up") : $arrow.addClass("arrow-up").removeClass("arrow-down");
            },
            /**
             * [_drawTemplateCallback 渲染模板的回调函数]
             * @author songxj
             * @param  {[type]} $selector [文本框元素]
             * @param  {[type]} params    [参数列表]
             */
            _drawTemplateCallback = function ($selector, params) {
                var $selectWrapper = $selector.closest(".select_wrapper"),
                    tempData = {};
                var checkedValue = $selector.find("input.filter-item-value").val(),
                    checkedIds = checkedValue.split(","),
                    len = checkedIds.length,
                    length = params.data.length;
                tempData[params.selectModle] = {"data": params.data};
                $selectWrapper.append(_templateHtml(tempData));
                if(!!checkedValue && len > 0){
                    for (var index = 0; index < len; index++) {
                        var element = checkedIds[index];
                        $selectWrapper.find(".pubdiv").find("ul").find("li[data-id="+element+"]").find(".checkbox").addClass("checked");
                    }
                     //把全选勾上
                    if(!!checkedValue && len === length){
                        $selectWrapper.find(".pubdiv").find("a.allcheck").addClass("checked");
                    }
                }
                // 给下拉列表做个标记：当前的下拉框
                $selectWrapper.find(".pubdiv").attr("data-selector", params.selector);
                // 计算下拉列表的宽度和位置
                _calculatePubdivPosition($selector, $selectWrapper.find(".pubdiv"));
                // 绑定下拉列表事件
                _bindSelectListEvent($selector, params.selectModle, params.callback);
            },
            /**
             * [_getSelectorData 获取下拉列表数据]
             * @author songxj
             * @param  {[type]} $selector [文本框元素]
             * @param  {[type]} params    [参数列表]
             */
            _getSelectorData = function ($selector, params) {
                var selectModle = null;

                // 判断当前下拉框的模板类型
                if (!params.isMultiSelect) { // 不是多选下拉列表
                    selectModle = "normal";
                } else { // 多选下拉列表
                    selectModle = "multiSelect";
                }
                params["selectModle"] = selectModle;

                // 若模板不存在则重新发送请求加载，若存在则根据模板加载数据并显示
                if (_templateHtml) {
                    _drawTemplateCallback($selector, params);
                } else {
                    ajaxModel.getTml(_templateURL).then(function(result) {
                        _templateHtml = Handlebars.compile(result); //缓存模板
                        _drawTemplateCallback($selector, params);
                    });
                }
            },
            /**
             * 动态添加样式文件
             */
            _addCss = function(){
                jQuery("head").append('<link rel="stylesheet" href="'+_cssURL+'">');
            },
            /**
             * [_bindEvents 下拉文本框元素、document事件]
             * @author songxj
             * @param  {[type]} params [参数列表]
             */
            _bindEvents = function (params) {
                /*下拉文本框元素点击事件：显示加载下拉列表*/
                $(params.selector).on("click", function(e) {
                    var $this = $(this),
                        $selectWrapper = $this.closest(".select_wrapper"),
                        $panel = $(".select_wrapper .pubdiv");
                    // 阻止事件冒泡
                    e.stopPropagation();
                    // 若界面上有下拉列表，则删除
                    if ($panel.length) {
                        _switchArrow($(".select_wrapper .pubdiv").closest(".select_wrapper").find(".select_container"));
                        $(".select_wrapper .pubdiv").remove();

                        // 若点击的是当前下拉框,return
                        if ($panel.attr("data-selector") === params.selector) {
                            return;
                        }
                    }
                    // 切换当前下拉元素的箭头
                    _switchArrow($this);
                    // 获取对应下拉列表数据
                    _getSelectorData($this, params);
                });

                /*document点击事件：点击非下拉列表时，将当前下拉列表删除*/
                if (!this.inited) {
                    $(document).on("click", function(e) {
                        if ($(".select_wrapper .pubdiv").hasClass("leave")) {
                            _switchArrow($(".select_wrapper .pubdiv").closest(".select_wrapper").find(".select_container"));
                            $(".select_wrapper .pubdiv").remove();
                        }
                    });
                    this.inited = true;
                }
            };
        /**
         * [selectBox 下拉列表入口]
         * @author songxj
         * @param  {[type]} options [参数列表]
         */
        scope.selectBox = function (options) {
           //添加一点样式
            _addCss();
           if (options instanceof Array) { // 数组：多个下拉框
                for (var i = 0, optionLength = options.length; i < optionLength; i++) {
                    _bindEvents(options[i]);
                }
           } else { // 对象：一个下拉框
                _bindEvents(options);
           }
        };

        return scope;
    }({}, jQuery));
});

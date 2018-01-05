/*
** @Date：2016.3.24
** @Author:zhaojin
** @Description:xx
*/
define([
  '../controller/camera-controller',
    "pubsub",
    "../global-varibale",
    "jquery",
    "../view/commonHelper",
    "handlebars",
    "base.self",
    'jquery.watch'
    ], function(cameraCtr,PubSub,global, $, pointRegister) {

    var PointView = function() {};

    PointView.prototype = {

        _pointCtr: null,
        pubList: ["点位编号", "点位名称","点位位置","所属部位"],
        selectStatus: [{code: "1",value: "正常"}, {code: "0",value: "注销"}],
        /**
         * 初始化页面
         * @param  {[type]} objCtr [pointController对象]
         */ 
       
        init: function(objCtr) { 
            var self = this;
            self._pointCtr = objCtr;
            self._bindEvents(".point-control");
            $(".enter-library-btn").css("display", "none");
        },
        _eventHandler: function() {
            var self = this,
                $point = $(".point-control"),
                isMouseOvershowdetails = false,
                editId = -1;

            return {
                 /**
                  * [点击进入平台，渲染列表]
                  * @param  {[type]} e [description]
                  * @return {[type]}   [description]
                  */
                "LoadEnterList": function(e) {
                    //隐藏checkbox和进入平台按钮
                    $point.find(".checkbox-h").css("display", "none");
                    $point.find(".enter-library-btn").addClass("hidden");
                    //改变进入平台div样式
                    $point.find(".enter-library").siblings().removeClass("current").end().addClass("current");
                    $("#search-key").val("");
                    //调数据
                    self._pointCtr.loadYNEnterList(1);
                    permission.show();
                    e.stopPropagation();
                },
                 /**
                  * [点击未进入平台，渲染列表]
                  * @param  {[type]} e [description]
                  * @return {[type]}   [description]
                  */
                "LoadNoEnterList": function(e) {
                    if ($("#userEntry").data("loginname") !== "admin") {
                      $point.find(".enter-library-btn").addClass("hidden");
                    }else{
                      $point.find(".enter-library-btn").removeClass("hidden");
                    }
                    //显示checkbox和进入平台按钮
                    $point.find(".checkbox-h").css("display", "table-cell");
                    //改变未进入平台div样式
                    $point.find(".no-enter-library").siblings().removeClass("current").end().addClass("current");
                    $("#search-key").val("");
                    //调数据
                    self._pointCtr.loadYNEnterList(0);
                    permission.show();
                    e.stopPropagation();
                },
                /**
                 * [选择筛选条件（表的字段）]
                 * @param  {[type]} e [description]
                 * @return {[type]}   [description]
                 */
                "SearchPointSelect": function(e) {
                    var isMouseOverPubDiv = $(".pubdiv").hasClass("active");
                    //alert(isMouseOverPubDiv);
                    e.stopPropagation();
                    var htmlStr = [], 
                        $ele = $(this);
                    for (var i = 0, le = self.pubList.length; i < le; i++) {
                        htmlStr.push('<li data-event="click" data-handler="setPub">' + self.pubList[i] + "</li>");
                    }
                    self.selectBox($ele,isMouseOverPubDiv,htmlStr);
                },
                /**
                 * 选中筛选字段
                 * @param {[type]} e [description]
                 */
                setPub: function(e) {
                    var returnObj = this;
                    e.stopPropagation();
                    var currVal = $(this).text();

                    $point.find(".pointSelect").find(".text").text(currVal);
                    $point.find(".pointSelect").find(".text").attr("data-value", currVal);
                    $(".pubdiv").attr("style", "");
                    $(".pubdiv ul li").remove();
                    $(".pubdiv").removeClass("active");

                    if(currVal === "点位位置"){
                      $(".question-span").show();
                    }else{
                      $(".question-span").hide();
                    }
                    
                    if(currVal === "所属部位"){
                      //在搜索输入框下显示的全部选项
                      var isMouseOverPubDiv = $(".pubdiv").hasClass("active");
                      e.stopPropagation();
                      var htmlStr = [],
                          $ele = $(".left-search-panel").find("input");

                      for (var i = 0, le = global.pointPubTypeList.pointSite.length; i < le; i++) {
                          htmlStr.push('<li data-event="click" data-handler="setPointSite">' + global.pointPubTypeList.pointSite[i].value + "</li>");
                      }
                      self.selectBox($ele, isMouseOverPubDiv, htmlStr);

                      //如果搜索框有输入内容则实时查询
                      $("#search-key").on("focus",function(e){
                        //搜索(每0.2s去监听输入框中的内容)
                        jQuery("#search-key").watch({
                          wait: 200,
                          captureLength: 0,
                          callback: function(key) {
                            self._pointCtr.selectRightPointSite(key);
                          }
                        });
                      });

                    }
                },

                 /**
                 * [选择筛选条件（注销，正常）]
                 * @param  {[type]} e [description]
                 * @return {[type]}   [description]
                 */
                "SearchPointstatus": function(e) {
                  var isMouseOverPubDiv = $(".pubdiv").hasClass("active");
                    e.stopPropagation();
                    var htmlStr = [],
                        $ele = $(this);

                    for (var i = 0, le = self.selectStatus.length; i < le; i++) {
                        htmlStr.push('<li data-value="' + self.selectStatus[i].code + '" data-event="click" data-handler="setText">' + self.selectStatus[i].value + '</li>');
                    }
                    self.selectBox($ele, isMouseOverPubDiv, htmlStr);
                },
                
                /**
                 * 选中筛选状态
                 * @param {[type]} e [description]
                 */
                setText: function(e) {
                    e.stopPropagation();
                    var currVal = $(this).text();
                    var currCode = $(this).attr("data-value");
                    $point.find(".pointStatus").find(".text").text(currVal);
                    $point.find(".pointStatus").find(".text").attr("data-value", currCode);
                    $(".pubdiv").attr("style", "");
                    $(".pubdiv  ul li").remove();
                    $(".pubdiv").removeClass("active");
                },
                /**
                 * 搜索
                 * @param  {[type]} e [description]
                 * @return {[type]}   [description]
                 */
                "Search": function(e) {
                    //触发读取数据
                    var enterplatform = -1;
                    if ($("li.current").text() === "进入平台数据") {
                        enterplatform = 1;
                    } else {
                        enterplatform = 0;
                    }
                    var selectText = $(".pointSelect").find(".text").attr("data-value");
                    var statusText = $(".pointStatus").find(".text").attr("data-value");
                    // var pointSiteName = $(".pointSelect").find(".pointSiteText").attr("data-code");
                    // var roadDirectionName = $(".pointSelect").find(".roadDirectionText").attr("data-code");
                    var keyText = $("#search-key").val();
                    var searchObj = {
                        "currentPage": 1,
                        "pageSize": 10,
                        "enterPlatformStatus": enterplatform,
                        "status": statusText,
                        "pointId": "",
                        "pointName": "",
                        "pointPosition": "",
                        "pointSite": "",
                    };
                    switch (selectText) {
                        case "点位编号":
                            searchObj.pointId = keyText;
                            break;
                        case "点位名称":
                            searchObj.pointName = keyText;
                            break;
                        case "点位位置":
                            searchObj.pointPosition = keyText;
                            break;
                        case "所属部位":
                            searchObj.pointSite = keyText;
                            break;
                    }
                    
                    self._pointCtr.search(searchObj);
                    e.stopPropagation();
                },
                /**
                 * 进入平台按钮事件
                 * @param  {[type]} e [description]
                 * @return {[type]}   [description]
                 */
                "EnterLibrary": function(e) {
                    var pointNumArray = {
                        "ids": []
                    };
                    var $checkbox = $(".point-library .checkbox i.icon-checked");
                    if ($checkbox.length === 0) {
                        notify.warn("请选择要进入平台的点位");
                        $(".point-library .checkbox-h i").removeClass("icon-checked").addClass("icon-nochecked");
                        return false;
                    } else {
                        $checkbox.each(function(index, item) {
                            var eachPointID = $checkbox.eq(index).attr("data-id");
                            pointNumArray.ids.push(eachPointID); 
                        });
                    }
                    pointNumArray.ids = pointNumArray.ids.join(",");
                    self._pointCtr.enterLibrary(pointNumArray);
                    e.stopPropagation();
                },
                /**
                 * 新建点位事件
                 * @param  {[type]} e [description]
                 * @return {[type]}   [description]
                 */
                "CreatePoint": function(e) {
                    //隐藏导航
                    window.top.showHideNav("hide");
                    //显示新建点位div
                    self._pointCtr.createPoint();
                    //绑定事件
                    self._bindEvents(".createPoint");
                    e.stopPropagation();
                },
                /**
                 * 取得坐标
                 * @return {[type]} [description]
                 */
                "getPosition": function() {
                    if ($(".pointmapPos").is(":hidden")) {
                        $(".pointmapPos").show(0);
                    }
                    if (global.marker) {
                        global.pointMap.removeOverlay(global.marker);
                        global.marker = null;
                    }
                    var mapTag = new MapPlatForm.Base.MapTag(global.pointMap);
                    var markerParam = {
                        url: "/module/common/images/map/map-marker.png", //图片路径 
                        size: { //[图片大小] 
                            width: 26,
                            height: 29
                        },
                        iconOffset: {
                            width: 10,
                            height: 29
                        },
                        markerType: 2 //以中心点为中心0，以底部为中心1,自定义位置2，根据iconOffset设置中心点
                    };
                    mapTag.adrawMarker(markerParam, function(marker) {

                        global.marker = marker;
                        global.confirmDialog("是否标注？",function(){
                          $(".point-control").find("input[name='latitude']").val(marker.getPosition().lat);
                          $(".point-control").find("input[name='longitude']").val(marker.getPosition().lon);
                        },function(){
                          if (global.marker) {
                              global.pointMap.removeOverlay(global.marker);
                              global.marker = null;
                          }
                          return ;
                        })
                        
                    });
                },
                /**
                 * 保存新建的点位信息
                 * @param  {[type]} e [description]
                 * @return {[type]}   [description]
                 */
                "SavePointMsg": function(e) {
                    //存储表单值
                    var enterplatform = -1,
                        id = -1,
                        params = {},
                        $creatForm = $(".formEdit");

                    if ($("li.current").text() === "进入平台数据") {
                        enterplatform = 1;
                    } else {
                        enterplatform = 0;
                    }
                    params.pointName = $creatForm.find("input[name='pointName']").val();
                    params.pointPosition = $creatForm.find("input[name='pointAddress']").val();
                    params.pointSite = $creatForm.find('.searchPointSite .text').attr("data-value");
                    params.pointLongitude = parseFloat($creatForm.find("input[name='longitude']").val());
                    params.pointLatitude = parseFloat($creatForm.find("input[name='latitude']").val());
                    params.pointHeight = parseFloat($creatForm.find("input[name='pointHeight']").val());
                    params.roadDirection = $creatForm.find('.searchRoadDirection .text').attr("data-code");
                    params.contactName = $creatForm.find("input[name='linkman']").val();
                    params.contactPhone = $creatForm.find("input[name='tel']").val();

                    var $inputEle = $creatForm.find(".importantFieldset input");

                    for(var i = 0; i < $inputEle.length; i++){
                      if($inputEle.eq(i).val() === ""){
                        $inputEle.eq(i).focus();
                        notify.warn($inputEle.eq(i).attr("placeholder"));
                        return false;
                      }
                    }

                    if(params.pointName.length > 40){
                      notify.warn("点位名称长度超出，最长为40个汉字");
                      return false;
                    }

                    var heightText = $creatForm.find(".height").val();
                    var reg = /^\-?\d{1,3}(\.\d*)?$/;   
                    if(!reg.test(heightText)){
                      notify.warn("海拔值小数点前最多三位数字 如：110, 12.34, -17");
                      return false;
                    }

                    var telText = $creatForm.find(".tel").val();
                    if( (telText !== "") && !(RegExp.isPhone(telText))){
                      notify.warn("联系电话格式错误");
                      return false;
                    }

                    if ($(".editPoint").find(".pointDialog").length === 1) {
                        id = parseInt(self.editId);
                    }
                    self._pointCtr.savePointMsg(params, id, enterplatform);
                },
                /**
                 * 关闭map
                 * @return {[type]} [description]
                 */
                "closeMapPanel": function() {
                    if ($(".pointmapPos").is(":visible")) {
                        $(".pointmapPos").fadeOut(500);
                    }
                },
                /**
                 * 取消新建点位的div
                 * @param  {[type]} e [description]
                 * @return {[type]}   [description]
                 */
                "CancleCreate": function(e) {
                    //显示导航
                    window.top.showHideNav("show");
                    $(".pointDialog").remove();
                    if ($(".pointmapPos").is(":visible")) {
                        $(".pointmapPos").hide(0);
                    }
                    $(".commonLayer").css("display", "none");
                    $(".pubdiv").attr("style", "");
                    $(".pubdiv ul li").remove();
                    e.stopPropagation();
                },
                /**
                 * 选择所属部位
                 * @param  {[type]} e [description]
                 * @return {[type]}   [description]
                 */
                "SearchPointSite": function(e) {
                    var isMouseOverPubDiv = $(".pubdiv").hasClass("active");
                    e.stopPropagation();
                    var htmlStr = [],
                        $ele = $(this);

                    for (var i = 0, le = global.pointPubTypeList.pointSite.length; i < le; i++) {
                        htmlStr.push('<li data-event="click" data-handler="setPointSite">' + global.pointPubTypeList.pointSite[i].value + "</li>");
                    }
                    self.selectBox($ele, isMouseOverPubDiv, htmlStr);
                },
                /**
                 * 选择路段走向
                 * @param  {[type]} e [description]
                 * @return {[type]}   [description]
                 */
                "SearchRoadDirection": function(e) {
                  var isMouseOverPubDiv = $(".pubdiv").hasClass("active");
                    e.stopPropagation();
                    var htmlStr = [],
                        $ele = $(this);

                    for (var i = 0, le = global.pointPubTypeList.roadDirection.length; i < le; i++) {
                        htmlStr.push('<li data-code="' + global.pointPubTypeList.roadDirection[i].code + '" data-event="click" data-handler="setRoadDirection">' + global.pointPubTypeList.roadDirection[i].value + "</li>");
                    }
                    self.selectBox($ele, isMouseOverPubDiv, htmlStr);
                },
                /**
                 * 得到选中的所属位置
                 * @param {[type]} e [description]
                 */
                setPointSite: function(e) {
                    e.stopPropagation();
                    var currVal = $(this).text();
                    if($(".pointDialog").length === 1){
                      $(".searchPointSite").find(".text").text(currVal);
                      $(".searchPointSite").find(".text").attr("data-value", currVal);
                    }else{
                      $("#search-key").val(currVal);
                    }
                    
                    $(".pubdiv").attr("style", "");
                    $(".pubdiv ul li").remove();
                    $(".pubdiv").removeClass("active");
                },
                /**
                 * 得到选中的路段走向
                 * @param {[type]} e [description]
                 */
                setRoadDirection: function(e) {
                    e.stopPropagation();
                    var currVal = $(this).text();
                    var currCode = $(this).attr("data-code");

                    if($(".pointDialog").length === 1){
                      $(".searchRoadDirection").find(".text").text(currVal);
                      $(".searchRoadDirection").find(".text").attr("data-code", currCode);
                    }else{
                      $(".roadDirectionText").text(currVal);
                      $(".roadDirectionText").attr("data-code", currCode);
                    }
                   
                    $(".pubdiv").attr("style", "");
                    $(".pubdiv ul li").remove();
                    $(".pubdiv").removeClass("active");
                },
                /**
                 * 批量导入div
                 * @param  {[type]} e [description]
                 * @return {[type]}   [description]
                 */
                "ImportPoint": function(e) {
                    //隐藏导航
                    window.top.showHideNav("hide");
                    //触发读取数据
                    global.setBatchUplaodPanel.BatchUplaod({
                        "type": "point",
                        "ExcelTemp": "/module/maintenance/registrationManage/inc/注册管理点位导入模板.xls",
                        "url": "/service/regist/point/importFile",
                        "callback": function() {
                            var commonDialog = new CommonDialog({
                                title: '导入点位数据中,请等待！'
                            });
                            setTimeout(function() {
                                commonDialog.hide();
                                $(".point-control .judge-enter-library").find("li[data-handler='LoadNoEnterList']").trigger('click');
                            }, 1000);
                        }
                    });

                    e.stopPropagation();
                    e.preventDefault();
                },
                /**
                 * 单选
                 * @param  {[type]} e [description]
                 * @return {[type]}   [description]
                 */
                "CheckSingle": function(e) {
                    var classText = $(this).attr("class");
                    var $checkAll = $(".point-library .checkbox-h i");
                    if (classText === "icon-nochecked") {
                        $(this).removeClass("icon-nochecked").addClass("icon-checked");
                    } else {
                        $(this).removeClass("icon-checked").addClass("icon-nochecked");
                    }
                    $checkAll.removeClass("icon-checked").addClass("icon-nochecked");
                },
                /**
                 * 全选
                 * @param  {[type]} e [description]
                 * @return {[type]}   [description]
                 */
                "CheckAll": function(e) {
                    e.stopPropagation();
                    var $checkAll = $(".point-library .checkbox-h i");
                    var $checkbox = $(".point-library .checkbox i");
                    var nocheckEleNum = $(".point-library .checkbox .icon-nochecked").length;
                    var checkedEleNum = $(".point-library .checkbox .icon-checked").length;
                    var checkAllstatus = $checkAll.attr("class");
                    if (checkAllstatus === "icon-nochecked") {
                        $(".icon-nochecked").addClass("icon-checked");
                        $(".icon-nochecked").removeClass("icon-nochecked");
                    } else {
                        $(".icon-checked").addClass("icon-nochecked");
                        $(".icon-checked").removeClass("icon-checked");
                    }
                    $(".point-library tr[class='logout']").find(".icon-checked").removeClass("icon-checked").addClass("icon-nochecked");
                },
                "Question":function(e){
                    $(".question-answer").toggle();
                },
                /**
                 * 编辑点位
                 * @param  {[type]} e [description]
                 * @return {[type]}   [description]
                 */
                "EditTask": function(e) {
                    //隐藏导航
                    window.top.showHideNav("hide");
                    self.editId = $(this).attr("data-id");
                    var data = {};
                    var $tr = $(this).parent().parent();
                    data.pointNum = $tr.find(".pointNum").text();
                    data.pointName = $tr.find(".pointName").text();
                    data.pointPosition = $tr.find(".pointAddress").text();
                    data.pointSiteCode = $tr.find(".department").attr("data-code");
                    data.pointSite = $tr.find(".department").text();
                    data.pointLongitude = $tr.find(".longitude").text();
                    data.pointLatitude = $tr.find(".latitude").text();
                    data.pointHeight = $tr.find(".pointHeight").text();
                    data.roadDirectionCode = $tr.find(".roadTowards").attr("data-code");
                    data.roadDirection = $tr.find(".roadTowards").text();
                    data.contactName = $tr.find(".linkman").text();
                    data.contactPhone = $tr.find(".tel").text();
                    data.managerUnitName = $tr.find(".companyName").text();

                    if(data.pointSiteCode === ""){
                      data.pointSite = "请选择所属部位";
                    }
                    if(data.roadDirectionCode === ""){
                      data.roadDirection = "请选择路段走向";
                    }

                    self._pointCtr.editTask(data);
                },
                /**
                 * 取消编辑点位的div
                 * @param  {[type]} e [description]
                 * @return {[type]}   [description]
                 */
                "CancleEdit": function(e) {
                    e.stopPropagation();
                    //显示导航
                    window.top.showHideNav("show");
                    $(".pointDialog").remove();
                    $(".commonLayer").css("display", "none");
                    $(".pubdiv").attr("style", "");
                    $(".pubdiv ul li").remove();
                },
                /**
                 * 注销点位
                 * @param  {[type]} e [description]
                 * @return {[type]}   [description]
                 */
                "LogoutTask": function(e) {
                    e.stopPropagation();
                    //隐藏导航
                    window.top.showHideNav("hide");
                    var $current = $(this);
                    global.setLgoutPanel.setLogout({
                        "systemName": "点位",
                        "type": "point",
                        "id": $(this).attr("data-id"),
                        callback: function(reason, id) {
                            data = {};
                            data.cancelReason = reason;
                            data.id = id;
                            self._pointCtr.logoutTask(data, $current);
                            $(".cancleDialog").trigger("click");
                        }
                    });
                },
                /**
                 * 显示点位下的摄像机详情
                 * @param {[type]} obj [description]
                 */
                ShowDetailTb: function(obj) {
                    var enterplatform = -1;

                    if ($("li.current").text() === "进入平台数据") {
                        enterplatform = 1;
                    } else {
                        enterplatform = 0;
                    }
                    var $id = $(this).parent().parent().find(".pointNum").text().toString();
                    var $current = $(this).parent().parent();

                    if (!$current.next().is($(".showdetails-table"))) {
                        $(".showdetails-table").prev("tr").removeClass("want-show-details").end().remove();
                        self._pointCtr.creatDetailTable($current, $id,enterplatform);
                        $current.addClass("want-show-details");

                        if ($(".showdetails-table").length) {
                            $($(".point-library").find("td").not(".opera-btn")).hover(function() {
                                isMouseOvershowdetails = true;
                            }, function() {
                                isMouseOvershowdetails = false;
                            });
                        }
                    } else {
                        $(".showdetails-table").prev("tr").removeClass("want-show-details").end().remove();
                    }
                },
                /**
                 * [SeeCameraDetail 查看摄像机详情]
                 * @param {[type]} e [description]
                 */
                SeeCameraDetail:function(e){
                  var id = $(this).data("id");
                  cameraCtr.showCameraInfoById(id);
                }
            };
        },

         /**
          * 绑定事件
          * @param selector - 选择器，为适应动态绑定
          * @private
          */
        _bindEvents: function(selector) {
            var self = this,
                handler = self._eventHandler();

            $(selector).find("[data-handler]").map(function() {
                $(this).off($(this).data("event")).on($(this).data("event"), handler[$(this).data("handler")]);
            });
            //当有下拉框存在点击dom隐藏
            if ($(".pubdiv").is(":visible")) {
                $(document).on("click", function(e) {
                    e.stopPropagation();
                    $(".pubdiv").hide(0).removeClass("active");
                });
            }
        },
        /**
         *公用渲染下拉框
         * @param  {[type]} judge   [判断是否显示下拉框]
         * @param  {[type]} htmlStr   [下拉框的数据htmlStr]
         * @param  {[type]}         [description]
         * @return {[type]}         [description]
         */
        selectBox: function($ele,judge, htmlStr) {
            var self = this;
           
            if (!judge) {
                var position = {
                        left: $ele.offset().left,
                        top: $ele.offset().top,
                        clientW: $ele[0].clientWidth
                    };
                $(".pubdiv ul").html(htmlStr.join(""));
                $(".pubdiv").css({
                    "left": position.left + "px",
                    "top": position.top + 28 + "px",
                    "width": position.clientW + "px"
                }).show().addClass("active");
                self._bindEvents($(".pubdiv"));
            } else {
                $(".pubdiv").attr("style", "").removeClass('active');
                $(".pubdiv ul li").remove();
            }
        },
        /**
         * [renderList 渲染列表]
         * @param  {[type]} data [后台响应的数据]
         * @param  {[type]} flag [是否进入平台]
         * @return {[type]}      [description]
         */
        renderList: function(data, flag) {
            var self = this,
                listData = flag ? {
                    "data": data,
                    "enterplatform": true
                } : {
                    "data": data,
                    "noEnterplatform": true
                };
            //移除原有的列表
            $(".point-library").find("tr").not(".table-header").remove();
            //渲染新数据
            $(".point-library").find(".table-header").after(global.pointCompiler(listData));
            //给table绑定事件
            self._bindEvents($(".point-control"));
            self.logoutStyle();
            permission.show();
        },
        /**
         * [renderDetailTable 渲染点位下的摄像机table]
         * @param  {[type]} data [后台响应的数据]
         * @return {[type]}      [description]
         */
        renderDetailTable: function(data) {
             var self = this;
             //渲染
             $(".showdetails-tb tr:first-child").after(global.pointCompiler({
                 "data": data,
                 "showdetails-tr": true
             }));
             //判断设置显示点位下摄像机详情的td的colspan值
             var judge = $(".judge-enter-library").find(".current").text() === "进入平台数据";
             var colspanNum = $(".showdetails-table .trtotd");
             if (judge) {
                 colspanNum.attr("colspan", "13");
             } else {
                 colspanNum.attr("colspan", "14");
             }
             self._bindEvents(".showdetails-table");
        },
        /**
         * [logoutPointStyle 注销后的样式]
         * @param  {[type]} ele [注销按钮]
         * @return {[type]}     [description]
         */
        logoutPointStyle: function(ele) {
            ele.parent().prev().html("注销"); //传后台
            ele.parent().parent().addClass("logout").find("i").off();
        },
        /**
         * [logoutStyle 渲染列表时如果点位注销]
         * @return {[type]} [description]
         */
        logoutStyle: function() {
            var pointStatus = $(".point-library .pointState");
            for (var i = 0; i < pointStatus.length; i++) {
                if (pointStatus.eq(i).text() === "注销") {
                    pointStatus.eq(i).parent().addClass("logout").find("i").off();
                }
            }
        },
        /**
         * [changeSelect 将实时查询的数据渲染到搜索框下面的下拉框中]
         * @param  {[type]} data [description]
         * @return {[type]}      [description]
         */
        changeSelect:function(data){
         
          var self = this;
          var isMouseOverPubDiv = $(".pubdiv").hasClass("active");
          var htmlStr = [],
          $ele = $(".left-search-panel").find("input");

          for (var i = 0, le = data.length; i < le; i++) {
              htmlStr.push('<li  data-event="click" data-handler="setPointSite">' + data[i] + "</li>");
          }
          self.selectBox($ele, isMouseOverPubDiv, htmlStr);
        }
    };
    return new PointView();
 });
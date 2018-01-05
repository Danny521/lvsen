/**
* 入网检测
**/
define(["require","jquery.validate","player","/module/common/ptz/ptz.js","jquery-ui","jquery-ui-timepicker-addon","jquery.pagination"],function(require,CameraTree){
    LoopInspect = {
        isGoing: false
    };

    var Detection = new Class({

        Implements: [Events, Options],

        options: {
            template: null
        },
        //播放器
        player: null,
        // 历史调月面的播放器
        player1:null,

        //云台控制摄像机
        ControlCamera: null,
        // 提交数据后台返回id，用于请求数据渲染表
        currentInfoId:null,

        // 储存的当前选择的摄像机的信息
        curCameraInfo:null,

        ManufactoryBool:false,
        VersionBool:false,

        // 最后用于提交的全局信息
        checkInfo:{
            "deviceType": "", //1NVR-网络录像机；2表示IPC-网络摄像机；3表示解码器
            "deviceName": "",
            "deviceIp":"", // 设备IP
            "deviceId":"",
            "manufacturerName": "" ,
            "cameraVersionName": "" ,
            "hardVersion": "" ,
            "softVersion": "",
            "os":"" ,
            "sdCodeRate":"",//标清
            "hdCodeRate":"",//高清码率
            "acceptProtocol":"" ,
            "encodeStd": false,//编码标准
            "dualStream": "",  //是否支持多码流
            "mainDpi": "",  //主码分辨率
            "subDpi": "", //子码分辨率
            "autoSync": "" , //时钟同步功能
            "autoUpdate": "", //远程自动升级功能
            "registerSuccess": "",//国标注册是否成功
            "videoSearchNormal": false, //录像检索正常
            "recordPlayNormal": false, //录像播放正常
            "recordDownNormal": false, //录像下载正常
            "hdDecodeNormal":"", //高清解码成功
            "sdDecodeNormal": "", //标清解码成功
            "keyboardCtrlNormal": "", //键盘控制成功
            "summary": "", //总结信息,
            "sdRateResolution":"",
            "hdRateResolution":"",
            "conclusion": true,//结论通过不通过 1通过 0：不通过
            "flag": "inpage"
        },
        step42CameraId:null,
        //当前选中设备类型及设备信息
        device: {
            type: "",//1表示NVR-网络录像机；2表示IPC-网络摄像机；3表示解码器
            info: "" //设备信息
        },
        pvgInfo:null,
        curselctDeviceName:null,
        //当前批次待检测设备列表信息
        curCheckDeviceInfo:{
            data: null,
            alreadyLoaded: false	//是否已经加载，如果已经加载了，则不再重复请求
        },
        //码率刷新定时器
        cameraInterval: null,
        //记录实时码率信息，用来计算平均码率和范围
        videoRateInfo:{
            sdArr:[],
            rateArr: [],
            count: 0,
            sdCount:0
        },
        //录像下载句柄相关信息存储
        downRecordHandle: null,
        watermark: "",//水印
        initialize: function(options){
            this.setOptions(options);
            //绑定事件
            this.bindEvents();
            //注册助手
            this.registerHelper();

            this.loadManufacturer();

            this.getWatermark();
        },
        /**
        * 注册助手
        **/
        registerHelper: function(){
            Handlebars.registerHelper("even", function(value) {
                if (value % 2 === 0) {
                    return "class=even";
                }
            });
            Handlebars.registerHelper("list", function(value) {
                return value + 1;
            });


            Handlebars.registerHelper("time2name", function(str) {
                var str1= String(str);
                var beginTime = str1.split(",")[0];
                var endTime = str1.split(",")[1];
                var vodType = str1.split(",")[2];
                if(beginTime < Toolkit.str2mills(Toolkit.getCurDate()+" 00:00:00")){
                    beginTime = Toolkit.str2mills(Toolkit.getCurDate()+" 00:00:00");
                }
                return Toolkit.mills2datetime(parseInt(beginTime))+"-"+Toolkit.mills2datetime(parseInt(endTime));
            });
            //设备类型名称转换
            Handlebars.registerHelper("DeviceType", function(type){
                if(type === 1){
                    return  "NVR--网络录像机";
                }else if(type === 2){
                    return  "IPC--网络摄像机";
                }else if(type === 3){
                    return "解码器";
                }
            });
            //是否
            Handlebars.registerHelper("IsOrNo", function(status){
                if(status){
                    return "是";
                }else if(status === null || status === ""){
                    return "--";
                }else{
                    return "否";
                }
            });
            //是否具备
            Handlebars.registerHelper("IsOrNoHave", function(status){
                if(status){
                    return "具备";
                }else if(status === null || status === ""){
                    return "--";
                }else{
                    return "不具备";
                }
            });
            //是否正常
            Handlebars.registerHelper("IsOrNoNormal", function(status){
                if(status){
                    return "正常";
                }else if(status === null || status === "" ){
                    return "--";
                }else{
                    return "异常";
                }
            });
            Handlebars.registerHelper("RegisterStatus", function(status){
                if(status){
                    return "注册成功";
                }else if(status === null || status === ""){
                    return "--";
                }else{
                    return "注册失败";
                }
            });
            Handlebars.registerHelper("codename",function(str,str1){
                if(str1){
                    return  str+"("+str1+")";
                }else{
                    return  str;
                }
            });


            Handlebars.registerHelper("empty",function(str){
                if(str){
                    return str;
                }else{
                    return "--";
                }
            });
        },
        /**
        * 设置检测内容
        **/
        setContent: function(){
            var content = this.options.template({
                dectect: true
            });
            jQuery(".content-container")[0].innerHTML = content;
        },
        /**
        * 绑定事件
        **/
        bindEvents: function(){
            var self = this;
            // 判断控制备注字数
            jQuery(document).on("change keyup","#step-2 .comment ,#step-2-2 .comment",function(){
                if(jQuery(this).val().length<80){
                    jQuery(this).removeClass("error");
                    jQuery(this).css({"border":"1px solid #A9A9A9"});
                }else{
                    if(!jQuery(this).is(".error")){
                        notify.warn("备注信息最多输入80个字符！");
                        jQuery(this).addClass("error");
                        jQuery(this).css({"border":"2px solid red"});
                    }
                    return false;
                }
            });

            //点击开始检测
            jQuery(document).on("click", ".content-container .but-step button", function(){
                var to = $(this).attr("to");//step-*
                if(!to){
                    return;
                }
                //判断是否可以进入下一步或者提示是否进入下一步
                var isToNext = self.isToNextStep(this);
                if(!isToNext){
                    return;
                }

                //当设备类型为解码器时
                if(self.device.type === 3 && to === "step-2")
                {
                    jQuery("#step-2,#step-2-2").hide();
                    $("#step-num-1").addClass("step-back");
                    to = "step-2-3";
                }
                if(self.device.type === 3 && to === "step-2-2")
                {
                    to = "step-2-3";
                }
                if(to ==="step-2-2"){
                    if(jQuery("#step-2 .comment").val().length>80){
                        notify.warn("备注信息最多输入80个字符！");
                        jQuery("#step-2 .comment").css({"border":"2px solid red"});
                        return false;
                    }
                }

                if(to ==="step-2-4"){
                    if(jQuery("#step-2-2 .comment").val().length > 80){
                        notify.warn("备注信息最多输入80个字符！");
                        jQuery("#step-2-2 .comment").css({"border":"2px solid red"});
                        return false;
                    }
                }
                //如果完成
                if(to === "step-3"){
                    $("#step-num-3").addClass("step-now");
                    $("#step-num-2").removeClass("step-now").addClass("step-back");
                    //显示检测报告、隐藏上一步内容
                    jQuery("#step-3").show();
                    jQuery("#step-2-4").hide();
                    //收集检测结果
                    self.getCheckResult();

                    // 根据不同的设备分别渲染模板
                    //1表示NVR-网络录像机；2表示IPC-网络摄像机；3表示解码器
                    if(self.device.type === 1){
                        jQuery("#step-3 .detect-report").empty().html(self.options.template({
                            detectreportNVR: self.checkInfo
                        }));
                        if(self.checkInfo.acceptProtocol!=="siphost"||self.checkInfo.videoPlayNormal ===false ||self.checkInfo.videoPlayNormal===null||self.checkInfo.hdRateResolution ==="0X0"||self.checkInfo.videoSearchNormal===false||self.checkInfo.recordPlayNormal===false||self.checkInfo.recordDownNormal===false){
                            jQuery("#sult td").html("");
                            jQuery("#sult td").html("<span>未通过</span>");
                            self.checkInfo.conclusion  = false;
                        }else{
                            jQuery("#sult td").html("");
                            jQuery("#sult td").html("<span>通过</span>");
                            self.checkInfo.conclusion  = true;
                        }
                        return ;
                    }else if(self.device.type ===2){

                        jQuery("#step-3 .detect-report").empty().html(self.options.template({
                            detectreportIPC: self.checkInfo
                        }));
                        if(self.checkInfo.acceptProtocol!=="siphost"||self.checkInfo.videoPlayNormal ===false ||self.checkInfo.videoPlayNormal===null||self.checkInfo.hdRateResolution ==="0X0"||self.checkInfo.sdRateResolution==="0X0"||self.checkInfo.sdRateResolution===""||self.checkInfo.videoSearchNormal===false||self.checkInfo.recordPlayNormal===false||self.checkInfo.recordDownNormal===false){
                            jQuery("#sult td").html("");
                            jQuery("#sult td").html("<span>未通过</span>");
                            self.checkInfo.conclusion  = false;
                        }else{
                            jQuery("#sult td").html("");
                            jQuery("#sult td").html("<span>通过</span>");
                            self.checkInfo.conclusion  = true;
                        }
                        return ;

                    }else if(self.device.type ===3){
                        jQuery("#step-3 .detect-report").empty().html(self.options.template({
                            detectreportDecoder: self.checkInfo
                        }));
                        if(self.checkInfo.acceptProtocol!=="siphost"){
                            jQuery("#sult td").html("");
                            jQuery("#sult td").html("<span>未通过</span>");
                            self.checkInfo.conclusion  = false;
                        }else{
                            jQuery("#sult td").html("");
                            jQuery("#sult td").html("<span>通过</span>");
                            self.checkInfo.conclusion  = true;
                        }
                        return ;

                    }

                }


                var now = $(this).parents(".netdetection-content").attr("id");//step-*
                //样式变化
                if(to === "step-2"){
                    $("#step-num-2").addClass("step-back");
                    if(jQuery("#step-1 #Manufactory .x-selector").is(".none")){
                        //在用户输入的情况下保存厂商信息
                        self.checkInfo.manufacturerName = jQuery("#step-1 .factory").val();
                        if(self.ManufactoryBool){
                            self.savemanufacturer(self.checkInfo.manufacturerName);
                        }
                    }
                    if(jQuery("#step-1 #ModelNumber .x-selector").is(".none")){
                        //在用户输入的情况下保存型号信息
                        self.checkInfo.cameraVersionName =  jQuery("#step-1 .model").val();
                        if(self.VersionBool){
                            self.saveVersion(self.checkInfo.cameraVersionName);
                        }
                    }
                }
                if(to === "step-1" && now === "step-2"){
                    $("#step-num-2").removeClass("step-now").addClass("step-back");

                }
                //var to-num = $(this).attr("to-num");
                $("#"+now).toggle();
                $("#"+to).toggle();

                var num = to.split("-")[1];
                $("#step-num-"+num).removeClass("step-back").addClass("step-now");
                $("#step-num-"+(parseInt(num)-1)).addClass("step-back");
                $("#step-num-"+(parseInt(num)+1)).removeClass("step-now");
            });

            // 绑定选择设备
            jQuery(document).on("click",".select-device",function() {
                var deviceType = self.device.type;
                var This = jQuery(this),
                    Next = This.next();
                //如果有设备类型。获取该类型的设备
                if(deviceType){
                    if (Next.is(":visible")) {
                        Next.slideUp();
                    } else {
                        //隐藏其他的iframe和下拉内容
                        jQuery(".x-selector-iframe,.x-selector-ul").css({"display": "none"});
                        Next.slideDown();
                        //读取设备数据信息
                        // self.getAndShowDeviceList();
                    }
                }else{
                    notify.warn("请先选择设备类型！");
                }
            });
            // 点击当前选中的设备填充到输入框中,影藏下拉框
            jQuery(document).on("click","#deviceTable tr:gt(0)",function(){
                var str = jQuery(this).find("td:eq(1)").html()+ " (" + jQuery(this).find("td:eq(2)").html()+")";
                jQuery("#deviceTable tr").removeClass("active");
                jQuery(this).addClass("active");
                jQuery("#deviceName").val(str);
                jQuery(".select-device-container").slideUp();
                var data = jQuery(this).data();
                //设置当前选中的摄像机信息
                var type=jQuery(this).attr("data-type");
                self.checkInfo.deviceId = jQuery(this).attr("data-id");
                self.checkInfo.deviceName = jQuery(this).find("td:eq(1)").html();
                self.checkInfo.deviceIp = jQuery(this).find("td:eq(2)").html();
                // 记录当前所选设备的name,方便后面查找摄像机
                self.curselctDeviceName =  jQuery(this).attr("data-name");

                // 填充接入协议
                if(type === "siphost"){
                    jQuery("#step-1 .acceptprotocol").val("国标28181协议");
                } else if(type === "onvifhost"){
                    jQuery("#step-1 .acceptprotocol").val("ONVIF协议");
                } else {
                    jQuery("#step-1 .acceptprotocol").val("私有协议（" + type.replace("host", "") + "）");
                }

            });

            // 点击搜索按钮重新渲染表格
            jQuery("#searchInput").bind("keypress", function(event) {
                if (event.keyCode === 13) {
                    jQuery("#searchBtn").click();
                    return false;
                }
            });



            jQuery(document).on("click","#searchBtn",function(){
                var name = jQuery("#searchInput").val().trim();
                //获取设备类型
                var type =jQuery("#DeviceType .x-selector-text").html();  //这个是获取要设备类型
                if(type ==="摄像机"){

                    self.loadCameraList(name);
                }else if(type==="视频设备"){
                    self.loadDeviceList(name);
                }
            });

            // 当输入os acceptprotocol后禁止回车键跳转
            jQuery(document).on("keypress","#step-2 input.os,#step-2 input.acceptprotocol",function(event){
                if (event.keyCode === 13) {
                    return false;
                }
            });

            //状态按钮
            jQuery(document).on("click", ".content-container .regest-state button.gb-regest,.content-container .regest-state button.decode,.content-container .regest-state button.key-control", function(){
                var num = $(this).index(".regest-state button");
                if(num % 2 == 0)
                {
                    $(this).addClass("success").siblings("em").show();
                    $(this).closest(".regest-state").find(".second button").removeClass("fail").siblings("em").hide();
                    if(self.device.type === 3 && jQuery(this).hasClass("decode")){
                        jQuery("#step-2-3 .but-step .radios:eq(0) .no-radio").removeClass("no-radio").addClass("radio");
                        jQuery("#step-2-3 .text-right .no-definition").hide();
                    }
                }
                else if(num % 2 == 1)
                {
                    $(this).closest(".regest-state").find(".first button").removeClass("success").siblings("em").hide();
                    $(this).addClass("fail").siblings("em").show();
                    if(self.device.type === 3 && jQuery(this).hasClass("decode")){
                        jQuery("#step-2-3 .but-step .radios .radio").removeClass("radio").addClass("no-radio");
                        jQuery("#step-2-3 .text-right .no-definition").show();
                    }
                }
            });

            // 判断开始时间不能晚于当前时间
            jQuery("#step-2-2  .begin-time").blur(function() {
                if (jQuery(this).val()) {
                    jQuery(this).removeClass("error");
                    if (Toolkit.formatDate(new Date()) < jQuery(this).val()) {
                        jQuery(this).addClass("error");
                        notify.warn("开始时间不能晚于当前时间！");
                    }
                }
            });

            // 点击历史检阅和下载页面的搜索按钮获取视频列表
            jQuery(document).on("click","#search",function(){
                var beginTime = jQuery("#step-2-2 .begin-time").val();
                var endTime = jQuery("#step-2-2 .end-time").val();
                if(self.curCameraInfo===null){
                    notify.warn('请选择一个要查询的摄像机！');
                    return false;
                }
                var avObj =null;
                if(self.curCameraInfo.hd){
                    avObj = self.curCameraInfo.hd.name;
                }else if(self.curCameraInfo.sd){
                    avObj = self.curCameraInfo.sd.name;
                }
                if (jQuery("#step-2-2 .begin-time").val()) {
                    if (Toolkit.formatDate(new Date()) < jQuery("#step-4-2 .begin-time").val()) {
                        notify.warn("起始时间输入错误，请重新输入！");
                        return false;
                    }
                }

                if(jQuery("#step-2-2 .end-time").val()){
                    if(Toolkit.str2mills(jQuery("#step-2-2 .end-time").val())<Toolkit.str2mills(Toolkit.getCurDate()+" 00:00:00")){
                        notify.warn("只能查找当天录像片段,结束时间不能早于当天时间！");
                        return false;
                    }
                }
                    // 判断结束时间要晚于开始时间
                if (jQuery("#step-2-2 .end-time").val() && jQuery("#step-2-2 .begin-time").val()) {
                    if(Toolkit.str2mills(jQuery("#step-2-2 .end-time").val())<Toolkit.str2mills(Toolkit.getCurDate()+" 00:00:00")){
                        notify.warn("只能查找当天录像片段,结束时间不能早于当天时间！");
                        return false;
                    }
                    if (jQuery("#step-2-2 .begin-time").val() > jQuery("#step-2-2 .end-time").val()) {
                        notify.warn("结束时间不能早于起始时间！");
                        return false;
                    }
                }
                // 判断摄像机是否存在，不存在提示
                jQuery(".video-list-1").html("");
                self.getVideoList(avObj,beginTime,endTime);
            });


            // 点击下载录像
            jQuery(document).on("click","#step-2-2 .download .down", function(){
                if(!jQuery(this).hasClass("cancel")){
                    var dom = jQuery("#step-2-2 .video-list-1 li.active");
                    var time = dom.attr("data-viodetime");
                    var beginTime = time.split(",")[0];
                    var endTime = time.split(",")[1];
                    var vodType = time.split(",")[2];
                    if(beginTime < Toolkit.str2mills(Toolkit.getCurDate()+" 00:00:00")){
                        beginTime = Toolkit.str2mills(Toolkit.getCurDate()+" 00:00:00");
                    }

                     var result = self.player1.downLoadRecd(JSON.stringify({
                        ip: dom.attr("data-ip"),
                        port: parseInt(dom.attr("data-port")),
                        user: dom.attr("data-username"),
                        passwd: dom.attr("data-password"),
                        path: dom.attr("data-path"),
                        type: 2,//播放类型
                        vodType: parseInt(vodType),//录像深度
                        beginTime: Toolkit.mills2datetime(parseInt(beginTime))+".000",
                        endTime:Toolkit.mills2datetime(parseInt(endTime))+".000"
                    }), '',function(x){
                        // 显示进度条
                        if(x===0){
                            jQuery(".downbefore").show();
                            jQuery("#step-2-2 .download .down").addClass("cancel");
                            jQuery("#step-2-2 .download .down").text("取消");
                        }else if(x===20){
                            jQuery(".downbefore .process").css({"width":"60px"});
                        }else if(x===40){
                            jQuery(".downbefore .process").css({"width":"120px"});
                            jQuery(".downbefore .process").html("下载中...");
                        }else if(x===60){
                            jQuery(".downbefore .process").css({"width":"180px"});
                        }else if(x === 80){
                            jQuery(".downbefore .process").css({"width":"240px"});
                        }else if(x===100){
                            jQuery(".downbefore .process").css({"width":"300px"});
                            jQuery(".downbefore").hide();
                            jQuery(".downbefore .process").html("");
                            jQuery(".downbefore .process").css({"width":"30px"})
                            jQuery(".checkboxs[data-type='video-download']").find("i").removeClass("check-box").addClass("check-box-now");
                            self.checkInfo.recordDownNormal = true;
                            jQuery("#step-2-2 .download .down").removeClass("cancel");
                            jQuery("#step-2-2 .download .down").text("下载");
                        }
                    });

                        self.downRecordHandle = result;

                } else {
                    //取消下载
                    var cancelResult = self.player1.stopDownLoadRecd(self.downRecordHandle);
                    jQuery("#step-2-2 .download .down").removeClass("cancel");
                    jQuery("#step-2-2 .download .down").text("下载");
                }
            });

            // 点击暂停播放录像片段
            jQuery(document).on("click","#step-2-2 .download .play",function(){
                if(jQuery(this).is(".suspend")){
                    jQuery(this).removeClass("suspend");
                    self.player1.togglePlay(0);
                    return false;
                }
                jQuery(this).addClass("suspend");
                self.player1.pause(0);
            });
            // 点击录像时间段播放视频
            jQuery(document).on("click","#step-2-2 .video-list-1 li",function(){
                jQuery("#step-4-2 .show-video-info").show();
                jQuery(this).closest("ul").find("li").removeClass("active");
                jQuery(this).addClass("active");
                var time = jQuery(this).attr("data-viodetime");
                var beginTime = time.split(",")[0];
                var endTime = time.split(",")[1];
                var vodType = time.split(",")[2];
                if(beginTime < Toolkit.str2mills(Toolkit.getCurDate()+" 00:00:00")){
                    beginTime = Toolkit.str2mills(Toolkit.getCurDate()+" 00:00:00");
                }
                // TODO
                // 历史片段在播放器中播放
                var result = self.player1.playInHistory({
                    ip: jQuery(this).attr("data-ip"),
                    port: parseInt(jQuery(this).attr("data-port")),
                    user: jQuery(this).attr("data-username"),
                    passwd: jQuery(this).attr("data-password"),
                    path: jQuery(this).attr("data-path"),
                    type: 2,//播放类型
                    vodType: parseInt(vodType),//录像深度
                    beginTime: Toolkit.mills2datetime(parseInt(beginTime))+".000",
                    endTime:Toolkit.mills2datetime(parseInt(endTime))+".000",
                    displayMode: 0 //设置摄像机的播放模式（0为普通模式，1为布防模式）,at 2014-6-17
                },0);
                //根据录像播放状态完成部分参数
                if(result !== 0){
                    self.player1.setStyle(1);
                } else {
                    //如果已经播放成功，则自动勾选”录像播放正常选项“
                    jQuery(".checkboxs[data-type='video-history']").find("i").removeClass("check-box").addClass("check-box-now");
                    self.checkInfo.recordPlayNormal = true;
                }
                if(jQuery("#step-2-2 .play").is(".suspend")){
                    jQuery("#step-2-2 .play").removeClass("suspend");
                }
                //更新码率、分辨率、帧率信息
                self.initVideoRate(self.player1, "step-2-2");
            });

            //点击其他,下拉框变输入框
            jQuery(document).on("click",".input-table .other",function(){
                var selectBox = jQuery(this).parents("tr").find(".select");
                if(jQuery(this).html() == "取消"){
                    selectBox.find(".x-selector").show();
                    selectBox.find(".input-other").hide();
                    selectBox.find(".x-selector").removeClass("none");
                    jQuery(this).html("其他");
                }else{
                    selectBox.find(".x-selector").addClass("none");
                    selectBox.find(".x-selector").hide();
                    selectBox.find(".input-other").show();
                    jQuery(this).html("取消");
                }
            });

            // 当输入厂商时，和已经存在的数值做一个对比
            jQuery(document).on("blur",".factory",function(){
                var str = jQuery(this).val();
                jQuery.ajax({
                    url: "/service/config/get_manufacturer",
                    type: "get",
                    dataType: "json",
                    data: {name:str},
                    success:function(tem){
                        if(tem.data.manufacturer===null){
                            self.ManufactoryBool = true;
                        }
                    }
                });
            });


            // 当输入型号时，和已经存在的数值做一个对比
            jQuery(document).on("blur",".model",function(){
                var str = jQuery(this).val();
                jQuery.ajax({
                    url: "/service/config/get_version_video",
                    type: "get",
                    dataType: "json",
                    data: {
                        name:str
                    },
                    success:function(tem){
                        if(tem.data.version===null){
                            self.VersionBool = true;
                        }
                    }
                });

            });

            // 点击导出检测数据
            jQuery(document).on("click", "#step-3 .report-out", function() {
                window.open("/service/accesscheck/export/" + self.currentInfoId);
                if (self.device.type === 1) {
                    logDict.insertMedialog("m2", "导出" + self.checkInfo.deviceName + "NVR设备的入网检测报告", "f5");
                } else if (self.device.type === 2) {
                    logDict.insertMedialog("m2", "导出" + self.checkInfo.deviceName + "IPC设备的入网检测报告", "f5");
                } else if (self.device.type === 3) {
                    logDict.insertMedialog("m2", "导出" + self.checkInfo.deviceName + "解码器设备的入网检测报告", "f5");
                }
            });

            //多选
            jQuery(document).on("click",".checkboxs",function(){
                var iffocus = jQuery(this).find(".check-box-now")[0];

                if(iffocus)//选中
                {
                    jQuery(this).find(".check-box-now").removeClass("check-box-now").addClass("check-box");
                    if(jQuery(this).data("type") === "video"){
                        self.checkInfo.videoPlayNormal = false;
                    }
                    if(jQuery(this).data("type") === "ptz"){

                        self.checkInfo.ptzNormal = false;
                    }
                    if(jQuery(this).data("type") === "encodeStd"){
                        self.checkInfo.encodeStd = false;
                    }
                    if(jQuery(this).data("type") === "video-search"){
                        self.checkInfo.videoSearchNormal = false;
                    }
                    if(jQuery(this).data("type") === "video-history"){
                        self.checkInfo.recordPlayNormal = false;
                    }
                    if(jQuery(this).data("type") === "video-download"){
                        self.checkInfo.recordDownNormal = false;
                    }

                }
                else//取消
                {
                    jQuery(this).find(".check-box").addClass("check-box-now").removeClass("check-box");
                    if(jQuery(this).data("type") === "video"){
                        self.checkInfo.videoPlayNormal = true;
                    }
                    if(jQuery(this).data("type") === "ptz"){
                        self.checkInfo.ptzNormal = true;
                    }
                    if(jQuery(this).data("type") === "encodeStd"){
                        self.checkInfo.encodeStd = true;
                    }
                    if(jQuery(this).data("type") === "video-search"){
                        self.checkInfo.videoSearchNormal = true;
                    }
                    if(jQuery(this).data("type") === "video-history"){
                        self.checkInfo.recordPlayNormal = true;
                    }
                    if(jQuery(this).data("type") === "video-download"){
                        self.checkInfo.recordDownNormal = true;
                    }
                }
            });

            //高清与标清
            jQuery(document).on("click",".radios",function(){
                var definition = jQuery(this).find("i");
                if(definition.is(".no-radio") === true)
                {
                    definition.addClass("radio").removeClass("no-radio");
                    jQuery(this).siblings().children("i").removeClass("radio").addClass("no-radio");
                }

            });

            jQuery(document).on("click","#saveInfo",function(){

                self.saveDetectResult();
                new ConfirmDialog({
                    title: '提示',
                    confirmText: '确定',
                    message: "是否继续检测？",
                    callback: function() {
                        if(self.player1){
                            self.player1.stopAll();
                            self.player1 = null;
                        }
                        if(self.player){
                            self.player.stopAll();
                            self.player = null;
                        }

                        self.setContent();
                        self.loadSelectors();
                        self.loadManufacturer();
                        ManufactoryBool=false;
                        VersionBool=false;
                        self.reset();
                        //显示步骤一
                        jQuery("#step-1").show();
                        $(".detect-report table").find("tr:even").css("background-color","#f4f4f4");
                        //设置云台速度
                        jQuery(".speedSlider").slider({
                            range: 'min',
                            step: 1,
                            max: 15,
                            min: 1,
                            value: Toolkit.getPtzSpeed(),
                            change: function() {
                                var speed = jQuery(this).slider('value');
                            }
                        });
                        //加载云台事件
                        var deferred = null;
                        jQuery(".cloud-control .dir-control .dir").controlPtz({
                            deferred: deferred
                        });
                        jQuery(".ptz-adjust .adjust-wrap .adjust").controlPtz({
                            deferred: deferred
                        });
                        //设置右侧信息栏高度
                        var rightHeight = jQuery(document).height() - 250;
                        jQuery(".content-info").height(rightHeight);
                        jQuery(window).resize(function(){
                            var rightHeight = jQuery(document).height() - 250;
                            jQuery(".content-info").height(rightHeight);
                        });
                    }
                });
            });


            // 最后选择通过或不通过

            // jQuery(document).on("click","#step-3 #sult span",function(){
            // 	jQuery("#step-3 #sult span i").removeClass("radio");
            // 	jQuery("#step-3 #sult span i").addClass("no-radio");
            // 	if(jQuery(this).attr("data-type") ==="0"){
            // 		if(jQuery(this).find("i").hasClass("no-radio")){
            // 			jQuery(this).find("i").removeClass("no-radio");
            // 			jQuery(this).find("i").addClass("radio");
            // 			jQuery("#step-3 #noPass").addClass("no-radio");
            // 			self.checkInfo.conclusion  = true;
            // 		}
            // 	}else if(jQuery(this).attr("data-type") ==="1"){
            // 		if(jQuery(this).find("i").hasClass("no-radio")){
            // 			jQuery(this).find("i").removeClass("no-radio");
            // 			jQuery(this).find("i").addClass("radio");
            // 			jQuery("#step-3 #pass").addClass("no-radio");
            // 			self.checkInfo.conclusion  = false;
            // 		}
            // 	}
            // });
        },
        /**
        * 加载摄像机列表数据【暂时不需要对摄像机进行检测，而是从特定的检测pvg中读取，故此接口暂时不用】
        **/
        loadCameraList: function(name){
            var self = this;
            var url = "/service/accesscheck/cameras";
            var data = {
                    cameraName:name,
                    current_page:1,
                    page_size: Global.itemsPerPage
            };
            jQuery.ajax({
                url: url,
                type: "get",
                dataType: "json",
                data: data,
                success: function(tem) {
                    if (tem.code === 200) {
                        var html = "";
                        if (tem.data.pageCount === 0 || tem.data.pageCount === 1) {
                            html = self.options.template({
                                "deviceResult": {}
                            });

                        } else {
                            html =  self.options.template({
                                "deviceResult": {},
                                "pagebar": true
                            });
                        }
                        jQuery("#tableConment").html(html);
                        if (tem.data.pageCount === 0) {
                            notify.info("没有相关摄像机！");
                            // 绑定相关事件
                            return false;
                        } else if (tem.data.pageCount === 1) {
                            jQuery("#tableConment  #deviceTable").html(self.options.template({
                                camreaResultItems: {
                                    device: tem.data.cameraLists
                                }
                            }));
                            // TODO绑定相关事件
                        } else {
                            Global.setPagination(tem.data.count, "#tableConment .pagination", Global.itemsPerPage, function(nextPage) {
                                // TODO  分页回调函数
                                jQuery.ajax({
                                    url:url,
                                    type: "get",
                                    data: {
                                        cameraName:name,
                                        page_size: Global.itemsPerPage,
                                        current_page: nextPage
                                    },
                                    dataType: 'json',
                                    success: function(res) {
                                        if (res.code === 200) {
                                            jQuery("#tableConment  #deviceTable").html(self.options.template({
                                                camreaResultItems: {
                                                    device: res.data.cameraLists
                                                }
                                            }));
                                            // TODO绑定相关事件
                                        }else if(res.code === 500){
                                            notify.warn("获取摄像机列表出错！");
                                        }
                                    },
                                    error: function(){
                                        notify.error("网络或者服务器异常！");
                                    }
                                });
                            });
                        }
                    } else {
                        notify.info("获取数据失败！");
                    }
                }
            });
        },
        /**
        * 加载设备列表数据
        **/
        loadDeviceList: function(name){
            var self = this;
            var	url = "/service/accesscheck/videodevices";
            var data = {
                name:name,
                current_page: 1,
                page_size: Global.itemsPerPage
            };
            jQuery.ajax({
                url: url,
                type: "get",
                dataType: "json",
                data: data,
                success: function(tem) {
                    if (tem.code === 200) {
                        var html = "";
                        if (tem.data.pageCount === 0 || tem.data.pageCount === 1) {
                            html = self.options.template({
                                "deviceResult": {}
                            });
                        } else {
                            html =  self.options.template({
                                "deviceResult": {},
                                "pagebar": true
                            });
                        }
                        jQuery("#tableConment").html(html);
                        if (tem.data.pageCount === 0) {
                            notify.info("没有相关设备！");
                            // 绑定相关事件
                            return false;
                        } else if (tem.data.pageCount === 1) {
                            jQuery("#tableConment  #deviceTable").html(self.options.template({
                                deviceResultItems: {
                                    device: tem.data.deviceInfoLists
                                }
                            }));
                            // TODO绑定相关事件
                        } else {
                            Global.setPagination(tem.data.count, "#tableConment .pagination", Global.itemsPerPage, function(nextPage) {
                                // TODO  分页回调函数
                                jQuery.ajax({
                                    url:url,
                                    type: "get",
                                    data: {
                                        name:name,
                                        page_size: Global.itemsPerPage,
                                        current_page: nextPage
                                    },
                                    dataType: 'json',
                                    success: function(res) {
                                        if (res.code === 200 && res.data.deviceInfoLists) {
                                            jQuery("#tableConment  #deviceTable").html(self.options.template({
                                                deviceResultItems: {
                                                    device: res.data.deviceInfoLists
                                                }
                                            }));
                                            // TODO绑定相关事件
                                        } else if(res.code === 500) {
                                            notify.warn("获取设备列表出错！");
                                        }
                                    },
                                    error: function(){
                                        notify.error("网络或者服务器异常！");
                                    }
                                });
                            });
                        }
                        // 设置分页
                        // TODO绑定相关事件
                    } else {
                        notify.info("获取数据失败！");
                    }
                }
            });
        },
        //根据不同的类型读取并显示设备信息[目前所有设备类型都取自同一个地方]
        getAndShowDeviceList: function(){
            var self = this,
                curType = this.device.type,//"/assets/js/apps/maintenance/devices.json",//
                url = "/service/accesscheck/videodevices",
                data = {//考虑到当前数据比较小，暂不进行分页
                    /*current_type: curType,
                    current_page: 1,
                    page_size: Global.itemsPerPage*/
                    type:self.device.type
                };
            //根据不同的类型设置查询参数
            if(curType === 1){//DNVR网络录像机
            } else if(curType === 2){//IPC网络摄像机
            } else if(curType === 3){//解码器
            }
            //请求数据库，读取相关设备信息
            // if(!self.curCheckDeviceInfo.alreadyLoaded){
                jQuery.ajax({
                    url: url,
                    type: "get",
                    dataType: "json",
                    data: data,
                    success: function(tem) {
                        if (tem.code === 200) {
                            //处理查询到的设备信息
                            self.dealDeviceList(tem);
                        } else {
                            notify.info("获取设备数据失败！");
                        }
                    }
                });
            // } else {
            // 	//处理查询到的设备信息
            // 	self.dealDeviceList(self.curCheckDeviceInfo.data);
            // }
        },
        //处理查询到的设备信息
        dealDeviceList: function(tem){
            var self = this, html = "";
            if(tem.data.pageCount){
                //分页的情况下
                if (tem.data.pageCount === 0 || tem.data.pageCount === 1) {
                    html = self.options.template({
                        "deviceResult": {}
                    });
                } else {
                    html =  self.options.template({
                        "deviceResult": {},
                        "pagebar": true
                    });
                }
                jQuery("#tableConment").html(html);
                if (tem.data.pageCount === 0) {
                    notify.info("暂没有相关设备！");
                    jQuery("#deviceTable").html("<span style='color: gray;'>暂没有相关设备！</span>");
                    // 绑定相关事件
                    return false;
                } else if (tem.data.pageCount === 1) {
                    jQuery("#tableConment  #deviceTable").html(self.options.template({
                        deviceResultItems: {
                            device: tem.data.deviceInfoLists
                        }
                    }));
                    // TODO绑定相关事件
                } else {
                    Global.setPagination(tem.data.count, "#tableConment .pagination", Global.itemsPerPage, function(nextPage) {
                        // TODO  分页回调函数
                        jQuery.ajax({
                            url:url,
                            type: "get",
                            data: {
                                name:name,
                                page_size: Global.itemsPerPage,
                                current_page: nextPage
                            },
                            dataType: 'json',
                            success: function(res) {
                                if (res.code === 200 && res.data.deviceInfoLists) {
                                    jQuery("#tableConment  #deviceTable").html(self.options.template({
                                        deviceResultItems: {
                                            device: res.data.deviceInfoLists
                                        }
                                    }));
                                    // TODO绑定相关事件
                                } else if(res.code === 500) {
                                    notify.warn("获取设备列表出错！");
                                }
                            },
                            error: function(){
                                notify.error("网络或者服务器异常！");
                            }
                        });
                    });
                }
            } else {
                // if(!self.curCheckDeviceInfo.alreadyLoaded){
                // 	//存储已查询的数据
                // 	self.curCheckDeviceInfo.data = tem;
                // 	self.curCheckDeviceInfo.alreadyLoaded = true;
                // }
                //不分页的情况下
                self.dealShowDeviceList(tem);
            }
        },
        //用户在点击了选择设备按钮后，显示相应的设备列表
        dealShowDeviceList: function(tem){
            //不需要分页的时候【目前数量太少，故此处当前不使用分页】
            var self = this, html = self.options.template({ "deviceResult": {} });
            //加载设备列表框架
            jQuery("#tableConment").html(html);
            //显示设备列表
            if (!tem.data.deviceInfoLists || tem.data.deviceInfoLists.length === 0) {
                notify.info("暂没有相关设备！");
                jQuery("#deviceTable").html("<span class='info_style'>暂没有相关设备！</span>");
                // 绑定相关事件
                return false;
            } else {
                //渲染列表
                jQuery("#tableConment  #deviceTable").html(self.options.template({
                    deviceResultItems: {
                        device: tem.data.deviceInfoLists
                    }
                }));
            }
        },
        //收集检测结果
        getCheckResult: function(){
            var self = this;
            //收集固件和软件版本
            self.checkInfo.hardVersion = jQuery("#step-1 .handversion").val();
            self.checkInfo.softVersion = jQuery("#step-1 .softversion").val();
            //收集键盘控制信息
            if(jQuery("#step-2-4 .keyborde .first button").is(".success")){
                self.checkInfo.keyboardCtrlNormal = true;
            }else if(jQuery("#step-2-4 .keyborde .second button").is(".fail")){
                self.checkInfo.keyboardCtrlNormal = false;
            }
            //收集检测结果
            if(jQuery("#step-2 textarea").val() && !jQuery("#step-2-2 textarea").val()){
                self.checkInfo.summary = jQuery("#step-2 textarea").val();
            }else if(jQuery("#step-2 textarea").val() && jQuery("#step-2-2 textarea").val()){
                self.checkInfo.summary = jQuery("#step-2 textarea").val()+","+ jQuery("#step-2-2 textarea").val();
            }else if(!jQuery("#step-2 textarea").val() && jQuery("#step-2-2 textarea").val()){
                self.checkInfo.summary = jQuery("#step-2-2 textarea").val();
            }
            /**下拉列表有其他的情况**/

            if(jQuery("#step-1 #Manufactory .x-selector").is(".none")){
                self.checkInfo.manufacturerName = jQuery("#step-1 .factory").val();
            }
            if(jQuery("#step-1 #ModelNumber .x-selector").is(".none")){
                self.checkInfo.cameraVersionName =  jQuery("#step-1 .model").val();
            }
            if(jQuery("#step-1 #OperateSys .x-selector").is(".none")){
                self.checkInfo.os = jQuery("#step-1 .os").val();
            }
            //2014-08-08,需求更改为对协议自动识别
            //if(jQuery("#step-2 #Protocol .x-selector").is(".none")){
            self.checkInfo.acceptProtocol =  jQuery("#step-1 .acceptprotocol").val();
            //}
            //根据设备类型获取对应的信息
            if(self.checkInfo.deviceType === 1 || self.checkInfo.deviceType === 2){
                self.checkInfo.fps = jQuery("#step-2 .fpsshow").html().replace("FPS","").trim();
                if(jQuery(".show-sh-info .sd").hasClass("active")){
                    self.checkInfo.sdRateResolution = jQuery("#step-2 #sdresolution").html();
                }if(jQuery(".show-sh-info .hd").hasClass("active")){
                    self.checkInfo.hdRateResolution = jQuery("#step-2 #resolution").html();
                }
                // 1:高清 2标清
                self.checkInfo.hdCodeRate = self.hdCaculateRate();
                // 标清的码流
                self.checkInfo.sdCodeRate = self.sdCaculateRate();
                self.checkInfo.hdDecodeNormal = null;
                self.checkInfo.sdDecodeNormal = null;
            }
            if(self.checkInfo.deviceType === 3)
            {
                var definition = jQuery("#step-2-3 .radios").has(".radio").data("type");
                if(jQuery("#step-2-3 .first .decode").is(".success")){
                    if(definition === "high-definition"){
                        self.checkInfo.hdDecodeNormal = true;
                        self.checkInfo.sdDecodeNormal = false;
                    }else if(definition === "standard-definition"){
                        self.checkInfo.sdDecodeNormal = true;
                        self.checkInfo.hdDecodeNormal = false;
                    }
                }else{
                    self.checkInfo.hdDecodeNormal = false;
                    self.checkInfo.sdDecodeNormal = false;
                }
                self.checkInfo.summary = "";

                self.checkInfo.videoPlayNormal = null;
                self.checkInfo.ptzNormal = null;
                self.checkInfo.videoSearchNormal = null;
                self.checkInfo.recordPlayNormal = null;
                self.checkInfo.recordDownNormal = null;
                self.checkInfo.encodeStd = null;

                self.checkInfo.os = "";
                self.checkInfo.dualStream = "";
                self.checkInfo.autoSync = "";
            }

            //由于按照新的流程，原来部分参数无效，现做如下修改
            /*
            * device_id设置为空
            */
            self.checkInfo.deviceId = "";
            //self.checkInfo.encodeStd = "";
        },

        //保存厂商
        savemanufacturer:function(name){
            jQuery.ajax({
                url: "/service/config/add_manufacturer",
                type: "post",
                dataType: "json",
                cache:false,
                data: {
                    name: name
                },
                success: function(tem) {

                }
            });
        },

        // 保存型号

        saveVersion:function(name){
            jQuery.ajax({
                url: "/service/config/add_version_video",
                type: "post",
                dataType: "json",
                cache:false,
                data: {
                    name: name
                },
                success: function(tem) {

                }
            });
        },
        /**
        * 保存检测结果
        **/
        saveDetectResult: function(){
            var self = this;
            //读取最后的summary
            self.checkInfo.summary = jQuery("#last-summary").val();

            //保存结果
            var url = "/service/accesscheck";
            jQuery.ajax({
                url: url,
                type: "post",
                dataType: "json",
                data: self.checkInfo,
                success: function(tem) {
                    if(tem.code === 200){
                        jQuery("#step-3 #numAndDate").show();
                        jQuery("#step-3 .all-summary").addClass("disable");
                        jQuery("#step-3 #numAndDate .info-number").html(tem.data.id);
                        jQuery("#step-3 #numAndDate .info-date").html(Toolkit.mills2datetime(parseInt(tem.data.createDate)));
                        notify.success("数据保存成功！");
                        // TODO 把返回数据的id保存起来，在后面导出的时候要用
                        // 1表示DVR-硬盘录像机；2表示NVR-网络录像机；3表示IPC-网络摄像机；4表示解码器
                        self.currentInfoId = tem.data.id;
                        if(self.device.type === 1){
                            logDict.insertMedialog("m2","检测了"+self.checkInfo.deviceName+"NVR","f5");
                        }else if(self.device.type === 2){
                            logDict.insertMedialog("m2","检测了"+self.checkInfo.deviceName+"IPC","f5");
                        }else if(self.device.type === 3){
                            logDict.insertMedialog("m2","检测了"+self.checkInfo.deviceName+"解码器","f5");
                        }
                        //显示导出按钮
                        jQuery(".report-out").show();
                        jQuery(".submit-save").hide();
                        jQuery("#step-3 .but-back").hide();
                        jQuery(".all-summary").attr("disabled","true");
                        jQuery("#sult td").html("");
                        if(self.checkInfo.conclusion === true){
                            jQuery("#sult td").html("<span>通过</span>");
                        }else if(self.checkInfo.conclusion === false){
                            jQuery("#sult td").html("<span>未通过</span>");
                        }
                    }else if(tem.code === 500){
                        notify.error(tem.data.message);
                    }else{
                        notify.warn("网络或服务器异常！");
                    }
                }
            });
        },
        /**
        * 加载下拉框内容
        **/
        loadSelectors: function(){
            var self = this;
            //设备类型
            new Seclector({
                //容器
                container: jQuery("#DeviceType"),
                //默认输入内容
                inputDefauleText: "--请输入设备类型--",
                //下拉框内容
                select: {
                    1: "NVR--网络录像机",
                    2: "IPC--网络摄像机",
                    3: "解码器"
                },
                activeKey:"",
                callback: function(obj){
                    var type = parseInt(jQuery(obj).attr('data'));
                    if(type === self.device.type){
                        return;
                    }

                    if(type === 1){
                        //设置设备类型为NVR-网络录像机
                        self.device.type = 1;
                        self.device.info = null;
                        jQuery("#deviceName").val("--请选择待检测设备--");
                        //加载设备列表
                        self.getAndShowDeviceList();
                        self.getVideoVersion();
                        self.checkInfo.deviceType = 1;

                    }else if(type === 2){
                        //设置设备类型为IPC-网络摄像机
                        self.device.type = 2;
                        self.device.info = null;
                        jQuery("#deviceName").val("--请选择待检测设备--");
                        //加载设备列表
                        self.getAndShowDeviceList();
                        self.getVideoVersion();
                        self.checkInfo.deviceType = 2;

                    }else if(type === 3){
                        //设置设备类型为解码器
                        self.device.type = 3;
                        self.device.info = null;
                        jQuery("#deviceName").val("--请选择解码器--");
                        //加载解码器列表
                        self.getAndShowDeviceList();
                        self.getVideoVersion();
                        self.checkInfo.deviceType = 3;
                    }
                }
            });
            //厂商
            new Seclector({
                //容器
                container: jQuery("#Manufactory"),
                //默认输入内容
                inputDefauleText: "--请输入厂商--",
                //下拉框内容
                select: {},
                activeKey: ""
            });

            //设备型号

            new Seclector({
                //容器
                container: jQuery("#ModelNumber"),
                //默认输入内容
                inputDefauleText: "--请输入型号--",
                //下拉框内容
                select: {
                },
                activeKey: ""
            });

            //操作系统
            new Seclector({
                //容器
                container: jQuery("#OperateSys"),
                //默认输入内容
                inputDefauleText: "--请选择操作系统--",
                //下拉框内容
                select: {
                    0: "Linux操作系统",
                    1: "Windows操作系统",
                    2: "嵌入式操作系统"
                },
                activeKey: "",
                callback:function(obj){
                    var type = parseInt(jQuery(obj).attr('data'));
                    if(type === 0){
                        self.checkInfo.os = "Linux操作系统";
                    }else if(type ===1){
                        self.checkInfo.os = "Windows操作系统";
                    }else if(type ===2){
                        self.checkInfo.os = "嵌入式操作系统";
                    }
                }
            });

        },
        /**
        * 根据设备ID获取摄像机列表
        **/
        getCameraListByDeviceName: function(name, containerId, stepId) {
            var self = this;
            jQuery.ajax({
                // url: "/assets/js/apps/maintenance/mockdata.json",
                url: "/service/accesscheck/cameras",
                type: "get",
                dataType: "json",
                cache:false,
                data: {
                    name: name
                },
                success: function(tem) {
                    if (tem.code === 200) {
                        var cameraSelect = {};
                        self.pvgInfo = tem.data.pvgInfo;
                        // 1:nvr 只有高清 2：ipc 有高清也有标清
                        if(self.device.type ===1 ) {
                            jQuery(".show-sh-info").hide();
                            jQuery("#step-2 .show-box-right").hide();
                        }
                        if (tem.data.cameraInfos) {
                            var len = tem.data.cameraInfos.length;
                            // 判断是否优质存在
                            if(len > 0){
                                self.curCheckDeviceInfo.data = tem.data.cameraInfos;
                                for (var i = 0; i < len; i++) {
                                    if(self.device.type === 2){
                                        if(tem.data.cameraInfos[i][0].hd){
                                            cameraSelect[i] = tem.data.cameraInfos[i][0].hd.title;
                                            // self.ControlCamera = tem.data.cameraInfos[i][0].hd;
                                        }else{
                                            cameraSelect[i] = tem.data.cameraInfos[i][1].sd.title;
                                            // self.ControlCamera = tem.data.cameraInfos[i][0].sd;
                                        }
                                    }else if(self.device.type === 1){
                                        cameraSelect[i] = tem.data.cameraInfos[i][0].hd.title;
                                    }
                                }

                                if (stepId === "step-2-2") {
                                        self.curCameraInfo =  self.curCheckDeviceInfo.data[0][0];
                                        if (!self.player1) {
                                            self.player1 = new VideoPlayer({
                                                layout: 1,
                                                uiocx: '#UIOCX1'
                                            });
                                        }

                                    } else {
                                        //播放视频
                                        if (!self.player) {
                                            self.player = new VideoPlayer({
                                                layout: 1,
                                                uiocx: '#UIOCX'
                                            });
                                        }
                                        var path = null;
                                        // nvr只支持高清，ipc支持高清和标清
                                        if(self.device.type ===1){
                                            path = self.curCheckDeviceInfo.data[0][0].hd.name;
                                            //如果是球机，去掉云台部分的蒙层
                                            if (self.curCheckDeviceInfo.data[0][0].hd) {
                                                if (self.curCheckDeviceInfo.data[0][0].hd.avType === 1) {
                                                    jQuery("#" + stepId).find(".ptz-control-mask").hide();
                                                    jQuery("#ptz-hide").hide();
                                                    // setTimeout(function(){self.player.switchPTZ(true,0);},2000);

                                                    // self.player.switchPTZ(true,0);
                                                    self.ControlCamera = tem.data.cameraInfos[0][0].hd;
                                                }
                                            }
                                        }else if(self.device.type === 2){
                                            jQuery("#step-2 .show-box-right").show();
                                            // 如果说ipc现在只有标清或者高清的话，不让显示高标清切换
                                            if(self.curCheckDeviceInfo.data[0][0].hd){
                                                path = self.curCheckDeviceInfo.data[0][0].hd.name;
                                            }else if(self.curCheckDeviceInfo.data[0][1].sd){
                                                // path = self.curCheckDeviceInfo.data[infoID][0].sd.name;
                                            }
                                            self.sdToHd(self.curCheckDeviceInfo.data[0],stepId);

                                            //如果是球机，去掉云台部分的蒙层
                                                if (self.curCheckDeviceInfo.data[0][0].hd) {
                                                    if (self.curCheckDeviceInfo.data[0][0].hd.avType === 1) {
                                                        jQuery("#" + stepId).find(".ptz-control-mask").hide();
                                                        jQuery("#ptz-hide").hide();
                                                        // setTimeout(function(){self.player.switchPTZ(true,0);},2000);

                                                        // self.player.switchPTZ(true,0);
                                                        self.ControlCamera = tem.data.cameraInfos[0][0].hd;
                                                    }
                                                }
                                                if(self.curCheckDeviceInfo.data[0][1].sd){
                                                    if (self.curCheckDeviceInfo.data[0][1].sd.avType === 1) {
                                                        jQuery("#" + stepId).find(".ptz-control-mask").hide();
                                                        jQuery("#ptz-hide").hide();
                                                        setTimeout(function(){self.player.switchPTZ(true,0);},2000);

                                                        // self.player.switchPTZ(true,0);
                                                        self.ControlCamera = tem.data.cameraInfos[0][1].sd;
                                                    } else {
                                                        jQuery("#" + stepId).find(".ptz-control-mask").show();
                                                        jQuery("#ptz-hide").show();
                                                    }
                                                }
                                        }


                                        // 播放视频
                                        self.dealPlayVideo(self.player, path, stepId,2);



                                    }
                            }

                            //设备类型
                            new Seclector({
                                //容器
                                container: jQuery("#" + containerId),
                                //默认输入内容
                                inputDefauleText: "--请选择摄像机--",
                                //下拉框内容
                                select: cameraSelect,
                                // 选中
                                activeKey:"0",
                                //使用iframe托起
                                isIframe: true,
                                //选择列表后回调
                                callback: function(obj) {

                                    jQuery(".show-sh-info span").removeClass("active");
                                    jQuery(".show-sh-info span.hd").addClass("active");
                                    jQuery("#step-2 .info.resolution,#step-2 .info.codeRate").show();
                                    jQuery("#step-2 .info.sdresolution,#step-2 .info.sdcodeRate").hide();
                                    //摄像机ID
                                    var infoID = jQuery(obj).attr("data");
                                    self.curCameraInfo = null;
                                    var getCameraInterval;
                                    if (stepId === "step-2-2") {
                                        self.curCameraInfo =  self.curCheckDeviceInfo.data[infoID][0];
                                        if (!self.player1) {
                                            self.player1 = new VideoPlayer({
                                                layout: 1,
                                                uiocx: '#UIOCX1'
                                            });
                                        }
                                    } else {

                                        //如果是球机，去掉云台部分的蒙层
                                        if (self.curCheckDeviceInfo.data[infoID][0].hd) {
                                            if (self.curCheckDeviceInfo.data[infoID][0].hd.avType === 1) {
                                                jQuery("#" + stepId).find(".ptz-control-mask").hide();
                                                jQuery("#ptz-hide").hide();
                                                // self.player.switchPTZ(true,0);
                                                setTimeout(function(){self.player.switchPTZ(true,0);},2000);

                                                self.ControlCamera = tem.data.cameraInfos[infoID][0].hd;
                                            }
                                        }
                                        if(self.curCheckDeviceInfo.data[infoID][1].sd){
                                            if (self.curCheckDeviceInfo.data[infoID][1].sd.avType === 1) {
                                                jQuery("#" + stepId).find(".ptz-control-mask").hide();
                                                jQuery("#ptz-hide").hide();
                                                // self.player.switchPTZ(true,0);
                                                setTimeout(function(){self.player.switchPTZ(true,0);},2000);

                                                self.ControlCamera = tem.data.cameraInfos[infoID][1].sd;
                                            } else {
                                                jQuery("#" + stepId).find(".ptz-control-mask").show();
                                                jQuery("#ptz-hide").show();
                                            }
                                        }
                                        //播放视频
                                        if (!self.player) {
                                            self.player = new VideoPlayer({
                                                layout: 1,
                                                uiocx: '#UIOCX'
                                            });
                                        }
                                        var path = null;
                                        // nvr只支持高清，ipc支持高清和标清
                                        if(self.device.type ===1){
                                            jQuery("#step-2 .show-box-right").hide();
                                            path = self.curCheckDeviceInfo.data[infoID][0].hd.name;
                                        }else if(self.device.type === 2){
                                            jQuery("#step-2 .show-box-right").show();
                                            // 如果说ipc现在只有标清或者高清的话，不让显示高标清切换
                                            if(self.curCheckDeviceInfo.data[infoID][0].hd){
                                                path = self.curCheckDeviceInfo.data[infoID][0].hd.name;
                                            }else if(self.curCheckDeviceInfo.data[infoID][1].sd){
                                                // path = self.curCheckDeviceInfo.data[infoID][0].sd.name;
                                            }
                                            self.sdToHd(self.curCheckDeviceInfo.data[infoID],stepId);
                                        }

                                        // 播放视频
                                        self.dealPlayVideo(self.player, path, stepId,2);
                                    }
                                }
                            });
                        } else {
                            notify.warn("摄像机列表为空！");
                            new Seclector({
                                //容器
                                container: jQuery("#" + containerId),
                                //默认输入内容
                                inputDefauleText: "--请选择摄像机--",
                                //下拉框内容
                                select: {},
                                //使用iframe托起
                                isIframe: true
                            });
                        }
                    } else if (tem.code === 500) {
                        notify.warn("获取摄像机列表失败！");
                    }
                },
                error: function() {
                    notify.error("网络或者服务器异常！");
                }
            });
        },
        // 高清标清切换
        sdToHd: function(tem, stepId) {
            var self = this;
            jQuery(".show-sh-info span").unbind();
            jQuery(".show-sh-info span").on("click", function() {
                // 1：标清，2高清
                var str = jQuery(this).attr("data-type");
                var path = null;
                if (!self.player) {
                    self.player = new VideoPlayer({
                        layout: 1,
                        uiocx: '#UIOCX'
                    });
                }
                if (str === "1") {
                    if (jQuery(this).hasClass("active")) {
                        return;
                    } else {
                    self.checkInfo.hdRateResolution = jQuery("#step-2 #resolution").html();
                        jQuery(".show-sh-info span").removeClass("active");
                        jQuery(this).addClass("active");
                        jQuery("#step-2 .info.resolution,#step-2 .info.codeRate").hide();
                        jQuery("#step-2 .info.sdresolution,#step-2 .info.sdcodeRate").show();

                        // nvr只支持高清，ipc支持高清和标清
                        // 如果说ipc现在只有标清或者高清的话，不让显示高标清切换
                        if (tem[1].sd) {
                            path = tem[1].sd.name;
                            // path = "av/ipc/1#1";
                            self.dealPlayVideo(self.player, path, stepId);
                            // 判断云台是否支持

                            if(tem[1].sd.avType ===1){
                                setTimeout(function(){self.player.switchPTZ(true,0);},2000);
                            }
                        }else{
                            self.dealPlayVideo(self.player, path, stepId);
                        }
                        // 播放视频

                    }
                } else if (str === "2") {
                    if (jQuery(this).hasClass("active")) {
                        return;
                    } else {
                        self.checkInfo.sdRateResolution = jQuery("#step-2 #sdresolution").html();
                        jQuery(".show-sh-info span").removeClass("active");
                        jQuery(this).addClass("active");
                        jQuery("#step-2 .info.resolution,#step-2 .info.codeRate").show();
                        jQuery("#step-2 .info.sdresolution,#step-2 .info.sdcodeRate").hide();
                        if (tem[0].hd) {
                            path = tem[0].hd.name;
                            self.dealPlayVideo(self.player, path, stepId,2);
                            if(tem[0].hd.avType === 1){
                                setTimeout(function(){self.player.switchPTZ(true,0);},2000);
                                // self.player.switchPTZ(true,0);
                            }else{
                            }
                        }else{
                            self.dealPlayVideo(self.player, path, stepId,2);
                        }
                        // 播放视频

                    }
                }

            });
        },
        /**
        * 判断当前步骤是否已确定检测完成
        **/
        isToNextStep: function(obj){
            var self = this;
            var flag = true;
            //第一步
            if(jQuery(obj).attr("to") === "step-2"){
                if(!self.device.type){
                    notify.warn("您还未选择设备类型！");
                    flag = false;
                    // return flag;
                    // // return ;
                }
                if(!self.curselctDeviceName){
                    if(self.device.type === 1){
                        notify.warn("您还未选择设备！");
                        flag = false;
                    }else if(self.device.type === 2){
                        notify.warn("您还未选择设备！");
                        flag = false;
                    }else if(self.device.type ===3) {
                        notify.warn("您还未选择解码器！");
                        flag = false;
                    }

                    // return flag;
                    return;
                }

            }
            //第二步
            if(jQuery(obj).attr("to") === "step-2"){
                //摄像机
                if(this.device.type === 1 || this.device.type === 2){//设备
                    //初始化播放器
                    self.initPlayerObj("player");
                    //显示摄像机选择列表
                    jQuery(".sel-cam").show();
                    self.clearVideoInfo("step-2");
                    //清空码率信息
                    self.videoRateInfo.rateArr.length = 0;
                    self.videoRateInfo.count = 0;
                    self.videoRateInfo.sdArr.length = 0;
                    self.videoRateInfo.sdCount = 0;
                    //获取摄像机信息
                    this.getCameraListByDeviceName(self.curselctDeviceName, "CamerasOfDevice", "step-2");
                    // this.getCameraListByDeviceInfo(self.device.info.id, "CamerasOfDevice", "step-2");
                }
                // return flag;
            }
            //第三步
            if(jQuery(obj).attr("to") === "step-2-2"){
                //摄像机
                if(this.device.type === 1 || this.device.type === 2){//设备
                    //初始化播放器
                    self.initPlayerObj("player1");
                    //录像情况下隐藏帧率、分辨率、码率等信息
                    //jQuery("#step-4-2 .show-video-info").hide();
                    //清空选择的录像列表
                    self.clearVideoInfo("step-2-2");
                    jQuery("#step-2-2 .video-list-1").empty();
                    //显示摄像机选择列表
                    jQuery(".sel-cam").show();
                    //获取摄像机信息
                    this.getCameraListByDeviceName(self.curselctDeviceName, "HistoryCamerasOfDevice", "step-2-2");
                }
                self.showDefaultTime();
            }
            return flag;
        },

        //播放视频
        dealPlayVideo: function(playerObj, path, id,type){
            var self = this;
            //解除之前存在的码率定时器
            self.clearVideoInfo(id);

            //历史调阅，不再进行播放
            if(id === "step-2-2"){
                return;
            }

            //实时流播放视频
            setTimeout(function() {
                var result = self.player.playStream({
                    "ip": self.pvgInfo.pvgIp,
                    "port": parseInt(self.pvgInfo.pvgPort),
                    "user": self.pvgInfo.pvgUser,
                    "passwd": self.pvgInfo.pvgPass,
                    "path": path
                }, 0);

                if(result !== 0){
                    playerObj.setStyle(1);
                } else {
                    //如果已经播放成功，则自动勾选”视频播放正常选项“
                    jQuery(".checkboxs[data-type='video']").find("i").removeClass("check-box").addClass("check-box-now");
                    self.checkInfo.videoPlayNormal = true;
                    var resolution = self.player.getVideoInfo(0); //码流分辨率
                    //更新码流、码率、帧率
                    self.initVideoRate(playerObj, id);
                    playerObj.setInfo(self.watermark,0);
                }
            }, 1000);
            //给视频加水印
            // playerObj.setInfo(self.watermark,1);
        },
        //播放视频时更新码流、码率、帧率
        initVideoRate: function(playerObj, id){
            var self = this;
            clearInterval(self.cameraInterval);
            self.cameraInterval = setInterval(function(){
                var codeRate = playerObj.getStreamMonitor(0);//码率
                var resolution  = playerObj.getVideoInfo(0);//码流分辨率

                if(codeRate === "ERROR" || resolution === ""){
                    notify.warn("码率或分辨率获取失败！");
                    clearInterval(self.cameraInterval);
                    codeRate = "0Kbps";
                    resolution = {width:0, height:0};
                }
                //如果是实时流，则计算平均码率
                if(id === "step-2"){
                    var framRate = playerObj.getFramRate(0);//帧率
                    if(framRate ==="ERROR"){
                        notify.warn("帧率获取失败！")
                    }else{
                        jQuery("#step-2 .fpsshow").html(framRate);
                    }
                    var tempValue = 0;
                    var sdTempValue = 0;
                    if(jQuery(".show-sh-info .sd").hasClass("active")){
                        if(codeRate.indexOf("Mb") > 0){
                            sdTempValue = parseFloat(codeRate.replace("Mbps", "")) * 1000;
                        } else if(codeRate.indexOf("Kb") > 0){
                            sdTempValue = parseFloat(codeRate.replace("Kbps", ""));
                        } else {
                            sdTempValue = 0;
                        }
                        self.videoRateInfo.sdArr.push(sdTempValue);
                            self.videoRateInfo.sdCount ++;
                        jQuery("#" + id + " #sdcodeRate").html(codeRate);
                        jQuery("#" + id + " #sdresolution").html(resolution.width + "x" + resolution.height);
                    }else if(jQuery(".show-sh-info .hd").hasClass("active")){
                        if(codeRate.indexOf("Mb") > 0){
                            tempValue = parseFloat(codeRate.replace("Mbps", "")) * 1000;
                        } else if(codeRate.indexOf("Kb") > 0){
                            tempValue = parseFloat(codeRate.replace("Kbps", ""));
                        } else {
                            tempValue = 0;
                        }
                        self.videoRateInfo.rateArr.push(tempValue);
                        self.videoRateInfo.count ++;
                        jQuery("#" + id + " #codeRate").html(codeRate);
                        jQuery("#" + id + " #resolution").html(resolution.width + "x" + resolution.height);
                    }
                }else{
                    jQuery("#" + id + " #codeRate").html(codeRate);
                    jQuery("#" + id + " #resolution").html(resolution.width + "x" + resolution.height);
                }

            }, 1000);
        },
        //清空码率更新定时器
        clearVideoInfo: function(id){
            var self = this;
            //清除定时器
            if(self.cameraInterval) {
                clearInterval(self.cameraInterval);
                if(id !== ""){
                    jQuery("#" + id + " #codeRate").html("0Kbps");
                    jQuery("#" + id + " #resolution").html("0x0");
                }
            };
            //解除之前播放
            if(self.player1){
                self.player1.stopStream(0);
            }
            if(self.player){
                self.player.stopStream(0);
            }
        },
        //初始化播放器(实时流或者历史调阅)
        initPlayerObj: function(type){
            var self = this;
            if(type === "player"){
                if(!self.player){
                    self.player = new VideoPlayer({
                        layout: 1,
                        uiocx: '#UIOCX'
                    });
                }
            } else {
                if(!self.player1){
                    self.player1 = new VideoPlayer({
                        layout: 1,
                        uiocx: '#UIOCX1'
                    });
                }
            }
        },
        // 计算高清平均码率(1 高清  2标清)
        hdCaculateRate: function(){
            var self = this, sum = 0, result = 0;
                for (var i = 0; i < self.videoRateInfo.rateArr.length; i++) {
                    sum += self.videoRateInfo.rateArr[i];
                }
                result = sum / (self.videoRateInfo.count - 1);
                return result.toFixed(2) + "Kbps";
        },

        // 计算标清平均码率
        sdCaculateRate: function(){
            var self = this, sum = 0, result = 0;
                for (var i = 0; i < self.videoRateInfo.sdArr.length; i++) {
                    sum += self.videoRateInfo.sdArr[i];
                }
                result = sum / (self.videoRateInfo.sdCount - 1);
                return result.toFixed(2) + "Kbps";

        },
        showDefaultTime:function(){
            //显示默认时间
            jQuery(".begin-time").val(Toolkit.getCurDate()+" 00:00:00");
            jQuery(".end-time").val(Toolkit.getCurDate()+" 23:59:59");

        },
        //获取视频码流
        getCameraCode:function(){
            var codeRate = self.player.getStreamMonitor(0);//码率
            var resolution  = self.player.getVideoInfo(0);//码流分辨率
            jQuery("#"+id+" #codeRate").html(codeRate);
            jQuery("#"+id+" #resolution").html(resolution.width+"x"+resolution.height);
        },
        /*获取厂商信息*/
        loadManufacturer:function(){
            var self = this;
            var selectManufacturer = {};
            jQuery.ajax({
                url: "/service/config/all_manufacturer",
                type: "get",
                dataType: "json",
                success: function(tem) {
                    if(tem.code === 200){
                        var len = tem.data.manufacturer.length;
                        for(var i = 0;i<len;i++){
                            selectManufacturer[tem.data.manufacturer[i].id] = tem.data.manufacturer[i].name;
                        }
                        new Seclector({
                            //容器
                            container: jQuery("#Manufactory"),
                            //默认输入内容
                            inputDefauleText: "--请输入厂商--",
                            //下拉框内容
                            select: selectManufacturer,
                            activeKey: "",
                            callback:function(obj){
                                self.checkInfo.manufacturerName = jQuery(obj).attr("title");
                            }

                        });
                    }else if(tem.code === 500){
                        notify.error(tem.data.message);
                    }else{
                        notify.info("网络或服务器异常！");
                    }
                }
            });
        },
        // 获取摄像机型号
        getCameraVersion:function(){
            var self = this;
            var selectCamVersion = {};
            jQuery.ajax({
                url: "/service/config/all_version_camera",
                type: "get",
                dataType: "json",
                data:{},
                success: function(tem) {
                    if(tem.code === 200){
                        var len = tem.data.version.length;
                        for(var i = 0;i<len;i++){
                            selectCamVersion[tem.data.version[i].id] = tem.data.version[i].name;
                        }
                        new Seclector({
                            //容器
                            container: jQuery("#ModelNumber"),
                            //默认输入内容
                            inputDefauleText: "--请输入型号--",
                            //下拉框内容
                            select: selectCamVersion ,
                            activeKey: "",
                            callback:function(obj){
                                self.checkInfo.cameraVersionName = jQuery(obj).attr("title");
                            }
                        });
                    }else if(tem.code === 500){
                        notify.error(tem.data.message);
                    }else{
                        notify.info("网络或服务器异常！");
                    }
                }
            });
        },
        // 获取视频设备型号
        getVideoVersion:function(){
            var self = this;
            var selectVidVersion = {};
            jQuery.ajax({
                url: "/service/config/all_version_video",
                type: "get",
                dataType: "json",
                data:{},
                success: function(tem) {
                    if(tem.code === 200){
                        var len = tem.data.version.length;
                        for(var i = 0;i<len;i++){
                            selectVidVersion[tem.data.version[i].id] = tem.data.version[i].name;
                        }
                        new Seclector({
                            //容器
                            container: jQuery("#ModelNumber"),
                            //默认输入内容
                            inputDefauleText: "--请输入型号--",
                            //下拉框内容
                            select: selectVidVersion ,
                            activeKey: "",
                            callback:function(obj){
                                self.checkInfo.cameraVersionName = jQuery(obj).attr("title");
                            }
                        });
                    }else if(tem.code === 500){
                        notify.error(tem.data.message);
                    }else{
                        notify.info("网络或服务器异常！");
                    }
                }
            });

        },
        // 获取视频片段列表
        getVideoList:function(avObj,beginTime,endTime){
            var self = this;
            if(beginTime){
                beginTime =Toolkit.str2mills(beginTime)
            }
            if(endTime){
                endTime =Toolkit.str2mills(endTime)
            }
            var url = "/service/accesscheck/historys";
            // var url = "/assets/js/apps/maintenance/mockdata.json";
            var data = {
                "avObj":  avObj,
                "startTime":beginTime,
                "endTime":  endTime
            };
            jQuery.ajax({
                url: url,
                type: "get",
                dataType: "json",
                data: data,
                success: function(tem) {
                    if (tem.code === 200) {
                        if(tem.data.infos.length > 0){
                            var	html = self.options.template({
                                    "VideoList": {
                                        list:tem.data.infos
                                    }
                                });
                            jQuery("#step-2-2 .video-list-1").html(html);
                            //自动勾选录像检索正常选项
                            jQuery(".checkboxs[data-type='video-search']").find("i").removeClass("check-box").addClass("check-box-now");
                            self.checkInfo.videoSearchNormal = true;
                        }else{
                            notify.info("没有找到录像片段！")
                        }
                    } else if(tem.code === 500){
                            notify.error("没有找到录像片段！");
                    }else{
                            notify.warn("网络或服务器异常！");
                    }
                }
            });
        },

        //加水印
        getWatermark: function(){
            var self = this;
            jQuery.ajax({
                url: '/service/usr/get_current_usr',
                type: 'get',
                cache: false,
                success: function(tem){
                    if(tem.code === 200){
                        self.watermark = tem.data.usr.caToken;
                    }else if(tem.code === 500){
                        notify.error("获取水印失败！");
                    }else{
                        notify.warn("网络或服务器异常！");
                    }
                }
            });
        },
        /**
        * 重置全局对象
        **/
        reset: function() {
            self.checkInfo = {
                "deviceType": "", //1NVR-网络录像机；2表示IPC-网络摄像机；3表示解码器
                "deviceName": "",
                "deviceIp": "", // 设备IP
                "deviceId": "",
                "manufacturerName": "",
                "cameraVersionName": "",
                "hardVersion": "",
                "softVersion": "",
                "os": "",
                "sdCodeRate": "", //标清
                "hdCodeRate": "", //高清码率
                "acceptProtocol": "",
                "encodeStd": false, //编码标准
                "dualStream": "", //是否支持多码流
                "mainDpi": "", //主码分辨率
                "subDpi": "", //子码分辨率
                "autoSync": "", //时钟同步功能
                "autoUpdate": "", //远程自动升级功能
                "registerSuccess": "", //国标注册是否成功
                "videoSearchNormal": false, //录像检索正常
                "recordPlayNormal": false, //录像播放正常
                "recordDownNormal": false, //录像下载正常
                "hdDecodeNormal": "", //高清解码成功
                "sdDecodeNormal": "", //标清解码成功
                "keyboardCtrlNormal": "", //键盘控制成功
                "summary": "", //总结信息,
                "sdRateResolution": "",
                "hdRateResolution": "",
                "conclusion": true, //结论通过不通过 true通过 false：不通过
                "flag": "inpage"
            };
            //当前选中设备类型及设备信息
            this.device = {
                type: "", //0表示摄像机；1标志视频设备
                info: "" //摄像机或者视频设备信息
            };

            this.ControlCamera=null;
            // 提交数据后台返回id，用于请求数据渲染表
            this.currentInfoId=null;
            // 储存的当前选择的摄像机的信息
            this.curCameraInfo=null;

            curselctDeviceName = null;
        }
    });
    /**
    * 检测管理
    **/
    var DetectionMgr = new Class({

        Implements: [Events, Options],

        options: {
            template: null,
            itemsPerPage:10
        },

        needDate :{
                name:"",
                startTime:"",
                endTime: "",
                currentPage: 1,
                pageSize: 10,
                id: "",
                itemsPerPage:10,
                manufacturerName: "",
                cameraVersionName: ""
        },

        initialize: function(options){
            this.setOptions(options);
            //绑定事件
            this.bindEvents();
            this.deviceSearchName=null;
            this.myHelper();
        },
        /**
        * 注册助手
        **/
        myHelper: function(){
            Handlebars.registerHelper("date", function(value) {
                return Toolkit.mills2datetime(value);
            });
        },

        // 重置参数
        setDate:function(){
            var self = this;
            self.needDate = {
                name:"",
                startTime:"",
                endTime: "",
                currentPage: 1,
                pageSize: 10,
                id: "",
                itemsPerPage:10,
                manufacturerName: "",
                cameraVersionName: ""
            }
        },
        /**
        * 设置检测内容
        **/
        setContent: function(){
            var content = this.options.template({
                dectectionMgr: true
            });
            jQuery(".content-container").empty().html(content);
        },
        /**
        * 加载已检测设备
        * param: {}
        **/
        loadDetectedDevices: function(param){

        },
        // 加载所有设备
        getVideoVersionAll:function(){
            var self = this;
            var selectVidVersion = {"-2":"全部"};
            jQuery.ajax({
                url: "/service/config/all_version_video",
                type: "get",
                dataType: "json",
                data:{},
                success: function(tem) {
                    if(tem.code === 200){
                        var len = tem.data.version.length;
                        for(var i = 0;i<len;i++){
                            selectVidVersion[tem.data.version[i].id] = tem.data.version[i].name;
                        }

                        new Seclector({
                            //容器
                            container: jQuery("#version"),
                            //默认输入内容
                            inputDefauleText: "",
                            width:150,
                            //下拉框内容
                            select:selectVidVersion,
                            activeKey: "",
                            callback:function(obj){
                                self.needDate.cameraVersionName = jQuery(obj).attr("title");
                            }
                        });
                    }else if(tem.code === 500){
                        notify.error(tem.data.message);
                    }else{
                        notify.info("网络或服务器异常！");
                    }
                }
            });

        },

        /*获取厂商信息*/
        loadManufacturerAll:function(){
            var self = this;
            var selectManufacturer = {"-2":"全部"};
            jQuery.ajax({
                url: "/service/config/all_manufacturer",
                type: "get",
                dataType: "json",
                success: function(tem) {
                    if(tem.code === 200){
                        var len = tem.data.manufacturer.length;
                        for(var i = 0;i<len;i++){
                            selectManufacturer[tem.data.manufacturer[i].id] = tem.data.manufacturer[i].name;
                        }
                        // console.log(selectManufacturer);


                        new Seclector({
                            //容器
                            container: jQuery("#firm"),
                            //默认输入内容
                            inputDefauleText: "",
                            width:150,
                            //下拉框内容
                            select: selectManufacturer,
                            activeKey: "",
                            callback:function(obj){
                                self.needDate.manufacturerName = jQuery(obj).attr("title");
                            }
                        });
                    }else if(tem.code === 500){
                        notify.error(tem.data.message);
                    }else{
                        notify.info("网络或服务器异常！");
                    }
                }
            });
        },
        /**
        * 绑定事件
        **/
        bindEvents: function(){
            var self = this;
            //点击查询
            jQuery(document).on("click", ".dectectionMgr-top .give button", function(){
                var start_time = jQuery(".dectectionMgr-top .search-right input:eq(0)").val();
                var end_time = jQuery(".dectectionMgr-top .search-right input:eq(1)").val();
                var id = jQuery("#checkNumber").val();
                if(start_time!="" && end_time!="" && start_time>end_time)
                {
                    notify.warn("结束时间不能早于开始时间！");
                }
                else
                {
                    self.needDate.name = '';
                    self.needDate.startTime = start_time;
                    self.needDate.endTime = end_time;
                    self.needDate.currentPage =1;
                    self.needDate.pageSize=self.options.itemsPerPage;
                    self.needDate.id=id;
                    self.needDate.manufacturerName ="" ;
                    self.needDate.cameraVersionName = "";
                    self.showDetectDeviceList(self.needDate.currentPage);
                }
            });


            // 点击高级查询切换
            jQuery(document).on("click",".other-search",function(){
                jQuery(this).closest(".dectectionMgr-top").find(".search.firm,.search.version,.search.check-name ,.other-give").show();
                jQuery(this).closest(".dectectionMgr-top").css({"height":"120px"});
                jQuery(this).closest(".dectectionMgr-top").find(".give").hide();
                jQuery(this).closest(".dectectionMgr-top").find(".check-number").hide();
                // 11清空输入框，给序列号重新赋值
                jQuery(this).closest(".dectectionMgr-top").find(".check-number #checkNumber").val("");
                self.needDate.id === "";
            });

            // 点击查巡取消
            jQuery(document).on("click",".other-give .cancel",function(){
                jQuery(this).closest(".dectectionMgr-top").find(".search.firm,.search.version,.search.check-name ,.other-give").hide();
                jQuery(this).closest(".dectectionMgr-top").css({"height":"66px"});
                jQuery(this).closest(".dectectionMgr-top").find(".give").show();
                jQuery(this).closest(".dectectionMgr-top").find(".check-number").show();
            });

            // 点击高级搜索的查询
            jQuery(document).on("click",".other-give .check",function(){
                var deviceName = jQuery(".dectectionMgr-top #checkName").val();
                var start_time = jQuery(".dectectionMgr-top .search-right input:eq(0)").val();
                var end_time = jQuery(".dectectionMgr-top .search-right input:eq(1)").val();
                var id = jQuery("#checkNumber").val();
                var manufacturerName = jQuery("#firm .x-selector-text").attr("title");
                var cameraVersionName = jQuery("#version .x-selector-text").attr("title");
                if(manufacturerName == "全部"){
                    manufacturerName = "";
                }
                if(cameraVersionName =="全部"){
                    cameraVersionName = "";
                }
                if(start_time!="" && end_time!="" && start_time>end_time)
                {
                    notify.warn("结束时间不能早于开始时间！");
                    return false;
                }
                else
                {
                    self.needDate.name = deviceName;
                    self.needDate.startTime = start_time;
                    self.needDate.endTime = end_time;
                    self.needDate.currentPage =1;
                    self.needDate.pageSize=self.options.itemsPerPage;
                    self.needDate.id=id;
                    self.needDate.manufacturerName =manufacturerName ;
                    self.needDate.cameraVersionName = cameraVersionName;
                    self.showDetectDeviceList(self.needDate.currentPage);
                }
            });

            //导出
            jQuery(document).on("click", ".dectectionMgr-info table tr td a.report-export", function(){
                self.exportDetectDeviceById(jQuery(this).data("id"),jQuery(this).attr("data-name"));
            });
            //删除
            jQuery(document).on("click", ".dectectionMgr-info table tr td a.report-del", function(){
                //var currentPage = jQuery(this).parents(".dectectionMgr-info").find(".pagination .current").html();
                self.delDetectDeviceById(jQuery(this).data("id"),jQuery(this).attr("data-name"));
            });

            // 改变每页的的条数
            jQuery(document).on("change","select#curTotal",function(){
                self.options.itemsPerPage = parseInt(jQuery(this).val());
                self.needDate.pageSize=self.options.itemsPerPage;

                self.showDetectDeviceList(self.needDate.currentPage);
            });

            // 根据不同的需求请求数据
            jQuery(document).on("click",".bottem-page .page",function(){
                var type = jQuery(this).attr("data-type");
                var curpage = jQuery(".bottem-page .cur").html();
                var total = jQuery(".bottem-page .total").html();

                if(type ==="1"){
                    if(curpage === "1"){
                        // notify.warn("目前已经是第一页！");
                        return false;
                    }
                    self.needDate.currentPage = 1;
                    self.showDetectDeviceList(self.needDate.currentPage);
                }else if (type ==="2"){
                    if(curpage === "1"){
                        // notify.warn("目前已经是第一页！");
                        return false;
                    }
                    self.needDate.currentPage = parseInt(curpage)-1;
                    self.showDetectDeviceList(self.needDate.currentPage);
                }else if(type ==="3"){
                    if(curpage === total){
                        // notify.warn("目前已经是最后一页！");
                        return false;
                    }
                    self.needDate.currentPage =  parseInt(curpage)+1;
                    self.showDetectDeviceList(self.needDate.currentPage);
                }else if(type ==="4"){
                    if(curpage === total){
                        // notify.warn("目前已经是最后一页！");
                        return false;
                    }
                    self.needDate.currentPage =  parseInt(total);
                    self.showDetectDeviceList(self.needDate.currentPage);
                }
            });


            // 跳转页数，回车请求
            jQuery(document).on("keypress",".goto", function(event) {
                if (event.keyCode === 13) {
                    var cur =  parseInt(jQuery(this).val());
                    self.needDate.currentPage = cur;
                    var r = /^[0-9]*[1-9][0-9]*$/;
                    jQuery(this).val(cur);
                    var total = jQuery(".bottem-page .total").html()
                    if(cur<1 || !r.test(cur)){
                        notify.warn('请输入正确的数字！')
                        return false;
                    }else if(cur>total) {
                        notify.warn("输入的页码超过总页码，请重新输入！");
                        return false;
                    }
                    self.showDetectDeviceList(self.needDate.currentPage);
                }
            });

        },

        showDetectDeviceList: function(currentPage) {
            var self = this;
            var url = "/service/accesscheck";
            var data = self.needDate;
            jQuery.ajax({
                url: url,
                type: "get",
                dataType: "json",
                data: data,
                success: function(tem) {
                    if (tem.code === 200) {
                        if (self.needDate.name) {
                            logDict.insertMedialog("m2", "查询" + self.needDate.name + "设备的入网检测报告", "f5", "o17");
                        } else {
                            logDict.insertMedialog("m2", "查询所有设备的入网检测报告", "f5", "o17");
                        }
                        var html = "";
                        if (tem.data.pageCount === 0) {
                            html = self.options.template({
                                "detectResult": {}
                            });
                        } else {
                            html = self.options.template({
                                "detectResult": {}
                            });

                            html2 = self.options.template({
                                "pagepart": {
                                    "total":tem.data.count,
                                    "pageCount":tem.data.pageCount,
                                    "curpage":currentPage
                                }
                            });
                        }
                        // jQuery(".dectectionMgr-info").html(html);
                        if (tem.data.pageCount === 0) {
                            notify.info("没有相关数据！");
                            var ehtml = self.options.template({
                                "detectResult": {}
                            });
                            jQuery("#detectMgrTable").html('<span id="no-data">没有相关数据!</span>');
                            jQuery("#detectMgrPage").html("");
                            // 绑定相关事件
                            return false;
                        }else{
                            jQuery("#detectMgrTable").html(self.options.template({
                                detectResultItems: {
                                    detect: tem.data.infos
                                }
                            }));
                            jQuery("#detectMgrPage").html(self.options.template({
                                "pagepart": {
                                    "total":tem.data.count,
                                    "pageCount":tem.data.pageCount,
                                    "curpage":currentPage
                                }
                            }));

                            jQuery("#detectMgrPage .cur").html(currentPage);
                            if(self.needDate.pageSize === 10){
                                jQuery("#curTotal").val(10);
                            }else if(self.needDate.pageSize === 50){
                                jQuery("#curTotal").val(50);
                            }else if(self.needDate.pageSize === 100){
                                jQuery("#curTotal").val(100);
                            }
                            if(currentPage === 1){
                                jQuery("#detectMgrPage .first,#detectMgrPage .pre").addClass("nouse");
                            }else if(currentPage===tem.data.pageCount){
                                jQuery("#detectMgrPage .end,#detectMgrPage .next").addClass("nouse");
                            }

                        }
                    } else {
                        notify.info("获取数据失败！");
                    }
                }
            });
        },
        /**
        * 查看
        **/
        showDetectDeviceById: function(id){
            var url = "/service/accesscheck/";
            var data = {
                    id:id
            };
            jQuery.ajax({
                url: url,
                type: "get",
                dataType: "json",
                data: data,
                success: function(tem) {
                    if (tem.code === 200) {

                    }else if(tem.code === 500){
                        notify.info("获取数据失败！");
                    }
                },
                error: function(){
                    notify.error("网络或者服务器异常！");
                }
            });
        },
        /**
        * 导出
        **/
        exportDetectDeviceById: function(id,name){
            window.open("/service/accesscheck/export/"+id);
            logDict.insertMedialog("m2", "导出" + name + "设备的入网检测报告", "f5");

        },
        /**
        * 删除
        **/
        delDetectDeviceById: function(id,name){
            var self = this;
            new ConfirmDialog({
                title: '提示',
                confirmText: '确定',
                message: "确定要删除吗？",
                callback: function() {
                    var url = "/service/accesscheck/"+id;
                    var data = {
                        _method:"delete"
                    };
                    jQuery.ajax({
                        url: url,
                        type: "post",
                        dataType: "json",
                        data: data,
                        success: function(tem) {
                            if (tem.code === 200) {
                                notify.info("删除数据成功！");
                                self.showDetectDeviceList(self.needDate.currentPage);
                                logDict.insertMedialog("m2", "删除" + name + "设备的入网检测报告", "f5", "o3");
                            } else {
                                notify.info("删除数据失败！");
                            }
                        }
                    });
                }
            });
        }
    });
    /**
    * 下拉框
    **/
    var Seclector = new Class({

        Implements: [Events, Options],

        options: {
            //容器
            container: null,
            //默认输入内容
            inputDefauleText: "--请输入--",
            //下拉框内容
            select: null,
            //当前选中下拉内容
            activeKey: "",
            //是否需要iframe
            isIframe: false,
            //是否可选择
            isSelect: true,
            // 下拉框的宽度
            width:null,
            //选中后回调函数
            callback: function(){

            }
        },

        initialize: function(options){

            this.setOptions(options);
            this.options.container.empty().append(this.getSelectorHtml());
            if(options.width){
                this.options.container.find(".x-selector-input").css({"width":options.width+"px"});
                this.options.container.find(".x-selector-input .x-selector-text").css({"width":options.width-20 +"px"});
                this.options.container.find(".x-selector-ul").css({"width":(options.width+20)+"px"});
            }
            //动态设置iframe的高度
            if(this.options.isIframe){
                var length = 0;
                for(var key in this.options.select){
                    length += 1;
                }
                var height = 43 * length;
                if(height>320){
                    height = 320;
                }
                this.options.container.find(".x-selector-iframe").height(height);
                if(options.width){

                }
            }

            this.bindEvents();
        },
        /**
        * 获取下拉框内容
        **/
        getSelectorHtml: function(){
            var lis = "", select = this.options.select, activeValue = "";

            for(var key in select){
                var li = '<li title='+select[key]+' data='+key+'>'+select[key]+'</li>';
                if(key === this.options.activeKey){
                    li = '<li title='+select[key]+' data='+key+' class="active">'+select[key]+'</li>';
                    activeValue = select[key];
                }
                lis += li;
            }
            var value = activeValue?activeValue:this.options.inputDefauleText;
            var template = '<div class="x-selector">'+
                                '<div class="x-selector-input clearfix">'+
                                    '<span class="x-selector-text" title="'+value+'">'+value+'</span>'+
                                    '<span class="x-selector-arrow"></span>'+
                                '</div>'+
                                '<ul class="x-selector-ul">'+lis+
                                '</ul>'+
                            '</div>';
            if(this.options.isIframe){
                template += '<iframe src="" class="x-selector-iframe"></iframe>';
            }
            return jQuery(template);
        },

        //事件绑定
        bindEvents: function(){
            var self = this;
            if(self.options.isSelect)
            {
                //点击输入框
                this.options.container.find(".x-selector-input").click(function(){
                    var Next = jQuery(this).next();
                    if(Next.is(":visible")){
                        jQuery(this).next().slideUp();
                        if(self.options.isIframe){
                            self.options.container.find(".x-selector-iframe").slideUp();
                        }
                    }else{
                        //隐藏其他的iframe和下拉内容
                        jQuery(".x-selector-iframe,.x-selector-ul,.select-device-container").css({"display": "none"});
                        //显示当前的iframe和下拉内容
                        if(self.options.isIframe){
                            self.options.container.find(".x-selector-iframe").slideDown();
                        }
                        jQuery(this).next().slideDown();
                    }
                });
                //点击下拉内容
                this.options.container.find(".x-selector-ul li").click(function(){
                    var This = jQuery(this), value = This.attr("title");
                    //选中样式渲染
                    This.addClass("active").siblings().removeClass("active");
                    //将选中内容放入输入框
                    var Input = self.options.container.find(".x-selector-input .x-selector-text");
                    Input.html(value).attr("title", value);
                    //绑定回调
                    self.options.callback(This);
                    //收起下拉框
                    This.parent().slideUp();
                    if(self.options.isIframe){
                        self.options.container.find(".x-selector-iframe").slideUp();
                    }
                });

                // 当鼠标移出下拉框的时候，下拉框收起

                jQuery(".select-device-container").hover(function(){},function(){
                    //jQuery(".select-device-container").slideUp();
                });
                this.options.container.find(".x-selector-ul").hover(function(){
                },function(){
                    self.options.container.find(".x-selector-ul").slideUp();
                    if(self.options.isIframe){
                        self.options.container.find(".x-selector-iframe").slideUp();
                    };
                });

            }
        }
    });
    jQuery(function(){

        jQuery.ajaxSetup({
            cache: false
        });

        jQuery(document).on('focus', '.input-time', function() {
                var self = this;
                jQuery(self).datetimepicker({
                    showSecond: true,
                    dateFormat: 'yy-mm-dd',
                    timeFormat: 'HH:mm:ss',
                    changeYear: false,
                    yearRange: "1970:2050",
                    hideIfNoPrevNext :false,
                    showAnim: '',
                    timeText: '',
                    hourText: ' 时:',
                    minuteText: ' 分:',
                    secondText: ' 秒:'
                });
        });

        Global={
            itemsPerPage:10,//每页的条数

            // 分页的方法
            setPagination: function(total, selector, itemsPerPage, callback) {
                jQuery(selector).pagination(total, {
                    items_per_page: itemsPerPage,
                    num_display_entries: 4,
                    callback: function(pageIndex, jq) {
                        callback(pageIndex + 1);
                    }
                });
            }
        };
        //加载模板
        jQuery.get("/module/maintenance/netdetection/inc/netdetection_template.html", function(tem){
            if (tem) {
                var template = Handlebars.compile(tem);
                //初始化入网检测
                DetectionObj = new Detection({
                    template: template
                });
                //初始化检测管理
                DetectionMgrObj = new DetectionMgr({
                    template: template
                });
                //点击左边列表
                jQuery("#sidebar").find("li.left-li").on("click", function(){
                    var This = jQuery(this);
                    var RightHeader = jQuery(".content-header");
                    if(This.attr("data-tab") === "dectect"){
                        //修改右侧标题
                        RightHeader.html("入网检测");
                        //初始化右侧内容为入网检测
                        DetectionObj.setContent();
                        //加载下拉框
                        DetectionObj.loadSelectors();
                        DetectionObj.loadManufacturer();
                        if(DetectionObj.player1){
                            DetectionObj.player1.stopAll();
                            DetectionObj.player1 = null;
                        }
                        if(DetectionObj.player){
                            DetectionObj.player.stopAll();
                            DetectionObj.player = null;
                        }
                        DetectionObj.curselctDeviceName =null;

                        DetectionObj.reset();
                        //云台控制摄像机
                        DetectionObj.ControlCamera= null;
                        // 提交数据后台返回id，用于请求数据渲染表
                        DetectionObj.currentInfoId=null;

                        // 储存的当前选择的摄像机的信息
                        DetectionObj.curCameraInfo=null;
                        ManufactoryBool=false;
                        VersionBool=false;
                        //显示步骤一

                        $("#step-1").show();
                        //表格颜色
                        $(".detect-report table").find("tr:even").css("background-color","#f4f4f4");
                        //设置云台速度
                        jQuery(".speedSlider").slider({
                            range: 'min',
                            step: 1,
                            max: 15,
                            min: 1,
                            value: Toolkit.getPtzSpeed(),
                            change: function() {
                                var speed = jQuery(this).slider('value');
                            }
                        });
                        //加载云台事件
                        var deferred = null;
                        jQuery(".cloud-control .dir-control .dir").controlPtz({
                            deferred: deferred
                        });
                        jQuery(".ptz-adjust .adjust-wrap .adjust").controlPtz({
                            deferred: deferred
                        });
                        This.addClass("now").siblings().removeClass("now");
                        //设置右侧信息栏高度
                        var rightHeight = jQuery(document).height() - 250;
                        jQuery(".content-info").height(rightHeight);
                        jQuery(window).resize(function(){
                            var rightHeight = jQuery(document).height() - 250;
                            jQuery(".content-info").height(rightHeight);
                        });
                        //置空对象
                        DetectionObj.reset();
                    }
                    if(This.attr("data-tab") === "dectect-mgr"){
                        //修改右侧标题
                        RightHeader.html("检测管理");
                        //初始化右侧内容为检测管理
                        DetectionMgrObj.setContent();
                        //表格颜色
                        $(".dectectionMgr-info table").find("tr:even").css("background-color","#f4f4f4");

                        This.addClass("now").siblings().removeClass("now");
                        //显示被检测设备
                        DetectionMgrObj.setDate();
                        DetectionMgrObj.showDetectDeviceList(DetectionMgrObj.needDate.currentPage);
                        DetectionMgrObj.loadManufacturerAll();
                        DetectionMgrObj.getVideoVersionAll();


                    }
                });
                jQuery("#sidebar").find("li.left-li[data-tab='dectect']").trigger("click");
            }
        });


        /**
        * 云台控制
        **/
        jQuery.fn.extend({
            controlPtz: function(data) {
                jQuery(this).mousedown(function() {

                    var camera = DetectionObj.ControlCamera;
                    var self = jQuery(this);
                    var cmd = jQuery(this).data('cmd');
                    var param = '';
                    if (self.is('.adjust')) {
                        if (self.hasClass('up')) {
                            param = -1;
                        } else {
                            param = 1;
                        }
                    } else {
                        param = jQuery('.speedSlider').slider('value');
                    }

                    self.addClass('clicked');
                    self.siblings().removeClass('clicked');
                    data.deferred = gPtz.setPTZDir_Direct({
                        cameraNo: camera.name,
                        cmd: cmd,
                        param: param
                    });
                }).on('mouseup', function() {
                    var that = jQuery(this);
                    var camera = DetectionObj.ControlCamera;
                    var cmd = that.data('cmd');
                    that.removeClass('clicked');
                    data.deferred.done(function(res) {
                        if (res.code === 200) {
                            setTimeout(function() {
                                gPtz.stopPTZDir_Direct({
                                    cameraNo: camera.name,
                                    cmd: cmd
                                });
                            }, 500);
                        }
                    });
                }).on('mouseenter', function() {
                    jQuery(this).addClass('hover');
                    if (jQuery(this).is('.adjust')) {
                        jQuery(this).siblings().removeClass('hover');
                    } else {
                        jQuery(this).siblings('.dir').removeClass('hover');
                    }
                }).on('mouseleave', function() {
                    jQuery(this).removeClass('hover');
                });
            }
        });
    });
});
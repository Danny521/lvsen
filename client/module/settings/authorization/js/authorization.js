/**
 * Created by LiangChuang on 2015/4/20.
 */
define(["ajaxModel","handlebars"],function(ajaxModel){

    function Authorization(obj){
        this.uploader = obj.uploader;
        this.API = {
            tpl : "./inc/authorization.html",
            authorization : '/service/authorization/',
            upload        : '/service/authorization/'
        };
        this.init(obj);
    }

    Authorization.prototype = {
        construct : Authorization,
        init : function(){
            var self = this;

            this.bindEvent();
            this.helper();
            this.showIndex();

        },

        showIndex : function(){
            var self = this;

            $.when($.get(self.API.authorization),self.getTpl()).then(function(res,tpl){
                if(res[0] && res[0].code === 200){
                    if(!self.tpl){
                        self.tpl = Handlebars.compile(tpl[0]);
                    }
                    if(res[0].data.authInfo){
                        if((res[0].data.authInfo.validTime >= (new Date).getTime()) || res[0].data.authInfo.validTime <=0){
                            self.showAuthorization(res[0].data.authInfo);
                        }
                    }else{
                        self.isInited(true);
                        self.showUpload();
                    }
                }else{
                    notify.warn((res[0] && res[0].data && res[0].data.message) || "获取授权信息失败！");
                    self.isInited(true);
                    self.showUpload();
                }
            });
        },

        getTpl : function(){
            var self = this,
                dfd = $.Deferred();

            if(this.tpl){
                dfd.resolve(self.tpl);
                return dfd.promise();
            }
            return $.get(self.API.tpl);
        },

        showAuthorization:function(res){
            var self = this;

            res.version = window.version;

            $("#upload").removeClass("active");
            $("#authorization").html("").append(self.render(res)).addClass("active");

            if(!this.isAdmin()){
                $("#updateAuthorization").remove();
            }

            $("#loading").remove();
        },
        isAdmin : function(){
            var userId = (localStorage.getItem("userId")-0) || ($("#userEntry").attr("data-userid") - 0);

            if(!userId || userId === 1 || userId === 0){
                return true;
            }else{
                return false;
            }
        },

        showUpload : function(){
            var self = this;
            //初始化
            if(!this.isInit){
                this.uploader.init();
            }
            //setTimeout(function(){self.isInited()},10);
            $("#upload").addClass("active");
            $("#authorization").removeClass("active");
            $("#loading").remove();
        },

        // flag true 取消初始化
        isInited : function(flag){
            var obj = $("div[id$='flash_container']");

            if(!this.isInit){
                obj && obj.css("top",obj.css("top")+57);
            }

            this.isInit = true;
            if(flag){
                this.isInit = false;
            }

        },

        render : function(res){
             return this.tpl(res);
        },

        toggleUI : function(flag){

            $("#chooseFile").text("重新选择");
            if(flag){
                $(".upload img").remove();
                $(".upload").prepend('<img src="images/file.png">');
                $("#chooseFile, #submit").addClass("active");
            }else{
                $(".upload img").remove();
                $("#chooseFile, #submit").removeClass("active");
            }
        },

        helper : function(){
            var self = this;
            // 时间，毫秒到日期
            Handlebars.registerHelper("mills2str", function(value) {
                if (value) {
                    return Toolkit.mills2str(value);
                }
            });
            // 时间 处理授权有效期的特殊情况
            Handlebars.registerHelper("dateLast", function(value,then) {
                var now = (new Date).getTime();

                if(value <=0){
                    return "永久"
                }

                //var value = (new Date).getTime() + 432500000;
                if((value - now) < 432000000 && (value - now) > 0){
                    return new Handlebars.SafeString("<i class='warn'>" + Toolkit.mills2str(value) + "(还有 " + ((value - now)/1000/60/60/24).toFixed(0) + " 天过期）</i>");
                }else{
                    return Toolkit.mills2str(then) + " 至 " + Toolkit.mills2str(value);
                }
            });
            //
            Handlebars.registerHelper("license", function() {
                var args = Array.prototype.slice.call(arguments),
                    len  = args.length,
                    html  = "";

                if (len>0) {
                    for(var i=0;i<len;i++){
                        if(self.isBoolean(args[i])){
                            html += " " + self.moduleNameToString(args[i],i) + " ";
                        }
                    }
                }
                return html;
            });
            // 编号
            Handlebars.registerHelper("indexN", function(index) {
                if (index+1<10) {
                    return "0" + (index+1);
                }else{
                    return index+1;
                }
            });
        },

        isBoolean : function(obj) {
            return obj === true || obj === false || Object.prototype.toString.call(obj) === '[object Boolean]';
        },

        moduleNameToString : function(module,i){
            // 此处的顺序请和模版中的顺序保持一致
            var map = ["视频指挥","布防布控","交通管理","视图库","图像研判","运维管理"];

            if(module){
                return map[i];
            }else{
                return "";
            }
        },

        isAuthorized : function(obj){
            var o;

            if((typeof obj) === "string"){
                o = JSON.parse(obj);
                if((typeof o.response) === "string"){
                    o.response = JSON.parse(o.response);
                }
            }else{
                o = obj;
                if((typeof o.response) === "string"){
                    o.response = JSON.parse(o.response);
                }
            }

            if(o && o && o.response && o.response.code === 500){
                return false;
            }else{
                return true;
            }
        },

        bindEvent : function(){
            var self = this;

            self.uploader.bind('FileUploaded', function (up, file, res) {   

                if(self.isAuthorized(res)){
                    self.showIndex();
                    self.toggleUI();
                    notify.info("授权信息上传成功，请重新登录并使用系统！");
                }else{
                    notify.warn("文件非合法的授权文件或获取授权信息失败！");
                }
                //self.isInited(true);
            });

            //添加文件
            self.uploader.bind('FilesAdded', function (up, files) {          
             
            if(files[0].name.match(/(?=\.).*/)[0] === '.key1'){
                 self.toggleUI(true);
                //self.uploader.init();
                 self.isInited();
            } else {
                notify.error('文件非合法的授权文件或获取授权信息失败！')
            }
               
            });

            $("#submit").on("click",function(){                
                self.uploader.start();
                return false;
            });

            $("body").on("click","#updateAuthorization",function(){
                self.showUpload();
                return false;
            });

        }
    };


    return Authorization;
});
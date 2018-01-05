/*
人脸索引登陆以及导航获取
 */
require(['/require-conf.js'], function(){
    require(['jquery', 'base.self'], function(){
        var loginFaceSearch = function(){
            $.ajax({
                type : "post",
                url : "/FMWeb/user/login.ser",
                timeout : 5000,//设置5S超时
                data :{
                    "username" : "admin",
                    "password" : "admin"
                },
                dataType : "json",
                success : function(data){
                    $('#faceSearch .faceSearchContent').attr('src', '/FMWeb/pva.htm#');
                },
                error : function(XMLHttpRequest,textStatus,errorThrown){
                    if (XMLHttpRequest.status === 404) {
                        notify.warn("服务连接失败");
                    }
                },
                complete: function(XMLHttpRequest, status) {　
                    if (status == 'timeout') { 　　　　　　　
                        notify.warn("连接服务超时");　　　
                    }
                }
            })
        };
        loginFaceSearch();

    })
});
require(['/require-conf.js'], function(){
    require(['domReady'], function(domReady){
        domReady(function(){
            require([
                '/module/imagejudge/resource-process/js/smartmark-look.js',
                'permission',
                'base.self'
            ], function(SmartMarkLookPanel, permission){
                var data =eval('(' + Cookie.read("overlayPlayerData") + ')');
                var origVideoInfo= {
                        id : parseInt(data.id),      // 当前视频id
                        fileName : data.name,       //当前视频名称
                        vid: data.vid,
                        fileUrl: data.fileUrl,      // 文件路径
                        resource: data.resource,    // 来源
                        shoottime: data.shoottime,  // 拍摄时间
                        isClue: data.isClue         //是否可以生成线索
                }
                //初始化智能标注结果弹出扩展屏内容
                new SmartMarkLookPanel({
                        'origVideoInfo' : origVideoInfo
                    });
                //权限控制
                setTimeout(function () {
                        permission.reShow();
                    }, 1000); // 权限控制
            })
        })
    })
})
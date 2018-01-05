require(['/require-conf.js'], function(){
    require([
        'js/home.js',
        'domReady',
        'permission'
    ], function (doubtlibHome,domReady) {
        domReady(function () {
        	jQuery("html,body").css({
                "overflow-y":"auto",
                height:"100%"
            });
            doubtlibHome.initialize();
        });
    });
});

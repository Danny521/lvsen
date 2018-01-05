require(['/require-conf.js'], function(){
    require([
        'domReady',
        'permission'
    ], function (domReady) {
        domReady(function () {
            jQuery("html,body").css({
                "overflow-y":"auto",
                height:"100%"
            })
            require([
                'js/workbenchController'
            ], function(workbench){
                workbench.init();
            })
        });
    });
})

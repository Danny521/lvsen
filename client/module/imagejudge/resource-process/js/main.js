require(['/require-conf.js'], function(){
    require(['domReady'], function(domReady){
        domReady(function(){
            require([
                'permission',
                'main',
                'js/imageReq',
                'js/gImage',
                'js/import',
                'js/public'
            ]);
        })
    })
})

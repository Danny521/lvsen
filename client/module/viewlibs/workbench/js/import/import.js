require(['/require-conf.js'], function(){
    require(['domReady'], function(domReady){
        domReady(function(){
            require([
                'base.self',
                'permission',
                'jquery.validate',
                'js/import/download'
            ]);
        })
    })
})

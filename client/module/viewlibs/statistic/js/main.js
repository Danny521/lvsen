require(['/require-conf.js'], function(){
    require([
        'domReady',
        'permission'
    ], function(domReady){
        domReady(function(){
            require([
                'js/view/charms-bar',
                'js/view/view',
                'js/controller/controller'
            ], function(charmsBar, view, controller){
                charmsBar.randerPie();
                view.bindEvent();
                controller.init(view);
            })
        })
    })
})

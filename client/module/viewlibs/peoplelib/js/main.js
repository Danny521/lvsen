require(['/require-conf.js'], function(){
    require([
        'js/home.js',
        'domReady',
        'menu',
        'permission'
    ], function (peoplelibHome,domReady) {
        domReady(function () {
            peoplelibHome.initialize();
        });
    });
});
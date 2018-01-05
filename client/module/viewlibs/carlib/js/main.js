require(['/require-conf.js'], function(){
    require([
        'js/home.js',
        'domReady',
        'permission'
    ], function (carlibHome,domReady) {
        domReady(function () {
            carlibHome.initialize();
        });
    });
});

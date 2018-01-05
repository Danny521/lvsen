require(['/require-conf.js'], function(){
    require([
        'js/home.js',
        'domReady'
    ], function (caseHome,domReady) {
        domReady(function () {
            caseHome.initialize();
        });
    });
});

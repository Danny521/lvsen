require(['/require-conf.js'], function(){
    require([
        '/module/viewlibs/search/js/search.js',
        'domReady',
        'permission'
    ], function (search,domReady) {
        domReady(function () {
            search.initialize();
        });
    });
});

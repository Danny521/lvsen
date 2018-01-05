require(['/require-conf.js'], function(){
    require([
        'js/init.js',
        'domReady',
        'permission'
    ], function (init,domReady) {
        domReady(function(){
			init($('#content'));
		});
    });
});

require(['/require-conf.js'], function(){
    require([
        '/module/viewlibs/details/struct/js/init-struct.js',
		'domReady',
        // 'menu',
        'permission'
    ], function (init,domReady) {
        domReady(function(){
        	var params = Toolkit.paramOfUrl(); 
            if (params.cameraChannelId) {
                jQuery(".search").hide();
            }
			init($('#content'));
		});
    });
});

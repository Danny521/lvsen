require(['/require-conf.js'], function(){
    require(['/module/viewlibs/details/media/js/initVideo.js','domReady'], function(init,domReady) {
        domReady(function(){
            init($('#content'));
        });
    });

});

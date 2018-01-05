require(['/require-conf.js'], function(){
    require(['domReady'], function(domReady){
        domReady(function(){
            require([
                '/module/viewlibs/caselib/js/player.js',
                '/module/viewlibs/workbench/js/import/load_common.js'
            ],function(Mplayer){
                window.Mplayer = Mplayer;
            });
        });
    });
});
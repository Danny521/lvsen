define(['/lbsplat/module/commanddispatch/scene-tagging/js/map-tagging-view.js',
    'jquery'
], function(View) {
    return (function(scope, $) {
        //初始化页面
        scope.init = function() {
        	$("#setPointToMap").on('click', function() {
                View.addtagMarker();
            });
            View.init($(".flat-map"), $("#content"), map);
        };
        scope.platStopFun = function(){
            require(["/lbsplat/module/commanddispatch/scene-tagging/js/scene-image-display-view.js"], function(sceneDispaly){
                sceneDispaly.changePlayStop("stop");
            });
        };
        scope.platPlayFun = function(){
            require(["/lbsplat/module/commanddispatch/scene-tagging/js/scene-image-display-view.js"], function(sceneDispaly){
                sceneDispaly.changePlayStop("play");
            });
        }
        return scope;
    }({}, jQuery));
});

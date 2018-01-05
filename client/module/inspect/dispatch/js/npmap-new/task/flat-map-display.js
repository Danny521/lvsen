define(['/lbsplat/module/commanddispatch/scene-tagging/js/plat-map-view.js',
    'jquery'
], function(View) {

    return (function(scope, $) {
        var _isShow = false;
        //初始化页面
        scope.init = function() {
            View.init($("#content"), map);
            View.displayPlatMap();
        };
        scope.hide = function() {
            View.hideTagMarkers();
        };
        scope.showHidePlatMap = function() {
            if (!_isShow) {
                scope.init();
                _isShow = true;
            } else {
                scope.hide();
                _isShow = false;
            }
        };
        return scope;
    }({}, jQuery));
});
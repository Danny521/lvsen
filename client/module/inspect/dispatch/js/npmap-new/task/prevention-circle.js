/**
 * 防控圈
 * @author SongJiang
 * @date   2015-11-09
 * @param  {[type]} View [description]
 * @param  {[type]} OverlayerCtrl [description]
 */
define([
	'/lbsplat/module/commanddispatch/prevention-circle/js/prevention-circle-view.js',
	'js/npmap-new/map-common-overlayer-ctrl'
], function(View, OverlayerCtrl) {
	return (function(scope, $) {
		scope.init = function() {
			View.init($(".defence-circle"), map ,"<i class='sidebar-home-icon np-map-overlay home-enable-click' data-mark='business'></i><b> &gt; </b>");
		};
		return scope;
	}({}, jQuery));
});
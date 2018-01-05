/**
 * 全景追逃
 * @author Li Dan
 * @date   2015-10-15
 * @param  {[type]}   ){} [description]
 * @return {[type]}         [description]
 */
define(['/lbsplat/module/commanddispatch/panoramic-pursuit/js/panoramic-pursuit-pack.js','npmapConfig'], function(Pack) {

	return (function (scope) {
		var _fullViewMap = null,
			// 全景追逃小地图初始化回调方法
			_callbackFullViewMapInit = function (mapContainer) {
				//初始化地图
				_fullViewMap = mapConfig.initMap(mapContainer);
				return _fullViewMap;
			};
		//初始化
		scope.init = function () {
			Pack.init(map, $("#gismap"), _callbackFullViewMapInit, "PVA");
		};
		scope.cancelFullView = function () {
			Pack.cancelFullView();
		};
		scope.activeMouseContext = function () {
			Pack.activeMouseContext();
		};
		scope.isFullview = function () {
			return Pack.isFullview();
		};
		return scope;
	})({});
});

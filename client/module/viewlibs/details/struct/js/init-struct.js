/**
 * [结构化信息详情渲染单页面初始化]
 * @author limengmeng
 * @date   2014-12-26
 * @return {[type]}   [description]
 */
define([
	'/module/viewlibs/details/struct/js/controller.js',
	'base.self'
], function(MediaLoaderController) {
	function init(domNode, initParams) {
		$('head').append();
		var modUrl = '';
		var params = Toolkit.paramOfUrl(initParams);
		switch (params.origntype) {
			case "car":
				if (params.sign === "realtime") {
					modUrl = '/module/viewlibs/details/struct/inc/realtime_car.html';
				} else {
					modUrl = '/module/viewlibs/details/struct/inc/car.html';
				}
				break;
			case "exhibit":
				modUrl = '/module/viewlibs/details/struct/inc/exhibit.html';
				break;
			case "move":
				modUrl = '/module/viewlibs/details/struct/inc/move.html';
				break;
			case "others":
				modUrl = '/module/viewlibs/details/struct/inc/others.html';
				break;
			case "person":
				modUrl = '/module/viewlibs/details/struct/inc/person.html';
				break;
			case "scene":
				modUrl = '/module/viewlibs/details/struct/inc/scene.html';
				break;
			case "face":
				modUrl = '/module/viewlibs/details/struct/inc/face.html';
				break;
			case "body":
				modUrl = '/module/viewlibs/details/struct/inc/body.html';
				break;
		};
		$.get(modUrl).then(function(data) {
			domNode.html(data);
			var MediaLoaderControllerInit = new MediaLoaderController();
			MediaLoaderControllerInit.initialize(initParams);
		});
	}
	return init;
});
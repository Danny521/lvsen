/**
 * [图片详情渲染单页面初始化]
 * @author limengmeng
 * @date   2014-12-26
 * @return {[type]}   [description]
 */
define(['/module/viewlibs/details/media/js/picView.js',
		'/module/viewlibs/details/media/js/picController.js'], function(ImgView,picController) {
	function init(domNode, initParams){
		$('head').append()
		$.get('/module/viewlibs/details/media/inc/picture.html').then(function(data){
			domNode.html(data);
			ImgView.initialize(initParams);
			picController.bindEvents(initParams);
		});
	}
	return init;
});

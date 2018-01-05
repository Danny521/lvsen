/**
 * [视频详情渲染单页面初始化]
 * @author limengmeng
 * @date   2014-12-26
 * @return {[type]}   [description]
 */
define(['/module/viewlibs/details/media/js/videoView.js',
		'/module/viewlibs/details/media/js/videoController.js'], function(videoView,videoController) {
	function init(domNode, initParams){
		//$('head').append()
		$.get('/module/viewlibs/details/media/inc/video.html').then(function(data){
			domNode.html(data);
			videoView.initialize(initParams);
			videoController.bindEvents(initParams);
		});
	}
	return init;
});

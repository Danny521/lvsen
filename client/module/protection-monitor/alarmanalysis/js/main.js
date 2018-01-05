define([], function() {
	require(['./js/view/main-view','domReady','base.self','permission'],function(mainView,domReady){
		/**
		 * 页面初始化
		 */
		(function init() {
			mainView.init();
		})();
		//页面加载完成后再执行
		domReady(function(){
		});
	});
});

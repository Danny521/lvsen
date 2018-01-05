/**
 * Created by Leon.z 2015-8-20
 * 报警管理的主入口函数，读取requirejs配置
 */
define([],function () {
	require(['./js/view/main-view','domReady','base.self'
	], function (mainView, ready) {
		ready(function () {
			//初始化页面主入口
			mainView.init();
		});
	});
});
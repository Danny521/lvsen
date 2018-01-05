define([
	"jquery",
	"js/sidebar/sidebar-init-controller",
	"js/common-register-helper",
	"js/init-from-monitor",
	"/component/base/self/check.player.js"
], function(jQuery, Sidebar) {
	//初始化左侧面板
	Sidebar.init();

	//判断是否是门户网站链接，如果是，则需要跳转至对应的模块, 传递默认加载函数
	window.PortalLinks(function () {
		//默认加载左侧第一个tab
		jQuery("#sidebar").find(".sidebar-header li a:first").trigger("click");
	});

	//初始化地图
	require([
		"js/npmap-new/controller/map-init-controller"
	], function(MapController) {
		MapController.init();
	});

	require([
		"js/left-right-handler"
	], function(Handler) {
		//初始化左侧、右侧关联逻辑
		Handler.init();
	});

	//加载controlbar,地图信息窗上的录像使用
	require(["/module/inspect/monitor/js/controlbar.js"]);
});
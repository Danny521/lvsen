define(["jquery", "pvaConfig", "menu", "/component/base/self/loginout.js"], function($) {

	/**
	 * 公共函数，供iframe里面的页面调用,bug[37719]
	 * 查看图片弹出层时，由于在iframe子页面里面，不能遮罩住导航，而将显示逻辑移入iframe外面由不能遮住ocx
	 * 故出此下策，在iframe页面添加公共函数，在子页面调用时，触发此函数，来实现导航的隐藏与显示
	 * @param  {[type]} type [description]
	 * @return {[type]}      [description]
	 */
	window.showHideNav = function(type) {
		if (type === "hide") {
			$(".iframe").css({
				"top": "0px"
			});
			$("#navigator, #header").hide();
		} else {
			$(".iframe").css({
				"top": "86px"
			});
			$("#navigator, #header").show();
		}
	};
	/**
	 * 公共函数，供iframe里面的页面调用,解决在子页面全屏的情况下，弹出遮罩层，此时页面上方则会出现nav-cover-layout，故加此函数进行判断
	 * @param  {[type]} type [description]
	 * @return {[type]}      [description]
	 */
	window.showHideMasker = function(type) {
		if (type === "hide") {
			$(".nav-cover-layout").hide();
			$(".nav-cover-layout2").hide();
		} else {
			if($("#navigator, #header").is(":visible")){
				$(".nav-cover-layout").show();
				$(".nav-cover-layout2").show();
			}
		}
	};

	//定制化PVA网站标题头
	document.title = window.htmlPageTitle;

	//定制以及导航左上角的主题名字
	$("#logo").text(window.mainPageTitle);
});
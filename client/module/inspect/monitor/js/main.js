/*-----------------------------------start------------------------------------------*/
/**
 * 这部分代码放在此处主要是为了解决ocx加载完成分屏切换的延迟
 * [当前用户如果拥有的布局权限种有4分屏，就默认4分屏，如果么有4分配，就按照他拥有的最大的分屏权限显示。]
 * @author Mayue
 * @date   2015-04-08
 */
function getDefaultLayout() {
	if (!localStorage || !localStorage.validFunctionListMap) {
		return 4;
	}
	//获取权限
	var permission = JSON.parse(localStorage.validFunctionListMap);
	//根据实际情况定义分屏设置
	var layout = 1;
	if (permission["sixteen-channel"] === "sixteen-channel") {
		layout = 4;
	}
	if (permission["nine-channel"] === "nine-channel") {
		layout = 4;
	}
	if (permission["four-channel"] === "four-channel") {
		layout = 4;
	}

	if ((layout !== 4) && permission["one-channel"] === "one-channel") {
		layout = 1;
	}
	return layout;
}

document.getElementById("UIOCX").SetLayout(getDefaultLayout());

/*-----------------------------------end------------------------------------------*/

require(["permission"], function() {
	require(["js/video-monitor"]);
	require(["js/inspect"]);
	//require(["/libs/md5/md5.js"]);
	//require(["/libs/jquery/jquery.onent.js"]);
	require(["/module/ptz-controller/win-dialog.js"]);
});
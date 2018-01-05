/**
 * 系统侧边栏的控制逻辑
 * @authors yuqiu (yuqiu_xa@netposa.com)
 * @date    2015-01-15 14:28:43
 * @version $Id$
 */

define(["jquery"], function() {
	var sidebar = jQuery("#sidebar"),
		content = jQuery("#content"),
		width = sidebar.width(),
		watchDate = +new Date(), //用来函数节流的。
		pubsub;
	//下面是为了解决 树的统计及时更改渲染问题，不要随便删除。 --- 添加于秋。
	require(["pubsub"], function (PubSub) {
		pubsub = PubSub;
	});

	var resizePlayer = function () {
		var $screen = jQuery(".screen"),
			$ocxObj = jQuery(".UIOCX"),
			playerWidth = $screen.width(), //视频容器的宽度
			playerHeight = $screen.height(); //视频容器的高度
		$ocxObj.width(playerWidth);
		$ocxObj.height(playerHeight);
	};

	// 边栏收缩/打开效果
	jQuery("#sideExpand").click(function () {
		if (sidebar.css("left").toInt() === 0) {
			width = sidebar.width();
			sidebar.css("left", -width);
			content.addClass("fullscreen");
			if (jQuery(".UIOCX")[0]) {
				resizePlayer();
			}
		} else {
			sidebar.css("left", 0);
			content.removeClass("fullscreen");
			if (jQuery(".UIOCX")[0]) {
				resizePlayer();
			}
		}
	});

	// 重置边栏大小
	var width = 280,
		major = jQuery("#major"),
		body = jQuery("body");
	//hu 修改拖动问题
	var mousedown = false;
	var x0 = 0;
	var y0 = 0;
	var left = 0;
	var top = 0;
	var sidebar_w = 0;
	var major_left = 0;

	jQuery(document).on("mousedown", "#sideResize", function (evt) {
		mousedown = true;
		watchDate = +new Date();
		x0 = evt.clientX;
		y0 = evt.clientY;
		left = jQuery("#sideResize").css("left");
		top = jQuery("#sideResize").css("top");
		left = parseInt(left);
		top = parseInt(top);
		sidebar_w = sidebar.width();
		major_left = parseInt(major.css("left"));
		var opacity = "filter:alpha(opacity=0);-moz-opacity:0;opacity:0;",
			mleft = major.offset().left,
			mtop = major.offset().top,
			mwidth = major.width(),
			mheight = major.height();

		var html = "<div id='major-mask' style='" + opacity + "background-color:white;position:absolute;left:" + mleft + "px;top:" + mtop + "px;'></div>";
		jQuery(document.body).append(html);

		jQuery("#major-mask").css({
			left: mleft,
			top: mtop,
			width: mwidth,
			height: mheight
		});
		//jQuery("#sideResize iframe").attr("src",maskurl);
	});

	jQuery(document).on("mousemove", function (evt) {

		if (mousedown) {
			var x = evt.clientX;
			var xx = left + x - x0;
			if (xx < 280) {
				xx = 280
			} else if (xx > 425) {
				xx = 425
			}

			jQuery("#sideResize").css("left", xx);
			sidebar.css("width", xx);
			major.css("left", xx);
			//下面是为了解决 树的统计及时更改渲染问题，不要随便删除。 --- 添加于秋。
			if (+new Date() - watchDate > 200) {
				watchDate = +new Date();
				pubsub.publish("watchContainer");
			}
		}
	});

	jQuery(document).on("mouseup", function () {

		jQuery("#major-mask").remove();

		if (mousedown) {
			pubsub.publish("watchContainer");
			//考虑到布防布控、视频指挥、运维、系统配置均使用到了地图，原来的判断已经不能满足，故在初始化地图时对外暴露地图对象，以便在拖动slidebar时统一控制，鼠标跟随文字可以自适应，by zhangyu on 2015/4/1
			if (typeof(window.map) == "object") {
				if (jQuery("#mapId")[0]) {
					window.map.updateSize();
				}
			}

			if (jQuery(".UIOCX")[0]) {
				resizePlayer();
			} //播放器resize

			setTimeout(function () {
				body.hide().show();
			}, 10);
		}
		mousedown = false;
	});
});
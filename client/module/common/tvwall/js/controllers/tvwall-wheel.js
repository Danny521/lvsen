/**
 * [电视墙缩放、双击上墙悬浮窗]
 * @author wumengmeng
 * @date   2014-10-30
 * @param  {[type]}   $ [description]
 * @return {[type]}     [description]
 */
define([
	"domReady",
	"base.self"
], function(domReady) {
	/**
	 * [$$$ 原生方法获取dom]
	 * @author wumengmeng
	 * @date   2015-02-05
	 * @param  {[type]}   i [元素节点]
	 * @return {[type]}     [description]
	 */
	var $$$ = function(i) {
		return document.getElementById(i);
	};
	/**
	 * [stopEvent 事件停止处理方法]
	 * @author wumengmeng
	 * @date   2015-02-05
	 * @param  {[type]}   e [description]
	 * @return {[type]}     [description]
	 */
	function stopEvent(e) {
			e = e || event;
			if (e.preventDefault) {
				e.preventDefault();
			}
			e.returnValue = false;
		}
		/*
		 * 禁掉右键菜单
		 */
	jQuery("#lyLishow").on("contextmenu", function(e) {
		return false;
	});
	/**
	 * [resizeEvent 缩放事件绑定]
	 * @author wumengmeng
	 * @date   2015-02-05
	 * @param  {[type]}   event [description]
	 * @return {[type]}         [description]
	 */
	function resizeEvent(event) {
		var img = $$$('autoMousewheel'); //没有修复ie的this指向，所以这里只好重新获取img

		var zoom = "";
		if ('MozTransform' in img.style) {
			if (event.detail > 0) {
				$(img).css("-moz-transform", "scale(0.5, 0.5)");
				$(img).css("-moz-transform-origin", "top left");
			} else {
				$(img).css("-moz-transform", "scale(1.5, 1.5)");
				$(img).css("-moz-transform-origin", "top left");
			}
		} else {
			zoom = parseInt(img.style.zoom, 10) || 100;
			var changeZoom = event.wheelDelta;
			zoom += changeZoom / 10;
			if (window.navigator.userAgent.indexOf("Chrome") !== -1) {
				if (zoom > 89 && zoom < 300) {
					img.style.zoom = zoom + '%';
					$(img).css("z-index", "100");
				}
			} else {
				if (zoom > 10 && zoom < 300) {
					img.style.zoom = zoom + '%';
					$(img).css("z-index", "100");
				}
			}

		}
	}

	//绑定事件,这里对mousewheel做了判断,注册时统一使用mousewheel
	function addEvent(obj, type, fn) {
		var isFirefox = typeof document.body.style.MozUserSelect !== 'undefined';
		if (!obj) {
			return;
		}
		if (obj.addEventListener) {
			obj.addEventListener(isFirefox ? 'DOMMouseScroll' : type, fn, false);
		} else {
			obj.attachEvent('on' + type, fn);
		}
		return fn;
	}

	if (!(navigator.appName === 'Microsoft Internet Explorer' && navigator.appVersion.indexOf('MSIE 8') !== -1)) {
		addEvent($$$('autoMousewheel'), 'mousewheel', function(event) {
			stopEvent(event);
			event = window.event || event;
			var node=event.srcElement||event.target;
			var node=jQuery(node);
			var Flag=false;
			if(node.hasClass("onwalled")||node.hasClass("channel")||node.hasClass("tvList")||node.hasClass("downwalled")){
				Flag=true;
			}
			if(Flag==false){
				return;
			}
			resizeEvent(event);
			return false;
		});

		addEvent($$$('major'), 'mousewheel', function(event) {
			stopEvent(event);
			event = window.event || event;
			var node=event.srcElement||event.target;
			var node=jQuery(node);
			var Flag=false;
			if(node.hasClass("onwalled")||node.hasClass("channel")||node.hasClass("tvList")||node.hasClass("downwalled")){
				Flag=true;
			}
			if(Flag==false){
				return;
			}
			resizeEvent(event);
			return false;
		});
	}



	var mouseTip = new Class({
		Implements: [Events, Options],
		options: {
			xOffset: 34,
			yOffset: -265,
			mousetipContain: $('.tvList'),
			showMess: "请双击设备布局上墙,右键取消！"
		},
		makeTip: function() {
			var that = this;
			that.options.mousetipContain.append("<div id='preview'>" + that.options.showMess + "</div>");
		},
		fixCss: function(evt) {
			var that = this;
			$("#preview")
				.css("top", (evt.pageY - that.options.xOffset) + "px")
				.css("z-index", "1000")
				.css("left", (evt.pageX + that.options.yOffset) + "px")
				.fadeIn("slow");
		},
		bindEvents: function() {
			var that = this;
			if (that.options.mousetipContain) {
				that.makeTip();
				that.options.mousetipContain.mousemove(function(evt) {
					that.fixCss(evt);
				});

				that.options.mousetipContain.on("mousedown", function(evt) {
					var e = evt || window.event;
					if (e.button === 2 && $("#preview") && $("#preview").length !== 0) {
						$("#preview").remove();
						window.gTvwallArrayGis = [];
					}
				});
			}


		}
	});
	return mouseTip;
});

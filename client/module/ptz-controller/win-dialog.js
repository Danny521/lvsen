/* 
* @Author: Administrator
* @Date:   2015-04-21 19:24:03
* @Last Modified by:   Administrator
* @Last Modified time: 2015-07-17 09:59:54
*/
define(['jquery-ui','base.self'],function(){

	// 各种浏览器兼容
	var hidden, state, visibilityChange; 
	if (typeof document.hidden !== "undefined") {
		hidden = "hidden";
		visibilityChange = "visibilitychange";
		state = "visibilityState";
	} else if (typeof document.mozHidden !== "undefined") {
		hidden = "mozHidden";
		visibilityChange = "mozvisibilitychange";
		state = "mozVisibilityState";
	} else if (typeof document.msHidden !== "undefined") {
		hidden = "msHidden";
		visibilityChange = "msvisibilitychange";
		state = "msVisibilityState";
	} else if (typeof document.webkitHidden !== "undefined") {
		hidden = "webkitHidden";
		visibilityChange = "webkitvisibilitychange";
		state = "webkitVisibilityState";
	}
	// 添加监听器，监听页面是否可见，设置播放器弹出对话框的的状态
	document.addEventListener(visibilityChange, function(evt) {
		var state=document.visibilityState;
		state=state||document.mozVisibilityState;
		state=state||document.msVisibilityState;
		state=state||document.webkitVisibilityState;
		var Flag=(state=="visible")?true:false;
		var stype=JSON.stringify({"show":Flag});
		var playerDom=document.getElementById("UIOCX");
		try{
			playerDom.ExeScript(-1, "", stype);
		}catch(e){
			//notify.warn('请安装最新版ocx');
		}
	}, false);
	/**
	 * [setDrag 拖动元素的封装]
	 * @author huzc
	 * @date   2015-07-17
	 * @param  {[json]}   options [拖动的参数]
	 */
	var setDrag=function(options) {
		var x0 = 0;
		var y0 = 0;
		var left = 0;
		var top = 0;
		var mousedown = false;

		function ParamInit() {
			if (typeof(options.minx) == "function") {
				options.minx = options.minx();
			}
			if (typeof(options.maxx) == "function") {
				options.maxx = options.maxx();
			}
			if (typeof(options.miny) == "function") {
				options.miny = options.miny();
			}
			if (typeof(options.maxy) == "function") {
				options.maxy = options.maxy();
			}
		}

		jQuery(options.container).on("mousedown", options.dragTarget, function(evt) {
			evt.stopPropagation();
			evt.preventDefault();
			x0 = evt.clientX;
			y0 = evt.clientY;
			left = jQuery(options.moveTarget).css("left");
			top = jQuery(options.moveTarget).css("top");
			left = parseInt(left);
			top = parseInt(top);
			mousedown = true;
			if (options.ondragstart) {
				options.ondragstart(x0, y0);
			}
			//console.log("mousedown");
		});

		jQuery(options.container).on("mousemove", function(evt) {
			evt.stopPropagation();
			evt.preventDefault();
			if (mousedown) {
				var x = evt.clientX;
				var y = evt.clientY;
				if (typeof(options.minx) == "function") {
					options.minx = options.minx();
				}
				if (typeof(options.maxx) == "function") {
					options.maxx = options.maxx();
				}
				if (typeof(options.miny) == "function") {
					options.miny = options.miny();
				}
				if (typeof(options.maxy) == "function") {
					options.maxy = options.maxy();
				}

				if (options && options.x) {
					var xx = left + x - x0;
					if (options.minx !== null && xx < options.minx) {
						xx = options.minx;
					}
					if (options.maxx !== null && xx > options.maxx) {
						xx = options.maxx;
					}
					jQuery(options.moveTarget).css("left", xx);
				}
				
				if (options && options.y) {
					var yy = top + y - y0;
					if (options.miny && yy < options.miny) {
						yy = options.miny;
					}
					if (options.maxy && yy > options.maxy) {
						yy = options.maxy;
					}
					jQuery(options.moveTarget).css("top", yy);
				}
				if (options.ondraging) {
					options.ondraging(x0, y0, x, y, x - x0);
				}
			}
		});
		var mouseout = "";
		if (options.mouseout) {
			mouseout = " mouseout";
		}
		//options.dragTarget
		jQuery(options.container).on("mouseup" + mouseout, function(evt) {
			var x = evt.clientX;
			var y = evt.clientY;
			evt.stopPropagation();
			/**
			 * bug[30656],不知道下面绑定作何用处，注释掉之后目前测试未发现问题，by zhangyu on 2015/5/28
			 */
			//evt.preventDefault();
			if (mousedown === true && options.ondragend) {
				options.ondragend(x0, y0, x, y, x - x0);
			}
			mousedown = false;		
		});

	};

	jQuery(document).on("click",".win-dialog div.win-dialog-title span.close",function(){
		jQuery(this).parent().parent().remove();
	});	

	//绑定拖动事件
	setDrag({
		container: document,
		dragTarget: ".win-dialog-title",
		moveTarget: ".win-dialog",
		x: true,
		y:true,
		ondragstart: function(x0, y0) {

		},
		ondraging: function(x0, y0, x, y, dx) {

		},
		ondragend: function(x0, y0, x, y, dx) {

		}
	});	

	setDrag({
		container: document,
		dragTarget: ".dialog-history.filedir .dialog-title",
		moveTarget: ".dialog-history.filedir",
		x: true,
		y:true,
		ondragstart: function(x0, y0) {

		},
		ondraging: function(x0, y0, x, y, dx) {

		},
		ondragend: function(x0, y0, x, y, dx) {

		}
	});	

	setDrag({
		container: document,
		dragTarget: ".dialog-history.postform .dialog-title",
		moveTarget: ".dialog-history.postform",
		x: true,
		y:true,
		ondragstart: function(x0, y0) {
			
		},
		ondraging: function(x0, y0, x, y, dx) {
			
		},
		ondragend: function(x0, y0, x, y, dx) {
			
		}
	});
	return setDrag;
});


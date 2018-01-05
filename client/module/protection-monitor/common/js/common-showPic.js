/**
 * 布防任务中，查看大图新处理办法
 * create by Leon.z
 * date 2015.7.1
 */

define(['jquery'], function(jQuery) {
	var index = 0,
		index1 = 0, //静态数据
		deg = 0, //默认翻转度
		s = 1, //横向默认放大比例
		m = 1, //纵向默认放大比例
		derx = 1,
		dery = 1, //存放缩放等级
		orgLeft = 0, //初始化图片位置距离左边距离
		orgTop = 0; //初始化图片位置距离顶部距离
		trace = {},
		dragParams = {
			posX: 0,
			posY: 0,
			bDraging: false,
			translation: function(eventType, ev) { //拖地事件
				var mx = ev.pageX,
					my = ev.pageY;
				
				if (eventType == "mousemove") {

					if (dragParams.bDraging) {
						var offsetX = mx - trace._startX;
						var offsetY = my - trace._startY;
						orgLeft = dragParams.posX = offsetX + trace._startPosX;
						orgTop = dragParams.posY = offsetY + trace._startPosY;
						jQuery(".currPic").css({
							'transform': 'scale(' + s * derx + ',' + m * dery + ') rotate(' + deg + 'deg)',
							'-webkit-transform': 'scale(' + s * derx + ',' + m * dery + ') rotate(' + deg + 'deg)',
							'-moz-transform': 'scale(' + s * derx + ',' + m * dery + ') rotate(' + deg + 'deg)',
							'-ms-transform': 'scale(' + s * derx + ',' + m * dery + ') rotate(' + deg + 'deg)',
							'-o-transform': 'scale(' + s * derx + ',' + m * dery + ') rotate(' + deg + 'deg)',
							left: orgLeft + "px",
							top: orgTop + "px"
						}).css("cursor", "move");
					}
				} else if (eventType == "mousedown") {
					dragParams.bDraging = true;
					trace._startX = mx;
					trace._startY = my;
					trace._startPosX = (dragParams.posX = dragParams.posX === 0 ? (jQuery(window).width()) / 2 - (jQuery(".currPic").width() + 8) / 2 : dragParams.posX);
					trace._startPosY = (dragParams.posY = dragParams.posY === 0 ? (jQuery(window).height()) / 2 - (jQuery(".currPic").height() + 8) / 2 : dragParams.posY);
				}
			}
		};

	function mousemoveListener(ev) {
		if (ev.which == 0) {
			jQuery(".currPic").unbind("mousemove", mousemoveListener);
			return false;
		}
		dragParams.translation("mousemove", ev);
		return false;

	}
	jQuery(document).on("mousedown", ".currPic", function(ev) {
		dragParams.translation("mousedown", ev);
		jQuery(this).bind("mousemove", mousemoveListener);
		return false;
	});
	jQuery(document).bind("mouseup", function(ev) {
		dragParams.bDraging = false;
		jQuery(".currPic").unbind("mousemove", mousemoveListener);
		dragParams.translation("mouseup", ev);
		return false;
	});
	//工具条点击处理
	jQuery(document).on("click", ".toolbar .viewer-tool", function(e) {
		var types = jQuery(this).attr("data-tool"); //工具条按钮作用标识
		orgLeft =orgLeft || jQuery(".currPic").attr('data-left');
        orgTop = orgTop || jQuery(".currPic").attr('data-top');
		var realsize = function() { //原始比例
			var orgin = jQuery(".currPic"),
				picW = orgin.width(),
				picH = orgin.height(),
				iw = jQuery(window).width(),
				ih = jQuery(window).height(),
				imgs = new Image();
			derx = 1;
			dery = 1;
			jQuery(".currPic").css({
				'transform': 'scale(' + s + ',' + m + ') rotate(' + deg + 'deg)',
				'-webkit-transform': 'scale(' + s + ',' + m + ') rotate(' + deg + 'deg)',
				'-moz-transform': 'scale(' + s + ',' + m + ') rotate(' + deg + 'deg)',
				'-ms-transform': 'scale(' + s + ',' + m + ') rotate(' + deg + 'deg)',
				'-o-transform': 'scale(' + s + ',' + m + ') rotate(' + deg + 'deg)',
				left: jQuery(".currPic").attr('data-left') + "px",
				top: jQuery(".currPic").attr('data-top') + "px"
			});
			orgLeft = jQuery(".currPic").attr('data-left');
			orgTop = jQuery(".currPic").attr('data-top');
			dragParams.posX = (jQuery(window).width() / 2) - (picW + 8) / 2;
			dragParams.posY = (jQuery(window).height() / 2) - (picH + 8) / 2;
			if (jQuery(".toolbar>div[data-tool='realsize']").hasClass('orgin')) { //如果图片处于原始比例状态，还原初始缩放比例
				jQuery(".currPic").css({
					width: jQuery(".currPic").attr('data-width') + "px",
					height: jQuery(".currPic").attr('data-height') + "px",
					left: jQuery(".currPic").attr('data-left') + "px",
					top: jQuery(".currPic").attr('data-top') + "px"
				});
				orgLeft = jQuery(".currPic").attr('data-left');
				orgTop = jQuery(".currPic").attr('data-top');
				jQuery(".toolbar>div[data-tool='realsize']").removeClass('orgin')
			} else {
				imgs.onload = function() {
					if (parseInt(picW) !== parseInt(this.width) && parseInt(picH) !== parseInt(this.height)) {
						jQuery(".toolbar>div[data-tool='realsize']").addClass("active").siblings().removeClass('active');
						jQuery(".toolbar>div[data-tool='realsize']").addClass('orgin');
						if (this.width >= iw - 100 || this.height >= ih - 100) {

							jQuery(".currPic").css({
								left: jQuery(window).width() / 2 - (this.width + 8) / 2 + 'px',
								top: jQuery(window).height() / 2 - (this.height + 8) / 2 + 'px',
								width: this.width + "px",
								height: this.height + "px",
							});
						}
						orgin.attr({
							width: this.width,
							height: this.height
						});
						dragParams.posX = 0;
						dragParams.posY = 0;
						orgLeft = jQuery(window).width() / 2 - (this.width + 8) / 2;
						orgTop = jQuery(window).height() / 2 - (this.height + 8) / 2;
					}
				}
				imgs.src = orgin.attr('src');
			}

		};
		var rotate = function() { //图片旋转
			deg += 90;
			jQuery(".currPic").css({
				'transform': 'scale(' + s * derx + ',' + m * dery + ') rotate(' + deg + 'deg)',
				'-webkit-transform': 'scale(' + s * derx + ',' + m * dery + ') rotate(' + deg + 'deg)',
				'-moz-transform': 'scale(' + s * derx + ',' + m * dery + ') rotate(' + deg + 'deg)',
				'-ms-transform': 'scale(' + s * derx + ',' + m * dery + ') rotate(' + deg + 'deg)',
				'-o-transform': 'scale(' + s * derx + ',' + m * dery + ') rotate(' + deg + 'deg)',
				left: orgLeft + "px",
				top: orgTop + "px"
			});
			jQuery(".toolbar>div[data-tool='rotate']").addClass("active").siblings().removeClass('active');
		};
		var horizontalturn = function() { //图片水平翻转
			index++;
			s = index % 2 == 0 ? 1 : -1;
			jQuery(".currPic").css({
				'transform': 'scale(' + s * derx + ',' + m * dery + ') rotate(' + deg + 'deg)',
				'-webkit-transform': 'scale(' + s * derx + ',' + m * dery + ') rotate(' + deg + 'deg)',
				'-moz-transform': 'scale(' + s * derx + ',' + m * dery + ') rotate(' + deg + 'deg)',
				'-ms-transform': 'scale(' + s * derx + ',' + m * dery + ') rotate(' + deg + 'deg)',
				'-o-transform': 'scale(' + s * derx + ',' + m * dery + ') rotate(' + deg + 'deg)',
				left: orgLeft + "px",
				top: orgTop + "px"
			});
			jQuery(".toolbar>div[data-tool='horizontalturn']").addClass("active").siblings().removeClass('active');
		};
		var verticalturn = function() { //图片垂直翻转
			index1++;
			m = index1 % 2 == 0 ? 1 : -1;
			jQuery(".currPic").css({
				'transform': 'scale(' + s * derx + ',' + m * dery + ') rotate(' + deg + 'deg)',
				'-webkit-transform': 'scale(' + s * derx + ',' + m * dery + ') rotate(' + deg + 'deg)',
				'-moz-transform': 'scale(' + s * derx + ',' + m * dery + ') rotate(' + deg + 'deg)',
				'-ms-transform': 'scale(' + s * derx + ',' + m * dery + ') rotate(' + deg + 'deg)',
				'-o-transform': 'scale(' + s * derx + ',' + m * dery + ') rotate(' + deg + 'deg)',
				left: orgLeft + "px",
				top: orgTop + "px"
			});
			jQuery(".toolbar>div[data-tool='verticalturn']").addClass("active").siblings().removeClass('active');
		};
		switch (types) {
			case "realsize":
				realsize();
				break;
			case "rotate":
				rotate();
				break;
			case "horizontalturn":
				horizontalturn();
				break;
			case "verticalturn":
				verticalturn();
				break;
		}
	});
	//初始化页面
	jQuery(document).on("click", "a.analysis", function(e) {
		e.preventDefault();
		var url = jQuery(this).attr("href") ||  jQuery(this).find("img").attr("src");
		_init(_ShowPicBox(url));
	});
	//关闭查看大图
	jQuery(document).on("click", ".checkAlarm_layout,.icon_close", function() {
		jQuery(".checkAlarm_layout").addClass("hidden");
		jQuery(".icon_close").fadeOut(0);
		jQuery(".toolbar").fadeOut(0);
		jQuery(".toolbar>div").removeClass('active');
		jQuery(".currPic").remove();
		deg = 0;    //初始所有静态数据
		index = 0;
		index1 = 0;
		derx = 1;
		dery = 1;
		s = 1;
		m = 1;
		orgLeft = 0;
		orgTop = 0;
		dragParams.bDraging = false;
		dragParams.posX = 0;
		dragParams.posY = 0;

	});
	//添加滚轮事件
	jQuery(document).on("mousewheel DOMMouseScroll", "img.currPic", function(e) {
		if (e.type === "mousewheel") {
			var p = e.originalEvent.wheelDelta / 120;
		} else if (e.type === "DOMMouseScroll") {
			var p = e.originalEvent.detail * (-1) / 3;
		}
		derx = dery = parseFloat(derx + 0.1 * p);
		if (parseFloat(derx) <= 0) {
			derx = dery = 0.1;
		}
		orgLeft = orgLeft || jQuery(".currPic").attr('data-left');
        orgTop = orgTop || jQuery(".currPic").attr('data-top');
		jQuery(this).css({
			'transform': 'scale(' + s * derx + ',' + m * dery + ') rotate(' + deg + 'deg)',
			'-webkit-transform': 'scale(' + s * derx + ',' + m * dery + ') rotate(' + deg + 'deg)',
			'-moz-transform': 'scale(' + s * derx + ',' + m * dery + ') rotate(' + deg + 'deg)',
			'-ms-transform': 'scale(' + s * derx + ',' + m * dery + ') rotate(' + deg + 'deg)',
			'-o-transform': 'scale(' + s * derx + ',' + m * dery + ') rotate(' + deg + 'deg)',
			left: orgLeft + "px",
			top: orgTop + "px"
		}).css("cursor", "move");
	});
	var _init = function(callback){
		if(jQuery(".checkAlarm_layout").length==0){
			jQuery('<div class="checkAlarm_layout"></div>').appendTo(jQuery("body"));
		}else{
			jQuery(".checkAlarm_layout").removeClass("hidden");
		}
		if(jQuery(".icon_close").length==0){
			jQuery('<div class="icon_close" style="display: block;"></div>').appendTo(jQuery("body"));
		}else{
			jQuery(".icon_close").show(0);
		}
		if(jQuery(".toolbar").length==0){
			jQuery('<div class="toolbar" style="left: 870px; bottom: 0px; display: block;"><div title = "原始大小" data-tool="realsize" class="viewer-tool" ><span class = "image-viewer-tool-realsize" > </span> </div> <div title = "旋转" data-tool = "rotate" class = "viewer-tool" ><span class="image-viewer-tool-rotate" > </span> </div><div title="水平翻转" data-tool="horizontalturn" class = "viewer-tool" ><span class="image-viewer-tool-horizontalturn" ></span></div><div title="垂直翻转" data-tool="verticalturn" class = "viewer-tool" ><span class="image-viewer-tool-verticalturn" ></span></div></div>').appendTo(jQuery("body"));
		}else{
			jQuery(".toolbar").show(0);	
		}
		if(typeof callback==="function" && callback){
			callback && callback();
		}
	}
	var _ShowPicBox = function(url){
		var Imgs = new Image();
		Imgs.onload  = function(){
			var position = getPosition(this);
			jQuery(this).appendTo(jQuery("body")).addClass("currPic");
			jQuery(this).css({
				"position":"absolute",
				"left":position.left,
				"top":position.top,
				"z-index":9999999

			}).attr({
				"data-width":this.width,
				"data-height":this.height,
				"data-left":position.left,
				"data-top":position.top
			});
			orgLeft = position.left;
			orgTop = position.top;
		}
		Imgs.src = url;
		
	}
	//获取初始化图片位置
	var getPosition =function(obj){
		var x = jQuery(window).width()-150;
		var y = jQuery(window).height() -150;
		if(obj.width>x){
			obj.height = obj.height*(x/obj.width);
			obj.width = x;
			if(obj.height>y){
				obj.width = obj.width*(y/obj.height);
				obj.height = y;
			}

		}else if(obj.height>y){
			obj.width = obj.width*(y/obj.height);
			obj.height = y;
			if(obj.width>x){
				obj.height = obj.height*(x/obj.width);
				obj.width = x;
			}

		}
		var leftP = (jQuery(window).width()-obj.width)/2,
		     topP =  (jQuery(window).height()-obj.height)/2;

		 return {
		 	left:leftP,
		 	top:topP
		 }
	}
});
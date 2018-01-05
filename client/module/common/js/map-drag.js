/*
 *  警卫路线中摄像机列表的拖拽功能
 *	移动ul下的items，可以进行拖动排序(目前只支持ul)
 *	at 2014-4-24
 */
define(['jquery'], function(jQuery) {

	var event = (function () {

		/**
		 * 删除对象事件
		 * @param target - 待解除事件绑定的dom元素对象
		 * @param eventType - 待解除绑定的事件类型
		 * @param callback - 待解除事件的回调函数
		 * @private - 私有
		 */
		var _deleteEvent = function (target, eventType, callback) {
			if (target.removeEventListener) {
				target.removeEventListener(eventType, callback, true);
			} else {
				//ie
				target.detachEvent("on" + eventType, callback);
			}
		};

		return{
			/**
			 *
			 * @param target - 待绑定事件的dom元素对象
			 * @param eventType - 待绑定的事件类型
			 * @param callback - 事件回调函数
			 */
			addEvent: function (target, eventType, callback) {
				_deleteEvent(target, eventType, callback);
				if (target.addEventListener) {
					target.addEventListener(eventType, callback, false);
				} else {
					//ie
					target.attachEvent("on" + eventType, function (event) {
						return callback.call(target, event);
					});
				}
			}
		};
	}());

	var DragItems = function (marker, direction) { //direction:1(x),2(y),3(xy)
		var self = this;
		//初始化组件
		if (self.checkInvalidate(marker, direction)) {
			//绑定事件
			self.bindEvent();
			//创建占位符
			if (self.ctrlInfo.bindObject.find(".place-hoder-li").length === 0) {
				self.ctrlInfo.bindObject.append("<li class='camera-item clearfix place-hoder-li'></li>");
			} else {
				//将该占位符至于列表末尾
				self.ctrlInfo.bindObject.find(".place-hoder-li").appendTo(self.ctrlInfo.bindObject);
			}
		}
	};

	DragItems.prototype = {
		//组件的引用方式
		ctrlInfo: {
			marker: "", //绑定组件用的标示（id或者class）
			useId: false, //标记是否用id
			bindObject: null,
			enableX: false, //是否允许在x轴拖动
			enableY: false //是否允许在y轴拖动
		},
		//记录鼠标在点击时，坐标与待拖动元素的左侧物理距离差，以备拖动过程中进行定位
		leftDis: 0,
		//记录鼠标在点击时，坐标与待拖动元素的上侧物理距离差，以备拖动过程中进行定位
		topDis: 0,
		//记录当前正在拖动的元素
		currentObj: null,
		//标记鼠标是否按下
		isMouseDown: false,
		//记录拖动过程中占位符的兄弟节点信息，以备进行元素移动
		siblingInfo: {
			prev: { //前一个兄弟
				obj: null, //对象
				centerX: 0, //该兄弟x坐标的中心位置（拖动超过中心位置进行元素移动）
				centerY: 0 //该兄弟y坐标的中心位置
			},
			next: { //后一个兄弟
				obj: null,
				centerX: 0,
				centerY: 0
			}
		},
		//鼠标拖动时，填充到拖动位置的占位符
		currentPlaceHolder: null,
		//为了解决click和mousedown事件的冲突问题，定义此定时器
		mouseDownDelayTimer: null,

		/**
		 * 对组件进行差错验证
		 * @param marker - 待绑定的dom元素id或者类
		 * @param direction - 拖拽允许的方向
		 * @returns {boolean} - 是否验证通过
		 */
		checkInvalidate: function (marker, direction) {
			var self = this;
			//验证标示
			if (jQuery.trim(marker) !== "") {
				if (jQuery("#" + marker).length !== 0) {
					//验证id
					self.ctrlInfo.marker = jQuery.trim(marker);
					self.ctrlInfo.useId = true;
					self.ctrlInfo.bindObject = jQuery("#" + marker);
				} else if (jQuery("." + marker).length !== 0) {
					//验证class
					self.ctrlInfo.marker = jQuery.trim(marker);
					self.ctrlInfo.bindObject = jQuery("." + marker);
					self.ctrlInfo.bindObject.each(function (index) {
						if (!jQuery(this).attr("ul-num")) {
							jQuery(this).attr("ul-num", index);
						}
					});
				} else {
					return false;
				}
				//验证拖动方向
				if (direction === 1) {
					self.ctrlInfo.enableX = true;
				} else if (direction === 2) {
					self.ctrlInfo.enableY = true;
				} else if (direction === 3) {
					self.ctrlInfo.enableX = true;
					self.ctrlInfo.enableY = true;
				} else {
					return false;
				}
				return true;
			} else {
				return false;
			}
		},
		/**
		 * 对需要拖动的对象进行事件绑定
		 */
		bindEvent: function () {
			var self = this;
			//给items添加鼠标按下和提起事件(由于jquery的click和on冲突，故改为原生态方法附加)
			self.ctrlInfo.bindObject.find("li").each(function () {
				//鼠标按下事件
				var thisObj = jQuery(this)[0];
				event.addEvent(thisObj, "mousedown", function (e) {
					e.preventDefault();
					e.stopPropagation();
					var evt = e || window.event;
					//为了解决click（单击时播放视频）和mousedown（拖动）事件的冲突，对mousedown事件进行延时100毫秒，500毫秒以内未click事件
					self.mouseDownDelayTimer = setTimeout(function () {
						self.mouseDownDelayTimer = null;
						self.onItemsMouseDown(evt, thisObj);
					}, 200);
					//给全屏鼠标移动添加事件
					jQuery(document).on("mousemove", function (e) {
						e.preventDefault();
					    e.stopPropagation();
						self.documentMouseMoveEvent(e);
					});
				});
				//鼠标提起事件
				event.addEvent(thisObj, "mouseup", function (e) {
					e.preventDefault();
					e.stopPropagation();
					if (self.mouseDownDelayTimer) {
						clearTimeout(self.mouseDownDelayTimer);
						return;
					}
					self.onItemsMouseUp();
				});
			});
			//添加鼠标的移动事件
			event.addEvent(self.ctrlInfo.bindObject[0], "mousemove", function (e) {
				e.preventDefault();
				e.stopPropagation();
				var evt = e || window.event;
				self.onItemsMouseMove(evt);
				//取消默认事件
				return false;
			});
		},
		/**
		 * 文档的鼠标事件（监测鼠标移动）
		 * @param e - 事件对象
		 */
		documentMouseMoveEvent: function (e) {
			var evt = e || window.event, self = this;
			//当鼠标已经不在处于移动对象区域中时，归位元素
			if (self.isMouseDown && !self.isInItemRect(self.getMousePos(evt).x, self.getMousePos(evt).y)) {
				self.onItemsMouseUp();
			}
		},
		/**
		 * 鼠标按下事件
		 * @param evt - 事件对象
		 * @param obj - 当前移动的dom对象
		 */
		onItemsMouseDown: function (evt, obj) {
			var self = this, mouseX = self.getMousePos(evt).x, mouseY = self.getMousePos(evt).y, targetE = evt.srcElement || evt.target;
			//如果点击的对象是li上的按钮，则返回，执行特定的点击事件
			if (targetE && (targetE.className === "del-ico" || targetE.className === "down" || targetE.className === "up")) {
				return;
			}
			//保存当前点击的对象（待移动）
			self.currentObj = obj;
			//判断鼠标是否处于待移动元素的空间中，是则点击有效
			if (self.isInItemRect(mouseX, mouseY)) {
				//标记鼠标点击有效
				self.isMouseDown = true;
				//计算鼠标位置和待移动元素的相对位移
				self.leftDis = mouseX - jQuery(obj).position().left;
				self.topDis = mouseY - jQuery(obj).position().top - self.ctrlInfo.bindObject.scrollTop();
				//浮动显示待移动元素
				jQuery(obj).addClass("will-move-li").css({
					"position": "absolute",
					"width": jQuery(obj).width() + "px"
				});
				//初始化当前的占位符（因为可能有多个，每个列表单独进行）
				var ulNum = jQuery(obj).parent().attr("ul-num");
				self.currentPlaceHolder = jQuery(self.ctrlInfo.bindObject[parseInt(ulNum)]).find(".place-hoder-li");
				//鼠标点击时，初始化占位符
				self.initPlaceHolder(obj);
			} else {
				//否则销毁对象
				self.currentObj = null;
			}
		},
		/**
		 * 鼠标提起事件
		 */
		onItemsMouseUp: function () {
			var self = this;
			//标记鼠标点击有效期结束
			self.isMouseDown = false;
			//更新拖动元素的位置（新位置）
			self.setElementPos();
			//清除拖动过程中的相对位移
			self.leftDis = 0;
			self.topDis = 0;

			self.currentObj = null; //清除当前拖动对象信息
			self.clearSiblingInfo(); //清除兄弟节点的信息
		},
		/**
		 * 鼠标移动事件
		 * @param evt - 事件对象
		 */
		onItemsMouseMove: function (evt) {
			var self = this;
			if (self.isMouseDown) {

				var mouseX = self.getMousePos(evt).x, mouseY = self.getMousePos(evt).y;
				//允许在x、y轴上进行拖动
				if (self.ctrlInfo.enableX && self.ctrlInfo.enableY) {
					cssInfo = {
						"left": (mouseX - self.leftDis) + "px",
						"top": (mouseY - self.topDis) + "px"
					};
				}
				//只允许在x轴上拖动
				else if (self.ctrlInfo.enableX && !self.ctrlInfo.enableY) {
					cssInfo = {
						"left": (mouseX - self.leftDis) + "px"
					};
				} else { //只允许在y轴上拖动
					cssInfo = {
						"top": (mouseY - self.topDis) + "px"
					};
				}
				//设置拖动元素的位置
				jQuery(self.currentObj).css(cssInfo);
				//监测当前元素的边界，移动元素
				self.moveElement(mouseX, mouseY);
			}
		},
		/**
		 * 拖动结束后，将拖动元素更新到新的位置
		 */
		setElementPos: function () {
			var self = this;
			if (self.currentPlaceHolder) {
				//回归节点位置
				self.currentPlaceHolder.hide().removeClass("place-hoder-li-active").before(jQuery(self.currentObj).removeClass("will-move-li").css({
					"position": "",
					"top": "", //top必须设置，不然下一次移动时会有闪烁
					"left": ""
				}));
				//将占位符归位，以便在拖动最后一个节点时，出现闪烁，延迟执行500毫秒，方便抬起定位
				setTimeout(function () {
					self.currentPlaceHolder.appendTo(self.currentPlaceHolder.parent());
				}, 500);
				//取消全屏鼠标移动事件
				jQuery(document).unbind("mousemove");
			}
		},
		/**
		 * 鼠标点击时，初始化占位符
		 * @param obj - 待移动的dom对象
		 */
		initPlaceHolder: function (obj) {
			var self = this;
			//显示占位符
			if (jQuery(obj).next().length !== 0) {
				self.currentPlaceHolder.insertBefore(jQuery(obj).next()).show();
			} else if (jQuery(obj).prev().length !== 0) {
				self.currentPlaceHolder.insertAfter(jQuery(obj).prev()).show();
			} else {
				//没有兄弟节点
				self.currentPlaceHolder.show();
			}
			//添加占位符的样式
			self.currentPlaceHolder.addClass("place-hoder-li-active");
			//初始化
			self.setSibingInfo();
		},
		/**
		 * 监测当前鼠标的位置，移动元素
		 * @param mx - 当前鼠标的x坐标
		 * @param my - 当前鼠标的y坐标
		 */
		moveElement: function (mx, my) {
			var self = this;
			//和前一个兄弟节点比对，
			if (self.siblingInfo.prev.obj && (my < self.siblingInfo.prev.centerY)) {
				//如果鼠标的x，y值已经超过了上一个兄弟节点中心点，移动占位符元素(上移)
				self.currentPlaceHolder.insertBefore(self.siblingInfo.prev.obj).show();
				//重新初始化兄弟节点信息
				self.setSibingInfo();
			} else if (self.siblingInfo.next.obj && (my > self.siblingInfo.next.centerY)) {
				//如果鼠标的x，y值已经超过了下一个兄弟节点中心点，移动占位符元素(下移)
				self.currentPlaceHolder.insertAfter(self.siblingInfo.next.obj).show();
				//重新初始化兄弟节点信息
				self.setSibingInfo();
			} else {
				//待扩展
			}
		},
		/**
		 * 初始化上下兄弟节点的位置信息
		 */
		setSibingInfo: function () {

			var self = this;
			self.clearSiblingInfo();
			if (self.currentPlaceHolder.next().length !== 0) {
				//初始化下一个兄弟节点信息
				tempObj = self.currentPlaceHolder.next();
				self.siblingInfo.next.obj = tempObj;
				self.siblingInfo.next.centerX = tempObj.offset().left + tempObj.width() / 2;
				self.siblingInfo.next.centerY = tempObj.offset().top + tempObj.height() / 1.5;
			}
			if (self.currentPlaceHolder.prev().length !== 0 && !self.currentPlaceHolder.prev().hasClass("camera-item-first")) {
				//初始化上一个兄弟节点信息
				tempObj = self.currentPlaceHolder.prev();
				self.siblingInfo.prev.obj = tempObj;
				self.siblingInfo.prev.centerX = tempObj.offset().left + tempObj.width() / 2;
				self.siblingInfo.prev.centerY = tempObj.offset().top + tempObj.height() / 3;
			}
		},
		/**
		 * 每次更新之前清空之前的兄弟节点信息
		 */
		clearSiblingInfo: function () {
			var self = this;
			for (var op in self.siblingInfo) {
				if (self.siblingInfo.hasOwnProperty(op)) {
					self.siblingInfo[op].obj = null;
					self.siblingInfo[op].centerX = 0;
					self.siblingInfo[op].centerY = 0;
				}
			}
		},
		/**
		 * 获取鼠标的位置
		 * @param evt - 事件对象
		 * @returns {{x: number, y: number}} - 当前鼠标的位置
		 */
		getMousePos: function (evt) {
			var left = 0, top = 0, ie = navigator.userAgent.indexOf("MSIE") > 0;
			if (ie) {
				left = parseInt(evt.clientX);
				top = parseInt(evt.clientY);
			} else {
				left = parseInt((evt.x ? evt.x : evt.pageX));
				top = parseInt((evt.y ? evt.y : evt.pageY));
			}
			return {
				x: left,
				y: top
			};
		},
		/**
		 * 判断鼠标是否处于移动对象中
		 * @param x - 当前鼠标位置的x坐标
		 * @param y - 当前鼠标位置的y坐标
		 * @returns {*} - 是否处于移动对象中
		 */
		isInItemRect: function (x, y) {
			var self = this;
			if (self.currentObj) {
				var objLeft = jQuery(self.currentObj).offset().left, objTop = jQuery(self.currentObj).offset().top, objW = jQuery(self.currentObj).width(), objH = jQuery(self.currentObj).height();
				if (x >= objLeft && x <= (objLeft + objW) && y >= objTop && y <= (objTop + objH)) {
					return self.isMouseInScrollRect(x, y);
				} else {
					return false;
				}
			} else {
				return false;
			}
		},
		/**
		 * 判断当前鼠标是否还在滚动区域内，如果不在，则直接归位元素，以免超出范围后拖动事件没有得到释放
		 * @param x - 当前鼠标位置的x坐标
		 * @param y - 当前鼠标位置的y坐标
		 * @returns {boolean} - 是否处于待移动区域中
		 */
		isMouseInScrollRect: function (x, y) {
			var self = this;
			if (self.ctrlInfo.bindObject.parents(".np-route-camera-list")) {
				var objTop = self.ctrlInfo.bindObject/*.parents(".np-route-camera-list")*/.offset().top, objH = self.ctrlInfo.bindObject/*.parents(".np-route-camera-list")*/.height();
				return (y <= (objTop + objH));
			} else {
				return false;
			}
		}
	};
	return DragItems;
});
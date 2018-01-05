/**兼容不同图形拖动方法*/
Raphael.el.draggable = function(options) {
	function save(obj) {
		var m = obj.matrix;
		var str = m.a + "," + m.b + "," + m.c + "," + m.d + "," + m.e + "," + m.f;
		obj.data("data-matrix", str);
	}
	var move = function(dx, dy) {
		var A = this.data("data-matrix").split(",");
		A[4] = A[4] - 0 + dx;
		A[5] = A[5] - 0 + dy;
		this.transform("m" + A.join(","));

		options && options.onMove && options.onMove.call(this, dx, dy);
	};
	var start = function() {
		save(this);
	};
    var dealRectOut = function(self){
        var rectData ={
            x : self.attr('x'),
            y : self.attr('y'),
            width : self.attr('width'),
            height : self.attr('height'),
            matrix : self.data("data-matrix").split(",")
        }
        if(rectData.x + parseInt(rectData.matrix[4]) < 0){
            rectData.matrix[4] = -rectData.x;
        }
        if(rectData.y + parseInt(rectData.matrix[5]) < 0){
            rectData.matrix[5] = -rectData.y;
        }
        if(rectData.x + parseInt(rectData.matrix[4]) + rectData.width > self.paper.width){
            rectData.matrix[4] = self.paper.width - rectData.width - rectData.x;
        }
        if(rectData.y + parseInt(rectData.matrix[5]) + rectData.height > self.paper.height){
            rectData.matrix[5] = self.paper.height - rectData.height - rectData.y;
        }
        self.transform("m" + rectData.matrix.join(","));
    }
    var dealEllipseOut = function(self){
        var ellipseData ={
            cx : self.attr('cx'),
            cy : self.attr('cy'),
            rx : self.attr('rx'),
            ry : self.attr('ry'),
            matrix : self.data("data-matrix").split(",")
        }
        if(ellipseData.cx - ellipseData.rx + parseInt(ellipseData.matrix[4]) < 0){
            ellipseData.matrix[4] = ellipseData.rx - ellipseData.cx;
        }
        if(ellipseData.cy - ellipseData.ry + parseInt(ellipseData.matrix[5]) < 0){
            ellipseData.matrix[5] = ellipseData.ry - ellipseData.cy;
        }
        if(ellipseData.cx + ellipseData.rx + parseInt(ellipseData.matrix[4]) > self.paper.width){
            ellipseData.matrix[4] = self.paper.width - ellipseData.cx - ellipseData.rx;
        }
        if(ellipseData.cy + ellipseData.ry + parseInt(ellipseData.matrix[5]) > self.paper.height){
            ellipseData.matrix[5] = self.paper.height - ellipseData.cy - ellipseData.ry;
        }
        self.transform("m" + ellipseData.matrix.join(","));
    }
    var dealLineOut = function(self){
        var lineData = {
            pointA : {
                x : self.attr('path')[0][1],
                y : self.attr('path')[0][2]
            },
            pointB : {
                x : self.attr('path')[1][1],
                y : self.attr('path')[1][2]
            },
            matrix : self.data("data-matrix").split(",")
        };
        if(lineData.pointA.x < lineData.pointB.x){
            if(lineData.pointA.x + parseInt(lineData.matrix[4]) < 0){
                lineData.matrix[4] = -lineData.pointA.x;
            }
            if(lineData.pointB.x + parseInt(lineData.matrix[4]) > self.paper.width){
                lineData.matrix[4] = self.paper.width - lineData.pointB.x;
            }
        }else{
            if(lineData.pointB.x + parseInt(lineData.matrix[4]) < 0){
                lineData.matrix[4] = -lineData.pointB.x;
            }
            if(lineData.pointA.x + parseInt(lineData.matrix[4]) > self.paper.width){
                lineData.matrix[4] = self.paper.width - lineData.pointA.x;
            }
        }

        if(lineData.pointA.y < lineData.pointB.y){
            if(lineData.pointA.y + parseInt(lineData.matrix[5]) < 0){
                lineData.matrix[5] = -lineData.pointA.y;
            }
            if(lineData.pointB.y + parseInt(lineData.matrix[5]) > self.paper.height){
                lineData.matrix[5] = self.paper.height - lineData.pointB.y;
            }
        }else{
            if(lineData.pointB.y + parseInt(lineData.matrix[5]) < 0){
                lineData.matrix[5] = -lineData.pointB.y;
            }
            if(lineData.pointA.y + parseInt(lineData.matrix[5]) > self.paper.height){
                lineData.matrix[5] = self.paper.height - lineData.pointA.y;
            }
        }
        self.transform("m" + lineData.matrix.join(","));
    }
	var up = function() {
        save(this);
        if(this.type === 'rect'){
            dealRectOut(this);
        }else if(this.type === 'ellipse'){
            dealEllipseOut(this);
        }else if(this.type === 'text'){
            dealRectOut(this);
        }else if(this.type === 'path'){
            dealLineOut(this);
        }
	};
	return this.drag(move, start, up);
};

(function($) {

	var Shape = new Class({
		options: {
			drawboard: null, // 画板
			paper: null, // 画布
			stroke: 'red', // 划过的颜色
			strokeWidth: 3, // 划过的宽度
			fill: 'white', // 默认的fill
			fillOpacity: 0,
			selectedFill: 'white', // 选中的fill
			selectedFillOpacity: 0.1
		},
		element: null, // 原始图形对象
		initialize: function(options) {
			this.setOptions(options);
		},
		setOptions: function(options) {
			this.options = $.extend({}, this.options, options || {});
		},
		draw: function(x, y) {},
		remove: function() {
			if (this.element) {
				this.element.remove();
			}
		},
		select: function() {
			if (this.element) {
				this.element.attr({
					'fill': this.options.selectedFill,
					'fill-opacity': this.options.selectedFillOpacity
				});
			}
		},
		cancelSelect: function() {
			if (this.element) {
				this.element.attr({
					'fill': this.options.fill,
					'fill-opacity': this.options.fillOpacity
				});
			}
		}
	});
	var Rect = new Class({
		Extends: Shape,
		bounds: {
			x: 0,
			y: 0,
			w: 0,
			h: 0
		},
		initialize: function(options) {
			this.parent(options);
		},
		draw: function(x, y) {
			this.getBounds(x, y);
			if (this.element) {
				this.element.attr({
					x: this.bounds.x,
					y: this.bounds.y,
					width: this.bounds.w,
					height: this.bounds.h
				});
			} else {
				this.createElement();
			}
		},
		createElement: function() {
			var rect = this;
			this.element = this.options.paper.rect(this.bounds.x, this.bounds.y, this.bounds.w, this.bounds.h).attr({
				"stroke": this.options.stroke,
				'stroke-width': this.options.strokeWidth,
				'fill': this.options.fill,
				'fill-opacity': this.options.fillOpacity,
				'cursor': 'move'
			}).mousedown(function(event) {
				event.stopPropagation();
				rect.options.drawboard.cancelSelect();
				rect.options.drawboard.select(rect);
			}).draggable({
				obj: rect
			});
		},
		getBounds: function(x, y) {
			if (this.x1 === undefined || this.y1 === undefined) {
				this.x1 = x;
				this.y1 = y;
			}
			this.x2 = x;
			this.y2 = y;
			this.bounds.x = Math.min(this.x1, this.x2);
			this.bounds.y = Math.min(this.y1, this.y2);
			this.bounds.w = Math.abs(this.x1 - this.x2);
			this.bounds.h = Math.abs(this.y1 - this.y2);
		}
	});
	var Ellipse = new Class({
		Extends: Shape,
		bounds: {
			cx: 0,
			cy: 0,
			rx: 0,
			ry: 0
		},
		initialize: function(options) {
			this.parent(options);
		},
		draw: function(x, y) {
			this.getBounds(x, y);
			if (this.element) {
				this.element.attr({
					cx: this.bounds.cx,
					cy: this.bounds.cy,
					rx: this.bounds.rx,
					ry: this.bounds.ry
				});
			} else {
				this.createElement();
			}
		},
		createElement: function() {
			var ellipse = this;
			this.element = this.options.paper.ellipse(this.bounds.cx, this.bounds.cy, this.bounds.rx, this.bounds.ry).attr({
				"stroke": this.options.stroke,
				'stroke-width': this.options.strokeWidth,
				'fill': this.options.fill,
				'fill-opacity': this.options.fillOpacity,
				'cursor': 'move'
			}).mousedown(function(event) {
				event.stopPropagation();
				ellipse.options.drawboard.cancelSelect();
				ellipse.options.drawboard.select(ellipse);
			}).draggable({
				obj: ellipse
			});
		},
		getBounds: function(x, y) {
			if (this.x1 === undefined || this.y1 === undefined) {
				this.x1 = x;
				this.y1 = y;
			}
			this.x2 = x;
			this.y2 = y;

			this.bounds.cx = Math.abs(this.x1 + this.x2) / 2;
			this.bounds.cy = Math.abs(this.y1 + this.y2) / 2;
			this.bounds.rx = Math.abs(this.x1 - this.x2) / 2;
			this.bounds.ry = Math.abs(this.y1 - this.y2) / 2;
		}
	});
	var Line = new Class({
		Extends: Shape,
		options: {
			arrowsSize: 8
		},
		initialize: function(options) {
			this.parent(options);
		},
		draw: function(x, y) {
			this.getPath(x, y);
			if (this.element) {
				this.element.attr({
					path: this.path
				});
			} else {
				this.createElement();
			}
		},
		createElement: function() {
			var path = this;
			this.element = this.options.paper.path(this.path).attr({
				"stroke": this.options.stroke,
				'stroke-width': this.options.strokeWidth,
				'fill': this.options.fill,
				'fill-opacity': this.options.fillOpacity,
				'cursor': 'move'
			}).mousedown(function(event) {
				event.stopPropagation();
				path.options.drawboard.cancelSelect();
				path.options.drawboard.select(path);
			}).draggable({
				obj: path
			});
		},
		getPath: function(x, y) {
			if (this.x1 === undefined || this.y1 === undefined) {
				this.x1 = x;
				this.y1 = y;
			}
			this.x2 = x;
			this.y2 = y;

			var size = this.options.arrowsSize;
			var angle = Raphael.angle(this.x1, this.y1, this.x2, this.y2); //得到两点之间的角度
			var a45 = Raphael.rad(angle - 45); //角度转换成弧度
			var a45m = Raphael.rad(angle + 45);
			this.x2a = this.x2 + Math.cos(a45) * size;
			this.y2a = this.y2 + Math.sin(a45) * size;
			this.x2b = this.x2 + Math.cos(a45m) * size;
			this.y2b = this.y2 + Math.sin(a45m) * size;
			this.path = 'M ' + this.x1 + ',' + this.y1 + ' L ' + this.x2 + ',' + this.y2 + ' M ' + this.x2 + ',' + this.y2 + ' L ' + this.x2a + ',' + this.y2a + ' M ' + this.x2 + ',' + this.y2 + ' L ' + this.x2b + ',' + this.y2b;
		}
	});
	var Text = new Class({
		Extends: Rect,
		minw: 40, // 文本框最小宽度
		minh: 20, // 文本框最小高度
		text: null, //文本对象
		tx: 0, // 文本对象位置
		ty: 0,
		editer: null, // 编辑器
		editerBounds: { // 编辑器位置尺寸
			x: 0,
			y: 0,
			w: 0,
			h: 0
		},
		initialize: function(options) {
			this.parent(options);
			this.setOptions({
				strokeWidth: 1,
				strokeDasharray: '--',
				fill: 'white',
				fillOpacity: 0
			});
		},
		createElement: function() {
			var textSelf = this;

			// 调用父类方法创建矩形
			Rect.prototype.createElement.call(textSelf);

			// 扩展矩形的操作
			textSelf.element.attr({
				'stroke-dasharray': textSelf.options.strokeDasharray
			}).mousedown(function(event) {
				event.stopPropagation();

				// 保存文本初始位置，当矩形移动时作为偏移量
				textSelf.text.data("startBounds", {
					x: textSelf.text.attr("x"),
					y: textSelf.text.attr("y")
				});

				// 保存编辑器初始位置，当矩形移动时作为偏移量
				textSelf.editer.data("startOffset", textSelf.editer.offset());

			}).dblclick(function(event) {

				// 进入文本编辑状态
				textSelf.editText();

			}).draggable({
				obj: textSelf,
				onMove: function(dx, dy) {

					// 移动文本
					textSelf.text.attr({
						x: textSelf.text.data("startBounds").x + dx,
						y: textSelf.text.data("startBounds").y + dy
					});

					// 移动编辑器
					var offset = textSelf.editer.data("startOffset");
					textSelf.editer.css({
						left: offset.left + dx,
						top: offset.top + dy
					});
				}
			});

			//创建一个区域 用来计算文本的大小
			textSelf.textPre = $('<pre></pre>').css({
				display: "inline",
				visibility: "hidden",
				position: "absolute",
				top: 0,
				left: 0,
				width: 'auto',
				height: 'auto',
				font: '400 13px "Microsoft Yahei"'
			}).appendTo(textSelf.options.drawboard.options.container);

			// 相对矩形的位置创建编辑器对象
			textSelf.getEditerBounds();
			textSelf.editer = $('<textarea></textarea>').css({
					position: 'fixed',
					visibility: "visible",
					background: 'rgba(255,255,255, 0.1)',
					zIndex: 20,
					border: 0,
					overflow: 'hidden',
					font: '400 13px "Microsoft Yahei"',
					color: textSelf.options.stroke,
					top: this.editerBounds.y,
					left: this.editerBounds.x,
					width: this.editerBounds.w,
					height: this.editerBounds.h
				}).appendTo(textSelf.options.drawboard.options.container)
				.on("mousedown", function(event) {

					// 阻止编辑器的点击事件
					event.stopPropagation();

				})
				.on("input propertychange", function() {
					var text = textSelf.editer.val()
						.replace(/\n(.)/g, "<BR>$1")
						.replace(/\n/g, "\n　")
						.replace(/<BR>/g, "\n")
						.replace(/^\n/g, "　\n");

					textSelf.text.attr({
						text: text
					});

					// 实现文本框尺寸的自适应
					// 获取文本的尺寸
					textSelf.getTextSize();

					// 让矩形的尺寸等于文本尺寸
					if (textSelf.tw != textSelf.bounds.w) {
						textSelf.bounds.w = textSelf.tw;
					};
					if (textSelf.th != textSelf.bounds.h) {
						textSelf.bounds.h = textSelf.th;
					};

					// 重新计算矩形尺寸
					// 给矩形一个默认的高宽
					textSelf.bounds.w = Math.max(textSelf.bounds.w, textSelf.minw);
					textSelf.bounds.h = Math.max(textSelf.bounds.h, textSelf.minh);
					textSelf.element.attr({
						width: textSelf.bounds.w,
						height: textSelf.bounds.h
					});

					textSelf.getEditerBounds();
					textSelf.editer.css({
						width: textSelf.editerBounds.w,
						height: textSelf.editerBounds.h
					});

				});

			setTimeout(function() {
				if (textSelf.editer) {
					textSelf.editer.focus();
				}
			}, 50);

			// 相对矩形的位置创建文本对象
			textSelf.getTextOffset();
			textSelf.text = textSelf.options.paper.text(textSelf.tx, textSelf.ty, '').attr({
				'fill': textSelf.options.stroke,
				'cursor': 'pointer',
				'text-anchor': 'start',
				"font-size": 13,
				"font-weight": "400",
				"font-family": "Microsoft Yahei"
			}).mousedown(function(event) {

				// 阻止文本的事件冒泡
				event.stopPropagation();

				// 选中当前
				textSelf.options.drawboard.select(textSelf);

			}).dblclick(function(event) {

				// 进入文本编辑状态
				textSelf.editText();

			}).hide();
		},
		getBounds: function(x, y) {
			Rect.prototype.getBounds.call(this, x, y);
			this.bounds.w = this.minw;
			this.bounds.h = this.minh;
		},
		endEditText: function() {
			var val = $.trim(this.editer.val());
			if (val === "") {
				this.options.drawboard.elements.pop();
				this.remove();
			} else {
				this.editer.css({
					visibility: "hidden"
				});
				this.getTextOffset();
				this.text.attr({
					x: this.tx,
					y: this.ty
				}).show();
				this.element.attr({
					'stroke-width': 0
				});
			}
		},
		editText: function() {
			this.text.hide();
			this.editer.css({
				visibility: "visible"
			}).focus();
			this.element.attr({
				'stroke-width': this.options.strokeWidth
			});
		},
		getEditerBounds: function() {
			var offset = $(this.options.drawboard.options.container).offset();
			this.editerBounds.x = this.bounds.x + 1 + offset.left;
			this.editerBounds.y = this.bounds.y + 1 + offset.top;
			this.editerBounds.w = this.bounds.w - 2;
			this.editerBounds.h = this.bounds.h - 2;
		},
		getTextOffset: function() {
			this.getTextSize();
			var tstr = this.element.matrix.toTransformString();
			tstr = tstr ? tstr.substring(1) : tstr;
			tstr = tstr.split(",");
			this.tx = this.bounds.x + (tstr[0] ? parseInt(tstr[0]) : 0);
			this.ty = this.bounds.y + (tstr[1] ? parseInt(tstr[1]) : 0) + this.th / 2;
		},
		getTextSize: function() {
			this.textPre.text(this.editer.val());
			this.tw = this.textPre.width() + 10;
			this.th = this.textPre.height();
		},
		remove: function() {
			if (this.textPre) {
				this.textPre.remove();
				this.textPre = null;
			}
			if (this.editer) {
				this.editer.remove();
				this.editer = null;
			}
			if (this.text) {
				this.text.remove();
				this.text = null;
			}
			if (this.element) {
				this.element.remove();
				this.element = null;
			}
		},
		cancelEdit: function() {
			this.endEditText();
		}
	});

	var ShapeTypes = {
		"line": Line,
		"rect": Rect,
		"ellipse": Ellipse,
		"text": Text
	};

	this.DrawBoard = new Class({
		options: {
			container: null, // 容器对象
			paper: null, // 画布对象
			shapeType: null, // 绘制图形的类型
			stroke: 'red', // 图形划过的颜色
			strokeWidth: 3, // 图形划过的宽度
			onDrawEnd: function(shape) {}
		},
		isMousedown: false, // 鼠标是否按下
		selectedElement: null, // 当前选中的图形元素
		elements: [], // 所有的图形元素
		initialize: function(options) {
			this.setOptions(options);
			this.bindEvents();
		},
		setOptions: function(options) {
			this.options = $.extend({}, this.options, options || {});
			if (this.options.stroke === "red") {
				this.options.stroke = "#F00";
			}
			if (this.options.stroke === "black") {
				this.options.stroke = "#000";
			}
			if (this.options.stroke === "yellow") {
				this.options.stroke = "#FF0";
			}
			if (this.options.stroke === "blue") {
				this.options.stroke = "#00F";
			}
			if (this.options.stroke === "green") {
				this.options.stroke = "#008000";
			}
		},
		bindEvents: function() {
			var drawboard = this;
			var shape; // 图形对象

			$(drawboard.options.container).on("mousedown", function(event) {
				drawboard.cancelSelect();
				drawboard.cancelEdit();
				if (!drawboard.options.shapeType || drawboard.isMousedown) {
					return false
				};
				if (drawboard.options.shapeType === "text") {
					shape = drawboard.createShape();
					drawboard.draw(shape, event);
				} else {
					shape = null;
				}
				drawboard.isMousedown = true;
			}).on("mousemove", function(event) {
				if (drawboard.isMousedown) {
					if (drawboard.options.shapeType !== "text") {
						if (!shape) {
							shape = drawboard.createShape();
						}
						drawboard.draw(shape, event);
					}
				}
			}).on("mouseup", function() {
				if (drawboard.isMousedown) {
					drawboard.isMousedown = false;
					drawboard.options.onDrawEnd && drawboard.options.onDrawEnd.call(drawboard, shape);
				}
			});
			$(window.document).on("keydown", function(event) {
				// 按delete键删除选中元素
				if (event.keyCode == 46) {
					if (drawboard.selectedElement) {
						$.each(drawboard.elements, function(i, element) {
							if (drawboard.selectedElement === element) {
								drawboard.elements.splice(i, 1);
								drawboard.selectedElement.remove();
							}
						});
					}
				}
				// ctrl + z 回退上一步
				if (event.ctrlKey && event.keyCode == 90) {
					if (drawboard.elements) {
						var element = drawboard.elements.pop();
						if (element) {
							element.remove();
						}
					}
				}
			});
		},
		// 画图形
		draw: function(shape, event) {
			var offset = $(this.options.container).offset();
			shape.draw(event.clientX - offset.left, event.clientY - offset.top);
		},
		// 创建图形
		createShape: function() {
			var shape = new ShapeTypes[this.options.shapeType]({
				drawboard: this,
				paper: this.options.paper,
				stroke: this.options.stroke,
				strokeWidth: this.options.strokeWidth
			});
			this.elements.push(shape);
			return shape;
		},
		// 选中指定元素
		select: function(element) {
			if (element) {
				this.selectedElement = element;
				this.selectedElement.select();
			}
		},
		// 取消选中元素
		cancelSelect: function() {
			if (this.selectedElement) {
				this.selectedElement.cancelSelect();
				this.selectedElement = null;
			}
		},
		// 取消编辑元素
		cancelEdit: function() {
			$.each(this.elements, function(i, element) {
				if (element) {
					element.cancelEdit && element.cancelEdit();
				}
			});
		},
		// 清除所有的图形
		clear: function() {
			$.each(this.elements, function(i, ele) {
				ele.remove();
			});
			this.elements = [];
		}
	});

})(jQuery);

/**按下保存按钮时执行保存图片绘制后json*/
var savePicJson = function() {
	// return window.paperH.toJSON();
	var data = JSON.parse(window.paperH.toJSON());
	var resData = jQuery.map(data, function(ele) {
		if (ele.attrs.stroke) {
			if (ele.attrs.stroke === "#F00") {
				ele.attrs.stroke = "red";
			}
			if (ele.attrs.stroke === "#000") {
				ele.attrs.stroke = "black";
			}
			if (ele.attrs.stroke === "#FF0") {
				ele.attrs.stroke = "yellow";
			}
			if (ele.attrs.stroke === "#00F") {
				ele.attrs.stroke = "blue";
			}
			if (ele.attrs.stroke === "#008000") {
				ele.attrs.stroke = "green";
			}
		}
		if (ele.attrs.fill) {
			if (ele.attrs.fill === "#F00") {
				ele.attrs.fill = "red";
			}
			if (ele.attrs.fill === "#000") {
				ele.attrs.fill = "black";
			}
			if (ele.attrs.fill === "#FF0") {
				ele.attrs.fill = "yellow";
			}
			if (ele.attrs.fill === "#00F") {
				ele.attrs.fill = "blue";
			}
			if (ele.attrs.fill === "#008000") {
				ele.attrs.fill = "green";
			}
		}
		if (ele.type === "image") {
			return {
				"id": ele["id"],
				"type": ele["type"],
				"attrs": {
					"x": ele.attrs["x"],
					"y": ele.attrs["y"],
					"width": ele.attrs["width"],
					"height": ele.attrs["height"],
					"src": ele.attrs["src"]
				},
				"transform": ele["transform"]
			};
		}
		if (ele.type === "rect") {
			return {
				"id": ele["id"],
				"type": ele["type"],
				"attrs": {
					"x": ele.attrs["x"],
					"y": ele.attrs["y"],
					"width": ele.attrs["width"],
					"height": ele.attrs["height"],
					"fill": ele.attrs["fill"],
					"opacity": ele.attrs["fill-opacity"],
					"stroke": ele.attrs["stroke"],
					"stroke-width": ele.attrs["stroke-width"],
					"stroke-dasharray": ele.attrs["stroke-dasharray"] ? ele.attrs["stroke-dasharray"] : ""
				},
				"transform": ele["transform"]
			};
		}
		if (ele.type === "ellipse") {
			return {
				"id": ele["id"],
				"type": ele["type"],
				"attrs": {
					"cx": ele.attrs["cx"],
					"cy": ele.attrs["cy"],
					"rx": ele.attrs["rx"],
					"ry": ele.attrs["ry"],
					"fill": ele.attrs["fill"],
					"opacity": ele.attrs["fill-opacity"],
					"stroke": ele.attrs["stroke"],
					"stroke-width": ele.attrs["stroke-width"]
				},
				"transform": ele["transform"]
			};
		}
		if (ele.type === "path") {
			return {
				"id": ele["id"],
				"type": ele["type"],
				"attrs": {
					"path": ele.attrs["path"],
					"fill": ele.attrs["fill"],
					"opacity": ele.attrs["fill-opacity"],
					"stroke": ele.attrs["stroke"],
					"stroke-width": ele.attrs["stroke-width"]
				},
				"transform": ele["transform"]
			};
		}
		if (ele.type === "text") {
			return {
				"id": ele["id"],
				"type": ele["type"],
				"attrs": {
					"x": ele.attrs["x"],
					"y": ele.attrs["y"],
					"text": ele.attrs["text"],
					"font-size": ele.attrs["font-size"],
					"font-weight": ele.attrs["font-weight"],
					"font-family": ele.attrs["font-family"],
					"stroke": ele.attrs["stroke"],
					"fill": ele.attrs["fill"]
				},
				"transform": ele.transform
			};
		}
		return null;
	});
	return JSON.stringify(resData);
};
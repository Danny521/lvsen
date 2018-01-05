define(["jquery","raphael"],function(jquery,Raphael) {
	function $ID(obj) {
		return document.getElementById(obj);
	}
	//获取dom元素x坐标，指的是普通html元素，div等
	function getX(obj) {
		return obj.offsetLeft + (obj.offsetParent ? getX(obj.offsetParent) : obj.x ? obj.x : 0);
	}
	//获取dom元素y坐标，指的是普通html元素，div等
	function getY(obj) {
		return (obj.offsetParent ? obj.offsetTop + getY(obj.offsetParent) : obj.y ? obj.y : 0);
	}
	/**
	 * [dragtable 给raphael元素绑定拖动接口]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[obj]}   xobj [传入的拖动参数]
	 * @return {[type]}        [无]
	 */
	Raphael.el.dragtable = function(xobj) {
		if (this.data("bg")) {
			return
		}
		//if(this.data("handle")){return}
		function save(obj) {
			var m = obj.matrix;
			var str = m.a + "," + m.b + "," + m.c + "," + m.d + "," + m.e + "," + m.f;
			obj.data("data-matrix", str);
		}

		//移动
		var move = function(dx, dy, x, y) {
			var A = this.data("data-matrix").split(",");
			A[4] = A[4] - 0 + dx;
			A[5] = A[5] - 0 + dy;
		
			this.transform("m" + A.join(","));

			if (xobj && xobj.relation) {
				var R = xobj.relation;
				var L = R.length;
				for (var i = 0; i <= L - 1; i++) {
					if (R[i]) {
						R[i].hide();
					}
				}
			}
			if (xobj && xobj.move) {
				xobj.move(this, dx, dy, x, y);
			}
		};
		//鼠标按下
		var start = function(x, y) {
			save(this);
			if (xobj && xobj.down) {
				xobj.down(this, x, y);
			}
		};
		//鼠标起来
		var up = function(x, y) {
			//SimpleTransform(this);
			save(this);
			if (xobj && xobj.up) {
				xobj.up(this);
			}
		};
		this.drag(move, start, up);
	}
	/**
	 * [clearHandle 删除画布上的把手元素handle]
	 * @author huzc
	 * @date   2015-03-04
	 * @return {[type]}   [无]
	 */
	Raphael.fn.clearHandle = function() {
		var A = [];
		this.forEach(function(el) {
			if (el.data("handle")) {
				A.push(el);
			}
		});
		var L = A.length;
		for (var i = 0; i <= L - 1; i++) {
			A[i].remove();
		}
	}
	/**
	 * [PointTransform 将点进行矩阵变换]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[数字]}   x [坐标x]
	 * @param  {[数字]}   y [坐标y]
	 * @param  {[矩阵]}   m [矩阵m]
	 */
	function PointTransform(x, y, m) {
		var x0 = m.a * x + m.c * y + m.e;
		var y0 = m.b * x + m.d * y + m.f;
		return {
			x: x0,
			y: y0
		}
	}
	/**
	 * [SimpleTransform 对指定元素进行矩阵变换]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[对象]}   obj [矩阵变换的对象]
	 */
	function SimpleTransform(obj) {
		var vtype = obj.type;
		if (vtype == "path") {
			var stype = obj.data("vtype");
			if (stype == "Arrowline") {
				vtype = "line";
			}
		}

		if (vtype == "rect" || vtype == "image") {
			var x = obj.attrs["x"] - 0;
			var y = obj.attrs["y"] - 0;
			var w = obj.attrs["width"] - 0;
			var h = obj.attrs["height"] - 0;
			var mat = obj.matrix;
			var PT = PointTransform(x, y, mat);
			x = PT.x;
			y = PT.y;
			var PTH = PointTransform(x + w, y + h, mat);
			w = w * mat.a; //PTH.x-x;
			h = h * mat.d; //PTH.y-y;
			obj.attr({
				x: x,
				y: y,
				width: w,
				height: h
			});
			obj.transform("");
			return;
		}
		if (vtype == "roundrect") {
			var x = obj.attrs["x"] - 0;
			var y = obj.attrs["y"] - 0;
			var r = obj.attrs["r"] - 0;
			var w = obj.attrs["width"] - 0;
			var h = obj.attrs["height"] - 0;
			var mat = obj.matrix;
			var PT = PointTransform(x, y, mat);
			x = PT.x;
			y = PT.y;
			var PTH = PointTransform(x + w, y + h, mat);
			w = w * mat.a; //PTH.x-x;
			h = h * mat.d; //PTH.y-y;
			obj.attr({
				x: x,
				y: y,
				width: w,
				height: h
			});
			obj.transform("");

			return;
		}
		if (vtype == "ellipse") {
			var x = obj.attrs["cx"] - 0;
			var y = obj.attrs["cy"] - 0;
			var rx = obj.attrs["rx"] - 0;
			var ry = obj.attrs["ry"] - 0;
			var mat = obj.matrix;
			var PT = PointTransform(x, y, mat);
			x = PT.x;
			y = PT.y;
			var PTH = PointTransform(x + w, y + h, mat);
			rx = rx * mat.a; //PTH.x-x;
			ry = ry * mat.d; //PTH.y-y;
			//obj.attr({x:x,y:y});
			//obj.transform("");
			obj.attr({
				cx: x,
				cy: y,
				rx: rx,
				ry: ry
			});
			obj.transform("");
			return;
		}
		if (vtype == "line") {
			var path = obj.attrs["path"];
			var x1 = path[0][1];
			var y1 = path[0][2];

			var x2 = path[1][1];
			var y2 = path[1][2];

			var mat = obj.matrix;
			var PT1 = PointTransform(x1, y1, mat);
			var PT2 = PointTransform(x2, y2, mat);

			x1 = PT1.x;
			y1 = PT1.y;

			x2 = PT2.x;
			y2 = PT2.y;
			//obj.attr({x1:x1,y1:y1,x2:x2,y2:y2});
			obj.attr("path", "M" + x1 + "," + y1 + "L" + x2 + "," + y2);
			obj.transform("");
			return;
		}
		if (vtype == "text") {
			var x = obj.attrs["x"] - 0;
			var y = obj.attrs["y"] - 0;
			var w = obj.attrs["width"] - 0;
			var h = obj.attrs["height"] - 0;
			var mat = obj.matrix;
			var fs = obj.attrs["font-size"];
			fs = parseInt(fs);

			var PT = PointTransform(x, y, mat);
			x = PT.x;
			y = PT.y;
			var PTH = PointTransform(x + w, y + h, mat);
			w = w * mat.a; //PTH.x-x;
			h = h * mat.d; //PTH.y-y;

			var z = (mat.a + mat.d) / 2;
			obj.attr({
				x: x,
				y: y,
				width: w,
				height: h
			});
			obj.attr("font-size", fs * z + "px");
			obj.transform("");
		}
	}

	var Me = this;
	var paper = null;
	var Showhandle = false;
	var dragNode = null;

	/**
	 * [hidehandle 隐藏所有把手]
	 * @author huzc
	 * @date   2015-03-04
	 */
	function hidehandle() {
		paper.clearHandle();
	}

	/**
	 * [setPenType 设置绘制的画笔类型]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[字符串]}   stype [画笔类型]
	 */
	function setPenType(stype) {
		BindEvent(stype);
	}

	var DragNode = null;

	/**
	 * [Prevent 阻止默认事件]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[对象]}   evt [事件event对象]
	 */
	function Prevent(evt) {
		if (window.ActiveXObject) {
			window.event.returnValue = false;
			window.event.cancelBubble = true;
		} else {
			evt.stopPropagation();
			evt.preventDefault();
		}
	}

	/**
	 * [BindEvent 绑定事件]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[字符串]}   stype [需要绘制图形的类型]
	 */
	function BindEvent(stype) 
	{

		DrawEditor.PenType=stype;
		var mousedown = false;
		var x1 = 0;
		var y1 = 0;

		var x2 = 0;
		var y2 = 0;

		//var x0=$ID("canvas").offsetLeft;
		//var y0=$ID("canvas").offsetTop;
		var x0 = getX($ID(DrawEditor.id));
		// var y0=getY($ID(DrawEditor.id)) + 100;//zhangyu 2014-10-22，临时处理，待老胡处理
		// 图研判中不用加100
		if (DrawEditor.imagejudge) {
			var y0 = getY($ID(DrawEditor.id));
		} else {
			// 一二级导航修改成iframe后，计算画笔位置时，要减去导航的86像素
			var y0 = getY($ID(DrawEditor.id)) + 4; //zhangyu 2014-10-22，临时处理，待老胡处理
		};


		document.onmousedown = null;
		document.onmousemove = null;
		document.onmouseup = null;
		//var obj=window["draw"+stype]();

		var obj = eval("draw" + stype + "()");
		if (stype == "select") {
			return
		}
		//x0=0;
		//y0=0;
		document.oncontextmenu = function() {  
			event.returnValue = false;  
		} 
			
		document.onmousedown = function(evt) {
			var e = window.event || evt;
			if(e.button == 2){
				DrawEditor.setPenType("select");
				DrawEditor.deletedom();
				e.returnValue=false;
				e.cancelBubble=true;
				// e.stopPropagation();
			} else {
				DE.status = "drawing";
				Prevent(evt);
				var node = e.srcElement || e.target;
				mousedown = true;
				x1 = x2 = e.clientX - x0;
				y1 = y2 = e.clientY - y0;
				if (x1 <= 0 || x2 <= 0 || y1 <= 0 || y2 <= 0 || x1>paper.width || y1>paper.height) {
					return
				}
				if (node) {
						var elm = obj.down(node, x1, y1, x2, y2);
						if (stype == "select") {
							return
						}
				}
			}
		}
		
		document.onmousemove = function(evt) {
			var e = window.event || evt;
			Prevent(evt);
			var node = e.srcElement || e.target;
			x2 = e.clientX - x0;
			y2 = e.clientY - y0;
			if (x1 <= 0 || x2 <= 0 || y1 <= 0 || y2 <= 0) {
				return;
			}
			if (mousedown && node) {
				obj.move(node, x1, y1, x2, y2);
			}
			if(node&&typeof(obj.keepmove)=="function")
			{
				 obj.keepmove(node, x1, y1, x2, y2);
			}
		}

		document.onmouseup = function(evt) {
			DE.status = "default";
			var e = window.event || evt;
			Prevent(evt);
			var node = e.srcElement || e.target;
			x2 = e.clientX - x0;
			y2 = e.clientY - y0;
			if (x1 <= 0 || x2 <= 0 || y1 <= 0 || y2 <= 0) {
				return
			}
			mousedown = false;

			if (obj.up) {
				obj.up(node, x1, y1, x2, y2);
			}
		}
	}

	/**
	 * [getPoint 获取某点P，P与两点之间线段AB垂直，P到AB的距离为单位n，一个单位为d]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[数字]}   x1 [坐标]
	 * @param  {[数字]}   y1 [坐标]
	 * @param  {[数字]}   x2 [坐标]
	 * @param  {[数字]}   y2 [坐标]
	 * @param  {[数字]}   d  [有向距离]
	 * @param  {[数字]}   n  [倍数]
	 * @return {[数组]}      [坐标数组]
	 */
	function getPoint(x1, y1, x2, y2, d, n) {
		var x0 = (x1 + x2) / 2;
		var y0 = (y1 + y2) / 2;

		if (x1 == x2 && y1 == y2) {
			return [x1, y1]
		} else if (y1 == y2) {
			return [x0, y0 + n * d];
		} else if (x1 == x2) {
			return [x0 + n * d, y0];
		}

		var k = (y2 - y1) / (x2 - x1);
		var t = n * d / Math.sqrt(1 + 1 / (k * k));
		var a = x0 + t;
		var b = y0 + (-1 / k) * t;
		if (y2 < y1) {
			var a = x0 - t;
			var b = y0 - (-1 / k) * t;
		}
		return [a, b];
	}

	/**
	 * [DragMainNode 生成带箭头的单跨线，包含鼠标略过效果，和鼠标点击效果;拖动主元素的时候也拖动箭头;]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[对象]}   Main [需要拖动的元素]
	 */
	function DragMainNode(Main) {
		Main.undrag();
		Main.dragtable({
			down: function(obj, dx, dy) {
				var str = Main.attr("path");
				var pathM = Raphael.parsePathString(str);
				this.pathM = pathM;
				this.dx = 0;
				this.dy = 0;
			},
			move: function(obj, dx, dy, x, y) {
				var pathM = this.pathM;
				var Mat1 = PointTransform(pathM[0][1], pathM[0][2], Main.matrix);
				var x1 = Mat1.x;
				var y1 = Mat1.y;

				var Mat2 = PointTransform(pathM[1][1], pathM[1][2], Main.matrix);
				var x2 = Mat2.x;
				var y2 = Mat2.y;
				//console.log(x1,y1,x2,y2)
				MoveLineHandle(Main, x1, y1, x2, y2);
				this.dx = dx;
				this.dy = dy;
			},

			up: function(obj) {
				//SimpleTransform(Main);
				//console.log(Main);
				var str = Main.attr("path");
				var pathM = Raphael.parsePathString(str);
				//var pathM=this.pathM;

				var Mat1 = PointTransform(pathM[0][1], pathM[0][2], Main.matrix);
				var x1 = Mat1.x;
				var y1 = Mat1.y;

				var Mat2 = PointTransform(pathM[1][1], pathM[1][2], Main.matrix);
				var x2 = Mat2.x;
				var y2 = Mat2.y;
				//if(x1<0){x1=0;}
				//if(y1<0){y1=0;}
				//if(x2<0){x2=0;}
				//if(y2<0){y2=0;}
				var w = Math.abs(x2 - x1);
				var h = Math.abs(y2 - y1);
				var min_x = Math.min(x1, x2);
				var min_y = Math.min(y1, y2);

				var max_x = Math.max(x1, x2);
				var max_y = Math.max(y1, y2);

				//console.log(Main.matrix);
				//console.log(x1,x2,y1,y2);
				if (min_x < 50) {
					x1 = x1 + Math.abs(min_x) + 50;
					x2 = x2 + Math.abs(min_x) + 50;
				}

				if (min_y < 50) {
					y1 = y1 + Math.abs(min_y) + 50;
					y2 = y2 + Math.abs(min_y) + 50;
				}

				if (max_x > DE.width) {
					var dx = max_x - DE.width;
					x1 = x1 - dx;
					x2 = x2 - dx;
				}
				if (max_y > DE.height) {
					var dy = max_y - DE.height;
					y1 = y1 - dy;
					y2 = y2 - dy;
				}
				DE.clearHandle();
				MoveLineHandle(Main, x1, y1, x2, y2);
				getArrowlineHandle(Main);

				if (this.dx != 0 && this.dy != 0) {
					//console.log("Arrowline_onchange"+dx+","+dy);
					//console.log(this.dx);
					//console.log(this.dy);
					Arrowline_onchange(Main);
				}
			}
		});
	}

	/**
	 * [getArrow_path 生成箭头的路径字符串]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[数字]}   x1 [坐标]
	 * @param  {[数字]}   y1 [坐标]
	 * @param  {[数字]}   x2 [坐标]
	 * @param  {[数字]}   y2 [坐标]
	 * @param  {[数字]}   n  [倍数]
	 * @return {[字符串]}    [svg path字符串]
	 */
	function getArrow_path(x1, y1, x2, y2, n) {
		var dx = x2 - x1;
		var dy = y2 - y1;
		if (dx == 0 && dy == 0) {
			var path = "M" + x1 + "," + x1 + "L" + x1 + "," + x1 + "M" + x1 + "," + x1 + "L" + x1 + "," + x1 + "L" + x1 + "," + x1 + "";
			return path;
		}
		if (dx != 0 && dy == 0) {
			if (x2 > x1) {
				var path = "M" + x1 + "," + y1 + "L" + x2 + "," + y2 + "M" + (x2 - 10) + "," + (y2 - 10) + "L" + x2 + "," + y2 + "L" + (x2 - 10) + "," + (y2 + 10) + "";
			} else {
				var path = "M" + x1 + "," + y1 + "L" + x2 + "," + y2 + "M" + (x2 + 10) + "," + (y2 + 10) + "L" + x2 + "," + y2 + "L" + (x2 + 10) + "," + (y2 - 10) + "";
			}
			return path;
		}
		if (dx == 0 && dy != 0) {
			if (y2 > y1) {
				var path = "M" + x1 + "," + y1 + "L" + x2 + "," + y2 + "M" + (x2 - 10) + "," + (y2 - 10) + "L" + x2 + "," + y2 + "L" + (x2 + 10) + "," + (y2 - 10) + "";
			} else {
				var path = "M" + x1 + "," + y1 + "L" + x2 + "," + y2 + "M" + (x2 - 10) + "," + (y2 - 10) + "L" + x2 + "," + y2 + "L" + (x2 + 10) + "," + (y2 - 10) + "";
			}
			return path;
		}

		//if(dx<0&&dy>0){var t=10/Math.sqrt(1+k*k);}
		//if(dx>0&&dy>0){var t=-10/Math.sqrt(1+k*k);}
		//if(dx<0&&dy<0){var t=10/Math.sqrt(1+k*k);}
		//if(dx>0&&dy<0){var t=-10/Math.sqrt(1+k*k);}
		//if(dx<0){var s=1};
		//if(dx>0){var s=-1}

		var k = dy / dx;
		var s = (dx < 0) ? 1 : -1;
		var t = s * 10 / Math.sqrt(1 + k * k);
		var x = x2 + t;
		var y = y2 + t * k;
		var u = 10 / Math.sqrt(1 + 1 / (k * k));
		var a = x + u;
		var b = y + (-1 / k) * u;
		var c = x - u;
		var d = y + (1 / k) * u;
		var path = "M" + x1 + "," + y1 + "L" + x2 + "," + y2 + "M" + a + "," + b + "L" + x2 + "," + y2 + "L" + c + "," + d;
		//console.log(path);
		return path;
	}

	/**
	 * [draw_Arrowline 绘制箭头直线]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[数字]}   x1 [坐标]
	 * @param  {[数字]}   y1 [坐标]
	 * @param  {[数字]}   x2 [坐标]
	 * @param  {[数字]}   y2 [坐标]
	 * @return {[对象]}      [结构化对象]
	 */
	function draw_Arrowline(x1, y1, x2, y2) {
		var A = getPoint(x1, y1, x2, y2, 20, 1);
		var a = A[0] - 0;
		var b = A[1] - 0;

		var B = getPoint(x1, y1, x2, y2, 50, 1);
		var c = B[0] - 0;
		var d = B[1] - 0;
		if (c == a) {
			c = a + 10;
		}
		if (d == b) {
			d = b + 10;
		}

		var C = getPoint(x1, y1, x2, y2, 20, -1);
		var a1 = C[0] - 0;
		var b1 = C[1] - 0;

		var D = getPoint(x1, y1, x2, y2, 50, -1);
		var c1 = D[0] - 0;
		var d1 = D[1] - 0;
		if (c1 == a1) {
			c1 = a1 + 10;
		}
		if (d1 == b1) {
			d1 = b1 + 10;
		}

		//console.log(B);
		function setProp(path, vtype, index) {
			var node = paper.path(path);
			//node.attr("stroke","black");
			node.attr("stroke", DrawEditor.strokecolor);
			node.attr("stroke-width", DrawEditor.strokewidth);
			node.data("vtype", vtype);
			node.data("groupindex", index);
			return node;
		}

		var path = "M" + x1 + "," + y1 + "L" + x2 + "," + y2;
		var Main = setProp(path, "Arrowline", "0");
		Main.attr("cursor", "Move");

		//var Arrowpath1="M"+(a)+","+(b)+"L"+(c)+","+(d);
		var Arrowpath1 = getArrow_path(a, b, c, d, 1);

		var Arrow1 = setProp(Arrowpath1, "_Arrowline", "1");
		//Arrow1.attr("arrow-end","classic");

		//var Arrowpath2="M"+(a1)+","+(b1)+"L"+(c1)+","+(d1);
		var Arrowpath2 = getArrow_path(a1, b1, c1, d1, -1);

		var Arrow2 = setProp(Arrowpath2, "_Arrowline", "2");
		//Arrow2.attr("arrow-end","classic");
		Arrow2.hide();
		Arrow2.isShow = false;
		Arrow1.isShow = true;
		//Arrow2.isShow=true;

		Arrow1.click(function() {
			paper.clearHandle();
			if (Arrow2.isShow) {
				Arrow2.hide();
				Arrow2.isShow = false;
			} else {
				Arrow2.show();
				Arrow2.isShow = true;
			}
			Arrowline_onchange(Main);
		});

		Arrow2.click(function() {
			paper.clearHandle();
			if (Arrow1.isShow) {
				Arrow1.hide();
				Arrow1.isShow = false;
			} else {
				Arrow1.show();
				Arrow1.isShow = true;
			}
			Arrowline_onchange(Main);
		});

		Arrow1.undrag();
		Arrow2.undrag();

		DragMainNode(Main);

		Main.mousedown(function() {
			paper.clearHandle();
			//封装事件
			DrawEditor._highlight(Main, "red");
		});

		Main.mouseup(function() {
			var vtype = Main.data("vtype");
			var twoline = Main.data("twoline");
			var polyline = Main.data("polyline");
			var groupindex = Main.data("groupindex");
			if (twoline) {
				var index = twoline - 0;
				if (index != 0 && index != 3) {
					return
				}
				if (index == 3) {
					var drawNode1 = Main.prev.prev.prev;
					var id = drawNode1.data("domid");
					var text = drawNode1.data("text");
					DrawEditor.currentid = id;
					//alert([index,id,text,drawNode1]);
					getArrowlineHandle(Main);

					DrawEditor.onselect(id, text, drawNode1);
				}
				if (index == 0) {
					var id = Main.data("domid");
					var text = Main.data("text");
					DrawEditor.currentid = id;
					getArrowlineHandle(Main);

					DrawEditor._highlight(Main);
					DrawEditor.onselect(id, text, Main);
				}
				return;
			}
			var id = Main.data("domid");
			var text = Main.data("text");
			DrawEditor.currentid = id;
			DrawEditor._highlight(Main);
			getArrowlineHandle(Main);
			DrawEditor.onselect(id, text, Main);
		});

		return {
			Main: Main,
			Arrow1: Arrow1,
			Arrow2: Arrow2
		};
	}
	/**
	 * [drawArrowline 绘制带双箭头的线段]
	 * @author huzc
	 * @date   2015-03-04
	 * @return {[对象]}   [结构化对象]
	 */
	function drawArrowline() {
		var obj = {};
		var A, B;

		var drawNode = null;
		var Arrow1 = null;
		var Arrow2 = null;


		obj.down = function(node, x1, y1, x2, y2) {
			var myobj = draw_Arrowline(x1, y1, x2, y2, 1);
			drawNode = myobj.Main;
			Arrow1 = myobj.Arrow1;
			Arrow2 = myobj.Arrow2;
			var domid = "id_" + Math.random();
			drawNode.data("domid", domid);
			this.dx = 0;
			this.dy = 0;
		}

		obj.move = function(node, x1, y1, x2, y2) {
			this.dx = x2 - x1;
			this.dy = y2 - y1;
			var A = getPoint(x1, y1, x2, y2, 20, 1);
			var a = A[0];
			var b = A[1];
			var B = getPoint(x1, y1, x2, y2, 50, 1);
			var c = B[0];
			var d = B[1];

			var C = getPoint(x1, y1, x2, y2, 20, -1);
			var a1 = C[0];
			var b1 = C[1];
			var D = getPoint(x1, y1, x2, y2, 50, -1);
			var c1 = D[0];
			var d1 = D[1];

			var path1 = "M" + x1 + "," + y1 + "L" + x2 + "," + y2;
			drawNode.attr("path", path1);

			//var path2="M"+a+","+b+"L"+c+","+d;
			var path2 = getArrow_path(a, b, c, d, 1);
			Arrow1.attr("path", path2);

			//var path3="M"+a1+","+b1+"L"+c1+","+d1;
			var path3 = getArrow_path(a1, b1, c1, d1, -1);
			Arrow2.attr("path", path3);
		}

		obj.up = function(node, x1, y1, x2, y2) {
			var dis = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
			//if(this.dx==0&&this.dy==0)
			if (dis <= 50) {
				DrawEditor.clearHandle();
				drawNode.remove();
				Arrow1.remove();
				Arrow2.remove();
				return;
			}
			document.onmousedown = null;
			document.onmousemove = null;
			document.onmouseup = null;
			Arrow1.undrag();
			Arrow2.undrag();
			Arrowline_onchange(drawNode);
		}
		return obj;
	}

	/**
	 * [Arrowline_onchange 绘制箭头直线绑定change事件]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[对象]}   drawNode [元素对象]
	 */
	function Arrowline_onchange(drawNode) {
		var vtype = drawNode.data("vtype");
		var twoline = drawNode.data("twoline");
		var polyline = drawNode.data("polyline");
		var groupindex = drawNode.data("groupindex");

		if (twoline) {
			var index = twoline - 0;
			if (index != 0 && index != 3) {
				return
			}
			if (index == 3) {
				var drawNode1 = drawNode.prev.prev.prev;
				Doubleline_onchange(drawNode1, drawNode);
			}
			if (index == 0) {
				var drawNode2 = drawNode.next.next.next;
				Doubleline_onchange(drawNode, drawNode2);
			}
			return;
		}

		var str0 = drawNode.attr("path");
		var path0 = Raphael.parsePathString(str0);
		var x0 = path0[0][1];
		var y0 = path0[0][2];

		var x1 = path0[1][1];
		var y1 = path0[1][2];

		var str1 = drawNode.next.attr("path");
		//console.log(str1);
		var path1 = Raphael.parsePathString(str1);
		var x2 = path1[0][1];
		var y2 = path1[0][2];

		var x3 = path1[1][1];
		var y3 = path1[1][2];

		var str2 = drawNode.next.next.attr("path");
		//console.log(str2);
		var path2 = Raphael.parsePathString(str2);
		var x4 = path2[0][1];
		var y4 = path2[0][2];

		var x5 = path2[1][1];
		var y5 = path2[1][2];

		var points =
			[
				[x0, y0],
				[x1, y1],
				[x2, y2],
				[x3, y3],
				[x4, y4],
				[x5, y5]
			];

		var jsondata = {
			domid: drawNode.data("domid"),
			type: "DoubleArrowline",
			color: drawNode.attr("stroke"),
			strokewidth: drawNode.attr("stroke-width"),
			text: drawNode.data("text"),
			points: points,
			node: drawNode
		};

		//console.log(drawNode.next.isShow);
		//console.log(drawNode.next.next.isShow);

		if (drawNode.next.isShow && !drawNode.next.next.isShow) {
			//console.log(1);
			jsondata.points = [
				[x0, y0],
				[x1, y1],
				[x2, y2],
				[x3, y3]
			];
			jsondata.type = "SingleArrowline";
		}
		if (!drawNode.next.isShow && drawNode.next.next.isShow) {
			// console.log(2);
			jsondata.points = [
				[x0, y0],
				[x1, y1],
				[x4, y4],
				[x5, y5]
			];
			jsondata.type = "SingleArrowline";
		}
		DrawEditor.onchange(jsondata);
	}

	function test() {
		var A = [];
		paper.forEach(function(el) {
			if (el.data("handle")) {
				A.push(el);
			}
		});
		var L = A.length;
		//console.log(L);
	}

	/**
	 * [setPolylineDrag 设置多边形显示编辑状态]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[raphael对象]}   Main [多边形主元素]
	 */
	function setPolylineDrag(Main) {
		Main.undrag();
		Main.dragtable({
			down: function(obj, dx, dy) {
				var str = Main.attr("path");
				var pathM = Raphael.parsePathString(str);
				this.pathM = pathM;
			},
			move: function(obj, dx, dy, x, y) {
				var pathM = this.pathM;
				var Mat1 = PointTransform(pathM[0][1], pathM[0][2], Main.matrix);
				var x1 = Mat1.x;
				var y1 = Mat1.y;
				console.log( Main.matrix)
				var Mat2 = PointTransform(pathM[1][1], pathM[1][2], Main.matrix);
				var x2 = Mat2.x;
				var y2 = Mat2.y;
				// MoveLineHandle(Main,x1,y1,x2,y2);
				if (Main.next && Main.next.type == "text") {
					Main.next.attr({
						x: x1 - 10,
						y: y1 - 20
					});
				}

			},

			up: function(obj, dx, dy) {
				//SimpleTransform(obj);
				var str = Main.attr("path");
				var pathM = Raphael.parsePathString(str);
				var e = Main.matrix.e;
				var f = Main.matrix.f;

				var L = pathM.length;
				var minx = 0;
				var miny = 0;
				var maxx = 0;
				var maxy = 0;

				var Box = Main.getBBox();
				var dx = 0;
				var dy = 0;
				if (Box.x2 > DE.width) {
					dx = Box.x2 - DE.width;
				}

				if (Box.y2 > DE.height) {
					dy = Box.y2 - DE.height;
				}

				var len = (DrawEditor.imagejudge !== undefined && DrawEditor.imagejudge) ? 0 : 50;
				if (Box.x < len) {
						dx = Box.x - len;
				}
				if (Box.y < len) {
						dy = Box.y - len;
				}
				var str = "";

				//console.log(dx,dy);

				DE.clearHandle();

				for (var i = 0; i <= L - 2; i++) {
					if (i == 0) {
						str = str + "M" + (pathM[0][1] + e - dx) + "," + (pathM[0][2] + f - dy);
					} else {
						str = str + "L" + (pathM[i][1] + e - dx) + "," + (pathM[i][2] + f - dy);
					}
				}
				str = str + "Z";
				Main.attr("path", str);
				Main.transform("");

				getPolyHandle(Main);

				var str = Main.attr("path");
				var pathM = Raphael.parsePathString(str);
				this.pathM = pathM;
				this.move(obj, dx, dy, 0, 0);
				/**
				 * 不能用dx和dy是不是为0来判断是不是要触发函数，经过测试在一般不改变句柄进行拖动的
				 * 情况下，Box.x 和Box.y 都是大于0的，所以不用进if判断的，从而dy和dx的值为0，不会触
				 * 发poly_onchange   BY wangxiaojun
				 */
				// if(dx!=0&&dy!=0)
				// {
				poly_onchange(Main);
				// }
			}
		});
	}

	/**
	 * [drawpoly 绘制多边形]
	 * @author huzc
	 * @date   2015-03-04
	 * @return {[raphael对象]}   [主元素对象]
	 */
	function drawpoly() {
		var obj = {};
		var drawNode = null;
		obj.init = function(node, x1, y1, x2, y2) {

		}
		var A = [];

		function getPath(A) {
			var L = A.length;
			var str = "";
			for (i = 0; i <= L - 1; i++) {
				if (i == 0) {
					str = "M" + A[i][0] + "," + A[i][1];
				} else {
					str = str + "L" + A[i][0] + "," + A[i][1];
				}
			}
			return str;
		}

		function stopPP(e) {
			var evt = e || window.event;
			if (evt.stopPropagation) {
				evt.stopPropagation()
			} else {
				evt.cancelBubble = true;
			}

			if (e && e.preventDefault) {
				e.preventDefault();
			} else {
				window.event.returnValue = false;
			}
		}

		var draw = true;
		obj.down = function(node, x1, y1, x2, y2) {
			if (draw == false) {
				return
			}
			var L = A.length;
			if (L >= 1) {
				var x = A[L - 1][0];
				var y = A[L - 1][1];
				DE.status = "drawpoly";
				if (x == x1 && y == y1) {
					if (L <= 2) {
						drawNode.remove();
						if (drawNode.next && drawNode.next.type == "text") {
							drawNode.next.remove();
						}
						draw = false;
						return;
					}
					var str = drawNode.attr("path");

//					str=(str+"").replace(/\L\d+\,\d+$/gi,"");
					//alert(str);

					drawNode.attr("path", str + "Z");
					draw = false;
					drawNode.mouseup(function() {
						DrawEditor._highlight(drawNode, "red");
						getPolyHandle(this);
						var jsondata = {};
						var id = drawNode.data("domid");
						var text = drawNode.data("text");
						DrawEditor.currentid = id;
						DrawEditor.onselect(id, text);
					});

					DrawEditor.clearHandle();
					getPolyHandle(drawNode);
					setPolylineDrag(drawNode);
					DrawEditor.selectNode = drawNode;

					drawNode.mousedown(function() {
						paper.clearHandle();
					});

					setTimeout(function() {
						//getPolyHandle(drawNode);
						poly_onchange(drawNode);
					}, 50);
					BindEvent("select");
					//document.onmousedown=null;
					//document.onmousemove=null;
					//document.onmouseup=null;
					DE.status = "default";
					DE.drawingPolyNode=null;
					return;
				}
			}
			var rect = paper.rect(x1 - 4, y1 - 4, 8, 8);
			rect.attr("fill", "white");
			rect.data("handle", "true");

			A.push([x1, y1, rect]);
			var str = getPath(A);
			if (A.length == 1) {
				//setTimeout(function(){FirstRect(rect,x1,y1);},10);
			}

			if (drawNode) {
				drawNode.attr("path", str);
			} else {
				drawNode = paper.path(str);
				drawNode.attr("stroke-width", DrawEditor.strokewidth);
				drawNode.attr("cursor", "Move");
				rect.insertAfter(drawNode);
			}
			DE.drawingPolyNode = drawNode;
			drawNode.attr("stroke", DrawEditor.strokecolor);
			drawNode.data("vtype", "polyline");
			drawNode.data("polyline", "true");
			var domid = "id_" + Math.random();
			drawNode.data("domid", domid);
			return drawNode;
		}

		obj.move = function(node, x1, y1, x2, y2) {
			//console.log(x1+","+y1+","+x2+","+y2);
			var str = getPath(A);
			str=str+","+x2+","+y2;
			//console.log("str="+str);
			drawNode.attr("path",str);
			//this.node.attr({cx:x,cy:y,rx:rx,ry:ry});
		}

		obj.keepmove=function(node, x1, y1, x2, y2){
			var str = getPath(A);
			str=str+","+x2+","+y2;
			drawNode.attr("path",str);
		}
		obj.rightButton=function(node, x1, y1, x2, y2){
			DE.deletedom();
		}
		return obj;
	}

	/**
	 * [poly_onchange 绑定多边形的change事件]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[raphael对象]}   node [多边形主元素对象]
	 * @return {[type]}        [无]
	 */
	function poly_onchange(node) {
		var str = node.attr("path");
		var path = Raphael.parsePathString(str);
		var L = path.length;
		var B = [];
		for (var i = 0; i <= L - 1; i++) {
			if (path[i][0] == "Z") {
				break;
			}
			var obj = PointTransform(path[i][1], path[i][2], node.matrix);
			B[i] = [obj.x, obj.y];
		}
		var jsondata = {
			domid: node.data("domid"),
			type: "polyline",
			color: node.attr("stroke"),
			strokewidth: node.attr("stroke-width"),
			text: node.data("text"),
			points: B,
			node: node
		}
		DrawEditor.onchange(jsondata);
	}

	/**
	 * [MoveLineHandle 拖动直线需要执行的函数]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[对象]}   el [元素]
	 * @param  {[数字]}   x1 [坐标]
	 * @param  {[数字]}   y1 [坐标]
	 * @param  {[数字]}   x2 [坐标]
	 * @param  {[数字]}   y2 [坐标]
	 */
	function MoveLineHandle(el, x1, y1, x2, y2) {
			var A = getPoint(x1, y1, x2, y2, 20, 1);
			var a = A[0];
			var b = A[1];

			var B = getPoint(x1, y1, x2, y2, 50, 1);
			var c = B[0];
			var d = B[1];

			var path0 = "M" + x1 + "," + y1 + "L" + x2 + "," + y2;
			el.transform("");
			el.attr("path", path0);

			//var path1="M"+a+","+b+"L"+c+","+d;
			var path1 = getArrow_path(a, b, c, d, 1);
			el.next.transform("");
			el.next.attr("path", path1);

			var vtype = el.data("vtype");
			//console.log(vtype);

			var C = getPoint(x1, y1, x2, y2, 20, -1);
			var a1 = C[0];
			var b1 = C[1];

			var D = getPoint(x1, y1, x2, y2, 50, -1);
			var c1 = D[0];
			var d1 = D[1];

			//var path2="M"+a1+","+b1+"L"+c1+","+d1;
			var path2 = getArrow_path(a1, b1, c1, d1, -1);
			el.next.next.transform("");
			el.next.next.attr("path", path2);

			var vtype = el.data("vtype");
			var twoline = el.data("twoline");
			var polyline = el.data("polyline");
			var groupindex = el.data("groupindex");
			if (twoline) {
				var index = twoline - 0;
				if (index != 0 && index != 3) {
					return
				}
				if (index == 3) {
					var TestTitle = el.next.next.next;
				}
				if (index == 0) {
					var TestTitle = el.next.next.next.next.next.next;
				}
				if (TestTitle && TestTitle.type == "text") {
					TestTitle.transform("");
					TestTitle.attr({
						x: x1 - 10,
						y: y1 - 20
					});
				}
				return;
			}
			if (vtype) {
				var TestTitle = el.next.next.next;
				if (TestTitle && TestTitle.type == "text") {
					TestTitle.transform("");
					TestTitle.attr({
						x: x1 - 10,
						y: y1 - 20
					});
				}
			}
		}
	//https://github.com/ElbertF/Raphael.Export
	//https://github.com/ElbertF/Raphael.JSON
	/**
	 * [getArrowlineHandle 设置箭头线的编辑状态]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[raphael对象]}   el [对象]
	 * @return {[type]}      [对象]
	 */
	function getArrowlineHandle(el) {
			var vtype = el.data("vtype");
			var index = el.data("groupindex");
			if (index != "0") {
				alert([index, vtype]);
				return
			}

			var Matrix = el.matrix;
			var str = el.attr("path");
			var A = Raphael.parsePathString(str);

			var x1 = A[0][1];
			var y1 = A[0][2];

			var x2 = A[1][1];
			var y2 = A[1][2];

			var P = PointTransform(x1, y1, Matrix);
			var Q = PointTransform(x2, y2, Matrix);

			var PointA = paper.rect(P.x - 4, P.y - 4, 8, 8).attr("fill", "white");
			var PointB = paper.rect(Q.x - 4, Q.y - 4, 8, 8).attr("fill", "white");

			PointA.hover(function() {
				this.attr("fill", "red");
			}, function() {
				this.attr("fill", "white");
			});

			PointB.hover(function() {
				this.attr("fill", "red");
			}, function() {
				this.attr("fill", "white");
			});

			PointA.data("handle", "point");
			PointB.data("handle", "point");

			PointA.transform("");
			PointB.transform("");

			PointA.dragtable({
				move: function(obj, dx, dy, x, y) {
					var x1 = PointA.attrs["x"] + 4 + dx;
					var y1 = PointA.attrs["y"] + 4 + dy;
					var x2 = PointB.attrs["x"] + 4;
					var y2 = PointB.attrs["y"] + 4;
					//console.log([x1,y1,x2,y2]);
					//var str="M"+x1+","+y1+"L"+x2+","+y2;
					MoveLineHandle(el, x1, y1, x2, y2);
				},
				up: function(obj, dx, dy) {
					SimpleTransform(obj);
					Arrowline_onchange(el);
				}
			});
			PointB.dragtable({
				move: function(obj, dx, dy) {
					var x1 = PointA.attrs["x"] + 4;
					var y1 = PointA.attrs["y"] + 4;
					var x2 = PointB.attrs["x"] + 4 + dx;
					var y2 = PointB.attrs["y"] + 4 + dy;
					MoveLineHandle(el, x1, y1, x2, y2);
				},

				up: function(obj, dx, dy) {
					SimpleTransform(obj);
					Arrowline_onchange(el);
				}
			});
			return [PointA, PointB];
	}
	/**
	 * [getPolyHandle 设置显示多边形的编辑点]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[raphael对象]}   el [对象]
	 * @return {[type]}      [description]
	 */
	function getPolyHandle(el) {
		var Matrix = el.matrix;
		var str = el.attr("path");
		var A = Raphael.parsePathString(str);
		var L = A.length;
		//console.log(A);
		var B = [];

		function getStr(B) {
			var str = "";
			var syb = "L";
			var L = B.length;
			for (var j = 0; j <= L - 1; j++) {
				var x = B[j].attrs["x"] + 4;
				var y = B[j].attrs["y"] + 4;
				var obj = PointTransform(x, y, B[j].matrix);
				if (j == 0) {
					syb = "M"
				} else {
					syb = "L"
				}
				str = str + syb + obj.x + "," + obj.y;
			}
			return str;
		}

		for (var i = 0; i < L - 1; i++) {
			if (A[i][0] == "Z") {
				continue;
			}
			var obj = PointTransform(A[i][1], A[i][2], Matrix);
			var x = obj.x;
			var y = obj.y;
			B[i] = paper.rect(x - 4, y - 4, 8, 8);
			B[i].data("handle", "rect");
			B[i].attr("fill", "white");
			B[i].hover(function(obj) {
				this.attr("fill", "red");
			}, function(obj) {
				this.attr("fill", "white");
			});
			B[i].dragtable({
				move: function(obj, dx, dy, x, y) {
					var str = getStr(B);
					el.transform("");
					el.attr("path", str + "Z");
					//console.log(str);
					if (el.next && el.next.type == "text") {
						var x0 = B[0].attrs["x"] + 4;
						var y0 = B[0].attrs["y"] + 4;
						var M0 = PointTransform(x0, y0, B[0].matrix);
						el.next.attr({
							x: M0.x - 10,
							y: M0.y - 20
						});
					}
				},
				up: function(obj, dx, dy) {
					SimpleTransform(obj);
					if (dx != 0 && dy != 0) {
						poly_onchange(el);
					}
				}
			});
		}
	}

	function drawselect() {

	}
	/**
	 * [getBrother 获取相邻的兄弟节点]
	 * @author huzc
	 * @date   2015-07-09
	 * @param  {[type]}   node  [元素]
	 * @param  {[type]}   stype [左侧还是右侧]
	 * @param  {[type]}   n     [第几个元素]
	 * @return {[type]}         [description]
	 */
	function getBrother(node, stype, n) {
		for (var i = 0; i <= n - 1; i++) {
			if (stype == "next") {
				node = node.next;
			} else if (stype == "prev") {
				node = node.prev;
			}
		}
		return node;
	}

	/**
	 * [drawdelete 删除元素]
	 * @author huzc
	 * @date   2015-03-04
	 * @return {[type]}   [description]
	 */
	function drawdelete() {
		var obj = {};
		paper.clearHandle();
		obj.down = function(node, x1, y1, x2, y2) {
			//console.log(node);
			setTimeout(function() {
				paper.clearHandle();
				//var id=DrawEditor.currentid;
				//console.log(id);
				//var node=paper.getById(id);
				var node = DrawEditor.selectNode;
				if (!node) {
					return;
				}

				var vtype = node.data("vtype");
				var twoline = node.data("twoline");
				var polyline = node.data("polyline");
				var groupindex = node.data("groupindex");
				//console.log(vtype);
				if (twoline) {
					var index = twoline - 0;
					if (index == 3) {
						node.prev.prev.prev.remove();
						node.prev.prev.remove();
						node.prev.remove();
						if (node.next.next.next && node.next.next.next.type == "text") {
							node.next.next.next.remove();
						}
						node.next.next.remove();
						node.next.remove();
						node.remove();
					}
					if (index == 0) {
						if (getBrother(node, "next", 6) && getBrother(node, "next", 6).type == "text") {
							getBrother(node, "next", 6).remove();
						}
						getBrother(node, "next", 5).remove();
						getBrother(node, "next", 4).remove();
						getBrother(node, "next", 3).remove();
						getBrother(node, "next", 2).remove();
						getBrother(node, "next", 1).remove();
						node.remove();
					}
					return;
				}
				if (polyline) {
					if (node.next && node.next.type == "text") {
						node.next.remove();
					}
					node.remove();
					return;
				}
				if (vtype) {
					if (vtype == "rect") {
						if (node.next && node.next.type == "text") {
							node.next.remove();
						}
						node.remove();
						return;
					}
					var index = groupindex - 0;
					if (index == 0) {
						try {
							if (node.next.next.next && node.next.next.next.type == "text") {
								node.next.next.next.remove();
							}
							node.next.next.remove();
							node.next.remove();
							node.remove();
						} catch (e) {
							alert("error");
						}
					}

					return;
				}
			}, 100);
		}
		obj.move = function() {}
		obj.up = function() {}
		return obj;
	}
	/**
	 * [drawrect 绘制矩形]
	 * @author huzc
	 * @date   2015-03-04
	 * @return {[对象]}   [对象]
	 */
	function drawrect() {
		var rect = null;
		var text = null;
		var obj = {};

		obj.down = function(node, x1, y1, x2, y2) {
			DE.status = "drawrect";
			this.dx = 0;
			this.dy = 0;
			rect = DrawEditor.add_rect({
				x: x1,
				y: y1,
				width: 0,
				height: 0,
				text: "   ",
				domid: "id_" + Math.random()
			});
			rect.attr("title", "左键单击选中，拖拽标定框把手改变大小");
		}

		obj.move = function(node, x1, y1, x2, y2) {
			this.dx = x2 - x1;
			this.dy = y2 - y1;
			var title = DrawEditor.rect_title;
			if (title != "") {
				return;
			}

			var x = Math.min(x1, x2);
			var y = Math.min(y1, y2);
			var w = Math.abs(x1 - x2);
			var h = Math.abs(y1 - y2);
			rect.attr({
				x: x,
				y: y,
				width: w,
				height: h
			});
			text = rect.next;
			text.attr({
				x: x + 18,  //对矩形的title进行向内移动，以便框线可以贴边显示 update by Leon.z
				y: y - 20
			});
		}

		obj.up = function(node, x1, y1, x2, y2) {
			DE.status = "default";
			var dis = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
			//if(this.dx==0&&this.dy==0)
			if (dis <= 50) {
				DrawEditor.clearHandle();
				if (rect.next && rect.next.type == "text") {
					rect.next.remove();
				}
				rect.remove();
				return;
			}
			document.onmousedown = null;
			document.onmousemove = null;
			document.onmouseup = null;
			setTimeout(function() {
				//showRectRange(rect);
			}, 20);

			Rect_onchange(rect);
		}
		return obj;
	}
	/**
	 * [moveText 移动元素文字标题]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[raphael对象]}   node [元素]
	 * @param  {[数字]}   x    [坐标]
	 * @param  {[数字]}   y    [坐标]
	 */
	function moveText(node, x, y) {
		if (node && node.next && node.next.type == "text") {
			node.next.attr({
				x: x + 18, //对矩形的title进行向内移动，以便框线可以贴边显示 update by Leon.z
				y: y - 20
			});
		}
	}

	/**
	 * [showRectRange 显示元素的编辑框]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[raphael对象]}   node [对象]
	 */
	function showRectRange(node) {
		var P = PointTransform(node.attr("x"), node.attr("y"), node.matrix);
		var x = P.x;
		var y = P.y;
		var w = node.attr("width") - 0;
		var h = node.attr("height") - 0;
		//console.log(x,y,w,h);
		var PointA = paper.rect(x - 4, y - 4, 8, 8).attr({
			"fill": "white",
			"cursor": "nw-resize"
		}).data("handle", "PointA");
		var PointB = paper.rect(x - 4 + w, y - 4, 8, 8).attr({
			"fill": "white",
			"cursor": "ne-resize"
		}).data("handle", "PointB");
		var PointC = paper.rect(x - 4 + w, y - 4 + h, 8, 8).attr({
			"fill": "white",
			"cursor": "se-resize"
		}).data("handle", "PointB");
		var PointD = paper.rect(x - 4, y - 4 + h, 8, 8).attr({
			"fill": "white",
			"cursor": "sw-resize"
		}).data("handle", "PointD");

		function saveinit(obj) {
			obj.PointAx = PointA.attr("x");
			obj.PointAy = PointA.attr("y");

			obj.PointBx = PointB.attr("x");
			obj.PointBy = PointB.attr("y");

			obj.PointCx = PointC.attr("x");
			obj.PointCy = PointC.attr("y");

			obj.PointDx = PointD.attr("x");
			obj.PointDy = PointD.attr("y");

			obj.x0 = node.attr("x");
			obj.y0 = node.attr("y");
			obj.w0 = node.attr("width");
			obj.h0 = node.attr("height");

			obj.dx = 0;
			obj.dy = 0;
		}

		function getABCD(PointA, PointB, PointC, PointD) {
			var A = PointTransform(PointA.attr("x"), PointA.attr("y"), PointA.matrix);
			var B = PointTransform(PointB.attr("x"), PointB.attr("y"), PointB.matrix);
			var C = PointTransform(PointC.attr("x"), PointC.attr("y"), PointC.matrix);
			var D = PointTransform(PointD.attr("x"), PointD.attr("y"), PointD.matrix);
			return {
				A: A,
				B: B,
				C: C,
				D: D
			}
		}

		function SimpleABCD() {
			SimpleTransform(PointA);
			SimpleTransform(PointB);
			SimpleTransform(PointC);
			SimpleTransform(PointD);
		}

		PointA.dragtable({
			down: function(_node, dx, dy, x, y) {
				saveinit(this);
			},
			move: function(_node, dx, dy, x, y) {
				var obj = getABCD(PointA, PointB, PointC, PointD);
				var A = obj.A;
				var B = obj.B;
				var C = obj.C;
				var D = obj.D;

				PointB.attr({
					y: A.y
				});
				PointD.attr({
					x: A.x
				});

				var x0 = (A.x < B.x) ? A.x : B.x;
				var y0 = (A.y < D.y) ? A.y : D.y;

				var w = Math.abs(A.x - C.x);
				var h = Math.abs(A.y - C.y);

				node.transform("");
				node.attr({
					x: x0 + 4,
					y: y0 + 4,
					width: w,
					height: h
				});
				moveText(node, x0 + 4, y0 + 4);
				this.dx = dx;
				this.dy = dy;
			},

			up: function(_node, dx, dy, x, y) {
				SimpleABCD();
				//console.log(this.dx,this.dy);
				if (this.dx != 0 && this.dy != 0) {
					Rect_onchange(node);
				}
				saveinit(this);
			}
		});

		PointB.dragtable({
			down: function(_node, dx, dy, x, y) {
				saveinit(this);
			},
			move: function(_node, dx, dy, x, y) {
				var obj = getABCD(PointA, PointB, PointC, PointD);
				var A = obj.A;
				var B = obj.B;
				var C = obj.C;
				var D = obj.D;

				PointA.attr({
					y: B.y
				});
				PointC.attr({
					x: B.x
				});

				var x0 = (A.x < B.x) ? A.x : B.x;
				var y0 = (B.y < D.y) ? B.y : D.y;

				var w = Math.abs(B.x - D.x);
				var h = Math.abs(B.y - D.y);

				node.transform("");
				node.attr({
					x: x0 + 4,
					y: y0 + 4,
					width: w,
					height: h
				});
				moveText(node, x0 + 4, y0 + 4);
				this.dx = dx;
				this.dy = dy;
			},
			up: function(_node, dx, dy, x, y) {
				SimpleABCD();

				//console.log(this.dx,this.dy);
				if (this.dx != 0 && this.dy != 0) {
					Rect_onchange(node);
				}
				saveinit(this);
			}
		});

		PointC.dragtable({
			down: function(_node, dx, dy, x, y) {
				saveinit(this);
			},
			move: function(_node, dx, dy, x, y) {
				var obj = getABCD(PointA, PointB, PointC, PointD);
				var A = obj.A;
				var B = obj.B;
				var C = obj.C;
				var D = obj.D;

				PointB.attr({
					x: C.x
				});
				PointD.attr({
					y: C.y
				});

				var x0 = (C.x < D.x) ? C.x : D.x;
				var y0 = (C.y < B.y) ? C.y : B.y;

				var w = Math.abs(C.x - A.x);
				var h = Math.abs(C.y - A.y);

				node.transform("");
				node.attr({
					x: x0 + 4,
					y: y0 + 4,
					width: w,
					height: h
				});
				moveText(node, x0 + 4, y0 + 4);
				this.dx = dx;
				this.dy = dy;
			},
			up: function(_node, dx, dy, x, y) {
				SimpleABCD();
				//console.log(this.dx,this.dy);
				if (this.dx != 0 && this.dy != 0) {
					Rect_onchange(node);
				}
				saveinit(this);
			}
		});

		PointD.dragtable({
			down: function(_node, dx, dy, x, y) {
				saveinit(this);
			},
			move: function(_node, dx, dy, x, y) {
				var obj = getABCD(PointA, PointB, PointC, PointD);
				var A = obj.A;
				var B = obj.B;
				var C = obj.C;
				var D = obj.D;

				PointA.attr({
					x: D.x
				});
				PointC.attr({
					y: D.y
				});

				var x0 = (C.x < D.x) ? C.x : D.x;
				var y0 = (A.y < D.y) ? A.y : D.y;

				var w = Math.abs(D.x - B.x);
				var h = Math.abs(D.y - B.y);

				node.transform("");
				node.attr({
					x: x0 + 4,
					y: y0 + 4,
					width: w,
					height: h
				});
				moveText(node, x0 + 4, y0 + 4);
				this.dx = dx;
				this.dy = dy;
				//console.log(this.dx,this.dy);
			},
			up: function(_node, dx, dy, x, y) {
				SimpleABCD();
				//console.log(this.dx,this.dy);
				if (this.dx != 0 && this.dy != 0) {
					Rect_onchange(node);
				}
				saveinit(this);
			}
		});
	}

	/**
	 * [drawTwoline 绘制双线]
	 * @author huzc
	 * @date   2015-03-04
	 * @return {[对象]}   [对象]
	 */
	function drawTwoline() {
		var obj = {};
		var A, B;
		var Arrow1 = null;
		var drawNode1 = null;

		var Arrow2 = null;
		var drawNode2 = null;

		obj.down = function(node, x1, y1, x2, y2) {
			DE.status = "drawdoubleline";
			this.dx = 0;
			this.dy = 0;
			var x3 = x1 - 20;
			var y3 = y1 - 20;

			var x4 = x2 - 20;
			var y4 = y2 - 20;

			var myobj1 = draw_Arrowline(x1, y1, x2, y2, 1);
			drawNode1 = myobj1.Main;
			Arrow1 = myobj1.Arrow1;
			drawNode1.data("twoline", "0");
			drawNode1.next.data("twoline", "1");
			drawNode1.next.next.data("twoline", "2");
			drawNode1.data("domid", "id_" + Math.random());

			//drawNode1.next.next.hide();
			var myobj2 = draw_Arrowline(x3, y3, x4, y4, 1);
			drawNode2 = myobj2.Main;
			Arrow2 = myobj2.Arrow2;
			drawNode2.data("twoline", "3");
			drawNode2.next.data("twoline", "4");
			drawNode2.next.next.data("twoline", "5");
			//drawNode2.next.hide();
		}

		obj.move = function(node, x1, y1, x2, y2) {
			this.dx = x2 - x1;
			this.dy = y2 - y1;
			var A = getPoint(x1, y1, x2, y2, 20, 1);
			var a = A[0];
			var b = A[1];
			var B = getPoint(x1, y1, x2, y2, 50, 1);
			var c = B[0];
			var d = B[1];

			var C = getPoint(x1, y1, x2, y2, 20, -1);
			var a1 = C[0];
			var b1 = C[1];
			var D = getPoint(x1, y1, x2, y2, 50, -1);
			var c1 = D[0];
			var d1 = D[1];


			var drawNode1_path = "M" + x1 + "," + y1 + "L" + x2 + "," + y2;
			drawNode1.attr("path", drawNode1_path);

			//var Arrow1_path="M"+a+","+b+"L"+c+","+d;
			var Arrow1_path = getArrow_path(a, b, c, d, 1);
			drawNode1.next.attr("path", Arrow1_path);

			//var Arrow2_path="M"+(a1)+","+(b1)+"L"+(c1)+","+(d1);
			var Arrow2_path = getArrow_path(a1, b1, c1, d1, -1);
			drawNode1.next.next.attr("path", Arrow2_path);

			//########################################################################
			//########################################################################
			//########################################################################

			var A = getPoint(x1 - 60, y1, x2 - 60, y2, 20, 1);
			var a = A[0];
			var b = A[1];
			var B = getPoint(x1 - 60, y1, x2 - 60, y2, 50, 1);
			var c = B[0];
			var d = B[1];

			var C = getPoint(x1 - 60, y1, x2 - 60, y2, 20, -1);
			var a1 = C[0];
			var b1 = C[1];
			var D = getPoint(x1 - 60, y1, x2 - 60, y2, 50, -1);
			var c1 = D[0];
			var d1 = D[1];

			var drawNode1_path = "M" + (x1 - 60) + "," + y1 + "L" + (x2 - 60) + "," + y2;
			drawNode2.attr("path", drawNode1_path);

			//var Arrow1_path="M"+a+","+b+"L"+c+","+d;
			var Arrow1_path = getArrow_path(a, b, c, d, 1);
			drawNode2.next.attr("path", Arrow1_path);

			//var Arrow2_path="M"+(a1)+","+(b1)+"L"+(c1)+","+(d1);
			var Arrow2_path = getArrow_path(a1, b1, c1, d1, -1);
			drawNode2.next.next.attr("path", Arrow2_path);
		}

		obj.up = function(node, x1, y1, x2, y2) {
			DE.status = "default";
			var dis = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
			//if(this.dx==0&&this.dy==0)
			if (dis <= 5) {
				var end = drawNode1.next.next.next;
				if (end && end.type == "text") {
					end.remove();
				}
				drawNode1.next.next.remove();
				drawNode1.next.remove();
				drawNode1.remove();
				var end = drawNode2.next.next.next;
				if (end && end.type == "text") {
					end.remove();
				}
				drawNode2.next.next.remove();
				drawNode2.next.remove();
				drawNode2.remove();
				return;
			}
			document.onmousedown = null;
			document.onmousemove = null;
			document.onmouseup = null;
			//#####################################################
			Doubleline_onchange(drawNode1, drawNode2);
		}
		return obj;
	}

	function RemoveList(node, n) {
		for (var i = 0; i <= n; i++) {
			var temp = node;
			node = node.next;
			temp.remove();
		}
	}

	/**
	 * [Doubleline_onchange 绑定双线change事件]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[对象]}   drawNode1 [主元素1]
	 * @param  {[对象]}   drawNode2 [主元素2]
	 */
	function Doubleline_onchange(drawNode1, drawNode2) {
		var str0 = drawNode1.attr("path");
		var path0 = Raphael.parsePathString(str0);
		var x0 = path0[0][1];
		var y0 = path0[0][2];

		var x1 = path0[1][1];
		var y1 = path0[1][2];

		var str1 = drawNode1.next.attr("path");
		var path1 = Raphael.parsePathString(str1);
		var x2 = path1[0][1];
		var y2 = path1[0][2];

		var x3 = path1[1][1];
		var y3 = path1[1][2];

		var str2 = drawNode1.next.next.attr("path");
		var path2 = Raphael.parsePathString(str2);
		var x4 = path2[0][1];
		var y4 = path2[0][2];

		var x5 = path2[1][1];
		var y5 = path2[1][2];

		//#####################################################

		var str3 = drawNode2.attr("path");
		var path3 = Raphael.parsePathString(str3);
		var x6 = path3[0][1];
		var y6 = path3[0][2];

		var x7 = path3[1][1];
		var y7 = path3[1][2];

		var str4 = drawNode2.next.attr("path");
		var path4 = Raphael.parsePathString(str4);
		var x8 = path4[0][1];
		var y8 = path4[0][2];

		var x9 = path4[1][1];
		var y9 = path4[1][2];

		var str5 = drawNode2.next.next.attr("path");
		var path5 = Raphael.parsePathString(str5);
		var x10 = path5[0][1];
		var y10 = path5[0][2];

		var x11 = path5[1][1];
		var y11 = path5[1][2];
		//#####################################################

		var points = {
			line0: [
				[x0, y0],
				[x1, y1],
				[x2, y2],
				[x3, y3],
				[x4, y4],
				[x5, y5]
			],
			line1: [
				[x6, y6],
				[x7, y7],
				[x8, y8],
				[x9, y9],
				[x10, y10],
				[x11, y11]
			]
		};

		var jsondata = {
			domid: drawNode1.data("domid"),
			type: "Doubleline",
			color: drawNode1.attr("stroke"),
			strokewidth: drawNode1.attr("stroke-width"),
			text: drawNode1.data("text"),
			points: points,
			node: drawNode1,
			line0: 2,
			line1: 2
		}

		if (drawNode1.next.isShow == true && drawNode1.next.next.isShow == false) {
			jsondata.points.line0 = [
				[x0, y0],
				[x1, y1],
				[x2, y2],
				[x3, y3]
			];
			jsondata.line0 = 1;
		}
		if (drawNode1.next.isShow == false && drawNode1.next.next.isShow == true) {
			jsondata.points.line0 = [
				[x0, y0],
				[x1, y1],
				[x4, y4],
				[x5, y5]
			];
			jsondata.line0 = 1;
		}

		if (drawNode2.next.isShow == true && drawNode2.next.next.isShow == false) {
			jsondata.points.line1 = [
				[x6, y6],
				[x7, y7],
				[x8, y8],
				[x9, y9]
			];
			jsondata.line1 = 1;
		}
		if (drawNode2.next.isShow == false && drawNode2.next.next.isShow == true) {
			jsondata.points.line1 = [
				[x6, y6],
				[x7, y7],
				[x10, y10],
				[x11, y11]
			];
			jsondata.line1 = 1;
		}
		DrawEditor.onchange(jsondata);
	}

	/**
	 * [Rect_onchange 绑定矩形的change事件]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[对象]}   drawNode [矩形主元素]
	 */
	function Rect_onchange(drawNode) {
		var text = "";
		var matrix = drawNode.matrix;
		var x = drawNode.attr("x") - 0;
		var y = drawNode.attr("y") - 0;
		var w = drawNode.attr("width") - 0;
		var h = drawNode.attr("height") - 0;
		var obj = PointTransform(x, y, matrix);
		var box = {
			x: obj.x,
			y: obj.y,
			width: w,
			height: h
		};

		var points = [
			[obj.x, obj.y],
			[obj.x + w, obj.y],
			[obj.x + w, obj.y + h],
			[obj.x, obj.y + h]
		];

		if (drawNode && drawNode.next && drawNode.next.type == "text") {
			text = drawNode.next.attr("text");
		}
		var jsondata = {
			domid: drawNode.data("domid"),
			type: "rect",
			color: drawNode.attr("stroke"),
			strokewidth: drawNode.attr("stroke-width"),
			text: drawNode.data("text"),
			points: points,
			box: box,
			node: drawNode,
			text: text
		}
		DrawEditor.onchange(jsondata);
	}

	function getCornerPoint(x1, y1, x2, y2, d) {
		var k = (y2 - y1) / (x2 - x1);
		var t = d / Math.sqrt(1 + 1 / (k * k));
		var x = x1 + t;
		var y = y1 + (-1 / k) * t;
		return {
			x: x,
			y: y
		}
	}

	var DrawEditor = {};
	var DE = DrawEditor;

	DE.strokecolor = "#b90000";
	DE.strokewidth = 5;
	DE.selectcolor = "red";
	DE.fontcolor = "red";
	DE.fontsize = 12;
	DE.fontfamily = "宋体";
	DE.rect_title = "";
	DE.selectNode = null;
	DE.currentid = 0;
	DE.status = "default";

	DE.helptext = {
		"line": ["按下鼠标左键，拖动鼠标绘制,松开鼠标结束绘制，按下右键取消绘制", "", "拖动把手改变形状"],
		"poly": ["点击鼠标左键开始绘制，双击结束绘制，至少需要三个点，按下右键取消绘制", "点击第一个点结束绘制，生成封闭多边形", "拖动把手改变形状"],
		"rect": ["按下鼠标左键，拖动鼠标绘制,松开鼠标结束绘制，按下右键取消绘制", "松开鼠标结束绘制", "拖动把手改变形状"]
	};

	/**
	 * [init 类初始化接口]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[字符串]}   id [画布id]
	 * @param  {[数字]}   w  [画布宽度]
	 * @param  {[数字]}   h  [画布高度]
	 */
	DrawEditor.init = function(id, w, h) {
		this.id = id;
		this.width = w;
		this.height = h;
		paper = Raphael(id, w, h);
		this.paper = paper;
		var bgcanvas = paper.rect(0, 0, w, h);
		bgcanvas.attr("fill", "white");
		bgcanvas.attr("fill-opacity", "0");
		bgcanvas.data("bg", "true");
		bgcanvas.click(function(evt) {
			paper.clearHandle();
		});

		if (typeof($) == "function") {
			var filter = "filter:alpha(Opacity=50);-moz-opacity:0.5;opacity: 0.5;z-index:1;background-color:#ffffff;";
			var css = filter + "-webkit-user-select:none;-moz-user-select:none;display:none;padding:3px;color:red;position:absolute;left:0px;top:0px;width:0px;height:0px;font-size:12px;border:solid 1px #cccccc;";
			var html = "<div onselectStart='return false' unselectable='on'  id='DrawEditor_ShowHelp' style='" + css + "'></div>";
			$(html).insertAfter($("#" + id));
		}
		$ID(id).ondragstart = function() {
				return false;
		}
	}

	/**
	 * [showhelp 编辑显示帮助信息]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[字符串]}   stype [类型]
	 */
	DrawEditor.showhelp = function(stype) {
		var x0 = getX($ID(DrawEditor.id)) - 0;
		var y0 = getY($ID(DrawEditor.id)) - 0;
		
		var pos = $("#" + DrawEditor.id).css("position");
		DrawEditor.showhelping = true;
		var node = $("#DrawEditor_ShowHelp");
		$("#" + this.id).on("mousemove", function(evt) {
			//console.log(evt.clientX,evt.clientY);
			if (DrawEditor.showhelping == false) {
				return
			}
			var html = DE.helptext[stype][0];
			node.html(html);
			node.css("display", "block");
			node.css("width", "100px");
			node.css("height", "auto");
			var x = (pos == "static") ? (evt.clientX + 5) : (evt.clientX-x0/2-85);
			var y = (pos == "static") ? (evt.clientY) : (evt.clientY - y0)
			node.css("left", x +3+ "px"); //zhangyu 2014-10-22，临时处理，待老胡处理
			node.css("top", y - 85 + "px"); //zhangyu 2014-10-22，临时处理，待老胡处理
		});

		$(document).on("mouseup", function(evt) {
			if (DrawEditor.showhelping == true) {
				node.css("display", "none");
				DrawEditor.showhelping = false;
			}

			if (node.is(":visible")) {
				node.css("display", "none");
			}
		});
	}

	/**
	 * [setPenType 设置画笔类型]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[字符串]}   str [画笔类型]
	 */
	DrawEditor.setPenType = function(str) {
		setPenType(str);
	}

	/**
	 * [clearPaper 清空画布]
	 * @author huzc
	 * @date   2015-03-04
	 */
	DrawEditor.clearPaper = function() {
		paper && paper.clear();
	}

	/**
	 * [add_rect 传入参数绘制矩形到画布上]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[对象]}   obj [矩形的参数]
	 */
	DrawEditor.add_rect = function(obj) {
		var w = obj.width;
		var h = obj.height;
		var text = obj.text;
		var x = (this.width - w) / 2;
		var y = (this.height - h) / 2;
		if (obj.x) {
			x = obj.x
		}
		if (obj.y) {
			y = obj.y
		}
		if (obj.points) {
			x = obj.points[0][0];
			y = obj.points[0][1];
			w = obj.points[1][0] - x;
			h = obj.points[2][1] - y;
			if (obj.points[1][1] != obj.points[1][1]) {
				alert("error");
				return false
			}
			if (obj.points[1][0] != obj.points[2][0]) {
				alert("error");
				return false
			}
			if (obj.points[2][1] != obj.points[3][1]) {
				alert("error");
				return false
			}
			if (obj.points[3][0] != obj.points[0][0]) {
				alert("error");
				return false
			}
		}
		var rect = paper.rect(x, y, w, h);
		rect.data("domid", obj.domid);
		rect.data("vtype", "rect");
		rect.attr("stroke-width", DrawEditor.strokewidth);
		rect.attr("stroke", DrawEditor.strokecolor);
		rect.attr("cursor", "Move");
		rect.data("text", text);
		if (text == "最大物体" || text == "最小物体" || text == "车牌大小") {
			rect.attr("title", "左键单击选中，拖拽标定框把手改变大小");
		}

		var textnode = paper.text(x + 18, y - 20, text);
		textnode.attr({
			"font-size": DrawEditor.fontsize,
			"fill": DrawEditor.fontcolor,
			"font-family": DrawEditor.fontfamily
		});

		obj.node = rect;

		function setTextPos(rect) {
			var P = PointTransform(rect.attr("x"), rect.attr("y"), rect.matrix);
			moveText(rect, P.x, P.y);
		}
		rect.dragtable({
			down: function(_node, dx, dy, x, y) {
				this.dx = 0;
				this.dy = 0;
			},
			move: function(_node, dx, dy, x, y) {
				setTextPos(rect);
				this.dx = dx;
				this.dy = dy;
				//if(P.x<0){rect.attr("x",0);}
				//if(P.y<0){rect.attr("y",0);}
				//if(P.x<0){rect.attr("x",0);}
				//if(P.x<0){rect.attr("x",0);}
			},
			up: function(_node, dx, dy, x, y) {
				SimpleTransform(rect);
				var P = PointTransform(rect.attr("x"), rect.attr("y"), rect.matrix);
				if(DrawEditor.imagejudge !== undefined && DrawEditor.imagejudge){
						if (P.x < 0) {
								rect.attr("x", 0);
						}
						if (P.y < 0) {
								rect.attr("y", 0);
						}
				}else{
						if (P.x < 50) {
								rect.attr("x", 0);//将矩形框线贴边显示 update by Leon.z
						}
						if (P.y < 50) {
								rect.attr("y", 50);
						}
				}
				if (P.x + rect.attr("width") > DE.width) {
					rect.attr("x", DE.width - rect.attr("width"));
				}
				if (P.y + rect.attr("height") > DE.height) {
					rect.attr("y", DE.height - rect.attr("height"));
				}
				setTextPos(rect);

				DE.clearHandle();

				showRectRange(rect);

				if (this.dx != 0 && this.dy != 0) {
					Rect_onchange(rect);
				}
			}
		});

		rect.mousedown(function() {
			paper.clearHandle();
		});

		rect.mouseup(function() {
			DrawEditor._highlight(rect, "red");

			showRectRange(rect);

			var jsondata = {};
			//var id=rect.id;
			var id = rect.data("domid");
			var text = rect.data("text");
			DrawEditor.currentid = id;
			DrawEditor.onselect(id, text);
		});
		return rect;
	}

	/**
	 * [add_poly 传入参数绘制多边形]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[对象]}   obj [多边形的参数]
	 */
	DrawEditor.add_poly = function(obj) {
		var text = obj.text;
		var points = obj.points;

		var L = points.length;
		var str = "";
		for (var i = 0; i <= L - 1; i++) {
			var pxy = points[i][0] + "," + points[i][1];
			if (i == 0) {
				str = "M" + pxy;
			} else {
				str = str + "L" + pxy;
			}
		}
		str = str + "Z";

		var node = paper.path(str);
		node.data("polyline", "true");
		node.data("text", text);
		node.data("vtype", "polyline");
		node.data("domid", obj.domid);

		node.attr("stroke", DrawEditor.strokecolor);
		node.attr("stroke-width", DrawEditor.strokewidth);
		node.attr("cursor", "Move");

		var x = points[0][0];
		var y = points[0][1];
		var textnode = paper.text(x - 10, y - 20, text);

		textnode.attr({
			"font-size": DrawEditor.fontsize,
			"fill": DrawEditor.fontcolor,
			"font-family": DrawEditor.fontfamily
		});
		node.unmouseup();
		node.mouseup(function() {
			DrawEditor._highlight(node);
			getPolyHandle(this);
			var jsondata = {};
			var id = node.data("domid");
			var text = node.data("text");
			DrawEditor.currentid = id;
			DrawEditor.onselect(id, text);
		});

		node.unmousedown();
		node.mousedown(function() {
			paper.clearHandle();
			//DrawEditor._highlight(node);
		});

		setPolylineDrag(node);
		return node;
	}

	/**
	 * [add_Single_Arrowline 传入参数绘制单线]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[对象]}   obj  [单线参数]
	 * @param  {[布尔]}   flag [是否显示文字标题]
	 */
	DrawEditor.add_Single_Arrowline = function(obj, flag) {
		var text = obj.text;
		var points = obj.points;
		var L = points.length;
		var x1 = points[0][0];
		var y1 = points[0][1];
		var x2 = points[1][0];
		var y2 = points[1][1];

		//var str="M"+x1+","+y1+"L"+x2+","+y2;
		//var node=paper.path(str);
		var xobj = draw_Arrowline(x1, y1, x2, y2);
		var Main = xobj.Main;
		var Arrow1 = xobj.Arrow1;
		var Arrow2 = xobj.Arrow2;
		if (!flag) {
			Main.data("domid", obj.domid);
			var textnode = paper.text(x1 - 10, y1 - 20, text);
			textnode.attr({
				"font-size": DrawEditor.fontsize,
				"fill": DrawEditor.fontcolor,
				"font-family": DrawEditor.fontfamily
			});
			Main.data("text", text);
		}

		if (obj.type == "left") {
			Arrow1.show();
			Arrow1.isShow = true;
			Arrow2.hide();
			Arrow2.isShow = false;
		} else if (obj.type == "right") {
			Arrow2.show();
			Arrow2.isShow = true;
			Arrow1.hide();
			Arrow1.isShow = false;
		} else if (obj.type == "leftright") {
			Arrow1.show();
			Arrow1.isShow = true;
			Arrow2.show();
			Arrow2.isShow = true;
		}
		return xobj;
	}

	/**
	 * [add_Double_Arrowline 传入参数绘制双线]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[对象]}   obj [绘制双线的参数]
	 */
	DrawEditor.add_Double_Arrowline = function(obj) {
		var line0 = obj.line0;
		var line1 = obj.line1;

		var xobj0 = DrawEditor.add_Single_Arrowline(line0, true);
		var xobj1 = DrawEditor.add_Single_Arrowline(line1, true);

		var drawNode1 = xobj0.Main;
		drawNode1.data("domid", obj.domid);
		drawNode1.data("twoline", "0");
		drawNode1.next.data("twoline", "1");
		drawNode1.next.next.data("twoline", "2");

		var drawNode2 = xobj1.Main;
		drawNode2.data("twoline", "3");
		drawNode2.next.data("twoline", "4");
		drawNode2.next.next.data("twoline", "5");

		var x = line0.points[0][0];
		var y = line0.points[0][1];
		var textnode = paper.text(x + 18, y - 20, obj.text);
		textnode.attr({
			"fill": DrawEditor.fontcolor,
			"font-size": DrawEditor.fontsize,
			"font-family": DrawEditor.fontfamily
		});
		drawNode1.data("text", obj.text);
		return {
			line0: xobj0,
			line1: xobj1
		}
	}

	/**
	 * [setTitle 设置元素的显示的文字信息]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[字符串]}   id   [元素id]
	 * @param  {[字符串]}   text [显示的文字信息]
	 */
	DrawEditor.setTitle = function(id, text) {
		var node = null;
		paper.forEach(function(el) {
			if (el.data("domid") == id) {
				node = el;
				return;
			}
		});
		if (!node) {
			if (typeof(notify) == "object") {
				notify.info("未找到设置标记的元素，请选中一个元素");
				return
			}
			alert("未找到该domid=" + id);
			return;
		}
		//var node=paper.getById(id);
		//node.data("text",text);

		//console.log("setTitle");
		//console.log(node);

		var vtype = node.data("vtype");
		var twoline = node.data("twoline");
		var polyline = node.data("polyline");
		var groupindex = node.data("groupindex");

		//console.log(twoline,vtype,polyline,groupindex)
		function getXY(node) {
			if (node.type == "path") {
				var str = node.attr("path");
				var path = Raphael.parsePathString(str);
				var Mat = PointTransform(path[0][1], path[0][2], node.matrix);
				return [Mat.x, Mat.y];
			}
			if (node.type == "rect") {
				var x = node.attr("x");
				var y = node.attr("y");
				var Mat = PointTransform(x, y, node.matrix);
				return [Mat.x, Mat.y];
			}
		}

		function getTextNode(node, index) {
			var A = getXY(node);
			var textnode = paper.text(A[0] - 10, A[1] - 20, text);
			textnode.attr({
				"font-size": DrawEditor.fontsize,
				"fill": DE.fontcolor,
				"font-family": DrawEditor.fontfamily
			});
			return textnode;
		}

		function Modify(node) {
				var A = getXY(node);
				var textnode = node.next.next.next;
				textnode.attr({
					x: A[0] - 10,
					y: A[1] - 20,
					text: text
				});
			}
			//console.log("twoline="+twoline);

		if (twoline) {
			var index = twoline - 0;
			if (index == 0) {
				if (node.data("text")) {
					var A = getXY(node);
					var textnode = node.next.next.next.next.next.next;
					textnode.attr({
						x: A[0] - 10,
						y: A[1] - 20,
						text: text
					});
					return;
				}
				node.data("text", text);
				var textnode = getTextNode(node);
				var end = node.next.next.next.next.next;
				textnode.insertAfter(end);
				//console.log("twoline3")
				return;
			} else if (index == 3) {
				if (node.data("text")) {
					Modify(node);
					return
				}
				var textnode = getTextNode(node);
				node.data("text", text);
				node.prev.prev.prev.data("text", text);
				var end = node.next.next;
				textnode.insertAfter(end);
				return;
			}
		}

		if (polyline) {
			//alert(1);
			if (node.data("text")) {
				var A = getXY(node);
				node.next.attr({
					x: A[0] + 18,
					y: A[1] - 20,
					text: text
				});
				return;
			}
			node.data("text", text);
			var textnode = getTextNode(node);
			textnode.insertAfter(node);
			return;
		}

		if (vtype && vtype == "rect") {
			if (node.data("text")) {
				//console.log(1);
				var str = node.data("text");
				//console.log("str="+str);
				// console.log(node.data("text"));
				//console.log(node);
				var A = getXY(node);
				var textnode = node.next;
				//console.log(A);
				//console.log(textnode);
				textnode.attr({
					x: A[0] + 18,
					y: A[1] - 20,
					text: text
				});
				return;
			}
			//console.log(2);

			node.data("text", text);
			var textnode = getTextNode(node);
			var end = node;
			textnode.insertAfter(end);
		}

		if (vtype) {
			var index = groupindex - 0;
			if (index != 0) {
				return
			}
			//console.log(index);
			if (node.data("text")) {
				Modify(node);
				return
			}
			node.data("text", text);
			var textnode = getTextNode(node);
			var end = node.next.next;
			textnode.insertAfter(end);
			return;
		}
	}

	/**
	 * [setcolor 设置元素的边框颜色]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[字符串]}   id    [唯一id]
	 * @param  {[字符串]}   color [颜色]
	 */
	DrawEditor.setcolor = function(id, color) {
		var node = null;
		paper.forEach(function(el) {
			if (el.data("domid") == id) {
				node = el;
				return;
			}
		});
		if (!node) {
			alert("未找到该domid=" + domid);
			return
		}
		//var node=paper.getById(id);
		node.attr("stroke", color);
	}

	function setred(node, n, stype, color) {
		for (var i = 0; i <= n; i++) {
			node.attr("stroke", color);
			node = node[stype];
		}
	}

	DrawEditor.selectNode = null;

	/**
	 * [_highlight 设置元素高亮]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[对象]}   node  [元素]
	 * @param  {[字符串]}   color [高亮色]
	 */
	DrawEditor._highlight = function(node, color) {
		if (!color) {
			color = "red";
		}
		var vtype = node.data("vtype");
		var twoline = node.data("twoline");
		var polyline = node.data("polyline");
		var groupindex = node.data("groupindex");
		/*
		paper.forEach(function(el)
		{
				if(el.type!="text")
				{
					 el.attr("stroke","black");
				}
		}); */

		if (twoline) {
			var index = twoline - 0;
			//console.log("twoline="+index);
			if (index == 3) {
				/*setred(node,0,"next",color);
				setred(node,1,"next",color);
				setred(node,2,"next",color);

				setred(node,0,"prev",color);
				setred(node,1,"prev",color);
				setred(node,2,"prev",color);*/
				DrawEditor.selectNode = node.prev.prev.prev;
				return;
			} else if (index == 0) {

				/*setred(node,0,"next",color);
				setred(node,1,"next",color);
				setred(node,2,"next",color);
				setred(node,3,"next",color);
				setred(node,4,"next",color);
				setred(node,5,"next",color);*/
				DrawEditor.selectNode = node;
				return;
			}
		}

		if (polyline) {
			//node.attr("stroke",color);
			DrawEditor.selectNode = node;
			return;
		}

		if (vtype && vtype == "rect") {
			//node.attr("stroke",color);
			DrawEditor.selectNode = node;
			return
		}

		if (vtype) {
			/*setred(node,0,"next",color);
			setred(node,1,"next",color);
			setred(node,2,"next",color);*/
			DrawEditor.selectNode = node;
			return;
		}
	}

	/**
	 * [clearHandle 清除所有元素的编辑把手]
	 * @author huzc
	 * @date   2015-03-04
	 */
	DrawEditor.clearHandle = function() {
		paper.clearHandle();
	}

	/**
	 * [deletePolyNode 删除正在绘制的多边形]
	 * @author huzc
	 * @date   2015-03-04
	 */
	DrawEditor.deletePolyNode = function() {
		if (this.drawingPolyNode) {
			var node = this.drawingPolyNode;
			if (node.next && node.next.type == "text") {
				node.next.remove();
			}
			var A = [];
			for (var i = 1; i <= 100; i++) {
				if (!node) {
					break
				}
				node = node.next;
				if (node && node.type == "rect" && node.data("handle")) {
					A.push(node);
				}
			}
			var L = A.length;
			for (var i = 0; i <= L - 1; i++) {
				A[i].remove();
			}
			this.drawingPolyNode.remove();
			this.drawingPolyNode = null;
			return {
				domid: null,
				type: "polyline"
			};
		}
	}

	/**
	 * [deletedom 删除指定的元素对象]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[数字]}   domid [元素id]
	 */
	DrawEditor.deletedom = function(domid) {
		if (this.drawingPolyNode) {
			return DrawEditor.deletePolyNode();
		}

		if (DE.status == "drawpoly") {
			return
		} else if (DE.status == "drawrect") {
			return
		} else if (DE.status == "drawsingleline") {
			return
		} else if (DE.status == "drawdoubleline") {
			return
		} else if (DE.status == "drawing") {
			return
		}


		if (domid) {
			var node = null;
			paper.forEach(function(el) {
				if (el.data("domid") == domid) {
					node = el;
					return;
				}
			});
			if (!node) {
				return {
					domid: "",
					type: ""
				};
			}
		} else {
			var node = DrawEditor.selectNode;
			if (!node) {
				return {
					domid: "",
					type: ""
				};
			}
			var domid = node.data("domid");
		}
		if (!node) {
			return {
				domid: "",
				type: ""
			}
		}

		paper.clearHandle();

		var vtype = node.data("vtype");
		var twoline = node.data("twoline");
		var polyline = node.data("polyline");
		var groupindex = node.data("groupindex");
		//console.log(vtype);
		if (twoline) {
			var index = twoline - 0;
			if (index == 3) {
				node.prev.prev.prev.remove();
				node.prev.prev.remove();
				node.prev.remove();
				if (node.next.next.next && node.next.next.next.type == "text") {
					node.next.next.next.remove();
				}
				node.next.next.remove();
				node.next.remove();
				node.remove();
			}
			if (index == 0) {
				if (getBrother(node, "next", 6) && getBrother(node, "next", 6).type == "text") {
					getBrother(node, "next", 6).remove();
				}
				getBrother(node, "next", 5).remove();
				getBrother(node, "next", 4).remove();
				getBrother(node, "next", 3).remove();
				getBrother(node, "next", 2).remove();
				getBrother(node, "next", 1).remove();
				node.remove();
			}
			return {
				domid: domid,
				type: "DoubleArrowline"
			};
		}
		if (polyline) {
			if (node.next && node.next.type == "text") {
				node.next.remove();
			}
			node.remove();
			return {
				domid: domid,
				type: "polyline"
			};
		}
		if (vtype) {
			if (vtype == "rect") {
				if (node.next && node.next.type == "text") {
					node.next.remove();
				}
				node.remove();
				return {
					domid: domid,
					type: "rect"
				};
			}
			var index = groupindex - 0;
			if (index == 0) {
				try {
					if (node.next.next.next && node.next.next.next.type == "text") {
						node.next.next.next.remove();
					}
					node.next.next.remove();
					node.next.remove();
					node.remove();
				} catch (e) {
					alert("error");
				}
			}
			return {
				domid: domid,
				type: "SingleArrowline"
			};
		}
	}

	/**
	 * [ShowRange 显示元素的编辑焦点]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[数字]}   domid [元素id，注意是数字]
	 */
	DrawEditor.ShowRange = function(domid) {
		paper.clearHandle();
		var node = null;
		paper.forEach(function(el) {
			if (el.data("domid") == domid) {
				node = el;
				return;
			}
		});
		if (!node) {
			return false
		}
		var vtype = node.data("vtype");
		var twoline = node.data("twoline");
		var polyline = node.data("polyline");
		var groupindex = node.data("groupindex");
		if (twoline) {
			getArrowlineHandle(node);
			return true;
		}
		if (polyline) {
			getPolyHandle(node);
			return true;
		}
		if (vtype && vtype == "rect") {
			showRectRange(node);
			return true;
		}
		if (vtype) {
			getArrowlineHandle(node);
			return true;
		}
		return false;
	}
	/**
	 * [highlight 指定元素高亮]
	 * @author huzc
	 * @date   2015-03-04
	 * @param  {[数字]}   id [指定元素id]
	 */
	DrawEditor.highlight = function(id) {
		return;
		var node = null;
		paper.forEach(function(el) {
			if (el.data("domid") == id) {
				node = el;
				return;
			}
		});
		if (!node) {
			alert("未找到该domid=" + id);
			return
		}
		DrawEditor._highlight(node, "red");
	}

	//预留onmouseup事件，该事件会被复写
	DrawEditor.onmouseup = function(a, b, c) {}

	//预留onchange事件，该事件会被复写
	DrawEditor.onchange = function(jsondata) {
		//console.log(jsondata);
	}

	//预留onselect事件，该事件会被复写
	DrawEditor.onselect = function(id, text) {
	}
	window.DrawEditor = DrawEditor;
	return DrawEditor;
});
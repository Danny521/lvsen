/**
 * Created by Zhangyu on 2014/12/3.
 * 时间段设置控件
 */
define(["jquery"], function(jQuery) {
	(function ($) {
		$.fn.TimeSelect = function (config) {
			/**********私有变量和函数**********/
			//默认参数
			var options = {
				parentBorder: {},
				controlsBorder: {}
			};
			//模板
			var template = "<input type='text' class='text-select text1' value='00' />" + "<span class='dot'>:</span>" + "<input type='text' class='text-select text2' value='00' />" + "<i class='ctrl ctrl1'></i>" + "<i class='ctrl ctrl2'></i>", newTypeIn = "";
			//待处理的函数集合
			var methods = {
				//绑定事件
				bindEvents: function (This) {
					var inFocus = true, //选中的flag
						text1 = This.find("input.text1"), text2 = This.find("input.text2"), ctrl1 = This.find(".ctrl1"), ctrl2 = This.find(".ctrl2"), timesetter = null; //定时器
					//时间增加
					ctrl1.on("click", function () {
						if ($(this).hasClass('disabled')) {
							return;
						}

						methods.changeUpM(text1, text2, inFocus);
					}).on("mousedown", function () {
						if ($(this).hasClass('disabled')) {
							return;
						}

						$(this).addClass("ctrl1-active");
						//鼠标按下时，定时更新输入框的值
						timesetter = setInterval(function () {
							methods.changeUpM(text1, text2, inFocus);
						}, 150);
					}).on("mouseup", function () {
						if ($(this).hasClass('disabled')) {
							return;
						}
						
						$(this).removeClass("ctrl1-active");
						clearInterval(timesetter);
					});

					//时间减少
					ctrl2.on("click", function () {
						if ($(this).hasClass('disabled')) {
							return;
						}

						methods.changeDownM(text1, text2, inFocus);
					}).on("mousedown", function () {
						if ($(this).hasClass('disabled')) {
							return;
						}

						$(this).addClass("ctrl2-active");
						timesetter = setInterval(function () {
							methods.changeDownM(text1, text2, inFocus);
						}, 150);
					}).on("mouseup", function () {
						if ($(this).hasClass('disabled')) {
							return;
						}

						$(this).removeClass("ctrl2-active");
						clearInterval(timesetter);
					});

					text1.on("click", function () {
						//鼠标点击事件,选中文本框
						this.select();
						inFocus = true;
					}).on("keydown", function () {
						methods.changeOnKeyDown($(this), inFocus, event);
					}).on("keyup", function () {
						methods.changeOnKeyUp($(this), inFocus, event);
					}).on("blur", function () {
						$(this).val(methods.timeForm($(this).val()));
					});
					text2.on("click", function () {
						//鼠标点击事件,选中文本框
						this.select();
						inFocus = false;
					}).on("keydown", function () {
						methods.changeOnKeyDown($(this), inFocus, event);
					}).on("keyup", function () {
						methods.changeOnKeyUp($(this), inFocus, event);
					}).on("blur", function () {
						$(this).val(methods.timeForm($(this).val()));
					});
				},
				//点击向上翻按钮时改变输入框的值
				changeUpM: function (text1, text2, inFocus) {
					if (inFocus && text1.val() < 23) {
						text1.val(methods.timeForm(parseInt(text1.val()) + 1));
					} else if (!inFocus && text2.val() < 59) {
						text2.val(methods.timeForm(parseInt(text2.val()) + 1));
					} else if (inFocus && text1.val() === "23") {
						text1.val("00");
					} else if (!inFocus && text2.val() === "59") {
						text2.val("00");
					}
					//时间调整时选中内容
					if (inFocus) {
						text1.select();
					} else {
						text2.select();
					}
				},
				//点击向下翻按钮时改变输入框的值
				changeDownM: function (text1, text2, inFocus) {
					if (inFocus && text1.val() > 0) {
						text1.val(methods.timeForm(parseInt(text1.val()) - 1));
					} else if (!inFocus && text2.val() > 0) {
						text2.val(methods.timeForm(parseInt(text2.val()) - 1));
					} else if (inFocus && text1.val() === "00") {
						text1.val("23");
					} else if (!inFocus && text2.val() === "00") {
						text2.val("59");
					}
					//时间调整时选中内容
					if (inFocus) {
						text1.select();
					} else {
						text2.select();
					}
				},
				//手动输入
				changeOnKeyDown: function (obj, inFocus) {
					var limitValue = inFocus ? "23" : "59", event = window.event || event;
					//长按上下键
					if (event.keyCode === 40) { //DOWN KEY
						if (obj.val() > 0) {
							obj.val(methods.timeForm(parseInt(obj.val()) - 1));
						} else if (obj.val() === "00") {
							obj.val(limitValue);
						}
					} else if (event.keyCode === 38) { //UP KEY
						if (obj.val() < parseInt(limitValue)) {
							obj.val(methods.timeForm(parseInt(obj.val()) + 1));
						} else if (obj.val() === limitValue) {
							obj.val("00");
						}
					} else if ((event.keyCode >= 96 && event.keyCode <= 105) || (event.keyCode >= 48 && event.keyCode <= 57)) {
						newTypeIn = methods.getData(event.keyCode);
					} else {
						//其他键，屏蔽掉：退格键……
						event.returnValue = false;
						return false;
					}
				},
				changeOnKeyUp: function (obj, inFocus) {
					var limitValue = inFocus ? "23" : "59";
					//判断数据是否超界
					if (obj.val().length > 2 || parseInt(obj.val()) > limitValue) {
						obj.val(methods.timeForm(parseInt(newTypeIn)));
					}
				},
				//如果数字小于10，前面要加一个0
				timeForm: function (time) {
					if (parseInt(time) < 10 && time.toString().charAt(0) !== "0") {
						return "0" + time;
					} else if (parseInt(time) === 0) {
						return "00";
					} else {
						return time;
					}
				},
				//控件初始化，重置控件样式
				changeStyle: function (This) {
					//修改外边框颜色
					This.css(options.parentBorder);
					//修改增减按钮的边框颜色
					This.find("i").css(options.controlsBorder);
				},
				//获取输入的值，免得一闪而过，体验不好
				getData: function (data) {
					switch (data) {
						case 96:
						case 48:
							return "0";
						case 97:
						case 49:
							return "1";
						case 98:
						case 50:
							return "2";
						case 99:
						case 51:
							return "3";
						case 100:
						case 52:
							return "4";
						case 101:
						case 53:
							return "5";
						case 102:
						case 54:
							return "6";
						case 103:
						case 55:
							return "7";
						case 104:
						case 56:
							return "8";
						case 105:
						case 57:
							return "9";
						default:
							return "0";
					}
				}
			};
			//根据初始化扩展参数
			$.extend(options, config);

			/**********对结果进行处理（插件的行为）**********/
			this.each(function () {
				//保存对象
				var $this = $(this);
				//添加模板
				$this.append(template);
				//修改样式
				methods.changeStyle($this);
				//事件绑定
				methods.bindEvents($this);
			});
			/**********返回结果对象**********/
			return {
				//获取当前时间
				getTime: function (className) {
					var $textObj = $("." + className);
					var Text1 = $textObj.find(".text1").val(), Text2 = $textObj.find(".text2").val();
					return Text1 + ":" + Text2;
				}
			};
		};
	})(jQuery);
});
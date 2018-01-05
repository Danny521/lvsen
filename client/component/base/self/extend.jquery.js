/**
 * jquery 扩展相关函数
 * @authors yuqiu (yuqiu_xa@netposa.com)
 * @date    2015-01-15 14:46:54
 * @version $Id$
 */

define(['jquery'], function() {

	/**
	 * tab控制扩展
	 * @param node
	 * @constructor
	 */
	var Tab = function(node) {
		this.node = jQuery(node);
	}

	Tab.prototype.activate = function() {
		var node = this.node;
		view = jQuery('.ui.tab[data-tab="{0}"]'.format(node.data('tab')));

		node.addClass('active').siblings().removeClass('active');
		view.addClass('active').siblings().removeClass('active');
	};
	/**
	 * 下拉控制扩展
	 *<div class="ui selection dropdown">
	 *<input type="hidden" name="gender">
	 *<div class="text">Female</div>
	 *<i class="dropdown icon"></i>
	 *<div class="menu">
	 *<div class="item" data-value="1">Male</div>
	 *<div class="item active" data-value="0">Female</div>
	 *</div>
	 *</div>
	 * @param node
	 * @constructor
	 */
	var Dropdown = function(node) {
		this.node = jQuery(node);
	};
	//原型扩展
	Dropdown.prototype = {
		toggle: function () {
			this.node.toggleClass('active');
			jQuery('.ui.dropdown').not(this.node).removeClass('active');
		}

	};
	//私有函数
	Dropdown.clearMenus = function () {
		jQuery('.ui.dropdown').removeClass('active');
	};
	/**
	 * 收集jq的hide和show方法，以便扩展
	 */
	var _oldhide = jQuery.fn.hide,
		_oldshow = jQuery.fn.show;
	/**
	 * 利用上面的函数集合对jquery进行扩展
	 */
	jQuery.fn.extend({

		// 获取光标位置
		getCaret: function() {
			var obj = jQuery(this)[0];
			var caretPos = 0;
			if (document.selection) {
				obj.focus();
				var sel = document.selection.createRange();
				sel.moveStart('character', -obj.value.length);
				caretPos = sel.text.length;
			} else if (obj.selectionStart || obj.selectionStart === 0) {
				caretPos = obj.selectionStart;
			}

			return caretPos;
		},

		// 定位光标到指定位置
		setCaret: function(pos) {
			return jQuery.each(this, function() {
				if (this.setSelectionRange) {
					this.focus();
					this.setSelectionRange(pos, pos);
				} else if (this.createTextRange) {
					var range = this.createTextRange();
					range.collapse(true);
					range.moveEnd('character', pos);
					range.moveStart('character', pos);
					range.select();
				}
			});
		},

		// 在光标位置插入或替换选择文本
		insertAtCaret: function(myValue) {
			var obj = jQuery(this)[0];
			if (document.selection) {
				this.focus();
				var sel = document.selection.createRange();
				sel.text = myValue;
				this.focus();
			} else if (obj.selectionStart || obj.selectionStart === 0) {
				var startPos = obj.selectionStart,
					endPos = obj.selectionEnd,
					scrollTop = obj.scrollTop;
				obj.value = obj.value.substring(0, startPos) + myValue + obj.value.substring(endPos, obj.value.length);
				this.focus();
				obj.selectionStart = startPos + myValue.length;
				obj.selectionEnd = startPos + myValue.length;
				obj.scrollTop = scrollTop;
			} else {
				this.value += myValue;
				this.focus();
			}

			return this;
		},

		selectText: function(start, end) {
			var obj = this[0];
			if (document.selection) {
				if (obj.tagName == 'TEXTAREA') {
					var i = obj.value.indexOf('\r', 0);
					while (i != -1 && i < end) {
						end--;
						if (i < start) {
							start--;
						}
						i = obj.value.indexOf('\r', i + 1);
					}
				}
				var range = obj.createTextRange();
				range.collapse(true);
				range.moveStart('character', start);
				if (end !== undefined) {
					range.moveEnd('character', end - start);
				}
				range.select();
			} else {
				obj.focus();
				obj.selectionStart = start;
				var sel_end = end === undefined ? start : end;
				obj.selectionEnd = Math.min(sel_end, obj.value.length);
			}
			return this;
		},

		// 支持表单的 Ctrl + Enter 快速提交
		ctrlEnter: function() {
			jQuery(this).keydown(function(e) {
				if (!e.shiftKey && !e.altKey && e.ctrlKey && e.keyCode == 13) {
					var obj = jQuery(e.target),
						form = obj.is('form') ? obj : jQuery(obj[0].form);

					form.trigger('submit');
				}
			});
			return this;
		},

		// 判断两个jQuery元素相等
		equals: function(compareTo) {
			if (!compareTo || this.length != compareTo.length) {
				return false;
			}
			for (var i = 0, l = this.length; i < l; i++) {
				if (this[i] !== compareTo[i]) {
					return false;
				}
			}
			return true;
		},

		// 输入控件的长度限制
		// 注意：计算方式是小于255的字符记长0.5 大于记长为 1
		limitLength: function(limit, byte, fn) {
			return this.each(function() {
				var obj = jQuery(this);
				if (obj.is('input:text') || obj.is('textarea')) {
					var that = this;
					var events = ['keyup', 'focus', 'blur'];
					jQuery.each(events, function(i, type) {
						jQuery(that).bind(type, function() {
							var val = '',
								size = 0,
								obj = jQuery(this);

							if (byte) {
								val = Toolkit.substrByByte(obj.val(), limit * 2);
								// 将限制放大两倍 因为期望的是按字节截取
								size = Math.ceil(Toolkit.countByte(val) / 2);
							} else {
								val = obj.val().substring(0, limit);
								size = val.length;
							}
							obj.val(val);
							obj.scrollTop(obj[0].scrollHeight); // 滚动到最底部
							if (fn) {
								fn.call(obj, val, size, limit);
							}
						});
					});
					obj.triggerHandler('blur');
				}
			});
		},

		//给jQ扩展hide和show事件
		hide: function() {
			jQuery(this).trigger('hide');
			return _oldhide.apply(this, arguments);
		},
		//给jQ扩展hide和show事件
		show: function() {
			jQuery(this).trigger('show');
			return _oldshow.apply(this, arguments);
		},

		/**
		 * dom文档中的tab页控制
		 * @param option - 配置项
		 * @returns {*}
		 */
		tab: function(option) {
			return this.each(function() {
				var node = jQuery(this),
					data = node.data('ui.tab') || new Tab(this);

				if (typeof data[option] === 'function') {
					data[option]();
				}
				node.data('ui.tab', data);
			});
		},
		/**
		 * dom文档中下拉项的控制
		 * @param option - 配置项
		 * @returns {*}
		 */
		dropdown : function(option) {
			return this.each(function() {
				var node = jQuery(this),
					data = node.data('ui.dropdown') || new Dropdown(this);

				if (typeof data[option] === 'function') {
					data[option]();
				}
				node.data('ui.dropdown', data);
			});
		}
	});

	/**
	 * event delegate
	 * 对系统中所有的.ui.tabular修饰的tab项进行事件约定
	 */
	jQuery(document).on('click.ui.tab.semantic', '.ui.tabular [data-tab]', function(e) {
		jQuery(this).tab('activate');
		e.preventDefault();
	});

	/**
	 * event delegate
	 * 对系统中所有的.ui.tabular修饰的tab项进行事件约定
	 */
	jQuery(document).on('click.ui.dropdown.semantic', function(e) {
		Dropdown.clearMenus();
	});

	/**
	 * event delegate
	 * 对系统中所有的.ui.tabular修饰的tab项进行事件约定
	 */
	jQuery(document).on('click.ui.dropdown.semantic', '.ui.dropdown', function(e) {
		jQuery(this).dropdown('toggle');
		return false;
	});

	/**
	 * 扩展jQuery.support 添加fixed属性 用来检查浏览器是否支持fixed定位 (IE6)
	 * @type {boolean}
	 */
	jQuery.support.fixed = !(navigator.appName == 'Microsoft Internet Explorer' && navigator.appVersion.indexOf('MSIE 6') != -1);
	jQuery.support.placeholder = 'placeholder' in document.createElement('input');

	/**
	 * 扩展几个TWEEN
	 */
	jQuery.extend(jQuery.easing, {

		easeInQuad: function(x, t, b, c, d) {
			return c * (t /= d) * t + b;
		},

		easeOutQuad: function(x, t, b, c, d) {
			return -c * (t /= d) * (t - 2) + b;
		},

		easeOutExpo: function(x, t, b, c, d) {
			return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
		}
	});
});
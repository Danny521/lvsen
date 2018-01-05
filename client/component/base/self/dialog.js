/**
 * pva弹窗公共组件
 * @authors yuqiu (yuqiu_xa@netposa.com)
 * @date    2015-01-15 11:26:54
 * @version $Id$
 */

define([
	"./toolkit.js",
	"./dynamic.dom.js",
	"./mask.layer.js",
	"jquery",
	"./common.events.js",
	"mootools"
], function(Toolkit, DynamicDom, MaskLayerDom, jQuery) {

	//初始化公共动态dom文档逻辑
	var DOMPanel = DynamicDom.init(),
		MaskLayer = MaskLayerDom.init();

	// 弹窗单例管理
	var DialogManager = {

		present: null,

		keepSingle: function(dialog) {
			if (instanceOf(this.present, CommonDialog)) {
				this.present.remove(dialog.options.modal);
			}

			this.present = dialog;

			this.bindEvent();
		},

		escCancel: function(e) {
			if (e.keyCode == 27 && DialogManager.present) {
				var dialog = DialogManager.present,
					element = dialog.element;

				if (element.is(':visible') && element.css('top').toInt() > 0) {
					dialog.hide();
				}
			}
		},

		bindEvent: function() {
			jQuery(document).keydown(this.escCancel);
			this.bindEvent = jQuery.noop;
		}
	};

	// 弹窗
	var CommonDialog = new Class({

		Implements: [Options, Events],

		options: {
			width: 560,
			title: '提示',
			message: '<i class="default-text">Loading...</i>',
			isFixed: true,
			autohide: false,
			denyEsc: false,
			modal: true,
			minify: false,
			independence: false,
			visible: true,
			classes: '',
			showFooter: true,
			close: true,
			prehide: jQuery.noop
		},

		initialize: function(message, options) {
			//  做个参数格式兼容 方便调用
			if (typeof message === 'object') {
				this.setOptions(message);
			} else if (typeof message === 'string') {
				this.options.message = message;
				this.setOptions(options);
			}

			var element = this.element = this.getElement();
			this.bindEvent();

			// 保持单例
			if (this.options.independence !== true) {
				DialogManager.keepSingle(this);
			}

			// 添加到页面
			DOMPanel.append(element);

			// 显示
			if (this.options.visible) {
				this.show();
			}

			if (!this.options.close) {
				this.find('header .close').remove();
			}

			// 是否点击遮罩隐藏弹窗
			if (this.options.autohide) {
				element.click(Toolkit.stopPropagation);
				jQuery(document).one('click', this.hide.bind(this));
			}
		},

		getElement: function() {
			var fragment = ['<div class="common-dialog ' + this.options.classes + '">', '<div class="wrapper">', '<header>', '<h3 class="title">', this.options.title, '</h3>', this.options.minify ? '<a class="minify" title="最小">最小</a>' : '', '<a class="close" title="关闭"></a>', '</header>', '<section>', this.options.message, '</section>', '</div>', '</div>'].join('');

			var element = jQuery(fragment);

			// 设置样式
			element.css({
				width: this.options.width
			});

			if (this.options.isFixed === true && jQuery.support.fixed) {
				element.css({
					position: 'fixed'
				});
			}

			return element;
		},

		getHeader: function() {
			var header = this.element.find('.wrapper > header');
			if (header.size() === 0) {
				header = jQuery('<header />').prependTo(this.element.find('.wrapper'));
			}
			return header;
		},

		getBody: function() {
			return this.element.find('.wrapper > section');
		},

		getFooter: function() {
			var footer = this.element.find('.wrapper > footer');
			if (footer.size() === 0) {
				if (this.options.showFooter) {
					footer = jQuery('<footer />').appendTo(this.element.find('.wrapper'));
				}
			}
			return footer;
		},

		addButton: function(opt) {
			var footer = this.getFooter(),
				button = jQuery('<input type="button" value="' + opt.text + '" class="' + opt.clazz + '" />').appendTo(footer);
			button.click((opt.callback || jQuery.noop).bind(this));
			return button;
		},

		show: function() {
			if (this.options.modal === true) {
				MaskLayer.show();
			}
			if (this.offset) {
				this.offset.setOffset();
			} else {
				// 延迟定位是为了能让继承的类可以修改初始化方法改变结构而无需再显示调用show方法
				this.offset = new Offset(this.element, {
					top: this.options.top,
					left: this.options.left
				});
			}

			this.fireEvent(CommonEvents.SHOW, this);
		},

		hide: function() {
			if (this.options.prehide() !== false) {
				MaskLayer.hide();
				this.element.css('top', '-9999px');
				this.fireEvent(CommonEvents.HIDE, this);
			}
		},

		minimize: function() {
			MaskLayer.hide();
			this.element.css('top', '-9999px');
			this.fireEvent(CommonEvents.MINIMIZE, this);
		},

		remove: function(keepMask) {
			if (!keepMask) MaskLayer.hide();
			this.element.remove();
			this.fireEvent(CommonEvents.REMOVE, this);
		},

		find: function(rule) {
			return this.element.find(rule);
		},

		bindEvent: function() {

			var self = this;
			this.find('header .close').click(function() {
				self.hide();
			});
			this.find('.buttonitems .close').click(function() {
				self.hide();
			});
			this.find('header .minify').click(function() {
				self.minimize();
			});
		}
	});
	// Alert弹窗
	// 注: callback为点击确定按钮触发的回调
	// 当且仅当callback方法返回false时 弹窗不会触发隐藏事件
	var AlertDialog = new Class({

		Extends: CommonDialog,

		options: {
			callback: jQuery.noop,
			disableButton: false,
			warn: false,
			confirmText: '确定'
		},

		initialize: function(message, options) {
			this.parent(message, options);

			var self = this;
			this.addButton({
				text: this.options.confirmText,
				clazz: 'ui button blue' + (this.options.warn ? ' red' : ''),
				callback: function() {
					if (self.options.callback.call(self) !== false) {
						self.hide();
					}
				}
			});

			if (this.options.disableButton) this.disableButton();
		},

		disableButton: function() {
			this.getFooter().find(':input.ui.button.blue').addClass('disabled').attr('disabled', 'disabled');
		},

		enableButton: function() {
			this.getFooter().find(':input.ui.button.blue').removeClass('disabled').removeAttr('disabled', 'disabled');
		}
	});

	// Confirm弹窗
	var ConfirmDialog = new Class({

		Extends: AlertDialog,

		options: {
			cancelText: '取消',
			closure: jQuery.noop
		},

		initialize: function(message, options) {
			this.parent(message, options);

			var self = this;
			this.addButton({
				text: this.options.cancelText,
				clazz: 'ui button',
				callback: function() {
					if (self.options.closure.call(self) !== false) {
						self.hide();
					}
				}
			});
		}


	});

	// 指定位置Class
	var Offset = new Class({

		Implements: [Options, Events],

		options: {
			top: null,
			left: null
		},

		initialize: function(element, options) {
			this.element = jQuery(element);
			this.setOptions(options);
			this.setOffset();
			this.listenResize();
		},

		setOffset: function() {
			var left = this.options.left;
			// 如果LEFT没有指定 那么水平居中
			if (left == null) {
				left = (jQuery(window).width() - this.element.outerWidth()) / 2;
				left = Math.max(0, left);
			}

			var top = this.options.top;
			// 如果TOP没有指定 那么垂直居中
			if (top == null) {
				top = (jQuery(window).height() - this.element.outerHeight()) / 2;
				top = Math.max(0, top);
			}

			// 如果元素不是fixed定位 那么加上滚动条距离
			if (this.element.css('position') != 'fixed') {
				left += jQuery(document).scrollLeft();
				top += jQuery(document).scrollTop();
			}

			this.element.css({
				left: left,
				top: top
			});
		},

		listenResize: function() {
			var self = this;
			var contextProxy = function() {
				// 防止销毁元素后导致内存泄露（因为RESIZE事件是注册在WINDOW对象上 而不是ELEMENT元素上）
				if (self.element.parent().size() === 0) {
					jQuery(window).unbind('resize', contextProxy);
				} else if (self.element.is(':visible') && self.element.css('top').toInt() >= 0) {
					self.setOffset();
				}
			};
			jQuery(window).resize(contextProxy);
		},

		show: function() {
			this.element.show();
			return this;
		},

		hide: function() {
			this.element.hide();
			return this;
		}

	});

	// 居中弹窗
	var FloatDialog = new Class({

		Implements: [Options, Events],

		options: {
			width: 180,
			height: 50,
			html: "",
			top: null,
			left: null
		},

		initialize: function(options) {
			this.setOptions(options);
			var opt = {
				"top": this.options.top,
				"left": this.options.left
			};

			// 创建容器
			this.fDlgContainer = jQuery("#fDlgContainer");
			if (this.fDlgContainer.length === 0) {
				this.fDlgContainer = jQuery("<div id='fDlgContainer'></div>");
				jQuery("body").append(this.fDlgContainer);
			}
			// 居中显示 fix定位
			this.centerPanel = new Offset("#fDlgContainer", opt).show();

			this.setDefault();
		},
		setDefault: function() {
			var self = this;
			var opt = self.options;
			this.fDlgContainer.css({
				"width": opt.width,
				"height": opt.height
			});
			this.fDlgContainer.html(opt.html);

		},
		show: function() {
			MaskLayer.show();
			this.centerPanel.show();
			return this;
		},
		hide: function() {
			MaskLayer.hide();
			this.centerPanel.hide();
			return this;
		}

	});

	return {
		init: function() {
			return {
				DialogManager: DialogManager,
				CommonDialog: CommonDialog,
				AlertDialog: AlertDialog,
				FloatDialog: FloatDialog,
				Offset: Offset,
				ConfirmDialog: ConfirmDialog
			}
		},
		initGlobal: function() {
			(function() {
				this.DialogManager = DialogManager;
				this.CommonDialog = CommonDialog;
				this.AlertDialog = AlertDialog;
				this.FloatDialog = FloatDialog;
				this.Offset = Offset;
				this.ConfirmDialog = ConfirmDialog;
			}).call(window);
		}
	};
});
/*
 *	自动填充
 */
define(['jquery', 'mootools'], function() {
	var AutoComplete = new Class({

		Implements: [Options, Events],

		options: {
			url: '/service/pvd/get_incident_menu',
			checkUrl: '/service/pvd/incident/matching/',
			delay: 200,
			captureLength: 0,
			checkCallback: jQuery.noop,
			selector: 'li',
			enter: false,
			parentSelector: "div",
			count: 10,
			directionListenerFlag: false,
			top: 0,
			left: 0
		},

		initialize: function(options) {
			this.setOptions(options);

			this.node = jQuery(this.options.node);
			if (this.node.size() === 0) {
				return;
			}
			this.term = jQuery.trim(this.node.val());
			this.cache = new Hash();
			this.panel = jQuery('<div class="suggest-panel"><ul class="result"></ul></div>').css({
				"top": this.options.top,
				"left": this.options.left,
				"position": "absolute"
			}).addClass(this.options.panelClass);

			this.node.closest(this.options.parentSelector).css("position", "relative").append(this.panel);

			var templateStr = '<li data-id="{{ id }}" data-incidentid="{{incidentId}}" data-name="{{ name }}">{{ name }} {{#if associateId}}({{associateId}}){{/if}}</li>';
			this.template = Handlebars.compile(templateStr);

			this.bindEvents();
			this.hasMatching = false;
			this.matchingName = [];
		},

		getPanel: function() {
			return this.panel;
		},

		loadData: function(text) {
			if (!text || jQuery.trim(text) === '') {
				return this.getPanel().hide();
			}

			// 查询缓存 如果缓存中有数据直接渲染
			var data = this.cache.get(text);
			if (data !== null) {
				this.assemble(data);
				return;
			}

			// 开始请求
			var self = this;
			var entity = {
				q: text,
				count: self.options.count
			};

			this.xmlhttp = jQuery.ajax({
				url: this.options.url,
				type: "POST",
				data: entity,
				dataType: 'json',
				cache: false,
				beforeSend: function() {
					if (self.xmlhttp) {
						self.xmlhttp.abort();
					}
					// self.xmlhttp && self.xmlhttp.abort();
				},
				success: function(res, status, xhr) {
					if (res && res.code === 200) {
						var data = res.data.list;

						//	self.cache.set(text, data);

						self.assemble(data);
						if (data.length > 0) {
							self.hasMatching = true;
							for (var i = 0; i < data.length; i++) {
								self.matchingName.push(data[i].name);
							}

						} else {
							self.hasMatching = false;
							self.matchingName = [];
						}
					}
				}
			});

		},

		// 获取菜单元素
		getItems: function() {
			return this.panel.find(this.options.selector);
		},

		// 装配数据
		renderItem: function(list) {
			var self = this;
			var fragment = '';

			Array.from(list).each(function(data) {
				fragment += self.template(data);
			});

			return fragment;
		},

		// 显示查询结果
		assemble: function(data) {
			var box = this.panel.find('ul.result'),
				datal = Array.from(data);

			if (datal.length === 0) {
				box.html('');
				this.hide();
			} else {
				box.html(this.renderItem(datal));
				this.show();
			}
		},

		show: function() {
			if (this.panel.is(':hidden')) {
				this.panel.show();
			}
		},

		hide: function() {
			if (this.panel.is(':visible')) {
				this.panel.hide();
			}
		},

		suggest: function(text) {
			this.term = text || this.term;
			if (this.term) {
				this.node.val(jQuery.trim(this.term));
				this.loadData(this.term);
			}
		},

		changeListener: function(opt) {

			var self = this,
				timer = null,
				node = this.node,
				panel = this.panel;

			// 检查是否需要触发回调
			var checkChange = function(override) {
				var text = jQuery.trim(node.val());

				if (text.length >= self.options.captureLength && (override || text !== self.term)) {
					self.term = text;
					self.loadData(text);
				}
			};

			// 敲击事件和失焦事件
			node.keyup(function(e) {
				// 特殊键过滤
				node.attr('data-id', 'notexist');
				/*if(node.attr("data-id") !== "notexist"){
					node.attr('data-id', 'notexist');
				}*/
				if (panel.is(':visible')) {
					if (e.keyCode === 13 && self.options.enter) {
						var name = jQuery.trim(node.val());

						self.getItems().each(function(index, domEle) {
							var value = jQuery(domEle).attr('data-name');
							if (name === value) {
								jQuery(domEle).addClass('active');
							}
						});

						var item = self.getItems().filter('.active');
						if (item.size() > 0 && !item.is('.invalid')) {
							self.hide();
							node.val(item.attr('data-name'));
							node.attr('data-name', item.attr('data-name'));
							node.attr('data-udid', item.attr('data-udid'));

							self.term = '';
							return;
						}
					}
					if (e.keyCode === 40 || e.keyCode === 38) {
						return;
					}
				}
				// 检查是否加载建议信息
				clearTimeout(timer);
				timer = setTimeout(checkChange, self.options.delay);
			});
		},
		checkExists: function(node) {
			var self = this;
			if (self.checkReq) {
				self.checkReq.abort();
			}
			self.checkReq = jQuery.ajax({
				url: self.options.checkUrl + jQuery.trim(node.val()),
				type: "get",
				dataType: "json",
				success: function(res) {
					if (res.code === 200) {
						if (res.data.incident !== "") {
							var data = res.data.incident;
							node.attr("data-id", data.id);
							node.attr("data-incidentid", data.incidentId);
							self.options.checkCallback(data);
						}
					} else {
						notify.warn("服务异常");
					}
				}
			});
		},

		directionListener: function() {
			// 禁止方向键
			if (!this.options.directionListenerFlag) {
				return;
			}
			var self = this,
				node = this.node,
				panel = this.panel;

			node.bind('keydown', function(e) {
				var code = e.keyCode;

				if ((code === 40 || code === 38)) {
					if (panel.is(':visible')) {
						var list = self.getItems();

						if (list.length === 0) {
							return;
						}

						var item = null,
							lastItem = list.filter('.active').removeClass('active'),
							lastIndex = list.index(lastItem);

						if (code === 40) {
							var index = lastIndex + 1;
							if (index >= list.length) {
								node.val(self.term);
							} else {
								item = list.eq(index);
							}
						} else if (code === 38) {
							var index1 = lastIndex - 1;
							if (index1 === -1) {
								node.val(self.term);
							} else {
								if (index1 === -2) {
									index1 = list.length - 1;
								} else {
									item = list.eq(index1);
								}
							}
						}

						// 如果是上下选择
						if (item) {
							item.addClass('active');
							node.val(item.attr('data-name'));
						}
					} else if (self.panel.find(self.options.selector).size() > 0) {
						self.show();
					}

					// 这句是因为Chrome下面会移动光标到文本开头
					e.preventDefault();
				}
			});
		},

		bindEvents: function() {

			// HOVER激活状态
			var self = this,
				node = this.node,
				panel = this.panel,
				timer = timer;

			panel.on('mouseenter', this.options.selector, function() {
				jQuery(this).addClass('active').siblings().removeClass('active');
			});
			panel.on('mouseleave', this.options.selector, function() {
				jQuery(this).removeClass('active');
			});
			panel.on('click', this.options.selector, function(e) {
				var item = jQuery(this);
				if (item.is('.invalid')) {
					node.focus();
					return false;
				}

				item.addClass('active').siblings().removeClass('active');

				node.val(item.attr('data-name'));
				node.attr('data-name', item.attr('data-name'));
				node.attr('data-id', item.attr('data-id'));
				node.blur();
				node.focus();

				self.hide();
				self.term = '';

				return false;
			});

			var hidePanel = this.hide.bind(this);

			panel.on('mouseenter', function() {
				node.unbind('blur', hidePanel);
			});
			panel.on('mouseleave', function() {
				node.bind('blur', hidePanel);
			});

			node.bind('click', Toolkit.cancelBubble);
			jQuery(document).bind('click', hidePanel);

			// 监听文本改变
			this.changeListener();

			// 监听上下选择
			this.directionListener();
		}
	});
	return AutoComplete;
});
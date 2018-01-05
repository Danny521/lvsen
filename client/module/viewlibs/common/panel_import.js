define(['panel', 'jquery-ui'], function(BlankPanel) {
	var panelImport = new new Class({
		Extends: BlankPanel,
		options: {
			pageUrl: '/module/viewlibs/workbench/local_import.html'
		},
		init: function(options) {
			var self = this;
			self.createElement();
			self.bindEvent();
			self.autosize();
		},
		createElement: function() {
			var tpl = $(this.tpl).appendTo(document.body);
			this.panel = tpl.find(".droppanel").css({
				left: this.options.left
			});

			this.panelMask = tpl.find(".droppanel-mask");
			this.btnClose = tpl.find(">.close");
			this.btnClose.css({
				left: this.options.left - this.btnClose.width()
			});
			this.panelContent = this.panel.find(".droppanel-content");
			this.loadingDiv = this.panelContent.find(">.loading");
		},	
		autosize: function() {
			var self = this;

			// 执行父类的autosize
			BlankPanel.prototype.autosize.call(this);
			this.panel.css({
				width: $(window).width() - this.options.left,
				height: $(window).height()
			});

			this.iframe &&
			this.iframe.css({
				width: this.panel.css("width"),
				height: this.panel.css("height")
			});
		},
		open: function() {
			var self = this;
			if (!self.panel) {
				self.init();
			};
			if (self.panel.is(":hidden")) {
				self.panelMask.fadeIn();
				self.panel.show("drop", {
					direction: "right"
				}, "fast", function() {
					self.btnClose.removeClass("hidden");
					self.loadContent();
				});
			};
			// 触发窗口打开事件
			self.fireEvent("open");
		},
		close: function() {
			var self = this;
			if (self.panel.is(":visible")) {
				//IE9下兼容性，在执行innerHTML的时候，旧的iframe被销毁，这时flash捕获到被销毁的事件后就会调用__flash__removeCallback方法来处理本身的flash对象（可能是为IE性能考虑）
				try {
					//在iframe销毁前清理掉iframe中的内容（特别是flash）  
					this.iframe.contents().find("body").empty();
				} catch (e) {}
				this.iframe.remove();
				this.iframe = null;
				self.btnClose.addClass("hidden");
				self.panelMask.fadeOut();
				self.panel.hide("drop", {
					direction: "right"
				}, "fast");
				//Cookie.read("importincdata");
				Cookie.dispose('importincdata');
				// 触发窗口关闭事件
				self.fireEvent("close");
				//案事件导入视图成功后关闭刷新父页面不起作用
				if (jQuery("#importMedia")) {
					BroadCast.emit("reload");
				}
			}
		},
		loadContent: function() {
			this.loadingDiv.hide();
			this.iframe = $('<iframe></iframe>').attr({
				src: this.options.pageUrl
			}).appendTo(this.panelContent);	
			this.autosize();
		}
	});
	return  panelImport;
});
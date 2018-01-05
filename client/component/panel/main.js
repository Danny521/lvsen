define(['base.self', 'jquery-ui'], function() {
    var BlankPanel = new Class({
        Implements: [Events],
        tpl: '<div class="droppanel-container">' +
            '<i class="close hidden">收起</i>' +
            '<div class="droppanel-mask"><iframe src="javascript:;"></iframe></div>' +
            '<div class="droppanel">' +
            '<div class="droppanel-content">' +
            '<div class="loading"></div>' +
            '</div>' +
            '</div>' +
            '</div>',
        /*自定义的模版*/
        options: {
            selfTpl: null,
            left: 150
        },
        initialize: function(options) {
            if (typeof options === "string") { // 兼容老的参数为string的方法，老方法只有一个模板地址的参数
                this.options.selfTpl = options;
            } else {
                this.setOptions(options || {});
            };
        },
        setOptions: function(options) {
            this.options = $.extend(true, {}, this.options, options || {});
        },
        init: function() {
            var self = this;
            self.createElement();
            self.bindEvent();
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
        bindEvent: function() {
            var self = this;

            // 关闭面板
            this.btnClose.on("click", function() {
                self.close();
            });

            // ESC关闭面板
            // $(this.panel).keydown(function(e) {
            // 	if (e.keyCode == 27) {
            // 		self.close();
            // 	};
            // });

            // 自适应窗口大小
            $(window).on("resize.droppanel", function(e) {
                if (self.panel.is(":visible")) {
                    self.autosize();
                };
            });
        },
        autosize: function() {
            this.panelContent
                .outerHeight(this.panel.outerHeight(true))
                .outerWidth(this.panel.outerWidth(true));
        },
        loadPage: function() {
            var self = this;
            $.when(Toolkit.loadTempl(self.options.selfTpl)).done(function(tem) {
                // 隐藏加载条
                self.loadingDiv.hide();
                self.fireEvent("loadingHide");

                // 加载模板dom
                $(tem).appendTo(self.panelContent);

                // 模板加载成功触发
                self.fireEvent("tplLoaded");

                // 自适应窗口大小
                self.autosize();
            });
        },
        open: function() {
            var self = this;
            if (!self.panel) {
                self.init();
            };
            if (self.panel.is(":hidden")) {
                self.fireEvent("beforeOpen");
                self.panelMask.fadeIn();
                self.panel.show("drop", {
                    direction: "right"
                }, "fast", function() {
                    self.btnClose.removeClass("hidden");
                    // 触发窗口打开事件
                    self.fireEvent("open");
                    // 加载页面
                    if (!self.pageLoaded) {
                        self.loadPage();
                        self.pageLoaded = true;
                    }
                });
            };
        },
        close: function() {
            var self = this;
            if (self.panel.is(":visible")) {
                self.fireEvent("beforeClose");
                self.btnClose.addClass("hidden");
                self.panelMask.fadeOut();
                self.panel.hide("drop", {
                    direction: "right"
                }, "fast", function() {
                    // 触发窗口关闭事件
                    self.fireEvent("close");
                });
            }
        }
    });
	return BlankPanel;
});

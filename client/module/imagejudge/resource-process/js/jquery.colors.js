define([
    'jquery'
], function(){
        function Colors(options) {
            this.setOptions(options);
        };

        Colors.prototype = {
            constructor: Colors,
            // 设置参数
            setOptions: function(options) {
                var self = this;
                this.options = $.extend({
                    element: null,
                    stopOnHover: true,
                    interval: 500,
                    colors: ["#0088cc","#48bdf7"]
                    //colors: ["#E60000","#E63100","#E66F00","#58E600","#00E5E6","#006FE6","#AC00E6"]
                }, this.options, options||{});

                this.element = $(this.options.element);
            },
            start: function() {
                var self = this;
                if(self.running) {return};
                self.running = true;

                if(self.options.stopOnHover) {
                    self.element.on("mouseenter", function(){
                        self.stop(true);
                    }).on("mouseleave", function() {
                        self.start();
                    });
                };

                var colorIndex = 0;
                var originalColor = self.element.css("color");
                (function play() {
                    colorIndex = colorIndex === self.options.colors.length ? 0 : colorIndex;
                    self.element.animate({
                        color: self.options.colors[colorIndex++]
                    }, self.options.interval, function() {
                        if(self.running) {
                            play();
                        } else {
                            self.element.css("color", originalColor);
                        }
                    });
                })();
            },
            stop: function(stopOnHover) {
                if(this.running) {
                    this.running = false;
                    if(stopOnHover != true) {
                        this.element.off("mouseenter mouseleave");
                    };
                };
            }
        };

        $.fn.colors = function(options, params) {
            this.each(function() {
                var colors = $(this).data("colors");
                var isMethod = typeof options === "string";
                if(colors) {
                    if(isMethod) {
                        colors[options](params);
                        return;
                    } else {
                        colors.setOptions(options);
                    }
                } else {
                    var opts = { element: this };
                    opts = isMethod ? opts : $.extend({}, opts, options||{});
                    colors = new Colors(opts);
                    $(this).data("colors", colors);
                    if(isMethod) {
                        arguments.callee.call(this, options);
                    };
                };
            });
            return this;
        };
})
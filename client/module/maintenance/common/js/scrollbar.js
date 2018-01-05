/**
 * scrollBar 原生滚动条
 * @author LiangChuang
 * @date   2014-12-02
 * @param  {object} DOM 对象，可以使 jQuery 对象或者 dom 对象，或选择器字符串
 * @param  {function} 需要计算高度的函数，返回值为 数字
 */
;(function(name,definition){

    var hasDefine = typeof define === 'function';  // 检测上下文环境是否为 AMD 或者 CMD

    if(hasDefine){
        define(definition); // AMD 或者 CMD 环境
    }else{
        this[name] = definition(); // 将模块的执行结果挂载在 window 变量中，在浏览器中 this 指向 window 变量。
    }

})('scrollBar',function(){
    var scrollBar = {

        init : function (obj,cb) {
            this.viewport = obj ? $(obj) : jQuery('#treePanel').find('.form-panel .viewport');
            this.setHeight(cb);
            this.bindEvent(cb);
        },

        setHeight : function(cb){
            // document - (navigator + header + padding + tabular + ptz + dynamicForm)
            this.viewport.css('height', ((cb && cb()) || jQuery("#treePanel").height() - (56)));
        },

        updateScrollbar: function (top) {
            if (!top) {
                return;
            }
            this.viewport.scrollTop(top);
        },

        bindEvent : function(cb){
            var interval, self = this;

            jQuery(window).resize(function () {
                clearTimeout(interval);
                interval = setTimeout(function () {
                    self.setHeight(cb);
                }, 200);
            });

        }
    };
    return scrollBar;
});
/*define(function() {

    var scrollBar = {

        init : function (obj,cb) {
            this.viewport = obj ? $(obj) : jQuery('#treePanel').find('.form-panel .viewport');
            this.setHeight(cb);
            this.bindEvent(cb);
        },

        setHeight : function(cb){
            // document - (navigator + header + padding + tabular + ptz + dynamicForm)
            this.viewport.css('height', ((cb && cb()) || jQuery("#treePanel").height() - (56)));
        },

        updateScrollbar: function (top) {
            if (!top) {
                return;
            }
            this.viewport.scrollTop(top);
        },

        bindEvent : function(cb){
            var interval, self = this;

            jQuery(window).resize(function () {
                clearTimeout(interval);
                interval = setTimeout(function () {
                    self.setHeight(cb);
                }, 200);
            });

        }
    };

    return {
        scrollBar : scrollBar
    }

});*/
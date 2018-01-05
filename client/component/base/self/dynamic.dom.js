/**
 * Created by Zhangyu on 2015/8/4.
 */
define(["./toolkit.js"], function(Toolkit) {
    /**
     * 所有由脚本创建的DOM结构都应该放置在这个容器里
     * 以便统一DOM树形结构 方便调试
     * @type {{append, prepend, getPanel}}
     */
    var DOMPanel = (function() {

        var panel = null;

        return {

            append: function(dom) {
                this.getPanel().append(dom);
            },

            prepend: function(dom) {
                this.getPanel().prepend(dom);
            },

            getPanel: function() {
                if (panel === null) {
                    panel = jQuery('#domPanel');
                    if (panel.size() === 0) {
                        panel = jQuery('<div id="domPanel" />').prependTo('body');
                    }
                    // 点击对话框不会触发给document绑定的点击行为
                    panel.click(Toolkit.cancelBubble);
                    panel.mousedown(Toolkit.cancelBubble);
                }

                return panel;
            }
        };

    })();
    /**
     * 定义初始化入口
     * @type {{init: Function, initGlobal: Function}}
     */
    return {
        init: function () {
            return DOMPanel;
        },
        initGlobal: function () {
            (function () {
                this.DOMPanel = DOMPanel;
            }).call(window);
        }
    };
});
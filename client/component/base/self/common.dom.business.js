/**
 * 公共dom文档的行为绑定
 * Created by Zhangyu on 2015/7/28.
 */
define(["jquery"], function(jQuery) {
    // 日期控件
    jQuery(document).on('focus', '.input-date', function() {
        var self = this;
        jQuery(self).datepicker({
            dateFormat: 'yy-mm-dd',
            // changeYear: true,	若显示年下拉选择 样式变乱  有疑问，联系胡中传
            yearRange: "1970:2080",
            showAnim: ''
        }).datepicker('show');
    });

    //解决某些版本浏览器maxLength无效的问题
    jQuery(document).on("keydown keyup", "input,textarea", function() {
        var L = jQuery(this).attr("maxLength");
        var str = jQuery(this).val();
        if (str.length > L) {
            str = str.substr(0, L);
            jQuery(this).val(str);
        }
    });

    //添加滚轮调节数值功能 <input class="mousewheel-num" max="100" min="-100" step="2"/>
    jQuery(document).on("mousewheel", "input.mousewheel-num", function(evt) {
        var val = jQuery(this).val() - 0;
        var min = jQuery(this).attr("min") - 0;
        var max = jQuery(this).attr("max") - 0;
        var step = jQuery(this).attr("step") - 0;
        var K = evt.originalEvent.wheelDelta / 120;
        jQuery(this).val(val + K * step);
    });

    // 添加滚轮调节数值功能 时间插件专用 <input class="mousewheel-num" max="100" min="-100" step="2"/> by songxj
    jQuery(document).on("mousewheel", "input.ui-time-picker-mousewheel", function(evt) {
        if (jQuery(this).attr("disabled")) {
            return false;
        }

        var val = jQuery(this).val() - 0;
        var min = jQuery(this).attr("min") - 0;
        var max = jQuery(this).attr("max") - 0;
        var step = jQuery(this).attr("step") - 0;
        var K = evt.originalEvent.wheelDelta / 120;
        var value = val + K * step;

        if (value === (max + 1)) {
            value = min;
        }
        if (value === (min - 1)) {
            value = max;
        }

        value = value < 10 ? "0" + value : value;
        jQuery(this).val(value).trigger("input");
    });

});

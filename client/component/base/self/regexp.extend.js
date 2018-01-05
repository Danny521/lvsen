/**
 * 正则扩展，以后扩展的正则表达式都放在这个地方
 * Created by Zhangyu on 2015/7/28.
 */
define(["mootools"], function() {
    // 全局添加一些正则
    RegExp.extend({

        isEmail: function(text) {
            return (/^([\w-])+(\.\w+)*@([\w-])+((\.\w+)+)$/).test(String(text).trim());
        },

        isMobile: function(text) {
            return (/^\d{11}$/).test(String(text).trim());
        },

        isLandline: function(text) {
            return (/^((\d{7,8})|((\d{3,4})-(\d{7,8})(-(\d{1,4}))?)|(\d{7,8})-(\d{1,4}))$/).test(String(text).trim());
        },

        isPhone: function(text) {
            return this.isMobile(text) || this.isLandline(text);
        },
        /**
         * [formatName description]
         * @author yangll
         * @date   2016-05-11
         * @description [功能：检测字符串是否只含有字母、数字、汉字和下划线]
         * @param  {[type]} text [要进行检测的字符串]
         * @return {[type]} Boolean型   [true:表示text中含有非字母或数字或汉字或下划线的其他字符; false:表示只含有这些字符]
         */
        formatName: function(text){  
            return text.test(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/ig);
        }

    });
});
/**
 * @description [入库入口]
 * @author [songxuejie@netposa.com]
 * @data [2016/03/30]
 */
define([
    "jquery",
    "/module/pvb/js/controller/enterlib-controller.js"
], function(jQuery, Controller) {
    "use strict";

    return (function(scope, $) {
        scope.init = function(obj) {
            Controller.init(obj);
        };

        return scope;
    }({}, jQuery));
});

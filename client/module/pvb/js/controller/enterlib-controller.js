/**
 * @description [入视图库Controller]
 * @author [songxuejie@netposa.com]
 * @data [2016/03/30]
 */
define([
    "jquery",
    "/module/pvb/js/view/enterlib-view.js",
    "/module/pvb/js/model/enterlib-model.js"
], function(jQuery, View, Model) {
    "use strict";

    return (function(scope, $) {

        scope.init = function(resourceObj) {
            View.init(scope, resourceObj);
        };
        scope.EnterStoreCon=function(data,_enterLibDialog){
            Model.EnterStore(data,{}).then(function (res) {
                if (res.code === 200) {
                    notify.success("入库保存成功！");
                    setTimeout(function() {
                        _enterLibDialog.options.prehide();
                    }, 2000);

                } else {
                    notify.error(res.message || '入库保存失败！网络或服务器异常!');
                }
            }, function () {
                notify.error("入库保存失败！网络或服务器异常！");
            });
        }
        scope.getImgUrl=function(data){
           return  Model.getImgUrl(data,{});
        }
        return scope;
    }({}, jQuery));
});

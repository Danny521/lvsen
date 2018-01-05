/**
 * @description [入视图库Model]
 * @author [songxuejie@netposa.com]
 * @data [2016/03/30]
 */
define(["jquery","ajaxModel"], function(jQuery,ajaxModel) {
    "use strict";

    return (function(scope, $) {
        var _pvbserviceHost = "/pvbservice/";
        var _serviceHost="/service/";
        //设置请求的url集合
        var _ACTIONS_URL = {
            ENTER_STORE_IMG_URL:  _pvbserviceHost+"dataaccess/save_image",// 图片类型
            ENTER_STORE_VIDEO_URL: _pvbserviceHost+"dataaccess/save_video",//视频类型
            ENTER_STORE_HISTORY_VIDEO_URL:_serviceHost+"history/imageVideoDownload",//历史录像
            FORMAT_BASE64_IMG_URL:_pvbserviceHost+"dataaccess/upload/base64"

        };
        //入库保存
        scope.EnterStore=function(data,custom){
            var url=_ACTIONS_URL.ENTER_STORE_IMG_URL;
            if(data.type=='img'){
                url=_ACTIONS_URL.ENTER_STORE_IMG_URL;
            }else if(data.type=='PFS'){
                url=_ACTIONS_URL.ENTER_STORE_VIDEO_URL;
            }else if(data.type=='history'){
                url=_ACTIONS_URL.ENTER_STORE_HISTORY_VIDEO_URL;
            }
            return ajaxModel.postData(url, data.params, custom);
        }
        //转换64位编码图片
        scope.getImgUrl=function(data,custom){
            var deferred = $.Deferred();
            $.ajax({
                url: _ACTIONS_URL.FORMAT_BASE64_IMG_URL,
                type: 'POST',
                data: data,
                success: function (res) {
                    deferred.resolve(res);
                }
            });
            return deferred.promise();
            //return ajaxModel.postData(_ACTIONS_URL.FORMAT_BAEE64_IMG_URL, data, custom);
        }
        scope.init = function() {

        };
        return scope;
    }({}, jQuery));
});

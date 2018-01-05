define([
    '/module/viewlibs/workbench/js/conf.js',
    '/module/viewlibs/workbench/js/import/load_common_view.js',
    'base.self',
    'jquery-ui-1.10.1.custom.min',
    'jquery-ui-timepicker-addon',
    'scrollbar'
], function ( conf, loadCommonView) {

    var  modifyData= function (data, prefix, suffix, name, value) {
        var len = data.length;
        var str = prefix || "{",
            item = '';
        for (var i = 0; i < len; i++) {
            item = data[i];
            str = str + '"' + item.name + '":"' + item.value + '",';
        }
        if (name !== undefined && value !== undefined) {
            str = str + '"' + name + '":"' + value + '",';
        }
        str = str.substr(0, str.length - 1);
        str = str + (suffix || "}");
        return str;
    };

    var fillPlat= function (data) {
        $.each(data, function (i) {
            $("#" + i).val(data[i]);
        });
    };

    var refreshData = function () {
            //轮巡监巡进行中
            if (opener.LoopInspect.isGoing) {

                //非轮巡监巡状态
            } else {
                var openerPlayer = opener.gVideoPlayer, //获取父页面的gVideoPlayer对象
                    layout = openerPlayer.getLayout(), //获取父页面的播放器布局数
                    cameras = openerPlayer.cameraData.slice(0); //将父页面的channelsObjArray的拷贝拿出来

                // 设置当前窗口布局
                if (this.screenPlayer.getLayout() !== layout) {
                    jQuery('.split-panel i.layout[data-layout="' + layout + '"]').trigger('click');
                    jQuery('#major .header .split').trigger('click');
                }
                // 关闭父窗口视频
                openerPlayer.stopAll();
                // 自动播放
                this.autoPlay(cameras);
            }
        };

    var commitFormData = function ($dom, name, value) {
        var that = this;
        var data = $dom.serializeArray();
        var json = modifyData(data, '{', '}', name, value);

        return json;
    };

    loadCommonView.loadCommon();
    var commonMethoder = {
         modifyData : modifyData,
        fillPlat : fillPlat,
        fillCascade : loadCommonView.fillCascade,
        refreshData : refreshData,
        videoValid : loadCommonView.videoValid,
        imageValid : loadCommonView.imageValid,
        commitFormData : commitFormData
    };
    window.commonMethod = commonMethoder;
    return commonMethoder;
})
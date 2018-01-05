/**
 * Created by LiangChuang on 2015/4/20.
 */
define(['plupload',"base.self"],function(){

    var uploader = new plupload.Uploader({
        runtimes: 'flash,html5,silverlight,html4,browserplus',
        browse_button: "chooseFile",
        multi_selection: false,
        max_file_size: '2gb',
        url: '/service/authorization/?_=' + (new Date()).getTime(),
        file_data_name: 'file',
        flash_swf_url: '/libs/plupload/plupload.flash.swf',
        silverlight_xap_url: '/libs/plupload/plupload.silverlight.xap',
        urlstream_upload: true,
        filters: []
    });

    //uploader.init();

    //上传错误
    uploader.bind('Error', function (file,error) {
        notify.warn("上传出错，请重试！");
    });

    //上传进度
    uploader.bind('UploadProgress', function (up, file) {
        // to do
    });

    return uploader;

});
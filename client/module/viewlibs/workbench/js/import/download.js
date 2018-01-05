define([
    '/module/viewlibs/workbench/js/import/upload.js'
], function (uploadClass) {
    jQuery(function () {
        window.name = 'localimport';
        //调用上传类
        uploadClass.init({});
    });
})
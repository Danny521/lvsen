/**
 * 上传ICP模块
 * @author LuoLong
 * @date   2015-06-09
 */
 define(["base.self"], function() {
 	var uploadDialog = new Class({
        Extends: CommonDialog,
        //后台接口地址
        urls: {
        	uploadUrl: "/service/pvd/icp/incident/sync/"
        },
        //弹框信息
        options: {
            title: "上传ICP",
            height: "202px",
            width: "440px",
            classes: "upload-icpDialog",
            uploadData: {}, //上传数据缓存
            callback: jQuery.noop //上传成功后，执行的回调
        },
        initialize: function(options) {
            this.parent(options);
            this.startLoading();
        },
        //启动上传功能
        startLoading: function() {
            this.showDialogBody();
            this.bindEvents();
            this.startUpload();
        },
        //输出上传面板相关的dom
        showDialogBody: function() {
        	var html = [
                    "<div class='loading step'><div class='icon'>上传中...</div></div>",
                    "<div class='result success step disnone'><div class='tips'>上传成功 !</div><div class='foot'><button class='ui button blue success'>完成</button></div></div>",
                    "<div class='result fail step disnone'><div class='tips'>上传失败 !</div><div class='foot'><button class='ui button blue fail'>重新上传</button></div></div>"
                ];
            this.getBody().html(html.join(""));
        },
        //绑定事件
        bindEvents: function() {
            var self = this,
                $parent = jQuery(".upload-icpDialog");
            $parent
                .find("button.success").unbind("click").bind("click", function() {
                    self.hide();
                    self.options.callback(); //成功回调函数*/
                }).end()
                .find("button.fail").unbind("click").bind("click", function() {
                    $parent
                        .find(".result.fail").hide().end()
                        .find(".loading").show();
                    self.startUpload();
                }).end();
        },
        //开始上传
        startUpload: function() {
            var self = this,
                $dialog = jQuery(".upload-icpDialog"),
                data = self.options.uploadData,
                url = self.urls.uploadUrl + data.ids;

            jQuery.ajax({
                type: "post",
                url: url,
                beforeSend: function() {
                    $dialog.find(".close").hide();
                }
            }).done(function(res) {
            	if (res.code !== 200) {
                    return $dialog.find(".fail").show().siblings(".step").hide();
                }

                $dialog.find(".success").show().siblings(".step").hide();
            }).fail(function() {
            	$dialog.find(".fail").show().siblings(".step").hide();
            }).always(function() {
            	$dialog.find(".close").show();
            })
        }
    });

	return uploadDialog;
 })
 
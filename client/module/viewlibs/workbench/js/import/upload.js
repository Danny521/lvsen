define([
    'js/conf',
    'underscore',
    'js/import/incident',
    'ajaxModel',
    'broadcast',
    '/module/viewlibs/workbench/js/import/load_common.js',
    'plupload'
], function (conf, _, IncidentMgr, ajaxModel, BroadCast) {

    var $ = jQuery;

    var setContent = function (dom, value) {
        dom.contents().find('#file_format').val(value);
    }

    var options = {
        url: '/service/vedior/add_vedior',

        folder: null,

        uploader: null,

        exuploader: null,

        template: null,

        iframeContent: null,

        templurl: '/module/viewlibs/workbench/inc/tpl_create.html',

        //上传容器
        // browse_button: 'chooseFile',

        browse_button: 'chooseFile1'
    };

    var bindEvent = function () {
        var self = this;
        bindUpload(options.browse_button);
	    if (!JudgeChromeX()) {//window.navigator.userAgent.test('Chrome/30')) {
		    document.body.onbeforeunload = function (e) {
			    if (jQuery(".content div.upload-item").length > 0 && !self.removeCurFile) {
				    return "如果点击“离开此页”，您未提交或未保存的上传数据将不会被保存";
			    }
		    };
	    }
    };

    /**
     * 处理文件上传出错的提示性逻辑
     * @param code - 错误码
     */
    var showUploadError = function(code) {
        switch (code) {
            case -601:
                notify.warn("系统暂不支持该类型文件的上传，请上传图片或者视频文件！");
                break;
            case -600:
                notify.warn("上传的文件大小应保持在2GB以内！");
                break;
        }
    };

    var bindUpload = function (browse_button) {
        var that = this;
        // 上传控件
        var uploader = new plupload.Uploader({
            runtimes: 'flash,html5,silverlight,html4,browserplus',
            browse_button: browse_button,
            multi_selection: true,
            max_file_size: '2gb',
            url: '/service/pvd/upload_video_file?_=' + (new Date()).getTime(),
            file_data_name: 'file_name',
            flash_swf_url: '/libs/plupload/plupload.flash.swf',
            silverlight_xap_url: '/libs/plupload/plupload.silverlight.xap',
            filters: [
                {
                    title: "选择图片",
                    //tiff格式图片在网页上显示需要安装插件，系统暂不支持，bug[38928],add by zhangyu 2016.03.31
                    extensions: window.uploadImageExtention
                }, {
                    title: "选择视频",
                    extensions: window.uploadVideoExtention
                }
            ],
        });

        //初始化
        uploader.init();

        //添加文件 自动上传
        uploader.bind('FilesAdded', function (up, files) {
            uploader.start();

            for (var i = 0; i < files.length; i++) {
                renderTemp(files[i]);

            }
        });
        //上传错误
        uploader.bind('Error', function (up, file) {
            uploadStatuChange(file.file, "1");
            //图像研判/云空间，对文件上传错误进行提示，add by zhangyu 2016.03.31
            showUploadError(file.code);
        });

        //上传进度
        uploader.bind('UploadProgress', function (up, file) {
            uploadStatuChange(file, "2");
        });

        //取消导入
        $("#content").on("click", ".upload-item .operate a.cancel-import", function () {
            //uploader.stop();
            var $dom = $(this);
            var cancelDialog = new ConfirmDialog({
                title: '提示信息',
                warn: true,
                top: "238.5px",
                message: '<div class="dialog-messsage"><h4>您确定要取消导入此文件吗？</h4>',
                callback: function () {
                    uploader.stop();
                    var fileid = $dom.closest(".upload-item").data("id");
                    file = uploader.getFile(fileid)
                    uploader.removeFile(file);
                    $dom.closest(".upload-item").remove();
                   uploader.start();
                }
            });

            cancelDialog.find('input[value="取消"]').click(function (event) {
               // uploader.start();
            });

            cancelDialog.find(".close").click(function () {
               // uploader.start();
            });
        });

        uploader.bind('FileUploaded', function (up, file, res) {
            var type = "",
                jsonFormat = JSON.parse(res.response),
                targetDom = $(".upload-item[data-id=" + file.id + "]");
            if (jsonFormat.code === 200) {
                targetDom.attr("id", jsonFormat.id);
                targetDom.attr("data-type", jsonFormat.type);
                targetDom.attr("data-path", jsonFormat.localPath);
                completeStatus(file);
                loadIframe(jsonFormat, file, jsonFormat.id, jsonFormat.type, jsonFormat.localPath, jsonFormat.fileType);
            } else if (jsonFormat.code === 500) {
                notify.warn("服务器异常！");
                uploadStatuChange(file, "1");
            } else {
                notify.warn(jsonFormat.mes);
                uploadStatuChange(file, "1");
            }
            //填写信息
            $(".content").on("click", ".upload-item[data-id=" + file.id + "] .operate a.write-info", function (event) {
                var jsIframe = document.getElementById(file.id);
                writeEvent($(this), file);
                 var iframeDom = jQuery("#" + file.id).contents();
                if ($(this).closest("div.upload-item").attr("data-type").trim() === "1") {
                    var tem = {
                        "filename": targetDom.attr("data-path")
                    };
                    var dataProgress = $(".upload-item[data-id=" + file.id + "] a").attr("data-progress");
                    //第一次点击表单
                    if (dataProgress === "0") {
                        iframeDom.find("#domPanel").hide();
                        setTimeout(function () {
                            jsIframe.contentWindow.Mplayer.initPlayer(tem);
                            var curVersion = jsIframe.contentWindow.Mplayer.getVersion(),
                                curVersionArray = [],
                                ocxVersionArray = curVersion.split('.');
                            if(!curVersion.contains('V')){
                                iframeDom.find("#domPanel").show();
                            }else{
                                curVersionArray = curVersion.split('V')[1].split('.');
                                $.each(curVersionArray, function(index, val) {
                                    if( + val > + ocxVersionArray[index]){
                                        Cookie.dispose("doNotRemind");
                                        return false;
                                    }else if((+ val < + ocxVersionArray[index])){
                                       iframeDom.find("#domPanel").show();
                                    }
                                });
                            }
                            $(".upload-item[data-id=" + file.id + "] a").attr("data-progress", "1");
                        }, 1);
                    } else if (dataProgress === "1") {   //1代表收起状态
                        jsIframe.contentWindow.Mplayer.pause();
                        $(".upload-item[data-id=" + file.id + "] a").attr("data-progress", "2");
                    } else {   //代表暂停后播放
                        //若展开后需要播放，则放开注释
                        //jsIframe.contentWindow.Mplayer.togglePlay();
                        $(".upload-item[data-id=" + file.id + "] a").attr("data-progress", "1");
                    }
                }
                iframeDom.find(".module.active>.module-body").tinyscrollbar({ //内容区添加滚动条
                    thumbSize: 36
                });
                iframeDom.find(".module.active>.module-head").trigger('click');
            });

            //删除
            $(".content").on("click", ".upload-item[data-id=" + file.id + "] .operate a.delete-resource", function () {
                var $dom = $(this);
                 //兼容谷歌移走ocx
                var id = file.id;
                var currentIframeDom = jQuery("#" + file.id).contents();
                currentIframeDom.find("div[data-tab='ocxbody']").css('left','-9999px');

                var deleteDialog = new ConfirmDialog({
                    title: '提示信息',
                    warn: true,
                    top: "238.5px",
                    message: '<div class="dialog-messsage"><h4>您确定要删除该资源吗？</h4>',
                    callback: function () {
                        //判断是否有返回上传成功的id
                        if ($(".upload-item").attr("data-trueid") !== undefined && $(".upload-item").attr("data-trueid") !== "") {
                            var type = $(".content .upload-item").attr("data-type") + '';
                            var datajson = {
                                "fileType": type,
                                "id": $(".upload-item").attr("data-trueid").trim()
                            };
                            ajaxModel.postData('/service/pvd/delete_video_info/', datajson).then(function(res){
                                if (res.code === 200) {
                                    notify.success(res.data.message);
                                    //前端删除节点
                                    $dom.closest(".upload-item").remove();
                                    if ($("#" + file.id)) {
                                        $("#" + file.id).closest(".form-box").remove();
                                    }
                                }
                            })
                        } else {
                            notify.success("删除成功！");
                            //前端删除节点
                            $dom.closest(".upload-item").remove();
                            if ($("#" + file.id)) {
                                $("#" + file.id).closest(".form-box").remove();
                            }
                        }
                    },
                    prehide: function(){
                        currentIframeDom.find("div[data-tab='ocxbody']").css('left','0px');
                    }
                });
            });

            //查看资源
            $(".content").on("click", ".upload-item[data-id=" + file.id + "] .operate a.watchRecoure", function () {
                //图片
                var jsonData = Cookie.read("importincdata");
                var dataJson = JSON.parse(jsonData);
                var pagetype, incidentname, orgid;
                if (!parent.location.href.test('incident')) {
                    dataJson = '';
                };
                if (dataJson) {
                    pagetype = dataJson.pagetype;
                    incidentname = dataJson.incidentname;
                    orgid = dataJson.orgi;
                } else {
                    pagetype = 'workbench';
                }
                var id = $(this).closest(".upload-item").attr("data-trueid").trim();
                //需要新创建或者选择的案事件名称作为连接
                //若url没有传递pagetype及incidentname 则从 data-page，data-name中取跳转所需的内容
                //pagetype 若是从我的工作台过来的 就传workbench 若是从案事件信息库过来的，则传caselib
                if (incidentname === undefined) {
                    if ($(this).closest(".upload-item").attr("data-name")) {
                        orgid = "";
                        incidentname = $(this).closest(".upload-item").attr("data-name").trim();
                        if ($(this).closest(".upload-item").attr("data-type").trim() === "2") {
                            window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/"+"viewlibs/details/media/picture.html?id=" + id + "&fileType=2&pagetype=" + pagetype + "&incidentname=" + incidentname + "&orgid=" + orgid);
                        } else {
                            window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/"+"viewlibs/details/media/video.html?id=" + id + "&fileType=1&pagetype=" + pagetype + "&incidentname=" + incidentname + "&orgid=" + orgid);
                        }
                    } else {
                        orgid = "";
                        if ($(this).closest(".upload-item").attr("data-type").trim() === "2") {
                            window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/"+"viewlibs/details/media/picture.html?id=" + id + "&fileType=2&pagetype=" + pagetype + "&orgid=" + orgid);
                        } else { //视频
                            window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/"+"viewlibs/details/media/video.html?id=" + id + "&fileType=1&pagetype=" + pagetype + "&orgid=" + orgid);
                        }
                    }
                } else {
                    if ($(this).closest(".upload-item").attr("data-type").trim() === "2") {
                        window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/"+"viewlibs/details/media/picture.html?id=" + id + "&fileType=2&pagetype=" + pagetype + "&incidentname=" + incidentname + "&orgid=" + orgid);
                    } else { //视频
                        window.open("/module/iframe/?windowOpen=1&iframeUrl=/module/"+"viewlibs/details/media/video.html?id=" + id + "&fileType=1&pagetype=" + pagetype + "&incidentname=" + incidentname + "&orgid=" + orgid);
                    }
                }

            });
        });
    };

    //渲染模板
    var renderTemp = function (file) {
        var that = this;
        var $content = $(".small-title");
        if (options.template) {
            var template = Handlebars.compile(options.template)({
                "upload": file
            });
            $content.after(template);
            uploadStatuChange(file, "2");
        } else {
            jQuery.when(Toolkit.loadTempl(options.templurl)).done(function (tem) {
                options.template = tem;
                var template = Handlebars.compile(options.template)({
                    "upload": file
                });
                $content.after(template);
                uploadStatuChange(file, "2");
            });
        }
    };

    var writeEvent = function ($dom, file) {
        $dom.find('i').toggleClass('down up');
        $dom.closest(".upload-item").find('.status').toggleClass("unwrite writing");
        var statusClassName = $dom.find('i').prop("class");
        //展开iframe
        if (statusClassName === "down") {
            $dom.closest(".upload-item").find('.status').text('正在填写...');

            //显示iframe所在容器  因为默认iframe所在容器是隐藏的
            $dom.closest(".upload-item").next('.form-box').show();
            //设置资源类型

        } else { //收起iframe
            $dom.closest(".upload-item").find('.status').text('待填写信息');
            $dom.closest(".upload-item").next('.form-box').hide();
        }
    };

	var uploadStatuChange = function (file, status) {

		// if(window.navigator.userAgent.test('Chrome/30')) {
		// 	jQuery(".upload-progress").hide();
		// 	jQuery(".upload-progress").hide();
		// }
        var text;
        if (status === "1") {
            text = {
                importing: "导入失败",
                cancel: "取消导入"
            };
        } else {
            text = {
                importing: "导入中...",
                cancel: "取消导入",
                initing: "文件流化中"
            };
        }
        if (jQuery(".upload-item[data-id=" + file.id + "] .progress-value").text() !== "100%") {
            jQuery(".upload-item[data-id=" + file.id + "] .progress-value").text(Math.min(file.percent, 99) + '%');
            jQuery(".upload-item[data-id=" + file.id + "] .probar-bullet").width(file.percent + '%');
            jQuery(".upload-item[data-id=" + file.id + "] .importing").text(text.importing);
           //jQuery(".upload-item[data-id=" + file.id + "] .operate .cancel-import").text(text.cancel);
        }

        if (jQuery(".upload-item[data-id=" + file.id + "] .progress-value").html() == '100%') {
            jQuery(".upload-item[data-id=" + file.id + "] .progress-value").text("100%");
            return;
        }
        // if (file.percent === 100) {
        //     jQuery(".upload-item[data-id=" + file.id + "] .progress-value").text("99%");
        //     jQuery(".upload-item[data-id=" + file.id + "] .importing").text(text.initing);
        // }
    };

    var getFileFormat = function (filename) {
        var startIndex = filename.lastIndexOf('.') + 1;
        var endIndex = filename.length;
        var fileFormat = filename.substring(startIndex, endIndex);
        fileFormat = fileFormat.toLowerCase();
        return fileFormat;
    };

    var loadIframe = function (jsonFormat, file, id, type, path, fileType) {

            var that = this,
                type_file = "";
            if (type === "1") {
                type_file = "createVideo";

            } else {
                type_file = "createImage";

            }

            var iframe = createIframe(file.id, "/module/viewlibs/caselib/inc/tpl_" + type_file + ".html");
            $(".upload-item[data-id=" + file.id + "]").next(".form-box").append(iframe);

            if (iframe.attachEvent) {
                iframe.attachEvent("onload", function () {
                    loadedIframe(jsonFormat, file, id, type, path, fileType);
                });

            } else {
                iframe.onload = function () {
                    loadedIframe(jsonFormat, file, id, type, path, fileType);
                };
            }

        };

    var loadedIframe = function (jsonFormat, file, id, type, path, fileType) {
        var jsonData = Cookie.read("importincdata");
        var dataJson = JSON.parse(jsonData);
        var loadFileEventId;
        if (dataJson) {
            loadFileEventId = dataJson.id;
        }
        var iframeDom = jQuery("#" + file.id).contents(),
            iframeForm = iframeDom.find('form');
        //表单的data-id
        iframeForm.attr("data-id", id);
        iframeForm.attr("data-type", type);
        iframeDom.find(".resourid").val(jsonFormat.path);
        var imgEle = iframeDom.find(".entity-preview img");

        var that = this;
        var createIncident = false;
        var locationisInd = parent.location.href.test('incident');
        //关联案事件 (有cookie并且url也有incident)
        if (!locationisInd) {
            loadFileEventId = undefined;
            iframeDom.find('#lineToIncident').removeClass("disable");
        }
        if (type === "1") {
            videoGet(jsonFormat, file);
        } else {
            imageGet(jsonFormat, file, id, type, path, fileType, imgEle);
        }
        iframeDom.find('.input-submit').on("click", function () {
            //创建案事件
            var incidentCreate = iframeDom.find('#lineToIncident input:radio[name="createincident"]:checked').val();
            if (type === "2") {
                imageClickSave(iframeDom, loadFileEventId, file, incidentCreate, id);
            }
            if (type === "1") {
                videoClickSave(iframeDom, loadFileEventId, file, incidentCreate, id);
            }
        });

    };

    var videoGet = function (jsonFormat, file) {
        var self = this;
        var iframeDom = jQuery("#" + file.id).contents(),
            iframeForm = iframeDom.find('form');
        fileVideoNameFramet($("#" + file.id), getFileFormat(file.name));
        //填充表单宽高
        iframeForm.find("#width").val(jsonFormat.width?jsonFormat.width:1000);
        iframeForm.find("#height").val(jsonFormat.height?jsonFormat.height:1000);
    };

    var imageGet = function (jsonFormat, file, id, type, path, fileType, imgEle) {
        var self = this;
        var iframeDom = jQuery("#" + file.id).contents(),
            iframeForm = iframeDom.find('form');
        fileNameFramet($("#" + file.id), getFileFormat(file.name));
        //填充图片
        imgEle.attr("src", path);
        //设置图片宽高
        //that.loadImgValue(imgEle, imgEle.attr("src"));
        var img = new Image();
        // 改变图片的src
        img.src = path;
        var check = function () {
            if (img.width > 0 || img.height > 0) {
                iframeForm.find("#width").val(img.width);
                iframeForm.find("#height").val(img.height);
                clearInterval(set);
            }
        };
        var set = setInterval(check, 40);
    };

    var videoClickSave = function (iframeDom, loadFileEventId, file, incidentCreate, id) {
        //提交表单--视频
        var self = this;
        commonMethod.videoValid(iframeDom);
        if (iframeDom.find("#form").valid() && iframeDom.find("form .error").length === 0 && iframeDom.find(".notNull option:selected").val() !== "") {
            var jsIframe = document.getElementById(file.id);
            //给索略图截取
            // console.log(jsIframe.contentWindow)
            var thumbnailInfo = jsIframe.contentWindow.Mplayer.getThumbnailInfo();
            //console.log('www'+thumbnailInfo);
            var json = commonMethod.commitFormData(iframeDom.find('.fieldset').closest("form"), "pic", thumbnailInfo);
            json = json.replace(/[\r\n]/g, "");
            var p = iframeDom.find("#province").children("option:selected").val() !== "" ? iframeDom.find("#province").children("option:selected").text() : "";
            var c = iframeDom.find("#city").children("option:selected").val() !== "" ? iframeDom.find("#city").children("option:selected").text() : "";
            var a = iframeDom.find("#country").children("option:selected").val() !== "" ? iframeDom.find("#country").children("option:selected").text() : "";
            var s = iframeDom.find("#streets").attr('value') !== "" ? iframeDom.find("#streets").attr('value').trim() : "";
            s = s !== '请输入街道详细地址' ? s : "";
            var location = p + " " + c + " " + a + " " + s;
            var remark = setRemark.getText(iframeDom.find("#form"));
            if (loadFileEventId === undefined) {
                if (incidentCreate === "createIncident") {
                    //隐藏dom
                    var $dom = jQuery(".upload-item[data-id=" + file.id + "] .operate a.write-info")
                    $dom.find('i').toggleClass('down up');
                    //$dom.closest(".upload-item").find('.status').toggleClass("unwrite writing");
                    $dom.closest(".upload-item").find('.status').text('待填写信息');
                    $dom.closest(".upload-item").next('.form-box').hide();
                    //var domiframe = document.getElementById(file.id).contentWindow;
                   // var UIOCXDOM =domiframe.document.getElementById('UIOCX');
                   // UIOCXDOM.ShowOrHideOCX(false);
                    jQuery(".incident-panel-group").show();
                    jQuery("#incidentPanel").addClass("active");
                      //移出视频
                    /*iframeDom.find("div[data-tab='ocxbody']").css({
                        'left': '-9999px',
                        "position": "absolute"
                    });*/
                    IncidentMgr.init({
                        "mode": "create",
                        "uploadContainerId": "incidentPanel",
                        "callback": function (incidentid) {
                            loadFileEventId = incidentid;
                            //给当前上传的内容绑定 对应案事件的名称
                            jQuery("#" + id).attr("data-name", jQuery('#incident_name').val().trim());
                            json = json.substr(0, json.length - 1) + ',"location":"' + location + '","incidentId":"' + loadFileEventId + '","pic":"' + thumbnailInfo + '","remark":"' + remark + '"}';
                            jQuery(".incident-panel-group").hide();
                          //  UIOCXDOM.ShowOrHideOCX(true);
                            var dataType = $(".content .upload-item").attr("data-type");
                            var type = (parseInt(dataType, 10) === 2 ? '图片' : '视频'),
                                name = $(".content .upload-item .resource-name").attr("title").trim();
                            logDict.insertMedialog('m4', jQuery('#incident_name').val().trim() + "案事件导入" + name + type + '资源');
                            ajaxSaveLoad(json, file, id);
                        }
                    });
                } else if (incidentCreate === "existingIncident") {
                    //校验输入的案事件名称
                    if (iframeDom.find('#incidentname').attr('data-id') === '' || iframeDom.find('#incidentname').attr('data-id') === undefined) {
                        notify.warn("请输入案事件名称！");
                        return false;
                    } else {
                        loadFileEventId = iframeDom.find('#incidentname').attr('data-id');
                        //给当前上传的内容绑定 对应案事件的名称
                        jQuery("#" + id).attr("data-name", iframeDom.find('#incidentname').attr('data-name'));
                        json = json.substr(0, json.length - 1) + ',"location":"' + location + '","incidentId":"' + loadFileEventId + '","remark":"' + remark + '"}';
                        var dataType = $(".content .upload-item").attr("data-type");
                        var type = (parseInt(dataType, 10) === 2 ? '图片' : '视频'),
                            name = $(".content .upload-item .resource-name").attr("title").trim();
                        logDict.insertMedialog('m4', iframeDom.find('#incidentname').attr('data-name') + "案事件导入" + name + type + '资源');
                        ajaxSaveLoad(json, file, id);
                    }
                }
                else {
                    json = json.substr(0, json.length - 1) + ',"location":"' + location + '","pic":"' + thumbnailInfo + '","remark":"' + remark + '"}';
                    ajaxSaveLoad(json, file, id);
                }
            }
            else {
                json = json.substr(0, json.length - 1) + ',"location":"' + location + '","incidentId":"' + loadFileEventId + '","pic":"' + thumbnailInfo + '","remark":"' + remark + '"}';
                ajaxSaveLoad(json, file, id);
            }
        } else {
            notify.warn("请填写正确信息！");
            iframeDom.find("#form .module .module-head").eq(0).trigger("click");
            return;
        }
    };

    var imageClickSave = function (iframeDom, loadFileEventId, file, incidentCreate, id) {
        var self = this;
        //提交表单--图片
        commonMethod.imageValid(iframeDom);
        if (iframeDom.find("#imageForm").valid() && iframeDom.find("form .error").length === 0 && iframeDom.find(".notNull option:selected").val() !== "") {
            var json = commonMethod.commitFormData(iframeDom.find("#imageForm"));
            json = json.replace(/[\r\n]/g, "");
            var p = iframeDom.find("#province").children("option:selected").val() !== "" ? iframeDom.find("#province").children("option:selected").text() : "";
            var c = iframeDom.find("#city").children("option:selected").val() !== "" ? iframeDom.find("#city").children("option:selected").text() : "";
            var a = iframeDom.find("#country").children("option:selected").val() !== "" ? iframeDom.find("#country").children("option:selected").text() : "";
            var s = iframeDom.find("#streets").val() !== "" ? iframeDom.find("#streets").val().trim() : "";
            s = s !== '请输入街道详细地址' ? s : "";
            var location = p + " " + c + " " + a + " " + s;
            var remark = setRemark.getText(iframeDom.find("#imageForm"));
            if (loadFileEventId === undefined) {
                if (incidentCreate === "createIncident") {
                     //隐藏dom
                    var $dom = jQuery(".upload-item[data-id=" + file.id + "] .operate a.write-info")
                    $dom.find('i').toggleClass('down up');
                    //$dom.closest(".upload-item").find('.status').toggleClass("unwrite writing");
                    $dom.closest(".upload-item").find('.status').text('待填写信息');
                    $dom.closest(".upload-item").next('.form-box').hide();
                    jQuery(".incident-panel-group").show();
                    jQuery("#incidentPanel").addClass("active");
                    IncidentMgr.init({
                        "mode": "create",
                        "uploadContainerId": "incidentPanel",
                        "callback": function (incidentid) {
                            jQuery(".incident-panel-group").hide();
                            loadFileEventId = incidentid;
                            //给当前上传的内容绑定 对应案事件的名称
                            var dataName = jQuery('#incident_name').val().trim();
                            jQuery("#" + id).attr("data-name", dataName);
                            json = json.substr(0, json.length - 1) + ',"location":"' + location + '","incidentId":"' + loadFileEventId + '","remark":"' + remark + '"}';
                            jQuery(".incident-panel-group").hide();
                            var dataType = $(".content .upload-item").attr("data-type");
                            var type = (parseInt(dataType, 10) === 2 ? '图片' : '视频'),
                                name = $(".content .upload-item .resource-name").attr("title").trim();
                            logDict.insertMedialog('m4', jQuery('#incident_name').val().trim() + "案事件导入" + name + type + '资源');
                            ajaxSaveLoad(json, file, id);
                        }
                    });
                } else if (incidentCreate === "existingIncident") {
                    //校验输入的案事件名称
                    if (iframeDom.find('#incidentname').attr('data-id') === undefined) {
                        notify.warn("请输入案事件名称！");
                        return false;
                    } else {
                        loadFileEventId = iframeDom.find('#incidentname').attr('data-id');
                        //给当前上传的内容绑定 对应案事件的名称
                        jQuery("#" + id).attr("data-name", iframeDom.find('#incidentname').attr('data-name'));
                        json = json.substr(0, json.length - 1) + ',"location":"' + location + '","incidentId":"' + loadFileEventId + '","remark":"' + remark + '"}';
                        var dataType = $(".content .upload-item").attr("data-type");
                        var type = (parseInt(dataType, 10) === 2 ? '图片' : '视频'),
                            name = $(".content .upload-item .resource-name").attr("title").trim();
                        logDict.insertMedialog('m4', iframeDom.find('#incidentname').attr('data-name') + "案事件导入" + name + type + '资源');
                        ajaxSaveLoad(json, file, id);
                    }
                } else {
                    json = json.substr(0, json.length - 1) + ',"location":"' + location + '","remark":"' + remark + '"}';
                    ajaxSaveLoad(json, file, id);
                }
            }
            else {
                json = json.substr(0, json.length - 1) + ',"location":"' + location + '","incidentId":"' + loadFileEventId + '","remark":"' + remark + '"}';
                ajaxSaveLoad(json, file, id);
            }
        } else {
            notify.warn("请填写正确信息！");
            iframeDom.find("#imageForm .module .module-head").eq(0).trigger("click");
            return;
        }
    };

    var ajaxSaveLoad = function (json, file, id) {
        var self = this;
        ajaxModel.postData('/service/pvd/save_video_info', {
            "resoureList": json
        }).then(function(res){
            if (res.code === 200) {
                notify.success(res.data.message);
                var jsonObj = JSON.parse(json);
                jQuery("#" + id).next(".form-box").css("display", "none");
                var trueid = res.data.id;
                jQuery("#" + id).attr("data-trueid", trueid);
                commitFormStatus(file, trueid);
            } else if (res.code === 500) {
                notify.warn("服务器报错！");
                return;
            } else {
                notify.warn("服务器异常！");
                return;
            }
        });
    };

    var fileNameFramet = function ($dom, fileFormat) {
        if (_.has(conf.fileNameObj, fileFormat)) {
            setContent($dom, conf.fileNameObj[fileFormat])
        } else {
            setContent($dom, '15');
        }
    };

    var fileVideoNameFramet = function ($dom, fileFormat) {
        if (_.has(conf.fileVideoObj, fileFormat)) {
            setContent($dom, conf.fileVideoObj[fileFormat])
        } else {
            setContent($dom, '99');
        }
    };

    var loadImgValue = function ($dom, url) {
        var img_url = url,

            img_width = "",

            img_height = "",

        //创建对象
            img = new Image();

        img.src = img_url;

        //判断是否有缓存
        if (img.complete) {
            img_width = img.width;
            img_height = img.height;
        } else {
            img.onload = function () {
                img_width = img.width;
                img_height = img.height;
            };
        }
        return {
            "imgwidth": img_width,
            "imgheight": img_height
        };
    };

    //表单填写完成改变状态
    var completeStatus = function (file) {
        $(".upload-item[data-id=" + file.id + "] .progress-value").text('100%');
        $(".upload-item[data-id=" + file.id + "] .importing").removeClass("importing").addClass("unwrite").text("待填写信息");
        $(".upload-item[data-id=" + file.id + "] .operate").html("<a class='input-gray write-info' data-progress='0'>填写信息 <i class='up'></i></a><a class='delete-resource'>删除</a>");
        $(".upload-item[data-id=" + file.id + "]").after("<div class='form-box'>" + "<div class='deck'><i class='before-line'></i><i class='hook'></i>" + "<i class='after-line'></i></div></div>");
    };

    //表单提交完成改变状态
    var commitFormStatus = function (file, trueid) {
        $(".upload-item[data-id=" + file.id + "] .progress-value").text('100%');
        $(".upload-item[data-id=" + file.id + "] .status").text("完成");
        $(".upload-item[data-id=" + file.id + "] .operate").html("<a class='input-gray watchRecoure'>查看</a><a class='delete-resource'>删除</a>");
        $(".upload-item[data-id=" + file.id + "]").next().remove();
        //记录日志
        var dataType = $(".upload-item[data-id=" + file.id + "]").attr("data-type");
        var name = $(".upload-item[data-id=" + file.id + "] .resource-name").attr("title").trim();
        var type = (parseInt(dataType, 10) === 2 ? '图片' : '视频');
        var msg = "导入" + name + type + "文件";
        logDict.insertMedialog('m4', msg);
    };

    //创建iframe
    var createIframe = function (fileId, path) {
        var iframe = document.createElement("iframe");
        iframe.id = fileId;
        iframe.width = "100%";
        iframe.scrolling = "no";
        iframe.height = "550";
        iframe.border = "0";
        iframe.frameBorder = "0";
        iframe.src = path;
        return iframe;
    };

    var init = function (Options) {
        _.extend(options, Options);
        bindEvent();
    };

    return{
        init: init,
        loadImgValue : loadImgValue
    }
})

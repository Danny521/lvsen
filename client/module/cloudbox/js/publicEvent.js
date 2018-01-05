/**
 *
 * @authors lrxia (lrxia@netposa.com)
 * @date    2015/6/17
 * @version $
 */
define(['js/param-parse.js','js/ajax-module.js','js/cloud-view.js','js/cloud-module-skip.js'],function(PARSE_TOOL,AJAXMODULE,VIEW,MODULESKIP){
    var publicEvent = {
        eventBindInit:function(){
            var _t =this;
            jQuery(document).on('click', 'a.download, .down-load',_t.downLoadClick);
            jQuery(document).on('click','a.save-to-viewlibs',_t.storageClick);
            jQuery(document).on('click','#videoScreentoMediaLib',_t.storageClick);
            jQuery(document).on('mouseup', 'a.delete ,  a.del',_t.deleteMouseUp);
            /*抓图后入库*/
            /* 抓图后保存*/
            jQuery(document).on('click','#saveScreenshot',_t.saveScreenshotClick);
            /*关闭抓图图框*/
            jQuery(document).on('click','a.close',_t.closeLayerClick)
        },
        downLoadClick:function(){
            publicEvent.downloadFile();
        },
        storageClick:function(e){
            var e = e || window.event,
                tar = e.target || e.srcElement;
            if(jQuery(this).attr('data-action')=='medialib'){
                // 暂时的 解决bug#46794
                jQuery(".bg-close").trigger("click");

                MODULESKIP.medialib();
            }else if(jQuery(this).attr('data-action')=='toMediaLib'){
                MODULESKIP.toMediaLib();
            }
            return false
        },
        deleteMouseUp:function(e){
            e.preventDefault();
            e.stopImmediatePropagation();
            var $this = jQuery(this),
                type = SCOPE.context.fileType - 0,
                structuredType = SCOPE.context.structuredType - 0,
                callback = function() {
                    /*删除成功,执行dom上的动作*/
                    if ($this.parents(".content-controll-bar").length !== 0) {
                        jQuery(".bg-close").trigger("click");
                        // 删除完成后让哪个列表出来的问题 by songxj
                        var $sidebar = jQuery('ul.r-siderbar'),
                            $leftMenuItems = $sidebar.find("li.r-li-item"),
                            isSelectedStructMenuFlag = false, // 是否选中结构化子菜单
                            $structInfoMenuList = $sidebar.find('li[data-cat=' + type + ']').find('.s-menu').find('a.li-inner-item');

                        // 左侧列表看当前选中的是哪个，删除完成后依然回到那个
                        $leftMenuItems.each(function() {
                            if (jQuery(this).find("h6").hasClass("current")) {
                                // 如果当前选中的是“结构化信息/线索”
                                if (jQuery(this).attr("data-cat") === "3") {
                                    $structInfoMenuList.each(function() {
                                        if (jQuery(this).hasClass("current")) {
                                            isSelectedStructMenuFlag = true;
                                        }
                                    });

                                    // 是否让结构化信息子菜单选中
                                    if (!isSelectedStructMenuFlag) {
                                        jQuery('div.sidebar').find('li[data-cat=' + type + ']').trigger('click');
                                    } else {
                                        jQuery('div.sidebar').find('li[data-cat=' + type + ']').find('.s-menu').find('a.li-inner-item[data-type=' + structuredType + ']').trigger('click');
                                    }
                                } else {
                                    jQuery(this).trigger("click");
                                }
                                return false;
                            }
                        });

                    } else {
                        $this.closest("dd").fadeOut("slow", function() {
                            $this.remove();
                        });
                    }
                    //更新总数
                    var total = jQuery("#total b").html();
                    jQuery("#total b").html(parseInt(total)-1);
                };
            publicEvent.delDialog(callback);
        },
        saveScreenshotClick:function(){
            MODULESKIP.saveScreensPic()
        },
        closeLayerClick:function(){
            if(jQuery(this).attr('data-action')!='closeLayer')return;
            jQuery("#layerbox,.dialogbox").hide();
        },
        downloadDialog: function(url, callback) {
            var insertDom = jQuery('<iframe id="forDownload" src=' + url + '></iframe>');
            if (jQuery('#forDownload').length < 1) {
                jQuery('body').append(insertDom);
            } else {
                jQuery('#forDownload').attr("src", url);
            }
        },
        downloadFile: function() {
            /*获取self.download*/
            PARSE_TOOL.paramFdownload();
            var self = this,
                url = "/service/pcm/" + SCOPE.download,
                checkUrl = "/service/pcm/check_file_exist/"+SCOPE.context.pvdId;
            if(SCOPE.context.pvdId){
                AJAXMODULE.checkFileExist(checkUrl,SCOPE.context.pvdId,SCOPE.context.fileType,SCOPE.context.structuredType).then(function(res){
                    if(res && res.code === 200){
                        if(res.data===true){
                            SCOPE.download === 'get_dir' ? url += "/" : url += "?id=";
                            /*生成下载路径*/
                            url += SCOPE.context.id;
                            /*弹出下载框*/
                            self.downloadDialog(url);
                            /*记录日志*/
                            logDict.insertMedialog('m6', '下载 ' + VIEW.getTname(true)); // 查看 日志
                        }else{
                            new ConfirmDialog({
                                classes: 'struct',
                                title: '提示',
                                message: "<div class='dialog-messsage'><h4>该资源已经不存在，是否删除此记录</h4>",
                                callback: function() {
                                    var type1,directorIds,type2,viewIds,type3,structureIds;
                                    if (SCOPE.context.fileType === "0") {
                                        type1 = 0;
                                        directorIds = SCOPE.context.id;
                                        type2 = 1;
                                        viewIds = "";
                                        type3 = 2;
                                        structureIds = "";
                                    } else if (SCOPE.context.fileType === "1" || SCOPE.context.fileType === "2") {
                                        type1 = 0;
                                        directorIds = "";
                                        type2 = 1;
                                        viewIds = SCOPE.context.id;
                                        type3 = 2;
                                        structureIds = "";
                                    } else if (SCOPE.context.fileType === "3") {
                                        type1 = 0;
                                        directorIds = "";
                                        type2 = 1;
                                        viewIds = "";
                                        type3 = 2;
                                        structureIds = SCOPE.context.id;
                                    }
                                    AJAXMODULE.postData("/service/pcm/delete_all_files", {
                                        type1: type1,
                                        directorIds: directorIds,
                                        type2: type2,
                                        viewIds: viewIds,
                                        type3: type3,
                                        structureIds: structureIds
                                    }).then(function(res) {
                                        if (res && res.code === 200) {
                                            notify.info("删除成功!");
                                            jQuery('.sidebar').find("li[data-cat=" + SCOPE.wideType + "]").trigger('click');
                                        } else {
                                            notify.info("删除失败!");
                                        }
                                    });
                                }
                            });
                        }
                    }else{
                        notify.error(res.data);
                    }
                });
            }else{
                SCOPE.download === 'get_dir' ? url += "/" : url += "?id=";
                /*生成下载路径*/
                url += SCOPE.context.id;
                /*弹出下载框*/
                self.downloadDialog(url);
                /*记录日志*/
                logDict.insertMedialog('m6', '下载 ' + VIEW.getTname(true)); // 查看 日志
            }
        },
        delDialog: function(callback) {
            var msg = PARSE_TOOL.paramFdel(),
                type = SCOPE.context.fileType - 0,
                pvd = SCOPE.context.pvdId,
                ajaxDel;
            if (pvd && type !== 0) {
                ajaxDel = function() {
                    return AJAXMODULE.postData('/service/pcm/' + SCOPE.del + "/" + SCOPE.context.id + "?fileType=" + SCOPE.context.fileType);
                };
            } else {
                ajaxDel = function() {
                    return AJAXMODULE.postData('/service/pcm/' + SCOPE.del, {
                        ids: SCOPE.context.id
                    });
                };
            }
            VIEW.dialog(msg, function() {
                ajaxDel().done(function(data) {
                    if (data && data.code === 200) {
                        notify.info('删除成功!');
                        callback && callback();
                        logDict.insertMedialog('m6', '删除 ' + VIEW.getTname(true),'','o3'); // 删除 日志
                    }
                }).fail(function(data) {
                    notify.info('删除失败，请重试!');
                });
            });
        }
    };
    return publicEvent;
});

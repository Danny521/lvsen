define([
    'js/resourceTree',
    '/module/common/resource-import/resource_import.js',
    'pubsub',
    'js/gImage'
], function(ResourceTree, resourceImportPanel, PubSub, gImage) {
    // 资源导入工具
    importTool = {};
    if (parent.window.opener && (parent.window.name.substring(0, 16) === "singlePicProcess" || parent.window.name.substring(0, 13) === "singleAnalyze") && Cookie.read('imagejudgeData')) {
        if (!Cookie.read('imagejudgeData')) {
            parent.window.opener = null;
            window.location.href = "/imagejudge/image.html?type=1";
        }

        window.pEntity = JSON.parse(Cookie.read('imagejudgeData'));
        if (window.pEntity) {
            if (window.pEntity.cloud && window.pEntity.cloud === "cloud") {
                window.judgeid = window.pEntity.id; //图像研判中,此图片的id
            } else {
                jQuery.ajax({
                    url: '/service/pia/save_file',
                    type: 'post',
                    dataType: 'json',
                    async: false,
                    data: {
                        fileName: window.pEntity.fileName,
                        fileSize: '',
                        fileFormat: '',
                        thumbnail: window.pEntity.fileType == 1 ? null : window.pEntity.filePath,
                        filePath: window.pEntity.filePath,
                        localPath: window.pEntity.localPath,
                        fileType: window.pEntity.fileType,
                        shootTime: window.pEntity.shootTime,
                        timeLag: '',
                        width: '',
                        height: '',
                        originImageId: '',
                        pid: window.pEntity.pid
                    },
                    success: function(res) {
                        window.judgeid = res.data.id; //图像研判中,此图片的id
                    }
                });
            }
        }

        Cookie.dispose("imagejudgeData");

    } else if (parent.window.opener && parent.window.opener && window.name === "singleVioProcess") {
        if (!Cookie.read("videojudgeData")) {
            parent.window.opener = null;
            window.loaction.href = "/imagejudge/image.html?type=2";
        }
    }

    if (jQuery("#resourceTree").length !== 0) {
        importTool.resourceTree = new ResourceTree({
            "node": "#resourceTreePanel",
            "scrollbarNode": "#resourceTree",
            "treeClick": function(spanEl) {
                gImage.setFileType(spanEl.closest("li").attr('data-filetype'));
            },
            "leafClick": function(spanEl) {
                var liEl = spanEl.closest("li");
                // 判断资源是否存在
                var isProcess;
                jQuery.ajax({
                    url: "/service/pia/resourceIsProcess",
                    data: {
                        id: liEl.attr("data-id")
                    },
                    type: "get",
                    async: false,
                    cache: false,
                    dataType: "json",
                    success: function(res) {
                        if (res && res.code === 200) {
                            isProcess = res.data.isProcess;
                        } else {
                            notify.error("获取资源状态失败!");
                            return;
                        }
                        window.triggerMenuFunc();
                            //0：可以处理 1：资源删除，不可处理 2：该资源已审核通过、请在视图库中取回后进行处理!
                        if (isProcess !== 0) {
                            var msg = "";
                            if (isProcess === 1) {
                                msg = "该资源已经被删除!是否需要重新加载资源列表?"
                            }
                            if (isProcess === 2) {
                                msg = "该资源已审核通过,请在视图库中取回后进行处理";
                            }
                            new ConfirmDialog({
                                title: '提示',
                                message: msg,
                                callback: function() {
                                    if (isProcess === 1) {
                                        importTool.resourceTree.storeData = importTool.resourceTree.prevSelectNodeId;
                                        importTool.resourceTree.reload();
                                    }
                                }
                            });
                        } else {
                            var curActive = jQuery(parent.document).find("#header .wrapper .nav a.active").data("id");
                            var urlParams = Toolkit.paramOfUrl(),
                                type = ("type" in urlParams) ? parseInt(urlParams["type"]) : null;

                            // 选择的文件为视频
                            if (liEl.attr("data-filetype") === "1" && curActive === 7) {
                                // 当二级导航没有 视图分析 点击视频后 提示用户无法操作
                                if (jQuery(parent.document).find('#header .nav>a[data-id=8]').size() == 0) {
                                    notify.warn("无法处理视频! 没有视图分析权限", {
                                        timeout: 1000
                                    });
                                    return;
                                }
                                // 选中视图分析
                                jQuery(parent.document).find('#header .nav>a[data-id=8]').trigger("click");
                            }
                            // 选择的文件为图片
                            else {
                                // 判断type的值 是否与二级导航选中状态相符
                                // 如果不符合 取二级导航映射的 type值
                                // type == 1 : 图像处理
                                // type == 2 : 视图分析
                                // curActive == 7 : 图像处理
                                // curActive == 8 : 视图分析
                                // var typeDataId = (type == 1 ? 7 : 8);
                                // if (typeDataId != curActive) {
                                //     type = (curActive == 7 ? 1 : 2);
                                // }
                                if (liEl.attr("data-filetype") === "1") {
                                    if(type == "1"){
                                        type = 2;
                                    }
                                    jQuery(parent.document).find('#header .nav>a[data-id=8]').addClass('active').siblings().removeClass('active');
                                } else if (liEl.attr("data-filetype") === "2") {
                                    //视图库图片人工标注 by  zhangxinyu on 2015-10-16
                                    if (curActive === 8) {
                                        type = 2;
                                        jQuery(parent.document).find('#header .nav>a[data-id=8]').addClass('active').siblings().removeClass('active');
                                    } else {
                                        type = 1;
                                        jQuery(parent.document).find('#header .nav>a[data-id=7]').addClass('active').siblings().removeClass('active');
                                    }
                                }

                                // 如果type存在说明从视图库跳转过来后点击的图片
                                if (type) {
                                    // 进入图像处理
                                    if (type == "1") {
                                        jQuery(parent.document).find('#header .nav>a[data-id=7]').trigger("click");
                                    }
                                    // 进入视图分析 人工标注
                                    if (type == "2") {
                                        jQuery(parent.document).find('#header .nav>a[data-id=8]').trigger("click");
                                    }
                                    // 进入试图分析 智能标注
                                    if (type == "3") {
                                        jQuery(parent.document).find('#header .nav>a[data-id=8]').trigger("click");
                                        jQuery("#smartDimension").trigger("click");
                                    }
                                }
                                // 如果type不存在说明直接点击的图片
                                else {
                                    // 当二级导航为 图像处理
                                    if (jQuery(parent.document).find('#header .nav>a[data-id=7]').hasClass("active")) {
                                        jQuery(parent.document).find('#header .nav>a[data-id=7]').trigger("click");
                                    }
                                    // 当二级导航为 视图分析
                                    if (jQuery(parent.document).find('#header .nav>a[data-id=8]').hasClass("active")) {
                                        jQuery(parent.document).find('#header .nav>a[data-id=8]').trigger("click");
                                    }
                                }
                            }
                        }
                    },
                    error: function(xhr, textStatus, errorThrown) {
                        // 如果http状态为200，说明后台返回数据成功，但数据格式错误
                        if (xhr.status === 200) {
                            notify.warn('获取资源状态失败! 数据格式错误');
                        }
                        // 其它状态为HTTP错误状态
                        else {
                            (xhr.status !== 0) && notify.warn('获取资源状态失败! HTTP状态码: ' + xhr.status);
                        }
                    }
                });
            },
            "delResoure": function(param, el) {
                var msg = "确定要删除该文件吗？"
                    //                if (param.type === 1) {
                    //                    msg = "确定要删除该文件夹下的所有资源吗";
                    //                }

                new ConfirmDialog({
                    title: '删除',
                    message: msg,
                    callback: function() {
                        jQuery.ajax({
                            url: "/service/pia/remove_view",
                            type: "post",
                            data: param,
                            dataType: 'json',
                            success: function(res) {
                                if (res.code === 200) {
                                    var activeRsLi = jQuery("#resourceTreePanel ul li.active"),
                                        // 被删除元素的data-id
                                        elDataId = null;
                                    // 选中元素的data-id
                                    activeRsLiDataId = null;
                                    if (activeRsLi.size() > 0) {
                                        var elDataId = el.attr("data-id");
                                        var activeRsLiDataId = activeRsLi.attr("data-id");
                                    }

                                    // 删除li元素
                                    el.remove();
                                    importTool.resourceTree.updateScrollBar();

                                    // 如果二级导航选中的是 图像处理 或 视图分析
                                    // 且被删除的文件 是 当前选中的文件
                                    // 如果列表还有数据 选中第一条
                                    var secondNavActiveLi = jQuery('#header .nav>a[data-id=7].active,a[data-id=8].active');
                                    if (secondNavActiveLi.size() > 0 && elDataId != null && activeRsLiDataId != null && elDataId == activeRsLiDataId) {

                                        var list = jQuery("#resourceTreePanel ul li");
                                        if (list.size() > 0) {
                                            list.first().addClass("active").trigger("click");
                                        }
                                    }

                                    // 如果列表被删干净 重新刷下页面 因为图片操作的dom已被污染
                                    if (jQuery("#resourceTreePanel ul li").size() === 0) {
                                        window.location.reload();
                                    }
                                } else {
                                    notify.warn("删除失败！");
                                }
                            }
                        });
                    }
                });

            }
        });

        // 监听树加载
        PubSub.subscribe("treeLoaded", function(msg, id) {
            // 如果有跳转的数据，点击匹配到的节点
            if (window.pEntity) {
                jQuery("#resourceTreePanel ul li[data-id=" + window.judgeid + "]").trigger("click");
                window.pEntity = null;
            }
            // 选中刷新列表前 已选中的节点
            if (id != null || id != undefined || id === -1) {
                jQuery("#resourceTreePanel ul li[data-id=" + id + "]").addClass("active");
            }
        });

    }

    // 资源导入
    jQuery("#importRs").on("click", function(e) {
        if (navigator.userAgent.indexOf("MSIE") != -1 && !i_Flash) {
            jQuery(document).on("click", ".plugin-download-panel .downloadFlash", function() {
                window.open("/media/plugin/install_flash_player_11_active_x-11.9.900.117.exe", "downloadFrame");
            });
            var showDialog = function() {
                var msg = '<div class="plugin-download-panel"><i class="download-warn"></i><div class="section1"><table><tr><td>下载内容：' + 'flash' + '</td></tr></table></div><div class="section2"><a class="ui button blue downloadFlash">下载flash</a><a class="downloadPlugins" target="_blank">下载其他插件</a><!--<label for="do-not-remind" class="do-not-remind"><input type="checkbox" id="do-not-remind">不再提醒</label>--><iframe name="downloadFrame" style="height:0;width:0"></iframe></div></div>';
                new AlertDialog({
                    showFooter: false,
                    width: 447,
                    message: msg,
                    close: false,
                    title: '插件更新'
                });
            };
            showDialog();
        } else {
            e.preventDefault();
            resourceImportPanel.open();
        }

    });

    //资源清空
    jQuery("#removeAllResource").on('click', function() {
        var dataStr = '';
        if ($("#resourceTreePanel li.leaf").length === 0) {
            notify.info("当前列表暂无资源！");
            return;
        }
        new ConfirmDialog({
            title: '清空资源',
            message: "是否清空资源列表？",
            callback: function() {
                jQuery.each($("#resourceTreePanel li.leaf"), function(index, item) {
                    dataStr += ((jQuery(item).attr("data-cid") || jQuery(item).attr("data-pid")) + ',');
                })
                dataStr = dataStr.substring(0, dataStr.length - 1);
                $.ajax({
                    type: 'post',
                    data: {
                        "ids": dataStr
                    },
                    url: '/service/pia/remove_view',
                    dataType: 'json',
                    success: function(data) {
                        if (data.code === 200) {
                            notify.info("清空资源成功！");
                            importTool.resourceTree.reload();
                        } else {
                            notify.info("清空资源接口" + data.code + "!");
                        }
                    },
                    error: function() {
                        notify.info("清空资源失败！");
                    }
                })
            }
        });

    });
    var resourceTree = function(type) {
            /* 实现 导航 图像处理 视图分析 对应 联动*/
            var item = jQuery('#header').off('click', 'a.item');
            if (type === "1") {
                type = "vedio";
                item.find("a[data-id=8]").trigger('click')
            } else if (type === "2") {
                type = "image";
                item.find("a[data-id=7]").trigger('click')
            } else {
                type = "";
            }
            importTool.resourceTree.search(type);
        }
        // 文件筛选  [0:全部  1:视频  2:图片]
    jQuery(".resource_title .allFile").addClass("active");
    jQuery(".resource_title .allFile").click(function() {
        var type = jQuery(this).attr("data-type");
        jQuery(this).addClass("active");
        jQuery(".resource_title .videoFile").removeClass("active");
        jQuery(".resource_title .imageFile").removeClass("active");
        resourceTree(type);
    })

    jQuery(".resource_title .videoFile").click(function() {
        var type = jQuery(this).attr("data-type");
        jQuery(".resource_title .videoFile").addClass("active");
        jQuery(".resource_title .imageFile").removeClass("active");
        jQuery(".resource_title .allFile").removeClass("active");
        resourceTree(type);

    })

    jQuery(".resource_title .imageFile").click(function() {
        jQuery(".resource_title .videoFile").removeClass("active");
        jQuery(".resource_title .imageFile").addClass("active");
        jQuery(".resource_title .allFile").removeClass("active");
        var type = jQuery(this).attr("data-type");
        resourceTree(type);
    })

    window.triggerMenuFunc = function() {
        jQuery(parent.document).find('#header').find(".nav>a[data-id=7],a[data-id=8]").off("click").on("click", function(e) {
            var changeMenu = function() {
                var type = Toolkit.paramOfUrl().type,
                    menu = jQuery('.imageprocess ');
                if (type === "1") {
                    menu.eq(0).addClass('active').siblings().removeClass('active');
                } else {
                    menu.eq(1).addClass('active').siblings().removeClass('active');
                }
                menu.on('click', function() {
                    if (jQuery("#resourceTreePanel ul li.active").attr("data-filetype") !== "1") {
                        jQuery(this).addClass('active').siblings().removeClass('active');
                    }
                });
            };

            e.preventDefault();

            var dataId = $(this).data("id");
            // 如果二级导航选择的是 视图分析 且 文件为视频 跳转到图像处理（左侧视频文件去除选中状态且选中离最上面的图片文件）
            if (dataId == 7 && jQuery("#resourceTreePanel ul li.active").attr("data-filetype") == "1") {
                jQuery("#resourceTreePanel ul li.active").removeClass('active');
                $("#main_right_image").removeClass("hidden");
                $("#main_right_video").addClass("hidden");
                jQuery("#resourceTreePanel ul li[data-filetype='2']").eq(0).trigger('click');
            }

            // 显示图像处理内容 ，隐藏视图分析内容
            if (dataId == 7) {
                $("#main_right_image").removeClass("hidden");
                $("#main_right_video").addClass("hidden");
                // 在图像处理中显示当前选中的图片
                //PubSub.publish('public_setImage')
                gImage.setImage();
                //判断是否是门户网站链接，如果是，则需要跳转至对应的模块, 传递默认加载函数
                window.PortalLinks(function() {
                    //默认高级处理
                    // $('#main_right_image .nav-gj').trigger('click');
                });
            }
            // 显示视图分析内容，隐藏图像处理内容
            if (dataId == 8) {
                $("#main_right_image").addClass("hidden");
                $("#main_right_video").removeClass("hidden");
                //在视频分析中显示当前选中的图片
                videoAnaly.leafClick();
                changeMenu();
                //判断是否是门户网站链接，如果是，则需要跳转至对应的模块, 传递默认加载函数
                window.PortalLinks(function() {
                    //默认智能标注
                    // $('#smartDimension a').trigger('click');
                });
            }

            // 高亮导航项
            $(this).addClass("active").siblings("a").removeClass("active");

        })
    }
})
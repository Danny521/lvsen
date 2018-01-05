define([
    'js/video',
    'js/gImage',
    '/module/common/resource-import/resource_import.js',
    'jquery-ui',
    'base.self',
    'js/jquery.colors'
], function(videoAnalyst, gImage, resourceImportPanel) {
    $("a.quick_nav").click(function() {
        if ($(this).attr("title") == '点击收缩') {
            $(".main_left").css("width", "0");
            $(".main_right").css("left", "0");
            $(this).attr("title", '点击展开');
            $(this).addClass("quick_nav_current");
        } else if ($(this).attr("title") == '点击展开') {
            $(".main_left").css("width", "280px");
            $(".main_right").css("left", "280px");
            $(this).attr("title", '点击收缩');
            $(this).removeClass("quick_nav_current");
        }

        $(window).resize();

    });


    // 文件类型选择
    $(".select_type").hover(function() {
        $(this).children("ul").stop(true, false).slideDown(50);
    }, function() {
        $(this).children("ul").stop(true, false).slideUp(50);
    });
    $(".resource_title ul li").click(function() {
        var iconClass = $(this).children("i").attr("class");
        var text = $(this).children("p").text();
        $(".resource_title em i").attr("class", iconClass);
        $(".resource_title em h6").html(text);
        $(this).parent("ul").slideUp(50);
    });

    // 资源列列表的关闭按钮
    $(".resource_list li").hover(function() {
        $(this).children("a").show();
    }, function() {
        $(this).children("a").hide();
    });

    $(".resource_pic dl").hover(function() {
        $(this).children("a").show();
    }, function() {
        $(this).children("a").hide();
    });

    $(".draw_tools span").hover(function() {
        $(this).children("ul").show();
    }, function() {
        $(this).children("ul").hide();
    });

    $(".draw_tools span ul li").click(function() {
        $(this).addClass("current").siblings("li").removeClass("current");
        $(this).parent("ul").hide();
    });

    $(".video_edit dd span:gt(0)").hide();
    $(".video_edit .video-block .panel span").show(1);
    $(".video_edit dt a").click(function() {
        $(this).addClass("current").siblings("a").removeClass("current");
        var tab_index = $(".video_edit dt a").index(this);
        $(".video_edit dd span").eq(tab_index).show().siblings("span").hide();
    });

    // 目标排查--检索记录 切换
    $(".target_select").hover(function() {
        $(this).children("ul").show();
    }, function() {
        $(this).children("ul").hide();
    });
    $(".target_select ul li").click(function() {
        var curText = $(this).text();
        $(".target_select em b").text(curText);
        $(this).parent("ul").hide();

        var tab_index = $(".target_select ul li").index(this);
        if (tab_index == 1) {
            $(".target_title a").show();
        } else {
            $(".target_title a").hide();
        }
        $(".target_cont div").eq(tab_index).show().siblings("div").hide();

    });

    // 目标排查--列表显示效果
    $(".retrieve_cont dl dd:gt(0)").hide();
    $(".history_cont dl dd:gt(0)").hide();
    $(".retrieve_list dt").click(function() {
        $(this).parent("dl").siblings("dl").children("dd").slideUp();
        $(".retrieve_list dt i").removeClass("icon_uparrow");
        $(this).next("dd").slideDown();
        $(this).children("i").addClass("icon_uparrow");
    });


    $(".retrieve_list dd").hover(function() {
        $(this).children("a").show();
    }, function() {
        $(this).children("a").hide();
    });

    $(".search_type").hover(function() {
        $(this).children("ul").stop(true, false).slideDown();
    }, function() {
        $(this).children("ul").stop(true, false).slideUp();
    });

    $(".search_type ul li").click(function() {
        $(".search_type label b").text($(this).text());
        $(this).parent("ul").stop(true, false).slideUp();
    });

    $(".search_text input[type='text']").focus(function() {
        if (this.defaultValue == this.value) {
            this.value = "";
        }
    }).blur(function() {
        if ("" == this.value) {
            this.value = this.defaultValue;
        }
    });

    $(".select_list input[type='text']").focus(function() {
        $(this).addClass("focus");
    }).blur(function() {
        $(this).removeClass("focus");
    });


    //目标排查--条件筛选
    var curHeight = height = $(".screening_list").height();
    $(".screening_list").height("38px")
    $(".more_btn a").click(function() {
        if ("检索条件展开" == $(this).children("b").text()) {
            $(".screening_list").animate({
                height: curHeight
            }, "slow");
            $(this).children("b").text("检索条件收起")
        } else if ("检索条件收起" == $(this).children("b").text()) {
            $(".screening_list").animate({
                height: "38px"
            }, "slow");
            $(this).children("b").text("检索条件展开")
        }
    });

    $("#create_time").click(function() {
        $(this).hide();
        $(".create_time").show();
    });

    $("#file_type").click(function() {
        $(this).hide();
        $(".file_type").show();
    });
    $(".create_time a").click(function() {
        $(this).addClass("current").siblings("a").removeClass("current");
        $("#create_time").children("b").text($(this).text());
        $("#create_time").show();
        $(this).parent("p").hide();
    });

    $(".file_type a").click(function() {
        $(this).addClass("current").siblings("a").removeClass("current");
        $("#file_type").children("b").text($(this).text());
        $("#file_type").show();
        $(this).parent("p").hide();
    });


    //提前将视图分析的模板加载进来，防止刚进去视频播放找不到dom
    videoAnaly = new videoAnalyst();


    // type 用来指定页面加载后显示的是 图像处理 或 视图分析 ，1：图像处理，2：视图分析
    // 如果type不存在 查看当前选中的 二级导航
    // 如果type还不存在 默认选中图像处理
    var urlParams = Toolkit.paramOfUrl(),
        type = ("type" in urlParams) ? parseInt(urlParams["type"]) : 1;

    // 关闭在 menu.js中给二级导航绑定的事件(防止页面死循环)，重新绑定图像研判部分的事件处理
    jQuery(parent.document).find('#header').find('.nav>a[data-id=7],a[data-id=8]').addClass("navdisabled");
    jQuery(parent.document).find('#header').find(".nav>a[data-id=7],a[data-id=8]").on("click", function(e) {
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

    }).filter("[data-id=" + (type == 1 ? 7 : 8) + "]").trigger("click");

    // 如果资源列表为空，闪烁导入资源按钮
    //    if (window.importTool && importTool.resourceTree) {
    //        importTool.resourceTree.addEvent("dataLoaded", function (data) {
    //            if (data && data.length > 0) {
    //                $("#importRs").colors("stop");
    //            } else {
    //                $("#importRs").colors("start");
    //            }
    //        });
    //    }

    // 关闭上传面板后 刷新资源列表
    resourceImportPanel.addEvent("close", function() {
        jQuery(".droppanel").hide();
        var flagResour = jQuery("#resourceTreePanel ul li.active").attr("data-id");
        importTool.resourceTree.storeData = flagResour;
        importTool.resourceTree.reload();
    });
})
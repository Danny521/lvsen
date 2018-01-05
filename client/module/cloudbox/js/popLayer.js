/**
 *
 * @authors lrxia (lrxia@netposa.com)
 * @date    2015/6/16
 * @version $
 */

define(['ajaxModel', 'js/assist-controller.js', 'js/ajax-module.js', 'js/details-interaction.js', 'js/cloud-module-skip.js', 'js/publicEvent.js', 'base.self'], function(ajaxModel, ASSIST_CONTROLLER, AJAXMODULE, DETAILSINTERACTION, MODULESKIP) {
    var popLayer = {
        isEventInit: false,
        bgWrap: jQuery('.bg-wrap'),
        renderPicDetails: function(callback, dContext) {
            var _t = this;
            if (dContext) {
                SCOPE.dContext = dContext
            }
            var html = Handlebars.compile(AJAXMODULE.tpl['d-pic'])(SCOPE.dContext);
            _t.bgWrap.find('.inner-wrap').html(html);
            _t.bgWrap.find('.big-pic').hide().attr('src', SCOPE.context.thumbnail); //先隐藏
            _t.bgWrap.find(".bg-content").attr({
                "data-fileType": SCOPE.context.fileType,
                "data-index": SCOPE.curListIndex,
                "data-id": SCOPE.theId,
                "data-structureName": $(".content .overview .list-content dd").filter("[data-index='" + SCOPE.curListIndex + "']").find(".l-name a").attr("data-filename")
            });
            callback && callback(); //callback中的refreshTransform方法里显示图片 by zhangxinyu on 2015-10-23
        },
        renderVideoDetails: function() {
            var _t = this;
            _t.bgWrap.find('.inner-wrap').html(Handlebars.compile(AJAXMODULE.tpl['d-video'])(SCOPE.dContext));
            _t.bgWrap.find(".bg-content").attr({
                "data-fileType": SCOPE.context.fileType,
                "data-index": SCOPE.curListIndex,
                "data-id": SCOPE.theId,
                "data-structureName": $(".content .overview .list-content dd").filter("[data-index='" + SCOPE.curListIndex + "']").find(".l-name a").attr("data-filename")
            })
        },
        renderStrucDetails: function() {
            var _t = this;
            _t.bgWrap.find('.inner-wrap').html(Handlebars.compile(AJAXMODULE.tpl['d-struc'])(SCOPE.dContext));
            _t.bgWrap.find('.big-pic').attr('src', SCOPE.context.markPath ? SCOPE.context.markPath : SCOPE.context.thumbnail);
            _t.bgWrap.find(".bg-content").attr({
                "data-fileType": SCOPE.context.fileType,
                "data-index": SCOPE.curListIndex,
                "data-id": SCOPE.theId,
                "data-structureName": $(".content .overview .list-content dd").filter("[data-index='" + SCOPE.curListIndex + "']").find(".l-name a").attr("data-filename")
            })
        },
        renderNoData: function() {
            var _t = this;
            _t.bgWrap.show().find('.inner-wrap').html('<div class="loading"></div>');
        },
        bindEvent: function() {
            var _t = this;
            jQuery(document).on('click', '.elel', _t.elelClick);
            jQuery(document).on('click', '.mark-by-hands', _t.markByHandsClick);
            jQuery(document).on("click", ".mark-by-auto", _t.markByAutoClick);
            jQuery(document).on('click', '.image-analysis', _t.imageAnalysisClick);
            _t.isEventInit = true;
        },
        elelClick: function() {
            var state = DETAILSINTERACTION.state;
            state.width = state._originWidth;
            state.height = state._originHeight;
            state.posX = ($(".pic-wrap").width() - state.width) / 2;
            state.posY = ($(".pic-wrap").height() - state.height) / 2;
            DETAILSINTERACTION.refreshTransform();
            $(".eyes").hide();
            $(".outline").css({
                "top": 0,
                "left": 0,
                "width": 235 + "px",
                "height": 175 + "px"
            })
        },
        markByHandsClick: function() {
            MODULESKIP.analysis(1);
            return false
        },
        markByAutoClick: function() {
            MODULESKIP.analysis();
        },
        imageAnalysisClick: function() {
            MODULESKIP.imagesjude();
        }
    };

    jQuery(function() {
        window.POPLAYER = popLayer;
    });
})
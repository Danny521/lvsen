/**
 *
 * @authors lrxia (lrxia@netposa.com)
 * @date    2015/7/8
 * @version $
 */
define(['ajaxModel','/module/popLayer/js/download.js','/module/popLayer/js/mplayer.js','/module/common/js/player2.js', 'handlebars','/module/popLayer/js/my-handlebar.js'], function (ajaxModule,downloadLocal,MPLAYER) {
    var SCOPE = {
        dContext:{},
        videoPlayParm:{},
        mPlayer:null,
        fromModule: "" //add by leon.z 加入判断是否来自实时结构化
    };
    var popVideoEvent ={
        init:function(){
            var _t =this;
            $(document).on('click', '.download',_t.downLoadClick);/*下载*/
            $(document).on('click', '.bg-close',_t.bgCloseClick);/*关闭弹框*/
            $(document).on('click','.s-bar',_t.sBarClick);
        },
        downLoadClick:function(e){
            var opt= {
                beginTime: (Toolkit.mills2datetime(SCOPE.dContext.beginTime)) + ".000",
                endTime: (Toolkit.mills2datetime(SCOPE.dContext.endTime)) + ".000",
                ip: MPLAYER.cameraData.ip,
                passwd: MPLAYER.cameraData.password,
                path: MPLAYER.cameraData.path,
                port: MPLAYER.cameraData.port,
                type: 2,
                user: MPLAYER.cameraData.username,
                vodType: MPLAYER.cameraData.videos[0][2]
            }
                downloadLocal(opt, SCOPE.dContext.fileName,SCOPE.mPlayer.player.playerObj);
          },
        bgCloseClick:function(){
            //隐藏导航,bug[37719], add by zhangyu, 2015.10.25
            (SCOPE.fromModule !== "structure") && window.top.showHideNav("show");
            $('.bg-wrap').fadeOut();
            //关闭弹出层时让视频停止播放
            $(".video-block .stop").trigger("click");
            //删除data-flag属性，避免关闭详情页时还提示“当前已经是第一个可查看资源”
            $(".bg-content").removeAttr("data-flag");
        },
        sBarClick:function(){
            var leftContent = $('.bg-content');
            var rightContent = $('.bg-sider');
            $(this).hasClass('active') ? $(this).removeClass('active') : $(this).addClass('active');
            if(leftContent.css('right') === '8px'){
                leftContent.css('right','258px');
                rightContent.css('right','0px');
            }else{
                leftContent.css('right','8px');
                rightContent.css('right','-250px');
            }
        }

    };
    var OnBeforeNavigate2=function(data){
        jQuery("#input-data").val(data);
        var html="<iframe id='OnBeforeNavigate2' etype='input' eid='input-data' src='about:blank' style='width:0px;height:0px;'></iframe>";
        if(jQuery("#OnBeforeNavigate2")[0]){
            jQuery("#OnBeforeNavigate2").remove();
        }
        jQuery(document.body).append(html);
    }
    var popVideo = {
        appendWarpHtml:function(){
            if(this.option.isPopBgWrap ||this.option.isPopBgWrap ===undefined){
                var warpHTML = '<div class="bg-wrap">' +
                    '<div class="bg-close"></div>' +
                    '<div class="inner-wrap"></div>' +
                    '</div>';
                if(!$('.bg-wrap')[0]){
                    $('body').append(warpHTML);
                };
                this.eleWarp = $('.bg-wrap').find('.inner-wrap');
            }else{
                this.eleWarp = this.option.popBgWarp;
            }
        },
        renderNoData:function(){
            //隐藏导航,bug[37719], add by zhangyu, 2015.10.25
            (SCOPE.fromModule !== "structure") && window.top.showHideNav("hide");
            $('.bg-wrap').show().find('.inner-wrap').html('<div class="loading"></div>');
        },
        init:function(option){
            var _t = this; 
            popVideoEvent.init();

            _t.init = function(option) {
                _t.option={
                    pop_tpl_url:option.pop_tpl_url,
                    videoData:option.videoData,
                    isPopBgWrap:option.isPopBgWrap,
                    popBgWarp:option.popBgWarp||'',
                    addPlayELe:option.addPlayELe||''
                };
                _t.eleWarp = null;
                SCOPE.videoPlayParm = _t.option.videoData.videoPlayParm;
                SCOPE.dContext = _t.option.videoData;
                SCOPE.dContext.addPlayELe = _t.option.addPlayELe;
                SCOPE.isPopBgWrap = _t.option.isPopBgWrap;
                SCOPE.fromModule = option.from; //add by leon.z 加入判断是否来自实时结构化
                _t.appendWarpHtml();
                _t.renderNoData()
                _t.getPopHtml();
            }
            _t.init(option);
        },
        getPopHtml:function(){
            var _t = this;
            jQuery.ajax({
                type: "get",
                url: _t.option.pop_tpl_url,
                success: function(html) {
                    _t.appendHtml(html)
                }
            });
        },
        appendHtml:function(html){
            var _t = this;

            _t.eleWarp.html(Handlebars.compile(html)(SCOPE.dContext));
            _t.eleWarp.find(".video-content").attr({
                "data-fileType":SCOPE.dContext.fileType,
                "data-index":SCOPE.dContext.curListIndex,
                "data-structureName":$(".content .overview .list-content dd").filter("[data-index='" + SCOPE.dContext.curListIndex + "']").find(".l-name a").attr("data-filename")
            });
            SCOPE.videoContent = _t.eleWarp.find(".video-content")[0];
            _t.makeUp()

        },
        makeUp:function(){
            var _t = this;
            var json = _t.option.videoData;
            if (json && json!= null) {
                if (json.sourceType + '' === '1') {
                    json.hasVideo = true;
                } else {
                    json.hasVideo = false;
                }
                _t.playCameras()
            } else {
                _t.renderNoData();
            }
        },
        playCameras: function() {
            /**
             * 初始化视频播放器，并播放
             * */

            if (SCOPE.mPlayer === null) {
                SCOPE.mPlayer = MPLAYER
            }

            var playParm = {
                begintime:SCOPE.dContext.beginTime,
                endtime:SCOPE.dContext.endTime,
                cameraId:SCOPE.dContext.cameraId
            };
            SCOPE.mPlayer.initPlayer(playParm)
        }
    };

   return popVideo
})